# Portfolio Angular — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un portfolio Angular complet couvrant routing, Signals, RxJS, SSR, i18n, dark/light theme et tests.

**Architecture:** Feature-based avec lazy loading. Core layer (services singletons, modèles, interceptors) → Shared components → App shell → Features indépendantes. Les Signals gèrent l'état UI, RxJS gère la couche HTTP vers json-server.

**Tech Stack:** Angular 22 standalone components, Tailwind CSS v4, Vitest, @angular/ssr, json-server, concurrently

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-angular-design.md`

## Global Constraints

- Angular 22, standalone components uniquement (pas de NgModules)
- TypeScript strict — pas de `any`
- Tailwind v4 via PostCSS (déjà configuré)
- Tests via `ng test` (Vitest sous le capot)
- Commits : sujet seul, pas de corps de message
- `isPlatformBrowser(platformId)` obligatoire avant tout accès à `localStorage` ou `window`
- json-server sur le port 3000, ng serve sur 4200

---

## Carte des fichiers

### Créés dans ce plan

```
db.json
src/environments/environment.ts
src/environments/environment.development.ts
src/app/core/models/project.model.ts
src/app/core/models/experience.model.ts
src/app/core/models/skill.model.ts
src/app/core/models/about.model.ts
src/app/core/services/loading.service.ts
src/app/core/services/theme.service.ts
src/app/core/services/theme.service.spec.ts
src/app/core/services/i18n.service.ts
src/app/core/services/i18n.service.spec.ts
src/app/core/services/portfolio.service.ts
src/app/core/services/portfolio.service.spec.ts
src/app/core/interceptors/loading.interceptor.ts
src/assets/i18n/fr.json
src/assets/i18n/en.json
src/app/shared/components/theme-toggle/theme-toggle.ts
src/app/shared/components/theme-toggle/theme-toggle.html
src/app/shared/components/lang-toggle/lang-toggle.ts
src/app/shared/components/lang-toggle/lang-toggle.html
src/app/shared/components/project-card/project-card.ts
src/app/shared/components/project-card/project-card.html
src/app/shared/components/skill-badge/skill-badge.ts
src/app/shared/components/skill-badge/skill-badge.html
src/app/shared/components/timeline-item/timeline-item.ts
src/app/shared/components/timeline-item/timeline-item.html
src/app/features/about/about.ts
src/app/features/about/about.html
src/app/features/experience/experience.ts
src/app/features/experience/experience.html
src/app/features/projects/projects.ts
src/app/features/projects/projects.html
src/app/features/projects/projects.spec.ts
src/app/features/projects/project-detail/project-detail.ts
src/app/features/projects/project-detail/project-detail.html
src/app/features/projects/project.resolver.ts
src/app/features/skills/skills.ts
src/app/features/skills/skills.html
src/app/features/contact/contact.ts
src/app/features/contact/contact.html
src/app/features/contact/can-deactivate.guard.ts
src/app/features/contact/can-deactivate.guard.spec.ts
src/app/features/not-found/not-found.ts
src/app/features/not-found/not-found.html
```

### Modifiés dans ce plan

```
package.json                   # script "dev", dépendances json-server + concurrently
src/app/app.ts                 # Navbar + ThemeToggle + LangToggle + router-outlet
src/app/app.html               # Template root
src/app/app.routes.ts          # Lazy routes complètes
src/app/app.config.ts          # Providers : router, httpClient, interceptor
src/styles.css                 # Directive @source Tailwind + variables dark mode
```

---

## Tâche 1 : Dépendances, données & modèles

**Fichiers :**
- Créer : `db.json`
- Créer : `src/environments/environment.ts`
- Créer : `src/environments/environment.development.ts`
- Créer : `src/app/core/models/project.model.ts`
- Créer : `src/app/core/models/experience.model.ts`
- Créer : `src/app/core/models/skill.model.ts`
- Créer : `src/app/core/models/about.model.ts`
- Modifier : `package.json`

**Interfaces :**
- Produit : interfaces `Project`, `Experience`, `Skill`, `About` utilisées par toutes les tâches suivantes
- Produit : `environment.apiUrl` utilisé par `PortfolioService`

- [ ] **Étape 1 : Installer les dépendances**

```bash
npm install --save-dev json-server concurrently
```

- [ ] **Étape 2 : Ajouter le script `dev` dans `package.json`**

Dans la section `"scripts"`, ajouter :
```json
"dev": "concurrently \"ng serve\" \"json-server --watch db.json --port 3000\""
```

- [ ] **Étape 3 : Créer `db.json` à la racine du projet**

```json
{
  "projects": [
    {
      "id": "1",
      "title": "API REST FastAPI",
      "description": "API REST complète avec authentification JWT",
      "longDescription": "Projet académique : conception et déploiement d'une API REST avec FastAPI, PostgreSQL et Docker. Implémentation d'une authentification JWT, tests d'intégration avec pytest.",
      "techs": ["Python", "FastAPI", "PostgreSQL", "Docker"],
      "github": "https://github.com/exemple/fastapi-rest",
      "year": 2024,
      "type": "academic"
    },
    {
      "id": "2",
      "title": "Dashboard data pipeline",
      "description": "Pipeline ETL et visualisation de données",
      "longDescription": "Pipeline ETL complet : extraction depuis APIs tierces, transformation avec pandas, chargement en base, visualisation avec Streamlit.",
      "techs": ["Python", "Pandas", "Streamlit", "SQLite"],
      "github": "https://github.com/exemple/data-pipeline",
      "year": 2023,
      "type": "academic"
    }
  ],
  "experiences": [
    {
      "id": "1",
      "role": "Développeur Backend (stage)",
      "company": "Entreprise Exemple",
      "period": "2024-2024",
      "description": "Développement de microservices Python, intégration d'APIs externes, mise en place de tests unitaires.",
      "type": "professional"
    },
    {
      "id": "2",
      "role": "Projet intégrateur fullstack",
      "company": "Université Exemple",
      "period": "2023-2023",
      "description": "Conception et développement d'une application web fullstack en équipe de 4 : backend Django, frontend React.",
      "type": "academic"
    }
  ],
  "skills": [
    { "id": "1", "name": "Python", "category": "backend", "level": 4 },
    { "id": "2", "name": "FastAPI", "category": "backend", "level": 3 },
    { "id": "3", "name": "PostgreSQL", "category": "backend", "level": 3 },
    { "id": "4", "name": "Docker", "category": "devops", "level": 2 },
    { "id": "5", "name": "TypeScript", "category": "frontend", "level": 3 },
    { "id": "6", "name": "Angular", "category": "frontend", "level": 2 },
    { "id": "7", "name": "Git", "category": "devops", "level": 4 }
  ],
  "about": {
    "name": "Prénom Nom",
    "bio": "Développeur orienté backend & data, passionné par la conception de systèmes robustes et la manipulation de données. En cours de formation sur Angular pour élargir mes compétences frontend.",
    "location": "Paris, France",
    "links": {
      "github": "https://github.com/exemple",
      "linkedin": "https://linkedin.com/in/exemple"
    }
  }
}
```

- [ ] **Étape 4 : Créer les fichiers d'environnement**

`src/environments/environment.ts` :
```typescript
export const environment = {
  apiUrl: 'https://ton-api.com'
}
```

`src/environments/environment.development.ts` :
```typescript
export const environment = {
  apiUrl: 'http://localhost:3000'
}
```

Dans `angular.json`, sous `projects > angular-sandbox-v1 > architect > build > configurations > development`, ajouter le remplacement de fichier :
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.development.ts"
  }
]
```

