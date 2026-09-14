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

    // 1. Warm Hero Key Spotlight on Operator
    this.keySpotlight = new THREE.SpotLight(0xffecd2, 3.2, 20, Math.PI / 4.2, 0.4, 1.2);
    this.keySpotlight.position.set(0.5, 5.2, 2.2);
    this.keySpotlight.target.position.set(0, 1.1, 0);
    this.lightsGroup.add(this.keySpotlight);
    this.lightsGroup.add(this.keySpotlight.target);

    // 2. Powerful Electric Cyan/Blue Rim Light from Behind (PUBG Silhouette Glow)
    this.rimLight = new THREE.DirectionalLight(0x00d4ff, 2.6);
    this.rimLight.position.set(-1.2, 3.8, -4.5);
    this.lightsGroup.add(this.rimLight);

    // 3. Airdrop Flare Accent Light (Amber / Fire Glow from crate)
    this.flareLight = new THREE.PointLight(0xff6b00, 2.0, 8.0);
    this.flareLight.position.set(3.2, 1.4, 0.2);
    this.lightsGroup.add(this.flareLight);

    // 4. Cool Tactical Slate Ambient Fill
    this.ambientLight = new THREE.AmbientLight(0x1a2638, 1.1);
    this.lightsGroup.add(this.ambientLight);
  }

  buildPedestal() {
    this.pedestalGroup.clear();

    // 0. Dark Military Outpost Ground (36m x 36m)
    const hangarFloorGeom = new THREE.PlaneGeometry(42, 42);
    hangarFloorGeom.rotateX(-Math.PI / 2);
    const hangarFloorMat = new THREE.MeshLambertMaterial({ color: 0x0e1522 });
    const hangarFloor = new THREE.Mesh(hangarFloorGeom, hangarFloorMat);
    hangarFloor.position.set(0, -0.235, 0);
    this.pedestalGroup.add(hangarFloor);

    // Dark Tactical Grid Overlay
    const gridHelper = new THREE.GridHelper(42, 42, 0x1e2e46, 0x131f32);
    gridHelper.position.set(0, -0.233, 0);
    this.pedestalGroup.add(gridHelper);

    // Outer Staging Runway Perimeter Ring
    const outerRingGeom = new THREE.RingGeometry(6.8, 6.9, 48);
    outerRingGeom.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.position.set(0, -0.23, 0);
    this.pedestalGroup.add(outerRing);

    // Runway Approach Beacons (Cyan/Blue pulsating nodes)
    const runwayLightGeom = new THREE.CircleGeometry(0.08, 8);
    runwayLightGeom.rotateX(-Math.PI / 2);
    const runwayLightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const x = Math.cos(angle) * 6.85;
      const z = Math.sin(angle) * 6.85;
      const node = new THREE.Mesh(runwayLightGeom, runwayLightMat);
      node.position.set(x, -0.228, z);
      this.pedestalGroup.add(node);
    }

    // 1. Central Elevated Tactical Octagon Dais
    const daisGeom = new THREE.CylinderGeometry(2.3, 2.7, 0.45, 8);
    const daisMat = new THREE.MeshLambertMaterial({ color: 0x172336 });
    const daisLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const dais = this.materials.createOutlinedMesh(daisGeom, daisMat, daisLineMat);
    dais.group.position.set(0, -0.22, 0);
    this.pedestalGroup.add(dais.group);

    // Concentric Neon Hologram Rings
    const ring1Geom = new THREE.RingGeometry(1.45, 1.52, 40);
    ring1Geom.rotateX(-Math.PI / 2);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide });
    this.floorRing1 = new THREE.Mesh(ring1Geom, ring1Mat);
    this.floorRing1.position.set(0, 0.015, 0);
    this.pedestalGroup.add(this.floorRing1);

    const ring2Geom = new THREE.RingGeometry(1.9, 1.95, 40);
    ring2Geom.rotateX(-Math.PI / 2);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    this.floorRing2 = new THREE.Mesh(ring2Geom, ring2Mat);
    this.floorRing2.position.set(0, 0.016, 0);
    this.pedestalGroup.add(this.floorRing2);

    // Tactical Graduation Ticks (Amber Hazard Accents)
    const ring3Geom = new THREE.RingGeometry(2.18, 2.22, 48);
    ring3Geom.rotateX(-Math.PI / 2);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    this.floorRing3 = new THREE.Mesh(ring3Geom, ring3Mat);
    this.floorRing3.position.set(0, 0.017, 0);
    this.pedestalGroup.add(this.floorRing3);

    // Central Tactical Target Reticle
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
    const starMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    this.compassStar = new THREE.Mesh(starGeom, starMat);
    this.compassStar.position.set(0, 0.02, 0);
    this.pedestalGroup.add(this.compassStar);

    // Sweeping Radar Beam Line
    const radarLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.022, 0),
      new THREE.Vector3(0, 0.022, 1.88)
    ]);
    const radarLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    this.radarBeam = new THREE.Line(radarLineGeom, radarLineMat);
    this.pedestalGroup.add(this.radarBeam);

    // Side Squad Podiums
    const squadPositions = [
      { x: -1.75, z: 0.4, scale: 0.8 },
      { x: 1.75, z: 0.4, scale: 0.8 },
      { x: 0.0, z: 1.35, scale: 0.75 }
    ];

    squadPositions.forEach(pos => {
      const squadDaisGeom = new THREE.CylinderGeometry(0.75 * pos.scale, 0.9 * pos.scale, 0.22, 6);
      const squadDais = this.materials.createOutlinedMesh(
        squadDaisGeom,
        daisMat,
        daisLineMat
      );
      squadDais.group.position.set(pos.x, -0.13, pos.z);
      this.pedestalGroup.add(squadDais.group);

      const sRingGeom = new THREE.RingGeometry(0.48 * pos.scale, 0.53 * pos.scale, 24);
      sRingGeom.rotateX(-Math.PI / 2);
      const sRing = new THREE.Mesh(sRingGeom, ring2Mat);
      sRing.position.set(pos.x, 0.012, pos.z);
      this.pedestalGroup.add(sRing);
    });

    // Tactical PUBG Airdrop Crate & Military Outpost Props
    this.buildTacticalProps();
  }

  buildTacticalProps() {
    // 1. Iconic PUBG Airdrop Crate on Right Flank
    const airdropGroup = new THREE.Group();
    airdropGroup.position.set(3.2, 0, 0.2);
    airdropGroup.rotation.y = -0.28;

    // Blue container lower chassis
    const crateBodyGeom = new THREE.BoxGeometry(1.0, 0.75, 1.0);
    const crateBodyMat = new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }); // Electric cobalt blue
    const crateLineMat = new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 2 });
    const crateBody = this.materials.createOutlinedMesh(crateBodyGeom, crateBodyMat, crateLineMat);
    crateBody.group.position.set(0, 0.375, 0);
    airdropGroup.add(crateBody.group);

    // Red canvas top cover
    const tarpGeom = new THREE.BoxGeometry(1.08, 0.24, 1.08);
    const tarpMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 }); // Crimson red canvas
    const tarp = this.materials.createOutlinedMesh(tarpGeom, tarpMat, crateLineMat);
    tarp.group.position.set(0, 0.85, 0);
    airdropGroup.add(tarp.group);

    // Crate straps and reinforcement corner metal
    const strapGeom = new THREE.BoxGeometry(0.08, 0.77, 1.02);
    const strapMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const strap = new THREE.Mesh(strapGeom, strapMat);
    strap.position.set(0, 0.38, 0);
    airdropGroup.add(strap);

    this.pedestalGroup.add(airdropGroup);

    // 2. Tactical Military 4x4 Transport Vehicle (Jeep Silhouette) on Left Flank
    const jeepGroup = new THREE.Group();
    jeepGroup.position.set(-3.8, 0, -0.6);
    jeepGroup.rotation.y = 0.35;

    // Main olive/camo chassis
    const bodyGeom = new THREE.BoxGeometry(2.4, 0.8, 1.3);
    const jeepMat = new THREE.MeshLambertMaterial({ color: 0x243328 }); // Military olive
    const jeepLineMat = new THREE.LineBasicMaterial({ color: 0x111c14, linewidth: 2 });
    const jeepBody = this.materials.createOutlinedMesh(bodyGeom, jeepMat, jeepLineMat);
    jeepBody.group.position.set(0, 0.65, 0);
    jeepGroup.add(jeepBody.group);

    // Cabin roof
    const cabinGeom = new THREE.BoxGeometry(1.3, 0.65, 1.2);
    const cabin = this.materials.createOutlinedMesh(cabinGeom, jeepMat, jeepLineMat);
    cabin.group.position.set(-0.25, 1.35, 0);
    jeepGroup.add(cabin.group);

    // 4 Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
    const wheelPositions = [
      { x: 0.75, z: 0.7 },
      { x: -0.75, z: 0.7 },
      { x: 0.75, z: -0.7 },
      { x: -0.75, z: -0.7 }
    ];
    wheelPositions.forEach(wp => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.position.set(wp.x, 0.32, wp.z);
      jeepGroup.add(wheel);
    });

    this.pedestalGroup.add(jeepGroup);

    // 3. Military Communication Tower in Distant Background
    const towerGroup = new THREE.Group();
    towerGroup.position.set(1.5, 0, -11.0);

    const towerPillarGeom = new THREE.CylinderGeometry(0.12, 0.28, 7.5, 6);
    const towerMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const tower = new THREE.Mesh(towerPillarGeom, towerMat);
    tower.position.set(0, 3.75, 0);
    towerGroup.add(tower);

    // Beacon beacon light on top
    const beaconGeom = new THREE.SphereGeometry(0.14, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 7.6, 0);
    towerGroup.add(beacon);

    this.pedestalGroup.add(towerGroup);
  }

  buildEnvironment() {
    this.envGroup.clear();

    // 1. Distant Mountain Ridge Silhouettes (Military Horizon)
    const mountainMat = new THREE.MeshBasicMaterial({ color: 0x070b12 });
    const mountainGeom1 = new THREE.ConeGeometry(8.5, 4.2, 4);
    mountainGeom1.rotateY(Math.PI / 4);
    const mtn1 = new THREE.Mesh(mountainGeom1, mountainMat);
    mtn1.position.set(-8.0, 1.2, -18.0);
    this.envGroup.add(mtn1);

    const mountainGeom2 = new THREE.ConeGeometry(11.0, 5.8, 4);
    mountainGeom2.rotateY(Math.PI / 4);
    const mtn2 = new THREE.Mesh(mountainGeom2, mountainMat);
    mtn2.position.set(6.5, 2.0, -20.0);
    this.envGroup.add(mtn2);

    // 2. Rising Airdrop Flare / Smoke Particles
    const smokeCount = 35;
    const smokeGeom = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);
    this.smokeSpeeds = [];

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3] = 3.2 + (Math.random() - 0.5) * 0.4;
      smokePositions[i * 3 + 1] = 0.9 + Math.random() * 2.5;
      smokePositions[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.4;
      this.smokeSpeeds.push({
        vy: 0.35 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.08,
        vz: (Math.random() - 0.5) * 0.08
      });
    }
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.18,
      transparent: true,
      opacity: 0.75
    });
    this.smokePoints = new THREE.Points(smokeGeom, smokeMat);
    this.envGroup.add(this.smokePoints);

    // 3. Floating Tactical Dust Motes in Spotlight
    const particleCount = 45;
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    this.particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      this.particleSpeeds.push({
        vy: 0.12 + Math.random() * 0.25,
        vx: (Math.random() - 0.5) * 0.05,
        origY: positions[i * 3 + 1]
      });
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.06,
      transparent: true,
      opacity: 0.65
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
    if (this.scene) {
      this.prevSceneBackground = this.scene.background;
      this.scene.background = new THREE.Color(0x0a101b);
    }
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
    if (this.scene && this.prevSceneBackground) {
      this.scene.background = this.prevSceneBackground;
    }
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

    // 12. Airdrop Flare Smoke Upward Drift
    if (this.smokePoints && this.smokeSpeeds) {
      const sAttr = this.smokePoints.geometry.attributes.position;
      const sArr = sAttr.array;
      for (let i = 0; i < this.smokeSpeeds.length; i++) {
        const spd = this.smokeSpeeds[i];
        sArr[i * 3 + 1] += spd.vy * delta;
        sArr[i * 3] += spd.vx * delta;
        sArr[i * 3 + 2] += spd.vz * delta;
        if (sArr[i * 3 + 1] > 3.8) {
          sArr[i * 3 + 1] = 0.9;
          sArr[i * 3] = 3.2 + (Math.random() - 0.5) * 0.35;
          sArr[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.35;
        }
      }
      sAttr.needsUpdate = true;
    }
  }
}
