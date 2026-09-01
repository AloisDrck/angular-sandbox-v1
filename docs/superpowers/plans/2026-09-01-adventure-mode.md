# Adventure Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ai-dev-toolkit:subagent-driven-development (recommended) or ai-dev-toolkit:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la page d'accueil `/` par une scène pixel art jouable où un randonneur navigue en lacets vers 4 refuges représentant les sections du portfolio.

**Architecture:** Un `GameEngineService` (`providedIn: null`, scopé au composant) gère la boucle `requestAnimationFrame`, les signaux de position, et tout le rendu canvas. `AdventureComponent` monte le canvas, démarre le moteur, écoute le clavier et navigue vers les routes Angular. La position du joueur est sauvegardée dans `sessionStorage` avant chaque navigation et restaurée au retour.

**Tech Stack:** Angular 22 standalone, Canvas 2D API, `requestAnimationFrame`, `sessionStorage`, `isPlatformBrowser` (SSR guard), Tailwind CSS v4, Karma/Jasmine.

---

## Structure des fichiers

```
Créer:
  src/app/features/adventure/scene-data.ts   # Interfaces + constantes (REFUGES, SIGNPOSTS, TERRAIN, SPAWN)
  src/app/features/adventure/game-engine.ts  # Service: game loop, signals, update(), draw()
  src/app/features/adventure/game-engine.spec.ts
  src/app/features/adventure/adventure.ts    # Composant Angular
  src/app/features/adventure/adventure.html  # <canvas> + bouton overlay
  src/app/features/adventure/adventure.spec.ts

Modifier:
  src/app/app.routes.ts            # / → AdventureComponent (lazy), garder /about
  src/app/app.html                 # Remplacer "À propos" par "Aventure" → /
  public/assets/i18n/fr.json      # Remplacer nav.about → nav.adventure
  public/assets/i18n/en.json      # Remplacer nav.about → nav.adventure
```

---

## Task 1 — Types et constantes (`scene-data.ts`)

**Files:**
- Create: `src/app/features/adventure/scene-data.ts`

- [ ] **Step 1 : Créer `scene-data.ts` avec les interfaces et toutes les constantes**

```typescript
export interface Refuge {
  id: string;
  label: string;
  route: string;
  x: number;
  y: number;
  stat: string;
}

export interface SignpostPanel {
  direction: 'left' | 'right' | 'up-left' | 'up-right' | 'down-left';
  label: string;
  distance: string;
}

export interface Signpost {
  x: number;
  y: number;
  panels: SignpostPanel[];
}

export interface TerrainZone {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const CANVAS_W = 480;
export const CANVAS_H = 300;
export const SPAWN_X = 55;
export const SPAWN_Y = 278;
export const PLAYER_W = 10;
export const PLAYER_H = 22;
export const PLAYER_SPEED = 120; // px/s
export const PROXIMITY_RADIUS = 40;

export const REFUGES: Refuge[] = [
  {
    id: 'contact',
    label: 'Contact',
    route: '/contact',
    x: 137,
    y: 215,
    stat: 'Envoyez un message',
  },
  {
    id: 'experience',
    label: 'Expériences',
    route: '/experience',
    x: 210,
    y: 120,
    stat: '4 expériences · 2021–2024',
  },
  {
    id: 'projects',
    label: 'Projets',
    route: '/projects',
    x: 250,
    y: 72,
    stat: '6 projets · Angular · Python',
  },
  {
    id: 'skills',
    label: 'Compétences',
    route: '/skills',
    x: 370,
    y: 55,
    stat: '14 compétences',
  },
];

export const SIGNPOSTS: Signpost[] = [
  {
    x: 90,
    y: 195,
    panels: [{ direction: 'up-right', label: 'Expériences', distance: '~200m' }],
  },
  {
    x: 230,
    y: 168,
    panels: [
      { direction: 'up-right', label: 'Expériences / Projets / Compétences', distance: '→' },
      { direction: 'down-left', label: 'Contact', distance: '~80m' },
    ],
  },
  {
    x: 310,
    y: 148,
    panels: [
      { direction: 'up-left', label: 'Projets', distance: '~120m' },
      { direction: 'up-left', label: 'Compétences', distance: '~250m' },
    ],
  },
];

// Trail segments: each connects two points on the lacet path
export const TRAIL_SEGMENTS: [number, number, number, number][] = [
  [55, 278, 180, 240],   // Spawn → Virage 1
  [180, 240, 90, 195],   // Virage 1 → Virage 2
  [90, 195, 230, 168],   // Virage 2 → Bifurcation
  [230, 168, 310, 148],  // Bifurcation → Virage 3 (main branch)
  [230, 168, 137, 215],  // Bifurcation → Contact (secondary branch)
  [310, 148, 210, 120],  // Virage 3 → Expériences
  [210, 120, 330, 95],   // Expériences → Virage 4
  [330, 95, 250, 72],    // Virage 4 → Projets
  [250, 72, 370, 55],    // Projets → Compétences (summit)
];

export const TERRAIN_ZONES: TerrainZone[] = [
  { xMin: 20, xMax: 100, yMin: 165, yMax: 285 },
  { xMin: 100, xMax: 180, yMin: 140, yMax: 265 },
  { xMin: 180, xMax: 260, yMin: 120, yMax: 240 },
  { xMin: 260, xMax: 330, yMin: 90, yMax: 210 },
  { xMin: 330, xMax: 400, yMin: 68, yMax: 175 },
  { xMin: 400, xMax: 480, yMin: 45, yMax: 145 },
];

export const STAR_POSITIONS: [number, number, number][] = [
  [8, 6, 0.7], [40, 14, 0.4], [90, 5, 0.8], [140, 18, 0.5],
  [210, 9, 0.9], [270, 4, 0.5], [340, 12, 0.7], [400, 6, 0.4],
  [450, 16, 0.8], [470, 8, 0.5], [60, 20, 0.6], [170, 8, 0.7],
  [310, 15, 0.4], [380, 22, 0.9], [25, 30, 0.5],
];
```

