# 3D Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use ai-dev-toolkit:subagent-driven-development (recommended) or ai-dev-toolkit:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a card flip 3D on the Projects grid and a staggered floating ambient animation on About and Experience, using pure CSS in `styles.css` — no external library.

**Architecture:** All animation CSS lives in `styles.css` as global utility classes (`.flip-scene`, `.flipper`, `.face`, `.float-0`→`.float-3`). The `project-card.html` template is restructured into a front/back flip layout. The `about.html` content gets a card wrapper with `float-0`. The `experience.html` `@for` loop binds `float-{i%4}` on each `<app-timeline-item>`.

**Tech Stack:** Angular 22 standalone components, Tailwind CSS v4, pure CSS transforms, `@keyframes`.

---

## File Map

| File                                                          | Action | Responsibility                             |
| ------------------------------------------------------------- | ------ | ------------------------------------------ |
| `src/styles.css`                                              | Modify | Flip utilities + float keyframes + a11y    |
| `src/app/shared/components/project-card/project-card.html`    | Modify | Flip scene structure + light/dark styles   |
| `src/app/shared/components/project-card/project-card.spec.ts` | Create | Verify flip DOM structure + CTA link       |
| `public/assets/i18n/fr.json`                                  | Modify | Add `projects.type.*` translation keys     |
| `public/assets/i18n/en.json`                                  | Modify | Add `projects.type.*` translation keys     |
| `src/app/features/about/about.html`                           | Modify | Add card wrapper + `float-0` class         |
| `src/app/features/experience/experience.html`                 | Modify | Add `$index` + `float-{i%4}` class binding |

---

## Task 1: CSS foundations

**Files:**

- Modify: `src/styles.css`

- [ ] **Step 1 — Append flip utilities and float keyframes to `src/styles.css`**

Replace the full file content with:

```css
@import 'tailwindcss';

@variant dark (&:where(.dark, .dark *));

body {
  @apply bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100;
}

/* ── Card flip ── */
.flip-scene {
  perspective: 700px;
}

.flipper {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.4, 0, 0.2, 1);
}

.flip-scene:hover .flipper {
  transform: rotateY(180deg);
}

.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.face.back {
  transform: rotateY(180deg);
}

/* ── Floating ambient ── */
@keyframes micro-float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(0.3deg);
  }
}

.float-0 {
  animation: micro-float 4s ease-in-out infinite;
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.08);
}
.float-1 {
  animation: micro-float 4.6s ease-in-out 0.9s infinite;
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.08);
}
.float-2 {
  animation: micro-float 3.8s ease-in-out 1.8s infinite;
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.08);
}
.float-3 {
  animation: micro-float 4.3s ease-in-out 0.4s infinite;
  box-shadow: 0 1px 6px rgba(99, 102, 241, 0.08);
}

/* ── Accessibility ── */
@media (prefers-reduced-motion: reduce) {
  .flipper {
    transition: none;
  }
  .float-0,
  .float-1,
  .float-2,
  .float-3 {
    animation: none;
  }
}
```

- [ ] **Step 2 — Run lint and format check**

```bash
npm run lint && npm run format:check
```

Expected: no errors. If `format:check` fails run `npx prettier --write src/styles.css` then re-check.

- [ ] **Step 3 — Commit**

```bash
git add src/styles.css
git commit -m "feat: add flip-scene and micro-float CSS utilities"
```

---

## Task 2: i18n keys for project type badge

The front face of the flipped card shows the project type as a translated badge. The existing keys `experience.type.*` belong to the Experience section; projects need their own keys.

**Files:**

- Modify: `public/assets/i18n/fr.json`
- Modify: `public/assets/i18n/en.json`

- [ ] **Step 1 — Add keys to `public/assets/i18n/fr.json`**

Inside the JSON object, after `"projects.viewProject": "Voir le projet"`, add:

```json
"projects.type.academic": "Académique",
"projects.type.professional": "Professionnel",
"projects.type.personal": "Personnel",
```

- [ ] **Step 2 — Add keys to `public/assets/i18n/en.json`**

After `"projects.viewProject": "Check out the project"`, add:

```json
"projects.type.academic": "Academic",
"projects.type.professional": "Professional",
"projects.type.personal": "Personal",
```

- [ ] **Step 3 — Run tests to confirm i18n files are valid JSON**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: `33 passed`.

- [ ] **Step 4 — Commit**

```bash
git add public/assets/i18n/fr.json public/assets/i18n/en.json
git commit -m "feat: add projects.type i18n keys for card flip badge"
```

---

## Task 3: ProjectCard flip template

**Files:**

- Modify: `src/app/shared/components/project-card/project-card.html`
- Create: `src/app/shared/components/project-card/project-card.spec.ts`

- [ ] **Step 1 — Write the failing spec first**

