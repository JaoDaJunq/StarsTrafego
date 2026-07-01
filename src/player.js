import { clamp, lerpAngle, resolveCircleRectXZ } from './utils.js';
import { ARENA_W, ARENA_D } from './constants.js';
import { buildBrawlerMesh, setMeshOpacity, GUN_TIP_LOCAL, PLAYER_RADIUS, colorForSlot } from './brawlerMesh.js';

export class Player {
  constructor(x, z, colorSlot = 0) {
    this.x = x;
    this.z = z;
    this.radius = PLAYER_RADIUS;
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

    const mesh = buildBrawlerMesh(colorForSlot(colorSlot));
    this.root = mesh.root;
    this.bodyPivot = mesh.bodyPivot;
    this.gunPivot = mesh.gunPivot;
    this.shadowMesh = mesh.shadowMesh;
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
    setMeshOpacity(this.root, this.shadowMesh, this.inBush ? 0.45 : 1);
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

  netState() {
    return {
      x: this.x,
      z: this.z,
      b: this.bodyAngle,
      a: this.aimAngle,
      m: this.moving,
      u: this.inBush
    };
  }
}
