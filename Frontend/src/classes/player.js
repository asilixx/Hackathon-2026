import * as THREE from "three";

export class Player {
  constructor(camera, scene, collisionManager, controls) {
    this.scene = scene;
    this.controls = controls;
    this.camera = camera;
    this.collisionManager = collisionManager;
    
    // --- Stats ---
    this.health = 100;
    this.maxHealth = 100;

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

    // --- Arme Visuelle ---
    this.weaponGroup = new THREE.Group();
    this._createWeapon();
    this.camera.add(this.weaponGroup); // L'arme bouge avec la vue
    // Note: Assure-toi que la caméra est déjà ajoutée à la scène dans ton main.js

    // Hitbox Debug
    this.hitbox = new THREE.Box3Helper(this.PlayerHitBox, 0xffff00);
    scene.add(this.hitbox);

    this._initEventListeners();
  }

  _createWeapon() {
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.15, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    
    // Le canon
    const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.3;
    gunBody.add(barrel);

    // Positionner l'arme en bas à droite du champ de vision
    this.weaponGroup.position.set(0.35, -0.25, -0.5);
    this.weaponGroup.add(gunBody);
  }

  // --- Animation de tir (Recul / Kickback) ---
  playShootAnimation() {
    // Recul rapide vers l'arrière
    this.weaponGroup.position.z += 0.08;
    this.weaponGroup.rotation.x -= 0.1;

    // Retour à la normale fluide
    setTimeout(() => {
      this.weaponGroup.position.z -= 0.08;
      this.weaponGroup.rotation.x += 0.1;
    }, 50);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.updateHUD();
    if (this.health <= 0) {
        alert("GAME OVER");
        location.reload(); // Simple reset pour l'instant
    }
  }

  updateHUD() {
    const bar = document.getElementById('health-bar');
    if (bar) {
        const percent = (this.health / this.maxHealth) * 100;
        bar.style.width = Math.max(0, percent) + "%";
    }
  }

  _initEventListeners() {
    document.body.addEventListener("click", () => this.controls.lock());

    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW": this.PlayerSpeedFoward = 1; break;
        case "KeyA": this.PlayerSpeedRight = -1; break;
        case "KeyD": this.PlayerSpeedRight = 1; break;
        case "KeyS": this.PlayerSpeedFoward = -1; break;
        case "Space": 
          if (this.onGround) {
            this.velocityY = 4.5; 
            this.onGround = false;
          }
          break;
      }
    });

    document.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW": this.PlayerSpeedFoward = 0; break;
        case "KeyA": this.PlayerSpeedRight = 0; break;
        case "KeyD": this.PlayerSpeedRight = 0; break;
        case "KeyS": this.PlayerSpeedFoward = 0; break;
      }
    });
  }

  update(dt) {
    this.controls.getDirection(this.playerDirection);
    this.playerDirection.y = 0;
    this.playerDirection.normalize();

    const previousPosition = this.camera.position.clone();

    // Avancer/Reculer
    this.camera.position.addScaledVector(this.playerDirection, this.PlayerSpeedFoward * this.PlayerSpeed * dt);
    
    // Latéral
    this.right.crossVectors(this.playerDirection, this.camera.up).normalize();
    this.camera.position.addScaledVector(this.right, this.PlayerSpeedRight * this.PlayerSpeed * dt);

    // Hitbox Update
    this.PlayerHitBox.setFromCenterAndSize(
      this.camera.position,
      new THREE.Vector3(1, 2, 1)
    );

    // Collision
    if (this.collisionManager.check(this.PlayerHitBox)) {
      this.camera.position.copy(previousPosition);
    }

    // Gravité
    this.velocityY -= this.Gravity * dt;
    this.camera.position.y += this.velocityY * dt;

    // Sol (Ajusté pour la taille de la hitbox)
    if (this.camera.position.y < 2.5) {
      this.camera.position.y = 2.5;
      this.velocityY = 0;
      this.onGround = true;
    }
  }
}