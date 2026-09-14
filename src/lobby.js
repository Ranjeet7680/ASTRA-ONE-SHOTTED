import * as THREE from 'three';
import { lerp } from './utilities.js';

export class LobbyScene {
  constructor(scene, materials, customization, weapons, camera = null) {
    this.scene = scene;
    this.materials = materials;
    this.customization = customization;
    this.weapons = weapons;
    this.camera = camera;

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

    // Squadmates tracking (Slots 1, 2, 3)
    this.squadMembers = [null, null, null];
    this.squadModelEntries = [];

    // Animation & Emote states
    this.animTime = 0;
    this.inspectTimer = 0;
    this.isInspecting = false;
    this.inspectProgress = 0;

    this.currentEmote = null;
    this.emoteTimer = 0;

    // Active Equipped Weapon in Lobby (0: Pistol, 1: Shotgun, 2: Rifle, 3: Sniper)
    this.equippedWeaponIndex = 2;

    // Camera view presets
    this.currentCameraPreset = 'hero';
    this.cameraPresets = {
      hero: { pos: new THREE.Vector3(0, 1.25, -0.6), lookAt: new THREE.Vector3(0, 1.05, -4) },
      closeup: { pos: new THREE.Vector3(0, 1.55, -2.4), lookAt: new THREE.Vector3(0, 1.55, -4) },
      weapon: { pos: new THREE.Vector3(0.38, 1.2, -2.6), lookAt: new THREE.Vector3(0.06, 1.15, -4) }
    };
    this.targetCameraPos = this.cameraPresets.hero.pos.clone();
    this.targetCameraLook = this.cameraPresets.hero.lookAt.clone();

    // Staging lights
    this.setupStagingLights();

    this.buildPedestal();
    this.buildEnvironment();
    this.rebuildCharacter();
    this.setupOrbitControls();
    this.setupPointerTracking();
  }

  setupStagingLights() {
    this.lightsGroup = new THREE.Group();
    this.group.add(this.lightsGroup);

    // 1. Blueprint Operator Key Spotlight
    this.keySpotlight = new THREE.SpotLight(0xfffdf5, 2.2, 16, Math.PI / 4.5, 0.35, 1.2);
    this.keySpotlight.position.set(0, 4.8, 1.8);
    this.keySpotlight.target.position.set(0, 1.1, 0);
    this.lightsGroup.add(this.keySpotlight);
    this.lightsGroup.add(this.keySpotlight.target);

    // 2. Deep Blueprint Rim Light from behind
    this.rimLight = new THREE.DirectionalLight(0x2855b5, 1.4);
    this.rimLight.position.set(0, 3.0, -3.5);
    this.lightsGroup.add(this.rimLight);

    // 3. Ambient warm drafting fill
    this.ambientLight = new THREE.AmbientLight(0xf5f3ee, 0.95);
    this.lightsGroup.add(this.ambientLight);
  }

