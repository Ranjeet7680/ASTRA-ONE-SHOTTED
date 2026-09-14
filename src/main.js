import * as THREE from 'three';
import { MaterialLibrary } from './materials.js';
import { SoundEngine } from './audio.js';
import { Level } from './level.js';
import { EffectsManager } from './effects.js';
import { WeaponSystem } from './weapons.js';
import { Player } from './player.js';
import { CombatSystem } from './combat.js';
import { WaveManager } from './waves.js';
import { HUD } from './hud.js';
import { GameStateManager } from './gameState.js';
import { GrenadeManager } from './grenades.js';
import { CustomizationManager } from './customization.js';
import { MobileControls } from './mobileControls.js';
import { TDMManager } from './tdm.js';
import { AuthManager } from './auth.js';
import { LobbyScene } from './lobby.js';
import { MinimapManager } from './minimap.js';
import { VoiceChatSystem } from './voiceChat.js';
import { KillstreakManager } from './killstreaks.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');

    // 1. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0xf8f6f0, 1.0); // Off-white sketchbook canvas
    this.container.appendChild(this.renderer.domElement);
    this.domElement = this.renderer.domElement;

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xf8f6f0, 45, 95);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    this.scene.add(this.camera);

    // 3. Lighting (Minimal flat blueprint architectural lighting)
    const ambientLight = new THREE.AmbientLight(0xfaf8f2, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 0.45);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    // 4. Initialize Core Subsystems
    this.materials = new MaterialLibrary();
    this.soundEngine = new SoundEngine();
    this.effects = new EffectsManager(this.scene, this.materials);
    this.hud = new HUD(this);
    this.killstreaks = new KillstreakManager(this);
    this.level = new Level(this.scene, this.materials, 'small');
    this.weapons = new WeaponSystem(this.camera, this.materials, this.soundEngine, this.effects);
    this.player = new Player(this.camera, this.domElement, this.level, this.soundEngine, this.effects);
    this.combat = new CombatSystem(this.scene, this.camera, this.level, this.effects, this.soundEngine, this.hud, this.killstreaks);
    this.waves = new WaveManager(
      this.scene,
      this.level,
      this.materials,
      this.soundEngine,
      this.effects,
      this.hud,
      this.player,
      this.weapons
    );
    this.grenades = new GrenadeManager(this.scene, this.materials, this.soundEngine, this.effects, this.level);
    this.customization = new CustomizationManager(this.materials, this.weapons);
    this.tdm = new TDMManager(
      this.scene,
      this.level,
      this.materials,
      this.soundEngine,
      this.effects,
      this.hud,
      this.player,
      this.weapons
    );
    this.mobileControls = new MobileControls(this.player, this.weapons, this);
    this.auth = new AuthManager();
    this.lobby = new LobbyScene(this.scene, this.materials, this.customization, this.weapons);
    this.minimap = new MinimapManager(this);
    this.voiceChat = new VoiceChatSystem(this);

    this.currentMode = 'wave'; // 'wave' or 'tdm'

    // 5. Game State Coordinator
    this.stateManager = new GameStateManager(this);

    // 6. Connect System Events & Callbacks
    this.bindEvents();

    // 7. Clock & Loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // 8. Resize Listener
    window.addEventListener('resize', () => this.onResize());
  }


  bindEvents() {
    // Player Shooting Actions
    this.player.onShootStart = () => {
      if (this.stateManager.currentState !== 'PLAYING') return;
      this.attemptShoot();
    };

    // Aim Down Sights / Sniper Scoping
    this.player.onAimChange = (aiming) => {
      this.weapons.setAim(aiming);
    };

    // Grenade Throw Action
    this.player.onGrenadeRequested = () => {
      if (this.stateManager.currentState !== 'PLAYING') return;
      if (this.player.grenadeCount > 0) {
        this.player.grenadeCount--;
        this.hud.updateGrenades(this.player.grenadeCount);

        const throwOrigin = this.camera.position.clone();
        const throwDir = new THREE.Vector3();
        this.camera.getWorldDirection(throwDir);
        this.grenades.throwGrenade(throwOrigin, throwDir, 18, this.player);
      }
    };

    // Reload
    this.player.onReloadRequested = () => {
      if (this.stateManager.currentState !== 'PLAYING') return;
      this.weapons.reload();
    };

    // Weapon Switching
    this.player.onWeaponSwitch = (slotIndex) => {
      if (this.stateManager.currentState !== 'PLAYING') return;
      this.weapons.switchWeapon(slotIndex);
    };

    // Mouse Wheel Scroll Weapon
    this.player.onScrollWeapon = (direction) => {
      if (this.stateManager.currentState !== 'PLAYING') return;
      let nextIndex = (this.weapons.currentWeaponIndex + direction + this.weapons.weapons.length) % this.weapons.weapons.length;
      this.weapons.switchWeapon(nextIndex);
    };

    // Active weapon index query for dynamic FOV
    this.player.onGetActiveWeaponIndex = () => this.weapons.currentWeaponIndex;

    // Directional damage indicator and healing aura feedback to HUD
    this.player.onDamageReceived = (amount, relativeAngle, sourcePos) => {
      this.hud.showDirectionalDamage(relativeAngle);
    };
    this.player.onHealingEffect = (active) => {
      this.hud.setHealingEffect(active);
    };

    // Player Death -> Game Over or TDM Respawn
    this.player.onPlayerDeath = () => {
      if (this.killstreaks) {
        this.killstreaks.onPlayerDeath();
      }
      if (this.currentMode === 'tdm') {
        this.tdm.handlePlayerKilled();
      } else {
        this.stateManager.gameOver(
          this.hud.score,
          `WAVE ${this.waves.currentWave}`,
          this.waves.totalKills,
          this.waves.totalHeadshots,
          false,
          1,
          this.hud.score * 12
        );
      }
    };

    // TDM Match Completed
    this.tdm.onMatchEnded = (results) => {
      this.stateManager.gameOver(
        this.hud.score,
        `TDM: ${results.winner}`,
        results.playerKills,
        0,
        results.winner === 'BLUE TEAM',
        results.playerDeaths,
        results.playerDamage
      );
    };

    // Combat -> Wave Manager kill count
    this.combat.onEnemyKilled = (enemy, isHeadshot) => {
      if (this.currentMode === 'wave') {
        this.waves.handleEnemyKilled(enemy, isHeadshot);
      }
    };
  }

  startMode(mode = 'wave', teamSize = 4, mapSize = 'small') {
    this.currentMode = mode;
    this.level.setMapSize(mapSize);
    if (this.lobby) {
      this.lobby.hide();
    }

    if (mode === 'wave') {
      this.tdm.reset();
      this.hud.setTDMMode(false);
      this.waves.reset();
      this.waves.startWave(1);
    } else {
      this.waves.reset();
      this.hud.setTDMMode(true);
      this.tdm.startMatch(teamSize);
    }
  }

  attemptShoot() {
    const now = performance.now() / 1000;
    if (this.weapons.canShoot(now)) {
      const firedWeapon = this.weapons.shoot(now);
      if (firedWeapon) {
        const targets = this.currentMode === 'wave' ? this.waves.enemies : this.tdm.bots;
        this.combat.handleWeaponFire(firedWeapon, targets, this.weapons);
      }
    }
  }

  restart() {
    this.player.reset();
    this.effects.reset();
    this.grenades.reset();
    if (this.killstreaks) {
      this.killstreaks.reset();
    }
    this.weapons.weapons.forEach(w => {
      w.currentAmmo = w.magSize;
      w.reserveAmmo = w.maxReserve / 2;
    });
    this.weapons.switchWeapon(0);
    this.hud.reset();
    this.hud.updateGrenades(this.player.grenadeCount);

    if (this.currentMode === 'wave') {
      this.waves.reset();
      this.waves.startWave(1);
    } else {
      this.tdm.startMatch(this.tdm.teamSize);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.stateManager.currentState === 'PLAYING') {
      // Automatic weapons continuous fire when holding LMB
      if (this.player.isShooting && this.weapons.activeWeapon.type === 'auto') {
        this.attemptShoot();
      }

      // Update Systems
      this.player.update(delta);
      this.weapons.update(delta, this.player.getPlayerStateForWeapon());
      this.effects.update(delta);
      if (this.level && this.level.update) {
        this.level.update(delta);
      }
      if (this.killstreaks && this.killstreaks.update) {
        this.killstreaks.update(delta);
      }
      this.minimap.update(delta);
      this.hud.update(delta);

      // Update Grenades physics and explosion raycast
      const allTargets = this.currentMode === 'wave' ? this.waves.enemies : this.tdm.bots;
      this.grenades.update(delta, (epicenter, radius, maxDamage, source) => {
        this.combat.handleGrenadeExplosion(epicenter, radius, maxDamage, source, allTargets, this.player);
      });

      // Update Mode
      if (this.currentMode === 'wave') {
        this.waves.update(delta);
      } else {
        this.tdm.update(delta);
      }

      // Update HUD
      this.hud.updateHp(this.player.hp, this.player.maxHp);
      this.hud.updateWeapon(this.weapons.activeWeapon, this.weapons.currentWeaponIndex);
      this.hud.updateGrenades(this.player.grenadeCount);
    } else if (this.stateManager.currentState === 'LOBBY' && this.lobby) {
      this.lobby.update(delta);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

}

// Instantiate Game safely regardless of document readyState
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
  });
} else {
  window.game = new Game();
}

