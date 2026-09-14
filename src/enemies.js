import * as THREE from 'three';
import { clamp, lerp, randomRange } from './utilities.js';

export class Enemy {
  constructor(type, spawnPosition, materials, soundEngine, effects, level) {
    this.type = type; // 'grunt', 'rusher', 'heavy', 'sniper'
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.level = level;

    this.position = spawnPosition.clone();
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;

    // FSM States: 'SPAWN', 'IDLE', 'CHASE', 'ATTACK', 'FLINCH', 'DEAD'
    this.state = 'SPAWN';
    this.stateTimer = 0.5; // spawn animation duration

    // Configure Archetype Stats & Sizes
    this.setupArchetype();

    // Create 3D Mesh & Hitboxes
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.buildMesh();

    // Alert Chevron Sprite over head (screenshot 1 feature)
    this.buildChevron();

    // Telegraph Laser Line (for Sniper)
    if (this.type === 'sniper') {
      this.buildLaserGuide();
    }

    this.isDead = false;
    this.canRemove = false;
    this.flinchTimer = 0;
    this.attackCooldown = randomRange(0.5, 1.5);
  }

  setupArchetype() {
    switch (this.type) {
      case 'grunt':
        this.maxHp = 75;
        this.hp = 75;
        this.speed = 4.2;
        this.attackRange = 16.0;
        this.attackCadence = 2.0;
        this.scoreValue = 100;
        this.scale = 1.0;
        break;

      case 'rusher':
        this.maxHp = 42;
        this.hp = 42;
        this.speed = 7.6;
        this.attackRange = 2.4;
        this.attackCadence = 1.0;
        this.scoreValue = 120;
        this.scale = 0.92;
        break;

      case 'heavy':
        this.maxHp = 240;
        this.hp = 240;
        this.speed = 2.4;
        this.attackRange = 18.0;
        this.attackCadence = 2.8;
        this.scoreValue = 250;
        this.scale = 1.35;
        break;

      case 'sniper':
        this.maxHp = 55;
        this.hp = 55;
        this.speed = 1.8;
        this.attackRange = 38.0;
        this.attackCadence = 3.4;
        this.scoreValue = 180;
        this.scale = 1.05;
        this.laserCharging = false;
        this.laserChargeTime = 0;
        break;
    }
  }

  setDifficulty(diff = 'medium') {
    this.difficulty = diff.toLowerCase();
    let hpMult = 1.0;
    let cadenceMult = 1.0;
    this.damageMult = 1.0;

    if (this.difficulty === 'easy') {
      hpMult = 0.8;
      cadenceMult = 1.35;
      this.damageMult = 0.65;
    } else if (this.difficulty === 'hard') {
      hpMult = 1.25;
      cadenceMult = 0.75;
      this.damageMult = 1.35;
    }

    this.maxHp = Math.round(this.maxHp * hpMult);
    this.hp = this.maxHp;
    this.attackCadence *= cadenceMult;
  }

