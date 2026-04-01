import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Map } from "./classes/map.js";
import { Player } from "./classes/player.js";
import { Zombie } from "./classes/zombie.js";
import Stats from "https://cdnjs.cloudflare.com/ajax/libs/stats.js/r17/Stats.min.js";
import { ShootingSystem } from './classes/shootingSystem.js';

// -------------------- Initialisation scène --------------------
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

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
const zombies = []; // tableau pour stocker toutes les instances
const wavenum = 1;

try {
  const response = await fetch(`http://localhost:3000/waves/${wavenum}`);
  if (!response.ok) throw new Error("Erreur API");

  const wave = await response.json();
  console.log(wave);

  for (const enemyData of wave.enemies) {
    for (let i = 0; i < enemyData.count; i++) {
      const z = new Zombie(scene, {
        collidables,
        playerPosition: camera.position,
      });
      zombies.push(z); // stocke la référence
      console.log(enemyData.name);
    }
  }
} catch (err) {
  console.error(err);
}

// -------------------- Raycaster --------------------

const shootingSystem = new ShootingSystem(camera, controls, collidables, zombies);
  
// -------------------- Boucle d'animation --------------------
let lastTime = performance.now();

function animate() {
  stats.begin();

  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  player.update(dt);

  for (const z of zombies) { // update tous les zombies
    z.update(dt);
  }

  renderer.render(scene, camera);
  stats.end();

  requestAnimationFrame(animate);
}

animate();

// -------------------- Exports --------------------
export { scene, camera, collidables, zombies };
