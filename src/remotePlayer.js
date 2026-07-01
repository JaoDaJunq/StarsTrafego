import { lerpAngle } from './utils.js';
import { buildBrawlerMesh, setMeshOpacity, colorForSlot } from './brawlerMesh.js';

export class RemotePlayer {
  constructor(id, name, colorSlot) {
    this.id = id;
    this.name = name || 'Convidado';

    this.x = 0;
    this.z = 0;
    this.bodyAngle = 0;
    this.aimAngle = 0;
    this.moving = false;
    this.inBush = false;
    this.bob = 0;

    this.targetX = 0;
    this.targetZ = 0;
    this.targetBodyAngle = 0;
    this.targetAimAngle = 0;

    this.lastSeen = performance.now();
    this.hasData = false;

    const mesh = buildBrawlerMesh(colorForSlot(colorSlot));
    this.root = mesh.root;
    this.bodyPivot = mesh.bodyPivot;
    this.gunPivot = mesh.gunPivot;
    this.shadowMesh = mesh.shadowMesh;
  }

  applyNetState(state) {
    this.targetX = state.x;
    this.targetZ = state.z;
    this.targetBodyAngle = state.b;
    this.targetAimAngle = state.a;
    this.moving = !!state.m;
    this.inBush = !!state.u;
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
    setMeshOpacity(this.root, this.shadowMesh, this.inBush ? 0.4 : 1);
  }

  dispose(scene) {
    scene.remove(this.root);
    this.root.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
