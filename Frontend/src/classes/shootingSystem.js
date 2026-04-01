import * as THREE from 'three';

export class ShootingSystem {
  constructor(camera, controls, collidables, zombies, player) {
    this.camera = camera;
    this.controls = controls;
    this.collidables = collidables;
    this.zombies = zombies;
    this.player = player; // On récupère le player pour l'animation
    
    this.raycaster = new THREE.Raycaster();
    
    // --- Paramètres de tir ---
    this.canShoot = true;
    this.fireRate = 400; // Temps en millisecondes entre deux tirs (0.4s)

    document.addEventListener('mousedown', (e) => {
      // On tire seulement sur le clic gauche (bouton 0)
      if (e.button === 0) this._shoot();
    });
  }

  _shoot() {
    // 1. Vérifications de sécurité
    if (!this.controls.isLocked || !this.canShoot) return;

    // 2. Activer le Cooldown
    this.canShoot = false;
    
    // 3. Lancer l'animation visuelle de l'arme sur le Player
    if (this.player && this.player.playShootAnimation) {
      this.player.playShootAnimation();
    }

    // 4. Logique de calcul du tir (Raycasting)
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // On récupère toutes les intersections avec les murs
    const wallHits = this.raycaster.intersectObjects(this.collidables, true);

    this.zombies.forEach(zombie => {
      if (zombie.isDead || !zombie.model) return;

      // Calcul de la distance pour savoir si un mur est devant le zombie
      const zombieDistance = this.camera.position.distanceTo(zombie.model.position);
      const wallBlocking = wallHits.some(hit => hit.distance < zombieDistance);

      if (wallBlocking) return;

      // Vérification de l'impact sur la hitbox du zombie
      if (this.raycaster.ray.intersectsBox(zombie.hitbox)) {
        console.log('Zombie touché !');
        zombie.die(); 
      }
    });

    // 5. Reset du Cooldown après le délai
    setTimeout(() => {
      this.canShoot = true;
    }, this.fireRate);
  }
}