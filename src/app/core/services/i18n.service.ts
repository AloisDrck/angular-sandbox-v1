import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { of, switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http = inject(HttpClient)
  private platformId = inject(PLATFORM_ID)

  lang = signal<'fr' | 'en'>('fr')

  private translations = toSignal(
    toObservable(this.lang).pipe(
      switchMap(lang => {
        if (!isPlatformBrowser(this.platformId)) return of({} as Record<string, string>)
        return this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      })
    ),
    { initialValue: {} as Record<string, string> }
  )

  t(key: string): string {
    return this.translations()[key] ?? key
  }

  setLang(lang: 'fr' | 'en'): void {
    this.lang.set(lang)
  }
}
