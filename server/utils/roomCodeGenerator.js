/**
 * Générateur de codes de salon
 * Crée des codes uniques pour identifier les salons de jeu
 */

const { GAME_CONFIG } = require('../../config');

/**
 * Génère un code de salon unique
 * @param {Map} existingRooms - Map des salons existants pour vérifier l'unicité
 * @returns {string} Code de salon (6 caractères alphanumériques)
 */
function generateRoomCode(existingRooms) {
    const chars = GAME_CONFIG.room.codeCharacters;
    const length = GAME_CONFIG.room.codeLength;
    
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Vérifier que le code n'existe pas déjà (récursif si collision)
    if (existingRooms.has(code)) {
        return generateRoomCode(existingRooms);
    }
    
    return code;
}

module.exports = {
    generateRoomCode
};
