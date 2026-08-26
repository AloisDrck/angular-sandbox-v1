import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PortfolioService } from '../../core/services/portfolio.service';
import { I18nService } from '../../core/services/i18n.service';
import { ProjectCardComponent } from '../../shared/components/project-card/project-card';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent],
  templateUrl: './projects.html',
})
export class ProjectsComponent {
  protected i18n = inject(I18nService);
  private portfolioService = inject(PortfolioService);

  private projects = toSignal(this.portfolioService.getProjects(), { initialValue: [] });
  selectedTech = signal<string | null>(null);

  filteredProjects = computed(() =>
    this.projects().filter((p) => !this.selectedTech() || p.techs.includes(this.selectedTech()!)),
  );

  availableTechs = computed(() => [...new Set(this.projects().flatMap((p) => p.techs))].sort());

  selectTech(tech: string | null): void {
    this.selectedTech.set(tech);
  }
}
