import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetLayoutService } from '../../services/widget-layout.service';
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

      <!-- Widget area: 16-column grid layout -->
      <div
        [class]="isMobile() ? 'relative mb-6' : 'grid mb-6'"
        [style.grid-template-columns]="isMobile() ? null : 'repeat(16, minmax(0, 1fr))'"
        [style.grid-auto-rows]="isMobile() ? null : '1px'"
        [style.gap]="isMobile() ? null : '0 16px'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        #financialsWidgetGrid
      >
        @for (widgetId of financialsWidgets; track widgetId) {
          <div
            [class]="isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'relative'"
            [attr.data-widget-id]="widgetId"
            [style.grid-column]="isMobile() ? null : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
            [style.grid-row]="isMobile() ? null : (widgetTops()[widgetId] + 1) + ' / span ' + widgetHeights()[widgetId]"
            [style.top.px]="isMobile() ? widgetTops()[widgetId] : null"
            [style.height.px]="isMobile() ? widgetHeights()[widgetId] : null"
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
  private readonly elementRef = inject(ElementRef);
  private readonly layoutService = inject(WidgetLayoutService);

  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
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

  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);

  private _moveTarget: DashboardWidgetId | null = null;
  private _dragAxis: 'h' | 'v' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;

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
    const widgets = this.financialsWidgets;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const gap = FinancialsPageComponent.GAP_PX;

    const mobile = this.isMobile();
    const colOverlap = (a: DashboardWidgetId, b: DashboardWidgetId) =>
      mobile || (starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a]);

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

    const changed = widgets.some(id => tops[id] !== this.widgetTops()[id]);
    if (changed) {
      this.widgetTops.set(tops);
    }
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = null;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this.moveTargetId.set(id);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;
    const gridWidgets = this.financialsWidgets;

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
      const gridWidgets = this.financialsWidgets;

      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
        const newH = Math.round(raw / 16) * 16;
        this.widgetHeights.update(h => ({ ...h, [id]: newH }));
        this.resolveCollisions(id);
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const colW = this._gridContainerWidth / 16;
        const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
        const newSpan = this._resizeStartColSpan + deltaSpan;
        const minSpan = 4;
        const clampedSpan = Math.max(minSpan, Math.min(16, newSpan));
        this.widgetColSpans.update(s => ({ ...s, [id]: clampedSpan }));
        this.resolveCollisions(id);
      }
    }
  }

  onDocumentMouseUp(): void {
    const hadInteraction = !!this._moveTarget || !!this._resizeTarget;
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    if (hadInteraction) {
      this.compactAll();
      this.persistLayout();
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
    this._dragAxis = null;
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.widgetTops()[id];
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
    const colOverlap = (a: DashboardWidgetId, b: DashboardWidgetId) =>
      starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];

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

    if (widgets.some(id => tops[id] !== this.widgetTops()[id])) {
      this.widgetTops.set(tops);
    }
  }

  ngAfterViewInit(): void {
    const startMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    this.isMobile.set(startMobile);

    if (startMobile) {
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
      const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList): void => {
        const wasMobile = this.isMobile();
        this.isMobile.set(e.matches);
        if (e.matches && !wasMobile) {
          const restoredMobile = this.restoreMobileLayout();
          if (restoredMobile) {
            this.compactAll();
          } else {
            this.stackAllForMobile();
          }
        }
      };
      mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void);

      window.addEventListener('resize', () => {
        const mobile = window.innerWidth < 768;
        if (mobile !== this.isMobile()) {
          onBreakpointChange(mq);
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
      }, { passive: false });
    }
  }
}
