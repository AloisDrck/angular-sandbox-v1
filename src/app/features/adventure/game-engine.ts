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
  PLAYER_W,
  PLAYER_H,
  PLAYER_SPEED,
  PROXIMITY_RADIUS,
  SPAWN_X,
  SPAWN_Y,
  REFUGES,
  TERRAIN_ZONES,
  Refuge,
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

  // Stubs — implemented in Tasks 4 and 5
  private buildOffscreen(): void {
    /* implemented in Task 4 */
  }
  private draw(): void {
    /* implemented in Task 5 */
  }
}
