import { Injectable } from '@angular/core';
import { PERSONAS } from '../../services/persona.service';
import { readJson, removeJson, writeJson } from '../../shared/storage/json-local-storage';
import { getAllDashboardKeys, type DashboardKeyPair } from './layout-keys';

interface DesktopLayoutSnapshot {
  tops?: Record<string, number>;
  heights?: Record<string, number>;
  colStarts?: Record<string, number>;
  colSpans?: Record<string, number>;
  lefts?: Record<string, number>;
  widths?: Record<string, number>;
}

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
    for (const pair of this._allKeysAcrossAllPersonas()) {
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
    for (const pair of this._allKeysAcrossAllPersonas()) {
      removeJson(`${pair.desktop}__customDefaults`);
      removeJson(`${pair.canvas}__customDefaults`);
    }
  }

  private _allKeysAcrossAllPersonas(): DashboardKeyPair[] {
    // Previous implementations only iterated the active persona, which meant
    // "Save all visited defaults" missed layouts the user had customised under
    // a different persona in the same browser profile. Walking every known
    // persona is cheap and matches the global intent of the menu action.
    return PERSONAS.flatMap(p => getAllDashboardKeys(p.slug));
  }

  private saveDesktopDefaults(layoutKey: string): boolean {
    // Desktop layouts moved to localStorage; fall back to sessionStorage for
    // users mid-migration so "Save All Visited Defaults" still picks them up.
    const storageKey = `${this.DESKTOP_SESSION_PREFIX}${layoutKey}:desktop`;
    let layout = readJson<DesktopLayoutSnapshot>(storageKey);
    if (!layout) {
      try {
        const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
        layout = raw ? (JSON.parse(raw) as DesktopLayoutSnapshot) : null;
      } catch {
        return false;
      }
    }
    if (!layout || typeof layout !== 'object') return false;
    const snapshot: Required<DesktopLayoutSnapshot> = {
      tops: layout.tops ?? {},
      heights: layout.heights ?? {},
      colStarts: layout.colStarts ?? {},
      colSpans: layout.colSpans ?? {},
      lefts: layout.lefts ?? {},
      widths: layout.widths ?? {},
    };
    return writeJson(`${layoutKey}__customDefaults`, snapshot);
  }

  private saveCanvasDefaults(canvasKey: string): boolean {
    const layout = readJson<unknown>(canvasKey);
    if (!layout || typeof layout !== 'object') return false;
    return writeJson(`${canvasKey}__customDefaults`, layout);
  }
}
