import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { throwError } from 'rxjs'
import { environment } from '../../../environments/environment'
import { Project } from '../models/project.model'
import { Experience } from '../models/experience.model'
import { Skill } from '../models/skill.model'
import { About } from '../models/about.model'

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private http = inject(HttpClient)
  private base = environment.apiUrl

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/projects`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/projects/${id}`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getExperiences(): Observable<Experience[]> {
    return this.http.get<Experience[]>(`${this.base}/experiences`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.base}/skills`).pipe(
      catchError(err => throwError(() => err))
    )
  }

  getAbout(): Observable<About> {
    return this.http.get<About>(`${this.base}/about`).pipe(
      catchError(err => throwError(() => err))
    )
  }
}
