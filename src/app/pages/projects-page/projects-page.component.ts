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
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type {
  DashboardWidgetId,
  Project,
  UrgentNeedItem,
} from '../../data/dashboard-data';
import {
  PROJECTS,
  statusBadgeColor,
  progressClass,
  budgetProgressClass,
  budgetPctColor,
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  getProjectJobCosts,
} from '../../data/dashboard-data';
import { getAgent, type AgentDataState } from '../../data/widget-agents';

@Component({
  selector: 'app-projects-page',
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusButtonComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">

      @if (!isCanvasMode()) {
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
      }

      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #widgetGrid
      >

        @if (isCanvasMode()) {
        <div
          class="absolute overflow-hidden"
          [attr.data-widget-id]="'projsHeader'"
          [style.top.px]="widgetTops()['projsHeader']"
          [style.left.px]="widgetLefts()['projsHeader']"
          [style.width.px]="widgetPixelWidths()['projsHeader']"
          [style.height.px]="widgetHeights()['projsHeader']"
          [style.z-index]="widgetZIndices()['projsHeader'] ?? 0"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Projects Dashboard</div>
              <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 mt-1">
              <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
            </div>
          </div>
        </div>
        }

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
            <widget-lock-toggle [locked]="widgetLocked()[widgetId]" (toggle)="toggleWidgetLock(widgetId)" />

            @if (widgetId === 'projects') {
            <!-- Projects Widget -->
            <div class="relative bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId" #projectsContainer>
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
              @if (projectsInsight()) {
                <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
                  <div class="text-xs text-foreground-60 truncate leading-none">{{ projectsInsight() }}</div>
                </div>
              }
              <div class="p-4 overflow-y-auto flex-1 min-h-0">
                <div class="grid gap-3" [class]="projectsGridCols()">
                  @for (project of projects(); track project.id) {
                    <div
                      class="bg-background border-default rounded-lg overflow-hidden flex flex-col cursor-pointer hover:bg-muted transition-colors duration-150"
                      (click)="navigateToProject(project)"
                      (keydown.enter)="navigateToProject(project)"
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
                          <div class="flex items-center justify-between">
                            <div class="text-2xs text-foreground-40">{{ project.budgetUsed }} / {{ project.budgetTotal }}</div>
                            @if (getProjectAgent(project.id).budgetAlert) {
                              <div
                                class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary-20 text-primary text-2xs font-medium cursor-pointer hover:bg-primary-40 transition-colors duration-150"
                                (click)="navigateToJobCosts(project, $event)"
                                role="link"
                                [attr.aria-label]="'View ' + project.name + ' job costs'"
                              >
                                <i class="modus-icons text-2xs" aria-hidden="true">account_balance</i>
                                Job Costs
                              </div>
                            }
                          </div>
                        </div>

                        @if (getProjectAgent(project.id).criticalCount > 0 || getProjectAgent(project.id).warningCount > 0) {
                          <div class="border-top-default pt-3 mt-1 flex flex-col gap-2">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-1.5">
                                <i class="modus-icons text-sm text-warning" aria-hidden="true">warning</i>
                                <div class="text-2xs font-semibold text-foreground-60 uppercase tracking-wide">Urgent Needs</div>
                              </div>
                              <div class="flex items-center gap-1.5">
                                @if (getProjectAgent(project.id).criticalCount > 0) {
                                  <div class="flex items-center px-1.5 py-0.5 rounded-full bg-destructive-20">
                                    <div class="text-2xs font-medium text-destructive">{{ getProjectAgent(project.id).criticalCount }} critical</div>
                                  </div>
                                }
                                @if (getProjectAgent(project.id).warningCount > 0) {
                                  <div class="flex items-center px-1.5 py-0.5 rounded-full bg-warning-20">
                                    <div class="text-2xs font-medium text-warning">{{ getProjectAgent(project.id).warningCount }} warning</div>
                                  </div>
                                }
                              </div>
                            </div>
                            @if (getProjectAgent(project.id).topNeed; as topNeed) {
                              <div class="flex items-start gap-2">
                                <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                  [class.bg-destructive]="topNeed.severity === 'critical'"
                                  [class.bg-warning]="topNeed.severity === 'warning'"
                                  [class.bg-primary]="topNeed.severity === 'info'"></div>
                                <div class="flex-1 min-w-0">
                                  <div class="text-2xs font-medium text-foreground truncate">{{ topNeed.title }}</div>
                                  <div class="text-2xs text-foreground-40 truncate">{{ topNeed.subtitle }}</div>
                                </div>
                                <i class="modus-icons text-2xs text-foreground-40 flex-shrink-0 mt-0.5" aria-hidden="true">{{ urgentNeedCategoryIcon(topNeed.category) }}</i>
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="flex items-center gap-1.5 border-top-default pt-3 mt-1">
                            <i class="modus-icons text-sm text-primary" aria-hidden="true">draft</i>
                            <div class="text-2xs text-primary truncate cursor-pointer hover:underline" (click)="navigateToProject(project); $event.stopPropagation()">
                              {{ project.latestDrawingName }}
                            </div>
                            <div class="text-2xs text-foreground-40 flex-shrink-0">{{ project.latestDrawingVersion }}</div>
                          </div>
                        }
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
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly HEADER_HEIGHT = 60;
  private static readonly HEADER_OFFSET = ProjectsPageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['projsHeader', 'projects'],
    layoutStorageKey: 'dashboard-projects:v4',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v5',
    defaultColStarts: { projsHeader: 1, projects: 1 },
    defaultColSpans: { projsHeader: 16, projects: 16 },
    defaultTops: { projsHeader: 0, projects: 0 },
    defaultHeights: { projsHeader: 0, projects: 768 },
    defaultLefts: { projsHeader: 0, projects: 0 },
    defaultPixelWidths: { projsHeader: 1280, projects: 1280 },
    canvasDefaultLefts: { projsHeader: 0, projects: 0 },
    canvasDefaultPixelWidths: { projsHeader: 1280, projects: 1280 },
    canvasDefaultTops: {
      projsHeader: 0,
      projects: ProjectsPageComponent.HEADER_OFFSET,
    },
    canvasDefaultHeights: { projsHeader: ProjectsPageComponent.HEADER_HEIGHT, projects: 768 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _lockHeader = (() => {
    this.engine.widgetLocked.update(l => ({ ...l, projsHeader: true }));
  })();

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.engine.widgetLocked.update(l => ({ ...l, projsHeader: true }));
      });
    }
  });

  private readonly _saveDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.saveDefaultsTick();
    if (tick > 0) {
      untracked(() => this.engine.saveAsDefaultLayout());
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
  readonly widgetLocked = this.engine.widgetLocked;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly projects = signal<Project[]>(PROJECTS);

  readonly totalProjects = computed(() => this.projects().length);
  readonly onTrackCount = computed(() => this.projects().filter((p) => p.status === 'On Track').length);
  readonly atRiskCount = computed(() => this.projects().filter((p) => p.status === 'At Risk').length);
  readonly overdueCount = computed(() => this.projects().filter((p) => p.status === 'Overdue').length);

  private readonly projectsContainerRef = viewChild<ElementRef>('projectsContainer');
  readonly projectsContainerWidth = signal<number>(0);
  readonly projectsGridCols = computed(() => {
    const w = this.projectsContainerWidth();
    if (w > 0 && w <= 400) return 'grid-cols-1';
    if (w > 0 && w <= 640) return 'grid-cols-2';
    if (w > 0 && w <= 960) return 'grid-cols-3';
    return 'grid-cols-4';
  });
  private readonly _projectsResizeEffect = this.trackContainerWidth(this.projectsContainerRef, this.projectsContainerWidth);

  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;

  private readonly allUrgentNeeds = buildUrgentNeeds();
  private readonly allJobCosts = getProjectJobCosts();

  readonly projectAgentData = computed(() => {
    const map = new Map<number, { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null }>();
    for (const p of this.projects()) {
      const needs = this.allUrgentNeeds.filter(n => n.projectId === p.id);
      const critical = needs.filter(n => n.severity === 'critical');
      const warning = needs.filter(n => n.severity === 'warning');
      const topNeed = critical[0] ?? warning[0] ?? needs[0] ?? null;
      const budgetAlert = needs.some(n => n.category === 'budget' || n.category === 'change-order');
      const jc = this.allJobCosts.find(j => j.projectId === p.id);
      const jobCostSpend = jc ? jc.budgetUsed : null;
      map.set(p.id, { urgentNeeds: needs, criticalCount: critical.length, warningCount: warning.length, topNeed, budgetAlert, jobCostSpend });
    }
    return map;
  });

  getProjectAgent(projectId: number) {
    return this.projectAgentData().get(projectId) ?? { urgentNeeds: [], criticalCount: 0, warningCount: 0, topNeed: null, budgetAlert: false, jobCostSpend: null };
  }

  navigateToJobCosts(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/financials/job-costs', project.slug]);
  }

  private trackContainerWidth(
    ref: ReturnType<typeof viewChild<ElementRef>>,
    widthSignal: ReturnType<typeof signal<number>>,
  ) {
    let observer: ResizeObserver | null = null;
    return effect(() => {
      const el = ref()?.nativeElement as HTMLElement | undefined;
      observer?.disconnect();
      observer = null;
      if (!el) {
        widthSignal.set(0);
        return;
      }
      widthSignal.set(el.offsetWidth);
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? el.offsetWidth;
        widthSignal.set(w);
      });
      ro.observe(el);
      observer = ro;
    });
  }

  navigateToProject(project: Project): void {
    this.router.navigate(['/project', project.slug]);
  }

  readonly statusBadgeColor = statusBadgeColor;
  readonly progressClass = progressClass;
  readonly budgetProgressClass = budgetProgressClass;
  readonly budgetPctColor = budgetPctColor;

  private buildProjectsAgentState(): AgentDataState {
    return { projects: PROJECTS, currentPage: 'projects' };
  }
  getProjectsWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'projects');
    return agent.insight?.(this.buildProjectsAgentState()) ?? null;
  }
  readonly projectsInsight = computed<string | null>(() => this.getProjectsWidgetInsight('projects'));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly projectWidgets: DashboardWidgetId[] = [
    'projects',
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

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResize(target, dir, event, edge);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResizeTouch(target, dir, event, edge);
  }

  toggleWidgetLock(id: string): void {
    this.engine.toggleWidgetLock(id);
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