- [ ] **Step 2 : Vérifier qu'il n'y a pas d'erreur TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur liée à `scene-data.ts`.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/adventure/scene-data.ts
git commit -m "feat: add adventure mode scene data and constants"
```

---

## Task 2 — GameEngine — classe, signaux et `update()`

**Files:**
- Create: `src/app/features/adventure/game-engine.ts`
- Create: `src/app/features/adventure/game-engine.spec.ts`

- [ ] **Step 1 : Écrire les tests qui échouent pour `update()`**

```typescript
// src/app/features/adventure/game-engine.spec.ts
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { GameEngineService } from './game-engine';
import { SPAWN_X, SPAWN_Y } from './scene-data';

describe('GameEngineService — update()', () => {
  let engine: GameEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GameEngineService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    engine = TestBed.inject(GameEngineService);
    engine.initPosition(SPAWN_X, SPAWN_Y);
  });

  it('se déplace à droite avec ArrowRight', () => {
    engine.keysPressed.add('ArrowRight');
    engine.update(0.1);
    expect(engine.playerX()).toBeGreaterThan(SPAWN_X);
  });

  it('se déplace à gauche avec ArrowLeft', () => {
    engine.keysPressed.add('ArrowLeft');
    engine.update(0.1);
    expect(engine.playerX()).toBeLessThan(SPAWN_X);
  });

  it('ne sort pas de la borne gauche x=20', () => {
    engine.initPosition(20, 278);
    engine.keysPressed.add('ArrowLeft');
    for (let i = 0; i < 50; i++) engine.update(0.1);
    expect(engine.playerX()).toBeGreaterThanOrEqualTo(20);
  });

  it('ne sort pas de la borne droite x=480', () => {
    engine.initPosition(470, 100);
    engine.keysPressed.add('ArrowRight');
    for (let i = 0; i < 50; i++) engine.update(0.1);
    expect(engine.playerX()).toBeLessThanOrEqualTo(480);
  });

  it('clamp Y selon la zone X courante', () => {
    engine.initPosition(50, 100); // zone xMin=20 yMin=165
    engine.update(0.01);
    expect(engine.playerY()).toBeGreaterThanOrEqualTo(165);
  });

  it('détecte la proximité d\'un refuge', () => {
    engine.initPosition(137, 215); // sur Contact
    engine.update(0.01);
    expect(engine.nearbyRefuge()).not.toBeNull();
    expect(engine.nearbyRefuge()?.id).toBe('contact');
  });

  it('n\'a pas de refuge proche quand le joueur est loin', () => {
    engine.initPosition(SPAWN_X, SPAWN_Y);
    engine.update(0.01);
    expect(engine.nearbyRefuge()).toBeNull();
  });
});
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
npx ng test --include='**/game-engine.spec.ts' --watch=false 2>&1 | tail -20
```
Attendu : `ERROR: game-engine not found` ou équivalent.

- [ ] **Step 3 : Créer `game-engine.ts` avec la classe, les signaux et `update()`**

```typescript
// src/app/features/adventure/game-engine.ts
import { Injectable, PLATFORM_ID, inject, signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  CANVAS_W, CANVAS_H, PLAYER_W, PLAYER_H, PLAYER_SPEED, PROXIMITY_RADIUS,
  REFUGES, SIGNPOSTS, TERRAIN_ZONES, TRAIL_SEGMENTS, STAR_POSITIONS,
  SPAWN_X, SPAWN_Y, CANVAS_H as CH,
  Refuge, Signpost,
} from './scene-data';

