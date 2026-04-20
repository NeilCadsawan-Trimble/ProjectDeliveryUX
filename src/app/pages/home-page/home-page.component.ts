import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  signal,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { DataStoreService } from '../../data/data-store.service';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import { getHomeLayoutKeys } from '../../shell/services/layout-keys';
import { HOME_FRANK_LAYOUT } from '../../data/layout-seeds/home-frank.layout';
import { HOME_BERT_LAYOUT } from '../../data/layout-seeds/home-bert.layout';
import { HOME_KELLY_LAYOUT } from '../../data/layout-seeds/home-kelly.layout';
import { HOME_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/home-dominique.layout';
import { HOME_PAMELA_LAYOUT } from '../../data/layout-seeds/home-pamela.layout';
import type { LayoutSeed } from '../../data/layout-seeds/layout-seed.types';
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
import { SUBNAV_CONFIGS, RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS, type NavItem } from '../project-dashboard/project-dashboard.config';
import type {
  DashboardWidgetId,
  GridPage,
  RfiStatus,
  SubmittalStatus,
  ChangeOrderStatus,
  EstimateStatus,
  TimeOffStatus,
  ApptType,
  CalendarAppointment,
  Rfi,
  Submittal,
  ActivityItem,
  ChangeOrder,
  Estimate,
  Project,
  UrgentNeedItem,
  UrgentNeedCategory,
  ProjectWeather,
  WeatherCondition,
  StaffingConflict,
  Contract,
  Inspection,
  PunchListItem,
  DailyReport,
} from '../../data/dashboard-data.types';
import {
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  weatherIcon,
  weatherIconColor,
  buildStaffingConflicts,
  formatCurrency,
} from '../../data/dashboard-data.formatters';
import { getAgent, type AgentDataState } from '../../data/widget-agents';
import { rewriteDynamicNeeds } from '../projects-page/projects-page-utils';
import { ALL_DRAWINGS_BY_PROJECT, type DrawingTile } from '../../data/drawings-data';
import { HOME_WIDGETS, KELLY_HOME_WIDGETS, PAMELA_HOME_WIDGETS } from '../../data/widget-registrations';
import { HomeKpiCardsComponent, type KpiCard } from './components/home-kpi-cards.component';
import { HomeApKpiCardsComponent, type ApKpiCard } from './components/home-ap-kpi-cards.component';
import { HomeInvoiceQueueComponent } from './components/home-invoice-queue.component';
import { HomePaymentScheduleComponent } from './components/home-payment-schedule.component';
import { HomeVendorAgingComponent } from './components/home-vendor-aging.component';
import { HomePayAppsComponent, type PayAppsView } from './components/home-pay-apps.component';
import { HomeLienWaiversComponent } from './components/home-lien-waivers.component';
import { HomeRetentionComponent } from './components/home-retention.component';
import { HomeApActivityComponent } from './components/home-ap-activity.component';
import { HomeCashOutflowComponent } from './components/home-cash-outflow.component';
import { HomeLearningProgressComponent } from './components/home-learning-progress.component';
import { HomeBudgetVarianceComponent } from './components/home-budget-variance.component';
import { HomeChangeOrdersComponent } from './components/home-change-orders.component';
import { HomeFieldOpsComponent } from './components/home-field-ops.component';
import { HomeDailyReportsComponent } from './components/home-daily-reports.component';
import { HomeTeamAllocationComponent } from './components/home-team-allocation.component';
import { HomeContractsComponent } from './components/home-contracts.component';
import { HomeOpenEstimatesComponent } from './components/home-open-estimates.component';
import { PROJECT_DATA, type TeamMember, type Milestone } from '../../data/project-data';
import type { ProjectTeamInput } from './components/home-team-allocation.component';
import { WidgetFrameComponent } from '../../shell/components/widget-frame.component';
import { CreateMenuDropdownComponent } from '../../shared/create-menu-dropdown.component';
import { StatusFilterPillsComponent } from '../../shared/status-filter-pills.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusTextInputComponent } from '../../components/modus-text-input.component';

// ── Area-adaptive block system ──────────────────────────────────
const HOME_HEADER_PX = 56;
const HOME_INSIGHT_PX = 32;
const HOME_MIN_CONTENT_PX = 80;

@Component({
  selector: 'app-home-page',
  imports: [
    WidgetLockToggleComponent,
    WidgetResizeHandleComponent,
    ItemDetailViewComponent,
    DrawingMarkupToolbarComponent,
    PdfViewerComponent,
    HomeKpiCardsComponent,
    HomeApKpiCardsComponent,
    HomeInvoiceQueueComponent,
    HomePaymentScheduleComponent,
    HomeVendorAgingComponent,
    HomePayAppsComponent,
    HomeLienWaiversComponent,
    HomeRetentionComponent,
    HomeApActivityComponent,
    HomeCashOutflowComponent,
    HomeLearningProgressComponent,
    HomeBudgetVarianceComponent,
    HomeChangeOrdersComponent,
    HomeFieldOpsComponent,
    HomeDailyReportsComponent,
    HomeTeamAllocationComponent,
    HomeContractsComponent,
    HomeOpenEstimatesComponent,
    WidgetFrameComponent,
    CreateMenuDropdownComponent,
    StatusFilterPillsComponent,
    ModusTypographyComponent,
    ModusTextInputComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  template: `
    <div [class]="isCanvasMode() ? 'py-4 md:py-6 pointer-events-none' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
      @if (!isCanvasMode()) {
      <div #pageHeader class="pointer-events-auto">
      <div class="flex items-start justify-between mb-4">
        <div>
          <modus-typography hierarchy="h1">Welcome back, {{ personaFirstName() }}</modus-typography>
          <modus-typography hierarchy="p" size="sm" className="text-foreground-60 mt-1">{{ today }}</modus-typography>
        </div>
        <app-create-menu-dropdown #createDropdownDesktop
          [allItems]="allCreateItems" [frequentItems]="frequentlyUsedItems"
          (itemSelected)="selectCreateItem($event)" />
      </div>
      </div>
      }

      <div
        [class]="isCanvasMode() ? 'relative overflow-visible pointer-events-none' : isMobile() ? 'relative' : 'relative widget-grid-desktop'"
        [style.height.px]="isMobile() ? mobileGridHeight('home') : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : (!isMobile() ? desktopGridMinHeight() : null)"
        #homeWidgetGrid
      >
        @for (widgetId of homeWidgets(); track widgetId) {
          <div
            [class]="(canvasDetailViews()[widgetId] ? 'absolute pointer-events-auto'
                   : isMobile() ? 'absolute left-0 right-0 pointer-events-auto' + (widgetId === 'homeUrgentNeeds' || widgetId === 'homeTimeOff' || widgetId === 'homeHeader' ? '' : ' overflow-hidden')
                   : isCanvasMode() ? 'absolute pointer-events-auto' + (widgetId === 'homeUrgentNeeds' || widgetId === 'homeTimeOff' || widgetId === 'homeHeader' ? '' : ' overflow-hidden')
                   : moveTargetId() === widgetId ? 'absolute pointer-events-auto overflow-hidden'
                   : 'pointer-events-auto' + (widgetId === 'homeUrgentNeeds' || widgetId === 'homeTimeOff' || widgetId === 'homeHeader' ? '' : ' overflow-hidden'))
                   + (shouldTransition(widgetId) ? ' widget-detail-transition' : '')"
            [attr.data-widget-id]="widgetId"
            [style.grid-column]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? widgetGridColumns()[widgetId] : null"
            [style.grid-row]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? '1' : null"
            [style.align-self]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? 'start' : null"
            [style.margin-top.px]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? widgetTops()[widgetId] : null"
            [style.top.px]="isMobile() || isCanvasMode() || moveTargetId() === widgetId ? widgetTops()[widgetId] : null"
            [style.left.px]="isCanvasMode() || moveTargetId() === widgetId ? widgetLefts()[widgetId] : null"
            [style.width.px]="isCanvasMode() ? widgetPixelWidths()[widgetId] : (moveTargetId() === widgetId ? dragWidth() : null)"
            [style.height.px]="widgetHeights()[widgetId]"
            [style.z-index]="canvasDetailViews()[widgetId] ? 9999 : (widgetId === 'homeTimeOff' && timeOffStatusOpen() !== null) ? 9998 : widgetZIndices()[widgetId]"
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
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ detail.item.number }}</modus-typography>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <div class="relative">
                    <div class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150"
                      (click)="toggleCanvasHeaderStatus(widgetId, $event)"
                      (mousedown)="$event.stopPropagation()">
                      <div class="w-2 h-2 rounded-full"
                        [class]="detail.type === 'rfi' ? rfiStatusColor(detail.item.status) : submittalStatusColor(detail.item.status)"></div>
                      <modus-typography hierarchy="p" size="xs" weight="semibold">{{ detail.type === 'rfi' ? rfiStatusLabel(detail.item.status) : submittalStatusLabel(detail.item.status) }}</modus-typography>
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
                            <modus-typography hierarchy="p" size="sm" weight="semibold">{{ opt.label }}</modus-typography>
                            @if (opt.value === detail.item.status) {
                              <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                  <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    (click)="openCanvasDetailInNewTab(widgetId)" (mousedown)="$event.stopPropagation()" aria-label="Open in new tab">
                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">launch</i>
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
                      <modus-text-input
                        [includeSearch]="true"
                        [bordered]="false"
                        size="sm"
                        [placeholder]="snConfig.searchPlaceholder"
                        [value]="detailSubnavSearch()"
                        (inputChange)="detailSubnavSearch.set($any($event).detail?.target?.value ?? '')"
                      />
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
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ detail.item.title }}</modus-typography>
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ detail.item.revision }} &middot; {{ detail.item.date }}</modus-typography>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <div class="flex items-center gap-1.5 cursor-pointer" (click)="toggleDrawingEditMode()" (mousedown)="$event.stopPropagation()"
                    [attr.aria-label]="drawingEditMode() ? 'Switch to View mode' : 'Switch to Edit mode'" role="switch" [attr.aria-checked]="drawingEditMode()">
                    <modus-typography hierarchy="p" size="xs" weight="semibold" [className]="drawingEditMode() ? 'text-foreground-40' : 'text-foreground-60'">View</modus-typography>
                    <div class="relative w-8 h-[18px] rounded-full transition-colors duration-200"
                      [class.bg-primary]="drawingEditMode()" [class.bg-secondary]="!drawingEditMode()">
                      <div class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-card shadow-sm transition-all duration-200"
                        [style.left.px]="drawingEditMode() ? 16 : 2"></div>
                    </div>
                    <modus-typography hierarchy="p" size="xs" weight="semibold" [className]="drawingEditMode() ? 'text-primary' : 'text-foreground-40'">Edit</modus-typography>
                  </div>
                  <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    (click)="openCanvasDetailInNewTab(widgetId)" (mousedown)="$event.stopPropagation()" aria-label="Open in new tab">
                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">launch</i>
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
                      <modus-text-input
                        [includeSearch]="true"
                        [bordered]="false"
                        size="sm"
                        placeholder="Search in drawing..."
                        (mousedown)="$event.stopPropagation()"
                      />
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
              @if (widgetId !== 'homeHeader') {
              <widget-lock-toggle [locked]="widgetLocked()[widgetId]" (toggle)="toggleWidgetLock(widgetId)" />
              }

              @if (widgetId === 'homeHeader') {
                @if (isCanvasMode()) {
                <div class="flex items-start justify-between h-full">
                  <div>
                    <modus-typography hierarchy="h1">Welcome back, {{ personaFirstName() }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-60 mt-1">{{ today }}</modus-typography>
                  </div>
                  <app-create-menu-dropdown class="mt-1" #createDropdownCanvas
                    [allItems]="allCreateItems" [frequentItems]="frequentlyUsedItems"
                    (itemSelected)="selectCreateItem($event)" />
                </div>
                }
              } @else if (widgetId === 'homeKpis') {
                <app-widget-frame
                  [title]="'Key Metrics'"
                  [icon]="'bar_graph_square'"
                  [iconClass]="'text-foreground-60'"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-4 py-3'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <div class="p-3 flex flex-col gap-2 overflow-y-auto flex-1">
                    <app-home-kpi-cards [cards]="kpiCards()" [compact]="true" (cardClick)="handleKpiCardClick($event)" />
                  </div>
                </app-widget-frame>

              } @else if (widgetId === 'homeEstimatorKpis') {
                <app-widget-frame
                  [title]="'Estimator Metrics'"
                  [icon]="'bar_graph_square'"
                  [iconClass]="'text-primary'"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-4 py-3'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <div class="p-3 flex flex-col gap-2 overflow-y-auto flex-1">
                    <app-home-kpi-cards [cards]="estimatorKpiCards()" [compact]="true" (cardClick)="handleEstimatorKpiClick($event)" />
                  </div>
                </app-widget-frame>

              } @else if (widgetId === 'homeTimeOff') {
                <div class="bg-card rounded-lg flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
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
                      <modus-typography hierarchy="h3" size="md" weight="semibold">Time Off</modus-typography>
                      @if (criticalStaffingConflicts().length) {
                        <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive-20">
                          <i class="modus-icons text-2xs text-destructive" aria-hidden="true">warning</i>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ criticalStaffingConflicts().length }} conflict{{ criticalStaffingConflicts().length === 1 ? '' : 's' }}</modus-typography>
                        </div>
                      } @else if (pendingTimeOffCount() > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-warning-20">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-warning">{{ pendingTimeOffCount() }} pending</modus-typography>
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
                          class="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors duration-150 select-none"
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
                          <modus-typography size="xs" weight="semibold">List</modus-typography>
                        </div>
                        <div class="w-px h-5 bg-muted flex-shrink-0" aria-hidden="true"></div>
                        <div
                          class="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors duration-150 select-none"
                          [class.bg-primary]="timeOffView() === 'staffing'"
                          [class.text-primary-foreground]="timeOffView() === 'staffing'"
                          [class.text-foreground-60]="timeOffView() !== 'staffing'"
                          role="tab"
                          tabindex="0"
                          [attr.aria-selected]="timeOffView() === 'staffing'"
                          (click)="timeOffView.set('staffing')"
                          (keydown.enter)="timeOffView.set('staffing')"
                          (keydown.space)="$event.preventDefault(); timeOffView.set('staffing')"
                        >
                          <i class="modus-icons text-sm" aria-hidden="true">people_group</i>
                          <modus-typography size="xs" weight="semibold">Staffing</modus-typography>
                        </div>
                        <div class="w-px h-5 bg-muted flex-shrink-0" aria-hidden="true"></div>
                        <div
                          class="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors duration-150 select-none"
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
                          <modus-typography size="xs" weight="semibold">Calendar</modus-typography>
                        </div>
                      </div>
                    }
                  </div>
                  @if (showHomeBlock(widgetId, 'insight') && timeOffInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ timeOffInsight() }}</modus-typography>
                    </div>
                  }

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
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ item.label }}</modus-typography>
                          </div>
                          <modus-typography hierarchy="p" size="lg" weight="bold"
                            [className]="item.key === 'Denied' ? 'text-destructive' : 'text-foreground'">{{ timeOffCounts()[item.key] }}</modus-typography>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (timeOffView() === 'list' || (isTimeOffCompact() && timeOffMobileExpanded())) {
                      @if (criticalStaffingConflicts().length) {
                        <div class="px-4 py-2 border-bottom-default flex flex-col gap-1.5">
                          @for (conflict of criticalStaffingConflicts().slice(0, 3); track conflict.week + conflict.projectName) {
                            <div class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted transition-colors duration-150"
                              [class.bg-destructive-20]="conflict.severity === 'critical'"
                              [class.bg-warning-20]="conflict.severity === 'warning'"
                              (click)="navigateToProject(conflict.projectId)"
                              role="button" tabindex="0"
                              (keydown.enter)="navigateToProject(conflict.projectId)"
                              (keydown.space)="$event.preventDefault(); navigateToProject(conflict.projectId)">
                              <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true"
                                [class.text-destructive]="conflict.severity === 'critical'"
                                [class.text-warning]="conflict.severity === 'warning'">warning</i>
                              <div class="flex-1 min-w-0">
                                <modus-typography hierarchy="p" size="xs" weight="semibold" className="truncate">{{ conflict.projectName }}</modus-typography>
                                <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ conflict.week }} -- {{ conflict.reason }}</modus-typography>
                              </div>
                              <i class="modus-icons text-xs text-foreground-40 flex-shrink-0" aria-hidden="true">chevron_right</i>
                            </div>
                          }
                        </div>
                      }
                      <div class="overflow-y-auto flex-1" role="table" aria-label="Time off requests">
                        <div class="grid grid-cols-[2fr_2fr_1fr_2fr_0.5fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default" role="row">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Employee</modus-typography>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Project</modus-typography>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Type</modus-typography>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Dates</modus-typography>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Days</modus-typography>
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Status</modus-typography>
                        </div>
                        @for (req of filteredTimeOff(); track req.id) {
                          <div class="grid grid-cols-[2fr_2fr_1fr_2fr_0.5fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                            <div class="flex items-center gap-2" role="cell">
                              <div class="w-7 h-7 rounded-full bg-primary-20 text-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
                                <modus-typography size="xs" weight="semibold">{{ req.initials }}</modus-typography>
                              </div>
                              <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ req.name }}</modus-typography>
                            </div>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate" role="cell">{{ req.projectName }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="bg-muted text-foreground-80 rounded px-2 py-1 inline-block w-fit" role="cell">{{ req.type }}</modus-typography>
                            <modus-typography hierarchy="p" size="sm" className="text-foreground-80" role="cell">{{ req.startDate }}@if (req.startDate !== req.endDate) { – {{ req.endDate }}}</modus-typography>
                            <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ req.days }}d</modus-typography>
                            <div role="cell" data-timeoff-dropdown>
                              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer select-none
                                {{ req.status === 'Approved' ? 'bg-success-20 text-success' :
                                   req.status === 'Pending'  ? 'bg-warning-20 text-warning' :
                                   'bg-destructive-20 text-destructive' }}"
                                (click)="toggleTimeOffStatus(req.id, $event)"
                                (mousedown)="$event.stopPropagation()">
                                <modus-typography size="xs" weight="semibold">{{ req.status }}</modus-typography>
                                <i class="modus-icons text-2xs" aria-hidden="true">caret_down</i>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }

                    @if (timeOffView() === 'staffing' && !isTimeOffCompact()) {
                      <div class="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-3">
                        <div class="grid grid-cols-4 gap-3">
                          <div class="bg-muted rounded-lg p-3 flex flex-col items-center gap-1">
                            <modus-typography hierarchy="p" size="xl" weight="bold">{{ timeOffRequests().length }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">Total Requests</modus-typography>
                          </div>
                          <div class="bg-muted rounded-lg p-3 flex flex-col items-center gap-1">
                            <modus-typography hierarchy="p" size="xl" weight="bold" [className]="pendingTimeOffCount() > 0 ? 'text-warning' : 'text-foreground'">{{ pendingTimeOffCount() }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">Pending</modus-typography>
                          </div>
                          <div class="bg-muted rounded-lg p-3 flex flex-col items-center gap-1">
                            <modus-typography hierarchy="p" size="xl" weight="bold">{{ allStaffingConflicts().length }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">Conflict Weeks</modus-typography>
                          </div>
                          <div class="bg-muted rounded-lg p-3 flex flex-col items-center gap-1">
                            <modus-typography hierarchy="p" size="xl" weight="bold" [className]="criticalStaffingConflicts().length > 0 ? 'text-destructive' : 'text-foreground'">{{ criticalStaffingConflicts().length }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">At Risk</modus-typography>
                          </div>
                        </div>

                        @for (proj of staffingByProject(); track proj.projectId) {
                          <div
                            class="rounded-lg p-3 flex flex-col gap-2 cursor-pointer hover:bg-muted transition-colors duration-150"
                            [class.bg-destructive-20]="proj.worstWeek?.severity === 'critical'"
                            [class.bg-warning-20]="proj.worstWeek?.severity === 'warning'"
                            [class.bg-muted]="!proj.worstWeek || proj.worstWeek.severity === 'info'"
                            (click)="navigateToProject(proj.projectId)"
                            role="button" tabindex="0"
                            (keydown.enter)="navigateToProject(proj.projectId)"
                            (keydown.space)="$event.preventDefault(); navigateToProject(proj.projectId)"
                          >
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-2 min-w-0">
                                <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ proj.projectName }}</modus-typography>
                                @if (proj.worstWeek?.severity === 'critical') {
                                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive-20 flex-shrink-0">
                                    <i class="modus-icons text-2xs text-destructive" aria-hidden="true">warning</i>
                                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">Critical</modus-typography>
                                  </div>
                                } @else if (proj.worstWeek?.severity === 'warning') {
                                  <div class="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning-20 flex-shrink-0">
                                    <i class="modus-icons text-2xs text-warning" aria-hidden="true">warning</i>
                                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-warning">Reduced</modus-typography>
                                  </div>
                                }
                              </div>
                              <div class="flex items-center gap-3 flex-shrink-0">
                                <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ proj.requestCount }} req</modus-typography>
                                <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ proj.totalDaysOut }}d out</modus-typography>
                                <i class="modus-icons text-xs text-foreground-40" aria-hidden="true">chevron_right</i>
                              </div>
                            </div>
                            <div class="flex items-center gap-2">
                              <div class="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  class="h-full rounded-full transition-all duration-300"
                                  [class.bg-destructive]="proj.worstWeek?.severity === 'critical'"
                                  [class.bg-warning]="proj.worstWeek?.severity === 'warning'"
                                  [class.bg-success]="!proj.worstWeek || proj.worstWeek.severity === 'info'"
                                  [style.width.%]="proj.worstWeek ? proj.worstWeek.absentPct : 0"
                                ></div>
                              </div>
                              <modus-typography class="flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-60 w-10 text-right">
                                @if (proj.worstWeek) {
                                  {{ proj.worstWeek.absentPct }}%
                                } @else {
                                  0%
                                }
                              </modus-typography>
                            </div>
                            @if (proj.worstWeek) {
                              <modus-typography hierarchy="p" size="xs" className="text-foreground-60">
                                Peak: {{ proj.worstWeek.week }} -- {{ proj.worstWeek.absentCount }}/{{ proj.worstWeek.teamSize }} absent ({{ proj.worstWeek.absentees.join(', ') }})
                              </modus-typography>
                            }
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
                          <modus-typography hierarchy="p" size="sm" weight="semibold" aria-live="polite">{{ calendarMonthLabel() }}</modus-typography>
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
                            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-center text-foreground-40 uppercase py-1">{{ d }}</modus-typography>
                          }
                        </div>
                        <div class="grid grid-cols-7 gap-px px-3 pb-3 overflow-y-auto flex-1">
                          @for (cell of calendarDays(); track cell.day ?? $index) {
                            <div class="min-h-[52px] rounded-lg p-1 flex flex-col gap-0.5"
                              [class.bg-muted]="cell.day !== null && cell.requests.length === 0"
                              [class.bg-primary-20]="cell.requests.length > 0"
                            >
                              @if (cell.day !== null) {
                                <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-center leading-4">{{ cell.day }}</modus-typography>
                                @for (req of cell.requests.slice(0, 2); track req.id) {
                                  <div class="flex items-center gap-1 rounded px-1 py-0.5 {{ timeOffStatusColor(req.status) }}">
                                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="leading-none truncate">{{ req.initials }}</modus-typography>
                                  </div>
                                }
                                @if (cell.requests.length > 2) {
                                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">+{{ cell.requests.length - 2 }}</modus-typography>
                                }
                              }
                            </div>
                          }
                        </div>
                        <div class="flex items-center gap-4 px-5 py-3 border-top-default flex-shrink-0" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
                          <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-success"></div>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Approved</modus-typography>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-warning"></div>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Pending</modus-typography>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <div class="w-2.5 h-2.5 rounded-sm bg-destructive"></div>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Denied</modus-typography>
                          </div>
                        </div>
                      </div>
                    }
                  }
                </div>
                @if (timeOffStatusOpen() !== null) {
                  <div class="fixed z-[9999] bg-card border-default rounded-lg shadow-lg min-w-[120px] py-1"
                    [style.top.px]="timeOffDropdownPos().top"
                    [style.left.px]="timeOffDropdownPos().left"
                    data-timeoff-dropdown
                    (mousedown)="$event.stopPropagation()">
                    @for (opt of timeOffStatusOptions; track opt) {
                      <div class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                        (click)="onTimeOffStatusSelect(timeOffStatusOpen()!, opt, $event)">
                        <div class="w-2 h-2 rounded-full flex-shrink-0
                          {{ opt === 'Approved' ? 'bg-success' : opt === 'Pending' ? 'bg-warning' : 'bg-destructive' }}"></div>
                        <modus-typography size="xs">{{ opt }}</modus-typography>
                      </div>
                    }
                  </div>
                }
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
                      <modus-typography hierarchy="h3" size="md" weight="semibold">Calendar</modus-typography>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ calendarDay1Meta().dateStr }} – {{ calendarDay2Meta().dateStr }}</modus-typography>
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
                        class="px-2 py-1 text-primary cursor-pointer hover:bg-primary-20 rounded transition-colors duration-150 select-none"
                        role="button" tabindex="0" aria-label="Go to today"
                        (click)="resetCalendarToToday()"
                        (keydown.enter)="resetCalendarToToday()"
                        (keydown.space)="$event.preventDefault(); resetCalendarToToday()"
                      ><modus-typography size="xs" weight="semibold">Today</modus-typography></div>
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
                  @if (showHomeBlock(widgetId, 'insight') && calendarInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ calendarInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="flex flex-shrink-0 border-bottom-default" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
                    <div class="w-12 flex-shrink-0"></div>
                    <div class="flex-1 py-2 px-3 text-center border-right-default">
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="uppercase tracking-wide {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                        {{ calendarDay1Meta().label }}
                      </modus-typography>
                      <modus-typography hierarchy="p" size="xl" weight="bold" className="leading-tight {{ calendarDay1Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                        {{ calendarDay1Meta().dayNum }}
                      </modus-typography>
                    </div>
                    <div class="flex-1 py-2 px-3 text-center">
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="uppercase tracking-wide {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground-60' }}">
                        {{ calendarDay2Meta().label }}
                      </modus-typography>
                      <modus-typography hierarchy="p" size="xl" weight="bold" className="leading-tight {{ calendarDay2Meta().isToday ? 'text-primary' : 'text-foreground' }}">
                        {{ calendarDay2Meta().dayNum }}
                      </modus-typography>
                    </div>
                  </div>

                  <div class="flex overflow-y-auto flex-1" #calendarScrollArea>
                    <div class="w-12 flex-shrink-0">
                      @for (hour of calendarHours; track hour) {
                        <div class="h-[60px] flex items-start justify-end pr-2 -mt-0">
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-40 mt-1">{{ formatCalHour(hour) }}</modus-typography>
                        </div>
                      }
                    </div>
                    <div class="flex-1 relative border-right-default">
                      @for (hour of calendarHours; track hour) {
                        <div class="h-[60px] border-bottom-default"></div>
                      }
                      @for (appt of calendarDay1Appts(); track appt.id) {
                        <div
                          class="absolute inset-x-1 rounded px-1.5 py-0.5 overflow-hidden border-l-2 {{ apptColor(appt.type) }}"
                          [class.cursor-pointer]="!!appt.projectSlug"
                          [class.cursor-default]="!appt.projectSlug"
                          [style.top.px]="apptTop(appt)"
                          [style.height.px]="apptHeight(appt)"
                          (click)="appt.projectSlug ? handleCalendarApptClick(appt.projectSlug) : null"
                        >
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="leading-tight truncate">{{ appt.title }}</modus-typography>
                          @if (apptHeight(appt) >= 36) {
                            <modus-typography hierarchy="p" size="xs" className="opacity-70 mt-0.5">{{ formatApptTime(appt.startHour, appt.startMin) }} – {{ formatApptTime(appt.endHour, appt.endMin) }}</modus-typography>
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
                          class="absolute inset-x-1 rounded px-1.5 py-0.5 overflow-hidden border-l-2 {{ apptColor(appt.type) }}"
                          [class.cursor-pointer]="!!appt.projectSlug"
                          [class.cursor-default]="!appt.projectSlug"
                          [style.top.px]="apptTop(appt)"
                          [style.height.px]="apptHeight(appt)"
                          (click)="appt.projectSlug ? handleCalendarApptClick(appt.projectSlug) : null"
                        >
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="leading-tight truncate">{{ appt.title }}</modus-typography>
                          @if (apptHeight(appt) >= 36) {
                            <modus-typography hierarchy="p" size="xs" className="opacity-70 mt-0.5">{{ formatApptTime(appt.startHour, appt.startMin) }} – {{ formatApptTime(appt.endHour, appt.endMin) }}</modus-typography>
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
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Meeting</modus-typography>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-sm bg-warning"></div>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Review</modus-typography>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-sm bg-success"></div>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Call</modus-typography>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-sm bg-destructive"></div>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Deadline</modus-typography>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-sm bg-secondary"></div>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Focus</modus-typography>
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
                      <modus-typography hierarchy="h3" size="md" weight="semibold">RFIs</modus-typography>
                      @if (rfiCounts().overdue > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ rfiCounts().overdue }} overdue</modus-typography>
                        </div>
                      }
                    </div>
                  </div>
                  @if (showHomeBlock(widgetId, 'insight') && rfisInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ rfisInsight() }}</modus-typography>
                    </div>
                  }

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
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ item.label }}</modus-typography>
                          </div>
                          <modus-typography hierarchy="p" size="lg" weight="bold"
                            [className]="item.destructive ? 'text-destructive' : 'text-foreground'">{{ rfiCounts()[item.key] }}</modus-typography>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (!isRfiCompact()) {
                      <app-status-filter-pills
                        [options]="rfiFilterOptions" [active]="rfiActiveFilter()"
                        [counts]="rfiCounts()" ariaLabel="Filter RFIs by status"
                        (filterChange)="onRfiFilterChange($event)"
                      />
                    }
                    <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0" role="row">
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">RFI #</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Subject</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Project</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Assignee</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Due</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Status</modus-typography>
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
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-primary" role="cell">{{ rfi.number }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="truncate" role="cell">{{ rfi.subject }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate" role="cell">{{ rfi.project }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ rfi.assignee }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ rfi.dueDate }}</modus-typography>
                          <div class="flex items-center gap-1.5" role="cell">
                            <div class="w-2 h-2 rounded-full {{ rfiStatusColor(rfi.status) }}" aria-hidden="true"></div>
                            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">{{ rfiStatusLabel(rfi.status) }}</modus-typography>
                          </div>
                        </div>
                      } @empty {
                        <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                          <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                          <modus-typography hierarchy="p" size="sm">No RFIs match this filter</modus-typography>
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
                      <modus-typography hierarchy="h3" size="md" weight="semibold">Submittals</modus-typography>
                      @if (submittalCounts().overdue > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ submittalCounts().overdue }} overdue</modus-typography>
                        </div>
                      }
                    </div>
                  </div>
                  @if (showHomeBlock(widgetId, 'insight') && submittalsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ submittalsInsight() }}</modus-typography>
                    </div>
                  }

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
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ item.label }}</modus-typography>
                          </div>
                          <modus-typography hierarchy="p" size="lg" weight="bold"
                            [className]="item.destructive ? 'text-destructive' : 'text-foreground'">{{ submittalCounts()[item.key] }}</modus-typography>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (!isSubmittalCompact()) {
                      <app-status-filter-pills
                        [options]="submittalFilterOptions" [active]="submittalActiveFilter()"
                        [counts]="submittalCounts()" ariaLabel="Filter Submittals by status"
                        (filterChange)="onSubmittalFilterChange($event)"
                      />
                    }
                    <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0" role="row">
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Sub #</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Subject</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Project</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Assignee</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Due</modus-typography>
                      <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide" role="columnheader">Status</modus-typography>
                    </div>
                    <div class="overflow-y-auto flex-1" role="table" aria-label="Submittals" aria-live="polite">
                      @for (sub of filteredSubmittals(); track sub.id) {
                        <div class="grid grid-cols-[1fr_2fr_2fr_1fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" tabindex="0" (click)="openSubmittalDetail(sub)" (keydown.enter)="openSubmittalDetail(sub)" (mousedown)="$event.stopPropagation()">
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-primary" role="cell">{{ sub.number }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="truncate" role="cell">{{ sub.subject }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate" role="cell">{{ sub.project }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ sub.assignee }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ sub.dueDate }}</modus-typography>
                          <div class="flex items-center gap-1.5" role="cell">
                            <div class="w-2 h-2 rounded-full {{ submittalStatusColor(sub.status) }}" aria-hidden="true"></div>
                            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">{{ submittalStatusLabel(sub.status) }}</modus-typography>
                          </div>
                        </div>
                      } @empty {
                        <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                          <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                          <modus-typography hierarchy="p" size="sm">No submittals match this filter</modus-typography>
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
                <app-widget-frame
                  [title]="'Recent Drawings'"
                  [icon]="'image'"
                  [iconClass]="'text-foreground-60'"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-5 py-4'"
                  [titleMeta]="recentDrawings().length + ' projects'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  @if (showHomeBlock(widgetId, 'insight') && drawingsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ drawingsInsight() }}</modus-typography>
                    </div>
                  }

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
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ entry.drawing.title }}</modus-typography>
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ entry.projectName }}</modus-typography>
                        </div>
                        <div class="flex-shrink-0 text-right">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-80">{{ entry.drawing.revision }}</modus-typography>
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ entry.drawing.date }}</modus-typography>
                        </div>
                      </div>
                    }
                  </div>
                </app-widget-frame>
              }

              @else if (widgetId === 'homeWeather') {
                <app-widget-frame
                  [title]="'Weather Outlook'"
                  [icon]="'sun'"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-5 py-3.5'"
                  [iconClass]="'text-warning'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  @if (weatherImpactProjects().length > 0) {
                    <div
                      headerExtra
                      class="flex items-center px-2 py-0.5 rounded-full flex-shrink-0"
                      [class]="weatherImpactProjects()[0].majorDays > 0 ? 'bg-destructive-20' : 'bg-warning-20'"
                    >
                      <modus-typography hierarchy="p" size="xs" weight="semibold"
                        [className]="weatherImpactProjects()[0].majorDays > 0 ? 'text-destructive' : 'text-warning'">
                        {{ weatherImpactProjects().length }} impacted
                      </modus-typography>
                    </div>
                  }
                  @if (showHomeBlock(widgetId, 'insight') && weatherInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ weatherInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="flex-1 overflow-y-auto min-h-0">
                    @if (weatherImpactProjects().length > 0) {
                      @for (pw of weatherImpactProjects(); track pw.project.id) {
                        <div
                          class="flex items-center gap-3 px-5 py-3 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="button" tabindex="0"
                          (click)="navigateToProject(pw.project.slug)"
                          (keydown.enter)="navigateToProject(pw.project.slug)"
                          (mousedown)="$event.stopPropagation()"
                        >
                          <div class="flex items-center gap-2 flex-shrink-0">
                            <i class="modus-icons text-xl" [class]="weatherConditionColor(pw.weather.current.condition)" aria-hidden="true">{{ weatherConditionIcon(pw.weather.current.condition) }}</i>
                            <modus-typography hierarchy="p" size="lg" weight="semibold">{{ pw.weather.current.tempF }}&deg;</modus-typography>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-1.5">
                              <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ pw.project.name }}</modus-typography>
                            </div>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ pw.project.city }}, {{ pw.project.state }}</modus-typography>
                          </div>
                          <div class="flex items-center gap-1.5 flex-shrink-0">
                            @if (pw.majorDays > 0) {
                              <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-destructive-20 text-destructive">
                                <i class="modus-icons text-2xs" aria-hidden="true">warning</i>
                                <modus-typography size="xs" weight="semibold" className="text-2xs">{{ pw.majorDays }}d stop</modus-typography>
                              </div>
                            }
                            @if (pw.minorDays > 0) {
                              <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-warning-20 text-warning">
                                <i class="modus-icons text-2xs" aria-hidden="true">warning</i>
                                <modus-typography size="xs" weight="semibold" className="text-2xs">{{ pw.minorDays }}d caution</modus-typography>
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
                          (mousedown)="$event.stopPropagation()"
                        >
                          <div class="flex items-center gap-2 flex-shrink-0">
                            <i class="modus-icons text-lg" [class]="weatherConditionColor(pw.weather.current.condition)" aria-hidden="true">{{ weatherConditionIcon(pw.weather.current.condition) }}</i>
                            <modus-typography hierarchy="p" size="sm" weight="semibold">{{ pw.weather.current.tempF }}&deg;</modus-typography>
                          </div>
                          <div class="flex-1 min-w-0">
                            <modus-typography hierarchy="p" size="xs" className="truncate">{{ pw.project.name }}</modus-typography>
                            <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ pw.project.city }}, {{ pw.project.state }}</modus-typography>
                          </div>
                          <div class="flex items-center gap-1 flex-shrink-0">
                            <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-success-20 text-success">
                              <modus-typography size="xs" weight="semibold" className="text-2xs">Clear</modus-typography>
                            </div>
                            <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </app-widget-frame>
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
                      <modus-typography hierarchy="h3" size="md" weight="semibold">Urgent Needs</modus-typography>
                      @if (urgentCriticalCount() > 0) {
                        <div class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ urgentCriticalCount() }} critical</modus-typography>
                        </div>
                      }
                    </div>
                  </div>
                  @if (showHomeBlock(widgetId, 'insight') && urgentNeedsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ urgentNeedsInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="flex flex-wrap items-center gap-2 px-4 py-2.5 border-bottom-default flex-shrink-0 overflow-visible relative z-20">
                    <div class="flex items-center gap-1.5">
                      @for (sev of urgentSeverityOptions; track sev.key) {
                        <div
                          class="flex items-center gap-1 px-2.5 py-1 rounded-full cursor-pointer transition-colors duration-150 select-none"
                          [class]="urgentSeverityFilter().has(sev.key) ? sev.activeCls : 'bg-muted text-foreground-60 hover:bg-secondary'"
                          (click)="toggleUrgentSeverity(sev.key)"
                        >
                          <div class="w-1.5 h-1.5 rounded-full" [class]="sev.dotCls"></div>
                          <modus-typography size="xs" weight="semibold">{{ sev.label }} ({{ urgentSeverityCounts()[sev.key] }})</modus-typography>
                        </div>
                      }
                    </div>
                    <div class="w-px h-5 bg-secondary flex-shrink-0 hidden md:block"></div>
                    <div class="relative flex-shrink-0" data-urgent-category-dropdown>
                      <div
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors duration-150 select-none"
                        [class]="urgentCategoryFilter() !== null ? 'bg-primary-20 text-primary' : 'bg-muted text-foreground-60 hover:bg-secondary'"
                        (click)="urgentCategoryDropdownOpen.set(!urgentCategoryDropdownOpen())"
                      >
                        <i class="modus-icons text-xs" aria-hidden="true">filter_list</i>
                        <modus-typography size="xs" weight="semibold">{{ urgentCategoryFilterLabel() }}</modus-typography>
                        <i class="modus-icons text-xs" aria-hidden="true">{{ urgentCategoryDropdownOpen() ? 'expand_less' : 'expand_more' }}</i>
                      </div>
                      @if (urgentCategoryDropdownOpen()) {
                        <div class="absolute top-full left-0 mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] max-h-[280px] overflow-y-auto py-1">
                          <div
                            class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150"
                            [class]="urgentCategoryFilter() === null ? 'bg-primary-20 text-primary' : 'text-foreground hover:bg-muted'"
                            (click)="clearUrgentCategoryFilter()"
                          >
                            <i class="modus-icons text-sm" aria-hidden="true">apps</i>
                            <modus-typography size="xs" [weight]="urgentCategoryFilter() === null ? 'semibold' : 'normal'">All Types</modus-typography>
                          </div>
                          @for (cat of urgentCategoryOptions; track cat.key) {
                            <div
                              class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150"
                              [class]="urgentCategoryFilter()?.has(cat.key) ? 'bg-primary-20 text-primary' : 'text-foreground hover:bg-muted'"
                              (click)="selectUrgentCategory(cat.key)"
                            >
                              <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">{{ cat.icon }}</i>
                              <modus-typography size="xs" [weight]="urgentCategoryFilter()?.has(cat.key) ? 'semibold' : 'normal'">{{ cat.label }}</modus-typography>
                            </div>
                          }
                        </div>
                      }
                    </div>
                    <div class="w-px h-5 bg-secondary flex-shrink-0 hidden md:block"></div>
                    <div class="relative flex-shrink-0" data-urgent-project-dropdown>
                      <div
                        class="flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors duration-150 select-none"
                        [class]="urgentProjectFilter() !== null ? 'bg-primary-20 text-primary' : 'bg-muted text-foreground-60 hover:bg-secondary'"
                        (click)="urgentProjectDropdownOpen.set(!urgentProjectDropdownOpen())"
                      >
                        <i class="modus-icons text-xs" aria-hidden="true">folder_closed</i>
                        <modus-typography size="xs" weight="semibold">{{ urgentProjectFilterLabel() }}</modus-typography>
                        <i class="modus-icons text-xs" aria-hidden="true">{{ urgentProjectDropdownOpen() ? 'expand_less' : 'expand_more' }}</i>
                      </div>
                      @if (urgentProjectDropdownOpen()) {
                        <div class="absolute top-full left-0 mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[200px] max-h-[240px] overflow-y-auto py-1">
                          <div
                            class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150"
                            [class]="urgentProjectFilter() === null ? 'bg-primary-20 text-primary' : 'text-foreground hover:bg-muted'"
                            (click)="urgentProjectFilter.set(null); urgentProjectDropdownOpen.set(false)"
                          >
                            <i class="modus-icons text-sm" aria-hidden="true">apps</i>
                            <modus-typography size="xs" [weight]="urgentProjectFilter() === null ? 'semibold' : 'normal'">All Projects</modus-typography>
                          </div>
                          @for (proj of urgentProjectOptions(); track proj.id) {
                            <div
                              class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors duration-150 truncate"
                              [class]="urgentProjectFilter() === proj.id ? 'bg-primary-20 text-primary' : 'text-foreground hover:bg-muted'"
                              (click)="urgentProjectFilter.set(proj.id); urgentProjectDropdownOpen.set(false)"
                              [attr.title]="proj.name"
                            >
                              <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">folder_closed</i>
                              <modus-typography size="xs" [weight]="urgentProjectFilter() === proj.id ? 'semibold' : 'normal'">{{ proj.name }}</modus-typography>
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
                        (mousedown)="$event.stopPropagation()"
                      >
                        <div class="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                          <div class="w-2 h-2 rounded-full flex-shrink-0"
                            [class.bg-destructive]="item.severity === 'critical'"
                            [class.bg-warning]="item.severity === 'warning'"
                            [class.bg-primary]="item.severity === 'info'"></div>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">{{ urgentNeedCategoryIcon(item.category) }}</i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ item.title }}</modus-typography>
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate mt-0.5">{{ item.subtitle }}</modus-typography>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0">
                          @if (item.financialsRoute) {
                            <div class="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary-20 text-primary">
                              <i class="modus-icons text-2xs" aria-hidden="true">building_corporate</i>
                              <modus-typography size="xs" weight="semibold" className="text-2xs">Job Costs</modus-typography>
                            </div>
                          }
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate max-w-[100px]" [attr.title]="item.projectName">{{ item.projectName }}</modus-typography>
                          <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">chevron_right</i>
                        </div>
                      </div>
                    } @empty {
                      <div class="flex flex-col items-center justify-center h-full py-8 text-foreground-40">
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">check_circle</i>
                        <modus-typography hierarchy="p" size="sm">No items match your filters</modus-typography>
                      </div>
                    }
                  </div>

                  <div class="flex items-center justify-between px-5 py-2.5 border-top-default bg-card flex-shrink-0">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-40">
                      {{ filteredUrgentNeeds().length }} of {{ allUrgentNeeds().length }} items
                    </modus-typography>
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-40">
                      {{ urgentProjectSummary() }}
                    </modus-typography>
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                />

              } @else if (widgetId === 'homeRecentActivity') {
                <app-widget-frame
                  [title]="'Recent Project Activity'"
                  [icon]="'history'"
                  [iconClass]="'text-foreground-60'"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  @if (showHomeBlock(widgetId, 'insight') && recentActivityInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ recentActivityInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="overflow-y-auto flex-1">
                    @for (activity of activities(); track activity.id) {
                      <div class="flex items-start gap-4 px-6 py-4 border-bottom-default last:border-b-0"
                        [class.cursor-pointer]="!!activity.projectId"
                        [class.hover:bg-muted]="!!activity.projectId"
                        [class]="activity.projectId ? 'transition-colors duration-150' : ''"
                        [attr.role]="activity.projectId ? 'button' : null"
                        [attr.tabindex]="activity.projectId ? 0 : null"
                        (click)="activity.projectId ? handleActivityClick(activity.projectId) : null"
                        (keydown.enter)="activity.projectId ? handleActivityClick(activity.projectId!) : null">
                        <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <i class="modus-icons text-sm {{ activity.iconColor }}" aria-hidden="true">{{ activity.icon }}</i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <modus-typography hierarchy="p" size="sm">
                            <div class="w-7 h-7 rounded-full bg-primary-20 text-primary inline-flex items-center justify-center mr-1 flex-shrink-0">
                              <modus-typography size="xs" weight="semibold">{{ activity.actorInitials }}</modus-typography>
                            </div>
                            {{ activity.text }}
                          </modus-typography>
                        </div>
                        <modus-typography class="flex-shrink-0 mt-0.5" hierarchy="p" size="xs" className="text-foreground-40">{{ activity.timeAgo }}</modus-typography>
                      </div>
                    }
                  </div>
                </app-widget-frame>

              } @else if (widgetId === 'homeApKpis') {
                <app-widget-frame
                  [title]="'AP Metrics'"
                  [icon]="'dashboard'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? apKpisInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <div class="flex flex-col gap-2 p-4">
                    <app-home-ap-kpi-cards [cards]="apKpiCards()" (cardClick)="handleApKpiClick($event)" />
                  </div>
                </app-widget-frame>

              } @else if (widgetId === 'homeInvoiceQueue') {
                <app-widget-frame
                  [title]="'Invoice Queue'"
                  [icon]="'invoice'"
                  [iconClass]="'text-warning'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? invoiceQueueInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-invoice-queue [invoices]="pendingApInvoices()" />
                </app-widget-frame>

              } @else if (widgetId === 'homePaymentSchedule') {
                <app-widget-frame
                  [title]="'Payment Schedule'"
                  [icon]="'calendar'"
                  [iconClass]="'text-destructive'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? paymentScheduleInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-payment-schedule [payments]="apPaymentSchedule()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeVendorAging') {
                <app-widget-frame
                  [title]="'Vendor Aging'"
                  [icon]="'timer'"
                  [iconClass]="'text-warning'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? vendorAgingInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-vendor-aging [vendors]="apVendors()" />
                </app-widget-frame>

              } @else if (widgetId === 'homePayApps') {
                <app-widget-frame
                  [title]="'Pay Applications'"
                  [icon]="'clipboard'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? payAppsInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <div headerTrailing class="flex items-center gap-1 bg-muted rounded p-0.5" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
                    <div
                      class="flex items-center justify-center w-7 h-7 rounded cursor-pointer transition-colors duration-150"
                      [class.bg-card]="payAppsView() === 'tile'"
                      [class.text-foreground]="payAppsView() === 'tile'"
                      [class.text-foreground-40]="payAppsView() !== 'tile'"
                      (click)="payAppsView.set('tile')">
                      <i class="modus-icons text-sm" aria-hidden="true">dashboard</i>
                    </div>
                    <div
                      class="flex items-center justify-center w-7 h-7 rounded cursor-pointer transition-colors duration-150"
                      [class.bg-card]="payAppsView() === 'table'"
                      [class.text-foreground]="payAppsView() === 'table'"
                      [class.text-foreground-40]="payAppsView() !== 'table'"
                      (click)="payAppsView.set('table')">
                      <i class="modus-icons text-sm" aria-hidden="true">list_bulleted</i>
                    </div>
                  </div>
                  <app-home-pay-apps
                    [payApps]="apPayApps()"
                    [view]="payAppsView()"
                    [interactive]="true"
                    [showViewAll]="true"
                    (payAppClick)="navigateToApSubpage()"
                    (viewAllClick)="navigateToApSubpage()"
                  />
                </app-widget-frame>

              } @else if (widgetId === 'homeLienWaivers') {
                <app-widget-frame
                  [title]="'Lien Waivers'"
                  [icon]="'file'"
                  [iconClass]="'text-destructive'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? lienWaiversInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-lien-waivers [waivers]="apLienWaivers()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeRetention') {
                <app-widget-frame
                  [title]="'Retention Summary'"
                  [icon]="'lock'"
                  [iconClass]="'text-foreground-60'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? retentionInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-retention [records]="apRetention()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeApActivity') {
                <app-widget-frame
                  [title]="'AP Activity'"
                  [icon]="'history'"
                  [iconClass]="'text-foreground-60'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? apActivityInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-ap-activity [activities]="apActivities()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeCashOutflow') {
                <app-widget-frame
                  [title]="'Cash Outflow'"
                  [icon]="'trending_down'"
                  [iconClass]="'text-destructive'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? cashOutflowInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-cash-outflow [payments]="apPaymentSchedule()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeLearning') {
                <app-widget-frame
                  [title]="'Learning Progress'"
                  [icon]="'learn'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? learningInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-learning-progress [plan]="learningPlan()" />
                </app-widget-frame>

              } @else if (widgetId === 'homeMilestones') {
                <app-widget-frame
                  [title]="'Cross-Project Milestones'"
                  [icon]="'flag'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? milestonesInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <div class="flex flex-col gap-1 h-full min-h-0 overflow-y-auto p-4">
                    @for (ms of crossProjectMilestones().slice(0, 15); track ms.name) {
                      <div class="flex items-center gap-3 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
                        role="button" tabindex="0"
                        (click)="handleMilestoneClick(ms.projectSlug)"
                        (keydown.enter)="handleMilestoneClick(ms.projectSlug)">
                        <div class="w-2 h-2 rounded-full shrink-0"
                          [class]="ms.status === 'completed' ? 'bg-success' : ms.status === 'overdue' ? 'bg-destructive' : ms.status === 'in-progress' ? 'bg-primary' : 'bg-muted'"></div>
                        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ ms.name }}</modus-typography>
                          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ ms.projectName }}</modus-typography>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                          <div class="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                            <div class="h-full rounded-full bg-primary" [style.width.%]="ms.progress"></div>
                          </div>
                          <modus-typography hierarchy="p" size="xs" className="tabular-nums text-foreground-60 w-16 text-right">{{ ms.dueDate.split(',')[0] }}</modus-typography>
                        </div>
                      </div>
                    }
                  </div>
                </app-widget-frame>

              } @else if (widgetId === 'homeBudgetVariance') {
                <app-widget-frame
                  [title]="'Budget Variance'"
                  [icon]="'bar_graph_square'"
                  [iconClass]="'text-warning'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? budgetVarianceInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-budget-variance [projects]="projects()" (rowClick)="handleBudgetRowClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeChangeOrders') {
                <app-widget-frame
                  [title]="'Change Orders'"
                  [icon]="'swap'"
                  [iconClass]="'text-warning'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? changeOrdersInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-change-orders [changeOrders]="allChangeOrders()" (orderClick)="handleChangeOrderClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeFieldOps') {
                <app-widget-frame
                  [title]="'Field Operations'"
                  [icon]="'clipboard'"
                  [iconClass]="'text-success'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? fieldOpsInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-field-ops [inspections]="allInspections()" [punchListItems]="allPunchListItems()" (inspectionClick)="handleInspectionClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeDailyReports') {
                <app-widget-frame
                  [title]="'Daily Reports'"
                  [icon]="'calendar'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? dailyReportsInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-daily-reports [dailyReports]="allDailyReports()" (reportClick)="handleDailyReportClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeTeamAllocation') {
                <app-widget-frame
                  [title]="'Team Allocation'"
                  [icon]="'people'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? teamAllocationInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-team-allocation [projectTeams]="projectTeamInputs()" (projectClick)="handleTeamProjectClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeContracts') {
                <app-widget-frame
                  [title]="'Contract Status'"
                  [icon]="'document'"
                  [iconClass]="'text-success'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? contractsInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-contracts [contracts]="allContracts()" (contractClick)="handleContractClick($event)" />
                </app-widget-frame>

              } @else if (widgetId === 'homeOpenEstimates') {
                <app-widget-frame
                  [title]="'Open Estimates'"
                  [icon]="'description'"
                  [iconClass]="'text-primary'"
                  [insight]="showHomeBlock(widgetId, 'insight') ? openEstimatesInsight() : null"
                  [selected]="selectedWidgetId() === widgetId"
                  [isMobile]="isMobile()"
                  [headerPadding]="'px-6 py-4'"
                  [titleSize]="'lg'"
                  (headerMouseDown)="onWidgetHeaderMouseDown(widgetId, $event, 'home')"
                  (headerTouchStart)="onWidgetHeaderTouchStart(widgetId, $event, 'home')"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event, 'home')"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event, 'home')"
                >
                  <app-home-open-estimates [estimates]="estimates()" (estimateClick)="navigateToEstimate($event)" />
                </app-widget-frame>
              }

            </div>
          }
          </div>
        }

      </div>
    </div>

  `,
})
export class HomePageComponent extends DashboardPageBase {
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  readonly personaFirstName = computed(() => this.personaService.activePersona().firstName);
  private personaPrefix(): string { return `/${this.personaService.activePersonaSlug()}`; }

  private static readonly KPI_HEIGHT = 200;
  private static readonly ROW_1_HEIGHT = 336;
  private static readonly ROW_2_HEIGHT = 336;
  private static readonly ROW_3_MAX_HEIGHT = 448;
  private static readonly ROW_2_TOP = HomePageComponent.ROW_1_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_3_TOP = HomePageComponent.ROW_2_TOP + HomePageComponent.ROW_2_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_4_TOP = HomePageComponent.ROW_3_TOP + HomePageComponent.ROW_3_MAX_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_4_HEIGHT = 384;
  private static readonly ROW_5_TOP = HomePageComponent.ROW_4_TOP + HomePageComponent.ROW_4_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_5_HEIGHT = 336;
  private static readonly ROW_6_TOP = HomePageComponent.ROW_5_TOP + HomePageComponent.ROW_5_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_6_HEIGHT = 336;
  private static readonly ROW_7_TOP = HomePageComponent.ROW_6_TOP + HomePageComponent.ROW_6_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ROW_7_HEIGHT = 336;
  private static readonly ROW_8_TOP = HomePageComponent.ROW_7_TOP + HomePageComponent.ROW_7_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private static readonly CANVAS_HEADER_HEIGHT = 80;
  private static readonly CANVAS_HEADER_OFFSET = HomePageComponent.CANVAS_HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  protected override getEngineConfig(): DashboardLayoutConfig {
    const seed = this.getLayoutSeedForCurrentPersona();

    return {
      ...seed,
      layoutStorageKey: () => getHomeLayoutKeys(this.personaService.activePersonaSlug()).desktop,
      canvasStorageKey: () => getHomeLayoutKeys(this.personaService.activePersonaSlug()).canvas,
      minColSpan: 4,
      canvasGridMinHeightOffset: 100,
      savesDesktopOnMobile: true,
      onBeforeMobileCompact: () => this.applyMobileHeights(),
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    };
  }

  protected override getLayoutSeedForCurrentPersona(): LayoutSeed {
    const slug = this.personaService.activePersonaSlug();
    switch (slug) {
      case 'frank': return HOME_FRANK_LAYOUT;
      case 'bert': return HOME_BERT_LAYOUT;
      case 'kelly': return HOME_KELLY_LAYOUT;
      case 'dominique': return HOME_DOMINIQUE_LAYOUT;
      case 'pamela': return HOME_PAMELA_LAYOUT;
      default: return HOME_FRANK_LAYOUT;
    }
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, homeHeader: true }));
  }

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly timeOffRequests = this.store.timeOffRequests;
  readonly activities = this.store.activities;
  readonly rfis = this.store.rfis;
  readonly submittals = this.store.submittals;
  readonly calendarAppointments = this.store.calendarAppointments;
  readonly projects = this.store.projects;
  readonly estimates = this.store.estimates;

  readonly totalProjects = computed(() => this.projects().length);
  readonly atRiskProjects = computed(() =>
    this.projects().filter(p => p.status === 'At Risk' || p.status === 'Overdue')
  );
  readonly openEstimatesCount = computed(() =>
    this.estimates().filter((e) => e.status !== 'Approved').length
  );
  readonly totalEstimateValue = computed(() => {
    const total = this.estimates()
      .filter((e) => e.status !== 'Approved')
      .reduce((sum, e) => sum + e.valueRaw, 0);
    return formatCurrency(total);
  });
  readonly overdueRfis = computed(() => this.rfis().filter(r => r.status === 'overdue'));
  readonly overdueSubmittals = computed(() => this.submittals().filter(s => s.status === 'overdue'));
  readonly overdueItemCount = computed(() => this.overdueRfis().length + this.overdueSubmittals().length);
  readonly pendingChangeOrders = computed(() => this.store.changeOrders().filter(co => co.status === 'pending'));
  readonly pendingCoTotal = computed(() => this.pendingChangeOrders().reduce((s, co) => s + Math.abs(co.amount), 0));
  readonly failedInspections = computed(() => this.store.inspections().filter(i => i.result === 'fail' || i.result === 'conditional'));
  readonly openPunchItems = computed(() => this.store.punchListItems().filter(p => p.status === 'open' || p.status === 'in-progress'));
  readonly approvedCosThisMonth = computed(() => {
    const now = new Date();
    const monthStr = now.toLocaleString('en-US', { month: 'short' });
    return this.store.changeOrders()
      .filter(co => co.status === 'approved' && co.requestDate.includes(monthStr))
      .reduce((s, co) => s + Math.abs(co.amount), 0);
  });

  readonly allChangeOrders = computed<ChangeOrder[]>(() => this.store.changeOrders());
  readonly allContracts = computed<Contract[]>(() => this.store.contracts());
  readonly allInspections = computed<Inspection[]>(() => this.store.inspections());
  readonly allPunchListItems = computed<PunchListItem[]>(() => this.store.punchListItems());
  readonly allDailyReports = computed<DailyReport[]>(() => this.store.dailyReports());

  readonly crossProjectMilestones = computed<(Milestone & { projectName: string; projectId: number; projectSlug: string })[]>(() => {
    const milestones: (Milestone & { projectName: string; projectId: number; projectSlug: string })[] = [];
    for (const [idStr, pd] of Object.entries(PROJECT_DATA)) {
      const pid = +idStr;
      const proj = this.store.findProjectById(pid);
      const slug = proj?.slug ?? '';
      for (const m of pd.milestones) {
        milestones.push({ ...m, projectName: pd.name ?? '', projectId: pid, projectSlug: slug });
      }
    }
    return milestones.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  });

  readonly projectTeamInputs = computed<ProjectTeamInput[]>(() => {
    const result: ProjectTeamInput[] = [];
    for (const [idStr, pd] of Object.entries(PROJECT_DATA)) {
      result.push({ projectId: +idStr, projectName: pd.name ?? `Project ${idStr}`, team: pd.team });
    }
    return result;
  });

  readonly flatTeamMembers = computed<TeamMember[]>(() => {
    const members: TeamMember[] = [];
    for (const [, pd] of Object.entries(PROJECT_DATA)) {
      members.push(...pd.team);
    }
    return members;
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    const pool: (KpiCard & { priority: number })[] = [];

    const overdueCount = this.overdueItemCount();
    if (overdueCount > 0) {
      const rfiCount = this.overdueRfis().length;
      const subCount = this.overdueSubmittals().length;
      const parts: string[] = [];
      if (rfiCount > 0) parts.push(`${rfiCount} RFI${rfiCount > 1 ? 's' : ''}`);
      if (subCount > 0) parts.push(`${subCount} submittal${subCount > 1 ? 's' : ''}`);
      pool.push({ priority: 100, value: '' + overdueCount, label: 'Overdue Items', icon: 'warning', iconBg: 'bg-destructive-20', iconColor: 'text-destructive', ariaPrefix: 'Overdue Items', action: 'overdue-items', subtitle: parts.join(', ') });
    }

    const atRisk = this.atRiskProjects();
    if (atRisk.length > 0) {
      const names = atRisk.slice(0, 2).map(p => p.name.split(' ').slice(0, 2).join(' '));
      pool.push({ priority: 90, value: '' + atRisk.length, label: 'Projects At Risk', icon: 'alert', iconBg: 'bg-destructive-20', iconColor: 'text-destructive', ariaPrefix: 'Projects At Risk', action: 'at-risk-projects', subtitle: names.join(', ') });
    }

    const pendingCoAmt = this.pendingCoTotal();
    if (pendingCoAmt > 0) {
      const coCount = this.pendingChangeOrders().length;
      pool.push({ priority: 80, value: formatCurrency(pendingCoAmt), label: 'Pending COs', icon: 'swap_horizontal', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Pending Change Orders', action: 'pending-cos', subtitle: `across ${coCount} order${coCount > 1 ? 's' : ''}` });
    }

    const failedIns = this.failedInspections();
    if (failedIns.length > 0) {
      const failCount = failedIns.filter(i => i.result === 'fail').length;
      const condCount = failedIns.filter(i => i.result === 'conditional').length;
      const parts: string[] = [];
      if (failCount > 0) parts.push(`${failCount} failed`);
      if (condCount > 0) parts.push(`${condCount} conditional`);
      pool.push({ priority: 70, value: '' + failedIns.length, label: 'Inspections Need Follow-Up', icon: 'clipboard', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Inspections Need Follow-Up', action: 'failed-inspections', subtitle: parts.join(', ') });
    }

    const weatherImpacted = this.weatherImpactProjects();
    if (weatherImpacted.length > 0) {
      const majorCount = weatherImpacted.filter(pw => pw.majorDays > 0).length;
      pool.push({ priority: 60, value: '' + weatherImpacted.length, label: 'Weather-Impacted Projects', icon: 'cloud', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Weather-Impacted Projects', action: 'weather-impact', subtitle: majorCount > 0 ? `${majorCount} with major delays` : 'minor delays expected' });
    }

    const conflicts = this.allStaffingConflicts();
    if (conflicts.length > 2) {
      const critical = conflicts.filter(c => c.severity === 'critical').length;
      pool.push({ priority: 50, value: '' + conflicts.length, label: 'Staffing Conflicts', icon: 'people_group', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Staffing Conflicts', action: 'staffing-conflicts', subtitle: critical > 0 ? `${critical} critical` : 'monitor closely' });
    }

    const openPunch = this.openPunchItems();
    if (openPunch.length > 0) {
      const highPri = openPunch.filter(p => p.priority === 'high').length;
      pool.push({ priority: 40, value: '' + openPunch.length, label: 'Open Punch Items', icon: 'check_circle', iconBg: 'bg-primary-20', iconColor: 'text-primary', ariaPrefix: 'Open Punch Items', action: 'punch-items', subtitle: highPri > 0 ? `${highPri} high priority` : 'on track' });
    }

    pool.push({ priority: 20, value: this.totalEstimateValue(), label: 'Estimate Pipeline', icon: 'bar_graph', iconBg: 'bg-success-20', iconColor: 'text-success', ariaPrefix: 'Estimate Pipeline', action: 'financials', subtitle: `${this.openEstimatesCount()} open estimates` });

    const approvedAmt = this.approvedCosThisMonth();
    if (approvedAmt > 0) {
      pool.push({ priority: 15, value: formatCurrency(approvedAmt), label: 'COs Approved This Month', icon: 'check_circle', iconBg: 'bg-success-20', iconColor: 'text-success', ariaPrefix: 'Change Orders Approved This Month', action: 'financials', subtitle: 'revenue captured' });
    }

    pool.push({ priority: 10, value: '' + this.totalProjects(), label: 'Active Projects', icon: 'briefcase', iconBg: 'bg-primary-20', iconColor: 'text-primary', ariaPrefix: 'Active Projects', action: 'projects', subtitle: `${atRisk.length > 0 ? atRisk.length + ' need attention' : 'all on track'}` });

    pool.sort((a, b) => b.priority - a.priority);
    return pool.slice(0, 3);
  });

  readonly recentDrawings = computed(() => {
    const results: { projectId: number; projectName: string; drawing: DrawingTile }[] = [];
    for (const project of this.store.projects()) {
      const drawings = ALL_DRAWINGS_BY_PROJECT[project.id];
      if (drawings?.length) {
        results.push({ projectId: project.id, projectName: project.name, drawing: drawings[0] });
      }
    }
    return results;
  });

  // --- AP Clerk (Kelly) computed signals ---
  readonly apInvoices = this.store.apInvoices;
  readonly apVendors = this.store.apVendors;
  readonly apPayApps = this.store.apPayApplications;
  readonly payAppsView = signal<PayAppsView>('tile');
  readonly apLienWaivers = this.store.apLienWaivers;
  readonly apRetention = this.store.apRetention;
  readonly apActivities = this.store.apActivities;
  readonly apPaymentSchedule = this.store.apPaymentSchedule;
  readonly learningPlan = this.store.learningPlan;

  readonly pendingApInvoices = computed(() => this.apInvoices().filter(i => i.status === 'pending'));
  readonly totalOutstandingAp = computed(() => this.apInvoices().filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0));
  readonly paymentsDueThisWeek = computed(() => this.apPaymentSchedule().slice(0, 4).reduce((s, p) => s + p.amount, 0));
  readonly discountsAvailable = computed(() => this.apPaymentSchedule().reduce((s, p) => s + p.discountAvailable, 0));

  readonly apKpiCards = computed<ApKpiCard[]>(() => [
    { value: '' + this.pendingApInvoices().length, label: 'Invoices to Process', icon: 'invoice', iconBg: 'bg-warning-20', iconColor: 'text-warning', action: 'ap-invoices', ariaPrefix: 'Invoices to process' },
    { value: formatCurrency(this.totalOutstandingAp()), label: 'Total Outstanding AP', icon: 'payment_instant', iconBg: 'bg-primary-20', iconColor: 'text-primary', action: 'ap-outstanding', ariaPrefix: 'Total outstanding accounts payable' },
    { value: formatCurrency(this.paymentsDueThisWeek()), label: 'Payments Due This Week', icon: 'calendar', iconBg: 'bg-destructive-20', iconColor: 'text-destructive', action: 'ap-payments-due', ariaPrefix: 'Payments due this week' },
    { value: formatCurrency(this.discountsAvailable()), label: 'Discounts Available', icon: 'offers', iconBg: 'bg-success-20', iconColor: 'text-success', action: 'ap-discounts', ariaPrefix: 'Discounts available' },
  ]);

  private readonly overdueEstimatesCount = computed(() =>
    this.estimates().filter(e => e.daysLeft < 0 && e.status !== 'Approved').length,
  );
  private readonly awaitingApprovalCount = computed(() =>
    this.estimates().filter(e => e.status === 'Awaiting Approval').length,
  );
  private readonly underReviewCount = computed(() =>
    this.estimates().filter(e => e.status === 'Under Review').length,
  );

  readonly estimatorKpiCards = computed<KpiCard[]>(() => [
    { value: this.totalEstimateValue(), label: 'Pipeline Value', icon: 'bar_graph', iconBg: 'bg-primary-20', iconColor: 'text-primary', ariaPrefix: 'Pipeline Value', action: 'est-pipeline', subtitle: `${this.openEstimatesCount()} open estimates` },
    { value: '' + this.awaitingApprovalCount(), label: 'Awaiting Approval', icon: 'timer', iconBg: 'bg-warning-20', iconColor: 'text-warning', ariaPrefix: 'Awaiting Approval', action: 'est-awaiting' },
    { value: '' + this.overdueEstimatesCount(), label: 'Overdue Estimates', icon: 'warning', iconBg: 'bg-destructive-20', iconColor: 'text-destructive', ariaPrefix: 'Overdue Estimates', action: 'est-overdue' },
    { value: '' + this.underReviewCount(), label: 'Under Review', icon: 'description', iconBg: 'bg-success-20', iconColor: 'text-success', ariaPrefix: 'Under Review', action: 'est-review' },
  ]);

  handleEstimatorKpiClick(action: string): void {
    this.navigateToFinancials();
  }

  private readonly isKelly = computed(() => this.personaService.activePersonaSlug() === 'kelly');
  private readonly isPamela = computed(() => this.personaService.activePersonaSlug() === 'pamela');

  readonly homeWidgets = computed<DashboardWidgetId[]>(() => {
    if (this.isKelly()) {
      return ['homeHeader', 'homeApKpis', 'homeInvoiceQueue', 'homePaymentSchedule', 'homeCalendar', 'homeVendorAging', 'homeRetention', 'homeApActivity', 'homeLearning'];
    }
    if (this.isPamela()) {
      return ['homeHeader', 'homeEstimatorKpis', 'homeOpenEstimates', 'homeCalendar', 'homeRfis', 'homeChangeOrders', 'homeBudgetVariance', 'homeRecentActivity'];
    }
    return ['homeHeader', 'homeKpis', 'homeUrgentNeeds', 'homeWeather', 'homeTimeOff', 'homeCalendar', 'homeRfis', 'homeSubmittals', 'homeDrawings', 'homeRecentActivity', 'homeMilestones', 'homeBudgetVariance', 'homeChangeOrders', 'homeFieldOps', 'homeDailyReports', 'homeTeamAllocation', 'homeContracts', 'homeOpenEstimates'];
  });

  // ── Area-adaptive visible blocks ───────────────────────────────
  // For each widget, decide which optional blocks fit in the available height.
  // Current rule: hide the "insight" strip when the widget is too short to host
  // both a meaningful content area and the insight line underneath.
  readonly homeVisibleBlocks = computed<Record<string, Set<string>>>(() => {
    const heights = this.widgetHeights();
    const result: Record<string, Set<string>> = {};

    for (const widgetId of this.homeWidgets()) {
      const h = heights[widgetId] ?? 384;
      const blocks = new Set<string>();
      const avail = h - HOME_HEADER_PX;
      if (HOME_MIN_CONTENT_PX + HOME_INSIGHT_PX <= avail) {
        blocks.add('insight');
      }
      result[widgetId] = blocks;
    }
    return result;
  });

  showHomeBlock(widgetId: string, block: string): boolean {
    return this.homeVisibleBlocks()[widgetId]?.has(block) ?? false;
  }

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  readonly allCreateItems: NavItem[] = [...RECORDS_SUB_NAV_ITEMS, ...FINANCIALS_SUB_NAV_ITEMS];
  readonly frequentlyUsedItems: NavItem[] = [
    { value: 'daily-reports', label: 'Daily Report', icon: 'calendar' },
    { value: 'rfis', label: 'RFI', icon: 'help' },
    { value: 'general-invoices', label: 'Invoice', icon: 'invoice' },
  ];
  private readonly createDropdownDesktop = viewChild<CreateMenuDropdownComponent>('createDropdownDesktop');
  private readonly createDropdownCanvas = viewChild<CreateMenuDropdownComponent>('createDropdownCanvas');

  private readonly _registerHomeWidgets = effect(() => {
    const widgets = this.isKelly() ? KELLY_HOME_WIDGETS
      : this.isPamela() ? PAMELA_HOME_WIDGETS
      : HOME_WIDGETS;
    untracked(() => this.widgetFocusService.registerWidgets(widgets));
  });

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly homeGridContainerRef = viewChild<ElementRef>('homeWidgetGrid');
  private readonly drawingDetailRef = viewChild<ElementRef>('drawingDetailEl');
  private readonly calendarScrollRef = viewChild<ElementRef>('calendarScrollArea');
  private _calendarScrolled = false;
  private readonly _scrollCalendarToNow = effect(() => {
    const el = this.calendarScrollRef()?.nativeElement as HTMLElement | undefined;
    if (!el || this._calendarScrolled) return;
    this._calendarScrolled = true;
    requestAnimationFrame(() => {
      const now = new Date();
      const nowPx = (now.getHours() * 60 + now.getMinutes());
      const viewHeight = el.clientHeight;
      el.scrollTop = Math.max(0, nowPx - viewHeight / 2);
    });
  });

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

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.canvasHeaderStatusOpen() && !target.closest('[role="listbox"]') && !target.closest('[role="option"]')) {
      this.canvasHeaderStatusOpen.set(null);
    }
    if (this.timeOffStatusOpen() !== null && !target.closest('[data-timeoff-dropdown]')) {
      this.timeOffStatusOpen.set(null);
    }
    if (!target.closest('[data-create-dropdown]')) {
      this.closeCreateMenus();
    }
  }

  onEscapeKey(): void {
    this.closeCreateMenus();
  }

  private closeCreateMenus(): void {
    this.createDropdownDesktop()?.close();
    this.createDropdownCanvas()?.close();
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
    heights['homeHeader'] = 0;
    heights['homeKpis'] = 48 + 12 + this.kpiCards().length * 44 + (this.kpiCards().length - 1) * 8 + 12;
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

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.homeGridContainerRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
  }

  readonly timeOffView = signal<'list' | 'calendar' | 'staffing'>('list');
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
    for (const req of this.timeOffRequests()) {
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

  readonly allUrgentNeeds = computed(() => {
    const raw = buildUrgentNeeds(this.store.rfis(), this.store.submittals(), this.store.changeOrders());
    const projects = this.store.projects();
    const changeOrders = this.store.changeOrders();
    const projectMap = new Map(projects.map(p => [p.id, p]));
    return raw.map(n => {
      const proj = projectMap.get(n.projectId);
      if (!proj) return n;
      return rewriteDynamicNeeds([n], proj, changeOrders)[0];
    });
  });
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
    { key: 'budget', label: 'Budget', icon: 'building_corporate' },
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
    const items = this.allUrgentNeeds();
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

  readonly urgentCriticalCount = computed(() => this.allUrgentNeeds().filter(i => i.severity === 'critical').length);

  readonly urgentProjectOptions = computed(() => {
    const projectIds = new Set(this.allUrgentNeeds().map(i => i.projectId));
    return this.store.projects()
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
    return this.allUrgentNeeds().filter(item => {
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
      this.router.navigate([`${this.personaPrefix()}${item.financialsRoute}`]);
    } else {
      this.router.navigate([`${this.personaPrefix()}${item.route}`], { queryParams: item.queryParams });
    }
  }

  private readonly _urgentDropdownAbort = new AbortController();
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
      }, { capture: true, signal: this._urgentDropdownAbort.signal });
    }
  })();
  private readonly _cleanupUrgentDropdown = this.destroyRef.onDestroy(() => this._urgentDropdownAbort.abort());

  readonly allProjectWeather = computed(() => {
    return this.store.projects().map(p => {
      const w = this.store.getProjectWeather(p.id);
      if (!w) return null;
      const impactDays = w.forecast.filter(f => f.workImpact !== 'none');
      const majorDays = w.forecast.filter(f => f.workImpact === 'major');
      const minorDays = w.forecast.filter(f => f.workImpact === 'minor');
      return { project: p, weather: w, impactDays: impactDays.length, majorDays: majorDays.length, minorDays: minorDays.length };
    }).filter(Boolean) as { project: Project; weather: ProjectWeather; impactDays: number; majorDays: number; minorDays: number }[];
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
    return weatherIcon(condition);
  }

  weatherConditionColor(condition: WeatherCondition): string {
    return weatherIconColor(condition);
  }

  navigateToProject(slugOrId: string | number): void {
    const pp = this.personaPrefix();
    if (typeof slugOrId === 'number') {
      const proj = this.store.findProjectById(slugOrId);
      if (proj) this.router.navigate([`${pp}/project`, proj.slug]);
    } else {
      this.router.navigate([`${pp}/project`, slugOrId]);
    }
  }

  private navigateToProjectPage(projectId: number, queryParams: Record<string, string>): void {
    const proj = this.store.findProjectById(projectId);
    if (proj) {
      this.router.navigate([`${this.personaPrefix()}/project`, proj.slug], { queryParams });
    }
  }

  handleBudgetRowClick(slug: string): void {
    this.router.navigate([`${this.personaPrefix()}/project`, slug], {
      queryParams: { page: 'financials', subpage: 'budget' },
    });
  }

  handleChangeOrderClick(event: { projectId: number; orderId: string }): void {
    this.navigateToProjectPage(event.projectId, {
      page: 'financials', subpage: 'potential-change-orders', view: 'changeOrder', id: event.orderId, from: 'home',
    });
  }

  handleInspectionClick(event: { projectId: number; inspectionId: string }): void {
    this.navigateToProjectPage(event.projectId, {
      page: 'records', subpage: 'inspections', view: 'inspection', id: event.inspectionId, from: 'home',
    });
  }

  handleDailyReportClick(event: { projectId: number; reportId: string }): void {
    this.navigateToProjectPage(event.projectId, {
      page: 'records', subpage: 'daily-reports', view: 'dailyReport', id: event.reportId, from: 'home',
    });
  }

  handleTeamProjectClick(projectId: number): void {
    this.navigateToProject(projectId);
  }

  navigateToEstimate(id: string): void {
    this.router.navigate([`${this.personaPrefix()}/financials/estimates`, id]);
  }

  handleContractClick(event: { projectId: number; contractId: string }): void {
    this.navigateToProjectPage(event.projectId, {
      page: 'financials', subpage: 'contracts',
    });
  }

  handleMilestoneClick(projectSlug: string): void {
    if (projectSlug) this.navigateToProject(projectSlug);
  }

  handleActivityClick(projectId: number): void {
    this.navigateToProject(projectId);
  }

  handleCalendarApptClick(projectSlug: string): void {
    if (projectSlug) this.navigateToProject(projectSlug);
  }

  readonly pendingTimeOffCount = computed(() =>
    this.timeOffRequests().filter((r) => r.status === 'Pending').length
  );

  readonly allStaffingConflicts = computed(() => buildStaffingConflicts(undefined, this.timeOffRequests()));
  readonly criticalStaffingConflicts = computed<StaffingConflict[]>(() =>
    this.allStaffingConflicts().filter(c => c.severity === 'critical' || c.severity === 'warning')
  );

  private buildHomeAgentState(): AgentDataState {
    return {
      projects: this.store.projects(),
      estimates: this.store.estimates(),
      rfis: this.store.rfis(),
      submittals: this.store.submittals(),
      changeOrders: this.store.changeOrders(),
      activities: this.store.activities(),
      calendar: this.store.calendarAppointments(),
      timeOffRequests: this.store.timeOffRequests(),
      allWeatherData: this.store.weatherData(),
      allJobCosts: this.store.projectJobCosts(),
      invoices: this.store.invoices(),
      payables: this.store.payables(),
      contracts: this.store.contracts(),
      purchaseOrders: this.store.purchaseOrders(),
      billingSchedules: this.store.billingSchedules(),
      billingEvents: this.store.billingEvents(),
      payrollRecords: this.store.payrollRecords(),
      projectRevenue: this.store.projectRevenue(),
      cashFlowHistory: this.store.cashFlowHistory(),
      cashPosition: this.store.cashPosition(),
      apInvoices: this.store.apInvoices(),
      apVendors: this.store.apVendors(),
      apPayApplications: this.store.apPayApplications(),
      apLienWaivers: this.store.apLienWaivers(),
      apRetention: this.store.apRetention(),
      apActivities: this.store.apActivities(),
      apPaymentSchedule: this.store.apPaymentSchedule(),
      learningPlan: this.store.learningPlan(),
      dailyReports: this.store.dailyReports(),
      inspections: this.store.inspections(),
      punchListItems: this.store.punchListItems(),
      milestones: this.crossProjectMilestones(),
      team: this.flatTeamMembers(),
      currentPage: 'home',
    };
  }

  getHomeWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'home');
    const state = this.buildHomeAgentState();
    return agent.insight?.(state) ?? null;
  }

  readonly urgentNeedsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeUrgentNeeds'));
  readonly weatherInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeWeather'));
  readonly timeOffInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeTimeOff'));
  readonly calendarInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeCalendar'));
  readonly rfisInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeRfis'));
  readonly submittalsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeSubmittals'));
  readonly drawingsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeDrawings'));
  readonly recentActivityInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeRecentActivity'));

  readonly apKpisInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeApKpis'));
  readonly invoiceQueueInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeInvoiceQueue'));
  readonly paymentScheduleInsight = computed<string | null>(() => this.getHomeWidgetInsight('homePaymentSchedule'));
  readonly vendorAgingInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeVendorAging'));
  readonly payAppsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homePayApps'));
  readonly lienWaiversInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeLienWaivers'));
  readonly retentionInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeRetention'));
  readonly apActivityInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeApActivity'));
  readonly cashOutflowInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeCashOutflow'));
  readonly learningInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeLearning'));

  readonly milestonesInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeMilestones'));
  readonly budgetVarianceInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeBudgetVariance'));
  readonly changeOrdersInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeChangeOrders'));
  readonly fieldOpsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeFieldOps'));
  readonly dailyReportsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeDailyReports'));
  readonly teamAllocationInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeTeamAllocation'));
  readonly contractsInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeContracts'));
  readonly openEstimatesInsight = computed<string | null>(() => this.getHomeWidgetInsight('homeOpenEstimates'));

  readonly staffingByProject = computed(() => {
    const conflicts = this.allStaffingConflicts();
    const active = this.timeOffRequests().filter(r => r.status !== 'Denied');
    const projectMap = new Map<number, { projectId: number; projectName: string; teamSize: number; requestCount: number; totalDaysOut: number; worstWeek: StaffingConflict | null; conflicts: StaffingConflict[] }>();
    for (const r of active) {
      if (!projectMap.has(r.projectId)) {
        const teamSizes: Record<number, number> = { 1: 6, 2: 5, 3: 8, 4: 7, 5: 4, 6: 4, 7: 5, 8: 5 };
        projectMap.set(r.projectId, { projectId: r.projectId, projectName: r.projectName, teamSize: teamSizes[r.projectId] ?? 5, requestCount: 0, totalDaysOut: 0, worstWeek: null, conflicts: [] });
      }
      const entry = projectMap.get(r.projectId)!;
      entry.requestCount++;
      entry.totalDaysOut += r.days;
    }
    for (const c of conflicts) {
      const entry = projectMap.get(c.projectId);
      if (entry) {
        entry.conflicts.push(c);
        if (!entry.worstWeek || c.absentPct > entry.worstWeek.absentPct) entry.worstWeek = c;
      }
    }
    return [...projectMap.values()].sort((a, b) => {
      const aSev = a.worstWeek?.severity === 'critical' ? 0 : a.worstWeek?.severity === 'warning' ? 1 : 2;
      const bSev = b.worstWeek?.severity === 'critical' ? 0 : b.worstWeek?.severity === 'warning' ? 1 : 2;
      return aSev - bSev || (b.worstWeek?.absentPct ?? 0) - (a.worstWeek?.absentPct ?? 0);
    });
  });

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
    all: this.timeOffRequests().length,
    Pending: this.timeOffRequests().filter((r) => r.status === 'Pending').length,
    Approved: this.timeOffRequests().filter((r) => r.status === 'Approved').length,
    Denied: this.timeOffRequests().filter((r) => r.status === 'Denied').length,
  }));

  readonly filteredTimeOff = computed(() => {
    const filter = this.timeOffActiveFilter();
    if (filter === 'all') return this.timeOffRequests();
    return this.timeOffRequests().filter((r) => r.status === filter);
  });

  readonly timeOffStatusOpen = signal<number | null>(null);
  readonly timeOffDropdownPos = signal<{ top: number; left: number }>({ top: 0, left: 0 });
  readonly timeOffStatusOptions: readonly TimeOffStatus[] = ['Pending', 'Approved', 'Denied'] as const;

  toggleTimeOffStatus(reqId: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.timeOffStatusOpen() === reqId) {
      this.timeOffStatusOpen.set(null);
      return;
    }
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.timeOffDropdownPos.set({ top: rect.bottom + 4, left: rect.right - 120 });
    this.timeOffStatusOpen.set(reqId);
  }

  onTimeOffStatusSelect(reqId: number, newStatus: TimeOffStatus, event: MouseEvent): void {
    event.stopPropagation();
    this.timeOffStatusOpen.set(null);
    this.store.updateTimeOffStatus(reqId, newStatus);
  }

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
    this.calendarAppointments()
      .filter((a: CalendarAppointment) => this.isSameCalDay(a.date, this.calendarDay1()))
      .sort((a: CalendarAppointment, b: CalendarAppointment) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
  );

  readonly calendarDay2Appts = computed(() =>
    this.calendarAppointments()
      .filter((a: CalendarAppointment) => this.isSameCalDay(a.date, this.calendarDay2()))
      .sort((a: CalendarAppointment, b: CalendarAppointment) => (a.startHour * 60 + a.startMin) - (b.startHour * 60 + b.startMin))
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

  onRfiFilterChange(filter: string): void {
    this.rfiActiveFilter.set(filter as RfiStatus | 'all');
  }

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
    all: this.rfis().length,
    open: this.rfis().filter((r) => r.status === 'open').length,
    overdue: this.rfis().filter((r) => r.status === 'overdue').length,
    upcoming: this.rfis().filter((r) => r.status === 'upcoming').length,
    closed: this.rfis().filter((r) => r.status === 'closed').length,
  }));

  readonly filteredRfis = computed(() => {
    const filter = this.rfiActiveFilter();
    if (filter === 'all') return this.rfis();
    return this.rfis().filter((r) => r.status === filter);
  });

  rfiStatusColor(status: RfiStatus): string {
    return getStatusDot(status);
  }

  rfiStatusLabel(status: RfiStatus): string {
    return getCapitalizedStatus(status);
  }

  private findProjectSlug(projectName: string): string | null {
    const project = this.store.projects().find(p => p.name === projectName);
    return project ? project.slug : null;
  }

  openRfiDetail(rfi: Rfi): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeRfis', { type: 'rfi', item: rfi });
      return;
    }
    const slug = this.findProjectSlug(rfi.project);
    if (slug) {
      this.router.navigate([`${this.personaPrefix()}/project`, slug], { queryParams: { view: 'rfi', id: rfi.id, from: 'home' } });
    }
  }

  openSubmittalDetail(sub: Submittal): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeSubmittals', { type: 'submittal', item: sub });
      return;
    }
    const slug = this.findProjectSlug(sub.project);
    if (slug) {
      this.router.navigate([`${this.personaPrefix()}/project`, slug], { queryParams: { view: 'submittal', id: sub.id, from: 'home' } });
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

  onSubmittalFilterChange(filter: string): void {
    this.submittalActiveFilter.set(filter as SubmittalStatus | 'all');
  }

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
    all: this.submittals().length,
    open: this.submittals().filter((s) => s.status === 'open').length,
    overdue: this.submittals().filter((s) => s.status === 'overdue').length,
    upcoming: this.submittals().filter((s) => s.status === 'upcoming').length,
    closed: this.submittals().filter((s) => s.status === 'closed').length,
  }));

  readonly filteredSubmittals = computed(() => {
    const filter = this.submittalActiveFilter();
    if (filter === 'all') return this.submittals();
    return this.submittals().filter((s) => s.status === filter);
  });

  submittalStatusColor(status: SubmittalStatus): string {
    return getStatusDot(status);
  }

  submittalStatusLabel(status: SubmittalStatus): string {
    return getCapitalizedStatus(status);
  }

  navigateToProjects(): void {
    this.router.navigate([`${this.personaPrefix()}/projects`]);
  }

  navigateToFinancials(): void {
    this.router.navigate([`${this.personaPrefix()}/financials`]);
  }

  navigateToApSubpage(): void {
    this.router.navigate([`${this.personaPrefix()}/financials`], { queryParams: { subpage: 'accounts-payable' } });
  }

  private navigateToApSubpageWithFocus(focus: string): void {
    this.router.navigate([`${this.personaPrefix()}/financials`], {
      queryParams: { subpage: 'accounts-payable', focus },
    });
  }

  handleApKpiClick(action: string): void {
    switch (action) {
      case 'ap-invoices':
        this.navigateToApSubpageWithFocus('invoice-queue');
        break;
      case 'ap-outstanding':
        this.navigateToApSubpageWithFocus('payables');
        break;
      case 'ap-payments-due':
        this.navigateToApSubpageWithFocus('payment-schedule');
        break;
      case 'ap-discounts':
        this.navigateToApSubpageWithFocus('discounts');
        break;
      default:
        this.navigateToApSubpage();
    }
  }

  handleKpiCardClick(action: string): void {
    switch (action) {
      case 'projects':
        this.navigateToProjects();
        break;
      case 'financials':
      case 'pending-cos':
        this.navigateToFinancials();
        break;
      case 'overdue-items': {
        const hasOverdueRfis = this.overdueRfis().length > 0;
        if (hasOverdueRfis) {
          this.rfiActiveFilter.set('overdue');
          this.scrollToWidget('homeRfis');
        } else {
          this.submittalActiveFilter.set('overdue');
          this.scrollToWidget('homeSubmittals');
        }
        break;
      }
      case 'at-risk-projects': {
        const first = this.atRiskProjects()[0];
        if (first) this.router.navigate([`${this.personaPrefix()}/project`, first.slug]);
        else this.navigateToProjects();
        break;
      }
      case 'failed-inspections':
      case 'punch-items':
        this.navigateToProjects();
        break;
      case 'weather-impact':
        this.scrollToWidget('homeWeather');
        break;
      case 'staffing-conflicts':
        this.scrollToWidget('homeTimeOff');
        break;
      default:
        this.navigateToProjects();
    }
  }

  private scrollToWidget(widgetId: string): void {
    const el = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  openDrawingDetail(projectId: number, drawing: DrawingTile): void {
    if (this.isCanvasMode()) {
      this.openCanvasDetail('homeDrawings', { type: 'drawing', item: drawing });
      return;
    }
    const project = this.store.findProjectById(projectId);
    if (project) {
      this.router.navigate([`${this.personaPrefix()}/project`, project.slug], {
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
    this._detailMgr.closeDetail(widgetId, this.engine, this.homeWidgets());
  }

  onCanvasDetailStatusChange(widgetId: string, newStatus: string): void {
    this._detailMgr.updateField(widgetId, 'status', newStatus);
    const dv = this._detailMgr.canvasDetailViews()[widgetId];
    if (dv?.type === 'rfi') this.store.updateRfiStatus(dv.item.id, newStatus as RfiStatus);
    if (dv?.type === 'submittal') this.store.updateSubmittalStatus(dv.item.id, newStatus as SubmittalStatus);
    if (dv?.type === 'changeOrder') this.store.updateChangeOrderStatus((dv.item as ChangeOrder).id, newStatus as ChangeOrderStatus);
  }

  onCanvasDetailAssigneeChange(widgetId: string, newAssignee: string): void {
    this._detailMgr.updateField(widgetId, 'assignee', newAssignee);
  }

  onCanvasDetailDueDateChange(widgetId: string, newDate: string): void {
    this._detailMgr.updateField(widgetId, 'dueDate', newDate);
  }

  openCanvasDetailInNewTab(widgetId: string): void {
    const detail = this._detailMgr.canvasDetailViews()[widgetId];
    if (!detail) return;

    if (detail.type === 'rfi' || detail.type === 'submittal') {
      const projectName = (detail.item as { project?: string }).project;
      const slug = projectName ? this.findProjectSlug(projectName) : null;
      if (slug) {
        const url = `${this.personaPrefix()}/project/${slug}?view=${detail.type}&id=${detail.item.id}&from=home`;
        window.open(url, '_blank', 'noopener');
      }
    } else if (detail.type === 'drawing') {
      const drawing = detail.item as DrawingTile;
      const project = this.store.projects().find(p => {
        const drawings = ALL_DRAWINGS_BY_PROJECT[p.id];
        return drawings?.some(d => d.id === drawing.id);
      });
      if (project) {
        const url = `${this.personaPrefix()}/project/${project.slug}?page=drawings&view=drawing&id=${drawing.id}`;
        window.open(url, '_blank', 'noopener');
      }
    }
  }

  selectCreateItem(_item: NavItem): void {
    // placeholder -- future: navigate to create form for item.value
  }
}
