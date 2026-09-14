// Professional AAA Mobile FPS Touch Controls for ASTRA: One Shotted
// Clean Blueprint Aesthetic with Non-Overlapping Diamond Combat Cluster,
// Left Movement Joystick + Quick Grenade Badge, Collapsible Tactical Drawer,
// and Multi-Touch Pointer Events.

export class MobileControls {
  constructor(player, weapons, game) {
    this.player = player;
    this.weapons = weapons;
    this.game = game;
    this.inputManager = game.inputManager;

    this.isEnabled = false;
    this.isHUDHidden = false;
    this.isLeftHanded = localStorage.getItem('astra_left_handed') === 'true';

    // Joystick Tracking
    this.joystick = {
      active: false,
      pointerId: null,
      baseX: 0,
      baseY: 0,
      currentX: 0,
      currentY: 0,
      vectorX: 0,
      vectorZ: 0,
      maxRadius: 50
    };

    // Look Aim Tracking
    this.lookPointer = {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0
    };

    // Tactical Drawer state
    this.isTacticalDrawerOpen = false;

    this.buildMobileDOM();
    this.bindPointerEvents();
    this.setupOrientationWatcher();

    // Auto-detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.enable();
    }
  }

  enable() {
    this.isEnabled = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
    this.applyHandedness();
  }

  disable() {
    this.isEnabled = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  setLeftHanded(isLeft) {
    this.isLeftHanded = !!isLeft;
    localStorage.setItem('astra_left_handed', this.isLeftHanded.toString());
    this.applyHandedness();
  }

  applyHandedness() {
    if (!this.joyContainer || !this.combatCluster) return;
    if (this.isLeftHanded) {
      this.joyContainer.style.left = 'auto';
      this.joyContainer.style.right = 'calc(24px + env(safe-area-inset-right))';
      this.combatCluster.style.right = 'auto';
      this.combatCluster.style.left = 'calc(24px + env(safe-area-inset-left))';
      if (this.tacticalDrawer) {
        this.tacticalDrawer.style.right = 'auto';
        this.tacticalDrawer.style.left = 'calc(10px + env(safe-area-inset-left))';
      }
    } else {
      this.joyContainer.style.right = 'auto';
      this.joyContainer.style.left = 'calc(24px + env(safe-area-inset-left))';
      this.combatCluster.style.left = 'auto';
      this.combatCluster.style.right = 'calc(24px + env(safe-area-inset-right))';
      if (this.tacticalDrawer) {
        this.tacticalDrawer.style.left = 'auto';
        this.tacticalDrawer.style.right = 'calc(10px + env(safe-area-inset-right))';
      }
    }
  }

  buildMobileDOM() {
    // 1. Root Mobile Controls Layer
    const container = document.createElement('div');
    container.id = 'mobile-controls-layer';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 28;
      display: none;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    `;
    document.body.appendChild(container);
    this.container = container;

    // 2. Fullscreen Look Touch Surface (captures aim dragging)
    const lookZone = document.createElement('div');
    lookZone.id = 'mobile-look-surface';
    lookZone.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      touch-action: none;
      z-index: 1;
    `;
    container.appendChild(lookZone);
    this.lookZone = lookZone;

    // 3. Left Movement Joystick Container
    const joyContainer = document.createElement('div');
    joyContainer.id = 'mobile-joy-container';
    joyContainer.style.cssText = `
      position: absolute;
      bottom: calc(24px + env(safe-area-inset-bottom));
      left: calc(24px + env(safe-area-inset-left));
      width: 140px;
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      pointer-events: none;
      z-index: 10;
    `;

    // Quick Grenade Button (docked directly above joystick) - Icon Only
    const btnGrenade = document.createElement('div');
    btnGrenade.id = 'btn-quick-grenade';
    btnGrenade.className = 'blueprint-touch-btn';
    btnGrenade.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4 L16 4"/>
          <circle cx="8" cy="6" r="3"/>
          <path d="M14 4 L14 7"/>
          <ellipse cx="14" cy="17" rx="7" ry="8" fill="rgba(22,42,104,0.08)"/>
          <line x1="14" y1="9" x2="14" y2="25"/>
          <line x1="8" y1="14" x2="20" y2="14"/>
          <line x1="8" y1="20" x2="20" y2="20"/>
        </svg>
        <span id="mobile-nade-num" style="position: absolute; top: -4px; right: -2px; font-size: 11px; font-weight: 700; background: #c9182b; color: #faf8f2; padding: 1px 5px; border-radius: 9px; border: 1.5px solid #162a68; line-height: 1.1;">2</span>
      </div>
    `;
    btnGrenade.style.cssText = `
      width: 50px;
      height: 42px;
      border-radius: 8px;
      border: 2px solid #162a68;
      background: rgba(248, 246, 240, 0.92);
      color: #162a68;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      pointer-events: auto;
      touch-action: none;
      box-shadow: 2px 2px 0px rgba(22, 42, 104, 0.25);
      cursor: pointer;
    `;
    joyContainer.appendChild(btnGrenade);
    this.btnGrenade = btnGrenade;

    // Outer Joystick Ring (130px)
    const joyRing = document.createElement('div');
    joyRing.id = 'mobile-joystick-ring';
    joyRing.style.cssText = `
      width: 130px;
      height: 130px;
      border-radius: 50%;
      border: 2.5px solid #162a68;
      background: rgba(248, 246, 240, 0.45);
      backdrop-filter: blur(2px);
      position: relative;
      pointer-events: auto;
      touch-action: none;
      box-shadow: inset 0 0 12px rgba(22, 42, 104, 0.1);
    `;

    // Inner Thumb Stick (60px)
    const joyThumb = document.createElement('div');
    joyThumb.id = 'mobile-joystick-thumb';
    joyThumb.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #162a68;
      border: 2px solid #faf8f2;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 2px 6px rgba(22, 42, 104, 0.4);
      transition: transform 0.04s ease-out;
    `;

    // Cross directional markings on joystick base
    const crossHoriz = document.createElement('div');
    crossHoriz.style.cssText = 'position:absolute;top:50%;left:15%;width:70%;height:1px;background:rgba(22,42,104,0.3);pointer-events:none;';
    const crossVert = document.createElement('div');
    crossVert.style.cssText = 'position:absolute;left:50%;top:15%;width:1px;height:70%;background:rgba(22,42,104,0.3);pointer-events:none;';
    joyRing.appendChild(crossHoriz);
    joyRing.appendChild(crossVert);

    joyRing.appendChild(joyThumb);
    joyContainer.appendChild(joyRing);
    container.appendChild(joyContainer);
    this.joyContainer = joyContainer;
    this.joyRing = joyRing;
    this.joyThumb = joyThumb;

    // 4. Bottom-Right Diamond Combat Cluster
    // Sized so that 100px Fire is surrounded by 76px action buttons with 12px margins
    const combatCluster = document.createElement('div');
    combatCluster.id = 'mobile-combat-cluster';
    combatCluster.style.cssText = `
      position: absolute;
      bottom: calc(24px + env(safe-area-inset-bottom));
      right: calc(24px + env(safe-area-inset-right));
      width: 270px;
      height: 270px;
      pointer-events: none;
      z-index: 15;
    `;

    // Vector Blueprint SVG Icons (ICON ONLY - Zero Text!)
    const fireSvg = `
      <svg viewBox="0 0 36 36" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 5 L22 13 L22 28 L14 28 L14 13 Z" fill="rgba(255,255,255,0.2)"/>
        <line x1="14" y1="24" x2="22" y2="24"/>
        <line x1="14" y1="28" x2="22" y2="28" stroke-width="2.8"/>
        <line x1="18" y1="1" x2="18" y2="3"/>
        <line x1="11" y1="5" x2="13" y2="7"/>
        <line x1="25" y1="5" x2="23" y2="7"/>
        <line x1="8" y1="12" x2="11" y2="13"/>
        <line x1="28" y1="12" x2="25" y2="13"/>
        <line x1="11" y1="20" x2="8" y2="24"/>
        <line x1="25" y1="20" x2="28" y2="24"/>
      </svg>
    `;

    const adsSvg = `
      <svg viewBox="0 0 32 32" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="16" cy="16" r="12" stroke-width="1.8"/>
        <circle cx="16" cy="16" r="5" stroke-dasharray="2 2" stroke-width="1.4"/>
        <circle cx="16" cy="16" r="1.6" fill="currentColor"/>
        <line x1="16" y1="2" x2="16" y2="9"/>
        <line x1="16" y1="23" x2="16" y2="30"/>
        <line x1="2" y1="16" x2="9" y2="16"/>
        <line x1="23" y1="16" x2="30" y2="16"/>
      </svg>
    `;

    const jumpSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 17 L16 9 L24 17"/>
        <path d="M10 23 L16 17 L22 23"/>
        <line x1="9" y1="28" x2="23" y2="28" stroke-width="2"/>
      </svg>
    `;

    const crouchSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 10 L16 19 L25 10"/>
        <path d="M9 16 L16 23 L23 16"/>
        <line x1="7" y1="27" x2="25" y2="27" stroke-width="2" stroke-dasharray="4 2"/>
      </svg>
    `;

    const reloadSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M26 13 A11 11 0 1 0 25 21"/>
        <polyline points="22 13 26 13 26 9"/>
        <rect x="13.5" y="10" width="5" height="12" rx="1" fill="currentColor" opacity="0.25"/>
        <line x1="13.5" y1="14" x2="18.5" y2="14"/>
        <line x1="13.5" y1="18" x2="18.5" y2="18"/>
      </svg>
    `;

    // Diamond Layout Buttons (Icon Only):
    // Fire (Center, 100px)
    const btnFire = this.createButton('btn-touch-fire', fireSvg, 100, 85, 85, true);
    // ADS (Top, 76px)
    const btnAds = this.createButton('btn-touch-aim', adsSvg, 76, 97, 0, false);
    // Jump (Right, 76px)
    const btnJump = this.createButton('btn-touch-jump', jumpSvg, 76, 194, 97, false);
    // Crouch / Slide (Bottom, 76px)
    const btnCrouch = this.createButton('btn-touch-slide', crouchSvg, 76, 97, 194, false);
    // Reload (Left, 76px)
    const btnReload = this.createButton('btn-touch-reload', reloadSvg, 76, 0, 97, false);

    combatCluster.appendChild(btnFire);
    combatCluster.appendChild(btnAds);
    combatCluster.appendChild(btnJump);
    combatCluster.appendChild(btnCrouch);
    combatCluster.appendChild(btnReload);
    container.appendChild(combatCluster);
    this.combatCluster = combatCluster;

    this.buttons = {
      fire: btnFire,
      ads: btnAds,
      jump: btnJump,
      crouch: btnCrouch,
      reload: btnReload,
      grenade: btnGrenade
    };

    // 5. Collapsible Tactical Drawer (Right Edge)
    const tacticalDrawer = document.createElement('div');
    tacticalDrawer.id = 'mobile-tactical-drawer';
    tacticalDrawer.style.cssText = `
      position: absolute;
      top: calc(75px + env(safe-area-inset-top));
      right: calc(12px + env(safe-area-inset-right));
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      pointer-events: auto;
      z-index: 20;
    `;

    const toggleTab = document.createElement('button');
    toggleTab.id = 'btn-tactical-toggle';
    toggleTab.className = 'sketch-btn';
    toggleTab.innerHTML = `☰ TAC`;
    toggleTab.style.cssText = `
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(248, 246, 240, 0.9);
      border: 2px solid #162a68;
      color: #162a68;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 2px 2px 0px rgba(22,42,104,0.3);
    `;

    const drawerBody = document.createElement('div');
    drawerBody.id = 'tactical-drawer-body';
    drawerBody.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 6px;
      background: rgba(248, 246, 240, 0.95);
      border: 2px solid #162a68;
      padding: 8px;
      border-radius: 8px;
      box-shadow: 3px 3px 0px rgba(22,42,104,0.3);
      backdrop-filter: blur(4px);
    `;

    const subButtons = [
      { id: 'btn-tactical-map', label: '🗺 MAP', action: () => this.toggleMap() },
      { id: 'btn-tactical-radio', label: '📻 RADIO', action: () => this.toggleRadio() },
      { id: 'btn-tactical-insp', label: '🔍 INSP', action: () => this.player.inspectWeapon() },
      { id: 'btn-tactical-dive', label: '🕊 DIVE', action: () => this.player.tryDive() },
      { id: 'btn-tactical-hud', label: '👁 HUD', action: () => this.toggleHUDHide() }
    ];

    subButtons.forEach(sb => {
      const b = document.createElement('button');
      b.id = sb.id;
      b.className = 'sketch-btn';
      b.textContent = sb.label;
      b.style.cssText = `
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 700;
        text-align: left;
        background: #faf8f2;
        border: 1.5px solid #162a68;
        color: #162a68;
        cursor: pointer;
      `;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        sb.action();
      });
      drawerBody.appendChild(b);
    });

    toggleTab.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isTacticalDrawerOpen = !this.isTacticalDrawerOpen;
      drawerBody.style.display = this.isTacticalDrawerOpen ? 'flex' : 'none';
      toggleTab.innerHTML = this.isTacticalDrawerOpen ? '✕ CLOSE' : '☰ TAC';
    });

    tacticalDrawer.appendChild(toggleTab);
    tacticalDrawer.appendChild(drawerBody);
    container.appendChild(tacticalDrawer);
    this.tacticalDrawer = tacticalDrawer;
    this.drawerBody = drawerBody;
    this.toggleTab = toggleTab;
  }

  createButton(id, label, size, left, top, isPrimary = false) {
    const btn = document.createElement('div');
    btn.id = id;
    btn.className = 'blueprint-touch-btn' + (isPrimary ? ' primary' : '');
    btn.innerHTML = label;
    btn.style.cssText = `
      position: absolute;
      left: ${left}px;
      top: ${top}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${isPrimary ? '3px solid #c9182b' : '2px solid #162a68'};
      background: ${isPrimary ? 'rgba(201, 24, 43, 0.92)' : 'rgba(248, 246, 240, 0.9)'};
      color: ${isPrimary ? '#faf8f2' : '#162a68'};
      font-family: 'Space Mono', monospace;
      font-size: ${size >= 90 ? '14px' : '11px'};
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      touch-action: none;
      box-shadow: 2px 2px 0px ${isPrimary ? 'rgba(201,24,43,0.3)' : 'rgba(22,42,104,0.25)'};
      cursor: pointer;
      transition: transform 0.08s ease, background 0.08s ease;
    `;
    return btn;
  }

  bindPointerEvents() {
    // 1. Joystick Pointer Handling
    this.joyRing.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.joyRing.setPointerCapture(e.pointerId);
      this.joystick.active = true;
      this.joystick.pointerId = e.pointerId;

      const rect = this.joyRing.getBoundingClientRect();
      this.joystick.baseX = rect.left + rect.width / 2;
      this.joystick.baseY = rect.top + rect.height / 2;
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    this.joyRing.addEventListener('pointermove', (e) => {
      if (!this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    const endJoy = (e) => {
      if (e.pointerId === this.joystick.pointerId) {
        this.joystick.active = false;
        this.joystick.pointerId = null;
        this.joystick.vectorX = 0;
        this.joystick.vectorZ = 0;
        this.joyThumb.style.transform = `translate(-50%, -50%)`;
        if (this.inputManager) {
          this.inputManager.setMoveVector(0, 0);
        }
        this.player.keys.forward = false;
        this.player.keys.backward = false;
        this.player.keys.left = false;
        this.player.keys.right = false;
      }
    };

    this.joyRing.addEventListener('pointerup', endJoy);
    this.joyRing.addEventListener('pointercancel', endJoy);

    // 2. Look Drag Pointer Handling (Aiming)
    this.lookZone.addEventListener('pointerdown', (e) => {
      if (this.lookPointer.active) return;
      this.lookPointer.active = true;
      this.lookPointer.pointerId = e.pointerId;
      this.lookPointer.lastX = e.clientX;
      this.lookPointer.lastY = e.clientY;
      this.lookZone.setPointerCapture(e.pointerId);
    });

    this.lookZone.addEventListener('pointermove', (e) => {
      if (!this.lookPointer.active || e.pointerId !== this.lookPointer.pointerId) return;
      const dx = e.clientX - this.lookPointer.lastX;
      const dy = e.clientY - this.lookPointer.lastY;
      this.lookPointer.lastX = e.clientX;
      this.lookPointer.lastY = e.clientY;

      const factor = 0.0032 * this.player.mouseSensitivity;
      if (this.inputManager) {
        this.inputManager.addLookDelta(dx * factor, dy * factor);
      } else {
        this.player.yaw -= dx * factor;
        this.player.pitch -= dy * factor;
        this.player.pitch = Math.max(-1.48, Math.min(1.48, this.player.pitch));
      }
    });

    const endLook = (e) => {
      if (e.pointerId === this.lookPointer.pointerId) {
        this.lookPointer.active = false;
        this.lookPointer.pointerId = null;
      }
    };

    this.lookZone.addEventListener('pointerup', endLook);
    this.lookZone.addEventListener('pointercancel', endLook);

    // 3. Combat Buttons Multi-Touch Handling
    // Fire
    this.setupButtonTouch(this.buttons.fire, () => {
      this.player.isShooting = true;
      if (this.game.attemptShoot) this.game.attemptShoot();
    }, () => {
      this.player.isShooting = false;
    });

    // ADS
    this.setupButtonTouch(this.buttons.ads, () => {
      this.player.isAiming = !this.player.isAiming;
      if (this.player.onAimChange) this.player.onAimChange(this.player.isAiming);
      this.buttons.ads.style.background = this.player.isAiming ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      this.buttons.ads.style.color = this.player.isAiming ? '#faf8f2' : '#162a68';
    });

    // Jump
    this.setupButtonTouch(this.buttons.jump, () => {
      if (this.player.isSliding || this.player.isDiving) {
        this.player.cancelSlide();
        this.player.isDiving = false;
      }
      if (this.player.isGrounded && !this.player.keys.crouch) {
        if (!this.player.tryMantle()) {
          this.player.velocity.y = this.player.jumpForce;
          this.player.isGrounded = false;
        }
      }
    });

    // Crouch / Slide
    this.setupButtonTouch(this.buttons.crouch, () => {
      this.player.keys.crouch = !this.player.keys.crouch;
      if (this.player.keys.crouch && (this.player.keys.sprint || this.player.isTacSprinting)) {
        this.player.trySlide();
      }
      this.buttons.crouch.style.background = this.player.keys.crouch ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      this.buttons.crouch.style.color = this.player.keys.crouch ? '#faf8f2' : '#162a68';
    });

    // Reload
    this.setupButtonTouch(this.buttons.reload, () => {
      if (this.player.onReloadRequested) this.player.onReloadRequested();
    });

    // Grenade
    this.setupButtonTouch(this.buttons.grenade, () => {
      if (this.player.onGrenadeRequested) this.player.onGrenadeRequested();
    });
  }

  setupButtonTouch(el, onPress, onRelease = null) {
    el.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      el.style.transform = 'scale(0.92)';
      if (onPress) onPress();
    });

    const release = (e) => {
      el.style.transform = 'scale(1.0)';
      if (onRelease) onRelease();
    };

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystick.baseX;
    const dy = clientY - this.joystick.baseY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, this.joystick.maxRadius);
    const angle = Math.atan2(dy, dx);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    this.joyThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;

    // Normalize to -1.0 .. +1.0
    const normX = thumbX / this.joystick.maxRadius;
    const normY = thumbY / this.joystick.maxRadius;

    this.joystick.vectorX = normX;
    this.joystick.vectorZ = normY;

    if (this.inputManager) {
      this.inputManager.setMoveVector(normX, normY);
    }

    // Also fallback to WASD key states for backward compatibility
    this.player.keys.forward = normY < -0.3;
    this.player.keys.backward = normY > 0.3;
    this.player.keys.left = normX < -0.3;
    this.player.keys.right = normX > 0.3;
    this.player.keys.sprint = dist >= this.joystick.maxRadius * 0.95;
  }

  updateGrenades(count) {
    const nadeNum = document.getElementById('mobile-nade-num');
    if (nadeNum) nadeNum.textContent = count;
  }

  toggleMap() {
    if (this.game.minimap) {
      this.game.minimap.toggleMapMode();
    }
  }

  toggleRadio() {
    if (this.game.voiceChat) {
      this.game.voiceChat.showRadioWheel();
    }
  }

  toggleHUDHide() {
    this.isHUDHidden = !this.isHUDHidden;
    const hudContainer = document.getElementById('hud-container');
    if (hudContainer) {
      hudContainer.style.opacity = this.isHUDHidden ? '0' : '1';
      hudContainer.style.pointerEvents = this.isHUDHidden ? 'none' : 'auto';
    }
    if (this.combatCluster) {
      this.combatCluster.style.opacity = this.isHUDHidden ? '0.15' : '1';
    }
    if (this.joyContainer) {
      this.joyContainer.style.opacity = this.isHUDHidden ? '0.15' : '1';
    }
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  enterCustomizerMode() {
    this.enable();
    if (this.onExitCustomizer) {
      setTimeout(() => {
        if (this.onExitCustomizer) this.onExitCustomizer();
      }, 1500);
    }
  }

  requestLandscapeFullscreen() {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      } else if (docEl.msRequestFullscreen) {
        docEl.msRequestFullscreen();
      }

      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (err) {
      console.warn('Fullscreen/Orientation request deferred:', err.message);
    }
  }

  setupOrientationWatcher() {
    const overlay = document.getElementById('mobile-rotate-overlay');
    let userDismissed = false;

    const checkOrientation = () => {
      if (!overlay) return;
      if (userDismissed) {
        overlay.style.display = 'none';
        return;
      }
      // Check if viewport is in portrait mode
      const isPortrait = window.innerWidth < window.innerHeight;
      if (isPortrait) {
        overlay.style.display = 'flex';
      } else {
        overlay.style.display = 'none';
      }
    };

    const btnFs = document.getElementById('btn-request-mobile-fullscreen');
    if (btnFs) {
      btnFs.addEventListener('click', () => {
        this.requestLandscapeFullscreen();
        if (this.game && this.game.soundEngine) this.game.soundEngine.playUIClick();
        setTimeout(checkOrientation, 300);
      });
    }

    const btnDismiss = document.getElementById('btn-dismiss-rotate-overlay');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        userDismissed = true;
        if (overlay) overlay.style.display = 'none';
        if (this.game && this.game.soundEngine) this.game.soundEngine.playUIClick();
      });
    }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    document.addEventListener('fullscreenchange', () => {
      setTimeout(checkOrientation, 200);
    });

    checkOrientation();
  }
}

