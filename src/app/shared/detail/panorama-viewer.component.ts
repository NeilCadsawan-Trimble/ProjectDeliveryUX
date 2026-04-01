import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Viewer } from '@photo-sphere-viewer/core';

@Component({
  selector: 'app-panorama-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full">
      <div #viewerContainer class="w-full h-full"></div>

      @if (loading()) {
        <div class="absolute inset-0 flex items-center justify-center bg-secondary">
          <div class="flex items-center gap-2 text-foreground-60">
            <i class="modus-icons text-lg animate-spin" aria-hidden="true">refresh</i>
            <div class="text-sm">Loading panorama...</div>
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

      @if (!loading() && !error()) {
        <div class="absolute bottom-3 left-3 flex items-center gap-1.5 bg-card border-default rounded-lg px-2.5 py-1.5 shadow-toolbar">
          <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Zoom in" (click)="zoomIn()" (mousedown)="$event.stopPropagation()">
            <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">add</i>
          </div>
          <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Zoom out" (click)="zoomOut()" (mousedown)="$event.stopPropagation()">
            <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">remove</i>
          </div>
          <div class="w-px h-5 bg-secondary mx-0.5"></div>
          <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Reset view" (click)="resetView()" (mousedown)="$event.stopPropagation()">
            <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">refresh</i>
          </div>
          @if (fullscreenSupported) {
            <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
              role="button" tabindex="0" aria-label="Toggle fullscreen" (click)="toggleFullscreen()" (mousedown)="$event.stopPropagation()">
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">{{ isFullscreen() ? 'close_fullscreen' : 'open_in_full' }}</i>
            </div>
          }
        </div>

        <div class="absolute top-3 right-3 bg-card border-default rounded-lg px-2.5 py-1 shadow-toolbar">
          <div class="text-2xs text-foreground-60 font-medium tracking-wide uppercase">360</div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    :host ::ng-deep .psv-container { border-radius: inherit; }
    :host ::ng-deep .psv-loader { display: none !important; }
    :host ::ng-deep .psv-navbar { display: none !important; }
  `],
})
export class PanoramaViewerComponent {
  readonly src = input.required<string>();
  readonly caption = input<string>('');
  readonly defaultYaw = input<number>(0);
  readonly defaultPitch = input<number>(0);
  readonly viewerReady = output<void>();

  private readonly containerRef = viewChild.required<ElementRef<HTMLElement>>('viewerContainer');
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly isFullscreen = signal(false);
  readonly fullscreenSupported = !!document.fullscreenEnabled;

  private viewer: Viewer | null = null;

  private readonly _loadEffect = effect(() => {
    const url = this.src();
    const container = this.containerRef()?.nativeElement;
    if (!url || !container) return;

    this._initViewer(url, container);
  });

  private _initViewer(url: string, container: HTMLElement): void {
    this.loading.set(true);
    this.error.set(null);

    this.viewer?.destroy();
    this.viewer = null;

    if (container.clientWidth === 0 || container.clientHeight === 0) {
      const ro = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          ro.disconnect();
          this._createViewer(url, container);
        }
      });
      ro.observe(container);
      this.destroyRef.onDestroy(() => ro.disconnect());
      return;
    }

    this._createViewer(url, container);
  }

  private _createViewer(url: string, container: HTMLElement): void {
    try {
      const viewer = new Viewer({
        container,
        panorama: url,
        defaultYaw: this.defaultYaw(),
        defaultPitch: this.defaultPitch(),
        navbar: false,
        loadingTxt: '',
        defaultZoomLvl: 50,
        moveSpeed: 1.5,
        zoomSpeed: 1.2,
        moveInertia: true,
        mousewheel: true,
        touchmoveTwoFingers: false,
      });

      viewer.addEventListener('ready', () => {
        this.loading.set(false);
        this.viewerReady.emit();
      });

      viewer.addEventListener('fullscreen', (e: Event & { fullscreenEnabled?: boolean }) => {
        this.isFullscreen.set(!!e.fullscreenEnabled);
      });

      this.viewer = viewer;

      this.destroyRef.onDestroy(() => {
        viewer.destroy();
        this.viewer = null;
      });
    } catch (e) {
      console.error('Panorama viewer init error:', e);
      this.loading.set(false);
      this.error.set('Failed to load panorama');
    }
  }

  zoomIn(): void {
    this.viewer?.zoom(Math.min(100, (this.viewer.getZoomLevel() ?? 50) + 15));
  }

  zoomOut(): void {
    this.viewer?.zoom(Math.max(0, (this.viewer.getZoomLevel() ?? 50) - 15));
  }

  resetView(): void {
    this.viewer?.animate({
      yaw: this.defaultYaw(),
      pitch: this.defaultPitch(),
      zoom: 50,
      speed: '3rpm',
    });
  }

  toggleFullscreen(): void {
    this.viewer?.toggleFullscreen();
  }
}
