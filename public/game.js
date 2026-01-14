/**
 * GeoQuiz - Jeu de Géographie Multijoueur
 * Logique principale du jeu
 */

class GeoQuiz {
    constructor() {
        // Configuration
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
                }
            }
        };

        // État du jeu
        this.state = {
            mode: null, // 'solo' ou 'multi'
            difficulty: null,
            currentRound: 0,
            score: 0,
            countries: [],
            currentCountry: null,
            timer: null,
            timeLeft: 0,
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
            hasAnswered: false
        };

        // Éléments DOM
        this.elements = {
            screens: {
                mode: document.getElementById('mode-screen'),
                welcome: document.getElementById('welcome-screen'),
                lobby: document.getElementById('lobby-screen'),
                waitingRoom: document.getElementById('waiting-room-screen'),
                game: document.getElementById('game-screen'),
                end: document.getElementById('end-screen'),
                multiEnd: document.getElementById('multi-end-screen')
            },
            // Mode selection
            soloModeBtn: document.getElementById('solo-mode-btn'),
            multiModeBtn: document.getElementById('multi-mode-btn'),
            // Solo
            difficultyCards: document.querySelectorAll('.difficulty-card'),
            startBtn: document.getElementById('start-btn'),
            backToModeBtn: document.getElementById('back-to-mode-btn'),
            // Lobby
            usernameInput: document.getElementById('username-input'),
            roomDifficulty: document.getElementById('room-difficulty'),
            createRoomBtn: document.getElementById('create-room-btn'),
            roomCodeInput: document.getElementById('room-code-input'),
            joinRoomBtn: document.getElementById('join-room-btn'),
            lobbyError: document.getElementById('lobby-error'),
            backToModeBtn2: document.getElementById('back-to-mode-btn-2'),
            // Waiting Room
            displayRoomCode: document.getElementById('display-room-code'),
            copyCodeBtn: document.getElementById('copy-code-btn'),
            roomDifficultyDisplay: document.getElementById('room-difficulty-display'),
            playersCount: document.getElementById('players-count'),
            playersList: document.getElementById('players-list'),
            leaveRoomBtn: document.getElementById('leave-room-btn'),
            startMultiGameBtn: document.getElementById('start-multi-game-btn'),
            waitingMessage: document.getElementById('waiting-message'),
            // Game
            backBtn: document.getElementById('back-btn'),
            currentDifficulty: document.getElementById('current-difficulty'),
            currentRound: document.getElementById('current-round'),
            countryName: document.getElementById('country-name'),
            score: document.getElementById('score'),
            timerContainer: document.getElementById('timer-container'),
            timer: document.getElementById('timer'),
            timerProgress: document.getElementById('timer-progress'),
            hintContainer: document.getElementById('hint-container'),
            hintText: document.getElementById('hint-text'),
            // Solo Result
            resultOverlay: document.getElementById('result-overlay'),
            resultEmoji: document.getElementById('result-emoji'),
            resultTitle: document.getElementById('result-title'),
            resultDistance: document.getElementById('result-distance'),
            resultPoints: document.getElementById('result-points'),
            nextBtn: document.getElementById('next-btn'),
            // Multi Result
            multiResultOverlay: document.getElementById('multi-result-overlay'),
            multiResultEmoji: document.getElementById('multi-result-emoji'),
            multiResultTitle: document.getElementById('multi-result-title'),
            multiResultDistance: document.getElementById('multi-result-distance'),
            multiResultPoints: document.getElementById('multi-result-points'),
            // Leaderboard
            multiplayerLeaderboard: document.getElementById('multiplayer-leaderboard'),
            leaderboardList: document.getElementById('leaderboard-list'),
            answeredCount: document.getElementById('answered-count'),
            totalPlayers: document.getElementById('total-players'),
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
            multiConfetti: document.getElementById('multi-confetti'),
            multiMenuBtn: document.getElementById('multi-menu-btn')
        };

        // Carte Leaflet
        this.map = null;
        this.markers = {
            click: null,
            target: null,
            line: null
        };

        this.init();
    }

    init() {
        this.initSocket();
        this.bindEvents();
        this.initMap();
    }

    // ==================== SOCKET.IO ====================

    initSocket() {
        this.state.socket = io();

        // Room Events
        this.state.socket.on('roomCreated', (data) => this.onRoomCreated(data));
        this.state.socket.on('roomJoined', (data) => this.onRoomJoined(data));
        this.state.socket.on('joinError', (message) => this.showLobbyError(message));
        this.state.socket.on('playerJoined', (data) => this.onPlayerJoined(data));
        this.state.socket.on('playerLeft', (data) => this.onPlayerLeft(data));

        // Game Events
        this.state.socket.on('gameStarted', (data) => this.onGameStarted(data));
        this.state.socket.on('newRound', (data) => this.onNewRound(data));
        this.state.socket.on('playerAnswered', (data) => this.onPlayerAnswered(data));
        this.state.socket.on('roundEnded', (data) => this.onRoundEnded(data));
        this.state.socket.on('gameEnded', (data) => this.onGameEnded(data));
    }

    // ==================== EVENT BINDING ====================

    bindEvents() {
        // Mode selection
        this.elements.soloModeBtn.addEventListener('click', () => this.selectMode('solo'));
        this.elements.multiModeBtn.addEventListener('click', () => this.selectMode('multi'));

        // Solo difficulty selection
        this.elements.difficultyCards.forEach(card => {
            card.addEventListener('click', () => this.selectDifficulty(card));
        });

        // Navigation buttons
        this.elements.startBtn.addEventListener('click', () => this.startSoloGame());
        this.elements.backToModeBtn.addEventListener('click', () => this.showScreen('mode'));
        this.elements.backToModeBtn2.addEventListener('click', () => this.showScreen('mode'));
        this.elements.backBtn.addEventListener('click', () => this.handleBackFromGame());
        this.elements.nextBtn.addEventListener('click', () => this.nextRound());
        this.elements.replayBtn.addEventListener('click', () => this.replay());
        this.elements.menuBtn.addEventListener('click', () => this.goToMenu());
        this.elements.multiMenuBtn.addEventListener('click', () => this.goToMenu());

        // Lobby
        this.elements.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.elements.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.elements.roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Waiting Room
        this.elements.copyCodeBtn.addEventListener('click', () => this.copyRoomCode());
        this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.elements.startMultiGameBtn.addEventListener('click', () => this.startMultiGame());
    }

    // ==================== MODE & SCREEN MANAGEMENT ====================

    selectMode(mode) {
        this.state.mode = mode;
        if (mode === 'solo') {
            this.showScreen('welcome');
        } else {
            this.showScreen('lobby');
        }
    }

    showScreen(screenName) {
        Object.values(this.elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        if (this.elements.screens[screenName]) {
            this.elements.screens[screenName].classList.add('active');
        }
    }

    // ==================== SOLO MODE ====================

    selectDifficulty(card) {
        this.elements.difficultyCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.state.difficulty = card.dataset.difficulty;
        this.elements.startBtn.disabled = false;
    }

    startSoloGame() {
        this.state.mode = 'solo';
        this.state.currentRound = 0;
        this.state.score = 0;
        this.state.stats = { perfect: 0, good: 0, average: 0, missed: 0 };

        this.prepareCountries();

        const diffConfig = this.config.difficulties[this.state.difficulty];
        this.elements.currentDifficulty.textContent = diffConfig.name;
        this.elements.score.textContent = '0';

        if (diffConfig.timer) {
            this.elements.timerContainer.classList.remove('hidden');
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        // Cacher le leaderboard en solo
        this.elements.multiplayerLeaderboard.classList.add('hidden');

        this.showScreen('game');

        setTimeout(() => {
            this.map.invalidateSize();
            this.nextRound();
        }, 100);
    }

    prepareCountries() {
        const difficulty = this.state.difficulty;
        let pool = [];

        if (difficulty === 'easy') {
            pool = COUNTRIES.filter(c => c.difficulty === 'easy');
        } else if (difficulty === 'medium') {
            pool = [...COUNTRIES];
        } else {
            pool = COUNTRIES.filter(c => c.difficulty !== 'easy');
        }

        this.state.countries = this.shuffleArray(pool).slice(0, this.config.totalRounds);
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    // ==================== MULTIPLAYER MODE ====================

    createRoom() {
        const username = this.elements.usernameInput.value.trim();
        if (!username) {
            this.showLobbyError('Veuillez entrer un pseudo.');
            return;
        }
        if (username.length < 2) {
            this.showLobbyError('Le pseudo doit faire au moins 2 caractères.');
            return;
        }

        this.hideLobbyError();
        this.state.username = username;
        const difficulty = this.elements.roomDifficulty.value;

        this.state.socket.emit('createRoom', { username, difficulty });
    }

    joinRoom() {
        const username = this.elements.usernameInput.value.trim();
        const roomCode = this.elements.roomCodeInput.value.trim().toUpperCase();

        if (!username) {
            this.showLobbyError('Veuillez entrer un pseudo.');
            return;
        }
        if (username.length < 2) {
            this.showLobbyError('Le pseudo doit faire au moins 2 caractères.');
            return;
        }
        if (!roomCode || roomCode.length !== 6) {
            this.showLobbyError('Le code du salon doit faire 6 caractères.');
            return;
        }

        this.hideLobbyError();
        this.state.username = username;

        this.state.socket.emit('joinRoom', { roomCode, username });
    }

    onRoomCreated(data) {
        this.state.roomCode = data.roomCode;
        this.state.isHost = true;
        this.state.players = data.players;
        this.state.difficulty = data.difficulty;

        this.updateWaitingRoom();
        this.showScreen('waitingRoom');
    }

    onRoomJoined(data) {
        this.state.roomCode = data.roomCode;
        this.state.isHost = data.isHost;
        this.state.players = data.players;
        this.state.difficulty = data.difficulty;

        this.updateWaitingRoom();
        this.showScreen('waitingRoom');
    }

    onPlayerJoined(data) {
        this.state.players = data.players;
        this.updateWaitingRoom();
    }

    onPlayerLeft(data) {
        this.state.players = data.players;
        if (data.newHostId === this.state.socket.id) {
            this.state.isHost = true;
        }
        this.updateWaitingRoom();
    }

    updateWaitingRoom() {
        this.elements.displayRoomCode.textContent = this.state.roomCode;
        this.elements.roomDifficultyDisplay.textContent = this.config.difficulties[this.state.difficulty].name;
        this.elements.playersCount.textContent = `(${this.state.players.length}/8)`;

        // Liste des joueurs
        this.elements.playersList.innerHTML = '';
        this.state.players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'player-item';
            item.innerHTML = `
                <div class="player-avatar">${player.username.charAt(0).toUpperCase()}</div>
                <span class="player-name">${player.username}</span>
                ${player.isHost ? '<span class="player-badge">Hôte</span>' : ''}
            `;
            this.elements.playersList.appendChild(item);
        });

        // Bouton start (seulement pour l'hôte)
        if (this.state.isHost) {
            this.elements.startMultiGameBtn.disabled = this.state.players.length < 1;
            this.elements.startMultiGameBtn.style.display = 'inline-flex';
            this.elements.waitingMessage.textContent = this.state.players.length < 2 
                ? 'En attente d\'autres joueurs...' 
                : 'Prêt à lancer !';
        } else {
            this.elements.startMultiGameBtn.style.display = 'none';
            this.elements.waitingMessage.textContent = 'En attente du lancement par l\'hôte...';
        }
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.state.roomCode).then(() => {
            const btn = this.elements.copyCodeBtn;
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>';
            setTimeout(() => {
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>';
            }, 2000);
        });
    }

    leaveRoom() {
        this.state.socket.emit('leaveRoom');
        this.state.roomCode = null;
        this.state.isHost = false;
        this.state.players = [];
        this.showScreen('lobby');
    }

    startMultiGame() {
        if (!this.state.isHost) return;

        // Préparer les pays
        this.prepareCountries();

        // Envoyer au serveur
        this.state.socket.emit('startGame', {
            roomCode: this.state.roomCode,
            countries: this.state.countries
        });
    }

    onGameStarted(data) {
        this.state.mode = 'multi';
        this.state.currentRound = 0;
        this.state.score = 0;
        this.state.stats = { perfect: 0, good: 0, average: 0, missed: 0 };

        const diffConfig = this.config.difficulties[this.state.difficulty];
        this.elements.currentDifficulty.textContent = diffConfig.name;
        this.elements.score.textContent = '0';

        if (diffConfig.timer) {
            this.elements.timerContainer.classList.remove('hidden');
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        // Afficher le leaderboard
        this.elements.multiplayerLeaderboard.classList.remove('hidden');

        this.showScreen('game');

        setTimeout(() => {
            this.map.invalidateSize();
        }, 100);
    }

    onNewRound(data) {
        this.state.currentRound = data.round;
        this.state.currentCountry = data.country;
        this.state.hasAnswered = false;

        // Masquer les résultats
        this.elements.resultOverlay.classList.add('hidden');
        this.elements.multiResultOverlay.classList.add('hidden');

        // Nettoyer les marqueurs
        this.clearMarkers();

        // Mettre à jour l'UI
        this.elements.currentRound.textContent = data.round;
        this.elements.countryName.textContent = data.country.name;

        // Gérer l'indice
        const diffConfig = this.config.difficulties[this.state.difficulty];
        if (diffConfig.showHint && data.country.hint) {
            this.elements.hintContainer.classList.remove('hidden');
            this.elements.hintText.textContent = `Indice: ${data.country.hint}`;
        } else {
            this.elements.hintContainer.classList.add('hidden');
        }

        // Mettre à jour le leaderboard
        this.updateLeaderboard(data.leaderboard, 0, this.state.players.length);

        // Réinitialiser la vue de la carte
        this.map.setView([20, 0], 2);

        // Démarrer le timer si nécessaire
        if (data.timerDuration) {
            this.startTimer(data.timerDuration);
        }
    }

    onPlayerAnswered(data) {
        this.updateLeaderboard(data.leaderboard, data.answeredCount, data.totalPlayers);
    }

    onRoundEnded(data) {
        // Arrêter le timer
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }

        // Mettre à jour le leaderboard final du round
        this.updateLeaderboard(data.leaderboard, data.totalPlayers, data.totalPlayers);

        // Afficher la position correcte si pas déjà affichée
        const country = data.country;
        const targetLatLng = L.latLng(country.lat, country.lng);

        if (!this.markers.target) {
            this.markers.target = L.marker(targetLatLng, {
                icon: L.divIcon({
                    className: 'target-marker',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(this.map);
        }

        // Zoomer sur la cible
        this.map.setView(targetLatLng, 4);
    }

    onGameEnded(data) {
        this.state.players = data.leaderboard;
        this.showMultiEndScreen(data.leaderboard);
    }

    updateLeaderboard(leaderboard, answeredCount, totalPlayers) {
        this.state.players = leaderboard;

        this.elements.leaderboardList.innerHTML = '';
        leaderboard.forEach(player => {
            const item = document.createElement('div');
            const isCurrentPlayer = player.id === this.state.socket.id;
            const hasAnswered = player.hasAnswered;

            item.className = `leaderboard-item${isCurrentPlayer ? ' current-player' : ''}${hasAnswered ? ' answered' : ''}`;
            item.innerHTML = `
                <span class="leaderboard-rank${player.rank <= 3 ? ` rank-${player.rank}` : ''}">${player.rank}</span>
                <span class="leaderboard-name">${player.username}${isCurrentPlayer ? ' (vous)' : ''}</span>
                <span class="leaderboard-score">${player.score.toLocaleString()}</span>
            `;
            this.elements.leaderboardList.appendChild(item);
        });

        this.elements.answeredCount.textContent = answeredCount;
        this.elements.totalPlayers.textContent = totalPlayers;
    }

    showMultiEndScreen(leaderboard) {
        // Podium
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
                place.el.querySelector('.podium-score').textContent = player.score.toLocaleString();
                place.el.style.display = 'flex';
            } else {
                place.el.style.display = 'none';
            }
        });

        // Full leaderboard (si plus de 3 joueurs)
        this.elements.fullLeaderboard.innerHTML = '';
        if (leaderboard.length > 3) {
            leaderboard.slice(3).forEach((player, index) => {
                const item = document.createElement('div');
                item.className = 'full-leaderboard-item';
                item.innerHTML = `
                    <span class="full-leaderboard-rank">${index + 4}</span>
                    <span class="full-leaderboard-name">${player.username}</span>
                    <span class="full-leaderboard-score">${player.score.toLocaleString()}</span>
                `;
                this.elements.fullLeaderboard.appendChild(item);
            });
        }

        // Titre personnalisé
        const myRank = leaderboard.findIndex(p => p.id === this.state.socket.id) + 1;
        if (myRank === 1) {
            this.elements.multiEndTitle.textContent = '🎉 Vous avez gagné !';
        } else if (myRank <= 3) {
            this.elements.multiEndTitle.textContent = `🎉 ${myRank}ème place !`;
        } else {
            this.elements.multiEndTitle.textContent = '🎉 Partie terminée !';
        }

        this.showScreen('multiEnd');
        this.launchConfetti(this.elements.multiConfetti);
    }

    showLobbyError(message) {
        this.elements.lobbyError.textContent = message;
        this.elements.lobbyError.classList.remove('hidden');
    }

    hideLobbyError() {
        this.elements.lobbyError.classList.add('hidden');
    }

    // ==================== MAP ====================

    initMap() {
        this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: true,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        this.map.on('click', (e) => this.handleMapClick(e));
    }

    handleMapClick(e) {
        // Ignorer si déjà répondu
        if (this.state.mode === 'multi' && this.state.hasAnswered) {
            return;
        }

        // Ignorer si le résultat est affiché (solo)
        if (this.state.mode === 'solo' && !this.elements.resultOverlay.classList.contains('hidden')) {
            return;
        }

        // Arrêter le timer
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }

        const clickLatLng = e.latlng;
        this.showResult(clickLatLng);
    }

    // ==================== GAME LOGIC ====================

    nextRound() {
        // Mode solo uniquement
        if (this.state.mode !== 'solo') return;

        this.elements.resultOverlay.classList.add('hidden');
        this.clearMarkers();

        if (this.state.currentRound >= this.config.totalRounds) {
            this.endGame();
            return;
        }

        this.state.currentRound++;
        this.state.currentCountry = this.state.countries[this.state.currentRound - 1];

        this.elements.currentRound.textContent = this.state.currentRound;
        this.elements.countryName.textContent = this.state.currentCountry.name;

        const diffConfig = this.config.difficulties[this.state.difficulty];
        if (diffConfig.showHint && this.state.currentCountry.hint) {
            this.elements.hintContainer.classList.remove('hidden');
            this.elements.hintText.textContent = `Indice: ${this.state.currentCountry.hint}`;
        } else {
            this.elements.hintContainer.classList.add('hidden');
        }

        this.map.setView([20, 0], 2);

        if (diffConfig.timer) {
            this.startTimer(diffConfig.timer);
        }
    }

    startTimer(duration) {
        this.state.timeLeft = duration;
        this.elements.timer.textContent = duration;
        this.updateTimerProgress(duration, duration);

        if (this.state.timer) {
            clearInterval(this.state.timer);
        }

        this.state.timer = setInterval(() => {
            this.state.timeLeft--;
            this.elements.timer.textContent = this.state.timeLeft;
            this.updateTimerProgress(this.state.timeLeft, duration);

            if (this.state.timeLeft <= 0) {
                clearInterval(this.state.timer);
                this.state.timer = null;
                this.handleTimeout();
            }
        }, 1000);
    }

    updateTimerProgress(current, total) {
        const percentage = (current / total) * 100;
        this.elements.timerProgress.style.strokeDasharray = `${percentage}, 100`;

        this.elements.timerProgress.classList.remove('warning', 'danger');
        if (percentage <= 33) {
            this.elements.timerProgress.classList.add('danger');
        } else if (percentage <= 66) {
            this.elements.timerProgress.classList.add('warning');
        }
    }

    handleTimeout() {
        if (this.state.mode === 'multi' && !this.state.hasAnswered) {
            this.state.hasAnswered = true;
            this.state.socket.emit('submitAnswer', {
                roomCode: this.state.roomCode,
                distance: null,
                points: 0
            });
            this.showMultiResult(null, 0);
        } else if (this.state.mode === 'solo') {
            this.showResult(null);
        }
    }

    showResult(clickLatLng) {
        const country = this.state.currentCountry;
        const targetLatLng = L.latLng(country.lat, country.lng);

        let distance = 0;
        let points = 0;

        if (clickLatLng) {
            distance = clickLatLng.distanceTo(targetLatLng) / 1000;
            points = this.calculatePoints(distance);

            this.markers.click = L.marker(clickLatLng, {
                icon: L.divIcon({
                    className: 'click-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.map);

            this.markers.line = L.polyline([clickLatLng, targetLatLng], {
                color: '#f59e0b',
                weight: 3,
                dashArray: '10, 5',
                opacity: 0.8
            }).addTo(this.map);
        }

        this.markers.target = L.marker(targetLatLng, {
            icon: L.divIcon({
                className: 'target-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(this.map);

        if (clickLatLng) {
            const bounds = L.latLngBounds([clickLatLng, targetLatLng]);
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        } else {
            this.map.setView(targetLatLng, 4);
        }

        this.state.score += points;
        this.elements.score.textContent = this.state.score.toLocaleString();

        this.updateStats(points);

        if (this.state.mode === 'multi') {
            this.state.hasAnswered = true;
            this.state.socket.emit('submitAnswer', {
                roomCode: this.state.roomCode,
                distance: distance,
                points: points
            });
            this.showMultiResult(distance, points);
        } else {
            this.displayResultOverlay(distance, points, clickLatLng !== null);
        }
    }

    showMultiResult(distance, points) {
        let emoji, title, titleClass;

        if (distance === null) {
            emoji = '⏰';
            title = 'Temps écoulé !';
            titleClass = 'poor';
        } else if (points >= 900) {
            emoji = '🎯';
            title = 'Excellent !';
            titleClass = 'excellent';
        } else if (points >= 500) {
            emoji = '👏';
            title = 'Bien joué !';
            titleClass = 'good';
        } else if (points > 0) {
            emoji = '🤔';
            title = 'Pas mal...';
            titleClass = 'average';
        } else {
            emoji = '😅';
            title = 'Raté !';
            titleClass = 'poor';
        }

        this.elements.multiResultEmoji.textContent = emoji;
        this.elements.multiResultTitle.textContent = title;
        this.elements.multiResultTitle.className = titleClass;

        if (distance !== null) {
            this.elements.multiResultDistance.textContent = `Vous étiez à ${Math.round(distance).toLocaleString()} km`;
        } else {
            this.elements.multiResultDistance.textContent = `Le pays était: ${this.state.currentCountry.name}`;
        }

        this.elements.multiResultPoints.textContent = points;
        this.elements.multiResultOverlay.classList.remove('hidden');
    }

    calculatePoints(distance) {
        if (distance <= 300) return 1000;
        if (distance <= 500) return 900;
        if (distance <= 750) return 800;
        if (distance <= 1000) return 700;
        if (distance <= 1500) return 550;
        if (distance <= 2000) return 400;
        if (distance <= 2500) return 300;
        if (distance <= 3000) return 200;
        if (distance <= 4000) return 100;
        if (distance <= 5000) return 50;
        return 0;
    }

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

    displayResultOverlay(distance, points, clicked) {
        let emoji, title, titleClass;

        if (!clicked) {
            emoji = '⏰';
            title = 'Temps écoulé !';
            titleClass = 'poor';
        } else if (points >= 900) {
            emoji = '🎯';
            title = 'Excellent !';
            titleClass = 'excellent';
        } else if (points >= 500) {
            emoji = '👏';
            title = 'Bien joué !';
            titleClass = 'good';
        } else if (points > 0) {
            emoji = '🤔';
            title = 'Pas mal...';
            titleClass = 'average';
        } else {
            emoji = '😅';
            title = 'Raté !';
            titleClass = 'poor';
        }

        this.elements.resultEmoji.textContent = emoji;
        this.elements.resultTitle.textContent = title;
        this.elements.resultTitle.className = titleClass;

        if (clicked) {
            this.elements.resultDistance.textContent = `Vous étiez à ${Math.round(distance).toLocaleString()} km`;
        } else {
            this.elements.resultDistance.textContent = `Le pays était: ${this.state.currentCountry.name}`;
        }

        this.elements.resultPoints.textContent = points;

        this.elements.nextBtn.disabled = true;

        if (this.state.currentRound >= this.config.totalRounds) {
            this.elements.nextBtn.innerHTML = `
                <span>Voir les résultats</span>
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
            `;
        } else {
            this.elements.nextBtn.innerHTML = `
                <span>Question suivante</span>
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
                </svg>
            `;
        }

        this.elements.resultOverlay.classList.remove('hidden');

        setTimeout(() => {
            this.elements.nextBtn.disabled = false;
        }, 2000);
    }

    clearMarkers() {
        if (this.markers.click) {
            this.map.removeLayer(this.markers.click);
            this.markers.click = null;
        }
        if (this.markers.target) {
            this.map.removeLayer(this.markers.target);
            this.markers.target = null;
        }
        if (this.markers.line) {
            this.map.removeLayer(this.markers.line);
            this.markers.line = null;
        }
    }

    endGame() {
        this.elements.finalScore.textContent = this.state.score.toLocaleString();
        this.elements.statPerfect.textContent = this.state.stats.perfect;
        this.elements.statGood.textContent = this.state.stats.good;
        this.elements.statAverage.textContent = this.state.stats.average;
        this.elements.statMissed.textContent = this.state.stats.missed;

        this.showScreen('end');
        this.launchConfetti(this.elements.confetti);
    }

    launchConfetti(container) {
        if (!container) return;
        container.innerHTML = '';
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
    }

    replay() {
        if (this.state.mode === 'solo') {
            this.startSoloGame();
        }
    }

    handleBackFromGame() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
        this.clearMarkers();
        this.elements.resultOverlay.classList.add('hidden');
        this.elements.multiResultOverlay.classList.add('hidden');

        if (this.state.mode === 'multi') {
            this.state.socket.emit('leaveRoom');
            this.state.roomCode = null;
            this.state.isHost = false;
            this.state.players = [];
        }

        this.showScreen('mode');
    }

    goToMenu() {
        if (this.state.timer) {
            clearInterval(this.state.timer);
            this.state.timer = null;
        }
        this.clearMarkers();
        this.elements.resultOverlay.classList.add('hidden');
        this.elements.multiResultOverlay.classList.add('hidden');

        if (this.state.mode === 'multi') {
            this.state.socket.emit('leaveRoom');
            this.state.roomCode = null;
            this.state.isHost = false;
            this.state.players = [];
        }

        this.showScreen('mode');
    }
}

// Initialiser le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.geoQuiz = new GeoQuiz();
});

