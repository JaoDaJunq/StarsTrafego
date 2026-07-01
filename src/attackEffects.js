import * as THREE from 'three';
import { clamp, circleRectOverlapXZ } from './utils.js';
import { ARENA_W, ARENA_D, COLORS } from './constants.js';

function dispose(scene, obj) {
  scene.remove(obj);
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
}

function mat(color, opacity = 0.36) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function lineMat(color, opacity = 0.72) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

function applyAreaDamage(world, ps, player, x, z, radius, damage, gain = 12, color = COLORS.gold) {
  if (!world || !world.blockers) return;
  for (const o of world.blockers) {
    if (o.alive === false) continue;
    if (circleRectOverlapXZ(x, z, radius, o.bounds)) {
      const res = o.hit({ x: o.bounds.x, y: 0.5, z: o.bounds.z }, ps, damage);
      if (player && res) player.gainSuper(gain || res.superGain);
      ps.burst({ x: o.bounds.x, y: 0.45, z: o.bounds.z }, { count: 8, color, speed: 2.2, life: 0.35 });
    }
  }
}

function angleDiff(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function playerInArea(player, x, z, radius) {
  if (!player || player.isDown) return false;
  return Math.hypot(player.x - x, player.z - z) <= radius + player.radius * 0.72;
}

function playerInCone(player, x, z, angle, range, arc) {
  if (!player || player.isDown) return false;
  const dx = player.x - x;
  const dz = player.z - z;
  const dist = Math.hypot(dx, dz);
  if (dist > range + player.radius * 0.72) return false;
  const a = Math.atan2(dx, dz);
  return Math.abs(angleDiff(a, angle)) <= arc * 0.5;
}

function applyConeDamage(world, ps, player, x, z, angle, range, arc, damage, gain = 10, color = COLORS.gold) {
  for (const o of world.blockers) {
    if (o.alive === false) continue;
    const dx = o.bounds.x - x;
    const dz = o.bounds.z - z;
    const dist = Math.hypot(dx, dz);
    if (dist > range + Math.max(o.bounds.w, o.bounds.d) * 0.5) continue;
    const a = Math.atan2(dx, dz);
    if (Math.abs(angleDiff(a, angle)) <= arc * 0.5) {
      const res = o.hit({ x: o.bounds.x, y: 0.5, z: o.bounds.z }, ps, damage);
      if (player && res) player.gainSuper(gain || res.superGain);
      ps.burst({ x: o.bounds.x, y: 0.45, z: o.bounds.z }, { count: 7, color, speed: 2.4, life: 0.28 });
    }
  }
}

function buildConeMesh(range, arc, color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  const steps = 18;
  for (let i = 0; i <= steps; i++) {
    const a = -arc / 2 + (arc * i) / steps;
    shape.lineTo(Math.sin(a) * range, Math.cos(a) * range);
  }
  shape.lineTo(0, 0);
  const geo = new THREE.ShapeGeometry(shape);
  const mesh = new THREE.Mesh(geo, mat(color, 0.32));
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

export class ConeSlash {
  constructor(scene, x, z, angle, range, arc, damage, color, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.z = z;
    this.angle = angle;
    this.range = range;
    this.arc = arc;
    this.damage = damage;
    this.color = color;
    this.life = opts.life || 0.18;
    this.maxLife = this.life;
    this.delay = opts.delay || 0;
    this.hit = false;
    this.ghost = !!opts.ghost;
    this.superGain = opts.superGain || 10;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.mesh = buildConeMesh(range, arc, color);
    this.mesh.position.set(x, 0.035, z);
    this.mesh.rotation.z = -angle;
    this.mesh.visible = this.delay <= 0;
    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) this.mesh.visible = true;
      return;
    }
    if (!this.hit) {
      if (!this.ghost) {
        applyConeDamage(world, ps, player, this.x, this.z, this.angle, this.range, this.arc, this.damage, this.superGain, this.color);
      } else if (this.targetPlayer && playerInCone(this.targetPlayer, this.x, this.z, this.angle, this.range, this.arc)) {
        this.onHitPlayer && this.onHitPlayer(this.damage, { x: this.targetPlayer.x, y: 0.55, z: this.targetPlayer.z }, this);
      }
      this.hit = true;
    }
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    this.mesh.material.opacity = t * 0.32;
    this.mesh.scale.setScalar(1 + (1 - t) * 0.12);
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
  }
}

