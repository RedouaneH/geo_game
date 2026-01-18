/**
 * Documentation de l'architecture du projet GeoQuiz
 * 
 * Ce document aide les agents IA à comprendre rapidement l'organisation du projet
 * et où apporter des modifications pour chaque type de fonctionnalité.
 */

# Architecture du Projet GeoQuiz Multijoueur

## Vue d'ensemble

GeoQuiz est un jeu de géographie multijoueur en temps réel construit avec:
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JavaScript + Leaflet.js pour les cartes
- **Architecture**: Client-Server avec communication WebSocket temps réel

---

## Structure des Dossiers

```
geo_game/
├── config/                      # Configuration centralisée
│   ├── game.config.js          # Paramètres du jeu (rounds, timers, modes)
│   ├── scoring.config.js       # Système de points et calculs
│   ├── ui.config.js            # Constantes UI (couleurs, dimensions)
│   └── index.js                # Point d'entrée des configs
│
├── server/                      # Code serveur modulaire
│   ├── controllers/            # Logique de contrôle
│   │   ├── RoomController.js   # Gestion des salons
│   │   └── GameController.js   # Logique de jeu
│   ├── models/                 # Modèles de données
│   │   ├── Room.js             # Modèle de salon
│   │   ├── Player.js           # Modèle de joueur
│   │   └── GameState.js        # État de la partie
│   └── utils/                  # Utilitaires serveur
│       ├── roomCodeGenerator.js # Génération de codes
│       ├── countrySelector.js   # Sélection de pays
│       └── arrayUtils.js        # Fonctions helper
│
├── public/                      # Code client
│   ├── src/                    # Code source modulaire
│   │   ├── core/               # Modules principaux
│   │   │   ├── GameEngine.js   # Moteur de jeu principal
│   │   │   ├── MapManager.js   # Gestion de la carte Leaflet
│   │   │   └── StateManager.js # Gestion d'état client
│   │   ├── networking/         # Communication réseau
│   │   │   └── SocketClient.js # Client Socket.io
│   │   ├── ui/                 # Interface utilisateur
│   │   │   ├── ScreenManager.js # Gestion des écrans
│   │   │   └── UIComponents.js  # Composants UI réutilisables
│   │   └── data/               # Données statiques
│   │       ├── countries.js     # Liste des pays
│   │       └── countryMapping.js # Mapping FR->EN
│   │
│   ├── game.js                 # [LEGACY] Sera refactorisé
│   ├── countries.js            # [LEGACY] À migrer vers src/data/
│   ├── index.html              # Page principale
│   ├── styles.css              # Styles globaux
│   └── countries-geo.json      # Données GeoJSON des frontières
│
├── docs/                        # Documentation
│   ├── architecture.md         # Ce fichier
│   ├── api/                    # Documentation API
│   │   ├── socket-events.md    # Événements Socket.io
│   │   └── game-flow.md        # Flux de jeu détaillé
│   └── guides/                 # Guides développeur
│       ├── adding-features.md  # Comment ajouter des fonctionnalités
│       ├── adding-countries.md # Comment ajouter des pays
│       └── modifying-scoring.md # Comment modifier le scoring
│
├── server.js                    # [LEGACY] Point d'entrée serveur
├── package.json                # Dépendances npm
└── README.md                   # Documentation utilisateur

```

---

## Flux de Données

### 1. Mode Multijoueur

```
Client                          Server                          Autres Clients
  │                               │                                    │
  ├─ createRoom ─────────────────>│                                    │
  │<───── roomCreated ────────────┤                                    │
  │                               │                                    │
  │ joinRoom ──────────────────────>│                                   │
  │<───── playerJoined ────────────┤─── playerJoined ──────────────────>│
  │                               │                                    │
  │ startGame ─────────────────────>│                                   │
  │<───── gameStarted ─────────────┤─── gameStarted ───────────────────>│
  │                               │                                    │
  │<───── newRound ────────────────┤─── newRound ──────────────────────>│
  │                               │                                    │
  │ submitAnswer ──────────────────>│                                   │
  │                      [Calcul des points]                           │
  │<─── showPlayerResult ──────────┤─── showPlayerResult ──────────────>│
  │                               │                                    │
  │<─── roundComplete ─────────────┤─── roundComplete ─────────────────>│
  │                               │                                    │
  │<─── gameComplete ──────────────┤─── gameComplete ───────────────────>│
```

### 2. Mode Solo

```
Client (game.js)
  │
  ├─ Initialisation
  │  ├─ Chargement pays (countries.js)
  │  ├─ Chargement GeoJSON
  │  └─ Configuration carte Leaflet
  │
  ├─ Boucle de jeu
  │  ├─ Sélection pays aléatoire
  │  ├─ Affichage question
  │  ├─ Attente clic joueur
  │  ├─ Calcul distance/points
  │  ├─ Affichage résultat
  │  └─ Round suivant
  │
  └─ Fin de partie
     ├─ Calcul statistiques
     └─ Affichage scores
```

---

## Modules Principaux

### Backend

#### RoomController
- **Responsabilité**: Gestion du cycle de vie des salons
- **Méthodes clés**:
  - `createRoom(username, difficulty, gameMode)`: Crée un nouveau salon
  - `joinRoom(roomCode, username)`: Ajoute un joueur au salon
  - `leaveRoom(roomCode, playerId)`: Retire un joueur
  - `getRoomInfo(roomCode)`: Récupère les infos du salon

