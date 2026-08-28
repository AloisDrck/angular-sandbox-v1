# Design Spec — 3D Animations

**Date:** 2026-08-26
**Scope:** `ProjectCard`, `TimelineItem`, `AboutComponent`

---

## Overview

Add two categories of CSS 3D animation to the portfolio:

1. **Card flip** on the Projects grid — hover reveals a structured back face.
2. **Floating ambient** on the About card and each Experience timeline item — subtle independent movement.

All animations are implemented in pure CSS (Tailwind v4 `@keyframes` + utilities in `styles.css`), with no external animation library.

---

## 1. Projects — Card Flip 3D

### Trigger

Mouse hover on `<app-project-card>`.

### Front face (Option B)

| Element     | Dark mode                                         | Light mode                                        |
| ----------- | ------------------------------------------------- | ------------------------------------------------- |
| Background  | `linear-gradient(135deg, #1e1b4b, #0f172a)`       | `linear-gradient(135deg, #eef2ff, #f8fafc)`       |
| Border      | `1px solid #4338ca`                               | `1px solid #c7d2fe`                               |
| Type badge  | `bg-indigo-900 text-indigo-300`                   | `bg-indigo-100 text-indigo-700`                   |
| Title       | `text-indigo-100 font-extrabold`                  | `text-indigo-950 font-extrabold`                  |
| Year        | `text-indigo-500 font-semibold`                   | `text-indigo-600 font-semibold`                   |
| Description | `text-slate-400`                                  | `text-slate-500`                                  |
| Tech pills  | `bg-indigo-950 border-indigo-700 text-indigo-300` | `bg-indigo-100 border-indigo-200 text-indigo-700` |
| Hover hint  | `text-indigo-900` (barely visible)                | `text-indigo-200` (barely visible)                |

### Back face (Mix B + C)

| Element        | Dark mode                                      | Light mode                                  |
| -------------- | ---------------------------------------------- | ------------------------------------------- |
| Background     | `linear-gradient(145deg, #1a2a4a, #1e293b)`    | `linear-gradient(145deg, #eff6ff, #f8fafc)` |
| Border         | `1px solid #3b82f6`                            | `1px solid #93c5fd`                         |
| Stats block bg | `bg-slate-950 border-slate-800`                | `bg-white border-blue-100`                  |
| Stats value    | `text-blue-400 font-bold`                      | `text-blue-600 font-bold`                   |
| Stats label    | `text-slate-500`                               | `text-slate-400`                            |
| Tech label     | `text-blue-500` uppercase                      | `text-blue-600` uppercase                   |
| Tech pills     | `bg-blue-900/50 border-blue-700 text-blue-300` | `bg-blue-50 border-blue-200 text-blue-700`  |
| CTA button     | `bg-blue-600 text-white`                       | `bg-blue-600 text-white` (identique)        |

### CSS mechanics

```css
/* Applied to project-card article wrapper */
perspective: 700px;
transform-style: preserve-3d;

/* Flipper inner div */
transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);

/* Both faces */
backface-visibility: hidden;

/* Hover state */
:host:hover .flipper {
  transform: rotateY(180deg);
}

/* Back face initial position */
transform: rotateY(180deg);
```

The `<article>` in `project-card.html` becomes a **flip scene** wrapper. A new inner `.flipper` div holds `.face.front` and `.face.back`.

The existing `[routerLink]` on the title moves to the CTA button on the back face.

---

## 2. About & Experience — Floating Ambient

### Parameters

| Parameter             | Value         |
| --------------------- | ------------- |
| Vertical displacement | 2px max       |
| Rotation              | ±0.3°         |
| Animation name        | `micro-float` |

### Keyframe (shared, defined once in `styles.css`)

The keyframe is mode-agnostic (transform only). The `box-shadow` tint differs per mode and is applied via the `.float-*` classes:

```css
@keyframes micro-float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(0.3deg);
  }
}

/* Dark mode shadow (default) */
[class*='float-'] {
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.08);
}
[class*='float-']:is(.dark *) {
  /* already correct — indigo tint visible on dark bg */
}

/* Light mode shadow — slightly lighter */
:where(:not(.dark)) [class*='float-'] {
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.06);
}
```

> In practice, since the shadow is very subtle, a single shared value of `rgba(99, 102, 241, 0.08)` is acceptable for both modes. The Tailwind `@variant dark` convention in the project handles the override if needed.

### About card

Applied once with a fixed cycle:

```css
animation: micro-float 4s ease-in-out infinite;
```

### Experience timeline items

Each `<app-timeline-item>` receives a CSS class (`float-1` → `float-n`) based on its `@for` index, giving it a distinct duration and delay so items never move in sync:

| Item index | Duration | Delay |
| ---------- | -------- | ----- |
| 0          | 4.0s     | 0s    |
| 1          | 4.6s     | 0.9s  |
| 2          | 3.8s     | 1.8s  |
| 3          | 4.3s     | 0.4s  |

For more than 4 items the pattern cycles (index % 4).

Applied directly in `experience.html` via `[class]` on each `<app-timeline-item>`:

```html
@for (exp of experiences(); track exp.id; let i = $index) {
<app-timeline-item [experience]="exp" [class]="'float-' + (i % 4)" />
}
```

---

## Implementation Scope

| File                 | Change                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `styles.css`         | Add `@keyframes micro-float`; add `.float-0` → `.float-3` utility classes; add flip CSS helpers (`.flip-scene`, `.flipper`, `.face`) |
| `project-card.html`  | Restructure into `.flip-scene > .flipper > (.face.front + .face.back)`                                                               |
| `project-card.ts`    | No logic change — `project()` signal already exposes all needed fields                                                               |
| `about.html`         | Add `float-0` class (or inline style) to the about card wrapper                                                                      |
| `experience.html`    | Pass `$index % 4` to `timeline-item` or bind `floatClass` on the host                                                                |
| `timeline-item.html` | No change — the float class is applied on the host element from `experience.html`                                                    |

---

## Out of scope

- Scroll-triggered entrance animations (separate feature)
- Tilt-on-hover (not selected)
- Mobile: animations disabled on `prefers-reduced-motion` via `@media`
- Touch devices: flip triggered by tap (`:focus-within` fallback)

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  .flip-scene .flipper {
    transition: none;
  }
  [class*='float-'] {
    animation: none;
  }
}
```
