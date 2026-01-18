/**
 * Modèle Player - Représente un joueur dans le jeu
 */

class Player {
    /**
     * Crée un nouveau joueur
     * @param {string} id - ID unique du joueur (socket.id)
     * @param {string} username - Nom d'utilisateur
     * @param {boolean} isHost - Si le joueur est l'hôte du salon
     */
    constructor(id, username, isHost = false) {
        this.id = id;
        this.username = username;
        this.score = 0;
        this.isHost = isHost;
        this.hasAnswered = false;
        this.currentAnswer = null;
    }

    /**
     * Ajoute des points au score du joueur
     * @param {number} points - Points à ajouter
     */
    addPoints(points) {
        this.score += points;
    }

    /**
     * Définit la réponse du joueur pour le round actuel
     * @param {Object} answer - Données de la réponse
     */
    setAnswer(answer) {
        this.currentAnswer = answer;
        this.hasAnswered = true;
    }

    /**
     * Réinitialise l'état de réponse pour un nouveau round
     */
    resetForNewRound() {
        this.hasAnswered = false;
        this.currentAnswer = null;
    }

    /**
     * Convertit le joueur en objet simple pour l'envoi via Socket.io
     * @returns {Object} Représentation simplifiée du joueur
     */
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            score: this.score,
            isHost: this.isHost,
            hasAnswered: this.hasAnswered
        };
    }
}

module.exports = Player;
