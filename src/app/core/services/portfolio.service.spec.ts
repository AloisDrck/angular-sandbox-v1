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
  techs: ['Python'], repoGit: 'https://github.com/test', year: 2024, type: 'academic'
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
      links: { repoGit: 'gh', gitlab: 'gl', linkedin: 'li' }
    }
    service.getAbout().subscribe(about => expect(about.name).toBe('Test'))
    httpMock.expectOne('http://localhost:3000/about').flush(mockAbout)
  })
})
