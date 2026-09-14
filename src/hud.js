export class HUD {
  constructor() {
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

    this.score = 0;
    this.isTDM = false;
    this.hitmarkerTimeout = null;
    this.waveBannerTimeout = null;
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
  }

  hide() {
    if (this.hudContainer) this.hudContainer.style.display = 'none';
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

  // Render hand-drawn tally marks (e.g. |||| |||| ||)
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

    // Reload prompt when empty or low
    if (this.reloadPrompt) {
      this.reloadPrompt.style.display = (weapon.currentAmmo === 0 && weapon.reserveAmmo > 0) ? 'block' : 'none';
    }

    // Active slot indicator
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

  reset() {
    this.setScore(0);
    this.updateHp(100);
    if (this.killFeed) this.killFeed.innerHTML = '';
  }
}
