import * as THREE from 'three';

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// AABB collision box structure
export class BoxCollider {
  constructor(minX, minY, minZ, maxX, maxY, maxZ, tag = 'wall') {
    this.box = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(maxX, maxY, maxZ)
    );
    this.tag = tag; // 'wall', 'floor', 'cover', 'stair'
  }

  intersectsSphere(center, radius) {
    const sphere = new THREE.Sphere(center, radius);
    return this.box.intersectsSphere(sphere);
  }

  intersectsBox(otherBox) {
    return this.box.intersectsBox(otherBox);
  }

  // Clamps a position sphere from penetrating the box
  resolveSphereCollision(pos, radius) {
    const closestPoint = new THREE.Vector3();
    this.box.clampPoint(pos, closestPoint);

    const distSq = pos.distanceToSquared(closestPoint);
    if (distSq < radius * radius && distSq > 0.000001) {
      const dist = Math.sqrt(distSq);
      const penetration = radius - dist;
      const normal = pos.clone().sub(closestPoint).normalize();
      pos.addScaledVector(normal, penetration);
      return normal;
    }
    return null;
  }
}
