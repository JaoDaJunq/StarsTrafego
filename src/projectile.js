import * as THREE from 'three';
import { pointInRectXZ } from './utils.js';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';

export class Projectile {
  constructor(scene, x, y, z, angle, speed, range, damage, big, ghost, opts = {}) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.angle = angle;
    this.vx = Math.sin(angle) * speed;
    this.vz = Math.cos(angle) * speed;
    this.traveled = 0;
    this.range = range;
    this.damage = damage;
    this.damageNear = opts.damageNear !== undefined ? opts.damageNear : damage;
    this.damageFar = opts.damageFar !== undefined ? opts.damageFar : damage;
    this.big = !!big;
    this.ghost = !!ghost;
    this.dead = false;
    this.color = opts.color !== undefined ? opts.color : (big ? COLORS.gold : COLORS.playerBody);
    this.size = opts.size || (big ? 0.14 : 0.09);
    this.glowSize = opts.glowSize || this.size * 1.75;
    this.pierce = !!opts.pierce;
    this.superGain = opts.superGain || null;
    this.onExpire = opts.onExpire || null;
    this.scene = scene;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.hitPlayer = false;

    const geo = new THREE.SphereGeometry(this.size, 10, 8);
    const mat = new THREE.MeshBasicMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.set(x, y, z);

    const glowMat = new THREE.MeshBasicMaterial({
      color: this.color,
      transparent: true,
      opacity: opts.opacity !== undefined ? opts.opacity : 0.35
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(this.glowSize, 8, 6), glowMat);
    this.mesh.add(glow);

    scene.add(this.mesh);
  }

  currentDamage() {
    if (this.damageNear === this.damageFar) return this.damage;
    const t = Math.max(0, Math.min(1, this.traveled / Math.max(this.range, 0.001)));
    return Math.round(this.damageNear + (this.damageFar - this.damageNear) * t);
  }

  update(dt, world, ps, player) {
    for (let s = 0; s < 2; s++) {
      const dx = this.vx * dt * 0.5;
      const dz = this.vz * dt * 0.5;
      this.x += dx;
      this.z += dz;
      this.traveled += Math.hypot(dx, dz);

      if (this.x < 0 || this.x > ARENA_W || this.z < 0 || this.z > ARENA_D) {
        this.kill(world.scene);
        return;
      }

      if (this.ghost && this.targetPlayer && !this.hitPlayer && !this.targetPlayer.isDown) {
        const hitRadius = this.size + this.targetPlayer.radius * 0.72;
        if (Math.hypot(this.x - this.targetPlayer.x, this.z - this.targetPlayer.z) <= hitRadius) {
          this.hitPlayer = true;
          if (this.onHitPlayer) {
            this.onHitPlayer(this.currentDamage(), { x: this.x, y: this.y, z: this.z }, this);
          }
          if (!this.pierce) {
            this.kill(world.scene);
            return;
          }
        }
      }

      if (!this.ghost) {
        for (const o of world.blockers) {
          if (o.alive === false) continue;
          if (pointInRectXZ(this.x, this.z, o.bounds)) {
            const res = o.hit({ x: this.x, y: this.y, z: this.z }, ps, this.currentDamage());
            if (res && player) player.gainSuper(this.superGain || res.superGain);
            if (!this.pierce) {
              this.kill(world.scene);
              return;
            }
          }
        }
      }

      if (this.traveled >= this.range) {
        if (this.onExpire && !this.ghost) this.onExpire({ x: this.x, y: this.y, z: this.z });
        this.kill(world.scene);
        return;
      }
    }

    this.mesh.position.set(this.x, this.y, this.z);
  }

  kill(scene) {
    this.dead = true;
    this._removeFrom(scene);
  }

  _removeFrom(scene) {
    if (!this.mesh || !this.mesh.parent) return;
    scene.remove(this.mesh);
    this.mesh.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
