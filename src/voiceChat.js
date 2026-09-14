// Tactical Voice Chat & Radio Wheel (<kbd>V</kbd>)
export class VoiceChatSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.micState = 'TEAM'; // 'ALL', 'TEAM', 'MUTE'
    this.speakerState = 'ON'; // 'ON', 'MUTE'

    this.wheelModal = document.getElementById('modal-voice-wheel');
    this.radioBanner = document.getElementById('radio-chatter-banner');
    this.radioText = document.getElementById('radio-chatter-text');
    this.radioSender = document.getElementById('radio-chatter-sender');

    this.callouts = [
      { id: 'enemies', label: 'ENEMIES AHEAD!', pingType: 'danger', icon: '⚠️' },
      { id: 'backup', label: 'NEED BACKUP!', pingType: 'assist', icon: '🛡️' },
      { id: 'defend', label: 'DEFEND THIS POSITION!', pingType: 'defend', icon: '📍' },
      { id: 'hold', label: 'HOLD FIRE / SNEAK!', pingType: 'stealth', icon: '🤫' },
      { id: 'roger', label: 'AFFIRMATIVE / ROGER!', pingType: 'status', icon: '👍' },
      { id: 'cover', label: 'LAYING DOWN COVERING FIRE!', pingType: 'combat', icon: '🔥' }
    ];

    this.setupListeners();
  }

  setupListeners() {
    // Key 'V' to toggle tactical voice wheel
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyV') {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleWheel();
        }
      }
    });

    // Mobile voice chat button
    const btnMobileVoice = document.getElementById('btn-touch-voice');
    if (btnMobileVoice) {
      btnMobileVoice.addEventListener('click', () => {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleWheel();
        }
      });
    }

    // Close button on wheel
    const btnCloseWheel = document.getElementById('btn-close-voice-wheel');
    if (btnCloseWheel) {
      btnCloseWheel.addEventListener('click', () => {
        this.closeWheel();
      });
    }

    // Bind each callout button
    this.callouts.forEach((c, idx) => {
      const btn = document.getElementById(`voice-callout-${idx}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.executeCallout(c);
          this.closeWheel();
        });
      }
    });

    // Mic Toggle Button
    const btnMic = document.getElementById('btn-hud-mic');
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        if (this.micState === 'TEAM') {
          this.micState = 'ALL';
          btnMic.textContent = '🎙️ ALL';
          btnMic.style.borderColor = '#162a68';
        } else if (this.micState === 'ALL') {
          this.micState = 'MUTE';
          btnMic.textContent = '🔇 MUTE';
          btnMic.style.borderColor = '#c9182b';
        } else {
          this.micState = 'TEAM';
          btnMic.textContent = '🎙️ TEAM';
          btnMic.style.borderColor = '#2255bb';
        }
        if (this.game.soundEngine) this.game.soundEngine.playRadioChirp();
      });
    }
  }

  toggleWheel() {
    if (this.isOpen) {
      this.closeWheel();
    } else {
      this.openWheel();
    }
  }

  openWheel() {
    this.isOpen = true;
    if (this.wheelModal) this.wheelModal.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeWheel() {
    this.isOpen = false;
    if (this.wheelModal) this.wheelModal.style.display = 'none';
    if (this.game.stateManager.currentState === 'PLAYING') {
      this.game.domElement.requestPointerLock();
    }
  }

  executeCallout(callout) {
    const user = (this.game.auth && this.game.auth.currentUser) ? this.game.auth.currentUser.name : 'Operator';
    const playerPos = this.game.player.position;

    // Drop tactical ping on minimap
    if (this.game.minimap) {
      this.game.minimap.addPing(playerPos.x, playerPos.z, callout.pingType, callout.label);
    }

    // Play radio sound
    if (this.game.soundEngine) {
      this.game.soundEngine.playRadioSquelch();
      setTimeout(() => {
        this.game.soundEngine.playRadioChirp();
      }, 120);
    }

    // Show on-screen radio chatter banner
    this.showRadioBanner(user, callout.label);

    // Bot team response simulation
    if (this.game.currentMode === 'tdm') {
      setTimeout(() => {
        const botNames = ['Ghost-02', 'Viper-04', 'Spectre-06', 'Echo-08'];
        const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
        const botReplies = ['Roger that, moving to position!', 'Copy, eyes on target!', 'Covering you now!'];
        const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];
        if (this.game.soundEngine) this.game.soundEngine.playRadioSquelch();
        this.showRadioBanner(randomBot, randomReply);
      }, 1600);
    }
  }

  triggerRadioCallout(message, worldX, worldZ) {
    const user = (this.game.auth && this.game.auth.currentUser) ? this.game.auth.currentUser.name : 'Operator';
    if (this.game.soundEngine) {
      this.game.soundEngine.playRadioSquelch();
    }
    this.showRadioBanner(user, message);
  }

  showRadioBanner(sender, message) {
    if (!this.radioBanner) return;
    if (this.radioSender) this.radioSender.textContent = `[RADIO] ${sender}:`;
    if (this.radioText) this.radioText.textContent = `"${message}"`;

    this.radioBanner.style.display = 'flex';
    this.radioBanner.style.opacity = '1';

    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.radioBanner.style.opacity = '0';
      setTimeout(() => {
        this.radioBanner.style.display = 'none';
      }, 300);
    }, 3800);
  }
}
