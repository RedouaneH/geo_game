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
                hasAnswered: false,
                isHost: true
            }],
            status: 'waiting', // waiting, playing, finished
            currentRound: 0,
            countries: [],
            roundTimer: null,
            roundStartTime: null
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
            hasAnswered: false,
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
        
        // Réinitialiser les scores
        room.players.forEach(p => {
            p.score = 0;
            p.hasAnswered = false;
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

    // Un joueur soumet sa réponse
    socket.on('submitAnswer', ({ roomCode, distance, points }) => {
        const room = rooms.get(roomCode);
        if (!room || room.status !== 'playing') return;
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.hasAnswered) return;
        
        player.hasAnswered = true;
        player.score += points;
        player.lastDistance = distance;
        player.lastPoints = points;
        
        // Calculer le temps de réponse
        const responseTime = room.roundStartTime ? Date.now() - room.roundStartTime : 0;
        
        // Informer tous les joueurs qu'un joueur a répondu
        io.to(roomCode).emit('playerAnswered', {
            playerId: socket.id,
            username: player.username,
            leaderboard: getSortedLeaderboard(room.players),
            answeredCount: room.players.filter(p => p.hasAnswered).length,
            totalPlayers: room.players.length
        });
        
        // Vérifier si tous les joueurs ont répondu
        const allAnswered = room.players.every(p => p.hasAnswered);
        if (allAnswered) {
            endCurrentRound(roomCode);
        }
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
                        
                        // Si en jeu, vérifier si tous ont répondu
                        if (room.status === 'playing') {
                            const allAnswered = room.players.every(p => p.hasAnswered);
                            if (allAnswered) {
                                endCurrentRound(socket.roomCode);
                            }
                        }
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
});

// Démarrer le prochain round
function startNextRound(roomCode) {
    const room = rooms.get(roomCode);
    if (!room || room.status !== 'playing') return;
    
    room.currentRound++;
    
    if (room.currentRound > GAME_CONFIG.totalRounds) {
        endGame(roomCode);
        return;
    }
    
    // Réinitialiser les réponses
    room.players.forEach(p => {
        p.hasAnswered = false;
        p.lastDistance = null;
        p.lastPoints = null;
    });
    
    const currentCountry = room.countries[room.currentRound - 1];
    const timerDuration = GAME_CONFIG.difficulties[room.difficulty].timer;
    
    room.roundStartTime = Date.now();
    
    // Envoyer le nouveau round à tous les joueurs
    io.to(roomCode).emit('newRound', {
        round: room.currentRound,
        totalRounds: GAME_CONFIG.totalRounds,
        country: currentCountry,
        timerDuration: timerDuration,
        leaderboard: getSortedLeaderboard(room.players)
    });
    
    // Démarrer le timer si nécessaire
    if (timerDuration) {
        room.roundTimer = setTimeout(() => {
            // Forcer la fin du round quand le temps est écoulé
            room.players.forEach(p => {
                if (!p.hasAnswered) {
                    p.hasAnswered = true;
                    p.lastDistance = null;
                    p.lastPoints = 0;
                }
            });
            endCurrentRound(roomCode);
        }, timerDuration * 1000 + 500); // +500ms de marge
    }
}

// Terminer le round actuel
function endCurrentRound(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;
    
    // Annuler le timer si actif
    if (room.roundTimer) {
        clearTimeout(room.roundTimer);
        room.roundTimer = null;
    }
    
    const currentCountry = room.countries[room.currentRound - 1];
    
    // Envoyer les résultats du round
    io.to(roomCode).emit('roundEnded', {
        round: room.currentRound,
        country: currentCountry,
        leaderboard: getSortedLeaderboard(room.players),
        playerResults: room.players.map(p => ({
            id: p.id,
            username: p.username,
            distance: p.lastDistance,
            points: p.lastPoints,
            totalScore: p.score
        }))
    });
    
    // Démarrer le prochain round après un délai
    setTimeout(() => {
        startNextRound(roomCode);
    }, 4000);
}

// Terminer la partie
function endGame(roomCode) {
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

