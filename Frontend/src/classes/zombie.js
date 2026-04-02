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

// Liste globale de tous les zombies vivants (pour la séparation)
export const allZombies = [];

const SEPARATION_RADIUS = 1.4;  // distance en dessous de laquelle on se repousse
const SEPARATION_FORCE  = 3.0;  // intensité de la répulsion

export class Zombie {
  constructor(scene, options = {}) {
    this.scene          = scene;
    this.collidables    = options.collidables ?? [];
    this.playerPosition = options.playerPosition ?? null;
    this.player         = options.player ?? null;
    this.spawnSize      = new THREE.Vector3(1.2, 3, 1.2);
    this.arenaLimit     = options.arenaLimit ?? 24;
    this.playerMinDistance = options.playerMinDistance ?? 8;
    this.speed          = options.speed ?? 2;
    this.damage         = options.damage ?? 10;
    this.attackCooldown = options.attackCooldown ?? 800;
    this.lastAttackAt   = 0;

    this.container = new THREE.Group();
    this.container.position.copy(this.getSpawnPosition());
    this.scene.add(this.container);

    this.mixer  = null;
    this.model  = null;
    this.hitbox = new THREE.Box3();
    this.isDead = false;

    // Hitbox debug (commenter pour la prod)
    // this.hitboxHelper = new THREE.Box3Helper(this.hitbox, 0xff0000);
    // scene.add(this.hitboxHelper);

    allZombies.push(this);
    this.initModel();
  }

  async initModel() {
    try {
      if (!zombieModel) await zombieModelPromise;
      if (this.isDead || !zombieModel) return;

      this.model = clone(zombieModel);
      this.container.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);
      if (zombieAnimations.length > 0) {
        this.mixer.clipAction(zombieAnimations[0]).play();
      }
    } catch (err) {
      console.error("Impossible de charger le zombie :", err);
    }
  }

  getSpawnPosition() {
    const spawnBox = new THREE.Box3();
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const z = THREE.MathUtils.randFloatSpread(this.arenaLimit * 2);
      const pos = new THREE.Vector3(x, 0, z);

      if (this.playerPosition && pos.distanceTo(this.playerPosition) < this.playerMinDistance) continue;

      spawnBox.setFromCenterAndSize(new THREE.Vector3(x, this.spawnSize.y / 2, z), this.spawnSize);
      const collides = this.collidables.some(obj =>
        spawnBox.intersectsBox(new THREE.Box3().setFromObject(obj))
      );
      if (!collides) return pos;
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
    this.attackPlayer();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    // Retire de la liste globale
    const idx = allZombies.indexOf(this);
    if (idx !== -1) allZombies.splice(idx, 1);

    this.scene.remove(this.container);
    if (this.hitboxHelper) this.scene.remove(this.hitboxHelper);
  }

  move(dt) {
    if (!this.playerPosition || !this.model) return;

    // ── 1. Direction vers le joueur ──────────────────────────
    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.container.position)
      .setY(0);

    const distToPlayer = toPlayer.length();
    const dirToPlayer = toPlayer.clone().normalize();

    // ── 2. Séparation entre zombies ──────────────────────────
    const separation = new THREE.Vector3();

    for (const other of allZombies) {
      if (other === this || other.isDead) continue;

      const diff = new THREE.Vector3()
        .subVectors(this.container.position, other.container.position)
        .setY(0);

      const dist = diff.length();
      if (dist < SEPARATION_RADIUS && dist > 0.001) {
        // Plus c'est proche, plus la force est grande
        separation.addScaledVector(diff.normalize(), (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS);
      }
    }

    // ── 3. Direction finale = vers joueur + répulsion ────────
    const finalDir = new THREE.Vector3();

    // Ne pas avancer si on est déjà collé au joueur (évite le tremblement)
    if (distToPlayer > 1.0) {
      finalDir.addScaledVector(dirToPlayer, 1.0);
    }
    finalDir.addScaledVector(separation, SEPARATION_FORCE * dt);
    finalDir.setY(0);

    if (finalDir.length() < 0.001) return;
    finalDir.normalize();

    // ── 4. Appliquer le mouvement avec collisions murs ───────
    const moveX = new THREE.Vector3(finalDir.x, 0, 0).multiplyScalar(this.speed * dt);
    const moveZ = new THREE.Vector3(0, 0, finalDir.z).multiplyScalar(this.speed * dt);

    const tryMove = (move) => {
      this.container.position.add(move);
      const box = new THREE.Box3().setFromCenterAndSize(
        this.container.position.clone().add(new THREE.Vector3(0, this.spawnSize.y / 2, 0)),
        this.spawnSize
      );
      const blocked = this.collidables.some(obj =>
        box.intersectsBox(new THREE.Box3().setFromObject(obj))
      );
      if (blocked) this.container.position.sub(move);
    };

    tryMove(moveX);
    tryMove(moveZ);

    // ── 5. Orientation vers le joueur ────────────────────────
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