import { effect, inject, Injectable, PLATFORM_ID, signal, WritableSignal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  theme: WritableSignal<'light' | 'dark'>;

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);
    const stored = isBrowser ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null;
    const preferred =
      isBrowser &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';

    this.theme = signal(stored ?? preferred);

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.classList.toggle('dark', this.theme() === 'dark');
        localStorage.setItem('theme', this.theme());
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
