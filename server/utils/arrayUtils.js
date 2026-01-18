/**
 * Utilitaires pour les tableaux
 * Fonctions helper pour manipuler des tableaux
 */

/**
 * Mélange aléatoirement un tableau (Fisher-Yates shuffle)
 * @param {Array} array - Tableau à mélanger
 * @returns {Array} Nouveau tableau mélangé
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Sélectionne des éléments aléatoires d'un tableau sans répétition
 * @param {Array} array - Tableau source
 * @param {number} count - Nombre d'éléments à sélectionner
 * @returns {Array} Tableau des éléments sélectionnés
 */
function selectRandom(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

module.exports = {
    shuffleArray,
    selectRandom
};
