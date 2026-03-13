import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { ThemeService } from '../../services/theme.service';

interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming' | 'overdue';
type TaskPriority = 'high' | 'medium' | 'low';
type RiskSeverity = 'high' | 'medium' | 'low';

interface Milestone {
  id: number;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
  progress: number;
}

interface TeamMember {
  id: number;
  initials: string;
  name: string;
  role: string;
  tasksCompleted: number;
  tasksTotal: number;
  availability: number;
}

interface Task {
  id: number;
  title: string;
  assigneeInitials: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: string;
}

interface Risk {
  id: number;
  title: string;
  severity: RiskSeverity;
  impact: string;
  mitigation: string;
}

interface ActivityEntry {
  id: number;
  actorInitials: string;
  text: string;
  timeAgo: string;
  icon: string;
}

type ProjectWidgetId = 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity';
type DrawingType = 'server-room' | 'network' | 'power';

interface Drawing {
  id: number;
  name: string;
  type: DrawingType;
  version: string;
  isLatest: boolean;
  updatedBy: string;
  updatedAt: string;
  revisionCount: number;
  fileSize: string;
}

@Component({
  selector: 'app-project-dashboard',
  imports: [TitleCasePipe, ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, ModusButtonComponent, ModusUtilityPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-screen overflow-hidden',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchmove)': 'onDocumentTouchMove($event)',
    '(document:touchend)': 'onDocumentTouchEnd()',
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
    <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <!-- Navbar -->
      <modus-navbar
        [userCard]="userCard"
        [visibility]="navbarVisibility()"
        [searchInputOpen]="searchInputOpen()"
        (searchClick)="searchInputOpen.set(!searchInputOpen())"
        (searchInputOpenChange)="searchInputOpen.set($event)"
        (trimbleLogoClick)="navigateToProjects()"
      >
        <div slot="start" class="flex items-center gap-3 overflow-hidden w-full">
          <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
          <div
            class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
            (click)="navigateToProjects()"
            role="button"
            tabindex="0"
            (keydown.enter)="navigateToProjects()"
          >
            <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
            <div class="text-sm hidden md:block">Projects</div>
          </div>
          <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
          <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide truncate" [title]="projectName()">{{ projectName() }}</div>
        </div>
        <div slot="end" class="flex items-center gap-2">
          @if (!isMobile()) {
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
            </div>
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

      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-4 md:p-6">
        <!-- Overview Row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          @for (stat of summaryStats(); track stat.label) {
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-2xs text-foreground-40 uppercase tracking-wide">{{ stat.label }}</div>
              <div class="text-2xl font-bold text-foreground">{{ stat.value }}</div>
              @if (stat.subtext) {
                <div class="text-xs" [class]="stat.subtextClass || 'text-foreground-60'">{{ stat.subtext }}</div>
              }
            </div>
          }
        </div>

        <!-- 16-column widget grid -->
        <div
          class="grid mb-6"
          [style.grid-template-columns]="isMobile() ? '1fr' : 'repeat(16, minmax(0, 1fr))'"
          [style.grid-auto-rows]="'1px'"
          [style.gap]="isMobile() ? '0' : '0 1rem'"
          #widgetGrid
        >
          @for (wId of widgets; track wId) {
            <div
              class="relative"
              [class.overflow-hidden]="isMobile()"
              [attr.data-widget-id]="wId"
              [style.grid-column]="isMobile() ? '1 / -1' : wColStarts()[wId] + ' / span ' + wColSpans()[wId]"
              [style.grid-row]="(wTops()[wId] + 1) + ' / span ' + wHeights()[wId]"
            >
              <div class="relative h-full" [class.opacity-30]="moveTargetId() === wId">

              @switch (wId) {
                @case ('milestones') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">flag</i>
                    <div class="text-base font-semibold text-foreground">Milestones</div>
                  </div>
                  <div class="text-xs text-foreground-60">{{ completedMilestones() }}/{{ milestones().length }} Complete</div>
                </div>
                <div class="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
                  @for (ms of milestones(); track ms.id) {
                    <div class="flex items-center gap-3 p-3 bg-background border-default rounded-lg">
                      <div class="flex-shrink-0">
                        @if (ms.status === 'completed') {
                          <div class="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                            <i class="modus-icons text-sm text-success-foreground" aria-hidden="true">check</i>
                          </div>
                        } @else if (ms.status === 'in-progress') {
                          <div class="w-8 h-8 rounded-full bg-primary-20 flex items-center justify-center">
                            <i class="modus-icons text-sm text-primary" aria-hidden="true">timer</i>
                          </div>
                        } @else if (ms.status === 'overdue') {
                          <div class="w-8 h-8 rounded-full bg-destructive-20 flex items-center justify-center">
                            <i class="modus-icons text-sm text-destructive" aria-hidden="true">warning</i>
                          </div>
                        } @else {
                          <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">add_circle</i>
                          </div>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                          <div class="text-sm font-medium text-foreground truncate">{{ ms.name }}</div>
                          <div class="text-xs text-foreground-60 flex-shrink-0 ml-2">{{ ms.dueDate }}</div>
                        </div>
                        @if (ms.status !== 'completed') {
                          <modus-progress [value]="ms.progress" [max]="100" [className]="milestoneProgressClass(ms.status)" />
                        }
                      </div>
                    </div>
                  }
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('tasks') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">clipboard</i>
                    <div class="text-base font-semibold text-foreground">Key Tasks</div>
                  </div>
                  <div class="text-xs text-foreground-60">{{ openTaskCount() }} Open</div>
                </div>
                <div class="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  @for (task of tasks(); track task.id) {
                    <div class="flex items-center gap-3 p-3 bg-background border-default rounded-lg">
                      <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xs font-semibold">
                        {{ task.assigneeInitials }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm text-foreground truncate">{{ task.title }}</div>
                        <div class="text-xs text-foreground-40">{{ task.assignee }} · {{ task.dueDate }}</div>
                      </div>
                      <modus-badge [color]="priorityBadgeColor(task.priority)" variant="filled" size="sm">
                        {{ task.priority | titlecase }}
                      </modus-badge>
                    </div>
                  }
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('risks') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-warning" aria-hidden="true">warning</i>
                    <div class="text-base font-semibold text-foreground">Risks</div>
                  </div>
                  <div class="text-xs text-foreground-60">{{ risks().length }} Identified</div>
                </div>
                <div class="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  @for (risk of risks(); track risk.id) {
                    <div class="p-3 bg-background border-default rounded-lg flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-foreground">{{ risk.title }}</div>
                        <modus-badge [color]="riskBadgeColor(risk.severity)" variant="filled" size="sm">
                          {{ risk.severity | titlecase }}
                        </modus-badge>
                      </div>
                      <div class="text-xs text-foreground-60">
                        <div class="inline text-foreground-80 font-medium">Impact:</div> {{ risk.impact }}
                      </div>
                      <div class="text-xs text-foreground-60">
                        <div class="inline text-foreground-80 font-medium">Mitigation:</div> {{ risk.mitigation }}
                      </div>
                    </div>
                  }
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('drawing') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">floorplan</i>
                    <div class="text-base font-semibold text-foreground">Drawing</div>
                  </div>
                  <div class="text-xs text-foreground-60">{{ latestDrawing().version }}</div>
                </div>
                <div class="overflow-y-auto flex-1 cursor-pointer hover:opacity-90 transition-opacity duration-150" role="button" tabindex="0" [attr.aria-label]="'Open drawing: ' + latestDrawing().name">
                  <div class="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                    <svg class="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      @for (i of gridLines; track i) {
                        <line [attr.x1]="i * 20" y1="0" [attr.x2]="i * 20" y2="300" class="floorplan-grid" />
                        <line x1="0" [attr.y1]="i * 20" x2="400" [attr.y2]="i * 20" class="floorplan-grid" />
                      }
                      <rect x="40" y="30" width="320" height="240" class="floorplan-wall" />
                      <rect x="60" y="60" width="16" height="60" class="floorplan-rack" />
                      <rect x="90" y="60" width="16" height="60" class="floorplan-rack" />
                      <rect x="120" y="60" width="16" height="60" class="floorplan-rack" />
                      <rect x="150" y="60" width="16" height="60" class="floorplan-rack" />
                      <rect x="180" y="60" width="16" height="60" class="floorplan-rack" />
                      <rect x="60" y="160" width="16" height="60" class="floorplan-rack" />
                      <rect x="90" y="160" width="16" height="60" class="floorplan-rack" />
                      <rect x="120" y="160" width="16" height="60" class="floorplan-rack" />
                      <rect x="150" y="160" width="16" height="60" class="floorplan-rack" />
                      <rect x="180" y="160" width="16" height="60" class="floorplan-rack" />
                      <rect x="240" y="50" width="100" height="40" rx="4" class="floorplan-utility" />
                      <rect x="240" y="110" width="100" height="40" rx="4" class="floorplan-utility" />
                      <rect x="240" y="170" width="100" height="40" rx="4" class="floorplan-utility" />
                      <text x="130" y="145" class="floorplan-label">Server Racks</text>
                      <text x="290" y="240" class="floorplan-label">HVAC</text>
                      <line x1="40" y1="200" x2="40" y2="240" class="floorplan-door" />
                      <line x1="40" y1="280" x2="360" y2="280" class="floorplan-dim" />
                      <text x="200" y="295" class="floorplan-dim-text">24.4m</text>
                    </svg>
                    <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-success text-success-foreground text-2xs font-semibold">Current</div>
                  </div>
                  <div class="px-4 py-3 flex flex-col gap-1">
                    <div class="text-sm font-medium text-foreground truncate">{{ latestDrawing().name }}</div>
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-foreground-60">{{ latestDrawing().updatedBy }}</div>
                      <div class="text-xs text-foreground-40">{{ latestDrawing().updatedAt }}</div>
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <div class="flex items-center gap-1"><i class="modus-icons text-2xs text-foreground-40" aria-hidden="true">history</i><div class="text-2xs text-foreground-40">{{ latestDrawing().revisionCount }} revisions</div></div>
                      <div class="flex items-center gap-1"><i class="modus-icons text-2xs text-foreground-40" aria-hidden="true">file</i><div class="text-2xs text-foreground-40">{{ latestDrawing().fileSize }}</div></div>
                    </div>
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('budget') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">bar_graph</i>
                    <div class="text-base font-semibold text-foreground">Budget</div>
                  </div>
                </div>
                <div class="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
                  <div class="flex items-baseline justify-between">
                    <div class="text-3xl font-bold text-foreground">$544K</div>
                    <div class="text-sm text-foreground-60">of $800K</div>
                  </div>
                  <modus-progress [value]="68" [max]="100" className="progress-primary" />
                  <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Labor</div>
                      <div class="text-sm font-semibold text-foreground">$382K</div>
                      <div class="text-2xs text-foreground-60">70% of spend</div>
                    </div>
                    <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Infrastructure</div>
                      <div class="text-sm font-semibold text-foreground">$98K</div>
                      <div class="text-2xs text-foreground-60">18% of spend</div>
                    </div>
                    <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Licensing</div>
                      <div class="text-sm font-semibold text-foreground">$42K</div>
                      <div class="text-2xs text-foreground-60">8% of spend</div>
                    </div>
                    <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                      <div class="text-2xs text-foreground-40 uppercase tracking-wide">Other</div>
                      <div class="text-sm font-semibold text-foreground">$22K</div>
                      <div class="text-2xs text-foreground-60">4% of spend</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 p-3 bg-success-20 border-success rounded-lg">
                    <i class="modus-icons text-sm text-success" aria-hidden="true">check_circle</i>
                    <div class="text-xs text-foreground">Budget on track -- $256K remaining</div>
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('team') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">people_group</i>
                    <div class="text-base font-semibold text-foreground">Team</div>
                  </div>
                  <div class="text-xs text-foreground-60">{{ team().length }} Members</div>
                </div>
                <div class="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  @for (member of team(); track member.id) {
                    <div class="flex items-center gap-3 p-3 bg-background border-default rounded-lg">
                      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xs font-semibold flex-shrink-0">
                        {{ member.initials }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-foreground truncate">{{ member.name }}</div>
                        <div class="text-xs text-foreground-60">{{ member.role }}</div>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <div class="text-xs text-foreground-80 font-medium">{{ member.tasksCompleted }}/{{ member.tasksTotal }}</div>
                        <div class="text-2xs text-foreground-40">tasks</div>
                      </div>
                    </div>
                  }
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }

                @case ('activity') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true">drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">history</i>
                    <div class="text-base font-semibold text-foreground">Recent Activity</div>
                  </div>
                </div>
                <div class="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
                  @for (entry of activity(); track entry.id) {
                    <div class="flex items-start gap-3">
                      <div class="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground-60 text-2xs font-semibold flex-shrink-0 mt-0.5">
                        {{ entry.actorInitials }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-xs text-foreground leading-relaxed">{{ entry.text }}</div>
                        <div class="text-2xs text-foreground-40 mt-0.5">{{ entry.timeAgo }}</div>
                      </div>
                      <i class="modus-icons text-sm text-foreground-40 flex-shrink-0 mt-0.5" aria-hidden="true">{{ entry.icon }}</i>
                    </div>
                  }
                </div>
                <div class="absolute bottom-0 right-0 w-5 h-5 z-30 select-none group" [class.cursor-nwse-resize]="!isMobile()" [class.cursor-ns-resize]="isMobile()" (mousedown)="startWidgetResize(wId, 'both', $event)" (touchstart)="startWidgetResizeTouch(wId, 'both', $event)">
                  <div class="absolute bottom-1 right-1 flex flex-col gap-0.5 pointer-events-none"><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div><div class="flex gap-0.5"><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div><div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div></div></div>
                </div>
              </div>
                }
              }

              </div>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- AI Assistant Panel -->
    <modus-utility-panel
      [expanded]="aiPanelOpen()"
      className="fixed-utility-panel"
      position="right"
      panelWidth="380px"
      ariaLabel="Trimble AI Assistant"
    >
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

      <div slot="body" class="flex flex-col h-full min-h-0">
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
              <div class="text-sm text-foreground-60 mt-1">Ask me about this project, milestones, budget, or team status.</div>
            </div>
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

      <div slot="footer" class="w-full">
        <div class="flex items-end gap-2 p-2">
          <textarea
            class="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm rounded-lg border-default bg-background text-foreground resize-none outline-none focus:border-primary transition-colors duration-150 placeholder:text-foreground-40"
            placeholder="Ask about this project..."
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
      </div>
    </modus-utility-panel>
  `,
})
export class ProjectDashboardComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly elementRef = inject(ElementRef);

  readonly isDark = computed(() => this.themeService.mode() === 'dark');
  readonly isMobile = signal(false);
  readonly moreMenuOpen = signal(false);
  readonly searchInputOpen = signal(false);

  // Widget grid system
  private static readonly GAP_PX = 16;
  private readonly gridRef = viewChild<ElementRef>('widgetGrid');

  readonly widgets: ProjectWidgetId[] = ['milestones', 'tasks', 'risks', 'drawing', 'budget', 'team', 'activity'];

  readonly wColStarts = signal<Record<ProjectWidgetId, number>>({
    milestones: 1, tasks: 1, risks: 1,
    drawing: 12, budget: 12, team: 12, activity: 12,
  });
  readonly wColSpans = signal<Record<ProjectWidgetId, number>>({
    milestones: 11, tasks: 11, risks: 11,
    drawing: 5, budget: 5, team: 5, activity: 5,
  });
  readonly wTops = signal<Record<ProjectWidgetId, number>>({
    milestones: 0, tasks: 536, risks: 952,
    drawing: 0, budget: 436, team: 902, activity: 1318,
  });
  readonly wHeights = signal<Record<ProjectWidgetId, number>>({
    milestones: 520, tasks: 400, risks: 350,
    drawing: 420, budget: 450, team: 400, activity: 350,
  });
  readonly moveTargetId = signal<ProjectWidgetId | null>(null);

  private _moveTarget: ProjectWidgetId | null = null;
  private _dragAxis: 'h' | 'v' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;
  private _resizeTarget: ProjectWidgetId | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartColSpan = 0;
  private _gridContainerWidth = 1200;
  private _savedDesktopTops: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopColStarts: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopColSpans: Record<ProjectWidgetId, number> | null = null;

  readonly navbarVisibility = computed(() => {
    if (this.isMobile()) {
      return { user: true, mainMenu: false, notifications: false, apps: false, help: false, search: false, searchInput: false };
    }
    return { user: true, mainMenu: false, notifications: true, apps: false, help: true, search: true, searchInput: true };
  });

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

  readonly projectName = signal('Cloud Infrastructure Migration');
  readonly projectStatus = signal<ProjectStatus>('On Track');

  readonly summaryStats = signal([
    { label: 'Schedule', value: '72%', subtext: 'On track', subtextClass: 'text-success' },
    { label: 'Budget Used', value: '$544K', subtext: '68% of $800K', subtextClass: 'text-foreground-60' },
    { label: 'Team Members', value: '6', subtext: '2 available', subtextClass: 'text-foreground-60' },
    { label: 'Due Date', value: 'Mar 15', subtext: '2 days remaining', subtextClass: 'text-warning font-medium' },
  ]);

  readonly milestones = signal<Milestone[]>([
    { id: 1, name: 'Infrastructure Assessment', dueDate: 'Jan 15, 2026', status: 'completed', progress: 100 },
    { id: 2, name: 'Architecture Design & Approval', dueDate: 'Feb 1, 2026', status: 'completed', progress: 100 },
    { id: 3, name: 'Dev/Staging Migration', dueDate: 'Feb 20, 2026', status: 'completed', progress: 100 },
    { id: 4, name: 'Production Migration Wave 1', dueDate: 'Mar 5, 2026', status: 'in-progress', progress: 78 },
    { id: 5, name: 'Production Migration Wave 2', dueDate: 'Mar 12, 2026', status: 'in-progress', progress: 35 },
    { id: 6, name: 'Cutover & Validation', dueDate: 'Mar 15, 2026', status: 'upcoming', progress: 0 },
  ]);

  readonly completedMilestones = computed(() =>
    this.milestones().filter(ms => ms.status === 'completed').length
  );

  readonly tasks = signal<Task[]>([
    { id: 1, title: 'Configure load balancer for prod cluster', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
    { id: 2, title: 'Database replication validation', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 8', status: 'In Progress' },
    { id: 3, title: 'Update DNS records for new endpoints', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
    { id: 4, title: 'Security scan on migrated services', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 11', status: 'To Do' },
    { id: 5, title: 'Client notification for maintenance window', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'medium', dueDate: 'Mar 13', status: 'To Do' },
    { id: 6, title: 'Rollback procedure documentation', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Mar 14', status: 'To Do' },
  ]);

  readonly openTaskCount = computed(() =>
    this.tasks().filter(t => t.status !== 'Done').length
  );

  readonly risks = signal<Risk[]>([
    { id: 1, title: 'Database migration data loss', severity: 'high', impact: 'Potential loss of transactional data during cutover', mitigation: 'Dual-write pattern with automated reconciliation checks' },
    { id: 2, title: 'Extended downtime during cutover', severity: 'medium', impact: 'Customer-facing services unavailable beyond maintenance window', mitigation: 'Blue-green deployment with automated rollback triggers' },
    { id: 3, title: 'Third-party API compatibility', severity: 'low', impact: 'Some integrations may need endpoint updates', mitigation: 'API gateway abstraction layer already in place' },
  ]);

  readonly team = signal<TeamMember[]>([
    { id: 1, initials: 'SC', name: 'Sarah Chen', role: 'Project Lead', tasksCompleted: 14, tasksTotal: 18, availability: 100 },
    { id: 2, initials: 'PN', name: 'Priya Nair', role: 'Senior Engineer', tasksCompleted: 11, tasksTotal: 15, availability: 80 },
    { id: 3, initials: 'MO', name: 'Mike Osei', role: 'DevOps Engineer', tasksCompleted: 8, tasksTotal: 12, availability: 100 },
    { id: 4, initials: 'JC', name: 'James Carter', role: 'Security Analyst', tasksCompleted: 5, tasksTotal: 8, availability: 60 },
    { id: 5, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 7, tasksTotal: 9, availability: 100 },
    { id: 6, initials: 'TE', name: 'Tom Evans', role: 'Solutions Architect', tasksCompleted: 6, tasksTotal: 10, availability: 40 },
  ]);

  readonly activity = signal<ActivityEntry[]>([
    { id: 1, actorInitials: 'SC', text: 'Completed load balancer configuration for staging', timeAgo: '25 min ago', icon: 'check_circle' },
    { id: 2, actorInitials: 'PN', text: 'Updated database replication status to 98% sync', timeAgo: '1 hr ago', icon: 'database' },
    { id: 3, actorInitials: 'MO', text: 'Deployed monitoring dashboards for Wave 1 services', timeAgo: '2 hrs ago', icon: 'dashboard' },
    { id: 4, actorInitials: 'JC', text: 'Submitted security review for migrated APIs', timeAgo: '3 hrs ago', icon: 'security' },
    { id: 5, actorInitials: 'LB', text: 'Sent stakeholder update on migration progress', timeAgo: '4 hrs ago', icon: 'email' },
    { id: 6, actorInitials: 'SC', text: 'Created cutover checklist for production Wave 2', timeAgo: '5 hrs ago', icon: 'clipboard' },
  ]);

  readonly gridLines = Array.from({ length: 21 }, (_, i) => i);

  readonly latestDrawing = signal<Drawing>({
    id: 1, name: 'Server Room - Floor 3 Layout', type: 'server-room', version: 'v3.2', isLatest: true, updatedBy: 'Mike Osei', updatedAt: 'Mar 11, 2026', revisionCount: 8, fileSize: '4.2 MB',
  });

  statusBadgeColor(): ModusBadgeColor {
    const map: Record<ProjectStatus, ModusBadgeColor> = {
      'On Track': 'success',
      'At Risk': 'warning',
      'Overdue': 'danger',
      'Planning': 'secondary',
    };
    return map[this.projectStatus()];
  }

  milestoneProgressClass(status: MilestoneStatus): string {
    const map: Record<MilestoneStatus, string> = {
      'completed': 'progress-success',
      'in-progress': 'progress-primary',
      'overdue': 'progress-danger',
      'upcoming': 'progress-primary',
    };
    return map[status];
  }

  priorityBadgeColor(priority: TaskPriority): ModusBadgeColor {
    const map: Record<TaskPriority, ModusBadgeColor> = {
      high: 'danger',
      medium: 'warning',
      low: 'secondary',
    };
    return map[priority];
  }

  riskBadgeColor(severity: RiskSeverity): ModusBadgeColor {
    const map: Record<RiskSeverity, ModusBadgeColor> = {
      high: 'danger',
      medium: 'warning',
      low: 'secondary',
    };
    return map[severity];
  }

  ngAfterViewInit(): void {
    const mq = window.matchMedia('(max-width: 767px)');
    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const wasMobile = this.isMobile();
      this.isMobile.set(e.matches);
      if (e.matches && !wasMobile) {
        this._savedDesktopTops = { ...this.wTops() };
        this._savedDesktopColStarts = { ...this.wColStarts() };
        this._savedDesktopColSpans = { ...this.wColSpans() };
        this.stackAllForMobile();
      } else if (!e.matches && wasMobile && this._savedDesktopTops) {
        this.wTops.set(this._savedDesktopTops);
        if (this._savedDesktopColStarts) this.wColStarts.set(this._savedDesktopColStarts);
        if (this._savedDesktopColSpans) this.wColSpans.set(this._savedDesktopColSpans);
        this._savedDesktopTops = null;
        this._savedDesktopColStarts = null;
        this._savedDesktopColSpans = null;
      }
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void);
    window.addEventListener('resize', () => {
      if ((window.innerWidth < 768) !== this.isMobile()) {
        onBreakpointChange(mq);
      }
    });
    onBreakpointChange(mq);
    if (this.isMobile()) {
      this.stackAllForMobile();
    }

    this.fixNavbarLayout();
  }

  private fixNavbarLayout(): void {
    const toolbar = this.elementRef.nativeElement.querySelector('modus-wc-toolbar');
    if (!toolbar?.shadowRoot) {
      setTimeout(() => this.fixNavbarLayout(), 100);
      return;
    }
    const navbarDiv = toolbar.shadowRoot.querySelector('.modus-wc-navbar') as HTMLElement | null;
    const startEl = toolbar.shadowRoot.querySelector('.modus-wc-navbar-start') as HTMLElement | null;
    const endEl = toolbar.shadowRoot.querySelector('.modus-wc-navbar-end') as HTMLElement | null;
    if (navbarDiv) {
      navbarDiv.style.display = 'flex';
      navbarDiv.style.alignItems = 'center';
    }
    if (startEl) {
      startEl.style.flex = '1 1 0%';
      startEl.style.minWidth = '0';
      startEl.style.overflow = 'hidden';
    }
    if (endEl) {
      endEl.style.flex = '0 0 auto';
      endEl.style.marginLeft = 'auto';
    }
  }

  toggleMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
  }

  closeMoreMenu(): void {
    this.moreMenuOpen.set(false);
  }

  moreMenuAction(action: string): void {
    this.closeMoreMenu();
    switch (action) {
      case 'darkmode':
        this.toggleDarkMode();
        break;
      case 'ai':
        this.toggleAiPanel();
        break;
      case 'search':
        this.searchInputOpen.set(true);
        break;
    }
  }

  navigateToProjects(): void {
    this.router.navigate(['/'], { queryParams: { tab: 'projects' } });
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  // Widget grid drag & resize
  onWidgetHeaderMouseDown(id: ProjectWidgetId, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = null;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.wTops()[id];
    this.moveTargetId.set(id);
  }

  onWidgetHeaderTouchStart(id: ProjectWidgetId, event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    const touch = event.touches[0];
    this._moveTarget = id;
    this._dragAxis = null;
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.wTops()[id];
    this.moveTargetId.set(id);
  }

  startWidgetResize(target: ProjectWidgetId, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = event.clientY;
    this._resizeStartX = event.clientX;
    if (dir === 'v' || dir === 'both') {
      this._resizeStartH = this.wHeights()[target];
    }
    if (dir === 'h' || dir === 'both') {
      this._resizeStartColSpan = this.wColSpans()[target];
      this._gridContainerWidth = this.gridRef()?.nativeElement?.offsetWidth ?? 1200;
    }
  }

  startWidgetResizeTouch(target: ProjectWidgetId, dir: 'h' | 'v' | 'both', event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    this._resizeTarget = target;
    this._resizeDir = this.isMobile() ? 'v' : dir;
    this._resizeStartY = touch.clientY;
    this._resizeStartX = touch.clientX;
    if (this._resizeDir === 'v' || this._resizeDir === 'both') {
      this._resizeStartH = this.wHeights()[target];
    }
    if (this._resizeDir === 'h' || this._resizeDir === 'both') {
      this._resizeStartColSpan = this.wColSpans()[target];
      this._gridContainerWidth = this.gridRef()?.nativeElement?.offsetWidth ?? 1200;
    }
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      const id = this._resizeTarget;
      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const newH = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
        this.wHeights.update(h => ({ ...h, [id]: newH }));
        this.resolveCollisions(id);
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const colW = this._gridContainerWidth / 16;
        const deltaSpan = Math.round((event.clientX - this._resizeStartX) / colW);
        const newSpan = Math.max(3, Math.min(16, this._resizeStartColSpan + deltaSpan));
        this.wColSpans.update(s => ({ ...s, [id]: newSpan }));
        this.resolveCollisions(id);
      }
    }
  }

  onDocumentMouseUp(): void {
    const pinnedId = this._moveTarget ?? this._resizeTarget;
    const hadInteraction = !!pinnedId;
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    if (hadInteraction) {
      this.compactAll(pinnedId);
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

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.gridRef()?.nativeElement as HTMLElement | undefined;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;

    if (!this._dragAxis) {
      const dx = Math.abs(event.clientX - this._dragStartX);
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dx < 8 && dy < 8) return;
      this._dragAxis = this.isMobile() ? 'v' : (dx >= dy ? 'h' : 'v');
    }

    if (this._dragAxis === 'h') {
      const rect = grid.getBoundingClientRect();
      const colW = rect.width / 16;
      const span = this.wColSpans()[id];
      const rawStart = Math.floor((event.clientX - rect.left) / colW) + 1;
      const newColStart = Math.max(1, Math.min(17 - span, rawStart));
      if (newColStart !== this.wColStarts()[id]) {
        this.wColStarts.update(s => ({ ...s, [id]: newColStart }));
        this.resolveCollisions(id);
      }
    } else {
      const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
      this.wTops.update(t => ({ ...t, [id]: newTop }));
      this.resolveCollisions(id);
    }
  }

  private resolveCollisions(movedId: ProjectWidgetId): void {
    const tops = { ...this.wTops() };
    const heights = this.wHeights();
    const starts = this.wColStarts();
    const spans = this.wColSpans();
    const gap = ProjectDashboardComponent.GAP_PX;
    const mobile = this.isMobile();
    const colOverlap = (a: ProjectWidgetId, b: ProjectWidgetId) =>
      mobile || (starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a]);

    const nudgeDown = (sourceId: ProjectWidgetId) => {
      const srcBottom = tops[sourceId] + heights[sourceId];
      for (const otherId of this.widgets) {
        if (otherId === sourceId) continue;
        if (!colOverlap(sourceId, otherId)) continue;
        const clearance = srcBottom + gap;
        if (tops[otherId] < clearance && tops[sourceId] < tops[otherId] + heights[otherId]) {
          tops[otherId] = clearance;
          nudgeDown(otherId);
        }
      }
    };
    nudgeDown(movedId);

    const sorted = [...this.widgets].sort((a, b) => tops[a] - tops[b]);
    for (const id of sorted) {
      if (id === movedId) continue;
      let bestTop = 0;
      for (const otherId of sorted) {
        if (otherId === id) continue;
        if (!colOverlap(id, otherId)) continue;
        const otherBottom = tops[otherId] + heights[otherId] + gap;
        if (otherBottom > bestTop && tops[otherId] < tops[id] + heights[id]) {
          bestTop = Math.max(bestTop, otherBottom);
        }
      }
      if (bestTop < tops[id]) {
        tops[id] = bestTop;
      }
    }

    if (this.widgets.some(id => tops[id] !== this.wTops()[id])) {
      this.wTops.set(tops);
    }
  }

  private stackAllForMobile(): void {
    const gap = ProjectDashboardComponent.GAP_PX;
    const heights = this.wHeights();
    const tops = { ...this.wTops() };
    const colStarts = { ...this.wColStarts() };
    const colSpans = { ...this.wColSpans() };
    let y = 0;
    for (const id of this.widgets) {
      tops[id] = y;
      colStarts[id] = 1;
      colSpans[id] = 16;
      y += heights[id] + gap;
    }
    this.wTops.set(tops);
    this.wColStarts.set(colStarts);
    this.wColSpans.set(colSpans);
  }

  private compactAll(pinnedId?: ProjectWidgetId | null): void {
    if (this.isMobile()) {
      this.stackAllForMobile();
      return;
    }
    const gap = ProjectDashboardComponent.GAP_PX;
    const tops = { ...this.wTops() };
    const heights = this.wHeights();
    const starts = this.wColStarts();
    const spans = this.wColSpans();
    const colOverlap = (a: ProjectWidgetId, b: ProjectWidgetId) =>
      starts[a] < starts[b] + spans[b] && starts[b] < starts[a] + spans[a];

    const sorted = [...this.widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: ProjectWidgetId[] = [];
    if (pinnedId) placed.push(pinnedId);

    for (const id of sorted) {
      if (id === pinnedId) continue;
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

    if (this.widgets.some(id => tops[id] !== this.wTops()[id])) {
      this.wTops.set(tops);
    }
  }

  // AI Assistant
  readonly aiPanelOpen = signal(false);
  readonly aiMessages = signal<AiMessage[]>([]);
  readonly aiInputText = signal('');
  readonly aiThinking = signal(false);
  private aiMessageCounter = 0;

  readonly aiSuggestions = [
    'What are the biggest risks right now?',
    'Summarize migration progress',
    'Which tasks are overdue?',
    'How is the budget tracking?',
  ];

  toggleAiPanel(): void {
    this.aiPanelOpen.update(v => !v);
  }

  selectAiSuggestion(suggestion: string): void {
    this.aiInputText.set(suggestion);
    this.sendAiMessage();
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
    }, 800 + Math.random() * 1200);
  }

  handleAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiMessage();
    }
  }

  private generateAiResponse(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('risk')) {
      return 'The highest risk is "Database migration data loss" (HIGH). Mitigation: dual-write pattern with automated reconciliation. "Extended downtime during cutover" is MEDIUM risk with blue-green deployment as the safeguard.';
    }
    if (q.includes('progress') || q.includes('migration') || q.includes('status')) {
      return 'Cloud Infrastructure Migration is 72% complete. 3 of 6 milestones done. Wave 1 production migration is at 78%, Wave 2 at 35%. Cutover & Validation is upcoming. 2 days remain until the Mar 15 deadline.';
    }
    if (q.includes('overdue') || q.includes('task')) {
      return 'No tasks are overdue yet, but 2 high-priority tasks need attention: "Configure load balancer" (due Mar 10) and "Database replication validation" (due Mar 8) are both In Progress. 4 tasks are still in To Do status.';
    }
    if (q.includes('budget') || q.includes('cost') || q.includes('spend')) {
      return 'Budget usage is at $544K of $800K total (68%). At current burn rate, the project should complete within budget. Infrastructure costs are the largest line item.';
    }
    if (q.includes('team') || q.includes('member') || q.includes('availability')) {
      return '6 team members are assigned. Sarah Chen (Lead) and Mike Osei (DevOps) are at 100% availability. James Carter (Security) is at 60% and Tom Evans (Architect) at 40% due to other commitments.';
    }
    return 'I can help with this project\'s risks, migration progress, task status, budget tracking, and team availability. Try asking about a specific area.';
  }

  aiNavButtonClass(): string {
    const base = 'relative navbar-icon-btn';
    return this.aiPanelOpen()
      ? `${base} navbar-icon-btn-active`
      : base;
  }
}
