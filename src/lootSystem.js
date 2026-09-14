import * as THREE from 'three';

// Professional Ground Loot & Contextual Pickup System for ASTRA: One Shotted
// Spawns 3D blueprint loot crates upon enemy death or at supply zones,
// tracks proximity to player, and provides contextual pickup data to HUD & Mobile Controls.

export class LootSystem {
  constructor(scene, materials, soundEngine, effects, level) {
    this.scene = scene;
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.level = level;

    this.items = []; // Active ground loot items
    this.nearbyItems = []; // Items within player interact range (<= 2.8m)
    this.pickupRadius = 2.8;

    this.onNearbyItemsChanged = null; // Callback: (items) => void

    // Shared geometries for performance
    this.crateGeometry = new THREE.BoxGeometry(0.48, 0.28, 0.36);
    this.medkitGeometry = new THREE.BoxGeometry(0.42, 0.24, 0.32);
    this.beaconRingGeometry = new THREE.RingGeometry(0.25, 0.5, 24);
    this.beaconRingGeometry.rotateX(-Math.PI / 2);

    // Initial map supply points
    this.spawnInitialSupplies();
  }

  spawnInitialSupplies() {
    // Drop a few tactical supply crates across the arena
    const supplyPoints = [
      { x: 0, z: 0, type: 'MEDKIT', name: 'TACTICAL MEDKIT', sub: 'RESTORES 50 HP' },
      { x: -8, z: -8, type: 'AMMO_556', name: '5.56mm AMMO (x60)', sub: 'RIFLE ROUNDS' },
      { x: 8, z: 8, type: 'GRENADE', name: 'FRAG GRENADE', sub: 'ORDNANCE x1' },
      { x: -10, z: 10, type: 'AMMO_SNIPER', name: '7.62mm SNIPER (x15)', sub: 'HIGH CALIBER' },
      { x: 10, z: -10, type: 'AMMO_SHELLS', name: '12G BUCKSHOT (x18)', sub: 'SHOTGUN SHELLS' }
    ];

    supplyPoints.forEach(p => {
      this.spawnLoot(new THREE.Vector3(p.x, 0.15, p.z), p.type, p.name, p.sub);
    });
  }

