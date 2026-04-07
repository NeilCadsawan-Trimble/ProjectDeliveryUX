import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, type ThemeName, type ThemeMode } from './theme.service';

export interface PersonaTheme {
  theme: ThemeName;
  mode: ThemeMode;
}

export interface Persona {
  slug: string;
  name: string;
  firstName: string;
  email: string;
  company: string;
  initials: string;
  defaultTheme: PersonaTheme;
}

export const PERSONAS: Persona[] = [
  { slug: 'frank', name: 'Frank Mendoza', firstName: 'Frank', email: 'frank.mendoza@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'FM', defaultTheme: { theme: 'modus-modern', mode: 'light' } },
  { slug: 'bert', name: 'Bert Humphries', firstName: 'Bert', email: 'bert.humphries@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'BH', defaultTheme: { theme: 'modus-classic', mode: 'dark' } },
  { slug: 'kelly', name: 'Kelly Marshall', firstName: 'Kelly', email: 'kelly.marshall@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'KM', defaultTheme: { theme: 'connect', mode: 'light' } },
  { slug: 'dominique', name: 'Dominique Marques', firstName: 'Dominique', email: 'dominique.marques@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'DM', defaultTheme: { theme: 'modus-modern', mode: 'dark' } },
];

const PERSONA_MAP = new Map<string, Persona>(PERSONAS.map(p => [p.slug, p]));

const DEFAULT_PERSONA = PERSONAS[0];

const PERSONA_THEME_STORAGE_KEY = 'persona-theme-prefs';

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  private _personaThemePrefs: Record<string, PersonaTheme> = {};

  readonly activePersonaSlug = signal<string>(DEFAULT_PERSONA.slug);

  readonly activePersona = computed<Persona>(() =>
    PERSONA_MAP.get(this.activePersonaSlug()) ?? DEFAULT_PERSONA,
  );

  readonly userCard = computed(() => ({
    name: this.activePersona().name,
    email: this.activePersona().email,
  }));

  constructor() {
    this._loadThemePrefs();
  }

  setActivePersona(slug: string): void {
    if (!PERSONA_MAP.has(slug)) return;
    const prev = this.activePersonaSlug();
    if (prev !== slug) this._saveCurrentPersonaTheme();
    this.activePersonaSlug.set(slug);
    this._applyPersonaTheme(slug);
  }

  switchPersona(targetSlug: string): void {
    if (!PERSONA_MAP.has(targetSlug)) return;
    this._saveCurrentPersonaTheme();
    this.activePersonaSlug.set(targetSlug);
    this._applyPersonaTheme(targetSlug);
    void this.router.navigateByUrl(`/${targetSlug}`);
  }

  /** Called by ThemeService consumers (theme switcher UI) -- updates the active persona's stored pref. */
  onThemeChangedByUser(): void {
    this._saveCurrentPersonaTheme();
  }

  getPersonaTheme(slug: string): PersonaTheme {
    return this._personaThemePrefs[slug]
      ?? PERSONA_MAP.get(slug)?.defaultTheme
      ?? DEFAULT_PERSONA.defaultTheme;
  }

  private _saveCurrentPersonaTheme(): void {
    const slug = this.activePersonaSlug();
    this._personaThemePrefs[slug] = {
      theme: this.themeService.theme(),
      mode: this.themeService.mode(),
    };
    this._persistThemePrefs();
  }

  private _applyPersonaTheme(slug: string): void {
    const pref = this.getPersonaTheme(slug);
    this.themeService.setTheme(pref.theme, pref.mode);
  }

  private _loadThemePrefs(): void {
    try {
      const raw = localStorage.getItem(PERSONA_THEME_STORAGE_KEY);
      if (raw) {
        this._personaThemePrefs = JSON.parse(raw);
      }
    } catch { /* corrupted data -- use defaults */ }
  }

  private _persistThemePrefs(): void {
    try {
      localStorage.setItem(PERSONA_THEME_STORAGE_KEY, JSON.stringify(this._personaThemePrefs));
    } catch { /* quota exceeded */ }
  }

  static isValidPersona(slug: string): boolean {
    return PERSONA_MAP.has(slug);
  }
}
