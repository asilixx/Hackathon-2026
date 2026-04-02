import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Map } from "./classes/map.js";
import { Player } from "./classes/player.js";
import { Zombie } from "./classes/zombie.js";
import { ShootingSystem } from "./classes/shootingSystem.js";
import { CollisionManager } from "./classes/collisionManager.js";

// -------------------- Scène --------------------
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

// -------------------- Map & Collisions --------------------
const controls = new PointerLockControls(camera, document.body);
const map = new Map(scene);
const collidables = map.getCollidables();
const collisionManager = new CollisionManager(collidables);

// -------------------- Player --------------------
camera.position.set(0, 2.5, 0);
const player = new Player(camera, scene, collisionManager, controls);

// -------------------- Zombies & Shooting --------------------
const zombies = [];
const shootingSystem = new ShootingSystem(camera, controls, collidables, zombies, player);

// -------------------- Vagues --------------------
let wavenum = 1;
let loadingWave = false;
const waveIndicator = document.getElementById("wave-indicator");

function updateWaveIndicator() {
  if (waveIndicator) waveIndicator.textContent = `VAGUE ${wavenum}`;
}

function fallbackWave(num) {
  return { enemies: [{ count: 2 + num * 2, speed: 1.5 + num * 0.3 }] };
}

async function loadWave() {
  loadingWave = true;
  updateWaveIndicator();

  let wave;
  try {
    const response = await fetch(`http://localhost:3000/waves/${wavenum}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error("Erreur API");
    wave = await response.json();
    console.log(`Vague ${wavenum} chargée depuis le backend`);
  } catch (err) {
    console.warn(`Backend offline, fallback vague ${wavenum}`);
    wave = fallbackWave(wavenum);
  }

  for (const enemyData of wave.enemies) {
    for (let i = 0; i < enemyData.count; i++) {
      zombies.push(new Zombie(scene, {
        collidables,
        playerPosition: camera.position,
        player,
        speed: enemyData.speed,
      }));
    }
  }

  loadingWave = false;
}

// -------------------- Démarrage via menu --------------------
let gameStarted = false;

window.addEventListener("game:start", () => {
  if (gameStarted) return;
  gameStarted = true;
  controls.lock();
  loadWave();
});

document.addEventListener("pointerlockchange", () => {
  // Retour au menu géré par index.html (touche Échap)
});

// -------------------- Boucle d'animation --------------------
let lastTime = performance.now();

function animate() {

  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (controls.isLocked) {
    player.update(dt);

    for (let i = zombies.length - 1; i >= 0; i--) {
      if (zombies[i].isDead) {
        zombies.splice(i, 1);
        continue;
      }
      zombies[i].playerPosition = camera.position;
      zombies[i].update(dt);
    }

    if (!player.isDead && zombies.length === 0 && !loadingWave) {
      wavenum++;
      loadWave();
    }
  }

  scene.add(camera);
  renderer.render(scene, camera); 

  requestAnimationFrame(animate);
}

animate();

// -------------------- Exports --------------------
export { scene, camera, collidables, zombies };