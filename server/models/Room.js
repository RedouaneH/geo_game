/**
 * Modèle Room - Représente un salon de jeu
 */

const Player = require('./Player');
const GameState = require('./GameState');

class Room {
    /**
     * Crée un nouveau salon
     * @param {string} code - Code unique du salon
     * @param {string} hostId - ID du joueur hôte
     * @param {string} hostUsername - Nom d'utilisateur de l'hôte
     * @param {Object} config - Configuration du salon
     */
    constructor(code, hostId, hostUsername, config) {
        this.code = code;
        this.hostId = hostId;
        this.difficulty = config.difficulty;
        this.gameMode = config.gameMode || 'location';
        
        // Configuration de la partie
        this.settings = {
            totalRounds: config.totalRounds,
            timer: config.timer,
            continent: config.continent || 'all'
        };
        
        // Liste des joueurs
        this.players = [new Player(hostId, hostUsername, true)];
        
        // État du jeu
        this.gameState = new GameState(this.settings);
        
        // Limite de joueurs
        this.maxPlayers = 8;
        
        // Suivi de l'emplacement des joueurs (lobby, playing, leaderboard)
        this.playerLocations = new Map();
        this.playerLocations.set(hostId, 'lobby');
    }

    /**
     * Ajoute un joueur au salon
     * @param {string} playerId - ID du joueur
     * @param {string} username - Nom d'utilisateur
     * @returns {Player|null} Le joueur créé ou null si impossible d'ajouter
     */
    addPlayer(playerId, username) {
        // Vérifier si le salon est plein
        if (this.players.length >= this.maxPlayers) {
            return null;
        }
        
        // Vérifier si le nom est déjà pris
        if (this.players.some(p => p.username.toLowerCase() === username.toLowerCase())) {
            return null;
        }
        
        const newPlayer = new Player(playerId, username, false);
        this.players.push(newPlayer);
        this.playerLocations.set(playerId, 'lobby');
        return newPlayer;
    }

    /**
     * Retire un joueur du salon
     * @param {string} playerId - ID du joueur à retirer
     * @returns {Object} {removed: Player|null, newHost: Player|null}
     */
    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        
        if (playerIndex === -1) {
            return { removed: null, newHost: null };
        }
        
        const removedPlayer = this.players.splice(playerIndex, 1)[0];
        let newHost = null;
        
        // Supprimer du suivi des emplacements
        this.playerLocations.delete(playerId);
        
        // Si l'hôte part et qu'il reste des joueurs, désigner un nouvel hôte
        if (removedPlayer.isHost && this.players.length > 0) {
            this.players[0].isHost = true;
            this.hostId = this.players[0].id;
            newHost = this.players[0];
        }
        
        return { removed: removedPlayer, newHost };
    }

    /**
     * Récupère un joueur par son ID
     * @param {string} playerId - ID du joueur
     * @returns {Player|null} Le joueur ou null
     */
    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId) || null;
    }

    /**
     * Vérifie si tous les joueurs ont répondu
     * @returns {boolean} True si tous ont répondu
     */
    allPlayersAnswered() {
        return this.players.every(p => p.hasAnswered);
    }

    /**
     * Réinitialise les réponses de tous les joueurs pour un nouveau round
     */
    resetPlayersForNewRound() {
        this.players.forEach(p => p.resetForNewRound());
    }

    /**
     * Obtient le classement trié par score
     * @returns {Array} Joueurs triés par score décroissant avec leur rang
     */
    getLeaderboard() {
        return [...this.players]
            .sort((a, b) => b.score - a.score)
            .map((player, index) => ({
                ...player.toJSON(),
                rank: index + 1
            }));
    }

    /**
     * Met à jour les paramètres du salon
     * @param {Object} newSettings - Nouveaux paramètres
     */
    updateSettings(newSettings) {
        if (newSettings.totalRounds !== undefined) {
            this.settings.totalRounds = newSettings.totalRounds;
            this.gameState.totalRounds = newSettings.totalRounds;
        }
        if (newSettings.timer !== undefined) {
            this.settings.timer = newSettings.timer;
            this.gameState.timer = newSettings.timer;
        }
        if (newSettings.continent !== undefined) {
            this.settings.continent = newSettings.continent;
        }
        if (newSettings.difficulty !== undefined) {
            this.difficulty = newSettings.difficulty;
        }
        if (newSettings.gameMode !== undefined) {
            this.gameMode = newSettings.gameMode;
        }
    }

    /**
     * Nettoie les ressources du salon
     */
    cleanup() {
        this.gameState.clearTimers();
    }

    /**
     * Convertit le salon en objet simple pour l'envoi
     * @returns {Object} Représentation du salon
     */
    toJSON() {
        return {
            code: this.code,
            difficulty: this.difficulty,
            gameMode: this.gameMode,
            settings: this.settings,
            players: this.players.map(p => p.toJSON()),
            gameState: this.gameState.toJSON(),
            playerCount: this.players.length,
            maxPlayers: this.maxPlayers
        };
    }
}

module.exports = Room;
