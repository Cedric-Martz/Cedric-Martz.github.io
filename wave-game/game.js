// ============================================
// CONFIGURATION ET VARIABLES GLOBALES
// ============================================

const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

let gameState = 'menu'; // 'menu', 'playing', 'waveBreak', 'gameOver'
let language = 'en'; // 'en' ou 'fr'
let currentWave = 1;
let gameScore = 0;

// Stratagème Sequences
const STRATAGEM_SEQUENCES = {
    'zone-strike': {
        name: 'Zone Strike',
        nameFr: 'Frappe Zône',
        sequence: ['up', 'down', 'left', 'right'],
        color: '#ff00ff'
    },
    'precision-strike': {
        name: 'Precision Strike',
        nameFr: 'Frappe Précise',
        sequence: ['up', 'up', 'down', 'down'],
        color: '#ff0000'
    },
    'air-support': {
        name: 'Air Support',
        nameFr: 'Support Aérien',
        sequence: ['down', 'right', 'down', 'right'],
        color: '#0000ff'
    },
    'ammo': {
        name: 'Ammo Supply',
        nameFr: 'Munitions',
        sequence: ['left', 'up', 'right', 'right'],
        color: '#ffff00'
    },
    'flamethrower': {
        name: 'Flamethrower',
        nameFr: 'Lance-flamme',
        sequence: ['up', 'right', 'up', 'left'],
        color: '#ff6600'
    },
    'minigun': {
        name: 'Minigun',
        nameFr: 'Minigun',
        sequence: ['right', 'up', 'left', 'down'],
        color: '#ffff00'
    }
};

// Touches configurables
let CONTROL_KEYS = {
    'moveUp': 'z',
    'moveDown': 's',
    'moveLeft': 'q',
    'moveRight': 'd',
    'grenade': 'g',
    'superWeapon': 'a',
    'dropWeapon': 'f',
    'reload': 'r'
};

const TEXTS = {
    en: {
        title: 'WAVE SURVIVOR',
        play: 'Play',
        rules: 'Rules',
        controls: 'Controls',
        rulesTitle: 'Rules',
        controlsTitle: 'Controls',
        rules1: 'Survive enemy waves',
        rules2: 'Collect stratagem drops (crates)',
        rules3: 'Use stratagems to eliminate enemies',
        rules4: 'Manage your super weapons wisely',
        moveLabel: 'Move (ZQSD/Arrows)',
        shootLabel: 'Shoot (Left Click)',
        grenadeLabel: 'Grenade (G)',
        superWeaponLabel: 'Super Weapon (Q)',
        dropWeaponLabel: 'Drop Weapon (F)',
        fullscreenLabel: 'Fullscreen (ESC)',
        gameOverTitle: 'Mission Failed',
        waveInfo: 'Wave',
        enemyCount: 'Enemies',
        strategemTitle: 'Active Stratagems',
        rifle: 'Rifle',
        flamethrower: 'Flamethrower',
        minigun: 'Minigun',
        stratagemConfigTitle: 'Controls',
        grenadePreview: 'Grenade Preview'
    },
    fr: {
        title: 'WAVE SURVIVOR',
        play: 'Jouer',
        rules: 'Règles',
        controls: 'Touches',
        rulesTitle: 'Règles',
        controlsTitle: 'Touches',
        rules1: 'Survive les vagues d\'ennemis',
        rules2: 'Collecte les caisses de stratagèmes',
        rules3: 'Utilise les stratagèmes pour éliminer les ennemis',
        rules4: 'Gère tes super armes avec sagesse',
        moveLabel: 'Déplacer (ZQSD/Flèches)',
        shootLabel: 'Tirer (Clic Gauche)',
        grenadeLabel: 'Grenade (G)',
        superWeaponLabel: 'Super Arme (Q)',
        dropWeaponLabel: 'Lâcher Arme (F)',
        fullscreenLabel: 'Plein écran (ESC)',
        gameOverTitle: 'Mission Échouée',
        waveInfo: 'Vague',
        enemyCount: 'Ennemis',
        strategemTitle: 'Stratagèmes Actifs',
        rifle: 'Fusil',
        flamethrower: 'Lance-flamme',
        minigun: 'Minigun',
        stratagemConfigTitle: 'Contrôles',
        grenadePreview: 'Aperçu Grenade'
    }
};

function t(key) {
    return TEXTS[language][key] || key;
}

// Canvas et contexte
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ============================================
// CLASSES
// ============================================

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    multiply(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y);
        if (len === 0) return new Vector2(0, 0);
        return new Vector2(this.x / len, this.y / len);
    }

    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }
}

