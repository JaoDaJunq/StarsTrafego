import * as THREE from 'three';
import { toonMaterial, withOutline } from './toon.js';
import { grassTexture, dirtTexture, woodTexture } from './textures.js';
import { COLORS, ARENA_W, ARENA_D, OBSTACLES } from './constants.js';
import { circleRectOverlapXZ } from './utils.js';

export class Wall {
  constructor(def) {
    this.type = 'wall';
    this.bounds = { x: def.x, z: def.z, w: def.w, d: def.d };
    this.label = def.label;
    this._buildMesh(def);
  }

  _buildMesh(def) {
    const height = 1.5;
    const group = new THREE.Group();

    const baseGeo = new THREE.BoxGeometry(def.w, height, def.d);
    const baseMesh = new THREE.Mesh(baseGeo, toonMaterial(COLORS.pilarBase));
    baseMesh.position.y = height / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(withOutline(baseMesh, 0.05, COLORS.outline));

    const capGeo = new THREE.BoxGeometry(def.w * 0.92, 0.14, def.d * 0.92);
    const capMesh = new THREE.Mesh(capGeo, toonMaterial(COLORS.pilarGold));
    capMesh.position.y = height + 0.07;
    capMesh.castShadow = true;
    group.add(withOutline(capMesh, 0.05, COLORS.outline));

    group.position.set(def.x, 0, def.z);
    this.mesh = group;
  }

  hit(point, ps) {
    ps.burst(point, { color: COLORS.crimson, count: 8, speed: 2.6, life: 0.35 });
    return { destroyed: false, superGain: 14 };
  }

  update() {}
}

export class Crate {
  constructor(def, index = 0) {
    this.type = 'crate';
    this.id = `crate-${index}`;
    this.bounds = { x: def.x, z: def.z, w: def.w, d: def.d };
    this.label = def.label;
    this.hpMax = def.hp;
    this.hp = def.hp;
    this.alive = true;
    this.respawnTimer = 0;
    this.shakeTimer = 0;
    this.onChange = null;
    this._buildMesh(def);
  }

  _buildMesh(def) {
    const height = 0.9;
    const group = new THREE.Group();
    const wood = woodTexture();

    const boxGeo = new THREE.BoxGeometry(def.w, height, def.d);
    const boxMat = new THREE.MeshToonMaterial({ map: wood });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.position.y = height / 2;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    group.add(withOutline(boxMesh, 0.075, COLORS.outline));

    const paperGeo = new THREE.BoxGeometry(def.w * 0.55, 0.03, def.d * 0.55);
    const paperMesh = new THREE.Mesh(paperGeo, toonMaterial(COLORS.cratePaper));
    paperMesh.position.y = height + 0.02;
    group.add(paperMesh);

    const sealGeo = new THREE.CircleGeometry(def.w * 0.12, 12);
    const sealMesh = new THREE.Mesh(sealGeo, new THREE.MeshBasicMaterial({ color: COLORS.crateSeal }));
    sealMesh.rotation.x = -Math.PI / 2;
    sealMesh.position.y = height + 0.035;
    group.add(sealMesh);

    group.position.set(def.x, 0, def.z);
    this.mesh = group;
  }

  hit(point, ps, damage, opts = {}) {
    this.hp -= damage || 1;
    this.shakeTimer = 0.22;
    ps.burst(point, { color: COLORS.crateWood, count: 10, speed: 2.8, life: 0.45, cube: true });

    if (this.hp <= 0) {
      this.alive = false;
      this.respawnTimer = 6;
      this.mesh.visible = false;
      ps.burst({ x: this.bounds.x, y: 0.5, z: this.bounds.z }, {
        color: COLORS.gold, count: 22, speed: 3.6, life: 0.6, cube: true
      });
      const result = { destroyed: true, superGain: 26 };
      if (!opts.silent && this.onChange) this.onChange(this, point, result);
      return result;
    }
    const result = { destroyed: false, superGain: 16 };
    if (!opts.silent && this.onChange) this.onChange(this, point, result);
    return result;
  }

