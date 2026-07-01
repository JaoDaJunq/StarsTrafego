import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { clamp, lerpAngle, resolveCircleRectXZ } from './utils.js';
import { COLORS, ARENA_W, ARENA_D } from './constants.js';

const BODY_HEIGHT = 0.5;
const GUN_TIP_LOCAL = new THREE.Vector3(0, 0, 1.02);

export class Player {
  constructor(x, z) {
    this.x = x;
    this.z = z;
    this.radius = 0.5;
    this.speed = 5.6;
    this.bodyAngle = 0;
    this.aimAngle = 0;
    this.moving = false;
    this.inBush = false;

    this.ammo = 3;
    this.ammoMax = 3;
    this.reloadTimer = 0;
    this.reloadTime = 1.4;

    this.fireCooldown = 0;
    this.fireRate = 0.28;

    this.superCharge = 0;
    this.superMax = 100;

    this.muzzleFlash = 0;
    this.bob = 0;

    this._buildMesh();
  }

  _buildMesh() {
    this.root = new THREE.Object3D();

    this.bodyPivot = new THREE.Object3D();
    this.bodyPivot.position.set(0, BODY_HEIGHT, 0);
    this.root.add(this.bodyPivot);

    const bodyGeo = new THREE.SphereGeometry(this.radius, 20, 14);
    const bodyMesh = new THREE.Mesh(bodyGeo, toonMaterial(COLORS.playerBody));
    bodyMesh.scale.set(1, 0.94, 1);
    bodyMesh.castShadow = true;
    const bodyGroup = withOutline(bodyMesh, 0.075, COLORS.outline);
    this.bodyPivot.add(bodyGroup);

    const visorGeo = new THREE.SphereGeometry(0.3, 16, 10);
    const visorMesh = new THREE.Mesh(visorGeo, toonMaterial(COLORS.playerVisor));
    visorMesh.scale.set(0.5, 0.55, 1);
    visorMesh.position.set(0, 0.03, this.radius * 0.62);
    const visorGroup = withOutline(visorMesh, 0.05, COLORS.outline);
    this.bodyPivot.add(visorGroup);

    this.gunPivot = new THREE.Object3D();
    this.gunPivot.position.set(0, BODY_HEIGHT, 0);
    this.root.add(this.gunPivot);

    const gunGeo = new THREE.BoxGeometry(0.2, 0.19, 0.62);
    const gunMesh = new THREE.Mesh(gunGeo, toonMaterial(COLORS.gunMetal));
    gunMesh.position.set(0, 0, 0.6);
    gunMesh.castShadow = true;
    const gunGroup = withOutline(gunMesh, 0.1, COLORS.outline);
    this.gunPivot.add(gunGroup);

    const shadowGeo = new THREE.CircleGeometry(this.radius * 0.85, 20);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.02;
    this.root.add(this.shadowMesh);
  }

  get gunTipWorld() {
    return this.gunPivot.localToWorld(GUN_TIP_LOCAL.clone());
  }

  update(dt, input, world) {
    let mx = 0;
    let mz = 0;
    if (input.keys.has('w') || input.keys.has('arrowup')) mz -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) mz += 1;
    if (input.keys.has('a') || input.keys.has('arrowleft')) mx -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) mx += 1;

    this.moving = mx !== 0 || mz !== 0;
    if (this.moving) {
      const len = Math.hypot(mx, mz) || 1;
      mx /= len;
      mz /= len;
      const targetAngle = Math.atan2(mx, mz);
      this.bodyAngle = lerpAngle(this.bodyAngle, targetAngle, 1 - Math.pow(0.0005, dt));
      const nx = this.x + mx * this.speed * dt;
      const nz = this.z + mz * this.speed * dt;
      this.tryMove(nx, nz, world);
      this.bob += dt * 9;
    } else {
      this.bob *= 0.9;
    }

    this.aimAngle = Math.atan2(input.aimX - this.x, input.aimZ - this.z);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.ammo < this.ammoMax) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.reloadTime) {
        this.reloadTimer = 0;
        this.ammo++;
      }
    }
    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

    this.inBush = world.bushes.some(b => world.circleOverlapsBush(this.x, this.z, this.radius * 0.6, b));

    this._syncMesh();
  }

  _syncMesh() {
    const hop = this.moving ? Math.abs(Math.sin(this.bob)) * 0.05 : 0;
    this.root.position.set(this.x, hop, this.z);
    this.bodyPivot.rotation.y = this.bodyAngle;
    this.gunPivot.rotation.y = this.aimAngle;

    const targetOpacity = this.inBush ? 0.45 : 1;
    this.root.traverse(obj => {
      if (obj.isMesh && obj.material && obj !== this.shadowMesh) {
        obj.material.transparent = true;
        obj.material.opacity = targetOpacity;
      }
    });
  }

  tryMove(nx, nz, world) {
    nx = clamp(nx, this.radius, ARENA_W - this.radius);
    nz = clamp(nz, this.radius, ARENA_D - this.radius);
    for (const o of world.blockers) {
      if (o.alive === false) continue;
      const res = resolveCircleRectXZ(nx, nz, this.radius, o.bounds);
      nx = res.x;
      nz = res.z;
    }
    this.x = nx;
    this.z = nz;
  }

  canFire() {
    return this.ammo > 0 && this.fireCooldown <= 0;
  }

  fire() {
    this.ammo--;
    this.fireCooldown = this.fireRate;
    this.muzzleFlash = 0.08;
    const tip = this.gunTipWorld;
    return { x: tip.x, y: tip.y, z: tip.z, angle: this.aimAngle };
  }

  gainSuper(amount) {
    this.superCharge = Math.min(this.superMax, this.superCharge + amount);
  }

  canSuper() {
    return this.superCharge >= this.superMax;
  }

  useSuper() {
    this.superCharge = 0;
  }
}
