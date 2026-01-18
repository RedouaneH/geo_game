/**
 * README - GeoQuiz Multiplayer
 * Documentation principale du projet restructuré
 */

# 🌍 GeoQuiz Multiplayer

Jeu de géographie multijoueur en temps réel construit avec Node.js, Express, Socket.io et Leaflet.js.

## 📋 Table des Matières

- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Architecture](#-architecture)
- [Configuration](#-configuration)
- [Développement](#-développement)
- [Documentation](#-documentation)

---

## ✨ Fonctionnalités

### Modes de Jeu

- **🗺️ Mode Localisation**: Cliquez sur la carte pour trouver les pays
- **🚩 Mode Drapeaux**: Quiz à choix multiples sur les drapeaux
- **👤 Mode Solo**: Jouez seul contre la montre
- **👥 Mode Multijoueur**: Jusqu'à 8 joueurs en temps réel

### Niveaux de Difficulté

- **Facile**: Pays célèbres, temps illimité
- **Moyen**: Tous les pays, 30 secondes par question
- **Difficile**: Pays obscurs inclus, 15 secondes par question

### Fonctionnalités Avancées

- Détection précise des frontières avec GeoJSON
- Classement en temps réel
- Phase de révision (multijoueur)
- Système de scoring dynamique
- Interface responsive et moderne

---

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- npm ou yarn

### Étapes

```bash
# Cloner le repository
git clone <url-du-repo>
cd geo_game

# Installer les dépendances
npm install

# Démarrer le serveur
npm start
```

Le jeu sera accessible à `http://localhost:3000`

---

## 🎮 Utilisation

### Mode Solo

1. Cliquez sur "Solo"
2. Choisissez votre difficulté
3. Cliquez sur la carte ou choisissez le drapeau correct
4. Consultez vos statistiques à la fin

### Mode Multijoueur

1. Cliquez sur "Multijoueur"
2. **Créer un salon**:
   - Entrez votre pseudo
   - Choisissez difficulté et mode
   - Partagez le code à 6 caractères
3. **Rejoindre un salon**:
   - Entrez le code du salon
   - Entrez votre pseudo
4. L'hôte démarre la partie
5. Comparez vos scores en temps réel!

---

## 🏗️ Architecture

### Structure du Projet

```
geo_game/
├── config/                      # Configuration centralisée
│   ├── game.config.js          # Paramètres du jeu
│   ├── scoring.config.js       # Système de points
│   ├── ui.config.js            # Constantes UI
│   └── index.js                # Export centralisé
│
├── server/                      # Backend modulaire
│   ├── controllers/
│   │   ├── RoomController.js   # Gestion des salons
│   │   └── GameController.js   # Logique de jeu
│   ├── models/
│   │   ├── Room.js             # Modèle de salon
│   │   ├── Player.js           # Modèle de joueur
│   │   └── GameState.js        # État de partie
│   └── utils/
│       ├── roomCodeGenerator.js
│       ├── countrySelector.js
│       └── arrayUtils.js
│
├── public/                      # Frontend
│   ├── index.html              # Page principale
│   ├── styles.css              # Styles
│   ├── game.js                 # Logique client
│   ├── countries.js            # Base de données pays
│   └── countries-geo.json      # Frontières GeoJSON
│
├── docs/                        # Documentation
│   ├── architecture.md         # Architecture détaillée
│   ├── api/
│   │   └── socket-events.md    # Événements Socket.io
│   └── guides/
│       └── adding-features.md  # Guide développeur
│
├── server-new.js               # Serveur refactorisé
├── server.js                   # [LEGACY] Ancien serveur
└── package.json
```

### Architecture Modulaire

Le projet suit une architecture **MVC (Model-View-Controller)** avec:

- **Models**: Représentation des données (Room, Player, GameState)
- **Controllers**: Logique métier (RoomController, GameController)
- **Views**: Interface utilisateur (HTML/CSS/JS)
- **Utils**: Fonctions utilitaires réutilisables

**Avantages pour les Agents IA**:
- Code modulaire facile à comprendre
- Responsabilités clairement séparées
- Documentation JSDoc complète
- Configuration externalisée

---

## ⚙️ Configuration

### Fichiers de Configuration

#### `config/game.config.js`

Paramètres généraux du jeu:

```javascript
{
    totalRounds: 10,              // Nombre de rounds
    room: {
        codeLength: 6,            // Longueur du code salon
        codeCharacters: 'ABC...'  // Caractères autorisés
    },
    gameModes: {
        location: 'location',
        flags: 'flags'
    },
    difficulties: {
        easy: { timer: null, countries: 'famous' },
        // ...
    }
}
```

#### `config/scoring.config.js`

Système de points:

```javascript
{
    location: {
        perfectScore: 1000,
        distanceThresholds: [
            { maxDistance: 0, points: 1000 },
            { maxDistance: 50, points: 950 },
            // ...
        ]
    },
    flags: {
        basePoints: 800,
        maxSpeedBonus: 200
    }
}
```

#### `config/ui.config.js`

Constantes d'interface:

```javascript
{
    map: {
        defaultZoom: 2,
        continentBounds: { /* ... */ }
    },
    timer: {
        warningThreshold: 5,
        criticalThreshold: 3
    }
}
```

### Variables d'Environnement

Créez un fichier `.env`:

```env
PORT=3000
NODE_ENV=development
```

---

## 🛠️ Développement

### Scripts Disponibles

```bash
npm start          # Démarre le serveur (production)
npm run dev        # Démarre en mode développement
```

### Ajouter une Fonctionnalité

Consultez [docs/guides/adding-features.md](docs/guides/adding-features.md) pour:

- Ajouter un nouveau mode de jeu
- Ajouter des pays
- Modifier le système de scoring
- Créer de nouveaux niveaux de difficulté
- Ajouter des événements Socket.io

### Workflow de Développement

1. **Lire la documentation** dans `docs/`
2. **Modifier la configuration** si nécessaire
3. **Implémenter le backend** (controllers/models)
4. **Implémenter le frontend** (public/)
5. **Tester** manuellement
6. **Documenter** les changements

---

## 📚 Documentation

### Pour les Utilisateurs

- [README.md](README.md) - Ce fichier
- Interface du jeu (tutoriel intégré)

### Pour les Développeurs

- [docs/architecture.md](docs/architecture.md) - Architecture complète
- [docs/api/socket-events.md](docs/api/socket-events.md) - API Socket.io
- [docs/guides/adding-features.md](docs/guides/adding-features.md) - Guide d'extension

### Pour les Agents IA

**L'architecture modulaire et la documentation JSDoc complète permettent aux agents IA de**:

✅ Comprendre rapidement la structure du code
✅ Identifier où apporter des modifications
✅ Ajouter des fonctionnalités sans casser l'existant
✅ Suivre les patterns établis
✅ Accéder à la configuration centralisée

**Fichiers clés pour commencer**:
1. `docs/architecture.md` - Vue d'ensemble complète
2. `docs/guides/adding-features.md` - Exemples concrets
3. `config/` - Tous les paramètres configurables
4. `docs/api/socket-events.md` - Communication client-serveur

---

## 🎯 Roadmap

### ✅ Fait

- [x] Architecture modulaire
- [x] Documentation complète
- [x] Configuration externalisée
- [x] Mode localisation et drapeaux
- [x] Multijoueur jusqu'à 8 joueurs
- [x] Système de scoring avancé

### 🔜 À Venir

- [ ] Mode Capitales
- [ ] Tests automatisés
- [ ] Mode Tournoi
- [ ] Statistiques persistantes
- [ ] Achievements/Badges
- [ ] Mode équipes

---

## 🤝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 License

Ce projet est sous licence MIT.

---

## 👥 Auteurs

- Développeur principal - GeoQuiz Team

---

## 🙏 Remerciements

- [Leaflet.js](https://leafletjs.com/) - Bibliothèque de cartes
- [Socket.io](https://socket.io/) - WebSocket temps réel
- [Natural Earth](https://www.naturalearthdata.com/) - Données GeoJSON
- [CARTO](https://carto.com/) - Tuiles de carte

---

## 📞 Support

Pour toute question ou problème:
- Consultez la [documentation](docs/)
- Ouvrez une issue GitHub
- Contactez l'équipe

---

**Version actuelle**: 2.0.0 (Restructurée)
**Dernière mise à jour**: Janvier 2026
