import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { AiIconComponent } from '../../shell/components/ai-icon.component';

import { Subscription } from 'rxjs';
import { ThemeService } from '../../shell/services/theme.service';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { AiService, type AiChatMessage } from '../../services/ai.service';
import {
  type ProjectDashboardData,
  type ProjectStatus,
  type MilestoneStatus,
  type TaskPriority,
  type RiskSeverity,
} from '../../data/project-data';
import { PROJECTS, type AiMessage } from '../../data/dashboard-data';

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
        <div #pageHeader class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
          [class]="isCanvas() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
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
              [style.z-index]="wZIndices()[wId] ?? 0"
            >
              <div class="relative h-full" [class.opacity-30]="moveTargetId() === wId">

              @switch (wId) {
                @case ('milestones') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('tasks') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('risks') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('drawing') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('budget') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('team') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)" />
              </div>
                }

                @case ('activity') {
              <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== wId" [class.border-primary]="selectedWidgetId() === wId">
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
                <widget-resize-handle [isMobile]="isMobile()" position="left" (resizeStart)="startWidgetResize(wId, 'both', $event, 'left')" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event, 'left')" />
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
            (trimbleLogoClick)="navigateHome()"
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
                  class="flex items-center gap-1 cursor-pointer select-none"
                  role="button"
                  [attr.aria-expanded]="projectSelectorOpen()"
                  [attr.aria-label]="projectName()"
                  (click)="toggleProjectSelector(); $event.stopPropagation()"
                  (keydown.enter)="toggleProjectSelector(); $event.stopPropagation()"
                  tabindex="0"
                >
                  <div class="text-2xl font-semibold text-foreground tracking-wide truncate" [title]="projectName()">{{ projectName() }}</div>
                  <i class="modus-icons text-base text-foreground-60 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="projectSelectorOpen()" aria-hidden="true">expand_more</i>
                </div>
                @if (projectSelectorOpen()) {
                  <div class="absolute top-full left-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[260px] max-w-[340px] py-1" role="listbox" aria-label="Switch project">
                    @for (proj of otherProjects(); track proj.id) {
                      <div
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                        role="option"
                        [attr.aria-label]="proj.name"
                        (click)="navigateToProject(proj.slug); $event.stopPropagation()"
                      >
                        <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="statusDotClass(proj.status)"></div>
                        <div class="min-w-0 flex-1">
                          <div class="text-sm font-medium text-foreground truncate">{{ proj.name }}</div>
                          <div class="text-xs text-foreground-60 truncate">{{ proj.client }}</div>
                        </div>
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
                    (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                    <div class="text-sm">Reset Layout</div>
                  </div>
                </div>
              }
            </div>
            <div
              class="custom-side-nav-item"
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
        (trimbleLogoClick)="navigateHome()"
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
              class="flex items-center gap-1 cursor-pointer select-none"
              role="button"
              [attr.aria-expanded]="projectSelectorOpen()"
              [attr.aria-label]="projectName()"
              (click)="toggleProjectSelector(); $event.stopPropagation()"
              (keydown.enter)="toggleProjectSelector(); $event.stopPropagation()"
              tabindex="0"
            >
              <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide truncate" [title]="projectName()">{{ projectName() }}</div>
              <i class="modus-icons text-base text-foreground-60 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="projectSelectorOpen()" aria-hidden="true">expand_more</i>
            </div>
            @if (projectSelectorOpen()) {
              <div class="absolute top-full left-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[260px] max-w-[340px] py-1" role="listbox" aria-label="Switch project">
                @for (proj of otherProjects(); track proj.id) {
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                    role="option"
                    [attr.aria-label]="proj.name"
                    (click)="navigateToProject(proj.slug); $event.stopPropagation()"
                  >
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="statusDotClass(proj.status)"></div>
                    <div class="min-w-0 flex-1">
                      <div class="text-sm font-medium text-foreground truncate">{{ proj.name }}</div>
                      <div class="text-xs text-foreground-60 truncate">{{ proj.client }}</div>
                    </div>
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
          <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">
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
          <div class="mt-auto border-top-default">
            <div
              class="custom-side-nav-item"
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
            <div class="text-base font-semibold text-foreground">{{ widgetFocusService.aiAssistantTitle() }}</div>
            <div class="text-xs text-foreground-60">{{ widgetFocusService.aiAssistantSubtitle() }}</div>
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
              @for (suggestion of aiSuggestions(); track suggestion) {
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
  private readonly elementRef = inject(ElementRef);
  private readonly canvasResetService = inject(CanvasResetService);
  readonly widgetFocusService = inject(WidgetFocusService);
  private readonly aiService = inject(AiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectData = input.required<ProjectDashboardData>();
  readonly projectId = input<number>(1);

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['milestones', 'tasks', 'risks', 'drawing', 'budget', 'team', 'activity'],
    layoutStorageKey: () => `project-${this.projectId()}`,
    canvasStorageKey: () => `canvas-layout:project-${this.projectId()}:v1`,
    defaultColStarts: { milestones: 1, tasks: 1, risks: 1, drawing: 12, budget: 12, team: 12, activity: 12 },
    defaultColSpans: { milestones: 11, tasks: 11, risks: 11, drawing: 5, budget: 5, team: 5, activity: 5 },
    defaultTops: { milestones: 0, tasks: 536, risks: 952, drawing: 0, budget: 436, team: 902, activity: 1318 },
    defaultHeights: { milestones: 520, tasks: 400, risks: 350, drawing: 420, budget: 450, team: 400, activity: 350 },
    defaultLefts: { milestones: 0, tasks: 0, risks: 0, drawing: 891, budget: 891, team: 891, activity: 891 },
    defaultPixelWidths: { milestones: 875, tasks: 875, risks: 875, drawing: 389, budget: 389, team: 389, activity: 389 },
    canvasDefaultLefts: { milestones: 0, tasks: 0, risks: 0, drawing: 891, budget: 891, team: 891, activity: 891 },
    canvasDefaultPixelWidths: { milestones: 875, tasks: 875, risks: 875, drawing: 389, budget: 389, team: 389, activity: 389 },
    canvasDefaultTops: { milestones: 0, tasks: 536, risks: 952, drawing: 0, budget: 436, team: 902, activity: 1318 },
    canvasDefaultHeights: { milestones: 520, tasks: 400, risks: 350, drawing: 420, budget: 450, team: 400, activity: 350 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => this.engine.resetToDefaults());
    }
  });

  private _prevProjectId: number | null = null;
  private readonly _projectChangeEffect = effect(() => {
    const id = this.projectId();
    if (this._prevProjectId !== null && this._prevProjectId !== id) {
      const prevId = this._prevProjectId;
      untracked(() => this.engine.reinitLayout(
        `project-${prevId}`,
        `canvas-layout:project-${prevId}:v1`,
      ));
    }
    this._prevProjectId = id;
  });

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

  readonly isMobile = this.engine.isMobile;
  readonly isCanvas = this.engine.isCanvasMode;
  readonly wTops = this.engine.widgetTops;
  readonly wHeights = this.engine.widgetHeights;
  readonly wLefts = this.engine.widgetLefts;
  readonly wPixelWidths = this.engine.widgetPixelWidths;
  readonly wZIndices = this.engine.widgetZIndices;
  readonly wColStarts = this.engine.widgetColStarts;
  readonly wColSpans = this.engine.widgetColSpans;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly mobileGridHeight = computed(() => this.engine.mobileGridHeight());
  readonly desktopGridMinHeight = this.engine.canvasGridMinHeight;

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

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');
  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');

  readonly widgets: ProjectWidgetId[] = ['milestones', 'tasks', 'risks', 'drawing', 'budget', 'team', 'activity'];
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

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

  readonly projectName = computed(() => this.projectData().name);
  readonly projectStatus = computed(() => this.projectData().status);

  readonly projectSelectorOpen = signal(false);
  readonly otherProjects = computed(() =>
    PROJECTS.filter(p => p.id !== this.projectId())
  );
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
    this.engine.gridElAccessor = () => this.gridRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();

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

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  toggleProjectSelector(): void {
    this.projectSelectorOpen.update(v => !v);
  }

  navigateToProject(slug: string): void {
    this.projectSelectorOpen.set(false);
    this.router.navigate(['/project', slug]);
  }

  statusDotClass(status: ProjectStatus): string {
    const map: Record<ProjectStatus, string> = {
      'On Track': 'bg-success',
      'At Risk': 'bg-warning',
      'Overdue': 'bg-destructive',
      'Planning': 'bg-secondary',
    };
    return map[status];
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

  onWidgetHeaderMouseDown(id: ProjectWidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: ProjectWidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: ProjectWidgetId, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResize(target, dir, event, edge);
  }

  startWidgetResizeTouch(target: ProjectWidgetId, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResizeTouch(target, dir, event, edge);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this.isPanning()) {
      const dx = event.clientX - this._panStartX;
      const dy = event.clientY - this._panStartY;
      this.panOffsetX.set(this._panStartOffsetX + dx);
      this.panOffsetY.set(this._panStartOffsetY + dy);
      return;
    }
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
      return;
    }
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
      return;
    }
    this.engine.onDocumentTouchEnd();
  }


  // AI Assistant
  readonly aiPanelOpen = signal(false);
  readonly aiMessages = signal<AiMessage[]>([]);
  readonly aiInputText = signal('');
  readonly aiThinking = signal(false);
  private aiMessageCounter = 0;
  private aiStreamSub: Subscription | null = null;

  private readonly defaultAiSuggestions = [
    'What are the biggest risks right now?',
    'Summarize migration progress',
    'Which tasks are overdue?',
    'How is the budget tracking?',
  ];

  readonly aiSuggestions = computed(() =>
    this.widgetFocusService.aiSuggestions() ?? this.defaultAiSuggestions
  );

  private readonly _clearMessagesOnWidgetChange = effect(() => {
    this.widgetFocusService.selectedWidgetId();
    this.aiStreamSub?.unsubscribe();
    this.aiStreamSub = null;
    this.aiMessages.set([]);
    this.aiThinking.set(false);
  });

  toggleAiPanel(): void {
    this.aiPanelOpen.update(v => !v);
  }

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

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
    if (this.projectSelectorOpen()) {
      this.projectSelectorOpen.set(false);
    } else if (this.resetMenuOpen()) {
      this.resetMenuOpen.set(false);
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
    if (this.widgetFocusService.selectedWidgetId() && !target.closest('[data-widget-id]')) {
      this.widgetFocusService.clearSelection();
    }
    if (this.resetMenuOpen() && !target.closest('[aria-label="Reset options"]') && !target.closest('.canvas-reset-flyout')) {
      this.resetMenuOpen.set(false);
    }
    if (this.moreMenuOpen() && !target.closest('[aria-label="More options"]') && !target.closest('[role="menuitem"]')) {
      this.moreMenuOpen.set(false);
    }
    if (this.projectSelectorOpen() && !target.closest('[role="listbox"]') && !target.closest('[aria-expanded]')) {
      this.projectSelectorOpen.set(false);
    }
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets'): void {
    this.resetMenuOpen.set(false);
    if (action === 'view') {
      this.resetCanvasView();
    } else if (action === 'widgets') {
      this.resetCanvasView();
      this.resetWidgetsToDefaults();
    }
  }

  resetCanvasView(): void {
    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
  }

  private resetWidgetsToDefaults(): void {
    this.engine.resetToDefaults();
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

    this.aiStreamSub?.unsubscribe();

    this.aiMessages.update(msgs => [
      ...msgs,
      { id: ++this.aiMessageCounter, role: 'user', text },
    ]);
    this.aiInputText.set('');
    this.aiThinking.set(true);

    const assistantMsgId = ++this.aiMessageCounter;
    this.aiMessages.update(msgs => [
      ...msgs,
      { id: assistantMsgId, role: 'assistant', text: '', streaming: true },
    ]);

    const history: AiChatMessage[] = this.aiMessages()
      .filter(m => m.id !== assistantMsgId)
      .map(m => ({ role: m.role, content: m.text }));

    const context = this.aiService.buildContext('project-dashboard', {
      projectName: this.projectName(),
      projectData: this.buildProjectContextData(),
    });

    this.aiStreamSub = this.aiService.sendMessage(text, history, context).subscribe({
      next: (chunk) => {
        this.aiMessages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text + chunk } : m),
        );
      },
      error: () => {
        this.aiMessages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text || 'Sorry, something went wrong. Please try again.', streaming: false } : m),
        );
        this.aiThinking.set(false);
      },
      complete: () => {
        this.aiMessages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m),
        );
        this.aiThinking.set(false);
      },
    });
  }

  handleAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiMessage();
    }
  }

  private buildProjectContextData(): string {
    const parts: string[] = [];
    parts.push(`Project: ${this.projectName()}`);
    parts.push(`Status: ${this.projectStatus()}`);

    const focusedWidget = this.widgetFocusService.selectedWidgetId();

    switch (focusedWidget) {
      case 'budget':
        parts.push(`Budget: ${this.budgetUsed()} of ${this.budgetTotal()} (${this.budgetPct()}%)`);
        parts.push(`Budget health: ${this.budgetHealthy() ? 'On track' : 'Critical'}`);
        parts.push(`Remaining: ${this.budgetRemaining()}`);
        for (const item of this.budgetBreakdown()) {
          parts.push(`  ${item.label}: ${item.amount} (${item.pct}%)`);
        }
        break;

      case 'milestones':
        parts.push(`Milestones: ${this.completedMilestones()} of ${this.milestones().length} completed`);
        for (const ms of this.milestones()) {
          parts.push(`  ${ms.name}: ${ms.status}, due ${ms.dueDate}, ${ms.progress}% done`);
        }
        break;

      case 'tasks':
        parts.push(`Tasks: ${this.openTaskCount()} open of ${this.tasks().length} total`);
        for (const t of this.tasks()) {
          parts.push(`  ${t.title}: ${t.status}, priority ${t.priority}, assigned to ${t.assignee}, due ${t.dueDate}`);
        }
        break;

      case 'risks':
        parts.push(`Risks: ${this.risks().length} total`);
        for (const r of this.risks()) {
          parts.push(`  ${r.title}: severity ${r.severity}, impact: ${r.impact}, mitigation: ${r.mitigation}`);
        }
        break;

      case 'team':
        parts.push(`Team: ${this.team().length} members`);
        for (const t of this.team()) {
          parts.push(`  ${t.name} (${t.role}): ${t.tasksCompleted}/${t.tasksTotal} tasks done, ${t.availability}% available`);
        }
        break;

      case 'activity':
        parts.push(`Recent activity:`);
        for (const a of this.activity()) {
          parts.push(`  ${a.text} (${a.timeAgo})`);
        }
        break;

      case 'drawing':
        const d = this.latestDrawing();
        parts.push(`Latest drawing: ${d.name}`);
        parts.push(`  Version: ${d.version}, type: ${d.type}, updated by ${d.updatedBy} on ${d.updatedAt}`);
        parts.push(`  Revisions: ${d.revisionCount}, file size: ${d.fileSize}`);
        break;

      default:
        parts.push(`Budget: ${this.budgetUsed()} of ${this.budgetTotal()} (${this.budgetPct()}%)`);
        parts.push(`Budget health: ${this.budgetHealthy() ? 'On track' : 'Critical'}`);
        parts.push(`Milestones: ${this.completedMilestones()} of ${this.milestones().length} completed`);
        parts.push(`Open tasks: ${this.openTaskCount()}`);
        const highRisks = this.risks().filter(r => r.severity === 'high');
        if (highRisks.length > 0) {
          parts.push(`High risks: ${highRisks.map(r => r.title).join(', ')}`);
        }
        parts.push(`Team: ${this.team().map(t => `${t.name} (${t.role})`).join('; ')}`);
        break;
    }

    return parts.join('\n');
  }

}