- [ ] **Étape 5 : Créer les modèles TypeScript**

`src/app/core/models/project.model.ts` :
```typescript
export interface Project {
  id: string
  title: string
  description: string
  longDescription: string
  techs: string[]
  github: string
  year: number
  type: 'academic' | 'professional' | 'personal'
}
```

`src/app/core/models/experience.model.ts` :
```typescript
export interface Experience {
  id: string
  role: string
  company: string
  period: string
  description: string
  type: 'academic' | 'professional'
}
```

`src/app/core/models/skill.model.ts` :
```typescript
export interface Skill {
  id: string
  name: string
  category: 'backend' | 'frontend' | 'devops' | 'data'
  level: 1 | 2 | 3 | 4 | 5
}
```

`src/app/core/models/about.model.ts` :
```typescript
export interface About {
  name: string
  bio: string
  location: string
  links: {
    github: string
    linkedin: string
  }
}
```

- [ ] **Étape 6 : Vérifier que le projet compile**

```bash
ng build --configuration development
```
Attendu : compilation sans erreur.

- [ ] **Étape 7 : Commit**

```bash
git add db.json src/environments/ src/app/core/models/ package.json angular.json
git commit -m "feat: add data layer — db.json, environments, TypeScript models"
```

---

## Tâche 2 : ThemeService

**Fichiers :**
- Créer : `src/app/core/services/theme.service.ts`
- Créer : `src/app/core/services/theme.service.spec.ts`

**Interfaces :**
- Consomme : `PLATFORM_ID`, `isPlatformBrowser` depuis `@angular/common`
- Produit : `ThemeService` avec `theme: WritableSignal<'light' | 'dark'>` et `toggle(): void` — utilisé par `ThemeToggle` (Tâche 5) et `app.config.ts`

- [ ] **Étape 1 : Écrire les tests en premier**

`src/app/core/services/theme.service.spec.ts` :
```typescript
import { TestBed } from '@angular/core/testing'
import { PLATFORM_ID } from '@angular/core'
import { ThemeService } from './theme.service'

describe('ThemeService', () => {
  function setup(platformId = 'browser', storedTheme: string | null = null) {
    if (storedTheme) {
      localStorage.setItem('theme', storedTheme)
    } else {
      localStorage.removeItem('theme')
    }
    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PLATFORM_ID, useValue: platformId }]
    })
    return TestBed.inject(ThemeService)
  }

  afterEach(() => localStorage.removeItem('theme'))

  it('démarre en mode light par défaut (pas de préférence sauvegardée)', () => {
    const service = setup('browser', null)
    expect(service.theme()).toBe('light')
  })

  it('lit la préférence sauvegardée en localStorage', () => {
    const service = setup('browser', 'dark')
    expect(service.theme()).toBe('dark')
  })

  it('toggle passe de light à dark', () => {
    const service = setup('browser', 'light')
    service.toggle()
    expect(service.theme()).toBe('dark')
  })

  it('toggle passe de dark à light', () => {
    const service = setup('browser', 'dark')
    service.toggle()
    expect(service.theme()).toBe('light')
  })

  it('applique la classe .dark sur documentElement en mode dark', () => {
    const service = setup('browser', 'dark')
    TestBed.flushEffects()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it("n'applique pas la classe .dark en mode light", () => {
    document.documentElement.classList.add('dark')
    const service = setup('browser', 'light')
    TestBed.flushEffects()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('ne touche pas au DOM côté serveur (platformId = server)', () => {
    expect(() => setup('server', null)).not.toThrow()
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
ng test --include "src/app/core/services/theme.service.spec.ts"
```
Attendu : FAIL — `ThemeService` n'existe pas encore.

- [ ] **Étape 3 : Implémenter `ThemeService`**

