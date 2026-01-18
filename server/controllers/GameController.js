/**
 * GameController - Gère la logique de jeu et la progression des rounds
 * Calcul des points, gestion des rounds, et traitement des réponses
 */

const { calculateLocationPoints, calculateFlagPoints } = require('../../config');
const { selectCountriesForGame, createFlagChoices } = require('../utils/countrySelector');

class GameController {
    /**
     * Crée une nouvelle instance du contrôleur
     * @param {Object} io - Instance Socket.io pour la communication
     * @param {Array} allCountries - Liste complète des pays disponibles
     */
    constructor(io, allCountries) {
        this.io = io;
        this.allCountries = allCountries;
    }

    /**
     * Démarre une partie dans un salon
     * @param {Room} room - Le salon où démarrer la partie
     * @param {Object} settings - Paramètres de la partie (rounds, timer)
     */
    startGame(room, settings) {
        // Mettre à jour les paramètres si fournis
        if (settings) {
            room.updateSettings(settings);
        }

        // Sélectionner les pays pour la partie avec filtre continent
        const result = selectCountriesForGame(
            this.allCountries,
            room.difficulty,
            room.settings.totalRounds,
            room.settings.continent
        );

        // Mettre à jour le nombre de rounds si limité par le continent
        if (result.actualCount < room.settings.totalRounds) {
            room.settings.totalRounds = result.actualCount;
            room.gameState.totalRounds = result.actualCount;
        }

        // Initialiser la partie
        room.gameState.startGame(result.countries);
        room.resetPlayersForNewRound();
        
        // Mettre tous les joueurs en état 'playing'
        room.players.forEach(p => room.playerLocations.set(p.id, 'playing'));

        console.log(`[GameController] Partie démarrée dans le salon ${room.code}`);

        // Notifier tous les joueurs
        this.io.to(room.code).emit('gameStarted', {
            settings: room.settings,
            gameMode: room.gameMode,
            difficulty: room.difficulty,
            totalRounds: room.gameState.totalRounds,
            timer: room.settings.timer
        });

        // Démarrer le premier round après un court délai
        setTimeout(() => {
            this.startNextRound(room);
        }, 3000);
    }

    /**
     * Démarre le round suivant
     * @param {Room} room - Le salon
     * @returns {boolean} True si un round a démarré, false si la partie est terminée
     */
    startNextRound(room) {
        // Nettoyer les timeouts existants
        if (room.gameState.nextRoundTimeout) {
            clearTimeout(room.gameState.nextRoundTimeout);
            room.gameState.nextRoundTimeout = null;
        }
        
        // Réinitialiser les états des joueurs
        room.resetPlayersForNewRound();

        // Passer au round suivant
        const hasNextRound = room.gameState.nextRound();

        if (!hasNextRound) {
            // La partie est terminée, passer en mode révision
            this.startReviewPhase(room);
            return false;
        }

        const country = room.gameState.currentCountry;
        console.log(`[GameController] Round ${room.gameState.currentRound}/${room.gameState.totalRounds}: ${country.name}`);

        // Préparer les données du round selon le mode
        let roundData;

        if (room.gameMode === 'flags') {
            // Mode drapeaux: créer les choix multiples
            const choices = createFlagChoices(country, this.allCountries);

            roundData = {
                gameMode: room.gameMode,
                roundNumber: room.gameState.currentRound,
                totalRounds: room.gameState.totalRounds,
                country: {
                    // Ne pas envoyer le nom pour éviter la triche
                    code: country.code,
                    hint: country.hint
                },
                choices: choices.map(c => ({
                    name: c.name,
                    code: c.code
                })),
                timer: room.settings.timer
            };
        } else {
            // Mode localisation - NE PAS ENVOYER LE NOM pour éviter la triche
            roundData = {
                gameMode: room.gameMode,
                roundNumber: room.gameState.currentRound,
                totalRounds: room.gameState.totalRounds,
                country: {
                    // Envoyer uniquement le code ISO pour identifier le pays sur la carte
                    code: country.code,
                    continent: country.continent,
                    hint: country.hint
                },
                timer: room.settings.timer
            };
        }

        // Envoyer le round à tous les joueurs
        this.io.to(room.code).emit('newRound', roundData);

        // Programmer la fin automatique du round si timer actif
        if (room.settings.timer) {
            room.gameState.roundTimer = setTimeout(() => {
                this.endRound(room);
            }, room.settings.timer * 1000 + 500);
        }

        return true;
    }

