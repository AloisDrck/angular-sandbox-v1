import { Routes } from '@angular/router'
import { projectResolver } from './features/projects/project.resolver'

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
    resolve: { project: projectResolver }
  },
  {
    path: 'skills',
    loadComponent: () => import('./features/skills/skills').then(m => m.SkillsComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then(m => m.ContactComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then(m => m.NotFoundComponent)
  }
]
