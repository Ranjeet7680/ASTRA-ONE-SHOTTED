import { lerp } from './utilities.js';

// Professional Blueprint HUD Manager for ASTRA: One Shotted
// Manages 6-digit score display, Gyroscope status badge, Collapsible Weapon Bar,
// Directional damage indicators, Crosshair state transitions, and Temporary wave banners.

export class HUD {
  constructor(game = null) {
    this.game = game;
    this.hudContainer = document.getElementById('hud');
    this.scoreDisplay = document.getElementById('score-display');
    this.gyroBadge = document.getElementById('hud-gyro-badge');
    this.gyroText = document.getElementById('hud-gyro-text');

    this.waveDisplay = document.getElementById('wave-display');
    this.enemiesLeftDisplay = document.getElementById('enemies-left-display');
    this.hpDisplay = document.getElementById('hp-display');
    this.hpBar = document.getElementById('hp-bar');

    // Weapon Collapsible Elements
    this.weaponBar = document.getElementById('hud-weapon-bar');
    this.weaponPill = document.getElementById('hud-weapon-pill');
    this.weaponPillName = document.getElementById('weapon-pill-name');
    this.weaponPillAmmo = document.getElementById('weapon-pill-ammo');
    this.weaponCards = document.getElementById('hud-weapon-cards');
    this.weaponName = document.getElementById('weapon-name');
    this.weaponDesc = document.getElementById('weapon-desc');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.ammoTally = document.getElementById('ammo-tally');
    this.reloadPrompt = document.getElementById('reload-prompt');

    this.crosshair = document.getElementById('crosshair');
    this.hitmarker = document.getElementById('hitmarker');
    this.killFeed = document.getElementById('kill-feed');
    this.tacticalKillFeed = document.getElementById('tactical-kill-feed');
    this.eliminatedBanner = document.getElementById('player-eliminated-banner');
    this.elimKillerText = document.getElementById('elim-killer-text');
    this.elimStatusText = document.getElementById('elim-status-text');
    this.elimCountdownInterval = null;

    this.waveBanner = document.getElementById('wave-banner');
    this.waveBannerTitle = document.getElementById('wave-banner-title');
    this.waveBannerSubtitle = document.getElementById('wave-banner-subtitle');

    this.slots = [
      document.getElementById('slot-1'),
      document.getElementById('slot-2'),
      document.getElementById('slot-3'),
      document.getElementById('slot-4'),
      document.getElementById('slot-5')
    ];

    // Live Telemetry Displays
    this.timerDisplay = document.getElementById('match-timer-display');
    this.fpsDisplay = document.getElementById('fps-display');
    this.pingDisplay = document.getElementById('ping-display');
    this.fireModeBtn = document.getElementById('hud-fire-mode-btn');
    this.compassDisplay = document.getElementById('hud-compass-text');
    this.ammoFillBadge = document.getElementById('hud-ammo-fill-badge');
    this.lowHealthWarning = document.getElementById('hud-low-health-warning');
    this.lootPickupCard = document.getElementById('hud-loot-pickup-card');

    // Dynamic Crosshair lines
    this.crosshairLines = {
      top: this.crosshair ? this.crosshair.querySelector('.crosshair-line.top') : null,
      bottom: this.crosshair ? this.crosshair.querySelector('.crosshair-line.bottom') : null,
      left: this.crosshair ? this.crosshair.querySelector('.crosshair-line.left') : null,
      right: this.crosshair ? this.crosshair.querySelector('.crosshair-line.right') : null
    };
    this.crosshairSpread = 0;

    // Performance & Match Timers
    this.matchDuration = 0;
    this.fpsTimer = 0;
    this.frameCount = 0;
    this.fps = 60;
    this.recentKills = []; // timestamps for multikill detection

    // TDM HUD elements
    this.tdmScoreBar = document.getElementById('tdm-score-bar');
    this.tdmBlueScore = document.getElementById('tdm-blue-score');
    this.tdmRedScore = document.getElementById('tdm-red-score');
    this.tdmTargetScore = document.getElementById('tdm-target-score');
    this.grenadeCountDisplay = document.getElementById('grenade-count');

    // Directional damage indicator canvas
    this.damageCanvas = document.getElementById('damage-direction-canvas');
    this.damageCtx = this.damageCanvas ? this.damageCanvas.getContext('2d') : null;
    this.damageArcs = [];

    // Screen ink splatter droplets
    this.inkContainer = document.getElementById('damage-ink-splatters');

    // 10s auto-fill healing aura vignette
    this.healingVignette = document.getElementById('healing-fill-vignette');

    this.score = 0;
    this.isTDM = false;
    this.hitmarkerTimeout = null;
    this.waveBannerTimeout = null;
    this.weaponExpandTimeout = null;
    this.isWeaponExpanded = false;

    this.setupCanvasSize();
    window.addEventListener('resize', () => this.setupCanvasSize());
    this.setupWeaponBarInteractions();
    this.setupGyroBadge();
  }

