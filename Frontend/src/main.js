import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { Map } from './classes/map.js';
import { Player } from './classes/player.js';
import { Zombie } from './classes/zombie.js';


const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const zombie = new Zombie(scene);

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
const map = new Map(scene);
const collidables = map.getCollidables();

const collisionManager = {
  check(playerBox) {
    return collidables.some(obj => {
      const objBox = new THREE.Box3().setFromObject(obj);
      return playerBox.intersectsBox(objBox);
    });
  }
};

const player = new Player(camera, scene, collisionManager, controls);

const overlay = document.getElementById('overlay');
overlay.addEventListener('click', () => overlay.style.display = 'none');

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) overlay.style.display = 'flex';
});

const raycaster = new THREE.Raycaster();

document.addEventListener('click', () => {
  if (!controls.isLocked) return;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

  if (raycaster.ray.intersectsBox(zombie.hitbox)) {
    console.log('Zombie touché !');
  }
});

let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const dt  = (now - lastTime) / 1000;
  lastTime  = now;

  player.update(dt);
  zombie.update(dt);  

  renderer.render(scene, camera);

  // console.log(camera.position);
}

animate();


export { scene, camera, collidables };