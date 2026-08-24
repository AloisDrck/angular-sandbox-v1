import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { canDeactivateContact } from './can-deactivate.guard'
import { ContactComponent } from './contact'
import { I18nService } from '../../core/services/i18n.service'

const mockI18n = {
  lang: signal<'fr' | 'en'>('fr'),
  t: (key: string) => key === 'contact.leaveConfirm' ? 'Quitter ? Votre message sera perdu.' : key,
}

function makeComponent(pristine: boolean) {
  return { form: { pristine } } as unknown as ContactComponent
}

describe('canDeactivateContact', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: I18nService, useValue: mockI18n },
      ],
    })
  })

  it('retourne true si le formulaire est pristine (non modifié)', () => {
    const result = TestBed.runInInjectionContext(() =>
      canDeactivateContact(makeComponent(true), null!, null!, null!)
    )
    expect(result).toBe(true)
  })

  it('retourne false si le formulaire est dirty et confirm est annulé', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const result = TestBed.runInInjectionContext(() =>
      canDeactivateContact(makeComponent(false), null!, null!, null!)
    )
    expect(result).toBe(false)
    vi.restoreAllMocks()
  })

  it('retourne true si le formulaire est dirty et confirm est accepté', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const result = TestBed.runInInjectionContext(() =>
      canDeactivateContact(makeComponent(false), null!, null!, null!)
    )
    expect(result).toBe(true)
    vi.restoreAllMocks()
  })

  it('utilise le message traduit de I18nService', () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    TestBed.runInInjectionContext(() =>
      canDeactivateContact(makeComponent(false), null!, null!, null!)
    )
    expect(spy).toHaveBeenCalledWith('Quitter ? Votre message sera perdu.')
    vi.restoreAllMocks()
  })
})