  setGame(game) {
    this.game = game;
  }

  setupCanvasSize() {
    if (this.damageCanvas) {
      this.damageCanvas.width = window.innerWidth;
      this.damageCanvas.height = window.innerHeight;
    }
  }

  setupWeaponBarInteractions() {
    if (this.weaponPill) {
      this.weaponPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleWeaponBar();
      });
    }

    // Interactive 10s Ammo Refill Badge (manual tap to instant resupply/refill)
    if (this.ammoFillBadge) {
      this.ammoFillBadge.style.cursor = 'pointer';
      this.ammoFillBadge.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (this.game && this.game.weapons) {
          this.game.weapons.refillAmmo(true);
          this.showAmmoFilledPulse();
          if (navigator.vibrate) navigator.vibrate(20);
        }
      });
    }

    // Interactive Fire Mode Switcher (AUTO / BURST / SINGLE)
    if (this.fireModeBtn) {
      this.fireModeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game && this.game.weapons) {
          const modes = ['AUTO', 'BURST', 'SINGLE'];
          const current = this.game.weapons.fireMode || 'AUTO';
          const nextIdx = (modes.indexOf(current) + 1) % modes.length;
          const nextMode = modes[nextIdx];
          this.game.weapons.fireMode = nextMode;
          this.fireModeBtn.textContent = `${nextMode} ▾`;
          if (navigator.vibrate) navigator.vibrate(10);
        }
      });
    }

    // Tap on Reload prompt or Ammo counter to trigger reload / refill
    const triggerReloadOrRefill = (e) => {
      e.stopPropagation();
      if (this.game && this.game.weapons) {
        this.game.weapons.reload();
        if (navigator.vibrate) navigator.vibrate(15);
      }
    };

    if (this.reloadPrompt) {
      this.reloadPrompt.style.cursor = 'pointer';
      this.reloadPrompt.addEventListener('pointerdown', triggerReloadOrRefill);
    }
    if (this.ammoCurrent) {
      this.ammoCurrent.style.cursor = 'pointer';
      this.ammoCurrent.addEventListener('pointerdown', triggerReloadOrRefill);
    }
    if (this.weaponPillAmmo) {
      this.weaponPillAmmo.style.cursor = 'pointer';
      this.weaponPillAmmo.addEventListener('pointerdown', triggerReloadOrRefill);
    }

    this.slots.forEach((slot, index) => {
      if (slot) {
        slot.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.game && this.game.weapons) {
            this.game.weapons.switchWeapon(index);
          }
          this.collapseWeaponBarDelayed(1500);
        });
      }
    });
  }

  toggleWeaponBar() {
    if (this.isWeaponExpanded) {
      this.collapseWeaponBar();
    } else {
      this.expandWeaponBar();
    }
  }

  expandWeaponBar() {
    this.isWeaponExpanded = true;
    if (this.weaponCards) {
      this.weaponCards.classList.add('expanded');
    }
    if (this.weaponPill) {
      this.weaponPill.classList.add('open');
    }
    this.collapseWeaponBarDelayed(2500);
  }

  collapseWeaponBarDelayed(ms = 2500) {
    if (this.weaponExpandTimeout) clearTimeout(this.weaponExpandTimeout);
    this.weaponExpandTimeout = setTimeout(() => {
      this.collapseWeaponBar();
    }, ms);
  }

  collapseWeaponBar() {
    this.isWeaponExpanded = false;
    if (this.weaponCards) {
      this.weaponCards.classList.remove('expanded');
    }
    if (this.weaponPill) {
      this.weaponPill.classList.remove('open');
    }
  }

  setupGyroBadge() {
    if (!this.gyroBadge) return;
    this.gyroBadge.addEventListener('click', () => {
      if (!this.game || !this.game.inputManager) return;
      const im = this.game.inputManager;
      im.setGyroEnabled(!im.gyroEnabled);
      this.updateGyroBadge();
    });
  }

  updateGyroBadge() {
    if (!this.gyroBadge || !this.game || !this.game.inputManager) return;
    const isEnabled = this.game.inputManager.gyroEnabled;
    if (isEnabled) {
      this.gyroBadge.classList.add('active');
      if (this.gyroText) this.gyroText.textContent = 'GYRO ON';
    } else {
      this.gyroBadge.classList.remove('active');
      if (this.gyroText) this.gyroText.textContent = 'GYRO OFF';
    }
  }

  // Crosshair state transition when targeting enemy
  setCrosshairEnemyTarget(isEnemy) {
    if (!this.crosshair) return;
    if (isEnemy) {
      this.crosshair.classList.add('target-enemy');
    } else {
      this.crosshair.classList.remove('target-enemy');
    }
  }

  // Directional damage indicator arc
  showDirectionalDamage(relativeAngle) {
    this.damageArcs.push({
      angle: relativeAngle,
      alpha: 1.0,
      maxAlpha: 1.0
    });
    this.showInkSplatter();
  }

  // Blueprint red ink droplet splatters
  showInkSplatter() {
    if (!this.inkContainer) return;
    const count = Math.floor(Math.random() * 2 + 2);
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'ink-splatter-droplet';
      const size = Math.floor(Math.random() * 30 + 22);
      const posX = Math.floor(Math.random() * 70 + 15);
      const posY = Math.floor(Math.random() * 70 + 15);
      const rot = Math.floor(Math.random() * 360);

      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${posX}%`;
      drop.style.top = `${posY}%`;
      drop.style.transform = `rotate(${rot}deg)`;

      drop.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 40 40">
          <path d="M20,5 C27,9 35,16 33,25 C31,33 23,36 17,34 C10,32 5,25 7,17 C9,11 14,9 20,5 Z" fill="#c9182b" opacity="0.85" />
          <circle cx="8" cy="30" r="2.5" fill="#c9182b" opacity="0.7" />
          <circle cx="32" cy="10" r="2" fill="#c9182b" opacity="0.7" />
        </svg>
      `;

      this.inkContainer.appendChild(drop);
      setTimeout(() => {
        if (drop.parentNode) drop.parentNode.removeChild(drop);
      }, 850);
    }
  }

  setHealingEffect(active) {
    if (!this.healingVignette) return;
    if (active) {
      this.healingVignette.classList.add('active');
    } else {
      this.healingVignette.classList.remove('active');
    }
  }

  setTDMMode(isTDM) {
    this.isTDM = isTDM;
    if (this.tdmScoreBar) this.tdmScoreBar.style.display = isTDM ? 'flex' : 'none';
    const waveEl = document.getElementById('hud-wave-center-pill');
    if (waveEl) waveEl.style.display = isTDM ? 'none' : 'inline-flex';
  }

  updateTDMScore(blue, red, target = 30) {
    const pad = (n) => String(n).padStart(2, '0');
    if (this.tdmBlueScore) this.tdmBlueScore.textContent = pad(blue);
    if (this.tdmRedScore) this.tdmRedScore.textContent = pad(red);
    if (this.tdmTargetScore) this.tdmTargetScore.textContent = pad(target);
  }

  updateGrenades(count) {
    if (this.grenadeCountDisplay) this.grenadeCountDisplay.textContent = count;
    if (this.game && this.game.mobileControls) {
      this.game.mobileControls.updateGrenades(count);
    }
  }

  show() {
    if (this.hudContainer) this.hudContainer.style.display = 'block';
    if (this.damageCanvas) this.damageCanvas.style.display = 'block';
    if (this.inkContainer) this.inkContainer.style.display = 'block';
    if (this.tacticalKillFeed) this.tacticalKillFeed.style.display = 'flex';
    const streakHud = document.getElementById('cod-streak-hud');
    if (streakHud) streakHud.style.display = 'block';
    const medalContainer = document.getElementById('cod-medal-container');
    if (medalContainer) medalContainer.style.display = 'flex';
    this.updateGyroBadge();
  }

  hide() {
    if (this.hudContainer) this.hudContainer.style.display = 'none';
    if (this.damageCanvas) this.damageCanvas.style.display = 'none';
    if (this.inkContainer) this.inkContainer.style.display = 'none';
    if (this.healingVignette) this.healingVignette.classList.remove('active');
    if (this.tacticalKillFeed) this.tacticalKillFeed.style.display = 'none';
    this.hideEliminatedBanner();
    const streakHud = document.getElementById('cod-streak-hud');
    if (streakHud) streakHud.style.display = 'none';
    const medalContainer = document.getElementById('cod-medal-container');
    if (medalContainer) medalContainer.style.display = 'none';
  }

  // 6-digit formatted score (e.g. SCORE 001250)
  setScore(val) {
    this.score = val;
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = String(this.score).padStart(6, '0');
    }
  }

  addScore(amount) {
    this.score += amount;
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = String(this.score).padStart(6, '0');
    }
  }

  updateWave(waveNum) {
    if (this.waveDisplay) {
      this.waveDisplay.textContent = `WAVE ${String(waveNum).padStart(2, '0')}`;
    }
  }

  updateEnemiesLeft(count) {
    if (this.enemiesLeftDisplay) {
      this.enemiesLeftDisplay.textContent = `ENEMIES ${String(count).padStart(2, '0')}`;
    }
  }

  updateHp(hp, maxHp = 100) {
    if (this.hpDisplay) this.hpDisplay.textContent = Math.round(hp);
    if (this.hpBar) {
      const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
      this.hpBar.style.width = `${pct}%`;
      if (pct <= 30) {
        this.hpBar.classList.add('danger');
      } else {
        this.hpBar.classList.remove('danger');
      }
    }
    if (this.lowHealthWarning) {
      this.lowHealthWarning.style.display = (hp > 0 && hp <= 25) ? 'flex' : 'none';
    }
  }

  generateTallyMarks(count) {
    let tallies = '';
    const fives = Math.floor(count / 5);
    const rem = count % 5;
    for (let i = 0; i < fives; i++) {
      tallies += '||||/ ';
    }
    for (let j = 0; j < rem; j++) {
      tallies += '|';
    }
    return tallies.trim();
  }

  updateWeapon(weapon, activeIndex) {
    if (!weapon) return;

    // Collapsed Pill Update
    if (this.weaponPillName) this.weaponPillName.textContent = weapon.name;
    if (this.weaponPillAmmo) {
      this.weaponPillAmmo.textContent = `${weapon.currentAmmo} / ${weapon.reserveAmmo}`;
    }

    // Standard Desktop Display
    if (this.weaponName) this.weaponName.textContent = weapon.name;
    if (this.weaponDesc) this.weaponDesc.textContent = weapon.desc;
    if (this.ammoCurrent) this.ammoCurrent.textContent = weapon.currentAmmo;
    if (this.ammoReserve) this.ammoReserve.textContent = weapon.reserveAmmo;
    if (this.ammoTally) this.ammoTally.textContent = this.generateTallyMarks(weapon.currentAmmo);

    // Live Ammo Fill Countdown Indicator
    if (this.ammoFillBadge && this.game && this.game.weapons) {
      const timeLeft = Math.ceil(this.game.weapons.getRefillTimeLeft ? this.game.weapons.getRefillTimeLeft() : 0);
      if (timeLeft <= 0) {
        this.ammoFillBadge.innerHTML = '<span>⚡ REFILL READY</span>';
      } else {
        this.ammoFillBadge.innerHTML = `<span>⚡ REFILL (${timeLeft}s)</span>`;
      }
    }

    if (this.reloadPrompt) {
      if (weapon.currentAmmo === 0) {
        if (weapon.reserveAmmo > 0) {
          const isTouch = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
          this.reloadPrompt.textContent = isTouch ? '⚡ TAP TO RELOAD' : '[R] TO RELOAD';
        } else {
          this.reloadPrompt.textContent = '⚡ TAP TO REFILL AMMO';
        }
        this.reloadPrompt.style.display = 'block';
      } else {
        this.reloadPrompt.style.display = 'none';
      }
    }

    this.slots.forEach((slot, idx) => {
      if (slot) {
        if (idx === activeIndex) {
          slot.classList.add('active');
        } else {
          slot.classList.remove('active');
        }
      }
    });
  }

  onWeaponSwitched(weapon, activeIndex) {
    this.updateWeapon(weapon, activeIndex);
    this.expandWeaponBar(); // Auto-expand when switching weapons, collapsing after 2.5s
  }

  showHitmarker(isCrit = false) {
    if (!this.hitmarker) return;
    if (this.hitmarkerTimeout) clearTimeout(this.hitmarkerTimeout);

    if (isCrit) {
      this.hitmarker.classList.add('crit');
    } else {
      this.hitmarker.classList.remove('crit');
    }

    this.hitmarker.classList.add('active');
    this.hitmarkerTimeout = setTimeout(() => {
      this.hitmarker.classList.remove('active');
    }, 130);
  }

  showKillPopup(enemyType, isHeadshot, scoreGain = 100) {
    if (!this.killFeed) return;

    const now = performance.now();
    this.recentKills.push(now);
    // Keep kills within 4.5 seconds for multi-kill combo
    this.recentKills = this.recentKills.filter(t => now - t <= 4500);
    const combo = this.recentKills.length;

    const item = document.createElement('div');
    item.className = 'kill-item' + (isHeadshot ? ' headshot' : '');
    if (isHeadshot) {
      item.innerHTML = `
        <div style="font-size: 11px; letter-spacing: 2.5px; font-weight: 800; color: #c9182b;">HEADSHOT</div>
        <div style="font-size: 20px; font-weight: 800; color: #c9182b;">+${scoreGain || 250}</div>
      `;
    } else {
      item.innerHTML = `
        <div style="font-size: 10px; letter-spacing: 1.5px; font-weight: 700; opacity: 0.85;">ELIMINATION</div>
        <div style="font-size: 17px; font-weight: 800; color: #162a68;">+${scoreGain || 100}</div>
      `;
    }

    this.killFeed.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 1200);

    // Multi-Kill Combo Announcement
    if (combo >= 2) {
      const mk = document.createElement('div');
      mk.className = 'kill-item headshot';
      mk.style.cssText = `
        background: #162a68;
        color: #faf8f2;
        border: 2px solid #c9182b;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 2px;
      `;
      let text = 'DOUBLE KILL';
      if (combo === 3) text = 'TRIPLE KILL';
      else if (combo === 4) text = 'QUAD KILL';
      else if (combo >= 5) text = 'MULTI KILL 🔥';
      mk.textContent = text;
      this.killFeed.appendChild(mk);
      setTimeout(() => {
        if (mk.parentNode) mk.parentNode.removeChild(mk);
      }, 1400);
    }
  }

  showAmmoFilledPulse() {
    if (this.ammoFillBadge) {
      this.ammoFillBadge.classList.add('pulse');
      setTimeout(() => {
        this.ammoFillBadge.classList.remove('pulse');
      }, 1800);
    }
  }

  showKillAmmoReward(reward) {
    if (!reward) return;

    // 1. Highlight Ammo Counters in glowing green
    const flashEls = [this.ammoCurrent, this.weaponPillAmmo, this.ammoReserve];
    flashEls.forEach(el => {
      if (el) {
        el.style.transition = 'color 0.15s ease, transform 0.15s ease';
        el.style.color = '#00aa55';
        el.style.fontWeight = '900';
        setTimeout(() => {
          el.style.color = '';
        }, 900);
      }
    });

    // 2. Add floating Scavenger Ammo reward popup to killfeed / center
    if (this.killFeed) {
      const item = document.createElement('div');
      item.className = 'kill-item ammo-reward';
      item.style.cssText = `
        background: rgba(0, 170, 85, 0.92);
        color: #ffffff;
        border: 2px solid #162a68;
        box-shadow: 0 3px 8px rgba(0, 170, 85, 0.45);
        padding: 4px 12px;
        border-radius: 6px;
        font-family: 'Space Mono', monospace;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: killSlideIn 0.25s ease-out;
      `;
      const headBonus = reward.isHeadshot ? ' (HEADSHOT +50%)' : '';
      item.innerHTML = `
        <span style="font-size: 14px;">⚡</span>
        <div>
          <div style="font-size: 11px; font-weight: 800; letter-spacing: 1px;">AMMO REPLENISHED${headBonus}</div>
          <div style="font-size: 13px; font-weight: 800;">+${reward.totalActiveGain} ${reward.weaponName} ROUNDS</div>
        </div>
      `;
      this.killFeed.appendChild(item);
      setTimeout(() => {
        if (item.parentNode) item.parentNode.removeChild(item);
      }, 1400);
    }
  }

  getWeaponIconHtml(weaponName) {
    const w = (weaponName || '').toLowerCase();
    if (w.includes('sniper')) {
      return `︻╦╤─`;
    } else if (w.includes('shotgun')) {
      return `💥`;
    } else if (w.includes('pistol')) {
      return `︻╦-`;
    } else if (w.includes('grenade')) {
      return `💣`;
    } else if (w.includes('melee') || w.includes('knife') || w.includes('slash')) {
      return `🗡️`;
    }
    return `🔫`; // Assault Rifle / Carbine
  }

  // Real-Time Tactical Kill Record (COD / PUBG style below minimap)
  addTacticalKillEntry(killerName, victimName, weaponName = 'Rifle', isHeadshot = false, killerTeam = 'BLUE', victimTeam = 'RED') {
    if (!this.tacticalKillFeed) return;

    const entry = document.createElement('div');
    entry.className = 'kill-feed-entry';

    const weaponIcon = this.getWeaponIconHtml(weaponName);
    const killerClass = killerTeam === 'BLUE' ? 'kf-killer-blue' : 'kf-killer-red';
    const victimClass = victimTeam === 'BLUE' ? 'kf-victim-blue' : 'kf-victim-red';

    entry.innerHTML = `
      <span class="${killerClass}">${killerName}</span>
      <span class="kf-weapon-badge">${weaponIcon}</span>
      ${isHeadshot ? '<span class="kf-headshot-skull" title="HEADSHOT">💀</span>' : ''}
      <span class="${victimClass}">${victimName}</span>
      <span class="kf-dead-tag">DEAD 💀</span>
    `;

    this.tacticalKillFeed.appendChild(entry);

    // Keep max 5 entries at a time
    while (this.tacticalKillFeed.children.length > 5) {
      this.tacticalKillFeed.removeChild(this.tacticalKillFeed.firstElementChild);
    }

    // Auto fade-out after 3.8s
    setTimeout(() => {
      entry.classList.add('fade-out');
      setTimeout(() => {
        if (entry.parentNode) entry.parentNode.removeChild(entry);
      }, 400);
    }, 3800);
  }

  // Tactical Elimination Death Banner with Live Respawn Countdown
  showEliminatedBanner(killerName, weaponName = 'RIFLE', seconds = 3) {
    if (!this.eliminatedBanner) return;
    if (this.elimCountdownInterval) clearInterval(this.elimCountdownInterval);

    if (this.elimKillerText) {
      this.elimKillerText.textContent = `ELIMINATED BY ${killerName.toUpperCase()} • ${weaponName.toUpperCase()}`;
    }

    let remaining = seconds;
    if (this.elimStatusText) {
      this.elimStatusText.textContent = `💀 STATUS: DEAD • RESPAWNING IN ${remaining}...`;
    }
    this.eliminatedBanner.style.display = 'block';

    this.elimCountdownInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        if (this.elimStatusText) {
          this.elimStatusText.textContent = `💀 STATUS: DEAD • RESPAWNING IN ${remaining}...`;
        }
      } else {
        clearInterval(this.elimCountdownInterval);
        this.hideEliminatedBanner();
      }
    }, 1000);
  }

  hideEliminatedBanner() {
    if (this.elimCountdownInterval) {
      clearInterval(this.elimCountdownInterval);
      this.elimCountdownInterval = null;
    }
    if (this.eliminatedBanner) {
      this.eliminatedBanner.style.display = 'none';
    }
  }

  // Temporary Wave Banner - Auto hides after 1.5s (never stays permanently!)
  showWaveBanner(title, subtitle) {
    if (!this.waveBanner) return;
    if (this.waveBannerTimeout) clearTimeout(this.waveBannerTimeout);

    if (this.waveBannerTitle) this.waveBannerTitle.textContent = title;
    if (this.waveBannerSubtitle) this.waveBannerSubtitle.textContent = subtitle;

    this.waveBanner.classList.add('show');
    this.waveBannerTimeout = setTimeout(() => {
      this.waveBanner.classList.remove('show');
    }, 1500); // 1.5 seconds clean temporary display
  }

  reset() {
    this.setScore(0);
    this.collapseWeaponBar();
    if (this.waveBanner) this.waveBanner.classList.remove('show');
    if (this.healingVignette) this.healingVignette.classList.remove('active');
  }

  // Contextual Ground Loot Pickup Panel in HUD
  updateLootCard(items) {
    if (!this.lootPickupCard) return;
    if (!items || items.length === 0) {
      this.lootPickupCard.style.display = 'none';
      return;
    }

    const first = items[0];
    const nameEl = this.lootPickupCard.querySelector('.loot-card-name');
    const subEl = this.lootPickupCard.querySelector('.loot-card-sub');
    if (nameEl) nameEl.textContent = first.name;
    if (subEl) subEl.textContent = first.sub;
    this.lootPickupCard.style.display = 'flex';
  }

  // Directional damage arcs & Live Telemetry update
  update(delta) {
    // 1. Match Duration Timer (MM:SS)
    this.matchDuration += delta;
    if (this.timerDisplay) {
      const mins = Math.floor(this.matchDuration / 60);
      const secs = Math.floor(this.matchDuration % 60);
      this.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // 2. Live FPS Calculation
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `${this.fps} FPS`;
      }
    }

    // 3. Live Compass Heading
    if (this.compassDisplay && this.game && this.game.player) {
      let deg = Math.round((-this.game.player.yaw * 180 / Math.PI) % 360);
      if (deg < 0) deg += 360;

      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const dirIndex = Math.round(deg / 45) % 8;
      this.compassDisplay.textContent = `${String(deg).padStart(3, '0')}° ${directions[dirIndex]}`;
    }

    // 4. Dynamic Crosshair Expansion & Recoil
    if (this.crosshair && this.game && this.game.player) {
      const p = this.game.player;
      const isMoving = p.keys.forward || p.keys.backward || p.keys.left || p.keys.right;
      const isSprinting = p.keys.sprint || p.isTacSprinting;
      const isShooting = p.isShooting;
      const isAiming = p.isAiming;

      let targetSpread = 0;
      if (isShooting) targetSpread += 14;
      if (isSprinting) targetSpread += 10;
      else if (isMoving) targetSpread += 5;
      if (isAiming) targetSpread -= 3;

      this.crosshairSpread = lerp(this.crosshairSpread, targetSpread, delta * 14);
      const sp = Math.max(0, this.crosshairSpread);

      if (this.crosshairLines.top) this.crosshairLines.top.style.transform = `translateX(-50%) translateY(-${sp}px)`;
      if (this.crosshairLines.bottom) this.crosshairLines.bottom.style.transform = `translateX(-50%) translateY(${sp}px)`;
      if (this.crosshairLines.left) this.crosshairLines.left.style.transform = `translateY(-50%) translateX(-${sp}px)`;
      if (this.crosshairLines.right) this.crosshairLines.right.style.transform = `translateY(-50%) translateX(${sp}px)`;
    }

    // 5. Directional Damage Indicators Canvas
    if (!this.damageCtx || !this.damageCanvas) return;

    const ctx = this.damageCtx;
    const w = this.damageCanvas.width;
    const h = this.damageCanvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.damageArcs.length === 0) return;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.38;

    for (let i = this.damageArcs.length - 1; i >= 0; i--) {
      const arc = this.damageArcs[i];
      arc.alpha -= delta * 1.8;

      if (arc.alpha <= 0) {
        this.damageArcs.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(cx, cy);

      const drawAngle = -arc.angle - Math.PI / 2;
      const arcSpan = 0.55;

      ctx.beginPath();
      ctx.arc(0, 0, radius, drawAngle - arcSpan / 2, drawAngle + arcSpan / 2);
      ctx.strokeStyle = `rgba(201, 24, 43, ${arc.alpha * 0.85})`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      const tipAngle = drawAngle;
      const tipX = Math.cos(tipAngle) * (radius - 16);
      const tipY = Math.sin(tipAngle) * (radius - 16);

      ctx.beginPath();
      ctx.fillStyle = `rgba(201, 24, 43, ${arc.alpha * 0.95})`;
      ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  setAimAssistLock(isLocked, confidence = 1.0) {
    if (!this.crosshair) return;
    if (isLocked) {
      this.crosshair.classList.add('aim-locked');
      if (!this.lockIndicator) {
        this.lockIndicator = document.createElement('div');
        this.lockIndicator.id = 'hud-aim-lock-brackets';
        this.lockIndicator.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          border: 2px dashed #00ff88;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.85;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
          transition: all 0.15s ease;
        `;
        if (this.crosshair.parentNode) {
          this.crosshair.parentNode.appendChild(this.lockIndicator);
        }
      }
      if (this.lockIndicator) {
        this.lockIndicator.style.display = 'block';
        this.lockIndicator.style.borderColor = confidence > 0.6 ? '#00e5ff' : '#00ff88';
        this.lockIndicator.style.transform = `translate(-50%, -50%) scale(${1.0 - (1.0 - confidence) * 0.25})`;
      }
    } else {
      this.crosshair.classList.remove('aim-locked');
      if (this.lockIndicator) {
        this.lockIndicator.style.display = 'none';
      }
    }
  }
}
