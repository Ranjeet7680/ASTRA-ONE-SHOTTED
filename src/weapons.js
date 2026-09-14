import * as THREE from 'three';
import { lerp, clamp } from './utilities.js';

export class WeaponSystem {
  constructor(camera, materials, soundEngine, effects) {
    this.camera = camera;
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;

    // Weapon holder attached to the camera
    this.weaponHolder = new THREE.Group();
    this.camera.add(this.weaponHolder);

    // Default hip-fire position & ADS position
    this.hipPosition = new THREE.Vector3(0.24, -0.22, -0.46);
    this.adsPosition = new THREE.Vector3(0.0, -0.16, -0.38);
    this.currentRestPos = this.hipPosition.clone();

    this.weaponHolder.position.copy(this.hipPosition);
    this.weaponHolder.rotation.set(0, 0, 0);

    // Recoil state
    this.recoilPos = new THREE.Vector3();
    this.recoilRot = new THREE.Vector3();

    // Reload state
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 1.2;

    // Aim down sights (ADS)
    this.isAiming = false;
    this.adsAlpha = 0;

    // Weapon Definitions
    this.weapons = [
      {
        id: 0,
        name: 'PISTOL',
        type: 'semi',
        desc: 'Semi-auto, 12 rounds. Accurate blueprint sidearm.',
        magSize: 12,
        currentAmmo: 12,
        reserveAmmo: 60,
        maxReserve: 120,
        damage: 38,
        headshotMult: 2.8,
        fireRate: 0.18, // delay between shots
        pellets: 1,
        spread: 0.008,
        recoilKick: 0.08,
        recoilPitch: 0.14,
        recoilTrauma: 0.18,
        reloadTime: 1.2,
        mesh: this.createPistolMesh(),
        muzzleOffset: new THREE.Vector3(0, 0.05, -0.4)
      },
      {
        id: 1,
        name: 'SHOTGUN',
        type: 'semi',
        desc: 'Pump-action, 6 shells. 8 pellets with heavy close-range burst.',
        magSize: 6,
        currentAmmo: 6,
        reserveAmmo: 36,
        maxReserve: 72,
        damage: 18, // per pellet * 8 = 144 max
        headshotMult: 2.0,
        fireRate: 0.75,
        pellets: 8,
        spread: 0.055,
        recoilKick: 0.16,
        recoilPitch: 0.28,
        recoilTrauma: 0.45,
        reloadTime: 1.8,
        mesh: this.createShotgunMesh(),
        muzzleOffset: new THREE.Vector3(0, 0.04, -0.65)
      },
      {
        id: 2,
        name: 'RIFLE',
        type: 'auto',
        desc: 'Full-auto, 30 rounds. High cadence architectural carbine.',
        magSize: 30,
        currentAmmo: 30,
        reserveAmmo: 150,
        maxReserve: 300,
        damage: 24,
        headshotMult: 2.5,
        fireRate: 0.095,
        pellets: 1,
        spread: 0.015,
        recoilKick: 0.06,
        recoilPitch: 0.09,
        recoilTrauma: 0.14,
        reloadTime: 1.5,
        mesh: this.createRifleMesh(),
        muzzleOffset: new THREE.Vector3(0, 0.06, -0.68)
      },
      {
        id: 3,
        name: 'SNIPER',
        type: 'bolt',
        desc: 'Bolt-action, 5 rounds. High-zoom optic. Extreme headshot power.',
        magSize: 5,
        currentAmmo: 5,
        reserveAmmo: 25,
        maxReserve: 50,
        damage: 130,
        headshotMult: 3.2, // 416 headshot -> instant kill
        fireRate: 1.25,
        pellets: 1,
        spread: 0.001,
        recoilKick: 0.22,
        recoilPitch: 0.35,
        recoilTrauma: 0.6,
        reloadTime: 2.2,
        mesh: this.createSniperMesh(),
        muzzleOffset: new THREE.Vector3(0, 0.06, -0.85)
      }
    ];

    this.currentWeaponIndex = 0;
    this.lastFireTime = 0;

    // Attach weapon meshes to weapon holder
    this.weapons.forEach((w, idx) => {
      this.weaponHolder.add(w.mesh.group);
      w.mesh.group.visible = idx === 0;
    });

    // Muzzle Flash Sprite
    const flashGeom = new THREE.PlaneGeometry(0.28, 0.28);
    const flashMat = new THREE.MeshBasicMaterial({
      map: this.materials.muzzleFlashTexture,
      transparent: true,
      depthWrite: false,
      visible: false
    });
    this.muzzleFlash = new THREE.Mesh(flashGeom, flashMat);
    this.weaponHolder.add(this.muzzleFlash);
    this.muzzleFlashTimer = 0;
  }

