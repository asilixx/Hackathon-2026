import * as THREE from 'three';

export class Map {
  constructor(scene) {
    this.scene = scene;
    this.collidables = [];
    this._build();
  }

  _build() {
    this._createSky();
    this._createGround();
    this._createWalls();
    this._createObstacles();
    this._createLights();
  }

  _createSky() {
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 80);
  }

  _createGround() {
    const geo = new THREE.PlaneGeometry(60, 60);
    const mat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(60, 30, 0x444444, 0x333333);
    this.scene.add(grid);
  }

  _createWalls() {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
    const wallHeight = 6;
    const arenaSize = 28; 

    const walls = [
      [60, 1, 0,          -arenaSize, 0],
      [60, 1, 0,           arenaSize, 0],
      [1, 60, -arenaSize,  0,         0],
      [1, 60,  arenaSize,  0,         0],
    ];

    walls.forEach(([w, d, x, z]) => {
      const geo = new THREE.BoxGeometry(w, wallHeight, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, wallHeight / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.collidables.push(mesh);
    });
  }

  _createObstacles() {
    const cratePositions = [
      [-8,  -8], [ 8, -8],
      [-8,   8], [ 8,  8],
      [ 0,  -5], [ 0,   5],
      [-14,  0], [14,   0],
      [-5,   0], [ 5,   0],
      [-12, 12], [12,  12],
      [-12,-12], [12, -12],
    ];

    const crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

    cratePositions.forEach(([x, z]) => {
      const size = 3  ;
      const geo = new THREE.BoxGeometry(size, size, size);
      const crate = new THREE.Mesh(geo, crateMat);
      crate.position.set(x, size / 2.5, z);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.collidables.push(crate);
    });

    const barrierMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const barriers = [
      [-5, -15, 0],
      [ 5,  15, 0],
      [-15, -5, Math.PI / 2],
      [ 15,  5, Math.PI / 2],
    ];

    barriers.forEach(([x, z, rotY]) => {
      const geo = new THREE.BoxGeometry(6, 4, 0.5);
      const barrier = new THREE.Mesh(geo, barrierMat);
      barrier.position.set(x, 1, z);
      barrier.rotation.y = rotY;
      barrier.castShadow = true;
      barrier.receiveShadow = true;
      this.scene.add(barrier);
      this.collidables.push(barrier);
    });

    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
    const pillarPositions = [
      [-20, -20], [20, -20],
      [-20,  20], [20,  20],
    ];

    pillarPositions.forEach(([x, z]) => {
      const geo = new THREE.BoxGeometry(1.5, 5, 1.5);
      const pillar = new THREE.Mesh(geo, pillarMat);
      pillar.position.set(x, 2.5, z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.collidables.push(pillar);
    });
  }

  _createLights() {
    const ambient = new THREE.AmbientLight(0x222244, 1000);
    this.scene.add(ambient);

    const lampPositions = [
      [-22, -22], [22, -22],
      [-22,  22], [22,  22],
    ];

    lampPositions.forEach(([x, z]) => {
      const light = new THREE.PointLight(0xff6600, 2, 25);
      light.position.set(x, 5, z);
      light.castShadow = true;
      this.scene.add(light);

      const geo = new THREE.SphereGeometry(0.2, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const lamp = new THREE.Mesh(geo, mat);
      lamp.position.copy(light.position);
      this.scene.add(lamp);
    });

    const centerLight = new THREE.PointLight(0x4444ff, 1, 30);
    centerLight.position.set(0, 8, 0);
    this.scene.add(centerLight);
  }

  getCollidables() {
    return this.collidables;
  }
}