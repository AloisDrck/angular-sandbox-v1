import { inject, Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { switchMap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class I18nService {
  private http = inject(HttpClient)

  lang = signal<'fr' | 'en'>('fr')

  private translations = toSignal(
    toObservable(this.lang).pipe(
      switchMap(lang =>
        this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
      )
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
