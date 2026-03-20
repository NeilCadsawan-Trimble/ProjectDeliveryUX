import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetLayoutService } from '../../services/widget-layout.service';
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
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusButtonComponent],
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
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Projects Dashboard</div>
          <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 mt-1">
          <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
        </div>
      </div>

      <!-- Widget area: 16-column grid layout -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : isMobile() ? 'relative mb-6' : 'grid mb-6'"
        [style.grid-template-columns]="!isCanvasMode() && !isMobile() ? 'repeat(16, minmax(0, 1fr))' : null"
        [style.grid-auto-rows]="!isCanvasMode() && !isMobile() ? '1px' : null"
        [style.gap]="!isCanvasMode() && !isMobile() ? '0 1rem' : null"
        [style.height.px]="!isCanvasMode() && isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : null"
        #widgetGrid
      >

        @for (widgetId of projectWidgets; track widgetId) {

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
              <div
                class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                [class.cursor-nwse-resize]="!isMobile()"
                [class.cursor-ns-resize]="isMobile()"
                (mousedown)="startWidgetResize('projects', 'both', $event)"
                (touchstart)="startWidgetResizeTouch('projects', 'both', $event)"
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
              <div
                class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                [class.cursor-nwse-resize]="!isMobile()"
                [class.cursor-ns-resize]="isMobile()"
                (mousedown)="startWidgetResize('openEstimates', 'both', $event)"
                (touchstart)="startWidgetResizeTouch('openEstimates', 'both', $event)"
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
              <div
                class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                [class.cursor-nwse-resize]="!isMobile()"
                [class.cursor-ns-resize]="isMobile()"
                (mousedown)="startWidgetResize('recentActivity', 'both', $event)"
                (touchstart)="startWidgetResizeTouch('recentActivity', 'both', $event)"
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
              <div
                class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                [class.cursor-nwse-resize]="!isMobile()"
                [class.cursor-ns-resize]="isMobile()"
                (mousedown)="startWidgetResize('needsAttention', 'both', $event)"
                (touchstart)="startWidgetResizeTouch('needsAttention', 'both', $event)"
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
  private readonly elementRef = inject(ElementRef);
  private readonly layoutService = inject(WidgetLayoutService);

  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvasMode = signal(typeof window !== 'undefined' ? window.innerWidth >= 2000 : false);
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
  readonly onSchedulePct = computed(() =>
    Math.round((this.onTrackCount() / this.totalProjects()) * 100)
  );

  readonly openEstimatesCount = computed(() =>
    this.estimates().filter((e) => e.status !== 'Approved').length
  );
  readonly awaitingApprovalCount = computed(() =>
    this.estimates().filter((e) => e.status === 'Awaiting Approval').length
  );
  readonly totalEstimateValue = computed(() => {
    const total = this.estimates()
      .filter((e) => e.status !== 'Approved')
      .reduce((sum, e) => sum + e.valueRaw, 0);
    if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
    if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
    return `$${total}`;
  });

  private readonly estimatesContainerRef = viewChild<ElementRef>('estimatesContainer');
  readonly estimatesContainerWidth = signal<number>(0);
  private _estimatesResizeObserver: ResizeObserver | null = null;
  readonly estimatesNarrow = computed(() => {
    const w = this.estimatesContainerWidth();
    return w > 0 && w <= 1000;
  });
  readonly estimatesXNarrow = computed(() => {
    const w = this.estimatesContainerWidth();
    return w > 0 && w <= 760;
  });
  readonly estimatesXXNarrow = computed(() => {
    const w = this.estimatesContainerWidth();
    return w > 0 && w <= 680;
  });
  readonly estimatesUltraNarrow = computed(() => {
    const w = this.estimatesContainerWidth();
    return w > 0 && w <= 450;
  });
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

  readonly widgetColStarts = signal<Record<string, number>>({
    projects: 1,
    openEstimates: 1,
    recentActivity: 1,
    needsAttention: 13,
  });
  readonly widgetColSpans = signal<Record<string, number>>({
    projects: 16,
    openEstimates: 16,
    recentActivity: 12,
    needsAttention: 4,
  });
  readonly widgetTops = signal<Record<string, number>>({
    projects: 0,
    openEstimates: 784,
    recentActivity: 1320,
    needsAttention: 1320,
  });
  readonly widgetHeights = signal<Record<string, number>>({
    projects: 768,
    openEstimates: 520,
    recentActivity: 420,
    needsAttention: 420,
  });

  private static readonly CANVAS_STEP = 81;

  readonly widgetLefts = signal<Record<string, number>>({
    projects: 0,
    openEstimates: 0,
    recentActivity: 0,
    needsAttention: 972,
  });
  readonly widgetPixelWidths = signal<Record<string, number>>({
    projects: 1280,
    openEstimates: 1280,
    recentActivity: 956,
    needsAttention: 308,
  });

  readonly canvasGridMinHeight = computed(() => {
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    let max = 0;
    for (const id of this.projectWidgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max + 200;
  });

  private static readonly GAP_PX = 16;
  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');

  mobileGridHeight(): number {
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    let max = 0;
    for (const id of this.projectWidgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max;
  }

  private syncColSpansFromPixelWidths(): void {
    const widths = this.widgetPixelWidths();
    const step = ProjectsPageComponent.CANVAS_STEP;
    const gap = ProjectsPageComponent.GAP_PX;
    const spans: Record<string, number> = {};
    for (const id of this.projectWidgets) {
      spans[id] = Math.max(1, Math.round((widths[id] + gap) / step));
    }
    this.widgetColSpans.set(spans);
  }

  private resolveCollisions(movedId: DashboardWidgetId): void {
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const gap = ProjectsPageComponent.GAP_PX;
    const mobile = this.isMobile();
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const canvas = this.isCanvasMode();
    let colOverlap: (a: DashboardWidgetId, b: DashboardWidgetId) => boolean;
    if (mobile) {
      colOverlap = () => true;
    } else if (canvas) {
      const lefts = this.widgetLefts();
      const widths = this.widgetPixelWidths();
      colOverlap = (a, b) => lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];
    } else {
      colOverlap = (a, b) => starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];
    }

    const sorted = [...this.projectWidgets].sort((a, b) => tops[a] - tops[b]);
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

    const changed = this.projectWidgets.some((id) => tops[id] !== this.widgetTops()[id]);
    if (changed) {
      this.widgetTops.set(tops);
    }
  }

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);
  private _moveTarget: DashboardWidgetId | null = null;
  private _dragAxis: 'h' | 'v' | 'free' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;
  private _dragStartLeft = 0;

  private get activeGridEl(): HTMLElement | undefined {
    return this.gridContainerRef()?.nativeElement as HTMLElement | undefined;
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
      const newTop = this._dragStartTop + (event.clientY - this._dragStartY);
      const newLeft = this._dragStartLeft + (event.clientX - this._dragStartX);
      this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
      this.widgetLefts.update((l) => ({ ...l, [id]: newLeft }));
      this.resolveCollisions(id);
      return;
    }

    if (!this._dragAxis) {
      const dx = Math.abs(event.clientX - this._dragStartX);
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dx < 8 && dy < 8) return;
      this._dragAxis = this.isMobile() ? 'v' : dx >= dy ? 'h' : 'v';
    }

    if (this._dragAxis === 'h') {
      const rect = grid.getBoundingClientRect();
      const colW = rect.width / 16;
      const span = this.widgetColSpans()[id];
      const rawStart = Math.floor((event.clientX - rect.left) / colW) + 1;
      const newColStart = Math.max(1, Math.min(17 - span, rawStart));
      if (newColStart !== this.widgetColStarts()[id]) {
        this.widgetColStarts.update((s) => ({ ...s, [id]: newColStart }));
        this.resolveCollisions(id);
      }
    } else {
      const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
      this.widgetTops.update((t) => ({ ...t, [id]: newTop }));
      this.resolveCollisions(id);
    }
  }

  private _resizeTarget: string | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartColSpan = 0;
  private _gridContainerWidth = 1200;

  startWidgetResize(
    target: string,
    dir: 'h' | 'v' | 'both',
    event: MouseEvent
  ): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this.widgetHeights()[target as DashboardWidgetId] ?? 400;
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartColSpan = this.widgetColSpans()[target as DashboardWidgetId] ?? 8;
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
          const newW = newSpan * ProjectsPageComponent.CANVAS_STEP - ProjectsPageComponent.GAP_PX;
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
          const minSpan = id === 'needsAttention' ? 3 : 4;
          const clampedSpan = Math.max(minSpan, Math.min(16, newSpan));
          this.widgetColSpans.update((s) => ({ ...s, [id]: clampedSpan }));
          this.resolveCollisions(id);
        }
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

  startWidgetResizeTouch(
    target: string,
    dir: 'h' | 'v' | 'both',
    event: TouchEvent
  ): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = touch.clientY;
    this._resizeStartX = touch.clientX;
    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      this._resizeStartH = this.widgetHeights()[target as DashboardWidgetId] ?? 400;
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      this._resizeStartColSpan = this.widgetColSpans()[target as DashboardWidgetId] ?? 8;
      this._gridContainerWidth = this.activeGridEl?.offsetWidth ?? 1200;
    }
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  private persistLayout(): void {
    const mobile = this.isMobile();
    this.layoutService.save('dashboard-projects', mobile, {
      tops: this.widgetTops(),
      heights: this.widgetHeights(),
      colStarts: this.widgetColStarts(),
      colSpans: this.widgetColSpans(),
    });
  }

  private restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load('dashboard-projects', false);
    if (!saved) return false;
    this.widgetTops.set(saved.tops as Record<string, number>);
    this.widgetHeights.set(saved.heights as Record<string, number>);
    this.widgetColStarts.set(saved.colStarts as Record<string, number>);
    this.widgetColSpans.set(saved.colSpans as Record<string, number>);
    return true;
  }

  private restoreMobileLayout(): boolean {
    const saved = this.layoutService.load('dashboard-projects', true);
    if (!saved) return false;
    this.widgetTops.set(saved.tops as Record<string, number>);
    this.widgetHeights.set(saved.heights as Record<string, number>);
    this.widgetColStarts.set(saved.colStarts as Record<string, number>);
    this.widgetColSpans.set(saved.colSpans as Record<string, number>);
    return true;
  }

  private _savedDesktopTops: Record<string, number> | null = null;
  private _savedDesktopColStarts: Record<string, number> | null = null;
  private _savedDesktopColSpans: Record<string, number> | null = null;
  private _savedDesktopHeights: Record<string, number> | null = null;

  private _savedDesktopForCanvas: {
    tops: Record<string, number>;
    heights: Record<string, number>;
    colStarts: Record<string, number>;
    colSpans: Record<string, number>;
  } | null = null;

  private persistCanvasLayout(): void {
    const layout: Record<string, Record<string, number>> = {
      tops: {},
      heights: {},
      lefts: {},
      widths: {},
    };
    for (const id of this.projectWidgets) {
      layout['tops'][id] = this.widgetTops()[id];
      layout['heights'][id] = this.widgetHeights()[id];
      layout['lefts'][id] = this.widgetLefts()[id];
      layout['widths'][id] = this.widgetPixelWidths()[id];
    }
    try {
      localStorage.setItem('canvas-layout:dashboard-projects:v1', JSON.stringify(layout));
    } catch {
      /* quota exceeded */
    }
  }

  private restoreCanvasLayout(): boolean {
    try {
      const raw = localStorage.getItem('canvas-layout:dashboard-projects:v1');
      if (!raw) return false;
      const layout = JSON.parse(raw) as {
        tops?: Record<string, number>;
        heights?: Record<string, number>;
        lefts?: Record<string, number>;
        widths?: Record<string, number>;
      };
      const tops = { ...this.widgetTops() };
      const heights = { ...this.widgetHeights() };
      const lefts = { ...this.widgetLefts() };
      const widths = { ...this.widgetPixelWidths() };
      for (const id of this.projectWidgets) {
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
    } catch {
      return false;
    }
  }

  private applyCanvasDefaults(): void {
    this.widgetLefts.set({
      projects: 0,
      openEstimates: 0,
      recentActivity: 0,
      needsAttention: 972,
    });
    this.widgetPixelWidths.set({
      projects: 1280,
      openEstimates: 1280,
      recentActivity: 956,
      needsAttention: 308,
    });
    this.syncColSpansFromPixelWidths();
  }

  private stackAllForMobile(): void {
    const gap = ProjectsPageComponent.GAP_PX;
    const heights = this.widgetHeights();
    const tops = { ...this.widgetTops() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };

    let y = 0;
    for (const id of this.projectWidgets) {
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
    const gap = ProjectsPageComponent.GAP_PX;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const widgets = this.projectWidgets;
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

    const changed = widgets.some((id) => tops[id] !== this.widgetTops()[id]);
    if (changed) {
      this.widgetTops.set(tops);
    }
  }

  ngAfterViewInit(): void {
    const startMobile = window.innerWidth < 768;
    const startCanvas = window.innerWidth >= 2000;
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
      this.restoreDesktopLayout();
      this._savedDesktopTops = { ...this.widgetTops() };
      this._savedDesktopColStarts = { ...this.widgetColStarts() };
      this._savedDesktopColSpans = { ...this.widgetColSpans() };
      this._savedDesktopHeights = { ...this.widgetHeights() };
      const restoredMobile = this.restoreMobileLayout();
      if (restoredMobile) {
        this.compactAll();
      } else {
        this.stackAllForMobile();
      }
    } else {
      this.restoreDesktopLayout();
    }

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
        this._savedDesktopTops = { ...this.widgetTops() };
        this._savedDesktopColStarts = { ...this.widgetColStarts() };
        this._savedDesktopColSpans = { ...this.widgetColSpans() };
        this._savedDesktopHeights = { ...this.widgetHeights() };
        const restoredMobile = this.restoreMobileLayout();
        if (restoredMobile) {
          this.compactAll();
        } else {
          this.stackAllForMobile();
        }
      } else if (!nowMobile && wasMobile && !nowCanvas) {
        this.persistLayout();
        if (this._savedDesktopTops) {
          this.widgetTops.set(this._savedDesktopTops);
          if (this._savedDesktopColStarts)
            this.widgetColStarts.set(this._savedDesktopColStarts);
          if (this._savedDesktopColSpans)
            this.widgetColSpans.set(this._savedDesktopColSpans);
          if (this._savedDesktopHeights)
            this.widgetHeights.set(this._savedDesktopHeights);
          this._savedDesktopTops = null;
          this._savedDesktopColStarts = null;
          this._savedDesktopColSpans = null;
          this._savedDesktopHeights = null;
        } else {
          this.restoreDesktopLayout();
        }
      }
    };

    mq.addEventListener('change', onBreakpointChange);
    canvasQuery.addEventListener('change', onBreakpointChange);
    window.addEventListener('resize', onBreakpointChange);

    document.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (this._moveTarget || this._resizeTarget) {
          e.preventDefault();
          const touch = e.touches[0];
          if (touch) {
            this.onDocumentMouseMove({
              clientX: touch.clientX,
              clientY: touch.clientY,
            } as MouseEvent);
          }
        }
      },
      { passive: false }
    );
  }
}
