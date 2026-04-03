import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Player {
  constructor(camera, scene, collisionManager, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.collisionManager = collisionManager;

    this.health = 100;
    this.maxHealth = 100;
    this.isDead = false;
    this.isReloading = false;

    this.playerDirection = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight = 0;
    this.PlayerSpeed = 5;
    this.PlayerHitBox = new THREE.Box3();
    this.velocityY = 0;
    this.Gravity = 9.8;
    this.onground = false;

    // Sprint
    this.isSprinting = false;
    this.stamina = 100;
    this.maxStamina = 100;
    this.sprintSpeed = 9;
    this.staminaDrain = 25;
    this.staminaRegen = 15;

    // Arme unique — plus de système de changement
    this.currentWeapon = { damage: 1, fireRate: 0.28 };
    this.ammoPerClip = 12;
    this.currentAmmo = 12;
    this.totalAmmo = 10000;

    this.mixer = null;

    this.scene.add(this.camera);
    this._loadWeapon();
    this._initEventListeners();
    this._createStaminaBar();
    this.updateHUD();
  }

  _createStaminaBar() {
    const container = document.getElementById('health-container');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 100%; height: 8px;
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.4);
      margin-top: 4px;
    `;
    this.staminaFill = document.createElement('div');
    this.staminaFill.style.cssText = `
      width: 100%; height: 100%;
      background: #00aaff;
      transition: width 0.1s, background 0.3s;
    `;
    wrapper.appendChild(this.staminaFill);
    container.parentNode.insertBefore(wrapper, container.nextSibling);

    const label = document.createElement('div');
    label.style.cssText = `
      color: rgba(255,255,255,0.6);
      font-family: 'Courier New', monospace;
      font-size: 10px; letter-spacing: 0.1em; margin-top: 2px;
    `;
    label.textContent = 'ENDURANCE';
    container.parentNode.insertBefore(label, wrapper.nextSibling);
  }

  _updateStaminaBar() {
    if (!this.staminaFill) return;
    const pct = (this.stamina / this.maxStamina) * 100;
    this.staminaFill.style.width = pct + '%';
    this.staminaFill.style.background =
      pct < 25 ? '#ff4400' : pct < 60 ? '#ffaa00' : '#00aaff';
  }

  _loadWeapon() {
    const loader = new GLTFLoader();
    loader.load("/heavy_pistol_animated/scene.gltf", (gltf) => {
      this.weaponMesh = gltf.scene;
      this.camera.add(this.weaponMesh);
      this.weaponMesh.scale.set(0.03, 0.03, 0.03);
      this.weaponMesh.position.set(0.6, -0.4, -0.9);
      this.weaponMesh.rotation.y = Math.PI + 0.2;

      this.mixer = new THREE.AnimationMixer(this.weaponMesh);
      const mainAction = this.mixer.clipAction(gltf.animations[0]);
      this.mainAction = mainAction;
      mainAction.play();
      mainAction.paused = true;
    });
  }

  playShootAnimation() {
    if (this.isReloading || !this.weaponMesh) return;
    // Recul
    this.weaponMesh.position.z += 0.05;
    setTimeout(() => { if (this.weaponMesh) this.weaponMesh.position.z -= 0.05; }, 55);
  }

  reload() {
    if (this.isReloading || this.currentAmmo === this.ammoPerClip || this.totalAmmo <= 0) return;
    this.isReloading = true;

    if (this.mainAction) {
      this.mainAction.paused = false;
      this.mainAction.time = 1.0;
      this.mainAction.play();
      this.mainAction.timeScale = 1;
    }

    setTimeout(() => {
      const needed     = this.ammoPerClip - this.currentAmmo;
      const toTransfer = Math.min(needed, this.totalAmmo);
      this.currentAmmo  += toTransfer;
      this.totalAmmo    -= toTransfer;
      if (this.mainAction) { this.mainAction.paused = true; this.mainAction.time = 0; }
      this.isReloading = false;
      this.updateHUD();
    }, 2000);
  }

  _initEventListeners() {
    document.body.addEventListener("click", (event) => {
      const menuVisible      = document.getElementById("main-menu")?.style.display !== "none";
      const activeSubPage    = document.querySelector(".sub-page.active");
      const quitConfirmOpen  = document.getElementById("quit-confirm")?.classList.contains("active");
      if (menuVisible || activeSubPage || quitConfirmOpen ||
          event.target.closest("input, button, textarea, select, label")) return;
      this.controls.lock();
    });

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": this.PlayerSpeedFoward =  1; break;
        case "KeyA": this.PlayerSpeedRight  = -1; break;
        case "KeyD": this.PlayerSpeedRight  =  1; break;
        case "KeyS": this.PlayerSpeedFoward = -1; break;
        case "KeyR": this.reload(); break;
        case "ShiftLeft": case "ShiftRight": this.isSprinting = true; break;
        case "Space":
          if (this.onground) { this.velocityY = 4; this.onground = false; }
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW": case "KeyS": this.PlayerSpeedFoward = 0; break;
        case "KeyA": case "KeyD": this.PlayerSpeedRight  = 0; break;
        case "ShiftLeft": case "ShiftRight": this.isSprinting = false; break;
      }
    });
  }

  update(dt) {
    if (this.isDead) return;

    // Sprint & stamina
    const moving    = this.PlayerSpeedFoward !== 0 || this.PlayerSpeedRight !== 0;
    const canSprint = this.isSprinting && moving && this.stamina > 0;
    const speed     = canSprint ? this.sprintSpeed : this.PlayerSpeed;

    this.stamina = canSprint
      ? Math.max(0, this.stamina - this.staminaDrain * dt)
      : Math.min(this.maxStamina, this.stamina + this.staminaRegen * dt);
    this._updateStaminaBar();

    // FOV dynamique
    const targetFOV = canSprint ? 85 : 75;
    this.camera.fov += (targetFOV - this.camera.fov) * 0.1;
    this.camera.updateProjectionMatrix();

    // Mouvement
    this.controls.getDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    const prevPos = this.camera.position.clone();
    this.camera.position.addScaledVector(this.playerDirection, this.PlayerSpeedFoward * speed * dt);
    this.right.crossVectors(this.playerDirection, this.camera.up).normalize();
    this.camera.position.addScaledVector(this.right, this.PlayerSpeedRight * speed * dt);

    this.PlayerHitBox.setFromCenterAndSize(this.camera.position, new THREE.Vector3(1, 2, 1));
    if (this.collisionManager.check(this.PlayerHitBox)) this.camera.position.copy(prevPos);

    this.velocityY -= this.Gravity * dt;
    this.camera.position.y += this.velocityY * dt;
    if (this.camera.position.y < 2.5) {
      this.camera.position.y = 2.5;
      this.velocityY = 0;
      this.onground  = true;
    }

    if (this.mixer) this.mixer.update(dt);
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.health = Math.max(0, this.health - amount);
    this.updateHUD();
    this._flashDamage();
    if (this.health === 0) this.die();
  }

  _flashDamage() {
    let flash = document.getElementById('damage-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'damage-flash';
      flash.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(200,0,0,0.35);
        pointer-events: none; z-index: 9990;
        opacity: 0; transition: opacity 0.05s;
      `;
      document.body.appendChild(flash);
    }
    flash.style.opacity = '1';
    setTimeout(() => { flash.style.opacity = '0'; }, 150);
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight  = 0;
    if (this.controls.isLocked) this.controls.unlock();

    const mainMenu = document.getElementById("main-menu");
    if (mainMenu) mainMenu.style.display = "flex";

    ['crosshair', 'hud', 'ui', 'wave-indicator'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    if (typeof this.onDeath === "function") this.onDeath();
  }

  reset() {
    this.health          = this.maxHealth;
    this.isDead          = false;
    this.isReloading     = false;
    this.PlayerSpeedFoward = 0;
    this.PlayerSpeedRight  = 0;
    this.velocityY       = 0;
    this.onground        = true;
    this.stamina         = this.maxStamina;
    this.currentAmmo     = this.ammoPerClip;
    this.camera.fov      = 75;
    this.camera.updateProjectionMatrix();
    this.updateHUD();
  }

  updateHUD() {
    const healthBar = document.getElementById("health-bar-fill");
    if (healthBar) healthBar.style.width = (this.health / this.maxHealth * 100) + "%";
    const ammoCurr = document.getElementById("ammo-current");
    const ammoTot  = document.getElementById("ammo-total");
    if (ammoCurr) ammoCurr.innerText = this.currentAmmo;
    if (ammoTot)  ammoTot.innerText  = this.totalAmmo;
  }
}