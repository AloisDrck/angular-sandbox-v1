import { Component, inject } from '@angular/core'
import { I18nService } from '../../../core/services/i18n.service'

@Component({
  selector: 'app-lang-toggle',
  templateUrl: './lang-toggle.html',
})
export class LangToggleComponent {
  protected i18n = inject(I18nService)
}
