// Professional Competitive Mobile FPS Touch Controls for ASTRA: One Shotted
// Inspired by PUBG Mobile / BGMI and Call of Duty Mobile with original ASTRA Blueprint Aesthetic.
// Supports Virtual Movement Joystick with Sprint Lock Slider, Dual Fire (Right + Left Claw),
// ADS, Crouch, Prone, Jump, Reload with Circular Progress, Peek Left/Right, Melee Knife,
// Left & Right Contextual Ground Loot Pickups, and Full HUD Customizer Integration.

export class MobileControls {
  constructor(player, weapons, game) {
    this.player = player;
    this.weapons = weapons;
    this.game = game;
    this.inputManager = game.inputManager;

    this.isEnabled = false;
    this.isHUDHidden = false;
    this.isCustomizerEditing = false;
    this.highlightedControlId = null;

    // Sprint state
    this.isSprintLocked = false;
    this.isSprintHeld = false;

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
      maxRadius: 55,
      sprintLockDistance: 85 // Distance to drag upward to lock sprint
    };

    // Look Aim Tracking
    this.lookPointer = {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0
    };

    // Drag-and-drop editing state
    this.dragState = {
      active: false,
      controlId: null,
      pointerId: null,
      startX: 0,
      startY: 0,
      initialNormX: 0,
      initialNormY: 0
    };

    // Nearby Loot Items (fed from LootSystem)
    this.nearbyLoot = [];
    this.isLootListExpanded = false;

    // Tactical Drawer state
    this.isTacticalDrawerOpen = false;

    // Dictionary of all customizable control DOM elements
    this.controls = {};

