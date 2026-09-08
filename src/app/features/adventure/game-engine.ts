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
  private textCanvas: HTMLCanvasElement | null = null;
  private textCtx: CanvasRenderingContext2D | null = null;

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

  start(canvas: HTMLCanvasElement, textCanvas: HTMLCanvasElement, x = SPAWN_X, y = SPAWN_Y): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.textCanvas = textCanvas;
    this.textCtx = textCanvas.getContext('2d')!;
    this.resize(textCanvas);
    this.initPosition(x, y);
    this.buildOffscreen();
    this.rafId = requestAnimationFrame((t) => this.loop(t, t));
  }

  resize(textCanvas: HTMLCanvasElement): void {
    const dpr = window.devicePixelRatio || 1;
    const w = textCanvas.clientWidth;
    const h = textCanvas.clientHeight;
    if (w > 0 && h > 0) {
      textCanvas.width = Math.round(w * dpr);
      textCanvas.height = Math.round(h * dpr);
    }
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

    const fillPoly = (pts: [number, number][]) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.closePath();
      c.fill();
    };

    // Sky gradient
    const skyGrad = c.createLinearGradient(0, 0, 0, CANVAS_H);
    skyGrad.addColorStop(0, '#05090f');
    skyGrad.addColorStop(0.55, '#0c1428');
    skyGrad.addColorStop(1, '#142038');
    c.fillStyle = skyGrad;
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars (static base — twinkling is per-frame)
    c.fillStyle = '#ffffff';
    for (const [sx, sy] of STAR_POSITIONS) c.fillRect(sx, sy, 2, 2);

    // Moon (crescent)
    c.fillStyle = '#fde68a';
    c.fillRect(430, 18, 18, 18);
    c.fillStyle = '#05090f';
    c.globalAlpha = 0.45;
    c.fillRect(434, 18, 10, 18);
    c.globalAlpha = 1;

    // Distant mountains — 2 depth layers
    c.fillStyle = '#0b0f22';
    fillPoly([[0, 192], [62, 92], [124, 192]]);
    fillPoly([[108, 192], [218, 68], [328, 192]]);
    fillPoly([[305, 192], [410, 90], [480, 192]]);

    c.fillStyle = '#111530';
    fillPoly([[25, 196], [130, 106], [228, 196]]);
    fillPoly([[188, 196], [302, 76], [418, 196]]);

    // Snow caps on far peaks
    c.fillStyle = '#9ab4e0';
    c.globalAlpha = 0.22;
    fillPoly([[56, 100], [62, 92], [68, 100]]);
    fillPoly([[212, 76], [218, 68], [224, 76]]);
    fillPoly([[404, 98], [410, 90], [416, 98]]);
    c.globalAlpha = 1;

    // Main mountain — single shape, summit at y=22 (above all refuges)
    // Verified: all refuge/trail coords fall inside this polygon
    const mtn: [number, number][] = [
      [0, CANVAS_H], [480, CANVAS_H],
      [480, 112], [438, 65], [395, 42],
      [365, 22],
      [310, 45], [250, 60],
      [200, 105], [140, 192], [78, 185],
      [45, 252], [0, 272],
    ];

    // Base fill
    c.fillStyle = '#1a1f4c';
    fillPoly(mtn);

    // 3D ridge effect — diagonal stripes clipped to mountain silhouette
    c.save();
    c.beginPath();
    c.moveTo(mtn[0][0], mtn[0][1]);
    for (const [mx, my] of mtn.slice(1)) c.lineTo(mx, my);
    c.closePath();
    c.clip();

    c.strokeStyle = '#252b65';
    c.lineWidth = 1.5;
    c.globalAlpha = 0.55;
    for (let t = -CANVAS_H; t < CANVAS_W + CANVAS_H; t += 11) {
      c.beginPath();
      c.moveTo(t, CANVAS_H);
      c.lineTo(t + 256, 0);
      c.stroke();
    }
    c.strokeStyle = '#323c80';
    c.lineWidth = 0.8;
    c.globalAlpha = 0.3;
    for (let t = -CANVAS_H; t < CANVAS_W + CANVAS_H; t += 11) {
      c.beginPath();
      c.moveTo(t + 4, CANVAS_H);
      c.lineTo(t + 260, 0);
      c.stroke();
    }
    c.globalAlpha = 1;
    c.restore();

    // Shadow — steep right cliff face
    c.fillStyle = '#0e1230';
    c.globalAlpha = 0.68;
    fillPoly([
      [365, 22], [395, 42], [438, 65], [480, 112], [480, 300],
      [450, 300], [428, 248], [405, 195], [388, 148], [372, 102], [362, 60],
    ]);
    c.globalAlpha = 1;

    // Snow cap
    c.fillStyle = '#b2caf0';
    c.globalAlpha = 0.72;
    fillPoly([[365, 22], [395, 42], [380, 52], [350, 46], [320, 54], [330, 40]]);
    c.fillStyle = '#dae8ff';
    c.globalAlpha = 0.65;
    fillPoly([[365, 22], [372, 30], [365, 36], [358, 30]]);
    c.globalAlpha = 1;

    // Foreground ground
    c.fillStyle = '#0c2c12';
    c.beginPath();
    c.moveTo(0, CANVAS_H);
    c.lineTo(0, 272);
    c.lineTo(40, 260);
    c.lineTo(88, 264);
    c.lineTo(155, 276);
    c.lineTo(CANVAS_W, 280);
    c.lineTo(CANVAS_W, CANVAS_H);
    c.closePath();
    c.fill();
    c.fillStyle = '#144820';
    c.fillRect(0, 285, CANVAS_W, 15);
    c.fillStyle = '#1a5c28';
    c.fillRect(0, 292, CANVAS_W, 8);

    // Trail
    this.drawTrailOnCanvas(c);

    // Virage turn markers
    c.fillStyle = '#c9b458';
    for (const [px, py] of [
      [180, 240], [90, 195], [310, 148], [330, 95], [250, 72],
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
    c.fillStyle = '#080d1c';
    c.beginPath();
    c.arc(230, 168, 3, 0, Math.PI * 2);
    c.fill();

    // Signposts
    for (const sp of SIGNPOSTS) this.drawSignpost(c, sp);

    // Refuge buildings
    for (const ref of REFUGES) this.drawRefugeBuilding(c, ref.x, ref.y, ref.id === 'skills');

    // Decorative trees
    for (const [tx, ty] of [
      [20, 268], [155, 252], [100, 215], [290, 152],
    ] as [number, number][]) {
      this.drawTree(c, tx, ty);
    }
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

  private signpostPanelW(panel: { label: string; distance: string }): number {
    const fullLen = (panel.label.length + panel.distance.length + 4) * 3;
    return Math.min(Math.max(fullLen + 12, 36), 100);
  }

  private drawSignpost(c: CanvasRenderingContext2D, sp: Signpost): void {
    const postH = 14 + sp.panels.length * 12;
    c.fillStyle = '#92400e';
    c.fillRect(sp.x, sp.y, 3, postH);

    for (let i = 0; i < sp.panels.length; i++) {
      const panel = sp.panels[i];
      const py = sp.y + 14 + i * 12;
      const panelW = this.signpostPanelW(panel);
      const panelX = panel.direction.includes('left') ? sp.x - panelW + 3 : sp.x + 3;
      c.fillStyle = '#d97706';
      c.fillRect(panelX, py, panelW, 10);
      c.fillStyle = '#b45309';
      c.fillRect(panelX + 1, py + 1, panelW - 2, 8);
      // Text drawn on high-DPI text layer
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

    // Layer 4: player
    this.drawPlayer(c);

    // Layer 5: crisp text overlay (labels, signposts, bubble)
    this.drawTextLayer();
  }

  private drawTextLayer(): void {
    if (!this.textCtx || !this.textCanvas) return;
    const tc = this.textCtx;
    const { width: tw, height: th } = this.textCanvas;
    if (tw === 0 || th === 0) return;

    tc.clearRect(0, 0, tw, th);
    tc.save();
    // Scale so logical coords (0–480, 0–300) map to native display pixels
    tc.scale(tw / CANVAS_W, th / CANVAS_H);

    // Refuge labels
    tc.textAlign = 'center';
    tc.font = 'bold 5px "IM Fell English", "Georgia", serif';
    for (const ref of REFUGES) {
      const lw = tc.measureText(ref.label).width + 12;
      tc.fillStyle = '#1e1b4b';
      tc.globalAlpha = 0.88;
      tc.fillRect(ref.x - lw / 2, ref.y + 2, lw, 9);
      tc.globalAlpha = 1;
      tc.fillStyle = '#a5b4fc';
      tc.fillText(ref.label, ref.x, ref.y + 9);
    }

    // Signpost panel text (arrow at far tip, away from post)
    tc.font = 'italic 4px "IM Fell English", "Georgia", serif';
    for (const sp of SIGNPOSTS) {
      for (let i = 0; i < sp.panels.length; i++) {
        const panel = sp.panels[i];
        const py = sp.y + 14 + i * 12;
        const panelW = this.signpostPanelW(panel);
        const isLeft = panel.direction.includes('left');
        const panelX = isLeft ? sp.x - panelW + 3 : sp.x + 3;
        const dist = panel.distance ? ` ${panel.distance}` : '';
        tc.fillStyle = '#fef3c7';
        if (isLeft) {
          // Arrow at left (far) tip, text left-aligned
          tc.textAlign = 'left';
          tc.fillText(`← ${panel.label}${dist}`, panelX + 3, py + 7);
        } else {
          // Arrow at right (far) tip, text right-aligned
          tc.textAlign = 'right';
          tc.fillText(`${panel.label}${dist} →`, panelX + panelW - 3, py + 7);
        }
      }
    }

    // Speech bubble
    const scale = this.bubbleScale();
    const refuge = this.nearbyRefuge();
    if (scale > 0.05 && refuge) {
      this.drawBubbleOnTextLayer(tc, refuge, scale);
    }

    tc.restore();
  }

  private drawBubbleOnTextLayer(tc: CanvasRenderingContext2D, refuge: Refuge, scale: number): void {
    const bw = 120;
    const bh = 44;
    const bx = refuge.x;
    const by = Math.max(bh, refuge.y - 30);

    tc.save();
    tc.translate(bx, by);
    tc.scale(scale, scale);
    tc.translate(-bx, -by);

    tc.fillStyle = '#1e293b';
    tc.strokeStyle = '#6366f1';
    tc.lineWidth = 1.5;
    this.drawRoundedRect(tc, bx - bw / 2, by - bh, bw, bh, 5);
    tc.fill();
    tc.stroke();

    tc.fillStyle = '#1e293b';
    tc.beginPath();
    tc.moveTo(bx - 5, by);
    tc.lineTo(bx + 5, by);
    tc.lineTo(bx, by + 6);
    tc.fill();
    tc.strokeStyle = '#6366f1';
    tc.stroke();

    tc.textAlign = 'center';
    tc.font = 'bold 6px "IM Fell English", "Georgia", serif';
    tc.fillStyle = '#a5b4fc';
    tc.fillText(`⛺ ${refuge.label}`, bx, by - bh + 12);
    tc.font = '4.5px "IM Fell English", "Georgia", serif';
    tc.fillStyle = '#94a3b8';
    tc.fillText(refuge.stat, bx, by - bh + 22);
    tc.fillStyle = '#818cf8';
    tc.font = 'bold 4.5px "IM Fell English", "Georgia", serif';
    tc.fillText('[ ESPACE ]  entrer', bx, by - bh + 34);

    tc.restore();
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
