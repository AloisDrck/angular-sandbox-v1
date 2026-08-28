import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ProjectCardComponent } from './project-card';
import { I18nService } from '../../../core/services/i18n.service';
import { Project } from '../../../core/models/project.model';

const mockProject: Project = {
  id: 'treko-fr',
  slug: 'treko',
  title: 'Projet Treko',
  description: 'Module de tracking sportif',
  longDescription: 'Long desc',
  techs: ['React Native', 'Node.js'],
  repoGit: 'https://gitlab.com/test',
  year: 2025,
  type: 'academic',
};

const mockI18n = {
  lang: signal<'fr' | 'en'>('fr'),
  t: (key: string) => {
    const map: Record<string, string> = {
      'projects.viewProject': 'Voir le projet',
      'projects.type.academic': 'Académique',
    };
    return map[key] ?? key;
  },
};

describe('ProjectCardComponent', () => {
  let fixture: ComponentFixture<ProjectCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCardComponent],
      providers: [provideRouter([]), { provide: I18nService, useValue: mockI18n }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectCardComponent);
    fixture.componentRef.setInput('project', mockProject);
    TestBed.tick();
    fixture.detectChanges();
  });

  it('affiche le titre du projet sur la face avant', () => {
    const front = fixture.nativeElement.querySelector('.face.front');
    expect(front?.textContent).toContain('Projet Treko');
  });

  it('affiche le badge de type traduit sur la face avant', () => {
    const front = fixture.nativeElement.querySelector('.face.front');
    expect(front?.textContent).toContain('Académique');
  });

  it('affiche toutes les techs sur la face arrière', () => {
    const back = fixture.nativeElement.querySelector('.face.back');
    expect(back?.textContent).toContain('React Native');
    expect(back?.textContent).toContain('Node.js');
  });

  it('le bouton CTA de la face arrière pointe vers le bon slug', () => {
    const cta: HTMLAnchorElement = fixture.nativeElement.querySelector('.face.back a[href]');
    expect(cta?.getAttribute('href')).toContain('treko');
  });

  it('a la structure flip-scene > flipper > face', () => {
    const scene = fixture.nativeElement.querySelector('.flip-scene');
    const flipper = scene?.querySelector('.flipper');
    expect(flipper).toBeTruthy();
    expect(flipper?.querySelector('.face.front')).toBeTruthy();
    expect(flipper?.querySelector('.face.back')).toBeTruthy();
  });
});
