import * as THREE from 'three';

// ── Hitmarker ─────────────────────────────────────────────────
const hitmarker = document.createElement('div');
hitmarker.style.cssText = `
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none; z-index: 9999; opacity: 0;
  transition: opacity 0.05s;
`;
hitmarker.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24">
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

// ── Kill Feed ─────────────────────────────────────────────────
const killFeed = document.createElement('div');
killFeed.style.cssText = `
  position: fixed; top: 80px; right: 20px;
  display: flex; flex-direction: column; gap: 4px;
  pointer-events: none; z-index: 9998;
  font-family: 'Courier New', monospace;
`;
document.body.appendChild(killFeed);

function showKillFeed(type = 'normal') {
  const icons  = { normal: '☠', fast: '⚡☠', tank: '💀' };
  const colors = { normal: '#ff4444', fast: '#ff8800', tank: '#aa00ff' };
  const el = document.createElement('div');
  el.style.cssText = `
    color: ${colors[type] || '#ff4444'};
    font-size: 13px; font-weight: bold;
    text-shadow: 1px 1px 2px #000;
    animation: killFeedAnim 2s forwards;
    letter-spacing: 0.05em;
  `;
  el.textContent = `${icons[type] || '☠'} ZOMBIE ÉLIMINÉ`;
  killFeed.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

if (!document.getElementById('killfeed-style')) {
  const style = document.createElement('style');
  style.id = 'killfeed-style';
  style.textContent = `
    @keyframes killFeedAnim {
      0%   { opacity: 0; transform: translateX(20px); }
      15%  { opacity: 1; transform: translateX(0); }
      70%  { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ── Particules de sang ────────────────────────────────────────
export class BloodParticleSystem {
  constructor(scene) {
    this.scene = scene;
    const count = 300;
    this.count      = count;
    this.positions  = new Float32Array(count * 3);
    this.velocities = Array.from({ length: count }, () => new THREE.Vector3());
    this.lifetimes  = new Float32Array(count);
    this.active     = new Uint8Array(count);

    // Tout hors vue au départ
    for (let i = 0; i < count; i++) this.positions[i * 3 + 1] = -1000;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xcc0000,
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.renderOrder = 999; // s'assure qu'elles sont rendues par-dessus
    this.scene.add(this.points);
  }

  // Émettre 'count' particules depuis 'position'
  emit(position, count = 50) {
    let spawned = 0;
    for (let i = 0; i < this.count && spawned < count; i++) {
      if (this.active[i]) continue;
      this.active[i]    = 1;
      this.lifetimes[i] = 0.8 + Math.random() * 0.5;

      // Position de départ : autour du centre du zombie, à hauteur de poitrine
      this.positions[i * 3]     = position.x + (Math.random() - 0.5) * 0.6;
      this.positions[i * 3 + 1] = position.y + 0.8 + Math.random() * 1.2;
      this.positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.6;

      // Vélocité : explosion dans toutes les directions
      const angle = Math.random() * Math.PI * 2;
      const force = 3 + Math.random() * 4;
      this.velocities[i].set(
        Math.cos(angle) * force,
        2 + Math.random() * 5,
        Math.sin(angle) * force
      );
      spawned++;
    }
    // IMPORTANT : signaler à Three.js que le buffer a changé
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  update(dt) {
    for (let i = 0; i < this.count; i++) {
      if (!this.active[i]) continue;

      this.lifetimes[i] -= dt;
      if (this.lifetimes[i] <= 0) {
        this.active[i] = 0;
        this.positions[i * 3 + 1] = -1000; // cacher hors vue
        continue;
      }

      // Gravité
      this.velocities[i].y -= 14 * dt;

      this.positions[i * 3]     += this.velocities[i].x * dt;
      this.positions[i * 3 + 1] += this.velocities[i].y * dt;
      this.positions[i * 3 + 2] += this.velocities[i].z * dt;

      // Rebond mou au sol
      if (this.positions[i * 3 + 1] < 0.05) {
        this.positions[i * 3 + 1] = 0.05;
        this.velocities[i].y      *= -0.15;
        this.velocities[i].x      *= 0.5;
        this.velocities[i].z      *= 0.5;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

// ── Muzzle Flash ──────────────────────────────────────────────
class MuzzleFlash {
  constructor(scene) {
    this.light    = new THREE.PointLight(0xffaa33, 0, 8);
    this.active   = false;
    this.timer    = 0;
    this.duration = 0.055;
    scene.add(this.light);
  }

  flash(worldPos) {
    this.light.position.copy(worldPos);
    this.light.intensity = 10;
    this.active = true;
    this.timer  = 0;
  }

  update(dt) {
    if (!this.active) return;
    this.timer += dt;
    this.light.intensity = 10 * Math.max(0, 1 - this.timer / this.duration);
    if (this.timer >= this.duration) {
      this.light.intensity = 0;
      this.active = false;
    }
  }
}

// ── ShootingSystem ────────────────────────────────────────────
export class ShootingSystem {
  constructor(camera, controls, collidables, zombies, player, options = {}) {
    this.camera         = camera;
    this.controls       = controls;
    this.collidables    = collidables;
    this.zombies        = zombies;
    this.player         = player;
    this.onZombieKilled = options.onZombieKilled ?? null;
    this.bloodSystem    = options.bloodSystem    ?? null;

    this.raycaster    = new THREE.Raycaster();
    this.lastShotTime = 0;
    this.isShooting   = false;

    // Muzzle flash
    this.muzzleFlash = options.scene ? new MuzzleFlash(options.scene) : null;

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isShooting = true;
        if (this.controls.isLocked) this._tryShoot(); // tir immédiat
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isShooting = false;
    });
  }

  // Appelé depuis la boucle animate avec dt
  update(dt = 0) {
    if (this.isShooting && this.controls.isLocked) this._tryShoot();
    if (this.muzzleFlash) this.muzzleFlash.update(dt);
  }

  _tryShoot() {
    if (!this.controls.isLocked)     return;
    if (this.player.isReloading)     return;
    if (this.player.currentAmmo <= 0) {
      this.player.reload();
      return;
    }

    const now        = performance.now();
    const fireRateMs = (this.player.currentWeapon?.fireRate ?? 0.28) * 1000;
    if (now - this.lastShotTime < fireRateMs) return;

    this.lastShotTime = now;
    this.player.currentAmmo--;
    this.player.updateHUD();
    this.player.playShootAnimation();

    // Muzzle flash au bout du canon
    if (this.muzzleFlash && this.player.weaponMesh) {
      const local = new THREE.Vector3(0.6, -0.3, -1.3);
      const world = local.applyMatrix4(this.camera.matrixWorld);
      this.muzzleFlash.flash(world);
    }

    this._raycast();
  }

  _raycast() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const wallHits = this.raycaster.intersectObjects(this.collidables, true);

    // Construire la liste des meshes 3D de zombies vivants
    const zombieMeshes = [];
    for (const z of this.zombies) {
      if (!z.isDead && z.model) zombieMeshes.push(z.model);
    }

    const zombieHits = this.raycaster.intersectObjects(zombieMeshes, true);

    let hit  = false;
    let kill = false;

    for (const intersection of zombieHits) {
      // Retrouver le zombie propriétaire du mesh touché
      const zombie = this.zombies.find(z =>
        z.model && z.model.getObjectById(intersection.object.id) !== undefined
      );
      if (!zombie || zombie.isDead) continue;

      // Vérifier qu'aucun mur ne bloque
      const dist = this.camera.position.distanceTo(zombie.container.position);
      if (wallHits.some(h => h.distance < dist)) continue;

      hit = true;
      zombie.takeDamage(this.player.currentWeapon?.damage ?? 1);

      if (zombie.isDead) {
        kill = true;
        showKillFeed(zombie.type ?? 'normal');

        // ← PARTICULES DE SANG uniquement sur kill
        if (this.bloodSystem) {
          this.bloodSystem.emit(zombie.container.position.clone(), 50);
        }

        if (typeof this.onZombieKilled === 'function') this.onZombieKilled(zombie);
      }

      break; // un seul zombie par balle
    }

    if (hit) showHitmarker(kill);
  }
}