  applyState(state, ps) {
    const wasAlive = this.alive;
    if (typeof state.hp === 'number') this.hp = Math.max(0, Math.min(this.hpMax, state.hp));
    if (typeof state.alive === 'boolean') this.alive = state.alive;
    if (typeof state.respawnTimer === 'number') this.respawnTimer = Math.max(0, state.respawnTimer);
    this.mesh.visible = this.alive;
    if (!wasAlive && this.alive) {
      this.hp = this.hpMax;
      this.shakeTimer = 0;
      this.mesh.rotation.y = 0;
    }
    if (ps && state.hitX !== undefined && state.hitZ !== undefined) {
      ps.burst({ x: state.hitX, y: state.hitY || 0.45, z: state.hitZ }, {
        color: state.destroyed ? COLORS.gold : COLORS.crateWood,
        count: state.destroyed ? 18 : 8,
        speed: state.destroyed ? 3.2 : 2.2,
        life: state.destroyed ? 0.55 : 0.35,
        cube: true
      });
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      this.mesh.rotation.y = Math.sin(this.shakeTimer * 55) * this.shakeTimer * 0.35;
    } else if (this.mesh.rotation.y !== 0) {
      this.mesh.rotation.y = 0;
    }

    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.alive = true;
        this.hp = this.hpMax;
        this.mesh.visible = true;
      }
    }
  }
}

function buildBush(def, scene) {
  const group = new THREE.Group();
  const clusters = 5;
  for (let i = 0; i < clusters; i++) {
    const r = 0.5 + Math.random() * 0.32;
    const geo = new THREE.SphereGeometry(r, 10, 8);
    const mat = toonMaterial(i % 2 === 0 ? COLORS.bushLeaf : COLORS.bushShade);
    const mesh = new THREE.Mesh(geo, mat);
    const ox = (Math.random() - 0.5) * def.w * 0.6;
    const oz = (Math.random() - 0.5) * def.d * 0.6;
    mesh.position.set(ox, r * 0.62, oz);
    mesh.castShadow = true;
    group.add(withOutline(mesh, 0.065, COLORS.outline));
  }
  group.position.set(def.x, 0, def.z);
  scene.add(group);
  return group;
}

export function buildWorld(scene) {
  const dirt = dirtTexture();
  dirt.repeat.set(ARENA_W / 1.1, ARENA_D / 1.1);
  const outerGeo = new THREE.PlaneGeometry(ARENA_W * 2.2, ARENA_D * 2.2);
  const outerMat = new THREE.MeshToonMaterial({ map: dirt });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  outerMesh.rotation.x = -Math.PI / 2;
  outerMesh.position.set(ARENA_W / 2, -0.01, ARENA_D / 2);
  outerMesh.receiveShadow = true;
  scene.add(outerMesh);

  const grass = grassTexture();
  grass.repeat.set(ARENA_W / 2.2, ARENA_D / 2.2);
  const innerGeo = new THREE.PlaneGeometry(ARENA_W, ARENA_D);
  const innerMat = new THREE.MeshToonMaterial({ map: grass });
  const groundMesh = new THREE.Mesh(innerGeo, innerMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.set(ARENA_W / 2, 0, ARENA_D / 2);
  groundMesh.receiveShadow = true;
  groundMesh.name = 'ground';
  scene.add(groundMesh);

  const walls = OBSTACLES.filter(o => o.type === 'wall').map(o => new Wall(o));
  const crates = OBSTACLES.filter(o => o.type === 'crate').map((o, i) => new Crate(o, i));
  const bushDefs = OBSTACLES.filter(o => o.type === 'bush');

  for (const w of walls) scene.add(w.mesh);
  for (const c of crates) scene.add(c.mesh);
  for (const b of bushDefs) buildBush(b, scene);

  const blockers = [...walls, ...crates];
  const crateMap = new Map(crates.map(c => [c.id, c]));

  const world = {
    scene,
    groundMesh,
    walls,
    crates,
    crateMap,
    blockers,
    onCrateChange: null,
    bushes: bushDefs,
    circleOverlapsBush(cx, cz, cr, b) {
      return circleRectOverlapXZ(cx, cz, cr, b);
    },
    applyCrateState(state, ps) {
      const crate = crateMap.get(state.id);
      if (!crate) return;
      crate.applyState(state, ps);
    },
    syncCrate(crate, point, result) {
      if (!this.onCrateChange) return;
      this.onCrateChange(crate, point, result);
    },
    update(dt) {
      for (const c of crates) c.update(dt);
    },
    reset() {
      for (const c of crates) {
        c.alive = true;
        c.hp = c.hpMax;
        c.respawnTimer = 0;
        c.shakeTimer = 0;
        c.mesh.visible = true;
        c.mesh.rotation.y = 0;
      }
    }
  };

  for (const c of crates) {
    c.onChange = (crate, point, result) => world.syncCrate(crate, point, result);
  }

  return world;
}