export class ImpactArea {
  constructor(scene, x, z, radius, damage, color, opts = {}) {
    this.scene = scene;
    this.x = clamp(x, radius * 0.35, ARENA_W - radius * 0.35);
    this.z = clamp(z, radius * 0.35, ARENA_D - radius * 0.35);
    this.radius = radius;
    this.damage = damage;
    this.color = color;
    this.life = opts.life || 0.45;
    this.maxLife = this.life;
    this.delay = opts.delay || 0;
    this.ghost = !!opts.ghost;
    this.superGain = opts.superGain || 18;
    this.targetPlayer = opts.targetPlayer || null;
    this.onHitPlayer = opts.onHitPlayer || null;
    this.hitEffect = opts.hitEffect || null;
    this.hit = false;

    const geo = new THREE.CircleGeometry(radius, 40);
    this.mesh = new THREE.Mesh(geo, mat(color, opts.opacity || 0.34));
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(this.x, 0.045, this.z);
    this.mesh.visible = this.delay <= 0;
    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) this.mesh.visible = true;
      return;
    }
    if (!this.hit) {
      if (!this.ghost) {
        applyAreaDamage(world, ps, player, this.x, this.z, this.radius, this.damage, this.superGain, this.color);
      } else if (this.targetPlayer && playerInArea(this.targetPlayer, this.x, this.z, this.radius)) {
        this.onHitPlayer && this.onHitPlayer(this.damage, { x: this.targetPlayer.x, y: 0.55, z: this.targetPlayer.z }, this);
      }
      this.hit = true;
    }
    this.life -= dt;
    const t = Math.max(0, this.life / this.maxLife);
    this.mesh.material.opacity = t * 0.34;
    this.mesh.scale.setScalar(0.8 + (1 - t) * 0.55);
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
  }
}

export class ChainTrap extends ImpactArea {
  constructor(scene, x, z, radius, damage, color, opts = {}) {
    super(scene, x, z, radius, damage, color, { ...opts, life: opts.life || 1.25, opacity: 0.22 });
    this.chainGroup = new THREE.Group();
    const chainColor = opts.chainColor || COLORS.outline;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const points = [
        new THREE.Vector3(Math.sin(a) * radius * 0.2, 0.08, Math.cos(a) * radius * 0.2),
        new THREE.Vector3(Math.sin(a) * radius * 0.8, 0.7, Math.cos(a) * radius * 0.8),
        new THREE.Vector3(Math.sin(a) * radius, 0.08, Math.cos(a) * radius)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat(chainColor, 0.78));
      this.chainGroup.add(line);
    }
    this.chainGroup.position.set(this.x, 0, this.z);
    this.chainGroup.visible = this.delay <= 0;
    scene.add(this.chainGroup);
  }

  update(dt, world, ps, player) {
    const wasDelay = this.delay;
    super.update(dt, world, ps, player);
    if (!this.dead) {
      if (wasDelay > 0 && this.delay <= 0) this.chainGroup.visible = true;
      this.chainGroup.rotation.y += dt * 1.8;
      const t = Math.max(0, this.life / this.maxLife);
      this.chainGroup.traverse(obj => {
        if (obj.material) obj.material.opacity = t * 0.78;
      });
    }
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
    dispose(this.scene, this.chainGroup);
  }
}

export class DashAttack {
  constructor(scene, playerRef, angle, color, opts = {}) {
    this.scene = scene;
    this.playerRef = playerRef;
    this.angle = angle;
    this.color = color;
    this.duration = opts.duration || 0.36;
    this.life = this.duration;
    this.speed = (opts.distance || 3.2) / this.duration;
    this.radius = opts.radius || 0.92;
    this.damage = opts.damage || 15;
    this.tick = 0;
    this.ghost = !!opts.ghost;

    const geo = new THREE.RingGeometry(0.24, this.radius, 32);
    this.mesh = new THREE.Mesh(geo, mat(color, 0.4));
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(playerRef.x, 0.06, playerRef.z);
    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    this.life -= dt;
    if (!this.ghost && this.playerRef) {
      this.playerRef.moveBy(Math.sin(this.angle) * this.speed * dt, Math.cos(this.angle) * this.speed * dt, world);
      this.playerRef.startSpin(0.12);
      this.tick -= dt;
      if (this.tick <= 0) {
        this.tick = 0.08;
        applyAreaDamage(world, ps, player, this.playerRef.x, this.playerRef.z, this.radius, this.damage, 7, this.color);
      }
      this.mesh.position.set(this.playerRef.x, 0.06, this.playerRef.z);
    } else if (this.playerRef) {
      this.mesh.position.set(this.playerRef.x, 0.06, this.playerRef.z);
    }
    this.mesh.rotation.z += dt * 14;
    this.mesh.material.opacity = Math.max(0, this.life / this.duration) * 0.4;
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
  }
}