`src/app/core/services/theme.service.ts` :
```typescript
import { effect, inject, Injectable, PLATFORM_ID, signal, WritableSignal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID)
  theme: WritableSignal<'light' | 'dark'>

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId)
    const stored = isBrowser ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null
    const preferred = isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'

    this.theme = signal(stored ?? preferred)

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.classList.toggle('dark', this.theme() === 'dark')
        localStorage.setItem('theme', this.theme())
      }
    })
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'))
  }
}
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
ng test --include "src/app/core/services/theme.service.spec.ts"
```
Attendu : tous les tests PASS.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/core/services/theme.service.ts src/app/core/services/theme.service.spec.ts
git commit -m "feat: add ThemeService with signal, effect and localStorage persistence"
```

---

## Tâche 3 : I18nService & fichiers de traduction

**Fichiers :**
- Créer : `src/assets/i18n/fr.json`
- Créer : `src/assets/i18n/en.json`
- Créer : `src/app/core/services/i18n.service.ts`
- Créer : `src/app/core/services/i18n.service.spec.ts`

**Interfaces :**
- Consomme : `HttpClient` (doit être fourni via `provideHttpClient()` dans les tests)
- Produit : `I18nService` avec `lang: WritableSignal<'fr' | 'en'>`, `t(key: string): string`, `setLang(lang: 'fr' | 'en'): void` — utilisé par `LangToggle` (Tâche 5) et tous les templates

- [ ] **Étape 1 : Créer les fichiers de traduction**

`src/assets/i18n/fr.json` :
```json
{
  "nav.about": "À propos",
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
  "projects.viewGithub": "Voir sur GitHub",
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

`src/assets/i18n/en.json` :
```json
{
  "nav.about": "About",
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
  "projects.viewGithub": "View on GitHub",
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

- [ ] **Étape 2 : Écrire les tests**

`src/app/core/services/i18n.service.spec.ts` :
```typescript
import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { I18nService } from './i18n.service'

describe('I18nService', () => {
  let service: I18nService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [I18nService, provideHttpClient(), provideHttpClientTesting()]
    })
    service = TestBed.inject(I18nService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('démarre avec la langue fr', () => {
    expect(service.lang()).toBe('fr')
  })

  it('charge les traductions FR au démarrage et retourne le bon label', fakeAsync(() => {
    const req = httpMock.expectOne('/assets/i18n/fr.json')
    req.flush({ 'nav.about': 'À propos' })
    tick()
    expect(service.t('nav.about')).toBe('À propos')
  }))

  it('retourne la clé si la traduction est absente', fakeAsync(() => {
    const req = httpMock.expectOne('/assets/i18n/fr.json')
    req.flush({})
    tick()
    expect(service.t('clé.inconnue')).toBe('clé.inconnue')
  }))

  it('recharge les traductions EN quand setLang("en") est appelé', fakeAsync(() => {
    httpMock.expectOne('/assets/i18n/fr.json').flush({ 'nav.about': 'À propos' })
    tick()
    service.setLang('en')
    const req = httpMock.expectOne('/assets/i18n/en.json')
    req.flush({ 'nav.about': 'About' })
    tick()
    expect(service.lang()).toBe('en')
    expect(service.t('nav.about')).toBe('About')
  }))
})
```

- [ ] **Étape 3 : Lancer les tests pour vérifier qu'ils échouent**

```bash
ng test --include "src/app/core/services/i18n.service.spec.ts"
```
Attendu : FAIL — `I18nService` n'existe pas encore.

- [ ] **Étape 4 : Implémenter `I18nService`**

`src/app/core/services/i18n.service.ts` :
```typescript
import { inject, Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http = inject(HttpClient)

  lang = signal<'fr' | 'en'>('fr')

  private translations = toSignal(
    toObservable(this.lang).pipe(
      switchMap(lang =>
        this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      )
    ),
    { initialValue: {} as Record<string, string> }
  )

  t(key: string): string {
    return this.translations()[key] ?? key
  }

  setLang(lang: 'fr' | 'en'): void {
    this.lang.set(lang)
  }
}
```

- [ ] **Étape 5 : Lancer les tests pour vérifier qu'ils passent**

```bash
ng test --include "src/app/core/services/i18n.service.spec.ts"
```
Attendu : tous les tests PASS.

- [ ] **Étape 6 : Commit**

```bash
git add src/assets/i18n/ src/app/core/services/i18n.service.ts src/app/core/services/i18n.service.spec.ts
git commit -m "feat: add I18nService with toSignal/toObservable and FR/EN translations"
```

---

## Tâche 4 : PortfolioService, LoadingService & HttpInterceptor

**Fichiers :**
- Créer : `src/app/core/services/loading.service.ts`
- Créer : `src/app/core/services/portfolio.service.ts`
- Créer : `src/app/core/services/portfolio.service.spec.ts`
- Créer : `src/app/core/interceptors/loading.interceptor.ts`

**Interfaces :**
- Consomme : `Project`, `Experience`, `Skill`, `About` (Tâche 1) ; `environment.apiUrl` (Tâche 1) ; `LoadingService`
- Produit :
  - `LoadingService.isLoading: WritableSignal<boolean>`
  - `PortfolioService.getProjects(): Observable<Project[]>`
  - `PortfolioService.getProject(id: string): Observable<Project>`
  - `PortfolioService.getExperiences(): Observable<Experience[]>`
  - `PortfolioService.getSkills(): Observable<Skill[]>`
  - `PortfolioService.getAbout(): Observable<About>`
  - `loadingInterceptor: HttpInterceptorFn` — utilisé dans `app.config.ts`

- [ ] **Étape 1 : Créer `LoadingService`**

`src/app/core/services/loading.service.ts` :
```typescript
import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class LoadingService {
  isLoading = signal(false)
}
```

- [ ] **Étape 2 : Créer `LoadingInterceptor`**

`src/app/core/interceptors/loading.interceptor.ts` :
```typescript
import { inject } from '@angular/core'
import { HttpInterceptorFn } from '@angular/common/http'
import { finalize } from 'rxjs'
import { LoadingService } from '../services/loading.service'

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService)
  loadingService.isLoading.set(true)
  return next(req).pipe(
    finalize(() => loadingService.isLoading.set(false))
  )
}
```

- [ ] **Étape 3 : Écrire les tests de `PortfolioService`**

`src/app/core/services/portfolio.service.spec.ts` :
```typescript
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { PortfolioService } from './portfolio.service'
import { Project } from '../models/project.model'
import { Experience } from '../models/experience.model'
import { Skill } from '../models/skill.model'
import { About } from '../models/about.model'

const mockProject: Project = {
  id: '1', title: 'Test', description: 'desc', longDescription: 'long',
  techs: ['Python'], github: 'https://github.com/test', year: 2024, type: 'academic'
}

describe('PortfolioService', () => {
  let service: PortfolioService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PortfolioService, provideHttpClient(), provideHttpClientTesting()]
    })
    service = TestBed.inject(PortfolioService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('getProjects() appelle GET /projects', () => {
    service.getProjects().subscribe(projects => {
      expect(projects.length).toBe(1)
      expect(projects[0].title).toBe('Test')
    })
    httpMock.expectOne('http://localhost:3000/projects').flush([mockProject])
  })

  it('getProject(id) appelle GET /projects/:id', () => {
    service.getProject('1').subscribe(project => {
      expect(project.id).toBe('1')
    })
    httpMock.expectOne('http://localhost:3000/projects/1').flush(mockProject)
  })

  it('getExperiences() appelle GET /experiences', () => {
    const mockExp: Experience = {
      id: '1', role: 'Dev', company: 'Acme', period: '2024', description: 'desc', type: 'academic'
    }
    service.getExperiences().subscribe(exps => expect(exps.length).toBe(1))
    httpMock.expectOne('http://localhost:3000/experiences').flush([mockExp])
  })

  it('getSkills() appelle GET /skills', () => {
    const mockSkill: Skill = { id: '1', name: 'Python', category: 'backend', level: 4 }
    service.getSkills().subscribe(skills => expect(skills.length).toBe(1))
    httpMock.expectOne('http://localhost:3000/skills').flush([mockSkill])
  })

  it('getAbout() appelle GET /about', () => {
    const mockAbout: About = {
      name: 'Test', bio: 'bio', location: 'Paris',
      links: { github: 'gh', linkedin: 'li' }
    }
    service.getAbout().subscribe(about => expect(about.name).toBe('Test'))
    httpMock.expectOne('http://localhost:3000/about').flush(mockAbout)
  })
})
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils échouent**