Create `src/app/shared/components/project-card/project-card.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProjectCardComponent } from './project-card';
import { I18nService } from '../../../core/services/i18n.service';
import { Project } from '../../../core/models/project.model';

const mockProject: Project = {
  id: 'treko-fr',
  slug: 'treko',
  title: 'Projet Treko',
  description: 'Module de tracking sportif',
  longDescription: 'Long desc',
  techs: ['React Native', 'Node.js'],
  repoGit: 'https://gitlab.com/test',
  year: 2025,
  type: 'academic',
};

const mockI18n = {
  lang: signal<'fr' | 'en'>('fr'),
  t: (key: string) => {
    const map: Record<string, string> = {
      'projects.viewProject': 'Voir le projet',
      'projects.type.academic': 'Académique',
    };
    return map[key] ?? key;
  },
};

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideRouter([]), { provide: I18nService, useValue: mockI18n }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', mockProject);
    TestBed.tick();
    fixture.detectChanges();
  });

  it('affiche le titre du projet sur la face avant', () => {
    const front = fixture.nativeElement.querySelector('.face.front');
    expect(front?.textContent).toContain('Projet Treko');
  });

  it('affiche le badge de type traduit sur la face avant', () => {
    const front = fixture.nativeElement.querySelector('.face.front');
    expect(front?.textContent).toContain('Académique');
  });

  it('affiche toutes les techs sur la face arrière', () => {
    const back = fixture.nativeElement.querySelector('.face.back');
    expect(back?.textContent).toContain('React Native');
    expect(back?.textContent).toContain('Node.js');
  });

  it('le bouton CTA de la face arrière pointe vers le bon slug', () => {
    const cta: HTMLAnchorElement = fixture.nativeElement.querySelector('.face.back a[href]');
    expect(cta?.getAttribute('href')).toContain('treko');
  });

  it('a la structure flip-scene > flipper > face', () => {
    const scene = fixture.nativeElement.querySelector('.flip-scene');
    const flipper = scene?.querySelector('.flipper');
    expect(flipper).toBeTruthy();
    expect(flipper?.querySelector('.face.front')).toBeTruthy();
    expect(flipper?.querySelector('.face.back')).toBeTruthy();
  });
});
```

- [ ] **Step 2 — Run the spec to confirm it fails**

```bash
npm run test:ci 2>&1 | grep -E "FAIL|passed|failed"
```

Expected: failures related to missing `.flip-scene`, `.face.front`, `.face.back`.

- [ ] **Step 3 — Rewrite `project-card.html` with the flip structure**

Replace the entire file content:

```html
<article class="flip-scene relative rounded-lg" style="height: 220px;">
  <div class="flipper rounded-lg">
    <!-- FACE AVANT -->
    <div
      class="face front justify-between
        bg-gradient-to-br from-[#eef2ff] to-[#f8fafc] border border-[#c7d2fe]
        dark:from-[#1e1b4b] dark:to-[#0f172a] dark:border-[#4338ca]"
    >
      <!-- Badge type -->
      <span
        class="self-start text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full
          bg-indigo-100 text-indigo-700
          dark:bg-indigo-900 dark:text-indigo-300"
      >
        {{ i18n.t('projects.type.' + project().type) }}
      </span>

      <!-- Titre -->
      <h3 class="text-base font-extrabold leading-tight text-indigo-950 dark:text-indigo-100">
        {{ project().title }}
      </h3>

      <!-- Année -->
      <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-500">
        {{ project().year }}
      </span>

      <!-- Description courte -->
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1 line-clamp-3">
        {{ project().description }}
      </p>

      <!-- Tech pills (aperçu) -->
      <div class="flex flex-wrap gap-1 mt-auto">
        @for (tech of project().techs.slice(0, 3); track tech) {
        <span
          class="text-[10px] px-2 py-0.5 rounded-full border
              bg-indigo-100 border-indigo-200 text-indigo-700
              dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300"
        >
          {{ tech }}
        </span>
        } @if (project().techs.length > 3) {
        <span class="text-[10px] text-indigo-400 dark:text-indigo-600 self-center">
          +{{ project().techs.length - 3 }}
        </span>
        }
      </div>

      <p class="text-[10px] text-center text-indigo-200 dark:text-indigo-900">← survolez →</p>
    </div>

    <!-- FACE ARRIÈRE -->
    <div
      class="face back justify-between
        bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] border border-[#93c5fd]
        dark:from-[#1a2a4a] dark:to-[#1e293b] dark:border-[#3b82f6]"
    >
      <!-- Stats -->
      <div class="flex gap-2">
        <div
          class="flex-1 text-center rounded-lg py-2 border
            bg-white border-blue-100
            dark:bg-slate-950 dark:border-slate-800"
        >
          <p class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ project().year }}</p>
          <p class="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-0.5">
            Année
          </p>
        </div>
        <div
          class="flex-1 text-center rounded-lg py-2 border
            bg-white border-blue-100
            dark:bg-slate-950 dark:border-slate-800"
        >
          <p class="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            {{ i18n.t('projects.type.' + project().type) }}
          </p>
          <p class="text-[9px] uppercase tracking-wide text-slate-400 dark:text-slate-500 mt-0.5">
            Type
          </p>
        </div>
      </div>

      <!-- Stack technique -->
      <div class="flex-1 flex flex-col gap-1 min-h-0">
        <p
          class="text-[9px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-500"
        >
          Stack technique
        </p>
        <div class="flex flex-wrap gap-1">
          @for (tech of project().techs; track tech) {
          <span
            class="text-[10px] px-2 py-0.5 rounded-full border
                bg-blue-50 border-blue-200 text-blue-700
                dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300"
          >
            {{ tech }}
          </span>
          }
        </div>
      </div>

      <!-- CTA -->
      <a
        [routerLink]="['/projects', project().slug]"
        class="block text-center text-xs font-semibold py-2 rounded-lg
          bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        {{ i18n.t('projects.viewProject') }} →
      </a>
    </div>
  </div>
</article>
```

