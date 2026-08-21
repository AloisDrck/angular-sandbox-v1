import { canDeactivateContact } from './can-deactivate.guard'
import { ContactComponent } from './contact'

describe('canDeactivateContact', () => {
  function makeComponent(pristine: boolean) {
    return { form: { pristine } } as unknown as ContactComponent
  }

  it('retourne true si le formulaire est pristine (non modifié)', () => {
    const result = canDeactivateContact(makeComponent(true), null!, null!, null!)
    expect(result).toBe(true)
  })

  it('retourne false si le formulaire est dirty et confirm est annulé', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const result = canDeactivateContact(makeComponent(false), null!, null!, null!)
    expect(result).toBe(false)
    vi.restoreAllMocks()
  })

  it('retourne true si le formulaire est dirty et confirm est accepté', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const result = canDeactivateContact(makeComponent(false), null!, null!, null!)
    expect(result).toBe(true)
    vi.restoreAllMocks()
  })
})
