// Professional Competitive Mobile FPS HUD Customization Editor for ASTRA: One Shotted
// Inspired by PUBG Mobile / BGMI and COD Mobile HUD editors with ASTRA technical blueprint aesthetic.
// Supports multi-layout persistence (Layout 1/2/3), drag-and-drop, pinch/slider resize, opacity,
// D-pad nudging, grid snap, overlap warnings, button styles, and live preview mode.

export class HUDCustomizer {
  constructor(mobileControls, hud, game) {
    this.mobileControls = mobileControls;
    this.hud = hud;
    this.game = game;

    this.isOpen = false;
    this.isPreviewMode = false;
    this.gridEnabled = false;
    this.gridSizePercent = 2.5; // 2.5% snap grid
    this.selectedControlId = null;

    // Default Presets
    this.presets = this.getDefaultPresets();
    this.activeLayoutId = localStorage.getItem('astra_active_layout_id') || 'layout_1';
    this.layouts = this.loadLayouts();

    this.buildEditorDOM();
    this.applyActiveLayoutToControls();
  }

  getDefaultPresets() {
    return {
      default: {
        id: 'preset_default',
        name: 'CLASSIC DEFAULT',
        controls: {
          joyContainer: { x: 0.16, y: 0.72, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.16, y: 0.38, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.76, y: 0.70, size: 1.15, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.16, y: 0.20, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnAds: { x: 0.76, y: 0.16, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnEyeLook: { x: 0.78, y: 0.28, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.92, y: 0.65, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.82, y: 0.88, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.91, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.74, y: 0.88, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.68, y: 0.48, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.77, y: 0.48, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.65, y: 0.88, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.85, y: 0.52, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnRevive: { x: 0.50, y: 0.60, size: 1.1, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnPerspective: { x: 0.24, y: 0.85, size: 0.85, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnBackpack: { x: 0.09, y: 0.90, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPickLeft: { x: 0.36, y: 0.50, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.64, y: 0.50, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.90, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.88, y: 0.12, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      claw4: {
        id: 'preset_claw4',
        name: '4-FINGER CLAW (BGMI/PUBG)',
        controls: {
          joyContainer: { x: 0.16, y: 0.72, size: 1.1, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.16, y: 0.36, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.16, y: 0.18, size: 1.3, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.75, y: 0.68, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnAds: { x: 0.76, y: 0.14, size: 1.25, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnEyeLook: { x: 0.78, y: 0.28, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.93, y: 0.71, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.83, y: 0.91, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.92, y: 0.91, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.77, y: 0.91, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.69, y: 0.48, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.78, y: 0.48, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.65, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.85, y: 0.51, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnRevive: { x: 0.50, y: 0.60, size: 1.1, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnPerspective: { x: 0.24, y: 0.85, size: 0.85, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnBackpack: { x: 0.09, y: 0.90, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPickLeft: { x: 0.36, y: 0.50, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.64, y: 0.50, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.90, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.88, y: 0.12, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      twoFinger: {
        id: 'preset_twofinger',
        name: '2-FINGER CASUAL',
        controls: {
          joyContainer: { x: 0.16, y: 0.74, size: 1.1, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.16, y: 0.44, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.82, y: 0.72, size: 1.25, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.16, y: 0.22, size: 0.9, opacity: 0.4, visible: false, locked: false, style: 'circle' },
          btnAds: { x: 0.70, y: 0.60, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnEyeLook: { x: 0.78, y: 0.28, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.90, y: 0.54, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.82, y: 0.88, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.92, y: 0.86, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.68, y: 0.76, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.66, y: 0.44, size: 0.9, opacity: 0.8, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.74, y: 0.44, size: 0.9, opacity: 0.8, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.28, y: 0.76, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.92, y: 0.70, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnRevive: { x: 0.50, y: 0.60, size: 1.1, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnPerspective: { x: 0.24, y: 0.85, size: 0.85, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnBackpack: { x: 0.09, y: 0.90, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPickLeft: { x: 0.35, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.65, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.90, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.88, y: 0.12, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      leftHand: {
        id: 'preset_left',
        name: 'LEFT-HANDED',
        controls: {
          joyContainer: { x: 0.84, y: 0.72, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.84, y: 0.38, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.16, y: 0.72, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.84, y: 0.20, size: 1.2, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnAds: { x: 0.18, y: 0.42, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnEyeLook: { x: 0.22, y: 0.28, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.08, y: 0.54, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.24, y: 0.86, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.13, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.28, y: 0.68, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.26, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.16, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.74, y: 0.76, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.08, y: 0.74, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnRevive: { x: 0.50, y: 0.60, size: 1.1, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnPerspective: { x: 0.76, y: 0.85, size: 0.85, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          btnBackpack: { x: 0.91, y: 0.90, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPickLeft: { x: 0.34, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.66, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.90, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.12, y: 0.12, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      }
    };
  }

  loadLayouts() {
    try {
      const saved = localStorage.getItem('astra_hud_layouts_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure new controls (btnRevive, btnEyeLook, btnPerspective, btnBackpack) exist in each layout
        const fallbackControls = this.presets.claw4.controls;
        for (const layoutKey of Object.keys(parsed)) {
          if (parsed[layoutKey] && parsed[layoutKey].controls) {
            for (const [ctrlKey, defaultVal] of Object.entries(fallbackControls)) {
              if (!parsed[layoutKey].controls[ctrlKey]) {
                parsed[layoutKey].controls[ctrlKey] = JSON.parse(JSON.stringify(defaultVal));
              }
            }
          }
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load custom HUD layouts, using defaults', e);
    }

    // Initialize 3 default layouts
    return {
      layout_1: { id: 'layout_1', name: 'LAYOUT 1 (4-FINGER CLAW)', controls: JSON.parse(JSON.stringify(this.presets.claw4.controls)) },
      layout_2: { id: 'layout_2', name: 'LAYOUT 2 (CLASSIC DEFAULT)', controls: JSON.parse(JSON.stringify(this.presets.default.controls)) },
      layout_3: { id: 'layout_3', name: 'LAYOUT 3 (TWO-THUMB)', controls: JSON.parse(JSON.stringify(this.presets.twoFinger.controls)) }
    };
  }

  saveLayouts() {
    try {
      localStorage.setItem('astra_hud_layouts_v2', JSON.stringify(this.layouts));
      localStorage.setItem('astra_active_layout_id', this.activeLayoutId);
    } catch (e) {
      console.warn('Failed to save HUD layouts to localStorage', e);
    }
  }

  getActiveLayout() {
    return this.layouts[this.activeLayoutId] || this.layouts['layout_1'];
  }

  buildEditorDOM() {
    // 1. Root Editor Layer
    const editor = document.createElement('div');
    editor.id = 'hud-customizer-editor';
    editor.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 100;
      display: none;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
      background: rgba(15, 28, 72, 0.55);
      backdrop-filter: blur(4px);
    `;
    document.body.appendChild(editor);
    this.editor = editor;

    // 2. Alignment Guide Center Lines & Grid
    const guideH = document.createElement('div');
    guideH.id = 'editor-center-h';
    guideH.style.cssText = `
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      border-top: 1px dashed rgba(248, 246, 240, 0.35);
      pointer-events: none;
      display: none;
    `;
    const guideV = document.createElement('div');
    guideV.id = 'editor-center-v';
    guideV.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      width: 1px;
      height: 100%;
      border-left: 1px dashed rgba(248, 246, 240, 0.35);
      pointer-events: none;
      display: none;
    `;
    editor.appendChild(guideH);
    editor.appendChild(guideV);
    this.guideH = guideH;
    this.guideV = guideV;

    // 3. Centered Top Navigation Bar (matching the uploaded PUBG Mobile / BGMI reference image)
    const topBar = document.createElement('div');
    topBar.id = 'editor-top-bar';
    topBar.style.cssText = `
      position: absolute;
      top: calc(8px + env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(22, 38, 62, 0.95);
      border: 1.5px solid rgba(255, 255, 255, 0.28);
      border-radius: 6px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);
      pointer-events: auto;
      z-index: 110;
      backdrop-filter: blur(8px);
      width: 440px;
      max-width: 88vw;
      transition: transform 0.2s ease, opacity 0.2s ease;
    `;

    topBar.innerHTML = `
      <!-- Title & Layout Selector Row -->
      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 4px 12px 2px;">
        <span style="font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">Classic</span>
        <select id="editor-layout-select" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.3); border-radius: 3px; color: #ffd566; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; padding: 1px 6px; cursor: pointer; outline: none;">
          <option value="layout_1" style="background: #16263e; color: #fff;">1 (4-Finger Claw)</option>
          <option value="layout_2" style="background: #16263e; color: #fff;">2 (Classic Default)</option>
          <option value="layout_3" style="background: #16263e; color: #fff;">3 (Two-Thumb)</option>
        </select>
      </div>

      <!-- TPP / FPP Perspective Buttons -->
      <div style="display: flex; width: 92%; margin: 3px 0 6px; background: rgba(10, 18, 30, 0.7); border-radius: 4px; border: 1px solid rgba(255,255,255,0.18); overflow: hidden;">
        <button id="btn-customizer-tpp" style="flex: 1; padding: 4px 0; border: none; background: #2c739e; color: #ffffff; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer;">TPP</button>
        <button id="btn-customizer-fpp" style="flex: 1; padding: 4px 0; border: none; background: transparent; color: rgba(255,255,255,0.65); font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 800; cursor: pointer;">FPP</button>
      </div>

      <!-- Actions Row: Large Icons, Exit, Reset, Save -->
      <div style="display: flex; align-items: center; justify-content: space-between; width: 92%; padding-bottom: 7px; gap: 6px;">
        <button class="sketch-btn" id="btn-editor-large-icons" style="padding: 4px 8px; font-size: 10px; font-weight: 700; background: #233b5c; color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 3px;">Large Icons ⚙</button>
        <button class="sketch-btn" id="btn-editor-back" style="padding: 4px 10px; font-size: 11px; font-weight: 700; background: #2a4366; color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 3px;">Exit</button>
        <button class="sketch-btn" id="btn-editor-reset" style="padding: 4px 10px; font-size: 11px; font-weight: 700; background: #2a4366; color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 3px;">Reset</button>
        <button class="sketch-btn" id="btn-editor-save" style="padding: 4px 16px; font-size: 11px; font-weight: 800; background: #ffaa00; color: #162438; border: 1.5px solid #ffd566; border-radius: 3px; box-shadow: 0 0 10px rgba(255,170,0,0.4);">Save</button>
      </div>

      <!-- Down / Up Chevron Tab -->
      <div id="btn-collapse-top-bar" style="position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); width: 36px; height: 18px; background: rgba(22, 38, 62, 0.95); border: 1.5px solid rgba(255, 255, 255, 0.28); border-top: none; border-radius: 0 0 4px 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #fff; font-size: 11px; font-weight: 900;">
        <span id="chevron-symbol">∨</span>
      </div>
    `;
    editor.appendChild(topBar);
    this.topBar = topBar;

    // Top Right Corner Tools (Report, Settings, Speaker, Mic)
    const cornerTools = document.createElement('div');
    cornerTools.id = 'editor-corner-tools';
    cornerTools.style.cssText = `
      position: absolute;
      top: calc(8px + env(safe-area-inset-top));
      right: calc(14px + env(safe-area-inset-right));
      display: flex;
      align-items: center;
      gap: 7px;
      z-index: 110;
      pointer-events: auto;
    `;
    cornerTools.innerHTML = `
      <button class="sketch-btn" id="btn-customizer-report" style="padding: 3px 8px; font-size: 10px; font-weight: 700; background: rgba(22,38,62,0.85); color: #fff; border: 1px solid rgba(255,255,255,0.25); border-radius: 3px;">Report</button>
      <button class="sketch-btn" id="btn-customizer-settings" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(22,38,62,0.85); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 13px; display: flex; align-items: center; justify-content: center;">⚙</button>
      <button class="sketch-btn" id="btn-customizer-speaker" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(22,38,62,0.85); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;">🔊</button>
      <button class="sketch-btn" id="btn-customizer-mic" style="width: 28px; height: 28px; border-radius: 50%; background: rgba(22,38,62,0.85); border: 1px solid rgba(255,255,255,0.25); color: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center;">🎙️</button>
    `;
    editor.appendChild(cornerTools);

    // 4. Floating Control Inspector Panel (Bottom-Center or Top-Center depending on touch)
    const inspector = document.createElement('div');
    inspector.id = 'editor-inspector-panel';
    inspector.style.cssText = `
      position: absolute;
      top: calc(96px + env(safe-area-inset-top));
      left: 50%;
      transform: translateX(-50%);
      background: rgba(248, 246, 240, 0.96);
      border: 2px solid #162a68;
      border-radius: 8px;
      padding: 10px 16px;
      box-shadow: 4px 4px 0px rgba(22, 42, 104, 0.35);
      display: none;
      flex-direction: column;
      gap: 8px;
      width: 460px;
      max-width: 90%;
      z-index: 120;
      pointer-events: auto;
    `;

    inspector.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #162a68; padding-bottom: 4px;">
        <span id="inspect-title" style="font-family: 'Space Mono', monospace; font-weight: 700; font-size: 13px; color: #162a68;">RIGHT FIRE</span>
        <div style="display: flex; gap: 6px;">
          <button class="sketch-btn" id="btn-inspect-lock" style="padding: 2px 8px; font-size: 11px;">🔒 UNLOCKED</button>
          <button class="sketch-btn" id="btn-inspect-vis" style="padding: 2px 8px; font-size: 11px;">👁 VISIBLE</button>
          <button class="sketch-btn" id="btn-inspect-close" style="padding: 2px 6px; font-size: 11px;">✕</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; font-weight: 700;">
        <!-- Size Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>SIZE:</span>
            <span id="inspect-size-val">100%</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button class="sketch-btn" id="btn-size-minus" style="padding: 1px 6px;">-</button>
            <input type="range" id="inspect-size-slider" min="50" max="200" step="5" value="100" style="flex: 1;">
            <button class="sketch-btn" id="btn-size-plus" style="padding: 1px 6px;">+</button>
          </div>
        </div>

        <!-- Opacity Slider -->
        <div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>OPACITY:</span>
            <span id="inspect-opacity-val">90%</span>
          </div>
          <input type="range" id="inspect-opacity-slider" min="15" max="100" step="5" value="90" style="width: 100%;">
        </div>
      </div>

      <!-- D-Pad Positioning & Coordinates -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(22,42,104,0.06); padding: 4px 8px; border-radius: 4px;">
        <div style="font-size: 11px; font-family: 'Space Mono', monospace; font-weight: 700;">
          POS: <span id="inspect-coord-x">X 82%</span> <span id="inspect-coord-y">Y 72%</span>
        </div>

        <!-- Directional Nudge D-Pad -->
        <div style="display: flex; gap: 4px; align-items: center;">
          <button class="sketch-btn" id="btn-nudge-left" style="padding: 2px 7px;">◄</button>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <button class="sketch-btn" id="btn-nudge-up" style="padding: 1px 7px;">▲</button>
            <button class="sketch-btn" id="btn-nudge-down" style="padding: 1px 7px;">▼</button>
          </div>
          <button class="sketch-btn" id="btn-nudge-right" style="padding: 2px 7px;">►</button>
        </div>

        <!-- Style Selector -->
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 10px; font-weight: 700;">STYLE:</span>
          <select id="inspect-style-select" style="font-family: 'Space Mono', monospace; font-size: 10px; padding: 2px 4px; border: 1.5px solid #162a68; background: #fff;">
            <option value="circle">Circle</option>
            <option value="rounded">Rounded</option>
            <option value="tactical">Tactical</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>
    `;
    editor.appendChild(inspector);
    this.inspector = inspector;

    // 5. Toast notification
    const toast = document.createElement('div');
    toast.id = 'editor-toast';
    toast.style.cssText = `
      position: absolute;
      bottom: calc(24px + env(safe-area-inset-bottom));
      left: 50%;
      transform: translateX(-50%);
      background: #162a68;
      color: #faf8f2;
      border: 2px solid #faf8f2;
      padding: 8px 24px;
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      display: none;
      z-index: 150;
      pointer-events: none;
    `;
    editor.appendChild(toast);
    this.toast = toast;

    // 6. Preview Exit Overlay
    const previewExit = document.createElement('div');
    previewExit.id = 'editor-preview-exit';
    previewExit.style.cssText = `
      position: absolute;
      top: calc(14px + env(safe-area-inset-top));
      right: calc(18px + env(safe-area-inset-right));
      display: none;
      z-index: 130;
      pointer-events: auto;
    `;
    previewExit.innerHTML = `
      <button class="sketch-btn" id="btn-exit-preview" style="padding: 8px 18px; font-size: 13px; font-weight: 700; background: #c9182b; color: #fff; box-shadow: 2px 2px 0px rgba(0,0,0,0.4);">✕ EXIT PREVIEW</button>
    `;
    document.body.appendChild(previewExit);
    this.previewExit = previewExit;

    this.bindEditorEvents();
  }

  showToast(message, duration = 2000) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.style.display = 'block';
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.style.display = 'none';
    }, duration);
  }

  bindEditorEvents() {
    // Top Bar Back
    const btnBack = document.getElementById('btn-editor-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.close();
      });
    }

    // Grid Toggle
    const btnGrid = document.getElementById('btn-editor-grid');
    if (btnGrid) {
      btnGrid.addEventListener('click', () => {
        this.gridEnabled = !this.gridEnabled;
        btnGrid.textContent = this.gridEnabled ? 'GRID ON' : 'GRID OFF';
        btnGrid.style.background = this.gridEnabled ? '#162a68' : '#faf8f2';
        btnGrid.style.color = this.gridEnabled ? '#faf8f2' : '#162a68';
        if (this.guideH) this.guideH.style.display = this.gridEnabled ? 'block' : 'none';
        if (this.guideV) this.guideV.style.display = this.gridEnabled ? 'block' : 'none';
      });
    }

    // Save
    const btnSave = document.getElementById('btn-editor-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveLayouts();
        this.applyActiveLayoutToControls();
        this.showToast('✓ HUD Layout Saved');
      });
    }

    // Reset Current Layout
    const btnReset = document.getElementById('btn-editor-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Reset this layout to default configuration?')) {
          this.layouts[this.activeLayoutId].controls = JSON.parse(JSON.stringify(this.presets.claw4.controls));
          this.saveLayouts();
          this.applyActiveLayoutToControls();
          this.refreshInspector();
          this.showToast('Layout Reset Complete');
        }
      });
    }

    // Preview Mode Toggle
    const btnPreview = document.getElementById('btn-editor-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => {
        this.enterPreviewMode();
      });
    }

    const btnExitPreview = document.getElementById('btn-exit-preview');
    if (btnExitPreview) {
      btnExitPreview.addEventListener('click', () => {
        this.exitPreviewMode();
      });
    }

    // Layout Select Dropdown
    const layoutSelect = document.getElementById('editor-layout-select');
    if (layoutSelect) {
      layoutSelect.value = this.activeLayoutId;
      layoutSelect.addEventListener('change', () => {
        this.activeLayoutId = layoutSelect.value;
        this.applyActiveLayoutToControls();
        this.refreshInspector();
        this.showToast(`Switched to Layout ${layoutSelect.value.replace('layout_', '')}`);
      });
    }

    // TPP / FPP Perspective Switch
    const btnTpp = document.getElementById('btn-customizer-tpp');
    const btnFpp = document.getElementById('btn-customizer-fpp');
    const updatePerspUI = (mode) => {
      if (btnTpp && btnFpp) {
        btnTpp.style.background = mode === 'tpp' ? '#2c739e' : 'transparent';
        btnTpp.style.color = mode === 'tpp' ? '#ffffff' : 'rgba(255,255,255,0.65)';
        btnFpp.style.background = mode === 'fpp' ? '#2c739e' : 'transparent';
        btnFpp.style.color = mode === 'fpp' ? '#ffffff' : 'rgba(255,255,255,0.65)';
      }
    };
    if (btnTpp) {
      btnTpp.addEventListener('click', () => {
        if (this.game && this.game.player) {
          this.game.player.setPerspective('tpp');
          updatePerspUI('tpp');
          this.showToast('Perspective: TPP');
        }
      });
    }
    if (btnFpp) {
      btnFpp.addEventListener('click', () => {
        if (this.game && this.game.player) {
          this.game.player.setPerspective('fpp');
          updatePerspUI('fpp');
          this.showToast('Perspective: FPP');
        }
      });
    }

    // Top Bar Collapse / Expand Chevron
    const btnCollapse = document.getElementById('btn-collapse-top-bar');
    const chevronSymbol = document.getElementById('chevron-symbol');
    let isCollapsed = false;
    if (btnCollapse && this.topBar) {
      btnCollapse.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) {
          this.topBar.style.transform = 'translateX(-50%) translateY(calc(-100% + 22px))';
          if (chevronSymbol) chevronSymbol.textContent = '∧';
        } else {
          this.topBar.style.transform = 'translateX(-50%) translateY(0)';
          if (chevronSymbol) chevronSymbol.textContent = '∨';
        }
      });
    }

    // Large Icons Button
    const btnLargeIcons = document.getElementById('btn-editor-large-icons');
    if (btnLargeIcons) {
      btnLargeIcons.addEventListener('click', () => {
        if (this.inspector) {
          const isVis = this.inspector.style.display === 'flex';
          if (isVis) {
            this.deselectControl();
          } else {
            this.selectControl(this.selectedControlId || 'btnFireRight');
          }
        }
      });
    }

    // Corner Widgets
    const btnReport = document.getElementById('btn-customizer-report');
    if (btnReport) {
      btnReport.addEventListener('click', () => {
        this.showToast('Report & Feedback Logged ✓');
      });
    }
    const btnSettings = document.getElementById('btn-customizer-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        this.showToast('Customizer Settings Active');
      });
    }
    const btnSpeaker = document.getElementById('btn-customizer-speaker');
    if (btnSpeaker) {
      btnSpeaker.addEventListener('click', () => {
        this.showToast('Audio Settings');
      });
    }
    const btnMic = document.getElementById('btn-customizer-mic');
    if (btnMic) {
      btnMic.addEventListener('click', () => {
        this.showToast('Mic: Ready for Team Voice Chat');
      });
    }

    // Inspector Events
    this.bindInspectorEvents();
  }

  bindInspectorEvents() {
    const sliderSize = document.getElementById('inspect-size-slider');
    const valSize = document.getElementById('inspect-size-val');
    const sliderOpacity = document.getElementById('inspect-opacity-slider');
    const valOpacity = document.getElementById('inspect-opacity-val');
    const btnLock = document.getElementById('btn-inspect-lock');
    const btnVis = document.getElementById('btn-inspect-vis');
    const btnClose = document.getElementById('btn-inspect-close');
    const selectStyle = document.getElementById('inspect-style-select');

    if (sliderSize) {
      sliderSize.addEventListener('input', () => {
        const scale = sliderSize.value / 100;
        if (valSize) valSize.textContent = `${sliderSize.value}%`;
        this.updateSelectedControlProperty('size', scale);
      });
    }

    const btnSizeMinus = document.getElementById('btn-size-minus');
    if (btnSizeMinus && sliderSize) {
      btnSizeMinus.addEventListener('click', () => {
        sliderSize.value = Math.max(50, parseInt(sliderSize.value) - 5);
        sliderSize.dispatchEvent(new Event('input'));
      });
    }

    const btnSizePlus = document.getElementById('btn-size-plus');
    if (btnSizePlus && sliderSize) {
      btnSizePlus.addEventListener('click', () => {
        sliderSize.value = Math.min(200, parseInt(sliderSize.value) + 5);
        sliderSize.dispatchEvent(new Event('input'));
      });
    }

    if (sliderOpacity) {
      sliderOpacity.addEventListener('input', () => {
        const op = sliderOpacity.value / 100;
        if (valOpacity) valOpacity.textContent = `${sliderOpacity.value}%`;
        this.updateSelectedControlProperty('opacity', op);
      });
    }

    if (btnLock) {
      btnLock.addEventListener('click', () => {
        const ctrl = this.getSelectedControlData();
        if (ctrl) {
          ctrl.locked = !ctrl.locked;
          btnLock.textContent = ctrl.locked ? '🔒 LOCKED' : '🔓 UNLOCKED';
          btnLock.style.background = ctrl.locked ? '#c9182b' : '#faf8f2';
          btnLock.style.color = ctrl.locked ? '#fff' : '#162a68';
        }
      });
    }

    if (btnVis) {
      btnVis.addEventListener('click', () => {
        const ctrl = this.getSelectedControlData();
        if (ctrl) {
          ctrl.visible = !ctrl.visible;
          btnVis.textContent = ctrl.visible ? '👁 VISIBLE' : '🚫 HIDDEN';
          this.applyActiveLayoutToControls();
        }
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.deselectControl();
      });
    }

    if (selectStyle) {
      selectStyle.addEventListener('change', () => {
        this.updateSelectedControlProperty('style', selectStyle.value);
      });
    }

    // D-Pad Nudge Buttons
    const nudge = (dxPct, dyPct) => {
      const ctrl = this.getSelectedControlData();
      if (!ctrl || ctrl.locked) return;
      ctrl.x = Math.max(0.04, Math.min(0.96, ctrl.x + dxPct));
      ctrl.y = Math.max(0.04, Math.min(0.96, ctrl.y + dyPct));
      this.applyControlToDOM(this.selectedControlId, ctrl);
      this.updateInspectorCoords(ctrl);
    };

    const btnLeft = document.getElementById('btn-nudge-left');
    if (btnLeft) btnLeft.addEventListener('click', () => nudge(-0.01, 0));
    const btnRight = document.getElementById('btn-nudge-right');
    if (btnRight) btnRight.addEventListener('click', () => nudge(0.01, 0));
    const btnUp = document.getElementById('btn-nudge-up');
    if (btnUp) btnUp.addEventListener('click', () => nudge(0, -0.01));
    const btnDown = document.getElementById('btn-nudge-down');
    if (btnDown) btnDown.addEventListener('click', () => nudge(0, 0.01));
  }

  open() {
    this.isOpen = true;
    this.isPreviewMode = false;
    if (this.editor) this.editor.style.display = 'block';
    if (this.previewExit) this.previewExit.style.display = 'none';

    // Sync layout selector and perspective buttons
    const layoutSelect = document.getElementById('editor-layout-select');
    if (layoutSelect) layoutSelect.value = this.activeLayoutId;

    const btnTpp = document.getElementById('btn-customizer-tpp');
    const btnFpp = document.getElementById('btn-customizer-fpp');
    const currentPersp = (this.game && this.game.player) ? this.game.player.perspectiveMode : 'fpp';
    if (btnTpp && btnFpp) {
      btnTpp.style.background = currentPersp === 'tpp' ? '#2c739e' : 'transparent';
      btnTpp.style.color = currentPersp === 'tpp' ? '#ffffff' : 'rgba(255,255,255,0.65)';
      btnFpp.style.background = currentPersp === 'fpp' ? '#2c739e' : 'transparent';
      btnFpp.style.color = currentPersp === 'fpp' ? '#ffffff' : 'rgba(255,255,255,0.65)';
    }

    // Show mobile controls layer
    if (this.mobileControls) {
      this.mobileControls.enable();
      this.mobileControls.setCustomizerEditing(true);
    }

    this.applyActiveLayoutToControls();
    this.deselectControl();
  }

  close() {
    this.isOpen = false;
    this.isPreviewMode = false;
    if (this.editor) this.editor.style.display = 'none';
    if (this.previewExit) this.previewExit.style.display = 'none';
    if (this.inspector) this.inspector.style.display = 'none';

    if (this.mobileControls) {
      this.mobileControls.setCustomizerEditing(false);
    }

    if (this.onClose) {
      this.onClose();
    }
  }

  enterPreviewMode() {
    this.isPreviewMode = true;
    if (this.editor) this.editor.style.display = 'none';
    if (this.previewExit) this.previewExit.style.display = 'block';
    if (this.mobileControls) {
      this.mobileControls.setCustomizerEditing(false); // Enable gameplay interactivity
    }
    this.showToast('Entering HUD Test Mode. Tap EXIT to resume editing.');
  }

  exitPreviewMode() {
    this.isPreviewMode = false;
    if (this.previewExit) this.previewExit.style.display = 'none';
    if (this.editor) this.editor.style.display = 'block';
    if (this.mobileControls) {
      this.mobileControls.setCustomizerEditing(true);
    }
  }

  selectControl(id) {
    this.selectedControlId = id;
    const ctrl = this.getSelectedControlData();
    if (!ctrl) return;

    const titleEl = document.getElementById('inspect-title');
    if (titleEl) titleEl.textContent = this.formatControlTitle(id);

    const sliderSize = document.getElementById('inspect-size-slider');
    const valSize = document.getElementById('inspect-size-val');
    if (sliderSize) {
      sliderSize.value = Math.round(ctrl.size * 100);
      if (valSize) valSize.textContent = `${sliderSize.value}%`;
    }

    const sliderOpacity = document.getElementById('inspect-opacity-slider');
    const valOpacity = document.getElementById('inspect-opacity-val');
    if (sliderOpacity) {
      sliderOpacity.value = Math.round(ctrl.opacity * 100);
      if (valOpacity) valOpacity.textContent = `${sliderOpacity.value}%`;
    }

    const btnLock = document.getElementById('btn-inspect-lock');
    if (btnLock) {
      btnLock.textContent = ctrl.locked ? '🔒 LOCKED' : '🔓 UNLOCKED';
      btnLock.style.background = ctrl.locked ? '#c9182b' : '#faf8f2';
      btnLock.style.color = ctrl.locked ? '#fff' : '#162a68';
    }

    const btnVis = document.getElementById('btn-inspect-vis');
    if (btnVis) {
      btnVis.textContent = ctrl.visible ? '👁 VISIBLE' : '🚫 HIDDEN';
    }

    const selectStyle = document.getElementById('inspect-style-select');
    if (selectStyle) {
      selectStyle.value = ctrl.style || 'circle';
    }

    this.updateInspectorCoords(ctrl);

    if (this.inspector) {
      this.inspector.style.display = 'flex';
    }

    // Visual selection outline on element
    if (this.mobileControls && this.mobileControls.highlightControl) {
      this.mobileControls.highlightControl(id);
    }
  }

  deselectControl() {
    this.selectedControlId = null;
    if (this.inspector) this.inspector.style.display = 'none';
    if (this.mobileControls && this.mobileControls.highlightControl) {
      this.mobileControls.highlightControl(null);
    }
  }

  updateInspectorCoords(ctrl) {
    const coordX = document.getElementById('inspect-coord-x');
    const coordY = document.getElementById('inspect-coord-y');
    if (coordX) coordX.textContent = `X ${Math.round(ctrl.x * 100)}%`;
    if (coordY) coordY.textContent = `Y ${Math.round(ctrl.y * 100)}%`;
  }

  formatControlTitle(id) {
    const map = {
      joyContainer: 'JOYSTICK & SPRINT LOCK',
      btnSprint: 'SPRINT BUTTON',
      btnFireRight: 'PRIMARY FIRE (RIGHT)',
      btnFireLeft: 'CLAW FIRE (LEFT)',
      btnAds: 'AIM DOWN SIGHTS (ADS)',
      btnJump: 'JUMP',
      btnCrouch: 'CROUCH / SLIDE',
      btnProne: 'PRONE',
      btnReload: 'RELOAD',
      btnPeekLeft: 'PEEK LEFT',
      btnPeekRight: 'PEEK RIGHT',
      btnGrenade: 'GRENADE',
      btnMelee: 'COMBAT KNIFE',
      btnRevive: 'REVIVE / FIELD STIM',
      btnEyeLook: 'FREE LOOK / EYE',
      btnPerspective: 'PERSPECTIVE (FPP/TPP)',
      btnBackpack: 'TACTICAL BACKPACK',
      btnPickLeft: 'LEFT PICKUP',
      btnPickRight: 'RIGHT PICKUP',
      weaponBar: 'WEAPON SELECTOR',
      minimap: 'RADAR MINIMAP',
      topScore: 'MATCH SCORE BAR'
    };
    return map[id] || id.toUpperCase();
  }

  getSelectedControlData() {
    const layout = this.getActiveLayout();
    if (!layout || !layout.controls) return null;
    return layout.controls[this.selectedControlId];
  }

  updateSelectedControlProperty(prop, value) {
    const ctrl = this.getSelectedControlData();
    if (!ctrl) return;
    ctrl[prop] = value;
    this.applyControlToDOM(this.selectedControlId, ctrl);
  }

  applyControlToDOM(id, ctrl) {
    if (!this.mobileControls) return;
    this.mobileControls.applyNormalizedControl(id, ctrl);
  }

  applyActiveLayoutToControls() {
    const layout = this.getActiveLayout();
    if (!layout || !layout.controls || !this.mobileControls) return;

    for (const [id, ctrl] of Object.entries(layout.controls)) {
      this.mobileControls.applyNormalizedControl(id, ctrl);
    }
  }

  refreshInspector() {
    if (this.selectedControlId) {
      this.selectControl(this.selectedControlId);
    }
  }
}
