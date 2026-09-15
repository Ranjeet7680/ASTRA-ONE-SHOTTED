import * as THREE from 'three';
import { clamp, lerp } from './utilities.js';

export class Player {
  constructor(camera, domElement, level, soundEngine, effects) {
    this.camera = camera;
    this.domElement = domElement;
    this.level = level;
    this.soundEngine = soundEngine;
    this.effects = effects;

    // Movement state
    this.position = this.level.playerSpawnPoint.clone();
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 6.8;
    this.sprintMultiplier = 1.55;
    this.tacSprintMultiplier = 2.0;
    this.crouchMultiplier = 0.5;
    this.jumpForce = 8.5;
    this.gravity = -24;
    this.isGrounded = true;

    // Advanced COD Movement States
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideDuration = 0.75;
    this.slideDir = new THREE.Vector3();
    this.isTacSprinting = false;
    this.tacSprintTimer = 0;
    this.tacSprintDuration = 3.5;
    this.lastSprintTapTime = 0;

    // Omnimovement: Dolphin Dive & Directional Tilts
    this.isDiving = false;
    this.diveTimer = 0;
    this.diveDuration = 0.7;
    this.diveDir = new THREE.Vector3();
    this.slideDotForward = 1;
    this.slideDotRight = 0;
    this.omniPitchOffset = 0;

    // Mantling / Vaulting
    this.isMantling = false;
    this.mantleTargetY = 0;
    this.mantleProgress = 0;

    // Grenades
    this.grenadeCount = 2;
    this.maxGrenades = 2;

    // Dimensions
    this.radius = 0.45;
    this.standingHeight = 1.72;
    this.crouchHeight = 0.95;
    this.slideHeight = 0.75;
    this.proneHeight = 0.42;
    this.isProning = false;
    this.currentEyeHeight = this.standingHeight;

    // Tactical Peek / Lean (-1: left, 0: center, 1: right)
    this.peekState = 0;
    this.currentPeekRoll = 0;
    this.currentPeekOffset = 0;

    // Camera rotation (Euler yaw/pitch)
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.mouseSensitivity = 1.0;
    this.baseFov = 75;

    // Head-bob & Footsteps
    this.bobTimer = 0;
    this.bobAmount = 0.045;
    this.stepDistance = 0;
    this.stepThreshold = 2.2;

    // Health & Auto-Regeneration (Scales with Difficulty: Easy=6s, Medium=10s, Hard=14s)
    this.maxHp = 100;
    this.hp = 100;
    this.difficulty = 'medium';
    this.regenDelay = 10.0;
    this.regenRate = 25.0;
    this.callsign = 'OPERATOR';
    this.isDead = false;
    this.invulnerableTimer = 0;
    this.timeSinceLastDamage = 999;
    this.hasPlayedRegenSound = false;

    // Match stats
    this.kills = 0;
    this.deaths = 0;

    // Weapon Inspect Animation (<kbd>I</kbd>)
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.inspectDuration = 1.8;

    // Jump Landing Compression & Damage Flinch
    this.landingOffset = 0;

    // Camera Perspective Mode (FPP / TPP)
    this.perspectiveMode = 'fpp';
    this.tppCameraDistance = 2.4;
    this.tppShoulderOffset = 0.45;
    this.tppHeightOffset = 0.25;
    this.tppAlpha = 0.0;
    this.onPerspectiveChange = null;
    this.flinchPitch = 0;
    this.flinchRoll = 0;

    // Low HP Heartbeat
    this.heartbeatTimer = 0;


    // Input States
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      crouch: false,
      jump: false
    };

    this.isPointerLocked = false;
    this.isShooting = false;
    this.isAiming = false;
    this.inputManager = null;

