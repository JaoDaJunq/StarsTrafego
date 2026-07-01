import * as THREE from 'three';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { RemotePlayer } from './remotePlayer.js';
import { Projectile } from './projectile.js';
import { ParticleSystem } from './particles.js';
import { Input } from './input.js';
import { Room, randomPin } from './network.js';
import { BRAWLERS, DEFAULT_BRAWLER_ID, getBrawler } from './brawlers.js';
import { ConeSlash, ImpactArea, ChainTrap, DashAttack, LeapAttack, HealTurret } from './attackEffects.js';
import { clamp } from './utils.js';

const canvasHolder = document.getElementById('canvas-holder');
const hudAmmoPips = document.querySelectorAll('#hud-ammo .pip');
const hudSuperBox = document.getElementById('hud-super');
const hudSuperFill = document.getElementById('hud-super-fill');
const hudPin = document.getElementById('hud-pin');
const hudRosterCount = document.getElementById('hud-roster-count');
const hudBrawler = document.getElementById('hud-brawler');
const hudHealthFill = document.getElementById('hud-health-fill');
const hudHealthText = document.getElementById('hud-health-text');
const menuOverlay = document.getElementById('menu-overlay');
const nameInput = document.getElementById('name-input');
const pinInput = document.getElementById('pin-input');
const createBtn = document.getElementById('create-btn');
const joinBtn = document.getElementById('join-btn');
const roomStatus = document.getElementById('room-status');
const nameTagsContainer = document.getElementById('name-tags');
const brawlerGrid = document.getElementById('brawler-grid');
const brawlerSummary = document.getElementById('brawler-summary');

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.fog, 26, 46);

const target = new THREE.Vector3(ARENA_W / 2, 0, ARENA_D / 2);
const ELEV = THREE.MathUtils.degToRad(55);
const AZ = THREE.MathUtils.degToRad(28);
const DIST = 30;

const VIEW_SIZE = 13.2;
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
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 24;
sun.shadow.camera.bottom = -24;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0015;
scene.add(sun);
scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xbcdcff, 0.3);
fill.position.set(target.x - 10, 8, target.z - 8);
scene.add(fill);

const world = buildWorld(scene);
world.scene = scene;
world.onCrateChange = (crate, point, result) => {
  room.sendWorld({
    type: 'crate_state',
    id: crate.id,
    hp: crate.hp,
    alive: crate.alive,
    respawnTimer: crate.respawnTimer,
    destroyed: !!result?.destroyed,
    hitX: point?.x ?? crate.bounds.x,
    hitY: point?.y ?? 0.45,
    hitZ: point?.z ?? crate.bounds.z
  });
};
const input = new Input(renderer.domElement, camera, world.groundMesh);
const ps = new ParticleSystem(scene);

const room = new Room();
const remotePlayers = new Map();
const nameTagPool = new Map();

let selectedBrawlerId = DEFAULT_BRAWLER_ID;
let player = null;
let projectiles = [];
let effects = [];
const previewGroup = new THREE.Group();
previewGroup.visible = false;
scene.add(previewGroup);
let state = 'menu';
let shakeTimer = 0;
let netSendTimer = 0;
let started = false;
const NET_SEND_INTERVAL = 0.09;

function setStatus(msg, kind) {
  roomStatus.textContent = msg;
  roomStatus.className = 'room-status' + (kind ? ' is-' + kind : '');
}

function hexColor(value) {
  return '#' + value.toString(16).padStart(6, '0');
}

function renderBrawlerCards() {
  brawlerGrid.innerHTML = '';
  for (const b of BRAWLERS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'brawler-card' + (b.id === selectedBrawlerId ? ' is-selected' : '');
    btn.dataset.brawlerId = b.id;
    btn.innerHTML = `
      <span class="brawler-portrait-wrap" style="background:linear-gradient(180deg, ${hexColor(b.accent)}, ${hexColor(b.color)})">
        <img class="brawler-portrait" src="${b.portrait}" alt="${b.name}">
      </span>
      <strong>${b.name}</strong>
      <small>${b.title}</small>
      <em>${b.hp} HP</em>
    `;
    btn.addEventListener('click', () => selectBrawler(b.id));
    brawlerGrid.appendChild(btn);
  }
  updateBrawlerSummary();
}

