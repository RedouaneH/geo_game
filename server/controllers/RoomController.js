/**
 * RoomController - Gère les opérations sur les salons
 * Création, jonction, départ, et gestion des joueurs
 */

const Room = require('../models/Room');
const { generateRoomCode } = require('../utils/roomCodeGenerator');
const { GAME_CONFIG } = require('../../config');

class RoomController {
    /**
     * Crée une nouvelle instance du contrôleur
     */
    constructor() {
        this.rooms = new Map();
    }

    /**
     * Crée un nouveau salon
     * @param {string} hostId - ID Socket du créateur
     * @param {string} username - Nom d'utilisateur de l'hôte
     * @param {string} difficulty - Niveau de difficulté
     * @param {string} gameMode - Mode de jeu
     * @returns {Room} Le salon créé
     */
    createRoom(hostId, username, difficulty, gameMode) {
        const code = generateRoomCode(this.rooms);
        
        const room = new Room(code, hostId, username, {
            difficulty,
            gameMode: gameMode || 'location',
            totalRounds: GAME_CONFIG.totalRounds,
            timer: GAME_CONFIG.difficulties[difficulty].timer
        });
        
        this.rooms.set(code, room);
        console.log(`[RoomController] Salon créé: ${code} par ${username}`);
        
        return room;
    }

    /**
     * Ajoute un joueur à un salon existant
     * @param {string} roomCode - Code du salon
     * @param {string} playerId - ID du joueur
     * @param {string} username - Nom d'utilisateur
     * @returns {Object} {success: boolean, room: Room|null, player: Player|null, error: string|null}
     */
    joinRoom(roomCode, playerId, username) {
        const code = roomCode.toUpperCase();
        const room = this.rooms.get(code);
        
        if (!room) {
            return { success: false, room: null, player: null, error: 'Ce salon n\'existe pas.' };
        }
        
        if (room.gameState.status !== 'waiting') {
            return { success: false, room: null, player: null, error: 'La partie a déjà commencé.' };
        }
        
        const player = room.addPlayer(playerId, username);
        
        if (!player) {
            // Vérifier la raison spécifique
            if (room.players.length >= room.maxPlayers) {
                return { success: false, room: null, player: null, error: `Le salon est complet (${room.maxPlayers} joueurs max).` };
            } else {
                return { success: false, room: null, player: null, error: 'Ce pseudo est déjà utilisé dans ce salon.' };
            }
        }
        
        console.log(`[RoomController] ${username} a rejoint le salon ${code}`);
        return { success: true, room, player, error: null };
    }

    /**
     * Retire un joueur d'un salon
     * @param {string} roomCode - Code du salon
     * @param {string} playerId - ID du joueur
     * @returns {Object} {success: boolean, room: Room|null, removedPlayer: Player|null, newHost: Player|null}
     */
    leaveRoom(roomCode, playerId) {
        const code = roomCode.toUpperCase();
        const room = this.rooms.get(code);
        
        if (!room) {
            return { success: false, room: null, removedPlayer: null, newHost: null };
        }
        
        const { removed, newHost } = room.removePlayer(playerId);
        
        if (!removed) {
            return { success: false, room: null, removedPlayer: null, newHost: null };
        }
        
        console.log(`[RoomController] ${removed.username} a quitté le salon ${code}`);
        
        // Si le salon est vide, le supprimer
        if (room.players.length === 0) {
            this.deleteRoom(code);
        }
        
        return { success: true, room, removedPlayer: removed, newHost };
    }

    /**
     * Récupère un salon par son code
     * @param {string} roomCode - Code du salon
     * @returns {Room|null} Le salon ou null
     */
    getRoom(roomCode) {
        return this.rooms.get(roomCode.toUpperCase()) || null;
    }

    /**
     * Supprime un salon
     * @param {string} roomCode - Code du salon
     */
    deleteRoom(roomCode) {
        const code = roomCode.toUpperCase();
        const room = this.rooms.get(code);
        
        if (room) {
            room.cleanup();
            this.rooms.delete(code);
            console.log(`[RoomController] Salon ${code} supprimé`);
        }
    }

    /**
     * Met à jour les paramètres d'un salon
     * @param {string} roomCode - Code du salon
     * @param {Object} newSettings - Nouveaux paramètres
     * @returns {boolean} True si la mise à jour a réussi
     */
    updateRoomSettings(roomCode, newSettings) {
        const room = this.getRoom(roomCode);
        
        if (!room || room.gameState.status !== 'waiting') {
            return false;
        }
        
        room.updateSettings(newSettings);
        console.log(`[RoomController] Paramètres du salon ${roomCode} mis à jour`);
        
        return true;
    }

    /**
     * Obtient le nombre total de salons actifs
     * @returns {number} Nombre de salons
     */
    getRoomCount() {
        return this.rooms.size;
    }

    /**
     * Obtient le nombre total de joueurs connectés
     * @returns {number} Nombre de joueurs
     */
    getTotalPlayerCount() {
        let count = 0;
        for (const room of this.rooms.values()) {
            count += room.players.length;
        }
        return count;
    }
}

module.exports = RoomController;
