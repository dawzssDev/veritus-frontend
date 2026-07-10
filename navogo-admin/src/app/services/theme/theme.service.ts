import { Injectable, signal, effect } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'navogo-theme';
const DARK_CLASS = 'tema-oscuro';

const LIGHT_VARS: Record<string, string> = {
  '--color-bg-app': '#fafaf8',
  '--color-bg-surface': '#FFFFFF',
  '--color-bg-surface-2': '#F9FAFB',
  '--color-bg-surface-3': '#F3F4F6',
  '--color-border': '#E5E3DF',
  '--color-border-2': '#E5E7EB',
  '--color-text-primary': '#1A1A11',
  '--color-text-secondary': '#374151',
  '--color-text-muted': '#6B7280',
  '--color-text-faint': '#9CA3AF',
  '--color-brand': '#0F4D2A',
  '--color-brand-light': 'rgba(15, 77, 42, 0.08)',
  '--color-brand-border': 'rgba(15, 77, 42, 0.20)',
  '--color-success': '#16a34a',
  '--color-success-bg': '#f0fdf4',
  '--color-error': '#dc2626',
  '--color-error-bg': '#fef2f2',
  '--color-warning': '#d97706',
  '--color-warning-bg': '#fffbeb',
  '--shadow-card': '0 1px 4px rgba(0,0,0,0.06)',
  '--shadow-popup': '0 8px 24px rgba(0,0,0,0.12)',
  '--card-shadow': '0 2px 12px rgba(0, 0, 0, 0.08)',
  '--card-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
  '--notes-bg': '#FEF9C3',
  '--notes-border': '#F59E0B',
  '--notes-text': '#92400E',
  '--sidebar-bg': '#e8f5e9',
  '--sidebar-border': '#c8e6c9',
  '--sidebar-text': '#2e7d32',
  '--sidebar-text-muted': '#66bb6a',
  '--sidebar-hover': '#dcedc8',
  '--sidebar-hover-text': '#1b5e20',
  '--sidebar-active-bg': '#1b5e20',
  '--sidebar-active-fg': '#ffffff',
  '--sidebar-active-hover': '#2d2d23',
  '--sidebar-footer-bg': '#dcedc8',
  '--sidebar-logo-text': '#1b5e20',
  '--sidebar-submenu-active-bg': 'rgba(26, 26, 17, 0.07)',
  '--sidebar-scrollbar-hover': '#d5d0c8',
};

const DARK_VARS: Record<string, string> = {
  '--color-bg-app': '#0F1117',
  '--color-bg-surface': '#1A1D27',
  '--color-bg-surface-2': '#21252F',
  '--color-bg-surface-3': '#282C38',
  '--color-border': '#2E3340',
  '--color-border-2': '#363B48',
  '--color-text-primary': '#F0EFE9',
  '--color-text-secondary': '#C9C8C0',
  '--color-text-muted': '#8B8F9A',
  '--color-text-faint': '#9AA3B2',
  '--color-brand': '#2ECC71',
  '--color-brand-light': 'rgba(46, 204, 113, 0.10)',
  '--color-brand-border': 'rgba(46, 204, 113, 0.25)',
  '--color-success': '#2ECC71',
  '--color-success-bg': 'rgba(46,204,113,0.10)',
  '--color-error': '#F87171',
  '--color-error-bg': 'rgba(248,113,113,0.10)',
  '--color-warning': '#FBBF24',
  '--color-warning-bg': 'rgba(251,191,36,0.10)',
  '--shadow-card': '0 1px 4px rgba(0,0,0,0.30)',
  '--shadow-popup': '0 8px 32px rgba(0,0,0,0.50)',
  '--card-shadow': '0 2px 12px rgba(0, 0, 0, 0.45)',
  '--card-shadow-hover': '0 8px 24px rgba(0, 0, 0, 0.55)',
  '--notes-bg': '#3d3420',
  '--notes-border': '#b45309',
  '--notes-text': '#fde68a',
  '--sidebar-bg': '#0F2419',
  '--sidebar-border': '#1A4D30',
  '--sidebar-text': '#A8D5C0',
  '--sidebar-text-muted': '#5DB87A',
  '--sidebar-hover': '#163D28',
  '--sidebar-hover-text': '#C8E6C9',
  '--sidebar-active-bg': '#1B5E20',
  '--sidebar-active-fg': '#FFFFFF',
  '--sidebar-active-hover': '#2E7D32',
  '--sidebar-footer-bg': '#0A1A12',
  '--sidebar-logo-text': '#C8E6C9',
  '--sidebar-submenu-active-bg': 'rgba(255, 255, 255, 0.08)',
  '--sidebar-scrollbar-hover': '#2A5C40',
};

/**
 * Gestiona el tema claro/oscuro de la aplicación.
 * El sidebar usa un verde más oscuro en modo oscuro.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly _theme = signal<AppTheme>(this.readInitialTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      this.applyTheme(this._theme());
    });
  }

  isDark(): boolean {
    return this._theme() === 'dark';
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: AppTheme): void {
    this._theme.set(theme);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  }

  private get isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private readInitialTheme(): AppTheme {
    if (!this.isBrowser) {
      return 'light';
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }

    return 'light';
  }

  private applyTheme(theme: AppTheme): void {
    if (!this.isBrowser) {
      return;
    }

    const isDark = theme === 'dark';
    const root = document.documentElement;
    root.classList.toggle(DARK_CLASS, isDark);
    document.body?.classList.toggle(DARK_CLASS, isDark);
    root.style.colorScheme = theme;

    // Inline vars garantizan el tema aunque el cascade CSS falle
    const vars = isDark ? DARK_VARS : LIGHT_VARS;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }
}