function selectBrawler(id) {
  selectedBrawlerId = id;
  for (const card of brawlerGrid.querySelectorAll('.brawler-card')) {
    card.classList.toggle('is-selected', card.dataset.brawlerId === id);
  }
  updateBrawlerSummary();
}

function updateBrawlerSummary() {
  const b = getBrawler(selectedBrawlerId);
  brawlerSummary.textContent = `${b.name}: ${b.attack} · Super: ${b.super} · Vida ${b.hp}`;
}
renderBrawlerCards();

function spawnPointFor(slot) {
  const points = [
    { x: 2.0, z: 2.0 },
    { x: ARENA_W - 2.0, z: ARENA_D - 2.0 },
    { x: ARENA_W - 2.0, z: 2.0 },
    { x: 2.0, z: ARENA_D - 2.0 },
    { x: ARENA_W / 2, z: 2.0 },
    { x: ARENA_W / 2, z: ARENA_D - 2.0 },
    { x: 2.0, z: ARENA_D / 2 },
    { x: ARENA_W - 2.0, z: ARENA_D / 2 }
  ];
  return points[slot % points.length];
}

function aimTarget(maxRange) {
  const dx = input.aimX - player.x;
  const dz = input.aimZ - player.z;
  const dist = Math.hypot(dx, dz) || 1;
  const limited = Math.min(dist, maxRange);
  return {
    x: clamp(player.x + (dx / dist) * limited, 0.6, ARENA_W - 0.6),
    z: clamp(player.z + (dz / dist) * limited, 0.6, ARENA_D - 0.6)
  };
}

function clearPreview() {
  while (previewGroup.children.length) {
    const child = previewGroup.children.pop();
    child.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}

function previewMaterial(color, opacity = 0.25) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
}

function addCirclePreview(x, z, radius, color, opacity = 0.24) {
  const geo = new THREE.CircleGeometry(radius, 48);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, opacity));
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.035, z);
  previewGroup.add(mesh);

  const ring = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(x + Math.cos(a) * radius, 0.052, z + Math.sin(a) * radius);
    })),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 })
  );
  previewGroup.add(ring);
}

function addConePreview(x, z, angle, range, arc, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 32;
  for (let i = 0; i <= steps; i++) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * range, -Math.cos(a) * range);
  }
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, 0.22));
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = -angle;
  mesh.position.set(x, 0.04, z);
  previewGroup.add(mesh);
}

function addLinePreview(x, z, angle, range, width, color) {
  const geo = new THREE.BoxGeometry(width, 0.02, range);
  const mesh = new THREE.Mesh(geo, previewMaterial(color, 0.23));
  mesh.position.set(
    x + Math.sin(angle) * range * 0.5,
    0.045,
    z + Math.cos(angle) * range * 0.5
  );
  mesh.rotation.y = angle;
  previewGroup.add(mesh);
}

