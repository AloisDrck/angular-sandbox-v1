# Portfolio Angular — Document de spécifications

**Date :** 2026-08-19
**Stack :** Angular 22, Tailwind CSS v4, Vitest, @angular/ssr, json-server
**Objectif :** Application portfolio formatif explorant les concepts fondamentaux d'Angular (routing avancé, state management Signals + RxJS, SSR/hydration, i18n, dark/light theme, tests).

---

## 1. Architecture & Structure des dossiers

Organisation par **features** avec lazy loading. Chaque section du portfolio est un module isolé chargé à la demande.

```
src/app/
├── core/
│   ├── services/          # PortfolioService, ThemeService, I18nService, LoadingService
│   ├── models/            # Interfaces TypeScript : Project, Experience, Skill, About
│   └── interceptors/      # LoadingInterceptor (met à jour isLoading Signal)
├── shared/
│   ├── components/        # ProjectCard, SkillBadge, TimelineItem, ThemeToggle, LangToggle
│   └── pipes/             # Pipes custom (ex: formatPeriod, truncate)
├── features/
│   ├── about/             # Page À propos
│   ├── experience/        # Timeline expériences
│   ├── projects/          # Liste projets + détail par projet
│   ├── skills/            # Visualisation compétences
│   └── contact/           # Formulaire contact
├── app.routes.ts          # Routes racine avec lazy loading
├── app.config.ts          # Configuration globale (provideRouter, provideHttpClient, withFetch...)
└── app.ts                 # Root component : navbar + <router-outlet>
```

**Concepts Angular couverts :** standalone components, injection de dépendances, séparation core/shared/features.

---

## 2. Routing

### Routes

| Path | Composant | Chargement |
|---|---|---|
| `/` | Redirect → `/about` | — |
| `/about` | `AboutComponent` | lazy |
| `/experience` | `ExperienceComponent` | lazy |
| `/projects` | `ProjectsComponent` | lazy |
| `/projects/:id` | `ProjectDetailComponent` | lazy |
| `/skills` | `SkillsComponent` | lazy |
| `/contact` | `ContactComponent` | lazy |
| `**` | `NotFoundComponent` | lazy |

### Resolver — `ProjectResolver`

Sur la route `/projects/:id`, un resolver précharge les données du projet via `PortfolioService` avant le rendu du composant. Le composant reçoit les données directement depuis `ActivatedRoute.data` — pas de loading state à gérer dans le template. Ce mécanisme est aussi utilisé par le SSR pour pré-rendre le HTML complet côté serveur.

```typescript
export const projectResolver: ResolveFn<Project> = (route) =>
  inject(PortfolioService).getProject(route.paramMap.get('id')!)
```

### Guard — `CanDeactivateGuard` sur Contact

Si l'utilisateur a commencé à saisir dans le formulaire de contact et tente de naviguer vers une autre page, un guard lui demande confirmation avant de quitter ("Votre message sera perdu.").

```typescript
export const canDeactivateContact: CanDeactivateFn<ContactComponent> =
  (component) => component.form.pristine || confirm('Quitter ? Votre message sera perdu.')
```

**Concepts Angular couverts :** `loadComponent`, `ActivatedRoute`, `Router`, `ResolveFn`, `CanDeactivateFn`, paramètres de route dynamiques.

---

## 3. State Management (Signals + RxJS)

### Signals — état global UI

| Service | Signal | Rôle |
|---|---|---|
| `ThemeService` | `theme: WritableSignal<'light' \| 'dark'>` | Thème actif, persisté en localStorage |
| `I18nService` | `lang: WritableSignal<'fr' \| 'en'>` | Langue active |
| `LoadingService` | `isLoading: WritableSignal<boolean>` | Indicateur de chargement global |

Un `effect()` dans `ThemeService` synchronise le signal avec `localStorage` et applique/retire la classe `.dark` sur `document.documentElement`.

### `computed()` — filtre projets

Sur la page Projets, un Signal `selectedTech` et un `computed()` dérivé gèrent le filtre par technologie :

