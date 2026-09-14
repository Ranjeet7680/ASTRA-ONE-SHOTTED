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
    this.waveBanner = document.getElementById('wave-banner');
    this.waveBannerTitle = document.getElementById('wave-banner-title');
    this.waveBannerSubtitle = document.getElementById('wave-banner-subtitle');

    this.slots = [
      document.getElementById('slot-1'),
      document.getElementById('slot-2'),
      document.getElementById('slot-3'),
      document.getElementById('slot-4')
    ];

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
    this.updateGyroBadge();
  }

  hide() {
    if (this.hudContainer) this.hudContainer.style.display = 'none';
    if (this.damageCanvas) this.damageCanvas.style.display = 'none';
    if (this.inkContainer) this.inkContainer.style.display = 'none';
    if (this.healingVignette) this.healingVignette.classList.remove('active');
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

    if (this.reloadPrompt) {
      this.reloadPrompt.style.display = (weapon.currentAmmo === 0 && weapon.reserveAmmo > 0) ? 'block' : 'none';
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

  showKillPopup(enemyType, isHeadshot, scoreGain) {
    if (!this.killFeed) return;

    const item = document.createElement('div');
    item.className = 'kill-item' + (isHeadshot ? ' headshot' : '');
    item.textContent = isHeadshot ? `HEADSHOT! +${scoreGain}` : `KILL +${scoreGain}`;

    this.killFeed.appendChild(item);
    setTimeout(() => {
      if (item.parentNode) item.parentNode.removeChild(item);
    }, 1200);
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

  // Directional damage arcs update
  update(delta) {
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
}
