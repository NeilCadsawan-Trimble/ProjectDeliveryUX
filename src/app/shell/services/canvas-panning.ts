import { signal } from '@angular/core';

export class CanvasPanning {
  readonly isPanReady = signal(false);
  readonly isPanning = signal(false);
  readonly panOffsetX = signal(0);
  readonly panOffsetY = signal(0);

  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartOffsetX = 0;
  private _panStartOffsetY = 0;

  constructor(private readonly isCanvasFn: () => boolean) {}

  onKeyDown(event: KeyboardEvent): void {
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
    if (!this.isPanReady()) return;
    event.preventDefault();
    this.isPanning.set(true);
    this._panStartX = event.clientX;
    this._panStartY = event.clientY;
    this._panStartOffsetX = this.panOffsetX();
    this._panStartOffsetY = this.panOffsetY();
  }

  onCanvasWheel(event: WheelEvent): void {
    if (this._isInsideScrollable(event.target as HTMLElement | null)) return;
    event.preventDefault();
    this.panOffsetX.update(x => x - event.deltaX);
    this.panOffsetY.update(y => y - event.deltaY);
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
    if (!this.isPanning()) return false;
    this.isPanning.set(false);
    return true;
  }

  resetView(): void {
    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
  }
}
