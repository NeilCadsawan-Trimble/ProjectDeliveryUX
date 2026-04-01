import { signal, computed, type WritableSignal } from '@angular/core';
import type { Rfi, Submittal, RfiStatus, SubmittalStatus, DailyReport, Inspection, PunchListItem, ChangeOrder, Contract } from '../../data/dashboard-data';
import type { DrawingTile, SiteCapture } from '../../data/drawings-data';

export type DetailView =
  | { type: 'rfi'; item: Rfi }
  | { type: 'submittal'; item: Submittal }
  | { type: 'drawing'; item: DrawingTile }
  | { type: 'dailyReport'; item: DailyReport }
  | { type: 'inspection'; item: Inspection }
  | { type: 'punchItem'; item: PunchListItem }
  | { type: 'changeOrder'; item: ChangeOrder }
  | { type: 'contract'; item: Contract }
  | { type: 'panorama'; item: SiteCapture };

export interface LayoutSnapshot {
  tops: Record<string, number>;
  lefts: Record<string, number>;
  widths: Record<string, number>;
  heights: Record<string, number>;
}

export interface CanvasDetailEngine {
  widgetTops: WritableSignal<Record<string, number>>;
  widgetLefts: WritableSignal<Record<string, number>>;
  widgetPixelWidths: WritableSignal<Record<string, number>>;
  widgetHeights: WritableSignal<Record<string, number>>;
  widgetLocked: () => Record<string, boolean>;
  pushFromWidget: (widgetId: string) => void;
}

const DETAIL_WIDTH = 800;
const DETAIL_HEIGHT = 1000;
const TRANSITION_MS = 350;
const SNAP_GAP = 16;
const SNAP_H_STEP = 81;

/**
 * Manages canvas detail overlays -- opening RFI/Submittal details on top of
 * existing widgets, with drag, resize, close, baseline restore, and field updates.
 * Shared between home-page and project-dashboard.
 */
export class CanvasDetailManager {
  readonly canvasDetailViews = signal<Record<string, DetailView>>({});
  readonly hasCanvasDetails = computed(() => Object.keys(this.canvasDetailViews()).length > 0);
  readonly canvasInteractingId = signal<string | null>(null);
  zoomFn: () => number = () => 1;

  /**
   * Whether the given widget should have the smooth position transition.
   * Returns false during any active drag to prevent visual overlap lag.
   * Use this in templates instead of manually assembling the condition.
   */
  shouldTransition(widgetId: string, moveTargetId: string | null): boolean {
    return this.hasCanvasDetails() && !moveTargetId && this.canvasInteractingId() !== widgetId;
  }

  private _originalRects: Record<string, { top: number; left: number; width: number; height: number }> = {};
  private _baselineSnapshot: LayoutSnapshot | null = null;

