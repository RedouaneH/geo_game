/**
 * Configuration du système de scoring
 * Définit comment les points sont calculés pour chaque mode de jeu
 */

const SCORING_CONFIG = {
    // Système de points pour le mode localisation (basé sur la distance)
    location: {
        // Points parfaits pour un clic à l'intérieur du pays
        perfectScore: 1000,
        
        // Échelle de points selon la distance en kilomètres
        // Format: { maxDistance: distance_max_en_km, points: points_attribués }
        distanceThresholds: [
            { maxDistance: 0, points: 1000 },      // Clic dans le pays
            { maxDistance: 50, points: 950 },      // Excellent (< 50km)
            { maxDistance: 100, points: 900 },     // Très bien (< 100km)
            { maxDistance: 200, points: 850 },     // Bien (< 200km)
            { maxDistance: 300, points: 800 },     // Assez bien (< 300km)
            { maxDistance: 500, points: 700 },     // Correct (< 500km)
            { maxDistance: 750, points: 600 },     // Moyen (< 750km)
            { maxDistance: 1000, points: 500 },    // Passable (< 1000km)
            { maxDistance: 1500, points: 400 },    // Faible (< 1500km)
            { maxDistance: 2000, points: 300 },    // Très faible (< 2000km)
            { maxDistance: 2500, points: 200 },    // Mauvais (< 2500km)
            { maxDistance: 3000, points: 100 },    // Très mauvais (< 3000km)
            { maxDistance: 4000, points: 50 },     // Très éloigné (< 4000km)
            { maxDistance: 5000, points: 25 },     // Extrêmement éloigné (< 5000km)
            { maxDistance: Infinity, points: 0 }   // Au-delà de 5000km
        ],
        
        // Labels de performance selon les points
        performanceLabels: {
            perfect: { min: 1000, label: 'Parfait !' },
            excellent: { min: 900, label: 'Excellent !' },
            great: { min: 700, label: 'Très bien !' },
            good: { min: 500, label: 'Bien !' },
            average: { min: 300, label: 'Pas mal !' },
            poor: { min: 100, label: 'À améliorer' },
            bad: { min: 0, label: 'Raté' }
        }
    },
    
    // Système de points pour le mode drapeaux
    flags: {
        // Points de base pour une bonne réponse
        basePoints: 800,
        
        // Bonus maximum pour la rapidité
        maxSpeedBonus: 200,
        
        // Points pour une mauvaise réponse
        incorrectPoints: 0,
        
        // Formule: basePoints + (timeLeft / totalTime) * maxSpeedBonus
        // Exemple: 800 + (8 / 10) * 200 = 960 points si réponse en 2s sur 10s
    },
    
    // Bonus et pénalités globales
    bonuses: {
        perfectRound: 0,              // Bonus pour un round parfait (à implémenter si souhaité)
        winStreak: 0                  // Bonus pour série de bonnes réponses (à implémenter si souhaité)
    }
};

/**
 * Calcule les points basés sur la distance (mode localisation)
 * @param {number|null} distance - Distance en kilomètres entre le clic et le pays cible
 * @returns {number} Points attribués (0-1000)
 */
function calculateLocationPoints(distance) {
    if (distance === null) return 0;
    
    const thresholds = SCORING_CONFIG.location.distanceThresholds;
    
    for (let i = 0; i < thresholds.length; i++) {
        if (distance <= thresholds[i].maxDistance) {
            return thresholds[i].points;
        }
    }
    
    return 0;
}

/**
 * Calcule les points pour le mode drapeaux
 * @param {boolean} isCorrect - Si la réponse est correcte
 * @param {number} timeLeft - Temps restant en secondes
 * @param {number} totalTime - Temps total alloué en secondes
 * @returns {number} Points attribués (0-1000)
 */
function calculateFlagPoints(isCorrect, timeLeft, totalTime) {
    if (!isCorrect) return SCORING_CONFIG.flags.incorrectPoints;
    
    const basePoints = SCORING_CONFIG.flags.basePoints;
    const maxBonus = SCORING_CONFIG.flags.maxSpeedBonus;
    
    // Bonus proportionnel au temps restant
    const speedBonus = totalTime ? Math.floor((timeLeft / totalTime) * maxBonus) : maxBonus;
    
    return basePoints + speedBonus;
}

/**
 * Obtient le label de performance selon les points
 * @param {number} points - Points obtenus
 * @returns {string} Label de performance
 */
function getPerformanceLabel(points) {
    const labels = SCORING_CONFIG.location.performanceLabels;
    
    if (points >= labels.perfect.min) return labels.perfect.label;
    if (points >= labels.excellent.min) return labels.excellent.label;
    if (points >= labels.great.min) return labels.great.label;
    if (points >= labels.good.min) return labels.good.label;
    if (points >= labels.average.min) return labels.average.label;
    if (points >= labels.poor.min) return labels.poor.label;
    return labels.bad.label;
}

// Exports pour Node.js (serveur)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCORING_CONFIG,
        calculateLocationPoints,
        calculateFlagPoints,
        getPerformanceLabel
    };
}
