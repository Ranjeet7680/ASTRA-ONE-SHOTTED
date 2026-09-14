import * as THREE from 'three';

export class CustomizationManager {
  constructor(materials, weaponSystem) {
    this.materials = materials;
    this.weaponSystem = weaponSystem;

    // Default configuration
    this.config = {
      character: {
        inkColor: 'blue',
        headgear: 'visor',
        armor: 'medium'
      },
      weapons: {
        0: { optic: 'iron', muzzle: 'default', grip: 'none', mag: 'standard', skin: 'blue' },
        1: { optic: 'iron', muzzle: 'default', grip: 'vertical', mag: 'standard', skin: 'blue' },
        2: { optic: 'reddot', muzzle: 'compensator', grip: 'angled', mag: 'standard', skin: 'blue' },
        3: { optic: 'scope4x', muzzle: 'default', grip: 'none', mag: 'standard', skin: 'blue' }
      }
    };

    this.loadSavedConfig();
    this.setupPreviewScenes();
    this.applyCustomizationsToWeapons();
  }

  loadSavedConfig() {
    try {
      const saved = localStorage.getItem('astra_customization_v1');
      if (saved) {
        this.config = Object.assign(this.config, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load saved customization', e);
    }
  }

  saveConfig() {
    try {
      localStorage.setItem('astra_customization_v1', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save customization', e);
    }
    this.applyCustomizationsToWeapons();
  }

  // Setup separate mini 3D scenes for Gunsmith and Character preview
  setupPreviewScenes() {
    // 1. Weapon Preview Scene
    this.wepScene = new THREE.Scene();
    this.wepCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    this.wepCamera.position.set(0, 0.15, 1.1);

    const wepAmbient = new THREE.AmbientLight(0xfaf8f2, 0.9);
    this.wepScene.add(wepAmbient);
    const wepDir = new THREE.DirectionalLight(0xffeedd, 0.6);
    wepDir.position.set(2, 4, 3);
    this.wepScene.add(wepDir);

    this.previewWeaponGroup = new THREE.Group();
    this.wepScene.add(this.previewWeaponGroup);

    // 2. Character Preview Scene
    this.charScene = new THREE.Scene();
    this.charCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    this.charCamera.position.set(0, 1.2, 3.2);

    const charAmbient = new THREE.AmbientLight(0xfaf8f2, 0.9);
    this.charScene.add(charAmbient);
    const charDir = new THREE.DirectionalLight(0xffeedd, 0.6);
    charDir.position.set(2, 4, 3);
    this.charScene.add(charDir);

    this.previewCharacterGroup = new THREE.Group();
    this.charScene.add(this.previewCharacterGroup);
  }

  // Render Gunsmith 3D preview into a canvas
  renderWeaponPreview(canvas, weaponIndex) {
    if (!this.wepRenderer) {
      this.wepRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.wepRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
      this.wepRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    // Rebuild preview mesh
    this.previewWeaponGroup.clear();
    const wep = this.weaponSystem.weapons[weaponIndex];
    const cloneMesh = wep.mesh.group.clone();
    cloneMesh.position.set(0, -0.05, 0);
    cloneMesh.rotation.set(0.1, 0.6, 0);
    this.previewWeaponGroup.add(cloneMesh);

    this.wepRenderer.render(this.wepScene, this.wepCamera);
  }

  // Render Character 3D preview into a canvas
  renderCharacterPreview(canvas) {
    if (!this.charRenderer) {
      this.charRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      this.charRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
      this.charRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    this.previewCharacterGroup.clear();
    const charMesh = this.buildCharacterPreviewMesh();
    this.previewCharacterGroup.add(charMesh);

    this.charRenderer.render(this.charScene, this.charCamera);
  }

  buildCharacterPreviewMesh() {
    const group = new THREE.Group();
    const skinColor = this.getInkColorHex(this.config.character.inkColor);

    const lineMat = new THREE.LineBasicMaterial({ color: skinColor, linewidth: 2 });
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xfcfbfa });

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.9, 0.35);
    const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
    torso.group.position.set(0, 1.15, 0);
    group.add(torso.group);

    // Armor Plates
    if (this.config.character.armor === 'medium' || this.config.character.armor === 'heavy') {
      const vestGeom = new THREE.BoxGeometry(0.54, 0.6, 0.38);
      const vest = this.materials.createOutlinedMesh(vestGeom, this.materials.hatchSurfaceMaterial, lineMat);
      vest.group.position.set(0, 1.25, 0);
      group.add(vest.group);
    }

    // Head
    const headGeom = new THREE.SphereGeometry(0.24, 10, 10);
    const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
    head.group.position.set(0, 1.85, 0);
    group.add(head.group);

    // Headgear
    if (this.config.character.headgear === 'visor') {
      const visorGeom = new THREE.BoxGeometry(0.3, 0.1, 0.22);
      const visor = this.materials.createOutlinedMesh(visorGeom, this.materials.accentBlockMaterial, lineMat);
      visor.group.position.set(0, 1.88, 0.14);
      group.add(visor.group);
    } else if (this.config.character.headgear === 'beret') {
      const beretGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.08, 8);
      const beret = this.materials.createOutlinedMesh(beretGeom, this.materials.accentBlockMaterial, lineMat);
      beret.group.position.set(0.06, 2.06, 0);
      beret.group.rotation.z = -0.25;
      group.add(beret.group);
    }

    // Limbs
    const legGeom = new THREE.BoxGeometry(0.14, 0.85, 0.14);
    const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    lLeg.group.position.set(-0.16, 0.45, 0);
    group.add(lLeg.group);

    const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    rLeg.group.position.set(0.16, 0.45, 0);
    group.add(rLeg.group);

    // Turn mannequin slightly
    group.rotation.y = 0.35;
    return group;
  }

  getInkColorHex(colorName) {
    switch (colorName) {
      case 'crimson': return 0xc9182b;
      case 'carbon': return 0x222222;
      case 'purple': return 0x5b2c8c;
      case 'sepia': return 0x7c4f24;
      default: return 0x162a68; // classic blue
    }
  }

  // Apply attachment stat multipliers to in-game weapons
  applyCustomizationsToWeapons() {
    for (const [wepIdStr, att] of Object.entries(this.config.weapons)) {
      const wepId = parseInt(wepIdStr);
      const wep = this.weaponSystem.weapons[wepId];
      if (!wep) continue;

      // Base stats reset
      const baseStats = {
        0: { mag: 12, recoilKick: 0.08, spread: 0.008, fireRate: 0.18 },
        1: { mag: 6, recoilKick: 0.16, spread: 0.055, fireRate: 0.75 },
        2: { mag: 30, recoilKick: 0.06, spread: 0.015, fireRate: 0.095 },
        3: { mag: 5, recoilKick: 0.22, spread: 0.001, fireRate: 1.25 }
      }[wepId];

      let kick = baseStats.recoilKick;
      let spread = baseStats.spread;
      let mag = baseStats.mag;

      // Muzzle modifiers
      if (att.muzzle === 'compensator') {
        kick *= 0.72; // -28% recoil
      } else if (att.muzzle === 'suppressor') {
        kick *= 0.85;
      }

      // Grip modifiers
      if (att.grip === 'vertical') {
        spread *= 0.7; // +30% accuracy
      } else if (att.grip === 'laser') {
        spread *= 0.6; // hipfire laser accuracy
      }

      // Extended mag modifier
      if (att.mag === 'extended') {
        mag = Math.round(mag * 1.5);
      }

      wep.recoilKick = kick;
      wep.spread = spread;
      wep.magSize = mag;
      wep.currentAmmo = Math.min(wep.currentAmmo, wep.magSize);
    }
  }
}
