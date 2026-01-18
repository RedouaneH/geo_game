/**
 * Guide Développeur - Ajout de Fonctionnalités
 * 
 * Ce guide explique comment étendre GeoQuiz avec de nouvelles fonctionnalités.
 * Suivez les patterns établis pour maintenir la cohérence du code.
 */

# Guide d'Ajout de Fonctionnalités

## Table des Matières

1. [Ajouter un Nouveau Mode de Jeu](#ajouter-un-nouveau-mode-de-jeu)
2. [Ajouter des Pays](#ajouter-des-pays)
3. [Modifier le Système de Scoring](#modifier-le-système-de-scoring)
4. [Ajouter un Nouveau Niveau de Difficulté](#ajouter-un-nouveau-niveau-de-difficulté)
5. [Ajouter un Nouvel Événement Socket.io](#ajouter-un-nouvel-événement-socketio)
6. [Ajouter un Écran UI](#ajouter-un-écran-ui)

---

## Ajouter un Nouveau Mode de Jeu

### Étape 1: Configuration

Ajouter le mode dans `config/game.config.js`:

```javascript
gameModes: {
    location: 'location',
    flags: 'flags',
    capitals: 'capitals'  // <-- Nouveau mode
}
```

### Étape 2: Logique Serveur

Dans `server/controllers/GameController.js`, modifier `startNextRound()`:

```javascript
startNextRound(room) {
    // ... code existant ...
    
    if (room.gameMode === 'flags') {
        // Code flags existant
    } else if (room.gameMode === 'capitals') {
        // NOUVEAU: Logique pour le mode capitales
        roundData = {
            roundNumber: room.gameState.currentRound,
            totalRounds: room.gameState.totalRounds,
            country: {
                name: country.name,
                hint: country.hint
            },
            question: `Quelle est la capitale de ${country.name} ?`,
            choices: createCapitalChoices(country, this.allCountries),
            timer: room.settings.timer
        };
    } else {
        // Code location existant
    }
    
    // ... reste du code ...
}
```

### Étape 3: Fonction Utilitaire

Dans `server/utils/countrySelector.js`, ajouter:

```javascript
/**
 * Crée les choix pour une question du mode capitales
 * @param {Object} correctCountry - Le pays correct
 * @param {Array} allCountries - Liste complète des pays
 * @returns {Array} Tableau de choix mélangés
 */
function createCapitalChoices(correctCountry, allCountries) {
    // Assumer que chaque pays a une propriété 'capital'
    const distractors = selectDistractors(correctCountry, allCountries, 3);
    const choices = [
        { capital: correctCountry.capital, country: correctCountry.name },
        ...distractors.map(c => ({ capital: c.capital, country: c.name }))
    ];
    
    return shuffleArray(choices);
}

module.exports = {
    // ... exports existants ...
    createCapitalChoices
};
```

### Étape 4: Données de Pays

Dans `public/src/data/countries.js`, ajouter la propriété `capital`:

```javascript
{
    name: "France",
    lat: 46.2276,
    lng: 2.2137,
    continent: "Europe",
    difficulty: "easy",
    hint: "Ce pays est célèbre pour la Tour Eiffel",
    code: "fr",
    capital: "Paris"  // <-- Ajouter à tous les pays
}
```

### Étape 5: Interface Client

Dans `public/game.js` (ou le futur `GameEngine.js`), ajouter le handler:

```javascript
socket.on('newRound', (data) => {
    if (this.state.gameMode === 'capitals') {
        // Afficher la question des capitales
        this.displayCapitalsQuestion(data);
    } else if (this.state.gameMode === 'flags') {
        // ... code existant flags ...
    } else {
        // ... code existant location ...
    }
});
```

### Étape 6: Scoring

Dans `config/scoring.config.js`, ajouter:

```javascript
capitals: {
    basePoints: 800,
    maxSpeedBonus: 200,
    incorrectPoints: 0
}
```

Et dans `GameController.js`:

```javascript
submitAnswer(room, playerId, answer) {
    // ... code existant ...
    
    if (room.gameMode === 'capitals') {
        const isCorrect = answer.selectedCapital === country.capital;
        const timeLeft = /* calcul du temps */;
        points = calculateCapitalPoints(isCorrect, timeLeft, room.settings.timer);
    }
    
    // ... reste du code ...
}
```

---

## Ajouter des Pays

### Fichier à Modifier

`public/src/data/countries.js`

### Format

```javascript
{
    name: "Nouveau Pays",           // Nom du pays (utilisé dans le jeu)
    lat: 0.0,                       // Latitude du centre
    lng: 0.0,                       // Longitude du centre
    continent: "Continent",         // Europe, Asie, Afrique, etc.
    difficulty: "medium",           // easy, medium, hard
    hint: "Indice utile",          // Indice pour aider les joueurs
    code: "xx"                      // Code ISO 2 lettres (minuscules)
}
```

### Où Ajouter

Ajouter dans la section appropriée par continent et difficulté.

### Mapping GeoJSON

Si le nom français est différent du nom anglais dans le GeoJSON:

Dans `public/src/data/countryMapping.js`:

```javascript
"Nouveau Pays": "New Country"  // FR -> EN
```

### Vérification

1. Le pays doit exister dans `public/countries-geo.json`
2. Le code ISO doit être correct
3. Les coordonnées doivent pointer vers le centre géographique

---

## Modifier le Système de Scoring

### Fichier Principal

`config/scoring.config.js`

### Modifier les Seuils de Distance (Mode Location)

```javascript
distanceThresholds: [
    { maxDistance: 0, points: 1200 },      // Augmenter les points parfaits
    { maxDistance: 50, points: 1100 },     // Nouveau seuil
    { maxDistance: 100, points: 1000 },    // etc.
    // ...
]
```

### Modifier le Scoring Drapeaux

```javascript
flags: {
    basePoints: 900,                // Augmenter les points de base
    maxSpeedBonus: 300,             // Augmenter le bonus vitesse
    incorrectPoints: 0
}
```

### Ajouter des Bonus

Dans `scoring.config.js`:

```javascript
bonuses: {
    perfectRound: 500,              // Bonus pour 1000 points
    winStreak: 100                  // Bonus pour 3 bonnes réponses consécutives
}
```

Puis implémenter dans `GameController.js`:

```javascript
submitAnswer(room, playerId, answer) {
    // ... calcul de points normal ...
    
    // Bonus perfect round
    if (points === 1000) {
        points += SCORING_CONFIG.bonuses.perfectRound;
    }
    
    // Bonus win streak
    if (player.consecutiveCorrect >= 3) {
        points += SCORING_CONFIG.bonuses.winStreak;
    }
    
    // ...
}
```

---

## Ajouter un Nouveau Niveau de Difficulté

### Étape 1: Configuration

Dans `config/game.config.js`:

```javascript
difficulties: {
    easy: { timer: null, countries: 'famous', label: 'Facile' },
    medium: { timer: 30, countries: 'all', label: 'Moyen' },
    hard: { timer: 15, countries: 'obscure', label: 'Difficile' },
    expert: {                                           // <-- NOUVEAU
        timer: 10,
        countries: 'all',
        label: 'Expert',
        description: '10 secondes, tous les pays, mode hardcore'
    }
}
```

### Étape 2: Sélection de Pays

Dans `server/utils/countrySelector.js`, modifier si nécessaire:

```javascript
function selectCountriesForGame(allCountries, difficulty, count) {
    // ... code existant ...
    
    if (difficulty === 'expert') {
        // Mode expert: tout inclus, même les plus obscurs
        filteredCountries = allCountries;
        // Optionnel: préférer les pays difficiles
        filteredCountries = allCountries.filter(c => 
            c.difficulty === 'hard' || c.difficulty === 'medium'
        );
    }
    
    // ...
}
```

### Étape 3: Interface

Dans `public/index.html`, ajouter le bouton de difficulté:

```html
<div class="difficulty-card" data-difficulty="expert">
    <h3>⚡ Expert</h3>
    <p>10 secondes par question</p>
    <p>Tous les pays</p>
</div>
```

---

## Ajouter un Nouvel Événement Socket.io

### Étape 1: Documentation

Dans `docs/api/socket-events.md`, documenter l'événement:

```markdown
#### `nouveauEvent`
Description de l'événement.

**Payload**:
\`\`\`javascript
{
    param1: type,
    param2: type
}
\`\`\`

**Réponse**: `eventReponse`
```

### Étape 2: Serveur

Dans `server-new.js` ou le contrôleur approprié:

```javascript
socket.on('nouveauEvent', ({ param1, param2 }) => {
    // Validation
    if (!param1 || !param2) {
        socket.emit('error', { message: 'Paramètres invalides' });
        return;
    }
    
    // Logique métier
    const result = faireQuelqueChose(param1, param2);
    
    // Réponse
    socket.emit('eventReponse', { result });
    
    // Optionnel: broadcast aux autres
    socket.to(roomCode).emit('eventReponse', { result });
});
```

### Étape 3: Client

Dans `public/game.js`:

```javascript
// Émettre l'événement
socket.emit('nouveauEvent', {
    param1: value1,
    param2: value2
});

// Écouter la réponse
socket.on('eventReponse', (data) => {
    console.log('Réponse reçue:', data.result);
    // Traiter la réponse
});
```

---

## Ajouter un Écran UI

### Étape 1: HTML

Dans `public/index.html`:

```html
<div id="nouvel-ecran" class="screen" style="display: none;">
    <div class="container">
        <h2>Titre de l'Écran</h2>
        <p>Contenu...</p>
        <button id="btn-action">Action</button>
    </div>
</div>
```

### Étape 2: Styles

Dans `public/styles.css`:

```css
#nouvel-ecran {
    /* Styles spécifiques à l'écran */
}

#nouvel-ecran .container {
    /* Layout */
}
```

### Étape 3: JavaScript (ScreenManager)

Si vous utilisez `ScreenManager.js`:

```javascript
class ScreenManager {
    showScreen(screenName) {
        // Cacher tous les écrans
        this.hideAllScreens();
        
        // Afficher l'écran demandé
        const screen = document.getElementById(screenName);
        if (screen) {
            screen.style.display = 'flex';
        }
    }
    
    showNouvelEcran(data) {
        this.showScreen('nouvel-ecran');
        
        // Remplir les données
        document.getElementById('btn-action').onclick = () => {
            // Action au clic
        };
    }
}
```

### Étape 4: Navigation

Dans `game.js`:

```javascript
// Afficher le nouvel écran
this.screenManager.showNouvelEcran(data);

// Ou simplement
showScreen('nouvel-ecran');
```

---

## Checklist pour Toute Nouvelle Fonctionnalité

- [ ] Configuration ajoutée dans `config/`
- [ ] Logique serveur implémentée (Controllers/Models)
- [ ] Événements Socket.io documentés dans `docs/api/socket-events.md`
- [ ] Interface client créée
- [ ] Tests manuels effectués
- [ ] Documentation mise à jour
- [ ] Aucune régression des fonctionnalités existantes

---

## Pattern Général

```
1. Définir la config      → config/
2. Implémenter backend    → server/controllers/ ou server/models/
3. Créer les événements   → server-new.js + documentation
4. Implémenter frontend   → public/game.js ou modules client
5. Ajouter l'UI           → public/index.html + styles.css
6. Tester                 → Vérifier tous les cas d'usage
7. Documenter             → docs/guides/ ou README.md
```

---

## Conventions à Respecter

### Nommage

- **Événements Socket.io**: `camelCase` (`createRoom`, `submitAnswer`)
- **Fonctions**: `camelCase` (`calculatePoints`, `selectCountries`)
- **Classes**: `PascalCase` (`GameController`, `RoomController`)
- **Constantes**: `UPPER_SNAKE_CASE` (`GAME_CONFIG`, `MAX_PLAYERS`)
- **Fichiers**: `PascalCase.js` pour classes, `camelCase.js` pour utilitaires

### Documentation JSDoc

```javascript
/**
 * Description de la fonction
 * @param {Type} param - Description du paramètre
 * @returns {Type} Description du retour
 */
function maFonction(param) {
    // ...
}
```

### Organisation des Fichiers

- Chaque module = un fichier
- Maximum 300-400 lignes par fichier
- Sections bien marquées avec commentaires

---

## Ressources Utiles

- [Architecture du Projet](../architecture.md)
- [Événements Socket.io](../api/socket-events.md)
- [Configuration du Jeu](../../config/game.config.js)
- [Système de Scoring](../../config/scoring.config.js)

---

## Questions Fréquentes

**Q: Où ajouter une nouvelle propriété aux pays?**
A: Dans `public/src/data/countries.js`, ajouter la propriété à l'objet de chaque pays.

**Q: Comment modifier le nombre de rounds?**
A: Dans `config/game.config.js`, modifier `totalRounds`.

**Q: Comment changer les couleurs de l'interface?**
A: Dans `public/styles.css`, modifier les variables CSS (`:root { --couleur: ... }`).

**Q: Comment ajouter un nouveau continent?**
A: Ajouter dans `config/ui.config.js` dans `continentBounds`, puis ajouter les pays dans `countries.js`.

**Q: Comment débugger les événements Socket.io?**
A: Utiliser `console.log` côté serveur et client, ou les DevTools du navigateur (onglet Network → WS).

---

**Dernière mise à jour**: Janvier 2026
