import * as THREE from 'three';

export class BlueprintProps {
  constructor(materials) {
    this.materials = materials;
  }

  // 1. Walkable House / Architectural Building with Interior
  createHouse(x, z, width = 10, depth = 8, height = 4.5, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    const colliders = [];

    const wallThick = 0.4;
    const doorW = 2.4;
    const doorH = 2.8;

    // Floor slab
    const floorGeom = new THREE.BoxGeometry(width, 0.2, depth);
    const floor = this.materials.createOutlinedMesh(floorGeom, this.materials.architecturalPaperMaterial);
    floor.group.position.set(0, 0.1, 0);
    group.add(floor.group);

    // Ceiling / Flat Roof
    const roofGeom = new THREE.BoxGeometry(width + 0.6, 0.3, depth + 0.6);
    const roof = this.materials.createOutlinedMesh(roofGeom, this.materials.accentBlockMaterial);
    roof.group.position.set(0, height, 0);
    group.add(roof.group);

    // Roof Parapet / Low Wall for rooftop cover
    const parapetH = 0.9;
    const pFrontGeom = new THREE.BoxGeometry(width + 0.6, parapetH, 0.3);
    const pFront = this.materials.createOutlinedMesh(pFrontGeom, this.materials.hatchSurfaceMaterial);
    pFront.group.position.set(0, height + parapetH / 2, -(depth + 0.6) / 2);
    group.add(pFront.group);

    // Front Wall with Doorway
    const halfW = (width - doorW) / 2;
    // Front left wall
    const fLeftGeom = new THREE.BoxGeometry(halfW, height, wallThick);
    const fLeft = this.materials.createOutlinedMesh(fLeftGeom, this.materials.architecturalPaperMaterial);
    fLeft.group.position.set(-width / 2 + halfW / 2, height / 2, -depth / 2);
    group.add(fLeft.group);

    // Front right wall
    const fRightGeom = new THREE.BoxGeometry(halfW, height, wallThick);
    const fRight = this.materials.createOutlinedMesh(fRightGeom, this.materials.architecturalPaperMaterial);
    fRight.group.position.set(width / 2 - halfW / 2, height / 2, -depth / 2);
    group.add(fRight.group);

    // Front lintel above door
    const lintelH = height - doorH;
    const lintelGeom = new THREE.BoxGeometry(doorW, lintelH, wallThick);
    const lintel = this.materials.createOutlinedMesh(lintelGeom, this.materials.accentBlockMaterial);
    lintel.group.position.set(0, doorH + lintelH / 2, -depth / 2);
    group.add(lintel.group);

    // Back Wall with rear doorway
    const bLeft = fLeft.group.clone();
    bLeft.position.z = depth / 2;
    group.add(bLeft);

    const bRight = fRight.group.clone();
    bRight.position.z = depth / 2;
    group.add(bRight);

    const bLintel = lintel.group.clone();
    bLintel.position.z = depth / 2;
    group.add(bLintel);

    // Left Wall
    const lWallGeom = new THREE.BoxGeometry(wallThick, height, depth);
    const lWall = this.materials.createOutlinedMesh(lWallGeom, this.materials.architecturalPaperMaterial);
    lWall.group.position.set(-width / 2, height / 2, 0);
    group.add(lWall.group);

    // Right Wall
    const rWall = lWall.group.clone();
    rWall.position.x = width / 2;
    group.add(rWall);

    // Interior Partition Wall (tactical room divider)
    const partGeom = new THREE.BoxGeometry(wallThick, height, depth * 0.45);
    const part = this.materials.createOutlinedMesh(partGeom, this.materials.hatchSurfaceMaterial);
    part.group.position.set(width * 0.1, height / 2, -depth * 0.25);
    group.add(part.group);

    // AABB Colliders
    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const addCollider = (lx, lz, w, d, h, y = 0) => {
      // Approximate world box
      const wx = x + lx * rotCos - lz * rotSin;
      const wz = z + lx * rotSin + lz * rotCos;
      const hw = (Math.abs(w * rotCos) + Math.abs(d * rotSin)) / 2;
      const hd = (Math.abs(w * rotSin) + Math.abs(d * rotCos)) / 2;
      colliders.push({
        min: new THREE.Vector3(wx - hw, y, wz - hd),
        max: new THREE.Vector3(wx + hw, y + h, wz + hd)
      });
    };

    addCollider(-width / 2 + halfW / 2, -depth / 2, halfW, wallThick, height);
    addCollider(width / 2 - halfW / 2, -depth / 2, halfW, wallThick, height);
    addCollider(-width / 2 + halfW / 2, depth / 2, halfW, wallThick, height);
    addCollider(width / 2 - halfW / 2, depth / 2, halfW, wallThick, height);
    addCollider(-width / 2, 0, wallThick, depth, height);
    addCollider(width / 2, 0, wallThick, depth, height);
    addCollider(width * 0.1, -depth * 0.25, wallThick, depth * 0.45, height);

    // Roof collider (players can mantle/stand on it)
    colliders.push({
      min: new THREE.Vector3(x - width / 2, height - 0.2, z - depth / 2),
      max: new THREE.Vector3(x + width / 2, height + 0.4, z + depth / 2)
    });

    return {
      group,
      colliders,
      mapIcon: { type: 'house', x, z, width, depth, rotation }
    };
  }

