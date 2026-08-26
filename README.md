# Portfolio Angular

Application portfolio développée avec Angular 22 dans un objectif formatif — explorer les concepts fondamentaux du framework tout en construisant un projet concret.

## Sections

| Route         | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `/about`      | Présentation personnelle                                         |
| `/experience` | Timeline des expériences académiques et professionnelles         |
| `/projects`   | Liste des projets avec filtre par technologie, détail par projet |
| `/skills`     | Visualisation des compétences par catégorie                      |
| `/contact`    | Formulaire de contact                                            |

## Concepts Angular explorés

- **Routing** — lazy loading, route params, resolvers, guards (`CanDeactivate`)
- **State management** — Signals (`signal`, `computed`, `effect`), RxJS (`Observable`, `switchMap`), pont `toSignal` / `toObservable`
- **SSR & Hydration** — `@angular/ssr`, `isPlatformBrowser`, `TransferState`
- **Internationalisation** — FR/EN via fichiers JSON + service custom
- **Dark/Light theme** — Tailwind v4 + `effect()` + `localStorage`
- **Tests** — Vitest, `TestBed`, `HttpTestingController`

## Stack

- Angular 22 (standalone components)
- Tailwind CSS v4
- json-server (faux backend REST)
- Vitest
- SSR via `@angular/ssr` + Express

## Démarrage

```bash
# Installer les dépendances
npm install

# Lancer Angular + json-server en parallèle
npm run dev
```

## Spécifications

Le document de design complet est disponible dans [`docs/superpowers/specs/2026-08-19-portfolio-angular-design.md`](docs/superpowers/specs/2026-08-19-portfolio-angular-design.md).

## Commandes utiles

```bash
ng serve          # Serveur de développement (http://localhost:4200)
ng build          # Build de production
ng test           # Tests unitaires
ng generate component <nom>   # Générer un composant
```
