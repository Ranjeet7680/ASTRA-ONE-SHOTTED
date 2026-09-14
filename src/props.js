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
}
