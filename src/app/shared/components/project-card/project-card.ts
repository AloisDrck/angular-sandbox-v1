import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../../../core/models/project.model';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink],
  templateUrl: './project-card.html',
})
export class ProjectCardComponent {
  project = input.required<Project>();
  protected i18n = inject(I18nService);
}
