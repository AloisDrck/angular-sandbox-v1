import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { provideHttpClient } from '@angular/common/http'
import { PortfolioService } from './portfolio.service'
import { I18nService } from './i18n.service'
import { Project } from '../models/project.model'
import { Experience } from '../models/experience.model'
import { Skill } from '../models/skill.model'
import { About } from '../models/about.model'

const mockProject: Project = {
  id: 'treko-fr', slug: 'treko', title: 'Test', description: 'desc', longDescription: 'long',
  techs: ['Python'], repoGit: 'https://github.com/test', year: 2024, type: 'academic'
}

const mockI18n = { lang: signal<'fr' | 'en'>('fr') }

describe('PortfolioService', () => {
  let service: PortfolioService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PortfolioService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: I18nService, useValue: mockI18n },
      ]
    })
    service = TestBed.inject(PortfolioService)
    httpMock = TestBed.inject(HttpTestingController)
    TestBed.tick()  // fire toObservable effect → lang$ émet 'fr'
  })

  afterEach(() => httpMock.verify())

  it('getProjects() appelle GET /projects?lang=fr', () => {
    service.getProjects().subscribe(projects => {
      expect(projects.length).toBe(1)
      expect(projects[0].title).toBe('Test')
    })
    httpMock.expectOne('http://localhost:3000/projects?lang=fr').flush([mockProject])
  })

  it('getProject(slug) appelle GET /projects?slug=treko&lang=fr', () => {
    service.getProject('treko').subscribe(project => {
      expect(project.slug).toBe('treko')
    })
    httpMock.expectOne('http://localhost:3000/projects?slug=treko&lang=fr').flush([mockProject])
  })

  it('getExperiences() appelle GET /experiences?lang=fr', () => {
    const mockExp: Experience = {
      id: '1', role: 'Dev', company: 'Acme', period: '2024', description: 'desc', type: 'academic'
    }
    service.getExperiences().subscribe(exps => expect(exps.length).toBe(1))
    httpMock.expectOne('http://localhost:3000/experiences?lang=fr').flush([mockExp])
  })

  it('getSkills() appelle GET /skills (sans filtre lang)', () => {
    const mockSkill: Skill = { id: '1', name: 'Python', category: 'backend', level: 4 }
    service.getSkills().subscribe(skills => expect(skills.length).toBe(1))
    httpMock.expectOne('http://localhost:3000/skills').flush([mockSkill])
  })

  it('getAbout() appelle GET /about?lang=fr', () => {
    const mockAbout: About = {
      name: 'Test', bio: 'bio', location: 'Paris',
      links: { repoGit: 'gh', gitlab: 'gl', linkedin: 'li' }
    }
    service.getAbout().subscribe(about => expect(about.name).toBe('Test'))
    httpMock.expectOne('http://localhost:3000/about?lang=fr').flush([mockAbout])
  })
})
