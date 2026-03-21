import { signal, computed, type WritableSignal, type Signal } from '@angular/core';
import type { WidgetLayoutService } from './widget-layout.service';

export interface DashboardLayoutConfig {
  widgets: string[];
  layoutStorageKey: string;
  canvasStorageKey: string;
  defaultColStarts: Record<string, number>;
  defaultColSpans: Record<string, number>;
  defaultTops: Record<string, number>;
  defaultHeights: Record<string, number>;
  defaultLefts: Record<string, number>;
  defaultPixelWidths: Record<string, number>;
  canvasDefaultLefts: Record<string, number>;
  canvasDefaultPixelWidths: Record<string, number>;
  canvasDefaultTops?: Record<string, number>;
  canvasDefaultHeights?: Record<string, number>;
  minColSpan?: number;
  widgetMinColSpans?: Record<string, number>;
  canvasGridMinHeightOffset?: number;
  savesDesktopOnMobile?: boolean;
  onBeforeMobileCompact?: () => void;
}

/**
 * Shared layout engine for dashboard pages with drag/resize/persist/canvas support.
 * Each page component creates its own instance with page-specific config.
 */
export class DashboardLayoutEngine {
  static readonly GAP_PX = 16;
  static readonly CANVAS_STEP = 81;

  private readonly config: DashboardLayoutConfig;
  private readonly layoutService: WidgetLayoutService;

  readonly widgetColStarts: WritableSignal<Record<string, number>>;
  readonly widgetColSpans: WritableSignal<Record<string, number>>;
  readonly widgetTops: WritableSignal<Record<string, number>>;
  readonly widgetHeights: WritableSignal<Record<string, number>>;
  readonly widgetLefts: WritableSignal<Record<string, number>>;
  readonly widgetPixelWidths: WritableSignal<Record<string, number>>;
  readonly moveTargetId: WritableSignal<string | null>;
  readonly isMobile: WritableSignal<boolean>;
  readonly isCanvasMode: WritableSignal<boolean>;
  readonly canvasGridMinHeight: Signal<number>;

  gridElAccessor: () => HTMLElement | undefined = () => undefined;
  headerElAccessor: () => HTMLElement | undefined = () => undefined;

  private _moveTarget: string | null = null;
  private _dragAxis: 'h' | 'v' | 'free' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;
  private _dragStartLeft = 0;

  private _interactionSeq = 0;
  private _widgetLastInteraction: Record<string, number> = {};

  private _resizeTarget: string | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartW = 0;

  private _savedDesktopTops: Record<string, number> | null = null;
  private _savedDesktopColStarts: Record<string, number> | null = null;
  private _savedDesktopColSpans: Record<string, number> | null = null;
  private _savedDesktopHeights: Record<string, number> | null = null;
  private _savedDesktopLefts: Record<string, number> | null = null;
  private _savedDesktopWidths: Record<string, number> | null = null;
  private _savedDesktopForCanvas: {
    tops: Record<string, number>;
    heights: Record<string, number>;
    colStarts: Record<string, number>;
    colSpans: Record<string, number>;
    lefts: Record<string, number>;
    widths: Record<string, number>;
  } | null = null;

  readonly abortCtrl = new AbortController();

  constructor(config: DashboardLayoutConfig, layoutService: WidgetLayoutService) {
    this.config = config;
    this.layoutService = layoutService;

    this.widgetColStarts = signal({ ...config.defaultColStarts });
    this.widgetColSpans = signal({ ...config.defaultColSpans });
    this.widgetTops = signal({ ...config.defaultTops });
    this.widgetHeights = signal({ ...config.defaultHeights });
    this.widgetLefts = signal({ ...config.defaultLefts });
    this.widgetPixelWidths = signal({ ...config.defaultPixelWidths });
    this.moveTargetId = signal<string | null>(null);
    this.isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    this.isCanvasMode = signal(typeof window !== 'undefined' ? window.innerWidth >= 2000 : false);

    const offset = config.canvasGridMinHeightOffset ?? 200;
    this.canvasGridMinHeight = computed(() => {
      const tops = this.widgetTops();
      const heights = this.widgetHeights();
      let max = 0;
      for (const id of config.widgets) {
        max = Math.max(max, tops[id] + heights[id]);
      }
      return max + offset;
    });
  }

  destroy(): void {
    this.abortCtrl.abort();
  }

  private get activeGridEl(): HTMLElement | undefined {
    return this.gridElAccessor();
  }

