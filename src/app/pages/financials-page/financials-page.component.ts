import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';
import type { DashboardWidgetId, Project, Estimate, RevenueTimeRange, RevenueDataPoint, JobCostCategory, ProjectJobCost, ChangeOrder, ChangeOrderType } from '../../data/dashboard-data';
import { PROJECTS, ESTIMATES, budgetProgressClass, estimateBadgeColor, dueDateClass, getRevenueData, getRevenueSummary, getJobCostSummary, getProjectJobCosts, JOB_COST_CATEGORIES, CATEGORY_COLORS, CHANGE_ORDERS, coBadgeColor, coTypeLabel } from '../../data/dashboard-data';
import { getAgent, type AgentDataState } from '../../data/widget-agents';

@Component({
  selector: 'app-financials-page',
  imports: [ModusProgressComponent, ModusButtonComponent, ModusBadgeComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
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
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">gauge</i>
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
            <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
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
                  <i class="modus-icons text-lg {{ pf.isFade ? 'text-destructive' : 'text-success' }}" aria-hidden="true">{{ pf.isFade ? 'trending_down' : 'trending_up' }}</i>
                  <div class="text-2xl font-bold {{ pf.isFade ? 'text-destructive' : 'text-success' }}">{{ pf.isFade ? '' : '+' }}{{ pf.fadeGain }}%</div>
                </div>
                <div class="text-xs text-foreground-60">{{ pf.isFade ? 'Below original estimate' : 'Above original estimate' }}</div>
              </div>
            </div>

            <!-- Chart -->
            <div class="relative" style="padding-left:36px;padding-bottom:20px">
              <svg class="w-full" [attr.viewBox]="'0 0 ' + pfW + ' ' + pfH" preserveAspectRatio="none" style="height:160px">
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

        <!-- Budget vs Cost comparison table -->
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
    } @else {
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
          <div class="text-4xl font-bold text-foreground">$3.7M</div>
          <div class="text-xs text-foreground-60">Across {{ totalProjects() }} active projects</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Total Spent</div>
            <div class="w-9 h-9 rounded-lg bg-warning-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-warning" aria-hidden="true">bar_graph_line</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-foreground">$2.1M</div>
          <div class="text-xs text-warning font-medium">57% of total budget consumed</div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground-60">Remaining</div>
            <div class="w-9 h-9 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-lg text-success" aria-hidden="true">bar_graph</i>
            </div>
          </div>
          <div class="text-4xl font-bold text-success">$1.6M</div>
          <div class="text-xs text-success font-medium">43% remaining budget</div>
        </div>
      </div>
      @if (finKpiInsight()) {
        <div class="flex items-center gap-1.5 px-5 py-2 mb-6 bg-card border-default rounded-lg">
          <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
          <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
        </div>
      } @else {
        <div class="mb-2"></div>
      }
      </div>
      }

      <!-- Widget area -->
      <div
        [class]="isCanvasMode() ? 'relative overflow-visible mb-6' : 'relative mb-6'"
        [style.height.px]="isMobile() ? mobileGridHeight() : null"
        [style.min-height.px]="!isMobile() ? canvasGridMinHeight() : null"
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
            [style.z-index]="widgetZIndices()['finHeader'] ?? 0"
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
                  <div class="text-2xl font-bold text-foreground">$3.7M</div>
                  <div class="text-sm text-foreground-60">Total Budget</div>
                </div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-warning-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-2xl text-warning" aria-hidden="true">bar_graph_line</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-2xl font-bold text-foreground">$2.1M</div>
                  <div class="text-sm text-foreground-60">Total Spent</div>
                </div>
              </div>
              <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-success-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-2xl text-success" aria-hidden="true">bar_graph</i>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-2xl font-bold text-success">$1.6M</div>
                  <div class="text-sm text-foreground-60">Remaining</div>
                </div>
              </div>
            </div>
            @if (finKpiInsight()) {
              <div class="flex items-center gap-1.5 px-5 py-2 mt-3 bg-card border-default rounded-lg">
                <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
                <div class="text-xs text-foreground-60 truncate leading-none">{{ finKpiInsight() }}</div>
              </div>
            }
          </div>
        }
        @for (widgetId of financialsWidgets; track widgetId) {
          <div
            [class]="isMobile() ? 'absolute left-0 right-0 overflow-hidden' : 'absolute overflow-hidden'"
            [attr.data-widget-id]="widgetId"
            [style.top.px]="widgetTops()[widgetId]"
            [style.left.px]="!isMobile() ? widgetLefts()[widgetId] : null"
            [style.width.px]="!isMobile() ? widgetPixelWidths()[widgetId] : null"
            [style.height.px]="widgetHeights()[widgetId]"
            [style.z-index]="widgetZIndices()[widgetId] ?? 0"
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
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
                      <div class="text-xs text-foreground-60 truncate leading-none">{{ revenueInsight() }}</div>
                    </div>
                  }

                  <div class="flex-1 flex flex-col px-5 py-4 gap-3 min-h-0">
                    <div class="flex items-baseline gap-3">
                      <div class="text-3xl font-bold text-foreground">{{ formatCurrency(revenueSummary().current) }}</div>
                      <div class="flex items-center gap-1 text-sm font-medium text-success">
                        <i class="modus-icons text-sm" aria-hidden="true">trending_up</i>
                        +{{ revenueSummary().growthPct }}%
                      </div>
                      <div class="text-xs text-foreground-40">{{ revenueSummary().label }}</div>
                    </div>

                    <div class="flex-1 min-h-0 relative" style="padding-left:36px;padding-bottom:20px"
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
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
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
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
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
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
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
                      <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">swap_horizontal</i>
                      <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Change Orders</div>
                      <modus-badge color="secondary" size="sm">{{ filteredChangeOrders().length }}</modus-badge>
                    </div>
                  </div>
                  @if (changeOrdersInsight()) {
                    <div class="flex items-center gap-1.5 px-5 py-2 border-bottom-default">
                      <i class="modus-icons text-xs text-primary leading-none flex-shrink-0" aria-hidden="true">flash</i>
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
                        <i class="modus-icons text-3xl mb-2" aria-hidden="true">swap_horizontal</i>
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
    }
  `,
})
export class FinancialsPageComponent implements AfterViewInit {
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  private static readonly HEADER_HEIGHT = 160;
  private static readonly HEADER_OFFSET = FinancialsPageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly REVENUE_HEIGHT = 380;
  private static readonly REVENUE_OFFSET = FinancialsPageComponent.HEADER_OFFSET + FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ESTIMATES_HEIGHT = 520;
  private static readonly ESTIMATES_OFFSET_DESKTOP = FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly ESTIMATES_OFFSET_CANVAS = FinancialsPageComponent.REVENUE_OFFSET + FinancialsPageComponent.ESTIMATES_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_HEIGHT = 520;
  private static readonly BUDGET_OFFSET_DESKTOP = FinancialsPageComponent.ESTIMATES_OFFSET_DESKTOP + FinancialsPageComponent.ESTIMATES_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_OFFSET_CANVAS = FinancialsPageComponent.ESTIMATES_OFFSET_CANVAS + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly JOB_COSTS_HEIGHT = 580;
  private static readonly JOB_COSTS_OFFSET_DESKTOP = FinancialsPageComponent.BUDGET_OFFSET_DESKTOP + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly JOB_COSTS_OFFSET_CANVAS = FinancialsPageComponent.BUDGET_OFFSET_CANVAS + FinancialsPageComponent.JOB_COSTS_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly CO_HEIGHT = 560;
  private static readonly CO_OFFSET_DESKTOP = FinancialsPageComponent.JOB_COSTS_OFFSET_DESKTOP + FinancialsPageComponent.JOB_COSTS_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly CO_OFFSET_CANVAS = FinancialsPageComponent.JOB_COSTS_OFFSET_CANVAS + FinancialsPageComponent.CO_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['finHeader', 'finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders'],
    layoutStorageKey: 'dashboard-financials:v5',
    canvasStorageKey: 'canvas-layout:dashboard-financials:v6',
    defaultColStarts: { finHeader: 1, finRevenueChart: 1, finOpenEstimates: 1, finBudgetByProject: 1, finJobCosts: 1, finChangeOrders: 1 },
    defaultColSpans: { finHeader: 16, finRevenueChart: 16, finOpenEstimates: 16, finBudgetByProject: 16, finJobCosts: 16, finChangeOrders: 16 },
    defaultTops: { finHeader: 0, finRevenueChart: 0, finOpenEstimates: FinancialsPageComponent.ESTIMATES_OFFSET_DESKTOP, finBudgetByProject: FinancialsPageComponent.BUDGET_OFFSET_DESKTOP, finJobCosts: FinancialsPageComponent.JOB_COSTS_OFFSET_DESKTOP, finChangeOrders: FinancialsPageComponent.CO_OFFSET_DESKTOP },
    defaultHeights: { finHeader: 0, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finOpenEstimates: FinancialsPageComponent.ESTIMATES_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: FinancialsPageComponent.JOB_COSTS_HEIGHT, finChangeOrders: FinancialsPageComponent.CO_HEIGHT },
    defaultLefts: { finHeader: 0, finRevenueChart: 0, finOpenEstimates: 0, finBudgetByProject: 0, finJobCosts: 0, finChangeOrders: 0 },
    defaultPixelWidths: { finHeader: 1280, finRevenueChart: 1280, finOpenEstimates: 1280, finBudgetByProject: 1280, finJobCosts: 1280, finChangeOrders: 1280 },
    canvasDefaultLefts: { finHeader: 0, finRevenueChart: 0, finOpenEstimates: 0, finBudgetByProject: 0, finJobCosts: 0, finChangeOrders: 0 },
    canvasDefaultPixelWidths: { finHeader: 1280, finRevenueChart: 1280, finOpenEstimates: 1280, finBudgetByProject: 1280, finJobCosts: 1280, finChangeOrders: 1280 },
    canvasDefaultTops: {
      finHeader: 0,
      finRevenueChart: FinancialsPageComponent.HEADER_OFFSET,
      finOpenEstimates: FinancialsPageComponent.REVENUE_OFFSET,
      finBudgetByProject: FinancialsPageComponent.ESTIMATES_OFFSET_CANVAS,
      finJobCosts: FinancialsPageComponent.BUDGET_OFFSET_CANVAS,
      finChangeOrders: FinancialsPageComponent.CO_OFFSET_CANVAS,
    },
    canvasDefaultHeights: { finHeader: FinancialsPageComponent.HEADER_HEIGHT, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finOpenEstimates: FinancialsPageComponent.ESTIMATES_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: FinancialsPageComponent.JOB_COSTS_HEIGHT, finChangeOrders: FinancialsPageComponent.CO_HEIGHT },
    minColSpan: 1,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: false,
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _lockHeader = (() => {
    this.engine.widgetLocked.update(l => ({ ...l, finHeader: true }));
  })();

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.engine.widgetLocked.update(l => ({ ...l, finHeader: true }));
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

  readonly projects = signal<Project[]>(PROJECTS);
  readonly totalProjects = computed(() => this.projects().length);
  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly financialsWidgets: DashboardWidgetId[] = ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders'];

  readonly estimates = signal<Estimate[]>(ESTIMATES);
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
    return tab === 'all' ? CHANGE_ORDERS : CHANGE_ORDERS.filter(co => co.coType === tab);
  });
  coTabCount(tab: ChangeOrderType | 'all'): number {
    return tab === 'all' ? CHANGE_ORDERS.length : CHANGE_ORDERS.filter(co => co.coType === tab).length;
  }
  readonly coBadgeColor = coBadgeColor;
  readonly coTypeLabel = coTypeLabel;

  capitalizeFirst(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  navigateToChangeOrder(id: string): void {
    this.router.navigate(['/financials/change-orders', id]);
  }

  private buildFinAgentState(): AgentDataState {
    return { projects: PROJECTS, estimates: ESTIMATES, changeOrders: CHANGE_ORDERS, currentPage: 'financials' };
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

  readonly timeRanges: RevenueTimeRange[] = ['1M', 'YTD', '1Y', '3Y', '5Y'];
  readonly selectedRange = signal<RevenueTimeRange>('1Y');

  readonly revenueData = computed(() => getRevenueData(this.selectedRange()));
  readonly revenueSummary = computed(() => getRevenueSummary(this.selectedRange()));

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

  formatCurrency(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  }

  formatCompact(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return `${value}`;
  }

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly financialsGridContainerRef = viewChild<ElementRef>('financialsWidgetGrid');

  readonly budgetProgressClass = budgetProgressClass;

  readonly jobCostSummary = computed(() => getJobCostSummary());
  readonly projectJobCosts = computed(() => getProjectJobCosts());
  readonly jobCostCategories = JOB_COST_CATEGORIES;

  formatJobCost(value: number): string {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }

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
    const proj = PROJECTS.find(pr => pr.id === p.projectId);
    const slug = proj?.slug ?? String(p.projectId);
    this.router.navigate(['/financials/job-costs', slug]);
  }

  private activateJobCostDetail(p: ProjectJobCost): void {
    this.jobCostDetailProject.set(p);
    this.navHistory.shellBackButton.set({ action: () => this.closeJobCostDetail() });
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
        const proj = PROJECTS.find(pr => pr.id === p.projectId);
        return { id: p.projectId, label: p.projectName, sublabel: p.budgetUsed, slug: proj?.slug ?? '' };
      }),
      onSelect: (id: number) => {
        const proj = PROJECTS.find(pr => pr.id === id);
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

  private resolveSlugToProject(slug: string): ProjectJobCost | null {
    const proj = PROJECTS.find(p => p.slug === slug);
    if (!proj) return null;
    return this.projectJobCosts().find(p => p.projectId === proj.id) ?? null;
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();

    this.route.paramMap.subscribe(params => {
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
