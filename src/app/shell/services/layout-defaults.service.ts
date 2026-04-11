import { inject, Injectable } from '@angular/core';
import { PersonaService } from '../../services/persona.service';

interface DashboardKeyPair {
  desktop: string;
  canvas: string;
}

const STATIC_BASES: DashboardKeyPair[] = [
  { desktop: 'dashboard-home-v11', canvas: 'canvas-layout:dashboard-home:v18' },
  { desktop: 'dashboard-home-v14', canvas: 'canvas-layout:dashboard-home:v21' },
  { desktop: 'dashboard-financials:v17', canvas: 'canvas-layout:dashboard-financials:v19' },
  { desktop: 'dashboard-financials:v29', canvas: 'canvas-layout:dashboard-financials:v31' },
  { desktop: 'dashboard-projects:v18', canvas: 'canvas-layout:dashboard-projects:v21' },
];

const PROJECT_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

function projectBases(id: number): DashboardKeyPair {
  return {
    desktop: `project-${id}-v6`,
    canvas: `canvas-layout:project-${id}:v8`,
  };
}

function allDashboardKeys(personaSlug: string): DashboardKeyPair[] {
  const bases = [...STATIC_BASES, ...PROJECT_IDS.map(projectBases)];
  return bases.map(pair => ({
    desktop: `${personaSlug}:${pair.desktop}`,
    canvas: `${personaSlug}:${pair.canvas}`,
  }));
}

@Injectable({ providedIn: 'root' })
export class LayoutDefaultsService {
  private readonly personaService = inject(PersonaService);
  private readonly DESKTOP_SESSION_PREFIX = 'widget-layout:';

  /**
   * For every dashboard that has a persisted session/canvas layout,
   * copies it to the `__customDefaults` localStorage key so it becomes
   * the "Reset Layout" target.
   *
   * Returns the count of dashboards that were saved.
   */
  saveAllVisitedDefaults(): number {
    let count = 0;
    for (const pair of allDashboardKeys(this.personaService.activePersonaSlug())) {
      const desktopSaved = this.saveDesktopDefaults(pair.desktop);
      const canvasSaved = this.saveCanvasDefaults(pair.canvas);
      if (desktopSaved || canvasSaved) count++;
    }
    return count;
  }

  /**
   * Clears ALL custom default overrides across every dashboard,
   * restoring factory code defaults for future resets.
   */
  clearAllDefaults(): void {
    for (const pair of allDashboardKeys(this.personaService.activePersonaSlug())) {
      try { localStorage.removeItem(`${pair.desktop}__customDefaults`); } catch { /* ignore */ }
      try { localStorage.removeItem(`${pair.canvas}__customDefaults`); } catch { /* ignore */ }
    }
  }

  private saveDesktopDefaults(layoutKey: string): boolean {
    const sessionKey = `${this.DESKTOP_SESSION_PREFIX}${layoutKey}:desktop`;
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (!raw) return false;
      const layout = JSON.parse(raw);
      if (!layout || typeof layout !== 'object') return false;
      const snapshot = {
        tops: layout.tops ?? {},
        heights: layout.heights ?? {},
        colStarts: layout.colStarts ?? {},
        colSpans: layout.colSpans ?? {},
        lefts: layout.lefts ?? {},
        widths: layout.widths ?? {},
      };
      localStorage.setItem(`${layoutKey}__customDefaults`, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }

  private saveCanvasDefaults(canvasKey: string): boolean {
    try {
      const raw = localStorage.getItem(canvasKey);
      if (!raw) return false;
      const layout = JSON.parse(raw);
      if (!layout || typeof layout !== 'object') return false;
      localStorage.setItem(`${canvasKey}__customDefaults`, JSON.stringify(layout));
      return true;
    } catch {
      return false;
    }
  }
}
