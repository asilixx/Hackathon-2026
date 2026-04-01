import * as THREE from 'three';
import { remove } from 'three/examples/jsm/libs/tween.module.js';

export class ShootingSystem {
  constructor(camera, controls, collidables, zombies) {
    this.camera = camera;
    this.controls = controls;
    this.collidables = collidables;
    this.zombies = zombies;
    this.raycaster = new THREE.Raycaster();

    document.addEventListener('click', () => this._shoot());
  }

  _shoot() {
  if (!this.controls.isLocked) return;

  this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

  const wallHits = this.raycaster.intersectObjects(this.collidables, true);

  this.zombies.forEach(zombie => {
    if (!zombie.model) return;

    const zombieDistance = this.camera.position.distanceTo(zombie.model.position);

    const wallBlocking = wallHits.some(hit => hit.distance < zombieDistance);

    if (wallBlocking) return;

    if (this.raycaster.ray.intersectsBox(zombie.hitbox)) {
      console.log('Zombie touché !');

      zombie.die(); 
    }
  });
}
}