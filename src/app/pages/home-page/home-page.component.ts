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
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import type {
  DashboardWidgetId,
  GridPage,
  RfiStatus,
  SubmittalStatus,
  ApptType,
  CalendarAppointment,
  Rfi,
  Submittal,
} from '../../data/dashboard-data';
import {
  PROJECTS,
  ESTIMATES,
  RFIS,
  SUBMITTALS,
  TIME_OFF_REQUESTS,
  CALENDAR_APPOINTMENTS,
} from '../../data/dashboard-data';

@Component({
  selector: 'app-home-page',
  imports: [WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="px-4 py-4 md:px-0 md:py-6 max-w-screen-xl mx-auto">
      <div #pageHeader>
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome back, Alex</div>
          <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Active Projects: {{ totalProjects() }}" (click)="navigateToProjects()" (keydown.enter)="navigateToProjects()" (keydown.space)="$event.preventDefault(); navigateToProjects()">
          <div class="w-12 h-12 rounded-xl bg-primary-20 flex items-center justify-center flex-shrink-0">
            <i class="modus-icons text-2xl text-primary" aria-hidden="true">briefcase</i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-2xl font-bold text-foreground">{{ totalProjects() }}</div>
            <div class="text-sm text-foreground-60">Active Projects</div>
          </div>
          <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Open Estimates: {{ openEstimatesCount() }}" (click)="navigateToProjects()" (keydown.enter)="navigateToProjects()" (keydown.space)="$event.preventDefault(); navigateToProjects()">
          <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
            <i class="modus-icons text-2xl text-warning" aria-hidden="true">description</i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-2xl font-bold text-foreground">{{ openEstimatesCount() }}</div>
            <div class="text-sm text-foreground-60">Open Estimates</div>
          </div>
          <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150" role="link" tabindex="0" aria-label="Estimate Pipeline: {{ totalEstimateValue() }}" (click)="navigateToFinancials()" (keydown.enter)="navigateToFinancials()" (keydown.space)="$event.preventDefault(); navigateToFinancials()">
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

              @if (widgetId === 'homeTimeOff') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Time Off Requests</div>
                      @if (pendingTimeOffCount() > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                          <div class="text-xs font-medium text-warning">{{ pendingTimeOffCount() }} pending</div>
                        </div>
                      }
                    </div>
                    <div
                      class="flex items-center rounded-lg border-default overflow-hidden flex-shrink-0"
                      role="tablist"
                      aria-label="Time off view"
                      (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()"
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

                  @if (timeOffView() === 'calendar') {
                    <div class="flex flex-col flex-1">
                      <div class="flex items-center justify-between px-5 py-3 border-bottom-default flex-shrink-0" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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
                      <div class="grid grid-cols-7 px-3 pt-2 pb-1 flex-shrink-0">
                        @for (d of ['Su','Mo','Tu','We','Th','Fr','Sa']; track d) {
                          <div class="text-center text-2xs font-semibold text-foreground-40 uppercase py-1">{{ d }}</div>
                        }
                      </div>
                      <div class="grid grid-cols-7 gap-px px-3 pb-3 overflow-y-auto flex-1">
                        @for (cell of calendarDays(); track cell.day ?? $index) {
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
                      <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
              @else if (widgetId === 'homeCalendar') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Calendar</div>
                      <div class="text-xs text-foreground-40">{{ calendarDay1Meta().dateStr }} – {{ calendarDay2Meta().dateStr }}</div>
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

                  <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
              @else if (widgetId === 'homeRfis') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      @if (isRfiCompact() && rfiMobileExpanded()) {
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
                        <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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

                  @if (isRfiCompact() && !rfiMobileExpanded()) {
                    <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
                      @for (item of rfiCompactItems; track item.key) {
                        <div
                          class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                          role="button" tabindex="0"
                          [attr.aria-label]="item.label + ': ' + rfiCounts()[item.key]"
                          (click)="expandRfiMobile(item.key)"
                          (keydown.enter)="expandRfiMobile(item.key)"
                          (keydown.space)="$event.preventDefault(); expandRfiMobile(item.key)"
                        >
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            [class.bg-primary-20]="!item.destructive && item.key !== 'overdue'"
                            [class.bg-destructive-20]="item.destructive"
                            [class.bg-warning-20]="item.key === 'upcoming'"
                            [class.bg-success-20]="item.key === 'closed'">
                            <i class="modus-icons text-base" aria-hidden="true"
                              [class.text-primary]="item.key === 'all' || item.key === 'open'"
                              [class.text-destructive]="item.destructive"
                              [class.text-warning]="item.key === 'upcoming'"
                              [class.text-success]="item.key === 'closed'">{{ item.icon }}</i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-foreground-60">{{ item.label }}</div>
                          </div>
                          <div class="text-lg font-bold"
                            [class.text-foreground]="item.key !== 'overdue'"
                            [class.text-destructive]="item.destructive">{{ rfiCounts()[item.key] }}</div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (!isRfiCompact()) {
                      <div
                        class="flex items-center gap-2 px-5 py-3 border-bottom-default flex-shrink-0 overflow-x-auto"
                        role="radiogroup" aria-label="Filter RFIs by status"
                        (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()"
                      >
                        @for (f of rfiFilterOptions; track f) {
                          <div
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                            [class.bg-primary]="rfiActiveFilter() === f"
                            [class.text-primary-foreground]="rfiActiveFilter() === f"
                            [class.bg-muted]="rfiActiveFilter() !== f"
                            [class.text-foreground-60]="rfiActiveFilter() !== f"
                            [class.bg-destructive]="f === 'overdue' && rfiActiveFilter() === f"
                            [class.text-destructive-foreground]="f === 'overdue' && rfiActiveFilter() === f"
                            [class.bg-warning]="f === 'upcoming' && rfiActiveFilter() === f"
                            [class.text-warning-foreground]="f === 'upcoming' && rfiActiveFilter() === f"
                            [class.bg-success]="f === 'closed' && rfiActiveFilter() === f"
                            [class.text-success-foreground]="f === 'closed' && rfiActiveFilter() === f"
                            role="radio" tabindex="0" [attr.aria-checked]="rfiActiveFilter() === f"
                            (click)="rfiActiveFilter.set(f)"
                            (keydown.enter)="rfiActiveFilter.set(f)"
                            (keydown.space)="$event.preventDefault(); rfiActiveFilter.set(f)"
                          >
                            <div>{{ f.charAt(0).toUpperCase() + f.slice(1) }}</div>
                            <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                              [class.bg-primary-foreground]="rfiActiveFilter() === f && f === 'all'"
                              [class.text-primary]="rfiActiveFilter() === f && f === 'all'"
                              [class.bg-secondary]="rfiActiveFilter() !== f"
                              [class.text-foreground-60]="rfiActiveFilter() !== f"
                              aria-hidden="true"
                            >{{ rfiCounts()[f] }}</div>
                          </div>
                        }
                      </div>
                    }
                    <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                      <div role="columnheader">RFI #</div>
                      <div role="columnheader">Subject</div>
                      <div role="columnheader">Project</div>
                      <div role="columnheader">Assignee</div>
                      <div role="columnheader">Due</div>
                      <div role="columnheader">Status</div>
                    </div>
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
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }
              @else if (widgetId === 'homeSubmittals') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      @if (isSubmittalCompact() && submittalMobileExpanded()) {
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
                        <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
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

                  @if (isSubmittalCompact() && !submittalMobileExpanded()) {
                    <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
                      @for (item of submittalCompactItems; track item.key) {
                        <div
                          class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                          role="button" tabindex="0"
                          [attr.aria-label]="item.label + ': ' + submittalCounts()[item.key]"
                          (click)="expandSubmittalMobile(item.key)"
                          (keydown.enter)="expandSubmittalMobile(item.key)"
                          (keydown.space)="$event.preventDefault(); expandSubmittalMobile(item.key)"
                        >
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            [class.bg-primary-20]="!item.destructive && item.key !== 'overdue'"
                            [class.bg-destructive-20]="item.destructive"
                            [class.bg-warning-20]="item.key === 'upcoming'"
                            [class.bg-success-20]="item.key === 'closed'">
                            <i class="modus-icons text-base" aria-hidden="true"
                              [class.text-primary]="item.key === 'all' || item.key === 'open'"
                              [class.text-destructive]="item.destructive"
                              [class.text-warning]="item.key === 'upcoming'"
                              [class.text-success]="item.key === 'closed'">{{ item.icon }}</i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-foreground-60">{{ item.label }}</div>
                          </div>
                          <div class="text-lg font-bold"
                            [class.text-foreground]="item.key !== 'overdue'"
                            [class.text-destructive]="item.destructive">{{ submittalCounts()[item.key] }}</div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (!isSubmittalCompact()) {
                      <div
                        class="flex items-center gap-2 px-5 py-3 border-bottom-default flex-shrink-0 overflow-x-auto"
                        role="radiogroup" aria-label="Filter Submittals by status"
                        (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()"
                      >
                        @for (f of submittalFilterOptions; track f) {
                          <div
                            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                            [class.bg-primary]="submittalActiveFilter() === f"
                            [class.text-primary-foreground]="submittalActiveFilter() === f"
                            [class.bg-muted]="submittalActiveFilter() !== f"
                            [class.text-foreground-60]="submittalActiveFilter() !== f"
                            [class.bg-destructive]="f === 'overdue' && submittalActiveFilter() === f"
                            [class.text-destructive-foreground]="f === 'overdue' && submittalActiveFilter() === f"
                            [class.bg-warning]="f === 'upcoming' && submittalActiveFilter() === f"
                            [class.text-warning-foreground]="f === 'upcoming' && submittalActiveFilter() === f"
                            [class.bg-success]="f === 'closed' && submittalActiveFilter() === f"
                            [class.text-success-foreground]="f === 'closed' && submittalActiveFilter() === f"
                            role="radio" tabindex="0" [attr.aria-checked]="submittalActiveFilter() === f"
                            (click)="submittalActiveFilter.set(f)"
                            (keydown.enter)="submittalActiveFilter.set(f)"
                            (keydown.space)="$event.preventDefault(); submittalActiveFilter.set(f)"
                          >
                            <div>{{ f.charAt(0).toUpperCase() + f.slice(1) }}</div>
                            <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
                              [class.bg-primary-foreground]="submittalActiveFilter() === f && f === 'all'"
                              [class.text-primary]="submittalActiveFilter() === f && f === 'all'"
                              [class.bg-secondary]="submittalActiveFilter() !== f"
                              [class.text-foreground-60]="submittalActiveFilter() !== f"
                              aria-hidden="true"
                            >{{ submittalCounts()[f] }}</div>
                          </div>
                        }
                      </div>
                    }
                    <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                      <div role="columnheader">Sub #</div>
                      <div role="columnheader">Subject</div>
                      <div role="columnheader">Project</div>
                      <div role="columnheader">Assignee</div>
                      <div role="columnheader">Due</div>
                      <div role="columnheader">Status</div>
                    </div>
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

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals'],
    layoutStorageKey: 'dashboard-home',
    canvasStorageKey: 'canvas-layout:dashboard-home:v5',
    defaultColStarts: { homeTimeOff: 1, homeCalendar: 9, homeRfis: 1, homeSubmittals: 1 },
    defaultColSpans: { homeTimeOff: 8, homeCalendar: 8, homeRfis: 16, homeSubmittals: 16 },
    defaultTops: { homeTimeOff: 0, homeCalendar: 0, homeRfis: 596, homeSubmittals: 1072 },
    defaultHeights: { homeTimeOff: 440, homeCalendar: 580, homeRfis: 460, homeSubmittals: 460 },
    defaultLefts: { homeTimeOff: 0, homeCalendar: 648, homeRfis: 0, homeSubmittals: 0 },
    defaultPixelWidths: { homeTimeOff: 632, homeCalendar: 632, homeRfis: 1280, homeSubmittals: 1280 },
    canvasDefaultLefts: { homeTimeOff: 0, homeCalendar: 648, homeRfis: 0, homeSubmittals: 0 },
    canvasDefaultPixelWidths: { homeTimeOff: 632, homeCalendar: 632, homeRfis: 1280, homeSubmittals: 1280 },
    canvasDefaultTops: { homeTimeOff: 0, homeCalendar: 0, homeRfis: 456, homeSubmittals: 932 },
    canvasDefaultHeights: { homeTimeOff: 440, homeCalendar: 580, homeRfis: 460, homeSubmittals: 460 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 100,
    savesDesktopOnMobile: true,
    onBeforeMobileCompact: () => this.applyMobileHeights(),
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0 && this.engine.isCanvasMode()) {
      untracked(() => this.engine.resetWidgets());
    }
  });

  private readonly _cleanupOverlapsEffect = effect(() => {
    const tick = this.canvasResetService.cleanupOverlapsTick();
    if (tick > 0 && this.engine.isCanvasMode()) {
      untracked(() => this.engine.cleanupOverlaps());
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
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly timeOffRequests = TIME_OFF_REQUESTS;
  readonly rfis: Rfi[] = RFIS;
  readonly submittals: Submittal[] = SUBMITTALS;
  readonly calendarAppointments: CalendarAppointment[] = CALENDAR_APPOINTMENTS;
  readonly projects = signal(PROJECTS);
  readonly estimates = signal(ESTIMATES);

  readonly totalProjects = computed(() => this.projects().length);
  readonly openEstimatesCount = computed(() =>
    this.estimates().filter((e) => e.status !== 'Approved').length
  );
  readonly totalEstimateValue = computed(() => {
    const total = this.estimates()
      .filter((e) => e.status !== 'Approved')
      .reduce((sum, e) => sum + e.valueRaw, 0);
    if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
    if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
    return `$${total}`;
  });

  readonly homeWidgets: DashboardWidgetId[] = ['homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals'];
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

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

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, _grid: GridPage = 'home'): void {
    this.engine.startWidgetResize(target, dir, event);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, _grid: GridPage = 'home'): void {
    this.engine.startWidgetResizeTouch(target, dir, event);
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

  private static readonly MOBILE_HEADER_H = 58;
  private static readonly MOBILE_KPI_ROW_H = 53;
  private static readonly MOBILE_KPI_GAP = 8;
  private static readonly MOBILE_KPI_PADDING = 26;
  private static readonly MOBILE_KPI_ROWS = 5;
  private static readonly MOBILE_FILTER_PILLS_H = 50;
  private static readonly MOBILE_TABLE_HEADER_H = 42;
  private static readonly MOBILE_TABLE_ROW_H = 49;
  private static readonly MOBILE_EMPTY_STATE_H = 104;

  private mobileWidgetHeight(expanded: boolean, rowCount: number): number {
    const maxH = Math.floor(window.innerHeight * 0.75);
    const {
      MOBILE_HEADER_H,
      MOBILE_KPI_ROW_H,
      MOBILE_KPI_GAP,
      MOBILE_KPI_PADDING,
      MOBILE_KPI_ROWS,
      MOBILE_FILTER_PILLS_H,
      MOBILE_TABLE_HEADER_H,
      MOBILE_TABLE_ROW_H,
      MOBILE_EMPTY_STATE_H,
    } = HomePageComponent;

    if (expanded) {
      const tableBodyH = rowCount > 0 ? rowCount * MOBILE_TABLE_ROW_H : MOBILE_EMPTY_STATE_H;
      return Math.min(
        MOBILE_HEADER_H + MOBILE_FILTER_PILLS_H + MOBILE_TABLE_HEADER_H + tableBodyH,
        maxH
      );
    }
    return Math.min(
      MOBILE_HEADER_H +
        MOBILE_KPI_PADDING +
        MOBILE_KPI_ROWS * MOBILE_KPI_ROW_H +
        (MOBILE_KPI_ROWS - 1) * MOBILE_KPI_GAP,
      maxH
    );
  }

  private applyMobileHeights(): void {
    if (!this.isMobile()) return;
    const heights = { ...this.widgetHeights() };
    heights['homeRfis'] = this.mobileWidgetHeight(this.rfiMobileExpanded(), this.filteredRfis().length);
    heights['homeSubmittals'] = this.mobileWidgetHeight(
      this.submittalMobileExpanded(),
      this.filteredSubmittals().length
    );
    this.widgetHeights.set(heights);
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.homeGridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }

  readonly timeOffView = signal<'list' | 'calendar'>('list');
  readonly calendarYear = signal(2026);
  readonly calendarMonth = signal(2);

  private readonly _monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  private readonly _monthAbbr: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  readonly calendarMonthLabel = computed(
    () => `${this._monthNames[this.calendarMonth()]} ${this.calendarYear()}`
  );

  readonly calendarDays = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    interface TimeOffEntry {
      id: number;
      name: string;
      initials: string;
      type: string;
      startDate: string;
      endDate: string;
      days: number;
      status: 'Pending' | 'Approved' | 'Denied';
    }
    const dayMap = new Map<number, TimeOffEntry[]>();
    for (const req of this.timeOffRequests) {
      const [startMon, startDayStr] = req.startDate.split(' ');
      const [endMon, endDayStr] = req.endDate.split(' ');
      const start = new Date(year, this._monthAbbr[startMon], parseInt(startDayStr, 10));
      const end = new Date(year, this._monthAbbr[endMon], parseInt(endDayStr, 10));
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

    interface CalCell {
      day: number | null;
      requests: TimeOffEntry[];
    }
    const cells: CalCell[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, requests: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, requests: dayMap.get(d) ?? [] });
    while (cells.length % 7 !== 0) cells.push({ day: null, requests: [] });
    return cells;
  });

  prevCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update((y) => y - 1);
    } else {
      this.calendarMonth.update((v) => v - 1);
    }
  }

  nextCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update((y) => y + 1);
    } else {
      this.calendarMonth.update((v) => v + 1);
    }
  }

  timeOffStatusColor(status: string): string {
    if (status === 'Approved') return 'bg-success text-success-foreground';
    if (status === 'Pending') return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  }

  readonly pendingTimeOffCount = computed(() =>
    this.timeOffRequests.filter((r) => r.status === 'Pending').length
  );

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
    (_, i) => i + this.CAL_FIRST_HOUR
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
  private readonly _MON_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

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
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
  );

  readonly calendarDay2Appts = computed(() =>
    this.calendarAppointments
      .filter((a) => this.isSameCalDay(a.date, this.calendarDay2()))
      .sort((a, b) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
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

  readonly rfiFilterOptions: readonly (RfiStatus | 'all')[] = ['all', 'open', 'overdue', 'upcoming', 'closed'] as const;
  readonly rfiCompactItems: readonly { key: RfiStatus | 'all'; label: string; icon: string; destructive: boolean }[] = [
    { key: 'all', label: 'All RFIs', icon: 'clipboard', destructive: false },
    { key: 'open', label: 'Open', icon: 'clipboard', destructive: false },
    { key: 'overdue', label: 'Overdue', icon: 'warning', destructive: true },
    { key: 'upcoming', label: 'Upcoming', icon: 'clock', destructive: false },
    { key: 'closed', label: 'Closed', icon: 'check_circle', destructive: false },
  ];
  readonly rfiActiveFilter = signal<RfiStatus | 'all'>('all');
  readonly rfiMobileExpanded = signal(false);
  readonly isRfiCompact = computed(
    () => this.isMobile() || (this.widgetColSpans()['homeRfis'] ?? 16) <= 5
  );

  expandRfiMobile(filter: RfiStatus | 'all'): void {
    this.rfiActiveFilter.set(filter);
    this.rfiMobileExpanded.set(true);
    this.applyMobileHeights();
    this.engine.compactAll();
  }

  collapseRfiMobile(): void {
    this.rfiMobileExpanded.set(false);
    this.rfiActiveFilter.set('all');
    this.applyMobileHeights();
    this.engine.compactAll();
  }

  readonly rfiCounts = computed(() => ({
    all: this.rfis.length,
    open: this.rfis.filter((r) => r.status === 'open').length,
    overdue: this.rfis.filter((r) => r.status === 'overdue').length,
    upcoming: this.rfis.filter((r) => r.status === 'upcoming').length,
    closed: this.rfis.filter((r) => r.status === 'closed').length,
  }));

  readonly filteredRfis = computed(() => {
    const filter = this.rfiActiveFilter();
    if (filter === 'all') return this.rfis;
    return this.rfis.filter((r) => r.status === filter);
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

  readonly submittalFilterOptions: readonly (SubmittalStatus | 'all')[] = ['all', 'open', 'overdue', 'upcoming', 'closed'] as const;
  readonly submittalCompactItems: readonly { key: SubmittalStatus | 'all'; label: string; icon: string; destructive: boolean }[] = [
    { key: 'all', label: 'All Submittals', icon: 'document', destructive: false },
    { key: 'open', label: 'Open', icon: 'document', destructive: false },
    { key: 'overdue', label: 'Overdue', icon: 'warning', destructive: true },
    { key: 'upcoming', label: 'Upcoming', icon: 'clock', destructive: false },
    { key: 'closed', label: 'Closed', icon: 'check_circle', destructive: false },
  ];
  readonly submittalActiveFilter = signal<SubmittalStatus | 'all'>('all');
  readonly submittalMobileExpanded = signal(false);
  readonly isSubmittalCompact = computed(
    () => this.isMobile() || (this.widgetColSpans()['homeSubmittals'] ?? 16) <= 5
  );

  expandSubmittalMobile(filter: SubmittalStatus | 'all'): void {
    this.submittalActiveFilter.set(filter);
    this.submittalMobileExpanded.set(true);
    this.applyMobileHeights();
    this.engine.compactAll();
  }

  collapseSubmittalMobile(): void {
    this.submittalMobileExpanded.set(false);
    this.submittalActiveFilter.set('all');
    this.applyMobileHeights();
    this.engine.compactAll();
  }

  readonly submittalCounts = computed(() => ({
    all: this.submittals.length,
    open: this.submittals.filter((s) => s.status === 'open').length,
    overdue: this.submittals.filter((s) => s.status === 'overdue').length,
    upcoming: this.submittals.filter((s) => s.status === 'upcoming').length,
    closed: this.submittals.filter((s) => s.status === 'closed').length,
  }));

  readonly filteredSubmittals = computed(() => {
    const filter = this.submittalActiveFilter();
    if (filter === 'all') return this.submittals;
    return this.submittals.filter((s) => s.status === filter);
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

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToFinancials(): void {
    this.router.navigate(['/financials']);
  }
}
