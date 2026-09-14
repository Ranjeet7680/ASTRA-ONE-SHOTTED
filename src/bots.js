import * as THREE from 'three';
import { lerp, randomRange, clamp } from './utilities.js';

export class Bot {
  constructor(id, name, team, spawnPos, materials, soundEngine, effects, level) {
    this.id = id;
    this.name = name;
    this.team = team; // 'BLUE' or 'RED'
    this.materials = materials;
    this.soundEngine = soundEngine;
    this.effects = effects;
    this.level = level;

    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3();
    this.rotationY = 0;

    this.maxHp = 100;
    this.hp = 100;
    this.isDead = false;
    this.canRespawn = false;
    this.respawnTimer = 3.0;

    // Movement & AI
    this.speed = 4.8;
    this.state = 'PATROL'; // 'PATROL', 'CHASE', 'ATTACK', 'DEAD'
    this.targetEntity = null;
    this.attackRange = 22.0;
    this.attackCooldown = randomRange(0.4, 1.2);
    this.fireCadence = 0.25;
    this.flinchTimer = 0;

    // Stats
    this.kills = 0;
    this.deaths = 0;
    this.score = 0;

    // 3D Model
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.buildMesh();

    // Floating Nameplate / Indicator
    this.buildNameplate();
  }

  buildMesh() {
    this.modelGroup = new THREE.Group();

    const lineMat = this.team === 'BLUE' ? this.materials.blueInkLineMaterial : this.materials.redInkLineMaterial;
    const bodyMat = this.team === 'BLUE' ? this.materials.weaponPaperMaterial : this.materials.enemyBodyMaterial;

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.48, 0.85, 0.32);
    const torso = this.materials.createOutlinedMesh(torsoGeom, bodyMat, lineMat);
    torso.group.position.set(0, 1.15, 0);
    this.modelGroup.add(torso.group);

    // Head
    const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
    const head = this.materials.createOutlinedMesh(headGeom, bodyMat, lineMat);
    head.group.position.set(0, 1.82, 0);
    this.modelGroup.add(head.group);

    // Limbs
    const legGeom = new THREE.BoxGeometry(0.12, 0.85, 0.12);
    const lLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    lLeg.group.position.set(-0.16, 0.45, 0);
    this.modelGroup.add(lLeg.group);
    this.leftLeg = lLeg.group;

    const rLeg = this.materials.createOutlinedMesh(legGeom, bodyMat, lineMat);
    rLeg.group.position.set(0.16, 0.45, 0);
    this.modelGroup.add(rLeg.group);
    this.rightLeg = rLeg.group;

    // Weapon in hand
    const gunGeom = new THREE.BoxGeometry(0.09, 0.1, 0.6);
    const gun = this.materials.createOutlinedMesh(gunGeom, this.materials.hatchSurfaceMaterial, lineMat);
    gun.group.position.set(0.25, 1.2, 0.2);
    this.modelGroup.add(gun.group);

    this.group.add(this.modelGroup);

