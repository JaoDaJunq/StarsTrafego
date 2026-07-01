import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { COLORS } from './constants.js';
import { getBrawler } from './brawlers.js';

export const BODY_HEIGHT = 0.76;
export const GUN_TIP_LOCAL = new THREE.Vector3(0, 0.08, 1.08);
export const PLAYER_RADIUS = 0.5;

const VISUALS = {
  joao: {
    bodyType: 'slim',
    skin: 0xd8aa8d,
    hair: 0x1b1717,
    hairStyle: 'messy',
    shirt: 0xf4f0ec,
    jacket: 0x7b2237,
    sleeve: 0xead8bf,
    pants: 0x171a22,
    shoe: 0xf3eee8,
    shoeAccent: 0x7b2237,
    glasses: true,
    facialHair: true,
    necklace: true,
    emblem: 0x4ab9ff,
    weapon: 'blueRose'
  },
  luan: {
    bodyType: 'athletic',
    skin: 0xd7a17f,
    hair: 0x181313,
    hairStyle: 'fade',
    shirt: 0x101115,
    jacket: 0x101115,
    sleeve: 0xd7a17f,
    pants: 0x111318,
    shoe: 0x15161b,
    shoeAccent: 0xb63232,
    facialHair: true,
    necklace: true,
    watch: true,
    beltChain: true,
    emblem: 0xd93732,
    weapon: 'emberSword'
  },
  djonga: {
    bodyType: 'fighter',
    skin: 0xc98761,
    hair: 0x201711,
    hairStyle: 'short',
    shirt: null,
    jacket: null,
    sleeve: 0xc98761,
    pants: 0x15151a,
    shoe: 0xc98761,
    shoeAccent: 0xd62d2d,
    facialHair: false,
    necklace: true,
    glove: true,
    wraps: true,
    emblem: 0xd62d2d,
    weapon: 'fists'
  },
  thomas: {
    bodyType: 'slim',
    skin: 0xe1b08e,
    hair: 0x9b7a56,
    hairLight: 0xd2bd9c,
    hairStyle: 'fringe',
    shirt: 0x0f2446,
    jacket: 0x0f2446,
    sleeve: 0xe1b08e,
    pants: 0x101724,
    shoe: 0x0d1a33,
    shoeAccent: 0x7ddcff,
    earring: true,
    necklace: true,
    emblem: 0x74d8ff,
    weapon: 'shadowBlades'
  },
  default: {
    bodyType: 'base',
    skin: 0xd7a17f,
    hair: 0x171717,
    hairStyle: 'cap',
    shirt: 0xffffff,
    jacket: 0x22e0c2,
    sleeve: 0xd7a17f,
    pants: 0x202736,
    shoe: 0x232936,
    shoeAccent: 0xffffff,
    facialHair: false,
    necklace: false,
    emblem: 0xf4b740,
    weapon: 'default'
  }
};

function visualFor(brawler) {
  return VISUALS[brawler.id] || {
    ...VISUALS.default,
    jacket: brawler.color,
    emblem: brawler.accent
  };
}

function addBox(group, size, pos, color, outline = 0.045, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), toonMaterial(color));
  mesh.position.copy(pos);
  if (opts.scale) mesh.scale.copy(opts.scale);
  if (opts.rotation) mesh.rotation.set(opts.rotation.x || 0, opts.rotation.y || 0, opts.rotation.z || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = !!opts.receiveShadow;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function addSphere(group, radius, pos, color, scale = new THREE.Vector3(1, 1, 1), outline = 0.045, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, opts.w || 16, opts.h || 10), toonMaterial(color));
  mesh.position.copy(pos);
  mesh.scale.copy(scale);
  if (opts.rotation) mesh.rotation.set(opts.rotation.x || 0, opts.rotation.y || 0, opts.rotation.z || 0);
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function addCylinder(group, radiusTop, radiusBottom, height, pos, color, outline = 0.04, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, opts.radial || 16), toonMaterial(color));
  mesh.position.copy(pos);
  if (opts.scale) mesh.scale.copy(opts.scale);
  if (opts.rotation) mesh.rotation.set(opts.rotation.x || 0, opts.rotation.y || 0, opts.rotation.z || 0);
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function addPlainBox(group, size, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), new THREE.MeshBasicMaterial({ color }));
  mesh.position.copy(pos);
  if (opts.rotation) mesh.rotation.set(opts.rotation.x || 0, opts.rotation.y || 0, opts.rotation.z || 0);
  group.add(mesh);
  return mesh;
}

