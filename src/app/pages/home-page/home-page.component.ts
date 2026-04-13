import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  signal,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { ViewportBreakpointsService } from '../../shell/services/viewport-breakpoints.service';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import type {
  DashboardWidgetId,
  GridPage,
  ApptType,
  CalendarAppointment,
  HomeEstimateCard,
  HomeEstimateCardStatus,
  BiddingTask,
  BiddingTaskScheduleTab,
} from '../../data/dashboard-data';
import { HOME_ESTIMATE_CARDS, CALENDAR_APPOINTMENTS, BIDDING_TASKS } from '../../data/dashboard-data';
import { HomePageHeroComponent } from './home-page-hero.component';
@Component({
  selector: 'app-home-page',
  imports: [
    WidgetResizeHandleComponent,
    HomePageHeroComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">
      <div #pageHeader>
        <app-home-page-hero (createClick)="onCreateClick()" />
      </div>

      <div
        [class]="isCanvasMode() ? 'relative overflow-visible' : 'relative'"
        [style.height.px]="isMobile() ? mobileGridHeight('home') : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #homeWidgetGrid
      >
        @for (widgetId of homeWidgets; track widgetId) {
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
              @if (widgetId === 'homeAllEstimates') {
                <div
                  #allEstimatesMeasureRoot
                  class="home-figma-widget-shell rounded-2xl overflow-hidden flex flex-col w-full min-w-0 h-full min-h-0"
                  [class.home-figma-widget-shell--selected]="selectedWidgetId() === widgetId"
                  [class.home-all-estimates-cq]="!isMobile()"
                  [class.max-h-full]="isMobile()"
                >
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60 flex-shrink-0" aria-hidden="true">list_bulleted</i>
                      <div class="min-w-0">
                        <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">All Estimates</div>
                        <div class="text-xs text-foreground-60 truncate">Overview of all your construction projects</div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="p-4 flex flex-col gap-4 min-h-0 flex-1 overflow-y-auto overscroll-contain"
                  >
                    @for (card of homeEstimateCards(); track card.id) {
                      <div
                        class="rounded-2xl home-figma-inner-card flex flex-col transition-colors duration-200"
                        [class.border-thick-primary]="card.progressVariant === 'in_progress'"
                        [class.border-default]="card.progressVariant !== 'in_progress'"
                      >
                        <div
                          class="p-4 flex gap-3 select-none"
                          [class.cursor-pointer]="!isHomeAllEstimatesWideLayout()"
                          [attr.role]="isHomeAllEstimatesWideLayout() ? null : 'button'"
                          [attr.tabindex]="isHomeAllEstimatesWideLayout() ? null : 0"
                          [attr.aria-expanded]="showHomeEstimateCardDetails(card.id)"
                          [attr.aria-label]="estimateCardRowAriaLabel(card)"
                          (click)="onEstimateCardHeaderClick(card.id)"
                          (keydown.enter)="onEstimateCardHeaderKeydown(card.id, $event)"
                          (keydown.space)="onEstimateCardHeaderKeydown(card.id, $event)"
                        >
                          <div [class]="estimateListIconWellClass(card)">
                            <i [class]="estimateListIconGlyphClass(card)" aria-hidden="true">{{ card.listIcon }}</i>
                          </div>
                          <div class="flex-1 min-w-0 flex flex-col gap-3">
                            <div class="flex items-start justify-between gap-2 min-w-0 w-full">
                              <div class="text-sm font-semibold text-foreground leading-snug pr-2 min-w-0 flex-1">
                                {{ card.title }}
                              </div>
                              <div class="flex items-center gap-2 flex-shrink-0">
                                <div class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap {{ homeEstimateCardBadgeClass(card.statusLabel) }}">
                                  {{ card.statusLabel }}
                                </div>
                                @if (!isHomeAllEstimatesWideLayout()) {
                                  <i
                                    class="modus-icons home-estimate-row-chevron text-foreground-40"
                                    aria-hidden="true"
                                  >{{ isEstimateCardExpanded(card.id) ? 'expand_less' : 'chevron_right' }}</i>
                                }
                              </div>
                            </div>
                            @if (card.progressVariant === 'archived') {
                              <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-xs">
                                <div class="text-foreground-60 leading-snug min-w-0 flex-1">{{ card.description }}</div>
                                <div class="flex items-center gap-1 flex-shrink-0 text-foreground-60">
                                  <i class="modus-icons home-estimate-meta-icon text-foreground-60" aria-hidden="true">calendar</i>
                                  <div>{{ card.dateLine }}</div>
                                </div>
                              </div>
                            } @else {
                              <div class="text-xs text-foreground-60 leading-snug">{{ card.description }}</div>
                              @if (card.showProgressBar) {
                                <div class="flex flex-col gap-3 home-all-estimates-progress-row">
                                  <div class="flex-1 min-w-0">
                                    <div class="flex items-center justify-between text-xs text-foreground-60 mb-1">
                                      <div>Progress</div>
                                      <div class="font-semibold text-foreground">{{ card.progressPct }}%</div>
                                    </div>
                                    <div class="home-figma-progress-track rounded-full bg-muted overflow-hidden">
                                      <div
                                        class="h-full rounded-full transition-all duration-300"
                                        [class]="estimateProgressFillClass(card)"
                                        [style.width.%]="card.progressPct"
                                      ></div>
                                    </div>
                                  </div>
                                  <div class="home-all-estimates-progress-meta flex flex-wrap items-center gap-x-2 text-xs text-foreground-60">
                                    <div class="flex items-center gap-1">
                                      <i class="modus-icons home-estimate-meta-icon text-foreground-60" aria-hidden="true">calendar</i>
                                      <div>{{ card.dateLine }}</div>
                                    </div>
                                    @if (card.membersLabel) {
                                      <div aria-hidden="true">•</div>
                                      <div class="flex items-center gap-1">
                                        <i
                                          class="modus-icons home-estimate-meta-icon text-foreground-60"
                                          aria-hidden="true"
                                        >{{ estimateMembersRowIcon(card) }}</i>
                                        <div>{{ card.membersLabel }}</div>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            }
                          </div>
                        </div>
                        @if (showHomeEstimateCardDetails(card.id)) {
                          <div class="px-4 pb-4 flex flex-col gap-[10.5px] border-top-default pt-[15px]">
                            <div class="flex items-center gap-2">
                              <i class="modus-icons text-sm text-primary flex-shrink-0" aria-hidden="true">bullseye</i>
                              <div class="text-xs font-semibold text-primary">Performance Snapshot</div>
                            </div>
                            <div class="grid grid-cols-1 gap-2 home-all-estimates-metrics-grid">
                              @for (m of card.metrics; track m.label) {
                                <div
                                  class="rounded-2xl bg-app-canvas flex flex-col gap-1 px-2 py-1.5 min-h-0"
                                >
                                  <div class="flex items-center gap-1 min-w-0">
                                    <i
                                      class="modus-icons text-2xs text-foreground-60 flex-shrink-0"
                                      aria-hidden="true"
                                    >{{ m.labelIcon }}</i>
                                    <div [class]="estimateMetricLabelClass(card)">{{ m.label }}</div>
                                  </div>
                                  <div class="flex items-center gap-1 flex-wrap">
                                    <div class="text-xs font-semibold text-foreground">{{ m.value }}</div>
                                    @if (m.trend !== 'none') {
                                      <i
                                        class="modus-icons text-xs flex-shrink-0"
                                        [class.text-success]="m.trend === 'up'"
                                        [class.text-destructive]="m.trend === 'down'"
                                        aria-hidden="true"
                                      >{{ m.trend === 'up' ? 'arrow_up' : 'arrow_down' }}</i>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                            <div class="flex flex-col gap-1.75">
                              @for (ins of card.insights; track ins.text) {
                                @if (ins.tone === 'positive') {
                                  <div
                                    class="home-estimate-insight-row home-estimate-insight-row--positive flex items-stretch min-h-[30px] rounded-r-lg overflow-hidden"
                                  >
                                    <div class="w-[3px] flex-shrink-0 bg-success" aria-hidden="true"></div>
                                    <div class="flex items-center gap-3 pl-3 pr-2 py-1 min-w-0 flex-1">
                                      <i
                                        class="modus-icons home-estimate-insight-icon text-success flex-shrink-0"
                                        aria-hidden="true"
                                      >check_circle</i>
                                      <div class="text-xs font-semibold text-foreground leading-snug">{{ ins.text }}</div>
                                    </div>
                                  </div>
                                } @else {
                                  <div
                                    class="home-estimate-insight-row home-estimate-insight-row--caution flex items-stretch min-h-[30px] rounded-r-lg overflow-hidden"
                                  >
                                    <div class="w-[3px] flex-shrink-0 bg-warning" aria-hidden="true"></div>
                                    <div class="flex items-center gap-3 pl-3 pr-2 py-1 min-w-0 flex-1">
                                      <i
                                        class="modus-icons home-estimate-insight-icon text-warning flex-shrink-0"
                                        aria-hidden="true"
                                      >warning</i>
                                      <div class="text-xs font-semibold text-foreground leading-snug">{{ ins.text }}</div>
                                    </div>
                                  </div>
                                }
                              }
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  position="left"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home', 'left')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home', 'left')"
                />
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
              @else if (widgetId === 'homeTasks') {
                <div
                  class="home-figma-widget-shell rounded-2xl overflow-hidden flex flex-col w-full min-w-0 h-full min-h-0"
                  [class.home-figma-widget-shell--selected]="selectedWidgetId() === widgetId"
                  [class.max-h-full]="isMobile()"
                >
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60 flex-shrink-0" aria-hidden="true">check_circle</i>
                      <div class="min-w-0">
                        <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Tasks & Action Items</div>
                        <div class="text-xs text-foreground-60 truncate">
                          Prioritized by: Largest projects first, Overdue items first, Critical items first
                        </div>
                      </div>
                    </div>
                    @if (filteredTasks().length > 0) {
                      <div class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 bg-muted text-foreground-60">
                        {{ filteredTasks().length }} Items
                      </div>
                    }
                  </div>
                  <div class="p-4 flex flex-col gap-4 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <div
                      class="flex flex-col gap-3 flex-shrink-0 bg-app-widget-surface"
                      (mousedown)="$event.stopPropagation()"
                      (touchstart)="$event.stopPropagation()"
                    >
                      <div
                        class="task-schedule-segmented w-full min-w-0"
                        role="tablist"
                        aria-label="Task schedule"
                      >
                        @for (tab of taskScheduleTabs; track tab.key) {
                          <div
                            role="tab"
                            class="task-schedule-segmented__seg"
                            [class.task-schedule-segmented__seg--active]="taskScheduleTab() === tab.key"
                            [attr.aria-selected]="taskScheduleTab() === tab.key"
                            tabindex="0"
                            (click)="onTaskScheduleTabSelect(tab.key)"
                            (keydown.enter)="onTaskScheduleTabSelect(tab.key)"
                            (keydown.space)="$event.preventDefault(); onTaskScheduleTabSelect(tab.key)"
                          >
                            <div class="min-w-0 w-full truncate text-sm font-semibold">
                              {{ taskScheduleTabDisplayLabel(tab.key) }}
                            </div>
                          </div>
                        }
                      </div>
                      <div class="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Priority filter">
                        <div class="text-xs text-foreground-60">Priority:</div>
                        <div class="flex flex-wrap items-center gap-1">
                          @for (p of taskPriorityOptions; track p.key) {
                            <div
                              class="px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 whitespace-nowrap select-none flex items-center justify-center"
                              [class.bg-primary]="taskPriorityFilter() === p.key"
                              [class.text-primary-foreground]="taskPriorityFilter() === p.key"
                              [class.bg-muted]="taskPriorityFilter() !== p.key"
                              [class.text-foreground-60]="taskPriorityFilter() !== p.key"
                              role="radio"
                              tabindex="0"
                              [attr.aria-checked]="taskPriorityFilter() === p.key"
                              (click)="onTaskPrioritySelect(p.key)"
                              (keydown.enter)="onTaskPrioritySelect(p.key)"
                              (keydown.space)="$event.preventDefault(); onTaskPrioritySelect(p.key)"
                            >
                              {{ p.label }}
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                    @for (task of filteredTasks(); track task.id) {
                      <div class="rounded-xl home-figma-inner-card border-default flex flex-col transition-colors duration-200">
                        <div class="p-4 flex gap-3 select-none">
                          <div class="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <i class="modus-icons text-base text-foreground-60" aria-hidden="true">check_circle</i>
                          </div>
                          <div class="flex-1 min-w-0 flex flex-col gap-3">
                            <div class="flex items-start justify-between gap-2">
                              <div class="text-sm font-semibold text-foreground leading-snug pr-2">{{ task.title }}</div>
                              <div class="flex items-center gap-2 flex-shrink-0">
                                <div [class]="taskCardBadgeClass(task.priority)">
                                  @if (task.priority === 'overdue') {
                                    <i class="modus-icons text-2xs flex-shrink-0" aria-hidden="true">clock</i>
                                  }
                                  {{ taskPriorityLabel(task.priority) }}
                                </div>
                              </div>
                            </div>
                            <div class="flex flex-wrap items-center gap-x-2 text-xs text-foreground-60">
                              <div class="flex items-center gap-1">
                                <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true">costs</i>
                                <div>{{ task.projectValue }}</div>
                              </div>
                              <div aria-hidden="true">•</div>
                              <div class="flex items-center gap-1">
                                <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true">calendar</i>
                                <div>{{ task.timeLabel }}</div>
                              </div>
                              <div aria-hidden="true">•</div>
                              <div class="flex items-center gap-1">
                                <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true">person</i>
                                <div>{{ task.assigneeLabel }}</div>
                              </div>
                            </div>
                            <div class="text-xs text-foreground-60 leading-snug">{{ task.description }}</div>
                            @if (task.alertTone === 'error') {
                              <div class="flex items-center gap-2 rounded-md px-3 py-2 min-w-0 bg-destructive-20">
                                <i class="modus-icons text-xs flex-shrink-0 text-destructive" aria-hidden="true">alert</i>
                                <div class="text-xs leading-snug text-foreground">{{ task.alertMessage }}</div>
                              </div>
                            } @else {
                              <div class="flex items-center gap-2 rounded-md px-3 py-2 min-w-0 bg-warning-20">
                                <i class="modus-icons text-xs flex-shrink-0 text-warning" aria-hidden="true">warning</i>
                                <div class="text-xs leading-snug text-foreground">{{ task.alertMessage }}</div>
                              </div>
                            }
                            <div class="text-xs font-semibold text-primary cursor-pointer hover:text-primary-60 transition-colors w-fit">
                              {{ task.actionLabel }}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    @if (filteredTasks().length === 0) {
                      <div class="flex flex-col items-center justify-center py-8 text-foreground-40">
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">check_circle</i>
                        <div class="text-sm">No tasks match these filters</div>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  position="left"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home', 'left')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home', 'left')"
                />
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
              @else if (widgetId === 'homeCalendar') {
                <div
                  class="home-figma-widget-shell rounded-2xl overflow-hidden flex flex-col h-full"
                  [class.home-figma-widget-shell--selected]="selectedWidgetId() === widgetId"
                >
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60 flex-shrink-0" aria-hidden="true">calendar</i>
                      <div class="min-w-0">
                        <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Calendar</div>
                        <div class="text-xs text-foreground-60 truncate">
                          Bidding and preconstruction
                          <span class="text-foreground-40"> · {{ calendarDay1Meta().dateStr }} – {{ calendarDay2Meta().dateStr }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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

                  <div class="flex flex-shrink-0 border-bottom-default" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
                    <div class="w-12 flex-shrink-0"></div>
                    <div class="flex-1 py-2 px-3 text-center border-right-default">
                      <div class="text-xs font-semibold uppercase tracking-wide {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                        {{ calendarDay1Meta().label }}
                      </div>
                      <div class="text-2xl font-bold leading-tight {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                        {{ calendarDay1Meta().dayNum }}
                      </div>
                    </div>
                    <div class="flex-1 py-2 px-3 text-center">
                      <div class="text-xs font-semibold uppercase tracking-wide {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                        {{ calendarDay2Meta().label }}
                      </div>
                      <div class="text-2xl font-bold leading-tight {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                        {{ calendarDay2Meta().dayNum }}
                      </div>
                    </div>
                  </div>

                  <div class="flex overflow-y-auto flex-1">
                    <div class="w-12 flex-shrink-0">
                      @for (hour of calendarHours; track hour) {
                        <div class="h-[60px] flex items-start justify-end pr-2 -mt-0">
                          <div class="text-2xs text-foreground-40 mt-1">{{ formatCalHour(hour) }}</div>
                        </div>
                      }
                    </div>
                    <div class="flex-1 relative border-right-default">
                      @for (hour of calendarHours; track hour) {
                        <div class="h-[60px] border-bottom-default"></div>
                      }
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
                      @if (calendarDay1Meta().isToday) {
                        <div class="absolute left-0 right-0 h-px bg-destructive z-10 pointer-events-none" [style.top.px]="currentTimeTop()">
                          <div class="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive"></div>
                        </div>
                      }
                    </div>
                    <div class="flex-1 relative">
                      @for (hour of calendarHours; track hour) {
                        <div class="h-[60px] border-bottom-default"></div>
                      }
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
                      @if (calendarDay2Meta().isToday) {
                        <div class="absolute left-0 right-0 h-px bg-destructive z-10 pointer-events-none" [style.top.px]="currentTimeTop()">
                          <div class="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-destructive"></div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0 flex-wrap" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  position="left"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home', 'left')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home', 'left')"
                />
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class HomePageComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly engine = new DashboardLayoutEngine(
    {
      widgets: ['homeAllEstimates', 'homeTasks', 'homeCalendar'],
      layoutStorageKey: 'dashboard-home-v3',
      canvasStorageKey: 'canvas-layout:dashboard-home:v7',
      defaultColStarts: { homeAllEstimates: 1, homeTasks: 6, homeCalendar: 11 },
      defaultColSpans: { homeAllEstimates: 5, homeTasks: 5, homeCalendar: 6 },
      defaultTops: { homeAllEstimates: 0, homeTasks: 0, homeCalendar: 0 },
      defaultHeights: { homeAllEstimates: 560, homeTasks: 560, homeCalendar: 560 },
      defaultLefts: { homeAllEstimates: 0, homeTasks: 432, homeCalendar: 864 },
      defaultPixelWidths: { homeAllEstimates: 416, homeTasks: 416, homeCalendar: 416 },
      canvasDefaultLefts: { homeAllEstimates: 0, homeTasks: 432, homeCalendar: 864 },
      canvasDefaultPixelWidths: { homeAllEstimates: 416, homeTasks: 416, homeCalendar: 416 },
      canvasDefaultTops: { homeAllEstimates: 0, homeTasks: 0, homeCalendar: 0 },
      canvasDefaultHeights: { homeAllEstimates: 560, homeTasks: 560, homeCalendar: 560 },
      minColSpan: 4,
      canvasGridMinHeightOffset: 100,
      savesDesktopOnMobile: true,
      onBeforeMobileCompact: () => this.applyMobileHeights(),
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    },
    inject(WidgetLayoutService),
    inject(ViewportBreakpointsService),
  );

  private readonly _onHomeAllEstimatesWindowResize = (): void => {
    if (this.isMobile()) return;
    this.applyHomeAllEstimatesHeightFromMeasure();
  };

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    window.removeEventListener('resize', this._onHomeAllEstimatesWindowResize);
    this._homeEstimatesResizeObserver?.disconnect();
    this._homeEstimatesResizeObserver = null;
    this.engine.destroy();
  });

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.expandedEstimateIds.set(new Set());
        this._homeAllEstimatesHeightBaselinePx = null;
      });
    }
  });

  private readonly _estimateExpandMobileHeights = effect(() => {
    this.expandedEstimateIds();
    this.homeEstimateCards();
    if (this.isMobile()) {
      untracked(() => this.applyMobileHeights());
    }
  });

  /** Wide layout shows snapshot by default; clear row expansion state (RFI-style expand is narrow-only). */
  private readonly _clearEstimateRowExpandWhenWide = effect(() => {
    if (!this.isHomeAllEstimatesWideLayout()) return;
    untracked(() => {
      if (this.expandedEstimateIds().size === 0) return;
      this.expandedEstimateIds.set(new Set());
      this.syncHomeAllEstimatesHeightForExpandState();
    });
  });

  /** Desktop: size All Estimates to intrinsic content via ResizeObserver + post-render passes. */
  private _homeEstimatesResizeObserver: ResizeObserver | null = null;
  private readonly allEstimatesMeasureRoot = viewChild<ElementRef>('allEstimatesMeasureRoot');

  private readonly _homeAllEstimatesMeasureEffect = effect(() => {
    this.isMobile();
    this.homeEstimateCards();
    this.expandedEstimateIds();
    this.widgetPixelWidths();
    untracked(() => {
      if (this.isMobile()) {
        this._homeEstimatesResizeObserver?.disconnect();
        this._homeEstimatesResizeObserver = null;
        return;
      }
      afterNextRender(() => {
        const attachOrApply = (): void => {
          if (this.isMobile()) return;
          const el = this.allEstimatesMeasureRoot()?.nativeElement as HTMLElement | undefined;
          if (!el) {
            requestAnimationFrame(() => attachOrApply());
            return;
          }
          if (typeof ResizeObserver !== 'undefined' && !this._homeEstimatesResizeObserver) {
            this._homeEstimatesResizeObserver = new ResizeObserver(() => this.applyHomeAllEstimatesHeightFromMeasure());
            this._homeEstimatesResizeObserver.observe(el);
          }
          this.applyHomeAllEstimatesHeightFromMeasure();
        };
        attachOrApply();
      });
    });
  });

  readonly isMobile = this.engine.isMobile;
  readonly isCanvasMode = this.engine.isCanvasMode;
  readonly widgetColStarts = this.engine.widgetColStarts;
  readonly widgetColSpans = this.engine.widgetColSpans;
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  /**
   * Performance Snapshot and full detail layout when the All Estimates **column width** (layout engine px) is wide enough.
   * Uses the same width that changes when you drag resize handles — not viewport `sm:` and not DOM measure (which misreported).
   * Below the breakpoint: basic rows only; tap/Enter/Space on a row expands that card (RFI-style detail).
   */
  readonly isHomeAllEstimatesWideLayout = computed(() => {
    if (this.isMobile()) return false;
    const w = this.widgetPixelWidths()['homeAllEstimates'] ?? 0;
    if (w <= 0) return false;
    return w >= HomePageComponent.HOME_ESTIMATES_WIDE_BREAKPOINT_PX;
  });
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly calendarAppointments: CalendarAppointment[] = CALENDAR_APPOINTMENTS;
  readonly homeEstimateCards = signal<HomeEstimateCard[]>(HOME_ESTIMATE_CARDS);
  /** Narrow layout: user-expanded card ids. Wide layout ignores this for showing snapshots. */
  readonly expandedEstimateIds = signal<Set<string>>(new Set());
  readonly biddingTasks = signal<BiddingTask[]>(BIDDING_TASKS);

  readonly homeWidgets: DashboardWidgetId[] = ['homeAllEstimates', 'homeTasks', 'homeCalendar'];
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  readonly taskScheduleTabs: { key: BiddingTaskScheduleTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'week', label: 'This Week' },
    { key: 'archive', label: 'Archive' },
  ];
  readonly taskTabCounts = computed(() => {
    const tasks = this.biddingTasks();
    const counts: Record<BiddingTaskScheduleTab, number> = {
      today: 0,
      tomorrow: 0,
      week: 0,
      archive: 0,
    };
    for (const t of tasks) counts[t.scheduleTab]++;
    return counts;
  });
  readonly taskScheduleTab = signal<BiddingTaskScheduleTab>('today');
  readonly taskPriorityFilter = signal<'all' | 'critical' | 'high' | 'medium'>('all');
  readonly taskPriorityOptions: { key: 'all' | 'critical' | 'high' | 'medium'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
  ];

  readonly filteredTasks = computed(() => {
    const tab = this.taskScheduleTab();
    const pri = this.taskPriorityFilter();
    return this.biddingTasks().filter((t) => {
      if (t.scheduleTab !== tab) return false;
      if (pri === 'all') return true;
      if (pri === 'critical') return t.priority === 'overdue' || t.priority === 'critical';
      return t.priority === pri;
    });
  });

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly homeGridContainerRef = viewChild<ElementRef>('homeWidgetGrid');

  mobileGridHeight(_grid: GridPage): number {
    return this.engine.mobileGridHeight();
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent, _grid: GridPage = 'home'): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent, _grid: GridPage = 'home'): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, _grid: GridPage = 'home', edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResize(target, dir, event, edge);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, _grid: GridPage = 'home', edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResizeTouch(target, dir, event, edge);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    this.engine.onDocumentMouseUp();
    this.scheduleHomeAllEstimatesMeasureSync();
  }

  onDocumentTouchEnd(): void {
    this.engine.onDocumentTouchEnd();
    this.scheduleHomeAllEstimatesMeasureSync();
  }

  isEstimateCardExpanded(id: string): boolean {
    return this.expandedEstimateIds().has(id);
  }

  showHomeEstimateCardDetails(id: string): boolean {
    return this.isHomeAllEstimatesWideLayout() || this.expandedEstimateIds().has(id);
  }

  estimateCardRowAriaLabel(card: HomeEstimateCard): string {
    if (this.isHomeAllEstimatesWideLayout()) {
      return 'Project summary and performance snapshot for ' + card.title;
    }
    return (
      (this.showHomeEstimateCardDetails(card.id) ? 'Collapse' : 'Expand') + ' details for ' + card.title
    );
  }

  onEstimateCardHeaderClick(id: string): void {
    if (this.isHomeAllEstimatesWideLayout()) return;
    this.toggleEstimateCardExpanded(id);
  }

  onEstimateCardHeaderKeydown(id: string, event: Event): void {
    if (this.isHomeAllEstimatesWideLayout()) return;
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === ' ') event.preventDefault();
    if (event.key === 'Enter' || event.key === ' ') {
      this.toggleEstimateCardExpanded(id);
    }
  }

  toggleEstimateCardExpanded(id: string): void {
    if (this.isHomeAllEstimatesWideLayout()) return;
    this.expandedEstimateIds.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.syncHomeAllEstimatesHeightForExpandState();
  }

  /**
   * Performance Snapshot + metrics live only in the expanded block at the bottom of each card.
   * Grow the home widget on desktop when cards expand (same idea as mobile height bump)
   * so the expanded region is not only scroll-clipped. Collapse restores the pre-expand height.
   */
  private _homeAllEstimatesHeightBaselinePx: number | null = null;

  private syncHomeAllEstimatesHeightForExpandState(): void {
    if (this.isMobile()) {
      this.applyMobileHeights();
      return;
    }

    const cards = this.homeEstimateCards();
    const expandedCount = [...this.expandedEstimateIds()].filter((eid) => cards.some((c) => c.id === eid))
      .length;

    if (expandedCount === 0 && !this.isHomeAllEstimatesWideLayout()) {
      const baseline = this._homeAllEstimatesHeightBaselinePx;
      this._homeAllEstimatesHeightBaselinePx = null;
      if (baseline !== null) {
        this.widgetHeights.update((h) => ({ ...h, homeAllEstimates: baseline }));
        this.engine.reflowAfterHeightsChanged();
      }
    } else if (
      expandedCount > 0 &&
      !this.isHomeAllEstimatesWideLayout() &&
      this._homeAllEstimatesHeightBaselinePx === null
    ) {
      this._homeAllEstimatesHeightBaselinePx =
        this.widgetHeights()['homeAllEstimates'] ?? HomePageComponent.HOME_ESTIMATES_DEFAULT_HEIGHT_PX;
    }

    afterNextRender(() => this.applyHomeAllEstimatesHeightFromMeasure());
  }

  /** After widget resize / browser resize, RO may lag one frame — nudge width + height sync. */
  private scheduleHomeAllEstimatesMeasureSync(): void {
    if (this.isMobile()) return;
    requestAnimationFrame(() => this.applyHomeAllEstimatesHeightFromMeasure());
  }

  private applyHomeAllEstimatesHeightFromMeasure(): void {
    if (this.isMobile()) return;
    const el = this.allEstimatesMeasureRoot()?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    const raw = Math.ceil(
      Math.max(el.getBoundingClientRect().height, el.scrollHeight, el.offsetHeight),
    );
    const minPx = HomePageComponent.HOME_ESTIMATES_MIN_WIDGET_HEIGHT_PX;
    const maxPx = Math.floor(window.innerHeight * 0.92);
    const next = Math.min(maxPx, Math.max(minPx, raw));
    const cur =
      this.widgetHeights()['homeAllEstimates'] ?? HomePageComponent.HOME_ESTIMATES_DEFAULT_HEIGHT_PX;
    if (Math.abs(cur - next) <= 1) return;
    this.widgetHeights.update((h) => ({ ...h, homeAllEstimates: next }));
    this.engine.reflowAfterHeightsChanged();
  }

  homeEstimateCardBadgeClass(status: HomeEstimateCardStatus): string {
    switch (status) {
      case 'In Progress':
        return 'bg-foreground text-primary-foreground';
      case 'Completed':
        return 'bg-success-20 text-success';
      case 'Planning':
        return 'bg-warning-20 text-warning';
      case 'Archived':
        return 'bg-muted text-foreground-60';
      default:
        return 'bg-muted text-foreground-60';
    }
  }

  estimateProgressFillClass(card: HomeEstimateCard): string {
    switch (card.progressVariant) {
      case 'in_progress':
        return 'bg-foreground';
      case 'complete':
        return 'bg-success';
      case 'planning':
        return 'bg-warning';
      case 'archived':
        return 'bg-muted';
      default:
        return 'bg-primary';
    }
  }

  /** Metric tile labels: muted on Archive aggregate tiles (Figma 2:23632). */
  estimateMetricLabelClass(card: HomeEstimateCard): string {
    if (card.progressVariant === 'archived') {
      return 'text-2xs font-semibold text-foreground-60 leading-tight';
    }
    return 'text-2xs font-semibold text-foreground leading-tight';
  }

  /**
   * Icon well — 35×35 (2:36091). Archive: neutral 10%; completed: success pale; else primary 10%.
   */
  estimateListIconWellClass(card: HomeEstimateCard): string {
    const base = 'home-estimate-list-icon-well ';
    if (card.progressVariant === 'complete') {
      return `${base}bg-success-20`;
    }
    if (card.progressVariant === 'archived') {
      return `${base}bg-foreground-10`;
    }
    return `${base}bg-primary-10`;
  }

  /** Leading glyph — primary / success / muted by status (17.5px). */
  estimateListIconGlyphClass(card: HomeEstimateCard): string {
    const base = 'modus-icons home-estimate-list-icon-glyph flex-shrink-0 ';
    if (card.progressVariant === 'complete') {
      return `${base}text-success`;
    }
    if (card.progressVariant === 'archived') {
      return `${base}text-foreground-60`;
    }
    return `${base}text-primary`;
  }

  /** Calendar row: single user vs group (Figma uses Users vs one person). */
  estimateMembersRowIcon(card: HomeEstimateCard): 'person' | 'people_group' {
    const m = card.membersLabel;
    if (!m) return 'people_group';
    return /^1\s+(member|person)/i.test(m) ? 'person' : 'people_group';
  }

  taskPriorityLabel(priority: BiddingTask['priority']): string {
    if (priority === 'overdue') return 'Overdue';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  /** Same visual language as `homeEstimateCardBadgeClass` (Planning/Archived/Completed). */
  taskCardBadgeClass(priority: BiddingTask['priority']): string {
    const base =
      'text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1';
    switch (priority) {
      case 'overdue':
        return `${base} bg-destructive text-destructive-foreground`;
      case 'critical':
        return `${base} bg-destructive-20 text-destructive`;
      case 'high':
        return `${base} bg-warning-20 text-warning`;
      case 'medium':
      default:
        return `${base} bg-muted text-foreground-60`;
    }
  }

  taskScheduleTabDisplayLabel(key: BiddingTaskScheduleTab): string {
    const n = this.taskTabCounts()[key];
    switch (key) {
      case 'today':
        return `Today (${n})`;
      case 'tomorrow':
        return `Tomorrow (${n})`;
      case 'week':
        return 'This Week';
      default:
        return 'Archive';
    }
  }

  /** Matches layout engine defaultHeights.homeAllEstimates on the home dashboard. */
  private static readonly HOME_ESTIMATES_DEFAULT_HEIGHT_PX = 560;
  /** Desktop widget height floor so chrome + one row stays usable. */
  private static readonly HOME_ESTIMATES_MIN_WIDGET_HEIGHT_PX = 280;
  /**
   * Measured panel width (container) at/above this shows Performance Snapshot without expand (Figma 2:23632).
   * Default grid column ~416px stays summary-only (Figma 2:36091). Aligns with ~504px narrow frame in Figma.
   */
  private static readonly HOME_ESTIMATES_WIDE_BREAKPOINT_PX = 520;
  private static readonly MOBILE_ESTIMATE_TOP = 140;
  private static readonly MOBILE_ESTIMATE_CARD = 104;
  private static readonly MOBILE_ESTIMATE_EXPANDED = 220;
  private static readonly MOBILE_TASKS_CHROME = 200;
  private static readonly MOBILE_TASK_CARD = 132;

  applyMobileHeights(): void {
    if (!this.isMobile()) return;
    const heights = { ...this.widgetHeights() };
    const estCards = this.homeEstimateCards().length;
    let expandExtra = 0;
    for (const id of this.expandedEstimateIds()) {
      if (this.homeEstimateCards().some((c) => c.id === id)) {
        expandExtra += HomePageComponent.MOBILE_ESTIMATE_EXPANDED;
      }
    }
    const taskRows = this.filteredTasks().length;
    const taskBody =
      taskRows === 0 ? 120 : taskRows * HomePageComponent.MOBILE_TASK_CARD;
    const cap = Math.floor(window.innerHeight * 0.72);
    heights['homeAllEstimates'] = Math.min(
      HomePageComponent.MOBILE_ESTIMATE_TOP +
        estCards * HomePageComponent.MOBILE_ESTIMATE_CARD +
        expandExtra,
      cap,
    );
    heights['homeTasks'] = Math.min(HomePageComponent.MOBILE_TASKS_CHROME + taskBody, cap);
    heights['homeCalendar'] = heights['homeCalendar'] ?? 480;
    this.widgetHeights.set(heights);
    this.engine.reflowAfterHeightsChanged();
  }

  onTaskScheduleTabSelect(key: BiddingTaskScheduleTab): void {
    this.taskScheduleTab.set(key);
    this.applyMobileHeights();
  }

  onTaskPrioritySelect(key: 'all' | 'critical' | 'high' | 'medium'): void {
    this.taskPriorityFilter.set(key);
    this.applyMobileHeights();
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.homeGridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
    window.addEventListener('resize', this._onHomeAllEstimatesWindowResize, { passive: true });
    requestAnimationFrame(() => this.applyHomeAllEstimatesHeightFromMeasure());
    this.syncHomeAllEstimatesHeightForExpandState();
  }

  onCreateClick(): void {
    this.router.navigate(['/estimates']);
  }

  private readonly _apptTypeColor: Record<ApptType, string> = {
    meeting: 'bg-primary-20 text-primary border-primary',
    review: 'bg-warning-20 text-warning border-warning',
    call: 'bg-success-20 text-success border-success',
    deadline: 'bg-destructive-20 text-destructive border-destructive',
    focus: 'bg-secondary text-foreground-60 border-muted',
  };

  private readonly CAL_FIRST_HOUR = 8;
  private readonly CAL_LAST_HOUR = 18;
  readonly calendarHours = Array.from(
    { length: this.CAL_LAST_HOUR - this.CAL_FIRST_HOUR },
    (_, i) => i + this.CAL_FIRST_HOUR,
  );

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const isToday = d.getTime() === today.getTime();
    const isTomorrow = d.getTime() === tomorrow.getTime();
    const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : this._DAY_NAMES[d.getDay()];
    return {
      label,
      dateStr: `${this._MON_NAMES[d.getMonth()]} ${d.getDate()}`,
      dayNum: d.getDate(),
      isToday,
    };
  }

  readonly calendarDay1Meta = computed(() => this.calDayMeta(this.calendarDay1()));
  readonly calendarDay2Meta = computed(() => this.calDayMeta(this.calendarDay2()));

  private isSameCalDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  readonly calendarDay1Appts = computed(() =>
    this.calendarAppointments
      .filter((a) => this.isSameCalDay(a.date, this.calendarDay1()))
      .sort((a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin)),
  );

  readonly calendarDay2Appts = computed(() =>
    this.calendarAppointments
      .filter((a) => this.isSameCalDay(a.date, this.calendarDay2()))
      .sort((a, b) => a.startHour * 60 + a.startMin - (b.startHour * 60 + b.startMin)),
  );

  readonly currentTimeTop = computed(() => {
    const now = new Date();
    const top = (now.getHours() - this.CAL_FIRST_HOUR) * 60 + now.getMinutes();
    return Math.max(0, Math.min(this.calendarHours.length * 60, top));
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
    if (h === 0) return '12a';
    return h > 12 ? `${h - 12}p` : `${h}a`;
  }

  formatApptTime(hour: number, min: number): string {
    const ampm = hour >= 12 ? 'p' : 'a';
    const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const m = min > 0 ? `:${min.toString().padStart(2, '0')}` : '';
    return `${h}${m}${ampm}`;
  }

  prevCalendarDay(): void {
    this.calendarBaseDate.update((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() - 1);
      return n;
    });
  }

  nextCalendarDay(): void {
    this.calendarBaseDate.update((d) => {
      const n = new Date(d);
      n.setDate(n.getDate() + 1);
      return n;
    });
  }

  resetCalendarToToday(): void {
    this.calendarBaseDate.set(new Date());
  }
}
