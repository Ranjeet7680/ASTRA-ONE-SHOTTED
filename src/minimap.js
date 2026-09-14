// Real-time End-to-End Minimap & Full Tactical Map (<kbd>M</kbd>)
export class MinimapManager {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.fullMapModal = document.getElementById('modal-full-map');
    this.fullCanvas = document.getElementById('full-map-canvas');
    this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext('2d') : null;

    this.isFullMapOpen = false;
    this.activePings = []; // { x, z, type, text, timer, maxTime }

    this.setupListeners();
  }

  setupListeners() {
    // Press 'M' to toggle full tactical map
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleFullMap();
        }
      }
    });

    // Click circular minimap to toggle full tactical map
    const container = document.getElementById('minimap-container');
    if (container) {
      container.addEventListener('click', () => {
        if (this.game.stateManager.currentState === 'PLAYING') {
          this.toggleFullMap();
        }
      });
    }

    const btnCloseFullMap = document.getElementById('btn-close-full-map');
    if (btnCloseFullMap) {
      btnCloseFullMap.addEventListener('click', () => {
        this.closeFullMap();
      });
    }

    // Click on full map to drop a tactical ping
    if (this.fullCanvas) {
      this.fullCanvas.addEventListener('click', (e) => {
        const rect = this.fullCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const arenaSize = this.getArenaSize();
        const worldX = ((clickX / this.fullCanvas.width) - 0.5) * arenaSize;
        const worldZ = ((clickY / this.fullCanvas.height) - 0.5) * arenaSize;

        this.addPing(worldX, worldZ, 'danger', 'TACTICAL PING');
        if (this.game.voiceChat) {
          this.game.voiceChat.triggerRadioCallout('Enemies Ahead!', worldX, worldZ);
        }
      });
    }
  }

  toggleFullMap() {
    if (this.isFullMapOpen) {
      this.closeFullMap();
    } else {
      this.openFullMap();
    }
  }

  openFullMap() {
    this.isFullMapOpen = true;
    if (this.fullMapModal) this.fullMapModal.style.display = 'flex';
    if (document.exitPointerLock) document.exitPointerLock();
  }

  closeFullMap() {
    this.isFullMapOpen = false;
    if (this.fullMapModal) this.fullMapModal.style.display = 'none';
    if (this.game.stateManager.currentState === 'PLAYING') {
      this.game.domElement.requestPointerLock();
    }
  }

  addPing(x, z, type = 'danger', text = 'ENEMY SPOTTED') {
    this.activePings.push({
      x,
      z,
      type,
      text,
      timer: 6.0,
      maxTime: 6.0
    });
    if (this.game.soundEngine) {
      this.game.soundEngine.playRadioChirp();
    }
  }

  getArenaSize() {
    const size = this.game.level.currentMapSize;
    if (size === 'big') return 120;
    if (size === 'medium') return 80;
    return 50;
  }

  update(delta) {
    // Decay active pings
    for (let i = this.activePings.length - 1; i >= 0; i--) {
      this.activePings[i].timer -= delta;
      if (this.activePings[i].timer <= 0) {
        this.activePings.splice(i, 1);
      }
    }

    if (this.ctx && this.canvas) {
      this.renderHUDMinimap();
    }

    if (this.isFullMapOpen && this.fullCtx && this.fullCanvas) {
      this.renderFullTacticalMap();
    }
  }

  // Render HUD Circular Radar
  renderHUDMinimap() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = w / 2 - 4;

    ctx.clearRect(0, 0, w, h);

    // 1. Circular Blueprint Clipping Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Background paper
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(22, 42, 104, 0.12)';
    ctx.lineWidth = 1;
    const gridStep = 18;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // World to Radar Transform (Centered on player position)
    const playerX = this.game.player.position.x;
    const playerZ = this.game.player.position.z;
    const playerYaw = this.game.player.yaw;
    const radarRange = 36; // Viewable radius in meters
    const scale = radius / radarRange;

    const toRadarX = (wx) => cx + (wx - playerX) * scale;
    const toRadarY = (wz) => cy + (wz - playerZ) * scale;

    // 2. Render Map Features (Walls, Houses, Buses, Cars, Trees, Bunkers)
    const features = this.game.level.mapFeatures || [];
    features.forEach(f => {
      const rx = toRadarX(f.x);
      const ry = toRadarY(f.z);

      if (f.type === 'wall' || f.type === 'house') {
        const rw = (f.width || 6) * scale;
        const rd = (f.depth || 6) * scale;
        ctx.fillStyle = f.type === 'house' ? 'rgba(22, 42, 104, 0.18)' : 'rgba(22, 42, 104, 0.28)';
        ctx.strokeStyle = '#162a68';
        ctx.lineWidth = 1.2;
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);

        if (f.type === 'house') {
          ctx.fillStyle = '#162a68';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('HOUSE', rx, ry + 3);
        }
      } else if (f.type === 'bus') {
        const rw = (f.width || 2.6) * scale;
        const rd = (f.depth || 9.5) * scale;
        ctx.fillStyle = '#1e388a';
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BUS', rx, ry + 2.5);
      } else if (f.type === 'car') {
        const rw = (f.width || 2.0) * scale;
        const rd = (f.depth || 4.4) * scale;
        ctx.fillStyle = 'rgba(70, 110, 180, 0.6)';
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.strokeStyle = '#162a68';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);
      } else if (f.type === 'tree') {
        const r = (f.radius || 2.2) * scale;
        ctx.beginPath();
        ctx.arc(rx, ry, Math.max(3, r), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 120, 70, 0.35)';
        ctx.fill();
        ctx.strokeStyle = '#1e5e3a';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (f.type === 'bunker') {
        const rw = (f.width || 3.6) * scale;
        const rd = (f.depth || 2.0) * scale;
        ctx.strokeStyle = '#c9182b';
        ctx.lineWidth = 1.8;
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);
      }
    });

    // 3. Render Teammates (Blue Dots)
    if (this.game.currentMode === 'tdm' && this.game.tdm) {
      const bots = this.game.tdm.bots || [];
      bots.forEach(b => {
        if (!b.isAlive) return;
        const bx = toRadarX(b.position.x);
        const by = toRadarY(b.position.z);

        if (b.team === 'blue') {
          ctx.beginPath();
          ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#2255bb';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else {
          // Enemy bot (Red dot)
          ctx.beginPath();
          ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#c9182b';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
    } else if (this.game.currentMode === 'wave' && this.game.waves) {
      // Wave mode enemies (Red dots)
      const enemies = this.game.waves.enemies || [];
      enemies.forEach(e => {
        if (!e.isAlive) return;
        const ex = toRadarX(e.mesh.position.x);
        const ey = toRadarY(e.mesh.position.z);

        ctx.beginPath();
        ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#c9182b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
    }

    // 4. Render Tactical Pings
    this.activePings.forEach(p => {
      const px = toRadarX(p.x);
      const py = toRadarY(p.z);
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.3;

      ctx.beginPath();
      ctx.arc(px, py, 9 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = p.type === 'danger' ? '#c9182b' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = p.type === 'danger' ? '#c9182b' : '#f59e0b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', px, py + 4);
    });

    // 5. Render Player Icon (Center of radar, rotating heading arrow & FOV cone)
    ctx.save();
    ctx.translate(cx, cy);

    // Forward FOV cone
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const fovAngle = 0.45; // ~50 degrees
    ctx.arc(0, 0, 24, -Math.PI / 2 - fovAngle - playerYaw, -Math.PI / 2 + fovAngle - playerYaw);
    ctx.closePath();
    ctx.fillStyle = 'rgba(22, 42, 104, 0.15)';
    ctx.fill();

    // Player Directional Arrow
    ctx.rotate(-playerYaw);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fillStyle = '#162a68';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore(); // Restore clipping mask

    // 6. Outer Border & Compass Headings
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#162a68';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Radar tick marks
    ctx.strokeStyle = 'rgba(22, 42, 104, 0.4)';
    ctx.lineWidth = 1.5;
    [0, 90, 180, 270].forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * (radius - 5), cy + Math.sin(rad) * (radius - 5));
      ctx.lineTo(cx + Math.cos(rad) * radius, cy + Math.sin(rad) * radius);
      ctx.stroke();
    });

    // Compass Text (N on top)
    ctx.fillStyle = '#c9182b';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 14);

    // Coordinates footer
    const coordEl = document.getElementById('minimap-coords');
    if (coordEl) {
      coordEl.textContent = `X:${Math.round(playerX)} Z:${Math.round(playerZ)}`;
    }
  }

  // Render Full Tactical Map Modal (<kbd>M</kbd>)
  renderFullTacticalMap() {
    const ctx = this.fullCtx;
    const w = this.fullCanvas.width;
    const h = this.fullCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const arenaSize = this.getArenaSize();
    const scale = (Math.min(w, h) * 0.88) / arenaSize;
    const cx = w / 2;
    const cy = h / 2;

    const toFullX = (wx) => cx + wx * scale;
    const toFullY = (wz) => cy + wz * scale;

    // Background paper & grid
    ctx.fillStyle = '#faf8f2';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(22, 42, 104, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Arena Perimeter Boundary
    const halfArena = (arenaSize / 2) * scale;
    ctx.strokeStyle = '#162a68';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - halfArena, cy - halfArena, halfArena * 2, halfArena * 2);

    // Render All Map Features
    const features = this.game.level.mapFeatures || [];
    features.forEach(f => {
      const rx = toFullX(f.x);
      const ry = toFullY(f.z);

      if (f.type === 'wall' || f.type === 'house') {
        const rw = (f.width || 6) * scale;
        const rd = (f.depth || 6) * scale;
        ctx.fillStyle = f.type === 'house' ? 'rgba(22, 42, 104, 0.22)' : 'rgba(22, 42, 104, 0.35)';
        ctx.strokeStyle = '#162a68';
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);

        if (f.type === 'house') {
          ctx.fillStyle = '#162a68';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('HOUSE', rx, ry + 4);
        }
      } else if (f.type === 'bus') {
        const rw = (f.width || 2.6) * scale;
        const rd = (f.depth || 9.5) * scale;
        ctx.fillStyle = '#1e388a';
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BUS', rx, ry + 3);
      } else if (f.type === 'car') {
        const rw = (f.width || 2.0) * scale;
        const rd = (f.depth || 4.4) * scale;
        ctx.fillStyle = 'rgba(70, 110, 180, 0.7)';
        ctx.fillRect(rx - rw / 2, ry - rd / 2, rw, rd);
        ctx.strokeStyle = '#162a68';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx - rw / 2, ry - rd / 2, rw, rd);
      } else if (f.type === 'tree') {
        const r = (f.radius || 2.2) * scale;
        ctx.beginPath();
        ctx.arc(rx, ry, Math.max(5, r), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40, 120, 70, 0.45)';
        ctx.fill();
        ctx.strokeStyle = '#1e5e3a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    });

    // Teammates
    if (this.game.currentMode === 'tdm' && this.game.tdm) {
      const bots = this.game.tdm.bots || [];
      bots.forEach((b, idx) => {
        if (!b.isAlive) return;
        const bx = toFullX(b.position.x);
        const by = toFullY(b.position.z);

        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = b.team === 'blue' ? '#2255bb' : '#c9182b';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(idx + 1, bx, by + 3);
      });
    }

    // Active Pings
    this.activePings.forEach(p => {
      const px = toFullX(p.x);
      const py = toFullY(p.z);
      const pulse = 1.0 + Math.sin(Date.now() * 0.01) * 0.35;

      ctx.beginPath();
      ctx.arc(px, py, 14 * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = p.type === 'danger' ? '#c9182b' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#c9182b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, px, py - 16);
    });

    // Player Icon on Full Map
    const px = toFullX(this.game.player.position.x);
    const py = toFullY(this.game.player.position.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-this.game.player.yaw);

    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(9, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-9, 9);
    ctx.closePath();
    ctx.fillStyle = '#162a68';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#162a68';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', px, py + 18);
  }
}