export interface SmokeParticle {
  x: number;
  y: number;
  alpha: number;
  vy: number;
}

@Injectable()
export class GameEngineService {
  private platformId = inject(PLATFORM_ID);

  // Public signals (readable by the component template)
  readonly playerX: WritableSignal<number> = signal(SPAWN_X);
  readonly playerY: WritableSignal<number> = signal(SPAWN_Y);
  readonly nearbyRefuge: WritableSignal<Refuge | null> = signal(null);
  readonly bubbleScale: WritableSignal<number> = signal(0);

  // Mutable state (internal)
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
    this.playerX.set(x);
    this.playerY.set(y);
  }

  update(dt: number): void {
    this.time += dt;
    const speed = PLAYER_SPEED;
    let dx = 0;
    let dy = 0;

    if (this.keysPressed.has('ArrowRight')) dx += speed * dt;
    if (this.keysPressed.has('ArrowLeft'))  dx -= speed * dt;
    if (this.keysPressed.has('ArrowDown'))  dy += speed * dt;
    if (this.keysPressed.has('ArrowUp'))    dy -= speed * dt;

    if (dx > 0) this.facing = 'right';
    if (dx < 0) this.facing = 'left';

    const nx = Math.max(20, Math.min(CANVAS_W - PLAYER_W, this.playerX() + dx));

    // Find terrain zone for nx
    const zone = TERRAIN_ZONES.find(z => nx >= z.xMin && nx < z.xMax)
      ?? TERRAIN_ZONES[TERRAIN_ZONES.length - 1];
    const ny = Math.max(zone.yMin, Math.min(zone.yMax - PLAYER_H, this.playerY() + dy));

    this.playerX.set(nx);
    this.playerY.set(ny);

    // Walk animation
    if (dx !== 0 || dy !== 0) {
      this.walkTimer += dt;
      if (this.walkTimer >= 0.2) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
      }
    }

    // Smoke particles
    this.updateSmoke(dt);

    // Proximity detection
    const px = this.playerX();
    const py = this.playerY();
    const nearby = REFUGES.find(
      r => Math.hypot(px - r.x, py - r.y) < PROXIMITY_RADIUS
    ) ?? null;
    this.nearbyRefuge.set(nearby);

    // Bubble scale: lerp toward target
    const targetScale = nearby ? 1 : 0;
    const current = this.bubbleScale();
    this.bubbleScale.set(current + (targetScale - current) * Math.min(10 * dt, 1));
  }

  private updateSmoke(dt: number): void {
    // Spawn one particle per refuge every ~30 frames (0.5s)
    if (Math.random() < dt * 2) {
      const refuge = REFUGES[Math.floor(Math.random() * REFUGES.length)];
      this.smokeParticles.push({ x: refuge.x + 4, y: refuge.y - 16, alpha: 0.5, vy: -8 });
    }
    this.smokeParticles = this.smokeParticles
      .map(p => ({ ...p, y: p.y + p.vy * dt, alpha: p.alpha - dt * 0.3 }))
      .filter(p => p.alpha > 0);
  }

  // --- Lifecycle ---

  start(canvas: HTMLCanvasElement, x = SPAWN_X, y = SPAWN_Y): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.initPosition(x, y);
    this.buildOffscreen();
    this.rafId = requestAnimationFrame(t => this.loop(t, t));
  }

  stop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private loop(timestamp: number, last: number): void {
    const dt = Math.min((timestamp - last) / 1000, 0.05);
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(t => this.loop(t, timestamp));
  }

  savePosition(): void {
    sessionStorage.setItem('adventure_x', String(this.playerX()));
    sessionStorage.setItem('adventure_y', String(this.playerY()));
  }

  restorePosition(): { x: number; y: number } {
    const x = Number(sessionStorage.getItem('adventure_x'));
    const y = Number(sessionStorage.getItem('adventure_y'));
    return {
      x: isFinite(x) && x > 0 ? x : SPAWN_X,
      y: isFinite(y) && y > 0 ? y : SPAWN_Y,
    };
  }

  // --- Drawing (stubs — implemented in later tasks) ---

  private buildOffscreen(): void { /* Task 6 */ }
  private draw(): void { /* Task 7 */ }
}
```

- [ ] **Step 4 : Lancer les tests — vérifier qu'ils passent**

```bash
npx ng test --include='**/game-engine.spec.ts' --watch=false 2>&1 | tail -20
```
Attendu : `7 specs, 0 failures`.

- [ ] **Step 5 : Commit**

```bash
git add src/app/features/adventure/game-engine.ts src/app/features/adventure/game-engine.spec.ts
git commit -m "feat: add GameEngineService with signals and update() physics"
```

---

## Task 3 — GameEngine — persistance de position

**Files:**
- Modify: `src/app/features/adventure/game-engine.spec.ts` (ajouter describe block)

- [ ] **Step 1 : Ajouter les tests pour `savePosition` / `restorePosition`**

Ajouter ce bloc describe à la fin de `game-engine.spec.ts` (avant la dernière `}`) :

```typescript
describe('GameEngineService — position persistence', () => {
  let engine: GameEngineService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        GameEngineService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    engine = TestBed.inject(GameEngineService);
  });

  it('savePosition écrit dans sessionStorage', () => {
    engine.initPosition(150, 200);
    engine.savePosition();
    expect(sessionStorage.getItem('adventure_x')).toBe('150');
    expect(sessionStorage.getItem('adventure_y')).toBe('200');
  });

  it('restorePosition lit depuis sessionStorage', () => {
    sessionStorage.setItem('adventure_x', '220');
    sessionStorage.setItem('adventure_y', '130');
    const pos = engine.restorePosition();
    expect(pos.x).toBe(220);
    expect(pos.y).toBe(130);
  });

  it('restorePosition retourne SPAWN si sessionStorage vide', () => {
    const pos = engine.restorePosition();
    expect(pos.x).toBe(SPAWN_X);
    expect(pos.y).toBe(SPAWN_Y);
  });
});
```

- [ ] **Step 2 : Lancer les tests**

```bash
npx ng test --include='**/game-engine.spec.ts' --watch=false 2>&1 | tail -20
```
Attendu : `10 specs, 0 failures`.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/adventure/game-engine.spec.ts
git commit -m "feat: test position persistence in GameEngineService"
```

