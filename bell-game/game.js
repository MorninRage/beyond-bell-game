// Beyond Bell: Full Space Shooter Game
// With Levels, Crafting, RPG Elements, and Survival Mechanics

class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Game state
        this.mode = 'individual';
        this.level = 1;
        this.gameState = 'playing'; // 'playing', 'paused', 'crafting', 'shop', 'gameover'
        
        // Player stats (RPG)
        this.playerStats = {
            health: 100,
            maxHealth: 100,
            shield: 50,
            maxShield: 50,
            speed: 150, // Start slower
            baseSpeed: 150,
            fireRate: 0.5, // shots per second
            baseFireRate: 0.5,
            damage: 10
        };
        
        // Player equipment
        this.currentShip = 'basic';
        this.currentWeapon = 'basic';
        this.currentShield = 'none';
        
        // Inventory & Crafting
        this.inventory = {
            quantumParticles: 0,
            energyCores: 0,
            metalScraps: 0,
            crystals: 0,
            tokens: 0
        };
        
        // Crafting recipes
        this.recipes = {
            weapons: {
                rapid: { quantumParticles: 5, energyCores: 2 },
                spread: { quantumParticles: 8, crystals: 3 },
                laser: { energyCores: 5, crystals: 5 },
                automatic: { quantumParticles: 10, energyCores: 5, metalScraps: 5 }
            },
            ships: {
                fast: { metalScraps: 10, energyCores: 3 },
                tank: { metalScraps: 15, crystals: 5 },
                agile: { metalScraps: 8, energyCores: 5 }
            },
            shields: {
                basic: { energyCores: 3, metalScraps: 5 },
                reinforced: { energyCores: 5, crystals: 3 },
                quantum: { quantumParticles: 10, crystals: 5 }
            }
        };
        
        // Equipment stats
        this.equipmentStats = {
            ships: {
                basic: { speed: 150, health: 100 },
                fast: { speed: 200, health: 80 },
                tank: { speed: 100, health: 200 },
                agile: { speed: 180, health: 120 }
            },
            weapons: {
                basic: { fireRate: 0.5, damage: 10, color: '#4caf50', automatic: false },
                rapid: { fireRate: 1.0, damage: 8, color: '#ff9800', automatic: false },
                spread: { fireRate: 0.4, damage: 12, color: '#9c27b0', spread: 3, automatic: false },
                laser: { fireRate: 0.3, damage: 20, color: '#f44336', automatic: false },
                automatic: { fireRate: 2.0, damage: 7, color: '#00bcd4', automatic: true }
            },
            shields: {
                none: { capacity: 0, regen: 0 },
                basic: { capacity: 50, regen: 5 },
                reinforced: { capacity: 100, regen: 10 },
                quantum: { capacity: 150, regen: 15 }
            }
        };
        
        // Player
        this.player = {
            x: 0,
            y: 0,
            size: 20,
            lastShot: 0
        };
        
        // Game objects
        this.bullets = [];
        this.targets = [];
        this.pairs = [];
        this.obstacles = [];
        this.items = [];
        this.particles = [];
        
        // Stats
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.time = 0;
        this.lastTargetSpawn = 0;
        this.lastObstacleSpawn = 0;
        this.targetSpawnRate = 2000;
        this.obstacleSpawnRate = 3000;
        
        // Player name
        this.playerName = this.loadPlayerName() || '';
        
        // Leaderboard
        this.leaderboard = [];
        this.apiUrl = window.API_URL || 'http://localhost:3000/api'; // Change this to your server URL
        
        // Load leaderboard from server
        this.loadLeaderboardFromServer();
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.mouseDown = false;
        this.panelsVisible = {
            ui: true,
            theory: true,
            instructions: true
        };
        
        this.setupEventListeners();
        this.updateTheoryPanel();
        this.updateStats();
        this.spawnInitialTargets();
        this.lastTime = performance.now();
        
        // Show name input on first play if no name set
        if (!this.playerName) {
            setTimeout(() => {
                const name = prompt('Enter your name for the leaderboard (you can change this later):', 'Player');
                if (name && name.trim()) {
                    this.playerName = name.trim();
                    this.savePlayerName();
                }
            }, 1000);
        }
        
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height - 100;
        }
        if (this.mouse) {
            this.mouse.x = this.canvas.width / 2;
            this.mouse.y = this.canvas.height / 2;
        }
    }

    setupEventListeners() {
        // Mode buttons
        document.getElementById('ensembleBtn')?.addEventListener('click', () => this.setMode('ensemble'));
        document.getElementById('individualBtn')?.addEventListener('click', () => this.setMode('individual'));
        document.getElementById('bellBtn')?.addEventListener('click', () => this.setMode('bell'));

        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') this.shoot();
            } else if (e.key === 'r' || e.key === 'R') {
                if (this.gameState === 'gameover') this.reset();
            } else if (e.key === '1') {
                this.setMode('ensemble');
            } else if (e.key === '2') {
                this.setMode('individual');
            } else if (e.key === '3') {
                this.setMode('bell');
            } else if (e.key === 'c' || e.key === 'C') {
                this.toggleCrafting();
            } else if (e.key === 'u' || e.key === 'U') {
                this.toggleShop();
            } else if (e.key === 'l' || e.key === 'L') {
                this.toggleLeaderboard();
            } else if (e.key === 'Escape') {
                if (this.gameState === 'crafting') {
                    this.toggleCrafting();
                } else if (this.gameState === 'shop') {
                    this.toggleShop();
                } else if (this.gameState === 'leaderboard') {
                    this.toggleLeaderboard();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Pointer input (mouse/pen/touch) -> canvas coordinates (handles CSS scaling/DPI)
        const updatePointerPosition = (clientX, clientY) => {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            // Avoid divide-by-zero when canvas is not laid out yet
            const scaleX = rect.width ? (this.canvas.width / rect.width) : 1;
            const scaleY = rect.height ? (this.canvas.height / rect.height) : 1;
            this.mouse.x = (clientX - rect.left) * scaleX;
            this.mouse.y = (clientY - rect.top) * scaleY;
        };

        // Prefer pointer events when available
        if ('PointerEvent' in window) {
            document.addEventListener('pointermove', (e) => {
                updatePointerPosition(e.clientX, e.clientY);
            }, { passive: true });
        } else {
            document.addEventListener('mousemove', (e) => {
                updatePointerPosition(e.clientX, e.clientY);
            }, { passive: true });
        }

        // Touch fallback (older browsers / iOS edge cases)
        document.addEventListener('touchmove', (e) => {
            const t = e.touches && e.touches[0];
            if (t) updatePointerPosition(t.clientX, t.clientY);
        }, { passive: true });

        // Mouse/pointer down events on document to work through panels
        const handlePress = (e, clientX, clientY, target) => {
            if (this.gameState !== 'playing') return;
            // Only shoot when the press started on the canvas
            if (target !== this.canvas) return;
            updatePointerPosition(clientX, clientY);
            if (e && e.preventDefault) e.preventDefault();
            this.mouseDown = true;
            this.shoot();
        };

        document.addEventListener('mousedown', (e) => {
            handlePress(e, e.clientX, e.clientY, e.target);
        });

        document.addEventListener('touchstart', (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            handlePress(e, t.clientX, t.clientY, e.target);
        }, { passive: false });

        document.addEventListener('mouseup', () => {
            this.mouseDown = false;
        });

        document.addEventListener('touchend', () => {
            this.mouseDown = false;
        }, { passive: true });

        document.addEventListener('mouseleave', () => {
            this.mouseDown = false;
        });

        // Panel toggles
        document.addEventListener('keydown', (e) => {
            if (e.key === 'i' || e.key === 'I') {
                this.togglePanel('instructions');
            } else if (e.key === 't' || e.key === 'T') {
                this.togglePanel('theory');
            } else if (e.key === 'h' || e.key === 'H') {
                this.togglePanel('ui');
            }
        });
        
        this.mouse.x = this.canvas.width / 2;
        this.mouse.y = this.canvas.height / 2;
    }

    setMode(mode) {
        this.mode = mode;
        document.querySelectorAll('.mode-btn')?.forEach(btn => btn.classList.remove('active'));
        
        if (mode === 'ensemble') {
            document.getElementById('ensembleBtn')?.classList.add('active');
            document.getElementById('modeDisplay').textContent = 'Ensemble QM';
        } else if (mode === 'individual') {
            document.getElementById('individualBtn')?.classList.add('active');
            document.getElementById('modeDisplay').textContent = 'Individual';
        } else if (mode === 'bell') {
            document.getElementById('bellBtn')?.classList.add('active');
            document.getElementById('modeDisplay').textContent = 'Bell Pairs';
        }

        this.updateTheoryPanel();
    }

    updateTheoryPanel() {
        const theoryTexts = {
            ensemble: `<span class="warning">Ensemble QM:</span> Probabilistic shooting with uncertainty.`,
            individual: `<span class="success">Individual System:</span> Precise, deterministic shooting.`,
            bell: `<span class="warning">Bell Pairs:</span> Correlated pairs behavior.`
        };

        const panel = document.getElementById('currentTheory');
        if (panel) panel.innerHTML = theoryTexts[this.mode] || '';
    }

    spawnInitialTargets() {
        setTimeout(() => {
            for (let i = 0; i < 3 + this.level; i++) {
                this.spawnTarget();
            }
        }, 100);
    }

    spawnTarget() {
        if (!this.canvas || this.canvas.width === 0 || this.canvas.height === 0) return;
        
        if (this.mode === 'bell') {
            const x1 = Math.random() * Math.max(100, this.canvas.width - 200) + 100;
            const y1 = Math.random() * Math.max(100, this.canvas.height - 200) + 100;
            const x2 = x1 + (Math.random() - 0.5) * 150;
            const y2 = y1 + (Math.random() - 0.5) * 150;
            
            this.pairs.push({
                a: { x: x1, y: y1, size: 15, health: 1, color: '#4fc3f7', vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50 },
                b: { x: x2, y: y2, size: 15, health: 1, color: '#4fc3f7', vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 50 }
            });
        } else {
            this.targets.push({
                x: Math.random() * Math.max(50, this.canvas.width - 100) + 50,
                y: Math.random() * Math.max(50, this.canvas.height - 200) + 50,
                size: 15,
                health: 1,
                color: '#4fc3f7',
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50
            });
        }
    }

    spawnObstacle() {
        if (!this.canvas || this.canvas.width === 0) return;
        
        const side = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        
        switch(side) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -20;
                vx = (Math.random() - 0.5) * 100;
                vy = 100 + this.level * 20;
                break;
            case 1: // Right
                x = this.canvas.width + 20;
                y = Math.random() * this.canvas.height;
                vx = -(100 + this.level * 20);
                vy = (Math.random() - 0.5) * 100;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 20;
                vx = (Math.random() - 0.5) * 100;
                vy = -(100 + this.level * 20);
                break;
            case 3: // Left
                x = -20;
                y = Math.random() * this.canvas.height;
                vx = 100 + this.level * 20;
                vy = (Math.random() - 0.5) * 100;
                break;
        }
        
        this.obstacles.push({
            x, y,
            size: 20 + this.level * 2,
            vx, vy,
            color: '#ff4444',
            damage: 10 + this.level * 2
        });
    }

    reset() {
        this.level = 1;
        this.gameState = 'playing';
        this.bullets = [];
        this.targets = [];
        this.pairs = [];
        this.obstacles = [];
        this.items = [];
        this.particles = [];
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.time = 0;
        // Reset stats to base values
        this.playerStats.speed = this.playerStats.baseSpeed;
        this.playerStats.fireRate = this.playerStats.baseFireRate;
        this.playerStats.health = this.playerStats.maxHealth;
        this.playerStats.shield = this.playerStats.maxShield;
        this.updateStats();
        this.spawnInitialTargets();
        
        // Close any open UIs
        document.getElementById('craftingUI')?.classList.remove('active');
        document.getElementById('shopUI')?.classList.remove('active');
        document.getElementById('leaderboardUI')?.classList.remove('active');
    }

    shoot() {
        const now = Date.now();
        const weapon = this.equipmentStats.weapons[this.currentWeapon];
        // Apply fire rate upgrades
        const upgradedFireRate = weapon.fireRate + (this.playerStats.fireRate - this.playerStats.baseFireRate);
        const cooldown = 1000 / upgradedFireRate;
        
        // For automatic weapons, check if mouse is held down
        if (weapon.automatic && !this.mouseDown) {
            return;
        }
        
        if (now - this.player.lastShot < cooldown) return;
        this.player.lastShot = now;

        const dx = this.mouse.x - this.player.x;
        const dy = this.mouse.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (weapon.spread) {
            // Spread shot
            for (let i = 0; i < weapon.spread; i++) {
                const spreadAngle = angle + (i - weapon.spread / 2) * 0.2;
                this.createBullet(spreadAngle, weapon);
            }
        } else {
            this.createBullet(angle, weapon);
        }
    }

    createBullet(angle, weapon) {
        if (this.mode === 'ensemble') {
            const uncertainty = 0.3;
            angle += (Math.random() - 0.5) * uncertainty;
        }
        
        this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(angle) * 500,
            vy: Math.sin(angle) * 500,
            color: weapon.color,
            size: 5,
            damage: weapon.damage,
            lifetime: 2
        });
    }

    dropItem(x, y, type) {
        const dropChance = 0.3;
        if (Math.random() < dropChance) {
            const itemTypes = ['quantumParticles', 'energyCores', 'metalScraps', 'crystals'];
            const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            
            this.items.push({
                x, y,
                type: itemType,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                lifetime: 5,
                collected: false
            });
        }
        
        // Always drop tokens
        this.inventory.tokens += 1 + Math.floor(this.level / 2);
    }

    togglePanel(panelName) {
        this.panelsVisible[panelName] = !this.panelsVisible[panelName];
        let panelId;
        if (panelName === 'ui') {
            panelId = 'ui';
        } else if (panelName === 'theory') {
            panelId = 'theoryPanel';
        } else if (panelName === 'instructions') {
            panelId = 'instructions';
        }
        
        const panel = document.getElementById(panelId);
        if (panel) {
            if (this.panelsVisible[panelName]) {
                panel.style.display = 'block';
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Continuous shooting for automatic weapons
        if (this.mouseDown && this.gameState === 'playing') {
            const weapon = this.equipmentStats.weapons[this.currentWeapon];
            if (weapon && weapon.automatic) {
                this.shoot();
            }
        }
        
        this.time += deltaTime;
        
        // Level progression
        const newLevel = Math.floor(this.time / 30) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.targetSpawnRate = Math.max(500, 2000 - this.level * 100);
            this.obstacleSpawnRate = Math.max(1000, 3000 - this.level * 150);
        }

        // Player movement - use playerStats.speed (includes upgrades)
        const shipBaseSpeed = this.equipmentStats.ships[this.currentShip].speed;
        const totalSpeed = shipBaseSpeed + (this.playerStats.speed - this.playerStats.baseSpeed);
        
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            this.player.y -= totalSpeed * deltaTime;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            this.player.y += totalSpeed * deltaTime;
        }
        // S key for backward movement (when not in shop)
        if ((this.keys['KeyS'] && !this.keys['ArrowDown']) && this.gameState === 'playing') {
            // Calculate backward direction based on mouse position
            const dx = this.player.x - this.mouse.x;
            const dy = this.player.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.player.x += (dx / dist) * totalSpeed * deltaTime * 0.5;
                this.player.y += (dy / dist) * totalSpeed * deltaTime * 0.5;
            }
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            this.player.x -= totalSpeed * deltaTime;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            this.player.x += totalSpeed * deltaTime;
        }

        this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
        this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));

        // Shield regeneration
        const shield = this.equipmentStats.shields[this.currentShield];
        if (this.playerStats.shield < this.playerStats.maxShield) {
            this.playerStats.shield = Math.min(
                this.playerStats.maxShield,
                this.playerStats.shield + shield.regen * deltaTime
            );
        }

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            bullet.lifetime -= deltaTime;

            if (this.mode === 'bell') {
                for (let pair of this.pairs) {
                    const hitA = this.checkCollision(bullet, pair.a);
                    const hitB = this.checkCollision(bullet, pair.b);
                    
                    if (hitA || hitB) {
                        if (hitA) {
                            pair.a.health = 0;
                            pair.b.health = 0;
                            this.dropItem(pair.a.x, pair.a.y, 'quantumParticles');
                        } else {
                            pair.b.health = 0;
                            pair.a.health = 0;
                            this.dropItem(pair.b.x, pair.b.y, 'quantumParticles');
                        }
                        this.createExplosion(bullet.x, bullet.y);
                        this.score += 10;
                        this.hits++;
                        this.updateStats();
                        return false;
                    }
                }
            } else {
                for (let target of this.targets) {
                    if (this.checkCollision(bullet, target)) {
                        target.health = 0;
                        this.dropItem(target.x, target.y, 'quantumParticles');
                        this.createExplosion(target.x, target.y);
                        this.score += 10;
                        this.hits++;
                        this.updateStats();
                        return false;
                    }
                }
            }

            if (bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height ||
                bullet.lifetime <= 0) {
                if (bullet.lifetime > 0) {
                    this.misses++;
                    this.updateStats();
                }
                return false;
            }
            return true;
        });

        // Update targets
        this.targets = this.targets.filter(target => {
            target.x += target.vx * deltaTime;
            target.y += target.vy * deltaTime;
            if (target.x < target.size || target.x > this.canvas.width - target.size) target.vx *= -1;
            if (target.y < target.size || target.y > this.canvas.height - target.size) target.vy *= -1;
            return target.health > 0;
        });

        // Update pairs
        this.pairs = this.pairs.filter(pair => {
            pair.a.x += pair.a.vx * deltaTime;
            pair.a.y += pair.a.vy * deltaTime;
            pair.b.x += pair.b.vx * deltaTime;
            pair.b.y += pair.b.vy * deltaTime;
            
            const dx = pair.b.x - pair.a.x;
            const dy = pair.b.y - pair.a.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 200) {
                const angle = Math.atan2(dy, dx);
                pair.b.x = pair.a.x + Math.cos(angle) * 200;
                pair.b.y = pair.a.y + Math.sin(angle) * 200;
            }
            
            [pair.a, pair.b].forEach(p => {
                if (p.x < p.size || p.x > this.canvas.width - p.size) p.vx *= -1;
                if (p.y < p.size || p.y > this.canvas.height - p.size) p.vy *= -1;
            });
            
            return pair.a.health > 0 || pair.b.health > 0;
        });

        // Update obstacles
        this.obstacles.forEach(obstacle => {
            obstacle.x += obstacle.vx * deltaTime;
            obstacle.y += obstacle.vy * deltaTime;
            
            // Check collision with player
            if (this.checkCollision(obstacle, this.player)) {
                const damage = obstacle.damage;
                // Apply damage to shield first, then health
                if (this.playerStats.shield > 0) {
                    const remainingDamage = Math.max(0, damage - this.playerStats.shield);
                    this.playerStats.shield = Math.max(0, this.playerStats.shield - damage);
                    if (remainingDamage > 0) {
                        this.playerStats.health = Math.max(0, this.playerStats.health - remainingDamage);
                    }
                } else {
                    this.playerStats.health = Math.max(0, this.playerStats.health - damage);
                }
                this.createExplosion(obstacle.x, obstacle.y);
                obstacle.vx = 0;
                obstacle.vy = 0;
                obstacle.size = 0;
                
                if (this.playerStats.health <= 0) {
                    this.gameState = 'gameover';
                    // Submit score on game over
                    setTimeout(async () => {
                        if (!this.playerName) {
                            this.showNameInput();
                        } else {
                            await this.submitScore();
                        }
                    }, 500);
                }
            }
        });
        this.obstacles = this.obstacles.filter(o => o.size > 0 && 
            o.x > -50 && o.x < this.canvas.width + 50 &&
            o.y > -50 && o.y < this.canvas.height + 50);

        // Update items
        this.items.forEach(item => {
            item.x += item.vx * deltaTime;
            item.y += item.vy * deltaTime;
            item.vx *= 0.95;
            item.vy *= 0.95;
            item.lifetime -= deltaTime;
            
            // Attract to player
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                item.vx += (dx / dist) * 200 * deltaTime;
                item.vy += (dy / dist) * 200 * deltaTime;
            }
            
            if (this.checkCollision(item, this.player)) {
                this.inventory[item.type]++;
                item.collected = true;
            }
        });
        this.items = this.items.filter(item => !item.collected && item.lifetime > 0);

        // Update particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.lifetime -= deltaTime;
            p.alpha = p.lifetime / p.maxLifetime;
            return p.lifetime > 0;
        });

        // Spawn new targets and obstacles
        const now = Date.now();
        if (now - this.lastTargetSpawn > this.targetSpawnRate) {
            this.spawnTarget();
            this.lastTargetSpawn = now;
        }
        if (now - this.lastObstacleSpawn > this.obstacleSpawnRate) {
            this.spawnObstacle();
            this.lastObstacleSpawn = now;
        }
    }

    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.size || 10) + (obj2.size || 10);
    }

    createExplosion(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: `hsl(${Math.random() * 60}, 100%, 50%)`,
                size: Math.random() * 5 + 2,
                lifetime: 0.5,
                maxLifetime: 0.5,
                alpha: 1
            });
        }
    }

    toggleCrafting() {
        if (this.gameState === 'crafting') {
            this.gameState = 'playing';
            const ui = document.getElementById('craftingUI');
            if (ui) ui.classList.remove('active');
        } else {
            this.gameState = 'crafting';
            this.showCraftingUI();
        }
    }

    toggleShop() {
        this.showShopUI();
    }
    
    toggleLeaderboard() {
        const ui = document.getElementById('leaderboardUI');
        if (!ui) return;
        
        if (this.gameState === 'leaderboard') {
            this.gameState = this.gameState === 'gameover' ? 'gameover' : 'playing';
            ui.classList.remove('active');
        } else {
            this.gameState = 'leaderboard';
            ui.classList.add('active');
            this.updateLeaderboardUI();
        }
    }
    
    async updateLeaderboardUI() {
        // Reload leaderboard from server
        await this.loadLeaderboardFromServer();
        
        const leaderboardList = document.getElementById('leaderboardList');
        const playerNameInput = document.getElementById('playerNameInput');
        
        if (playerNameInput) {
            playerNameInput.value = this.playerName || '';
            // Remove old listeners and add new one
            const newInput = playerNameInput.cloneNode(true);
            playerNameInput.parentNode.replaceChild(newInput, playerNameInput);
            newInput.addEventListener('change', (e) => {
                this.playerName = e.target.value.trim();
                this.savePlayerName();
            });
        }
        
        if (leaderboardList) {
            leaderboardList.innerHTML = '';
            
            if (this.leaderboard.length === 0) {
                leaderboardList.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">No scores yet. Be the first!</div>';
                return;
            }
            
            this.leaderboard.forEach((entry, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                const date = new Date(entry.date);
                const dateStr = date.toLocaleDateString();
                const isCurrentPlayer = entry.name === this.playerName;
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div>
                            <strong style="color: ${isCurrentPlayer ? '#4fc3f7' : '#4fc3f7'}; font-size: 1.1em;">
                                #${index + 1} ${entry.name} ${isCurrentPlayer ? ' (You)' : ''}
                            </strong>
                            <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">
                                Score: ${entry.score} | Level: ${entry.level} | ${dateStr}
                            </div>
                        </div>
                    </div>
                `;
                leaderboardList.appendChild(item);
            });
        }
    }

    craft(type, name) {
        const recipe = this.recipes[type][name];
        if (!recipe) return false;
        
        for (let material in recipe) {
            if (this.inventory[material] < recipe[material]) {
                return false;
            }
        }
        
        for (let material in recipe) {
            this.inventory[material] -= recipe[material];
        }
        
        if (type === 'weapons') {
            this.currentWeapon = name;
        } else if (type === 'ships') {
            this.currentShip = name;
            const ship = this.equipmentStats.ships[name];
            this.playerStats.maxHealth = ship.health;
            this.playerStats.health = Math.min(this.playerStats.health, ship.health);
            // Update base speed when changing ships
            this.playerStats.baseSpeed = ship.speed;
            // Keep speed upgrades by adjusting playerStats.speed
            const speedUpgrades = this.playerStats.speed - 150; // Original base
            this.playerStats.speed = ship.speed + speedUpgrades;
        } else if (type === 'shields') {
            this.currentShield = name;
            const shield = this.equipmentStats.shields[name];
            this.playerStats.maxShield = shield.capacity;
            this.playerStats.shield = shield.capacity;
        }
        
        this.updateStats();
        return true;
    }

    upgradeStat(stat, cost) {
        if (this.inventory.tokens < cost) {
            console.log('Not enough tokens!');
            return false;
        }
        
        this.inventory.tokens -= cost;
        
        switch(stat) {
            case 'speed':
                this.playerStats.speed += 30; // Increase by 30 each time
                console.log(`Speed upgraded! New speed: ${this.playerStats.speed}`);
                break;
            case 'fireRate':
                this.playerStats.fireRate += 0.2; // Increase fire rate
                console.log(`Fire rate upgraded! New rate: ${this.playerStats.fireRate}`);
                break;
            case 'health':
                this.playerStats.maxHealth += 25;
                this.playerStats.health += 25;
                console.log(`Health upgraded! New max: ${this.playerStats.maxHealth}`);
                break;
        }
        
        this.updateStats();
        this.updateShopUI(); // Refresh shop to show updated costs
        return true;
    }

    showCraftingUI() {
        const ui = document.getElementById('craftingUI');
        if (!ui) return;
        
        ui.classList.add('active');
        this.updateCraftingUI();
    }

    showShopUI() {
        const ui = document.getElementById('shopUI');
        if (!ui) return;
        
        if (this.gameState === 'shop') {
            this.gameState = 'playing';
            ui.classList.remove('active');
        } else {
            this.gameState = 'shop';
            ui.classList.add('active');
            this.updateShopUI();
        }
    }

    updateCraftingUI() {
        const weaponsList = document.getElementById('weaponsList');
        const shipsList = document.getElementById('shipsList');
        const shieldsList = document.getElementById('shieldsList');
        
        if (weaponsList) {
            weaponsList.innerHTML = '';
            for (let weapon in this.recipes.weapons) {
                const recipe = this.recipes.weapons[weapon];
                const canCraft = Object.keys(recipe).every(mat => this.inventory[mat] >= recipe[mat]);
                const item = document.createElement('div');
                item.className = 'craft-item';
                item.innerHTML = `
                    <div>
                        <strong style="color: #4fc3f7;">${weapon.toUpperCase()}</strong>
                        <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">
                            ${Object.keys(recipe).map(mat => `${mat}: ${recipe[mat]}`).join(', ')}
                        </div>
                    </div>
                    <button class="craft-btn" ${!canCraft ? 'disabled' : ''} onclick="game.craft('weapons', '${weapon}'); game.updateCraftingUI();">
                        Craft
                    </button>
                `;
                weaponsList.appendChild(item);
            }
        }
        
        if (shipsList) {
            shipsList.innerHTML = '';
            for (let ship in this.recipes.ships) {
                const recipe = this.recipes.ships[ship];
                const canCraft = Object.keys(recipe).every(mat => this.inventory[mat] >= recipe[mat]);
                const item = document.createElement('div');
                item.className = 'craft-item';
                item.innerHTML = `
                    <div>
                        <strong style="color: #4fc3f7;">${ship.toUpperCase()}</strong>
                        <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">
                            ${Object.keys(recipe).map(mat => `${mat}: ${recipe[mat]}`).join(', ')}
                        </div>
                    </div>
                    <button class="craft-btn" ${!canCraft ? 'disabled' : ''} onclick="game.craft('ships', '${ship}'); game.updateCraftingUI();">
                        Craft
                    </button>
                `;
                shipsList.appendChild(item);
            }
        }
        
        if (shieldsList) {
            shieldsList.innerHTML = '';
            for (let shield in this.recipes.shields) {
                const recipe = this.recipes.shields[shield];
                const canCraft = Object.keys(recipe).every(mat => this.inventory[mat] >= recipe[mat]);
                const item = document.createElement('div');
                item.className = 'craft-item';
                item.innerHTML = `
                    <div>
                        <strong style="color: #4fc3f7;">${shield.toUpperCase()}</strong>
                        <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">
                            ${Object.keys(recipe).map(mat => `${mat}: ${recipe[mat]}`).join(', ')}
                        </div>
                    </div>
                    <button class="craft-btn" ${!canCraft ? 'disabled' : ''} onclick="game.craft('shields', '${shield}'); game.updateCraftingUI();">
                        Craft
                    </button>
                `;
                shieldsList.appendChild(item);
            }
        }
    }

    updateShopUI() {
        const tokenDisplay = document.getElementById('tokenDisplay');
        const upgradesList = document.getElementById('upgradesList');
        
        if (tokenDisplay) {
            tokenDisplay.textContent = this.inventory.tokens;
        }
        
        if (upgradesList) {
            upgradesList.innerHTML = '';
            // Dynamic costs that increase with each purchase
            const speedUpgrades = Math.floor((this.playerStats.speed - this.playerStats.baseSpeed) / 30);
            const fireRateUpgrades = Math.floor((this.playerStats.fireRate - this.playerStats.baseFireRate) / 0.2);
            const healthUpgrades = Math.floor((this.playerStats.maxHealth - 100) / 25);
            
            const upgrades = [
                { 
                    name: 'Speed', 
                    stat: 'speed', 
                    cost: 10 + (speedUpgrades * 5),
                    current: this.playerStats.speed,
                    description: `Current: ${this.playerStats.speed} (+${speedUpgrades * 30})`
                },
                { 
                    name: 'Fire Rate', 
                    stat: 'fireRate', 
                    cost: 15 + (fireRateUpgrades * 5),
                    current: this.playerStats.fireRate.toFixed(2),
                    description: `Current: ${this.playerStats.fireRate.toFixed(2)}/s (+${fireRateUpgrades * 0.2})`
                },
                { 
                    name: 'Health', 
                    stat: 'health', 
                    cost: 20 + (healthUpgrades * 5),
                    current: this.playerStats.maxHealth,
                    description: `Current: ${this.playerStats.maxHealth} HP (+${healthUpgrades * 25})`
                }
            ];
            
            upgrades.forEach(upgrade => {
                const canAfford = this.inventory.tokens >= upgrade.cost;
                const item = document.createElement('div');
                item.className = 'shop-item';
                item.innerHTML = `
                    <div>
                        <strong style="color: #4fc3f7;">${upgrade.name}</strong>
                        <div style="font-size: 0.85em; color: #4fc3f7; margin-top: 3px;">
                            ${upgrade.description}
                        </div>
                        <div style="font-size: 0.9em; color: #aaa; margin-top: 5px;">
                            Cost: ${upgrade.cost} tokens
                        </div>
                    </div>
                    <button class="shop-btn" ${!canAfford ? 'disabled' : ''} onclick="game.upgradeStat('${upgrade.stat}', ${upgrade.cost}); game.updateShopUI();">
                        Buy
                    </button>
                `;
                upgradesList.appendChild(item);
            });
        }
    }

    updateStats() {
        const accuracy = this.hits + this.misses > 0 
            ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) + '%'
            : '100%';
        
        const scoreEl = document.getElementById('scoreValue');
        const hitsEl = document.getElementById('hitsValue');
        const missesEl = document.getElementById('missesValue');
        const accuracyEl = document.getElementById('accuracyDisplay');
        const targetEl = document.getElementById('targetCount');
        
        if (scoreEl) scoreEl.textContent = this.score;
        if (hitsEl) hitsEl.textContent = this.hits;
        if (missesEl) missesEl.textContent = this.misses;
        if (accuracyEl) accuracyEl.textContent = accuracy;
        if (targetEl) {
            targetEl.textContent = this.mode === 'bell' ? this.pairs.length * 2 : this.targets.length;
        }
        
        // Update inventory display
        const invQuantum = document.getElementById('invQuantum');
        const invEnergy = document.getElementById('invEnergy');
        const invMetal = document.getElementById('invMetal');
        const invCrystals = document.getElementById('invCrystals');
        const invTokens = document.getElementById('invTokens');
        
        if (invQuantum) invQuantum.textContent = this.inventory.quantumParticles;
        if (invEnergy) invEnergy.textContent = this.inventory.energyCores;
        if (invMetal) invMetal.textContent = this.inventory.metalScraps;
        if (invCrystals) invCrystals.textContent = this.inventory.crystals;
        if (invTokens) invTokens.textContent = this.inventory.tokens;
        
        // Update top scores display (async load)
        this.loadTopScores().then(({ topScore, topLevel }) => {
            const topScoreEl = document.getElementById('topScoreDisplay');
            const topLevelEl = document.getElementById('topLevelDisplay');
            if (topScoreEl) topScoreEl.textContent = topScore;
            if (topLevelEl) topLevelEl.textContent = topLevel;
        });
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawStars();
        
        if (this.gameState === 'playing') {
            if (this.mode === 'bell') {
                this.drawPairs();
            } else {
                this.drawTargets();
            }
            
            this.drawObstacles();
            this.drawItems();
            this.drawBullets();
            this.drawParticles();
            this.drawPlayer();
            this.drawCrosshair();
            this.drawHUD();
            
            if (this.mode === 'ensemble') {
                this.drawEnsembleOverlay();
            }
        } else if (this.gameState === 'gameover') {
            this.drawGameOver();
        } else if (this.gameState === 'leaderboard') {
            // Still draw game in background
            this.drawStars();
            this.drawPlayer();
        }
    }

    drawStars() {
        this.ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 197.3) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }

    drawPlayer() {
        // Draw shield
        const shield = this.equipmentStats.shields[this.currentShield];
        if (shield.capacity > 0 && this.playerStats.shield > 0) {
            this.ctx.strokeStyle = `rgba(79, 195, 247, ${this.playerStats.shield / this.playerStats.maxShield})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.size + 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw ship
        this.ctx.fillStyle = '#4fc3f7';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y - this.player.size);
        this.ctx.lineTo(this.player.x - this.player.size * 0.7, this.player.y + this.player.size * 0.7);
        this.ctx.lineTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.size * 0.7, this.player.y + this.player.size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#4fc3f7';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    drawHUD() {
        // Health and Shield bars
        const barWidth = 250;
        const barHeight = 25;
        const x = 20;
        let y = this.canvas.height - 100;
        
        // Background for health bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Health bar
        const healthPercent = Math.max(0, Math.min(1, this.playerStats.health / this.playerStats.maxHealth));
        this.ctx.fillStyle = '#f44336';
        this.ctx.fillRect(x + 2, y + 2, (healthPercent * (barWidth - 4)), barHeight - 4);
        
        // Health text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`HP: ${Math.ceil(this.playerStats.health)}/${this.playerStats.maxHealth}`, x + 5, y + 18);
        
        // Shield bar
        y -= 35;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        if (this.playerStats.maxShield > 0) {
            const shieldPercent = Math.max(0, Math.min(1, this.playerStats.shield / this.playerStats.maxShield));
            this.ctx.fillStyle = '#4fc3f7';
            this.ctx.fillRect(x + 2, y + 2, (shieldPercent * (barWidth - 4)), barHeight - 4);
            
            // Shield text
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`Shield: ${Math.ceil(this.playerStats.shield)}/${this.playerStats.maxShield}`, x + 5, y + 18);
        } else {
            this.ctx.fillStyle = '#666';
            this.ctx.fillRect(x + 2, y + 2, barWidth - 4, barHeight - 4);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText('Shield: None', x + 5, y + 18);
        }
        
        // Level and Tokens
        y -= 40;
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`Level ${this.level}`, x, y);
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Tokens: ${this.inventory.tokens}`, x, y + 20);
    }

    drawTargets() {
        this.targets.forEach(target => {
            this.ctx.fillStyle = target.color;
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = target.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawPairs() {
        this.pairs.forEach(pair => {
            this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(pair.a.x, pair.a.y);
            this.ctx.lineTo(pair.b.x, pair.b.y);
            this.ctx.stroke();

            [pair.a, pair.b].forEach(p => {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = p.color;
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            });
        });
    }

    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = obstacle.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawItems() {
        this.items.forEach(item => {
            const colors = {
                quantumParticles: '#9c27b0',
                energyCores: '#ff9800',
                metalScraps: '#757575',
                crystals: '#00bcd4'
            };
            
            this.ctx.fillStyle = colors[item.type] || '#fff';
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = colors[item.type] || '#fff';
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = bullet.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
    }

    drawCrosshair() {
        const dx = this.mouse.x - this.player.x;
        const dy = this.mouse.y - this.player.y;
        const angle = Math.atan2(dy, dx);

        this.ctx.strokeStyle = this.mode === 'ensemble' ? 'rgba(255, 193, 7, 0.5)' : 'rgba(76, 175, 80, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (this.mode === 'ensemble') {
            this.ctx.strokeStyle = 'rgba(255, 193, 7, 0.3)';
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x, this.player.y);
            this.ctx.lineTo(this.player.x + Math.cos(angle - 0.15) * 200, this.player.y + Math.sin(angle - 0.15) * 200);
            this.ctx.moveTo(this.player.x, this.player.y);
            this.ctx.lineTo(this.player.x + Math.cos(angle + 0.15) * 200, this.player.y + Math.sin(angle + 0.15) * 200);
            this.ctx.stroke();
        }

        this.ctx.strokeStyle = this.mode === 'ensemble' ? '#ffc107' : '#4caf50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouse.x - 10, this.mouse.y);
        this.ctx.lineTo(this.mouse.x + 10, this.mouse.y);
        this.ctx.moveTo(this.mouse.x, this.mouse.y - 10);
        this.ctx.lineTo(this.mouse.x, this.mouse.y + 10);
        this.ctx.stroke();
    }

    drawEnsembleOverlay() {
        this.ctx.fillStyle = 'rgba(255, 193, 7, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffc107';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('ENSEMBLE QM: Probabilistic Shooting', this.canvas.width / 2, 50);
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#f44336';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 30);
        this.ctx.fillText(`Level Reached: ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        
        // Check if this is a new high score
        const isNewHighScore = this.checkNewHighScore();
        if (isNewHighScore) {
            this.ctx.fillStyle = '#4fc3f7';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillText('NEW HIGH SCORE!', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 90);
        this.ctx.fillText('Press L to View Leaderboard', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }
    
    checkNewHighScore() {
        if (!this.playerName) {
            this.showNameInput();
            return false;
        }
        
        const currentBest = this.leaderboard.find(entry => entry.name === this.playerName);
        if (!currentBest) {
            this.submitScore();
            return true;
        }
        
        if (this.score > currentBest.score || this.level > currentBest.level) {
            this.submitScore();
            return true;
        }
        
        return false;
    }
    
    showNameInput() {
        const name = prompt('Enter your name for the leaderboard:', this.playerName || 'Player');
        if (name && name.trim()) {
            this.playerName = name.trim();
            this.savePlayerName();
            this.submitScore();
        }
    }
    
    async submitScore() {
        if (!this.playerName) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: this.playerName,
                    score: this.score,
                    level: this.level
                })
            });
            
            const data = await response.json();
            if (data.success) {
                console.log('Score submitted successfully! Rank:', data.rank);
                // Reload leaderboard to get updated list
                await this.loadLeaderboardFromServer();
            } else {
                console.error('Failed to submit score:', data.error);
                // Fallback to local storage
                this.submitScoreLocal();
            }
        } catch (error) {
            console.error('Error submitting score to server:', error);
            // Fallback to local storage
            this.submitScoreLocal();
        }
    }
    
    submitScoreLocal() {
        const existingIndex = this.leaderboard.findIndex(entry => entry.name === this.playerName);
        const entry = {
            name: this.playerName,
            score: Math.max(this.score, existingIndex >= 0 ? this.leaderboard[existingIndex].score : 0),
            level: Math.max(this.level, existingIndex >= 0 ? this.leaderboard[existingIndex].level : 0),
            date: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            this.leaderboard[existingIndex] = entry;
        } else {
            this.leaderboard.push(entry);
        }
        
        this.leaderboard.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.level - a.level;
        });
        
        this.leaderboard = this.leaderboard.slice(0, 10);
        this.saveLeaderboardLocal();
    }
    
    loadPlayerName() {
        try {
            return localStorage.getItem('bellGamePlayerName') || '';
        } catch (e) {
            return '';
        }
    }
    
    savePlayerName() {
        try {
            localStorage.setItem('bellGamePlayerName', this.playerName);
        } catch (e) {
            console.error('Failed to save player name:', e);
        }
    }
    
    async loadLeaderboardFromServer() {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard`);
            const data = await response.json();
            if (data.success) {
                this.leaderboard = data.leaderboard || [];
                this.updateStats();
            }
        } catch (error) {
            console.error('Failed to load leaderboard from server:', error);
            // Fallback to localStorage
            this.leaderboard = this.loadLeaderboardLocal();
        }
    }
    
    async loadTopScores() {
        try {
            const response = await fetch(`${this.apiUrl}/leaderboard/top`);
            const data = await response.json();
            if (data.success) {
                return { topScore: data.topScore, topLevel: data.topLevel };
            }
        } catch (error) {
            console.error('Failed to load top scores:', error);
        }
        return { topScore: 0, topLevel: 1 };
    }
    
    loadLeaderboardLocal() {
        try {
            const stored = localStorage.getItem('bellGameLeaderboard');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveLeaderboardLocal() {
        try {
            localStorage.setItem('bellGameLeaderboard', JSON.stringify(this.leaderboard));
        } catch (e) {
            console.error('Failed to save leaderboard:', e);
        }
    }

    gameLoop() {
        const now = performance.now();
        const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    console.log('Starting Beyond Bell Space Shooter...');
    try {
        const game = new SpaceShooterGame();
        window.game = game;
        console.log('Game initialized!');
        console.log('Controls: WASD to move, Click/Space to shoot, C for crafting, S for shop');
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading game. Check console.');
    }
});
