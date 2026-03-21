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
import { Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetResizeHandleComponent } from '../../components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../services/widget-layout.service';
import { CanvasResetService } from '../../services/canvas-reset.service';
import { DashboardLayoutEngine } from '../../services/dashboard-layout-engine';
import type {
  DashboardWidgetId,
  Project,
  Estimate,
  ActivityItem,
} from '../../data/dashboard-data';
import {
  PROJECTS,
  ESTIMATES,
  ACTIVITIES,
  ATTENTION_ITEMS,
  statusBadgeColor,
  progressClass,
  budgetProgressClass,
  budgetPctColor,
  estimateBadgeColor,
  dueDateClass,
} from '../../data/dashboard-data';

@Component({
  selector: 'app-projects-page',
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusButtonComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="p-6 max-w-screen-xl mx-auto">

      <!-- Page header -->
      <div #pageHeader class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Projects Dashboard</div>
          <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 mt-1">
          <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
        </div>
      </div>

      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #widgetGrid
      >

        @for (widgetId of projectWidgets; track widgetId) {

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

            @if (widgetId === 'projects') {
            <!-- Projects Widget -->
            <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full" #projectsContainer>
              <div
                class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
              >
                <div class="flex items-center gap-2">
                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                  <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">apps</i>
                  <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Projects</div>
                  <div class="text-xs text-foreground-40">{{ totalProjects() }} projects</div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-20">
                    <div class="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <div class="text-xs font-medium text-success">{{ onTrackCount() }} On Track</div>
                  </div>
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-20">
                    <div class="w-1.5 h-1.5 rounded-full bg-warning"></div>
                    <div class="text-xs font-medium text-warning">{{ atRiskCount() }} At Risk</div>
                  </div>
                  <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive-20">
                    <div class="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    <div class="text-xs font-medium text-destructive">{{ overdueCount() }} Overdue</div>
                  </div>
                </div>
              </div>
              <div class="p-4 overflow-y-auto flex-1 min-h-0">
                <div class="grid gap-3" [class]="projectsGridCols()">
                  @for (project of projects(); track project.id) {
                    <div
                      class="bg-background border-default rounded-lg overflow-hidden flex flex-col cursor-pointer hover:bg-muted transition-colors duration-150"
                      (click)="navigateToProject(project.id)"
                      (keydown.enter)="navigateToProject(project.id)"
                      role="link"
                      tabindex="0"
                      [attr.aria-label]="'Open ' + project.name + ' dashboard'"
                    >
                      <div class="h-1 w-full flex-shrink-0"
                        [class.bg-success]="project.status === 'On Track'"
                        [class.bg-warning]="project.status === 'At Risk'"
                        [class.bg-destructive]="project.status === 'Overdue'"
                        [class.bg-muted]="project.status === 'Planning'"
                      ></div>
                      <div class="p-4 flex flex-col gap-3 flex-1">
                        <div class="flex items-start justify-between gap-2">
                          <div class="text-sm font-semibold text-foreground leading-tight">{{ project.name }}</div>
                          <modus-badge [color]="statusBadgeColor(project.status)" variant="filled" size="sm">
                            {{ project.status }}
                          </modus-badge>
                        </div>
                        <div class="text-xs text-foreground-60">{{ project.client }}</div>
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1.5">
                            <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xs font-semibold flex-shrink-0">
                              {{ project.ownerInitials }}
                            </div>
                            <div class="text-xs text-foreground-60 truncate max-w-[80px]">{{ project.owner }}</div>
                          </div>
                          <div class="flex items-center gap-1 text-xs text-foreground-60">
                            <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                            <div>{{ project.dueDate }}</div>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center justify-between">
                            <div class="text-2xs text-foreground-40 uppercase tracking-wide">Schedule</div>
                            <div class="text-2xs text-foreground-60 font-medium">{{ project.progress }}%</div>
                          </div>
                          <modus-progress [value]="project.progress" [max]="100" [className]="progressClass(project.status)" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center justify-between">
                            <div class="text-2xs text-foreground-40 uppercase tracking-wide">Budget</div>
                            <div class="text-2xs flex-shrink-0">
                              <div [class]="budgetPctColor(project.budgetPct)">{{ project.budgetPct }}%</div>
                            </div>
                          </div>
                          <modus-progress [value]="project.budgetPct" [max]="100" [className]="budgetProgressClass(project.budgetPct)" />
                          <div class="text-2xs text-foreground-40">{{ project.budgetUsed }} / {{ project.budgetTotal }}</div>
                        </div>
                        <div class="flex items-center gap-1.5 border-top-default pt-3 mt-1">
                          <i class="modus-icons text-sm text-primary" aria-hidden="true">draft</i>
                          <div class="text-2xs text-primary truncate cursor-pointer hover:underline" (click)="navigateToProject(project.id); $event.stopPropagation()">
                            {{ project.latestDrawingName }}
                          </div>
                          <div class="text-2xs text-foreground-40 flex-shrink-0">{{ project.latestDrawingVersion }}</div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <widget-resize-handle
                [isMobile]="isMobile()"
                (resizeStart)="startWidgetResize('projects', 'both', $event)"
                (resizeTouchStart)="startWidgetResizeTouch('projects', 'both', $event)"
              />
            </div>

            } @else if (widgetId === 'openEstimates') {
            <!-- Open Estimates Widget -->
            <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full" #estimatesContainer>
              <div
                class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
              >
                <div class="flex items-center gap-2">
                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                  <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">description</i>
                  <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Open Estimates</div>
                  <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                </div>
              </div>
              <div
                role="row"
                class="grid gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0"
                [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
              >
                @if (!estimatesXXNarrow()) {
                  <div role="columnheader">ID</div>
                }
                <div role="columnheader">Project / Client</div>
                @if (!estimatesXNarrow()) {
                  <div role="columnheader">Type</div>
                }
                @if (!estimatesUltraNarrow()) {
                  <div role="columnheader">Value</div>
                }
                <div role="columnheader">Status</div>
                @if (!estimatesNarrow()) {
                  <div role="columnheader">Requested By</div>
                }
                <div role="columnheader">Due Date</div>
              </div>
              <div class="overflow-y-auto flex-1" role="table" aria-label="Open estimates">
                @for (estimate of estimates(); track estimate.id) {
                  <div
                    role="row"
                    class="grid gap-3 px-6 py-4 border-bottom-default items-center last:border-b-0 hover:bg-muted transition-colors duration-150"
                    [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                  >
                    @if (!estimatesXXNarrow()) {
                      <div role="cell" class="text-sm font-mono text-primary font-medium">{{ estimate.id }}</div>
                    }
                    <div role="cell">
                      <div class="text-sm font-medium text-foreground truncate">{{ estimate.project }}</div>
                      <div class="text-xs text-foreground-60 mt-0.5 truncate">{{ estimate.client }}</div>
                    </div>
                    @if (!estimatesXNarrow()) {
                      <div role="cell">
                        <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ estimate.type }}</div>
                      </div>
                    }
                    @if (!estimatesUltraNarrow()) {
                      <div role="cell" class="text-sm font-semibold text-foreground">{{ estimate.value }}</div>
                    }
                    <div role="cell">
                      <modus-badge [color]="estimateBadgeColor(estimate.status)" variant="outlined" size="sm">
                        {{ estimate.status }}
                      </modus-badge>
                    </div>
                    @if (!estimatesNarrow()) {
                      <div role="cell" class="flex items-center gap-2 min-w-0">
                        <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold flex-shrink-0">
                          {{ estimate.requestedByInitials }}
                        </div>
                        <div class="text-xs text-foreground-80 truncate">{{ estimate.requestedBy }}</div>
                      </div>
                    }
                    <div role="cell">
                      <div class="text-sm text-foreground-80">{{ estimate.dueDate }}</div>
                      <div class="text-xs mt-0.5" [class]="dueDateClass(estimate.daysLeft)">
                        @if (estimate.daysLeft < 0) {
                          {{ -estimate.daysLeft }}d overdue
                        } @else if (estimate.daysLeft === 0) {
                          Due today
                        } @else {
                          {{ estimate.daysLeft }}d left
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
              <widget-resize-handle
                [isMobile]="isMobile()"
                (resizeStart)="startWidgetResize('openEstimates', 'both', $event)"
                (resizeTouchStart)="startWidgetResizeTouch('openEstimates', 'both', $event)"
              />
            </div>

            } @else if (widgetId === 'recentActivity') {
            <!-- Recent Activity Widget -->
            <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
              <div
                class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
              >
                <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
                <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Recent Activity</div>
              </div>
              <div class="overflow-y-auto flex-1">
                @for (activity of activities; track activity.id) {
                  <div class="flex items-start gap-4 px-6 py-4 border-bottom-default last:border-b-0">
                    <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <i class="modus-icons text-sm {{ activity.iconColor }}" aria-hidden="true">{{ activity.icon }}</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm text-foreground">
                        <div class="w-7 h-7 rounded-full bg-primary-20 text-primary text-xs font-semibold inline-flex items-center justify-center mr-1 flex-shrink-0">
                          {{ activity.actorInitials }}
                        </div>
                        {{ activity.text }}
                      </div>
                    </div>
                    <div class="text-xs text-foreground-40 flex-shrink-0 mt-0.5">{{ activity.timeAgo }}</div>
                  </div>
                }
              </div>
              <widget-resize-handle
                [isMobile]="isMobile()"
                (resizeStart)="startWidgetResize('recentActivity', 'both', $event)"
                (resizeTouchStart)="startWidgetResizeTouch('recentActivity', 'both', $event)"
              />
            </div>

            } @else if (widgetId === 'needsAttention') {
            <!-- Needs Attention Widget -->
            <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
              <div
                class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
              >
                <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                <i class="modus-icons text-lg text-warning" aria-hidden="true">warning</i>
                <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Needs Attention</div>
              </div>
              <div class="overflow-y-auto flex-1">
                @for (item of attentionItems; track item.id) {
                  <div class="flex items-start gap-3 px-6 py-4 border-bottom-default last:border-b-0">
                    <div class="w-2 h-2 rounded-full flex-shrink-0 mt-2 {{ item.dotClass }}"></div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-foreground">{{ item.title }}</div>
                      <div class="text-xs text-foreground-60 mt-0.5">{{ item.subtitle }}</div>
                    </div>
                  </div>
                }
              </div>
              <widget-resize-handle
                [isMobile]="isMobile()"
                (resizeStart)="startWidgetResize('needsAttention', 'both', $event)"
                (resizeTouchStart)="startWidgetResizeTouch('needsAttention', 'both', $event)"
              />
            </div>

            }

          </div>
        </div>

        }

      </div>

    </div>
  `,
})
export class ProjectsPageComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['projects', 'openEstimates', 'recentActivity', 'needsAttention'],
    layoutStorageKey: 'dashboard-projects',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v1',
    defaultColStarts: { projects: 1, openEstimates: 1, recentActivity: 1, needsAttention: 13 },
    defaultColSpans: { projects: 16, openEstimates: 16, recentActivity: 12, needsAttention: 4 },
    defaultTops: { projects: 0, openEstimates: 784, recentActivity: 1320, needsAttention: 1320 },
    defaultHeights: { projects: 768, openEstimates: 520, recentActivity: 420, needsAttention: 420 },
    defaultLefts: { projects: 0, openEstimates: 0, recentActivity: 0, needsAttention: 972 },
    defaultPixelWidths: { projects: 1280, openEstimates: 1280, recentActivity: 956, needsAttention: 308 },
    canvasDefaultLefts: { projects: 0, openEstimates: 0, recentActivity: 0, needsAttention: 972 },
    canvasDefaultPixelWidths: { projects: 1280, openEstimates: 1280, recentActivity: 956, needsAttention: 308 },
    minColSpan: 4,
    widgetMinColSpans: { needsAttention: 3 },
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
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

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly projects = signal<Project[]>(PROJECTS);
  readonly estimates = signal<Estimate[]>(ESTIMATES);
  readonly activities: ActivityItem[] = ACTIVITIES;
  readonly attentionItems = ATTENTION_ITEMS;

  readonly totalProjects = computed(() => this.projects().length);
  readonly onTrackCount = computed(() => this.projects().filter((p) => p.status === 'On Track').length);
  readonly atRiskCount = computed(() => this.projects().filter((p) => p.status === 'At Risk').length);
  readonly overdueCount = computed(() => this.projects().filter((p) => p.status === 'Overdue').length);

  private readonly estimatesContainerRef = viewChild<ElementRef>('estimatesContainer');
  readonly estimatesContainerWidth = signal<number>(0);
  private _estimatesResizeObserver: ResizeObserver | null = null;
  readonly estimatesBreakpoint = computed<'wide' | 'narrow' | 'xNarrow' | 'xxNarrow' | 'ultraNarrow'>(() => {
    const w = this.estimatesContainerWidth();
    if (w > 0 && w <= 450) return 'ultraNarrow';
    if (w > 0 && w <= 680) return 'xxNarrow';
    if (w > 0 && w <= 760) return 'xNarrow';
    if (w > 0 && w <= 1000) return 'narrow';
    return 'wide';
  });
  readonly estimatesNarrow = computed(() => this.estimatesBreakpoint() !== 'wide');
  readonly estimatesXNarrow = computed(() => {
    const bp = this.estimatesBreakpoint();
    return bp === 'xNarrow' || bp === 'xxNarrow' || bp === 'ultraNarrow';
  });
  readonly estimatesXXNarrow = computed(() => {
    const bp = this.estimatesBreakpoint();
    return bp === 'xxNarrow' || bp === 'ultraNarrow';
  });
  readonly estimatesUltraNarrow = computed(() => this.estimatesBreakpoint() === 'ultraNarrow');
  private readonly _estimatesResizeEffect = effect(() => {
    const el = this.estimatesContainerRef()?.nativeElement as HTMLElement | undefined;
    this._estimatesResizeObserver?.disconnect();
    this._estimatesResizeObserver = null;
    if (!el) {
      this.estimatesContainerWidth.set(0);
      return;
    }
    this.estimatesContainerWidth.set(el.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? el.offsetWidth;
      this.estimatesContainerWidth.set(w);
    });
    ro.observe(el);
    this._estimatesResizeObserver = ro;
  });

  private readonly projectsContainerRef = viewChild<ElementRef>('projectsContainer');
  readonly projectsContainerWidth = signal<number>(0);
  private _projectsResizeObserver: ResizeObserver | null = null;
  readonly projectsGridCols = computed(() => {
    const w = this.projectsContainerWidth();
    if (w > 0 && w <= 400) return 'grid-cols-1';
    if (w > 0 && w <= 640) return 'grid-cols-2';
    if (w > 0 && w <= 960) return 'grid-cols-3';
    return 'grid-cols-4';
  });
  private readonly _projectsResizeEffect = effect(() => {
    const el = this.projectsContainerRef()?.nativeElement as HTMLElement | undefined;
    this._projectsResizeObserver?.disconnect();
    this._projectsResizeObserver = null;
    if (!el) {
      this.projectsContainerWidth.set(0);
      return;
    }
    this.projectsContainerWidth.set(el.offsetWidth);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? el.offsetWidth;
      this.projectsContainerWidth.set(w);
    });
    ro.observe(el);
    this._projectsResizeObserver = ro;
  });

  navigateToProject(projectId: number): void {
    this.router.navigate(['/project', projectId]);
  }

  readonly statusBadgeColor = statusBadgeColor;
  readonly progressClass = progressClass;
  readonly budgetProgressClass = budgetProgressClass;
  readonly budgetPctColor = budgetPctColor;
  readonly estimateBadgeColor = estimateBadgeColor;
  readonly dueDateClass = dueDateClass;

  readonly projectWidgets: DashboardWidgetId[] = [
    'projects',
    'openEstimates',
    'recentActivity',
    'needsAttention',
  ];

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');

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
    this.engine.gridElAccessor = () => this.gridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }
}
