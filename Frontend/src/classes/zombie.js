import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Zombie {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.collidables = options.collidables ?? [];
    this.playerPosition = options.playerPosition ?? null;
    this.spawnSize = new THREE.Vector3(1.2, 3, 1.2);
    this.arenaLimit = options.arenaLimit ?? 24;
    this.playerMinDistance = options.playerMinDistance ?? 8;

    this.container = new THREE.Group();
    this.container.position.copy(this.getSpawnPosition());
    this.scene.add(this.container);

    this.mixer = null;
    this.model = null;
    this.hitbox = new THREE.Box3();

    this.hitboxHelper = new THREE.Box3Helper(this.hitbox, 0xff0000);
    scene.add(this.hitboxHelper);

    this.loader = new GLTFLoader();
    this.loader.load("/animated_zombie_cop_running_loop/scene.gltf", (gltf) => {
      this.model = gltf.scene;
      this.container.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);
      const action = this.mixer.clipAction(gltf.animations[0]);
      action.play();

      // ✅ Zombie créé, log dans la console
      console.log("Zombie créé !", this.model);
    });
  }

  getSpawnPosition() {
    const spawnBox = new THREE.Box3();

    for (let attempt = 0; attempt < 50; attempt++) {
      const x = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const z = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const spawnPosition = new THREE.Vector3(x, 0, z);

      if (
        this.playerPosition &&
        spawnPosition.distanceTo(this.playerPosition) < this.playerMinDistance
      ) {
        continue;
      }

      spawnBox.setFromCenterAndSize(
        new THREE.Vector3(x, this.spawnSize.y / 2, z),
        this.spawnSize,
      );

      const collides = this.collidables.some((obj) => {
        const objBox = new THREE.Box3().setFromObject(obj);
        return spawnBox.intersectsBox(objBox);
      });

      if (!collides) {
        return spawnPosition;
      }
    }

    return new THREE.Vector3(0, 0, 0);
  }
  update(dt) {
    if (this.mixer) this.mixer.update(dt);

    if (this.model) {
      const pos = new THREE.Vector3();
      this.model.getWorldPosition(pos);
      const size = new THREE.Vector3(0.7, 2.8, 1);
      this.hitbox.setFromCenterAndSize(
        pos.clone().add(new THREE.Vector3(0, size.y / 2, 0)),
        size,
      );
    }
  }
  die() {
    this.scene.remove(this.container);
    this.scene.remove(this.hitboxHelper);
  }
}