- [ ] **Step 4 — Run the spec**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: `38 passed` (33 existing + 5 new).

- [ ] **Step 5 — Commit**

```bash
git add src/app/shared/components/project-card/project-card.html \
        src/app/shared/components/project-card/project-card.spec.ts
git commit -m "feat: add 3D card flip to ProjectCard"
```

---

## Task 4: Floating ambient on About

**Files:**

- Modify: `src/app/features/about/about.html`

- [ ] **Step 1 — Wrap the about content in a floating card**

Replace the `@if (about(); as data)` block content div in `about.html`. The full updated file:

```html
<section>
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('about.title') }}</h1>

  @if (about(); as data) {
  <div
    class="float-0 rounded-xl border p-6 space-y-6
        bg-white border-gray-200
        dark:bg-gray-900 dark:border-gray-700"
  >
    <div>
      <h2 class="text-2xl font-semibold">{{ data.name }}</h2>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {{ i18n.t('about.location') }} : {{ data.location }}
      </p>
    </div>

    <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ data.bio }}</p>

    <div>
      <h3 class="font-semibold mb-2">{{ i18n.t('about.links') }}</h3>
      <ul class="flex gap-4">
        <li>
          <a
            [href]="data.links.repoGit"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline dark:text-blue-400"
            >GitHub</a
          >
        </li>
        <li>
          <a
            [href]="data.links.gitlab"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline dark:text-blue-400"
            >GitLab</a
          >
        </li>
        <li>
          <a
            [href]="data.links.linkedin"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline dark:text-blue-400"
            >LinkedIn</a
          >
        </li>
      </ul>
    </div>
  </div>
  } @else {
  <p class="text-gray-400">Chargement...</p>
  }
</section>
```

- [ ] **Step 2 — Run tests**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: `38 passed` (no regressions — the About spec only checks HTTP call, not DOM structure).

- [ ] **Step 3 — Commit**

```bash
git add src/app/features/about/about.html
git commit -m "feat: add floating ambient animation to About card"
```

---

## Task 5: Staggered floating ambient on Experience

**Files:**

- Modify: `src/app/features/experience/experience.html`

- [ ] **Step 1 — Add `$index` and the float class binding to the `@for` loop**

Replace the full content of `experience.html`:

```html
<section>
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('experience.title') }}</h1>

  <div class="mt-6">
    @for (exp of experiences(); track exp.id; let i = $index) {
    <app-timeline-item [experience]="exp" [class]="'float-' + (i % 4)" />
    } @empty {
    <p class="text-gray-400">Chargement...</p>
    }
  </div>
</section>
```

- [ ] **Step 2 — Run tests**

```bash
npm run test:ci 2>&1 | tail -8
```

Expected: `38 passed`.

- [ ] **Step 3 — Run lint and format check**

```bash
npm run lint && npm run format:check
```

Expected: no errors.

- [ ] **Step 4 — Commit**

```bash
git add src/app/features/experience/experience.html
git commit -m "feat: add staggered floating animation to Experience timeline"
```

---

## Final check

- [ ] **Start the dev server and json-server**

```bash
npm run dev
```

- [ ] **Manual verification checklist**
  - [ ] Projects page — hover a card → flip avec face avant indigo, face arrière bleue
  - [ ] Projects page — cliquer le bouton CTA "Voir le projet →" navigue vers `/projects/:slug`
  - [ ] Projects page — switcher en light mode → même flip avec couleurs claires
  - [ ] About page — la card flotte doucement (2px, rotation légère)
  - [ ] Experience page — chaque item flotte indépendamment, pas en sync
  - [ ] Activer `prefers-reduced-motion` dans les DevTools → aucune animation
