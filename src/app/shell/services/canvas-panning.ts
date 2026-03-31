import { computed, signal } from '@angular/core';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.0;
const ZOOM_STEP = 0.05;

export class CanvasPanning {
  readonly isPanReady = signal(false);
  readonly isPanning = signal(false);
  readonly panOffsetX = signal(0);
  readonly panOffsetY = signal(0);
  readonly canvasZoom = signal(1);
  readonly disabled = signal(false);
  readonly locked = signal(false);
  readonly panBlocked = computed(() => this.disabled() || this.locked());

  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartOffsetX = 0;
  private _panStartOffsetY = 0;

  constructor(private readonly isCanvasFn: () => boolean) {}

  toggleLock(): void {
    this.locked.update(v => !v);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.panBlocked()) return;
    if (event.code !== 'Space' || !this.isCanvasFn()) return;
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (event.target as HTMLElement)?.isContentEditable) return;
    event.preventDefault();
    if (!event.repeat) {
      this.isPanReady.set(true);
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code !== 'Space') return;
    event.preventDefault();
    this.isPanReady.set(false);
    this.isPanning.set(false);
  }

  onPanMouseDown(event: MouseEvent): void {
    if (this.panBlocked()) return;
    if (this.isPanReady()) {
      event.preventDefault();
      this._startPan(event);
      return;
    }
    if (!this.isCanvasFn()) return;
    if (this._isInsideWidget(event.target as HTMLElement | null)) return;
    event.preventDefault();
    this.isPanReady.set(true);
    this._clickPanActive = true;
    this._startPan(event);
  }

  private _clickPanActive = false;

  private _startPan(event: MouseEvent): void {
    this.isPanning.set(true);
    this._panStartX = event.clientX;
    this._panStartY = event.clientY;
    this._panStartOffsetX = this.panOffsetX();
    this._panStartOffsetY = this.panOffsetY();
  }

  private _isInsideWidget(el: HTMLElement | null): boolean {
    while (el) {
      if (el.hasAttribute('data-widget-id')) return true;
      if (el.hasAttribute('data-tile-id')) return true;
      if (el.hasAttribute('data-no-pan')) return true;
      if (el.classList.contains('canvas-navbar') || el.classList.contains('canvas-side-nav')) return true;
      const tag = el.tagName.toLowerCase();
      if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
      if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'option' || el.getAttribute('role') === 'listbox') return true;
      el = el.parentElement;
    }
    return false;
  }

  onCanvasWheel(event: WheelEvent): void {
    if (this.panBlocked()) return;
    if (this._isInsideScrollable(event.target as HTMLElement | null)) return;
    if (this._isInsideDetailView(event.target as HTMLElement | null)) return;
    event.preventDefault();

    if (event.shiftKey) {
      const oldZoom = this.canvasZoom();
      const direction = event.deltaY > 0 ? -1 : 1;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom + direction * ZOOM_STEP));
      if (newZoom === oldZoom) return;

      const cursorX = event.clientX;
      const cursorY = event.clientY;
      const worldX = (cursorX - this.panOffsetX()) / oldZoom;
      const worldY = (cursorY - this.panOffsetY()) / oldZoom;

      this.canvasZoom.set(newZoom);
      this.panOffsetX.set(cursorX - worldX * newZoom);
      this.panOffsetY.set(cursorY - worldY * newZoom);
    } else {
      this.panOffsetX.update(x => x - event.deltaX);
      this.panOffsetY.update(y => y - event.deltaY);
    }
  }

  private _isInsideDetailView(el: HTMLElement | null): boolean {
    while (el) {
      if (el.hasAttribute('data-detail-view')) return true;
      el = el.parentElement;
    }
    return false;
  }

  private _isInsideScrollable(el: HTMLElement | null): boolean {
    while (el) {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
        return true;
      }
      if (el.hasAttribute('data-widget-id')) break;
      el = el.parentElement;
    }
    return false;
  }

  /** Returns true if this handler consumed the mouse-move (i.e. panning is active). */
  handleMouseMove(event: MouseEvent): boolean {
    if (!this.isPanning()) return false;
    const dx = event.clientX - this._panStartX;
    const dy = event.clientY - this._panStartY;
    this.panOffsetX.set(this._panStartOffsetX + dx);
    this.panOffsetY.set(this._panStartOffsetY + dy);
    return true;
  }

  /** Returns true if this handler consumed the mouse-up (i.e. panning was active). */
  handleMouseUp(): boolean {
    if (!this.isPanning() && !this._clickPanActive) return false;
    this.isPanning.set(false);
    if (this._clickPanActive) {
      this.isPanReady.set(false);
      this._clickPanActive = false;
    }
    return true;
  }

  resetView(): void {
    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
    this.canvasZoom.set(1);
  }
}
