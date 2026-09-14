import * as THREE from 'three';
import { lerp, randomRange } from './utilities.js';

export class EffectsManager {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;

    // Bullet Tracers
    this.tracers = [];

    // Red Ink Blood Droplets (stylized sketch droplets)
    this.inkDroplets = [];
    const dropletGeom = new THREE.SphereGeometry(0.08, 4, 4);
    const dropletMat = new THREE.MeshBasicMaterial({ color: 0xc9182b });
    this.dropletMeshBase = new THREE.Mesh(dropletGeom, dropletMat);

    // Surface Impact Sparks (blue ink dots)
    this.impactSparks = [];
    const sparkGeom = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x162a68 });
    this.sparkMeshBase = new THREE.Mesh(sparkGeom, sparkMat);

    // Bullet Hole Decals (pool of max 60 decals)
    this.decals = [];
    this.maxDecals = 60;
    this.decalGeom = new THREE.PlaneGeometry(0.24, 0.24);
    this.decalMat = new THREE.MeshBasicMaterial({
      map: this.materials.inkDecalTexture,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    // Screen Shake state
    this.trauma = 0; // 0 to 1
    this.shakeOffset = {
      pitch: 0,
      yaw: 0,
      roll: 0,
      x: 0,
      y: 0
    };
  }

  // Add screen shake trauma
  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  // Spawn a fast fading ink bullet tracer
  createTracer(fromPos, toPos) {
    const geom = new THREE.BufferGeometry().setFromPoints([fromPos, toPos]);
    const mat = this.materials.playerBulletTrailMaterial.clone();
    const line = new THREE.Line(geom, mat);
    this.scene.add(line);

    this.tracers.push({
      line,
      lifetime: 0.08,
      age: 0
    });
  }

  // Spawn red ink blood splatter particles when an enemy is hit
  createEnemyBloodSplatter(position, normal = new THREE.Vector3(0, 1, 0), count = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = this.dropletMeshBase.clone();
      mesh.position.copy(position);

      // Random burst velocity biased towards normal
      const vel = new THREE.Vector3(
        normal.x * 2.5 + randomRange(-2.5, 2.5),
        normal.y * 2.5 + randomRange(1.0, 4.0),
        normal.z * 2.5 + randomRange(-2.5, 2.5)
      );

      this.scene.add(mesh);
      this.inkDroplets.push({
        mesh,
        velocity: vel,
        lifetime: randomRange(0.4, 0.7),
        age: 0
      });
    }
  }

  // Spawn surface impact dust/sparks on walls and floors
  createSurfaceImpact(position, normal) {
    // 1. Decal
    this.createDecal(position, normal);

    // 2. Sparks
    const count = 6;
    for (let i = 0; i < count; i++) {
      const mesh = this.sparkMeshBase.clone();
      mesh.position.copy(position);

      const vel = normal.clone().multiplyScalar(randomRange(1.5, 3.5)).add(
        new THREE.Vector3(
          randomRange(-1.5, 1.5),
          randomRange(-1.5, 1.5),
          randomRange(-1.5, 1.5)
        )
      );

      this.scene.add(mesh);
      this.impactSparks.push({
        mesh,
        velocity: vel,
        lifetime: randomRange(0.2, 0.4),
        age: 0
      });
    }
  }

  // Place bullet hole / ink decal on surface
  createDecal(position, normal) {
    if (this.decals.length >= this.maxDecals) {
      const oldest = this.decals.shift();
      this.scene.remove(oldest);
    }

    const decal = new THREE.Mesh(this.decalGeom, this.decalMat);
    decal.position.copy(position).addScaledVector(normal, 0.015);

    // Orient decal facing along normal
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);
    dummy.lookAt(position.clone().add(normal));
    decal.rotation.copy(dummy.rotation);
    decal.rotation.z = Math.random() * Math.PI * 2; // Random rotation

    this.scene.add(decal);
    this.decals.push(decal);
  }

  update(delta) {
    // 1. Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.age += delta;
      const progress = t.age / t.lifetime;
      t.line.material.opacity = 1 - progress;

      if (t.age >= t.lifetime) {
        this.scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        this.tracers.splice(i, 1);
      }
    }

    // 2. Update Red Ink Droplets
    const gravity = -18;
    for (let i = this.inkDroplets.length - 1; i >= 0; i--) {
      const drop = this.inkDroplets[i];
      drop.age += delta;
      drop.velocity.y += gravity * delta;
      drop.mesh.position.addScaledVector(drop.velocity, delta);

      const scale = Math.max(0.01, 1 - (drop.age / drop.lifetime) * 0.7);
      drop.mesh.scale.set(scale, scale, scale);

      if (drop.age >= drop.lifetime || drop.mesh.position.y < 0) {
        this.scene.remove(drop.mesh);
        this.inkDroplets.splice(i, 1);
      }
    }

    // 3. Update Impact Sparks
    for (let i = this.impactSparks.length - 1; i >= 0; i--) {
      const spark = this.impactSparks[i];
      spark.age += delta;
      spark.velocity.y += gravity * 0.6 * delta;
      spark.mesh.position.addScaledVector(spark.velocity, delta);

      if (spark.age >= spark.lifetime) {
        this.scene.remove(spark.mesh);
        this.impactSparks.splice(i, 1);
      }
    }

    // 4. Update Trauma & Screen Shake
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - delta * 1.6);
      const shakeFactor = this.trauma * this.trauma; // Quadratic shake

      this.shakeOffset.pitch = (Math.random() * 2 - 1) * 0.05 * shakeFactor;
      this.shakeOffset.yaw = (Math.random() * 2 - 1) * 0.05 * shakeFactor;
      this.shakeOffset.roll = (Math.random() * 2 - 1) * 0.06 * shakeFactor;
      this.shakeOffset.x = (Math.random() * 2 - 1) * 0.08 * shakeFactor;
      this.shakeOffset.y = (Math.random() * 2 - 1) * 0.08 * shakeFactor;
    } else {
      this.shakeOffset.pitch = 0;
      this.shakeOffset.yaw = 0;
      this.shakeOffset.roll = 0;
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }

  // Clean all dynamic effects
  reset() {
    this.tracers.forEach(t => this.scene.remove(t.line));
    this.inkDroplets.forEach(d => this.scene.remove(d.mesh));
    this.impactSparks.forEach(s => this.scene.remove(s.mesh));
    this.decals.forEach(d => this.scene.remove(d));

    this.tracers = [];
    this.inkDroplets = [];
    this.impactSparks = [];
    this.decals = [];
    this.trauma = 0;
  }
}
