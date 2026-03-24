import { signal, computed, type WritableSignal, type Signal } from '@angular/core';
import type { WidgetLayoutService } from './widget-layout.service';

export interface DashboardLayoutConfig {
  widgets: string[];
  layoutStorageKey: string | (() => string);
  canvasStorageKey: string | (() => string);
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
  onWidgetSelect?: (id: string) => void;
}

interface LayoutSnapshot {
  tops: Record<string, number>;
  heights: Record<string, number>;
  colStarts: Record<string, number>;
  colSpans: Record<string, number>;
  lefts: Record<string, number>;
  widths: Record<string, number>;
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
  readonly widgetZIndices: WritableSignal<Record<string, number>>;
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
  private _zCounter = 0;

  private _resizeTarget: string | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeEdge: 'left' | 'right' = 'right';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartW = 0;
  private _resizeStartL = 0;

  private _resizeSnapshot: Record<string, {
    left: number; width: number; top: number; height: number;
  }> | null = null;

  private _savedDesktopForMobile: LayoutSnapshot | null = null;
  private _savedDesktopForCanvas: LayoutSnapshot | null = null;

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
    this.widgetZIndices = signal<Record<string, number>>({});
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

  private get layoutKey(): string {
    const k = this.config.layoutStorageKey;
    return typeof k === 'function' ? k() : k;
  }

  private get canvasKey(): string {
    const k = this.config.canvasStorageKey;
    return typeof k === 'function' ? k() : k;
  }

  private get activeGridEl(): HTMLElement | undefined {
    return this.gridElAccessor();
  }