  get activeWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  // 1. Procedural 3D Blueprint Pistol Mesh
  createPistolMesh() {
    const group = new THREE.Group();

    // Slide
    const slideGeom = new THREE.BoxGeometry(0.06, 0.07, 0.28);
    const slide = this.materials.createOutlinedMesh(slideGeom, this.materials.weaponPaperMaterial);
    slide.group.position.set(0, 0.03, -0.12);
    group.add(slide.group);

    // Frame & Grip (cross-hatched)
    const gripGeom = new THREE.BoxGeometry(0.052, 0.14, 0.09);
    const grip = this.materials.createOutlinedMesh(gripGeom, this.materials.weaponHatchMaterial);
    grip.group.position.set(0, -0.06, -0.04);
    grip.group.rotation.x = 0.22;
    group.add(grip.group);

    // Barrel tip
    const barrelGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = this.materials.createOutlinedMesh(barrelGeom, this.materials.weaponPaperMaterial);
    barrel.group.position.set(0, 0.045, -0.27);
    group.add(barrel.group);

    // Trigger Guard
    const guardGeom = new THREE.BoxGeometry(0.02, 0.06, 0.08);
    const guard = this.materials.createOutlinedMesh(guardGeom, this.materials.weaponPaperMaterial);
    guard.group.position.set(0, -0.025, -0.1);
    group.add(guard.group);

    return { group };
  }

  // 2. Procedural 3D Blueprint Shotgun Mesh
  createShotgunMesh() {
    const group = new THREE.Group();

    // Dual Barrels
    const barrelGeom = new THREE.BoxGeometry(0.08, 0.06, 0.55);
    const barrels = this.materials.createOutlinedMesh(barrelGeom, this.materials.weaponPaperMaterial);
    barrels.group.position.set(0, 0.02, -0.32);
    group.add(barrels.group);

    // Pump Slide (Hatched)
    const pumpGeom = new THREE.BoxGeometry(0.088, 0.075, 0.16);
    const pump = this.materials.createOutlinedMesh(pumpGeom, this.materials.weaponHatchMaterial);
    pump.group.position.set(0, -0.01, -0.34);
    group.add(pump.group);

    // Receiver
    const recGeom = new THREE.BoxGeometry(0.076, 0.1, 0.22);
    const rec = this.materials.createOutlinedMesh(recGeom, this.materials.weaponPaperMaterial);
    rec.group.position.set(0, -0.01, -0.06);
    group.add(rec.group);

    // Stock (Hatched)
    const stockGeom = new THREE.BoxGeometry(0.06, 0.12, 0.26);
    const stock = this.materials.createOutlinedMesh(stockGeom, this.materials.weaponHatchMaterial);
    stock.group.position.set(0, -0.07, 0.15);
    stock.group.rotation.x = -0.12;
    group.add(stock.group);

    return { group };
  }

  // 3. Procedural 3D Blueprint Rifle Mesh
  createRifleMesh() {
    const group = new THREE.Group();

    // Receiver & Upper
    const recGeom = new THREE.BoxGeometry(0.07, 0.09, 0.36);
    const rec = this.materials.createOutlinedMesh(recGeom, this.materials.weaponPaperMaterial);
    rec.group.position.set(0, 0.02, -0.14);
    group.add(rec.group);

    // Long Shroud / Handguard (Hatched)
    const handGeom = new THREE.BoxGeometry(0.072, 0.08, 0.26);
    const hand = this.materials.createOutlinedMesh(handGeom, this.materials.weaponHatchMaterial);
    hand.group.position.set(0, 0.02, -0.42);
    group.add(hand.group);

    // Thin Barrel & Flash Hider
    const barrelGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8);
    barrelGeom.rotateX(Math.PI / 2);
    const barrel = this.materials.createOutlinedMesh(barrelGeom, this.materials.weaponPaperMaterial);
    barrel.group.position.set(0, 0.025, -0.6);
    group.add(barrel.group);

    // Curved Banana Magazine
    const magGeom = new THREE.BoxGeometry(0.046, 0.2, 0.08);
    const mag = this.materials.createOutlinedMesh(magGeom, this.materials.weaponHatchMaterial);
    mag.group.position.set(0, -0.12, -0.16);
    mag.group.rotation.x = 0.25;
    group.add(mag.group);

    // Tactical Stock
    const stockGeom = new THREE.BoxGeometry(0.05, 0.11, 0.24);
    const stock = this.materials.createOutlinedMesh(stockGeom, this.materials.weaponPaperMaterial);
    stock.group.position.set(0, -0.03, 0.14);
    group.add(stock.group);

