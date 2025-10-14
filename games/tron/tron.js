class TronGame {
    constructor()
    {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameMode = null;
        this.numPlayers = 2;
        this.players = [];
        this.colors = ['#00ff00', '#ff0000', '#00ffff', '#0000ff'];
        this.colorNames = ['GREEN', 'RED', 'CYAN', 'BLUE'];
        this.gameSpeed = 80;
        this.cellSize = 8;
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.gridWidth = Math.floor(this.gameWidth / this.cellSize);
        this.gridHeight = Math.floor(this.gameHeight / this.cellSize);
        this.gameInterval = null;
        this.keyConfig = null;

        this.initEventListeners();
    }

    initEventListeners()
    {
        document.addEventListener('keydown', (key_pressed) => this.handleKeyDown(key_pressed));

        document.addEventListener('keydown', (e) => {
            if (this.gameRunning && (
                e.code === 'ArrowUp' || e.code === 'ArrowDown' ||
                e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
                e.code === 'Space'
            )) {
                e.preventDefault();
            }
        });

        this.initMobileControls();
    }

    initMobileControls()
    {
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        if (upBtn) upBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(0, -1); });
        if (downBtn) downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(0, 1); });
        if (leftBtn) leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(-1, 0); });
        if (rightBtn) rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.movePlayer(1, 0); });

        if (upBtn) upBtn.addEventListener('click', (e) => { e.preventDefault(); this.movePlayer(0, -1); });
        if (downBtn) downBtn.addEventListener('click', (e) => { e.preventDefault(); this.movePlayer(0, 1); });
        if (leftBtn) leftBtn.addEventListener('click', (e) => { e.preventDefault(); this.movePlayer(-1, 0); });
        if (rightBtn) rightBtn.addEventListener('click', (e) => { e.preventDefault(); this.movePlayer(1, 0); });
    }

    movePlayer(dx, dy)
    {
        if (!this.gameRunning || this.gamePaused) return;
        const player = this.players[0];
        if (!player || !player.alive) return;

        if (dx === 1 && player.dx !== -1) {
            player.dx = 1;
            player.dy = 0;
        } else if (dx === -1 && player.dx !== 1) {
            player.dx = -1;
            player.dy = 0;
        } else if (dy === -1 && player.dy !== 1) {
            player.dx = 0;
            player.dy = -1;
        } else if (dy === 1 && player.dy !== -1) {
            player.dx = 0;
            player.dy = 1;
        }
    }

    resetPlayers(oldPlayers = null)
    {
        const positions = [
            { x: Math.floor(this.gridWidth / 4), y: Math.floor(this.gridHeight / 2), dx: 1, dy: 0 },
            { x: Math.floor(3 * this.gridWidth / 4), y: Math.floor(this.gridHeight / 2), dx: -1, dy: 0 },
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(this.gridHeight / 4), dx: 0, dy: 1 },
            { x: Math.floor(this.gridWidth / 2), y: Math.floor(3 * this.gridHeight / 4), dx: 0, dy: -1 }
        ];

        this.players = [];
        for (let i = 0; i < this.numPlayers; i++) {
            const score = oldPlayers ? oldPlayers[i].score : 0;
            this.players.push({
                x: positions[i].x,
                y: positions[i].y,
                dx: positions[i].dx,
                dy: positions[i].dy,
                trail: new Set(),
                color: this.colors[i],
                colorName: this.colorNames[i],
                score: score,
                alive: true
            });
        }
    }

    handleKeyDown(key_pressed)
    {
        if (!this.gameRunning) return;

        if (document.activeElement && (
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA')
        ) {
            return;
        }

        if (key_pressed.code === 'Space') {
            key_pressed.preventDefault();
            this.togglePause();
            return;
        }
        if (key_pressed.code === 'Escape') {
            this.quitGame();
            return;
        }
        if (this.gamePaused) return;
        const player = this.players[0];
        if (!player || !player.alive) return;

        switch (key_pressed.code) {
            case 'KeyZ':
            case 'ArrowUp':
            case 'KeyW':
                key_pressed.preventDefault();
                if (player.dy !== 1) {
                    player.dx = 0;
                    player.dy = -1;
                }
                break;
            case 'KeyS':
            case 'ArrowDown':
            case 'KeyX':
                key_pressed.preventDefault();
                if (player.dy !== -1) {
                    player.dx = 0;
                    player.dy = 1;
                }
                break;
            case 'KeyQ':
            case 'ArrowLeft':
            case 'KeyA':
                key_pressed.preventDefault();
                if (player.dx !== 1) {
                    player.dx = -1;
                    player.dy = 0;
                }
                break;
            case 'KeyD':
            case 'ArrowRight':
            case 'KeyE':
                key_pressed.preventDefault();
                if (player.dx !== -1) {
                    player.dx = 1;
                    player.dy = 0;
                }
                break;
        }
    }

    getPossibleMoves(aiPlayer, humanPlayer)
    {
        const possibleMoves = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 }
        ];

        const safeMoves = [];

        for (const move of possibleMoves) {
            const nextX = aiPlayer.x + move.dx;
            const nextY = aiPlayer.y + move.dy;

            if (nextX <= 0 || nextX >= this.gridWidth - 1 || nextY <= 0 || nextY >= this.gridHeight - 1) {
                continue;
            }
            const posKey = `${nextX},${nextY}`;
            let collision = false;
            for (const player of this.players) {
                if (player.trail.has(posKey)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) {
                safeMoves.push(move);
            }
        }
        return safeMoves;
    }

    floodFillSpace(startX, startY, maxDepth = 20)
    {
        const visited = new Set();
        const queue = [{ x: startX, y: startY, depth: 0 }];

        while (queue.length > 0) {
            const { x, y, depth } = queue.shift();
            const posKey = `${x},${y}`;
            if (visited.has(posKey) || depth > maxDepth) continue;
            if (x <= 0 || x >= this.gridWidth - 1 || y <= 0 || y >= this.gridHeight - 1) continue;
            let collision = false;
            for (const player of this.players) {
                if (player.trail.has(posKey)) {
                    collision = true;
                    break;
                }
            }
            if (collision) continue;
            visited.add(posKey);
            const directions = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 0, dy: 1 }];
            for (const dir of directions) {
                queue.push({ x: x + dir.dx, y: y + dir.dy, depth: depth + 1 });
            }
        }
        return visited.size;
    }

    aiChooseMove(aiPlayer, humanPlayer, safeMoves)
    {
        if (safeMoves.length === 0) {
            return { dx: aiPlayer.dx, dy: aiPlayer.dy };
        }

        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor(this.gridHeight / 2);

        return safeMoves.reduce((best, move) => {
            const nextX = aiPlayer.x + move.dx;
            const nextY = aiPlayer.y + move.dy;

            const territory = this.floodFillSpace(nextX, nextY, 30);
            const distToHuman = Math.abs(nextX - humanPlayer.x) + Math.abs(nextY - humanPlayer.y);
            const distToCenter = Math.abs(nextX - centerX) + Math.abs(nextY - centerY);

            let score = territory * 2;
            score -= distToCenter * 0.5;

            if (territory > 20) {
                score -= distToHuman * 2;
            } else {
                score += distToHuman;
            }

            const playerNextX = humanPlayer.x + humanPlayer.dx;
            const playerNextY = humanPlayer.y + humanPlayer.dy;
            const interceptDist = Math.abs(nextX - playerNextX) + Math.abs(nextY - playerNextY);

            if (territory > 15 && interceptDist < 5) {
                score += 10;
            }

            const bestNextX = aiPlayer.x + best.dx;
            const bestNextY = aiPlayer.y + best.dy;
            const bestTerritory = this.floodFillSpace(bestNextX, bestNextY, 30);
            const bestDistToHuman = Math.abs(bestNextX - humanPlayer.x) + Math.abs(bestNextY - humanPlayer.y);
            const bestDistToCenter = Math.abs(bestNextX - centerX) + Math.abs(bestNextY - centerY);

            let bestScore = bestTerritory * 2;
            bestScore -= bestDistToCenter * 0.5;

            if (bestTerritory > 20) {
                bestScore -= bestDistToHuman * 2;
            } else {
                bestScore += bestDistToHuman;
            }

            const bestPlayerNextX = humanPlayer.x + humanPlayer.dx;
            const bestPlayerNextY = humanPlayer.y + humanPlayer.dy;
            const bestInterceptDist = Math.abs(bestNextX - bestPlayerNextX) + Math.abs(bestNextY - bestPlayerNextY);

            if (bestTerritory > 15 && bestInterceptDist < 5) {
                bestScore += 10;
            }

            return score > bestScore ? move : best;
        });
    }

    aiMove(aiPlayer, humanPlayer)
    {
        const safeMoves = this.getPossibleMoves(aiPlayer, humanPlayer);
        const move = this.aiChooseMove(aiPlayer, humanPlayer, safeMoves);
        aiPlayer.dx = move.dx;
        aiPlayer.dy = move.dy;
    }

    movePlayers()
    {
        for (const player of this.players) {
            if (player.alive) {
                player.x += player.dx;
                player.y += player.dy;
            }
        }
    }

    checkCollisions()
    {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (!player.alive) continue;

            const posKey = `${player.x},${player.y}`;

            if (player.x <= 0 || player.x >= this.gridWidth - 1 ||
                player.y <= 0 || player.y >= this.gridHeight - 1) {
                return i;
            }

            for (const otherPlayer of this.players) {
                if (otherPlayer.trail.has(posKey)) {
                    return i;
                }
            }
        }

        return null;
    }

    updateTrails()
    {
        for (const player of this.players) {
            if (player.alive) {
                player.trail.add(`${player.x},${player.y}`);
            }
        }
    }

    awardPoints(crashedPlayerIndex)
    {
        for (let i = 0; i < this.players.length; i++) {
            if (i !== crashedPlayerIndex) {
                this.players[i].score++;
            }
        }
    }

    draw()
    {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.ctx.fillStyle = '#ffffff';
        for (let x = 0; x < this.gridWidth; x++) {
            this.ctx.fillRect(x * this.cellSize, 0, this.cellSize, this.cellSize);
        }
        for (let x = 0; x < this.gridWidth; x++) {
            this.ctx.fillRect(x * this.cellSize, (this.gridHeight - 1) * this.cellSize, this.cellSize, this.cellSize);
        }
        for (let y = 0; y < this.gridHeight; y++) {
            this.ctx.fillRect(0, y * this.cellSize, this.cellSize, this.cellSize);
        }
        for (let y = 0; y < this.gridHeight; y++) {
            this.ctx.fillRect((this.gridWidth - 1) * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
        for (const player of this.players) {
            this.ctx.fillStyle = player.color;
            for (const posKey of player.trail) {
                const [x, y] = posKey.split(',').map(Number);
                this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }
        for (const player of this.players) {
            if (player.alive) {
                this.ctx.fillStyle = player.color;
                this.ctx.fillRect(player.x * this.cellSize, player.y * this.cellSize, this.cellSize, this.cellSize);
                this.ctx.shadowColor = player.color;
                this.ctx.shadowBlur = 10;
                this.ctx.fillRect(player.x * this.cellSize, player.y * this.cellSize, this.cellSize, this.cellSize);
                this.ctx.shadowBlur = 0;
            }
        }
    }

    updateScoreDisplay()
    {
        const player1Score = document.getElementById('player1-score');
        const player2Score = document.getElementById('player2-score');
        if (player1Score && player2Score && this.players.length >= 2) {
            player1Score.textContent = `Player 1: ${this.players[0].score}`;
            player2Score.textContent = `Player 2: ${this.players[1].score}`;
        }
    }

    gameLoop()
    {
        if (!this.gameRunning || this.gamePaused) return;
        this.movePlayers();
        const crashedPlayerIndex = this.checkCollisions();
        if (crashedPlayerIndex !== null) {
            this.awardPoints(crashedPlayerIndex);
            this.resetPlayers(this.players);
            this.updateScoreDisplay();
            return;
        }
        this.updateTrails();
        if (this.gameMode === 'ai' && this.players.length > 1 && this.players[1].alive) {
            this.aiMove(this.players[1], this.players[0]);
        }
        this.draw();
    }

    startGame()
    {
        this.gameMode = 'ai';
        this.numPlayers = 2;

        const mainMenu = document.getElementById('mainMenu');
        const aiMenu = document.getElementById('aiMenu');
        const keyConfig = document.getElementById('keyConfig');
        const gameArea = document.getElementById('gameArea');

        if (!mainMenu || !gameArea) {
            console.error('Required DOM elements not found');
            return;
        }

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.gameWidth;
        this.canvas.height = this.gameHeight;
        this.resetPlayers();

        mainMenu.style.display = 'none';
        if (aiMenu) aiMenu.style.display = 'none';
        if (keyConfig) keyConfig.style.display = 'none';
        gameArea.style.display = 'block';

        this.gameRunning = true;
        this.gamePaused = false;
        this.updateScoreDisplay();
        this.draw();

        this.initMobileControls();

        this.canvas.focus();
        this.canvas.tabIndex = 0;

        setTimeout(() => {
            if (this.gameRunning) {
                this.gameInterval = setInterval(() => {
                    this.gameLoop();
                }, this.gameSpeed);
            }
        }, 1000);
    }

    togglePause()
    {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        const gameStatus = document.getElementById('game-status');

        if (this.gamePaused) {
            if (pauseOverlay) pauseOverlay.style.display = 'block';
            if (gameStatus) gameStatus.textContent = 'PAUSE';
        } else {
            if (pauseOverlay) pauseOverlay.style.display = 'none';
            if (gameStatus) gameStatus.textContent = 'En cours...';
        }
    }

    quitGame()
    {
        this.gameRunning = false;
        this.gamePaused = false;

        if (this.gameInterval) {
            clearInterval(this.gameInterval);
            this.gameInterval = null;
        }

        const gameArea = document.getElementById('tron-game');
        const pauseOverlay = document.getElementById('pause-overlay');
        const mainMenu = document.getElementById('tron-menu');

        if (gameArea) gameArea.style.display = 'none';
        if (pauseOverlay) pauseOverlay.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'block';
    }
}

let tronGame = null;

function showControls()
{
    document.getElementById('tron-menu').style.display = 'none';
    document.getElementById('controls-info').style.display = 'block';
    document.getElementById('tron-game').style.display = 'none';
}

function hideControls()
{
    document.getElementById('tron-menu').style.display = 'block';
    document.getElementById('controls-info').style.display = 'none';
}

function showMenu()
{
    document.getElementById('tron-menu').style.display = 'block';
    document.getElementById('tron-game').style.display = 'none';
    document.getElementById('controls-info').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
}

function startSinglePlayer()
{
    if (!tronGame) tronGame = new TronGame();
    tronGame.gameMode = 'ai';
    tronGame.numPlayers = 2;
    startGame();
}

function startMultiplayer()
{
    if (!tronGame) tronGame = new TronGame();
    tronGame.gameMode = 'multiplayer';
    tronGame.numPlayers = 2;
    startGame();
}

function startGame()
{
    document.getElementById('tron-menu').style.display = 'none';
    document.getElementById('tron-game').style.display = 'block';
    if (!tronGame.canvas) {
        tronGame.canvas = document.getElementById('gameCanvas');
        tronGame.ctx = tronGame.canvas.getContext('2d');
        tronGame.canvas.width = tronGame.gameWidth;
        tronGame.canvas.height = tronGame.gameHeight;
    }
    tronGame.resetPlayers();
    tronGame.gameRunning = true;
    tronGame.gamePaused = false;
    tronGame.draw();

    if (tronGame.gameInterval)
        clearInterval(tronGame.gameInterval);
    tronGame.gameInterval = setInterval(() => {
        tronGame.gameLoop();
    }, tronGame.gameSpeed);
}

function pauseGame()
{
    if (tronGame) tronGame.togglePause();
}

function resumeGame()
{
    if (tronGame) tronGame.togglePause();
}

function resetGame()
{
    if (tronGame) {
        tronGame.resetPlayers();
        tronGame.gameRunning = true;
        tronGame.gamePaused = false;
        if (tronGame.gameInterval) {
            clearInterval(tronGame.gameInterval);
        }
        tronGame.gameInterval = setInterval(() => {
            tronGame.gameLoop();
        }, tronGame.gameSpeed);
    }
}

document.addEventListener('DOMContentLoaded', function()
{
    tronGame = new TronGame();

    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
        setInterval(() => {
            if (tronGame.gameRunning) {
                if (tronGame.gamePaused) {
                    gameStatus.textContent = 'Pause';
                } else {
                    gameStatus.textContent = 'En cours...';
                }
            } else {
                gameStatus.textContent = 'Game Over';
            }
        }, 100);
    }
});