  private get currentStep(): number {
    if (this.isCanvasMode()) return DashboardLayoutEngine.CANVAS_STEP;
    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;
    return (containerWidth + DashboardLayoutEngine.GAP_PX) / 16;
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
    this.applyModeLayout();

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
          this.restoreSnapshot(this._savedDesktopForCanvas);
          this._savedDesktopForCanvas = null;
        } else {
          this.restoreDesktopLayout();
        }
      } else if (!wasCanvas && nowCanvas) {
        if (!wasMobile) {
          this._savedDesktopForCanvas = this.snapshotLayout();
        }
        if (!this.restoreCanvasLayout()) {
          this.applyCanvasDefaults();
        }
        requestAnimationFrame(() => this.cleanupCanvasOverlaps());
      } else if (nowMobile && !wasMobile) {
        if (this.config.savesDesktopOnMobile) {
          this._savedDesktopForMobile = this.snapshotLayout();
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
        if (this.config.savesDesktopOnMobile && this._savedDesktopForMobile) {
          this.restoreSnapshot(this._savedDesktopForMobile);
          this._savedDesktopForMobile = null;
        } else {
          this.restoreDesktopLayout();
        }
      } else if (!nowMobile && !nowCanvas) {
        if (!this._moveTarget && !this._resizeTarget) {
          this.syncPixelWidthsFromCols();
        }
      }
    };

    mq.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    canvasQuery.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    window.addEventListener('resize', onBreakpointChange, { signal: this.abortCtrl.signal });

    requestAnimationFrame(() => {
      if (!this.isMobile() && !this.isCanvasMode()) {
        this.syncPixelWidthsFromCols();
      }
    });

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
    this.bumpZIndex(id);
    this.config.onWidgetSelect?.(id);
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
    this.bumpZIndex(id);
    this.config.onWidgetSelect?.(id);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeEdge = edge;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
      this._resizeStartL = this.widgetLefts()[target] ?? 0;
    }
    this.bumpZIndex(target);
    this.captureResizeSnapshot();
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeEdge = edge;
    this._resizeStartY = touch.clientY;
    this._resizeStartX = touch.clientX;
    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
      this._resizeStartL = this.widgetLefts()[target] ?? 0;
    }
    this.bumpZIndex(target);
    this.captureResizeSnapshot();
  }

  private captureResizeSnapshot(): void {
    if (this.isMobile() || this.isCanvasMode()) return;
    const dir = this._resizeDir;
    if (dir !== 'h' && dir !== 'both') return;
    this._resizeSnapshot = {};
    for (const id of this.config.widgets) {
      this._resizeSnapshot[id] = {
        left: this.widgetLefts()[id],
        width: this.widgetPixelWidths()[id],
        top: this.widgetTops()[id],
        height: this.widgetHeights()[id],
      };
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
    this._resizeEdge = 'right';
    this._resizeSnapshot = null;
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
        this.syncColsFromPixelPositions();
        this.persistLayout();
      }
    }
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  resetToDefaults(): void {
    this.widgetTops.set({ ...this.config.defaultTops });
    this.widgetHeights.set({ ...this.config.defaultHeights });
    this.widgetColStarts.set({ ...this.config.defaultColStarts });
    this.widgetColSpans.set({ ...this.config.defaultColSpans });
    this.widgetLefts.set({ ...this.config.defaultLefts });
    this.widgetPixelWidths.set({ ...this.config.defaultPixelWidths });
    this.syncPixelWidthsFromCols();

    if (this.isCanvasMode()) {
      localStorage.removeItem(this.canvasKey);
      this.persistCanvasLayout();
    } else {
      this.persistLayout();
    }
  }

  reinitLayout(prevLayoutKey?: string, prevCanvasKey?: string): void {
    if (prevLayoutKey) {
      this.layoutService.save(prevLayoutKey, this.isMobile(), {
        tops: this.widgetTops(),
        heights: this.widgetHeights(),
        colStarts: this.widgetColStarts(),
        colSpans: this.widgetColSpans(),
        lefts: this.widgetLefts(),
        widths: this.widgetPixelWidths(),
      });
    }
    if (prevCanvasKey && this.isCanvasMode()) {
      const layout: Record<string, Record<string, number>> = {
        tops: {}, heights: {}, lefts: {}, widths: {},
      };
      for (const id of this.config.widgets) {
        layout['tops'][id] = this.widgetTops()[id];
        layout['heights'][id] = this.widgetHeights()[id];
        layout['lefts'][id] = this.widgetLefts()[id];
        layout['widths'][id] = this.widgetPixelWidths()[id];
      }
      try { localStorage.setItem(prevCanvasKey, JSON.stringify(layout)); } catch { /* quota */ }
    }

    this.widgetTops.set({ ...this.config.defaultTops });
    this.widgetHeights.set({ ...this.config.defaultHeights });
    this.widgetColStarts.set({ ...this.config.defaultColStarts });
    this.widgetColSpans.set({ ...this.config.defaultColSpans });
    this.widgetLefts.set({ ...this.config.defaultLefts });
    this.widgetPixelWidths.set({ ...this.config.defaultPixelWidths });
    this._savedDesktopForCanvas = null;
    this._savedDesktopForMobile = null;

    this.applyModeLayout();
  }

  private applyModeLayout(): void {
    if (this.isCanvasMode()) {
      this.restoreDesktopLayout();
      this._savedDesktopForCanvas = this.snapshotLayout();
      if (!this.restoreCanvasLayout()) {
        this.applyCanvasDefaults();
      }
      requestAnimationFrame(() => this.cleanupCanvasOverlaps());
    } else if (this.isMobile()) {
      this.restoreDesktopLayout();
      if (this.config.savesDesktopOnMobile) {
        this._savedDesktopForMobile = this.snapshotLayout();
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
      this.syncPixelWidthsFromCols();
    }
  }

  private bumpZIndex(id: string): void {
    this._zCounter++;
    this.widgetZIndices.update(z => ({ ...z, [id]: this._zCounter }));
  }

  private snapshotLayout(): LayoutSnapshot {
    return {
      tops: { ...this.widgetTops() },
      heights: { ...this.widgetHeights() },
      colStarts: { ...this.widgetColStarts() },
      colSpans: { ...this.widgetColSpans() },
      lefts: { ...this.widgetLefts() },
      widths: { ...this.widgetPixelWidths() },
    };
  }

  private restoreSnapshot(snap: LayoutSnapshot): void {
    this.widgetTops.set(snap.tops);
    this.widgetHeights.set(snap.heights);
    this.widgetColStarts.set(snap.colStarts);
    this.widgetColSpans.set(snap.colSpans);
    this.widgetLefts.set(snap.lefts);
    this.widgetPixelWidths.set(snap.widths);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;
    const widgets = this.config.widgets;

    if (this._dragAxis === 'free') {
      const gap = DashboardLayoutEngine.GAP_PX;
      const hStep = this.currentStep;
      const rawTop = this._dragStartTop + (event.clientY - this._dragStartY);
      const rawLeft = this._dragStartLeft + (event.clientX - this._dragStartX);
      let newTop = Math.round(rawTop / gap) * gap;
      let newLeft = Math.round(rawLeft / hStep) * hStep;

      if (!this.isCanvasMode()) {
        const containerWidth = grid.clientWidth;
        const widgetWidth = this.widgetPixelWidths()[id] ?? 0;
        newTop = Math.max(0, newTop);
        newLeft = Math.max(0, Math.min(newLeft, containerWidth - widgetWidth));
      }

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
      const hStep = this.currentStep;
      const gap = DashboardLayoutEngine.GAP_PX;
      const minResizeCols = 4;
      const minW = minResizeCols * hStep - gap;

      if (this._resizeEdge === 'left') {
        const dx = this._resizeStartX - event.clientX;
        const raw = Math.max(200, this._resizeStartW + dx);
        const snapped = Math.round((raw + gap) / hStep) * hStep - gap;
        let newW = Math.max(minW, snapped);
        let newL = this._resizeStartL - (newW - this._resizeStartW);
        if (!this.isCanvasMode() && newL < 0) {
          newW = this._resizeStartW + this._resizeStartL;
          newW = Math.round((newW + gap) / hStep) * hStep - gap;
          newW = Math.max(minW, newW);
          newL = 0;
        }
        this.widgetPixelWidths.update((w) => ({ ...w, [id]: newW }));
        this.widgetLefts.update((l) => ({ ...l, [id]: newL }));
      } else {
        const raw = Math.max(200, this._resizeStartW + (event.clientX - this._resizeStartX));
        const snapped = Math.round((raw + gap) / hStep) * hStep - gap;
        let newW = Math.max(minW, snapped);

        if (!this.isCanvasMode()) {
          const grid = this.activeGridEl;
          if (grid) {
            const containerWidth = grid.clientWidth;
            const widgetLeft = this.widgetLefts()[id] ?? 0;
            newW = Math.min(newW, containerWidth - widgetLeft);
          }
        }

        this.widgetPixelWidths.update((w) => ({ ...w, [id]: newW }));
      }
    }
    this.resolveCollisions(id, widgets);
    if (!this.isCanvasMode()) {
      this.syncColsFromPixelPositions();
    }
  }

  private resolveCollisions(movedId: string, widgets: string[]): void {
    if (this.isCanvasMode()) {
      this.resolveCanvasPush(movedId, widgets);
      return;
    }

    const gap = DashboardLayoutEngine.GAP_PX;
    const mobile = this.isMobile();

    const isHResize = !mobile && this._resizeTarget === movedId
      && (this._resizeDir === 'h' || this._resizeDir === 'both')
      && this._resizeSnapshot != null;

    if (isHResize) {
      this.applyResizePushSqueeze(movedId, widgets);
    }

    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();

    if (isHResize && this._resizeSnapshot) {
      for (const id of widgets) {
        if (id === movedId) continue;
        tops[id] = this._resizeSnapshot[id].top;
      }
    }

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

  /**
   * Canvas-mode collision resolution: push overlapping widgets away from the
   * mover/resized widget. Uses minimum-displacement direction so each pushed
   * widget moves the least distance needed. Pushes cascade via BFS -- if
   * pushing A causes it to overlap B, B gets pushed too.
   */
  private resolveCanvasPush(movedId: string, widgets: string[]): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const tops = { ...this.widgetTops() };
    const lefts = { ...this.widgetLefts() };
    const heights = this.widgetHeights();
    const widths = this.widgetPixelWidths();

    const hasOverlap = (a: string, b: string): boolean => {
      const hO = Math.min(lefts[a] + widths[a], lefts[b] + widths[b]) - Math.max(lefts[a], lefts[b]);
      const vO = Math.min(tops[a] + heights[a], tops[b] + heights[b]) - Math.max(tops[a], tops[b]);
      return hO > 0 && vO > 0;
    };

    const queue: string[] = [movedId];
    const visited = new Set<string>();
    let safety = 0;
    const maxSafety = widgets.length * 4;

    while (queue.length > 0 && safety++ < maxSafety) {
      const pusherId = queue.shift()!;
      if (visited.has(pusherId)) continue;
      visited.add(pusherId);

      const pL = lefts[pusherId];
      const pT = tops[pusherId];
      const pR = pL + widths[pusherId];
      const pB = pT + heights[pusherId];

      for (const otherId of widgets) {
        if (otherId === pusherId) continue;
        if (!hasOverlap(pusherId, otherId)) continue;

        const oL = lefts[otherId];
        const oT = tops[otherId];
        const oR = oL + widths[otherId];
        const oB = oT + heights[otherId];

        const pushRight = pR + gap - oL;
        const pushLeft = oR + gap - pL;
        const pushDown = pB + gap - oT;
        const pushUp = oB + gap - pT;

        const minH = Math.min(pushRight, pushLeft);
        const minV = Math.min(pushDown, pushUp);

        if (minH <= minV) {
          if (pushRight <= pushLeft) {
            lefts[otherId] = pR + gap;
          } else {
            lefts[otherId] = pL - widths[otherId] - gap;
          }
        } else {
          if (pushDown <= pushUp) {
            tops[otherId] = pB + gap;
          } else {
            tops[otherId] = pT - heights[otherId] - gap;
          }
        }

        visited.delete(otherId);
        queue.push(otherId);
      }
    }

    const topsChanged = widgets.some((id) => tops[id] !== this.widgetTops()[id]);
    const leftsChanged = widgets.some((id) => lefts[id] !== this.widgetLefts()[id]);

    if (topsChanged) this.widgetTops.set(tops);
    if (leftsChanged) this.widgetLefts.set(lefts);
  }

  /**
   * Cascading push-then-squeeze for desktop horizontal resize.
   *
   * Right-edge resize:
   * 1. Push same-row right neighbors rightward, keeping original widths.
   * 2. When the rightmost widget hits the container edge, squeeze it.
   * 3. When a squeezed widget reaches the 4-col minimum, relocate it
   *    (restore its snapshot width; vertical collision pushes it to a new row).
   *
   * Left-edge resize:
   * Mirror of the above — push left neighbors leftward toward 0, squeeze
   * the leftmost against the container's left edge, relocate when minimum reached.
   *
   * Uses _resizeSnapshot so that resizing back fully un-pushes / un-squeezes.
   */
  private applyResizePushSqueeze(resizedId: string, widgets: string[]): void {
    const snap = this._resizeSnapshot;
    if (!snap) return;

    const gap = DashboardLayoutEngine.GAP_PX;
    const hStep = this.currentStep;
    const minWidth = 4 * hStep - gap;

    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;

    const lefts: Record<string, number> = {};
    const widths: Record<string, number> = {};
    for (const id of this.config.widgets) {
      if (id === resizedId) {
        lefts[id] = this.widgetLefts()[id];
        widths[id] = this.widgetPixelWidths()[id];
      } else {
        lefts[id] = snap[id].left;
        widths[id] = snap[id].width;
      }
    }

    const rTop = snap[resizedId].top;
    const rHeight = snap[resizedId].height;
    const rBottom = rTop + rHeight;

    if (this._resizeEdge === 'left') {
      const rLeft = lefts[resizedId];

      const leftNeighbors: string[] = [];
      for (const id of this.config.widgets) {
        if (id === resizedId) continue;
        const sTop = snap[id].top;
        const sBottom = sTop + snap[id].height;
        if (sTop < rBottom && sBottom > rTop && (snap[id].left + snap[id].width) <= (snap[resizedId].left + snap[resizedId].width)) {
          leftNeighbors.push(id);
        }
      }
      leftNeighbors.sort((a, b) => snap[b].left - snap[a].left);

      let active = [...leftNeighbors];
      let settled = false;
      let maxIter = active.length + 1;

      while (!settled && maxIter-- > 0) {
        settled = true;

        let cursor = rLeft - gap;
        for (const id of active) {
          const snapRight = snap[id].left + snap[id].width;
          if (snapRight <= cursor) {
            lefts[id] = snap[id].left;
            widths[id] = snap[id].width;
            cursor = snap[id].left - gap;
          } else {
            widths[id] = snap[id].width;
            lefts[id] = cursor - widths[id];
            cursor = lefts[id] - gap;
          }
        }

        if (active.length === 0) break;
        const lastId = active[active.length - 1];

        if (lefts[lastId] < 0) {
          const available = lefts[lastId] + widths[lastId];
          if (available >= minWidth) {
            lefts[lastId] = 0;
            widths[lastId] = available;
          } else {
            lefts[lastId] = snap[lastId].left;
            widths[lastId] = snap[lastId].width;
            active.pop();
            settled = false;
          }
        }
      }
    } else {
      const rRight = lefts[resizedId] + widths[resizedId];

      const rightNeighbors: string[] = [];
      for (const id of this.config.widgets) {
        if (id === resizedId) continue;
        const sTop = snap[id].top;
        const sBottom = sTop + snap[id].height;
        if (sTop < rBottom && sBottom > rTop && snap[id].left >= lefts[resizedId]) {
          rightNeighbors.push(id);
        }
      }
      rightNeighbors.sort((a, b) => snap[a].left - snap[b].left);

      let active = [...rightNeighbors];
      let settled = false;
      let maxIter = active.length + 1;

      while (!settled && maxIter-- > 0) {
        settled = true;

        let cursor = rRight + gap;
        for (const id of active) {
          if (cursor <= snap[id].left) {
            lefts[id] = snap[id].left;
            widths[id] = snap[id].width;
            cursor = snap[id].left + snap[id].width + gap;
          } else {
            lefts[id] = cursor;
            widths[id] = snap[id].width;
            cursor = lefts[id] + widths[id] + gap;
          }
        }

        if (active.length === 0) break;
        const lastId = active[active.length - 1];
        const lastRight = lefts[lastId] + widths[lastId];

        if (lastRight > containerWidth) {
          const available = containerWidth - lefts[lastId];
          if (available >= minWidth) {
            widths[lastId] = available;
          } else {
            lefts[lastId] = snap[lastId].left;
            widths[lastId] = snap[lastId].width;
            active.pop();
            settled = false;
          }
        }
      }
    }

    this.widgetLefts.set(lefts);
    this.widgetPixelWidths.set(widths);
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

  private syncColSpansFromPixelWidths(): void {
    const widths = this.widgetPixelWidths();
    const step = this.currentStep;
    const gap = DashboardLayoutEngine.GAP_PX;
    const minSpan = this.config.minColSpan ?? 4;
    const spans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      const perWidget = this.config.widgetMinColSpans?.[id] ?? minSpan;
      spans[id] = Math.max(perWidget, Math.min(16, Math.round((widths[id] + gap) / step)));
    }
    this.widgetColSpans.set(spans);
  }

  syncPixelWidthsFromCols(): void {
    const grid = this.activeGridEl;
    if (!grid) return;
    const containerWidth = grid.clientWidth;
    const step = (containerWidth + DashboardLayoutEngine.GAP_PX) / 16;
    const gap = DashboardLayoutEngine.GAP_PX;
    const colStarts = this.widgetColStarts();
    const colSpans = this.widgetColSpans();

    const lefts: Record<string, number> = {};
    const widths: Record<string, number> = {};
    for (const id of this.config.widgets) {
      lefts[id] = Math.round((colStarts[id] - 1) * step);
      widths[id] = Math.round(colSpans[id] * step - gap);
    }

    this.widgetLefts.set(lefts);
    this.widgetPixelWidths.set(widths);
  }

  private syncColsFromPixelPositions(): void {
    const grid = this.activeGridEl;
    if (!grid) return;
    const containerWidth = grid.clientWidth;
    const step = (containerWidth + DashboardLayoutEngine.GAP_PX) / 16;
    const gap = DashboardLayoutEngine.GAP_PX;

    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      colStarts[id] = Math.max(1, Math.round(this.widgetLefts()[id] / step) + 1);
      colSpans[id] = Math.max(4, Math.min(16, Math.round((this.widgetPixelWidths()[id] + gap) / step)));
    }

    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
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
    this.layoutService.save(this.layoutKey, mobile, {
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
      localStorage.setItem(this.canvasKey, JSON.stringify(layout));
    } catch { /* quota exceeded */ }
  }

  restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load(this.layoutKey, false);
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
    const saved = this.layoutService.load(this.layoutKey, true);
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
      const raw = localStorage.getItem(this.canvasKey);
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

    const zIndices = this.widgetZIndices();
    const sorted = [...widgets].sort(
      (x, y) => (zIndices[x] ?? 0) - (zIndices[y] ?? 0),
    );

    for (const id of sorted) {
      if (tops[id] < headerBottom + gap) {
        tops[id] = headerBottom + gap;
      }
    }

    const overlaps = (
      aTop: number, aLeft: number, aW: number, aH: number,
      bTop: number, bLeft: number, bW: number, bH: number,
    ): boolean => {
      const hO = Math.min(aLeft + aW, bLeft + bW) - Math.max(aLeft, bLeft);
      const vO = Math.min(aTop + aH, bTop + bH) - Math.max(aTop, bTop);
      return hO + gap > 0 && vO + gap > 0;
    };

    const placed: string[] = [sorted[0]];
    for (let k = 1; k < sorted.length; k++) {
      const mover = sorted[k];

      for (let attempt = 0; attempt < 30; attempt++) {
        const colliding: string[] = [];
        for (const pid of placed) {
          if (overlaps(tops[mover], lefts[mover], widths[mover], heights[mover],
                       tops[pid], lefts[pid], widths[pid], heights[pid])) {
            colliding.push(pid);
          }
        }
        if (colliding.length === 0) break;

        let escapeUp = Infinity;
        let escapeDown = -Infinity;
        let escapeLeft = Infinity;
        let escapeRight = -Infinity;

        for (const pid of colliding) {
          escapeUp = Math.min(escapeUp, tops[pid] - heights[mover] - gap);
          escapeDown = Math.max(escapeDown, tops[pid] + heights[pid] + gap);
          escapeLeft = Math.min(escapeLeft, lefts[pid] - widths[mover] - gap);
          escapeRight = Math.max(escapeRight, lefts[pid] + widths[pid] + gap);
        }

        escapeUp = Math.max(escapeUp, headerBottom + gap);

        const candidates = [
          { t: escapeUp, l: lefts[mover], d: Math.abs(tops[mover] - escapeUp) },
          { t: escapeDown, l: lefts[mover], d: Math.abs(tops[mover] - escapeDown) },
          { t: tops[mover], l: escapeLeft, d: Math.abs(lefts[mover] - escapeLeft) },
          { t: tops[mover], l: escapeRight, d: Math.abs(lefts[mover] - escapeRight) },
        ];
        candidates.sort((a, b) => a.d - b.d);

        let applied = false;
        for (const c of candidates) {
          let clear = true;
          for (const pid of placed) {
            if (overlaps(c.t, c.l, widths[mover], heights[mover],
                         tops[pid], lefts[pid], widths[pid], heights[pid])) {
              clear = false;
              break;
            }
          }
          if (clear) {
            tops[mover] = c.t;
            lefts[mover] = c.l;
            applied = true;
            break;
          }
        }

        if (!applied) {
          tops[mover] = candidates[0].t;
          lefts[mover] = candidates[0].l;
        }
      }

      if (tops[mover] < headerBottom + gap) {
        tops[mover] = headerBottom + gap;
      }
      placed.push(mover);
    }

    const moved = widgets.some((id) => tops[id] !== origTops[id] || lefts[id] !== origLefts[id]);
    if (!moved) return;

    this.widgetTops.set(tops);
    this.widgetLefts.set(lefts);
    this.persistCanvasLayout();
  }
}