    // Iron Sights / Carry Handle
    const sightGeom = new THREE.BoxGeometry(0.03, 0.04, 0.2);
    const sight = this.materials.createOutlinedMesh(sightGeom, this.materials.weaponPaperMaterial);
    sight.group.position.set(0, 0.08, -0.18);
    group.add(sight.group);

    return { group };
  }

  // 4. Procedural 3D Blueprint Sniper Mesh
  createSniperMesh() {
    const group = new THREE.Group();

    // Main Heavy Barrel & Chassis
    const barrelGeom = new THREE.BoxGeometry(0.065, 0.08, 0.72);
    const barrel = this.materials.createOutlinedMesh(barrelGeom, this.materials.weaponPaperMaterial);
    barrel.group.position.set(0, 0.01, -0.42);
    group.add(barrel.group);

    // Slotted Muzzle Brake
    const brakeGeom = new THREE.BoxGeometry(0.08, 0.07, 0.1);
    const brake = this.materials.createOutlinedMesh(brakeGeom, this.materials.weaponHatchMaterial);
    brake.group.position.set(0, 0.015, -0.8);
    group.add(brake.group);

    // Telescopic Cylindrical Optic Scope
    const scopeGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 12);
    scopeGeom.rotateX(Math.PI / 2);
    const scope = this.materials.createOutlinedMesh(scopeGeom, this.materials.weaponHatchMaterial);
    scope.group.position.set(0, 0.09, -0.22);
    group.add(scope.group);

    // Scope Mount Rings
    const ring1Geom = new THREE.BoxGeometry(0.04, 0.05, 0.03);
    const ring1 = this.materials.createOutlinedMesh(ring1Geom, this.materials.weaponPaperMaterial);
    ring1.group.position.set(0, 0.055, -0.14);
    group.add(ring1.group);

    const ring2Geom = new THREE.BoxGeometry(0.04, 0.05, 0.03);
    const ring2 = this.materials.createOutlinedMesh(ring2Geom, this.materials.weaponPaperMaterial);
    ring2.group.position.set(0, 0.055, -0.3);
    group.add(ring2.group);

    // Precision Stock
    const stockGeom = new THREE.BoxGeometry(0.05, 0.13, 0.28);
    const stock = this.materials.createOutlinedMesh(stockGeom, this.materials.weaponPaperMaterial);
    stock.group.position.set(0, -0.05, 0.12);
    group.add(stock.group);

    // Bolt Action Lever
    const boltGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 6);
    boltGeom.rotateZ(Math.PI / 2);
    const bolt = this.materials.createOutlinedMesh(boltGeom, this.materials.weaponPaperMaterial);
    bolt.group.position.set(0.05, 0.03, -0.1);
    group.add(bolt.group);

    return { group };
  }

  // Switch weapon slot (0 to 3)
  switchWeapon(index) {
    if (index < 0 || index >= this.weapons.length || index === this.currentWeaponIndex) return;
    if (this.isReloading) {
      this.cancelReload();
    }

    // Hide previous
    this.weapons[this.currentWeaponIndex].mesh.group.visible = false;
    this.currentWeaponIndex = index;

    // Show new
    const newWep = this.weapons[this.currentWeaponIndex];
    newWep.mesh.group.visible = true;

    // Reset ADS if we were zoomed in
    if (this.isAiming && index !== 3) {
      document.getElementById('sniper-scope').style.display = 'none';
    }

    // Play switch slide audio click
    this.soundEngine.playClick(this.soundEngine.ctx ? this.soundEngine.ctx.currentTime : 0, 750, 0.05, 0.4);
  }

  // Aim Down Sights (Right Mouse Button)
  setAim(aiming) {
    this.isAiming = aiming;
    const isSniper = this.currentWeaponIndex === 3;
    const scopeOverlay = document.getElementById('sniper-scope');

    if (isSniper) {
      if (scopeOverlay) {
        scopeOverlay.style.display = aiming ? 'block' : 'none';
      }
      // Hide gun mesh while scoped for clean compass scope view
      this.activeWeapon.mesh.group.visible = !aiming;
    }
  }

  // Fire Weapon
  canShoot(now) {
    if (this.isReloading) return false;
    const wep = this.activeWeapon;
    if (now - this.lastFireTime < wep.fireRate) return false;
    return true;
  }

  shoot(now) {
    const wep = this.activeWeapon;

    if (wep.currentAmmo <= 0) {
      this.soundEngine.playDryFire();
      this.reload();
      return null;
    }

    wep.currentAmmo--;
    this.lastFireTime = now;

    // Play sound based on weapon
    switch (wep.id) {
      case 0: this.soundEngine.playPistolShot(); break;
      case 1: this.soundEngine.playShotgunShot(); break;
      case 2: this.soundEngine.playRifleShot(); break;
      case 3: this.soundEngine.playSniperShot(); break;
    }

    // Apply Recoil Kick
    this.recoilPos.z += wep.recoilKick;
    this.recoilRot.x += wep.recoilPitch;
    this.effects.addTrauma(wep.recoilTrauma);

    // Trigger Muzzle Flash
    this.muzzleFlash.position.copy(wep.muzzleOffset);
    this.muzzleFlash.rotation.z = Math.random() * Math.PI * 2;
    const scale = 0.9 + Math.random() * 0.4;
    this.muzzleFlash.scale.set(scale, scale, scale);
    this.muzzleFlash.material.visible = true;
    this.muzzleFlashTimer = 0.05;

    return wep;
  }

  // Reload current weapon
  reload() {
    const wep = this.activeWeapon;
    if (this.isReloading) return;
    if (wep.currentAmmo === wep.magSize) return;
    if (wep.reserveAmmo <= 0) return;

    this.isReloading = true;
    this.reloadDuration = wep.reloadTime;
    this.reloadTimer = wep.reloadTime;
    this.soundEngine.playReload();
  }

  cancelReload() {
    this.isReloading = false;
    this.reloadTimer = 0;
  }

  // Give bonus ammo on wave clear
  addAmmo(amount = 30) {
    this.weapons.forEach(w => {
      w.reserveAmmo = Math.min(w.maxReserve, w.reserveAmmo + amount);
    });
  }

  update(delta, playerState = {}) {
    const wep = this.activeWeapon;

    // 1. Muzzle Flash timer
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlash.material.visible = false;
      }
    }

    // 2. Aim Down Sights (ADS) Interpolation
    const targetAds = this.isAiming ? 1.0 : 0.0;
    this.adsAlpha = lerp(this.adsAlpha, targetAds, delta * 14);

    if (wep.id !== 3) {
      // Pistol/Shotgun/Rifle ADS centering
      this.currentRestPos.lerpVectors(this.hipPosition, this.adsPosition, this.adsAlpha);
    } else {
      this.currentRestPos.copy(this.hipPosition);
    }

    // 3. Reload Animation
    let reloadOffsetY = 0;
    let reloadRotationZ = 0;
    if (this.isReloading) {
      this.reloadTimer -= delta;
      const progress = 1 - this.reloadTimer / this.reloadDuration;

      // Arc dip down and tilt
      reloadOffsetY = -Math.sin(progress * Math.PI) * 0.16;
      reloadRotationZ = Math.sin(progress * Math.PI) * 0.35;

      if (this.reloadTimer <= 0) {
        // Complete reload
        const needed = wep.magSize - wep.currentAmmo;
        const available = Math.min(needed, wep.reserveAmmo);
        wep.currentAmmo += available;
        wep.reserveAmmo -= available;
        this.isReloading = false;
      }
    }

    // 4. Smooth Recoil Recovery
    this.recoilPos.z = lerp(this.recoilPos.z, 0, delta * 18);
    this.recoilRot.x = lerp(this.recoilRot.x, 0, delta * 16);

    // 5. Tactical Sprint & Inspect Animations
    const isTacSprint = playerState.isTacSprinting && !this.isAiming && !this.isReloading;
    this.tacSprintAlpha = lerp(this.tacSprintAlpha || 0, isTacSprint ? 1.0 : 0.0, delta * 10);

    const sprintRotX = this.tacSprintAlpha * 0.65; // Tilt up 38 degrees
    const sprintRotZ = this.tacSprintAlpha * -0.28;
    const sprintPosY = this.tacSprintAlpha * 0.04;
    const sprintPosZ = this.tacSprintAlpha * -0.05;

    // Inspect Animation
    let inspectRotY = 0;
    let inspectRotZ = 0;
    let inspectRotX = 0;
    if (playerState.isInspecting) {
      const p = playerState.inspectProgress || 0;
      inspectRotY = Math.sin(p * Math.PI * 2) * 0.45;
      inspectRotZ = Math.sin(p * Math.PI) * 0.55;
      inspectRotX = -Math.sin(p * Math.PI) * 0.2;
    }

    // 6. Update Weapon Holder Transform
    this.weaponHolder.position.set(
      this.currentRestPos.x,
      this.currentRestPos.y + reloadOffsetY + sprintPosY,
      this.currentRestPos.z + this.recoilPos.z + sprintPosZ
    );

    this.weaponHolder.rotation.set(
      this.recoilRot.x + sprintRotX + inspectRotX,
      inspectRotY,
      reloadRotationZ + sprintRotZ + inspectRotZ
    );
  }

  // Get world position of weapon muzzle for tracer lines
  getMuzzleWorldPosition() {
    const muzzlePos = this.activeWeapon.muzzleOffset.clone();
    this.weaponHolder.localToWorld(muzzlePos);
    return muzzlePos;
  }
}
