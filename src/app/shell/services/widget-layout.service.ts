import { Injectable } from '@angular/core';

export interface WidgetLayout {
  tops: Record<string, number>;
  heights: Record<string, number>;
  colStarts: Record<string, number>;
  colSpans: Record<string, number>;
  lefts?: Record<string, number>;
  widths?: Record<string, number>;
}

/**
 * Persists per-page desktop / mobile widget layouts to `localStorage` so they
 * survive tab close (canvas mode already lives in localStorage via the engine).
 *
 * One-time migration: reads fall back to `sessionStorage` once if localStorage
 * is empty, then copy forward. This avoids blowing away users' in-progress
 * session work on the upgrade.
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetLayoutService {
  private readonly PREFIX = 'widget-layout:';

  private keyFor(dashboardId: string, mobile: boolean): string {
    return this.PREFIX + dashboardId + (mobile ? ':mobile' : ':desktop');
  }

  save(dashboardId: string, mobile: boolean, layout: WidgetLayout): void {
    const key = this.keyFor(dashboardId, mobile);
    try {
      localStorage.setItem(key, JSON.stringify(layout));
    } catch { /* quota exceeded or private browsing */ }
  }

  remove(dashboardId: string, mobile: boolean): void {
    const key = this.keyFor(dashboardId, mobile);
    try {
      localStorage.removeItem(key);
    } catch { /* private browsing */ }
    try {
      sessionStorage.removeItem(key);
    } catch { /* private browsing */ }
  }

  load(dashboardId: string, mobile: boolean): WidgetLayout | null {
    const key = this.keyFor(dashboardId, mobile);
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      return null;
    }
    return this.migrateFromSession(key);
  }

  /**
   * Transparent one-time migration: if a pre-existing sessionStorage copy is
   * found (older builds wrote there), copy it into localStorage so subsequent
   * reads/writes are homogeneous, then drop the session copy.
   */
  private migrateFromSession(key: string): WidgetLayout | null {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as WidgetLayout;
      try { localStorage.setItem(key, raw); } catch { /* quota */ }
      try { sessionStorage.removeItem(key); } catch { /* private browsing */ }
      return parsed;
    } catch {
      return null;
    }
  }
}
