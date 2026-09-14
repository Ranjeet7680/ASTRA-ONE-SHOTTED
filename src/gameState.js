export class GameStateManager {
  constructor(game) {
    this.game = game;
    this.currentState = 'SPLASH';

    // Screens & Overlays
    this.screenSplash = document.getElementById('screen-splash');
    this.screenLoading = document.getElementById('screen-loading');
    this.screenAuth = document.getElementById('screen-auth');
    this.screenPubgLobby = document.getElementById('screen-pubg-lobby');
    this.screenMainMenu = document.getElementById('screen-main-menu');
    this.screenPause = document.getElementById('screen-pause');
    this.screenGameOver = document.getElementById('screen-game-over');

    // Modals
    this.modalHowToPlay = document.getElementById('modal-how-to-play');
    this.modalSettings = document.getElementById('modal-settings');
    this.modalModeSelect = document.getElementById('modal-mode-select');
    this.modalGunsmith = document.getElementById('modal-gunsmith');
    this.modalCharacter = document.getElementById('modal-character');

    // Loading Bar Elements
    this.loadingBar = document.getElementById('game-loading-bar');
    this.loadingStatus = document.getElementById('loading-status-text');
    this.loadingTip = document.getElementById('loading-tip-text');

    // Lobby Elements
    this.lobbyAvatar = document.getElementById('lobby-avatar');
    this.lobbyName = document.getElementById('lobby-name');
    this.lobbyLevel = document.getElementById('lobby-level');
    this.lobbyRank = document.getElementById('lobby-rank');
    this.lobbyBp = document.getElementById('lobby-bp');
    this.lobbyModeTitle = document.getElementById('lobby-mode-title');

    // Stats on Game Over
    this.goScore = document.getElementById('go-score');
    this.goWave = document.getElementById('go-wave');
    this.goKills = document.getElementById('go-kills');
    this.goHeadshots = document.getElementById('go-headshots');

    // Settings inputs
    this.settingSens = document.getElementById('setting-sens');
    this.settingMasterVol = document.getElementById('setting-master-vol');
    this.settingSfxVol = document.getElementById('setting-sfx-vol');
    this.settingFov = document.getElementById('setting-fov');

    this.activeGunsmithWeapon = 2; // Default Rifle

    this.selectedModeConfig = {
      mode: 'tdm',
      teamSize: 4,
      mapSize: 'small',
      title: 'TDM 4v4: COURTYARD BLITZ'
    };

    this.splashAdvanced = false;
    this.tips = [
      'Slide canceling with SPACE immediately resets sprint acceleration.',
      'Mantle over obstacles by pressing SPACE while facing waist/chest walls.',
      'Health begins regenerating automatically after 10 seconds without taking damage.',
      'Fragmentation grenades bounce once before detonating with high AoE ink shrapnel.',
      'Headshots deal 2.5x lethal blueprint damage — line up crosshairs carefully!',
      'Customize weapon attachments in the Gunsmith for tighter recoil and zoom optics.'
    ];

    this.setupListeners();
    this.initStartup();
  }

  initStartup() {
    // Hide all combat and menu screens
    if (this.screenMainMenu) this.screenMainMenu.style.display = 'none';
    if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
    if (this.screenPause) this.screenPause.style.display = 'none';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.screenAuth) this.screenAuth.style.display = 'none';
    if (this.screenLoading) this.screenLoading.style.display = 'none';
    this.game.hud.hide();

    // Show Nexora Splash Screen
    this.currentState = 'SPLASH';
    if (this.screenSplash) {
      this.screenSplash.style.display = 'flex';
      this.screenSplash.style.opacity = '1';

      const advance = () => {
        if (this.splashAdvanced) return;
        this.splashAdvanced = true;
        this.startLoading();
      };

      this.screenSplash.addEventListener('click', advance, { once: true });
      setTimeout(advance, 2200);
    } else {
      this.startLoading();
    }
  }

  startLoading() {
    this.currentState = 'LOADING';
    if (this.screenSplash) this.screenSplash.style.display = 'none';
    if (this.screenLoading) this.screenLoading.style.display = 'flex';

    let progress = 0;
    const startTime = performance.now();
    const duration = 2000; // 2.0s loading bar animation

    const updateLoading = () => {
      const elapsed = performance.now() - startTime;
      progress = Math.min(100, Math.round((elapsed / duration) * 100));

      if (this.loadingBar) {
        this.loadingBar.style.width = `${progress}%`;
      }

      if (this.loadingStatus) {
        if (progress < 25) {
          this.loadingStatus.textContent = `INITIALIZING THREE.JS WEBGL PIPELINE... ${progress}%`;
        } else if (progress < 50) {
          this.loadingStatus.textContent = `COMPILING PROCEDURAL BLUEPRINT SHADERS... ${progress}%`;
        } else if (progress < 75) {
          this.loadingStatus.textContent = `CALIBRATING GUNSMITH BALLISTICS & ATTACHMENTS... ${progress}%`;
        } else if (progress < 95) {
          this.loadingStatus.textContent = `SYNTHESIZING PROCEDURAL WEB AUDIO RESONANCE... ${progress}%`;
        } else {
          this.loadingStatus.textContent = `NEXORA SATELLITE UPLINK SYNCHRONIZED... 100%`;
        }
      }

      if (progress < 100) {
        requestAnimationFrame(updateLoading);
      } else {
        setTimeout(() => {
          if (this.screenLoading) this.screenLoading.style.display = 'none';

          if (this.game.auth && this.game.auth.isLoggedIn()) {
            this.showLobby();
          } else {
            this.showAuth();
          }
        }, 350);
      }
    };

    // Cycle a random tip
    if (this.loadingTip) {
      const tip = this.tips[Math.floor(Math.random() * this.tips.length)];
      this.loadingTip.textContent = tip;
    }

    requestAnimationFrame(updateLoading);
  }

  showAuth() {
    this.currentState = 'AUTH';
    if (this.screenSplash) this.screenSplash.style.display = 'none';
    if (this.screenLoading) this.screenLoading.style.display = 'none';
    if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
    if (this.screenMainMenu) this.screenMainMenu.style.display = 'none';
    if (this.screenPause) this.screenPause.style.display = 'none';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.screenAuth) this.screenAuth.style.display = 'flex';
  }

  showLobby() {
    this.currentState = 'LOBBY';
    if (this.screenSplash) this.screenSplash.style.display = 'none';
    if (this.screenLoading) this.screenLoading.style.display = 'none';
    if (this.screenAuth) this.screenAuth.style.display = 'none';
    if (this.screenMainMenu) this.screenMainMenu.style.display = 'none';
    if (this.screenPause) this.screenPause.style.display = 'none';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.game.hud) this.game.hud.hide();

    if (document.exitPointerLock) document.exitPointerLock();

    // Populate user profile data
    let user = this.game.auth ? this.game.auth.currentUser : null;
    if (!user && this.game.auth) {
      user = this.game.auth.loginAsGuest('Operator');
    }

    if (user) {
      if (this.lobbyName) this.lobbyName.textContent = user.name;
      if (this.lobbyLevel) this.lobbyLevel.textContent = `LV. ${user.level}`;
      if (this.lobbyRank) this.lobbyRank.textContent = user.rank;
      if (this.lobbyBp) this.lobbyBp.textContent = user.bp.toLocaleString();
      if (this.lobbyAvatar) this.lobbyAvatar.src = user.avatar;
    }

    if (this.lobbyModeTitle) {
      this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
    }

    // Show 3D character dais and frame camera
    if (this.game.lobby) {
      this.game.lobby.show();
    }
    this.game.camera.position.set(0, 1.4, 0);
    this.game.camera.rotation.set(0, 0, 0);

    if (this.screenPubgLobby) {
      this.screenPubgLobby.style.display = 'block';
    }
  }

  setupListeners() {
    // 1. Authentication Handlers
    const btnGoogle = document.getElementById('btn-login-google');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', () => {
        this.game.soundEngine.init();
        this.game.soundEngine.resume();
        this.game.soundEngine.playUIClick();
        if (this.game.auth) this.game.auth.loginWithGoogle();
        this.showLobby();
      });
    }

    const btnFb = document.getElementById('btn-login-fb');
    if (btnFb) {
      btnFb.addEventListener('click', () => {
        this.game.soundEngine.init();
        this.game.soundEngine.resume();
        this.game.soundEngine.playUIClick();
        if (this.game.auth) this.game.auth.loginWithFacebook();
        this.showLobby();
      });
    }

    const btnGuest = document.getElementById('btn-login-guest');
    if (btnGuest) {
      btnGuest.addEventListener('click', () => {
        this.game.soundEngine.init();
        this.game.soundEngine.resume();
        this.game.soundEngine.playUIClick();
        const input = document.getElementById('input-guest-name');
        const customName = input ? input.value : '';
        if (this.game.auth) this.game.auth.loginAsGuest(customName);
        this.showLobby();
      });
    }

    // 2. PUBG Mobile Lobby Buttons
    const btnLobbyStart = document.getElementById('btn-lobby-start');
    if (btnLobbyStart) {
      btnLobbyStart.addEventListener('click', () => {
        this.game.soundEngine.init();
        this.game.soundEngine.resume();
        this.game.soundEngine.playUIClick();
        this.game.startMode(
          this.selectedModeConfig.mode,
          this.selectedModeConfig.teamSize,
          this.selectedModeConfig.mapSize
        );
        this.startGame();
      });
    }

    const btnLobbyModeSelect = document.getElementById('btn-lobby-mode-select');
    if (btnLobbyModeSelect) {
      btnLobbyModeSelect.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'flex';
      });
    }

    const btnLobbyGunsmith = document.getElementById('btn-lobby-gunsmith');
    if (btnLobbyGunsmith) {
      btnLobbyGunsmith.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalGunsmith) this.modalGunsmith.style.display = 'flex';
        this.refreshGunsmithUI();
      });
    }

    const btnLobbyOperator = document.getElementById('btn-lobby-operator');
    if (btnLobbyOperator) {
      btnLobbyOperator.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalCharacter) this.modalCharacter.style.display = 'flex';
        this.refreshCharacterUI();
      });
    }

    const btnLobbyHud = document.getElementById('btn-lobby-hud');
    if (btnLobbyHud) {
      btnLobbyHud.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
        this.game.mobileControls.enterCustomizerMode();
      });
    }

    const btnLobbyIntel = document.getElementById('btn-lobby-intel');
    if (btnLobbyIntel) {
      btnLobbyIntel.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalHowToPlay) this.modalHowToPlay.style.display = 'flex';
      });
    }

    const btnLobbySettings = document.getElementById('btn-lobby-settings');
    if (btnLobbySettings) {
      btnLobbySettings.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalSettings) this.modalSettings.style.display = 'flex';
      });
    }

    const btnLobbyLogout = document.getElementById('btn-lobby-logout');
    if (btnLobbyLogout) {
      btnLobbyLogout.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.game.auth) this.game.auth.logout();
        if (this.game.lobby) this.game.lobby.hide();
        this.showAuth();
      });
    }

    const btnAudioToggle = document.getElementById('btn-lobby-audio-toggle');
    if (btnAudioToggle) {
      let isMuted = false;
      btnAudioToggle.addEventListener('click', () => {
        isMuted = !isMuted;
        btnAudioToggle.textContent = isMuted ? '🔇' : '🔊';
        this.game.soundEngine.setMasterVolume(isMuted ? 0 : 0.8);
      });
    }

    // 3. Mode Selection Modal Handlers
    const btnCloseMode = document.getElementById('btn-close-mode-select');
    if (btnCloseMode) {
      btnCloseMode.addEventListener('click', () => {
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    const btnModeWave = document.getElementById('btn-mode-wave');
    if (btnModeWave) {
      btnModeWave.addEventListener('click', () => {
        this.selectedModeConfig = {
          mode: 'wave',
          teamSize: 1,
          mapSize: 'small',
          title: 'WAVE SURVIVAL (ENDLESS)'
        };
        if (this.lobbyModeTitle) this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    const btnMode4v4 = document.getElementById('btn-mode-tdm-4v4');
    if (btnMode4v4) {
      btnMode4v4.addEventListener('click', () => {
        this.selectedModeConfig = {
          mode: 'tdm',
          teamSize: 4,
          mapSize: 'small',
          title: 'TDM 4v4: COURTYARD BLITZ'
        };
        if (this.lobbyModeTitle) this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    const btnMode8v8 = document.getElementById('btn-mode-tdm-8v8');
    if (btnMode8v8) {
      btnMode8v8.addEventListener('click', () => {
        this.selectedModeConfig = {
          mode: 'tdm',
          teamSize: 8,
          mapSize: 'medium',
          title: 'TDM 8v8: THE COMPOUND'
        };
        if (this.lobbyModeTitle) this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    const btnMode12v12 = document.getElementById('btn-mode-tdm-12v12');
    if (btnMode12v12) {
      btnMode12v12.addEventListener('click', () => {
        this.selectedModeConfig = {
          mode: 'tdm',
          teamSize: 12,
          mapSize: 'big',
          title: 'TDM 12v12: ARCHITECT DISTRICT'
        };
        if (this.lobbyModeTitle) this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    // 4. Mobile Customizer Hook (return to lobby when closing HUD customizer)
    if (this.game.mobileControls) {
      this.game.mobileControls.onExitCustomizer = () => {
        if (this.currentState === 'LOBBY') {
          this.showLobby();
        }
      };
    }

    // 5. Gunsmith Modal Handlers
    const btnOpenGunsmith = document.getElementById('btn-open-gunsmith');
    if (btnOpenGunsmith) {
      btnOpenGunsmith.addEventListener('click', () => {
        if (this.modalGunsmith) this.modalGunsmith.style.display = 'flex';
        this.refreshGunsmithUI();
      });
    }

    const btnCloseGunsmith = document.getElementById('btn-close-gunsmith');
    if (btnCloseGunsmith) {
      btnCloseGunsmith.addEventListener('click', () => {
        this.saveGunsmithUI();
        if (this.modalGunsmith) this.modalGunsmith.style.display = 'none';
        if (this.currentState === 'LOBBY' && this.game.lobby) {
          this.game.lobby.rebuildCharacter();
        }
      });
    }

    [0, 1, 2, 3].forEach(idx => {
      const btn = document.getElementById(`gs-wep-${idx}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.activeGunsmithWeapon = idx;
          [0, 1, 2, 3].forEach(i => {
            const b = document.getElementById(`gs-wep-${i}`);
            if (b) {
              b.style.background = i === idx ? '#162a68' : 'transparent';
              b.style.color = i === idx ? '#fff' : '#162a68';
            }
          });
          this.refreshGunsmithUI();
        });
      }
    });

    // 6. Operator Customization Modal Handlers
    const btnOpenOp = document.getElementById('btn-open-operator');
    if (btnOpenOp) {
      btnOpenOp.addEventListener('click', () => {
        if (this.modalCharacter) this.modalCharacter.style.display = 'flex';
        this.refreshCharacterUI();
      });
    }

    const btnCloseOp = document.getElementById('btn-close-character');
    if (btnCloseOp) {
      btnCloseOp.addEventListener('click', () => {
        this.saveCharacterUI();
        if (this.modalCharacter) this.modalCharacter.style.display = 'none';
        if (this.currentState === 'LOBBY' && this.game.lobby) {
          this.game.lobby.rebuildCharacter();
        }
      });
    }

    // 7. Mobile HUD Customizer from Settings & Pause
    const btnOpenHud = document.getElementById('btn-open-hud-custom');
    if (btnOpenHud) {
      btnOpenHud.addEventListener('click', () => {
        if (this.screenMainMenu) this.screenMainMenu.style.display = 'none';
        if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
        this.game.mobileControls.enterCustomizerMode();
      });
    }

    const btnSettingsHud = document.getElementById('btn-settings-hud-custom');
    if (btnSettingsHud) {
      btnSettingsHud.addEventListener('click', () => {
        if (this.modalSettings) this.modalSettings.style.display = 'none';
        if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
        if (this.screenPause) this.screenPause.style.display = 'none';
        this.game.mobileControls.enterCustomizerMode();
      });
    }

    const btnPauseCustomHud = document.getElementById('btn-pause-custom-hud');
    if (btnPauseCustomHud) {
      btnPauseCustomHud.addEventListener('click', () => {
        if (this.screenPause) this.screenPause.style.display = 'none';
        this.game.mobileControls.enterCustomizerMode();
      });
    }

    const btnToggleTouch = document.getElementById('btn-toggle-touch-controls');
    if (btnToggleTouch) {
      btnToggleTouch.addEventListener('click', () => {
        this.game.mobileControls.toggle();
      });
    }

    // 8. Info & Settings Modals
    const btnHowTo = document.getElementById('btn-how-to-play');
    if (btnHowTo) {
      btnHowTo.addEventListener('click', () => {
        if (this.modalHowToPlay) this.modalHowToPlay.style.display = 'flex';
      });
    }

    const btnCloseHowTo = document.getElementById('btn-close-how-to-play');
    if (btnCloseHowTo) {
      btnCloseHowTo.addEventListener('click', () => {
        if (this.modalHowToPlay) this.modalHowToPlay.style.display = 'none';
      });
    }

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        if (this.modalSettings) this.modalSettings.style.display = 'flex';
      });
    }

    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
      btnCloseSettings.addEventListener('click', () => {
        if (this.modalSettings) this.modalSettings.style.display = 'none';
      });
    }

    // 9. Sliders
    if (this.settingSens) {
      this.settingSens.addEventListener('input', (e) => {
        this.game.player.mouseSensitivity = parseFloat(e.target.value);
      });
    }

    if (this.settingMasterVol) {
      this.settingMasterVol.addEventListener('input', (e) => {
        this.game.soundEngine.setMasterVolume(parseFloat(e.target.value));
      });
    }

    if (this.settingSfxVol) {
      this.settingSfxVol.addEventListener('input', (e) => {
        this.game.soundEngine.setSfxVolume(parseFloat(e.target.value));
      });
    }

    if (this.settingFov) {
      this.settingFov.addEventListener('input', (e) => {
        this.game.player.baseFov = parseFloat(e.target.value);
      });
    }

    // 10. Pause Menu Buttons
    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        this.resumeGame();
      });
    }

    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) {
      btnPauseSettings.addEventListener('click', () => {
        if (this.modalSettings) this.modalSettings.style.display = 'flex';
      });
    }

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', () => {
        if (this.screenPause) this.screenPause.style.display = 'none';
        this.restartGame();
      });
    }

    const btnPauseQuit = document.getElementById('btn-pause-quit');
    if (btnPauseQuit) {
      btnPauseQuit.addEventListener('click', () => {
        if (this.screenPause) this.screenPause.style.display = 'none';
        this.showLobby();
      });
    }

    // 11. Game Over Buttons
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        if (this.screenGameOver) this.screenGameOver.style.display = 'none';
        this.restartGame();
      });
    }

    const btnGameOverMenu = document.getElementById('btn-gameover-menu');
    if (btnGameOverMenu) {
      btnGameOverMenu.addEventListener('click', () => {
        if (this.screenGameOver) this.screenGameOver.style.display = 'none';
        this.showLobby();
      });
    }

    // 12. Global Keyboard Shortcuts (Escape for Pause)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.currentState === 'PLAYING') {
          this.pauseGame();
        } else if (this.currentState === 'PAUSED') {
          if (this.modalSettings && this.modalSettings.style.display === 'flex') {
            this.modalSettings.style.display = 'none';
          } else {
            this.resumeGame();
          }
        }
      }
    });
  }

  startGame() {
    this.currentState = 'PLAYING';
    if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
    if (this.screenMainMenu) this.screenMainMenu.style.display = 'none';
    if (this.screenPause) this.screenPause.style.display = 'none';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.game.lobby) this.game.lobby.hide();

    this.game.hud.show();
    this.game.restart();
    this.game.domElement.requestPointerLock();
  }

  pauseGame() {
    this.currentState = 'PAUSED';
    if (this.screenPause) this.screenPause.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  resumeGame() {
    this.currentState = 'PLAYING';
    if (this.screenPause) this.screenPause.style.display = 'none';
    this.game.domElement.requestPointerLock();
  }

  gameOver(score, wave, kills, headshots) {
    this.currentState = 'GAME_OVER';
    if (this.goScore) this.goScore.textContent = score;
    if (this.goWave) this.goWave.textContent = wave;
    if (this.goKills) this.goKills.textContent = kills;
    if (this.goHeadshots) this.goHeadshots.textContent = headshots;

    if (this.screenGameOver) this.screenGameOver.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();

    // Reward BP to user profile
    if (this.game.auth && this.game.auth.currentUser) {
      this.game.auth.currentUser.bp += Math.floor(score / 5) + 50;
      this.game.auth.currentUser.matches++;
      this.game.auth.saveUser(this.game.auth.currentUser);
    }
  }

  restartGame() {
    this.currentState = 'PLAYING';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.screenPause) this.screenPause.style.display = 'none';
    if (this.game.lobby) this.game.lobby.hide();
    this.game.restart();
    this.game.domElement.requestPointerLock();
  }

  showMainMenu() {
    this.showLobby();
  }

  // Gunsmith UI synchronization
  refreshGunsmithUI() {
    const wepConfig = this.game.customization.config.weapons[this.activeGunsmithWeapon] || {};
    const opticEl = document.getElementById('gs-optic');
    const muzzleEl = document.getElementById('gs-muzzle');
    const gripEl = document.getElementById('gs-grip');
    const magEl = document.getElementById('gs-mag');
    const skinEl = document.getElementById('gs-skin');

    if (opticEl) opticEl.value = wepConfig.optic || 'iron';
    if (muzzleEl) muzzleEl.value = wepConfig.muzzle || 'default';
    if (gripEl) gripEl.value = wepConfig.grip || 'none';
    if (magEl) magEl.value = wepConfig.mag || 'standard';
    if (skinEl) skinEl.value = wepConfig.skin || 'blue';

    const canvas = document.getElementById('gunsmith-canvas');
    if (canvas) {
      setTimeout(() => {
        this.game.customization.renderWeaponPreview(canvas, this.activeGunsmithWeapon);
      }, 50);
    }
  }

  saveGunsmithUI() {
    const opticEl = document.getElementById('gs-optic');
    const muzzleEl = document.getElementById('gs-muzzle');
    const gripEl = document.getElementById('gs-grip');
    const magEl = document.getElementById('gs-mag');
    const skinEl = document.getElementById('gs-skin');

    this.game.customization.config.weapons[this.activeGunsmithWeapon] = {
      optic: opticEl ? opticEl.value : 'iron',
      muzzle: muzzleEl ? muzzleEl.value : 'default',
      grip: gripEl ? gripEl.value : 'none',
      mag: magEl ? magEl.value : 'standard',
      skin: skinEl ? skinEl.value : 'blue'
    };
    this.game.customization.saveConfig();
  }

  // Character Customizer UI synchronization
  refreshCharacterUI() {
    const charConfig = this.game.customization.config.character || {};
    const inkEl = document.getElementById('char-ink');
    const headEl = document.getElementById('char-headgear');
    const armorEl = document.getElementById('char-armor');

    if (inkEl) inkEl.value = charConfig.inkColor || 'blue';
    if (headEl) headEl.value = charConfig.headgear || 'visor';
    if (armorEl) armorEl.value = charConfig.armor || 'medium';

    const canvas = document.getElementById('char-canvas');
    if (canvas) {
      setTimeout(() => {
        this.game.customization.renderCharacterPreview(canvas);
      }, 50);
    }
  }

  saveCharacterUI() {
    const inkEl = document.getElementById('char-ink');
    const headEl = document.getElementById('char-headgear');
    const armorEl = document.getElementById('char-armor');

    this.game.customization.config.character = {
      inkColor: inkEl ? inkEl.value : 'blue',
      headgear: headEl ? headEl.value : 'visor',
      armor: armorEl ? armorEl.value : 'medium'
    };
    this.game.customization.saveConfig();
  }
}

