import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { CollapsibleSubnavComponent } from '../project-dashboard/components/collapsible-subnav.component';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';
import { DataStoreService } from '../../data/data-store.service';
import type { NavItem } from '../project-dashboard/project-dashboard.config';
import type { DashboardWidgetId, Project, Estimate, RevenueTimeRange, RevenueDataPoint, JobCostCategory, ProjectJobCost, ChangeOrder, ChangeOrderType, Invoice, BillingSchedule, BillingEvent, Payable, CashFlowEntry, GLAccount, GLEntry, PurchaseOrder, PayrollRecord, Contract, SubcontractLedgerEntry } from '../../data/dashboard-data';
import { budgetProgressClass, estimateBadgeColor, dueDateClass, getRevenueData, getRevenueSummary, getJobCostSummary, JOB_COST_CATEGORIES, CATEGORY_COLORS, coBadgeColor, coTypeLabel, formatCurrency as sharedFormatCurrency, getInvoiceAgingBuckets, getDSO, invoiceStatusBadge, getUpcomingBillings, billingFrequencyLabel, getPayablesSummary, payableStatusBadge, getCashRunway, getCashFlowTrend, getGLBalanceSheet, getPOSummary, poStatusBadge, getPayrollSummary, getMonthlyPayrollTotals, payrollStatusBadge, getContractSummary, getSubcontractLedgerSummary, contractStatusBadge, contractTypeLabel, contractTypeLabelShort, ledgerTypeBadge, ledgerTypeLabel, formatJobCost as sharedFormatJobCost, capitalizeFirst as sharedCapitalizeFirst } from '../../data/dashboard-data';
import { getAgent, type AgentAlert, type AgentDataState } from '../../data/widget-agents';

