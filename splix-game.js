const menu = document.getElementById('splix-menu');
const canvas = document.getElementById('splix-canvas');
const scoreDiv = document.getElementById('splix-score');
const ctx = canvas.getContext('2d');

let gameState = 'menu';
let menuStack = [];
let menuOptions = {
    root: {
        title: 'Jouer',
        options: [
            { label: 'Solo', next: 'solo' },
            { label: 'Multi', next: 'multi' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    solo: {
        title: 'Solo',
        options: [
            { label: 'Classic', next: 'solo_classic' },
            { label: 'Arena', next: 'solo_arena' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    solo_classic: {
        title: 'Classic',
        options: [
            { label: 'Power-up ?', next: 'solo_classic_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    solo_classic_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(1, 'classic', true) },
            { label: 'Non', action: () => startGame(1, 'classic', false) },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    solo_arena: {
        title: 'Arena',
        options: [
            { label: 'Power-up ?', next: 'solo_arena_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    solo_arena_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(1, 'arena', true) },
            { label: 'Non', action: () => startGame(1, 'arena', false) },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi: {
        title: 'Multi',
        options: [
            { label: '2 joueurs', next: 'multi_2' },
            { label: '3 joueurs', next: 'multi_3' },
            { label: '4 joueurs', next: 'multi_4' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_2: {
        title: '2 joueurs',
        options: [
            { label: 'Classic', next: 'multi_2_classic' },
            { label: 'Arena', next: 'multi_2_arena' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_2_classic: {
        title: 'Classic',
        options: [
            { label: 'Power-up ?', next: 'multi_2_classic_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_2_classic_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(2, 'classic', true) },
            { label: 'Non', action: () => startGame(2, 'classic', false) },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_2_arena: {
        title: 'Arena',
        options: [
            { label: 'Power-up ?', next: 'multi_2_arena_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_2_arena_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(2, 'arena', true) },
            { label: 'Non', action: () => startGame(2, 'arena', false) },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_3: {
        title: '3 joueurs',
        options: [
            { label: 'Classic', next: 'multi_3_classic' },
            { label: 'Arena', next: 'multi_3_arena' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_3_classic: {
        title: 'Classic',
        options: [
            { label: 'Power-up ?', next: 'multi_3_classic_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_3_classic_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(3, 'classic', true) },
            { label: 'Non', action: () => startGame(3, 'classic', false) },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_3_arena: {
        title: 'Arena',
        options: [
            { label: 'Power-up ?', next: 'multi_3_arena_powerup' },
            { label: 'Retour aux projets', action: () => window.location.href = 'projets.html' }
        ]
    },
    multi_3_arena_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(3, 'arena', true) },
            { label: 'Non', action: () => startGame(3, 'arena', false) }
        ]
    },
    multi_4_classic_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(4, 'classic', true) },
            { label: 'Non', action: () => startGame(4, 'classic', false) }
        ]
    },
    multi_4_arena: {
        title: 'Arena',
        options: [
            { label: 'Power-up ?', next: 'multi_4_arena_powerup' }
        ]
    },
    multi_4_arena_powerup: {
        title: 'Power-up ?',
        options: [
            { label: 'Oui', action: () => startGame(4, 'arena', true) },
            { label: 'Non', action: () => startGame(4, 'arena', false) }
        ]
    }
};

function showMenu(menuKey) {
    menu.innerHTML = '';
    menu.classList.add('fade-in');
    setTimeout(() => menu.classList.remove('fade-in'), 300);
    menu.classList.add('splix-menu-animated');
    const m = menuOptions[menuKey];
    const title = document.createElement('h2');
    title.textContent = m.title;
    menu.appendChild(title);
    m.options.forEach(opt => {
        if (opt.label && opt.label.toLowerCase().includes('power-up')) {
            // Affiche la question + boutons Oui/Non
            const question = document.createElement('div');
            question.textContent = 'Power-up ?';
            question.style.marginBottom = '16px';
            question.style.fontWeight = 'bold';
            menu.appendChild(question);
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '16px';
            [
                { label: 'Oui', action: opt.next ? () => { let next = menuOptions[opt.next]; next.options[0].action(); } : () => startGame(numPlayers, currentMode, true) },
                { label: 'Non', action: opt.next ? () => { let next = menuOptions[opt.next]; next.options[1].action(); } : () => startGame(numPlayers, currentMode, false) }
            ].forEach(ans => {
                const btn = document.createElement('button');
                btn.textContent = ans.label;
                btn.className = 'splix-menu-btn';
                btn.onclick = () => {
                    menu.style.display = 'none';
                    gameState = 'playing';
                    ans.action();
                };
                btnGroup.appendChild(btn);
            });
            menu.appendChild(btnGroup);
        } else if (opt.type === 'question') {
            // Question personnalisée
            const question = document.createElement('div');
            question.textContent = opt.question;
            question.style.marginBottom = '16px';
            question.style.fontWeight = 'bold';
            menu.appendChild(question);
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = '16px';
            opt.answers.forEach(ans => {
                const btn = document.createElement('button');
                btn.textContent = ans.label;
                btn.className = 'splix-menu-btn';
                btn.onclick = () => {
                    menu.style.display = 'none';
                    gameState = 'playing';
                    ans.action();
                };
                btnGroup.appendChild(btn);
            });
            menu.appendChild(btnGroup);
        } else {
            const btn = document.createElement('button');
            btn.textContent = opt.label;
            btn.className = 'splix-menu-btn';
            btn.onclick = () => {
                if (opt.next) {
                    menuStack.push(menuKey);
                    showMenu(opt.next);
                } else if (opt.action) {
                    menu.style.display = 'none';
                    gameState = 'playing';
                    opt.action();
                }
            };
            menu.appendChild(btn);
        }
    });
    if (menuStack.length > 0) {
        const backBtn = document.createElement('button');
        backBtn.textContent = 'Retour';
        backBtn.className = 'splix-menu-btn back';
        backBtn.onclick = () => {
            showMenu(menuStack.pop());
        };
        menu.appendChild(backBtn);
    }
}

// --- Moteur du jeu ---
// Paramètres de la grille
const GRID_SIZE = 20;
const TICK_INTERVAL = 120; // ms, pour ralentir le jeu
const MAP_W = 40;
const MAP_H = 30;
let map = [];
let players = [];
let obstacles = [];
let powerUps = [];
let currentMode = 'classic';
let withPowerUps = false;
let numPlayers = 1;
let gameOver = false;
let killedBy = null;

// Couleurs cyberpunk
const PLAYER_COLORS = ['#00fff7', '#ff00c8', '#fffb00', '#00ff4c'];
const OBSTACLE_COLOR = '#2d2d2d';
const POWERUP_COLOR = '#ff6f00';

// Contrôles clavier
const CONTROLS = [
    { up: 'z', left: 'q', down: 's', right: 'd' }, // Joueur 1
    { up: 'ArrowUp', left: 'ArrowLeft', down: 'ArrowDown', right: 'ArrowRight' }, // Joueur 2
    { up: 'i', left: 'j', down: 'k', right: 'l' }, // Joueur 3
    { up: 't', left: 'f', down: 'g', right: 'h' }  // Joueur 4
];

function startGame(playersCount, mode, powerups) {
    numPlayers = playersCount;
    currentMode = mode;
    withPowerUps = powerups;
    gameOver = false;
    killedBy = null;
    map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(-1));
    obstacles = [];
    powerUps = [];
    // Initialisation des joueurs dans les coins avec direction adaptée
    const positions = [
        { x: 0, y: 0, dir: 'right' },           // Haut gauche
        { x: MAP_W - 1, y: MAP_H - 1, dir: 'left' }, // Bas droite
        { x: 0, y: MAP_H - 1, dir: 'right' },   // Bas gauche
        { x: MAP_W - 1, y: 0, dir: 'left' }     // Haut droite
    ];
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        let pos = positions[i];
        players.push({
            x: pos.x,
            y: pos.y,
            dir: pos.dir,
            color: PLAYER_COLORS[i],
            alive: true,
            score: 1,
            speed: 1,
            size: 1
        });
        map[pos.y][pos.x] = i;
    }
    // Obstacles pour mode Arena
    if (mode === 'arena') {
        for (let i = 10; i < 30; i += 4) {
            obstacles.push({ x: i, y: 15 });
            map[15][i] = -2;
        }
        for (let i = 5; i < 25; i += 5) {
            obstacles.push({ x: 20, y: i });
            map[i][20] = -2;
        }
    }
    // Power-ups
    if (powerups) {
        for (let i = 0; i < 5; i++) {
            let px = Math.floor(Math.random() * MAP_W);
            let py = Math.floor(Math.random() * MAP_H);
            if (map[py][px] === -1) {
                powerUps.push({ x: px, y: py, type: Math.random() > 0.5 ? 'speed' : 'size' });
                map[py][px] = -3;
            }
        }
    }
    resizeCanvas();
    window.requestAnimationFrame(gameLoop);
}

// --- Gestion des entrées clavier ---
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    players.forEach((p, idx) => {
        if (!p.alive) return;
        const c = CONTROLS[idx];
        if (e.key === c.up && p.dir !== 'down') p.dir = 'up';
        if (e.key === c.down && p.dir !== 'up') p.dir = 'down';
        if (e.key === c.left && p.dir !== 'right') p.dir = 'left';
        if (e.key === c.right && p.dir !== 'left') p.dir = 'right';
    });
});

// --- Boucle de jeu ---
function gameLoop() {
    if (gameOver) return;
    const now = Date.now();
    if (!gameLoop.lastTick || now - gameLoop.lastTick > TICK_INTERVAL) {
        updateGame();
        gameLoop.lastTick = now;
    }
    renderGame();
    window.requestAnimationFrame(gameLoop);
}

// --- Moteur de mise à jour ---
function updateGame() {
    players.forEach((p, idx) => {
        if (!p.alive) return;
        let dx = 0, dy = 0;
        if (p.dir === 'up') dy = -1;
        if (p.dir === 'down') dy = 1;
        if (p.dir === 'left') dx = -1;
        if (p.dir === 'right') dx = 1;
        let nx = p.x + dx * p.speed;
        let ny = p.y + dy * p.speed;
        // Collision bordure
        if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) {
            p.alive = false;
            killedBy = 'border';
            checkGameOver(idx);
            return;
        }
        // Collision obstacle
        if (map[ny][nx] === -2) {
            p.alive = false;
            killedBy = 'obstacle';
            checkGameOver(idx);
            return;
        }
        // Collision joueur
        if (map[ny][nx] >= 0) {
            p.alive = false;
            killedBy = map[ny][nx];
            checkGameOver(idx);
            return;
        }
        // Power-up
        if (map[ny][nx] === -3) {
            let pu = powerUps.find(pp => pp.x === nx && pp.y === ny);
            if (pu) {
                if (pu.type === 'speed') p.speed = 2;
                if (pu.type === 'size') p.size = 2;
                setTimeout(() => { p.speed = 1; p.size = 1; }, 3000);
                powerUps = powerUps.filter(pp => !(pp.x === nx && pp.y === ny));
                map[ny][nx] = idx;
            }
        }
        // Capture case
        p.x = nx;
        p.y = ny;
        map[ny][nx] = idx;
        p.score++;
    });
}

function checkGameOver(deadIdx) {
    if (players.filter(p => p.alive).length <= 1) {
        gameOver = true;
        showScore(deadIdx);
    }
}

// --- Rendu Canvas ---
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Grille
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            if (map[y][x] >= 0) {
                ctx.fillStyle = PLAYER_COLORS[map[y][x]];
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            } else if (map[y][x] === -2) {
                ctx.fillStyle = OBSTACLE_COLOR;
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            } else if (map[y][x] === -3) {
                ctx.fillStyle = POWERUP_COLOR;
                ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
            }
        }
    }
    // Joueurs
    players.forEach((p, idx) => {
        if (!p.alive) return;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x * GRID_SIZE, p.y * GRID_SIZE, GRID_SIZE * p.size, GRID_SIZE * p.size);
    });
}

// --- Affichage Score ---
function showScore(deadIdx) {
    scoreDiv.innerHTML = '<h2>Scores</h2>';
    players.forEach((p, idx) => {
        let status = p.alive ? 'Vivant' : (killedBy === 'border' ? 'Tué par la bordure' : (killedBy === 'obstacle' ? 'Tué par obstacle' : `Tué par Joueur ${killedBy + 1}`));
        scoreDiv.innerHTML += `<div class="splix-score-line" style="color:${PLAYER_COLORS[idx]}">Joueur ${idx + 1} : ${p.score} cases - ${status}</div>`;
    });
    scoreDiv.innerHTML += '<button class="splix-menu-btn" onclick="restartGame()">Restart</button>';
    scoreDiv.innerHTML += '<button class="splix-menu-btn" onclick="backToMenu()">Menu</button>';
    scoreDiv.style.display = 'block';
}

function restartGame() {
    scoreDiv.style.display = 'none';
    showMenu('root');
    menu.style.display = 'block';
    gameState = 'menu';
}
function backToMenu() {
    scoreDiv.style.display = 'none';
    showMenu('root');
    menu.style.display = 'block';
    gameState = 'menu';
}

// --- Responsive Canvas ---
function resizeCanvas() {
    let w, h;
    if (currentMode === 'classic') {
        w = window.innerWidth;
        h = window.innerHeight - 60; // header/footer
        canvas.width = Math.min(w, MAP_W * GRID_SIZE);
        canvas.height = Math.min(h, MAP_H * GRID_SIZE);
    } else {
        w = window.innerWidth * 0.8;
        h = window.innerHeight * 0.7;
        canvas.width = Math.min(w, MAP_W * GRID_SIZE);
        canvas.height = Math.min(h, MAP_H * GRID_SIZE);
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Initialisation ---
showMenu('root');