---

## Task 4 — GameEngine — rendu du fond statique (`buildOffscreen`)

**Files:**
- Modify: `src/app/features/adventure/game-engine.ts`

> Aucun test unitaire pour le rendu canvas (pas de valeur). Vérification visuelle dans le navigateur après Task 8.

- [ ] **Step 1 : Remplacer le stub `buildOffscreen()` par l'implémentation complète**

Remplacer dans `game-engine.ts` la ligne `private buildOffscreen(): void { /* Task 6 */ }` par :

```typescript
private buildOffscreen(): void {
  const oc = document.createElement('canvas');
  oc.width = CANVAS_W;
  oc.height = CANVAS_H;
  const c = oc.getContext('2d')!;
  this.offscreen = oc;

  // Sky
  c.fillStyle = '#0d0d1a';
  c.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars (static base opacity — twinkling is per-frame)
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
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.fill();
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
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.fill();
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
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.fill();
  }

  // Village foreground hill + ground
  c.fillStyle = '#14532d';
  c.beginPath(); c.moveTo(0, 280); c.lineTo(80, 220); c.lineTo(160, 280); c.fill();
  c.fillStyle = '#166534';
  c.fillRect(0, 280, CANVAS_W, 20);
  c.fillStyle = '#15803d';
  c.fillRect(0, 290, CANVAS_W, 10);

  // Trail segments
  this.drawTrailOnCanvas(c);

  // Virage dots
  c.fillStyle = '#c9b458';
  for (const [px, py] of [[180, 240], [90, 195], [310, 148], [330, 95], [250, 72]] as [number, number][]) {
    c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fill();
  }
  // Bifurcation marker
  c.fillStyle = '#f59e0b';
  c.beginPath(); c.arc(230, 168, 6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0d0d1a';
  c.beginPath(); c.arc(230, 168, 3, 0, Math.PI * 2); c.fill();

  // Signposts
  for (const sp of SIGNPOSTS) this.drawSignpost(c, sp);

  // Refuge buildings
  for (const ref of REFUGES) this.drawRefugeBuilding(c, ref.x, ref.y, ref.id === 'skills');

  // Decorative trees
  const trees: [number, number][] = [[20, 268], [155, 252], [100, 215], [290, 152]];
  for (const [tx, ty] of trees) this.drawTree(c, tx, ty);
}

private drawTrailOnCanvas(c: CanvasRenderingContext2D): void {
  // Main trail segments
  c.strokeStyle = '#c9b458';
  c.lineWidth = 3;
  c.setLineDash([6, 4]);
  for (let i = 0; i < TRAIL_SEGMENTS.length; i++) {
    const [x1, y1, x2, y2] = TRAIL_SEGMENTS[i];
    // Secondary branch (Contact) is thinner and more transparent
    if (i === 4) { c.lineWidth = 2; c.globalAlpha = 0.5; }
    else { c.lineWidth = 3; c.globalAlpha = 0.8; }
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  c.setLineDash([]);
  c.globalAlpha = 1;
  c.lineWidth = 1;
}

private drawRefugeBuilding(c: CanvasRenderingContext2D, x: number, y: number, snowCap = false): void {
  // House body
  c.fillStyle = '#92400e';
  c.fillRect(x - 9, y - 14, 18, 14);
  // Roof
  c.fillStyle = '#b45309';
  c.beginPath(); c.moveTo(x - 13, y - 14); c.lineTo(x, y - 26); c.lineTo(x + 13, y - 14); c.fill();
  if (snowCap) {
    c.fillStyle = '#e0e7ff';
    c.globalAlpha = 0.6;
    c.fillRect(x - 13, y - 15, 26, 3);
    c.globalAlpha = 1;
  }
  // Door
  c.fillStyle = '#1c1917';
  c.fillRect(x - 2, y - 8, 4, 8);
  // Window (warm yellow glow)
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
    const py = sp.y + i * 12;
    const panelW = Math.min(panel.label.length * 4.5 + 16, 90);
    const panelX = panel.direction.includes('left') ? sp.x - panelW + 3 : sp.x + 3;
    // Panel background
    c.fillStyle = '#d97706';
    c.fillRect(panelX, py, panelW, 10);
    c.fillStyle = '#b45309';
    c.fillRect(panelX + 1, py + 1, panelW - 2, 8);
    // Text
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
```

