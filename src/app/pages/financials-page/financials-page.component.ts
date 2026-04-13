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
import { FINANCIALS_DEFAULT_LAYOUT } from '../../data/layout-seeds/financials-default.layout';
import { FINANCIALS_KELLY_LAYOUT } from '../../data/layout-seeds/financials-kelly.layout';
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

@Component({
  selector: 'app-financials-page',
  imports: [NgTemplateOutlet, ModusProgressComponent, ModusButtonComponent, ModusBadgeComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent, CollapsibleSubnavComponent, ChartComponent, HomeInvoiceQueueComponent, HomeVendorAgingComponent, HomePayAppsComponent, HomeLienWaiversComponent, HomeRetentionComponent, HomePaymentScheduleComponent, HomeApActivityComponent, HomeApKpiCardsComponent, HomeCashOutflowComponent, EstimateAssemblyHubComponent],
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
            <div class="text-2xl font-bold text-foreground">{{ project.projectName }}</div>
            <div class="text-sm text-foreground-60">{{ project.client }}</div>
          </div>
        </div>

        <!-- Budget overview row -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-base text-primary" aria-hidden="true">payment_instant</i>
              </div>
              <div class="text-sm font-medium text-foreground-60">Total Budget</div>
            </div>
            <div class="text-3xl font-bold text-foreground">{{ project.budgetTotal }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-warning-20 flex items-center justify-center">
                <i class="modus-icons text-base text-warning" aria-hidden="true">bar_graph_line</i>
              </div>
              <div class="text-sm font-medium text-foreground-60">Total Spent</div>
            </div>
            <div class="text-3xl font-bold text-foreground">{{ project.budgetUsed }}</div>
            <div class="text-xs {{ project.budgetPct >= 90 ? 'text-destructive' : project.budgetPct >= 75 ? 'text-warning' : 'text-success' }} font-medium">{{ project.budgetPct }}% of budget</div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-success-20 flex items-center justify-center">
                <i class="modus-icons text-base text-success" aria-hidden="true">bar_graph</i>
              </div>
              <div class="text-sm font-medium text-foreground-60">Remaining</div>
            </div>
            <div class="text-3xl font-bold text-success">{{ formatJobCost(detailBudgetInfo().remaining) }}</div>
            <div class="text-xs text-success font-medium">{{ 100 - project.budgetPct }}% remaining</div>
          </div>
          <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">dashboard</i>
              </div>
              <div class="text-sm font-medium text-foreground-60">Budget Health</div>
            </div>
            <div class="w-full mt-1">
              <modus-progress [value]="project.budgetPct" [max]="100" [className]="budgetProgressClass(project.budgetPct)" />
            </div>
            <div class="text-xs text-foreground-60">{{ project.budgetUsed }} of {{ project.budgetTotal }} used</div>
          </div>
        </div>
        @if (jobCostKpiInsight()) {
          <div class="flex items-center gap-1.5 px-5 py-2 mb-6 bg-card border-default rounded-lg">
            <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
            <div class="text-xs text-foreground-60 truncate leading-none">{{ jobCostKpiInsight() }}</div>
          </div>
        } @else {
          <div class="mb-2"></div>
        }

        <!-- Cost breakdown card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-2 px-5 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">bar_graph</i>
            <div class="text-base font-semibold text-foreground">Cost Breakdown</div>
          </div>

          <div class="px-5 py-5 flex flex-col gap-5">
            <!-- Stacked bar -->
            <div class="flex flex-col gap-2">
              <div class="flex w-full h-5 rounded-full overflow-hidden">
                @for (cat of detailCategories(); track cat.label) {
                  <div class="{{ cat.colorClass }}" [style.width.%]="cat.pctOfSpend"></div>
                }
              </div>
              <div class="flex items-center justify-between text-2xs text-foreground-40">
                <div>0%</div>
                <div>{{ formatJobCost(detailBudgetInfo().spent) }} total spend</div>
                <div>100%</div>
              </div>
            </div>

            <!-- Category detail cards -->
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              @for (cat of detailCategories(); track cat.label) {
                <div class="flex flex-col gap-3 p-4 bg-background border-default rounded-lg">
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

        <!-- Profit Fade/Gain widget -->
        @if (profitFadeData(); as pf) {
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">arrow_up</i>
              <div class="text-base font-semibold text-foreground">Profit Fade / Gain</div>
            </div>
            <div class="flex items-center gap-2">
              <div class="px-2.5 py-1 rounded-full text-xs font-semibold {{ pf.isFade ? 'bg-destructive-20 text-destructive' : 'bg-success-20 text-success' }}">
                {{ pf.isFade ? 'Fade' : 'Gain' }} {{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%
              </div>
            </div>
          </div>

          <div class="px-5 py-5 flex flex-col gap-5">
            <!-- KPI row -->
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
                  <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'arrow_down' : 'arrow_up' }}</i>
                  <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%</div>
                </div>
                <div class="text-xs text-foreground-60">{{ pf.isFade ? 'Below original estimate' : 'Above original estimate' }}</div>
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

              <div class="absolute bottom-0 left-9 right-0 text-2xs text-foreground-40" style="position:relative">
                @for (lbl of pfMonthLabels(); track lbl.pct) {
                  <div class="absolute" [style.left.%]="lbl.pct" style="transform:translateX(-50%)">{{ lbl.text }}</div>
                }
              </div>

              <div class="absolute top-0 left-0 bottom-5 flex flex-col justify-between text-2xs text-foreground-40">
                @for (line of pfGridLines(); track line.y) {
                  <div>{{ line.label }}</div>
                }
              </div>

              <div class="absolute text-2xs font-medium text-foreground-60" style="right:4px" [style.top.px]="pfBaselineY() - 14">
                Est. {{ pf.originalMargin }}%
              </div>
            </div>

            <!-- Category-level fade attribution -->
            <div class="flex flex-col gap-3">
              <div class="text-sm font-semibold text-foreground">Fade / Gain by Category</div>
              <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                @for (cf of pfCategoryFade(); track cf.label) {
                  <div class="flex flex-col gap-2 p-3 bg-background border-default rounded-lg">
                    <div class="flex items-center gap-1.5">
                      <div class="w-2.5 h-2.5 rounded-full {{ cf.colorClass }} flex-shrink-0"></div>
                      <div class="text-xs text-foreground-60 font-medium">{{ cf.label }}</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <i class="modus-icons text-sm {{ cf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ cf.isFade ? 'arrow_down' : 'arrow_up' }}</i>
                      <div class="text-sm font-bold {{ cf.isFade ? 'text-destructive' : 'text-success' }}">{{ cf.isFade ? '' : '+' }}{{ cf.fadeAmount }}%</div>
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
            <div class="text-base font-semibold text-foreground">Cost Summary</div>
          </div>

          <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
            <div role="columnheader">Category</div>
            <div class="text-right" role="columnheader">Amount</div>
            <div class="text-right" role="columnheader">% of Spend</div>
            <div class="text-right" role="columnheader">% of Budget</div>
          </div>

          <div role="table" aria-label="Cost summary">
            @for (cat of detailCategories(); track cat.label) {
              <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                <div class="flex items-center gap-2" role="cell">
                  <div class="w-2.5 h-2.5 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                  <div class="text-sm font-medium text-foreground">{{ cat.label }}</div>
                </div>
                <div class="text-sm font-semibold text-foreground text-right" role="cell">{{ formatJobCost(cat.amount) }}</div>
                <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfSpend }}%</div>
                <div class="text-sm text-foreground-60 text-right" role="cell">{{ cat.pctOfBudget }}%</div>
              </div>
            }
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-3 px-5 py-3 bg-muted items-center" role="row">
              <div class="text-sm font-bold text-foreground" role="cell">Total</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">{{ formatJobCost(detailBudgetInfo().spent) }}</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">100%</div>
              <div class="text-sm font-bold text-foreground text-right" role="cell">{{ project.budgetPct }}%</div>
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
              <div class="text-2xl font-bold text-foreground truncate">{{ meta.title }}</div>
              @if (meta.status) {
                <modus-badge [color]="meta.statusColor ?? 'secondary'" variant="outlined" size="sm">{{ meta.status }}</modus-badge>
              }
            </div>
            <div class="text-sm text-foreground-60">{{ meta.subtitle }}</div>
          </div>
        </div>

        @if (isEldoradoEstimate()) {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <!-- Project Estimate -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <div class="text-base font-semibold text-foreground mb-2">Project Estimate</div>
              <div class="flex gap-6 flex-wrap text-2xs text-foreground-60 uppercase tracking-wide font-semibold">
                <div>Actual</div>
                <div>Proposal Cost</div>
                <div>Estimated Profit Margin</div>
              </div>
              <div class="flex items-baseline gap-6 flex-wrap">
                <div class="text-2xl font-bold text-foreground">$6 M.</div>
                <div class="text-2xl font-bold text-foreground">$8,170,000</div>
                <div class="text-2xl font-bold text-foreground">26.38%</div>
              </div>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-xs text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">calendar</i> Updated July 3, 2026</div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">dashboard</i> Confidence: 91%</div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">bar_graph_line</i> Complexity: 87%</div>
                </div>
                <div>
                  <modus-button variant="outlined" size="sm" color="primary">Check Estimation</modus-button>
                </div>
              </div>
            </div>

            <!-- Bid Intelligence -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <div class="flex items-center justify-between mb-2">
                <div class="text-base font-semibold text-foreground">Bid Intelligence</div>
                <modus-badge color="warning" size="sm">Medium</modus-badge>
              </div>
              <div class="text-2xs invisible">&#8203;</div>
              <div class="flex items-baseline gap-2">
                <div class="text-2xl font-bold text-foreground">78%</div>
                <div class="text-base text-foreground-60">win probability</div>
              </div>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-xs text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">people_group</i> 4-6 expected bidders</div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">auto_target</i> Target: 8-12% margin</div>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <modus-button variant="outlined" size="sm" color="primary">View Risks</modus-button>
                  <div class="bg-warning-20 text-warning text-xs font-medium px-3 py-1 rounded-full">Copper pricing, Seismic survey</div>
                </div>
              </div>
            </div>

            <!-- Field Intelligence -->
            <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-1">
              <div class="text-base font-semibold text-foreground mb-2">Field Intelligence</div>
              <div class="text-2xs invisible">&#8203;</div>
              <div class="text-2xl font-bold text-foreground">Geotechnical ready</div>
              <div class="mt-auto flex flex-col gap-3 pt-3">
                <div class="flex items-center gap-4 text-xs text-foreground-60 flex-wrap">
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">location</i> 4230 Riverside Blvd</div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">ruler</i> 32,000 ft&#178; &middot; 2 Stories</div>
                  <div class="flex items-center gap-1"><i class="modus-icons text-xs" aria-hidden="true">map</i> 4.2 mi&#178; Lot</div>
                </div>
                <div class="flex items-center gap-3 flex-wrap">
                  <modus-button variant="outlined" size="sm" color="secondary">View Safety Risks</modus-button>
                  <div class="bg-warning-20 text-warning text-xs font-medium px-3 py-1 rounded-full">Wetland detected - NE corner</div>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-muted">
              @for (field of meta.fields; track field.label) {
                <div class="bg-card px-5 py-4 flex flex-col gap-1">
                  <div class="text-xs text-foreground-60 uppercase tracking-wide font-semibold">{{ field.label }}</div>
                  <div class="text-base text-foreground" [class.font-bold]="field.highlight" [class.text-primary]="field.highlight">{{ field.value }}</div>
                </div>
              }
            </div>
          </div>
        }

        @if (assemblyHub(); as hub) {
          <app-estimate-assembly-hub [hub]="hub" />
        }

      </div>
    } @else if (activeSubPage() === 'overview') {
    <div [class]="isCanvasMode() ? 'py-4 md:py-6' : 'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'">
      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : isMobile() ? 'relative mb-6' : 'relative mb-6 widget-grid-desktop'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : (!isMobile() ? desktopGridMinHeight() : null)"
        #financialsWidgetGrid
      >
        <!-- finTitle widget (locked, full width) -->
        <div
          [class]="isCanvasMode() ? 'absolute overflow-hidden'
                 : isMobile() ? 'absolute left-0 right-0 overflow-hidden'
                 : 'overflow-hidden'"
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
              <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials Dashboard</div>
              <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
            </div>
            <div class="flex-shrink-0">
              <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
            </div>
          </div>
        </div>

        <!-- finNavKpi widget (locked, 8 cols) -->
        <div
          [class]="isCanvasMode() ? 'absolute overflow-hidden'
                 : isMobile() ? 'absolute left-0 right-0 overflow-hidden'
                 : 'overflow-hidden'"
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
            <div class="bg-card border-default rounded-lg flex-shrink-0 overflow-hidden flex flex-col min-w-48">
              <div class="flex items-center gap-2 px-4 py-3 border-bottom-default flex-shrink-0">
                <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">payment_instant</i>
                <div class="text-sm font-semibold text-primary">Financials</div>
                @if (navLinkTotalAlerts() > 0) {
                  <div class="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-2xs font-bold px-1"
                    [class.bg-destructive]="navLinkHasCriticalAlerts()"
                    [class.text-destructive-foreground]="navLinkHasCriticalAlerts()"
                    [class.bg-warning]="!navLinkHasCriticalAlerts()"
                    [class.text-warning-foreground]="!navLinkHasCriticalAlerts()">
                    {{ navLinkTotalAlerts() }}
                  </div>
                }
              </div>
              <div class="py-1 flex-1 overflow-y-auto">
                @for (item of finNavLinkItems(); track item.value) {
                  <div
                    class="flex items-center justify-between py-2.5 text-sm cursor-pointer transition-colors duration-150 whitespace-nowrap"
                    [class.bg-primary]="activeSubPage() === item.value"
                    [class.text-primary-foreground]="activeSubPage() === item.value"
                    [class.font-medium]="activeSubPage() === item.value"
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
                      <div class="truncate">{{ item.label }}</div>
                    </div>
                    @if (finSubnavAlerts()[item.value]; as alert) {
                      <div class="flex-shrink-0 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-2xs font-bold px-1 mr-1"
                        [class.bg-destructive]="alert.level === 'critical'"
                        [class.text-destructive-foreground]="alert.level === 'critical'"
                        [class.bg-warning]="alert.level === 'warning'"
                        [class.text-warning-foreground]="alert.level === 'warning'"
                        [class.bg-primary]="alert.level === 'info' && activeSubPage() !== item.value"
                        [class.text-primary-foreground]="alert.level === 'info' && activeSubPage() !== item.value"
                        [class.bg-primary-foreground]="alert.level === 'info' && activeSubPage() === item.value"
                        [class.text-primary]="alert.level === 'info' && activeSubPage() === item.value"
                        [attr.title]="alert.count + ' ' + alert.label">
                        {{ alert.count }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            @if (isPamela()) {
            <div class="flex-1 min-w-0 flex flex-col gap-3">
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Pipeline Value</div>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="pipelineColor() === 'success'"
                    [class.bg-warning-20]="pipelineColor() === 'warning'"
                    [class.bg-destructive-20]="pipelineColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="pipelineColor() === 'success'"
                      [class.text-warning]="pipelineColor() === 'warning'"
                      [class.text-destructive]="pipelineColor() === 'destructive'">bar_graph</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="pipelineColor() === 'success'"
                    [class.text-warning]="pipelineColor() === 'warning'"
                    [class.text-destructive]="pipelineColor() === 'destructive'">{{ fmtCurrency(pamelaEstPipeline()) }}</div>
                </div>
                <div class="text-xs text-foreground-60">{{ pamelaOpenCount() }} open estimates across {{ pamelaProjectCount() }} projects</div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Win Rate</div>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="winRateColor() === 'success'"
                    [class.bg-warning-20]="winRateColor() === 'warning'"
                    [class.bg-destructive-20]="winRateColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="winRateColor() === 'success'"
                      [class.text-warning]="winRateColor() === 'warning'"
                      [class.text-destructive]="winRateColor() === 'destructive'">check_circle</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="winRateColor() === 'success'"
                    [class.text-warning]="winRateColor() === 'warning'"
                    [class.text-destructive]="winRateColor() === 'destructive'">{{ pamelaWinRate() }}%</div>
                </div>
                <div class="text-xs text-foreground-60">{{ estimatesApprovedCount() }} approved of {{ estimates().length }} total</div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Overdue Estimates</div>
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class.bg-success-20]="overdueColor() === 'success'"
                    [class.bg-warning-20]="overdueColor() === 'warning'"
                    [class.bg-destructive-20]="overdueColor() === 'destructive'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class.text-success]="overdueColor() === 'success'"
                      [class.text-warning]="overdueColor() === 'warning'"
                      [class.text-destructive]="overdueColor() === 'destructive'">{{ estimatesOverdueCount() > 0 ? 'warning' : 'check_circle' }}</i>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="overdueColor() === 'success'"
                    [class.text-warning]="overdueColor() === 'warning'"
                    [class.text-destructive]="overdueColor() === 'destructive'">{{ estimatesOverdueCount() }}</div>
                </div>
                <div class="text-xs text-foreground-60">{{ estimatesUnderReviewCount() }} under review, {{ pamelaAwaitingCount() }} awaiting approval</div>
              </div>
              @if (finKpiInsight()) {
                <div class="flex items-center gap-1.5 px-5 py-2 bg-card border-default rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
                </div>
              }
            </div>
            } @else if (!isKelly()) {
            <div class="flex-1 min-w-0 flex flex-col gap-3">
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Gross Margin</div>
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
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="grossMarginColor() === 'success'"
                    [class.text-warning]="grossMarginColor() === 'warning'"
                    [class.text-destructive]="grossMarginColor() === 'destructive'">{{ grossMarginPct() }}%</div>
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
                <div class="text-xs text-foreground-60">{{ fmtCurrency(grossProfit()) }} gross profit across {{ totalProjects() }} projects</div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Cash Runway</div>
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
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="cashRunwayColor() === 'success'"
                    [class.text-warning]="cashRunwayColor() === 'warning'"
                    [class.text-destructive]="cashRunwayColor() === 'destructive'">{{ cashRunwayMonths() }} mo</div>
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
                <div class="text-xs text-foreground-60">{{ fmtCurrency(cashBalance()) }} balance / {{ fmtCurrency(monthlyBurn()) }} monthly burn</div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex-1 flex flex-col justify-center gap-2">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium text-foreground-60">Accounts Receivable</div>
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
                  <div class="text-3xl font-bold flex-shrink-0"
                    [class.text-success]="arColor() === 'success'"
                    [class.text-warning]="arColor() === 'warning'"
                    [class.text-destructive]="arColor() === 'destructive'">{{ fmtCurrency(totalOutstandingAR()) }}</div>
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
                <div class="text-xs text-foreground-60">DSO {{ dso() }} days @if (overdueInvoiceCount() > 0) { -- {{ overdueInvoiceCount() }} overdue }</div>
              </div>
              @if (finKpiInsight()) {
                <div class="flex items-center gap-1.5 px-5 py-2 bg-card border-default rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
                </div>
              }
            </div>
            } @else {
            <div class="flex-1 min-w-0 flex flex-col gap-2 px-3 pb-3 overflow-y-auto">
              <app-home-ap-kpi-cards [cards]="kellyApKpiCards()" />
              @if (kellyApKpisInsight()) {
                <div class="flex items-center gap-1.5 px-3 py-2 bg-muted rounded-lg flex-shrink-0">
                  <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                  <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyApKpisInsight() }}</div>
                </div>
              }
            </div>
            }
          </div>
        </div>

        @for (widgetId of financialsWidgets(); track widgetId) {
          <div
            [class]="isCanvasMode() ? 'absolute overflow-hidden'
                   : isMobile() ? 'absolute left-0 right-0 overflow-hidden'
                   : moveTargetId() === widgetId ? 'absolute overflow-hidden'
                   : 'overflow-hidden'"
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Revenue Over Time</div>
                    </div>
                    <div class="flex items-center gap-2" (mousedown)="$event.stopPropagation()">
                      @for (range of timeRanges; track range) {
                        <div
                          class="px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
                          [class.bg-primary]="selectedRange() === range"
                          [class.text-primary-foreground]="selectedRange() === range"
                          [class.text-foreground-60]="selectedRange() !== range"
                          [class.hover:bg-muted]="selectedRange() !== range"
                          (click)="selectRange(range); $event.stopPropagation()"
                          role="button" tabindex="0"
                          [attr.aria-label]="range + ' time range'"
                          [attr.aria-pressed]="selectedRange() === range"
                        >{{ range }}</div>
                      }
                    </div>
                  </div>
                  @if (revenueInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ revenueInsight() }}</div>
                    </div>
                  }

                  <div class="flex-1 flex flex-col px-5 py-4 gap-3 min-h-0">
                    <div class="flex items-baseline gap-3">
                      <div class="text-3xl font-bold text-foreground">{{ formatCurrency(revenueSummary().current) }}</div>
                      <div class="flex items-center gap-1 text-sm font-medium text-success">
                        <i class="modus-icons text-sm" aria-hidden="true">arrow_up</i>
                        +{{ revenueSummary().growthPct }}%
                      </div>
                      <div class="text-xs text-foreground-40">{{ revenueSummary().label }}</div>
                    </div>

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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Open Estimates</div>
                      <div class="text-xs text-foreground-40">{{ estimates().length }} estimates</div>
                    </div>
                  </div>
                  @if (estimatesInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ estimatesInsight() }}</div>
                    </div>
                  }
                  <div
                    role="row"
                    class="grid gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0"
                    [class]="estimatesUltraNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXXNarrow() ? 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesXNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : estimatesNarrow() ? 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)]'"
                  >
                    @if (!estimatesXXNarrow()) {
                      <div role="columnheader">ID</div>
                    }
                    <div role="columnheader">Project / Client</div>
                    @if (!estimatesXNarrow()) {
                      <div role="columnheader">Type</div>
                    }
                    @if (!estimatesUltraNarrow()) {
                      <div role="columnheader">Value</div>
                    }
                    <div role="columnheader">Status</div>
                    @if (!estimatesNarrow()) {
                      <div role="columnheader">Requested By</div>
                    }
                    <div role="columnheader">Due Date</div>
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
                          <div role="cell" class="text-sm font-mono text-primary font-medium">{{ estimate.id }}</div>
                        }
                        <div role="cell">
                          <div class="text-sm font-medium text-foreground truncate">{{ estimate.project }}</div>
                          <div class="text-xs text-foreground-60 mt-0.5 truncate">{{ estimate.client }}</div>
                        </div>
                        @if (!estimatesXNarrow()) {
                          <div role="cell">
                            <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ estimate.type }}</div>
                          </div>
                        }
                        @if (!estimatesUltraNarrow()) {
                          <div role="cell" class="text-sm font-semibold text-foreground">{{ estimate.value }}</div>
                        }
                        <div role="cell">
                          <modus-badge [color]="estimateBadgeColor(estimate.status)" variant="outlined" size="sm">
                            {{ estimate.status }}
                          </modus-badge>
                        </div>
                        @if (!estimatesNarrow()) {
                          <div role="cell" class="flex items-center gap-2 min-w-0">
                            <div class="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-semibold flex-shrink-0">
                              {{ estimate.requestedByInitials }}
                            </div>
                            <div class="text-xs text-foreground-80 truncate">{{ estimate.requestedBy }}</div>
                          </div>
                        }
                        <div role="cell">
                          <div class="text-sm text-foreground-80">{{ estimate.dueDate }}</div>
                          <div class="text-xs mt-0.5" [class]="dueDateClass(estimate.daysLeft)">
                            @if (estimate.daysLeft < 0) {
                              {{ -estimate.daysLeft }}d overdue
                            } @else if (estimate.daysLeft === 0) {
                              Due today
                            } @else {
                              {{ estimate.daysLeft }}d left
                            }
                          </div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Budget by Project</div>
                    </div>
                  </div>
                  @if (budgetByProjectInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ budgetByProjectInsight() }}</div>
                    </div>
                  }

                  <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                    <div role="columnheader">Project</div>
                    <div role="columnheader">Client</div>
                    <div class="text-right" role="columnheader">Budget</div>
                    <div role="columnheader">Progress</div>
                    <div class="text-right" role="columnheader">Used</div>
                  </div>

                  <!-- Table body -->
                  <div class="overflow-y-auto flex-1" role="table" aria-label="Budget by project">
                    @for (p of projects(); track p.id) {
                      <div class="grid grid-cols-[2fr_1fr_1fr_2fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150" role="row">
                        <div class="text-sm font-medium text-foreground truncate" role="cell">{{ p.name }}</div>
                        <div class="text-sm text-foreground-60 truncate" role="cell">{{ p.client }}</div>
                        <div class="text-sm text-foreground-60 text-right" role="cell">{{ p.budgetUsed }} / {{ p.budgetTotal }}</div>
                        <div class="w-full" role="cell">
                          <modus-progress [value]="p.budgetPct" [max]="100" [className]="budgetProgressClass(p.budgetPct)" />
                        </div>
                        <div class="text-xs font-medium text-right
                          {{ p.budgetPct >= 90 ? 'text-destructive' : p.budgetPct >= 75 ? 'text-warning' : 'text-success' }}" role="cell">
                          {{ p.budgetPct }}%
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Job Costs</div>
                    </div>
                    <div class="text-sm text-foreground-60">{{ formatJobCost(jobCostSummary().grandTotal) }} total</div>
                  </div>
                  @if (jobCostsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ jobCostsInsight() }}</div>
                    </div>
                  }

                  <div class="overflow-y-auto flex-1">
                    <div class="px-5 py-4 flex flex-col gap-4">
                      <div class="flex w-full h-4 rounded-full overflow-hidden">
                        @for (cat of jobCostSummary().categories; track cat.label) {
                          <div class="{{ cat.colorClass }}" [style.width.%]="cat.pct"></div>
                        }
                      </div>

                      <div class="grid grid-cols-5 gap-3">
                        @for (cat of jobCostSummary().categories; track cat.label) {
                          <div class="flex flex-col gap-1 p-3 bg-background border-default rounded-lg">
                            <div class="flex items-center gap-1.5">
                              <div class="w-2 h-2 rounded-full {{ cat.colorClass }} flex-shrink-0"></div>
                              <div class="text-2xs text-foreground-40 uppercase tracking-wide">{{ cat.label }}</div>
                            </div>
                            <div class="text-sm font-semibold text-foreground">{{ formatJobCost(cat.total) }}</div>
                            <div class="text-2xs text-foreground-60">{{ cat.pct }}%</div>
                          </div>
                        }
                      </div>
                    </div>

                    <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 bg-muted border-bottom-default border-top-default text-xs font-semibold text-foreground-60 uppercase tracking-wide flex-shrink-0" role="row">
                      <div role="columnheader">Project</div>
                      <div class="text-right" role="columnheader">Budget</div>
                      @for (cat of jobCostCategories; track cat) {
                        <div class="text-right" role="columnheader">{{ cat }}</div>
                      }
                    </div>

                    <div role="table" aria-label="Job costs by project">
                      @for (p of projectJobCosts(); track p.projectId) {
                        <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-5 py-3 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" role="row" (click)="openJobCostDetail(p)">
                          <div class="text-sm font-medium text-foreground truncate" role="cell">{{ p.projectName }}</div>
                          <div class="text-sm text-foreground-60 text-right" role="cell">{{ p.budgetUsed }}</div>
                          @for (cat of jobCostCategories; track cat) {
                            <div class="text-sm text-foreground-60 text-right" role="cell">{{ formatJobCost(getCost(p.costs, cat)) }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Change Orders</div>
                      <modus-badge color="secondary" size="sm">{{ filteredChangeOrders().length }}</modus-badge>
                    </div>
                  </div>
                  @if (changeOrdersInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ changeOrdersInsight() }}</div>
                    </div>
                  }

                  <div class="flex items-center gap-1 px-5 py-3 border-bottom-default flex-shrink-0">
                    @for (tab of coTabs; track tab.value) {
                      <div
                        class="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150"
                        [class]="activeCoTab() === tab.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:bg-muted'"
                        (click)="activeCoTab.set(tab.value)"
                      >{{ tab.label }} ({{ coTabCount(tab.value) }})</div>
                    }
                  </div>

                  <div class="overflow-y-auto flex-1">
                    <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
                      <div role="columnheader">ID</div>
                      <div role="columnheader">Project</div>
                      <div role="columnheader">Description</div>
                      <div class="text-right" role="columnheader">Amount</div>
                      <div role="columnheader">Status</div>
                      <div role="columnheader">Date</div>
                    </div>
                    @for (co of filteredChangeOrders(); track co.id) {
                      <div
                        class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                        role="row"
                        (click)="navigateToChangeOrder(co.id)"
                      >
                        <div class="text-sm font-medium text-primary" role="cell">{{ co.id }}</div>
                        <div class="text-sm text-foreground truncate" role="cell">{{ co.project }}</div>
                        <div class="text-sm text-foreground truncate" role="cell">{{ co.description }}</div>
                        <div class="text-sm font-medium text-foreground text-right" role="cell">{{ formatCurrency(co.amount) }}</div>
                        <div role="cell"><modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge></div>
                        <div class="text-sm text-foreground-60" role="cell">{{ co.requestDate }}</div>
                      </div>
                    } @empty {
                      <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
                        <div class="text-sm">No change orders in this category</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Invoice Queue</div>
                    </div>
                  </div>
                  @if (kellyInvoiceQueueInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyInvoiceQueueInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Payment Schedule</div>
                    </div>
                  </div>
                  @if (kellyPaymentScheduleInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyPaymentScheduleInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Vendor Aging</div>
                    </div>
                  </div>
                  @if (kellyVendorAgingInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyVendorAgingInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Pay Applications</div>
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
                  @if (kellyPayAppsInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyPayAppsInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Lien Waivers</div>
                    </div>
                  </div>
                  @if (kellyLienWaiversInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyLienWaiversInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Retention Summary</div>
                    </div>
                  </div>
                  @if (kellyRetentionInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyRetentionInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">AP Activity</div>
                    </div>
                  </div>
                  @if (kellyApActivityInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyApActivityInsight() }}</div>
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
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Cash Outflow</div>
                    </div>
                  </div>
                  @if (kellyCashOutflowInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ kellyCashOutflowInsight() }}</div>
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
    <div class="flex flex-col h-full">
      <div class="px-4 pt-4 md:pt-6 flex-shrink-0">
        <div class="text-2xl font-bold text-foreground mb-1">{{ activeSubPageTitle() }}</div>
        <div class="text-sm text-foreground-60 mb-4">{{ activeSubPageDescription() }}</div>
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

        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total Estimates</div>
            <div class="text-2xl font-bold text-foreground">{{ estimates().length }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total Value</div>
            <div class="text-2xl font-bold text-primary">{{ formatCurrency(estimatesTotalValue()) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Approved</div>
            <div class="text-2xl font-bold text-success">{{ estimatesApprovedCount() }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Under Review</div>
            <div class="text-2xl font-bold text-warning">{{ estimatesUnderReviewCount() }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Overdue</div>
            <div class="text-2xl font-bold text-destructive">{{ estimatesOverdueCount() }}</div>
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (est of estimates(); track est.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToEstimate(est.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-mono text-primary font-medium">{{ est.id }}</div>
                  <modus-badge [color]="estimateBadgeColor(est.status)" variant="outlined" size="sm">{{ est.status }}</modus-badge>
                </div>
                <div class="text-sm font-medium text-foreground mb-1">{{ est.project }}</div>
                <div class="text-xs text-foreground-40 mb-3">{{ est.client }}</div>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1">{{ est.type }}</div>
                  <div class="text-sm font-semibold text-foreground">{{ est.value }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xs font-semibold flex-shrink-0">{{ est.requestedByInitials }}</div>
                    <div class="text-xs text-foreground-80 truncate">{{ est.requestedBy }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs text-foreground-80">{{ est.dueDate }}</div>
                    <div class="text-xs" [class]="dueDateClass(est.daysLeft)">
                      @if (est.daysLeft < 0) { {{ -est.daysLeft }}d overdue }
                      @else if (est.daysLeft === 0) { Due today }
                      @else { {{ est.daysLeft }}d left }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="grid grid-cols-[80px_1fr_100px_120px_120px_130px_100px] gap-2 px-4 py-3 bg-muted text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>ID</div>
            <div>Project / Client</div>
            <div>Type</div>
            <div class="text-right">Value</div>
            <div>Status</div>
            <div>Requested By</div>
            <div>Due Date</div>
          </div>
          @for (est of estimates(); track est.id) {
            <div class="grid grid-cols-[80px_1fr_100px_120px_120px_130px_100px] gap-2 px-4 py-3 border-top-default hover:bg-muted items-center cursor-pointer" (click)="navigateToEstimate(est.id)">
              <div class="text-sm font-mono text-primary font-medium">{{ est.id }}</div>
              <div>
                <div class="text-sm font-medium text-foreground truncate">{{ est.project }}</div>
                <div class="text-xs text-foreground-40">{{ est.client }}</div>
              </div>
              <div class="text-xs bg-muted text-foreground-80 rounded px-2 py-1 inline-block">{{ est.type }}</div>
              <div class="text-sm font-semibold text-foreground text-right">{{ est.value }}</div>
              <div><modus-badge [color]="estimateBadgeColor(est.status)" variant="outlined" size="sm">{{ est.status }}</modus-badge></div>
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xs font-semibold flex-shrink-0">
                  {{ est.requestedByInitials }}
                </div>
                <div class="text-xs text-foreground-80 truncate">{{ est.requestedBy }}</div>
              </div>
              <div>
                <div class="text-sm text-foreground-80">{{ est.dueDate }}</div>
                <div class="text-xs mt-0.5" [class]="dueDateClass(est.daysLeft)">
                  @if (est.daysLeft < 0) {
                    {{ -est.daysLeft }}d overdue
                  } @else if (est.daysLeft === 0) {
                    Due today
                  } @else {
                    {{ est.daysLeft }}d left
                  }
                </div>
              </div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total COs</div>
            <div class="text-2xl font-bold text-foreground">{{ coSubpageAll().length }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total Value</div>
            <div class="text-2xl font-bold text-primary">{{ formatCurrency(coSubpageTotalValue()) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Approved</div>
            <div class="text-2xl font-bold text-success">{{ coSubpageApproved() }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Pending</div>
            <div class="text-2xl font-bold text-warning">{{ coSubpagePending() }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Rejected</div>
            <div class="text-2xl font-bold text-destructive">{{ coSubpageRejected() }}</div>
          </div>
        </div>

        <div class="flex items-center gap-1 mb-4">
          @for (tab of coTabs; track tab.value) {
            <div
              class="px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors duration-150"
              [class]="activeCoTab() === tab.value ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:bg-muted'"
              (click)="activeCoTab.set(tab.value)"
            >{{ tab.label }} ({{ coTabCount(tab.value) }})</div>
          }
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (co of filteredChangeOrders(); track co.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToChangeOrder(co.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-primary">{{ co.id }}</div>
                  <modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge>
                </div>
                <div class="text-sm font-medium text-foreground mb-1">{{ co.description }}</div>
                <div class="text-xs text-foreground-60 mb-3">{{ co.project }}</div>
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(co.amount) }}</div>
                  <div class="text-xs text-foreground-60">{{ co.requestDate }}</div>
                </div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
                <div class="text-sm">No change orders in this category</div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="grid grid-cols-[80px_1fr_2fr_120px_90px_100px] gap-2 px-4 py-3 bg-muted text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>ID</div>
            <div>Project</div>
            <div>Description</div>
            <div class="text-right">Amount</div>
            <div>Status</div>
            <div>Date</div>
          </div>
          @for (co of filteredChangeOrders(); track co.id) {
            <div class="grid grid-cols-[80px_1fr_2fr_120px_90px_100px] gap-2 px-4 py-3 border-top-default hover:bg-muted items-center cursor-pointer" (click)="navigateToChangeOrder(co.id)">
              <div class="text-sm font-medium text-primary">{{ co.id }}</div>
              <div class="text-sm text-foreground truncate">{{ co.project }}</div>
              <div class="text-sm text-foreground truncate">{{ co.description }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(co.amount) }}</div>
              <div><modus-badge [color]="coBadgeColor(co.status)" size="sm">{{ capitalizeFirst(co.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60">{{ co.requestDate }}</div>
            </div>
          } @empty {
            <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
              <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap</i>
              <div class="text-sm">No change orders in this category</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Grand Total</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(jobCostSummary().grandTotal) }}</div>
          </div>
          @for (cat of jobCostSummary().categories; track cat.label) {
            <div class="bg-card rounded-lg border-default p-4 text-center">
              <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">{{ cat.label }}</div>
              <div class="text-2xl font-bold text-foreground">{{ formatJobCost(cat.total) }}</div>
              <div class="text-xs text-foreground-40">{{ cat.pct }}%</div>
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
                <div class="text-xs text-foreground-60">{{ cat.label }}</div>
              </div>
            }
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (p of projectJobCosts(); track p.projectId) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="openJobCostDetail(p)">
                <div class="text-sm font-medium text-foreground mb-2">{{ p.projectName }}</div>
                <div class="flex items-center justify-between mb-3">
                  <div class="text-xs text-foreground-60">Budget Used</div>
                  <div class="text-sm font-semibold text-foreground">{{ p.budgetUsed }}</div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  @for (cat of jobCostCategories; track cat) {
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-foreground-60">{{ cat }}</div>
                      <div class="text-xs text-foreground-80">{{ formatJobCost(getCost(p.costs, cat)) }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 bg-muted text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Project</div>
            <div class="text-right">Budget</div>
            @for (cat of jobCostCategories; track cat) {
              <div class="text-right">{{ cat }}</div>
            }
          </div>
          @for (p of projectJobCosts(); track p.projectId) {
            <div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-top-default hover:bg-muted items-center cursor-pointer" (click)="openJobCostDetail(p)">
              <div class="text-sm font-medium text-foreground truncate">{{ p.projectName }}</div>
              <div class="text-sm text-foreground-60 text-right">{{ p.budgetUsed }}</div>
              @for (cat of jobCostCategories; track cat) {
                <div class="text-sm text-foreground-60 text-right">{{ formatJobCost(getCost(p.costs, cat)) }}</div>
              }
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Active Schedules</div>
            <div class="text-2xl font-bold text-foreground">{{ billingSchedules().length }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Billed (6 mo)</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(billedTotal()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Upcoming (30d)</div>
            <div class="text-2xl font-bold text-primary">{{ upcomingBillings().length }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Collected</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(collectedTotal()) }}</div>
          </div>
        </div>

        <!-- Billing events table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">invoice</i>
            <div class="text-base font-semibold text-foreground">Billing Events</div>
            <modus-badge color="secondary" size="sm">{{ billingEvents().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (ev of billingEvents(); track ev.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToBillingEvent(ev.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-foreground">{{ ev.description }}</div>
                  <modus-badge [color]="ev.status === 'completed' ? 'success' : ev.status === 'skipped' ? 'warning' : 'secondary'" size="sm">{{ capitalizeFirst(ev.status) }}</modus-badge>
                </div>
                <div class="text-xs text-foreground-60 mb-2">{{ ev.period }}</div>
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(ev.amount) }}</div>
                  <div class="text-xs text-foreground-60">{{ ev.billingDate }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">invoice</i>
              <div class="text-base font-semibold text-foreground">Billing Events</div>
              <modus-badge color="secondary" size="sm">{{ billingEvents().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Description</div><div>Period</div><div class="text-right">Amount</div><div>Status</div><div>Date</div>
          </div>
          @for (ev of billingEvents(); track ev.id) {
            <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToBillingEvent(ev.id)">
              <div class="text-sm text-foreground truncate">{{ ev.description }}</div>
              <div class="text-sm text-foreground-60">{{ ev.period }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(ev.amount) }}</div>
              <div><modus-badge [color]="ev.status === 'completed' ? 'success' : ev.status === 'skipped' ? 'warning' : 'secondary'" size="sm">{{ capitalizeFirst(ev.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60">{{ ev.billingDate }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Total Outstanding</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(arOutstanding()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">DSO</div>
            <div class="text-2xl font-bold text-foreground">{{ dso() }} days</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Overdue</div>
            <div class="text-2xl font-bold text-destructive">{{ formatCurrency(arOverdue()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Open Invoices</div>
            <div class="text-2xl font-bold text-primary">{{ openInvoiceCount() }}</div>
          </div>
        </div>

        <!-- Aging buckets -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 flex-shrink-0">
          @for (bucket of agingBuckets(); track bucket.label) {
            <div class="bg-card rounded-lg p-4 border-default">
              <div class="text-xs text-foreground-60 mb-1">{{ bucket.label }}</div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(bucket.total) }}</div>
              <div class="text-xs text-foreground-40">{{ bucket.count }} invoices</div>
            </div>
          }
        </div>

        <!-- Invoice table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
            <div class="text-base font-semibold text-foreground">Invoices</div>
            <modus-badge color="secondary" size="sm">{{ invoices().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (inv of invoices(); track inv.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToInvoice(inv.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-primary">{{ inv.invoiceNumber }}</div>
                  <modus-badge [color]="invoiceStatusBadge(inv.status)" size="sm">{{ capitalizeFirst(inv.status) }}</modus-badge>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs text-foreground-60">Amount</div>
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(inv.amount) }}</div>
                </div>
                <div class="flex items-center justify-between mb-2">
                  <div class="text-xs text-foreground-60">Paid</div>
                  <div class="text-sm text-success">{{ formatCurrency(inv.amountPaid) }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-foreground-60">{{ inv.terms }}</div>
                  <div class="text-xs text-foreground-60">Due {{ inv.dueDate }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">document</i>
              <div class="text-base font-semibold text-foreground">Invoices</div>
              <modus-badge color="secondary" size="sm">{{ invoices().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Invoice #</div><div class="text-right">Amount</div><div class="text-right">Paid</div><div>Status</div><div>Terms</div><div>Due</div>
          </div>
          @for (inv of invoices(); track inv.id) {
            <div class="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToInvoice(inv.id)">
              <div class="text-sm font-medium text-primary">{{ inv.invoiceNumber }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(inv.amount) }}</div>
              <div class="text-sm text-success text-right">{{ formatCurrency(inv.amountPaid) }}</div>
              <div><modus-badge [color]="invoiceStatusBadge(inv.status)" size="sm">{{ capitalizeFirst(inv.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60">{{ inv.terms }}</div>
              <div class="text-sm text-foreground-60">{{ inv.dueDate }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Pending</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(payablesSummary()['pending'].total) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Approved</div>
            <div class="text-2xl font-bold text-warning">{{ formatCurrency(payablesSummary()['approved'].total) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Overdue</div>
            <div class="text-2xl font-bold text-destructive">{{ formatCurrency(payablesSummary()['overdue'].total) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Paid</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(payablesSummary()['paid'].total) }}</div>
          </div>
        </div>

        <!-- AP detail KPI strip -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Invoice Queue</div>
            <div class="text-2xl font-bold text-foreground">{{ pendingApInvoices().length }}</div>
            <div class="text-xs text-foreground-40 mt-1">{{ onHoldApInvoices().length }} on hold</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Retention Held</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(apTotalRetentionHeld()) }}</div>
            <div class="text-xs text-foreground-40 mt-1">{{ formatCurrency(apTotalRetentionPending()) }} pending release</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Lien Waivers</div>
            <div class="text-2xl font-bold" [class]="apMissingWaivers() > 0 ? 'text-destructive' : 'text-foreground'">{{ apMissingWaivers() }} missing</div>
            <div class="text-xs text-foreground-40 mt-1">{{ apLienWaivers().length }} total tracked</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Discounts Available</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(apDiscountsAvailable()) }}</div>
            <div class="text-xs text-foreground-40 mt-1">{{ apPaymentSchedule().length }} scheduled payments</div>
          </div>
        </div>

        <!-- Payables table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">credit_card</i>
            <div class="text-base font-semibold text-foreground">Payables</div>
            <modus-badge color="secondary" size="sm">{{ payables().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (p of payables(); track p.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayable(p.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-foreground">{{ p.vendor }}</div>
                  <modus-badge [color]="payableStatusBadge(p.status)" size="sm">{{ capitalizeFirst(p.status) }}</modus-badge>
                </div>
                <div class="text-xs text-foreground-60 mb-2">{{ p.description }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(p.amount) }}</div>
                  <div class="text-xs text-foreground-60">Due {{ p.dueDate }}</div>
                </div>
                <div class="text-xs text-foreground-40">{{ p.costCode }}</div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">credit_card</i>
              <div class="text-base font-semibold text-foreground">Payables</div>
              <modus-badge color="secondary" size="sm">{{ payables().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Vendor</div><div>Description</div><div class="text-right">Amount</div><div>Status</div><div>Due</div><div>Cost Code</div>
          </div>
          @for (p of payables(); track p.id) {
            <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayable(p.id)">
              <div class="text-sm text-foreground truncate">{{ p.vendor }}</div>
              <div class="text-sm text-foreground truncate">{{ p.description }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(p.amount) }}</div>
              <div><modus-badge [color]="payableStatusBadge(p.status)" size="sm">{{ capitalizeFirst(p.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60">{{ p.dueDate }}</div>
              <div class="text-sm text-foreground-60">{{ p.costCode }}</div>
            </div>
          }
        </div>
        }

        <!-- Invoice Queue -->
        <div class="bg-card rounded-lg border-default overflow-hidden mt-6 flex-shrink-0">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <div class="text-base font-semibold text-foreground">Invoice Queue</div>
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
              <div class="text-base font-semibold text-foreground">Vendor Aging</div>
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
                <div class="text-base font-semibold text-foreground">Pay Applications</div>
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
              <div class="text-base font-semibold text-foreground">Lien Waivers</div>
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
              <div class="text-base font-semibold text-foreground">Retention</div>
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
              <div class="text-base font-semibold text-foreground">Payment Schedule</div>
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
              <div class="text-base font-semibold text-foreground">AP Activity</div>
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
            <div class="text-xs text-foreground-60 mb-1">Cash on Hand</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(cashPosition().currentBalance) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">30-Day Forecast</div>
            <div class="text-2xl font-bold text-primary">{{ formatCurrency(cashPosition().thirtyDayForecast) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Runway</div>
            <div class="text-2xl font-bold" [class]="cashRunway() > 6 ? 'text-success' : cashRunway() > 3 ? 'text-warning' : 'text-destructive'">{{ cashRunway() }} mo</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Net Cash Flow (6 mo)</div>
            <div class="text-2xl font-bold" [class]="netCashFlow() >= 0 ? 'text-success' : 'text-destructive'">{{ formatCurrency(netCashFlow()) }}</div>
          </div>
        </div>

        <!-- Cash flow table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
            <div class="text-base font-semibold text-foreground">Cash Flow History</div>
          </div>
          <div class="flex flex-col gap-3">
            @for (cf of cashFlowHistory(); track cf.month) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToCashFlow(cf.month)">
                <div class="text-sm font-medium text-foreground mb-3">{{ cf.month }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Inflow</div>
                  <div class="text-sm text-success">{{ formatCurrency(cf.inflows) }}</div>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Outflow</div>
                  <div class="text-sm text-destructive">{{ formatCurrency(cf.outflows) }}</div>
                </div>
                <div class="flex items-center justify-between border-top-default pt-2 mt-1">
                  <div class="text-xs font-medium text-foreground-60">Net</div>
                  <div class="text-sm font-semibold" [class]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">{{ formatCurrency(cf.netCash) }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
              <div class="text-base font-semibold text-foreground">Cash Flow History</div>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Month</div><div class="text-right">Inflow</div><div class="text-right">Outflow</div><div class="text-right">Net</div>
          </div>
          @for (cf of cashFlowHistory(); track cf.month) {
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToCashFlow(cf.month)">
              <div class="text-sm font-medium text-foreground">{{ cf.month }}</div>
              <div class="text-sm text-success text-right">{{ formatCurrency(cf.inflows) }}</div>
              <div class="text-sm text-destructive text-right">{{ formatCurrency(cf.outflows) }}</div>
              <div class="text-sm font-medium text-right" [class]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">{{ formatCurrency(cf.netCash) }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Total Assets</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(glTotalAssets()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Total Liabilities</div>
            <div class="text-2xl font-bold text-warning">{{ formatCurrency(glTotalLiabilities()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Revenue</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(glTotalRevenue()) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Expenses</div>
            <div class="text-2xl font-bold text-destructive">{{ formatCurrency(glTotalExpenses()) }}</div>
          </div>
        </div>

        <!-- GL accounts -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Chart of Accounts</div>
            <modus-badge color="secondary" size="sm">{{ glAccounts().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3 mb-6">
            @for (acct of glAccounts(); track acct.code) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToGlAccount(acct.code)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-primary">{{ acct.code }}</div>
                  <div class="text-xs text-foreground-60">{{ capitalizeFirst(acct.type) }}</div>
                </div>
                <div class="text-sm text-foreground mb-2">{{ acct.name }}</div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-foreground-60">Balance</div>
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(acct.balance) }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden mb-6">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <div class="text-base font-semibold text-foreground">Chart of Accounts</div>
              <modus-badge color="secondary" size="sm">{{ glAccounts().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Acct #</div><div>Name</div><div>Type</div><div class="text-right">Balance</div>
          </div>
          @for (acct of glAccounts(); track acct.code) {
            <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToGlAccount(acct.code)">
              <div class="text-sm font-medium text-primary">{{ acct.code }}</div>
              <div class="text-sm text-foreground">{{ acct.name }}</div>
              <div class="text-sm text-foreground-60">{{ capitalizeFirst(acct.type) }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(acct.balance) }}</div>
            </div>
          }
        </div>
        }

        <!-- Recent journal entries -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">file_edit</i>
            <div class="text-base font-semibold text-foreground">Recent Journal Entries</div>
            <modus-badge color="secondary" size="sm">{{ glEntries().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (entry of glEntries(); track entry.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToGlEntry(entry.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-primary">{{ entry.id }}</div>
                  <div class="text-xs text-foreground-60">{{ entry.date }}</div>
                </div>
                <div class="text-xs text-foreground-60 mb-1">Acct {{ entry.accountCode }}</div>
                <div class="text-sm text-foreground mb-3">{{ entry.description }}</div>
                <div class="flex items-center gap-4">
                  @if (entry.debit > 0) {
                    <div class="flex items-center gap-1">
                      <div class="text-xs text-foreground-60">DR</div>
                      <div class="text-sm font-medium text-foreground">{{ formatCurrency(entry.debit) }}</div>
                    </div>
                  }
                  @if (entry.credit > 0) {
                    <div class="flex items-center gap-1">
                      <div class="text-xs text-foreground-60">CR</div>
                      <div class="text-sm font-medium text-foreground">{{ formatCurrency(entry.credit) }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">file_edit</i>
              <div class="text-base font-semibold text-foreground">Recent Journal Entries</div>
              <modus-badge color="secondary" size="sm">{{ glEntries().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Entry #</div><div>Account</div><div>Description</div><div class="text-right">Debit</div><div class="text-right">Credit</div><div>Date</div>
          </div>
          @for (entry of glEntries(); track entry.id) {
            <div class="grid grid-cols-[minmax(0,0.6fr)_minmax(0,0.5fr)_minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToGlEntry(entry.id)">
              <div class="text-sm font-medium text-primary">{{ entry.id }}</div>
              <div class="text-sm text-foreground-60">{{ entry.accountCode }}</div>
              <div class="text-sm text-foreground truncate">{{ entry.description }}</div>
              <div class="text-sm text-foreground text-right">{{ entry.debit > 0 ? formatCurrency(entry.debit) : '-' }}</div>
              <div class="text-sm text-foreground text-right">{{ entry.credit > 0 ? formatCurrency(entry.credit) : '-' }}</div>
              <div class="text-sm text-foreground-60">{{ entry.date }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Total PO Value</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(poSummary().totalValue) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Received/Closed</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(poSummary().totalReceived) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Open POs</div>
            <div class="text-2xl font-bold text-primary">{{ poSummary().openPOs }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Overdue Deliveries</div>
            <div class="text-2xl font-bold" [class]="poSummary().overdueDeliveries > 0 ? 'text-destructive' : 'text-success'">{{ poSummary().overdueDeliveries }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Draft POs</div>
            <div class="text-2xl font-bold text-foreground-60">{{ poSummary().draftCount }}</div>
          </div>
        </div>

        <!-- PO table -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">shopping_cart</i>
            <div class="text-base font-semibold text-foreground">Purchase Orders</div>
            <modus-badge color="secondary" size="sm">{{ purchaseOrders().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (po of purchaseOrders(); track po.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPurchaseOrder(po.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-primary">{{ po.poNumber }}</div>
                  <modus-badge [color]="poStatusBadge(po.status)" size="sm">{{ capitalizeFirst(po.status) }}</modus-badge>
                </div>
                <div class="text-sm font-medium text-foreground mb-1">{{ po.vendor }}</div>
                <div class="text-xs text-foreground-60 mb-3">{{ po.description }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(po.amount) }}</div>
                  <div class="text-xs text-foreground-60">Delivery {{ po.expectedDelivery }}</div>
                </div>
                <div class="text-xs text-foreground-40">{{ po.project }}</div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">shopping_cart</i>
              <div class="text-base font-semibold text-foreground">Purchase Orders</div>
              <modus-badge color="secondary" size="sm">{{ purchaseOrders().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>PO #</div><div>Vendor</div><div>Description</div><div class="text-right">Amount</div><div>Status</div><div>Delivery</div><div>Project</div>
          </div>
          @for (po of purchaseOrders(); track po.id) {
            <div class="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPurchaseOrder(po.id)">
              <div class="text-sm font-medium text-primary">{{ po.poNumber }}</div>
              <div class="text-sm text-foreground truncate">{{ po.vendor }}</div>
              <div class="text-sm text-foreground truncate">{{ po.description }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(po.amount) }}</div>
              <div><modus-badge [color]="poStatusBadge(po.status)" size="sm">{{ capitalizeFirst(po.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60">{{ po.expectedDelivery }}</div>
              <div class="text-sm text-foreground-60 truncate">{{ po.project }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 mb-1">Gross Pay (YTD)</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(payrollSummary().totalGross) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Net Pay (YTD)</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(payrollSummary().totalNet) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Avg Headcount</div>
            <div class="text-2xl font-bold text-primary">{{ payrollSummary().avgEmployees }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Labor Burden</div>
            <div class="text-2xl font-bold text-foreground">{{ payrollSummary().laborBurdenPct }}%</div>
          </div>
        </div>

        <!-- Additional KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Total Taxes</div>
            <div class="text-xl font-bold text-warning">{{ formatCurrency(payrollSummary().totalTaxes) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Total Benefits</div>
            <div class="text-xl font-bold text-primary">{{ formatCurrency(payrollSummary().totalBenefits) }}</div>
          </div>
          <div class="bg-card rounded-lg p-4 border-default">
            <div class="text-xs text-foreground-60 mb-1">Total Overtime</div>
            <div class="text-xl font-bold" [class]="payrollSummary().totalOT > 1200 ? 'text-warning' : 'text-foreground'">{{ payrollSummary().totalOT.toLocaleString() }} hrs</div>
          </div>
        </div>

        <!-- Monthly rollup -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
            <div class="text-base font-semibold text-foreground">Monthly Summary</div>
          </div>
          <div class="flex flex-col gap-3 mb-6">
            @for (mp of monthlyPayroll(); track mp.month) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayrollMonthly(mp.month)">
                <div class="text-sm font-medium text-foreground mb-3">{{ mp.month }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Gross</div>
                  <div class="text-sm text-foreground">{{ formatCurrency(mp.gross) }}</div>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Net</div>
                  <div class="text-sm text-success">{{ formatCurrency(mp.net) }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-foreground-60">Headcount</div>
                  <div class="text-sm text-foreground-60">{{ mp.headcount }}</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden mb-6">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">gantt_chart</i>
              <div class="text-base font-semibold text-foreground">Monthly Summary</div>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Month</div><div class="text-right">Gross</div><div class="text-right">Net</div><div class="text-right">Headcount</div>
          </div>
          @for (mp of monthlyPayroll(); track mp.month) {
            <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayrollMonthly(mp.month)">
              <div class="text-sm font-medium text-foreground">{{ mp.month }}</div>
              <div class="text-sm text-foreground text-right">{{ formatCurrency(mp.gross) }}</div>
              <div class="text-sm text-success text-right">{{ formatCurrency(mp.net) }}</div>
              <div class="text-sm text-foreground-60 text-right">{{ mp.headcount }}</div>
            </div>
          }
        </div>
        }

        <!-- Weekly detail -->
        @if (isMobile()) {
          <div class="flex items-center gap-2 mb-3">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">people_group</i>
            <div class="text-base font-semibold text-foreground">Weekly Payroll Detail</div>
            <modus-badge color="secondary" size="sm">{{ payrollRecords().length }}</modus-badge>
          </div>
          <div class="flex flex-col gap-3">
            @for (pr of payrollRecords(); track pr.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToPayrollRecord(pr.id)">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-foreground">{{ pr.period }}</div>
                  <modus-badge [color]="payrollStatusBadge(pr.status)" size="sm">{{ capitalizeFirst(pr.status) }}</modus-badge>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Gross</div>
                  <div class="text-sm text-foreground">{{ formatCurrency(pr.grossPay) }}</div>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Net</div>
                  <div class="text-sm text-success">{{ formatCurrency(pr.netPay) }}</div>
                </div>
                <div class="flex items-center gap-4 mt-2">
                  <div class="text-xs text-foreground-60">{{ pr.employeeCount }} emp</div>
                  <div class="text-xs text-foreground-60">{{ pr.totalHours.toLocaleString() }} hrs</div>
                  <div class="text-xs" [class]="pr.overtimeHours > 70 ? 'text-warning font-medium' : 'text-foreground-60'">{{ pr.overtimeHours }} OT</div>
                </div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="px-5 py-4 border-bottom-default">
            <div class="flex items-center gap-2">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">people_group</i>
              <div class="text-base font-semibold text-foreground">Weekly Payroll Detail</div>
              <modus-badge color="secondary" size="sm">{{ payrollRecords().length }}</modus-badge>
            </div>
          </div>
          <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Period</div><div class="text-right">Gross</div><div class="text-right">Net</div><div>Status</div><div class="text-right">Emp</div><div class="text-right">Hours</div><div class="text-right">OT</div>
          </div>
          @for (pr of payrollRecords(); track pr.id) {
            <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.5fr)_minmax(0,0.5fr)_minmax(0,0.5fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" (click)="navigateToPayrollRecord(pr.id)">
              <div class="text-sm font-medium text-foreground">{{ pr.period }}</div>
              <div class="text-sm text-foreground text-right">{{ formatCurrency(pr.grossPay) }}</div>
              <div class="text-sm text-success text-right">{{ formatCurrency(pr.netPay) }}</div>
              <div><modus-badge [color]="payrollStatusBadge(pr.status)" size="sm">{{ capitalizeFirst(pr.status) }}</modus-badge></div>
              <div class="text-sm text-foreground-60 text-right">{{ pr.employeeCount }}</div>
              <div class="text-sm text-foreground-60 text-right">{{ pr.totalHours.toLocaleString() }}</div>
              <div class="text-sm text-right" [class]="pr.overtimeHours > 70 ? 'text-warning font-medium' : 'text-foreground-60'">{{ pr.overtimeHours }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total Contracts</div>
            <div class="text-2xl font-bold text-foreground">{{ contracts().length }}</div>
            <div class="text-xs text-foreground-40">{{ contractSummary().primeCount }} prime / {{ contractSummary().subCount }} sub</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Original Value</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(contractSummary().totalOriginal) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Revised Value</div>
            <div class="text-2xl font-bold text-primary">{{ formatCurrency(contractSummary().totalRevised) }}</div>
            <div class="text-xs" [class]="contractSummary().totalRevised > contractSummary().totalOriginal ? 'text-warning' : 'text-success'">
              {{ contractSummary().totalRevised > contractSummary().totalOriginal ? '+' : '' }}{{ formatCurrency(contractSummary().totalRevised - contractSummary().totalOriginal) }}
            </div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Active</div>
            <div class="text-2xl font-bold text-success">{{ contractSummary().activeCount }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Est. Retainage</div>
            <div class="text-2xl font-bold text-warning">{{ formatCurrency(contractSummary().totalRetainage) }}</div>
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
                <div class="text-sm font-medium text-foreground mb-1">{{ c.title }}</div>
                <div class="text-xs text-foreground-40 mb-3">{{ c.vendor }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Original</div>
                  <div class="text-sm text-foreground-60">{{ formatCurrency(c.originalValue) }}</div>
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Revised</div>
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(c.revisedValue) }}</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-foreground-60">Delta</div>
                  <div class="text-sm" [class]="c.revisedValue > c.originalValue ? 'text-warning' : 'text-foreground-40'">
                    {{ c.revisedValue > c.originalValue ? '+' : '' }}{{ formatCurrency(c.revisedValue - c.originalValue) }}
                  </div>
                </div>
                <div class="text-xs text-foreground-40 mt-2">{{ c.project }}</div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="grid grid-cols-[1fr_100px_120px_120px_120px_90px_100px] gap-2 px-4 py-3 bg-muted text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Contract</div>
            <div>Type</div>
            <div class="text-right">Original</div>
            <div class="text-right">Revised</div>
            <div class="text-right">Delta</div>
            <div>Status</div>
            <div>Project</div>
          </div>
          @for (c of contracts(); track c.id) {
            <div class="grid grid-cols-[1fr_100px_120px_120px_120px_90px_100px] gap-2 px-4 py-3 border-top-default hover:bg-muted items-center cursor-pointer" (click)="navigateToContract(c.id)">
              <div>
                <div class="text-sm font-medium text-foreground truncate">{{ c.title }}</div>
                <div class="text-xs text-foreground-40">{{ c.vendor }}</div>
              </div>
              <div><modus-badge [color]="c.contractType === 'prime' ? 'primary' : 'tertiary'" size="sm">{{ contractTypeLabelShort(c.contractType) }}</modus-badge></div>
              <div class="text-sm text-foreground-60 text-right">{{ formatCurrency(c.originalValue) }}</div>
              <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(c.revisedValue) }}</div>
              <div class="text-sm text-right" [class]="c.revisedValue > c.originalValue ? 'text-warning' : 'text-foreground-40'">
                {{ c.revisedValue > c.originalValue ? '+' : '' }}{{ formatCurrency(c.revisedValue - c.originalValue) }}
              </div>
              <div><modus-badge [color]="contractStatusBadge(c.status)" size="sm">{{ capitalizeFirst(c.status) }}</modus-badge></div>
              <div class="text-xs text-foreground-40 truncate">{{ c.project }}</div>
            </div>
          }
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
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Total Paid</div>
            <div class="text-2xl font-bold text-success">{{ formatCurrency(subLedgerSummary().totalPaid) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Retainage Held</div>
            <div class="text-2xl font-bold text-warning">{{ formatCurrency(subLedgerSummary().totalRetainageHeld) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Retainage Released</div>
            <div class="text-2xl font-bold text-primary">{{ formatCurrency(subLedgerSummary().totalRetainageReleased) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">Backcharges</div>
            <div class="text-2xl font-bold text-destructive">{{ formatCurrency(subLedgerSummary().totalBackcharges) }}</div>
          </div>
          <div class="bg-card rounded-lg border-default p-4 text-center">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-1">CO Adjustments</div>
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(subLedgerSummary().totalChangeOrders) }}</div>
          </div>
        </div>

        @if (isMobile()) {
          <div class="flex flex-col gap-3">
            @for (entry of subcontractLedger(); track entry.id) {
              <div class="bg-card rounded-lg border-default p-4 cursor-pointer" (click)="navigateToSubcontractLedgerEntry(entry.id)">
                <div class="flex items-center justify-between mb-2">
                  <modus-badge [color]="ledgerTypeBadge(entry.type)" size="sm">{{ ledgerTypeLabel(entry.type) }}</modus-badge>
                  <div class="text-xs text-foreground-60">{{ entry.date }}</div>
                </div>
                <div class="text-sm font-medium text-foreground mb-1">{{ entry.description }}</div>
                <div class="text-xs text-foreground-40 mb-1">{{ entry.project }}</div>
                <div class="text-xs text-foreground-60 mb-3">{{ entry.vendor }}</div>
                <div class="flex items-center justify-between mb-1">
                  <div class="text-xs text-foreground-60">Amount</div>
                  <div class="text-sm font-medium" [class]="entry.amount < 0 ? 'text-destructive' : 'text-success'">
                    {{ entry.amount < 0 ? '-' : '' }}{{ formatCurrency(entry.amount < 0 ? -entry.amount : entry.amount) }}
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-xs text-foreground-60">Balance</div>
                  <div class="text-sm font-semibold text-foreground">{{ formatCurrency(entry.runningBalance) }}</div>
                </div>
                <div class="text-xs text-foreground-40 mt-2">{{ entry.payApp }}</div>
              </div>
            }
          </div>
        } @else {
        <div class="bg-card rounded-lg border-default overflow-hidden">
          <div class="grid grid-cols-[1fr_120px_100px_120px_100px_100px_100px] gap-2 px-4 py-3 bg-muted text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Description</div>
            <div>Vendor</div>
            <div>Type</div>
            <div class="text-right">Amount</div>
            <div>Pay App</div>
            <div>Date</div>
            <div class="text-right">Balance</div>
          </div>
          @for (entry of subcontractLedger(); track entry.id) {
            <div class="grid grid-cols-[1fr_120px_100px_120px_100px_100px_100px] gap-2 px-4 py-3 border-top-default hover:bg-muted items-center cursor-pointer" (click)="navigateToSubcontractLedgerEntry(entry.id)">
              <div>
                <div class="text-sm font-medium text-foreground truncate">{{ entry.description }}</div>
                <div class="text-xs text-foreground-40">{{ entry.project }}</div>
              </div>
              <div class="text-sm text-foreground-60 truncate">{{ entry.vendor }}</div>
              <div><modus-badge [color]="ledgerTypeBadge(entry.type)" size="sm">{{ ledgerTypeLabel(entry.type) }}</modus-badge></div>
              <div class="text-sm font-medium text-right" [class]="entry.amount < 0 ? 'text-destructive' : 'text-success'">
                {{ entry.amount < 0 ? '-' : '' }}{{ formatCurrency(entry.amount < 0 ? -entry.amount : entry.amount) }}
              </div>
              <div class="text-xs text-foreground-60">{{ entry.payApp }}</div>
              <div class="text-xs text-foreground-60">{{ entry.date }}</div>
              <div class="text-sm text-foreground text-right">{{ formatCurrency(entry.runningBalance) }}</div>
            </div>
          }
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
    const slug = this.personaService.activePersonaSlug();
    const seed = slug === 'kelly' ? FINANCIALS_KELLY_LAYOUT
      : slug === 'pamela' ? FINANCIALS_PAMELA_LAYOUT
      : FINANCIALS_DEFAULT_LAYOUT;

    return {
      ...seed,
      layoutStorageKey: () => {
        const s = this.personaService.activePersonaSlug();
        const ver = s === 'kelly' ? 'v29' : s === 'pamela' ? 'v31' : 'v17';
        return `${s}:dashboard-financials:${ver}`;
      },
      canvasStorageKey: () => {
        const s = this.personaService.activePersonaSlug();
        const ver = s === 'kelly' ? 'v31' : s === 'pamela' ? 'v33' : 'v19';
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
    return slug === 'kelly' ? FINANCIALS_KELLY_LAYOUT
      : slug === 'pamela' ? FINANCIALS_PAMELA_LAYOUT
      : FINANCIALS_DEFAULT_LAYOUT;
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

  // --- KPI Sparklines (ApexCharts) ---
  readonly showKpiSparklines = computed(() => {
    const span = this.engine.widgetColSpans()['finNavKpi'] ?? 8;
    return !this.isMobile() && span >= 6;
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
