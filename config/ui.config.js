/**
 * Configuration de l'interface utilisateur
 * Définit les constantes visuelles et les dimensions pour l'UI
 */

const UI_CONFIG = {
    // Configuration de la carte
    map: {
        defaultZoom: 2,
        defaultCenter: [20, 0],          // Lat, Lng
        maxZoom: 18,
        minZoom: 1,
        zoomSpeed: 1,
        
        // Continents bounds pour le zoom automatique
        continentBounds: {
            'Europe': [[35, -10], [71, 40]],
            'Asie': [[5, 25], [75, 145]],
            'Afrique': [[-35, -20], [37, 52]],
            'Amérique du Nord': [[15, -170], [72, -50]],
            'Amérique du Sud': [[-56, -82], [13, -34]],
            'Océanie': [[-47, 110], [0, 180]]
        },
        
        // Styles de la carte
        tileLayer: {
            url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        
        // Styles des marqueurs et pays
        styles: {
            correctCountry: {
                fillColor: '#22c55e',
                fillOpacity: 0.4,
                color: '#16a34a',
                weight: 2
            },
            playerMarker: {
                radius: 8,
                fillColor: '#3b82f6',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            },
            correctMarker: {
                radius: 8,
                fillColor: '#22c55e',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }
        }
    },
    
    // Configuration des écrans et animations
    screens: {
        transitionDuration: 300,          // Durée des transitions en ms
        fadeInDuration: 200,
        fadeOutDuration: 200
    },
    
    // Configuration du timer visuel
    timer: {
        warningThreshold: 5,              // Secondes restantes pour afficher l'avertissement
        criticalThreshold: 3,             // Secondes restantes pour afficher l'alerte critique
        colors: {
            normal: '#3b82f6',            // Bleu
            warning: '#f59e0b',           // Orange
            critical: '#ef4444'           // Rouge
        }
    },
    
    // Configuration du podium et classement
    leaderboard: {
        maxPlayersDisplayed: 10,          // Nombre max de joueurs affichés dans le classement
        podiumPositions: 3,               // Nombre de positions sur le podium
        medalColors: {
            1: '#FFD700',                 // Or
            2: '#C0C0C0',                 // Argent
            3: '#CD7F32'                  // Bronze
        }
    },
    
    // Messages et textes UI
    messages: {
        connecting: 'Connexion...',
        waitingForPlayers: 'En attente des joueurs...',
        waitingForHost: 'En attente du lancement par l\'hôte...',
        gameStarting: 'La partie commence !',
        roundStarting: 'Prochain round dans...',
        timeUp: 'Temps écoulé !',
        correct: 'Bonne réponse !',
        incorrect: 'Mauvaise réponse',
        disconnected: 'Déconnecté du serveur',
        roomNotFound: 'Salon introuvable',
        roomFull: 'Le salon est complet'
    },
    
    // Dimensions et espacements
    dimensions: {
        cardMinWidth: '100px',
        cardMaxWidth: '300px',
        buttonHeight: '45px',
        inputHeight: '40px',
        avatarSize: '40px',
        iconSize: '20px',
        spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            xxl: '3rem'
        }
    },
    
    // Breakpoints responsive
    breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px'
    }
};

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI_CONFIG;
}
