import { Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
})
export class AboutComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  protected about = toSignal(this.portfolioService.getAbout())
}
