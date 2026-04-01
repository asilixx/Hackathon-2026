import * as THREE from 'three';

export class Map {
  constructor(scene) {
    this.scene = scene;
    this.collidables = [];
    this.flickerLights = [];
    this._build();
  }

  _build() {
    this._createSky();
    this._createGround();
    this._createWalls();
    this._createHighObstacles(); // Obstacles hauts et asymétriques
    this._createGlobalLighting(); // Éclairage général puissant
    this._createRealisticLamps();
  }

  _createSky() {
    // Un bleu nuit très profond mais pas noir
    this.scene.background = new THREE.Color(0x0a0a1a);
    // Brouillard très léger pour garder la profondeur de vue
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.005);
  }

  _createGlobalLighting() {
    // 1. LUMIÈRE AMBIANTE : C'est elle qui définit la luminosité minimum.
    // On la passe à 0.8 pour que TOUT soit visible, même dans le noir.
    const ambient = new THREE.AmbientLight(0xffffff, 0.8); 
    this.scene.add(ambient);

    // 2. LUMIÈRE DE CIEL (Lune/Projecteurs distants)
    // Elle ajoute du relief et de la clarté directionnelle
    const sun = new THREE.DirectionalLight(0xccccff, 1.0);
    sun.position.set(20, 50, 10);
    sun.castShadow = true;
    // On élargit la zone d'ombre pour une grande map
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
  }

  _createGround() {
    const geo = new THREE.PlaneGeometry(60, 60);
    // Matériau plus clair pour réfléchir la lumière
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _createWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const size = 30;
    // Murs extérieurs très hauts (10m) pour fermer la map
    const walls = [
      [60, 10, 1, 0, 5, -size], [60, 10, 1, 0, 5, size],
      [1, 10, 60, -size, 5, 0], [1, 10, 60, size, 5, 0]
    ];
    walls.forEach(([w, h, d, x, y, z]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);
      this.collidables.push(mesh);
    });
  }

  // ─── OBSTACLES HAUTS ET ASYMÉTRIQUES ──────────────────────
  _createHighObstacles() {
    // On crée des blocs de 5 à 7 mètres de haut (impossible de sauter dessus)
    // Format: [Largeur, Hauteur, Profondeur, X, Z, Couleur]
    const structures = [
      [12, 7, 3, -15, -10, 0x222244], // Grand mur technique NO
      [4, 6, 12, 18, -15, 0x442222],  // Bloc vertical NE
      [8, 5, 8, -18, 15, 0x224422],   // Zone de stockage SO
      [2, 6, 2, 8, 12, 0x333333],     // Pilier isolé SE
      [10, 5, 2, 0, -22, 0x333333],   // Mur de séparation Nord
    ];

    structures.forEach(([w, h, d, x, z, col]) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: col })
      );
      mesh.position.set(x, h / 2, z); // Posé au sol
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.collidables.push(mesh);
    });
  }

  _createRealisticLamps() {
    // 3 lampadaires puissants placés de façon asymétrique
    const positions = [
        {x: -10, z: 10},
        {x: 12, z: -10},
        {x: 5, z: 20}
    ];

    positions.forEach(pos => {
      const group = new THREE.Group();
      
      // Poteau fin
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), new THREE.MeshStandardMaterial({color: 0x111111}));
      pole.position.y = 4;
      group.add(pole);

      // Tête de lampe
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.5), new THREE.MeshStandardMaterial({color: 0x000000}));
      head.position.set(0.6, 8, 0);
      group.add(head);

      // Spot puissant dirigé vers le bas
      const spot = new THREE.SpotLight(0xfff5d7, 150, 40, Math.PI/3, 0.5);
      spot.position.set(1.2, 7.8, 0);
      spot.target.position.set(1.2, 0, 0);
      spot.castShadow = true;
      group.add(spot);
      group.add(spot.target);

      group.position.set(pos.x, 0, pos.z);
      this.scene.add(group);
    });
  }

  update(dt) {
    // Optionnel: ajouter du flickering léger ici si besoin
  }

  getCollidables() { return this.collidables; }
}