import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ModusButtonComponent } from '../../../components/modus-button.component';
import { ModusDropdownMenuComponent } from '../../../components/modus-dropdown-menu.component';
import { ModusMenuComponent } from '../../../components/modus-menu.component';
import { ModusMenuItemComponent } from '../../../components/modus-menu-item.component';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import { DrawingMarkupToolbarComponent } from '../../../shared/detail/drawing-markup-toolbar.component';
import {
  SITE_MODEL_VIEWPORT_DEBOUNCE_MS,
  resolveSiteModelViewportTierWithHysteresis,
  type SiteModelViewportTier,
} from './project-site-model-viewport-tier';
import { OrientationGizmoComponent, type GizmoFace } from './orientation-gizmo.component';

type StandardViewPreset = 'iso' | 'top' | 'front' | 'right' | 'left';

/**
 * Floating-toolbar view dropdown ids. Adds 'fit' on top of the camera-orbit
 * presets so the active label can also reflect "Fit" (which goes through
 * `fitToView()` instead of `presetView()` -- model-viewer auto-frames the
 * model rather than snapping a fixed orbit).
 */
type ViewPresetId = 'fit' | StandardViewPreset;

const VIEW_PRESET_LABELS: Record<ViewPresetId, string> = {
  fit: 'Fit',
  iso: 'Isometric',
  top: 'Top',
  front: 'Front',
  right: 'Right',
  left: 'Left',
};

type RailTool = 'sheets' | 'measure' | 'document' | 'camera' | 'clipboard' | 'chart' | 'folder';

/**
 * Live spherical camera position returned by `<model-viewer>.getCameraOrbit()`
 * per @google/model-viewer 3.5. Theta and phi are in radians (NOT degrees);
 * radius is in metres.
 */
interface ModelViewerSphericalPosition {
  theta: number;
  phi: number;
  radius: number;
}

interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string;
  cameraTarget: string;
  fieldOfView: string;
  getCameraOrbit?(): ModelViewerSphericalPosition | undefined;
}

interface PannellumViewerInstance {
  destroy(): void;
  getYaw(): number;
  setYaw(yaw: number, animated?: boolean, force?: boolean): void;
}

interface WindowWithPannellum extends Window {
  pannellum?: {
    viewer: (
      container: string | HTMLElement,
      config: Record<string, unknown>,
    ) => PannellumViewerInstance;
  };
}

/**
 * Project Models sub-page BIM viewer.
 *
 * Hosts a `<model-viewer>` 3D pane (Google's web component, loaded via CDN
 * in `index.html`) with optional split 360-degree captures rendered through
 * Pannellum. Sync lock maps model orbit to pano yaw for coordinated
 * navigation between the BIM model and the corresponding site capture.
 *
 * Layout: side rail (>= "full" tier) + viewer with floating view dropdown
 * (Fit / Iso / Top / Front / Right / Left), turntable, split toggle, and
 * an orientation gizmo. The drawing markup toolbar floats at the bottom.
 *
 * Adapted from the BIM viewer fork (`NeilCadsawan-Trimble/3D-Viewer`); the
 * narrow-tile / `requestExpandFullRow` flow from the dashboard widget
 * version is dropped because the sub-page always has full row width.
 */
