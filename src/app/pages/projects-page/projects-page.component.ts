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
import { DataStoreService } from '../../data/data-store.service';
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
  BudgetHistoryPoint,
  ProjectJobCost,
} from '../../data/dashboard-data';
import {
  PROJECTS,
  BUDGET_HISTORY_BY_PROJECT,
  statusBadgeColor,
  progressClass,
  budgetProgressClass,
  budgetPctColor,
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  getProjectJobCosts,
  getProjectWeather,
  weatherIcon,
  weatherIconColor,
} from '../../data/dashboard-data';
import { getAgent, type AgentDataState } from '../../data/widget-agents';

type TileTier = 'compact' | 'standard' | 'expanded';

const TILE_IDS: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8'];
const TILE_PROJECT_MAP: Record<string, number> = {
  proj1: 0, proj2: 1, proj3: 2, proj4: 3,
  proj5: 4, proj6: 5, proj7: 6, proj8: 7,
};

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
      <div #pageHeader class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Projects Dashboard</div>
          <div class="flex items-center gap-3 mt-1.5">
            <div class="text-sm text-foreground-60">{{ today }}</div>
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
            @if (projectsInsight()) {
              <div class="flex items-center gap-1.5">
                <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                <div class="text-xs text-foreground-60 truncate leading-none">{{ projectsInsight() }}</div>
              </div>
            }
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0 mt-1">
          <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
        </div>
      </div>
      }

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
              <div class="flex items-center gap-3 mt-1.5">
                <div class="text-sm text-foreground-60">{{ today }}</div>
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
                @if (projectsInsight()) {
                  <div class="flex items-center gap-1.5">
                    <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                    <div class="text-xs text-foreground-60 truncate leading-none">{{ projectsInsight() }}</div>
                  </div>
                }
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 mt-1">
              <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
            </div>
          </div>
        </div>
        }

        @for (widgetId of projectWidgets; track widgetId) {
          @if (projectForWidget(widgetId); as project) {

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

            <div
              class="relative bg-card rounded-lg overflow-hidden flex flex-col h-full"
              [class.border-default]="selectedWidgetId() !== widgetId"
              [class.border-primary]="selectedWidgetId() === widgetId"
            >
              <div
                class="flex items-center justify-between px-3 py-2 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
              >
                <div class="flex items-center gap-1.5 min-w-0">
                  <i class="modus-icons text-sm text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle>drag_indicator</i>
                  <div class="text-xs font-semibold text-foreground truncate">{{ project.name }}</div>
                </div>
                <modus-badge [color]="statusBadgeColor(project.status)" variant="filled" size="sm">
                  {{ project.status }}
                </modus-badge>
              </div>

              <div
                class="flex-1 min-h-0 overflow-y-auto cursor-pointer hover:bg-muted transition-colors duration-150"
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
                <div class="p-4 flex flex-col gap-3">
                  <div class="text-xs text-foreground-60">{{ project.client }}</div>

                  <!-- COMPACT: schedule + budget text only -->
                  @if (widgetTier()[widgetId] === 'compact') {
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1 text-xs text-foreground-60">
                        <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                        <div>{{ project.dueDate }}</div>
                      </div>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Schedule</div>
                      <div class="text-2xs font-medium" [class]="progressTextColor(project.status)">{{ project.progress }}%</div>
                    </div>
                    <div class="flex items-center justify-between">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Budget</div>
                      <div class="text-2xs font-medium" [class]="budgetPctColor(project.budgetPct)">{{ project.budgetPct }}%</div>
                    </div>
                    <div class="text-2xs text-foreground-40">{{ project.budgetUsed }} / {{ project.budgetTotal }}</div>
                  }

                  <!-- STANDARD + EXPANDED: full content -->
                  @if (widgetTier()[widgetId] !== 'compact') {
                    @if (getWeather(project.id); as pw) {
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <i class="modus-icons text-sm" [class]="weatherIconColor(pw.current.condition)" aria-hidden="true">{{ weatherIcon(pw.current.condition) }}</i>
                          <div class="text-xs font-medium text-foreground">{{ pw.current.tempF }}&deg;F</div>
                          <div class="text-2xs text-foreground-40">{{ project.city }}, {{ project.state }}</div>
                        </div>
                        @if (pw.forecast[0]?.workImpact === 'major') {
                          <div class="text-2xs font-medium px-1.5 py-0.5 rounded bg-destructive-20 text-destructive">Stop Work</div>
                        } @else if (pw.forecast[0]?.workImpact === 'minor') {
                          <div class="text-2xs font-medium px-1.5 py-0.5 rounded bg-warning-20 text-warning">Caution</div>
                        }
                      </div>
                    }
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
                            <i class="modus-icons text-2xs" aria-hidden="true">building_corporate</i>
                            Job Costs
                          </div>
                        }
                      </div>
                    </div>

                    <!-- EXPANDED: budget sparkline -->
                    @if (widgetTier()[widgetId] === 'expanded') {
                      @if (getBudgetHistory(project.id); as history) {
                        <div class="border-top-default pt-3 mt-1 flex flex-col gap-1">
                          <div class="flex items-center justify-between">
                            <div class="text-2xs text-foreground-40 uppercase tracking-wide">Budget Trend</div>
                            <div class="flex items-center gap-3">
                              <div class="flex items-center gap-1">
                                <div class="w-2 h-0.5 bg-foreground-40"></div>
                                <div class="text-2xs text-foreground-40">Planned</div>
                              </div>
                              <div class="flex items-center gap-1">
                                <div class="w-2 h-0.5 bg-primary"></div>
                                <div class="text-2xs text-foreground-40">Actual</div>
                              </div>
                            </div>
                          </div>
                          <svg class="w-full" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true">
                            <path [attr.d]="sparklinePath(history, 'planned')" fill="none" stroke="var(--foreground)" stroke-opacity="0.3" stroke-width="1.5" />
                            <path [attr.d]="sparklinePath(history, 'actual')" fill="none" stroke="var(--primary)" stroke-width="1.5" />
                          </svg>
                          @if (getProjectFadeGain(project.id); as fg) {
                            <div class="flex items-center justify-end gap-1.5">
                              <div class="text-2xs font-medium"
                                [class.text-success]="fg.isGain"
                                [class.text-destructive]="!fg.isGain"
                              >
                                <i class="modus-icons text-2xs" aria-hidden="true">{{ fg.isGain ? 'trending_up' : 'trending_down' }}</i>
                                {{ fg.value }} {{ fg.label }}
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <!-- EXPANDED: job cost breakdown mini-bars -->
                      @if (getJobCostData(project.id); as jc) {
                        <div class="flex flex-col gap-1">
                          <div class="text-2xs text-foreground-40 uppercase tracking-wide">Cost Breakdown</div>
                          <div class="flex h-2.5 w-full rounded-full overflow-hidden bg-muted">
                            @for (cat of jobCostCategories(jc); track cat.label) {
                              <div [class]="cat.colorClass" [style.width.%]="cat.pct" class="h-full"></div>
                            }
                          </div>
                          <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                            @for (cat of jobCostCategories(jc); track cat.label) {
                              <div class="flex items-center gap-1">
                                <div class="w-1.5 h-1.5 rounded-full" [class]="cat.colorClass"></div>
                                <div class="text-2xs text-foreground-40">{{ cat.label }} {{ cat.pct }}%</div>
                              </div>
                            }
                          </div>
                        </div>
                      }

                      <!-- EXPANDED: agentic insight -->
                      @if (getProjectInsight(project.id); as insight) {
                        <div class="flex items-center gap-1.5 border-top-default pt-2 mt-1">
                          <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                          <div class="text-2xs text-foreground-60 truncate leading-none">{{ insight }}</div>
                        </div>
                      }
                    }

                    <!-- STANDARD: single urgent need / drawing link -->
                    @if (widgetTier()[widgetId] !== 'expanded') {
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
                          <i class="modus-icons text-sm text-primary" aria-hidden="true">file_new</i>
                          <div class="text-2xs text-primary truncate cursor-pointer hover:underline" (click)="navigateToProject(project); $event.stopPropagation()">
                            {{ project.latestDrawingName }}
                          </div>
                          <div class="text-2xs text-foreground-40 flex-shrink-0">{{ project.latestDrawingVersion }}</div>
                        </div>
                      }
                    }

                    <!-- EXPANDED: top 3 urgent needs (replaces the single-need block above) -->
                    @if (widgetTier()[widgetId] === 'expanded') {
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
                          @for (need of getTopNeeds(project.id); track need.title) {
                            <div class="flex items-start gap-2">
                              <div class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                [class.bg-destructive]="need.severity === 'critical'"
                                [class.bg-warning]="need.severity === 'warning'"
                                [class.bg-primary]="need.severity === 'info'"></div>
                              <div class="flex-1 min-w-0">
                                <div class="text-2xs font-medium text-foreground truncate">{{ need.title }}</div>
                                <div class="text-2xs text-foreground-40 truncate">{{ need.subtitle }}</div>
                              </div>
                              <i class="modus-icons text-2xs text-foreground-40 flex-shrink-0 mt-0.5" aria-hidden="true">{{ urgentNeedCategoryIcon(need.category) }}</i>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="flex items-center gap-1.5 border-top-default pt-3 mt-1">
                          <i class="modus-icons text-sm text-primary" aria-hidden="true">file_new</i>
                          <div class="text-2xs text-primary truncate cursor-pointer hover:underline" (click)="navigateToProject(project); $event.stopPropagation()">
                            {{ project.latestDrawingName }}
                          </div>
                          <div class="text-2xs text-foreground-40 flex-shrink-0">{{ project.latestDrawingVersion }}</div>
                        </div>
                      }
                    }
                  }
                </div>
              </div>
              <widget-resize-handle
                [isMobile]="isMobile()"
                (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
              />
            </div>

          </div>
        </div>

          }
        }

      </div>

    </div>
  `,
})
export class ProjectsPageComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  private static readonly HEADER_HEIGHT = 80;
  private static readonly HEADER_OFFSET = ProjectsPageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly TILE_HEIGHT = 416;
  private static readonly ROW_2_TOP = ProjectsPageComponent.TILE_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['projsHeader', ...TILE_IDS],
    layoutStorageKey: 'dashboard-projects:v6',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v8',
    defaultColStarts: {
      projsHeader: 1,
      proj1: 1, proj2: 5, proj3: 9, proj4: 13,
      proj5: 1, proj6: 5, proj7: 9, proj8: 13,
    },
    defaultColSpans: {
      projsHeader: 16,
      proj1: 4, proj2: 4, proj3: 4, proj4: 4,
      proj5: 4, proj6: 4, proj7: 4, proj8: 4,
    },
    defaultTops: {
      projsHeader: 0,
      proj1: 0, proj2: 0, proj3: 0, proj4: 0,
      proj5: ProjectsPageComponent.ROW_2_TOP, proj6: ProjectsPageComponent.ROW_2_TOP, proj7: ProjectsPageComponent.ROW_2_TOP, proj8: ProjectsPageComponent.ROW_2_TOP,
    },
    defaultHeights: {
      projsHeader: 0,
      proj1: ProjectsPageComponent.TILE_HEIGHT, proj2: ProjectsPageComponent.TILE_HEIGHT, proj3: ProjectsPageComponent.TILE_HEIGHT, proj4: ProjectsPageComponent.TILE_HEIGHT,
      proj5: ProjectsPageComponent.TILE_HEIGHT, proj6: ProjectsPageComponent.TILE_HEIGHT, proj7: ProjectsPageComponent.TILE_HEIGHT, proj8: ProjectsPageComponent.TILE_HEIGHT,
    },
    defaultLefts: {
      projsHeader: 0,
      proj1: 0, proj2: 324, proj3: 648, proj4: 972,
      proj5: 0, proj6: 324, proj7: 648, proj8: 972,
    },
    defaultPixelWidths: {
      projsHeader: 1280,
      proj1: 308, proj2: 308, proj3: 308, proj4: 308,
      proj5: 308, proj6: 308, proj7: 308, proj8: 308,
    },
    canvasDefaultLefts: {
      projsHeader: 0,
      proj1: 0, proj2: 324, proj3: 648, proj4: 972,
      proj5: 0, proj6: 324, proj7: 648, proj8: 972,
    },
    canvasDefaultPixelWidths: {
      projsHeader: 1280,
      proj1: 308, proj2: 308, proj3: 308, proj4: 308,
      proj5: 308, proj6: 308, proj7: 308, proj8: 308,
    },
    canvasDefaultTops: {
      projsHeader: 0,
      proj1: ProjectsPageComponent.HEADER_OFFSET, proj2: ProjectsPageComponent.HEADER_OFFSET, proj3: ProjectsPageComponent.HEADER_OFFSET, proj4: ProjectsPageComponent.HEADER_OFFSET,
      proj5: ProjectsPageComponent.HEADER_OFFSET + ProjectsPageComponent.ROW_2_TOP, proj6: ProjectsPageComponent.HEADER_OFFSET + ProjectsPageComponent.ROW_2_TOP, proj7: ProjectsPageComponent.HEADER_OFFSET + ProjectsPageComponent.ROW_2_TOP, proj8: ProjectsPageComponent.HEADER_OFFSET + ProjectsPageComponent.ROW_2_TOP,
    },
    canvasDefaultHeights: {
      projsHeader: ProjectsPageComponent.HEADER_HEIGHT,
      proj1: ProjectsPageComponent.TILE_HEIGHT, proj2: ProjectsPageComponent.TILE_HEIGHT, proj3: ProjectsPageComponent.TILE_HEIGHT, proj4: ProjectsPageComponent.TILE_HEIGHT,
      proj5: ProjectsPageComponent.TILE_HEIGHT, proj6: ProjectsPageComponent.TILE_HEIGHT, proj7: ProjectsPageComponent.TILE_HEIGHT, proj8: ProjectsPageComponent.TILE_HEIGHT,
    },
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

  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;
  readonly weatherIcon = weatherIcon;
  readonly weatherIconColor = weatherIconColor;

  getWeather(projectId: number) {
    return getProjectWeather(projectId);
  }

  private readonly allUrgentNeeds = computed(() => buildUrgentNeeds(this.store.rfis(), this.store.submittals(), this.store.changeOrders()));

  readonly projectAgentData = computed(() => {
    const map = new Map<number, { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null }>();
    for (const p of this.projects()) {
      const needs = this.allUrgentNeeds().filter(n => n.projectId === p.id);
      const critical = needs.filter(n => n.severity === 'critical');
      const warning = needs.filter(n => n.severity === 'warning');
      const topNeed = critical[0] ?? warning[0] ?? needs[0] ?? null;
      const budgetAlert = needs.some(n => n.category === 'budget' || n.category === 'change-order');
      const jc = this._allJobCostData.find(j => j.projectId === p.id);
      const jobCostSpend = jc ? jc.budgetUsed : null;
      map.set(p.id, { urgentNeeds: needs, criticalCount: critical.length, warningCount: warning.length, topNeed, budgetAlert, jobCostSpend });
    }
    return map;
  });

  getProjectAgent(projectId: number) {
    return this.projectAgentData().get(projectId) ?? { urgentNeeds: [], criticalCount: 0, warningCount: 0, topNeed: null, budgetAlert: false, jobCostSpend: null };
  }

  projectForWidget(widgetId: string): Project | undefined {
    const idx = TILE_PROJECT_MAP[widgetId];
    return idx !== undefined ? this.projects()[idx] : undefined;
  }

  navigateToJobCosts(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/financials/job-costs', project.slug]);
  }

  navigateToProject(project: Project): void {
    this.router.navigate(['/project', project.slug]);
  }

  readonly statusBadgeColor = statusBadgeColor;
  readonly progressClass = progressClass;
  readonly budgetProgressClass = budgetProgressClass;
  readonly budgetPctColor = budgetPctColor;

  readonly widgetTier = computed<Record<string, TileTier>>(() => {
    const widths = this.widgetPixelWidths();
    const heights = this.widgetHeights();
    const tiers: Record<string, TileTier> = {};
    for (const id of this.projectWidgets) {
      const w = widths[id] ?? 308;
      const h = heights[id] ?? 416;
      if (w >= 500 && h >= 450) tiers[id] = 'expanded';
      else if (w >= 350 && h >= 300) tiers[id] = 'standard';
      else tiers[id] = 'compact';
    }
    return tiers;
  });

  progressTextColor(status: string): string {
    if (status === 'On Track') return 'text-success font-medium';
    if (status === 'At Risk') return 'text-warning font-medium';
    if (status === 'Overdue') return 'text-destructive font-medium';
    return 'text-foreground-60 font-medium';
  }

  getBudgetHistory(projectId: number): BudgetHistoryPoint[] | null {
    const pts = BUDGET_HISTORY_BY_PROJECT[projectId];
    return pts?.length ? pts : null;
  }

  sparklinePath(points: BudgetHistoryPoint[], field: 'planned' | 'actual'): string {
    if (!points.length) return '';
    const vals = points.map(p => p[field]);
    const max = Math.max(...vals, 1);
    const w = 200;
    const h = 50;
    const step = w / Math.max(vals.length - 1, 1);
    return vals.map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private readonly _allJobCostData = getProjectJobCosts();

  getJobCostData(projectId: number): ProjectJobCost | null {
    return this._allJobCostData.find(j => j.projectId === projectId) ?? null;
  }

  getProjectFadeGain(projectId: number): { label: string; value: string; isGain: boolean } | null {
    const pts = BUDGET_HISTORY_BY_PROJECT[projectId];
    if (!pts?.length) return null;
    const latest = pts[pts.length - 1];
    const diff = latest.planned - latest.actual;
    const abs = Math.abs(diff);
    const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}K` : `$${abs.toLocaleString()}`;
    if (Math.abs(diff) < 500) return null;
    return { label: diff > 0 ? 'Gain' : 'Fade', value: formatted, isGain: diff > 0 };
  }

  private static readonly JOB_COST_COLORS: Record<string, string> = {
    Labor: 'bg-primary',
    Materials: 'bg-success',
    Equipment: 'bg-warning',
    Subcontractors: 'bg-secondary',
    Overhead: 'bg-foreground-40',
  };

  jobCostCategories(jc: ProjectJobCost): { label: string; pct: number; colorClass: string }[] {
    const total = Object.values(jc.costs).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(jc.costs).map(([label, val]) => ({
      label,
      pct: Math.round((val / total) * 100),
      colorClass: ProjectsPageComponent.JOB_COST_COLORS[label] ?? 'bg-muted',
    }));
  }

  getTopNeeds(projectId: number): UrgentNeedItem[] {
    const data = this.getProjectAgent(projectId);
    return data.urgentNeeds.slice(0, 3);
  }

  getProjectInsight(projectId: number): string | null {
    const project = this.projects().find(p => p.id === projectId);
    if (!project) return null;
    const state: AgentDataState = {
      projects: [project],
      currentPage: 'projects',
      projectName: project.name,
      budgetPct: project.budgetPct,
      budgetHealthy: project.budgetPct <= 90,
    };
    const agent = getAgent('projectDefault', 'projects');
    return agent.insight?.(state) ?? null;
  }

  private buildProjectsAgentState(): AgentDataState {
    return { projects: PROJECTS, currentPage: 'projects' };
  }
  getProjectsWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'projects');
    return agent.insight?.(this.buildProjectsAgentState()) ?? null;
  }
  readonly projectsInsight = computed<string | null>(() => this.getProjectsWidgetInsight('projects'));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly projectWidgets: DashboardWidgetId[] = [...TILE_IDS];

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
