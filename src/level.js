import * as THREE from 'three';
import { BoxCollider } from './utilities.js';
import { BlueprintProps } from './props.js';

export class Level {
  constructor(scene, materials, currentMapSize = 'city') {
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
    this.animatedProps = [];

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
    this.animatedProps = [];

    this.buildMap(this.currentMapSize);
    this.buildSkyDoodles();
  }

  update(delta) {
    if (this.animatedProps && this.animatedProps.length > 0) {
      for (const p of this.animatedProps) {
        if (p.userData && p.userData.sails) {
          p.userData.sails.rotation.z += delta * 0.9;
        }
      }
    }
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
    if (propData.group && propData.group.userData && propData.group.userData.sails) {
      this.animatedProps.push(propData.group);
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

  buildMap(mapKey = 'city') {
    if (mapKey === 'city' || mapKey === 'small') {
      this.arenaBounds = 28;
      this.buildCityMap();
    } else if (mapKey === 'village') {
      this.arenaBounds = 32;
      this.buildVillageMap();
    } else if (mapKey === 'train_station' || mapKey === 'train' || mapKey === 'medium') {
      this.arenaBounds = 36;
      this.buildTrainStationMap();
    } else if (mapKey === 'airport') {
      this.arenaBounds = 41;
      this.buildAirportTerminalMap();
    } else if (mapKey === 'tv_station' || mapKey === 'tv') {
      this.arenaBounds = 31;
      this.buildTVStationMap();
    } else if (mapKey === 'sea_port' || mapKey === 'sea' || mapKey === 'big') {
      this.arenaBounds = 42;
      this.buildSeaPortMap();
    } else {
      this.arenaBounds = 28;
      this.buildCityMap();
    }
  }

  // 1. CITY MAP: "METROPOLIS DOWNTOWN" (56m x 56m)
  buildCityMap() {
    const arenaW = 56;
    const arenaD = 56;
    const wallH = 12;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    // Floor & Perimeter Walls
    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.4, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.4, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.4, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.4, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // 4 Corner Skyscraper Blocks
    this.addProp(this.props.createSkyscraper(-20, -20, 12, 12, 6));
    this.addProp(this.props.createSkyscraper(20, -20, 12, 12, 6));
    this.addProp(this.props.createSkyscraper(-20, 20, 12, 12, 5));
    this.addProp(this.props.createSkyscraper(20, 20, 12, 12, 5));

    // Elevated Skywalk Bridges linking East and West
    const skyY = 5.2;
    this.createBlock(0, skyY, -14, 28, 0.6, 4.0, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, skyY + 0.6, -11.8, 28, 0.8, 0.3, this.materials.accentBlockMaterial);
    this.createBlock(0, skyY + 0.6, -16.2, 28, 0.8, 0.3, this.materials.accentBlockMaterial);
    this.createStairs(-14, 0, -14, 14, 3.8, 0.38, 0.6, -1, 0);
    this.createStairs(14, 0, -14, 14, 3.8, 0.38, 0.6, 1, 0);

    // Central Metro Plaza with Monument & Fountain
    this.createBlock(0, 0.4, 4, 14, 0.8, 14, this.materials.accentBlockMaterial, true);
    this.createBlock(0, 2.6, 4, 3.0, 4.4, 3.0, this.materials.hatchSurfaceMaterial);

    // Street Covers & Checkpoints
    const streetCovers = [
      { x: -7, y: 0.9, z: 12, w: 4.0, h: 1.8, d: 1.2 },
      { x: 7, y: 0.9, z: 12, w: 4.0, h: 1.8, d: 1.2 },
      { x: -8, y: 0.9, z: -4, w: 1.2, h: 1.8, d: 5.0 },
      { x: 8, y: 0.9, z: -4, w: 1.2, h: 1.8, d: 5.0 }
    ];
    streetCovers.forEach(c => this.createBlock(c.x, c.y, c.z, c.w, c.h, c.d, this.materials.hatchSurfaceMaterial));

    // Vehicles & Bunkers
    this.addProp(this.props.createBus(0, -4, 0));
    this.addProp(this.props.createCar(-10, 18, 0.3));
    this.addProp(this.props.createCar(10, 18, -0.4));
    this.addProp(this.props.createSandbagBunker(0, 18, 0));
    this.addProp(this.props.createSandbagBunker(0, -22, Math.PI));

    // Spawns
    this.playerSpawnPoint.set(0, 1.8, 22);
    this.blueSpawnPoints = [
      new THREE.Vector3(-10, 0.5, 23),
      new THREE.Vector3(0, 0.5, 24),
      new THREE.Vector3(10, 0.5, 23),
      new THREE.Vector3(16, 0.5, 20)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-10, 0.5, -23),
      new THREE.Vector3(0, 0.5, -24),
      new THREE.Vector3(10, 0.5, -23),
      new THREE.Vector3(-16, 0.5, -20)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(0, skyY + 0.8, -14),
      new THREE.Vector3(-16, 5.8, 16)
    ];
  }

  // 2. VILLAGE MAP: "HIGHLAND HAMLET" (64m x 64m)
  buildVillageMap() {
    const arenaW = 64;
    const arenaD = 64;
    const wallH = 9;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.2, this.materials.hatchSurfaceMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.2, this.materials.hatchSurfaceMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.2, wallH, arenaD, this.materials.hatchSurfaceMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.2, wallH, arenaD, this.materials.hatchSurfaceMaterial);

    // Rotating Windmill at North-West
    this.addProp(this.props.createWindmill(-18, -18));

    // Rustic Red Barn in East
    this.addProp(this.props.createBarn(17, -4, 0));

    // Two Village Cottages
    this.addProp(this.props.createHouse(-16, 12, 10, 8, 4.4, 0.2));
    this.addProp(this.props.createHouse(16, 16, 10, 8, 4.4, -0.3));

    // Hay Bales Clusters (Tactical Waist-High Cover)
    this.addProp(this.props.createHayBales(-4, 4, 0.4));
    this.addProp(this.props.createHayBales(4, -8, -0.2));
    this.addProp(this.props.createHayBales(0, 16, 0));
    this.addProp(this.props.createHayBales(-10, -8, 1.2));

    // Sandbag Forts
    this.addProp(this.props.createSandbagBunker(0, -18, Math.PI));
    this.addProp(this.props.createSandbagBunker(0, 24, 0));

    // Pine and Birch Trees Groves
    [-24, -12, 0, 12, 24].forEach(tx => {
      this.addProp(this.props.createTree(tx, -27, 1.3));
      this.addProp(this.props.createTree(tx, 27, 1.3));
    });
    this.addProp(this.props.createTree(-26, 0, 1.2));
    this.addProp(this.props.createTree(26, 0, 1.2));

    this.playerSpawnPoint.set(0, 1.8, 26);
    this.blueSpawnPoints = [
      new THREE.Vector3(-12, 0.5, 26),
      new THREE.Vector3(0, 0.5, 27),
      new THREE.Vector3(12, 0.5, 26),
      new THREE.Vector3(20, 0.5, 22),
      new THREE.Vector3(-20, 0.5, 22)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-12, 0.5, -26),
      new THREE.Vector3(0, 0.5, -27),
      new THREE.Vector3(12, 0.5, -26),
      new THREE.Vector3(20, 0.5, -22),
      new THREE.Vector3(-20, 0.5, -22)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(-18, 12, -18),
      new THREE.Vector3(17, 7.2, -4)
    ];
  }

  // 3. TRAIN STATION MAP: "CENTRAL TERMINAL" (72m x 72m)
  buildTrainStationMap() {
    const arenaW = 72;
    const arenaD = 72;
    const wallH = 14;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.6, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.6, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.6, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.6, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Dual Parallel Railway Tracks running East-West (Z = -6 and Z = 6)
    this.addProp(this.props.createTrainTracks(0, -6, 68, Math.PI / 2));
    this.addProp(this.props.createTrainTracks(0, 6, 68, Math.PI / 2));

    // Passenger Train on Track 1 (North)
    this.addProp(this.props.createTrain(-12, -6, 24, Math.PI / 2));

    // Cargo Freight Train on Track 2 (South)
    this.addProp(this.props.createTrain(12, 6, 22, Math.PI / 2));

    // Passenger Boarding Platforms (Z = -14, Z = 0, Z = 14)
    const platH = 0.8;
    this.createBlock(0, platH / 2, 0, 64, platH, 6.0, this.materials.accentBlockMaterial, true);
    this.createBlock(0, platH / 2, -17, 64, platH, 8.0, this.materials.accentBlockMaterial, true);
    this.createBlock(0, platH / 2, 17, 64, platH, 8.0, this.materials.accentBlockMaterial, true);

    // Overhead Passenger Footbridge Crossing (X = 0)
    const bridgeY = 5.2;
    this.createBlock(0, bridgeY, 0, 5.0, 0.6, 44, this.materials.architecturalPaperMaterial, true);
    this.createBlock(-2.3, bridgeY + 0.6, 0, 0.3, 0.8, 44, this.materials.accentBlockMaterial);
    this.createBlock(2.3, bridgeY + 0.6, 0, 0.3, 0.8, 44, this.materials.accentBlockMaterial);
    this.createStairs(0, 0, -20, 14, 4.0, 0.38, 0.6, 0, 1);
    this.createStairs(0, 0, 20, 14, 4.0, 0.38, 0.6, 0, -1);

    // Ticket Kiosks & Waiting Benches
    this.createBlock(-24, 1.4, 0, 3.2, 2.8, 4.0, this.materials.hatchSurfaceMaterial);
    this.createBlock(24, 1.4, 0, 3.2, 2.8, 4.0, this.materials.hatchSurfaceMaterial);
    this.addProp(this.props.createSandbagBunker(-14, 17, 0));
    this.addProp(this.props.createSandbagBunker(14, -17, Math.PI));

    this.playerSpawnPoint.set(0, 1.8, 28);
    this.blueSpawnPoints = [
      new THREE.Vector3(-18, 0.8, 27),
      new THREE.Vector3(-6, 0.8, 28),
      new THREE.Vector3(6, 0.8, 28),
      new THREE.Vector3(18, 0.8, 27),
      new THREE.Vector3(0, 0.8, 26)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-18, 0.8, -27),
      new THREE.Vector3(-6, 0.8, -28),
      new THREE.Vector3(6, 0.8, -28),
      new THREE.Vector3(18, 0.8, -27),
      new THREE.Vector3(0, 0.8, -26)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(0, bridgeY + 0.8, 0),
      new THREE.Vector3(-24, 3.2, 0)
    ];
  }

  // 4. AIRPORT TERMINAL MAP: "SKY HARBOR" (82m x 82m)
  buildAirportTerminalMap() {
    const arenaW = 82;
    const arenaD = 82;
    const wallH = 14;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.6, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.6, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.6, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.6, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Parked Commercial Airliner Jet on the Apron Tarmac
    this.addProp(this.props.createAirplane(0, -14, 0));

    // Terminal Boarding Building (South Sector, Z = 16 to 38)
    this.createBlock(0, 3.2, 28, 68, 6.4, 20, this.materials.architecturalPaperMaterial, true);
    // Interior gate lounge with glass curtain wall
    this.createBlock(0, 3.2, 18, 68, 0.8, 0.4, this.materials.accentBlockMaterial);
    this.createStairs(-28, 0, 18, 16, 4.0, 0.4, 0.6, 0, 1);
    this.createStairs(28, 0, 18, 16, 4.0, 0.4, 0.6, 0, 1);

    // Connected Jet Bridge Tube from Terminal to Plane (Z = 6 to 18)
    this.createBlock(0, 3.2, 8, 4.0, 3.2, 16, this.materials.hatchSurfaceMaterial);

    // Airport Control Tower at North-West
    this.addProp(this.props.createControlTower(-26, -26));

    // Luggage Conveyor Area
    this.createBlock(16, 0.6, 26, 12, 1.2, 6, this.materials.accentBlockMaterial);
    this.addProp(this.props.createCar(18, -14, 0.5));
    this.addProp(this.props.createCar(-16, -4, -0.3));
    this.addProp(this.props.createSandbagBunker(-10, 4, 0));
    this.addProp(this.props.createSandbagBunker(10, 4, 0));

    this.playerSpawnPoint.set(0, 1.8, 34);
    this.blueSpawnPoints = [
      new THREE.Vector3(-20, 0.5, 34),
      new THREE.Vector3(-8, 0.5, 35),
      new THREE.Vector3(8, 0.5, 35),
      new THREE.Vector3(20, 0.5, 34),
      new THREE.Vector3(0, 0.5, 33)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-20, 0.5, -34),
      new THREE.Vector3(-8, 0.5, -35),
      new THREE.Vector3(8, 0.5, -35),
      new THREE.Vector3(20, 0.5, -34),
      new THREE.Vector3(0, 0.5, -33)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(-26, 15, -26),
      new THREE.Vector3(0, 6.8, 28)
    ];
  }

  // 5. TV STATION MAP: "BROADCAST MEDIA CENTER" (62m x 62m)
  buildTVStationMap() {
    const arenaW = 62;
    const arenaD = 62;
    const wallH = 13;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.5, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.5, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.5, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.5, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Broadcast Transmission Tower Spire in NE Corner
    this.addProp(this.props.createBroadcastTower(20, -20, 22));

    // Giant Parabolic Satellite Dishes on Patio
    this.addProp(this.props.createSatelliteDish(-16, -18, 1.3, 0.35));
    this.addProp(this.props.createSatelliteDish(-6, -22, 1.0, 0.45));
    this.addProp(this.props.createSatelliteDish(6, -22, 1.1, 0.4));

    // Main News Studio Soundstage (Center-South)
    this.createBlock(0, 3.4, 10, 36, 6.8, 24, this.materials.hatchSurfaceMaterial, true);
    // News Anchor Desk
    this.createBlock(0, 0.6, 12, 6.0, 1.2, 3.2, this.materials.accentBlockMaterial);
    // Overhead Lighting Truss Grid
    this.createBlock(0, 6.2, 10, 32, 0.4, 20, this.materials.blueInkLineMaterial);
    this.createStairs(-18, 0, 10, 16, 3.5, 0.42, 0.6, -1, 0);
    this.createStairs(18, 0, 10, 16, 3.5, 0.42, 0.6, 1, 0);

    // Control Room & Editing Suites
    this.createBlock(-20, 1.6, -2, 12, 3.2, 8, this.materials.architecturalPaperMaterial);
    this.createBlock(20, 1.6, -2, 12, 3.2, 8, this.materials.architecturalPaperMaterial);

    // Satellite News Vans
    this.addProp(this.props.createBus(-10, -6, 0.3));
    this.addProp(this.props.createBus(10, -6, -0.3));
    this.addProp(this.props.createSandbagBunker(0, 24, 0));

    this.playerSpawnPoint.set(0, 1.8, 26);
    this.blueSpawnPoints = [
      new THREE.Vector3(-14, 0.5, 26),
      new THREE.Vector3(0, 0.5, 27),
      new THREE.Vector3(14, 0.5, 26),
      new THREE.Vector3(20, 0.5, 22)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-14, 0.5, -26),
      new THREE.Vector3(0, 0.5, -27),
      new THREE.Vector3(14, 0.5, -26),
      new THREE.Vector3(-20, 0.5, -22)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(20, 12, -20),
      new THREE.Vector3(0, 7.2, 10)
    ];
  }

  // 6. SEA PORT MAP: "CARGO SEA PORT" (84m x 84m)
  buildSeaPortMap() {
    const arenaW = 84;
    const arenaD = 84;
    const wallH = 14;
    const halfW = arenaW / 2;
    const halfD = arenaD / 2;

    this.createBlock(0, -0.5, 0, arenaW, 1, arenaD, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, wallH / 2, -halfD, arenaW, wallH, 1.8, this.materials.architecturalPaperMaterial);
    this.createBlock(0, wallH / 2, halfD, arenaW, wallH, 1.8, this.materials.architecturalPaperMaterial);
    this.createBlock(-halfW, wallH / 2, 0, 1.8, wallH, arenaD, this.materials.architecturalPaperMaterial);
    this.createBlock(halfW, wallH / 2, 0, 1.8, wallH, arenaD, this.materials.architecturalPaperMaterial);

    // Deep water canal basin on North Side with lower floor
    this.createBlock(0, -1.2, -26, 76, 0.6, 24, this.materials.hatchSurfaceMaterial, true);

    // Moored Container Cargo Ship in Basin
    this.addProp(this.props.createCargoShip(0, -26, Math.PI / 2));

    // Gangway connection to quay
    this.createBlock(0, 2.8, -14, 4.0, 0.5, 6.0, this.materials.accentBlockMaterial, true);

    // Giant Harbor Gantry Crane over Quay
    this.addProp(this.props.createHarborCrane(0, -10, 0));

    // Maze of Stacked Shipping Containers (Tactical Close-Quarters Corridors)
    this.addProp(this.props.createShippingContainersStack(-22, 6, 0));
    this.addProp(this.props.createShippingContainersStack(-8, 12, Math.PI / 2));
    this.addProp(this.props.createShippingContainersStack(8, 12, Math.PI / 2));
    this.addProp(this.props.createShippingContainersStack(22, 6, 0));

    // Port Warehouse (South)
    this.createBlock(0, 3.2, 30, 48, 6.4, 16, this.materials.architecturalPaperMaterial, true);
    this.createBlock(0, 0.8, 22, 10, 1.6, 1.0, this.materials.accentBlockMaterial);
    this.createStairs(-24, 0, 22, 14, 4.0, 0.44, 0.6, 0, 1);
    this.createStairs(24, 0, 22, 14, 4.0, 0.44, 0.6, 0, 1);

    // Pallets, Forklifts, and Sandbags
    this.addProp(this.props.createSandbagBunker(-14, -6, 0));
    this.addProp(this.props.createSandbagBunker(14, -6, 0));
    this.addProp(this.props.createCar(-16, 26, 0.4));
    this.addProp(this.props.createCar(16, 26, -0.4));

    this.playerSpawnPoint.set(0, 1.8, 36);
    this.blueSpawnPoints = [
      new THREE.Vector3(-18, 0.5, 36),
      new THREE.Vector3(-6, 0.5, 37),
      new THREE.Vector3(6, 0.5, 37),
      new THREE.Vector3(18, 0.5, 36),
      new THREE.Vector3(0, 0.5, 35)
    ];
    this.redSpawnPoints = [
      new THREE.Vector3(-18, 0.5, -36),
      new THREE.Vector3(-6, 0.5, -37),
      new THREE.Vector3(6, 0.5, -37),
      new THREE.Vector3(18, 0.5, -36),
      new THREE.Vector3(0, 0.5, -35)
    ];
    this.spawnPoints = [...this.blueSpawnPoints, ...this.redSpawnPoints];
    this.sniperSpawnPoints = [
      new THREE.Vector3(0, 16, -10),
      new THREE.Vector3(0, 6.8, 30)
    ];
  }

  buildSmallMap() { this.buildCityMap(); }
  buildMediumMap() { this.buildTrainStationMap(); }
  buildBigMap() { this.buildSeaPortMap(); }

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