    this.buildMobileDOM();
    this.bindTouchControls();
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
  }

  disable() {
    this.isEnabled = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  setCustomizerEditing(isEditing) {
    this.isCustomizerEditing = isEditing;
    if (this.lookZone) {
      this.lookZone.style.pointerEvents = isEditing ? 'none' : 'auto';
    }

    // Toggle editor visual bounding boxes
    for (const [id, el] of Object.entries(this.controls)) {
      if (!el) continue;
      if (isEditing) {
        el.classList.add('editor-draggable');
      } else {
        el.classList.remove('editor-draggable', 'editor-selected', 'editor-overlap');
      }
    }
  }

  highlightControl(id) {
    this.highlightedControlId = id;
    for (const [ctrlId, el] of Object.entries(this.controls)) {
      if (!el) continue;
      if (ctrlId === id) {
        el.classList.add('editor-selected');
      } else {
        el.classList.remove('editor-selected');
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

    // 2. Fullscreen Look Touch Surface (Right side & center)
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

    // 3. Movement Joystick Container with Upward Sprint Lock
    const joyContainer = document.createElement('div');
    joyContainer.id = 'mobile-joy-container';
    joyContainer.className = 'mobile-hud-control';
    joyContainer.style.cssText = `
      position: absolute;
      width: 130px;
      height: 130px;
      pointer-events: auto;
      touch-action: none;
      z-index: 10;
    `;

    // Sprint Lock Guide Line (Dotted line extending upward to sprint lock)
    const sprintLockLine = document.createElement('div');
    sprintLockLine.id = 'mobile-sprint-lock-line';
    sprintLockLine.style.cssText = `
      position: absolute;
      bottom: 65px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 60px;
      border-left: 2px dashed rgba(22, 42, 104, 0.45);
      pointer-events: none;
      transition: opacity 0.15s ease;
    `;
    joyContainer.appendChild(sprintLockLine);
    this.sprintLockLine = sprintLockLine;

    // Sprint Cancel Circle (matching PUBG Mobile layout reference)
    const btnCancelSprint = document.createElement('div');
    btnCancelSprint.id = 'mobile-sprint-cancel';
    btnCancelSprint.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid rgba(22, 42, 104, 0.6);
      background: rgba(248, 246, 240, 0.92);
      color: #162a68;
      font-family: 'Space Mono', monospace;
      font-size: 8px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      letter-spacing: 0.3px;
    `;
    btnCancelSprint.textContent = 'Cancel';
    sprintLockLine.appendChild(btnCancelSprint);
    this.btnCancelSprint = btnCancelSprint;

    // Joystick Ring Base
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
      box-shadow: inset 0 0 14px rgba(22, 42, 104, 0.12);
    `;

    // Directional Cross
    const crossHoriz = document.createElement('div');
    crossHoriz.style.cssText = 'position:absolute;top:50%;left:15%;width:70%;height:1px;background:rgba(22,42,104,0.3);pointer-events:none;';
    const crossVert = document.createElement('div');
    crossVert.style.cssText = 'position:absolute;left:50%;top:15%;width:1px;height:70%;background:rgba(22,42,104,0.3);pointer-events:none;';
    joyRing.appendChild(crossHoriz);
    joyRing.appendChild(crossVert);

    // Inner Thumb Stick
    const joyThumb = document.createElement('div');
    joyThumb.id = 'mobile-joystick-thumb';
    joyThumb.style.cssText = `
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: #162a68;
      border: 2px solid #faf8f2;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 3px 8px rgba(22, 42, 104, 0.4);
      transition: transform 0.04s ease-out;
    `;
    joyRing.appendChild(joyThumb);
    joyContainer.appendChild(joyRing);
    container.appendChild(joyContainer);

    this.joyContainer = joyContainer;
    this.joyRing = joyRing;
    this.joyThumb = joyThumb;
    this.controls['joyContainer'] = joyContainer;

    // 4. Dedicated Sprint Button & Lock Target (docked above joystick)
    const btnSprint = this.createHudButton('btn-touch-sprint', `
      <svg viewBox="0 0 28 28" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="16" cy="6" r="3"/>
        <path d="M7 23 L11 16 L15 17 L19 23"/>
        <path d="M12 11 L16 13 L21 10"/>
        <path d="M12 11 L9 15 L5 14"/>
      </svg>
      <span id="sprint-lock-tag" style="position: absolute; bottom: -16px; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: #162a68;">SPRINT</span>
    `, 52, false);
    container.appendChild(btnSprint);
    this.btnSprint = btnSprint;
    this.controls['btnSprint'] = btnSprint;

    // 5. Combat Buttons (Diamond Cluster + Extra Tactical Controls)
    // SVG Icons matching PUBG Mobile / BGMI reference
    const fireSvg = `
      <svg viewBox="0 0 54 54" width="48" height="48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <g transform="rotate(-45 27 27)">
          <!-- Bullet Head -->
          <path d="M23 11 C23 6 27 2.5 27 2.5 C27 2.5 31 6 31 11 L31 21 L23 21 Z" fill="currentColor" opacity="0.95"/>
          <!-- Cartridge Body -->
          <rect x="22.5" y="21.5" width="9" height="21" rx="1.5" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.25"/>
          <line x1="22.5" y1="38" x2="31.5" y2="38" stroke="currentColor" stroke-width="1.8"/>
          <!-- Rim Base -->
          <path d="M21 42.5 L33 42.5 L33 44.5 L21 44.5 Z" fill="currentColor"/>
          <!-- Concentric guidance ring -->
          <circle cx="27" cy="27" r="23" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 5" opacity="0.4"/>
        </g>
      </svg>
    `;

    const adsSvg = `
      <svg viewBox="0 0 44 44" width="42" height="42" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="22" cy="22" r="16" stroke-width="2"/>
        <circle cx="22" cy="22" r="8.5" stroke-dasharray="3 3" stroke-width="1.5"/>
        <circle cx="22" cy="22" r="2.2" fill="currentColor"/>
        <line x1="22" y1="2" x2="22" y2="9.5" stroke-width="2.2"/>
        <line x1="22" y1="34.5" x2="22" y2="42" stroke-width="2.2"/>
        <line x1="2" y1="22" x2="9.5" y2="22" stroke-width="2.2"/>
        <line x1="34.5" y1="22" x2="42" y2="22" stroke-width="2.2"/>
        <line x1="22" y1="12" x2="22" y2="14" stroke-width="1.6"/>
        <line x1="22" y1="30" x2="22" y2="32" stroke-width="1.6"/>
        <line x1="12" y1="22" x2="14" y2="22" stroke-width="1.6"/>
        <line x1="30" y1="22" x2="32" y2="22" stroke-width="1.6"/>
      </svg>
    `;

    const jumpSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17 L16 8 L25 17"/>
        <path d="M9 23 L16 16 L23 23"/>
        <line x1="8" y1="28" x2="24" y2="28" stroke-width="2.2"/>
      </svg>
    `;

    const crouchSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="16" cy="7" r="3.2" fill="currentColor" fill-opacity="0.3"/>
        <path d="M10 14 L16 19 L22 14"/>
        <path d="M8 23 L16 28 L24 23"/>
        <line x1="6" y1="29" x2="26" y2="29" stroke-width="2" stroke-dasharray="3 2"/>
      </svg>
    `;

    const proneSvg = `
      <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <ellipse cx="6" cy="18" rx="2.5" ry="2.5" fill="currentColor" fill-opacity="0.3"/>
        <path d="M9 18 L24 18 L27 23"/>
        <line x1="4" y1="26" x2="28" y2="26" stroke-width="2" stroke-dasharray="3 2"/>
      </svg>
    `;

    const reloadSvg = `
      <svg viewBox="0 0 34 34" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M27 14 A12 12 0 1 0 26 22"/>
        <polyline points="23 14 27 14 27 10"/>
        <rect x="14.5" y="11" width="5" height="12" rx="1.2" fill="currentColor" opacity="0.3"/>
        <line x1="14.5" y1="15" x2="19.5" y2="15"/>
      </svg>
    `;

    const peekLeftSvg = `
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 6 C10 6 6 10 6 15 L6 22 L22 22 L22 15 C22 10 18 6 14 6 Z"/>
        <line x1="10" y1="14" x2="5" y2="10"/>
        <polyline points="5 14 9 14 9 10"/>
      </svg>
    `;

    const peekRightSvg = `
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 6 C10 6 6 10 6 15 L6 22 L22 22 L22 15 C22 10 18 6 14 6 Z"/>
        <line x1="18" y1="14" x2="23" y2="10"/>
        <polyline points="23 14 19 14 19 10"/>
      </svg>
    `;

    const meleeSvg = `
      <svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 4 L24 8 L12 20 L8 20 L8 16 Z"/>
        <line x1="6" y1="22" x2="10" y2="18"/>
      </svg>
    `;

    const grenadeSvg = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 4 L16 4"/>
          <circle cx="8" cy="6" r="3"/>
          <ellipse cx="14" cy="17" rx="7" ry="8" fill="rgba(22,42,104,0.08)"/>
          <line x1="14" y1="9" x2="14" y2="25"/>
          <line x1="8" y1="14" x2="20" y2="14"/>
        </svg>
        <span id="mobile-nade-num" style="position: absolute; top: -4px; right: -2px; font-size: 11px; font-weight: 700; background: #c9182b; color: #faf8f2; padding: 1px 5px; border-radius: 9px; border: 1.5px solid #162a68; line-height: 1.1;">2</span>
      </div>
    `;

    const reviveSvg = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="16" cy="16" r="13" stroke-dasharray="3 2" opacity="0.45"/>
          <line x1="16" y1="9" x2="16" y2="23" stroke-width="3.2"/>
          <line x1="9" y1="16" x2="23" y2="16" stroke-width="3.2"/>
        </svg>
        <span style="font-size: 8px; font-weight: 800; letter-spacing: 0.5px; margin-top: -2px;">Revive</span>
      </div>
    `;

    const eyeSvg = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
        <svg viewBox="0 0 32 32" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 16 S7 8 16 8 S30 16 30 16 S25 24 16 24 S2 16 2 16 Z"/>
          <circle cx="16" cy="16" r="4" fill="currentColor" fill-opacity="0.3"/>
          <circle cx="16" cy="16" r="1.6" fill="currentColor"/>
          <path d="M22 8 A12 12 0 0 1 26 13" stroke-width="1.8"/>
          <polyline points="23 13 26 13 26 10" stroke-width="1.8"/>
        </svg>
        <span style="font-size: 8px; font-weight: 800; letter-spacing: 0.5px; margin-top: -2px;">Side</span>
      </div>
    `;

    const perspectiveSvg = `
      <span id="mobile-perspective-label" style="font-family:'Space Mono',monospace; font-size: 11px; font-weight: 800; letter-spacing: 0.5px;">FPP</span>
    `;

    const backpackSvg = `
      <svg viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 9 C7 5 10 3 14 3 C18 3 21 5 21 9 L21 23 C21 25 19 26 17 26 L11 26 C9 26 7 25 7 23 Z"/>
        <path d="M4 11 L7 11 L7 21 L4 21 Z"/>
        <path d="M21 11 L24 11 L24 21 L21 21 Z"/>
        <rect x="10" y="13" width="8" height="7" rx="1.5" fill="currentColor" fill-opacity="0.25"/>
      </svg>
    `;

    // Instantiate Individual Customizable Controls
    const btnFireRight = this.createHudButton('btn-touch-fire-right', fireSvg, 96, true);
    const btnFireLeft = this.createHudButton('btn-touch-fire-left', fireSvg, 80, true);
    const btnAds = this.createHudButton('btn-touch-aim', adsSvg, 76, false);
    const btnJump = this.createHudButton('btn-touch-jump', jumpSvg, 70, false);
    const btnCrouch = this.createHudButton('btn-touch-slide', crouchSvg, 68, false);
    const btnProne = this.createHudButton('btn-touch-prone', proneSvg, 64, false);
    const btnReload = this.createHudButton('btn-touch-reload', reloadSvg, 68, false);
    const btnPeekLeft = this.createHudButton('btn-touch-peek-left', peekLeftSvg, 54, false);
    const btnPeekRight = this.createHudButton('btn-touch-peek-right', peekRightSvg, 54, false);
    const btnGrenade = this.createHudButton('btn-touch-grenade', grenadeSvg, 56, false);
    const btnMelee = this.createHudButton('btn-touch-melee', meleeSvg, 54, false);
    const btnRevive = this.createHudButton('btn-touch-revive', reviveSvg, 68, false);
    const btnEyeLook = this.createHudButton('btn-touch-eye-look', eyeSvg, 56, false);
    const btnPerspective = this.createHudButton('btn-touch-perspective', perspectiveSvg, 52, false);
    const btnBackpack = this.createHudButton('btn-touch-backpack', backpackSvg, 48, false);

    container.appendChild(btnFireRight);
    container.appendChild(btnFireLeft);
    container.appendChild(btnAds);
    container.appendChild(btnJump);
    container.appendChild(btnCrouch);
    container.appendChild(btnProne);
    container.appendChild(btnReload);
    container.appendChild(btnPeekLeft);
    container.appendChild(btnPeekRight);
    container.appendChild(btnGrenade);
    container.appendChild(btnMelee);
    container.appendChild(btnRevive);
    container.appendChild(btnEyeLook);
    container.appendChild(btnPerspective);
    container.appendChild(btnBackpack);

    this.controls['btnFireRight'] = btnFireRight;
    this.controls['btnFireLeft'] = btnFireLeft;
    this.controls['btnAds'] = btnAds;
    this.controls['btnJump'] = btnJump;
    this.controls['btnCrouch'] = btnCrouch;
    this.controls['btnProne'] = btnProne;
    this.controls['btnReload'] = btnReload;
    this.controls['btnPeekLeft'] = btnPeekLeft;
    this.controls['btnPeekRight'] = btnPeekRight;
    this.controls['btnGrenade'] = btnGrenade;
    this.controls['btnMelee'] = btnMelee;
    this.controls['btnRevive'] = btnRevive;
    this.controls['btnEyeLook'] = btnEyeLook;
    this.controls['btnPerspective'] = btnPerspective;
    this.controls['btnBackpack'] = btnBackpack;

    // 6. Contextual Pickup Buttons (Left & Right)
    const btnPickLeft = this.createPickupButton('btn-touch-pick-left', 'PICK');
    const btnPickRight = this.createPickupButton('btn-touch-pick-right', 'PICK');
    container.appendChild(btnPickLeft);
    container.appendChild(btnPickRight);
    this.controls['btnPickLeft'] = btnPickLeft;
    this.controls['btnPickRight'] = btnPickRight;

    // Vertical Loot List Stack (shows when multiple ground loot items are close)
    const lootListStack = document.createElement('div');
    lootListStack.id = 'mobile-loot-stack';
    lootListStack.style.cssText = `
      position: absolute;
      left: 50%;
      top: 48%;
      transform: translate(-50%, -50%);
      display: none;
      flex-direction: column;
      gap: 6px;
      width: 240px;
      max-height: 180px;
      overflow-y: auto;
      background: rgba(248, 246, 240, 0.96);
      border: 2px solid #162a68;
      border-radius: 8px;
      padding: 8px;
      box-shadow: 4px 4px 0px rgba(22,42,104,0.3);
      z-index: 25;
      pointer-events: auto;
    `;
    container.appendChild(lootListStack);
    this.lootListStack = lootListStack;

    // 7. Register In-Game HUD Elements for Customizer Moving
    const hudWeaponBar = document.getElementById('hud-weapon-bar');
    if (hudWeaponBar) {
      hudWeaponBar.classList.add('mobile-hud-control');
      this.controls['weaponBar'] = hudWeaponBar;
    }
    const minimapContainer = document.getElementById('minimap-container');
    if (minimapContainer) {
      minimapContainer.classList.add('mobile-hud-control');
      this.controls['minimap'] = minimapContainer;
    }
    const hudTopCenter = document.getElementById('hud-top-center-bar');
    if (hudTopCenter) {
      hudTopCenter.classList.add('mobile-hud-control');
      this.controls['topScore'] = hudTopCenter;
    }

    // Attach drag customization listeners to all controls
    for (const [id, el] of Object.entries(this.controls)) {
      if (!el) continue;
      this.setupDraggableControl(id, el);
    }
  }

  createHudButton(id, html, size, isPrimary = false) {
    const btn = document.createElement('div');
    btn.id = id;
    btn.className = 'blueprint-touch-btn mobile-hud-control' + (isPrimary ? ' primary' : '');
    btn.innerHTML = html;
    btn.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: ${isPrimary ? '3px solid #c9182b' : '2px solid #162a68'};
      background: ${isPrimary ? 'rgba(201, 24, 43, 0.92)' : 'rgba(248, 246, 240, 0.9)'};
      color: ${isPrimary ? '#faf8f2' : '#162a68'};
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      touch-action: none;
      box-shadow: 2px 2px 0px ${isPrimary ? 'rgba(201,24,43,0.3)' : 'rgba(22,42,104,0.25)'};
      cursor: pointer;
      transform: translate(-50%, -50%);
      z-index: 15;
    `;
    return btn;
  }

  createPickupButton(id, defaultText) {
    const btn = document.createElement('div');
    btn.id = id;
    btn.className = 'blueprint-touch-btn mobile-hud-control tactical-pick-btn';
    btn.style.cssText = `
      position: absolute;
      padding: 6px 14px;
      min-width: 100px;
      height: 48px;
      border-radius: 8px;
      border: 2px solid #162a68;
      background: rgba(248, 246, 240, 0.94);
      color: #162a68;
      font-family: 'Space Mono', monospace;
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      pointer-events: auto;
      touch-action: none;
      box-shadow: 3px 3px 0px rgba(22, 42, 104, 0.25);
      cursor: pointer;
      transform: translate(-50%, -50%);
      z-index: 20;
    `;
    btn.innerHTML = `
      <div style="display: flex; flex-direction: column; text-align: left;">
        <span class="pick-label-action" style="font-size: 11px; font-weight: 700; color: #c9182b;">${defaultText}</span>
        <span class="pick-label-item" style="font-size: 10px; font-weight: 700; opacity: 0.85;">ITEM</span>
      </div>
      <span style="font-size: 14px;">✋</span>
    `;
    return btn;
  }

  // Setup Drag-and-Drop Editing for HUD Customizer
  setupDraggableControl(id, el) {
    el.addEventListener('pointerdown', (e) => {
      if (!this.isCustomizerEditing) return;
      e.stopPropagation();

      // Select in Customizer Inspector
      if (this.game && this.game.hudCustomizer) {
        this.game.hudCustomizer.selectControl(id);
      }

      // Check if control is locked
      const layout = this.game.hudCustomizer ? this.game.hudCustomizer.getActiveLayout() : null;
      const ctrlData = layout && layout.controls ? layout.controls[id] : null;
      if (ctrlData && ctrlData.locked) {
        if (this.game.hudCustomizer) this.game.hudCustomizer.showToast('🔒 Control is locked. Unlock to move.');
        return;
      }

      el.setPointerCapture(e.pointerId);
      this.dragState.active = true;
      this.dragState.controlId = id;
      this.dragState.pointerId = e.pointerId;
      this.dragState.startX = e.clientX;
      this.dragState.startY = e.clientY;
      this.dragState.initialNormX = ctrlData ? ctrlData.x : 0.5;
      this.dragState.initialNormY = ctrlData ? ctrlData.y : 0.5;
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isCustomizerEditing || !this.dragState.active || this.dragState.pointerId !== e.pointerId) return;

      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      let newNormX = this.dragState.initialNormX + (dx / screenW);
      let newNormY = this.dragState.initialNormY + (dy / screenH);

      // Grid Snapping
      if (this.game.hudCustomizer && this.game.hudCustomizer.gridEnabled) {
        const step = this.game.hudCustomizer.gridSizePercent / 100;
        newNormX = Math.round(newNormX / step) * step;
        newNormY = Math.round(newNormY / step) * step;
      }

      // Clamp within screen safe area
      newNormX = Math.max(0.04, Math.min(0.96, newNormX));
      newNormY = Math.max(0.04, Math.min(0.96, newNormY));

      const layout = this.game.hudCustomizer.getActiveLayout();
      if (layout && layout.controls && layout.controls[id]) {
        layout.controls[id].x = newNormX;
        layout.controls[id].y = newNormY;
        this.applyNormalizedControl(id, layout.controls[id]);
        this.game.hudCustomizer.updateInspectorCoords(layout.controls[id]);
      }
    });

    const endDrag = (e) => {
      if (this.dragState.active && this.dragState.pointerId === e.pointerId) {
        this.dragState.active = false;
        this.dragState.controlId = null;
        this.dragState.pointerId = null;
      }
    };

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  }

  // Apply layout coordinate model to DOM element
  applyNormalizedControl(id, ctrl) {
    const el = this.controls[id];
    if (!el || !ctrl) return;

    // Safety clamp within viewport bounds (5% to 95%) to prevent offscreen clipping
    const safeX = Math.max(0.05, Math.min(0.95, ctrl.x));
    const safeY = Math.max(0.05, Math.min(0.95, ctrl.y));

    el.style.left = `${(safeX * 100).toFixed(2)}%`;
    el.style.top = `${(safeY * 100).toFixed(2)}%`;
    el.style.opacity = ctrl.visible ? ctrl.opacity.toString() : '0.15';
    el.style.display = (ctrl.visible || this.isCustomizerEditing) ? 'flex' : 'none';

    // Apply scale & transform
    const scale = ctrl.size || 1.0;
    el.style.transform = `translate(-50%, -50%) scale(${scale})`;

    // Apply Style Classes
    el.classList.remove('style-circle', 'style-rounded', 'style-tactical', 'style-minimal');
    if (ctrl.style) {
      el.classList.add(`style-${ctrl.style}`);
    }
  }

  // Bind Gameplay Touch Actions
  bindTouchControls() {
    // 1. Joystick Pointer Handling + Sprint Lock
    this.joyRing.addEventListener('pointerdown', (e) => {
      if (this.isCustomizerEditing) return;
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
      if (this.isCustomizerEditing || !this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
      this.updateJoystickPosition(e.clientX, e.clientY);
    });

    const endJoy = (e) => {
      if (e.pointerId === this.joystick.pointerId) {
        this.joystick.active = false;
        this.joystick.pointerId = null;
        this.joystick.vectorX = 0;
        this.joystick.vectorZ = 0;
        this.joyThumb.style.transform = `translate(-50%, -50%)`;

        // If sprint is locked, keep forward sprint active!
        if (this.isSprintLocked) {
          this.player.keys.forward = true;
          this.player.keys.sprint = true;
          if (this.inputManager) {
            this.inputManager.setMoveVector(0, -1);
          }
        } else {
          if (this.inputManager) {
            this.inputManager.setMoveVector(0, 0);
          }
          this.player.keys.forward = false;
          this.player.keys.backward = false;
          this.player.keys.left = false;
          this.player.keys.right = false;
          this.player.keys.sprint = false;
        }
      }
    };

    this.joyRing.addEventListener('pointerup', endJoy);
    this.joyRing.addEventListener('pointercancel', endJoy);

    // 2. Dedicated Sprint Button
    this.btnSprint.addEventListener('pointerdown', (e) => {
      if (this.isCustomizerEditing) return;
      e.stopPropagation();
      this.isSprintHeld = true;
      this.toggleSprintLock();
    });

    // 3. Look Drag Surface
    this.lookZone.addEventListener('pointerdown', (e) => {
      if (this.isCustomizerEditing || this.lookPointer.active) return;
      this.lookPointer.active = true;
      this.lookPointer.pointerId = e.pointerId;
      this.lookPointer.lastX = e.clientX;
      this.lookPointer.lastY = e.clientY;
      this.lookZone.setPointerCapture(e.pointerId);
    });

    this.lookZone.addEventListener('pointermove', (e) => {
      if (this.isCustomizerEditing || !this.lookPointer.active || e.pointerId !== this.lookPointer.pointerId) return;
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

    // 4. Combat Buttons
    // Right Fire
    this.setupButtonTouch(this.controls['btnFireRight'], () => {
      this.player.isShooting = true;
      if (this.game.attemptShoot) this.game.attemptShoot();
    }, () => {
      this.player.isShooting = false;
    }, 18);

    // Left Fire (Claw)
    this.setupButtonTouch(this.controls['btnFireLeft'], () => {
      this.player.isShooting = true;
      if (this.game.attemptShoot) this.game.attemptShoot();
    }, () => {
      this.player.isShooting = false;
    }, 18);

    // ADS
    this.setupButtonTouch(this.controls['btnAds'], () => {
      this.player.isAiming = !this.player.isAiming;
      if (this.player.onAimChange) this.player.onAimChange(this.player.isAiming);
      const btn = this.controls['btnAds'];
      btn.style.background = this.player.isAiming ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      btn.style.color = this.player.isAiming ? '#faf8f2' : '#162a68';
    });

    // Jump
    this.setupButtonTouch(this.controls['btnJump'], () => {
      if (this.player.isSliding || this.player.isDiving) {
        this.player.cancelSlide();
        this.player.isDiving = false;
      }
      if (this.player.isProning) {
        this.player.tryProne(); // Stand up from prone
      }
      if (this.player.isGrounded && !this.player.keys.crouch) {
        if (!this.player.tryMantle()) {
          this.player.velocity.y = this.player.jumpForce;
          this.player.isGrounded = false;
        }
      }
    });

    // Crouch / Slide
    this.setupButtonTouch(this.controls['btnCrouch'], () => {
      if (this.player.isProning) {
        this.player.tryProne(); // Cancel prone
      }
      this.player.keys.crouch = !this.player.keys.crouch;
      if (this.player.keys.crouch && (this.player.keys.sprint || this.player.isTacSprinting)) {
        this.player.trySlide();
      }
      const btn = this.controls['btnCrouch'];
      btn.style.background = this.player.keys.crouch ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      btn.style.color = this.player.keys.crouch ? '#faf8f2' : '#162a68';
    });

    // Prone
    this.setupButtonTouch(this.controls['btnProne'], () => {
      const isProne = this.player.tryProne();
      const btn = this.controls['btnProne'];
      btn.style.background = isProne ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      btn.style.color = isProne ? '#faf8f2' : '#162a68';
    });

    // Reload & Emergency Ammo Refill
    this.setupButtonTouch(this.controls['btnReload'], () => {
      if (this.player.onReloadRequested) {
        this.player.onReloadRequested();
      } else if (this.weapons) {
        this.weapons.reload();
      }
    }, null, 18);

    // Peek Left
    this.setupButtonTouch(this.controls['btnPeekLeft'], () => {
      const state = this.player.setPeek(-1);
      const btn = this.controls['btnPeekLeft'];
      btn.style.background = state === -1 ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      btn.style.color = state === -1 ? '#faf8f2' : '#162a68';
    });

    // Peek Right
    this.setupButtonTouch(this.controls['btnPeekRight'], () => {
      const state = this.player.setPeek(1);
      const btn = this.controls['btnPeekRight'];
      btn.style.background = state === 1 ? '#162a68' : 'rgba(248, 246, 240, 0.9)';
      btn.style.color = state === 1 ? '#faf8f2' : '#162a68';
    });

    // Grenade
    this.setupButtonTouch(this.controls['btnGrenade'], () => {
      if (this.player.onGrenadeRequested) this.player.onGrenadeRequested();
    });

    // Melee Knife
    this.setupButtonTouch(this.controls['btnMelee'], () => {
      if (this.weapons) {
        this.weapons.switchWeapon(4); // Switch to Knife and attack
        if (this.game.attemptShoot) this.game.attemptShoot();
      }
    });

    // Revive / Tactical Stim Button
    this.setupButtonTouch(this.controls['btnRevive'], () => {
      if (this.player) {
        const healAmt = 45;
        this.player.heal(healAmt);
        if (this.player.soundEngine && this.player.soundEngine.playHealthRegen) {
          this.player.soundEngine.playHealthRegen();
        }
        if (this.game && this.game.hudCustomizer) {
          this.game.hudCustomizer.showToast('💉 FIELD STIM REVIVE (+45 HP)');
        }
      }
    });

    // Eye / Free Look Button (rotate camera without altering player movement direction)
    const btnEye = this.controls['btnEyeLook'];
    if (btnEye) {
      const eyeState = { active: false, pointerId: null, lastX: 0, lastY: 0 };
      btnEye.addEventListener('pointerdown', (e) => {
        if (this.isCustomizerEditing) return;
        e.stopPropagation();
        eyeState.active = true;
        eyeState.pointerId = e.pointerId;
        eyeState.lastX = e.clientX;
        eyeState.lastY = e.clientY;
        btnEye.setPointerCapture(e.pointerId);
        btnEye.style.background = '#162a68';
        btnEye.style.color = '#faf8f2';
      });

      btnEye.addEventListener('pointermove', (e) => {
        if (this.isCustomizerEditing || !eyeState.active || e.pointerId !== eyeState.pointerId) return;
        const dx = e.clientX - eyeState.lastX;
        const dy = e.clientY - eyeState.lastY;
        eyeState.lastX = e.clientX;
        eyeState.lastY = e.clientY;

        const factor = 0.0036 * this.player.mouseSensitivity;
        this.player.yaw -= dx * factor;
        this.player.pitch -= dy * factor;
        this.player.pitch = Math.max(-1.48, Math.min(1.48, this.player.pitch));
      });

      const endEye = (e) => {
        if (e.pointerId === eyeState.pointerId) {
          eyeState.active = false;
          eyeState.pointerId = null;
          btnEye.style.background = 'rgba(248, 246, 240, 0.9)';
          btnEye.style.color = '#162a68';
        }
      };
      btnEye.addEventListener('pointerup', endEye);
      btnEye.addEventListener('pointercancel', endEye);
    }

    // Perspective FPP / TPP Switcher Button
    this.setupButtonTouch(this.controls['btnPerspective'], () => {
      if (this.player && this.player.togglePerspective) {
        const mode = this.player.togglePerspective();
        const lbl = document.getElementById('mobile-perspective-label');
        if (lbl) lbl.textContent = mode.toUpperCase();
        if (this.game && this.game.hudCustomizer) {
          this.game.hudCustomizer.showToast(`PERSPECTIVE: ${mode.toUpperCase()} VIEW`);
        }
      }
    });

    // Backpack / Inventory Stack Button
    this.setupButtonTouch(this.controls['btnBackpack'], () => {
      this.toggleLootStack();
    });

    // Sprint Cancel Button
    if (this.btnCancelSprint) {
      this.setupButtonTouch(this.btnCancelSprint, () => {
        this.setSprintLocked(false);
        this.player.keys.sprint = false;
        this.player.keys.forward = false;
        if (this.inputManager) this.inputManager.setMoveVector(0, 0);
      });
    }

    // Contextual Pickups
    const handlePick = () => {
      if (this.game && this.game.lootSystem) {
        if (this.nearbyLoot.length > 1) {
          this.toggleLootStack();
        } else if (this.nearbyLoot.length === 1) {
          this.game.lootSystem.pickupItem(this.nearbyLoot[0], this.player, this.weapons, this.hud);
        }
      }
    };
    this.setupButtonTouch(this.controls['btnPickLeft'], handlePick);
    this.setupButtonTouch(this.controls['btnPickRight'], handlePick);
  }

  setupButtonTouch(el, onPress, onRelease = null, hapticMs = 12) {
    if (!el) return;
    el.addEventListener('pointerdown', (e) => {
      if (this.isCustomizerEditing) return;
      e.stopPropagation();
      el.style.transform = el.style.transform.replace(/scale\([^)]+\)/, 'scale(0.92)');
      // Haptic feedback for physical button feel
      if (navigator.vibrate && hapticMs > 0) {
        navigator.vibrate(hapticMs);
      }
      if (onPress) onPress();
    });

    const release = (e) => {
      if (this.isCustomizerEditing) return;
      el.style.transform = el.style.transform.replace(/scale\([^)]+\)/, 'scale(1.0)');
      if (onRelease) onRelease();
    };

    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystick.baseX;
    const dy = clientY - this.joystick.baseY;
    const dist = Math.hypot(dx, dy);
    const rect = this.joyRing.getBoundingClientRect();
    const effectiveRadius = rect.width > 0 ? (rect.width * 0.42) : this.joystick.maxRadius;
    const clampedDist = Math.min(dist, effectiveRadius);
    const angle = Math.atan2(dy, dx);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    this.joyThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;

    // Check Upward Sprint Lock: dragging upwards past sprint threshold
    if (dy < -effectiveRadius * 0.85 && Math.abs(dx) < 32) {
      if (!this.isSprintLocked) {
        this.setSprintLocked(true);
      }
    }

    // Normalize to -1.0 .. +1.0
    const normX = thumbX / effectiveRadius;
    const normY = thumbY / effectiveRadius;

    this.joystick.vectorX = normX;
    this.joystick.vectorZ = normY;

    if (this.inputManager) {
      this.inputManager.setMoveVector(normX, normY);
    }

    this.player.keys.forward = normY < -0.28 || this.isSprintLocked;
    this.player.keys.backward = normY > 0.28 && !this.isSprintLocked;
    this.player.keys.left = normX < -0.28;
    this.player.keys.right = normX > 0.28;
    this.player.keys.sprint = dist >= effectiveRadius * 0.88 || this.isSprintLocked;
  }

  setSprintLocked(locked) {
    this.isSprintLocked = locked;
    if (this.btnSprint) {
      this.btnSprint.style.background = locked ? '#c9182b' : 'rgba(248, 246, 240, 0.9)';
      this.btnSprint.style.color = locked ? '#faf8f2' : '#162a68';
      this.btnSprint.style.borderColor = locked ? '#c9182b' : '#162a68';
      const tag = document.getElementById('sprint-lock-tag');
      if (tag) tag.textContent = locked ? 'LOCKED' : 'SPRINT';
    }
  }

  toggleSprintLock() {
    this.setSprintLocked(!this.isSprintLocked);
  }

  // Handle Nearby Loot from LootSystem
  updateNearbyLoot(items) {
    this.nearbyLoot = items || [];
    const hasItems = this.nearbyLoot.length > 0;

    const btnL = this.controls['btnPickLeft'];
    const btnR = this.controls['btnPickRight'];

    if (!hasItems) {
      if (btnL) btnL.style.display = 'none';
      if (btnR) btnR.style.display = 'none';
      if (this.lootListStack) this.lootListStack.style.display = 'none';
      return;
    }

    const first = this.nearbyLoot[0];
    const action = this.nearbyLoot.length > 1 ? 'PICK ALL' : 'PICK';

    [btnL, btnR].forEach(btn => {
      if (!btn) return;
      btn.style.display = 'flex';
      const actionEl = btn.querySelector('.pick-label-action');
      const itemEl = btn.querySelector('.pick-label-item');
      if (actionEl) actionEl.textContent = action;
      if (itemEl) itemEl.textContent = first.name;
    });

    this.renderLootStack();
  }

  renderLootStack() {
    if (!this.lootListStack) return;
    this.lootListStack.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #162a68; padding-bottom: 4px; margin-bottom: 4px;">
        <span style="font-size: 11px; font-weight: 700; color: #162a68;">NEARBY CRATES (${this.nearbyLoot.length})</span>
        <button class="sketch-btn" id="btn-pick-all-stack" style="padding: 2px 6px; font-size: 10px; background: #c9182b; color: #fff;">PICK ALL</button>
      </div>
    `;

    this.nearbyLoot.forEach(item => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: #faf8f2;
        border: 1px solid #162a68;
        border-radius: 4px;
        cursor: pointer;
      `;
      row.innerHTML = `
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #162a68;">${item.name}</div>
          <div style="font-size: 9px; opacity: 0.7;">${item.sub}</div>
        </div>
        <button class="sketch-btn" style="padding: 2px 6px; font-size: 10px;">PICK</button>
      `;
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game && this.game.lootSystem) {
          this.game.lootSystem.pickupItem(item, this.player, this.weapons, this.hud);
        }
      });
      this.lootListStack.appendChild(row);
    });

    const btnPickAll = document.getElementById('btn-pick-all-stack');
    if (btnPickAll) {
      btnPickAll.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.game && this.game.lootSystem) {
          this.game.lootSystem.pickupAll(this.player, this.weapons, this.hud);
        }
      });
    }
  }

  toggleLootStack() {
    if (!this.lootListStack) return;
    this.isLootListExpanded = !this.isLootListExpanded;
    this.lootListStack.style.display = this.isLootListExpanded ? 'flex' : 'none';
  }

  updateGrenades(count) {
    const nadeNum = document.getElementById('mobile-nade-num');
    if (nadeNum) nadeNum.textContent = count;
  }

  requestLandscapeFullscreen() {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
      else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (err) {
      console.warn('Orientation request deferred:', err.message);
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
      const isPortrait = window.innerWidth < window.innerHeight;
      overlay.style.display = isPortrait ? 'flex' : 'none';
    };

    const btnFs = document.getElementById('btn-request-mobile-fullscreen');
    if (btnFs) {
      btnFs.addEventListener('click', () => {
        this.requestLandscapeFullscreen();
        setTimeout(checkOrientation, 300);
      });
    }

    const btnDismiss = document.getElementById('btn-dismiss-rotate-overlay');
    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        userDismissed = true;
        if (overlay) overlay.style.display = 'none';
      });
    }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();
  }

  toggle() {
    if (this.isEnabled) this.disable();
    else this.enable();
  }

  enterCustomizerMode() {
    if (this.game && this.game.hudCustomizer) {
      this.game.hudCustomizer.open();
    }
  }
}
