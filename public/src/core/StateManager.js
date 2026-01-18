/**
 * StateManager - Gestion centralisée de l'état du jeu
 * Responsable de stocker et mettre à jour toutes les données d'état du jeu
 */
class StateManager {
    constructor() {
        this.state = {
            // Mode de jeu
            mode: null, // 'solo' ou 'multi'
            gameMode: 'location', // 'location' ou 'flags'
            difficulty: null,
            continent: 'all', // 'all' ou nom du continent
            
            // Progression
            currentRound: 0,
            score: 0,
            totalRounds: 10,
            
            // Pays
            countries: [],
            currentCountry: null,
            currentOptions: null, // Pour le mode drapeaux
            
            // Timer
            timer: null,
            timeLeft: 0,
            
            // Statistiques
            stats: {
                perfect: 0,
                good: 0,
                average: 0,
                missed: 0
            },
            
            // Multijoueur
            socket: null,
            roomCode: null,
            username: null,
            isHost: false,
            players: [],
            
            // Réponses en mode multi
            pendingClick: null, // {lat, lng, distance, clickedCountry, isCorrect}
            hasRegistered: false,
            multiCorrectAnswers: 0,
            currentRoundCorrect: false,
            
            // Nom du pays cliqué (mode localisation)
            clickedCountryName: null
        };
    }

    /**
     * Met à jour l'état du jeu avec de nouvelles valeurs
     * @param {Object} updates - Objet contenant les propriétés à mettre à jour
     */
    updateState(updates) {
        Object.assign(this.state, updates);
    }

    /**
     * Récupère l'état complet du jeu
     * @returns {Object} L'objet d'état complet
     */
    getState() {
        return this.state;
    }

    /**
     * Réinitialise l'état pour une nouvelle partie
     * @param {string} mode - Mode de jeu ('solo' ou 'multi')
     */
    reset(mode = 'solo') {
        this.state.mode = mode;
        this.state.currentRound = 0;
        this.state.score = 0;
        this.state.countries = [];
        this.state.currentCountry = null;
        this.state.currentOptions = null;
        this.state.stats = {
            perfect: 0,
            good: 0,
            average: 0,
            missed: 0
        };
        this.state.pendingClick = null;
        this.state.hasRegistered = false;
        this.state.multiCorrectAnswers = 0;
        this.state.currentRoundCorrect = false;
        this.state.clickedCountryName = null;
        
        // Arrêter le timer s'il est actif
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    }

    /**
     * Réinitialise uniquement les données d'un round
     */
    resetRound() {
        this.state.pendingClick = null;
        this.state.hasRegistered = false;
        this.state.currentRoundCorrect = false;
        this.state.clickedCountryName = null;
        this.state.timeLeft = 0;
        
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
    }

    /**
     * Met à jour les statistiques après une réponse
     * @param {number} points - Points gagnés pour cette réponse
     */
    updateStats(points) {
        if (points >= 900) {
            this.state.stats.perfect++;
        } else if (points >= 500) {
            this.state.stats.good++;
        } else if (points > 0) {
            this.state.stats.average++;
        } else {
            this.state.stats.missed++;
        }
    }

    /**
     * Incrémente le round et met à jour le pays actuel
     * @param {Object} country - Le pays du prochain round
     */
    nextRound(country) {
        this.state.currentRound++;
        this.state.currentCountry = country;
        this.resetRound();
    }

    /**
     * Vérifie si c'est le dernier round
     * @returns {boolean} True si c'est le dernier round
     */
    isLastRound() {
        return this.state.currentRound >= this.state.totalRounds;
    }

    /**
     * Met à jour le timer
     * @param {number} timeLeft - Temps restant en secondes
     */
    updateTimer(timeLeft) {
        this.state.timeLeft = timeLeft;
    }

    /**
     * Enregistre une réponse en mode multijoueur
     * @param {Object} answer - Données de la réponse
     */
    registerMultiAnswer(answer) {
        this.state.pendingClick = answer;
        this.state.hasRegistered = true;
    }

    /**
     * Met à jour la liste des joueurs
     * @param {Array} players - Liste des joueurs
     */
    updatePlayers(players) {
        this.state.players = players;
    }

    /**
     * Définit si le joueur est l'hôte
     * @param {boolean} isHost - True si le joueur est l'hôte
     */
    setHost(isHost) {
        this.state.isHost = isHost;
    }

    /**
     * Obtient une valeur spécifique de l'état
     * @param {string} key - Clé de la valeur à récupérer
     * @returns {*} La valeur correspondante
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Définit une valeur spécifique de l'état
     * @param {string} key - Clé de la valeur à définir
     * @param {*} value - Nouvelle valeur
     */
    set(key, value) {
        this.state[key] = value;
    }
}

export default StateManager;
