import * as THREE from 'three';

// Create procedural paper texture with ruled notebook lines
export function createPaperTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Base warm off-white paper
  ctx.fillStyle = '#f8f6f0';
  ctx.fillRect(0, 0, width, height);

  // Subtle paper grain noise
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));
  }
  ctx.putImageData(imgData, 0, 0);

  // Faint horizontal ruled notebook lines (blue ink)
  ctx.strokeStyle = 'rgba(70, 110, 180, 0.15)';
  ctx.lineWidth = 1;
  const lineSpacing = 32;
  for (let y = lineSpacing; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Create procedural cross-hatch texture
export function createHatchTexture(type = 'single', size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#faf8f2';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#182b68';
  ctx.lineWidth = 1.2;

  // Single diagonal hatch
  const step = 12;
  for (let x = -size; x < size * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + size, size);
    ctx.stroke();
  }

  if (type === 'cross') {
    // Intersecting diagonal hatch
    for (let x = -size; x < size * 2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, size);
      ctx.lineTo(x + size, 0);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// Hand-drawn sketch muzzle flash texture
export function createMuzzleFlashTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Draw starburst ink scribbles
  ctx.strokeStyle = '#162a68';
  ctx.fillStyle = '#ffeedd';
  ctx.lineWidth = 2.5;

  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const len = size * 0.42 * (0.6 + Math.random() * 0.4);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    ctx.stroke();
  }

  // Inner star
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = '#fbf9f4';
  ctx.fill();
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

// Hand-drawn bullet hole / ink splatter decal texture
export function createInkDecalTexture(size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;

  // Central dark blue ink spot
  ctx.fillStyle = '#162a68';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Surrounding micro droplets & sketch scratch lines
  ctx.strokeStyle = '#162a68';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 12;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1.5 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Small scratch line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (dist + 4), cy + Math.sin(angle) * (dist + 4));
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// Shared Material Library
export class MaterialLibrary {
  constructor() {
    this.paperTexture = createPaperTexture(512, 512);
    this.singleHatchTexture = createHatchTexture('single', 128);
    this.crossHatchTexture = createHatchTexture('cross', 128);
    this.muzzleFlashTexture = createMuzzleFlashTexture(128);
    this.inkDecalTexture = createInkDecalTexture(64);

    // Architectural Level Materials
    this.architecturalPaperMaterial = new THREE.MeshLambertMaterial({
      color: 0xf6f4ee,
      map: this.paperTexture,
      reflectivity: 0.1
    });

    this.hatchSurfaceMaterial = new THREE.MeshLambertMaterial({
      color: 0xede9de,
      map: this.singleHatchTexture
    });

    this.accentBlockMaterial = new THREE.MeshLambertMaterial({
      color: 0xe8e4d8,
      map: this.crossHatchTexture
    });

    // Dark blue ink line for edges
    this.blueInkLineMaterial = new THREE.LineBasicMaterial({
      color: 0x162a68,
      linewidth: 2,
      depthTest: true
    });

    // Red ink line for enemy wireframes / outlines
    this.redInkLineMaterial = new THREE.LineBasicMaterial({
      color: 0xc9182b,
      linewidth: 2,
      depthTest: true
    });

    // Enemy body surface (pale parchment with slight red ink wash)
    this.enemyBodyMaterial = new THREE.MeshLambertMaterial({
      color: 0xffe8e8
    });

    this.heavyEnemyBodyMaterial = new THREE.MeshLambertMaterial({
      color: 0xf5dcdc
    });

    // Weapon mesh material (blueprint off-white)
    this.weaponPaperMaterial = new THREE.MeshLambertMaterial({
      color: 0xfbfaf6
    });

    this.weaponHatchMaterial = new THREE.MeshLambertMaterial({
      color: 0xeae6da,
      map: this.singleHatchTexture
    });

    // Projectile materials
    this.playerBulletTrailMaterial = new THREE.LineBasicMaterial({
      color: 0x1e388a,
      transparent: true,
      opacity: 0.8
    });

    this.enemyBulletMaterial = new THREE.MeshBasicMaterial({
      color: 0xc9182b
    });

    this.enemyLaserLineMaterial = new THREE.LineBasicMaterial({
      color: 0xff2233,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
  }

  // Utility to create an architectural mesh with blue ink outline edges
  createOutlinedMesh(geometry, faceMaterial = this.architecturalPaperMaterial, outlineMaterial = this.blueInkLineMaterial) {
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, faceMaterial);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry, 25);
    const line = new THREE.LineSegments(edges, outlineMaterial);
    group.add(line);

    return { group, mesh, line };
  }
}
