/**
 * Sélecteur de pays pour les rounds de jeu
 * Gère la sélection des pays selon la difficulté et les distracteurs
 */

const { shuffleArray, selectRandom } = require('./arrayUtils');
const { GAME_CONFIG } = require('../../config');

/**
 * Sélectionne des pays pour une partie selon la difficulté et le continent
 * @param {Array} allCountries - Liste complète des pays disponibles
 * @param {string} difficulty - Niveau de difficulté ('easy', 'medium', 'hard')
 * @param {number} count - Nombre de pays à sélectionner
 * @param {string} continent - Continent à filtrer ('all' ou nom du continent)
 * @returns {Object} {countries: Array, actualCount: number} Pays sélectionnés et nombre réel
 */
function selectCountriesForGame(allCountries, difficulty, count, continent = 'all') {
    const difficultyConfig = GAME_CONFIG.difficulties[difficulty];
    let filteredCountries = allCountries;
    
    // Filtrer selon le niveau de difficulté
    if (difficultyConfig.countries === 'famous') {
        // Facile: seulement les pays célèbres
        filteredCountries = allCountries.filter(c => c.difficulty === 'easy' || c.difficulty === 'medium');
    } else if (difficultyConfig.countries === 'obscure') {
        // Difficile: tous les pays y compris obscurs
        filteredCountries = allCountries;
    } else {
        // Moyen: tous les pays sauf les plus obscurs
        filteredCountries = allCountries.filter(c => c.difficulty !== 'obscure');
    }
    
    // Filtrer par continent
    if (continent && continent !== 'all') {
        filteredCountries = filteredCountries.filter(c => c.continent === continent);
    }
    
    // Limiter le nombre de questions au nombre de pays disponibles
    const actualCount = Math.min(count, filteredCountries.length);
    
    // Sélectionner aléatoirement
    const selectedCountries = selectRandom(filteredCountries, actualCount);
    
    return {
        countries: selectedCountries,
        actualCount: actualCount
    };
}

/**
 * Sélectionne des pays distracteurs pour le mode drapeaux
 * @param {Object} correctCountry - Le pays correct
 * @param {Array} allCountries - Liste complète des pays
 * @param {number} count - Nombre de distracteurs (défaut: 3)
 * @returns {Array} Pays distracteurs sélectionnés
 */
function selectDistractors(correctCountry, allCountries, count = GAME_CONFIG.flagsMode.numberOfDistractors) {
    // Filtrer le pays correct
    const availableCountries = allCountries.filter(c => c.name !== correctCountry.name);
    
    // Sélectionner aléatoirement
    return selectRandom(availableCountries, count);
}

/**
 * Crée les choix pour une question du mode drapeaux
 * @param {Object} correctCountry - Le pays correct
 * @param {Array} allCountries - Liste complète des pays
 * @returns {Array} Tableau de choix mélangés (1 correct + 3 distracteurs)
 */
function createFlagChoices(correctCountry, allCountries) {
    const distractors = selectDistractors(correctCountry, allCountries);
    const choices = [correctCountry, ...distractors];
    
    // Mélanger les choix
    return shuffleArray(choices);
}

module.exports = {
    selectCountriesForGame,
    selectDistractors,
    createFlagChoices
};
