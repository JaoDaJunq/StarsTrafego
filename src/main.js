import * as THREE from 'three';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { RemotePlayer } from './remotePlayer.js';
import { Projectile } from './projectile.js';
import { ParticleSystem } from './particles.js';
import { Input } from './input.js';
import { Room, randomPin } from './network.js';

const canvasHolder = document.getElementById('canvas-holder');
const hudAmmoPips = document.querySelectorAll('#hud-ammo .pip');
const hudSuperBox = document.getElementById('hud-super');
const hudSuperFill = document.getElementById('hud-super-fill');
const hudPin = document.getElementById('hud-pin');
const hudRosterCount = document.getElementById('hud-roster-count');
const menuOverlay = document.getElementById('menu-overlay');
const nameInput = document.getElementById('name-input');
const pinInput = document.getElementById('pin-input');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const roomStatus = document.getElementById('room-status');
const nameTagsContainer = document.getElementById('name-tags');

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.fog, 26, 46);

const target = new THREE.Vector3(ARENA_W / 2, 0, ARENA_D / 2);
const ELEV = THREE.MathUtils.degToRad(55);
const AZ = THREE.MathUtils.degToRad(28);
const DIST = 22;

const VIEW_SIZE = 8.6;
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.set(
  target.x + DIST * Math.cos(ELEV) * Math.sin(AZ),
  DIST * Math.sin(ELEV),
  target.z + DIST * Math.cos(ELEV) * Math.cos(AZ)
);
camera.lookAt(target);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
canvasHolder.appendChild(renderer.domElement);

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  camera.left = -VIEW_SIZE * aspect;
  camera.right = VIEW_SIZE * aspect;
  camera.top = VIEW_SIZE;
  camera.bottom = -VIEW_SIZE;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
}
window.addEventListener('resize', resize);
resize();

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
sun.position.set(target.x + 10, 18, target.z + 6);
sun.target.position.copy(target);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 46;
sun.shadow.bias = -0.0015;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xbcdcff, 0.3);
fill.position.set(target.x - 10, 8, target.z - 8);
scene.add(fill);

const world = buildWorld(scene);
world.scene = scene;
const input = new Input(renderer.domElement, camera, world.groundMesh);
const ps = new ParticleSystem(scene);

const room = new Room();
const remotePlayers = new Map();
const nameTagPool = new Map();

let player = null;
let projectiles = [];
let state = 'menu';
let shakeTimer = 0;
let netSendTimer = 0;
const NET_SEND_INTERVAL = 0.09;

function setStatus(msg, kind) {
  roomStatus.textContent = msg;
  roomStatus.className = 'room-status' + (kind ? ' is-' + kind : '');
}

function spawnPointFor(slot) {
  const angle = (slot / 8) * Math.PI * 2;
  return {
    x: ARENA_W / 2 + Math.cos(angle) * 3.4,
    z: ARENA_D / 2 + Math.sin(angle) * 3.4
  };
}

let started = false;

function startGame() {
  const sp = spawnPointFor(room.mySlot);
  player = new Player(sp.x, sp.z, room.mySlot);
  scene.add(player.root);
  state = 'playing';
}

room.onRosterChange = (entries, myId) => {
  const seen = new Set();
  entries.forEach(e => {
    seen.add(e.id);
    if (e.id === myId) return;
    if (!remotePlayers.has(e.id)) {
      const rp = new RemotePlayer(e.id, e.name, e.slot);
      scene.add(rp.root);
      remotePlayers.set(e.id, rp);
    } else {
      remotePlayers.get(e.id).name = e.name;
    }
  });
  for (const [id, rp] of Array.from(remotePlayers.entries())) {
    if (!seen.has(id)) {
      rp.dispose(scene);
      remotePlayers.delete(id);
      removeNameTag(id);
    }
  }
  hudRosterCount.textContent = entries.length + (entries.length === 1 ? ' jogador' : ' jogadores');

  if (!started) {
    started = true;
    startGame();
    menuOverlay.classList.add('hidden');
  }
};

room.onPeerState = payload => {
  const rp = remotePlayers.get(payload.id);
  if (rp) rp.applyNetState(payload);
};

room.onPeerFire = payload => {
  projectiles.push(new Projectile(
    scene, payload.x, payload.y, payload.z, payload.angle,
    payload.big ? 15 : 13, payload.big ? 12 : 11, 0, payload.big, true
  ));
  ps.burst({ x: payload.x, y: payload.y, z: payload.z }, {
    count: payload.big ? 16 : 5,
    color: payload.big ? COLORS.gold : COLORS.playerBody,
    speed: payload.big ? 3 : 1.2,
    life: payload.big ? 0.4 : 0.14
  });
};