- [ ] **Step 2 : Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/adventure/game-engine.ts
git commit -m "feat: implement GameEngine drawBackground with pixel art scene"
```

---

## Task 5 — GameEngine — rendu par frame (`draw()`)

**Files:**
- Modify: `src/app/features/adventure/game-engine.ts`

- [ ] **Step 1 : Remplacer le stub `draw()` par l'implémentation complète**

Remplacer `private draw(): void { /* Task 7 */ }` par :

```typescript
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

  // Layer 4: refuge labels (drawn per-frame because they sit over the buildings)
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
  const px = this.playerX();
  const py = this.playerY();
  const flip = this.facing === 'left';
  const isMoving = this.keysPressed.has('ArrowLeft') || this.keysPressed.has('ArrowRight')
    || this.keysPressed.has('ArrowUp') || this.keysPressed.has('ArrowDown');

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
    c.fillRect(px, py + 17, 4, 5);     // left leg forward
    c.fillRect(px + 5, py + 15, 4, 5); // right leg back
  } else {
    c.fillRect(px + 5, py + 17, 4, 5); // right leg forward
    c.fillRect(px, py + 15, 4, 5);     // left leg back
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
  const by = refuge.y - 30;
  const w = 110;
  const h = 38;

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

  // Text lines
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
  x: number, y: number, w: number, h: number, r: number
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
```

- [ ] **Step 2 : Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/app/features/adventure/game-engine.ts
git commit -m "feat: implement GameEngine per-frame draw (player, bubble, smoke)"
```

---

## Task 6 — AdventureComponent + template

**Files:**
- Create: `src/app/features/adventure/adventure.ts`
- Create: `src/app/features/adventure/adventure.html`
- Create: `src/app/features/adventure/adventure.spec.ts`

- [ ] **Step 1 : Écrire les tests pour `AdventureComponent`**

```typescript
// src/app/features/adventure/adventure.spec.ts
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AdventureComponent } from './adventure';
import { GameEngineService } from './game-engine';

describe('AdventureComponent', () => {
  let engineStartSpy: jasmine.Spy;
  let engineStopSpy: jasmine.Spy;

  beforeEach(() => {
    engineStartSpy = jasmine.createSpy('start');
    engineStopSpy = jasmine.createSpy('stop');

    TestBed.configureTestingModule({
      imports: [AdventureComponent],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: GameEngineService,
          useValue: {
            start: engineStartSpy,
            stop: engineStopSpy,
            savePosition: jasmine.createSpy('savePosition'),
            restorePosition: jasmine.createSpy('restorePosition').and.returnValue({ x: 55, y: 278 }),
            nearbyRefuge: jasmine.createSpy('nearbyRefuge').and.returnValue(null),
            bubbleScale: jasmine.createSpy('bubbleScale').and.returnValue(0),
            keysPressed: new Set<string>(),
          },
        },
      ],
    });
  });

  it('démarre le moteur après init du canvas', fakeAsync(() => {
    const fixture = TestBed.createComponent(AdventureComponent);
    fixture.detectChanges();
    tick();
    expect(engineStartSpy).toHaveBeenCalled();
  }));

  it('arrête le moteur à la destruction', fakeAsync(() => {
    const fixture = TestBed.createComponent(AdventureComponent);
    fixture.detectChanges();
    tick();
    fixture.destroy();
    expect(engineStopSpy).toHaveBeenCalled();
  }));
});
```

- [ ] **Step 2 : Lancer les tests — vérifier qu'ils échouent**

```bash
npx ng test --include='**/adventure.spec.ts' --watch=false 2>&1 | tail -20
```
Attendu : `ERROR: adventure not found` ou équivalent.

- [ ] **Step 3 : Créer `adventure.html`**

```html
<!-- src/app/features/adventure/adventure.html -->
<div class="relative w-full flex justify-center">
  <canvas
    #scene
    [attr.width]="480"
    [attr.height]="300"
    class="w-full max-w-3xl h-auto block border border-gray-700 rounded-lg"
    style="image-rendering: pixelated; image-rendering: crisp-edges;"
  ></canvas>

  @if (engine.bubbleScale() > 0.05 && engine.nearbyRefuge()) {
    <button
      (click)="enterRefuge()"
      class="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition"
    >
      Entrer dans le refuge
    </button>
  }
</div>
```

- [ ] **Step 4 : Créer `adventure.ts`**

```typescript
// src/app/features/adventure/adventure.ts
import {
  Component, ElementRef, OnDestroy, ViewChild, inject,
  PLATFORM_ID, AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { GameEngineService } from './game-engine';

@Component({
  selector: 'app-adventure',
  imports: [],
  templateUrl: './adventure.html',
  providers: [GameEngineService],
})
export class AdventureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scene') private canvasRef!: ElementRef<HTMLCanvasElement>;

  protected engine = inject(GameEngineService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private onKeyDown = (e: KeyboardEvent) => {
    const nav = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'Escape'];
    if (nav.includes(e.code)) e.preventDefault();
    this.engine.keysPressed.add(e.code);
    if ((e.code === 'Space' || e.code === 'Enter') && this.engine.nearbyRefuge()) {
      this.enterRefuge();
    }
    if (e.code === 'Escape') this.engine.keysPressed.clear();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.engine.keysPressed.delete(e.code);
  };

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const { x, y } = this.engine.restorePosition();
    this.engine.start(this.canvasRef.nativeElement, x, y);
  }

  ngOnDestroy(): void {
    this.engine.stop();
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
    }
  }

  protected enterRefuge(): void {
    const refuge = this.engine.nearbyRefuge();
    if (!refuge) return;
    this.engine.savePosition();
    this.router.navigate([refuge.route]);
  }
}
```

- [ ] **Step 5 : Lancer les tests**

```bash
npx ng test --include='**/adventure.spec.ts' --watch=false 2>&1 | tail -20
```
Attendu : `2 specs, 0 failures`.

- [ ] **Step 6 : Commit**

```bash
git add src/app/features/adventure/adventure.ts src/app/features/adventure/adventure.html src/app/features/adventure/adventure.spec.ts
git commit -m "feat: add AdventureComponent with canvas lifecycle and keyboard handling"
```

---

## Task 7 — Routing et navbar

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/app.html`
- Modify: `public/assets/i18n/fr.json`
- Modify: `public/assets/i18n/en.json`

- [ ] **Step 1 : Mettre à jour `app.routes.ts` — `'/'` → `AdventureComponent`**

Remplacer la ligne `{ path: '', redirectTo: 'about', pathMatch: 'full' },` et la route `'about'` par :

```typescript
{
  path: '',
  loadComponent: () =>
    import('./features/adventure/adventure').then((m) => m.AdventureComponent),
},
{
  path: 'about',
  redirectTo: '',
  pathMatch: 'full',
},
```

Le fichier complet devient :

```typescript
import { Routes } from '@angular/router';
import { projectResolver } from './features/projects/project.resolver';
import { canDeactivateContact } from './features/contact/can-deactivate.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/adventure/adventure').then((m) => m.AdventureComponent),
  },
  {
    path: 'about',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'experience',
    loadComponent: () =>
      import('./features/experience/experience').then((m) => m.ExperienceComponent),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/projects/projects').then((m) => m.ProjectsComponent),
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('./features/projects/project-detail/project-detail').then(
        (m) => m.ProjectDetailComponent,
      ),
    resolve: { project: projectResolver },
  },
  {
    path: 'skills',
    loadComponent: () =>
      import('./features/skills/skills').then((m) => m.SkillsComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact').then((m) => m.ContactComponent),
    canDeactivate: [canDeactivateContact],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFoundComponent),
  },
];
```

- [ ] **Step 2 : Mettre à jour `app.html` — remplacer le lien "À propos" par "Aventure"**

Remplacer le `<li>` du lien "À propos" (qui pointe sur `/about`) par un lien vers `/` :

```html
<li>
  <a
    routerLink="/"
    routerLinkActive="font-semibold text-blue-600 dark:text-sky-400"
    [routerLinkActiveOptions]="{ exact: true }"
    class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm dark:text-gray-200"
    >{{ i18n.t('nav.adventure') }}</a
  >
