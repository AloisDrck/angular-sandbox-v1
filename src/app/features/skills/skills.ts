import { Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { PortfolioService } from '../../core/services/portfolio.service'
import { I18nService } from '../../core/services/i18n.service'
import { Skill } from '../../core/models/skill.model'
import { SkillBadgeComponent } from '../../shared/components/skill-badge/skill-badge'

@Component({
  selector: 'app-skills',
  imports: [SkillBadgeComponent],
  templateUrl: './skills.html',
})
export class SkillsComponent {
  protected i18n = inject(I18nService)
  private portfolioService = inject(PortfolioService)

  private skills = toSignal(this.portfolioService.getSkills(), { initialValue: [] })

  protected groupedSkills = computed(() => {
    const groups = new Map<Skill['category'], Skill[]>()
    for (const skill of this.skills()) {
      const list = groups.get(skill.category) ?? []
      groups.set(skill.category, [...list, skill])
    }
    return groups
  })

  protected categories = computed(() => [...this.groupedSkills().keys()])
}
