# 🌍 GeoQuiz - Jeu de Géographie Multijoueur

GeoQuiz est une application web interactive et ludique permettant de tester ses connaissances en géographie. Que ce soit en solo pour s'entraîner ou en multijoueur pour défier ses amis, GeoQuiz offre une expérience fluide et éducative.

![Menu Principal](img/menu_principal.png)

## 🎮 Modes de Jeu

Le jeu propose deux modes principaux, disponibles en Solo et en Multijoueur :

### 1. Mode Localisation (Carte)
Localisez un pays demandé sur une carte interactive (Leaflet). Plus votre clic est proche de la réalité, plus vous marquez de points (jusqu'à 1000 points par manche).

![Jeu Localisation](img/jeu_localisation.png)

### 2. Mode Drapeaux (Quiz)
Identifiez le pays correspondant au drapeau affiché parmi 4 propositions. La rapidité est récompensée !

![Jeu Drapeaux](img/jeu_drapeaux.png)

---

## ✨ Fonctionnalités

### 👤 Mode Solo
- **Niveaux de difficulté** : Facile, Moyen, Difficile (influence le choix des pays et le temps).
- **Entraînement** : Parfait pour réviser avant de rejoindre une partie en ligne.
- **Feedback immédiat** : Visualisation de la bonne réponse.

![Mode Solo](img/mode_solo.png)

### 👥 Mode Multijoueur
- **Temps Réel** : Affrontez jusqu'à 8 joueurs simultanément.
- **Salons privés** : Créez une partie et partagez le code à vos amis.
- **Personnalisation** : L'hôte choisit le mode, la difficulté, le nombre de questions et le temps imparti.
- **Podium** : Classement en direct et podium final animé.

![Mode Multijoueur](img/mode_multi.png)

---

## 🛠️ Installation et Lancement

1. **Prérequis** : Assurez-vous d'avoir [Node.js](https://nodejs.org/) (version 18+) installé.

2. **Installation** :
   ```bash
   npm install
   ```

3. **Lancement du serveur** :
   ```bash
   npm start
   ```

4. **Accès** : Ouvrez votre navigateur sur `http://localhost:3000`.

---

## 📂 Structure du Code

Le projet est structuré pour séparer la logique serveur (Node.js/Socket.io) de l'interface client.

- **`server/`** : Logique backend.
  - `controllers/` : Gestion des parties (`GameController`) et des salons (`RoomController`).
  - `models/` : Classes de données (`Room`, `Player`, `GameState`).
- **`public/`** : Code frontend vanilla JS.
  - `src/core/` : Moteur de jeu côté client (`GameEngine`, `MapManager`).
  - `src/networking/` : Gestion des événements WebSocket (`SocketClient`).
  - `src/ui/` : Gestion de l'interface (`ScreenManager`).
- **`config/`** : Fichiers de configuration du jeu (scores, paramètres UI).
