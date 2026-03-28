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
import { AiAssistantPanelComponent } from '../../shell/components/ai-assistant-panel.component';
import { EmptyStateComponent } from './components/empty-state.component';
import { CollapsibleSubnavComponent } from './components/collapsible-subnav.component';
import { ItemDetailViewComponent, type StatusOption } from './components/item-detail-view.component';
import { WidgetFrameComponent } from './components/widget-frame.component';
import { PdfViewerComponent } from './components/pdf-viewer.component';
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
import { PROJECTS, RFIS, SUBMITTALS, type Rfi, type Submittal } from '../../data/dashboard-data';
import { ALL_DRAWINGS_BY_PROJECT, type DrawingTile } from '../../data/drawings-data';
import { SIDE_NAV_ITEMS, RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS, SUBNAV_CONFIGS } from './project-dashboard.config';

type ProjectWidgetId = 'projHeader' | 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity' | 'rfis' | 'submittals';
const STATUS_OPTIONS: StatusOption[] = [
  { value: 'open', label: 'Open', dotClass: 'bg-primary' },
  { value: 'overdue', label: 'Overdue', dotClass: 'bg-destructive' },
  { value: 'upcoming', label: 'Upcoming', dotClass: 'bg-warning' },
  { value: 'closed', label: 'Closed', dotClass: 'bg-success' },
];

