import * as THREE from 'three';

export class CollisionManager {
  constructor(collidables = []) {
    this.collidables = collidables;
  }

  check(box) {
    return this.collidables.some((obj) => {
      const objBox = new THREE.Box3().setFromObject(obj);
      return box.intersectsBox(objBox);
    });
  }

  add(obj) {
    this.collidables.push(obj);
  }
}