import { lerpAngle } from './utils.js';
import { buildBrawlerMesh, setMeshOpacity } from './brawlerMesh.js';
import { getBrawler, DEFAULT_BRAWLER_ID } from './brawlers.js';

export class RemotePlayer {
  constructor(id, name, brawlerId = DEFAULT_BRAWLER_ID, colorSlot = 0) {
    this.id = id;
    this.name = name || 'Convidado';
    this.brawlerId = brawlerId;
    this.brawler = getBrawler(brawlerId);
    this.colorSlot = colorSlot;

    this.x = 0;
    this.z = 0;
    this.bodyAngle = 0;
    this.aimAngle = 0;
    this.moving = false;
    this.inBush = false;
    this.stealth = false;
    this.isDown = false;
    this.hpMax = this.brawler.hp;
    this.hp = this.hpMax;
    this.bob = 0;

    this.targetX = 0;
    this.targetZ = 0;
    this.targetBodyAngle = 0;
    this.targetAimAngle = 0;

    this.lastSeen = performance.now();
    this.hasData = false;

    this._buildMesh();
  }

  _buildMesh() {
    const mesh = buildBrawlerMesh(this.brawler.color, this.brawlerId);
    this.root = mesh.root;
    this.bodyPivot = mesh.bodyPivot;
    this.gunPivot = mesh.gunPivot;
    this.shadowMesh = mesh.shadowMesh;
  }

  setBrawler(brawlerId, scene) {
    if (!brawlerId || brawlerId === this.brawlerId) return;
    const oldRoot = this.root;
    this.brawlerId = brawlerId;
    this.brawler = getBrawler(brawlerId);
    this.hpMax = this.brawler.hp;
    this.hp = Math.min(this.hp || this.hpMax, this.hpMax);
    this._buildMesh();
    this.root.position.set(this.x, 0, this.z);
    if (scene) {
      scene.remove(oldRoot);
      oldRoot.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      scene.add(this.root);
    }
  }

  applyNetState(state) {
    if (state.r && state.r !== this.brawlerId) this.setBrawler(state.r, this.root?.parent);
    this.targetX = state.x;
    this.targetZ = state.z;
    this.targetBodyAngle = state.b;
    this.targetAimAngle = state.a;
    this.moving = !!state.m;
    this.inBush = !!state.u;
    this.stealth = !!state.v;
    if (typeof state.hp === 'number') this.hp = Math.max(0, Math.min(this.hpMax, state.hp));
    this.isDown = !!state.d;
    this.lastSeen = performance.now();

    if (!this.hasData) {
      this.x = this.targetX;
      this.z = this.targetZ;
      this.bodyAngle = this.targetBodyAngle;
      this.aimAngle = this.targetAimAngle;
      this.hasData = true;
    }
  }

  get staleMs() {
    return performance.now() - this.lastSeen;
  }

  update(dt) {
    if (!this.hasData) return;

    const posT = 1 - Math.pow(0.0005, dt);
    const rotT = 1 - Math.pow(0.001, dt);
    this.x += (this.targetX - this.x) * posT;
    this.z += (this.targetZ - this.z) * posT;
    this.bodyAngle = lerpAngle(this.bodyAngle, this.targetBodyAngle, rotT);
    this.aimAngle = lerpAngle(this.aimAngle, this.targetAimAngle, rotT);

    if (this.moving) this.bob += dt * 9;
    else this.bob *= 0.9;

    const hop = this.moving ? Math.abs(Math.sin(this.bob)) * 0.05 : 0;
    this.root.position.set(this.x, hop, this.z);
    this.bodyPivot.rotation.y = this.bodyAngle;
    this.gunPivot.rotation.y = this.aimAngle;
    const opacity = this.isDown ? 0.28 : (this.stealth ? 0.22 : (this.inBush ? 0.4 : 1));
    setMeshOpacity(this.root, this.shadowMesh, opacity);
    this.root.scale.setScalar(this.isDown ? 0.82 : 1);
  }

  applyHealth(hp, down = false) {
    if (typeof hp === 'number') this.hp = Math.max(0, Math.min(this.hpMax, hp));
    this.isDown = !!down;
  }

  dispose(scene) {
    scene.remove(this.root);
    this.root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