```bash
ng test --include "src/app/core/services/portfolio.service.spec.ts"
```
Attendu : FAIL — `PortfolioService` n'existe pas encore.

- [ ] **Étape 5 : Implémenter `PortfolioService`**

`src/app/core/services/portfolio.service.ts` :
```typescript
import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { throwError } from 'rxjs'
import { environment } from '../../../environments/environment'
import { Project } from '../models/project.model'
import { Experience } from '../models/experience.model'
import { Skill } from '../models/skill.model'
import { About } from '../models/about.model'

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient)
  private base = environment.apiUrl

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/projects`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/projects/${id}`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.base}/experiences`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.base}/skills`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getAbout(): Observable<About> {
    return this.http.get<About>(`${this.base}/about`).pipe(
      catchError(err => throwError(() => err))
    )
  }
}
```

- [ ] **Étape 6 : Lancer les tests pour vérifier qu'ils passent**

```bash
ng test --include "src/app/core/services/portfolio.service.spec.ts"
```
Attendu : tous les tests PASS.

- [ ] **Étape 7 : Commit**

```bash
git add src/app/core/services/loading.service.ts src/app/core/services/portfolio.service.ts src/app/core/services/portfolio.service.spec.ts src/app/core/interceptors/loading.interceptor.ts
git commit -m "feat: add PortfolioService, LoadingService and HttpInterceptor"
```

---

## Tâche 5 : App Shell (config, routes, navbar, composants partagés UI)

**Fichiers :**
- Modifier : `src/app/app.config.ts`
- Modifier : `src/app/app.routes.ts`
- Modifier : `src/app/app.ts`
- Modifier : `src/app/app.html`
- Modifier : `src/styles.css`
- Créer : `src/app/shared/components/theme-toggle/theme-toggle.ts`
- Créer : `src/app/shared/components/theme-toggle/theme-toggle.html`
- Créer : `src/app/shared/components/lang-toggle/lang-toggle.ts`
- Créer : `src/app/shared/components/lang-toggle/lang-toggle.html`
- Créer : `src/app/features/not-found/not-found.ts`
- Créer : `src/app/features/not-found/not-found.html`

**Interfaces :**
- Consomme : `ThemeService.theme`, `ThemeService.toggle()` (Tâche 2) ; `I18nService.lang`, `I18nService.t()`, `I18nService.setLang()` (Tâche 3) ; `loadingInterceptor` (Tâche 4)
- Produit : application navigable avec navbar, toutes les routes définies en lazy loading

- [ ] **Étape 1 : Mettre à jour `app.config.ts`**

`src/app/app.config.ts` :
```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { routes } from './app.routes'
import { loadingInterceptor } from './core/interceptors/loading.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([loadingInterceptor])),
    provideClientHydration(withEventReplay()),
  ]
}
```

- [ ] **Étape 2 : Définir les routes dans `app.routes.ts`**

`src/app/app.routes.ts` :
```typescript
import { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', redirectTo: 'about', pathMatch: 'full' },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about').then(m => m.AboutComponent)
  },
  {
    path: 'experience',
    loadComponent: () => import('./features/experience/experience').then(m => m.ExperienceComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/projects').then(m => m.ProjectsComponent)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/projects/project-detail/project-detail').then(m => m.ProjectDetailComponent),
    resolve: { project: () => import('./features/projects/project.resolver').then(m => m.projectResolver) }
  },
  {
    path: 'skills',
    loadComponent: () => import('./features/skills/skills').then(m => m.SkillsComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then(m => m.ContactComponent),
    canDeactivate: [() => import('./features/contact/can-deactivate.guard').then(m => m.canDeactivateContact)]
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent)
  }
]
```

Note : les imports de resolver et guard sont dynamiques pour maintenir le lazy loading complet. Le resolver sera complété à la Tâche 9.

- [ ] **Étape 3 : Créer `ThemeToggle`**

`src/app/shared/components/theme-toggle/theme-toggle.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { ThemeService } from '../../../core/services/theme.service'

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.html',
})
export class ThemeToggleComponent {
  protected themeService = inject(ThemeService)
}
```

`src/app/shared/components/theme-toggle/theme-toggle.html` :
```html
<button (click)="themeService.toggle()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" [attr.aria-label]="themeService.theme() === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'">
  @if (themeService.theme() === 'dark') {
    ☀️
  } @else {
    🌙
  }
</button>
```

- [ ] **Étape 4 : Créer `LangToggle`**

`src/app/shared/components/lang-toggle/lang-toggle.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { I18nService } from '../../../core/services/i18n.service'

@Component({
  selector: 'app-lang-toggle',
  templateUrl: './lang-toggle.html',
})
export class LangToggleComponent {
  protected i18n = inject(I18nService)
}
```

`src/app/shared/components/lang-toggle/lang-toggle.html` :
```html
<button (click)="i18n.setLang(i18n.lang() === 'fr' ? 'en' : 'fr')" class="p-2 rounded-lg font-mono text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
  {{ i18n.lang() === 'fr' ? 'EN' : 'FR' }}
</button>
```

- [ ] **Étape 5 : Créer `NotFoundComponent`**

`src/app/features/not-found/not-found.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { I18nService } from '../../core/services/i18n.service'

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  protected i18n = inject(I18nService)
}
```

`src/app/features/not-found/not-found.html` :
```html
<div class="flex flex-col items-center justify-center min-h-[60vh] gap-4">
  <h1 class="text-4xl font-bold">404</h1>
  <p class="text-lg text-gray-600 dark:text-gray-400">{{ i18n.t('notFound.title') }}</p>
  <a routerLink="/about" class="text-blue-600 hover:underline dark:text-blue-400">
    {{ i18n.t('notFound.back') }}
  </a>
</div>
```

- [ ] **Étape 6 : Mettre à jour le composant racine `app.ts`**

