import * as THREE from 'three';

// ── Hitmarker DOM ─────────────────────────────────────────────
const hitmarker = document.createElement('div');
hitmarker.style.cssText = `
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.05s;
`;
hitmarker.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24">
    <line x1="0"  y1="0"  x2="8"  y2="8"  stroke="white" stroke-width="2.5"/>
    <line x1="16" y1="0"  x2="8"  y2="8"  stroke="white" stroke-width="2.5"/>
    <line x1="0"  y1="16" x2="8"  y2="8"  stroke="white" stroke-width="2.5"/>
    <line x1="16" y1="16" x2="8"  y2="8"  stroke="white" stroke-width="2.5"/>
  </svg>`;
document.body.appendChild(hitmarker);

let hitmarkerTimeout = null;

function showHitmarker(kill = false) {
  const color = kill ? '#ff4444' : 'white';
  hitmarker.querySelectorAll('line').forEach(l => l.setAttribute('stroke', color));
  hitmarker.style.opacity = '1';
  if (hitmarkerTimeout) clearTimeout(hitmarkerTimeout);
  hitmarkerTimeout = setTimeout(() => { hitmarker.style.opacity = '0'; }, 120);
}

// ── ShootingSystem ────────────────────────────────────────────
export class ShootingSystem {
  constructor(camera, controls, collidables, zombies, player) {
    this.camera     = camera;
    this.controls   = controls;
    this.collidables = collidables;
    this.zombies    = zombies;
    this.player     = player;

    this.raycaster  = new THREE.Raycaster();
    this.canShoot   = true;
    this.fireRate   = 400;

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) this._shoot();
    });
  }

  _shoot() {
    if (!this.controls.isLocked || !this.canShoot || this.player.isReloading) return;

    if (this.player.currentAmmo <= 0) {
      console.log("Plus de balles ! Appuyez sur R");
      return;
    }

    this.canShoot = false;
    this.player.currentAmmo--;
    this.player.updateHUD();

    if (this.player.playShootAnimation) this.player.playShootAnimation();

    // Raycasting
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const wallHits = this.raycaster.intersectObjects(this.collidables, true);

    let hit = false;
    let kill = false;

    this.zombies.forEach(zombie => {
      if (zombie.isDead || !zombie.model) return;

      const zombieDist = this.camera.position.distanceTo(zombie.container.position);
      const wallBlocking = wallHits.some(h => h.distance < zombieDist);
      if (wallBlocking) return;

      if (this.raycaster.ray.intersectsBox(zombie.hitbox)) {
        hit = true;
        if (!zombie.isDead) {
          zombie.die();
          kill = true;
        }
      }
    });

    if (hit) showHitmarker(kill);

    setTimeout(() => { this.canShoot = true; }, this.fireRate);
  }
}