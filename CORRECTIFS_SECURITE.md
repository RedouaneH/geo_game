# Correctifs de Sécurité Anti-Triche - GeoQuiz

## Changements effectués

### 1. ✅ GeoJSON Sécurisé (countries-geo.json)
**Problème** : Le fichier GeoJSON contenait les noms complets des pays dans `properties.name`, permettant à quiconque d'inspecter la carte dans la console du navigateur pour trouver les réponses.

**Solution** : 
- Les propriétés `name` ont été supprimées du GeoJSON
- Seuls les codes ISO3 restent dans `properties.id`
- Impossible maintenant de voir les noms de pays en inspectant les features de la carte

### 2. ✅ Données pays côté serveur (countries.js)
**Problème** : Le fichier `countries.js` était chargé côté client avec TOUTES les informations (noms, coordonnées, indices, difficultés), rendant la triche triviale via `console.log(COUNTRIES)`.

**Solution** :
- `countries.js` déplacé de `public/` vers `server/data/`
- Le fichier n'est plus chargé dans `index.html`
- Les données complètes des pays ne sont accessibles que côté serveur
- Mise à jour de l'import dans `server.js`

### 3. ✅ Mode Multijoueur Sécurisé
**Problème** : En mode localisation multijoueur, le serveur envoyait le nom du pays dans l'événement `newRound`, permettant aux joueurs de voir la réponse.

**Solution** (GameController.js):
```javascript
// AVANT (vulnérable):
country: {
    name: country.name,  // ❌ Révèle la réponse!
    continent: country.continent,
    hint: country.hint
}

// APRÈS (sécurisé):
country: {
    code: country.code,  // ✅ Seulement le code ISO
    continent: country.continent,
    hint: country.hint
}
```

### 4. ⚠️ Mode Solo - État actuel

**IMPORTANT** : Le mode solo reste actuellement **DÉSACTIVÉ** car il nécessitait l'accès aux données de pays côté client.

**Options pour réactiver le mode solo de manière sécurisée** :

#### Option A : Solo via serveur (recommandée)
Transformer le mode solo en une room serveur à 1 joueur :
- Créer automatiquement une room "solo" quand le joueur choisit ce mode
- Utiliser la même logique que le multijoueur
- Garantit une sécurité totale

#### Option B : API de pays minimaliste
Créer un endpoint API qui ne renvoie que le strict minimum :
- Codes ISO des pays (sans noms ni coordonnées)
- Permettre au client de demander un nouveau pays au serveur
- Le serveur vérifie les réponses

### 5. ✅ MapManager
**Modification** : Adapté pour utiliser les codes ISO3 au lieu des noms de pays.
- Pas de mapping côté client entre codes et noms
- Tout passe par le serveur pour la validation

## Impact sur la Triche

### Avant les correctifs ❌
Un tricheur pouvait :
```javascript
// Dans la console du navigateur:
console.log(COUNTRIES); // Voir tous les pays, noms, coordonnées
console.log(mapManager.countriesGeoJSON.features); // Voir tous les noms
socket.on('newRound', (data) => console.log(data.country.name)); // Voir la réponse
```

### Après les correctifs ✅
```javascript
// Maintenant:
console.log(COUNTRIES); // undefined - n'existe plus côté client
console.log(mapManager.countriesGeoJSON.features[0]); 
// { properties: { id: "FRA" } } - seulement le code ISO
socket.on('newRound', (data) => console.log(data.country)); 
// { code: "fr", continent: "Europe", hint: "..." } - PAS de nom!
```

## Fichiers Modifiés

1. `public/countries-geo.json` - Noms de pays supprimés
2. `public/countries.js` → `server/data/countries.js` - Déplacé côté serveur
3. `public/index.html` - Retrait du chargement de countries.js
4. `server.js` - Mise à jour du chemin d'import
5. `server/controllers/GameController.js` - Ne plus envoyer les noms en mode location
6. `public/src/core/GameEngine.js` - Suppression de la référence à window.COUNTRIES
7. `public/src/data/countryMapping.js` - À adapter si nécessaire

## Recommandations Futures

### Validation côté serveur
Toujours valider les réponses côté serveur, jamais faire confiance au client :
```javascript
// ✅ BON - Serveur vérifie
socket.on('submitAnswer', ({ clickedCode }) => {
    const isCorrect = (clickedCode === currentCountry.code);
    // ...
});

// ❌ MAUVAIS - Client calcule
const isCorrect = (clickedCode === correctCode); // Client peut mentir!
```

### Obfuscation supplémentaire (optionnel)
- Hasher les codes de pays pendant le jeu
- Utiliser des identifiants temporaires de session
- Randomiser les identifiants de features GeoJSON

### Logs et monitoring
- Logger les patterns suspects (réponses trop rapides/précises)
- Détecter les séquences anormales de réponses correctes

## Tests à Effectuer

1. ✅ Vérifier que `window.COUNTRIES` est undefined dans la console
2. ✅ Inspecter le GeoJSON - aucun nom de pays visible
3. ✅ Intercepter les événements Socket.io - pas de noms révélés
4. ⚠️ Tester le mode multijoueur (le solo est désactivé)
5. ✅ Vérifier que le jeu fonctionne sans accès aux données sensibles

## Mode Solo - Plan de Réactivation

Pour réactiver le mode solo de manière sécurisée, il faut implémenter l'Option A (solo via serveur) :

1. Créer un événement `startSoloGame` côté serveur
2. Le serveur crée une room spéciale "solo"
3. Utiliser la même logique que GameController pour les rounds
4. Le client reçoit seulement le code ISO, jamais le nom
5. Le serveur valide les clics et calcule les points

Cette approche garantit qu'aucune donnée sensible n'est exposée côté client.