function addPlainCircle(group, radius, pos, color, opts = {}) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, opts.segments || 14), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  mesh.position.copy(pos);
  if (opts.rotation) mesh.rotation.set(opts.rotation.x || 0, opts.rotation.y || 0, opts.rotation.z || 0);
  group.add(mesh);
  return mesh;
}

function addTorso(group, v) {
  const width = v.bodyType === 'fighter' ? 0.62 : v.bodyType === 'athletic' ? 0.58 : 0.5;
  const height = v.bodyType === 'fighter' ? 0.52 : 0.56;
  const depth = v.bodyType === 'fighter' ? 0.36 : 0.34;

  if (v.shirt === null) {
    addSphere(group, 0.34, new THREE.Vector3(0, 0.08, 0), v.skin, new THREE.Vector3(1.04, 1.1, 0.82), 0.052);
    addPlainBox(group, new THREE.Vector3(0.12, 0.02, 0.018), new THREE.Vector3(-0.12, 0.19, 0.28), 0x7b4d38);
    addPlainBox(group, new THREE.Vector3(0.12, 0.02, 0.018), new THREE.Vector3(0.12, 0.19, 0.28), 0x7b4d38);
    return;
  }

  addBox(group, new THREE.Vector3(width, height, depth), new THREE.Vector3(0, 0.05, 0), v.jacket, 0.055);
  addBox(group, new THREE.Vector3(width * 0.62, height * 0.72, depth + 0.035), new THREE.Vector3(0, 0.02, 0.04), v.shirt, 0.035);

  if (v.jacket !== v.shirt) {
    addBox(group, new THREE.Vector3(0.09, height * 0.78, depth + 0.055), new THREE.Vector3(-width * 0.33, 0.04, 0.055), v.jacket, 0.035);
    addBox(group, new THREE.Vector3(0.09, height * 0.78, depth + 0.055), new THREE.Vector3(width * 0.33, 0.04, 0.055), v.jacket, 0.035);
  }
}

function addHead(group, v) {
  addSphere(group, 0.27, new THREE.Vector3(0, 0.54, 0.02), v.skin, new THREE.Vector3(0.92, 1.05, 0.9), 0.052);
  addPlainCircle(group, 0.035, new THREE.Vector3(-0.085, 0.57, 0.255), 0x141414, { rotation: { y: Math.PI } });
  addPlainCircle(group, 0.035, new THREE.Vector3(0.085, 0.57, 0.255), 0x141414, { rotation: { y: Math.PI } });
  addPlainBox(group, new THREE.Vector3(0.09, 0.018, 0.012), new THREE.Vector3(0, 0.455, 0.264), v.facialHair ? 0x44251e : 0xb05f5f);

  if (v.facialHair) {
    addPlainBox(group, new THREE.Vector3(0.14, 0.022, 0.012), new THREE.Vector3(0, 0.515, 0.268), 0x2a1815);
    addPlainBox(group, new THREE.Vector3(0.08, 0.04, 0.012), new THREE.Vector3(0, 0.41, 0.266), 0x2a1815);
  }

  if (v.glasses) addGlasses(group);
  if (v.earring) addPlainCircle(group, 0.025, new THREE.Vector3(-0.245, 0.54, 0.06), 0xcfe7ff, { rotation: { y: Math.PI / 2 } });
}

function addGlasses(group) {
  const mat = 0x11151d;
  addPlainBox(group, new THREE.Vector3(0.11, 0.012, 0.014), new THREE.Vector3(-0.085, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.11, 0.012, 0.014), new THREE.Vector3(0.085, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.012, 0.065, 0.014), new THREE.Vector3(-0.14, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.012, 0.065, 0.014), new THREE.Vector3(-0.03, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.012, 0.065, 0.014), new THREE.Vector3(0.03, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.012, 0.065, 0.014), new THREE.Vector3(0.14, 0.575, 0.276), mat);
  addPlainBox(group, new THREE.Vector3(0.06, 0.012, 0.014), new THREE.Vector3(0, 0.575, 0.276), mat);
}

