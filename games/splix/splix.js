/**
 * Splix WebSocket Client - Version Python
 * Client JavaScript pour le jeu Splix multijoueur en temps réel
 */

class SplixClient {
    constructor() {
        // Éléments DOM
        this.canvas = document.getElementById('splix-canvas');
        this.statusDiv = document.getElementById('splix-status');
        this.statsDiv = document.getElementById('game-stats');
        this.playersListDiv = document.getElementById('players-list');
        this.ctx = this.canvas.getContext('2d');
        
        // État du jeu
        this.ws = null;
        this.myPlayerId = -1;
        this.gameData = { players: [], map: [] };
        this.connectionStatus = 'connecting';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Configuration du jeu
        this.GRID_SIZE = 15;
        this.MAP_WIDTH = 40;
        this.MAP_HEIGHT = 30;
        
        // Initialisation
        this.initializeEventListeners();
        this.connectToServer();
    }

    initializeEventListeners() {
        // Gestion des touches
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Gestion de la fermeture de la page
        window.addEventListener('beforeunload', () => {
            if (this.ws) this.ws.close();
        });
    }

    connectToServer() {
        try {
            this.updateStatus('🔄 Connexion au serveur Python...', 'loading');
            this.ws = new WebSocket('ws://localhost:8080');
            
            this.ws.onopen = () => this.handleConnectionOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => this.handleConnectionClose();
            this.ws.onerror = (error) => this.handleConnectionError(error);
            
        } catch (error) {
            this.handleConnectionError(error);
        }
    }