```typescript
selectedTech = signal<string | null>(null)
filteredProjects = computed(() =>
  this.projects().filter(p =>
    !this.selectedTech() || p.techs.includes(this.selectedTech()!)
  )
)
```

### RxJS — couche HTTP (`PortfolioService`)

Tous les appels vers json-server retournent des `Observable` :

```typescript
getProjects(): Observable<Project[]>
getProject(id: string): Observable<Project>
getExperiences(): Observable<Experience[]>
getSkills(): Observable<Skill[]>
getAbout(): Observable<About>
```

Les transformations utilisent `.pipe(map(...), catchError(...))`.

### `HttpInterceptor` — loading global

Un interceptor met `isLoading` à `true` au début de chaque requête HTTP et `false` à la fin, quelle que soit la feature qui déclenche l'appel.

**Concepts Angular couverts :** `signal()`, `computed()`, `effect()`, `toSignal()`, `WritableSignal`, `HttpClient`, `.pipe()`, `HttpInterceptorFn`.

---

## 4. Couche données (json-server)

### Structure `db.json`

```json
{
  "projects": [
    {
      "id": "1",
      "title": "Nom du projet",
      "description": "Description courte",
      "longDescription": "Description détaillée pour la page projet",
      "techs": ["Python", "FastAPI", "PostgreSQL"],
      "repoGit": "https://repoGit.com/...",
      "year": 2024,
      "type": "academic"
    }
  ],
  "experiences": [
    {
      "id": "1",
      "role": "Titre du rôle",
      "company": "Nom de l'entreprise ou établissement",
      "period": "2023-2024",
      "description": "Description de l'expérience",
      "type": "academic"
    }
  ],
  "skills": [
    {
      "id": "1",
      "name": "Python",
      "category": "backend",
      "level": 4
    }
  ],
  "about": {
    "name": "Prénom Nom",
    "bio": "Courte présentation",
    "location": "Ville, Pays",
    "links": {
      "repoGit": "https://repoGit.com/...",
      "linkedin": "https://linkedin.com/in/..."
    }
  }
}
```

### Modèles TypeScript (`core/models/`)

Fichiers : `project.model.ts`, `experience.model.ts`, `skill.model.ts`, `about.model.ts`.
Chaque modèle est une interface TypeScript strictement typée partagée par tous les services et composants.

### Environments Angular

```typescript
// environment.development.ts
export const environment = { apiUrl: 'http://localhost:3000' }

// environment.ts (production)
export const environment = { apiUrl: 'https://ton-api.com' }
```

### Script de démarrage combiné

```json
"dev": "concurrently \"ng serve\" \"json-server --watch db.json --port 3000\""
```

**Dépendances à installer :** `concurrently`, `json-server`.

---

## 5. SSR & Hydration

Le projet est configuré avec `@angular/ssr` et Express (déjà présent). Angular rend le HTML complet côté serveur, livré au navigateur, puis l'hydration prend le relais côté client.

### `isPlatformBrowser`

Les accès à `localStorage` (thème, langue) et `window` sont conditionnés par `isPlatformBrowser(this.platformId)` pour éviter les erreurs côté serveur.

### Transfer State

Sur `/projects/:id`, le resolver charge les données côté serveur lors du SSR. `TransferState` est utilisé pour transférer ces données au client et éviter un second appel HTTP au démarrage de l'hydration.

**Concepts Angular couverts :** `PLATFORM_ID`, `isPlatformBrowser`, `TransferState`, interaction resolver ↔ SSR.

---

## 6. Internationalisation (FR/EN)

Approche retenue : **fichiers JSON custom + `I18nService`** (pas `@angular/localize` — trop lourd pour ce contexte).

### Fichiers de traductions

```
src/assets/i18n/
├── fr.json
└── en.json
```

### `I18nService`

```typescript
lang = signal<'fr' | 'en'>('fr')
translations = toSignal(
  toObservable(this.lang).pipe(
    switchMap(lang => this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`))
  )
)

