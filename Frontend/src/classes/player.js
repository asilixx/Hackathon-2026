import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Player {
  constructor(camera, scene, collisionManager, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.collisionManager = collisionManager;

    // --- Stats ---
    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.isReloading = false;

    // --- Mouvement ---
    this.playerDirection = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight = 0;
    this.PlayerSpeed = 5;
    this.PlayerHitBox = new THREE.Box3();
    this.velocityY = 0;
    this.Gravity = 9.8;
    this.onGround = false;

    // Ammo
    this.ammoPerClip = 12; // Capacité du chargeur
    this.currentAmmo = 12; // Balles restantes dans le chargeur
    this.totalAmmo = 10000; // Réserve totale
    this.isReloading = false;

    // --- Système d'Animation ---
    this.mixer = null;
    this.animations = {}; // Stocke 'shoot', 'reload', 'idle'

    // On ajoute la caméra à la scène (obligatoire pour voir les enfants de la caméra)
    this.scene.add(this.camera);

    // Chargement de l'arme
    this._loadWeapon();

    // Hitbox Debug
    // this.hitbox = new THREE.Box3Helper(this.PlayerHitBox, 0xffff00);
    // this.scene.add(this.hitbox);

    this._initEventListeners();
    this.updateHUD();
  }

  _loadWeapon() {
    const loader = new GLTFLoader();
    // REMPLACE par le chemin exact de ton fichier dans /public
    loader.load("/heavy_pistol_animated/scene.gltf", (gltf) => {
      this.weaponMesh = gltf.scene;
      this.camera.add(this.weaponMesh);

      this.weaponMesh.scale.set(0.03, 0.03, 0.03);
      this.weaponMesh.position.set(0.6, -0.4, -0.9);
      this.weaponMesh.rotation.y = Math.PI + 0.2;

      // --- Gestion de l'animation unique ---
      this.mixer = new THREE.AnimationMixer(this.weaponMesh);
      const mainAction = this.mixer.clipAction(gltf.animations[0]); // C'est "allanims"
      this.mainAction = mainAction;

      // On la prépare mais on ne la joue pas en boucle
      mainAction.play();
      mainAction.paused = true; // On attend un clic
    });
  }

  // --- Actions ---
  playShootAnimation() {
    if (this.isReloading) return;

    const shootAnim = this.animations["shoot"] || this.animations["fire"];
    if (shootAnim) {
      shootAnim.reset().setLoop(THREE.LoopOnce).play();
    } else {
      // Recul manuel si pas d'animation dans le fichier
      this.weaponMesh.position.z += 0.05;
      setTimeout(() => {
        if (this.weaponMesh) this.weaponMesh.position.z -= 0.05;
      }, 50);
    }
  }

  reload() {
    // Sécurités habituelles
    if (
      this.isReloading ||
      this.currentAmmo === this.ammoPerClip ||
      this.totalAmmo <= 0
    )
      return;

    this.isReloading = true;

    if (this.mainAction) {
      this.mainAction.paused = false;
      this.mainAction.time = 1.0; // Ton début de reload
      this.mainAction.play();

      // On peut forcer la vitesse si c'est trop lent
      this.mainAction.timeScale = 1;
    }

    // Durée exacte de l'animation de reload (ex: 2 secondes)
    const durationAnim = 2000;

    setTimeout(() => {
      // --- LOGIQUE DE REMPLISSAGE ---
      const needed = this.ammoPerClip - this.currentAmmo;
      const toTransfer = Math.min(needed, this.totalAmmo);
      this.currentAmmo += toTransfer;
      this.totalAmmo -= toTransfer;

      // --- RESET DE L'ARME ---
      if (this.mainAction) {
        this.mainAction.paused = true;
        this.mainAction.time = 0; // REVIENT AU REPOS (TRÈS IMPORTANT)
      }

      this.isReloading = false;
      this.updateHUD();
    }, durationAnim);
  }

  _initEventListeners() {
    document.body.addEventListener("click", (event) => {
      const target = event.target;
      const menuVisible =
        document.getElementById("main-menu")?.style.display !== "none";
      const activeSubPage = document.querySelector(".sub-page.active");
      const quitConfirmOpen =
        document.getElementById("quit-confirm")?.classList.contains("active");

      if (
        menuVisible ||
        activeSubPage ||
        quitConfirmOpen ||
        target.closest("input, button, textarea, select, label")
      ) {
        return;
      }

      this.controls.lock();
    });

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW":
          this.PlayerSpeedFoward = 1;
          break;
        case "KeyA":
          this.PlayerSpeedRight = -1;
          break;
        case "KeyD":
          this.PlayerSpeedRight = 1;
          break;
        case "KeyS":
          this.PlayerSpeedFoward = -1;
          break;
        case "KeyR":
          this.reload();
          break; // Touche R pour recharger
        case "Space":
          if (this.onGround) {
            this.velocityY = 4;
            this.onGround = false;
          }
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
        case "KeyS":
          this.PlayerSpeedFoward = 0;
          break;
        case "KeyA":
        case "KeyD":
          this.PlayerSpeedRight = 0;
          break;
      }
    });
  }

  update(dt) {
    if (this.isDead) {
      return;
    }

    // 1. Mouvement
    this.controls.getDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    const prevPos = this.camera.position.clone();
    this.camera.position.addScaledVector(
      this.playerDirection,
      this.PlayerSpeedFoward * this.PlayerSpeed * dt,
    );
    this.right.crossVectors(this.playerDirection, this.camera.up).normalize();
    this.camera.position.addScaledVector(
      this.right,
      this.PlayerSpeedRight * this.PlayerSpeed * dt,
    );

    // 2. Physique & Collisions
    this.PlayerHitBox.setFromCenterAndSize(
      this.camera.position,
      new THREE.Vector3(1, 2, 1),
    );
    if (this.collisionManager.check(this.PlayerHitBox)) {
      this.camera.position.copy(prevPos);
    }

    this.velocityY -= this.Gravity * dt;
    this.camera.position.y += this.velocityY * dt;

    if (this.camera.position.y < 2.5) {
      this.camera.position.y = 2.5;
      this.velocityY = 0;
      this.onGround = true;
    }

    if (this.mixer) {
      this.mixer.update(dt);
    }
  }

  takeDamage(amount) {
    if (this.isDead) {
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.updateHUD();

    if (this.health === 0) {
      this.die();
    }
  }

  die() {
    if (this.isDead) {
      return;
    }

    this.isDead = true;
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight = 0;

    if (this.controls.isLocked) {
      this.controls.unlock();
    }

    const mainMenu = document.getElementById("main-menu");
    if (mainMenu) {
      mainMenu.style.display = "flex";
    }

    const nameError = document.getElementById("player-name-error");
    if (nameError) {
      nameError.textContent = "Partie terminee. Score enregistre a la mort.";
    }

    const crosshair = document.getElementById("crosshair");
    const hud = document.getElementById("hud");
    const ui = document.getElementById("ui");
    const waveIndicator = document.getElementById("wave-indicator");

    if (crosshair) crosshair.style.display = "none";
    if (hud) hud.style.display = "none";
    if (ui) ui.style.display = "none";
    if (waveIndicator) waveIndicator.style.display = "none";

    if (typeof this.onDeath === "function") {
      this.onDeath();
    }
  }

  reset() {
    this.health = this.maxHealth;
    this.isDead = false;
    this.isReloading = false;
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.currentAmmo = this.ammoPerClip;
    this.updateHUD();
  }

  updateHUD() {
    const healthBar = document.getElementById("health-bar-fill");
    if (healthBar) {
      const healthPercent = (this.health / this.maxHealth) * 100;
      healthBar.style.width = healthPercent + "%";
    }

    const ammoCurr = document.getElementById("ammo-current");
    const ammoTot = document.getElementById("ammo-total");
    if (ammoCurr) ammoCurr.innerText = this.currentAmmo;
    if (ammoTot) ammoTot.innerText = this.totalAmmo;
  }
}