  buildPedestal() {
    this.pedestalGroup.clear();

    // 0. Expansive Military Blueprint Hangar Floor (36m x 36m)
    const hangarFloorGeom = new THREE.PlaneGeometry(36, 36);
    hangarFloorGeom.rotateX(-Math.PI / 2);
    const hangarFloorMat = new THREE.MeshBasicMaterial({ color: 0xf6f4ee, side: THREE.DoubleSide });
    const hangarFloor = new THREE.Mesh(hangarFloorGeom, hangarFloorMat);
    hangarFloor.position.set(0, -0.235, 0);
    this.pedestalGroup.add(hangarFloor);

    // Blueprint grid line mesh over hangar floor
    const gridHelper = new THREE.GridHelper(36, 36, 0x162a68, 0x3d5a99);
    gridHelper.position.set(0, -0.233, 0);
    if (gridHelper.material) {
      gridHelper.material.opacity = 0.35;
      gridHelper.material.transparent = true;
    }
    this.pedestalGroup.add(gridHelper);

    // Runway / Staging Perimeter Circle
    const outerRingGeom = new THREE.RingGeometry(6.8, 6.9, 48);
    outerRingGeom.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x162a68, side: THREE.DoubleSide });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.position.set(0, -0.23, 0);
    this.pedestalGroup.add(outerRing);

    // Staging runway approach lights (cyan/blue nodes)
    const runwayLightGeom = new THREE.CircleGeometry(0.07, 8);
    runwayLightGeom.rotateX(-Math.PI / 2);
    const runwayLightMat = new THREE.MeshBasicMaterial({ color: 0x2266dd, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const x = Math.cos(angle) * 6.85;
      const z = Math.sin(angle) * 6.85;
      const node = new THREE.Mesh(runwayLightGeom, runwayLightMat);
      node.position.set(x, -0.228, z);
      this.pedestalGroup.add(node);
    }

    // 1. Central Elevated Hexagonal Blueprint Dais
    const daisGeom = new THREE.CylinderGeometry(2.3, 2.7, 0.45, 6);
    const dais = this.materials.createOutlinedMesh(
      daisGeom,
      this.materials.accentBlockMaterial,
      this.materials.blueInkLineMaterial
    );
    dais.group.position.set(0, -0.22, 0);
    this.pedestalGroup.add(dais.group);

    // 2. Multi-tier concentric holographic projector rings on dais floor
    const ring1Geom = new THREE.RingGeometry(1.45, 1.52, 40);
    ring1Geom.rotateX(-Math.PI / 2);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x162a68, side: THREE.DoubleSide });
    this.floorRing1 = new THREE.Mesh(ring1Geom, ring1Mat);
    this.floorRing1.position.set(0, 0.015, 0);
    this.pedestalGroup.add(this.floorRing1);

    const ring2Geom = new THREE.RingGeometry(1.9, 1.95, 40);
    ring2Geom.rotateX(-Math.PI / 2);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x3d5a99, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    this.floorRing2 = new THREE.Mesh(ring2Geom, ring2Mat);
    this.floorRing2.position.set(0, 0.016, 0);
    this.pedestalGroup.add(this.floorRing2);

    // Tactical outer graduation tick ring
    const ring3Geom = new THREE.RingGeometry(2.18, 2.22, 48);
    ring3Geom.rotateX(-Math.PI / 2);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xc9182b, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    this.floorRing3 = new THREE.Mesh(ring3Geom, ring3Mat);
    this.floorRing3.position.set(0, 0.017, 0);
    this.pedestalGroup.add(this.floorRing3);

    // 3. Central Tactical Compass Star & Target Reticle
    const starShape = new THREE.Shape();
    const points = 8;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? 0.75 : 0.28;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeom = new THREE.ShapeGeometry(starShape);
    starGeom.rotateX(-Math.PI / 2);
    const starMat = new THREE.MeshBasicMaterial({ color: 0x1e387b, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
    this.compassStar = new THREE.Mesh(starGeom, starMat);
    this.compassStar.position.set(0, 0.02, 0);
    this.pedestalGroup.add(this.compassStar);

    // 4. Sweeping Radar Beam Line
    const radarLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.022, 0),
      new THREE.Vector3(0, 0.022, 1.88)
    ]);
    const radarLineMat = new THREE.LineBasicMaterial({ color: 0xc9182b, linewidth: 2 });
    this.radarBeam = new THREE.Line(radarLineGeom, radarLineMat);
    this.pedestalGroup.add(this.radarBeam);

    // 5. Side Squad Podiums (Left, Right, Rear)
    const squadPositions = [
      { x: -1.75, z: 0.4, scale: 0.8 },
      { x: 1.75, z: 0.4, scale: 0.8 },
      { x: 0.0, z: 1.35, scale: 0.75 }
    ];

    squadPositions.forEach(pos => {
      const squadDaisGeom = new THREE.CylinderGeometry(0.75 * pos.scale, 0.9 * pos.scale, 0.22, 6);
      const squadDais = this.materials.createOutlinedMesh(
        squadDaisGeom,
        this.materials.hatchSurfaceMaterial,
        this.materials.blueInkLineMaterial
      );
      squadDais.group.position.set(pos.x, -0.13, pos.z);
      this.pedestalGroup.add(squadDais.group);

      const sRingGeom = new THREE.RingGeometry(0.48 * pos.scale, 0.53 * pos.scale, 24);
      sRingGeom.rotateX(-Math.PI / 2);
      const sRing = new THREE.Mesh(sRingGeom, ring2Mat);
      sRing.position.set(pos.x, 0.012, pos.z);
      this.pedestalGroup.add(sRing);
    });

    // 6. Tactical Pelican Ammo Trunk & Supply Crates
    this.buildTacticalProps();
  }

  buildTacticalProps() {
    // Military Pelican Crate on left flank
    const crateMat = new THREE.MeshLambertMaterial({ color: 0xf2eee2 });
    const crateLineMat = new THREE.LineBasicMaterial({ color: 0x162a68, linewidth: 2 });

    const crateGeom = new THREE.BoxGeometry(0.7, 0.38, 0.48);
    const crate = this.materials.createOutlinedMesh(crateGeom, crateMat, crateLineMat);
    crate.group.position.set(-2.8, -0.04, 0.2);
    crate.group.rotation.y = 0.22;
    this.pedestalGroup.add(crate.group);

    // Stacked Ammo Case on right flank
    const ammoGeom = new THREE.BoxGeometry(0.5, 0.3, 0.34);
    const ammoCase1 = this.materials.createOutlinedMesh(ammoGeom, crateMat, crateLineMat);
    ammoCase1.group.position.set(2.8, -0.08, 0.1);
    ammoCase1.group.rotation.y = -0.35;
    this.pedestalGroup.add(ammoCase1.group);

    const ammoCase2 = this.materials.createOutlinedMesh(ammoGeom, crateMat, crateLineMat);
    ammoCase2.group.position.set(2.75, 0.22, 0.12);
    ammoCase2.group.rotation.y = -0.28;
    this.pedestalGroup.add(ammoCase2.group);
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
        (c - 2) * 5.0 + (Math.random() - 0.5) * 1.5,
        4.4 + (Math.random() - 0.5) * 1.2,
        -9.5 + Math.random() * 2
      );
      singleCloud.userData = { speed: 0.18 + Math.random() * 0.2 };
      this.cloudGroup.add(singleCloud);
      this.clouds.push(singleCloud);
    }

    // 2. Blueprint Sun with rotating rays
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(0, 5.8, -12);
    this.envGroup.add(this.sunGroup);

    const sunCoreGeom = new THREE.CircleGeometry(0.75, 24);
    const sunCoreEdges = new THREE.EdgesGeometry(sunCoreGeom);
    const sunCore = new THREE.LineSegments(sunCoreEdges, cloudMaterial);
    this.sunGroup.add(sunCore);

    this.sunRaysGroup = new THREE.Group();
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const r1 = 0.88;
      const r2 = i % 2 === 0 ? 1.5 : 1.2;
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
    const particleCount = 50;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = Math.random() * 5.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      this.particleSpeeds.push({
        vy: 0.14 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.08,
        origY: positions[i * 3 + 1]
      });
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x1b3577,
      size: 0.055,
      transparent: true,
      opacity: 0.7
    });
    this.particlePoints = new THREE.Points(pGeom, pMat);
    this.envGroup.add(this.particlePoints);
  }

  setEquippedWeapon(index) {
    this.equippedWeaponIndex = Math.max(0, Math.min(3, index));
    this.rebuildCharacter();
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

    // Left Arm (forward support holding handguard)
    this.lArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    this.armsGroup.add(this.lArm.group);

    // Right Arm (grip & trigger hand)
    this.rArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    this.armsGroup.add(this.rArm.group);

    // 5. Equipped Weapon
    this.wepHolder = new THREE.Group();
    this.armsGroup.add(this.wepHolder);

    const wepIdx = this.equippedWeaponIndex;
    const activeWep = this.weapons.weapons[wepIdx] || this.weapons.weapons[2];

    if (wepIdx === 0) {
      // PISTOL POSE
      this.lArm.group.position.set(-0.2, 0.12, 0.18);
      this.lArm.group.rotation.set(1.0, 0.35, -0.2);
      this.rArm.group.position.set(0.2, 0.12, 0.16);
      this.rArm.group.rotation.set(1.05, -0.22, 0.12);

      this.wepHolder.position.set(0.04, 0.04, 0.36);
      this.wepHolder.rotation.set(-0.15, 0.25, -0.08);
      if (activeWep && activeWep.mesh && activeWep.mesh.group) {
        const wepClone = activeWep.mesh.group.clone();
        wepClone.scale.set(1.3, 1.3, 1.3);
        this.wepHolder.add(wepClone);
      }
    } else if (wepIdx === 3) {
      // SNIPER POSE
      this.lArm.group.position.set(-0.3, 0.12, 0.16);
      this.lArm.group.rotation.set(0.9, 0.6, -0.4);
      this.rArm.group.position.set(0.28, 0.12, 0.06);
      this.rArm.group.rotation.set(0.7, -0.4, 0.22);

      this.wepHolder.position.set(0.02, 0.02, 0.3);
      this.wepHolder.rotation.set(-0.24, 0.34, -0.16);
      if (activeWep && activeWep.mesh && activeWep.mesh.group) {
        const wepClone = activeWep.mesh.group.clone();
        wepClone.scale.set(1.15, 1.15, 1.15);
        this.wepHolder.add(wepClone);
      }
    } else {
      // RIFLE / SHOTGUN POSE
      this.lArm.group.position.set(-0.28, 0.12, 0.14);
      this.lArm.group.rotation.set(0.85, 0.55, -0.42);
      this.rArm.group.position.set(0.28, 0.12, 0.08);
      this.rArm.group.rotation.set(0.72, -0.42, 0.25);

      this.wepHolder.position.set(0.04, 0.02, 0.32);
      this.wepHolder.rotation.set(-0.22, 0.32, -0.15);
      if (activeWep && activeWep.mesh && activeWep.mesh.group) {
        const wepClone = activeWep.mesh.group.clone();
        wepClone.scale.set(1.2, 1.2, 1.2);
        this.wepHolder.add(wepClone);
      }
    }
  }

  // Update squad member visual models on dais (All 3 slots supported)
  updateSquadTeammates(squadData) {
    this.squadGroup.clear();
    this.squadModelEntries = [];

    const squadConfigs = [
      { x: -1.75, z: 0.4, rotY: 0.35, colorHex: 0x162a68, wepIdx: 0, headgear: 'visor' },
      { x: 1.75, z: 0.4, rotY: -0.35, colorHex: 0xc9182b, wepIdx: 3, headgear: 'beret' },
      { x: 0.0, z: 1.35, rotY: 0.0, colorHex: 0x2b499d, wepIdx: 2, headgear: 'visor' }
    ];

    squadData.forEach((member, i) => {
      if (!member || i >= 3) return;
      const cfg = squadConfigs[i];
      const botGroup = new THREE.Group();
      botGroup.position.set(cfg.x, 0, cfg.z);
      botGroup.rotation.y = cfg.rotY;

      // Spawn pop scale animation
      botGroup.scale.set(0.2, 0.2, 0.2);

      const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf4f3ee });
      const lineMat = new THREE.LineBasicMaterial({ color: cfg.colorHex, linewidth: 2 });

      // Torso
      const torsoGeom = new THREE.BoxGeometry(0.44, 0.8, 0.3);
      const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
      torso.group.position.set(0, 1.05, 0);
      botGroup.add(torso.group);

      // Head & Headgear
      const headGeom = new THREE.SphereGeometry(0.2, 10, 10);
      const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
      head.group.position.set(0, 1.65, 0);
      botGroup.add(head.group);

      if (cfg.headgear === 'visor') {
        const visorGeom = new THREE.BoxGeometry(0.26, 0.08, 0.18);
        const visor = this.materials.createOutlinedMesh(visorGeom, this.materials.accentBlockMaterial, lineMat);
        visor.group.position.set(0, 0.02, 0.12);
        head.group.add(visor.group);
      } else if (cfg.headgear === 'beret') {
        const beretGeom = new THREE.CylinderGeometry(0.22, 0.18, 0.07, 8);
        const beret = this.materials.createOutlinedMesh(beretGeom, this.materials.accentBlockMaterial, lineMat);
        beret.group.position.set(0.05, 0.16, 0);
        beret.group.rotation.z = -0.22;
        head.group.add(beret.group);
      }

      // Legs
      const legGeom = new THREE.BoxGeometry(0.12, 0.75, 0.12);
      const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
      lLeg.group.position.set(-0.14, 0.38, 0);
      botGroup.add(lLeg.group);

      const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
      rLeg.group.position.set(0.14, 0.38, 0);
      botGroup.add(rLeg.group);

      // Arms & Squad Weapon
      const armGeom = new THREE.BoxGeometry(0.1, 0.65, 0.1);
      const lArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
      lArm.group.position.set(-0.24, 1.05, 0.1);
      lArm.group.rotation.set(0.8, 0.5, -0.3);
      botGroup.add(lArm.group);

      const rArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
      rArm.group.position.set(0.24, 1.05, 0.06);
      rArm.group.rotation.set(0.7, -0.4, 0.2);
      botGroup.add(rArm.group);

      const sqdWep = this.weapons.weapons[cfg.wepIdx] || this.weapons.weapons[2];
      if (sqdWep && sqdWep.mesh && sqdWep.mesh.group) {
        const wepClone = sqdWep.mesh.group.clone();
        wepClone.scale.set(1.0, 1.0, 1.0);
        wepClone.position.set(0.03, 1.0, 0.28);
        wepClone.rotation.set(-0.2, 0.3, -0.15);
        botGroup.add(wepClone);
      }

      this.squadGroup.add(botGroup);
      this.squadModelEntries.push({
        group: botGroup,
        torso: torso.group,
        head: head.group,
        targetScale: 1.0,
        currentScale: 0.2,
        name: member
      });
    });
  }

  // Camera Presets
  setCameraPreset(presetKey) {
    if (this.cameraPresets[presetKey]) {
      this.currentCameraPreset = presetKey;
      this.targetCameraPos.copy(this.cameraPresets[presetKey].pos);
      this.targetCameraLook.copy(this.cameraPresets[presetKey].lookAt);
    }
  }

  // Emotes Execution
  playEmote(emoteName) {
    this.currentEmote = emoteName;
    this.emoteTimer = 0;
    if (emoteName === 'inspect') {
      this.triggerWeaponInspect();
    }
  }

  triggerWeaponInspect() {
    this.isInspecting = true;
    this.inspectProgress = 0;
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
        this.playEmote('inspect');
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

  show() {
    this.group.visible = true;
    this.orbitAngle = 0;
    this.targetOrbitAngle = 0;
    this.orbitVelocity = 0;
    this.currentCameraPreset = 'hero';
    this.targetCameraPos.copy(this.cameraPresets.hero.pos);
    this.targetCameraLook.copy(this.cameraPresets.hero.lookAt);
    this.rebuildCharacter();

    if (this.weapons) {
      if (this.weapons.weaponHolder) this.weapons.weaponHolder.visible = false;
      if (this.weapons.weaponContainer) this.weapons.weaponContainer.visible = false;
    }
  }

  hide() {
    this.group.visible = false;
    if (this.weapons) {
      if (this.weapons.weaponHolder) this.weapons.weaponHolder.visible = true;
      if (this.weapons.weaponContainer) this.weapons.weaponContainer.visible = true;
    }
  }

  update(delta) {
    if (!this.group.visible) return;

    this.animTime += delta;

    // 0. Smooth Camera View Preset Interpolation
    const cam = this.camera || (this.scene && this.scene.parentCamera);
    if (cam) {
      cam.position.lerp(this.targetCameraPos, delta * 4.5);
      const currentLook = new THREE.Vector3();
      cam.getWorldDirection(currentLook);
      const targetLookDir = this.targetCameraLook.clone().sub(cam.position).normalize();
      const newLook = currentLook.lerp(targetLookDir, delta * 5.0);
      cam.lookAt(cam.position.clone().add(newLook));
    }

    // 1. Turntable Orbit & Damped Inertia
    if (!this.isDragging) {
      this.orbitVelocity *= 0.92;
      this.targetOrbitAngle += this.orbitVelocity;

      // Slow gentle auto-rotation after 4s idle
      const idleTime = (Date.now() - this.lastInteractionTime) / 1000;
      if (idleTime > 4.0 && !this.currentEmote) {
        this.targetOrbitAngle += delta * 0.16;
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
      this.torsoMesh.rotation.z = Math.sin(this.animTime * 1.1) * 0.012;
    }

    // 4. Arms Breathing & Weapon Hold Micro-bob
    if (this.armsGroup && !this.currentEmote) {
      this.armsGroup.position.y = breathe * 0.012;
      this.armsGroup.rotation.x = breathe * 0.02;
    }

    // 5. Emote Animations
    if (this.currentEmote) {
      this.emoteTimer += delta;

      if (this.currentEmote === 'salute') {
        // Salute: Right arm to brow
        const t = this.emoteTimer;
        if (t < 0.4) {
          const p = t / 0.4;
          this.rArm.group.rotation.set(lerp(0.72, 2.3, p), lerp(-0.42, -0.6, p), lerp(0.25, 0.75, p));
        } else if (t < 1.4) {
          this.rArm.group.rotation.set(2.3, -0.6, 0.75);
        } else if (t < 1.8) {
          const p = (t - 1.4) / 0.4;
          this.rArm.group.rotation.set(lerp(2.3, 0.72, p), lerp(-0.6, -0.42, p), lerp(0.75, 0.25, p));
        } else {
          this.currentEmote = null;
        }
      } else if (this.currentEmote === 'ready') {
        // Combat Ready: crouch, weapon raised
        const t = this.emoteTimer;
        if (t < 0.4) {
          const p = t / 0.4;
          this.torsoMesh.position.y = lerp(1.15, 1.02, p);
          this.wepHolder.position.set(0.04, lerp(0.02, 0.18, p), lerp(0.32, 0.42, p));
        } else if (t < 1.5) {
          this.torsoMesh.position.y = 1.02 + Math.sin(t * 8) * 0.01;
        } else if (t < 1.9) {
          const p = (t - 1.5) / 0.4;
          this.torsoMesh.position.y = lerp(1.02, 1.15, p);
          this.wepHolder.position.set(0.04, lerp(0.18, 0.02, p), lerp(0.42, 0.32, p));
        } else {
          this.currentEmote = null;
        }
      } else if (this.currentEmote === 'spin') {
        // 360 Spin Showcase
        const t = this.emoteTimer;
        const dur = 2.4;
        if (t < dur) {
          this.targetOrbitAngle += (delta * Math.PI * 2) / dur;
        } else {
          this.currentEmote = null;
        }
      } else if (this.currentEmote === 'taunt') {
        // Fist pump / Taunt
        const t = this.emoteTimer;
        if (t < 0.35) {
          const p = t / 0.35;
          this.lArm.group.rotation.set(lerp(0.85, 2.0, p), lerp(0.55, 0.2, p), lerp(-0.42, 0.4, p));
        } else if (t < 1.2) {
          this.lArm.group.rotation.x = 2.0 + Math.sin(t * 12) * 0.2;
        } else if (t < 1.6) {
          const p = (t - 1.2) / 0.4;
          this.lArm.group.rotation.set(lerp(2.0, 0.85, p), lerp(0.2, 0.55, p), lerp(0.4, -0.42, p));
        } else {
          this.currentEmote = null;
        }
      }
    }

    // 6. Periodic Weapon Inspect Animation
    if (this.isInspecting && this.wepHolder) {
      this.inspectProgress += delta * 0.8;
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

    // 7. Squadmates Spawn Scale & Idle Breathing
    if (this.squadModelEntries && this.squadModelEntries.length > 0) {
      this.squadModelEntries.forEach((sq, i) => {
        sq.currentScale = lerp(sq.currentScale, sq.targetScale, delta * 6);
        sq.group.scale.set(sq.currentScale, sq.currentScale, sq.currentScale);

        const sqBreathe = Math.sin(this.animTime * 2.0 + i * 1.3);
        if (sq.torso) sq.torso.position.y = 1.05 + sqBreathe * 0.012;
        if (sq.head) sq.head.rotation.y = Math.sin(this.animTime * 0.8 + i) * 0.15;
      });
    }

    // 8. Pedestal Concentric Rings Pulsing & Rotating
    if (this.floorRing1) {
      const pulse1 = 1.0 + Math.sin(this.animTime * 2.0) * 0.03;
      this.floorRing1.scale.set(pulse1, pulse1, pulse1);
      this.floorRing1.rotation.z = this.animTime * 0.08;
    }
    if (this.floorRing2) {
      this.floorRing2.rotation.z = -this.animTime * 0.06;
    }
    if (this.floorRing3) {
      this.floorRing3.rotation.z = this.animTime * 0.04;
    }
    if (this.compassStar) {
      this.compassStar.rotation.z = this.animTime * 0.06;
    }
    if (this.radarBeam) {
      this.radarBeam.rotation.y = this.animTime * 1.5;
    }

    // 9. Drifting Clouds
    if (this.clouds) {
      this.clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > 14) {
          cloud.position.x = -14;
        }
      });
    }

    // 10. Rotating Sun Rays
    if (this.sunRaysGroup) {
      this.sunRaysGroup.rotation.z = this.animTime * 0.04;
    }

    // 11. Floating Drafting Particles Upward Drift
    if (this.particlePoints && this.particleSpeeds) {
      const posAttr = this.particlePoints.geometry.attributes.position;
      const arr = posAttr.array;
      for (let i = 0; i < this.particleSpeeds.length; i++) {
        const spd = this.particleSpeeds[i];
        arr[i * 3 + 1] += spd.vy * delta;
        arr[i * 3] += spd.vx * delta;
        if (arr[i * 3 + 1] > 5.0) {
          arr[i * 3 + 1] = 0.1;
          arr[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      posAttr.needsUpdate = true;
    }
  }
}
