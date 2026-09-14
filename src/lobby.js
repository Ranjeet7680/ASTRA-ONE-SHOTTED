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

    this.squadGroup = new THREE.Group();
    this.group.add(this.squadGroup);

    this.envGroup = new THREE.Group();
    this.group.add(this.envGroup);

    // Orbit & Inertia Controls
    this.orbitAngle = 0;
    this.targetOrbitAngle = 0;
    this.orbitVelocity = 0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastInteractionTime = Date.now();

    // Mouse Tracking for Head Turn
    this.mouseNormalizedX = 0;
    this.mouseNormalizedY = 0;

    // Squadmates tracking
    this.squadMembers = [null, null, null]; // 3 additional squadmates

    // Animation states
    this.animTime = 0;
    this.inspectTimer = 0;
    this.isInspecting = false;
    this.inspectProgress = 0;

    this.buildPedestal();
    this.buildEnvironment();
    this.rebuildCharacter();
    this.setupOrbitControls();
    this.setupPointerTracking();
  }

  buildPedestal() {
    this.pedestalGroup.clear();

    // 1. Hexagonal blueprint dais
    const daisGeom = new THREE.CylinderGeometry(2.2, 2.6, 0.45, 6);
    const dais = this.materials.createOutlinedMesh(
      daisGeom,
      this.materials.accentBlockMaterial,
      this.materials.blueInkLineMaterial
    );
    dais.group.position.set(0, -0.22, 0);
    this.pedestalGroup.add(dais.group);

    // 2. Multi-tier concentric rings on floor
    const ring1Geom = new THREE.RingGeometry(1.4, 1.48, 36);
    ring1Geom.rotateX(-Math.PI / 2);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x162a68, side: THREE.DoubleSide });
    this.floorRing1 = new THREE.Mesh(ring1Geom, ring1Mat);
    this.floorRing1.position.set(0, 0.015, 0);
    this.pedestalGroup.add(this.floorRing1);

    const ring2Geom = new THREE.RingGeometry(1.8, 1.84, 36);
    ring2Geom.rotateX(-Math.PI / 2);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x3d5a99, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    this.floorRing2 = new THREE.Mesh(ring2Geom, ring2Mat);
    this.floorRing2.position.set(0, 0.016, 0);
    this.pedestalGroup.add(this.floorRing2);

    // 3. Tactical Compass Star in center
    const starShape = new THREE.Shape();
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? 0.75 : 0.3;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeom = new THREE.ShapeGeometry(starShape);
    starGeom.rotateX(-Math.PI / 2);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x1e387b, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    this.compassStar = new THREE.Mesh(starGeom, starMat);
    this.compassStar.position.set(0, 0.02, 0);
    this.pedestalGroup.add(this.compassStar);

    // 4. Side Squad Podiums (Left & Right)
    [-1.6, 1.6].forEach(posX => {
      const squadDaisGeom = new THREE.CylinderGeometry(0.8, 0.95, 0.25, 6);
      const squadDais = this.materials.createOutlinedMesh(
        squadDaisGeom,
        this.materials.hatchSurfaceMaterial,
        this.materials.blueInkLineMaterial
      );
      squadDais.group.position.set(posX, -0.12, 0.5);
      this.pedestalGroup.add(squadDais.group);

      const sRingGeom = new THREE.RingGeometry(0.5, 0.55, 24);
      sRingGeom.rotateX(-Math.PI / 2);
      const sRing = new THREE.Mesh(sRingGeom, ring2Mat);
      sRing.position.set(posX, 0.012, 0.5);
      this.pedestalGroup.add(sRing);
    });
  }

  buildEnvironment() {
    this.envGroup.clear();

    // 1. Drifting Blueprint Clouds in Background
    this.cloudGroup = new THREE.Group();
    this.envGroup.add(this.cloudGroup);
    this.clouds = [];

    const cloudMaterial = new THREE.LineBasicMaterial({ color: 0x224488, linewidth: 2 });
    for (let c = 0; c < 5; c++) {
      const singleCloud = new THREE.Group();
      const numPuffs = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < numPuffs; p++) {
        const rad = 0.5 + Math.random() * 0.45;
        const geom = new THREE.CircleGeometry(rad, 16);
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, cloudMaterial);
        line.position.set((p - numPuffs / 2) * 0.55, Math.sin(p * 1.2) * 0.15, 0);
        singleCloud.add(line);
      }
      singleCloud.position.set(
        (c - 2) * 4.5 + (Math.random() - 0.5) * 1.5,
        4.2 + (Math.random() - 0.5) * 1.2,
        -9 + Math.random() * 2
      );
      singleCloud.userData = { speed: 0.2 + Math.random() * 0.25 };
      this.cloudGroup.add(singleCloud);
      this.clouds.push(singleCloud);
    }

    // 2. Blueprint Sun with rotating rays
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(0, 5.5, -11);
    this.envGroup.add(this.sunGroup);

    const sunCoreGeom = new THREE.CircleGeometry(0.7, 24);
    const sunCoreEdges = new THREE.EdgesGeometry(sunCoreGeom);
    const sunCore = new THREE.LineSegments(sunCoreEdges, cloudMaterial);
    this.sunGroup.add(sunCore);

    // Radiating rays
    this.sunRaysGroup = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const r1 = 0.85;
      const r2 = i % 2 === 0 ? 1.45 : 1.15;
      const pts = [
        new THREE.Vector3(Math.cos(angle) * r1, Math.sin(angle) * r1, 0),
        new THREE.Vector3(Math.cos(angle) * r2, Math.sin(angle) * r2, 0)
      ];
      const rayGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const rayLine = new THREE.Line(rayGeom, cloudMaterial);
      this.sunRaysGroup.add(rayLine);
    }
    this.sunGroup.add(this.sunRaysGroup);

    // 3. Floating Blueprint Drafting Particles
    const particleCount = 45;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      this.particleSpeeds.push({
        vy: 0.15 + Math.random() * 0.35,
        vx: (Math.random() - 0.5) * 0.1,
        origY: positions[i * 3 + 1]
      });
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x1b3577,
      size: 0.055,
      transparent: true,
      opacity: 0.65
    });
    this.particlePoints = new THREE.Points(pGeom, pMat);
    this.envGroup.add(this.particlePoints);
  }

  rebuildCharacter() {
    this.characterGroup.clear();

    const charConfig = this.customization.config.character;
    const skinHex = this.customization.getInkColorHex(charConfig.inkColor);
    const lineMat = new THREE.LineBasicMaterial({ color: skinHex, linewidth: 2 });
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xfcfbfa });

    // Root Character Pivot (at feet level)
    this.characterRoot = new THREE.Group();
    this.characterGroup.add(this.characterRoot);

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.5, 0.88, 0.35);
    const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
    torso.group.position.set(0, 1.15, 0);
    this.characterRoot.add(torso.group);
    this.torsoMesh = torso.group;

    // Armor Plates
    if (charConfig.armor === 'medium' || charConfig.armor === 'heavy') {
      const vestGeom = new THREE.BoxGeometry(0.54, 0.62, 0.4);
      const vest = this.materials.createOutlinedMesh(vestGeom, this.materials.hatchSurfaceMaterial, lineMat);
      vest.group.position.set(0, 0.05, 0);
      this.torsoMesh.add(vest.group);
    }

    // 2. Head & Neck Pivot (for responsive looking)
    this.headPivot = new THREE.Group();
    this.headPivot.position.set(0, 1.86, 0);
    this.characterRoot.add(this.headPivot);

    const headGeom = new THREE.SphereGeometry(0.24, 12, 12);
    const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
    this.headPivot.add(head.group);

    // Headgear
    if (charConfig.headgear === 'visor') {
      const visorGeom = new THREE.BoxGeometry(0.32, 0.1, 0.22);
      const visor = this.materials.createOutlinedMesh(visorGeom, this.materials.accentBlockMaterial, lineMat);
      visor.group.position.set(0, 0.02, 0.14);
      this.headPivot.add(visor.group);
    } else if (charConfig.headgear === 'beret') {
      const beretGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.08, 10);
      const beret = this.materials.createOutlinedMesh(beretGeom, this.materials.accentBlockMaterial, lineMat);
      beret.group.position.set(0.06, 0.2, 0);
      beret.group.rotation.z = -0.25;
      this.headPivot.add(beret.group);
    }

    // 3. Legs
    const legGeom = new THREE.BoxGeometry(0.15, 0.85, 0.15);
    this.lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    this.lLeg.group.position.set(-0.16, 0.43, 0);
    this.lLeg.group.rotation.x = -0.04;
    this.characterRoot.add(this.lLeg.group);

    this.rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    this.rLeg.group.position.set(0.16, 0.43, 0.05);
    this.rLeg.group.rotation.x = 0.06;
    this.characterRoot.add(this.rLeg.group);

    // 4. Arms & Tactical Ready Stance
    this.armsGroup = new THREE.Group();
    this.torsoMesh.add(this.armsGroup);

    const armGeom = new THREE.BoxGeometry(0.12, 0.72, 0.12);

    // Left Arm (forward support holding rifle handguard)
    this.lArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    this.lArm.group.position.set(-0.28, 0.12, 0.14);
    this.lArm.group.rotation.set(0.85, 0.55, -0.42);
    this.armsGroup.add(this.lArm.group);

    // Right Arm (grip & trigger hand)
    this.rArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    this.rArm.group.position.set(0.28, 0.12, 0.08);
    this.rArm.group.rotation.set(0.72, -0.42, 0.25);
    this.armsGroup.add(this.rArm.group);

    // 5. Equipped Weapon (Properly mounted across chest in low-ready pose)
    this.wepHolder = new THREE.Group();
    this.wepHolder.position.set(0.04, 0.02, 0.32);
    this.wepHolder.rotation.set(-0.22, 0.32, -0.15);
    this.armsGroup.add(this.wepHolder);

    const activeWep = this.weapons.weapons[2] || this.weapons.weapons[0]; // Tactical Rifle by default
    if (activeWep && activeWep.mesh && activeWep.mesh.group) {
      const wepClone = activeWep.mesh.group.clone();
      wepClone.scale.set(1.2, 1.2, 1.2);
      this.wepHolder.add(wepClone);
    }
  }

  // Update squad member visual models on dais
  updateSquadTeammates(squadData) {
    this.squadGroup.clear();
    const positions = [
      { x: -1.6, z: 0.5, rotY: 0.3 },
      { x: 1.6, z: 0.5, rotY: -0.3 }
    ];

    squadData.forEach((member, i) => {
      if (!member || i >= 2) return;
      const pos = positions[i];
      const botGroup = new THREE.Group();
      botGroup.position.set(pos.x, 0, pos.z);
      botGroup.rotation.y = pos.rotY;

      const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf4f3ee });
      const lineMat = new THREE.LineBasicMaterial({ color: 0x224488, linewidth: 2 });

      // Torso
      const torsoGeom = new THREE.BoxGeometry(0.44, 0.8, 0.3);
      const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
      torso.group.position.set(0, 1.05, 0);
      botGroup.add(torso.group);

      // Head
      const headGeom = new THREE.SphereGeometry(0.2, 10, 10);
      const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
      head.group.position.set(0, 1.65, 0);
      botGroup.add(head.group);

      // Legs
      const legGeom = new THREE.BoxGeometry(0.12, 0.75, 0.12);
      const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
      lLeg.group.position.set(-0.14, 0.38, 0);
      botGroup.add(lLeg.group);

      const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
      rLeg.group.position.set(0.14, 0.38, 0);
      botGroup.add(rLeg.group);

      this.squadGroup.add(botGroup);
    });
  }

  setupOrbitControls() {
    const onStart = (clientX) => {
      if (!this.group.visible) return;
      this.isDragging = true;
      this.lastMouseX = clientX;
      this.lastInteractionTime = Date.now();
    };

    const onMove = (clientX) => {
      if (!this.isDragging || !this.group.visible) return;
      const dx = clientX - this.lastMouseX;
      this.lastMouseX = clientX;
      this.orbitVelocity = dx * 0.008;
      this.targetOrbitAngle += this.orbitVelocity;
      this.lastInteractionTime = Date.now();
    };

    const onEnd = () => {
      this.isDragging = false;
    };

    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#lobby-char-touch-area') || (!e.target.closest('.pubg-lobby-overlay') && !e.target.closest('.modal-backdrop'))) {
        onStart(e.clientX);
      }
    });

    window.addEventListener('mousemove', (e) => {
      onMove(e.clientX);
    });

    window.addEventListener('mouseup', onEnd);

    // Touch events
    window.addEventListener('touchstart', (e) => {
      if (e.target.closest('#lobby-char-touch-area') || (!e.target.closest('.pubg-lobby-overlay') && !e.target.closest('.modal-backdrop'))) {
        if (e.touches.length === 1) {
          onStart(e.touches[0].clientX);
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX);
      }
    }, { passive: true });

    window.addEventListener('touchend', onEnd);

    // Double tap/click to inspect weapon
    window.addEventListener('dblclick', () => {
      if (this.group.visible && !this.isInspecting) {
        this.triggerWeaponInspect();
      }
    });
  }

  setupPointerTracking() {
    window.addEventListener('mousemove', (e) => {
      if (!this.group.visible) return;
      this.mouseNormalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNormalizedY = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  triggerWeaponInspect() {
    this.isInspecting = true;
    this.inspectProgress = 0;
  }

  show() {
    this.group.visible = true;
    this.orbitAngle = 0;
    this.targetOrbitAngle = 0;
    this.orbitVelocity = 0;
    this.rebuildCharacter();

    // Hide first-person weapon camera container so no floating gun in lobby!
    if (this.weapons && this.weapons.weaponContainer) {
      this.weapons.weaponContainer.visible = false;
    }
  }

  hide() {
    this.group.visible = false;
    // Restore first-person weapon visibility
    if (this.weapons && this.weapons.weaponContainer) {
      this.weapons.weaponContainer.visible = true;
    }
  }

  update(delta) {
    if (!this.group.visible) return;

    this.animTime += delta;

    // 1. Turntable Orbit & Damped Inertia
    if (!this.isDragging) {
      this.orbitVelocity *= 0.92;
      this.targetOrbitAngle += this.orbitVelocity;

      // Slow gentle auto-rotation after 4s idle
      const idleTime = (Date.now() - this.lastInteractionTime) / 1000;
      if (idleTime > 4.0) {
        this.targetOrbitAngle += delta * 0.18;
      }
    }

    this.orbitAngle = lerp(this.orbitAngle, this.targetOrbitAngle, delta * 8);
    this.characterGroup.rotation.y = this.orbitAngle;

    // 2. Head Tracking towards pointer
    if (this.headPivot) {
      const targetHeadYaw = lerp(this.headPivot.rotation.y, this.mouseNormalizedX * 0.45, delta * 5);
      const targetHeadPitch = lerp(this.headPivot.rotation.x, -this.mouseNormalizedY * 0.25, delta * 5);
      this.headPivot.rotation.y = targetHeadYaw;
      this.headPivot.rotation.x = targetHeadPitch;
    }

    // 3. Realistic Idle Breathing & Torso Sway
    const breathe = Math.sin(this.animTime * 2.2);
    if (this.torsoMesh) {
      this.torsoMesh.position.y = 1.15 + breathe * 0.015;
      this.torsoMesh.rotation.z = Math.sin(this.animTime * 1.1) * 0.012; // subtle weight shift
    }

    // 4. Arms Breathing & Weapon Hold Micro-bob
    if (this.armsGroup) {
      this.armsGroup.position.y = breathe * 0.012;
      this.armsGroup.rotation.x = breathe * 0.02;
    }

    // 5. Periodic Weapon Inspect Animation
    this.inspectTimer += delta;
    if (this.inspectTimer > 14.0 && !this.isInspecting) {
      this.inspectTimer = 0;
      this.triggerWeaponInspect();
    }

    if (this.isInspecting && this.wepHolder) {
      this.inspectProgress += delta * 0.8; // ~2.5s duration
      if (this.inspectProgress >= Math.PI) {
        this.isInspecting = false;
        this.inspectProgress = 0;
        this.wepHolder.rotation.set(-0.22, 0.32, -0.15);
        this.wepHolder.position.set(0.04, 0.02, 0.32);
      } else {
        const inspectWeight = Math.sin(this.inspectProgress);
        this.wepHolder.position.y = 0.02 + inspectWeight * 0.12;
        this.wepHolder.position.z = 0.32 + inspectWeight * 0.08;
        this.wepHolder.rotation.z = -0.15 + inspectWeight * 0.45;
        this.wepHolder.rotation.y = 0.32 + inspectWeight * 0.55;
      }
    }

    // 6. Pedestal Concentric Rings Pulsing
    if (this.floorRing1) {
      const pulse1 = 1.0 + Math.sin(this.animTime * 2.0) * 0.04;
      this.floorRing1.scale.set(pulse1, pulse1, pulse1);
    }
    if (this.compassStar) {
      this.compassStar.rotation.y = this.animTime * 0.08;
    }

    // 7. Drifting Clouds
    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > 12) {
          cloud.position.x = -12;
        }
      });
    }

    // 8. Rotating Sun Rays
    if (this.sunRaysGroup) {
      this.sunRaysGroup.rotation.z = this.animTime * 0.04;
    }

    // 9. Floating Drafting Particles Upward Drift
    if (this.particlePoints && this.particleSpeeds) {
      const posAttr = this.particlePoints.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < this.particleSpeeds.length; i++) {
        const spd = this.particleSpeeds[i];
        arr[i * 3 + 1] += spd.vy * delta;
        arr[i * 3] += spd.vx * delta;
        if (arr[i * 3 + 1] > 4.5) {
          arr[i * 3 + 1] = 0.1;
          arr[i * 3] = (Math.random() - 0.5) * 8;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