  // Build original humanoid mannequin silhouette matching reference ink sketches
  buildMesh() {
    this.modelGroup = new THREE.Group();

    const bodyMat = this.type === 'heavy' ? this.materials.heavyEnemyBodyMaterial : this.materials.enemyBodyMaterial;
    const lineMat = this.materials.redInkLineMaterial;

    // 1. Torso
    const torsoH = 0.85 * this.scale;
    const torsoW = (this.type === 'heavy' ? 0.7 : 0.46) * this.scale;
    const torsoD = 0.35 * this.scale;
    const torsoGeom = new THREE.BoxGeometry(torsoW, torsoH, torsoD);
    const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
    torso.group.position.set(0, 1.15 * this.scale, 0);
    this.modelGroup.add(torso.group);

    // 2. Head (Spherical sketch mannequin head)
    const headRadius = (this.type === 'heavy' ? 0.26 : 0.22) * this.scale;
    const headGeom = new THREE.SphereGeometry(headRadius, 8, 8);
    const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
    head.group.position.set(0, 1.82 * this.scale, 0);
    this.modelGroup.add(head.group);
    this.headMesh = head.mesh;

    // 3. Limbs (Arms & Legs)
    const limbW = 0.12 * this.scale;
    const legH = 0.85 * this.scale;

    // Left Leg
    const legGeom = new THREE.BoxGeometry(limbW, legH, limbW);
    const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    lLeg.group.position.set(-0.16 * this.scale, 0.45 * this.scale, 0);
    this.modelGroup.add(lLeg.group);
    this.leftLeg = lLeg.group;

    // Right Leg
    const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    rLeg.group.position.set(0.16 * this.scale, 0.45 * this.scale, 0);
    this.modelGroup.add(rLeg.group);
    this.rightLeg = rLeg.group;

    // Left Arm
    const armH = 0.75 * this.scale;
    const armGeom = new THREE.BoxGeometry(limbW, armH, limbW);
    const lArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    lArm.group.position.set(-(torsoW / 2 + limbW / 2 + 0.04), 1.25 * this.scale, 0);
    this.modelGroup.add(lArm.group);
    this.leftArm = lArm.group;

    // Right Arm (holding weapon)
    const rArm = this.materials.createOutlinedMesh(armGeom, bodyMat, lineMat);
    rArm.group.position.set((torsoW / 2 + limbW / 2 + 0.04), 1.25 * this.scale, 0);
    this.modelGroup.add(rArm.group);
    this.rightArm = rArm.group;

    // Weapon prop for ranged enemies
    if (this.type === 'grunt' || this.type === 'heavy' || this.type === 'sniper') {
      const gunGeom = new THREE.BoxGeometry(0.1, 0.1, this.type === 'sniper' ? 0.9 : 0.5);
      const gun = this.materials.createOutlinedMesh(gunGeom, this.materials.hatchSurfaceMaterial, lineMat);
      gun.group.position.set(0.26 * this.scale, 1.2 * this.scale, 0.2);
      this.modelGroup.add(gun.group);
    }

    this.group.add(this.modelGroup);

    // Hitbox Spheres/Boxes for Raycasting
    // Head Hitbox:
    this.headCenter = new THREE.Vector3(0, 1.82 * this.scale, 0);
    this.headHitRadius = headRadius * 1.35;

    // Body Hitbox:
    this.bodyCenter = new THREE.Vector3(0, 1.0 * this.scale, 0);
    this.bodyHitRadius = 0.58 * this.scale;
  }

  // Hand-drawn red chevrons hovering over head (shown in reference screenshot 1)
  buildChevron() {
    const geom = new THREE.BufferGeometry();
    const pts = [
      new THREE.Vector3(-0.25, 0, 0),
      new THREE.Vector3(0, 0.22, 0),
      new THREE.Vector3(0.25, 0, 0)
    ];
    geom.setFromPoints(pts);
    this.chevron = new THREE.Line(geom, this.materials.redInkLineMaterial);
    this.chevron.position.set(0, 2.3 * this.scale, 0);
    this.group.add(this.chevron);
  }

