/**
 * GeoQuiz - Jeu de Géographie
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
            }
        };

        // Éléments DOM
        this.elements = {
            screens: {
                welcome: document.getElementById('welcome-screen'),
                game: document.getElementById('game-screen'),
                end: document.getElementById('end-screen')
            },
            difficultyCards: document.querySelectorAll('.difficulty-card'),
            startBtn: document.getElementById('start-btn'),
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
            resultOverlay: document.getElementById('result-overlay'),
            resultEmoji: document.getElementById('result-emoji'),
            resultTitle: document.getElementById('result-title'),
            resultDistance: document.getElementById('result-distance'),
            resultPoints: document.getElementById('result-points'),
            nextBtn: document.getElementById('next-btn'),
            finalScore: document.getElementById('final-score'),
            statPerfect: document.getElementById('stat-perfect'),
            statGood: document.getElementById('stat-good'),
            statAverage: document.getElementById('stat-average'),
            statMissed: document.getElementById('stat-missed'),
            replayBtn: document.getElementById('replay-btn'),
            menuBtn: document.getElementById('menu-btn'),
            confetti: document.getElementById('confetti')
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
        this.bindEvents();
        this.initMap();
    }

    bindEvents() {
        // Sélection de difficulté
        this.elements.difficultyCards.forEach(card => {
            card.addEventListener('click', () => this.selectDifficulty(card));
        });

        // Boutons
        this.elements.startBtn.addEventListener('click', () => this.startGame());
        this.elements.backBtn.addEventListener('click', () => this.goToMenu());
        this.elements.nextBtn.addEventListener('click', () => this.nextRound());
        this.elements.replayBtn.addEventListener('click', () => this.replay());
        this.elements.menuBtn.addEventListener('click', () => this.goToMenu());
    }

    initMap() {
        // Initialiser la carte Leaflet
        this.map = L.map('map', {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 10,
            worldCopyJump: true,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0
        });

        // Ajouter le style de carte sombre sans labels
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        // Événement de clic sur la carte
        this.map.on('click', (e) => this.handleMapClick(e));
    }

    selectDifficulty(card) {
        // Désélectionner tous
        this.elements.difficultyCards.forEach(c => c.classList.remove('selected'));
        
        // Sélectionner le choix
        card.classList.add('selected');
        this.state.difficulty = card.dataset.difficulty;
        
        // Activer le bouton
        this.elements.startBtn.disabled = false;
    }

    showScreen(screenName) {
        Object.values(this.elements.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.elements.screens[screenName].classList.add('active');
    }

    startGame() {
        // Réinitialiser l'état
        this.state.currentRound = 0;
        this.state.score = 0;
        this.state.stats = { perfect: 0, good: 0, average: 0, missed: 0 };

        // Préparer les pays
        this.prepareCountries();

        // Mettre à jour l'UI
        const diffConfig = this.config.difficulties[this.state.difficulty];
        this.elements.currentDifficulty.textContent = diffConfig.name;
        this.elements.score.textContent = '0';

        // Afficher/masquer le timer
        if (diffConfig.timer) {
            this.elements.timerContainer.classList.remove('hidden');
        } else {
            this.elements.timerContainer.classList.add('hidden');
        }

        // Afficher l'écran de jeu
        this.showScreen('game');

        // Redimensionner la carte
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

        // Mélanger et prendre le nombre nécessaire
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

    nextRound() {
        // Masquer le résultat
        this.elements.resultOverlay.classList.add('hidden');

        // Nettoyer les marqueurs
        this.clearMarkers();

        // Vérifier si la partie est terminée
        if (this.state.currentRound >= this.config.totalRounds) {
            this.endGame();
            return;
        }

        // Nouveau round
        this.state.currentRound++;
        this.state.currentCountry = this.state.countries[this.state.currentRound - 1];

        // Mettre à jour l'UI
        this.elements.currentRound.textContent = this.state.currentRound;
        this.elements.countryName.textContent = this.state.currentCountry.name;

        // Gérer l'indice
        const diffConfig = this.config.difficulties[this.state.difficulty];
        if (diffConfig.showHint && this.state.currentCountry.hint) {
            this.elements.hintContainer.classList.remove('hidden');
            this.elements.hintText.textContent = `Indice: ${this.state.currentCountry.hint}`;
        } else {
            this.elements.hintContainer.classList.add('hidden');
        }

        // Réinitialiser la vue de la carte
        this.map.setView([20, 0], 2);

        // Démarrer le timer si nécessaire
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
                this.handleTimeout();
            }
        }, 1000);
    }

    updateTimerProgress(current, total) {
        const percentage = (current / total) * 100;
        this.elements.timerProgress.style.strokeDasharray = `${percentage}, 100`;

        // Changer la couleur selon le temps restant
        this.elements.timerProgress.classList.remove('warning', 'danger');
        if (percentage <= 33) {
            this.elements.timerProgress.classList.add('danger');
        } else if (percentage <= 66) {
            this.elements.timerProgress.classList.add('warning');
        }
    }

    handleTimeout() {
        // Temps écoulé - 0 points
        this.showResult(null);
    }

    handleMapClick(e) {
        // Ignorer si le résultat est affiché
        if (!this.elements.resultOverlay.classList.contains('hidden')) {
            return;
        }

        // Arrêter le timer
        if (this.state.timer) {
            clearInterval(this.state.timer);
        }

        const clickLatLng = e.latlng;
        this.showResult(clickLatLng);
    }

    showResult(clickLatLng) {
        const country = this.state.currentCountry;
        const targetLatLng = L.latLng(country.lat, country.lng);

        let distance = 0;
        let points = 0;

        if (clickLatLng) {
            // Calculer la distance en km
            distance = clickLatLng.distanceTo(targetLatLng) / 1000;

            // Calculer les points (plus c'est proche, plus de points)
            points = this.calculatePoints(distance);

            // Ajouter le marqueur de clic
            this.markers.click = L.marker(clickLatLng, {
                icon: L.divIcon({
                    className: 'click-marker',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.map);

            // Ajouter la ligne de distance
            this.markers.line = L.polyline([clickLatLng, targetLatLng], {
                color: '#f59e0b',
                weight: 3,
                dashArray: '10, 5',
                opacity: 0.8
            }).addTo(this.map);
        }

        // Ajouter le marqueur cible
        this.markers.target = L.marker(targetLatLng, {
            icon: L.divIcon({
                className: 'target-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(this.map);

        // Zoomer pour voir les deux marqueurs
        if (clickLatLng) {
            const bounds = L.latLngBounds([clickLatLng, targetLatLng]);
            this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
        } else {
            this.map.setView(targetLatLng, 4);
        }

        // Mettre à jour le score
        this.state.score += points;
        this.elements.score.textContent = this.state.score.toLocaleString();

        // Mettre à jour les stats
        this.updateStats(points);

        // Afficher le résultat
        this.displayResultOverlay(distance, points, clickLatLng !== null);
    }

    calculatePoints(distance) {
        // Système de score basé sur la distance
        // 0-300 km = 1000 points (dans le pays)
        // Plus loin = moins de points
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

        // Désactiver le bouton temporairement
        this.elements.nextBtn.disabled = true;
        
        // Changer le texte du bouton si c'est le dernier round
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
        
        // Réactiver le bouton après 2 secondes
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
        // Afficher les résultats finaux
        this.elements.finalScore.textContent = this.state.score.toLocaleString();
        this.elements.statPerfect.textContent = this.state.stats.perfect;
        this.elements.statGood.textContent = this.state.stats.good;
        this.elements.statAverage.textContent = this.state.stats.average;
        this.elements.statMissed.textContent = this.state.stats.missed;

        // Afficher l'écran de fin
        this.showScreen('end');

        // Lancer les confettis
        this.launchConfetti();
    }

    launchConfetti() {
        this.elements.confetti.innerHTML = '';
        const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            this.elements.confetti.appendChild(confetti);
        }
    }

    replay() {
        this.startGame();
    }

    goToMenu() {
        // Arrêter le timer si en cours
        if (this.state.timer) {
            clearInterval(this.state.timer);
        }

        // Nettoyer les marqueurs
        this.clearMarkers();

        // Masquer le résultat
        this.elements.resultOverlay.classList.add('hidden');

        // Retour au menu
        this.showScreen('welcome');
    }
}

// Initialiser le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.geoQuiz = new GeoQuiz();
});
