import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing'
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router'
import { TransferState } from '@angular/core'
import { Observable, firstValueFrom } from 'rxjs'
import { projectResolver, PROJECT_KEY } from './project.resolver'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'
import { Project } from '../../core/models/project.model'

const mockProject: Project = {
  id: 'treko-fr',
  slug: 'treko',
  title: 'Test',
  description: '',
  longDescription: '',
  techs: [],
  repoGit: 'https://github.com/test/test',
  year: 2024,
  type: 'personal',
}

const mockI18n = { lang: signal<'fr' | 'en'>('fr') }

function makeRoute(id: string): ActivatedRouteSnapshot {
  const route = new ActivatedRouteSnapshot()
  Object.defineProperty(route, 'paramMap', {
    get: () => convertToParamMap({ id }),
  })
  return route
}

describe('projectResolver', () => {
  let transferState: TransferState
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TransferState,
        PortfolioService,
        { provide: I18nService, useValue: mockI18n },
      ],
    })

    transferState = TestBed.inject(TransferState)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('retourne le projet depuis TransferState si disponible (cache hit)', () => {
    transferState.set(PROJECT_KEY, mockProject)

    const result = TestBed.runInInjectionContext(() => {
      const route = makeRoute('treko')
      return projectResolver(route, {} as never)
    })

    expect(result).toEqual(mockProject)
    expect(transferState.hasKey(PROJECT_KEY)).toBe(false)
  })

  it('appelle PortfolioService et stocke dans TransferState (cache miss)', async () => {
    const result$ = TestBed.runInInjectionContext(() => {
      const route = makeRoute('treko')
      return projectResolver(route, {} as never) as Observable<Project>
    })

    const resultPromise = firstValueFrom(result$)
    TestBed.tick()  // fire toObservable effect → lang$ émet 'fr' → switchMap déclenche la requête
    httpMock.expectOne('http://localhost:3000/projects?slug=treko&lang=fr').flush([mockProject])

    const result = await resultPromise

    expect(result).toEqual(mockProject)
    expect(transferState.get(PROJECT_KEY, null)).toEqual(mockProject)
  })
})
