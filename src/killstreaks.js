// Call of Duty Style Kill Reward & Killstreak System
// Tracks killstreaks, multi-kills, longshot distance, medals & score popups
import * as THREE from 'three';

export class KillstreakManager {
  constructor(game) {
    this.game = game;

    // Streak & Multikill State
    this.currentStreak = 0;
    this.lastKillTime = 0;
    this.multiKillCount = 0;
    this.multiKillWindow = 4.2; // seconds
    this.firstBloodAwarded = false;
    this.lastKilledByBotId = null;

    // Active Killstreaks
    this.uavTimeRemaining = 0;
    this.uavDuration = 25.0; // 25s radar sweep
    this.uavSweepAngle = 0;

    this.vtolTimeRemaining = 0;
    this.vtolDuration = 20.0;
    this.vtolAttackTimer = 0;
    this.vtolMesh = null;

    // Streak rewards ready to activate
    this.availableStreaks = {
      uav: false,       // 3 kills
      airstrike: false, // 5 kills
      vtol: false       // 7 kills
    };

    // DOM Medal Container
    this.medalContainer = null;
    this.streakBanner = null;

    this.initDOM();
    this.initKeybindings();
  }

  initDOM() {
    // Medal container on screen
    let container = document.getElementById('cod-medal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cod-medal-container';
      container.className = 'cod-medal-container';
      document.body.appendChild(container);
    }
    this.medalContainer = container;

    // Streak notification banner
    let banner = document.getElementById('cod-streak-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'cod-streak-banner';
      banner.className = 'cod-streak-banner';
      banner.style.display = 'none';
      document.body.appendChild(banner);
    }
    this.streakBanner = banner;

    // Streak HUD status in bottom right of HUD
    let streakHud = document.getElementById('cod-streak-hud');
    if (!streakHud) {
      streakHud = document.createElement('div');
      streakHud.id = 'cod-streak-hud';
      streakHud.className = 'cod-streak-hud';
      document.body.appendChild(streakHud);
    }
    this.streakHud = streakHud;
    this.updateStreakHud();
  }

  initKeybindings() {
    window.addEventListener('keydown', (e) => {
      if (this.game.stateManager && this.game.stateManager.currentState !== 'PLAYING') return;
      if (e.code === 'Digit5' || e.code === 'Numpad5') {
        if (this.availableStreaks.uav) this.activateUAV();
      } else if (e.code === 'Digit6' || e.code === 'Numpad6') {
        if (this.availableStreaks.airstrike) this.activateAirstrike();
      } else if (e.code === 'Digit7' || e.code === 'Numpad7') {
        if (this.availableStreaks.vtol) this.activateVTOL();
      }
    });
  }

  reset() {
    this.currentStreak = 0;
    this.lastKillTime = 0;
    this.multiKillCount = 0;
    this.firstBloodAwarded = false;
    this.lastKilledByBotId = null;
    this.uavTimeRemaining = 0;
    this.vtolTimeRemaining = 0;
    if (this.vtolMesh) {
      this.game.scene.remove(this.vtolMesh);
      this.vtolMesh = null;
    }
    this.availableStreaks = { uav: false, airstrike: false, vtol: false };
    this.updateStreakHud();
  }

  onPlayerDeath(killerBot = null) {
    this.currentStreak = 0;
    this.multiKillCount = 0;
    if (killerBot) {
      this.lastKilledByBotId = killerBot.id || killerBot.name;
    }
    this.updateStreakHud();
  }