export class LeapAttack {
  constructor(scene, playerRef, targetX, targetZ, color, opts = {}) {
    this.scene = scene;
    this.playerRef = playerRef;
    this.startX = playerRef.x;
    this.startZ = playerRef.z;
    this.targetX = clamp(targetX, 0.6, ARENA_W - 0.6);
    this.targetZ = clamp(targetZ, 0.6, ARENA_D - 0.6);
    this.color = color;
    this.duration = opts.duration || 0.62;
    this.life = this.duration;
    this.radius = opts.radius || 1.25;
    this.damage = opts.damage || 22;
    this.ghost = !!opts.ghost;
    this.landed = false;

    const geo = new THREE.CircleGeometry(this.radius, 32);
    this.mesh = new THREE.Mesh(geo, mat(color, 0.22));
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(this.targetX, 0.05, this.targetZ);
    scene.add(this.mesh);
  }

  update(dt, world, ps, player) {
    this.life -= dt;
    const p = 1 - Math.max(0, this.life / this.duration);
    if (!this.ghost && this.playerRef && p < 1) {
      const x = this.startX + (this.targetX - this.startX) * p;
      const z = this.startZ + (this.targetZ - this.startZ) * p;
      this.playerRef.x = x;
      this.playerRef.z = z;
      this.playerRef.root.position.y = Math.sin(p * Math.PI) * 1.1;
    }
    this.mesh.scale.setScalar(0.8 + p * 0.35);
    this.mesh.material.opacity = Math.max(0.04, (1 - p) * 0.22);
    if (this.life <= 0 && !this.landed) {
      this.landed = true;
      if (!this.ghost && this.playerRef) {
        this.playerRef.tryMove(this.targetX, this.targetZ, world);
        this.playerRef.root.position.y = 0;
        applyAreaDamage(world, ps, player, this.playerRef.x, this.playerRef.z, this.radius, this.damage, 22, this.color);
      }
      ps.burst({ x: this.targetX, y: 0.45, z: this.targetZ }, { color: this.color, count: 24, speed: 3.5, life: 0.5, cube: true });
      this.kill();
    }
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.mesh);
  }
}

export class HealTurret {
  constructor(scene, x, z, color, opts = {}) {
    this.scene = scene;
    this.x = clamp(x, 0.8, ARENA_W - 0.8);
    this.z = clamp(z, 0.8, ARENA_D - 0.8);
    this.color = color;
    this.life = opts.life || 7;
    this.maxLife = this.life;
    this.pulse = 0;

    this.group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.45, 18), mat(color, 0.95));
    base.position.y = 0.25;
    this.group.add(base);
    const aura = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.25, 36), mat(color, 0.32));
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.04;
    this.aura = aura;
    this.group.add(aura);
    this.group.position.set(this.x, 0, this.z);
    scene.add(this.group);
  }

  update(dt, world, ps, player) {
    this.life -= dt;
    this.pulse += dt * 3;
    const t = Math.max(0, this.life / this.maxLife);
    this.aura.scale.setScalar(1 + Math.sin(this.pulse) * 0.08);
    this.group.traverse(obj => {
      if (obj.material) obj.material.opacity = Math.min(obj.material.opacity, t + 0.15);
    });
    if (player && Math.hypot(player.x - this.x, player.z - this.z) < 1.45) {
      player.hp = Math.min(player.hpMax, player.hp + dt * 18);
    }
    if (this.life <= 0) this.kill();
  }

  kill() {
    this.dead = true;
    dispose(this.scene, this.group);
  }
}
