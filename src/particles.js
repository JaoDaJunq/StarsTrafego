import * as THREE from 'three';
import { softGlowTexture } from './toon.js';

let glowTex = null;
function getGlowTex() {
  if (!glowTex) glowTex = softGlowTexture();
  return glowTex;
}

class Particle3D {
  constructor(mesh, vx, vy, vz, life, gravity, spin) {
    this.mesh = mesh;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity;
    this.spin = spin || 0;
  }

  update(dt) {
    this.vy -= this.gravity * dt;
    this.mesh.position.x += this.vx * dt;
    this.mesh.position.y += this.vy * dt;
    this.mesh.position.z += this.vz * dt;
    this.mesh.rotation.x += this.spin * dt;
    this.mesh.rotation.z += this.spin * 0.7 * dt;
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    if (this.mesh.material) this.mesh.material.opacity = t;
    this.mesh.scale.setScalar(0.55 + t * 0.45);
  }

  get alive() {
    return this.life > 0 && this.mesh.position.y > -1;
  }
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  burst(point, opts = {}) {
    const count = opts.count || 10;
    const color = opts.color !== undefined ? opts.color : 0xffffff;
    const speed = opts.speed || 3;
    const life = opts.life || 0.55;
    const cube = !!opts.cube;
    const py = point.y !== undefined ? point.y : 0.4;

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.9);
      const up = 1.6 + Math.random() * 2.4;
      let mesh;

      if (cube) {
        const size = 0.05 + Math.random() * 0.07;
        const geo = new THREE.BoxGeometry(size, size, size);
        mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true }));
      } else {
        mesh = new THREE.Sprite(new THREE.SpriteMaterial({
          map: getGlowTex(),
          color,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }));
        const size = 0.16 + Math.random() * 0.14;
        mesh.scale.set(size, size, size);
      }

      mesh.position.set(point.x, py, point.z);
      this.scene.add(mesh);
      this.list.push(new Particle3D(
        mesh,
        Math.cos(a) * s, up, Math.sin(a) * s,
        life * (0.6 + Math.random() * 0.7),
        6.4,
        (Math.random() - 0.5) * 10
      ));
    }
  }

  update(dt) {
    for (const p of this.list) p.update(dt);
    const dead = this.list.filter(p => !p.alive);
    for (const p of dead) {
      this.scene.remove(p.mesh);
      if (p.mesh.geometry) p.mesh.geometry.dispose();
      if (p.mesh.material) p.mesh.material.dispose();
    }
    this.list = this.list.filter(p => p.alive);
  }
}
