/**
 * Serveur GeoQuiz - Point d'entrée principal
 * Gère les connexions Socket.io et délègue la logique aux contrôleurs
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import des contrôleurs
const RoomController = require('./server/controllers/RoomController');
const GameController = require('./server/controllers/GameController');

// Import de la configuration
const { GAME_CONFIG } = require('./config');

// Import des données de pays (nécessaire pour GameController) - CÔTÉ SERVEUR UNIQUEMENT
const COUNTRIES = require('./server/data/countries');

// ==================== INITIALISATION ====================

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/config', express.static(path.join(__dirname, 'config')));

// Initialiser les contrôleurs
const roomController = new RoomController();
const gameController = new GameController(io, COUNTRIES);

const PORT = process.env.PORT || 3000;

// ==================== SOCKET.IO HANDLERS ====================

io.on('connection', (socket) => {
    console.log(`[Server] Joueur connecté: ${socket.id}`);

    // ===== GESTION DES SALONS =====

    /**
     * Crée un nouveau salon de jeu
     */
    socket.on('createRoom', ({ username, difficulty, gameMode }) => {
        const room = roomController.createRoom(socket.id, username, difficulty, gameMode);
        
        socket.join(room.code);
        socket.roomCode = room.code;
        socket.username = username;
        
        socket.emit('roomCreated', {
            roomCode: room.code,
            players: room.players.map(p => p.toJSON()),
            difficulty: room.difficulty,
            gameMode: room.gameMode,
            settings: room.settings,
            isHost: true
        });
    });

    /**
     * Rejoint un salon existant
     */
    socket.on('joinRoom', ({ roomCode, username }) => {
        const result = roomController.joinRoom(roomCode, socket.id, username);
        
        if (!result.success) {
            socket.emit('joinError', result.error);
            return;
        }
        
        const { room, player } = result;
        
        socket.join(room.code);
        socket.roomCode = room.code;
        socket.username = username;
        
        // Informer le nouveau joueur
        socket.emit('roomJoined', {
            roomCode: room.code,
            players: room.players.map(p => p.toJSON()),
            difficulty: room.difficulty,
            gameMode: room.gameMode,
            settings: room.settings,
            isHost: false
        });
        
        // Informer les autres joueurs (envoyer la liste complète des joueurs)
        socket.to(room.code).emit('playerJoined', {
            player: player.toJSON(),
            players: room.players.map(p => p.toJSON()),
            playerCount: room.players.length
        });
    });

    /**
     * Quitter le salon volontairement
     */
    socket.on('leaveRoom', () => {
        if (!socket.roomCode) return;
        
        const result = roomController.leaveRoom(socket.roomCode, socket.id);
        
        if (result.success && result.room) {
            socket.leave(socket.roomCode);
            
            // Notifier les autres joueurs (envoyer la liste complète des joueurs)
            socket.to(socket.roomCode).emit('playerLeft', {
                playerId: socket.id,
                players: result.room.players.map(p => p.toJSON()),
                playerCount: result.room.players.length,
                newHostId: result.newHost ? result.newHost.id : null
            });
        }
        
        socket.roomCode = null;
        socket.username = null;
    });

    // ===== GESTION DU JEU =====

    /**
     * Démarre la partie (hôte uniquement)
     */
    socket.on('startGame', ({ roomCode, settings }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room) {
            socket.emit('gameError', { message: 'Salon introuvable' });
            return;
        }
        
        if (room.hostId !== socket.id) {
            socket.emit('gameError', { message: 'Seul l\'hôte peut démarrer la partie' });
            return;
        }
        
        gameController.startGame(room, settings);
    });

    /**
     * Soumet une réponse pour le round actuel
     */
    socket.on('submitAnswer', ({ roomCode, answer }) => {
        const room = roomController.getRoom(roomCode);

        if (!room || room.gameState.status !== 'playing') {
            return;
        }

        gameController.submitAnswer(room, socket.id, answer);
    });

    /**
     * Enregistre une réponse du joueur (événement utilisé par le client)
     */
    socket.on('registerAnswer', (data) => {
        const room = roomController.getRoom(data.roomCode);

        if (!room || room.gameState.status !== 'playing') {
            return;
        }

        // Transformer les données du format client vers le format attendu
        const answer = {
            lat: data.clickLat,
            lng: data.clickLng,
            distance: data.distance,
            isCorrect: data.isCorrect,
            clickedCountry: data.clickedCountry,
            selectedCountry: data.selectedOption
        };

        gameController.submitAnswer(room, socket.id, answer);
    });

    /**
     * Demande le passage au round suivant (hôte uniquement)
     */
    socket.on('requestNextRound', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room) return;
        
        if (room.hostId !== socket.id) {
            socket.emit('gameError', { message: 'Seul l\'hôte peut passer au round suivant' });
            return;
        }
        
        gameController.requestNextRound(room);
    });

    /**
     * Active le mode révision (hôte uniquement)
     */
    socket.on('enableReview', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id) {
            return;
        }
        
        gameController.enableReviewMode(room);
    });

    /**
     * Affiche le résultat du joueur suivant en mode révision
     */
    socket.on('showNextPlayerResult', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id || room.gameState.status !== 'reviewing') {
            return;
        }
        
        const { reviewState } = room.gameState;
        reviewState.currentPlayerIndex++;
        
        // Si tous les joueurs du round ont été vus
        if (reviewState.currentPlayerIndex >= room.players.length) {
            reviewState.currentRound++;
            reviewState.currentPlayerIndex = 0;
            
            // Si tous les rounds ont été revus
            if (reviewState.currentRound > room.gameState.totalRounds) {
                gameController.endGame(room);
                return;
            }
        }
        
        gameController.sendReviewData(room);
    });

    /**
     * Passe à la question suivante en mode révision
     */
    socket.on('skipToNextQuestion', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id || room.gameState.status !== 'reviewing') {
            return;
        }
        
        const { reviewState } = room.gameState;
        reviewState.currentRound++;
        reviewState.currentPlayerIndex = 0;
        
        if (reviewState.currentRound > room.gameState.totalRounds) {
            gameController.endGame(room);
            return;
        }
        
        gameController.sendReviewData(room);
    });

    /**
     * Met à jour les paramètres du salon (hôte uniquement, avant le début)
     */
    socket.on('updateSettings', ({ roomCode, settings }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room || room.hostId !== socket.id || room.gameState.status !== 'waiting') {
            return;
        }
        
        const success = roomController.updateRoomSettings(roomCode, settings);
        
        if (success) {
            io.to(roomCode).emit('settingsUpdated', {
                settings: room.settings,
                difficulty: room.difficulty,
                gameMode: room.gameMode
            });
        }
    });

    // ===== RETOUR AU LOBBY =====

    /**
     * Retourne à la salle d'attente (demande individuelle)
     */
    socket.on('playerReadyForLobby', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room) {
            return;
        }
        
        gameController.playerReturnToLobby(room, socket.id, socket);
    });

    /**
     * Retourne à la salle d'attente (demandé par un joueur)
     */
    socket.on('returnToLobby', ({ roomCode }) => {
        const room = roomController.getRoom(roomCode);
        
        if (!room) {
            return;
        }
        
        // Annuler le timeout automatique s'il existe
        if (room.gameState.lobbyResetTimeout) {
            clearTimeout(room.gameState.lobbyResetTimeout);
            room.gameState.lobbyResetTimeout = null;
        }
        
        gameController.resetToLobby(room);
    });

    // ===== GESTION DES DÉCONNEXIONS =====

    /**
     * Gère la déconnexion d'un joueur
     */
    socket.on('disconnect', () => {
        console.log(`[Server] Joueur déconnecté: ${socket.id}`);
        
        if (socket.roomCode) {
            const result = roomController.leaveRoom(socket.roomCode, socket.id);
            
            if (result.success && result.room) {
                // Notifier les autres joueurs (envoyer la liste complète des joueurs)
                socket.to(socket.roomCode).emit('playerLeft', {
                    playerId: socket.id,
                    username: socket.username,
                    players: result.room.players.map(p => p.toJSON()),
                    playerCount: result.room.players.length,
                    newHostId: result.newHost ? result.newHost.id : null
                });
            }
        }
    });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🌍 GeoQuiz Server - Démarré         ║
╠════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(31)}║
║   Mode: ${(process.env.NODE_ENV || 'development').padEnd(31)}║
╚════════════════════════════════════════╝
    `);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('[Server] Arrêt du serveur...');
    server.close(() => {
        console.log('[Server] Serveur arrêté proprement');
    });
});

module.exports = { app, server, io };
