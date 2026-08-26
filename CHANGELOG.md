# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Dark mode with global CSS palette (body `gray-950`, navbar `gray-900`, cards `gray-900`) and ThemeToggle
- Multilingual content (FR/EN) via reactive `PortfolioService` with `?lang=` filtering on json-server
- `I18nService` with `toSignal`/`toObservable` and FR/EN JSON translation files
- `ThemeService` with signal, effect and `localStorage` persistence
- Contact page with Reactive Forms, validators and `CanDeactivateGuard` (i18n confirm message)
- Skills page with computed grouping by category and `SkillBadge` component
- ProjectDetail page with resolver, `TransferState` for SSR and slug-based routing
- Projects page with computed tech filter and `ProjectCard` component
- Experience page with `TimelineItem` component and `@for` directive
- About page with `toSignal` HTTP pattern
- App shell with navbar, lazy routes, `ThemeToggle` and `LangToggle`
- `PortfolioService`, `LoadingService` and loading HTTP interceptor
- Data layer: `db.json` with real CV data (FR/EN), environments and TypeScript models

### Changed

- GitHub Actions CI workflow: ESLint lint, Prettier format check, build and test on push/PR
- ESLint (`angular-eslint` + `typescript-eslint`) and Prettier enforced across the codebase
- i18n JSON files moved from `src/assets/` to `public/assets/` (Angular 19+ static assets convention)
- README updated with portfolio sections and stack description

### Fixed

- Skip i18n HTTP request on server side to prevent SSR stabilization loop
- Sizing classes missing in `skill-badge` dot class binding
- Explicit `Project` cast in `project-detail` `toSignal` map
- Replace deprecated `flushEffects` with `TestBed.tick()` in projects spec
- Align `About` model and `db.json` fields (`repoGit`, `gitlab`)
