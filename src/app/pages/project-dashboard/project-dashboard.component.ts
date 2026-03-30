import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
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
import { CurrencyPipe, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { DataStoreService } from '../../data/data-store.service';
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
import { CanvasTileShellComponent } from './components/canvas-tile-shell.component';
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
import { DashboardLayoutEngine, type DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import { CanvasDetailManager, type DetailView } from '../../shell/services/canvas-detail-manager';
import { SubpageTileCanvas, type TileRect, type TileDetailView } from '../../shell/services/subpage-tile-canvas';
import { AiService } from '../../services/ai.service';
import { AiPanelController } from '../../shell/services/ai-panel-controller';
import { CanvasPanning } from '../../shell/services/canvas-panning';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';
import {
  type ProjectDashboardData,
  type ProjectStatus,
  type MilestoneStatus,
  type TaskPriority,
  type RiskSeverity,
} from '../../data/project-data';
import { PROJECTS, type Rfi, type Submittal, getProjectJobCosts, getJobCostSummary, getSubledger, JOB_COST_CATEGORIES, CATEGORY_COLORS, budgetProgressClass, type JobCostCategory, type ProjectJobCost, type SubledgerTransaction, CHANGE_ORDERS, DAILY_REPORTS, WEATHER_FORECAST, PROJECT_ATTENTION_ITEMS, BUDGET_HISTORY_BY_PROJECT, INSPECTIONS, PUNCH_LIST_ITEMS, PROJECT_REVENUE, CONTRACTS, INVOICES, PAYABLES, PURCHASE_ORDERS, SUBCONTRACT_LEDGER, type DailyReport, type Inspection, type PunchListItem, type ChangeOrder, type Contract, type ProjectRevenue, type BudgetHistoryPoint, type WeatherForecast, type ProjectAttentionItem, type InspectionResult, type ChangeOrderStatus, type Invoice, type Payable, type PurchaseOrder, type SubcontractLedgerEntry, type InvoiceStatus, type PayableStatus, type PurchaseOrderStatus, type SubcontractLedgerType, buildUrgentNeeds, urgentNeedCategoryIcon, type UrgentNeedItem, getProjectWeather, type ProjectWeather, type WeatherCondition, weatherIcon as sharedWeatherIcon, weatherIconColor as sharedWeatherIconColor, workImpactBadge as sharedWorkImpactBadge, getProjectTimeOff, buildStaffingConflicts, coBadgeColor, coTypeLabel, statusBadgeColor as sharedStatusBadgeColor, inspectionResultBadge as sharedInspectionResultBadge, punchPriorityBadge as sharedPunchPriorityBadge, formatCurrency as sharedFormatCurrency, contractStatusBadge as sharedContractStatusBadge, contractTypeLabel as sharedContractTypeLabel, contractTypeIcon, contractTypeLabelShort, ledgerTypeBadge, ledgerTypeLabel, formatJobCost as sharedFormatJobCost, type ContractStatus, type ContractType, type RfiStatus, type SubmittalStatus } from '../../data/dashboard-data';
import { ALL_DRAWINGS_BY_PROJECT, type DrawingTile } from '../../data/drawings-data';
import { getAgent, getSuggestions, type AgentDataState, type AgentAlert } from '../../data/widget-agents';
import { SIDE_NAV_ITEMS, RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS, SUBNAV_CONFIGS } from './project-dashboard.config';
import { ProjectDashboardNavigationService } from './project-dashboard-navigation.service';

type ProjectWidgetId = 'projHeader' | 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity' | 'rfis' | 'submittals' | 'weather';

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
  'contracts': 'Manage prime contracts, subcontracts, and contract documents. Track values, retainage, and linked change orders.',
  'potential-change-orders': 'Track potential change orders before formal approval.',
  'subcontract-change-orders': 'Manage change orders issued to subcontractors.',
  'billings': 'Track progress billings, invoices, and payment status.',
  'change-order-requests': 'Process and approve change order requests from stakeholders.',
  'contract-invoices': 'Track invoices against contract line items and retainage.',
  'cost-forecasts': 'Project future costs and compare against budget allocations.',
  'general-invoices': 'Manage non-contract invoices and miscellaneous project expenses.',
  'prime-contract-change-orders': 'Track change orders on the prime contract with the owner.',
};

@Component({
  selector: 'app-project-dashboard',
  imports: [NgTemplateOutlet, TitleCasePipe, CurrencyPipe, ModusBadgeComponent, ModusProgressComponent, ModusNavbarComponent, WidgetLockToggleComponent, AiIconComponent, AiAssistantPanelComponent, EmptyStateComponent, CollapsibleSubnavComponent, ItemDetailViewComponent, DrawingMarkupToolbarComponent, WidgetFrameComponent, PdfViewerComponent, WidgetResizeHandleComponent, RecordsSubpagesComponent, FinancialsSubpagesComponent, RecordDetailViewsComponent, CanvasTileShellComponent],
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
  templateUrl: './project-dashboard.component.html',
  providers: [ProjectDashboardNavigationService],
})
export class ProjectDashboardComponent extends DashboardPageBase implements OnInit, AfterViewInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly projectNav = inject(ProjectDashboardNavigationService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly elementRef = inject(ElementRef);
  private readonly aiService = inject(AiService);
  private readonly injector = inject(Injector);

  readonly projectData = input.required<ProjectDashboardData>();
  readonly projectId = input<number>(1);

  private static readonly PROJ_HEADER_HEIGHT = 144;
  private static readonly PROJ_HEADER_OFFSET = ProjectDashboardComponent.PROJ_HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly _abortCtrl = new AbortController();
  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    this._abortCtrl.abort();
    this.ai.destroy();
  });

  protected override getEngineConfig(): DashboardLayoutConfig {
    return {
      widgets: ['projHeader', 'risks', 'milestones', 'tasks', 'rfis', 'submittals', 'drawing', 'weather', 'budget', 'team', 'activity'],
      layoutStorageKey: () => `project-${this.projectId()}-v4`,
      canvasStorageKey: () => `canvas-layout:project-${this.projectId()}:v6`,
      defaultColStarts: { projHeader: 1, risks: 1, milestones: 1, tasks: 1, rfis: 1, submittals: 1, drawing: 12, weather: 12, budget: 12, team: 12, activity: 12 },
      defaultColSpans: { projHeader: 16, risks: 11, milestones: 11, tasks: 11, rfis: 11, submittals: 11, drawing: 5, weather: 5, budget: 5, team: 5, activity: 5 },
      defaultTops: { projHeader: 0, risks: 0, milestones: 368, tasks: 896, rfis: 1312, submittals: 1648, drawing: 0, weather: 432, budget: 688, team: 1152, activity: 1568 },
      defaultHeights: { projHeader: 0, milestones: 512, tasks: 400, risks: 352, rfis: 320, submittals: 320, drawing: 416, weather: 240, budget: 448, team: 400, activity: 352 },
      defaultLefts: { projHeader: 0, risks: 0, milestones: 0, tasks: 0, rfis: 0, submittals: 0, drawing: 891, weather: 891, budget: 891, team: 891, activity: 891 },
      defaultPixelWidths: { projHeader: 1280, risks: 875, milestones: 875, tasks: 875, rfis: 875, submittals: 875, drawing: 389, weather: 389, budget: 389, team: 389, activity: 389 },
      canvasDefaultLefts: { projHeader: 0, risks: 0, milestones: 0, tasks: 0, rfis: 0, submittals: 0, drawing: 891, weather: 891, budget: 891, team: 891, activity: 891 },
      canvasDefaultPixelWidths: { projHeader: 1280, risks: 875, milestones: 875, tasks: 875, rfis: 875, submittals: 875, drawing: 389, weather: 389, budget: 389, team: 389, activity: 389 },
      canvasDefaultTops: {
        projHeader: 0,
        risks: ProjectDashboardComponent.PROJ_HEADER_OFFSET,
        milestones: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 368,
        tasks: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 896,
        rfis: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1312,
        submittals: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1648,
        drawing: ProjectDashboardComponent.PROJ_HEADER_OFFSET,
        weather: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 432,
        budget: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 688,
        team: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1152,
        activity: ProjectDashboardComponent.PROJ_HEADER_OFFSET + 1568,
      },
      canvasDefaultHeights: { projHeader: ProjectDashboardComponent.PROJ_HEADER_HEIGHT, risks: 352, milestones: 512, tasks: 400, rfis: 320, submittals: 320, drawing: 416, weather: 240, budget: 448, team: 400, activity: 352 },
      minColSpan: 4,
      canvasGridMinHeightOffset: 200,
      savesDesktopOnMobile: true,
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    };
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, projHeader: true }));
  }

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

  readonly isCanvas = this.isCanvasMode;
  readonly wTops = this.widgetTops;
  readonly wHeights = this.widgetHeights;
  readonly wLefts = this.widgetLefts;
  readonly wPixelWidths = this.widgetPixelWidths;
  readonly wZIndices = this.widgetZIndices;
  readonly wLocked = this.widgetLocked;
  readonly wColStarts = this.widgetColStarts;
  readonly wColSpans = this.widgetColSpans;
  readonly mobileGridHeight = computed(() => this.engine.mobileGridHeight());
  readonly desktopGridMinHeight = this.canvasGridMinHeight;

  // --- Subpage tile canvas (tiles become widgets in canvas mode) ---
  private static readonly TILE_SUBNAV_EXPANDED = 227;
  private static readonly TILE_SUBNAV_COLLAPSED = 40;
  private static readonly TILE_TOOLBAR_HEIGHT = 56;
  private static readonly TILE_TITLE_HEIGHT = 40;
  private static readonly TILE_CHROME_GAP = 16;
  private static readonly TILE_CANVAS_TOTAL = 1280;
  private static readonly TILE_CONTENT_TOP = ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_TITLE_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP * 2;

  readonly tileSubnavWidth = computed(() =>
    this.sideSubNavCollapsed() ? 0 : ProjectDashboardComponent.TILE_SUBNAV_EXPANDED
  );
  readonly tileContentLeft = computed(() =>
    this.tileSubnavWidth() + ProjectDashboardComponent.TILE_CHROME_GAP
  );
  readonly tileContentWidth = computed(() =>
    ProjectDashboardComponent.TILE_CANVAS_TOTAL - this.tileContentLeft()
  );
  readonly tileToolbarLeft = computed(() =>
    ProjectDashboardComponent.TILE_SUBNAV_EXPANDED + ProjectDashboardComponent.TILE_CHROME_GAP
  );
  readonly tileToolbarWidth = computed(() =>
    ProjectDashboardComponent.TILE_CANVAS_TOTAL - this.tileToolbarLeft()
  );

  readonly tileCanvas = new SubpageTileCanvas({
    storageKey: () => `tile-canvas:project-${this.projectId()}:${this.activeNavItem()}:${this.activeSubpage()}:v2`,
    lockedIds: ['tc-subnav', 'tc-toolbar', 'tc-title', 'tc-list', 'tc-weather', 'tc-fin-kpis'],
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
      if (sub === 'daily-reports') return this.projectDailyReports().map(d => `tile-dr-${d.id}`);
      if (sub === 'punch-items') return this.projectPunchItems().map(p => `tile-pl-${p.id}`);
      if (sub === 'inspections') return this.projectInspections().map(i => `tile-ins-${i.id}`);
      if (sub === 'action-items') return this.projectAttentionItems().map(a => `tile-ai-${a.id}`);
    }
    if (nav === 'financials') {
      const sub = this.activeFinancialsPage();
      if (sub === 'budget' && this.projectJobCost()) {
        if (this.subledgerCategory()) return ['tile-subledger-ledger'];
        return this.budgetTileIds;
      }
      if (sub === 'change-order-requests') return this.projectChangeOrders().map(c => `tile-co-${c.id}`);
      if (sub === 'prime-contract-change-orders') return this.projectPrimeContractCOs().map(c => `tile-pco-${c.id}`);
      if (sub === 'potential-change-orders') return this.projectPotentialCOs().map(c => `tile-pot-${c.id}`);
      if (sub === 'subcontract-change-orders') return this.projectSubcontractCOs().map(c => `tile-sco-${c.id}`);
      if (sub === 'billings') return this.projectRevenueData().map(r => `tile-rev-${r.projectId}`);
      if (sub === 'cost-forecasts') return this.projectBudgetHistory().map((_, i) => `tile-cf-${i}`);
      if (sub === 'contracts') return this.projectContracts().map(c => `tile-ct-${c.id}`);
      if (sub === 'purchase-orders') return this.projectPurchaseOrders().map(po => `tile-po-${po.id}`);
      if (sub === 'contract-invoices') return this.projectInvoices().map(inv => `tile-inv-${inv.id}`);
      if (sub === 'general-invoices') return this.projectPayables().map(p => `tile-ap-${p.id}`);
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
    this.projectNav.navigateToRfiFromTile(rfi, tileId);
  }

  navigateToSubFromTile(sub: Submittal, tileId: string): void {
    this.projectNav.navigateToSubFromTile(sub, tileId);
  }

  navigateToDailyReportFromTile(report: DailyReport, tileId: string): void {
    this.projectNav.navigateToDailyReportFromTile(report, tileId);
  }

  navigateToPunchItemFromTile(item: PunchListItem, tileId: string): void {
    this.projectNav.navigateToPunchItemFromTile(item, tileId);
  }

  navigateToInspectionFromTile(insp: Inspection, tileId: string): void {
    this.projectNav.navigateToInspectionFromTile(insp, tileId);
  }

  navigateToChangeOrderFromTile(co: ChangeOrder, tileId: string): void {
    this.projectNav.navigateToChangeOrderFromTile(co, tileId);
  }

  navigateToContractFromTile(ct: Contract, tileId: string): void {
    this.projectNav.navigateToContractFromTile(ct, tileId);
  }

  navigateToActionItemFromTile(ai: ProjectAttentionItem, tileId: string): void {
    this.projectNav.navigateToActionItemFromTile(ai, tileId);
  }

  contractStatusDotClass(status: ContractStatus): string {
    const map: Record<ContractStatus, string> = { active: 'bg-success', closed: 'bg-secondary', pending: 'bg-warning', draft: 'bg-muted' };
    return map[status] ?? 'bg-muted';
  }

  contractTypeIconName(ct: ContractType): string { return contractTypeIcon(ct); }
  contractTypeLabelText(ct: ContractType): string { return sharedContractTypeLabel(ct); }
  contractTypeLabelShortText(ct: ContractType): string { return contractTypeLabelShort(ct); }

  openTileDetail(tileId: string, detail: TileDetailView): void {
    this.projectNav.openTileDetail(tileId, detail);
  }

  selectTileWidget(tileId: string): void {
    this.widgetFocusService.selectWidget(tileId);
  }

  closeTileDetail(tileId: string): void {
    this.projectNav.closeTileDetail(tileId);
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

  onTileDetailStatusChange(tileId: string, newStatus: string): void {
    this.updateTileDetailField(tileId, 'status', newStatus);
    const dv = this.tileDetailViews()[tileId];
    if (dv?.type === 'rfi') this.store.updateRfiStatus((dv.item as Rfi).id, newStatus as RfiStatus);
    if (dv?.type === 'submittal') this.store.updateSubmittalStatus((dv.item as Submittal).id, newStatus as SubmittalStatus);
  }
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

    const toolbarLeft = hasSideNav ? this.tileToolbarLeft() : 0;
    const toolbarWidth = hasSideNav ? this.tileToolbarWidth() : ProjectDashboardComponent.TILE_CANVAS_TOTAL;

    const lockedRects: Record<string, TileRect> = {
      'tc-toolbar': { top: 0, left: toolbarLeft, width: toolbarWidth, height: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT },
      'tc-title': { top: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP, left: contentLeft, width: contentWidth, height: ProjectDashboardComponent.TILE_TITLE_HEIGHT },
    };

    if (hasSideNav) {
      const subnavCollapsed = this.sideSubNavCollapsed();
      lockedRects['tc-subnav'] = {
        top: 0, left: 0,
        width: subnavCollapsed ? ProjectDashboardComponent.TILE_SUBNAV_EXPANDED : subnavW,
        height: subnavCollapsed ? 48 : 600,
      };
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

      const isDailyReports = nav === 'records' && this.activeRecordsPage() === 'daily-reports';
      const weatherHeight = 80;
      let baseContentTop = ProjectDashboardComponent.TILE_CONTENT_TOP;
      if (isDailyReports) {
        lockedRects['tc-weather'] = {
          top: baseContentTop,
          left: contentLeft,
          width: contentWidth,
          height: weatherHeight,
        };
        baseContentTop += weatherHeight + ProjectDashboardComponent.TILE_CHROME_GAP;
      }

      this.tileCanvas.config.offsetTop = viewMode === 'list'
        ? baseContentTop + Math.min(40 + tileIds.length * 45, 600) + this.tileCanvas.config.gap
        : baseContentTop;

      if (viewMode === 'list' && isDailyReports) {
        lockedRects['tc-list'] = {
          top: baseContentTop,
          left: contentLeft,
          width: contentWidth,
          height: Math.min(40 + tileIds.length * 45, 600),
        };
      }

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
      } else if (nav === 'financials' && (this.activeFinancialsPage() === 'billings' || this.activeFinancialsPage() === 'cost-forecasts' || this.activeFinancialsPage() === 'contracts' || this.activeFinancialsPage() === 'purchase-orders' || this.activeFinancialsPage() === 'contract-invoices' || this.activeFinancialsPage() === 'general-invoices')) {
        const kpiTop = ProjectDashboardComponent.TILE_CONTENT_TOP;
        const kpiH = 100;
        lockedRects['tc-fin-kpis'] = { top: kpiTop, left: contentLeft, width: contentWidth, height: kpiH };
        const afterKpi = kpiTop + kpiH + ProjectDashboardComponent.TILE_CHROME_GAP;
        if (viewMode === 'list') {
          const itemCount = tileIds.length;
          const listHeight = Math.min(40 + itemCount * 45, 600);
          lockedRects['tc-list'] = { top: afterKpi, left: contentLeft, width: contentWidth, height: listHeight };
          this.tileCanvas.config.offsetTop = afterKpi + listHeight + this.tileCanvas.config.gap;
        } else {
          this.tileCanvas.config.offsetTop = afterKpi;
        }
        this.tileCanvas.config.tileSizeOverrides = undefined;
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
  readonly desktopLayoutMenuOpen = signal(false);
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
  readonly subnavViewMode = signal<'grid' | 'list'>('grid');

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

  private static readonly FINANCIALS_TILE_PAGES = new Set([
    'change-order-requests', 'prime-contract-change-orders', 'potential-change-orders',
    'subcontract-change-orders', 'contracts',
  ]);
  readonly activeFinancialsSubnavConfig = computed(() =>
    ProjectDashboardComponent.FINANCIALS_TILE_PAGES.has(this.activeFinancialsPage())
      ? this.subnavConfigs['financials-tiles']
      : this.subnavConfigs['financials']
  );

  readonly weatherForecast = WEATHER_FORECAST;

  private static readonly RECORDS_PAGES_WITH_CONTENT = new Set(['rfis', 'submittals', 'daily-reports', 'punch-items', 'inspections', 'action-items']);
  private static readonly FINANCIALS_PAGES_WITH_CONTENT = new Set(['budget', 'change-order-requests', 'billings', 'cost-forecasts', 'prime-contract-change-orders', 'potential-change-orders', 'subcontract-change-orders', 'contracts', 'purchase-orders', 'contract-invoices', 'general-invoices']);

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

  readonly formatJobCost = sharedFormatJobCost;

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
    this.projectNav.pushPageUrl();
  }

  openSubledger(category: string): void {
    this.subledgerCategory.set(category as JobCostCategory);
    this.subledgerDropdownOpen.set(false);
    if (this.isCanvas()) this.panning.resetView();
    this.projectNav.pushPageUrl();
  }

  switchSubledger(category: string): void {
    this.subledgerCategory.set(category as JobCostCategory);
    this.subledgerDropdownOpen.set(false);
    if (this.isCanvas()) this.panning.resetView();
    this.projectNav.pushPageUrl();
  }

  readonly drawingTiles = computed(() =>
    ALL_DRAWINGS_BY_PROJECT[this.projectId()] ?? ALL_DRAWINGS_BY_PROJECT[1]
  );

  readonly newestDrawingTile = computed(() => this.drawingTiles()[0]);

  readonly subnavConfigs = SUBNAV_CONFIGS;

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');
  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.gridRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
  }
  private readonly canvasHostRef = viewChild<ElementRef>('canvasHost');

  readonly widgets: ProjectWidgetId[] = ['milestones', 'tasks', 'risks', 'rfis', 'submittals', 'drawing', 'weather', 'budget', 'team', 'activity'];
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
    name: 'Frank Mendoza',
    email: 'frank.mendoza@trimble.com',
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
  readonly projectUrgentNeeds = computed(() => buildUrgentNeeds(this.store.rfis(), this.store.submittals()).filter(n => n.projectId === this.projectId()));
  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;

  readonly projectWeather = computed(() => getProjectWeather(this.projectId()));
  readonly projectCity = computed(() => {
    const proj = PROJECTS.find(p => p.id === this.projectId());
    return proj ? `${proj.city}, ${proj.state}` : '';
  });

  weatherIcon(condition: string): string {
    return sharedWeatherIcon(condition);
  }

  weatherIconColor(condition: string): string {
    return sharedWeatherIconColor(condition);
  }

  workImpactBadge(impact: 'none' | 'minor' | 'major'): { cls: string; label: string } {
    return sharedWorkImpactBadge(impact);
  }

  readonly risksSeverityFilter = signal<Set<string>>(new Set(['critical', 'warning', 'info']));

  readonly risksSeverityOptions = [
    { key: 'critical', label: 'Critical', dotCls: 'bg-destructive', activeCls: 'bg-destructive-20 text-destructive' },
    { key: 'warning', label: 'Warning', dotCls: 'bg-warning', activeCls: 'bg-warning-20 text-warning' },
    { key: 'info', label: 'Info', dotCls: 'bg-primary', activeCls: 'bg-primary-20 text-primary' },
  ] as const;

  private riskSevToFilterKey(sev: string): string {
    if (sev === 'high') return 'critical';
    if (sev === 'medium') return 'warning';
    if (sev === 'low') return 'info';
    return sev;
  }

  readonly risksSeverityCounts = computed(() => {
    const urgent = this.projectUrgentNeeds();
    const risks = this.risks();
    return {
      critical: urgent.filter(i => i.severity === 'critical').length + risks.filter(r => r.severity === 'high').length,
      warning: urgent.filter(i => i.severity === 'warning').length + risks.filter(r => r.severity === 'medium').length,
      info: urgent.filter(i => i.severity === 'info').length + risks.filter(r => r.severity === 'low').length,
    };
  });

  readonly filteredProjectUrgentNeeds = computed(() => {
    const sev = this.risksSeverityFilter();
    return this.projectUrgentNeeds().filter(i => sev.has(i.severity));
  });

  readonly filteredRisks = computed(() => {
    const sev = this.risksSeverityFilter();
    return this.risks().filter(r => sev.has(this.riskSevToFilterKey(r.severity)));
  });

  toggleRisksSeverity(key: string): void {
    this.risksSeverityFilter.update(set => {
      const next = new Set(set);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  readonly team = computed(() => this.projectData().team);
  readonly projectTimeOffRequests = computed(() => getProjectTimeOff(this.projectId()));
  readonly projectStaffingConflicts = computed(() => buildStaffingConflicts(this.projectId()));
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
    this.store.rfis().filter(r => r.project === this.projectName())
  );

  readonly rfiOverdueCount = computed(() =>
    this.projectRfis().filter(r => r.status === 'overdue').length
  );

  readonly projectSubmittals = computed(() =>
    this.store.submittals().filter(s => s.project === this.projectName())
  );

  readonly submittalOverdueCount = computed(() =>
    this.projectSubmittals().filter(s => s.status === 'overdue').length
  );

  readonly rfiStatusCounts = computed(() => {
    const list = this.projectRfis();
    return {
      total: list.length,
      open: list.filter(r => r.status === 'open').length,
      overdue: list.filter(r => r.status === 'overdue').length,
      upcoming: list.filter(r => r.status === 'upcoming').length,
      closed: list.filter(r => r.status === 'closed').length,
    } as Record<string, number>;
  });

  readonly submittalStatusCounts = computed(() => {
    const list = this.projectSubmittals();
    return {
      total: list.length,
      open: list.filter(s => s.status === 'open').length,
      overdue: list.filter(s => s.status === 'overdue').length,
      upcoming: list.filter(s => s.status === 'upcoming').length,
      closed: list.filter(s => s.status === 'closed').length,
    } as Record<string, number>;
  });

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

  readonly projectContracts = computed(() =>
    CONTRACTS.filter(c => c.projectId === this.projectId())
  );

  readonly contractOriginalTotal = computed(() => this.projectContracts().reduce((sum, c) => sum + c.originalValue, 0));
  readonly contractRevisedTotal = computed(() => this.projectContracts().reduce((sum, c) => sum + c.revisedValue, 0));
  readonly contractGrowth = computed(() => this.contractRevisedTotal() - this.contractOriginalTotal());

  readonly projectPrimeContractCOs = computed(() =>
    CHANGE_ORDERS.filter(c => c.projectId === this.projectId() && c.coType === 'prime')
  );

  readonly projectPotentialCOs = computed(() =>
    CHANGE_ORDERS.filter(c => c.projectId === this.projectId() && c.coType === 'potential')
  );

  readonly projectSubcontractCOs = computed(() =>
    CHANGE_ORDERS.filter(c => c.projectId === this.projectId() && c.coType === 'subcontract')
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

  readonly projectInvoices = computed(() =>
    INVOICES.filter(inv => inv.projectId === this.projectId())
  );

  readonly projectPayables = computed(() =>
    PAYABLES.filter(p => p.projectId === this.projectId())
  );

  readonly projectPurchaseOrders = computed(() =>
    PURCHASE_ORDERS.filter(po => po.projectId === this.projectId())
  );

  readonly projectSubcontractLedger = computed(() =>
    SUBCONTRACT_LEDGER.filter(sl => sl.projectId === this.projectId())
  );

  readonly poTotalValue = computed(() => this.projectPurchaseOrders().reduce((s, po) => s + po.amount, 0));
  readonly poReceivedValue = computed(() => this.projectPurchaseOrders().reduce((s, po) => s + po.amountReceived, 0));
  readonly poOpenCount = computed(() => this.projectPurchaseOrders().filter(po => po.status === 'issued' || po.status === 'acknowledged' || po.status === 'draft').length);

  readonly invTotalAmount = computed(() => this.projectInvoices().reduce((s, inv) => s + inv.amount, 0));
  readonly invPaidAmount = computed(() => this.projectInvoices().reduce((s, inv) => s + inv.amountPaid, 0));
  readonly invOutstanding = computed(() => this.invTotalAmount() - this.invPaidAmount());

  readonly payTotalAmount = computed(() => this.projectPayables().reduce((s, p) => s + p.amount, 0));
  readonly payPaidAmount = computed(() => this.projectPayables().reduce((s, p) => s + p.amountPaid, 0));
  readonly payOutstanding = computed(() => this.payTotalAmount() - this.payPaidAmount());

  poStatusDotClass(status: PurchaseOrderStatus): string {
    const map: Record<PurchaseOrderStatus, string> = {
      'draft': 'bg-secondary', 'issued': 'bg-primary', 'acknowledged': 'bg-primary',
      'partially-received': 'bg-warning', 'received': 'bg-success', 'closed': 'bg-secondary', 'cancelled': 'bg-destructive',
    };
    return map[status] ?? 'bg-secondary';
  }

  invStatusDotClass(status: InvoiceStatus): string {
    const map: Record<InvoiceStatus, string> = {
      'draft': 'bg-secondary', 'sent': 'bg-primary', 'paid': 'bg-success',
      'overdue': 'bg-destructive', 'partially-paid': 'bg-warning', 'void': 'bg-secondary',
    };
    return map[status] ?? 'bg-secondary';
  }

  payStatusDotClass(status: PayableStatus): string {
    const map: Record<PayableStatus, string> = {
      'pending': 'bg-secondary', 'approved': 'bg-primary', 'paid': 'bg-success',
      'overdue': 'bg-destructive', 'disputed': 'bg-warning',
    };
    return map[status] ?? 'bg-secondary';
  }

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

  readonly detailContract = computed(() => {
    const d = this.detailView();
    return d?.type === 'contract' ? d.item : null;
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
    if (value === 'grid' || value === 'list') {
      this.subnavViewMode.set(value);
    }
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
    if (d?.type === 'contract') return 'contract-detail';
    return 'rfi-detail';
  });

  statusBadgeColor(): ModusBadgeColor {
    return sharedStatusBadgeColor(this.projectStatus());
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
    this.projectNav.navigateToRfi(rfi, sourceWidgetId);
  }

  navigateToSubmittal(sub: Submittal, sourceWidgetId?: string): void {
    this.projectNav.navigateToSubmittal(sub, sourceWidgetId);
  }

  navigateToUrgentNeed(item: UrgentNeedItem): void {
    this.projectNav.navigateToUrgentNeed(item);
  }

  navigateToDailyReport(report: DailyReport): void {
    this.projectNav.navigateToDailyReport(report);
  }

  navigateToInspection(inspection: Inspection): void {
    this.projectNav.navigateToInspection(inspection);
  }

  navigateToPunchItem(item: PunchListItem): void {
    this.projectNav.navigateToPunchItem(item);
  }

  navigateToChangeOrder(co: ChangeOrder): void {
    this.projectNav.navigateToChangeOrder(co);
  }

  navigateToContract(ct: Contract): void {
    this.projectNav.navigateToContract(ct);
  }

  onLinkedCoClick(coId: string): void {
    const co = CHANGE_ORDERS.find(c => c.id === coId);
    if (co) this.navigateToChangeOrder(co);
  }

  inspectionResultBadge(result: InspectionResult): ModusBadgeColor { return sharedInspectionResultBadge(result); }

  inspectionResultDotClass(result: InspectionResult): string {
    const map: Record<InspectionResult, string> = { pass: 'bg-success', fail: 'bg-destructive', conditional: 'bg-warning', pending: 'bg-secondary' };
    return map[result] ?? 'bg-secondary';
  }

  severityDotClass(severity: string): string {
    const map: Record<string, string> = { critical: 'bg-destructive', warning: 'bg-warning', info: 'bg-primary' };
    return map[severity] ?? 'bg-secondary';
  }

  priorityDotClass(priority: string): string {
    const map: Record<string, string> = { high: 'bg-destructive', medium: 'bg-warning', low: 'bg-success' };
    return map[priority] ?? 'bg-secondary';
  }

  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor { return coBadgeColor(status); }

  changeOrderStatusDot(status: ChangeOrderStatus): string {
    const map: Record<ChangeOrderStatus, string> = { approved: 'bg-success', pending: 'bg-warning', rejected: 'bg-destructive' };
    return map[status] ?? 'bg-secondary';
  }

  readonly activeCoTypeList = computed(() => {
    const page = this.activeFinancialsPage();
    if (page === 'prime-contract-change-orders') return this.projectPrimeContractCOs();
    if (page === 'potential-change-orders') return this.projectPotentialCOs();
    if (page === 'subcontract-change-orders') return this.projectSubcontractCOs();
    return [];
  });

  readonly activeCoTilePrefix = computed(() => {
    const page = this.activeFinancialsPage();
    if (page === 'prime-contract-change-orders') return 'pco-';
    if (page === 'potential-change-orders') return 'pot-';
    if (page === 'subcontract-change-orders') return 'sco-';
    return 'co-';
  });

  coStatusBadge(status: ChangeOrderStatus): ModusBadgeColor {
    return coBadgeColor(status);
  }

  formatCoAmount(value: number): string { return sharedFormatCurrency(value); }

  punchPriorityBadge(priority: string): ModusBadgeColor { return sharedPunchPriorityBadge(priority); }
  formatCurrency(amount: number): string { return sharedFormatCurrency(amount); }

  openLatestDrawing(): void {
    this.selectNavItem('drawings');
    const drawing = this.newestDrawingTile();
    if (drawing) {
      this.navigateToDrawingDetail(drawing);
    }
  }

  navigateToDrawingDetail(drawing: DrawingTile): void {
    this.projectNav.navigateToDrawingDetail(drawing);
  }

  private openCanvasDetail(sourceWidgetId: string, detail: DetailView): void {
    this._detailMgr.openDetail(sourceWidgetId, detail, this.engine);
  }

  readonly STATUS_OPTIONS = STATUS_OPTIONS;
  readonly PUNCH_STATUS_OPTIONS = PUNCH_STATUS_OPTIONS;
  readonly ASSIGNEE_OPTIONS = ASSIGNEE_OPTIONS;

  clearDetailView(): void {
    this.projectNav.clearDetailView();
  }

  updateDetailField(field: string, value: string): void {
    const current = this.detailView();
    if (!current) return;
    const updated = { ...current.item, [field]: value };
    this.detailView.set({ ...current, item: updated } as DetailView);
  }

  onDetailStatusChange(newStatus: string): void {
    this.updateDetailField('status', newStatus);
    const dv = this.detailView();
    if (dv?.type === 'rfi') this.store.updateRfiStatus(dv.item.id, newStatus as RfiStatus);
    if (dv?.type === 'submittal') this.store.updateSubmittalStatus(dv.item.id, newStatus as SubmittalStatus);
  }
  onDetailAssigneeChange(newAssignee: string): void { this.updateDetailField('assignee', newAssignee); }
  onDetailDueDateChange(newDate: string): void { this.updateDetailField('dueDate', newDate); }

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
    const dv = this._detailMgr.canvasDetailViews()[widgetId];
    if (dv?.type === 'rfi') this.store.updateRfiStatus(dv.item.id, newStatus as RfiStatus);
    if (dv?.type === 'submittal') this.store.updateSubmittalStatus(dv.item.id, newStatus as SubmittalStatus);
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
    this.projectNav.bindContext({
      detailView: this.detailView,
      detailSourceLabel: this.detailSourceLabel,
      detailFromRoute: this.detailFromRoute,
      activeNavItem: this.activeNavItem,
      activeRecordsPage: this.activeRecordsPage,
      activeFinancialsPage: this.activeFinancialsPage,
      subledgerCategory: this.subledgerCategory,
      navExpanded: this.navExpanded,
      projectSelectorOpen: this.projectSelectorOpen,
      isCanvas: () => this.isCanvas(),
      currentPageLabel: () => this.currentPageLabel(),
      drawingTiles: () => this.drawingTiles(),
      sideNavItems: this.sideNavItems,
      recordsSubNavItems: this.recordsSubNavItems,
      financialsSubNavItems: this.financialsSubNavItems,
      resetDrawingZoom: () => this.resetDrawingZoom(),
      tileCanvas: this.tileCanvas,
      widgetFocus: this.widgetFocusService,
      openCanvasDetail: (sourceWidgetId, detail) => this.openCanvasDetail(sourceWidgetId, detail),
    });
    this.projectNav.registerPopStateListener();

    const backInfo = this.navHistory.getBackInfo();
    this.navBackRoute.set(backInfo.route);
    this.navBackLabel.set(backInfo.label);

    const params = new URLSearchParams(window.location.search);
    this.projectNav.restoreFromUrl(params);
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

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
        }, { capture: true, signal: this._abortCtrl.signal });
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

  readonly navBackRoute = signal('/projects');
  readonly navBackLabel = signal('Projects');

  navigateBack(): void {
    const route = this.navBackRoute();
    if (route.includes('?')) {
      const [path, query] = route.split('?');
      const qp: Record<string, string> = {};
      for (const pair of query.split('&')) {
        const [k, v] = pair.split('=');
        if (k) qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      }
      this.router.navigate([path || '/'], { queryParams: qp });
    } else {
      this.router.navigate([route]);
    }
  }

  toggleProjectSelector(): void {
    this.projectSelectorOpen.update(v => !v);
  }

  navigateToProject(slug: string): void {
    this.projectNav.navigateToProject(slug);
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
    this.projectNav.pushPageUrl();
  }

  navigateToBudgetPage(): void {
    this.projectNav.navigateToBudgetPage();
  }

  selectRecordsSubPage(value: string): void {
    this.activeRecordsPage.set(value);
    this.subledgerCategory.set(null);
    this.navExpanded.set(false);
    this.projectNav.pushPageUrl();
  }

  selectFinancialsSubPage(value: string): void {
    this.activeFinancialsPage.set(value);
    this.subledgerCategory.set(null);
    this.navExpanded.set(false);
    this.projectNav.pushPageUrl();
  }

  onDetailSideSubnavSelect(value: string): void {
    this.detailView.set(null);
    this.detailSourceLabel.set('');
    const nav = this.activeNavItem();
    if (nav === 'records') this.activeRecordsPage.set(value);
    if (nav === 'financials') this.activeFinancialsPage.set(value);
    this.projectNav.replaceUrlWithoutDetail();
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

  override onDocumentMouseMove(event: MouseEvent): void {
    if (this.panning.handleMouseMove(event)) return;
    if (this.tileCanvas.isInteracting) {
      this.tileCanvas.onDocumentMouseMove(event);
      return;
    }
    this.engine.onDocumentMouseMove(event);
  }

  override onDocumentMouseUp(): void {
    if (this.panning.handleMouseUp()) return;
    if (this.tileCanvas.isInteracting) {
      this.tileCanvas.onDocumentMouseUp();
      this.tileInteractingId.set(null);
      return;
    }
    this.engine.onDocumentMouseUp();
  }

  override onDocumentTouchEnd(): void {
    if (this.panning.handleMouseUp()) return;
    this.engine.onDocumentTouchEnd();
  }


  readonly ai = new AiPanelController({
    widgetFocusService: this.widgetFocusService,
    aiService: this.aiService,
    router: this.router,
    defaultSuggestions: computed(() => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const subContext = this.getSubPageAgentContext();
      const agent = getAgent(widgetId, 'project-dashboard', subContext);
      const state = this.buildAgentDataState();
      return getSuggestions(agent, state);
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
    actionsProvider: () => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const subContext = this.getSubPageAgentContext();
      const agent = getAgent(widgetId, 'project-dashboard', subContext);
      const state = this.buildAgentDataState();
      return agent.actions?.(state) ?? [];
    },
    injector: this.injector,
  });

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  readonly activeInsight = computed(() => {
    const widgetId = this.widgetFocusService.selectedWidgetId();
    const subContext = this.getSubPageAgentContext();
    const agent = getAgent(widgetId, 'project-dashboard', subContext);
    const state = this.buildAgentDataState();
    return agent.insight?.(state) ?? null;
  });

  readonly activeAlerts = computed<Record<string, AgentAlert | null>>(() => {
    const state = this.buildAgentDataState();
    const alerts: Record<string, AgentAlert | null> = {};
    const agentIds = ['recordsRfis', 'recordsSubmittals', 'recordsDailyReports', 'recordsInspections',
      'recordsPunchItems', 'recordsActionItems', 'financialsBudget', 'financialsChangeOrders',
      'financialsContracts', 'financialsRevenue', 'financialsCostForecasts', 'budgetAgent', 'tasksAgent', 'risksAgent'];
    for (const id of agentIds) {
      const agent = getAgent(id, 'project-dashboard');
      alerts[id] = agent.alerts?.(state) ?? null;
    }
    return alerts;
  });

  getWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'project-dashboard');
    const state = this.buildAgentDataState();
    return agent.insight?.(state) ?? null;
  }

  readonly recordsAlerts = computed<Record<string, AgentAlert | null>>(() => {
    const state = this.buildAgentDataState();
    const map: Record<string, string> = {
      'rfis': 'recordsRfis',
      'submittals': 'recordsSubmittals',
      'daily-reports': 'recordsDailyReports',
      'punch-items': 'recordsPunchItems',
      'inspections': 'recordsInspections',
      'action-items': 'recordsActionItems',
    };
    const result: Record<string, AgentAlert | null> = {};
    for (const [navValue, agentId] of Object.entries(map)) {
      const agent = getAgent(agentId, 'project-dashboard');
      result[navValue] = agent.alerts?.(state) ?? null;
    }
    return result;
  });

  readonly financialsAlerts = computed<Record<string, AgentAlert | null>>(() => {
    const state = this.buildAgentDataState();
    const map: Record<string, string> = {
      'budget': 'financialsBudget',
      'purchase-orders': 'financialsPO',
      'contracts': 'financialsContractsSub',
      'potential-change-orders': 'financialsChangeOrders',
      'subcontract-change-orders': 'financialsChangeOrders',
      'billings': 'financialsBilling',
      'change-order-requests': 'financialsChangeOrders',
      'contract-invoices': 'financialsAR',
      'cost-forecasts': 'financialsCostForecasts',
      'general-invoices': 'financialsAR',
      'prime-contract-change-orders': 'financialsChangeOrders',
    };
    const result: Record<string, AgentAlert | null> = {};
    for (const [navValue, agentId] of Object.entries(map)) {
      const agent = getAgent(agentId, 'project-dashboard');
      result[navValue] = agent.alerts?.(state) ?? null;
    }
    return result;
  });

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
    if (this.desktopLayoutMenuOpen() && !target.closest('[aria-label="Layout options"]') && !target.closest('.desktop-reset-flyout')) {
      this.desktopLayoutMenuOpen.set(false);
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

  resetWidgetsToDefaults(): void {
    this.engine.resetToDefaults();
  }

  saveDefaultLayout(): void {
    this.engine.saveAsDefaultLayout();
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
    if (dv?.type === 'contract') return 'contractDetail';
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
      if (sub === 'contracts') return 'financialsContracts';
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
      contracts: CONTRACTS.filter(ct => ct.projectId === projId),
      dailyReports: DAILY_REPORTS.filter(dr => dr.projectId === projId),
      weatherForecast: this.projectWeather()?.forecast ?? WEATHER_FORECAST,
      projectAttentionItems: PROJECT_ATTENTION_ITEMS.filter(a => a.projectId === projId),
      budgetHistory: BUDGET_HISTORY_BY_PROJECT[projId] ?? [],
      inspections: INSPECTIONS.filter(i => i.projectId === projId),
      punchListItems: PUNCH_LIST_ITEMS.filter(p => p.projectId === projId),
      projectRevenue: PROJECT_REVENUE.filter(r => r.projectId === projId),
      detailRfi: this.detailRfi() ?? undefined,
      detailSubmittal: this.detailSubmittal() ?? undefined,
      detailDrawing: this.detailDrawing() ?? undefined,
      projectTimeOff: getProjectTimeOff(projId),
      staffingConflicts: buildStaffingConflicts(projId),
      currentPage: 'project-dashboard',
      currentSubPage: this.activeNavItem(),
    };
  }

}
