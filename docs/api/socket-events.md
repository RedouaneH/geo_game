/**
 * Documentation des Événements Socket.io
 * 
 * Ce fichier liste tous les événements WebSocket utilisés pour la communication
 * client-serveur, avec leurs payloads et descriptions.
 */

# API Socket.io - Événements

## Vue d'ensemble

La communication en temps réel utilise Socket.io avec des événements bidirectionnels.

**Convention de nommage**: camelCase pour tous les événements

---

## Événements Client → Serveur

### Gestion des Salons

#### `createRoom`
Crée un nouveau salon de jeu.

**Payload**:
```javascript
{
    username: string,      // Nom du joueur (3-20 caractères)
    difficulty: string,    // 'easy' | 'medium' | 'hard'
    gameMode: string       // 'location' | 'flags'
}
```

**Réponse**: `roomCreated`

---

#### `joinRoom`
Rejoint un salon existant.

**Payload**:
```javascript
{
    roomCode: string,      // Code du salon (6 caractères)
    username: string       // Nom du joueur (3-20 caractères)
}
```

**Réponses possibles**:
- `roomJoined` (succès)
- `roomError` (échec - salon introuvable/complet)

---

#### `leaveRoom`
Quitte le salon actuel.

**Payload**:
```javascript
{
    roomCode: string       // Code du salon
}
```

**Réponse**: `playerLeft` (broadcast à tous les joueurs)

---

### Gestion du Jeu

#### `startGame`
Démarre la partie (hôte uniquement).

**Payload**:
```javascript
{
    roomCode: string,      // Code du salon
    settings: {
        totalRounds: number,    // Nombre de rounds (1-20)
        timer: number          // Temps par round en secondes (10-60)
    }
}
```

**Réponse**: `gameStarted` (broadcast)

---

#### `submitAnswer`
Soumet la réponse du joueur pour le round actuel.

**Payload pour mode 'location'**:
```javascript
{
    roomCode: string,
    answer: {
        lat: number,          // Latitude du clic
        lng: number,          // Longitude du clic
        timestamp: number     // Timestamp de la réponse
    }
}
```

**Payload pour mode 'flags'**:
```javascript
{
    roomCode: string,
    answer: {
        countryName: string,  // Nom du pays sélectionné
        timestamp: number     // Timestamp de la réponse
    }
}
```

**Réponse**: `answerReceived` puis `showPlayerResult`

---

#### `requestNextRound`
Demande le passage au round suivant (hôte uniquement).

**Payload**:
```javascript
{
    roomCode: string
}
```

**Réponse**: `newRound` (broadcast)

---

#### `requestReview`
Active le mode revue pour voir les réponses (multijoueur uniquement).

**Payload**:
```javascript
{
    roomCode: string
}
```

**Réponse**: `reviewModeEnabled` (broadcast)

---

### Événements Système

#### `disconnect`
Déconnexion du joueur (automatique).

**Payload**: Aucun

**Effet**: Le serveur retire le joueur de son salon et notifie les autres.

---

## Événements Serveur → Client

### Gestion des Salons

#### `roomCreated`
Confirme la création du salon.

**Payload**:
```javascript
{
    roomCode: string,          // Code du salon créé
    player: {
        id: string,            // ID Socket du joueur
        username: string,      // Nom du joueur
        isHost: boolean,       // true pour le créateur
        score: number          // 0 au départ
    },
    settings: {
        difficulty: string,    // Difficulté sélectionnée
        gameMode: string,      // Mode de jeu
        totalRounds: number,   // Nombre de rounds
        timer: number          // Temps par round
    }
}
```

---

#### `roomJoined`
Confirme que le joueur a rejoint le salon.

**Payload**:
```javascript
{
    player: {
        id: string,
        username: string,
        isHost: boolean,
        score: number
    },
    players: [                 // Liste de tous les joueurs
        {
            id: string,
            username: string,
            isHost: boolean,
            score: number
        }
    ],
    settings: {
        difficulty: string,
        gameMode: string,
        totalRounds: number,
        timer: number
    }
}
```

---

#### `playerJoined`
Broadcast quand un nouveau joueur rejoint (sauf au joueur concerné).

