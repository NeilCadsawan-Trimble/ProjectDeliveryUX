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
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { ModusIconComponent } from '../../components/modus-icon.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
type DashboardWidgetId = 'projects' | 'openEstimates' | 'recentActivity' | 'needsAttention' | 'timeOff' | 'homeTimeOff' | 'homeCalendar' | 'homeRfis' | 'homeSubmittals' | 'finBudgetByProject';

type GridPage = 'home' | 'projects' | 'financials';

type RfiStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
interface Rfi {
  id: string;
  number: string;
  subject: string;
  project: string;
  assignee: string;
  status: RfiStatus;
  dueDate: string;
}

type SubmittalStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
interface Submittal {
  id: string;
  number: string;
  subject: string;
  project: string;
  assignee: string;
  status: SubmittalStatus;
  dueDate: string;
}

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
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, ModusButtonComponent, ModusUtilityPanelComponent, ModusIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-screen overflow-hidden',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchmove)': 'onDocumentTouchMove($event)',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  template: `
    <svg aria-hidden="true" class="svg-defs-hidden">
      <defs>
        <linearGradient id="ai-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="20%" stop-color="#FF00FF" />
          <stop offset="60%" stop-color="#0066CC" />
          <stop offset="100%" stop-color="#0066CC" />
        </linearGradient>
        <radialGradient id="ai-grad-dark" cx="18%" cy="18%" r="70%">
          <stop offset="0%" stop-color="#FF00FF" />
          <stop offset="50%" stop-color="#9933FF" />
          <stop offset="100%" stop-color="#0066CC" />
        </radialGradient>
      </defs>
    </svg>
    <div class="skip-nav" tabindex="0" role="link" (click)="focusMain()" (keydown.enter)="focusMain()">Skip to main content</div>
    <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <!-- Navbar -->
      <modus-navbar
        [userCard]="userCard"
        [visibility]="navbarVisibility()"
        [searchInputOpen]="searchInputOpen()"
        (searchClick)="searchInputOpen.set(!searchInputOpen())"
        (searchInputOpenChange)="searchInputOpen.set($event)"
      >
        <div slot="start" class="flex items-center gap-3">
          <div class="w-px h-5 bg-foreground-20"></div>
          <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide">Project Delivery</div>
        </div>
        <div slot="end" class="flex items-center gap-2">
          @if (!isMobile()) {
            <!-- AI Assistant toggle (desktop) -->
            <div
              class="{{ aiNavButtonClass() }}"
              (click)="toggleAiPanel()"
              [title]="aiPanelOpen() ? 'Close AI Assistant' : 'Open Trimble AI Assistant'"
              role="button"
              [attr.aria-label]="aiPanelOpen() ? 'Close AI Assistant' : 'Open Trimble AI Assistant'"
              [attr.aria-expanded]="aiPanelOpen()"
            >
              <svg class="ai-icon-nav" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg">
                @if (aiPanelOpen() || isDark()) {
                  <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34zm199.83-634.65-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97m403.73 374.35c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16m45.08-114.58c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2" fill="#fff"/>
                  <path d="m320.13 489.53c0 142.28 115.34 257.62 257.62 257.62s257.62-115.34 257.62-257.62-115.34-257.62-257.62-257.62-257.62 115.34-257.62 257.62" fill="url(#ai-grad-dark)" transform="translate(-256, 0)"/>
                } @else {
                  <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                  <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                  <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                  <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
                }
              </svg>
              @if (aiMessages().length > 0 && !aiPanelOpen()) {
                <div class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary border-2 border-background"></div>
              }
            </div>
            <!-- Dark mode toggle (desktop) -->
            <div
              class="navbar-icon-btn"
              (click)="toggleDarkMode()"
              (keydown.enter)="toggleDarkMode()"
              (keydown.space)="$event.preventDefault(); toggleDarkMode()"
              [title]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
              role="button"
              tabindex="0"
              [attr.aria-label]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            >
              <i class="modus-icons text-xl" aria-hidden="true">{{ isDark() ? 'brightness' : 'moon' }}</i>
            </div>
          }
          @if (isMobile()) {
            <!-- More menu button (mobile only) -->
            <div class="relative">
              <div
                class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                (click)="toggleMoreMenu()"
                role="button"
                aria-label="More options"
                [attr.aria-expanded]="moreMenuOpen()"
              >
                <i class="modus-icons text-xl" aria-hidden="true">more_vertical</i>
              </div>
              @if (moreMenuOpen()) {
                <div class="navbar-more-dropdown" role="menu" (keydown.escape)="closeMoreMenu()">
                  <div class="navbar-more-item" role="menuitem" tabindex="0" (click)="moreMenuAction('search')" (keydown.enter)="moreMenuAction('search')">
                    <i class="modus-icons text-lg" aria-hidden="true">search</i>
                    <div>Search</div>
                  </div>
                  <div class="navbar-more-item" role="menuitem" tabindex="0" (click)="moreMenuAction('notifications')" (keydown.enter)="moreMenuAction('notifications')">
                    <i class="modus-icons text-lg" aria-hidden="true">notifications</i>
                    <div>Notifications</div>
                  </div>
                  <div class="navbar-more-item" role="menuitem" tabindex="0" (click)="moreMenuAction('help')" (keydown.enter)="moreMenuAction('help')">
                    <i class="modus-icons text-lg" aria-hidden="true">help</i>
                    <div>Help</div>
                  </div>
                  <div class="navbar-more-item" role="menuitem" tabindex="0" (click)="moreMenuAction('ai')" (keydown.enter)="moreMenuAction('ai')">
                    <svg class="ai-icon-menu" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                      <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                      <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                      <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
                    </svg>
                    <div>AI Assistant</div>
                  </div>
                  <div class="navbar-more-item" role="menuitem" tabindex="0" (click)="moreMenuAction('darkmode')" (keydown.enter)="moreMenuAction('darkmode')">
                    <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'brightness' : 'moon' }}</i>
                    <div>{{ isDark() ? 'Light Mode' : 'Dark Mode' }}</div>
                  </div>
                </div>
                <div class="navbar-more-backdrop" role="button" tabindex="-1" aria-label="Close menu" (click)="closeMoreMenu()"></div>
              }
            </div>
          }
        </div>
      </modus-navbar>

      <div class="navbar-shadow"></div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Main content -->
        <div class="flex-1 overflow-auto bg-background md:pl-14" role="main" id="main-content" tabindex="-1">

          @switch (activeNav()) {
            @case ('home') {
              <div class="p-6 max-w-screen-xl mx-auto">
                <!-- Page header -->
                <div class="flex items-start justify-between mb-6">
                  <div>
                    <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome back, Alex</div>
                    <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
                  </div>
                </div>

                <!-- KPI summary cards -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Active Projects: {{ totalProjects() }}" (click)="setActiveNav('projects')" (keydown.enter)="setActiveNav('projects')" (keydown.space)="$event.preventDefault(); setActiveNav('projects')">
                    <div class="w-12 h-12 rounded-xl bg-primary-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-primary" aria-hidden="true">briefcase</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ totalProjects() }}</div>
                      <div class="text-sm text-foreground-60">Active Projects</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Open Estimates: {{ openEstimatesCount() }}" (click)="setActiveNav('projects')" (keydown.enter)="setActiveNav('projects')" (keydown.space)="$event.preventDefault(); setActiveNav('projects')">
                    <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-warning" aria-hidden="true">description</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ openEstimatesCount() }}</div>
                      <div class="text-sm text-foreground-60">Open Estimates</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
                  </div>
                  <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Estimate Pipeline: {{ totalEstimateValue() }}" (click)="setActiveNav('financials')" (keydown.enter)="setActiveNav('financials')" (keydown.space)="$event.preventDefault(); setActiveNav('financials')">
                    <div class="w-12 h-12 rounded-xl bg-success-20 flex items-center justify-center flex-shrink-0">
                      <i class="modus-icons text-2xl text-success" aria-hidden="true">bar_graph</i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-2xl font-bold text-foreground">{{ totalEstimateValue() }}</div>
                      <div class="text-sm text-foreground-60">Estimate Pipeline</div>
                    </div>
                    <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
                  </div>
                </div>

                <!-- Home widget grid -->
                <div
                  class="grid"
                  [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
                  [style.grid-auto-rows]="'1px'"
                  [style.gap]="isMobile() ? '0' : '0 1rem'"
                  #homeWidgetGrid
                >
                  @for (widgetId of homeWidgets; track widgetId) {
                    <div
                      class="relative"
                      [class.overflow-hidden]="isMobile()"
                      [attr.data-widget-id]="widgetId"
                      [style.grid-column]="isMobile() ? '1 / -1' : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
                      [style.grid-row]="(widgetTops()[widgetId] + 1) + ' / span ' + widgetHeights()[widgetId]"
                    >
                      <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">

                        @if (widgetId === 'homeTimeOff') {
                          <!-- ─── Time Off Requests Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                              (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                                <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Time Off Requests</div>
                                @if (pendingTimeOffCount() > 0) {
                                  <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                                    <div class="text-xs font-medium text-warning">{{ pendingTimeOffCount() }} pending</div>
                                  </div>
                                }
                              </div>
                              <!-- View toggle — stop drag propagation -->
                              <div
                                class="flex items-center rounded-lg border-default overflow-hidden flex-shrink-0"
                                role="tablist"
                                aria-label="Time off view"
                                (mousedown)="$event.stopPropagation()"
                              >
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="timeOffView() === 'list'"
                                  [class.text-primary-foreground]="timeOffView() === 'list'"
                                  [class.text-foreground-60]="timeOffView() !== 'list'"
                                  role="tab"
                                  tabindex="0"
                                  [attr.aria-selected]="timeOffView() === 'list'"
                                  (click)="timeOffView.set('list')"
                                  (keydown.enter)="timeOffView.set('list')"
                                  (keydown.space)="$event.preventDefault(); timeOffView.set('list')"
                                >
                                  <i class="modus-icons text-sm" aria-hidden="true">list_bulleted</i>
                                  <div>List</div>
                                </div>
                                <div class="w-px h-5 bg-muted flex-shrink-0" aria-hidden="true"></div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="timeOffView() === 'calendar'"
                                  [class.text-primary-foreground]="timeOffView() === 'calendar'"
                                  [class.text-foreground-60]="timeOffView() !== 'calendar'"
                                  role="tab"
                                  tabindex="0"
                                  [attr.aria-selected]="timeOffView() === 'calendar'"
                                  (click)="timeOffView.set('calendar')"
                                  (keydown.enter)="timeOffView.set('calendar')"
                                  (keydown.space)="$event.preventDefault(); timeOffView.set('calendar')"
                                >
                                  <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                                  <div>Calendar</div>
                                </div>
                              </div>
                            </div>

                            <!-- List view -->
                            @if (timeOffView() === 'list') {
                              <div class="overflow-y-auto flex-1" role="table" aria-label="Time off requests">
                                <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
                                  <div role="columnheader">Employee</div>
                                  <div role="columnheader">Type</div>
                                  <div role="columnheader">Dates</div>
                                  <div role="columnheader">Days</div>
                                  <div role="columnheader">Status</div>
                                </div>
                                @for (req of timeOffRequests; track req.id) {
                                  <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                                    <div class="flex items-center gap-2" role="cell">
                                      <div class="w-7 h-7 rounded-full bg-primary-20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                        {{ req.initials }}
                                      </div>
                                      <div class="text-sm font-medium text-foreground truncate">{{ req.name }}</div>
                                    </div>
                                    <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block w-fit" role="cell">{{ req.type }}</div>
                                    <div class="text-sm text-foreground-80" role="cell">{{ req.startDate }}@if (req.startDate !== req.endDate) { – {{ req.endDate }}}</div>
                                    <div class="text-sm text-foreground-60" role="cell">{{ req.days }}d</div>
                                    <div role="cell">
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
                              <div class="flex flex-col flex-1">
                                <!-- Month navigation -->
                                <div class="flex items-center justify-between px-5 py-3 border-bottom-default flex-shrink-0" (mousedown)="$event.stopPropagation()">
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                    role="button"
                                    tabindex="0"
                                    aria-label="Previous month"
                                    (click)="prevCalendarMonth()"
                                    (keydown.enter)="prevCalendarMonth()"
                                    (keydown.space)="$event.preventDefault(); prevCalendarMonth()"
                                  >
                                    <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">chevron_left</i>
                                  </div>
                                  <div class="text-sm font-semibold text-foreground" aria-live="polite">{{ calendarMonthLabel() }}</div>
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                    role="button"
                                    tabindex="0"
                                    aria-label="Next month"
                                    (click)="nextCalendarMonth()"
                                    (keydown.enter)="nextCalendarMonth()"
                                    (keydown.space)="$event.preventDefault(); nextCalendarMonth()"
                                  >
                                    <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">chevron_right</i>
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
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                            [class.cursor-nwse-resize]="!isMobile()"
                            [class.cursor-ns-resize]="isMobile()"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
                            (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
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
                        @else if (widgetId === 'homeCalendar') {
                          <!-- ─── Two-Day Calendar Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                              (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                                <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Calendar</div>
                                <div class="text-xs text-foreground-40">{{ calendarDay1Meta().dateStr }} – {{ calendarDay2Meta().dateStr }}</div>
                              </div>
                              <!-- Navigation — stop drag propagation -->
                              <div class="flex items-center gap-1" (mousedown)="$event.stopPropagation()">
                                <div
                                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Previous day"
                                  (click)="prevCalendarDay()"
                                  (keydown.enter)="prevCalendarDay()"
                                  (keydown.space)="$event.preventDefault(); prevCalendarDay()"
                                >
                                  <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">chevron_left</i>
                                </div>
                                <div
                                  class="px-2 py-1 text-xs font-medium text-primary cursor-pointer hover:bg-primary-20 rounded transition-colors duration-150 select-none"
                                  role="button" tabindex="0" aria-label="Go to today"
                                  (click)="resetCalendarToToday()"
                                  (keydown.enter)="resetCalendarToToday()"
                                  (keydown.space)="$event.preventDefault(); resetCalendarToToday()"
                                >Today</div>
                                <div
                                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Next day"
                                  (click)="nextCalendarDay()"
                                  (keydown.enter)="nextCalendarDay()"
                                  (keydown.space)="$event.preventDefault(); nextCalendarDay()"
                                >
                                  <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">chevron_right</i>
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
                            <div class="flex overflow-y-auto flex-1">

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
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                            [class.cursor-nwse-resize]="!isMobile()"
                            [class.cursor-ns-resize]="isMobile()"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
                            (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
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

                        @else if (widgetId === 'homeRfis') {
                          <!-- ─── RFIs Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                              (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                @if (isMobile() && rfiMobileExpanded()) {
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150 -ml-1 mr-1"
                                    role="button" tabindex="0" aria-label="Back to RFI summary"
                                    (click)="$event.stopPropagation(); collapseRfiMobile()"
                                    (mousedown)="$event.stopPropagation()"
                                    (touchstart)="$event.stopPropagation()"
                                    (keydown.enter)="collapseRfiMobile()"
                                    (keydown.space)="$event.preventDefault(); collapseRfiMobile()"
                                  >
                                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">arrow_left</i>
                                  </div>
                                } @else {
                                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                                }
                                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">clipboard</i>
                                <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">RFIs</div>
                                @if (rfiCounts().overdue > 0) {
                                  <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                                    <div class="text-xs font-medium text-destructive">{{ rfiCounts().overdue }} overdue</div>
                                  </div>
                                }
                              </div>
                            </div>

                            @if (isMobile() && !rfiMobileExpanded()) {
                              <!-- Mobile compact KPI list -->
                              <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="All RFIs: {{ rfiCounts().all }}"
                                  (click)="expandRfiMobile('all')"
                                  (keydown.enter)="expandRfiMobile('all')"
                                  (keydown.space)="$event.preventDefault(); expandRfiMobile('all')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-primary" aria-hidden="true">clipboard</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">All RFIs</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ rfiCounts().all }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Open RFIs: {{ rfiCounts().open }}"
                                  (click)="expandRfiMobile('open')"
                                  (keydown.enter)="expandRfiMobile('open')"
                                  (keydown.space)="$event.preventDefault(); expandRfiMobile('open')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-primary" aria-hidden="true">clipboard</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Open</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ rfiCounts().open }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Overdue RFIs: {{ rfiCounts().overdue }}"
                                  (click)="expandRfiMobile('overdue')"
                                  (keydown.enter)="expandRfiMobile('overdue')"
                                  (keydown.space)="$event.preventDefault(); expandRfiMobile('overdue')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-destructive-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-destructive" aria-hidden="true">warning</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Overdue</div>
                                  </div>
                                  <div class="text-lg font-bold text-destructive">{{ rfiCounts().overdue }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Upcoming RFIs: {{ rfiCounts().upcoming }}"
                                  (click)="expandRfiMobile('upcoming')"
                                  (keydown.enter)="expandRfiMobile('upcoming')"
                                  (keydown.space)="$event.preventDefault(); expandRfiMobile('upcoming')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-warning-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-warning" aria-hidden="true">clock</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Upcoming</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ rfiCounts().upcoming }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Closed RFIs: {{ rfiCounts().closed }}"
                                  (click)="expandRfiMobile('closed')"
                                  (keydown.enter)="expandRfiMobile('closed')"
                                  (keydown.space)="$event.preventDefault(); expandRfiMobile('closed')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-success-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-success" aria-hidden="true">check_circle</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Closed</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ rfiCounts().closed }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                              </div>
                            } @else {
                              <!-- Desktop / Mobile-expanded: filter pills + table -->

                              <!-- KPI filter pills -->
                              <div
                                class="flex items-center gap-2 px-5 py-3 border-bottom-default flex-shrink-0 overflow-x-auto"
                                role="radiogroup" aria-label="Filter RFIs by status"
                                (mousedown)="$event.stopPropagation()"
                              >
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="rfiActiveFilter() === 'all'" [class.text-primary-foreground]="rfiActiveFilter() === 'all'"
                                  [class.bg-muted]="rfiActiveFilter() !== 'all'" [class.text-foreground-60]="rfiActiveFilter() !== 'all'"
                                  role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === 'all'"
                                  (click)="rfiActiveFilter.set('all')" (keydown.enter)="rfiActiveFilter.set('all')" (keydown.space)="$event.preventDefault(); rfiActiveFilter.set('all')"
                                >
                                  <div>All</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-primary-foreground]="rfiActiveFilter() === 'all'" [class.text-primary]="rfiActiveFilter() === 'all'"
                                    [class.bg-secondary]="rfiActiveFilter() !== 'all'" [class.text-foreground-60]="rfiActiveFilter() !== 'all'"
                                    aria-hidden="true"
                                  >{{ rfiCounts().all }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="rfiActiveFilter() === 'open'" [class.text-primary-foreground]="rfiActiveFilter() === 'open'"
                                  [class.bg-muted]="rfiActiveFilter() !== 'open'" [class.text-foreground-60]="rfiActiveFilter() !== 'open'"
                                  role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === 'open'"
                                  (click)="rfiActiveFilter.set('open')" (keydown.enter)="rfiActiveFilter.set('open')" (keydown.space)="$event.preventDefault(); rfiActiveFilter.set('open')"
                                >
                                  <div>Open</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-primary-foreground]="rfiActiveFilter() === 'open'" [class.text-primary]="rfiActiveFilter() === 'open'"
                                    [class.bg-secondary]="rfiActiveFilter() !== 'open'" [class.text-foreground-60]="rfiActiveFilter() !== 'open'"
                                    aria-hidden="true"
                                  >{{ rfiCounts().open }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-destructive]="rfiActiveFilter() === 'overdue'" [class.text-destructive-foreground]="rfiActiveFilter() === 'overdue'"
                                  [class.bg-muted]="rfiActiveFilter() !== 'overdue'" [class.text-foreground-60]="rfiActiveFilter() !== 'overdue'"
                                  role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === 'overdue'"
                                  (click)="rfiActiveFilter.set('overdue')" (keydown.enter)="rfiActiveFilter.set('overdue')" (keydown.space)="$event.preventDefault(); rfiActiveFilter.set('overdue')"
                                >
                                  <div>Overdue</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-destructive-foreground]="rfiActiveFilter() === 'overdue'" [class.text-destructive]="rfiActiveFilter() === 'overdue'"
                                    [class.bg-secondary]="rfiActiveFilter() !== 'overdue'" [class.text-foreground-60]="rfiActiveFilter() !== 'overdue'"
                                    aria-hidden="true"
                                  >{{ rfiCounts().overdue }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-warning]="rfiActiveFilter() === 'upcoming'" [class.text-warning-foreground]="rfiActiveFilter() === 'upcoming'"
                                  [class.bg-muted]="rfiActiveFilter() !== 'upcoming'" [class.text-foreground-60]="rfiActiveFilter() !== 'upcoming'"
                                  role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === 'upcoming'"
                                  (click)="rfiActiveFilter.set('upcoming')" (keydown.enter)="rfiActiveFilter.set('upcoming')" (keydown.space)="$event.preventDefault(); rfiActiveFilter.set('upcoming')"
                                >
                                  <div>Upcoming</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-warning-foreground]="rfiActiveFilter() === 'upcoming'" [class.text-warning]="rfiActiveFilter() === 'upcoming'"
                                    [class.bg-secondary]="rfiActiveFilter() !== 'upcoming'" [class.text-foreground-60]="rfiActiveFilter() !== 'upcoming'"
                                    aria-hidden="true"
                                  >{{ rfiCounts().upcoming }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-success]="rfiActiveFilter() === 'closed'" [class.text-success-foreground]="rfiActiveFilter() === 'closed'"
                                  [class.bg-muted]="rfiActiveFilter() !== 'closed'" [class.text-foreground-60]="rfiActiveFilter() !== 'closed'"
                                  role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === 'closed'"
                                  (click)="rfiActiveFilter.set('closed')" (keydown.enter)="rfiActiveFilter.set('closed')" (keydown.space)="$event.preventDefault(); rfiActiveFilter.set('closed')"
                                >
                                  <div>Closed</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-success-foreground]="rfiActiveFilter() === 'closed'" [class.text-success]="rfiActiveFilter() === 'closed'"
                                    [class.bg-secondary]="rfiActiveFilter() !== 'closed'" [class.text-foreground-60]="rfiActiveFilter() !== 'closed'"
                                    aria-hidden="true"
                                  >{{ rfiCounts().closed }}</div>
                                </div>
                              </div>

                              <!-- Table header -->
                              <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                                <div role="columnheader">RFI #</div>
                                <div role="columnheader">Subject</div>
                                <div role="columnheader">Project</div>
                                <div role="columnheader">Assignee</div>
                                <div role="columnheader">Due</div>
                                <div role="columnheader">Status</div>
                              </div>

                              <!-- Table body -->
                              <div class="overflow-y-auto flex-1" role="table" aria-label="RFIs" aria-live="polite">
                                @for (rfi of filteredRfis(); track rfi.id) {
                                  <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                                    <div class="text-sm font-medium text-primary" role="cell">{{ rfi.number }}</div>
                                    <div class="text-sm text-foreground truncate" role="cell">{{ rfi.subject }}</div>
                                    <div class="text-sm text-foreground-60 truncate" role="cell">{{ rfi.project }}</div>
                                    <div class="text-sm text-foreground-60" role="cell">{{ rfi.assignee }}</div>
                                    <div class="text-sm text-foreground-60" role="cell">{{ rfi.dueDate }}</div>
                                    <div class="flex items-center gap-1.5" role="cell">
                                      <div class="w-2 h-2 rounded-full {{ rfiStatusColor(rfi.status) }}" aria-hidden="true"></div>
                                      <div class="text-xs font-medium text-foreground-60">{{ rfiStatusLabel(rfi.status) }}</div>
                                    </div>
                                  </div>
                                } @empty {
                                  <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                                    <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                                    <div class="text-sm">No RFIs match this filter</div>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                          <!-- Corner resize handle -->
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                            [class.cursor-nwse-resize]="!isMobile()"
                            [class.cursor-ns-resize]="isMobile()"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
                            (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
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

                        @else if (widgetId === 'homeSubmittals') {
                          <!-- ─── Submittals Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                              (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                            >
                              <div class="flex items-center gap-2">
                                @if (isMobile() && submittalMobileExpanded()) {
                                  <div
                                    class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150 -ml-1 mr-1"
                                    role="button" tabindex="0" aria-label="Back to Submittal summary"
                                    (click)="$event.stopPropagation(); collapseSubmittalMobile()"
                                    (mousedown)="$event.stopPropagation()"
                                    (touchstart)="$event.stopPropagation()"
                                    (keydown.enter)="collapseSubmittalMobile()"
                                    (keydown.space)="$event.preventDefault(); collapseSubmittalMobile()"
                                  >
                                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">arrow_left</i>
                                  </div>
                                } @else {
                                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                                }
                                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
                                <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Submittals</div>
                                @if (submittalCounts().overdue > 0) {
                                  <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                                    <div class="text-xs font-medium text-destructive">{{ submittalCounts().overdue }} overdue</div>
                                  </div>
                                }
                              </div>
                            </div>

                            @if (isMobile() && !submittalMobileExpanded()) {
                              <!-- Mobile compact KPI list -->
                              <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="All Submittals: {{ submittalCounts().all }}"
                                  (click)="expandSubmittalMobile('all')"
                                  (keydown.enter)="expandSubmittalMobile('all')"
                                  (keydown.space)="$event.preventDefault(); expandSubmittalMobile('all')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-primary" aria-hidden="true">document</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">All Submittals</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ submittalCounts().all }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Open Submittals: {{ submittalCounts().open }}"
                                  (click)="expandSubmittalMobile('open')"
                                  (keydown.enter)="expandSubmittalMobile('open')"
                                  (keydown.space)="$event.preventDefault(); expandSubmittalMobile('open')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-primary" aria-hidden="true">document</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Open</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ submittalCounts().open }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Overdue Submittals: {{ submittalCounts().overdue }}"
                                  (click)="expandSubmittalMobile('overdue')"
                                  (keydown.enter)="expandSubmittalMobile('overdue')"
                                  (keydown.space)="$event.preventDefault(); expandSubmittalMobile('overdue')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-destructive-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-destructive" aria-hidden="true">warning</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Overdue</div>
                                  </div>
                                  <div class="text-lg font-bold text-destructive">{{ submittalCounts().overdue }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Upcoming Submittals: {{ submittalCounts().upcoming }}"
                                  (click)="expandSubmittalMobile('upcoming')"
                                  (keydown.enter)="expandSubmittalMobile('upcoming')"
                                  (keydown.space)="$event.preventDefault(); expandSubmittalMobile('upcoming')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-warning-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-warning" aria-hidden="true">clock</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Upcoming</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ submittalCounts().upcoming }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                                <div
                                  class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                                  role="button" tabindex="0" aria-label="Closed Submittals: {{ submittalCounts().closed }}"
                                  (click)="expandSubmittalMobile('closed')"
                                  (keydown.enter)="expandSubmittalMobile('closed')"
                                  (keydown.space)="$event.preventDefault(); expandSubmittalMobile('closed')"
                                >
                                  <div class="w-8 h-8 rounded-lg bg-success-20 flex items-center justify-center flex-shrink-0">
                                    <i class="modus-icons text-base text-success" aria-hidden="true">check_circle</i>
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class="text-xs text-foreground-60">Closed</div>
                                  </div>
                                  <div class="text-lg font-bold text-foreground">{{ submittalCounts().closed }}</div>
                                  <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                                </div>
                              </div>
                            } @else {
                              <!-- Desktop / Mobile-expanded: filter pills + table -->

                              <!-- KPI filter pills -->
                              <div
                                class="flex items-center gap-2 px-5 py-3 border-bottom-default flex-shrink-0 overflow-x-auto"
                                role="radiogroup" aria-label="Filter Submittals by status"
                                (mousedown)="$event.stopPropagation()"
                              >
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="submittalActiveFilter() === 'all'"
                                  [class.text-primary-foreground]="submittalActiveFilter() === 'all'"
                                  [class.bg-muted]="submittalActiveFilter() !== 'all'"
                                  [class.text-foreground-60]="submittalActiveFilter() !== 'all'"
                                  role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === 'all'"
                                  (click)="submittalActiveFilter.set('all')" (keydown.enter)="submittalActiveFilter.set('all')" (keydown.space)="$event.preventDefault(); submittalActiveFilter.set('all')"
                                >
                                  <div>All</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-primary-foreground]="submittalActiveFilter() === 'all'"
                                    [class.text-primary]="submittalActiveFilter() === 'all'"
                                    [class.bg-secondary]="submittalActiveFilter() !== 'all'"
                                    [class.text-foreground-60]="submittalActiveFilter() !== 'all'"
                                    aria-hidden="true"
                                  >{{ submittalCounts().all }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-primary]="submittalActiveFilter() === 'open'"
                                  [class.text-primary-foreground]="submittalActiveFilter() === 'open'"
                                  [class.bg-muted]="submittalActiveFilter() !== 'open'"
                                  [class.text-foreground-60]="submittalActiveFilter() !== 'open'"
                                  role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === 'open'"
                                  (click)="submittalActiveFilter.set('open')" (keydown.enter)="submittalActiveFilter.set('open')" (keydown.space)="$event.preventDefault(); submittalActiveFilter.set('open')"
                                >
                                  <div>Open</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-primary-foreground]="submittalActiveFilter() === 'open'"
                                    [class.text-primary]="submittalActiveFilter() === 'open'"
                                    [class.bg-secondary]="submittalActiveFilter() !== 'open'"
                                    [class.text-foreground-60]="submittalActiveFilter() !== 'open'"
                                    aria-hidden="true"
                                  >{{ submittalCounts().open }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-destructive]="submittalActiveFilter() === 'overdue'"
                                  [class.text-destructive-foreground]="submittalActiveFilter() === 'overdue'"
                                  [class.bg-muted]="submittalActiveFilter() !== 'overdue'"
                                  [class.text-foreground-60]="submittalActiveFilter() !== 'overdue'"
                                  role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === 'overdue'"
                                  (click)="submittalActiveFilter.set('overdue')" (keydown.enter)="submittalActiveFilter.set('overdue')" (keydown.space)="$event.preventDefault(); submittalActiveFilter.set('overdue')"
                                >
                                  <div>Overdue</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-destructive-foreground]="submittalActiveFilter() === 'overdue'"
                                    [class.text-destructive]="submittalActiveFilter() === 'overdue'"
                                    [class.bg-secondary]="submittalActiveFilter() !== 'overdue'"
                                    [class.text-foreground-60]="submittalActiveFilter() !== 'overdue'"
                                    aria-hidden="true"
                                  >{{ submittalCounts().overdue }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-warning]="submittalActiveFilter() === 'upcoming'"
                                  [class.text-warning-foreground]="submittalActiveFilter() === 'upcoming'"
                                  [class.bg-muted]="submittalActiveFilter() !== 'upcoming'"
                                  [class.text-foreground-60]="submittalActiveFilter() !== 'upcoming'"
                                  role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === 'upcoming'"
                                  (click)="submittalActiveFilter.set('upcoming')" (keydown.enter)="submittalActiveFilter.set('upcoming')" (keydown.space)="$event.preventDefault(); submittalActiveFilter.set('upcoming')"
                                >
                                  <div>Upcoming</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-warning-foreground]="submittalActiveFilter() === 'upcoming'"
                                    [class.text-warning]="submittalActiveFilter() === 'upcoming'"
                                    [class.bg-secondary]="submittalActiveFilter() !== 'upcoming'"
                                    [class.text-foreground-60]="submittalActiveFilter() !== 'upcoming'"
                                    aria-hidden="true"
                                  >{{ submittalCounts().upcoming }}</div>
                                </div>
                                <div
                                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                                  [class.bg-success]="submittalActiveFilter() === 'closed'"
                                  [class.text-success-foreground]="submittalActiveFilter() === 'closed'"
                                  [class.bg-muted]="submittalActiveFilter() !== 'closed'"
                                  [class.text-foreground-60]="submittalActiveFilter() !== 'closed'"
                                  role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === 'closed'"
                                  (click)="submittalActiveFilter.set('closed')" (keydown.enter)="submittalActiveFilter.set('closed')" (keydown.space)="$event.preventDefault(); submittalActiveFilter.set('closed')"
                                >
                                  <div>Closed</div>
                                  <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                                    [class.bg-success-foreground]="submittalActiveFilter() === 'closed'"
                                    [class.text-success]="submittalActiveFilter() === 'closed'"
                                    [class.bg-secondary]="submittalActiveFilter() !== 'closed'"
                                    [class.text-foreground-60]="submittalActiveFilter() !== 'closed'"
                                    aria-hidden="true"
                                  >{{ submittalCounts().closed }}</div>
                                </div>
                              </div>

                              <!-- Table header -->
                              <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                                <div role="columnheader">Sub #</div>
                                <div role="columnheader">Subject</div>
                                <div role="columnheader">Project</div>
                                <div role="columnheader">Assignee</div>
                                <div role="columnheader">Due</div>
                                <div role="columnheader">Status</div>
                              </div>

                              <!-- Table body -->
                              <div class="overflow-y-auto flex-1" role="table" aria-label="Submittals" aria-live="polite">
                                @for (sub of filteredSubmittals(); track sub.id) {
                                  <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                                    <div class="text-sm font-medium text-primary" role="cell">{{ sub.number }}</div>
                                    <div class="text-sm text-foreground truncate" role="cell">{{ sub.subject }}</div>
                                    <div class="text-sm text-foreground-60 truncate" role="cell">{{ sub.project }}</div>
                                    <div class="text-sm text-foreground-60" role="cell">{{ sub.assignee }}</div>
                                    <div class="text-sm text-foreground-60" role="cell">{{ sub.dueDate }}</div>
                                    <div class="flex items-center gap-1.5" role="cell">
                                      <div class="w-2 h-2 rounded-full {{ submittalStatusColor(sub.status) }}" aria-hidden="true"></div>
                                      <div class="text-xs font-medium text-foreground-60">{{ submittalStatusLabel(sub.status) }}</div>
                                    </div>
                                  </div>
                                } @empty {
                                  <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                                    <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                                    <div class="text-sm">No submittals match this filter</div>
                                  </div>
                                }
                              </div>
                            }
                          </div>
                          <!-- Corner resize handle -->
                          <div
                            class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                            [class.cursor-nwse-resize]="!isMobile()"
                            [class.cursor-ns-resize]="isMobile()"
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'home')"
                            (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
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
            }<!-- end @case('home') -->

            @case ('projects') {

          <!-- ─── Projects dashboard ─── -->
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

            <!-- KPI cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Active Projects</div>
                  <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center">
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">briefcase</i>
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
                    <i class="modus-icons text-lg text-success" aria-hidden="true">check_circle</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-success">{{ onSchedulePct() }}%</div>
                <div class="text-xs text-foreground-60">{{ onTrackCount() }} of {{ totalProjects() }} projects</div>
              </div>

              <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Open Estimates</div>
                  <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
                    <i class="modus-icons text-lg text-warning" aria-hidden="true">description</i>
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
                    <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payment_instant</i>
                  </div>
                </div>
                <div class="text-4xl font-bold text-foreground">{{ totalEstimateValue() }}</div>
                <div class="text-xs text-foreground-60">Total open estimate value</div>
              </div>

            </div>

            <!-- Widget area: 16-column grid layout -->
            <div
              class="grid mb-6"
              [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
              [style.grid-auto-rows]="'1px'"
              [style.gap]="isMobile() ? '0' : '0 1rem'"
              #widgetGrid
            >

              @for (widgetId of projectWidgets; track widgetId) {

              <div
                class="relative"
                [class.overflow-hidden]="isMobile()"
                [attr.data-widget-id]="widgetId"
                [style.grid-column]="isMobile() ? '1 / -1' : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
                [style.grid-row]="(widgetTops()[widgetId] + 1) + ' / span ' + widgetHeights()[widgetId]"
              >
                <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">

                @if (widgetId === 'projects') {
              <!-- ─── Projects Widget ─── -->
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <!-- Draggable header (sticky) -->
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                  (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
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
                <!-- Card grid (scrollable) -->
                <div class="p-4 overflow-y-auto flex-1 min-h-0">
                  <div class="grid grid-cols-1 xl:grid-cols-4 gap-3">
                    @for (project of projects(); track project.id) {
                      <div
                        class="bg-background border-default rounded-lg overflow-hidden flex flex-col"
                        [class.cursor-pointer]="project.id === 1"
                        [class.hover:bg-muted]="project.id === 1"
                        [class.transition-colors]="project.id === 1"
                        [class.duration-150]="project.id === 1"
                        (click)="project.id === 1 ? navigateToProject(project.id) : null"
                        (keydown.enter)="project.id === 1 ? navigateToProject(project.id) : null"
                        [attr.role]="project.id === 1 ? 'link' : null"
                        [attr.tabindex]="project.id === 1 ? 0 : null"
                        [attr.aria-label]="project.id === 1 ? 'Open ' + project.name + ' dashboard' : null"
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
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              } @else if (widgetId === 'openEstimates') {
              <!-- ─── Open Estimates Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full" #estimatesContainer>
                <!-- Draggable header -->
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                  (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">description</i>
                    <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Open Estimates</div>
                    <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                  </div>
                </div>
                <!-- Table header -->
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
                <!-- Table rows -->
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
                <!-- Corner resize handle (width + height) -->
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
              <!-- ─── Recent Activity Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                  (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
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
                <!-- Corner resize handle (width + height) -->
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
              <!-- ─── Needs Attention Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div
                  class="flex items-center gap-2 px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                  (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                >
                  <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
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
                <!-- Corner resize handle (width + height) -->
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

              } @else if (widgetId === 'timeOff') {
              <!-- ─── Time Off Requests Widget ─── -->
              <div class="relative bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div
                  class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none"
                  (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                  (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                    <div class="text-lg font-semibold text-foreground" role="heading" aria-level="2">Time Off Requests</div>
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
                <div class="overflow-y-auto" role="table" aria-label="Time off requests">
                  <!-- Header row -->
                  <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
                    <div role="columnheader">Employee</div>
                    <div role="columnheader">Type</div>
                    <div role="columnheader">Dates</div>
                    <div role="columnheader">Days</div>
                    <div role="columnheader">Status</div>
                  </div>
                  @for (req of timeOffRequests; track req.id) {
                    <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-6 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                      <div class="flex items-center gap-2" role="cell">
                        <div class="w-7 h-7 rounded-full bg-primary-20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {{ req.initials }}
                        </div>
                        <div class="text-sm font-medium text-foreground truncate">{{ req.name }}</div>
                      </div>
                      <div role="cell" class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block w-fit">{{ req.type }}</div>
                      <div role="cell" class="text-sm text-foreground-80">{{ req.startDate }}@if (req.startDate !== req.endDate) { – {{ req.endDate }}}</div>
                      <div role="cell" class="text-sm text-foreground-60">{{ req.days }}d</div>
                      <div role="cell">
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
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group"
                  [class.cursor-nwse-resize]="!isMobile()"
                  [class.cursor-ns-resize]="isMobile()"
                  (mousedown)="startWidgetResize('timeOff', 'both', $event)"
                  (touchstart)="startWidgetResizeTouch('timeOff', 'both', $event)"
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
                  class="grid mb-6"
                  [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
                  [style.grid-auto-rows]="'1px'"
                  [style.gap]="isMobile() ? '0' : '0 1rem'"
                  #financialsWidgetGrid
                >
                  @for (widgetId of financialsWidgets; track widgetId) {
                    <div
                      class="relative"
                      [class.overflow-hidden]="isMobile()"
                      [attr.data-widget-id]="widgetId"
                      [style.grid-column]="isMobile() ? '1 / -1' : widgetColStarts()[widgetId] + ' / span ' + widgetColSpans()[widgetId]"
                      [style.grid-row]="(widgetTops()[widgetId] + 1) + ' / span ' + widgetHeights()[widgetId]"
                    >
                      <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">

                        @if (widgetId === 'finBudgetByProject') {
                          <!-- ─── Budget by Project Widget ─── -->
                          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                            <!-- Draggable header -->
                            <div
                              class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                              (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'financials')"
                              (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'financials')"
                            >
                              <div class="flex items-center gap-2">
                                <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
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
                                    <modus-progress [value]="p.budgetPct" [max]="100" size="compact" />
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
                            (mousedown)="startWidgetResize(widgetId, 'both', $event, 'financials')"
                            (touchstart)="startWidgetResizeTouch(widgetId, 'both', $event, 'financials')"
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
            }<!-- end @case('financials') -->

            @case ('settings') {
              <div class="p-6 max-w-screen-xl mx-auto">
                <div class="text-3xl font-bold text-foreground mb-2">Settings</div>
                <div class="text-sm text-foreground-60">Application settings and preferences.</div>
              </div>
            }<!-- end @case('settings') -->

          }<!-- end @switch -->

        </div>
      </div>


      <!-- Custom Side Navigation (position:fixed overlay, inside main container) -->
      @if (!isMobile() || navExpanded()) {
        <div class="custom-side-nav" [class.expanded]="navExpanded()">
          <div class="flex flex-col flex-1 min-h-0">
            @for (item of sideNavItems; track item.value) {
              <div
                class="custom-side-nav-item"
                [class.selected]="activeNav() === item.value"
                (click)="setActiveNav(item.value)"
                [title]="item.label"
                role="button"
                [attr.aria-label]="item.label"
              >
                <i class="modus-icons text-xl" aria-hidden="true">{{ item.icon }}</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">{{ item.label }}</div>
                }
              </div>
            }
          </div>
          <div class="mt-auto border-top-default">
            <div
              class="custom-side-nav-item"
              [class.selected]="activeNav() === 'settings'"
              (click)="setActiveNav('settings')"
              title="Settings"
              role="button"
              aria-label="Settings"
            >
              <i class="modus-icons text-xl" aria-hidden="true">settings</i>
              @if (navExpanded()) {
                <div class="custom-side-nav-label">Settings</div>
              }
            </div>
          </div>
        </div>
      }
      @if (navExpanded()) {
        <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
      }

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
            <svg class="ai-icon-sm" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#fff"/>
              <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#fff"/>
              <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#fff"/>
              <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="#fff"/>
            </svg>
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
          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
        </div>
      </div>

      <!-- Body -->
      <div slot="body" class="flex flex-col h-full min-h-0">

        <!-- Welcome / empty state -->
        @if (aiMessages().length === 0 && !aiThinking()) {
          <div class="flex flex-col items-center gap-4 px-4 pt-6 pb-2">
            <div class="w-14 h-14 rounded-full bg-primary-20 flex items-center justify-center">
              <svg class="ai-icon-lg" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
              </svg>
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
                  tabindex="0"
                  [attr.aria-label]="'Ask: ' + suggestion"
                  (keydown.enter)="selectAiSuggestion(suggestion)"
                  (keydown.space)="$event.preventDefault(); selectAiSuggestion(suggestion)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-sm text-primary flex-shrink-0" aria-hidden="true">chevron_right</i>
                    <div>{{ suggestion }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Message list -->
        @if (aiMessages().length > 0) {
          <div class="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1" aria-live="polite" role="log" aria-label="Chat messages">
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
                    <svg class="ai-icon-xs" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                      <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                      <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                      <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
                    </svg>
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
                  <svg class="ai-icon-xs" viewBox="0 0 887 982" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                    <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                    <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                    <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-grad-light)"/>
                  </svg>
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
              aria-hidden="true"
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef);
  private hamburgerBtn: HTMLElement | null = null;

  private readonly hamburgerEffect = effect(() => {
    const expanded = this.navExpanded();
    if (this.hamburgerBtn) {
      if (expanded) {
        this.hamburgerBtn.style.background = 'var(--primary)';
        this.hamburgerBtn.style.color = 'var(--primary-foreground)';
      } else {
        this.hamburgerBtn.style.background = '';
        this.hamburgerBtn.style.color = '';
      }
    }
  });

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

  readonly searchInputOpen = signal(false);
  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  // ── Navbar visibility (responsive) ──
  readonly moreMenuOpen = signal(false);

  readonly navbarVisibility = computed(() => {
    if (this.isMobile()) {
      return { user: true, mainMenu: true, notifications: false, apps: false, help: false, search: false, searchInput: false };
    }
    return { user: true, mainMenu: true, notifications: true, apps: false, help: true, search: true, searchInput: true };
  });

  toggleMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  moreMenuAction(action: string): void {
    this.moreMenuOpen.set(false);
    switch (action) {
      case 'search':
        this.searchInputOpen.set(!this.searchInputOpen());
        break;
      case 'notifications':
        break;
      case 'help':
        break;
      case 'ai':
        this.toggleAiPanel();
        break;
      case 'darkmode':
        this.toggleDarkMode();
        break;
    }
  }

  // ── Side Navigation ──
  readonly navExpanded = signal(false);
  readonly activeNav = signal<'home' | 'projects' | 'financials' | 'settings'>('home');
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  readonly sideNavItems: { value: 'home' | 'projects' | 'financials' | 'settings'; label: string; icon: string }[] = [
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'projects', label: 'Projects', icon: 'briefcase' },
    { value: 'financials', label: 'Financials', icon: 'bar_graph' },
  ];


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
    const base = 'relative navbar-icon-btn';
    return this.aiPanelOpen()
      ? `${base} navbar-icon-btn-active`
      : base;
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  focusMain(): void {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.focus();
      mainEl.scrollIntoView();
    }
  }

  onEscapeKey(): void {
    if (this.aiPanelOpen()) {
      this.aiPanelOpen.set(false);
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    } else if (this.moreMenuOpen()) {
      this.moreMenuOpen.set(false);
    }
  }

  // ── Date ──
  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Estimates table responsive column ──
  private readonly estimatesContainerRef = viewChild<ElementRef>('estimatesContainer');

  // Actual rendered pixel width of the widget — updated by a ResizeObserver so
  // that breakpoints work correctly on mobile (where col-span is meaningless).
  readonly estimatesContainerWidth = signal<number>(0);
  private _estimatesResizeObserver: ResizeObserver | null = null;

  // Pixel thresholds are calibrated to match the desktop col-span behaviour
  // (≈62px/col × 16-col grid, 16px gaps) while also responding correctly when
  // the widget is reflowed to a single full-width column on mobile.
  readonly estimatesNarrow      = computed(() => { const w = this.estimatesContainerWidth(); return w > 0 && w <= 1000; });
  readonly estimatesXNarrow     = computed(() => { const w = this.estimatesContainerWidth(); return w > 0 && w <= 760; });
  readonly estimatesXXNarrow    = computed(() => { const w = this.estimatesContainerWidth(); return w > 0 && w <= 680; });
  readonly estimatesUltraNarrow = computed(() => { const w = this.estimatesContainerWidth(); return w > 0 && w <= 450; });

  // Must be a field initializer (not inside ngAfterViewInit) so it runs within
  // Angular's injection context. viewChild() returns undefined until after
  // view init, at which point the effect re-runs and attaches the observer.
  private readonly _estimatesResizeEffect = effect(() => {
    const el = this.estimatesContainerRef()?.nativeElement as HTMLElement | undefined;
    this._estimatesResizeObserver?.disconnect();
    this._estimatesResizeObserver = null;
    if (!el) {
      this.estimatesContainerWidth.set(0);
      return;
    }
    this.estimatesContainerWidth.set(el.offsetWidth);
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? el.offsetWidth;
      this.estimatesContainerWidth.set(w);
    });
    ro.observe(el);
    this._estimatesResizeObserver = ro;
  });

  setActiveNav(page: 'home' | 'projects' | 'financials' | 'settings'): void {
    this.activeNav.set(page);
    this.navExpanded.set(false);
  }

  navigateToProject(projectId: number): void {
    this.router.navigate(['/project', projectId]);
  }

  ngAfterViewInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'projects' || tab === 'financials' || tab === 'settings') {
        this.activeNav.set(tab);
      }
    });

    const mq = window.matchMedia('(max-width: 767px)');
    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const wasMobile = this.isMobile();
      this.isMobile.set(e.matches);
      if (e.matches && !wasMobile) {
        this._savedDesktopTops = { ...this.widgetTops() };
        this._savedDesktopColStarts = { ...this.widgetColStarts() };
        this._savedDesktopColSpans = { ...this.widgetColSpans() };
        this._savedDesktopHeights = { ...this.widgetHeights() };
        this.applyMobileHeights();
        this.stackAllForMobile();
      } else if (!e.matches && wasMobile && this._savedDesktopTops) {
        this.widgetTops.set(this._savedDesktopTops);
        if (this._savedDesktopColStarts) this.widgetColStarts.set(this._savedDesktopColStarts);
        if (this._savedDesktopColSpans) this.widgetColSpans.set(this._savedDesktopColSpans);
        if (this._savedDesktopHeights) this.widgetHeights.set(this._savedDesktopHeights);
        this._savedDesktopTops = null;
        this._savedDesktopColStarts = null;
        this._savedDesktopColSpans = null;
        this._savedDesktopHeights = null;
      }
      if (!e.matches) {
        this.navExpanded.set(false);
      }
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void);

    window.addEventListener('resize', () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== this.isMobile()) {
        onBreakpointChange(mq);
      }
    });

    onBreakpointChange(mq);
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.stackAllForMobile();
    }

    this.attachHamburgerListener();
  }

  private attachHamburgerListener(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;

    const tryAttach = () => {
      const btn = navbarWc.querySelector('.navbar-menu-btn, [data-testid="main-menu-btn"], button[aria-label="Main menu"]');
      if (btn) {
        this.hamburgerBtn = btn as HTMLElement;
        btn.addEventListener('click', (e: Event) => {
          e.stopImmediatePropagation();
          this.navExpanded.set(!this.navExpanded());
        }, { capture: true });
        return;
      }
      requestAnimationFrame(tryAttach);
    };
    tryAttach();
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

  // ── RFIs ──
  readonly rfis: Rfi[] = [
    { id: '1', number: 'RFI-001', subject: 'Foundation depth clarification', project: 'Highway 290 Expansion', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 12' },
    { id: '2', number: 'RFI-002', subject: 'Steel grade specification', project: 'Downtown Bridge Rehab', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 28' },
    { id: '3', number: 'RFI-003', subject: 'Drainage system alignment', project: 'Highway 290 Expansion', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 15' },
    { id: '4', number: 'RFI-004', subject: 'Concrete mix design approval', project: 'Riverside Commercial Park', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 20' },
    { id: '5', number: 'RFI-005', subject: 'Electrical conduit routing', project: 'Airport Terminal B', assignee: 'Lena Brooks', status: 'closed', dueDate: 'Feb 15' },
    { id: '6', number: 'RFI-006', subject: 'Fire suppression specs', project: 'Downtown Bridge Rehab', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 1' },
    { id: '7', number: 'RFI-007', subject: 'Soil testing report review', project: 'Riverside Commercial Park', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 10' },
    { id: '8', number: 'RFI-008', subject: 'HVAC duct sizing confirmation', project: 'Airport Terminal B', assignee: 'James Carter', status: 'upcoming', dueDate: 'Mar 22' },
    { id: '9', number: 'RFI-009', subject: 'Retaining wall design change', project: 'Highway 290 Expansion', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 18' },
    { id: '10', number: 'RFI-010', subject: 'Waterproofing membrane spec', project: 'Downtown Bridge Rehab', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 30' },
  ];

  readonly rfiActiveFilter = signal<RfiStatus | 'all'>('all');
  readonly rfiMobileExpanded = signal(false);

  expandRfiMobile(filter: RfiStatus | 'all'): void {
    this.rfiActiveFilter.set(filter);
    this.rfiMobileExpanded.set(true);
  }

  collapseRfiMobile(): void {
    this.rfiMobileExpanded.set(false);
    this.rfiActiveFilter.set('all');
  }

  readonly rfiCounts = computed(() => ({
    all: this.rfis.length,
    open: this.rfis.filter(r => r.status === 'open').length,
    overdue: this.rfis.filter(r => r.status === 'overdue').length,
    upcoming: this.rfis.filter(r => r.status === 'upcoming').length,
    closed: this.rfis.filter(r => r.status === 'closed').length,
  }));

  readonly filteredRfis = computed(() => {
    const filter = this.rfiActiveFilter();
    if (filter === 'all') return this.rfis;
    return this.rfis.filter(r => r.status === filter);
  });


  rfiStatusColor(status: RfiStatus): string {
    const map: Record<RfiStatus, string> = {
      open: 'bg-primary',
      overdue: 'bg-destructive',
      upcoming: 'bg-warning',
      closed: 'bg-success',
    };
    return map[status];
  }

  rfiStatusLabel(status: RfiStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  // ── Submittals ──
  readonly submittals: Submittal[] = [
    { id: '1', number: 'SUB-001', subject: 'Structural steel shop drawings', project: 'Highway 290 Expansion', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 14' },
    { id: '2', number: 'SUB-002', subject: 'Concrete mix design report', project: 'Downtown Bridge Rehab', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 25' },
    { id: '3', number: 'SUB-003', subject: 'Waterproofing membrane samples', project: 'Riverside Commercial Park', assignee: 'Priya Nair', status: 'closed', dueDate: 'Feb 18' },
    { id: '4', number: 'SUB-004', subject: 'HVAC equipment cut sheets', project: 'Airport Terminal B', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 22' },
    { id: '5', number: 'SUB-005', subject: 'Rebar placement drawings', project: 'Highway 290 Expansion', assignee: 'Lena Brooks', status: 'open', dueDate: 'Mar 16' },
    { id: '6', number: 'SUB-006', subject: 'Asphalt mix design', project: 'Downtown Bridge Rehab', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 3' },
    { id: '7', number: 'SUB-007', subject: 'Electrical panel schedule', project: 'Airport Terminal B', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 12' },
    { id: '8', number: 'SUB-008', subject: 'Glazing system product data', project: 'Riverside Commercial Park', assignee: 'James Carter', status: 'upcoming', dueDate: 'Mar 25' },
    { id: '9', number: 'SUB-009', subject: 'Fire-rated door schedule', project: 'Airport Terminal B', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 19' },
    { id: '10', number: 'SUB-010', subject: 'Pile driving records', project: 'Highway 290 Expansion', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 28' },
  ];

  readonly submittalActiveFilter = signal<SubmittalStatus | 'all'>('all');
  readonly submittalMobileExpanded = signal(false);

  expandSubmittalMobile(filter: SubmittalStatus | 'all'): void {
    this.submittalActiveFilter.set(filter);
    this.submittalMobileExpanded.set(true);
  }

  collapseSubmittalMobile(): void {
    this.submittalMobileExpanded.set(false);
    this.submittalActiveFilter.set('all');
  }

  readonly submittalCounts = computed(() => ({
    all: this.submittals.length,
    open: this.submittals.filter(s => s.status === 'open').length,
    overdue: this.submittals.filter(s => s.status === 'overdue').length,
    upcoming: this.submittals.filter(s => s.status === 'upcoming').length,
    closed: this.submittals.filter(s => s.status === 'closed').length,
  }));

  readonly filteredSubmittals = computed(() => {
    const filter = this.submittalActiveFilter();
    if (filter === 'all') return this.submittals;
    return this.submittals.filter(s => s.status === filter);
  });

  submittalStatusColor(status: SubmittalStatus): string {
    const map: Record<SubmittalStatus, string> = {
      open: 'bg-primary',
      overdue: 'bg-destructive',
      upcoming: 'bg-warning',
      closed: 'bg-success',
    };
    return map[status];
  }

  submittalStatusLabel(status: SubmittalStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

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
  // Free-form grid: each widget has explicit column + row placement.
  // Collision detection ensures no overlaps after move/resize.

  private static readonly GAP_PX = 16;

  readonly homeWidgets: DashboardWidgetId[] = ['homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals'];
  readonly projectWidgets: DashboardWidgetId[] = ['projects', 'openEstimates', 'recentActivity', 'needsAttention'];
  readonly financialsWidgets: DashboardWidgetId[] = ['finBudgetByProject'];

  /** Column start (1-16) per widget. */
  readonly widgetColStarts = signal<Record<DashboardWidgetId, number>>({
    projects: 1, openEstimates: 1, recentActivity: 1, needsAttention: 13, timeOff: 1,
    homeTimeOff: 1, homeCalendar: 9, homeRfis: 1, homeSubmittals: 1,
    finBudgetByProject: 1,
  });

  /** Column span (1-16) per widget. */
  readonly widgetColSpans = signal<Record<DashboardWidgetId, number>>({
    projects: 16, openEstimates: 16, recentActivity: 12, needsAttention: 4, timeOff: 8,
    homeTimeOff: 8, homeCalendar: 8, homeRfis: 16, homeSubmittals: 16,
    finBudgetByProject: 16,
  });

  /** Top position in pixels (row offset in the 1px-per-row grid). */
  readonly widgetTops = signal<Record<DashboardWidgetId, number>>({
    homeTimeOff: 0, homeCalendar: 0, homeRfis: 596, homeSubmittals: 1072,
    projects: 0, openEstimates: 536, recentActivity: 1072, needsAttention: 1072,
    finBudgetByProject: 0,
    timeOff: 0,
  });

  /** Total widget height in pixels (= grid row span). */
  readonly widgetHeights = signal<Record<DashboardWidgetId, number>>({
    homeTimeOff: 440, homeCalendar: 580, homeRfis: 460, homeSubmittals: 460,
    projects: 520, openEstimates: 520, recentActivity: 420, needsAttention: 420,
    finBudgetByProject: 520,
    timeOff: 400,
  });

  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');
  private readonly homeGridContainerRef = viewChild<ElementRef>('homeWidgetGrid');
  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  private getGridWidgets(grid: GridPage): DashboardWidgetId[] {
    switch (grid) {
      case 'home': return this.homeWidgets;
      case 'projects': return this.projectWidgets;
      case 'financials': return this.financialsWidgets;
    }
  }

  // ── Collision detection ──

  private columnsOverlap(a: DashboardWidgetId, b: DashboardWidgetId): boolean {
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    return starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];
  }

  private rowsOverlap(a: DashboardWidgetId, b: DashboardWidgetId): boolean {
    const tops = this.widgetTops();
    const heights = this.widgetHeights();
    return tops[a] < tops[b] + heights[b] && tops[b] < tops[a] + heights[a];
  }

  private resolveCollisions(movedId: DashboardWidgetId, widgets: DashboardWidgetId[]): void {
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const starts = this.widgetColStarts();
    const spans = this.widgetColSpans();
    const gap = HomeComponent.GAP_PX;

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

  // ── Drag-to-move ──

  readonly moveTargetId = signal<DashboardWidgetId | null>(null);

  private _moveTarget: DashboardWidgetId | null = null;
  private _activeGrid: GridPage = 'projects';
  private _dragAxis: 'h' | 'v' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;

  private get activeGridEl(): HTMLElement | undefined {
    const refMap: Record<GridPage, ElementRef | undefined> = {
      home: this.homeGridContainerRef(),
      projects: this.gridContainerRef(),
      financials: this.financialsGridContainerRef(),
    };
    return refMap[this._activeGrid]?.nativeElement as HTMLElement | undefined;
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent, grid: GridPage = 'projects'): void {
    event.preventDefault();
    this._moveTarget = id;
    this._activeGrid = grid;
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
    const gridWidgets = this.getGridWidgets(this._activeGrid);

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
        this.resolveCollisions(id, gridWidgets);
      }
    } else {
      const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
      this.widgetTops.update(t => ({ ...t, [id]: newTop }));
      this.resolveCollisions(id, gridWidgets);
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

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, grid: GridPage = 'projects'): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._activeGrid = grid;
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

  // ── Unified document mouse handlers ──

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      const id = this._resizeTarget as DashboardWidgetId;
      const gridWidgets = this.getGridWidgets(this._activeGrid);

      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const newH = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
        this.widgetHeights.update(h => ({ ...h, [id]: newH }));
        this.resolveCollisions(id, gridWidgets);
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const colW = this._gridContainerWidth / 16;
        const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
        const newSpan = this._resizeStartColSpan + deltaSpan;
        const minSpan = id === 'needsAttention' ? 3 : 4;
        const clampedSpan = Math.max(minSpan, Math.min(16, newSpan));
        this.widgetColSpans.update(s => ({ ...s, [id]: clampedSpan }));
        this.resolveCollisions(id, gridWidgets);
      }
    }
  }

  onDocumentMouseUp(): void {
    const hadInteraction = !!this._moveTarget || !!this._resizeTarget;
    const grid = this._activeGrid;
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    if (hadInteraction) {
      this.compactAll(grid);
    }
  }

  // ── Touch event adapters for mobile drag/resize ──

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent, grid: GridPage = 'projects'): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this._moveTarget = id;
    this._activeGrid = grid;
    this._dragAxis = null;
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.widgetTops()[id];
    this.moveTargetId.set(id);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, grid: GridPage = 'projects'): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._activeGrid = grid;
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

  onDocumentTouchMove(event: TouchEvent): void {
    if (!this._moveTarget && !this._resizeTarget) return;
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.onDocumentMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  // ── Mobile layout stacking ──

  private _savedDesktopTops: Record<DashboardWidgetId, number> | null = null;
  private _savedDesktopColStarts: Record<DashboardWidgetId, number> | null = null;
  private _savedDesktopColSpans: Record<DashboardWidgetId, number> | null = null;
  private _savedDesktopHeights: Record<DashboardWidgetId, number> | null = null;

  private static readonly MOBILE_COMPACT_HEIGHTS: Partial<Record<DashboardWidgetId, number>> = {
    homeRfis: 340,
    homeSubmittals: 340,
  };

  private applyMobileHeights(): void {
    const heights = { ...this.widgetHeights() };
    for (const [id, h] of Object.entries(HomeComponent.MOBILE_COMPACT_HEIGHTS)) {
      heights[id as DashboardWidgetId] = h;
    }
    this.widgetHeights.set(heights);
  }

  private stackAllForMobile(): void {
    const gap = HomeComponent.GAP_PX;
    const heights = this.widgetHeights();
    const tops = { ...this.widgetTops() };
    const colStarts = { ...this.widgetColStarts() };
    const colSpans = { ...this.widgetColSpans() };

    for (const widgets of [this.homeWidgets, this.projectWidgets, this.financialsWidgets]) {
      let y = 0;
      for (const id of widgets) {
        tops[id] = y;
        colStarts[id] = 1;
        colSpans[id] = 16;
        y += heights[id] + gap;
      }
    }

    this.widgetTops.set(tops);
    this.widgetColStarts.set(colStarts);
    this.widgetColSpans.set(colSpans);
  }

  private compactAll(gridPage: GridPage): void {
    const gap = HomeComponent.GAP_PX;
    const tops = { ...this.widgetTops() };
    const heights = this.widgetHeights();
    const widgets = this.getGridWidgets(gridPage);
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
}
