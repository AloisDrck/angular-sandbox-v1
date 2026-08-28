import { Component, inject, input } from '@angular/core';
import { Experience } from '../../../core/models/experience.model';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-timeline-item',
  templateUrl: './timeline-item.html',
  host: { class: 'block' },
})
export class TimelineItemComponent {
  experience = input.required<Experience>();
  protected i18n = inject(I18nService);
}
