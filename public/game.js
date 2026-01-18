/**
 * GeoQuiz - Point d'entrée principal (Version modulaire)
 * Ce fichier charge les modules et initialise le jeu
 */

import GameEngine from './src/core/GameEngine.js';

// Initialiser le jeu au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    const game = new GameEngine();
    await game.init();
    
    // Exposer globalement pour le débogage (optionnel)
    window.geoQuiz = game;
});
