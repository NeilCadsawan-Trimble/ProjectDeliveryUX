import { signal, computed, type WritableSignal, type Signal } from '@angular/core';
import { runCanvasPushBfs } from './canvas-push';
import type { CanvasItemHost } from './canvas-item-host';

export interface TileRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface TileCanvasConfig {
  storageKey: string | (() => string);
  lockedIds: string[];
  tileWidth: number;
  tileHeight: number;
  columns: number;
  gap: number;
  offsetTop: number;
  offsetLeft: number;
  detailWidth?: number;
  detailHeight?: number;
  tileSizeOverrides?: Record<string, { width: number; height: number; columns?: number }>;
  heightOnlyResizeIds?: Set<string>;
}

export interface TileDetailView {
  type: 'rfi' | 'submittal' | 'dailyReport' | 'punchItem' | 'inspection' | 'changeOrder';
  item: unknown;
}

/**
 * Manages a canvas of absolutely-positioned tile widgets with BFS push-squeeze
 * collision resolution and multi-detail widget expansion.
 */
export class SubpageTileCanvas implements CanvasItemHost {
  static readonly CANVAS_STEP = 81;

  readonly positions: WritableSignal<Record<string, TileRect>>;
  readonly locked: WritableSignal<Record<string, boolean>>;
  readonly zIndices: WritableSignal<Record<string, number>>;
  readonly moveTargetId: WritableSignal<string | null>;
  readonly detailViews: WritableSignal<Record<string, TileDetailView>>;

  readonly hasDetails: Signal<boolean>;
  readonly canvasMinHeight: Signal<number>;

  readonly config: TileCanvasConfig;

  private _moveTarget: string | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;
  private _dragStartLeft = 0;

  private _resizeTarget: string | null = null;
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartW = 0;
  private _resizeStartH = 0;

  private _zCounter = 0;
  private _originalRects: Record<string, TileRect> = {};
  private _baselineSnapshot: Record<string, TileRect> | null = null;

  gridElAccessor: () => HTMLElement | undefined = () => undefined;

  constructor(config: TileCanvasConfig) {
    this.config = config;

    const saved = this.loadLayout();
    this.positions = signal<Record<string, TileRect>>(saved ?? {});
    this.locked = signal<Record<string, boolean>>(
      config.lockedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {} as Record<string, boolean>)
    );
    this.zIndices = signal<Record<string, number>>({});
    this.moveTargetId = signal<string | null>(null);
    this.detailViews = signal<Record<string, TileDetailView>>({});