function showAttackPreview(mode = 'basic') {
  if (!player || !input.keys.has('shift')) {
    previewGroup.visible = false;
    clearPreview();
    return;
  }

  clearPreview();
  previewGroup.visible = true;
  const b = player.brawler;
  const angle = player.aimAngle;
  const x = player.x;
  const z = player.z;
  const color = b.accent;

  if (mode === 'super') {
    if (b.id === 'joao') {
      const t = aimTarget(9.4);
      addCirclePreview(t.x, t.z, 1.15, color, 0.3);
    } else if (b.id === 'luan') {
      addLinePreview(x, z, angle, 3.4, 1.9, color);
      addCirclePreview(x + Math.sin(angle) * 3.4, z + Math.cos(angle) * 3.4, 0.95, color, 0.18);
    } else if (b.id === 'djonga') {
      const t = aimTarget(5.8);
      addCirclePreview(t.x, t.z, 1.35, color, 0.28);
    } else if (b.id === 'thomas') {
      addCirclePreview(x, z, 2.2, color, 0.2);
    } else if (b.id === 'gui') {
      addLinePreview(x, z, angle, 11.5, 0.9, color);
    } else if (b.id === 'lorenzo') {
      const t = aimTarget(5.4);
      addCirclePreview(t.x, t.z, 1.45, color, 0.24);
      addCirclePreview(t.x, t.z, 3.2, color, 0.1);
    } else if (b.id === 'ministro') {
      const t = aimTarget(8.8);
      addCirclePreview(t.x, t.z, 1.35, color, 0.28);
    }
    return;
  }

  if (b.id === 'joao') addLinePreview(x, z, angle, 8.2, 0.55, color);
  else if (b.id === 'luan') addConePreview(x, z, angle, 1.85, 1.25, color);
  else if (b.id === 'djonga') addConePreview(x, z, angle, 1.35, 0.95, color);
  else if (b.id === 'thomas') addConePreview(x, z, angle, 8.5, 0.58, color);
  else if (b.id === 'gui') {
    addLinePreview(x, z, angle, 6.4, 0.75, color);
    const splitX = x + Math.sin(angle) * 6.4;
    const splitZ = z + Math.cos(angle) * 6.4;
    addConePreview(splitX, splitZ, angle, 4.8, 0.92, color);
  } else if (b.id === 'lorenzo') addConePreview(x, z, angle, 7.8, 1.25, color);
  else if (b.id === 'ministro') addLinePreview(x, z, angle, 12.5, 0.5, color);
}

function pointSegmentDistance(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lenSq = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
  const x = ax + dx * t;
  const z = az + dz * t;
  return Math.hypot(px - x, pz - z);
}

function broadcastHealth(reason = 'state') {
  if (!player) return;
  room.sendCombat({
    type: 'health',
    targetId: room.myId,
    hp: player.hp,
    hpMax: player.hpMax,
    down: player.isDown,
    brawlerId: player.brawlerId,
    reason
  });
}

function applyIncomingDamage(amount, point, event = {}) {
  if (!player || player.isDown) return;

  if (event.pull && event.pullToX !== undefined && event.pullToZ !== undefined) {
    const dx = event.pullToX - player.x;
    const dz = event.pullToZ - player.z;
    const len = Math.hypot(dx, dz) || 1;
    const pullDist = Math.min(len, event.pullDistance || 2.8);
    player.tryMove(player.x + (dx / len) * pullDist, player.z + (dz / len) * pullDist, world);
    player.root(0.45);
  }

  const rootTime = event.kind === 'chain' ? 1.35 : 0;
  const result = player.takeDamage(amount || 0, { root: rootTime });
  if (!result.changed) return;

  ps.burst({ x: point.x, y: point.y || 0.55, z: point.z }, {
    count: result.downed ? 28 : 12,
    color: result.downed ? COLORS.crimson : (event.color || COLORS.gold),
    speed: result.downed ? 4 : 2.6,
    life: result.downed ? 0.7 : 0.38,
    cube: result.downed
  });
  shakeTimer = Math.max(shakeTimer, result.downed ? 0.26 : 0.1);
  broadcastHealth(result.downed ? 'downed' : 'damage');
}

function incomingEffectOpts(event, ghost) {
  if (!ghost) return { ghost: false, delay: event.delay || 0 };
  return {
    ghost: true,
    delay: event.delay || 0,
    targetPlayer: player,
    onHitPlayer: (damage, point) => applyIncomingDamage(damage, point, event)
  };
}

function applyIncomingDash(event) {
  if (!player || player.isDown) return;
  const sx = event.x;
  const sz = event.z;
  const ex = sx + Math.sin(event.angle) * (event.distance || 3.2);
  const ez = sz + Math.cos(event.angle) * (event.distance || 3.2);
  const dist = pointSegmentDistance(player.x, player.z, sx, sz, ex, ez);
  if (dist <= (event.radius || 0.9) + player.radius * 0.72) {
    applyIncomingDamage(event.damage || 0, { x: player.x, y: 0.55, z: player.z }, event);
  }
}

