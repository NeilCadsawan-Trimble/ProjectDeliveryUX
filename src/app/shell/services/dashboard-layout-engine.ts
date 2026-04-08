import { signal, computed, type WritableSignal, type Signal } from '@angular/core';
import type { WidgetLayoutService } from './widget-layout.service';
import { runCanvasPushBfs, type WidgetRect } from './canvas-push';
import type { CanvasItemHost } from './canvas-item-host';

export interface DashboardLayoutConfig {
  widgets: string[];
  layoutStorageKey: string | (() => string);
  canvasStorageKey: string | (() => string);
  defaultColStarts: Record<string, number>;
  defaultColSpans: Record<string, number>;
  defaultTops: Record<string, number>;
  defaultHeights: Record<string, number>;
  /** @deprecated Desktop uses CSS Grid; pixel positions derived from columns at runtime. */
  defaultLefts?: Record<string, number>;
  /** @deprecated Desktop uses CSS Grid; pixel widths derived from columns at runtime. */
  defaultPixelWidths?: Record<string, number>;
  canvasDefaultLefts: Record<string, number>;
  canvasDefaultPixelWidths: Record<string, number>;
  canvasDefaultTops?: Record<string, number>;
  canvasDefaultHeights?: Record<string, number>;
  minColSpan?: number;
  widgetMinColSpans?: Record<string, number>;
  widgetMaxColSpans?: Record<string, number>;
  canvasGridMinHeightOffset?: number;
  savesDesktopOnMobile?: boolean;
  responsiveBreakpoints?: { minWidth: number; columns: number }[];
  /** Per-widget slot counts at each responsive column count, e.g. { proj1: { 4: 2, 3: 2, 2: 2 } } */
  responsiveSpanOverrides?: Record<string, Record<number, number>>;
  /** Force all flowing widgets to a uniform height at specific column counts, e.g. { 2: 672 } */
  responsiveUniformHeight?: Record<number, number>;
  onBeforeMobileCompact?: () => void;
  onWidgetSelect?: (id: string) => void;
  /**
   * Desktop horizontal resize only. Widget ids in **layout priority** order: index 0 is highest
   * (squeezed/relocated last). Lower-priority neighbors absorb overflow first so the hero and
   * primary tiles stay stable. Omit to keep legacy tail edge spatial squeeze/relocate.
   */
  desktopResizePriorityOrder?: string[];
  /**
   * Desktop only. After a widget **move** (not resize), snap non-locked tiles to canonical
   * placement: literal `defaultCol*` / `defaultTops` at the widest breakpoint column count, or
   * `reflowForColumns` at 2–3 columns using `desktopResizePriorityOrder` for flow sequence.
   */
  desktopSnapToDefaultLayoutAfterDrag?: boolean;
  /**
   * Desktop only. "Save as Default Layout" persists **colSpans + heights** only (ordering is not
   * saved). `resetToDefaults` restores full app defaults and clears this blob. Pair with
   * `applyModeLayout` merge: canonical placement + overlay saved sizing on load.
   */
  desktopSaveDefaultLayoutSizingOnly?: boolean;
  /**
   * Desktop only. After push-squeeze resolves, run a second pass that re-places all widgets
   * in `desktopResizePriorityOrder` sequence using LTR-then-TTB flow. Widgets that no longer
   * fit on the current line wrap to the next.
   */
  desktopReflowOnResize?: boolean;
}

/** Versioned desktop custom defaults: sizing only (no placement). */
const DESKTOP_SIZING_DEFAULTS_VERSION = 2;

interface DesktopSizingDefaultsV2 {
  v: typeof DESKTOP_SIZING_DEFAULTS_VERSION;
  colSpans: Record<string, number>;
  heights: Record<string, number>;
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
export class DashboardLayoutEngine implements CanvasItemHost {
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
  readonly widgetLocked: WritableSignal<Record<string, boolean>>;
  readonly isMobile: WritableSignal<boolean>;
  readonly isCanvasMode: WritableSignal<boolean>;
  readonly canvasGridMinHeight: Signal<number>;
  readonly desktopGridMinHeight: Signal<number>;

  /** CSS Grid column placement strings for desktop mode (e.g. "1 / span 8"). */
  readonly widgetGridColumns: Signal<Record<string, string>>;

  /** Pixel rect of the widget being dragged in desktop grid mode. */
  readonly dragLeft: WritableSignal<number>;
  readonly dragWidth: WritableSignal<number>;

  gridElAccessor: () => HTMLElement | undefined = () => undefined;
  headerElAccessor: () => HTMLElement | undefined = () => undefined;
  zoomFn: () => number = () => 1;

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
  private _hResizeActive = false;

  private _resizeSnapshot: Record<string, {
    left: number; width: number; top: number; height: number;
  }> | null = null;

  private _dragDidMove = false;

  private _pushSqueezeActive: Set<string> = new Set();

  /**
   * While dragging/resizing, vertical collision order must not follow the mover's
   * live `top` (that reorders every frame and recomputes the whole stack — tiles
   * jump). Sort uses these frozen tops until mouseup/touchend.
   */
  private _collisionSortBaseline: Record<string, number> | null = null;

  private _savedDesktopForMobile: LayoutSnapshot | null = null;
  private _savedDesktopForCanvas: LayoutSnapshot | null = null;
  private _currentDesktopColumns = 0;
  readonly currentDesktopColumns = signal(0);

  readonly abortCtrl = new AbortController();

  get isInteracting(): boolean {
    return !!this._moveTarget || !!this._resizeTarget;
  }

  constructor(config: DashboardLayoutConfig, layoutService: WidgetLayoutService) {
    this.config = config;
    this.layoutService = layoutService;

    this.widgetColStarts = signal({ ...config.defaultColStarts });
    this.widgetColSpans = signal({ ...config.defaultColSpans });
    this.widgetTops = signal({ ...config.defaultTops });
    this.widgetHeights = signal({ ...config.defaultHeights });
    this.widgetLefts = signal({ ...(config.defaultLefts ?? {}) });
    this.widgetPixelWidths = signal({ ...(config.defaultPixelWidths ?? {}) });
    this.moveTargetId = signal<string | null>(null);
    this.widgetZIndices = signal<Record<string, number>>({});
    this.widgetLocked = signal<Record<string, boolean>>(this.loadLockedState());
    this.isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    this.isCanvasMode = signal(typeof window !== 'undefined' ? window.innerWidth >= 1920 : false);
    this.dragLeft = signal(0);
    this.dragWidth = signal(0);

    this.widgetGridColumns = computed(() => {
      const starts = this.widgetColStarts();
      const spans = this.widgetColSpans();
      const result: Record<string, string> = {};
      for (const id of config.widgets) {
        result[id] = `${starts[id]} / span ${spans[id]}`;
      }
      return result;
    });

    const offset = config.canvasGridMinHeightOffset ?? 200;
    this.desktopGridMinHeight = computed(() => {
      const tops = this.widgetTops();
      const heights = this.widgetHeights();
      let max = 0;
      for (const id of config.widgets) {
        max = Math.max(max, tops[id] + heights[id]);
      }
      return max;
    });
    this.canvasGridMinHeight = computed(() => this.desktopGridMinHeight() + offset);
  }

  destroy(): void {
    this.abortCtrl.abort();
  }

  isWidgetLocked(id: string): boolean {
    return !!this.widgetLocked()[id];
  }

  toggleWidgetLock(id: string): void {
    this.widgetLocked.update((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      this.persistLockedState(next);
      return next;
    });
  }

