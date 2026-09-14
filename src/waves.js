import { Enemy } from './enemies.js';
import { randomChoice } from './utilities.js';

export class WaveManager {
  constructor(scene, level, materials, soundEngine, effects, hud, player, weapons) {
    this.scene = scene;
    this.level = level;
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.hud = hud;
    this.player = player;
    this.weapons = weapons;

    this.currentWave = 1;
    this.enemies = [];
    this.enemyBullets = [];

    this.enemiesRemainingToSpawn = 0;
    this.enemiesAliveCount = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 1.4;

    this.state = 'INTERMISSION'; // 'ACTIVE', 'INTERMISSION', 'GAMEOVER'
    this.intermissionTimer = 3.5;

    // Lifetime stats
    this.totalKills = 0;
    this.totalHeadshots = 0;

    // Initial announcement
    this.hud.showWaveBanner('WAVE 1', 'PREPARE YOUR WEAPONS');
  }

  // Calculate composition for a given wave
  getWavePlan(wave) {
    const totalEnemies = 4 + wave * 3; // Wave 1: 7, Wave 2: 10, Wave 3: 13, Wave 4: 16...
    const queue = [];

    for (let i = 0; i < totalEnemies; i++) {
      if (wave >= 3 && Math.random() < 0.22) {
        queue.push('heavy');
      } else if (wave >= 2 && Math.random() < 0.25) {
        queue.push('sniper');
      } else if (Math.random() < 0.45) {
        queue.push('rusher');
      } else {
        queue.push('grunt');
      }
    }

    return queue;
  }

  startWave(waveNumber) {
    this.currentWave = waveNumber;
    this.spawnQueue = this.getWavePlan(this.currentWave);
    this.enemiesRemainingToSpawn = this.spawnQueue.length;
    this.enemiesAliveCount = this.enemiesRemainingToSpawn;
    this.spawnTimer = 0.5;
    this.state = 'ACTIVE';

    this.hud.updateWave(this.currentWave);
    this.hud.updateEnemiesLeft(this.enemiesAliveCount);
    this.hud.showWaveBanner(`WAVE ${this.currentWave}`, `${this.enemiesAliveCount} HOSTILES INCOMING`);
  }

  spawnNextEnemy() {
    if (this.spawnQueue.length === 0) return;

    const type = this.spawnQueue.shift();
    this.enemiesRemainingToSpawn--;

    // Choose spawn location
    let spawnPos;
    if (type === 'sniper') {
      spawnPos = this.level.getRandomSniperPoint();
    } else {
      spawnPos = this.level.getRandomSpawnPoint();
    }

    const enemy = new Enemy(type, spawnPos, this.materials, this.soundEngine, this.effects, this.level);
    
    // Wire melee damage to player
    enemy.onPlayerMeleeHit = (dmg) => {
      this.player.takeDamage(dmg);
    };

    this.enemies.push(enemy);
    this.scene.add(enemy.group);
  }

  handleEnemyKilled(enemy, isHeadshot) {
    this.totalKills++;
    if (isHeadshot) this.totalHeadshots++;

    this.enemiesAliveCount = Math.max(0, this.enemiesAliveCount - 1);
    this.hud.updateEnemiesLeft(this.enemiesAliveCount);

    // Check if Wave Cleared
    if (this.enemiesAliveCount === 0 && this.spawnQueue.length === 0 && this.state === 'ACTIVE') {
      this.onWaveCompleted();
    }
  }

  onWaveCompleted() {
    this.state = 'INTERMISSION';
    this.intermissionTimer = 4.0;

    // Victory fanfare & HUD notification
    this.soundEngine.playWaveComplete();
    this.hud.showWaveBanner(`WAVE ${this.currentWave} CLEARED!`, 'SUPPLIES & HP REPLENISHED');

    // Reward player
    this.player.heal(30);
    this.weapons.addAmmo(30);
  }

  update(delta) {
    // 1. Intermission Countdown to next wave
    if (this.state === 'INTERMISSION') {
      this.intermissionTimer -= delta;
      if (this.intermissionTimer <= 0) {
        this.startWave(this.currentWave + 1);
      }
    }

    // 2. Spawn Enemies progressively
    if (this.state === 'ACTIVE' && this.spawnQueue.length > 0) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnNextEnemy();
        this.spawnTimer = Math.max(0.6, 1.6 - this.currentWave * 0.08);
      }
    }

    // 3. Update All Active Enemies
    const playerPos = this.player.position;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(delta, playerPos, this.enemyBullets);

      if (enemy.canRemove) {
        enemy.cleanup(this.scene);
        this.enemies.splice(i, 1);
      }
    }

    // 4. Update Enemy Projectiles
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];
      bullet.update(delta, this.player, this.level, this.effects, this.scene);
      if (bullet.dead) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  reset() {
    // Clean up all enemies and bullets
    this.enemies.forEach(e => e.cleanup(this.scene));
    this.enemyBullets.forEach(b => b.destroy(this.scene));
    this.enemies = [];
    this.enemyBullets = [];
    this.spawnQueue = [];
    this.currentWave = 1;
    this.totalKills = 0;
    this.totalHeadshots = 0;
    this.state = 'INTERMISSION';
    this.intermissionTimer = 1.0;
  }
}
