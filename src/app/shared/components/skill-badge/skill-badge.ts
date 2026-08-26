import { Component, input } from '@angular/core';
import { Skill } from '../../../core/models/skill.model';

@Component({
  selector: 'app-skill-badge',
  templateUrl: './skill-badge.html',
})
export class SkillBadgeComponent {
  skill = input.required<Skill>();
}
