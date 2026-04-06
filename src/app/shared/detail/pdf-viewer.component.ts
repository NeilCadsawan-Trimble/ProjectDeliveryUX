import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';

const PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38';

async function loadPdfPage(url: string): Promise<{ doc: PDFDocumentProxy; page: PDFPageProxy }> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/build/pdf.worker.min.mjs`;
  const doc = await pdfjsLib.getDocument({ url, cMapUrl: `${PDFJS_CDN}/cmaps/`, cMapPacked: true }).promise;
  const page = await doc.getPage(1);
  return { doc, page };
}

@Component({
  selector: 'app-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full">
      <div
        #container
        class="w-full h-full overflow-hidden bg-secondary flex items-center justify-center touch-none"
        [class.cursor-grab]="zoom() > 1 && !isPanning"
        [class.cursor-grabbing]="isPanning"
        (mousedown)="onMouseDown($event)"
        (mousemove)="onMouseMove($event)"
        (mouseup)="onMouseUp()"
        (mouseleave)="onMouseUp()"
        (touchstart)="onTouchStart($event)"
        (touchmove)="onTouchMove($event)"
        (touchend)="onTouchEnd()"
        (touchcancel)="onTouchEnd()"
      >
        <canvas
          #pdfCanvas
          class="pointer-events-none select-none"
          style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;"
          [style.transform]="canvasTransform()"
          [style.transform-origin]="'center center'"
        ></canvas>
      </div>

      @if (loading()) {
        <div class="absolute inset-0 flex items-center justify-center bg-secondary">
          <div class="flex items-center gap-2 text-foreground-60">
            <i class="modus-icons text-lg animate-spin" aria-hidden="true">refresh</i>
            <div class="text-sm">Loading PDF...</div>
          </div>
        </div>
      }

      @if (error()) {
        <div class="absolute inset-0 flex items-center justify-center bg-secondary">
          <div class="flex flex-col items-center gap-2 text-foreground-60">
            <i class="modus-icons text-2xl" aria-hidden="true">warning</i>
            <div class="text-sm">{{ error() }}</div>
          </div>
        </div>
      }

      @if (nativePercent() !== null && zoom() !== 1) {
        <div class="absolute bottom-3 right-3 flex items-center gap-2 bg-card border-default rounded-lg px-3 py-1.5 shadow-toolbar">
          <div class="text-xs text-foreground-60 font-medium">{{ nativePercent() }}%</div>
          <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Reset zoom" (click)="resetZoom()">
            <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">refresh</i>
          </div>
        </div>
      }
    </div>
  `,
})
export class PdfViewerComponent {
  readonly src = input.required<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('pdfCanvas');
  private readonly containerRef = viewChild<ElementRef<HTMLElement>>('container');

  private readonly _cleanup = this.destroyRef.onDestroy(() => {
    if (this._rerenderTimer) clearTimeout(this._rerenderTimer);
    this._activeRenderTask?.cancel();
  });

  readonly zoom = signal(1);
  readonly panX = signal(0);
  readonly panY = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly fitScale = signal(1);

  private readonly _pageSize = signal<{ w: number; h: number }>({ w: 1, h: 1 });

  readonly maxZoom = computed(() => {
    const fs = this.fitScale();
    if (fs <= 0) return 10;
    const dpr = window.devicePixelRatio || 1;
    const qb = PdfViewerComponent._isSafari() ? 1.5 : 1;
    const { w, h } = this._pageSize();
    const maxDim = PdfViewerComponent._isSafari() ? 16384 : 32768;
    const dimCap = maxDim / (Math.max(w, h) * fs * dpr * qb);
    const areaCap = Math.sqrt(268_435_456 / (w * h)) / (fs * dpr * qb);
    const nativeCap = 10 / fs;
    return Math.max(1, Math.min(nativeCap, dimCap, areaCap));
  });

  readonly nativePercent = computed(() => {
    const fs = this.fitScale();
    if (fs <= 0) return null;
    return Math.round(fs * this.zoom() * 100);
  });

  readonly canvasTransform = computed(() => {
    const z = this.zoom();
    if (z === 1 && this.panX() === 0 && this.panY() === 0) return 'none';
    const px = this.panX() / z;
    const py = this.panY() / z;
    return `scale(${z}) translate(${px}px, ${py}px)`;
  });

  isPanning = false;
  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartOffX = 0;
  private _panStartOffY = 0;

  private _touchCount = 0;
  private _pinchStartDist = 0;
  private _pinchStartZoom = 1;
  private _pinchMidX = 0;
  private _pinchMidY = 0;
  private _lastTapTime = 0;

  private _pdfDoc: PDFDocumentProxy | null = null;
  private _pdfPage: PDFPageProxy | null = null;
  private _activeRenderTask: RenderTask | null = null;
  private _rerenderTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _loadEffect = effect(() => {
    const url = this.src();
    if (url) this._loadPdf(url);
  });

