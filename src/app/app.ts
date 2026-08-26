import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from './core/services/i18n.service';
import { LoadingService } from './core/services/loading.service';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle';
import { LangToggleComponent } from './shared/components/lang-toggle/lang-toggle';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ThemeToggleComponent, LangToggleComponent],
  templateUrl: './app.html',
})
export class App {
  protected i18n = inject(I18nService);
  protected loading = inject(LoadingService);
}
