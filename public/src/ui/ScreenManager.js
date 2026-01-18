/**
 * ScreenManager - Gestion de la navigation entre écrans
 * Responsable de l'affichage et du masquage des différents écrans du jeu
 */
class ScreenManager {
    constructor() {
        this.currentScreen = null;
        
        // Map des écrans disponibles
        this.screens = {
            mode: document.getElementById('mode-screen'),
            welcome: document.getElementById('welcome-screen'),
            lobby: document.getElementById('lobby-screen'),
            waitingRoom: document.getElementById('waiting-room-screen'),
            game: document.getElementById('game-screen'),
            end: document.getElementById('end-screen'),
            multiEnd: document.getElementById('multi-end-screen'),
            review: document.getElementById('review-screen')
        };
    }

    /**
     * Affiche un écran spécifique et cache tous les autres
     * @param {string} screenName - Nom de l'écran à afficher ('mode', 'welcome', etc.)
     * @param {boolean} skipHistory - Si true, ne met pas à jour l'historique du navigateur
     */
    showScreen(screenName, skipHistory = false) {
        // Masquer tous les écrans
        this.hideAllScreens();
        
        // Afficher l'écran demandé
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        } else {
            console.warn(`Screen "${screenName}" not found`);
        }
        
        // Mettre à jour l'historique du navigateur
        if (!skipHistory) {
            const url = screenName === 'mode' ? '#' : `#${screenName}`;
            history.pushState({ screen: screenName }, '', url);
        }
    }

    /**
     * Masque tous les écrans
     */
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
    }

    /**
     * Retourne à l'écran de sélection de mode
     */
    returnToHome() {
        this.showScreen('mode');
    }

    /**
     * Affiche l'écran de bienvenue (sélection difficulté solo)
     */
    showWelcomeScreen() {
        this.showScreen('welcome');
    }

    /**
     * Affiche l'écran de lobby multijoueur
     */
    showLobbyScreen() {
        this.showScreen('lobby');
    }

    /**
     * Affiche la salle d'attente multijoueur
     */
    showWaitingRoom() {
        this.showScreen('waitingRoom');
    }

    /**
     * Affiche l'écran de jeu
     */
    showGameScreen() {
        this.showScreen('game');
    }

    /**
     * Affiche l'écran de révision (multijoueur)
     */
    showReviewScreen() {
        this.showScreen('review');
    }

    /**
     * Affiche l'écran de fin de partie
     * @param {string} mode - Mode de jeu ('solo' ou 'multi')
     */
    showEndScreen(mode) {
        if (mode === 'solo') {
            this.showScreen('end');
        } else {
            this.showScreen('multiEnd');
        }
    }

    /**
     * Récupère l'écran actuellement affiché
     * @returns {string|null} Nom de l'écran actuel
     */
    getCurrentScreen() {
        return this.currentScreen;
    }

    /**
     * Configure la navigation par historique du navigateur
     */
    setupHistoryNavigation() {
        // Gérer les boutons retour/avant du navigateur
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screen) {
                this.showScreen(event.state.screen, true);
            } else {
                // Pas d'état, revenir à l'écran mode
                this.showScreen('mode', true);
            }
        });
        
        // Définir l'état initial
        history.replaceState({ screen: 'mode' }, '', '#');
    }

    /**
     * Vérifie les paramètres URL au démarrage (pour les liens de partage de salon)
     * @returns {boolean} True si un code de salon a été trouvé dans l'URL
     */
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        
        if (roomCode && roomCode.length === 6) {
            // Si un code de salle est dans l'URL, rediriger vers le lobby multi et pré-remplir
            this.showScreen('lobby');
            const roomCodeInput = document.getElementById('room-code-input');
            const usernameInput = document.getElementById('username-input');
            const createRoomSection = document.getElementById('create-room-section');
            const joinRoomSection = document.getElementById('join-room-section');
            
            if (roomCodeInput) {
                roomCodeInput.value = roomCode.toUpperCase();
                // Désactiver le champ de code de salle puisqu'il est déjà rempli
                roomCodeInput.disabled = true;
            }
            
            // Cacher la section "Créer un salon" pour simplifier l'interface
            if (createRoomSection) {
                createRoomSection.style.display = 'none';
            }
            
            // Mettre en évidence la section "Rejoindre"
            if (joinRoomSection) {
                joinRoomSection.style.flex = '1';
                joinRoomSection.style.maxWidth = '400px';
            }
            
            // Stocker le code de room en attente (pour utilisation par GameEngine)
            this.pendingRoomCode = roomCode.toUpperCase();
            
            // Donner le focus au champ pseudo pour que l'utilisateur puisse directement taper
            if (usernameInput) {
                setTimeout(() => usernameInput.focus(), 100);
            }
            
            return true; // Un code de salon a été trouvé
        }
        
        return false; // Pas de code de salon dans l'URL
    }
    
    /**
     * Réinitialise l'état du lobby (quand on revient en arrière)
     */
    resetLobbyState() {
        const roomCodeInput = document.getElementById('room-code-input');
        const createRoomSection = document.getElementById('create-room-section');
        const joinRoomSection = document.getElementById('join-room-section');
        
        if (roomCodeInput) {
            roomCodeInput.disabled = false;
            roomCodeInput.value = '';
        }
        
        if (createRoomSection) {
            createRoomSection.style.display = '';
        }
        
        if (joinRoomSection) {
            joinRoomSection.style.flex = '';
            joinRoomSection.style.maxWidth = '';
        }
        
        this.pendingRoomCode = null;
    }
}

export default ScreenManager;
