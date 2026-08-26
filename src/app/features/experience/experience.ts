import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PortfolioService } from '../../core/services/portfolio.service';
import { I18nService } from '../../core/services/i18n.service';
import { TimelineItemComponent } from '../../shared/components/timeline-item/timeline-item';

@Component({
  selector: 'app-experience',
  imports: [TimelineItemComponent],
  templateUrl: './experience.html',
})
export class ExperienceComponent {
  protected i18n = inject(I18nService);
  private portfolioService = inject(PortfolioService);

  protected experiences = toSignal(this.portfolioService.getExperiences(), { initialValue: [] });
}
