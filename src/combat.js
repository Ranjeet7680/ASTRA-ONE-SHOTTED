import * as THREE from 'three';
import { randomRange } from './utilities.js';

export class CombatSystem {
  constructor(scene, camera, level, effects, soundEngine, hud) {
    this.scene = scene;
    this.camera = camera;
    this.level = level;
    this.effects = effects;
    this.soundEngine = soundEngine;
    this.hud = hud;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 150;
  }

  // Execute weapon fire raycasting
  handleWeaponFire(weapon, enemies, weaponSystem) {
    const muzzlePos = weaponSystem.getMuzzleWorldPosition();
    const pellets = weapon.pellets;
    const baseDir = new THREE.Vector3();
    this.camera.getWorldDirection(baseDir);

    let hitsCount = 0;
    let anyHeadshot = false;

    for (let p = 0; p < pellets; p++) {
      // Calculate pellet ray direction with spread
      const shootDir = baseDir.clone();
      if (weapon.spread > 0) {
        shootDir.x += randomRange(-weapon.spread, weapon.spread);
        shootDir.y += randomRange(-weapon.spread, weapon.spread);
        shootDir.z += randomRange(-weapon.spread, weapon.spread);
        shootDir.normalize();
      }

      this.raycaster.set(this.camera.position, shootDir);

      // 1. Raycast against Level Geometry Colliders
      let closestObstacleDist = 999;
      let closestObstacleHit = null;
      let closestObstacleNormal = new THREE.Vector3(0, 1, 0);

      const ray = this.raycaster.ray;
      for (const col of this.level.colliders) {
        const intersectionPoint = new THREE.Vector3();
        if (ray.intersectBox(col.box, intersectionPoint)) {
          const dist = this.camera.position.distanceTo(intersectionPoint);
          if (dist < closestObstacleDist) {
            closestObstacleDist = dist;
            closestObstacleHit = intersectionPoint;

            // Approximate normal from box faces
            const b = col.box;
            if (Math.abs(intersectionPoint.x - b.min.x) < 0.05) closestObstacleNormal.set(-1, 0, 0);
            else if (Math.abs(intersectionPoint.x - b.max.x) < 0.05) closestObstacleNormal.set(1, 0, 0);
            else if (Math.abs(intersectionPoint.y - b.min.y) < 0.05) closestObstacleNormal.set(0, -1, 0);
            else if (Math.abs(intersectionPoint.y - b.max.y) < 0.05) closestObstacleNormal.set(0, 1, 0);
            else if (Math.abs(intersectionPoint.z - b.min.z) < 0.05) closestObstacleNormal.set(0, 0, -1);
            else if (Math.abs(intersectionPoint.z - b.max.z) < 0.05) closestObstacleNormal.set(0, 0, 1);
          }
        }
      }

      // 2. Raycast against Targets (Enemies and Bots)
      let closestTarget = null;
      let closestTargetDist = 999;
      let isHeadshot = false;
      let targetHitPoint = null;

      for (const target of targets) {
        if (target.isDead || target.state === 'SPAWN') continue;
        // Don't shoot friendly Blue bots
        if (target.team === 'BLUE') continue;

        // A. Head check (sphere intersection)
        const headCenter = target.getWorldHeadCenter();
        const headSphere = new THREE.Sphere(headCenter, target.headHitRadius || 0.32);
        const headHit = new THREE.Vector3();
        if (ray.intersectSphere(headSphere, headHit)) {
          const dist = this.camera.position.distanceTo(headHit);
          if (dist < closestTargetDist && dist < closestObstacleDist) {
            closestTargetDist = dist;
            closestTarget = target;
            isHeadshot = true;
            targetHitPoint = headHit;
          }
        }

        // B. Body check (sphere intersection around torso)
        const bodyCenter = target.getWorldBodyCenter();
        const bodySphere = new THREE.Sphere(bodyCenter, target.bodyHitRadius || 0.58);
        const bodyHit = new THREE.Vector3();
        if (ray.intersectSphere(bodySphere, bodyHit)) {
          const dist = this.camera.position.distanceTo(bodyHit);
          if (dist < closestTargetDist && dist < closestObstacleDist) {
            closestTargetDist = dist;
            closestTarget = target;
            isHeadshot = false;
            targetHitPoint = bodyHit;
          }
        }
      }

      // 3. Resolve Hit
      if (closestTarget && closestTargetDist < closestObstacleDist) {
        hitsCount++;
        if (isHeadshot) anyHeadshot = true;

        const damage = Math.round(weapon.damage * (isHeadshot ? weapon.headshotMult : 1.0));
        const wasDead = closestTarget.isDead;
        closestTarget.takeDamage(damage, isHeadshot);

        // Tracer line to target hit
        this.effects.createTracer(muzzlePos, targetHitPoint);

        // Score & Kill notifications
        if (!wasDead && closestTarget.isDead) {
          const name = closestTarget.name || closestTarget.type || 'HOSTILE';
          const scoreGain = (closestTarget.scoreValue || 100) + (isHeadshot ? 50 : 0);
          this.hud.addScore(scoreGain);
          this.hud.showKillPopup(name, isHeadshot, scoreGain);
          if (this.onEnemyKilled) {
            this.onEnemyKilled(closestTarget, isHeadshot);
          }
        }
      } else if (closestObstacleHit) {
        // Hit environment surface
        this.effects.createTracer(muzzlePos, closestObstacleHit);
        this.effects.createSurfaceImpact(closestObstacleHit, closestObstacleNormal);
      } else {
        // Missed into distant sky
        const endPoint = this.camera.position.clone().addScaledVector(shootDir, 80);
        this.effects.createTracer(muzzlePos, endPoint);
      }
    }

    // Audio & UI hitmarker if any pellet struck a target
    if (hitsCount > 0) {
      this.soundEngine.playHitmarker(anyHeadshot);
      this.hud.showHitmarker(anyHeadshot);
    }
  }

