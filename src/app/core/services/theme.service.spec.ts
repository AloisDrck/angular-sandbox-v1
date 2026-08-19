import { TestBed } from '@angular/core/testing'
import { PLATFORM_ID } from '@angular/core'
import { ThemeService } from './theme.service'

describe('ThemeService', () => {
  function setup(platformId = 'browser', storedTheme: string | null = null) {
    if (storedTheme) {
      localStorage.setItem('theme', storedTheme)
    } else {
      localStorage.removeItem('theme')
    }
    TestBed.configureTestingModule({
      providers: [ThemeService, { provide: PLATFORM_ID, useValue: platformId }]
    })
    return TestBed.inject(ThemeService)
  }

  afterEach(() => localStorage.removeItem('theme'))

  it('démarre en mode light par défaut (pas de préférence sauvegardée)', () => {
    const service = setup('browser', null)
    expect(service.theme()).toBe('light')
  })

  it('lit la préférence sauvegardée en localStorage', () => {
    const service = setup('browser', 'dark')
    expect(service.theme()).toBe('dark')
  })

  it('toggle passe de light à dark', () => {
    const service = setup('browser', 'light')
    service.toggle()
    expect(service.theme()).toBe('dark')
  })

  it('toggle passe de dark à light', () => {
    const service = setup('browser', 'dark')
    service.toggle()
    expect(service.theme()).toBe('light')
  })

  it('applique la classe .dark sur documentElement en mode dark', () => {
    const service = setup('browser', 'dark')
    TestBed.flushEffects()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it("n'applique pas la classe .dark en mode light", () => {
    document.documentElement.classList.add('dark')
    const service = setup('browser', 'light')
    TestBed.flushEffects()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('ne touche pas au DOM côté serveur (platformId = server)', () => {
    expect(() => setup('server', null)).not.toThrow()
  })
})