`src/app/app.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { I18nService } from './core/services/i18n.service'
import { LoadingService } from './core/services/loading.service'
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle'
import { LangToggleComponent } from './shared/components/lang-toggle/lang-toggle'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent, LangToggleComponent],
  templateUrl: './app.html',
})
export class App {
  protected i18n = inject(I18nService)
  protected loading = inject(LoadingService)
}
```

`src/app/app.html` :
```html
<header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
  <nav class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
    <ul class="flex gap-2">
      <li><a routerLink="/about" routerLinkActive="font-semibold text-blue-600 dark:text-blue-400" class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">{{ i18n.t('nav.about') }}</a></li>
      <li><a routerLink="/experience" routerLinkActive="font-semibold text-blue-600 dark:text-blue-400" class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">{{ i18n.t('nav.experience') }}</a></li>
      <li><a routerLink="/projects" routerLinkActive="font-semibold text-blue-600 dark:text-blue-400" class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">{{ i18n.t('nav.projects') }}</a></li>
      <li><a routerLink="/skills" routerLinkActive="font-semibold text-blue-600 dark:text-blue-400" class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">{{ i18n.t('nav.skills') }}</a></li>
      <li><a routerLink="/contact" routerLinkActive="font-semibold text-blue-600 dark:text-blue-400" class="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">{{ i18n.t('nav.contact') }}</a></li>
    </ul>
    <div class="flex items-center gap-1">
      <app-lang-toggle />
      <app-theme-toggle />
    </div>
  </nav>
  @if (loading.isLoading()) {
    <div class="h-0.5 bg-blue-500 animate-pulse"></div>
  }
</header>

<main class="max-w-4xl mx-auto px-4 py-8">
  <router-outlet />
</main>
```

- [ ] **Étape 7 : Configurer Tailwind dark mode dans `styles.css`**

`src/styles.css` :
```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));
```

- [ ] **Étape 8 : Vérifier que l'app compile et la navigation fonctionne**

```bash
ng build --configuration development
```
Attendu : compilation sans erreur. Les routes peuvent afficher une erreur 404 de composants manquants — c'est normal, les features seront ajoutées dans les tâches suivantes.

- [ ] **Étape 9 : Commit**

```bash
git add src/app/app.config.ts src/app/app.routes.ts src/app/app.ts src/app/app.html src/styles.css src/app/shared/ src/app/features/not-found/
git commit -m "feat: add app shell with navbar, lazy routes, ThemeToggle and LangToggle"
```

---

## Tâche 6 : Feature About

**Fichiers :**
- Créer : `src/app/features/about/about.ts`
- Créer : `src/app/features/about/about.html`

**Interfaces :**
- Consomme : `PortfolioService.getAbout(): Observable<About>` (Tâche 4) ; `I18nService.t()` (Tâche 3) ; `About` model (Tâche 1)
- Produit : page `/about` affichant les données de `about` depuis json-server via `toSignal()`

- [ ] **Étape 1 : Créer `AboutComponent`**

`src/app/features/about/about.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
})
export class AboutComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  protected about = toSignal(this.portfolioService.getAbout())
}
```

`src/app/features/about/about.html` :
```html
<section>
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('about.title') }}</h1>

  @if (about(); as data) {
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-semibold">{{ data.name }}</h2>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          📍 {{ i18n.t('about.location') }} : {{ data.location }}
        </p>
      </div>

      <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ data.bio }}</p>

      <div>
        <h3 class="font-semibold mb-2">{{ i18n.t('about.links') }}</h3>
        <ul class="flex gap-4">
          <li>
            <a [href]="data.links.github" target="_blank" rel="noopener"
               class="text-blue-600 hover:underline dark:text-blue-400">GitHub</a>
          </li>
          <li>
            <a [href]="data.links.linkedin" target="_blank" rel="noopener"
               class="text-blue-600 hover:underline dark:text-blue-400">LinkedIn</a>
          </li>
        </ul>
      </div>
    </div>
  } @else {
    <p class="text-gray-400">Chargement...</p>
  }
</section>
```

- [ ] **Étape 2 : Vérifier en lançant l'app**

```bash
npm run dev
```
Ouvrir `http://localhost:4200/about`. Les données de `about` dans `db.json` doivent s'afficher.

- [ ] **Étape 3 : Commit**

```bash
git add src/app/features/about/
git commit -m "feat: add About page with toSignal HTTP pattern"
```

---

## Tâche 7 : Feature Experience

**Fichiers :**
- Créer : `src/app/features/experience/experience.ts`
- Créer : `src/app/features/experience/experience.html`
- Créer : `src/app/shared/components/timeline-item/timeline-item.ts`
- Créer : `src/app/shared/components/timeline-item/timeline-item.html`

**Interfaces :**
- Consomme : `PortfolioService.getExperiences(): Observable<Experience[]>` (Tâche 4) ; `Experience` model (Tâche 1) ; `I18nService.t()` (Tâche 3)
- Produit : page `/experience` avec `TimelineItemComponent` réutilisable recevant une `Experience` en `@Input()`

- [ ] **Étape 1 : Créer `TimelineItemComponent`**

`src/app/shared/components/timeline-item/timeline-item.ts` :
```typescript
import { Component, inject, input } from '@angular/core'
import { Experience } from '../../../core/models/experience.model'
import { I18nService } from '../../../core/services/i18n.service'

@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.html',
})
export class TimelineItemComponent {
  experience = input.required<Experience>()
  protected i18n = inject(I18nService)
}
```

`src/app/shared/components/timeline-item/timeline-item.html` :
```html
<div class="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 pb-8 last:pb-0">
  <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
  <div class="flex items-start justify-between gap-4">
    <div>
      <h3 class="font-semibold text-lg">{{ experience().role }}</h3>
      <p class="text-gray-600 dark:text-gray-400">{{ experience().company }}</p>
    </div>
    <div class="flex flex-col items-end gap-1 shrink-0">
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ experience().period }}</span>
      <span class="text-xs px-2 py-0.5 rounded-full"
            [class]="experience().type === 'academic'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'">
        {{ i18n.t('experience.type.' + experience().type) }}
      </span>
    </div>
  </div>
  <p class="mt-2 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
    {{ experience().description }}
  </p>
</div>
```

- [ ] **Étape 2 : Créer `ExperienceComponent`**

`src/app/features/experience/experience.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'
import { TimelineItemComponent } from '../../shared/components/timeline-item/timeline-item'

@Component({
  selector: 'app-experience',
  imports: [TimelineItemComponent],
  templateUrl: './experience.html',
})
export class ExperienceComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  protected experiences = toSignal(this.portfolioService.getExperiences(), { initialValue: [] })
}
```

