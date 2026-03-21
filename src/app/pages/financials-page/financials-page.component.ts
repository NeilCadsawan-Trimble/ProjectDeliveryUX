import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  signal,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetLayoutService } from '../../services/widget-layout.service';
import { CanvasResetService } from '../../services/canvas-reset.service';
import type { DashboardWidgetId, Project } from '../../data/dashboard-data';
import { PROJECTS } from '../../data/dashboard-data';

@Component({
  selector: 'app-financials-page',
  imports: [ModusProgressComponent, ModusButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="p-6 max-w-screen-xl mx-auto">
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

      <!-- Widget area: 16-column grid layout -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : isMobile() ? 'relative mb-6' : 'grid mb-6'"
        [style.grid-template-columns]="!isCanvasMode() && !isMobile() ? 'repeat(16, minmax(0, 1fr))' : null"
        [style.grid-auto-rows]="!isCanvasMode() && !isMobile() ? '1px' : null"
        [style.gap]="!isCanvasMode() && !isMobile() ? '0 16px' : null"
        [style.height.px]="!isCanvasMode() && isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : null"
        #financialsWidgetGrid
      >
        @for (widgetId of financialsWidgets; track widgetId) {
          <div
            [class]="isCanvasMode() ? 'absolute overflow-hidden' : isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'relative'"
            [attr.data-widget-id]="widgetId"
            [style.grid-column]="!isCanvasMode() && !isMobile() ? widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId] : null"
            [style.grid-row]="!isCanvasMode() && !isMobile() ? (widgetTops()[widgetId] + 1) + ' / span ' + widgetHeights()[widgetId] : null"
            [style.top.px]="isCanvasMode() || isMobile() ? widgetTops()[widgetId] : null"
            [style.left.px]="isCanvasMode() ? widgetLefts()[widgetId] : null"
            [style.width.px]="isCanvasMode() ? widgetPixelWidths()[widgetId] : null"
            [style.height.px]="isCanvasMode() || isMobile() ? widgetHeights()[widgetId] : null"
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
                <!-- Corner resize handle -->
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                  [class.cursor-nwse-resize]="!isMobile()"
                  [class.cursor-ns-resize]="isMobile()"
                  (mousedown)="startWidgetResize(widgetId, 'both', $event)"
                  (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                  title="Drag to resize"
                >
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none">
                    <div class="flex gap-0.5">
                      <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
                      <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
                    </div>
                    <div class="flex gap-0.5">
                      <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
                      <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
                    </div>
                  </div>
                </div>
              }

            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class FinancialsPageComponent implements AfterViewInit {
  private readonly layoutService = inject(WidgetLayoutService);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _abortCtrl = new AbortController();

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this._abortCtrl.abort());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0 && this.isCanvasMode()) {
      untracked(() => {
        localStorage.removeItem('canvas-layout:dashboard-financials:v1');
        this.applyCanvasDefaults();
      });
    }
  });

  private readonly _cleanupOverlapsEffect = effect(() => {
    const tick = this.canvasResetService.cleanupOverlapsTick();
    if (tick > 0 && this.isCanvasMode()) {
      untracked(() => this.cleanupCanvasOverlaps());
    }
  });

  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvasMode = signal(typeof window !== 'undefined' ? window.innerWidth >= 2000 : false);
  readonly projects = signal<Project[]>(PROJECTS);
  readonly totalProjects = computed(() => this.projects().length);

  readonly financialsWidgets: DashboardWidgetId[] = ['finBudgetByProject'];

  readonly widgetColStarts = signal<Record<string, number>>({
    finBudgetByProject: 1,
  });
  readonly widgetColSpans = signal<Record<string, number>>({
    finBudgetByProject: 16,
  });
  readonly widgetTops = signal<Record<string, number>>({
    finBudgetByProject: 0,
  });
  readonly widgetHeights = signal<Record<string, number>>({
    finBudgetByProject: 520,
  });

  private static readonly GAP_PX = 16;
  private static readonly CANVAS_STEP = 81;

  readonly widgetLefts = signal<Record<string, number>>({
    finBudgetByProject: 0,
  });
  readonly widgetPixelWidths = signal<Record<string, number>>({
    finBudgetByProject: 1280,
  });

  private syncColSpansFromPixelWidths(): void {
    const widths = this.widgetPixelWidths();
    const step = FinancialsPageComponent.CANVAS_STEP;
    const gap = FinancialsPageComponent.GAP_PX;
    const spans: Record<string, number> = {};
    for (const id of this.financialsWidgets) {
      spans[id] = Math.max(1, Math.round((widths[id] + gap) / step));
    }
    this.widgetColSpans.set(spans);
  }

  readonly canvasGridMinHeight = computed(() => {
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    let max = 0;
    for (const id of this.financialsWidgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max + 200;
  });

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);

  private _moveTarget: DashboardWidgetId | null = null;
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
  private _resizeStartColSpan = 0;
  private _gridContainerWidth = 1200;

  budgetProgressClass(pct: number): string {
    if (pct >= 90) return 'progress-danger';
    if (pct >= 75) return 'progress-warning';
    return 'progress-success';
  }

  mobileGridHeight(): number {
    const widgets = this.financialsWidgets;
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    let max = 0;
    for (const id of widgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max;
  }

  private get activeGridEl(): HTMLElement | undefined {
    return this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
  }

  private resolveCollisions(movedId: DashboardWidgetId): void {
    if (this.isCanvasMode()) return;

    const widgets = this.financialsWidgets;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const gap = FinancialsPageComponent.GAP_PX;

    const mobile = this.isMobile();
    let colOverlap: (a: DashboardWidgetId, b: DashboardWidgetId) => boolean;
    if (mobile) {
      colOverlap = () => true;
    } else {
      colOverlap = (a, b) => starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];
    }

    const sorted = [...widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: DashboardWidgetId[] = [movedId];

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

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = this.isCanvasMode() ? 'free' : null;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    this.moveTargetId.set(id);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;

    if (this._dragAxis === 'free') {
      const step = FinancialsPageComponent.CANVAS_STEP;
      const gap = FinancialsPageComponent.GAP_PX;
      const rawTop = this._dragStartTop + (event.clientY - this._dragStartY);
      const rawLeft = this._dragStartLeft + (event.clientX - this._dragStartX);
      const newTop = Math.round(rawTop / gap) * gap;
      const newLeft = Math.round(rawLeft / step) * step;
      this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
      this.widgetLefts.update((l) => ({ ...l, [id]: newLeft }));
      this.resolveCollisions(id);
      return;
    }

    if (!this._dragAxis) {
      const dx = Math.abs(event.clientX - this._dragStartX);
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dx < 8 && dy < 8) return;
      this._dragAxis = this.isMobile() ? 'v' : (dx >= dy ? 'h' : 'v');
    }

    if (this._dragAxis === 'h') {
      const rect = grid.getBoundingClientRect();
      const colW = rect.width / 16;
      const span = this.widgetColSpans()[id];
      const rawStart = Math.floor((event.clientX - rect.left) / colW) + 1;
      const newColStart = Math.max(1, Math.min(17 - span, rawStart));
      if (newColStart !== this.widgetColStarts()[id]) {
        this.widgetColStarts.update(s => ({ ...s, [id]: newColStart }));
        this.resolveCollisions(id);
      }
    } else {
      const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
      this.widgetTops.update(t => ({ ...t, [id]: newTop }));
      this.resolveCollisions(id);
    }
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
      this._resizeStartColSpan = this.widgetColSpans()[target] ?? 8;
      this._gridContainerWidth = this.activeGridEl?.offsetWidth ?? 1200;
    }
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      const id = this._resizeTarget as DashboardWidgetId;

      if (this.isCanvasMode()) {
        if (this._resizeDir === 'v' || this._resizeDir === 'both') {
          const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
          const newH = Math.round(raw / 16) * 16;
          this.widgetHeights.update((h) => ({ ...h, [id]: newH }));
          this.resolveCollisions(id);
        }
        if (this._resizeDir === 'h' || this._resizeDir === 'both') {
          const colW = this._gridContainerWidth / 16;
          const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
          const newSpan = Math.max(4, Math.min(16, this._resizeStartColSpan + deltaSpan));
          const newW = newSpan * FinancialsPageComponent.CANVAS_STEP - FinancialsPageComponent.GAP_PX;
          this.widgetPixelWidths.update((w) => ({ ...w, [id]: newW }));
          this.widgetColSpans.update((s) => ({ ...s, [id]: newSpan }));
          this.resolveCollisions(id);
        }
      } else {
        if (this._resizeDir === 'v' || this._resizeDir === 'both') {
          const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
          const newH = Math.round(raw / 16) * 16;
          this.widgetHeights.update((h) => ({ ...h, [id]: newH }));
          this.resolveCollisions(id);
        }
        if (this._resizeDir === 'h' || this._resizeDir === 'both') {
          const colW = this._gridContainerWidth / 16;
          const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
          const newSpan = this._resizeStartColSpan + deltaSpan;
          const minSpan = 4;
          const clampedSpan = Math.max(minSpan, Math.min(16, newSpan));
          this.widgetColSpans.update((s) => ({ ...s, [id]: clampedSpan }));
          this.resolveCollisions(id);
        }
      }
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

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent): void {
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
    this._dragAxis = this.isCanvasMode() ? 'free' : null;
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this._dragStartLeft = this.widgetLefts()[id] ?? 0;
    this.moveTargetId.set(id);
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
      this._resizeStartColSpan = this.widgetColSpans()[target] ?? 8;
      this._gridContainerWidth = this.activeGridEl?.offsetWidth ?? 1200;
    }
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  private persistLayout(): void {
    const mobile = this.isMobile();
    const tops: Record<string, number> = {};
    const heights: Record<string, number> = {};
    const colStarts: Record<string, number> = {};
    const colSpans: Record<string, number> = {};
    for (const id of this.financialsWidgets) {
      tops[id] = this.widgetTops()[id];
      heights[id] = this.widgetHeights()[id];
      colStarts[id] = this.widgetColStarts()[id];
      colSpans[id] = this.widgetColSpans()[id];
    }
    this.layoutService.save('dashboard-financials', mobile, {
      tops,
      heights,
      colStarts,
      colSpans,
    });
  }

  private restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load('dashboard-financials', false);
    if (!saved) return false;
    const tops = { ...this.widgetTops() };
    const heights = { ...this.widgetHeights() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };
    for (const id of this.financialsWidgets) {
      if (saved.tops[id] !== undefined) tops[id] = saved.tops[id];
      if (saved.heights[id] !== undefined) heights[id] = saved.heights[id];
      if (saved.colStarts[id] !== undefined) colStarts[id] = saved.colStarts[id];
      if (saved.colSpans[id] !== undefined) colSpans[id] = saved.colSpans[id];
    }
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    return true;
  }

  private restoreMobileLayout(): boolean {
    const saved = this.layoutService.load('dashboard-financials', true);
    if (!saved) return false;
    const tops = { ...this.widgetTops() };
    const heights = { ...this.widgetHeights() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };
    for (const id of this.financialsWidgets) {
      if (saved.tops[id] !== undefined) tops[id] = saved.tops[id];
      if (saved.heights[id] !== undefined) heights[id] = saved.heights[id];
      if (saved.colStarts[id] !== undefined) colStarts[id] = saved.colStarts[id];
      if (saved.colSpans[id] !== undefined) colSpans[id] = saved.colSpans[id];
    }
    this.widgetTops.set(tops);
    this.widgetHeights.set(heights);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
    return true;
  }

  private _savedDesktopForCanvas: {
    tops: Record<string, number>;
    heights: Record<string, number>;
    colStarts: Record<string, number>;
    colSpans: Record<string, number>;
  } | null = null;

  private cleanupCanvasOverlaps(): void {
    const gap = FinancialsPageComponent.GAP_PX;
    const widgets = this.financialsWidgets;
    const origTops = this.widgetTops();
    const origLefts = this.widgetLefts();
    const tops = { ...origTops };
    const heights = this.widgetHeights();
    const lefts = { ...origLefts };
    const widths = this.widgetPixelWidths();

    const gridEl = this.activeGridEl;
    const headerEl = this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
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

  private persistCanvasLayout(): void {
    const layout: Record<string, Record<string, number>> = {
      tops: {}, heights: {}, lefts: {}, widths: {},
    };
    for (const id of this.financialsWidgets) {
      layout['tops'][id] = this.widgetTops()[id];
      layout['heights'][id] = this.widgetHeights()[id];
      layout['lefts'][id] = this.widgetLefts()[id];
      layout['widths'][id] = this.widgetPixelWidths()[id];
    }
    try {
      localStorage.setItem('canvas-layout:dashboard-financials:v1', JSON.stringify(layout));
    } catch { /* quota exceeded */ }
  }

  private restoreCanvasLayout(): boolean {
    try {
      const raw = localStorage.getItem('canvas-layout:dashboard-financials:v1');
      if (!raw) return false;
      const layout = JSON.parse(raw);
      const tops = { ...this.widgetTops() };
      const heights = { ...this.widgetHeights() };
      const lefts = { ...this.widgetLefts() };
      const widths = { ...this.widgetPixelWidths() };
      for (const id of this.financialsWidgets) {
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
    } catch { return false; }
  }

  private applyCanvasDefaults(): void {
    this.widgetLefts.set({
      finBudgetByProject: 0,
    });
    this.widgetPixelWidths.set({
      finBudgetByProject: 1280,
    });
    this.syncColSpansFromPixelWidths();
  }

  private stackAllForMobile(): void {
    const gap = FinancialsPageComponent.GAP_PX;
    const heights = this.widgetHeights();
    const tops = { ...this.widgetTops() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };

    let y = 0;
    for (const id of this.financialsWidgets) {
      tops[id] = y;
      colStarts[id] = 1;
      colSpans[id] = 16;
      y += heights[id] + gap;
    }

    this.widgetTops.set(tops);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
  }

  private compactAll(): void {
    const gap = FinancialsPageComponent.GAP_PX;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const widgets = this.financialsWidgets;
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

    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const canvas = this.isCanvasMode();
    let colOverlap: (a: DashboardWidgetId, b: DashboardWidgetId) => boolean;
    if (canvas) {
      const lefts = this.widgetLefts();
      const widths = this.widgetPixelWidths();
      colOverlap = (a, b) => lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];
    } else {
      colOverlap = (a, b) => starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];
    }

    const sorted = [...widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: DashboardWidgetId[] = [];

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

  ngAfterViewInit(): void {
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
      };
      if (!this.restoreCanvasLayout()) {
        this.applyCanvasDefaults();
      }
    } else if (startMobile) {
      const restoredMobile = this.restoreMobileLayout();
      if (restoredMobile) {
        this.compactAll();
      } else {
        this.stackAllForMobile();
      }
    } else {
      this.restoreDesktopLayout();
    }

    if (typeof window !== 'undefined') {
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
            };
          }
          if (!this.restoreCanvasLayout()) {
            this.applyCanvasDefaults();
          }
        } else if (nowMobile && !wasMobile) {
          const restoredMobile = this.restoreMobileLayout();
          if (restoredMobile) {
            this.compactAll();
          } else {
            this.stackAllForMobile();
          }
        } else if (!nowMobile && wasMobile && !nowCanvas) {
          this.persistLayout();
          this.restoreDesktopLayout();
        }
      };

      mq.addEventListener('change', () => onBreakpointChange(), { signal: this._abortCtrl.signal });
      canvasQuery.addEventListener('change', () => onBreakpointChange(), { signal: this._abortCtrl.signal });
      window.addEventListener('resize', () => onBreakpointChange(), { signal: this._abortCtrl.signal });

      document.addEventListener('touchmove', (e: TouchEvent) => {
        if (this._moveTarget || this._resizeTarget) {
          e.preventDefault();
          const touch = e.touches[0];
          if (touch) {
            this.onDocumentMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
          }
        }
      }, { passive: false, signal: this._abortCtrl.signal });
    }
  }
}
