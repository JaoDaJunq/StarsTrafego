import * as THREE from 'three';
import { pointInRectXZ } from './utils.js';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';

export class Projectile {
  constructor(scene, x, y, z, angle, speed, range, damage, big, ghost) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = Math.sin(angle) * speed;
    this.vz = Math.cos(angle) * speed;
    this.traveled = 0;
    this.range = range;
    this.damage = damage;
    this.big = !!big;
    this.ghost = !!ghost;
    this.dead = false;

    const geo = new THREE.SphereGeometry(big ? 0.14 : 0.09, 10, 8);
    const mat = new THREE.MeshBasicMaterial({ color: big ? COLORS.gold : COLORS.playerBody });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, z);

    const glowMat = new THREE.MeshBasicMaterial({
      color: big ? COLORS.gold : COLORS.playerBody,
      transparent: true,
      opacity: 0.35
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.24 : 0.16, 8, 6), glowMat);
    this.mesh.add(glow);

    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    for (let s = 0; s < 2; s++) {
      const dx = this.vx * dt * 0.5;
      const dz = this.vz * dt * 0.5;
      this.x += dx;
      this.z += dz;
      this.traveled += Math.hypot(dx, dz);

      if (this.x < 0 || this.x > ARENA_W || this.z < 0 || this.z > ARENA_D) {
        this.dead = true;
        this._removeFrom(world.scene);
        return;
      }

      if (!this.ghost) {
        for (const o of world.blockers) {
          if (o.alive === false) continue;
          if (pointInRectXZ(this.x, this.z, o.bounds)) {
            const res = o.hit({ x: this.x, y: this.y, z: this.z }, ps, this.damage);
            if (res) player.gainSuper(res.superGain);
            this.dead = true;
            this._removeFrom(world.scene);
            return;
          }
        }
      }

      if (this.traveled >= this.range) {
        this.dead = true;
        this._removeFrom(world.scene);
        return;
      }
    }

    this.mesh.position.set(this.x, this.y, this.z);
  }

  _removeFrom(scene) {
    scene.remove(this.mesh);
    this.mesh.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