const ASSIGNEE_OPTIONS: string[] = [
  'Sarah Chen',
  'James Carter',
  'Priya Nair',
  'Tom Evans',
  'Lena Brooks',
  'Mike Osei',
  'Daniel Park',
  'Rachel Kim',
  'Marcus Webb',
  'Olivia Grant',
];

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
  imports: [NgTemplateOutlet, TitleCasePipe, ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, WidgetLockToggleComponent, AiIconComponent, AiAssistantPanelComponent, EmptyStateComponent, CollapsibleSubnavComponent, ItemDetailViewComponent, WidgetFrameComponent, PdfViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'panning.isPanReady()',
    '[class.canvas-panning]': 'panning.isPanning()',
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
      </div>
      @if (detailDrawing(); as drawing) {
        <div class="flex flex-col flex-1 min-h-0">
          @if (drawing.file && drawing.file.endsWith('.pdf')) {
            <div class="bg-card border-default rounded-lg overflow-hidden flex-1 min-h-0">
              <app-pdf-viewer #pdfViewer [src]="drawing.file" />
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
                <div class="absolute bottom-3 right-3 flex items-center gap-2 bg-card border-default rounded-lg px-3 py-1.5 shadow-lg">
                  <div class="text-xs text-foreground-60 font-medium">{{ drawingNativePercent() }}%</div>
                  <div class="w-7 h-7 rounded flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
                    role="button" tabindex="0" aria-label="Reset zoom" (click)="resetDrawingZoom()">
                    <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">refresh</i>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
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
            <div class="absolute overflow-visible"
              [style.top.px]="tilePos()['tc-subnav']?.top ?? 0"
              [style.left.px]="tilePos()['tc-subnav']?.left ?? 0"
              [style.width.px]="tilePos()['tc-subnav']?.width ?? 224"
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
            <div class="absolute"
              [style.top.px]="tilePos()['tc-toolbar']?.top ?? 0"
              [style.left.px]="tilePos()['tc-toolbar']?.left ?? 240"
              [style.width.px]="tilePos()['tc-toolbar']?.width ?? 1040"
              [style.height.px]="tilePos()['tc-toolbar']?.height ?? 56"
            >
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['records'] }" />
            </div>
            <!-- Locked: Title -->
            <div class="absolute flex items-center justify-between"
              [style.top.px]="tilePos()['tc-title']?.top ?? 72"
              [style.left.px]="tilePos()['tc-title']?.left ?? 240"
              [style.width.px]="tilePos()['tc-title']?.width ?? 1040"
              [style.height.px]="tilePos()['tc-title']?.height ?? 40"
            >
              <div class="text-2xl font-bold text-foreground">{{ activeRecordsPageLabel() }}@if (activeRecordsPage() === 'rfis') { ({{ projectRfis().length }}) }@if (activeRecordsPage() === 'submittals') { ({{ projectSubmittals().length }}) }</div>
            </div>
            <!-- Locked: List widget (list view mode) -->
            @if (subnavViewMode() === 'list') {
              <div class="absolute bg-card border-default rounded-lg overflow-hidden flex flex-col"
                [style.top.px]="tilePos()['tc-list']?.top ?? 128"
                [style.left.px]="tilePos()['tc-list']?.left ?? 240"
                [style.width.px]="tilePos()['tc-list']?.width ?? 1040"
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
                  [class]="'absolute' + (hasTileDetails() && tileMoveTargetId() !== 'tile-rfi-' + rfi.id ? ' widget-detail-transition' : '')"
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
                  [class]="'absolute' + (hasTileDetails() && tileMoveTargetId() !== 'tile-sub-' + sub.id ? ' widget-detail-transition' : '')"
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
            @if (activeRecordsPage() !== 'rfis' && activeRecordsPage() !== 'submittals') {
              <div class="absolute"
                [style.top.px]="tilePos()['tc-title']?.top ? (tilePos()['tc-title'].top + tilePos()['tc-title'].height + 16) : 128"
                [style.left.px]="tilePos()['tc-toolbar']?.left ?? 240"
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
              <div class="text-2xl font-bold text-foreground">{{ activeRecordsPageLabel() }}@if (activeRecordsPage() === 'rfis') { ({{ projectRfis().length }}) }@if (activeRecordsPage() === 'submittals') { ({{ projectSubmittals().length }}) }</div>
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
          <div class="relative overflow-visible" [style.min-height.px]="600">
            <!-- Locked: Side Subnav -->
            <div class="absolute overflow-visible"
              [style.top.px]="0" [style.left.px]="0"
              [style.width.px]="224" [style.height.px]="600"
            >
              <app-collapsible-subnav
                icon="bar_graph"
                title="Financials"
                [items]="financialsSubNavItems"
                [activeItem]="activeFinancialsPage()"
                [collapsed]="sideSubNavCollapsed()"
                [canvasMode]="true"
                (itemSelect)="activeFinancialsPage.set($event)"
                (collapsedChange)="sideSubNavCollapsed.set($event)"
              />
            </div>
            <!-- Locked: Section Subnav (toolbar) -->
            <div class="absolute" [style.top.px]="0" [style.left.px]="240" [style.width.px]="1040" [style.height.px]="56">
              <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['financials'] }" />
            </div>
            <!-- Locked: Title -->
            <div class="absolute flex items-center justify-between" [style.top.px]="72" [style.left.px]="240" [style.width.px]="1040" [style.height.px]="40">
              <div class="text-2xl font-bold text-foreground">{{ activeFinancialsPageLabel() }}</div>
            </div>
            <div class="absolute" [style.top.px]="128" [style.left.px]="240">
              <app-empty-state icon="bar_graph" [title]="activeFinancialsPageLabel()" [description]="activeFinancialsPageDescription()" />
            </div>
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
              (itemSelect)="activeFinancialsPage.set($event)"
              (collapsedChange)="sideSubNavCollapsed.set($event)"
            />
          }
          <div class="flex-1 flex flex-col gap-6 min-w-0 md:pl-4">
            <ng-container [ngTemplateOutlet]="childPageSubnav" [ngTemplateOutletContext]="{ $implicit: subnavConfigs['financials'] }" />
            <div class="flex items-center justify-between">
              <div class="text-2xl font-bold text-foreground">{{ activeFinancialsPageLabel() }}</div>
            </div>
            <app-empty-state icon="bar_graph" [title]="activeFinancialsPageLabel()" [description]="activeFinancialsPageDescription()" />
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
                  (click)="selectNavItem('drawings')"
                  (keydown.enter)="selectNavItem('drawings')">
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

        <div class="canvas-content" [class.canvas-drawing-detail]="isCanvasDrawingDetail()" role="main" id="main-content" tabindex="-1"
          [style.transform]="(panning.panOffsetX() || panning.panOffsetY()) ? 'translate(' + panning.panOffsetX() + 'px,' + panning.panOffsetY() + 'px)' : null">
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
  private static readonly TILE_SUBNAV_WIDTH = 224;
  private static readonly TILE_TOOLBAR_HEIGHT = 56;
  private static readonly TILE_TITLE_HEIGHT = 40;
  private static readonly TILE_CHROME_GAP = 16;
  private static readonly TILE_CONTENT_TOP = ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_TITLE_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP * 2;
  private static readonly TILE_CONTENT_LEFT = ProjectDashboardComponent.TILE_SUBNAV_WIDTH + ProjectDashboardComponent.TILE_CHROME_GAP;

  readonly tileCanvas = new SubpageTileCanvas({
    storageKey: () => `tile-canvas:project-${this.projectId()}:${this.activeNavItem()}:${this.activeSubpage()}:v1`,
    lockedIds: ['tc-subnav', 'tc-toolbar', 'tc-title', 'tc-list'],
    tileWidth: 308,
    tileHeight: 260,
    columns: 4,
    gap: 16,
    offsetTop: ProjectDashboardComponent.TILE_CONTENT_TOP,
    offsetLeft: ProjectDashboardComponent.TILE_CONTENT_LEFT,
    detailWidth: 800,
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

  readonly subpageTileIds = computed<string[]>(() => {
    const nav = this.activeNavItem();
    if (nav === 'drawings') return this.drawingTiles().map(d => `tile-drawing-${d.id}`);
    if (nav === 'records') {
      const sub = this.activeRecordsPage();
      if (sub === 'rfis') return this.projectRfis().map(r => `tile-rfi-${r.id}`);
      if (sub === 'submittals') return this.projectSubmittals().map(s => `tile-sub-${s.id}`);
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
    const contentLeft = hasSideNav ? ProjectDashboardComponent.TILE_CONTENT_LEFT : 0;
    const contentWidth = hasSideNav ? 1040 : 1280;

    const lockedRects: Record<string, TileRect> = {
      'tc-toolbar': { top: 0, left: contentLeft, width: contentWidth, height: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT },
      'tc-title': { top: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP, left: contentLeft, width: contentWidth, height: ProjectDashboardComponent.TILE_TITLE_HEIGHT },
    };

    if (hasSideNav) {
      lockedRects['tc-subnav'] = { top: 0, left: 0, width: ProjectDashboardComponent.TILE_SUBNAV_WIDTH, height: 600 };
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
      this.tileCanvas.config.offsetLeft = contentLeft;
      this.tileCanvas.config.offsetTop = viewMode === 'list'
        ? ProjectDashboardComponent.TILE_CONTENT_TOP + Math.min(40 + tileIds.length * 45, 600) + this.tileCanvas.config.gap
        : ProjectDashboardComponent.TILE_CONTENT_TOP;
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

  readonly isCanvasDrawingDetail = computed(() => this.isCanvas() && !!this.detailDrawing());

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
      if (event.shiftKey) {
        const fitScale = this.drawingFitScale();
        const step = fitScale > 0 ? 0.01 / fitScale : 0.01;
        const scrollDelta = event.deltaY || event.deltaX;
        const dir = scrollDelta > 0 ? -1 : 1;
        this.drawingZoom.update(z => Math.min(10, Math.max(0.25, z + dir * step)));
      } else {
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        this.drawingZoom.update(z => Math.min(10, Math.max(0.25, z + delta * z)));
      }
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

  readonly detailSubnavKey = computed(() => {
    const d = this.detailView();
    if (d?.type === 'rfi') return 'rfi-detail';
    if (d?.type === 'submittal') return 'submittal-detail';
    if (d?.type === 'drawing') return 'drawing-detail';
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
  private static readonly STATUS_DOT: Record<string, string> = { open: 'bg-primary', overdue: 'bg-destructive', upcoming: 'bg-warning', closed: 'bg-success' };

  severityBadgeColor(level: string): ModusBadgeColor {
    return ProjectDashboardComponent.SEVERITY_BADGE[level] ?? 'secondary';
  }

  itemStatusDot(status: string): string {
    return ProjectDashboardComponent.STATUS_DOT[status] ?? 'bg-muted';
  }

  capitalizeStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  navigateToRfi(rfi: Rfi, sourceWidgetId?: string): void {
    this.navigateToDetail('rfi', rfi, sourceWidgetId);
  }

  navigateToSubmittal(sub: Submittal, sourceWidgetId?: string): void {
    this.navigateToDetail('submittal', sub, sourceWidgetId);
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
    const nav = this.activeNavItem();
    if (nav && nav !== 'dashboard') {
      const params = new URLSearchParams();
      params.set('page', nav);
      if (nav === 'records') params.set('subpage', this.activeRecordsPage());
      else if (nav === 'financials') params.set('subpage', this.activeFinancialsPage());
      window.history.replaceState({}, '', window.location.pathname + '?' + params.toString());
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
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
      }
    } else if (page) {
      window.history.replaceState({}, '', window.location.pathname);
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
    this.activeNavItem.set(value);
    this.navExpanded.set(false);
  }

  selectRecordsSubPage(value: string): void {
    this.activeRecordsPage.set(value);
    this.navExpanded.set(false);
  }

  selectFinancialsSubPage(value: string): void {
    this.activeFinancialsPage.set(value);
    this.navExpanded.set(false);
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
    defaultSuggestions: [
      'What are the biggest risks right now?',
      'Summarize migration progress',
      'Which tasks are overdue?',
      'How is the budget tracking?',
    ],
    contextBuilder: () => this.aiService.buildContext('project-dashboard', {
      projectName: this.projectName(),
      projectData: this.buildProjectContextData(),
    }),
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
    if (this.resetMenuOpen() && !target.closest('[aria-label="Reset options"]') && !target.closest('.canvas-reset-flyout')) {
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
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets'): void {
    this.resetMenuOpen.set(false);
    if (action === 'view') {
      this.panning.resetView();
    } else if (action === 'widgets') {
      this.panning.resetView();
      this.resetWidgetsToDefaults();
    }
  }

  private resetWidgetsToDefaults(): void {
    this.engine.resetToDefaults();
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
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