class Player {
    constructor() {
        this.position = new Vector2(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.velocity = new Vector2(0, 0);
        this.speed = 5;
        this.size = 15;
        this.maxHealth = 100;
        this.health = 100;
        this.maxAmmo = 120;
        this.ammo = 120;
        this.ammoPerMag = 30;
        this.currentMag = 30;
        this.direction = 0;

        // Armes
        this.primaryWeapon = 'rifle';
        this.superWeapon = null; // null, 'flamethrower', 'minigun'
        this.superWeaponAmmo = 0;
        this.superWeaponMaxAmmo = 100;

        // Grenades
        this.grenadeAmmo = 3;
        this.grenadeMaxAmmo = 3;
        this.grenadeSize = 8;
        this.grenadeExplosionRadius = 120;

        // État
        this.isMoving = false;
        this.aimPosition = new Vector2(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.showGrenadePreview = false;
        this.grenadeTrajectory = [];

        // Historique des mouvements pour les stratagèmes
        this.movementHistory = [];
        this.lastMovement = null;
        this.lastFireTime = 0; // Pour limiter la cadence de tir
    }

    update(keys, mouse) {
        // Mouvement
        this.velocity = new Vector2(0, 0);
        let currentMovement = null;

        if (keys[CONTROL_KEYS['moveUp']] || keys['ArrowUp']) {
            this.velocity.y -= this.speed;
            currentMovement = 'up';
        }
        if (keys[CONTROL_KEYS['moveDown']] || keys['ArrowDown']) {
            this.velocity.y += this.speed;
            currentMovement = 'down';
        }
        if (keys[CONTROL_KEYS['moveLeft']] || keys['ArrowLeft']) {
            this.velocity.x -= this.speed;
            currentMovement = 'left';
        }
        if (keys[CONTROL_KEYS['moveRight']] || keys['ArrowRight']) {
            this.velocity.x += this.speed;
            currentMovement = 'right';
        }

        // Enregistrer le mouvement s'il a changé
        if (currentMovement && currentMovement !== this.lastMovement) {
            this.movementHistory.push(currentMovement);
            this.lastMovement = currentMovement;
            // Garder seulement les 6 derniers mouvements
            if (this.movementHistory.length > 6) {
                this.movementHistory.shift();
            }
        } else if (!currentMovement) {
            this.lastMovement = null;
        }

        // Ralentissement si super arme équipée
        if (this.superWeapon) {
            this.velocity = this.velocity.multiply(0.6);
        }

        this.position = this.position.add(this.velocity);

        // Limites du canvas
        this.position.x = Math.max(this.size, Math.min(GAME_WIDTH - this.size, this.position.x));
        this.position.y = Math.max(this.size, Math.min(GAME_HEIGHT - this.size, this.position.y));

        // Direction vers la souris
        this.aimPosition = new Vector2(mouse.x, mouse.y);
        this.direction = this.position.subtract(this.aimPosition).angle();
    }

    shoot(projectiles, gameTime) {
        if (this.currentMag > 0 && gameTime - this.lastFireTime >= 12) {
            const direction = this.aimPosition.subtract(this.position).normalize();
            const projectile = new Projectile(
                this.position.add(direction.multiply(20)),
                direction.multiply(7),
                5,
                20
            );
            projectiles.push(projectile);
            this.currentMag--;
            this.lastFireTime = gameTime;
            playSound('shoot');
        }
    }

    reload() {
        const needed = this.ammoPerMag - this.currentMag;
        const available = Math.min(needed, this.ammo);
        this.currentMag += available;
        this.ammo -= available;
    }

    throwGrenade(projectiles) {
        if (this.grenadeAmmo > 0 && !this.showGrenadePreview) {
            const direction = this.aimPosition.subtract(this.position).normalize();
            const grenade = new Grenade(
                this.position.add(direction.multiply(20)),
                direction.multiply(6),
                this.grenadeSize,
                this.grenadeExplosionRadius
            );
            projectiles.push(grenade);
            this.grenadeAmmo--;
            playSound('shoot');
            this.showGrenadePreview = false;
        }
    }

    updateGrenadePreview() {
        if (!this.showGrenadePreview) return;

        const direction = this.aimPosition.subtract(this.position).normalize();
        const startPos = this.position.add(direction.multiply(20));
        const startVel = direction.multiply(6);

        this.grenadeTrajectory = [];
        let pos = new Vector2(startPos.x, startPos.y);
        let vel = new Vector2(startVel.x, startVel.y);

        // Simuler la trajectoire
        for (let i = 0; i < 50; i++) {
            this.grenadeTrajectory.push(new Vector2(pos.x, pos.y));
            pos = pos.add(vel);
            vel.y += 0.3; // Gravité
        }
    }

    toggleGrenadePreview() {
        if (this.grenadeAmmo > 0) {
            this.showGrenadePreview = !this.showGrenadePreview;
        }
    }

    useSuperWeapon(projectiles, time) {
        if (!this.superWeapon || this.superWeaponAmmo <= 0) return;

        if (this.superWeapon === 'flamethrower') {
            const direction = this.aimPosition.subtract(this.position).normalize();
            const projectile = new FlamethrowerProjectile(
                this.position.add(direction.multiply(30)),
                direction.multiply(4),
                15,
                direction
            );
            projectiles.push(projectile);
            this.superWeaponAmmo--;
            if (this.superWeaponAmmo <= 0) {
                this.superWeapon = null;
                playSound('drop');
            }
        } else if (this.superWeapon === 'minigun') {
            // Minigun tire très rapidement - une balle par frame
            const direction = this.aimPosition.subtract(this.position).normalize();
            // Légère variation d'angle pour effet de dispersion
            const randomAngle = (Math.random() - 0.5) * 0.3;
            const spreadDir = new Vector2(
                direction.x * Math.cos(randomAngle) - direction.y * Math.sin(randomAngle),
                direction.x * Math.sin(randomAngle) + direction.y * Math.cos(randomAngle)
            );
            const projectile = new Projectile(
                this.position.add(direction.multiply(20)),
                spreadDir.multiply(8),
                3,
                12
            );
            projectiles.push(projectile);
            this.superWeaponAmmo--;
            if (this.superWeaponAmmo <= 0) {
                this.superWeapon = null;
                playSound('drop');
            }
        }
    }

    dropSuperWeapon() {
        if (this.superWeapon) {
            this.superWeapon = null;
            this.superWeaponAmmo = 0;
            playSound('drop');
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addAmmo(amount) {
        this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
    }

    draw(ctx) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.position.x - this.size, this.position.y - this.size, this.size * 2, this.size * 2);

        // Direction du tir
        const aimDir = this.aimPosition.subtract(this.position).normalize();
        ctx.strokeStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(
            this.position.x + aimDir.x * 30,
            this.position.y + aimDir.y * 30
        );
        ctx.stroke();

        // Preview grenade
        if (this.showGrenadePreview && this.grenadeTrajectory.length > 0) {
            // Trajectoire
            ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.grenadeTrajectory[0].x, this.grenadeTrajectory[0].y);
            for (let i = 1; i < this.grenadeTrajectory.length; i++) {
                ctx.lineTo(this.grenadeTrajectory[i].x, this.grenadeTrajectory[i].y);
            }
            ctx.stroke();

            // Zone d'explosion
            const lastPos = this.grenadeTrajectory[this.grenadeTrajectory.length - 1];
            ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(lastPos.x, lastPos.y, this.grenadeExplosionRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Indicateur super arme
        if (this.superWeapon) {
            ctx.fillStyle = this.superWeapon === 'flamethrower' ? '#ff6600' : '#ffff00';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y - 25, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Enemy {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.size = 12;
        this.maxHealth = 30;
        this.health = 30;
        this.speed = 2;
        this.target = null;
        this.burnTime = 0;
    }

    update(player) {
        // Chasser le joueur
        if (player) {
            const direction = player.position.subtract(this.position).normalize();
            this.velocity = direction.multiply(this.speed);
            this.position = this.position.add(this.velocity);
        }

        // Brûlure
        if (this.burnTime > 0) {
            this.burnTime--;
            this.health -= 0.5;
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
    }

    burn(duration) {
        this.burnTime = Math.max(this.burnTime, duration);
    }

    isAlive() {
        return this.health > 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.burnTime > 0 ? '#ff6600' : '#ff0000';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.position.x - this.size, this.position.y - this.size - 8, this.size * 2, 4);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.position.x - this.size, this.position.y - this.size - 8, this.size * 2 * (this.health / this.maxHealth), 4);
    }
}

class Projectile {
    constructor(position, velocity, size, damage, lifetime = 300) {
        this.position = position;
        this.velocity = velocity;
        this.size = size;
        this.damage = damage;
        this.lifetime = lifetime;
        this.age = 0;
    }

    update() {
        this.position = this.position.add(this.velocity);
        this.age++;
    }

    isAlive() {
        return this.age < this.lifetime &&
               this.position.x > 0 && this.position.x < GAME_WIDTH &&
               this.position.y > 0 && this.position.y < GAME_HEIGHT;
    }

    draw(ctx) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Grenade extends Projectile {
    constructor(position, velocity, size, explosionRadius) {
        super(position, velocity, size, 0, 200);
        this.explosionRadius = explosionRadius;
        this.isExploded = false;
    }

    update() {
        super.update();
        this.velocity.y += 0.3; // Gravité
    }

    explode(enemies, projectiles) {
        if (this.isExploded) return;
        this.isExploded = true;

        // Dégâts aux ennemis proches
        enemies.forEach(enemy => {
            const dist = this.position.distance(enemy.position);
            if (dist < this.explosionRadius) {
                const damageMultiplier = 1 - (dist / this.explosionRadius);
                enemy.takeDamage(40 * damageMultiplier);
            }
        });

        // Particules d'explosion
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const vel = new Vector2(Math.cos(angle), Math.sin(angle)).multiply(5);
            projectiles.push(new Projectile(this.position, vel, 3, 0, 100));
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class FlamethrowerProjectile {
    constructor(position, velocity, size, direction) {
        this.position = position;
        this.velocity = velocity;
        this.size = size;
        this.direction = direction; // Direction du tir
        this.lifetime = 80;
        this.age = 0;
        this.fires = []; // Zones de feu au sol
    }

    update(enemies) {
        this.position = this.position.add(this.velocity);
        this.age++;

        // Créer du feu dans une zone triangulaire
        if (this.age % 3 === 0) {
            // Créer du feu en éventail triangulaire
            const spread = 0.4; // Écartement latéral
            for (let i = -1; i <= 1; i++) {
                const offsetDir = new Vector2(
                    this.direction.x * Math.cos(i * spread) - this.direction.y * Math.sin(i * spread),
                    this.direction.x * Math.sin(i * spread) + this.direction.y * Math.cos(i * spread)
                );
                this.fires.push({
                    position: new Vector2(this.position.x + offsetDir.x * 20, this.position.y + offsetDir.y * 20),
                    radius: 40,
                    duration: 180,
                    age: 0,
                    maxRadius: 40
                });
            }
        }

        // Dégâts aux ennemis touchés
        enemies.forEach(enemy => {
            const dist = this.position.distance(enemy.position);
            if (dist < 50) {
                enemy.takeDamage(1.5);
                enemy.burn(40);
            }
        });

        // Update feu
        this.fires = this.fires.filter(fire => {
            fire.age++;
            return fire.age < fire.duration;
        });

        // Dégâts du feu aux ennemis
        this.fires.forEach(fire => {
            enemies.forEach(enemy => {
                const dist = enemy.position.distance(fire.position);
                if (dist < fire.radius) {
                    enemy.takeDamage(0.7);
                    enemy.burn(30);
                }
            });
        });
    }

    isAlive() {
        return this.age < this.lifetime;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 120, 0, 0.9)';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Feu au sol avec dégradé
        this.fires.forEach(fire => {
            const alpha = 0.7 * (1 - fire.age / fire.duration);
            // Feu intérieur orange vif
            ctx.fillStyle = `rgba(255, 150, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(fire.position.x, fire.position.y, fire.maxRadius * 0.6, 0, Math.PI * 2);
            ctx.fill();
            // Feu extérieur
            ctx.fillStyle = `rgba(255, 80, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(fire.position.x, fire.position.y, fire.maxRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

class StratugemCrate {
    constructor(x, y, type) {
        this.position = new Vector2(x, y);
        this.size = 20;
        this.type = type; // 'zone-strike', 'precision-strike', 'air-support', 'ammo', 'flamethrower', 'minigun'
        this.collected = false;
    }

    draw(ctx) {
        const colors = {
            'zone-strike': '#ff00ff',
            'precision-strike': '#ff0000',
            'air-support': '#0000ff',
            'ammo': '#ffff00',
            'flamethrower': '#ff6600',
            'minigun': '#ffff00'
        };

        ctx.fillStyle = colors[this.type] || '#ffffff';
        ctx.fillRect(this.position.x - this.size, this.position.y - this.size, this.size * 2, this.size * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x - this.size, this.position.y - this.size, this.size * 2, this.size * 2);
    }
}

class ActiveStratagem {
    constructor(type) {
        this.type = type;
        this.sequence = STRATAGEM_SEQUENCES[type].sequence;
        this.progressIndex = 0;
        this.readyForActivation = false; // Prêt à être activé par clic
        this.activationDelayStarted = null; // Timestamp quand le clic a confirmé l'activation
    }

    getProgress() {
        return this.progressIndex / this.sequence.length;
    }
}

class StrikeZone {
    constructor(x, y, width, height, damage, durationFrames, damageType = 'instant') {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.damage = damage;
        this.duration = durationFrames;
        this.age = 0;
        this.damageType = damageType; // 'instant' ou 'over-time'
        this.damagedEnemies = new Set();
    }

    update(enemies, player) {
        this.age++;

        if (this.damageType === 'instant' && this.age === 1) {
            // Dégâts instantanés
            enemies.forEach(enemy => {
                if (this.contains(enemy.position)) {
                    enemy.takeDamage(this.damage);
                }
            });
            if (this.contains(player.position)) {
                player.takeDamage(this.damage);
            }
        } else if (this.damageType === 'delay' && this.age === 60) {
            // Dégâts après délai (zone rouge visible)
            enemies.forEach(enemy => {
                if (this.contains(enemy.position)) {
                    enemy.takeDamage(this.damage);
                }
            });
            if (this.contains(player.position)) {
                player.takeDamage(this.damage);
            }
        }
    }

    contains(position) {
        return position.x >= this.position.x - this.width / 2 &&
               position.x <= this.position.x + this.width / 2 &&
               position.y >= this.position.y - this.height / 2 &&
               position.y <= this.position.y + this.height / 2;
    }

    isActive() {
        return this.age < this.duration;
    }

    draw(ctx) {
        const alpha = 1 - (this.age / this.duration);
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        ctx.fillRect(
            this.position.x - this.width / 2,
            this.position.y - this.height / 2,
            this.width,
            this.height
        );
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(
            this.position.x - this.width / 2,
            this.position.y - this.height / 2,
            this.width,
            this.height
        );
    }
}

// ============================================
// SYSTÈME D'AUDIO (Placeholders)
// ============================================

function playSound(soundName) {
    assetManager.playSound(soundName, 0.7);
}

function playMusic(musicName) {
    assetManager.playMusic(musicName, 0.4);
}

// ============================================
// INITIALISATION DES ASSETS
// ============================================

async function initializeAssets() {
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');

    try {
        // Définir les assets à charger
        const assets = {
            images: {
                // Ajoutez ici vos images quand vous les ajouterez
                // 'player': 'assets/sprites/player.png',
                // 'enemy': 'assets/sprites/enemy.png',
            },
            sounds: {
                // Ajoutez ici vos sons quand vous les ajouterez
                // 'shoot': 'assets/sounds/shoot.mp3',
                // 'explosion': 'assets/sounds/explosion.mp3',
            },
            music: {
                // Ajoutez ici votre musique quand vous l'ajouterez
                // 'gameplay': 'assets/music/gameplay.mp3',
            }
        };

        let totalAssets = Object.values(assets).reduce((sum, obj) => sum + Object.keys(obj).length, 0);
        let loadedAssets = 0;

        const updateProgress = () => {
            const progress = totalAssets > 0 ? (loadedAssets / totalAssets) * 100 : 100;
            loadingBar.style.width = progress + '%';
            loadingText.textContent = `Loading assets... ${Math.floor(progress)}%`;
        };

        // Charger les images
        if (Object.keys(assets.images).length > 0) {
            loadingText.textContent = 'Loading images...';
            updateProgress();
            
            for (const [key, src] of Object.entries(assets.images)) {
                try {
                    await assetManager.loadImage(key, src);
                } catch (err) {
                    console.warn(`Failed to load image: ${key}`);
                }
                loadedAssets++;
                updateProgress();
            }
        }

        // Charger les sons
        if (Object.keys(assets.sounds).length > 0) {
            loadingText.textContent = 'Loading sounds...';
            
            for (const [key, src] of Object.entries(assets.sounds)) {
                try {
                    await assetManager.loadSound(key, src);
                } catch (err) {
                    console.warn(`Failed to load sound: ${key}`);
                }
                loadedAssets++;
                updateProgress();
            }
        }

        // Charger la musique
        if (Object.keys(assets.music).length > 0) {
            loadingText.textContent = 'Loading music...';
            
            for (const [key, src] of Object.entries(assets.music)) {
                try {
                    await assetManager.loadMusic(key, src);
                } catch (err) {
                    console.warn(`Failed to load music: ${key}`);
                }
                loadedAssets++;
                updateProgress();
            }
        }

        console.log('  All assets loaded!');
        assetManager.logStats();

        // Afficher le menu principal
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);

    } catch (err) {
        console.error('Error loading assets:', err);
        loadingText.textContent = 'Error loading assets. Click to continue.';
        loadingScreen.addEventListener('click', () => {
            loadingScreen.classList.add('hidden');
        });
    }
}

// ============================================
// SYSTÈME DE VAGUES
// ============================================

class WaveManager {
    constructor() {
        this.waveNumber = 1;
        this.enemies = [];
        this.spawnedCount = 0;
        this.requiredCount = 5;
        this.timeSinceLastSpawn = 0;
        this.spawnInterval = 30;
        this.isWaveActive = true;
    }

    getEnemyCountForWave(waveNum) {
        return 5 + (waveNum - 1) * 3; // 5, 8, 11, 14...
    }

    update(player) {
        if (!this.isWaveActive) return;

        this.timeSinceLastSpawn++;

        // Spawn des ennemis
        if (this.spawnedCount < this.requiredCount && this.timeSinceLastSpawn >= this.spawnInterval) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 200;
            const x = GAME_WIDTH / 2 + Math.cos(angle) * distance;
            const y = GAME_HEIGHT / 2 + Math.sin(angle) * distance;
            this.enemies.push(new Enemy(x, y));
            this.spawnedCount++;
            this.timeSinceLastSpawn = 0;
        }

        // Update ennemis
        this.enemies.forEach(enemy => enemy.update(player));

        // Supprimer les morts
        this.enemies = this.enemies.filter(e => e.isAlive());

        // Vague terminée?
        if (this.spawnedCount >= this.requiredCount && this.enemies.length === 0) {
            this.isWaveActive = false;
        }
    }

    nextWave() {
        this.waveNumber++;
        this.requiredCount = this.getEnemyCountForWave(this.waveNumber);
        this.spawnedCount = 0;
        this.timeSinceLastSpawn = 0;
        this.isWaveActive = true;
    }
}

// ============================================
// JEU PRINCIPAL
// ============================================

class Game {
    constructor() {
        this.player = new Player();
        this.waveManager = new WaveManager();
        this.projectiles = [];
        this.strikeZones = [];
        this.stratugemCrates = [];
        this.gameFrameCount = 0;
        this.waveBreakTime = 0;
        this.waveBreakDuration = 300; // 5 secondes à 60 FPS
        this.isPaused = false;
        this.score = 0;
        this.startTime = Date.now();

        // Stratagèmes
        this.activeStratagems = []; // Liste des stratagèmes collectés en attente d'activation

        this.initializeWave();
    }

    initializeWave() {
        this.waveManager.enemies = [];
        this.waveManager.spawnedCount = 0;
        this.waveManager.requiredCount = this.waveManager.getEnemyCountForWave(this.waveManager.waveNumber);
        this.waveManager.timeSinceLastSpawn = 0;
        this.waveManager.isWaveActive = true;
        this.generateStratugemCrates();
    }

    generateStratugemCrates() {
        const types = ['zone-strike', 'precision-strike', 'air-support', 'ammo', 'flamethrower', 'minigun'];
        const numCrates = 3 + Math.floor(this.waveManager.waveNumber / 2);

        this.stratugemCrates = [];
        for (let i = 0; i < numCrates; i++) {
            const x = Math.random() * (GAME_WIDTH - 100) + 50;
            const y = Math.random() * (GAME_HEIGHT - 100) + 50;
            const type = types[Math.floor(Math.random() * types.length)];
            this.stratugemCrates.push(new StratugemCrate(x, y, type));
        }
    }

    collectStratagem(type) {
        const stratagem = new ActiveStratagem(type);
        this.activeStratagems.push(stratagem);
        playSound('stratagemCollect');
    }

    checkStratagemActivation(playerMovementHistory) {
        if (this.activeStratagems.length === 0) return false;

        const currentStratagem = this.activeStratagems[0];

        // Ne pas vérifier si déjà en cours d'activation
        if (currentStratagem.readyForActivation) return false;

        const requiredSequence = currentStratagem.sequence;

        // Vérifier si l'historique se termine par la séquence requise
        if (playerMovementHistory.length >= requiredSequence.length) {
            const lastMoves = playerMovementHistory.slice(-requiredSequence.length);
            const matches = lastMoves.every((move, i) => move === requiredSequence[i]);

            if (matches) {
                // Séquence correctement complétée - marquer comme prêt pour activation
                currentStratagem.readyForActivation = true;
                playSound('stratagemReady'); // Son pour indiquer que c'est prêt
                return true;
            }
        }

        return false;
    }

    confirmStratagemActivation(clickX, clickY) {
        if (this.activeStratagems.length === 0) return;

        const currentStratagem = this.activeStratagems[0];

        if (currentStratagem.readyForActivation && !currentStratagem.activationDelayStarted) {
            // Démarrer le délai d'~1 seconde (60 frames)
            currentStratagem.activationDelayStarted = Date.now();
            currentStratagem.clickX = clickX;
            currentStratagem.clickY = clickY;
        }
    }

    updateStratagemActivation() {
        if (this.activeStratagems.length === 0) return;

        const currentStratagem = this.activeStratagems[0];

        // Vérifier si le délai d'activation est écoulé
        if (currentStratagem.activationDelayStarted) {
            const elapsedMs = Date.now() - currentStratagem.activationDelayStarted;
            if (elapsedMs >= 1000) { // 1 seconde
                // Exécuter le stratagème
                this.activeStratagems.shift();
                this.executeStratagem(currentStratagem.type, currentStratagem.clickX, currentStratagem.clickY);
            }
        }
    }

    executeStratagem(type, clickX = null, clickY = null) {
        playSound('stratagemExecute');

        // Utiliser les coordonnées du clic si fournies, sinon utiliser le centre
        const centerX = clickX !== null ? clickX : GAME_WIDTH / 2;
        const centerY = clickY !== null ? clickY : GAME_HEIGHT / 2;

        switch (type) {
            case 'zone-strike':
                // 5-6 tirs dans une grande zone
                for (let i = 0; i < 6; i++) {
                    const offsetX = (Math.random() - 0.5) * 300;
                    const offsetY = (Math.random() - 0.5) * 300;
                    setTimeout(() => {
                        this.strikeZones.push(new StrikeZone(
                            centerX + offsetX,
                            centerY + offsetY,
                            150,
                            150,
                            35,
                            120,
                            'delay'
                        ));
                    }, i * 150);
                }
                break;

            case 'precision-strike':
                // Un tir dans une plus petite zone, plus de dégâts
                this.strikeZones.push(new StrikeZone(
                    centerX,
                    centerY,
                    100,
                    100,
                    50,
                    120,
                    'delay'
                ));
                break;

            case 'air-support':
                // Zone rectangulaire qui traverse l'écran
                const yStart = clickY !== null ? clickY : Math.random() * GAME_HEIGHT;
                const zone = new StrikeZone(
                    GAME_WIDTH / 2,
                    yStart,
                    GAME_WIDTH,
                    80,
                    25,
                    180,
                    'delay'
                );
                this.strikeZones.push(zone);
                break;

            case 'ammo':
                this.player.addAmmo(60);
                this.player.heal(30);
                playSound('ammoPickup');
                break;

            case 'flamethrower':
                this.player.superWeapon = 'flamethrower';
                this.player.superWeaponAmmo = 100;
                playSound('weaponPickup');
                break;

            case 'minigun':
                this.player.superWeapon = 'minigun';
                this.player.superWeaponAmmo = 1000;
                playSound('weaponPickup');
                break;
        }
    }

    update(keys, mouse) {
        this.gameFrameCount++;

        // Update joueur
        this.player.update(keys, mouse);
        this.player.updateGrenadePreview();

        // Vérifier les activations de stratagèmes
        this.checkStratagemActivation(this.player.movementHistory);

        // Mettre à jour les stratagèmes en cours d'activation (délai)
        this.updateStratagemActivation();

        // Update vagues
        this.waveManager.update(this.player);

        // Update projectiles
        this.projectiles.forEach(p => {
            if (p.update) p.update(this.waveManager.enemies);
        });

        // Collisions projectiles -> ennemis
        this.projectiles = this.projectiles.filter(p => {
            if (p.isExploded) return false;

            let hit = false;
            this.waveManager.enemies = this.waveManager.enemies.filter(enemy => {
                const dist = p.position.distance(enemy.position);
                if (dist < p.size + enemy.size) {
                    enemy.takeDamage(p.damage);
                    hit = true;
                    if (!enemy.isAlive()) {
                        this.score += 10;
                        playSound('enemyDeath');
                    }
                    return enemy.isAlive();
                }
                return true;
            });

            return !hit && (p.isAlive?.() ?? true);
        });

        // Update zones de frappe
        this.strikeZones.forEach(zone => zone.update(this.waveManager.enemies, this.player));
        this.strikeZones = this.strikeZones.filter(z => z.isActive());

        // Interaction avec caisses de stratagèmes
        this.stratugemCrates.forEach(crate => {
            const dist = this.player.position.distance(crate.position);
            if (dist < 40) {
                this.collectStratagem(crate.type);
                crate.collected = true;
            }
        });
        this.stratugemCrates = this.stratugemCrates.filter(c => !c.collected);

        // Collision ennemis -> joueur
        this.waveManager.enemies.forEach(enemy => {
            const dist = this.player.position.distance(enemy.position);
            if (dist < this.player.size + enemy.size) {
                this.player.takeDamage(0.5);
            }
        });

        // Check game over
        if (this.player.health <= 0) {
            gameState = 'gameOver';
            playSound('gameOver');
        }

        // Gestion des vagues
        if (!this.waveManager.isWaveActive && this.waveManager.enemies.length === 0) {
            if (this.waveBreakTime === 0) {
                gameState = 'waveBreak';
            }
        }
    }

    draw(ctx) {
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Grille (optionnel, pour débugger)
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < GAME_WIDTH; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }

        // Draw zones de frappe
        this.strikeZones.forEach(zone => zone.draw(ctx));

        // Draw caisses de stratagèmes
        this.stratugemCrates.forEach(crate => crate.draw(ctx));

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));

        // Draw ennemis
        this.waveManager.enemies.forEach(enemy => enemy.draw(ctx));

        // Draw joueur
        this.player.draw(ctx);

        // UI
        this.drawUI(ctx);
    }

    drawUI(ctx) {
        // Santé
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const healthFill = document.getElementById('healthFill');
        healthFill.style.width = healthPercent + '%';
        document.getElementById('healthText').textContent = `${Math.floor(this.player.health)}/${this.player.maxHealth}`;

        // Arme
        let weaponText = '';
        if (this.player.superWeapon) {
            weaponText = this.player.superWeapon === 'flamethrower' ? t('flamethrower') : t('minigun');
        } else {
            weaponText = t('rifle');
        }
        document.getElementById('weaponName').textContent = weaponText;
        document.getElementById('ammoCount').textContent = `${this.player.currentMag}/${this.player.ammo}`;

        // Vague
        document.getElementById('waveInfo').textContent = `${t('waveInfo')} ${this.waveManager.waveNumber}`;
        document.getElementById('enemyCount').textContent = `${t('enemyCount')}: ${this.waveManager.enemies.length}`;

        // Stratagèmes actifs
        const strategemList = document.getElementById('strategemList');
        strategemList.innerHTML = '';

        if (this.activeStratagems.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'stratagem-item';
            emptyDiv.textContent = '(Aucun)';
            strategemList.appendChild(emptyDiv);
        } else {
            this.activeStratagems.forEach((stratagem, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'stratagem-item';

                // Ajouter la classe "ready" si le stratagème est prêt à être activé
                if (stratagem.readyForActivation) {
                    itemDiv.classList.add('ready');
                }

                const name = language === 'en' ?
                    STRATAGEM_SEQUENCES[stratagem.type].name :
                    STRATAGEM_SEQUENCES[stratagem.type].nameFr;

                // Calculer la progression basée sur l'historique des mouvements
                let progressIndex = 0;
                if (index === 0) {
                    // Pour le stratagème actuel, vérifier si l'historique correspond
                    const requiredSequence = stratagem.sequence;

                    // Si le stratagème est readyForActivation, progressIndex doit être rempli
                    if (stratagem.readyForActivation) {
                        progressIndex = requiredSequence.length;
                    } else if (this.player.movementHistory.length <= requiredSequence.length) {
                        progressIndex = this.player.movementHistory.length;
                        // Vérifier que les mouvements correspondent
                        let allMatch = true;
                        for (let i = 0; i < progressIndex; i++) {
                            if (this.player.movementHistory[i] !== requiredSequence[i]) {
                                allMatch = false;
                                break;
                            }
                        }
                        if (!allMatch) {
                            progressIndex = 0;
                        }
                    }
                }

                const sequence = stratagem.sequence.map((dir, i) => {
                    const arrow = {
                        'up': '↑',
                        'down': '↓',
                        'left': '←',
                        'right': '→'
                    }[dir] || dir;

                    const color = i < progressIndex ? stratagem.color : '#444';
                    return `<span style="color: ${color};">${arrow}</span>`;
                }).join('');

                let statusText = '';
                if (stratagem.readyForActivation) {
                    if (stratagem.activationDelayStarted) {
                        statusText = ' ⏱️ ACTIVATING...';
                    } else {
                        statusText = ' 🎯 CLICK!';
                    }
                }

                itemDiv.innerHTML = `<strong>${index === 0 ? '▶ ' : '• '}${name}${statusText}</strong><br/>${sequence}`;
                strategemList.appendChild(itemDiv);
            });
        }

        // Affichage: zone de frappe incoming
        if (this.strikeZones.length > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '14px Arial';
            ctx.fillText(`▼ Incoming strikes`, 20, GAME_HEIGHT - 20);
        }
    }
}

// ============================================
// GESTION DE L'INPUT
// ============================================

let keys = {};
let mouse = { x: 0, y: 0 };
let leftMouseDown = false;
let grenadeKeyPressed = false;

document.addEventListener('keydown', (e) => {
    const keyLower = e.key.toLowerCase();
    keys[e.key] = true;

    if (gameState === 'playing') {
        // Autres touches
        if (keyLower === 'r') {
            game.player.reload();
        } else if (keyLower === CONTROL_KEYS['grenade']) {
            if (!grenadeKeyPressed) {
                game.player.toggleGrenadePreview();
                grenadeKeyPressed = true;
            }
        } else if (keyLower === CONTROL_KEYS['superWeapon']) {
            if (game.player.superWeapon) {
                game.player.useSuperWeapon(game.projectiles, game.gameFrameCount);
            }
        } else if (keyLower === CONTROL_KEYS['dropWeapon']) {
            game.player.dropSuperWeapon();
        } else if (e.key === 'Escape') {
            toggleFullscreen();
        }
    }
});

document.addEventListener('keyup', (e) => {
    const keyLower = e.key.toLowerCase();
    keys[e.key] = false;

    if (gameState === 'playing') {
        if (keyLower === CONTROL_KEYS['grenade']) {
            grenadeKeyPressed = false;
            if (game.player.showGrenadePreview) {
                game.player.throwGrenade(game.projectiles);
            }
        }
    }
});

document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

document.addEventListener('mousedown', (e) => {
    leftMouseDown = true;
    if (gameState === 'playing' && e.button === 0) {
        // Confirmation du stratagème si prêt
        if (game.activeStratagems.length > 0 && game.activeStratagems[0].readyForActivation) {
            game.confirmStratagemActivation(e.clientX, e.clientY);
        } else {
            // Sinon, tirer normalement
            game.player.shoot(game.projectiles, game.gameFrameCount);
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) leftMouseDown = false;
});

document.addEventListener('click', (e) => {
    if (gameState === 'gameOver') {
        gameState = 'menu';
        showMenu('mainMenu');
    }
});

// ============================================
// MENUS
// ============================================

function populateStratagemConfig() {
    const configList = document.getElementById('stratagemConfigList');
    configList.innerHTML = '';

    const controls = [
        { key: 'moveUp', label: 'Move Up' },
        { key: 'moveDown', label: 'Move Down' },
        { key: 'moveLeft', label: 'Move Left' },
        { key: 'moveRight', label: 'Move Right' },
        { key: 'grenade', label: 'Grenade' },
        { key: 'superWeapon', label: 'Super Weapon' },
        { key: 'dropWeapon', label: 'Drop Weapon' },
        { key: 'reload', label: 'Reload' }
    ];

    controls.forEach(control => {
        const div = document.createElement('div');
        div.className = 'control-item';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = CONTROL_KEYS[control.key];
        input.maxLength = 1;
        input.style.width = '40px';
        input.style.marginLeft = '10px';
        input.style.padding = '5px';
        input.style.color = '#000';

        input.addEventListener('change', (e) => {
            CONTROL_KEYS[control.key] = e.target.value.toLowerCase();
            localStorage.setItem('controlKeys', JSON.stringify(CONTROL_KEYS));
        });

        div.appendChild(document.createTextNode(`${control.label}: `));
        div.appendChild(input);
        configList.appendChild(div);
    });
}

function updateUILanguage() {
    document.getElementById('title').textContent = t('title');
    document.getElementById('playBtn').textContent = t('play');
    document.getElementById('rulesBtn').textContent = t('rules');
    document.getElementById('controlsBtn').textContent = t('controls');
    document.getElementById('languageBtn').textContent = language === 'en' ? 'français' : 'English';

    document.getElementById('rulesTitle').textContent = t('rulesTitle');
    document.getElementById('rules1').textContent = t('rules1');
    document.getElementById('rules2').textContent = t('rules2');
    document.getElementById('rules3').textContent = t('rules3');
    document.getElementById('rules4').textContent = t('rules4');

    document.getElementById('controlsTitle').textContent = t('controlsTitle');
    document.getElementById('moveLabel').textContent = t('moveLabel');
    document.getElementById('shootLabel').textContent = t('shootLabel');
    document.getElementById('grenadeLabel').textContent = t('grenadeLabel');
    document.getElementById('superWeaponLabel').textContent = t('superWeaponLabel');
    document.getElementById('dropWeaponLabel').textContent = t('dropWeaponLabel');
    document.getElementById('fullscreenLabel').textContent = t('fullscreenLabel');

    document.getElementById('strategemTitle').textContent = t('strategemTitle');
    document.getElementById('stratagemConfigTitle').textContent = t('stratagemConfigTitle');
}

function showMenu(menuId) {
    document.querySelectorAll('.menu').forEach(m => m.classList.add('hidden'));
    document.getElementById(menuId).classList.remove('hidden');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

document.getElementById('playBtn').addEventListener('click', () => {
    game = new Game();
    gameState = 'playing';
    showMenu('gameContainer');
    document.getElementById('gameContainer').classList.remove('hidden');
    playMusic('gameMusic');
});

document.getElementById('rulesBtn').addEventListener('click', () => {
    showMenu('rulesMenu');
});

document.getElementById('controlsBtn').addEventListener('click', () => {
    showMenu('controlsMenu');
});

document.getElementById('stratagemConfigBtn').addEventListener('click', () => {
    populateStratagemConfig();
    showMenu('stratagemConfigMenu');
});

document.getElementById('backFromStratagemConfigBtn').addEventListener('click', () => {
    showMenu('controlsMenu');
});

document.getElementById('languageBtn').addEventListener('click', () => {
    language = language === 'en' ? 'fr' : 'en';
    updateUILanguage();
});

document.getElementById('backFromRulesBtn').addEventListener('click', () => {
    showMenu('mainMenu');
});

document.getElementById('backFromControlsBtn').addEventListener('click', () => {
    showMenu('mainMenu');
});

document.getElementById('mainMenuBtn').addEventListener('click', () => {
    gameState = 'menu';
    showMenu('mainMenu');
});

// ============================================
// BOUCLE PRINCIPALE
// ============================================

let game;
let lastTime = Date.now();

function update() {
    if (gameState === 'playing') {
        // Tir continu
        if (leftMouseDown) {
            game.player.shoot(game.projectiles, game.gameFrameCount);
        }

        // Super arme continu
        if (keys[CONTROL_KEYS['superWeapon']] && game.player.superWeapon && game.player.superWeaponAmmo > 0) {
            game.player.useSuperWeapon(game.projectiles, game.gameFrameCount);
        }

        game.update(keys, mouse);
    } else if (gameState === 'waveBreak') {
        game.waveBreakTime++;
        if (game.waveBreakTime >= game.waveBreakDuration) {
            game.waveManager.nextWave();
            game.initializeWave();
            game.waveBreakTime = 0;
            gameState = 'playing';
        }

        // Continuer à mettre à jour le jeu pendant le break (projectiles, animations)
        game.gameFrameCount++;
        game.player.update(keys, mouse);
        game.player.updateGrenadePreview();

        // Update projectiles
        game.projectiles.forEach(p => {
            if (p.update) p.update(game.waveManager.enemies);
        });

        // Nettoyer les projectiles morts
        game.projectiles = game.projectiles.filter(p => {
            if (p.isAlive && p.isAlive()) return true;
            return false;
        });
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (gameState === 'playing' || gameState === 'waveBreak') {
        game.draw(ctx);

        if (gameState === 'waveBreak') {
            const timeLeft = Math.ceil((game.waveBreakDuration - game.waveBreakTime) / 60);

            // Afficher le texte en haut sans overlay
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${t('waveInfo')} ${game.waveManager.waveNumber}`, GAME_WIDTH / 2, 80);
            ctx.font = '24px Arial';
            ctx.fillText(`Starting in ${timeLeft}s`, GAME_WIDTH / 2, 130);
        }
    } else if (gameState === 'gameOver') {
        // Fond semi-transparent
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Titre
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION FAILED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120);

        // Stats
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`Wave: ${game.waveManager.waveNumber}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        ctx.fillText(`Score: ${game.score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);

        // Instructions
        ctx.fillStyle = '#ffff00';
        ctx.font = '24px Arial';
        ctx.fillText('Click to return to menu', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 120);
        ctx.textAlign = 'left';
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialisation
const savedControls = localStorage.getItem('controlKeys');
if (savedControls) {
    CONTROL_KEYS = JSON.parse(savedControls);
}

updateUILanguage();

// Initialiser les assets puis afficher le menu
(async () => {
    await initializeAssets();
    showMenu('mainMenu');
    gameLoop();
})();
