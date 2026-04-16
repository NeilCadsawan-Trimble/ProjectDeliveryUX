import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, type ThemeName, type ThemeMode } from './theme.service';

export type ViewMode = 'mobile' | 'desktop' | 'canvas';

export interface PersonaTheme {
  theme: ThemeName;
  mode: ThemeMode;
}

export type PersonaViewModeThemes = Record<ViewMode, PersonaTheme>;

export interface Persona {
  slug: string;
  name: string;
  firstName: string;
  title: string;
  email: string;
  company: string;
  initials: string;
  defaultThemes: PersonaViewModeThemes;
}

function buildDefaults(desktop: PersonaTheme): PersonaViewModeThemes {
  return {
    mobile: { theme: 'modus-modern', mode: 'light' },
    desktop,
    canvas: { theme: 'modus-modern', mode: 'dark' },
  };
}

export const PERSONAS: Persona[] = [
  { slug: 'frank', name: 'Frank Mendoza', firstName: 'Frank', title: 'Owner', email: 'frank.mendoza@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'FM', defaultThemes: buildDefaults({ theme: 'modus-modern', mode: 'light' }) },
  { slug: 'bert', name: 'Bert Humphries', firstName: 'Bert', title: 'Project Manager', email: 'bert.humphries@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'BH', defaultThemes: buildDefaults({ theme: 'modus-modern', mode: 'dark' }) },
  { slug: 'kelly', name: 'Kelly Marshall', firstName: 'Kelly', title: 'Office Admin', email: 'kelly.marshall@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'KM', defaultThemes: buildDefaults({ theme: 'modus-modern', mode: 'light' }) },
  { slug: 'dominique', name: 'Dominique Marques', firstName: 'Dominique', title: 'Field Engineer', email: 'dominique.marques@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'DM', defaultThemes: buildDefaults({ theme: 'modus-modern', mode: 'dark' }) },
  { slug: 'pamela', name: 'Pamela Chen', firstName: 'Pamela', title: 'Senior Estimator', email: 'pamela.chen@rockymtncontracting.com', company: 'Rocky Mountain Contracting', initials: 'PC', defaultThemes: buildDefaults({ theme: 'modus-modern', mode: 'light' }) },
];

const PERSONA_MAP = new Map<string, Persona>(PERSONAS.map(p => [p.slug, p]));

const DEFAULT_PERSONA = PERSONAS[0];

const PERSONA_THEME_STORAGE_KEY = 'persona-theme-prefs-v2';

type PerViewModePrefs = Record<string, Partial<Record<ViewMode, PersonaTheme>>>;

@Injectable({ providedIn: 'root' })
export class PersonaService {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);

  private _personaThemePrefs: PerViewModePrefs = {};

  readonly activePersonaSlug = signal<string>(DEFAULT_PERSONA.slug);
  readonly currentViewMode = signal<ViewMode>('desktop');

  /** Set to true when persona changes; consumed by dashboard pages to clear cached layouts. */
  readonly pendingLayoutReset = signal(false);

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

  setViewMode(viewMode: ViewMode): void {
    const prev = this.currentViewMode();
    if (prev === viewMode) return;
    this._saveCurrentPersonaTheme();
    this.currentViewMode.set(viewMode);
    this._applyPersonaTheme(this.activePersonaSlug());
  }

  setActivePersona(slug: string): void {
    if (!PERSONA_MAP.has(slug)) return;
    const prev = this.activePersonaSlug();
    if (prev !== slug) {
      this._saveCurrentPersonaTheme();
      this.pendingLayoutReset.set(true);
    }
    this.activePersonaSlug.set(slug);
    this._applyPersonaTheme(slug);
  }

  switchPersona(targetSlug: string): void {
    if (!PERSONA_MAP.has(targetSlug)) return;
    this._saveCurrentPersonaTheme();
    this.pendingLayoutReset.set(true);
    this.activePersonaSlug.set(targetSlug);
    this._applyPersonaTheme(targetSlug);
    void this.router.navigateByUrl(`/${targetSlug}`);
  }

  /** Called by ThemeService consumers (theme switcher UI) -- updates the active persona's stored pref for the current view mode. */
  onThemeChangedByUser(): void {
    this._saveCurrentPersonaTheme();
  }

  /** Returns true (once) if a layout reset is pending, then clears the flag. */
  consumeLayoutReset(): boolean {
    if (this.pendingLayoutReset()) {
      this.pendingLayoutReset.set(false);
      return true;
    }
    return false;
  }

  getPersonaTheme(slug: string, viewMode?: ViewMode): PersonaTheme {
    const vm = viewMode ?? this.currentViewMode();
    const saved = this._personaThemePrefs[slug]?.[vm];
    if (saved) return saved;
    const persona = PERSONA_MAP.get(slug) ?? DEFAULT_PERSONA;
    return persona.defaultThemes[vm];
  }

  private _saveCurrentPersonaTheme(): void {
    const slug = this.activePersonaSlug();
    const vm = this.currentViewMode();
    if (!this._personaThemePrefs[slug]) {
      this._personaThemePrefs[slug] = {};
    }
    this._personaThemePrefs[slug][vm] = {
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
        const parsed = JSON.parse(raw);
        this._personaThemePrefs = this._migratePrefs(parsed);
      }
    } catch { /* corrupted data -- use defaults */ }
  }

  /** Migrate old flat format { slug: { theme, mode } } to per-view-mode format { slug: { desktop: { theme, mode }, ... } }. */
  private _migratePrefs(data: Record<string, unknown>): PerViewModePrefs {
    const result: PerViewModePrefs = {};
    for (const [slug, value] of Object.entries(data)) {
      if (!value || typeof value !== 'object') continue;
      const rec = value as Record<string, unknown>;
      if ('theme' in rec && 'mode' in rec) {
        const flat = rec as unknown as PersonaTheme;
        result[slug] = { mobile: { ...flat }, desktop: { ...flat }, canvas: { ...flat } };
      } else {
        result[slug] = rec as Partial<Record<ViewMode, PersonaTheme>>;
      }
    }
    return result;
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
