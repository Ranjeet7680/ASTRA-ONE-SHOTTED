// Professional Mobile FPS Auto-Aim & Aim-Assist System
// Features: Target Magnetism, Crosshair Friction, ADS Snap-to-Target, Auto-Fire mode, and Obstacle Occlusion.
// Optimized for one-thumb, two-thumb, and claw mobile gameplay.

import * as THREE from 'three';
import { clamp, lerp } from './utilities.js';

export class AimAssistSystem {
  constructor(game) {
    this.game = game;
    this.raycaster = new THREE.Raycaster();

    // Default Configuration
    this.enabled = true;
    this.strength = 'STRONG'; // 'STRONG', 'MEDIUM', 'LIGHT', 'OFF'
    this.adsSnap = true;
    this.autoFire = false; // Simple mode
    this.coneAngleDeg = 24.0;
    this.maxDistance = 55.0;

    // Runtime state
    this.currentTarget = null;
    this.isLocked = false;
    this.lockConfidence = 0.0;
    this.autoFireCooldown = 0;
    this.wasAiming = false;
    this.snapTimer = 0;

    // Load persisted settings
    this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('astra_aim_assist_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.strength !== undefined) this.strength = parsed.strength;
        if (parsed.adsSnap !== undefined) this.adsSnap = parsed.adsSnap;
        if (parsed.autoFire !== undefined) this.autoFire = parsed.autoFire;
        if (parsed.coneAngleDeg !== undefined) this.coneAngleDeg = parsed.coneAngleDeg;
      }
    } catch {
      // Use defaults
    }
  }

  saveSettings() {
    try {
      const payload = {
        strength: this.strength,
        adsSnap: this.adsSnap,
        autoFire: this.autoFire,
        coneAngleDeg: this.coneAngleDeg
      };
      localStorage.setItem('astra_aim_assist_config', JSON.stringify(payload));
    } catch {
      // Ignored
    }
  }

  setStrength(str) {
    this.strength = str.toUpperCase();
    this.saveSettings();
  }

  setAutoFire(val) {
    this.autoFire = !!val;
    this.saveSettings();
  }

  setAdsSnap(val) {
    this.adsSnap = !!val;
    this.saveSettings();
  }

  setConeAngle(deg) {
    this.coneAngleDeg = parseFloat(deg);
    this.saveSettings();
  }

  getStrengthMultiplier() {
    switch (this.strength) {
      case 'STRONG': return 1.0;
      case 'MEDIUM': return 0.65;
      case 'LIGHT': return 0.35;
      default: return 0.0;
    }
  }

  // Scan visible hostile targets and pick the best candidate
  findBestTarget(camera, player, targets, levelColliders) {
    if (!targets || targets.length === 0) return null;

    const camPos = camera.position;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);

    const coneAngleRad = THREE.MathUtils.degToRad(
      player.isAiming ? this.coneAngleDeg * 1.35 : this.coneAngleDeg
    );

    let bestTarget = null;
    let minAngle = coneAngleRad;
    let bestHitPoint = null;

    for (const target of targets) {
      if (!target || target.isDead || target.state === 'SPAWN' || target.state === 'DEAD') continue;
      // Skip friendly bots
      if (target.team === 'BLUE') continue;

      // Target center of mass (upper chest / head)
      const targetPos = target.getWorldHeadCenter
        ? target.getWorldHeadCenter().clone().sub(new THREE.Vector3(0, 0.25, 0))
        : target.position.clone().add(new THREE.Vector3(0, 1.3, 0));

      const toTarget = targetPos.clone().sub(camPos);
      const dist = toTarget.length();

      if (dist > this.maxDistance || dist < 0.5) continue;

      const toTargetNorm = toTarget.clone().normalize();
      const dot = camDir.dot(toTargetNorm);
      const angle = Math.acos(clamp(dot, -1.0, 1.0));

      if (angle < minAngle) {
        // Line-of-sight check against level colliders
        let occluded = false;
        if (levelColliders && levelColliders.length > 0) {
          const ray = new THREE.Ray(camPos, toTargetNorm);
          for (const col of levelColliders) {
            const hit = new THREE.Vector3();
            if (ray.intersectBox(col.box, hit)) {
              if (camPos.distanceTo(hit) < dist - 0.5) {
                occluded = true;
                break;
              }
            }
          }
        }

        if (!occluded) {
          minAngle = angle;
          bestTarget = target;
          bestHitPoint = targetPos;
        }
      }
    }

    return bestTarget ? { target: bestTarget, position: bestHitPoint, angle: minAngle } : null;
  }

  // Update aim assist each frame
  update(delta, player, camera, targets, levelColliders) {
    if (this.strength === 'OFF') {
      this.isLocked = false;
      this.currentTarget = null;
      return { isLocked: false, target: null, shouldAutoFire: false };
    }

    const mult = this.getStrengthMultiplier();
    const candidate = this.findBestTarget(camera, player, targets, levelColliders);

    let shouldAutoFire = false;

    // Detect ADS activation snap
    const justEnteredAds = player.isAiming && !this.wasAiming;
    this.wasAiming = player.isAiming;

    if (justEnteredAds && this.adsSnap && candidate) {
      this.snapTimer = 0.18; // 180ms snap window
    }

    if (candidate) {
      this.currentTarget = candidate.target;
      this.isLocked = true;
      this.lockConfidence = clamp(1.0 - (candidate.angle / THREE.MathUtils.degToRad(this.coneAngleDeg)), 0.1, 1.0);

      const toTarget = candidate.position.clone().sub(camera.position);
      const horizDist = Math.hypot(toTarget.x, toTarget.z);

      // Desired Euler angles to face enemy
      const desiredYaw = Math.atan2(-toTarget.x, -toTarget.z);
      const desiredPitch = Math.atan2(toTarget.y, horizDist);

      // Shortest angle wrap
      let deltaYaw = desiredYaw - player.yaw;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;

      const deltaPitch = desiredPitch - player.pitch;

      // 1. ADS Snap-To-Target
      if (this.snapTimer > 0) {
        this.snapTimer -= delta;
        const snapRate = 18.0;
        player.yaw += deltaYaw * clamp(snapRate * delta, 0.0, 1.0);
        player.pitch += deltaPitch * clamp(snapRate * delta, 0.0, 1.0);
      } else {
        // 2. Continuous Target Magnetism (Sticky Aim)
        const magnetSpeed = (player.isAiming ? 11.5 : 8.5) * mult;
        const pull = clamp(magnetSpeed * delta * this.lockConfidence, 0.0, 0.45);
        player.yaw += deltaYaw * pull;
        player.pitch += deltaPitch * pull;
      }

      // Clamp pitch to prevent camera flips
      const maxPitch = Math.PI / 2 - 0.08;
      player.pitch = clamp(player.pitch, -maxPitch, maxPitch);

      // 3. Auto-Fire (Simple Mode)
      if (this.autoFire) {
        this.autoFireCooldown -= delta;
        if (candidate.angle < 0.075 && this.autoFireCooldown <= 0) { // Within ~4.3 degrees
          shouldAutoFire = true;
          this.autoFireCooldown = 0.12; // Controlled burst cadence
        }
      }
    } else {
      this.isLocked = false;
      this.currentTarget = null;
      this.lockConfidence = lerp(this.lockConfidence, 0, delta * 8);
    }

    return {
      isLocked: this.isLocked,
      target: this.currentTarget,
      confidence: this.lockConfidence,
      shouldAutoFire: shouldAutoFire
    };
  }
}
