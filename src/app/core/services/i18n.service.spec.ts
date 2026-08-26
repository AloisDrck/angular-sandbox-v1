import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [I18nService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(I18nService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('démarre avec la langue fr', () => {
    expect(service.lang()).toBe('fr');
  });

  it('charge les traductions FR au démarrage et retourne le bon label', () => {
    TestBed.tick();
    const req = httpMock.expectOne('/assets/i18n/fr.json');
    req.flush({ 'nav.about': 'À propos' });
    expect(service.t('nav.about')).toBe('À propos');
  });

  it('retourne la clé si la traduction est absente', () => {
    TestBed.tick();
    const req = httpMock.expectOne('/assets/i18n/fr.json');
    req.flush({});
    expect(service.t('clé.inconnue')).toBe('clé.inconnue');
  });

  it('recharge les traductions EN quand setLang("en") est appelé', () => {
    TestBed.tick();
    httpMock.expectOne('/assets/i18n/fr.json').flush({ 'nav.about': 'À propos' });
    service.setLang('en');
    TestBed.tick();
    const req = httpMock.expectOne('/assets/i18n/en.json');
    req.flush({ 'nav.about': 'About' });
    expect(service.lang()).toBe('en');
    expect(service.t('nav.about')).toBe('About');
  });
});