    /**
     * Traite une réponse de joueur
     * @param {Room} room - Le salon
     * @param {string} playerId - ID du joueur
     * @param {Object} answer - Données de la réponse
     */
    submitAnswer(room, playerId, answer) {
        const player = room.getPlayer(playerId);
        if (!player || player.hasAnswered) {
            return;
        }

        const country = room.gameState.currentCountry;
        let points = 0;
        let resultData = {
            playerId,
            username: player.username,
            roundNumber: room.gameState.currentRound
        };

        // Calculer les points selon le mode
        if (room.gameMode === 'flags') {
            const isCorrect = answer.selectedCountry === country.name;
            const timeElapsed = room.gameState.roundStartTime
                ? (Date.now() - room.gameState.roundStartTime) / 1000
                : 0;
            const timeLeft = room.settings.timer
                ? Math.max(0, room.settings.timer - timeElapsed)
                : room.settings.timer;

            points = calculateFlagPoints(isCorrect, timeLeft, room.settings.timer);

            resultData = {
                ...resultData,
                isCorrect,
                selectedCountry: answer.selectedCountry,
                correctCountry: country.name,
                points,
                timeElapsed
            };
        } else {
            // Mode localisation - score = nombre de bonnes réponses (pour calcul pourcentage)
            const distance = answer.distance;
            const isCorrect = answer.isCorrect;
            points = isCorrect ? 1 : 0;

            resultData = {
                ...resultData,
                position: {
                    lat: answer.lat,
                    lng: answer.lng
                },
                distance,
                isCorrect,
                points,
                clickedCountry: answer.clickedCountry
            };
        }

        // Enregistrer la réponse
        player.setAnswer(resultData);
        player.addPoints(points);

        // Stocker dans l'historique du round
        room.gameState.addAnswer(resultData);

        console.log(`[GameController] ${player.username}: ${points} points`);

        // Diffuser le résultat à tous les joueurs
        this.io.to(room.code).emit('showPlayerResult', {
            ...resultData,
            totalScore: player.score
        });

        // Vérifier si tous ont répondu
        if (room.allPlayersAnswered()) {
            console.log(`[GameController] Tous les joueurs ont répondu dans ${room.code}`);
            
            // Réduire le timer s'il en reste beaucoup
            if (room.settings.timer && room.gameState.roundTimer) {
                clearTimeout(room.gameState.roundTimer);
                
                // Fin du round dans 2 secondes
                this.io.to(room.code).emit('allPlayersAnswered', { newTimeLeft: 2 });
                
                room.gameState.roundTimer = setTimeout(() => {
                    this.endRound(room);
                }, 2000);
            } else if (!room.settings.timer) {
                // Pas de timer: terminer immédiatement
                setTimeout(() => this.endRound(room), 2000);
            }
        }
    }

    /**
     * Termine le round actuel
     * @param {Room} room - Le salon
     */
    endRound(room) {
        const country = room.gameState.currentCountry;

        console.log(`[GameController] Fin du round ${room.gameState.currentRound} dans ${room.code}`);

        // Envoyer les résultats du round
        this.io.to(room.code).emit('roundComplete', {
            roundNumber: room.gameState.currentRound,
            correctAnswer: {
                name: country.name,
                coordinates: {
                    lat: country.lat,
                    lng: country.lng
                }
            },
            leaderboard: room.getLeaderboard()
        });

        // Nettoyer le timer
        if (room.gameState.roundTimer) {
            clearTimeout(room.gameState.roundTimer);
            room.gameState.roundTimer = null;
        }
        
        // Passer automatiquement au round suivant après un délai
        room.gameState.nextRoundTimeout = setTimeout(() => {
            this.startNextRound(room);
        }, 3000); // 3 secondes pour voir les résultats
    }

    /**
     * Passe au round suivant (appelé par l'hôte ou automatiquement)
     * @param {Room} room - Le salon
     */
    requestNextRound(room) {
        // Vérifier si on est encore en phase "playing"
        if (room.gameState.status === 'playing') {
            this.startNextRound(room);
        }
    }

    /**
     * Termine la partie et affiche les résultats finaux
     * @param {Room} room - Le salon
     */
    endGame(room) {
        console.log(`[GameController] Partie terminée dans ${room.code}`);

        const leaderboard = room.getLeaderboard();
        
        // Mettre tous les joueurs en état 'leaderboard'
        room.players.forEach(p => room.playerLocations.set(p.id, 'leaderboard'));
        
        // Collecter tous les résultats par round
        const roundsResults = room.gameState.roundAnswers.map(roundData => ({
            round: roundData.round,
            country: {
                name: roundData.country.name,
                lat: roundData.country.lat,
                lng: roundData.country.lng,
                code: roundData.country.code
            },
            answers: roundData.answers.map(answer => ({
                playerId: answer.playerId,
                username: answer.username,
                points: answer.points,
                isCorrect: answer.isCorrect,
                distance: answer.distance || null,
                selectedCountry: answer.selectedCountry || null
            }))
        }));

        this.io.to(room.code).emit('gameComplete', {
            finalLeaderboard: leaderboard,
            winner: leaderboard[0],
            gameStats: {
                totalRounds: room.gameState.totalRounds,
                totalPlayers: room.players.length
            },
            roundsResults: roundsResults
        });

        // Ne plus réinitialiser automatiquement - chaque joueur choisit
        // Supprimer le timeout automatique
    }