async function attemptJoin() {
  const pin = pinInput.value.trim();
  if (!pin) {
    setStatus('Digita um PIN ou clica em Criar Sala.', 'error');
    return;
  }
  const name = nameInput.value.trim() || 'Jogador';
  createBtn.disabled = true;
  joinBtn.disabled = true;
  setStatus('Conectando...', null);
  try {
    await room.join(pin, name);
    setStatus('Conectado!', 'ok');
    hudPin.textContent = pin;
  } catch (err) {
    setStatus('Não consegui conectar. Confere sua internet e tenta de novo.', 'error');
    createBtn.disabled = false;
    joinBtn.disabled = false;
  }
}

createBtn.addEventListener('click', () => {
  pinInput.value = randomPin();
  attemptJoin();
});
joinBtn.addEventListener('click', () => attemptJoin());
pinInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptJoin();
});
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') attemptJoin();
});

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r' && state === 'playing') resetArena();
});

function resetArena() {
  const sp = spawnPointFor(room.mySlot);
  scene.remove(player.root);
  player = new Player(sp.x, sp.z, room.mySlot);
  scene.add(player.root);
  for (const p of projectiles) p._removeFrom(scene);
  projectiles = [];
  world.reset();
}

function ensureNameTag(id, text) {
  let el = nameTagPool.get(id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'name-tag';
    nameTagsContainer.appendChild(el);
    nameTagPool.set(id, el);
  }
  el.textContent = text;
  return el;
}

function removeNameTag(id) {
  const el = nameTagPool.get(id);
  if (el) {
    el.remove();
    nameTagPool.delete(id);
  }
}

function positionTag(el, x, z) {
  const p = new THREE.Vector3(x, 1.3, z);
  p.project(camera);
  el.style.left = ((p.x * 0.5 + 0.5) * window.innerWidth) + 'px';
  el.style.top = ((-p.y * 0.5 + 0.5) * window.innerHeight) + 'px';
}

function updateNameTags() {
  if (player) positionTag(ensureNameTag('__me', room.myName), player.x, player.z);
  for (const [id, rp] of remotePlayers) {
    positionTag(ensureNameTag(id, rp.name), rp.x, rp.z);
  }
}

function update(dt) {
  player.update(dt, input, world);

  if (input.firing && player.canFire()) {
    const shot = player.fire();
    projectiles.push(new Projectile(scene, shot.x, shot.y, shot.z, shot.angle, 13, 11, 1, false, false));
    ps.burst({ x: shot.x, y: shot.y, z: shot.z }, { count: 5, color: COLORS.playerBody, speed: 1.2, life: 0.14 });
    room.sendFire({ x: shot.x, y: shot.y, z: shot.z, angle: shot.angle, big: false });
  }

  if (input.consumeSuperPress() && player.canSuper()) {
    const baseAngle = player.aimAngle;
    const offsets = [-0.26, -0.13, 0, 0.13, 0.26];
    for (const off of offsets) {
      const a = baseAngle + off;
      const tip = player.gunPivot.localToWorld(new THREE.Vector3(0, 0, 1.02));
      projectiles.push(new Projectile(scene, tip.x, tip.y, tip.z, a, 15, 12, 3, true, false));
      room.sendFire({ x: tip.x, y: tip.y, z: tip.z, angle: a, big: true });
    }
    player.useSuper();
    ps.burst({ x: player.x, y: 0.6, z: player.z }, { count: 26, color: COLORS.gold, speed: 3.6, life: 0.55 });
    shakeTimer = 0.25;
  }

  for (const p of projectiles) p.update(dt, world, ps, player);
  projectiles = projectiles.filter(p => !p.dead);

  world.update(dt);
  ps.update(dt);

  for (const rp of remotePlayers.values()) rp.update(dt);

  netSendTimer += dt;
  if (netSendTimer >= NET_SEND_INTERVAL) {
    netSendTimer = 0;
    room.sendState(player.netState());
  }

  if (shakeTimer > 0) shakeTimer -= dt;

  hudAmmoPips.forEach((el, i) => el.classList.toggle('filled', i < player.ammo));
  hudSuperFill.style.width = player.superCharge + '%';
  hudSuperBox.classList.toggle('is-ready', player.superCharge >= player.superMax);

  updateNameTags();
}

let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 30);

  if (state === 'playing') update(dt);

  const shakeOffset = shakeTimer > 0
    ? new THREE.Vector3((Math.random() - 0.5) * shakeTimer * 0.5, (Math.random() - 0.5) * shakeTimer * 0.5, 0)
    : null;

  if (shakeOffset) {
    camera.position.x += shakeOffset.x * 0.02;
    camera.position.y += shakeOffset.y * 0.02;
  }

  renderer.render(scene, camera);

  if (shakeOffset) {
    camera.position.set(
      target.x + DIST * Math.cos(ELEV) * Math.sin(AZ),
      DIST * Math.sin(ELEV),
      target.z + DIST * Math.cos(ELEV) * Math.cos(AZ)
    );
  }

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('beforeunload', () => room.leave());