@Component({
  selector: 'app-financials-page',
  imports: [NgTemplateOutlet, ModusProgressComponent, ModusButtonComponent, ModusBadgeComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent, CollapsibleSubnavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'block h-full',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <ng-template #finSubpageToolbar let-placeholder>
      <div class="bg-card border-default rounded-lg mb-6">
        <div class="flex items-center justify-between px-4 py-2 gap-4">
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
      </div>
    </ng-template>

    @if (jobCostDetailProject(); as project) {
      <!-- Job Cost Detail View -->
      <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">
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
                  <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'trending_down' : 'arrow_up' }}</i>
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
                      <i class="modus-icons text-sm {{ cf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ cf.isFade ? 'trending_down' : 'arrow_up' }}</i>
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
    } @else if (activeSubPage() === 'overview') {
    <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">
      @if (!isCanvasMode()) {
      <div #pageHeader>
      <!-- Page header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials Dashboard</div>
          <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
        </div>
        <div class="flex-shrink-0">
          <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Total Budget</div>
            <div class="w-9 h-9 rounded-lg bg-primary-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-primary" aria-hidden="true">payment_instant</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-foreground">{{ portfolioBudgetTotalFmt() }}</div>
          <div class="text-xs text-foreground-60">Across {{ totalProjects() }} active projects</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Total Spent</div>
            <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-warning" aria-hidden="true">bar_graph_line</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-foreground">{{ portfolioBudgetUsedFmt() }}</div>
          <div class="text-xs text-warning font-medium">{{ portfolioBudgetPct() }}% of total budget consumed</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Remaining</div>
            <div class="w-9 h-9 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-success" aria-hidden="true">bar_graph</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-success">{{ portfolioBudgetRemainingFmt() }}</div>
          <div class="text-xs text-success font-medium">{{ 100 - portfolioBudgetPct() }}% remaining budget</div>
        </div>
      </div>
      @if (finKpiInsight()) {
        <div class="flex items-center gap-1.5 px-5 py-2 mb-6 bg-card border-default rounded-lg">
          <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
          <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
        </div>
      } @else {
        <div class="mb-2"></div>
      }
      </div>
      }

      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : isMobile() ? 'relative mb-6' : 'relative mb-6 widget-grid-desktop'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="isCanvasMode() ? canvasGridMinHeight() : (!isMobile() ? desktopGridMinHeight() : null)"
        #financialsWidgetGrid
      >
        @if (isCanvasMode()) {
          <div
            class="absolute overflow-hidden"
            [attr.data-widget-id]="'finHeader'"
            [style.top.px]="widgetTops()['finHeader']"
            [style.left.px]="widgetLefts()['finHeader']"
            [style.width.px]="widgetPixelWidths()['finHeader']"
            [style.height.px]="widgetHeights()['finHeader']"
            [style.z-index]="widgetZIndices()['finHeader']"
          >
            <div class="flex items-start justify-between mb-4">
              <div>
                <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials Dashboard</div>
                <div class="text-sm text-foreground-60 mt-1">{{ today }}</div>
              </div>
              <div class="flex-shrink-0">
                <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-2xl text-primary" aria-hidden="true">payment_instant</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-2xl font-bold text-foreground">{{ portfolioBudgetTotalFmt() }}</div>
                  <div class="text-sm text-foreground-60">Total Budget</div>
                </div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-2xl text-warning" aria-hidden="true">bar_graph_line</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-2xl font-bold text-foreground">{{ portfolioBudgetUsedFmt() }}</div>
                  <div class="text-sm text-foreground-60">Total Spent</div>
                </div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-success-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-2xl text-success" aria-hidden="true">bar_graph</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-2xl font-bold text-success">{{ portfolioBudgetRemainingFmt() }}</div>
                  <div class="text-sm text-foreground-60">Remaining</div>
                </div>
              </div>
            </div>
            @if (finKpiInsight()) {
              <div class="flex items-center gap-1.5 px-5 py-2 mt-3 bg-card border-default rounded-lg">
                <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">lightning</i>
                <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
              </div>
            }
          </div>
        }
        @for (widgetId of financialsWidgets; track widgetId) {
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

              @if (widgetId === 'finNavLinks') {
                <!-- Financials Navigation Links Widget (collapsible) -->
                <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full" [class.border-default]="selectedWidgetId() !== widgetId" [class.border-primary]="selectedWidgetId() === widgetId">
                  <div class="flex items-center py-3 pl-4 pr-2 justify-between flex-shrink-0 cursor-grab active:cursor-grabbing select-none hover:bg-muted transition-colors duration-150"
                    role="button" tabindex="0"
                    [attr.aria-label]="finNavLinksCollapsed() ? 'Expand navigation' : 'Collapse navigation'"
                    (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                    (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                    (click)="finNavLinksCollapsed.set(!finNavLinksCollapsed())"
                    (keydown.enter)="finNavLinksCollapsed.set(!finNavLinksCollapsed())">
                    <div class="flex items-center gap-2 min-w-0">
                      <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle>drag_indicator</i>
                      <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">payment_instant</i>
                      <div class="text-sm font-semibold truncate" [class]="finNavLinksCollapsed() ? 'text-foreground' : 'text-primary'">
                        {{ finNavLinksCollapsed() ? activeNavLinkLabel() : 'Financials' }}
                      </div>
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
                    <div class="flex items-center justify-center w-6 h-6 rounded flex-shrink-0">
                      <i class="modus-icons text-sm text-foreground-60 transition-transform duration-200" aria-hidden="true"
                        [style.transform]="finNavLinksCollapsed() ? 'rotate(0deg)' : 'rotate(-90deg)'"
                      >chevron_left</i>
                    </div>
                  </div>

                  <div class="overflow-hidden transition-all duration-200"
                    [style.max-height.px]="finNavLinksCollapsed() ? 0 : 600"
                    [style.opacity]="finNavLinksCollapsed() ? 0 : 1">
                    <div class="overflow-y-auto min-h-0 py-1">
                      @for (item of finNavLinkItems; track item.value) {
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
                </div>
              } @else if (widgetId === 'finRevenueChart') {
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

                    <div class="flex-1 min-h-0 relative pl-9 pb-5"
                      #chartArea
                      (mousemove)="onChartMouseMove($event)"
                      (mouseleave)="onChartMouseLeave()">
                      <svg class="w-full h-full" [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" class="chart-gradient-start" />
                            <stop offset="100%" class="chart-gradient-end" />
                          </linearGradient>
                        </defs>

                        @for (line of chartGridLines(); track line.y) {
                          <line [attr.x1]="0" [attr.y1]="line.y" [attr.x2]="chartWidth" [attr.y2]="line.y" class="chart-grid-line" />
                        }

                        <path [attr.d]="chartAreaPath()" fill="url(#revenueGrad)" />
                        <path [attr.d]="chartLinePath()" fill="none" class="chart-line" />

                        <line [attr.x1]="0" [attr.y1]="chartHighLow().highY" [attr.x2]="chartWidth" [attr.y2]="chartHighLow().highY" class="chart-high-line" />
                        <line [attr.x1]="0" [attr.y1]="chartHighLow().lowY" [attr.x2]="chartWidth" [attr.y2]="chartHighLow().lowY" class="chart-low-line" />

                        @if (showDots()) {
                          @for (pt of chartPoints(); track pt.x) {
                            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" class="chart-dot" />
                          }
                        }

                        @if (hoverInfo()) {
                          <line [attr.x1]="hoverInfo()!.svgX" [attr.y1]="0" [attr.x2]="hoverInfo()!.svgX" [attr.y2]="chartHeight" class="chart-crosshair" />
                          <circle [attr.cx]="hoverInfo()!.svgX" [attr.cy]="hoverInfo()!.svgY" r="5" class="chart-hover-dot" />
                        }
                      </svg>

                      @if (hoverInfo()) {
                        <div class="absolute bg-card border-default rounded px-2 py-1 text-xs font-medium text-foreground pointer-events-none shadow-md"
                          style="transform:translateX(-50%);white-space:nowrap;z-index:10"
                          [style.left.%]="hoverInfo()!.pctX"
                          [style.top.px]="-4">
                          {{ hoverInfo()!.label ? hoverInfo()!.label + ': ' : '' }}{{ formatCurrency(hoverInfo()!.value) }}
                        </div>
                      }

                      <div class="absolute bottom-0 left-9 right-0 text-2xs text-foreground-40" style="position:relative">
                        @for (lbl of chartVisibleLabels(); track lbl.pct) {
                          <div class="absolute" [style.left.%]="lbl.pct" style="transform:translateX(-50%)">{{ lbl.text }}</div>
                        }
                      </div>

                      <div class="absolute top-0 left-0 bottom-5 flex flex-col justify-between text-2xs text-foreground-40">
                        @for (line of chartGridLines(); track line.y) {
                          <div>{{ line.label }}</div>
                        }
                      </div>

                      <div class="absolute text-2xs font-medium text-success" style="right:0" [style.top.%]="chartHighLow().highPct">
                        H: {{ chartHighLow().highLabel }}
                      </div>
                      <div class="absolute text-2xs font-medium text-destructive" style="right:0" [style.top.%]="chartHighLow().lowPct">
                        L: {{ chartHighLow().lowLabel }}
                      </div>
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
          [items]="finSubNavItems"
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
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'change-orders') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'job-costs') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'job-billing') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'accounts-receivable') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
          @for (bucket of agingBuckets(); track bucket.label) {
            <div class="bg-card rounded-lg p-4 border-default">
              <div class="text-xs text-foreground-60 mb-1">{{ bucket.label }}</div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(bucket.total) }}</div>
              <div class="text-xs text-foreground-40">{{ bucket.count }} invoices</div>
            </div>
          }
        </div>

        <!-- Invoice table -->
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
      </div>
    }

    @if (activeSubPage() === 'accounts-payable') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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

        <!-- Payables table -->
        <div class="bg-card rounded-lg border-default overflow-hidden">
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
      </div>
    }

    @if (activeSubPage() === 'cash-management') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'general-ledger') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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

        <!-- Recent journal entries -->
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
      </div>
    }

    @if (activeSubPage() === 'purchase-orders') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'payroll') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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

        <!-- Weekly detail -->
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
      </div>
    }

    @if (activeSubPage() === 'contracts') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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
      </div>
    }

    @if (activeSubPage() === 'subcontract-ledger') {
      <div class="px-4 pb-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="transition-all duration-200 flex-shrink-0" [style.margin-left.px]="finSubnavCollapsed() && !isMobile() ? 227 : 0">
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

  // Subnav configuration
  readonly finSubNavItems: NavItem[] = [
    { value: 'overview', label: 'Overview', icon: 'dashboard' },
    { value: 'estimates', label: 'Estimates', icon: 'file' },
    { value: 'change-orders', label: 'Change Orders', icon: 'swap' },
    { value: 'job-costs', label: 'Job Costs', icon: 'bar_graph' },
    { value: 'job-billing', label: 'Job Billing', icon: 'invoice' },
    { value: 'accounts-receivable', label: 'Accounts Receivable', icon: 'document' },
    { value: 'accounts-payable', label: 'Accounts Payable', icon: 'credit_card' },
    { value: 'cash-management', label: 'Cash Management', icon: 'gantt_chart' },
    { value: 'general-ledger', label: 'General Ledger', icon: 'list_bulleted' },
    { value: 'purchase-orders', label: 'Purchase Orders', icon: 'shopping_cart' },
    { value: 'payroll', label: 'Payroll', icon: 'people_group' },
    { value: 'contracts', label: 'Contracts', icon: 'copy_content' },
    { value: 'subcontract-ledger', label: 'Subcontract Ledger', icon: 'clipboard' },
  ];
  readonly activeSubPage = signal<string>('overview');
  readonly finSubnavCollapsed = signal(false);
  readonly finNavLinksCollapsed = signal(false);
  readonly finSubpageSearch = signal('');

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

  private static readonly HEADER_HEIGHT = 160;
  private static readonly HEADER_OFFSET = FinancialsPageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly NAV_LINKS_HEIGHT = 560;
  private static readonly NAV_LINKS_WIDTH = 240;
  private static readonly CONTENT_LEFT = FinancialsPageComponent.NAV_LINKS_WIDTH + DashboardLayoutEngine.GAP_PX;
  private static readonly CONTENT_WIDTH = 1280 - FinancialsPageComponent.CONTENT_LEFT;
  private static readonly REVENUE_HEIGHT = 384;
  private static readonly REVENUE_OFFSET = FinancialsPageComponent.HEADER_OFFSET + FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ESTIMATES_HEIGHT = 512;
  private static readonly ESTIMATES_OFFSET_DESKTOP = FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ESTIMATES_OFFSET_CANVAS = FinancialsPageComponent.REVENUE_OFFSET + FinancialsPageComponent.ESTIMATES_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_HEIGHT = 512;
  private static readonly BUDGET_OFFSET_DESKTOP = FinancialsPageComponent.ESTIMATES_OFFSET_DESKTOP + FinancialsPageComponent.ESTIMATES_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_OFFSET_CANVAS = FinancialsPageComponent.ESTIMATES_OFFSET_CANVAS + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly JOB_COSTS_HEIGHT = 576;
  private static readonly JOB_COSTS_OFFSET_DESKTOP = FinancialsPageComponent.BUDGET_OFFSET_DESKTOP + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly JOB_COSTS_OFFSET_CANVAS = FinancialsPageComponent.BUDGET_OFFSET_CANVAS + FinancialsPageComponent.JOB_COSTS_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly CO_HEIGHT = 560;
  private static readonly CO_OFFSET_DESKTOP = FinancialsPageComponent.JOB_COSTS_OFFSET_DESKTOP + FinancialsPageComponent.JOB_COSTS_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly CO_OFFSET_CANVAS = FinancialsPageComponent.JOB_COSTS_OFFSET_CANVAS + FinancialsPageComponent.CO_HEIGHT + DashboardLayoutEngine.GAP_PX;

  protected override getEngineConfig(): DashboardLayoutConfig {
    const CL = FinancialsPageComponent.CONTENT_LEFT;
    const CW = FinancialsPageComponent.CONTENT_WIDTH;
    return {
      widgets: ['finHeader', 'finNavLinks', 'finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders'],
      layoutStorageKey: 'dashboard-financials:v9',
      canvasStorageKey: 'canvas-layout:dashboard-financials:v10',
      defaultColStarts: { finHeader: 1, finNavLinks: 1, finRevenueChart: 4, finOpenEstimates: 4, finBudgetByProject: 4, finJobCosts: 4, finChangeOrders: 4 },
      defaultColSpans: { finHeader: 16, finNavLinks: 3, finRevenueChart: 13, finOpenEstimates: 13, finBudgetByProject: 13, finJobCosts: 13, finChangeOrders: 13 },
      defaultTops: { finHeader: 0, finNavLinks: 0, finRevenueChart: 0, finOpenEstimates: FinancialsPageComponent.ESTIMATES_OFFSET_DESKTOP, finBudgetByProject: FinancialsPageComponent.BUDGET_OFFSET_DESKTOP, finJobCosts: FinancialsPageComponent.JOB_COSTS_OFFSET_DESKTOP, finChangeOrders: FinancialsPageComponent.CO_OFFSET_DESKTOP },
      defaultHeights: { finHeader: 0, finNavLinks: FinancialsPageComponent.NAV_LINKS_HEIGHT, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finOpenEstimates: FinancialsPageComponent.ESTIMATES_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: FinancialsPageComponent.JOB_COSTS_HEIGHT, finChangeOrders: FinancialsPageComponent.CO_HEIGHT },
      canvasDefaultLefts: { finHeader: 0, finNavLinks: 0, finRevenueChart: CL, finOpenEstimates: CL, finBudgetByProject: CL, finJobCosts: CL, finChangeOrders: CL },
      canvasDefaultPixelWidths: { finHeader: 1280, finNavLinks: FinancialsPageComponent.NAV_LINKS_WIDTH, finRevenueChart: CW, finOpenEstimates: CW, finBudgetByProject: CW, finJobCosts: CW, finChangeOrders: CW },
      canvasDefaultTops: {
        finHeader: 0,
        finNavLinks: FinancialsPageComponent.HEADER_OFFSET,
        finRevenueChart: FinancialsPageComponent.HEADER_OFFSET,
        finOpenEstimates: FinancialsPageComponent.REVENUE_OFFSET,
        finBudgetByProject: FinancialsPageComponent.ESTIMATES_OFFSET_CANVAS,
        finJobCosts: FinancialsPageComponent.BUDGET_OFFSET_CANVAS,
        finChangeOrders: FinancialsPageComponent.CO_OFFSET_CANVAS,
      },
      canvasDefaultHeights: { finHeader: FinancialsPageComponent.HEADER_HEIGHT, finNavLinks: FinancialsPageComponent.NAV_LINKS_HEIGHT, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finOpenEstimates: FinancialsPageComponent.ESTIMATES_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: FinancialsPageComponent.JOB_COSTS_HEIGHT, finChangeOrders: FinancialsPageComponent.CO_HEIGHT },
      minColSpan: 1,
      widgetMaxColSpans: { finNavLinks: 3 },
      canvasGridMinHeightOffset: 200,
      savesDesktopOnMobile: false,
      onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
    };
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, finHeader: true }));
  }

  readonly projects = this.store.projects;
  readonly totalProjects = computed(() => this.projects().length);

  private parseAmt(s: string): number {
    const clean = s.replace(/[^0-9.KMkm]/g, '');
    if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
    if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
    return parseFloat(clean) || 0;
  }

  private fmtCurrency(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  }

  readonly portfolioBudgetTotal = computed(() =>
    this.projects().reduce((sum, p) => sum + this.parseAmt(p.budgetTotal), 0),
  );

  readonly portfolioBudgetUsed = computed(() =>
    this.projects().reduce((sum, p) => sum + this.parseAmt(p.budgetUsed), 0),
  );

  readonly portfolioBudgetRemaining = computed(() =>
    this.portfolioBudgetTotal() - this.portfolioBudgetUsed(),
  );

  readonly portfolioBudgetPct = computed(() => {
    const total = this.portfolioBudgetTotal();
    return total > 0 ? Math.round((this.portfolioBudgetUsed() / total) * 100) : 0;
  });

  readonly portfolioBudgetTotalFmt = computed(() => this.fmtCurrency(this.portfolioBudgetTotal()));
  readonly portfolioBudgetUsedFmt = computed(() => this.fmtCurrency(this.portfolioBudgetUsed()));
  readonly portfolioBudgetRemainingFmt = computed(() => this.fmtCurrency(this.portfolioBudgetRemaining()));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly financialsWidgets: DashboardWidgetId[] = ['finNavLinks', 'finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders'];

  readonly finNavLinkItems = this.finSubNavItems.filter(i => i.value !== 'overview');

  readonly activeNavLinkLabel = computed(() => {
    const active = this.activeSubPage();
    return this.finNavLinkItems.find(i => i.value === active)?.label ?? 'Financials';
  });

  private readonly finSubPageDescriptions: Record<string, string> = {
    'estimates': 'Open estimates, pricing proposals, and pending approvals',
    'change-orders': 'Owner, subcontractor, and internal change orders across all projects',
    'job-costs': 'Cost breakdown by category and project across the portfolio',
    'job-billing': 'Billing schedules and invoice events across all projects',
    'accounts-receivable': 'Invoices, aging, and collection metrics',
    'accounts-payable': 'Vendor payables, subcontractor payments, and aging',
    'cash-management': 'Cash position, flow trends, and runway analysis',
    'general-ledger': 'Chart of accounts, journal entries, and trial balance',
    'purchase-orders': 'Material procurement, vendor deliveries, and committed spend',
    'payroll': 'Weekly payroll, labor costs, headcount, and overtime tracking',
    'contracts': 'Prime contracts, subcontracts, and committed values across all projects',
    'subcontract-ledger': 'Payment applications, retainage, backcharges, and change order adjustments',
  };

  readonly activeSubPageTitle = computed(() => {
    return this.finSubNavItems.find(i => i.value === this.activeSubPage())?.label ?? '';
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
    if (sp && this.finSubNavItems.some(i => i.value === sp)) {
      this.activeSubPage.set(sp);
    }
  });

  navigateToChangeOrder(id: string): void {
    this.router.navigate(['/financials/change-orders', id]);
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

  readonly chartWidth = 600;
  readonly chartHeight = 200;

  readonly chartPoints = computed(() => {
    const data = this.revenueData();
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value)) * 0.85;
    const range = maxVal - minVal || 1;
    const padX = 10;
    const padY = 10;
    const w = this.chartWidth - padX * 2;
    const h = this.chartHeight - padY * 2;
    return data.map((d, i) => ({
      x: padX + (data.length > 1 ? (i / (data.length - 1)) * w : w / 2),
      y: padY + h - ((d.value - minVal) / range) * h,
    }));
  });

  readonly chartLinePath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  });

  readonly chartAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return `${line} L${pts[pts.length - 1].x},${this.chartHeight} L${pts[0].x},${this.chartHeight} Z`;
  });

  readonly chartGridLines = computed(() => {
    const data = this.revenueData();
    if (data.length === 0) return [];
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value)) * 0.85;
    const range = maxVal - minVal || 1;
    const padY = 10;
    const h = this.chartHeight - padY * 2;
    const steps = 4;
    const lines: { y: number; label: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const val = minVal + (range * (steps - i)) / steps;
      lines.push({
        y: padY + (i / steps) * h,
        label: this.formatCompact(val),
      });
    }
    return lines;
  });

  readonly showDots = computed(() => this.revenueData().length <= 20);

  readonly chartHighLow = computed(() => {
    const data = this.revenueData();
    if (data.length === 0) return { highY: 0, lowY: 0, highPct: 0, lowPct: 0, highLabel: '', lowLabel: '' };
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const chartMin = Math.min(...values) * 0.85;
    const range = maxVal - chartMin || 1;
    const padY = 10;
    const h = this.chartHeight - padY * 2;
    const highY = padY + h - ((maxVal - chartMin) / range) * h;
    const lowY = padY + h - ((minVal - chartMin) / range) * h;
    const totalH = this.chartHeight;
    return {
      highY,
      lowY,
      highPct: (highY / totalH) * 100,
      lowPct: (lowY / totalH) * 100,
      highLabel: this.formatCurrency(maxVal),
      lowLabel: this.formatCurrency(minVal),
    };
  });

  readonly chartVisibleLabels = computed(() => {
    const data = this.revenueData();
    if (data.length === 0) return [];
    const labels: { text: string; pct: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].label) {
        labels.push({
          text: data[i].label,
          pct: data.length > 1 ? (i / (data.length - 1)) * 100 : 50,
        });
      }
    }
    return labels;
  });

  readonly hoverInfo = signal<{ svgX: number; svgY: number; pctX: number; value: number; label: string } | null>(null);

  private readonly chartAreaRef = viewChild<ElementRef>('chartArea');

  onChartMouseMove(event: MouseEvent): void {
    const el = this.chartAreaRef()?.nativeElement as HTMLElement | undefined;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padLeft = 36;
    const padBottom = 20;
    const chartLeft = rect.left + padLeft;
    const chartW = rect.width - padLeft;
    const relX = event.clientX - chartLeft;
    const pctX = Math.max(0, Math.min(1, relX / chartW));

    const data = this.revenueData();
    if (data.length === 0) return;
    const idx = Math.round(pctX * (data.length - 1));
    const pts = this.chartPoints();
    if (!pts[idx]) return;

    this.hoverInfo.set({
      svgX: pts[idx].x,
      svgY: pts[idx].y,
      pctX: pctX * 100,
      value: data[idx].value,
      label: data[idx].label,
    });
  }

  onChartMouseLeave(): void {
    this.hoverInfo.set(null);
  }

  selectRange(range: RevenueTimeRange): void {
    this.selectedRange.set(range);
    this.hoverInfo.set(null);
  }

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${value}`;
  }

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
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
    this.router.navigate(['/financials/job-costs', slug]);
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
    this.router.navigate(['/financials']);
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
        if (proj) this.router.navigate(['/financials/job-costs', proj.slug]);
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
    this.router.navigate(['/financials/estimates', id]);
  }

  navigateToInvoice(id: string): void {
    this.router.navigate(['/financials/invoices', id]);
  }

  navigateToPayable(id: string): void {
    this.router.navigate(['/financials/payables', id]);
  }

  navigateToPurchaseOrder(id: string): void {
    this.router.navigate(['/financials/purchase-orders', id]);
  }

  navigateToContract(id: string): void {
    this.router.navigate(['/financials/contracts', id]);
  }

  navigateToBillingEvent(id: string): void {
    this.router.navigate(['/financials/billing', id]);
  }

  navigateToPayrollRecord(id: string): void {
    this.router.navigate(['/financials/payroll', id]);
  }

  navigateToPayrollMonthly(month: string): void {
    this.router.navigate(['/financials/payroll-monthly', encodeURIComponent(month)]);
  }

  navigateToSubcontractLedgerEntry(id: string): void {
    this.router.navigate(['/financials/subcontract-ledger', id]);
  }

  navigateToGlEntry(id: string): void {
    this.router.navigate(['/financials/gl-entries', id]);
  }

  navigateToGlAccount(code: string): void {
    this.router.navigate(['/financials/gl-accounts', code]);
  }

  navigateToCashFlow(month: string): void {
    this.router.navigate(['/financials/cash-flow', encodeURIComponent(month)]);
  }

  toggleWidgetLock(id: string): void {
    this.engine.toggleWidgetLock(id);
  }

  private resolveSlugToProject(slug: string): ProjectJobCost | null {
    const proj = this.store.findProjectBySlug(slug);
    if (!proj) return null;
    return this.projectJobCosts().find(p => p.projectId === proj.id) ?? null;
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const slug = params.get('slug');
      if (slug) {
        const match = this.resolveSlugToProject(slug);
        if (match) {
          this.activateJobCostDetail(match);
        } else {
          this.router.navigate(['/financials']);
        }
      } else {
        this.jobCostDetailProject.set(null);
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