  // Laser aiming guide for Sniper
  buildLaserGuide() {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.4 * this.scale, 0.4),
      new THREE.Vector3(0, 1.4 * this.scale, 30)
    ]);
    this.laserLine = new THREE.Line(geom, this.materials.enemyLaserLineMaterial);
    this.laserLine.visible = false;
    this.group.add(this.laserLine);
  }

  // Get world head position for Raycaster
  getWorldHeadCenter() {
    return this.headCenter.clone().applyMatrix4(this.group.matrixWorld);
  }

  // Get world body position for Raycaster
  getWorldBodyCenter() {
    return this.bodyCenter.clone().applyMatrix4(this.group.matrixWorld);
  }

  // Take damage from player weapon
  takeDamage(amount, isHeadshot = false) {
    if (this.isDead) return;

    this.hp -= amount;

    // Flinch reaction
    this.state = 'FLINCH';
    this.flinchTimer = 0.2;

    // Flinch recoil on mesh
    this.modelGroup.position.z = -0.25;
    this.modelGroup.rotation.x = -0.15;

    // Blood particles
    const hitPos = isHeadshot ? this.getWorldHeadCenter() : this.getWorldBodyCenter();
    this.effects.createEnemyBloodSplatter(hitPos, new THREE.Vector3(0, 1, 0), isHeadshot ? 16 : 8);

    if (this.hp <= 0) {
      this.die(isHeadshot);
    }
  }

  die(isHeadshot = false) {
    this.isDead = true;
    this.state = 'DEAD';
    this.stateTimer = 1.0; // death scribble time
    this.soundEngine.playEnemyDeath();

    // Big ink burst
    const pos = this.getWorldBodyCenter();
    this.effects.createEnemyBloodSplatter(pos, new THREE.Vector3(0, 1, 0), 24);

    // Hide chevron & laser
    if (this.chevron) this.chevron.visible = false;
    if (this.laserLine) this.laserLine.visible = false;
  }

  // Update AI behavior & movement
  update(delta, playerPos, enemyBullets) {
    if (this.canRemove) return;

    // 1. Spawning State (grows from ground)
    if (this.state === 'SPAWN') {
      this.stateTimer -= delta;
      const progress = 1 - Math.max(0, this.stateTimer / 0.5);
      this.group.scale.set(progress, progress, progress);
      if (this.stateTimer <= 0) {
        this.group.scale.set(1, 1, 1);
        this.state = 'CHASE';
      }
      return;
    }

    // 2. Death State (collapses into scribble and sinks)
    if (this.state === 'DEAD') {
      this.stateTimer -= delta;
      this.modelGroup.rotation.x += delta * 3;
      this.modelGroup.position.y -= delta * 1.5;
      const s = Math.max(0.01, this.stateTimer);
      this.group.scale.set(s, s, s);

      if (this.stateTimer <= 0) {
        this.canRemove = true;
      }
      return;
    }

    // 3. Flinch State
    if (this.state === 'FLINCH') {
      this.flinchTimer -= delta;
      this.modelGroup.position.z = lerp(this.modelGroup.position.z, 0, delta * 12);
      this.modelGroup.rotation.x = lerp(this.modelGroup.rotation.x, 0, delta * 12);
      if (this.flinchTimer <= 0) {
        this.state = 'CHASE';
      }
      return;
    }

    // Distance and vector to player
    const distToPlayer = this.position.distanceTo(playerPos);
    const toPlayer = playerPos.clone().sub(this.position);
    toPlayer.y = 0; // horizontal only for navigation
    const dirToPlayer = toPlayer.clone().normalize();

    // Turn to face player
    const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
    this.rotationY = lerp(this.rotationY, targetAngle, delta * 8);
    this.group.rotation.y = this.rotationY;

    // Bobbing chevron
    if (this.chevron) {
      this.chevron.position.y = (2.3 + Math.sin(Date.now() * 0.006) * 0.08) * this.scale;
    }

    // Limb walk cycle animation
    let isMoving = false;

    // Attack cooldown ticking
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    // 4. State Decision
    if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
      this.state = 'ATTACK';
    } else if (distToPlayer > this.attackRange * 0.8) {
      this.state = 'CHASE';
    }

    // 5. Execute State Actions
    if (this.state === 'CHASE') {
      isMoving = true;
      const moveSpeed = this.speed * delta;
      const nextPos = this.position.clone().addScaledVector(dirToPlayer, moveSpeed);

      // Simple obstacle avoidance check
      let canMove = true;
      for (const col of this.level.colliders) {
        if (col.tag === 'wall' || col.tag === 'cover') {
          if (col.box.containsPoint(nextPos)) {
            canMove = false;
            break;
          }
        }
      }

      if (canMove) {
        this.position.x = nextPos.x;
        this.position.z = nextPos.z;
      } else {
        // Slide around obstacle
        this.position.x += dirToPlayer.z * moveSpeed;
        this.position.z -= dirToPlayer.x * moveSpeed;
      }
    } else if (this.state === 'ATTACK') {
      this.executeAttack(delta, playerPos, distToPlayer, enemyBullets);
    }

    // Walk animation (swinging legs and arms)
    if (isMoving) {
      const walkTime = Date.now() * 0.009 * (this.speed / 4);
      if (this.leftLeg) this.leftLeg.rotation.x = Math.sin(walkTime) * 0.45;
      if (this.rightLeg) this.rightLeg.rotation.x = -Math.sin(walkTime) * 0.45;
      if (this.leftArm) this.leftArm.rotation.x = -Math.sin(walkTime) * 0.4;
      if (this.rightArm) this.rightArm.rotation.x = Math.sin(walkTime) * 0.4;
    } else {
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
    }

    // Sync group position
    this.group.position.copy(this.position);
  }

  executeAttack(delta, playerPos, distToPlayer, enemyBullets) {
    switch (this.type) {
      case 'rusher':
        // Melee slash at player
        if (distToPlayer <= 2.2) {
          this.soundEngine.playEnemyAttack('rusher');
          if (this.onPlayerMeleeHit) this.onPlayerMeleeHit(18);
          this.attackCooldown = this.attackCadence;
          this.state = 'CHASE';
        }
        break;

      case 'grunt':
        // Fire single red ink projectile
        this.soundEngine.playEnemyAttack('grunt');
        const gruntSpawn = this.getWorldBodyCenter().add(new THREE.Vector3(0, 0.2, 0));
        const gruntDir = playerPos.clone().sub(gruntSpawn).normalize();
        // Slight random spread
        gruntDir.x += randomRange(-0.04, 0.04);
        gruntDir.y += randomRange(-0.02, 0.04);
        gruntDir.z += randomRange(-0.04, 0.04);
        gruntDir.normalize();

        enemyBullets.push(new EnemyProjectile(
          gruntSpawn,
          gruntDir,
          14.0, // speed
          15,   // damage
          this.materials
        ));

        this.attackCooldown = this.attackCadence;
        this.state = 'CHASE';
        break;

      case 'heavy':
        // Fire 3-round burst
        this.soundEngine.playEnemyAttack('grunt');
        const heavySpawn = this.getWorldBodyCenter().add(new THREE.Vector3(0, 0.4, 0));
        for (let i = -1; i <= 1; i++) {
          const hDir = playerPos.clone().sub(heavySpawn).normalize();
          hDir.x += i * 0.06;
          hDir.normalize();
          enemyBullets.push(new EnemyProjectile(
            heavySpawn,
            hDir,
            16.0,
            12,
            this.materials
          ));
        }
        this.attackCooldown = this.attackCadence;
        this.state = 'CHASE';
        break;

      case 'sniper':
        // Laser charge telegraph then fire
        if (!this.laserCharging) {
          this.laserCharging = true;
          this.laserChargeTime = 1.6;
          this.soundEngine.playEnemyAttack('sniper_charge');
          if (this.laserLine) this.laserLine.visible = true;
        } else {
          this.laserChargeTime -= delta;

          // Update laser line end point to player
          if (this.laserLine) {
            const localPlayer = this.group.worldToLocal(playerPos.clone());
            const positions = this.laserLine.geometry.attributes.position.array;
            positions[3] = localPlayer.x;
            positions[4] = localPlayer.y;
            positions[5] = localPlayer.z;
            this.laserLine.geometry.attributes.position.needsUpdate = true;
          }

          if (this.laserChargeTime <= 0) {
            // FIRE lethal sniper shot!
            this.laserCharging = false;
            if (this.laserLine) this.laserLine.visible = false;

            const sniperSpawn = this.getWorldBodyCenter().add(new THREE.Vector3(0, 0.4, 0));
            const sDir = playerPos.clone().sub(sniperSpawn).normalize();
            enemyBullets.push(new EnemyProjectile(
              sniperSpawn,
              sDir,
              32.0, // ultra fast
              38,   // heavy damage
              this.materials
            ));

            this.attackCooldown = this.attackCadence;
            this.state = 'CHASE';
          }
        }
        break;
    }
  }

  cleanup(scene) {
    scene.remove(this.group);
  }
}

