class SplixClient {
    constructor() {
        this.canvas = document.getElementById('splix-canvas');
        this.statusDiv = document.getElementById('splix-status');
        this.statsDiv = document.getElementById('game-stats');
        this.playersListDiv = document.getElementById('players-list');
        this.ctx = this.canvas.getContext('2d');
        
        this.ws = null;
        this.myPlayerId = -1;
        this.gameData = { players: [], map: [] };
        this.connectionStatus = 'connecting';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.GRID_SIZE = 15;
        this.MAP_WIDTH = 40;
        this.MAP_HEIGHT = 30;
        
        this.initializeEventListeners();
        this.connectToServer();
    }

    initializeEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        window.addEventListener('beforeunload', () => {
            if (this.ws) this.ws.close();
        });
    }

    connectToServer() {
        try {
            this.updateStatus('Connecting to Python server...', 'loading');
            this.ws = new WebSocket('ws://localhost:8081');
            
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
        this.updateStatus('Connected to server - Waiting for other players...', 'success');
        console.log('WebSocket connection established');
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.handleServerMessage(data);
        } catch (error) {
                        console.error('Error parsing server message:', error);
        }
    }

    handleConnectionClose() {
        this.connectionStatus = 'disconnected';
        console.log('WebSocket connection closed');
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateStatus(
                `Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 
                'loading'
            );
            setTimeout(() => this.connectToServer(), 3000);
        } else {
            this.updateStatus('Connection failed - Please refresh the page', 'error');
        }
    }

    handleConnectionError(error) {
        this.connectionStatus = 'error';
        console.error('WebSocket error:', error);
        this.updateStatus(
            'Connection error - Check that the Python server is running', 
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
                console.warn('unknown message type:', data.type);
        }
    }

    handlePlayerAssigned(data) {
        this.myPlayerId = data.playerId;
        this.gameData = data.gameState;
        
        const playerColors = ['🔴', '🟢', '🔵', '🟡'];
        const playerColor = playerColors[this.myPlayerId] || '⚪';
        
        this.updateStatus(
            `You are Player ${this.myPlayerId + 1} ${playerColor} - Waiting for other players...`, 
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
            `Player ${data.playerId + 1} ${playerColor} joined the game`, 
            'success'
        );
    }

    handlePlayerLeft(data) {
        this.updateStatus(`Player ${data.playerId + 1} left the game`, 'error');
    }

    handleGameOver(data) {
        const winner = data.winner === -1 ? 'Draw' : `Player ${data.winner + 1}`;
        this.updateStatus(`Game finished! Winner: ${winner} - Restarting in 5 seconds...`, 'success');
    }

    handleGameRestart() {
        this.updateStatus('New game started! Good luck!', 'success');
    }

    handleError(data) {
        this.updateStatus(`Error: ${data.message}`, 'error');
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
        this.canvas.width = this.MAP_WIDTH * this.GRID_SIZE;
        this.canvas.height = this.MAP_HEIGHT * this.GRID_SIZE;
        this.canvas.style.display = 'block';
        this.canvas.classList.add('active');
        
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
        
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawMap();
        this.drawPlayers();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([2, 4]);

        for (let x = 0; x <= this.MAP_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.GRID_SIZE, 0);
            this.ctx.lineTo(x * this.GRID_SIZE, this.canvas.height);
            this.ctx.stroke();
        }

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
                    this.drawTerritory(x, y, cell - 10);
                } else if (cell >= 0) {
                    this.drawTrail(x, y, cell);
                }
            }
        }
    }

    drawTerritory(x, y, playerIdx) {
        const player = this.gameData.players.find(p => p.id === playerIdx);
        if (!player)
            return;
        this.ctx.fillStyle = player.color;
        this.ctx.globalAlpha = 0.4;
        this.ctx.fillRect(x * this.GRID_SIZE, y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = player.color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x * this.GRID_SIZE, y * this.GRID_SIZE, this.GRID_SIZE, this.GRID_SIZE);
        this.ctx.globalAlpha = 1.0;
    }

    drawTrail(x, y, playerIdx) {
        const player = this.gameData.players.find(p => p.id === playerIdx);
        if (!player)
            return;
        this.ctx.fillStyle = player.color;
        this.ctx.fillRect(
            x * this.GRID_SIZE + 1, 
            y * this.GRID_SIZE + 1, 
            this.GRID_SIZE - 2, 
            this.GRID_SIZE - 2
        );
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

            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = player.color;
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.GRID_SIZE / 3, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.strokeStyle = player.id === this.myPlayerId ? '#fff' : '#ddd';
            this.ctx.lineWidth = player.id === this.myPlayerId ? 3 : 2;
            this.ctx.stroke();
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
                                ${status} Player ${player.id + 1} ${emoji}${isMe}
                            </div>
                        </div>
                        <div class="player-score">${player.score} pts</div>
                    </div>
                `;
            })
            .join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Initialisation du client Splix...');
    new SplixClient();
});
