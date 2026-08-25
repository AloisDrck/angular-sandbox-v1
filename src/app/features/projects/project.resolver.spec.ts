import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing'
import { ActivatedRouteSnapshot, convertToParamMap } from '@angular/router'
import { TransferState } from '@angular/core'
import { Observable, firstValueFrom } from 'rxjs'
import { projectResolver, PROJECT_KEY } from './project.resolver'
import { PortfolioService } from '../../core/services/portfolio.service'
import { Project } from '../../core/models/project.model'

const mockProject: Project = {
  id: '42',
  title: 'Test',
  description: '',
  longDescription: '',
  techs: [],
  repoGit: 'https://github.com/test/test',
  year: 2024,
  type: 'personal',
}

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
      ],
    })

    transferState = TestBed.inject(TransferState)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpMock.verify())

  it('retourne le projet depuis TransferState si disponible (cache hit)', () => {
    transferState.set(PROJECT_KEY, mockProject)

    const result = TestBed.runInInjectionContext(() => {
      const route = makeRoute('42')
      return projectResolver(route, {} as never)
    })

    expect(result).toEqual(mockProject)
    expect(transferState.hasKey(PROJECT_KEY)).toBe(false)
    httpMock.expectNone('http://localhost:3000/projects/42')
  })

  it('appelle PortfolioService et stocke dans TransferState (cache miss)', async () => {
    const result$ = TestBed.runInInjectionContext(() => {
      const route = makeRoute('42')
      return projectResolver(route, {} as never) as Observable<Project>
    })

    const resultPromise = firstValueFrom(result$)
    httpMock.expectOne('http://localhost:3000/projects/42').flush(mockProject)

    const result = await resultPromise

    expect(result).toEqual(mockProject)
    expect(transferState.get(PROJECT_KEY, null)).toEqual(mockProject)
  })
})
