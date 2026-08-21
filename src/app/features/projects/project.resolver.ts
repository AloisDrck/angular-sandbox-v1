import { inject } from '@angular/core'
import { ResolveFn } from '@angular/router'
import { TransferState, makeStateKey } from '@angular/core'
import { tap } from 'rxjs'
import { Project } from '../../core/models/project.model'
import { PortfolioService } from '../../core/services/portfolio.service'

export const PROJECT_KEY = makeStateKey<Project>('project')

export const projectResolver: ResolveFn<Project> = (route) => {
  const portfolioService = inject(PortfolioService)
  const transferState = inject(TransferState)
  const id = route.paramMap.get('id')!

  const cached = transferState.get(PROJECT_KEY, null)
  if (cached) {
    transferState.remove(PROJECT_KEY)
    return cached
  }

  return portfolioService.getProject(id).pipe(
    tap(project => transferState.set(PROJECT_KEY, project))
  )
}