**Payload**:
```javascript
{
    player: {
        id: string,
        username: string,
        isHost: boolean,
        score: number
    },
    playerCount: number        // Nombre total de joueurs
}
```

---

#### `playerLeft`
Broadcast quand un joueur quitte le salon.

**Payload**:
```javascript
{
    playerId: string,          // ID du joueur parti
    playerCount: number,       // Nombre de joueurs restants
    newHost: string | null     // ID du nouvel hôte si l'ancien est parti
}
```

---

#### `roomError`
Erreur lors de la tentative de rejoindre un salon.

**Payload**:
```javascript
{
    message: string            // Message d'erreur
    // Exemples:
    // - "Salon introuvable"
    // - "Le salon est complet"
    // - "La partie a déjà commencé"
}
```

---

### Flux de Jeu

#### `gameStarted`
La partie commence (broadcast à tous les joueurs).

**Payload**:
```javascript
{
    settings: {
        totalRounds: number,
        timer: number,
        gameMode: string,
        difficulty: string
    },
    countdown: number          // Secondes avant le premier round (généralement 3)
}
```

---

#### `newRound`
Démarre un nouveau round (broadcast).

**Payload pour mode 'location'**:
```javascript
{
    roundNumber: number,       // Numéro du round (1-based)
    totalRounds: number,       // Nombre total de rounds
    country: {
        name: string,          // Nom du pays à trouver
        continent: string,     // Continent
        hint: string           // Indice
    },
    timer: number,             // Durée du round en secondes
    startTime: number          // Timestamp du début
}
```

**Payload pour mode 'flags'**:
```javascript
{
    roundNumber: number,
    totalRounds: number,
    country: {
        name: string,          // Pays correct
        flag: string           // URL du drapeau (si disponible)
    },
    choices: [                 // 4 choix (1 correct + 3 distracteurs)
        {
            name: string,
            flag: string
        }
    ],
    timer: number,
    startTime: number
}
```

---

#### `answerReceived`
Confirme la réception de la réponse du joueur.

**Payload**:
```javascript
{
    playerId: string,          // ID du joueur
    timestamp: number          // Timestamp de réception
}
```

---

#### `showPlayerResult`
Affiche le résultat d'un joueur (broadcast après calcul).

**Payload pour mode 'location'**:
```javascript
{
    playerId: string,
    username: string,
    points: number,            // Points gagnés ce round
    totalScore: number,        // Score total du joueur
    distance: number,          // Distance en km
    position: {
        lat: number,           // Position du clic
        lng: number
    },
    timeElapsed: number        // Temps pris pour répondre (secondes)
}
```

**Payload pour mode 'flags'**:
```javascript
{
    playerId: string,
    username: string,
    points: number,
    totalScore: number,
    isCorrect: boolean,        // Réponse correcte?
    selectedCountry: string,   // Pays sélectionné
    timeElapsed: number
}
```

---

#### `roundComplete`
Le round est terminé (broadcast après que tous ont répondu ou temps écoulé).

**Payload**:
```javascript
{
    roundNumber: number,
    correctAnswer: {
        name: string,
        coordinates: {
            lat: number,
            lng: number
        }
    },
    leaderboard: [             // Classement actuel
        {
            id: string,
            username: string,
            score: number,
            rank: number       // Position (1-based)
        }
    ],
    nextRoundIn: number        // Secondes avant le prochain round
}
```

---

#### `gameComplete`
La partie est terminée (broadcast).

**Payload**:
```javascript
{
    finalLeaderboard: [
        {
            id: string,
            username: string,
            score: number,
            rank: number,
            stats: {
                averagePoints: number,
                bestRound: number,
                worstRound: number
            }
        }
    ],
    winner: {
        id: string,
        username: string,
        score: number
    },
    gameStats: {
        totalRounds: number,
        averageScore: number,
        totalPlayers: number
    }
}
```

---

#### `reviewModeEnabled`
Active le mode revue (multijoueur).

**Payload**:
```javascript
{
    reviewData: {
        currentRound: number,
        country: {
            name: string,
            coordinates: { lat: number, lng: number }
        },
        playerAnswers: [
            {
                id: string,
                username: string,
                position: { lat: number, lng: number },
                distance: number,
                points: number
            }
        ]
    }
}
```

