import * as THREE from 'three';
import { randomRange } from './utilities.js';

export class Grenade {
  constructor(position, direction, speed, materials, soundEngine, effects, sourceEntity) {
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.sourceEntity = sourceEntity; // player or bot

    this.position = position.clone();
    this.velocity = direction.clone().multiplyScalar(speed);
    // Add slight upward pitch to throw arc
    this.velocity.y += 3.5;

    this.fuseTime = 2.2;
    this.isExploded = false;
    this.radius = 0.22;
    this.explosionRadius = 8.5;
    this.maxDamage = 135;

    // 3D Procedural Blueprint Grenade Mesh
    this.mesh = this.buildGrenadeMesh();
    this.mesh.position.copy(this.position);

    // Random tumble angular velocity
    this.rotVel = new THREE.Vector3(
      randomRange(-6, 6),
      randomRange(-6, 6),
      randomRange(-6, 6)
    );
  }

  buildGrenadeMesh() {
    const group = new THREE.Group();

    // Ribbed canister body
    const bodyGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.24, 8);
    const body = this.materials.createOutlinedMesh(
      bodyGeom,
      this.materials.hatchSurfaceMaterial,
      this.materials.blueInkLineMaterial
    );
    group.add(body.group);

    // Top fuse cap
    const capGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.08, 6);
    const cap = this.materials.createOutlinedMesh(
      capGeom,
      this.materials.weaponPaperMaterial,
      this.materials.blueInkLineMaterial
    );
    cap.group.position.set(0, 0.15, 0);
    group.add(cap.group);

    // Spoon / Lever
    const leverGeom = new THREE.BoxGeometry(0.02, 0.16, 0.05);
    const lever = this.materials.createOutlinedMesh(
      leverGeom,
      this.materials.accentBlockMaterial,
      this.materials.blueInkLineMaterial
    );
    lever.group.position.set(0.07, 0.08, 0);
    group.add(lever.group);

    return group;
  }

  update(delta, level, scene, onExplodeCallback) {
    if (this.isExploded) return;

    this.fuseTime -= delta;

    // Gravity
    this.velocity.y += -19 * delta;

    // Air drag
    this.velocity.x *= (1 - delta * 0.4);
    this.velocity.z *= (1 - delta * 0.4);

    // Predict next position
    const nextPos = this.position.clone().addScaledVector(this.velocity, delta);

    // Level collision detection
    for (const col of level.colliders) {
      const box = col.box;
      const closestPoint = new THREE.Vector3();
      box.clampPoint(nextPos, closestPoint);

      const distSq = nextPos.distanceToSquared(closestPoint);
      if (distSq < this.radius * this.radius) {
        // Collision hit! Calculate normal
        const normal = nextPos.clone().sub(closestPoint).normalize();
        if (normal.lengthSq() < 0.001) normal.set(0, 1, 0);

        // Reflect velocity with bounce damping
        const dot = this.velocity.dot(normal);
        this.velocity.subScaledVector(normal, 1.55 * dot);
        this.velocity.multiplyScalar(0.55); // energy loss

        // Push out of collision
        nextPos.copy(closestPoint).addScaledVector(normal, this.radius + 0.01);

        if (this.velocity.length() > 1.2) {
          this.soundEngine.playGrenadeBounce();
        }
        break;
      }
    }

    this.position.copy(nextPos);
    this.mesh.position.copy(this.position);

    // Tumble rotation
    this.mesh.rotation.x += this.rotVel.x * delta;
    this.mesh.rotation.y += this.rotVel.y * delta;
    this.mesh.rotation.z += this.rotVel.z * delta;

    // Explode when fuse expires
    if (this.fuseTime <= 0) {
      this.explode(scene, onExplodeCallback);
    }
  }

  explode(scene, onExplodeCallback) {
    this.isExploded = true;
    scene.remove(this.mesh);

    // Audio & Screen Feedback
    this.soundEngine.playGrenadeExplosion();
    this.effects.addTrauma(0.85);

    // Stylized expanding blueprint shockwave ring
    const ringGeom = new THREE.RingGeometry(0.5, 1.2, 24);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x162a68,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const shockwaveMesh = new THREE.Mesh(ringGeom, ringMat);
    shockwaveMesh.position.copy(this.position).setY(this.position.y + 0.1);
    scene.add(shockwaveMesh);

    // Animate shockwave
    let waveScale = 1.0;
    const waveInterval = setInterval(() => {
      waveScale += 1.8;
      shockwaveMesh.scale.set(waveScale, waveScale, waveScale);
      ringMat.opacity -= 0.09;
      if (ringMat.opacity <= 0) {
        clearInterval(waveInterval);
        scene.remove(shockwaveMesh);
        ringGeom.dispose();
        ringMat.dispose();
      }
    }, 25);

    // Ink explosion particles
    this.effects.createEnemyBloodSplatter(this.position, new THREE.Vector3(0, 1, 0), 32);

    // Notify Combat/TDM for AoE damage calculation
    if (onExplodeCallback) {
      onExplodeCallback(this.position, this.explosionRadius, this.maxDamage, this.sourceEntity);
    }
  }
}

export class GrenadeManager {
  constructor(scene, materials, soundEngine, effects, level) {
    this.scene = scene;
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.level = level;
    this.activeGrenades = [];
  }

  throwGrenade(origin, direction, speed = 18, sourceEntity = null) {
    this.soundEngine.playGrenadeThrow();
    const grenade = new Grenade(
      origin,
      direction,
      speed,
      this.materials,
      this.soundEngine,
      this.effects,
      sourceEntity
    );
    this.scene.add(grenade.mesh);
    this.activeGrenades.push(grenade);
    return grenade;
  }

  update(delta, onExplodeCallback) {
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.update(delta, this.level, this.scene, onExplodeCallback);
      if (g.isExploded) {
        this.activeGrenades.splice(i, 1);
      }
    }
  }

  reset() {
    this.activeGrenades.forEach(g => {
      this.scene.remove(g.mesh);
    });
    this.activeGrenades = [];
  }
}