function addHair(group, v) {
  const c = v.hair;
  const light = v.hairLight || c;
  if (v.hairStyle === 'messy') {
    addSphere(group, 0.24, new THREE.Vector3(0, 0.76, 0.02), c, new THREE.Vector3(1.08, 0.48, 0.95), 0.04);
    const clumps = [
      [-0.16, 0.71, 0.16, 0.11], [-0.06, 0.75, 0.20, 0.13], [0.08, 0.73, 0.19, 0.12],
      [0.18, 0.68, 0.12, 0.1], [-0.18, 0.66, -0.02, 0.1], [0.16, 0.68, -0.04, 0.1]
    ];
    for (const [x, y, z, r] of clumps) addSphere(group, r, new THREE.Vector3(x, y, z), c, new THREE.Vector3(1.2, 0.7, 0.9), 0.035);
    return;
  }

  if (v.hairStyle === 'fade') {
    addSphere(group, 0.22, new THREE.Vector3(0, 0.73, 0.01), c, new THREE.Vector3(0.96, 0.42, 0.82), 0.035);
    addSphere(group, 0.12, new THREE.Vector3(-0.08, 0.73, 0.18), c, new THREE.Vector3(1.3, 0.55, 0.8), 0.032);
    addSphere(group, 0.11, new THREE.Vector3(0.07, 0.75, 0.17), c, new THREE.Vector3(1.35, 0.55, 0.8), 0.032);
    return;
  }

  if (v.hairStyle === 'fringe') {
    addSphere(group, 0.23, new THREE.Vector3(0, 0.73, 0), c, new THREE.Vector3(1, 0.42, 0.84), 0.035);
    addSphere(group, 0.13, new THREE.Vector3(-0.11, 0.69, 0.18), light, new THREE.Vector3(1.1, 0.55, 0.9), 0.03);
    addSphere(group, 0.12, new THREE.Vector3(0.02, 0.68, 0.2), light, new THREE.Vector3(1.25, 0.55, 0.9), 0.03);
    addSphere(group, 0.1, new THREE.Vector3(0.13, 0.69, 0.15), c, new THREE.Vector3(1.1, 0.55, 0.85), 0.03);
    return;
  }

  if (v.hairStyle === 'short') {
    addSphere(group, 0.22, new THREE.Vector3(0, 0.72, 0.01), c, new THREE.Vector3(0.95, 0.34, 0.78), 0.032);
    addSphere(group, 0.08, new THREE.Vector3(0.1, 0.73, 0.14), c, new THREE.Vector3(1.3, 0.55, 0.85), 0.028);
    return;
  }

  addSphere(group, 0.22, new THREE.Vector3(0, 0.72, 0.01), c, new THREE.Vector3(0.95, 0.36, 0.8), 0.035);
}

function addArms(group, v) {
  const armY = 0.1;
  const shoulderX = v.bodyType === 'fighter' ? 0.44 : 0.36;
  const armColor = v.shirt === null ? v.skin : v.sleeve;
  addBox(group, new THREE.Vector3(0.16, 0.46, 0.16), new THREE.Vector3(-shoulderX, armY, 0.03), armColor, 0.045, { rotation: { z: -0.15 } });
  addBox(group, new THREE.Vector3(0.16, 0.46, 0.16), new THREE.Vector3(shoulderX, armY, 0.03), armColor, 0.045, { rotation: { z: 0.15 } });
  const gloveColor = v.glove ? 0x111217 : v.skin;
  addSphere(group, 0.105, new THREE.Vector3(-shoulderX - 0.015, -0.18, 0.08), gloveColor, new THREE.Vector3(1, 0.85, 1), 0.035);
  addSphere(group, 0.105, new THREE.Vector3(shoulderX + 0.015, -0.18, 0.08), gloveColor, new THREE.Vector3(1, 0.85, 1), 0.035);

  if (v.wraps) {
    addPlainBox(group, new THREE.Vector3(0.18, 0.04, 0.17), new THREE.Vector3(-shoulderX - 0.015, -0.1, 0.105), 0xd32e2e);
    addPlainBox(group, new THREE.Vector3(0.18, 0.04, 0.17), new THREE.Vector3(shoulderX + 0.015, -0.1, 0.105), 0x2f6bd7);
  }
  if (v.watch) addPlainBox(group, new THREE.Vector3(0.11, 0.045, 0.175), new THREE.Vector3(shoulderX + 0.02, -0.1, 0.11), 0x0a0c10);
}

