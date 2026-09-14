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
    this.screenMatchmaking = document.getElementById('screen-matchmaking');

    // Modals
    this.modalHowToPlay = document.getElementById('modal-how-to-play');
    this.modalSettings = document.getElementById('modal-settings');
    this.modalModeSelect = document.getElementById('modal-mode-select');
    this.modalGunsmith = document.getElementById('modal-gunsmith');
    this.modalCharacter = document.getElementById('modal-character');
    this.modalPlayerProfile = document.getElementById('modal-player-profile');
    this.modalPostMatch = document.getElementById('modal-post-match');

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
      squadSize: 4,
      teamPreference: 'auto',
      title: 'TDM 4v4 (SQUAD): COURTYARD BLITZ'
    };
    this.mmTimers = [];

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
    if (this.screenMatchmaking) this.screenMatchmaking.style.display = 'none';
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
    if (this.screenMatchmaking) this.screenMatchmaking.style.display = 'none';
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
    if (this.game.bgm) {
      this.game.bgm.fadeIn(1000);
      this.game.bgm.updateUI();
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
        this.startMatchmaking();
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

    // Lobby Profile Card click -> Open Operator Profile Modal
    const lobbyProfileCard = document.getElementById('lobby-profile-card');
    if (lobbyProfileCard) {
      lobbyProfileCard.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        this.showPlayerProfile();
      });
    }

    const btnCloseProfile = document.getElementById('btn-close-player-profile');
    if (btnCloseProfile) {
      btnCloseProfile.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        if (this.modalPlayerProfile) this.modalPlayerProfile.style.display = 'none';
      });
    }

    const btnCopyId = document.getElementById('btn-copy-id');
    if (btnCopyId) {
      btnCopyId.addEventListener('click', () => {
        const idText = document.getElementById('profile-modal-id')?.textContent || '';
        if (navigator.clipboard && idText) {
          navigator.clipboard.writeText(idText);
          const toast = document.getElementById('profile-copy-toast');
          if (toast) {
            toast.style.display = 'inline';
            setTimeout(() => { toast.style.display = 'none'; }, 1800);
          }
        }
      });
    }

    const btnSaveCallsign = document.getElementById('btn-save-callsign');
    if (btnSaveCallsign) {
      btnSaveCallsign.addEventListener('click', () => {
        const input = document.getElementById('profile-input-callsign');
        if (input && input.value.trim() && this.game.auth) {
          this.game.auth.setCallsign(input.value.trim());
          this.updateLobbyUser();
          this.showPlayerProfile();
          if (this.game.soundEngine) this.game.soundEngine.playUIClick();
        }
      });
    }

    // Post-Match debriefing action buttons
    const btnPostmatchReplay = document.getElementById('btn-postmatch-replay');
    if (btnPostmatchReplay) {
      btnPostmatchReplay.addEventListener('click', () => {
        if (this.modalPostMatch) this.modalPostMatch.style.display = 'none';
        this.restartGame();
      });
    }

    const btnPostmatchLobby = document.getElementById('btn-postmatch-lobby');
    if (btnPostmatchLobby) {
      btnPostmatchLobby.addEventListener('click', () => {
        if (this.modalPostMatch) this.modalPostMatch.style.display = 'none';
        this.showLobby();
      });
    }

    // 3. Modular Operation Select Modal Handlers
    const btnCloseMode = document.getElementById('btn-close-mode-select');
    if (btnCloseMode) {
      btnCloseMode.addEventListener('click', () => {
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    const btnConfirmMode = document.getElementById('btn-confirm-mode-select');
    if (btnConfirmMode) {
      btnConfirmMode.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        this.applySelectedModeConfig();
        if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
      });
    }

    // Mode Selector Pills (TDM, FFA, WAVE)
    ['tdm', 'ffa', 'wave'].forEach((m) => {
      const btn = document.getElementById(`btn-sel-mode-${m}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.game.soundEngine.playUIClick();
          this.selectedModeConfig.mode = m;
          this.updateModeSelectUI();
        });
      }
    });

    // Squad Format Pills (Solo 1P, Duo 2P, Squad 4P)
    [1, 2, 4].forEach((s) => {
      const btn = document.getElementById(`btn-sel-squad-${s}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.game.soundEngine.playUIClick();
          this.selectedModeConfig.squadSize = s;
          this.updateModeSelectUI();
        });
      }
    });

    // Team Preference Pills (Auto, Blue Task Force, Red Insurgents)
    ['auto', 'blue', 'red'].forEach((t) => {
      const btn = document.getElementById(`btn-sel-team-${t}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.game.soundEngine.playUIClick();
          this.selectedModeConfig.teamPreference = t;
          this.updateModeSelectUI();
        });
      }
    });

    // Map Selector Pills (6 Iconic Maps + Backwards Compatibility)
    [
      { id: 'city', btn: 'btn-sel-map-city' },
      { id: 'village', btn: 'btn-sel-map-village' },
      { id: 'train_station', btn: 'btn-sel-map-train' },
      { id: 'airport', btn: 'btn-sel-map-airport' },
      { id: 'tv_station', btn: 'btn-sel-map-tv' },
      { id: 'sea_port', btn: 'btn-sel-map-sea' },
      { id: 'small', btn: 'btn-sel-map-small' },
      { id: 'medium', btn: 'btn-sel-map-med' },
      { id: 'big', btn: 'btn-sel-map-big' }
    ].forEach((mp) => {
      const btn = document.getElementById(mp.btn);
      if (btn) {
        btn.addEventListener('click', () => {
          this.game.soundEngine.playUIClick();
          this.selectedModeConfig.mapSize = mp.id;
          this.updateModeSelectUI();
        });
      }
    });

    // Matchmaking Cancel Button
    const btnCancelMM = document.getElementById('btn-cancel-matchmaking');
    if (btnCancelMM) {
      btnCancelMM.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        this.cancelMatchmaking();
      });
    }

    // Key Escape to cancel matchmaking if currently active
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.currentState === 'MATCHMAKING') {
        this.cancelMatchmaking();
      }
    });

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

    // BGM Player Widget Listeners
    const bgmPlay = document.getElementById('bgm-btn-play');
    if (bgmPlay) {
      bgmPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game.bgm) this.game.bgm.togglePlay();
      });
    }

    const bgmPrev = document.getElementById('bgm-btn-prev');
    if (bgmPrev) {
      bgmPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game.bgm) this.game.bgm.prevTrack();
      });
    }

    const bgmNext = document.getElementById('bgm-btn-next');
    if (bgmNext) {
      bgmNext.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game.bgm) this.game.bgm.nextTrack();
      });
    }

    const bgmMute = document.getElementById('bgm-btn-mute');
    if (bgmMute) {
      bgmMute.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game.bgm) this.game.bgm.toggleMute();
      });
    }

    const bgmList = document.getElementById('bgm-btn-list');
    const modalBgm = document.getElementById('modal-bgm-tracklist');
    if (bgmList && modalBgm) {
      bgmList.addEventListener('click', (e) => {
        e.stopPropagation();
        modalBgm.style.display = 'flex';
      });
    }

    const btnCloseBgm = document.getElementById('btn-close-bgm-tracklist');
    if (btnCloseBgm && modalBgm) {
      btnCloseBgm.addEventListener('click', () => {
        modalBgm.style.display = 'none';
      });
    }

    const trackItems = document.querySelectorAll('.bgm-tracklist-item');
    trackItems.forEach((item) => {
      item.addEventListener('click', () => {
        const trackIdx = parseInt(item.getAttribute('data-track'), 10);
        if (this.game.bgm) {
          this.game.bgm.playTrack(trackIdx);
        }
      });
    });

    const bgmVolSlider = document.getElementById('bgm-volume-slider');
    if (bgmVolSlider) {
      bgmVolSlider.addEventListener('input', (e) => {
        if (this.game.bgm) {
          this.game.bgm.setVolume(parseFloat(e.target.value) / 100);
        }
      });
    }

    // Squad Slots Bot Invites
    const squadNames = ['GHOST-01', 'SOAP-02', 'ROACH-03'];
    const activeSquad = [null, null, null];

    [1, 2, 3].forEach((idx) => {
      const slotEl = document.getElementById(`lobby-squad-${idx}`);
      if (slotEl) {
        slotEl.addEventListener('click', () => {
          this.game.soundEngine.playUIClick();
          if (!activeSquad[idx - 1]) {
            activeSquad[idx - 1] = squadNames[idx - 1];
            slotEl.innerHTML = `
              <span style="font-size: 13px;">🤖</span>
              <span style="font-size: 9px; font-weight: 700; color: #162a68;">${activeSquad[idx - 1]}</span>
            `;
            slotEl.style.border = '2px solid #162a68';
            slotEl.style.background = 'rgba(248, 246, 240, 0.9)';
          } else {
            activeSquad[idx - 1] = null;
            slotEl.innerHTML = `<span>+</span>`;
            slotEl.style.border = '2px dashed rgba(22, 42, 104, 0.5)';
            slotEl.style.background = 'rgba(248, 246, 240, 0.5)';
          }
          if (this.game.lobby) {
            this.game.lobby.updateSquadTeammates(activeSquad);
          }
        });
      }
    });

    // Gyroscope Settings Listeners
    const gyroToggle = document.getElementById('setting-gyro-toggle');
    if (gyroToggle && this.game.inputManager) {
      gyroToggle.checked = this.game.inputManager.gyroEnabled;
      gyroToggle.addEventListener('change', (e) => {
        this.game.inputManager.setGyroEnabled(e.target.checked);
        if (this.game.hud) this.game.hud.updateGyroBadge();
      });
    }

    const gyroSens = document.getElementById('setting-gyro-sens');
    if (gyroSens && this.game.inputManager) {
      gyroSens.value = this.game.inputManager.gyroSensitivity;
      gyroSens.addEventListener('input', (e) => {
        this.game.inputManager.setGyroSensitivity(parseFloat(e.target.value));
      });
    }

    const gyroAdsSens = document.getElementById('setting-gyro-ads-sens');
    if (gyroAdsSens && this.game.inputManager) {
      gyroAdsSens.value = this.game.inputManager.gyroAdsSensitivity;
      gyroAdsSens.addEventListener('input', (e) => {
        this.game.inputManager.setGyroAdsSensitivity(parseFloat(e.target.value));
      });
    }

    const gyroInvert = document.getElementById('setting-gyro-invert');
    if (gyroInvert && this.game.inputManager) {
      gyroInvert.checked = this.game.inputManager.gyroInvertY;
      gyroInvert.addEventListener('change', (e) => {
        this.game.inputManager.setGyroInvertY(e.target.checked);
      });
    }

    const btnCalibrateGyro = document.getElementById('btn-calibrate-gyro');
    if (btnCalibrateGyro && this.game.inputManager) {
      btnCalibrateGyro.addEventListener('click', () => {
        this.game.soundEngine.playUIClick();
        this.game.inputManager.calibrateGyro();
        btnCalibrateGyro.textContent = '✓ GYRO CALIBRATED';
        setTimeout(() => {
          btnCalibrateGyro.textContent = '🎯 CALIBRATE GYRO';
        }, 1500);
      });
    }

    const btnRequestGyro = document.getElementById('btn-request-gyro-perm');
    if (btnRequestGyro && this.game.inputManager) {
      btnRequestGyro.addEventListener('click', async () => {
        this.game.soundEngine.playUIClick();
        const res = await this.game.inputManager.requestGyroPermission();
        btnRequestGyro.textContent = res.success ? '✓ PERMISSION ACTIVE' : '✕ DENIED';
        if (gyroToggle) gyroToggle.checked = this.game.inputManager.gyroEnabled;
        if (this.game.hud) this.game.hud.updateGyroBadge();
      });
    }

    const leftHandToggle = document.getElementById('setting-left-handed-toggle');
    if (leftHandToggle && this.game.mobileControls) {
      leftHandToggle.checked = this.game.mobileControls.isLeftHanded;
      leftHandToggle.addEventListener('change', (e) => {
        this.game.mobileControls.setLeftHanded(e.target.checked);
      });
    }

    setInterval(() => {
      const debugText = document.getElementById('gyro-debug-text');
      if (debugText && this.game.inputManager) {
        const d = this.game.inputManager.getDebugStatus();
        debugText.textContent = `Sensor: ${d.supported ? 'ACTIVE' : 'N/A'} • Pitch: ${d.beta}° • Roll: ${d.gamma}° • Yaw: ${d.alpha}° • Sens: ${d.sensitivity}x`;
      }
    }, 250);

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
    if (this.modalPostMatch) this.modalPostMatch.style.display = 'none';
    if (this.game.lobby) this.game.lobby.hide();

    // Automatic Fullscreen Request
    if (this.game.player) {
      this.game.player.requestFullscreen();
    }

    // Configure game mode and map from selectedModeConfig
    const mode = this.selectedModeConfig.mode === 'wave' ? 'wave' : 'tdm';
    const teamSize = this.selectedModeConfig.teamSize || 4;
    const mapSize = this.selectedModeConfig.mapSize || 'city';
    this.game.startMode(mode, teamSize, mapSize);

    this.game.hud.show();
    this.game.domElement.requestPointerLock();
  }

  restartGame() {
    this.startGame();
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

  gameOver(score, wave, kills = 0, headshots = 0, isWin = false, deaths = 1, damage = 0) {
    const goScore = document.getElementById('go-score');
    const goWave = document.getElementById('go-wave');
    const goKills = document.getElementById('go-kills');
    const goHeadshots = document.getElementById('go-headshots');
    const goAccuracy = document.getElementById('go-accuracy');

    if (goScore) goScore.textContent = String(score || 0).padStart(6, '0');
    if (goWave) goWave.textContent = typeof wave === 'string' ? wave : `WAVE ${String(wave || 1).padStart(2, '0')}`;
    if (goKills) goKills.textContent = kills || 0;
    if (goHeadshots) goHeadshots.textContent = headshots || 0;
    if (goAccuracy) {
      const shots = (kills * 3) + Math.floor(Math.random() * 6);
      const acc = shots > 0 ? Math.min(100, Math.round(((kills + headshots) / Math.max(1, shots)) * 100)) : 68;
      goAccuracy.textContent = `${acc}%`;
    }

    this.currentState = 'GAME_OVER';
    if (document.exitPointerLock) document.exitPointerLock();
    if (this.screenGameOver) this.screenGameOver.style.display = 'flex';
    if (this.game.bgm) this.game.bgm.fadeIn(1000);

    if (this.game.auth) {
      this.game.auth.recordMatch({
        kills: kills || 0,
        deaths: deaths || 1,
        headshots: headshots || 0,
        damage: damage || ((kills || 0) * 115),
        isWin: isWin
      });
    }
  }

  showPostMatch(results = {}) {
    this.currentState = 'GAME_OVER';
    if (document.exitPointerLock) document.exitPointerLock();

    const kills = results.kills || 0;
    const deaths = results.deaths || 0;
    const headshots = results.headshots || 0;
    const damage = results.damage || (kills * 115);
    const isWin = !!results.isWin;
    const modeLabel = results.modeLabel || this.selectedModeConfig.title;

    let recorded = { xpGained: kills * 110 + (isWin ? 500 : 250), bpGained: kills * 25 + (isWin ? 150 : 75) };
    if (this.game.auth) {
      recorded = this.game.auth.recordMatch({
        kills,
        deaths,
        headshots,
        damage,
        isWin
      }) || recorded;
    }

    const titleEl = document.getElementById('postmatch-title');
    const subEl = document.getElementById('postmatch-subtitle');
    const modeEl = document.getElementById('postmatch-mode-label');
    const killsEl = document.getElementById('postmatch-kills');
    const deathsEl = document.getElementById('postmatch-deaths');
    const kdEl = document.getElementById('postmatch-kd');
    const headshotsEl = document.getElementById('postmatch-headshots');
    const damageEl = document.getElementById('postmatch-damage');
    const bpEl = document.getElementById('postmatch-bp');
    const xpEl = document.getElementById('postmatch-xp');

    if (titleEl) {
      titleEl.textContent = isWin ? 'VICTORY' : 'DEFEAT';
      titleEl.style.color = isWin ? '#162a68' : '#c9182b';
    }
    if (subEl) {
      subEl.textContent = isWin ? 'OPERATION OBJECTIVE ACHIEVED' : 'TACTICAL WITHDRAWAL';
    }
    if (modeEl) modeEl.textContent = modeLabel;
    if (killsEl) killsEl.textContent = kills;
    if (deathsEl) deathsEl.textContent = deaths;
    if (kdEl) kdEl.textContent = (kills / Math.max(1, deaths)).toFixed(2);
    if (headshotsEl) headshotsEl.textContent = headshots;
    if (damageEl) damageEl.textContent = Math.round(damage).toLocaleString();
    if (bpEl) bpEl.textContent = `+${recorded.bpGained || 0} BP`;
    if (xpEl) xpEl.textContent = `+${recorded.xpGained || 0} XP`;

    if (this.modalPostMatch) {
      this.modalPostMatch.style.display = 'flex';
    }
  }

  showPlayerProfile() {
    if (!this.game.auth || !this.game.auth.currentUser) return;
    const u = this.game.auth.currentUser;

    const avatarEl = document.getElementById('profile-modal-avatar');
    const inputCallsign = document.getElementById('profile-input-callsign');
    const idEl = document.getElementById('profile-modal-id');
    const rankEl = document.getElementById('profile-modal-rank');
    const levelEl = document.getElementById('profile-modal-level');
    const xpText = document.getElementById('profile-xp-text');
    const xpBar = document.getElementById('profile-xp-bar');

    if (avatarEl) avatarEl.src = u.avatar;
    if (inputCallsign) inputCallsign.value = u.name;
    if (idEl) idEl.textContent = u.id || 'ASTRA-0000000000';
    if (rankEl) rankEl.textContent = u.rank || 'GOLD I';
    if (levelEl) levelEl.textContent = `LEVEL ${u.level || 1}`;

    const xp = u.xp || 0;
    const nextXp = u.xpToNextLevel || 3000;
    if (xpText) xpText.textContent = `${xp.toLocaleString()} / ${nextXp.toLocaleString()} XP`;
    if (xpBar) xpBar.style.width = `${Math.min(100, Math.round((xp / nextXp) * 100))}%`;

    const statMatches = document.getElementById('profile-stat-matches');
    const statWinrate = document.getElementById('profile-stat-winrate');
    const statKd = document.getElementById('profile-stat-kd');
    const statKdRatio = document.getElementById('profile-stat-kills-deaths');
    const statHeadshots = document.getElementById('profile-stat-headshots');
    const statAvgDmg = document.getElementById('profile-stat-avgdmg');

    if (statMatches) statMatches.textContent = u.matches || 0;
    if (statWinrate) statWinrate.textContent = this.game.auth.getWinRate();
    if (statKd) statKd.textContent = this.game.auth.getKD();
    if (statKdRatio) statKdRatio.textContent = `${u.kills || 0} / ${u.deaths || 0}`;
    if (statHeadshots) statHeadshots.textContent = this.game.auth.getHeadshotRate();
    if (statAvgDmg) statAvgDmg.textContent = this.game.auth.getAvgDamage().toLocaleString();

    if (this.modalPlayerProfile) this.modalPlayerProfile.style.display = 'flex';
  }

  restartGame() {
    this.currentState = 'PLAYING';
    if (this.screenGameOver) this.screenGameOver.style.display = 'none';
    if (this.modalPostMatch) this.modalPostMatch.style.display = 'none';
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

  // Operation Selection UI Management
  updateModeSelectUI() {
    // 1. Highlight active Mode pill
    ['tdm', 'ffa', 'wave'].forEach(m => {
      const el = document.getElementById(`btn-sel-mode-${m}`);
      if (el) {
        if (this.selectedModeConfig.mode === m) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // 2. Highlight active Squad pill
    [1, 2, 4].forEach(s => {
      const el = document.getElementById(`btn-sel-squad-${s}`);
      if (el) {
        if (this.selectedModeConfig.squadSize === s) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // 3. Highlight active Team pill
    ['auto', 'blue', 'red'].forEach(t => {
      const el = document.getElementById(`btn-sel-team-${t}`);
      if (el) {
        if (this.selectedModeConfig.teamPreference === t) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    // 4. Highlight active Map pill
    [
      { id: 'city', btn: 'btn-sel-map-city' },
      { id: 'village', btn: 'btn-sel-map-village' },
      { id: 'train_station', btn: 'btn-sel-map-train' },
      { id: 'airport', btn: 'btn-sel-map-airport' },
      { id: 'tv_station', btn: 'btn-sel-map-tv' },
      { id: 'sea_port', btn: 'btn-sel-map-sea' },
      { id: 'small', btn: 'btn-sel-map-small' },
      { id: 'medium', btn: 'btn-sel-map-med' },
      { id: 'big', btn: 'btn-sel-map-big' }
    ].forEach(mp => {
      const el = document.getElementById(mp.btn);
      if (el) {
        const isSelected = this.selectedModeConfig.mapSize === mp.id ||
          (this.selectedModeConfig.mapSize === 'city' && mp.id === 'small') ||
          (this.selectedModeConfig.mapSize === 'small' && mp.id === 'city');
        if (isSelected) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });

    this.applySelectedModeConfig();
  }

  applySelectedModeConfig() {
    const mapNames = {
      city: 'METROPOLIS DOWNTOWN',
      village: 'HIGHLAND HAMLET',
      train_station: 'CENTRAL TERMINAL',
      airport: 'SKY HARBOR TERMINAL',
      tv_station: 'BROADCAST MEDIA CENTER',
      sea_port: 'CARGO SEA PORT',
      small: 'METROPOLIS DOWNTOWN',
      medium: 'CENTRAL TERMINAL',
      big: 'CARGO SEA PORT'
    };
    const mapName = mapNames[this.selectedModeConfig.mapSize] || 'METROPOLIS DOWNTOWN';

    if (this.selectedModeConfig.mode === 'wave') {
      this.selectedModeConfig.teamSize = 1;
      this.selectedModeConfig.title = `WAVE SURVIVAL: ${mapName}`;
    } else if (this.selectedModeConfig.mode === 'ffa') {
      this.selectedModeConfig.teamSize = ['city', 'small', 'village'].includes(this.selectedModeConfig.mapSize) ? 4 : (['train_station', 'tv_station', 'medium'].includes(this.selectedModeConfig.mapSize) ? 8 : 12);
      this.selectedModeConfig.title = `SOLO FFA: ${mapName}`;
    } else {
      // TDM
      const teamCount = ['city', 'small', 'village'].includes(this.selectedModeConfig.mapSize) ? 4 : (['train_station', 'tv_station', 'medium'].includes(this.selectedModeConfig.mapSize) ? 8 : 12);
      this.selectedModeConfig.teamSize = teamCount;
      const squadLabel = this.selectedModeConfig.squadSize === 1 ? 'SOLO' : (this.selectedModeConfig.squadSize === 2 ? 'DUO' : 'SQUAD');
      this.selectedModeConfig.title = `TDM ${teamCount}v${teamCount} (${squadLabel}): ${mapName}`;
    }

    if (this.lobbyModeTitle) {
      this.lobbyModeTitle.textContent = this.selectedModeConfig.title;
    }
  }

  // Tactical Matchmaking Engine with Live Queueing Simulation
  startMatchmaking() {
    this.currentState = 'MATCHMAKING';
    if (this.screenPubgLobby) this.screenPubgLobby.style.display = 'none';
    if (this.modalModeSelect) this.modalModeSelect.style.display = 'none';
    if (this.screenMatchmaking) this.screenMatchmaking.style.display = 'flex';

    this.clearMatchmakingTimers();

    // Populate user profile in slot 0
    const user = this.game.auth && this.game.auth.currentUser ? this.game.auth.currentUser : { name: 'Operator', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstraAgent' };
    const slot0Avatar = document.getElementById('mm-slot-0-avatar');
    const slot0Name = document.getElementById('mm-slot-0-name');
    if (slot0Avatar) slot0Avatar.src = user.avatar;
    if (slot0Name) slot0Name.textContent = user.name;

    // Set match parameters info badges
    const mapNames = {
      city: 'METROPOLIS DOWNTOWN',
      village: 'HIGHLAND HAMLET',
      train_station: 'CENTRAL TERMINAL',
      airport: 'SKY HARBOR TERMINAL',
      tv_station: 'BROADCAST MEDIA CENTER',
      sea_port: 'CARGO SEA PORT',
      small: 'METROPOLIS DOWNTOWN',
      medium: 'CENTRAL TERMINAL',
      big: 'CARGO SEA PORT'
    };
    const squadLabels = { 1: 'SOLO (1P)', 2: 'DUO (2P)', 4: 'SQUAD (4P)' };
    const teamLabels = { auto: 'AUTO BALANCE', blue: 'BLUE TASK FORCE', red: 'RED INSURGENTS' };

    const infoMode = document.getElementById('mm-info-mode');
    const infoMap = document.getElementById('mm-info-map');
    const infoSquad = document.getElementById('mm-info-squad');
    const infoTeam = document.getElementById('mm-info-team');
    if (infoMode) infoMode.textContent = this.selectedModeConfig.mode.toUpperCase();
    if (infoMap) infoMap.textContent = mapNames[this.selectedModeConfig.mapSize] || 'METROPOLIS DOWNTOWN';
    if (infoSquad) infoSquad.textContent = squadLabels[this.selectedModeConfig.squadSize] || 'SQUAD (4P)';
    if (infoTeam) infoTeam.textContent = teamLabels[this.selectedModeConfig.teamPreference] || 'AUTO BALANCE';

    // Reset Slots 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      const slotCard = document.getElementById(`mm-slot-${i}`);
      const slotName = document.getElementById(`mm-slot-${i}-name`);
      const slotStatus = document.getElementById(`mm-slot-${i}-status`);
      const slotIcon = document.getElementById(`mm-slot-${i}-icon`);
      if (slotCard) {
        slotCard.className = 'mm-slot-card empty';
      }
      if (slotIcon) slotIcon.textContent = '⏳';
      if (slotName) slotName.textContent = 'SEARCHING...';
      if (slotStatus) {
        slotStatus.textContent = 'WAITING';
        slotStatus.style.background = 'transparent';
        slotStatus.style.color = '#162a68';
        slotStatus.style.padding = '0';
      }
    }

    const statusBanner = document.getElementById('mm-status-banner');
    const countdownBanner = document.getElementById('mm-countdown-banner');
    if (statusBanner) {
      statusBanner.style.display = 'block';
      statusBanner.textContent = 'CONNECTING TO NEXORA REGIONAL SERVERS (1/4)...';
    }
    if (countdownBanner) countdownBanner.style.display = 'none';

    // Elapsed timer
    let seconds = 0;
    const elapsedEl = document.getElementById('mm-elapsed-timer');
    if (elapsedEl) elapsedEl.textContent = '0:00';

    const intervalTimer = setInterval(() => {
      seconds++;
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      if (elapsedEl) elapsedEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
      if (this.game.soundEngine) this.game.soundEngine.playRadioChirp();
    }, 1000);
    this.mmTimers.push(intervalTimer);

    // Progression simulation based on squadSize
    const squadSize = this.selectedModeConfig.squadSize || 4;

    const fillSlot = (slotIdx, botName, botAvatarSeed) => {
      const slotCard = document.getElementById(`mm-slot-${slotIdx}`);
      const slotName = document.getElementById(`mm-slot-${slotIdx}-name`);
      const slotStatus = document.getElementById(`mm-slot-${slotIdx}-status`);
      const slotIcon = document.getElementById(`mm-slot-${slotIdx}-icon`);
      if (slotCard) {
        slotCard.className = 'mm-slot-card filled';
      }
      if (slotIcon) {
        slotIcon.innerHTML = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=${botAvatarSeed}" style="width: 44px; height: 44px; border: 1.5px solid #162a68; background: #fff;">`;
      }
      if (slotName) slotName.textContent = botName;
      if (slotStatus) {
        slotStatus.textContent = 'READY';
        slotStatus.style.background = '#2255bb';
        slotStatus.style.color = '#fff';
        slotStatus.style.padding = '1px 6px';
        slotStatus.style.fontWeight = '700';
      }
      if (this.game.soundEngine) this.game.soundEngine.playUIClick();
    };

    if (squadSize >= 2) {
      const t1 = setTimeout(() => {
        fillSlot(1, 'Ghost-02', 'Ghost02');
        if (statusBanner) statusBanner.textContent = `SQUAD OPERATOR ACQUIRED (2/${squadSize})...`;
      }, 1100);
      this.mmTimers.push(t1);
    }

    if (squadSize >= 3) {
      const t2 = setTimeout(() => {
        fillSlot(2, 'Viper-04', 'Viper04');
        if (statusBanner) statusBanner.textContent = `SQUAD OPERATOR ACQUIRED (3/${squadSize})...`;
      }, 2100);
      this.mmTimers.push(t2);
    }

    if (squadSize >= 4) {
      const t3 = setTimeout(() => {
        fillSlot(3, 'Spectre-06', 'Spectre06');
        if (statusBanner) statusBanner.textContent = `SQUAD OPERATOR ACQUIRED (4/${squadSize})...`;
      }, 3100);
      this.mmTimers.push(t3);
    }

    // Match Found and Countdown Launch
    const matchFoundDelay = squadSize === 1 ? 1400 : (squadSize === 2 ? 2400 : 3800);

    const tFound = setTimeout(() => {
      if (statusBanner) statusBanner.textContent = 'MATCH FOUND! ALL OPERATORS SYNCHRONIZED';
      if (countdownBanner) {
        countdownBanner.style.display = 'block';
        countdownBanner.textContent = 'DEPLOYING IN 3...';
      }
      if (this.game.soundEngine) this.game.soundEngine.playRadioSquelch();

      let count = 3;
      const countInterval = setInterval(() => {
        count--;
        if (countdownBanner) {
          if (count > 0) {
            countdownBanner.textContent = `DEPLOYING IN ${count}...`;
            if (this.game.soundEngine) this.game.soundEngine.playRadioChirp();
          } else {
            countdownBanner.textContent = 'COMMENCING INFILTRATION...';
            clearInterval(countInterval);
            this.clearMatchmakingTimers();

            // Launch Match!
            setTimeout(() => {
              if (this.screenMatchmaking) this.screenMatchmaking.style.display = 'none';
              this.game.startMode(
                this.selectedModeConfig.mode,
                this.selectedModeConfig.teamSize,
                this.selectedModeConfig.mapSize
              );
              this.startGame();
            }, 500);
          }
        }
      }, 1000);
      this.mmTimers.push(countInterval);
    }, matchFoundDelay);
    this.mmTimers.push(tFound);
  }

  cancelMatchmaking() {
    this.clearMatchmakingTimers();
    if (this.screenMatchmaking) this.screenMatchmaking.style.display = 'none';
    this.showLobby();
  }

  clearMatchmakingTimers() {
    if (this.mmTimers && this.mmTimers.length > 0) {
      this.mmTimers.forEach(t => {
        clearTimeout(t);
        clearInterval(t);
      });
      this.mmTimers = [];
    }
  }
}


