import * as THREE from 'three';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Projectile } from './projectile.js';
import { ParticleSystem } from './particles.js';
import { Input } from './input.js';

const canvasHolder = document.getElementById('canvas-holder');
const hudAmmoPips = document.querySelectorAll('#hud-ammo .pip');
const hudSuperBox = document.getElementById('hud-super');
const hudSuperFill = document.getElementById('hud-super-fill');
const menuOverlay = document.getElementById('menu-overlay');
const playBtn = document.getElementById('play-btn');

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
const input = new Input(renderer.domElement, camera, world.groundMesh);
const ps = new ParticleSystem(scene);

let player = new Player(ARENA_W / 2, ARENA_D / 2 + 4.4);
scene.add(player.root);

let projectiles = [];
let state = 'menu';
let shakeTimer = 0;

playBtn.addEventListener('click', () => {
  state = 'playing';
  menuOverlay.classList.add('hidden');
});

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r' && state === 'playing') resetArena();
});

function resetArena() {
  scene.remove(player.root);
  player = new Player(ARENA_W / 2, ARENA_D / 2 + 4.4);
  scene.add(player.root);
  for (const p of projectiles) p._removeFrom(scene);
  projectiles = [];
  world.reset();
}

function update(dt) {
  player.update(dt, input, world);

  if (input.firing && player.canFire()) {
    const shot = player.fire();
    projectiles.push(new Projectile(scene, shot.x, shot.y, shot.z, shot.angle, 13, 11, 1, false));
    ps.burst({ x: shot.x, y: shot.y, z: shot.z }, { count: 5, color: COLORS.playerBody, speed: 1.2, life: 0.14 });
  }

  if (input.consumeSuperPress() && player.canSuper()) {
    const baseAngle = player.aimAngle;
    const offsets = [-0.26, -0.13, 0, 0.13, 0.26];
    for (const off of offsets) {
      const a = baseAngle + off;
      const tip = player.gunPivot.localToWorld(new THREE.Vector3(0, 0, 1.02));
      projectiles.push(new Projectile(scene, tip.x, tip.y, tip.z, a, 15, 12, 3, true));
    }
    player.useSuper();
    ps.burst({ x: player.x, y: 0.6, z: player.z }, { count: 26, color: COLORS.gold, speed: 3.6, life: 0.55 });
    shakeTimer = 0.25;
  }

  for (const p of projectiles) p.update(dt, world, ps, player);
  projectiles = projectiles.filter(p => !p.dead);

  world.update(dt);
  ps.update(dt);

  if (shakeTimer > 0) shakeTimer -= dt;

  hudAmmoPips.forEach((el, i) => el.classList.toggle('filled', i < player.ammo));
  hudSuperFill.style.width = player.superCharge + '%';
  hudSuperBox.classList.toggle('is-ready', player.superCharge >= player.superMax);
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
