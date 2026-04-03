import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const loader = new GLTFLoader();

const models = {
  normal: { scene: null, animations: [], promise: null },
  fast:   { scene: null, animations: [], promise: null },
  tank:   { scene: null, animations: [], promise: null },
};

function loadModel(key, path) {
  models[key].promise = new Promise((resolve, reject) => {
    loader.load(path, (gltf) => {
      models[key].scene      = gltf.scene;
      models[key].animations = gltf.animations;
      resolve(gltf);
    }, undefined, reject);
  });
}

loadModel('normal', '/animated_zombie_cop_running_loop/scene.gltf');
loadModel('fast',   '/fast-zombie/scene.gltf');
loadModel('tank',   '/best-zombie/scene.gltf');

// Pas de couleur — juste la taille change selon le type
const TYPE_CONFIG = {
  normal: { scale: 1.0  },
  fast:   { scale: 0.82 }, // plus petit, plus rapide visuellement
  tank:   { scale: 1.45 }, // gros, imposant
};

export const allZombies = [];
const SEPARATION_RADIUS = 1.4;
const SEPARATION_FORCE  = 4.0;

export class Zombie {
  constructor(scene, options = {}) {
    this.scene             = scene;
    this.collidables       = options.collidables       ?? [];
    this.playerPosition    = options.playerPosition    ?? null;
    this.player            = options.player            ?? null;
    this.type              = options.type              ?? 'normal';
    this.spawnSize         = new THREE.Vector3(1.2, 3, 1.2);
    this.arenaLimit        = options.arenaLimit        ?? 24;
    this.playerMinDistance = options.playerMinDistance ?? 8;
    this.speed             = options.speed             ?? 2;
    this.damage            = options.damage            ?? 10;
    this.maxHp             = options.hp                ?? 1;
    this.hp                = this.maxHp;
    this.attackCooldown    = options.attackCooldown    ?? 800;
    this.lastAttackAt      = 0;
    this.onDeath           = options.onDeath           ?? null;

    this.container = new THREE.Group();
    this.container.position.copy(this.getSpawnPosition());
    this.scene.add(this.container);

    this.mixer  = null;
    this.model  = null;
    this.hitbox = new THREE.Box3();
    this.isDead = false;

    allZombies.push(this);
    this.initModel();
  }

  async initModel() {
    const cfg       = TYPE_CONFIG[this.type] ?? TYPE_CONFIG.normal;
    const modelData = models[this.type]      ?? models.normal;

    try {
      if (!modelData.scene) await modelData.promise.catch(() => {});
    } catch (_) {}

    // Fallback sur normal si le modèle spécialisé n'a pas chargé
    const src = modelData.scene ? modelData : models.normal;
    if (!src.scene || this.isDead) return;

    this.model = clone(src.scene);

    // Taille uniquement — aucune modification de couleur
    this.model.scale.setScalar(cfg.scale);
    this.container.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    if (src.animations.length > 0) {
      this.mixer.clipAction(src.animations[0]).play();
    }
  }

  getSpawnPosition() {
    const spawnBox = new THREE.Box3();
    for (let attempt = 0; attempt < 50; attempt++) {
      const x   = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const z   = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const pos = new THREE.Vector3(x, 0, z);

      if (this.playerPosition && pos.distanceTo(this.playerPosition) < this.playerMinDistance) continue;

      spawnBox.setFromCenterAndSize(
        new THREE.Vector3(x, this.spawnSize.y / 2, z),
        this.spawnSize
      );
      const collidesStatic = this.collidables.some(obj =>
        spawnBox.intersectsBox(new THREE.Box3().setFromObject(obj))
      );
      const collidesZombie = allZombies.some(other =>
        !other.isDead && !other.hitbox.isEmpty() && spawnBox.intersectsBox(other.hitbox)
      );
      if (!collidesStatic && !collidesZombie) return pos;
    }
    return new THREE.Vector3(0, 0, 0);
  }

  update(dt) {
    if (this.isDead) return;
    if (this.mixer) this.mixer.update(dt);

    if (this.model) {
      const pos  = new THREE.Vector3();
      this.model.getWorldPosition(pos);
      const size = new THREE.Vector3(0.7, 2.8, 1);
      this.hitbox.setFromCenterAndSize(
        pos.clone().add(new THREE.Vector3(0, size.y / 2, 0)),
        size
      );
    }

    this.move(dt);
    this.attackPlayer();
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    const idx = allZombies.indexOf(this);
    if (idx !== -1) allZombies.splice(idx, 1);
    this.scene.remove(this.container);
    if (typeof this.onDeath === 'function') this.onDeath(this);
  }

  move(dt) {
    if (!this.playerPosition || !this.model) return;

    const toPlayer    = new THREE.Vector3()
      .subVectors(this.playerPosition, this.container.position).setY(0);
    const distToPlayer = toPlayer.length();
    const dirToPlayer  = distToPlayer > 0 ? toPlayer.clone().normalize() : new THREE.Vector3();

    // Séparation entre zombies
    const separation = new THREE.Vector3();
    for (const other of allZombies) {
      if (other === this || other.isDead) continue;
      const diff = new THREE.Vector3()
        .subVectors(this.container.position, other.container.position).setY(0);
      const dist = diff.length();
      if (dist < SEPARATION_RADIUS && dist > 0.001) {
        separation.addScaledVector(
          diff.normalize(),
          (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS
        );
      }
    }

    const finalDir = new THREE.Vector3();
    if (distToPlayer > 1.0) finalDir.addScaledVector(dirToPlayer, 1.0);
    finalDir.addScaledVector(separation, SEPARATION_FORCE * dt);
    finalDir.setY(0);
    if (finalDir.length() < 0.001) return;
    finalDir.normalize();

    const moveX = new THREE.Vector3(finalDir.x * this.speed * dt, 0, 0);
    const moveZ = new THREE.Vector3(0, 0, finalDir.z * this.speed * dt);

    const tryMove = (move) => {
      this.container.position.add(move);
      const box = new THREE.Box3().setFromCenterAndSize(
        this.container.position.clone().add(new THREE.Vector3(0, this.spawnSize.y / 2, 0)),
        this.spawnSize
      );
      const blocked =
        this.collidables.some(obj => box.intersectsBox(new THREE.Box3().setFromObject(obj))) ||
        allZombies.some(other =>
          other !== this && !other.isDead &&
          !other.hitbox.isEmpty() && box.intersectsBox(other.hitbox)
        );
      if (blocked) this.container.position.sub(move);
    };

    tryMove(moveX);
    tryMove(moveZ);

    this.container.lookAt(
      new THREE.Vector3(this.playerPosition.x, this.container.position.y, this.playerPosition.z)
    );
  }

  attackPlayer() {
    if (!this.player || this.player.isDead) return;
    if (!this.hitbox.intersectsBox(this.player.PlayerHitBox)) return;
    const now = performance.now();
    if (now - this.lastAttackAt < this.attackCooldown) return;
    this.lastAttackAt = now;
    this.player.takeDamage(this.damage);
  }
}