  mobileGridHeight(): number {
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    let max = 0;
    for (const id of this.config.widgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max;
  }

  init(): void {
    const startMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const startCanvas = typeof window !== 'undefined' && window.innerWidth >= 2000;
    this.isMobile.set(startMobile);
    this.isCanvasMode.set(startCanvas);

    if (startCanvas) {
      this.restoreDesktopLayout();
      this._savedDesktopForCanvas = {
        tops: { ...this.widgetTops() },
        heights: { ...this.widgetHeights() },
        colStarts: { ...this.widgetColStarts() },
        colSpans: { ...this.widgetColSpans() },
        lefts: { ...this.widgetLefts() },
        widths: { ...this.widgetPixelWidths() },
      };
      if (!this.restoreCanvasLayout()) {
        this.applyCanvasDefaults();
      }
    } else if (startMobile) {
      if (this.config.savesDesktopOnMobile) {
        this.restoreDesktopLayout();
        this._savedDesktopTops = { ...this.widgetTops() };
        this._savedDesktopColStarts = { ...this.widgetColStarts() };
        this._savedDesktopColSpans = { ...this.widgetColSpans() };
        this._savedDesktopHeights = { ...this.widgetHeights() };
        this._savedDesktopLefts = { ...this.widgetLefts() };
        this._savedDesktopWidths = { ...this.widgetPixelWidths() };
      }
      const restoredMobile = this.restoreMobileLayout();
      if (restoredMobile) {
        this.config.onBeforeMobileCompact?.();
        this.compactAll();
      } else {
        this.config.onBeforeMobileCompact?.();
        this.stackAllForMobile();
      }
    } else {
      this.restoreDesktopLayout();
    }

    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 767px)');
    const canvasQuery = window.matchMedia('(min-width: 2000px)');

    const onBreakpointChange = (): void => {
      const w = window.innerWidth;
      const wasMobile = this.isMobile();
      const wasCanvas = this.isCanvasMode();
      const nowMobile = w < 768;
      const nowCanvas = w >= 2000;

      this.isMobile.set(nowMobile);
      this.isCanvasMode.set(nowCanvas);

      if (wasCanvas && !nowCanvas) {
        this.persistCanvasLayout();
        if (this._savedDesktopForCanvas) {
          this.widgetTops.set(this._savedDesktopForCanvas.tops);
          this.widgetHeights.set(this._savedDesktopForCanvas.heights);
          this.widgetColStarts.set(this._savedDesktopForCanvas.colStarts);
          this.widgetColSpans.set(this._savedDesktopForCanvas.colSpans);
          this.widgetLefts.set(this._savedDesktopForCanvas.lefts);
          this.widgetPixelWidths.set(this._savedDesktopForCanvas.widths);
          this._savedDesktopForCanvas = null;
        } else {
          this.restoreDesktopLayout();
        }
      } else if (!wasCanvas && nowCanvas) {
        if (!wasMobile) {
          this._savedDesktopForCanvas = {
            tops: { ...this.widgetTops() },
            heights: { ...this.widgetHeights() },
            colStarts: { ...this.widgetColStarts() },
            colSpans: { ...this.widgetColSpans() },
            lefts: { ...this.widgetLefts() },
            widths: { ...this.widgetPixelWidths() },
          };
        }
        if (!this.restoreCanvasLayout()) {
          this.applyCanvasDefaults();
        }
      } else if (nowMobile && !wasMobile) {
        if (this.config.savesDesktopOnMobile) {
          this._savedDesktopTops = { ...this.widgetTops() };
          this._savedDesktopColStarts = { ...this.widgetColStarts() };
          this._savedDesktopColSpans = { ...this.widgetColSpans() };
          this._savedDesktopHeights = { ...this.widgetHeights() };
          this._savedDesktopLefts = { ...this.widgetLefts() };
          this._savedDesktopWidths = { ...this.widgetPixelWidths() };
        }
        const restoredMobile = this.restoreMobileLayout();
        if (restoredMobile) {
          this.config.onBeforeMobileCompact?.();
          this.compactAll();
        } else {
          this.config.onBeforeMobileCompact?.();
          this.stackAllForMobile();
        }
      } else if (!nowMobile && wasMobile && !nowCanvas) {
        this.persistLayout();
        if (this.config.savesDesktopOnMobile && this._savedDesktopTops) {
          this.widgetTops.set(this._savedDesktopTops);
          if (this._savedDesktopColStarts) this.widgetColStarts.set(this._savedDesktopColStarts);
          if (this._savedDesktopColSpans) this.widgetColSpans.set(this._savedDesktopColSpans);
          if (this._savedDesktopHeights) this.widgetHeights.set(this._savedDesktopHeights);
          if (this._savedDesktopLefts) this.widgetLefts.set(this._savedDesktopLefts);
          if (this._savedDesktopWidths) this.widgetPixelWidths.set(this._savedDesktopWidths);
          this._savedDesktopTops = null;
          this._savedDesktopColStarts = null;
          this._savedDesktopColSpans = null;
          this._savedDesktopHeights = null;
          this._savedDesktopLefts = null;
          this._savedDesktopWidths = null;
        } else {
          this.restoreDesktopLayout();
        }
      }
    };

    mq.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    canvasQuery.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    window.addEventListener('resize', onBreakpointChange, { signal: this.abortCtrl.signal });

    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (this._moveTarget || this._resizeTarget) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          this.onDocumentMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
        }
      }
    }, { passive: false, signal: this.abortCtrl.signal });
  }

  onWidgetHeaderMouseDown(id: string, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    this.moveTargetId.set(id);
  }

  onWidgetHeaderTouchStart(id: string, event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    const header = event.currentTarget as HTMLElement;
    const handle = header.querySelector('[data-drag-handle]') as HTMLElement | null;
    if (handle) {
      const rect = handle.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (Math.abs(touch.clientX - cx) > 16 || Math.abs(touch.clientY - cy) > 16) return;
    }
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    this.moveTargetId.set(id);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
    }
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = touch.clientY;
    this._resizeStartX = touch.clientX;
    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
    }
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      this.handleResize(event);
    }
  }

  onDocumentMouseUp(): void {
    const hadInteraction = !!this._moveTarget || !!this._resizeTarget;
    const interactedId = this._moveTarget ?? this._resizeTarget;
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    if (hadInteraction) {
      if (interactedId) {
        this._widgetLastInteraction[interactedId] = ++this._interactionSeq;
      }
      if (!this.isCanvasMode()) {
        this.compactAll();
      }
      if (this.isCanvasMode()) {
        this.persistCanvasLayout();
      } else {
        this.persistLayout();
      }
    }
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  resetWidgets(): void {
    localStorage.removeItem(this.config.canvasStorageKey);
    this.applyCanvasDefaults();
  }

  cleanupOverlaps(): void {
    this.cleanupCanvasOverlaps();
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;
    const widgets = this.config.widgets;

    if (this._dragAxis === 'free') {
      const gap = DashboardLayoutEngine.GAP_PX;
      const rawTop = this._dragStartTop + (event.clientY - this._dragStartY);
      const rawLeft = this._dragStartLeft + (event.clientX - this._dragStartX);
      const newTop = Math.round(rawTop / gap) * gap;
      const hStep = this.isCanvasMode() ? DashboardLayoutEngine.CANVAS_STEP : gap;
      const newLeft = Math.round(rawLeft / hStep) * hStep;
      this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
      this.widgetLefts.update((l) => ({ ...l, [id]: newLeft }));
      this.resolveCollisions(id, widgets);
      return;
    }

    if (!this._dragAxis) {
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dy < 8) return;
      this._dragAxis = 'v';
    }

    const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
    this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
    this.resolveCollisions(id, widgets);
  }

  private handleResize(event: MouseEvent): void {
    const id = this._resizeTarget!;
    const widgets = this.config.widgets;

    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
      const newH = Math.round(raw / 16) * 16;
      this.widgetHeights.update((h) => ({ ...h, [id]: newH }));
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      const raw = Math.max(200, this._resizeStartW + (event.clientX - this._resizeStartX));
      const newW = Math.round(raw / DashboardLayoutEngine.GAP_PX) * DashboardLayoutEngine.GAP_PX;
      this.widgetPixelWidths.update((w) => ({ ...w, [id]: newW }));
    }
    this.resolveCollisions(id, widgets);
  }

  private resolveCollisions(movedId: string, widgets: string[]): void {
    if (this.isCanvasMode()) return;

    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const gap = DashboardLayoutEngine.GAP_PX;

    const mobile = this.isMobile();
    let colOverlap: (a: string, b: string) => boolean;
    if (mobile) {
      colOverlap = () => true;
    } else {
      const lefts = this.widgetLefts();
      const widths = this.widgetPixelWidths();
      colOverlap = (a, b) => lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];
    }

    const sorted = [...widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: string[] = [movedId];

    for (const id of sorted) {
      if (id === movedId) continue;
      let y = 0;
      let settled = false;
      while (!settled) {
        settled = true;
        for (const placedId of placed) {
          if (!colOverlap(id, placedId)) continue;
          const pBot = tops[placedId] + heights[placedId];
          if (y < pBot && y + heights[id] > tops[placedId]) {
            y = pBot + gap;
            settled = false;
          }
        }
      }
      tops[id] = y;
      placed.push(id);
    }

    const changed = widgets.some((id) => tops[id] !== this.widgetTops()[id]);
    if (changed) {
      this.widgetTops.set(tops);
    }
  }

  compactAll(): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const widgets = this.config.widgets;
    const mobile = this.isMobile();

    if (mobile) {
      const sorted = [...widgets].sort((a, b) => tops[a] - tops[b]);
      let y = 0;
      for (const id of sorted) {
        tops[id] = y;
        y += heights[id] + gap;
      }
      this.widgetTops.set(tops);
      return;
    }

    const lefts = this.widgetLefts();
    const widths = this.widgetPixelWidths();
    const colOverlap = (a: string, b: string) =>
      lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];

    const sorted = [...widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: string[] = [];

    for (const id of sorted) {
      let y = 0;
      let settled = false;
      while (!settled) {
        settled = true;
        for (const placedId of placed) {
          if (!colOverlap(id, placedId)) continue;
          const pBot = tops[placedId] + heights[placedId];
          if (y < pBot && y + heights[id] > tops[placedId]) {
            y = pBot + gap;
            settled = false;
          }
        }
      }
      tops[id] = y;
      placed.push(id);
    }

    if (widgets.some((id) => tops[id] !== this.widgetTops()[id])) {
      this.widgetTops.set(tops);
    }
  }

  stackAllForMobile(): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const heights = this.widgetHeights();
    const tops = { ...this.widgetTops() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };

    let y = 0;
    for (const id of this.config.widgets) {
      tops[id] = y;
      colStarts[id] = 1;
      colSpans[id] = 16;
      y += heights[id] + gap;
    }

    this.widgetTops.set(tops);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
  }

  syncColSpansFromPixelWidths(): void {
    const widths = this.widgetPixelWidths();
    const step = DashboardLayoutEngine.CANVAS_STEP;
    const gap = DashboardLayoutEngine.GAP_PX;
    const minSpan = this.config.minColSpan ?? 4;
    const spans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      const perWidget = this.config.widgetMinColSpans?.[id] ?? minSpan;
      spans[id] = Math.max(perWidget, Math.min(16, Math.round((widths[id] + gap) / step)));
    }
    this.widgetColSpans.set(spans);
  }

  persistLayout(): void {
    const mobile = this.isMobile();
    const tops: Record<string, number> = {};
    const heights: Record<string, number> = {};
    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    const lefts: Record<string, number> = {};
    const widths: Record<string, number> = {};
    for (const id of this.config.widgets) {
      tops[id] = this.widgetTops()[id];
      heights[id] = this.widgetHeights()[id];
      colStarts[id] = this.widgetColStarts()[id];
      colSpans[id] = this.widgetColSpans()[id];
      lefts[id] = this.widgetLefts()[id];
      widths[id] = this.widgetPixelWidths()[id];
    }
    this.layoutService.save(this.config.layoutStorageKey, mobile, {
      tops,
      heights,
      colStarts,
      colSpans,
      lefts,
      widths,
    });
  }

  persistCanvasLayout(): void {
    const layout: Record<string, Record<string, number>> = {
      tops: {}, heights: {}, lefts: {}, widths: {},
    };
    for (const id of this.config.widgets) {
      layout['tops'][id] = this.widgetTops()[id];
      layout['heights'][id] = this.widgetHeights()[id];
      layout['lefts'][id] = this.widgetLefts()[id];
      layout['widths'][id] = this.widgetPixelWidths()[id];
    }
    try {
      localStorage.setItem(this.config.canvasStorageKey, JSON.stringify(layout));
    } catch { /* quota exceeded */ }
  }

  restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load(this.config.layoutStorageKey, false);
    if (!saved) return false;
    const tops = { ...this.widgetTops() };
    const heights = { ...this.widgetHeights() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };
    const lefts = { ...this.widgetLefts() };
    const pixelWidths = { ...this.widgetPixelWidths() };
    for (const id of this.config.widgets) {
      if (saved.tops[id] != null) tops[id] = saved.tops[id];
      if (saved.heights[id] != null) heights[id] = saved.heights[id];
      if (saved.colStarts[id] != null) colStarts[id] = saved.colStarts[id];
      if (saved.colSpans[id] != null) colSpans[id] = saved.colSpans[id];
      if (saved.lefts?.[id] != null) lefts[id] = saved.lefts[id];
      if (saved.widths?.[id] != null) pixelWidths[id] = saved.widths[id];
    }
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    this.widgetLefts.set(lefts);
    this.widgetPixelWidths.set(pixelWidths);
    return true;
  }

  restoreMobileLayout(): boolean {
    const saved = this.layoutService.load(this.config.layoutStorageKey, true);
    if (!saved) return false;
    const tops = { ...this.widgetTops() };
    const heights = { ...this.widgetHeights() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };
    for (const id of this.config.widgets) {
      if (saved.tops[id] != null) tops[id] = saved.tops[id];
      if (saved.heights[id] != null) heights[id] = saved.heights[id];
      if (saved.colStarts[id] != null) colStarts[id] = saved.colStarts[id];
      if (saved.colSpans[id] != null) colSpans[id] = saved.colSpans[id];
    }
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    return true;
  }

  restoreCanvasLayout(): boolean {
    try {
      const raw = localStorage.getItem(this.config.canvasStorageKey);
      if (!raw) return false;
      const layout = JSON.parse(raw);
      const tops = { ...this.widgetTops() };
      const heights = { ...this.widgetHeights() };
      const lefts = { ...this.widgetLefts() };
      const widths = { ...this.widgetPixelWidths() };
      for (const id of this.config.widgets) {
        if (layout.tops?.[id] != null) tops[id] = layout.tops[id];
        if (layout.heights?.[id] != null) heights[id] = layout.heights[id];
        if (layout.lefts?.[id] != null) lefts[id] = layout.lefts[id];
        if (layout.widths?.[id] != null) widths[id] = layout.widths[id];
      }
      this.widgetTops.set(tops);
      this.widgetHeights.set(heights);
      this.widgetLefts.set(lefts);
      this.widgetPixelWidths.set(widths);
      this.syncColSpansFromPixelWidths();
      return true;
    } catch {
      return false;
    }
  }

  applyCanvasDefaults(): void {
    this.widgetLefts.set({ ...this.config.canvasDefaultLefts });
    this.widgetPixelWidths.set({ ...this.config.canvasDefaultPixelWidths });
    if (this.config.canvasDefaultTops) {
      this.widgetTops.set({ ...this.config.canvasDefaultTops });
    }
    if (this.config.canvasDefaultHeights) {
      this.widgetHeights.set({ ...this.config.canvasDefaultHeights });
    }
    this.syncColSpansFromPixelWidths();
  }

  private cleanupCanvasOverlaps(): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const widgets = this.config.widgets;
    const origTops = this.widgetTops();
    const origLefts = this.widgetLefts();
    const tops = { ...origTops };
    const heights = this.widgetHeights();
    const lefts = { ...origLefts };
    const widths = this.widgetPixelWidths();

    const gridEl = this.activeGridEl;
    const headerEl = this.headerElAccessor();
    let headerBottom = 0;
    if (gridEl && headerEl) {
      const gridRect = gridEl.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      headerBottom = headerRect.bottom - gridRect.top;
    }

    const recency = this._widgetLastInteraction;
    const sorted = [...widgets].sort(
      (x, y) => (recency[y] ?? 0) - (recency[x] ?? 0),
    );

    let changed = true;
    while (changed) {
      changed = false;

      for (const id of sorted) {
        if (tops[id] < headerBottom + gap) {
          tops[id] = headerBottom + gap;
          changed = true;
        }
      }

      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const mover = sorted[i];
          const other = sorted[j];

          const hOverlap = Math.min(lefts[mover] + widths[mover], lefts[other] + widths[other]) - Math.max(lefts[mover], lefts[other]);
          const vOverlap = Math.min(tops[mover] + heights[mover], tops[other] + heights[other]) - Math.max(tops[mover], tops[other]);
          if (hOverlap + gap <= 0 || vOverlap + gap <= 0) continue;

          if (vOverlap <= hOverlap) {
            if (tops[mover] <= tops[other]) {
              tops[mover] -= vOverlap + gap;
            } else {
              tops[mover] += vOverlap + gap;
            }
          } else {
            if (lefts[mover] <= lefts[other]) {
              lefts[mover] -= hOverlap + gap;
            } else {
              lefts[mover] += hOverlap + gap;
            }
          }
          changed = true;
        }
      }
    }

    const moved = widgets.some((id) => tops[id] !== origTops[id] || lefts[id] !== origLefts[id]);
    if (!moved) return;

    this.widgetTops.set(tops);
    this.widgetLefts.set(lefts);
    this.persistCanvasLayout();
  }
}