  // 2. Blueprint Architectural Foliage Tree
  createTree(x, z, scale = 1.0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Trunk
    const trunkGeom = new THREE.CylinderGeometry(0.22 * scale, 0.35 * scale, 2.5 * scale, 8);
    const trunk = this.materials.createOutlinedMesh(trunkGeom, this.materials.accentBlockMaterial);
    trunk.group.position.set(0, (2.5 * scale) / 2, 0);
    group.add(trunk.group);

    // Tiered polygonal hatched foliage canopies
    const tier1Geom = new THREE.ConeGeometry(2.2 * scale, 2.6 * scale, 7);
    const tier1 = this.materials.createOutlinedMesh(tier1Geom, this.materials.hatchSurfaceMaterial);
    tier1.group.position.set(0, 2.4 * scale, 0);
    group.add(tier1.group);

    const tier2Geom = new THREE.ConeGeometry(1.6 * scale, 2.2 * scale, 7);
    const tier2 = this.materials.createOutlinedMesh(tier2Geom, this.materials.hatchSurfaceMaterial);
    tier2.group.position.set(0, 3.6 * scale, 0);
    group.add(tier2.group);

    const tier3Geom = new THREE.ConeGeometry(1.0 * scale, 1.8 * scale, 6);
    const tier3 = this.materials.createOutlinedMesh(tier3Geom, this.materials.hatchSurfaceMaterial);
    tier3.group.position.set(0, 4.7 * scale, 0);
    group.add(tier3.group);

    const colliders = [
      {
        min: new THREE.Vector3(x - 0.4 * scale, 0, z - 0.4 * scale),
        max: new THREE.Vector3(x + 0.4 * scale, 5.5 * scale, z + 0.4 * scale)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'tree', x, z, radius: 2.2 * scale }
    };
  }

