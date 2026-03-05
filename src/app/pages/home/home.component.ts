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
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { ThemeService } from '../../services/theme.service';

type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
type WidgetId = 'projectStatus' | 'projectCards' | 'openEstimates' | 'recentActivity' | 'needsAttention';

const PROJECTS_WIDGETS: readonly WidgetId[] = ['projectCards', 'openEstimates', 'recentActivity', 'needsAttention'];
type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface WidgetState { top: number; left: number; width: number; height: number; }
type DragState = { widgetId: WidgetId; startX: number; startY: number; startLeft: number; startTop: number } | null;
type ResizeState = { widgetId: WidgetId; handle: ResizeHandle; startX: number; startY: number; startLeft: number; startTop: number; startWidth: number; startHeight: number } | null;

interface Project {
  id: number;
  name: string;
  client: string;
  ownerInitials: string;
  owner: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number;
  budgetPct: number;
  budgetUsed: string;
  budgetTotal: string;
}

interface Estimate {
  id: string;
  project: string;
  client: string;
  type: EstimateType;
  value: string;
  valueRaw: number;
  status: EstimateStatus;
  requestedBy: string;
  requestedByInitials: string;
  dueDate: string;
  daysLeft: number;
}

interface ActivityItem {
  id: number;
  actorInitials: string;
  text: string;
  timeAgo: string;
  icon: string;
  iconColor: string;
}

interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}


