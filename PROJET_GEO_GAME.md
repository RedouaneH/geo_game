# GeoQuiz - Jeu de Géographie Multijoueur

## 🎯 Présentation du Projet

GeoQuiz est une application web interactive permettant de tester ses connaissances en géographie. Les joueurs doivent localiser des pays sur une carte du monde interactive. Plus le clic est proche de la position réelle du pays, plus le joueur gagne de points.

---

## ✅ Fonctionnalités Implémentées

### Modes de Jeu (Disponibles en Solo et Multijoueur)
1. **Mode Localisation (Carte)** :
   - Le joueur doit localiser un pays donné sur une carte interactive.
   - **Carte Interactive** : Utilisation de Leaflet.js.
   - **Calcul de Score** : Basé sur la distance en kilomètres entre le clic et la position réelle (jusqu'à 1000 points).

2. **Mode Drapeaux (Quiz)** :
   - Un drapeau est affiché, le joueur doit choisir le bon pays parmi 4 propositions.
   - **Calcul de Score** : Points fixes pour une bonne réponse (800 pts) + Bonus de rapidité (jusqu'à 200 pts).

### Mode Solo
- **Système de Difficulté** :
    - **Facile** : Pays célèbres, aide visuelle (indices), temps illimité (Localisation).
    - **Moyen** : Tous les continents, moins d'indices, 30 secondes par question.
    - **Difficile** : Pays plus obscurs, aucun indice, 15 secondes par question.
- **Disfonctionnement** : Choix entre le mode Localisation et le mode Drapeaux.
- **Statistiques de Fin de Partie** : Récapitulatif des performances.

### Mode Multijoueur 🆕
- **Système de Salons** : Créez un salon et partagez le code à 6 caractères.
- **Jusqu'à 8 joueurs** simultanés.
- **Choix du Mode** : L'hôte peut choisir entre Localisation ou Drapeaux pour le salon.
- **Paramètres de l'Hôte** : Modification de la difficulté, du nombre de questions (2 à 20) et du temps de réponse (10s à 60s).
- **Synchronisation en Temps Réel** : Tous les joueurs voient le même pays/drapeau en même temps.
- **Phase de Révision interactive** : L'hôte guide le groupe à travers les résultats de chaque joueur après chaque round.
- **Podium Final** : Affichage du classement complet avec animation.
- **Gestion Automatique** : Nettoyage automatique des salons inactifs.

---

## 🚀 Comment Lancer le Jeu

### Prérequis
- Node.js 18+ installé sur votre machine.

### Installation
```bash
# Installer les dépendances
npm install

# Lancer le serveur
npm start
```

### Accès
Ouvrez votre navigateur et allez sur : **http://localhost:3000**

---

## 🎮 Comment Jouer en Multijoueur

1. **Créer un salon** :
   - Entrez votre pseudo.
   - Choisissez une difficulté initiale (modifiable plus tard).
   - Cliquez sur "Créer le salon".
   - Partagez le **code à 6 caractères** avec vos amis.

2. **Gérer les paramètres (Hôte)** :
   - Ajustez le nombre de questions et le temps limite.
   - Changez la difficulté si nécessaire.
   - Les modifications sont synchronisées instantanément pour tous les joueurs.

3. **Rejoindre un salon** :
   - Entrez votre pseudo.
   - Entrez le code du salon.
   - Cliquez sur "Rejoindre".

4. **Lancer la partie** :
   - L'hôte clique sur "Lancer la partie".
   - Tout le monde répond aux mêmes questions. Le système enregistre votre meilleur clic jusqu'à la fin du chrono.

5. **Phase de Révision** :
   - Après les questions, l'hôte contrôle le passage aux résultats.
   - On visualise les clics de chaque joueur pour chaque question.

6. **Fin de partie** :
   - Le podium final s'affiche.
   - L'hôte peut décider de ramener tout le groupe dans le lobby pour une nouvelle partie.

---

## 🌐 Déploiement en Production

L'application est optimisée pour un déploiement rapide.

### 🚀 Déploiement sur Render.com (Actuel)
1. Liez votre dépôt GitHub à [Render.com](https://render.com).
2. Créez un **Web Service**.
3. Configuration automatique via `package.json` :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. **Variable d'environnement** : Render définit automatiquement le `PORT`, le serveur l'utilisera par défaut.

---

## 📁 Structure du Projet

```
geo_game/
├── public/               # Fichiers statiques
│   ├── index.html        # Structure UI (Solo, Multi, Révision, Podium)
│   ├── styles.css        # Design moderne, animations, mode sombre
│   ├── game.js           # Logique client (Socket.io, Leaflet, UI)
│   ├── countries.js      # Données des pays et indices
│   └── countries-geo.json # Frontières pour l'affichage visuel
├── server.js             # Serveur Node.js + Socket.io (Logique des salons)
├── package.json          # Dépendances (Express, Socket.io)
└── PROJET_GEO_GAME.md    # Cette documentation
```

---

## 🛠️ Technologies Utilisées

- **Frontend** : HTML, CSS, JavaScript vanilla
- **Carte** : Leaflet.js
- **Backend** : Node.js + Express
- **Temps Réel** : Socket.io
- **Police** : Poppins (Google Fonts)

---

## 📊 Système de Points

### Mode Localisation

| Distance du pays | Points |
|------------------|--------|
| 0 km (Dans le pays)| 1000   |
| 0 - 50 km        | 950    |
| 50 - 100 km      | 900    |
| 100 - 200 km     | 850    |
| 200 - 300 km     | 800    |
| 300 - 500 km     | 700    |
| 500 - 750 km     | 600    |
| 750 - 1000 km    | 500    |
| 1000 - 1500 km   | 400    |
| 1500 - 2000 km   | 300    |
| 2000 - 2500 km   | 200    |
| 2500 - 3000 km   | 100    |
| 3000 - 4000 km   | 50     |
| 4000 - 5000 km   | 25     |
| > 5000 km        | 0      |

### Mode Drapeaux

- **Bonne réponse** : 800 points de base.
- **Bonus de rapidité** : Jusqu'à 200 points supplémentaires en fonction du temps restant.
- **Mauvaise réponse** : 0 point.

---

## 🎉 Amusez-vous bien !

Invitez vos amis et découvrez qui est le meilleur géographe ! 🌍