  openDetail(
    sourceWidgetId: string,
    detail: DetailView,
    engine: CanvasDetailEngine,
    size?: { width: number; height: number },
  ): void {
    if (!this._baselineSnapshot) {
      this._baselineSnapshot = {
        tops: { ...engine.widgetTops() },
        lefts: { ...engine.widgetLefts() },
        widths: { ...engine.widgetPixelWidths() },
        heights: { ...engine.widgetHeights() },
      };
    }

    this._originalRects[sourceWidgetId] = {
      top: engine.widgetTops()[sourceWidgetId] ?? 0,
      left: engine.widgetLefts()[sourceWidgetId] ?? 0,
      width: engine.widgetPixelWidths()[sourceWidgetId] ?? 400,
      height: engine.widgetHeights()[sourceWidgetId] ?? 340,
    };
    this.canvasDetailViews.update(v => ({ ...v, [sourceWidgetId]: detail }));

    const targetW = size?.width ?? DETAIL_WIDTH;
    const targetH = size?.height ?? DETAIL_HEIGHT;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        engine.widgetPixelWidths.update(w => ({ ...w, [sourceWidgetId]: targetW }));
        engine.widgetHeights.update(h => ({ ...h, [sourceWidgetId]: targetH }));
        engine.pushFromWidget(sourceWidgetId);
      });
    });
  }

  headerMouseDown(event: MouseEvent, widgetId: string, engine: CanvasDetailEngine): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startTop = engine.widgetTops()[widgetId] ?? 0;
    const startLeft = engine.widgetLefts()[widgetId] ?? 0;
    this.canvasInteractingId.set(widgetId);

    const zFn = this.zoomFn;
    const onMove = (e: MouseEvent) => {
      const z = zFn();
      const rawTop = startTop + (e.clientY - startY) / z;
      const rawLeft = startLeft + (e.clientX - startX) / z;
      const newTop = Math.round(rawTop / SNAP_GAP) * SNAP_GAP;
      const newLeft = Math.round(rawLeft / SNAP_H_STEP) * SNAP_H_STEP;
      engine.widgetTops.update(t => ({ ...t, [widgetId]: newTop }));
      engine.widgetLefts.update(l => ({ ...l, [widgetId]: newLeft }));
      engine.pushFromWidget(widgetId);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.canvasInteractingId.set(null);
      engine.pushFromWidget(widgetId);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  resizeMouseDown(event: MouseEvent, widgetId: string, engine: CanvasDetailEngine): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startW = engine.widgetPixelWidths()[widgetId] ?? DETAIL_WIDTH;
    const startH = engine.widgetHeights()[widgetId] ?? DETAIL_HEIGHT;
    this.canvasInteractingId.set(widgetId);

    const zFnR = this.zoomFn;
    const onMove = (e: MouseEvent) => {
      const z = zFnR();
      const rawW = Math.max(400, startW + (e.clientX - startX) / z);
      const rawH = Math.max(300, startH + (e.clientY - startY) / z);
      const newW = Math.round((rawW + SNAP_GAP) / SNAP_H_STEP) * SNAP_H_STEP - SNAP_GAP;
      const newH = Math.round(rawH / SNAP_GAP) * SNAP_GAP;
      engine.widgetPixelWidths.update(w => ({ ...w, [widgetId]: Math.max(400, newW) }));
      engine.widgetHeights.update(h => ({ ...h, [widgetId]: Math.max(300, newH) }));
      engine.pushFromWidget(widgetId);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.canvasInteractingId.set(null);
      engine.pushFromWidget(widgetId);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  closeDetail(widgetId: string, engine: CanvasDetailEngine, allWidgetIds: string[]): void {
    const orig = this._originalRects[widgetId];
    if (!orig) return;

    engine.widgetTops.update(t => ({ ...t, [widgetId]: orig.top }));
    engine.widgetLefts.update(l => ({ ...l, [widgetId]: orig.left }));
    engine.widgetPixelWidths.update(w => ({ ...w, [widgetId]: orig.width }));
    engine.widgetHeights.update(h => ({ ...h, [widgetId]: orig.height }));

    setTimeout(() => {
      this.canvasDetailViews.update(v => {
        const next = { ...v };
        delete next[widgetId];
        return next;
      });
      delete this._originalRects[widgetId];

      const remainingIds = Object.keys(this.canvasDetailViews());
      const baseline = this._baselineSnapshot;

      if (baseline) {
        const locked = engine.widgetLocked();
        const tops = { ...engine.widgetTops() };
        const lefts = { ...engine.widgetLefts() };
        const widths = { ...engine.widgetPixelWidths() };
        const heights = { ...engine.widgetHeights() };

        for (const wid of allWidgetIds) {
          if (locked[wid] || remainingIds.includes(wid)) continue;
          if (baseline.tops[wid] !== undefined) tops[wid] = baseline.tops[wid];
          if (baseline.lefts[wid] !== undefined) lefts[wid] = baseline.lefts[wid];
          if (baseline.widths[wid] !== undefined) widths[wid] = baseline.widths[wid];
          if (baseline.heights[wid] !== undefined) heights[wid] = baseline.heights[wid];
        }

        engine.widgetTops.set(tops);
        engine.widgetLefts.set(lefts);
        engine.widgetPixelWidths.set(widths);
        engine.widgetHeights.set(heights);
      }

      for (const detailId of remainingIds) {
        engine.pushFromWidget(detailId);
      }

      if (remainingIds.length === 0) {
        this._baselineSnapshot = null;
      }
    }, TRANSITION_MS);
  }

  updateField(widgetId: string, field: 'status' | 'assignee' | 'dueDate', value: string): void {
    const views = this.canvasDetailViews();
    const current = views[widgetId];
    if (!current) return;
    const updated = { ...current.item, [field]: value } as Rfi & Submittal;
    this.canvasDetailViews.update(v => ({
      ...v,
      [widgetId]: { ...current, item: updated } as DetailView,
    }));
  }

  reset(): void {
    this.canvasDetailViews.set({});
    this.canvasInteractingId.set(null);
    this._originalRects = {};
    this._baselineSnapshot = null;
  }
}
