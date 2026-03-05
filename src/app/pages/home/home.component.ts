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
import { ModusSideNavigationComponent } from '../../components/modus-side-navigation.component';
import { ModusMenuComponent } from '../../components/modus-menu.component';
import { ModusMenuItemComponent } from '../../components/modus-menu-item.component';
import { ModusIconComponent } from '../../components/modus-icon.component';
import { ThemeService } from '../../services/theme.service';

type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
type DashboardWidgetId = 'projects' | 'openEstimates' | 'recentActivity' | 'needsAttention';

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
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, ModusButtonComponent, ModusUtilityPanelComponent, ModusSideNavigationComponent, ModusMenuComponent, ModusMenuItemComponent, ModusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
  },
  template: `
    <div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      <!-- Navbar -->
      <modus-navbar
        [userCard]="userCard"
        [visibility]="{ user: true, notifications: true, apps: false, help: true, search: true, searchInput: true, mainMenu: true }"
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
      <div #navBody class="flex flex-1 overflow-hidden">

        <!-- Side Navigation -->
        <modus-side-navigation
          [expanded]="navExpanded()"
          [collapseOnClickOutside]="true"
          maxWidth="256px"
          mode="push"
          targetContent="#main-content"
          class="h-full"
          (expandedChange)="navExpanded.set($event)"
        >
          <modus-menu size="lg">
            <modus-menu-item label="Home" value="home" [selected]="activeNav() === 'home'" (itemSelect)="setActiveNav('home')">
              <modus-icon slot="start-icon" name="home" [decorative]="true"></modus-icon>
            </modus-menu-item>
            <modus-menu-item label="Projects" value="projects" [selected]="activeNav() === 'projects'" (itemSelect)="setActiveNav('projects')">
              <modus-icon slot="start-icon" name="briefcase" [decorative]="true"></modus-icon>
            </modus-menu-item>
            <modus-menu-item label="Financials" value="financials" [selected]="activeNav() === 'financials'" (itemSelect)="setActiveNav('financials')">
              <modus-icon slot="start-icon" name="bar_graph" [decorative]="true"></modus-icon>
            </modus-menu-item>
          </modus-menu>
        </modus-side-navigation>

        <!-- Main content -->
        <div id="main-content" class="flex-1 overflow-auto bg-background">

          @switch (activeNav()) {
            @case ('home') {
              <div class="p-6 max-w-screen-xl mx-auto">
                <div class="mb-8">
                  <div class="text-3xl font-bold text-foreground">Welcome back, Alex</div>
                  <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" (click)="setActiveNav('projects')">
                    <div class="w-12 h-12 rounded-xl bg-primary-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-primary">briefcase</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ totalProjects() }}</div>
                      <div class="text-sm text-foreground-60">Active Projects</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40">chevron_right</i>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" (click)="setActiveNav('projects')">
                    <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-warning">description</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ openEstimatesCount() }}</div>
                      <div class="text-sm text-foreground-60">Open Estimates</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40">chevron_right</i>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" (click)="setActiveNav('financials')">
                    <div class="w-12 h-12 rounded-xl bg-success-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-success">bar_graph</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ totalEstimateValue() }}</div>
                      <div class="text-sm text-foreground-60">Estimate Pipeline</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40">chevron_right</i>
                  </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div class="bg-card border-default rounded-lg overflow-hidden">
                    <div class="flex items-center justify-between px-5 py-4 border-bottom-default">
                      <div class="flex items-center gap-2">
                        <i class="modus-icons text-lg text-foreground-60">warning</i>
                        <div class="text-base font-semibold text-foreground">Needs Attention</div>
                      </div>
                      <div class="text-xs text-foreground-40">{{ attentionItems.length }} items</div>
                    </div>
                    @for (item of attentionItems; track item.id) {
                      <div class="flex items-start gap-3 px-5 py-3 border-bottom-default last:border-b-0">
                        <div class="w-2 h-2 rounded-full flex-shrink-0 mt-2 {{ item.dotClass }}"></div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-foreground">{{ item.title }}</div>
                          <div class="text-xs text-foreground-60 mt-0.5">{{ item.subtitle }}</div>
                        </div>
                      </div>
                    }
                  </div>
                  <div class="bg-card border-default rounded-lg overflow-hidden">
                    <div class="flex items-center justify-between px-5 py-4 border-bottom-default">
                      <div class="flex items-center gap-2">
                        <i class="modus-icons text-lg text-foreground-60">history</i>
                        <div class="text-base font-semibold text-foreground">Recent Activity</div>
                      </div>
                    </div>
                    @for (activity of activities.slice(0, 5); track activity.id) {
                      <div class="flex items-start gap-3 px-5 py-3 border-bottom-default last:border-b-0">
                        <div class="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i class="modus-icons text-sm {{ activity.iconColor }}">{{ activity.icon }}</i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm text-foreground">
                            <div class="w-6 h-6 rounded-full bg-primary-20 text-primary text-xs font-semibold inline-flex items-center justify-center mr-1 flex-shrink-0">
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
            }<!-- end @case('home') -->

            @case ('projects') {

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

            <!-- Widget area: 16-column grid layout -->
            <div
              class="grid gap-4 mb-6"
              style="grid-template-columns: repeat(16, minmax(0, 1fr))"
              #widgetGrid
            >

              @for (widgetId of widgetOrder(); track widgetId) {

              <!-- Widget wrapper — column explicit, row from auto-flow (no overlaps) -->
              <div
                class="relative"
                [attr.data-widget-id]="widgetId"
                [style.grid-column]="widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
              >
                <!-- Widget card (dims while being moved) -->
                <div class="relative" [class.opacity-30]="moveTargetId() === widgetId">

                @if (widgetId === 'projects') {
              <!-- ─── Projects Widget ─── -->
              <div class="bg-card border-default rounded-lg overflow-hidden">
                <!-- Draggable header -->
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60">apps</i>
                    <div class="text-lg font-semibold text-foreground">Projects</div>
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
                <!-- Card grid -->
                <div class="p-4">
                  <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    @for (project of projects(); track project.id) {
                      <div class="bg-background border-default rounded-lg overflow-hidden flex flex-col">
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
                              <i class="modus-icons text-sm">calendar</i>
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
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              } @else if (widgetId === 'openEstimates') {
              <!-- ─── Open Estimates Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden" #estimatesContainer>
                <!-- Draggable header -->
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60">description</i>
                    <div class="text-lg font-semibold text-foreground">Open Estimates</div>
                    <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                  </div>
                  <modus-button color="primary" variant="outlined" size="sm" icon="add" iconPosition="left">
                    New Estimate
                  </modus-button>
                </div>
                <!-- Table header -->
                <div
                  class="grid gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide"
                  [class]="estimatesNarrow() ? 'grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr]' : 'grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_1fr]'"
                >
                  <div>ID</div>
                  <div>Project / Client</div>
                  <div>Type</div>
                  <div>Value</div>
                  <div>Status</div>
                  @if (!estimatesNarrow()) {
                    <div>Requested By</div>
                  }
                  <div>Due Date</div>
                </div>
                <!-- Table rows -->
                <div class="overflow-y-auto" [style.max-height.px]="estimatesHeight()">
                  @for (estimate of estimates(); track estimate.id) {
                    <div
                      class="grid gap-3 px-6 py-4 border-bottom-default items-center last:border-b-0 hover:bg-muted transition-colors duration-150"
                      [class]="estimatesNarrow() ? 'grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr]' : 'grid-cols-[1fr_2fr_1fr_1fr_1fr_1.5fr_1fr]'"
                    >
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
                      @if (!estimatesNarrow()) {
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold flex-shrink-0">
                            {{ estimate.requestedByInitials }}
                          </div>
                          <div class="text-xs text-foreground-80 truncate">{{ estimate.requestedBy }}</div>
                        </div>
                      }
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
                <!-- Corner resize handle (width + height) -->
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                  (mousedown)="startWidgetResize('openEstimates', 'both', $event)"
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
              <!-- ─── Recent Activity Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40">drag_indicator</i>
                  <i class="modus-icons text-lg text-foreground-60">history</i>
                  <div class="text-lg font-semibold text-foreground">Recent Activity</div>
                </div>
                <div class="overflow-y-auto" [style.max-height.px]="activityHeight()">
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
                <!-- Corner resize handle (width + height) -->
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                  (mousedown)="startWidgetResize('recentActivity', 'both', $event)"
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
              <!-- ─── Needs Attention Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40">drag_indicator</i>
                  <i class="modus-icons text-lg text-warning">warning</i>
                  <div class="text-lg font-semibold text-foreground">Needs Attention</div>
                </div>
                <div class="overflow-y-auto" [style.max-height.px]="attentionHeight()">
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
                <!-- Corner resize handle (width + height) -->
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                  (mousedown)="startWidgetResize('needsAttention', 'both', $event)"
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

              } <!-- end @if widgetId -->

                </div><!-- end widget-card opacity wrapper -->
              </div><!-- end widget wrapper -->

              }<!-- end @for widgetOrder -->

            </div>

          </div>

            }<!-- end @case('projects') -->

            @case ('financials') {
              <div class="p-6 max-w-screen-xl mx-auto">
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <div class="text-3xl font-bold text-foreground">Financials</div>
                    <div class="text-sm text-foreground-60 mt-1">Budget overview and cost tracking</div>
                  </div>
                  <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-foreground-60">Total Budget</div>
                      <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center">
                        <i class="modus-icons text-lg text-primary">payment_instant</i>
                      </div>
                    </div>
                    <div class="text-4xl font-bold text-foreground">$3.7M</div>
                    <div class="text-xs text-foreground-60">Across {{ totalProjects() }} active projects</div>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-foreground-60">Total Spent</div>
                      <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
                        <i class="modus-icons text-lg text-warning">bar_graph_line</i>
                      </div>
                    </div>
                    <div class="text-4xl font-bold text-foreground">$2.1M</div>
                    <div class="text-xs text-warning font-medium">57% of total budget consumed</div>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-foreground-60">Remaining</div>
                      <div class="w-9 h-9 rounded-lg bg-success-20 flex items-center justify-center">
                        <i class="modus-icons text-lg text-success">bar_graph</i>
                      </div>
                    </div>
                    <div class="text-4xl font-bold text-success">$1.6M</div>
                    <div class="text-xs text-success font-medium">43% remaining budget</div>
                  </div>
                </div>
                <div class="bg-card border-default rounded-lg overflow-hidden">
                  <div class="px-5 py-4 border-bottom-default">
                    <div class="text-base font-semibold text-foreground">Budget by Project</div>
                  </div>
                  <div class="divide-y divide-[var(--border)]">
                    @for (p of projects(); track p.id) {
                      <div class="px-5 py-4 flex items-center gap-4">
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-foreground truncate">{{ p.name }}</div>
                          <div class="text-xs text-foreground-60 mt-0.5">{{ p.client }}</div>
                        </div>
                        <div class="text-sm text-foreground-60 w-28 text-right shrink-0">{{ p.budgetUsed }} / {{ p.budgetTotal }}</div>
                        <div class="w-32 shrink-0">
                          <modus-progress [value]="p.budgetPct" [max]="100" size="compact" />
                        </div>
                        <div class="text-xs font-medium w-10 text-right shrink-0
                          {{ p.budgetPct >= 90 ? 'text-destructive' : p.budgetPct >= 75 ? 'text-warning' : 'text-success' }}">
                          {{ p.budgetPct }}%
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }<!-- end @case('financials') -->

          }<!-- end @switch -->

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

  // ── Side Navigation ──
  readonly navExpanded = signal(false);
  readonly activeNav = signal<'home' | 'projects' | 'financials'>('home');

  private readonly navBodyRef = viewChild<ElementRef>('navBody');

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

  // ── Estimates table responsive column ──
  private readonly estimatesContainerRef = viewChild<ElementRef>('estimatesContainer');
  readonly estimatesNarrow = computed(() => this.widgetColSpans()['openEstimates'] <= 13);

  setActiveNav(page: 'home' | 'projects' | 'financials'): void {
    this.activeNav.set(page);
    this.navExpanded.set(false);
  }

  ngAfterViewInit(): void {
    // Wire navbar hamburger → side nav expanded
    const body = this.navBodyRef()?.nativeElement as HTMLElement | undefined;
    if (body) {
      body.addEventListener('mainMenuOpenChange', (event: Event) => {
        const detail = (event as CustomEvent<boolean>).detail;
        this.navExpanded.set(detail);
        const sideNav = body.querySelector('modus-wc-side-navigation') as (HTMLElement & { expanded: boolean }) | null;
        if (sideNav) sideNav.expanded = detail;
      });
    }

    // Estimates table responsive column
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

  // ── Widget layout ──
  // Row order is determined by DOM sequence (CSS auto-flow — zero overlaps by design).
  // Column start + span per widget control horizontal placement.

  readonly estimatesHeight = signal(420);
  readonly activityHeight = signal(360);
  readonly attentionHeight = signal(360);

  /** Render order — determines auto-flow row stacking. */
  readonly widgetOrder = signal<DashboardWidgetId[]>(['projects', 'openEstimates', 'recentActivity', 'needsAttention']);

  /** Column start (1-16) per widget. */
  readonly widgetColStarts = signal<Record<DashboardWidgetId, number>>({
    projects: 1, openEstimates: 1, recentActivity: 1, needsAttention: 13,
  });

  /** Column span (1-16) per widget. */
  readonly widgetColSpans = signal<Record<DashboardWidgetId, number>>({
    projects: 16, openEstimates: 16, recentActivity: 12, needsAttention: 4,
  });

  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');

  // ── Drag-to-move ──

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);

  private _moveTarget: DashboardWidgetId | null = null;
  private _dragAxis: 'h' | 'v' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = null;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this.moveTargetId.set(id);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.gridContainerRef()?.nativeElement as HTMLElement | undefined;
    if (!grid || !this._moveTarget) return;

    // Determine axis lock once the threshold is crossed.
    if (!this._dragAxis) {
      const dx = Math.abs(event.clientX - this._dragStartX);
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dx < 8 && dy < 8) return; // below threshold — wait
      this._dragAxis = dx >= dy ? 'h' : 'v';
    }

    const rect = grid.getBoundingClientRect();

    if (this._dragAxis === 'h') {
      // Horizontal only — change colStart, leave order alone.
      const colW = rect.width / 16;
      const span = this.widgetColSpans()[this._moveTarget];
      const rawStart = Math.floor((event.clientX - rect.left) / colW) + 1;
      const newColStart = Math.max(1, Math.min(17 - span, rawStart));
      if (newColStart !== this.widgetColStarts()[this._moveTarget]) {
        this.widgetColStarts.update(s => ({ ...s, [this._moveTarget!]: newColStart }));
      }
    } else {
      // Vertical only — change order, leave colStart alone.
      const order = this.widgetOrder();
      const others = order.filter(id => id !== this._moveTarget);
      let insertBeforeId: DashboardWidgetId | null = null;
      for (const otherId of others) {
        const el = grid.querySelector(`[data-widget-id="${otherId}"]`) as HTMLElement | null;
        if (!el) continue;
        const er = el.getBoundingClientRect();
        if (event.clientY < (er.top + er.bottom) / 2) {
          insertBeforeId = otherId;
          break;
        }
      }
      const currentIdx = order.indexOf(this._moveTarget);
      const targetIdx = insertBeforeId === null
        ? others.length
        : others.indexOf(insertBeforeId);
      if (currentIdx !== targetIdx) {
        this.widgetOrder.update(ord => {
          const next = ord.filter(id => id !== this._moveTarget!);
          next.splice(targetIdx, 0, this._moveTarget!);
          return next;
        });
      }
    }
  }

  // ── Resize ──

  private _resizeTarget: string | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartColSpan = 0;
  private _gridContainerWidth = 1200;

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = dir;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = target === 'openEstimates'
        ? this.estimatesHeight()
        : target === 'recentActivity'
          ? this.activityHeight()
          : this.attentionHeight();
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartColSpan = this.widgetColSpans()[target as DashboardWidgetId] ?? 8;
      this._gridContainerWidth = this.gridContainerRef()?.nativeElement?.offsetWidth ?? 1200;
    }
  }

  // ── Unified document mouse handlers ──

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const newH = Math.max(120, this._resizeStartH + (event.clientY - this._resizeStartY));
        if (this._resizeTarget === 'openEstimates') this.estimatesHeight.set(newH);
        else if (this._resizeTarget === 'recentActivity') this.activityHeight.set(newH);
        else this.attentionHeight.set(newH);
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const colW = this._gridContainerWidth / 16;
        const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
        const newSpan = this._resizeStartColSpan + deltaSpan;
        const id = this._resizeTarget as DashboardWidgetId;
        const clampedSpan = Math.max(id === 'needsAttention' ? 3 : 4, Math.min(16, newSpan));
        this.widgetColSpans.update(s => ({ ...s, [id]: clampedSpan }));
      }
    }
  }

  onDocumentMouseUp(): void {
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
  }
}