    // Hitboxes
    this.headCenter = new THREE.Vector3(0, 1.82, 0);
    this.headHitRadius = 0.32;
    this.bodyCenter = new THREE.Vector3(0, 1.0, 0);
    this.bodyHitRadius = 0.58;
  }

  buildNameplate() {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.25, 0, 0),
      new THREE.Vector3(0, 0.2, 0),
      new THREE.Vector3(0.25, 0, 0)
    ]);
    const lineMat = this.team === 'BLUE' ? this.materials.blueInkLineMaterial : this.materials.redInkLineMaterial;
    this.indicator = new THREE.Line(geom, lineMat);
    this.indicator.position.set(0, 2.3, 0);
    this.group.add(this.indicator);
  }

  getWorldHeadCenter() {
    return this.headCenter.clone().applyMatrix4(this.group.matrixWorld);
  }

  getWorldBodyCenter() {
    return this.bodyCenter.clone().applyMatrix4(this.group.matrixWorld);
  }

  takeDamage(amount, isHeadshot = false, attacker = null) {
    if (this.isDead) return;

    this.hp -= amount;
    this.state = 'FLINCH';
    this.flinchTimer = 0.18;

    const hitPos = isHeadshot ? this.getWorldHeadCenter() : this.getWorldBodyCenter();
    this.effects.createEnemyBloodSplatter(hitPos, new THREE.Vector3(0, 1, 0), isHeadshot ? 14 : 7);

    if (this.hp <= 0) {
      this.die(attacker, isHeadshot);
    }
  }

  die(attacker = null, isHeadshot = false) {
    this.isDead = true;
    this.deaths++;
    this.state = 'DEAD';
    this.respawnTimer = 3.0;
    this.soundEngine.playEnemyDeath();

    const pos = this.getWorldBodyCenter();
    this.effects.createEnemyBloodSplatter(pos, new THREE.Vector3(0, 1, 0), 20);

    if (this.indicator) this.indicator.visible = false;

    if (this.onBotKilled) {
      this.onBotKilled(this, attacker, isHeadshot);
    }
  }

  respawn(spawnPos) {
    this.position.copy(spawnPos);
    this.hp = this.maxHp;
    this.isDead = false;
    this.state = 'PATROL';
    this.group.position.copy(this.position);
    this.group.scale.set(1, 1, 1);
    this.modelGroup.rotation.set(0, 0, 0);
    this.modelGroup.position.set(0, 0, 0);
    if (this.indicator) this.indicator.visible = true;
  }

  update(delta, opponents, player, botBullets) {
    if (this.isDead) {
      this.respawnTimer -= delta;
      const s = Math.max(0.01, this.respawnTimer / 3.0);
      this.group.scale.set(s, s, s);
      if (this.respawnTimer <= 0) {
        this.canRespawn = true;
      }
      return;
    }

    if (this.flinchTimer > 0) {
      this.flinchTimer -= delta;
      return;
    }

    // 1. Target Selection (Find closest opposing target)
    let closestTarget = null;
    let closestDist = 999;

    // If bot is RED, player is an opponent
    if (this.team === 'RED' && !player.isDead) {
      const pDist = this.position.distanceTo(player.position);
      if (pDist < closestDist) {
        closestDist = pDist;
        closestTarget = player;
      }
    }

    // Check all bot opponents
    for (const opp of opponents) {
      if (opp.isDead || opp.team === this.team) continue;
      const d = this.position.distanceTo(opp.position);
      if (d < closestDist) {
        closestDist = d;
        closestTarget = opp;
      }
    }

    this.targetEntity = closestTarget;

    // 2. State & Combat Decision
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
    }

    if (!this.targetEntity) {
      this.state = 'PATROL';
    } else if (closestDist <= this.attackRange) {
      this.state = 'ATTACK';
    } else {
      this.state = 'CHASE';
    }

    // 3. Movement & Aiming
    let isMoving = false;
    if (this.targetEntity) {
      const targetPos = this.targetEntity.position;
      const toTarget = targetPos.clone().sub(this.position);
      toTarget.y = 0;
      const dir = toTarget.clone().normalize();

      // Face target
      const targetAngle = Math.atan2(toTarget.x, toTarget.z);
      this.rotationY = lerp(this.rotationY, targetAngle, delta * 7);
      this.group.rotation.y = this.rotationY;

      if (this.state === 'CHASE' || (this.state === 'ATTACK' && closestDist > 8.0)) {
        isMoving = true;
        const moveStep = dir.clone().multiplyScalar(this.speed * delta);
        this.position.add(moveStep);
      } else if (this.state === 'ATTACK') {
        // Shoot at target!
        if (this.attackCooldown <= 0) {
          this.shoot(this.targetEntity, botBullets);
          this.attackCooldown = this.fireCadence + randomRange(-0.05, 0.15);
        }
      }
    }

    // Walk animation
    if (isMoving) {
      const walkTime = Date.now() * 0.009 * (this.speed / 4);
      if (this.leftLeg) this.leftLeg.rotation.x = Math.sin(walkTime) * 0.45;
      if (this.rightLeg) this.rightLeg.rotation.x = -Math.sin(walkTime) * 0.45;
    } else {
      if (this.leftLeg) this.leftLeg.rotation.x = 0;
      if (this.rightLeg) this.rightLeg.rotation.x = 0;
    }

    this.group.position.copy(this.position);
  }

  shoot(target, botBullets) {
    this.soundEngine.playRifleShot();

    const spawn = this.getWorldBodyCenter().add(new THREE.Vector3(0, 0.3, 0));
    const aimTarget = target.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dir = aimTarget.sub(spawn).normalize();
    // Spread
    dir.x += randomRange(-0.04, 0.04);
    dir.y += randomRange(-0.03, 0.03);
    dir.z += randomRange(-0.04, 0.04);
    dir.normalize();

    botBullets.push(new BotBullet(spawn, dir, 28, 16, this.team, this.materials, this));
  }

  cleanup(scene) {
    scene.remove(this.group);
  }
}

// Bot Bullet Class
export class BotBullet {
  constructor(position, direction, speed, damage, team, materials, shooter) {
    this.position = position.clone();
    this.direction = direction.clone();
    this.speed = speed;
    this.damage = damage;
    this.team = team;
    this.materials = materials;
    this.shooter = shooter;
    this.lifetime = 3.0;
    this.age = 0;
    this.dead = false;

    const geom = new THREE.SphereGeometry(0.12, 4, 4);
    const mat = team === 'BLUE' ? new THREE.MeshBasicMaterial({ color: 0x162a68 }) : materials.enemyBulletMaterial;
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.position.copy(this.position);
  }

  update(delta, player, allBots, level, effects, scene) {
    if (this.dead) return;

    this.age += delta;
    if (this.age >= this.lifetime) {
      this.destroy(scene);
      return;
    }

    const step = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(step);
    this.mesh.position.copy(this.position);

    // Collision with Player (if bullet is from RED team)
    if (this.team === 'RED' && !player.isDead) {
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
    }

    // Collision with Bots on opposing team
    for (const bot of allBots) {
      if (bot.isDead || bot.team === this.team) continue;
      const bCenter = bot.getWorldBodyCenter();
      if (this.position.distanceTo(bCenter) < 0.65) {
        bot.takeDamage(this.damage, false, this.shooter);
        this.destroy(scene);
        return;
      }
    }

    // Collision with walls/floors
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