    this.hasDetails = computed(() => Object.keys(this.detailViews()).length > 0);
    this.canvasMinHeight = computed(() => {
      const pos = this.positions();
      let max = 0;
      for (const id of Object.keys(pos)) {
        max = Math.max(max, pos[id].top + pos[id].height);
      }
      return max + 200;
    });
  }

  private get storageKey(): string {
    const k = this.config.storageKey;
    return typeof k === 'function' ? k() : k;
  }

  private loadLayout(): Record<string, TileRect> | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persistLayout(): void {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.positions()));
    } catch { /* quota exceeded */ }
  }

  setTiles(tileIds: string[], lockedRects: Record<string, TileRect>): void {
    const existing = this.positions();
    const next: Record<string, TileRect> = {};

    for (const [id, rect] of Object.entries(lockedRects)) {
      next[id] = rect;
    }

    const { tileWidth, tileHeight, columns, gap, offsetTop, offsetLeft, tileSizeOverrides } = this.config;

    if (tileSizeOverrides && Object.keys(tileSizeOverrides).length > 0) {
      this._layoutWithOverrides(tileIds, lockedRects, existing, next, tileSizeOverrides);
    } else {
      let idx = 0;
      for (const id of tileIds) {
        if (existing[id] && !lockedRects[id]) {
          next[id] = existing[id];
        } else if (!lockedRects[id]) {
          const col = idx % columns;
          const row = Math.floor(idx / columns);
          next[id] = {
            top: offsetTop + row * (tileHeight + gap),
            left: offsetLeft + col * (tileWidth + gap),
            width: tileWidth,
            height: tileHeight,
          };
        }
        if (!lockedRects[id]) idx++;
      }
    }

    this.positions.set(next);
    this.persistLayout();
  }

  private _layoutWithOverrides(
    tileIds: string[],
    lockedRects: Record<string, TileRect>,
    existing: Record<string, TileRect>,
    next: Record<string, TileRect>,
    overrides: Record<string, { width: number; height: number; columns?: number }>,
  ): void {
    const { tileWidth, tileHeight, columns, gap, offsetTop, offsetLeft } = this.config;
    let curTop = offsetTop;
    let rowLeft = offsetLeft;
    let rowMaxH = 0;
    let rowColsUsed = 0;

    for (const id of tileIds) {
      if (lockedRects[id]) continue;
      if (existing[id]) {
        next[id] = existing[id];
        continue;
      }

      const ov = overrides[id];
      const w = ov?.width ?? tileWidth;
      const h = ov?.height ?? tileHeight;
      const spanCols = ov?.columns ?? 1;

      if (spanCols >= columns || rowColsUsed + spanCols > columns) {
        if (rowColsUsed > 0) {
          curTop += rowMaxH + gap;
          rowLeft = offsetLeft;
          rowMaxH = 0;
          rowColsUsed = 0;
        }
        next[id] = { top: curTop, left: offsetLeft, width: w, height: h };
        if (spanCols >= columns) {
          curTop += h + gap;
          rowLeft = offsetLeft;
          rowMaxH = 0;
          rowColsUsed = 0;
        } else {
          rowLeft = offsetLeft + w + gap;
          rowMaxH = h;
          rowColsUsed = spanCols;
        }
      } else {
        next[id] = { top: curTop, left: rowLeft, width: w, height: h };
        rowLeft += w + gap;
        rowMaxH = Math.max(rowMaxH, h);
        rowColsUsed += spanCols;
      }
    }
  }

  onTileMouseDown(id: string, event: MouseEvent): void {
    if (this.locked()[id]) return;
    event.preventDefault();
    event.stopPropagation();

    const pos = this.positions()[id];
    if (!pos) return;

    this._moveTarget = id;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = pos.top;
    this._dragStartLeft = pos.left;
    this.moveTargetId.set(id);

    this._zCounter++;
    this.zIndices.update(z => ({ ...z, [id]: this._zCounter }));
  }

  onTileResizeMouseDown(id: string, event: MouseEvent): void {
    if (this.locked()[id]) return;
    event.preventDefault();
    event.stopPropagation();

    const pos = this.positions()[id];
    if (!pos) return;

    this._resizeTarget = id;
    this._resizeStartX = event.clientX;
    this._resizeStartY = event.clientY;
    this._resizeStartW = pos.width;
    this._resizeStartH = pos.height;

    this._zCounter++;
    this.zIndices.update(z => ({ ...z, [id]: this._zCounter }));
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleMove(event);
    } else if (this._resizeTarget) {
      this.handleResize(event);
    }
  }

  onDocumentMouseUp(): void {
    const had = !!this._moveTarget || !!this._resizeTarget;
    const interactedId = this._moveTarget ?? this._resizeTarget;
    this._moveTarget = null;
    this._resizeTarget = null;
    this.moveTargetId.set(null);
    if (had && interactedId) {
      this.resolveCanvasPush(interactedId);
      this.persistLayout();
    }
  }

  get isInteracting(): boolean {
    return !!this._moveTarget || !!this._resizeTarget;
  }

  toggleLock(id: string): void {
    this.locked.update(l => ({ ...l, [id]: !l[id] }));
  }

  // --- Detail widget expansion ---

  openDetail(tileId: string, detail: TileDetailView): void {
    const pos = this.positions();
    const current = pos[tileId];
    if (!current) return;

    if (!this._baselineSnapshot) {
      this._baselineSnapshot = { ...pos };
    }

    this._originalRects[tileId] = { ...current };
    this.detailViews.update(v => ({ ...v, [tileId]: detail }));

    const detailW = this.config.detailWidth ?? 875;
    const detailH = this.config.detailHeight ?? 1000;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.positions.update(p => ({
          ...p,
          [tileId]: { ...p[tileId], width: detailW, height: detailH },
        }));
        this.resolveCanvasPush(tileId, { skipMoverPushback: true });
        this.persistLayout();
      });
    });
  }

  closeDetail(tileId: string): void {
    const orig = this._originalRects[tileId];
    if (!orig) return;

    this.positions.update(p => ({
      ...p,
      [tileId]: { ...orig },
    }));

    setTimeout(() => {
      this.detailViews.update(v => {
        const next = { ...v };
        delete next[tileId];
        return next;
      });
      delete this._originalRects[tileId];

      const remaining = this.detailViews();
      const remainingIds = Object.keys(remaining);
      const baseline = this._baselineSnapshot;

      if (baseline) {
        const locked = this.locked();
        const pos = { ...this.positions() };
        const detailW = this.config.detailWidth ?? 875;
        const detailH = this.config.detailHeight ?? 1000;

        for (const wid of Object.keys(pos)) {
          if (locked[wid]) continue;
          if (baseline[wid]) {
            if (remainingIds.includes(wid)) {
              pos[wid] = {
                top: baseline[wid].top,
                left: baseline[wid].left,
                width: detailW,
                height: detailH,
              };
              this._originalRects[wid] = { ...baseline[wid] };
            } else {
              pos[wid] = { ...baseline[wid] };
            }
          }
        }
        this.positions.set(pos);
      }

      for (const detailId of remainingIds) {
        this.resolveCanvasPush(detailId, { skipMoverPushback: true });
      }

      if (remainingIds.length === 0) {
        this._baselineSnapshot = null;
      }

      this.persistLayout();
    }, 350);
  }

  updateDetailItem(tileId: string, updatedItem: unknown): void {
    const views = this.detailViews();
    const current = views[tileId];
    if (!current) return;
    this.detailViews.update(v => ({ ...v, [tileId]: { ...current, item: updatedItem } }));
  }

  // --- BFS push-squeeze collision resolution ---

  pushFromTile(tileId: string): void {
    this.resolveCanvasPush(tileId);
    this.persistLayout();
  }

  private resolveCanvasPush(movedId: string, opts?: { skipMoverPushback?: boolean }): void {
    const pos = { ...this.positions() };
    const locked = this.locked();
    runCanvasPushBfs(movedId, pos, locked, this.config.gap, opts);
    this.positions.set(pos);
  }

  private clampMoveAgainstLocked(
    movedId: string,
    candidateTop: number,
    candidateLeft: number,
  ): { top: number; left: number } {
    const gap = this.config.gap;
    const locked = this.locked();
    const pos = this.positions();

    const mRect = pos[movedId];
    if (!mRect) return { top: candidateTop, left: candidateLeft };
    const mW = mRect.width;
    const mH = mRect.height;
    let mTop = candidateTop;
    let mLeft = candidateLeft;

    let hadCorrection = true;
    let safety = 0;
    const maxPasses = Object.keys(pos).length * 4;

    while (hadCorrection && safety++ < maxPasses) {
      hadCorrection = false;
      for (const otherId of Object.keys(pos)) {
        if (otherId === movedId || !locked[otherId]) continue;

        const o = pos[otherId];
        const oRight = o.left + o.width;
        const oBottom = o.top + o.height;

        const hOverlap = Math.min(mLeft + mW, oRight) - Math.max(mLeft, o.left);
        const vOverlap = Math.min(mTop + mH, oBottom) - Math.max(mTop, o.top);
        if (hOverlap <= 0 || vOverlap <= 0) continue;

        const pushRight = oRight + gap - mLeft;
        const pushLeft = mLeft + mW + gap - o.left;
        const pushDown = oBottom + gap - mTop;
        const pushUp = mTop + mH + gap - o.top;

        const minH = Math.min(pushRight, pushLeft);
        const minV = Math.min(pushDown, pushUp);

        if (minH <= minV) {
          if (pushRight <= pushLeft) {
            mLeft = oRight + gap;
          } else {
            mLeft = o.left - mW - gap;
          }
        } else {
          if (pushDown <= pushUp) {
            mTop = oBottom + gap;
          } else {
            mTop = o.top - mH - gap;
          }
        }
        hadCorrection = true;
      }
    }

    return { top: mTop, left: mLeft };
  }

  private handleMove(event: MouseEvent): void {
    const id = this._moveTarget!;
    const gap = this.config.gap;
    const dx = event.clientX - this._dragStartX;
    const dy = event.clientY - this._dragStartY;
    const rawTop = this._dragStartTop + dy;
    const rawLeft = this._dragStartLeft + dx;

    const snappedTop = Math.round(rawTop / gap) * gap;
    const snappedLeft = Math.round(rawLeft / SubpageTileCanvas.CANVAS_STEP) * SubpageTileCanvas.CANVAS_STEP;

    const clamped = this.clampMoveAgainstLocked(id, snappedTop, snappedLeft);

    this.positions.update(p => ({
      ...p,
      [id]: { ...p[id], top: clamped.top, left: clamped.left },
    }));
    this.resolveCanvasPush(id);
  }

  private handleResize(event: MouseEvent): void {
    const id = this._resizeTarget!;
    const step = SubpageTileCanvas.CANVAS_STEP;
    const gap = this.config.gap;
    const dy = event.clientY - this._resizeStartY;
    const rawH = this._resizeStartH + dy;
    const newH = Math.max(gap * 6, Math.round(rawH / gap) * gap);

    const heightOnly = this.config.heightOnlyResizeIds?.has(id);
    if (heightOnly) {
      this.positions.update(p => ({
        ...p,
        [id]: { ...p[id], height: newH },
      }));
    } else {
      const dx = event.clientX - this._resizeStartX;
      const rawW = this._resizeStartW + dx;
      const newW = Math.max(step * 2, Math.round(rawW / step) * step);
      this.positions.update(p => ({
        ...p,
        [id]: { ...p[id], width: newW, height: newH },
      }));
    }
    this.resolveCanvasPush(id);
  }

  resetLayout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
    this.positions.set({});
    this.detailViews.set({});
    this._originalRects = {};
    this._baselineSnapshot = null;
  }
}