// Enemy Projectile Class
export class EnemyProjectile {
  constructor(position, direction, speed, damage, materials) {
    this.position = position.clone();
    this.direction = direction.clone();
    this.speed = speed;
    this.damage = damage;
    this.materials = materials;
    this.lifetime = 4.0;
    this.age = 0;
    this.dead = false;

    // Stylized red ink sphere
    const geom = new THREE.SphereGeometry(0.18, 6, 6);
    this.mesh = new THREE.Mesh(geom, materials.enemyBulletMaterial);
    this.mesh.position.copy(this.position);
  }

  update(delta, player, level, effects, scene) {
    if (this.dead) return;

    this.age += delta;
    if (this.age >= this.lifetime) {
      this.destroy(scene);
      return;
    }

    const moveStep = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(moveStep);
    this.mesh.position.copy(this.position);

    // Collision against Player (player capsule radius ~0.5, height ~1.8)
    const pCenter = new THREE.Vector3(player.position.x, player.position.y + 1.0, player.position.z);
    const distToPlayer = this.position.distanceTo(pCenter);
    if (distToPlayer < 0.65) {
      player.takeDamage(this.damage, this.shooter ? this.shooter.position : this.position);
      effects.createEnemyBloodSplatter(this.position, new THREE.Vector3(0, 1, 0), 6);
      this.destroy(scene);
      return;
    } else if (distToPlayer < 2.4 && !this.hasWhizzed) {
      this.hasWhizzed = true;
      if (player.soundEngine) player.soundEngine.playBulletWhiz();
    }

    // Collision against Level Geometry
    for (const col of level.colliders) {
      if (col.box.containsPoint(this.position)) {
        effects.createSurfaceImpact(this.position, new THREE.Vector3(0, 1, 0));
        this.destroy(scene);
        return;
      }
    }
  }

  destroy(scene) {
    this.dead = true;
    scene.remove(this.mesh);
    this.mesh.geometry.dispose();
  }
}
