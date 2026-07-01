import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { COLORS } from './constants.js';

export const BODY_HEIGHT = 0.5;
export const GUN_TIP_LOCAL = new THREE.Vector3(0, 0, 1.02);
export const PLAYER_RADIUS = 0.5;

export function buildBrawlerMesh(bodyColor) {
  const root = new THREE.Object3D();

  const bodyPivot = new THREE.Object3D();
  bodyPivot.position.set(0, BODY_HEIGHT, 0);
  root.add(bodyPivot);

  const bodyGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 20, 14);
  const bodyMesh = new THREE.Mesh(bodyGeo, toonMaterial(bodyColor));
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

  const gunPivot = new THREE.Object3D();
  gunPivot.position.set(0, BODY_HEIGHT, 0);
  root.add(gunPivot);

  const gunGeo = new THREE.BoxGeometry(0.2, 0.19, 0.62);
  const gunMesh = new THREE.Mesh(gunGeo, toonMaterial(COLORS.gunMetal));
  gunMesh.position.set(0, 0, 0.6);
  gunMesh.castShadow = true;
  const gunGroup = withOutline(gunMesh, 0.1, COLORS.outline);
  gunPivot.add(gunGroup);

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
