// Unified Input Manager for ASTRA: One Shotted
// Consolidates Keyboard, Mouse, Touch Pointer Events, and DeviceOrientation Gyroscope

export class InputManager {
  constructor(game) {
    this.game = game;

    // Movement state
    this.moveVector = { x: 0, z: 0 };
    this.lookDelta = { dx: 0, dy: 0 };

    // Action states
    this.isFiring = false;
    this.isAiming = false;
    this.isJumping = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isDiving = false;
    this.isReloading = false;
    this.isGrenade = false;
    this.isInspecting = false;

    // 1. Gyroscope State & Configuration
    this.gyroSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
    this.gyroPermissionGranted = false;
    this.gyroEnabled = localStorage.getItem('astra_gyro_enabled') === 'true';
    this.gyroMode = localStorage.getItem('astra_gyro_mode') || 'always'; // 'always' or 'ads'
    this.gyroSensitivity = parseFloat(localStorage.getItem('astra_gyro_sens') || '1.0');
    this.gyroAdsSensitivity = parseFloat(localStorage.getItem('astra_gyro_ads_sens') || '0.6');
    this.gyroInvertY = localStorage.getItem('astra_gyro_invert_y') === 'true';

    // Per-optic sensitivities
    this.gyroOpticSens = {
      reddot: parseFloat(localStorage.getItem('astra_gyro_opt_reddot') || '1.0'),
      x2: parseFloat(localStorage.getItem('astra_gyro_opt_2x') || '0.9'),
      x3: parseFloat(localStorage.getItem('astra_gyro_opt_3x') || '0.8'),
      x4: parseFloat(localStorage.getItem('astra_gyro_opt_4x') || '0.6'),
      x6: parseFloat(localStorage.getItem('astra_gyro_opt_6x') || '0.45'),
      x8: parseFloat(localStorage.getItem('astra_gyro_opt_8x') || '0.3')
    };

    // Sensor Readings & Reference Calibration
    this.rawOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.neutralOrientation = { alpha: 0, beta: 0, gamma: 0 };
    this.lastSensorReading = { alpha: 0, beta: 0, gamma: 0 };
    this.smoothedDelta = { yaw: 0, pitch: 0 };
    this.hasInitialReading = false;

    // Gyro deadzone & smoothing params
    this.deadzone = 0.08; // degrees
    this.smoothFactor = 0.28; // exponential moving average

    // Multi-touch tracking
    this.activeTouches = new Map(); // pointerId -> { startX, startY, currentX, currentY, zone }

    this.initGyroscope();
    this.bindWindowEvents();
  }

  // ----------------- Gyroscope Subsystem -----------------

  initGyroscope() {
    if (!this.gyroSupported) return;

    // Auto-listen if permission is already given or not restricted by iOS
    if (typeof DeviceOrientationEvent.requestPermission !== 'function') {
      this.gyroPermissionGranted = true;
      this.startGyroListening();
    }
  }

