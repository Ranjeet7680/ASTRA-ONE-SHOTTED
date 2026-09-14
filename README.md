# 📐 ASTRA: ONE SHOTTED

<div align="center">

```text
       _   __ _______  ______  ___ 
      / | / // ____/ |/ / __ \/   |
     /  |/ // __/  |   / / / / /| |
    / /|  // /___ /   / /_/ / ___ |
   /_/ |_//_____//_/|_\____/_/  |_|
     INTERACTIVE STUDIOS • ASTRA DIVISION
```

**Fast-Paced Architectural Blueprint FPS with COD Movement, Gunsmith, TDM & PUBG Mobile-Style 3D Lobby**

[![Three.js](https://img.shields.io/badge/Three.js-r160-blue?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Procedural-orange?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[🎮 Overview](#-game-overview) • [🕹️ Controls & COD Movement](#-controls--cod-movement) • [🔫 Gunsmith & Arsenal](#-gunsmith--customization) • [⚔️ Game Modes](#-game-modes) • [📱 Mobile Touch HUD](#-mobile-touch-hud--customization) • [🚀 Quick Start](#-quick-start)

</div>

---

## 🎨 Aesthetic & Visual Concept

**ASTRA: One Shotted** features a distinctive, original hand-drawn architectural notebook sketch visual identity:
- **Notebook Paper Canvas**: Off-white ruled sketchbook parchment (`#f8f6f0`) with faint blue millimeter grid lines and red ink margin borders.
- **Blueprint Ink Architecture**: Structural geometry, stairwells, sniper perches, and barricades rendered with crisp dark ballpoint pen outlines (`#162a68`) and cross-hatched shading.
- **Hostile Red Ink Contrast**: Grunts, Rushers, Heavies, and Snipers rendered in high-contrast red ink outlines (`#c9182b`) with fiery muzzle flashes and ink splatters.
- **Zero External Graphic or Sound Assets**: 100% of the game's textures are procedurally baked onto HTML5 Canvas 2D contexts, and 100% of sound effects are synthesized dynamically via the Web Audio API.

---

## 🏢 Nexora Startup Sequence & PUBG Mobile-Style 3D Lobby

1. **Nexora Company Splash Screen**:
   - Sleek animated studio intro with the geometric Nexora hexagonal blueprint emblem and procedural audio chime.
2. **Game Loading Screen with Architectural Sketch Backdrop**:
   - Vector architectural backdrop with wireframe skyscrapers, coordinate grids, and technical elevations.
   - Dynamic progress bar (0% -> 100%) tracking shader compilation and asset caching with rotating tactical tips.
3. **Multi-Provider Authentication Screen**:
   - **Continue with Google** / **Continue with Facebook** / **Play as Guest** (customizable callsign).
   - LocalStorage profile synchronization saving player rank, level, match history, and Battle Points (BP).
4. **PUBG Mobile-Style 3D Interactive Lobby**:
   - **360° Rotatable Character Dais**: Touch or click-and-drag to inspect your equipped operator and gun blueprint in real time.
   - **Player Profile Card**: Top-left display showing avatar, callsign, level badge (`LV. 35`), rank (`DIAMOND II`), and Battle Points.
   - **Prominent [START MATCH] Button**: High-visibility bottom-right tactical launch trigger.
   - **Match Configuration Card**: Bottom-left selector displaying mode, map scale, and target kill count.
   - **PUBG Tactical Sidebar**: Instant access to Gunsmith, Operator Wardrobe, Mobile HUD customizer, Settings, How to Play, and Logout.

---

## 🕹️ Controls & COD Movement Suite

ASTRA delivers the fluid, high-octane movement mechanics popularized by modern tactical shooters (*Call of Duty*):

### Desktop Controls Reference

| Action | Key / Input | Notes |
| :--- | :--- | :--- |
| **Move** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Standard 8-directional tactical movement |
| **Look / Aim** | <kbd>Mouse</kbd> | PointerLock mouse look with sensitivity calibration |
| **Fire Weapon** | <kbd>Left Click</kbd> | Semi-auto / Full-auto ballistic projectile fire |
| **Aim Down Sights (ADS)** | <kbd>Right Click</kbd> | Iron sight zoom / 4x milliradian optic scope overlay |
| **Tactical Sprint** | <kbd>Double-Tap Shift</kbd> | Supercharged sprint burst with high weapon sway |
| **Ground Slide** | <kbd>Sprint</kbd> + <kbd>Ctrl</kbd> / <kbd>C</kbd> | Momentum-based low-profile slide under fire |
| **Slide Cancel** | <kbd>Space</kbd> while sliding | Instantly cancels slide, stands up, and resets sprint acceleration |
| **Ledge Mantle / Vault** | <kbd>Space</kbd> against waist/chest cover | Smoothly vault onto platforms and barricades |
| **Jump** | <kbd>Space</kbd> | Vertical jump with air-strafe steering |
| **Throw Fragmentation Grenade**| <kbd>G</kbd> | Physics bouncing grenade with radial ink explosion |
| **Reload** | <kbd>R</kbd> | Tactical magazine reload animation & sound |
| **Switch Weapon** | <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd> or <kbd>Scroll</kbd> | Pistol, Shotgun, Rifle, Sniper |
| **10s Health Auto-Regen** | *Passive* | Avoid damage for 10 seconds to initiate full HP regeneration |
| **Pause Menu** | <kbd>Escape</kbd> | Suspends sketch simulation & exposes settings |

---

## 🔫 Gunsmith & Arsenal Customization

Every weapon in ASTRA features procedural 3D linework models, kickback recoil animations, dynamic muzzle flash decals, and customizable Gunsmith attachment slots:

### 1. The Blueprint Arsenal
- **Blueprint Pistol** (`Slot 1`): Lightweight semi-auto sidearm with rapid recovery and tight hipfire.
- **Sketch Trench Shotgun** (`Slot 2`): 8-pellet buckshot spread for lethal close-quarters room clearing.
- **Service Blueprint Rifle** (`Slot 3`): Fully automatic assault rifle with balanced fire-rate and manageable recoil pattern.
- **Precision Blueprint Sniper** (`Slot 4`): Bolt-action heavy rifle featuring an authentic 4x optical hatch reticle with elevation and windage mil-dots.

### 2. Gunsmith Attachments
- **Optics**: Iron Sights, Blueprint Red Dot, Holographic Reticle, 4x Precision Optic.
- **Muzzles**: Standard Flash Hider, Recoil Compensator (-28% muzzle climb), Tactical Suppressor.
- **Underbarrel Grips**: Standard Handguard, Vertical Foregrip (+30% accuracy), Angled Quick-ADS Grip, Tactical Laser.
- **Magazines**: Standard Factory Mag, Extended Drum (+50% capacity).
- **Blueprint Ink Skins**: Classic Ballpoint Blue, Crimson Rebel Red, Charcoal Graphite, Sepia Parchment, Royal Blueprint Violet.

---

## ⚔️ Game Modes & Scaled Arenas

ASTRA supports both solo survival and massive team-based tactical combat:

### 1. Wave Survival (Endless)
Survive escalating waves against 4 distinct enemy AI archetypes:
- **Grunts**: Standard blueprint soldiers that advance and engage at mid-range.
- **Rushers**: Fast, nimble melee specialists that sprint and flank cover.
- **Heavies**: Dense cross-hatched juggernauts with high health pools and heavy suppression.
- **Snipers**: Long-distance marksmen that position on elevated towers and balconies.

### 2. Team Deathmatch (TDM) — Blue Team vs Red Team
Squad-based tactical warfare featuring team-aware AI bots with pathfinding, combat states, and team kill tickers:
- **4 vs 4 — Small Map (*Courtyard Blitz*)**:
  - Tight 48m x 48m arena with central courtyard fountain, perimeter balconies, and rapid firefights.
  - **Target Score**: First team to **30 kills** wins.
- **8 vs 8 — Medium Map (*The Compound*)**:
  - 84m x 84m multi-level military compound with bridges, elevated walkways, and cross-courtyard sightlines.
  - **Target Score**: First team to **50 kills** wins.
- **12 vs 12 — Big Map (*Architect District*)**:
  - Massive 116m x 116m urban district with a 3-tier monument rotunda, sniper towers, and multi-flank combat alleys.
  - **Target Score**: First team to **75 kills** wins.

---

## 📱 Mobile Touch HUD & Customization System

ASTRA includes full touch device support designed to match competitive mobile shooters (*PUBG Mobile*, *COD Mobile*):
- **Dynamic Floating Virtual Joystick**: Left-hand thumb zone with auto-sprint threshold.
- **Swipe-to-Look Camera Zone**: Right-screen touch camera rotation with zero latency.
- **Touch Action Buttons**: Fire, ADS, Jump, Slide, Reload, Grenade, and Weapon 1-4 hotkeys.
- **In-Game HUD Customizer**:
  - Real-time drag-and-drop repositioning of every button on screen.
  - Button Size slider (30px – 100px) and Button Opacity slider (0.2 – 1.0).
  - One-tap Default Reset and instant `localStorage` persistence.

---

## 🔊 Procedural Web Audio Engine

No `.mp3` or `.wav` files are loaded over the network. The built-in `SoundEngine` generates all audio dynamically:
- **Gunshots**: Layered white noise buffers passed through lowpass/bandpass filters with sub-bass sine oscillators.
- **Mechanical Reloads**: Metallic click and slide sequences.
- **Hitmarkers & Headshots**: High-frequency chime pings (880Hz and 1760Hz) confirming lethal hits.
- **Grenades**: Tactical pin click, bouncing clinks, and deep lowpass bass detonations with camera shake.
- **Movement**: Paper scuff footstep rustle, floor friction slide swoosh, and deep health regen breath.

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- Modern web browser with WebGL and Web Audio API support (Chrome, Edge, Firefox, Safari)

### Installation
```bash
# Clone the repository
git clone https://github.com/Ranjeet7680/ASTRA-ONE-SHOTTED.git
cd ASTRA-ONE-SHOTTED

# Install dependencies
npm install

# Launch local development server
npm run dev
```

The game will be running live at `http://localhost:5173/`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📂 Project Architecture

```
ASTRA-ONE-SHOTTED/
├── index.html              # Core HTML structure, screen overlays, and UI styling
├── package.json            # Project manifest and scripts
├── vite.config.js          # Vite build configuration
├── src/
│   ├── main.js             # Game lifecycle coordinator and WebGL render loop
│   ├── materials.js        # Procedural canvas textures (notebook, hatching, ink)
│   ├── audio.js            # Procedural Web Audio API sound synthesizer
│   ├── level.js            # Multi-scale architectural arenas (Small, Medium, Big)
│   ├── player.js           # FPS controller with COD movement suite (Slide, Mantle, Tac-Sprint)
│   ├── weapons.js          # 4 procedural 3D blueprint weapons with recoil & ADS
│   ├── combat.js           # Raycast hit detection, headshots, and AoE explosion damage
│   ├── enemies.js          # Finite-state AI enemy archetypes (Grunt, Rusher, Heavy, Sniper)
│   ├── bots.js             # Team-aware bot AI for TDM matches (Blue vs Red)
│   ├── tdm.js              # Team Deathmatch match manager, scoring, and respawns
│   ├── waves.js            # Endless wave progression manager
│   ├── grenades.js         # Physics-based fragmentation grenades & blast rings
│   ├── customization.js    # Gunsmith attachment stats & 3D preview renderers
│   ├── mobileControls.js   # Touch joystick, look swipe, and customizable HUD editor
│   ├── auth.js             # Google, Facebook, and Guest profile manager
│   ├── lobby.js            # PUBG Mobile-style 3D interactive lobby with rotating character
│   ├── gameState.js        # State manager (SPLASH -> LOADING -> AUTH -> LOBBY -> PLAYING)
│   ├── hud.js              # In-game HUD score, ammo tally, HP bar, and hitmarkers
│   └── effects.js          # Ink burst particles, tracer lines, and shockwaves
└── README.md               # Project documentation
```

---

## 📜 Credits & License

- **Developer**: Nexora Interactive Studios / ASTRA Blueprint Division
- **Repository**: [https://github.com/Ranjeet7680/ASTRA-ONE-SHOTTED.git](https://github.com/Ranjeet7680/ASTRA-ONE-SHOTTED.git)
- **License**: MIT
