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
import { CanvasDetailManager, type DetailView } from '../../shell/services/canvas-detail-manager';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { ItemDetailViewComponent } from '../../shared/detail/item-detail-view.component';
import {
  type StatusOption,
  STATUS_OPTIONS,
  ASSIGNEE_OPTIONS,
  itemStatusDot as getStatusDot,
  capitalizeStatus as getCapitalizedStatus,
} from '../../data/dashboard-item-status';
import { DrawingMarkupToolbarComponent, DRAWING_TOOLS } from '../../shared/detail/drawing-markup-toolbar.component';
import { PdfViewerComponent } from '../../shared/detail/pdf-viewer.component';
import { SUBNAV_CONFIGS } from '../project-dashboard/project-dashboard.config';
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
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  getProjectWeather,
} from '../../data/dashboard-data';
import type { UrgentNeedItem, UrgentNeedCategory, ProjectWeather, WeatherCondition } from '../../data/dashboard-data';
import { ALL_DRAWINGS_BY_PROJECT, type DrawingTile } from '../../data/drawings-data';
import { HomeKpiCardsComponent, type KpiCard } from './components/home-kpi-cards.component';

@Component({
  selector: 'app-home-page',
  imports: [
    WidgetLockToggleComponent,
    WidgetResizeHandleComponent,
    ItemDetailViewComponent,
    DrawingMarkupToolbarComponent,
    PdfViewerComponent,
    HomeKpiCardsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div [class]="isCanvasMode() ? 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto pointer-events-none' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
      @if (!isCanvasMode()) {
      <div #pageHeader>
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome back, Alex</div>
          <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <app-home-kpi-cards [cards]="kpiCards()" (cardClick)="handleKpiCardClick($event)" />
      </div>
      </div>
      }

      <div
        [class]="isCanvasMode() ? 'relative overflow-visible pointer-events-none' : 'relative'"
        [style.height.px]="isMobile() ? mobileGridHeight('home') : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
        #homeWidgetGrid
      >
        @if (isCanvasMode()) {
          <div
            class="absolute overflow-hidden pointer-events-auto"
            [class.widget-detail-transition]="shouldTransition('homeHeader')"
            [attr.data-widget-id]="'homeHeader'"
            [style.top.px]="widgetTops()['homeHeader']"
            [style.left.px]="widgetLefts()['homeHeader']"
            [style.width.px]="widgetPixelWidths()['homeHeader']"
            [style.height.px]="widgetHeights()['homeHeader']"
            [style.z-index]="widgetZIndices()['homeHeader'] ?? 0"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome back, Alex</div>
                <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <app-home-kpi-cards [cards]="kpiCards()" (cardClick)="handleKpiCardClick($event)" />
            </div>
          </div>
        }
        @for (widgetId of homeWidgets; track widgetId) {
          <div
            [class]="(canvasDetailViews()[widgetId] ? 'absolute pointer-events-auto' : (isMobile() ? 'absolute left-0 right-0 pointer-events-auto' + (widgetId === 'homeUrgentNeeds' ? '' : ' overflow-hidden') : 'absolute pointer-events-auto' + (widgetId === 'homeUrgentNeeds' ? '' : ' overflow-hidden'))) + (shouldTransition(widgetId) ? ' widget-detail-transition' : '')"
            [attr.data-widget-id]="widgetId"
            [style.top.px]="widgetTops()[widgetId]"
            [style.left.px]="!isMobile() ? widgetLefts()[widgetId] : null"
            [style.width.px]="!isMobile() ? widgetPixelWidths()[widgetId] : null"
            [style.height.px]="widgetHeights()[widgetId]"
            [style.z-index]="canvasDetailViews()[widgetId] ? 9999 : (widgetZIndices()[widgetId] ?? 0)"
            (mousedown)="canvasDetailViews()[widgetId] ? selectDetailWidget(widgetId, $event) : null"
          >
          @if (canvasDetailViews()[widgetId]; as detail) {
            @if (detail.type === 'rfi' || detail.type === 'submittal') {
            <div class="bg-background rounded-lg overflow-hidden flex flex-col h-full shadow-2xl"
              [class.border-default]="selectedWidgetId() !== widgetId"
              [class.border-primary]="selectedWidgetId() === widgetId">
              <div
                class="flex items-center justify-between px-5 py-3 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                (mousedown)="onCanvasDetailHeaderMouseDown($event, widgetId)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    [class]="detail.type === 'rfi' ? rfiStatusColor(detail.item.status) : submittalStatusColor(detail.item.status)">
                    <i class="modus-icons text-base text-primary-foreground" aria-hidden="true">{{ detail.type === 'rfi' ? 'clipboard' : 'document' }}</i>
                  </div>
                  <div class="text-sm font-semibold text-foreground truncate">{{ detail.item.number }}</div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <div class="relative">
                    <div class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150"
                      (click)="toggleCanvasHeaderStatus(widgetId, $event)"
                      (mousedown)="$event.stopPropagation()">
                      <div class="w-2 h-2 rounded-full"
                        [class]="detail.type === 'rfi' ? rfiStatusColor(detail.item.status) : submittalStatusColor(detail.item.status)"></div>
                      <div class="text-xs font-medium text-foreground">{{ detail.type === 'rfi' ? rfiStatusLabel(detail.item.status) : submittalStatusLabel(detail.item.status) }}</div>
                      <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
                    </div>
                    @if (canvasHeaderStatusOpen() === widgetId) {
                      <div class="absolute top-full right-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[160px] py-1"
                        role="listbox" (mousedown)="$event.stopPropagation()">
                        @for (opt of STATUS_OPTIONS; track opt.value) {
                          <div class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
                            role="option" [attr.aria-selected]="opt.value === detail.item.status"
                            (click)="onCanvasHeaderStatusSelect(widgetId, opt.value, $event)">
                            <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                            <div class="text-sm font-medium text-foreground">{{ opt.label }}</div>
                            @if (opt.value === detail.item.status) {
                              <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    (click)="closeCanvasDetail(widgetId)" aria-label="Close detail">
                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
                  </div>
                </div>
              </div>
              @if (subnavConfigs[detail.type === 'rfi' ? 'rfi-detail' : 'submittal-detail']; as snConfig) {
                <div class="bg-card border-bottom-default flex-shrink-0">
                  <div class="flex items-center justify-between px-4 py-2 gap-4">
                    <div class="flex items-center gap-2 flex-1 max-w-xs">
                      <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5 flex-1">
                        <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">search</i>
                        <input type="text" class="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-40 w-full"
                          [placeholder]="snConfig.searchPlaceholder" [value]="detailSubnavSearch()" (input)="detailSubnavSearch.set($any($event.target).value)" />
                      </div>
                      <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-secondary transition-colors duration-150"
                        role="button" tabindex="0" aria-label="Filter">
                        <i class="modus-icons text-base text-foreground-60" aria-hidden="true">filter</i>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      @for (btn of snConfig.actions; track btn.icon) {
                        <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
                          role="button" tabindex="0" [attr.aria-label]="btn.label">
                          <i class="modus-icons text-base" aria-hidden="true">{{ btn.icon }}</i>
                        </div>
                      }
                      <div class="flex items-center bg-secondary rounded ml-1">
                        @for (toggle of snConfig.viewToggles; track toggle.value) {
                          <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150"
                            [class]="detailSubnavViewMode() === toggle.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground'"
                            role="button" tabindex="0" [attr.aria-label]="toggle.label"
                            (click)="detailSubnavViewMode.set(toggle.value)">
                            <i class="modus-icons text-base" aria-hidden="true">{{ toggle.icon }}</i>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
              <div class="flex-1 overflow-y-auto p-5">
                @if (detail.type === 'rfi') {
                  <app-item-detail-view
                    [hideHeader]="true"
                    icon="clipboard"
                    typeLabel="Request for Information"
                    [number]="detail.item.number"
                    [subject]="detail.item.subject"
                    [question]="$any(detail.item).question"
                    [assignee]="detail.item.assignee"
                    [assigneeOptions]="ASSIGNEE_OPTIONS"
                    (assigneeChange)="onCanvasDetailAssigneeChange(widgetId, $event)"
                    field1Label="Created By"
                    [field1Value]="$any(detail.item).askedBy"
                    field3Label="Created On"
                    [field3Value]="$any(detail.item).askedOn"
                    field4Label="Due Date"
                    [field4Value]="detail.item.dueDate"
                    [field4ShowStatus]="false"
                    [currentStatus]="detail.item.status"
                    [statusOptions]="STATUS_OPTIONS"
                    [statusDotClass]="rfiStatusColor(detail.item.status)"
                    [statusText]="rfiStatusLabel(detail.item.status)"
                    (statusChange)="onCanvasDetailStatusChange(widgetId, $event)"
                    (dueDateChange)="onCanvasDetailDueDateChange(widgetId, $event)"
                  />
                }
                @if (detail.type === 'submittal') {
                  <app-item-detail-view
                    [hideHeader]="true"
                    icon="document"
                    typeLabel="Submittal"
                    [number]="detail.item.number"
                    [subject]="detail.item.subject"
                    [assignee]="detail.item.assignee"
                    [assigneeOptions]="ASSIGNEE_OPTIONS"
                    (assigneeChange)="onCanvasDetailAssigneeChange(widgetId, $event)"
                    [field1Value]="$any(detail.item).project"
                    [field3Value]="detail.item.dueDate"
                    [field3DateEditable]="true"
                    [currentStatus]="detail.item.status"
                    [statusOptions]="STATUS_OPTIONS"
                    [statusDotClass]="submittalStatusColor(detail.item.status)"
                    [statusText]="submittalStatusLabel(detail.item.status)"
                    (statusChange)="onCanvasDetailStatusChange(widgetId, $event)"
                    (dueDateChange)="onCanvasDetailDueDateChange(widgetId, $event)"
                  />
                }
              </div>
              <div
                class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                (mousedown)="onCanvasDetailResizeMouseDown($event, widgetId)"
              >
                <div class="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-foreground-40 rounded-br-sm"></div>
              </div>
            </div>
            }
            @if (detail.type === 'drawing') {
            <div #drawingDetailEl class="bg-card rounded-lg overflow-hidden flex flex-col h-full"
              [class.border-default]="selectedWidgetId() !== widgetId"
              [class.border-primary]="selectedWidgetId() === widgetId">
              <div
                class="flex items-center justify-between px-4 py-3 border-bottom-default cursor-move select-none flex-shrink-0"
                (mousedown)="onCanvasDetailHeaderMouseDown($event, widgetId)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">image</i>
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-foreground truncate">{{ detail.item.title }}</div>
                    <div class="text-xs text-foreground-40">{{ detail.item.revision }} &middot; {{ detail.item.date }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <div class="flex items-center gap-1.5 cursor-pointer" (click)="toggleDrawingEditMode()" (mousedown)="$event.stopPropagation()"
                    [attr.aria-label]="drawingEditMode() ? 'Switch to View mode' : 'Switch to Edit mode'" role="switch" [attr.aria-checked]="drawingEditMode()">
                    <div class="text-2xs font-medium" [class.text-foreground-40]="drawingEditMode()" [class.text-foreground-60]="!drawingEditMode()">View</div>
                    <div class="relative w-8 h-[18px] rounded-full transition-colors duration-200"
                      [class.bg-primary]="drawingEditMode()" [class.bg-secondary]="!drawingEditMode()">
                      <div class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-card shadow-sm transition-all duration-200"
                        [style.left.px]="drawingEditMode() ? 16 : 2"></div>
                    </div>
                    <div class="text-2xs font-medium" [class.text-primary]="drawingEditMode()" [class.text-foreground-40]="!drawingEditMode()">Edit</div>
                  </div>
                  <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    (click)="closeCanvasDetail(widgetId)" (mousedown)="$event.stopPropagation()" aria-label="Close detail">
                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
                  </div>
                </div>
              </div>
              @if (drawingEditMode()) {
                <div class="bg-card border-bottom-default flex-shrink-0 shadow-bottom relative z-10">
                  <div class="flex items-center justify-between px-4 py-2 gap-4">
                    <div class="flex items-center gap-2 flex-1 max-w-xs">
                      <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5 flex-1">
                        <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">search</i>
                        <input type="text" class="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-40 w-full"
                          placeholder="Search in drawing..." (mousedown)="$event.stopPropagation()" />
                      </div>
                      <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-secondary transition-colors duration-150"
                        role="button" tabindex="0" aria-label="Filter" (mousedown)="$event.stopPropagation()">
                        <i class="modus-icons text-base text-foreground-60" aria-hidden="true">filter</i>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
                        role="button" tabindex="0" aria-label="Download" (mousedown)="$event.stopPropagation()">
                        <i class="modus-icons text-base" aria-hidden="true">download</i>
                      </div>
                      <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
                        role="button" tabindex="0" aria-label="Print" (mousedown)="$event.stopPropagation()">
                        <i class="modus-icons text-base" aria-hidden="true">printer</i>
                      </div>
                      <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
                        role="button" tabindex="0" aria-label="Share" (mousedown)="$event.stopPropagation()">
                        <i class="modus-icons text-base" aria-hidden="true">share</i>
                      </div>
                    </div>
                  </div>
                </div>
              }
              <div class="flex-1 min-h-0 overflow-hidden relative">
                @if (detail.item.file && detail.item.file.endsWith('.pdf')) {
                  <app-pdf-viewer [src]="detail.item.file" />
                } @else {
                  <div class="h-full bg-secondary flex items-center justify-center">
                    <img [src]="detail.item.thumbnail" [alt]="detail.item.title" class="max-w-full max-h-full object-contain" />
                  </div>
                }
                @if (drawingEditMode()) {
                  <app-drawing-markup-toolbar [activeTool]="activeDrawingTool()" (toolSelect)="activeDrawingTool.set($event)" />
                }
              </div>
              <div
                class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                (mousedown)="onCanvasDetailResizeMouseDown($event, widgetId)"
              >
                <div class="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-foreground-40 rounded-br-sm"></div>
              </div>
            </div>
            }
          } @else {
            <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">
              <widget-lock-toggle [locked]="widgetLocked()[widgetId]" (toggle)="toggleWidgetLock(widgetId)" />

              @if (widgetId === 'homeTimeOff') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      @if (isTimeOffCompact() && timeOffMobileExpanded()) {
                        <div
                          class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150 -ml-1 mr-1"
                          role="button" tabindex="0" aria-label="Back to Time Off summary"
                          (click)="$event.stopPropagation(); collapseTimeOffMobile()"
                          (mousedown)="$event.stopPropagation()"
                          (touchstart)="$event.stopPropagation()"
                          (keydown.enter)="collapseTimeOffMobile()"
                          (keydown.space)="$event.preventDefault(); collapseTimeOffMobile()"
                        >
                          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">arrow_left</i>
                        </div>
                      } @else {
                        <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      }
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Time Off</div>
                      @if (pendingTimeOffCount() > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                          <div class="text-xs font-medium text-warning">{{ pendingTimeOffCount() }} pending</div>
                        </div>
                      }
                    </div>
                    @if (!isTimeOffCompact()) {
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
                    }
                  </div>

                  @if (isTimeOffCompact() && !timeOffMobileExpanded()) {
                    <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
                      @for (item of timeOffCompactItems; track item.key) {
                        <div
                          class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
                          role="button" tabindex="0"
                          [attr.aria-label]="item.label + ': ' + timeOffCounts()[item.key]"
                          (click)="expandTimeOffMobile(item.key)"
                          (keydown.enter)="expandTimeOffMobile(item.key)"
                          (keydown.space)="$event.preventDefault(); expandTimeOffMobile(item.key)"
                        >
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 {{ item.colorBg }}">
                            <i class="modus-icons text-base {{ item.colorText }}" aria-hidden="true">{{ item.icon }}</i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-foreground-60">{{ item.label }}</div>
                          </div>
                          <div class="text-lg font-bold"
                            [class.text-foreground]="item.key !== 'Denied'"
                            [class.text-destructive]="item.key === 'Denied'">{{ timeOffCounts()[item.key] }}</div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (timeOffView() === 'list' || (isTimeOffCompact() && timeOffMobileExpanded())) {
                      <div class="overflow-y-auto flex-1" role="table" aria-label="Time off requests">
                        <div class="grid grid-cols-[2fr_1fr_2fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
                          <div role="columnheader">Employee</div>
                          <div role="columnheader">Type</div>
                          <div role="columnheader">Dates</div>
                          <div role="columnheader">Days</div>
                          <div role="columnheader">Status</div>
                        </div>
                        @for (req of filteredTimeOff(); track req.id) {
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

                    @if (timeOffView() === 'calendar' && !isTimeOffCompact()) {
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
                        <div
                          class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                          role="row" tabindex="0"
                          (click)="openRfiDetail(rfi)"
                          (keydown.enter)="openRfiDetail(rfi)"
                          (mousedown)="$event.stopPropagation()"
                        >
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
                        <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" tabindex="0" (click)="openSubmittalDetail(sub)" (keydown.enter)="openSubmittalDetail(sub)" (mousedown)="$event.stopPropagation()">
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
              @else if (widgetId === 'homeDrawings') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">image</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Recent Drawings</div>
                      <div class="text-xs text-foreground-40">{{ recentDrawings().length }} projects</div>
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto" role="list" aria-label="Recent drawings by project">
                    @for (entry of recentDrawings(); track entry.projectId) {
                      <div
                        class="flex items-center gap-3 px-5 py-3 border-bottom-default last:border-b-0 hover:bg-muted transition-colors duration-150 cursor-pointer"
                        role="listitem"
                        (mousedown)="$event.stopPropagation()"
                        (touchstart)="$event.stopPropagation()"
                        (click)="openDrawingDetail(entry.projectId, entry.drawing)"
                      >
                        <div class="w-10 h-10 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                          <img [src]="entry.drawing.thumbnail" [alt]="entry.drawing.title" class="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-foreground truncate">{{ entry.drawing.title }}</div>
                          <div class="text-xs text-foreground-60 truncate">{{ entry.projectName }}</div>
                        </div>
                        <div class="flex-shrink-0 text-right">
                          <div class="text-xs font-medium text-foreground-80">{{ entry.drawing.revision }}</div>
                          <div class="text-xs text-foreground-40">{{ entry.drawing.date }}</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }

              @else if (widgetId === 'homeWeather') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-3.5 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-warning" aria-hidden="true">wb_sunny</i>
                      <div class="text-base font-semibold text-foreground">Weather Outlook</div>
                    </div>
                    <div class="flex items-center gap-2">
                      @if (weatherImpactProjects().length > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full" [class]="weatherImpactProjects()[0].majorDays > 0 ? 'bg-destructive-20' : 'bg-warning-20'">
                          <div class="text-xs font-medium" [class]="weatherImpactProjects()[0].majorDays > 0 ? 'text-destructive' : 'text-warning'">{{ weatherImpactProjects().length }} impacted</div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto min-h-0">
                    @if (weatherImpactProjects().length > 0) {
                      @for (pw of weatherImpactProjects(); track pw.project.id) {
                        <div
                          class="flex items-center gap-3 px-5 py-3 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="button" tabindex="0"
                          (click)="navigateToProject(pw.project.slug)"
                          (keydown.enter)="navigateToProject(pw.project.slug)"
                        >
                          <div class="flex items-center gap-2 flex-shrink-0">
                            <i class="modus-icons text-xl" [class]="weatherConditionColor(pw.weather.current.condition)" aria-hidden="true">{{ weatherConditionIcon(pw.weather.current.condition) }}</i>
                            <div class="text-lg font-semibold text-foreground">{{ pw.weather.current.tempF }}&deg;</div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <div class="text-sm font-medium text-foreground truncate">{{ pw.project.name }}</div>
                            </div>
                            <div class="text-xs text-foreground-60">{{ pw.project.city }}, {{ pw.project.state }}</div>
                          </div>
                          <div class="flex items-center gap-1.5 flex-shrink-0">
                            @if (pw.majorDays > 0) {
                              <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-destructive-20 text-destructive text-2xs font-medium">
                                <i class="modus-icons text-2xs" aria-hidden="true">error</i>
                                {{ pw.majorDays }}d stop
                              </div>
                            }
                            @if (pw.minorDays > 0) {
                              <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-warning-20 text-warning text-2xs font-medium">
                                <i class="modus-icons text-2xs" aria-hidden="true">warning</i>
                                {{ pw.minorDays }}d caution
                              </div>
                            }
                            <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                          </div>
                        </div>
                      }
                    }
                    @for (pw of allProjectWeather(); track pw.project.id) {
                      @if (pw.impactDays === 0) {
                        <div
                          class="flex items-center gap-3 px-5 py-2.5 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="button" tabindex="0"
                          (click)="navigateToProject(pw.project.slug)"
                          (keydown.enter)="navigateToProject(pw.project.slug)"
                        >
                          <div class="flex items-center gap-2 flex-shrink-0">
                            <i class="modus-icons text-lg" [class]="weatherConditionColor(pw.weather.current.condition)" aria-hidden="true">{{ weatherConditionIcon(pw.weather.current.condition) }}</i>
                            <div class="text-sm font-medium text-foreground">{{ pw.weather.current.tempF }}&deg;</div>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-foreground truncate">{{ pw.project.name }}</div>
                            <div class="text-2xs text-foreground-40">{{ pw.project.city }}, {{ pw.project.state }}</div>
                          </div>
                          <div class="flex items-center gap-1 flex-shrink-0">
                            <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-success-20 text-success text-2xs font-medium">
                              Clear
                            </div>
                            <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                          </div>
                        </div>
                      }
                    }
                  </div>

                  <div class="flex items-center justify-between px-5 py-2.5 border-top-default bg-card flex-shrink-0">
                    <div class="text-xs text-foreground-40">
                      {{ allProjectWeather().length }} sites
                    </div>
                    <div class="text-xs text-foreground-40">
                      {{ weatherImpactSummary() }}
                    </div>
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }

              @else if (widgetId === 'homeUrgentNeeds') {
                <div class="bg-card rounded-lg overflow-visible flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-destructive" aria-hidden="true">warning</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Urgent Needs</div>
                      @if (urgentCriticalCount() > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                          <div class="text-xs font-medium text-destructive">{{ urgentCriticalCount() }} critical</div>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-2 px-4 py-2.5 border-bottom-default flex-shrink-0 overflow-visible relative z-20">
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      @for (sev of urgentSeverityOptions; track sev.key) {
                        <div
                          class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                          [class]="urgentSeverityFilter().has(sev.key) ? sev.activeCls : 'bg-muted text-foreground-60 hover:bg-secondary'"
                          (click)="toggleUrgentSeverity(sev.key)"
                        >
                          <div class="w-1.5 h-1.5 rounded-full" [class]="sev.dotCls"></div>
                          {{ sev.label }} ({{ urgentSeverityCounts()[sev.key] }})
                        </div>
                      }
                    </div>
                    <div class="w-px h-5 bg-secondary flex-shrink-0"></div>
                    <div class="relative flex-shrink-0" data-urgent-category-dropdown>
                      <div
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                        [class]="urgentCategoryFilter() !== null ? 'bg-primary-20 text-primary' : 'bg-muted text-foreground-60 hover:bg-secondary'"
                        (click)="urgentCategoryDropdownOpen.set(!urgentCategoryDropdownOpen())"
                      >
                        <i class="modus-icons text-xs" aria-hidden="true">filter_list</i>
                        {{ urgentCategoryFilterLabel() }}
                        <i class="modus-icons text-xs" aria-hidden="true">{{ urgentCategoryDropdownOpen() ? 'expand_less' : 'expand_more' }}</i>
                      </div>
                      @if (urgentCategoryDropdownOpen()) {
                        <div class="absolute top-full left-0 mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] max-h-[280px] overflow-y-auto py-1">
                          <div
                            class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors duration-150"
                            [class]="urgentCategoryFilter() === null ? 'bg-primary-20 text-primary font-semibold' : 'text-foreground hover:bg-muted'"
                            (click)="clearUrgentCategoryFilter()"
                          >
                            <i class="modus-icons text-sm" aria-hidden="true">apps</i>
                            All Types
                          </div>
                          @for (cat of urgentCategoryOptions; track cat.key) {
                            <div
                              class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors duration-150"
                              [class]="urgentCategoryFilter()?.has(cat.key) ? 'bg-primary-20 text-primary font-semibold' : 'text-foreground hover:bg-muted'"
                              (click)="selectUrgentCategory(cat.key)"
                            >
                              <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">{{ cat.icon }}</i>
                              {{ cat.label }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                    <div class="w-px h-5 bg-secondary flex-shrink-0"></div>
                    <div class="relative flex-shrink-0" data-urgent-project-dropdown>
                      <div
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                        [class]="urgentProjectFilter() !== null ? 'bg-primary-20 text-primary' : 'bg-muted text-foreground-60 hover:bg-secondary'"
                        (click)="urgentProjectDropdownOpen.set(!urgentProjectDropdownOpen())"
                      >
                        <i class="modus-icons text-xs" aria-hidden="true">folder_closed</i>
                        {{ urgentProjectFilterLabel() }}
                        <i class="modus-icons text-xs" aria-hidden="true">{{ urgentProjectDropdownOpen() ? 'expand_less' : 'expand_more' }}</i>
                      </div>
                      @if (urgentProjectDropdownOpen()) {
                        <div class="absolute top-full left-0 mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[200px] max-h-[240px] overflow-y-auto py-1">
                          <div
                            class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors duration-150"
                            [class]="urgentProjectFilter() === null ? 'bg-primary-20 text-primary font-semibold' : 'text-foreground hover:bg-muted'"
                            (click)="urgentProjectFilter.set(null); urgentProjectDropdownOpen.set(false)"
                          >
                            <i class="modus-icons text-sm" aria-hidden="true">apps</i>
                            All Projects
                          </div>
                          @for (proj of urgentProjectOptions(); track proj.id) {
                            <div
                              class="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors duration-150 truncate"
                              [class]="urgentProjectFilter() === proj.id ? 'bg-primary-20 text-primary font-semibold' : 'text-foreground hover:bg-muted'"
                              (click)="urgentProjectFilter.set(proj.id); urgentProjectDropdownOpen.set(false)"
                              [attr.title]="proj.name"
                            >
                              <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">folder_closed</i>
                              {{ proj.name }}
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <div class="flex-1 overflow-y-auto min-h-0">
                    @for (item of filteredUrgentNeeds(); track item.id) {
                      <div
                        class="flex items-start gap-3 px-5 py-3 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                        role="button" tabindex="0"
                        (click)="navigateToUrgentNeed(item)"
                        (keydown.enter)="navigateToUrgentNeed(item)"
                      >
                        <div class="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                          <div class="w-2 h-2 rounded-full flex-shrink-0"
                            [class.bg-destructive]="item.severity === 'critical'"
                            [class.bg-warning]="item.severity === 'warning'"
                            [class.bg-primary]="item.severity === 'info'"></div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">{{ urgentNeedCategoryIcon(item.category) }}</i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-foreground truncate">{{ item.title }}</div>
                          <div class="text-xs text-foreground-60 truncate mt-0.5">{{ item.subtitle }}</div>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          @if (item.financialsRoute) {
                            <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary-20 text-primary text-2xs font-medium">
                              <i class="modus-icons text-2xs" aria-hidden="true">account_balance</i>
                              Job Costs
                            </div>
                          }
                          <div class="text-xs text-foreground-40 truncate max-w-[100px]" [attr.title]="item.projectName">{{ item.projectName }}</div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      </div>
                    } @empty {
                      <div class="flex flex-col items-center justify-center h-full py-8 text-foreground-40">
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">check_circle</i>
                        <div class="text-sm">No items match your filters</div>
                      </div>
                    }
                  </div>

                  <div class="flex items-center justify-between px-5 py-2.5 border-top-default bg-card flex-shrink-0">
                    <div class="text-xs text-foreground-40">
                      {{ filteredUrgentNeeds().length }} of {{ allUrgentNeeds.length }} items
                    </div>
                    <div class="text-xs text-foreground-40">
                      {{ urgentProjectSummary() }}
                    </div>
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />
              }

            </div>
          }
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

  private static readonly HEADER_HEIGHT = 190;
  private static readonly HEADER_OFFSET = HomePageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['homeHeader', 'homeUrgentNeeds', 'homeWeather', 'homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals', 'homeDrawings'],
    layoutStorageKey: 'dashboard-home-v5',
    canvasStorageKey: 'canvas-layout:dashboard-home:v10',
    defaultColStarts: { homeHeader: 1, homeUrgentNeeds: 1, homeWeather: 11, homeRfis: 1, homeSubmittals: 6, homeTimeOff: 11, homeCalendar: 1, homeDrawings: 11 },
    defaultColSpans: { homeHeader: 16, homeUrgentNeeds: 10, homeWeather: 6, homeRfis: 5, homeSubmittals: 5, homeTimeOff: 6, homeCalendar: 10, homeDrawings: 6 },
    defaultTops: { homeHeader: 0, homeUrgentNeeds: 0, homeWeather: 0, homeRfis: 356, homeSubmittals: 356, homeTimeOff: 356, homeCalendar: 712, homeDrawings: 712 },
    defaultHeights: { homeHeader: 0, homeUrgentNeeds: 340, homeWeather: 340, homeRfis: 340, homeSubmittals: 340, homeTimeOff: 340, homeCalendar: 440, homeDrawings: 340 },
    defaultLefts: { homeHeader: 0, homeUrgentNeeds: 0, homeWeather: 810, homeRfis: 0, homeSubmittals: 405, homeTimeOff: 810, homeCalendar: 0, homeDrawings: 810 },
    defaultPixelWidths: { homeHeader: 1280, homeUrgentNeeds: 794, homeWeather: 470, homeRfis: 389, homeSubmittals: 389, homeTimeOff: 470, homeCalendar: 794, homeDrawings: 470 },
    canvasDefaultLefts: { homeHeader: 0, homeUrgentNeeds: 0, homeWeather: 810, homeRfis: 0, homeSubmittals: 405, homeTimeOff: 810, homeCalendar: 0, homeDrawings: 810 },
    canvasDefaultPixelWidths: { homeHeader: 1280, homeUrgentNeeds: 794, homeWeather: 470, homeRfis: 389, homeSubmittals: 389, homeTimeOff: 470, homeCalendar: 794, homeDrawings: 470 },
    canvasDefaultTops: {
      homeHeader: 0,
      homeUrgentNeeds: HomePageComponent.HEADER_OFFSET,
      homeWeather: HomePageComponent.HEADER_OFFSET,
      homeTimeOff: HomePageComponent.HEADER_OFFSET + 356,
      homeRfis: HomePageComponent.HEADER_OFFSET + 356,
      homeSubmittals: HomePageComponent.HEADER_OFFSET + 356,
      homeDrawings: HomePageComponent.HEADER_OFFSET + 712,
      homeCalendar: HomePageComponent.HEADER_OFFSET + 712,
    },
    canvasDefaultHeights: { homeHeader: HomePageComponent.HEADER_HEIGHT, homeUrgentNeeds: 340, homeWeather: 340, homeRfis: 340, homeSubmittals: 340, homeTimeOff: 340, homeCalendar: 440, homeDrawings: 340 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 100,
    savesDesktopOnMobile: true,
    onBeforeMobileCompact: () => this.applyMobileHeights(),
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());
  private readonly _lockHeader = (() => {
    this.engine.widgetLocked.update(l => ({ ...l, homeHeader: true }));
  })();

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.engine.widgetLocked.update(l => ({ ...l, homeHeader: true }));
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

  readonly kpiCards = computed<KpiCard[]>(() => [
    { value: '' + this.totalProjects(), label: 'Active Projects', icon: 'briefcase', iconBg: 'bg-primary-20', iconColor: 'text-primary', ariaPrefix: 'Active Projects', action: 'projects' },
    { value: '' + this.openEstimatesCount(), label: 'Open Estimates', icon: 'description', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Open Estimates', action: 'projects' },
    { value: this.totalEstimateValue(), label: 'Estimate Pipeline', icon: 'bar_graph', iconBg: 'bg-success-20', iconColor: 'text-success', ariaPrefix: 'Estimate Pipeline', action: 'financials' },
  ]);

  readonly recentDrawings = computed(() => {
    const results: { projectId: number; projectName: string; drawing: DrawingTile }[] = [];
    for (const project of PROJECTS) {
      const drawings = ALL_DRAWINGS_BY_PROJECT[project.id];
      if (drawings?.length) {
        results.push({ projectId: project.id, projectName: project.name, drawing: drawings[0] });
      }
    }
    return results;
  });

  readonly homeWidgets: DashboardWidgetId[] = ['homeUrgentNeeds', 'homeWeather', 'homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals', 'homeDrawings'];
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly homeGridContainerRef = viewChild<ElementRef>('homeWidgetGrid');
  private readonly drawingDetailRef = viewChild<ElementRef>('drawingDetailEl');

  private readonly _drawingWheelEffect = effect(() => {
    const el = this.drawingDetailRef()?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener('wheel', handler, { passive: false });
    this.destroyRef.onDestroy(() => el.removeEventListener('wheel', handler));
  });

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

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.canvasHeaderStatusOpen() && !target.closest('[role="listbox"]') && !target.closest('[role="option"]')) {
      this.canvasHeaderStatusOpen.set(null);
    }
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
    heights['homeTimeOff'] = this.mobileWidgetHeight(
      this.timeOffMobileExpanded(),
      this.filteredTimeOff().length
    );
    heights['homeDrawings'] = 56 + this.recentDrawings().length * 64 + 16;
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

  readonly allUrgentNeeds = buildUrgentNeeds();
  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;

  readonly urgentSeverityFilter = signal<Set<string>>(new Set(['critical', 'warning', 'info']));
  readonly urgentCategoryFilter = signal<Set<UrgentNeedCategory> | null>(null);
  readonly urgentProjectFilter = signal<number | null>(null);
  readonly urgentProjectDropdownOpen = signal(false);
  readonly urgentCategoryDropdownOpen = signal(false);

  readonly urgentProjectFilterLabel = computed(() => {
    const id = this.urgentProjectFilter();
    if (id === null) return 'All Projects';
    const proj = this.urgentProjectOptions().find(p => p.id === id);
    return proj?.shortName ?? 'All Projects';
  });

  readonly urgentSeverityOptions = [
    { key: 'critical', label: 'Critical', dotCls: 'bg-destructive', activeCls: 'bg-destructive-20 text-destructive' },
    { key: 'warning', label: 'Warning', dotCls: 'bg-warning', activeCls: 'bg-warning-20 text-warning' },
    { key: 'info', label: 'Info', dotCls: 'bg-primary', activeCls: 'bg-primary-20 text-primary' },
  ] as const;

  readonly urgentCategoryOptions: { key: UrgentNeedCategory; label: string; icon: string }[] = [
    { key: 'budget', label: 'Budget', icon: 'account_balance' },
    { key: 'change-order', label: 'Change Orders', icon: 'swap_horiz' },
    { key: 'rfi', label: 'RFIs', icon: 'clipboard' },
    { key: 'submittal', label: 'Submittals', icon: 'document' },
    { key: 'schedule', label: 'Schedule', icon: 'calendar' },
    { key: 'inspection', label: 'Inspections', icon: 'search' },
    { key: 'safety', label: 'Safety', icon: 'shield' },
    { key: 'quality', label: 'Quality', icon: 'bug' },
  ];

  readonly urgentCategoryFilterLabel = computed(() => {
    const filter = this.urgentCategoryFilter();
    if (!filter) return 'All Types';
    if (filter.size === 1) {
      const key = [...filter][0];
      const opt = this.urgentCategoryOptions.find(o => o.key === key);
      return opt?.label ?? 'Filtered';
    }
    return `${filter.size} types`;
  });

  readonly urgentSeverityCounts = computed(() => {
    const items = this.allUrgentNeeds;
    const projFilter = this.urgentProjectFilter();
    const catFilter = this.urgentCategoryFilter();
    let filtered = projFilter !== null ? items.filter(i => i.projectId === projFilter) : items;
    if (catFilter) filtered = filtered.filter(i => catFilter.has(i.category));
    return {
      critical: filtered.filter(i => i.severity === 'critical').length,
      warning: filtered.filter(i => i.severity === 'warning').length,
      info: filtered.filter(i => i.severity === 'info').length,
    };
  });

  readonly urgentCriticalCount = computed(() => this.allUrgentNeeds.filter(i => i.severity === 'critical').length);

  readonly urgentProjectOptions = computed(() => {
    const projectIds = new Set(this.allUrgentNeeds.map(i => i.projectId));
    return PROJECTS
      .filter(p => projectIds.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        shortName: p.name.split(' ').slice(0, 2).join(' '),
      }));
  });

  readonly filteredUrgentNeeds = computed(() => {
    const sevFilter = this.urgentSeverityFilter();
    const projFilter = this.urgentProjectFilter();
    const catFilter = this.urgentCategoryFilter();
    return this.allUrgentNeeds.filter(item => {
      if (!sevFilter.has(item.severity)) return false;
      if (projFilter !== null && item.projectId !== projFilter) return false;
      if (catFilter && !catFilter.has(item.category)) return false;
      return true;
    });
  });

  readonly urgentProjectSummary = computed(() => {
    const items = this.filteredUrgentNeeds();
    const projects = new Set(items.map(i => i.projectId));
    return `${projects.size} project${projects.size !== 1 ? 's' : ''}`;
  });

  toggleUrgentSeverity(key: string): void {
    this.urgentSeverityFilter.update(set => {
      const next = new Set(set);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  selectUrgentCategory(cat: UrgentNeedCategory): void {
    const current = this.urgentCategoryFilter();
    if (current && current.size === 1 && current.has(cat)) {
      this.urgentCategoryFilter.set(null);
    } else {
      this.urgentCategoryFilter.set(new Set([cat]));
    }
    this.urgentCategoryDropdownOpen.set(false);
  }

  clearUrgentCategoryFilter(): void {
    this.urgentCategoryFilter.set(null);
    this.urgentCategoryDropdownOpen.set(false);
  }

  navigateToUrgentNeed(item: UrgentNeedItem): void {
    if (item.financialsRoute) {
      this.router.navigate([item.financialsRoute]);
    } else {
      this.router.navigate([item.route], { queryParams: item.queryParams });
    }
  }

  private readonly _urgentDropdownClickOutside = (() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (this.urgentProjectDropdownOpen() && !target.closest('[data-urgent-project-dropdown]')) {
          this.urgentProjectDropdownOpen.set(false);
        }
        if (this.urgentCategoryDropdownOpen() && !target.closest('[data-urgent-category-dropdown]')) {
          this.urgentCategoryDropdownOpen.set(false);
        }
      }, true);
    }
  })();

  readonly allProjectWeather = computed(() => {
    return PROJECTS.map(p => {
      const w = getProjectWeather(p.id);
      if (!w) return null;
      const impactDays = w.forecast.filter(f => f.workImpact !== 'none');
      const majorDays = w.forecast.filter(f => f.workImpact === 'major');
      const minorDays = w.forecast.filter(f => f.workImpact === 'minor');
      return { project: p, weather: w, impactDays: impactDays.length, majorDays: majorDays.length, minorDays: minorDays.length };
    }).filter(Boolean) as { project: typeof PROJECTS[0]; weather: ProjectWeather; impactDays: number; majorDays: number; minorDays: number }[];
  });

  readonly weatherImpactProjects = computed(() =>
    this.allProjectWeather().filter(pw => pw.impactDays > 0).sort((a, b) => b.majorDays - a.majorDays || b.impactDays - a.impactDays)
  );

  readonly weatherImpactSummary = computed(() => {
    const all = this.allProjectWeather();
    const impacted = all.filter(pw => pw.impactDays > 0);
    const majorCount = all.filter(pw => pw.majorDays > 0).length;
    if (majorCount > 0) return `${majorCount} project${majorCount !== 1 ? 's' : ''} with major weather impact`;
    if (impacted.length > 0) return `${impacted.length} project${impacted.length !== 1 ? 's' : ''} with weather advisories`;
    return 'No weather impacts expected';
  });

  weatherConditionIcon(condition: WeatherCondition): string {
    const map: Record<WeatherCondition, string> = {
      sunny: 'wb_sunny', 'partly-cloudy': 'cloud', cloudy: 'cloud',
      rain: 'water_drop', thunderstorm: 'flash_on', snow: 'ac_unit',
    };
    return map[condition] ?? 'cloud';
  }

  weatherConditionColor(condition: WeatherCondition): string {
    const map: Record<WeatherCondition, string> = {
      sunny: 'text-warning', 'partly-cloudy': 'text-foreground-60', cloudy: 'text-foreground-40',
      rain: 'text-primary', thunderstorm: 'text-destructive', snow: 'text-primary',
    };
    return map[condition] ?? 'text-foreground-60';
  }

  navigateToProject(projectSlug: string): void {
    this.router.navigate(['/projects', projectSlug]);
  }

  readonly pendingTimeOffCount = computed(() =>
    this.timeOffRequests.filter((r) => r.status === 'Pending').length
  );

  readonly timeOffFilterOptions: readonly ('all' | 'Pending' | 'Approved' | 'Denied')[] = ['all', 'Pending', 'Approved', 'Denied'] as const;
  readonly timeOffCompactItems: readonly { key: 'all' | 'Pending' | 'Approved' | 'Denied'; label: string; icon: string; colorBg: string; colorText: string }[] = [
    { key: 'all', label: 'All Requests', icon: 'calendar', colorBg: 'bg-primary-20', colorText: 'text-primary' },
    { key: 'Pending', label: 'Pending', icon: 'clock', colorBg: 'bg-warning-20', colorText: 'text-warning' },
    { key: 'Approved', label: 'Approved', icon: 'check_circle', colorBg: 'bg-success-20', colorText: 'text-success' },
    { key: 'Denied', label: 'Denied', icon: 'cancel_circle', colorBg: 'bg-destructive-20', colorText: 'text-destructive' },
  ];
  readonly timeOffActiveFilter = signal<'all' | 'Pending' | 'Approved' | 'Denied'>('all');
  readonly timeOffMobileExpanded = signal(false);
  readonly isTimeOffCompact = computed(
    () => this.isMobile() || (this.widgetColSpans()['homeTimeOff'] ?? 16) <= 6
  );

  readonly timeOffCounts = computed(() => ({
    all: this.timeOffRequests.length,
    Pending: this.timeOffRequests.filter((r) => r.status === 'Pending').length,
    Approved: this.timeOffRequests.filter((r) => r.status === 'Approved').length,
    Denied: this.timeOffRequests.filter((r) => r.status === 'Denied').length,
  }));

  readonly filteredTimeOff = computed(() => {
    const filter = this.timeOffActiveFilter();
    if (filter === 'all') return this.timeOffRequests;
    return this.timeOffRequests.filter((r) => r.status === filter);
  });

  expandTimeOffMobile(filter: 'all' | 'Pending' | 'Approved' | 'Denied'): void {
    this.timeOffActiveFilter.set(filter);
    this.timeOffMobileExpanded.set(true);
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
  }

  collapseTimeOffMobile(): void {
    this.timeOffMobileExpanded.set(false);
    this.timeOffActiveFilter.set('all');
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
  }

  private readonly _apptTypeColor: Record<ApptType, string> = {
    meeting: 'bg-primary-20 text-primary border-primary',
    review: 'bg-warning-20 text-warning border-warning',
    call: 'bg-success-20 text-success border-success',
    deadline: 'bg-destructive-20 text-destructive border-destructive',
    focus: 'bg-secondary text-foreground-60 border-muted',
  };

  private readonly CAL_FIRST_HOUR = 0;
  private readonly CAL_LAST_HOUR = 24;
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
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
  }

  collapseRfiMobile(): void {
    this.rfiMobileExpanded.set(false);
    this.rfiActiveFilter.set('all');
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
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
    return getStatusDot(status);
  }

  rfiStatusLabel(status: RfiStatus): string {
    return getCapitalizedStatus(status);
  }

  private findProjectSlug(projectName: string): string | null {
    const project = PROJECTS.find(p => p.name === projectName);
    return project ? project.slug : null;
  }

  openRfiDetail(rfi: Rfi): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeRfis', { type: 'rfi', item: rfi });
      return;
    }
    const slug = this.findProjectSlug(rfi.project);
    if (slug) {
      this.router.navigate(['/project', slug], { queryParams: { view: 'rfi', id: rfi.id, from: 'home' } });
    }
  }

  openSubmittalDetail(sub: Submittal): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeSubmittals', { type: 'submittal', item: sub });
      return;
    }
    const slug = this.findProjectSlug(sub.project);
    if (slug) {
      this.router.navigate(['/project', slug], { queryParams: { view: 'submittal', id: sub.id, from: 'home' } });
    }
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
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
  }

  collapseSubmittalMobile(): void {
    this.submittalMobileExpanded.set(false);
    this.submittalActiveFilter.set('all');
    if (this.isMobile()) {
      this.applyMobileHeights();
      this.engine.compactAll();
    }
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
    return getStatusDot(status);
  }

  submittalStatusLabel(status: SubmittalStatus): string {
    return getCapitalizedStatus(status);
  }

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToFinancials(): void {
    this.router.navigate(['/financials']);
  }

  handleKpiCardClick(action: string): void {
    if (action === 'projects') this.navigateToProjects();
    else if (action === 'financials') this.navigateToFinancials();
  }

  openDrawingDetail(projectId: number, drawing: DrawingTile): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeDrawings', { type: 'drawing', item: drawing });
      return;
    }
    const project = PROJECTS.find(p => p.id === projectId);
    if (project) {
      this.router.navigate(['/project', project.slug], {
        queryParams: { page: 'drawings', view: 'drawing', id: drawing.id },
      });
    }
  }

  readonly STATUS_OPTIONS = STATUS_OPTIONS;

  readonly ASSIGNEE_OPTIONS = ASSIGNEE_OPTIONS;

  private readonly _detailMgr = new CanvasDetailManager();
  readonly canvasDetailViews = this._detailMgr.canvasDetailViews;
  readonly hasCanvasDetails = this._detailMgr.hasCanvasDetails;
  readonly canvasInteractingId = this._detailMgr.canvasInteractingId;

  shouldTransition(widgetId: string): boolean {
    return this._detailMgr.shouldTransition(widgetId, this.moveTargetId());
  }

  readonly subnavConfigs = SUBNAV_CONFIGS;
  readonly detailSubnavSearch = signal('');
  readonly detailSubnavViewMode = signal<string>('details');
  readonly canvasHeaderStatusOpen = signal<string | null>(null);

  readonly drawingEditMode = signal(false);
  readonly activeDrawingTool = signal<string>('Draw');
  readonly drawingTools = DRAWING_TOOLS;

  toggleCanvasHeaderStatus(widgetId: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.canvasHeaderStatusOpen.update(v => v === widgetId ? null : widgetId);
  }

  onCanvasHeaderStatusSelect(widgetId: string, newStatus: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.canvasHeaderStatusOpen.set(null);
    this.onCanvasDetailStatusChange(widgetId, newStatus);
  }

  private openCanvasDetail(sourceWidgetId: string, detail: DetailView): void {
    const size = detail.type === 'drawing' ? { width: 1024, height: 768 } : undefined;
    this._detailMgr.openDetail(sourceWidgetId, detail, this.engine, size);
  }

  selectDetailWidget(widgetId: string, event: MouseEvent): void {
    this.widgetFocusService.selectWidget(widgetId);
    event.stopPropagation();
  }

  onCanvasDetailHeaderMouseDown(event: MouseEvent, widgetId: string): void {
    this._detailMgr.headerMouseDown(event, widgetId, this.engine);
  }

  onCanvasDetailResizeMouseDown(event: MouseEvent, widgetId: string): void {
    this._detailMgr.resizeMouseDown(event, widgetId, this.engine);
  }

  toggleDrawingEditMode(): void {
    this.drawingEditMode.update(v => !v);
  }

  closeCanvasDetail(widgetId: string): void {
    this.drawingEditMode.set(false);
    this._detailMgr.closeDetail(widgetId, this.engine, this.homeWidgets);
  }

  onCanvasDetailStatusChange(widgetId: string, newStatus: string): void {
    this._detailMgr.updateField(widgetId, 'status', newStatus);
  }

  onCanvasDetailAssigneeChange(widgetId: string, newAssignee: string): void {
    this._detailMgr.updateField(widgetId, 'assignee', newAssignee);
  }

  onCanvasDetailDueDateChange(widgetId: string, newDate: string): void {
    this._detailMgr.updateField(widgetId, 'dueDate', newDate);
  }
}