t(key: string): string {
  return this.translations()?.[key] ?? key
}
```

Quand `lang` change, `toObservable()` déclenche un `switchMap` qui charge le bon fichier JSON. `toSignal()` expose le résultat comme un Signal. Chaque changement de langue se propage instantanément dans tous les templates.

**Concepts Angular couverts :** `toSignal()`, `toObservable()`, `switchMap`, interplay Signal ↔ Observable.

---

## 7. Dark/Light Theme

### Mécanisme

Tailwind v4 gère le dark mode via la classe `.dark` sur `<html>`. Le `ThemeService` applique/retire cette classe via un `effect()`.

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID)
  theme: WritableSignal<'light' | 'dark'>

  constructor() {
    const initial = isPlatformBrowser(this.platformId)
      ? (localStorage.getItem('theme') as 'light' | 'dark') ??
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : 'light'

    this.theme = signal(initial)

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.classList.toggle('dark', this.theme() === 'dark')
        localStorage.setItem('theme', this.theme())
      }
    })
  }

  toggle() { this.theme.update(t => t === 'dark' ? 'light' : 'dark') }
}
```

Un composant `ThemeToggle` (icône soleil/lune) dans la navbar appelle `themeService.toggle()`.

**Concepts Angular couverts :** `effect()`, side effects réactifs, `prefers-color-scheme`, persistance localStorage.

---

## 8. Tests (Vitest)

Un fichier `.spec.ts` par service ou composant critique, dans le même dossier que le fichier testé.

| Cible | Type | Ce qu'on vérifie |
|---|---|---|
| `ThemeService` | Unitaire | Signal change, `localStorage` mis à jour, classe `.dark` appliquée |
| `I18nService` | Unitaire | `t('key')` retourne le bon label selon la langue active |
| `PortfolioService` | `HttpTestingController` | Bons endpoints appelés, données mappées correctement |
| `ProjectsComponent` | Composant (`TestBed`) | Filtre par techno met à jour `filteredProjects` |
| `CanDeactivateGuard` | Unitaire | Retourne `false` si formulaire dirty, `true` sinon |

**Concepts Angular couverts :** `TestBed`, `HttpTestingController`, tester des Signals, tester des guards.

---

## 9. Sections du portfolio

| Section | Route | Composants notables | Concepts Angular utilisés |
|---|---|---|---|
| À propos | `/about` | `AboutComponent` | `HttpClient`, `toSignal()`, binding simple |
| Expériences | `/experience` | `ExperienceComponent`, `TimelineItemComponent` | `@for`, `@if`, composants réutilisables |
| Projets | `/projects` | `ProjectsComponent`, `ProjectCardComponent`, `ProjectDetailComponent` | `computed()`, resolver, route params |
| Compétences | `/skills` | `SkillsComponent`, `SkillBadgeComponent` | `@for` avec groupement, `computed()` |
| Contact | `/contact` | `ContactComponent` | Reactive Forms, validators custom, `CanDeactivateGuard` |

---

## 10. Dépendances à installer

```bash
npm install json-server concurrently --save-dev
```

---

## Résumé des concepts Angular couverts

| Concept | Où |
|---|---|
| Standalone components | Partout |
| Lazy loading | `app.routes.ts` |
| Route params & navigation | `/projects/:id` |
| `ResolveFn` | `ProjectResolver` |
| `CanDeactivateFn` | `ContactComponent` |
| `signal()`, `computed()`, `effect()` | `ThemeService`, `ProjectsComponent` |
| `toSignal()`, `toObservable()` | `I18nService` |
| `HttpClient` + RxJS (`.pipe`, `switchMap`, `catchError`) | `PortfolioService`, `I18nService` |
| `HttpInterceptorFn` | `LoadingInterceptor` |
| SSR + `isPlatformBrowser` | `ThemeService`, `I18nService` |
| `TransferState` | `ProjectResolver` |
| Reactive Forms + validators | `ContactComponent` |
| `TestBed`, `HttpTestingController` | fichiers `.spec.ts` |
