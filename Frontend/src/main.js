import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Map } from "./classes/map.js";
import { Player } from "./classes/player.js";
import { Zombie } from "./classes/zombie.js";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js";
import { ShootingSystem } from "./classes/shootingSystem.js";

// -------------------- Initialisation scène --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

// -------------------- Controls, map et collisions --------------------
const controls = new PointerLockControls(camera, document.body);
const map = new Map(scene);
const collidables = map.getCollidables();

const collisionManager = {
  check(playerBox) {
    return collidables.some((obj) => {
      const objBox = new THREE.Box3().setFromObject(obj);
      return playerBox.intersectsBox(objBox);
    });
  },
};

// -------------------- Player --------------------
const player = new Player(camera, scene, collisionManager, controls);

// -------------------- Stats --------------------
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// -------------------- Overlay pour pointer lock --------------------
const overlay = document.getElementById("overlay");
overlay.addEventListener("click", () => (overlay.style.display = "none"));

document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement) overlay.style.display = "flex";
});

// -------------------- Gestion des zombies --------------------
const zombies = [];
let wavenum = 1;
let loadingWave = false;

async function loadWave() {
  loadingWave = true;
  try {
    const response = await fetch(`http://localhost:3000/waves/${wavenum}`);
    if (!response.ok) throw new Error("Erreur API");

    const wave = await response.json();
    console.log(`Vague ${wavenum}`);

    for (const enemyData of wave.enemies) {
      for (let i = 0; i < enemyData.count; i++) {
        zombies.push(
          new Zombie(scene, {
            collidables,
            playerPosition: camera.position,
          }),
        );
      }
    }
  } finally {
    loadingWave = false;
  }
}

try {
  await loadWave();
} catch (err) {
  console.error(err);
}

// -------------------- Raycaster --------------------

const shootingSystem = new ShootingSystem(camera, controls, map.getCollidables(), zombies, player);

// -------------------- Boucle d'animation --------------------
let lastTime = performance.now();

function animate() {
  stats.begin();

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  player.update(dt);
  scene.add(camera);

  for (let i = zombies.length - 1; i >= 0; i--) {
    if (zombies[i].isDead) {
      zombies.splice(i, 1);
      continue;
    }

    zombies[i].playerPosition = camera.position;
    zombies[i].update(dt);
  }

  if (zombies.length === 0 && !loadingWave) {
    wavenum++;
    loadWave();
  }

  renderer.render(scene, camera);
  stats.end();

  requestAnimationFrame(animate);
}

animate();

// -------------------- Exports --------------------
export { scene, camera, collidables, zombies };
