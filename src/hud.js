export class HUD {
  constructor(game = null) {
    this.game = game;
    this.hudContainer = document.getElementById('hud');
    this.scoreDisplay = document.getElementById('score-display');
    this.waveDisplay = document.getElementById('wave-display');
    this.enemiesLeftDisplay = document.getElementById('enemies-left-display');

    this.hpDisplay = document.getElementById('hp-display');
    this.hpBar = document.getElementById('hp-bar');

    this.weaponName = document.getElementById('weapon-name');
    this.weaponDesc = document.getElementById('weapon-desc');
    this.ammoCurrent = document.getElementById('ammo-current');
    this.ammoReserve = document.getElementById('ammo-reserve');
    this.ammoTally = document.getElementById('ammo-tally');
    this.reloadPrompt = document.getElementById('reload-prompt');

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
    this.damageArcs = []; // { angle, alpha, maxAlpha }

    // Screen ink splatter droplets
    this.inkContainer = document.getElementById('damage-ink-splatters');

    // 10s auto-fill healing aura vignette
    this.healingVignette = document.getElementById('healing-fill-vignette');

    this.score = 0;
    this.isTDM = false;
    this.hitmarkerTimeout = null;
    this.waveBannerTimeout = null;

    this.setupCanvasSize();
    window.addEventListener('resize', () => this.setupCanvasSize());
    this.setupActionButtons();
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

  setupActionButtons() {
    // HUD Fullscreen button
    const btnFullscreen = document.getElementById('btn-hud-fullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => {
        if (this.game && this.game.player) {
          this.game.player.toggleFullscreen();
        }
      });
    }

    // HUD Full Tactical Map button
    const btnMap = document.getElementById('btn-hud-map');
    if (btnMap) {
      btnMap.addEventListener('click', () => {
        if (this.game && this.game.minimap) {
          this.game.minimap.toggleFullMap();
        }
      });
    }

    // HUD Radio Wheel button
    const btnVoice = document.getElementById('btn-hud-voice-wheel');
    if (btnVoice) {
      btnVoice.addEventListener('click', () => {
        if (this.game && this.game.voiceChat) {
          this.game.voiceChat.toggleWheel();
        }
      });
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

  // Hand-drawn blueprint ink droplet splatters on lens
  showInkSplatter() {
    if (!this.inkContainer) return;

    const count = Math.floor(Math.random() * 2 + 2); // 2 to 3 splatters
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'ink-splatter-droplet';
      const size = Math.floor(Math.random() * 32 + 24);
      const posX = Math.floor(Math.random() * 74 + 13);
      const posY = Math.floor(Math.random() * 74 + 13);
      const rot = Math.floor(Math.random() * 360);

      drop.style.width = `${size}px`;
      drop.style.height = `${size}px`;
      drop.style.left = `${posX}%`;
      drop.style.top = `${posY}%`;
      drop.style.setProperty('--rot', `${rot}deg`);

      drop.innerHTML = `
        <svg width="100%" height="100%" viewBox="0 0 40 40">
          <path d="M20,5 C27,9 35,16 33,25 C31,33 23,36 17,34 C10,32 5,25 7,17 C9,11 14,9 20,5 Z" fill="#c9182b" opacity="0.82" />
          <circle cx="8" cy="30" r="2.5" fill="#c9182b" opacity="0.65" />
          <circle cx="32" cy="10" r="2" fill="#c9182b" opacity="0.65" />
          <circle cx="34" cy="28" r="1.5" fill="#c9182b" opacity="0.65" />
        </svg>
      `;

      this.inkContainer.appendChild(drop);

      setTimeout(() => {
        if (drop.parentNode) drop.parentNode.removeChild(drop);
      }, 850);
    }
  }

  // 10s auto-fill healing aura pulse
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
    const waveEl = document.querySelector('.hud-top-right');
    if (waveEl) waveEl.style.display = isTDM ? 'none' : 'block';
  }

  updateTDMScore(blue, red, target = 30) {
    if (this.tdmBlueScore) this.tdmBlueScore.textContent = blue;
    if (this.tdmRedScore) this.tdmRedScore.textContent = red;
    if (this.tdmTargetScore) this.tdmTargetScore.textContent = target;
  }

  updateGrenades(count) {
    if (this.grenadeCountDisplay) this.grenadeCountDisplay.textContent = count;
  }

  show() {
    if (this.hudContainer) this.hudContainer.style.display = 'block';
    if (this.damageCanvas) this.damageCanvas.style.display = 'block';
    if (this.inkContainer) this.inkContainer.style.display = 'block';
  }

  hide() {
    if (this.hudContainer) this.hudContainer.style.display = 'none';
    if (this.damageCanvas) this.damageCanvas.style.display = 'none';
    if (this.inkContainer) this.inkContainer.style.display = 'none';
    if (this.healingVignette) this.healingVignette.classList.remove('active');
  }

  setScore(val) {
    this.score = val;
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
  }

  addScore(amount) {
    this.score += amount;
    if (this.scoreDisplay) this.scoreDisplay.textContent = this.score;
  }

  updateWave(waveNum) {
    if (this.waveDisplay) this.waveDisplay.textContent = `WAVE ${waveNum}`;
  }

  updateEnemiesLeft(count) {
    if (this.enemiesLeftDisplay) this.enemiesLeftDisplay.textContent = `ENEMIES LEFT: ${count}`;
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
    }, 120);
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

  showWaveBanner(title, subtitle) {
    if (!this.waveBanner) return;
    if (this.waveBannerTimeout) clearTimeout(this.waveBannerTimeout);

    if (this.waveBannerTitle) this.waveBannerTitle.textContent = title;
    if (this.waveBannerSubtitle) this.waveBannerSubtitle.textContent = subtitle;

    this.waveBanner.classList.add('show');
    this.waveBannerTimeout = setTimeout(() => {
      this.waveBanner.classList.remove('show');
    }, 2800);
  }

  // Update loop for damage directional indicator arcs
  update(delta) {
    if (!this.damageCtx || !this.damageCanvas) return;

    const ctx = this.damageCtx;
    const w = this.damageCanvas.width;
    const h = this.damageCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.damageArcs.length === 0) return;

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.28;

    for (let i = this.damageArcs.length - 1; i >= 0; i--) {
      const arc = this.damageArcs[i];
      arc.alpha -= delta * 1.5;

      if (arc.alpha <= 0) {
        this.damageArcs.splice(i, 1);
        continue;
      }

      // Draw red directional indicator arc
      const angle = arc.angle - Math.PI / 2; // Up is forward
      const span = 0.32; // Arc width in radians

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, angle - span, angle + span);
      ctx.strokeStyle = `rgba(201, 24, 43, ${arc.alpha * 0.85})`;
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Sharp indicator chevron pointing outward
      const tipDist = radius + 14;
      const tipX = cx + Math.cos(angle) * tipDist;
      const tipY = cy + Math.sin(angle) * tipDist;

      const base1X = cx + Math.cos(angle - 0.08) * (radius + 2);
      const base1Y = cy + Math.sin(angle - 0.08) * (radius + 2);

      const base2X = cx + Math.cos(angle + 0.08) * (radius + 2);
      const base2Y = cy + Math.sin(angle + 0.08) * (radius + 2);

      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(base1X, base1Y);
      ctx.lineTo(base2X, base2Y);
      ctx.closePath();
      ctx.fillStyle = `rgba(201, 24, 43, ${arc.alpha * 0.95})`;
      ctx.fill();

      ctx.restore();
    }
  }

  reset() {
    this.setScore(0);
    this.updateHp(100);
    if (this.killFeed) this.killFeed.innerHTML = '';
    this.damageArcs = [];
    if (this.damageCtx && this.damageCanvas) {
      this.damageCtx.clearRect(0, 0, this.damageCanvas.width, this.damageCanvas.height);
    }
    if (this.inkContainer) this.inkContainer.innerHTML = '';
    this.setHealingEffect(false);
  }
}
