import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
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
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { AiAssistantPanelComponent } from '../../shell/components/ai-assistant-panel.component';
import { EmptyStateComponent } from './components/empty-state.component';
import { CollapsibleSubnavComponent } from './components/collapsible-subnav.component';
import { ItemDetailViewComponent } from '../../shared/detail/item-detail-view.component';
import { RecordsSubpagesComponent } from './components/records-subpages.component';
import { FinancialsSubpagesComponent } from './components/financials-subpages.component';
import { RecordDetailViewsComponent } from './components/record-detail-views.component';
import {
  STATUS_OPTIONS,
  PUNCH_STATUS_OPTIONS,
  ASSIGNEE_OPTIONS,
  itemStatusDot as getStatusDot,
  capitalizeStatus as getCapitalizedStatus,
} from '../../data/dashboard-item-status';
import { DrawingMarkupToolbarComponent, DRAWING_TOOLS } from '../../shared/detail/drawing-markup-toolbar.component';
import { WidgetFrameComponent } from './components/widget-frame.component';
import { PdfViewerComponent } from '../../shared/detail/pdf-viewer.component';
import { AiIconComponent } from '../../shell/components/ai-icon.component';

import { ThemeService } from '../../shell/services/theme.service';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { CanvasDetailManager, type DetailView } from '../../shell/services/canvas-detail-manager';
import { SubpageTileCanvas, type TileRect, type TileDetailView } from '../../shell/services/subpage-tile-canvas';
import { AiService } from '../../services/ai.service';
import { AiPanelController } from '../../shell/services/ai-panel-controller';
import { CanvasPanning } from '../../shell/services/canvas-panning';
import {
  type ProjectDashboardData,
  type ProjectStatus,
  type MilestoneStatus,
  type TaskPriority,
  type RiskSeverity,
} from '../../data/project-data';
import { PROJECTS, RFIS, SUBMITTALS, type Rfi, type Submittal, getProjectJobCosts, getJobCostSummary, getSubledger, JOB_COST_CATEGORIES, CATEGORY_COLORS, budgetProgressClass, type JobCostCategory, type ProjectJobCost, type SubledgerTransaction, CHANGE_ORDERS, DAILY_REPORTS, WEATHER_FORECAST, PROJECT_ATTENTION_ITEMS, BUDGET_HISTORY_BY_PROJECT, INSPECTIONS, PUNCH_LIST_ITEMS, PROJECT_REVENUE, type DailyReport, type Inspection, type PunchListItem, type ChangeOrder, type ProjectRevenue, type BudgetHistoryPoint, type WeatherForecast, type ProjectAttentionItem, type InspectionResult, type ChangeOrderStatus } from '../../data/dashboard-data';
import { ALL_DRAWINGS_BY_PROJECT, type DrawingTile } from '../../data/drawings-data';
import { getAgent, type AgentDataState } from '../../data/widget-agents';
import { SIDE_NAV_ITEMS, RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS, SUBNAV_CONFIGS } from './project-dashboard.config';

type ProjectWidgetId = 'projHeader' | 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity' | 'rfis' | 'submittals';

const RECORDS_PAGE_DESCRIPTIONS: Record<string, string> = {
  'daily-reports': 'View and manage daily field reports including weather, workforce, equipment, and work performed.',
  'rfis': 'Track Requests for Information between project stakeholders.',
  'issues': 'Document and resolve project issues and non-conformances.',
  'field-work-directives': 'Manage field directives for changes to scope or work procedures.',
  'submittals': 'Review and approve submittals for materials, shop drawings, and product data.',
  'action-items': 'Track assigned action items and their completion status.',
  'check-list': 'Use standardized checklists for quality control and inspections.',
  'drawing-sets': 'Manage and distribute official drawing sets and revisions.',
  'meeting-minutes': 'Record and distribute meeting minutes from project meetings.',
  'notices-to-comply': 'Issue and track compliance notices for regulatory or contractual requirements.',
  'punch-items': 'Document and track punch list items for project closeout.',
  'inspections': 'Track inspections, results, and follow-up actions for quality assurance.',
  'safety-notices': 'Distribute safety notices and track acknowledgments.',
  'specification-sets': 'Manage project specification documents and revisions.',
  'submittal-packages': 'Organize submittals into packages for batch review and approval.',
  'transmittals': 'Track formal document transmittals between project parties.',
};

const FINANCIALS_PAGE_DESCRIPTIONS: Record<string, string> = {
  'budget': 'View and manage the project budget, cost codes, and allocated funds.',
  'purchase-orders': 'Create and track purchase orders for materials and services.',
  'contracts': 'Manage prime contracts, subcontracts, and contract documents.',
  'potential-change-orders': 'Track potential change orders before formal approval.',
  'subcontract-change-orders': 'Manage change orders issued to subcontractors.',
  'applications-for-payment': 'Submit and review payment applications and progress billing.',
  'change-order-requests': 'Process and approve change order requests from stakeholders.',
  'contract-invoices': 'Track invoices against contract line items and retainage.',
  'cost-forecasts': 'Project future costs and compare against budget allocations.',
  'general-invoices': 'Manage non-contract invoices and miscellaneous project expenses.',
  'prime-contract-change-orders': 'Track change orders on the prime contract with the owner.',
};

