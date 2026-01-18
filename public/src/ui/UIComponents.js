/**
 * UIComponents - Composants UI réutilisables et helpers DOM
 * Responsable de la génération et mise à jour des éléments d'interface
 */
class UIComponents {
    /**
     * Crée une carte de joueur pour l'affichage dans le lobby/waiting room
     * @param {Object} player - Données du joueur {username, score, isHost, id}
     * @returns {HTMLElement} Élément DOM de la carte joueur
     */
    static createPlayerCard(player) {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.innerHTML = `
            <div class="player-avatar">${player.username.charAt(0).toUpperCase()}</div>
            <span class="player-name">${player.username}</span>
            ${player.isHost ? '<span class="player-badge">Hôte</span>' : ''}
        `;
        return item;
    }

    /**
     * Met à jour l'affichage du timer
     * @param {number} seconds - Secondes restantes
     * @param {HTMLElement} timerElement - Élément DOM du timer
     */
    static updateTimer(seconds, timerElement) {
        if (timerElement) {
            timerElement.textContent = seconds;
        }
    }

    /**
     * Met à jour la barre de progression du timer
     * @param {number} current - Temps actuel
     * @param {number} total - Temps total
     * @param {HTMLElement} progressElement - Élément SVG de progression
     */
    static updateTimerProgress(current, total, progressElement) {
        if (!progressElement) return;
        
        const percentage = (current / total) * 100;
        progressElement.style.strokeDasharray = `${percentage}, 100`;

        progressElement.classList.remove('warning', 'danger');
        if (percentage <= 33) {
            progressElement.classList.add('danger');
        } else if (percentage <= 66) {
            progressElement.classList.add('warning');
        }
    }

    /**
     * Affiche une notification temporaire
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification ('success', 'error', 'info')
     */
    static showNotification(message, type = 'info') {
        // TODO: Implémenter le système de notifications
        console.log(`[${type}] ${message}`);
    }

    /**
     * Met à jour le classement affiché (leaderboard)
     * @param {Array} leaderboard - Tableau des joueurs triés par score
     * @param {HTMLElement} container - Conteneur du classement
     */
    static updateLeaderboard(leaderboard, container) {
        if (!container) return;
        
        container.innerHTML = '';
        leaderboard.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${player.username}</span>
                <span class="leaderboard-score">${player.score.toLocaleString()}</span>
            `;
            container.appendChild(item);
        });
    }

    /**
     * Lance l'animation des confettis
     * @param {HTMLElement} container - Conteneur pour les confettis
     */
    static launchConfetti(container) {
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

    /**
     * Normalise un texte pour la comparaison (supprime accents, espaces, etc.)
     * @param {string} text - Texte à normaliser
     * @returns {string} Texte normalisé
     */
    static normalizeText(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-'\s.,()]/g, '')
            .trim();
    }

    /**
     * Affiche/masque un élément
     * @param {HTMLElement} element - Élément à modifier
     * @param {boolean} show - True pour afficher, false pour masquer
     */
    static toggleElement(element, show) {
        if (!element) return;
        
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    }

    /**
     * Active/désactive un élément
     * @param {HTMLElement} element - Élément à modifier
     * @param {boolean} enabled - True pour activer, false pour désactiver
     */
    static toggleEnabled(element, enabled) {
        if (!element) return;
        element.disabled = !enabled;
    }

    /**
     * Met à jour le texte d'un élément de manière sécurisée
     * @param {HTMLElement} element - Élément à mettre à jour
     * @param {string} text - Nouveau texte
     */
    static setText(element, text) {
        if (!element) return;
        element.textContent = text;
    }

    /**
     * Copie du texte dans le presse-papiers
     * @param {string} text - Texte à copier
     * @param {HTMLElement} button - Bouton optionnel pour le feedback visuel
     * @returns {Promise<boolean>} True si la copie a réussi
     */
    static async copyToClipboard(text, button = null) {
        try {
            await navigator.clipboard.writeText(text);
            
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 2000);
            }
            
            return true;
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
            return false;
        }
    }

    /**
     * Fait défiler horizontalement un conteneur
     * @param {HTMLElement} container - Conteneur à faire défiler
     * @param {string} direction - Direction ('left' ou 'right')
     * @param {number} amount - Quantité de scroll (optionnel)
     */
    static scrollContainer(container, direction, amount = null) {
        if (!container) return;
        
        let scrollAmount = amount;
        
        if (!scrollAmount) {
            // Calculer automatiquement basé sur la taille du conteneur
            const gap = 24; // 1.5rem = 24px
            const visibleWidth = container.offsetWidth;
            const cardWidth = (visibleWidth - (3 * gap)) / 4;
            scrollAmount = cardWidth + gap;
        }
        
        const currentScroll = container.scrollLeft;
        
        if (direction === 'left') {
            container.scrollTo({
                left: currentScroll - scrollAmount,
                behavior: 'smooth'
            });
        } else {
            container.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Affiche un message d'erreur dans le lobby
     * @param {string} message - Message d'erreur
     * @param {HTMLElement} errorElement - Élément DOM pour l'erreur
     */
    static showLobbyError(message, errorElement) {
        if (!errorElement) return;
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    /**
     * Masque le message d'erreur du lobby
     * @param {HTMLElement} errorElement - Élément DOM pour l'erreur
     */
    static hideLobbyError(errorElement) {
        if (!errorElement) return;
        errorElement.classList.add('hidden');
    }

    /**
     * Met à jour l'affichage du score (pourcentage ou points)
     * @param {number} score - Score actuel
     * @param {number} total - Total possible (pour le pourcentage)
     * @param {HTMLElement} element - Élément à mettre à jour
     * @param {boolean} isPercentage - True pour afficher en pourcentage
     */
    static updateScore(score, total, element, isPercentage = false) {
        if (!element) return;
        
        if (isPercentage && total > 0) {
            const percentage = Math.round((score / total) * 100);
            element.textContent = `${percentage}%`;
        } else {
            element.textContent = score.toLocaleString();
        }
    }
}

export default UIComponents;