---

#### `timerUpdate`
Mise à jour du timer (optionnel, peut être géré côté client).

**Payload**:
```javascript
{
    timeLeft: number           // Secondes restantes
}
```

---

## Gestion des Erreurs

### Erreurs Communes

**Salon introuvable**:
```javascript
{ event: 'roomError', data: { message: 'Salon introuvable' } }
```

**Salon complet**:
```javascript
{ event: 'roomError', data: { message: 'Le salon est complet' } }
```

**Partie déjà commencée**:
```javascript
{ event: 'roomError', data: { message: 'La partie a déjà commencé' } }
```

**Nom d'utilisateur invalide**:
```javascript
{ event: 'roomError', data: { message: 'Nom d\'utilisateur invalide' } }
```

**Seul l'hôte peut démarrer**:
```javascript
{ event: 'gameError', data: { message: 'Seul l\'hôte peut démarrer la partie' } }
```

---

## Diagramme de Séquence - Partie Complète

```
Client (Hôte)     Client (Joueur)     Serveur
     │                   │                │
     ├─ createRoom ──────┼───────────────>│
     │<── roomCreated ───┼────────────────┤
     │                   │                │
     │                   ├─ joinRoom ────>│
     │<── playerJoined ──┼────────────────┤
     │                   │<─ roomJoined ──┤
     │                   │                │
     ├─ startGame ───────┼───────────────>│
     │<── gameStarted ───┼────────────────┤
     │                   │<─ gameStarted ─┤
     │                   │                │
     │<── newRound ──────┼────────────────┤
     │                   │<─ newRound ────┤
     │                   │                │
     ├─ submitAnswer ────┼───────────────>│
     │                   ├─ submitAnswer ─>│
     │                   │    [Calcul]    │
     │<─ showPlayerResult┼────────────────┤
     │                   │<─ showPlayerResult
     │                   │                │
     │<── roundComplete ─┼────────────────┤
     │                   │<─ roundComplete┤
     │                   │                │
     ├─ requestNextRound ┼───────────────>│
     │<── newRound ──────┼────────────────┤
     │                   │<─ newRound ────┤
     │                   │                │
     │      ... (répéter pour chaque round)
     │                   │                │
     │<── gameComplete ──┼────────────────┤
     │                   │<─ gameComplete ┤
```

---

## Exemple d'Utilisation

### Côté Client

```javascript
// Connexion
const socket = io();

// Créer un salon
socket.emit('createRoom', {
    username: 'Alice',
    difficulty: 'medium',
    gameMode: 'location'
});

// Écouter la création
socket.on('roomCreated', (data) => {
    console.log('Salon créé:', data.roomCode);
});

// Soumettre une réponse
socket.emit('submitAnswer', {
    roomCode: 'ABC123',
    answer: {
        lat: 48.8566,
        lng: 2.3522,
        timestamp: Date.now()
    }
});

// Recevoir le résultat
socket.on('showPlayerResult', (data) => {
    console.log(`${data.username}: ${data.points} points`);
});
```

### Côté Serveur

```javascript
io.on('connection', (socket) => {
    
    socket.on('createRoom', ({ username, difficulty, gameMode }) => {
        const room = createRoom(username, difficulty, gameMode);
        
        socket.emit('roomCreated', {
            roomCode: room.code,
            player: room.host,
            settings: room.settings
        });
    });
    
    socket.on('submitAnswer', ({ roomCode, answer }) => {
        const result = processAnswer(roomCode, socket.id, answer);
        
        io.to(roomCode).emit('showPlayerResult', result);
    });
});
```

---

## Notes pour les Agents IA

1. **Tous les événements sont camelCase** - cohérence importante
2. **Les broadcasts utilisent `io.to(roomCode).emit()`** - envoie à tous dans le salon
3. **Les réponses individuelles utilisent `socket.emit()`** - envoie à un seul client
4. **Toujours valider les payloads** - vérifier types et valeurs avant traitement
5. **Gérer les déconnexions** - nettoyer les salons quand les joueurs partent
6. **Timestamps** - utiliser `Date.now()` pour la synchronisation
