import * as THREE from 'three';

let gradientMap = null;
function getGradientMap() {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([80, 170, 255]);
  gradientMap = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradientMap.needsUpdate = true;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.minFilter = THREE.NearestFilter;
  return gradientMap;
}

export function toonMaterial(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    transparent: !!opts.transparent,
    opacity: opts.opacity !== undefined ? opts.opacity : 1
  });
}

const OUTLINE_MAT_CACHE = new Map();
function outlineMaterial(color) {
  const key = color;
  if (OUTLINE_MAT_CACHE.has(key)) return OUTLINE_MAT_CACHE.get(key);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  OUTLINE_MAT_CACHE.set(key, mat);
  return mat;
}

export function withOutline(mesh, thickness = 0.045, color = 0x0c1420) {
  const group = new THREE.Group();
  group.add(mesh);
  const outline = new THREE.Mesh(mesh.geometry, outlineMaterial(color));
  outline.scale.setScalar(1 + thickness);
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.castShadow = false;
  outline.receiveShadow = false;
  group.add(outline);
  return group;
}

export function softGlowTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}
