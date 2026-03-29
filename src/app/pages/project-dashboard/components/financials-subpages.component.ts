import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { EmptyStateComponent } from './empty-state.component';
import {
  coBadgeColor,
  contractStatusBadge as sharedContractStatusBadge,
  contractTypeLabelShort,
  contractTypeIcon,
  formatCurrency as sharedFormatCurrency,
} from '../../../data/dashboard-data';
import type {
  ChangeOrder,
  Contract,
  ProjectRevenue,
  BudgetHistoryPoint,
  ChangeOrderStatus,
  ContractStatus,
  ContractType,
} from '../../../data/dashboard-data';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-financials-subpages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, EmptyStateComponent, TitleCasePipe],
  template: `
    @switch (activePage()) {
      @case ('change-order-requests') {
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (co of changeOrders(); track co.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="changeOrderClick.emit(co)" (keydown.enter)="changeOrderClick.emit(co)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="text-base font-semibold text-foreground">{{ co.id }}</div>
                  <modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="text-sm text-foreground line-clamp-2">{{ co.description }}</div>
                  <div class="flex items-center justify-between text-xs text-foreground-60">
                    <div class="text-sm font-medium text-foreground">{{ formatCurrency(co.amount) }}</div>
                    <div>{{ co.requestDate }}</div>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="document" title="No Change Orders" description="No change order requests found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_100px_80px_120px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>ID</div><div>Description</div><div>Amount</div><div>Status</div><div>Requested By</div><div>Date</div>
            </div>
            @for (co of changeOrders(); track co.id) {
              <div class="grid grid-cols-[80px_1fr_100px_80px_120px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="changeOrderClick.emit(co)" (keydown.enter)="changeOrderClick.emit(co)">
                <div class="text-sm font-medium text-primary">{{ co.id }}</div>
                <div class="text-sm text-foreground truncate">{{ co.description }}</div>
                <div class="text-sm font-medium text-foreground">{{ formatCurrency(co.amount) }}</div>
                <div><modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge></div>
                <div class="text-sm text-foreground-60 truncate">{{ co.requestedBy }}</div>
                <div class="text-sm text-foreground-60">{{ co.requestDate }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                <div class="text-sm">No Change Orders for this project</div>
              </div>
            }
          </div>
        }
      }
      @case ('applications-for-payment') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          @for (rev of revenueData(); track rev.projectId) {
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Contract Value</div>
              <div class="text-lg font-bold text-foreground">{{ rev.contractValue }}</div>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Invoiced</div>
              <div class="text-lg font-bold text-foreground">{{ rev.invoiced }}</div>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Collected</div>
              <div class="text-lg font-bold text-success">{{ rev.collected }}</div>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Outstanding</div>
              <div class="text-lg font-bold" [class]="rev.outstandingRaw > 0 ? 'text-warning' : 'text-foreground'">{{ rev.outstanding }}</div>
            </div>
          }
        </div>
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
            <div>Project</div><div>Contract</div><div>Invoiced</div><div>Collected</div><div>Outstanding</div><div>Retainage</div>
          </div>
          @for (rev of revenueData(); track rev.projectId) {
            <div class="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center">
              <div class="text-sm font-medium text-foreground">{{ rev.projectName }}</div>
              <div class="text-sm text-foreground">{{ rev.contractValue }}</div>
              <div class="text-sm text-foreground">{{ rev.invoiced }}</div>
              <div class="text-sm text-success">{{ rev.collected }}</div>
              <div class="text-sm" [class]="rev.outstandingRaw > 0 ? 'text-warning font-medium' : 'text-foreground-60'">{{ rev.outstanding }}</div>
              <div class="text-sm text-foreground-60">{{ rev.retainage }}</div>
            </div>
          } @empty {
            <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
              <i class="modus-icons text-3xl mb-2" aria-hidden="true">bar_graph</i>
              <div class="text-sm">No revenue data for this project</div>
            </div>
          }
        </div>
      }
      @case ('contracts') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <div class="text-xs text-foreground-60">Total Contracts</div>
            <div class="text-lg font-bold text-foreground">{{ contracts().length }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <div class="text-xs text-foreground-60">Original Value</div>
            <div class="text-lg font-bold text-foreground">{{ formatCurrency(contractOriginalTotal()) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <div class="text-xs text-foreground-60">Revised Value</div>
            <div class="text-lg font-bold text-foreground">{{ formatCurrency(contractRevisedTotal()) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <div class="text-xs text-foreground-60">CO Growth</div>
            <div class="text-lg font-bold" [class]="contractGrowth() > 0 ? 'text-warning' : 'text-success'">{{ contractGrowth() > 0 ? '+' : '' }}{{ formatCurrency(contractGrowth()) }}</div>
          </div>
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (ct of contracts(); track ct.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="contractClick.emit(ct)" (keydown.enter)="contractClick.emit(ct)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base" aria-hidden="true" [class]="ct.contractType === 'prime' ? 'text-primary' : 'text-foreground-60'">{{ contractIcon(ct.contractType) }}</i>
                    <div class="text-base font-semibold text-foreground">{{ ct.id }}</div>
                  </div>
                  <modus-badge [color]="contractStatusColor(ct.status)">{{ ct.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="text-sm text-foreground line-clamp-2">{{ ct.title }}</div>
                  <div class="text-xs text-foreground-60">{{ ct.vendor }}</div>
                  <div class="flex items-center justify-between text-xs text-foreground-60">
                    <div class="text-sm font-medium text-foreground">{{ formatCurrency(ct.revisedValue) }}</div>
                    @if (ct.revisedValue > ct.originalValue) {
                      <div class="text-warning">+{{ formatCurrency(ct.revisedValue - ct.originalValue) }}</div>
                    }
                  </div>
                  @if (ct.linkedChangeOrderIds.length > 0) {
                    <div class="flex items-center gap-1 text-xs text-primary">
                      <i class="modus-icons text-xs" aria-hidden="true">link</i>
                      {{ ct.linkedChangeOrderIds.length }} linked CO{{ ct.linkedChangeOrderIds.length > 1 ? 's' : '' }}
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="content_copy" title="No Contracts" description="No contracts found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_120px_100px_100px_80px_60px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>ID</div><div>Title / Vendor</div><div>Type</div><div>Original</div><div>Revised</div><div>Status</div><div>COs</div>
            </div>
            @for (ct of contracts(); track ct.id) {
              <div class="grid grid-cols-[80px_1fr_120px_100px_100px_80px_60px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="contractClick.emit(ct)" (keydown.enter)="contractClick.emit(ct)">
                <div class="text-sm font-medium text-primary">{{ ct.id }}</div>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <div class="text-sm text-foreground truncate">{{ ct.title }}</div>
                  <div class="text-xs text-foreground-60 truncate">{{ ct.vendor }}</div>
                </div>
                <div class="text-xs text-foreground-60">{{ contractTypeLabel(ct.contractType) }}</div>
                <div class="text-sm text-foreground-60">{{ formatCurrency(ct.originalValue) }}</div>
                <div class="text-sm font-medium text-foreground">{{ formatCurrency(ct.revisedValue) }}</div>
                <div><modus-badge [color]="contractStatusColor(ct.status)">{{ ct.status | titlecase }}</modus-badge></div>
                <div class="text-sm text-foreground-60 text-center">{{ ct.linkedChangeOrderIds.length }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">content_copy</i>
                <div class="text-sm">No Contracts for this project</div>
              </div>
            }
          </div>
        }
      }
      @case ('cost-forecasts') {
        @if (budgetHistory().length > 0) {
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Current Spend vs Plan</div>
              @if (lastBudgetPoint(); as last) {
                <div class="text-lg font-bold" [class]="(last.actual || 0) > last.planned ? 'text-destructive' : 'text-success'">
                  {{ formatCurrency(last.actual || last.forecast) }} / {{ formatCurrency(last.planned) }}
                </div>
              }
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Forecast at Completion</div>
              @if (lastBudgetPoint(); as last) {
                <div class="text-lg font-bold text-foreground">{{ formatCurrency(last.forecast) }}</div>
              }
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <div class="text-xs text-foreground-60">Months Tracked</div>
              <div class="text-lg font-bold text-foreground">{{ budgetHistory().length }}</div>
            </div>
          </div>
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>Month</div><div>Planned</div><div>Actual</div><div>Forecast</div><div>Variance</div>
            </div>
            @for (point of budgetHistory(); track point.month) {
              <div class="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center">
                <div class="text-sm font-medium text-foreground">{{ point.month }}</div>
                <div class="text-sm text-foreground-60">{{ formatCurrency(point.planned) }}</div>
                <div class="text-sm" [class]="point.actual > 0 ? 'text-foreground' : 'text-foreground-40'">{{ point.actual > 0 ? formatCurrency(point.actual) : '--' }}</div>
                <div class="text-sm text-foreground-60">{{ formatCurrency(point.forecast) }}</div>
                <div class="text-sm" [class]="point.actual > 0 ? (point.actual > point.planned ? 'text-destructive font-medium' : 'text-success') : 'text-foreground-40'">
                  {{ point.actual > 0 ? formatCurrency(point.actual - point.planned) : '--' }}
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state icon="bar_graph" title="Cost Forecasts" description="No budget history data available for this project." />
        }
      }
    }
  `,
})
export class FinancialsSubpagesComponent {
  readonly activePage = input.required<string>();
  readonly viewMode = input.required<ViewMode>();
  readonly changeOrders = input<ChangeOrder[]>([]);
  readonly contracts = input<Contract[]>([]);
  readonly revenueData = input<ProjectRevenue[]>([]);
  readonly budgetHistory = input<BudgetHistoryPoint[]>([]);

  readonly changeOrderClick = output<ChangeOrder>();
  readonly contractClick = output<Contract>();

  readonly lastBudgetPoint = input<BudgetHistoryPoint | null>(null);

  contractOriginalTotal(): number { return this.contracts().reduce((sum, c) => sum + c.originalValue, 0); }
  contractRevisedTotal(): number { return this.contracts().reduce((sum, c) => sum + c.revisedValue, 0); }
  contractGrowth(): number { return this.contractRevisedTotal() - this.contractOriginalTotal(); }

  contractStatusColor(status: ContractStatus): ModusBadgeColor { return sharedContractStatusBadge(status); }
  contractTypeLabel(ct: ContractType): string { return contractTypeLabelShort(ct); }
  contractIcon(ct: ContractType): string { return contractTypeIcon(ct); }
  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor { return coBadgeColor(status); }
  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