function startGame() {
  const sp = spawnPointFor(room.mySlot);
  player = new Player(sp.x, sp.z, room.myBrawlerId || selectedBrawlerId, room.mySlot);
  scene.add(player.root);
  state = 'playing';
  menuOverlay.classList.add('hidden');
  updateHudStatic();
}

function updateHudStatic() {
  if (!player) return;
  hudBrawler.textContent = `${player.brawler.name} · ${player.brawler.title}`;
}

function findDuplicateBrawler(entries, myId) {
  const me = entries.find(e => e.id === myId);
  if (!me) return null;
  return entries.find(e => e.id !== myId && e.brawlerId === me.brawlerId);
}

room.onRosterChange = (entries, myId) => {
  const duplicate = !started ? findDuplicateBrawler(entries, myId) : null;
  if (duplicate) {
    setStatus(`${getBrawler(room.myBrawlerId).name} já está escolhido nessa sala. Troca o brawler ou usa outro PIN.`, 'error');
    room.leave();
    createBtn.disabled = false;
    joinBtn.disabled = false;
    return;
  }

  const seen = new Set();
  entries.forEach(e => {
    seen.add(e.id);
    if (e.id === myId) return;
    if (!remotePlayers.has(e.id)) {
      const rp = new RemotePlayer(e.id, e.name, e.brawlerId, e.slot);
      scene.add(rp.root);
      remotePlayers.set(e.id, rp);
    } else {
      const rp = remotePlayers.get(e.id);
      rp.name = e.name;
      rp.setBrawler(e.brawlerId, scene);
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
  }
};

room.onPeerState = payload => {
  const rp = remotePlayers.get(payload.id);
  if (rp) rp.applyNetState(payload);
};

room.onPeerFire = payload => {
  spawnAttackFromNetwork(payload);
};

room.onWorldEvent = payload => {
  if (payload.type === 'crate_state') {
    world.applyCrateState(payload, ps);
  } else if (payload.type === 'world_reset') {
    world.reset();
  }
};

room.onCombatEvent = payload => {
  if (payload.type === 'health') {
    const rp = remotePlayers.get(payload.targetId || payload.id);
    if (rp) rp.applyHealth(payload.hp, payload.down);
  }
};

function addProjectile(data, ghost = false) {
  projectiles.push(new Projectile(
    scene,
    data.x,
    data.y === undefined ? 0.55 : data.y,
    data.z,
    data.angle,
    data.speed,
    data.range,
    data.damage,
    !!data.big,
    ghost,
    {
      color: data.color,
      size: data.size,
      glowSize: data.glowSize,
      pierce: data.pierce,
      superGain: data.superGain,
      damageNear: data.damageNear,
      damageFar: data.damageFar,
      targetPlayer: ghost ? player : null,
      onHitPlayer: ghost ? ((damage, point) => applyIncomingDamage(damage, point, data)) : null,
      onExpire: (!ghost && data.split) ? ((point) => {
        const b = getBrawler(data.brawlerId);
        for (const off of [-0.46, -0.28, -0.12, 0.12, 0.28, 0.46]) {
          fireEvent({
            kind: 'projectile',
            brawlerId: data.brawlerId,
            x: point.x,
            y: point.y,
            z: point.z,
            angle: data.angle + off,
            color: data.splitColor || b.accent,
            speed: data.splitSpeed || 12,
            range: data.splitRange || 4.8,
            damage: data.splitDamage || 4,
            size: data.splitSize || 0.06,
            glowSize: data.splitGlowSize || 0.14,
            superGain: data.splitSuperGain || 4
          });
        }
      }) : null
    }
  ));
}

function projectileAtTip(angle, brawler, params = {}) {
  const tip = player.gunTipWorld;
  return {
    kind: 'projectile',
    brawlerId: brawler.id,
    x: tip.x,
    y: tip.y,
    z: tip.z,
    angle,
    color: params.color ?? brawler.accent,
    speed: params.speed ?? 13,
    range: params.range ?? 8,
    damage: params.damage ?? brawler.damage,
    damageNear: params.damageNear,
    damageFar: params.damageFar,
    size: params.size ?? 0.1,
    glowSize: params.glowSize ?? 0.2,
    big: !!params.big,
    pierce: !!params.pierce,
    superGain: params.superGain,
    pull: !!params.pull,
    pullToX: params.pullToX,
    pullToZ: params.pullToZ,
    pullDistance: params.pullDistance,
    split: !!params.split,
    splitDamage: params.splitDamage,
    splitRange: params.splitRange,
    splitSpeed: params.splitSpeed,
    splitColor: params.splitColor,
    splitSize: params.splitSize,
    splitGlowSize: params.splitGlowSize,
    splitSuperGain: params.splitSuperGain,
    delay: params.delay || 0
  };
}

function fireEvent(event, local = true) {
  if (event.delay && event.delay > 0) {
    const delayed = { ...event, delay: 0 };
    window.setTimeout(() => fireEvent(delayed, local), event.delay * 1000);
    return;
  }
  if (local) room.sendFire(event);
  spawnAttack(event, !local);
}

function spawnAttackFromNetwork(event) {
  spawnAttack(event, true);
}

function spawnAttack(event, ghost = false) {
  if (event.delay && event.delay > 0) {
    const delayed = { ...event, delay: 0 };
    window.setTimeout(() => spawnAttack(delayed, ghost), event.delay * 1000);
    return;
  }
  const b = getBrawler(event.brawlerId);

  if (event.kind === 'projectile') {
    addProjectile(event, ghost);
    ps.burst({ x: event.x, y: event.y || 0.55, z: event.z }, {
      count: event.big ? 14 : 5,
      color: event.color || b.accent,
      speed: event.big ? 2.8 : 1.2,
      life: event.big ? 0.35 : 0.14
    });
    return;
  }

  if (event.kind === 'cone') {
    effects.push(new ConeSlash(scene, event.x, event.z, event.angle, event.range, event.arc, event.damage, event.color || b.accent, incomingEffectOpts(event, ghost)));
    return;
  }

  if (event.kind === 'area') {
    effects.push(new ImpactArea(scene, event.x, event.z, event.radius, event.damage, event.color || b.accent, incomingEffectOpts(event, ghost)));
    return;
  }

  if (event.kind === 'chain') {
    effects.push(new ChainTrap(scene, event.x, event.z, event.radius, event.damage, event.color || b.accent, { ...incomingEffectOpts(event, ghost), chainColor: COLORS.outline }));
    return;
  }

  if (event.kind === 'dash' && player && !ghost) {
    effects.push(new DashAttack(scene, player, event.angle, event.color || b.accent, { damage: event.damage, distance: event.distance, radius: event.radius }));
    return;
  }

  if (event.kind === 'dash') {
    effects.push(new ImpactArea(scene, event.x, event.z, event.radius || 1, 0, event.color || b.accent, { ghost: true, life: 0.35 }));
    if (ghost) applyIncomingDash(event);
    return;
  }

  if (event.kind === 'leap' && player && !ghost) {
    effects.push(new LeapAttack(scene, player, event.x, event.z, event.color || b.accent, { damage: event.damage, radius: event.radius }));
    return;
  }

  if (event.kind === 'leap') {
    effects.push(new ImpactArea(scene, event.x, event.z, event.radius || 1.2, event.damage || 0, event.color || b.accent, { ...incomingEffectOpts(event, ghost), life: 0.6 }));
    return;
  }

  if (event.kind === 'turret') {
    effects.push(new HealTurret(scene, event.x, event.z, event.color || b.accent));
    return;
  }

  if (event.kind === 'stealth') {
    ps.burst({ x: event.x, y: 0.55, z: event.z }, { count: 22, color: event.color || b.accent, speed: 2.8, life: 0.5 });
  }
}

function launchBasic() {
  const b = player.brawler;
  const angle = player.aimAngle;
  const origin = { x: player.x, z: player.z };

  if (b.id === 'joao') {
    fireEvent(projectileAtTip(angle, b, { range: 8.2, damage: 25, speed: 13.2, color: 0x48b6ff, size: 0.12, glowSize: 0.28 }));
    return;
  }

  if (b.id === 'luan') {
    fireEvent({ kind: 'cone', brawlerId: b.id, x: origin.x, z: origin.z, angle, range: 1.85, arc: 1.25, damage: 15, color: b.accent });
    return;
  }

  if (b.id === 'djonga') {
    for (let i = 0; i < 3; i++) {
      fireEvent({ kind: 'cone', brawlerId: b.id, x: origin.x, z: origin.z, angle, range: 1.35, arc: 0.95, damage: 8, color: b.accent, delay: i * 0.09 });
    }
    return;
  }

  if (b.id === 'thomas') {
    // Leon-like: four blades in a narrow spread, stronger up close and weaker at max range.
    const offsets = [-0.26, -0.08, 0.08, 0.26];
    offsets.forEach((off, i) => {
      fireEvent(projectileAtTip(angle + off, b, {
        range: 8.5,
        damage: 6,
        damageNear: 9,
        damageFar: 3,
        speed: 14.5,
        color: b.accent,
        size: 0.075,
        glowSize: 0.16,
        delay: i * 0.025
      }));
    });
    return;
  }

  if (b.id === 'gui') {
    // Gene-like: one main orb; if it reaches max range without impact, it splits into 6 shards.
    fireEvent(projectileAtTip(angle, b, {
      range: 6.4,
      damage: 18,
      speed: 11.8,
      color: b.accent,
      size: 0.16,
      glowSize: 0.34,
      big: true,
      split: true,
      splitDamage: 4,
      splitRange: 4.8,
      splitSpeed: 12.2,
      splitColor: 0xff8de8,
      splitSize: 0.065,
      splitGlowSize: 0.14,
      splitSuperGain: 4
    }));
    return;
  }

  if (b.id === 'lorenzo') {
    // Pam-like: 9 scraps in a wide volley, sweeping left-to-right in two quick bursts.
    const volley = [-0.58, -0.38, -0.18, 0.02, 0.22, 0.42, 0.58, -0.48, 0.48];
    volley.forEach((off, i) => {
      fireEvent(projectileAtTip(angle + off, b, {
        range: 7.8,
        damage: 6,
        speed: 13.2,
        color: b.accent,
        size: 0.072,
        glowSize: 0.15,
        delay: i * 0.025
      }));
    });
    return;
  }

  if (b.id === 'ministro') {
    fireEvent(projectileAtTip(angle, b, { range: 12.5, damage: 30, speed: 13.2, color: b.accent, size: 0.095, glowSize: 0.2, pierce: true, superGain: 18 }));
  }
}

function launchSuper() {
  const b = player.brawler;
  const angle = player.aimAngle;

  if (b.id === 'joao') {
    const target = aimTarget(9.4);
    fireEvent({ kind: 'chain', brawlerId: b.id, x: target.x, z: target.z, radius: 1.15, damage: 25, color: b.accent });
    player.useSuper();
    shakeTimer = 0.18;
    return;
  }

  if (b.id === 'luan') {
    fireEvent({ kind: 'dash', brawlerId: b.id, x: player.x, z: player.z, angle, radius: 0.95, distance: 3.4, damage: 15, color: b.accent });
    player.useSuper();
    shakeTimer = 0.2;
    return;
  }

  if (b.id === 'djonga') {
    const target = aimTarget(5.8);
    fireEvent({ kind: 'leap', brawlerId: b.id, x: target.x, z: target.z, radius: 1.35, damage: 22, color: b.accent });
    player.useSuper();
    shakeTimer = 0.24;
    return;
  }

  if (b.id === 'thomas') {
    player.startStealth(4.2);
    fireEvent({ kind: 'stealth', brawlerId: b.id, x: player.x, z: player.z, color: b.accent });
    player.useSuper();
    return;
  }

  if (b.id === 'gui') {
    fireEvent(projectileAtTip(angle, b, { range: 11.5, damage: 8, speed: 15, color: b.accent, size: 0.22, glowSize: 0.45, big: true, pierce: true, pull: true, pullToX: player.x, pullToZ: player.z, pullDistance: 3.1 }));
    player.useSuper();
    shakeTimer = 0.12;
    return;
  }

  if (b.id === 'lorenzo') {
    const target = aimTarget(5.4);
    fireEvent({ kind: 'turret', brawlerId: b.id, x: target.x, z: target.z, color: b.accent });
    player.useSuper();
    return;
  }

  if (b.id === 'ministro') {
    const target = aimTarget(8.8);
    fireEvent({ kind: 'area', brawlerId: b.id, x: target.x, z: target.z, radius: 1.35, damage: 30, color: b.accent });
    player.useSuper();
    shakeTimer = 0.16;
  }
}

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
    await room.join(pin, name, selectedBrawlerId);
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
  player = new Player(sp.x, sp.z, room.myBrawlerId || selectedBrawlerId, room.mySlot);
  scene.add(player.root);
  for (const p of projectiles) p._removeFrom(scene);
  for (const fx of effects) if (fx.kill) fx.kill();
  projectiles = [];
  effects = [];
  world.reset();
  room.sendWorld({ type: 'world_reset' });
  updateHudStatic();
}

function ensureNameTag(id) {
  let el = nameTagPool.get(id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'name-tag';
    el.innerHTML = `
      <div class="name-tag-line"></div>
      <div class="name-tag-hp"><span></span></div>
    `;
    nameTagsContainer.appendChild(el);
    nameTagPool.set(id, el);
  }
  return el;
}

function updateNameTag(el, label, hp, hpMax, down) {
  const line = el.querySelector('.name-tag-line');
  const fill = el.querySelector('.name-tag-hp span');
  const ratio = hpMax > 0 ? Math.max(0, Math.min(1, hp / hpMax)) : 0;
  line.textContent = label;
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle('is-low', ratio <= 0.35);
  fill.classList.toggle('is-down', !!down);
  el.classList.toggle('is-down', !!down);
}

function removeNameTag(id) {
  const el = nameTagPool.get(id);
  if (el) {
    el.remove();
    nameTagPool.delete(id);
  }
}

function positionTag(el, x, z) {
  const p = new THREE.Vector3(x, 1.65, z);
  p.project(camera);
  el.style.left = ((p.x * 0.5 + 0.5) * window.innerWidth) + 'px';
  el.style.top = ((-p.y * 0.5 + 0.5) * window.innerHeight) + 'px';
}

function updateNameTags() {
  if (player) {
    const tag = ensureNameTag('__me');
    updateNameTag(tag, `${room.myName} · ${player.brawler.name} · ${Math.round(player.hp)}/${player.hpMax}${player.isDown ? ' · CAÍDO' : ''}`, player.hp, player.hpMax, player.isDown);
    positionTag(tag, player.x, player.z);
  }
  for (const [id, rp] of remotePlayers) {
    const tag = ensureNameTag(id);
    updateNameTag(tag, `${rp.name} · ${rp.brawler.name} · ${Math.round(rp.hp)}/${rp.hpMax}${rp.isDown ? ' · CAÍDO' : ''}`, rp.hp, rp.hpMax, rp.isDown);
    positionTag(tag, rp.x, rp.z);
  }
}

function update(dt) {
  player.update(dt, input, world);

  const shiftAiming = input.keys.has('shift');
  const superPressed = input.consumeSuperPress();

  if (input.firing && !shiftAiming && player.canFire()) {
    player.fire();
    launchBasic();
  }

  if (superPressed && !shiftAiming && player.canSuper()) {
    launchSuper();
    ps.burst({ x: player.x, y: 0.6, z: player.z }, { count: 22, color: player.brawler.accent, speed: 3.2, life: 0.5 });
  }

  showAttackPreview(shiftAiming && input.keys.has('q') ? 'super' : 'basic');

  for (const p of projectiles) p.update(dt, world, ps, player);
  projectiles = projectiles.filter(p => !p.dead);

  for (const fx of effects) fx.update(dt, world, ps, player);
  effects = effects.filter(fx => !fx.dead);

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
  hudHealthFill.style.width = `${Math.max(0, Math.min(100, (player.hp / player.hpMax) * 100))}%`;
  hudHealthText.textContent = `${Math.round(player.hp)} / ${player.hpMax}`;

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
