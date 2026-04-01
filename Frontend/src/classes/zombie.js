import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();
let zombieModel = null;
let zombieAnimations = [];

const zombieModelPromise = new Promise((resolve, reject) => {
  loader.load(
    "/animated_zombie_cop_running_loop/scene.gltf",
    (gltf) => {
      zombieModel = gltf.scene;
      zombieAnimations = gltf.animations;
      console.log("Modele zombie charge !");
      resolve(gltf);
    },
    undefined,
    reject
  );
});

export class Zombie {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.collidables = options.collidables ?? [];
    this.playerPosition = options.playerPosition ?? null;
    this.spawnSize = new THREE.Vector3(1.2, 3, 1.2);
    this.arenaLimit = options.arenaLimit ?? 24;
    this.playerMinDistance = options.playerMinDistance ?? 8;
    this.speed = options.speed ?? 2;

    this.container = new THREE.Group();
    this.container.position.copy(this.getSpawnPosition());
    this.scene.add(this.container);

    this.mixer = null;
    this.model = null;
    this.hitbox = new THREE.Box3();
    this.isDead = false;

    this.hitboxHelper = new THREE.Box3Helper(this.hitbox, 0xff0000);
    scene.add(this.hitboxHelper);

    this.initModel();
  }

  async initModel() {
    try {
      if (!zombieModel) {
        await zombieModelPromise;
      }

      if (this.isDead || !zombieModel) {
        return;
      }

      this.model = clone(zombieModel);
      this.container.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);

      if (zombieAnimations.length > 0) {
        const action = this.mixer.clipAction(zombieAnimations[0]);
        action.play();
      }

      console.log("Zombie cree !");
    } catch (error) {
      console.error("Impossible de charger le zombie :", error);
    }
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
        this.spawnSize
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
    if (this.isDead) return;

    if (this.mixer) this.mixer.update(dt);

    if (this.model) {
      const pos = new THREE.Vector3();
      this.model.getWorldPosition(pos);

      const size = new THREE.Vector3(0.7, 2.8, 1);
      this.hitbox.setFromCenterAndSize(
        pos.clone().add(new THREE.Vector3(0, size.y / 2, 0)),
        size
      );
    }

    this.move(dt);
  }

  die() {
    if (this.isDead) return;

    this.isDead = true;
    this.scene.remove(this.container);
    this.scene.remove(this.hitboxHelper);
  }

  move(dt) {
    if (!this.playerPosition || !this.model) return;

    const direction = new THREE.Vector3()
      .subVectors(this.playerPosition, this.container.position)
      .setY(0)
      .normalize();

    const moveX = new THREE.Vector3(direction.x, 0, 0).multiplyScalar(
      this.speed * dt
    );

    const moveZ = new THREE.Vector3(0, 0, direction.z).multiplyScalar(
      this.speed * dt
    );

    const tryMove = (move) => {
      this.container.position.add(move);

      const box = new THREE.Box3().setFromCenterAndSize(
        this.container.position
          .clone()
          .add(new THREE.Vector3(0, this.spawnSize.y / 2, 0)),
        this.spawnSize
      );

      const blocked = this.collidables.some((obj) =>
        box.intersectsBox(new THREE.Box3().setFromObject(obj))
      );

      if (blocked) this.container.position.sub(move);
    };

    tryMove(moveX);
    tryMove(moveZ);

    this.container.lookAt(
      new THREE.Vector3(
        this.playerPosition.x,
        this.container.position.y,
        this.playerPosition.z
      )
    );
  }
}
