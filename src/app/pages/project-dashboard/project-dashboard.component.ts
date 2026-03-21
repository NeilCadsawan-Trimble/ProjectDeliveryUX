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
import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { WidgetResizeHandleComponent } from '../../components/widget-resize-handle.component';
import { AiIconComponent } from '../../components/ai-icon.component';

import { ThemeService } from '../../services/theme.service';
import { WidgetLayoutService } from '../../services/widget-layout.service';
import { CanvasResetService } from '../../services/canvas-reset.service';
import {
  PROJECT_DATA,
  type ProjectStatus,
  type MilestoneStatus,
  type TaskPriority,
  type RiskSeverity,
  type Milestone,
  type TeamMember,
  type Task,
  type Risk,
  type ActivityEntry,
  type Drawing,
  type SummaryStat,
  type BudgetBreakdown,
} from '../../data/project-data';

interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

type ProjectWidgetId = 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity';

@Component({
  selector: 'app-project-dashboard',
  imports: [NgTemplateOutlet, TitleCasePipe, ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, ModusUtilityPanelComponent, WidgetResizeHandleComponent, AiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'isPanReady()',
    '[class.canvas-panning]': 'isPanning()',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:touchcancel)': 'onDocumentTouchEnd()',
    '(window:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)',
    '(window:keydown)': 'onKeyDown($event)',
    '(window:keyup)': 'onKeyUp($event)',
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
    <ng-template #dashboardContent>
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

        <!-- Widget grid -->
        <div
          class="relative mb-6"
          [style.height.px]="isMobile() ? mobileGridHeight() : null"
          [style.min-height.px]="!isMobile() ? desktopGridMinHeight() : null"
          #widgetGrid
        >
          @for (wId of widgets; track wId) {
            <div
              [class]="isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'absolute overflow-hidden'"
              [attr.data-widget-id]="wId"
              [style.top.px]="wTops()[wId]"
              [style.left.px]="!isMobile() ? wLefts()[wId] : null"
              [style.width.px]="!isMobile() ? wPixelWidths()[wId] : null"
              [style.height.px]="wHeights()[wId]"
            >
              <div class="relative h-full" [class.opacity-30]="moveTargetId() === wId">

              @switch (wId) {
                @case ('milestones') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('tasks') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('risks') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('drawing') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('budget') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                    <i class="modus-icons text-lg text-primary" aria-hidden="true">bar_graph</i>
                    <div class="text-base font-semibold text-foreground">Budget</div>
                  </div>
                </div>
                <div class="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
                  <div class="flex items-baseline justify-between">
                    <div class="text-3xl font-bold text-foreground">{{ budgetUsed() }}</div>
                    <div class="text-sm text-foreground-60">of {{ budgetTotal() }}</div>
                  </div>
                  <modus-progress [value]="budgetPct()" [max]="100" [className]="budgetHealthy() ? 'progress-primary' : 'progress-danger'" />
                  <div class="grid grid-cols-2 gap-3">
                    @for (item of budgetBreakdown(); track item.label) {
                      <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                        <div class="text-2xs text-foreground-40 uppercase tracking-wide">{{ item.label }}</div>
                        <div class="text-sm font-semibold text-foreground">{{ item.amount }}</div>
                        <div class="text-2xs text-foreground-60">{{ item.pct }}% of spend</div>
                      </div>
                    }
                  </div>
                  <div class="flex items-center gap-2 p-3 rounded-lg" [class]="budgetHealthy() ? 'bg-success-20 border-success' : 'bg-destructive-20 border-destructive'">
                    <i class="modus-icons text-sm" [class]="budgetHealthy() ? 'text-success' : 'text-destructive'" aria-hidden="true">{{ budgetHealthy() ? 'check_circle' : 'warning' }}</i>
                    <div class="text-xs text-foreground">{{ budgetHealthy() ? 'Budget on track' : 'Budget critical' }} -- {{ budgetRemaining() }} remaining</div>
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('team') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('activity') {
              <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0" (mousedown)="onWidgetHeaderMouseDown(wId, $event)" (touchstart)="onWidgetHeaderTouchStart(wId, $event)">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }
              }

              </div>
            </div>
          }
          </div>
    </ng-template>

    @if (isCanvas()) {
      <div class="canvas-host bg-background text-foreground canvas-mode" (mousedown)="onPanMouseDown($event)" (wheel)="onCanvasWheel($event)">
        <div class="canvas-navbar">
          <modus-navbar
            [userCard]="userCard"
            [visibility]="navbarVisibility()"
            [condensed]="false"
            [searchInputOpen]="searchInputOpen()"
            (searchClick)="searchInputOpen.set(!searchInputOpen())"
            (searchInputOpenChange)="searchInputOpen.set($event)"
            (trimbleLogoClick)="navigateToProjects()"
          >
            <div slot="start" class="flex items-center gap-3 w-full min-w-0">
              <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
              <div
                class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
                (click)="navigateToProjects()"
                role="button"
                tabindex="0"
                (keydown.enter)="navigateToProjects()"
              >
                <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
                <div class="text-sm">Projects</div>
              </div>
              <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
              <div class="relative min-w-0 flex-1">
                <div
                  class="flex items-center gap-1 cursor-pointer min-w-0"
                  role="button"
                  tabindex="0"
                  [attr.aria-expanded]="projectDropdownOpen()"
                  aria-haspopup="listbox"
                  (click)="toggleProjectDropdown()"
                  (keydown.enter)="toggleProjectDropdown()"
                >
                  <div class="text-2xl font-semibold text-foreground tracking-wide truncate" [title]="projectName()">{{ projectName() }}</div>
                  <i class="modus-icons text-sm text-foreground-40 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="projectDropdownOpen()" aria-hidden="true">expand_more</i>
                </div>
                @if (projectDropdownOpen()) {
                  <div class="absolute left-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[260px] max-w-[360px] py-1 max-h-[320px] overflow-y-auto" role="listbox" aria-label="Switch project">
                    @for (proj of allProjects; track proj.id) {
                      <div
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150"
                        [class.bg-primary-20]="proj.id === projectId()"
                        [class.text-primary]="proj.id === projectId()"
                        [class.text-foreground]="proj.id !== projectId()"
                        [class.hover:bg-muted]="proj.id !== projectId()"
                        role="option"
                        [attr.aria-selected]="proj.id === projectId()"
                        (click)="switchProject(proj.id)"
                      >
                        <div class="w-2 h-2 rounded-full flex-shrink-0"
                          [class.bg-success]="proj.status === 'On Track'"
                          [class.bg-warning]="proj.status === 'At Risk'"
                          [class.bg-destructive]="proj.status === 'Overdue'"
                          [class.bg-secondary]="proj.status === 'Planning'"
                        ></div>
                        <div class="text-sm truncate">{{ proj.name }}</div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
            <div slot="end" class="flex items-center gap-1">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="AI assistant"
                (click)="toggleAiPanel()"
                (keydown.enter)="toggleAiPanel()"
                tabindex="0"
              >
                <ai-icon variant="nav" [isDark]="isDark()" />
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
                (click)="toggleDarkMode()"
                (keydown.enter)="toggleDarkMode()"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
              </div>
            </div>
          </modus-navbar>
        </div>
        <div class="canvas-navbar-shadow navbar-shadow"></div>

        <div class="canvas-side-nav" [class.expanded]="navExpanded()">
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
            @for (item of sideNavItems; track item.value) {
              <div
                class="custom-side-nav-item"
                [class.selected]="activeNavItem() === item.value"
                (click)="selectNavItem(item.value)"
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
            <div class="relative">
              <div
                class="custom-side-nav-item"
                (click)="toggleResetMenu(); $event.stopPropagation()"
                title="Reset options"
                role="button"
                aria-label="Reset options"
                [attr.aria-expanded]="resetMenuOpen()"
              >
                <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">Reset</div>
                }
              </div>
              @if (resetMenuOpen()) {
                <div class="canvas-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('view'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">window_fit</i>
                    <div class="text-sm">Reset View</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('cleanup'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">group_items</i>
                    <div class="text-sm">Clean Up Overlaps</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                    <div class="text-sm">Reset Widgets</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
        @if (navExpanded()) {
          <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
        }

        <div class="canvas-content" role="main" id="main-content" tabindex="-1"
          [style.transform]="(panOffsetX() || panOffsetY()) ? 'translate(' + panOffsetX() + 'px,' + panOffsetY() + 'px)' : null">
          <div class="py-6 max-w-screen-xl mx-auto">
            <ng-container [ngTemplateOutlet]="dashboardContent" />
          </div>
        </div>
      </div>
    } @else {
    <div class="skip-nav" tabindex="0" role="link" (click)="focusMain()" (keydown.enter)="focusMain()">Skip to main content</div>
    <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <!-- Navbar -->
      <modus-navbar
        [userCard]="userCard"
        [visibility]="navbarVisibility()"
        [condensed]="isMobile()"
        [searchInputOpen]="searchInputOpen()"
        (searchClick)="searchInputOpen.set(!searchInputOpen())"
        (searchInputOpenChange)="searchInputOpen.set($event)"
        (trimbleLogoClick)="navigateToProjects()"
      >
        <div slot="start" class="flex items-center gap-3 w-full min-w-0">
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
          <div class="relative min-w-0 flex-1">
            <div
              class="flex items-center gap-1 cursor-pointer min-w-0"
              role="button"
              tabindex="0"
              [attr.aria-expanded]="projectDropdownOpen()"
              aria-haspopup="listbox"
              (click)="toggleProjectDropdown()"
              (keydown.enter)="toggleProjectDropdown()"
            >
              <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide truncate" [title]="projectName()">{{ projectName() }}</div>
              <i class="modus-icons text-sm text-foreground-40 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="projectDropdownOpen()" aria-hidden="true">expand_more</i>
            </div>
            @if (projectDropdownOpen()) {
              <div class="absolute left-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[260px] max-w-[360px] py-1 max-h-[320px] overflow-y-auto" role="listbox" aria-label="Switch project">
                @for (proj of allProjects; track proj.id) {
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-150"
                    [class.bg-primary-20]="proj.id === projectId()"
                    [class.text-primary]="proj.id === projectId()"
                    [class.text-foreground]="proj.id !== projectId()"
                    [class.hover:bg-muted]="proj.id !== projectId()"
                    role="option"
                    [attr.aria-selected]="proj.id === projectId()"
                    (click)="switchProject(proj.id)"
                  >
                    <div class="w-2 h-2 rounded-full flex-shrink-0"
                      [class.bg-success]="proj.status === 'On Track'"
                      [class.bg-warning]="proj.status === 'At Risk'"
                      [class.bg-destructive]="proj.status === 'Overdue'"
                      [class.bg-secondary]="proj.status === 'Planning'"
                    ></div>
                    <div class="text-sm truncate">{{ proj.name }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
        <div slot="end" class="flex items-center gap-1">
          <!-- AI assistant button -->
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
            role="button"
            aria-label="AI assistant"
            (click)="toggleAiPanel()"
            (keydown.enter)="toggleAiPanel()"
            tabindex="0"
          >
            @if (isDark()) {
              <svg style="height:16px;width:auto" fill="none" viewBox="0 0 887 982" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="ai-nav-grad-dark" cx="18%" cy="18%" r="70%">
                    <stop offset="0%" stop-color="#FF00FF" />
                    <stop offset="50%" stop-color="#9933FF" />
                    <stop offset="100%" stop-color="#0066CC" />
                  </radialGradient>
                </defs>
                <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34zm199.83-634.65-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97m403.73 374.35c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16m45.08-114.58c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2" fill="#fff"/>
                <path d="m320.13 489.53c0 142.28 115.34 257.62 257.62 257.62s257.62-115.34 257.62-257.62-115.34-257.62-257.62-257.62-257.62 115.34-257.62 257.62" fill="url(#ai-nav-grad-dark)" transform="translate(-256, 0)"/>
              </svg>
            } @else {
              <svg style="height:16px;width:auto" fill="none" viewBox="0 0 887 982" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="ai-nav-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="20%" stop-color="#FF00FF" />
                    <stop offset="60%" stop-color="#0066CC" />
                    <stop offset="100%" stop-color="#0066CC" />
                  </linearGradient>
                </defs>
                <path d="m36.76 749.83v231.56l201.3-116.22c-77.25-16.64-147.52-56.92-201.3-115.34z" fill="#0066CC"/>
                <path d="m236.59 115.18-199.83-115.18v230.14c56.05-60.9 128.22-99.28 199.83-114.97z" fill="#FF00FF"/>
                <path d="m685.40 374.91c23.68 75.15 23.76 156.75-.59 232.74l201.86-116.54c-9.54-5.51-189.55-109.44-201.26-116.2z" fill="#0066CC"/>
                <path d="m577.75 489.53c0 142.28-115.34 257.62-257.62 257.62s-257.62-115.34-257.62-257.62 115.34-257.62 257.63-257.62 257.62 115.34 257.62 257.62m62.57-.44c0-176.82-143.34-320.16-320.16-320.16s-320.17 143.33-320.17 320.16 143.34 320.16 320.16 320.16 320.16-143.34 320.16-320.16" fill="url(#ai-nav-grad-light)"/>
              </svg>
            }
          </div>
          <!-- Desktop: dark mode toggle -->
          <div
            class="hidden md:flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
            role="button"
            [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            (click)="toggleDarkMode()"
            (keydown.enter)="toggleDarkMode()"
            tabindex="0"
          >
            <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
          </div>
          <!-- Mobile: more menu with dark mode + other actions -->
          @if (isMobile()) {
            <div class="relative">
              <div
                class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="More options"
                [attr.aria-expanded]="moreMenuOpen()"
                (click)="toggleMoreMenu()"
                (keydown.enter)="toggleMoreMenu()"
                tabindex="0"
              >
                <i class="modus-icons text-xl" aria-hidden="true">more_vertical</i>
              </div>
              @if (moreMenuOpen()) {
                <div class="absolute right-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="moreMenuAction('search')"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">search</i>
                    <div class="text-sm">Search</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="moreMenuAction('notifications')"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">notifications</i>
                    <div class="text-sm">Notifications</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="moreMenuAction('help')"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">help</i>
                    <div class="text-sm">Help</div>
                  </div>
                  <div class="border-bottom-default mx-3 my-1"></div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="moreMenuAction('darkMode')"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
                    <div class="text-sm">{{ isDark() ? 'Light Mode' : 'Dark Mode' }}</div>
                  </div>
                </div>
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
          <div class="px-4 py-4 md:px-0 md:py-6 max-w-screen-xl mx-auto">
            <ng-container [ngTemplateOutlet]="dashboardContent" />
          </div>
        </div>
      </div>

      <!-- Custom Side Navigation -->
      @if (!isMobile() || navExpanded()) {
        <div class="custom-side-nav" [class.expanded]="navExpanded()">
          <div class="flex flex-col flex-1 min-h-0">
            @for (item of sideNavItems; track item.value) {
              <div
                class="custom-side-nav-item"
                [class.selected]="activeNavItem() === item.value"
                (click)="selectNavItem(item.value)"
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
        </div>
      }
      @if (navExpanded()) {
        <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
      }

    </div>
    }

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
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly elementRef = inject(ElementRef);
  private readonly layoutService = inject(WidgetLayoutService);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _abortCtrl = new AbortController();
  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this._abortCtrl.abort());
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

  readonly isMobile = signal(false);
  readonly isCanvas = signal(typeof window !== 'undefined' ? window.innerWidth >= 2000 : false);
  readonly isPanReady = signal(false);
  readonly isPanning = signal(false);
  readonly panOffsetX = signal(0);
  readonly panOffsetY = signal(0);
  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartOffsetX = 0;
  private _panStartOffsetY = 0;
  readonly searchInputOpen = signal(false);
  readonly navExpanded = signal(false);
  readonly activeNavItem = signal<string>('dashboard');
  readonly resetMenuOpen = signal(false);

  readonly sideNavItems = [
    { value: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { value: 'milestones', label: 'Milestones', icon: 'flag' },
    { value: 'tasks', label: 'Tasks', icon: 'clipboard' },
    { value: 'risks', label: 'Risks', icon: 'warning' },
    { value: 'drawing', label: 'Drawings', icon: 'floorplan' },
    { value: 'budget', label: 'Budget', icon: 'bar_graph' },
    { value: 'team', label: 'Team', icon: 'people_group' },
    { value: 'activity', label: 'Activity', icon: 'history' },
  ];

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
  readonly wLefts = signal<Record<ProjectWidgetId, number>>({
    milestones: 0, tasks: 0, risks: 0,
    drawing: 891, budget: 891, team: 891, activity: 891,
  });
  readonly wPixelWidths = signal<Record<ProjectWidgetId, number>>({
    milestones: 875, tasks: 875, risks: 875,
    drawing: 389, budget: 389, team: 389, activity: 389,
  });
  readonly moveTargetId = signal<ProjectWidgetId | null>(null);

  readonly mobileGridHeight = computed(() => {
    const tops = this.wTops();
    const heights = this.wHeights();
    let max = 0;
    for (const id of this.widgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max;
  });

  readonly desktopGridMinHeight = computed(() => {
    const tops = this.wTops();
    const heights = this.wHeights();
    let max = 0;
    for (const id of this.widgets) {
      max = Math.max(max, tops[id] + heights[id]);
    }
    return max + 200;
  });

  private _moveTarget: ProjectWidgetId | null = null;
  private _dragAxis: 'v' | 'free' | null = null;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragStartTop = 0;
  private _dragStartLeft = 0;
  private _resizeTarget: ProjectWidgetId | null = null;
  private _resizeDir: 'h' | 'v' | 'both' = 'v';
  private _resizeStartX = 0;
  private _resizeStartY = 0;
  private _resizeStartH = 0;
  private _resizeStartW = 0;
  private _savedDesktopTops: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopColStarts: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopColSpans: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopHeights: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopLefts: Record<ProjectWidgetId, number> | null = null;
  private _savedDesktopWidths: Record<ProjectWidgetId, number> | null = null;

  readonly navbarVisibility = computed(() => {
    const mobile = this.isMobile();
    const canvas = this.isCanvas();
    return {
      user: true,
      mainMenu: !canvas,
      ai: false,
      notifications: !mobile,
      apps: false,
      help: !mobile,
      search: !mobile,
      searchInput: !mobile,
    };
  });

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

  readonly projectId = signal(1);

  private readonly projectData = computed(() => PROJECT_DATA[this.projectId()] ?? PROJECT_DATA[1]);

  readonly projectName = computed(() => this.projectData().name);
  readonly projectStatus = computed(() => this.projectData().status);
  readonly summaryStats = computed(() => this.projectData().summaryStats);
  readonly milestones = computed(() => this.projectData().milestones);
  readonly tasks = computed(() => this.projectData().tasks);
  readonly risks = computed(() => this.projectData().risks);
  readonly team = computed(() => this.projectData().team);
  readonly activity = computed(() => this.projectData().activity);
  readonly latestDrawing = computed(() => this.projectData().latestDrawing);
  readonly budgetBreakdown = computed(() => this.projectData().budgetBreakdown);
  readonly budgetUsed = computed(() => this.projectData().budgetUsed);
  readonly budgetTotal = computed(() => this.projectData().budgetTotal);
  readonly budgetPct = computed(() => this.projectData().budgetPct);

  readonly completedMilestones = computed(() =>
    this.milestones().filter(ms => ms.status === 'completed').length
  );

  readonly openTaskCount = computed(() =>
    this.tasks().filter(t => t.status !== 'Done').length
  );

  readonly budgetRemaining = computed(() => {
    const total = this.budgetTotal().replace(/[^0-9.KMkm]/g, '');
    const used = this.budgetUsed().replace(/[^0-9.KMkm]/g, '');
    const parseVal = (v: string) => {
      if (v.endsWith('K') || v.endsWith('k')) return parseFloat(v) * 1000;
      if (v.endsWith('M') || v.endsWith('m')) return parseFloat(v) * 1000000;
      return parseFloat(v);
    };
    const diff = parseVal(total) - parseVal(used);
    if (diff >= 1_000_000) return `$${(diff / 1_000_000).toFixed(1)}M`;
    if (diff >= 1_000) return `$${Math.round(diff / 1_000)}K`;
    return `$${Math.round(diff)}`;
  });

  readonly budgetHealthy = computed(() => this.budgetPct() < 90);

  readonly gridLines = Array.from({ length: 21 }, (_, i) => i);

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
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) this.projectId.set(Number(idParam));

    const startMobile = window.innerWidth < 768;
    this.isMobile.set(startMobile);
    this.isCanvas.set(window.innerWidth >= 2000);

    if (startMobile) {
      this.restoreDesktopLayout();
      this._savedDesktopTops = { ...this.wTops() };
      this._savedDesktopColStarts = { ...this.wColStarts() };
      this._savedDesktopColSpans = { ...this.wColSpans() };
      this._savedDesktopHeights = { ...this.wHeights() };
      this._savedDesktopLefts = { ...this.wLefts() };
      this._savedDesktopWidths = { ...this.wPixelWidths() };
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
    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const wasMobile = this.isMobile();
      this.isMobile.set(e.matches);
      if (e.matches && !wasMobile) {
        this._savedDesktopTops = { ...this.wTops() };
        this._savedDesktopColStarts = { ...this.wColStarts() };
        this._savedDesktopColSpans = { ...this.wColSpans() };
        this._savedDesktopHeights = { ...this.wHeights() };
        this._savedDesktopLefts = { ...this.wLefts() };
        this._savedDesktopWidths = { ...this.wPixelWidths() };
        const restoredMobile = this.restoreMobileLayout();
        if (restoredMobile) {
          this.compactAll();
        } else {
          this.stackAllForMobile();
        }
      } else if (!e.matches && wasMobile) {
        this.persistLayout();
        if (this._savedDesktopTops) {
          this.wTops.set(this._savedDesktopTops);
          if (this._savedDesktopColStarts) this.wColStarts.set(this._savedDesktopColStarts);
          if (this._savedDesktopColSpans) this.wColSpans.set(this._savedDesktopColSpans);
          if (this._savedDesktopHeights) this.wHeights.set(this._savedDesktopHeights);
          if (this._savedDesktopLefts) this.wLefts.set(this._savedDesktopLefts);
          if (this._savedDesktopWidths) this.wPixelWidths.set(this._savedDesktopWidths);
          this._savedDesktopTops = null;
          this._savedDesktopColStarts = null;
          this._savedDesktopColSpans = null;
          this._savedDesktopHeights = null;
          this._savedDesktopLefts = null;
          this._savedDesktopWidths = null;
        } else {
          this.restoreDesktopLayout();
        }
      }
      if (!e.matches) {
        this.navExpanded.set(false);
      }
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    const mqCanvas = window.matchMedia('(min-width: 2000px)');
    const onCanvasChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isCanvas.set(e.matches);
    };
    mqCanvas.addEventListener('change', onCanvasChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    window.addEventListener('resize', () => {
      if ((window.innerWidth < 768) !== this.isMobile()) {
        onBreakpointChange(mq);
      }
      const canvas = window.innerWidth >= 2000;
      if (canvas !== this.isCanvas()) {
        onCanvasChange(mqCanvas);
      }
    }, { signal: this._abortCtrl.signal });

    document.addEventListener('touchmove', (e: TouchEvent) => {
      if (this._moveTarget || this._resizeTarget) {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
          this.onDocumentMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
        }
      }
    }, { passive: false });

    this.fixNavbarLayout();
    this.reorderNavbarEnd();
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

  private reorderNavbarEnd(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    const tryReorder = () => {
      const shadow = navbarWc.shadowRoot;
      if (!shadow) { requestAnimationFrame(tryReorder); return; }
      const endDiv = shadow.querySelector('div[slot="end"]') as HTMLElement | null;
      if (!endDiv) { requestAnimationFrame(tryReorder); return; }
      const endSlot = endDiv.querySelector(':scope > slot[name="end"]') as HTMLElement | null;
      if (endSlot) endSlot.style.order = '1';
      for (const child of Array.from(endDiv.children)) {
        const el = child as HTMLElement;
        const label = el.getAttribute('aria-label') || '';
        if (label === 'User profile') {
          el.style.order = '2';
        }
      }
      const userMenu = endDiv.querySelector(':scope > div.user') as HTMLElement | null;
      if (userMenu) userMenu.style.order = '2';
    };
    requestAnimationFrame(tryReorder);
  }

  focusMain(): void {
    const main = document.getElementById('main-content');
    if (main) main.focus();
  }

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  selectNavItem(value: string): void {
    this.activeNavItem.set(value);
    this.navExpanded.set(false);
    if (value === 'dashboard') {
      const contentEl = document.getElementById('main-content');
      if (contentEl) contentEl.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const widgetEl = this.elementRef.nativeElement.querySelector(`[data-widget-id="${value}"]`);
    if (widgetEl) {
      widgetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Widget grid drag & resize
  onWidgetHeaderMouseDown(id: ProjectWidgetId, event: MouseEvent): void {
    event.preventDefault();
    this._moveTarget = id;
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragStartTop = this.wTops()[id];
    this._dragStartLeft = this.wLefts()[id] ?? 0;
    this.moveTargetId.set(id);
  }

  onWidgetHeaderTouchStart(id: ProjectWidgetId, event: TouchEvent): void {
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
    this._dragAxis = this.isMobile() ? null : 'free';
    this._dragStartX = touch.clientX;
    this._dragStartY = touch.clientY;
    this._dragStartTop = this.wTops()[id];
    this._dragStartLeft = this.wLefts()[id] ?? 0;
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
      this._resizeStartW = this.wPixelWidths()[target] ?? 600;
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
      this._resizeStartW = this.wPixelWidths()[target] ?? 600;
    }
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      const dx = event.clientX - this._panStartX;
      const dy = event.clientY - this._panStartY;
      this.panOffsetX.set(this._panStartOffsetX + dx);
      this.panOffsetY.set(this._panStartOffsetY + dy);
      return;
    }
    if (this._moveTarget) {
      this.handleWidgetMove(event);
    } else if (this._resizeTarget) {
      const id = this._resizeTarget;
      if (this._resizeDir === 'v' || this._resizeDir === 'both') {
        const raw = Math.max(200, this._resizeStartH + (event.clientY - this._resizeStartY));
        const newH = Math.round(raw / 16) * 16;
        this.wHeights.update(h => ({ ...h, [id]: newH }));
      }
      if (this._resizeDir === 'h' || this._resizeDir === 'both') {
        const raw = Math.max(200, this._resizeStartW + (event.clientX - this._resizeStartX));
        const newW = Math.round(raw / 16) * 16;
        this.wPixelWidths.update(w => ({ ...w, [id]: newW }));
      }
      this.resolveCollisions(id);
    }
  }

  onDocumentMouseUp(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
      return;
    }
    const hadInteraction = !!this._moveTarget || !!this._resizeTarget;
    this._moveTarget = null;
    this._dragAxis = null;
    this.moveTargetId.set(null);
    this._resizeTarget = null;
    if (hadInteraction) {
      this.compactAll();
      this.persistLayout();
    }
  }

  onDocumentTouchEnd(): void {
    this.onDocumentMouseUp();
  }

  // ── Layout persistence ──

  private get layoutKey(): string {
    return `project-${this.projectId()}`;
  }

  private persistLayout(): void {
    const mobile = this.isMobile();
    this.layoutService.save(this.layoutKey, mobile, {
      tops: this.wTops(),
      heights: this.wHeights(),
      colStarts: this.wColStarts(),
      colSpans: this.wColSpans(),
      lefts: this.wLefts(),
      widths: this.wPixelWidths(),
    });
  }

  private restoreDesktopLayout(): boolean {
    const saved = this.layoutService.load(this.layoutKey, false);
    if (!saved) return false;
    this.wTops.set(saved.tops as Record<ProjectWidgetId, number>);
    this.wHeights.set(saved.heights as Record<ProjectWidgetId, number>);
    this.wColStarts.set(saved.colStarts as Record<ProjectWidgetId, number>);
    this.wColSpans.set(saved.colSpans as Record<ProjectWidgetId, number>);
    if (saved.lefts) this.wLefts.set(saved.lefts as Record<ProjectWidgetId, number>);
    if (saved.widths) this.wPixelWidths.set(saved.widths as Record<ProjectWidgetId, number>);
    return true;
  }

  private restoreMobileLayout(): boolean {
    const saved = this.layoutService.load(this.layoutKey, true);
    if (!saved) return false;
    this.wTops.set(saved.tops as Record<ProjectWidgetId, number>);
    this.wHeights.set(saved.heights as Record<ProjectWidgetId, number>);
    this.wColStarts.set(saved.colStarts as Record<ProjectWidgetId, number>);
    this.wColSpans.set(saved.colSpans as Record<ProjectWidgetId, number>);
    return true;
  }

  private handleWidgetMove(event: MouseEvent): void {
    const grid = this.gridRef()?.nativeElement as HTMLElement | undefined;
    if (!grid || !this._moveTarget) return;
    const id = this._moveTarget;
    const gap = ProjectDashboardComponent.GAP_PX;

    if (this._dragAxis === 'free') {
      const rawTop = this._dragStartTop + (event.clientY - this._dragStartY);
      const rawLeft = this._dragStartLeft + (event.clientX - this._dragStartX);
      const newTop = Math.round(rawTop / gap) * gap;
      const newLeft = Math.round(rawLeft / gap) * gap;
      this.wTops.update(t => ({ ...t, [id]: newTop }));
      this.wLefts.update(l => ({ ...l, [id]: newLeft }));
      this.resolveCollisions(id);
      return;
    }

    if (!this._dragAxis) {
      const dy = Math.abs(event.clientY - this._dragStartY);
      if (dy < 8) return;
      this._dragAxis = 'v';
    }

    const newTop = Math.max(0, this._dragStartTop + (event.clientY - this._dragStartY));
    this.wTops.update(t => ({ ...t, [id]: newTop }));
    this.resolveCollisions(id);
  }

  private resolveCollisions(movedId: ProjectWidgetId): void {
    const tops = { ...this.wTops() };
    const heights = this.wHeights();
    const gap = ProjectDashboardComponent.GAP_PX;
    const mobile = this.isMobile();
    let colOverlap: (a: ProjectWidgetId, b: ProjectWidgetId) => boolean;
    if (mobile) {
      colOverlap = () => true;
    } else {
      const lefts = this.wLefts();
      const widths = this.wPixelWidths();
      colOverlap = (a, b) => lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];
    }

    const sorted = [...this.widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: ProjectWidgetId[] = [movedId];

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

  private compactAll(): void {
    const gap = ProjectDashboardComponent.GAP_PX;
    const tops = { ...this.wTops() };
    const heights = this.wHeights();
    const mobile = this.isMobile();

    if (mobile) {
      const sorted = [...this.widgets].sort((a, b) => tops[a] - tops[b]);
      let y = 0;
      for (const id of sorted) {
        tops[id] = y;
        y += heights[id] + gap;
      }
      this.wTops.set(tops);
      return;
    }

    const lefts = this.wLefts();
    const widths = this.wPixelWidths();
    const colOverlap = (a: ProjectWidgetId, b: ProjectWidgetId) =>
      lefts[a] < lefts[b] + widths[b] && lefts[b] < lefts[a] + widths[a];

    const sorted = [...this.widgets].sort((a, b) => tops[a] - tops[b]);
    const placed: ProjectWidgetId[] = [];

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

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  // ── Project Dropdown ──
  readonly projectDropdownOpen = signal(false);
  readonly allProjects = Object.entries(PROJECT_DATA).map(([id, data]) => ({
    id: Number(id),
    name: data.name,
    status: data.status,
  }));

  toggleProjectDropdown(): void {
    this.projectDropdownOpen.update(v => !v);
  }

  private readonly defaultTops: Record<ProjectWidgetId, number> = {
    milestones: 0, tasks: 536, risks: 952,
    drawing: 0, budget: 436, team: 902, activity: 1318,
  };
  private readonly defaultHeights: Record<ProjectWidgetId, number> = {
    milestones: 520, tasks: 400, risks: 350,
    drawing: 420, budget: 450, team: 400, activity: 350,
  };
  private readonly defaultColStarts: Record<ProjectWidgetId, number> = {
    milestones: 1, tasks: 1, risks: 1,
    drawing: 12, budget: 12, team: 12, activity: 12,
  };
  private readonly defaultColSpans: Record<ProjectWidgetId, number> = {
    milestones: 11, tasks: 11, risks: 11,
    drawing: 5, budget: 5, team: 5, activity: 5,
  };
  private readonly defaultLefts: Record<ProjectWidgetId, number> = {
    milestones: 0, tasks: 0, risks: 0,
    drawing: 891, budget: 891, team: 891, activity: 891,
  };
  private readonly defaultPixelWidths: Record<ProjectWidgetId, number> = {
    milestones: 875, tasks: 875, risks: 875,
    drawing: 389, budget: 389, team: 389, activity: 389,
  };

  switchProject(id: number): void {
    this.projectDropdownOpen.set(false);
    if (id !== this.projectId()) {
      this.persistLayout();
      this.projectId.set(id);
      const mobile = this.isMobile();
      if (mobile) {
        const restored = this.restoreMobileLayout();
        if (restored) {
          this.compactAll();
        } else {
          this.stackAllForMobile();
        }
      } else {
        const restored = this.restoreDesktopLayout();
        if (!restored) {
          this.wTops.set({ ...this.defaultTops });
          this.wHeights.set({ ...this.defaultHeights });
          this.wColStarts.set({ ...this.defaultColStarts });
          this.wColSpans.set({ ...this.defaultColSpans });
          this.wLefts.set({ ...this.defaultLefts });
          this.wPixelWidths.set({ ...this.defaultPixelWidths });
        }
      }
      this.router.navigate(['/project', id], { replaceUrl: true });
    }
  }

  // ── Mobile More Menu ──
  readonly moreMenuOpen = signal(false);

  toggleMoreMenu(): void {
    this.moreMenuOpen.update(v => !v);
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
      case 'darkMode':
        this.toggleDarkMode();
        break;
    }
  }

  onEscapeKey(): void {
    if (this.resetMenuOpen()) {
      this.resetMenuOpen.set(false);
    } else if (this.projectDropdownOpen()) {
      this.projectDropdownOpen.set(false);
    } else if (this.moreMenuOpen()) {
      this.moreMenuOpen.set(false);
    } else if (this.aiPanelOpen()) {
      this.aiPanelOpen.set(false);
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    }
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.resetMenuOpen() && !target.closest('[aria-label="Reset options"]') && !target.closest('.canvas-reset-flyout')) {
      this.resetMenuOpen.set(false);
    }
    if (this.projectDropdownOpen() && !target.closest('[aria-haspopup="listbox"]') && !target.closest('[role="option"]')) {
      this.projectDropdownOpen.set(false);
    }
    if (this.moreMenuOpen() && !target.closest('[aria-label="More options"]') && !target.closest('[role="menuitem"]')) {
      this.moreMenuOpen.set(false);
    }
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets' | 'cleanup'): void {
    this.resetMenuOpen.set(false);
    if (action === 'view') {
      this.resetCanvasView();
    } else if (action === 'widgets') {
      this.resetCanvasView();
      this.resetWidgetsToDefaults();
    } else if (action === 'cleanup') {
      this.cleanupCanvasOverlaps();
    }
  }

  resetCanvasView(): void {
    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
  }

  private resetWidgetsToDefaults(): void {
    this.wTops.set({ ...this.defaultTops });
    this.wHeights.set({ ...this.defaultHeights });
    this.wColStarts.set({ ...this.defaultColStarts });
    this.wColSpans.set({ ...this.defaultColSpans });
    this.wLefts.set({ ...this.defaultLefts });
    this.wPixelWidths.set({ ...this.defaultPixelWidths });
    this.persistLayout();
  }

  private cleanupCanvasOverlaps(): void {
    this.compactAll();
    this.persistLayout();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code !== 'Space' || !this.isCanvas()) return;
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (event.target as HTMLElement)?.isContentEditable) return;
    event.preventDefault();
    if (!event.repeat) {
      this.isPanReady.set(true);
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code !== 'Space') return;
    event.preventDefault();
    this.isPanReady.set(false);
    this.isPanning.set(false);
  }

  onPanMouseDown(event: MouseEvent): void {
    if (!this.isPanReady()) return;
    event.preventDefault();
    this.isPanning.set(true);
    this._panStartX = event.clientX;
    this._panStartY = event.clientY;
    this._panStartOffsetX = this.panOffsetX();
    this._panStartOffsetY = this.panOffsetY();
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.panOffsetX.update((x) => x - event.deltaX);
    this.panOffsetY.update((y) => y - event.deltaY);
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
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
      return `Budget usage is at ${this.budgetUsed()} of ${this.budgetTotal()} total (${this.budgetPct()}%). ${this.budgetHealthy() ? 'At current burn rate, the project should complete within budget.' : 'Budget is in critical state and may require additional funding.'}`;
    }
    if (q.includes('team') || q.includes('member') || q.includes('availability')) {
      return '6 team members are assigned. Sarah Chen (Lead) and Mike Osei (DevOps) are at 100% availability. James Carter (Security) is at 60% and Tom Evans (Architect) at 40% due to other commitments.';
    }
    return 'I can help with this project\'s risks, migration progress, task status, budget tracking, and team availability. Try asking about a specific area.';
  }

}