function addLegs(group, v) {
  addBox(group, new THREE.Vector3(0.18, 0.43, 0.18), new THREE.Vector3(-0.15, -0.5, 0), v.pants, 0.045);
  addBox(group, new THREE.Vector3(0.18, 0.43, 0.18), new THREE.Vector3(0.15, -0.5, 0), v.pants, 0.045);
  if (v.bodyType === 'fighter') {
    addBox(group, new THREE.Vector3(0.22, 0.15, 0.2), new THREE.Vector3(-0.15, -0.29, 0.03), 0xb71f28, 0.035);
    addBox(group, new THREE.Vector3(0.22, 0.15, 0.2), new THREE.Vector3(0.15, -0.29, 0.03), 0x2764c8, 0.035);
  }
  addBox(group, new THREE.Vector3(0.22, 0.12, 0.34), new THREE.Vector3(-0.15, -0.78, 0.11), v.shoe, 0.04);
  addBox(group, new THREE.Vector3(0.22, 0.12, 0.34), new THREE.Vector3(0.15, -0.78, 0.11), v.shoe, 0.04);
  addPlainBox(group, new THREE.Vector3(0.17, 0.025, 0.18), new THREE.Vector3(-0.15, -0.715, 0.17), v.shoeAccent);
  addPlainBox(group, new THREE.Vector3(0.17, 0.025, 0.18), new THREE.Vector3(0.15, -0.715, 0.17), v.shoeAccent);
}

function addAccessories(group, v) {
  if (v.necklace) {
    addPlainBox(group, new THREE.Vector3(0.018, 0.27, 0.018), new THREE.Vector3(-0.055, 0.22, 0.205), 0xd8d8d8, { rotation: { z: -0.25 } });
    addPlainBox(group, new THREE.Vector3(0.018, 0.27, 0.018), new THREE.Vector3(0.055, 0.22, 0.205), 0xd8d8d8, { rotation: { z: 0.25 } });
    addSphere(group, 0.035, new THREE.Vector3(0, 0.08, 0.225), 0xe9e2d0, new THREE.Vector3(0.75, 1, 0.75), 0.025);
  }
  if (v.beltChain) {
    for (let i = 0; i < 5; i++) {
      addBox(group, new THREE.Vector3(0.045, 0.035, 0.03), new THREE.Vector3(0.25 + i * 0.045, -0.22 - i * 0.025, 0.2), 0xc6c6c6, 0.018, { rotation: { z: 0.5 } });
    }
  }
  addPlainCircle(group, 0.08, new THREE.Vector3(0.17, 0.1, 0.23), v.emblem, { rotation: { y: Math.PI } });
}

function addBlueRose(gunPivot, v) {
  addCylinder(gunPivot, 0.028, 0.035, 0.72, new THREE.Vector3(0, -0.02, 0.65), 0x15273c, 0.025, { rotation: { x: Math.PI / 2 } });
  addSphere(gunPivot, 0.12, new THREE.Vector3(0, 0.04, 1.05), 0x30a8ff, new THREE.Vector3(1, 0.85, 1), 0.04);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addSphere(gunPivot, 0.07, new THREE.Vector3(Math.cos(a) * 0.08, 0.04 + Math.sin(a) * 0.025, 1.05 + Math.sin(a) * 0.06), 0x74d8ff, new THREE.Vector3(1.2, 0.55, 0.75), 0.025);
  }
  addBox(gunPivot, new THREE.Vector3(0.09, 0.05, 0.24), new THREE.Vector3(-0.05, -0.02, 0.78), 0x174e72, 0.025, { rotation: { y: -0.5 } });
}

