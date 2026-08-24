import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { catchError, map, switchMap } from 'rxjs/operators'
import { throwError } from 'rxjs'
import { toObservable } from '@angular/core/rxjs-interop'
import { environment } from '../../../environments/environment'
import { Project } from '../models/project.model'
import { Experience } from '../models/experience.model'
import { Skill } from '../models/skill.model'
import { About } from '../models/about.model'
import { I18nService } from './i18n.service'

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient)
  private base = environment.apiUrl
  private lang$ = toObservable(inject(I18nService).lang)

  getAbout(): Observable<About> {
    return this.lang$.pipe(
      switchMap(lang =>
        this.http.get<About[]>(`${this.base}/about?lang=${lang}`).pipe(
          map(items => items[0]),
          catchError(err => throwError(() => err))
        )
      )
    )
  }

  getProjects(): Observable<Project[]> {
    return this.lang$.pipe(
      switchMap(lang =>
        this.http.get<Project[]>(`${this.base}/projects?lang=${lang}`).pipe(
          catchError(err => throwError(() => err))
        )
      )
    )
  }

  getProject(slug: string): Observable<Project> {
    return this.lang$.pipe(
      switchMap(lang =>
        this.http.get<Project[]>(`${this.base}/projects?slug=${slug}&lang=${lang}`).pipe(
          map(items => items[0]),
          catchError(err => throwError(() => err))
        )
      )
    )
  }

  getExperiences(): Observable<Experience[]> {
    return this.lang$.pipe(
      switchMap(lang =>
        this.http.get<Experience[]>(`${this.base}/experiences?lang=${lang}`).pipe(
          catchError(err => throwError(() => err))
        )
      )
    )
  }

  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.base}/skills`).pipe(
      catchError(err => throwError(() => err))
    )
  }
}