  // Handle Grenade Explosion AoE Damage with Obstacle Occlusion
  handleGrenadeExplosion(epicenter, radius, maxDamage, sourceEntity, allTargets, player) {
    // 1. Damage to Player (if close enough)
    const pDist = player.position.distanceTo(epicenter);
    if (pDist <= radius && !player.isDead) {
      const ray = new THREE.Ray(epicenter, player.position.clone().sub(epicenter).normalize());
      let blocked = false;
      for (const col of this.level.colliders) {
        const hit = new THREE.Vector3();
        if (ray.intersectBox(col.box, hit) && hit.distanceTo(epicenter) < pDist - 0.5) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        const dmg = Math.round(maxDamage * (1 - pDist / radius));
        player.takeDamage(dmg);
      }
    }

    // 2. Damage to Enemies / Bots
    for (const target of allTargets) {
      if (target.isDead || target.team === 'BLUE') continue;
      const bCenter = target.getWorldBodyCenter();
      const dist = bCenter.distanceTo(epicenter);
      if (dist <= radius) {
        // Raycast line of sight check
        const dir = bCenter.clone().sub(epicenter).normalize();
        const ray = new THREE.Ray(epicenter, dir);
        let blocked = false;
        for (const col of this.level.colliders) {
          const hit = new THREE.Vector3();
          if (ray.intersectBox(col.box, hit) && hit.distanceTo(epicenter) < dist - 0.4) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          const dmg = Math.round(maxDamage * (1 - dist / radius));
          const wasDead = target.isDead;
          target.takeDamage(dmg, false, sourceEntity);

          if (!wasDead && target.isDead) {
            const name = target.name || target.type || 'HOSTILE';
            this.hud.addScore(100);
            this.hud.showKillPopup(name, false, 100);
            if (this.onEnemyKilled) {
              this.onEnemyKilled(target, false);
            }
          }
        }
      }
    }
  }

}