@Component({
  selector: 'app-project-site-model',
  imports: [
    ModusButtonComponent,
    ModusDropdownMenuComponent,
    ModusMenuComponent,
    ModusMenuItemComponent,
    ModusTypographyComponent,
    DrawingMarkupToolbarComponent,
    OrientationGizmoComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full min-h-0 min-w-0 site-model-host',
    '[class.fill-parent]': 'fillParent()',
  },
  styles: [
    `
      :host {
        display: block;
        height: 600px;
        min-height: 480px;
      }
      :host(.fill-parent) {
        height: 100%;
        min-height: 0;
      }
      :host(.site-model-host) ::ng-deep model-viewer {
        --poster-color: transparent;
      }
    `,
  ],
  template: `
    <div #viewportRoot class="flex flex-col min-h-0 h-full min-w-0 flex-1">
      <div #viewerShell class="flex flex-col overflow-hidden flex-1 min-h-0 min-w-0">
        <div class="flex flex-1 min-h-0 min-w-0">
          <div class="flex-1 min-w-0 min-h-0 relative flex flex-col bg-background">
            <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-0">
              @if (splitCaptureView()) {
                <div
                  class="relative grid min-h-0 min-w-0 flex-1 grid-cols-2 grid-rows-[minmax(0,1fr)_auto] gap-0"
                >
                  <div
                    class="relative isolate col-span-2 row-start-1 grid min-h-0 min-w-0 grid-cols-2"
                  >
                    <div
                      class="relative min-h-56 min-w-0 overflow-hidden bg-background rounded-none"
                      (wheel)="onViewerWheel($event)"
                    >
                      <model-viewer
                        #siteModelViewer
                        [attr.src]="demoModelUrl"
                        alt="BIM coordination demo for project models sub-page"
                        camera-controls
                        touch-action="none"
                        shadow-intensity="0.9"
                        exposure="1"
                        tone-mapping="commerce"
                        environment-image="neutral"
                        interaction-prompt="auto"
                        [attr.auto-rotate]="turntableEnabled() ? '' : null"
                        auto-rotate-delay="0"
                        rotation-per-second="12deg"
                        field-of-view="45deg"
                        class="absolute inset-0 box-border block h-full w-full"
                      ></model-viewer>

                      @if (showExpandedChrome()) {
                        <div
                          class="absolute top-3 right-24 z-10 h-16 flex items-center pointer-events-none"
                        >
                          <div
                            class="flex items-center gap-1 bg-background border-default rounded-lg px-2 py-1 shadow-toolbar pointer-events-auto"
                            role="toolbar"
                            aria-label="3D site model view controls"
                            (mousedown)="$event.stopPropagation()"
                          >
                            <modus-dropdown-menu
                              buttonAriaLabel="Change 3D view"
                              [buttonColor]="'tertiary'"
                              [buttonVariant]="'borderless'"
                              [buttonSize]="'sm'"
                              [menuPlacement]="'bottom'"
                              [menuOffset]="6"
                            >
                              <modus-button
                                slot="button"
                                size="sm"
                                variant="borderless"
                                color="tertiary"
                                icon="caret_down"
                                iconPosition="right"
                                ariaLabel="Change 3D view"
                                >{{ activeViewLabel() }}</modus-button
                              >
                              <div slot="menu">
                                <modus-menu>
                                  <div class="px-3 pt-2 pb-1" role="presentation">
                                    <modus-typography
                                      size="xs"
                                      className="text-2xs uppercase tracking-wide text-foreground-60"
                                      >Auto</modus-typography
                                    >
                                  </div>
                                  <modus-menu-item
                                    label="Fit"
                                    value="fit"
                                    startIcon="zoom_in"
                                    [selected]="activeViewPreset() === 'fit'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                  <div class="px-3 pt-2 pb-1" role="presentation">
                                    <modus-typography
                                      size="xs"
                                      className="text-2xs uppercase tracking-wide text-foreground-60"
                                      >Standard views</modus-typography
                                    >
                                  </div>
                                  <modus-menu-item
                                    label="Isometric"
                                    value="iso"
                                    startIcon="cube"
                                    [selected]="activeViewPreset() === 'iso'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                  <modus-menu-item
                                    label="Top"
                                    value="top"
                                    startIcon="arrow_up"
                                    [selected]="activeViewPreset() === 'top'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                  <modus-menu-item
                                    label="Front"
                                    value="front"
                                    startIcon="elevation"
                                    [selected]="activeViewPreset() === 'front'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                  <modus-menu-item
                                    label="Right"
                                    value="right"
                                    startIcon="arrow_right"
                                    [selected]="activeViewPreset() === 'right'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                  <modus-menu-item
                                    label="Left"
                                    value="left"
                                    startIcon="arrow_left"
                                    [selected]="activeViewPreset() === 'left'"
                                    (itemSelect)="selectViewPreset($event.value)"
                                  />
                                </modus-menu>
                              </div>
                            </modus-dropdown-menu>
                            <div class="w-px h-5 bg-border" aria-hidden="true"></div>
                            <modus-button
                              [variant]="turntableEnabled() ? 'filled' : 'borderless'"
                              [color]="turntableEnabled() ? 'primary' : 'tertiary'"
                              size="sm"
                              icon="object_rotate"
                              iconPosition="only"
                              [ariaLabel]="
                                turntableEnabled() ? 'Stop turntable' : 'Start turntable'
                              "
                              (buttonClick)="toggleTurntable()"
                            ></modus-button>
                            <modus-button
                              [variant]="splitCaptureView() ? 'filled' : 'borderless'"
                              [color]="splitCaptureView() ? 'primary' : 'tertiary'"
                              size="sm"
                              icon="columns"
                              iconPosition="only"
                              [ariaLabel]="
                                splitCaptureView()
                                  ? 'Hide split 360 capture'
                                  : 'Show split 360 capture'
                              "
                              (buttonClick)="toggleSplitCapture()"
                            ></modus-button>
                          </div>
                        </div>

                        <app-drawing-markup-toolbar
                          orientation="vertical"
                          [activeTool]="activeMarkupTool()"
                          (toolSelect)="activeMarkupTool.set($event)"
                        />

                        <div class="absolute top-3 right-3 z-10 w-16 h-16 pointer-events-none">
                          <app-orientation-gizmo
                            [theta]="cameraOrbitTheta()"
                            [phi]="cameraOrbitPhi()"
                            [enableFaceClicks]="true"
                            (faceClick)="goToFace($event)"
                          />
                        </div>
                      }
                    </div>

                    <div
                      class="relative flex min-h-0 min-w-0 flex-col border-left-default"
                    >
                      <div
                        class="relative flex-1 min-h-64 overflow-hidden bg-background rounded-none"
                        (wheel)="onViewerWheel($event)"
                      >
                        <div
                          #panoHost
                          class="absolute inset-0 box-border h-full min-h-0 w-full overflow-hidden rounded-none bg-muted"
                        ></div>
                      </div>
                    </div>

                    <div
                      class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
                    >
                      <modus-button
                        shape="circle"
                        size="sm"
                        [className]="syncSeamButtonClassName()"
                        [variant]="syncLocked() ? 'filled' : 'borderless'"
                        [color]="syncLocked() ? 'primary' : 'tertiary'"
                        [icon]="syncLocked() ? 'lock' : 'lock_open'"
                        iconPosition="only"
                        [pressed]="syncLocked()"
                        [ariaLabel]="
                          syncLocked()
                            ? 'Unlock pano from model yaw'
                            : 'Lock pano yaw to model orbit'
                        "
                        (buttonClick)="toggleSyncLock()"
                      ></modus-button>
                    </div>
                  </div>

                  <div
                    class="col-start-1 row-start-2 flex min-h-0 min-w-0 items-center justify-center gap-2 border-top-default bg-muted-20 px-2 py-2"
                    (mousedown)="$event.stopPropagation()"
                  >
                    <modus-button
                      variant="borderless"
                      color="tertiary"
                      size="xs"
                      icon="chevron_left"
                      iconPosition="only"
                      ariaLabel="Previous model revision date"
                      (buttonClick)="stepModelRevision(-1)"
                    ></modus-button>
                    <div class="min-w-22 text-center">
                      <modus-typography
                        size="xs"
                        weight="semibold"
                        className="text-foreground-80"
                        >BIM &middot; {{ currentModelRevisionLabel() }}</modus-typography
                      >
                    </div>
                    <modus-button
                      variant="borderless"
                      color="tertiary"
                      size="xs"
                      icon="chevron_right"
                      iconPosition="only"
                      ariaLabel="Next model revision date"
                      (buttonClick)="stepModelRevision(1)"
                    ></modus-button>
                  </div>

                  <div
                    class="col-start-2 row-start-2 flex min-h-0 min-w-0 items-center justify-center gap-2 border-top-default border-left-default bg-muted-20 px-2 py-2"
                    (mousedown)="$event.stopPropagation()"
                  >
                    <modus-button
                      variant="borderless"
                      color="tertiary"
                      size="xs"
                      icon="chevron_left"
                      iconPosition="only"
                      ariaLabel="Previous capture date"
                      (buttonClick)="stepCaptureDate(-1)"
                    ></modus-button>
                    <div class="min-w-22 text-center">
                      <modus-typography
                        size="xs"
                        weight="semibold"
                        className="text-foreground-80"
                        >360 &middot; {{ currentCaptureLabel() }}</modus-typography
                      >
                    </div>
                    <modus-button
                      variant="borderless"
                      color="tertiary"
                      size="xs"
                      icon="chevron_right"
                      iconPosition="only"
                      ariaLabel="Next capture date"
                      (buttonClick)="stepCaptureDate(1)"
                    ></modus-button>
                  </div>
                </div>
              } @else {
                <div class="flex min-h-0 min-w-0 flex-1 flex-col">
                  <div
                    class="relative flex-1 overflow-hidden min-h-56 rounded-lg bg-background"
                    (wheel)="onViewerWheel($event)"
                  >
                    <model-viewer
                      #siteModelViewer
                      [attr.src]="demoModelUrl"
                      alt="BIM coordination demo for project models sub-page"
                      camera-controls
                      touch-action="none"
                      shadow-intensity="0.9"
                      exposure="1"
                      tone-mapping="commerce"
                      environment-image="neutral"
                      interaction-prompt="auto"
                      [attr.auto-rotate]="turntableEnabled() ? '' : null"
                      auto-rotate-delay="0"
                      rotation-per-second="12deg"
                      field-of-view="45deg"
                      class="absolute inset-0 box-border block h-full w-full"
                    ></model-viewer>

                    @if (showExpandedChrome()) {
                      <div
                        class="absolute top-3 right-24 z-10 h-16 flex items-center pointer-events-none"
                      >
                        <div
                          class="flex items-center gap-1 bg-background border-default rounded-lg px-2 py-1 shadow-toolbar pointer-events-auto"
                          role="toolbar"
                          aria-label="3D site model view controls"
                          (mousedown)="$event.stopPropagation()"
                        >
                          <modus-dropdown-menu
                            buttonAriaLabel="Change 3D view"
                            [buttonColor]="'tertiary'"
                            [buttonVariant]="'borderless'"
                            [buttonSize]="'sm'"
                            [menuPlacement]="'bottom'"
                            [menuOffset]="6"
                          >
                            <modus-button
                              slot="button"
                              size="sm"
                              variant="borderless"
                              color="tertiary"
                              icon="caret_down"
                              iconPosition="right"
                              ariaLabel="Change 3D view"
                              >{{ activeViewLabel() }}</modus-button
                            >
                            <div slot="menu">
                              <modus-menu>
                                <div class="px-3 pt-2 pb-1" role="presentation">
                                  <modus-typography
                                    size="xs"
                                    className="text-2xs uppercase tracking-wide text-foreground-60"
                                    >Auto</modus-typography
                                  >
                                </div>
                                <modus-menu-item
                                  label="Fit"
                                  value="fit"
                                  startIcon="zoom_in"
                                  [selected]="activeViewPreset() === 'fit'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                                <div class="px-3 pt-2 pb-1" role="presentation">
                                  <modus-typography
                                    size="xs"
                                    className="text-2xs uppercase tracking-wide text-foreground-60"
                                    >Standard views</modus-typography
                                  >
                                </div>
                                <modus-menu-item
                                  label="Isometric"
                                  value="iso"
                                  startIcon="cube"
                                  [selected]="activeViewPreset() === 'iso'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                                <modus-menu-item
                                  label="Top"
                                  value="top"
                                  startIcon="arrow_up"
                                  [selected]="activeViewPreset() === 'top'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                                <modus-menu-item
                                  label="Front"
                                  value="front"
                                  startIcon="elevation"
                                  [selected]="activeViewPreset() === 'front'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                                <modus-menu-item
                                  label="Right"
                                  value="right"
                                  startIcon="arrow_right"
                                  [selected]="activeViewPreset() === 'right'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                                <modus-menu-item
                                  label="Left"
                                  value="left"
                                  startIcon="arrow_left"
                                  [selected]="activeViewPreset() === 'left'"
                                  (itemSelect)="selectViewPreset($event.value)"
                                />
                              </modus-menu>
                            </div>
                          </modus-dropdown-menu>
                          <div class="w-px h-5 bg-border" aria-hidden="true"></div>
                          <modus-button
                            [variant]="turntableEnabled() ? 'filled' : 'borderless'"
                            [color]="turntableEnabled() ? 'primary' : 'tertiary'"
                            size="sm"
                            icon="object_rotate"
                            iconPosition="only"
                            [ariaLabel]="
                              turntableEnabled() ? 'Stop turntable' : 'Start turntable'
                            "
                            (buttonClick)="toggleTurntable()"
                          ></modus-button>
                          <modus-button
                            [variant]="splitCaptureView() ? 'filled' : 'borderless'"
                            [color]="splitCaptureView() ? 'primary' : 'tertiary'"
                            size="sm"
                            icon="columns"
                            iconPosition="only"
                            [ariaLabel]="
                              splitCaptureView()
                                ? 'Hide split 360 capture'
                                : 'Show split 360 capture'
                            "
                            (buttonClick)="toggleSplitCapture()"
                          ></modus-button>
                        </div>
                      </div>

                      <app-drawing-markup-toolbar
                        orientation="vertical"
                        [activeTool]="activeMarkupTool()"
                        (toolSelect)="activeMarkupTool.set($event)"
                      />

                      <div class="absolute top-3 right-3 z-10 w-16 h-16 pointer-events-none">
                        <app-orientation-gizmo
                          [theta]="cameraOrbitTheta()"
                          [phi]="cameraOrbitPhi()"
                          [enableFaceClicks]="true"
                          (faceClick)="goToFace($event)"
                        />
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectSiteModelComponent {
  /** Reserved for future per-project model selection. Currently unused. */
  readonly projectId = input<number | undefined>();

  /**
   * When true, the host fills its parent's height instead of the default
   * fixed 600px. Used by the Models canvas sub-page to size the viewer
   * relative to the viewport.
   */
  readonly fillParent = input<boolean>(false);

  readonly viewportTier = signal<SiteModelViewportTier>('comfortable');
  readonly showExpandedChrome = computed(() => this.viewportTier() !== 'compact');
  readonly showSideRail = computed(() => this.viewportTier() === 'full');

  readonly turntableEnabled = signal(false);
  readonly splitCaptureView = signal(false);
  /** When true, model-viewer horizontal orbit drives Pannellum yaw. */
  readonly syncLocked = signal(true);

  readonly syncSeamButtonClassName = computed(() =>
    this.syncLocked() ? 'pointer-events-auto shadow-toolbar' : 'pointer-events-auto shadow-toolbar',
  );
  readonly captureDateIndex = signal(0);
  readonly modelRevisionIndex = signal(0);
  readonly activeRailTool = signal<RailTool>('measure');
  readonly activeMarkupTool = signal<string>('Draw');

  readonly activeViewPreset = signal<ViewPresetId>('iso');
  readonly activeViewLabel = computed(() => VIEW_PRESET_LABELS[this.activeViewPreset()]);

  selectViewPreset(value: string): void {
    if (value === 'fit') {
      this.fitToView();
      return;
    }
    if (
      value === 'iso' ||
      value === 'top' ||
      value === 'front' ||
      value === 'right' ||
      value === 'left'
    ) {
      this.presetView(value);
    }
  }

  /** Keep wheel zoom inside the viewer; do not bubble to page / shell scroll handlers. */
  onViewerWheel(event: WheelEvent): void {
    event.stopPropagation();
  }

  private readonly siteModelViewer = viewChild<ElementRef<ModelViewerElement>>('siteModelViewer');
  private readonly viewerShellRef = viewChild<ElementRef<HTMLElement>>('viewerShell');
  private readonly panoHost = viewChild<ElementRef<HTMLElement>>('panoHost');
  private readonly viewportRoot = viewChild<ElementRef<HTMLElement>>('viewportRoot');

  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly ngZone = inject(NgZone);

  private panoInstance: PannellumViewerInstance | null = null;
  private cameraSyncEl: ModelViewerElement | null = null;
  private panoHostForInstance: HTMLElement | null = null;
  private modelCameraSyncEffectGeneration = 0;

  private viewportResizeTimer: ReturnType<typeof setTimeout> | null = null;
  private viewportResizeFirstFlush = true;

  /**
   * Live spherical camera state. Defaults match the ISO preset
   * (`presetView('iso')`) so the gizmo is consistent before the first
   * `camera-change` fires.
   */
  readonly cameraOrbitTheta = signal(35);
  readonly cameraOrbitPhi = signal(70);

  private gizmoListenerEl: ModelViewerElement | null = null;
  private gizmoRafHandle: number | null = null;

  /**
   * Demo equirectangular panorama scenes. Scene 1 ships in the repo
   * (`public/panoramas/villa-construction-360.jpg`) and matches the BIM
   * model loaded in `model-viewer`. Scene 2 is a remote sample retained
   * as a second capture date for the date-picker UX.
   */
  readonly captureScenes = [
    { label: '02/10/25', panoUrl: '/panoramas/villa-construction-360.jpg' },
    { label: '20/10/25', panoUrl: 'https://pannellum.org/images/alma.jpg' },
  ] as const;

  readonly modelRevisions = [
    { label: '15 Sep 2025' },
    { label: '01 Oct 2025' },
    { label: '12 Oct 2025' },
  ] as const;

  /**
   * Repo-hosted demo model. Served from the static `public/models` directory
   * (mounted at the site root by Angular Vite) so loading works offline /
   * without external CDN access.
   */
  readonly demoModelUrl = '/models/modern-luxury-villa.glb';

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.teardownPano();
      this.detachModelCameraListener();
      this.detachGizmoCameraListener();
      if (this.viewportResizeTimer != null) {
        clearTimeout(this.viewportResizeTimer);
        this.viewportResizeTimer = null;
      }
    });

    afterNextRender(
      () => {
        const el = this.viewportRoot()?.nativeElement;
        if (!el) return;

        const flushViewportSize = (w: number, h: number): void => {
          const prevTier = this.viewportTier();
          const nextTier = resolveSiteModelViewportTierWithHysteresis(prevTier, w, h);
          this.viewportTier.set(nextTier);
        };

        const ro = new ResizeObserver((entries) => {
          const cr = entries[0]?.contentRect;
          if (!cr) return;
          const w = Math.round(cr.width);
          const h = Math.round(cr.height);

          this.ngZone.run(() => {
            if (this.viewportResizeFirstFlush && w > 0 && h > 0) {
              this.viewportResizeFirstFlush = false;
              if (this.viewportResizeTimer != null) {
                clearTimeout(this.viewportResizeTimer);
                this.viewportResizeTimer = null;
              }
              flushViewportSize(w, h);
              return;
            }

            if (this.viewportResizeTimer != null) {
              clearTimeout(this.viewportResizeTimer);
            }
            this.viewportResizeTimer = setTimeout(() => {
              this.viewportResizeTimer = null;
              flushViewportSize(w, h);
            }, SITE_MODEL_VIEWPORT_DEBOUNCE_MS);
          });
        });
        ro.observe(el);
        this.destroyRef.onDestroy(() => {
          ro.disconnect();
          if (this.viewportResizeTimer != null) {
            clearTimeout(this.viewportResizeTimer);
            this.viewportResizeTimer = null;
          }
        });
      },
      { injector: this.injector },
    );

    effect(() => {
      const mountPano = this.splitCaptureView();
      const idx = this.captureDateIndex();
      const hostSig = this.panoHost();
      void idx;
      void hostSig;

      untracked(() => {
        afterNextRender(
          () => {
            if (!mountPano) {
              this.teardownPano();
              return;
            }
            const host = this.panoHost()?.nativeElement;
            const url = this.captureScenes[this.captureDateIndex()].panoUrl;
            if (host) {
              this.mountPano(host, url);
            }
          },
          { injector: this.injector },
        );
      });
    });

    effect(() => {
      this.splitCaptureView();
      this.syncLocked();
      this.siteModelViewer();

      const gen = ++this.modelCameraSyncEffectGeneration;
      untracked(() => {
        afterNextRender(
          () => {
            if (gen !== this.modelCameraSyncEffectGeneration) {
              return;
            }
            this.refreshGizmoCameraListener();
            this.refreshModelCameraSync();
          },
          { injector: this.injector },
        );
      });
    });
  }

  currentCaptureLabel(): string {
    return this.captureScenes[this.captureDateIndex()].label;
  }

  currentModelRevisionLabel(): string {
    return this.modelRevisions[this.modelRevisionIndex()].label;
  }

  stepCaptureDate(delta: number): void {
    const n = this.captureScenes.length;
    this.captureDateIndex.update((i) => (i + delta + n) % n);
  }

  stepModelRevision(delta: number): void {
    const n = this.modelRevisions.length;
    this.modelRevisionIndex.update((i) => (i + delta + n) % n);
  }

  toggleSyncLock(): void {
    this.syncLocked.update((v) => !v);
    if (this.syncLocked()) {
      this.syncYawFromModel();
    }
  }

  toggleTurntable(): void {
    this.turntableEnabled.update((v) => !v);
  }

  toggleSplitCapture(): void {
    this.splitCaptureView.update((v) => !v);
  }

  /**
   * Reset to model-viewer's auto framing with a comfortable perspective FOV.
   */
  fitToView(): void {
    const el = this.siteModelViewer()?.nativeElement;
    if (!el) return;
    el.cameraTarget = 'auto auto auto';
    el.cameraOrbit = 'auto auto auto';
    el.fieldOfView = '45deg';
    this.activeViewPreset.set('fit');
  }

  /**
   * Apply an "orthographic-like" preset. model-viewer 3.5 is perspective-only
   * so we approximate parallel projection with FOV=10deg + radius=400% which
   * keeps facade edges parallel to the viewport.
   */
  private applyOrthoLikeView(el: ModelViewerElement, theta: string, phi: string): void {
    el.cameraTarget = 'auto auto auto';
    el.cameraOrbit = `${theta} ${phi} 400%`;
    el.fieldOfView = '10deg';
  }

  /**
   * Apply a comfortable perspective preset (Iso / generic 3D preview).
   */
  private applyPerspectiveView(
    el: ModelViewerElement,
    theta: string,
    phi: string,
    radiusPct: string = '108%',
    fov: string = '45deg',
  ): void {
    el.cameraTarget = 'auto auto auto';
    el.cameraOrbit = `${theta} ${phi} ${radiusPct}`;
    el.fieldOfView = fov;
  }

  presetView(preset: StandardViewPreset): void {
    const el = this.siteModelViewer()?.nativeElement;
    if (!el) return;
    if (preset === 'iso') {
      this.applyPerspectiveView(el, '35deg', '70deg');
    } else {
      const orthoOrbits: Record<Exclude<StandardViewPreset, 'iso'>, readonly [string, string]> = {
        top: ['0deg', '0deg'],
        front: ['0deg', '90deg'],
        right: ['90deg', '90deg'],
        left: ['-90deg', '90deg'],
      };
      const [theta, phi] = orthoOrbits[preset];
      this.applyOrthoLikeView(el, theta, phi);
    }
    this.readCameraOrbitInto(el);
    this.activeViewPreset.set(preset);
  }

  toggleShellFullscreen(): void {
    const shell = this.viewerShellRef()?.nativeElement;
    if (!shell) return;
    if (document.fullscreenElement === shell) {
      void document.exitFullscreen();
    } else if (typeof shell.requestFullscreen === 'function') {
      void shell.requestFullscreen();
    }
  }

  private mountPano(container: HTMLElement, panoUrl: string): void {
    if (typeof window === 'undefined') return;
    const api = (window as WindowWithPannellum).pannellum;
    if (!api) return;

    if (this.panoInstance && this.panoHostForInstance === container) {
      this.panoInstance.destroy();
      this.panoInstance = null;
    } else {
      this.teardownPano();
    }

    this.panoHostForInstance = container;
    this.panoInstance = api.viewer(container, {
      type: 'equirectangular',
      panorama: panoUrl,
      autoLoad: true,
      showControls: false,
      compass: false,
      hfov: 100,
      minHfov: 30,
      maxHfov: 120,
      autoRotate: -2,
      mouseZoom: true,
      draggable: true,
    });
    if (this.syncLocked()) {
      this.syncYawFromModel();
    }
  }

  private teardownPano(): void {
    if (this.panoInstance) {
      try {
        this.panoInstance.destroy();
      } catch {
        /* ignore */
      }
      this.panoInstance = null;
    }
    this.panoHostForInstance = null;
  }

  private refreshModelCameraSync(): void {
    this.detachModelCameraListener();
    if (!this.splitCaptureView()) return;
    const el = this.siteModelViewer()?.nativeElement;
    if (!el || !this.syncLocked()) return;
    el.addEventListener('camera-change', this.onModelCameraChange);
    this.cameraSyncEl = el;
  }

  private detachModelCameraListener(): void {
    if (this.cameraSyncEl) {
      this.cameraSyncEl.removeEventListener('camera-change', this.onModelCameraChange);
      this.cameraSyncEl = null;
    }
  }

  private readonly onModelCameraChange = (): void => {
    if (!this.syncLocked() || !this.splitCaptureView()) return;
    this.syncYawFromModel();
  };

  private syncYawFromModel(): void {
    const el = this.siteModelViewer()?.nativeElement;
    if (!el || !this.panoInstance) return;
    const orbit = el.cameraOrbit || '';
    const first = orbit.trim().split(/\s+/)[0] ?? '';
    const deg = parseFloat(first.replace('deg', ''));
    if (!Number.isFinite(deg)) return;
    this.panoInstance.setYaw(deg, false, true);
  }

  /**
   * Independent of pano-sync, attach a single rAF-throttled `camera-change`
   * listener so the orientation gizmo always reflects the live camera.
   */
  private refreshGizmoCameraListener(): void {
    const el = this.siteModelViewer()?.nativeElement ?? null;
    if (this.gizmoListenerEl === el) {
      if (el) this.readCameraOrbitInto(el);
      return;
    }
    this.detachGizmoCameraListener();
    if (!el) return;
    el.addEventListener('camera-change', this.onModelCameraChangeForGizmo);
    this.gizmoListenerEl = el;
    this.readCameraOrbitInto(el);
  }

  private detachGizmoCameraListener(): void {
    if (this.gizmoListenerEl) {
      this.gizmoListenerEl.removeEventListener('camera-change', this.onModelCameraChangeForGizmo);
      this.gizmoListenerEl = null;
    }
    if (this.gizmoRafHandle != null) {
      cancelAnimationFrame(this.gizmoRafHandle);
      this.gizmoRafHandle = null;
    }
  }

  private readonly onModelCameraChangeForGizmo = (): void => {
    if (this.gizmoRafHandle != null) return;
    this.gizmoRafHandle = requestAnimationFrame(() => {
      this.gizmoRafHandle = null;
      const el = this.gizmoListenerEl;
      if (!el) return;
      this.ngZone.run(() => this.readCameraOrbitInto(el));
    });
  };

  /**
   * Read the live spherical camera position into the gizmo signals. Prefers
   * `el.getCameraOrbit()` (returns radians per @google/model-viewer 3.5)
   * because the `cameraOrbit` property keeps the literal string we set last
   * (e.g. `'auto auto auto'` after Fit) where `parseFloat()` yields NaN.
   */
  private readCameraOrbitInto(el: ModelViewerElement): void {
    let thetaDeg: number | null = null;
    let phiDeg: number | null = null;

    if (typeof el.getCameraOrbit === 'function') {
      try {
        const sph = el.getCameraOrbit();
        if (sph && Number.isFinite(sph.theta) && Number.isFinite(sph.phi)) {
          thetaDeg = (sph.theta * 180) / Math.PI;
          phiDeg = (sph.phi * 180) / Math.PI;
        }
      } catch {
        /* fall through */
      }
    }

    if (thetaDeg == null || phiDeg == null) {
      const orbit = el.cameraOrbit || '';
      const tokens = orbit.trim().split(/\s+/);
      const t = parseFloat((tokens[0] ?? '').replace('deg', ''));
      const p = parseFloat((tokens[1] ?? '').replace('deg', ''));
      if (thetaDeg == null && Number.isFinite(t)) thetaDeg = t;
      if (phiDeg == null && Number.isFinite(p)) phiDeg = p;
    }

    if (thetaDeg != null) this.cameraOrbitTheta.set(thetaDeg);
    if (phiDeg != null) this.cameraOrbitPhi.set(phiDeg);
  }

  /**
   * Snap the camera to a standard CAD view in response to a click on the
   * orientation gizmo. Maps each face token to the elevation/plan view
   * aligned with the corresponding world axis.
   */
  goToFace(face: GizmoFace): void {
    const el = this.siteModelViewer()?.nativeElement;
    if (!el) return;
    const orbits: Record<GizmoFace, readonly [string, string]> = {
      '+x': ['90deg', '90deg'],
      '-x': ['-90deg', '90deg'],
      '+y': ['0deg', '0deg'],
      '-y': ['0deg', '180deg'],
      '+z': ['0deg', '90deg'],
      '-z': ['180deg', '90deg'],
    };
    const [theta, phi] = orbits[face];
    this.applyOrthoLikeView(el, theta, phi);
    const facePreset: Partial<Record<GizmoFace, ViewPresetId>> = {
      '+x': 'right',
      '-x': 'left',
      '+y': 'top',
      '+z': 'front',
    };
    const mappedPreset = facePreset[face];
    if (mappedPreset) {
      this.activeViewPreset.set(mappedPreset);
    }
    this.readCameraOrbitInto(el);
  }
}
