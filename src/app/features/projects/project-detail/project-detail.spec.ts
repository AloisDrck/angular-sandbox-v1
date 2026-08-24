import { TestBed } from '@angular/core/testing'
import { ComponentFixture } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of, NEVER } from 'rxjs'
import { ProjectDetailComponent } from './project-detail'
import { I18nService } from '../../../core/services/i18n.service'
import { Project } from '../../../core/models/project.model'

const mockProject: Project = {
  id: 'portfolio-fr',
  slug: 'portfolio',
  title: 'Mon Projet',
  description: 'desc',
  longDescription: 'Une description longue',
  techs: ['Angular', 'TypeScript'],
  repoGit: 'https://github.com/user/repo',
  year: 2024,
  type: 'personal',
}

class MockI18nService {
  t(key: string): string {
    const map: Record<string, string> = {
      'projects.backToList': 'Retour à la liste',
      'projects.viewProject': 'Voir le projet',
    }
    return map[key] ?? key
  }
}

describe('ProjectDetailComponent', () => {
  describe('affiche le titre du projet depuis route.data', () => {
    let fixture: ComponentFixture<ProjectDetailComponent>

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectDetailComponent],
        providers: [
          provideRouter([]),
          { provide: I18nService, useClass: MockI18nService },
          { provide: ActivatedRoute, useValue: { data: of({ project: mockProject }) } },
        ],
      }).compileComponents()

      fixture = TestBed.createComponent(ProjectDetailComponent)
      TestBed.tick()
      fixture.detectChanges()
    })

    it('affiche le titre du projet depuis route.data', () => {
      const h1 = fixture.nativeElement.querySelector('h1')
      expect(h1?.textContent?.trim()).toBe('Mon Projet')
    })
  })

  describe('affiche le lien repoGit', () => {
    let fixture: ComponentFixture<ProjectDetailComponent>

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectDetailComponent],
        providers: [
          provideRouter([]),
          { provide: I18nService, useClass: MockI18nService },
          { provide: ActivatedRoute, useValue: { data: of({ project: mockProject }) } },
        ],
      }).compileComponents()

      fixture = TestBed.createComponent(ProjectDetailComponent)
      TestBed.tick()
      fixture.detectChanges()
    })

    it('affiche le lien repoGit', () => {
      const links: NodeListOf<HTMLAnchorElement> = fixture.nativeElement.querySelectorAll('a[href]')
      const repoLink = Array.from(links).find(l => l.getAttribute('href')?.includes('github.com'))
      expect(repoLink?.getAttribute('href')).toBe('https://github.com/user/repo')
    })
  })

  describe('affiche un texte de chargement si pas de données', () => {
    let fixture: ComponentFixture<ProjectDetailComponent>

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectDetailComponent],
        providers: [
          provideRouter([]),
          { provide: I18nService, useClass: MockI18nService },
          { provide: ActivatedRoute, useValue: { data: NEVER } },
        ],
      }).compileComponents()

      fixture = TestBed.createComponent(ProjectDetailComponent)
      TestBed.tick()
      fixture.detectChanges()
    })

    it('affiche un texte de chargement si pas de données', () => {
      const el = fixture.nativeElement.querySelector('p')
      expect(el?.textContent?.trim()).toBe('Chargement...')
    })
  })
})
