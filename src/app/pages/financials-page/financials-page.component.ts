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
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type { DashboardWidgetId, Project, RevenueTimeRange, RevenueDataPoint, JobCostCategory, ProjectJobCost } from '../../data/dashboard-data';
import { PROJECTS, budgetProgressClass, getRevenueData, getRevenueSummary, getJobCostSummary, getProjectJobCosts, JOB_COST_CATEGORIES, CATEGORY_COLORS } from '../../data/dashboard-data';

@Component({
  selector: 'app-financials-page',
  imports: [ModusProgressComponent, ModusButtonComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent],
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
        <!-- Back button + project header -->
        <div class="flex items-center gap-3 mb-6">
          <div
            class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-secondary transition-colors duration-150"
            (click)="closeJobCostDetail()"
            role="button" tabindex="0"
            aria-label="Back to Financials"
          >
            <i class="modus-icons text-base text-foreground" aria-hidden="true">arrow_left</i>
          </div>
          <div class="flex flex-col">
            <div class="text-2xl font-bold text-foreground">{{ project.projectName }}</div>
            <div class="text-sm text-foreground-60">{{ project.client }}</div>
          </div>
        </div>

        <!-- Budget overview row -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
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
          <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials</div>
          <div class="text-sm text-foreground-60 mt-1">Budget overview and cost tracking</div>
        </div>
        <div class="flex-shrink-0">
          <modus-button color="primary" size="sm" icon="download" iconPosition="left">Export</modus-button>
        </div>
      </div>

      <!-- KPI cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
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
                <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Financials</div>
                <div class="text-sm text-foreground-60 mt-1">Budget overview and cost tracking</div>
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
                    <div class="flex items-center gap-1" (mousedown)="$event.stopPropagation()">
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

                  <!-- Table header -->
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
  private readonly destroyRef = inject(DestroyRef);

  private static readonly HEADER_HEIGHT = 160;
  private static readonly HEADER_OFFSET = FinancialsPageComponent.HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly REVENUE_HEIGHT = 380;
  private static readonly REVENUE_OFFSET = FinancialsPageComponent.HEADER_OFFSET + FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_HEIGHT = 520;
  private static readonly BUDGET_OFFSET_DESKTOP = FinancialsPageComponent.REVENUE_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly JOB_COSTS_OFFSET_DESKTOP = FinancialsPageComponent.BUDGET_OFFSET_DESKTOP + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;
  private static readonly BUDGET_OFFSET_CANVAS = FinancialsPageComponent.REVENUE_OFFSET + FinancialsPageComponent.BUDGET_HEIGHT + DashboardLayoutEngine.GAP_PX;

  private readonly engine = new DashboardLayoutEngine({
    widgets: ['finHeader', 'finRevenueChart', 'finBudgetByProject', 'finJobCosts'],
    layoutStorageKey: 'dashboard-financials:v3',
    canvasStorageKey: 'canvas-layout:dashboard-financials:v4',
    defaultColStarts: { finHeader: 1, finRevenueChart: 1, finBudgetByProject: 1, finJobCosts: 1 },
    defaultColSpans: { finHeader: 16, finRevenueChart: 16, finBudgetByProject: 16, finJobCosts: 16 },
    defaultTops: { finHeader: 0, finRevenueChart: 0, finBudgetByProject: FinancialsPageComponent.BUDGET_OFFSET_DESKTOP, finJobCosts: FinancialsPageComponent.JOB_COSTS_OFFSET_DESKTOP },
    defaultHeights: { finHeader: 0, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: 580 },
    defaultLefts: { finHeader: 0, finRevenueChart: 0, finBudgetByProject: 0, finJobCosts: 0 },
    defaultPixelWidths: { finHeader: 1280, finRevenueChart: 1280, finBudgetByProject: 1280, finJobCosts: 1280 },
    canvasDefaultLefts: { finHeader: 0, finRevenueChart: 0, finBudgetByProject: 0, finJobCosts: 0 },
    canvasDefaultPixelWidths: { finHeader: 1280, finRevenueChart: 1280, finBudgetByProject: 1280, finJobCosts: 1280 },
    canvasDefaultTops: {
      finHeader: 0,
      finRevenueChart: FinancialsPageComponent.HEADER_OFFSET,
      finBudgetByProject: FinancialsPageComponent.REVENUE_OFFSET,
      finJobCosts: FinancialsPageComponent.BUDGET_OFFSET_CANVAS,
    },
    canvasDefaultHeights: { finHeader: FinancialsPageComponent.HEADER_HEIGHT, finRevenueChart: FinancialsPageComponent.REVENUE_HEIGHT, finBudgetByProject: FinancialsPageComponent.BUDGET_HEIGHT, finJobCosts: 580 },
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
  readonly financialsWidgets: DashboardWidgetId[] = ['finRevenueChart', 'finBudgetByProject', 'finJobCosts'];

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
    this.jobCostDetailProject.set(p);
    window.history.pushState(
      { view: 'jobcost', projectId: p.projectId },
      '',
      `${window.location.pathname}?view=jobcost&projectId=${p.projectId}`,
    );
  }

  closeJobCostDetail(): void {
    this.jobCostDetailProject.set(null);
    window.history.replaceState({}, '', window.location.pathname);
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

  private popStateHandler: (() => void) | null = null;

  private restoreDetailFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const projectId = params.get('projectId');
    if (view === 'jobcost' && projectId) {
      const pid = parseInt(projectId, 10);
      const match = this.projectJobCosts().find(p => p.projectId === pid);
      if (match) {
        this.jobCostDetailProject.set(match);
        return;
      }
    }
    this.jobCostDetailProject.set(null);
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.financialsGridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();

    this.restoreDetailFromUrl();

    this.popStateHandler = () => this.restoreDetailFromUrl();
    window.addEventListener('popstate', this.popStateHandler);
    this.destroyRef.onDestroy(() => {
      if (this.popStateHandler) window.removeEventListener('popstate', this.popStateHandler);
    });
  }
}
