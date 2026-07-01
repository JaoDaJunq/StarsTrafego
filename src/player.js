import { clamp, lerpAngle, resolveCircleRectXZ } from './utils.js';
import { ARENA_W, ARENA_D } from './constants.js';
import { buildBrawlerMesh, setMeshOpacity, GUN_TIP_LOCAL, PLAYER_RADIUS } from './brawlerMesh.js';
import { getBrawler, DEFAULT_BRAWLER_ID } from './brawlers.js';

export class Player {
  constructor(x, z, brawlerId = DEFAULT_BRAWLER_ID, colorSlot = 0) {
    this.x = x;
    this.z = z;
    this.brawler = getBrawler(brawlerId);
    this.brawlerId = this.brawler.id;
    this.colorSlot = colorSlot;
    this.radius = PLAYER_RADIUS;
    this.speed = this.brawler.speed;
    this.bodyAngle = 0;
    this.aimAngle = 0;
    this.moving = false;
    this.inBush = false;

    this.hpMax = this.brawler.hp;
    this.hp = this.hpMax;

    this.ammo = 3;
    this.ammoMax = 3;
    this.reloadTimer = 0;
    this.reloadTime = this.brawler.reloadTime;

    this.fireCooldown = 0;
    this.fireRate = this.brawler.fireRate;

    this.superCharge = 0;
    this.superMax = 100;

    this.muzzleFlash = 0;
    this.bob = 0;
    this.stealthTimer = 0;
    this.spinTimer = 0;
    this.rootedTimer = 0;
    this.invulnTimer = 0;
    this.isDown = false;
    this.respawnTimer = 0;

    const mesh = buildBrawlerMesh(this.brawler.color, this.brawlerId);
    this.root = mesh.root;
    this.bodyPivot = mesh.bodyPivot;
    this.gunPivot = mesh.gunPivot;
    this.shadowMesh = mesh.shadowMesh;
  }

  get gunTipWorld() {
    return this.gunPivot.localToWorld(GUN_TIP_LOCAL.clone());
  }

  update(dt, input, world) {
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.rootedTimer > 0) this.rootedTimer -= dt;

    if (this.isDown) {
      this.respawnTimer -= dt;
      this.fireCooldown = Math.max(this.fireCooldown, 0.2);
      this.moving = false;
      if (this.respawnTimer <= 0) {
        this.isDown = false;
        this.hp = this.hpMax;
        this.invulnTimer = 1.1;
      }
      this._syncMesh();
      return;
    }

    let mx = 0;
    let mz = 0;
    if (input.keys.has('w') || input.keys.has('arrowup')) mz -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) mz += 1;
    if (input.keys.has('a') || input.keys.has('arrowleft')) mx -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) mx += 1;

    if (this.rootedTimer > 0) {
      mx = 0;
      mz = 0;
    }

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
    if (this.stealthTimer > 0) this.stealthTimer -= dt;
    if (this.spinTimer > 0) this.spinTimer -= dt;

    this.inBush = world.bushes.some(b => world.circleOverlapsBush(this.x, this.z, this.radius * 0.6, b));

    this._syncMesh();
  }

  _syncMesh() {
    const hop = this.moving ? Math.abs(Math.sin(this.bob)) * 0.05 : 0;
    this.root.position.set(this.x, hop, this.z);
    this.bodyPivot.rotation.y = this.spinTimer > 0 ? this.bodyAngle + this.spinTimer * 28 : this.bodyAngle;
    this.gunPivot.rotation.y = this.aimAngle;
    const hiddenOpacity = this.isDown ? 0.28 : (this.stealthTimer > 0 ? 0.22 : (this.inBush ? 0.45 : 1));
    setMeshOpacity(this.root, this.shadowMesh, hiddenOpacity);
    this.root.scale.setScalar(this.isDown ? 0.82 : (this.invulnTimer > 0 ? 1 + Math.sin(this.invulnTimer * 24) * 0.035 : 1));
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

  moveBy(dx, dz, world) {
    this.tryMove(this.x + dx, this.z + dz, world);
  }

  canFire() {
    return !this.isDown && this.rootedTimer <= 0.05 && this.ammo > 0 && this.fireCooldown <= 0;
  }

  fire() {
    this.ammo--;
    this.fireCooldown = this.fireRate;
    this.muzzleFlash = 0.08;
    this.stealthTimer = 0;
    const tip = this.gunTipWorld;
    return { x: tip.x, y: tip.y, z: tip.z, angle: this.aimAngle, brawlerId: this.brawlerId };
  }

  gainSuper(amount) {
    this.superCharge = Math.min(this.superMax, this.superCharge + amount);
  }

  canSuper() {
    return !this.isDown && this.superCharge >= this.superMax;
  }

  useSuper() {
    this.superCharge = 0;
  }

  startStealth(seconds = 4) {
    this.stealthTimer = seconds;
  }

  startSpin(seconds = 0.35) {
    this.spinTimer = seconds;
  }

  root(seconds = 1.1) {
    if (this.isDown) return;
    this.rootedTimer = Math.max(this.rootedTimer, seconds);
  }

  takeDamage(amount, opts = {}) {
    if (this.isDown || this.invulnTimer > 0 || amount <= 0) return { changed: false, downed: false };
    this.hp = Math.max(0, this.hp - amount);
    const downed = this.hp <= 0;
    if (opts.root) this.root(opts.root);
    if (downed) {
      this.isDown = true;
      this.respawnTimer = opts.respawnTime || 2.8;
      this.stealthTimer = 0;
      this.rootedTimer = 0;
    }
    return { changed: true, downed };
  }

  heal(amount) {
    if (this.isDown || amount <= 0 || this.hp >= this.hpMax) return false;
    this.hp = Math.min(this.hpMax, this.hp + amount);
    return true;
  }

  netState() {
    return {
      x: this.x,
      z: this.z,
      b: this.bodyAngle,
      a: this.aimAngle,
      m: this.moving,
      u: this.inBush,
      v: this.stealthTimer > 0,
      r: this.brawlerId,
      hp: this.hp,
      d: this.isDown,
      rt: this.rootedTimer > 0
    };
  }
}
