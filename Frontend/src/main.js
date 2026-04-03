import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Map } from "./classes/map.js";
import { Player } from "./classes/player.js";
import { Zombie } from "./classes/zombie.js";
import { ShootingSystem, BloodParticleSystem } from "./classes/shootingSystem.js";
import { CollisionManager } from "./classes/collisionManager.js";

// ── Scène ─────────────────────────────────────────────────────
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Map & Collisions ──────────────────────────────────────────
const controls = new PointerLockControls(camera, document.body);
const map = new Map(scene);
const collidables = map.getCollidables();
const collisionManager = new CollisionManager(collidables);

// ── Player ────────────────────────────────────────────────────
camera.position.set(0, 2.5, 0);
const player = new Player(camera, scene, collisionManager, controls);

// ── Sang ──────────────────────────────────────────────────────
const bloodSystem = new BloodParticleSystem(scene);

// ── Zombies & Shooting ────────────────────────────────────────
const zombies = [];
let zombiesKilled = 0;

const shootingSystem = new ShootingSystem(camera, controls, collidables, zombies, player, {
  scene,
  bloodSystem,
  onZombieKilled: (zombie) => { 
    zombiesKilled++; 
    killsThisWave++;
    checkWaveEnd(); // Vérifie si c'était le dernier
  },
});

// ── Vagues ────────────────────────────────────────────────────
let wavenum = 1;
let loadingWave = false;
let playerName = "";
let scoreSaved = false;
let killsThisWave = 0;
const waveIndicator = document.getElementById("wave-indicator");

function updateWaveIndicator() {
  if (waveIndicator) waveIndicator.textContent = `VAGUE ${wavenum}`;
}

function fallbackWave(num) {
  const enemies = [{ type: 'normal', count: 2 + num * 2, speed: 1.5 + num * 0.2, hp: 1 }];
  if (num >= 3) enemies.push({ type: 'fast', count: Math.floor(num * 1.5), speed: 2.8 + num * 0.3, hp: 1 });
  if (num >= 6) enemies.push({ type: 'tank', count: Math.floor(num * 0.5), speed: 1.0, hp: 3 + num });
  return { enemies };
}

// ── Écran entre les vagues ────────────────────────────────────
function showWaveClear(waveNum, kills, onNext) {
  controls.unlock();
  
  let overlay = document.getElementById('wave-clear-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'wave-clear-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      z-index: 500; font-family: 'Courier New', monospace;
      color: white; gap: 1rem;
    `;
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div style="font-size:2rem; color:#39d353; text-shadow: 0 0 20px #39d353; letter-spacing:0.2em;">
      ✓ VAGUE ${waveNum} TERMINÉE
    </div>
    <div style="font-size:1rem; color:rgba(255,255,255,0.6); letter-spacing:0.1em;">
      ${kills} zombies éliminés cette vague
    </div>
    <div style="
      margin-top:1rem; padding: 0.8rem 2rem;
      border: 1px solid #39d353; color: #39d353;
      font-size:0.9rem; letter-spacing:0.2em;
      cursor:pointer; transition: all 0.2s;
    " id="next-wave-btn">
      ► VAGUE ${waveNum + 1}
    </div>
  `;
  overlay.style.display = 'flex';

  const btn = document.getElementById('next-wave-btn');
  btn.onclick = () => {
    overlay.style.display = 'none';
    wavenum++;
    loadWave();
    controls.lock();
  };
}

async function saveScore() {
  if (scoreSaved || !playerName) return;
  scoreSaved = true;
  try {
    await fetch("http://localhost:3000/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pseudo: playerName, score: zombiesKilled, wave: wavenum, zombiesKilled }),
    });
  } catch (err) {
    console.warn("Score non sauvegardé:", err.message);
  }
}

function resetGame() {
  for (const z of zombies) z.die();
  zombies.length = 0;
  wavenum = 1;
  loadingWave = false;
  scoreSaved = false;
  zombiesKilled = 0;
  camera.position.set(0, 2.5, 0);
  player.reset();
  updateWaveIndicator();
  const overlay = document.getElementById('wave-clear-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function loadWave() {
  loadingWave = true;
  killsThisWave = 0;
  updateWaveIndicator();

  let wave;
  try {
    const response = await fetch(`http://localhost:3000/waves/${wavenum}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error();
    wave = await response.json();
  } catch {
    wave = fallbackWave(wavenum);
  }

  console.log(`Loading wave ${wavenum}:`, wave);

  for (const enemyData of wave.enemies) {
    const type = enemyData.name ?? enemyData.type ?? 'normal';
    for (let i = 0; i < enemyData.count; i++) {
      const zombie = new Zombie(scene, {
        collidables,
        playerPosition: camera.position,
        player,
        type,
        speed: enemyData.speed ?? 1.5,
        hp: enemyData.hp ?? 1,
        onDeath: null // On gère maintenant via shootingSystem.onZombieKilled
      });
      zombies.push(zombie);
    }
  }
  loadingWave = false;
}

function checkWaveEnd() {
  if (loadingWave) return;
  const aliveZombies = zombies.filter(z => !z.isDead);
  if (zombies.length > 0 && aliveZombies.length === 0) {
    setTimeout(() => {
      showWaveClear(wavenum, killsThisWave, () => {});
    }, 500);
  }
}

// ── Démarrage ─────────────────────────────────────────────────
let gameStarted = false;

window.addEventListener("game:start", (event) => {
  playerName = event.detail?.playerName?.trim() ?? "";
  if (!gameStarted) {
    gameStarted = true;
  } else {
    resetGame();
  }
  controls.lock();
  loadWave();
});

player.onDeath = () => { saveScore(); };

// ── Boucle ────────────────────────────────────────────────────
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (controls.isLocked) {
    player.update(dt);
    zombies.forEach(z => z.update(dt));
    bloodSystem.update(dt);
    shootingSystem.update(dt);
  }

  renderer.render(scene, camera);
}

animate();

export { scene, camera, collidables, zombies };