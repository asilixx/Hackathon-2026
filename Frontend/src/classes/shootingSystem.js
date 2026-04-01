import * as THREE from 'three';

export class ShootingSystem {
  constructor(camera, controls, collidables, zombies, player) {
    this.camera = camera;
    this.controls = controls;
    this.collidables = collidables;
    this.zombies = zombies;
    this.player = player; 
    
    this.raycaster = new THREE.Raycaster();
    
    // --- Paramètres de tir ---
    this.canShoot = true;
    this.fireRate = 400;

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._shoot();
    });
  }

  _shoot() {
    // 1. Vérifications de sécurité (On ajoute le check des munitions et du reload)
    if (!this.controls.isLocked || !this.canShoot || this.player.isReloading) return;

    // 2. Vérification du chargeur
    if (this.player.currentAmmo <= 0) {
      console.log("Plus de balles ! Appuyez sur R");
      // Optionnel : lancer le reload automatiquement si tu veux
      // this.player.reload(); 
      return;
    }

    // 3. Activer le Cooldown et consommer une balle
    this.canShoot = false;
    this.player.currentAmmo--; // On retire la balle
    this.player.updateHUD();   // On met à jour l'affichage immédiatement

    // 4. Lancer l'animation visuelle de l'arme sur le Player
    if (this.player && this.player.playShootAnimation) {
      this.player.playShootAnimation();
    }

    // 5. Logique de calcul du tir (Raycasting)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const wallHits = this.raycaster.intersectObjects(this.collidables, true);

    this.zombies.forEach(zombie => {
      if (zombie.isDead || !zombie.model) return;

      const zombieDistance = this.camera.position.distanceTo(zombie.model.position);
      const wallBlocking = wallHits.some(hit => hit.distance < zombieDistance);

      if (wallBlocking) return;

      if (this.raycaster.ray.intersectsBox(zombie.hitbox)) {
        console.log('Zombie touché !');
        zombie.die(); 
      }
    });

    // 6. Reset du Cooldown
    setTimeout(() => {
      this.canShoot = true;
    }, this.fireRate);
  }
}