  /** Clears every lock flag and overwrites session storage (used when a page disables desktop locking). */
  clearAllWidgetLocks(): void {
    this.widgetLocked.set({});
    this.persistLockedState({});
  }

  private get lockedKey(): string {
    return `${this.currentLayoutKey}__locked`;
  }

  private loadLockedState(): Record<string, boolean> {
    if (typeof sessionStorage === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(`${typeof this.config.layoutStorageKey === 'function' ? this.config.layoutStorageKey() : this.config.layoutStorageKey}__locked`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistLockedState(state: Record<string, boolean>): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(this.lockedKey, JSON.stringify(state));
    } catch { /* quota exceeded */ }
  }

  get currentLayoutKey(): string {
    const k = this.config.layoutStorageKey;
    return typeof k === 'function' ? k() : k;
  }

  get currentCanvasKey(): string {
    const k = this.config.canvasStorageKey;
    return typeof k === 'function' ? k() : k;
  }

  private get desktopDefaultsKey(): string {
    return `${this.currentLayoutKey}__customDefaults`;
  }

  private get canvasDefaultsKey(): string {
    return `${this.currentCanvasKey}__customDefaults`;
  }

  private get activeGridEl(): HTMLElement | undefined {
    return this.gridElAccessor();
  }

  private widgetOrderIndex(id: string): number {
    const i = this.config.widgets.indexOf(id);
    return i === -1 ? 9999 : i;
  }

  /**
   * Order for vertical gravity / compaction.
   * Legacy: primary `top` (from `_collisionSortBaseline` when set), tie `config.widgets` index.
   * With `desktopResizePriorityOrder`: primary reading order (list index ascending); unlisted ids
   * sort after listed ones by `(top, left)` then `widgetOrderIndex`.
   */
  private sortWidgetsForCollisionPass(widgets: string[], tops: Record<string, number>, anchorId?: string): string[] {
    const baseline = this._collisionSortBaseline;
    const topOf = (id: string) => (baseline ? (baseline[id] ?? tops[id]) : tops[id]);

    if (this.usesDesktopResizePriority()) {
      const lefts = this.widgetLefts();
      return [...widgets].sort((a, b) => {
        const pa = this.desktopResizePriorityIndex(a);
        const pb = this.desktopResizePriorityIndex(b);
        if (pa !== pb) return pa - pb;
        const ta = topOf(a);
        const tb = topOf(b);
        if (ta !== tb) return ta - tb;
        if (anchorId) {
          if (a === anchorId) return -1;
          if (b === anchorId) return 1;
        }
        const la = lefts[a] ?? 0;
        const lb = lefts[b] ?? 0;
        if (la !== lb) return la - lb;
        return this.widgetOrderIndex(a) - this.widgetOrderIndex(b);
      });
    }

    return [...widgets].sort((a, b) => {
      const ta = topOf(a);
      const tb = topOf(b);
      if (ta !== tb) return ta - tb;
      if (anchorId) {
        if (a === anchorId) return -1;
        if (b === anchorId) return 1;
      }
      return this.widgetOrderIndex(a) - this.widgetOrderIndex(b);
    });
  }

  private get currentStep(): number {
    if (this.isCanvasMode()) return DashboardLayoutEngine.CANVAS_STEP;
    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;
    return (containerWidth + DashboardLayoutEngine.GAP_PX) / 16;
  }

  /** Compute pixel left/width for a widget from its grid column position. */
  _computeDesktopPixelRect(id: string): { left: number; width: number } {
    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;
    const gap = DashboardLayoutEngine.GAP_PX;
    const step = (containerWidth + gap) / 16;
    const start = this.widgetColStarts()[id];
    const span = this.widgetColSpans()[id];
    return {
      left: Math.round((start - 1) * step),
      width: Math.round(span * step - gap),
    };
  }

  /** Compute pixel positions for ALL widgets from grid columns. Used for resize snapshots. */
  _computeAllDesktopPixelRects(): Record<string, { left: number; width: number }> {
    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;
    const gap = DashboardLayoutEngine.GAP_PX;
    const step = (containerWidth + gap) / 16;
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const result: Record<string, { left: number; width: number }> = {};
    for (const id of this.config.widgets) {
      result[id] = {
        left: Math.round((starts[id] - 1) * step),
        width: Math.round(spans[id] * step - gap),
      };
    }
    return result;
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
    const startCanvas = typeof window !== 'undefined' && window.innerWidth >= 1920;
    this.isMobile.set(startMobile);
    this.isCanvasMode.set(startCanvas);
    this.applyModeLayout();

    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(max-width: 767px)');
    const canvasQuery = window.matchMedia('(min-width: 1920px)');

    const onBreakpointChange = (): void => {
      const w = window.innerWidth;
      const wasMobile = this.isMobile();
      const wasCanvas = this.isCanvasMode();
      const nowMobile = w < 768;
      const nowCanvas = w >= 1920;

      if (nowMobile !== wasMobile) this.isMobile.set(nowMobile);
      if (nowCanvas !== wasCanvas) this.isCanvasMode.set(nowCanvas);

      if (wasCanvas && !nowCanvas) {
        this.persistCanvasLayout();
        if (this._savedDesktopForCanvas) {
          this.restoreSnapshot(this._savedDesktopForCanvas);
          this._savedDesktopForCanvas = null;
        } else {
          this.restoreDesktopLayout();
        }
        this.applyResponsiveReflow(w);
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
        this.persistMobileLayout();
        if (this.config.savesDesktopOnMobile && this._savedDesktopForMobile) {
          this.restoreSnapshot(this._savedDesktopForMobile);
          this._savedDesktopForMobile = null;
        } else {
          this.restoreDesktopLayout();
        }
        this.applyResponsiveReflow(w);
      } else if (!nowMobile && !nowCanvas) {
        if (!this._moveTarget && !this._resizeTarget) {
          this.applyResponsiveReflow(w);
        }
      }
    };

    mq.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    canvasQuery.addEventListener('change', onBreakpointChange, { signal: this.abortCtrl.signal });
    window.addEventListener('resize', onBreakpointChange, { signal: this.abortCtrl.signal });

    requestAnimationFrame(() => {
      if (!this.isMobile() && !this.isCanvasMode()) {
        this.applyResponsiveReflow(window.innerWidth);
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
    this.config.onWidgetSelect?.(id);
    if (this.isWidgetLocked(id)) return;
    event.preventDefault();
    this._collisionSortBaseline = { ...this.widgetTops() };
    this._moveTarget = id;
    this._dragDidMove = false;
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.widgetTops()[id];

    if (!this.isMobile() && !this.isCanvasMode()) {
      const allRects = this._computeAllDesktopPixelRects();
      const lefts: Record<string, number> = {};
      const widths: Record<string, number> = {};
      for (const wId of this.config.widgets) {
        lefts[wId] = allRects[wId].left;
        widths[wId] = allRects[wId].width;
      }
      this._dragStartLeft = allRects[id].left;
      this.widgetLefts.set(lefts);
      this.widgetPixelWidths.set(widths);
      this.dragLeft.set(allRects[id].left);
      this.dragWidth.set(allRects[id].width);
    } else {
      this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    }

    this.moveTargetId.set(id);
    this.bumpZIndex(id);
  }

  onWidgetHeaderTouchStart(id: string, event: TouchEvent): void {
    this.config.onWidgetSelect?.(id);
    if (this.isWidgetLocked(id)) return;
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
    this._collisionSortBaseline = { ...this.widgetTops() };
    this._moveTarget = id;
    this._dragDidMove = false;
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.widgetTops()[id];

    if (!this.isMobile() && !this.isCanvasMode()) {
      const allRects = this._computeAllDesktopPixelRects();
      const lefts: Record<string, number> = {};
      const widths: Record<string, number> = {};
      for (const wId of this.config.widgets) {
        lefts[wId] = allRects[wId].left;
        widths[wId] = allRects[wId].width;
      }
      this._dragStartLeft = allRects[id].left;
      this.widgetLefts.set(lefts);
      this.widgetPixelWidths.set(widths);
      this.dragLeft.set(allRects[id].left);
      this.dragWidth.set(allRects[id].width);
    } else {
      this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    }

    this.moveTargetId.set(id);
    this.bumpZIndex(id);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    if (this.isWidgetLocked(target)) return;
    event.preventDefault();
    event.stopPropagation();
    this._collisionSortBaseline = { ...this.widgetTops() };
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeEdge = edge;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    this._hResizeActive = dir === 'h';
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (dir === 'h' || dir === 'both') {
      if (!this.isMobile() && !this.isCanvasMode()) {
        const rect = this._computeDesktopPixelRect(target);
        this._resizeStartW = rect.width;
        this._resizeStartL = rect.left;
        this.widgetPixelWidths.update(w => ({ ...w, [target]: rect.width }));
        this.widgetLefts.update(l => ({ ...l, [target]: rect.left }));
      } else {
        this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
        this._resizeStartL = this.widgetLefts()[target] ?? 0;
      }
    }
    this.bumpZIndex(target);
    this.captureResizeSnapshot();
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    if (this.isWidgetLocked(target)) return;
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._collisionSortBaseline = { ...this.widgetTops() };
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeEdge = edge;
    this._resizeStartY = touch.clientY;
    this._resizeStartX = touch.clientX;
    this._hResizeActive = dir === 'h';
    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      this._resizeStartH = this.widgetHeights()[target] ?? 400;
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      if (!this.isMobile() && !this.isCanvasMode()) {
        const rect = this._computeDesktopPixelRect(target);
        this._resizeStartW = rect.width;
        this._resizeStartL = rect.left;
        this.widgetPixelWidths.update(w => ({ ...w, [target]: rect.width }));
        this.widgetLefts.update(l => ({ ...l, [target]: rect.left }));
      } else {
        this._resizeStartW = this.widgetPixelWidths()[target] ?? 600;
        this._resizeStartL = this.widgetLefts()[target] ?? 0;
      }
    }
    this.bumpZIndex(target);
    this.captureResizeSnapshot();
  }

  private captureResizeSnapshot(): void {
    if (this.isMobile() || this.isCanvasMode()) return;
    const dir = this._resizeDir;
    if (dir !== 'h' && dir !== 'both') return;
    this._resizeSnapshot = {};
    const rects = this._computeAllDesktopPixelRects();
    for (const id of this.config.widgets) {
      this._resizeSnapshot[id] = {
        left: rects[id].left,
        width: rects[id].width,
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
    const wasWidgetMove = !!this._moveTarget;
    const didMove = this._dragDidMove;
    const hadInteraction = wasWidgetMove || !!this._resizeTarget;
    const interactedId = this._moveTarget ?? this._resizeTarget;
    this._moveTarget = null;
    this._dragAxis = null;
    this._dragDidMove = false;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    this._resizeEdge = 'right';
    this._hResizeActive = false;
    this._resizeSnapshot = null;
    this._collisionSortBaseline = null;
    if (hadInteraction) {
      if (interactedId) {
        this._widgetLastInteraction[interactedId] = ++this._interactionSeq;
      }
      if (!this.isCanvasMode()) {
        if (wasWidgetMove && interactedId) {
          if (this.config.desktopSnapToDefaultLayoutAfterDrag) {
            this.applyDesktopDefaultLayoutAfterDrag();
          }
          this.compactAll(didMove ? interactedId : undefined);
        } else if (!wasWidgetMove) {
          if (this.config.desktopReflowOnResize) {
            this.syncColsFromPixelPositions();
            this.applyDesktopReflow();
          } else {
            this.compactAll();
          }
        }
      }
      if (this.isCanvasMode()) {
        this.syncColSpansFromPixelWidths();
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
    if (this.isCanvasMode()) {
      const saved = this._loadCustomCanvasDefaults();
      if (saved) {
        const tops = { ...this.widgetTops() };
        const heights = { ...this.widgetHeights() };
        const lefts = { ...this.widgetLefts() };
        const widths = { ...this.widgetPixelWidths() };
        for (const id of this.config.widgets) {
          if (saved['tops']?.[id] != null) tops[id] = saved['tops'][id];
          if (saved['heights']?.[id] != null) heights[id] = saved['heights'][id];
          if (saved['lefts']?.[id] != null) lefts[id] = saved['lefts'][id];
          if (saved['widths']?.[id] != null) widths[id] = saved['widths'][id];
        }
        this.widgetTops.set(tops);
        this.widgetHeights.set(heights);
        this.widgetLefts.set(lefts);
        this.widgetPixelWidths.set(widths);
      } else {
        this.applyCanvasDefaults();
      }
      localStorage.removeItem(this.currentCanvasKey);
      this.persistCanvasLayout();
    } else if (this.config.desktopSaveDefaultLayoutSizingOnly) {
      try {
        localStorage.removeItem(this.desktopDefaultsKey);
      } catch { /* ignore */ }
      this.widgetTops.set({ ...this.config.defaultTops });
      this.widgetHeights.set({ ...this.config.defaultHeights });
      this.widgetColStarts.set({ ...this.config.defaultColStarts });
      this.widgetColSpans.set({ ...this.config.defaultColSpans });
      this.widgetLefts.set({ ...(this.config.defaultLefts ?? {}) });
      this.widgetPixelWidths.set({ ...(this.config.defaultPixelWidths ?? {}) });
      const cols = typeof window !== 'undefined' ? this.getResponsiveColumns(window.innerWidth) : 0;
      const widest = this.widestDesktopColumns();
      if (cols > 0 && widest > 0 && cols < widest) {
        const flowOrder = this.resolveReflowPlacementOrder();
        this.reflowForColumns(cols, { flowOrder });
      }
      this.syncPixelWidthsFromCols();
      this.persistLayout();
    } else {
      const saved = this._loadCustomDesktopDefaults();
      if (saved) {
        this.widgetTops.set({ ...this.config.defaultTops, ...saved.tops });
        this.widgetHeights.set({ ...this.config.defaultHeights, ...saved.heights });
        this.widgetColStarts.set({ ...this.config.defaultColStarts, ...saved.colStarts });
        this.widgetColSpans.set({ ...this.config.defaultColSpans, ...saved.colSpans });
        this.widgetLefts.set({ ...(this.config.defaultLefts ?? {}), ...saved.lefts });
        this.widgetPixelWidths.set({ ...(this.config.defaultPixelWidths ?? {}), ...saved.widths });
      } else {
        this.widgetTops.set({ ...this.config.defaultTops });
        this.widgetHeights.set({ ...this.config.defaultHeights });
        this.widgetColStarts.set({ ...this.config.defaultColStarts });
        this.widgetColSpans.set({ ...this.config.defaultColSpans });
        this.widgetLefts.set({ ...(this.config.defaultLefts ?? {}) });
        this.widgetPixelWidths.set({ ...(this.config.defaultPixelWidths ?? {}) });
      }
      const cols = typeof window !== 'undefined' ? this.getResponsiveColumns(window.innerWidth) : 0;
      const widest = this.widestDesktopColumns();
      if (cols > 0 && widest > 0 && cols < widest) {
        const flowOrder = this.resolveReflowPlacementOrder();
        this.reflowForColumns(cols, { flowOrder });
      }
      this.persistLayout();
    }
  }

  saveAsDefaultLayout(): void {
    if (this.isCanvasMode()) {
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
        localStorage.setItem(this.canvasDefaultsKey, JSON.stringify(layout));
      } catch { /* quota exceeded */ }
    } else if (this.config.desktopSaveDefaultLayoutSizingOnly) {
      const payload: DesktopSizingDefaultsV2 = { v: DESKTOP_SIZING_DEFAULTS_VERSION, colSpans: {}, heights: {} };
      for (const id of this.config.widgets) {
        payload.colSpans[id] = this.widgetColSpans()[id];
        payload.heights[id] = this.widgetHeights()[id];
      }
      try {
        localStorage.setItem(this.desktopDefaultsKey, JSON.stringify(payload));
      } catch { /* quota exceeded */ }
    } else {
      const snapshot: LayoutSnapshot = {
        tops: {}, heights: {}, colStarts: {}, colSpans: {}, lefts: {}, widths: {},
      };
      for (const id of this.config.widgets) {
        snapshot.tops[id] = this.widgetTops()[id];
        snapshot.heights[id] = this.widgetHeights()[id];
        snapshot.colStarts[id] = this.widgetColStarts()[id];
        snapshot.colSpans[id] = this.widgetColSpans()[id];
        snapshot.lefts[id] = this.widgetLefts()[id];
        snapshot.widths[id] = this.widgetPixelWidths()[id];
      }
      try {
        localStorage.setItem(this.desktopDefaultsKey, JSON.stringify(snapshot));
      } catch { /* quota exceeded */ }
    }
  }

  private _loadCustomCanvasDefaults(): Record<string, Record<string, number>> | null {
    try {
      const raw = localStorage.getItem(this.canvasDefaultsKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private _loadCustomDesktopDefaults(): LayoutSnapshot | null {
    try {
      const raw = localStorage.getItem(this.desktopDefaultsKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private _loadDesktopSizingDefaultsV2(): DesktopSizingDefaultsV2 | null {
    if (!this.config.desktopSaveDefaultLayoutSizingOnly) return null;
    try {
      const raw = localStorage.getItem(this.desktopDefaultsKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null) return null;
      const o = parsed as Record<string, unknown>;
      if (o['v'] !== DESKTOP_SIZING_DEFAULTS_VERSION) return null;
      return {
        v: DESKTOP_SIZING_DEFAULTS_VERSION,
        colSpans: (o['colSpans'] as Record<string, number>) ?? {},
        heights: (o['heights'] as Record<string, number>) ?? {},
      };
    } catch {
      return null;
    }
  }

  private widestDesktopColumns(): number {
    const bp = this.config.responsiveBreakpoints;
    if (!bp?.length) return 0;
    return Math.max(...bp.map((b) => b.columns));
  }

  /** Priority-aware flow order; falls back to `config.widgets` when no priority list. */
  private resolveReflowPlacementOrder(): string[] | undefined {
    const explicit = this.config.desktopResizePriorityOrder;
    if (!explicit?.length) return undefined;
    const widgets = this.config.widgets;
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (id: string): void => {
      if (!widgets.includes(id) || seen.has(id)) return;
      seen.add(id);
      out.push(id);
    };
    for (const id of explicit) push(id);
    for (const id of widgets) push(id);
    return out;
  }

  private snapshotLockedLayout(locked: Record<string, boolean>): {
    colStarts: Record<string, number>;
    colSpans: Record<string, number>;
    tops: Record<string, number>;
    heights: Record<string, number>;
  } {
    const cs = this.widgetColStarts();
    const sp = this.widgetColSpans();
    const tp = this.widgetTops();
    const ht = this.widgetHeights();
    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    const tops: Record<string, number> = {};
    const heights: Record<string, number> = {};
    for (const id of this.config.widgets) {
      if (!locked[id]) continue;
      colStarts[id] = cs[id];
      colSpans[id] = sp[id];
      tops[id] = tp[id];
      heights[id] = ht[id];
    }
    return { colStarts, colSpans, tops, heights };
  }

  /**
   * Canonical grid placement + optional sizing overlay from "Save as Default" (v2 blob).
   * Used on projects desktop load and after drag when snap flag is set.
   */
  private reconcileDesktopCanonicalPlacementAndSavedSizing(): void {
    if (this.isMobile() || this.isCanvasMode()) return;

    const cfg = this.config;
    const widgets = cfg.widgets;
    const locked = this.widgetLocked();
    const snapLocked = this.snapshotLockedLayout(locked);
    const priorSpans = { ...this.widgetColSpans() };
    const priorHeights = { ...this.widgetHeights() };

    const colsRaw = this._currentDesktopColumns > 0
      ? this._currentDesktopColumns
      : (typeof window !== 'undefined' ? this.getResponsiveColumns(window.innerWidth) : 0);
    const widest = this.widestDesktopColumns();
    const cols = colsRaw > 0 ? colsRaw : (widest > 0 ? widest : 0);
    const isLiteral = widest <= 0 || cols >= widest;

    let colStarts: Record<string, number>;
    let colSpans: Record<string, number>;
    let tops: Record<string, number>;
    let heights: Record<string, number>;

    if (isLiteral) {
      colStarts = { ...this.widgetColStarts() };
      colSpans = { ...priorSpans };
      tops = { ...this.widgetTops() };
      heights = { ...priorHeights };
      for (const id of widgets) {
        if (locked[id]) continue;
        colStarts[id] = cfg.defaultColStarts[id];
        tops[id] = cfg.defaultTops[id];
      }
      for (const id of widgets) {
        if (!locked[id]) continue;
        colStarts[id] = snapLocked.colStarts[id];
        colSpans[id] = snapLocked.colSpans[id];
        tops[id] = snapLocked.tops[id];
        heights[id] = snapLocked.heights[id];
      }
    } else {
      this.widgetHeights.set({ ...priorHeights });
      const flowOrder = this.resolveReflowPlacementOrder();
      this.reflowForColumns(cols, { flowOrder });
      colStarts = { ...this.widgetColStarts() };
      colSpans = { ...this.widgetColSpans() };
      tops = { ...this.widgetTops() };
      heights = { ...this.widgetHeights() };
      for (const id of widgets) {
        if (!locked[id]) continue;
        colStarts[id] = snapLocked.colStarts[id];
        colSpans[id] = snapLocked.colSpans[id];
        tops[id] = snapLocked.tops[id];
        heights[id] = snapLocked.heights[id];
      }
    }

    if (cfg.desktopSaveDefaultLayoutSizingOnly) {
      const saved = this._loadDesktopSizingDefaultsV2();
      if (saved) {
        for (const id of widgets) {
          if (saved.colSpans[id] != null) colSpans[id] = saved.colSpans[id];
          if (saved.heights[id] != null) heights[id] = saved.heights[id];
        }
      }
    }

    this.enforceMaxColSpans(colSpans);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.syncPixelWidthsFromCols();
  }

  private applyDesktopDefaultLayoutAfterDrag(): void {
    if (!this.config.desktopSnapToDefaultLayoutAfterDrag) return;
    this.reconcileDesktopCanonicalPlacementAndSavedSizing();
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
      const initialCols = this.getResponsiveColumns(window.innerWidth);
      // Track breakpoint for templates (e.g. isNarrowGrid) but do NOT reflow here —
      // reflowForColumns replaces authored defaultColStarts/defaultTops with a flow
      // layout and was wiping the projects mosaic on every load. Responsive reflow
      // still runs from window resize when the column count actually changes.
      if (initialCols > 0) {
        this._currentDesktopColumns = initialCols;
        this.currentDesktopColumns.set(initialCols);
      }
      if (this.config.desktopSaveDefaultLayoutSizingOnly) {
        this.reconcileDesktopCanonicalPlacementAndSavedSizing();
        this.persistLayout();
      }
      this.compactAll();
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
    const colSpans = { ...snap.colSpans };
    const widths = { ...snap.widths };
    this.enforceMaxColSpans(colSpans, widths);
    this.widgetTops.set(snap.tops);
    this.widgetHeights.set(snap.heights);
    this.widgetColStarts.set(snap.colStarts);
    this.widgetColSpans.set(colSpans);
    this.widgetLefts.set(snap.lefts);
    this.widgetPixelWidths.set(widths);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;
    const widgets = this.config.widgets;

    if (this._dragAxis === 'free') {
      const gap = DashboardLayoutEngine.GAP_PX;
      const hStep = this.currentStep;
      const z = this.zoomFn();
      const rawTop = this._dragStartTop + (event.clientY - this._dragStartY) / z;
      const rawLeft = this._dragStartLeft + (event.clientX - this._dragStartX) / z;
      let newTop = Math.round(rawTop / gap) * gap;
      let newLeft = Math.round(rawLeft / hStep) * hStep;

      if (!this.isCanvasMode()) {
        const containerWidth = grid.clientWidth;
        const widgetWidth = this.widgetPixelWidths()[id] ?? 0;
        newTop = Math.max(0, newTop);
        newLeft = Math.max(0, Math.min(newLeft, containerWidth - widgetWidth));
      }

      const clamped = this.clampMoveAgainstLocked(id, newTop, newLeft);
      newTop = clamped.top;
      newLeft = clamped.left;

      this._dragDidMove = true;
      this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
      this.widgetLefts.update((l) => ({ ...l, [id]: newLeft }));
      if (!this.isCanvasMode()) {
        this.dragLeft.set(newLeft);
        const step = this.currentStep;
        const newColStart = Math.max(1, Math.round(newLeft / step) + 1);
        this.widgetColStarts.update(s => ({ ...s, [id]: newColStart }));
      }
      // Desktop free-drag: only move this widget until mouseup — live collision
      // recomputes every other tile each frame and reads as constant jumping.
      if (this.isCanvasMode() || this.isMobile()) {
        this.resolveCollisions(id, widgets);
      }
      return;
    }

    if (!this._dragAxis) {
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dy < 8) return;
      this._dragAxis = 'v';
    }

    const zV = this.zoomFn();
    let newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY) / zV);
    const currentLeft = this.widgetLefts()[id] ?? 0;
    const clamped = this.clampMoveAgainstLocked(id, newTop, currentLeft);
    newTop = clamped.top;

    this._dragDidMove = true;
    this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
    this.resolveCollisions(id, widgets);
  }

  private handleResize(event: MouseEvent): void {
    const id = this._resizeTarget!;
    const widgets = this.config.widgets;
    const gap = DashboardLayoutEngine.GAP_PX;
    const z = this.zoomFn();

    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY) / z);
      const newH = Math.round(raw / 16) * 16;
      this.widgetHeights.update((h) => ({ ...h, [id]: newH }));
    }

    if (this._resizeDir === 'both' && !this._hResizeActive) {
      const hDelta = Math.abs(event.clientX - this._resizeStartX) / z;
      if (hDelta >= this.currentStep / 2) {
        this._hResizeActive = true;
      }
    }

    if ((this._resizeDir === 'h' || this._resizeDir === 'both') && this._hResizeActive) {
      const hStep = this.currentStep;
      const minResizeCols = 4;
      const minW = minResizeCols * hStep - gap;

      if (this._resizeEdge === 'left') {
        const dx = (this._resizeStartX - event.clientX) / z;
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
        const raw = Math.max(200, this._resizeStartW + (event.clientX - this._resizeStartX) / z);
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

    this.clampAgainstLocked(id);

    this.resolveCollisions(id, widgets);

    this.clampAgainstLocked(id);

    if (this.isCanvasMode()) {
      this.syncColSpansFromPixelWidths();
    } else if (this._hResizeActive) {
      this.syncColsFromPixelPositions();
    }
  }

  private clampAgainstLocked(resizedId: string): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const locked = this.widgetLocked();

    const rTop = this.widgetTops()[resizedId];
    let rLeft = this.widgetLefts()[resizedId];
    let rWidth = this.widgetPixelWidths()[resizedId];
    let rHeight = this.widgetHeights()[resizedId];
    let changed = false;

    const hGrew = (this._resizeDir === 'v' || this._resizeDir === 'both')
      && rHeight > this._resizeStartH;
    const wGrewRight = (this._resizeDir === 'h' || this._resizeDir === 'both')
      && this._resizeEdge === 'right' && rWidth > this._resizeStartW;
    const wGrewLeft = (this._resizeDir === 'h' || this._resizeDir === 'both')
      && this._resizeEdge === 'left' && rLeft < this._resizeStartL;

    for (const otherId of this.config.widgets) {
      if (otherId === resizedId || !locked[otherId]) continue;

      const oTop = this.widgetTops()[otherId];
      const oLeft = this.widgetLefts()[otherId];
      const oWidth = this.widgetPixelWidths()[otherId];
      const oHeight = this.widgetHeights()[otherId];
      const oRight = oLeft + oWidth;
      const oBottom = oTop + oHeight;

      if (hGrew && oTop > rTop) {
        const hO = rLeft < oRight && oLeft < rLeft + rWidth;
        if (hO && rTop + rHeight + gap > oTop) {
          const maxH = oTop - gap - rTop;
          if (maxH > 0) { rHeight = Math.min(rHeight, maxH); changed = true; }
        }
      }

      if (wGrewRight && oLeft > rLeft) {
        const vO = rTop < oBottom && oTop < rTop + rHeight;
        if (vO && rLeft + rWidth + gap > oLeft) {
          const maxW = oLeft - gap - rLeft;
          if (maxW > 0) { rWidth = Math.min(rWidth, maxW); changed = true; }
        }
      }

      if (wGrewLeft && oRight < rLeft + rWidth) {
        const vO = rTop < oBottom && oTop < rTop + rHeight;
        if (vO && rLeft < oRight + gap) {
          const minL = oRight + gap;
          const rightEdge = rLeft + rWidth;
          rLeft = Math.max(rLeft, minL);
          rWidth = rightEdge - rLeft;
          changed = true;
        }
      }
    }

    if (changed) {
      this.widgetHeights.update((h) => ({ ...h, [resizedId]: rHeight }));
      this.widgetPixelWidths.update((w) => ({ ...w, [resizedId]: rWidth }));
      this.widgetLefts.update((l) => ({ ...l, [resizedId]: rLeft }));
    }
  }

  private clampMoveAgainstLocked(
    movedId: string,
    candidateTop: number,
    candidateLeft: number,
  ): { top: number; left: number } {
    const gap = DashboardLayoutEngine.GAP_PX;
    const locked = this.widgetLocked();
    const heights = this.widgetHeights();
    const widths = this.widgetPixelWidths();
    const tops = this.widgetTops();
    const lefts = this.widgetLefts();

    const mW = widths[movedId];
    const mH = heights[movedId];
    let mTop = candidateTop;
    let mLeft = candidateLeft;

    let safety = 0;
    const maxPasses = this.config.widgets.length * 4;

    let hadCorrection = true;
    while (hadCorrection && safety++ < maxPasses) {
      hadCorrection = false;
      for (const otherId of this.config.widgets) {
        if (otherId === movedId || !locked[otherId]) continue;

        const oTop = tops[otherId];
        const oLeft = lefts[otherId];
        const oW = widths[otherId];
        const oH = heights[otherId];
        const oRight = oLeft + oW;
        const oBottom = oTop + oH;

        const hOverlap = Math.min(mLeft + mW, oRight) - Math.max(mLeft, oLeft);
        const vOverlap = Math.min(mTop + mH, oBottom) - Math.max(mTop, oTop);
        if (hOverlap <= 0 || vOverlap <= 0) continue;

        const pushRight = oRight + gap - mLeft;
        const pushLeft = mLeft + mW + gap - oLeft;
        const pushDown = oBottom + gap - mTop;
        const pushUp = mTop + mH + gap - oTop;

        const minH = Math.min(pushRight, pushLeft);
        const minV = Math.min(pushDown, pushUp);

        if (minH <= minV) {
          if (pushRight <= pushLeft) {
            mLeft = oRight + gap;
          } else {
            mLeft = oLeft - mW - gap;
          }
        } else {
          if (pushDown <= pushUp) {
            mTop = oBottom + gap;
          } else {
            mTop = oTop - mH - gap;
          }
        }
        hadCorrection = true;
      }
    }

    return { top: mTop, left: mLeft };
  }

  private resolveCollisions(movedId: string, widgets: string[]): void {
    if (this.isCanvasMode()) {
      this.resolveCanvasPush(movedId, widgets);
      return;
    }

    const gap = DashboardLayoutEngine.GAP_PX;
    const mobile = this.isMobile();

    const isHResize = !mobile && this._resizeTarget === movedId
      && this._hResizeActive
      && this._resizeSnapshot != null;

    if (isHResize) {
      this.applyResizePushSqueeze(movedId, widgets);
      this.syncColsFromPixelPositions();

      if (this.config.desktopReflowOnResize) {
        this.applyDesktopReflow();
        return;
      }
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
      const colStarts = this.widgetColStarts();
      const colSpans = this.widgetColSpans();
      colOverlap = (a, b) => {
        const aEnd = colStarts[a] + colSpans[a];
        const bEnd = colStarts[b] + colSpans[b];
        return colStarts[a] < bEnd && colStarts[b] < aEnd;
      };
    }

    const sorted = this.sortWidgetsForCollisionPass(widgets, tops);
    const placed: string[] = [movedId];

    const activeSet = isHResize ? this._pushSqueezeActive : new Set<string>();
    if (isHResize) {
      for (const id of sorted) {
        if (id === movedId || !activeSet.has(id)) continue;
        placed.push(id);
      }
    }

    const locked = this.widgetLocked();
    for (const id of sorted) {
      if (id === movedId || activeSet.has(id)) continue;
      if (locked[id]) { placed.push(id); continue; }
      let y = tops[id];
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
    const tops = { ...this.widgetTops() };
    const lefts = { ...this.widgetLefts() };
    const heights = this.widgetHeights();
    const widths = this.widgetPixelWidths();
    const locked = this.widgetLocked();

    const rects: Record<string, WidgetRect> = {};
    for (const id of widgets) {
      rects[id] = { left: lefts[id], top: tops[id], width: widths[id], height: heights[id] };
    }

    runCanvasPushBfs(movedId, rects, locked, DashboardLayoutEngine.GAP_PX);

    let topsChanged = false;
    let leftsChanged = false;
    for (const id of widgets) {
      if (rects[id].top !== tops[id]) { tops[id] = rects[id].top; topsChanged = true; }
      if (rects[id].left !== lefts[id]) { lefts[id] = rects[id].left; leftsChanged = true; }
    }

    if (topsChanged) this.widgetTops.set(tops);
    if (leftsChanged) this.widgetLefts.set(lefts);
  }

  private usesDesktopResizePriority(): boolean {
    return (this.config.desktopResizePriorityOrder?.length ?? 0) > 0;
  }

  /** Higher index = lower layout priority (yields first on squeeze/relocate). */
  private desktopResizePriorityIndex(id: string): number {
    const order = this.config.desktopResizePriorityOrder!;
    const i = order.indexOf(id);
    return i < 0 ? order.length + 100 : i;
  }

  /**
   * Order in which to apply width squeeze toward minWidth. Legacy: spatial tail edge first.
   * Priority mode: lowest-priority widget first.
   */
  private squeezeOrderForNeighbors(active: string[], edge: 'left' | 'right'): string[] {
    if (this.usesDesktopResizePriority()) {
      return [...active].sort(
        (a, b) => this.desktopResizePriorityIndex(b) - this.desktopResizePriorityIndex(a),
      );
    }
    if (edge === 'right') {
      return [...active].reverse();
    }
    const out: string[] = [];
    for (let i = active.length - 1; i >= 0; i--) {
      out.push(active[i]!);
    }
    return out;
  }

  /** Widget to reset to snapshot and remove from the active chain when overflow cannot be squeezed away. */
  private relocateTargetFromNeighbors(active: string[]): string {
    if (this.usesDesktopResizePriority()) {
      let worst = active[0]!;
      let worstI = this.desktopResizePriorityIndex(worst);
      for (let k = 1; k < active.length; k++) {
        const id = active[k]!;
        const i = this.desktopResizePriorityIndex(id);
        if (i > worstI) {
          worst = id;
          worstI = i;
        }
      }
      return worst;
    }
    return active[active.length - 1]!;
  }

  /**
   * Two-phase push-then-squeeze for desktop horizontal resize.
   *
   * Phase 1 — Push all same-row neighbors outward, keeping original widths.
   * Phase 2 — If the cascade overflows the container boundary, squeeze inward
   *           down to the 4-col minimum: legacy mode uses the spatial far end first;
   *           with `desktopResizePriorityOrder`, lowest-priority neighbors yield first.
   *           When all neighbors are at minimum and overflow remains, relocate the
   *           same priority-chosen widget and re-run with the remaining set.
   *
   * When `desktopResizePriorityOrder` is set, squeeze/relocate use **priority** instead of
   * pure spatial tail edge ordering so high-priority tiles (e.g. hero) stay visually anchored.
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

    const locked = this.widgetLocked();
    let finalActive: string[] = [];

    if (this._resizeEdge === 'left') {
      const rLeft = lefts[resizedId];

      const leftNeighbors: string[] = [];
      for (const id of this.config.widgets) {
        if (id === resizedId || locked[id]) continue;
        const sTop = snap[id].top;
        const sBottom = sTop + snap[id].height;
        if (sTop >= rTop - gap && sTop < rBottom && sBottom > rTop && (snap[id].left + snap[id].width) <= (snap[resizedId].left + snap[resizedId].width)) {
          leftNeighbors.push(id);
        }
      }
      leftNeighbors.sort((a, b) => snap[b].left - snap[a].left);

      let active = [...leftNeighbors];
      let settled = false;
      let maxIter = active.length + 1;

      while (!settled && maxIter-- > 0) {
        settled = true;

        for (const id of active) { widths[id] = snap[id].width; }

        let lastLeft = 0;
        {
          let cur = rLeft - gap;
          for (const id of active) {
            const snapRight = snap[id].left + snap[id].width;
            if (snapRight <= cur) {
              lastLeft = snap[id].left;
              cur = snap[id].left - gap;
            } else {
              lastLeft = cur - snap[id].width;
              cur = lastLeft - gap;
            }
          }
        }
        let underflow = Math.max(0, -lastLeft);

        if (underflow > 0) {
          for (const id of this.squeezeOrderForNeighbors(active, 'left')) {
            if (underflow <= 0) break;
            const canSqueeze = Math.max(snap[id].width - minWidth, 0);
            const squeeze = Math.min(canSqueeze, underflow);
            if (squeeze > 0) {
              widths[id] -= squeeze;
              underflow -= squeeze;
            }
          }

          if (underflow > 0) {
            const relocateId = this.relocateTargetFromNeighbors(active);
            lefts[relocateId] = snap[relocateId].left;
            widths[relocateId] = snap[relocateId].width;
            active = active.filter((x) => x !== relocateId);
            settled = false;
            continue;
          }
        }

        let cursor = rLeft - gap;
        for (const id of active) {
          const snapRight = snap[id].left + snap[id].width;
          if (snapRight <= cursor && widths[id] === snap[id].width) {
            lefts[id] = snap[id].left;
            cursor = snap[id].left - gap;
          } else {
            lefts[id] = cursor - widths[id];
            cursor = lefts[id] - gap;
          }
        }
      }
      finalActive = active;
    } else {
      const rRight = lefts[resizedId] + widths[resizedId];

      const rightNeighbors: string[] = [];
      for (const id of this.config.widgets) {
        if (id === resizedId || locked[id]) continue;
        const sTop = snap[id].top;
        const sBottom = sTop + snap[id].height;
        if (sTop >= rTop - gap && sTop < rBottom && sBottom > rTop && snap[id].left >= lefts[resizedId]) {
          rightNeighbors.push(id);
        }
      }
      rightNeighbors.sort((a, b) => snap[a].left - snap[b].left);

      let active = [...rightNeighbors];
      let settled = false;
      let maxIter = active.length + 1;

      while (!settled && maxIter-- > 0) {
        settled = true;

        for (const id of active) { widths[id] = snap[id].width; }

        let lastRight = 0;
        {
          let cur = rRight + gap;
          for (const id of active) {
            if (cur <= snap[id].left) {
              lastRight = snap[id].left + snap[id].width;
              cur = lastRight + gap;
            } else {
              lastRight = cur + snap[id].width;
              cur = lastRight + gap;
            }
          }
        }
        let overflow = Math.max(0, lastRight - containerWidth);

        if (overflow > 0) {
          for (const id of this.squeezeOrderForNeighbors(active, 'right')) {
            if (overflow <= 0) break;
            const canSqueeze = Math.max(snap[id].width - minWidth, 0);
            const squeeze = Math.min(canSqueeze, overflow);
            if (squeeze > 0) {
              widths[id] -= squeeze;
              overflow -= squeeze;
            }
          }

          if (overflow > 0) {
            const relocateId = this.relocateTargetFromNeighbors(active);
            lefts[relocateId] = snap[relocateId].left;
            widths[relocateId] = snap[relocateId].width;
            active = active.filter((x) => x !== relocateId);
            settled = false;
            continue;
          }
        }

        let cursor = rRight + gap;
        for (const id of active) {
          if (cursor <= snap[id].left && widths[id] === snap[id].width) {
            lefts[id] = snap[id].left;
            cursor = snap[id].left + widths[id] + gap;
          } else {
            lefts[id] = cursor;
            cursor = lefts[id] + widths[id] + gap;
          }
        }
      }
      finalActive = active;
    }

    this._pushSqueezeActive = new Set(finalActive);

    this.widgetLefts.set(lefts);
    this.widgetPixelWidths.set(widths);
  }

  /**
   * LTR-TTB reflow: place all widgets in priority order, flowing left-to-right
   * then top-to-bottom. Uses current `widgetColSpans` and `widgetHeights` to
   * determine how widgets pack into 16-column lines.
   */
  applyDesktopReflow(): void {
    const order = this.config.desktopResizePriorityOrder ?? this.config.widgets;
    const totalCols = 16;
    const gap = DashboardLayoutEngine.GAP_PX;
    const colSpans = { ...this.widgetColSpans() };
    const heights = this.widgetHeights();

    const newColStarts: Record<string, number> = {};
    const newTops: Record<string, number> = {};

    let cursor = 1;
    let lineTop = 0;
    let lineMaxHeight = 0;

    for (const id of order) {
      const span = colSpans[id] ?? 4;
      const h = heights[id] ?? 0;

      if (span >= totalCols) {
        if (lineMaxHeight > 0) {
          lineTop += lineMaxHeight + gap;
        }
        newColStarts[id] = 1;
        newTops[id] = lineTop;
        lineTop += (h > 0 ? h + gap : 0);
        cursor = 1;
        lineMaxHeight = 0;
        continue;
      }

      if (cursor + span - 1 > totalCols) {
        lineTop += lineMaxHeight + gap;
        cursor = 1;
        lineMaxHeight = 0;
      }

      newColStarts[id] = cursor;
      newTops[id] = lineTop;
      cursor += span;
      lineMaxHeight = Math.max(lineMaxHeight, h);
    }

    this.widgetColStarts.set(newColStarts);
    this.widgetTops.set(newTops);
    this.syncPixelWidthsFromCols();
  }

  pushFromWidget(widgetId: string): void {
    if (this.isCanvasMode()) {
      this.resolveCanvasPush(widgetId, this.config.widgets);
    }
  }

  compactAll(anchorId?: string): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const widgets = this.config.widgets;
    const mobile = this.isMobile();

    const lockedState = this.widgetLocked();
    if (mobile) {
      const sorted = this.sortWidgetsForCollisionPass(widgets, tops, anchorId);
      let y = 0;
      for (const id of sorted) {
        if (heights[id] <= 0) continue;
        if (!lockedState[id]) tops[id] = y;
        y = tops[id] + heights[id] + gap;
      }
      this.widgetTops.set(tops);
      return;
    }

    const colStarts = this.widgetColStarts();
    const colSpans = this.widgetColSpans();
    const colOverlap = (a: string, b: string) => {
      const aEnd = colStarts[a] + colSpans[a];
      const bEnd = colStarts[b] + colSpans[b];
      return colStarts[a] < bEnd && colStarts[b] < aEnd;
    };

    const sorted = this.sortWidgetsForCollisionPass(widgets, tops, anchorId);
    const placed: string[] = [];

    for (const id of sorted) {
      if (lockedState[id]) { placed.push(id); continue; }
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
    const ordered = this.resolveReflowPlacementOrder() ?? this.config.widgets;

    let y = 0;
    for (const id of ordered) {
      if (heights[id] <= 0) continue;
      tops[id] = y;
      colStarts[id] = 1;
      colSpans[id] = 16;
      y += heights[id] + gap;
    }

    this.widgetTops.set(tops);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
  }

  private applyResponsiveReflow(width: number): void {
    const cols = this.getResponsiveColumns(width);
    if (cols > 0 && cols !== this._currentDesktopColumns) {
      const flowOrder = this.resolveReflowPlacementOrder();
      this.reflowForColumns(cols, { flowOrder });
    }
  }

  getResponsiveColumns(width: number): number {
    const bp = this.config.responsiveBreakpoints;
    if (!bp || bp.length === 0) return 0;
    for (const entry of bp) {
      if (width >= entry.minWidth) return entry.columns;
    }
    return 0;
  }

  reflowForColumns(columns: number, options?: { flowOrder?: string[] }): void {
    const gap = DashboardLayoutEngine.GAP_PX;
    const heights = { ...this.widgetHeights() };
    const locked = this.widgetLocked();
    const uniformH = this.config.responsiveUniformHeight?.[columns];
    const tops: Record<string, number> = {};
    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};

    const baseSpan = Math.floor(16 / columns);
    const ordered = options?.flowOrder?.length
      ? [...options.flowOrder]
      : [...this.config.widgets];
    const seen = new Set<string>();
    const flowWidgets: string[] = [];
    for (const id of ordered) {
      if (!this.config.widgets.includes(id) || seen.has(id)) continue;
      seen.add(id);
      if (heights[id] > 0 && !locked[id]) flowWidgets.push(id);
    }
    for (const id of this.config.widgets) {
      if (seen.has(id)) continue;
      if (heights[id] > 0 && !locked[id]) flowWidgets.push(id);
    }

    if (uniformH) {
      for (const id of flowWidgets) heights[id] = uniformH;
    }

    let col = 0;
    let rowTop = 0;
    let rowMaxH = 0;

    for (const id of flowWidgets) {
      const overrideSlots = this.config.responsiveSpanOverrides?.[id]?.[columns];
      const defaultSpan = this.config.defaultColSpans[id] ?? baseSpan;
      const slots = overrideSlots ?? Math.min(columns, Math.max(1, Math.round(defaultSpan / baseSpan)));
      const widgetSpan = slots * baseSpan;

      if (col + slots > columns) {
        rowTop += rowMaxH + gap;
        col = 0;
        rowMaxH = 0;
      }
      colStarts[id] = col * baseSpan + 1;
      colSpans[id] = widgetSpan;
      tops[id] = rowTop;
      rowMaxH = Math.max(rowMaxH, heights[id]);
      col += slots;
    }

    for (const id of this.config.widgets) {
      if (heights[id] <= 0 || locked[id]) {
        colStarts[id] = this.widgetColStarts()[id];
        colSpans[id] = this.widgetColSpans()[id];
        tops[id] = this.widgetTops()[id];
      }
    }

    this._currentDesktopColumns = columns;
    this.currentDesktopColumns.set(columns);
    this.widgetTops.set(tops);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    if (uniformH) this.widgetHeights.set(heights);
  }

  private enforceMaxColSpans(
    colSpans: Record<string, number>,
    pixelWidths?: Record<string, number>,
  ): void {
    const maxSpans = this.config.widgetMaxColSpans;
    if (!maxSpans) return;
    const grid = this.activeGridEl;
    const containerWidth = grid ? grid.clientWidth : 1280;
    const step = (containerWidth + DashboardLayoutEngine.GAP_PX) / 16;
    const gap = DashboardLayoutEngine.GAP_PX;
    for (const [id, max] of Object.entries(maxSpans)) {
      if (colSpans[id] != null && colSpans[id] > max) {
        colSpans[id] = max;
      }
      if (pixelWidths) {
        const maxPx = Math.round(max * step - gap);
        if (pixelWidths[id] != null && pixelWidths[id] > maxPx) {
          pixelWidths[id] = maxPx;
        }
      }
    }
  }

  private syncColSpansFromPixelWidths(): void {
    const widths = this.widgetPixelWidths();
    const step = this.currentStep;
    const gap = DashboardLayoutEngine.GAP_PX;
    const minSpan = this.config.minColSpan ?? 4;
    const spans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      const perWidget = this.config.widgetMinColSpans?.[id] ?? minSpan;
      const maxSpan = this.config.widgetMaxColSpans?.[id] ?? 16;
      spans[id] = Math.max(perWidget, Math.min(maxSpan, Math.round((widths[id] + gap) / step)));
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
    const existingStarts = this.widgetColStarts();
    const existingSpans = this.widgetColSpans();

    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      const maxSpan = this.config.widgetMaxColSpans?.[id] ?? 16;
      const left = this.widgetLefts()[id];
      const width = this.widgetPixelWidths()[id];
      if (left == null || width == null) {
        colStarts[id] = existingStarts[id] ?? 1;
        colSpans[id] = existingSpans[id] ?? 4;
      } else {
        colStarts[id] = Math.max(1, Math.round(left / step) + 1);
        colSpans[id] = Math.max(4, Math.min(maxSpan, Math.round((width + gap) / step)));
      }
    }

    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
  }

  persistLayout(): void {
    this.persistLayoutAs(this.isMobile());
  }

  private persistMobileLayout(): void {
    this.persistLayoutAs(true);
  }

  private persistLayoutAs(mobile: boolean): void {
    const tops: Record<string, number> = {};
    const heights: Record<string, number> = {};
    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    for (const id of this.config.widgets) {
      tops[id] = this.widgetTops()[id];
      heights[id] = this.widgetHeights()[id];
      colStarts[id] = this.widgetColStarts()[id];
      colSpans[id] = this.widgetColSpans()[id];
    }
    this.layoutService.save(this.currentLayoutKey, mobile, {
      tops,
      heights,
      colStarts,
      colSpans,
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
      localStorage.setItem(this.currentCanvasKey, JSON.stringify(layout));
    } catch { /* quota exceeded */ }
  }

  restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load(this.currentLayoutKey, false);
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
    this.enforceMaxColSpans(colSpans);
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    return true;
  }

  restoreMobileLayout(): boolean {
    const saved = this.layoutService.load(this.currentLayoutKey, true);
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
      const raw = localStorage.getItem(this.currentCanvasKey);
      if (!raw) return false;
      const layout = JSON.parse(raw);
      const tops = { ...this.widgetTops() };
      const heights = { ...this.widgetHeights() };
      const lefts = { ...this.widgetLefts() };
      const widths = { ...this.widgetPixelWidths() };
      const colSpans = { ...this.widgetColSpans() };
      for (const id of this.config.widgets) {
        if (layout.tops?.[id] != null) tops[id] = layout.tops[id];
        if (layout.heights?.[id] != null) heights[id] = layout.heights[id];
        if (layout.lefts?.[id] != null) lefts[id] = layout.lefts[id];
        if (layout.widths?.[id] != null) widths[id] = layout.widths[id];
      }
      this.enforceMaxColSpans(colSpans, widths);
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
    const g = DashboardLayoutEngine.GAP_PX;
    const snapGrid = (v: number) => Math.round(v / g) * g;

    this.widgetLefts.set({ ...this.config.canvasDefaultLefts });
    this.widgetPixelWidths.set({ ...this.config.canvasDefaultPixelWidths });
    if (this.config.canvasDefaultTops) {
      const snapped: Record<string, number> = {};
      for (const [k, v] of Object.entries(this.config.canvasDefaultTops)) {
        snapped[k] = snapGrid(v);
      }
      this.widgetTops.set(snapped);
    }
    if (this.config.canvasDefaultHeights) {
      const snapped: Record<string, number> = {};
      for (const [k, v] of Object.entries(this.config.canvasDefaultHeights)) {
        snapped[k] = snapGrid(v);
      }
      this.widgetHeights.set(snapped);
    }
    this.syncColSpansFromPixelWidths();
  }

  private cleanupCanvasOverlaps(): void {
    if (!this.isCanvasMode()) return;
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
