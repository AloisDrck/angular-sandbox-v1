# Design Spec — Adventure Mode (Hiking Portfolio)

**Date:** 2026-08-31
**Scope:** Nouvelle feature `adventure` — remplace la page d'accueil `/` par une scène pixel art jouable

---

## Overview

La page d'accueil du portfolio devient une scène pixel art interactive : un randonneur au pied d'une chaîne de montagnes que l'utilisateur contrôle au clavier. La montagne comporte un sentier avec dénivelé menant à 4 refuges (Expériences, Projets, Compétences, Contact). Approcher un refuge affiche une bulle de dialogue RPG ; appuyer sur Espace/Entrée navigue vers la section correspondante. La navbar classique reste présente en haut pour la navigation directe.

---

## 1. Routing

La route `/` charge `AdventureComponent` au lieu de rediriger vers `/about`. Les autres routes restent inchangées.

```
/           → AdventureComponent  (nouveau, lazy)
/experience → ExperienceComponent (inchangé)
/projects   → ProjectsComponent   (inchangé)
/skills     → SkillsComponent     (inchangé)
/contact    → ContactComponent    (inchangé)
```

L'`AboutComponent` est retiré des routes (ses données sont intégrées dans la pancarte de départ de la scène). Le lien "À propos" dans la navbar est supprimé ou redirigé vers `/`.

---

## 2. Architecture

```
src/app/features/adventure/
├── adventure.ts        # Composant Angular standalone
├── adventure.html      # <canvas #scene> + bouton overlay
├── game-engine.ts      # Service injectable : game loop, état, signals
```

### `AdventureComponent`

- Monte le canvas via `@ViewChild('scene') canvas: ElementRef<HTMLCanvasElement>`
- Restaure la position depuis `sessionStorage` puis démarre `GameEngine.start(canvas, initialX, initialY)` dans `ngAfterViewInit`
- Appelle `GameEngine.stop()` dans `ngOnDestroy`
- Écoute `keydown` sur `window` pour `Espace`/`Entrée` → `GameEngine.savePosition()` puis `router.navigate()`
- Charge les données About via `PortfolioService.getAbout()` (`toSignal`) et les passe à `GameEngine`
- Affiche un `<button>` HTML en `position: absolute` au-dessus du canvas quand `nearbyRefuge()` est non-nul

### `GameEngine` (service `providedIn: null` — instancié par le composant)

Signals exposés :

| Signal | Type | Description |
|---|---|---|
| `playerX` | `WritableSignal<number>` | Position X du joueur |
| `playerY` | `WritableSignal<number>` | Position Y du joueur, contrôlée par ↑↓ et contrainte par le terrain |
| `nearbyRefuge` | `WritableSignal<Refuge \| null>` | Refuge dans le rayon de proximité |
| `bubbleScale` | `WritableSignal<number>` | 0→1, animation d'apparition de la bulle |

---

## 3. Scène pixel art

### Dimensions canvas

`480 × 300` px logiques, mis à l'échelle CSS pour remplir le viewport (`width: 100%; height: auto`). Ratio fixe 8:5.

### Couches de rendu

1. **Fond statique (offscreen canvas)** — dessiné une seule fois au chargement : ciel étoilé, lune, montagnes arrière (2 couches), terrain en paliers, arbres, sentier en lacets, pancartes.
2. **Effets ambiants** — redessinés chaque frame : particules de fumée (3 par refuge), étoiles clignotantes (`sin(time)`), oscillation des bâtons du randonneur au repos.
3. **Joueur** — redessiné chaque frame avec animation de marche (2 frames alternées toutes les 200ms, ou idle).
4. **Bulle de dialogue** — dessinée par-dessus quand `nearbyRefuge !== null`, avec scale animée.

### Disposition des éléments — sentier en lacets

Le sentier monte en zigzag irrégulier depuis le bas-gauche jusqu'au sommet. Une bifurcation permet d'accéder à Contact en raccourci. Les refuges sont répartis à différentes altitudes.

```
Sommet (droite)   ○──────────────── [Compétences] x=370 y=55
                  ↗ lacet 4
              ○── [Projets] x=250 y=72
              ↖ lacet 3
        [Expériences] ──○ x=210 y=120
x=330 y=95 virage 4 ↗
          ○──────── virage 3 x=310 y=148
          ↖ lacet 2
    [Contact] ←──── BIFURCATION x=230 y=168 ──→ lacet 2 continue
    x=137 y=215     ↑ branche secondaire
          virage 2 ○ x=90 y=195
          ↗ lacet 1
    virage 1 ○ x=180 y=240
    ↖ départ
[Randonneur spawn] x=55 y=278
```

Tronçons du sentier (tracés en tirets ocre `#c9b458`, largeur 3px) :

