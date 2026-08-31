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
- Démarre `GameEngine.start(canvas)` dans `ngAfterViewInit`
- Appelle `GameEngine.stop()` dans `ngOnDestroy`
- Écoute `keydown` sur `window` pour `Espace`/`Entrée` → `router.navigate()`
- Charge les données About via `PortfolioService.getAbout()` (`toSignal`) et les passe à `GameEngine`
- Affiche un `<button>` HTML en `position: absolute` au-dessus du canvas quand `nearbyRefuge()` est non-nul

### `GameEngine` (service `providedIn: null` — instancié par le composant)

Signals exposés :

| Signal | Type | Description |
|---|---|---|
| `playerX` | `WritableSignal<number>` | Position X du joueur |
| `playerY` | `WritableSignal<number>` | Position Y calculée depuis la path function |
| `nearbyRefuge` | `WritableSignal<Refuge \| null>` | Refuge dans le rayon de proximité |
| `bubbleScale` | `WritableSignal<number>` | 0→1, animation d'apparition de la bulle |

---

## 3. Scène pixel art

### Dimensions canvas

`480 × 300` px logiques, mis à l'échelle CSS pour remplir le viewport (`width: 100%; height: auto`). Ratio fixe 8:5.

### Couches de rendu

1. **Fond statique (offscreen canvas)** — dessiné une seule fois au chargement : ciel étoilé, lune, montagnes arrière (2 couches), terrain en paliers, arbres, sentier.
2. **Effets ambiants** — redessinés chaque frame : particules de fumée (3 par refuge), étoiles clignotantes (`sin(time)`), oscillation des bâtons du randonneur au repos.
3. **Joueur** — redessiné chaque frame avec animation de marche (2 frames alternées toutes les 200ms, ou idle).
4. **Bulle de dialogue** — dessinée par-dessus quand `nearbyRefuge !== null`, avec scale animée.

### Disposition des éléments

```
Sommet          ────────────── [Refuge Compétences] x=461 y=110
                              ↗ montée
Plateau 2   ──────────── [Refuge Projets] x=358 y=143
                         ↗ montée
Plateau 1   ──────── [Refuge Expériences] x=217 y=178
                     ↗ montée
Village    [Contact] [Pancarte À propos] [Randonneur départ]
           x=18 y=238  x=37 y=230         x=72 y=220
```

### Sentier — path function `getPathY(x): number`

Interpolation linéaire par morceaux :

| Segment X | Y début | Y fin | Description |
|---|---|---|---|
| 20 → 100 | 226 | 226 | Plat — village |
| 100 → 180 | 226 | 200 | Montée lacet 1 |
| 180 → 260 | 200 | 200 | Plateau Expériences |
| 260 → 330 | 200 | 168 | Montée lacet 2 |
| 330 → 400 | 168 | 168 | Plateau Projets |
| 400 → 474 | 168 | 138 | Montée sommet |
| 474 → 510 | 138 | 138 | Sommet Compétences |

Le joueur ne peut pas sortir de x=20 à x=510.

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
    x: 18,  y: 238, stat: 'Envoyez un message' },
  { id: 'experience', label: 'Expériences',  route: '/experience',
    x: 217, y: 178, stat: '4 expériences · 2021–2024' },
  { id: 'projects',   label: 'Projets',      route: '/projects',
    x: 358, y: 143, stat: '6 projets · Angular · Python' },
  { id: 'skills',     label: 'Compétences',  route: '/skills',
    x: 461, y: 110, stat: '14 compétences' },
];

const PROXIMITY_RADIUS = 40; // px logiques
```

---

## 5. Game loop

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
3. Clamp `playerX` dans [20, 510]
4. `playerY = getPathY(playerX) - PLAYER_HEIGHT`
5. Mettre à jour `facing` (`'left'` | `'right'`)
6. Avancer le compteur d'animation de marche
7. Mettre à jour les particules de fumée
8. Détecter `nearbyRefuge` via `Math.hypot`
9. Animer `bubbleScale` : `lerp(current, target, 10 * dt)` — target = 1 si refuge proche, 0 sinon

### `draw()`

1. `ctx.drawImage(offscreenCanvas, 0, 0)` — fond statique
2. Dessiner étoiles clignotantes (opacité sinusoïdale)
3. Dessiner fumée de chaque refuge (particules)
4. Dessiner le joueur (pixel art procédural, 2 frames walking / idle)
5. Si `bubbleScale > 0.05` : dessiner la bulle de dialogue avec `ctx.scale(bubbleScale, bubbleScale)` centré sur le refuge

---

## 6. Personnage — pixel art procédural

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

## 7. Bulle de dialogue

Rectangle avec coins arrondis au-dessus du refuge + pointe triangulaire vers le bas.

Contenu (3 lignes) :
```
📋 [LABEL]
[stat]
[ ESPACE ] entrer
```

Couleurs : fond `#1e293b`, bordure `#6366f1`, texte `#a5b4fc` / `#94a3b8` / `#6366f1`.

---

## 8. Pancarte À propos

Dessinée en canvas à x=18, y=200. Structure bois pixel art (rectangles `#d97706` / `#b45309`).

Contenu depuis `PortfolioService.getAbout()` :
- Nom complet
- Bio courte (tronquée à 40 caractères si nécessaire)
- Localisation

Les liens GitHub/LinkedIn sont des `<a>` HTML en `position: absolute` superposés au canvas (accessibilité + vrai lien cliquable).

---

## 9. Interactions clavier

| Touche | Action |
|---|---|
| `ArrowLeft` | Déplacement gauche |
| `ArrowRight` | Déplacement droit |
| `ArrowUp` / `ArrowDown` | Ignoré |
| `Space` | Entrer dans le refuge proche (si bulle visible) |
| `Enter` | Entrer dans le refuge proche (si bulle visible) |
| `Escape` | Ferme la bulle sans bouger le joueur |

Bouton HTML cliquable superposé en `position: absolute` pour les utilisateurs sans clavier.

---

## 10. Accessibilité & responsive

- `prefers-reduced-motion: reduce` : désactive la fumée et les étoiles clignotantes (scène statique)
- Canvas mis à l'échelle CSS : `width: 100%; max-width: 960px; height: auto` — ratio préservé
- Bouton overlay toujours visible quand une bulle est active (pas uniquement clavier)
- Contrôles mobiles : hors scope v1 (navigation via navbar)

---

## 11. Hors scope

- Contrôles tactiles / joystick mobile (version future)
- Animations d'entrée dans un refuge (fondu, transition visuelle)
- Sons / musique
- Sauvegarde de la position du joueur entre sessions
- Tilemap externe (Tiled) — décor dessiné en code pur