  private readonly _zoomRenderEffect = effect(() => {
    const z = this.zoom();
    if (!this._pdfPage) return;
    if (this._rerenderTimer) clearTimeout(this._rerenderTimer);
    this._rerenderTimer = setTimeout(() => this._renderAtCurrentZoom(z), 200);
  });

  private _resizeObserver: ResizeObserver | null = null;

  private readonly _resizeEffect = effect(() => {
    const container = this.containerRef()?.nativeElement;
    if (!container) return;
    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver(() => {
      if (this.loading() || !this._pdfPage || this.zoom() !== 1) return;
      const { w, h } = this._pageSize();
      const cW = container.clientWidth;
      const cH = container.clientHeight;
      if (cW <= 0 || cH <= 0) return;
      const newFit = Math.min(cW / w, cH / h);
      if (Math.abs(newFit - this.fitScale()) < 0.001) return;
      this.fitScale.set(newFit);
      const canvas = this.canvasRef()?.nativeElement;
      if (canvas && this._pdfPage) {
        this._renderPage(this._pdfPage, canvas, newFit, 1);
      }
    });
    this._resizeObserver.observe(container);
    this.destroyRef.onDestroy(() => this._resizeObserver?.disconnect());
  });

  private readonly _touchPreventEffect = effect(() => {
    const el = this.containerRef()?.nativeElement;
    if (!el) return;
    const handler = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    el.addEventListener('touchmove', handler, { passive: false });
    this.destroyRef.onDestroy(() => el.removeEventListener('touchmove', handler));
  });