</li>
```

Ajouter `RouterLinkActiveOptions` aux imports de `AppComponent` si pas déjà présent — non, `[routerLinkActiveOptions]` est une propriété de `RouterLinkActive` qui est déjà importée. Ajouter l'import de `RouterLinkActiveOptions` n'est pas nécessaire car c'est une interface, pas un token.

- [ ] **Step 3 : Mettre à jour les fichiers i18n**

`public/assets/i18n/fr.json` — remplacer `"nav.about": "À propos"` par `"nav.adventure": "Aventure"` :

```json
{
  "nav.adventure": "Aventure",
  "nav.experience": "Expériences",
  "nav.projects": "Projets",
  "nav.skills": "Compétences",
  "nav.contact": "Contact",
  "about.title": "À propos",
  "about.location": "Localisation",
  "about.links": "Liens",
  "experience.title": "Expériences",
  "experience.type.academic": "Académique",
  "experience.type.professional": "Professionnel",
  "projects.title": "Projets",
  "projects.filter.all": "Tous",
  "projects.viewProject": "Voir le projet",
  "projects.backToList": "Retour à la liste",
  "skills.title": "Compétences",
  "skills.category.backend": "Backend",
  "skills.category.frontend": "Frontend",
  "skills.category.devops": "DevOps",
  "skills.category.data": "Data",
  "contact.title": "Contact",
  "contact.name": "Nom",
  "contact.email": "Email",
  "contact.message": "Message",
  "contact.send": "Envoyer",
  "contact.leaveConfirm": "Quitter ? Votre message sera perdu.",
  "notFound.title": "Page introuvable",
  "notFound.back": "Retour à l'accueil"
}
```

`public/assets/i18n/en.json` — remplacer `"nav.about": "About"` par `"nav.adventure": "Adventure"` :

```json
{
  "nav.adventure": "Adventure",
  "nav.experience": "Experience",
  "nav.projects": "Projects",
  "nav.skills": "Skills",
  "nav.contact": "Contact",
  "about.title": "About",
  "about.location": "Location",
  "about.links": "Links",
  "experience.title": "Experience",
  "experience.type.academic": "Academic",
  "experience.type.professional": "Professional",
  "projects.title": "Projects",
  "projects.filter.all": "All",
  "projects.viewProject": "Check out the project",
  "projects.backToList": "Back to list",
  "skills.title": "Skills",
  "skills.category.backend": "Backend",
  "skills.category.frontend": "Frontend",
  "skills.category.devops": "DevOps",
  "skills.category.data": "Data",
  "contact.title": "Contact",
  "contact.name": "Name",
  "contact.email": "Email",
  "contact.message": "Message",
  "contact.send": "Send",
  "contact.leaveConfirm": "Leave? Your message will be lost.",
  "notFound.title": "Page not found",
  "notFound.back": "Back to home"
}
```

- [ ] **Step 4 : Lancer la suite de tests complète**

```bash
npx ng test --watch=false 2>&1 | tail -30
```
Attendu : tous les tests passent. Si `app.spec.ts` échoue à cause du redirect `/about`, vérifier que le test attendait `redirectTo: 'about'` et mettre à jour.

- [ ] **Step 5 : Build de vérification**

```bash
npx ng build 2>&1 | tail -20
```
Attendu : `Application bundle generation complete.`

- [ ] **Step 6 : Prettier + lint**

```bash
npx prettier --write src/app/app.routes.ts src/app/app.html public/assets/i18n/fr.json public/assets/i18n/en.json
npx ng lint 2>&1 | tail -10
```

- [ ] **Step 7 : Commit**

```bash
git add src/app/app.routes.ts src/app/app.html public/assets/i18n/fr.json public/assets/i18n/en.json
git commit -m "feat: wire adventure mode as home page, replace About nav link"
```

---

## Task 8 — Vérification visuelle locale

> Cette tâche n'est pas automatisable — elle requiert une inspection dans le navigateur.

- [ ] **Step 1 : Lancer le serveur de dev**

```bash
npm run dev
```

- [ ] **Step 2 : Vérifier dans le navigateur (http://localhost:4200)**

Checklist visuelle :
- [ ] La page d'accueil affiche la scène pixel art (ciel étoilé, montagnes, sentier en lacets)
- [ ] Le randonneur apparaît en bas à gauche
- [ ] Les 4 touches fléchées déplacent le personnage
- [ ] Le personnage est bloqué par les limites de terrain (ne traverse pas les montagnes)
- [ ] Approcher un refuge affiche la bulle de dialogue avec animation
- [ ] Appuyer sur Espace navigue vers la section correspondante
- [ ] Revenir sur `/` depuis une section : le randonneur est à sa dernière position
- [ ] Les pancartes d'indication sont visibles aux virages
- [ ] La fumée sort des cheminées
- [ ] Les étoiles clignotent légèrement
- [ ] La navbar affiche "Aventure" à la place de "À propos"
- [ ] Le lien "Aventure" dans la navbar est actif (surligné) quand on est sur `/`
- [ ] Le thème sombre fonctionne (la navbar et le fond du portfolio s'adaptent)

- [ ] **Step 3 : Commit final si tout est OK**

```bash
git add -A
git status  # vérifier qu'il n'y a rien de non voulu
git commit -m "feat: adventure mode complete - visual verification passed"
```

---

## Checklist self-review spec

### 1. Couverture spec

| Section spec | Tâche couverte |
|---|---|
| §1 Routing `/` → AdventureComponent | Task 7 |
| §2 AdventureComponent, GameEngineService signals | Task 2, 6 |
| §3 Canvas 480×300, offscreen canvas fond | Task 4 |
| §3 Sentier en lacets (8 tronçons) | Task 4 |
| §3 Terrain walkable par zones X | Task 2 |
| §4 REFUGES (4 refuges, coords) | Task 1 |
| §5 SIGNPOSTS (3 pancartes) | Task 1, 4 |
| §6 Game loop rAF 60fps | Task 2 (`start`/`loop`) |
| §6 update() mouvement + clamp + proximité | Task 2 |
| §7 Personnage pixel art (walk, idle, facing) | Task 5 |
| §8 Bulle de dialogue (scale animé) | Task 5 |
| §9 Pancarte À propos → supprimée | Task 7 |
| §10 Clavier ←→↑↓, Espace, Entrée, Escape | Task 6 |
| §11 Position persistence sessionStorage | Task 3 |
| §12 `prefers-reduced-motion` + responsive | Non implémenté v1 — hors scope |
| §12 Bouton overlay cliquable | Task 6 (adventure.html) |

### 2. Points d'attention

- **SSR** : `buildOffscreen()` et `start()` sont protégés par `isPlatformBrowser` → pas d'appel à `document` côté serveur.
- **`providedIn: null`** : `GameEngineService` est instancié via `providers: [GameEngineService]` dans le composant — chaque visite crée une nouvelle instance.
- **Import `RouterLinkActiveOptions`** : `[routerLinkActiveOptions]="{ exact: true }"` est une propriété de `RouterLinkActive`, déjà importé via `RouterLinkActive` — aucun import supplémentaire nécessaire.
- **`app.spec.ts`** : peut échouer si un test vérifie `redirectTo: 'about'`. Vérifier et corriger à Task 7 étape 4.