  // Handle enemy kill event
  onKill(victim, isHeadshot = false, distance = 10) {
    const now = performance.now() / 1000;
    this.currentStreak++;

    // Multikill check
    if (now - this.lastKillTime < this.multiKillWindow) {
      this.multiKillCount++;
    } else {
      this.multiKillCount = 1;
    }
    this.lastKillTime = now;

    // 1. Play COD Kill Stinger
    if (this.game.soundEngine && this.game.soundEngine.playKillStinger) {
      this.game.soundEngine.playKillStinger();
    }

    // 2. Award Medals
    // A. FIRST BLOOD
    if (!this.firstBloodAwarded) {
      this.firstBloodAwarded = true;
      this.awardMedal({
        id: 'first_blood',
        name: 'FIRST BLOOD',
        xp: 100,
        icon: '🩸',
        color: '#c9182b',
        announcer: 'First Blood!'
      });
    }

    // B. HEADSHOT
    if (isHeadshot) {
      this.awardMedal({
        id: 'headshot',
        name: 'HEADSHOT',
        xp: 50,
        icon: '🎯',
        color: '#e62238',
        announcer: 'Headshot!'
      });
    }

    // C. LONGSHOT (> 28m)
    if (distance > 28) {
      this.awardMedal({
        id: 'longshot',
        name: 'LONGSHOT',
        sub: `${Math.round(distance)}M`,
        xp: 50,
        icon: '🔭',
        color: '#2b499d',
        announcer: 'Longshot!'
      });
    } else if (distance < 3.8) {
      // POINT BLANK
      this.awardMedal({
        id: 'point_blank',
        name: 'POINT BLANK',
        xp: 25,
        icon: '💥',
        color: '#d97706',
        announcer: 'Point Blank!'
      });
    }

    // D. MULTIKILLS
    if (this.multiKillCount === 2) {
      this.awardMedal({
        id: 'double_kill',
        name: 'DOUBLE KILL',
        xp: 100,
        icon: '⚡',
        color: '#f59e0b',
        announcer: 'Double Kill!'
      });
    } else if (this.multiKillCount === 3) {
      this.awardMedal({
        id: 'triple_kill',
        name: 'TRIPLE KILL',
        xp: 150,
        icon: '🔥',
        color: '#ef4444',
        announcer: 'Triple Kill!'
      });
    } else if (this.multiKillCount >= 4) {
      this.awardMedal({
        id: 'fury_kill',
        name: 'FURY KILL',
        xp: 250,
        icon: '💀',
        color: '#8b5cf6',
        announcer: 'Fury Kill!'
      });
    }

    // E. REVENGE
    if (victim && this.lastKilledByBotId && (victim.id === this.lastKilledByBotId || victim.name === this.lastKilledByBotId)) {
      this.lastKilledByBotId = null;
      this.awardMedal({
        id: 'revenge',
        name: 'REVENGE',
        xp: 50,
        icon: '🗡️',
        color: '#c9182b',
        announcer: 'Revenge!'
      });
    }

    // F. BUZZKILL (if enemy had streak)
    if (victim && victim.killstreak && victim.killstreak >= 3) {
      this.awardMedal({
        id: 'buzzkill',
        name: 'BUZZKILL',
        xp: 100,
        icon: '🛑',
        color: '#10b981',
        announcer: 'Buzzkill!'
      });
    }

    // 3. Check Killstreak Milestones
    if (this.currentStreak === 3 && !this.availableStreaks.uav) {
      this.unlockStreak('uav', 'UAV RECON RADAR', 'KEY [5]', 1);
    } else if (this.currentStreak === 5 && !this.availableStreaks.airstrike) {
      this.unlockStreak('airstrike', 'TACTICAL AIRSTRIKE', 'KEY [6]', 2);
    } else if (this.currentStreak === 7 && !this.availableStreaks.vtol) {
      this.unlockStreak('vtol', 'VTOL WARSHIP', 'KEY [7]', 3);
    }

    this.updateStreakHud();
  }

  unlockStreak(type, name, keybind, tier) {
    this.availableStreaks[type] = true;
    if (this.game.soundEngine && this.game.soundEngine.playStreakFanfare) {
      this.game.soundEngine.playStreakFanfare(tier);
    }
    this.showStreakBanner(`KILLSTREAK: ${this.currentStreak}`, `${name} READY • PRESS ${keybind}`);
    this.speakAnnouncer(`${name} ready for deployment!`);
  }

  showStreakBanner(title, subtitle) {
    if (!this.streakBanner) return;
    this.streakBanner.innerHTML = `
      <div class="streak-title">${title}</div>
      <div class="streak-sub">${subtitle}</div>
    `;
    this.streakBanner.style.display = 'block';
    this.streakBanner.classList.remove('animate-streak');
    void this.streakBanner.offsetWidth; // reflow
    this.streakBanner.classList.add('animate-streak');

    clearTimeout(this._streakTimer);
    this._streakTimer = setTimeout(() => {
      if (this.streakBanner) this.streakBanner.style.display = 'none';
    }, 4000);
  }

  // Display Animated COD Medal Popup
  awardMedal(badge) {
    if (this.game.hud && this.game.hud.addScore) {
      this.game.hud.addScore(badge.xp);
    }

    if (badge.announcer) {
      this.speakAnnouncer(badge.announcer);
    }

    if (!this.medalContainer) return;

    const el = document.createElement('div');
    el.className = 'cod-medal-card';
    el.innerHTML = `
      <div class="medal-emblem" style="border-color: ${badge.color};">
        <span class="medal-icon">${badge.icon}</span>
      </div>
      <div class="medal-details">
        <div class="medal-name" style="color: ${badge.color};">${badge.name}</div>
        ${badge.sub ? `<div class="medal-sub">${badge.sub}</div>` : ''}
        <div class="medal-xp">+${badge.xp} XP</div>
      </div>
    `;

    this.medalContainer.appendChild(el);

    // Fade out and remove after 2.8s
    setTimeout(() => {
      el.classList.add('fade-out');
      setTimeout(() => el.remove(), 400);
    }, 2400);
  }

