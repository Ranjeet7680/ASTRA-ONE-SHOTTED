import * as THREE from 'three';
import { lerp } from './utilities.js';

export class LobbyScene {
  constructor(scene, materials, customization, weapons) {
    this.scene = scene;
    this.materials = materials;
    this.customization = customization;
    this.weapons = weapons;

    this.group = new THREE.Group();
    this.group.position.set(0, 0, -4);
    this.scene.add(this.group);
    this.group.visible = false;

    this.characterGroup = new THREE.Group();
    this.group.add(this.characterGroup);

    this.pedestalGroup = new THREE.Group();
    this.group.add(this.pedestalGroup);

    this.orbitAngle = 0.2;
    this.isDragging = false;
    this.lastMouseX = 0;

    this.buildPedestal();
    this.rebuildCharacter();
    this.setupOrbitControls();
  }

  buildPedestal() {
    // Hexagonal / Circular blueprint pedestal
    const daisGeom = new THREE.CylinderGeometry(1.8, 2.1, 0.4, 12);
    const dais = this.materials.createOutlinedMesh(
      daisGeom,
      this.materials.accentBlockMaterial,
      this.materials.blueInkLineMaterial
    );
    dais.group.position.set(0, -0.2, 0);
    this.pedestalGroup.add(dais.group);

    // Subtle glowing concentric ring on floor
    const ringGeom = new THREE.RingGeometry(1.2, 1.4, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x162a68, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.set(0, 0.01, 0);
    this.pedestalGroup.add(ring);
  }

  rebuildCharacter() {
    this.characterGroup.clear();

    const charConfig = this.customization.config.character;
    const skinHex = this.customization.getInkColorHex(charConfig.inkColor);
    const lineMat = new THREE.LineBasicMaterial({ color: skinHex, linewidth: 2 });
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xfcfbfa });

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.88, 0.35);
    const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
    torso.group.position.set(0, 1.15, 0);
    this.characterGroup.add(torso.group);
    this.torsoMesh = torso.group;

    // Armor Plates
    if (charConfig.armor === 'medium' || charConfig.armor === 'heavy') {
      const vestGeom = new THREE.BoxGeometry(0.54, 0.62, 0.4);
      const vest = this.materials.createOutlinedMesh(vestGeom, this.materials.hatchSurfaceMaterial, lineMat);
      vest.group.position.set(0, 1.25, 0);
      this.characterGroup.add(vest.group);
    }

    // 2. Head
    const headGeom = new THREE.SphereGeometry(0.24, 10, 10);
    const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
    head.group.position.set(0, 1.86, 0);
    this.characterGroup.add(head.group);
    this.headMesh = head.group;

    // Headgear
    if (charConfig.headgear === 'visor') {
      const visorGeom = new THREE.BoxGeometry(0.3, 0.1, 0.22);
      const visor = this.materials.createOutlinedMesh(visorGeom, this.materials.accentBlockMaterial, lineMat);
      visor.group.position.set(0, 1.88, 0.14);
      this.characterGroup.add(visor.group);
    } else if (charConfig.headgear === 'beret') {
      const beretGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.08, 8);
      const beret = this.materials.createOutlinedMesh(beretGeom, this.materials.accentBlockMaterial, lineMat);
      beret.group.position.set(0.06, 2.06, 0);
      beret.group.rotation.z = -0.25;
      this.characterGroup.add(beret.group);
    }

    // 3. Legs
    const legGeom = new THREE.BoxGeometry(0.14, 0.85, 0.14);
    const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    lLeg.group.position.set(-0.16, 0.45, 0);
    this.characterGroup.add(lLeg.group);

    const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    rLeg.group.position.set(0.16, 0.45, 0);
    this.characterGroup.add(rLeg.group);

    // 4. Arms & Equipped Weapon
    const armGeom = new THREE.BoxGeometry(0.12, 0.75, 0.12);
    const lArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    lArm.group.position.set(-0.35, 1.25, 0.12);
    lArm.group.rotation.set(0.4, 0.2, 0.2);
    this.characterGroup.add(lArm.group);

    const rArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    rArm.group.position.set(0.35, 1.25, 0.12);
    rArm.group.rotation.set(0.6, -0.3, -0.2);
    this.characterGroup.add(rArm.group);

    // Clone active weapon mesh in hands
    const activeWep = this.weapons.weapons[2] || this.weapons.weapons[0]; // Rifle by default
    const wepClone = activeWep.mesh.group.clone();
    wepClone.position.set(0.15, 1.15, 0.4);
    wepClone.rotation.set(-0.3, 0.8, -0.2);
    wepClone.scale.set(1.4, 1.4, 1.4);
    this.characterGroup.add(wepClone);
  }

  setupOrbitControls() {
    window.addEventListener('mousedown', (e) => {
      if (!this.group.visible) return;
      if (e.target.closest('.pubg-lobby-overlay') && !e.target.closest('#lobby-char-touch-area')) return;
      this.isDragging = true;
      this.lastMouseX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.group.visible) return;
      const dx = e.clientX - this.lastMouseX;
      this.lastMouseX = e.clientX;
      this.orbitAngle += dx * 0.012;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch support for orbiting
    window.addEventListener('touchstart', (e) => {
      if (!this.group.visible) return;
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || !this.group.visible) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      this.lastMouseX = e.touches[0].clientX;
      this.orbitAngle += dx * 0.012;
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  show() {
    this.group.visible = true;
    this.rebuildCharacter();
  }

  hide() {
    this.group.visible = false;
  }

  update(delta) {
    if (!this.group.visible) return;

    // Smooth rotation
    this.characterGroup.rotation.y = lerp(this.characterGroup.rotation.y, this.orbitAngle, delta * 10);

    // Subtle idle breathing & swaying
    const time = Date.now() * 0.002;
    if (this.torsoMesh) {
      this.torsoMesh.position.y = 1.15 + Math.sin(time) * 0.015;
    }
    if (this.headMesh) {
      this.headMesh.position.y = 1.86 + Math.sin(time) * 0.018;
    }
  }
}
