import { Bot } from './bots.js';
import { randomChoice } from './utilities.js';

export class TDMManager {
  constructor(scene, level, materials, soundEngine, effects, hud, player, weapons) {
    this.scene = scene;
    this.level = level;
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.hud = hud;
    this.player = player;
    this.weapons = weapons;

    this.teamSize = 4; // 4, 8, or 12 per team
    this.targetScore = 30; // 30 (4v4), 50 (8v8), 75 (12v12)
    this.matchDuration = 600; // 10 mins
    this.matchTime = this.matchDuration;

    this.blueScore = 0;
    this.redScore = 0;
    this.isMatchOver = false;

    this.bots = [];
    this.botBullets = [];

    // Player respawn state
    this.playerRespawnTimer = 0;
    this.isPlayerRespawning = false;
  }

  startMatch(teamSize = 4, difficulty = 'medium') {
    this.teamSize = teamSize;
    this.difficulty = difficulty;
    this.targetScore = teamSize === 4 ? 30 : (teamSize === 8 ? 50 : 75);
    this.matchTime = this.matchDuration;
    this.blueScore = 0;
    this.redScore = 0;
    this.isMatchOver = false;
    this.playerRespawnTimer = 0;
    this.isPlayerRespawning = false;

    this.clearBots();

    // Spawn Blue Team Bots (teamSize - 1, since player is on Blue Team)
    const blueBotNames = ['Ghost', 'Soap', 'Price', 'Gaz', 'Roach', 'Yuri', 'Frost', 'Sandman', 'Grinch', 'Truck', 'Archer'];
    for (let i = 0; i < this.teamSize - 1; i++) {
      const name = blueBotNames[i % blueBotNames.length] + (i >= blueBotNames.length ? ` ${i}` : '');
      const spawnPos = this.level.blueSpawnPoints[i % this.level.blueSpawnPoints.length];
      const bot = new Bot(i, name, 'BLUE', spawnPos, this.materials, this.soundEngine, this.effects, this.level);
      if (bot.setDifficulty) bot.setDifficulty(this.difficulty);
      this.wireBotEvents(bot);
      this.bots.push(bot);
      this.scene.add(bot.group);
    }

    // Spawn Red Team Bots (teamSize bots)
    const redBotNames = ['Makarov', 'Zakaev', 'Krueger', 'Nikto', 'Bale', 'Minotaur', 'Yegor', 'Rodion', 'Otter', 'Mace', 'Velikan', 'Syd'];
    for (let i = 0; i < this.teamSize; i++) {
      const name = redBotNames[i % redBotNames.length] + (i >= redBotNames.length ? ` ${i}` : '');
      const spawnPos = this.level.redSpawnPoints[i % this.level.redSpawnPoints.length];
      const bot = new Bot(100 + i, name, 'RED', spawnPos, this.materials, this.soundEngine, this.effects, this.level);
      if (bot.setDifficulty) bot.setDifficulty(this.difficulty);
      this.wireBotEvents(bot);
      this.bots.push(bot);
      this.scene.add(bot.group);
    }

    // Spawn Player at Blue base
    const pSpawn = this.level.blueSpawnPoints[0];
    this.player.position.copy(pSpawn).setY(1.8);
    this.player.reset();

    // Update HUD
    this.hud.setTDMMode(true);
    this.hud.updateTDMScore(this.blueScore, this.redScore, this.targetScore);
    this.hud.showWaveBanner(`TDM: ${this.teamSize} VS ${this.teamSize}`, `FIRST TO ${this.targetScore} WINS`);
  }

  wireBotEvents(bot) {
    bot.onBotKilled = (victim, attacker, isHeadshot) => {
      let killerName = 'INSURGENT';
      let killerTeam = victim.team === 'RED' ? 'BLUE' : 'RED';
      let weaponName = 'Assault Rifle';

      if (attacker === this.player) {
        killerName = (this.player.callsign || 'OPERATOR').toUpperCase();
        killerTeam = 'BLUE';
        weaponName = this.weapons ? this.weapons.getActiveWeapon().name : 'Rifle';
      } else if (attacker && attacker.name) {
        killerName = attacker.name;
        killerTeam = attacker.team || killerTeam;
      }

      // Add real-time tactical kill feed entry
      if (this.hud && this.hud.addTacticalKillEntry) {
        this.hud.addTacticalKillEntry(killerName, victim.name, weaponName, isHeadshot, killerTeam, victim.team);
      }

      if (victim.team === 'RED') {
        this.blueScore++;
        if (attacker === this.player) {
          this.hud.addScore(100 + (isHeadshot ? 50 : 0));
          this.hud.showKillPopup(victim.name, isHeadshot, 100);
        }
      } else {
        this.redScore++;
      }

      this.hud.updateTDMScore(this.blueScore, this.redScore, this.targetScore);
      this.checkMatchEnd();
    };
  }

