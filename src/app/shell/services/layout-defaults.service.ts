import { Injectable } from '@angular/core';

interface DashboardKeyPair {
  desktop: string;
  canvas: string;
}

const STATIC_DASHBOARDS: DashboardKeyPair[] = [
  { desktop: 'dashboard-home-v7', canvas: 'canvas-layout:dashboard-home:v13' },
  { desktop: 'dashboard-financials:v9', canvas: 'canvas-layout:dashboard-financials:v10' },
  { desktop: 'dashboard-projects:v16', canvas: 'canvas-layout:dashboard-projects:v17' },
];

const PROJECT_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

function projectKeys(id: number): DashboardKeyPair {
  return {
    desktop: `project-${id}-v5`,
    canvas: `canvas-layout:project-${id}:v6`,
  };
}

function allDashboardKeys(): DashboardKeyPair[] {
  return [...STATIC_DASHBOARDS, ...PROJECT_IDS.map(projectKeys)];
}

/**
 * Saves/resets custom default layouts for ALL dashboards at once,
 * not just the currently-active page.
 */
@Injectable({ providedIn: 'root' })
export class LayoutDefaultsService {
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
    for (const pair of allDashboardKeys()) {
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
    for (const pair of allDashboardKeys()) {
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