  // Spawn loot at position (e.g. when enemy is eliminated)
  spawnLoot(position, type = 'AMMO_556', name = '5.56 AMMO', sub = '60 ROUNDS') {
    const group = new THREE.Group();
    group.position.copy(position);

    // Blueprint Material
    const isMedkit = type === 'MEDKIT';
    const isGrenade = type === 'GRENADE';

    const boxMat = new THREE.MeshBasicMaterial({
      color: isMedkit ? 0xf4f0e6 : (isGrenade ? 0x223875 : 0xe8e4d8),
      wireframe: false
    });

    const boxGeom = isMedkit ? this.medkitGeometry : this.crateGeometry;
    const mesh = new THREE.Mesh(boxGeom, boxMat);
    mesh.position.y = 0.14;
    group.add(mesh);

    // Blueprint outline edges
    const edges = new THREE.EdgesGeometry(boxGeom);
    const lineMat = new THREE.LineBasicMaterial({
      color: isMedkit ? 0xc9182b : 0x162a68,
      linewidth: 2
    });
    const line = new THREE.LineSegments(edges, lineMat);
    line.position.copy(mesh.position);
    group.add(line);

    // Ground blueprint beacon circle
    const beaconMat = new THREE.MeshBasicMaterial({
      color: isMedkit ? 0xc9182b : 0x2255bb,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const beacon = new THREE.Mesh(this.beaconRingGeometry, beaconMat);
    beacon.position.y = 0.02;
    group.add(beacon);

    this.scene.add(group);

    const itemData = {
      id: 'loot_' + Math.random().toString(36).substr(2, 9),
      type,
      name,
      sub,
      position: position.clone(),
      group,
      beacon,
      mesh,
      createdTime: performance.now(),
      distance: 999
    };

    this.items.push(itemData);
    return itemData;
  }

  // Handle enemy drop upon elimination
  handleEnemyDrop(enemyPos) {
    const types = [
      { type: 'AMMO_556', name: '5.56 AMMO', sub: 'CARBINE 45 ROUNDS' },
      { type: 'AMMO_SHELLS', name: '12G SHELLS', sub: '12 GAUGE 12 ROUNDS' },
      { type: 'AMMO_SNIPER', name: '7.62 AMMO', sub: 'SNIPER 8 ROUNDS' },
      { type: 'MEDKIT', name: 'STIM PACK', sub: 'RESTORES 40 HP' },
      { type: 'GRENADE', name: 'FRAG GRENADE', sub: 'EXPLOSIVE x1' }
    ];

    const pick = types[Math.floor(Math.random() * types.length)];
    const dropPos = enemyPos.clone();
    dropPos.y = 0.15;
    this.spawnLoot(dropPos, pick.type, pick.name, pick.sub);
  }

  // Pickup an item by item object or ID
  pickupItem(itemOrId, player, weapons, hud) {
    const item = typeof itemOrId === 'string'
      ? this.items.find(i => i.id === itemOrId)
      : itemOrId;

    if (!item) return false;

    // Apply item effect
    let applied = false;
    switch (item.type) {
      case 'AMMO_556':
      case 'AMMO_SHELLS':
      case 'AMMO_SNIPER':
      case 'AMMO_PISTOL':
        if (weapons) {
          weapons.addAmmo(45);
          applied = true;
        }
        break;
      case 'MEDKIT':
        if (player) {
          player.hp = Math.min(player.maxHp, player.hp + 50);
          applied = true;
        }
        break;
      case 'GRENADE':
        if (player) {
          player.grenadeCount = Math.min(player.maxGrenades, player.grenadeCount + 1);
          if (hud) hud.updateGrenades(player.grenadeCount);
          applied = true;
        }
        break;
      default:
        if (weapons) {
          weapons.addAmmo(30);
          applied = true;
        }
        break;
    }

    // Audio & Feedback
    if (this.soundEngine && this.soundEngine.playUIClick) {
      this.soundEngine.playUIClick();
    }

    // Remove from 3D scene
    this.scene.remove(item.group);

    // Remove from lists
    this.items = this.items.filter(i => i.id !== item.id);
    this.nearbyItems = this.nearbyItems.filter(i => i.id !== item.id);

    if (this.onNearbyItemsChanged) {
      this.onNearbyItemsChanged(this.nearbyItems);
    }

    return true;
  }

  // Pickup all items currently in range
  pickupAll(player, weapons, hud) {
    const toPick = [...this.nearbyItems];
    toPick.forEach(item => {
      this.pickupItem(item, player, weapons, hud);
    });
  }

  // Per-frame update: check player proximity, animate beacon rings
  update(delta, playerPos) {
    if (!playerPos) return;

    const prevCount = this.nearbyItems.length;
    this.nearbyItems = [];

    const now = performance.now() * 0.003;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const dist = item.position.distanceTo(playerPos);
      item.distance = dist;

      // Subtle float and rotation animation
      if (item.mesh) {
        item.mesh.rotation.y += delta * 0.8;
      }
      if (item.beacon) {
        const pulse = 0.35 + 0.25 * Math.sin(now + i);
        item.beacon.material.opacity = pulse;
      }

      if (dist <= this.pickupRadius) {
        this.nearbyItems.push(item);
      }
    }

    // Sort nearby items: closest first
    this.nearbyItems.sort((a, b) => a.distance - b.distance);

    // Notify listeners if nearby items changed
    if (this.onNearbyItemsChanged && (this.nearbyItems.length > 0 || prevCount > 0)) {
      this.onNearbyItemsChanged(this.nearbyItems);
    }
  }

  reset() {
    this.items.forEach(item => {
      this.scene.remove(item.group);
    });
    this.items = [];
    this.nearbyItems = [];
    this.spawnInitialSupplies();
    if (this.onNearbyItemsChanged) {
      this.onNearbyItemsChanged([]);
    }
  }
}