  // 3. Blueprint Tactical Civilian Car / SUV
  createCar(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const carL = 4.4;
    const carW = 2.0;
    const carH = 1.45;

    // Lower Chassis
    const bodyGeom = new THREE.BoxGeometry(carW, 0.75, carL);
    const body = this.materials.createOutlinedMesh(bodyGeom, this.materials.architecturalPaperMaterial);
    body.group.position.set(0, 0.55, 0);
    group.add(body.group);

    // Upper Cabin
    const cabinGeom = new THREE.BoxGeometry(carW * 0.85, 0.65, carL * 0.52);
    const cabin = this.materials.createOutlinedMesh(cabinGeom, this.materials.hatchSurfaceMaterial);
    cabin.group.position.set(0, 1.25, -0.2);
    group.add(cabin.group);

    // Front Hood Slope / Windshield accent
    const hoodGeom = new THREE.BoxGeometry(carW * 0.82, 0.1, 1.2);
    const hood = this.materials.createOutlinedMesh(hoodGeom, this.materials.accentBlockMaterial);
    hood.group.position.set(0, 0.95, -1.3);
    group.add(hood.group);

    // Wheels (4 cylinders)
    const wheelGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelPositions = [
      [-carW / 2 - 0.05, 0.38, -1.3],
      [carW / 2 + 0.05, 0.38, -1.3],
      [-carW / 2 - 0.05, 0.38, 1.3],
      [carW / 2 + 0.05, 0.38, 1.3]
    ];
    wheelPositions.forEach(pos => {
      const wheel = this.materials.createOutlinedMesh(wheelGeom, this.materials.accentBlockMaterial);
      wheel.group.position.set(...pos);
      group.add(wheel.group);
    });

    // Bumpers
    const fBumpGeom = new THREE.BoxGeometry(carW * 0.95, 0.25, 0.25);
    const fBump = this.materials.createOutlinedMesh(fBumpGeom, this.materials.accentBlockMaterial);
    fBump.group.position.set(0, 0.35, -carL / 2);
    group.add(fBump.group);

    const rBump = fBump.group.clone();
    rBump.position.z = carL / 2;
    group.add(rBump);

    // Collider
    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(carW * rotCos) + Math.abs(carL * rotSin)) / 2;
    const hd = (Math.abs(carW * rotSin) + Math.abs(carL * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, carH, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'car', x, z, width: carW, depth: carL, rotation }
    };
  }

  // 4. Blueprint City Transit Bus
  createBus(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const busL = 9.6;
    const busW = 2.6;
    const busH = 2.9;

    // Main Bus Body
    const bodyGeom = new THREE.BoxGeometry(busW, busH - 0.5, busL);
    const body = this.materials.createOutlinedMesh(bodyGeom, this.materials.architecturalPaperMaterial);
    body.group.position.set(0, busH / 2 + 0.25, 0);
    group.add(body.group);

    // Window Strip Bands (Dark blue blueprint hatch)
    const winGeom = new THREE.BoxGeometry(busW + 0.04, 0.9, busL * 0.85);
    const win = this.materials.createOutlinedMesh(winGeom, this.materials.hatchSurfaceMaterial);
    win.group.position.set(0, 1.8, -0.2);
    group.add(win.group);

    // Front Windshield
    const fWindGeom = new THREE.BoxGeometry(busW * 0.9, 1.1, 0.1);
    const fWind = this.materials.createOutlinedMesh(fWindGeom, this.materials.accentBlockMaterial);
    fWind.group.position.set(0, 1.8, -busL / 2 - 0.02);
    group.add(fWind.group);

    // 6 Wheels
    const wheelGeom = new THREE.CylinderGeometry(0.48, 0.48, 0.35, 14);
    wheelGeom.rotateZ(Math.PI / 2);
    const wheelPos = [
      [-busW / 2 - 0.08, 0.48, -2.8],
      [busW / 2 + 0.08, 0.48, -2.8],
      [-busW / 2 - 0.08, 0.48, 2.0],
      [busW / 2 + 0.08, 0.48, 2.0],
      [-busW / 2 - 0.08, 0.48, 3.2],
      [busW / 2 + 0.08, 0.48, 3.2]
    ];
    wheelPos.forEach(p => {
      const w = this.materials.createOutlinedMesh(wheelGeom, this.materials.accentBlockMaterial);
      w.group.position.set(...p);
      group.add(w.group);
    });

    // Rooftop AC Units / Hatches
    const acGeom = new THREE.BoxGeometry(1.4, 0.35, 2.2);
    const ac = this.materials.createOutlinedMesh(acGeom, this.materials.accentBlockMaterial);
    ac.group.position.set(0, busH + 0.18, 0);
    group.add(ac.group);

    // Collider
    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(busW * rotCos) + Math.abs(busL * rotSin)) / 2;
    const hd = (Math.abs(busW * rotSin) + Math.abs(busL * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, busH + 0.35, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'bus', x, z, width: busW, depth: busL, rotation }
    };
  }

  // 5. Sandbag Bunker (Curved waist-high barricade)
  createSandbagBunker(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const bH = 0.95; // Waist-high: ideal for COD slide & mantle!
    const bW = 3.6;

    const frontGeom = new THREE.BoxGeometry(bW, bH, 0.6);
    const front = this.materials.createOutlinedMesh(frontGeom, this.materials.hatchSurfaceMaterial);
    front.group.position.set(0, bH / 2, -1.0);
    group.add(front.group);

    const lSideGeom = new THREE.BoxGeometry(0.6, bH, 1.8);
    const lSide = this.materials.createOutlinedMesh(lSideGeom, this.materials.hatchSurfaceMaterial);
    lSide.group.position.set(-bW / 2 + 0.3, bH / 2, -0.1);
    group.add(lSide.group);

    const rSide = lSide.group.clone();
    rSide.position.x = bW / 2 - 0.3;
    group.add(rSide);

    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(bW * rotCos) + Math.abs(2.0 * rotSin)) / 2;
    const hd = (Math.abs(bW * rotSin) + Math.abs(2.0 * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, bH, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'bunker', x, z, width: bW, depth: 2.0, rotation }
    };
  }

  // 6. Train Locomotive & Passenger Carriage
  createTrain(x, z, length = 20, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const trainW = 3.2;
    const trainH = 3.6;
    const halfL = length / 2;

    // Main train body box
    const bodyGeom = new THREE.BoxGeometry(trainW, trainH, length);
    const body = this.materials.createOutlinedMesh(bodyGeom, this.materials.architecturalPaperMaterial);
    body.group.position.set(0, trainH / 2 + 0.6, 0);
    group.add(body.group);

    // Arched / accent roof
    const roofGeom = new THREE.BoxGeometry(trainW + 0.2, 0.4, length + 0.2);
    const roof = this.materials.createOutlinedMesh(roofGeom, this.materials.accentBlockMaterial);
    roof.group.position.set(0, trainH + 0.8, 0);
    group.add(roof.group);

    // Wheels / Bogie base
    const bogieGeom = new THREE.BoxGeometry(trainW - 0.4, 0.6, length - 1.0);
    const bogie = this.materials.createOutlinedMesh(bogieGeom, this.materials.hatchSurfaceMaterial);
    bogie.group.position.set(0, 0.3, 0);
    group.add(bogie.group);

    // Cab / Cowcatcher at front (+Z)
    const cowGeom = new THREE.BoxGeometry(trainW + 0.2, 1.0, 1.2);
    const cow = this.materials.createOutlinedMesh(cowGeom, this.materials.hatchSurfaceMaterial);
    cow.group.position.set(0, 0.6, halfL + 0.4);
    group.add(cow.group);

    // Side window slits along carriage
    const windowCount = Math.floor(length / 2.8);
    for (let i = 0; i < windowCount; i++) {
      const wz = -halfL + 2.0 + i * 2.8;
      const winGeom = new THREE.BoxGeometry(trainW + 0.08, 0.9, 1.6);
      const winMesh = this.materials.createOutlinedMesh(winGeom, this.materials.accentBlockMaterial);
      winMesh.group.position.set(0, trainH / 2 + 1.1, wz);
      group.add(winMesh.group);
    }

    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(trainW * rotCos) + Math.abs((length + 1) * rotSin)) / 2;
    const hd = (Math.abs(trainW * rotSin) + Math.abs((length + 1) * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, trainH + 1.0, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'train', x, z, width: trainW, depth: length, rotation }
    };
  }

  // 7. Train Tracks
  createTrainTracks(x, z, length = 36, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const railGauge = 2.0;
    const halfL = length / 2;

    // Dual steel rails
    [-railGauge / 2, railGauge / 2].forEach(rx => {
      const railGeom = new THREE.BoxGeometry(0.16, 0.2, length);
      const rail = this.materials.createOutlinedMesh(railGeom, this.materials.accentBlockMaterial);
      rail.group.position.set(rx, 0.2, 0);
      group.add(rail.group);
    });

    // Wooden cross ties (sleepers)
    const tieCount = Math.floor(length / 1.2);
    for (let i = 0; i < tieCount; i++) {
      const tz = -halfL + 0.6 + i * 1.2;
      const tieGeom = new THREE.BoxGeometry(railGauge + 0.8, 0.14, 0.35);
      const tie = this.materials.createOutlinedMesh(tieGeom, this.materials.hatchSurfaceMaterial);
      tie.group.position.set(0, 0.07, tz);
      group.add(tie.group);
    }

    return { group, colliders: [] };
  }

  // 8. Commercial Airliner Jet (Airport Terminal)
  createAirplane(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const fuseL = 26;
    const fuseW = 3.6;
    const fuseH = 3.8;
    const wingSpan = 22;

    // Fuselage cylinder / box
    const fuseGeom = new THREE.BoxGeometry(fuseW, fuseH, fuseL);
    const fuse = this.materials.createOutlinedMesh(fuseGeom, this.materials.architecturalPaperMaterial);
    fuse.group.position.set(0, fuseH / 2 + 1.2, 0);
    group.add(fuse.group);

    // Nose Cone
    const noseGeom = new THREE.BoxGeometry(fuseW - 0.4, fuseH - 0.6, 3.5);
    const nose = this.materials.createOutlinedMesh(noseGeom, this.materials.accentBlockMaterial);
    nose.group.position.set(0, fuseH / 2 + 1.1, fuseL / 2 + 1.7);
    group.add(nose.group);

    // Wings
    const wingGeom = new THREE.BoxGeometry(wingSpan, 0.4, 4.8);
    const wings = this.materials.createOutlinedMesh(wingGeom, this.materials.hatchSurfaceMaterial);
    wings.group.position.set(0, fuseH / 2 + 0.8, 0);
    group.add(wings.group);

    // Jet Engines under wings
    [-5.5, 5.5].forEach(ex => {
      const engGeom = new THREE.BoxGeometry(1.6, 1.6, 3.2);
      const eng = this.materials.createOutlinedMesh(engGeom, this.materials.accentBlockMaterial);
      eng.group.position.set(ex, fuseH / 2 - 0.4, 0.4);
      group.add(eng.group);
    });

    // Vertical Tail Fin
    const finGeom = new THREE.BoxGeometry(0.4, 4.2, 4.0);
    const fin = this.materials.createOutlinedMesh(finGeom, this.materials.hatchSurfaceMaterial);
    fin.group.position.set(0, fuseH + 2.8, -fuseL / 2 + 2.2);
    group.add(fin.group);

    // Horizontal Stabilizers
    const stabGeom = new THREE.BoxGeometry(8.0, 0.3, 2.2);
    const stab = this.materials.createOutlinedMesh(stabGeom, this.materials.accentBlockMaterial);
    stab.group.position.set(0, fuseH + 1.2, -fuseL / 2 + 1.2);
    group.add(stab.group);

    // Landing Gear Legs
    [[-1.8, 2.0], [1.8, 2.0], [0, fuseL / 2 - 2.0]].forEach(pos => {
      const legGeom = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      const leg = this.materials.createOutlinedMesh(legGeom, this.materials.blueInkLineMaterial);
      leg.group.position.set(pos[0], 0.6, pos[1]);
      group.add(leg.group);
    });

    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(wingSpan * rotCos) + Math.abs(fuseL * rotSin)) / 2;
    const hd = (Math.abs(wingSpan * rotSin) + Math.abs(fuseL * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, fuseH + 2.0, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'plane', x, z, width: wingSpan, depth: fuseL, rotation }
    };
  }

  // 9. Airport Control Tower
  createControlTower(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const baseH = 14;
    const baseW = 5.0;

    // Concrete tower shaft
    const shaftGeom = new THREE.BoxGeometry(baseW, baseH, baseW);
    const shaft = this.materials.createOutlinedMesh(shaftGeom, this.materials.architecturalPaperMaterial);
    shaft.group.position.set(0, baseH / 2, 0);
    group.add(shaft.group);

    // Hex/Octagonal observation cab
    const cabGeom = new THREE.BoxGeometry(baseW + 2.8, 3.2, baseW + 2.8);
    const cab = this.materials.createOutlinedMesh(cabGeom, this.materials.accentBlockMaterial);
    cab.group.position.set(0, baseH + 1.6, 0);
    group.add(cab.group);

    // Radar dome on roof
    const radGeom = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const rad = this.materials.createOutlinedMesh(radGeom, this.materials.hatchSurfaceMaterial);
    rad.group.position.set(0, baseH + 4.1, 0);
    group.add(rad.group);

    // Antenna needle
    const antGeom = new THREE.BoxGeometry(0.2, 3.5, 0.2);
    const ant = this.materials.createOutlinedMesh(antGeom, this.materials.blueInkLineMaterial);
    ant.group.position.set(0, baseH + 6.0, 0);
    group.add(ant.group);

    const colliders = [
      {
        min: new THREE.Vector3(x - baseW / 2, 0, z - baseW / 2),
        max: new THREE.Vector3(x + baseW / 2, baseH + 5, z + baseW / 2)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'tower', x, z, width: baseW + 2, depth: baseW + 2, rotation: 0 }
    };
  }

  // 10. Giant Parabolic Satellite Dish (TV Station)
  createSatelliteDish(x, z, scale = 1.0, pitch = 0.4) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Tripod Base
    const baseGeom = new THREE.BoxGeometry(3.0 * scale, 1.2 * scale, 3.0 * scale);
    const base = this.materials.createOutlinedMesh(baseGeom, this.materials.hatchSurfaceMaterial);
    base.group.position.set(0, 0.6 * scale, 0);
    group.add(base.group);

    // Swivel mount
    const mountGeom = new THREE.BoxGeometry(1.0 * scale, 2.0 * scale, 1.0 * scale);
    const mount = this.materials.createOutlinedMesh(mountGeom, this.materials.accentBlockMaterial);
    mount.group.position.set(0, 1.8 * scale, 0);
    group.add(mount.group);

    // Parabolic dish head (tilted)
    const dishHead = new THREE.Group();
    dishHead.position.set(0, 2.8 * scale, 0);
    dishHead.rotation.x = pitch;

    const dishGeom = new THREE.BoxGeometry(5.4 * scale, 5.4 * scale, 0.5 * scale);
    const dish = this.materials.createOutlinedMesh(dishGeom, this.materials.architecturalPaperMaterial);
    dishHead.add(dish.group);

    // Feed horn center boom
    const hornGeom = new THREE.BoxGeometry(0.3 * scale, 0.3 * scale, 2.4 * scale);
    const horn = this.materials.createOutlinedMesh(hornGeom, this.materials.blueInkLineMaterial);
    horn.group.position.set(0, 0, 1.2 * scale);
    dishHead.add(horn.group);

    group.add(dishHead);

    const s = 3.2 * scale;
    const colliders = [
      {
        min: new THREE.Vector3(x - s / 2, 0, z - s / 2),
        max: new THREE.Vector3(x + s / 2, 4.5 * scale, z + s / 2)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'dish', x, z, width: s, depth: s, rotation: 0 }
    };
  }

  // 11. Broadcast Transmission Tower (TV Station)
  createBroadcastTower(x, z, height = 24) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Tapered lattice tiers
    const tiers = 4;
    const tierH = height / tiers;
    for (let i = 0; i < tiers; i++) {
      const tw = (tiers - i) * 1.4 + 1.0;
      const tGeom = new THREE.BoxGeometry(tw, tierH, tw);
      const tMesh = this.materials.createOutlinedMesh(tGeom, this.materials.hatchSurfaceMaterial);
      tMesh.group.position.set(0, (i + 0.5) * tierH, 0);
      group.add(tMesh.group);
    }

    // Top antenna spire & red beacon
    const spireGeom = new THREE.BoxGeometry(0.3, 5.0, 0.3);
    const spire = this.materials.createOutlinedMesh(spireGeom, this.materials.blueInkLineMaterial);
    spire.group.position.set(0, height + 2.5, 0);
    group.add(spire.group);

    const beaconGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const beacon = this.materials.createOutlinedMesh(beaconGeom, this.materials.accentBlockMaterial);
    beacon.group.position.set(0, height + 5.2, 0);
    group.add(beacon.group);

    const baseW = tiers * 1.4 + 1.0;
    const colliders = [
      {
        min: new THREE.Vector3(x - baseW / 2, 0, z - baseW / 2),
        max: new THREE.Vector3(x + baseW / 2, height, z + baseW / 2)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'antenna', x, z, width: baseW, depth: baseW, rotation: 0 }
    };
  }

  // 12. Moored Cargo Container Ship (Sea Port)
  createCargoShip(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const shipL = 36;
    const shipW = 10;
    const shipH = 5.2;

    // Main hull
    const hullGeom = new THREE.BoxGeometry(shipW, shipH, shipL);
    const hull = this.materials.createOutlinedMesh(hullGeom, this.materials.architecturalPaperMaterial);
    hull.group.position.set(0, shipH / 2, 0);
    group.add(hull.group);

    // Tapered bow wedge (+Z)
    const bowGeom = new THREE.BoxGeometry(shipW - 1.5, shipH, 6.0);
    const bow = this.materials.createOutlinedMesh(bowGeom, this.materials.accentBlockMaterial);
    bow.group.position.set(0, shipH / 2, shipL / 2 + 2.8);
    group.add(bow.group);

    // Bridge superstructure at stern (-Z)
    const bridgeW = 8;
    const bridgeH = 6;
    const bridgeL = 7;
    const bridgeGeom = new THREE.BoxGeometry(bridgeW, bridgeH, bridgeL);
    const bridge = this.materials.createOutlinedMesh(bridgeGeom, this.materials.hatchSurfaceMaterial);
    bridge.group.position.set(0, shipH + bridgeH / 2, -shipL / 2 + bridgeL / 2 + 1.5);
    group.add(bridge.group);

    // Bridge Navigation Cab & Radar
    const navGeom = new THREE.BoxGeometry(bridgeW + 1.2, 1.8, bridgeL - 1.5);
    const nav = this.materials.createOutlinedMesh(navGeom, this.materials.accentBlockMaterial);
    nav.group.position.set(0, shipH + bridgeH + 0.9, -shipL / 2 + bridgeL / 2 + 1.5);
    group.add(nav.group);

    // Containers loaded on deck
    const cColors = [this.materials.accentBlockMaterial, this.materials.hatchSurfaceMaterial];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const cx = (r === 0 ? -2.2 : 2.2);
        const cz = -4 + c * 6.2;
        const contGeom = new THREE.BoxGeometry(3.6, 2.8, 5.8);
        const cont = this.materials.createOutlinedMesh(contGeom, cColors[(r + c) % 2]);
        cont.group.position.set(cx, shipH + 1.4, cz);
        group.add(cont.group);
      }
    }

    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(shipW * rotCos) + Math.abs((shipL + 6) * rotSin)) / 2;
    const hd = (Math.abs(shipW * rotSin) + Math.abs((shipL + 6) * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, shipH + bridgeH + 2, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'ship', x, z, width: shipW, depth: shipL + 6, rotation }
    };
  }

  // 13. Stacked Shipping Containers (Tactical Maze Corridors)
  createShippingContainersStack(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const cW = 2.8;
    const cH = 2.6;
    const cL = 6.4;

    // 2x2 container block with tactical gap
    const containers = [
      { x: -cW / 2 - 0.1, y: cH / 2, z: -cL / 2, mat: this.materials.accentBlockMaterial },
      { x: cW / 2 + 0.1, y: cH / 2, z: -cL / 2, mat: this.materials.hatchSurfaceMaterial },
      { x: -cW / 2 - 0.1, y: cH / 2, z: cL / 2 + 0.4, mat: this.materials.hatchSurfaceMaterial },
      { x: cW / 2 + 0.1, y: cH / 2, z: cL / 2 + 0.4, mat: this.materials.accentBlockMaterial },
      // Second story container
      { x: 0, y: cH + cH / 2, z: 0, mat: this.materials.architecturalPaperMaterial }
    ];

    containers.forEach(c => {
      const geom = new THREE.BoxGeometry(cW, cH, cL);
      const mesh = this.materials.createOutlinedMesh(geom, c.mat);
      mesh.group.position.set(c.x, c.y, c.z);
      group.add(mesh.group);
    });

    const totalW = cW * 2 + 0.6;
    const totalL = cL * 2 + 0.8;
    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(totalW * rotCos) + Math.abs(totalL * rotSin)) / 2;
    const hd = (Math.abs(totalW * rotSin) + Math.abs(totalL * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, cH * 2, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'containers', x, z, width: totalW, depth: totalL, rotation }
    };
  }

  // 14. Giant Harbor Gantry Crane (Sea Port)
  createHarborCrane(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const craneH = 16;
    const spanW = 14;

    // 4 Tall structural legs
    [[-spanW / 2, -3], [spanW / 2, -3], [-spanW / 2, 3], [spanW / 2, 3]].forEach(pos => {
      const legGeom = new THREE.BoxGeometry(0.8, craneH, 0.8);
      const leg = this.materials.createOutlinedMesh(legGeom, this.materials.hatchSurfaceMaterial);
      leg.group.position.set(pos[0], craneH / 2, pos[1]);
      group.add(leg.group);
    });

    // Cross Girder Bridge atop legs
    const bridgeGeom = new THREE.BoxGeometry(spanW + 2, 1.4, 8);
    const bridge = this.materials.createOutlinedMesh(bridgeGeom, this.materials.accentBlockMaterial);
    bridge.group.position.set(0, craneH - 0.7, 0);
    group.add(bridge.group);

    // Extended Jib Boom over water (+X)
    const boomGeom = new THREE.BoxGeometry(16, 1.4, 2.4);
    const boom = this.materials.createOutlinedMesh(boomGeom, this.materials.architecturalPaperMaterial);
    boom.group.position.set(spanW / 2 + 7, craneH - 0.7, 0);
    group.add(boom.group);

    // Hoist Trolley
    const trolleyGeom = new THREE.BoxGeometry(2.0, 1.2, 2.0);
    const trolley = this.materials.createOutlinedMesh(trolleyGeom, this.materials.hatchSurfaceMaterial);
    trolley.group.position.set(spanW / 2 + 5, craneH - 2.0, 0);
    group.add(trolley.group);

    const colliders = [
      { min: new THREE.Vector3(x - spanW / 2 - 1, 0, z - 4), max: new THREE.Vector3(x - spanW / 2 + 1, craneH, z + 4) },
      { min: new THREE.Vector3(x + spanW / 2 - 1, 0, z - 4), max: new THREE.Vector3(x + spanW / 2 + 1, craneH, z + 4) }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'crane', x, z, width: spanW, depth: 8, rotation }
    };
  }

  // 15. Village Windmill with 4 Rotating Blades
  createWindmill(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const millH = 11;
    const millR = 4.2;

    // Tapered windmill tower
    const towerGeom = new THREE.BoxGeometry(millR, millH, millR);
    const tower = this.materials.createOutlinedMesh(towerGeom, this.materials.architecturalPaperMaterial);
    tower.group.position.set(0, millH / 2, 0);
    group.add(tower.group);

    // Domed / conical cap roof
    const capGeom = new THREE.BoxGeometry(millR + 0.6, 2.2, millR + 0.6);
    const cap = this.materials.createOutlinedMesh(capGeom, this.materials.accentBlockMaterial);
    cap.group.position.set(0, millH + 1.1, 0);
    group.add(cap.group);

    // Rotating Sails Group
    const sailsGroup = new THREE.Group();
    sailsGroup.position.set(0, millH + 0.8, millR / 2 + 0.4);

    // Central axle hub
    const hubGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const hub = this.materials.createOutlinedMesh(hubGeom, this.materials.accentBlockMaterial);
    sailsGroup.add(hub.group);

    // 4 Lattice wooden blades
    const bladeL = 6.2;
    for (let b = 0; b < 4; b++) {
      const angle = (b * Math.PI) / 2;
      const bladeGeom = new THREE.BoxGeometry(0.9, bladeL, 0.15);
      const blade = this.materials.createOutlinedMesh(bladeGeom, this.materials.hatchSurfaceMaterial);
      blade.group.position.set(
        Math.sin(angle) * (bladeL / 2),
        Math.cos(angle) * (bladeL / 2),
        0
      );
      blade.group.rotation.z = -angle;
      sailsGroup.add(blade.group);
    }

    group.add(sailsGroup);

    // Store reference for level animation tick
    group.userData = { sails: sailsGroup };

    const colliders = [
      {
        min: new THREE.Vector3(x - millR / 2, 0, z - millR / 2),
        max: new THREE.Vector3(x + millR / 2, millH + 2.5, z + millR / 2)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'windmill', x, z, width: millR, depth: millR, rotation: 0 }
    };
  }

  // 16. Rustic Barn (Highland Village)
  createBarn(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const bW = 12;
    const bD = 15;
    const bH = 5.8;

    // Main barn hall
    const hallGeom = new THREE.BoxGeometry(bW, bH, bD);
    const hall = this.materials.createOutlinedMesh(hallGeom, this.materials.architecturalPaperMaterial);
    hall.group.position.set(0, bH / 2, 0);
    group.add(hall.group);

    // Gambrel / Gabled roof
    const roofGeom = new THREE.BoxGeometry(bW + 0.8, 2.2, bD + 0.8);
    const roof = this.materials.createOutlinedMesh(roofGeom, this.materials.accentBlockMaterial);
    roof.group.position.set(0, bH + 1.1, 0);
    group.add(roof.group);

    // Large double barn doors front & back
    [-bD / 2 - 0.05, bD / 2 + 0.05].forEach(dz => {
      const doorGeom = new THREE.BoxGeometry(3.6, 3.8, 0.1);
      const door = this.materials.createOutlinedMesh(doorGeom, this.materials.hatchSurfaceMaterial);
      door.group.position.set(0, 1.9, dz);
      group.add(door.group);
    });

    const rotCos = Math.cos(rotation);
    const rotSin = Math.sin(rotation);
    const hw = (Math.abs(bW * rotCos) + Math.abs(bD * rotSin)) / 2;
    const hd = (Math.abs(bW * rotSin) + Math.abs(bD * rotCos)) / 2;
    const colliders = [
      {
        min: new THREE.Vector3(x - hw, 0, z - hd),
        max: new THREE.Vector3(x + hw, bH + 2.2, z + hd)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'barn', x, z, width: bW, depth: bD, rotation }
    };
  }

  // 17. Hay Bales & Stone Wall (Cover)
  createHayBales(x, z, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;

    const bH = 1.1; // Perfect waist-high cover
    const bW = 3.2;
    const bD = 2.0;

    const geom = new THREE.BoxGeometry(bW, bH, bD);
    const mesh = this.materials.createOutlinedMesh(geom, this.materials.hatchSurfaceMaterial);
    mesh.group.position.set(0, bH / 2, 0);
    group.add(mesh.group);

    const colliders = [
      { min: new THREE.Vector3(x - bW / 2, 0, z - bD / 2), max: new THREE.Vector3(x + bW / 2, bH, z + bD / 2) }
    ];

    return { group, colliders, mapIcon: { type: 'hay', x, z, width: bW, depth: bD, rotation } };
  }

  // 18. City Skyscraper Tower (Metropolis Downtown)
  createSkyscraper(x, z, width = 14, depth = 14, floors = 6) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const floorH = 3.4;
    const totalH = floors * floorH;

    // Main tower mass
    const towerGeom = new THREE.BoxGeometry(width, totalH, depth);
    const tower = this.materials.createOutlinedMesh(towerGeom, this.materials.architecturalPaperMaterial);
    tower.group.position.set(0, totalH / 2, 0);
    group.add(tower.group);

    // Floor division horizontal lines
    for (let f = 1; f < floors; f++) {
      const beltGeom = new THREE.BoxGeometry(width + 0.15, 0.4, depth + 0.15);
      const belt = this.materials.createOutlinedMesh(beltGeom, this.materials.accentBlockMaterial);
      belt.group.position.set(0, f * floorH, 0);
      group.add(belt.group);
    }

    // Rooftop elevator penthouse
    const pentGeom = new THREE.BoxGeometry(width * 0.45, 2.8, depth * 0.45);
    const pent = this.materials.createOutlinedMesh(pentGeom, this.materials.hatchSurfaceMaterial);
    pent.group.position.set(0, totalH + 1.4, 0);
    group.add(pent.group);

    // Communication Spire
    const spireGeom = new THREE.BoxGeometry(0.25, 4.2, 0.25);
    const spire = this.materials.createOutlinedMesh(spireGeom, this.materials.blueInkLineMaterial);
    spire.group.position.set(0, totalH + 4.9, 0);
    group.add(spire.group);

    const colliders = [
      {
        min: new THREE.Vector3(x - width / 2, 0, z - depth / 2),
        max: new THREE.Vector3(x + width / 2, totalH + 3, z + depth / 2)
      }
    ];

    return {
      group,
      colliders,
      mapIcon: { type: 'skyscraper', x, z, width, depth, rotation: 0 }
    };
  }
}