    handleConnectionOpen() {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.updateStatus('✅ Connecté au serveur - En attente d\'autres joueurs...', 'success');
        console.log('🔗 Connexion WebSocket établie');
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        } catch (error) {
            console.error('❌ Erreur parsing message serveur:', error);
        }
    }

    handleConnectionClose() {
        this.connectionStatus = 'disconnected';
        console.log('🔌 Connexion WebSocket fermée');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateStatus(
                `🔄 Reconnexion... (Tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 
                'loading'
            );
            setTimeout(() => this.connectToServer(), 3000);
        } else {
            this.updateStatus('❌ Connexion échouée - Actualisez la page', 'error');
        }
    }

    handleConnectionError(error) {
        this.connectionStatus = 'error';
        console.error('❌ Erreur WebSocket:', error);
        this.updateStatus(
            '❌ Erreur de connexion - Vérifiez que le serveur Python est démarré', 
            'error'
        );
    }

    handleServerMessage(data) {
        switch (data.type) {
            case 'playerAssigned':
                this.handlePlayerAssigned(data);
                break;
            case 'gameUpdate':
                this.handleGameUpdate(data);
                break;
            case 'playerJoined':
                this.handlePlayerJoined(data);
                break;
            case 'playerLeft':
                this.handlePlayerLeft(data);
                break;
            case 'gameOver':
                this.handleGameOver(data);
                break;
            case 'gameRestart':
                this.handleGameRestart();
                break;
            case 'error':
                this.handleError(data);
                break;
            default:
                console.warn('⚠️ Type de message inconnu:', data.type);
        }
    }

    handlePlayerAssigned(data) {
        this.myPlayerId = data.playerId;
        this.gameData = data.gameState;
        
        const playerColors = ['🔴', '🟢', '🔵', '🟡'];
        const playerColor = playerColors[this.myPlayerId] || '⚪';
        
        this.updateStatus(
            `🎮 Vous êtes le joueur ${this.myPlayerId + 1} ${playerColor} - En attente d'autres joueurs...`, 
            'success'
        );
        
        this.initializeGame();
        this.updatePlayerStats();
    }

    handleGameUpdate(data) {
        this.gameData = data.gameState;
        this.render();
        this.updatePlayerStats();
    }

    handlePlayerJoined(data) {
        const playerColors = ['🔴', '🟢', '🔵', '🟡'];
        const playerColor = playerColors[data.playerId] || '⚪';
        
        this.updateStatus(
            `➕ Joueur ${data.playerId + 1} ${playerColor} a rejoint la partie`, 
            'success'
        );
    }

    handlePlayerLeft(data) {
        this.updateStatus(`➖ Joueur ${data.playerId + 1} a quitté la partie`, 'error');
    }

    handleGameOver(data) {
        const winner = data.winner === -1 ? 'Match nul 🤝' : `🏆 Joueur ${data.winner + 1}`;
        this.updateStatus(`🎯 Partie terminée ! Gagnant: ${winner} - Redémarrage dans 5 secondes...`, 'success');
    }

    handleGameRestart() {
        this.updateStatus('🔄 Nouvelle partie commencée ! Bonne chance ! 🚀', 'success');
    }

    handleError(data) {
        this.updateStatus(`❌ Erreur: ${data.message}`, 'error');
    }

    updateStatus(message, type = '') {
        if (!this.statusDiv) return;
        
        const statusMessage = this.statusDiv.querySelector('.status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type ? 'status-' + type : ''}`;
            
            if (type === 'loading') {
                statusMessage.classList.add('loading-dots');
            }
        }
    }

    initializeGame() {
        // Configuration du canvas
        this.canvas.width = this.MAP_WIDTH * this.GRID_SIZE;
        this.canvas.height = this.MAP_HEIGHT * this.GRID_SIZE;
        this.canvas.style.display = 'block';
        this.canvas.classList.add('active');
        
        // Affiche les statistiques
        if (this.statsDiv) {
            this.statsDiv.style.display = 'block';
        }
        
        this.render();
    }

    sendMove(direction) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.myPlayerId !== -1) {
            this.ws.send(JSON.stringify({
                type: 'move',
                direction: direction
            }));
        }
    }

    handleKeyDown(e) {
        if (this.myPlayerId === -1 || !this.gameData.gameRunning) return;
        
        const keyMappings = {
            'ArrowUp': 'up', 'KeyW': 'up',
            'ArrowDown': 'down', 'KeyS': 'down',
            'ArrowLeft': 'left', 'KeyA': 'left',
            'ArrowRight': 'right', 'KeyD': 'right'
        };
        
        const direction = keyMappings[e.code];
        if (direction) {
            e.preventDefault();
            this.sendMove(direction);
        }
    }

    render() {
        if (!this.canvas || !this.ctx) return;
        
        // Fond avec dégradé
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grille subtile
        this.drawGrid();
        
        // Dessine la carte (territoires et trails)
        this.drawMap();
        
        // Dessine les joueurs
        this.drawPlayers();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([2, 4]);
        
        // Lignes verticales
        for (let x = 0; x <= this.MAP_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.GRID_SIZE, 0);
            this.ctx.lineTo(x * this.GRID_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Lignes horizontales
        for (let y = 0; y <= this.MAP_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.GRID_SIZE);
            this.ctx.lineTo(this.canvas.width, y * this.GRID_SIZE);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    drawMap() {
        for (let y = 0; y < this.MAP_HEIGHT && y < this.gameData.map.length; y++) {
            for (let x = 0; x < this.MAP_WIDTH && x < this.gameData.map[y].length; x++) {
                const cell = this.gameData.map[y][x];
                
                if (cell >= 10) {
                    // Territoire
                    this.drawTerritory(x, y, cell - 10);
                } else if (cell >= 0) {
                    // Trail
                    this.drawTrail(x, y, cell);
                }
            }
        }
    }

    drawTerritory(x, y, playerIdx) {
        const player = this.gameData.players.find(p => p.id === playerIdx);
        if (!player) return;
        
        // Fond du territoire
        this.ctx.fillStyle = player.color;
        this.ctx.globalAlpha = 0.4;
        this.ctx.fillRect(x * this.GRID_SIZE, y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);
        
        // Bordure
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = player.color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x * this.GRID_SIZE, y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);
        this.ctx.globalAlpha = 1.0;
    }

    drawTrail(x, y, playerIdx) {
        const player = this.gameData.players.find(p => p.id === playerIdx);
        if (!player) return;
        
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
            x * this.GRID_SIZE + 1, 
            y * this.GRID_SIZE + 1, 
            this.GRID_SIZE - 2, 
            this.GRID_SIZE - 2
        );
        
        // Effet de glow
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = player.color;
        this.ctx.fillRect(
            x * this.GRID_SIZE + 2, 
            y * this.GRID_SIZE + 2, 
            this.GRID_SIZE - 4, 
            this.GRID_SIZE - 4
        );
        this.ctx.shadowBlur = 0;
    }

    drawPlayers() {
        this.gameData.players.forEach(player => {
            if (!player.alive) return;
            
            const centerX = player.x * this.GRID_SIZE + this.GRID_SIZE / 2;
            const centerY = player.y * this.GRID_SIZE + this.GRID_SIZE / 2;
            
            // Effet glow
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = player.color;
            
            // Corps du joueur
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.GRID_SIZE / 3, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Bordure - plus épaisse pour le joueur actuel
            this.ctx.strokeStyle = player.id === this.myPlayerId ? '#fff' : '#ddd';
            this.ctx.lineWidth = player.id === this.myPlayerId ? 3 : 2;
            this.ctx.stroke();
            
            // Indicateur de direction
            this.drawDirectionIndicator(centerX, centerY, player.direction, player.color);
            
            this.ctx.shadowBlur = 0;
        });
    }

    drawDirectionIndicator(centerX, centerY, direction, color) {
        const directionOffsets = {
            'up': [0, -this.GRID_SIZE / 4],
            'down': [0, this.GRID_SIZE / 4],
            'left': [-this.GRID_SIZE / 4, 0],
            'right': [this.GRID_SIZE / 4, 0]
        };
        
        if (direction && directionOffsets[direction]) {
            const [dx, dy] = directionOffsets[direction];
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = color;
            this.ctx.beginPath();
            this.ctx.arc(centerX + dx, centerY + dy, 2, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    updatePlayerStats() {
        if (!this.playersListDiv || !this.gameData.players.length) return;
        
        const playerColors = ['🔴', '🟢', '🔵', '🟡'];
        
        this.playersListDiv.innerHTML = this.gameData.players
            .map(player => {
                const emoji = playerColors[player.id] || '⚪';
                const status = player.alive ? '🟢' : '💀';
                const isMe = player.id === this.myPlayerId ? ' (VOUS)' : '';
                
                return `
                    <div class="player-stat" style="border-left-color: ${player.color}">
                        <div class="player-info">
                            <div class="player-color" style="background-color: ${player.color}"></div>
                            <div class="player-name">
                                ${status} Joueur ${player.id + 1} ${emoji}${isMe}
                            </div>
                        </div>
                        <div class="player-score">${player.score} pts</div>
                    </div>
                `;
            })
            .join('');
    }
}

// Initialisation automatique quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initialisation du client Splix...');
    new SplixClient();
});