@Component({
  selector: 'app-home',
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, ModusButtonComponent, ModusUtilityPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onMouseMove($event)',
    '(document:mouseup)': 'onMouseUp()',
  },
  template: `
    <div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      <!-- Navbar -->
      <modus-navbar
        [userCard]="userCard"
        [visibility]="{ user: true, notifications: true, apps: false, help: true, search: true, searchInput: true, mainMenu: false }"
        [searchInputOpen]="searchInputOpen()"
        (searchClick)="searchInputOpen.set(!searchInputOpen())"
        (searchInputOpenChange)="searchInputOpen.set($event)"
      >
        <div slot="end" class="flex items-center pr-1 gap-0.5">
          <!-- AI Assistant toggle -->
          <div
            class="{{ aiNavButtonClass() }}"
            (click)="toggleAiPanel()"
            [title]="aiPanelOpen() ? 'Close AI Assistant' : 'Open Trimble AI Assistant'"
            role="button"
            [attr.aria-label]="aiPanelOpen() ? 'Close AI Assistant' : 'Open Trimble AI Assistant'"
            [attr.aria-expanded]="aiPanelOpen()"
          >
            <i class="modus-icons text-xl">chat</i>
            @if (aiMessages().length > 0 && !aiPanelOpen()) {
              <div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border-2 border-background"></div>
            }
          </div>
          <!-- Dark mode toggle -->
          <div
            class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
            (click)="toggleDarkMode()"
            [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <i class="modus-icons text-xl">{{ isDark() ? 'brightness' : 'moon' }}</i>
          </div>
        </div>
      </modus-navbar>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">

        <!-- Main content -->
        <div class="flex-1 overflow-auto bg-background">

          <!-- ─── Projects dashboard ─── -->
          <div class="p-6 max-w-screen-xl mx-auto">

            <!-- Page header -->
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="text-3xl font-bold text-foreground">Projects Dashboard</div>
                <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 mt-1">
                <modus-button color="primary" size="sm" icon="add" iconPosition="left">
                  New Project
                </modus-button>
              </div>
            </div>

            <!-- KPI cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Active Projects</div>
                  <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center">
                    <i class="modus-icons text-lg text-primary">briefcase</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-foreground">{{ totalProjects() }}</div>
                <div class="flex items-center gap-1.5">
                  <div class="text-xs text-success font-medium">{{ onTrackCount() }} on track</div>
                  <div class="text-xs text-foreground-40">·</div>
                  <div class="text-xs text-warning font-medium">{{ atRiskCount() }} at risk</div>
                </div>
              </div>

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">On Schedule</div>
                  <div class="w-9 h-9 rounded-lg bg-success-20 flex items-center justify-center">
                    <i class="modus-icons text-lg text-success">check_circle</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-success">{{ onSchedulePct() }}%</div>
                <div class="text-xs text-foreground-60">{{ onTrackCount() }} of {{ totalProjects() }} projects</div>
              </div>

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Open Estimates</div>
                  <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
                    <i class="modus-icons text-lg text-warning">description</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-foreground">{{ openEstimatesCount() }}</div>
                <div class="flex items-center gap-1.5">
                  <div class="text-xs text-warning font-medium">{{ awaitingApprovalCount() }} awaiting approval</div>
                </div>
              </div>

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Estimate Pipeline</div>
                  <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <i class="modus-icons text-lg text-foreground-60">payment_instant</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-foreground">{{ totalEstimateValue() }}</div>
                <div class="text-xs text-foreground-60">Total open estimate value</div>
              </div>

            </div>

            <!-- Widget Canvas: Project Cards + Open Estimates + Recent Activity + Needs Attention (draggable) -->
            <div #widgetCanvas class="relative mb-6" [style.height.px]="canvasHeight()">

              <!-- ─── Project Cards Widget ─── -->
              <div
                #projectCardsEl
                class="{{ widgetWrapperClass('projectCards') }}"
                [style.top.px]="projectCardsWidget().top"
                [style.left.px]="displayLeft('projectCards')"
                [style.width.px]="displayWidth('projectCards')"
              >
                <!-- Widget card -->
                <div class="bg-card border-default rounded-lg overflow-hidden">

                  <!-- Draggable header -->
                  <div class="{{ headerDragClass('projectCards') }}" (mousedown)="startDrag('projectCards', $event)">
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-sm text-foreground-40">drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60">apps</i>
                      <div class="text-lg font-semibold text-foreground">Projects</div>
                      <div class="text-xs text-foreground-40">{{ totalProjects() }} projects</div>
                    </div>
                    <!-- Status summary chips -->
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

                  <!-- Card grid -->
                  <div class="p-4">
                    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      @for (project of projects(); track project.id) {
                        <div class="bg-background border-default rounded-lg overflow-hidden flex flex-col">
                          <!-- Status bar at top -->
                          <div class="h-1 w-full flex-shrink-0"
                            [class.bg-success]="project.status === 'On Track'"
                            [class.bg-warning]="project.status === 'At Risk'"
                            [class.bg-destructive]="project.status === 'Overdue'"
                            [class.bg-muted]="project.status === 'Planning'"
                          ></div>
                          <div class="p-4 flex flex-col gap-3 flex-1">
                            <!-- Name + status badge -->
                            <div class="flex items-start justify-between gap-2">
                              <div class="text-sm font-semibold text-foreground leading-tight">{{ project.name }}</div>
                              <modus-badge [color]="statusBadgeColor(project.status)" variant="filled" size="sm">
                                {{ project.status }}
                              </modus-badge>
                            </div>
                            <!-- Client -->
                            <div class="text-xs text-foreground-60">{{ project.client }}</div>
                            <!-- Owner + due date row -->
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-1.5">
                                <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xs font-semibold flex-shrink-0">
                                  {{ project.ownerInitials }}
                                </div>
                                <div class="text-xs text-foreground-60 truncate max-w-[80px]">{{ project.owner }}</div>
                              </div>
                              <div class="flex items-center gap-1 text-xs text-foreground-60">
                                <i class="modus-icons text-sm">calendar</i>
                                <div>{{ project.dueDate }}</div>
                              </div>
                            </div>
                            <!-- Schedule progress -->
                            <div class="flex flex-col gap-1">
                              <div class="flex items-center justify-between">
                                <div class="text-2xs text-foreground-40 uppercase tracking-wide">Schedule</div>
                                <div class="text-2xs text-foreground-60 font-medium">{{ project.progress }}%</div>
                              </div>
                              <modus-progress [value]="project.progress" [max]="100" [className]="progressClass(project.status)" />
                            </div>
                            <!-- Budget -->
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
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                </div>
              </div>

              <!-- ─── Open Estimates Widget ─── -->
              <div
                class="{{ widgetWrapperClass('openEstimates') }}"
                [style.top.px]="openEstimatesWidget().top"
                [style.left.px]="displayLeft('openEstimates')"
                [style.width.px]="displayWidth('openEstimates')"
                [style.height.px]="openEstimatesWidget().height"
              >
                <!-- Resize handles: edges -->
                <div class="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('openEstimates', 'n', $event)"></div>
                <div class="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('openEstimates', 's', $event)"></div>
                <div class="absolute top-3 bottom-3 right-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('openEstimates', 'e', $event)"></div>
                <div class="absolute top-3 bottom-3 left-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('openEstimates', 'w', $event)"></div>
                <!-- Resize handles: corners -->
                <div class="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-20" (mousedown)="startResize('openEstimates', 'nw', $event)"></div>
                <div class="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('openEstimates', 'ne', $event)"></div>
                <div class="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('openEstimates', 'sw', $event)"></div>
                <!-- SE corner: visible resize indicator -->
                <div class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20" (mousedown)="startResize('openEstimates', 'se', $event)">
                  <div class="pointer-events-none absolute bottom-1 right-1">
                    <div class="absolute bottom-0 right-0 w-2.5 h-0.5 rounded-full bg-foreground-40"></div>
                    <div class="absolute bottom-0 right-0 w-0.5 h-2.5 rounded-full bg-foreground-40"></div>
                  </div>
                </div>

                <!-- Widget card -->
                <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">

                  <!-- Draggable header -->
                  <div class="{{ headerDragClass('openEstimates') }}" (mousedown)="startDrag('openEstimates', $event)">
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-sm text-foreground-40">drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60">description</i>
                      <div class="text-lg font-semibold text-foreground">Open Estimates</div>
                      <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                    </div>
                    <div (mousedown)="$event.stopPropagation()">
                      <modus-button color="primary" variant="outlined" size="sm" icon="add" iconPosition="left">
                        New Estimate
                      </modus-button>
                    </div>
                  </div>

                  <!-- Scrollable table content -->
                  <div class="overflow-y-auto flex-1">
                    <!-- Estimates table header -->
                    <div class="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_1fr] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                      <div>ID</div>
                      <div>Project / Client</div>
                      <div>Type</div>
                      <div>Value</div>
                      <div>Status</div>
                      <div>Requested By</div>
                      <div>Due Date</div>
                    </div>

                    @for (estimate of estimates(); track estimate.id) {
                      <div class="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_1fr] gap-3 px-6 py-4 border-bottom-default items-center last:border-b-0 hover:bg-muted transition-colors duration-150">
                        <div class="text-sm font-mono text-primary font-medium">{{ estimate.id }}</div>
                        <div>
                          <div class="text-sm font-medium text-foreground">{{ estimate.project }}</div>
                          <div class="text-xs text-foreground-60 mt-0.5">{{ estimate.client }}</div>
                        </div>
                        <div>
                          <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ estimate.type }}</div>
                        </div>
                        <div class="text-sm font-semibold text-foreground">{{ estimate.value }}</div>
                        <div>
                          <modus-badge [color]="estimateBadgeColor(estimate.status)" variant="outlined" size="sm">
                            {{ estimate.status }}
                          </modus-badge>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold flex-shrink-0">
                            {{ estimate.requestedByInitials }}
                          </div>
                          <div class="text-xs text-foreground-80 truncate">{{ estimate.requestedBy }}</div>
                        </div>
                        <div>
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

                </div>
              </div>

              <!-- ─── Recent Activity Widget ─── -->
              <div
                class="{{ widgetWrapperClass('recentActivity') }}"
                [style.top.px]="recentActivityWidget().top"
                [style.left.px]="displayLeft('recentActivity')"
                [style.width.px]="displayWidth('recentActivity')"
                [style.height.px]="recentActivityWidget().height"
              >
                <!-- Resize handles: edges -->
                <div class="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('recentActivity', 'n', $event)"></div>
                <div class="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('recentActivity', 's', $event)"></div>
                <div class="absolute top-3 bottom-3 right-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('recentActivity', 'e', $event)"></div>
                <div class="absolute top-3 bottom-3 left-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('recentActivity', 'w', $event)"></div>
                <!-- Resize handles: corners -->
                <div class="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-20" (mousedown)="startResize('recentActivity', 'nw', $event)"></div>
                <div class="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('recentActivity', 'ne', $event)"></div>
                <div class="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('recentActivity', 'sw', $event)"></div>
                <!-- SE corner: visible resize indicator -->
                <div class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20" (mousedown)="startResize('recentActivity', 'se', $event)">
                  <div class="pointer-events-none absolute bottom-1 right-1">
                    <div class="absolute bottom-0 right-0 w-2.5 h-0.5 rounded-full bg-foreground-40"></div>
                    <div class="absolute bottom-0 right-0 w-0.5 h-2.5 rounded-full bg-foreground-40"></div>
                  </div>
                </div>
                <!-- Widget card -->
                <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                  <!-- Draggable header -->
                  <div class="{{ headerDragClass('recentActivity') }}" (mousedown)="startDrag('recentActivity', $event)">
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-sm text-foreground-40">drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60">history</i>
                      <div class="text-lg font-semibold text-foreground">Recent Activity</div>
                    </div>
                  </div>
                  <!-- Scrollable content -->
                  <div class="overflow-y-auto flex-1">
                    @for (activity of activities; track activity.id) {
                      <div class="flex items-start gap-4 px-6 py-4 border-bottom-default last:border-b-0">
                        <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i class="modus-icons text-sm {{ activity.iconColor }}">{{ activity.icon }}</i>
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
                </div>
              </div>

              <!-- ─── Needs Attention Widget ─── -->
              <div
                class="{{ widgetWrapperClass('needsAttention') }}"
                [style.top.px]="needsAttentionWidget().top"
                [style.left.px]="displayLeft('needsAttention')"
                [style.width.px]="displayWidth('needsAttention')"
                [style.height.px]="needsAttentionWidget().height"
              >
                <!-- Resize handles: edges -->
                <div class="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('needsAttention', 'n', $event)"></div>
                <div class="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-10" (mousedown)="startResize('needsAttention', 's', $event)"></div>
                <div class="absolute top-3 bottom-3 right-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('needsAttention', 'e', $event)"></div>
                <div class="absolute top-3 bottom-3 left-0 w-1.5 cursor-ew-resize z-10" (mousedown)="startResize('needsAttention', 'w', $event)"></div>
                <!-- Resize handles: corners -->
                <div class="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-20" (mousedown)="startResize('needsAttention', 'nw', $event)"></div>
                <div class="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('needsAttention', 'ne', $event)"></div>
                <div class="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-20" (mousedown)="startResize('needsAttention', 'sw', $event)"></div>
                <!-- SE corner: visible resize indicator -->
                <div class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20" (mousedown)="startResize('needsAttention', 'se', $event)">
                  <div class="pointer-events-none absolute bottom-1 right-1">
                    <div class="absolute bottom-0 right-0 w-2.5 h-0.5 rounded-full bg-foreground-40"></div>
                    <div class="absolute bottom-0 right-0 w-0.5 h-2.5 rounded-full bg-foreground-40"></div>
                  </div>
                </div>
                <!-- Widget card -->
                <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                  <!-- Draggable header -->
                  <div class="{{ headerDragClass('needsAttention') }}" (mousedown)="startDrag('needsAttention', $event)">
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-sm text-foreground-40">drag_indicator</i>
                      <i class="modus-icons text-lg text-warning">warning</i>
                      <div class="text-lg font-semibold text-foreground">Needs Attention</div>
                    </div>
                  </div>
                  <!-- Scrollable content -->
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
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>


    </div>

    <!-- ─── AI Assistant Panel (sibling to main container, fixed overlay) ─── -->
    <modus-utility-panel
      [expanded]="aiPanelOpen()"
      className="fixed-utility-panel"
      position="right"
      panelWidth="380px"
      ariaLabel="Trimble AI Assistant"
    >
      <!-- Header -->
      <div slot="header" class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <i class="modus-icons text-sm text-primary-foreground">chat</i>
          </div>
          <div>
            <div class="text-base font-semibold text-foreground">Trimble AI</div>
            <div class="text-xs text-foreground-60">Project Assistant</div>
          </div>
        </div>
        <div
          class="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-muted transition-colors duration-150"
          (click)="toggleAiPanel()"
          role="button"
          aria-label="Close AI Assistant"
        >
          <i class="modus-icons text-base text-foreground-60">close</i>
        </div>
      </div>

      <!-- Body -->
      <div slot="body" class="flex flex-col h-full min-h-0">

        <!-- Welcome / empty state -->
        @if (aiMessages().length === 0 && !aiThinking()) {
          <div class="flex flex-col items-center gap-4 px-4 pt-6 pb-2">
            <div class="w-14 h-14 rounded-full bg-primary-20 flex items-center justify-center">
              <i class="modus-icons text-3xl text-primary">chat</i>
            </div>
            <div class="text-center">
              <div class="text-base font-semibold text-foreground">How can I help?</div>
              <div class="text-sm text-foreground-60 mt-1">Ask me about projects, estimates, budgets, or team status.</div>
            </div>
            <!-- Suggestion chips -->
            <div class="flex flex-col gap-2 w-full mt-2">
              @for (suggestion of aiSuggestions; track suggestion) {
                <div
                  class="px-4 py-2.5 rounded-lg border-default bg-card text-sm text-foreground cursor-pointer hover:bg-muted transition-colors duration-150 text-left"
                  (click)="selectAiSuggestion(suggestion)"
                  role="button"
                  [attr.aria-label]="'Ask: ' + suggestion"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-sm text-primary flex-shrink-0">chevron_right</i>
                    <div>{{ suggestion }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Message list -->
        @if (aiMessages().length > 0) {
          <div class="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1">
            @for (msg of aiMessages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed">
                    {{ msg.text }}
                  </div>
                </div>
              } @else {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="modus-icons text-xs text-primary">chat</i>
                  </div>
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-card border-default text-sm text-foreground leading-relaxed">
                    {{ msg.text }}
                  </div>
                </div>
              }
            }

            <!-- Thinking indicator -->
            @if (aiThinking()) {
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="modus-icons text-xs text-primary">chat</i>
                </div>
                <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border-default">
                  <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

      </div>

      <!-- Footer -->
      <div slot="footer" class="w-full">
        <div class="flex items-end gap-2 p-2">
          <textarea
            class="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm rounded-lg border-default bg-background text-foreground resize-none outline-none focus:border-primary transition-colors duration-150 placeholder:text-foreground-40"
            placeholder="Ask about your projects..."
            rows="1"
            [value]="aiInputText()"
            (input)="aiInputText.set($any($event.target).value)"
            (keydown)="handleAiKeydown($event)"
            aria-label="Message input"
          ></textarea>
          <div
            class="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
            [class.bg-primary]="aiInputText().trim().length > 0 && !aiThinking()"
            [class.bg-muted]="!aiInputText().trim().length || aiThinking()"
            (click)="sendAiMessage()"
            role="button"
            aria-label="Send message"
          >
            <i
              class="modus-icons text-base"
              [class.text-primary-foreground]="aiInputText().trim().length > 0 && !aiThinking()"
              [class.text-foreground-40]="!aiInputText().trim().length || aiThinking()"
            >send</i>
          </div>
        </div>
        <div class="text-center pb-2">
          <div class="text-xs text-foreground-40">Trimble AI may make mistakes. Verify important info.</div>
        </div>
      </div>

    </modus-utility-panel>
  `,
})
export class HomeComponent implements AfterViewInit {
  private readonly themeService = inject(ThemeService);

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