    /**
     * Réinitialise le salon pour une nouvelle partie
     * @param {Room} room - Le salon
     */
    resetToLobby(room) {
        // Réinitialiser les scores
        room.players.forEach(p => {
            p.score = 0;
            p.resetForNewRound();
        });

        // Réinitialiser l'état du jeu
        room.gameState = new (require('../models/GameState'))(room.settings);

        this.io.to(room.code).emit('returnedToLobby', {
            players: room.players.map(p => p.toJSON()),
            difficulty: room.difficulty,
            gameMode: room.gameMode,
            settings: room.settings
        });

        console.log(`[GameController] Salon ${room.code} réinitialisé`);
    }

    /**
     * Gère le retour individuel d'un joueur à la salle d'attente
     * @param {Room} room - Le salon
     * @param {string} playerId - ID du joueur
     * @param {Object} socket - Socket du joueur
     */
    playerReturnToLobby(room, playerId, socket) {
        const player = room.getPlayer(playerId);
        if (!player) return;

        // Mettre à jour la location du joueur
        room.playerLocations.set(playerId, 'lobby');

        // Réinitialiser le score du joueur uniquement
        player.score = 0;
        player.resetForNewRound();

        console.log(`[GameController] ${player.username} retourne à la salle d'attente dans ${room.code}`);

        // Obtenir les joueurs par location
        const playersInLobby = [];
        const playersOnLeaderboard = [];
        
        room.players.forEach(p => {
            const location = room.playerLocations.get(p.id);
            if (location === 'lobby') {
                playersInLobby.push(p.toJSON());
            } else if (location === 'leaderboard') {
                playersOnLeaderboard.push(p.toJSON());
            }
        });

        // Notifier le joueur qui retourne
        socket.emit('youReturnedToLobby', {
            players: room.players.map(p => p.toJSON()),
            difficulty: room.difficulty,
            gameMode: room.gameMode,
            settings: room.settings,
            playersInLobby: playersInLobby,
            playersOnLeaderboard: playersOnLeaderboard
        });

        // Notifier tous les autres joueurs
        socket.to(room.code).emit('playerArrivedInLobby', {
            playerId: playerId,
            username: player.username,
            playersInLobby: playersInLobby,
            playersOnLeaderboard: playersOnLeaderboard
        });
    }

    /**
     * Démarre la phase de révision des résultats
     * @param {Room} room - Le salon
     */
    startReviewPhase(room) {
        console.log(`[GameController] Démarrage de la phase de révision dans ${room.code}`);

        room.gameState.enableReviewMode();

        // Notifier tous les joueurs du début de la phase de révision
        this.io.to(room.code).emit('reviewPhaseStarted', {
            hostId: room.hostId,
            totalRounds: room.gameState.totalRounds,
            totalPlayers: room.players.length
        });

        // Envoyer les premières données de révision
        this.sendReviewData(room);
    }

    /**
     * Active le mode révision (pour revoir les réponses)
     * @param {Room} room - Le salon
     */
    enableReviewMode(room) {
        room.gameState.enableReviewMode();

        // Envoyer les données de révision
        this.sendReviewData(room);
    }

    /**
     * Envoie les données de révision pour le round et joueur actuels
     * @param {Room} room - Le salon
     */
    sendReviewData(room) {
        const { currentRound, currentPlayerIndex } = room.gameState.reviewState;
        const roundData = room.gameState.getRoundAnswers(currentRound);

        if (!roundData) {
            console.error(`[GameController] Pas de données pour le round ${currentRound}`);
            // Passer directement au leaderboard final
            this.endGame(room);
            return;
        }

        // Trouver le joueur correspondant à l'index actuel
        const player = room.players[currentPlayerIndex];
        if (!player) {
            console.error(`[GameController] Joueur non trouvé pour l'index ${currentPlayerIndex}`);
            return;
        }

        // Trouver la réponse du joueur pour ce round
        const playerAnswer = roundData.answers.find(a => a.playerId === player.id);

        // Préparer le résultat (même si le joueur n'a pas répondu)
        const result = playerAnswer || {
            points: 0,
            isCorrect: false,
            distance: null,
            selectedCountry: null,
            selectedOption: null
        };

        // Déterminer si c'est le dernier joueur du round et/ou le dernier round
        const isLastPlayerForRound = currentPlayerIndex >= room.players.length - 1;
        const isLastRound = currentRound >= room.gameState.totalRounds;

        // Émettre l'événement showPlayerResult avec le format attendu par le client
        this.io.to(room.code).emit('showPlayerResult', {
            round: currentRound,
            totalRounds: room.gameState.totalRounds,
            player: player.toJSON(),
            result: result,
            country: roundData.country,
            gameMode: room.gameMode,
            isLastPlayerForRound: isLastPlayerForRound,
            isLastRound: isLastRound && isLastPlayerForRound
        });
    }
}

module.exports = GameController;
