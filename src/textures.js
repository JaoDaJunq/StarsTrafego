import * as THREE from 'three';

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

export function grassTexture() {
  const size = 256;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6dbf3e';
  ctx.fillRect(0, 0, size, size);

  const blades = 900;
  for (let i = 0; i < blades; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random();
    ctx.fillStyle = shade > 0.5 ? 'rgba(78,154,44,0.55)' : 'rgba(143,219,94,0.5)';
    const w = 2 + Math.random() * 3;
    ctx.fillRect(x, y, w, w);
  }

  const patches = 10;
  for (let i = 0; i < patches; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 14 + Math.random() * 26;
    ctx.fillStyle = 'rgba(78,154,44,0.30)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function dirtTexture() {
  const size = 128;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e0b169';
  ctx.fillRect(0, 0, size, size);
  const specks = 500;
  for (let i = 0; i < specks; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(192,146,80,0.5)' : 'rgba(240,205,150,0.4)';
    const w = 1 + Math.random() * 2;
    ctx.fillRect(x, y, w, w);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function woodTexture() {
  const size = 128;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d79a46';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(156,106,44,0.45)';
  ctx.lineWidth = 3;
  for (let y = 8; y < size; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y) * 3);
    ctx.lineTo(size, y + Math.cos(y) * 3);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
