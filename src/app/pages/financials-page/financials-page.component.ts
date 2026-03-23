import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetResizeHandleComponent } from '../../components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../services/widget-layout.service';
import { CanvasResetService } from '../../services/canvas-reset.service';
import { DashboardLayoutEngine } from '../../services/dashboard-layout-engine';
import type { DashboardWidgetId, Project } from '../../data/dashboard-data';
import { PROJECTS } from '../../data/dashboard-data';

@Component({
  selector: 'app-financials-page',
  imports: [ModusProgressComponent, ModusButtonComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="px-4 py-4 md:px-0 md:py-6 max-w-screen-xl mx-auto">
      <div #pageHeader>
      <!-- Page header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials</div>
          <div class="text-sm text-foreground-60 mt-1">Budget overview and cost tracking</div>
        </div>
        <div class="flex-shrink-0">
          <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Total Budget</div>
            <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-primary" aria-hidden="true">payment_instant</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-foreground">$3.7M</div>
          <div class="text-xs text-foreground-60">Across {{ totalProjects() }} active projects</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Total Spent</div>
            <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-warning" aria-hidden="true">bar_graph_line</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-foreground">$2.1M</div>
          <div class="text-xs text-warning font-medium">57% of total budget consumed</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Remaining</div>
            <div class="w-9 h-9 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-success" aria-hidden="true">bar_graph</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-success">$1.6M</div>
          <div class="text-xs text-success font-medium">43% remaining budget</div>
        </div>
      </div>
      </div>

      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #financialsWidgetGrid
      >
        @for (widgetId of financialsWidgets; track widgetId) {
          <div
            [class]="isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'absolute overflow-hidden'"
            [attr.data-widget-id]="widgetId"
            [style.top.px]="widgetTops()[widgetId]"
            [style.left.px]="!isMobile() ? widgetLefts()[widgetId] : null"
            [style.width.px]="!isMobile() ? widgetPixelWidths()[widgetId] : null"
            [style.height.px]="widgetHeights()[widgetId]"
            [style.z-index]="widgetZIndices()[widgetId] ?? 0"
          >
            <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">

              @if (widgetId === 'finBudgetByProject') {
                <!-- Budget by Project Widget -->
                <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                  <!-- Draggable header -->
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payment_instant</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Budget by Project</div>
                    </div>
                  </div>

                  <!-- Table header -->
                  <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                    <div role="columnheader">Project</div>
                    <div role="columnheader">Client</div>
                    <div class="text-right" role="columnheader">Budget</div>
                    <div role="columnheader">Progress</div>
                    <div class="text-right" role="columnheader">Used</div>
                  </div>

                  <!-- Table body -->
                  <div class="overflow-y-auto flex-1" role="table" aria-label="Budget by project">
                    @for (p of projects(); track p.id) {
                      <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                        <div class="text-sm font-medium text-foreground truncate" role="cell">{{ p.name }}</div>
                        <div class="text-sm text-foreground-60 truncate" role="cell">{{ p.client }}</div>
                        <div class="text-sm text-foreground-60 text-right" role="cell">{{ p.budgetUsed }} / {{ p.budgetTotal }}</div>
                        <div class="w-full" role="cell">
                          <modus-progress [value]="p.budgetPct" [max]="100" [className]="budgetProgressClass(p.budgetPct)" />
                        </div>
                        <div class="text-xs font-medium text-right
                          {{ p.budgetPct >= 90 ? 'text-destructive' : p.budgetPct >= 75 ? 'text-warning' : 'text-success' }}" role="cell">
                          {{ p.budgetPct }}%
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />
              }

            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class FinancialsPageComponent implements AfterViewInit {
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['finBudgetByProject'],
    layoutStorageKey: 'dashboard-financials',
    canvasStorageKey: 'canvas-layout:dashboard-financials:v1',
    defaultColStarts: { finBudgetByProject: 1 },
    defaultColSpans: { finBudgetByProject: 16 },
    defaultTops: { finBudgetByProject: 0 },
    defaultHeights: { finBudgetByProject: 520 },
    defaultLefts: { finBudgetByProject: 0 },
    defaultPixelWidths: { finBudgetByProject: 1280 },
    canvasDefaultLefts: { finBudgetByProject: 0 },
    canvasDefaultPixelWidths: { finBudgetByProject: 1280 },
    minColSpan: 1,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: false,
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0 && this.engine.isCanvasMode()) {
      untracked(() => this.engine.resetWidgets());
    }
  });

  private readonly _cleanupOverlapsEffect = effect(() => {
    const tick = this.canvasResetService.cleanupOverlapsTick();
    if (tick > 0 && this.engine.isCanvasMode()) {
      untracked(() => this.engine.cleanupOverlaps());
    }
  });

  readonly isMobile = this.engine.isMobile;
  readonly isCanvasMode = this.engine.isCanvasMode;
  readonly widgetColStarts = this.engine.widgetColStarts;
  readonly widgetColSpans = this.engine.widgetColSpans;
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  readonly projects = signal<Project[]>(PROJECTS);
  readonly totalProjects = computed(() => this.projects().length);
  readonly financialsWidgets: DashboardWidgetId[] = ['finBudgetByProject'];

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  budgetProgressClass(pct: number): string {
    if (pct >= 90) return 'progress-danger';
    if (pct >= 75) return 'progress-warning';
    return 'progress-success';
  }

  mobileGridHeight(): number {
    return this.engine.mobileGridHeight();
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    this.engine.startWidgetResize(target, dir, event);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent): void {
    this.engine.startWidgetResizeTouch(target, dir, event);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    this.engine.onDocumentTouchEnd();
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }
}
