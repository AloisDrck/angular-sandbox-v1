import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Project } from '../../../core/models/project.model';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.html',
})
export class ProjectDetailComponent {
  protected i18n = inject(I18nService);
  private route = inject(ActivatedRoute);

  protected project = toSignal(this.route.data.pipe(map((data) => data['project'] as Project)));
}
