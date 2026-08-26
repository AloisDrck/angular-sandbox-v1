import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { SkillsComponent } from './skills';
import { Skill } from '../../core/models/skill.model';

const MOCK_SKILLS: Skill[] = [
  { id: '1', name: 'TypeScript', category: 'frontend', level: 5 },
  { id: '2', name: 'Angular', category: 'frontend', level: 4 },
  { id: '3', name: 'Node.js', category: 'backend', level: 3 },
];

describe('SkillsComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SkillsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('skills vide par défaut avant la réponse HTTP', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    const component = fixture.componentInstance;
    TestBed.tick();
    httpMock.expectOne('/assets/i18n/fr.json').flush({});
    // Skills request is still in flight: groupedSkills uses initialValue []
    expect(component['groupedSkills']().size).toBe(0);
    // Clean up the open skills request so verify() passes
    httpMock.expectOne('http://localhost:3000/skills').flush([]);
  });

  it('affiche toutes les catégories présentes dans les données', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    const component = fixture.componentInstance;
    TestBed.tick();
    httpMock.expectOne('/assets/i18n/fr.json').flush({});
    httpMock.expectOne('http://localhost:3000/skills').flush(MOCK_SKILLS);
    TestBed.tick();
    const cats = component['categories']();
    expect(cats).toContain('frontend');
    expect(cats).toContain('backend');
    expect(cats.length).toBe(2);
  });

  it('groupe les skills par catégorie', () => {
    const fixture = TestBed.createComponent(SkillsComponent);
    const component = fixture.componentInstance;
    TestBed.tick();
    httpMock.expectOne('/assets/i18n/fr.json').flush({});
    httpMock.expectOne('http://localhost:3000/skills').flush(MOCK_SKILLS);
    TestBed.tick();
    const backendSkills = component['groupedSkills']().get('backend');
    expect(backendSkills).toBeDefined();
    expect(backendSkills?.length).toBe(1);
    expect(backendSkills?.[0].name).toBe('Node.js');
    const frontendSkills = component['groupedSkills']().get('frontend');
    expect(frontendSkills?.length).toBe(2);
  });
});
