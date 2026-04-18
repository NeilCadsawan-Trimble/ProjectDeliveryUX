import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { CollapsibleSubnavComponent } from '../project-dashboard/components/collapsible-subnav.component';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import { FINANCIALS_FRANK_LAYOUT } from '../../data/layout-seeds/financials-frank.layout';
import { FINANCIALS_BERT_LAYOUT } from '../../data/layout-seeds/financials-bert.layout';
import { FINANCIALS_KELLY_LAYOUT } from '../../data/layout-seeds/financials-kelly.layout';
import { FINANCIALS_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/financials-dominique.layout';
import { FINANCIALS_PAMELA_LAYOUT } from '../../data/layout-seeds/financials-pamela.layout';
import type { LayoutSeed } from '../../data/layout-seeds/layout-seed.types';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';
import { getPersonaNav } from '../../data/persona-nav.config';
import { DataStoreService } from '../../data/data-store.service';
import type { DashboardWidgetId, Project, Estimate, RevenueTimeRange, RevenueDataPoint, JobCostCategory, ProjectJobCost, ChangeOrder, ChangeOrderType, Invoice, BillingSchedule, BillingEvent, Payable, CashFlowEntry, GLAccount, GLEntry, PurchaseOrder, PayrollRecord, Contract, SubcontractLedgerEntry } from '../../data/dashboard-data.types';
import { JOB_COST_CATEGORIES } from '../../data/dashboard-data.types';
import { CATEGORY_COLORS } from '../../data/dashboard-data.seed';
import { budgetProgressClass, estimateBadgeColor, dueDateClass, getRevenueData, getRevenueSummary, getJobCostSummary, coBadgeColor, coTypeLabel, formatCurrency as sharedFormatCurrency, getInvoiceAgingBuckets, getDSO, invoiceStatusBadge, getUpcomingBillings, billingFrequencyLabel, getPayablesSummary, payableStatusBadge, getCashRunway, getCashFlowTrend, getGLBalanceSheet, getPOSummary, poStatusBadge, getPayrollSummary, getMonthlyPayrollTotals, payrollStatusBadge, getContractSummary, getSubcontractLedgerSummary, contractStatusBadge, contractTypeLabel, contractTypeLabelShort, ledgerTypeBadge, ledgerTypeLabel, formatJobCost as sharedFormatJobCost, capitalizeFirst as sharedCapitalizeFirst } from '../../data/dashboard-data.formatters';
import { getAgent, type AgentAlert, type AgentDataState } from '../../data/widget-agents';
import { FINANCIALS_WIDGETS, KELLY_FINANCIALS_WIDGETS, PAMELA_FINANCIALS_WIDGETS } from '../../data/widget-registrations';
import { ChartComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { HomeInvoiceQueueComponent } from '../home-page/components/home-invoice-queue.component';
import { HomeVendorAgingComponent } from '../home-page/components/home-vendor-aging.component';
import { HomePayAppsComponent, type PayAppsView } from '../home-page/components/home-pay-apps.component';
import { HomeLienWaiversComponent } from '../home-page/components/home-lien-waivers.component';
import { HomeRetentionComponent } from '../home-page/components/home-retention.component';
import { HomePaymentScheduleComponent } from '../home-page/components/home-payment-schedule.component';
import { HomeApActivityComponent } from '../home-page/components/home-ap-activity.component';
import { HomeApKpiCardsComponent, type ApKpiCard } from '../home-page/components/home-ap-kpi-cards.component';
import { HomeCashOutflowComponent } from '../home-page/components/home-cash-outflow.component';
import { EstimateAssemblyHubComponent } from './components/estimate-assembly-hub.component';
import { ESTIMATE_ASSEMBLY_HUBS } from '../../data/dashboard-data.seed';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

type FinDetailType =
  | 'estimate' | 'changeOrder' | 'invoice' | 'payable' | 'purchaseOrder'
  | 'contract' | 'billingEvent' | 'payrollRecord' | 'payrollMonthly'
  | 'subcontractLedger' | 'glEntry' | 'glAccount' | 'cashFlow';

interface FinDetailMeta {
  title: string;
  subtitle: string;
  icon: string;
  status?: string;
  statusColor?: ModusBadgeColor;
  fields: Array<{ label: string; value: string; highlight?: boolean }>;
}

const ROUTE_TO_DETAIL: Record<string, { subPage: string; paramKey: string; type: FinDetailType }> = {
  'change-orders': { subPage: 'change-orders', paramKey: 'id', type: 'changeOrder' },
  'estimates': { subPage: 'estimates', paramKey: 'id', type: 'estimate' },
  'invoices': { subPage: 'accounts-receivable', paramKey: 'id', type: 'invoice' },
  'payables': { subPage: 'accounts-payable', paramKey: 'id', type: 'payable' },
  'purchase-orders': { subPage: 'purchase-orders', paramKey: 'id', type: 'purchaseOrder' },
  'contracts': { subPage: 'contracts', paramKey: 'id', type: 'contract' },
  'billing': { subPage: 'job-billing', paramKey: 'id', type: 'billingEvent' },
  'payroll': { subPage: 'payroll', paramKey: 'id', type: 'payrollRecord' },
  'payroll-monthly': { subPage: 'payroll', paramKey: 'month', type: 'payrollMonthly' },
  'subcontract-ledger': { subPage: 'subcontract-ledger', paramKey: 'id', type: 'subcontractLedger' },
  'gl-entries': { subPage: 'general-ledger', paramKey: 'id', type: 'glEntry' },
  'gl-accounts': { subPage: 'general-ledger', paramKey: 'code', type: 'glAccount' },
  'cash-flow': { subPage: 'cash-management', paramKey: 'month', type: 'cashFlow' },
};

// ── Area-adaptive block system ──────────────────────────────────
// Pixel costs for optional content blocks within financials widgets.
// Priority-based packing: blocks are added in order until the height
// budget is exhausted; remaining blocks are simply not rendered.
const FIN_HEADER_PX = 56;
const FIN_INSIGHT_PX = 32;
const FIN_COL_HEADERS_PX = 36;
const FIN_TAB_STRIP_PX = 42;
const FIN_KPI_LINE_PX = 52;
const FIN_BAR_CHART_PX = 36;
const FIN_CATEGORY_CARDS_PX = 108;
const FIN_KELLY_KPI_PX = 48;
const FIN_PAMELA_KPI_PX = 50;
const FIN_DEFAULT_KPI_PX = 90;
const FIN_MIN_TABLE_PX = 100;
const FIN_MIN_CHART_PX = 200;
const FIN_MIN_CHILD_PX = 80;

@Component({
  selector: 'app-financials-page',
  imports: [NgTemplateOutlet, ModusProgressComponent, ModusButtonComponent, ModusBadgeComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent, CollapsibleSubnavComponent, ChartComponent, HomeInvoiceQueueComponent, HomeVendorAgingComponent, HomePayAppsComponent, HomeLienWaiversComponent, HomeRetentionComponent, HomePaymentScheduleComponent, HomeApActivityComponent, HomeApKpiCardsComponent, HomeCashOutflowComponent, EstimateAssemblyHubComponent, ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block h-full',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <ng-template #finSubpageToolbar let-placeholder>
      <div class="bg-card border-default rounded-lg mb-6 relative">
        <div class="flex items-center justify-between px-4 py-2 gap-4">
          @if (isMobile()) {
            <div class="flex items-center gap-1">
              <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150"
                [class]="finMobileSearchOpen() ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground-60'"
                role="button" tabindex="0" aria-label="Search"
                (click)="finMobileSearchOpen.set(!finMobileSearchOpen())">
                <i class="modus-icons text-base" aria-hidden="true">search</i>
              </div>
              <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-secondary transition-colors duration-150"
                role="button" tabindex="0" aria-label="Filter">
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">filter</i>
              </div>
            </div>
          } @else {
          <div class="flex items-center gap-2 flex-1 max-w-xs">
            <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5 flex-1">
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">search</i>
              <input type="text" class="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-40 w-full"
                [placeholder]="placeholder" [value]="finSubpageSearch()" (input)="finSubpageSearch.set($any($event.target).value)" />
            </div>
            <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer hover:bg-secondary transition-colors duration-150"
              role="button" tabindex="0" aria-label="Filter">
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">filter</i>
            </div>
          </div>
          }
          <div class="flex items-center gap-1">
            <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
              role="button" tabindex="0" aria-label="Sort">
              <i class="modus-icons text-base" aria-hidden="true">sort_arrow_down</i>
            </div>
            <div class="flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors duration-150 hover:bg-secondary text-foreground-60"
              role="button" tabindex="0" aria-label="Download">
              <i class="modus-icons text-base" aria-hidden="true">download</i>
            </div>
          </div>
        </div>
        @if (isMobile() && finMobileSearchOpen()) {
          <div class="absolute right-0 top-full z-50 bg-card border-default rounded-lg shadow-lg p-3 -mt-2"
            [style.left.px]="isMobile() || finSubnavCollapsed() ? -227 : 0">
            <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5">
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">search</i>
              <input type="text" class="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-40 w-full"
                [placeholder]="placeholder" [value]="finSubpageSearch()" (input)="finSubpageSearch.set($any($event.target).value)" />
              @if (finSubpageSearch()) {
                <div class="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer hover:bg-muted transition-colors duration-150"
                  role="button" tabindex="0" aria-label="Clear search"
                  (click)="finSubpageSearch.set('')">
                  <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">close</i>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>

    @if (jobCostDetailProject(); as project) {
      <!-- Job Cost Detail View -->
      <div [class]="isCanvasMode() ? 'py-4 md:py-6' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex flex-col">
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ project.projectName }}</modus-typography>
            <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ project.client }}</modus-typography>
          </div>
        </div>

        <!-- Budget overview row -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-base text-primary" aria-hidden="true">payment_instant</i>
              </div>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Total Budget</modus-typography>
            </div>
            <modus-typography  hierarchy="p" size="3xl" weight="bold" className="text-foreground">{{ project.budgetTotal }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-warning-20 flex items-center justify-center">
                <i class="modus-icons text-base text-warning" aria-hidden="true">bar_graph_line</i>
              </div>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Total Spent</modus-typography>
            </div>
            <modus-typography  hierarchy="p" size="3xl" weight="bold" className="text-foreground">{{ project.budgetUsed }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" weight="semibold" className="{{ project.budgetPct >= 90 ? 'text-destructive' : project.budgetPct >= 75 ? 'text-warning' : 'text-success' }}">{{ project.budgetPct }}% of budget</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-success-20 flex items-center justify-center">
                <i class="modus-icons text-base text-success" aria-hidden="true">bar_graph</i>
              </div>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Remaining</modus-typography>
            </div>
            <modus-typography  hierarchy="p" size="3xl" weight="bold" className="text-success">{{ formatJobCost(detailBudgetInfo().remaining) }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-success">{{ 100 - project.budgetPct }}% remaining</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">dashboard</i>
              </div>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Budget Health</modus-typography>
            </div>
            <div class="w-full mt-1">
              <modus-progress [value]="project.budgetPct" [max]="100" [className]="budgetProgressClass(project.budgetPct)" />
            </div>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ project.budgetUsed }} of {{ project.budgetTotal }} used</modus-typography>
          </div>
        </div>
        @if (jobCostKpiInsight()) {
          <div class="flex items-center gap-1.5 px-5 py-2 mb-6 bg-card border-default rounded-lg">
            <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ jobCostKpiInsight() }}</modus-typography>
          </div>
        } @else {
          <div class="mb-2"></div>
        }

        <!-- Cost breakdown card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">bar_graph</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Cost Breakdown</modus-typography>
          </div>

          <div class="px-5 py-5 flex flex-col gap-5">
            <!-- Stacked bar -->
            <div class="flex flex-col gap-2">
              <div class="flex w-full h-5 rounded-full overflow-hidden">
                @for (cat of detailCategories(); track cat.label) {
                  <div class="{{ cat.colorClass }}" [style.width.%]="cat.pctOfSpend"></div>
                }
              </div>
              <div class="flex items-center justify-between text-foreground-40">
                <modus-typography size="xs" className="text-2xs">0%</modus-typography>
                <modus-typography size="xs" className="text-2xs">{{ formatJobCost(detailBudgetInfo().spent) }} total spend</modus-typography>
                <modus-typography size="xs" className="text-2xs">100%</modus-typography>
              </div>
            </div>

            <!-- Category detail cards -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              @for (cat of detailCategories(); track cat.label) {
                <div class="flex flex-col gap-3 p-4 bg-background border-default rounded-lg">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                    <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">{{ cat.label }}</modus-typography>
                  </div>
                  <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatJobCost(cat.amount) }}</modus-typography>
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">% of spend</modus-typography>
                      <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground">{{ cat.pctOfSpend }}%</modus-typography>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfSpend"></div>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">% of budget</modus-typography>
                      <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground">{{ cat.pctOfBudget }}%</modus-typography>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div class="{{ cat.colorClass }} h-full rounded-full transition-all duration-300" [style.width.%]="cat.pctOfBudget"></div>
                    </div>
                  </div>
                  <div class="border-top-default pt-2 mt-1">
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-40">Portfolio avg</modus-typography>
                      <modus-typography size="xs" className="text-foreground-60">{{ cat.portfolioAvgPct }}%</modus-typography>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Profit Fade/Gain widget -->
        @if (profitFadeData(); as pf) {
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">arrow_up</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Profit Fade / Gain</modus-typography>
            </div>
            <div class="flex items-center gap-2">
              <modus-typography  hierarchy="p" size="xs" weight="semibold" className="px-2.5 py-1 rounded-full {{ pf.isFade ? 'bg-destructive-20 text-destructive' : 'bg-success-20 text-success' }}">
                {{ pf.isFade ? 'Fade' : 'Gain' }} {{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%
              </modus-typography>
            </div>
          </div>

          <div class="px-5 py-5 flex flex-col gap-5">
            <!-- KPI row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 uppercase tracking-wide">Original Estimate</modus-typography>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ pf.originalMargin }}%</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Bid margin</modus-typography>
              </div>
              <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 uppercase tracking-wide">Current Projected</modus-typography>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="{{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.currentMargin }}%</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Based on costs to date</modus-typography>
              </div>
              <div class="flex flex-col gap-1 p-4 bg-background border-default rounded-lg">
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 uppercase tracking-wide">{{ pf.isFade ? 'Profit Fade' : 'Profit Gain' }}</modus-typography>
                <div class="flex items-center gap-2">
                  <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'arrow_down' : 'arrow_up' }}</i>
                  <modus-typography  hierarchy="p" size="2xl" weight="bold" className="{{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ pf.isFade ? 'Below original estimate' : 'Above original estimate' }}</modus-typography>
              </div>
            </div>

            <!-- Chart -->
            <div class="relative pl-9 pb-5">
              <svg class="w-full h-40" [attr.viewBox]="'0 0 ' + pfW + ' ' + pfH" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                    @if (profitFadeData()?.isFade) {
                      <stop offset="0%" class="pf-gradient-fade-end" />
                      <stop offset="100%" class="pf-gradient-fade-start" />
                    } @else {
                      <stop offset="0%" class="pf-gradient-gain-start" />
                      <stop offset="100%" class="pf-gradient-gain-end" />
                    }
                  </linearGradient>
                </defs>

                @for (line of pfGridLines(); track line.y) {
                  <line [attr.x1]="0" [attr.y1]="line.y" [attr.x2]="pfW" [attr.y2]="line.y" class="chart-grid-line" />
                }

                <line [attr.x1]="pfPadX" [attr.y1]="pfBaselineY()" [attr.x2]="pfW - pfPadX" [attr.y2]="pfBaselineY()" class="pf-baseline" />

                <path [attr.d]="pfAreaPath()" fill="url(#pfGrad)" />
                <path [attr.d]="pfLinePath()" [class]="pf.isFade ? 'pf-line-fade' : 'pf-line-gain'" />

                @for (pt of pfChartPoints(); track pt.x) {
                  <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" [class]="pf.isFade ? 'pf-dot-fade' : 'pf-dot-gain'" />
                }
              </svg>

              <div class="absolute bottom-0 left-9 right-0 text-foreground-40" style="position:relative">
                @for (lbl of pfMonthLabels(); track lbl.pct) {
                  <modus-typography size="xs" className="text-2xs absolute" [style.left.%]="lbl.pct" style="transform:translateX(-50%)">{{ lbl.text }}</modus-typography>
                }
              </div>

              <div class="absolute top-0 left-0 bottom-5 flex flex-col justify-between text-foreground-40">
                @for (line of pfGridLines(); track line.y) {
                  <modus-typography size="xs" className="text-2xs">{{ line.label }}</modus-typography>
                }
              </div>

              <modus-typography size="xs" weight="semibold" className="text-2xs absolute text-foreground-60" style="right:4px" [style.top.px]="pfBaselineY() - 14">
                Est. {{ pf.originalMargin }}%
              </modus-typography>
            </div>

            <!-- Category-level fade attribution -->
            <div class="flex flex-col gap-3">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">Fade / Gain by Category</modus-typography>
              <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                @for (cf of pfCategoryFade(); track cf.label) {
                  <div class="flex flex-col gap-2 p-3 bg-background border-default rounded-lg">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2.5 h-2.5 rounded-full {{ cf.colorClass }} flex-shrink-0"></div>
                      <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">{{ cf.label }}</modus-typography>
                    </div>
                    <div class="flex items-center gap-1">
                      <i class="modus-icons text-sm {{ cf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ cf.isFade ? 'arrow_down' : 'arrow_up' }}</i>
                      <modus-typography  hierarchy="p" size="sm" weight="bold" className="{{ cf.isFade ? 'text-destructive' : 'text-success' }}">{{ cf.isFade ? '' : '+' }}{{ cf.fadeAmount }}%</modus-typography>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
        }

        <!-- Budget vs Cost comparison table -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Cost Summary</modus-typography>
          </div>

          <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide" role="row">
            <modus-typography size="xs" weight="semibold" role="columnheader">Category</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">Amount</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">% of Spend</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">% of Budget</modus-typography>
          </div>

          <div role="table" aria-label="Cost summary">
            @for (cat of detailCategories(); track cat.label) {
              <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                <div class="flex items-center gap-2" role="cell">
                  <div class="w-2.5 h-2.5 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ cat.label }}</modus-typography>
                </div>
                <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right" role="cell">{{ formatJobCost(cat.amount) }}</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-right" role="cell">{{ cat.pctOfSpend }}%</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-right" role="cell">{{ cat.pctOfBudget }}%</modus-typography>
              </div>
            }
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted items-center" role="row">
              <modus-typography hierarchy="p" size="sm" weight="bold" className="text-foreground" role="cell">Total</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="bold" className="text-foreground text-right" role="cell">{{ formatJobCost(detailBudgetInfo().spent) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="bold" className="text-foreground text-right" role="cell">100%</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="bold" className="text-foreground text-right" role="cell">{{ project.budgetPct }}%</modus-typography>
            </div>
          </div>
        </div>
      </div>
    } @else if (finDetailMeta(); as meta) {
      <div [class]="isCanvasMode() ? 'py-4 md:py-6' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
        <div class="flex items-center gap-3 mb-6">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-20 flex-shrink-0">
            <i class="modus-icons text-lg text-primary" aria-hidden="true">{{ meta.icon }}</i>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-3">
              <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground truncate">{{ meta.title }}</modus-typography>
              @if (meta.status) {
                <modus-badge [color]="meta.statusColor ?? 'secondary'" size="sm">{{ meta.status }}</modus-badge>
              }
            </div>
            <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ meta.subtitle }}</modus-typography>
          </div>
        </div>

        @if (isEldoradoEstimate()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <!-- Project Estimate -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground mb-2">Project Estimate</modus-typography>
              <div class="flex gap-6 flex-wrap text-foreground-60 uppercase tracking-wide">
                <modus-typography size="xs" weight="semibold" className="text-2xs">Actual</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-2xs">Proposal Cost</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-2xs">Estimated Profit Margin</modus-typography>
              </div>
              <div class="flex items-baseline gap-6 flex-wrap">
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">$6,000,000</modus-typography>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">$8,200,000</modus-typography>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">26.83%</modus-typography>
              </div>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">calendar</i> <modus-typography size="xs">Updated July 3, 2026</modus-typography></div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">dashboard</i> <modus-typography size="xs">Confidence: 91%</modus-typography></div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">bar_graph_line</i> <modus-typography size="xs">Complexity: 87%</modus-typography></div>
                </div>
                <div>
                  <modus-button variant="outlined" size="sm" color="primary">Check Estimation</modus-button>
                </div>
              </div>
            </div>

            <!-- Bid Intelligence -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <div class="flex items-center justify-between mb-2">
                <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Bid Intelligence</modus-typography>
                <modus-badge color="warning" size="sm">Medium</modus-badge>
              </div>
              <modus-typography className="text-2xs invisible">&#8203;</modus-typography>
              <div class="flex items-baseline gap-2">
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">78%</modus-typography>
                <modus-typography  hierarchy="p" size="md" className="text-foreground-60">win probability</modus-typography>
              </div>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">people_group</i> <modus-typography size="xs">4-6 expected bidders</modus-typography></div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">auto_target</i> <modus-typography size="xs">Target: 8-12% margin</modus-typography></div>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <modus-button variant="outlined" size="sm" color="primary">View Risks</modus-button>
                  <modus-typography  hierarchy="p" size="xs" weight="semibold" className="bg-warning-20 text-warning px-3 py-1 rounded-full">Copper pricing, Seismic survey</modus-typography>
                </div>
              </div>
            </div>

            <!-- Field Intelligence -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground mb-2">Field Intelligence</modus-typography>
              <modus-typography className="text-2xs invisible">&#8203;</modus-typography>
              <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">Geotechnical ready</modus-typography>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">location</i> <modus-typography size="xs">4230 Riverside Blvd</modus-typography></div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">ruler</i> <modus-typography size="xs">32,000 ft&#178; &middot; 2 Stories</modus-typography></div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">map</i> <modus-typography size="xs">4.2 mi&#178; Lot</modus-typography></div>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <modus-button variant="outlined" size="sm" color="secondary">View Safety Risks</modus-button>
                  <modus-typography  hierarchy="p" size="xs" weight="semibold" className="bg-warning-20 text-warning px-3 py-1 rounded-full">Wetland detected - NE corner</modus-typography>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-muted">
              @for (field of meta.fields; track field.label) {
                <div class="bg-card px-5 py-4 flex flex-col gap-1">
                  <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">{{ field.label }}</modus-typography>
                  <modus-typography size="md" [weight]="field.highlight ? 'bold' : 'normal'" className="text-foreground" [class.text-primary]="field.highlight">{{ field.value }}</modus-typography>
                </div>
              }
            </div>
          </div>
        }

        @if (assemblyHub(); as hub) {
          <app-estimate-assembly-hub [hub]="hub" />
        }

        @if (isEldoradoEstimate() && isPamela()) {
          <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
            <!-- Header -->
            <div class="px-5 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <i class="modus-icons text-lg text-primary" aria-hidden="true">refresh</i>
                  <modus-typography  hierarchy="p" size="lg" weight="semibold" className="text-foreground">Live Supplier Exchange Integration</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">Real-time quote updates from integrated supplier APIs and bid exchanges</modus-typography>
              </div>
              <modus-badge color="success" size="sm">3 Active Feeds</modus-badge>
            </div>

            <!-- Supplier Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 px-5 pb-4">
              <!-- ABC Concrete Supply -->
              <div class="border-default rounded-lg p-4 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div>
                    <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">ABC Concrete Supply</modus-typography>
                    <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Div 03 - Cast-in-Place Concrete</modus-typography>
                  </div>
                  <modus-badge color="success" size="sm">API</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">$798,000</modus-typography>
                <div class="flex items-center justify-between text-foreground-60">
                  <modus-typography size="xs">Reliability: 95%</modus-typography>
                  <modus-typography size="xs">2024-02-20</modus-typography>
                </div>
                <div class="flex items-center gap-1 text-foreground-60">
                  <i class="modus-icons text-xs" aria-hidden="true">refresh</i> <modus-typography size="xs">Updated: 1 hour ago</modus-typography>
                </div>
              </div>

              <!-- Steel Reinforcing Co. -->
              <div class="border-default rounded-lg p-4 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div>
                    <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">Steel Reinforcing Co.</modus-typography>
                    <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Div 03 - Rebar</modus-typography>
                  </div>
                  <modus-badge color="success" size="sm">API</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">$268,250</modus-typography>
                <div class="flex items-center justify-between text-foreground-60">
                  <modus-typography size="xs">Reliability: 92%</modus-typography>
                  <modus-typography size="xs">2024-02-19</modus-typography>
                </div>
                <div class="flex items-center gap-1 text-foreground-60">
                  <i class="modus-icons text-xs" aria-hidden="true">refresh</i> <modus-typography size="xs">Updated: 2 hours ago</modus-typography>
                </div>
              </div>

              <!-- Premier Drywall Systems -->
              <div class="border-default rounded-lg p-4 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <div>
                    <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">Premier Drywall Systems</modus-typography>
                    <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Div 09 - Gypsum Board</modus-typography>
                  </div>
                  <modus-badge color="secondary" size="sm">Email</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">$208,250</modus-typography>
                <div class="flex items-center justify-between text-foreground-60">
                  <modus-typography size="xs">Reliability: 88%</modus-typography>
                  <modus-typography size="xs">2024-02-21</modus-typography>
                </div>
                <div class="flex items-center gap-1 text-foreground-60">
                  <i class="modus-icons text-xs" aria-hidden="true">refresh</i> <modus-typography size="xs">Updated: 3 hours ago</modus-typography>
                </div>
              </div>
            </div>

            <!-- Footer info -->
            <div class="mx-5 mb-5 bg-muted rounded-lg px-4 py-3 flex items-start gap-2">
              <i class="modus-icons text-base text-foreground-60 mt-0.5" aria-hidden="true">info</i>
              <div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">Auto-Refresh Integration</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Supplier quotes are automatically refreshed every 2 hours through API integrations with major suppliers and bid exchanges. Email quotes are parsed and integrated automatically. This ensures PMs always see the most current pricing without manual data entry.</modus-typography>
              </div>
            </div>
          </div>
        }

      </div>
    } @else if (activeSubPage() === 'overview') {
    <div [class]="isCanvasMode() ? 'py-4 md:py-6 pointer-events-none' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6 pointer-events-none' : isMobile() ? 'relative mb-6' : 'relative mb-6 widget-grid-desktop'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : (!isMobile() ? desktopGridMinHeight() : null)"
        #financialsWidgetGrid
      >
        <!-- finTitle widget (locked, full width) -->
        <div
          [class]="isCanvasMode() ? 'absolute overflow-hidden pointer-events-auto'
                 : isMobile() ? 'absolute left-0 right-0 overflow-hidden pointer-events-auto'
                 : 'overflow-hidden pointer-events-auto'"
          [attr.data-widget-id]="'finTitle'"
          [style.grid-column]="!isMobile() && !isCanvasMode() ? widgetGridColumns()['finTitle'] : null"
          [style.grid-row]="!isMobile() && !isCanvasMode() ? '1' : null"
          [style.align-self]="!isMobile() && !isCanvasMode() ? 'start' : null"
          [style.margin-top.px]="!isMobile() && !isCanvasMode() ? widgetTops()['finTitle'] : null"
          [style.top.px]="isMobile() || isCanvasMode() ? widgetTops()['finTitle'] : null"
          [style.left.px]="isCanvasMode() ? widgetLefts()['finTitle'] : null"
          [style.width.px]="isCanvasMode() ? widgetPixelWidths()['finTitle'] : null"
          [style.height.px]="widgetHeights()['finTitle']"
          [style.z-index]="widgetZIndices()['finTitle']"
        >
          <div class="flex items-start justify-between">
            <div>
              <modus-typography hierarchy="h1" size="3xl" weight="bold" className="text-foreground" role="heading" aria-level="1">Financials Dashboard</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 mt-1">{{ today }}</modus-typography>
            </div>
            <div class="flex-shrink-0">
              <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
            </div>
          </div>
        </div>

        <!-- finNavKpi widget (locked, 8 cols) -->
        <div
          [class]="isCanvasMode() ? 'absolute overflow-hidden pointer-events-auto'
                 : isMobile() ? 'absolute left-0 right-0 overflow-hidden pointer-events-auto'
                 : 'overflow-hidden pointer-events-auto'"
          [attr.data-widget-id]="'finNavKpi'"
          [style.grid-column]="!isMobile() && !isCanvasMode() ? widgetGridColumns()['finNavKpi'] : null"
          [style.grid-row]="!isMobile() && !isCanvasMode() ? '1' : null"
          [style.align-self]="!isMobile() && !isCanvasMode() ? 'start' : null"
          [style.margin-top.px]="!isMobile() && !isCanvasMode() ? widgetTops()['finNavKpi'] : null"
          [style.top.px]="isMobile() || isCanvasMode() ? widgetTops()['finNavKpi'] : null"
          [style.left.px]="isCanvasMode() ? widgetLefts()['finNavKpi'] : null"
          [style.width.px]="isCanvasMode() ? widgetPixelWidths()['finNavKpi'] : null"
          [style.height.px]="widgetHeights()['finNavKpi']"
          [style.z-index]="widgetZIndices()['finNavKpi']"
        >
          <div class="flex items-stretch gap-4 h-full">
            <!-- NavLinks -->
            <div class="bg-card border-default rounded-lg flex-shrink-0 overflow-hidden flex flex-col w-[227px]">
              <div class="flex items-center justify-between px-4 py-3 border-bottom-default flex-shrink-0">
                <div class="flex items-center gap-2 min-w-0">
                  <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">payment_instant</i>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">Financials</modus-typography>
                </div>
                @if (navLinkTotalAlerts() > 0) {
                  <div class="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 mr-1"
                    [class.bg-destructive]="navLinkHasCriticalAlerts()"
                    [class.bg-warning]="!navLinkHasCriticalAlerts()">
                    <modus-typography size="xs" weight="bold" [className]="'text-2xs ' + (navLinkHasCriticalAlerts() ? 'text-destructive-foreground' : 'text-warning-foreground')">{{ navLinkTotalAlerts() }}</modus-typography>
                  </div>
                }
              </div>
              <div class="py-1 flex-1 overflow-y-auto">
                @for (item of finNavLinkItems(); track item.value) {
                  <div
                    class="flex items-center justify-between py-1.5 cursor-pointer transition-colors duration-150 whitespace-nowrap"
                    [class.bg-primary]="activeSubPage() === item.value"
                    [class.text-primary-foreground]="activeSubPage() === item.value"
                    [class.rounded-md]="activeSubPage() === item.value"
                    [class.mx-2]="activeSubPage() === item.value"
                    [class.px-2]="activeSubPage() === item.value"
                    [class.px-4]="activeSubPage() !== item.value"
                    [class.text-foreground]="activeSubPage() !== item.value"
                    [class.hover:bg-muted]="activeSubPage() !== item.value"
                    tabindex="0"
                    (click)="selectSubPageFromNavLinks(item.value)"
                    (keydown.enter)="selectSubPageFromNavLinks(item.value)"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      @if (item.icon) {
                        <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true"
                          [class.text-primary-foreground]="activeSubPage() === item.value"
                          [class.text-foreground-60]="activeSubPage() !== item.value"
                        >{{ item.icon }}</i>
                      }
                      <modus-typography size="sm" [weight]="activeSubPage() === item.value ? 'semibold' : 'normal'" className="truncate">{{ item.label }}</modus-typography>
                    </div>
                    @if (finSubnavAlerts()[item.value]; as alert) {
                      <div class="flex-shrink-0 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 mr-1"
                        [class.bg-destructive]="alert.level === 'critical'"
                        [class.bg-warning]="alert.level === 'warning'"
                        [class.bg-primary]="alert.level === 'info'"
                        [attr.title]="alert.count + ' ' + alert.label">
                        <modus-typography size="xs" weight="bold" [className]="'text-2xs ' + (alert.level === 'critical' ? 'text-destructive-foreground' : alert.level === 'warning' ? 'text-warning-foreground' : 'text-primary-foreground')">{{ alert.count }}</modus-typography>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            @if (isPamela()) {
            <div class="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden">
              @if (showFinBlock('finNavKpi', 'kpi1')) {
              <div class="bg-card border-default rounded-lg px-4 py-2.5 flex items-center gap-3">
                <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  [class.bg-success-20]="pipelineColor() === 'success'"
                  [class.bg-warning-20]="pipelineColor() === 'warning'"
                  [class.bg-destructive-20]="pipelineColor() === 'destructive'">
                  <i class="modus-icons text-base" aria-hidden="true"
                    [class.text-success]="pipelineColor() === 'success'"
                    [class.text-warning]="pipelineColor() === 'warning'"
                    [class.text-destructive]="pipelineColor() === 'destructive'">bar_graph</i>
                </div>
                <div class="min-w-0">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Pipeline Value</modus-typography>
                  <modus-typography hierarchy="p" size="lg" weight="bold" className="leading-tight"
                    [class.text-success]="pipelineColor() === 'success'"
                    [class.text-warning]="pipelineColor() === 'warning'"
                    [class.text-destructive]="pipelineColor() === 'destructive'">{{ fmtCurrency(pamelaEstPipeline()) }}</modus-typography>
                </div>
                <modus-typography class="ml-auto flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-60">{{ pamelaOpenCount() }} open / {{ pamelaProjectCount() }} projects</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'kpi2')) {
              <div class="bg-card border-default rounded-lg px-4 py-2.5 flex items-center gap-3">
                <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  [class.bg-success-20]="winRateColor() === 'success'"
                  [class.bg-warning-20]="winRateColor() === 'warning'"
                  [class.bg-destructive-20]="winRateColor() === 'destructive'">
                  <i class="modus-icons text-base" aria-hidden="true"
                    [class.text-success]="winRateColor() === 'success'"
                    [class.text-warning]="winRateColor() === 'warning'"
                    [class.text-destructive]="winRateColor() === 'destructive'">check_circle</i>
                </div>
                <div class="min-w-0">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Win Rate</modus-typography>
                  <modus-typography hierarchy="p" size="lg" weight="bold" className="leading-tight"
                    [class.text-success]="winRateColor() === 'success'"
                    [class.text-warning]="winRateColor() === 'warning'"
                    [class.text-destructive]="winRateColor() === 'destructive'">{{ pamelaWinRate() }}%</modus-typography>
                </div>
                <modus-typography class="ml-auto flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-60">{{ estimatesApprovedCount() }} approved of {{ estimates().length }}</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'kpi3')) {
              <div class="bg-card border-default rounded-lg px-4 py-2.5 flex items-center gap-3">
                <div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  [class.bg-success-20]="overdueColor() === 'success'"
                  [class.bg-warning-20]="overdueColor() === 'warning'"
                  [class.bg-destructive-20]="overdueColor() === 'destructive'">
                  <i class="modus-icons text-base" aria-hidden="true"
                    [class.text-success]="overdueColor() === 'success'"
                    [class.text-warning]="overdueColor() === 'warning'"
                    [class.text-destructive]="overdueColor() === 'destructive'">{{ estimatesOverdueCount() > 0 ? 'warning' : 'check_circle' }}</i>
                </div>
                <div class="min-w-0">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Overdue Estimates</modus-typography>
                  <modus-typography hierarchy="p" size="lg" weight="bold" className="leading-tight"
                    [class.text-success]="overdueColor() === 'success'"
                    [class.text-warning]="overdueColor() === 'warning'"
                    [class.text-destructive]="overdueColor() === 'destructive'">{{ estimatesOverdueCount() }}</modus-typography>
                </div>
                <modus-typography class="ml-auto flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-60">{{ estimatesUnderReviewCount() }} review, {{ pamelaAwaitingCount() }} awaiting</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'insight') && finKpiInsight()) {
                <div class="flex items-center gap-1.5 px-4 py-2 bg-card border-default rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</modus-typography>
                </div>
              }
            </div>
            } @else if (!isKelly()) {
            <div class="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
              @if (showFinBlock('finNavKpi', 'kpi1')) {
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Gross Margin</modus-typography>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="grossMarginColor() === 'success'"
                    [class.bg-warning-20]="grossMarginColor() === 'warning'"
                    [class.bg-destructive-20]="grossMarginColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="grossMarginColor() === 'success'"
                      [class.text-warning]="grossMarginColor() === 'warning'"
                      [class.text-destructive]="grossMarginColor() === 'destructive'">bar_graph_line</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <modus-typography class="flex-shrink-0" hierarchy="p" size="3xl" weight="bold"
                    [class.text-success]="grossMarginColor() === 'success'"
                    [class.text-warning]="grossMarginColor() === 'warning'"
                    [class.text-destructive]="grossMarginColor() === 'destructive'">{{ grossMarginPct() }}%</modus-typography>
                  @if (showKpiSparklines() && marginSparkline().length > 1) {
                    <div class="flex-1 min-w-0">
                      <apx-chart
                        [series]="marginChartOptions().series"
                        [chart]="marginChartOptions().chart"
                        [stroke]="marginChartOptions().stroke"
                        [fill]="marginChartOptions().fill"
                        [colors]="marginChartOptions().colors"
                        [tooltip]="marginChartOptions().tooltip"
                      />
                    </div>
                  }
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ fmtCurrency(grossProfit()) }} gross profit across {{ totalProjects() }} projects</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'kpi2')) {
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Cash Runway</modus-typography>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="cashRunwayColor() === 'success'"
                    [class.bg-warning-20]="cashRunwayColor() === 'warning'"
                    [class.bg-destructive-20]="cashRunwayColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="cashRunwayColor() === 'success'"
                      [class.text-warning]="cashRunwayColor() === 'warning'"
                      [class.text-destructive]="cashRunwayColor() === 'destructive'">clock</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <modus-typography class="flex-shrink-0" hierarchy="p" size="3xl" weight="bold"
                    [class.text-success]="cashRunwayColor() === 'success'"
                    [class.text-warning]="cashRunwayColor() === 'warning'"
                    [class.text-destructive]="cashRunwayColor() === 'destructive'">{{ cashRunwayMonths() }} mo</modus-typography>
                  @if (showKpiSparklines() && runwaySparkline().length > 1) {
                    <div class="flex-1 min-w-0">
                      <apx-chart
                        [series]="runwayChartOptions().series"
                        [chart]="runwayChartOptions().chart"
                        [stroke]="runwayChartOptions().stroke"
                        [fill]="runwayChartOptions().fill"
                        [colors]="runwayChartOptions().colors"
                        [tooltip]="runwayChartOptions().tooltip"
                      />
                    </div>
                  }
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ fmtCurrency(cashBalance()) }} balance / {{ fmtCurrency(monthlyBurn()) }} monthly burn</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'kpi3')) {
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground-60">Accounts Receivable</modus-typography>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="arColor() === 'success'"
                    [class.bg-warning-20]="arColor() === 'warning'"
                    [class.bg-destructive-20]="arColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="arColor() === 'success'"
                      [class.text-warning]="arColor() === 'warning'"
                      [class.text-destructive]="arColor() === 'destructive'">invoice</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <modus-typography class="flex-shrink-0" hierarchy="p" size="3xl" weight="bold"
                    [class.text-success]="arColor() === 'success'"
                    [class.text-warning]="arColor() === 'warning'"
                    [class.text-destructive]="arColor() === 'destructive'">{{ fmtCurrency(totalOutstandingAR()) }}</modus-typography>
                  @if (showKpiSparklines() && arSparkline().length > 1) {
                    <div class="flex-1 min-w-0">
                      <apx-chart
                        [series]="arChartOptions().series"
                        [chart]="arChartOptions().chart"
                        [stroke]="arChartOptions().stroke"
                        [fill]="arChartOptions().fill"
                        [colors]="arChartOptions().colors"
                        [tooltip]="arChartOptions().tooltip"
                      />
                    </div>
                  }
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">DSO {{ dso() }} days @if (overdueInvoiceCount() > 0) { -- {{ overdueInvoiceCount() }} overdue }</modus-typography>
              </div>
              }
              @if (showFinBlock('finNavKpi', 'insight') && finKpiInsight()) {
                <div class="flex items-center gap-1.5 px-5 py-2 bg-card border-default rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</modus-typography>
                </div>
              }
            </div>
            } @else {
            <div class="flex-1 min-w-0 flex flex-col gap-2 px-3 pb-3 overflow-y-auto">
              <app-home-ap-kpi-cards [cards]="kellyVisibleKpiCards()" />
              @if (showFinBlock('finNavKpi', 'insight') && kellyApKpisInsight()) {
                <div class="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyApKpisInsight() }}</modus-typography>
                </div>
              }
            </div>
            }
          </div>
        </div>

        @for (widgetId of financialsWidgets(); track widgetId) {
          <div
            [class]="isCanvasMode() ? 'absolute overflow-hidden pointer-events-auto'
                   : isMobile() ? 'absolute left-0 right-0 overflow-hidden pointer-events-auto'
                   : moveTargetId() === widgetId ? 'absolute overflow-hidden pointer-events-auto'
                   : 'overflow-hidden pointer-events-auto'"
            [attr.data-widget-id]="widgetId"
            [style.grid-column]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? widgetGridColumns()[widgetId] : null"
            [style.grid-row]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? '1' : null"
            [style.align-self]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? 'start' : null"
            [style.margin-top.px]="!isMobile() && !isCanvasMode() && moveTargetId() !== widgetId ? widgetTops()[widgetId] : null"
            [style.top.px]="isMobile() || isCanvasMode() || moveTargetId() === widgetId ? widgetTops()[widgetId] : null"
            [style.left.px]="isCanvasMode() || moveTargetId() === widgetId ? widgetLefts()[widgetId] : null"
            [style.width.px]="isCanvasMode() ? widgetPixelWidths()[widgetId] : (moveTargetId() === widgetId ? dragWidth() : null)"
            [style.height.px]="widgetHeights()[widgetId]"
            [style.z-index]="widgetZIndices()[widgetId]"
          >
            <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">
              <widget-lock-toggle [locked]="widgetLocked()[widgetId]" (toggle)="toggleWidgetLock(widgetId)" />

              @if (widgetId === 'finRevenueChart') {
                <!-- Revenue Over Time Widget -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">bar_graph_line</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Revenue Over Time</modus-typography>
                    </div>
                    <div class="flex items-center gap-2" (mousedown)="$event.stopPropagation()">
                      @for (range of timeRanges; track range) {
                        <div
                          class="px-2.5 py-1 rounded cursor-pointer transition-colors duration-150 select-none"
                          [class.bg-primary]="selectedRange() === range"
                          [class.text-primary-foreground]="selectedRange() === range"
                          [class.text-foreground-60]="selectedRange() !== range"
                          [class.hover:bg-muted]="selectedRange() !== range"
                          (click)="selectRange(range); $event.stopPropagation()"
                          role="button" tabindex="0"
                          [attr.aria-label]="range + ' time range'"
                          [attr.aria-pressed]="selectedRange() === range"
                        ><modus-typography size="xs" weight="semibold">{{ range }}</modus-typography></div>
                      }
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && revenueInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ revenueInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="flex-1 flex flex-col px-5 py-4 gap-3 min-h-0">
                    @if (showFinBlock(widgetId, 'kpiLine')) {
                    <div class="flex items-baseline gap-3">
                      <modus-typography  hierarchy="p" size="3xl" weight="bold" className="text-foreground">{{ formatCurrency(revenueSummary().current) }}</modus-typography>
                      <div class="flex items-center gap-1 text-success">
                        <i class="modus-icons text-sm" aria-hidden="true">arrow_up</i>
                        <modus-typography size="sm" weight="semibold">+{{ revenueSummary().growthPct }}%</modus-typography>
                      </div>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ revenueSummary().label }}</modus-typography>
                    </div>
                    }

                    <div class="flex-1 min-h-0 px-2 pb-2">
                      <apx-chart
                        [series]="revenueChartOptions().series"
                        [chart]="revenueChartOptions().chart"
                        [xaxis]="revenueChartOptions().xaxis"
                        [yaxis]="revenueChartOptions().yaxis"
                        [stroke]="revenueChartOptions().stroke"
                        [fill]="revenueChartOptions().fill"
                        [colors]="revenueChartOptions().colors"
                        [grid]="revenueChartOptions().grid"
                        [tooltip]="revenueChartOptions().tooltip"
                        [markers]="revenueChartOptions().markers"
                        [annotations]="revenueChartOptions().annotations"
                        [dataLabels]="revenueChartOptions().dataLabels"
                      />
                    </div>
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />

              } @else if (widgetId === 'finOpenEstimates') {
                <!-- Open Estimates Widget -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId" #estimatesContainer>
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">description</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Open Estimates</modus-typography>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ estimates().length }} estimates</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && estimatesInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ estimatesInsight() }}</modus-typography>
                    </div>
                  }
                  <div
                    role="row"
                    class="grid gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0"
                    [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                  >
                    @if (!estimatesXXNarrow()) {
                      <modus-typography size="xs" weight="semibold" role="columnheader">ID</modus-typography>
                    }
                    <modus-typography size="xs" weight="semibold" role="columnheader">Project / Client</modus-typography>
                    @if (!estimatesXNarrow()) {
                      <modus-typography size="xs" weight="semibold" role="columnheader">Type</modus-typography>
                    }
                    @if (!estimatesUltraNarrow()) {
                      <modus-typography size="xs" weight="semibold" role="columnheader">Value</modus-typography>
                    }
                    <modus-typography size="xs" weight="semibold" role="columnheader">Status</modus-typography>
                    @if (!estimatesNarrow()) {
                      <modus-typography size="xs" weight="semibold" role="columnheader">Requested By</modus-typography>
                    }
                    <modus-typography size="xs" weight="semibold" role="columnheader">Due Date</modus-typography>
                  </div>
                  <div class="overflow-y-auto flex-1" role="table" aria-label="Open estimates">
                    @for (estimate of estimates(); track estimate.id) {
                      <div
                        role="row"
                        class="grid gap-3 px-5 py-4 border-bottom-default items-center last:border-b-0 hover:bg-muted transition-colors duration-150 cursor-pointer"
                        [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                        (click)="navigateToEstimate(estimate.id)"
                      >
                        @if (!estimatesXXNarrow()) {
                          <modus-typography role="cell" size="sm" weight="semibold" className="font-mono text-primary">{{ estimate.id }}</modus-typography>
                        }
                        <div role="cell">
                          <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ estimate.project }}</modus-typography>
                          <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mt-0.5 truncate">{{ estimate.client }}</modus-typography>
                        </div>
                        @if (!estimatesXNarrow()) {
                          <div role="cell">
                            <modus-typography  hierarchy="p" size="xs" className="bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ estimate.type }}</modus-typography>
                          </div>
                        }
                        @if (!estimatesUltraNarrow()) {
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground" role="cell">{{ estimate.value }}</modus-typography>
                        }
                        <div role="cell">
                          <modus-badge [color]="estimateBadgeColor(estimate.status)" size="sm">
                            {{ estimate.status }}
                          </modus-badge>
                        </div>
                        @if (!estimatesNarrow()) {
                          <div role="cell" class="flex items-center gap-2 min-w-0">
                            <modus-typography class="flex-shrink-0" size="xs" weight="semibold" className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                              {{ estimate.requestedByInitials }}
                            </modus-typography>
                            <modus-typography  hierarchy="p" size="xs" className="text-foreground-80 truncate">{{ estimate.requestedBy }}</modus-typography>
                          </div>
                        }
                        <div role="cell">
                          <modus-typography  hierarchy="p" size="sm" className="text-foreground-80">{{ estimate.dueDate }}</modus-typography>
                          <modus-typography size="xs" className="mt-0.5" [class]="dueDateClass(estimate.daysLeft)">
                            @if (estimate.daysLeft < 0) {
                              {{ -estimate.daysLeft }}d overdue
                            } @else if (estimate.daysLeft === 0) {
                              Due today
                            } @else {
                              {{ estimate.daysLeft }}d left
                            }
                          </modus-typography>
                        </div>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />
              } @else if (widgetId === 'finBudgetByProject') {
                <!-- Budget by Project Widget -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <!-- Draggable header -->
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payment_instant</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Budget by Project</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && budgetByProjectInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ budgetByProjectInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                    <modus-typography size="xs" weight="semibold" role="columnheader">Project</modus-typography>
                    <modus-typography size="xs" weight="semibold" role="columnheader">Client</modus-typography>
                    <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">Budget</modus-typography>
                    <modus-typography size="xs" weight="semibold" role="columnheader">Progress</modus-typography>
                    <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">Used</modus-typography>
                  </div>

                  <!-- Table body -->
                  <div class="overflow-y-auto flex-1" role="table" aria-label="Budget by project">
                    @for (p of projects(); track p.id) {
                      <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                        <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate" role="cell">{{ p.name }}</modus-typography>
                        <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate" role="cell">{{ p.client }}</modus-typography>
                        <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-right" role="cell">{{ p.budgetUsed }} / {{ p.budgetTotal }}</modus-typography>
                        <div class="w-full" role="cell">
                          <modus-progress [value]="p.budgetPct" [max]="100" [className]="budgetProgressClass(p.budgetPct)" />
                        </div>
                        <modus-typography size="xs" weight="semibold" className="text-right
                          {{ p.budgetPct >= 90 ? 'text-destructive' : p.budgetPct >= 75 ? 'text-warning' : 'text-success' }}" role="cell">
                          {{ p.budgetPct }}%
                        </modus-typography>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />
              } @else if (widgetId === 'finJobCosts') {
                <!-- Job Costs Widget -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">bar_graph</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Job Costs</modus-typography>
                    </div>
                    <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ formatJobCost(jobCostSummary().grandTotal) }} total</modus-typography>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && jobCostsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ jobCostsInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="overflow-y-auto flex-1">
                    @if (showFinBlock(widgetId, 'barChart')) {
                      <div class="px-5 py-4 flex flex-col gap-4 flex-shrink-0">
                        <div class="flex w-full h-4 rounded-full overflow-hidden">
                          @for (cat of jobCostSummary().categories; track cat.label) {
                            <div class="{{ cat.colorClass }}" [style.width.%]="cat.pct"></div>
                          }
                        </div>
                      </div>
                    }

                    @if (showFinBlock(widgetId, 'categoryCards')) {
                      <div class="px-5 pb-4 flex-shrink-0">
                        <div class="grid grid-cols-5 gap-3">
                          @for (cat of jobCostSummary().categories; track cat.label) {
                            <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                              <div class="flex items-center gap-1.5">
                                <div class="w-2 h-2 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                                <modus-typography className="text-2xs text-foreground-40 uppercase tracking-wide">{{ cat.label }}</modus-typography>
                              </div>
                              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatJobCost(cat.total) }}</modus-typography>
                              <modus-typography className="text-2xs text-foreground-60">{{ cat.pct }}%</modus-typography>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 bg-muted border-bottom-default border-top-default text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                      <modus-typography size="xs" weight="semibold" role="columnheader">Project</modus-typography>
                      <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">Budget</modus-typography>
                      @for (cat of jobCostCategories; track cat) {
                        <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">{{ cat }}</modus-typography>
                      }
                    </div>

                    <div role="table" aria-label="Job costs by project">
                      @for (p of projectJobCosts(); track p.projectId) {
                        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" (click)="openJobCostDetail(p)">
                          <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate" role="cell">{{ p.projectName }}</modus-typography>
                          <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-right" role="cell">{{ p.budgetUsed }}</modus-typography>
                          @for (cat of jobCostCategories; track cat) {
                            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-right" role="cell">{{ formatJobCost(getCost(p.costs, cat)) }}</modus-typography>
                          }
                        </div>
                      }
                    </div>
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />
              } @else if (widgetId === 'finChangeOrders') {
                <!-- Change Orders Widget -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">swap</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Change Orders</modus-typography>
                      <modus-badge color="secondary" size="sm">{{ filteredChangeOrders().length }}</modus-badge>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && changeOrdersInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ changeOrdersInsight() }}</modus-typography>
                    </div>
                  }

                  <div class="flex items-center gap-1 px-5 py-3 border-bottom-default flex-shrink-0">
                    @for (tab of coTabs; track tab.value) {
                      <div
                        class="px-3 py-1.5 rounded-md cursor-pointer transition-colors duration-150"
                        [class]="activeCoTab() === tab.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:bg-muted'"
                        (click)="activeCoTab.set(tab.value)"
                      ><modus-typography size="xs" weight="semibold">{{ tab.label }} ({{ coTabCount(tab.value) }})</modus-typography></div>
                    }
                  </div>

                  <div class="overflow-y-auto flex-1">
                    <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide" role="row">
                      <modus-typography size="xs" weight="semibold" role="columnheader">ID</modus-typography>
                      <modus-typography size="xs" weight="semibold" role="columnheader">Project</modus-typography>
                      <modus-typography size="xs" weight="semibold" role="columnheader">Description</modus-typography>
                      <modus-typography size="xs" weight="semibold" className="text-right" role="columnheader">Amount</modus-typography>
                      <modus-typography size="xs" weight="semibold" role="columnheader">Status</modus-typography>
                      <modus-typography size="xs" weight="semibold" role="columnheader">Date</modus-typography>
                    </div>
                    @for (co of filteredChangeOrders(); track co.id) {
                      <div
                        class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                        role="row"
                        (click)="navigateToChangeOrder(co.id)"
                      >
                        <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-primary" role="cell">{{ co.id }}</modus-typography>
                        <modus-typography hierarchy="p" size="sm" className="text-foreground truncate" role="cell">{{ co.project }}</modus-typography>
                        <modus-typography hierarchy="p" size="sm" className="text-foreground truncate" role="cell">{{ co.description }}</modus-typography>
                        <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right" role="cell">{{ formatCurrency(co.amount) }}</modus-typography>
                        <div role="cell"><modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge></div>
                        <modus-typography hierarchy="p" size="sm" className="text-foreground-60" role="cell">{{ co.requestDate }}</modus-typography>
                      </div>
                    } @empty {
                      <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
                        <modus-typography  hierarchy="p" size="sm">No change orders in this category</modus-typography>
                      </div>
                    }
                  </div>
                </div>
                <widget-resize-handle
                  [isMobile]="isMobile()"
                  (resizeStart)="startWidgetResize(widgetId, 'both', $event)"
                  (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)"
                />

              } @else if (widgetId === 'finInvoiceQueue') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-warning" aria-hidden="true">invoice</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Invoice Queue</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyInvoiceQueueInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyInvoiceQueueInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-invoice-queue [invoices]="pendingApInvoices()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finPaymentSchedule') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-destructive" aria-hidden="true">calendar</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Payment Schedule</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyPaymentScheduleInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyPaymentScheduleInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-payment-schedule [payments]="apPaymentSchedule()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finVendorAging') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-warning" aria-hidden="true">timer</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Vendor Aging</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyVendorAgingInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyVendorAgingInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-vendor-aging [vendors]="apVendors()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finPayApps') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-primary" aria-hidden="true">clipboard</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Pay Applications</modus-typography>
                    </div>
                    <div class="flex items-center gap-1 bg-muted rounded p-0.5" (mousedown)="$event.stopPropagation()" (touchstart)="$event.stopPropagation()">
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
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyPayAppsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyPayAppsInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-pay-apps
                      [payApps]="apPayApplications()"
                      [view]="payAppsView()"
                      [interactive]="true"
                      [showViewAll]="true"
                      (payAppClick)="navigateToApSubpage()"
                      (viewAllClick)="navigateToApSubpage()"
                    />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finLienWaivers') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-destructive" aria-hidden="true">file</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Lien Waivers</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyLienWaiversInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyLienWaiversInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-lien-waivers [waivers]="apLienWaivers()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finRetention') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">lock</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Retention Summary</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyRetentionInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyRetentionInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-retention [records]="apRetention()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finApActivity') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">AP Activity</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyApActivityInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyApActivityInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-ap-activity [activities]="apActivities()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />

              } @else if (widgetId === 'finCashOutflow') {
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div
                    class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                  >
                    <div class="flex items-center gap-2">
                      <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-lg text-destructive" aria-hidden="true">arrow_down</i>
                      <modus-typography hierarchy="h2" size="md" weight="semibold" className="text-foreground" role="heading" aria-level="2">Cash Outflow</modus-typography>
                    </div>
                  </div>
                  @if (showFinBlock(widgetId, 'insight') && kellyCashOutflowInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 truncate leading-none">{{ kellyCashOutflowInsight() }}</modus-typography>
                    </div>
                  }
                  <div class="flex-1 min-h-0 overflow-hidden">
                    <app-home-cash-outflow [payments]="apPaymentSchedule()" />
                  </div>
                </div>
                <widget-resize-handle [isMobile]="isMobile()" (resizeStart)="startWidgetResize(widgetId, 'both', $event)" (resizeTouchStart)="startWidgetResizeTouch(widgetId, 'both', $event)" />
              }

            </div>
          </div>
        }
      </div>
    </div>
    } @else {
    <div class="flex flex-col h-full max-w-screen-xl mx-auto w-full">
      <div class="px-4 pt-4 md:pt-6 flex-shrink-0">
        <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground mb-1">{{ activeSubPageTitle() }}</modus-typography>
        <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 mb-4">{{ activeSubPageDescription() }}</modus-typography>
      </div>
      <div class="flex flex-1 min-h-0">
        <app-collapsible-subnav
          icon="payment_instant"
          title="Financials"
          [items]="finSubNavItems()"
          [activeItem]="activeSubPage()"
          [collapsed]="finSubnavCollapsed()"
          [alerts]="finSubnavAlerts()"
          [canvasMode]="isCanvasMode()"
          [isMobile]="isMobile()"
          (itemSelect)="selectSubPage($event)"
          (collapsedChange)="finSubnavCollapsed.set($event)"
        />
        <div class="flex-1 min-w-0 flex flex-col overflow-hidden">

    @if (activeSubPage() === 'estimates') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search estimates...' }" />
        </div>

        @if (isPamela()) {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Pipeline Value</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold"
              [class.text-success]="pipelineColor() === 'success'"
              [class.text-warning]="pipelineColor() === 'warning'"
              [class.text-destructive]="pipelineColor() === 'destructive'">{{ fmtCurrency(pamelaEstPipeline()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Open Estimates</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ pamelaOpenCount() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Win Rate</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold"
              [class.text-success]="winRateColor() === 'success'"
              [class.text-warning]="winRateColor() === 'warning'"
              [class.text-destructive]="winRateColor() === 'destructive'">{{ pamelaWinRate() }}%</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Awaiting Approval</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ pamelaAwaitingCount() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Overdue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ estimatesOverdueCount() }}</modus-typography>
          </div>
        </div>
        } @else {
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total Estimates</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ estimates().length }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total Value</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ formatCurrency(estimatesTotalValue()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Approved</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ estimatesApprovedCount() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Under Review</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ estimatesUnderReviewCount() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Overdue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ estimatesOverdueCount() }}</modus-typography>
          </div>
        </div>
        }

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (est of (isPamela() ? pamelaOpenEstimates() : estimates()); track est.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToEstimate(est.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="font-mono text-primary">{{ est.id }}</modus-typography>
                  <modus-badge [color]="estimateBadgeColor(est.status)" size="sm">{{ est.status }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-1">{{ est.project }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mb-3">{{ est.client }}</modus-typography>
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="xs" className="bg-muted text-foreground-80 rounded px-2 py-1">{{ est.type }}</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ est.value }}</modus-typography>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <modus-typography class="flex-shrink-0" size="xs" weight="semibold" className="text-2xs w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">{{ est.requestedByInitials }}</modus-typography>
                    <modus-typography  hierarchy="p" size="xs" className="text-foreground-80 truncate">{{ est.requestedBy }}</modus-typography>
                  </div>
                  <div class="text-right">
                    <modus-typography  hierarchy="p" size="xs" className="text-foreground-80">{{ est.dueDate }}</modus-typography>
                    <modus-typography size="xs" [class]="dueDateClass(est.daysLeft)">
                      @if (est.daysLeft < 0) { {{ -est.daysLeft }}d overdue }
                      @else if (est.daysLeft === 0) { Due today }
                      @else { {{ est.daysLeft }}d left }
                    </modus-typography>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[80px_1fr_100px_120px_120px_130px_100px] gap-2 px-4 py-3 bg-muted text-foreground-60 uppercase tracking-wide flex-shrink-0 border-bottom-default">
            <modus-typography size="xs" weight="semibold">ID</modus-typography>
            <modus-typography size="xs" weight="semibold">Project / Client</modus-typography>
            <modus-typography size="xs" weight="semibold">Type</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Value</modus-typography>
            <modus-typography size="xs" weight="semibold">Status</modus-typography>
            <modus-typography size="xs" weight="semibold">Requested By</modus-typography>
            <modus-typography size="xs" weight="semibold">Due Date</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (est of (isPamela() ? pamelaOpenEstimates() : estimates()); track est.id) {
            <div class="grid grid-cols-[80px_1fr_100px_120px_120px_130px_100px] gap-2 px-4 py-3 border-bottom-default last:border-b-0 hover:bg-muted items-center cursor-pointer" (click)="navigateToEstimate(est.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="font-mono text-primary">{{ est.id }}</modus-typography>
              <div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ est.project }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ est.client }}</modus-typography>
              </div>
              <modus-typography  hierarchy="p" size="xs" className="bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ est.type }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ est.value }}</modus-typography>
              <div><modus-badge [color]="estimateBadgeColor(est.status)" size="sm">{{ est.status }}</modus-badge></div>
              <div class="flex items-center gap-2 min-w-0">
                <modus-typography class="flex-shrink-0" size="xs" weight="semibold" className="text-2xs w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                  {{ est.requestedByInitials }}
                </modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-80 truncate">{{ est.requestedBy }}</modus-typography>
              </div>
              <div>
                <modus-typography  hierarchy="p" size="sm" className="text-foreground-80">{{ est.dueDate }}</modus-typography>
                <modus-typography size="xs" className="mt-0.5" [class]="dueDateClass(est.daysLeft)">
                  @if (est.daysLeft < 0) {
                    {{ -est.daysLeft }}d overdue
                  } @else if (est.daysLeft === 0) {
                    Due today
                  } @else {
                    {{ est.daysLeft }}d left
                  }
                </modus-typography>
              </div>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'change-orders') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search change orders...' }" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total COs</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ coSubpageAll().length }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total Value</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ formatCurrency(coSubpageTotalValue()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Approved</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ coSubpageApproved() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Pending</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ coSubpagePending() }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Rejected</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ coSubpageRejected() }}</modus-typography>
          </div>
        </div>

        <div class="flex items-center gap-1 mb-4">
          @for (tab of coTabs; track tab.value) {
            <div
              class="px-3 py-1.5 rounded-md cursor-pointer transition-colors duration-150"
              [class]="activeCoTab() === tab.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:bg-muted'"
              (click)="activeCoTab.set(tab.value)"
            ><modus-typography size="xs" weight="semibold">{{ tab.label }} ({{ coTabCount(tab.value) }})</modus-typography></div>
          }
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (co of filteredChangeOrders(); track co.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToChangeOrder(co.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ co.id }}</modus-typography>
                  <modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-1">{{ co.description }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-3">{{ co.project }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(co.amount) }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ co.requestDate }}</modus-typography>
                </div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
                <modus-typography  hierarchy="p" size="sm">No change orders in this category</modus-typography>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[80px_1fr_2fr_120px_90px_100px] gap-2 px-4 py-3 bg-muted text-foreground-60 uppercase tracking-wide flex-shrink-0 border-bottom-default">
            <modus-typography size="xs" weight="semibold">ID</modus-typography>
            <modus-typography size="xs" weight="semibold">Project</modus-typography>
            <modus-typography size="xs" weight="semibold">Description</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
            <modus-typography size="xs" weight="semibold">Status</modus-typography>
            <modus-typography size="xs" weight="semibold">Date</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (co of filteredChangeOrders(); track co.id) {
            <div class="grid grid-cols-[80px_1fr_2fr_120px_90px_100px] gap-2 px-4 py-3 border-bottom-default last:border-b-0 hover:bg-muted items-center cursor-pointer" (click)="navigateToChangeOrder(co.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ co.id }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ co.project }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ co.description }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(co.amount) }}</modus-typography>
              <div><modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ co.requestDate }}</modus-typography>
            </div>
          } @empty {
            <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
              <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
              <modus-typography  hierarchy="p" size="sm">No change orders in this category</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'job-costs') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search job costs...' }" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Grand Total</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(jobCostSummary().grandTotal) }}</modus-typography>
          </div>
          @for (cat of jobCostSummary().categories; track cat.label) {
            <div class="bg-card rounded-lg border-default p-4 text-center">
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">{{ cat.label }}</modus-typography>
              <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatJobCost(cat.total) }}</modus-typography>
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ cat.pct }}%</modus-typography>
            </div>
          }
        </div>

        <div class="mb-6">
          <div class="flex w-full h-5 rounded-full overflow-hidden">
            @for (cat of jobCostSummary().categories; track cat.label) {
              <div class="{{ cat.colorClass }}" [style.width.%]="cat.pct"></div>
            }
          </div>
          <div class="flex justify-between mt-2">
            @for (cat of jobCostSummary().categories; track cat.label) {
              <div class="flex items-center gap-1.5">
                <div class="w-2.5 h-2.5 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ cat.label }}</modus-typography>
              </div>
            }
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (p of projectJobCosts(); track p.projectId) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="openJobCostDetail(p)">
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-2">{{ p.projectName }}</modus-typography>
                <div class="flex items-center justify-between mb-3">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Budget Used</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ p.budgetUsed }}</modus-typography>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  @for (cat of jobCostCategories; track cat) {
                    <div class="flex items-center justify-between">
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ cat }}</modus-typography>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-80">{{ formatJobCost(getCost(p.costs, cat)) }}</modus-typography>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 bg-muted text-foreground-60 uppercase tracking-wide flex-shrink-0 border-bottom-default">
            <modus-typography size="xs" weight="semibold">Project</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Budget</modus-typography>
            @for (cat of jobCostCategories; track cat) {
              <modus-typography size="xs" weight="semibold" className="text-right">{{ cat }}</modus-typography>
            }
          </div>
          <div class="overflow-y-auto flex-1">
          @for (p of projectJobCosts(); track p.projectId) {
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-bottom-default last:border-b-0 hover:bg-muted items-center cursor-pointer" (click)="openJobCostDetail(p)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ p.projectName }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ p.budgetUsed }}</modus-typography>
              @for (cat of jobCostCategories; track cat) {
                <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ formatJobCost(getCost(p.costs, cat)) }}</modus-typography>
              }
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'job-billing') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search billing...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Active Schedules</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ billingSchedules().length }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Billed (6 mo)</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(billedTotal()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Upcoming (30d)</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ upcomingBillings().length }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Collected</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(collectedTotal()) }}</modus-typography>
          </div>
        </div>

        <!-- Billing events table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">invoice</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Billing Events</modus-typography>
            <modus-badge color="secondary" size="sm">{{ billingEvents().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (ev of billingEvents(); track ev.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToBillingEvent(ev.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ ev.description }}</modus-typography>
                  <modus-badge [color]="ev.status === 'completed' ? 'success' : ev.status === 'skipped' ? 'warning' : 'secondary'" size="sm">{{ capitalizeFirst(ev.status) }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-2">{{ ev.period }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(ev.amount) }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ ev.billingDate }}</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">invoice</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Billing Events</modus-typography>
              <modus-badge color="secondary" size="sm">{{ billingEvents().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Description</modus-typography><modus-typography size="xs" weight="semibold">Period</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography><modus-typography size="xs" weight="semibold">Status</modus-typography><modus-typography size="xs" weight="semibold">Date</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (ev of billingEvents(); track ev.id) {
            <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToBillingEvent(ev.id)">
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ ev.description }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ ev.period }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(ev.amount) }}</modus-typography>
              <div><modus-badge [color]="ev.status === 'completed' ? 'success' : ev.status === 'skipped' ? 'warning' : 'secondary'" size="sm">{{ capitalizeFirst(ev.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ ev.billingDate }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'accounts-receivable') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search invoices...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Outstanding</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(arOutstanding()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">DSO</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ dso() }} days</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Overdue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ formatCurrency(arOverdue()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Open Invoices</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ openInvoiceCount() }}</modus-typography>
          </div>
        </div>

        <!-- Aging buckets -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          @for (bucket of agingBuckets(); track bucket.label) {
            <div class="bg-card rounded-lg p-4 border-default">
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">{{ bucket.label }}</modus-typography>
              <modus-typography  hierarchy="p" size="xl" weight="bold" className="text-foreground">{{ formatCurrency(bucket.total) }}</modus-typography>
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ bucket.count }} invoices</modus-typography>
            </div>
          }
        </div>

        <!-- Invoice table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Invoices</modus-typography>
            <modus-badge color="secondary" size="sm">{{ invoices().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (inv of invoices(); track inv.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToInvoice(inv.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ inv.invoiceNumber }}</modus-typography>
                  <modus-badge [color]="invoiceStatusBadge(inv.status)" size="sm">{{ capitalizeFirst(inv.status) }}</modus-badge>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Amount</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(inv.amount) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Paid</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-success">{{ formatCurrency(inv.amountPaid) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ inv.terms }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Due {{ inv.dueDate }}</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Invoices</modus-typography>
              <modus-badge color="secondary" size="sm">{{ invoices().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Invoice #</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Paid</modus-typography><modus-typography size="xs" weight="semibold">Status</modus-typography><modus-typography size="xs" weight="semibold">Terms</modus-typography><modus-typography size="xs" weight="semibold">Due</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (inv of invoices(); track inv.id) {
            <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToInvoice(inv.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ inv.invoiceNumber }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(inv.amount) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-success text-right">{{ formatCurrency(inv.amountPaid) }}</modus-typography>
              <div><modus-badge [color]="invoiceStatusBadge(inv.status)" size="sm">{{ capitalizeFirst(inv.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ inv.terms }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ inv.dueDate }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'accounts-payable') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search payables...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Pending</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(payablesSummary()['pending'].total) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Approved</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ formatCurrency(payablesSummary()['approved'].total) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Overdue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ formatCurrency(payablesSummary()['overdue'].total) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Paid</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(payablesSummary()['paid'].total) }}</modus-typography>
          </div>
        </div>

        <!-- AP detail KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Invoice Queue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ pendingApInvoices().length }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-1">{{ onHoldApInvoices().length }} on hold</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Retention Held</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(apTotalRetentionHeld()) }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-1">{{ formatCurrency(apTotalRetentionPending()) }} pending release</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Lien Waivers</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold" [className]="apMissingWaivers() > 0 ? 'text-destructive' : 'text-foreground'">{{ apMissingWaivers() }} missing</modus-typography>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-1">{{ apLienWaivers().length }} total tracked</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Discounts Available</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(apDiscountsAvailable()) }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-1">{{ apPaymentSchedule().length }} scheduled payments</modus-typography>
          </div>
        </div>

        <!-- Payables table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">credit_card</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Payables</modus-typography>
            <modus-badge color="secondary" size="sm">{{ payables().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (p of payables(); track p.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayable(p.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ p.vendor }}</modus-typography>
                  <modus-badge [color]="payableStatusBadge(p.status)" size="sm">{{ capitalizeFirst(p.status) }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-2">{{ p.description }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(p.amount) }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Due {{ p.dueDate }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ p.costCode }}</modus-typography>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">credit_card</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Payables</modus-typography>
              <modus-badge color="secondary" size="sm">{{ payables().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Vendor</modus-typography><modus-typography size="xs" weight="semibold">Description</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography><modus-typography size="xs" weight="semibold">Status</modus-typography><modus-typography size="xs" weight="semibold">Due</modus-typography><modus-typography size="xs" weight="semibold">Cost Code</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (p of payables(); track p.id) {
            <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayable(p.id)">
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ p.vendor }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ p.description }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(p.amount) }}</modus-typography>
              <div><modus-badge [color]="payableStatusBadge(p.status)" size="sm">{{ capitalizeFirst(p.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ p.dueDate }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ p.costCode }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }

        <!-- Invoice Queue -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Invoice Queue</modus-typography>
              <modus-badge color="secondary" size="sm">{{ pendingApInvoices().length }}</modus-badge>
            </div>
          </div>
          <app-home-invoice-queue [invoices]="pendingApInvoices()" />
        </div>

        <!-- Vendor Aging -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">timer</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Vendor Aging</modus-typography>
              <modus-badge color="secondary" size="sm">{{ apVendors().length }}</modus-badge>
            </div>
          </div>
          <app-home-vendor-aging [vendors]="apVendors()" />
        </div>

        <!-- Pay Applications -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">clipboard</i>
                <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Pay Applications</modus-typography>
                <modus-badge color="secondary" size="sm">{{ apPayApplications().length }}</modus-badge>
              </div>
              <div class="flex items-center gap-1 bg-muted rounded p-0.5">
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
            </div>
          </div>
          <app-home-pay-apps [payApps]="apPayApplications()" [view]="payAppsView()" [showSummary]="false" />
        </div>

        <!-- Lien Waivers -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Lien Waivers</modus-typography>
              <modus-badge color="secondary" size="sm">{{ apLienWaivers().length }}</modus-badge>
            </div>
          </div>
          <app-home-lien-waivers [waivers]="apLienWaivers()" />
        </div>

        <!-- Retention -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">lock</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Retention</modus-typography>
              <modus-badge color="secondary" size="sm">{{ apRetention().length }}</modus-badge>
            </div>
          </div>
          <app-home-retention [records]="apRetention()" />
        </div>

        <!-- Payment Schedule -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Payment Schedule</modus-typography>
              <modus-badge color="secondary" size="sm">{{ apPaymentSchedule().length }}</modus-badge>
            </div>
          </div>
          <app-home-payment-schedule [payments]="apPaymentSchedule()" />
        </div>

        <!-- AP Activity -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">AP Activity</modus-typography>
              <modus-badge color="secondary" size="sm">{{ apActivities().length }}</modus-badge>
            </div>
          </div>
          <app-home-ap-activity [activities]="apActivities()" />
        </div>
      </div>
    }

    @if (activeSubPage() === 'cash-management') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search transactions...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Cash on Hand</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(cashPosition().currentBalance) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">30-Day Forecast</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ formatCurrency(cashPosition().thirtyDayForecast) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Runway</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold" [className]="cashRunway() > 6 ? 'text-success' : cashRunway() > 3 ? 'text-warning' : 'text-destructive'">{{ cashRunway() }} mo</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Net Cash Flow (6 mo)</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold" [className]="netCashFlow() >= 0 ? 'text-success' : 'text-destructive'">{{ formatCurrency(netCashFlow()) }}</modus-typography>
          </div>
        </div>

        <!-- Cash flow table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Cash Flow History</modus-typography>
          </div>
          <div class="flex flex-col gap-3">
            @for (cf of cashFlowHistory(); track cf.month) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToCashFlow(cf.month)">
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-3">{{ cf.month }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Inflow</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-success">{{ formatCurrency(cf.inflows) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Outflow</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-destructive">{{ formatCurrency(cf.outflows) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between border-top-default pt-2 mt-1">
                  <modus-typography  hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Net</modus-typography>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">{{ formatCurrency(cf.netCash) }}</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Cash Flow History</modus-typography>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Month</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Inflow</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Outflow</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Net</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (cf of cashFlowHistory(); track cf.month) {
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToCashFlow(cf.month)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ cf.month }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-success text-right">{{ formatCurrency(cf.inflows) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-destructive text-right">{{ formatCurrency(cf.outflows) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="'text-right ' + (cf.netCash >= 0 ? 'text-success' : 'text-destructive')">{{ formatCurrency(cf.netCash) }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'general-ledger') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search accounts...' }" />
        </div>

        <!-- Balance sheet summary -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Assets</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(glTotalAssets()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Liabilities</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ formatCurrency(glTotalLiabilities()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Revenue</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(glTotalRevenue()) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Expenses</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ formatCurrency(glTotalExpenses()) }}</modus-typography>
          </div>
        </div>

        <!-- GL accounts -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Chart of Accounts</modus-typography>
            <modus-badge color="secondary" size="sm">{{ glAccounts().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3 mb-6">
            @for (acct of glAccounts(); track acct.code) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToGlAccount(acct.code)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ acct.code }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ capitalizeFirst(acct.type) }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="sm" className="text-foreground mb-2">{{ acct.name }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Balance</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(acct.balance) }}</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col min-h-0 mb-6 max-h-[50%]">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Chart of Accounts</modus-typography>
              <modus-badge color="secondary" size="sm">{{ glAccounts().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Acct #</modus-typography><modus-typography size="xs" weight="semibold">Name</modus-typography><modus-typography size="xs" weight="semibold">Type</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Balance</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (acct of glAccounts(); track acct.code) {
            <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToGlAccount(acct.code)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ acct.code }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground">{{ acct.name }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ capitalizeFirst(acct.type) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(acct.balance) }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }

        <!-- Recent journal entries -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">file_edit</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Recent Journal Entries</modus-typography>
            <modus-badge color="secondary" size="sm">{{ glEntries().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (entry of glEntries(); track entry.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToGlEntry(entry.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ entry.id }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ entry.date }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Acct {{ entry.accountCode }}</modus-typography>
                <modus-typography  hierarchy="p" size="sm" className="text-foreground mb-3">{{ entry.description }}</modus-typography>
                <div class="flex items-center gap-4">
                  @if (entry.debit > 0) {
                    <div class="flex items-center gap-1">
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">DR</modus-typography>
                      <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(entry.debit) }}</modus-typography>
                    </div>
                  }
                  @if (entry.credit > 0) {
                    <div class="flex items-center gap-1">
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">CR</modus-typography>
                      <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(entry.credit) }}</modus-typography>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">file_edit</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Recent Journal Entries</modus-typography>
              <modus-badge color="secondary" size="sm">{{ glEntries().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Entry #</modus-typography><modus-typography size="xs" weight="semibold">Account</modus-typography><modus-typography size="xs" weight="semibold">Description</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Debit</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Credit</modus-typography><modus-typography size="xs" weight="semibold">Date</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (entry of glEntries(); track entry.id) {
            <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToGlEntry(entry.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ entry.id }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ entry.accountCode }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ entry.description }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground text-right">{{ entry.debit > 0 ? formatCurrency(entry.debit) : '-' }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground text-right">{{ entry.credit > 0 ? formatCurrency(entry.credit) : '-' }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ entry.date }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'purchase-orders') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search purchase orders...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total PO Value</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(poSummary().totalValue) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Received/Closed</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(poSummary().totalReceived) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Open POs</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ poSummary().openPOs }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Overdue Deliveries</modus-typography>
            <modus-typography hierarchy="p" size="2xl" weight="bold" [className]="poSummary().overdueDeliveries > 0 ? 'text-destructive' : 'text-success'">{{ poSummary().overdueDeliveries }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Draft POs</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground-60">{{ poSummary().draftCount }}</modus-typography>
          </div>
        </div>

        <!-- PO table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">shopping_cart</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Purchase Orders</modus-typography>
            <modus-badge color="secondary" size="sm">{{ purchaseOrders().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (po of purchaseOrders(); track po.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPurchaseOrder(po.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ po.poNumber }}</modus-typography>
                  <modus-badge [color]="poStatusBadge(po.status)" size="sm">{{ capitalizeFirst(po.status) }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-1">{{ po.vendor }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-3">{{ po.description }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(po.amount) }}</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Delivery {{ po.expectedDelivery }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ po.project }}</modus-typography>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">shopping_cart</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Purchase Orders</modus-typography>
              <modus-badge color="secondary" size="sm">{{ purchaseOrders().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">PO #</modus-typography><modus-typography size="xs" weight="semibold">Vendor</modus-typography><modus-typography size="xs" weight="semibold">Description</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography><modus-typography size="xs" weight="semibold">Status</modus-typography><modus-typography size="xs" weight="semibold">Delivery</modus-typography><modus-typography size="xs" weight="semibold">Project</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (po of purchaseOrders(); track po.id) {
            <div class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPurchaseOrder(po.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-primary">{{ po.poNumber }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ po.vendor }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground truncate">{{ po.description }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(po.amount) }}</modus-typography>
              <div><modus-badge [color]="poStatusBadge(po.status)" size="sm">{{ capitalizeFirst(po.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ po.expectedDelivery }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ po.project }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'payroll') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search payroll...' }" />
        </div>

        <!-- KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Gross Pay (YTD)</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(payrollSummary().totalGross) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Net Pay (YTD)</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(payrollSummary().totalNet) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Avg Headcount</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ payrollSummary().avgEmployees }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Labor Burden</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ payrollSummary().laborBurdenPct }}%</modus-typography>
          </div>
        </div>

        <!-- Additional KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Taxes</modus-typography>
            <modus-typography  hierarchy="p" size="xl" weight="bold" className="text-warning">{{ formatCurrency(payrollSummary().totalTaxes) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Benefits</modus-typography>
            <modus-typography  hierarchy="p" size="xl" weight="bold" className="text-primary">{{ formatCurrency(payrollSummary().totalBenefits) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-1">Total Overtime</modus-typography>
            <modus-typography hierarchy="p" size="xl" weight="bold" [className]="payrollSummary().totalOT > 1200 ? 'text-warning' : 'text-foreground'">{{ payrollSummary().totalOT.toLocaleString() }} hrs</modus-typography>
          </div>
        </div>

        <!-- Monthly rollup -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Monthly Summary</modus-typography>
          </div>
          <div class="flex flex-col gap-3 mb-6">
            @for (mp of monthlyPayroll(); track mp.month) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayrollMonthly(mp.month)">
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-3">{{ mp.month }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Gross</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-foreground">{{ formatCurrency(mp.gross) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Net</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-success">{{ formatCurrency(mp.net) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Headcount</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ mp.headcount }}</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col min-h-0 mb-6 max-h-[50%]">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Monthly Summary</modus-typography>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Month</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Gross</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Net</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Headcount</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (mp of monthlyPayroll(); track mp.month) {
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayrollMonthly(mp.month)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ mp.month }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground text-right">{{ formatCurrency(mp.gross) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-success text-right">{{ formatCurrency(mp.net) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ mp.headcount }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }

        <!-- Weekly detail -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">people_group</i>
            <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Weekly Payroll Detail</modus-typography>
            <modus-badge color="secondary" size="sm">{{ payrollRecords().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (pr of payrollRecords(); track pr.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayrollRecord(pr.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ pr.period }}</modus-typography>
                  <modus-badge [color]="payrollStatusBadge(pr.status)" size="sm">{{ capitalizeFirst(pr.status) }}</modus-badge>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Gross</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-foreground">{{ formatCurrency(pr.grossPay) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Net</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-success">{{ formatCurrency(pr.netPay) }}</modus-typography>
                </div>
                <div class="flex items-center gap-4 mt-2">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ pr.employeeCount }} emp</modus-typography>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ pr.totalHours.toLocaleString() }} hrs</modus-typography>
                  <modus-typography hierarchy="p" size="xs" [weight]="pr.overtimeHours > 70 ? 'semibold' : 'normal'" [className]="pr.overtimeHours > 70 ? 'text-warning' : 'text-foreground-60'">{{ pr.overtimeHours }} OT</modus-typography>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="px-5 py-4 border-bottom-default flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">people_group</i>
              <modus-typography  hierarchy="p" size="md" weight="semibold" className="text-foreground">Weekly Payroll Detail</modus-typography>
              <modus-badge color="secondary" size="sm">{{ payrollRecords().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide flex-shrink-0">
            <modus-typography size="xs" weight="semibold">Period</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Gross</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Net</modus-typography><modus-typography size="xs" weight="semibold">Status</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Emp</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">Hours</modus-typography><modus-typography size="xs" weight="semibold" className="text-right">OT</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (pr of payrollRecords(); track pr.id) {
            <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayrollRecord(pr.id)">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ pr.period }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground text-right">{{ formatCurrency(pr.grossPay) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-success text-right">{{ formatCurrency(pr.netPay) }}</modus-typography>
              <div><modus-badge [color]="payrollStatusBadge(pr.status)" size="sm">{{ capitalizeFirst(pr.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ pr.employeeCount }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ pr.totalHours.toLocaleString() }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" [weight]="pr.overtimeHours > 70 ? 'semibold' : 'normal'" [className]="'text-right ' + (pr.overtimeHours > 70 ? 'text-warning' : 'text-foreground-60')">{{ pr.overtimeHours }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'contracts') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search contracts...' }" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total Contracts</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ contracts().length }}</modus-typography>
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ contractSummary().primeCount }} prime / {{ contractSummary().subCount }} sub</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Original Value</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(contractSummary().totalOriginal) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Revised Value</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ formatCurrency(contractSummary().totalRevised) }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" [className]="contractSummary().totalRevised > contractSummary().totalOriginal ? 'text-warning' : 'text-success'">
              {{ contractSummary().totalRevised > contractSummary().totalOriginal ? '+' : '' }}{{ formatCurrency(contractSummary().totalRevised - contractSummary().totalOriginal) }}
            </modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Active</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ contractSummary().activeCount }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Est. Retainage</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ formatCurrency(contractSummary().totalRetainage) }}</modus-typography>
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (c of contracts(); track c.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToContract(c.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-badge [color]="c.contractType === 'prime' ? 'primary' : 'tertiary'" size="sm">{{ contractTypeLabelShort(c.contractType) }}</modus-badge>
                  <modus-badge [color]="contractStatusBadge(c.status)" size="sm">{{ capitalizeFirst(c.status) }}</modus-badge>
                </div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-1">{{ c.title }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mb-3">{{ c.vendor }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Original</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ formatCurrency(c.originalValue) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Revised</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(c.revisedValue) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Delta</modus-typography>
                  <modus-typography hierarchy="p" size="sm" [className]="c.revisedValue > c.originalValue ? 'text-warning' : 'text-foreground-40'">
                    {{ c.revisedValue > c.originalValue ? '+' : '' }}{{ formatCurrency(c.revisedValue - c.originalValue) }}
                  </modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-2">{{ c.project }}</modus-typography>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[1fr_100px_120px_120px_120px_90px_100px] gap-2 px-4 py-3 bg-muted text-foreground-60 uppercase tracking-wide flex-shrink-0 border-bottom-default">
            <modus-typography size="xs" weight="semibold">Contract</modus-typography>
            <modus-typography size="xs" weight="semibold">Type</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Original</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Revised</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Delta</modus-typography>
            <modus-typography size="xs" weight="semibold">Status</modus-typography>
            <modus-typography size="xs" weight="semibold">Project</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (c of contracts(); track c.id) {
            <div class="grid grid-cols-[1fr_100px_120px_120px_120px_90px_100px] gap-2 px-4 py-3 border-bottom-default last:border-b-0 hover:bg-muted items-center cursor-pointer" (click)="navigateToContract(c.id)">
              <div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ c.title }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ c.vendor }}</modus-typography>
              </div>
              <div><modus-badge [color]="c.contractType === 'prime' ? 'primary' : 'tertiary'" size="sm">{{ contractTypeLabelShort(c.contractType) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 text-right">{{ formatCurrency(c.originalValue) }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right">{{ formatCurrency(c.revisedValue) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" [className]="'text-right ' + (c.revisedValue > c.originalValue ? 'text-warning' : 'text-foreground-40')">
                {{ c.revisedValue > c.originalValue ? '+' : '' }}{{ formatCurrency(c.revisedValue - c.originalValue) }}
              </modus-typography>
              <div><modus-badge [color]="contractStatusBadge(c.status)" size="sm">{{ capitalizeFirst(c.status) }}</modus-badge></div>
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ c.project }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

    @if (activeSubPage() === 'subcontract-ledger') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="isMobile() || finSubnavCollapsed() ? 227 : 0">
          <ng-container [ngTemplateOutlet]="finSubpageToolbar" [ngTemplateOutletContext]="{ $implicit: 'Search ledger entries...' }" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Total Paid</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-success">{{ formatCurrency(subLedgerSummary().totalPaid) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Retainage Held</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-warning">{{ formatCurrency(subLedgerSummary().totalRetainageHeld) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Retainage Released</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-primary">{{ formatCurrency(subLedgerSummary().totalRetainageReleased) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">Backcharges</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-destructive">{{ formatCurrency(subLedgerSummary().totalBackcharges) }}</modus-typography>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 uppercase tracking-wide mb-1">CO Adjustments</modus-typography>
            <modus-typography  hierarchy="p" size="2xl" weight="bold" className="text-foreground">{{ formatCurrency(subLedgerSummary().totalChangeOrders) }}</modus-typography>
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (entry of subcontractLedger(); track entry.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToSubcontractLedgerEntry(entry.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-badge [color]="ledgerTypeBadge(entry.type)" size="sm">{{ ledgerTypeLabel(entry.type) }}</modus-badge>
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ entry.date }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground mb-1">{{ entry.description }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mb-1">{{ entry.project }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60 mb-3">{{ entry.vendor }}</modus-typography>
                <div class="flex items-center justify-between mb-1">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Amount</modus-typography>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="entry.amount < 0 ? 'text-destructive' : 'text-success'">
                    {{ entry.amount < 0 ? '-' : '' }}{{ formatCurrency(entry.amount < 0 ? -entry.amount : entry.amount) }}
                  </modus-typography>
                </div>
                <div class="flex items-center justify-between">
                  <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">Balance</modus-typography>
                  <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(entry.runningBalance) }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40 mt-2">{{ entry.payApp }}</modus-typography>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex flex-col flex-1 min-h-0">
          <div class="grid grid-cols-[1fr_120px_100px_120px_100px_100px_100px] gap-2 px-4 py-3 bg-muted text-foreground-60 uppercase tracking-wide flex-shrink-0 border-bottom-default">
            <modus-typography size="xs" weight="semibold">Description</modus-typography>
            <modus-typography size="xs" weight="semibold">Vendor</modus-typography>
            <modus-typography size="xs" weight="semibold">Type</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
            <modus-typography size="xs" weight="semibold">Pay App</modus-typography>
            <modus-typography size="xs" weight="semibold">Date</modus-typography>
            <modus-typography size="xs" weight="semibold" className="text-right">Balance</modus-typography>
          </div>
          <div class="overflow-y-auto flex-1">
          @for (entry of subcontractLedger(); track entry.id) {
            <div class="grid grid-cols-[1fr_120px_100px_120px_100px_100px_100px] gap-2 px-4 py-3 border-bottom-default last:border-b-0 hover:bg-muted items-center cursor-pointer" (click)="navigateToSubcontractLedgerEntry(entry.id)">
              <div>
                <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ entry.description }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ entry.project }}</modus-typography>
              </div>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ entry.vendor }}</modus-typography>
              <div><modus-badge [color]="ledgerTypeBadge(entry.type)" size="sm">{{ ledgerTypeLabel(entry.type) }}</modus-badge></div>
              <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="'text-right ' + (entry.amount < 0 ? 'text-destructive' : 'text-success')">
                {{ entry.amount < 0 ? '-' : '' }}{{ formatCurrency(entry.amount < 0 ? -entry.amount : entry.amount) }}
              </modus-typography>
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ entry.payApp }}</modus-typography>
              <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ entry.date }}</modus-typography>
              <modus-typography  hierarchy="p" size="sm" className="text-foreground text-right">{{ formatCurrency(entry.runningBalance) }}</modus-typography>
            </div>
          }
          </div>
        </div>
        }
      </div>
    }

        </div> <!-- end flex-1 content area -->
      </div> <!-- end flex wrapper -->
    </div> <!-- end flex-col h-full wrapper -->
    }
  `,
})
export class FinancialsPageComponent extends DashboardPageBase {
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private get pp(): string { return `/${this.personaService.activePersonaSlug()}`; }

  readonly finSubNavItems = computed(() => getPersonaNav(this.personaService.activePersonaSlug()).financialsPageSubNav);
  readonly activeSubPage = signal<string>('overview');
  readonly finDetailType = signal<FinDetailType | null>(null);
  readonly finDetailId = signal<string | null>(null);
  readonly finSubnavCollapsed = signal(false);
  readonly finSubpageSearch = signal('');
  readonly finMobileSearchOpen = signal(false);

  readonly finDetailEntity = computed<unknown>(() => {
    const type = this.finDetailType();
    const id = this.finDetailId();
    if (!type || !id) return null;
    switch (type) {
      case 'estimate': return this.store.estimates().find(e => e.id === id) ?? null;
      case 'changeOrder': return this.store.changeOrders().find(co => co.id === id) ?? null;
      case 'invoice': return this.store.invoices().find(i => i.id === id) ?? null;
      case 'payable': return this.store.payables().find(p => p.id === id) ?? null;
      case 'purchaseOrder': return this.store.purchaseOrders().find(po => po.id === id) ?? null;
      case 'contract': return this.store.contracts().find(c => c.id === id) ?? null;
      case 'billingEvent': return this.store.billingEvents().find(be => be.id === id) ?? null;
      case 'payrollRecord': return this.store.payrollRecords().find(pr => pr.id === id) ?? null;
      case 'subcontractLedger': return this.store.subcontractLedger().find(sl => sl.id === id) ?? null;
      case 'glEntry': return this.store.glEntries().find(gl => gl.id === id) ?? null;
      case 'glAccount': return this.store.glAccounts().find(gl => gl.code === id) ?? null;
      case 'cashFlow': return this.store.cashFlowHistory().find(cf => cf.month === decodeURIComponent(id)) ?? null;
      case 'payrollMonthly': {
        const decoded = decodeURIComponent(id);
        const records = this.store.payrollRecords().filter(r => r.period.startsWith(decoded));
        return records.length > 0 ? records : null;
      }
      default: return null;
    }
  });

  readonly finDetailMeta = computed<FinDetailMeta | null>(() => {
    const type = this.finDetailType();
    const entity = this.finDetailEntity();
    if (!type || !entity) return null;
    switch (type) {
      case 'estimate': {
        const e = entity as Estimate;
        return {
          title: `Estimate ${e.id}`, subtitle: `${e.project} - ${e.client}`, icon: 'file',
          status: e.status, statusColor: estimateBadgeColor(e.status),
          fields: [
            { label: 'Type', value: e.type },
            { label: 'Value', value: e.value, highlight: true },
            { label: 'Requested By', value: e.requestedBy },
            { label: 'Due Date', value: e.dueDate },
          ],
        };
      }
      case 'changeOrder': {
        const co = entity as ChangeOrder;
        return {
          title: `Change Order ${co.id}`, subtitle: co.project, icon: 'swap',
          status: sharedCapitalizeFirst(co.status), statusColor: coBadgeColor(co.status),
          fields: [
            { label: 'Type', value: coTypeLabel(co.coType) },
            { label: 'Amount', value: sharedFormatCurrency(co.amount), highlight: true },
            { label: 'Requested By', value: co.requestedBy },
            { label: 'Request Date', value: co.requestDate },
            { label: 'Reason', value: co.reason },
            { label: 'Description', value: co.description },
          ],
        };
      }
      case 'invoice': {
        const inv = entity as Invoice;
        const proj = this.store.findProjectById(inv.projectId);
        return {
          title: `Invoice ${inv.invoiceNumber}`, subtitle: proj?.name ?? `Project #${inv.projectId}`, icon: 'document',
          status: sharedCapitalizeFirst(inv.status), statusColor: invoiceStatusBadge(inv.status),
          fields: [
            { label: 'Amount', value: sharedFormatCurrency(inv.amount), highlight: true },
            { label: 'Paid', value: sharedFormatCurrency(inv.amountPaid) },
            { label: 'Balance', value: sharedFormatCurrency(inv.amount - inv.amountPaid), highlight: true },
            { label: 'Issue Date', value: inv.issueDate },
            { label: 'Due Date', value: inv.dueDate },
            { label: 'Terms', value: inv.terms },
          ],
        };
      }
      case 'payable': {
        const p = entity as Payable;
        const proj = this.store.findProjectById(p.projectId);
        return {
          title: `Payable ${p.invoiceNumber}`, subtitle: `${p.vendor} - ${proj?.name ?? ''}`, icon: 'credit_card',
          status: sharedCapitalizeFirst(p.status), statusColor: payableStatusBadge(p.status),
          fields: [
            { label: 'Amount', value: sharedFormatCurrency(p.amount), highlight: true },
            { label: 'Paid', value: sharedFormatCurrency(p.amountPaid) },
            { label: 'Balance', value: sharedFormatCurrency(p.amount - p.amountPaid), highlight: true },
            { label: 'Description', value: p.description },
            { label: 'Cost Code', value: p.costCode },
            { label: 'Received', value: p.receivedDate },
            { label: 'Due Date', value: p.dueDate },
          ],
        };
      }
      case 'purchaseOrder': {
        const po = entity as PurchaseOrder;
        return {
          title: `PO ${po.poNumber}`, subtitle: `${po.vendor} - ${po.project}`, icon: 'shopping_cart',
          status: sharedCapitalizeFirst(po.status), statusColor: poStatusBadge(po.status),
          fields: [
            { label: 'Amount', value: sharedFormatCurrency(po.amount), highlight: true },
            { label: 'Received', value: sharedFormatCurrency(po.amountReceived) },
            { label: 'Description', value: po.description },
            { label: 'Issue Date', value: po.issueDate },
            { label: 'Expected Delivery', value: po.expectedDelivery },
          ],
        };
      }
      case 'contract': {
        const c = entity as Contract;
        return {
          title: c.title, subtitle: `${c.vendor} - ${c.project}`, icon: 'copy_content',
          status: sharedCapitalizeFirst(c.status), statusColor: contractStatusBadge(c.status),
          fields: [
            { label: 'Type', value: contractTypeLabel(c.contractType) },
            { label: 'Original Value', value: sharedFormatCurrency(c.originalValue), highlight: true },
            { label: 'Revised Value', value: sharedFormatCurrency(c.revisedValue), highlight: true },
            { label: 'Scope', value: c.scope },
            { label: 'Start Date', value: c.startDate },
            { label: 'End Date', value: c.endDate },
          ],
        };
      }
      case 'billingEvent': {
        const be = entity as BillingEvent;
        const proj = this.store.findProjectById(be.projectId);
        return {
          title: `Billing Event ${be.id}`, subtitle: proj?.name ?? `Project #${be.projectId}`, icon: 'invoice',
          status: sharedCapitalizeFirst(be.status),
          statusColor: be.status === 'completed' ? 'success' : be.status === 'scheduled' ? 'primary' : 'secondary',
          fields: [
            { label: 'Amount', value: sharedFormatCurrency(be.amount), highlight: true },
            { label: 'Description', value: be.description },
            { label: 'Billing Date', value: be.billingDate },
            { label: 'Period', value: be.period },
          ],
        };
      }
      case 'payrollRecord': {
        const pr = entity as PayrollRecord;
        return {
          title: `Payroll ${pr.period}`, subtitle: `${pr.periodStart} - ${pr.periodEnd}`, icon: 'people_group',
          status: sharedCapitalizeFirst(pr.status), statusColor: payrollStatusBadge(pr.status),
          fields: [
            { label: 'Gross Pay', value: sharedFormatCurrency(pr.grossPay), highlight: true },
            { label: 'Net Pay', value: sharedFormatCurrency(pr.netPay), highlight: true },
            { label: 'Taxes', value: sharedFormatCurrency(pr.taxes) },
            { label: 'Benefits', value: sharedFormatCurrency(pr.benefits) },
            { label: 'Employees', value: String(pr.employeeCount) },
            { label: 'Total Hours', value: String(pr.totalHours) },
            { label: 'Pay Date', value: pr.payDate },
          ],
        };
      }
      case 'payrollMonthly': {
        const records = entity as PayrollRecord[];
        const total = records.reduce((s, r) => s + r.grossPay, 0);
        const headcount = records.reduce((s, r) => s + r.employeeCount, 0);
        return {
          title: `Payroll - ${decodeURIComponent(this.finDetailId()!)}`, subtitle: `${records.length} pay periods`, icon: 'people_group',
          fields: [
            { label: 'Total Gross', value: sharedFormatCurrency(total), highlight: true },
            { label: 'Pay Periods', value: String(records.length) },
            { label: 'Total Headcount', value: String(headcount) },
          ],
        };
      }
      case 'subcontractLedger': {
        const sl = entity as SubcontractLedgerEntry;
        return {
          title: `Ledger Entry ${sl.id}`, subtitle: `${sl.vendor} - ${sl.project}`, icon: 'clipboard',
          status: ledgerTypeLabel(sl.type), statusColor: ledgerTypeBadge(sl.type),
          fields: [
            { label: 'Amount', value: sharedFormatCurrency(sl.amount), highlight: true },
            { label: 'Description', value: sl.description },
            { label: 'Date', value: sl.date },
            { label: 'Pay App', value: sl.payApp },
            { label: 'Period', value: sl.period },
          ],
        };
      }
      case 'glEntry': {
        const gl = entity as GLEntry;
        return {
          title: `Journal Entry ${gl.id}`, subtitle: `${gl.accountCode} - ${gl.accountName}`, icon: 'file_edit',
          fields: [
            { label: 'Debit', value: sharedFormatCurrency(gl.debit), highlight: gl.debit > 0 },
            { label: 'Credit', value: sharedFormatCurrency(gl.credit), highlight: gl.credit > 0 },
            { label: 'Balance', value: sharedFormatCurrency(gl.balance) },
            { label: 'Description', value: gl.description },
            { label: 'Date', value: gl.date },
            { label: 'Reference', value: gl.reference },
            { label: 'Category', value: gl.category },
          ],
        };
      }
      case 'glAccount': {
        const acct = entity as GLAccount;
        return {
          title: `${acct.code} - ${acct.name}`, subtitle: `${acct.type} Account`, icon: 'list_bulleted',
          fields: [
            { label: 'Balance', value: sharedFormatCurrency(acct.balance), highlight: true },
            { label: 'Account Type', value: acct.type },
          ],
        };
      }
      case 'cashFlow': {
        const cf = entity as CashFlowEntry;
        return {
          title: `Cash Flow - ${cf.month}`, subtitle: 'Monthly cash flow summary', icon: 'gantt_chart',
          fields: [
            { label: 'Inflows', value: sharedFormatCurrency(cf.inflows), highlight: true },
            { label: 'Outflows', value: sharedFormatCurrency(cf.outflows), highlight: true },
            { label: 'Net Cash', value: sharedFormatCurrency(cf.netCash), highlight: true },
            { label: 'Running Balance', value: sharedFormatCurrency(cf.runningBalance) },
          ],
        };
      }
      default: return null;
    }
  });

  readonly isEldoradoEstimate = computed(() => {
    const entity = this.finDetailEntity();
    return this.finDetailType() === 'estimate' && !!entity && (entity as Estimate).id === 'EST-2026-065';
  });

  readonly assemblyHub = computed(() =>
    this.isEldoradoEstimate()
      ? (ESTIMATE_ASSEMBLY_HUBS[this.personaService.activePersonaSlug()] ?? null)
      : null
  );

  // Financial data references (reactive via store signals)
  readonly invoices = this.store.invoices;
  readonly billingSchedules = this.store.billingSchedules;
  readonly billingEvents = this.store.billingEvents;
  readonly payables = this.store.payables;
  readonly cashFlowHistory = this.store.cashFlowHistory;
  readonly cashPosition = this.store.cashPosition;
  readonly glAccounts = this.store.glAccounts;
  readonly glEntries = this.store.glEntries;
  readonly purchaseOrders = this.store.purchaseOrders;
  readonly payrollRecords = this.store.payrollRecords;
  readonly contracts = this.store.contracts;
  readonly subcontractLedger = this.store.subcontractLedger;

  // AP Clerk data (shared across personas)
  readonly apInvoices = this.store.apInvoices;
  readonly apVendors = this.store.apVendors;
  readonly apPayApplications = this.store.apPayApplications;
  readonly payAppsView = signal<PayAppsView>('tile');
  readonly apLienWaivers = this.store.apLienWaivers;
  readonly apRetention = this.store.apRetention;
  readonly apActivities = this.store.apActivities;
  readonly apPaymentSchedule = this.store.apPaymentSchedule;

  readonly pendingApInvoices = computed(() => this.apInvoices().filter(i => i.status === 'pending'));
  readonly onHoldApInvoices = computed(() => this.apInvoices().filter(i => i.status === 'on-hold'));
  readonly apTotalOutstanding = computed(() => this.apInvoices().filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0));
  readonly apMissingWaivers = computed(() => this.apLienWaivers().filter(w => w.status === 'missing').length);
  readonly apTotalRetentionHeld = computed(() => this.apRetention().reduce((s, r) => s + r.retentionHeld, 0));
  readonly apTotalRetentionReleased = computed(() => this.apRetention().reduce((s, r) => s + r.retentionReleased, 0));
  readonly apTotalRetentionPending = computed(() => this.apRetention().reduce((s, r) => s + r.pendingRelease, 0));
  readonly apDiscountsAvailable = computed(() => this.apPaymentSchedule().filter(p => p.discountAvailable > 0).reduce((s, p) => s + p.discountAvailable, 0));
  readonly apPaymentsDueThisWeek = computed(() => this.apPaymentSchedule().slice(0, 4).reduce((s, p) => s + p.amount, 0));

  readonly kellyApKpiCards = computed<ApKpiCard[]>(() => [
    { value: '' + this.pendingApInvoices().length, label: 'Invoices to Process', icon: 'invoice', iconBg: 'bg-warning-20', iconColor: 'text-warning' },
    { value: sharedFormatCurrency(this.apTotalOutstanding()), label: 'Total Outstanding AP', icon: 'payment_instant', iconBg: 'bg-primary-20', iconColor: 'text-primary' },
    { value: sharedFormatCurrency(this.apPaymentsDueThisWeek()), label: 'Payments Due This Week', icon: 'calendar', iconBg: 'bg-destructive-20', iconColor: 'text-destructive' },
    { value: sharedFormatCurrency(this.apDiscountsAvailable()), label: 'Discounts Available', icon: 'offers', iconBg: 'bg-success-20', iconColor: 'text-success' },
  ]);

  // Computed KPIs (reactive to store signal changes)
  readonly billedTotal = computed(() => this.billingEvents().filter(e => e.status !== 'scheduled').reduce((sum, e) => sum + e.amount, 0));
  readonly collectedTotal = computed(() => this.billingEvents().filter(e => e.status === 'completed').reduce((sum, e) => sum + e.amount, 0));
  readonly upcomingBillings = computed(() => getUpcomingBillings(30, this.billingEvents()));
  readonly arOutstanding = computed(() => this.invoices().filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount - i.amountPaid, 0));
  readonly arOverdue = computed(() => this.invoices().filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount - i.amountPaid, 0));
  readonly openInvoiceCount = computed(() => this.invoices().filter(i => i.status !== 'paid').length);
  readonly dso = computed(() => getDSO(this.invoices()));
  readonly agingBuckets = computed(() => getInvoiceAgingBuckets(this.invoices()));
  readonly payablesSummary = computed(() => getPayablesSummary(this.payables()));
  readonly cashRunway = computed(() => getCashRunway(this.cashPosition()));
  readonly netCashFlow = computed(() => this.cashFlowHistory().reduce((sum, cf) => sum + cf.netCash, 0));
  readonly glBalanceSheet = computed(() => getGLBalanceSheet(this.glAccounts()));
  readonly glTotalAssets = computed(() => this.glBalanceSheet().assets.reduce((sum, a) => sum + a.balance, 0));
  readonly glTotalLiabilities = computed(() => this.glBalanceSheet().liabilities.reduce((sum, a) => sum + a.balance, 0));
  readonly glTotalRevenue = computed(() => this.glBalanceSheet().revenue.reduce((sum, a) => sum + a.balance, 0));
  readonly glTotalExpenses = computed(() => this.glBalanceSheet().expenses.reduce((sum, a) => sum + a.balance, 0));
  readonly poSummary = computed(() => getPOSummary(this.purchaseOrders()));
  readonly payrollSummary = computed(() => getPayrollSummary(this.payrollRecords()));
  readonly monthlyPayroll = computed(() => getMonthlyPayrollTotals(this.payrollRecords()));
  readonly contractSummary = computed(() => getContractSummary(this.contracts()));
  readonly subLedgerSummary = computed(() => getSubcontractLedgerSummary(this.subcontractLedger()));

  // Estimates sub-page KPIs
  readonly estimatesTotalValue = computed(() => this.estimates().reduce((s, e) => s + e.valueRaw, 0));
  readonly estimatesApprovedCount = computed(() => this.estimates().filter(e => e.status === 'Approved').length);
  readonly estimatesUnderReviewCount = computed(() => this.estimates().filter(e => e.status === 'Under Review').length);
  readonly estimatesOverdueCount = computed(() => this.estimates().filter(e => e.daysLeft < 0).length);

  // Pamela estimator KPIs
  readonly pamelaEstPipeline = computed(() =>
    this.estimates().filter(e => e.status !== 'Approved').reduce((s, e) => s + e.valueRaw, 0)
  );
  readonly pamelaOpenCount = computed(() =>
    this.estimates().filter(e => e.status !== 'Approved').length
  );
  readonly pamelaProjectCount = computed(() => {
    const projects = new Set(this.estimates().filter(e => e.status !== 'Approved').map(e => e.project));
    return projects.size;
  });
  readonly pamelaWinRate = computed(() => {
    const total = this.estimates().length;
    if (total === 0) return 0;
    return Math.round((this.estimatesApprovedCount() / total) * 100);
  });
  readonly pamelaAwaitingCount = computed(() =>
    this.estimates().filter(e => e.status === 'Awaiting Approval').length
  );
  readonly pipelineColor = computed<'success' | 'warning' | 'destructive'>(() => {
    const v = this.pamelaEstPipeline();
    if (v >= 500_000) return 'success';
    if (v >= 100_000) return 'warning';
    return 'destructive';
  });
  readonly winRateColor = computed<'success' | 'warning' | 'destructive'>(() => {
    const r = this.pamelaWinRate();
    if (r >= 40) return 'success';
    if (r >= 20) return 'warning';
    return 'destructive';
  });
  readonly overdueColor = computed<'success' | 'warning' | 'destructive'>(() =>
    this.estimatesOverdueCount() === 0 ? 'success' : this.estimatesOverdueCount() <= 2 ? 'warning' : 'destructive'
  );

  // Change orders sub-page KPIs
  readonly coSubpageAll = this.store.changeOrders;
  readonly coSubpageTotalValue = computed(() => this.store.changeOrders().reduce((s, c) => s + c.amount, 0));
  readonly coSubpageApproved = computed(() => this.store.changeOrders().filter(c => c.status === 'approved').length);
  readonly coSubpagePending = computed(() => this.store.changeOrders().filter(c => c.status === 'pending').length);
  readonly coSubpageRejected = computed(() => this.store.changeOrders().filter(c => c.status === 'rejected').length);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  private static readonly G = DashboardLayoutEngine.GAP_PX;
  private static readonly TITLE_HEIGHT = 80;
  private static readonly NAVKPI_HEIGHT = 512;
  private static readonly NAVKPI_TOP = FinancialsPageComponent.TITLE_HEIGHT + FinancialsPageComponent.G;
  private static readonly REVENUE_HEIGHT = 512;
  private static readonly REVENUE_TOP = FinancialsPageComponent.NAVKPI_TOP;
  private static readonly ESTIMATES_HEIGHT = 512;
  private static readonly ESTIMATES_TOP = FinancialsPageComponent.NAVKPI_TOP + FinancialsPageComponent.NAVKPI_HEIGHT + FinancialsPageComponent.G;
  private static readonly BUDGET_HEIGHT = 512;
  private static readonly BUDGET_TOP = FinancialsPageComponent.ESTIMATES_TOP + FinancialsPageComponent.ESTIMATES_HEIGHT + FinancialsPageComponent.G;
  private static readonly JOB_COSTS_HEIGHT = 576;
  private static readonly JOB_COSTS_TOP = FinancialsPageComponent.BUDGET_TOP + FinancialsPageComponent.BUDGET_HEIGHT + FinancialsPageComponent.G;
  private static readonly CO_HEIGHT = 560;
  private static readonly CO_TOP = FinancialsPageComponent.JOB_COSTS_TOP + FinancialsPageComponent.JOB_COSTS_HEIGHT + FinancialsPageComponent.G;

  protected override getEngineConfig(): DashboardLayoutConfig {
    const seed = this.getLayoutSeedForCurrentPersona();

    return {
      ...seed,
      layoutStorageKey: () => {
        const s = this.personaService.activePersonaSlug();
        const ver = s === 'kelly' ? 'v30' : s === 'pamela' ? 'v33' : 'v19';
        return `${s}:dashboard-financials:${ver}`;
      },
      canvasStorageKey: () => {
        const s = this.personaService.activePersonaSlug();
        const ver = s === 'kelly' ? 'v32' : s === 'pamela' ? 'v35' : 'v21';
        return `${s}:canvas-layout:dashboard-financials:${ver}`;
      },
      minColSpan: 1,
      widgetMaxColSpans: {},
      canvasGridMinHeightOffset: 200,
      savesDesktopOnMobile: true,
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    };
  }

  protected override getLayoutSeedForCurrentPersona(): LayoutSeed {
    const slug = this.personaService.activePersonaSlug();
    switch (slug) {
      case 'frank': return FINANCIALS_FRANK_LAYOUT;
      case 'bert': return FINANCIALS_BERT_LAYOUT;
      case 'kelly': return FINANCIALS_KELLY_LAYOUT;
      case 'dominique': return FINANCIALS_DOMINIQUE_LAYOUT;
      case 'pamela': return FINANCIALS_PAMELA_LAYOUT;
      default: return FINANCIALS_FRANK_LAYOUT;
    }
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, finTitle: true, finNavKpi: true }));
  }

  readonly projects = this.store.projects;
  readonly totalProjects = computed(() => this.projects().length);

  fmtCurrency(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  }

  // --- KPI 1: Gross Margin (Profitability) ---
  readonly grossRevenue = computed(() =>
    this.glAccounts().filter(a => a.type === 'revenue').reduce((s, a) => s + a.balance, 0),
  );
  readonly directCosts = computed(() =>
    this.glAccounts().filter(a => a.code === '5000' || a.code === '5100').reduce((s, a) => s + a.balance, 0),
  );
  readonly grossProfit = computed(() => this.grossRevenue() - this.directCosts());
  readonly grossMarginPct = computed(() => {
    const rev = this.grossRevenue();
    return rev > 0 ? Math.round((this.grossProfit() / rev) * 1000) / 10 : 0;
  });
  readonly grossMarginColor = computed(() => {
    const pct = this.grossMarginPct();
    if (pct >= 10) return 'success';
    if (pct >= 5) return 'warning';
    return 'destructive';
  });

  // --- KPI 2: Cash Runway (Liquidity) ---
  readonly cashRunwayMonths = computed(() => {
    const pos = this.cashPosition();
    const burn = pos.monthlyPayroll + pos.monthlyOverhead;
    return burn > 0 ? Math.round((pos.currentBalance / burn) * 10) / 10 : Infinity;
  });
  readonly cashBalance = computed(() => this.cashPosition().currentBalance);
  readonly monthlyBurn = computed(() => {
    const pos = this.cashPosition();
    return pos.monthlyPayroll + pos.monthlyOverhead;
  });
  readonly cashRunwayColor = computed(() => {
    const mo = this.cashRunwayMonths();
    if (mo >= 3) return 'success';
    if (mo >= 1.5) return 'warning';
    return 'destructive';
  });

  // --- KPI 3: Accounts Receivable (Collections Health) ---
  readonly totalOutstandingAR = computed(() =>
    this.store.projectRevenue().reduce((sum, p) => sum + p.outstandingRaw, 0),
  );
  readonly overdueInvoiceCount = computed(() =>
    this.invoices().filter(i => i.status === 'overdue').length,
  );
  readonly arColor = computed(() => {
    const d = this.dso();
    const overdue = this.overdueInvoiceCount();
    if (d > 60 || overdue >= 4) return 'destructive';
    if (d > 30 || overdue >= 1) return 'warning';
    return 'success';
  });

  // ── Area-adaptive visible blocks ───────────────────────────────
  // For each financials widget, decide which optional blocks fit in the
  // available height. Priority-based: pack higher-priority blocks first,
  // skip lower-priority ones when budget runs out.
  readonly finVisibleBlocks = computed<Record<string, Set<string>>>(() => {
    const heights = this.widgetHeights();
    const colSpans = this.widgetColSpans();
    const result: Record<string, Set<string>> = {};

    // finNavKpi: right-column KPI stack; block set depends on persona.
    const navH = heights['finNavKpi'] ?? 294;
    const navBlocks = new Set<string>();
    if (this.isPamela()) {
      let used = 0;
      for (const b of ['kpi1', 'kpi2', 'kpi3', 'insight'] as const) {
        const cost = (b === 'insight' ? FIN_INSIGHT_PX : FIN_PAMELA_KPI_PX) + (used > 0 ? 8 : 0);
        if (used + cost <= navH) { navBlocks.add(b); used += cost; }
      }
    } else if (this.isKelly()) {
      let used = 0;
      for (const b of ['kpi1', 'kpi2', 'kpi3', 'kpi4', 'insight'] as const) {
        const cost = (b === 'insight' ? FIN_INSIGHT_PX : FIN_KELLY_KPI_PX) + (used > 0 ? 8 : 0);
        if (used + cost <= navH) { navBlocks.add(b); used += cost; }
      }
    } else {
      let used = 0;
      for (const b of ['kpi1', 'kpi2', 'kpi3', 'insight'] as const) {
        const cost = (b === 'insight' ? FIN_INSIGHT_PX : FIN_DEFAULT_KPI_PX) + (used > 0 ? 12 : 0);
        if (used + cost <= navH) { navBlocks.add(b); used += cost; }
      }
      if (!this.isMobile() && (colSpans['finNavKpi'] ?? 8) >= 6) {
        navBlocks.add('sparklines');
      }
    }
    result['finNavKpi'] = navBlocks;

    for (const widgetId of this.financialsWidgets()) {
      const h = heights[widgetId] ?? 384;
      const blocks = new Set<string>();

      if (widgetId === 'finRevenueChart') {
        const avail = h - FIN_HEADER_PX;
        let used = FIN_MIN_CHART_PX;
        blocks.add('chart');
        if (used + FIN_KPI_LINE_PX <= avail) { blocks.add('kpiLine'); used += FIN_KPI_LINE_PX; }
        if (used + FIN_INSIGHT_PX <= avail) { blocks.add('insight'); }
      } else if (widgetId === 'finJobCosts') {
        const avail = h - FIN_HEADER_PX - FIN_COL_HEADERS_PX;
        let used = FIN_MIN_TABLE_PX;
        if (used + FIN_BAR_CHART_PX + FIN_CATEGORY_CARDS_PX <= avail) {
          blocks.add('barChart'); blocks.add('categoryCards');
          used += FIN_BAR_CHART_PX + FIN_CATEGORY_CARDS_PX;
        }
        if (used + FIN_INSIGHT_PX <= avail) { blocks.add('insight'); }
      } else if (widgetId === 'finChangeOrders') {
        const avail = h - FIN_HEADER_PX - FIN_TAB_STRIP_PX - FIN_COL_HEADERS_PX;
        if (FIN_MIN_TABLE_PX + FIN_INSIGHT_PX <= avail) { blocks.add('insight'); }
      } else if (widgetId === 'finOpenEstimates' || widgetId === 'finBudgetByProject') {
        const avail = h - FIN_HEADER_PX - FIN_COL_HEADERS_PX;
        if (FIN_MIN_TABLE_PX + FIN_INSIGHT_PX <= avail) { blocks.add('insight'); }
      } else {
        const avail = h - FIN_HEADER_PX;
        if (FIN_MIN_CHILD_PX + FIN_INSIGHT_PX <= avail) { blocks.add('insight'); }
      }
      result[widgetId] = blocks;
    }
    return result;
  });

  showFinBlock(widgetId: string, block: string): boolean {
    return this.finVisibleBlocks()[widgetId]?.has(block) ?? false;
  }

  // --- KPI Sparklines (derived from finVisibleBlocks) ---
  readonly showKpiSparklines = computed(() =>
    this.finVisibleBlocks()['finNavKpi']?.has('sparklines') ?? false,
  );

  // Kelly's AP KPI cards, filtered to only those that fit in the current height.
  readonly kellyVisibleKpiCards = computed<ApKpiCard[]>(() => {
    const all = this.kellyApKpiCards();
    const blocks = this.finVisibleBlocks()['finNavKpi'];
    if (!blocks) return all;
    const visible: ApKpiCard[] = [];
    const keys = ['kpi1', 'kpi2', 'kpi3', 'kpi4'] as const;
    for (let i = 0; i < all.length; i++) {
      if (blocks.has(keys[i])) visible.push(all[i]);
    }
    return visible;
  });

  readonly revenueChartHeight = computed(() => {
    const widgetH = this.widgetHeights()['finRevenueChart'] ?? 512;
    const chrome = 172;
    return Math.max(widgetH - chrome, 120);
  });

  readonly marginSparkline = computed<number[]>(() => {
    const entries = this.glEntries();
    const months = new Map<string, { rev: number; cost: number }>();
    for (const e of entries) {
      const ym = e.date.slice(0, 7);
      if (!months.has(ym)) months.set(ym, { rev: 0, cost: 0 });
      const bucket = months.get(ym)!;
      if (e.accountCode === '4000' || e.accountCode === '4100') bucket.rev += e.credit;
      if (e.accountCode === '5000' || e.accountCode === '5100') bucket.cost += e.debit;
    }
    const sorted = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let cumRev = 0;
    let cumCost = 0;
    return sorted.map(([, m]) => {
      cumRev += m.rev;
      cumCost += m.cost;
      return cumRev > 0 ? Math.round(((cumRev - cumCost) / cumRev) * 1000) / 10 : 0;
    });
  });

  readonly runwaySparkline = computed<number[]>(() => {
    const history = this.cashFlowHistory();
    const burn = this.monthlyBurn();
    if (burn <= 0) return [];
    return history.map(h => Math.round((h.runningBalance / burn) * 10) / 10);
  });

  readonly arSparkline = computed<number[]>(() => {
    const entries = this.glEntries();
    const months = new Map<string, number>();
    for (const e of entries) {
      if (e.accountCode !== '1100') continue;
      const ym = e.date.slice(0, 7);
      months.set(ym, e.balance);
    }
    return [...months.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, bal]) => bal);
  });

  private cssColor(status: string): string {
    const el = document.documentElement;
    const style = getComputedStyle(el);
    if (status === 'success') return style.getPropertyValue('--color-success').trim() || '#4caf50';
    if (status === 'warning') return style.getPropertyValue('--color-warning').trim() || '#fb8c00';
    return style.getPropertyValue('--color-destructive').trim() || '#e53935';
  }

  readonly marginChartOptions = computed(() => ({
    series: [{ name: 'Margin', data: this.marginSparkline() }] as ApexAxisChartSeries,
    chart: { type: 'area' as const, height: 36, sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { opacity: 0.15 },
    colors: [this.cssColor(this.grossMarginColor())],
    tooltip: { enabled: false },
  }));

  readonly runwayChartOptions = computed(() => ({
    series: [{ name: 'Runway', data: this.runwaySparkline() }] as ApexAxisChartSeries,
    chart: { type: 'area' as const, height: 36, sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { opacity: 0.15 },
    colors: [this.cssColor(this.cashRunwayColor())],
    tooltip: { enabled: false },
  }));

  readonly arChartOptions = computed(() => ({
    series: [{ name: 'AR', data: this.arSparkline() }] as ApexAxisChartSeries,
    chart: { type: 'area' as const, height: 36, sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { opacity: 0.15 },
    colors: [this.cssColor(this.arColor())],
    tooltip: { enabled: false },
  }));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;

  readonly isKelly = computed(() => this.personaService.activePersonaSlug() === 'kelly');
  readonly isPamela = computed(() => this.personaService.activePersonaSlug() === 'pamela');

  private readonly _registerFinancialsWidgets = effect(() => {
    const widgets = this.isKelly() ? KELLY_FINANCIALS_WIDGETS
      : this.isPamela() ? PAMELA_FINANCIALS_WIDGETS
      : FINANCIALS_WIDGETS;
    untracked(() => this.widgetFocusService.registerWidgets(widgets));
  });

  readonly financialsWidgets = computed<DashboardWidgetId[]>(() => {
    if (this.isKelly()) {
      return ['finInvoiceQueue', 'finPaymentSchedule', 'finVendorAging', 'finPayApps', 'finLienWaivers', 'finRetention', 'finApActivity', 'finCashOutflow'];
    }
    if (this.isPamela()) {
      return ['finOpenEstimates', 'finJobCosts', 'finChangeOrders'];
    }
    return ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders'];
  });

  readonly kellyApKpisInsight = computed<string | null>(() => this.getFinWidgetInsight('finApKpis'));
  readonly kellyInvoiceQueueInsight = computed<string | null>(() => this.getFinWidgetInsight('finInvoiceQueue'));
  readonly kellyPaymentScheduleInsight = computed<string | null>(() => this.getFinWidgetInsight('finPaymentSchedule'));
  readonly kellyVendorAgingInsight = computed<string | null>(() => this.getFinWidgetInsight('finVendorAging'));
  readonly kellyPayAppsInsight = computed<string | null>(() => this.getFinWidgetInsight('finPayApps'));
  readonly kellyLienWaiversInsight = computed<string | null>(() => this.getFinWidgetInsight('finLienWaivers'));
  readonly kellyRetentionInsight = computed<string | null>(() => this.getFinWidgetInsight('finRetention'));
  readonly kellyApActivityInsight = computed<string | null>(() => this.getFinWidgetInsight('finApActivity'));
  readonly kellyCashOutflowInsight = computed<string | null>(() => this.getFinWidgetInsight('finCashOutflow'));

  navigateToApSubpage(): void {
    this.selectSubPage('accounts-payable');
  }

  readonly finNavLinkItems = computed(() => this.finSubNavItems().filter(i => i.value !== 'overview'));


  private readonly finSubPageDescriptions: Record<string, string> = {
    'estimates': 'Open estimates, pricing proposals, and pending approvals',
    'change-orders': 'Owner, subcontractor, and internal change orders across all projects',
    'job-costs': 'Cost breakdown by category and project across the portfolio',
    'job-billing': 'Billing schedules and invoice events across all projects',
    'accounts-receivable': 'Invoices, aging, and collection metrics',
    'accounts-payable': 'Vendor payables, invoices, pay apps, lien waivers, retention, and payment schedules',
    'cash-management': 'Cash position, flow trends, and runway analysis',
    'general-ledger': 'Chart of accounts, journal entries, and trial balance',
    'purchase-orders': 'Material procurement, vendor deliveries, and committed spend',
    'payroll': 'Weekly payroll, labor costs, headcount, and overtime tracking',
    'contracts': 'Prime contracts, subcontracts, and committed values across all projects',
    'subcontract-ledger': 'Payment applications, retainage, backcharges, and change order adjustments',
  };

  readonly activeSubPageTitle = computed(() => {
    return this.finSubNavItems().find(i => i.value === this.activeSubPage())?.label ?? '';
  });

  readonly activeSubPageDescription = computed(() => {
    return this.finSubPageDescriptions[this.activeSubPage()] ?? '';
  });

  readonly navLinkTotalAlerts = computed(() => {
    const a = this.finSubnavAlerts();
    let total = 0;
    for (const key of Object.keys(a)) {
      if (a[key]) total += a[key]!.count;
    }
    return total;
  });

  readonly navLinkHasCriticalAlerts = computed(() => {
    const a = this.finSubnavAlerts();
    return Object.values(a).some(v => v?.level === 'critical');
  });

  readonly estimates = this.store.estimates;
  readonly pamelaOpenEstimates = computed(() =>
    this.estimates()
      .filter(e => e.status !== 'Approved')
      .sort((a, b) => a.daysLeft - b.daysLeft)
  );
  readonly estimateBadgeColor = estimateBadgeColor;
  readonly dueDateClass = dueDateClass;

  private readonly estimatesContainerRef = viewChild<ElementRef>('estimatesContainer');
  readonly estimatesContainerWidth = signal<number>(0);
  readonly estimatesBreakpoint = computed<'wide' | 'narrow' | 'xNarrow' | 'xxNarrow' | 'ultraNarrow'>(() => {
    const w = this.estimatesContainerWidth();
    if (w > 0 && w <= 450) return 'ultraNarrow';
    if (w > 0 && w <= 680) return 'xxNarrow';
    if (w > 0 && w <= 760) return 'xNarrow';
    if (w > 0 && w <= 1000) return 'narrow';
    return 'wide';
  });
  readonly estimatesNarrow = computed(() => this.estimatesBreakpoint() !== 'wide');
  readonly estimatesXNarrow = computed(() => {
    const bp = this.estimatesBreakpoint();
    return bp === 'xNarrow' || bp === 'xxNarrow' || bp === 'ultraNarrow';
  });
  readonly estimatesXXNarrow = computed(() => {
    const bp = this.estimatesBreakpoint();
    return bp === 'xxNarrow' || bp === 'ultraNarrow';
  });
  readonly estimatesUltraNarrow = computed(() => this.estimatesBreakpoint() === 'ultraNarrow');
  private readonly _estimatesResizeEffect = this.trackContainerWidth(this.estimatesContainerRef, this.estimatesContainerWidth);

  readonly coTabs: { label: string; value: ChangeOrderType | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Prime Contract', value: 'prime' },
    { label: 'Potential', value: 'potential' },
    { label: 'Subcontract', value: 'subcontract' },
  ];
  readonly activeCoTab = signal<ChangeOrderType | 'all'>('all');
  readonly filteredChangeOrders = computed(() => {
    const tab = this.activeCoTab();
    const all = this.store.changeOrders();
    return tab === 'all' ? all : all.filter(co => co.coType === tab);
  });
  coTabCount(tab: ChangeOrderType | 'all'): number {
    const all = this.store.changeOrders();
    return tab === 'all' ? all.length : all.filter(co => co.coType === tab).length;
  }
  readonly coBadgeColor = coBadgeColor;
  readonly coTypeLabel = coTypeLabel;

  readonly capitalizeFirst = sharedCapitalizeFirst;

  readonly invoiceStatusBadge = invoiceStatusBadge;
  readonly billingFrequencyLabel = billingFrequencyLabel;
  readonly payableStatusBadge = payableStatusBadge;
  readonly poStatusBadge = poStatusBadge;
  readonly payrollStatusBadge = payrollStatusBadge;
  readonly contractStatusBadge = contractStatusBadge;
  readonly contractTypeLabel = contractTypeLabel;
  readonly contractTypeLabelShort = contractTypeLabelShort;
  readonly ledgerTypeBadge = ledgerTypeBadge;
  readonly ledgerTypeLabel = ledgerTypeLabel;

  selectSubPage(value: string): void {
    this.activeSubPage.set(value);
    const url = new URL(window.location.href);
    if (value === 'overview') {
      url.searchParams.delete('subpage');
    } else {
      url.searchParams.set('subpage', value);
    }
    window.history.replaceState({}, '', url.toString());
  }

  selectSubPageFromNavLinks(value: string): void {
    this.selectSubPage(value);
  }

  private readonly _restoreSubPage = effect(() => {
    const params = this.route.snapshot.queryParamMap;
    const sp = params.get('subpage');
    if (sp && this.finSubNavItems().some(i => i.value === sp)) {
      this.activeSubPage.set(sp);
    }
  });

  navigateToChangeOrder(id: string): void {
    this.router.navigate([`${this.pp}/financials/change-orders`, id]);
  }

  private buildFinAgentState(): AgentDataState {
    return {
      projects: this.store.projects(),
      estimates: this.store.estimates(),
      changeOrders: this.store.changeOrders(),
      invoices: this.store.invoices(),
      billingSchedules: this.store.billingSchedules(),
      billingEvents: this.store.billingEvents(),
      payables: this.store.payables(),
      cashFlowHistory: this.store.cashFlowHistory(),
      cashPosition: this.store.cashPosition(),
      glAccounts: this.store.glAccounts(),
      glEntries: this.store.glEntries(),
      purchaseOrders: this.store.purchaseOrders(),
      payrollRecords: this.store.payrollRecords(),
      contracts: this.store.contracts(),
      subcontractLedger: this.store.subcontractLedger(),
      allWeatherData: this.store.weatherData(),
      allJobCosts: this.store.projectJobCosts(),
      apInvoices: this.store.apInvoices(),
      apVendors: this.store.apVendors(),
      apPayApplications: this.store.apPayApplications(),
      apLienWaivers: this.store.apLienWaivers(),
      apRetention: this.store.apRetention(),
      apActivities: this.store.apActivities(),
      apPaymentSchedule: this.store.apPaymentSchedule(),
      currentPage: 'financials',
      currentSubPage: this.activeSubPage(),
    };
  }

  getFinWidgetInsight(widgetId: string): string | null {
    const agentId = widgetId === 'finRevenueChart' ? 'revenue' : widgetId === 'finOpenEstimates' ? 'openEstimates' : widgetId === 'finChangeOrders' ? 'financialsChangeOrders' : widgetId;
    const agent = getAgent(agentId, 'financials');
    return agent.insight?.(this.buildFinAgentState()) ?? null;
  }

  readonly revenueInsight = computed<string | null>(() => this.getFinWidgetInsight('finRevenueChart'));
  readonly estimatesInsight = computed<string | null>(() => this.getFinWidgetInsight('finOpenEstimates'));
  readonly budgetByProjectInsight = computed<string | null>(() => this.getFinWidgetInsight('finBudgetByProject'));
  readonly jobCostsInsight = computed<string | null>(() => this.getFinWidgetInsight('finJobCosts'));
  readonly changeOrdersInsight = computed<string | null>(() => this.getFinWidgetInsight('finChangeOrders'));
  readonly finKpiInsight = computed<string | null>(() => {
    const agent = getAgent('financialsDefault', 'financials');
    return agent.insight?.(this.buildFinAgentState()) ?? null;
  });
  readonly jobCostKpiInsight = computed<string | null>(() => {
    const agent = getAgent('financialsJobCostDetail', 'financials-job-cost-detail');
    const state = this.buildFinAgentState();
    state.jobCostDetailProject = this.jobCostDetailProject() ?? undefined;
    return agent.insight?.(state) ?? null;
  });

  readonly finSubnavAlerts = computed<Record<string, AgentAlert | null>>(() => {
    const state = this.buildFinAgentState();
    const map: Record<string, string> = {
      'estimates': 'openEstimates',
      'change-orders': 'finChangeOrders',
      'job-costs': 'financialsJobCostDetail',
      'job-billing': 'finJobBilling',
      'accounts-receivable': 'finAccountsReceivable',
      'accounts-payable': 'finAccountsPayable',
      'cash-management': 'finCashManagement',
      'general-ledger': 'finGeneralLedger',
      'purchase-orders': 'finPurchaseOrders',
      'payroll': 'finPayroll',
      'contracts': 'finContracts',
      'subcontract-ledger': 'finSubcontractLedger',
    };
    const result: Record<string, AgentAlert | null> = {};
    for (const [navValue, agentId] of Object.entries(map)) {
      const agent = getAgent(agentId, 'financials');
      result[navValue] = agent.alerts?.(state) ?? null;
    }
    return result;
  });

  readonly timeRanges: RevenueTimeRange[] = ['1M', 'YTD', '1Y', '3Y', '5Y'];
  readonly selectedRange = signal<RevenueTimeRange>('1Y');

  readonly revenueData = computed(() => getRevenueData(this.selectedRange(), this.store.monthlyRevenue()));
  readonly revenueSummary = computed(() => getRevenueSummary(this.selectedRange(), this.store.annualTotals()));

  private resolveCssVar(prop: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  readonly revenueChartOptions = computed(() => {
    const data = this.revenueData();
    const values = data.map(d => d.value);
    const categories = data.map(d => d.label);
    const primaryColor = this.resolveCssVar('--color-primary');
    const successColor = this.resolveCssVar('--color-success');
    const destructiveColor = this.resolveCssVar('--color-destructive');
    const borderColor = this.resolveCssVar('--color-border');
    const fgMuted = this.resolveCssVar('--color-foreground');
    const labelFg = this.resolveCssVar('--color-success-foreground') || this.resolveCssVar('--color-primary-foreground');

    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    const minVal = values.length > 0 ? Math.min(...values) : 0;

    const tickCount = Math.min(categories.length, 6);
    const tickInterval = categories.length > tickCount ? Math.ceil(categories.length / tickCount) : 1;

    return {
      series: [{ name: 'Revenue', data: values }] as ApexAxisChartSeries,
      chart: {
        type: 'area' as const,
        height: this.revenueChartHeight(),
        sparkline: { enabled: false },
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false },
        fontFamily: 'inherit',
      },
      stroke: { curve: 'smooth' as const, width: 2.5 },
      fill: {
        type: 'gradient' as const,
        gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] },
      },
      colors: [primaryColor],
      dataLabels: { enabled: false },
      grid: {
        borderColor,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8, top: 0, bottom: 0 },
      },
      xaxis: {
        categories,
        labels: {
          style: { colors: fgMuted, fontSize: '10px', cssClass: 'text-foreground-40' },
          rotate: 0,
          hideOverlappingLabels: true,
          ...(tickInterval > 1 ? { tickAmount: tickCount } : {}),
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          style: { colors: fgMuted, fontSize: '10px' },
          formatter: (val: number) => this.formatCompact(val),
        },
      },
      tooltip: {
        enabled: true,
        y: { formatter: (val: number) => this.formatCurrency(val) },
        theme: 'dark',
        style: { fontSize: '12px' },
      },
      markers: {
        size: data.length <= 20 ? 3 : 0,
        strokeWidth: 2,
        strokeColors: primaryColor,
        hover: { size: 5 },
      },
      annotations: {
        yaxis: [
          ...(maxVal > 0 ? [{
            y: maxVal,
            borderColor: successColor,
            strokeDashArray: 6,
            label: { text: `H: ${this.formatCurrency(maxVal)}`, borderColor: successColor, style: { color: labelFg, background: successColor, fontSize: '10px', padding: { left: 4, right: 4, top: 2, bottom: 2 } }, position: 'front' as const },
          }] : []),
          ...(minVal > 0 && minVal !== maxVal ? [{
            y: minVal,
            borderColor: destructiveColor,
            strokeDashArray: 6,
            label: { text: `L: ${this.formatCurrency(minVal)}`, borderColor: destructiveColor, style: { color: labelFg, background: destructiveColor, fontSize: '10px', padding: { left: 4, right: 4, top: 2, bottom: 2 } }, position: 'front' as const },
          }] : []),
        ],
      },
    };
  });

  selectRange(range: RevenueTimeRange): void {
    this.selectedRange.set(range);
  }

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${value}`;
  }

  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return undefined;
  }

  readonly budgetProgressClass = budgetProgressClass;

  readonly jobCostSummary = computed(() => getJobCostSummary(this.store.projectJobCosts()));
  readonly projectJobCosts = this.store.projectJobCosts;
  readonly jobCostCategories = JOB_COST_CATEGORIES;

  readonly formatJobCost = sharedFormatJobCost;

  getCost(costs: Record<JobCostCategory, number>, cat: JobCostCategory): number {
    return costs[cat];
  }

  readonly jobCostDetailProject = signal<ProjectJobCost | null>(null);

  readonly detailCategories = computed(() => {
    const p = this.jobCostDetailProject();
    if (!p) return [];
    const totalSpend = JOB_COST_CATEGORIES.reduce((sum, cat) => sum + p.costs[cat], 0);
    const summary = this.jobCostSummary();
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

  readonly detailBudgetInfo = computed(() => {
    const p = this.jobCostDetailProject();
    if (!p) return { total: 0, spent: 0, remaining: 0, pct: 0 };
    const totalSpend = JOB_COST_CATEGORIES.reduce((sum, cat) => sum + p.costs[cat], 0);
    const budgetTotal = parseFloat(p.budgetTotal.replace(/[^0-9.]/g, '')) * (p.budgetTotal.includes('M') ? 1_000_000 : p.budgetTotal.includes('K') ? 1_000 : 1);
    return { total: budgetTotal, spent: totalSpend, remaining: budgetTotal - totalSpend, pct: p.budgetPct };
  });

  readonly pfW = 500;
  readonly pfH = 160;
  readonly pfPadX = 10;
  readonly pfPadY = 10;

  readonly profitFadeData = computed(() => {
    const p = this.jobCostDetailProject();
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

  readonly pfChartPoints = computed(() => {
    const d = this.profitFadeData();
    if (!d || d.points.length === 0) return [];
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const w = this.pfW - this.pfPadX * 2;
    const h = this.pfH - this.pfPadY * 2;
    return d.points.map((p, i) => ({
      x: this.pfPadX + (d.points.length > 1 ? (i / (d.points.length - 1)) * w : w / 2),
      y: this.pfPadY + h - ((p.margin - minV) / range) * h,
    }));
  });

  readonly pfBaselineY = computed(() => {
    const d = this.profitFadeData();
    if (!d || d.points.length === 0) return this.pfH / 2;
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const h = this.pfH - this.pfPadY * 2;
    return this.pfPadY + h - ((d.originalMargin - minV) / range) * h;
  });

  readonly pfLinePath = computed(() => {
    const pts = this.pfChartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  });

  readonly pfAreaPath = computed(() => {
    const pts = this.pfChartPoints();
    const baseY = this.pfBaselineY();
    if (pts.length === 0) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `${line} L${pts[pts.length - 1].x},${baseY} L${pts[0].x},${baseY} Z`;
  });

  readonly pfGridLines = computed(() => {
    const d = this.profitFadeData();
    if (!d || d.points.length === 0) return [];
    const all = [d.originalMargin, ...d.points.map(p => p.margin)];
    const maxV = Math.max(...all) + 2;
    const minV = Math.min(...all) - 2;
    const range = maxV - minV || 1;
    const h = this.pfH - this.pfPadY * 2;
    const steps = 4;
    const lines: { y: number; label: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const val = minV + (range * (steps - i)) / steps;
      lines.push({ y: this.pfPadY + (i / steps) * h, label: `${val.toFixed(0)}%` });
    }
    return lines;
  });

  readonly pfMonthLabels = computed(() => {
    const d = this.profitFadeData();
    if (!d || d.points.length === 0) return [];
    return d.points.map((p, i) => ({
      text: p.month,
      pct: d.points.length > 1 ? (i / (d.points.length - 1)) * 100 : 50,
    }));
  });

  readonly pfCategoryFade = computed(() => {
    const p = this.jobCostDetailProject();
    const d = this.profitFadeData();
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

  openJobCostDetail(p: ProjectJobCost): void {
    const proj = this.store.findProjectById(p.projectId);
    const slug = proj?.slug ?? String(p.projectId);
    this.router.navigate([`${this.pp}/financials/job-costs`, slug]);
  }

  private activateJobCostDetail(p: ProjectJobCost): void {
    this.jobCostDetailProject.set(p);
    this.navHistory.shellBackButton.set({ label: 'Back', action: () => this.closeJobCostDetail() });
    this.setTitleOverrideForProject(p);
  }

  closeJobCostDetail(): void {
    this.jobCostDetailProject.set(null);
    this.navHistory.shellBackButton.set(null);
    this.navHistory.shellTitleOverride.set(null);
    this.router.navigate([`${this.pp}/financials`]);
  }

  private setTitleOverrideForProject(current: ProjectJobCost): void {
    const otherProjects = this.projectJobCosts().filter(p => p.projectId !== current.projectId);
    this.navHistory.shellTitleOverride.set({
      text: current.projectName,
      items: otherProjects.map(p => {
        const proj = this.store.findProjectById(p.projectId);
        return { id: p.projectId, label: p.projectName, sublabel: p.budgetUsed, slug: proj?.slug ?? '' };
      }),
      onSelect: (id: number) => {
        const proj = this.store.findProjectById(id);
        if (proj) this.router.navigate([`${this.pp}/financials/job-costs`, proj.slug]);
      },
    });
  }

  private trackContainerWidth(
    ref: ReturnType<typeof viewChild<ElementRef>>,
    widthSignal: ReturnType<typeof signal<number>>,
  ) {
    let observer: ResizeObserver | null = null;
    return effect(() => {
      const el = ref()?.nativeElement as HTMLElement | undefined;
      observer?.disconnect();
      observer = null;
      if (!el) {
        widthSignal.set(0);
        return;
      }
      widthSignal.set(el.offsetWidth);
      const ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect.width ?? el.offsetWidth;
        widthSignal.set(w);
      });
      ro.observe(el);
      observer = ro;
    });
  }

  mobileGridHeight(): number {
    return this.engine.mobileGridHeight();
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResize(target, dir, event, edge);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResizeTouch(target, dir, event, edge);
  }

  navigateToEstimate(id: string): void {
    this.router.navigate([`${this.pp}/financials/estimates`, id]);
  }

  navigateToInvoice(id: string): void {
    this.router.navigate([`${this.pp}/financials/invoices`, id]);
  }

  navigateToPayable(id: string): void {
    this.router.navigate([`${this.pp}/financials/payables`, id]);
  }

  navigateToPurchaseOrder(id: string): void {
    this.router.navigate([`${this.pp}/financials/purchase-orders`, id]);
  }

  navigateToContract(id: string): void {
    this.router.navigate([`${this.pp}/financials/contracts`, id]);
  }

  navigateToBillingEvent(id: string): void {
    this.router.navigate([`${this.pp}/financials/billing`, id]);
  }

  navigateToPayrollRecord(id: string): void {
    this.router.navigate([`${this.pp}/financials/payroll`, id]);
  }

  navigateToPayrollMonthly(month: string): void {
    this.router.navigate([`${this.pp}/financials/payroll-monthly`, encodeURIComponent(month)]);
  }

  navigateToSubcontractLedgerEntry(id: string): void {
    this.router.navigate([`${this.pp}/financials/subcontract-ledger`, id]);
  }

  navigateToGlEntry(id: string): void {
    this.router.navigate([`${this.pp}/financials/gl-entries`, id]);
  }

  navigateToGlAccount(code: string): void {
    this.router.navigate([`${this.pp}/financials/gl-accounts`, code]);
  }

  navigateToCashFlow(month: string): void {
    this.router.navigate([`${this.pp}/financials/cash-flow`, encodeURIComponent(month)]);
  }

  toggleWidgetLock(id: string): void {
    this.engine.toggleWidgetLock(id);
  }

  private resolveSlugToProject(slug: string): ProjectJobCost | null {
    const proj = this.store.findProjectBySlug(slug);
    if (!proj) return null;
    return this.projectJobCosts().find(p => p.projectId === proj.id) ?? null;
  }

  private activateEntityDetail(type: FinDetailType, subPage: string, paramValue: string): void {
    this.jobCostDetailProject.set(null);
    this.finDetailType.set(type);
    this.finDetailId.set(paramValue);
    this.activeSubPage.set(subPage);
    this.navHistory.shellBackButton.set({
      label: 'Back',
      action: () => this.closeEntityDetail(subPage),
    });
    this.navHistory.shellTitleOverride.set(null);
  }

  closeEntityDetail(returnToSubPage?: string): void {
    this.finDetailType.set(null);
    this.finDetailId.set(null);
    this.navHistory.shellBackButton.set(null);
    this.navHistory.shellTitleOverride.set(null);
    const subPage = returnToSubPage ?? this.activeSubPage();
    if (subPage && subPage !== 'overview') {
      this.router.navigate([`${this.pp}/financials`], { queryParams: { subpage: subPage } });
    } else {
      this.router.navigate([`${this.pp}/financials`]);
    }
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const slug = params.get('slug');
      const routeSegment = this.route.snapshot.url[0]?.path;
      const routeConfig = routeSegment ? ROUTE_TO_DETAIL[routeSegment] : undefined;

      if (slug) {
        const match = this.resolveSlugToProject(slug);
        if (match) {
          this.activateJobCostDetail(match);
        } else {
          this.router.navigate([`${this.pp}/financials`]);
        }
      } else if (routeConfig) {
        const paramValue = params.get(routeConfig.paramKey);
        if (paramValue) {
          this.activateEntityDetail(routeConfig.type, routeConfig.subPage, paramValue);
        } else {
          this.router.navigate([`${this.pp}/financials`]);
        }
      } else {
        this.jobCostDetailProject.set(null);
        this.finDetailType.set(null);
        this.finDetailId.set(null);
        this.navHistory.shellBackButton.set(null);
        this.navHistory.shellTitleOverride.set(null);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.navHistory.shellBackButton.set(null);
      this.navHistory.shellTitleOverride.set(null);
    });
  }
}