@Component({
  selector: 'app-project-dashboard',
  imports: [NgTemplateOutlet, TitleCasePipe, ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, WidgetLockToggleComponent, AiIconComponent, AiAssistantPanelComponent, EmptyStateComponent, CollapsibleSubnavComponent, ItemDetailViewComponent, DrawingMarkupToolbarComponent, WidgetFrameComponent, PdfViewerComponent, WidgetResizeHandleComponent, RecordsSubpagesComponent, FinancialsSubpagesComponent, RecordDetailViewsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'panning.isPanReady() && !panning.panBlocked()',
    '[class.canvas-panning]': 'panning.isPanning() && !panning.panBlocked()',
    '[class.canvas-locked]': 'panning.panBlocked()',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:touchcancel)': 'onDocumentTouchEnd()',
    '(window:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)',
    '(window:keydown)': 'panning.onKeyDown($event)',
    '(window:keyup)': 'panning.onKeyUp($event)',
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
    <ng-template #childPageSubnav let-config>
      <div class="bg-card border-default rounded-lg mb-6">
        <div class="flex items-center justify-between px-4 py-2 gap-4">
          <div class="flex items-center gap-2 flex-1 max-w-xs">
            <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5 flex-1">
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">search</i>
              <input type="text" class="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-40 w-full"
                [placeholder]="config.searchPlaceholder" [value]="subnavSearch()" (input)="subnavSearch.set($any($event.target).value)" />
            </div>
            <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-secondary transition-colors duration-150"
              role="button" tabindex="0" aria-label="Filter">
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">filter</i>
            </div>
          </div>
          <div class="flex items-center gap-1">
            @if (activeNavItem() === 'drawings' && subnavViewMode() === 'grid' && !isCanvas() && !detailView()) {
              <div class="flex items-center gap-2 mr-2">
                <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">zoom_out</i>
                <input type="range" min="0.5" max="2" step="0.1"
                  class="tile-zoom-slider"
                  [value]="drawingTileZoom()"
                  (input)="drawingTileZoom.set(+$any($event.target).value)"
                  aria-label="Tile size"
                />
                <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">zoom_in</i>
              </div>
              <div class="w-px h-5 bg-foreground-20 mr-1"></div>
            }
            @for (btn of config.actions; track btn.icon) {
              <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
                role="button" tabindex="0" [attr.aria-label]="btn.label">
                <i class="modus-icons text-base" aria-hidden="true">{{ btn.icon }}</i>
              </div>
            }
            @if (config.viewToggles.length > 0) {
              <div class="flex items-center bg-secondary rounded ml-1">
                @for (toggle of config.viewToggles; track toggle.value) {
                  <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150"
                    [class]="toggle.value === 'zoom-in' || toggle.value === 'zoom-out' ? 'text-foreground-60 hover:text-foreground hover:bg-muted active:bg-primary active:text-primary-foreground' : (subnavViewMode() === toggle.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground')"
                    role="button" tabindex="0" [attr.aria-label]="toggle.label"
                    (click)="handleSubnavToggle(toggle.value)">
                    <i class="modus-icons text-base" aria-hidden="true">{{ toggle.icon }}</i>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #detailContent>
      <div [class]="isCanvasDrawingDetail() ? 'canvas-detail-constrained' : ''">
        @if ((!detailHasSubNav() || isMobile()) && !detailDrawing()) {
          <div class="flex items-center gap-2 mb-6 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150"
            role="button" tabindex="0"
            (click)="clearDetailView()"
            (keydown.enter)="clearDetailView()"
          >
            <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
            <div class="text-sm font-medium">{{ detailBackLabel() }}</div>
          </div>
        }
        <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs[detailSubnavKey()] }" />
        @if (detailRfi(); as rfi) {
          <app-item-detail-view
            icon="clipboard"
            typeLabel="Request for Information"
            [number]="rfi.number"
            [subject]="rfi.subject"
            [question]="rfi.question"
            [assignee]="rfi.assignee"
            [assigneeOptions]="ASSIGNEE_OPTIONS"
            (assigneeChange)="onDetailAssigneeChange($event)"
            field1Label="Created By"
            [field1Value]="rfi.askedBy"
            field3Label="Created On"
            [field3Value]="rfi.askedOn"
            field4Label="Due Date"
            [field4Value]="rfi.dueDate"
            [field4ShowStatus]="false"
            [currentStatus]="rfi.status"
            [statusOptions]="STATUS_OPTIONS"
            [statusDotClass]="itemStatusDot(rfi.status)"
            [statusText]="capitalizeStatus(rfi.status)"
            (statusChange)="onDetailStatusChange($event)"
            (dueDateChange)="onDetailDueDateChange($event)"
          />
        }
        @if (detailSubmittal(); as sub) {
          <app-item-detail-view
            icon="document"
            typeLabel="Submittal"
            [number]="sub.number"
            [subject]="sub.subject"
            [assignee]="sub.assignee"
            [assigneeOptions]="ASSIGNEE_OPTIONS"
            (assigneeChange)="onDetailAssigneeChange($event)"
            [field1Value]="sub.project"
            [field3Value]="sub.dueDate"
            [field3DateEditable]="true"
            [currentStatus]="sub.status"
            [statusOptions]="STATUS_OPTIONS"
            [statusDotClass]="itemStatusDot(sub.status)"
            [statusText]="capitalizeStatus(sub.status)"
            (statusChange)="onDetailStatusChange($event)"
            (dueDateChange)="onDetailDueDateChange($event)"
          />
        }
        <app-record-detail-views
          [dailyReport]="detailDailyReport()"
          [inspection]="detailInspection()"
          [punchItem]="detailPunchItem()"
          [changeOrder]="detailChangeOrder()"
          (statusChange)="onDetailStatusChange($event)"
          (assigneeChange)="onDetailAssigneeChange($event)"
        />
      </div>
      @if (detailDrawing(); as drawing) {
        <div class="flex flex-col flex-1 min-h-0" data-detail-view>
          @if (drawing.file && drawing.file.endsWith('.pdf')) {
            <div class="bg-card border-default rounded-lg overflow-hidden flex-1 min-h-0 relative">
              <app-pdf-viewer #pdfViewer [src]="drawing.file" />
              <ng-container [ngTemplateOutlet]="drawingToolbar" />
            </div>
          } @else {
            <div class="bg-card border-default rounded-lg overflow-hidden relative flex-1 min-h-0">
              <div class="bg-secondary overflow-hidden h-full"
                #drawingViewer
                [class.cursor-grab]="drawingZoom() > 1 && !_drawingPanning"
                [class.cursor-grabbing]="_drawingPanning"
                (mousedown)="onDrawingMouseDown($event)"
                (mousemove)="onDrawingMouseMove($event)"
                (mouseup)="onDrawingMouseUp()"
                (mouseleave)="onDrawingMouseUp()"
              >
                <img [src]="drawing.thumbnail" [alt]="drawing.title"
                  class="w-full h-full object-contain pointer-events-none select-none"
                  [style.transform]="'scale(' + drawingZoom() + ') translate(' + drawingPanX() / drawingZoom() + 'px, ' + drawingPanY() / drawingZoom() + 'px)'"
                  [style.transform-origin]="'center center'"
                  draggable="false"
                  (load)="onDrawingImageLoad($event)"
                />
              </div>
              @if (drawingZoom() !== 1) {
                <div class="absolute bottom-3 right-3 flex items-center gap-2 bg-card border-default rounded-lg px-3 py-1.5 shadow-toolbar">
                  <div class="text-xs text-foreground-60 font-medium">{{ drawingNativePercent() }}%</div>
                  <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    role="button" tabindex="0" aria-label="Reset zoom" (click)="resetDrawingZoom()">
                    <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">refresh</i>
                  </div>
                </div>
              }
              <ng-container [ngTemplateOutlet]="drawingToolbar" />
            </div>
          }
        </div>
      }
    </ng-template>

    <ng-template #drawingToolbar>
      <app-drawing-markup-toolbar [activeTool]="activeDrawingTool()" (toolSelect)="activeDrawingTool.set($event)" />
    </ng-template>

    <ng-template #dashboardContent>
      @if (detailView()) {
        @if (detailHasSubNav() && !isMobile()) {
          <div class="flex min-h-[calc(100vh-12rem)] md:-ml-4">
            @if (activeNavItem() === 'records') {
              <app-collapsible-subnav
                icon="clipboard"
                title="Records"
                [items]="recordsSubNavItems"
                [activeItem]="activeRecordsPage()"
                [collapsed]="sideSubNavCollapsed()"
                [canvasMode]="isCanvas()"
                (itemSelect)="onDetailSideSubnavSelect($event)"
                (collapsedChange)="sideSubNavCollapsed.set($event)"
              />
            }
            @if (activeNavItem() === 'financials') {
              <app-collapsible-subnav
                icon="bar_graph"
                title="Financials"
                [items]="financialsSubNavItems"
                [activeItem]="activeFinancialsPage()"
                [collapsed]="sideSubNavCollapsed()"
                [canvasMode]="isCanvas()"
                (itemSelect)="onDetailSideSubnavSelect($event)"
                (collapsedChange)="sideSubNavCollapsed.set($event)"
              />
            }
            <div class="flex-1 flex flex-col gap-6 min-w-0 md:pl-4">
              <ng-container [ngTemplateOutlet]="detailContent" />
            </div>
          </div>
        } @else {
          <ng-container [ngTemplateOutlet]="detailContent" />
        }
      } @else {
      @switch (activeNavItem()) {
      @case ('drawings') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="tileCanvasMinHeight()">
            <!-- Locked: Section Subnav (toolbar) -->
            <div class="absolute"
              [style.top.px]="0"
              [style.left.px]="0"
              [style.width.px]="1280"
              [style.height.px]="56"
            >
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['drawings'] }" />
            </div>
            <!-- Locked: Title -->
            <div class="absolute flex items-center justify-between"
              [style.top.px]="72"
              [style.left.px]="0"
              [style.width.px]="1280"
              [style.height.px]="40"
            >
              <div class="text-2xl font-bold text-foreground">Drawings ({{ drawingTiles().length }})</div>
            </div>
            <!-- Locked: List widget (list view mode) -->
            @if (subnavViewMode() === 'list') {
              <div class="absolute bg-card border-default rounded-lg overflow-hidden flex flex-col"
                [style.top.px]="tilePos()['tc-list']?.top ?? 128"
                [style.left.px]="tilePos()['tc-list']?.left ?? 0"
                [style.width.px]="tilePos()['tc-list']?.width ?? 1280"
                [style.height.px]="tilePos()['tc-list']?.height ?? 500"
                [style.z-index]="1"
              >
                <div class="grid grid-cols-[auto_2fr_3fr_5rem_6rem_auto] gap-x-4 items-center px-4 py-2.5 border-bottom-default bg-muted flex-shrink-0">
                  <div class="w-4"></div>
                  <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wide">Name</div>
                  <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wide">Description</div>
                  <div class="text-xs font-medium text-foreground-60 uppercase tracking-wide">Revision</div>
                  <div class="text-xs font-medium text-foreground-60 uppercase tracking-wide">Date</div>
                  <div class="w-6"></div>
                </div>
                <div class="overflow-y-auto flex-1">
                  @for (drawing of drawingTiles(); track drawing.id) {
                    <div class="grid grid-cols-[auto_2fr_3fr_5rem_6rem_auto] gap-x-4 items-center px-4 py-3 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                      tabindex="0" (click)="navigateToDrawingDetail(drawing)" (keydown.enter)="navigateToDrawingDetail(drawing)">
                      <input type="checkbox" class="accent-primary w-4 h-4 flex-shrink-0 cursor-pointer" [attr.aria-label]="'Select ' + drawing.title" (click)="$event.stopPropagation()" />
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                          <img [src]="drawing.thumbnail" [alt]="drawing.title" class="w-full h-full object-cover" />
                        </div>
                        <div class="text-sm font-medium text-foreground truncate">{{ drawing.title }}</div>
                      </div>
                      <div class="text-xs text-foreground-60 truncate">{{ drawing.subtitle }}</div>
                      <div class="text-xs font-medium text-foreground whitespace-nowrap">{{ drawing.revision }}</div>
                      <div class="text-xs text-foreground-60 whitespace-nowrap">{{ drawing.date }}</div>
                      <div class="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-secondary transition-colors duration-150 flex-shrink-0"
                        role="button" tabindex="0" aria-label="More options" (click)="$event.stopPropagation()">
                        <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">more_vertical</i>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
            <!-- Drawing tiles as widgets (hidden in list mode) -->
            @if (subnavViewMode() !== 'list') {
              @for (drawing of drawingTiles(); track drawing.id) {
                <div class="absolute"
                  [attr.data-tile-id]="'tile-drawing-' + drawing.id"
                  [style.top.px]="tilePos()['tile-drawing-' + drawing.id]?.top ?? 0"
                  [style.left.px]="tilePos()['tile-drawing-' + drawing.id]?.left ?? 0"
                  [style.width.px]="tilePos()['tile-drawing-' + drawing.id]?.width ?? 308"
                  [style.height.px]="tilePos()['tile-drawing-' + drawing.id]?.height ?? 260"
                  [style.z-index]="tileZ()['tile-drawing-' + drawing.id] ?? 0"
                  [class.opacity-30]="tileMoveTargetId() === 'tile-drawing-' + drawing.id"
                  (mousedown)="selectTileWidget('tile-drawing-' + drawing.id)"
                >
                  <div class="h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
                    [class.border-default]="selectedWidgetId() !== 'tile-drawing-' + drawing.id"
                    [class.border-primary]="selectedWidgetId() === 'tile-drawing-' + drawing.id">
                    <div class="flex items-start justify-between px-3 pt-3 pb-2 cursor-move select-none flex-shrink-0"
                      (mousedown)="tileCanvas.onTileMouseDown('tile-drawing-' + drawing.id, $event)">
                      <div class="flex items-start gap-2 min-w-0 flex-1">
                        <input type="checkbox" class="mt-1 accent-primary w-4 h-4 flex-shrink-0 cursor-pointer" [attr.aria-label]="'Select ' + drawing.title" (click)="$event.stopPropagation()" (mousedown)="$event.stopPropagation()" />
                        <div class="min-w-0 flex-1">
                          <div class="text-sm font-semibold text-foreground truncate">{{ drawing.title }}</div>
                          <div class="text-xs text-foreground-60 truncate">{{ drawing.subtitle }}</div>
                        </div>
                      </div>
                      <div class="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-secondary transition-colors duration-150 flex-shrink-0"
                        role="button" tabindex="0" aria-label="More options" (mousedown)="$event.stopPropagation()">
                        <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">more_vertical</i>
                      </div>
                    </div>
                    <div class="px-3 flex-1 cursor-pointer" (mousedown)="$event.stopPropagation()" (click)="navigateToDrawingDetail(drawing)">
                      <div class="bg-secondary rounded overflow-hidden aspect-[16/9]">
                        <img [src]="drawing.thumbnail" [alt]="drawing.title" class="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div class="flex items-center justify-between px-3 py-3 flex-shrink-0">
                      <div class="text-xs font-medium text-foreground">{{ drawing.revision }}</div>
                      <div class="text-xs text-foreground-60">{{ drawing.date }}</div>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        } @else {
        <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['drawings'] }" />
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-foreground">Drawings ({{ drawingTiles().length }})</div>
          </div>
          @if (subnavViewMode() === 'grid') {
            <div class="grid gap-4" [style.grid-template-columns]="drawingTileGridStyle()">
              @for (drawing of drawingTiles(); track drawing.id) {
                <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  tabindex="0" (click)="navigateToDrawingDetail(drawing)" (keydown.enter)="navigateToDrawingDetail(drawing)">
                  <div class="flex items-start justify-between px-3 pt-3 pb-2">
                    <div class="flex items-start gap-2 min-w-0 flex-1">
                      <input type="checkbox" class="mt-1 accent-primary w-4 h-4 flex-shrink-0 cursor-pointer" [attr.aria-label]="'Select ' + drawing.title" (click)="$event.stopPropagation()" />
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold text-foreground truncate">{{ drawing.title }}</div>
                        <div class="text-xs text-foreground-60 truncate">{{ drawing.subtitle }}</div>
                      </div>
                    </div>
                    <div class="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-secondary transition-colors duration-150 flex-shrink-0"
                      role="button" tabindex="0" aria-label="More options" (click)="$event.stopPropagation()">
                      <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">more_vertical</i>
                    </div>
                  </div>
                  <div class="px-3 flex-1">
                    <div class="bg-secondary rounded overflow-hidden aspect-[4/3]">
                      <img [src]="drawing.thumbnail" [alt]="drawing.title" class="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div class="flex items-center justify-between px-3 py-3">
                    <div class="text-xs font-medium text-foreground">{{ drawing.revision }}</div>
                    <div class="text-xs text-foreground-60">{{ drawing.date }}</div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-card border-default rounded-lg overflow-hidden">
              <div class="grid grid-cols-[auto_2fr_3fr_5rem_6rem_auto] gap-x-4 items-center px-4 py-2.5 border-bottom-default bg-muted">
                <div class="w-4"></div>
                <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wide">Name</div>
                <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wide">Description</div>
                <div class="text-xs font-medium text-foreground-60 uppercase tracking-wide">Revision</div>
                <div class="text-xs font-medium text-foreground-60 uppercase tracking-wide">Date</div>
                <div class="w-6"></div>
              </div>
              @for (drawing of drawingTiles(); track drawing.id) {
                <div class="grid grid-cols-[auto_2fr_3fr_5rem_6rem_auto] gap-x-4 items-center px-4 py-3 border-bottom-default cursor-pointer hover:bg-muted transition-colors duration-150"
                  tabindex="0" (click)="navigateToDrawingDetail(drawing)" (keydown.enter)="navigateToDrawingDetail(drawing)">
                  <input type="checkbox" class="accent-primary w-4 h-4 flex-shrink-0 cursor-pointer" [attr.aria-label]="'Select ' + drawing.title" (click)="$event.stopPropagation()" />
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded bg-secondary overflow-hidden flex-shrink-0">
                      <img [src]="drawing.thumbnail" [alt]="drawing.title" class="w-full h-full object-cover" />
                    </div>
                    <div class="text-sm font-medium text-foreground truncate">{{ drawing.title }}</div>
                  </div>
                  <div class="text-xs text-foreground-60 truncate">{{ drawing.subtitle }}</div>
                  <div class="text-xs font-medium text-foreground whitespace-nowrap">{{ drawing.revision }}</div>
                  <div class="text-xs text-foreground-60 whitespace-nowrap">{{ drawing.date }}</div>
                  <div class="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-secondary transition-colors duration-150 flex-shrink-0"
                    role="button" tabindex="0" aria-label="More options" (click)="$event.stopPropagation()">
                    <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">more_vertical</i>
                  </div>
                </div>
              }
            </div>
          }
        </div>
        }
      }
      @case ('models') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="400">
            <div class="absolute" [style.top.px]="0" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="56">
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['models'] }" />
            </div>
            <div class="absolute flex items-center" [style.top.px]="72" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="40">
              <div class="text-2xl font-bold text-foreground">Models</div>
            </div>
            <div class="absolute" [style.top.px]="128" [style.left.px]="0">
              <app-empty-state icon="package" title="Project Models" description="View and manage 3D models, BIM files, and spatial data for this project." />
            </div>
          </div>
        } @else {
        <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['models'] }" />
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-foreground">Models</div>
          </div>
          <app-empty-state icon="package" title="Project Models" description="View and manage 3D models, BIM files, and spatial data for this project." />
        </div>
        }
      }
      @case ('records') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="tileCanvasMinHeight()" #tileGrid>
            <!-- Locked: Side Subnav -->
            <div class="absolute overflow-visible transition-all duration-200"
              [style.top.px]="tilePos()['tc-subnav']?.top ?? 0"
              [style.left.px]="tilePos()['tc-subnav']?.left ?? 0"
              [style.width.px]="tilePos()['tc-subnav']?.width ?? tileSubnavWidth()"
              [style.height.px]="tilePos()['tc-subnav']?.height ?? 600"
            >
              <app-collapsible-subnav
                icon="clipboard"
                title="Records"
                [items]="recordsSubNavItems"
                [activeItem]="activeRecordsPage()"
                [collapsed]="sideSubNavCollapsed()"
                [canvasMode]="true"
                (itemSelect)="activeRecordsPage.set($event)"
                (collapsedChange)="sideSubNavCollapsed.set($event)"
              />
            </div>
            <!-- Locked: Section Subnav (toolbar) -->
            <div class="absolute transition-all duration-200"
              [style.top.px]="tilePos()['tc-toolbar']?.top ?? 0"
              [style.left.px]="tilePos()['tc-toolbar']?.left ?? tileContentLeft()"
              [style.width.px]="tilePos()['tc-toolbar']?.width ?? tileContentWidth()"
              [style.height.px]="tilePos()['tc-toolbar']?.height ?? 56"
            >
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['records'] }" />
            </div>
            <!-- Locked: Title -->
            <div class="absolute flex items-center justify-between transition-all duration-200"
              [style.top.px]="tilePos()['tc-title']?.top ?? 72"
              [style.left.px]="tilePos()['tc-title']?.left ?? tileContentLeft()"
              [style.width.px]="tilePos()['tc-title']?.width ?? tileContentWidth()"
              [style.height.px]="tilePos()['tc-title']?.height ?? 40"
            >
              <div class="text-2xl font-bold text-foreground">{{ activeRecordsPageLabel() }}@if (activeRecordsPage() === 'rfis') { ({{ projectRfis().length }}) }@if (activeRecordsPage() === 'submittals') { ({{ projectSubmittals().length }}) }@if (activeRecordsPage() === 'daily-reports') { ({{ projectDailyReports().length }}) }@if (activeRecordsPage() === 'punch-items') { ({{ projectPunchItems().length }}) }@if (activeRecordsPage() === 'inspections') { ({{ projectInspections().length }}) }@if (activeRecordsPage() === 'action-items') { ({{ projectAttentionItems().length }}) }</div>
            </div>
            <!-- Locked: List widget (list view mode) -->
            @if (subnavViewMode() === 'list') {
              <div class="absolute bg-card border-default rounded-lg overflow-hidden flex flex-col transition-all duration-200"
                [style.top.px]="tilePos()['tc-list']?.top ?? 128"
                [style.left.px]="tilePos()['tc-list']?.left ?? tileContentLeft()"
                [style.width.px]="tilePos()['tc-list']?.width ?? tileContentWidth()"
                [style.height.px]="tilePos()['tc-list']?.height ?? 500"
                [style.z-index]="1"
              >
                @if (activeRecordsPage() === 'rfis') {
                  <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0">
                    <div>RFI #</div>
                    <div>Subject</div>
                    <div>Assignee</div>
                    <div>Due Date</div>
                    <div>Status</div>
                  </div>
                  <div class="overflow-y-auto flex-1">
                    @for (rfi of projectRfis(); track rfi.id) {
                      <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                        [class.bg-primary-20]="!!tileDetailViews()['tile-rfi-' + rfi.id]"
                        tabindex="0" (click)="navigateToRfiFromTile(rfi, 'tile-rfi-' + rfi.id)" (keydown.enter)="navigateToRfiFromTile(rfi, 'tile-rfi-' + rfi.id)">
                        <div class="text-sm font-medium text-primary">{{ rfi.number }}</div>
                        <div class="text-sm text-foreground truncate">{{ rfi.subject }}</div>
                        <div class="text-sm text-foreground-60 truncate">{{ rfi.assignee }}</div>
                        <div class="text-sm text-foreground-60">{{ rfi.dueDate }}</div>
                        <div class="flex items-center gap-1.5">
                          <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(rfi.status)"></div>
                          <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(rfi.status) }}</div>
                        </div>
                      </div>
                    }
                  </div>
                } @else if (activeRecordsPage() === 'submittals') {
                  <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0">
                    <div>SUB #</div>
                    <div>Subject</div>
                    <div>Assignee</div>
                    <div>Due Date</div>
                    <div>Status</div>
                  </div>
                  <div class="overflow-y-auto flex-1">
                    @for (sub of projectSubmittals(); track sub.id) {
                      <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                        [class.bg-primary-20]="!!tileDetailViews()['tile-sub-' + sub.id]"
                        tabindex="0" (click)="navigateToSubFromTile(sub, 'tile-sub-' + sub.id)" (keydown.enter)="navigateToSubFromTile(sub, 'tile-sub-' + sub.id)">
                        <div class="text-sm font-medium text-primary">{{ sub.number }}</div>
                        <div class="text-sm text-foreground truncate">{{ sub.subject }}</div>
                        <div class="text-sm text-foreground-60 truncate">{{ sub.assignee }}</div>
                        <div class="text-sm text-foreground-60">{{ sub.dueDate }}</div>
                        <div class="flex items-center gap-1.5">
                          <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(sub.status)"></div>
                          <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(sub.status) }}</div>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="flex flex-col items-center justify-center flex-1 text-foreground-40 py-10">
                    <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                    <div class="text-sm">Select a record type from the sidebar</div>
                  </div>
                }
              </div>
            }
            <!-- RFI tiles as widgets -->
            @if (activeRecordsPage() === 'rfis') {
              @for (rfi of projectRfis(); track rfi.id) {
                @if (subnavViewMode() !== 'list' || tileDetailViews()['tile-rfi-' + rfi.id]) {
                <div
                  [class]="'absolute' + (tileMoveTargetId() !== 'tile-rfi-' + rfi.id ? ' widget-detail-transition' : '')"
                  [attr.data-tile-id]="'tile-rfi-' + rfi.id"
                  [style.top.px]="tilePos()['tile-rfi-' + rfi.id]?.top ?? 0"
                  [style.left.px]="tilePos()['tile-rfi-' + rfi.id]?.left ?? 0"
                  [style.width.px]="tilePos()['tile-rfi-' + rfi.id]?.width ?? 308"
                  [style.height.px]="tilePos()['tile-rfi-' + rfi.id]?.height ?? 220"
                  [style.z-index]="tileDetailViews()['tile-rfi-' + rfi.id] ? 9999 : (tileZ()['tile-rfi-' + rfi.id] ?? 0)"
                  [class.opacity-30]="tileMoveTargetId() === 'tile-rfi-' + rfi.id"
                  (mousedown)="selectTileWidget('tile-rfi-' + rfi.id); tileDetailViews()['tile-rfi-' + rfi.id] ? $event.stopPropagation() : null"
                >
                @if (tileDetailViews()['tile-rfi-' + rfi.id]; as detail) {
                  <div class="bg-background rounded-lg overflow-hidden flex flex-col h-full shadow-2xl"
                    [class.border-default]="selectedWidgetId() !== 'tile-rfi-' + rfi.id"
                    [class.border-primary]="selectedWidgetId() === 'tile-rfi-' + rfi.id">
                    <div class="flex items-center justify-between px-5 py-3 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                      (mousedown)="onTileDetailHeaderMouseDown($event, 'tile-rfi-' + rfi.id)">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" [class]="itemStatusDot($any(detail).item.status)">
                          <i class="modus-icons text-base text-primary-foreground" aria-hidden="true">clipboard</i>
                        </div>
                        <div class="text-sm font-semibold text-foreground truncate">{{ $any(detail).item.number }}</div>
                      </div>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <div class="relative">
                          <div class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150"
                            (click)="toggleTileHeaderStatus('tile-rfi-' + rfi.id, $event)"
                            (mousedown)="$event.stopPropagation()">
                            <div class="w-2 h-2 rounded-full" [class]="itemStatusDot($any(detail).item.status)"></div>
                            <div class="text-xs font-medium text-foreground">{{ capitalizeStatus($any(detail).item.status) }}</div>
                            <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
                          </div>
                          @if (tileHeaderStatusOpen() === 'tile-rfi-' + rfi.id) {
                            <div class="absolute top-full right-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[160px] py-1"
                              role="listbox" (mousedown)="$event.stopPropagation()">
                              @for (opt of STATUS_OPTIONS; track opt.value) {
                                <div class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
                                  role="option" [attr.aria-selected]="opt.value === $any(detail).item.status"
                                  (click)="onTileHeaderStatusSelect('tile-rfi-' + rfi.id, opt.value, $event)">
                                  <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                                  <div class="text-sm font-medium text-foreground">{{ opt.label }}</div>
                                  @if (opt.value === $any(detail).item.status) {
                                    <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                                  }
                                </div>
                              }
                            </div>
                          }
                        </div>
                        <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                          (click)="closeTileDetail('tile-rfi-' + rfi.id)" aria-label="Close detail">
                          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
                        </div>
                      </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5">
                      <app-item-detail-view
                        [hideHeader]="true"
                        icon="clipboard" typeLabel="Request for Information"
                        [number]="$any(detail).item.number" [subject]="$any(detail).item.subject"
                        [question]="$any(detail).item.question" [assignee]="$any(detail).item.assignee"
                        [assigneeOptions]="ASSIGNEE_OPTIONS"
                        (assigneeChange)="onTileDetailAssigneeChange('tile-rfi-' + rfi.id, $event)"
                        field1Label="Created By" [field1Value]="$any(detail).item.askedBy"
                        field3Label="Created On" [field3Value]="$any(detail).item.askedOn"
                        field4Label="Due Date" [field4Value]="$any(detail).item.dueDate" [field4ShowStatus]="false"
                        [currentStatus]="$any(detail).item.status" [statusOptions]="STATUS_OPTIONS"
                        [statusDotClass]="itemStatusDot($any(detail).item.status)"
                        [statusText]="capitalizeStatus($any(detail).item.status)"
                        (statusChange)="onTileDetailStatusChange('tile-rfi-' + rfi.id, $event)"
                        (dueDateChange)="onTileDetailDueDateChange('tile-rfi-' + rfi.id, $event)"
                      />
                    </div>
                  </div>
                } @else {
                  <div class="h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
                    [class.border-default]="selectedWidgetId() !== 'tile-rfi-' + rfi.id"
                    [class.border-primary]="selectedWidgetId() === 'tile-rfi-' + rfi.id">
                    <div class="flex items-center justify-between px-4 py-2 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                      (mousedown)="tileCanvas.onTileMouseDown('tile-rfi-' + rfi.id, $event)">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded flex items-center justify-center" [class]="itemStatusDot(rfi.status)">
                          <i class="modus-icons text-sm text-primary-foreground" aria-hidden="true">clipboard</i>
                        </div>
                        <div class="text-sm font-semibold text-foreground">{{ rfi.number }}</div>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(rfi.status)"></div>
                        <div class="text-2xs font-medium text-foreground-60">{{ capitalizeStatus(rfi.status) }}</div>
                      </div>
                    </div>
                    <div class="flex-1 px-4 py-3 flex flex-col gap-2 overflow-hidden cursor-pointer" tabindex="0" (click)="navigateToRfiFromTile(rfi, 'tile-rfi-' + rfi.id)" (keydown.enter)="navigateToRfiFromTile(rfi, 'tile-rfi-' + rfi.id)" (mousedown)="$event.stopPropagation()">
                      <div class="text-sm text-foreground line-clamp-2">{{ rfi.subject }}</div>
                      <div class="flex items-center justify-between text-xs text-foreground-60 mt-auto">
                        <div class="flex items-center gap-1.5">
                          <i class="modus-icons text-sm" aria-hidden="true">person</i>
                          <div>{{ rfi.assignee }}</div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                          <div>{{ rfi.dueDate }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                </div>
                }
              }
            }
            <!-- Submittal tiles as widgets -->
            @if (activeRecordsPage() === 'submittals') {
              @for (sub of projectSubmittals(); track sub.id) {
                @if (subnavViewMode() !== 'list' || tileDetailViews()['tile-sub-' + sub.id]) {
                <div
                  [class]="'absolute' + (tileMoveTargetId() !== 'tile-sub-' + sub.id ? ' widget-detail-transition' : '')"
                  [attr.data-tile-id]="'tile-sub-' + sub.id"
                  [style.top.px]="tilePos()['tile-sub-' + sub.id]?.top ?? 0"
                  [style.left.px]="tilePos()['tile-sub-' + sub.id]?.left ?? 0"
                  [style.width.px]="tilePos()['tile-sub-' + sub.id]?.width ?? 308"
                  [style.height.px]="tilePos()['tile-sub-' + sub.id]?.height ?? 220"
                  [style.z-index]="tileDetailViews()['tile-sub-' + sub.id] ? 9999 : (tileZ()['tile-sub-' + sub.id] ?? 0)"
                  [class.opacity-30]="tileMoveTargetId() === 'tile-sub-' + sub.id"
                  (mousedown)="selectTileWidget('tile-sub-' + sub.id); tileDetailViews()['tile-sub-' + sub.id] ? $event.stopPropagation() : null"
                >
                @if (tileDetailViews()['tile-sub-' + sub.id]; as detail) {
                  <div class="bg-background rounded-lg overflow-hidden flex flex-col h-full shadow-2xl"
                    [class.border-default]="selectedWidgetId() !== 'tile-sub-' + sub.id"
                    [class.border-primary]="selectedWidgetId() === 'tile-sub-' + sub.id">
                    <div class="flex items-center justify-between px-5 py-3 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                      (mousedown)="onTileDetailHeaderMouseDown($event, 'tile-sub-' + sub.id)">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" [class]="itemStatusDot($any(detail).item.status)">
                          <i class="modus-icons text-base text-primary-foreground" aria-hidden="true">document</i>
                        </div>
                        <div class="text-sm font-semibold text-foreground truncate">{{ $any(detail).item.number }}</div>
                      </div>
                      <div class="flex items-center gap-2 flex-shrink-0">
                        <div class="relative">
                          <div class="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150"
                            (click)="toggleTileHeaderStatus('tile-sub-' + sub.id, $event)"
                            (mousedown)="$event.stopPropagation()">
                            <div class="w-2 h-2 rounded-full" [class]="itemStatusDot($any(detail).item.status)"></div>
                            <div class="text-xs font-medium text-foreground">{{ capitalizeStatus($any(detail).item.status) }}</div>
                            <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
                          </div>
                          @if (tileHeaderStatusOpen() === 'tile-sub-' + sub.id) {
                            <div class="absolute top-full right-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[160px] py-1"
                              role="listbox" (mousedown)="$event.stopPropagation()">
                              @for (opt of STATUS_OPTIONS; track opt.value) {
                                <div class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
                                  role="option" [attr.aria-selected]="opt.value === $any(detail).item.status"
                                  (click)="onTileHeaderStatusSelect('tile-sub-' + sub.id, opt.value, $event)">
                                  <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                                  <div class="text-sm font-medium text-foreground">{{ opt.label }}</div>
                                  @if (opt.value === $any(detail).item.status) {
                                    <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                                  }
                                </div>
                              }
                            </div>
                          }
                        </div>
                        <div class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                          (click)="closeTileDetail('tile-sub-' + sub.id)" aria-label="Close detail">
                          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
                        </div>
                      </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5">
                      <app-item-detail-view
                        [hideHeader]="true"
                        icon="document" typeLabel="Submittal"
                        [number]="$any(detail).item.number" [subject]="$any(detail).item.subject"
                        [assignee]="$any(detail).item.assignee"
                        [assigneeOptions]="ASSIGNEE_OPTIONS"
                        (assigneeChange)="onTileDetailAssigneeChange('tile-sub-' + sub.id, $event)"
                        [field1Value]="$any(detail).item.project"
                        [field3Value]="$any(detail).item.dueDate" [field3DateEditable]="true"
                        [currentStatus]="$any(detail).item.status" [statusOptions]="STATUS_OPTIONS"
                        [statusDotClass]="itemStatusDot($any(detail).item.status)"
                        [statusText]="capitalizeStatus($any(detail).item.status)"
                        (statusChange)="onTileDetailStatusChange('tile-sub-' + sub.id, $event)"
                        (dueDateChange)="onTileDetailDueDateChange('tile-sub-' + sub.id, $event)"
                      />
                    </div>
                  </div>
                } @else {
                  <div class="h-full flex flex-col bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
                    [class.border-default]="selectedWidgetId() !== 'tile-sub-' + sub.id"
                    [class.border-primary]="selectedWidgetId() === 'tile-sub-' + sub.id">
                    <div class="flex items-center justify-between px-4 py-2 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                      (mousedown)="tileCanvas.onTileMouseDown('tile-sub-' + sub.id, $event)">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded flex items-center justify-center" [class]="itemStatusDot(sub.status)">
                          <i class="modus-icons text-sm text-primary-foreground" aria-hidden="true">document</i>
                        </div>
                        <div class="text-sm font-semibold text-foreground">{{ sub.number }}</div>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(sub.status)"></div>
                        <div class="text-2xs font-medium text-foreground-60">{{ capitalizeStatus(sub.status) }}</div>
                      </div>
                    </div>
                    <div class="flex-1 px-4 py-3 flex flex-col gap-2 overflow-hidden cursor-pointer" tabindex="0" (click)="navigateToSubFromTile(sub, 'tile-sub-' + sub.id)" (keydown.enter)="navigateToSubFromTile(sub, 'tile-sub-' + sub.id)" (mousedown)="$event.stopPropagation()">
                      <div class="text-sm text-foreground line-clamp-2">{{ sub.subject }}</div>
                      <div class="flex items-center justify-between text-xs text-foreground-60 mt-auto">
                        <div class="flex items-center gap-1.5">
                          <i class="modus-icons text-sm" aria-hidden="true">person</i>
                          <div>{{ sub.assignee }}</div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                          <div>{{ sub.dueDate }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                }
                </div>
                }
              }
            }
            @if (!recordsSubPageHasContent()) {
              <div class="absolute transition-all duration-200"
                [style.top.px]="tilePos()['tc-title']?.top ? (tilePos()['tc-title'].top + tilePos()['tc-title'].height + 16) : 128"
                [style.left.px]="tilePos()['tc-toolbar']?.left ?? tileContentLeft()"
              >
                <app-empty-state icon="clipboard" [title]="activeRecordsPageLabel()" [description]="activeRecordsPageDescription()" />
              </div>
            }
          </div>
        } @else {
        <div class="flex min-h-[calc(100vh-12rem)] md:-ml-4">
          @if (!isMobile()) {
            <app-collapsible-subnav
              icon="clipboard"
              title="Records"
              [items]="recordsSubNavItems"
              [activeItem]="activeRecordsPage()"
              [collapsed]="sideSubNavCollapsed()"
              [canvasMode]="isCanvas()"
              (itemSelect)="activeRecordsPage.set($event)"
              (collapsedChange)="sideSubNavCollapsed.set($event)"
            />
          }
          <div class="flex-1 flex flex-col gap-6 min-w-0 md:pl-4">
            <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['records'] }" />
            <div class="flex items-center justify-between">
              <div class="text-2xl font-bold text-foreground">{{ activeRecordsPageLabel() }}@if (activeRecordsPage() === 'rfis') { ({{ projectRfis().length }}) }@if (activeRecordsPage() === 'submittals') { ({{ projectSubmittals().length }}) }@if (activeRecordsPage() === 'daily-reports') { ({{ projectDailyReports().length }}) }@if (activeRecordsPage() === 'punch-items') { ({{ projectPunchItems().length }}) }@if (activeRecordsPage() === 'inspections') { ({{ projectInspections().length }}) }@if (activeRecordsPage() === 'action-items') { ({{ projectAttentionItems().length }}) }</div>
            </div>
            @if (activeRecordsPage() === 'rfis') {
              @if (subnavViewMode() === 'grid') {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (rfi of projectRfis(); track rfi.id) {
                    <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="navigateToRfi(rfi)" (keydown.enter)="navigateToRfi(rfi)">
                      <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="itemStatusDot(rfi.status)">
                            <i class="modus-icons text-lg text-primary-foreground" aria-hidden="true">clipboard</i>
                          </div>
                          <div class="text-base font-semibold text-foreground">{{ rfi.number }}</div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(rfi.status)"></div>
                          <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(rfi.status) }}</div>
                        </div>
                      </div>
                      <div class="px-5 py-4 flex flex-col gap-3">
                        <div class="text-sm text-foreground line-clamp-2">{{ rfi.subject }}</div>
                        <div class="flex items-center justify-between text-xs text-foreground-60">
                          <div class="flex items-center gap-1.5">
                            <i class="modus-icons text-sm" aria-hidden="true">person</i>
                            <div>{{ rfi.assignee }}</div>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                            <div>{{ rfi.dueDate }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <app-empty-state extraClass="col-span-full" icon="clipboard" title="No RFIs" description="No Requests for Information found for this project." />
                  }
                </div>
              } @else {
                <div class="bg-card border-default rounded-lg overflow-hidden">
                  <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                    <div>RFI #</div>
                    <div>Subject</div>
                    <div>Assignee</div>
                    <div>Due Date</div>
                    <div>Status</div>
                  </div>
                  @for (rfi of projectRfis(); track rfi.id) {
                    <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                      tabindex="0" (click)="navigateToRfi(rfi)" (keydown.enter)="navigateToRfi(rfi)">
                      <div class="text-sm font-medium text-primary">{{ rfi.number }}</div>
                      <div class="text-sm text-foreground truncate">{{ rfi.subject }}</div>
                      <div class="text-sm text-foreground-60 truncate">{{ rfi.assignee }}</div>
                      <div class="text-sm text-foreground-60">{{ rfi.dueDate }}</div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(rfi.status)"></div>
                        <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(rfi.status) }}</div>
                      </div>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                      <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                      <div class="text-sm">No RFIs for this project</div>
                    </div>
                  }
                </div>
              }
            } @else if (activeRecordsPage() === 'submittals') {
              @if (subnavViewMode() === 'grid') {
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (sub of projectSubmittals(); track sub.id) {
                    <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="navigateToSubmittal(sub)" (keydown.enter)="navigateToSubmittal(sub)">
                      <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-lg flex items-center justify-center" [class]="itemStatusDot(sub.status)">
                            <i class="modus-icons text-lg text-primary-foreground" aria-hidden="true">document</i>
                          </div>
                          <div class="text-base font-semibold text-foreground">{{ sub.number }}</div>
                        </div>
                        <div class="flex items-center gap-1.5">
                          <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(sub.status)"></div>
                          <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(sub.status) }}</div>
                        </div>
                      </div>
                      <div class="px-5 py-4 flex flex-col gap-3">
                        <div class="text-sm text-foreground line-clamp-2">{{ sub.subject }}</div>
                        <div class="flex items-center justify-between text-xs text-foreground-60">
                          <div class="flex items-center gap-1.5">
                            <i class="modus-icons text-sm" aria-hidden="true">person</i>
                            <div>{{ sub.assignee }}</div>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <i class="modus-icons text-sm" aria-hidden="true">calendar</i>
                            <div>{{ sub.dueDate }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <app-empty-state extraClass="col-span-full" icon="document" title="No Submittals" description="No Submittals found for this project." />
                  }
                </div>
              } @else {
                <div class="bg-card border-default rounded-lg overflow-hidden">
                  <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                    <div>SUB #</div>
                    <div>Subject</div>
                    <div>Assignee</div>
                    <div>Due Date</div>
                    <div>Status</div>
                  </div>
                  @for (sub of projectSubmittals(); track sub.id) {
                    <div class="grid grid-cols-[100px_1fr_140px_100px_80px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                      tabindex="0" (click)="navigateToSubmittal(sub)" (keydown.enter)="navigateToSubmittal(sub)">
                      <div class="text-sm font-medium text-primary">{{ sub.number }}</div>
                      <div class="text-sm text-foreground truncate">{{ sub.subject }}</div>
                      <div class="text-sm text-foreground-60 truncate">{{ sub.assignee }}</div>
                      <div class="text-sm text-foreground-60">{{ sub.dueDate }}</div>
                      <div class="flex items-center gap-1.5">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(sub.status)"></div>
                        <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(sub.status) }}</div>
                      </div>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                      <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                      <div class="text-sm">No Submittals for this project</div>
                    </div>
                  }
                </div>
              }
            } @else if (activeRecordsPage() === 'daily-reports' || activeRecordsPage() === 'punch-items' || activeRecordsPage() === 'inspections' || activeRecordsPage() === 'action-items') {
              <app-records-subpages
                [activePage]="activeRecordsPage()"
                [viewMode]="subnavViewMode()"
                [dailyReports]="projectDailyReports()"
                [punchItems]="projectPunchItems()"
                [inspections]="projectInspections()"
                [actionItems]="projectAttentionItems()"
                [weatherForecast]="weatherForecast"
                (dailyReportClick)="navigateToDailyReport($event)"
                (punchItemClick)="navigateToPunchItem($event)"
                (inspectionClick)="navigateToInspection($event)"
              />
            } @else {
              <app-empty-state icon="clipboard" [title]="activeRecordsPageLabel()" [description]="activeRecordsPageDescription()" />
            }
          </div>
        </div>
        }
      }
      @case ('field-captures') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="400">
            <div class="absolute" [style.top.px]="0" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="56">
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['fieldCaptures'] }" />
            </div>
            <div class="absolute flex items-center" [style.top.px]="72" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="40">
              <div class="text-2xl font-bold text-foreground">Field Captures</div>
            </div>
            <div class="absolute" [style.top.px]="128" [style.left.px]="0">
              <app-empty-state icon="camera" title="Field Captures" description="Browse photos, 360 captures, and site documentation from the field." />
            </div>
          </div>
        } @else {
        <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['fieldCaptures'] }" />
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-foreground">Field Captures</div>
          </div>
          <app-empty-state icon="camera" title="Field Captures" description="Browse photos, 360 captures, and site documentation from the field." />
        </div>
        }
      }
      @case ('financials') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="tileCanvasMinHeight()">
            <!-- Locked: Side Subnav -->
            <div class="absolute overflow-visible transition-all duration-200"
              [style.top.px]="0" [style.left.px]="0"
              [style.width.px]="tileSubnavWidth()" [style.height.px]="600"
            >
              <app-collapsible-subnav
                icon="bar_graph"
                title="Financials"
                [items]="financialsSubNavItems"
                [activeItem]="activeFinancialsPage()"
                [collapsed]="sideSubNavCollapsed()"
                [canvasMode]="true"
                (itemSelect)="selectFinancialsSubPage($event)"
                (collapsedChange)="sideSubNavCollapsed.set($event)"
              />
            </div>
            <!-- Locked: Section Subnav (toolbar) -->
            <div class="absolute transition-all duration-200" [style.top.px]="tilePos()['tc-toolbar']?.top ?? 0" [style.left.px]="tilePos()['tc-toolbar']?.left ?? tileContentLeft()" [style.width.px]="tilePos()['tc-toolbar']?.width ?? tileContentWidth()" [style.height.px]="56">
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['financials'] }" />
            </div>
            <!-- Locked: Title -->
            @if (!subledgerCategory()) {
            <div class="absolute flex items-center justify-between transition-all duration-200" [style.top.px]="tilePos()['tc-title']?.top ?? 72" [style.left.px]="tilePos()['tc-title']?.left ?? tileContentLeft()" [style.width.px]="tilePos()['tc-title']?.width ?? tileContentWidth()" [style.height.px]="40">
              <div class="text-2xl font-bold text-foreground">{{ activeFinancialsPageLabel() }}@if (activeFinancialsPage() === 'change-orders') { ({{ projectChangeOrders().length }}) }@if (activeFinancialsPage() === 'revenue') { ({{ projectRevenueData().length }}) }@if (activeFinancialsPage() === 'cost-forecasts') { ({{ projectBudgetHistory().length }}) }</div>
            </div>
            }
            @if (activeFinancialsPage() === 'budget' && projectJobCost(); as jcProject) {
              @if (subledgerCategory()) {
                <!-- Locked: Subledger header + KPIs -->
                <div class="absolute transition-all duration-200"
                  [style.top.px]="tilePos()['tc-subledger-header']?.top ?? 68"
                  [style.left.px]="tilePos()['tc-subledger-header']?.left ?? tileContentLeft()"
                  [style.width.px]="tilePos()['tc-subledger-header']?.width ?? tileContentWidth()">
                  <ng-container [ngTemplateOutlet]="subledgerHeaderKpis" />
                </div>
                <!-- Resizable: Transaction Ledger -->
                <div class="absolute bg-card border-default rounded-lg"
                  data-widget-id="tile-subledger-ledger"
                  [style.top.px]="tilePos()['tile-subledger-ledger']?.top"
                  [style.left.px]="tilePos()['tile-subledger-ledger']?.left"
                  [style.width.px]="tilePos()['tile-subledger-ledger']?.width"
                  [style.height.px]="tilePos()['tile-subledger-ledger']?.height"
                  [style.z-index]="tileZ()['tile-subledger-ledger'] ?? 0">
                  <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
                    <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list</i>
                    <div class="text-base font-semibold text-foreground">Transaction Ledger</div>
                    <div class="text-xs text-foreground-40 ml-auto">{{ subledgerTransactions().length }} entries</div>
                  </div>
                  <div class="absolute left-0 right-0 bottom-0 overflow-y-auto" style="top: 53px">
                    <ng-container [ngTemplateOutlet]="subledgerLedgerTableRows" />
                  </div>
                  <widget-resize-handle position="right" (resizeStart)="onSubledgerLedgerResizeStart($event)" />
                </div>
              } @else {
                <!-- Locked: Budget KPIs -->
                <div class="absolute transition-all duration-200"
                  [style.top.px]="tilePos()['tile-budget-kpis']?.top"
                  [style.left.px]="tilePos()['tile-budget-kpis']?.left"
                  [style.width.px]="tilePos()['tile-budget-kpis']?.width"
                  [style.height.px]="tilePos()['tile-budget-kpis']?.height">
                  <ng-container [ngTemplateOutlet]="budgetKpisRaw" [ngTemplateOutletContext]="{ jcP: jcProject }" />
                </div>
                @for (btId of budgetTileIds; track btId) {
                  <div class="absolute overflow-hidden"
                    [attr.data-widget-id]="btId"
                    [style.top.px]="tilePos()[btId]?.top"
                    [style.left.px]="tilePos()[btId]?.left"
                    [style.width.px]="tilePos()[btId]?.width"
                    [style.height.px]="tilePos()[btId]?.height"
                    [style.z-index]="tileZ()[btId] ?? 0"
                    [class.opacity-30]="tileMoveTargetId() === btId">
                    @switch (btId) {
                      @case ('tile-budget-breakdown') {
                        <ng-container [ngTemplateOutlet]="budgetBreakdownContent" [ngTemplateOutletContext]="{ jcP: jcProject }" />
                      }
                      @case ('tile-budget-profitfade') {
                        <ng-container [ngTemplateOutlet]="budgetProfitFadeContent" [ngTemplateOutletContext]="{ jcP: jcProject }" />
                      }
                      @case ('tile-budget-costsummary') {
                        <ng-container [ngTemplateOutlet]="budgetCostSummaryContent" [ngTemplateOutletContext]="{ jcP: jcProject }" />
                      }
                    }
                  </div>
                }
              }
            } @else if (!financialsSubPageHasContent()) {
              <div class="absolute transition-all duration-200" [style.top.px]="128" [style.left.px]="tileContentLeft()" [style.width.px]="tileContentWidth()">
                <app-empty-state icon="bar_graph" [title]="activeFinancialsPageLabel()" [description]="activeFinancialsPageDescription()" />
              </div>
            }
          </div>
        } @else {
        <div class="flex min-h-[calc(100vh-12rem)] md:-ml-4">
          @if (!isMobile()) {
            <app-collapsible-subnav
              icon="bar_graph"
              title="Financials"
              [items]="financialsSubNavItems"
              [activeItem]="activeFinancialsPage()"
              [collapsed]="sideSubNavCollapsed()"
              [canvasMode]="isCanvas()"
              (itemSelect)="selectFinancialsSubPage($event)"
              (collapsedChange)="sideSubNavCollapsed.set($event)"
            />
          }
          <div class="flex-1 flex flex-col min-w-0 md:pl-4" [class]="subledgerCategory() ? 'gap-3' : 'gap-6'">
            <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['financials'] }" />
            @if (!subledgerCategory()) {
              <div class="flex items-center justify-between">
                <div class="text-2xl font-bold text-foreground">{{ activeFinancialsPageLabel() }}@if (activeFinancialsPage() === 'change-orders') { ({{ projectChangeOrders().length }}) }@if (activeFinancialsPage() === 'revenue') { ({{ projectRevenueData().length }}) }@if (activeFinancialsPage() === 'cost-forecasts') { ({{ projectBudgetHistory().length }}) }</div>
              </div>
            }
            @if (activeFinancialsPage() === 'budget' && projectJobCost(); as jcProject) {
              <ng-container [ngTemplateOutlet]="budgetDetailContent" />
            } @else if (activeFinancialsPage() === 'change-order-requests' || activeFinancialsPage() === 'applications-for-payment' || activeFinancialsPage() === 'cost-forecasts') {
              <app-financials-subpages
                [activePage]="activeFinancialsPage()"
                [viewMode]="subnavViewMode()"
                [changeOrders]="projectChangeOrders()"
                [revenueData]="projectRevenueData()"
                [budgetHistory]="projectBudgetHistory()"
                [lastBudgetPoint]="lastBudgetPoint()"
                (changeOrderClick)="navigateToChangeOrder($event)"
              />
            } @else {
              <app-empty-state icon="bar_graph" [title]="activeFinancialsPageLabel()" [description]="activeFinancialsPageDescription()" />
            }
          </div>
        </div>
        }
      }
      @case ('files') {
        @if (isSubpageCanvasActive()) {
          <div class="relative overflow-visible" [style.min-height.px]="400">
            <div class="absolute" [style.top.px]="0" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="56">
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['files'] }" />
            </div>
            <div class="absolute flex items-center" [style.top.px]="72" [style.left.px]="0" [style.width.px]="1280" [style.height.px]="40">
              <div class="text-2xl font-bold text-foreground">Files</div>
            </div>
            <div class="absolute" [style.top.px]="128" [style.left.px]="0">
              <app-empty-state icon="folder_closed" title="Project Files" description="Manage project documents, shared files, and folder structures." />
            </div>
          </div>
        } @else {
        <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['files'] }" />
        <div class="flex flex-col gap-6">
          <div class="flex items-center justify-between">
            <div class="text-2xl font-bold text-foreground">Files</div>
          </div>
          <app-empty-state icon="folder_closed" title="Project Files" description="Manage project documents, shared files, and folder structures." />
        </div>
        }
      }
      @default {
        @if (!isCanvas()) {
        <div class="flex items-center justify-between mb-6">
          <div class="text-2xl font-bold text-foreground">Dashboard</div>
        </div>
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
        }

        <!-- Widget grid -->
        <div
          [class]="isCanvas() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
          [style.height.px]="isMobile() ? mobileGridHeight() : null"
          [style.min-height.px]="!isMobile() ? desktopGridMinHeight() : null"
          #widgetGrid
        >
          @if (isCanvas()) {
            <div
              class="absolute overflow-hidden"
              [class.widget-detail-transition]="shouldTransition('projHeader')"
              [attr.data-widget-id]="'projHeader'"
              [style.top.px]="wTops()['projHeader']"
              [style.left.px]="wLefts()['projHeader']"
              [style.width.px]="wPixelWidths()['projHeader']"
              [style.height.px]="wHeights()['projHeader']"
              [style.z-index]="wZIndices()['projHeader'] ?? 0"
            >
              <div class="flex items-center justify-between mb-4">
                <div class="text-2xl font-bold text-foreground">Dashboard</div>
              </div>
              <div class="grid grid-cols-4 gap-3">
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
            </div>
          }
          @for (wId of widgets; track wId) {
            <div
              [class]="(canvasDetailViews()[wId] ? 'absolute' : (isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'absolute overflow-hidden')) + (shouldTransition(wId) ? ' widget-detail-transition' : '')"
              [attr.data-widget-id]="wId"
              [style.top.px]="wTops()[wId]"
              [style.left.px]="!isMobile() ? wLefts()[wId] : null"
              [style.width.px]="!isMobile() ? wPixelWidths()[wId] : null"
              [style.height.px]="wHeights()[wId]"
              [style.z-index]="canvasDetailViews()[wId] ? 9999 : (wZIndices()[wId] ?? 0)"
              (mousedown)="canvasDetailViews()[wId] ? $event.stopPropagation() : null"
            >
            @if (canvasDetailViews()[wId]; as detail) {
              <div class="bg-background rounded-lg overflow-hidden flex flex-col h-full border-primary shadow-2xl">
                <div
                  class="flex items-center justify-between px-5 py-3 bg-card border-bottom-default cursor-move select-none flex-shrink-0"
                  (mousedown)="onCanvasDetailHeaderMouseDown($event, wId)"
                >
                  <div class="flex items-center gap-2 text-foreground-60 cursor-pointer hover:text-foreground transition-colors duration-150"
                    (click)="closeCanvasDetail(wId)"
                    (keydown.enter)="closeCanvasDetail(wId)"
                  >
                    <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
                    <div class="text-sm font-medium">{{ detailBackLabel() }}</div>
                  </div>
                  <div
                    class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    (click)="closeCanvasDetail(wId)"
                    aria-label="Close detail"
                  >
                    <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
                  </div>
                </div>
                <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs[detail.type === 'rfi' ? 'rfi-detail' : detail.type === 'drawing' ? 'drawing-detail' : 'submittal-detail'] }" />
                <div class="flex-1 overflow-y-auto p-5">
                  @if (detail.type === 'rfi') {
                    <app-item-detail-view
                      icon="clipboard"
                      typeLabel="Request for Information"
                      [number]="detail.item.number"
                      [subject]="detail.item.subject"
                      [question]="$any(detail.item).question"
                      [assignee]="detail.item.assignee"
                      [assigneeOptions]="ASSIGNEE_OPTIONS"
                      (assigneeChange)="onCanvasDetailAssigneeChange(wId, $event)"
                      field1Label="Created By"
                      [field1Value]="$any(detail.item).askedBy"
                      field3Label="Created On"
                      [field3Value]="$any(detail.item).askedOn"
                      field4Label="Due Date"
                      [field4Value]="detail.item.dueDate"
                      [field4ShowStatus]="false"
                      [currentStatus]="detail.item.status"
                      [statusOptions]="STATUS_OPTIONS"
                      [statusDotClass]="itemStatusDot(detail.item.status)"
                      [statusText]="capitalizeStatus(detail.item.status)"
                      (statusChange)="onCanvasDetailStatusChange(wId, $event)"
                      (dueDateChange)="onCanvasDetailDueDateChange(wId, $event)"
                    />
                  }
                  @if (detail.type === 'submittal') {
                    <app-item-detail-view
                      icon="document"
                      typeLabel="Submittal"
                      [number]="detail.item.number"
                      [subject]="detail.item.subject"
                      [assignee]="detail.item.assignee"
                      [assigneeOptions]="ASSIGNEE_OPTIONS"
                      (assigneeChange)="onCanvasDetailAssigneeChange(wId, $event)"
                      [field1Value]="$any(detail.item).project"
                      [field3Value]="detail.item.dueDate"
                      [field3DateEditable]="true"
                      [currentStatus]="detail.item.status"
                      [statusOptions]="STATUS_OPTIONS"
                      [statusDotClass]="itemStatusDot(detail.item.status)"
                      [statusText]="capitalizeStatus(detail.item.status)"
                      (statusChange)="onCanvasDetailStatusChange(wId, $event)"
                      (dueDateChange)="onCanvasDetailDueDateChange(wId, $event)"
                    />
                  }
                  @if (detail.type === 'drawing') {
                    <div class="flex flex-col gap-4">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
                          <i class="modus-icons text-lg text-primary" aria-hidden="true">floorplan</i>
                        </div>
                        <div class="min-w-0">
                          <div class="text-lg font-semibold text-foreground truncate">{{ $any(detail.item).title }}</div>
                          <div class="text-sm text-foreground-60">{{ $any(detail.item).revision }} &middot; {{ $any(detail.item).date }}</div>
                        </div>
                      </div>
                      <div class="bg-secondary rounded-lg overflow-hidden flex items-center justify-center p-4" style="min-height: 300px">
                        <img [src]="$any(detail.item).thumbnail" [alt]="$any(detail.item).title" class="max-w-full max-h-[60vh] object-contain rounded" />
                      </div>
                      <div class="text-sm text-foreground-60">{{ $any(detail.item).subtitle }}</div>
                    </div>
                  }
                </div>
                <div
                  class="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                  (mousedown)="onCanvasDetailResizeMouseDown($event, wId)"
                >
                  <div class="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-foreground-40 rounded-br-sm"></div>
                </div>
              </div>
            } @else {
              <div class="relative h-full" [class.opacity-30]="moveTargetId() === wId">
                <widget-lock-toggle [locked]="wLocked()[wId]" (toggle)="toggleWidgetLock(wId)" />

              @switch (wId) {
                @case ('milestones') {
              <app-widget-frame icon="flag" title="Milestones" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div headerMeta class="text-xs text-foreground-60">{{ completedMilestones() }}/{{ milestones().length }} Complete</div>
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
              </app-widget-frame>
                }

                @case ('tasks') {
              <app-widget-frame icon="clipboard" title="Key Tasks" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div headerMeta class="text-xs text-foreground-60">{{ openTaskCount() }} Open</div>
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
                      <modus-badge [color]="severityBadgeColor(task.priority)" variant="filled" size="sm">
                        {{ task.priority | titlecase }}
                      </modus-badge>
                    </div>
                  }
                </div>
              </app-widget-frame>
                }

                @case ('risks') {
              <app-widget-frame icon="warning" title="Risks" iconClass="text-warning" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div headerMeta class="text-xs text-foreground-60">{{ risks().length }} Identified</div>
                <div class="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
                  @for (risk of risks(); track risk.id) {
                    <div class="p-3 bg-background border-default rounded-lg flex flex-col gap-2">
                      <div class="flex items-center justify-between">
                        <div class="text-sm font-medium text-foreground">{{ risk.title }}</div>
                        <modus-badge [color]="severityBadgeColor(risk.severity)" variant="filled" size="sm">
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
              </app-widget-frame>
                }

                @case ('rfis') {
              <app-widget-frame icon="clipboard" title="RFIs" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                @if (rfiOverdueCount() > 0) {
                  <div headerExtra class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                    <div class="text-xs font-medium text-destructive">{{ rfiOverdueCount() }} overdue</div>
                  </div>
                }
                <div headerMeta class="text-xs text-foreground-60">{{ projectRfis().length }} Total</div>
                <div class="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                  <div role="columnheader">RFI #</div>
                  <div role="columnheader">Subject</div>
                  <div role="columnheader">Due</div>
                  <div role="columnheader">Status</div>
                </div>
                <div class="overflow-y-auto flex-1" role="table" aria-label="RFIs" aria-live="polite">
                  @for (rfi of projectRfis(); track rfi.id) {
                    <div class="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" tabindex="0" (click)="navigateToRfi(rfi, wId)" (keydown.enter)="navigateToRfi(rfi, wId)" (mousedown)="$event.stopPropagation()">
                      <div class="text-sm font-medium text-primary" role="cell">{{ rfi.number }}</div>
                      <div class="text-sm text-foreground truncate" role="cell">{{ rfi.subject }}</div>
                      <div class="text-sm text-foreground-60" role="cell">{{ rfi.dueDate }}</div>
                      <div class="flex items-center gap-1.5" role="cell">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(rfi.status)"></div>
                        <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(rfi.status) }}</div>
                      </div>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                      <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                      <div class="text-sm">No RFIs for this project</div>
                    </div>
                  }
                </div>
              </app-widget-frame>
                }

                @case ('submittals') {
              <app-widget-frame icon="document" title="Submittals" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                @if (submittalOverdueCount() > 0) {
                  <div headerExtra class="flex items-center px-2 py-0.5 rounded-full bg-destructive-20">
                    <div class="text-xs font-medium text-destructive">{{ submittalOverdueCount() }} overdue</div>
                  </div>
                }
                <div headerMeta class="text-xs text-foreground-60">{{ projectSubmittals().length }} Total</div>
                <div class="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                  <div role="columnheader">SUB #</div>
                  <div role="columnheader">Subject</div>
                  <div role="columnheader">Due</div>
                  <div role="columnheader">Status</div>
                </div>
                <div class="overflow-y-auto flex-1" role="table" aria-label="Submittals" aria-live="polite">
                  @for (sub of projectSubmittals(); track sub.id) {
                    <div class="grid grid-cols-[1fr_2fr_1fr_1fr] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" tabindex="0" (click)="navigateToSubmittal(sub, wId)" (keydown.enter)="navigateToSubmittal(sub, wId)" (mousedown)="$event.stopPropagation()">
                      <div class="text-sm font-medium text-primary" role="cell">{{ sub.number }}</div>
                      <div class="text-sm text-foreground truncate" role="cell">{{ sub.subject }}</div>
                      <div class="text-sm text-foreground-60" role="cell">{{ sub.dueDate }}</div>
                      <div class="flex items-center gap-1.5" role="cell">
                        <div class="w-2 h-2 rounded-full" [class]="itemStatusDot(sub.status)"></div>
                        <div class="text-xs font-medium text-foreground-60">{{ capitalizeStatus(sub.status) }}</div>
                      </div>
                    </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                      <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                      <div class="text-sm">No submittals for this project</div>
                    </div>
                  }
                </div>
              </app-widget-frame>
                }

                @case ('drawing') {
              <app-widget-frame icon="floorplan" title="Latest Drawing" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div headerMeta class="text-xs text-foreground-60">{{ latestDrawing().version }}</div>
                <div class="overflow-y-auto flex-1 cursor-pointer hover:opacity-90 transition-opacity duration-150" role="button" tabindex="0"
                  [attr.aria-label]="'Open drawing: ' + newestDrawingTile().title"
                  (click)="openLatestDrawing()"
                  (keydown.enter)="openLatestDrawing()">
                  <div class="relative w-full aspect-[4/3] bg-muted overflow-hidden">
                    <img [src]="newestDrawingTile().thumbnail" [alt]="newestDrawingTile().title" class="w-full h-full object-cover" />
                    <div class="absolute top-2 left-2 px-2 py-0.5 rounded bg-success text-success-foreground text-2xs font-semibold">{{ newestDrawingTile().revision }}</div>
                  </div>
                  <div class="px-4 py-3 flex flex-col gap-1">
                    <div class="text-sm font-medium text-foreground truncate">{{ newestDrawingTile().title }}</div>
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-foreground-60 truncate">{{ newestDrawingTile().subtitle }}</div>
                      <div class="text-xs text-foreground-40 flex-shrink-0 ml-2">{{ newestDrawingTile().date }}</div>
                    </div>
                  </div>
                </div>
              </app-widget-frame>
                }

                @case ('budget') {
              <app-widget-frame icon="bar_graph" title="Budget" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div class="p-5 flex flex-col gap-4 overflow-y-auto flex-1 cursor-pointer"
                  (click)="navigateToBudgetPage(); $event.stopPropagation()"
                  (keydown.enter)="navigateToBudgetPage()"
                  (mousedown)="$event.stopPropagation()"
                  role="button" tabindex="0">
                  <div class="flex items-baseline justify-between">
                    <div class="text-3xl font-bold text-foreground">{{ budgetUsed() }}</div>
                    <div class="text-sm text-foreground-60">of {{ budgetTotal() }}</div>
                  </div>
                  <modus-progress [value]="budgetPct()" [max]="100" [className]="budgetHealthy() ? 'progress-primary' : 'progress-danger'" />
                  <div class="flex w-full h-3 rounded-full overflow-hidden">
                    @for (item of budgetBreakdown(); track item.label) {
                      <div class="{{ item.colorClass }}" [style.width.%]="item.pct"></div>
                    }
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    @for (item of budgetBreakdown(); track item.label) {
                      <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                        <div class="flex items-center gap-1.5">
                          <div class="w-2 h-2 rounded-full {{ item.colorClass }} flex-shrink-0"></div>
                          <div class="text-2xs text-foreground-40 uppercase tracking-wide">{{ item.label }}</div>
                        </div>
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
              </app-widget-frame>
                }

                @case ('team') {
              <app-widget-frame icon="people_group" title="Team" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
                <div headerMeta class="text-xs text-foreground-60">{{ team().length }} Members</div>
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
              </app-widget-frame>
                }

                @case ('activity') {
              <app-widget-frame icon="history" title="Recent Activity" [isSelected]="selectedWidgetId() === wId" [isMobile]="isMobile()"
                (headerMouseDown)="onWidgetHeaderMouseDown(wId, $event)" (headerTouchStart)="onWidgetHeaderTouchStart(wId, $event)"
                (resizeStart)="startWidgetResize(wId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(wId, 'both', $event)">
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
              </app-widget-frame>
                }
              }

              </div>
            }
            </div>
          }

          </div>
      }
      }
      }
    </ng-template>

    @if (isCanvas()) {
      <div class="canvas-host bg-background text-foreground canvas-mode" #canvasHost (mousedown)="panning.onPanMouseDown($event)">
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
                (click)="ai.toggle()"
                (keydown.enter)="ai.toggle()"
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
                class="custom-side-nav-item relative"
                (click)="detailDrawing() ? resetDrawingFit() : toggleResetMenu(); $event.stopPropagation()"
                [title]="detailDrawing() ? 'Reset Layout' : 'Layout options'"
                role="button"
                [attr.aria-label]="detailDrawing() ? 'Reset Layout' : 'Layout options'"
                [attr.aria-expanded]="detailDrawing() ? null : resetMenuOpen()"
              >
                <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                @if (panning.locked()) {
                  <i class="modus-icons absolute top-1 right-1 text-2xs text-primary" aria-hidden="true">lock</i>
                }
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">Layout</div>
                }
                @if (!detailDrawing()) {
                  <svg class="absolute bottom-1 right-1 w-1.5 h-1.5 text-foreground-40" viewBox="0 0 6 6" fill="currentColor" aria-hidden="true">
                    <path d="M6 0V6H0L6 0Z"/>
                  </svg>
                }
              </div>
              @if (resetMenuOpen() && !detailDrawing()) {
                <div class="canvas-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[210px] py-1">
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="panning.toggleLock(); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" [class]="panning.locked() ? 'text-primary' : 'text-foreground'" aria-hidden="true">{{ panning.locked() ? 'lock' : 'lock_open' }}</i>
                    <div class="text-sm" [class]="panning.locked() ? 'text-primary font-medium' : 'text-foreground'">{{ panning.locked() ? 'Canvas Locked' : 'Canvas Unlocked' }}</div>
                  </div>
                  <div class="border-bottom-default my-1"></div>
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
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('save-defaults'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">save_disk</i>
                    <div class="text-sm">Save as Default Layout</div>
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

        <div class="canvas-content" [class.canvas-drawing-detail]="isCanvasDrawingDetail()" role="main" id="main-content" tabindex="-1"
          [style.transform]="(panning.panOffsetX() || panning.panOffsetY()) ? 'translate(' + panning.panOffsetX() + 'px,' + panning.panOffsetY() + 'px)' : null">
          <div [class]="isCanvasDrawingDetail() ? 'py-6 flex flex-col' : 'py-6 max-w-screen-xl mx-auto'"
            [style.height]="isCanvasDrawingDetail() ? 'calc(100vh - 80px)' : null">
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
            (click)="ai.toggle()"
            (keydown.enter)="ai.toggle()"
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
          <div [class]="detailDrawing() ? 'p-4 max-w-[1920px] mx-auto flex flex-col h-full' : 'px-4 py-4 md:py-6 max-w-[1920px] mx-auto'">
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
                @if (navExpanded() && !isMobile()) {
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
              @if (navExpanded() && !isMobile()) {
                <div class="custom-side-nav-label">Settings</div>
              }
            </div>
          </div>
        </div>
      }

      @if (isMobile() && navExpanded() && hasSubNav()) {
        <div class="mobile-side-subnav">
          @switch (activeNavItem()) {
            @case ('records') {
              <div class="flex items-center gap-2 px-4 py-3 flex-shrink-0">
                <i class="modus-icons text-base text-primary" aria-hidden="true">clipboard</i>
                <div class="text-sm font-semibold text-primary">Records</div>
              </div>
              <div class="flex-1 overflow-y-auto min-h-0">
                @for (item of recordsSubNavItems; track item.value) {
                  <div
                    class="py-2.5 text-sm cursor-pointer transition-colors duration-150"
                    [class.bg-primary]="activeRecordsPage() === item.value"
                    [class.text-primary-foreground]="activeRecordsPage() === item.value"
                    [class.font-medium]="activeRecordsPage() === item.value"
                    [class.rounded-md]="activeRecordsPage() === item.value"
                    [class.mx-2]="activeRecordsPage() === item.value"
                    [class.px-2]="activeRecordsPage() === item.value"
                    [class.px-4]="activeRecordsPage() !== item.value"
                    [class.text-foreground]="activeRecordsPage() !== item.value"
                    [class.hover:bg-muted]="activeRecordsPage() !== item.value"
                    role="button" tabindex="0"
                    (click)="selectRecordsSubPage(item.value)"
                    (keydown.enter)="selectRecordsSubPage(item.value)">
                    {{ item.label }}
                  </div>
                }
              </div>
            }
            @case ('financials') {
              <div class="flex items-center gap-2 px-4 py-3 flex-shrink-0">
                <i class="modus-icons text-base text-primary" aria-hidden="true">bar_graph</i>
                <div class="text-sm font-semibold text-primary">Financials</div>
              </div>
              <div class="flex-1 overflow-y-auto min-h-0">
                @for (item of financialsSubNavItems; track item.value) {
                  <div
                    class="py-2.5 text-sm cursor-pointer transition-colors duration-150"
                    [class.bg-primary]="activeFinancialsPage() === item.value"
                    [class.text-primary-foreground]="activeFinancialsPage() === item.value"
                    [class.font-medium]="activeFinancialsPage() === item.value"
                    [class.rounded-md]="activeFinancialsPage() === item.value"
                    [class.mx-2]="activeFinancialsPage() === item.value"
                    [class.px-2]="activeFinancialsPage() === item.value"
                    [class.px-4]="activeFinancialsPage() !== item.value"
                    [class.text-foreground]="activeFinancialsPage() !== item.value"
                    [class.hover:bg-muted]="activeFinancialsPage() !== item.value"
                    role="button" tabindex="0"
                    (click)="selectFinancialsSubPage(item.value)"
                    (keydown.enter)="selectFinancialsSubPage(item.value)">
                    {{ item.label }}
                </div>
              }
              </div>
            }
          }
        </div>
      }

      @if (navExpanded()) {
        <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
      }

    </div>
    }

    <ai-assistant-panel
      [controller]="ai"
      welcomeText="Ask me about this project, milestones, budget, or team status."
      placeholder="Ask about this project..."
      [showDisclaimer]="false"
    />

    <ng-template #budgetDetailContent>
      @if (projectJobCost(); as jcP) {
        @if (subledgerCategory(); as slCat) {
          <ng-container [ngTemplateOutlet]="subledgerHeaderKpis" />
          <ng-container [ngTemplateOutlet]="subledgerLedgerRaw" />
        } @else {
        <ng-container [ngTemplateOutlet]="budgetKpisRaw" [ngTemplateOutletContext]="{ jcP: jcP }" />
        <ng-container [ngTemplateOutlet]="budgetBreakdownRaw" [ngTemplateOutletContext]="{ jcP: jcP }" />
        <ng-container [ngTemplateOutlet]="budgetProfitFadeRaw" [ngTemplateOutletContext]="{ jcP: jcP }" />
        <ng-container [ngTemplateOutlet]="budgetCostSummaryRaw" [ngTemplateOutletContext]="{ jcP: jcP }" />
        }
      }
    </ng-template>

    <ng-template #subledgerHeaderKpis>
      @if (subledgerCategory(); as slCat) {
        <div class="flex items-center gap-3 mb-6" (mousedown)="$event.stopPropagation()">
          <div
            class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors duration-150"
            (click)="closeSubledger()"
            role="button" tabindex="0"
            aria-label="Back to Budget"
          >
            <i class="modus-icons text-base text-foreground" aria-hidden="true">arrow_left</i>
          </div>
          <div class="flex items-center gap-3 relative">
            <div class="w-3 h-3 rounded-full {{ subledgerColorClass() }} flex-shrink-0"></div>
            <div class="flex items-center gap-2 cursor-pointer select-none"
              role="button" tabindex="0"
              (click)="subledgerDropdownOpen.set(!subledgerDropdownOpen())"
              (keydown.enter)="subledgerDropdownOpen.set(!subledgerDropdownOpen())">
              <div class="text-2xl font-bold text-foreground">{{ slCat }} Subledger</div>
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">{{ subledgerDropdownOpen() ? 'expand_less' : 'expand_more' }}</i>
            </div>
            @if (subledgerDropdownOpen()) {
              <div class="absolute top-full left-0 mt-2 bg-card border-default rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]">
                @for (cat of subledgerCategoryOptions(); track cat) {
                  <div class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors duration-150"
                    [class.bg-primary-20]="cat === slCat"
                    role="option" tabindex="0"
                    [attr.aria-selected]="cat === slCat"
                    (click)="switchSubledger(cat)"
                    (keydown.enter)="switchSubledger(cat)">
                    <div class="w-2.5 h-2.5 rounded-full {{ getCategoryColor(cat) }} flex-shrink-0"></div>
                    <div class="text-sm font-medium text-foreground">{{ cat }}</div>
                    @if (cat === slCat) {
                      <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-2">
            <div class="text-sm text-foreground-60">Total {{ slCat }} Cost</div>
            <div class="text-3xl font-bold text-foreground">{{ formatJobCost(subledgerTotal()) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-2">
            <div class="text-sm text-foreground-60">Transactions</div>
            <div class="text-3xl font-bold text-foreground">{{ subledgerTransactions().length }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-2">
            <div class="text-sm text-foreground-60">Date Range</div>
            <div class="text-lg font-bold text-foreground">{{ subledgerDateRange() }}</div>
          </div>
        </div>
      }
    </ng-template>

    <ng-template #subledgerLedgerRaw>
      @if (subledgerCategory(); as slCat) {
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list</i>
            <div class="text-base font-semibold text-foreground">Transaction Ledger</div>
            <div class="text-xs text-foreground-40 ml-auto">{{ subledgerTransactions().length }} entries</div>
          </div>
          <ng-container [ngTemplateOutlet]="subledgerLedgerTableRows" />
        </div>
      }
    </ng-template>

    <ng-template #subledgerLedgerTableRows>
      <div class="grid grid-cols-[100px_1fr_1fr_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
        <div role="columnheader">Date</div>
        <div role="columnheader">Description</div>
        <div role="columnheader">Vendor</div>
        <div role="columnheader">Ref</div>
        <div class="text-right" role="columnheader">Amount</div>
        <div class="text-right" role="columnheader">Running</div>
      </div>
      <div role="table" aria-label="Subledger transactions">
        @for (tx of subledgerTransactions(); track tx.id) {
          <div class="grid grid-cols-[100px_1fr_1fr_100px_100px_100px] gap-3 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
            <div class="text-sm text-foreground-60" role="cell">{{ tx.date }}</div>
            <div class="text-sm text-foreground" role="cell">{{ tx.description }}</div>
            <div class="text-sm text-foreground-60" role="cell">{{ tx.vendor }}</div>
            <div class="text-xs text-foreground-40 font-mono" role="cell">{{ tx.reference }}</div>
            <div class="text-sm font-semibold text-foreground text-right" role="cell">{{ formatJobCost(tx.amount) }}</div>
            <div class="text-sm text-foreground-60 text-right" role="cell">{{ formatJobCost(tx.runningTotal) }}</div>
          </div>
        }
        <div class="grid grid-cols-[100px_1fr_1fr_100px_100px_100px] gap-3 px-5 py-3 bg-muted items-center" role="row">
          <div class="text-sm font-bold text-foreground" role="cell"></div>
          <div class="text-sm font-bold text-foreground" role="cell">Total</div>
          <div role="cell"></div>
          <div role="cell"></div>
          <div class="text-sm font-bold text-foreground text-right" role="cell">{{ formatJobCost(subledgerTotal()) }}</div>
          <div role="cell"></div>
        </div>
      </div>
    </ng-template>

    <ng-template #budgetKpisRaw let-jcP="jcP">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center">
              <i class="modus-icons text-base text-primary" aria-hidden="true">payment_instant</i>
            </div>
            <div class="text-sm font-medium text-foreground-60">Total Budget</div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ jcP.budgetTotal }}</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-warning-20 flex items-center justify-center">
              <i class="modus-icons text-base text-warning" aria-hidden="true">bar_graph_line</i>
            </div>
            <div class="text-sm font-medium text-foreground-60">Total Spent</div>
          </div>
          <div class="text-3xl font-bold text-foreground">{{ jcP.budgetUsed }}</div>
          <div class="text-xs {{ jcP.budgetPct >= 90 ? 'text-destructive' : jcP.budgetPct >= 75 ? 'text-warning' : 'text-success' }} font-medium">{{ jcP.budgetPct }}% of budget</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-base text-success" aria-hidden="true">bar_graph</i>
            </div>
            <div class="text-sm font-medium text-foreground-60">Remaining</div>
          </div>
          <div class="text-3xl font-bold text-success">{{ formatJobCost(jcBudgetInfo().remaining) }}</div>
          <div class="text-xs text-success font-medium">{{ 100 - jcP.budgetPct }}% remaining</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">gauge</i>
            </div>
            <div class="text-sm font-medium text-foreground-60">Budget Health</div>
          </div>
          <div class="w-full mt-1">
            <modus-progress [value]="jcP.budgetPct" [max]="100" [className]="budgetProgressClass(jcP.budgetPct)" />
          </div>
          <div class="text-xs text-foreground-60">{{ jcP.budgetUsed }} of {{ jcP.budgetTotal }} used</div>
        </div>
      </div>
    </ng-template>

    <ng-template #budgetBreakdownRaw let-jcP="jcP">
      <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
        <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
          <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">bar_graph</i>
          <div class="text-base font-semibold text-foreground">Cost Breakdown</div>
        </div>
        <div class="px-5 py-5 flex flex-col gap-5">
          <div class="flex flex-col gap-2">
            <div class="flex w-full h-5 rounded-full overflow-hidden">
              @for (cat of jcDetailCategories(); track cat.label) {
                <div class="{{ cat.colorClass }}" [style.width.%]="cat.pctOfSpend"></div>
              }
            </div>
            <div class="flex items-center justify-between text-2xs text-foreground-40">
              <div>0%</div>
              <div>{{ formatJobCost(jcBudgetInfo().spent) }} total spend</div>
              <div>100%</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            @for (cat of jcDetailCategories(); track cat.label) {
              <div class="flex flex-col gap-3 p-4 bg-background border-default rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
                role="button" tabindex="0"
                (click)="openSubledger(cat.label)"
                (keydown.enter)="openSubledger(cat.label)"
                (mousedown)="$event.stopPropagation()">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                  <div class="text-xs text-foreground-60 uppercase tracking-wide font-semibold">{{ cat.label }}</div>
                </div>
                <div class="text-2xl font-bold text-foreground">{{ formatJobCost(cat.amount) }}</div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-60">% of spend</div>
                    <div class="font-semibold text-foreground">{{ cat.pctOfSpend }}%</div>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfSpend"></div>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-60">% of budget</div>
                    <div class="font-semibold text-foreground">{{ cat.pctOfBudget }}%</div>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfBudget"></div>
                  </div>
                </div>
                <div class="border-top-default pt-2 mt-1">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-40">Portfolio avg</div>
                    <div class="text-foreground-60">{{ cat.portfolioAvgPct }}%</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #budgetProfitFadeRaw let-jcP="jcP">
      @if (jcProfitFadeData(); as pf) {
      <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
        <div class="flex items-center justify-between px-5 py-4 border-bottom-default">
          <div class="flex items-center gap-2">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">trending_up</i>
            <div class="text-base font-semibold text-foreground">Profit Fade / Gain</div>
          </div>
          <div class="flex items-center gap-2">
            <div class="px-2.5 py-1 rounded-full text-xs font-semibold {{ pf.isFade ? 'bg-destructive-20 text-destructive' : 'bg-success-20 text-success' }}">
              {{ pf.isFade ? 'Fade' : 'Gain' }} {{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%
            </div>
          </div>
        </div>
        <div class="px-5 py-5 flex flex-col gap-5">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">Original Estimate</div>
              <div class="text-2xl font-bold text-foreground">{{ pf.originalMargin }}%</div>
              <div class="text-xs text-foreground-60">Bid margin</div>
            </div>
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">Current Projected</div>
              <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.currentMargin }}%</div>
              <div class="text-xs text-foreground-60">Based on costs to date</div>
            </div>
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">{{ pf.isFade ? 'Profit Fade' : 'Profit Gain' }}</div>
              <div class="flex items-center gap-2">
                <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'trending_down' : 'trending_up' }}</i>
                <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%</div>
              </div>
              <div class="text-xs text-foreground-60">{{ pf.isFade ? 'Below original estimate' : 'Above original estimate' }}</div>
            </div>
          </div>
          <div class="relative" style="padding-left:36px;padding-bottom:20px">
            <svg class="w-full" [attr.viewBox]="'0 0 ' + jcPfW + ' ' + jcPfH" preserveAspectRatio="none" style="height:160px">
              <defs>
                <linearGradient [attr.id]="'pfGradProjRaw' + projectId()" x1="0" y1="0" x2="0" y2="1">
                  @if (jcProfitFadeData()?.isFade) {
                    <stop offset="0%" class="pf-gradient-fade-end" />
                    <stop offset="100%" class="pf-gradient-fade-start" />
                  } @else {
                    <stop offset="0%" class="pf-gradient-gain-start" />
                    <stop offset="100%" class="pf-gradient-gain-end" />
                  }
                </linearGradient>
              </defs>
              @for (line of jcPfGridLines(); track line.y) {
                <line [attr.x1]="0" [attr.y1]="line.y" [attr.x2]="jcPfW" [attr.y2]="line.y" class="chart-grid-line" />
              }
              <line [attr.x1]="jcPfPadX" [attr.y1]="jcPfBaselineY()" [attr.x2]="jcPfW - jcPfPadX" [attr.y2]="jcPfBaselineY()" class="pf-baseline" />
              <path [attr.d]="jcPfAreaPath()" [attr.fill]="'url(#pfGradProjRaw' + projectId() + ')'" />
              <path [attr.d]="jcPfLinePath()" [class]="pf.isFade ? 'pf-line-fade' : 'pf-line-gain'" />
              @for (pt of jcPfChartPoints(); track pt.x) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" [class]="pf.isFade ? 'pf-dot-fade' : 'pf-dot-gain'" />
              }
            </svg>
            <div class="absolute bottom-0 left-9 right-0 text-2xs text-foreground-40" style="position:relative">
              @for (lbl of jcPfMonthLabels(); track lbl.pct) {
                <div class="absolute" [style.left.%]="lbl.pct" style="transform:translateX(-50%)">{{ lbl.text }}</div>
              }
            </div>
            <div class="absolute top-0 left-0 bottom-5 flex flex-col justify-between text-2xs text-foreground-40">
              @for (line of jcPfGridLines(); track line.y) {
                <div>{{ line.label }}</div>
              }
            </div>
            <div class="absolute text-2xs font-medium text-foreground-60" style="right:4px" [style.top.px]="jcPfBaselineY() - 14">
              Est. {{ pf.originalMargin }}%
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <div class="text-sm font-semibold text-foreground">Fade / Gain by Category</div>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
              @for (cf of jcPfCategoryFade(); track cf.label) {
                <div class="flex flex-col gap-2 p-3 bg-background border-default rounded-lg">
                  <div class="flex items-center gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full {{ cf.colorClass }} flex-shrink-0"></div>
                    <div class="text-xs text-foreground-60 font-medium">{{ cf.label }}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <i class="modus-icons text-sm {{ cf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ cf.isFade ? 'trending_down' : 'trending_up' }}</i>
                    <div class="text-sm font-bold {{ cf.isFade ? 'text-destructive' : 'text-success' }}">{{ cf.isFade ? '' : '+' }}{{ cf.fadeAmount }}%</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
      }
    </ng-template>

    <ng-template #budgetCostSummaryRaw let-jcP="jcP">
      <div class="bg-card border-default rounded-lg overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
          <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list</i>
          <div class="text-base font-semibold text-foreground">Cost Summary</div>
        </div>
        <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
          <div role="columnheader">Category</div>
          <div class="text-right" role="columnheader">Amount</div>
          <div class="text-right" role="columnheader">% of Spend</div>
          <div class="text-right" role="columnheader">% of Budget</div>
        </div>
        <div role="table" aria-label="Cost summary">
          @for (cat of jcDetailCategories(); track cat.label) {
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
              role="row" tabindex="0"
              (click)="openSubledger(cat.label)"
              (keydown.enter)="openSubledger(cat.label)"
              (mousedown)="$event.stopPropagation()">
              <div class="flex items-center gap-2" role="cell">
                <div class="w-2.5 h-2.5 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                <div class="text-sm font-medium text-primary">{{ cat.label }}</div>
                <i class="modus-icons text-xs text-foreground-40" aria-hidden="true">chevron_right</i>
              </div>
              <div class="text-sm font-semibold text-foreground text-right" role="cell">{{ formatJobCost(cat.amount) }}</div>
              <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfSpend }}%</div>
              <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfBudget }}%</div>
            </div>
          }
          <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted items-center" role="row">
            <div class="text-sm font-bold text-foreground" role="cell">Total</div>
            <div class="text-sm font-bold text-foreground text-right" role="cell">{{ formatJobCost(jcBudgetInfo().spent) }}</div>
            <div class="text-sm font-bold text-foreground text-right" role="cell">100%</div>
            <div class="text-sm font-bold text-foreground text-right" role="cell">{{ jcP.budgetPct }}%</div>
          </div>
        </div>
      </div>
    </ng-template>

    <ng-template #budgetBreakdownContent let-jcP="jcP">
      <app-widget-frame icon="bar_graph" title="Cost Breakdown"
        [isSelected]="selectedWidgetId() === 'tile-budget-breakdown'" [isMobile]="isMobile()"
        (headerMouseDown)="onBudgetTileMouseDown('tile-budget-breakdown', $event)"
        (resizeStart)="onBudgetTileResizeStart('tile-budget-breakdown', $event)">
        <div class="p-5 flex flex-col gap-5 overflow-y-auto flex-1">
          <div class="flex flex-col gap-2">
            <div class="flex w-full h-5 rounded-full overflow-hidden">
              @for (cat of jcDetailCategories(); track cat.label) {
                <div class="{{ cat.colorClass }}" [style.width.%]="cat.pctOfSpend"></div>
              }
            </div>
            <div class="flex items-center justify-between text-2xs text-foreground-40">
              <div>0%</div>
              <div>{{ formatJobCost(jcBudgetInfo().spent) }} total spend</div>
              <div>100%</div>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            @for (cat of jcDetailCategories(); track cat.label) {
              <div class="flex flex-col gap-3 p-4 bg-background border-default rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
                role="button" tabindex="0"
                (click)="openSubledger(cat.label)"
                (keydown.enter)="openSubledger(cat.label)"
                (mousedown)="$event.stopPropagation()">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                  <div class="text-xs text-foreground-60 uppercase tracking-wide font-semibold">{{ cat.label }}</div>
                </div>
                <div class="text-2xl font-bold text-foreground">{{ formatJobCost(cat.amount) }}</div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-60">% of spend</div>
                    <div class="font-semibold text-foreground">{{ cat.pctOfSpend }}%</div>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfSpend"></div>
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-60">% of budget</div>
                    <div class="font-semibold text-foreground">{{ cat.pctOfBudget }}%</div>
                  </div>
                  <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfBudget"></div>
                  </div>
                </div>
                <div class="border-top-default pt-2 mt-1">
                  <div class="flex items-center justify-between text-xs">
                    <div class="text-foreground-40">Portfolio avg</div>
                    <div class="text-foreground-60">{{ cat.portfolioAvgPct }}%</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </app-widget-frame>
    </ng-template>

    <ng-template #budgetProfitFadeContent let-jcP="jcP">
      @if (jcProfitFadeData(); as pf) {
      <app-widget-frame icon="trending_up" title="Profit Fade / Gain"
        [isSelected]="selectedWidgetId() === 'tile-budget-profitfade'" [isMobile]="isMobile()"
        (headerMouseDown)="onBudgetTileMouseDown('tile-budget-profitfade', $event)"
        (resizeStart)="onBudgetTileResizeStart('tile-budget-profitfade', $event)">
        <div class="px-2.5 py-1 rounded-full text-xs font-semibold {{ pf.isFade ? 'bg-destructive-20 text-destructive' : 'bg-success-20 text-success' }}" headerMeta>
          {{ pf.isFade ? 'Fade' : 'Gain' }} {{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%
        </div>
        <div class="p-5 flex flex-col gap-5 overflow-y-auto flex-1">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">Original Estimate</div>
              <div class="text-2xl font-bold text-foreground">{{ pf.originalMargin }}%</div>
              <div class="text-xs text-foreground-60">Bid margin</div>
            </div>
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">Current Projected</div>
              <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.currentMargin }}%</div>
              <div class="text-xs text-foreground-60">Based on costs to date</div>
            </div>
            <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
              <div class="text-xs text-foreground-40 uppercase tracking-wide">{{ pf.isFade ? 'Profit Fade' : 'Profit Gain' }}</div>
              <div class="flex items-center gap-2">
                <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'trending_down' : 'trending_up' }}</i>
                <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%</div>
              </div>
              <div class="text-xs text-foreground-60">{{ pf.isFade ? 'Below original estimate' : 'Above original estimate' }}</div>
            </div>
          </div>
          <div class="relative" style="padding-left:36px;padding-bottom:20px">
            <svg class="w-full" [attr.viewBox]="'0 0 ' + jcPfW + ' ' + jcPfH" preserveAspectRatio="none" style="height:160px">
              <defs>
                <linearGradient [attr.id]="'pfGradProj' + projectId()" x1="0" y1="0" x2="0" y2="1">
                  @if (jcProfitFadeData()?.isFade) {
                    <stop offset="0%" class="pf-gradient-fade-end" />
                    <stop offset="100%" class="pf-gradient-fade-start" />
                  } @else {
                    <stop offset="0%" class="pf-gradient-gain-start" />
                    <stop offset="100%" class="pf-gradient-gain-end" />
                  }
                </linearGradient>
              </defs>
              @for (line of jcPfGridLines(); track line.y) {
                <line [attr.x1]="0" [attr.y1]="line.y" [attr.x2]="jcPfW" [attr.y2]="line.y" class="chart-grid-line" />
              }
              <line [attr.x1]="jcPfPadX" [attr.y1]="jcPfBaselineY()" [attr.x2]="jcPfW - jcPfPadX" [attr.y2]="jcPfBaselineY()" class="pf-baseline" />
              <path [attr.d]="jcPfAreaPath()" [attr.fill]="'url(#pfGradProj' + projectId() + ')'" />
              <path [attr.d]="jcPfLinePath()" [class]="pf.isFade ? 'pf-line-fade' : 'pf-line-gain'" />
              @for (pt of jcPfChartPoints(); track pt.x) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" [class]="pf.isFade ? 'pf-dot-fade' : 'pf-dot-gain'" />
              }
            </svg>
            <div class="absolute bottom-0 left-9 right-0 text-2xs text-foreground-40" style="position:relative">
              @for (lbl of jcPfMonthLabels(); track lbl.pct) {
                <div class="absolute" [style.left.%]="lbl.pct" style="transform:translateX(-50%)">{{ lbl.text }}</div>
              }
            </div>
            <div class="absolute top-0 left-0 bottom-5 flex flex-col justify-between text-2xs text-foreground-40">
              @for (line of jcPfGridLines(); track line.y) {
                <div>{{ line.label }}</div>
              }
            </div>
            <div class="absolute text-2xs font-medium text-foreground-60" style="right:4px" [style.top.px]="jcPfBaselineY() - 14">
              Est. {{ pf.originalMargin }}%
            </div>
          </div>
          <div class="flex flex-col gap-3">
            <div class="text-sm font-semibold text-foreground">Fade / Gain by Category</div>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
              @for (cf of jcPfCategoryFade(); track cf.label) {
                <div class="flex flex-col gap-2 p-3 bg-background border-default rounded-lg">
                  <div class="flex items-center gap-1.5">
                    <div class="w-2.5 h-2.5 rounded-full {{ cf.colorClass }} flex-shrink-0"></div>
                    <div class="text-xs text-foreground-60 font-medium">{{ cf.label }}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <i class="modus-icons text-sm {{ cf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ cf.isFade ? 'trending_down' : 'trending_up' }}</i>
                    <div class="text-sm font-bold {{ cf.isFade ? 'text-destructive' : 'text-success' }}">{{ cf.isFade ? '' : '+' }}{{ cf.fadeAmount }}%</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </app-widget-frame>
      }
    </ng-template>

    <ng-template #budgetCostSummaryContent let-jcP="jcP">
      <app-widget-frame icon="list" title="Cost Summary"
        [isSelected]="selectedWidgetId() === 'tile-budget-costsummary'" [isMobile]="isMobile()"
        (headerMouseDown)="onBudgetTileMouseDown('tile-budget-costsummary', $event)"
        (resizeStart)="onBudgetTileResizeStart('tile-budget-costsummary', $event)">
        <div class="overflow-y-auto flex-1">
          <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
            <div role="columnheader">Category</div>
            <div class="text-right" role="columnheader">Amount</div>
            <div class="text-right" role="columnheader">% of Spend</div>
            <div class="text-right" role="columnheader">% of Budget</div>
          </div>
          <div role="table" aria-label="Cost summary">
            @for (cat of jcDetailCategories(); track cat.label) {
              <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                role="row" tabindex="0"
                (click)="openSubledger(cat.label)"
                (keydown.enter)="openSubledger(cat.label)"
                (mousedown)="$event.stopPropagation()">
                <div class="flex items-center gap-2" role="cell">
                  <div class="w-2.5 h-2.5 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                  <div class="text-sm font-medium text-primary">{{ cat.label }}</div>
                  <i class="modus-icons text-xs text-foreground-40" aria-hidden="true">chevron_right</i>
                </div>
                <div class="text-sm font-semibold text-foreground text-right" role="cell">{{ formatJobCost(cat.amount) }}</div>
                <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfSpend }}%</div>
                <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfBudget }}%</div>
              </div>
            }
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted items-center" role="row">
              <div class="text-sm font-bold text-foreground" role="cell">Total</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">{{ formatJobCost(jcBudgetInfo().spent) }}</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">100%</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">{{ jcP.budgetPct }}%</div>
            </div>
          </div>
        </div>
      </app-widget-frame>
    </ng-template>
  `,
})
export class ProjectDashboardComponent implements OnInit, AfterViewInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly canvasResetService = inject(CanvasResetService);
  readonly widgetFocusService = inject(WidgetFocusService);
  private readonly aiService = inject(AiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  readonly projectData = input.required<ProjectDashboardData>();
  readonly projectId = input<number>(1);

  private static readonly PROJ_HEADER_HEIGHT = 140;
  private static readonly PROJ_HEADER_OFFSET = ProjectDashboardComponent.PROJ_HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['projHeader', 'milestones', 'tasks', 'risks', 'rfis', 'submittals', 'drawing', 'budget', 'team', 'activity'],
    layoutStorageKey: () => `project-${this.projectId()}-v2`,
    canvasStorageKey: () => `canvas-layout:project-${this.projectId()}:v3`,
    defaultColStarts: { projHeader: 1, milestones: 1, tasks: 1, risks: 1, rfis: 1, submittals: 1, drawing: 12, budget: 12, team: 12, activity: 12 },
    defaultColSpans: { projHeader: 16, milestones: 11, tasks: 11, risks: 11, rfis: 11, submittals: 11, drawing: 5, budget: 5, team: 5, activity: 5 },
    defaultTops: { projHeader: 0, milestones: 0, tasks: 536, risks: 952, rfis: 1318, submittals: 1658, drawing: 0, budget: 436, team: 902, activity: 1318 },
    defaultHeights: { projHeader: 0, milestones: 520, tasks: 400, risks: 350, rfis: 324, submittals: 324, drawing: 420, budget: 450, team: 400, activity: 350 },
    defaultLefts: { projHeader: 0, milestones: 0, tasks: 0, risks: 0, rfis: 0, submittals: 0, drawing: 891, budget: 891, team: 891, activity: 891 },
    defaultPixelWidths: { projHeader: 1280, milestones: 875, tasks: 875, risks: 875, rfis: 875, submittals: 875, drawing: 389, budget: 389, team: 389, activity: 389 },
    canvasDefaultLefts: { projHeader: 0, milestones: 0, tasks: 0, risks: 0, rfis: 0, submittals: 0, drawing: 891, budget: 891, team: 891, activity: 891 },
    canvasDefaultPixelWidths: { projHeader: 1280, milestones: 875, tasks: 875, risks: 875, rfis: 875, submittals: 875, drawing: 389, budget: 389, team: 389, activity: 389 },
    canvasDefaultTops: {
      projHeader: 0,
      milestones: ProjectDashboardComponent.PROJ_HEADER_OFFSET,
      tasks: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 536,
      risks: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 952,
      rfis: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1318,
      submittals: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1658,
      drawing: ProjectDashboardComponent.PROJ_HEADER_OFFSET,
      budget: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 436,
      team: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 902,
      activity: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1318,
    },
    canvasDefaultHeights: { projHeader: ProjectDashboardComponent.PROJ_HEADER_HEIGHT, milestones: 520, tasks: 400, risks: 350, rfis: 324, submittals: 324, drawing: 420, budget: 450, team: 400, activity: 350 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    this.engine.destroy();
    this.ai.destroy();
  });
  private readonly _lockProjHeader = (() => {
    this.engine.widgetLocked.update(l => ({ ...l, projHeader: true }));
  })();

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.engine.widgetLocked.update(l => ({ ...l, projHeader: true }));
      });
    }
  });

  private readonly _saveDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.saveDefaultsTick();
    if (tick > 0) {
      untracked(() => this.engine.saveAsDefaultLayout());
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
  readonly wLocked = this.engine.widgetLocked;
  readonly wColStarts = this.engine.widgetColStarts;
  readonly wColSpans = this.engine.widgetColSpans;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly mobileGridHeight = computed(() => this.engine.mobileGridHeight());
  readonly desktopGridMinHeight = this.engine.canvasGridMinHeight;

  // --- Subpage tile canvas (tiles become widgets in canvas mode) ---
  private static readonly TILE_SUBNAV_EXPANDED = 227;
  private static readonly TILE_SUBNAV_COLLAPSED = 32;
  private static readonly TILE_TOOLBAR_HEIGHT = 56;
  private static readonly TILE_TITLE_HEIGHT = 40;
  private static readonly TILE_CHROME_GAP = 16;
  private static readonly TILE_CANVAS_TOTAL = 1280;
  private static readonly TILE_CONTENT_TOP = ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_TITLE_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP * 2;

  readonly tileSubnavWidth = computed(() =>
    this.sideSubNavCollapsed() ? ProjectDashboardComponent.TILE_SUBNAV_COLLAPSED : ProjectDashboardComponent.TILE_SUBNAV_EXPANDED
  );
  readonly tileContentLeft = computed(() =>
    this.tileSubnavWidth() + ProjectDashboardComponent.TILE_CHROME_GAP
  );
  readonly tileContentWidth = computed(() =>
    ProjectDashboardComponent.TILE_CANVAS_TOTAL - this.tileContentLeft()
  );

  readonly tileCanvas = new SubpageTileCanvas({
    storageKey: () => `tile-canvas:project-${this.projectId()}:${this.activeNavItem()}:${this.activeSubpage()}:v2`,
    lockedIds: ['tc-subnav', 'tc-toolbar', 'tc-title', 'tc-list'],
    tileWidth: 308,
    tileHeight: 260,
    columns: 4,
    gap: 16,
    offsetTop: ProjectDashboardComponent.TILE_CONTENT_TOP,
    offsetLeft: ProjectDashboardComponent.TILE_SUBNAV_EXPANDED + ProjectDashboardComponent.TILE_CHROME_GAP,
    detailWidth: 875,
    detailHeight: 1000,
  });

  readonly activeSubpage = computed(() => {
    const nav = this.activeNavItem();
    if (nav === 'records') return this.activeRecordsPage();
    if (nav === 'financials') return this.activeFinancialsPage();
    return nav;
  });

  readonly isSubpageCanvasActive = computed(() => {
    if (!this.isCanvas()) return false;
    const nav = this.activeNavItem();
    return nav !== 'dashboard';
  });

  readonly budgetTileIds: string[] = ['tile-budget-breakdown', 'tile-budget-profitfade', 'tile-budget-costsummary'];

  readonly subpageTileIds = computed<string[]>(() => {
    const nav = this.activeNavItem();
    if (nav === 'drawings') return this.drawingTiles().map(d => `tile-drawing-${d.id}`);
    if (nav === 'records') {
      const sub = this.activeRecordsPage();
      if (sub === 'rfis') return this.projectRfis().map(r => `tile-rfi-${r.id}`);
      if (sub === 'submittals') return this.projectSubmittals().map(s => `tile-sub-${s.id}`);
    }
    if (nav === 'financials') {
      const sub = this.activeFinancialsPage();
      if (sub === 'budget' && this.projectJobCost()) {
        if (this.subledgerCategory()) return ['tile-subledger-ledger'];
        return this.budgetTileIds;
      }
    }
    return [];
  });

  readonly tilePos = this.tileCanvas.positions;
  readonly tileZ = this.tileCanvas.zIndices;
  readonly tileLocked = this.tileCanvas.locked;
  readonly tileMoveTargetId = this.tileCanvas.moveTargetId;
  readonly tileCanvasMinHeight = this.tileCanvas.canvasMinHeight;
  readonly tileDetailViews = this.tileCanvas.detailViews;
  readonly hasTileDetails = this.tileCanvas.hasDetails;
  readonly tileInteractingId = signal<string | null>(null);
  readonly tileHeaderStatusOpen = signal<string | null>(null);

  toggleTileHeaderStatus(tileId: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.tileHeaderStatusOpen.update(v => v === tileId ? null : tileId);
  }

  onTileHeaderStatusSelect(tileId: string, newStatus: string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.tileHeaderStatusOpen.set(null);
    this.onTileDetailStatusChange(tileId, newStatus);
  }

  navigateToRfiFromTile(rfi: Rfi, tileId: string): void {
    this.navigateToItemFromTile('rfi', rfi, tileId);
  }

  navigateToSubFromTile(sub: Submittal, tileId: string): void {
    this.navigateToItemFromTile('submittal', sub, tileId);
  }

  private navigateToItemFromTile(type: 'rfi' | 'submittal', item: Rfi | Submittal, tileId: string): void {
    this.tileCanvas.openDetail(tileId, { type, item } as TileDetailView);
    this.widgetFocusService.selectWidget(tileId);
  }

  selectTileWidget(tileId: string): void {
    this.widgetFocusService.selectWidget(tileId);
  }

  closeTileDetail(tileId: string): void {
    this.tileCanvas.closeDetail(tileId);
  }

  onTileDetailHeaderMouseDown(event: MouseEvent, tileId: string): void {
    event.preventDefault();
    this.tileInteractingId.set(tileId);
    this.widgetFocusService.selectWidget(tileId);
    this.tileCanvas.onTileMouseDown(tileId, event);
  }

  updateTileDetailField(tileId: string, field: string, value: string): void {
    const current = this.tileDetailViews()[tileId];
    if (!current) return;
    const updated = { ...(current.item as Record<string, unknown>), [field]: value };
    this.tileCanvas.updateDetailItem(tileId, updated);
  }

  onTileDetailStatusChange(tileId: string, newStatus: string): void { this.updateTileDetailField(tileId, 'status', newStatus); }
  onTileDetailAssigneeChange(tileId: string, newAssignee: string): void { this.updateTileDetailField(tileId, 'assignee', newAssignee); }
  onTileDetailDueDateChange(tileId: string, newDate: string): void { this.updateTileDetailField(tileId, 'dueDate', newDate); }

  private readonly _tileCanvasEffect = effect(() => {
    if (!this.isSubpageCanvasActive()) return;
    const tileIds = this.subpageTileIds();
    const nav = this.activeNavItem();
    const viewMode = this.subnavViewMode();
    const hasSideNav = nav === 'records' || nav === 'financials';
    const contentLeft = hasSideNav ? this.tileContentLeft() : 0;
    const contentWidth = hasSideNav ? this.tileContentWidth() : ProjectDashboardComponent.TILE_CANVAS_TOTAL;
    const subnavW = this.tileSubnavWidth();

    const lockedRects: Record<string, TileRect> = {
      'tc-toolbar': { top: 0, left: contentLeft, width: contentWidth, height: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT },
      'tc-title': { top: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP, left: contentLeft, width: contentWidth, height: ProjectDashboardComponent.TILE_TITLE_HEIGHT },
    };

    if (hasSideNav) {
      lockedRects['tc-subnav'] = { top: 0, left: 0, width: subnavW, height: 600 };
    }

    if (viewMode === 'list') {
      const itemCount = tileIds.length;
      const listHeight = Math.min(40 + itemCount * 45, 600);
      lockedRects['tc-list'] = {
        top: ProjectDashboardComponent.TILE_CONTENT_TOP,
        left: contentLeft,
        width: contentWidth,
        height: listHeight,
      };
    }

    untracked(() => {
      const oldOffsetLeft = this.tileCanvas.config.offsetLeft;
      const deltaX = contentLeft - oldOffsetLeft;

      if (deltaX !== 0) {
        const pos = this.tileCanvas.positions();
        const lockedSet = new Set(this.tileCanvas.config.lockedIds);
        const shifted: Record<string, TileRect> = {};
        for (const [id, rect] of Object.entries(pos)) {
          if (!lockedSet.has(id)) {
            shifted[id] = { ...rect, left: rect.left + deltaX };
          }
        }
        if (Object.keys(shifted).length > 0) {
          this.tileCanvas.positions.update(p => {
            const next = { ...p };
            for (const [id, rect] of Object.entries(shifted)) {
              next[id] = rect;
            }
            return next;
          });
        }
      }

      this.tileCanvas.config.offsetLeft = contentLeft;
      this.tileCanvas.config.offsetTop = viewMode === 'list'
        ? ProjectDashboardComponent.TILE_CONTENT_TOP + Math.min(40 + tileIds.length * 45, 600) + this.tileCanvas.config.gap
        : ProjectDashboardComponent.TILE_CONTENT_TOP;

      const isSubledger = nav === 'financials' && this.activeFinancialsPage() === 'budget' && !!this.subledgerCategory();
      const isBudget = nav === 'financials' && this.activeFinancialsPage() === 'budget' && !this.subledgerCategory();

      if (isSubledger) {
        const headerTop = ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP;
        const headerH = 180;
        lockedRects['tc-subledger-header'] = { top: headerTop, left: contentLeft, width: contentWidth, height: headerH };
        this.tileCanvas.config.offsetTop = headerTop + headerH + ProjectDashboardComponent.TILE_CHROME_GAP;
        this.tileCanvas.config.tileSizeOverrides = {
          'tile-subledger-ledger': { width: contentWidth, height: 600, columns: 4 },
        };
        this.tileCanvas.config.heightOnlyResizeIds = new Set(['tile-subledger-ledger']);
      } else if (isBudget) {
        const kpiTop = ProjectDashboardComponent.TILE_CONTENT_TOP;
        const kpiH = 150;
        lockedRects['tile-budget-kpis'] = { top: kpiTop, left: contentLeft, width: contentWidth, height: kpiH };
        this.tileCanvas.config.offsetTop = kpiTop + kpiH + 16;
        const halfW = Math.floor((contentWidth - 16) / 2);
        this.tileCanvas.config.tileSizeOverrides = {
          'tile-budget-breakdown':   { width: contentWidth, height: 500, columns: 4 },
          'tile-budget-profitfade':  { width: halfW, height: 600, columns: 2 },
          'tile-budget-costsummary': { width: halfW, height: 600, columns: 2 },
        };
      } else {
        this.tileCanvas.config.tileSizeOverrides = undefined;
        this.tileCanvas.config.heightOnlyResizeIds = undefined;
      }

      this.tileCanvas.setTiles(tileIds, lockedRects);
    });
  });

  private readonly _registerTileWidgetsEffect = effect(() => {
    const drawings = this.drawingTiles();
    const rfis = this.projectRfis();
    const subs = this.projectSubmittals();

    const regs: Record<string, { name: string; suggestions: string[] }> = {};
    for (const d of drawings) {
      regs[`tile-drawing-${d.id}`] = {
        name: d.title,
        suggestions: [`Show details for ${d.title}`, `What revision is ${d.title}?`, 'Compare drawing revisions'],
      };
    }
    for (const r of rfis) {
      regs[`tile-rfi-${r.id}`] = {
        name: `${r.number}: ${r.subject}`,
        suggestions: [`What is the status of ${r.number}?`, `Who is assigned to ${r.number}?`, `When is ${r.number} due?`],
      };
    }
    for (const s of subs) {
      regs[`tile-sub-${s.id}`] = {
        name: `${s.number}: ${s.subject}`,
        suggestions: [`What is the status of ${s.number}?`, `Who is assigned to ${s.number}?`, `When is ${s.number} due?`],
      };
    }

    regs['tile-budget-breakdown'] = { name: 'Cost Breakdown', suggestions: ['Which cost category is largest?', 'Show cost distribution'] };
    regs['tile-budget-profitfade'] = { name: 'Profit Fade / Gain', suggestions: ['Is the project on budget?', 'Show profit trend'] };
    regs['tile-budget-costsummary'] = { name: 'Cost Summary', suggestions: ['Summarize costs by category', 'Compare spend to budget'] };

    untracked(() => this.widgetFocusService.registerWidgets(regs));
  });

  readonly panning = new CanvasPanning(() => this.isCanvas());

  private _canvasWheelEl: HTMLElement | null = null;
  private _canvasWheelHandler: ((e: WheelEvent) => void) | null = null;
  private readonly _canvasWheelEffect = effect(() => {
    const el = this.canvasHostRef()?.nativeElement as HTMLElement | undefined;
    if (this._canvasWheelEl && this._canvasWheelHandler) {
      this._canvasWheelEl.removeEventListener('wheel', this._canvasWheelHandler);
      this._canvasWheelEl = null;
      this._canvasWheelHandler = null;
    }
    if (!el) return;
    const handler = (e: WheelEvent) => this.panning.onCanvasWheel(e);
    el.addEventListener('wheel', handler, { passive: false });
    this._canvasWheelEl = el;
    this._canvasWheelHandler = handler;
    this.destroyRef.onDestroy(() => el.removeEventListener('wheel', handler));
  });

  readonly searchInputOpen = signal(false);
  readonly navExpanded = signal(false);
  readonly activeNavItem = signal<string>('dashboard');
  readonly resetMenuOpen = signal(false);
  readonly hasSubNav = computed(() => {
    const page = this.activeNavItem();
    return page === 'records' || page === 'financials';
  });

  readonly detailHasSubNav = computed(() => {
    if (!this.detailView()) return false;
    const page = this.activeNavItem();
    return page === 'records' || page === 'financials';
  });

  readonly sideNavItems = SIDE_NAV_ITEMS;

  readonly subnavSearch = signal('');
  readonly subnavViewMode = signal<string>('grid');

  readonly recordsSubNavItems = RECORDS_SUB_NAV_ITEMS;
  readonly sideSubNavCollapsed = signal(false);
  readonly activeRecordsPage = signal('daily-reports');
  readonly activeRecordsPageLabel = computed(() => {
    const item = this.recordsSubNavItems.find(i => i.value === this.activeRecordsPage());
    return item?.label ?? 'Daily Reports';
  });
  readonly activeRecordsPageDescription = computed(() =>
    RECORDS_PAGE_DESCRIPTIONS[this.activeRecordsPage()] ?? ''
  );

  readonly financialsSubNavItems = FINANCIALS_SUB_NAV_ITEMS;
  readonly activeFinancialsPage = signal('budget');
  readonly activeFinancialsPageLabel = computed(() => {
    const item = this.financialsSubNavItems.find(i => i.value === this.activeFinancialsPage());
    return item?.label ?? 'Budget';
  });
  readonly activeFinancialsPageDescription = computed(() =>
    FINANCIALS_PAGE_DESCRIPTIONS[this.activeFinancialsPage()] ?? ''
  );

  readonly weatherForecast = WEATHER_FORECAST;

  private static readonly RECORDS_PAGES_WITH_CONTENT = new Set(['rfis', 'submittals', 'daily-reports', 'punch-items', 'inspections', 'action-items']);
  private static readonly FINANCIALS_PAGES_WITH_CONTENT = new Set(['budget', 'change-order-requests', 'applications-for-payment', 'cost-forecasts']);

  readonly recordsSubPageHasContent = computed(() =>
    ProjectDashboardComponent.RECORDS_PAGES_WITH_CONTENT.has(this.activeRecordsPage())
  );

  readonly financialsSubPageHasContent = computed(() =>
    ProjectDashboardComponent.FINANCIALS_PAGES_WITH_CONTENT.has(this.activeFinancialsPage())
  );

  readonly budgetProgressClass = budgetProgressClass;

  readonly projectJobCost = computed<ProjectJobCost | null>(() => {
    const costs = getProjectJobCosts();
    return costs.find(c => c.projectId === this.projectId()) ?? null;
  });

  readonly jcDetailCategories = computed(() => {
    const p = this.projectJobCost();
    if (!p) return [];
    const totalSpend = JOB_COST_CATEGORIES.reduce((sum, cat) => sum + p.costs[cat], 0);
    const summary = getJobCostSummary();
    return JOB_COST_CATEGORIES.map(cat => {
      const amount = p.costs[cat];
      const pctOfSpend = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
      const budgetTotal = parseFloat(p.budgetTotal.replace(/[^0-9.]/g, '')) * (p.budgetTotal.includes('M') ? 1_000_000 : p.budgetTotal.includes('K') ? 1_000 : 1);
      const pctOfBudget = budgetTotal > 0 ? Math.round((amount / budgetTotal) * 100) : 0;
      const portfolioAvg = summary.categories.find(c => c.label === cat)?.pct ?? 0;
      return {
        label: cat,
        amount,
        pctOfSpend,
        pctOfBudget,
        portfolioAvgPct: portfolioAvg,
        colorClass: CATEGORY_COLORS[cat],
      };
    });
  });

  readonly jcBudgetInfo = computed(() => {
    const p = this.projectJobCost();
    if (!p) return { total: 0, spent: 0, remaining: 0, pct: 0 };
    const totalSpend = JOB_COST_CATEGORIES.reduce((sum, cat) => sum + p.costs[cat], 0);
    const budgetTotal = parseFloat(p.budgetTotal.replace(/[^0-9.]/g, '')) * (p.budgetTotal.includes('M') ? 1_000_000 : p.budgetTotal.includes('K') ? 1_000 : 1);
    return { total: budgetTotal, spent: totalSpend, remaining: budgetTotal - totalSpend, pct: p.budgetPct };
  });

  readonly jcPfW = 500;
  readonly jcPfH = 160;
  readonly jcPfPadX = 10;
  readonly jcPfPadY = 10;

  readonly jcProfitFadeData = computed(() => {
    const p = this.projectJobCost();
    if (!p) return null;
    const seed = p.projectId * 7 + 3;
    const rng = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 4973) * 49297;
      return x - Math.floor(x);
    };
    const originalMargin = 15 + (seed % 8);
    const budgetPressure = p.budgetPct > 80 ? -1 : p.budgetPct > 65 ? -0.3 : 0.5;
    const monthCount = Math.min(12, Math.max(6, Math.floor(p.budgetPct / 10) + 2));
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const points: { month: string; margin: number }[] = [];
    let margin = originalMargin;
    for (let i = 0; i < monthCount; i++) {
      const jitter = (rng(i) - 0.45) * 2.5;
      const drift = budgetPressure * 0.6;
      margin = margin + drift + jitter;
      margin = Math.max(0, Math.min(35, margin));
      points.push({ month: months[i % months.length], margin: Math.round(margin * 10) / 10 });
    }
    const currentMargin = points[points.length - 1].margin;
    const fadeGain = Math.round((currentMargin - originalMargin) * 10) / 10;
    return { originalMargin, currentMargin, fadeGain, isFade: fadeGain < 0, points };
  });

  readonly jcPfChartPoints = computed(() => {
    const d = this.jcProfitFadeData();
    if (!d || d.points.length === 0) return [];
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const w = this.jcPfW - this.jcPfPadX * 2;
    const h = this.jcPfH - this.jcPfPadY * 2;
    return d.points.map((p, i) => ({
      x: this.jcPfPadX + (d.points.length > 1 ? (i / (d.points.length - 1)) * w : w / 2),
      y: this.jcPfPadY + h - ((p.margin - minV) / range) * h,
    }));
  });

  readonly jcPfBaselineY = computed(() => {
    const d = this.jcProfitFadeData();
    if (!d || d.points.length === 0) return this.jcPfH / 2;
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const h = this.jcPfH - this.jcPfPadY * 2;
    return this.jcPfPadY + h - ((d.originalMargin - minV) / range) * h;
  });

  readonly jcPfLinePath = computed(() => {
    const pts = this.jcPfChartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  });

  readonly jcPfAreaPath = computed(() => {
    const pts = this.jcPfChartPoints();
    const baseY = this.jcPfBaselineY();
    if (pts.length === 0) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `${line} L${pts[pts.length - 1].x},${baseY} L${pts[0].x},${baseY} Z`;
  });

  readonly jcPfGridLines = computed(() => {
    const d = this.jcProfitFadeData();
    if (!d || d.points.length === 0) return [];
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const h = this.jcPfH - this.jcPfPadY * 2;
    const steps = 4;
    const lines: { y: number; label: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const val = minV + (range * (steps - i)) / steps;
      lines.push({ y: this.jcPfPadY + (i / steps) * h, label: `${val.toFixed(0)}%` });
    }
    return lines;
  });

  readonly jcPfMonthLabels = computed(() => {
    const d = this.jcProfitFadeData();
    if (!d || d.points.length === 0) return [];
    return d.points.map((p, i) => ({
      text: p.month,
      pct: d.points.length > 1 ? (i / (d.points.length - 1)) * 100 : 50,
    }));
  });

  readonly jcPfCategoryFade = computed(() => {
    const p = this.projectJobCost();
    const d = this.jcProfitFadeData();
    if (!p || !d) return [];
    const seed = p.projectId * 13 + 5;
    const rng = (i: number) => {
      const x = Math.sin(seed * 7919 + i * 6271) * 39979;
      return x - Math.floor(x);
    };
    const totalFade = d.fadeGain;
    const weights = JOB_COST_CATEGORIES.map((_, i) => 0.5 + rng(i));
    const wSum = weights.reduce((a, b) => a + b, 0);
    return JOB_COST_CATEGORIES.map((cat, i) => {
      const share = (weights[i] / wSum) * totalFade;
      return {
        label: cat,
        colorClass: CATEGORY_COLORS[cat],
        fadeAmount: Math.round(share * 10) / 10,
        isFade: share < 0,
      };
    });
  });

  formatJobCost(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }

  readonly subledgerCategory = signal<JobCostCategory | null>(null);

  readonly subledgerColorClass = computed(() => {
    const cat = this.subledgerCategory();
    return cat ? CATEGORY_COLORS[cat] : '';
  });

  readonly subledgerTransactions = computed(() => {
    const cat = this.subledgerCategory();
    if (!cat) return [];
    return getSubledger(this.projectId(), cat);
  });

  readonly subledgerTotal = computed(() => {
    const txs = this.subledgerTransactions();
    return txs.length > 0 ? txs[txs.length - 1].runningTotal : 0;
  });

  readonly subledgerDateRange = computed(() => {
    const txs = this.subledgerTransactions();
    if (txs.length === 0) return '';
    return `${txs[0].date} to ${txs[txs.length - 1].date}`;
  });

  readonly subledgerDropdownOpen = signal(false);
  readonly subledgerCategoryOptions = computed(() => [...JOB_COST_CATEGORIES]);

  getCategoryColor(cat: string): string {
    return CATEGORY_COLORS[cat as JobCostCategory] ?? '';
  }

  onBudgetTileMouseDown(id: string, event: MouseEvent): void {
    this.widgetFocusService.selectWidget(id);
    this.tileCanvas.onTileMouseDown(id, event);
  }

  onBudgetTileResizeStart(id: string, event: MouseEvent): void {
    this.tileCanvas.onTileResizeMouseDown(id, event);
  }

  onSubledgerLedgerResizeStart(event: MouseEvent): void {
    this.tileCanvas.onTileResizeMouseDown('tile-subledger-ledger', event);
  }

  closeSubledger(): void {
    this.subledgerCategory.set(null);
    this.pushPageUrl();
  }

  openSubledger(category: string): void {
    this.subledgerCategory.set(category as JobCostCategory);
    this.subledgerDropdownOpen.set(false);
    if (this.isCanvas()) this.panning.resetView();
    this.pushPageUrl();
  }

  switchSubledger(category: string): void {
    this.subledgerCategory.set(category as JobCostCategory);
    this.subledgerDropdownOpen.set(false);
    if (this.isCanvas()) this.panning.resetView();
    this.pushPageUrl();
  }

  readonly drawingTiles = computed(() =>
    ALL_DRAWINGS_BY_PROJECT[this.projectId()] ?? ALL_DRAWINGS_BY_PROJECT[1]
  );

  readonly newestDrawingTile = computed(() => this.drawingTiles()[0]);

  readonly subnavConfigs = SUBNAV_CONFIGS;

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');
  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly canvasHostRef = viewChild<ElementRef>('canvasHost');

  readonly widgets: ProjectWidgetId[] = ['milestones', 'tasks', 'risks', 'rfis', 'submittals', 'drawing', 'budget', 'team', 'activity'];
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

  readonly projectRfis = computed(() =>
    RFIS.filter(r => r.project === this.projectName())
  );

  readonly rfiOverdueCount = computed(() =>
    this.projectRfis().filter(r => r.status === 'overdue').length
  );

  readonly projectSubmittals = computed(() =>
    SUBMITTALS.filter(s => s.project === this.projectName())
  );

  readonly submittalOverdueCount = computed(() =>
    this.projectSubmittals().filter(s => s.status === 'overdue').length
  );

  readonly projectDailyReports = computed(() =>
    DAILY_REPORTS.filter(r => r.projectId === this.projectId())
  );

  readonly projectInspections = computed(() =>
    INSPECTIONS.filter(i => i.projectId === this.projectId())
  );

  readonly projectPunchItems = computed(() =>
    PUNCH_LIST_ITEMS.filter(p => p.projectId === this.projectId())
  );

  readonly projectAttentionItems = computed(() =>
    PROJECT_ATTENTION_ITEMS.filter(a => a.projectId === this.projectId())
  );

  readonly projectChangeOrders = computed(() =>
    CHANGE_ORDERS.filter(c => c.projectId === this.projectId())
  );

  readonly projectRevenueData = computed(() =>
    PROJECT_REVENUE.filter(r => r.projectId === this.projectId())
  );

  readonly projectBudgetHistory = computed(() =>
    BUDGET_HISTORY_BY_PROJECT[this.projectId()] ?? []
  );

  readonly lastBudgetPoint = computed(() => {
    const h = this.projectBudgetHistory();
    return h.length > 0 ? h[h.length - 1] : null;
  });

  readonly detailView = signal<DetailView | null>(null);

  readonly detailRfi = computed(() => {
    const d = this.detailView();
    return d?.type === 'rfi' ? d.item : null;
  });

  readonly detailSubmittal = computed(() => {
    const d = this.detailView();
    return d?.type === 'submittal' ? d.item : null;
  });

  readonly detailDrawing = computed(() => {
    const d = this.detailView();
    return d?.type === 'drawing' ? d.item : null;
  });

  readonly detailDailyReport = computed(() => {
    const d = this.detailView();
    return d?.type === 'dailyReport' ? d.item : null;
  });

  readonly detailInspection = computed(() => {
    const d = this.detailView();
    return d?.type === 'inspection' ? d.item : null;
  });

  readonly detailPunchItem = computed(() => {
    const d = this.detailView();
    return d?.type === 'punchItem' ? d.item : null;
  });

  readonly detailChangeOrder = computed(() => {
    const d = this.detailView();
    return d?.type === 'changeOrder' ? d.item : null;
  });

  readonly isCanvasDrawingDetail = computed(() => this.isCanvas() && !!this.detailDrawing());

  private readonly _lockCanvasPanEffect = effect(() => {
    const locked = this.isCanvasDrawingDetail()
      || (this.isCanvas() && !!this.subledgerCategory());
    this.panning.disabled.set(locked);
  });

  readonly activeDrawingTool = signal('');

  readonly drawingTools = DRAWING_TOOLS;

  readonly drawingTileZoom = signal(1);
  readonly drawingTileGridStyle = computed(() => {
    const minW = Math.round(280 * this.drawingTileZoom());
    return `repeat(auto-fill, minmax(${Math.max(150, Math.min(600, minW))}px, 1fr))`;
  });

  readonly drawingZoom = signal(1);
  readonly drawingPanX = signal(0);
  readonly drawingPanY = signal(0);
  readonly drawingFitScale = signal(1);
  _drawingPanning = false;
  private _drawingPanStartX = 0;
  private _drawingPanStartY = 0;
  private _drawingPanStartOffX = 0;
  private _drawingPanStartOffY = 0;

  readonly drawingNativePercent = computed(() =>
    Math.round(this.drawingFitScale() * this.drawingZoom() * 100)
  );

  onDrawingImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const container = this.drawingViewerRef()?.nativeElement as HTMLElement | undefined;
    if (!img || !container) return;
    const scaleX = container.clientWidth / img.naturalWidth;
    const scaleY = container.clientHeight / img.naturalHeight;
    this.drawingFitScale.set(Math.min(scaleX, scaleY));
  }

  private readonly pdfViewerRef = viewChild<PdfViewerComponent>('pdfViewer');
  private readonly drawingViewerRef = viewChild<ElementRef>('drawingViewer');
  private readonly _drawingWheelEffect = effect(() => {
    const el = this.drawingViewerRef()?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    const handler = (event: WheelEvent) => {
      event.preventDefault();
      const oldZoom = this.drawingZoom();
      let newZoom: number;

      if (event.shiftKey) {
        const fitScale = this.drawingFitScale();
        const step = fitScale > 0 ? 0.01 / fitScale : 0.01;
        const scrollDelta = event.deltaY || event.deltaX;
        const dir = scrollDelta > 0 ? -1 : 1;
        newZoom = Math.min(10, Math.max(0.25, oldZoom + dir * step));
      } else {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        newZoom = Math.min(10, Math.max(0.25, oldZoom + delta * oldZoom));
      }

      if (newZoom === oldZoom) return;

      const rect = el.getBoundingClientRect();
      const cursorRelX = event.clientX - rect.left - rect.width / 2;
      const cursorRelY = event.clientY - rect.top - rect.height / 2;
      const ratio = newZoom / oldZoom;

      this.drawingPanX.update(px => cursorRelX + (px - cursorRelX) * ratio);
      this.drawingPanY.update(py => cursorRelY + (py - cursorRelY) * ratio);
      this.drawingZoom.set(newZoom);
    };
    el.addEventListener('wheel', handler, { passive: false });
    this.destroyRef.onDestroy(() => el.removeEventListener('wheel', handler));
  });

  onDrawingMouseDown(event: MouseEvent): void {
    if (this.drawingZoom() <= 1) return;
    event.preventDefault();
    this._drawingPanning = true;
    this._drawingPanStartX = event.clientX;
    this._drawingPanStartY = event.clientY;
    this._drawingPanStartOffX = this.drawingPanX();
    this._drawingPanStartOffY = this.drawingPanY();
  }

  onDrawingMouseMove(event: MouseEvent): void {
    if (!this._drawingPanning) return;
    this.drawingPanX.set(this._drawingPanStartOffX + (event.clientX - this._drawingPanStartX));
    this.drawingPanY.set(this._drawingPanStartOffY + (event.clientY - this._drawingPanStartY));
  }

  onDrawingMouseUp(): void {
    this._drawingPanning = false;
  }

  handleSubnavToggle(value: string): void {
    if (value === 'zoom-in') {
      const pdfViewer = this.pdfViewerRef();
      if (pdfViewer) {
        pdfViewer.zoomIn();
      } else {
        this.drawingZoom.update(z => Math.min(10, z * 1.25));
      }
      return;
    }
    if (value === 'zoom-out') {
      const pdfViewer = this.pdfViewerRef();
      if (pdfViewer) {
        pdfViewer.zoomOut();
      } else {
        this.drawingZoom.update(z => Math.max(0.25, z / 1.25));
      }
      return;
    }
    this.subnavViewMode.set(value);
  }

  resetDrawingZoom(): void {
    this.drawingZoom.set(1);
    this.drawingPanX.set(0);
    this.drawingPanY.set(0);
    this.drawingFitScale.set(1);
  }

  resetDrawingFit(): void {
    const pdfViewer = this.pdfViewerRef();
    if (pdfViewer) {
      pdfViewer.resetZoom();
    } else {
      this.resetDrawingZoom();
    }
  }

  readonly detailSubnavKey = computed(() => {
    const d = this.detailView();
    if (d?.type === 'rfi') return 'rfi-detail';
    if (d?.type === 'submittal') return 'submittal-detail';
    if (d?.type === 'drawing') return 'drawing-detail';
    if (d?.type === 'dailyReport') return 'daily-report-detail';
    if (d?.type === 'inspection') return 'inspection-detail';
    if (d?.type === 'punchItem') return 'punch-item-detail';
    if (d?.type === 'changeOrder') return 'change-order-detail';
    return 'rfi-detail';
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

  private static readonly SEVERITY_BADGE: Record<string, ModusBadgeColor> = { high: 'danger', medium: 'warning', low: 'secondary' };

  severityBadgeColor(level: string): ModusBadgeColor {
    return ProjectDashboardComponent.SEVERITY_BADGE[level] ?? 'secondary';
  }

  itemStatusDot(status: string): string {
    return getStatusDot(status);
  }

  capitalizeStatus(status: string): string {
    return getCapitalizedStatus(status);
  }

  navigateToRfi(rfi: Rfi, sourceWidgetId?: string): void {
    this.navigateToDetail('rfi', rfi, sourceWidgetId);
  }

  navigateToSubmittal(sub: Submittal, sourceWidgetId?: string): void {
    this.navigateToDetail('submittal', sub, sourceWidgetId);
  }

  navigateToDailyReport(report: DailyReport): void {
    this.detailSourceLabel.set(this.currentPageLabel());
    this.detailView.set({ type: 'dailyReport', item: report });
    this.pushDetailUrl('dailyReport', report.id);
  }

  navigateToInspection(inspection: Inspection): void {
    this.detailSourceLabel.set(this.currentPageLabel());
    this.detailView.set({ type: 'inspection', item: inspection });
    this.pushDetailUrl('inspection', inspection.id);
  }

  navigateToPunchItem(item: PunchListItem): void {
    this.detailSourceLabel.set(this.currentPageLabel());
    this.detailView.set({ type: 'punchItem', item });
    this.pushDetailUrl('punchItem', item.id);
  }

  navigateToChangeOrder(co: ChangeOrder): void {
    this.detailSourceLabel.set(this.currentPageLabel());
    this.detailView.set({ type: 'changeOrder', item: co });
    this.pushDetailUrl('changeOrder', co.id);
  }

  inspectionResultBadge(result: InspectionResult): ModusBadgeColor {
    const map: Record<InspectionResult, ModusBadgeColor> = { pass: 'success', fail: 'danger', conditional: 'warning', pending: 'secondary' };
    return map[result] ?? 'secondary';
  }

  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor {
    const map: Record<ChangeOrderStatus, ModusBadgeColor> = { approved: 'success', pending: 'warning', rejected: 'danger' };
    return map[status] ?? 'secondary';
  }

  punchPriorityBadge(priority: string): ModusBadgeColor {
    const map: Record<string, ModusBadgeColor> = { high: 'danger', medium: 'warning', low: 'secondary' };
    return map[priority] ?? 'secondary';
  }

  weatherIcon(condition: string): string {
    const map: Record<string, string> = { 'sunny': 'wb_sunny', 'partly-cloudy': 'cloud', 'cloudy': 'cloud', 'rain': 'water', 'thunderstorm': 'flash_on', 'snow': 'ac_unit' };
    return map[condition] ?? 'cloud';
  }

  formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
    return `$${amount.toLocaleString()}`;
  }

  openLatestDrawing(): void {
    this.selectNavItem('drawings');
    const drawing = this.newestDrawingTile();
    if (drawing) {
      this.navigateToDrawingDetail(drawing);
    }
  }

  navigateToDrawingDetail(drawing: DrawingTile): void {
    this.detailSourceLabel.set('Drawings');
    this.detailView.set({ type: 'drawing', item: drawing });
    this.pushDetailUrl('drawing', drawing.id);
  }

  private navigateToDetail(type: 'rfi' | 'submittal', item: Rfi | Submittal, sourceWidgetId?: string): void {
    if (this.isCanvas() && sourceWidgetId) {
      this.openCanvasDetail(sourceWidgetId, { type, item } as DetailView);
      return;
    }
    this.detailSourceLabel.set(this.currentPageLabel());
    this.detailView.set({ type, item } as DetailView);
    this.pushDetailUrl(type, item.id);
  }

  private openCanvasDetail(sourceWidgetId: string, detail: DetailView): void {
    this._detailMgr.openDetail(sourceWidgetId, detail, this.engine);
  }

  readonly STATUS_OPTIONS = STATUS_OPTIONS;
  readonly PUNCH_STATUS_OPTIONS = PUNCH_STATUS_OPTIONS;
  readonly ASSIGNEE_OPTIONS = ASSIGNEE_OPTIONS;

  clearDetailView(): void {
    this.resetDrawingZoom();
    const fromRoute = this.detailFromRoute();
    if (fromRoute) {
      this.detailFromRoute.set('');
      this.detailSourceLabel.set('');
      this.detailView.set(null);
      this.router.navigate([this.resolveFromPath(fromRoute)]);
      return;
    }
    this.detailView.set(null);
    this.detailSourceLabel.set('');
    this.replaceUrlWithoutDetail();
  }

  updateDetailField(field: string, value: string): void {
    const current = this.detailView();
    if (!current) return;
    const updated = { ...current.item, [field]: value };
    this.detailView.set({ ...current, item: updated } as DetailView);
  }

  onDetailStatusChange(newStatus: string): void { this.updateDetailField('status', newStatus); }
  onDetailAssigneeChange(newAssignee: string): void { this.updateDetailField('assignee', newAssignee); }
  onDetailDueDateChange(newDate: string): void { this.updateDetailField('dueDate', newDate); }

  private pushDetailUrl(type: string, id: string): void {
    const params = new URLSearchParams();
    params.set('view', type);
    params.set('id', id);
    const nav = this.activeNavItem();
    if (nav && nav !== 'dashboard') {
      params.set('page', nav);
      if (nav === 'records') params.set('subpage', this.activeRecordsPage());
      else if (nav === 'financials') params.set('subpage', this.activeFinancialsPage());
    }
    window.history.pushState({ detailType: type, detailId: id }, '', window.location.pathname + '?' + params.toString());
  }

  private resolveFromLabel(from: string): string {
    const labels: Record<string, string> = {
      home: 'Home',
      projects: 'Projects',
      financials: 'Financials',
    };
    return labels[from] ?? 'Home';
  }

  private resolveFromPath(from: string): string {
    const paths: Record<string, string> = {
      home: '/',
      projects: '/projects',
      financials: '/financials',
    };
    return paths[from] ?? '/';
  }

  private replaceUrlWithoutDetail(): void {
    const url = this.buildPageUrl();
    window.history.replaceState({}, '', url);
  }

  private buildPageUrl(): string {
    const nav = this.activeNavItem();
    if (nav && nav !== 'dashboard') {
      const params = new URLSearchParams();
      params.set('page', nav);
      if (nav === 'records') params.set('subpage', this.activeRecordsPage());
      else if (nav === 'financials') {
        params.set('subpage', this.activeFinancialsPage());
        const slCat = this.subledgerCategory();
        if (slCat && this.activeFinancialsPage() === 'budget') {
          params.set('subledger', slCat);
        }
      }
      return window.location.pathname + '?' + params.toString();
    }
    return window.location.pathname;
  }

  private pushPageUrl(): void {
    window.history.pushState({}, '', this.buildPageUrl());
  }

  readonly detailSourceLabel = signal('');
  readonly detailFromRoute = signal('');

  private readonly _detailMgr = new CanvasDetailManager();
  readonly canvasDetailViews = this._detailMgr.canvasDetailViews;
  readonly hasCanvasDetails = this._detailMgr.hasCanvasDetails;
  readonly canvasInteractingId = this._detailMgr.canvasInteractingId;

  shouldTransition(widgetId: string): boolean {
    return this._detailMgr.shouldTransition(widgetId, this.moveTargetId());
  }

  onCanvasDetailHeaderMouseDown(event: MouseEvent, widgetId: string): void {
    this._detailMgr.headerMouseDown(event, widgetId, this.engine);
  }

  onCanvasDetailResizeMouseDown(event: MouseEvent, widgetId: string): void {
    this._detailMgr.resizeMouseDown(event, widgetId, this.engine);
  }

  closeCanvasDetail(widgetId: string): void {
    this._detailMgr.closeDetail(widgetId, this.engine, this.widgets);
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

  readonly currentPageLabel = computed(() => {
    const nav = this.activeNavItem();
    if (nav === 'records') return this.activeRecordsPageLabel();
    if (nav === 'financials') return this.activeFinancialsPageLabel();
    const item = this.sideNavItems.find(i => i.value === nav);
    if (item) return item.label;
    return 'Dashboard';
  });

  readonly detailBackLabel = computed(() => {
    const source = this.detailSourceLabel();
    if (source) return 'Back to ' + source;
    return 'Back to ' + this.currentPageLabel();
  });

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const id = params.get('id');
    const page = params.get('page');
    const from = params.get('from');

    this.restorePageContext(params);

    if (view && id) {
      if (from) {
        this.detailFromRoute.set(from);
        this.detailSourceLabel.set(this.resolveFromLabel(from));
      }
      if (view === 'rfi') {
        const rfi = RFIS.find(r => r.id === id);
        if (rfi) this.detailView.set({ type: 'rfi', item: rfi });
      } else if (view === 'submittal') {
        const submittal = SUBMITTALS.find(s => s.id === id);
        if (submittal) this.detailView.set({ type: 'submittal', item: submittal });
      } else if (view === 'drawing') {
        const drawing = this.drawingTiles().find(d => d.id === id);
        if (drawing) this.detailView.set({ type: 'drawing', item: drawing });
      } else if (view === 'dailyReport') {
        const report = DAILY_REPORTS.find(r => r.id === id);
        if (report) this.detailView.set({ type: 'dailyReport', item: report });
      } else if (view === 'inspection') {
        const insp = INSPECTIONS.find(i => i.id === id);
        if (insp) this.detailView.set({ type: 'inspection', item: insp });
      } else if (view === 'punchItem') {
        const punch = PUNCH_LIST_ITEMS.find(p => p.id === id);
        if (punch) this.detailView.set({ type: 'punchItem', item: punch });
      } else if (view === 'changeOrder') {
        const co = CHANGE_ORDERS.find(c => c.id === id);
        if (co) this.detailView.set({ type: 'changeOrder', item: co });
      }
    }

    this.popStateHandler = () => this.onPopState();
    window.addEventListener('popstate', this.popStateHandler);
    this.destroyRef.onDestroy(() => window.removeEventListener('popstate', this.popStateHandler!));
  }

  private popStateHandler: (() => void) | null = null;

  private onPopState(): void {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const id = params.get('id');

    if (view && id) {
      if (view === 'rfi') {
        const rfi = RFIS.find(r => r.id === id);
        if (rfi) { this.detailView.set({ type: 'rfi', item: rfi }); return; }
      } else if (view === 'submittal') {
        const sub = SUBMITTALS.find(s => s.id === id);
        if (sub) { this.detailView.set({ type: 'submittal', item: sub }); return; }
      } else if (view === 'drawing') {
        const drawing = this.drawingTiles().find(d => d.id === id);
        if (drawing) { this.detailView.set({ type: 'drawing', item: drawing }); return; }
      } else if (view === 'dailyReport') {
        const report = DAILY_REPORTS.find(r => r.id === id);
        if (report) { this.detailView.set({ type: 'dailyReport', item: report }); return; }
      } else if (view === 'inspection') {
        const insp = INSPECTIONS.find(i => i.id === id);
        if (insp) { this.detailView.set({ type: 'inspection', item: insp }); return; }
      } else if (view === 'punchItem') {
        const punch = PUNCH_LIST_ITEMS.find(p => p.id === id);
        if (punch) { this.detailView.set({ type: 'punchItem', item: punch }); return; }
      } else if (view === 'changeOrder') {
        const co = CHANGE_ORDERS.find(c => c.id === id);
        if (co) { this.detailView.set({ type: 'changeOrder', item: co }); return; }
      }
    }
    this.detailView.set(null);
    this.restorePageContext(params);
  }

  private restorePageContext(params: URLSearchParams): void {
    const page = params.get('page');
    if (!page) return;
    const validPages = this.sideNavItems.map(i => i.value);
    if (validPages.includes(page)) {
      this.activeNavItem.set(page);
    }
    const subpage = params.get('subpage');
    if (subpage) {
      if (page === 'records') {
        const validSubPages = this.recordsSubNavItems.map(i => i.value);
        if (validSubPages.includes(subpage)) this.activeRecordsPage.set(subpage);
      } else if (page === 'financials') {
        const validSubPages = this.financialsSubNavItems.map(i => i.value);
        if (validSubPages.includes(subpage)) this.activeFinancialsPage.set(subpage);
      }
    }
    const subledger = params.get('subledger');
    if (subledger && page === 'financials' && subpage === 'budget') {
      const validCategories = JOB_COST_CATEGORIES as readonly string[];
      if (validCategories.includes(subledger)) {
        this.subledgerCategory.set(subledger as JobCostCategory);
      }
    } else {
      this.subledgerCategory.set(null);
    }
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

    let attempts = 0;
    const tryAttach = () => {
      if (++attempts > 50) return;
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

  private fixNavbarLayoutAttempts = 0;
  private fixNavbarLayout(): void {
    const toolbar = this.elementRef.nativeElement.querySelector('modus-wc-toolbar');
    if (!toolbar?.shadowRoot) {
      if (++this.fixNavbarLayoutAttempts > 50) return;
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
    let attempts = 0;
    const tryReorder = () => {
      if (++attempts > 50) return;
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
    const currentPage = this.activeNavItem();
    if (currentPage && currentPage !== 'dashboard') {
      const qp: Record<string, string> = { page: currentPage };
      if (currentPage === 'records') {
        qp['subpage'] = this.activeRecordsPage();
      } else if (currentPage === 'financials') {
        qp['subpage'] = this.activeFinancialsPage();
      }
      this.router.navigate(['/project', slug], { queryParams: qp });
    } else {
      this.router.navigate(['/project', slug]);
    }
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
    this.detailView.set(null);
    this.subledgerCategory.set(null);
    this.activeNavItem.set(value);
    this.navExpanded.set(false);
    this.pushPageUrl();
  }

  navigateToBudgetPage(): void {
    this.detailView.set(null);
    this.subledgerCategory.set(null);
    this.activeNavItem.set('financials');
    this.activeFinancialsPage.set('budget');
    this.navExpanded.set(false);
    this.pushPageUrl();
  }

  selectRecordsSubPage(value: string): void {
    this.activeRecordsPage.set(value);
    this.subledgerCategory.set(null);
    this.navExpanded.set(false);
    this.pushPageUrl();
  }

  selectFinancialsSubPage(value: string): void {
    this.activeFinancialsPage.set(value);
    this.subledgerCategory.set(null);
    this.navExpanded.set(false);
    this.pushPageUrl();
  }

  onDetailSideSubnavSelect(value: string): void {
    this.detailView.set(null);
    this.detailSourceLabel.set('');
    const nav = this.activeNavItem();
    if (nav === 'records') this.activeRecordsPage.set(value);
    if (nav === 'financials') this.activeFinancialsPage.set(value);
    this.replaceUrlWithoutDetail();
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

  toggleWidgetLock(id: string): void {
    this.engine.toggleWidgetLock(id);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    if (this.panning.handleMouseMove(event)) return;
    if (this.tileCanvas.isInteracting) {
      this.tileCanvas.onDocumentMouseMove(event);
      return;
    }
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    if (this.panning.handleMouseUp()) return;
    if (this.tileCanvas.isInteracting) {
      this.tileCanvas.onDocumentMouseUp();
      this.tileInteractingId.set(null);
      return;
    }
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    if (this.panning.handleMouseUp()) return;
    this.engine.onDocumentTouchEnd();
  }


  readonly ai = new AiPanelController({
    widgetFocusService: this.widgetFocusService,
    aiService: this.aiService,
    defaultSuggestions: computed(() => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const subContext = this.getSubPageAgentContext();
      const agent = getAgent(widgetId, 'project-dashboard', subContext);
      return agent.suggestions;
    }),
    contextBuilder: () => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const subContext = this.getSubPageAgentContext();
      const agent = getAgent(widgetId, 'project-dashboard', subContext);
      const state = this.buildAgentDataState();
      return this.aiService.buildContext('project-dashboard', {
        projectName: this.projectName(),
        projectData: agent.buildContext(state),
        agentPrompt: agent.systemPrompt,
      });
    },
    localResponder: () => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const subContext = this.getSubPageAgentContext();
      const agent = getAgent(widgetId, 'project-dashboard', subContext);
      const state = this.buildAgentDataState();
      return (query: string) => agent.localRespond(query, state);
    },
    injector: this.injector,
  });

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
    } else if (this.ai.panelOpen()) {
      this.ai.close();
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    }
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const insideAiPanel = !!target.closest('modus-utility-panel');
    if (this.widgetFocusService.selectedWidgetId() && !target.closest('[data-widget-id]') && !target.closest('[data-tile-id]') && !insideAiPanel) {
      this.widgetFocusService.clearSelection();
    }
    if (this.resetMenuOpen() && !target.closest('[aria-label="Layout options"]') && !target.closest('.canvas-reset-flyout')) {
      this.resetMenuOpen.set(false);
    }
    if (this.moreMenuOpen() && !target.closest('[aria-label="More options"]') && !target.closest('[role="menuitem"]')) {
      this.moreMenuOpen.set(false);
    }
    if (this.projectSelectorOpen() && !target.closest('[role="listbox"]') && !target.closest('[aria-expanded]')) {
      this.projectSelectorOpen.set(false);
    }
    if (this.tileHeaderStatusOpen() && !target.closest('[role="listbox"]') && !target.closest('[role="option"]')) {
      this.tileHeaderStatusOpen.set(null);
    }
    if (this.subledgerDropdownOpen() && !target.closest('[role="option"]') && !target.closest('[aria-label="Back to Budget"]')?.parentElement?.querySelector('[role="option"]')) {
      const clickedDropdownTrigger = target.closest('.select-none');
      const clickedDropdownOption = target.closest('[role="option"]');
      if (!clickedDropdownTrigger && !clickedDropdownOption) {
        this.subledgerDropdownOpen.set(false);
      }
    }
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets' | 'save-defaults'): void {
    this.resetMenuOpen.set(false);
    if (action === 'view') {
      this.panning.resetView();
    } else if (action === 'widgets') {
      this.panning.resetView();
      this.resetWidgetsToDefaults();
    } else if (action === 'save-defaults') {
      this.engine.saveAsDefaultLayout();
    }
  }

  private resetWidgetsToDefaults(): void {
    this.engine.resetToDefaults();
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  private getSubPageAgentContext(): string | undefined {
    const dv = this.detailView();
    if (dv?.type === 'rfi') return 'rfiDetail';
    if (dv?.type === 'submittal') return 'submittalDetail';
    if (dv?.type === 'dailyReport') return 'dailyReportDetail';
    if (dv?.type === 'inspection') return 'inspectionDetail';
    if (dv?.type === 'punchItem') return 'punchItemDetail';
    if (dv?.type === 'changeOrder') return 'changeOrderDetail';
    if (this.detailDrawing()) return 'drawingDetail';

    const nav = this.activeNavItem();
    if (nav === 'records') {
      const sub = this.activeRecordsPage();
      if (sub === 'rfis') return 'recordsRfis';
      if (sub === 'submittals') return 'recordsSubmittals';
      if (sub === 'daily-reports') return 'recordsDailyReports';
      if (sub === 'punch-items') return 'recordsPunchItems';
      if (sub === 'inspections') return 'recordsInspections';
      if (sub === 'action-items') return 'recordsActionItems';
    }
    if (nav === 'financials') {
      if (this.subledgerCategory()) return 'financialsSubledger';
      const sub = this.activeFinancialsPage();
      if (sub === 'change-orders') return 'financialsChangeOrders';
      if (sub === 'revenue') return 'financialsRevenue';
      if (sub === 'cost-forecasts') return 'financialsCostForecasts';
      return 'financialsBudget';
    }
    if (nav === 'drawings') return 'drawingsPage';
    return undefined;
  }

  private buildAgentDataState(): AgentDataState {
    const jcCats = this.jcDetailCategories().map(c => ({
      label: c.label,
      amount: `$${Math.round(c.amount / 1000)}K`,
      pctSpend: c.pctOfSpend,
      pctBudget: c.pctOfBudget,
    }));

    const slCat = this.subledgerCategory() ?? '';
    const txns = this.subledgerTransactions().map(t => ({
      date: t.date,
      description: t.description,
      vendor: t.vendor,
      amount: t.amount,
      category: slCat,
    }));

    const projId = this.projectId();
    return {
      projectName: this.projectName(),
      projectStatus: this.projectStatus(),
      budgetUsed: this.budgetUsed(),
      budgetTotal: this.budgetTotal(),
      budgetPct: this.budgetPct(),
      budgetRemaining: this.budgetRemaining(),
      budgetHealthy: this.budgetHealthy(),
      budgetBreakdown: this.budgetBreakdown(),
      milestones: this.milestones(),
      completedMilestones: this.completedMilestones(),
      tasks: this.tasks(),
      openTaskCount: this.openTaskCount(),
      risks: this.risks(),
      team: this.team(),
      projectActivity: this.activity(),
      latestDrawing: this.latestDrawing(),
      drawings: this.drawingTiles(),
      rfis: this.projectRfis(),
      submittals: this.projectSubmittals(),
      jobCostCategories: jcCats,
      subledgerCategory: this.subledgerCategory() ?? undefined,
      subledgerTransactions: txns,
      changeOrders: CHANGE_ORDERS.filter(co => co.projectId === projId),
      dailyReports: DAILY_REPORTS.filter(dr => dr.projectId === projId),
      weatherForecast: WEATHER_FORECAST,
      projectAttentionItems: PROJECT_ATTENTION_ITEMS.filter(a => a.projectId === projId),
      budgetHistory: BUDGET_HISTORY_BY_PROJECT[projId] ?? [],
      inspections: INSPECTIONS.filter(i => i.projectId === projId),
      punchListItems: PUNCH_LIST_ITEMS.filter(p => p.projectId === projId),
      projectRevenue: PROJECT_REVENUE.filter(r => r.projectId === projId),
      detailRfi: this.detailRfi() ?? undefined,
      detailSubmittal: this.detailSubmittal() ?? undefined,
      detailDrawing: this.detailDrawing() ?? undefined,
      currentPage: 'project-dashboard',
      currentSubPage: this.activeNavItem(),
    };
  }

}