#### GameController
- **Responsabilité**: Logique de jeu et progression
- **Méthodes clés**:
  - `startGame(roomCode)`: Démarre la partie
  - `nextRound(roomCode)`: Passe au round suivant
  - `submitAnswer(roomCode, playerId, answer)`: Traite une réponse
  - `calculateScore(answer, correctAnswer)`: Calcule les points

#### Room (Model)
- **Propriétés**:
  - `code`: Code du salon (6 caractères)
  - `host`: ID du créateur
  - `players`: Array de joueurs
  - `settings`: Configuration (difficulté, mode, timer)
  - `gameState`: État actuel du jeu
  - `currentRound`: Round actuel
  - `countries`: Pays sélectionnés pour la partie

### Frontend

#### GameEngine
- **Responsabilité**: Orchestration du jeu côté client
- **Méthodes clés**:
  - `init()`: Initialise le jeu
  - `startRound()`: Démarre un nouveau round
  - `handleAnswer(answer)`: Traite la réponse du joueur
  - `updateScore(points)`: Met à jour le score

#### MapManager
- **Responsabilité**: Gestion de la carte Leaflet
- **Méthodes clés**:
  - `initMap()`: Initialise la carte
  - `loadGeoJSON()`: Charge les frontières des pays
  - `highlightCountry(countryName)`: Surligne un pays
  - `addMarker(lat, lng, type)`: Ajoute un marqueur
  - `zoomToContinent(continent)`: Zoom sur un continent

#### SocketClient
- **Responsabilité**: Communication WebSocket
- **Méthodes clés**:
  - `connect()`: Connexion au serveur
  - `emit(event, data)`: Émet un événement
  - `on(event, callback)`: Écoute un événement
  - `disconnect()`: Déconnexion

#### ScreenManager
- **Responsabilité**: Navigation entre écrans
- **Méthodes clés**:
  - `showScreen(screenName)`: Affiche un écran
  - `hideAllScreens()`: Cache tous les écrans
  - `transition(from, to)`: Transition animée

---

## Points d'Extension Courants

### Ajouter un Nouveau Mode de Jeu

1. **Config**: Ajouter le mode dans `config/game.config.js`
   ```javascript
   gameModes: {
       location: 'location',
       flags: 'flags',
       newMode: 'newMode'  // <-- Nouveau mode
   }
   ```

2. **Backend**: Ajouter la logique dans `GameController.js`
   ```javascript
   handleNewModeRound(room) {
       // Logique spécifique au nouveau mode
   }
   ```

3. **Frontend**: Ajouter l'UI dans `GameEngine.js` et `ScreenManager.js`

### Modifier le Système de Points

1. Éditer `config/scoring.config.js`
2. Ajuster les seuils dans `distanceThresholds` ou `flags`
3. Les fonctions `calculateLocationPoints` et `calculateFlagPoints` seront automatiquement mises à jour

### Ajouter des Pays

1. Ajouter dans `public/src/data/countries.js`:
   ```javascript
   {
       name: "Nouveau Pays",
       lat: 0.0,
       lng: 0.0,
       continent: "Continent",
       difficulty: "medium",
       hint: "Indice...",
       iso: "XX"
   }
   ```

2. Ajouter le mapping dans `countryMapping.js` si nom français

3. Vérifier que le pays existe dans `countries-geo.json`

---

## États du Jeu

### États d'un Salon
- `WAITING`: En attente de joueurs
- `PLAYING`: Partie en cours
- `REVIEWING`: Phase de revue (multijoueur)
- `FINISHED`: Partie terminée

### États d'un Round
- `PREPARATION`: Affichage de la question
- `ACTIVE`: Joueurs peuvent répondre
- `REVEALING`: Révélation des réponses
- `COMPLETE`: Round terminé

---

## Conventions de Code

### Nommage
- **Classes**: PascalCase (`GameEngine`, `RoomController`)
- **Fonctions**: camelCase (`calculatePoints`, `handleAnswer`)
- **Constantes**: UPPER_SNAKE_CASE (`GAME_CONFIG`, `MAX_PLAYERS`)
- **Événements Socket.io**: camelCase (`createRoom`, `gameStarted`)

### Organisation des Fichiers
- Chaque module = un fichier
- Maximum 300-400 lignes par fichier
- Sections marquées par des commentaires:
  ```javascript
  // ==================== INITIALIZATION ====================
  // ==================== PUBLIC METHODS ====================
  // ==================== PRIVATE METHODS ====================
  // ==================== EVENT HANDLERS ====================
  ```

### Documentation JSDoc
Toutes les fonctions doivent avoir:
```javascript
/**
 * Description de la fonction
 * @param {Type} paramName - Description du paramètre
 * @returns {Type} Description du retour
 */
```

---

## Tests

### Structure des Tests (à implémenter)
```
tests/
├── unit/
│   ├── scoring.test.js
│   ├── countrySelector.test.js
│   └── roomCodeGenerator.test.js
├── integration/
│   ├── gameFlow.test.js
│   └── multiplayer.test.js
└── e2e/
    ├── soloGame.test.js
    └── multiplayerGame.test.js
```

---

## Déploiement

### Variables d'Environnement
```env
PORT=3000
NODE_ENV=production
```

### Commandes
```bash
npm start          # Production
npm run dev        # Développement
```

---

## Ressources

- [Socket.io Documentation](https://socket.io/docs/)
- [Leaflet.js Documentation](https://leafletjs.com/reference.html)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
