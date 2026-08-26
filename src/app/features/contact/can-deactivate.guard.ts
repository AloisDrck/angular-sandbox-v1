import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';
import { ContactComponent } from './contact';

export const canDeactivateContact: CanDeactivateFn<ContactComponent> = (component) => {
  const i18n = inject(I18nService);
  return component.form.pristine || confirm(i18n.t('contact.leaveConfirm'));
};
