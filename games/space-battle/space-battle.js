class SpaceBattle {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        
        this.config = {
            canvasWidth: 800,
            canvasHeight: 600,
            shipSize: 20,
            bulletSpeed: 5,
            shipSpeed: 3,
            maxAmmo: 20,
            maxHealth: 100
        };
        
        this.localPlayer = {
            id: this.generateId(),
            name: '',
            x: 400,
            y: 300,
            angle: 0,
            health: this.config.maxHealth,
            ammo: this.config.maxAmmo,
            score: 0,
            lastShot: 0
        };
        
        this.players = new Map();
        this.bullets = [];
        this.particles = [];
        
        this.keys = {};
        this.setupControls();
        
        this.setupUI();
        
        this.peers = new Map();
        this.isHost = false;
        this.roomId = null;
        
        this.signaling = {
            url: 'wss://ws.postman-echo.com/raw',
            socket: null,
            connected: false
        };
        
        this.setupSignaling();
        this.gameLoop();
        this.createStars();
    }
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    setupSignaling() {
        try {
            this.connectToRoom();
        } catch (error) {
            console.log('Local mode activated');
            this.setupLocalMode();
        }
    }
    
    setupLocalMode() {
        document.getElementById('status').textContent = 'Local Mode (Demo)';
        document.getElementById('status').classList.add('connected');
        this.addBot('Bot Alpha', 100, 100);
        this.addBot('Bot Beta', 700, 100);
        this.addBot('Bot Gamma', 100, 500);
    }
    
    addBot(name, x, y) {
        const bot = {
            id: this.generateId(),
            name: name,
            x: x,
            y: y,
            angle: Math.random() * Math.PI * 2,
            health: this.config.maxHealth,
            ammo: this.config.maxAmmo,
            score: 0,
            lastShot: 0,
            isBot: true,
            target: null,
            lastMove: 0
        };
        this.players.set(bot.id, bot);
        this.updatePlayersCount();
        this.updateLeaderboard();
    }
    
    connectToRoom() {
        setTimeout(() => {
            document.getElementById('status').textContent = 'Connected (Demo)';
            document.getElementById('status').classList.add('connected');
            this.addSystemMessage('Connection established in demo mode');
        }, 1000);
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    setupUI() {
        const joinBtn = document.getElementById('joinBtn');
        const playerNameInput = document.getElementById('playerName');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        
        joinBtn.addEventListener('click', () => {
            const name = playerNameInput.value.trim();
            if (name) {
                this.localPlayer.name = name;
                this.startGame();
            }
        });
        
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinBtn.click();
            }
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage(chatInput.value);
                chatInput.value = '';
            }
        });
        
        sendBtn.addEventListener('click', () => {
            this.sendChatMessage(chatInput.value);
            chatInput.value = '';
        });
    }
    
    startGame() {
        document.getElementById('menu').classList.add('hidden');
        this.gameState = 'playing';
        this.localPlayer.x = Math.random() * (this.config.canvasWidth - 100) + 50;
        this.localPlayer.y = Math.random() * (this.config.canvasHeight - 100) + 50;
        this.addSystemMessage(`${this.localPlayer.name} joined the battle!`);
        this.updatePlayersCount();
    }
    
    updatePlayersCount() {
        const count = this.players.size + (this.gameState === 'playing' ? 1 : 0);
        document.getElementById('players-count').textContent = `Players: ${count}`;
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.updateLocalPlayer();
        this.updateBots();
        this.updateBullets();
        this.updateParticles();
        this.checkCollisions();
        this.updateUI();
    }
    
    updateLocalPlayer() {
        let moved = false;
        
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.localPlayer.angle -= 0.1;
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.localPlayer.angle += 0.1;
            moved = true;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.localPlayer.x += Math.cos(this.localPlayer.angle) * this.config.shipSpeed;
            this.localPlayer.y += Math.sin(this.localPlayer.angle) * this.config.shipSpeed;
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.localPlayer.x -= Math.cos(this.localPlayer.angle) * this.config.shipSpeed;
            this.localPlayer.y -= Math.sin(this.localPlayer.angle) * this.config.shipSpeed;
            moved = true;
        }
        this.localPlayer.x = Math.max(20, Math.min(this.config.canvasWidth - 20, this.localPlayer.x));
        this.localPlayer.y = Math.max(20, Math.min(this.config.canvasHeight - 20, this.localPlayer.y));
        if (this.localPlayer.ammo < this.config.maxAmmo && Date.now() - this.localPlayer.lastShot > 2000) {
            this.localPlayer.ammo++;
        }
    }
    
    updateBots() {
        const now = Date.now();
        
        this.players.forEach((bot) => {
            if (!bot.isBot) return;
            if (now - bot.lastMove > 100) {
                let closestPlayer = this.localPlayer;
                let closestDistance = this.getDistance(bot, this.localPlayer);
                this.players.forEach((player) => {
                    if (player.id !== bot.id && !player.isBot) {
                        const distance = this.getDistance(bot, player);
                        if (distance < closestDistance) {
                            closestPlayer = player;
                            closestDistance = distance;
                        }
                    }
                });
                const angle = Math.atan2(closestPlayer.y - bot.y, closestPlayer.x - bot.x);
                bot.angle = angle;
                if (closestDistance > 100) {
                    bot.x += Math.cos(angle) * this.config.shipSpeed * 0.8;
                    bot.y += Math.sin(angle) * this.config.shipSpeed * 0.8;
                }
                bot.x = Math.max(20, Math.min(this.config.canvasWidth - 20, bot.x));
                bot.y = Math.max(20, Math.min(this.config.canvasHeight - 20, bot.y));
                if (closestDistance < 200 && bot.ammo > 0 && now - bot.lastShot > 1000) {
                    this.createBullet(bot);
                    bot.ammo--;
                    bot.lastShot = now;
                }
                if (bot.ammo < this.config.maxAmmo && now - bot.lastShot > 3000) {
                    bot.ammo++;
                }
                
                bot.lastMove = now;
            }
        });
    }
    
    shoot() {
        const now = Date.now();
        if (this.localPlayer.ammo > 0 && now - this.localPlayer.lastShot > 200) {
            this.createBullet(this.localPlayer);
            this.localPlayer.ammo--;
            this.localPlayer.lastShot = now;
        }
    }
    
    createBullet(player) {
        const bullet = {
            id: this.generateId(),
            playerId: player.id,
            x: player.x + Math.cos(player.angle) * 25,
            y: player.y + Math.sin(player.angle) * 25,
            vx: Math.cos(player.angle) * this.config.bulletSpeed,
            vy: Math.sin(player.angle) * this.config.bulletSpeed,
            life: 120
        };
        this.bullets.push(bullet);
    }
    
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || 
                bullet.x < 0 || bullet.x > this.config.canvasWidth ||
                bullet.y < 0 || bullet.y > this.config.canvasHeight) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.playerId !== this.localPlayer.id && 
                this.getDistance(bullet, this.localPlayer) < this.config.shipSize) {
                this.localPlayer.health -= 20;
                this.createExplosion(this.localPlayer.x, this.localPlayer.y);
                this.bullets.splice(i, 1);
                
                if (this.localPlayer.health <= 0) {
                    this.respawnPlayer(this.localPlayer);
                    this.addSystemMessage(`${this.localPlayer.name} was destroyed!`);
                }
                continue;
            }
            this.players.forEach((player) => {
                if (bullet.playerId !== player.id && 
                    this.getDistance(bullet, player) < this.config.shipSize) {
                    player.health -= 20;
                    this.createExplosion(player.x, player.y);
                    this.bullets.splice(i, 1);
                    if (player.health <= 0) {
                        if (bullet.playerId === this.localPlayer.id) {
                            this.localPlayer.score += 100;
                        }
                        this.respawnPlayer(player);
                        this.addSystemMessage(`${player.name} was destroyed!`);
                    }
                }
            });
        }
    }
    
    respawnPlayer(player) {
        player.health = this.config.maxHealth;
        player.ammo = this.config.maxAmmo;
        player.x = Math.random() * (this.config.canvasWidth - 100) + 50;
        player.y = Math.random() * (this.config.canvasHeight - 100) + 50;
        this.updateLeaderboard();
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`,
                alpha: 1
            });
        }
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render() {
        this.ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
        
        if (this.gameState !== 'playing') return;
        
        this.renderStars();
        this.renderPlayers();
        this.renderBullets();
        this.renderParticles();
        this.renderUI();
    }
    
    createStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.config.canvasWidth,
                y: Math.random() * this.config.canvasHeight,
                size: Math.random() * 2,
                alpha: Math.random()
            });
        }
    }
    
    renderStars() {
        this.ctx.save();
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.restore();
    }
    
    renderPlayers() {
        this.renderShip(this.localPlayer, '#00d4ff');
        this.players.forEach((player) => {
            const color = player.isBot ? '#ff6b6b' : '#4ecdc4';
            this.renderShip(player, color);
        });
    }
    
    renderShip(player, color) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);
        this.ctx.rotate(player.angle);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.restore();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Orbitron';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, player.x, player.y - 25);
        const barWidth = 30;
        const barHeight = 4;
        const healthPercent = player.health / this.config.maxHealth;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(player.x - barWidth/2, player.y - 35, barWidth, barHeight);
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.2 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(player.x - barWidth/2, player.y - 35, barWidth * healthPercent, barHeight);
    }
    
    renderBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x - bullet.vx, bullet.y - bullet.vy, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }
    
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    renderUI() {
        const miniMapSize = 120;
        const miniMapX = this.config.canvasWidth - miniMapSize - 10;
        const miniMapY = 10;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        this.ctx.strokeStyle = '#00d4ff';
        this.ctx.strokeRect(miniMapX, miniMapY, miniMapSize, miniMapSize);
        
        const scaleX = miniMapSize / this.config.canvasWidth;
        const scaleY = miniMapSize / this.config.canvasHeight;
        
        this.ctx.fillStyle = '#00d4ff';
        this.ctx.beginPath();
        this.ctx.arc(
            miniMapX + this.localPlayer.x * scaleX,
            miniMapY + this.localPlayer.y * scaleY,
            3, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        this.players.forEach(player => {
            this.ctx.fillStyle = player.isBot ? '#ff6b6b' : '#4ecdc4';
            this.ctx.beginPath();
            this.ctx.arc(
                miniMapX + player.x * scaleX,
                miniMapY + player.y * scaleY,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
    }
    
    updateUI() {
        document.getElementById('health').textContent = this.localPlayer.health;
        document.getElementById('ammo').textContent = this.localPlayer.ammo;
        document.getElementById('score').textContent = this.localPlayer.score;
        this.updateLeaderboard();
    }
    
    updateLeaderboard() {
        const leaderboard = document.getElementById('leaderboard-list');
        const players = [this.localPlayer, ...Array.from(this.players.values())];
        players.sort((a, b) => b.score - a.score);
        
        leaderboard.innerHTML = players.map((player, index) => `
            <div class="leaderboard-item">
                <span>${index + 1}. ${player.name}</span>
                <span>${player.score}</span>
            </div>
        `).join('');
    }
    
    sendChatMessage(message) {
        if (!message.trim()) return;
        
        this.addChatMessage(this.localPlayer.name, message);
    }
    
    addChatMessage(playerName, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<strong>${playerName}:</strong> ${message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    addSystemMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system';
        messageDiv.innerHTML = `<em>${message}</em>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpaceBattle();
});
