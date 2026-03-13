import { Injectable } from '@angular/core';

export interface WidgetLayout {
  tops: Record<string, number>;
  heights: Record<string, number>;
  colStarts: Record<string, number>;
  colSpans: Record<string, number>;
}

@Injectable({
  providedIn: 'root',
})
export class WidgetLayoutService {
  private readonly PREFIX = 'widget-layout:';

  save(dashboardId: string, mobile: boolean, layout: WidgetLayout): void {
    const key = this.PREFIX + dashboardId + (mobile ? ':mobile' : ':desktop');
    try {
      sessionStorage.setItem(key, JSON.stringify(layout));
    } catch { /* quota exceeded or private browsing */ }
  }

  load(dashboardId: string, mobile: boolean): WidgetLayout | null {
    const key = this.PREFIX + dashboardId + (mobile ? ':mobile' : ':desktop');
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
