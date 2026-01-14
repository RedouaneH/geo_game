const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du jeu
const GAME_CONFIG = {
    totalRounds: 10,
    difficulties: {
        easy: { timer: null, countries: 'famous' },
        medium: { timer: 30, countries: 'all' },
        hard: { timer: 15, countries: 'obscure' }
    }
};

// Stockage des salons en mémoire
const rooms = new Map();

// Fonction pour générer un code de salon unique
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Vérifier que le code n'existe pas déjà
    if (rooms.has(code)) {
        return generateRoomCode();
    }
    return code;
}

// Fonction pour mélanger un tableau
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Obtenir le classement trié
function getSortedLeaderboard(players) {
    return [...players]
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
            ...p,
            rank: index + 1
        }));
}

// Calculer les points basés sur la distance
function calculatePoints(distance) {
    if (distance === null) return 0;
    if (distance <= 300) return 1000;
    if (distance <= 500) return 900;
    if (distance <= 750) return 800;
    if (distance <= 1000) return 700;
    if (distance <= 1500) return 550;
    if (distance <= 2000) return 400;
    if (distance <= 2500) return 300;
    if (distance <= 3000) return 200;
    if (distance <= 4000) return 100;
    if (distance <= 5000) return 50;
    return 0;
}

io.on('connection', (socket) => {
    console.log(`Joueur connecté: ${socket.id}`);

    // Créer un salon
    socket.on('createRoom', ({ username, difficulty }) => {
        const roomCode = generateRoomCode();
        
        const roomData = {
            code: roomCode,
            hostId: socket.id,
            difficulty: difficulty,
            players: [{
                id: socket.id,
                username: username,
                score: 0,
                isHost: true
            }],
            status: 'waiting', // waiting, playing, reviewing, finished
            currentRound: 0,
            countries: [],
            roundTimer: null,
            roundStartTime: null,
            // Stockage des réponses pour chaque round
            roundAnswers: [], // [{round: 1, country: {...}, answers: [{playerId, username, clickLat, clickLng, distance, points}]}]
            // État de la phase de révision
            reviewState: {
                currentRound: 0,
                currentPlayerIndex: 0
            }
        };
        
        rooms.set(roomCode, roomData);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.username = username;
        
        socket.emit('roomCreated', {
            roomCode: roomCode,
            players: roomData.players,
            difficulty: difficulty,
            isHost: true
        });
        
        console.log(`Salon créé: ${roomCode} par ${username}`);
    });

    // Rejoindre un salon
    socket.on('joinRoom', ({ roomCode, username }) => {
        const room = rooms.get(roomCode.toUpperCase());
        
        if (!room) {
            socket.emit('joinError', 'Ce salon n\'existe pas.');
            return;
        }
        
        if (room.status !== 'waiting') {
            socket.emit('joinError', 'La partie a déjà commencé.');
            return;
        }
        
        if (room.players.length >= 8) {
            socket.emit('joinError', 'Le salon est complet (8 joueurs max).');
            return;
        }
        
        // Vérifier si le nom est déjà pris
        if (room.players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
            socket.emit('joinError', 'Ce pseudo est déjà utilisé dans ce salon.');
            return;
        }
        
        const newPlayer = {
            id: socket.id,
            username: username,
            score: 0,
            isHost: false
        };
        
        room.players.push(newPlayer);
        socket.join(roomCode.toUpperCase());
        socket.roomCode = roomCode.toUpperCase();
        socket.username = username;
        
        // Envoyer la confirmation au joueur qui rejoint
        socket.emit('roomJoined', {
            roomCode: room.code,
            players: room.players,
            difficulty: room.difficulty,
            isHost: false
        });
        
        // Informer tous les autres joueurs
        socket.to(room.code).emit('playerJoined', {
            players: room.players,
            newPlayer: newPlayer
        });
        
        console.log(`${username} a rejoint le salon ${roomCode}`);
    });

    // Lancer la partie
    socket.on('startGame', ({ roomCode, countries }) => {
        const room = rooms.get(roomCode);
        
        if (!room) return;
        if (socket.id !== room.hostId) return;
        if (room.status !== 'waiting') return;
        
        // Mélanger et stocker les pays
        room.countries = shuffleArray(countries).slice(0, GAME_CONFIG.totalRounds);
        room.status = 'playing';
        room.currentRound = 0;
        room.roundAnswers = [];
        
        // Réinitialiser les scores
        room.players.forEach(p => {
            p.score = 0;
        });
        
        io.to(roomCode).emit('gameStarted', {
            totalRounds: GAME_CONFIG.totalRounds,
            difficulty: room.difficulty
        });
        
        // Démarrer le premier round après un court délai
        setTimeout(() => {
            startNextRound(roomCode);
        }, 2000);
        
        console.log(`Partie lancée dans le salon ${roomCode}`);
    });

    // Un joueur enregistre/modifie sa réponse (pas de soumission finale)
    socket.on('registerAnswer', ({ roomCode, clickLat, clickLng, distance }) => {
        const room = rooms.get(roomCode);
        if (!room || room.status !== 'playing') return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        
        // Trouver ou créer l'entrée pour ce round
        let roundData = room.roundAnswers.find(r => r.round === room.currentRound);
        if (!roundData) {
            roundData = {
                round: room.currentRound,
                country: room.countries[room.currentRound - 1],
                answers: []
            };
            room.roundAnswers.push(roundData);
        }
        
        // Trouver ou créer la réponse du joueur
        let playerAnswer = roundData.answers.find(a => a.playerId === socket.id);
        if (!playerAnswer) {
            playerAnswer = {
                playerId: socket.id,
                username: player.username
            };
            roundData.answers.push(playerAnswer);
        }
        
        // Mettre à jour la réponse (permet les modifications)
        playerAnswer.clickLat = clickLat;
        playerAnswer.clickLng = clickLng;
        playerAnswer.distance = distance;
        playerAnswer.points = calculatePoints(distance);
        
        // Informer tous les joueurs qu'un joueur a enregistré une réponse
        io.to(roomCode).emit('playerRegistered', {
            playerId: socket.id,
            username: player.username,
            registeredCount: roundData.answers.filter(a => a.clickLat !== null && a.clickLat !== undefined).length,
            totalPlayers: room.players.length
        });
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté: ${socket.id}`);
        
        if (socket.roomCode) {
            const room = rooms.get(socket.roomCode);
            if (room) {
                // Retirer le joueur
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    const removedPlayer = room.players.splice(playerIndex, 1)[0];
                    
                    // Si le salon est vide, le supprimer
                    if (room.players.length === 0) {
                        if (room.roundTimer) clearTimeout(room.roundTimer);
                        rooms.delete(socket.roomCode);
                        console.log(`Salon ${socket.roomCode} supprimé (vide)`);
                    } else {
                        // Si c'était l'hôte, transférer
                        if (socket.id === room.hostId) {
                            room.hostId = room.players[0].id;
                            room.players[0].isHost = true;
                        }
                        
                        // Informer les autres
                        io.to(socket.roomCode).emit('playerLeft', {
                            players: room.players,
                            leftPlayer: removedPlayer,
                            newHostId: room.hostId
                        });
                    }
                }
            }
        }
    });

    // Quitter le salon volontairement
    socket.on('leaveRoom', () => {
        if (socket.roomCode) {
            const room = rooms.get(socket.roomCode);
            if (room) {
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    const removedPlayer = room.players.splice(playerIndex, 1)[0];
                    socket.leave(socket.roomCode);
                    
                    if (room.players.length === 0) {
                        if (room.roundTimer) clearTimeout(room.roundTimer);
                        rooms.delete(socket.roomCode);
                    } else {
                        if (socket.id === room.hostId) {
                            room.hostId = room.players[0].id;
                            room.players[0].isHost = true;
                        }
                        
                        io.to(socket.roomCode).emit('playerLeft', {
                            players: room.players,
                            leftPlayer: removedPlayer,
                            newHostId: room.hostId
                        });
                    }
                }
            }
            socket.roomCode = null;
        }
    });

    // === Contrôles de l'hôte pour la phase de révision ===
    
    // L'hôte demande de voir le résultat du joueur suivant
    socket.on('showNextPlayerResult', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.status !== 'reviewing') return;
        if (socket.id !== room.hostId) return;
        
        const state = room.reviewState;
        const currentRoundData = room.roundAnswers.find(r => r.round === state.currentRound);
        
        if (!currentRoundData) return;
        
        // Passer au joueur suivant
        state.currentPlayerIndex++;
        
        // Si on a vu tous les joueurs, passer à la question suivante
        if (state.currentPlayerIndex >= room.players.length) {
            state.currentRound++;
            state.currentPlayerIndex = 0;
            
            // Vérifier si toutes les questions ont été revues
            if (state.currentRound > room.roundAnswers.length) {
                // Fin de la révision, afficher le classement final
                finishReview(roomCode);
                return;
            }
        }
        
        // Envoyer les données du joueur actuel pour le round actuel
        sendCurrentReviewState(roomCode);
    });
    
    // L'hôte demande à passer à la question suivante (sans voir tous les joueurs restants)
    socket.on('skipToNextQuestion', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.status !== 'reviewing') return;
        if (socket.id !== room.hostId) return;
        
        const state = room.reviewState;
        state.currentRound++;
        state.currentPlayerIndex = 0;
        
        // Vérifier si toutes les questions ont été revues
        if (state.currentRound > room.roundAnswers.length) {
            finishReview(roomCode);
            return;
        }
        
        sendCurrentReviewState(roomCode);
    });
});

// Démarrer le prochain round
function startNextRound(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'playing') return;
    
    room.currentRound++;
    
    if (room.currentRound > GAME_CONFIG.totalRounds) {
        // Toutes les questions terminées, passer à la phase de révision
        startReviewPhase(roomCode);
        return;
    }
    
    const currentCountry = room.countries[room.currentRound - 1];
    const timerDuration = GAME_CONFIG.difficulties[room.difficulty].timer;
    
    room.roundStartTime = Date.now();
    
    // Créer l'entrée pour ce round
    room.roundAnswers.push({
        round: room.currentRound,
        country: currentCountry,
        answers: []
    });
    
    // Envoyer le nouveau round à tous les joueurs
    io.to(roomCode).emit('newRound', {
        round: room.currentRound,
        totalRounds: GAME_CONFIG.totalRounds,
        country: currentCountry,
        timerDuration: timerDuration
    });
    
    // Démarrer le timer si nécessaire
    if (timerDuration) {
        room.roundTimer = setTimeout(() => {
            endCurrentRound(roomCode);
        }, timerDuration * 1000 + 500); // +500ms de marge
    }
}

// Terminer le round actuel (appelé quand le temps est écoulé)
function endCurrentRound(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    // Annuler le timer si actif
    if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
    }
    
    // Compléter les réponses des joueurs qui n'ont pas cliqué
    const roundData = room.roundAnswers.find(r => r.round === room.currentRound);
    if (roundData) {
        room.players.forEach(player => {
            const hasAnswer = roundData.answers.some(a => a.playerId === player.id);
            if (!hasAnswer) {
                roundData.answers.push({
                    playerId: player.id,
                    username: player.username,
                    clickLat: null,
                    clickLng: null,
                    distance: null,
                    points: 0
                });
            }
        });
    }
    
    // Notifier que le round est terminé (sans montrer les résultats)
    io.to(roomCode).emit('roundTimeUp', {
        round: room.currentRound,
        totalRounds: GAME_CONFIG.totalRounds
    });
    
    // Démarrer le prochain round après un court délai
    setTimeout(() => {
        startNextRound(roomCode);
    }, 2000);
}

// Démarrer la phase de révision des résultats
function startReviewPhase(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    room.status = 'reviewing';
    
    // Calculer les scores finaux basés sur les réponses enregistrées
    room.players.forEach(player => {
        player.score = 0;
        room.roundAnswers.forEach(roundData => {
            const answer = roundData.answers.find(a => a.playerId === player.id);
            if (answer) {
                player.score += answer.points || 0;
            }
        });
    });
    
    // Initialiser l'état de révision
    room.reviewState = {
        currentRound: 1,
        currentPlayerIndex: 0
    };
    
    // Notifier tous les joueurs que la phase de révision commence
    io.to(roomCode).emit('reviewPhaseStarted', {
        totalRounds: room.roundAnswers.length,
        totalPlayers: room.players.length,
        hostId: room.hostId
    });
    
    // Envoyer le premier état de révision
    sendCurrentReviewState(roomCode);
    
    console.log(`Phase de révision commencée pour le salon ${roomCode}`);
}

// Envoyer l'état actuel de la révision à tous les joueurs
function sendCurrentReviewState(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'reviewing') return;
    
    const state = room.reviewState;
    const roundData = room.roundAnswers.find(r => r.round === state.currentRound);
    
    if (!roundData) return;
    
    // Récupérer les joueurs dans l'ordre original
    const playersList = room.players.map(p => p.id);
    const currentPlayerId = playersList[state.currentPlayerIndex];
    const currentPlayer = room.players.find(p => p.id === currentPlayerId);
    const playerAnswer = roundData.answers.find(a => a.playerId === currentPlayerId);
    
    io.to(roomCode).emit('showPlayerResult', {
        round: state.currentRound,
        totalRounds: room.roundAnswers.length,
        playerIndex: state.currentPlayerIndex,
        totalPlayers: room.players.length,
        country: roundData.country,
        player: {
            id: currentPlayerId,
            username: currentPlayer ? currentPlayer.username : 'Inconnu'
        },
        result: playerAnswer ? {
            clickLat: playerAnswer.clickLat,
            clickLng: playerAnswer.clickLng,
            distance: playerAnswer.distance,
            points: playerAnswer.points
        } : {
            clickLat: null,
            clickLng: null,
            distance: null,
            points: 0
        },
        isLastPlayerForRound: state.currentPlayerIndex >= room.players.length - 1,
        isLastRound: state.currentRound >= room.roundAnswers.length
    });
}

// Terminer la phase de révision et afficher le classement final
function finishReview(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    room.status = 'finished';
    
    const finalLeaderboard = getSortedLeaderboard(room.players);
    
    io.to(roomCode).emit('gameEnded', {
        leaderboard: finalLeaderboard,
        winner: finalLeaderboard[0]
    });
    
    console.log(`Partie terminée dans le salon ${roomCode}`);
    
    // Supprimer le salon après 5 minutes
    setTimeout(() => {
        if (rooms.has(roomCode)) {
            rooms.delete(roomCode);
            console.log(`Salon ${roomCode} supprimé (expiration)`);
        }
    }, 5 * 60 * 1000);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌍 GeoQuiz Multijoueur lancé sur http://localhost:${PORT}`);
});
