import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { COLORS } from './constants.js';
import { getBrawler } from './brawlers.js';

export const BODY_HEIGHT = 0.5;
export const GUN_TIP_LOCAL = new THREE.Vector3(0, 0, 1.02);
export const PLAYER_RADIUS = 0.5;

function addBox(group, size, pos, color, outline = 0.06) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), toonMaterial(color));
  mesh.position.copy(pos);
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function addSphere(group, radius, pos, color, scale = new THREE.Vector3(1, 1, 1), outline = 0.055) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 10), toonMaterial(color));
  mesh.position.copy(pos);
  mesh.scale.copy(scale);
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function addCylinder(group, radiusTop, radiusBottom, height, pos, color, outline = 0.05) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 16), toonMaterial(color));
  mesh.position.copy(pos);
  mesh.castShadow = true;
  group.add(withOutline(mesh, outline, COLORS.outline));
  return mesh;
}

function buildWeapon(gunPivot, brawler) {
  const id = brawler.id;

  if (id === 'luan') {
    const grip = addBox(gunPivot, new THREE.Vector3(0.14, 0.16, 0.32), new THREE.Vector3(0, -0.01, 0.34), COLORS.gunMetal, 0.08);
    grip.rotation.x = 0.15;
    const blade = addBox(gunPivot, new THREE.Vector3(0.1, 0.08, 0.9), new THREE.Vector3(0, 0.01, 0.82), brawler.accent, 0.06);
    blade.rotation.x = -0.06;
    return;
  }

  if (id === 'djonga') {
    addSphere(gunPivot, 0.2, new THREE.Vector3(-0.2, 0, 0.55), brawler.accent, new THREE.Vector3(1.1, 0.9, 1.25), 0.08);
    addSphere(gunPivot, 0.2, new THREE.Vector3(0.2, 0, 0.55), brawler.accent, new THREE.Vector3(1.1, 0.9, 1.25), 0.08);
    addBox(gunPivot, new THREE.Vector3(0.46, 0.08, 0.22), new THREE.Vector3(0, -0.08, 0.34), COLORS.gunMetal, 0.05);
    return;
  }

  if (id === 'thomas') {
    const left = addBox(gunPivot, new THREE.Vector3(0.08, 0.08, 0.72), new THREE.Vector3(-0.14, 0, 0.67), brawler.accent, 0.06);
    const right = addBox(gunPivot, new THREE.Vector3(0.08, 0.08, 0.72), new THREE.Vector3(0.14, 0, 0.67), brawler.accent, 0.06);
    left.rotation.z = 0.18;
    right.rotation.z = -0.18;
    return;
  }

  if (id === 'gui') {
    addBox(gunPivot, new THREE.Vector3(0.14, 0.14, 0.45), new THREE.Vector3(0, 0, 0.46), COLORS.gunMetal, 0.07);
    addSphere(gunPivot, 0.22, new THREE.Vector3(0, 0, 0.82), brawler.accent, new THREE.Vector3(1, 1, 1), 0.08);
    return;
  }

  if (id === 'lorenzo') {
    addCylinder(gunPivot, 0.16, 0.2, 0.54, new THREE.Vector3(0, 0, 0.58), COLORS.gunMetal, 0.08).rotation.x = Math.PI / 2;
    addSphere(gunPivot, 0.16, new THREE.Vector3(0, 0, 0.88), brawler.accent, new THREE.Vector3(1.25, 0.85, 1.25), 0.07);
    return;
  }

  if (id === 'ministro') {
    addBox(gunPivot, new THREE.Vector3(0.1, 0.1, 0.82), new THREE.Vector3(0, 0, 0.67), COLORS.gunMetal, 0.055);
    addCylinder(gunPivot, 0.05, 0.09, 0.24, new THREE.Vector3(0, 0, 1.08), brawler.accent, 0.04).rotation.x = Math.PI / 2;
    return;
  }

  addBox(gunPivot, new THREE.Vector3(0.13, 0.13, 0.7), new THREE.Vector3(0, 0, 0.58), 0x1f5fbf, 0.07);
  addSphere(gunPivot, 0.18, new THREE.Vector3(0, 0.02, 0.98), brawler.accent, new THREE.Vector3(1, 0.75, 1), 0.06);
}

export function buildBrawlerMesh(bodyColor, brawlerId = 'joao') {
  const brawler = getBrawler(brawlerId);
  const root = new THREE.Object3D();
  root.userData.brawlerId = brawler.id;

  const bodyPivot = new THREE.Object3D();
  bodyPivot.position.set(0, BODY_HEIGHT, 0);
  root.add(bodyPivot);

  const bodyGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 20, 14);
  const bodyMesh = new THREE.Mesh(bodyGeo, toonMaterial(bodyColor || brawler.color));
  bodyMesh.scale.set(1, 0.94, 1);
  bodyMesh.castShadow = true;
  const bodyGroup = withOutline(bodyMesh, 0.075, COLORS.outline);
  bodyPivot.add(bodyGroup);

  const visorGeo = new THREE.SphereGeometry(0.3, 16, 10);
  const visorMesh = new THREE.Mesh(visorGeo, toonMaterial(COLORS.playerVisor));
  visorMesh.scale.set(0.5, 0.55, 1);
  visorMesh.position.set(0, 0.03, PLAYER_RADIUS * 0.62);
  const visorGroup = withOutline(visorMesh, 0.05, COLORS.outline);
  bodyPivot.add(visorGroup);

  const badgeGeo = new THREE.CircleGeometry(0.12, 12);
  const badgeMesh = new THREE.Mesh(badgeGeo, new THREE.MeshBasicMaterial({ color: brawler.accent }));
  badgeMesh.rotation.x = -Math.PI / 2;
  badgeMesh.position.set(0, 0.49, 0.06);
  bodyPivot.add(badgeMesh);

  const gunPivot = new THREE.Object3D();
  gunPivot.position.set(0, BODY_HEIGHT, 0);
  root.add(gunPivot);
  buildWeapon(gunPivot, brawler);

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
