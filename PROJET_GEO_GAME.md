# GeoQuiz - Jeu de Géographie Multijoueur

## 🎯 Présentation du Projet

GeoQuiz est une application web interactive permettant de tester ses connaissances en géographie. Les joueurs doivent localiser des pays sur une carte du monde interactive. Plus le clic est proche de la position réelle du pays, plus le joueur gagne de points.

---

## ✅ Fonctionnalités Implémentées

### Mode Solo
- **Carte Interactive** : Utilisation de Leaflet.js avec un fond de carte sombre et minimaliste.
- **Système de Difficulté** :
    - **Facile** : Pays célèbres, aide visuelle (indices), temps illimité.
    - **Moyen** : Tous les continents, moins d'indices, 30 secondes par question.
    - **Difficile** : Pays plus obscurs, aucun indice, 15 secondes par question.
- **Calcul de Score** : Basé sur la distance en kilomètres entre le clic et la position du pays.
- **Statistiques de Fin de Partie** : Récapitulatif des performances (Parfaits, Bons, Moyens, Ratés).

### Mode Multijoueur 🆕
- **Système de Salons** : Créez un salon et partagez le code à 6 caractères avec vos amis.
- **Jusqu'à 8 joueurs** par salon.
- **Synchronisation en Temps Réel** : Tous les joueurs voient le même pays à trouver simultanément.
- **Classement Dynamique** : Le leaderboard se met à jour après chaque réponse.
- **Podium Final** : Affichage du classement complet avec les 3 premiers sur un podium.

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
   - Choisissez la difficulté.
   - Cliquez sur "Créer le salon".
   - Partagez le **code à 6 caractères** avec vos amis.

2. **Rejoindre un salon** :
   - Entrez votre pseudo.
   - Entrez le code du salon.
   - Cliquez sur "Rejoindre".

3. **Lancer la partie** :
   - L'hôte (créateur du salon) clique sur "Lancer la partie".
   - Tous les joueurs répondent aux mêmes questions en même temps.
   - Le classement est affiché en temps réel.

4. **Fin de partie** :
   - Après 10 questions, le podium final s'affiche.
   - Le gagnant est celui avec le plus de points !

---

## 🌐 Déploiement en Production

Pour jouer avec vos amis à distance, déployez l'application sur un service cloud :

### Option 1 : Render.com (Recommandé)
1. Créez un compte sur [render.com](https://render.com).
2. Connectez votre dépôt GitHub.
3. Créez un nouveau "Web Service".
4. Sélectionnez votre dépôt et configurez :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
5. Déployez et partagez l'URL avec vos amis !

### Option 2 : Railway.app
1. Créez un compte sur [railway.app](https://railway.app).
2. Importez votre projet depuis GitHub.
3. Railway détecte automatiquement Node.js.
4. Déployez en un clic.

---

## 📁 Structure du Projet

```
geo_game/
├── public/               # Fichiers statiques servis au client
│   ├── index.html        # Page principale avec tous les écrans
│   ├── styles.css        # Styles CSS (mode sombre, animations)
│   ├── game.js           # Logique du jeu (solo + multijoueur)
│   └── countries.js      # Base de données des pays
├── server.js             # Serveur Node.js + Socket.io
├── package.json          # Dépendances et scripts
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

| Distance du pays | Points |
|------------------|--------|
| 0 - 300 km       | 1000   |
| 300 - 500 km     | 900    |
| 500 - 750 km     | 800    |
| 750 - 1000 km    | 700    |
| 1000 - 1500 km   | 550    |
| 1500 - 2000 km   | 400    |
| 2000 - 2500 km   | 300    |
| 2500 - 3000 km   | 200    |
| 3000 - 4000 km   | 100    |
| 4000 - 5000 km   | 50     |
| > 5000 km        | 0      |

---

## 🎉 Amusez-vous bien !

Invitez vos amis et découvrez qui est le meilleur géographe ! 🌍