`src/app/features/experience/experience.html` :
```html
<section>
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('experience.title') }}</h1>

  <div class="mt-6">
    @for (exp of experiences(); track exp.id) {
      <app-timeline-item [experience]="exp" />
    } @empty {
      <p class="text-gray-400">Chargement...</p>
    }
  </div>
</section>
```

- [ ] **Étape 3 : Vérifier en lançant l'app**

```bash
npm run dev
```
Ouvrir `http://localhost:4200/experience`. Les expériences de `db.json` doivent s'afficher en timeline.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/features/experience/ src/app/shared/components/timeline-item/
git commit -m "feat: add Experience page with TimelineItem component and @for"
```

---

## Tâche 8 : Feature Projects (liste + filtre)

**Fichiers :**
- Créer : `src/app/features/projects/projects.ts`
- Créer : `src/app/features/projects/projects.html`
- Créer : `src/app/features/projects/projects.spec.ts`
- Créer : `src/app/shared/components/project-card/project-card.ts`
- Créer : `src/app/shared/components/project-card/project-card.html`

**Interfaces :**
- Consomme : `PortfolioService.getProjects(): Observable<Project[]>` (Tâche 4) ; `Project` model (Tâche 1) ; `I18nService.t()` (Tâche 3)
- Produit :
  - `ProjectsComponent` avec `selectedTech: WritableSignal<string | null>` et `filteredProjects: Signal<Project[]>`
  - `ProjectCardComponent` avec `project = input.required<Project>()`

- [ ] **Étape 1 : Créer `ProjectCardComponent`**

`src/app/shared/components/project-card/project-card.ts` :
```typescript
import { Component, inject, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Project } from '../../../core/models/project.model'
import { I18nService } from '../../../core/services/i18n.service'

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  project = input.required<Project>()
  protected i18n = inject(I18nService)
}
```

`src/app/shared/components/project-card/project-card.html` :
```html
<article class="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
  <div class="flex items-start justify-between">
    <h3 class="font-semibold text-lg">
      <a [routerLink]="['/projects', project().id]" class="hover:text-blue-600 dark:hover:text-blue-400">
        {{ project().title }}
      </a>
    </h3>
    <span class="text-sm text-gray-500">{{ project().year }}</span>
  </div>

  <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{{ project().description }}</p>

  <div class="flex flex-wrap gap-2 mt-auto">
    @for (tech of project().techs; track tech) {
      <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
        {{ tech }}
      </span>
    }
  </div>

  <a [href]="project().github" target="_blank" rel="noopener"
     class="text-sm text-blue-600 hover:underline dark:text-blue-400 self-start">
    {{ i18n.t('projects.viewGithub') }} →
  </a>
</article>
```

- [ ] **Étape 2 : Écrire les tests de `ProjectsComponent`**

`src/app/features/projects/projects.spec.ts` :
```typescript
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideRouter } from '@angular/router'
import { ProjectsComponent } from './projects'
import { Project } from '../../core/models/project.model'

const mockProjects: Project[] = [
  { id: '1', title: 'A', description: '', longDescription: '', techs: ['Python', 'FastAPI'], github: '', year: 2024, type: 'academic' },
  { id: '2', title: 'B', description: '', longDescription: '', techs: ['TypeScript'], github: '', year: 2023, type: 'academic' },
]

describe('ProjectsComponent', () => {
  let component: ProjectsComponent
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents()

    const fixture = TestBed.createComponent(ProjectsComponent)
    component = fixture.componentInstance
    httpMock = TestBed.inject(HttpTestingController)
    httpMock.expectOne('http://localhost:3000/projects').flush(mockProjects)
    TestBed.flushEffects()
    fixture.detectChanges()
  })

  afterEach(() => httpMock.verify())

  it('affiche tous les projets quand aucun filtre sélectionné', () => {
    expect(component.filteredProjects().length).toBe(2)
  })

  it('filtre les projets par technologie', () => {
    component.selectTech('Python')
    expect(component.filteredProjects().length).toBe(1)
    expect(component.filteredProjects()[0].title).toBe('A')
  })

  it('réinitialise le filtre quand selectTech(null) est appelé', () => {
    component.selectTech('Python')
    component.selectTech(null)
    expect(component.filteredProjects().length).toBe(2)
  })
})
```

- [ ] **Étape 3 : Lancer les tests pour vérifier qu'ils échouent**

```bash
ng test --include "src/app/features/projects/projects.spec.ts"
```
Attendu : FAIL — `ProjectsComponent` n'existe pas encore.

- [ ] **Étape 4 : Implémenter `ProjectsComponent`**

`src/app/features/projects/projects.ts` :
```typescript
import { Component, computed, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'
import { ProjectCardComponent } from '../../shared/components/project-card/project-card'

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent],
  templateUrl: './projects.html',
})
export class ProjectsComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  private projects = toSignal(this.portfolioService.getProjects(), { initialValue: [] })
  selectedTech = signal<string | null>(null)

  filteredProjects = computed(() =>
    this.projects().filter(p => !this.selectedTech() || p.techs.includes(this.selectedTech()!))
  )

  availableTechs = computed(() =>
    [...new Set(this.projects().flatMap(p => p.techs))].sort()
  )

  selectTech(tech: string | null): void {
    this.selectedTech.set(tech)
  }
}
```

`src/app/features/projects/projects.html` :
```html
<section>
  <h1 class="text-3xl font-bold mb-6">{{ i18n.t('projects.title') }}</h1>

  <div class="flex flex-wrap gap-2 mb-8">
    <button (click)="selectTech(null)"
            [class]="!selectedTech() ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            class="px-3 py-1 rounded-full text-sm transition-colors">
      {{ i18n.t('projects.filter.all') }}
    </button>
    @for (tech of availableTechs(); track tech) {
      <button (click)="selectTech(tech)"
              [class]="selectedTech() === tech ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
              class="px-3 py-1 rounded-full text-sm transition-colors">
        {{ tech }}
      </button>
    }
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    @for (project of filteredProjects(); track project.id) {
      <app-project-card [project]="project" />
    } @empty {
      <p class="text-gray-400 col-span-2 text-center py-8">Aucun projet trouvé.</p>
    }
  </div>
