/**
 * GameEngine - Orchestration principale du jeu
 * Point central qui coordonne tous les modules et gère la logique métier
 */
import StateManager from './StateManager.js';
import MapManager from './MapManager.js';
import ScreenManager from '../ui/ScreenManager.js';
import SocketClient from '../networking/SocketClient.js';
import UIComponents from '../ui/UIComponents.js';
import { COUNTRY_NAME_MAPPING, mapCountryName, getCountryFrenchName } from '../data/countryMapping.js';

class GameEngine {
    constructor() {
        // Initialisation des modules
        this.stateManager = new StateManager();
        this.mapManager = new MapManager();
        this.screenManager = new ScreenManager();
        this.socketClient = new SocketClient();

        // Référence aux pays (sera chargée depuis countries.js global)
        // Utilisé pour le mode solo uniquement, le mode multi utilise le serveur
        this.countries = window.COUNTRIES || [];

        // Configuration du jeu
        this.config = {
            totalRounds: 10,
            maxScore: 1000,
            difficulties: {
                easy: {
                    name: 'Facile',
                    timer: null,
                    showHint: true,
                    countries: 'famous'
                },
                medium: {
                    name: 'Moyen',
                    timer: 30,
                    showHint: true,
                    countries: 'all'
                },
                hard: {
                    name: 'Difficile',
                    timer: 15,
                    showHint: false,
                    countries: 'obscure'
                },
                random: {
                    name: 'Aléatoire',
                    timer: 25,
                    showHint: false,
                    countries: 'random'
                }
            }
        };
        
        // Éléments DOM
        this.elements = this.initializeElements();
    }