  private readonly _wheelEffect = effect(() => {
    const el = this.containerRef()?.nativeElement;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const oldZoom = this.zoom();
      let newZoom: number;

      if (event.shiftKey) {
        const fs = this.fitScale();
        const step = fs > 0 ? 0.01 / fs : 0.01;
        const scrollDelta = event.deltaY || event.deltaX;
        const dir = scrollDelta > 0 ? -1 : 1;
        newZoom = Math.min(this.maxZoom(), Math.max(0.25, oldZoom + dir * step));
      } else {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        newZoom = Math.min(this.maxZoom(), Math.max(0.25, oldZoom + delta * oldZoom));
      }

      if (newZoom === oldZoom) return;

      const rect = el.getBoundingClientRect();
      const cursorRelX = event.clientX - rect.left - rect.width / 2;
      const cursorRelY = event.clientY - rect.top - rect.height / 2;
      const ratio = newZoom / oldZoom;

      this.panX.update(px => cursorRelX + (px - cursorRelX) * ratio);
      this.panY.update(py => cursorRelY + (py - cursorRelY) * ratio);
      this.zoom.set(newZoom);
    };
    el.addEventListener('wheel', handler, { passive: false });
    this.destroyRef.onDestroy(() => el.removeEventListener('wheel', handler));
  });

  private async _loadPdf(url: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this._pdfDoc?.destroy();
      const { doc, page } = await loadPdfPage(url);
      this._pdfDoc = doc;
      this._pdfPage = page;
      const baseViewport = page.getViewport({ scale: 1 });
      this._pageSize.set({ w: baseViewport.width, h: baseViewport.height });

      const canvas = this.canvasRef()?.nativeElement;
      const container = this.containerRef()?.nativeElement;
      if (!canvas || !container) {
        this.error.set('Viewer not ready');
        this.loading.set(false);
        return;
      }

      let containerW = container.clientWidth;
      let containerH = container.clientHeight;
      if (containerW <= 0 || containerH <= 0) {
        await new Promise<void>(resolve => {
          const ro = new ResizeObserver(() => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
              ro.disconnect();
              resolve();
            }
          });
          ro.observe(container);
        });
        containerW = container.clientWidth;
        containerH = container.clientHeight;
      }

      const fitScaleVal = Math.min(containerW / baseViewport.width, containerH / baseViewport.height);
      this.fitScale.set(fitScaleVal);

      await this._renderPage(page, canvas, fitScaleVal, this.zoom());
      this.loading.set(false);
    } catch (e) {
      console.error('PDF load error:', e);
      this.loading.set(false);
      this.error.set('Failed to load PDF');
    }
  }

  private async _renderPage(
    page: PDFPageProxy,
    canvas: HTMLCanvasElement,
    fitScaleVal: number,
    targetZoom: number,
  ): Promise<void> {
    this._activeRenderTask?.cancel();

    const dpr = window.devicePixelRatio || 1;
    const qualityBoost = PdfViewerComponent._isSafari() ? 1.5 : 1;
    const renderScale = fitScaleVal * targetZoom * dpr * qualityBoost;
    const viewport = page.getViewport({ scale: renderScale });

    const pixelW = Math.round(viewport.width);
    const pixelH = Math.round(viewport.height);
    canvas.width = pixelW;
    canvas.height = pixelH;

    const cssW = pixelW / (targetZoom * dpr * qualityBoost);
    const cssH = pixelH / (targetZoom * dpr * qualityBoost);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d', { alpha: false })!;
    const task = page.render({ canvasContext: ctx, viewport });
    this._activeRenderTask = task;

    await task.promise;
    this._activeRenderTask = null;
  }

  private static _safariDetected: boolean | null = null;
  private static _isSafari(): boolean {
    if (PdfViewerComponent._safariDetected === null) {
      const ua = navigator.userAgent;
      PdfViewerComponent._safariDetected = /Safari/.test(ua) && !/Chrome/.test(ua);
    }
    return PdfViewerComponent._safariDetected;
  }

  private async _renderAtCurrentZoom(targetZoom: number): Promise<void> {
    const page = this._pdfPage;
    const canvas = this.canvasRef()?.nativeElement;
    if (!page || !canvas) return;

    try {
      await this._renderPage(page, canvas, this.fitScale(), targetZoom);
    } catch {
      // Render was cancelled by a newer render — safe to ignore
    }
  }

  onMouseDown(event: MouseEvent): void {
    if (this.zoom() <= 1) return;
    event.preventDefault();
    this.isPanning = true;
    this._panStartX = event.clientX;
    this._panStartY = event.clientY;
    this._panStartOffX = this.panX();
    this._panStartOffY = this.panY();
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    this.panX.set(this._panStartOffX + (event.clientX - this._panStartX));
    this.panY.set(this._panStartOffY + (event.clientY - this._panStartY));
  }

  onMouseUp(): void {
    this.isPanning = false;
  }

  onTouchStart(event: TouchEvent): void {
    this._touchCount = event.touches.length;

    if (event.touches.length === 1) {
      const now = Date.now();
      const touch = event.touches[0];

      if (now - this._lastTapTime < 300) {
        event.preventDefault();
        this._handleDoubleTap(touch);
        this._lastTapTime = 0;
        return;
      }
      this._lastTapTime = now;

      if (this.zoom() <= 1) return;
      event.preventDefault();
      this.isPanning = true;
      this._panStartX = touch.clientX;
      this._panStartY = touch.clientY;
      this._panStartOffX = this.panX();
      this._panStartOffY = this.panY();
    }

    if (event.touches.length === 2) {
      event.preventDefault();
      this.isPanning = false;
      const [t0, t1] = [event.touches[0], event.touches[1]];
      this._pinchStartDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      this._pinchStartZoom = this.zoom();

      const el = this.containerRef()?.nativeElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        this._pinchMidX = (t0.clientX + t1.clientX) / 2 - rect.left - rect.width / 2;
        this._pinchMidY = (t0.clientY + t1.clientY) / 2 - rect.top - rect.height / 2;
      }
      this._panStartOffX = this.panX();
      this._panStartOffY = this.panY();
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isPanning) {
      event.preventDefault();
      const touch = event.touches[0];
      this.panX.set(this._panStartOffX + (touch.clientX - this._panStartX));
      this.panY.set(this._panStartOffY + (touch.clientY - this._panStartY));
    }

    if (event.touches.length === 2) {
      event.preventDefault();
      const [t0, t1] = [event.touches[0], event.touches[1]];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      const scale = dist / this._pinchStartDist;
      const oldZoom = this.zoom();
      const newZoom = Math.min(this.maxZoom(), Math.max(0.5, this._pinchStartZoom * scale));

      if (newZoom !== oldZoom) {
        const ratio = newZoom / this._pinchStartZoom;
        this.panX.set(this._pinchMidX + (this._panStartOffX - this._pinchMidX) * ratio);
        this.panY.set(this._pinchMidY + (this._panStartOffY - this._pinchMidY) * ratio);
        this.zoom.set(newZoom);
      }
    }
  }

  onTouchEnd(): void {
    this.isPanning = false;
    this._touchCount = 0;
  }

  private _handleDoubleTap(touch: Touch): void {
    const el = this.containerRef()?.nativeElement;
    if (!el) return;

    if (this.zoom() > 1) {
      this.resetZoom();
      return;
    }

    const targetZoom = 2.5;
    const rect = el.getBoundingClientRect();
    const tapX = touch.clientX - rect.left - rect.width / 2;
    const tapY = touch.clientY - rect.top - rect.height / 2;
    const ratio = targetZoom / this.zoom();

    this.panX.set(tapX - tapX * ratio);
    this.panY.set(tapY - tapY * ratio);
    this.zoom.set(Math.min(this.maxZoom(), targetZoom));
  }

  zoomIn(): void {
    this.zoom.update(z => Math.min(this.maxZoom(), z * 1.25));
  }

  zoomOut(): void {
    this.zoom.update(z => Math.max(0.25, z / 1.25));
  }

  resetZoom(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }
}