| # | De | À | Direction |
|---|---|---|---|
| 0 | Spawn (55, 278) | Virage 1 (180, 240) | ↗ diagonal |
| 1 | Virage 1 | Virage 2 (90, 195) | ↖ diagonal |
| 2 | Virage 2 | Bifurcation (230, 168) | ↗ diagonal |
| 3a | Bifurcation | Virage 3 (310, 148) | → légèrement haut *(branche principale)* |
| 3b | Bifurcation | Contact (137, 215) | ↙ *(branche secondaire, tirets fins)* |
| 4 | Virage 3 | Expériences (210, 120) | ↖ |
| 5 | Expériences | Virage 4 (330, 95) | ↗ |
| 6 | Virage 4 | Projets (250, 72) | ↖ |
| 7 | Projets | Compétences (370, 55) | ↗ *(sommet)* |

### Zone de déplacement — terrain walkable

Le joueur se déplace librement en 4 directions (←→↑↓) dans une bande praticable définie par colonnes X. Les bornes sont volontairement larges pour permettre à l'utilisateur d'explorer hors du sentier (effet immersif), mais restent cohérentes avec le terrain montagneux.

| Zone X | Y minimum (plafond) | Y maximum (sol) | Description |
|---|---|---|---|
| 20 → 100 | 165 | 285 | Village — bas de montagne |
| 100 → 180 | 140 | 265 | Lacet 1 — première montée |
| 180 → 260 | 120 | 240 | Zone bifurcation / Expériences |
| 260 → 330 | 90 | 210 | Lacet 3 — montée raide |
| 330 → 400 | 68 | 175 | Zone Projets / Virage 4 |
| 400 → 480 | 45 | 145 | Zone sommet — Compétences |

Le joueur ne peut pas sortir de x=20 à x=480, ni dépasser le plafond ou le sol de sa zone X courante. Le sentier dessiné est un guide visuel indicatif, pas une contrainte physique.

---

## 4. Données des refuges

```typescript
interface Refuge {
  id: string;
  label: string;
  route: string;
  x: number;
  y: number;
  stat: string;
}

const REFUGES: Refuge[] = [
  { id: 'contact',    label: 'Contact',      route: '/contact',
    x: 137, y: 215, stat: 'Envoyez un message' },
  { id: 'experience', label: 'Expériences',  route: '/experience',
    x: 210, y: 120, stat: '4 expériences · 2021–2024' },
  { id: 'projects',   label: 'Projets',      route: '/projects',
    x: 250, y: 72,  stat: '6 projets · Angular · Python' },
  { id: 'skills',     label: 'Compétences',  route: '/skills',
    x: 370, y: 55,  stat: '14 compétences' },
];

const PROXIMITY_RADIUS = 40; // px logiques
```

## 5. Pancartes d'indication (signposts)

Des pancartes pixel art (poteau bois + lames directionnelles) sont placées aux virages et à la bifurcation. Elles indiquent le nom du refuge, la direction, et une distance approximative.

```typescript
interface SignpostPanel {
  direction: 'left' | 'right' | 'up-left' | 'up-right';
  label: string;   // ex: "Expériences"
  distance: string; // ex: "~200m"
}

interface Signpost {
  x: number;
  y: number;
  panels: SignpostPanel[];
}

const SIGNPOSTS: Signpost[] = [
  {
    x: 90, y: 195,
    panels: [{ direction: 'up-right', label: 'Expériences', distance: '~200m' }],
  },
  {
    x: 230, y: 168,
    panels: [
      { direction: 'up-right', label: 'Expériences / Projets / Compétences', distance: '→' },
      { direction: 'down-left', label: 'Contact', distance: '~80m' },
    ],
  },
  {
    x: 310, y: 148,
    panels: [
      { direction: 'up-left', label: 'Projets',      distance: '~120m' },
      { direction: 'up-left', label: 'Compétences',  distance: '~250m' },
    ],
  },
];
```

Dessin pixel art : poteau `#92400e` (3px wide), lames `#d97706` (fond) + `#b45309` (corps), texte `#fef3c7` (4px). Dessiné dans l'offscreen canvas (statique).

---

## 6. Game loop

```typescript
private loop(timestamp: number): void {
  const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
  this.lastTime = timestamp;
  this.update(dt);
  this.draw();
  this.rafId = requestAnimationFrame(t => this.loop(t));
}
```

### `update(dt)`

1. Lire les touches actives (`Set<string>`)
2. Calculer `dx = speed * dt` (speed = 120 px/s) selon `ArrowLeft`/`ArrowRight`
3. Calculer `dy = speed * dt` (même speed) selon `ArrowUp`/`ArrowDown`
4. Appliquer `dx` et `dy` à la position candidate `(nx, ny)`
5. Clamp `nx` dans [20, 480]
6. Déterminer la zone walkable pour `nx` → `[yMin, yMax]`
7. Clamp `ny` dans `[yMin, yMax - PLAYER_HEIGHT]`
8. Mettre à jour `playerX` et `playerY`
9. Mettre à jour `facing` selon le dernier déplacement horizontal (`'left'` | `'right'`)
10. Avancer le compteur d'animation de marche si `dx !== 0 || dy !== 0`
11. Mettre à jour les particules de fumée
12. Détecter `nearbyRefuge` via `Math.hypot`
13. Animer `bubbleScale` : `lerp(current, target, 10 * dt)` — target = 1 si refuge proche, 0 sinon

