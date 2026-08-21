import { CanDeactivateFn } from '@angular/router'
import { ContactComponent } from './contact'

export const canDeactivateContact: CanDeactivateFn<ContactComponent> = (component) => {
  return component.form.pristine || confirm('Quitter ? Votre message sera perdu.')
}
