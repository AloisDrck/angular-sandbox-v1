// src/app/features/adventure/game-engine.ts
import {
  Injectable,
  PLATFORM_ID,
  OnDestroy,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_W,
  PLAYER_H,
  PLAYER_SPEED,
  PROXIMITY_RADIUS,
  SPAWN_X,
  SPAWN_Y,
  REFUGES,
  TERRAIN_ZONES,
  TRAIL_SEGMENTS,
  SIGNPOSTS,
  STAR_POSITIONS,
  Refuge,
  Signpost,
} from './scene-data';

export interface SmokeParticle {
  x: number;
  y: number;
  alpha: number;
  vy: number;
}

@Injectable()
export class GameEngineService implements OnDestroy {
  private platformId = inject(PLATFORM_ID);

  private readonly _playerX: WritableSignal<number> = signal(SPAWN_X);
  private readonly _playerY: WritableSignal<number> = signal(SPAWN_Y);
  private readonly _nearbyRefuge: WritableSignal<Refuge | null> = signal(null);
  private readonly _bubbleScale: WritableSignal<number> = signal(0);

  readonly playerX: Signal<number> = this._playerX.asReadonly();
  readonly playerY: Signal<number> = this._playerY.asReadonly();
  readonly nearbyRefuge: Signal<Refuge | null> = this._nearbyRefuge.asReadonly();
  readonly bubbleScale: Signal<number> = this._bubbleScale.asReadonly();

  readonly keysPressed = new Set<string>();
  private facing: 'left' | 'right' = 'right';
  private walkFrame = 0;
  private walkTimer = 0;
  private time = 0;
  private smokeParticles: SmokeParticle[] = [];
  private rafId = 0;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreen: HTMLCanvasElement | null = null;

  initPosition(x: number, y: number): void {
    this._playerX.set(x);
    this._playerY.set(y);
  }

  update(dt: number): void {
    this.time += dt;
    const speed = PLAYER_SPEED;
    let dx = 0;
    let dy = 0;

    if (this.keysPressed.has('ArrowRight')) dx += speed * dt;
    if (this.keysPressed.has('ArrowLeft')) dx -= speed * dt;
    if (this.keysPressed.has('ArrowDown')) dy += speed * dt;
    if (this.keysPressed.has('ArrowUp')) dy -= speed * dt;

    if (dx > 0) this.facing = 'right';
    if (dx < 0) this.facing = 'left';

    const nx = Math.max(20, Math.min(CANVAS_W - PLAYER_W, this._playerX() + dx));

    const zone =
      TERRAIN_ZONES.find((z) => nx >= z.xMin && nx < z.xMax) ??
      TERRAIN_ZONES[TERRAIN_ZONES.length - 1];
    const ny = Math.max(zone.yMin, Math.min(zone.yMax - PLAYER_H, this._playerY() + dy));

    this._playerX.set(nx);
    this._playerY.set(ny);

    if (dx !== 0 || dy !== 0) {
      this.walkTimer += dt;
      if (this.walkTimer >= 0.2) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
      }
    }

    this.updateSmoke(dt);

    const px = this._playerX();
    const py = this._playerY();
    const nearby = REFUGES.find((r) => Math.hypot(px - r.x, py - r.y) < PROXIMITY_RADIUS) ?? null;
    this._nearbyRefuge.set(nearby);

