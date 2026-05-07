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
import type { INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusTextInputComponent } from '../../components/modus-text-input.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
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
import { ProjectSiteModelComponent } from './components/project-site-model.component';
import { WidgetFrameComponent } from '../../shell/components/widget-frame.component';
import { PdfViewerComponent } from '../../shared/detail/pdf-viewer.component';
import { PanoramaViewerComponent } from '../../shared/detail/panorama-viewer.component';
import { UserMenuComponent } from '../../shell/components/user-menu.component';
import { TrimbleLogoComponent } from '../../shell/components/trimble-logo.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

import { PersonaService } from '../../services/persona.service';
import { getPersonaNav } from '../../data/persona-nav.config';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import { getProjectDashboardLayoutKeys } from '../../shell/services/layout-keys';
import { PROJECT_DETAIL_FRANK_LAYOUT } from '../../data/layout-seeds/project-detail-frank.layout';
import { PROJECT_DETAIL_BERT_LAYOUT } from '../../data/layout-seeds/project-detail-bert.layout';
import { PROJECT_DETAIL_KELLY_LAYOUT } from '../../data/layout-seeds/project-detail-kelly.layout';
import { PROJECT_DETAIL_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/project-detail-dominique.layout';
import { PROJECT_DETAIL_PAMELA_LAYOUT } from '../../data/layout-seeds/project-detail-pamela.layout';
import type { LayoutSeed } from '../../data/layout-seeds/layout-seed.types';
import { CanvasDetailManager, type DetailView } from '../../shell/services/canvas-detail-manager';
import { SubpageTileCanvas, type TileRect, type TileDetailView } from '../../shell/services/subpage-tile-canvas';
import { AiService } from '../../services/ai.service';
import { WeatherService } from '../../services/weather.service';
import { AiPageContextService } from '../../shell/services/ai-page-context.service';
import { AiPanelController } from '../../shell/services/ai-panel-controller';
import { CanvasPanning } from '../../shell/services/canvas-panning';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';
import {
  type ProjectDashboardData,
  type ProjectStatus,
  type MilestoneStatus,
  type TaskPriority,
  type RiskSeverity,
  type SummaryStat,
} from '../../data/project-data';
import { rewriteDynamicNeeds, rewriteBudgetRisk } from '../projects-page/projects-page-utils';
import type { Rfi, Submittal, JobCostCategory, ProjectJobCost, SubledgerTransaction, DailyReport, Inspection, PunchListItem, ChangeOrder, Contract, ProjectRevenue, BudgetHistoryPoint, WeatherForecast, ProjectAttentionItem, InspectionResult, ChangeOrderStatus, Invoice, Payable, PurchaseOrder, SubcontractLedgerEntry, InvoiceStatus, PayableStatus, PurchaseOrderStatus, SubcontractLedgerType, UrgentNeedItem, ProjectWeather, WeatherCondition, StaffingConflict, ContractStatus, ContractType, RfiStatus, SubmittalStatus, TimeOffStatus, ProjectCalendarEvent, ProjectEventCategory } from '../../data/dashboard-data.types';
import { JOB_COST_CATEGORIES } from '../../data/dashboard-data.types';
import { CATEGORY_COLORS } from '../../data/dashboard-data.seed';
import { getJobCostSummary, getSubledger, budgetProgressClass, buildUrgentNeeds, urgentNeedCategoryIcon, weatherIcon as sharedWeatherIcon, weatherIconColor as sharedWeatherIconColor, workImpactBadge as sharedWorkImpactBadge, getProjectTimeOff, buildStaffingConflicts, coBadgeColor, coTypeLabel, statusBadgeColor as sharedStatusBadgeColor, inspectionResultBadge as sharedInspectionResultBadge, punchPriorityBadge as sharedPunchPriorityBadge, formatCurrency as sharedFormatCurrency, contractStatusBadge as sharedContractStatusBadge, contractTypeLabel as sharedContractTypeLabel, contractTypeIcon, contractTypeLabelShort, ledgerTypeBadge, ledgerTypeLabel, formatJobCost as sharedFormatJobCost } from '../../data/dashboard-data.formatters';
import { ALL_DRAWINGS_BY_PROJECT, SITE_CAPTURES_BY_PROJECT, type DrawingTile, type SiteCapture } from '../../data/drawings-data';
import { getAgent, getSuggestions, type AgentDataState, type AgentAlert } from '../../data/widget-agents';
import { PROJECT_DETAIL_WIDGETS } from '../../data/widget-registrations';
import { ProjectDashboardNavigationService } from './project-dashboard-navigation.service';
import {
  coerceMainMenuOpenPayload,
  isClickInsideSideNavChrome,
} from '../../shell/utils/side-nav-click.util';
import { ChartComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { ProjectChangeOrdersComponent } from './components/project-change-orders.component';
import { ProjectFieldOpsComponent } from './components/project-field-ops.component';
import { ProjectDailyReportsComponent } from './components/project-daily-reports.component';
import { ProjectContractsComponent } from './components/project-contracts.component';

type ProjectWidgetId = 'projHeader' | 'milestones' | 'tasks' | 'risks' | 'drawing' | 'budget' | 'team' | 'activity' | 'rfis' | 'submittals' | 'weather' | 'changeOrders' | 'fieldOps' | 'dailyReports' | 'contracts';

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

// ── Area-adaptive block system ──────────────────────────────────
const PROJ_HEADER_PX = 56;
const PROJ_INSIGHT_PX = 32;
const PROJ_MIN_CONTENT_PX = 80;

@Component({
  selector: 'app-project-dashboard',
  imports: [NgTemplateOutlet, TitleCasePipe, CurrencyPipe, ModusBadgeComponent, ModusProgressComponent, ModusTextInputComponent, ModusTypographyComponent, WidgetLockToggleComponent, EmptyStateComponent, CollapsibleSubnavComponent, ItemDetailViewComponent, DrawingMarkupToolbarComponent, WidgetFrameComponent, PdfViewerComponent, PanoramaViewerComponent, WidgetResizeHandleComponent, RecordsSubpagesComponent, FinancialsSubpagesComponent, RecordDetailViewsComponent, CanvasTileShellComponent, UserMenuComponent, TrimbleLogoComponent, ChartComponent, ProjectChangeOrdersComponent, ProjectFieldOpsComponent, ProjectDailyReportsComponent, ProjectContractsComponent, ProjectSiteModelComponent],
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
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly projectNav = inject(ProjectDashboardNavigationService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly elementRef = inject(ElementRef);
  private readonly aiService = inject(AiService);
  private readonly aiPageContext = inject(AiPageContextService);
  /** Universal AI Assistant controller (root singleton). Bound to navbar spotlight inputs. */
  readonly ai = inject(AiPanelController);
  private readonly injector = inject(Injector);
  private readonly weatherService = inject(WeatherService);

  readonly projectData = input.required<ProjectDashboardData>();
  readonly projectId = input<number>(1);

  private static readonly PROJ_HEADER_HEIGHT = 144;
  private static readonly PROJ_HEADER_OFFSET = ProjectDashboardComponent.PROJ_HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly _abortCtrl = new AbortController();
  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    this._abortCtrl.abort();
    this.aiPageContext.clear();
  });

  protected override getEngineConfig(): DashboardLayoutConfig {
    return {
      ...this.getLayoutSeedForCurrentPersona(),
      layoutStorageKey: () =>
        getProjectDashboardLayoutKeys(this.personaService.activePersonaSlug(), this.projectId()).desktop,
      canvasStorageKey: () =>
        getProjectDashboardLayoutKeys(this.personaService.activePersonaSlug(), this.projectId()).canvas,
      minColSpan: 4,
      canvasGridMinHeightOffset: 200,
      savesDesktopOnMobile: true,
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    };
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, projHeader: true }));
  }

  protected override getLayoutSeedForCurrentPersona(): LayoutSeed {
    const slug = this.personaService.activePersonaSlug();
    switch (slug) {
      case 'frank': return PROJECT_DETAIL_FRANK_LAYOUT;
      case 'bert': return PROJECT_DETAIL_BERT_LAYOUT;
      case 'kelly': return PROJECT_DETAIL_KELLY_LAYOUT;
      case 'dominique': return PROJECT_DETAIL_DOMINIQUE_LAYOUT;
      case 'pamela': return PROJECT_DETAIL_PAMELA_LAYOUT;
      default: return PROJECT_DETAIL_FRANK_LAYOUT;
    }
  }

  private _prevProjectId: number | null = null;
  private _prevProjectLayoutKey: string | null = null;
  private _prevProjectCanvasKey: string | null = null;
  private readonly _projectChangeEffect = effect(() => {
    const id = this.projectId();
    if (this._prevProjectId !== null && this._prevProjectId !== id) {
      const prevLK = this._prevProjectLayoutKey;
      const prevCK = this._prevProjectCanvasKey;
      untracked(() => {
        this.engine.reinitLayout(prevLK ?? undefined, prevCK ?? undefined);
        this.applyInitialHeaderLock();
      });
    }
    this._prevProjectId = id;
    this._prevProjectLayoutKey = this.engine.currentLayoutKey;
    this._prevProjectCanvasKey = this.engine.currentCanvasKey;
  });

  readonly isCanvas = this.isCanvasMode;
  readonly wTops = this.widgetTops;
  readonly wHeights = this.widgetHeights;
  readonly wLefts = this.widgetLefts;
  readonly wPixelWidths = this.widgetPixelWidths;
  readonly wGridColumns = this.widgetGridColumns;
  readonly wZIndices = this.widgetZIndices;
  readonly wLocked = this.widgetLocked;
  readonly wColStarts = this.widgetColStarts;
  readonly wColSpans = this.widgetColSpans;
  readonly mobileGridHeight = computed(() => this.engine.mobileGridHeight());
  override readonly desktopGridMinHeight = this.engine.desktopGridMinHeight;

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
    storageKey: () => `${this.personaService.activePersonaSlug()}:tile-canvas:project-${this.projectId()}:${this.activeNavItem()}:${this.activeSubpage()}:v2`,
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

  /**
   * True when the active canvas sub-page is Models. Toggles the
   * `.canvas-content.canvas-models-full` class so the 3D viewer can
   * break out of the standard 1280px artboard and fill the viewport.
   * Mirrors the existing drawing-detail full-width pattern.
   */
  readonly isCanvasModelsFull = computed(
    () => this.isCanvas() && this.activeNavItem() === 'models',
  );

  /**
   * True when the active sub-page is Models in non-canvas (desktop /
   * tablet / mobile) mode. Used by the main-content wrapper to switch
   * to a flex-column + h-full layout so the 3D viewer can fill the
   * available height (instead of the wrapper hugging its content).
   */
  readonly isDesktopModels = computed(
    () => !this.isCanvas() && this.activeNavItem() === 'models',
  );

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
    if (dv?.type === 'changeOrder') this.store.updateChangeOrderStatus((dv.item as ChangeOrder).id, newStatus as ChangeOrderStatus);
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

    const titleToolbarGap = ProjectDashboardComponent.TILE_TITLE_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP;
    const lockedRects: Record<string, TileRect> = {
      'tc-title': { top: 0, left: 0, width: ProjectDashboardComponent.TILE_CANVAS_TOTAL, height: ProjectDashboardComponent.TILE_TITLE_HEIGHT },
      'tc-toolbar': { top: titleToolbarGap, left: toolbarLeft, width: toolbarWidth, height: ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT },
    };

    if (hasSideNav) {
      const subnavCollapsed = this.sideSubNavCollapsed();
      lockedRects['tc-subnav'] = {
        top: titleToolbarGap, left: 0,
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
        const headerTop = titleToolbarGap + ProjectDashboardComponent.TILE_TOOLBAR_HEIGHT + ProjectDashboardComponent.TILE_CHROME_GAP;
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

    const regs: Record<string, { name: string; suggestions: string[] }> = { ...PROJECT_DETAIL_WIDGETS };
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

  readonly sideNavItems = computed(() => getPersonaNav(this.personaService.activePersonaSlug()).projectSideNav);

  readonly subnavSearch = signal('');
  readonly subnavViewMode = signal<'grid' | 'list'>('grid');
  readonly isCompactMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 580 : false);
  readonly toolbarMoreOpen = signal(false);
  readonly toolbarSearchOpen = signal(false);

  readonly recordsSubNavItems = computed(() => getPersonaNav(this.personaService.activePersonaSlug()).recordsSubNav);
  readonly sideSubNavCollapsed = signal(false);
  readonly activeRecordsPage = signal('daily-reports');
  readonly activeRecordsPageLabel = computed(() => {
    const item = this.recordsSubNavItems().find(i => i.value === this.activeRecordsPage());
    return item?.label ?? 'Daily Reports';
  });
  readonly activeRecordsPageDescription = computed(() =>
    RECORDS_PAGE_DESCRIPTIONS[this.activeRecordsPage()] ?? ''
  );

  readonly financialsSubNavItems = computed(() => getPersonaNav(this.personaService.activePersonaSlug()).projectFinancialsSubNav);
  readonly activeFinancialsPage = signal('budget');
  readonly activeFinancialsPageLabel = computed(() => {
    const item = this.financialsSubNavItems().find(i => i.value === this.activeFinancialsPage());
    return item?.label ?? 'Budget';
  });
  readonly activeFinancialsPageDescription = computed(() =>
    FINANCIALS_PAGE_DESCRIPTIONS[this.activeFinancialsPage()] ?? ''
  );

  private static readonly FINANCIALS_TILE_PAGES = new Set([
    'change-order-requests', 'prime-contract-change-orders', 'potential-change-orders',
    'subcontract-change-orders', 'contracts',
  ]);
  private static readonly FINANCIALS_INVOICE_PAGES = new Set(['contract-invoices', 'general-invoices']);
  readonly activeFinancialsSubnavConfig = computed(() => {
    const page = this.activeFinancialsPage();
    if (ProjectDashboardComponent.FINANCIALS_TILE_PAGES.has(page)) return this.subnavConfigs()['financials-tiles'];
    if (ProjectDashboardComponent.FINANCIALS_INVOICE_PAGES.has(page)) return this.subnavConfigs()['financials-invoices'];
    return this.subnavConfigs()['financials'];
  });

  private static readonly FIN_PAGES_WITH_KPIS = new Set([
    'billings', 'cost-forecasts', 'contracts', 'purchase-orders',
    'contract-invoices', 'general-invoices',
  ]);

  readonly finListTableMaxHeight = computed(() => {
    if (this.isMobile()) return 'none';
    return ProjectDashboardComponent.FIN_PAGES_WITH_KPIS.has(this.activeFinancialsPage())
      ? 'calc(100dvh - 340px)'
      : 'calc(100dvh - 240px)';
  });

  readonly finSubledgerTableMaxHeight = computed(() =>
    this.isMobile() ? '75vh' : 'calc(100dvh - 316px)'
  );

  readonly weatherForecast = computed(() => this.projectWeather()?.forecast ?? this.store.weatherForecast());

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
    const costs = this.store.projectJobCosts();
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

  private resolveCssVar(prop: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  readonly pfChartOptions = computed(() => {
    const d = this.jcProfitFadeData();
    if (!d || d.points.length === 0) return null;

    const isFade = d.isFade;
    const lineColor = isFade
      ? this.resolveCssVar('--color-destructive')
      : this.resolveCssVar('--color-success');
    const borderColor = this.resolveCssVar('--color-border');
    const fgColor = this.resolveCssVar('--color-foreground');

    const values = d.points.map(p => p.margin);
    const categories = d.points.map(p => p.month);

    return {
      series: [{ name: 'Margin', data: values }] as ApexAxisChartSeries,
      chart: {
        type: 'area' as const,
        height: 160,
        sparkline: { enabled: false },
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false },
        fontFamily: 'inherit',
      },
      stroke: { curve: 'smooth' as const, width: 2 },
      fill: {
        type: 'gradient' as const,
        gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02, stops: [0, 100] },
      },
      colors: [lineColor],
      dataLabels: { enabled: false },
      grid: {
        borderColor,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 4, right: 4, top: 0, bottom: 0 },
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: fgColor, fontSize: '10px' },
          rotate: 0,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: { colors: fgColor, fontSize: '10px' },
          formatter: (val: number) => `${val.toFixed(0)}%`,
        },
      },
      tooltip: {
        enabled: true,
        y: { formatter: (val: number) => `${val.toFixed(1)}%` },
        theme: 'dark',
        style: { fontSize: '12px' },
      },
      markers: { size: 3.5, strokeWidth: 2, strokeColors: lineColor, hover: { size: 5 } },
      annotations: {
        yaxis: [{
          y: d.originalMargin,
          borderColor: fgColor,
          strokeDashArray: 6,
          opacity: 0.35,
          label: {
            text: `Est. ${d.originalMargin}%`,
            borderColor: 'transparent',
            style: { color: fgColor, background: 'transparent', fontSize: '10px', padding: { left: 4, right: 4, top: 2, bottom: 2 } },
            position: 'front' as const,
          },
        }],
      },
    };
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

  readonly siteCaptures = computed(() =>
    SITE_CAPTURES_BY_PROJECT[this.projectId()] ?? SITE_CAPTURES_BY_PROJECT[1]
  );

  readonly subnavConfigs = computed(() => getPersonaNav(this.personaService.activePersonaSlug()).subnavConfigs);

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');
  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.gridRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
  }
  private readonly canvasHostRef = viewChild<ElementRef>('canvasHost');

  readonly widgets: ProjectWidgetId[] = ['milestones', 'tasks', 'risks', 'rfis', 'submittals', 'dailyReports', 'fieldOps', 'drawing', 'weather', 'budget', 'team', 'activity', 'changeOrders', 'contracts'];
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  readonly navbarSearchQuery = signal('');

  handleNavbarSearchInput(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    this.navbarSearchQuery.set(target?.value ?? '');
  }

  // -- Schedule (Gantt) sub-page --
  private static readonly SCHEDULE_MONTHS = 6;
  private static readonly SCHEDULE_ROW_HEIGHT = 64;
  private static readonly SCHEDULE_ROW_HEIGHT_MOBILE = 48;
  private static readonly SCHEDULE_ROW_GAP = 8;

  readonly scheduleDayPx = signal(24);

  readonly scheduleIsMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  private _scheduleMobileMq: MediaQueryList | null = null;
  private readonly _scheduleMobileMqHandler = (e: MediaQueryListEvent) => this.scheduleIsMobile.set(e.matches);

  readonly scheduleBarHeight = computed(() =>
    this.scheduleIsMobile()
      ? ProjectDashboardComponent.SCHEDULE_ROW_HEIGHT_MOBILE
      : ProjectDashboardComponent.SCHEDULE_ROW_HEIGHT
  );

  readonly scheduleRowStep = computed(() => this.scheduleBarHeight() + ProjectDashboardComponent.SCHEDULE_ROW_GAP);

  private get _scheduleTodayDayOffset(): number {
    const start = this.scheduleStartDate();
    return Math.floor((this.scheduleToday.getTime() - start.getTime()) / 86400000);
  }

  private _zoomAnchorOffset: number | null = null;

  setScheduleZoom(newDayPx: number): void {
    const el = document.querySelector('.schedule-scroll-container');
    if (!el) {
      this.scheduleDayPx.set(newDayPx);
      return;
    }
    const todayDay = this._scheduleTodayDayOffset;

    if (this._zoomAnchorOffset === null) {
      const oldTodayPx = todayDay * this.scheduleDayPx();
      this._zoomAnchorOffset = oldTodayPx - el.scrollLeft;
    }

    this.scheduleDayPx.set(newDayPx);

    const newTodayPx = todayDay * newDayPx;
    const desiredScroll = Math.max(0, newTodayPx - this._zoomAnchorOffset);
    el.scrollLeft = desiredScroll;

    requestAnimationFrame(() => {
      el.scrollLeft = desiredScroll;
    });
  }

  resetScheduleZoomAnchor(): void {
    this._zoomAnchorOffset = null;
  }

  readonly scheduleCategoryMeta: Record<ProjectEventCategory, { label: string; colorClass: string; bgClass: string; borderClass: string }> = {
    site: { label: 'Site Activities', colorClass: 'bg-primary', bgClass: 'bg-primary-20', borderClass: 'timeline-bar-site' },
    financial: { label: 'Financial', colorClass: 'bg-warning', bgClass: 'bg-warning-20', borderClass: 'timeline-bar-financial' },
    meeting: { label: 'Meetings', colorClass: 'bg-success', bgClass: 'bg-success-20', borderClass: 'timeline-bar-meeting' },
    deadline: { label: 'Deadlines', colorClass: 'bg-destructive', bgClass: 'bg-destructive-20', borderClass: 'timeline-bar-deadline' },
    inspection: { label: 'Inspections', colorClass: 'bg-secondary', bgClass: 'bg-secondary-20', borderClass: 'timeline-bar-inspection' },
  };
  readonly scheduleCategories: ProjectEventCategory[] = ['site', 'financial', 'meeting', 'deadline', 'inspection'];

  readonly scheduleCategoryFilter = signal<Set<ProjectEventCategory>>(new Set(['site', 'financial', 'meeting', 'deadline', 'inspection']));

  toggleScheduleCategory(cat: ProjectEventCategory): void {
    this.scheduleCategoryFilter.update(s => {
      const next = new Set(s);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  isScheduleCategoryActive(cat: ProjectEventCategory): boolean {
    return this.scheduleCategoryFilter().has(cat);
  }

  readonly scheduleEvents = computed<ProjectCalendarEvent[]>(() =>
    this.store.projectCalendarEvents().filter(e => e.projectId === this.projectId())
  );

  readonly scheduleFilteredEvents = computed<ProjectCalendarEvent[]>(() => {
    const filter = this.scheduleCategoryFilter();
    return this.scheduleEvents().filter(e => filter.has(e.category));
  });

  private readonly scheduleStartDate = signal<Date>(this.computeScheduleStart());

  private computeScheduleStart(): Date {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d;
  }

  readonly scheduleToday = new Date();

  readonly scheduleDays = computed<{ date: Date; dayOfMonth: number; isWeekend: boolean; isToday: boolean }[]>(() => {
    const start = this.scheduleStartDate();
    const end = new Date(start);
    end.setMonth(end.getMonth() + ProjectDashboardComponent.SCHEDULE_MONTHS);
    const days: { date: Date; dayOfMonth: number; isWeekend: boolean; isToday: boolean }[] = [];
    const todayStr = this.scheduleToday.toDateString();
    const d = new Date(start);
    while (d < end) {
      const dow = d.getDay();
      days.push({ date: new Date(d), dayOfMonth: d.getDate(), isWeekend: dow === 0 || dow === 6, isToday: d.toDateString() === todayStr });
      d.setDate(d.getDate() + 1);
    }
    return days;
  });

  readonly scheduleMonths = computed<{ label: string; span: number }[]>(() => {
    const days = this.scheduleDays();
    if (!days.length) return [];
    const months: { label: string; span: number }[] = [];
    let current = '';
    let count = 0;
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
    for (const d of days) {
      const label = fmt.format(d.date);
      if (label !== current) {
        if (current) months.push({ label: current, span: count });
        current = label;
        count = 1;
      } else {
        count++;
      }
    }
    if (current) months.push({ label: current, span: count });
    return months;
  });

  readonly scheduleTotalWidth = computed(() => this.scheduleDays().length * this.scheduleDayPx());

  readonly scheduleTodayOffset = computed(() => {
    const start = this.scheduleStartDate();
    const diff = Math.floor((this.scheduleToday.getTime() - start.getTime()) / 86400000);
    return diff * this.scheduleDayPx();
  });

  readonly scheduleEventRows = computed<ProjectCalendarEvent[][]>(() => {
    const events = this.scheduleFilteredEvents().slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const dayPx = this.scheduleDayPx();
    const start = this.scheduleStartDate();
    const rows: ProjectCalendarEvent[][] = [];
    for (const evt of events) {
      const evtLeft = Math.floor((evt.startDate.getTime() - start.getTime()) / 86400000) * dayPx;
      const evtRight = evtLeft + Math.max((Math.floor((evt.endDate.getTime() - evt.startDate.getTime()) / 86400000) + 1) * dayPx - 2, 6);
      let placed = false;
      for (const row of rows) {
        const lastInRow = row[row.length - 1];
        const lastLeft = Math.floor((lastInRow.startDate.getTime() - start.getTime()) / 86400000) * dayPx;
        const lastRight = lastLeft + Math.max((Math.floor((lastInRow.endDate.getTime() - lastInRow.startDate.getTime()) / 86400000) + 1) * dayPx - 2, 6);
        if (evtLeft >= lastRight + 2) {
          row.push(evt);
          placed = true;
          break;
        }
      }
      if (!placed) rows.push([evt]);
    }
    return rows;
  });

  scheduleEventLeft(event: ProjectCalendarEvent): number {
    const start = this.scheduleStartDate();
    const diff = Math.floor((event.startDate.getTime() - start.getTime()) / 86400000);
    return diff * this.scheduleDayPx();
  }

  scheduleEventWidth(event: ProjectCalendarEvent): number {
    const days = Math.floor((event.endDate.getTime() - event.startDate.getTime()) / 86400000) + 1;
    return Math.max(days * this.scheduleDayPx() - 2, 6);
  }

  formatScheduleEventDates(event: ProjectCalendarEvent): string {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    if (event.startDate.getTime() === event.endDate.getTime()) return fmt.format(event.startDate);
    return `${fmt.format(event.startDate)} - ${fmt.format(event.endDate)}`;
  }

  scheduleEventDurationDays(event: ProjectCalendarEvent): number {
    return Math.floor((event.endDate.getTime() - event.startDate.getTime()) / 86400000) + 1;
  }

  scrollScheduleToToday(): void {
    const el = document.querySelector('.schedule-scroll-container');
    if (el) {
      const offset = this.scheduleTodayOffset() - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, offset);
    }
  }

  readonly hoveredScheduleEvent = signal<ProjectCalendarEvent | null>(null);
  readonly tappedScheduleEvent = signal<ProjectCalendarEvent | null>(null);
  readonly scheduleFlyoutPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  readonly activeScheduleFlyoutEvent = computed(() =>
    this.hoveredScheduleEvent() ?? this.tappedScheduleEvent()
  );

  readonly clampedScheduleFlyoutPosition = computed(() => {
    const pos = this.scheduleFlyoutPosition();
    const flyoutW = 300;
    const flyoutH = 160;
    const pad = 8;
    if (typeof window === 'undefined') return { x: pos.x + 12, y: pos.y - 8 };

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = pos.x + 12;
    if (x + flyoutW > vw - pad) x = pos.x - flyoutW - 12;
    if (x < pad) x = pad;

    let y = pos.y - 8;
    if (y + flyoutH > vh - pad) y = vh - flyoutH - pad;
    if (y < pad) y = pad;

    return { x, y };
  });

  onScheduleBarMouseEnter(event: MouseEvent, calEvent: ProjectCalendarEvent): void {
    this.hoveredScheduleEvent.set(calEvent);
    this.scheduleFlyoutPosition.set({ x: event.clientX, y: event.clientY });
  }

  onScheduleBarMouseMove(event: MouseEvent): void {
    this.scheduleFlyoutPosition.set({ x: event.clientX, y: event.clientY });
  }

  onScheduleBarMouseLeave(): void {
    this.hoveredScheduleEvent.set(null);
  }

  onScheduleBarTap(event: MouseEvent, calEvent: ProjectCalendarEvent): void {
    event.stopPropagation();
    if (this.tappedScheduleEvent()?.id === calEvent.id) {
      this.tappedScheduleEvent.set(null);
    } else {
      this.tappedScheduleEvent.set(calEvent);
      this.scheduleFlyoutPosition.set({ x: event.clientX, y: event.clientY });
    }
  }

  dismissScheduleTap(): void {
    this.tappedScheduleEvent.set(null);
  }

  // -- Pinch-to-zoom on schedule chart --
  private _pinchStartDist = 0;
  private _pinchStartDayPx = 0;

  onSchedulePinchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      this._pinchStartDist = Math.hypot(dx, dy);
      this._pinchStartDayPx = this.scheduleDayPx();
    }
  }

  onSchedulePinchMove(event: TouchEvent): void {
    if (event.touches.length === 2 && this._pinchStartDist > 0) {
      event.preventDefault();
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / this._pinchStartDist;
      const newDayPx = Math.min(80, Math.max(8, Math.round(this._pinchStartDayPx * scale)));
      this.setScheduleZoom(newDayPx);
    }
  }

  onSchedulePinchEnd(): void {
    if (this._pinchStartDist > 0) {
      this._pinchStartDist = 0;
      this.resetScheduleZoomAnchor();
    }
  }

  readonly userCard = computed<INavbarUserCard>(() => this.personaService.userCard());

  readonly projectName = computed(() => this.projectData().name);
  readonly projectStatus = computed(() => this.projectData().status);

  readonly projectSelectorOpen = signal(false);
  readonly otherProjects = computed(() =>
    this.store.projects().filter(p => p.id !== this.projectId())
  );
  readonly summaryStats = computed<SummaryStat[]>(() => {
    const base = this.projectData().summaryStats;
    const proj = this.store.findProjectById(this.projectId());
    if (!proj) return base;

    return base.map(stat => {
      if (stat.label === 'Budget Used') {
        const pct = proj.budgetPct;
        const cls = pct >= 90 ? 'text-destructive font-medium' : 'text-foreground-60';
        return { ...stat, value: proj.budgetUsed, subtext: `${pct}% of ${proj.budgetTotal}`, subtextClass: cls };
      }
      if (stat.label === 'Due Date') {
        const due = new Date(proj.dueDate);
        const now = new Date();
        const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);
        const monthDay = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        let subtext: string;
        let cls: string;
        if (diffDays < 0) {
          subtext = `${Math.abs(diffDays)} days overdue`;
          cls = 'text-destructive font-medium';
        } else if (diffDays <= 7) {
          subtext = diffDays === 0 ? 'Due today' : `${diffDays} days remaining`;
          cls = 'text-warning font-medium';
        } else {
          subtext = `${diffDays} days remaining`;
          cls = 'text-foreground-60';
        }
        return { ...stat, value: monthDay, subtext, subtextClass: cls };
      }
      if (stat.label === 'Schedule') {
        const statusMap: Record<string, { subtext: string; cls: string }> = {
          'On Track': { subtext: 'On track', cls: 'text-success' },
          'At Risk': { subtext: 'At risk', cls: 'text-warning' },
          'Overdue': { subtext: 'Overdue', cls: 'text-destructive font-medium' },
          'Planning': { subtext: 'Planning', cls: 'text-foreground-60' },
        };
        const info = statusMap[proj.status] ?? { subtext: proj.status, cls: 'text-foreground-60' };
        return { ...stat, value: `${proj.progress}%`, subtext: info.subtext, subtextClass: info.cls };
      }
      return stat;
    });
  });
  readonly milestones = computed(() => this.projectData().milestones);
  readonly tasks = computed(() => this.projectData().tasks);
  readonly risks = computed(() => {
    const raw = this.projectData().risks;
    const proj = this.store.findProjectById(this.projectId());
    if (!proj) return raw;
    return raw.map(r => rewriteBudgetRisk(r, proj));
  });
  readonly projectUrgentNeeds = computed(() => {
    const raw = buildUrgentNeeds(this.store.rfis(), this.store.submittals(), this.store.changeOrders())
      .filter(n => n.projectId === this.projectId());
    const proj = this.store.findProjectById(this.projectId());
    if (!proj) return raw;
    return rewriteDynamicNeeds(raw, proj, this.store.changeOrders());
  });
  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;

  readonly projectWeather = computed(() => this.store.getProjectWeather(this.projectId()));
  readonly projectCity = computed(() => {
    const proj = this.store.findProjectById(this.projectId());
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
  readonly projectTimeOffRequests = computed(() => getProjectTimeOff(this.projectId(), this.store.timeOffRequests()));
  readonly projectStaffingConflicts = computed(() => buildStaffingConflicts(this.projectId(), this.store.timeOffRequests()));

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

  readonly teamView = signal<'list' | 'staffing' | 'calendar'>('list');
  readonly isTeamCompact = computed(
    () => this.isMobile() || (this.wColSpans()['team'] ?? 16) <= 5
  );
  readonly teamCompactItems: readonly { key: 'members' | 'conflicts' | 'timeOff' | 'pending'; label: string; icon: string; colorBg: string; colorText: string }[] = [
    { key: 'members', label: 'Team Members', icon: 'people_group', colorBg: 'bg-primary-20', colorText: 'text-primary' },
    { key: 'conflicts', label: 'Staffing Gaps', icon: 'warning', colorBg: 'bg-warning-20', colorText: 'text-warning' },
    { key: 'timeOff', label: 'Time Off', icon: 'calendar', colorBg: 'bg-primary-20', colorText: 'text-primary' },
    { key: 'pending', label: 'Pending Requests', icon: 'clock', colorBg: 'bg-warning-20', colorText: 'text-warning' },
  ];
  readonly teamCompactCounts = computed<Record<'members' | 'conflicts' | 'timeOff' | 'pending', number>>(() => ({
    members: this.team().length,
    conflicts: this.projectStaffingConflicts().length,
    timeOff: this.projectTimeOffRequests().length,
    pending: this.projectTimeOffRequests().filter(r => r.status === 'Pending').length,
  }));

  readonly pendingTimeOffCount = computed(() =>
    this.projectTimeOffRequests().filter(r => r.status === 'Pending').length
  );
  readonly criticalStaffingCount = computed(() =>
    this.projectStaffingConflicts().filter(c => c.severity === 'critical').length
  );

  readonly calendarYear = signal(2026);
  readonly calendarMonth = signal(3);
  private readonly _monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  private readonly _monthAbbr: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  readonly calendarMonthLabel = computed(() => `${this._monthNames[this.calendarMonth()]} ${this.calendarYear()}`);

  readonly calendarDays = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap = new Map<number, typeof reqs>();
    const reqs = this.projectTimeOffRequests();
    for (const req of reqs) {
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

    const cells: { day: number | null; requests: typeof reqs }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, requests: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, requests: dayMap.get(d) ?? [] });
    while (cells.length % 7 !== 0) cells.push({ day: null, requests: [] });
    return cells;
  });

  prevCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.update(v => v - 1);
    }
  }

  nextCalendarMonth(): void {
    const m = this.calendarMonth();
    if (m === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.update(v => v + 1);
    }
  }

  timeOffStatusColor(status: TimeOffStatus): string {
    return status === 'Approved' ? 'bg-success-20 text-success' : status === 'Pending' ? 'bg-warning-20 text-warning' : 'bg-destructive-20 text-destructive';
  }

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

  readonly budgetHealthy = computed(() => this.budgetPct() < 95);

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

  readonly isRfiCompact = computed(
    () => this.isMobile() || (this.wColSpans()['rfis'] ?? 16) <= 5
  );

  readonly isSubmittalCompact = computed(
    () => this.isMobile() || (this.wColSpans()['submittals'] ?? 16) <= 5
  );

  readonly rfiCompactItems: readonly { key: string; label: string; icon: string; destructive: boolean }[] = [
    { key: 'open', label: 'Open', icon: 'clipboard', destructive: false },
    { key: 'overdue', label: 'Overdue', icon: 'warning', destructive: true },
    { key: 'upcoming', label: 'Upcoming', icon: 'clock', destructive: false },
    { key: 'closed', label: 'Closed', icon: 'check_circle', destructive: false },
  ];

  readonly submittalCompactItems: readonly { key: string; label: string; icon: string; destructive: boolean }[] = [
    { key: 'open', label: 'Open', icon: 'document', destructive: false },
    { key: 'overdue', label: 'Overdue', icon: 'warning', destructive: true },
    { key: 'upcoming', label: 'Upcoming', icon: 'clock', destructive: false },
    { key: 'closed', label: 'Closed', icon: 'check_circle', destructive: false },
  ];

  navigateToRfiList(): void {
    this.activeNavItem.set('records');
    this.activeRecordsPage.set('rfis');
    this.navExpanded.set(false);
    this.projectNav.pushPageUrl();
  }

  navigateToSubmittalList(): void {
    this.activeNavItem.set('records');
    this.activeRecordsPage.set('submittals');
    this.navExpanded.set(false);
    this.projectNav.pushPageUrl();
  }

  readonly projectDailyReports = computed(() =>
    this.store.dailyReports().filter(r => r.projectId === this.projectId())
  );

  readonly projectInspections = computed(() =>
    this.store.inspections().filter(i => i.projectId === this.projectId())
  );

  readonly projectPunchItems = computed(() =>
    this.store.punchListItems().filter(p => p.projectId === this.projectId())
  );

  readonly projectAttentionItems = computed(() =>
    this.store.projectAttentionItems().filter(a => a.projectId === this.projectId())
  );

  readonly projectChangeOrders = computed(() =>
    this.store.changeOrders().filter(c => c.projectId === this.projectId())
  );

  readonly projectContracts = computed(() =>
    this.store.contracts().filter(c => c.projectId === this.projectId())
  );

  readonly contractOriginalTotal = computed(() => this.projectContracts().reduce((sum, c) => sum + c.originalValue, 0));
  readonly contractRevisedTotal = computed(() => this.projectContracts().reduce((sum, c) => sum + c.revisedValue, 0));
  readonly contractGrowth = computed(() => this.contractRevisedTotal() - this.contractOriginalTotal());

  readonly projectPrimeContractCOs = computed(() =>
    this.store.changeOrders().filter(c => c.projectId === this.projectId() && c.coType === 'prime')
  );

  readonly projectPotentialCOs = computed(() =>
    this.store.changeOrders().filter(c => c.projectId === this.projectId() && c.coType === 'potential')
  );

  readonly projectSubcontractCOs = computed(() =>
    this.store.changeOrders().filter(c => c.projectId === this.projectId() && c.coType === 'subcontract')
  );

  readonly projectRevenueData = computed(() =>
    this.store.projectRevenue().filter(r => r.projectId === this.projectId())
  );

  readonly projectBudgetHistory = computed(() =>
    this.store.getProjectBudgetHistory(this.projectId())
  );

  readonly lastBudgetPoint = computed(() => {
    const h = this.projectBudgetHistory();
    return h.length > 0 ? h[h.length - 1] : null;
  });

  readonly projectInvoices = computed(() =>
    this.store.invoices().filter(inv => inv.projectId === this.projectId())
  );

  readonly projectPayables = computed(() =>
    this.store.payables().filter(p => p.projectId === this.projectId())
  );

  readonly projectPurchaseOrders = computed(() =>
    this.store.purchaseOrders().filter(po => po.projectId === this.projectId())
  );

  readonly projectSubcontractLedger = computed(() =>
    this.store.subcontractLedger().filter(sl => sl.projectId === this.projectId())
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
    if (d?.type !== 'rfi') return null;
    return this.store.rfis().find(r => r.id === d.item.id) ?? d.item;
  });

  readonly detailSubmittal = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'submittal') return null;
    return this.store.submittals().find(s => s.id === d.item.id) ?? d.item;
  });

  readonly detailDrawing = computed(() => {
    const d = this.detailView();
    return d?.type === 'drawing' ? d.item : null;
  });

  readonly detailDailyReport = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'dailyReport') return null;
    return this.store.dailyReports().find(r => r.id === d.item.id) ?? d.item;
  });

  readonly detailInspection = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'inspection') return null;
    return this.store.inspections().find(i => i.id === d.item.id) ?? d.item;
  });

  readonly detailPunchItem = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'punchItem') return null;
    return this.store.punchListItems().find(p => p.id === d.item.id) ?? d.item;
  });

  readonly detailChangeOrder = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'changeOrder') return null;
    return this.store.changeOrders().find(co => co.id === d.item.id) ?? d.item;
  });

  readonly detailContract = computed(() => {
    const d = this.detailView();
    if (d?.type !== 'contract') return null;
    return this.store.contracts().find(c => c.id === d.item.id) ?? d.item;
  });

  readonly detailPanorama = computed(() => {
    const d = this.detailView();
    return d?.type === 'panorama' ? d.item : null;
  });

  readonly isCanvasDrawingDetail = computed(() => this.isCanvas() && !!this.detailDrawing());
  readonly isCanvasPanoramaDetail = computed(() => this.isCanvas() && !!this.detailPanorama());

  private readonly _lockCanvasPanEffect = effect(() => {
    const locked = this.isCanvasDrawingDetail()
      || this.isCanvasPanoramaDetail()
      || (this.isCanvas() && !!this.subledgerCategory());
    this.panning.disabled.set(locked);
  });

  /**
   * Auto-lock the canvas (user-visible lock state) whenever the user enters
   * the Models sub-page in canvas mode. The 3D model-viewer and Pannellum
   * 360 viewer both consume pointer drags for camera control, so leaving
   * canvas pan active produces a confusing two-handlers-fight-over-drag
   * experience. Tracking previous nav lets users still manually unlock
   * via the canvas controls menu without the effect immediately re-locking.
   */
  private _prevAutoLockNav: string | null = null;
  private readonly _autoLockOnModelsEffect = effect(() => {
    const nav = this.isCanvas() ? this.activeNavItem() : null;
    if (nav === 'models' && this._prevAutoLockNav !== 'models') {
      this.panning.locked.set(true);
    }
    this._prevAutoLockNav = nav;
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
    if (d?.type === 'panorama') return 'panorama-detail';
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

  navigateToActionItem(ai: ProjectAttentionItem): void {
    const match = this.projectUrgentNeeds().find(u => u.id === ai.id);
    if (match) {
      this.navigateToUrgentNeed(match);
    }
  }

  navigateToChangeOrder(co: ChangeOrder): void {
    this.projectNav.navigateToChangeOrder(co);
  }

  navigateToContract(ct: Contract): void {
    this.projectNav.navigateToContract(ct);
  }

  navigateToPurchaseOrder(po: PurchaseOrder): void {
    this.router.navigate([`/${this.personaService.activePersonaSlug()}/financials/purchase-orders`, po.id]);
  }

  navigateToInvoice(inv: Invoice): void {
    this.router.navigate([`/${this.personaService.activePersonaSlug()}/financials/invoices`, inv.id]);
  }

  navigateToPayable(p: Payable): void {
    this.router.navigate([`/${this.personaService.activePersonaSlug()}/financials/payables`, p.id]);
  }

  onLinkedCoClick(coId: string): void {
    const co = this.store.changeOrders().find(c => c.id === coId);
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

  navigateToPanorama(capture: SiteCapture): void {
    this.projectNav.navigateToPanorama(capture);
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
    if (dv?.type === 'changeOrder') this.store.updateChangeOrderStatus((dv.item as ChangeOrder).id, newStatus as ChangeOrderStatus);
  }
  onDetailAssigneeChange(newAssignee: string): void { this.updateDetailField('assignee', newAssignee); }
  onDetailDueDateChange(newDate: string): void { this.updateDetailField('dueDate', newDate); }

  onOpenDetailInNewTab(): void {
    const dv = this.detailView();
    if (!dv) return;
    const url = this.projectNav.buildDetailUrl(dv.type, (dv.item as { id: string }).id);
    window.open(url, '_blank', 'noopener');
  }

  openTileDetailInNewTab(type: string, id: string): void {
    const url = this.projectNav.buildDetailUrl(type, id);
    window.open(url, '_blank', 'noopener');
  }

  openCanvasDetailInNewTab(detail: DetailView): void {
    const url = this.projectNav.buildDetailUrl(detail.type, (detail.item as { id: string }).id);
    window.open(url, '_blank', 'noopener');
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

  /**
   * Dispatchers used by the shared `rfiDetailPanel` / `submittalDetailPanel`
   * `<ng-template>`s so the bindings can live in one place per type. Each
   * caller passes the active detail-view mode (desktop / tile / canvas) plus
   * the row identifier (tile id, widget id, or empty string for desktop).
   */
  dispatchDetailAssignee(mode: 'desktop' | 'tile' | 'canvas', id: string, value: string): void {
    if (mode === 'desktop') this.onDetailAssigneeChange(value);
    else if (mode === 'tile') this.onTileDetailAssigneeChange(id, value);
    else this.onCanvasDetailAssigneeChange(id, value);
  }

  dispatchDetailStatus(mode: 'desktop' | 'tile' | 'canvas', id: string, value: string): void {
    if (mode === 'desktop') this.onDetailStatusChange(value);
    else if (mode === 'tile') this.onTileDetailStatusChange(id, value);
    else this.onCanvasDetailStatusChange(id, value);
  }

  dispatchDetailDueDate(mode: 'desktop' | 'tile' | 'canvas', id: string, value: string): void {
    if (mode === 'desktop') this.onDetailDueDateChange(value);
    else if (mode === 'tile') this.onTileDetailDueDateChange(id, value);
    else this.onCanvasDetailDueDateChange(id, value);
  }

  dispatchDetailOpenInNewTab(mode: 'desktop' | 'tile' | 'canvas', id: string): void {
    if (mode === 'desktop') {
      this.onOpenDetailInNewTab();
    } else if (mode === 'canvas') {
      const detail = this._detailMgr.canvasDetailViews()[id];
      if (detail) this.openCanvasDetailInNewTab(detail);
    }
  }

  readonly currentPageLabel = computed(() => {
    const nav = this.activeNavItem();
    if (nav === 'records') return this.activeRecordsPageLabel();
    if (nav === 'financials') return this.activeFinancialsPageLabel();
    const item = this.sideNavItems().find(i => i.value === nav);
    if (item) return item.label;
    return 'Dashboard';
  });

  readonly detailBackLabel = computed(() => {
    const source = this.detailSourceLabel();
    if (source) return 'Back to ' + source;
    return 'Back to ' + this.currentPageLabel();
  });

  ngOnInit(): void {
    this.weatherService.initialize();

    this.aiPageContext.register({
      contextProvider: () => {
        const widgetId = this.widgetFocusService.selectedWidgetId();
        const subContext = this.getSubPageAgentContext();
        const agent = getAgent(widgetId, 'project-dashboard', subContext);
        const state = this.buildAgentDataState();
        return this.aiService.buildContext('project-dashboard', {
          projectId: this.projectId(),
          projectName: this.projectName(),
          projectData: agent.buildContext(state),
          agentPrompt: agent.systemPrompt,
        });
      },
      actionsProvider: () => {
        const widgetId = this.widgetFocusService.selectedWidgetId();
        const subContext = this.getSubPageAgentContext();
        const agent = getAgent(widgetId, 'project-dashboard', subContext);
        const state = this.buildAgentDataState();
        return agent.actions?.(state) ?? [];
      },
      suggestionsProvider: () => {
        const widgetId = this.widgetFocusService.selectedWidgetId();
        const subContext = this.getSubPageAgentContext();
        const agent = getAgent(widgetId, 'project-dashboard', subContext);
        const state = this.buildAgentDataState();
        return getSuggestions(agent, state);
      },
      localResponder: () => {
        const widgetId = this.widgetFocusService.selectedWidgetId();
        const subContext = this.getSubPageAgentContext();
        const agent = getAgent(widgetId, 'project-dashboard', subContext);
        const state = this.buildAgentDataState();
        return (query: string) => agent.localRespond(query, state);
      },
      contextKey: () => this.aiContextKey(),
      title: () => 'Trimble AI',
      subtitle: () => this.aiContextLabel(),
      welcomeText: () => this.aiWelcomeMessage(),
    });

    const zFn = () => this.panning.canvasZoom();
    this.engine.zoomFn = zFn;
    this._detailMgr.zoomFn = zFn;
    this.tileCanvas.zoomFn = zFn;

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
      siteCaptures: () => this.siteCaptures(),
      sideNavItems: this.sideNavItems(),
      recordsSubNavItems: this.recordsSubNavItems(),
      financialsSubNavItems: this.financialsSubNavItems(),
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

  private _compactMq: MediaQueryList | null = null;
  private readonly _compactMqHandler = (e: MediaQueryListEvent) => this.isCompactMobile.set(e.matches);

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (typeof window !== 'undefined') {
      this._compactMq = window.matchMedia('(max-width: 580px)');
      this.isCompactMobile.set(this._compactMq.matches);
      this._compactMq.addEventListener('change', this._compactMqHandler);
      this.destroyRef.onDestroy(() => this._compactMq?.removeEventListener('change', this._compactMqHandler));

      this._scheduleMobileMq = window.matchMedia('(max-width: 767px)');
      this.scheduleIsMobile.set(this._scheduleMobileMq.matches);
      this._scheduleMobileMq.addEventListener('change', this._scheduleMobileMqHandler);
      this.destroyRef.onDestroy(() => this._scheduleMobileMq?.removeEventListener('change', this._scheduleMobileMqHandler));
    }
  }

  onMainMenuToggle(open: unknown): void {
    const next = coerceMainMenuOpenPayload(open);
    if (next !== undefined) {
      this.navExpanded.set(next);
    }
  }

  focusMain(): void {
    const main = document.getElementById('main-content');
    if (main) main.focus();
  }

  navigateHome(): void {
    this.router.navigate([`/${this.personaService.activePersonaSlug()}`]);
  }

  onPersonaSwitch(targetSlug: string): void {
    this.store.switchToPersona(targetSlug);
    this.personaService.setActivePersona(targetSlug);
    void this.router.navigateByUrl(`/${targetSlug}`);
  }

  readonly navBackRoute = signal('/projects');
  readonly navBackLabel = signal('Back');

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


  private readonly aiContextKey = computed(() => {
    const id = this.projectId();
    const sub = this.getSubPageAgentContext() ?? 'dashboard';
    return `project:${id}:${sub}`;
  });

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  readonly aiContextLabel = computed(() => {
    const name = this.projectName();
    const nav = this.activeNavItem();
    const detail = this.detailView();

    if (detail) {
      const item = detail.item as unknown as Record<string, unknown>;
      const itemLabel = (item['number'] as string) ?? (item['title'] as string) ?? '';
      const typeLabels: Record<string, string> = {
        rfi: 'RFI', submittal: 'Submittal', drawing: 'Drawing',
        dailyReport: 'Daily Report', inspection: 'Inspection',
        punchItem: 'Punch Item', changeOrder: 'Change Order',
        contract: 'Contract', panorama: 'Site Capture',
      };
      const typeLabel = typeLabels[detail.type] ?? detail.type;
      const suffix = itemLabel ? `${typeLabel} ${itemLabel}` : typeLabel;
      return `${name} / ${suffix}`;
    }

    if (nav === 'dashboard') return name;
    if (nav === 'drawings') return `${name} / Drawings`;

    if (nav === 'records') {
      const sub = this.activeRecordsPageLabel();
      return `${name} / ${sub}`;
    }

    if (nav === 'financials') {
      const slCat = this.subledgerCategory();
      if (slCat) return `${name} / Budget / ${slCat}`;
      const sub = this.activeFinancialsPageLabel();
      return `${name} / ${sub}`;
    }

    const sideItem = this.sideNavItems().find(i => i.value === nav);
    return sideItem ? `${name} / ${sideItem.label}` : name;
  });

  readonly aiWelcomeMessage = computed(() => {
    const nav = this.activeNavItem();
    const name = this.projectName();
    if (nav === 'dashboard') return `Ask me about ${name} -- milestones, budget, risks, or team status.`;
    if (nav === 'records') return `Ask me about ${this.activeRecordsPageLabel().toLowerCase()} for ${name}.`;
    if (nav === 'financials') {
      const sl = this.subledgerCategory();
      if (sl) return `Ask me about ${sl} cost details for ${name}.`;
      return `Ask me about ${this.activeFinancialsPageLabel().toLowerCase()} for ${name}.`;
    }
    if (nav === 'drawings') return `Ask me about drawings and revisions for ${name}.`;
    return `Ask me about ${name}.`;
  });

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

  // ── Area-adaptive visible blocks ───────────────────────────────
  // Hide the "insight" strip when a widget is too short to host meaningful
  // content plus the insight line underneath.
  readonly projectVisibleBlocks = computed<Record<string, Set<string>>>(() => {
    const heights = this.widgetHeights();
    const result: Record<string, Set<string>> = {};

    for (const wId of this.widgets) {
      const h = heights[wId] ?? 384;
      const blocks = new Set<string>();
      const avail = h - PROJ_HEADER_PX;
      if (PROJ_MIN_CONTENT_PX + PROJ_INSIGHT_PX <= avail) {
        blocks.add('insight');
      }
      result[wId] = blocks;
    }
    return result;
  });

  showProjectBlock(widgetId: string, block: string): boolean {
    return this.projectVisibleBlocks()[widgetId]?.has(block) ?? false;
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
      'general-invoices': 'financialsAP',
      'prime-contract-change-orders': 'financialsChangeOrders',
    };
    const result: Record<string, AgentAlert | null> = {};
    for (const [navValue, agentId] of Object.entries(map)) {
      const agent = getAgent(agentId, 'project-dashboard');
      result[navValue] = agent.alerts?.(state) ?? null;
    }
    return result;
  });

  readonly recordsTotalAlertCount = computed(() => {
    const a = this.recordsAlerts();
    let total = 0;
    for (const v of Object.values(a)) { if (v) total += v.count; }
    return total;
  });

  readonly recordsHasCriticalAlert = computed(() =>
    Object.values(this.recordsAlerts()).some(v => v?.level === 'critical')
  );

  readonly financialsTotalAlertCount = computed(() => {
    const a = this.financialsAlerts();
    let total = 0;
    for (const v of Object.values(a)) { if (v) total += v.count; }
    return total;
  });

  readonly financialsHasCriticalAlert = computed(() =>
    Object.values(this.financialsAlerts()).some(v => v?.level === 'critical')
  );

  navItemAlertCount(navValue: string): number {
    if (navValue === 'records') return this.recordsTotalAlertCount();
    if (navValue === 'financials') return this.financialsTotalAlertCount();
    return 0;
  }

  navItemHasCritical(navValue: string): boolean {
    if (navValue === 'records') return this.recordsHasCriticalAlert();
    if (navValue === 'financials') return this.financialsHasCriticalAlert();
    return false;
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
    if (this.projectSelectorOpen()) {
      this.projectSelectorOpen.set(false);
    } else if (this.resetMenuOpen()) {
      this.resetMenuOpen.set(false);
    } else if (this.moreMenuOpen()) {
      this.moreMenuOpen.set(false);
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.navExpanded() && !isClickInsideSideNavChrome(event)) {
      this.navExpanded.set(false);
    }
    const target = event.target as HTMLElement;
    const insideAiPanel = !!target.closest('ai-floating-prompt') || !!target.closest('.ai-floating-prompt');
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
    if (this.toolbarMoreOpen() && !target.closest('[aria-label="More actions"]') && !target.closest('[role="menuitem"]')) {
      this.toolbarMoreOpen.set(false);
    }
    if (this.toolbarSearchOpen() && !target.closest('[data-toolbar-search]')) {
      this.toolbarSearchOpen.set(false);
    }
    if (this.projectSelectorOpen() && !target.closest('[role="listbox"]') && !target.closest('[aria-expanded]')) {
      this.projectSelectorOpen.set(false);
    }
    if (this.tileHeaderStatusOpen() && !target.closest('[role="listbox"]') && !target.closest('[role="option"]')) {
      this.tileHeaderStatusOpen.set(null);
    }
    if (this.timeOffStatusOpen() !== null && !target.closest('[data-timeoff-dropdown]')) {
      this.timeOffStatusOpen.set(null);
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
    if (this.detailPanorama()) return 'panoramaDetail';

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
      if (sub === 'contracts') return 'financialsContracts';
      if (sub === 'cost-forecasts') return 'financialsCostForecasts';
      if (sub === 'purchase-orders') return 'financialsPO';
      if (sub === 'billings') return 'financialsRevenue';
      if (sub === 'contract-invoices') return 'financialsAR';
      if (sub === 'general-invoices') return 'financialsAP';
      if (sub === 'change-order-requests' || sub === 'prime-contract-change-orders'
        || sub === 'potential-change-orders' || sub === 'subcontract-change-orders') return 'financialsChangeOrders';
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
      projects: this.store.projects(),
      allWeatherData: this.store.weatherData(),
      allJobCosts: this.store.projectJobCosts(),
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
      changeOrders: this.store.changeOrders().filter(co => co.projectId === projId),
      contracts: this.store.contracts().filter(ct => ct.projectId === projId),
      invoices: this.store.invoices().filter(inv => inv.projectId === projId),
      payables: this.store.payables().filter(p => p.projectId === projId),
      purchaseOrders: this.store.purchaseOrders().filter(po => po.projectId === projId),
      billingSchedules: this.store.billingSchedules().filter(bs => bs.projectId === projId),
      billingEvents: this.store.billingEvents().filter(be => be.projectId === projId),
      dailyReports: this.store.dailyReports().filter(dr => dr.projectId === projId),
      weatherForecast: this.projectWeather()?.forecast ?? this.store.weatherForecast(),
      projectAttentionItems: this.store.projectAttentionItems().filter(a => a.projectId === projId),
      budgetHistory: this.store.getProjectBudgetHistory(projId),
      inspections: this.store.inspections().filter(i => i.projectId === projId),
      punchListItems: this.store.punchListItems().filter(p => p.projectId === projId),
      projectRevenue: this.store.projectRevenue().filter(r => r.projectId === projId),
      detailRfi: this.detailRfi() ?? undefined,
      detailSubmittal: this.detailSubmittal() ?? undefined,
      detailDrawing: this.detailDrawing() ?? undefined,
      detailDailyReport: this.detailDailyReport() ?? undefined,
      detailInspection: this.detailInspection() ?? undefined,
      detailPunchItem: this.detailPunchItem() ?? undefined,
      detailChangeOrder: this.detailChangeOrder() ?? undefined,
      detailContract: this.detailContract() ?? undefined,
      detailPanorama: this.detailPanorama() ?? undefined,
      projectTimeOff: getProjectTimeOff(projId, this.store.timeOffRequests()),
      staffingConflicts: buildStaffingConflicts(projId, this.store.timeOffRequests()),
      currentPage: 'project-dashboard',
      currentSubPage: this.activeNavItem(),
      personaSlug: this.personaService.activePersonaSlug(),
    };
  }

}