### `draw()`

1. `ctx.drawImage(offscreenCanvas, 0, 0)` — fond statique
2. Dessiner étoiles clignotantes (opacité sinusoïdale)
3. Dessiner fumée de chaque refuge (particules)
4. Dessiner le joueur (pixel art procédural, 2 frames walking / idle)
5. Si `bubbleScale > 0.05` : dessiner la bulle de dialogue avec `ctx.scale(bubbleScale, bubbleScale)` centré sur le refuge

---

## 7. Personnage — pixel art procédural

Dessiné en rectangles `ctx.fillRect`. Dimensions : 8×18 px logiques.

| Partie | Couleur |
|---|---|
| Chapeau | `#b45309` |
| Tête | `#fcd34d` |
| Corps | `#16a34a` |
| Sac à dos | `#78350f` |
| Pantalon | `#1d4ed8` |
| Bâtons | `#a3a3a3` |

**Walking frame 0** : jambe gauche avant (+2px x), jambe droite arrière (-2px x)
**Walking frame 1** : jambe droite avant, jambe gauche arrière
**Idle** : jambes alignées, bâtons oscillent ±1px en Y (`sin(time * 2)`)
**Direction** : `ctx.scale(-1, 1)` + translation pour retournement horizontal

---

## 8. Bulle de dialogue

Rectangle avec coins arrondis au-dessus du refuge + pointe triangulaire vers le bas.

Contenu (3 lignes) :
```
📋 [LABEL]
[stat]
[ ESPACE ] entrer
```

Couleurs : fond `#1e293b`, bordure `#6366f1`, texte `#a5b4fc` / `#94a3b8` / `#6366f1`.

---

## 9. Pancarte À propos

Dessinée en canvas à x=18, y=200. Structure bois pixel art (rectangles `#d97706` / `#b45309`).

Contenu depuis `PortfolioService.getAbout()` :
- Nom complet
- Bio courte (tronquée à 40 caractères si nécessaire)
- Localisation

Les liens GitHub/LinkedIn sont des `<a>` HTML en `position: absolute` superposés au canvas (accessibilité + vrai lien cliquable).

---

## 10. Interactions clavier

| Touche | Action |
|---|---|
| `ArrowLeft` | Déplacement gauche |
| `ArrowRight` | Déplacement droit |
| `ArrowUp` | Déplacement vers le haut (montée) |
| `ArrowDown` | Déplacement vers le bas (descente) |
| `Space` | Entrer dans le refuge proche (si bulle visible) |
| `Enter` | Entrer dans le refuge proche (si bulle visible) |
| `Escape` | Ferme la bulle sans bouger le joueur |

Combinaisons simultanées supportées (ex : `ArrowRight` + `ArrowUp` = déplacement diagonal).

Bouton HTML cliquable superposé en `position: absolute` pour les utilisateurs sans clavier.

---

## 11. Persistance de la position

Quand l'utilisateur entre dans un refuge (navigation Angular vers une section), puis revient sur la page d'accueil Adventure, il retrouve sa position exacte — pas le point de départ.

**Implémentation via `sessionStorage`** (persistance dans l'onglet, réinitialisation sur nouvelle session) :

```typescript
// Dans GameEngine, au moment de la navigation (avant router.navigate)
savePosition(): void {
  sessionStorage.setItem('adventure_x', String(this.playerX()));
  sessionStorage.setItem('adventure_y', String(this.playerY()));
}

// Dans AdventureComponent.ngAfterViewInit, avant GameEngine.start()
restorePosition(): { x: number; y: number } {
  const x = Number(sessionStorage.getItem('adventure_x') ?? SPAWN_X);
  const y = Number(sessionStorage.getItem('adventure_y') ?? SPAWN_Y);
  return { x: isNaN(x) ? SPAWN_X : x, y: isNaN(y) ? SPAWN_Y : y };
}
```

`SPAWN_X = 55`, `SPAWN_Y = 278` (point de départ initial bas-gauche).

`savePosition()` est appelé **avant** `router.navigate()` dans le handler Espace/Entrée. La position est restaurée dans `GameEngine.start(canvas, initialX, initialY)`.

## 12. Accessibilité & responsive

- `prefers-reduced-motion: reduce` : désactive la fumée et les étoiles clignotantes (scène statique)
- Canvas mis à l'échelle CSS : `width: 100%; max-width: 960px; height: auto` — ratio préservé
- Bouton overlay toujours visible quand une bulle est active (pas uniquement clavier)
- Contrôles mobiles : hors scope v1 (navigation via navbar)

---

## 13. Hors scope

- Contrôles tactiles / joystick mobile (version future)
- Animations d'entrée dans un refuge (fondu, transition visuelle)
- Sons / musique
- Persistance de la position entre sessions (onglets différents ou rechargement complet) — `sessionStorage` suffit pour v1
- Tilemap externe (Tiled) — décor dessiné en code pur
