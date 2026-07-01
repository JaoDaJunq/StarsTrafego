import * as THREE from 'three';

export class Input {
  constructor(dom, camera, groundMesh) {
    this.keys = new Set();
    this.firing = false;
    this.superPressed = false;
    this.aimX = 0;
    this.aimZ = 0;

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.camera = camera;
    this.groundMesh = groundMesh;
    this.dom = dom;

    window.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'q' || k === ' ') {
        this.superPressed = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));

    this.dom.addEventListener('mousemove', e => this._updateAim(e));
    this.dom.addEventListener('mousedown', e => {
      this.firing = true;
      this._updateAim(e);
    });
    window.addEventListener('mouseup', () => {
      this.firing = false;
    });
    this.dom.addEventListener('contextmenu', e => e.preventDefault());
  }

  _updateAim(e) {
    const rect = this.dom.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.intersectObject(this.groundMesh)[0];
    if (hit) {
      this.aimX = hit.point.x;
      this.aimZ = hit.point.z;
    }
  }

  consumeSuperPress() {
    const v = this.superPressed;
    this.superPressed = false;
    return v;
  }
}