    const targetScale = nearby ? 1 : 0;
    const current = this._bubbleScale();
    this._bubbleScale.set(current + (targetScale - current) * Math.min(10 * dt, 1));
  }

  private updateSmoke(dt: number): void {
    if (Math.random() < dt * 2) {
      const refuge = REFUGES[Math.floor(Math.random() * REFUGES.length)];
      this.smokeParticles.push({ x: refuge.x + 4, y: refuge.y - 16, alpha: 0.5, vy: -8 });
    }
    this.smokeParticles = this.smokeParticles
      .map((p) => ({ ...p, y: p.y + p.vy * dt, alpha: p.alpha - dt * 0.3 }))
      .filter((p) => p.alpha > 0);
  }

  start(canvas: HTMLCanvasElement, x = SPAWN_X, y = SPAWN_Y): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initPosition(x, y);
    this.buildOffscreen();
    this.rafId = requestAnimationFrame((t) => this.loop(t, t));
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private loop(timestamp: number, last: number): void {
    const dt = Math.min((timestamp - last) / 1000, 0.05);
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame((t) => this.loop(t, timestamp));
  }

  savePosition(): void {
    sessionStorage.setItem('adventure_x', String(this._playerX()));
    sessionStorage.setItem('adventure_y', String(this._playerY()));
  }

  restorePosition(): { x: number; y: number } {
    const x = Number(sessionStorage.getItem('adventure_x'));
    const y = Number(sessionStorage.getItem('adventure_y'));
    return {
      x: isFinite(x) && x > 0 ? x : SPAWN_X,
      y: isFinite(y) && y > 0 ? y : SPAWN_Y,
    };
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private buildOffscreen(): void {
    const oc = document.createElement('canvas');
    oc.width = CANVAS_W;
    oc.height = CANVAS_H;
    const c = oc.getContext('2d')!;
    this.offscreen = oc;

    // Sky
    c.fillStyle = '#0d0d1a';
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars (static base — twinkling is per-frame)
    c.fillStyle = '#ffffff';
    for (const [sx, sy] of STAR_POSITIONS) {
      c.fillRect(sx, sy, 2, 2);
    }

    // Moon
    c.fillStyle = '#fde68a';
    c.fillRect(430, 18, 18, 18);
    c.fillStyle = '#0d0d1a';
    c.globalAlpha = 0.45;
    c.fillRect(434, 18, 10, 18);
    c.globalAlpha = 1;

    // Back mountains (distant, dark navy)
    const backPeaks: [number, number, number, number, number, number][] = [
      [0, 190, 70, 85, 150, 190],
      [110, 190, 200, 70, 290, 190],
      [260, 190, 360, 80, 440, 190],
      [380, 190, 460, 95, 480, 190],
    ];
    c.fillStyle = '#1a1d3e';
    for (const [x1, y1, x2, y2, x3, y3] of backPeaks) {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineTo(x3, y3);
      c.fill();
    }

    // Snow caps on back mountains
    c.fillStyle = '#c7d2fe';
    c.globalAlpha = 0.5;
    const caps: [number, number, number, number, number, number][] = [
      [63, 93, 70, 85, 77, 93],
      [193, 78, 200, 70, 207, 78],
      [353, 88, 360, 80, 367, 88],
    ];
    for (const [x1, y1, x2, y2, x3, y3] of caps) {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineTo(x3, y3);
      c.fill();
    }
    c.globalAlpha = 1;

    // Main massif (3 overlapping polygons)
    const massif: [number, number, number, number, number, number][] = [
      [60, 320, 160, 110, 360, 320],
      [200, 320, 310, 100, 420, 320],
      [280, 320, 380, 120, 480, 320],
    ];
    const massifColors = ['#2a2d55', '#252850', '#2a2d55'];
    for (let i = 0; i < massif.length; i++) {
      const [x1, y1, x2, y2, x3, y3] = massif[i];
      c.fillStyle = massifColors[i];
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineTo(x3, y3);
      c.fill();
    }

    // Village foreground hill + ground
    c.fillStyle = '#14532d';
    c.beginPath();
    c.moveTo(0, 280);
    c.lineTo(80, 220);
    c.lineTo(160, 280);
    c.fill();
    c.fillStyle = '#166534';
    c.fillRect(0, 280, CANVAS_W, 20);
    c.fillStyle = '#15803d';
    c.fillRect(0, 290, CANVAS_W, 10);

    // Trail
    this.drawTrailOnCanvas(c);

    // Virage dots
    c.fillStyle = '#c9b458';
    for (const [px, py] of [
      [180, 240],
      [90, 195],
      [310, 148],
      [330, 95],
      [250, 72],
    ] as [number, number][]) {
      c.beginPath();
      c.arc(px, py, 4, 0, Math.PI * 2);
      c.fill();
    }

    // Bifurcation marker
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.arc(230, 168, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#0d0d1a';
    c.beginPath();
    c.arc(230, 168, 3, 0, Math.PI * 2);
    c.fill();

    // Signposts
    for (const sp of SIGNPOSTS) this.drawSignpost(c, sp);

    // Refuge buildings
    for (const ref of REFUGES) this.drawRefugeBuilding(c, ref.x, ref.y, ref.id === 'skills');

    // Decorative trees
    const trees: [number, number][] = [
      [20, 268],
      [155, 252],
      [100, 215],
      [290, 152],
    ];
    for (const [tx, ty] of trees) this.drawTree(c, tx, ty);
  }

  private drawTrailOnCanvas(c: CanvasRenderingContext2D): void {
    c.strokeStyle = '#c9b458';
    c.lineWidth = 3;
    c.setLineDash([6, 4]);
    for (let i = 0; i < TRAIL_SEGMENTS.length; i++) {
      const [x1, y1, x2, y2] = TRAIL_SEGMENTS[i];
      if (i === 4) {
        c.lineWidth = 2;
        c.globalAlpha = 0.5;
      } else {
        c.lineWidth = 3;
        c.globalAlpha = 0.8;
      }
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
    }
    c.setLineDash([]);
    c.globalAlpha = 1;
    c.lineWidth = 1;
  }

  private drawRefugeBuilding(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    snowCap = false,
  ): void {
    // House body
    c.fillStyle = '#92400e';
    c.fillRect(x - 9, y - 14, 18, 14);
    // Roof
    c.fillStyle = '#b45309';
    c.beginPath();
    c.moveTo(x - 13, y - 14);
    c.lineTo(x, y - 26);
    c.lineTo(x + 13, y - 14);
    c.fill();
    if (snowCap) {
      c.fillStyle = '#e0e7ff';
      c.globalAlpha = 0.6;
      c.fillRect(x - 13, y - 15, 26, 3);
      c.globalAlpha = 1;
    }
    // Door
    c.fillStyle = '#1c1917';
    c.fillRect(x - 2, y - 8, 4, 8);
    // Window
    c.fillStyle = '#fde68a';
    c.globalAlpha = 0.8;
    c.fillRect(x - 8, y - 11, 4, 4);
    c.globalAlpha = 1;
  }

  private drawSignpost(c: CanvasRenderingContext2D, sp: Signpost): void {
    const postH = 14 + sp.panels.length * 12;
    // Post
    c.fillStyle = '#92400e';
    c.fillRect(sp.x, sp.y, 3, postH);

    for (let i = 0; i < sp.panels.length; i++) {
      const panel = sp.panels[i];
      const py = sp.y + 14 + i * 12;
      const panelW = Math.min(panel.label.length * 4.5 + 16, 90);
      const panelX = panel.direction.includes('left') ? sp.x - panelW + 3 : sp.x + 3;
      c.fillStyle = '#d97706';
      c.fillRect(panelX, py, panelW, 10);
      c.fillStyle = '#b45309';
      c.fillRect(panelX + 1, py + 1, panelW - 2, 8);
      c.fillStyle = '#fef3c7';
      c.font = '4px monospace';
      c.textAlign = 'left';
      const arrow = panel.direction.includes('left') ? '← ' : '→ ';
      c.fillText(`${arrow}${panel.label} ${panel.distance}`, panelX + 3, py + 7);
    }
  }

  private drawTree(c: CanvasRenderingContext2D, x: number, y: number): void {
    c.fillStyle = '#78350f';
    c.fillRect(x, y, 4, 10);
    c.fillStyle = '#15803d';
    c.fillRect(x - 4, y - 13, 12, 15);
    c.fillStyle = '#16a34a';
    c.fillRect(x - 2, y - 19, 8, 8);
  }

  private draw(): void {
    if (!this.ctx || !this.offscreen) return;
    const c = this.ctx;

    // Layer 1: static background
    c.drawImage(this.offscreen, 0, 0);

    // Layer 2: twinkling stars
    for (const [sx, sy, baseAlpha] of STAR_POSITIONS) {
      c.globalAlpha = baseAlpha * (0.7 + 0.3 * Math.sin(this.time * 2 + sx));
      c.fillStyle = '#ffffff';
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;

    // Layer 3: smoke particles
    for (const p of this.smokeParticles) {
      c.globalAlpha = p.alpha;
      c.fillStyle = '#9ca3af';
      c.fillRect(p.x, p.y, 2, 2);
    }
    c.globalAlpha = 1;

    // Layer 4: refuge labels
    c.font = 'bold 5px monospace';
    c.textAlign = 'center';
    for (const ref of REFUGES) {
      c.fillStyle = '#1e1b4b';
      c.globalAlpha = 0.9;
      c.fillRect(ref.x - 20, ref.y + 2, 40, 8);
      c.globalAlpha = 1;
      c.fillStyle = '#a5b4fc';
      c.fillText(ref.label, ref.x, ref.y + 9);
    }

    // Layer 5: player
    this.drawPlayer(c);

    // Layer 6: speech bubble
    const scale = this.bubbleScale();
    const refuge = this.nearbyRefuge();
    if (scale > 0.05 && refuge) {
      this.drawBubble(c, refuge, scale);
    }
  }

  private drawPlayer(c: CanvasRenderingContext2D): void {
    const px = this._playerX();
    const py = this._playerY();
    const flip = this.facing === 'left';
    const isMoving =
      this.keysPressed.has('ArrowLeft') ||
      this.keysPressed.has('ArrowRight') ||
      this.keysPressed.has('ArrowUp') ||
      this.keysPressed.has('ArrowDown');

    c.save();
    if (flip) {
      c.translate(px + PLAYER_W, 0);
      c.scale(-1, 1);
      c.translate(-px, 0);
    }

    // Hat
    c.fillStyle = '#b45309';
    c.fillRect(px, py, PLAYER_W, 4);
    // Head
    c.fillStyle = '#fcd34d';
    c.fillRect(px + 1, py + 4, PLAYER_W - 2, 7);
    // Body (jacket)
    c.fillStyle = '#16a34a';
    c.fillRect(px, py + 11, PLAYER_W, 6);
    // Backpack
    c.fillStyle = '#78350f';
    c.fillRect(px + 7, py + 9, 4, 6);
    // Legs
    c.fillStyle = '#1d4ed8';
    if (!isMoving) {
      c.fillRect(px + 1, py + 17, 4, 5);
      c.fillRect(px + 5, py + 17, 4, 5);
    } else if (this.walkFrame === 0) {
      c.fillRect(px, py + 17, 4, 5); // left leg forward
      c.fillRect(px + 5, py + 15, 4, 5); // right leg back
    } else {
      c.fillRect(px + 5, py + 17, 4, 5); // right leg forward
      c.fillRect(px, py + 15, 4, 5); // left leg back
    }
    // Hiking poles
    c.fillStyle = '#a3a3a3';
    const poleWobble = isMoving ? 0 : Math.sin(this.time * 2) * 1;
    c.fillRect(px - 2, py + 13 + poleWobble, 2, 9);
    c.fillRect(px + PLAYER_W, py + 13 - poleWobble, 2, 9);

    c.restore();
  }

  private drawBubble(c: CanvasRenderingContext2D, refuge: Refuge, scale: number): void {
    const bx = refuge.x;
    const w = 110;
    const h = 38;
    const by = Math.max(h, refuge.y - 30);

    c.save();
    c.translate(bx, by);
    c.scale(scale, scale);
    c.translate(-bx, -by);

    // Bubble background
    c.fillStyle = '#1e293b';
    c.strokeStyle = '#6366f1';
    c.lineWidth = 1.5;
    this.drawRoundedRect(c, bx - w / 2, by - h, w, h, 5);
    c.fill();
    c.stroke();

    // Pointer triangle
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.moveTo(bx - 5, by);
    c.lineTo(bx + 5, by);
    c.lineTo(bx, by + 6);
    c.fill();
    c.strokeStyle = '#6366f1';
    c.stroke();

    // Text
    c.textAlign = 'center';
    c.font = 'bold 5px monospace';
    c.fillStyle = '#a5b4fc';
    c.fillText(`📋 ${refuge.label}`, bx, by - h + 10);
    c.font = '4px monospace';
    c.fillStyle = '#94a3b8';
    c.fillText(refuge.stat, bx, by - h + 20);
    c.fillStyle = '#6366f1';
    c.font = 'bold 4px monospace';
    c.fillText('[ ESPACE ] entrer', bx, by - h + 31);

    c.restore();
  }

  private drawRoundedRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }
}
