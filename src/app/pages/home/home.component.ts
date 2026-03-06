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
type DashboardWidgetId = 'projects' | 'openEstimates' | 'recentActivity' | 'needsAttention' | 'timeOff' | 'homeTimeOff' | 'homeCalendar';

type ApptType = 'meeting' | 'review' | 'call' | 'deadline' | 'focus';
interface CalendarAppointment {
  id: number;
  title: string;
  date: Date;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  type: ApptType;
}

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
    <div #appRoot class="h-screen flex flex-col bg-background text-foreground overflow-hidden">

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
      <div class="flex flex-1 overflow-hidden">

        <!-- Side Navigation -->
        <!-- Desktop: push mode — icon strip visible when collapsed           -->
        <!-- Mobile:  overlay mode — hidden entirely when collapsed,          -->
        <!--          slides over content when hamburger is tapped            -->
        <modus-side-navigation
          [expanded]="navExpanded()"
          [collapseOnClickOutside]="true"
          maxWidth="256px"
          [mode]="isMobile() ? 'overlay' : 'push'"
          targetContent="#main-content"
          class="h-full"
          [class.hidden]="isMobile() && !navExpanded()"
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
        <div id="main-content" class="flex-1 overflow-auto bg-background" [style.margin-left]="isMobile() ? '0' : null">

          @switch (activeNav()) {
            @case ('home') {
              <div class="p-6 max-w-screen-xl mx-auto">
                <!-- Page header -->
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <div class="text-3xl font-bold text-foreground">Welcome back, Alex</div>
                    <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
                  </div>
                </div>

                <!-- KPI summary cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

                <!-- Home widget grid -->
                <div
                  class="grid gap-4"
                  [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
                  #homeWidgetGrid
                >
                  @for (widgetId of homeWidgetOrder(); track widgetId) {
                    <div
                      class="relative"
                      [attr.data-widget-id]="widgetId"
                      [style.grid-column]="isMobile() ? '1 / -1' : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
                    >
                      <div class="relative" [class.opacity-30]="moveTargetId() === widgetId">

                        @if (widgetId === 'homeTimeOff') {
                          <!-- ─── Time Off Requests Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
                                <i class="modus-icons text-lg text-foreground-60">calendar</i>
                                <div class="text-base font-semibold text-foreground">Time Off Requests</div>
                                @if (pendingTimeOffCount() > 0) {
                                  <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                                    <div class="text-xs font-medium text-warning">{{ pendingTimeOffCount() }} pending</div>
                                  </div>
                                }
                              </div>
                              <!-- View toggle — stop drag propagation -->
                              <div
                                class="flex items-center rounded-lg border-default overflow-hidden flex-shrink-0"
                                (mousedown)="$event.stopPropagation()"
                              >
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="timeOffView() === 'list'"
                                  [class.text-primary-foreground]="timeOffView() === 'list'"
                                  [class.text-foreground-60]="timeOffView() !== 'list'"
                                  (click)="timeOffView.set('list')"
                                >
                                  <i class="modus-icons text-sm">list_bulleted</i>
                                  <div>List</div>
                                </div>
                                <div class="w-px h-5 bg-muted flex-shrink-0"></div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="timeOffView() === 'calendar'"
                                  [class.text-primary-foreground]="timeOffView() === 'calendar'"
                                  [class.text-foreground-60]="timeOffView() !== 'calendar'"
                                  (click)="timeOffView.set('calendar')"
                                >
                                  <i class="modus-icons text-sm">calendar</i>
                                  <div>Calendar</div>
                                </div>
                              </div>
                            </div>

                            <!-- List view -->
                            @if (timeOffView() === 'list') {
                              <div class="overflow-y-auto flex-1" [style.height.px]="homeTimeOffHeight()">
                                <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                                  <div>Employee</div>
                                  <div>Type</div>
                                  <div>Dates</div>
                                  <div>Days</div>
                                  <div>Status</div>
                                </div>
                                @for (req of timeOffRequests; track req.id) {
                                  <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150">
                                    <div class="flex items-center gap-2">
                                      <div class="w-7 h-7 rounded-full bg-primary-20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                                        {{ req.initials }}
                                      </div>
                                      <div class="text-sm font-medium text-foreground truncate">{{ req.name }}</div>
                                    </div>
                                    <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block w-fit">{{ req.type }}</div>
                                    <div class="text-sm text-foreground-80">{{ req.startDate }}@if (req.startDate !== req.endDate) { – {{ req.endDate }}}</div>
                                    <div class="text-sm text-foreground-60">{{ req.days }}d</div>
                                    <div>
                                      <div class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full
                                        {{ req.status === 'Approved' ? 'bg-success-20 text-success' :
                                           req.status === 'Pending'  ? 'bg-warning-20 text-warning' :
                                           'bg-destructive-20 text-destructive' }}">
                                        {{ req.status }}
                                      </div>
                                    </div>
                                  </div>
                                }
                              </div>
                            }

                            <!-- Calendar view -->
                            @if (timeOffView() === 'calendar') {
                              <div class="flex flex-col" [style.height.px]="homeTimeOffHeight()">
                                <!-- Month navigation -->
                                <div class="flex items-center justify-between px-5 py-3 border-bottom-default flex-shrink-0" (mousedown)="$event.stopPropagation()">
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                    (click)="prevCalendarMonth()"
                                  >
                                    <i class="modus-icons text-sm text-foreground-60">chevron_left</i>
                                  </div>
                                  <div class="text-sm font-semibold text-foreground">{{ calendarMonthLabel() }}</div>
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                    (click)="nextCalendarMonth()"
                                  >
                                    <i class="modus-icons text-sm text-foreground-60">chevron_right</i>
                                  </div>
                                </div>
                                <!-- Day-of-week headers -->
                                <div class="grid grid-cols-7 px-3 pt-2 pb-1 flex-shrink-0">
                                  @for (d of ['Su','Mo','Tu','We','Th','Fr','Sa']; track d) {
                                    <div class="text-center text-2xs font-semibold text-foreground-40 uppercase py-1">{{ d }}</div>
                                  }
                                </div>
                                <!-- Calendar cells -->
                                <div class="grid grid-cols-7 gap-px px-3 pb-3 overflow-y-auto flex-1">
                                  @for (cell of calendarDays(); track $index) {
                                    <div class="min-h-[52px] rounded-lg p-1 flex flex-col gap-0.5"
                                      [class.bg-muted]="cell.day !== null && cell.requests.length === 0"
                                      [class.bg-primary-20]="cell.requests.length > 0"
                                    >
                                      @if (cell.day !== null) {
                                        <div class="text-xs font-medium text-foreground-60 text-center leading-4">{{ cell.day }}</div>
                                        @for (req of cell.requests.slice(0, 2); track req.id) {
                                          <div class="flex items-center gap-1 rounded px-1 py-0.5 {{ timeOffStatusColor(req.status) }}">
                                            <div class="text-2xs font-semibold leading-none truncate">{{ req.initials }}</div>
                                          </div>
                                        }
                                        @if (cell.requests.length > 2) {
                                          <div class="text-2xs text-foreground-60 text-center">+{{ cell.requests.length - 2 }}</div>
                                        }
                                      }
                                    </div>
                                  }
                                </div>
                                <!-- Legend -->
                                <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0" (mousedown)="$event.stopPropagation()">
                                  <div class="flex items-center gap-1.5">
                                    <div class="w-2.5 h-2.5 rounded-sm bg-success"></div>
                                    <div class="text-xs text-foreground-60">Approved</div>
                                  </div>
                                  <div class="flex items-center gap-1.5">
                                    <div class="w-2.5 h-2.5 rounded-sm bg-warning"></div>
                                    <div class="text-xs text-foreground-60">Pending</div>
                                  </div>
                                  <div class="flex items-center gap-1.5">
                                    <div class="w-2.5 h-2.5 rounded-sm bg-destructive"></div>
                                    <div class="text-xs text-foreground-60">Denied</div>
                                  </div>
                                </div>
                              </div>
                            }
                          </div>
                          <!-- Corner resize handle -->
                          @if (!isMobile()) {
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
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
                        }
                        @else if (widgetId === 'homeCalendar') {
                          <!-- ─── Two-Day Calendar Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
                                <i class="modus-icons text-lg text-foreground-60">calendar</i>
                                <div class="text-base font-semibold text-foreground">Calendar</div>
                                <div class="text-xs text-foreground-40">{{ calendarDay1Meta().dateStr }} – {{ calendarDay2Meta().dateStr }}</div>
                              </div>
                              <!-- Navigation — stop drag propagation -->
                              <div class="flex items-center gap-1" (mousedown)="$event.stopPropagation()">
                                <div
                                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                  (click)="prevCalendarDay()"
                                >
                                  <i class="modus-icons text-sm text-foreground-60">chevron_left</i>
                                </div>
                                <div
                                  class="px-2 py-1 text-xs font-medium text-primary cursor-pointer hover:bg-primary-20 rounded transition-colors duration-150 select-none"
                                  (click)="resetCalendarToToday()"
                                >Today</div>
                                <div
                                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                  (click)="nextCalendarDay()"
                                >
                                  <i class="modus-icons text-sm text-foreground-60">chevron_right</i>
                                </div>
                              </div>
                            </div>

                            <!-- Day column headers -->
                            <div class="flex flex-shrink-0 border-bottom-default" (mousedown)="$event.stopPropagation()">
                              <div class="w-12 flex-shrink-0"></div>
                              <!-- Day 1 header -->
                              <div class="flex-1 py-2 px-3 text-center border-right-default">
                                <div class="text-xs font-semibold uppercase tracking-wide {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                                  {{ calendarDay1Meta().label }}
                                </div>
                                <div class="text-2xl font-bold leading-tight {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                                  {{ calendarDay1Meta().dayNum }}
                                </div>
                              </div>
                              <!-- Day 2 header -->
                              <div class="flex-1 py-2 px-3 text-center">
                                <div class="text-xs font-semibold uppercase tracking-wide {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                                  {{ calendarDay2Meta().label }}
                                </div>
                                <div class="text-2xl font-bold leading-tight {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                                  {{ calendarDay2Meta().dayNum }}
                                </div>
                              </div>
                            </div>

                            <!-- Time grid -->
                            <div class="flex overflow-y-auto" [style.height.px]="homeCalendarHeight()">

                              <!-- Time gutter -->
                              <div class="w-12 flex-shrink-0">
                                @for (hour of calendarHours; track hour) {
                                  <div class="h-[60px] flex items-start justify-end pr-2 -mt-0">
                                    <div class="text-2xs text-foreground-40 mt-1">{{ formatCalHour(hour) }}</div>
                                  </div>
                                }
                              </div>

                              <!-- Day 1 column -->
                              <div class="flex-1 relative border-right-default">
                                @for (hour of calendarHours; track hour) {
                                  <div class="h-[60px] border-bottom-default"></div>
                                }
                                <!-- Appointments -->
                                @for (appt of calendarDay1Appts(); track appt.id) {
                                  <div
                                    class="absolute inset-x-1 rounded px-1.5 py-0.5 text-xs overflow-hidden border-l-2 cursor-default {{ apptColor(appt.type) }}"
                                    [style.top.px]="apptTop(appt)"
                                    [style.height.px]="apptHeight(appt)"
                                  >
                                    <div class="font-medium leading-tight truncate">{{ appt.title }}</div>
                                    @if (apptHeight(appt) >= 36) {
                                      <div class="text-2xs opacity-70 mt-0.5">{{ formatApptTime(appt.startHour, appt.startMin) }} – {{ formatApptTime(appt.endHour, appt.endMin) }}</div>
                                    }
                                  </div>
                                }
                                <!-- Current time indicator — day 1 -->
                                @if (calendarDay1Meta().isToday) {
                                  <div class="absolute left-0 right-0 h-px bg-destructive z-10 pointer-events-none" [style.top.px]="currentTimeTop()">
                                    <div class="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive"></div>
                                  </div>
                                }
                              </div>

                              <!-- Day 2 column -->
                              <div class="flex-1 relative">
                                @for (hour of calendarHours; track hour) {
                                  <div class="h-[60px] border-bottom-default"></div>
                                }
                                <!-- Appointments -->
                                @for (appt of calendarDay2Appts(); track appt.id) {
                                  <div
                                    class="absolute inset-x-1 rounded px-1.5 py-0.5 text-xs overflow-hidden border-l-2 cursor-default {{ apptColor(appt.type) }}"
                                    [style.top.px]="apptTop(appt)"
                                    [style.height.px]="apptHeight(appt)"
                                  >
                                    <div class="font-medium leading-tight truncate">{{ appt.title }}</div>
                                    @if (apptHeight(appt) >= 36) {
                                      <div class="text-2xs opacity-70 mt-0.5">{{ formatApptTime(appt.startHour, appt.startMin) }} – {{ formatApptTime(appt.endHour, appt.endMin) }}</div>
                                    }
                                  </div>
                                }
                                <!-- Current time indicator — day 2 -->
                                @if (calendarDay2Meta().isToday) {
                                  <div class="absolute left-0 right-0 h-px bg-destructive z-10 pointer-events-none" [style.top.px]="currentTimeTop()">
                                    <div class="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive"></div>
                                  </div>
                                }
                              </div>

                            </div>

                            <!-- Legend -->
                            <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0" (mousedown)="$event.stopPropagation()">
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-sm bg-primary"></div>
                                <div class="text-xs text-foreground-60">Meeting</div>
                              </div>
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-sm bg-warning"></div>
                                <div class="text-xs text-foreground-60">Review</div>
                              </div>
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-sm bg-success"></div>
                                <div class="text-xs text-foreground-60">Call</div>
                              </div>
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-sm bg-destructive"></div>
                                <div class="text-xs text-foreground-60">Deadline</div>
                              </div>
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-sm bg-secondary"></div>
                                <div class="text-xs text-foreground-60">Focus</div>
                              </div>
                            </div>
                          </div>
                          <!-- Corner resize handle -->
                          @if (!isMobile()) {
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
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
                        }

                      </div>
                    </div>
                  }
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
                <modus-button color="primary" size="sm" icon="add" iconPosition="left">Create</modus-button>
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
              [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
              #widgetGrid
            >

              @for (widgetId of widgetOrder(); track widgetId) {

              <!-- Widget wrapper — column explicit, row from auto-flow (no overlaps) -->
              <div
                class="relative"
                [attr.data-widget-id]="widgetId"
                [style.grid-column]="isMobile() ? '1 / -1' : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
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
                    <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
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
                    <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60">description</i>
                    <div class="text-lg font-semibold text-foreground">Open Estimates</div>
                    <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                  </div>
                  <div class="flex-shrink-0">
                    <modus-button color="primary" variant="outlined" size="sm" icon="add" iconPosition="left">New Estimate</modus-button>
                  </div>
                </div>
                <!-- Table header -->
                <div
                  class="grid gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide"
                  [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                >
                  @if (!estimatesXXNarrow()) {
                    <div>ID</div>
                  }
                  <div>Project / Client</div>
                  @if (!estimatesXNarrow()) {
                    <div>Type</div>
                  }
                  @if (!estimatesUltraNarrow()) {
                    <div>Value</div>
                  }
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
                      [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                    >
                      @if (!estimatesXXNarrow()) {
                        <div class="text-sm font-mono text-primary font-medium">{{ estimate.id }}</div>
                      }
                      <div>
                        <div class="text-sm font-medium text-foreground truncate">{{ estimate.project }}</div>
                        <div class="text-xs text-foreground-60 mt-0.5 truncate">{{ estimate.client }}</div>
                      </div>
                      @if (!estimatesXNarrow()) {
                        <div>
                          <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ estimate.type }}</div>
                        </div>
                      }
                      @if (!estimatesUltraNarrow()) {
                        <div class="text-sm font-semibold text-foreground">{{ estimate.value }}</div>
                      }
                      <div>
                        <modus-badge [color]="estimateBadgeColor(estimate.status)" variant="outlined" size="sm">
                          {{ estimate.status }}
                        </modus-badge>
                      </div>
                      @if (!estimatesNarrow()) {
                        <div class="flex items-center gap-2 min-w-0">
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
                @if (!isMobile()) {
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
                }
              </div>

              } @else if (widgetId === 'recentActivity') {
              <!-- ─── Recent Activity Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
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
                @if (!isMobile()) {
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
                }
              </div>

              } @else if (widgetId === 'needsAttention') {
              <!-- ─── Needs Attention Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
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
                @if (!isMobile()) {
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
                }
              </div>

              } @else if (widgetId === 'timeOff') {
              <!-- ─── Time Off Requests Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col">
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" [class.hidden]="isMobile()">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60">calendar</i>
                    <div class="text-lg font-semibold text-foreground">Time Off Requests</div>
                    @if (pendingTimeOffCount() > 0) {
                      <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-20">
                        <div class="text-xs font-medium text-warning">{{ pendingTimeOffCount() }} pending</div>
                      </div>
                    }
                  </div>
                  <div class="flex-shrink-0">
                    <modus-button color="primary" variant="outlined" size="sm" icon="add" iconPosition="left">New Request</modus-button>
                  </div>
                </div>
                <div class="overflow-y-auto">
                  <!-- Header row -->
                  <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                    <div>Employee</div>
                    <div>Type</div>
                    <div>Dates</div>
                    <div>Days</div>
                    <div>Status</div>
                  </div>
                  @for (req of timeOffRequests; track req.id) {
                    <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-6 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full bg-primary-20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {{ req.initials }}
                        </div>
                        <div class="text-sm font-medium text-foreground truncate">{{ req.name }}</div>
                      </div>
                      <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block w-fit">{{ req.type }}</div>
                      <div class="text-sm text-foreground-80">{{ req.startDate }}@if (req.startDate !== req.endDate) { – {{ req.endDate }}}</div>
                      <div class="text-sm text-foreground-60">{{ req.days }}d</div>
                      <div>
                        <div class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full
                          {{ req.status === 'Approved' ? 'bg-success-20 text-success' :
                             req.status === 'Pending'  ? 'bg-warning-20 text-warning' :
                             'bg-destructive-20 text-destructive' }}">
                          {{ req.status }}
                        </div>
                      </div>
                    </div>
                  }
                </div>
                <!-- Corner resize handle -->
                @if (!isMobile()) {
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-30 select-none group"
                  (mousedown)="startWidgetResize('timeOff', 'both', $event)"
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
                  <div class="flex-shrink-0">
                    <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
                  </div>
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

  private readonly appRootRef = viewChild<ElementRef>('appRoot');

  // ── Side Navigation ──
  readonly navExpanded = signal(false);
  readonly activeNav = signal<'home' | 'projects' | 'financials'>('home');
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);


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
  readonly estimatesXNarrow = computed(() => this.widgetColSpans()['openEstimates'] <= 10);
  readonly estimatesXXNarrow = computed(() => this.widgetColSpans()['openEstimates'] <= 9);
  readonly estimatesUltraNarrow = computed(() => this.widgetColSpans()['openEstimates'] <= 6);

  setActiveNav(page: 'home' | 'projects' | 'financials'): void {
    this.activeNav.set(page);
    this.navExpanded.set(false);
    // Keep the web component in sync when nav item is clicked
    const root = this.appRootRef()?.nativeElement as HTMLElement | undefined;
    const sideNav = root?.querySelector('modus-wc-side-navigation') as (HTMLElement & { expanded: boolean }) | null;
    if (sideNav) sideNav.expanded = false;
  }

  ngAfterViewInit(): void {
    const root = this.appRootRef()?.nativeElement as HTMLElement | undefined;
    if (!root) return;

    // Catch the navbar's hamburger event on the common ancestor container and
    // set the side-nav expanded property directly — this is the pattern used
    // by the official Modus side-navigation demo.
    root.addEventListener('mainMenuOpenChange', (event: Event) => {
      const expanded = (event as CustomEvent<boolean>).detail;
      const sideNav = root.querySelector('modus-wc-side-navigation') as (HTMLElement & { expanded: boolean }) | null;
      if (sideNav) sideNav.expanded = expanded;
      this.navExpanded.set(expanded);
    });

    // Track mobile breakpoint so the side nav switches between overlay (mobile)
    // and push (desktop) modes.  When switching to desktop, collapse any open
    // overlay nav; when switching to mobile, collapse any pushed nav.
    const mq = window.matchMedia('(max-width: 767px)');
    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isMobile.set(e.matches);
      if (!e.matches) {
        // Switched to desktop — close overlay nav if open
        this.navExpanded.set(false);
        const sideNav = root.querySelector('modus-wc-side-navigation') as (HTMLElement & { expanded: boolean }) | null;
        if (sideNav) sideNav.expanded = false;
      }
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void);
    // Sync initial state
    onBreakpointChange(mq);
  }

  // ── Time Off widget view toggle ──

  readonly timeOffView = signal<'list' | 'calendar'>('list');
  readonly calendarYear = signal(2026);
  readonly calendarMonth = signal(2); // 0-indexed; 2 = March

  private readonly _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  private readonly _monthAbbr: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  readonly calendarMonthLabel = computed(() =>
    `${this._monthNames[this.calendarMonth()]} ${this.calendarYear()}`
  );

  readonly calendarDays = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Map each day-of-month to all requests that overlap it.
    interface TimeOffEntry {
      id: number; name: string; initials: string; type: string;
      startDate: string; endDate: string; days: number;
      status: 'Pending' | 'Approved' | 'Denied';
    }
    const dayMap = new Map<number, TimeOffEntry[]>();
    for (const req of this.timeOffRequests) {
      const [startMon, startDayStr] = req.startDate.split(' ');
      const [endMon, endDayStr] = req.endDate.split(' ');
      const start = new Date(year, this._monthAbbr[startMon], parseInt(startDayStr));
      const end = new Date(year, this._monthAbbr[endMon], parseInt(endDayStr));
      const cur = new Date(start);
      while (cur <= end) {
        if (cur.getFullYear() === year && cur.getMonth() === month) {
          const d = cur.getDate();
          if (!dayMap.has(d)) dayMap.set(d, []);
          dayMap.get(d)!.push(req);
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    interface CalCell { day: number | null; requests: TimeOffEntry[] }
    const cells: CalCell[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, requests: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, requests: dayMap.get(d) ?? [] });
    while (cells.length % 7 !== 0) cells.push({ day: null, requests: [] });
    return cells;
  });

  prevCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 0) { this.calendarMonth.set(11); this.calendarYear.update(y => y - 1); }
    else { this.calendarMonth.update(v => v - 1); }
  }

  nextCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 11) { this.calendarMonth.set(0); this.calendarYear.update(y => y + 1); }
    else { this.calendarMonth.update(v => v + 1); }
  }

  timeOffStatusColor(status: string): string {
    if (status === 'Approved') return 'bg-success text-success-foreground';
    if (status === 'Pending') return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  }

  // ── Calendar Widget ──

  private readonly _apptTypeColor: Record<ApptType, string> = {
    meeting:  'bg-primary-20 text-primary border-primary',
    review:   'bg-warning-20 text-warning border-warning',
    call:     'bg-success-20 text-success border-success',
    deadline: 'bg-destructive-20 text-destructive border-destructive',
    focus:    'bg-secondary text-foreground-60 border-muted',
  };

  readonly calendarAppointments: CalendarAppointment[] = [
    // Mar 5
    { id: 1,  title: 'Daily Standup',          date: new Date(2026, 2, 5),  startHour: 9,  startMin: 0,  endHour: 9,  endMin: 30, type: 'meeting'  },
    { id: 2,  title: 'ERP Budget Review',       date: new Date(2026, 2, 5),  startHour: 10, startMin: 0,  endHour: 11, endMin: 0,  type: 'review'   },
    { id: 3,  title: 'Client Call — Acme Corp', date: new Date(2026, 2, 5),  startHour: 14, startMin: 0,  endHour: 14, endMin: 30, type: 'call'     },
    { id: 4,  title: 'Focus: Sprint Reports',   date: new Date(2026, 2, 5),  startHour: 15, startMin: 0,  endHour: 17, endMin: 0,  type: 'focus'    },
    // Mar 6
    { id: 5,  title: 'Sprint Planning',         date: new Date(2026, 2, 6),  startHour: 9,  startMin: 0,  endHour: 10, endMin: 30, type: 'meeting'  },
    { id: 6,  title: 'Design Review',           date: new Date(2026, 2, 6),  startHour: 11, startMin: 0,  endHour: 11, endMin: 30, type: 'review'   },
    { id: 7,  title: 'EST-2026-044 Deadline',   date: new Date(2026, 2, 6),  startHour: 17, startMin: 0,  endHour: 17, endMin: 30, type: 'deadline' },
    // Mar 9
    { id: 8,  title: 'Planning Session',        date: new Date(2026, 2, 9),  startHour: 9,  startMin: 0,  endHour: 10, endMin: 0,  type: 'meeting'  },
    { id: 9,  title: 'Project Kickoff',         date: new Date(2026, 2, 9),  startHour: 13, startMin: 0,  endHour: 14, endMin: 0,  type: 'meeting'  },
    { id: 10, title: 'Architecture Review',     date: new Date(2026, 2, 9),  startHour: 15, startMin: 0,  endHour: 16, endMin: 0,  type: 'review'   },
    // Mar 10
    { id: 11, title: 'All Hands Meeting',       date: new Date(2026, 2, 10), startHour: 10, startMin: 0,  endHour: 11, endMin: 0,  type: 'meeting'  },
    { id: 12, title: 'Mobile App Check-in',     date: new Date(2026, 2, 10), startHour: 14, startMin: 0,  endHour: 14, endMin: 30, type: 'call'     },
  ];

  private readonly CAL_FIRST_HOUR = 8;
  private readonly CAL_LAST_HOUR  = 18; // exclusive
  readonly calendarHours = Array.from({ length: this.CAL_LAST_HOUR - this.CAL_FIRST_HOUR }, (_, i) => i + this.CAL_FIRST_HOUR);

  readonly calendarBaseDate = signal(new Date());

  readonly calendarDay1 = computed(() => {
    const d = new Date(this.calendarBaseDate());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  readonly calendarDay2 = computed(() => {
    const d = new Date(this.calendarBaseDate());
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  private readonly _DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private readonly _MON_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  private calDayMeta(d: Date): { label: string; dateStr: string; dayNum: number; isToday: boolean } {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const isToday = d.getTime() === today.getTime();
    const isTomorrow = d.getTime() === tomorrow.getTime();
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : this._DAY_NAMES[d.getDay()];
    return { label, dateStr: `${this._MON_NAMES[d.getMonth()]} ${d.getDate()}`, dayNum: d.getDate(), isToday };
  }

  readonly calendarDay1Meta = computed(() => this.calDayMeta(this.calendarDay1()));
  readonly calendarDay2Meta = computed(() => this.calDayMeta(this.calendarDay2()));

  private isSameCalDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  readonly calendarDay1Appts = computed(() =>
    this.calendarAppointments
      .filter(a => this.isSameCalDay(a.date, this.calendarDay1()))
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
  );

  readonly calendarDay2Appts = computed(() =>
    this.calendarAppointments
      .filter(a => this.isSameCalDay(a.date, this.calendarDay2()))
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
  );

  readonly currentTimeTop = computed(() => {
    const now = new Date();
    const top = (now.getHours() - this.CAL_FIRST_HOUR) * 60 + now.getMinutes();
    return Math.max(0, Math.min(this.calendarHours.length * 60, top));
  });

  readonly showCurrentTimeLine = computed(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return this.isSameCalDay(this.calendarDay1(), now) || this.isSameCalDay(this.calendarDay2(), now);
  });

  apptColor(type: ApptType): string {
    return this._apptTypeColor[type];
  }

  apptTop(appt: CalendarAppointment): number {
    return (appt.startHour - this.CAL_FIRST_HOUR) * 60 + appt.startMin;
  }

  apptHeight(appt: CalendarAppointment): number {
    const mins = (appt.endHour - appt.startHour) * 60 + (appt.endMin - appt.startMin);
    return Math.max(24, mins);
  }

  formatCalHour(h: number): string {
    if (h === 12) return '12p';
    if (h === 0)  return '12a';
    return h > 12 ? `${h - 12}p` : `${h}a`;
  }

  formatApptTime(hour: number, min: number): string {
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const m = min > 0 ? `:${min.toString().padStart(2, '0')}` : '';
    return `${h}${m}${ampm}`;
  }

  prevCalendarDay(): void {
    this.calendarBaseDate.update(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }

  nextCalendarDay(): void {
    this.calendarBaseDate.update(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }

  resetCalendarToToday(): void {
    this.calendarBaseDate.set(new Date());
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

  // ── Time Off Requests ──
  readonly timeOffRequests = [
    { id: 1, name: 'Sarah Chen', initials: 'SC', type: 'Vacation', startDate: 'Mar 10', endDate: 'Mar 14', days: 5, status: 'Pending' as const },
    { id: 2, name: 'James Carter', initials: 'JC', type: 'Sick Leave', startDate: 'Mar 6', endDate: 'Mar 6', days: 1, status: 'Approved' as const },
    { id: 3, name: 'Priya Nair', initials: 'PN', type: 'Vacation', startDate: 'Mar 17', endDate: 'Mar 21', days: 5, status: 'Pending' as const },
    { id: 4, name: 'Tom Evans', initials: 'TE', type: 'Personal', startDate: 'Mar 8', endDate: 'Mar 8', days: 1, status: 'Approved' as const },
    { id: 5, name: 'Lena Brooks', initials: 'LB', type: 'Vacation', startDate: 'Apr 1', endDate: 'Apr 4', days: 4, status: 'Pending' as const },
    { id: 6, name: 'Mike Osei', initials: 'MO', type: 'Sick Leave', startDate: 'Mar 5', endDate: 'Mar 5', days: 1, status: 'Denied' as const },
  ];

  readonly pendingTimeOffCount = computed(() => this.timeOffRequests.filter(r => r.status === 'Pending').length);

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

  // Home widget heights
  readonly homeTimeOffHeight = signal(380);
  readonly homeCalendarHeight = signal(460);

  /** Render order — determines auto-flow row stacking (Projects page). */
  readonly widgetOrder = signal<DashboardWidgetId[]>(['projects', 'openEstimates', 'recentActivity', 'needsAttention']);

  /** Render order — determines auto-flow row stacking (Home page). */
  readonly homeWidgetOrder = signal<DashboardWidgetId[]>(['homeTimeOff', 'homeCalendar']);

  /** Column start (1-16) per widget. */
  readonly widgetColStarts = signal<Record<DashboardWidgetId, number>>({
    projects: 1, openEstimates: 1, recentActivity: 1, needsAttention: 13, timeOff: 1,
    homeTimeOff: 1, homeCalendar: 9,
  });

  /** Column span (1-16) per widget. */
  readonly widgetColSpans = signal<Record<DashboardWidgetId, number>>({
    projects: 16, openEstimates: 16, recentActivity: 12, needsAttention: 4, timeOff: 8,
    homeTimeOff: 8, homeCalendar: 8,
  });

  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');
  private readonly homeGridContainerRef = viewChild<ElementRef>('homeWidgetGrid');

  // ── Drag-to-move ──

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);

  private _moveTarget: DashboardWidgetId | null = null;
  private _activeGrid: 'home' | 'projects' = 'projects';
  private _dragAxis: 'h' | 'v' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;

  private get activeGridEl(): HTMLElement | undefined {
    const ref = this._activeGrid === 'home' ? this.homeGridContainerRef() : this.gridContainerRef();
    return ref?.nativeElement as HTMLElement | undefined;
  }

  private get activeOrder(): DashboardWidgetId[] {
    return this._activeGrid === 'home' ? this.homeWidgetOrder() : this.widgetOrder();
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent, grid: 'home' | 'projects' = 'projects'): void {
    event.preventDefault();
    this._moveTarget = id;
    this._activeGrid = grid;
    this._dragAxis = null;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this.moveTargetId.set(id);
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.activeGridEl;
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
      const order = this.activeOrder;
      const orderSignal = this._activeGrid === 'home' ? this.homeWidgetOrder : this.widgetOrder;
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
        orderSignal.update(ord => {
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

  private readonly _heightGetMap: Partial<Record<DashboardWidgetId, () => number>> = {
    openEstimates: () => this.estimatesHeight(),
    recentActivity: () => this.activityHeight(),
    needsAttention: () => this.attentionHeight(),
    homeTimeOff: () => this.homeTimeOffHeight(),
    homeCalendar: () => this.homeCalendarHeight(),
  };

  private readonly _heightSetMap: Partial<Record<DashboardWidgetId, (h: number) => void>> = {
    openEstimates: h => this.estimatesHeight.set(h),
    recentActivity: h => this.activityHeight.set(h),
    needsAttention: h => this.attentionHeight.set(h),
    homeTimeOff: h => this.homeTimeOffHeight.set(h),
    homeCalendar: h => this.homeCalendarHeight.set(h),
  };

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, grid: 'home' | 'projects' = 'projects'): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = dir;
    this._activeGrid = grid;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this._heightGetMap[target as DashboardWidgetId]?.() ?? 300;
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartColSpan = this.widgetColSpans()[target as DashboardWidgetId] ?? 8;
      this._gridContainerWidth = this.activeGridEl?.offsetWidth ?? 1200;
    }
  }

  // ── Unified document mouse handlers ──

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const newH = Math.max(120, this._resizeStartH + (event.clientY - this._resizeStartY));
        this._heightSetMap[this._resizeTarget as DashboardWidgetId]?.(newH);
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const colW = this._gridContainerWidth / 16;
        const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
        const newSpan = this._resizeStartColSpan + deltaSpan;
        const id = this._resizeTarget as DashboardWidgetId;
        const minSpan = id === 'needsAttention' ? 3 : 4;
        const clampedSpan = Math.max(minSpan, Math.min(16, newSpan));
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