  // Voice Announcer Synthesis
  speakAnnouncer(text) {
    try {
      if ('speechSynthesis' in window) {
        // Cancel prior voice if too crowded
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.15;
        utterance.pitch = 0.95;
        utterance.volume = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      // Audio speech fallback
    }
  }

  // 1. ACTIVATE UAV
  activateUAV() {
    if (!this.availableStreaks.uav) return;
    this.availableStreaks.uav = false;
    this.uavTimeRemaining = this.uavDuration;
    this.updateStreakHud();

    if (this.game.soundEngine && this.game.soundEngine.playUAVPing) {
      this.game.soundEngine.playUAVPing();
    }
    this.showStreakBanner('RECON OVERWATCH', 'FRIENDLY UAV ONLINE (25s) — RADAR SWEEP ACTIVE');
    this.speakAnnouncer('Friendly UAV is online, scanning perimeter!');
  }

  isUAVActive() {
    return this.uavTimeRemaining > 0;
  }

  // 2. ACTIVATE AIRSTRIKE
  activateAirstrike() {
    if (!this.availableStreaks.airstrike) return;
    this.availableStreaks.airstrike = false;
    this.updateStreakHud();

    this.showStreakBanner('TACTICAL ORDNANCE', 'TACTICAL AIRSTRIKE INBOUND!');
    this.speakAnnouncer('Tactical Airstrike inbound, stand clear of the impact zone!');

    if (this.game.soundEngine && this.game.soundEngine.playAirStrikeBomb) {
      this.game.soundEngine.playAirStrikeBomb();
    }

    // Determine target location: player forward or hostile concentration
    const forward = new THREE.Vector3();
    this.game.camera.getWorldDirection(forward);
    const centerPos = this.game.player.position.clone().addScaledVector(forward, 24);
    centerPos.y = 0;

    // Cluster bombardment: 3 bombs spaced 0.6s apart
    for (let b = 0; b < 3; b++) {
      setTimeout(() => {
        if (!this.game || this.game.stateManager.currentState !== 'PLAYING') return;

        const bombOffset = new THREE.Vector3(
          (b - 1) * 8 + (Math.random() - 0.5) * 4,
          0,
          (b - 1) * 6 + (Math.random() - 0.5) * 4
        );
        const impactPos = centerPos.clone().add(bombOffset);

        // Heavy screen shake & explosive crater dust
        if (this.game.effects) {
          this.game.effects.addTrauma(0.65);
          this.game.effects.createSurfaceImpact(impactPos, new THREE.Vector3(0, 1, 0));
        }

        // Damage all enemies in blast radius (14m)
        const targets = this.game.currentMode === 'wave' ? (this.game.waves ? this.game.waves.enemies : []) : (this.game.tdm ? this.game.tdm.bots : []);
        targets.forEach(tgt => {
          if (tgt.isDead || tgt.team === 'BLUE') return;
          const pos = tgt.getWorldBodyCenter ? tgt.getWorldBodyCenter() : tgt.position;
          const dist = pos.distanceTo(impactPos);
          if (dist < 14) {
            const dmg = Math.round(180 * (1 - dist / 14));
            tgt.takeDamage(dmg, false);
            if (tgt.isDead) {
              this.onKill(tgt, false, dist);
            }
          }
        });
      }, 800 + b * 600);
    }
  }

  // 3. ACTIVATE VTOL WARSHIP
  activateVTOL() {
    if (!this.availableStreaks.vtol) return;
    this.availableStreaks.vtol = false;
    this.vtolTimeRemaining = this.vtolDuration;
    this.vtolAttackTimer = 0;
    this.updateStreakHud();

    this.showStreakBanner('AIR COMBAT OVERWATCH', 'FRIENDLY VTOL WARSHIP IN THE AO (20s)');
    this.speakAnnouncer('Friendly VTOL Warship entering airspace. Providing close air support!');

    if (this.game.soundEngine && this.game.soundEngine.playStreakFanfare) {
      this.game.soundEngine.playStreakFanfare(3);
    }

    // Spawn 3D VTOL hovering high above
    this.spawnVTOLMesh();
  }

  spawnVTOLMesh() {
    if (this.vtolMesh) this.game.scene.remove(this.vtolMesh);

    const vtolGroup = new THREE.Group();
    // Fuselage
    const bodyGeom = new THREE.BoxGeometry(6, 1.8, 12);
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x162a68 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    vtolGroup.add(body);

    // Wings & Rotors
    const wingGeom = new THREE.BoxGeometry(16, 0.4, 3);
    const wing = new THREE.Mesh(wingGeom, bodyMat);
    wing.position.set(0, 0.4, -1);
    vtolGroup.add(wing);

    // Twin nacelles
    const nacelleGeom = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8);
    nacelleGeom.rotateX(Math.PI / 2);
    [-7, 7].forEach(x => {
      const nacelle = new THREE.Mesh(nacelleGeom, bodyMat);
      nacelle.position.set(x, 0.4, -1);
      vtolGroup.add(nacelle);
    });

    vtolGroup.position.set(0, 32, 0);
    this.game.scene.add(vtolGroup);
    this.vtolMesh = vtolGroup;
  }