function buildWeapon(gunPivot, brawler, visual) {
  const id = brawler.id;

  if (visual.weapon === 'blueRose') {
    addBlueRose(gunPivot, visual);
    return;
  }

  if (visual.weapon === 'emberSword' || id === 'luan') {
    addBox(gunPivot, new THREE.Vector3(0.12, 0.14, 0.34), new THREE.Vector3(0, -0.02, 0.32), 0x1a1b20, 0.06);
    addBox(gunPivot, new THREE.Vector3(0.12, 0.08, 1.0), new THREE.Vector3(0, 0, 0.84), 0x2a2b30, 0.045);
    addBox(gunPivot, new THREE.Vector3(0.035, 0.1, 0.92), new THREE.Vector3(0, 0.015, 0.88), brawler.accent, 0.02);
    return;
  }

  if (visual.weapon === 'fists' || id === 'djonga') {
    addSphere(gunPivot, 0.22, new THREE.Vector3(-0.2, 0, 0.55), 0x15151a, new THREE.Vector3(1.1, 0.9, 1.25), 0.08);
    addSphere(gunPivot, 0.22, new THREE.Vector3(0.2, 0, 0.55), 0x15151a, new THREE.Vector3(1.1, 0.9, 1.25), 0.08);
    addPlainBox(gunPivot, new THREE.Vector3(0.18, 0.035, 0.15), new THREE.Vector3(-0.2, 0.1, 0.55), 0xd62d2d);
    addPlainBox(gunPivot, new THREE.Vector3(0.18, 0.035, 0.15), new THREE.Vector3(0.2, 0.1, 0.55), 0x2f6bd7);
    return;
  }

  if (visual.weapon === 'shadowBlades' || id === 'thomas') {
    for (const x of [-0.18, 0.18]) {
      const blade = addBox(gunPivot, new THREE.Vector3(0.07, 0.055, 0.78), new THREE.Vector3(x, 0, 0.72), brawler.accent, 0.045);
      blade.rotation.z = x < 0 ? 0.18 : -0.18;
      addBox(gunPivot, new THREE.Vector3(0.08, 0.08, 0.18), new THREE.Vector3(x, -0.01, 0.34), 0x12203b, 0.04);
    }
    return;
  }

  if (id === 'gui') {
    addBox(gunPivot, new THREE.Vector3(0.14, 0.14, 0.45), new THREE.Vector3(0, 0, 0.46), COLORS.gunMetal, 0.07);
    addSphere(gunPivot, 0.22, new THREE.Vector3(0, 0, 0.82), brawler.accent, new THREE.Vector3(1, 1, 1), 0.08);
    return;
  }

  if (id === 'lorenzo') {
    addCylinder(gunPivot, 0.16, 0.2, 0.54, new THREE.Vector3(0, 0, 0.58), COLORS.gunMetal, 0.08, { rotation: { x: Math.PI / 2 } });
    addSphere(gunPivot, 0.16, new THREE.Vector3(0, 0, 0.88), brawler.accent, new THREE.Vector3(1.25, 0.85, 1.25), 0.07);
    return;
  }

  if (id === 'ministro') {
    addBox(gunPivot, new THREE.Vector3(0.1, 0.1, 0.82), new THREE.Vector3(0, 0, 0.67), COLORS.gunMetal, 0.055);
    addCylinder(gunPivot, 0.05, 0.09, 0.24, new THREE.Vector3(0, 0, 1.08), brawler.accent, 0.04, { rotation: { x: Math.PI / 2 } });
    return;
  }

  addBox(gunPivot, new THREE.Vector3(0.13, 0.13, 0.7), new THREE.Vector3(0, 0, 0.58), COLORS.gunMetal, 0.07);
  addSphere(gunPivot, 0.18, new THREE.Vector3(0, 0.02, 0.98), brawler.accent, new THREE.Vector3(1, 0.75, 1), 0.06);
}

export function buildBrawlerMesh(bodyColor, brawlerId = 'joao') {
  const brawler = getBrawler(brawlerId);
  const visual = visualFor(brawler);
  const root = new THREE.Object3D();
  root.userData.brawlerId = brawler.id;

  const bodyPivot = new THREE.Object3D();
  bodyPivot.position.set(0, BODY_HEIGHT, 0);
  root.add(bodyPivot);

  addLegs(bodyPivot, visual);
  addTorso(bodyPivot, visual);
  addArms(bodyPivot, visual);
  addHead(bodyPivot, visual);
  addHair(bodyPivot, visual);
  addAccessories(bodyPivot, visual);

  const gunPivot = new THREE.Object3D();
  gunPivot.position.set(0, BODY_HEIGHT, 0.02);
  root.add(gunPivot);
  buildWeapon(gunPivot, brawler, visual);

  const shadowGeo = new THREE.CircleGeometry(PLAYER_RADIUS * 0.85, 20);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  return { root, bodyPivot, gunPivot, shadowMesh };
}

export function setMeshOpacity(root, shadowMesh, opacity) {
  root.traverse(obj => {
    if (obj.isMesh && obj.material && obj !== shadowMesh) {
      obj.material.transparent = true;
      obj.material.opacity = opacity;
    }
  });
}

const NAME_COLORS = [0x22e0c2, 0xf4b740, 0xe5484d, 0x8a6de0, 0xff8a4c, 0x4ca8ff, 0x7fd93b, 0xff5fa8];

export function colorForSlot(slot) {
  return NAME_COLORS[slot % NAME_COLORS.length];
}