    /**
     * Initialise toutes les références aux éléments DOM
     * @returns {Object} Map des éléments DOM
     */
    initializeElements() {
        return {
            // Mode selection
            soloModeBtn: document.getElementById('solo-mode-btn'),
            multiModeBtn: document.getElementById('multi-mode-btn'),
            
            // Solo
            soloGameMode: document.getElementById('solo-game-mode'),
            soloDifficulty: document.getElementById('solo-difficulty'),
            soloContinent: document.getElementById('solo-continent'),
            startBtn: document.getElementById('start-btn'),
            backToModeBtn: document.getElementById('back-to-mode-btn'),
            backToModeBtn2: document.getElementById('back-to-mode-btn-2'),
            
            // Lobby
            usernameInput: document.getElementById('username-input'),
            createRoomBtn: document.getElementById('create-room-btn'),
            roomCodeInput: document.getElementById('room-code-input'),
            joinRoomBtn: document.getElementById('join-room-btn'),
            lobbyError: document.getElementById('lobby-error'),
            
            // Waiting Room
            displayRoomCode: document.getElementById('display-room-code'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            copyLinkBtn: document.getElementById('copy-link-btn'),
            roomDifficultyDisplay: document.getElementById('room-difficulty-display'),
            playersCount: document.getElementById('players-count'),
            playersList: document.getElementById('players-list'),
            leaveRoomBtn: document.getElementById('leave-room-btn'),
            startMultiGameBtn: document.getElementById('start-multi-game-btn'),
            waitingMessage: document.getElementById('waiting-message'),
            
            // Room Settings
            settingGameMode: document.getElementById('setting-game-mode'),
            settingQuestions: document.getElementById('setting-questions'),
            settingTime: document.getElementById('setting-time'),
            settingDifficulty: document.getElementById('setting-difficulty'),
            settingContinent: document.getElementById('setting-continent'),
            
            // Game
            backBtn: document.getElementById('back-btn'),
            currentDifficulty: document.getElementById('current-difficulty'),
            currentRound: document.getElementById('current-round'),
            countryName: document.getElementById('country-name'),
            score: document.getElementById('score'),
            timerContainer: document.getElementById('timer-container'),
            timer: document.getElementById('timer'),
            timerProgress: document.getElementById('timer-progress'),
            
            // Flag Game
            flagGameContainer: document.getElementById('flag-game-container'),
            flagImage: document.getElementById('flag-image'),
            flagAnswerInput: document.getElementById('flag-answer-input'),
            flagSubmitBtn: document.getElementById('flag-submit-btn'),
            flagFeedback: document.getElementById('flag-feedback'),
            
            // Multi - indicateur d'enregistrement
            multiRegisteredOverlay: document.getElementById('multi-registered-overlay'),
            registeredStatus: document.getElementById('registered-status'),
            registeredCount: document.getElementById('registered-count'),
            totalPlayersGame: document.getElementById('total-players-game'),
            
            // Solo Result
            nextBtn: document.getElementById('next-btn'),
            
            // End Screen Solo
            finalScore: document.getElementById('final-score'),
            statPerfect: document.getElementById('stat-perfect'),
            statGood: document.getElementById('stat-good'),
            statAverage: document.getElementById('stat-average'),
            statMissed: document.getElementById('stat-missed'),
            replayBtn: document.getElementById('replay-btn'),
            menuBtn: document.getElementById('menu-btn'),
            confetti: document.getElementById('confetti'),
            
            // End Screen Multi
            multiEndTitle: document.getElementById('multi-end-title'),
            podium1: document.getElementById('podium-1'),
            podium2: document.getElementById('podium-2'),
            podium3: document.getElementById('podium-3'),
            fullLeaderboard: document.getElementById('full-leaderboard'),
            roundsSummary: document.getElementById('rounds-summary'),
            roundsList: document.getElementById('rounds-list'),
            multiConfetti: document.getElementById('multi-confetti'),
            multiMenuBtn: document.getElementById('multi-menu-btn'),
            multiReplayBtn: document.getElementById('multi-replay-btn'),
            
            // Review Screen
            reviewRoundInfo: document.getElementById('review-round-info'),
            reviewPlayerInfo: document.getElementById('review-player-info'),
            reviewCountryName: document.getElementById('review-country-name'),
            reviewResultEmoji: document.getElementById('review-result-emoji'),
            reviewResultTitle: document.getElementById('review-result-title'),
            reviewDistance: document.getElementById('review-distance'),
            reviewPoints: document.getElementById('review-points'),
            reviewMapContainer: document.getElementById('review-map-container'),
            reviewFlagContainer: document.getElementById('review-flag-container'),
            reviewFlagImage: document.getElementById('review-flag-image'),
            reviewCorrectAnswer: document.getElementById('review-correct-answer'),
            reviewGivenAnswer: document.getElementById('review-given-answer'),
            reviewPlayerPseudo: document.getElementById('review-player-pseudo'),
            nextPlayerBtn: document.getElementById('next-player-btn'),
            skipQuestionBtn: document.getElementById('skip-question-btn'),
            reviewHostControls: document.getElementById('review-host-controls'),
            reviewWaitingMessage: document.getElementById('review-waiting-message')
        };
    }

    /**
     * Initialise le jeu
     * @returns {Promise<void>}
     */
    async init() {
        console.log('🎮 Initialisation de GeoQuiz...');
        
        // Initialiser la carte
        await this.mapManager.initMap('map');
        
        // Connecter le socket
        this.socketClient.connect();
        
        // Configurer les événements
        this.setupUIEvents();
        this.setupSocketEvents();
        this.setupMapCallbacks();
        
        // Configurer la navigation par historique
        this.screenManager.setupHistoryNavigation();
        
        // Vérifier les paramètres URL (pour les liens de partage)
        const hasRoomCode = this.screenManager.checkURLParams();
        
        // Afficher l'écran d'accueil uniquement si aucun lien de partage n'a été détecté
        if (!hasRoomCode) {
            this.screenManager.showScreen('mode');
        }
        
        console.log('✅ GeoQuiz initialisé');
    }

    /**
     * Configure tous les événements UI
     */
    setupUIEvents() {
        // Mode selection
        this.elements.soloModeBtn?.addEventListener('click', () => this.selectMode('solo'));
        this.elements.multiModeBtn?.addEventListener('click', () => this.selectMode('multi'));

        // Solo game mode selection
        this.elements.soloGameMode?.addEventListener('change', (e) => {
            this.stateManager.updateState({ gameMode: e.target.value });
        });
        
        // Solo difficulty selection
        this.elements.soloDifficulty?.addEventListener('change', (e) => {
            this.stateManager.updateState({ difficulty: e.target.value });
        });
        
        // Solo continent selection
        this.elements.soloContinent?.addEventListener('change', (e) => {
            this.stateManager.updateState({ continent: e.target.value });
        });

        // Navigation buttons
        this.elements.startBtn?.addEventListener('click', () => this.startSoloGame());
        this.elements.backToModeBtn?.addEventListener('click', () => this.screenManager.showScreen('mode'));
        this.elements.backToModeBtn2?.addEventListener('click', () => this.returnToModeFromLobby());
        this.elements.backBtn?.addEventListener('click', () => this.handleBackFromGame());
        this.elements.nextBtn?.addEventListener('click', () => this.nextRound());
        this.elements.replayBtn?.addEventListener('click', () => this.replay());
        this.elements.menuBtn?.addEventListener('click', () => this.goToMenu());
        this.elements.multiMenuBtn?.addEventListener('click', () => this.goToMenu());
        this.elements.multiReplayBtn?.addEventListener('click', () => this.returnToLobby());

        // Lobby
        this.elements.createRoomBtn?.addEventListener('click', () => this.createRoom());
        this.elements.joinRoomBtn?.addEventListener('click', () => this.joinRoom());
        this.elements.roomCodeInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Waiting Room
        this.elements.copyCodeBtn?.addEventListener('click', () => this.copyRoomCode());
        this.elements.copyLinkBtn?.addEventListener('click', () => this.copyRoomLink());
        this.elements.leaveRoomBtn?.addEventListener('click', () => this.leaveRoom());
        this.elements.startMultiGameBtn?.addEventListener('click', () => this.startMultiGame());
        
        // Settings
        this.elements.settingGameMode?.addEventListener('change', () => this.updateRoomSettings());
        this.elements.settingQuestions?.addEventListener('change', () => this.updateRoomSettings());
        this.elements.settingTime?.addEventListener('change', () => this.updateRoomSettings());
        this.elements.settingDifficulty?.addEventListener('change', () => this.updateRoomSettings());
        this.elements.settingContinent?.addEventListener('change', () => this.updateRoomSettings());
        
        // Review controls
        this.elements.nextPlayerBtn?.addEventListener('click', () => this.showNextPlayerResult());
        this.elements.skipQuestionBtn?.addEventListener('click', () => this.skipToNextQuestion());
        
        // Flag mode
        this.elements.flagSubmitBtn?.addEventListener('click', () => this.submitFlagAnswer());
        this.elements.flagAnswerInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitFlagAnswer();
        });
    }

    /**
     * Configure les événements Socket.io
     */
    setupSocketEvents() {
        this.socketClient.setupGameHandlers({
            // Room Events
            onRoomCreated: (data) => this.onRoomCreated(data),
            onRoomJoined: (data) => this.onRoomJoined(data),
            onJoinError: (message) => UIComponents.showLobbyError(message, this.elements.lobbyError),
            onPlayerJoined: (data) => this.onPlayerJoined(data),
            onPlayerLeft: (data) => this.onPlayerLeft(data),
            onSettingsUpdated: (data) => this.onSettingsUpdated(data),
            
            // Game Events
            onGameStarted: (data) => this.onGameStarted(data),
            onNewRound: (data) => this.onNewRound(data),
            onPlayerRegistered: (data) => this.onPlayerRegistered(data),
            onAllPlayersAnswered: (data) => this.onAllPlayersAnswered(data),
            onRoundTimeUp: (data) => this.onRoundTimeUp(data),
            onRoundComplete: (data) => this.onRoundComplete(data),
            onGameComplete: (data) => this.onGameComplete(data),
            
            // Review Events
            onReviewPhaseStarted: (data) => this.onReviewPhaseStarted(data),
            onShowPlayerResult: (data) => this.onShowPlayerResult(data),
            onGameEnded: (data) => this.onGameEnded(data),
            onReturnedToLobby: (data) => this.onReturnedToLobby(data)
        });
        
        // Individual return events
        this.socketClient.on('youReturnedToLobby', (data) => this.onYouReturnedToLobby(data));
        this.socketClient.on('playerArrivedInLobby', (data) => this.onPlayerArrivedInLobby(data));
    }

    /**
     * Configure les callbacks de la carte
     */
    setupMapCallbacks() {
        this.mapManager.onCountryClick((clickedCountryEnglish, latlng, feature) => {
            this.handleCountryClick(clickedCountryEnglish, latlng, feature);
        });
        
        this.mapManager.onMapClick((latlng) => {
            this.handleMapClick(latlng);
        });
    }

    // ==================== MODE SELECTION ====================

    /**
     * Sélectionne le mode de jeu (solo/multi)
     * @param {string} mode - 'solo' ou 'multi'
     */
    selectMode(mode) {
        this.stateManager.updateState({ mode });
        if (mode === 'solo') {
            // Initialiser les valeurs par défaut depuis les dropdowns
            this.stateManager.updateState({
                gameMode: this.elements.soloGameMode?.value || 'location',
                difficulty: this.elements.soloDifficulty?.value || 'easy',
                continent: this.elements.soloContinent?.value || 'all'
            });
            this.screenManager.showWelcomeScreen();
        } else {
            this.screenManager.showLobbyScreen();
        }
    }

    // ==================== SOLO MODE ====================

    /**
     * Démarre une partie solo
     */
    startSoloGame() {
        const state = this.stateManager.getState();
        this.stateManager.reset('solo');
        this.stateManager.updateState({
            gameMode: state.gameMode,
            difficulty: state.difficulty,
            continent: state.continent
        });
        
        this.prepareCountries();

        const diffConfig = this.config.difficulties[state.difficulty];
        this.elements.currentDifficulty.textContent = diffConfig.name;
        
        const isLocation = state.gameMode === 'location';
        UIComponents.updateScore(0, this.config.totalRounds, this.elements.score, isLocation);
        
        // Mettre à jour le label du score
        const scoreLabel = document.querySelector('.score-label');
        if (scoreLabel) {
            scoreLabel.textContent = isLocation ? 'Réussite' : 'Score';
        }

        // Masquer le prompt pendant la préparation
        const countryPrompt = document.querySelector('.country-prompt');
        if (countryPrompt) {
            countryPrompt.style.visibility = 'hidden';
        }
        
        // Mettre à jour l'UI des rounds
        const roundInfo = document.querySelector('.round-info');
        if (roundInfo) {
            roundInfo.innerHTML = `Question <span id="current-round">0</span>/${this.config.totalRounds}`;
            this.elements.currentRound = document.getElementById('current-round');
        }

        // Préparer l'affichage selon le mode
        if (state.gameMode === 'flags') {
            document.getElementById('map').style.display = 'none';
            this.elements.flagGameContainer.classList.remove('hidden');
            this.elements.flagImage.style.visibility = 'hidden';
        } else {
            document.getElementById('map').style.display = 'block';
            this.elements.flagGameContainer.classList.add('hidden');
        }

        if (diffConfig.timer) {
            this.elements.timerContainer.classList.remove('hidden');
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        this.screenManager.showGameScreen();

        // Démarrer le premier round
        if (state.gameMode === 'flags') {
            this.nextRound();
        } else {
            setTimeout(() => {
                this.mapManager.invalidateSize();
                this.mapManager.setContinentView(state.continent);
                this.nextRound();
            }, 100);
        }
    }

    /**
     * Prépare la liste des pays pour la partie
     */
    prepareCountries() {
        const state = this.stateManager.getState();
        const { difficulty, continent } = state;
        let pool = [];

        // Filtrage par difficulté
        if (difficulty === 'easy') {
            pool = this.countries.filter(c => c.difficulty === 'easy');
        } else if (difficulty === 'medium') {
            pool = this.countries.filter(c => c.difficulty === 'easy' || c.difficulty === 'medium');
        } else if (difficulty === 'hard') {
            pool = this.countries.filter(c => c.difficulty === 'hard');
        } else if (difficulty === 'random') {
            pool = [...this.countries];
        } else {
            pool = this.countries.filter(c => c.difficulty === 'hard');
        }

        // Filtrage par continent
        if (continent && continent !== 'all') {
            pool = pool.filter(c => c.continent === continent);
        }

        // Si le pool est trop petit
        if (pool.length < this.config.totalRounds && continent && continent !== 'all') {
            pool = this.countries.filter(c => c.continent === continent);
        }

        if (pool.length === 0) {
            pool = [...this.countries];
        }

        const selected = this.shuffleArray(pool).slice(0, Math.min(this.config.totalRounds, pool.length));
        this.stateManager.updateState({ countries: selected });
    }

    /**
     * Mélange un tableau
     * @param {Array} array - Tableau à mélanger
     * @returns {Array} Tableau mélangé
     */
    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * Passe au round suivant
     */
    nextRound() {
        const state = this.stateManager.getState();
        
        // Mode solo uniquement
        if (state.mode !== 'solo') return;

        this.elements.nextBtn.classList.add('hidden');
        this.mapManager.clearMarkers();

        if (state.currentRound >= this.config.totalRounds) {
            this.endGame();
            return;
        }

        const country = state.countries[state.currentRound];
        this.stateManager.nextRound(country);

        this.elements.currentRound.textContent = state.currentRound;

        const diffConfig = this.config.difficulties[state.difficulty];
        const countryPrompt = document.querySelector('.country-prompt');
        
        if (state.gameMode === 'flags') {
            if (countryPrompt) countryPrompt.style.visibility = 'hidden';
            document.getElementById('map').style.display = 'none';
            this.elements.flagGameContainer.classList.remove('hidden');
            this.displayFlagQuestion();
        } else {
            if (countryPrompt) countryPrompt.style.visibility = 'visible';
            this.elements.countryName.textContent = country.name;
            document.getElementById('map').style.display = 'block';
            this.elements.flagGameContainer.classList.add('hidden');
            this.mapManager.setContinentView(state.continent);
        }

        if (diffConfig.timer) {
            this.startTimer(diffConfig.timer);
        }
    }

    /**
     * Démarre le timer
     * @param {number} duration - Durée en secondes
     */
    startTimer(duration) {
        // Si durée nulle ou 0, cacher le timer
        if (!duration || duration === 0) {
            this.elements.timerContainer.classList.add('hidden');
            return;
        }
        
        // Afficher le timer
        this.elements.timerContainer.classList.remove('hidden');
        
        this.stateManager.updateTimer(duration);
        this.elements.timer.textContent = duration;
        UIComponents.updateTimerProgress(duration, duration, this.elements.timerProgress);

        const state = this.stateManager.getState();
        if (state.timer) {
            clearInterval(state.timer);
        }

        const timer = setInterval(() => {
            const timeLeft = this.stateManager.get('timeLeft') - 1;
            this.stateManager.updateTimer(timeLeft);
            this.elements.timer.textContent = timeLeft;
            UIComponents.updateTimerProgress(timeLeft, duration, this.elements.timerProgress);

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.stateManager.set('timer', null);
                this.handleTimeout();
            }
        }, 1000);

        this.stateManager.set('timer', timer);
    }

    /**
     * Gère le timeout du timer
     */
    handleTimeout() {
        const state = this.stateManager.getState();
        
        if (state.mode === 'multi') return;
        
        if (state.gameMode === 'flags') {
            this.handleFlagTimeout();
        } else if (state.gameMode === 'location') {
            this.handleLocationTimeout();
        }
    }

    /**
     * Gère le timeout en mode localisation
     */
    handleLocationTimeout() {
        const country = this.stateManager.get('currentCountry');
        const correctFeature = this.mapManager.findCountryFeature(country.name);
        
        if (correctFeature) {
            this.mapManager.showLocationResult(correctFeature, null, false);
        }
        
        this.stateManager.updateStats(0);
        this.updateScoreDisplay();
        this.displayLocationResultOverlay(false, null);
    }

    /**
     * Gère le timeout en mode drapeaux
     */
    handleFlagTimeout() {
        const userAnswer = this.elements.flagAnswerInput?.value.trim() || '';
        const correctAnswer = this.stateManager.get('currentCountry').name;
        const isCorrect = userAnswer && UIComponents.normalizeText(userAnswer) === UIComponents.normalizeText(correctAnswer);
        
        if (this.elements.flagAnswerInput) {
            this.elements.flagAnswerInput.disabled = true;
            this.elements.flagAnswerInput.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
        if (this.elements.flagSubmitBtn) {
            this.elements.flagSubmitBtn.disabled = true;
        }
        
        const points = isCorrect ? this.calculateFlagPoints(true, 0, this.config.difficulties[this.stateManager.get('difficulty')].timer) : 0;
        const score = this.stateManager.get('score') + points;
        this.stateManager.updateState({ score });
        this.elements.score.textContent = score.toLocaleString();
        this.stateManager.updateStats(points);
        
        if (this.elements.flagFeedback) {
            this.elements.flagFeedback.classList.remove('hidden', 'correct', 'incorrect');
            this.elements.flagFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
            this.elements.flagFeedback.textContent = isCorrect 
                ? `✅ Correct ! +${points} points (temps écoulé)` 
                : `⏰ C'était ${correctAnswer}`;
        }
        
        setTimeout(() => {
            if (this.elements.flagFeedback) {
                this.elements.flagFeedback.classList.add('hidden');
            }
            this.elements.flagImage.style.visibility = 'hidden';
            
            if (this.stateManager.get('currentRound') >= this.config.totalRounds) {
                this.endGame();
            } else {
                this.nextRound();
            }
        }, 1200);
    }

    // ==================== MAP INTERACTION ====================

    /**
     * Gère le clic sur un pays (mode localisation)
     * @param {string} clickedCountryEnglish - Nom anglais du pays cliqué
     * @param {L.LatLng} latlng - Coordonnées du clic
     * @param {Object} feature - Feature GeoJSON du pays
     */
    handleCountryClick(clickedCountryEnglish, latlng, feature) {
        const state = this.stateManager.getState();
        
        if (state.gameMode !== 'location') return;
        
        // Ignorer si le résultat est affiché (mode solo)
        if (state.mode === 'solo' && !this.elements.nextBtn.classList.contains('hidden')) {
            return;
        }
        
        // Surligner le pays cliqué
        this.mapManager.highlightClickedCountry(feature);
        
        // Mode multi
        if (state.mode === 'multi') {
            const correctCountryEnglish = COUNTRY_NAME_MAPPING[state.currentCountry.name];
            const isCorrect = clickedCountryEnglish === correctCountryEnglish;
            const distance = isCorrect ? 0 : 1;
            
            this.stateManager.registerMultiAnswer({
                lat: latlng.lat,
                lng: latlng.lng,
                clickedCountry: clickedCountryEnglish,
                isCorrect: isCorrect,
                distance: distance
            });
            
            this.stateManager.updateState({ currentRoundCorrect: isCorrect });
            
            this.socketClient.emit('registerAnswer', {
                roomCode: state.roomCode,
                clickLat: latlng.lat,
                clickLng: latlng.lng,
                distance: distance,
                clickedCountry: clickedCountryEnglish,
                isCorrect: isCorrect
            });
            
            this.showMultiRegisteredOverlay();
            return;
        }
        
        // Mode solo
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        this.showLocationResult(clickedCountryEnglish);
    }

    /**
     * Gère le clic sur la carte (fallback non-localisation)
     * @param {L.LatLng} latlng - Coordonnées du clic
     */
    handleMapClick(latlng) {
        const state = this.stateManager.getState();
        
        // En mode localisation avec GeoJSON chargé, ignorer les clics hors pays
        if (state.gameMode === 'location' && this.mapManager.geoJSONLoaded) {
            return;
        }
        
        // Ignorer si le résultat est affiché
        if (!this.elements.nextBtn.classList.contains('hidden')) {
            return;
        }
        
        if (state.mode === 'multi') {
            const distance = this.mapManager.calculateDistanceToCountry(latlng, state.currentCountry);
            
            this.stateManager.registerMultiAnswer({
                lat: latlng.lat,
                lng: latlng.lng,
                distance: distance
            });
            
            this.mapManager.addPendingMarker(latlng);
            
            this.socketClient.emit('registerAnswer', {
                roomCode: state.roomCode,
                clickLat: latlng.lat,
                clickLng: latlng.lng,
                distance: distance
            });
            
            this.showMultiRegisteredOverlay();
            return;
        }
        
        // Mode solo - fallback
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        this.showResult(latlng);
    }

    /**
     * Affiche le résultat en mode localisation (solo)
     * @param {string} clickedCountryEnglish - Nom anglais du pays cliqué
     */
    showLocationResult(clickedCountryEnglish) {
        const country = this.stateManager.get('currentCountry');
        const correctCountryEnglish = COUNTRY_NAME_MAPPING[country.name];
        const isCorrect = clickedCountryEnglish === correctCountryEnglish;
        
        const correctFeature = this.mapManager.findCountryFeature(country.name);
        const clickedFeature = clickedCountryEnglish ? 
            this.mapManager.countriesGeoJSON.features.find(f => f.properties.name === clickedCountryEnglish) : null;
        
        this.mapManager.showLocationResult(correctFeature, clickedFeature, isCorrect);
        
        const points = isCorrect ? 1 : 0;
        const score = this.stateManager.get('score') + points;
        this.stateManager.updateState({ score });
        this.stateManager.updateStats(points);
        
        this.updateScoreDisplay();
        this.displayLocationResultOverlay(isCorrect, clickedCountryEnglish);
    }

    /**
     * Affiche le résultat (mode classique avec marqueurs)
     * @param {L.LatLng} clickLatLng - Coordonnées du clic
     */
    showResult(clickLatLng) {
        const country = this.stateManager.get('currentCountry');
        const targetLatLng = L.latLng(country.lat, country.lng);

        let distance = 0;
        let points = 0;

        if (clickLatLng) {
            distance = this.mapManager.calculateDistanceToCountry(clickLatLng, country);
            points = this.calculatePoints(distance);

            this.mapManager.addMarker(clickLatLng, 'click', 'click-marker');
            this.mapManager.addLine(clickLatLng, targetLatLng);
        }

        this.mapManager.addMarker(targetLatLng, 'target', 'target-marker');

        if (clickLatLng) {
            this.mapManager.fitBounds(clickLatLng, targetLatLng);
        } else {
            this.mapManager.centerOn(targetLatLng, 3);
        }

        const score = this.stateManager.get('score') + points;
        this.stateManager.updateState({ score });
        this.elements.score.textContent = score.toLocaleString();
        this.stateManager.updateStats(points);

        this.displayResultOverlay(distance, points, clickLatLng !== null);
    }

    /**
     * Calcule les points basés sur la distance
     * @param {number} distance - Distance en km
     * @returns {number} Points gagnés
     */
    calculatePoints(distance) {
        if (distance === 0) return 1000;
        if (distance <= 50) return 950;
        if (distance <= 100) return 900;
        if (distance <= 200) return 850;
        if (distance <= 300) return 800;
        if (distance <= 500) return 700;
        if (distance <= 750) return 600;
        if (distance <= 1000) return 500;
        if (distance <= 1500) return 400;
        if (distance <= 2000) return 300;
        if (distance <= 2500) return 200;
        if (distance <= 3000) return 100;
        if (distance <= 4000) return 50;
        if (distance <= 5000) return 25;
        return 0;
    }

    /**
     * Affiche l'overlay de résultat (mode localisation)
     * @param {boolean} isCorrect - Si la réponse est correcte
     * @param {string} clickedCountryEnglish - Pays cliqué
     */
    displayLocationResultOverlay(isCorrect, clickedCountryEnglish) {
        this.elements.nextBtn.disabled = true;
        
        const currentRound = this.stateManager.get('currentRound');
        if (currentRound >= this.config.totalRounds) {
            this.elements.nextBtn.innerHTML = `
                <span>Voir les résultats</span>
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
            `;
        } else {
            this.elements.nextBtn.innerHTML = `
                <span>Suivant</span>
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
            `;
        }
        
        this.elements.nextBtn.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.nextBtn.disabled = false;
        }, 500);
    }

    /**
     * Affiche l'overlay de résultat (mode classique)
     * @param {number} distance - Distance en km
     * @param {number} points - Points gagnés
     * @param {boolean} clicked - Si le joueur a cliqué
     */
    displayResultOverlay(distance, points, clicked) {
        this.displayLocationResultOverlay(points > 0, null);
    }

    /**
     * Met à jour l'affichage du score
     */
    updateScoreDisplay() {
        const state = this.stateManager.getState();
        const isLocation = state.gameMode === 'location';
        const currentRound = state.currentRound;
        const score = state.score;
        
        UIComponents.updateScore(score, currentRound, this.elements.score, isLocation);
    }

    /**
     * Affiche l'overlay d'enregistrement multi
     */
    showMultiRegisteredOverlay() {
        if (this.elements.multiRegisteredOverlay) {
            this.elements.multiRegisteredOverlay.classList.remove('hidden');
            
            if (this.elements.registeredStatus) {
                this.elements.registeredStatus.textContent = 
                    'Réponse enregistrée ! Vous pouvez cliquer ailleurs pour modifier.';
            }
        }
    }

    // ==================== FLAG MODE ====================

    /**
     * Affiche une question en mode drapeaux
     */
    displayFlagQuestion() {
        const country = this.stateManager.get('currentCountry');
        const flagUrl = `https://flagcdn.com/w640/${country.code}.png`;
        
        const img = new Image();
        img.onload = () => {
            this.elements.flagImage.src = flagUrl;
            this.elements.flagImage.style.visibility = 'visible';
        };
        img.src = flagUrl;
        
        this.elements.flagImage.alt = `Drapeau`;
        
        if (this.elements.flagAnswerInput) {
            this.elements.flagAnswerInput.value = '';
            this.elements.flagAnswerInput.disabled = false;
            this.elements.flagAnswerInput.classList.remove('correct', 'incorrect');
            this.elements.flagAnswerInput.focus();
        }
        if (this.elements.flagSubmitBtn) {
            this.elements.flagSubmitBtn.disabled = false;
        }
        if (this.elements.flagFeedback) {
            this.elements.flagFeedback.classList.add('hidden');
            this.elements.flagFeedback.classList.remove('correct', 'incorrect');
        }
    }

    /**
     * Soumet une réponse en mode drapeaux
     */
    submitFlagAnswer() {
        if (!this.elements.flagAnswerInput || this.elements.flagAnswerInput.disabled) return;
        
        const userAnswer = this.elements.flagAnswerInput.value.trim();
        if (!userAnswer) return;
        
        const state = this.stateManager.getState();
        const correctAnswer = state.currentCountry.name;
        const isCorrect = UIComponents.normalizeText(userAnswer) === UIComponents.normalizeText(correctAnswer);
        
        // Mode multi
        if (state.mode === 'multi') {
            if (state.hasRegistered) return;
            
            this.elements.flagAnswerInput.disabled = true;
            this.elements.flagSubmitBtn.disabled = true;
            this.elements.flagAnswerInput.classList.add(isCorrect ? 'correct' : 'incorrect');
            
            this.socketClient.emit('registerAnswer', {
                roomCode: state.roomCode,
                selectedOption: userAnswer,
                isCorrect: isCorrect
            });
            
            this.stateManager.updateState({ hasRegistered: true });
            
            if (this.elements.multiRegisteredOverlay) {
                this.elements.multiRegisteredOverlay.classList.remove('hidden');
                this.elements.registeredStatus.textContent = '✅ Réponse enregistrée !';
            }
            
            return;
        }
        
        // Mode solo
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        this.elements.flagAnswerInput.disabled = true;
        this.elements.flagSubmitBtn.disabled = true;
        
        const timeLeft = state.timeLeft;
        const totalTime = this.config.difficulties[state.difficulty].timer;
        const points = this.calculateFlagPoints(isCorrect, timeLeft, totalTime);
        
        const score = state.score + points;
        this.stateManager.updateState({ score });
        this.elements.score.textContent = score.toLocaleString();
        this.stateManager.updateStats(points);
        
        this.elements.flagAnswerInput.classList.add(isCorrect ? 'correct' : 'incorrect');
        
        if (this.elements.flagFeedback) {
            this.elements.flagFeedback.classList.remove('hidden', 'correct', 'incorrect');
            this.elements.flagFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
            this.elements.flagFeedback.textContent = isCorrect 
                ? `✅ Correct ! +${points} points` 
                : `❌ C'était ${correctAnswer}`;
        }
        
        setTimeout(() => {
            if (this.elements.flagFeedback) {
                this.elements.flagFeedback.classList.add('hidden');
            }
            this.elements.flagImage.style.visibility = 'hidden';
            
            if (state.currentRound >= this.config.totalRounds) {
                this.endGame();
            } else {
                this.nextRound();
            }
        }, 1200);
    }

    /**
     * Calcule les points pour le mode drapeaux
     * @param {boolean} isCorrect - Si la réponse est correcte
     * @param {number} timeLeft - Temps restant
     * @param {number} totalTime - Temps total
     * @returns {number} Points gagnés
     */
    calculateFlagPoints(isCorrect, timeLeft, totalTime) {
        if (!isCorrect) return 0;
        
        const basePoints = 800;
        const speedBonus = totalTime && timeLeft > 0 ? Math.floor((timeLeft / totalTime) * 200) : 200;
        
        return basePoints + speedBonus;
    }

    // ==================== END GAME ====================

    /**
     * Termine la partie (solo)
     */
    endGame() {
        const state = this.stateManager.getState();
        const stats = state.stats;
        
        if (state.gameMode === 'location') {
            const percentage = this.config.totalRounds > 0 
                ? Math.round((state.score / this.config.totalRounds) * 100) 
                : 0;
            this.elements.finalScore.textContent = `${percentage}%`;
            
            const statsGrid = document.querySelector('.stats-grid');
            if (statsGrid) {
                statsGrid.innerHTML = `
                    <div class="stat-card">
                        <span class="stat-value" style="color: #22c55e;">${stats.perfect}</span>
                        <span class="stat-label">Corrects</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" style="color: #ef4444;">${stats.missed}</span>
                        <span class="stat-label">Incorrects</span>
                    </div>
                `;
            }
        } else {
            this.elements.finalScore.textContent = state.score.toLocaleString();
            
            this.elements.statPerfect.textContent = stats.perfect;
            this.elements.statGood.textContent = stats.good;
            this.elements.statAverage.textContent = stats.average;
            this.elements.statMissed.textContent = stats.missed;
        }

        this.screenManager.showEndScreen('solo');
        UIComponents.launchConfetti(this.elements.confetti);
    }

    /**
     * Rejoue une partie
     */
    replay() {
        if (this.stateManager.get('mode') === 'solo') {
            this.startSoloGame();
        }
    }

    /**
     * Retourne au menu
     */
    goToMenu() {
        const state = this.stateManager.getState();
        
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        this.mapManager.clearMarkers();
        this.elements.nextBtn.classList.add('hidden');
        if (this.elements.multiRegisteredOverlay) {
            this.elements.multiRegisteredOverlay.classList.add('hidden');
        }

        if (state.mode === 'multi') {
            this.socketClient.emit('leaveRoom');
            this.stateManager.updateState({
                roomCode: null,
                isHost: false,
                players: []
            });
        }

        this.screenManager.showScreen('mode');
    }

    /**
     * Retourne au menu principal depuis le lobby
     */
    returnToModeFromLobby() {
        // Réinitialiser l'état du lobby via ScreenManager
        this.screenManager.resetLobbyState();
        
        // Vider le champ de pseudo
        if (this.elements.usernameInput) {
            this.elements.usernameInput.value = '';
        }
        
        // Masquer les messages d'erreur
        if (this.elements.lobbyError) {
            this.elements.lobbyError.classList.add('hidden');
        }
        
        // Nettoyer les paramètres URL
        const url = new URL(window.location);
        url.search = '';
        window.history.replaceState({}, '', url);
        
        this.screenManager.showScreen('mode');
    }

    /**
     * Gère le retour depuis l'écran de jeu
     */
    handleBackFromGame() {
        this.goToMenu();
    }

    // ==================== MULTIPLAYER ====================

    /**
     * Crée un salon
     */
    createRoom() {
        const username = this.elements.usernameInput.value.trim();
        if (!username) {
            UIComponents.showLobbyError('Veuillez entrer un pseudo.', this.elements.lobbyError);
            return;
        }
        if (username.length < 2) {
            UIComponents.showLobbyError('Le pseudo doit faire au moins 2 caractères.', this.elements.lobbyError);
            return;
        }

        UIComponents.hideLobbyError(this.elements.lobbyError);
        this.stateManager.updateState({ username });
        this.socketClient.createRoom(username, 'medium', 'location');
    }

    /**
     * Rejoint un salon
     */
    joinRoom() {
        const username = this.elements.usernameInput.value.trim();
        const roomCode = this.elements.roomCodeInput.value.trim().toUpperCase();

        if (!username) {
            UIComponents.showLobbyError('Veuillez entrer un pseudo.', this.elements.lobbyError);
            return;
        }
        if (username.length < 2) {
            UIComponents.showLobbyError('Le pseudo doit faire au moins 2 caractères.', this.elements.lobbyError);
            return;
        }
        if (!roomCode || roomCode.length !== 6) {
            UIComponents.showLobbyError('Le code du salon doit faire 6 caractères.', this.elements.lobbyError);
            return;
        }

        UIComponents.hideLobbyError(this.elements.lobbyError);
        this.stateManager.updateState({ username });
        this.socketClient.joinRoom(roomCode, username);
    }

    /**
     * Quitte le salon
     */
    leaveRoom() {
        this.socketClient.leaveRoom();
        this.stateManager.updateState({
            roomCode: null,
            isHost: false,
            players: []
        });
        this.screenManager.showScreen('lobby');
    }

    /**
     * Copie le code du salon
     */
    copyRoomCode() {
        const roomCode = this.stateManager.get('roomCode');
        if (!roomCode) {
            console.error('Aucun code de salon disponible');
            return;
        }
        UIComponents.copyToClipboard(roomCode, this.elements.copyCodeBtn);
    }

    /**
     * Copie le lien du salon
     */
    copyRoomLink() {
        const roomCode = this.stateManager.get('roomCode');
        if (!roomCode) {
            console.error('Aucun code de salon disponible');
            return;
        }
        const roomLink = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        UIComponents.copyToClipboard(roomLink, this.elements.copyLinkBtn);
    }

    /**
     * Met à jour les paramètres du salon
     */
    updateRoomSettings() {
        if (!this.stateManager.get('isHost')) return;

        const gameMode = this.elements.settingGameMode.value;
        const difficulty = this.elements.settingDifficulty.value;
        const totalRounds = parseInt(this.elements.settingQuestions.value);
        const timerValue = parseInt(this.elements.settingTime.value);
        const timer = timerValue === 0 ? null : timerValue;
        const continent = this.elements.settingContinent.value;

        this.config.totalRounds = totalRounds;
        this.stateManager.updateState({ difficulty, gameMode });

        this.socketClient.updateSettings(this.stateManager.get('roomCode'), {
            gameMode,
            difficulty,
            totalRounds,
            timer,
            continent
        });
    }

    /**
     * Démarre une partie multijoueur
     */
    startMultiGame() {
        if (!this.stateManager.get('isHost')) return;

        this.prepareCountries();
        
        this.socketClient.startGame(
            this.stateManager.get('roomCode'),
            this.stateManager.get('countries')
        );
    }

    /**
     * Retourne au lobby après la partie (individuel)
     */
    returnToLobby() {
        this.socketClient.emit('playerReadyForLobby', { roomCode: this.stateManager.get('roomCode') });
    }

    /**
     * Affiche le résultat du joueur suivant
     */
    showNextPlayerResult() {
        if (!this.stateManager.get('isHost')) return;
        this.socketClient.showNextPlayerResult(this.stateManager.get('roomCode'));
    }

    /**
     * Passe à la question suivante
     */
    skipToNextQuestion() {
        if (!this.stateManager.get('isHost')) return;
        this.socketClient.skipToNextQuestion(this.stateManager.get('roomCode'));
    }

    // ==================== SOCKET EVENT HANDLERS ====================

    onRoomCreated(data) {
        this.stateManager.updateState({
            roomCode: data.roomCode,
            isHost: true,
            players: data.players,
            difficulty: data.difficulty,
            gameMode: data.gameMode || 'location'
        });
        
        if (data.settings) {
            this.config.totalRounds = data.settings.totalRounds;
        }

        this.updateWaitingRoom();
        this.applySettingsToUI(data.difficulty, data.gameMode, data.settings);
        this.screenManager.showWaitingRoom();
    }

    onRoomJoined(data) {
        this.stateManager.updateState({
            roomCode: data.roomCode,
            isHost: data.isHost,
            players: data.players,
            difficulty: data.difficulty,
            gameMode: data.gameMode || 'location'
        });

        this.updateWaitingRoom();
        this.applySettingsToUI(data.difficulty, data.gameMode, data.settings);
        this.screenManager.showWaitingRoom();
    }

    onPlayerJoined(data) {
        this.stateManager.updatePlayers(data.players);
        this.updateWaitingRoom();
    }

    onPlayerLeft(data) {
        this.stateManager.updatePlayers(data.players);
        if (data.newHostId === this.socketClient.getId()) {
            this.stateManager.setHost(true);
        }
        this.updateWaitingRoom();
    }

    onSettingsUpdated(data) {
        this.stateManager.updateState({
            difficulty: data.difficulty,
            gameMode: data.gameMode || 'location'
        });
        this.applySettingsToUI(data.difficulty, data.gameMode, data.settings);
    }

    updateWaitingRoom() {
        const state = this.stateManager.getState();
        
        this.elements.displayRoomCode.textContent = state.roomCode;
        this.elements.roomDifficultyDisplay.textContent = this.config.difficulties[state.difficulty].name;
        this.elements.playersCount.textContent = `(${state.players.length}/8)`;

        this.elements.playersList.innerHTML = '';
        state.players.forEach(player => {
            const item = UIComponents.createPlayerCard(player);
            this.elements.playersList.appendChild(item);
        });

        if (state.isHost) {
            this.elements.startMultiGameBtn.disabled = state.players.length < 1;
            this.elements.startMultiGameBtn.style.display = 'inline-flex';
            this.elements.waitingMessage.textContent = state.players.length < 2 
                ? 'En attente d\'autres joueurs...' 
                : 'Prêt à lancer !';
            
            this.elements.settingGameMode.disabled = false;
            this.elements.settingQuestions.disabled = false;
            this.elements.settingTime.disabled = false;
            this.elements.settingDifficulty.disabled = false;
            if (this.elements.settingContinent) {
                this.elements.settingContinent.disabled = false;
            }
        } else {
            this.elements.startMultiGameBtn.style.display = 'none';
            this.elements.waitingMessage.textContent = 'En attente du lancement par l\'hôte...';
            
            this.elements.settingGameMode.disabled = true;
            this.elements.settingQuestions.disabled = true;
            this.elements.settingTime.disabled = true;
            this.elements.settingDifficulty.disabled = true;
            if (this.elements.settingContinent) {
                this.elements.settingContinent.disabled = true;
            }
        }
    }

    applySettingsToUI(difficulty, gameMode, settings) {
        if (!settings) return;

        this.elements.roomDifficultyDisplay.textContent = this.config.difficulties[difficulty].name;
        if (this.elements.settingGameMode) {
            this.elements.settingGameMode.value = gameMode || 'location';
        }
        this.elements.settingDifficulty.value = difficulty;
        this.elements.settingQuestions.value = settings.totalRounds;
        this.elements.settingTime.value = settings.timer === null ? 0 : settings.timer;
        if (this.elements.settingContinent) {
            this.elements.settingContinent.value = settings.continent || 'all';
        }
        
        this.config.totalRounds = settings.totalRounds;
    }

    onGameStarted(data) {
        this.stateManager.reset('multi');
        this.stateManager.updateState({
            gameMode: data.gameMode || 'location',
            continent: data.settings?.continent || 'all',
            difficulty: data.difficulty,
            multiCorrectAnswers: 0
        });

        this.config.totalRounds = data.totalRounds;

        const diffConfig = this.config.difficulties[data.difficulty];
        this.elements.currentDifficulty.textContent = diffConfig.name;
        
        const scoreDisplay = document.querySelector('.score-display');
        if (scoreDisplay) {
            scoreDisplay.style.display = 'none';
        }

        const timerDuration = data.timer;
        if (timerDuration) {
            this.elements.timerContainer.classList.remove('hidden');
            this.elements.timer.textContent = timerDuration;
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        this.elements.countryName.textContent = 'Préparez-vous...';
        this.elements.currentRound.textContent = '0';
        
        const roundInfo = document.querySelector('.round-info');
        if (roundInfo) {
            roundInfo.innerHTML = `Question <span id="current-round">0</span>/${data.totalRounds}`;
            this.elements.currentRound = document.getElementById('current-round');
        }

        const countryPrompt = document.querySelector('.country-prompt');
        if (countryPrompt) {
            countryPrompt.style.visibility = 'hidden';
        }

        if (data.gameMode === 'flags') {
            document.getElementById('map').style.display = 'none';
            this.elements.flagGameContainer.classList.remove('hidden');
            this.elements.flagImage.style.visibility = 'hidden';
        } else {
            document.getElementById('map').style.display = 'block';
            this.elements.flagGameContainer.classList.add('hidden');
        }

        this.screenManager.showGameScreen();

        setTimeout(() => {
            if (this.mapManager.map && data.gameMode !== 'flags') {
                this.mapManager.invalidateSize();
                const continent = data.settings?.continent || 'all';
                this.mapManager.setContinentView(continent);
            }
        }, 100);
    }

    onNewRound(data) {
        if (!data || !data.country) {
            console.error('Données de round invalides:', data);
            return;
        }
        
        const state = this.stateManager.getState();
        
        // Utiliser roundNumber (envoyé par le serveur) ou round pour compatibilité
        const roundNumber = data.roundNumber || data.round;
        const totalRounds = data.totalRounds || this.config.totalRounds;
        const timer = data.timer || data.timerDuration;
        
        if (state.currentRound > 0 && state.gameMode === 'location') {
            if (state.currentRoundCorrect) {
                this.stateManager.updateState({ 
                    multiCorrectAnswers: state.multiCorrectAnswers + 1 
                });
            }
            
            const percentage = Math.round((state.multiCorrectAnswers / state.currentRound) * 100);
            this.elements.score.textContent = `${percentage}%`;
        }
        
        this.stateManager.updateState({
            currentRound: roundNumber,
            currentCountry: data.country,
            gameMode: data.gameMode || 'location',
            currentOptions: data.choices || data.options || null,
            pendingClick: null,
            hasRegistered: false,
            currentRoundCorrect: false
        });

        this.elements.nextBtn.classList.add('hidden');
        if (this.elements.multiRegisteredOverlay) {
            this.elements.multiRegisteredOverlay.classList.add('hidden');
        }

        this.mapManager.clearMarkers();

        this.elements.currentRound.textContent = roundNumber;
        
        const roundInfo = document.querySelector('.round-info');
        if (roundInfo) {
            roundInfo.innerHTML = `Question <span id="current-round">${roundNumber}</span>/${totalRounds}`;
            this.elements.currentRound = document.getElementById('current-round');
        }

        if (this.elements.registeredCount) {
            this.elements.registeredCount.textContent = '0';
        }
        if (this.elements.totalPlayersGame) {
            this.elements.totalPlayersGame.textContent = state.players.length;
        }

        const countryPrompt = document.querySelector('.country-prompt');
        
        if (data.gameMode === 'flags') {
            if (countryPrompt) countryPrompt.style.visibility = 'hidden';
            document.getElementById('map').style.display = 'none';
            this.elements.flagGameContainer.classList.remove('hidden');
            this.elements.flagImage.style.visibility = 'hidden';
            this.displayFlagQuestion();
        } else {
            if (countryPrompt) countryPrompt.style.visibility = 'visible';
            // En mode localisation, le nom est toujours envoyé
            if (data.country.name) {
                this.elements.countryName.textContent = data.country.name;
            }
            document.getElementById('map').style.display = 'block';
            this.elements.flagGameContainer.classList.add('hidden');
            // Centrer sur le continent sélectionné en multijoueur
            const continent = state.continent || 'all';
            this.mapManager.setContinentView(continent);
        }

        if (timer) {
            this.startTimer(timer);
        }
    }

    onPlayerRegistered(data) {
        if (this.elements.registeredCount) {
            this.elements.registeredCount.textContent = data.registeredCount;
        }
        if (this.elements.totalPlayersGame) {
            this.elements.totalPlayersGame.textContent = data.totalPlayers;
        }
    }

    onAllPlayersAnswered(data) {
        const state = this.stateManager.getState();
        
        console.log('[GameEngine] Tous les joueurs ont répondu, réduction du timer à', data.newTimeLeft);
        
        // Arrêter le timer actuel
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        // Mettre à jour l'affichage du timer à 2 secondes
        this.stateManager.updateTimer(data.newTimeLeft);
        this.elements.timer.textContent = data.newTimeLeft;
        UIComponents.updateTimerProgress(data.newTimeLeft, data.newTimeLeft, this.elements.timerProgress);
        
        // Démarrer un nouveau timer de 2 secondes
        const timer = setInterval(() => {
            const timeLeft = this.stateManager.get('timeLeft') - 1;
            this.stateManager.updateTimer(timeLeft);
            this.elements.timer.textContent = timeLeft;
            UIComponents.updateTimerProgress(timeLeft, data.newTimeLeft, this.elements.timerProgress);

            if (timeLeft <= 0) {
                clearInterval(timer);
                this.stateManager.set('timer', null);
            }
        }, 1000);

        this.stateManager.set('timer', timer);
    }

    onRoundTimeUp(data) {
        const state = this.stateManager.getState();
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
    }

    onRoundComplete(data) {
        console.log('[GameEngine] Round complete:', data);
        
        const state = this.stateManager.getState();
        
        // Arrêter le timer s'il tourne encore
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        // Mettre à jour le leaderboard si disponible
        if (data.leaderboard) {
            this.stateManager.updateState({ leaderboard: data.leaderboard });
        }
    }

    onGameComplete(data) {
        console.log('[GameEngine] Game complete:', data);
        
        const state = this.stateManager.getState();
        
        // Arrêter le timer s'il tourne encore
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        // Stocker les résultats des rounds pour l'affichage
        this.stateManager.set('roundsResults', data.roundsResults || []);
        
        // Utiliser la même logique que onGameEnded
        if (data.finalLeaderboard) {
            this.stateManager.updatePlayers(data.finalLeaderboard);
            this.showMultiEndScreen(data.finalLeaderboard, data.roundsResults);
        }
    }

    onReviewPhaseStarted(data) {
        const state = this.stateManager.getState();
        if (state.timer) {
            clearInterval(state.timer);
            this.stateManager.set('timer', null);
        }
        
        this.elements.nextBtn.classList.add('hidden');
        if (this.elements.multiRegisteredOverlay) {
            this.elements.multiRegisteredOverlay.classList.add('hidden');
        }
        
        this.stateManager.setHost(data.hostId === this.socketClient.getId());
        
        this.screenManager.showReviewScreen();
        
        if (this.elements.reviewHostControls) {
            this.elements.reviewHostControls.style.display = state.isHost ? 'flex' : 'none';
        }
        if (this.elements.reviewWaitingMessage) {
            this.elements.reviewWaitingMessage.style.display = state.isHost ? 'none' : 'block';
        }
    }

    onShowPlayerResult(data) {
        if (this.elements.reviewRoundInfo) {
            this.elements.reviewRoundInfo.textContent = `Question ${data.round}/${data.totalRounds}`;
        }
        
        if (this.elements.reviewPlayerInfo) {
            const isCurrentUser = data.player.id === this.socketClient.getId();
            this.elements.reviewPlayerInfo.textContent = `${data.player.username}${isCurrentUser ? ' (vous)' : ''}`;
            
            const result = data.result;
            this.elements.reviewPlayerInfo.classList.remove('score-perfect', 'score-good', 'score-average', 'score-poor', 'score-miss');
            
            if (data.gameMode === 'flags') {
                if (result.selectedOption === null || result.selectedOption === undefined) {
                    this.elements.reviewPlayerInfo.classList.add('score-miss');
                } else if (result.isCorrect) {
                    this.elements.reviewPlayerInfo.classList.add('score-perfect');
                } else {
                    this.elements.reviewPlayerInfo.classList.add('score-miss');
                }
            } else {
                if (result.distance === null) {
                    this.elements.reviewPlayerInfo.classList.add('score-miss');
                } else if (result.points >= 900) {
                    this.elements.reviewPlayerInfo.classList.add('score-perfect');
                } else if (result.points >= 500) {
                    this.elements.reviewPlayerInfo.classList.add('score-good');
                } else if (result.points >= 200) {
                    this.elements.reviewPlayerInfo.classList.add('score-average');
                } else if (result.points > 0) {
                    this.elements.reviewPlayerInfo.classList.add('score-poor');
                } else {
                    this.elements.reviewPlayerInfo.classList.add('score-miss');
                }
            }
        }
        
        if (this.elements.reviewCountryName) {
            this.elements.reviewCountryName.textContent = data.country.name;
        }
        
        if (data.gameMode === 'flags') {
            this.updateReviewFlag(data.country, data.result, data.player);
        } else {
            this.mapManager.updateReviewMap(data.country, data.result, data.gameMode);
            
            if (this.elements.reviewMapContainer) {
                this.elements.reviewMapContainer.style.display = 'block';
            }
            if (this.elements.reviewFlagContainer) {
                this.elements.reviewFlagContainer.classList.add('hidden');
            }
        }
        
        if (this.elements.nextPlayerBtn) {
            if (data.isLastPlayerForRound && data.isLastRound) {
                this.elements.nextPlayerBtn.innerHTML = `
                    <span>Voir le classement final</span>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                    </svg>
                `;
            } else if (data.isLastPlayerForRound) {
                this.elements.nextPlayerBtn.innerHTML = `
                    <span>Question suivante</span>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                    </svg>
                `;
            } else {
                this.elements.nextPlayerBtn.innerHTML = `
                    <span>Joueur suivant</span>
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                    </svg>
                `;
            }
        }
        
        if (this.elements.skipQuestionBtn) {
            this.elements.skipQuestionBtn.style.display = data.isLastPlayerForRound ? 'none' : 'inline-flex';
        }
    }

    updateReviewFlag(country, result, player) {
        if (this.elements.reviewMapContainer) {
            this.elements.reviewMapContainer.style.display = 'none';
        }
        if (this.elements.reviewFlagContainer) {
            this.elements.reviewFlagContainer.classList.remove('hidden');
        }
        
        if (this.elements.reviewCorrectAnswer) {
            this.elements.reviewCorrectAnswer.textContent = country.name;
        }
        
        if (this.elements.reviewFlagImage && country.code) {
            const flagUrl = `https://flagcdn.com/w640/${country.code}.png`;
            this.elements.reviewFlagImage.src = flagUrl;
            this.elements.reviewFlagImage.alt = `Drapeau de ${country.name}`;
        }
        
        const isCurrentUser = player.id === this.socketClient.getId();
        const playerName = `${player.username}${isCurrentUser ? ' (vous)' : ''}`;
        
        if (this.elements.reviewPlayerPseudo) {
            this.elements.reviewPlayerPseudo.textContent = playerName;
        }
        
        if (this.elements.reviewGivenAnswer) {
            this.elements.reviewGivenAnswer.classList.remove('correct', 'incorrect', 'no-answer');
            
            if (result.selectedOption === null || result.selectedOption === undefined) {
                this.elements.reviewGivenAnswer.textContent = '⏰ Pas de réponse';
                this.elements.reviewGivenAnswer.classList.add('no-answer');
            } else if (result.isCorrect) {
                this.elements.reviewGivenAnswer.textContent = `✅ ${result.selectedOption}`;
                this.elements.reviewGivenAnswer.classList.add('correct');
            } else {
                this.elements.reviewGivenAnswer.textContent = `❌ ${result.selectedOption}`;
                this.elements.reviewGivenAnswer.classList.add('incorrect');
            }
        }
    }

    onGameEnded(data) {
        this.stateManager.updatePlayers(data.leaderboard);
        this.showMultiEndScreen(data.leaderboard, null);
    }

    showMultiEndScreen(leaderboard, roundsResults = null) {
        const state = this.stateManager.getState();
        const isLocationMode = state.gameMode === 'location';
        const totalQuestions = this.config.totalRounds;
        
        const places = [
            { el: this.elements.podium1, index: 0, medal: '🥇' },
            { el: this.elements.podium2, index: 1, medal: '🥈' },
            { el: this.elements.podium3, index: 2, medal: '🥉' }
        ];

        places.forEach(place => {
            const player = leaderboard[place.index];
            if (player) {
                place.el.querySelector('.podium-avatar').textContent = place.medal;
                place.el.querySelector('.podium-name').textContent = player.username;
                
                if (isLocationMode) {
                    const percentage = totalQuestions > 0 
                        ? Math.round((player.score / totalQuestions) * 100) 
                        : 0;
                    place.el.querySelector('.podium-score').textContent = `${percentage}%`;
                } else {
                    place.el.querySelector('.podium-score').textContent = player.score.toLocaleString();
                }
                
                place.el.style.display = 'flex';
            } else {
                place.el.style.display = 'none';
            }
        });

        this.elements.fullLeaderboard.innerHTML = '';
        if (leaderboard.length > 3) {
            leaderboard.slice(3).forEach((player, index) => {
                const item = document.createElement('div');
                item.className = 'full-leaderboard-item';
                
                const scoreDisplay = isLocationMode
                    ? `${Math.round((player.score / totalQuestions) * 100)}%`
                    : player.score.toLocaleString();
                
                item.innerHTML = `
                    <span class="full-leaderboard-rank">${index + 4}</span>
                    <span class="full-leaderboard-name">${player.username}</span>
                    <span class="full-leaderboard-score">${scoreDisplay}</span>
                `;
                this.elements.fullLeaderboard.appendChild(item);
            });
        }

        // Masquer le récapitulatif des questions (déjà vu en phase de révision)
        if (this.elements.roundsSummary) {
            this.elements.roundsSummary.style.display = 'none';
        }

        const myRank = leaderboard.findIndex(p => p.id === this.socketClient.getId()) + 1;
        if (myRank === 1) {
            this.elements.multiEndTitle.textContent = '🎉 Vous avez gagné !';
        } else if (myRank <= 3) {
            this.elements.multiEndTitle.textContent = `🎉 ${myRank}ème place !`;
        } else {
            this.elements.multiEndTitle.textContent = '🎉 Partie terminée !';
        }

        this.screenManager.showEndScreen('multi');
        UIComponents.launchConfetti(this.elements.multiConfetti);

        if (this.elements.multiReplayBtn) {
            this.elements.multiReplayBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Affiche le récapitulatif des questions
     * @param {Array} roundsResults - Résultats par question
     * @param {boolean} isLocationMode - Mode localisation ou drapeaux
     */
    displayRoundsSummary(roundsResults, isLocationMode) {
        if (!this.elements.roundsList || !roundsResults || roundsResults.length === 0) {
            if (this.elements.roundsSummary) {
                this.elements.roundsSummary.style.display = 'none';
            }
            return;
        }

        this.elements.roundsSummary.style.display = 'block';
        this.elements.roundsList.innerHTML = '';

        roundsResults.forEach(round => {
            const roundItem = document.createElement('div');
            roundItem.className = 'round-item';

            const playersHtml = round.answers.map(answer => {
                const isCorrect = answer.isCorrect;
                const pointsDisplay = isLocationMode 
                    ? (isCorrect ? '✓' : '✗')
                    : `${answer.points} pts`;
                
                return `
                    <div class="round-player ${isCorrect ? 'correct' : 'incorrect'}">
                        <span class="round-player-name">${answer.username}</span>
                        <span class="round-player-points">${pointsDisplay}</span>
                    </div>
                `;
            }).join('');

            roundItem.innerHTML = `
                <div class="round-header">
                    <span class="round-number">Q${round.round}</span>
                    <span class="round-country">${round.country.name}</span>
                </div>
                <div class="round-players">
                    ${playersHtml}
                </div>
            `;

            this.elements.roundsList.appendChild(roundItem);
        });
    }

    onReturnedToLobby(data) {
        this.stateManager.updateState({
            players: data.players,
            difficulty: data.difficulty,
            gameMode: data.gameMode || 'location',
            currentRound: 0,
            score: 0,
            pendingClick: null,
            hasRegistered: false,
            multiCorrectAnswers: 0
        });

        this.updateWaitingRoom();
        this.applySettingsToUI(data.difficulty, data.gameMode, data.settings);
        this.screenManager.showWaitingRoom();
    }

    /**
     * Gère le retour individuel du joueur à la salle d'attente
     */
    onYouReturnedToLobby(data) {
        // Réinitialiser l'état du joueur
        this.stateManager.updateState({
            players: data.players,
            difficulty: data.difficulty,
            gameMode: data.gameMode || 'location',
            currentRound: 0,
            score: 0,
            pendingClick: null,
            hasRegistered: false,
            multiCorrectAnswers: 0
        });

        // Afficher la salle d'attente
        this.updateWaitingRoom();
        this.applySettingsToUI(data.difficulty, data.gameMode, data.settings);
        this.screenManager.showWaitingRoom();
        
        // Afficher un message si d'autres joueurs sont encore sur le leaderboard
        if (data.playersOnLeaderboard && data.playersOnLeaderboard.length > 0) {
            const count = data.playersOnLeaderboard.length;
            const message = count === 1 
                ? `1 joueur regarde encore le classement` 
                : `${count} joueurs regardent encore le classement`;
            this.elements.waitingMessage.textContent = message;
        }
    }

    /**
     * Gère l'arrivée d'un autre joueur dans la salle d'attente
     */
    onPlayerArrivedInLobby(data) {
        // Mettre à jour l'affichage si on est déjà dans la salle d'attente
        const currentScreen = this.screenManager.getCurrentScreen();
        if (currentScreen === 'waiting-room') {
            if (data.playersOnLeaderboard && data.playersOnLeaderboard.length > 0) {
                const count = data.playersOnLeaderboard.length;
                const message = count === 1 
                    ? `1 joueur regarde encore le classement` 
                    : `${count} joueurs regardent encore le classement`;
                this.elements.waitingMessage.textContent = message;
            } else {
                // Tous les joueurs sont revenus
                const isHost = this.stateManager.get('isHost');
                this.elements.waitingMessage.textContent = isHost
                    ? 'Prêt à lancer !'
                    : 'En attente du lancement par l\'hôte...';
            }
        }
    }
}

export default GameEngine;
