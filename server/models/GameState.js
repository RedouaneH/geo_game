/**
 * Modèle GameState - Gère l'état d'une partie en cours
 */

class GameState {
    /**
     * Crée un nouvel état de jeu
     * @param {Object} settings - Configuration de la partie
     */
    constructor(settings) {
        this.status = 'waiting'; // 'waiting', 'playing', 'reviewing', 'finished'
        this.currentRound = 0;
        this.totalRounds = settings.totalRounds;
        this.timer = settings.timer;
        this.countries = [];
        this.currentCountry = null;
        
        // Gestion du timing
        this.roundStartTime = null;
        this.roundTimer = null;
        this.nextRoundTimeout = null;
        
        // Stockage des réponses par round
        this.roundAnswers = []; // [{round, country, answers: []}]
        
        // État de la phase de révision
        this.reviewState = {
            currentRound: 0,
            currentPlayerIndex: 0
        };
        
        this.lobbyResetTimeout = null;
    }

    /**
     * Démarre la partie
     * @param {Array} countries - Pays sélectionnés pour la partie
     */
    startGame(countries) {
        this.status = 'playing';
        this.countries = countries;
        this.currentRound = 0;
    }

    /**
     * Passe au round suivant
     * @returns {boolean} True si un nouveau round démarre, false si la partie est terminée
     */
    nextRound() {
        this.currentRound++;
        
        if (this.currentRound > this.totalRounds) {
            this.status = 'finished';
            return false;
        }
        
        this.currentCountry = this.countries[this.currentRound - 1];
        this.roundStartTime = Date.now();
        return true;
    }

    /**
     * Enregistre une réponse pour le round actuel
     * @param {Object} answerData - Données de la réponse
     */
    addAnswer(answerData) {
        // Trouver ou créer l'objet de round
        let roundData = this.roundAnswers.find(r => r.round === this.currentRound);
        
        if (!roundData) {
            roundData = {
                round: this.currentRound,
                country: this.currentCountry,
                answers: []
            };
            this.roundAnswers.push(roundData);
        }
        
        roundData.answers.push(answerData);
    }

    /**
     * Récupère les réponses d'un round spécifique
     * @param {number} roundNumber - Numéro du round
     * @returns {Object|null} Données du round ou null si non trouvé
     */
    getRoundAnswers(roundNumber) {
        return this.roundAnswers.find(r => r.round === roundNumber) || null;
    }

    /**
     * Active le mode révision
     */
    enableReviewMode() {
        this.status = 'reviewing';
        this.reviewState.currentRound = 1;
        this.reviewState.currentPlayerIndex = 0;
    }

    /**
     * Nettoie les timers actifs
     */
    clearTimers() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
        if (this.nextRoundTimeout) {
            clearTimeout(this.nextRoundTimeout);
            this.nextRoundTimeout = null;
        }
        if (this.lobbyResetTimeout) {
            clearTimeout(this.lobbyResetTimeout);
            this.lobbyResetTimeout = null;
        }
    }

    /**
     * Convertit l'état en objet simple
     * @returns {Object} Représentation de l'état
     */
    toJSON() {
        return {
            status: this.status,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            timer: this.timer,
            currentCountry: this.currentCountry
        };
    }
}

module.exports = GameState;