    // Setup input listeners
    this.setupInputs();
  }

  setInputManager(im) {
    this.inputManager = im;
  }

  setupInputs() {
    // Pointer Lock on click
    this.domElement.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isDead) {
        this.domElement.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.domElement;
    });

    // Mouse Movement
    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked || this.isDead) return;

      const factor = 0.0022 * this.mouseSensitivity;
      this.yaw -= e.movementX * factor;
      this.pitch -= e.movementY * factor;

      this.lastLookDeltaX = (this.lastLookDeltaX || 0) + e.movementX;
      this.lastLookDeltaY = (this.lastLookDeltaY || 0) + e.movementY;

      // Clamp pitch (-85 to +85 degrees)
      const maxPitch = Math.PI / 2 - 0.08;
      this.pitch = clamp(this.pitch, -maxPitch, maxPitch);
    });

    // Keyboard Down
    document.addEventListener('keydown', (e) => {
      if (this.isDead) return;
      switch (e.code) {
        case 'KeyW': this.keys.forward = true; break;
        case 'KeyS': this.keys.backward = true; break;
        case 'KeyA': this.keys.left = true; break;
        case 'KeyD': this.keys.right = true; break;
        case 'ShiftLeft':
        case 'ShiftRight':
          const nowTime = performance.now();
          const isMovingAnyDir = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
          if (nowTime - this.lastSprintTapTime < 340 && isMovingAnyDir) {
            this.isTacSprinting = true;
            this.tacSprintTimer = this.tacSprintDuration;
          }
          this.lastSprintTapTime = nowTime;
          this.keys.sprint = true;
          break;
        case 'ControlLeft':
        case 'KeyC':
          this.keys.crouch = true;
          if (this.isTacSprinting || this.keys.sprint) {
            this.trySlide();
          }
          break;
        case 'KeyZ':
          this.tryDive();
          break;
        case 'Space':
          if (this.isSliding || this.isDiving) {
            // Slide / Dive Cancel!
            this.cancelSlide();
            this.isDiving = false;
            if (this.isGrounded) {
              this.velocity.y = this.jumpForce;
              this.isGrounded = false;
            }
          } else if (this.isGrounded && !this.keys.crouch) {
            if (!this.tryMantle()) {
              this.velocity.y = this.jumpForce;
              this.isGrounded = false;
            }
          }
          break;
        case 'KeyG':
          if (this.onGrenadeRequested) this.onGrenadeRequested();
          break;
        case 'KeyR':
          if (this.onReloadRequested) this.onReloadRequested();
          break;
        case 'KeyI':
          this.inspectWeapon();
          break;
        case 'KeyV':
          this.togglePerspective();
          break;
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
        case 'Digit1':
          if (this.onWeaponSwitch) this.onWeaponSwitch(0);
          break;
        case 'Digit2':
          if (this.onWeaponSwitch) this.onWeaponSwitch(1);
          break;
        case 'Digit3':
          if (this.onWeaponSwitch) this.onWeaponSwitch(2);
          break;
        case 'Digit4':
          if (this.onWeaponSwitch) this.onWeaponSwitch(3);
          break;
      }
    });

    // Keyboard Up
    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': this.keys.forward = false; break;
        case 'KeyS': this.keys.backward = false; break;
        case 'KeyA': this.keys.left = false; break;
        case 'KeyD': this.keys.right = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': this.keys.sprint = false; break;
        case 'ControlLeft':
        case 'KeyC': this.keys.crouch = false; break;
      }
    });

    // Mouse Down (Shoot / Aim)
    document.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked || this.isDead) return;
      if (e.button === 0) {
        this.isShooting = true;
        if (this.onShootStart) this.onShootStart();
      } else if (e.button === 2) {
        this.isAiming = true;
        if (this.onAimChange) this.onAimChange(true);
      }
    });

    // Mouse Up
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isShooting = false;
        if (this.onShootEnd) this.onShootEnd();
      } else if (e.button === 2) {
        this.isAiming = false;
        if (this.onAimChange) this.onAimChange(false);
      }
    });

    // Mouse Scroll Wheel for Weapon Switch
    document.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked || this.isDead) return;
      if (this.onScrollWeapon) {
        this.onScrollWeapon(e.deltaY > 0 ? 1 : -1);
      }
    });

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Call of Duty Omnidirectional Slide (Black Ops 6 style)
  trySlide() {
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (this.isGrounded && horizontalSpeed > 3.0 && !this.isSliding && !this.isDiving) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;

      // Slide in current movement vector
      if (horizontalSpeed > 0.5) {
        this.slideDir.set(this.velocity.x, 0, this.velocity.z).normalize();
      } else {
        this.camera.getWorldDirection(this.slideDir);
        this.slideDir.y = 0;
        this.slideDir.normalize();
      }

      // Calculate relative camera forward/right dot products for omni-slide camera tilts
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.slideDotForward = this.slideDir.dot(forward); // +1 forward, -1 backward
      this.slideDotRight = this.slideDir.dot(right); // +1 right, -1 left

      this.velocity.x = this.slideDir.x * 12.8;
      this.velocity.z = this.slideDir.z * 12.8;

      // Audio & Visual feedback
      this.soundEngine.playSlide();
      this.effects.addTrauma(0.14);

      // Floor dust
      this.effects.createSurfaceImpact(
        this.position.clone().setY(this.position.y + 0.1),
        new THREE.Vector3(0, 1, 0)
      );
    }
  }

  cancelSlide() {
    this.isSliding = false;
    this.slideTimer = 0;
  }

  tryProne() {
    this.isProning = !this.isProning;
    if (this.isProning) {
      this.keys.crouch = false;
      this.cancelSlide();
      this.isDiving = false;
    }
    if (this.soundEngine && this.soundEngine.playSlide) {
      this.soundEngine.playSlide();
    }
    return this.isProning;
  }

  setPeek(dir) {
    // -1 = left, 0 = neutral, 1 = right
    this.peekState = (this.peekState === dir) ? 0 : dir;
    return this.peekState;
  }

  // Call of Duty Dolphin Dive (Black Ops 6 Omnidirectional Dive to Prone)
  tryDive() {
    if (this.isGrounded && !this.isDiving && !this.isSliding) {
      const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right;
      if (!isMoving && !this.keys.sprint && !this.isTacSprinting) return false;

      this.isDiving = true;
      this.diveTimer = this.diveDuration;

      // Determine dive direction from wish direction or camera facing
      const moveDir = new THREE.Vector3();
      if (this.keys.forward) moveDir.z -= 1;
      if (this.keys.backward) moveDir.z += 1;
      if (this.keys.left) moveDir.x -= 1;
      if (this.keys.right) moveDir.x += 1;

      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
        const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        this.diveDir = new THREE.Vector3()
          .addScaledVector(forward, -moveDir.z)
          .addScaledVector(right, moveDir.x).normalize();
      } else {
        this.diveDir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
      }

      // Horizontal launch leap
      this.velocity.y = 3.6;
      this.velocity.x = this.diveDir.x * 13.8;
      this.velocity.z = this.diveDir.z * 13.8;
      this.isGrounded = false;

      this.soundEngine.playSlide();
      this.effects.addTrauma(0.2);
      return true;
    }
    return false;
  }

  // Mantle / Vault over obstacles
  tryMantle() {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const checkPos = this.position.clone().addScaledVector(forward, 0.9);

    for (const col of this.level.colliders) {
      const b = col.box;
      if (checkPos.x >= b.min.x && checkPos.x <= b.max.x && checkPos.z >= b.min.z && checkPos.z <= b.max.z) {
        const heightDiff = b.max.y - this.position.y;
        if (heightDiff > 0.6 && heightDiff <= 2.2) {
          // Vault onto top of obstacle!
          this.position.y = b.max.y + 0.1;
          this.position.addScaledVector(forward, 0.75);
          this.velocity.y = 1.5;
          this.soundEngine.playFootstep();
          return true;
        }
      }
    }
    return false;
  }

  inspectWeapon() {
    if (this.isInspecting || this.isShooting || this.isDead || this.isAiming) return;
    this.isInspecting = true;
    this.inspectTimer = 0;
    this.soundEngine.playWeaponInspect();
  }

  requestFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  toggleFullscreen() {
    if (document.fullscreenElement) this.exitFullscreen();
    else this.requestFullscreen();
  }

  setPerspective(mode) {
    this.perspectiveMode = mode === 'tpp' ? 'tpp' : 'fpp';
    if (this.onPerspectiveChange) {
      this.onPerspectiveChange(this.perspectiveMode);
    }
    return this.perspectiveMode;
  }

  togglePerspective() {
    return this.setPerspective(this.perspectiveMode === 'fpp' ? 'tpp' : 'fpp');
  }

  getPlayerStateForWeapon() {
    const dx = this.lastLookDeltaX || 0;
    const dy = this.lastLookDeltaY || 0;
    this.lastLookDeltaX = 0;
    this.lastLookDeltaY = 0;

    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    return {
      isTacSprinting: this.isTacSprinting,
      isInspecting: this.isInspecting,
      isSliding: this.isSliding,
      isDiving: this.isDiving,
      isMoving: horizSpeed > 0.4,
      speed: horizSpeed,
      isSprinting: this.keys.sprint || this.isTacSprinting,
      isGrounded: this.isGrounded,
      mouseDeltaX: dx,
      mouseDeltaY: dy,
      inspectProgress: this.isInspecting ? (this.inspectTimer / this.inspectDuration) : 0
    };
  }

  // Take damage from enemies
  takeDamage(amount, sourcePos = null) {
    if (this.isDead || this.invulnerableTimer > 0) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.2;
    this.timeSinceLastDamage = 0;
    this.hasPlayedRegenSound = false;

    // Flinch impulse
    this.flinchPitch = -0.07;
    this.flinchRoll = (Math.random() - 0.5) * 0.08;

    // Audio & Screen Feedback
    this.soundEngine.playPlayerDamage();
    this.effects.addTrauma(0.48);

    // Directional calculation
    let relativeAngle = 0;
    if (sourcePos) {
      const dx = sourcePos.x - this.position.x;
      const dz = sourcePos.z - this.position.z;
      const hitAngle = Math.atan2(dx, dz);
      relativeAngle = hitAngle - this.yaw;
    }

    if (this.onDamageReceived) {
      this.onDamageReceived(amount, relativeAngle, sourcePos);
    }

    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.add('hit');
      setTimeout(() => vignette.classList.remove('hit'), 150);
      if (this.hp <= 30) {
        vignette.classList.add('low-health');
      } else {
        vignette.classList.remove('low-health');
      }
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const vignette = document.getElementById('damage-vignette');
    if (vignette && this.hp > 30) {
      vignette.classList.remove('low-health');
    }
  }

  die() {
    this.isDead = true;
    this.deaths++;
    this.isShooting = false;
    this.isAiming = false;
    this.isSliding = false;
    this.isDiving = false;
    this.isTacSprinting = false;
    if (document.exitPointerLock) document.exitPointerLock();
    if (this.onPlayerDeath) this.onPlayerDeath();
  }

  reset() {
    this.hp = this.maxHp;
    this.isDead = false;
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    this.roll = 0;
    this.isShooting = false;
    this.isAiming = false;
    this.isSliding = false;
    this.isDiving = false;
    this.isTacSprinting = false;
    this.timeSinceLastDamage = 999;
    this.grenadeCount = this.maxGrenades;

    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.remove('hit');
      vignette.classList.remove('low-health');
    }
  }


  setDifficulty(diff = 'medium') {
    this.difficulty = diff.toLowerCase();
    if (this.difficulty === 'easy') {
      this.regenDelay = 6.0;
      this.regenRate = 35.0;
    } else if (this.difficulty === 'hard') {
      this.regenDelay = 14.0;
      this.regenRate = 18.0;
    } else {
      this.regenDelay = 10.0;
      this.regenRate = 25.0;
    }
  }

  update(delta) {
    if (this.isDead) return;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
    }

    // Inspect Animation timer
    if (this.isInspecting) {
      this.inspectTimer += delta;
      if (this.inspectTimer >= this.inspectDuration || this.isShooting || this.isAiming) {
        this.isInspecting = false;
      }
    }

    // Low HP Heartbeat Audio Pulse
    if (this.hp <= 30 && !this.isDead) {
      this.heartbeatTimer = (this.heartbeatTimer || 0) + delta;
      if (this.heartbeatTimer >= 0.85) {
        this.heartbeatTimer = 0;
        this.soundEngine.playHeartbeat();
      }
    } else {
      this.heartbeatTimer = 0;
    }

    // Auto-Health Regeneration & Healing Fill Aura (Scaled by Difficulty)
    this.timeSinceLastDamage += delta;
    const requiredDelay = this.regenDelay || 10.0;
    const healRate = this.regenRate || 25.0;

    if (this.timeSinceLastDamage >= requiredDelay && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + delta * healRate);
      if (!this.hasPlayedRegenSound) {
        this.soundEngine.playHealthRegen();
        this.soundEngine.playHealingAura();
        this.hasPlayedRegenSound = true;
      }
      if (this.onHealingEffect) this.onHealingEffect(true);
      if (this.hp > 30) {
        const vignette = document.getElementById('damage-vignette');
        if (vignette) vignette.classList.remove('low-health');
      }
    } else {
      if (this.onHealingEffect) this.onHealingEffect(false);
    }

    // Consume Look Delta from InputManager (Gyroscope + Mobile Touch Drag)
    if (this.inputManager) {
      const look = this.inputManager.getLookDelta();
      if (look.dx !== 0 || look.dy !== 0) {
        this.yaw -= look.dx;
        this.pitch -= look.dy;
        const maxPitch = Math.PI / 2 - 0.08;
        this.pitch = clamp(this.pitch, -maxPitch, maxPitch);
        this.lastLookDeltaX = (this.lastLookDeltaX || 0) + look.dx;
        this.lastLookDeltaY = (this.lastLookDeltaY || 0) + look.dy;
      }
    }

    // Tactical Sprint timer (Omnimovement: sprint in any direction)
    const isMoving = this.keys.forward || this.keys.backward || this.keys.left || this.keys.right ||
      (this.inputManager && (Math.abs(this.inputManager.moveVector.x) > 0.1 || Math.abs(this.inputManager.moveVector.z) > 0.1));
    if (this.isTacSprinting) {
      this.tacSprintTimer -= delta;
      if (this.tacSprintTimer <= 0 || !isMoving) {
        this.isTacSprinting = false;
      }
    }

    // 1. Calculate Desired Movement Vector (360-degree Omnimovement)
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    // Analog input from mobile joystick via inputManager
    if (this.inputManager) {
      const imMove = this.inputManager.getMoveVector();
      if (imMove.x !== 0 || imMove.z !== 0) {
        moveDir.x += imMove.x;
        moveDir.z += imMove.z;
      }
    }

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // Transform by Camera Yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, -moveDir.z)
      .addScaledVector(right, moveDir.x);

    // Speed calculation - Omnidirectional Sprinting (COD Omnimovement)
    let currentSpeed = this.moveSpeed;
    if (this.isProning) {
      currentSpeed *= 0.32; // Prone crawl speed
    } else if (this.isTacSprinting && isMoving) {
      currentSpeed *= this.tacSprintMultiplier;
    } else if (this.keys.sprint && !this.keys.crouch && isMoving) {
      currentSpeed *= this.sprintMultiplier;
    } else if (this.keys.crouch) {
      currentSpeed *= this.crouchMultiplier;
    }

    // Omnimovement: Sliding & Dolphin Diving Mechanics
    let targetRoll = 0;
    this.omniPitchOffset = 0;

    // Tactical Peek Leaning
    const targetPeekRoll = this.peekState * 0.16;
    const targetPeekOffset = this.peekState * 0.32;
    this.currentPeekRoll = lerp(this.currentPeekRoll, targetPeekRoll, delta * 14);
    this.currentPeekOffset = lerp(this.currentPeekOffset, targetPeekOffset, delta * 14);
    targetRoll += this.currentPeekRoll;

    if (this.isDiving) {
      this.diveTimer -= delta;
      // High-speed airborne dive trajectory
      this.velocity.x = this.diveDir.x * 13.8;
      this.velocity.z = this.diveDir.z * 13.8;
      this.omniPitchOffset = -0.15; // pitch down into dive

      // Check ground landing
      if (this.isGrounded && this.diveTimer < 0.5) {
        this.isDiving = false;
        this.soundEngine.playPlayerDamage();
        this.landingOffset = -0.22;
        this.effects.addTrauma(0.22);
        this.effects.createSurfaceImpact(
          this.position.clone().setY(this.position.y + 0.05),
          new THREE.Vector3(0, 1, 0)
        );
      }
      if (this.diveTimer <= 0) {
        this.isDiving = false;
      }
    } else if (this.isSliding) {
      this.slideTimer -= delta;
      const progress = 1 - (this.slideTimer / this.slideDuration);
      const slideSpeed = lerp(12.8, 3.5, progress);
      this.velocity.x = this.slideDir.x * slideSpeed;
      this.velocity.z = this.slideDir.z * slideSpeed;

      // Omnidirectional camera tilts
      targetRoll = (this.slideDotRight || 0) * 0.12; // roll into turn
      if ((this.slideDotForward || 0) < -0.3) {
        this.omniPitchOffset = 0.08; // lean back when sliding backward
      }

      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    } else {
      // Normal horizontal acceleration & friction
      const accel = this.isGrounded ? 16 : 4;
      const targetVelX = wishDir.x * currentSpeed;
      const targetVelZ = wishDir.z * currentSpeed;
      this.velocity.x = lerp(this.velocity.x, targetVelX, delta * accel);
      this.velocity.z = lerp(this.velocity.z, targetVelZ, delta * accel);

      // Strafe sprint leaning
      if (this.keys.sprint || this.isTacSprinting) {
        if (this.keys.left) targetRoll -= 0.045;
        if (this.keys.right) targetRoll += 0.045;
      }
    }

    // 2. Gravity
    this.velocity.y += this.gravity * delta;

    // 3. Collision Resolution
    this.resolveMovementAndCollisions(delta);

    // 4. Smooth Crouch & Slide Height Interpolation
    let targetHeight = this.standingHeight;
    if (this.isProning) {
      targetHeight = this.proneHeight; // Low prone eye height (0.42m)
    } else if (this.isDiving) {
      targetHeight = 0.58; // low prone dive height
    } else if (this.isSliding) {
      targetHeight = this.slideHeight;
    } else if (this.keys.crouch) {
      targetHeight = this.crouchHeight;
    }
    this.currentEyeHeight = lerp(this.currentEyeHeight, targetHeight, delta * 14);
    this.roll = lerp(this.roll, targetRoll, delta * 12);

    // 5. Head Bob & Footsteps
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    let bobOffsetY = 0;
    let bobOffsetX = 0;

    if (this.isGrounded && horizontalSpeed > 0.8 && !this.isSliding && !this.isDiving && !this.isProning) {
      const bobFreq = (this.isTacSprinting ? 14 : (this.keys.sprint ? 12 : 8));
      this.bobTimer += delta * bobFreq;
      bobOffsetY = Math.sin(this.bobTimer) * this.bobAmount;
      bobOffsetX = Math.cos(this.bobTimer * 0.5) * (this.bobAmount * 0.6);

      this.stepDistance += horizontalSpeed * delta;
      if (this.stepDistance >= this.stepThreshold) {
        this.stepDistance = 0;
        this.soundEngine.playFootstep();
      }
    } else {
      this.bobTimer = 0;
    }

    // Flinch & Landing compression recovery
    this.flinchPitch = lerp(this.flinchPitch || 0, 0, delta * 12);
    this.flinchRoll = lerp(this.flinchRoll || 0, 0, delta * 12);
    this.landingOffset = lerp(this.landingOffset || 0, 0, delta * 12);

    // 6. Camera Position & Rotation with Screen Shake, Landing, Omnimovement Tilts, Peek, Flinch & TPP
    const shake = this.effects.shakeOffset;
    const peekRightX = Math.cos(this.yaw) * this.currentPeekOffset;
    const peekRightZ = -Math.sin(this.yaw) * this.currentPeekOffset;

    const targetTppAlpha = this.perspectiveMode === 'tpp' ? 1.0 : 0.0;
    this.tppAlpha = lerp(this.tppAlpha || 0, targetTppAlpha, delta * 12);

    const fppX = this.position.x + bobOffsetX + shake.x + peekRightX;
    const fppY = this.position.y + this.currentEyeHeight + bobOffsetY + shake.y + this.landingOffset;
    const fppZ = this.position.z + peekRightZ;

    // TPP camera calculation: offset backward along view direction, shifted over right shoulder
    const cosPitch = Math.cos(this.pitch);
    const camDirX = -Math.sin(this.yaw) * cosPitch;
    const camDirY = -Math.sin(this.pitch);
    const camDirZ = -Math.cos(this.yaw) * cosPitch;
    const camRightX = Math.cos(this.yaw);
    const camRightZ = -Math.sin(this.yaw);

    const tppX = fppX - camDirX * this.tppCameraDistance + camRightX * this.tppShoulderOffset;
    const tppY = fppY - camDirY * (this.tppCameraDistance * 0.7) + this.tppHeightOffset;
    const tppZ = fppZ - camDirZ * this.tppCameraDistance + camRightZ * this.tppShoulderOffset;

    this.camera.position.set(
      lerp(fppX, tppX, this.tppAlpha),
      lerp(fppY, tppY, this.tppAlpha),
      lerp(fppZ, tppZ, this.tppAlpha)
    );

    const euler = new THREE.Euler(
      this.pitch + shake.pitch + this.flinchPitch + this.omniPitchOffset,
      this.yaw + shake.yaw,
      this.roll + shake.roll + this.flinchRoll,
      'YXZ'
    );
    this.camera.quaternion.setFromEuler(euler);

    // 7. Dynamic FOV
    let targetFov = this.baseFov;
    if (this.isAiming && this.onGetActiveWeaponIndex && this.onGetActiveWeaponIndex() === 3) {
      targetFov = 26; // High zoom for sniper
    } else if (this.isTacSprinting) {
      targetFov = this.baseFov + 10;
    } else if (this.keys.sprint && horizontalSpeed > 2.0) {
      targetFov = this.baseFov + 6;
    }
    this.camera.fov = lerp(this.camera.fov, targetFov, delta * 14);
    this.camera.updateProjectionMatrix();
  }


  // Multi-pass AABB collision & stair step detection
  resolveMovementAndCollisions(delta) {
    // A. Vertical movement & Floor Detection
    const nextY = this.position.y + this.velocity.y * delta;
    this.position.y = nextY;

    let floorY = -100;
    const feetPos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);

    // Check all floor colliders directly underneath feet
    for (const c of this.level.colliders) {
      const box = c.box;
      if (
        feetPos.x >= box.min.x - this.radius &&
        feetPos.x <= box.max.x + this.radius &&
        feetPos.z >= box.min.z - this.radius &&
        feetPos.z <= box.max.z + this.radius
      ) {
        // If box top is below or near feet
        if (box.max.y <= feetPos.y + 0.45 && box.max.y > floorY) {
          floorY = box.max.y;
        }
      }
    }

    const wasGrounded = this.isGrounded;
    const fallVelY = this.velocity.y;

    // Ground snap / stair climb
    if (this.position.y <= floorY) {
      this.position.y = floorY;
      this.velocity.y = 0;
      this.isGrounded = true;

      // Detect landing from air
      if (!wasGrounded && fallVelY < -2.5) {
        this.landingOffset = Math.max(-0.25, fallVelY * 0.04);
        this.soundEngine.playFootstep();
      }
    } else {
      this.isGrounded = false;
    }

    // B. Horizontal Movement & Wall Sliding
    const nextX = this.position.x + this.velocity.x * delta;
    const nextZ = this.position.z + this.velocity.z * delta;
    const testPos = new THREE.Vector3(nextX, this.position.y + 0.5, nextZ);

    for (const c of this.level.colliders) {
      const box = c.box;
      // Skip floors well below feet or above head
      if (box.max.y <= this.position.y + 0.1 || box.min.y >= this.position.y + this.standingHeight) {
        continue;
      }

      // Check if this is a stair step we can smoothly step onto
      if (box.max.y > this.position.y && box.max.y <= this.position.y + 0.4) {
        // Step-up allowed
        continue;
      }

      // Resolve obstacle push-out
      c.resolveSphereCollision(testPos, this.radius);
    }

    this.position.x = testPos.x;
    this.position.z = testPos.z;

    // Safety arena bounds
    const maxBound = (this.level && this.level.arenaBounds) ? this.level.arenaBounds : 42;
    this.position.x = clamp(this.position.x, -maxBound, maxBound);
    this.position.z = clamp(this.position.z, -maxBound, maxBound);
    if (this.position.y < 0) this.position.y = 0;
  }
}
