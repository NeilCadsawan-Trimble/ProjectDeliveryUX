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
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import {
  EXAMPLE_PROJECTS,
  EXAMPLE_TASKS,
  EXAMPLE_ACTIVITIES,
} from '../../data/example-data';

type WidgetId = 'exSummary' | 'exProjects' | 'exTasks' | 'exActivity';

@Component({
  selector: 'app-example-home',
  imports: [WidgetResizeHandleComponent, ModusProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="px-4 py-4 md:px-0 md:py-6 max-w-screen-xl mx-auto">
      <div #pageHeader>
        <div class="flex items-start justify-between mb-6">
          <div>
            <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome back</div>
            <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary-20 flex items-center justify-center flex-shrink-0">
              <i class="modus-icons text-2xl text-primary" aria-hidden="true">briefcase</i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-2xl font-bold text-foreground">{{ projects.length }}</div>
              <div class="text-sm text-foreground-60">Active Projects</div>
            </div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
              <i class="modus-icons text-2xl text-warning" aria-hidden="true">list_bulleted</i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-2xl font-bold text-foreground">{{ openTaskCount() }}</div>
              <div class="text-sm text-foreground-60">Open Tasks</div>
            </div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-success-20 flex items-center justify-center flex-shrink-0">
              <i class="modus-icons text-2xl text-success" aria-hidden="true">check_circle</i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-2xl font-bold text-foreground">{{ completedTaskCount() }}</div>
              <div class="text-sm text-foreground-60">Completed Tasks</div>
            </div>
          </div>
        </div>
      </div>

      <div
        [class]="isCanvasMode() ? 'relative overflow-visible' : 'relative'"
        [style.height.px]="isMobile() ? engine.mobileGridHeight() : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #widgetGrid
      >
        @for (widgetId of widgetIds; track widgetId) {
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

              @if (widgetId === 'exSummary') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">dashboard_tiles</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Summary</div>
                    </div>
                    <div
                      class="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-muted transition-colors duration-150"
                      (click)="focusWidget('exSummary')"
                      role="button"
                      aria-label="AI insights for Summary"
                    >
                      <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">more_vertical</i>
                    </div>
                  </div>
                  <div class="p-5 flex-1 overflow-auto">
                    <div class="grid grid-cols-2 gap-4">
                      @for (project of projects; track project.id) {
                        <div class="border-default rounded-lg p-4">
                          <div class="flex items-center justify-between mb-2">
                            <div class="text-sm font-semibold text-foreground truncate">{{ project.name }}</div>
                            <div class="text-xs px-2 py-0.5 rounded-full" [class]="statusClass(project.status)">{{ project.status }}</div>
                          </div>
                          <modus-progress [value]="project.progress" size="compact" />
                          <div class="text-xs text-foreground-60 mt-2">{{ project.progress }}% complete</div>
                        </div>
                      }
                    </div>
                  </div>
                  @if (!isMobile()) {
                    <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('exSummary', 'both', $event)" />
                  }
                </div>
              }

              @if (widgetId === 'exProjects') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">briefcase</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Projects</div>
                    </div>
                  </div>
                  <div class="p-5 flex-1 overflow-auto">
                    @for (project of projects; track project.id) {
                      <div class="flex items-center gap-4 py-3" [class.border-bottom-default]="!$last">
                        <div class="w-10 h-10 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                          <div class="text-sm font-bold text-primary">{{ project.ownerInitials }}</div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-semibold text-foreground">{{ project.name }}</div>
                          <div class="text-xs text-foreground-60">{{ project.client }} -- Due {{ project.dueDate }}</div>
                        </div>
                        <div class="text-right flex-shrink-0">
                          <div class="text-sm font-medium text-foreground">{{ project.budgetUsed }}</div>
                          <div class="text-xs text-foreground-60">of {{ project.budgetTotal }}</div>
                        </div>
                      </div>
                    }
                  </div>
                  @if (!isMobile()) {
                    <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('exProjects', 'both', $event)" />
                  }
                </div>
              }

              @if (widgetId === 'exTasks') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Tasks</div>
                      <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                        <div class="text-xs font-medium text-warning">{{ blockedCount() }} blocked</div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 overflow-auto">
                    @for (task of tasks; track task.id) {
                      <div class="flex items-center gap-4 px-5 py-3" [class.border-bottom-default]="!$last">
                        <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="priorityDotClass(task.priority)"></div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-foreground">{{ task.title }}</div>
                          <div class="text-xs text-foreground-60">{{ task.assignee }} -- Due {{ task.dueDate }}</div>
                        </div>
                        <div class="text-xs px-2 py-0.5 rounded-full" [class]="taskStatusClass(task.status)">{{ task.status }}</div>
                      </div>
                    }
                  </div>
                  @if (!isMobile()) {
                    <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('exTasks', 'both', $event)" />
                  }
                </div>
              }

              @if (widgetId === 'exActivity') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Activity</div>
                    </div>
                  </div>
                  <div class="flex-1 overflow-auto">
                    @for (item of activities; track item.id) {
                      <div class="flex items-start gap-3 px-5 py-3" [class.border-bottom-default]="!$last">
                        <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div class="text-xs font-bold text-foreground">{{ item.actorInitials }}</div>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm text-foreground">{{ item.text }}</div>
                          <div class="text-xs text-foreground-40 mt-0.5">{{ item.timeAgo }}</div>
                        </div>
                        <i class="modus-icons text-base flex-shrink-0 mt-1" [class]="item.iconColor" aria-hidden="true">{{ item.icon }}</i>
                      </div>
                    }
                  </div>
                  @if (!isMobile()) {
                    <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('exActivity', 'both', $event)" />
                  }
                </div>
              }

            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ExampleHomeComponent implements AfterViewInit {
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  readonly engine = new DashboardLayoutEngine({
    widgets: ['exSummary', 'exProjects', 'exTasks', 'exActivity'],
    layoutStorageKey: 'example-home',
    canvasStorageKey: 'canvas-layout:example-home:v1',
    defaultColStarts: { exSummary: 1, exProjects: 9, exTasks: 1, exActivity: 9 },
    defaultColSpans: { exSummary: 8, exProjects: 8, exTasks: 8, exActivity: 8 },
    defaultTops: { exSummary: 0, exProjects: 0, exTasks: 420, exActivity: 420 },
    defaultHeights: { exSummary: 400, exProjects: 400, exTasks: 360, exActivity: 360 },
    defaultLefts: { exSummary: 0, exProjects: 648, exTasks: 0, exActivity: 648 },
    defaultPixelWidths: { exSummary: 632, exProjects: 632, exTasks: 632, exActivity: 632 },
    canvasDefaultLefts: { exSummary: 0, exProjects: 648, exTasks: 0, exActivity: 648 },
    canvasDefaultPixelWidths: { exSummary: 632, exProjects: 632, exTasks: 632, exActivity: 632 },
    canvasDefaultTops: { exSummary: 0, exProjects: 0, exTasks: 420, exActivity: 420 },
    canvasDefaultHeights: { exSummary: 400, exProjects: 400, exTasks: 360, exActivity: 360 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 100,
    savesDesktopOnMobile: true,
    onBeforeMobileCompact: () => this.applyMobileHeights(),
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => this.engine.resetToDefaults());
    }
  });

  readonly isMobile = this.engine.isMobile;
  readonly isCanvasMode = this.engine.isCanvasMode;
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  readonly projects = EXAMPLE_PROJECTS;
  readonly tasks = EXAMPLE_TASKS;
  readonly activities = EXAMPLE_ACTIVITIES;

  readonly widgetIds: WidgetId[] = ['exSummary', 'exProjects', 'exTasks', 'exActivity'];

  readonly openTaskCount = computed(() =>
    this.tasks.filter((t) => t.status !== 'done').length
  );

  readonly completedTaskCount = computed(() =>
    this.tasks.filter((t) => t.status === 'done').length
  );

  readonly blockedCount = computed(() =>
    this.tasks.filter((t) => t.status === 'blocked').length
  );

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');

  statusClass(status: string): string {
    switch (status) {
      case 'On Track': return 'bg-success-20 text-success';
      case 'At Risk': return 'bg-warning-20 text-warning';
      case 'Overdue': return 'bg-destructive-20 text-destructive';
      default: return 'bg-muted text-foreground-60';
    }
  }

  priorityDotClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-primary';
      default: return 'bg-muted';
    }
  }

  taskStatusClass(status: string): string {
    switch (status) {
      case 'done': return 'bg-success-20 text-success';
      case 'in-progress': return 'bg-primary-20 text-primary';
      case 'blocked': return 'bg-destructive-20 text-destructive';
      default: return 'bg-muted text-foreground-60';
    }
  }

  onWidgetHeaderMouseDown(id: WidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: WidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    this.engine.startWidgetResize(target, dir, event);
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

  focusWidget(id: string): void {
    this.widgetFocusService.selectWidget(id);
  }

  private applyMobileHeights(): void {
    this.engine.widgetHeights.update((h) => ({
      ...h,
      exSummary: 360,
      exProjects: 320,
      exTasks: 300,
      exActivity: 280,
    }));
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.gridRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }
}
