import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'qm_theme';

  private _theme = new BehaviorSubject<'light' | 'dark'>(
    (localStorage.getItem(this.KEY) as 'light' | 'dark') || 'light'
  );

  theme$ = this._theme.asObservable();
  get theme(): 'light' | 'dark' { return this._theme.value; }

  constructor() {
    // Apply persisted theme immediately on load
    this.applyTheme(this._theme.value);
  }

  toggle(): void {
    const next = this._theme.value === 'light' ? 'dark' : 'light';
    this._theme.next(next);
    localStorage.setItem(this.KEY, next);
    this.applyTheme(next);
  }

  private applyTheme(t: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', t);
  }

  get icon():  string { return this._theme.value === 'dark' ? '☀️' : '🌙'; }
  get label(): string { return this._theme.value === 'dark' ? 'Light mode' : 'Dark mode'; }
}