  async requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          this.gyroPermissionGranted = true;
          this.gyroEnabled = true;
          localStorage.setItem('astra_gyro_enabled', 'true');
          this.startGyroListening();
          return { success: true, message: 'Gyroscope Permission Granted' };
        } else {
          this.gyroPermissionGranted = false;
          return { success: false, message: 'Gyroscope Permission Denied' };
        }
      } catch (err) {
        return { success: false, message: err.message };
      }
    } else {
      this.gyroPermissionGranted = true;
      this.gyroEnabled = true;
      localStorage.setItem('astra_gyro_enabled', 'true');
      this.startGyroListening();
      return { success: true, message: 'Gyroscope Active' };
    }
  }

  startGyroListening() {
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
    window.addEventListener('deviceorientation', this.onDeviceOrientation, false);
  }

  calibrateGyro() {
    this.neutralOrientation.alpha = this.rawOrientation.alpha;
    this.neutralOrientation.beta = this.rawOrientation.beta;
    this.neutralOrientation.gamma = this.rawOrientation.gamma;
    this.smoothedDelta.yaw = 0;
    this.smoothedDelta.pitch = 0;
    return true;
  }

  onDeviceOrientation(event) {
    if (event.beta === null || event.gamma === null) return;

    this.rawOrientation.alpha = event.alpha || 0;
    this.rawOrientation.beta = event.beta || 0;
    this.rawOrientation.gamma = event.gamma || 0;

    if (!this.hasInitialReading) {
      this.calibrateGyro();
      this.hasInitialReading = true;
      this.lastSensorReading = { ...this.rawOrientation };
      return;
    }

    if (!this.gyroEnabled) return;
    if (this.gyroMode === 'ads' && !this.isAiming) return;

    // Device orientation deltas
    // In landscape mode:
    // Tilting side-to-side maps to gamma/alpha -> Yaw (horizontal aim)
    // Tilting towards/away maps to beta -> Pitch (vertical aim)
    let dGamma = this.rawOrientation.gamma - this.lastSensorReading.gamma;
    let dBeta = this.rawOrientation.beta - this.lastSensorReading.beta;

    // Prevent sudden gimbal jump on degree wrapping
    if (Math.abs(dGamma) > 30) dGamma = 0;
    if (Math.abs(dBeta) > 30) dBeta = 0;

    this.lastSensorReading.alpha = this.rawOrientation.alpha;
    this.lastSensorReading.beta = this.rawOrientation.beta;
    this.lastSensorReading.gamma = this.rawOrientation.gamma;

    // Deadzone filtering
    if (Math.abs(dGamma) < this.deadzone) dGamma = 0;
    if (Math.abs(dBeta) < this.deadzone) dBeta = 0;

    // Exponential smoothing
    this.smoothedDelta.yaw += (dGamma - this.smoothedDelta.yaw) * this.smoothFactor;
    this.smoothedDelta.pitch += (dBeta - this.smoothedDelta.pitch) * this.smoothFactor;

    // Current multiplier based on hipfire vs ADS optic
    let opticFactor = 1.0;
    if (this.isAiming && this.game && this.game.weapons) {
      const activeWep = this.game.weapons.activeWeapon;
      if (activeWep) {
        if (activeWep.name === 'SNIPER') opticFactor = this.gyroOpticSens.x4;
        else if (activeWep.name === 'RIFLE') opticFactor = this.gyroOpticSens.reddot;
        else opticFactor = this.gyroOpticSens.reddot;
      }
    }

    const currentSens = this.isAiming ? (this.gyroAdsSensitivity * opticFactor) : this.gyroSensitivity;
    const invY = this.gyroInvertY ? -1 : 1;

    // Apply into lookDelta (scale factor ~ 0.0035 for natural camera feel)
    const gyroScale = 0.0038 * currentSens;
    this.lookDelta.dx += this.smoothedDelta.yaw * gyroScale;
    this.lookDelta.dy += this.smoothedDelta.pitch * gyroScale * invY;
  }

  // ----------------- Unified Look & Move Getters -----------------

  getLookDelta() {
    const delta = { dx: this.lookDelta.dx, dy: this.lookDelta.dy };
    // Reset delta after consumption
    this.lookDelta.dx = 0;
    this.lookDelta.dy = 0;
    return delta;
  }

  addLookDelta(dx, dy) {
    this.lookDelta.dx += dx;
    this.lookDelta.dy += dy;
  }

  getMoveVector() {
    return { x: this.moveVector.x, z: this.moveVector.z };
  }

  setMoveVector(x, z) {
    this.moveVector.x = x;
    this.moveVector.z = z;
  }

  // ----------------- Settings Helpers -----------------

  setGyroEnabled(enabled) {
    this.gyroEnabled = !!enabled;
    localStorage.setItem('astra_gyro_enabled', this.gyroEnabled.toString());
    if (this.gyroEnabled && !this.hasInitialReading) {
      this.initGyroscope();
    }
  }

  setGyroMode(mode) {
    this.gyroMode = mode === 'ads' ? 'ads' : 'always';
    localStorage.setItem('astra_gyro_mode', this.gyroMode);
  }

  setGyroOpticSens(optic, val) {
    if (this.gyroOpticSens[optic] !== undefined) {
      this.gyroOpticSens[optic] = Math.max(0.1, Math.min(3.0, val));
      localStorage.setItem(`astra_gyro_opt_${optic}`, this.gyroOpticSens[optic].toString());
    }
  }

  setGyroSensitivity(sens) {
    this.gyroSensitivity = Math.max(0.1, Math.min(4.0, sens));
    localStorage.setItem('astra_gyro_sens', this.gyroSensitivity.toString());
  }

  setGyroAdsSensitivity(sens) {
    this.gyroAdsSensitivity = Math.max(0.1, Math.min(3.0, sens));
    localStorage.setItem('astra_gyro_ads_sens', this.gyroAdsSensitivity.toString());
  }

  setGyroInvertY(inv) {
    this.gyroInvertY = !!inv;
    localStorage.setItem('astra_gyro_invert_y', this.gyroInvertY.toString());
  }

  getDebugStatus() {
    return {
      supported: this.gyroSupported,
      permission: this.gyroPermissionGranted,
      enabled: this.gyroEnabled,
      alpha: Math.round(this.rawOrientation.alpha),
      beta: Math.round(this.rawOrientation.beta),
      gamma: Math.round(this.rawOrientation.gamma),
      sensitivity: this.gyroSensitivity.toFixed(2),
      adsSensitivity: this.gyroAdsSensitivity.toFixed(2),
      invertY: this.gyroInvertY
    };
  }

  bindWindowEvents() {
    // Reset inputs on blur
    window.addEventListener('blur', () => {
      this.moveVector.x = 0;
      this.moveVector.z = 0;
      this.isFiring = false;
      this.isAiming = false;
      this.isSprinting = false;
      this.activeTouches.clear();
    });
  }
}
