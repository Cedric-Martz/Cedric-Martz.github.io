class SplixGame {
    constructor() {
        this.canvas = document.getElementById('splix-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = 600;
        this.canvas.height = 450;

        this.GRID_SIZE = 15;
        this.MAP_WIDTH = 40;
        this.MAP_HEIGHT = 30;

        this.players = [
            {
                id: 0,
                x: 5,
                y: 5,
                color: '#FF0000',
                trail: [],
                territory: new Set(),
                direction: { x: 0, y: 0 },
                controls: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }
            },
            {
                id: 1,
                x: this.MAP_WIDTH - 6,
                y: this.MAP_HEIGHT - 6,
                color: '#0000FF',
                trail: [],
                territory: new Set(),
                direction: { x: 0, y: 0 },
                controls: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }
            }
        ];

        this.map = Array(this.MAP_WIDTH * this.MAP_HEIGHT).fill(-1);
        this.initializeTerritory();
        this.gameLoop = null;
        this.gameRunning = false;
        this.initializeEventListeners();
        this.startGame();
    }

    initializeTerritory()
    {
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const index = y * this.MAP_WIDTH + x;
                this.map[index] = 0;
                this.players[0].territory.add(index);
            }
        }

        for (let x = this.MAP_WIDTH - 10; x < this.MAP_WIDTH; x++) {
            for (let y = this.MAP_HEIGHT - 10; y < this.MAP_HEIGHT; y++) {
                const index = y * this.MAP_WIDTH + x;
                this.map[index] = 1;
                this.players[1].territory.add(index);
            }
        }
    }

    initializeEventListeners()
    {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e)
    {
        if (!this.gameRunning) return;

        this.players.forEach(player => {
            const controls = player.controls;

            switch (e.code) {
                case controls.up:
                    if (player.direction.y !== 1) {
                        player.direction = { x: 0, y: -1 };
                    }
                    break;
                case controls.down:
                    if (player.direction.y !== -1) {
                        player.direction = { x: 0, y: 1 };
                    }
                    break;
                case controls.left:
                    if (player.direction.x !== 1) {
                        player.direction = { x: -1, y: 0 };
                    }
                    break;
                case controls.right:
                    if (player.direction.x !== -1) {
                        player.direction = { x: 1, y: 0 };
                    }
                    break;
            }
        });
    }

    startGame()
    {
        this.gameRunning = true;
        this.gameLoop = setInterval(() => this.update(), 100);
    }

    update()
    {
        this.players.forEach(player => this.updatePlayer(player));
        this.draw();
    }

    updatePlayer(player)
    {
        if (player.direction.x === 0 && player.direction.y === 0) return;

        const newX = player.x + player.direction.x;
        const newY = player.y + player.direction.y;

        if (newX < 0 || newX >= this.MAP_WIDTH || newY < 0 || newY >= this.MAP_HEIGHT) {
            this.gameOver(player);
            return;
        }

        const newIndex = newY * this.MAP_WIDTH + newX;

        if (this.map[newIndex] === player.id) {
            if (player.trail.length > 0) {
                this.captureTerritory(player);
            }
        } else {
            if (this.players.some(p => p.trail.includes(newIndex))) {
                this.gameOver(player);
                return;
            }
            const otherPlayer = this.players.find(p => p.id !== player.id);
            if (otherPlayer.territory.has(newIndex)) {
                this.gameOver(player);
                return;
            }
            player.trail.push(player.y * this.MAP_WIDTH + player.x);
        }

        player.x = newX;
        player.y = newY;
    }

    captureTerritory(player)
    {
        const fill = new Set();
        const visited = new Set(player.trail);

        player.trail.forEach(pos => {
            this.floodFill(pos % this.MAP_WIDTH, Math.floor(pos / this.MAP_WIDTH), fill, visited, player);
        });

        fill.forEach(pos => {
            this.map[pos] = player.id;
            player.territory.add(pos);
            const otherPlayer = this.players.find(p => p.id !== player.id);
            if (otherPlayer.territory.has(pos)) {
                otherPlayer.territory.delete(pos);
            }
        });

        player.trail = [];
    }

    floodFill(x, y, fill, visited, player)
    {
        if (x < 0 || x >= this.MAP_WIDTH || y < 0 || y >= this.MAP_HEIGHT) return;

        const pos = y * this.MAP_WIDTH + x;
        if (visited.has(pos))
            return;
        if (this.players.some(p => p.trail.includes(pos)))
            return;

        visited.add(pos);
        fill.add(pos);

        this.floodFill(x + 1, y, fill, visited, player);
        this.floodFill(x - 1, y, fill, visited, player);
        this.floodFill(x, y + 1, fill, visited, player);
        this.floodFill(x, y - 1, fill, visited, player);
    }

    gameOver(loser) {
        this.gameRunning = false;
        clearInterval(this.gameLoop);
        const winner = this.players.find(p => p.id !== loser.id);

        const totalCells = this.MAP_WIDTH * this.MAP_HEIGHT;
        const winnerScore = Math.round((winner.territory.size / totalCells) * 100);
        const loserScore = Math.round((loser.territory.size / totalCells) * 100);

        alert(`Player ${winner.id + 1} win !\nScore:\nPlayer 1: ${this.players[0].territory.size / totalCells * 100}%\nPlayer 2: ${this.players[1].territory.size / totalCells * 100}%`);
        setTimeout(() => this.resetGame(), 1000);
    }

    resetGame()
    {
        this.players[0].x = 5;
        this.players[0].y = 5;
        this.players[1].x = this.MAP_WIDTH - 6;
        this.players[1].y = this.MAP_HEIGHT - 6;

        this.players.forEach(player => {
            player.trail = [];
            player.territory = new Set();
            player.direction = { x: 0, y: 0 };
        });

        this.map = Array(this.MAP_WIDTH * this.MAP_HEIGHT).fill(-1);
        this.initializeTerritory();

        this.startGame();
    }

    draw()
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                const index = y * this.MAP_WIDTH + x;
                const cellValue = this.map[index];

                if (cellValue !== -1) {
                    this.ctx.fillStyle = this.players[cellValue].color + '80';
                    this.ctx.fillRect(
                        x * this.GRID_SIZE,
                        y * this.GRID_SIZE,
                        this.GRID_SIZE,
                        this.GRID_SIZE
                    );
                }
            }
        }

        this.players.forEach(player => {
            this.ctx.fillStyle = player.color;
            player.trail.forEach(pos => {
                const x = pos % this.MAP_WIDTH;
                const y = Math.floor(pos / this.MAP_WIDTH);
                this.ctx.fillRect(
                    x * this.GRID_SIZE,
                    y * this.GRID_SIZE,
                    this.GRID_SIZE,
                    this.GRID_SIZE
                );
            });
        });

        this.players.forEach(player => {
            this.ctx.fillStyle = player.color;
            this.ctx.fillRect(
                player.x * this.GRID_SIZE,
                player.y * this.GRID_SIZE,
                this.GRID_SIZE,
                this.GRID_SIZE
            );
        });
    }
}

window.addEventListener('load', () => {
    new SplixGame();
});