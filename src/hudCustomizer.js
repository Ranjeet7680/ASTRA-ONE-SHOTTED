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
  }

  getDefaultPresets() {
    return {
      default: {
        id: 'preset_default',
        name: 'DEFAULT',
        controls: {
          joyContainer: { x: 0.12, y: 0.72, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.12, y: 0.44, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.84, y: 0.72, size: 1.15, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.14, y: 0.26, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnAds: { x: 0.82, y: 0.42, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.92, y: 0.54, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.76, y: 0.86, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.87, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.72, y: 0.68, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.74, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.84, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.26, y: 0.76, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.92, y: 0.74, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPickLeft: { x: 0.34, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.66, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.92, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.88, y: 0.12, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      claw4: {
        id: 'preset_claw4',
        name: '4-FINGER CLAW',
        controls: {
          joyContainer: { x: 0.12, y: 0.74, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.12, y: 0.44, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.82, y: 0.74, size: 1.15, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.12, y: 0.16, size: 1.25, opacity: 0.95, visible: true, locked: false, style: 'circle' }, // Top left for index finger!
          btnAds: { x: 0.86, y: 0.16, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' }, // Top right for index finger!
          btnJump: { x: 0.92, y: 0.54, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.74, y: 0.84, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.86, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.70, y: 0.68, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.72, y: 0.28, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.80, y: 0.28, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.26, y: 0.76, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.92, y: 0.74, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPickLeft: { x: 0.32, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.68, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.92, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.90, y: 0.12, size: 0.95, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      twoFinger: {
        id: 'preset_twofinger',
        name: '2-FINGER',
        controls: {
          joyContainer: { x: 0.14, y: 0.74, size: 1.1, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.14, y: 0.44, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.82, y: 0.72, size: 1.25, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.14, y: 0.24, size: 0.9, opacity: 0.5, visible: false, locked: false, style: 'circle' },
          btnAds: { x: 0.70, y: 0.60, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.90, y: 0.52, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.82, y: 0.88, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.92, y: 0.86, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.68, y: 0.76, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.66, y: 0.44, size: 0.9, opacity: 0.8, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.74, y: 0.44, size: 0.9, opacity: 0.8, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.28, y: 0.76, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.92, y: 0.70, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPickLeft: { x: 0.35, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.65, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.92, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          minimap: { x: 0.88, y: 0.12, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'circle' },
          topScore: { x: 0.50, y: 0.05, size: 1.0, opacity: 0.95, visible: true, locked: false, style: 'tactical' }
        }
      },
      leftHand: {
        id: 'preset_left',
        name: 'LEFT-HANDED',
        controls: {
          joyContainer: { x: 0.86, y: 0.74, size: 1.05, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnSprint: { x: 0.86, y: 0.44, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnFireRight: { x: 0.16, y: 0.72, size: 1.2, opacity: 0.95, visible: true, locked: false, style: 'circle' },
          btnFireLeft: { x: 0.84, y: 0.24, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnAds: { x: 0.18, y: 0.42, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnJump: { x: 0.08, y: 0.54, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnCrouch: { x: 0.24, y: 0.86, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnProne: { x: 0.13, y: 0.88, size: 0.95, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnReload: { x: 0.28, y: 0.68, size: 1.0, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPeekLeft: { x: 0.26, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnPeekRight: { x: 0.16, y: 0.32, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnGrenade: { x: 0.74, y: 0.76, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'rounded' },
          btnMelee: { x: 0.08, y: 0.74, size: 0.9, opacity: 0.85, visible: true, locked: false, style: 'circle' },
          btnPickLeft: { x: 0.34, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          btnPickRight: { x: 0.66, y: 0.52, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
          weaponBar: { x: 0.50, y: 0.92, size: 1.0, opacity: 0.9, visible: true, locked: false, style: 'tactical' },
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
        return JSON.parse(saved);
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

    // 3. Top Navigation Bar (PUBG / BGMI style)
    const topBar = document.createElement('div');
    topBar.id = 'editor-top-bar';
    topBar.style.cssText = `
      position: absolute;
      top: calc(12px + env(safe-area-inset-top));
      left: calc(16px + env(safe-area-inset-left));
      right: calc(16px + env(safe-area-inset-right));
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: auto;
      z-index: 110;
    `;

    // Row 1: Back, Title, Grid Toggle, Reset, Save, Preview
    const topNavRow = document.createElement('div');
    topNavRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(248, 246, 240, 0.94);
      border: 2px solid #162a68;
      border-radius: 8px;
      padding: 6px 14px;
      box-shadow: 3px 3px 0px rgba(22, 42, 104, 0.3);
    `;

    topNavRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <button class="sketch-btn" id="btn-editor-back" style="padding: 5px 12px; font-size: 12px; font-weight: 700;">← EXIT</button>
        <span style="font-family: 'Space Mono', monospace; font-weight: 700; font-size: 14px; color: #162a68; letter-spacing: 1.5px;">CUSTOMIZE HUD</span>
        <button class="sketch-btn" id="btn-editor-grid" style="padding: 4px 10px; font-size: 11px;">GRID OFF</button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="sketch-btn" id="btn-editor-preview" style="padding: 5px 14px; font-size: 12px; font-weight: 700; background: #2255bb; color: #fff;">👁 TEST HUD</button>
        <button class="sketch-btn" id="btn-editor-reset" style="padding: 5px 12px; font-size: 12px; font-weight: 700;">RESET</button>
        <button class="sketch-btn" id="btn-editor-save" style="padding: 5px 16px; font-size: 12px; font-weight: 700; background: #162a68; color: #fff;">💾 SAVE</button>
      </div>
    `;
    topBar.appendChild(topNavRow);

    // Row 2: Layout Switcher Tabs & Preset Selector
    const tabRow = document.createElement('div');
    tabRow.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 28, 72, 0.85);
      border: 1.5px solid #faf8f2;
      border-radius: 6px;
      padding: 4px 10px;
    `;

    tabRow.innerHTML = `
      <div id="editor-layout-tabs" style="display: flex; gap: 6px;">
        <button class="sketch-btn layout-tab active" data-layout="layout_1" style="padding: 4px 10px; font-size: 11px;">LAYOUT 1</button>
        <button class="sketch-btn layout-tab" data-layout="layout_2" style="padding: 4px 10px; font-size: 11px;">LAYOUT 2</button>
        <button class="sketch-btn layout-tab" data-layout="layout_3" style="padding: 4px 10px; font-size: 11px;">LAYOUT 3</button>
      </div>

      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: #faf8f2; font-size: 10px; font-weight: 700;">PRESETS:</span>
        <select id="editor-preset-select" style="font-family: 'Space Mono', monospace; font-size: 11px; padding: 3px 6px; border: 1.5px solid #162a68; background: #faf8f2;">
          <option value="claw4">4-FINGER CLAW (PRO)</option>
          <option value="default">BALANCED DEFAULT</option>
          <option value="twoFinger">2-FINGER CASUAL</option>
          <option value="leftHand">LEFT-HANDED</option>
        </select>
        <button class="sketch-btn" id="btn-apply-preset" style="padding: 3px 8px; font-size: 11px;">APPLY</button>
      </div>
    `;
    topBar.appendChild(tabRow);
    editor.appendChild(topBar);

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

    // Layout Switcher Tabs
    const tabButtons = this.editor.querySelectorAll('.layout-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeLayoutId = btn.dataset.layout;
        this.applyActiveLayoutToControls();
        this.refreshInspector();
        this.showToast(`Switched to ${btn.textContent}`);
      });
    });

    // Preset Apply Button
    const btnApplyPreset = document.getElementById('btn-apply-preset');
    const selectPreset = document.getElementById('editor-preset-select');
    if (btnApplyPreset && selectPreset) {
      btnApplyPreset.addEventListener('click', () => {
        const key = selectPreset.value;
        const p = this.presets[key];
        if (p) {
          this.layouts[this.activeLayoutId].controls = JSON.parse(JSON.stringify(p.controls));
          this.applyActiveLayoutToControls();
          this.refreshInspector();
          this.showToast(`Applied ${p.name} preset`);
        }
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
