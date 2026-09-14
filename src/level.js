import * as THREE from 'three';
import { BoxCollider } from './utilities.js';
import { BlueprintProps } from './props.js';

export class Level {
  constructor(scene, materials, currentMapSize = 'small') {
    this.scene = scene;
    this.materials = materials;
    this.props = new BlueprintProps(this.materials);
    this.currentMapSize = currentMapSize;
    this.group = new THREE.Group();
    this.colliders = [];
    this.mapFeatures = [];
    this.spawnPoints = [];
    this.sniperSpawnPoints = [];
    this.blueSpawnPoints = [];
    this.redSpawnPoints = [];
    this.playerSpawnPoint = new THREE.Vector3(0, 1.8, 16);

    this.buildMap(this.currentMapSize);
    this.buildSkyDoodles();
    this.scene.add(this.group);
  }

  setMapSize(size) {
    this.currentMapSize = size;
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }
    this.colliders = [];
    this.mapFeatures = [];
    this.spawnPoints = [];
    this.sniperSpawnPoints = [];
    this.blueSpawnPoints = [];
    this.redSpawnPoints = [];

    this.buildMap(this.currentMapSize);
    this.buildSkyDoodles();
  }

  addProp(propData) {
    if (!propData) return;
    this.group.add(propData.group);
    if (propData.colliders) {
      for (const c of propData.colliders) {
        this.colliders.push(new BoxCollider(c.min.x, c.min.y, c.min.z, c.max.x, c.max.y, c.max.z, 'wall'));
      }
    }
    if (propData.mapIcon) {
      this.mapFeatures.push(propData.mapIcon);
    }
  }

  // Helper to create a solid architectural block with ink outlines and AABB collision
  createBlock(x, y, z, width, height, depth, material = this.materials.architecturalPaperMaterial, isWalkableFloor = false) {
    const geom = new THREE.BoxGeometry(width, height, depth);
    const { group, mesh } = this.materials.createOutlinedMesh(
      geom,
      material,
      this.materials.blueInkLineMaterial
    );

    group.position.set(x, y, z);
    this.group.add(group);

    // Register collision box
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;
    const collider = new BoxCollider(
      x - halfW, y - halfH, z - halfD,
      x + halfW, y + halfH, z + halfD,
      isWalkableFloor ? 'floor' : 'wall'
    );
    this.colliders.push(collider);

    if (!isWalkableFloor && height >= 1.0 && width >= 1.0 && depth >= 1.0) {
      this.mapFeatures.push({ type: 'wall', x, z, width, depth, height });
    }

    return { group, mesh, collider };
  }

  // Create stairs with multiple functional steps
  createStairs(startX, startY, startZ, stepCount, stepWidth, stepHeight, stepDepth, dirX = 0, dirZ = -1) {
    for (let i = 0; i < stepCount; i++) {
      const stepX = startX + dirX * i * stepDepth;
      const stepY = startY + (i + 0.5) * stepHeight;
      const stepZ = startZ + dirZ * i * stepDepth;

      this.createBlock(
        stepX,
        stepY,
        stepZ,
        dirX !== 0 ? stepDepth : stepWidth,
        stepHeight,
        dirX !== 0 ? stepWidth : stepDepth,
        this.materials.hatchSurfaceMaterial,
        true
      );
    }
  }

  buildMap(mapSize = 'small') {
    if (mapSize === 'small') {
      this.buildSmallMap();
    } else if (mapSize === 'big') {
      this.buildBigMap();
    } else {
      this.buildMediumMap();
    }
  }

  // 1. SMALL MAP (4 vs 4: Courtyard Blitz - 46m x 46m)
  buildSmallMap() {
    const arenaW = 46;
    const arenaD = 46;
    const wallH = 10;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    // Floor & Perimeter
    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.2, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.2, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.2, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.2, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Center fountain / structure
    this.createBlock(0, 0.4, 0, 10, 0.8, 10, this.materials.accentBlockMaterial, true);
    this.createBlock(0, 2.5, 0, 2.5, 4.2, 2.5, this.materials.hatchSurfaceMaterial);

    // 4 Corner Pillars
    [-8, 8].forEach(px => {
      [-8, 8].forEach(pz => {
        this.createBlock(px, 2.5, pz, 1.2, 5, 1.2, this.materials.hatchSurfaceMaterial);
      });
    });

    // Ground Cover blocks
    const covers = [
      { x: -6, y: 0.8, z: -12, w: 3.5, h: 1.6, d: 1.0 },
      { x: 6, y: 0.8, z: -12, w: 3.5, h: 1.6, d: 1.0 },
      { x: -6, y: 0.8, z: 12, w: 3.5, h: 1.6, d: 1.0 },
      { x: 6, y: 0.8, z: 12, w: 3.5, h: 1.6, d: 1.0 },
      { x: -14, y: 0.8, z: 0, w: 1.2, h: 1.6, d: 6.0 },
      { x: 14, y: 0.8, z: 0, w: 1.2, h: 1.6, d: 6.0 }
    ];
    covers.forEach(c => {
      this.createBlock(c.x, c.y, c.z, c.w, c.h, c.d, this.materials.hatchSurfaceMaterial);
    });

    // Elevated Mezzanine Platforms (y = 4.2m)
    this.createBlock(-17, 4.0, 0, 6, 0.5, 24, this.materials.architecturalPaperMaterial, true);
    this.createBlock(-14.2, 4.6, 0, 0.3, 0.8, 24, this.materials.accentBlockMaterial);
    this.createStairs(-17, 0, 8, 12, 3.5, 0.35, 0.6, 0, 1);

    this.createBlock(17, 4.0, 0, 6, 0.5, 24, this.materials.architecturalPaperMaterial, true);
    this.createBlock(14.2, 4.6, 0, 0.3, 0.8, 24, this.materials.accentBlockMaterial);
    this.createStairs(17, 0, 8, 12, 3.5, 0.35, 0.6, 0, 1);

    // 3D Blueprint Props (House, Car, Trees, Sandbags)
    this.addProp(this.props.createHouse(13, -11, 7, 6, 3.8, 0));
    this.addProp(this.props.createCar(-10, 5, 0.4));
    this.addProp(this.props.createSandbagBunker(0, -8, 0));
    this.addProp(this.props.createSandbagBunker(0, 8, Math.PI));
    this.addProp(this.props.createTree(-17, -17, 1.1));
    this.addProp(this.props.createTree(17, -17, 1.1));
    this.addProp(this.props.createTree(-17, 17, 1.1));
    this.addProp(this.props.createTree(17, 17, 1.1));

    // Spawns
    this.playerSpawnPoint.set(0, 1.8, 16);

    this.blueSpawnPoints = [
      new THREE.Vector3(-8, 0.5, 16),
      new THREE.Vector3(0, 0.5, 17),
      new THREE.Vector3(8, 0.5, 16),
      new THREE.Vector3(12, 0.5, 14)
    ];

    this.redSpawnPoints = [
      new THREE.Vector3(-8, 0.5, -16),
      new THREE.Vector3(0, 0.5, -17),
      new THREE.Vector3(8, 0.5, -16),
      new THREE.Vector3(-12, 0.5, -14)
    ];

    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(-17, 4.6, -8),
      new THREE.Vector3(17, 4.6, -8)
    ];
  }

  // 2. MEDIUM MAP (8 vs 8: The Compound - 76m x 76m)
  buildMediumMap() {
    const arenaW = 76;
    const arenaD = 76;
    const wallH = 12;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.5, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.5, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.5, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.5, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Central Raised Plaza
    this.createBlock(0, 0.5, 0, 18, 1.0, 18, this.materials.accentBlockMaterial, true);
    [-6, 6].forEach(px => {
      [-6, 6].forEach(pz => {
        this.createBlock(px, 3.2, pz, 1.5, 6.4, 1.5, this.materials.hatchSurfaceMaterial);
      });
    });
    this.createBlock(0, 6.6, 0, 15, 0.5, 15, this.materials.architecturalPaperMaterial, true);

    // Elevated Walkways (y = 4.8m)
    const balcY = 4.8;
    this.createBlock(-28, balcY, 0, 8, 0.6, 52, this.materials.architecturalPaperMaterial, true);
    this.createBlock(-24.2, balcY + 0.8, 0, 0.4, 1.0, 52, this.materials.accentBlockMaterial);
    this.createStairs(-28, 0, 14, 14, 4.0, 0.35, 0.7, 0, 1);

    this.createBlock(28, balcY, 0, 8, 0.6, 52, this.materials.architecturalPaperMaterial, true);
    this.createBlock(24.2, balcY + 0.8, 0, 0.4, 1.0, 52, this.materials.accentBlockMaterial);
    this.createStairs(28, 0, 14, 14, 4.0, 0.35, 0.7, 0, 1);

    // Connecting Bridge
    this.createBlock(0, balcY, -22, 48, 0.6, 5, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, balcY + 0.8, -19.8, 48, 0.8, 0.3, this.materials.accentBlockMaterial);

    // Ground Covers
    const covers = [
      { x: -10, y: 1.0, z: -14, w: 5, h: 2.0, d: 1.4 },
      { x: 10, y: 1.0, z: -14, w: 5, h: 2.0, d: 1.4 },
      { x: -10, y: 1.0, z: 14, w: 5, h: 2.0, d: 1.4 },
      { x: 10, y: 1.0, z: 14, w: 5, h: 2.0, d: 1.4 },
      { x: -18, y: 1.0, z: 0, w: 3, h: 2.0, d: 3.0 },
      { x: 18, y: 1.0, z: 0, w: 3, h: 2.0, d: 3.0 }
    ];
    covers.forEach(c => {
      this.createBlock(c.x, c.y, c.z, c.w, c.h, c.d, this.materials.hatchSurfaceMaterial);
    });

    // 3D Blueprint Props (Houses, Bus Roadblock, Cars, Trees, Sandbags)
    this.addProp(this.props.createHouse(-18, -18, 10, 8, 4.2, 0));
    this.addProp(this.props.createHouse(18, -18, 10, 8, 4.2, 0));
    this.addProp(this.props.createBus(0, -14, Math.PI / 2));
    this.addProp(this.props.createCar(-14, 14, 0.3));
    this.addProp(this.props.createCar(14, 14, -0.4));
    this.addProp(this.props.createSandbagBunker(-8, 2, 0.5));
    this.addProp(this.props.createSandbagBunker(8, 2, -0.5));
    [-26, -14, 14, 26].forEach(tx => {
      this.addProp(this.props.createTree(tx, -32, 1.2));
      this.addProp(this.props.createTree(tx, 32, 1.2));
    });

    this.playerSpawnPoint.set(0, 1.8, 22);

    this.blueSpawnPoints = [
      new THREE.Vector3(-14, 0.5, 26),
      new THREE.Vector3(-6, 0.5, 28),
      new THREE.Vector3(6, 0.5, 28),
      new THREE.Vector3(14, 0.5, 26),
      new THREE.Vector3(-24, 0.5, 22),
      new THREE.Vector3(24, 0.5, 22),
      new THREE.Vector3(0, 0.5, 25),
      new THREE.Vector3(-18, 0.5, 20)
    ];

    this.redSpawnPoints = [
      new THREE.Vector3(-14, 0.5, -26),
      new THREE.Vector3(-6, 0.5, -28),
      new THREE.Vector3(6, 0.5, -28),
      new THREE.Vector3(14, 0.5, -26),
      new THREE.Vector3(-24, 0.5, -22),
      new THREE.Vector3(24, 0.5, -22),
      new THREE.Vector3(0, 0.5, -25),
      new THREE.Vector3(18, 0.5, -20)
    ];

    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(-28, balcY + 0.8, -18),
      new THREE.Vector3(28, balcY + 0.8, -18)
    ];
  }

  // 3. BIG MAP (12 vs 12: Architect District - 116m x 116m)
  buildBigMap() {
    const arenaW = 116;
    const arenaD = 116;
    const wallH = 14;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 2.0, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 2.0, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 2.0, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 2.0, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // 4 District Quadrants with distinct structures
    // Central Monumental Tower (3 Tiers: y = 4m, 8m, 12m)
    this.createBlock(0, 1.0, 0, 24, 2.0, 24, this.materials.accentBlockMaterial, true);
    this.createBlock(0, 5.0, 0, 16, 6.0, 16, this.materials.hatchSurfaceMaterial, true);
    this.createBlock(0, 9.0, 0, 10, 4.0, 10, this.materials.accentBlockMaterial, true);

    // Overpass skybridges
    this.createBlock(0, 5.2, 0, 80, 0.6, 6, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, 5.2, 0, 6, 0.6, 80, this.materials.architecturalPaperMaterial, true);

    // Stairs to Central Hub
    this.createStairs(0, 0, 24, 16, 5.0, 0.32, 0.8, 0, -1);
    this.createStairs(0, 0, -24, 16, 5.0, 0.32, 0.8, 0, 1);
    this.createStairs(24, 0, 0, 16, 5.0, 0.32, 0.8, -1, 0);
    this.createStairs(-24, 0, 0, 16, 5.0, 0.32, 0.8, 1, 0);

    // Perimeter Defensive Bastions
    [-42, 42].forEach(bx => {
      [-42, 42].forEach(bz => {
        this.createBlock(bx, 4.0, bz, 14, 8.0, 14, this.materials.hatchSurfaceMaterial, true);
        this.createStairs(bx, 0, bz + (bz < 0 ? 10 : -10), 12, 3.5, 0.35, 0.7, 0, bz < 0 ? -1 : 1);
      });
    });

    // Abundant Cover & Streets
    for (let x = -36; x <= 36; x += 18) {
      if (Math.abs(x) < 5) continue;
      this.createBlock(x, 1.0, -16, 4, 2.0, 1.4, this.materials.hatchSurfaceMaterial);
      this.createBlock(x, 1.0, 16, 4, 2.0, 1.4, this.materials.hatchSurfaceMaterial);
      this.createBlock(-16, 1.0, x, 1.4, 2.0, 4, this.materials.hatchSurfaceMaterial);
      this.createBlock(16, 1.0, x, 1.4, 2.0, 4, this.materials.hatchSurfaceMaterial);
    }

    // 3D Blueprint Props (Residential Houses, 2 City Buses, 4 Cars, Checkpoint Bunkers, Trees)
    this.addProp(this.props.createHouse(-32, -26, 14, 10, 4.8, 0));
    this.addProp(this.props.createHouse(32, -26, 14, 10, 4.8, 0));
    this.addProp(this.props.createBus(-20, 22, 0.2));
    this.addProp(this.props.createBus(20, -20, -0.6));
    this.addProp(this.props.createCar(-24, -8, 0.4));
    this.addProp(this.props.createCar(24, 12, -0.3));
    this.addProp(this.props.createCar(-12, 32, 1.2));
    this.addProp(this.props.createCar(12, -32, -1.0));
    this.addProp(this.props.createSandbagBunker(0, 32, 0));
    this.addProp(this.props.createSandbagBunker(0, -32, Math.PI));
    this.addProp(this.props.createSandbagBunker(-32, 0, Math.PI / 2));
    this.addProp(this.props.createSandbagBunker(32, 0, -Math.PI / 2));
    [-46, -30, -14, 14, 30, 46].forEach(tx => {
      this.addProp(this.props.createTree(tx, -48, 1.3));
      this.addProp(this.props.createTree(tx, 48, 1.3));
    });

    this.playerSpawnPoint.set(0, 1.8, 42);

    // 12 Blue Spawns (South Base)
    this.blueSpawnPoints = [];
    for (let i = -5; i <= 6; i++) {
      this.blueSpawnPoints.push(new THREE.Vector3(i * 6, 0.5, 44 + (i % 2) * 3));
    }

    // 12 Red Spawns (North Base)
    this.redSpawnPoints = [];
    for (let i = -5; i <= 6; i++) {
      this.redSpawnPoints.push(new THREE.Vector3(i * 6, 0.5, -44 - (i % 2) * 3));
    }

    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(-42, 8.5, -42),
      new THREE.Vector3(42, 8.5, -42),
      new THREE.Vector3(-42, 8.5, 42),
      new THREE.Vector3(42, 8.5, 42)
    ];
  }

  // Hand-drawn doodle sun & clouds in the background sky (reproducing screenshot 3)
  buildSkyDoodles() {
    const skyGroup = new THREE.Group();

    // Doodle Sun (circle with radiating hand-drawn sketch rays)
    const sunGeom = new THREE.CircleGeometry(4, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0x162a68, wireframe: true });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    sunMesh.position.set(-18, 28, -48);
    sunMesh.rotation.y = 0.2;
    skyGroup.add(sunMesh);

    // Sun rays
    const rayLinesGeom = new THREE.BufferGeometry();
    const rayCoords = [];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const r1 = 4.6;
      const r2 = 7.5 + (i % 2 === 0 ? 2 : 0);
      rayCoords.push(
        -18 + Math.cos(angle) * r1, 28 + Math.sin(angle) * r1, -48,
        -18 + Math.cos(angle) * r2, 28 + Math.sin(angle) * r2, -48
      );
    }
    rayLinesGeom.setAttribute('position', new THREE.Float32BufferAttribute(rayCoords, 3));
    const rayLine = new THREE.LineSegments(rayLinesGeom, this.materials.blueInkLineMaterial);
    skyGroup.add(rayLine);

    // Doodle Clouds (overlapping sketched arcs)
    const cloudPositions = [
      { x: -6, y: 26, z: -50 },
      { x: 12, y: 29, z: -52 },
      { x: 28, y: 25, z: -48 }
    ];

    cloudPositions.forEach(c => {
      const cloudGeom = new THREE.BufferGeometry();
      const pts = [];
      // 3 overlapping puffs
      const puffs = [
        { ox: -3, oy: 0, r: 2.2 },
        { ox: 0, oy: 1.2, r: 3.0 },
        { ox: 3, oy: 0, r: 2.4 }
      ];
      puffs.forEach(p => {
        for (let a = 0; a <= Math.PI; a += 0.3) {
          pts.push(
            c.x + p.ox + Math.cos(a) * p.r,
            c.y + p.oy + Math.sin(a) * p.r,
            c.z
          );
        }
      });
      // Flat bottom line
      pts.push(c.x + 5.5, c.y, c.z);
      pts.push(c.x - 5.5, c.y, c.z);

      cloudGeom.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => [p]), 3));
      const cloudLine = new THREE.Line(cloudGeom, this.materials.blueInkLineMaterial);
      skyGroup.add(cloudLine);
    });

    this.group.add(skyGroup);
  }

  // Get random valid ground or balcony spawn point
  getRandomSpawnPoint() {
    const idx = Math.floor(Math.random() * this.spawnPoints.length);
    return this.spawnPoints[idx].clone();
  }

  // Get sniper vantage perch
  getRandomSniperPoint() {
    const idx = Math.floor(Math.random() * this.sniperSpawnPoints.length);
    return this.sniperSpawnPoints[idx].clone();
  }
}