</section>
```

- [ ] **Étape 5 : Lancer les tests pour vérifier qu'ils passent**

```bash
ng test --include "src/app/features/projects/projects.spec.ts"
```
Attendu : tous les tests PASS.

- [ ] **Étape 6 : Commit**

```bash
git add src/app/features/projects/projects.ts src/app/features/projects/projects.html src/app/features/projects/projects.spec.ts src/app/shared/components/project-card/
git commit -m "feat: add Projects page with computed filter and ProjectCard component"
```

---

## Tâche 9 : Feature Project Detail (resolver, TransferState, SSR)

**Fichiers :**
- Créer : `src/app/features/projects/project.resolver.ts`
- Créer : `src/app/features/projects/project-detail/project-detail.ts`
- Créer : `src/app/features/projects/project-detail/project-detail.html`

**Interfaces :**
- Consomme : `PortfolioService.getProject(id: string): Observable<Project>` (Tâche 4) ; `Project` model (Tâche 1) ; `I18nService.t()` (Tâche 3)
- Produit :
  - `projectResolver: ResolveFn<Project>` — précharge le projet avant rendu
  - `ProjectDetailComponent` lisant `route.data['project']` via `ActivatedRoute`

Note : La route `/projects/:id` dans `app.routes.ts` référence déjà ce resolver via import dynamique. À cette étape, le fichier sera créé et la route fonctionnera automatiquement.

- [ ] **Étape 1 : Créer `projectResolver`**

`src/app/features/projects/project.resolver.ts` :
```typescript
import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { makeStateKey, TransferState } from '@angular/platform-browser'
import { tap } from 'rxjs'
import { Project } from '../../core/models/project.model'
import { PortfolioService } from '../../core/services/portfolio.service'

export const PROJECT_KEY = makeStateKey<Project>('project')

export const projectResolver: ResolveFn<Project> = (route) => {
  const portfolioService = inject(PortfolioService)
  const transferState = inject(TransferState)
  const id = route.paramMap.get('id')!

  const cached = transferState.get(PROJECT_KEY, null)
  if (cached) {
    transferState.remove(PROJECT_KEY)
    return cached
  }

  return portfolioService.getProject(id).pipe(
    tap(project => transferState.set(PROJECT_KEY, project))
  )
}
```

- [ ] **Étape 2 : Créer `ProjectDetailComponent`**

`src/app/features/projects/project-detail/project-detail.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { I18nService } from '../../../core/services/i18n.service'

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.html',
})
export class ProjectDetailComponent {
  protected i18n = inject(I18nService)
  private route = inject(ActivatedRoute)

  protected project = toSignal(
    this.route.data.pipe(map(data => data['project']))
  )
}
```

`src/app/features/projects/project-detail/project-detail.html` :
```html
@if (project(); as p) {
  <article class="space-y-6">
    <a routerLink="/projects" class="text-sm text-blue-600 hover:underline dark:text-blue-400">
      ← {{ i18n.t('projects.backToList') }}
    </a>

    <div>
      <div class="flex items-start justify-between">
        <h1 class="text-3xl font-bold">{{ p.title }}</h1>
        <span class="text-gray-500 text-sm">{{ p.year }}</span>
      </div>
    </div>

    <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ p.longDescription }}</p>

    <div class="flex flex-wrap gap-2">
      @for (tech of p.techs; track tech) {
        <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300">
          {{ tech }}
        </span>
      }
    </div>

    <a [href]="p.github" target="_blank" rel="noopener"
       class="inline-block text-blue-600 hover:underline dark:text-blue-400">
      {{ i18n.t('projects.viewGithub') }} →
    </a>
  </article>
} @else {
  <p class="text-gray-400">Chargement...</p>
}
```

- [ ] **Étape 3 : Vérifier en lançant l'app**

```bash
npm run dev
```
Naviguer vers un projet depuis `/projects`. La page détail doit afficher `longDescription`. Vérifier dans l'onglet Network du navigateur qu'un seul appel HTTP est fait (pas de double appel côté client si le SSR a préchargé).

- [ ] **Étape 4 : Commit**

```bash
git add src/app/features/projects/project.resolver.ts src/app/features/projects/project-detail/
git commit -m "feat: add ProjectDetail with resolver and TransferState for SSR"
```

---

## Tâche 10 : Feature Skills

**Fichiers :**
- Créer : `src/app/features/skills/skills.ts`
- Créer : `src/app/features/skills/skills.html`
- Créer : `src/app/shared/components/skill-badge/skill-badge.ts`
- Créer : `src/app/shared/components/skill-badge/skill-badge.html`

**Interfaces :**
- Consomme : `PortfolioService.getSkills(): Observable<Skill[]>` (Tâche 4) ; `Skill` model (Tâche 1) ; `I18nService.t()` (Tâche 3)
- Produit : `SkillsComponent` avec groupement par catégorie via `computed()` ; `SkillBadgeComponent` avec `skill = input.required<Skill>()`

- [ ] **Étape 1 : Créer `SkillBadgeComponent`**

`src/app/shared/components/skill-badge/skill-badge.ts` :
```typescript
import { Component, input } from '@angular/core'
import { Skill } from '../../../core/models/skill.model'

@Component({
  selector: 'app-skill-badge',
  templateUrl: './skill-badge.html',
})
export class SkillBadgeComponent {
  skill = input.required<Skill>()
}
```

`src/app/shared/components/skill-badge/skill-badge.html` :
```html
<div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
  <span class="text-sm font-medium">{{ skill().name }}</span>
  <div class="flex gap-1 ml-3">
    @for (dot of [1,2,3,4,5]; track dot) {
      <div class="w-2 h-2 rounded-full"
           [class]="dot <= skill().level
             ? 'bg-blue-500'
             : 'bg-gray-200 dark:bg-gray-600'">
      </div>
    }
  </div>
</div>
```

- [ ] **Étape 2 : Créer `SkillsComponent`**

`src/app/features/skills/skills.ts` :
```typescript
import { Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'
import { Skill } from '../../core/models/skill.model'
import { SkillBadgeComponent } from '../../shared/components/skill-badge/skill-badge'

@Component({
  selector: 'app-skills',
  imports: [SkillBadgeComponent],
  templateUrl: './skills.html',
})
export class SkillsComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  private skills = toSignal(this.portfolioService.getSkills(), { initialValue: [] })

  protected groupedSkills = computed(() => {
    const groups = new Map<Skill['category'], Skill[]>()
    for (const skill of this.skills()) {
      const list = groups.get(skill.category) ?? []
      groups.set(skill.category, [...list, skill])
    }
    return groups
  })

  protected categories = computed(() => [...this.groupedSkills().keys()])
}
```

`src/app/features/skills/skills.html` :
```html
<section>
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('skills.title') }}</h1>

  <div class="space-y-8">
    @for (category of categories(); track category) {
      <div>
        <h2 class="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
          {{ i18n.t('skills.category.' + category) }}
        </h2>
        <div class="grid gap-2 sm:grid-cols-2">
          @for (skill of groupedSkills().get(category)!; track skill.id) {
            <app-skill-badge [skill]="skill" />
          }
        </div>
      </div>
    }
  </div>
