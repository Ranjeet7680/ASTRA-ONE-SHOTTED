export class MobileControls {
  constructor(player, weapons, game) {
    this.player = player;
    this.weapons = weapons;
    this.game = game;

    this.isEnabled = false;
    this.isEditingLayout = false;
    this.selectedButtonId = null;

    // Default Layout Configuration (percent-based for responsiveness)
    this.defaultLayout = {
      'btn-touch-fire': { x: 82, y: 68, size: 76, opacity: 0.85 },
      'btn-touch-aim': { x: 70, y: 72, size: 62, opacity: 0.85 },
      'btn-touch-jump': { x: 88, y: 48, size: 60, opacity: 0.85 },
      'btn-touch-slide': { x: 84, y: 32, size: 58, opacity: 0.85 },
      'btn-touch-reload': { x: 68, y: 54, size: 54, opacity: 0.85 },
      'btn-touch-grenade': { x: 72, y: 36, size: 54, opacity: 0.85 },
      'btn-touch-wep1': { x: 38, y: 90, size: 48, opacity: 0.8 },
      'btn-touch-wep2': { x: 46, y: 90, size: 48, opacity: 0.8 },
      'btn-touch-wep3': { x: 54, y: 90, size: 48, opacity: 0.8 },
      'btn-touch-wep4': { x: 62, y: 90, size: 48, opacity: 0.8 },
      'btn-touch-voice': { x: 70, y: 20, size: 52, opacity: 0.85 },
      'btn-touch-inspect': { x: 80, y: 20, size: 52, opacity: 0.85 }
    };

    this.layout = this.loadLayout();

    // Joystick State
    this.joystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      vectorX: 0,
      vectorY: 0,
      maxRadius: 45
    };

    // Camera Look State
    this.lookTouch = {
      active: false,
      touchId: null,
      lastX: 0,
      lastY: 0
    };

    this.buildMobileDOM();
    this.bindTouchEvents();

    // Auto-detect mobile device or touch support
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.enable();
    }
  }

  loadLayout() {
    try {
      const saved = localStorage.getItem('astra_mobile_hud_layout');
      if (saved) {
        return Object.assign({}, this.defaultLayout, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load saved HUD layout', e);
    }
    return JSON.parse(JSON.stringify(this.defaultLayout));
  }

  saveLayout() {
    try {
      localStorage.setItem('astra_mobile_hud_layout', JSON.stringify(this.layout));
    } catch (e) {
      console.warn('Could not save HUD layout', e);
    }
  }

  resetDefaultLayout() {
    this.layout = JSON.parse(JSON.stringify(this.defaultLayout));
    this.applyLayout();
    this.saveLayout();
  }

  enable() {
    this.isEnabled = true;
    if (this.mobileContainer) {
      this.mobileContainer.style.display = 'block';
    }
    this.applyLayout();
  }

  disable() {
    this.isEnabled = false;
    if (this.mobileContainer) {
      this.mobileContainer.style.display = 'none';
    }
  }

  toggle() {
    if (this.isEnabled) this.disable();
    else this.enable();
  }

  buildMobileDOM() {
    // Master container for mobile controls
    const container = document.createElement('div');
    container.id = 'mobile-controls-layer';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 25;
      display: none;
    `;

    // Left Touch Joystick Zone
    const joyZone = document.createElement('div');
    joyZone.id = 'touch-joystick-zone';
    joyZone.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 160px;
      height: 160px;
      pointer-events: auto;
      border: 2px dashed rgba(22, 42, 104, 0.3);
      border-radius: 50%;
      touch-action: none;
    `;

    const joyBase = document.createElement('div');
    joyBase.id = 'joystick-base';
    joyBase.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid #162a68;
      background: rgba(248, 246, 240, 0.4);
      pointer-events: none;
    `;

    const joyThumb = document.createElement('div');
    joyThumb.id = 'joystick-thumb';
    joyThumb.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #162a68;
      pointer-events: none;
      transition: transform 0.04s ease-out;
    `;

    joyBase.appendChild(joyThumb);
    joyZone.appendChild(joyBase);
    container.appendChild(joyZone);
    this.joyThumb = joyThumb;
    this.joyZone = joyZone;

    // Right Touch Look Zone
    const lookZone = document.createElement('div');
    lookZone.id = 'touch-look-zone';
    lookZone.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 55%;
      height: 80%;
      pointer-events: auto;
      touch-action: none;
    `;
    container.appendChild(lookZone);
    this.lookZone = lookZone;

    // Buttons definitions
    const buttonDefs = [
      { id: 'btn-touch-fire', label: 'FIRE', isPrimary: true },
      { id: 'btn-touch-aim', label: 'ADS' },
      { id: 'btn-touch-jump', label: 'JUMP' },
      { id: 'btn-touch-slide', label: 'SLIDE' },
      { id: 'btn-touch-reload', label: 'RLD' },
      { id: 'btn-touch-grenade', label: 'NADE' },
      { id: 'btn-touch-wep1', label: '1' },
      { id: 'btn-touch-wep2', label: '2' },
      { id: 'btn-touch-wep3', label: '3' },
      { id: 'btn-touch-wep4', label: '4' },
      { id: 'btn-touch-voice', label: 'RAD' },
      { id: 'btn-touch-inspect', label: 'INSP' }
    ];

    this.buttons = {};

    buttonDefs.forEach(b => {
      const btn = document.createElement('div');
      btn.id = b.id;
      btn.className = 'mobile-touch-btn' + (b.isPrimary ? ' primary' : '');
      btn.textContent = b.label;
      btn.style.cssText = `
        position: absolute;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        border: 2px solid #162a68;
        border-radius: 50%;
        background: ${b.isPrimary ? 'rgba(201, 24, 43, 0.85)' : 'rgba(248, 246, 240, 0.85)'};
        color: ${b.isPrimary ? '#faf8f2' : '#162a68'};
        box-shadow: 2px 2px 0px rgba(22, 42, 104, 0.3);
        cursor: pointer;
      `;
      container.appendChild(btn);
      this.buttons[b.id] = btn;
    });

    // Editor Floating Bar (visible during HUD Customizer mode)
    const editorBar = document.createElement('div');
    editorBar.id = 'hud-editor-bar';
    editorBar.style.cssText = `
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: #faf8f2;
      border: 2.5px solid #162a68;
      box-shadow: 4px 4px 0px rgba(22, 42, 104, 0.3);
      padding: 10px 18px;
      display: none;
      align-items: center;
      gap: 14px;
      pointer-events: auto;
      z-index: 40;
      font-size: 13px;
      font-weight: 700;
    `;
    editorBar.innerHTML = `
      <span>DRAG BUTTONS TO REPOSITION</span>
      <label>SIZE <input type="range" id="hud-edit-size" min="40" max="110" value="60"></label>
      <label>OPACITY <input type="range" id="hud-edit-opacity" min="0.3" max="1" step="0.05" value="0.85"></label>
      <button class="sketch-btn" id="hud-edit-reset" style="padding: 4px 10px; font-size: 12px;">RESET</button>
      <button class="sketch-btn" id="hud-edit-save" style="padding: 4px 12px; font-size: 12px; background: #162a68; color: #fff;">SAVE & CLOSE</button>
    `;
    container.appendChild(editorBar);
    this.editorBar = editorBar;

    document.body.appendChild(container);
    this.mobileContainer = container;

    // Wire editor controls
    document.getElementById('hud-edit-size').addEventListener('input', (e) => {
      if (this.selectedButtonId && this.layout[this.selectedButtonId]) {
        this.layout[this.selectedButtonId].size = parseInt(e.target.value);
        this.applyLayout();
      }
    });

    document.getElementById('hud-edit-opacity').addEventListener('input', (e) => {
      if (this.selectedButtonId && this.layout[this.selectedButtonId]) {
        this.layout[this.selectedButtonId].opacity = parseFloat(e.target.value);
        this.applyLayout();
      }
    });

    document.getElementById('hud-edit-reset').addEventListener('click', () => {
      this.resetDefaultLayout();
    });

    document.getElementById('hud-edit-save').addEventListener('click', () => {
      this.saveLayout();
      this.exitCustomizerMode();
    });
  }

  applyLayout() {
    for (const [id, cfg] of Object.entries(this.layout)) {
      const btn = this.buttons[id];
      if (btn) {
        btn.style.left = `${cfg.x}%`;
        btn.style.top = `${cfg.y}%`;
        btn.style.width = `${cfg.size}px`;
        btn.style.height = `${cfg.size}px`;
        btn.style.opacity = `${cfg.opacity}`;
        btn.style.fontSize = `${Math.max(10, cfg.size * 0.22)}px`;
      }
    }
  }

  enterCustomizerMode() {
    this.isEditingLayout = true;
    this.enable();
    if (this.editorBar) this.editorBar.style.display = 'flex';

    // Highlight all buttons with dashed editor outlines
    for (const btn of Object.values(this.buttons)) {
      btn.style.outline = '2px dashed #c9182b';
    }
  }

  exitCustomizerMode() {
    this.isEditingLayout = false;
    if (this.editorBar) this.editorBar.style.display = 'none';

    for (const btn of Object.values(this.buttons)) {
      btn.style.outline = 'none';
    }
    this.selectedButtonId = null;

    if (this.onExitCustomizer) {
      this.onExitCustomizer();
    }
  }

  bindTouchEvents() {
    // 1. Virtual Joystick
    this.joyZone.addEventListener('touchstart', (e) => {
      if (this.isEditingLayout) return;
      const touch = e.changedTouches[0];
      this.joystick.active = true;
      this.joystick.touchId = touch.identifier;
      const rect = this.joyZone.getBoundingClientRect();
      this.joystick.startX = rect.left + rect.width / 2;
      this.joystick.startY = rect.top + rect.height / 2;
      this.updateJoystick(touch.clientX, touch.clientY);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.joystick.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystick.touchId) {
          this.updateJoystick(touch.clientX, touch.clientY);
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    const endJoy = (e) => {
      if (!this.joystick.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystick.touchId) {
          this.joystick.active = false;
          this.joystick.vectorX = 0;
          this.joystick.vectorY = 0;
          this.joyThumb.style.transform = 'translate(-50%, -50%)';
          this.player.keys.forward = false;
          this.player.keys.backward = false;
          this.player.keys.left = false;
          this.player.keys.right = false;
          this.player.keys.sprint = false;
          break;
        }
      }
    };
    window.addEventListener('touchend', endJoy);
    window.addEventListener('touchcancel', endJoy);

    // 2. Camera Look Touch Zone
    this.lookZone.addEventListener('touchstart', (e) => {
      if (this.isEditingLayout) return;
      const touch = e.changedTouches[0];
      this.lookTouch.active = true;
      this.lookTouch.touchId = touch.identifier;
      this.lookTouch.lastX = touch.clientX;
      this.lookTouch.lastY = touch.clientY;
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.lookTouch.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.lookTouch.touchId) {
          const dx = touch.clientX - this.lookTouch.lastX;
          const dy = touch.clientY - this.lookTouch.lastY;
          this.lookTouch.lastX = touch.clientX;
          this.lookTouch.lastY = touch.clientY;

          const factor = 0.0035 * this.player.mouseSensitivity;
          this.player.yaw -= dx * factor;
          this.player.pitch -= dy * factor;
          const maxPitch = Math.PI / 2 - 0.08;
          this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
          e.preventDefault();
          break;
        }
      }
    }, { passive: false });

    const endLook = (e) => {
      if (!this.lookTouch.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.lookTouch.touchId) {
          this.lookTouch.active = false;
          break;
        }
      }
    };
    window.addEventListener('touchend', endLook);
    window.addEventListener('touchcancel', endLook);

    // 3. Action Buttons & Customizer Dragging
    for (const [id, btn] of Object.entries(this.buttons)) {
      let isDragging = false;
      let dragTouchId = null;

      btn.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];

        if (this.isEditingLayout) {
          // Customizer drag mode
          isDragging = true;
          dragTouchId = touch.identifier;
          this.selectedButtonId = id;
          document.getElementById('hud-edit-size').value = this.layout[id].size;
          document.getElementById('hud-edit-opacity').value = this.layout[id].opacity;
          btn.style.outline = '3px solid #162a68';
          e.preventDefault();
          return;
        }

        // Gameplay actions
        btn.style.transform = 'scale(0.92)';
        this.triggerButtonAction(id, true);
        e.preventDefault();
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        if (this.isEditingLayout) {
          isDragging = false;
          return;
        }
        btn.style.transform = 'scale(1.0)';
        this.triggerButtonAction(id, false);
        e.preventDefault();
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (!this.isEditingLayout || !isDragging) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === dragTouchId) {
            const pctX = (touch.clientX / window.innerWidth) * 100;
            const pctY = (touch.clientY / window.innerHeight) * 100;
            this.layout[id].x = Math.round(Math.max(2, Math.min(95, pctX)));
            this.layout[id].y = Math.round(Math.max(2, Math.min(95, pctY)));
            btn.style.left = `${this.layout[id].x}%`;
            btn.style.top = `${this.layout[id].y}%`;
            e.preventDefault();
            break;
          }
        }
      }, { passive: false });
    }
  }

  updateJoystick(clientX, clientY) {
    let dx = clientX - this.joystick.startX;
    let dy = clientY - this.joystick.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.joystick.maxRadius) {
      dx = (dx / dist) * this.joystick.maxRadius;
      dy = (dy / dist) * this.joystick.maxRadius;
    }

    this.joystick.vectorX = dx / this.joystick.maxRadius;
    this.joystick.vectorY = dy / this.joystick.maxRadius;

    this.joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    // Map to player keys
    this.player.keys.forward = this.joystick.vectorY < -0.3;
    this.player.keys.backward = this.joystick.vectorY > 0.3;
    this.player.keys.left = this.joystick.vectorX < -0.3;
    this.player.keys.right = this.joystick.vectorX > 0.3;

    // Push past 85% forward to trigger sprint
    if (this.joystick.vectorY < -0.85) {
      this.player.keys.sprint = true;
    } else {
      this.player.keys.sprint = false;
    }
  }

  triggerButtonAction(btnId, isDown) {
    switch (btnId) {
      case 'btn-touch-fire':
        this.player.isShooting = isDown;
        if (isDown && this.player.onShootStart) this.player.onShootStart();
        if (!isDown && this.player.onShootEnd) this.player.onShootEnd();
        break;

      case 'btn-touch-aim':
        if (isDown) {
          this.player.isAiming = !this.player.isAiming;
          if (this.player.onAimChange) this.player.onAimChange(this.player.isAiming);
        }
        break;

      case 'btn-touch-jump':
        this.player.keys.jump = isDown;
        if (isDown && this.player.isGrounded) {
          this.player.velocity.y = this.player.jumpForce;
          this.player.isGrounded = false;
        }
        break;

      case 'btn-touch-slide':
        this.player.keys.crouch = isDown;
        if (isDown) {
          this.player.trySlide();
        }
        break;

      case 'btn-touch-reload':
        if (isDown && this.player.onReloadRequested) {
          this.player.onReloadRequested();
        }
        break;

      case 'btn-touch-grenade':
        if (isDown && this.player.onGrenadeRequested) {
          this.player.onGrenadeRequested();
        }
        break;

      case 'btn-touch-wep1': if (isDown) this.weapons.switchWeapon(0); break;
      case 'btn-touch-wep2': if (isDown) this.weapons.switchWeapon(1); break;
      case 'btn-touch-wep3': if (isDown) this.weapons.switchWeapon(2); break;
      case 'btn-touch-wep4': if (isDown) this.weapons.switchWeapon(3); break;

      case 'btn-touch-voice':
        if (isDown && this.game && this.game.voiceChat) {
          this.game.voiceChat.toggleWheel();
        }
        break;

      case 'btn-touch-inspect':
        if (isDown && this.player) {
          this.player.inspectWeapon();
        }
        break;
    }
  }
}
