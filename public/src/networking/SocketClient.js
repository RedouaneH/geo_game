/**
 * SocketClient - Gestion de la communication Socket.io avec le serveur
 * Responsable de toutes les interactions réseau en temps réel
 */
class SocketClient {
    constructor() {
        this.socket = null;
        this.eventHandlers = new Map();
        this.connected = false;
    }

    /**
     * Connecte au serveur Socket.io
     */
    connect() {
        this.socket = io();
        this.setupDefaultHandlers();
        this.connected = true;
        console.log('🔌 Connexion Socket.io initialisée');
    }

    /**
     * Configure les handlers par défaut de connexion
     */
    setupDefaultHandlers() {
        this.socket.on('connect', () => {
            console.log('✅ Connecté au serveur');
            this.connected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Déconnecté du serveur');
            this.connected = false;
        });
        
        this.socket.on('error', (error) => {
            console.error('❌ Erreur Socket.io:', error);
        });
    }

    /**
     * Écoute un événement Socket.io
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction appelée lors de l'événement
     */
    on(eventName, callback) {
        if (!this.socket) {
            console.error('Socket non initialisé');
            return;
        }
        
        this.socket.on(eventName, callback);
        this.eventHandlers.set(eventName, callback);
    }

    /**
     * Émet un événement vers le serveur
     * @param {string} eventName - Nom de l'événement
     * @param {Object} data - Données à envoyer
     */
    emit(eventName, data = {}) {
        if (!this.socket) {
            console.error('Socket non initialisé');
            return;
        }
        
        this.socket.emit(eventName, data);
    }

    /**
     * Retire un listener d'événement
     * @param {string} eventName - Nom de l'événement
     */
    off(eventName) {
        if (!this.socket) return;
        
        if (this.eventHandlers.has(eventName)) {
            this.socket.off(eventName, this.eventHandlers.get(eventName));
            this.eventHandlers.delete(eventName);
        }
    }

    /**
     * Retire tous les listeners
     */
    removeAllListeners() {
        if (!this.socket) return;
        
        this.eventHandlers.forEach((callback, eventName) => {
            this.socket.off(eventName, callback);
        });
        this.eventHandlers.clear();
    }

    /**
     * Déconnecte le socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.connected = false;
            console.log('🔌 Socket déconnecté');
        }
    }

    /**
     * Vérifie si le socket est connecté
     * @returns {boolean} True si connecté
     */
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }

    /**
     * Obtient l'ID du socket
     * @returns {string|null} ID du socket ou null
     */
    getId() {
        return this.socket ? this.socket.id : null;
    }

    // ==================== ÉVÉNEMENTS ROOM ====================

    /**
     * Crée un nouveau salon
     * @param {string} username - Nom d'utilisateur
     * @param {string} difficulty - Difficulté
     * @param {string} gameMode - Mode de jeu
     */
    createRoom(username, difficulty, gameMode) {
        this.emit('createRoom', { username, difficulty, gameMode });
    }

    /**
     * Rejoint un salon existant
     * @param {string} roomCode - Code du salon
     * @param {string} username - Nom d'utilisateur
     */
    joinRoom(roomCode, username) {
        this.emit('joinRoom', { roomCode, username });
    }

    /**
     * Quitte le salon actuel
     */
    leaveRoom() {
        this.emit('leaveRoom');
    }

    /**
     * Met à jour les paramètres du salon (hôte uniquement)
     * @param {string} roomCode - Code du salon
     * @param {Object} settings - Nouveaux paramètres
     */
    updateSettings(roomCode, settings) {
        this.emit('updateSettings', { roomCode, settings });
    }

    // ==================== ÉVÉNEMENTS GAME ====================

    /**
     * Démarre une partie (hôte uniquement)
     * @param {string} roomCode - Code du salon
     * @param {Array} countries - Liste des pays sélectionnés
     */
    startGame(roomCode, countries) {
        this.emit('startGame', { roomCode, countries });
    }

    /**
     * Enregistre une réponse du joueur
     * @param {string} roomCode - Code du salon
     * @param {Object} answer - Données de la réponse
     */
    registerAnswer(roomCode, answer) {
        this.emit('registerAnswer', { roomCode, ...answer });
    }

    // ==================== ÉVÉNEMENTS REVIEW ====================

    /**
     * Affiche le résultat du joueur suivant (hôte uniquement)
     * @param {string} roomCode - Code du salon
     */
    showNextPlayerResult(roomCode) {
        this.emit('showNextPlayerResult', { roomCode });
    }

    /**
     * Passe à la question suivante (hôte uniquement)
     * @param {string} roomCode - Code du salon
     */
    skipToNextQuestion(roomCode) {
        this.emit('skipToNextQuestion', { roomCode });
    }

    /**
     * Retourne au lobby après la partie
     * @param {string} roomCode - Code du salon
     */
    returnToLobby(roomCode) {
        this.emit('returnToLobby', { roomCode });
    }

    // ==================== SETUP HANDLERS ====================

    /**
     * Configure tous les handlers d'événements pour le jeu
     * @param {Object} handlers - Objet contenant les callbacks pour chaque événement
     */
    setupGameHandlers(handlers) {
        // Room Events
        if (handlers.onRoomCreated) this.on('roomCreated', handlers.onRoomCreated);
        if (handlers.onRoomJoined) this.on('roomJoined', handlers.onRoomJoined);
        if (handlers.onJoinError) this.on('joinError', handlers.onJoinError);
        if (handlers.onPlayerJoined) this.on('playerJoined', handlers.onPlayerJoined);
        if (handlers.onPlayerLeft) this.on('playerLeft', handlers.onPlayerLeft);
        if (handlers.onSettingsUpdated) this.on('settingsUpdated', handlers.onSettingsUpdated);

        // Game Events
        if (handlers.onGameStarted) this.on('gameStarted', handlers.onGameStarted);
        if (handlers.onNewRound) this.on('newRound', handlers.onNewRound);
        if (handlers.onPlayerRegistered) this.on('playerRegistered', handlers.onPlayerRegistered);
        if (handlers.onAllPlayersAnswered) this.on('allPlayersAnswered', handlers.onAllPlayersAnswered);
        if (handlers.onRoundTimeUp) this.on('roundTimeUp', handlers.onRoundTimeUp);
        if (handlers.onRoundComplete) this.on('roundComplete', handlers.onRoundComplete);
        if (handlers.onGameComplete) this.on('gameComplete', handlers.onGameComplete);

        // Review Events
        if (handlers.onReviewPhaseStarted) this.on('reviewPhaseStarted', handlers.onReviewPhaseStarted);
        if (handlers.onShowPlayerResult) this.on('showPlayerResult', handlers.onShowPlayerResult);
        if (handlers.onGameEnded) this.on('gameEnded', handlers.onGameEnded);
        if (handlers.onReturnedToLobby) this.on('returnedToLobby', handlers.onReturnedToLobby);
    }
}

export default SocketClient;