  handlePlayerKilled(killer = null) {
    this.redScore++;
    this.hud.updateTDMScore(this.blueScore, this.redScore, this.targetScore);

    const killerName = (killer && killer.name) ? killer.name : 'INSURGENT';
    const playerName = (this.player.callsign || 'OPERATOR').toUpperCase();

    // Add kill feed entry for player death
    if (this.hud && this.hud.addTacticalKillEntry) {
      this.hud.addTacticalKillEntry(killerName, playerName, 'Assault Rifle', false, 'RED', 'BLUE');
    }

    // Show tactical elimination death banner with countdown
    if (this.hud && this.hud.showEliminatedBanner) {
      this.hud.showEliminatedBanner(killerName, 'Assault Rifle', 3.0);
    }

    this.checkMatchEnd();

    if (!this.isMatchOver) {
      this.isPlayerRespawning = true;
      this.playerRespawnTimer = 3.0;
      this.hud.showWaveBanner('RESPAWNING IN 3...', 'PREPARE TO RE-ENTER ARENA');
    }
  }

  checkMatchEnd() {
    if (this.isMatchOver) return;

    if (this.blueScore >= this.targetScore) {
      this.isMatchOver = true;
      this.soundEngine.playWaveComplete();
      this.hud.showWaveBanner('VICTORY!', `BLUE TEAM WINS ${this.blueScore} - ${this.redScore}`);
      setTimeout(() => this.showMatchEnd(), 2500);
    } else if (this.redScore >= this.targetScore) {
      this.isMatchOver = true;
      this.hud.showWaveBanner('DEFEAT!', `RED TEAM WINS ${this.redScore} - ${this.blueScore}`);
      setTimeout(() => this.showMatchEnd(), 2500);
    }
  }

  showMatchEnd() {
    if (this.onMatchEnded) {
      this.onMatchEnded({
        winner: this.blueScore >= this.targetScore ? 'BLUE' : 'RED',
        blueScore: this.blueScore,
        redScore: this.redScore,
        playerKills: this.player.kills || 0,
        playerDeaths: this.player.deaths || 0
      });
    }
  }

  update(delta) {
    if (this.isMatchOver) return;

    // Match Timer
    this.matchTime = Math.max(0, this.matchTime - delta);

    // Player Respawn Timer
    if (this.isPlayerRespawning) {
      this.playerRespawnTimer -= delta;
      if (this.playerRespawnTimer <= 0) {
        this.isPlayerRespawning = false;
        const pSpawn = randomChoice(this.level.blueSpawnPoints);
        this.player.position.copy(pSpawn).setY(1.8);
        this.player.reset();
        this.hud.showWaveBanner('DEPLOYED!', 'WATCH YOUR CORNERS');
      }
    }

    // Update Bots
    for (const bot of this.bots) {
      bot.update(delta, this.bots, this.player, this.botBullets);

      // Handle bot respawn
      if (bot.canRespawn) {
        bot.canRespawn = false;
        const spawnPoints = bot.team === 'BLUE' ? this.level.blueSpawnPoints : this.level.redSpawnPoints;
        const spawn = randomChoice(spawnPoints);
        bot.respawn(spawn);
      }
    }

    // Update Bot Bullets
    for (let i = this.botBullets.length - 1; i >= 0; i--) {
      const b = this.botBullets[i];
      b.update(delta, this.player, this.bots, this.level, this.effects, this.scene);
      if (b.dead) {
        this.botBullets.splice(i, 1);
      }
    }
  }

  clearBots() {
    this.bots.forEach(b => b.cleanup(this.scene));
    this.botBullets.forEach(b => b.destroy(this.scene));
    this.bots = [];
    this.botBullets = [];
  }

  reset() {
    this.clearBots();
    this.blueScore = 0;
    this.redScore = 0;
    this.isMatchOver = false;
  }
}