  update(delta) {
    // 1. Update UAV
    if (this.uavTimeRemaining > 0) {
      this.uavTimeRemaining -= delta;
      this.uavSweepAngle += delta * 3.5; // Radar sweep rotation
      if (this.uavTimeRemaining <= 0) {
        this.speakAnnouncer('Friendly UAV recon bingo fuel, leaving the area.');
      }
    }

    // 2. Update VTOL Warship
    if (this.vtolTimeRemaining > 0 && this.vtolMesh) {
      this.vtolTimeRemaining -= delta;

      // Circle overhead
      const time = performance.now() * 0.0006;
      this.vtolMesh.position.x = Math.cos(time) * 22;
      this.vtolMesh.position.z = Math.sin(time) * 22;
      this.vtolMesh.rotation.y = -time + Math.PI / 2;

      // Auto-cannon firing down at enemies
      this.vtolAttackTimer += delta;
      if (this.vtolAttackTimer >= 1.6) {
        this.vtolAttackTimer = 0;
        this.vtolFireAtNearestEnemy();
      }

      if (this.vtolTimeRemaining <= 0) {
        this.game.scene.remove(this.vtolMesh);
        this.vtolMesh = null;
        this.speakAnnouncer('VTOL Winchester on ammo, RTB.');
      }
    }
  }

  vtolFireAtNearestEnemy() {
    const targets = this.game.currentMode === 'wave' ? (this.game.waves ? this.game.waves.enemies : []) : (this.game.tdm ? this.game.tdm.bots : []);
    let nearest = null;
    let minDist = 999;

    targets.forEach(tgt => {
      if (tgt.isDead || tgt.team === 'BLUE') return;
      const pos = tgt.getWorldBodyCenter ? tgt.getWorldBodyCenter() : tgt.position;
      const dist = pos.distanceTo(this.vtolMesh.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = tgt;
      }
    });

    if (nearest && this.vtolMesh) {
      const startPos = this.vtolMesh.position.clone();
      const endPos = nearest.getWorldBodyCenter ? nearest.getWorldBodyCenter() : nearest.position;

      // Tracer
      if (this.game.effects) {
        this.game.effects.createTracer(startPos, endPos);
        this.game.effects.createSurfaceImpact(endPos, new THREE.Vector3(0, 1, 0));
        this.game.effects.addTrauma(0.2);
      }

      // Damage
      nearest.takeDamage(75, false);
      if (nearest.isDead) {
        this.onKill(nearest, false, 30);
      }

      if (this.game.soundEngine && this.game.soundEngine.playRifleShot) {
        this.game.soundEngine.playRifleShot();
      }
    }
  }

  updateStreakHud() {
    if (!this.streakHud) return;
    this.streakHud.innerHTML = `
      <div class="streak-counter">STREAK: <strong>${this.currentStreak}</strong></div>
      <div class="streak-slots">
        <div class="streak-badge ${this.availableStreaks.uav ? 'ready' : (this.currentStreak >= 3 ? 'ready' : '')}" id="streak-badge-uav" title="3 Kills: UAV Recon [5]">
          <span class="badge-icon">📡</span>
          <span class="badge-lbl">3: UAV</span>
        </div>
        <div class="streak-badge ${this.availableStreaks.airstrike ? 'ready' : (this.currentStreak >= 5 ? 'ready' : '')}" id="streak-badge-airstrike" title="5 Kills: Airstrike [6]">
          <span class="badge-icon">✈️</span>
          <span class="badge-lbl">5: STRIKE</span>
        </div>
        <div class="streak-badge ${this.availableStreaks.vtol ? 'ready' : (this.currentStreak >= 7 ? 'ready' : '')}" id="streak-badge-vtol" title="7 Kills: VTOL Warship [7]">
          <span class="badge-icon">🚁</span>
          <span class="badge-lbl">7: VTOL</span>
        </div>
      </div>
    `;

    // Click/touch listeners on streak badges for mobile activation
    const uavBtn = document.getElementById('streak-badge-uav');
    if (uavBtn) uavBtn.onclick = () => this.activateUAV();
    const airBtn = document.getElementById('streak-badge-airstrike');
    if (airBtn) airBtn.onclick = () => this.activateAirstrike();
    const vtolBtn = document.getElementById('streak-badge-vtol');
    if (vtolBtn) vtolBtn.onclick = () => this.activateVTOL();
  }
}
