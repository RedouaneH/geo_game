/**
 * Point d'entrée centralisé pour toutes les configurations
 * Permet d'importer toutes les configs depuis un seul fichier
 */

const GAME_CONFIG = require('./game.config');
const { SCORING_CONFIG, calculateLocationPoints, calculateFlagPoints, getPerformanceLabel } = require('./scoring.config');
const UI_CONFIG = require('./ui.config');

module.exports = {
    GAME_CONFIG,
    SCORING_CONFIG,
    UI_CONFIG,
    
    // Export des fonctions utilitaires de scoring
    calculateLocationPoints,
    calculateFlagPoints,
    getPerformanceLabel
};
