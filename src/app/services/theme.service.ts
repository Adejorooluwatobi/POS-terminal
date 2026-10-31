import { Injectable, signal, effect } from '@angular/core';

const THEME_STORAGE_KEY = 'retail_os_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public theme = signal<'dark' | 'light'>('light');

  constructor() {
    const saved = (typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null) as 'dark' | 'light' | null;
    if (saved === 'dark' || saved === 'light') {
      this.theme.set(saved);
    } else if (typeof document !== 'undefined') {
      const currentAttr = document.documentElement.getAttribute('data-theme');
      if (currentAttr === 'light' || currentAttr === 'dark') {
        this.theme.set(currentAttr);
      } else {
        this.theme.set('light');
      }
    } else {
      this.theme.set('light');
    }

    this.applyTheme(this.theme());

    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, current);
        }
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e);
      }
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: 'dark' | 'light') {
    this.theme.set(theme);
  }

  private applyTheme(t: 'dark' | 'light') {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }
}

