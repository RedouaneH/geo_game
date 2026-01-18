/**
 * Configuration du jeu - Paramètres principaux
 * Ce fichier centralise tous les paramètres du jeu pour faciliter les ajustements
 * et permettre aux agents IA de comprendre rapidement la configuration
 */

const GAME_CONFIG = {
    // Nombre de rounds par partie
    totalRounds: 10,
    
    // Codes de salon
    room: {
        codeLength: 6,
        codeCharacters: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Évite les caractères ambigus (I, O, 0, 1)
    },
    
    // Modes de jeu disponibles
    gameModes: {
        location: 'location',  // Mode localisation (cliquer sur la carte)
        flags: 'flags'         // Mode drapeaux (choix multiples)
    },
    
    // Niveaux de difficulté
    difficulties: {
        easy: {
            timer: null,              // Pas de limite de temps
            countries: 'famous',      // Pays célèbres uniquement
            label: 'Facile',
            description: 'Pays célèbres sans limite de temps'
        },
        medium: {
            timer: 30,                // 30 secondes par question
            countries: 'all',         // Tous les pays
            label: 'Moyen',
            description: '30 secondes, tous les pays'
        },
        hard: {
            timer: 15,                // 15 secondes par question
            countries: 'obscure',     // Inclut les pays obscurs
            label: 'Difficile',
            description: '15 secondes, pays difficiles inclus'
        }
    },
    
    // Options de timer pour le mode multijoueur
    timerOptions: [10, 15, 30, 60],   // Options en secondes
    defaultTimer: 10,                  // Timer par défaut en secondes
    
    // Nombre de choix dans le mode drapeaux
    flagsMode: {
        numberOfChoices: 4,           // Pays à afficher (1 correct + 3 distracteurs)
        numberOfDistractors: 3        // Nombre de mauvaises réponses
    },
    
    // Délais et marges (en millisecondes)
    delays: {
        roundTransition: 500,         // Délai avant le prochain round
        answerReveal: 1000,           // Temps pour montrer la bonne réponse
        gameStartCountdown: 3000,     // Compte à rebours avant le début
        timerMargin: 500              // Marge de sécurité pour le timer
    }
};

// Export pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}
