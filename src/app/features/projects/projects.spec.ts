import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ProjectsComponent } from './projects';
import { Project } from '../../core/models/project.model';

const mockProjects: Project[] = [
  {
    id: 'a-fr',
    slug: 'a',
    title: 'A',
    description: '',
    longDescription: '',
    techs: ['Python', 'FastAPI'],
    repoGit: '',
    year: 2024,
    type: 'academic',
  },
  {
    id: 'b-fr',
    slug: 'b',
    title: 'B',
    description: '',
    longDescription: '',
    techs: ['TypeScript'],
    repoGit: '',
    year: 2023,
    type: 'academic',
  },
];

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.tick();
    httpMock.expectOne('/assets/i18n/fr.json').flush({});
    httpMock.expectOne('http://localhost:3000/projects?lang=fr').flush(mockProjects);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('affiche tous les projets quand aucun filtre sélectionné', () => {
    expect(component.filteredProjects().length).toBe(2);
  });

  it('filtre les projets par technologie', () => {
    component.selectTech('Python');
    expect(component.filteredProjects().length).toBe(1);
    expect(component.filteredProjects()[0].title).toBe('A');
  });

  it('réinitialise le filtre quand selectTech(null) est appelé', () => {
    component.selectTech('Python');
    component.selectTech(null);
    expect(component.filteredProjects().length).toBe(2);
  });
});