</section>
```

- [ ] **Étape 3 : Vérifier en lançant l'app**

```bash
npm run dev
```
Ouvrir `http://localhost:4200/skills`. Les compétences de `db.json` doivent s'afficher groupées par catégorie avec les points de niveau.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/features/skills/ src/app/shared/components/skill-badge/
git commit -m "feat: add Skills page with computed grouping and SkillBadge component"
```

---

## Tâche 11 : Feature Contact (Reactive Forms + CanDeactivateGuard)

**Fichiers :**
- Créer : `src/app/features/contact/contact.ts`
- Créer : `src/app/features/contact/contact.html`
- Créer : `src/app/features/contact/can-deactivate.guard.ts`
- Créer : `src/app/features/contact/can-deactivate.guard.spec.ts`

**Interfaces :**
- Consomme : `ReactiveFormsModule`, `Validators` depuis `@angular/forms` ; `I18nService.t()` (Tâche 3)
- Produit :
  - `ContactComponent` avec `form: FormGroup` exposant `form.pristine` pour le guard
  - `canDeactivateContact: CanDeactivateFn<ContactComponent>`

- [ ] **Étape 1 : Écrire les tests du guard**

`src/app/features/contact/can-deactivate.guard.spec.ts` :
```typescript
import { canDeactivateContact } from './can-deactivate.guard'
import { ContactComponent } from './contact'

describe('canDeactivateContact', () => {
  function makeComponent(pristine: boolean) {
    return { form: { pristine } } as unknown as ContactComponent
  }

  it('retourne true si le formulaire est pristine (non modifié)', () => {
    const result = canDeactivateContact(makeComponent(true), null!, null!, null!)
    expect(result).toBe(true)
  })

  it('retourne false si le formulaire est dirty et confirm est annulé', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const result = canDeactivateContact(makeComponent(false), null!, null!, null!)
    expect(result).toBe(false)
    vi.restoreAllMocks()
  })

  it('retourne true si le formulaire est dirty et confirm est accepté', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const result = canDeactivateContact(makeComponent(false), null!, null!, null!)
    expect(result).toBe(true)
    vi.restoreAllMocks()
  })
})
```

- [ ] **Étape 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
ng test --include "src/app/features/contact/can-deactivate.guard.spec.ts"
```
Attendu : FAIL — `canDeactivateContact` n'existe pas encore.

- [ ] **Étape 3 : Implémenter le guard**

`src/app/features/contact/can-deactivate.guard.ts` :
```typescript
import { CanDeactivateFn } from '@angular/router'
import { ContactComponent } from './contact'

export const canDeactivateContact: CanDeactivateFn<ContactComponent> = (component) => {
  return component.form.pristine || confirm('Quitter ? Votre message sera perdu.')
}
```

- [ ] **Étape 4 : Lancer les tests du guard pour vérifier qu'ils passent**

```bash
ng test --include "src/app/features/contact/can-deactivate.guard.spec.ts"
```
Attendu : tous les tests PASS.

- [ ] **Étape 5 : Implémenter `ContactComponent`**

`src/app/features/contact/contact.ts` :
```typescript
import { Component, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { I18nService } from '../../core/services/i18n.service'

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
})
export class ContactComponent {
  protected i18n = inject(I18nService)
  private fb = inject(FormBuilder)

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]]
  })

  protected submitted = false

  submit(): void {
    if (this.form.valid) {
      this.submitted = true
      this.form.reset()
    } else {
      this.form.markAllAsTouched()
    }
  }
}
```

`src/app/features/contact/contact.html` :
```html
<section class="max-w-lg">
  <h1 class="text-3xl font-bold mb-8">{{ i18n.t('contact.title') }}</h1>

  @if (submitted) {
    <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
      Message envoyé !
    </div>
  } @else {
    <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" novalidate>
      <div>
        <label for="name" class="block text-sm font-medium mb-1">{{ i18n.t('contact.name') }}</label>
        <input id="name" formControlName="name" type="text"
               class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
               [class.border-red-500]="form.controls.name.invalid && form.controls.name.touched">
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <p class="text-red-500 text-xs mt-1">Minimum 2 caractères requis.</p>
        }
      </div>

      <div>
        <label for="email" class="block text-sm font-medium mb-1">{{ i18n.t('contact.email') }}</label>
        <input id="email" formControlName="email" type="email"
               class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
               [class.border-red-500]="form.controls.email.invalid && form.controls.email.touched">
        @if (form.controls.email.invalid && form.controls.email.touched) {
          <p class="text-red-500 text-xs mt-1">Adresse email invalide.</p>
        }
      </div>

      <div>
        <label for="message" class="block text-sm font-medium mb-1">{{ i18n.t('contact.message') }}</label>
        <textarea id="message" formControlName="message" rows="5"
                  class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  [class.border-red-500]="form.controls.message.invalid && form.controls.message.touched">
        </textarea>
        @if (form.controls.message.invalid && form.controls.message.touched) {
          <p class="text-red-500 text-xs mt-1">Minimum 10 caractères requis.</p>
        }
      </div>

      <button type="submit"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              [disabled]="form.invalid">
        {{ i18n.t('contact.send') }}
      </button>
    </form>
  }
</section>
```

- [ ] **Étape 6 : Vérifier en lançant l'app**

```bash
npm run dev
```
Ouvrir `http://localhost:4200/contact`. Tester :
- Soumission avec champs vides → messages d'erreur apparaissent
- Commencer à remplir → naviguer ailleurs → confirmation apparaît
- Remplir correctement → soumettre → message de succès

- [ ] **Étape 7 : Lancer tous les tests**

```bash
ng test
```
Attendu : tous les tests PASS.

- [ ] **Étape 8 : Commit final**

```bash
git add src/app/features/contact/
git commit -m "feat: add Contact page with Reactive Forms, validators and CanDeactivateGuard"
```
