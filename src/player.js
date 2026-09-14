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
    this.currentEyeHeight = this.standingHeight;

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

    // Health & 10s Auto-Regeneration
    this.maxHp = 100;
    this.hp = 100;
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

    // Setup input listeners
    this.setupInputs();
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
          if (nowTime - this.lastSprintTapTime < 320 && this.keys.forward) {
            this.isTacSprinting = true;
            this.tacSprintTimer = this.tacSprintDuration;
          }
          this.lastSprintTapTime = nowTime;
          this.keys.sprint = true;
          break;
        case 'ControlLeft':
        case 'KeyC':
          this.keys.crouch = true;
          this.trySlide();
          break;
        case 'Space':
          if (this.isSliding) {
            // Slide Cancel!
            this.cancelSlide();
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

  // Call of Duty Style Sliding
  trySlide() {
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (this.isGrounded && horizontalSpeed > 3.8 && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = this.slideDuration;

      // Slide in current movement direction
      this.slideDir.set(this.velocity.x, 0, this.velocity.z).normalize();
      this.velocity.x = this.slideDir.x * 12.0;
      this.velocity.z = this.slideDir.z * 12.0;

      // Audio & Visual feedback
      this.soundEngine.playSlide();
      this.effects.addTrauma(0.12);

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

  getPlayerStateForWeapon() {
    return {
      isTacSprinting: this.isTacSprinting,
      isInspecting: this.isInspecting,
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
    this.isTacSprinting = false;
    this.timeSinceLastDamage = 999;
    this.grenadeCount = this.maxGrenades;

    const vignette = document.getElementById('damage-vignette');
    if (vignette) {
      vignette.classList.remove('hit');
      vignette.classList.remove('low-health');
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

    // 10-Second Auto-Health Regeneration & Healing Fill Aura
    this.timeSinceLastDamage += delta;
    if (this.timeSinceLastDamage >= 10.0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + delta * 25);
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

    // Tactical Sprint timer
    if (this.isTacSprinting) {
      this.tacSprintTimer -= delta;
      if (this.tacSprintTimer <= 0 || !this.keys.forward) {
        this.isTacSprinting = false;
      }
    }

    // 1. Calculate Desired Movement Vector
    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.z -= 1;
    if (this.keys.backward) moveDir.z += 1;
    if (this.keys.left) moveDir.x -= 1;
    if (this.keys.right) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    // Transform by Camera Yaw
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wishDir = new THREE.Vector3()
      .addScaledVector(forward, -moveDir.z)
      .addScaledVector(right, moveDir.x);

    // Speed calculation
    let currentSpeed = this.moveSpeed;
    if (this.isTacSprinting && this.keys.forward) {
      currentSpeed *= this.tacSprintMultiplier;
    } else if (this.keys.sprint && !this.keys.crouch && this.keys.forward) {
      currentSpeed *= this.sprintMultiplier;
    } else if (this.keys.crouch) {
      currentSpeed *= this.crouchMultiplier;
    }

    // Sliding Mechanics
    let targetRoll = 0;
    if (this.isSliding) {
      this.slideTimer -= delta;
      const progress = 1 - (this.slideTimer / this.slideDuration);
      const slideSpeed = lerp(12.0, 3.5, progress);
      this.velocity.x = this.slideDir.x * slideSpeed;
      this.velocity.z = this.slideDir.z * slideSpeed;
      targetRoll = -0.06; // lean camera into slide

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
    }

    // 2. Gravity
    this.velocity.y += this.gravity * delta;

    // 3. Collision Resolution
    this.resolveMovementAndCollisions(delta);

    // 4. Smooth Crouch & Slide Height Interpolation
    let targetHeight = this.standingHeight;
    if (this.isSliding) {
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

    if (this.isGrounded && horizontalSpeed > 0.8 && !this.isSliding) {
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

    // 6. Camera Position & Rotation with Screen Shake, Landing, & Flinch
    const shake = this.effects.shakeOffset;
    this.camera.position.set(
      this.position.x + bobOffsetX + shake.x,
      this.position.y + this.currentEyeHeight + bobOffsetY + shake.y + this.landingOffset,
      this.position.z
    );

    const euler = new THREE.Euler(
      this.pitch + shake.pitch + this.flinchPitch,
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
    this.position.x = clamp(this.position.x, -30, 30);
    this.position.z = clamp(this.position.z, -30, 30);
    if (this.position.y < 0) this.position.y = 0;
  }
}
