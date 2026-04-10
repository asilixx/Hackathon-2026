# Hackathon 2026

## Aperçu du projet
Hackathon 2026 est un jeu dans lequel un joueur doit survivre à des vagues de zombies. Le projet est divisé en deux parties principales : le Backend et le Frontend.

## Structure du projet
```
hackathon-2026
├── Backend
│   ├── package.json
│   ├── server.js
│   ├── routes
│   │   └── scores.js
│   └── README.md
├── Frontend
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── src
│   │   ├── main.js
│   │   └── classes
│   │       ├── map.js
│   │       ├── player.js
│   │       ├── zombie.js
│   │       ├── shootingSystem.js
│   │       └── collisionManager.js
└── README.md
```

## Backend
- **package.json** : Contient les dépendances et les scripts du serveur backend.
- **server.js** : Point d'entrée principal de l'application backend, configure le serveur et les middlewares.
- **routes/scores.js** : Définit les routes pour la soumission et la récupération des scores.
- **README.md** : Documentation spécifique au backend.

## Frontend
- **package.json** : Contient les dépendances et les scripts de l'application frontend.
- **index.html** : Fichier HTML principal servant de point d'entrée pour le frontend.
- **vite.config.js** : Fichier de configuration pour Vite, l'outil de build utilisé en frontend.
- **src/main.js** : Fichier JavaScript principal qui initialise le jeu, configure la scène, la caméra et la logique de jeu.
- **src/classes/map.js** : Définit la classe Map, gérant la carte du jeu et les objets avec collision.
- **src/classes/player.js** : Définit la classe Player, gérant les propriétés et comportements du joueur.
- **src/classes/zombie.js** : Définit la classe Zombie, gérant les propriétés et comportements des zombies.
- **src/classes/shootingSystem.js** : Gère les mécaniques de tir et les interactions avec les zombies.
- **src/classes/collisionManager.js** : Gère la détection des collisions entre le joueur, les zombies et l'environnement.

## Pour commencer

### Prérequis
- Node.js installé sur votre machine.

### Installation du Backend
1. Accédez au dossier `Backend` :
   ```
   cd Backend
   ```
2. Installez les dépendances :
   ```
   npm install
   ```
3. Lancez le serveur backend :
   ```
   npm run dev
   ```

### Installation du Frontend
1. Accédez au dossier `Frontend` :
   ```
   cd Frontend
   ```
2. Installez les dépendances :
   ```
   npm install
   ```
3. Lancez le serveur de développement :
   ```
   npx vite
   ```

#Paul et Dimitri