  readonly searchInputOpen = signal(false);
  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  // ── AI Assistant ──
  readonly aiPanelOpen = signal(false);
  readonly aiMessages = signal<AiMessage[]>([]);
  readonly aiInputText = signal('');
  readonly aiThinking = signal(false);
  private aiMessageCounter = 0;

  readonly aiSuggestions: string[] = [
    'Summarize project status',
    'Which projects are at risk?',
    'Show overdue estimates',
    'What needs attention today?',
  ];

  toggleAiPanel(): void {
    this.aiPanelOpen.update(v => !v);
  }

  selectAiSuggestion(suggestion: string): void {
    this.aiInputText.set(suggestion);
    this.sendAiMessage();
  }

  handleAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiMessage();
    }
  }

  sendAiMessage(): void {
    const text = this.aiInputText().trim();
    if (!text || this.aiThinking()) return;

    this.aiMessages.update(msgs => [
      ...msgs,
      { id: ++this.aiMessageCounter, role: 'user', text },
    ]);
    this.aiInputText.set('');
    this.aiThinking.set(true);

    setTimeout(() => {
      const response = this.generateAiResponse(text);
      this.aiMessages.update(msgs => [
        ...msgs,
        { id: ++this.aiMessageCounter, role: 'assistant', text: response },
      ]);
      this.aiThinking.set(false);
    }, 900);
  }

  private generateAiResponse(input: string): string {
    const q = input.toLowerCase();
    const projects = this.projects();
    const estimates = this.estimates();
    if (q.includes('at risk') || q.includes('risk')) {
      const atRisk = projects.filter((p: Project) => p.status === 'At Risk').map((p: Project) => p.name);
      return atRisk.length
        ? `${atRisk.length} project(s) are currently at risk: ${atRisk.join(', ')}. I recommend reviewing their timelines and resource allocations.`
        : 'Great news — no projects are currently marked as at risk.';
    }
    if (q.includes('overdue')) {
      const overdue = projects.filter((p: Project) => p.status === 'Overdue').map((p: Project) => p.name);
      const overdueEst = estimates.filter((e: Estimate) => e.daysLeft < 0).map((e: Estimate) => e.id);
      const parts: string[] = [];
      if (overdue.length) parts.push(`${overdue.length} overdue project(s): ${overdue.join(', ')}`);
      if (overdueEst.length) parts.push(`${overdueEst.length} overdue estimate(s): ${overdueEst.join(', ')}`);
      return parts.length ? parts.join('. ') + '.' : 'Nothing is overdue right now.';
    }
    if (q.includes('project') && (q.includes('status') || q.includes('summar'))) {
      const counts: Record<string, number> = {};
      projects.forEach((p: Project) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
      return 'Project summary: ' + Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ') + `. Total: ${projects.length} projects.`;
    }
    if (q.includes('estimate')) {
      const pending = estimates.filter((e: Estimate) => e.status !== 'Approved').length;
      const total = estimates.reduce((sum: number, e: Estimate) => sum + e.valueRaw, 0);
      return `There are ${estimates.length} open estimates with a combined value of $${(total / 1000).toFixed(0)}K. ${pending} estimate(s) are pending approval.`;
    }
    if (q.includes('budget')) {
      const over = projects.filter((p: Project) => p.budgetPct >= 90).map((p: Project) => p.name);
      return over.length
        ? `${over.length} project(s) are near or over budget: ${over.join(', ')}. Consider reviewing scope or requesting budget adjustments.`
        : 'All projects are within healthy budget ranges.';
    }
    if (q.includes('attention') || q.includes('today')) {
      return `You have ${this.attentionItems.length} items that need attention, including overdue approvals and pending estimates. Check the "Needs Attention" widget for details.`;
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return 'Hello! I\'m your Trimble AI Assistant. I can help you understand your project status, estimates, budgets, and more. What would you like to know?';
    }
    return `I can help with project status, estimates, budgets, and team insights. Try asking "Which projects are at risk?" or "Summarize project status".`;
  }

  aiNavButtonClass(): string {
    const base = 'relative flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer transition-colors duration-150';
    return this.aiPanelOpen()
      ? `${base} bg-primary text-primary-foreground`
      : `${base} text-foreground hover:bg-muted`;
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  // ── Date ──
  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Widget state (draggable & resizable) ──
  readonly canvasRef = viewChild<ElementRef>('widgetCanvas');
  readonly projectCardsRef = viewChild<ElementRef>('projectCardsEl');
  private readonly canvasWidth = signal(0);
  private readonly CANVAS_PAD = 16;
  private readonly GUTTER = 16;
  private readonly GRID_COLS = 16;

  // ── Projects canvas widgets ──
  readonly projectStatusWidget  = signal<WidgetState>({ top: 16,  left: 16, width: 900, height: 390 });
  readonly projectCardsWidget   = signal<WidgetState>({ top: 16,  left: 16, width: 900, height: 340 });
  readonly openEstimatesWidget  = signal<WidgetState>({ top: 16,  left: 16, width: 900, height: 450 });
  readonly recentActivityWidget = signal<WidgetState>({ top: 482, left: 16, width: 600, height: 300 });
  readonly needsAttentionWidget = signal<WidgetState>({ top: 482, left: 632, width: 284, height: 300 });

  private readonly dragState = signal<DragState>(null);
  private readonly resizeState = signal<ResizeState>(null);

  readonly canvasHeight = computed(() => {
    const all = [
      this.projectCardsWidget(),
      this.openEstimatesWidget(),
      this.recentActivityWidget(),
      this.needsAttentionWidget(),
    ];
    return Math.max(...all.map(w => w.top + w.height)) + this.CANVAS_PAD;
  });

  ngAfterViewInit(): void {
    const canvas = this.canvasRef()?.nativeElement as HTMLElement | undefined;
    if (!canvas) return;

    const w = canvas.offsetWidth;
    this.canvasWidth.set(w);
    const pad = this.CANVAS_PAD;
    const innerW = w - pad * 2;
    const colW   = innerW / this.GRID_COLS;

    // Set widths for all widgets
    this.projectCardsWidget.update(s => ({ ...s, width: innerW }));
    this.openEstimatesWidget.update(s => ({ ...s, width: innerW }));
    const raWidth = Math.round(10 * colW);
    const naLeft  = pad + raWidth + this.GUTTER;
    const naWidth = w - naLeft - pad;
    this.recentActivityWidget.update(s => ({ ...s, width: raWidth }));
    this.needsAttentionWidget.update(s => ({ ...s, left: naLeft, width: naWidth }));

    // Measure projectCards immediately, then compact. ResizeObserver keeps it
    // in sync whenever the grid reflows (window resize, etc.).
    const pcEl = this.projectCardsRef()?.nativeElement as HTMLElement | undefined;
    if (pcEl) {
      const h0 = pcEl.offsetHeight;
      if (h0 > 0) this.projectCardsWidget.update(s => ({ ...s, height: h0 }));
      this.compactWidgets();

      const ro = new ResizeObserver(entries => {
        const h = Math.round(entries[0].contentRect.height);
        this.projectCardsWidget.update(s => ({ ...s, height: h }));
        this.compactWidgets();
      });
      ro.observe(pcEl);
    } else {
      this.compactWidgets();
    }
  }

  /**
   * Gravity pass: sort canvas widgets by their current top, then float each
   * one up to the highest available Y where it does not overlap any already-
   * placed widget (checked via X-range intersection).
   *
   * Pass `lockedId` to keep one widget pinned at its current position (used
   * while actively dragging/resizing so only the other widgets react).
   */
  private compactWidgetSet(ids: readonly WidgetId[], lockedId?: WidgetId): void {
    const pad = this.CANVAS_PAD;
    const gap = this.GUTTER;
    type Rect = { id: WidgetId; left: number; top: number; width: number; height: number };

    const rects: Rect[] = ids
      .map(id => ({ id, ...this.getWidgetSignal(id)() }))
      .sort((a, b) => a.top - b.top || a.left - b.left);

    const placed: Rect[] = [];
    for (const rect of rects) {
      if (rect.id === lockedId) {
        placed.push(rect);
        continue;
      }
      let bestTop = pad;
      for (const other of placed) {
        const xOverlap = rect.left < other.left + other.width &&
                         rect.left + rect.width > other.left;
        if (xOverlap) bestTop = Math.max(bestTop, other.top + other.height + gap);
      }
      rect.top = bestTop;
      placed.push(rect);
      this.getWidgetSignal(rect.id).update(s => ({ ...s, top: rect.top }));
    }
  }

  private compactWidgets(lockedId?: WidgetId): void {
    this.compactWidgetSet(PROJECTS_WIDGETS, lockedId);
  }

  private getWidgetSignal(id: WidgetId) {
    switch (id) {
      case 'projectStatus':  return this.projectStatusWidget;
      case 'projectCards':   return this.projectCardsWidget;
      case 'openEstimates':  return this.openEstimatesWidget;
      case 'recentActivity': return this.recentActivityWidget;
      case 'needsAttention': return this.needsAttentionWidget;
    }
  }

  /** Snaps a canvas x-coordinate to the nearest column boundary of the 16-column grid. */

  private snapColX(x: number): number {
    const cw = this.canvasWidth();
    if (cw <= 0) return x;
    const innerW = cw - this.CANVAS_PAD * 2;
    const colW = innerW / this.GRID_COLS;
    const rel = x - this.CANVAS_PAD;
    const snapped = Math.round(rel / colW) * colW;
    return this.CANVAS_PAD + Math.max(0, Math.min(innerW, snapped));
  }

  private getOtherWidgets(id: WidgetId): WidgetState[] {
    return (PROJECTS_WIDGETS as WidgetId[])
      .filter(wid => wid !== id)
      .map(wid => this.getWidgetSignal(wid)());
  }

  private resolveDragOverlap(
    left: number, top: number,
    width: number, height: number,
    other: WidgetState
  ): { left: number; top: number } {
    const gap = this.GUTTER;
    const oL = other.left - gap;
    const oR = other.left + other.width + gap;
    const oT = other.top - gap;
    const oB = other.top + other.height + gap;
    const pR = left + width;
    const pB = top + height;

    if (pR <= oL || left >= oR || pB <= oT || top >= oB) return { left, top };

    const dRight  = pR  - oL;
    const dLeft   = oR  - left;
    const dBottom = pB  - oT;
    const dTop    = oB  - top;
    const minD = Math.min(dRight, dLeft, dBottom, dTop);

    if (minD === dRight)  return { left: oL - width, top };
    if (minD === dLeft)   return { left: oR,          top };
    if (minD === dBottom) return { left, top: oT - height };
                          return { left, top: oB };
  }

  private resolveResizeOverlap(proposed: WidgetState, other: WidgetState): WidgetState {
    const gap = this.GUTTER;
    const oL = other.left - gap;
    const oR = other.left + other.width + gap;
    const oT = other.top - gap;
    const oB = other.top + other.height + gap;
    const pL = proposed.left;
    const pR = pL + proposed.width;
    const pT = proposed.top;
    const pB = pT + proposed.height;

    if (pR <= oL || pL >= oR || pB <= oT || pT >= oB) return proposed;

    const dRight  = pR - oL;
    const dLeft   = oR - pL;
    const dBottom = pB - oT;
    const dTop    = oB - pT;
    const minD = Math.min(dRight, dLeft, dBottom, dTop);

    if (minD === dRight)  return { ...proposed, width:  Math.max(1, oL - pL) };
    if (minD === dLeft)   return { ...proposed, left: oR, width:  Math.max(1, pR - oR) };
    if (minD === dBottom) return { ...proposed, height: Math.max(1, oT - pT) };
                          return { ...proposed, top: oB, height: Math.max(1, pB - oB) };
  }

  startDrag(widgetId: WidgetId, event: MouseEvent): void {
    const widget = this.getWidgetSignal(widgetId)();
    this.dragState.set({
      widgetId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: widget.left,
      startTop: widget.top,
    });
    event.preventDefault();
  }

  startResize(widgetId: WidgetId, handle: ResizeHandle, event: MouseEvent): void {
    const widget = this.getWidgetSignal(widgetId)();
    this.resizeState.set({
      widgetId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: widget.left,
      startTop: widget.top,
      startWidth: widget.width,
      startHeight: widget.height,
    });
    event.preventDefault();
    event.stopPropagation();
  }

  onMouseMove(event: MouseEvent): void {
    const drag = this.dragState();
    const resize = this.resizeState();

    if (drag) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const pad = this.CANVAS_PAD;
      const cw = this.canvasWidth();
      const current = this.getWidgetSignal(drag.widgetId)();
      const widgetW = current.width;
      const widgetH = current.height;
      const rawLeft = drag.startLeft + dx;
      const rawTop = drag.startTop + dy;
      const maxLeft = cw > 0 ? cw - widgetW - pad : rawLeft;
      const clampedLeft = Math.min(Math.max(pad, rawLeft), maxLeft);
      const clampedTop  = Math.max(pad, rawTop);
      let resolvedLeft = clampedLeft;
      let resolvedTop  = clampedTop;
      for (const other of this.getOtherWidgets(drag.widgetId)) {
        const r = this.resolveDragOverlap(resolvedLeft, resolvedTop, widgetW, widgetH, other);
        resolvedLeft = r.left;
        resolvedTop  = r.top;
      }
      this.getWidgetSignal(drag.widgetId).update(s => ({
        ...s,
        left: resolvedLeft,
        top: resolvedTop,
      }));
    }

    if (resize) {
      const dx = event.clientX - resize.startX;
      const dy = event.clientY - resize.startY;
      const MIN_W = 320;
      const MIN_H = 200;
      const pad = this.CANVAS_PAD;
      const cw = this.canvasWidth();
      let top = resize.startTop;
      let left = resize.startLeft;
      let width = resize.startWidth;
      let height = resize.startHeight;
      const h = resize.handle;

      if (h.includes('e')) {
        const maxW = cw > 0 ? cw - resize.startLeft - pad : Infinity;
        width = Math.min(Math.max(MIN_W, resize.startWidth + dx), maxW);
      }
      if (h.includes('w')) {
        const rawWidth = resize.startWidth - dx;
        width = Math.max(MIN_W, rawWidth);
        const rawLeft = rawWidth >= MIN_W
          ? resize.startLeft + dx
          : resize.startLeft + resize.startWidth - MIN_W;
        left = Math.max(pad, rawLeft);
        if (left !== rawLeft) width = resize.startLeft + resize.startWidth - left;
      }
      if (h.includes('s')) {
        height = Math.max(MIN_H, resize.startHeight + dy);
      }
      if (h.includes('n')) {
        const rawHeight = resize.startHeight - dy;
        height = Math.max(MIN_H, rawHeight);
        const rawTop = rawHeight >= MIN_H
          ? resize.startTop + dy
          : resize.startTop + resize.startHeight - MIN_H;
        top = Math.max(pad, rawTop);
        if (top !== rawTop) height = resize.startTop + resize.startHeight - top;
      }

      // Snap horizontal edges to the 16-column grid
      if (h.includes('e')) {
        const snappedRight = this.snapColX(left + width);
        width = Math.max(MIN_W, snappedRight - left);
      }
      if (h.includes('w')) {
        const snappedLeft = this.snapColX(left);
        const delta = left - snappedLeft;
        left = snappedLeft;
        width = Math.max(MIN_W, width + delta);
      }

      this.getWidgetSignal(resize.widgetId).update(s => ({ ...s, top, left, width, height }));
      this.compactWidgets(resize.widgetId);
    }
  }

  onMouseUp(): void {
    const activeId = this.dragState()?.widgetId ?? this.resizeState()?.widgetId;
    this.dragState.set(null);
    this.resizeState.set(null);
    this.compactWidgets();
  }

  widgetWrapperClass(id: WidgetId): string {
    const isActive = this.dragState()?.widgetId === id || this.resizeState()?.widgetId === id;
    return isActive ? 'absolute z-20 select-none' : 'absolute z-10';
  }

  /** Returns 0 (flush with canvas edge) when a widget sits on column 1, otherwise its real left. */
  displayLeft(id: WidgetId): number {
    const left = this.getWidgetSignal(id)().left;
    return left === this.CANVAS_PAD ? 0 : left;
  }

  /** Extends width to the canvas edge when a widget's right edge sits on column 16. */
  displayWidth(id: WidgetId): number {
    const { left, width } = this.getWidgetSignal(id)();
    const cw = this.canvasWidth();
    if (cw <= 0) return width;
    const isRightFlush = left + width === cw - this.CANVAS_PAD;
    return isRightFlush ? cw - this.displayLeft(id) : width;
  }

  headerDragClass(id: WidgetId): string {
    const base = 'flex items-center justify-between px-6 py-4 border-bottom-default select-none';
    return this.dragState()?.widgetId === id
      ? `${base} cursor-grabbing`
      : `${base} cursor-grab`;
  }

  // ── Projects data ──
  readonly projects = signal<Project[]>([
    { id: 1, name: 'Cloud Infrastructure Migration', client: 'Trimble Internal', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'On Track', dueDate: 'Mar 15, 2026', progress: 72, budgetPct: 68, budgetUsed: '$544K', budgetTotal: '$800K' },
    { id: 2, name: 'Mobile App Redesign', client: 'Apex Corp', ownerInitials: 'JC', owner: 'James Carter', status: 'At Risk', dueDate: 'Mar 28, 2026', progress: 45, budgetPct: 82, budgetUsed: '$246K', budgetTotal: '$300K' },
    { id: 3, name: 'ERP System Upgrade', client: 'GlobalTech Ltd', ownerInitials: 'PN', owner: 'Priya Nair', status: 'Overdue', dueDate: 'Feb 20, 2026', progress: 60, budgetPct: 95, budgetUsed: '$855K', budgetTotal: '$900K' },
    { id: 4, name: 'Data Analytics Platform', client: 'NexGen Analytics', ownerInitials: 'TE', owner: 'Tom Evans', status: 'On Track', dueDate: 'Apr 10, 2026', progress: 35, budgetPct: 30, budgetUsed: '$150K', budgetTotal: '$500K' },
    { id: 5, name: 'Customer Portal v3', client: 'Brightline Co', ownerInitials: 'LB', owner: 'Lena Brooks', status: 'Planning', dueDate: 'Apr 30, 2026', progress: 12, budgetPct: 8, budgetUsed: '$24K', budgetTotal: '$350K' },
    { id: 6, name: 'Security & Compliance Audit', client: 'Trimble Internal', ownerInitials: 'MO', owner: 'Mike Osei', status: 'On Track', dueDate: 'Mar 5, 2026', progress: 88, budgetPct: 72, budgetUsed: '$108K', budgetTotal: '$150K' },
    { id: 7, name: 'API Gateway Modernization', client: 'CoreSystems Inc', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'Overdue', dueDate: 'Feb 14, 2026', progress: 30, budgetPct: 55, budgetUsed: '$110K', budgetTotal: '$200K' },
    { id: 8, name: 'ML Model Deployment Pipeline', client: 'DataDrive AI', ownerInitials: 'PN', owner: 'Priya Nair', status: 'On Track', dueDate: 'May 20, 2026', progress: 20, budgetPct: 18, budgetUsed: '$90K', budgetTotal: '$500K' },
  ]);

  readonly totalProjects = computed(() => this.projects().length);
  readonly onTrackCount = computed(() => this.projects().filter(p => p.status === 'On Track').length);
  readonly atRiskCount = computed(() => this.projects().filter(p => p.status === 'At Risk').length);
  readonly overdueCount = computed(() => this.projects().filter(p => p.status === 'Overdue').length);
  readonly onSchedulePct = computed(() => Math.round((this.onTrackCount() / this.totalProjects()) * 100));

  // ── Estimates data ──
  readonly estimates = signal<Estimate[]>([
    { id: 'EST-2026-041', project: 'Cloud Migration Phase 3', client: 'Trimble Internal', type: 'Fixed Price', value: '$320,000', valueRaw: 320000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Mar 1, 2026', daysLeft: 2 },
    { id: 'EST-2026-042', project: 'Mobile App v2.1 Features', client: 'Apex Corp', type: 'T&M', value: '$85,000', valueRaw: 85000, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 5, 2026', daysLeft: 6 },
    { id: 'EST-2026-043', project: 'ERP Post-Go-Live Support', client: 'GlobalTech Ltd', type: 'Retainer', value: '$45,000/mo', valueRaw: 45000, status: 'Draft', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 10, 2026', daysLeft: 11 },
    { id: 'EST-2026-044', project: 'Analytics Dashboard Enhancements', client: 'NexGen Analytics', type: 'Milestone', value: '$220,000', valueRaw: 220000, status: 'Awaiting Approval', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Feb 28, 2026', daysLeft: 1 },
    { id: 'EST-2026-045', project: 'Portal UX Redesign', client: 'Brightline Co', type: 'Fixed Price', value: '$175,000', valueRaw: 175000, status: 'Under Review', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 8, 2026', daysLeft: 9 },
    { id: 'EST-2026-046', project: 'Penetration Testing Scope', client: 'Trimble Internal', type: 'Fixed Price', value: '$38,000', valueRaw: 38000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Mar 15, 2026', daysLeft: 16 },
    { id: 'EST-2026-047', project: 'API Integration Expansion', client: 'CoreSystems Inc', type: 'T&M', value: '$95,000', valueRaw: 95000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Feb 25, 2026', daysLeft: -2 },
    { id: 'EST-2026-048', project: 'ML Pipeline Optimization', client: 'DataDrive AI', type: 'Milestone', value: '$410,000', valueRaw: 410000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 20, 2026', daysLeft: 21 },
    { id: 'EST-2026-049', project: 'DevOps Toolchain Setup', client: 'Trimble Internal', type: 'Fixed Price', value: '$62,000', valueRaw: 62000, status: 'Draft', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Apr 1, 2026', daysLeft: 33 },
    { id: 'EST-2026-050', project: 'Customer Onboarding Automation', client: 'Brightline Co', type: 'T&M', value: '$130,000', valueRaw: 130000, status: 'Awaiting Approval', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 3, 2026', daysLeft: 4 },
    { id: 'EST-2026-051', project: 'Reporting Module Rebuild', client: 'NexGen Analytics', type: 'Fixed Price', value: '$95,500', valueRaw: 95500, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 12, 2026', daysLeft: 13 },
    { id: 'EST-2026-052', project: 'Security Training Program', client: 'GlobalTech Ltd', type: 'Retainer', value: '$18,000/mo', valueRaw: 18000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Apr 5, 2026', daysLeft: 37 },
  ]);

  readonly openEstimatesCount = computed(() =>
    this.estimates().filter(e => e.status !== 'Approved').length
  );

  readonly awaitingApprovalCount = computed(() =>
    this.estimates().filter(e => e.status === 'Awaiting Approval').length
  );

  readonly totalEstimateValue = computed(() => {
    const total = this.estimates()
      .filter(e => e.status !== 'Approved')
      .reduce((sum, e) => sum + e.valueRaw, 0);
    if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
    if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
    return `$${total}`;
  });

  // ── Activity feed ──
  readonly activities: ActivityItem[] = [
    { id: 1, actorInitials: 'SC', text: 'updated Cloud Migration Phase 3 estimate — revised scope adds $40K', timeAgo: '18 min ago', icon: 'edit', iconColor: 'text-primary' },
    { id: 2, actorInitials: 'PN', text: 'flagged ERP System Upgrade budget at 95% — escalation required', timeAgo: '1 hr ago', icon: 'warning', iconColor: 'text-warning' },
    { id: 3, actorInitials: 'TE', text: 'submitted Analytics Dashboard estimate EST-2026-044 for approval', timeAgo: '2 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
    { id: 4, actorInitials: 'MO', text: 'Security Audit checkpoint "Network Controls" marked complete', timeAgo: '3 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
    { id: 5, actorInitials: 'JC', text: 'Mobile App Redesign moved to At Risk — testing resource shortfall', timeAgo: 'Yesterday', icon: 'warning', iconColor: 'text-warning' },
    { id: 6, actorInitials: 'LB', text: 'created draft estimate EST-2026-052 for Security Training Program', timeAgo: 'Yesterday', icon: 'edit', iconColor: 'text-primary' },
  ];

  // ── Needs attention items ──
  readonly attentionItems = [
    { id: 1, title: 'ERP Upgrade budget critical', subtitle: '95% consumed, $45K remaining', dotClass: 'bg-destructive' },
    { id: 2, title: 'API Gateway project overdue', subtitle: 'Was due Feb 14 — 13 days late', dotClass: 'bg-destructive' },
    { id: 3, title: 'EST-2026-047 overdue', subtitle: 'Awaiting approval since Feb 25', dotClass: 'bg-destructive' },
    { id: 4, title: 'Mobile App at risk', subtitle: 'Testing resource gap in March', dotClass: 'bg-warning' },
    { id: 5, title: 'EST-2026-044 due tomorrow', subtitle: 'Analytics Dashboard — $220K', dotClass: 'bg-warning' },
    { id: 6, title: 'ERP UAT sign-off overdue', subtitle: 'Milestone was due Feb 20', dotClass: 'bg-warning' },
  ];

  // ── Helper methods ──
  statusBadgeColor(status: ProjectStatus): ModusBadgeColor {
    const map: Record<ProjectStatus, ModusBadgeColor> = {
      'On Track': 'success',
      'At Risk': 'warning',
      'Overdue': 'danger',
      'Planning': 'secondary',
    };
    return map[status];
  }

  progressClass(status: ProjectStatus): string {
    const map: Record<ProjectStatus, string> = {
      'On Track': 'progress-success',
      'At Risk': 'progress-warning',
      'Overdue': 'progress-danger',
      'Planning': 'progress-primary',
    };
    return map[status];
  }

  budgetProgressClass(pct: number): string {
    if (pct >= 90) return 'progress-danger';
    if (pct >= 75) return 'progress-warning';
    return 'progress-success';
  }

  budgetPctColor(pct: number): string {
    if (pct >= 90) return 'text-destructive font-semibold';
    if (pct >= 75) return 'text-warning font-semibold';
    return 'text-foreground-80';
  }

  estimateBadgeColor(status: EstimateStatus): ModusBadgeColor {
    const map: Record<EstimateStatus, ModusBadgeColor> = {
      'Draft': 'secondary',
      'Under Review': 'primary',
      'Awaiting Approval': 'warning',
      'Approved': 'success',
    };
    return map[status];
  }

  dueDateClass(daysLeft: number): string {
    if (daysLeft < 0) return 'text-destructive font-medium';
    if (daysLeft <= 3) return 'text-warning font-medium';
    return 'text-foreground-40';
  }
}
