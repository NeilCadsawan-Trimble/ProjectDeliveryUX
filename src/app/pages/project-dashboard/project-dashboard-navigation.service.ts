import { DestroyRef, Injectable, inject, type WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import type { DetailView } from '../../shell/services/canvas-detail-manager';
import type { SubpageTileCanvas, TileDetailView } from '../../shell/services/subpage-tile-canvas';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import type { DrawingTile, SiteCapture } from '../../data/drawings-data';
import { DataStoreService } from '../../data/data-store.service';
import {
  CHANGE_ORDERS,
  DAILY_REPORTS,
  INSPECTIONS,
  PUNCH_LIST_ITEMS,
  JOB_COST_CATEGORIES,
  type Rfi,
  type Submittal,
  type DailyReport,
  type Inspection,
  type PunchListItem,
  type ChangeOrder,
  type Contract,
  type JobCostCategory,
  type UrgentNeedItem,
  type ProjectAttentionItem,
} from '../../data/dashboard-data';
import type { NavItem } from './project-dashboard.config';

/**
 * Navigation, URL sync, and tile detail open/close for {@link ProjectDashboardComponent}.
 * Bound once per dashboard instance via {@link ProjectDashboardNavigationService.bindContext}.
 */
export interface ProjectDashboardNavigationBindings {
  detailView: WritableSignal<DetailView | null>;
  detailSourceLabel: WritableSignal<string>;
  detailFromRoute: WritableSignal<string>;
  activeNavItem: WritableSignal<string>;
  activeRecordsPage: WritableSignal<string>;
  activeFinancialsPage: WritableSignal<string>;
  subledgerCategory: WritableSignal<JobCostCategory | null>;
  navExpanded: WritableSignal<boolean>;
  projectSelectorOpen: WritableSignal<boolean>;
  isCanvas: () => boolean;
  currentPageLabel: () => string;
  drawingTiles: () => DrawingTile[];
  siteCaptures: () => SiteCapture[];
  sideNavItems: readonly NavItem[];
  recordsSubNavItems: readonly NavItem[];
  financialsSubNavItems: readonly NavItem[];
  resetDrawingZoom: () => void;
  tileCanvas: SubpageTileCanvas;
  widgetFocus: WidgetFocusService;
  openCanvasDetail: (sourceWidgetId: string, detail: DetailView) => void;
}

@Injectable()
export class ProjectDashboardNavigationService {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(DataStoreService);

  private ctx!: ProjectDashboardNavigationBindings;

  bindContext(bindings: ProjectDashboardNavigationBindings): void {
    this.ctx = bindings;
  }

  registerPopStateListener(): void {
    const handler = (): void => {
      this.onPopState();
    };
    window.addEventListener('popstate', handler);
    this.destroyRef.onDestroy(() => window.removeEventListener('popstate', handler));
  }

  /**
   * Applies `page` / `subpage` / `subledger` query params and optional `view`+`id` detail from the URL (initial load).
   */
  restoreFromUrl(params: URLSearchParams): void {
    this.restorePageContext(params);
    const view = params.get('view');
    const id = params.get('id');
    const from = params.get('from');
    if (view && id) {
      if (from) {
        this.ctx.detailFromRoute.set(from);
        this.ctx.detailSourceLabel.set(this.resolveFromLabel(from));
      }
      if (view === 'rfi') {
        const rfi = this.store.rfis().find(r => r.id === id);
        if (rfi) this.ctx.detailView.set({ type: 'rfi', item: rfi });
      } else if (view === 'submittal') {
        const submittal = this.store.submittals().find(s => s.id === id);
        if (submittal) this.ctx.detailView.set({ type: 'submittal', item: submittal });
      } else if (view === 'drawing') {
        const drawing = this.ctx.drawingTiles().find(d => d.id === id);
        if (drawing) this.ctx.detailView.set({ type: 'drawing', item: drawing });
      } else if (view === 'dailyReport') {
        const report = DAILY_REPORTS.find(r => r.id === id);
        if (report) this.ctx.detailView.set({ type: 'dailyReport', item: report });
      } else if (view === 'inspection') {
        const insp = INSPECTIONS.find(i => i.id === id);
        if (insp) this.ctx.detailView.set({ type: 'inspection', item: insp });
      } else if (view === 'punchItem') {
        const punch = PUNCH_LIST_ITEMS.find(p => p.id === id);
        if (punch) this.ctx.detailView.set({ type: 'punchItem', item: punch });
      } else if (view === 'changeOrder') {
        const co = CHANGE_ORDERS.find(c => c.id === id);
        if (co) this.ctx.detailView.set({ type: 'changeOrder', item: co });
      } else if (view === 'panorama') {
        const capture = this.ctx.siteCaptures().find(c => c.id === id);
        if (capture) this.ctx.detailView.set({ type: 'panorama', item: capture });
      }
    }
  }

  openTileDetail(tileId: string, detail: TileDetailView): void {
    this.ctx.tileCanvas.openDetail(tileId, detail);
    this.ctx.widgetFocus.selectWidget(tileId);
  }

  closeTileDetail(tileId: string): void {
    this.ctx.tileCanvas.closeDetail(tileId);
  }

  navigateToRfiFromTile(rfi: Rfi, tileId: string): void {
    this.openTileDetail(tileId, { type: 'rfi', item: rfi });
  }

  navigateToSubFromTile(sub: Submittal, tileId: string): void {
    this.openTileDetail(tileId, { type: 'submittal', item: sub });
  }

  navigateToDailyReportFromTile(report: DailyReport, tileId: string): void {
    this.openTileDetail(tileId, { type: 'dailyReport', item: report });
  }

  navigateToPunchItemFromTile(item: PunchListItem, tileId: string): void {
    this.openTileDetail(tileId, { type: 'punchItem', item });
  }

  navigateToInspectionFromTile(insp: Inspection, tileId: string): void {
    this.openTileDetail(tileId, { type: 'inspection', item: insp });
  }

  navigateToChangeOrderFromTile(co: ChangeOrder, tileId: string): void {
    this.openTileDetail(tileId, { type: 'changeOrder', item: co });
  }

  navigateToContractFromTile(ct: Contract, tileId: string): void {
    this.openTileDetail(tileId, { type: 'contract', item: ct });
  }

  navigateToActionItemFromTile(ai: ProjectAttentionItem, tileId: string): void {
    this.openTileDetail(tileId, { type: 'actionItem', item: ai });
  }

  navigateToRfi(rfi: Rfi, sourceWidgetId?: string): void {
    this.navigateToDetail('rfi', rfi, sourceWidgetId);
  }

  navigateToSubmittal(sub: Submittal, sourceWidgetId?: string): void {
    this.navigateToDetail('submittal', sub, sourceWidgetId);
  }

  navigateToUrgentNeed(item: UrgentNeedItem): void {
    if (item.financialsRoute && (item.category === 'budget' || item.category === 'change-order')) {
      void this.router.navigate([item.financialsRoute]);
      return;
    }
    const qp = item.queryParams;
    if (qp['view'] && qp['id']) {
      const view = qp['view'];
      const id = qp['id'];
      if (view === 'rfi') {
        const rfi = this.store.rfis().find(r => r.id === id);
        if (rfi) {
          this.navigateToDetail('rfi', rfi, 'risks');
          return;
        }
      } else if (view === 'submittal') {
        const sub = this.store.submittals().find(s => s.id === id);
        if (sub) {
          this.navigateToDetail('submittal', sub, 'risks');
          return;
        }
      } else if (view === 'changeOrder') {
        const co = CHANGE_ORDERS.find(c => c.id === id);
        if (co) {
          if (this.ctx.isCanvas()) {
            this.ctx.openCanvasDetail('risks', { type: 'changeOrder', item: co } as DetailView);
          } else {
            this.navigateToChangeOrder(co);
          }
          return;
        }
      }
    }
    const page = qp['page'] || 'dashboard';
    const validPages = this.ctx.sideNavItems.map(i => i.value);
    if (page !== 'dashboard' && validPages.includes(page)) {
      this.ctx.activeNavItem.set(page);
      if (page === 'records' && qp['subpage']) this.ctx.activeRecordsPage.set(qp['subpage']);
      else if (page === 'financials' && qp['subpage']) this.ctx.activeFinancialsPage.set(qp['subpage']);
    }
  }

  navigateToDailyReport(report: DailyReport): void {
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type: 'dailyReport', item: report });
    this.pushDetailUrl('dailyReport', report.id);
  }

  navigateToInspection(inspection: Inspection): void {
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type: 'inspection', item: inspection });
    this.pushDetailUrl('inspection', inspection.id);
  }

  navigateToPunchItem(item: PunchListItem): void {
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type: 'punchItem', item });
    this.pushDetailUrl('punchItem', item.id);
  }

  navigateToChangeOrder(co: ChangeOrder): void {
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type: 'changeOrder', item: co });
    this.pushDetailUrl('changeOrder', co.id);
  }

  navigateToContract(ct: Contract): void {
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type: 'contract', item: ct } as DetailView);
    this.pushDetailUrl('contract', ct.id);
  }

  navigateToDrawingDetail(drawing: DrawingTile): void {
    this.ctx.detailSourceLabel.set('Drawings');
    this.ctx.detailView.set({ type: 'drawing', item: drawing });
    this.pushDetailUrl('drawing', drawing.id);
  }

  navigateToPanorama(capture: SiteCapture): void {
    this.ctx.detailSourceLabel.set('Field Captures');
    this.ctx.detailView.set({ type: 'panorama', item: capture });
    this.pushDetailUrl('panorama', capture.id);
  }

  navigateToProject(slug: string): void {
    this.ctx.projectSelectorOpen.set(false);
    const currentPage = this.ctx.activeNavItem();
    if (currentPage && currentPage !== 'dashboard') {
      const qp: Record<string, string> = { page: currentPage };
      if (currentPage === 'records') {
        qp['subpage'] = this.ctx.activeRecordsPage();
      } else if (currentPage === 'financials') {
        qp['subpage'] = this.ctx.activeFinancialsPage();
      }
      void this.router.navigate(['/project', slug], { queryParams: qp });
    } else {
      void this.router.navigate(['/project', slug]);
    }
  }

  navigateToBudgetPage(): void {
    this.ctx.detailView.set(null);
    this.ctx.subledgerCategory.set(null);
    this.ctx.activeNavItem.set('financials');
    this.ctx.activeFinancialsPage.set('budget');
    this.ctx.navExpanded.set(false);
    this.pushPageUrl();
  }

  clearDetailView(): void {
    this.ctx.resetDrawingZoom();
    const fromRoute = this.ctx.detailFromRoute();
    if (fromRoute) {
      this.ctx.detailFromRoute.set('');
      this.ctx.detailSourceLabel.set('');
      this.ctx.detailView.set(null);
      void this.router.navigate([this.resolveFromPath(fromRoute)]);
      return;
    }
    this.ctx.detailView.set(null);
    this.ctx.detailSourceLabel.set('');
    this.replaceUrlWithoutDetail();
  }

  /** Current dashboard URL with `page` / `subpage` / `subledger` but no detail `view`/`id`. */
  buildPageUrl(): string {
    const nav = this.ctx.activeNavItem();
    if (nav && nav !== 'dashboard') {
      const params = new URLSearchParams();
      params.set('page', nav);
      if (nav === 'records') params.set('subpage', this.ctx.activeRecordsPage());
      else if (nav === 'financials') {
        params.set('subpage', this.ctx.activeFinancialsPage());
        const slCat = this.ctx.subledgerCategory();
        if (slCat && this.ctx.activeFinancialsPage() === 'budget') {
          params.set('subledger', slCat);
        }
      }
      return window.location.pathname + '?' + params.toString();
    }
    return window.location.pathname;
  }

  replaceUrlWithoutDetail(): void {
    window.history.replaceState({}, '', this.buildPageUrl());
  }

  pushPageUrl(): void {
    window.history.pushState({}, '', this.buildPageUrl());
  }

  private navigateToDetail(type: 'rfi' | 'submittal', item: Rfi | Submittal, sourceWidgetId?: string): void {
    if (this.ctx.isCanvas() && sourceWidgetId) {
      this.ctx.openCanvasDetail(sourceWidgetId, { type, item } as DetailView);
      return;
    }
    this.ctx.detailSourceLabel.set(this.ctx.currentPageLabel());
    this.ctx.detailView.set({ type, item } as DetailView);
    this.pushDetailUrl(type, item.id);
  }

  private pushDetailUrl(type: string, id: string): void {
    const params = new URLSearchParams();
    params.set('view', type);
    params.set('id', id);
    const nav = this.ctx.activeNavItem();
    if (nav && nav !== 'dashboard') {
      params.set('page', nav);
      if (nav === 'records') params.set('subpage', this.ctx.activeRecordsPage());
      else if (nav === 'financials') params.set('subpage', this.ctx.activeFinancialsPage());
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

  private onPopState(): void {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const id = params.get('id');

    if (view && id) {
      if (view === 'rfi') {
        const rfi = this.store.rfis().find(r => r.id === id);
        if (rfi) {
          this.ctx.detailView.set({ type: 'rfi', item: rfi });
          return;
        }
      } else if (view === 'submittal') {
        const sub = this.store.submittals().find(s => s.id === id);
        if (sub) {
          this.ctx.detailView.set({ type: 'submittal', item: sub });
          return;
        }
      } else if (view === 'drawing') {
        const drawing = this.ctx.drawingTiles().find(d => d.id === id);
        if (drawing) {
          this.ctx.detailView.set({ type: 'drawing', item: drawing });
          return;
        }
      } else if (view === 'dailyReport') {
        const report = DAILY_REPORTS.find(r => r.id === id);
        if (report) {
          this.ctx.detailView.set({ type: 'dailyReport', item: report });
          return;
        }
      } else if (view === 'inspection') {
        const insp = INSPECTIONS.find(i => i.id === id);
        if (insp) {
          this.ctx.detailView.set({ type: 'inspection', item: insp });
          return;
        }
      } else if (view === 'punchItem') {
        const punch = PUNCH_LIST_ITEMS.find(p => p.id === id);
        if (punch) {
          this.ctx.detailView.set({ type: 'punchItem', item: punch });
          return;
        }
      } else if (view === 'changeOrder') {
        const co = CHANGE_ORDERS.find(c => c.id === id);
        if (co) {
          this.ctx.detailView.set({ type: 'changeOrder', item: co });
          return;
        }
      } else if (view === 'panorama') {
        const capture = this.ctx.siteCaptures().find(c => c.id === id);
        if (capture) {
          this.ctx.detailView.set({ type: 'panorama', item: capture });
          return;
        }
      }
    }
    this.ctx.detailView.set(null);
    this.restorePageContext(params);
  }

  private restorePageContext(params: URLSearchParams): void {
    const page = params.get('page');
    if (!page) return;
    const validPages = this.ctx.sideNavItems.map(i => i.value);
    if (validPages.includes(page)) {
      this.ctx.activeNavItem.set(page);
    }
    const subpage = params.get('subpage');
    if (subpage) {
      if (page === 'records') {
        const validSubPages = this.ctx.recordsSubNavItems.map(i => i.value);
        if (validSubPages.includes(subpage)) this.ctx.activeRecordsPage.set(subpage);
      } else if (page === 'financials') {
        const validSubPages = this.ctx.financialsSubNavItems.map(i => i.value);
        if (validSubPages.includes(subpage)) this.ctx.activeFinancialsPage.set(subpage);
      }
    }
    const subledger = params.get('subledger');
    if (subledger && page === 'financials' && subpage === 'budget') {
      const validCategories = JOB_COST_CATEGORIES as readonly string[];
      if (validCategories.includes(subledger)) {
        this.ctx.subledgerCategory.set(subledger as JobCostCategory);
      }
    } else {
      this.ctx.subledgerCategory.set(null);
    }
  }
}
