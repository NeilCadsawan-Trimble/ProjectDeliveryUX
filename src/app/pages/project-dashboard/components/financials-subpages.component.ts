import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import { EmptyStateComponent } from './empty-state.component';
import {
  coBadgeColor,
  contractStatusBadge as sharedContractStatusBadge,
  contractTypeLabelShort,
  contractTypeIcon,
  formatCurrency as sharedFormatCurrency,
  ledgerTypeBadge,
  ledgerTypeLabel,
} from '../../../data/dashboard-data.formatters';
import type {
  ChangeOrder,
  Contract,
  ProjectRevenue,
  BudgetHistoryPoint,
  ChangeOrderStatus,
  ContractStatus,
  ContractType,
  Invoice,
  InvoiceStatus,
  Payable,
  PayableStatus,
  PurchaseOrder,
  PurchaseOrderStatus,
  SubcontractLedgerEntry,
  SubcontractLedgerType,
} from '../../../data/dashboard-data.types';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-financials-subpages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, ModusTypographyComponent, EmptyStateComponent, TitleCasePipe],
  template: `
    @switch (activePage()) {
      @case ('change-order-requests') {
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (co of changeOrders(); track co.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="changeOrderClick.emit(co)" (keydown.enter)="changeOrderClick.emit(co)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ co.id }}</modus-typography>
                  <modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <modus-typography size="sm" className="text-foreground line-clamp-2">{{ co.description }}</modus-typography>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(co.amount) }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">{{ co.requestDate }}</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="document" title="No Change Orders" description="No change order requests found for this project." />
            }
          </div>
        } @else if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (co of changeOrders(); track co.id) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2 cursor-pointer active:bg-muted transition-colors" tabindex="0" (click)="changeOrderClick.emit(co)" (keydown.enter)="changeOrderClick.emit(co)">
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-primary">{{ co.id }}</modus-typography>
                  <modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge>
                </div>
                <modus-typography size="sm" className="text-foreground truncate">{{ co.description }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(co.amount) }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ co.requestDate }}</modus-typography>
                </div>
              </div>
            } @empty {
              <app-empty-state icon="document" title="No Change Orders" description="No change order requests found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[80px_1fr_100px_80px_120px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">ID</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Description</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Amount</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Requested By</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Date</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (co of changeOrders(); track co.id) {
              <div class="grid grid-cols-[80px_1fr_100px_80px_120px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="changeOrderClick.emit(co)" (keydown.enter)="changeOrderClick.emit(co)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ co.id }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ co.description }}</modus-typography>
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(co.amount) }}</modus-typography>
                <div><modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ co.requestedBy }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ co.requestDate }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">document</i>
                <modus-typography size="sm" className="text-foreground-40">No Change Orders for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
      @case ('billings') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          @for (rev of revenueData(); track rev.projectId) {
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Contract Value</modus-typography>
              <modus-typography size="lg" weight="bold" className="text-foreground">{{ rev.contractValue }}</modus-typography>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Invoiced</modus-typography>
              <modus-typography size="lg" weight="bold" className="text-foreground">{{ rev.invoiced }}</modus-typography>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Collected</modus-typography>
              <modus-typography size="lg" weight="bold" className="text-success">{{ rev.collected }}</modus-typography>
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Outstanding</modus-typography>
              <modus-typography size="lg" weight="bold" [className]="rev.outstandingRaw > 0 ? 'text-warning' : 'text-foreground'">{{ rev.outstanding }}</modus-typography>
            </div>
          }
        </div>
        @if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (rev of revenueData(); track rev.projectId) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2">
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ rev.projectName }}</modus-typography>
                <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div class="flex items-center justify-between">
                    <modus-typography size="xs" className="text-foreground-60">Contract</modus-typography>
                    <modus-typography size="sm" className="text-foreground">{{ rev.contractValue }}</modus-typography>
                  </div>
                  <div class="flex items-center justify-between">
                    <modus-typography size="xs" className="text-foreground-60">Invoiced</modus-typography>
                    <modus-typography size="sm" className="text-foreground">{{ rev.invoiced }}</modus-typography>
                  </div>
                  <div class="flex items-center justify-between">
                    <modus-typography size="xs" className="text-foreground-60">Collected</modus-typography>
                    <modus-typography size="sm" className="text-success">{{ rev.collected }}</modus-typography>
                  </div>
                  <div class="flex items-center justify-between">
                    <modus-typography size="xs" className="text-foreground-60">Outstanding</modus-typography>
                    <modus-typography size="sm" [weight]="rev.outstandingRaw > 0 ? 'semibold' : 'normal'" [className]="rev.outstandingRaw > 0 ? 'text-warning' : 'text-foreground-60'">{{ rev.outstanding }}</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state icon="bar_graph" title="No Revenue" description="No revenue data for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Project</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Contract</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Invoiced</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Collected</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Outstanding</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Retainage</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (rev of revenueData(); track rev.projectId) {
              <div class="grid grid-cols-[1fr_100px_100px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center">
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ rev.projectName }}</modus-typography>
                <modus-typography size="sm" className="text-foreground">{{ rev.contractValue }}</modus-typography>
                <modus-typography size="sm" className="text-foreground">{{ rev.invoiced }}</modus-typography>
                <modus-typography size="sm" className="text-success">{{ rev.collected }}</modus-typography>
                <modus-typography size="sm" [weight]="rev.outstandingRaw > 0 ? 'semibold' : 'normal'" [className]="rev.outstandingRaw > 0 ? 'text-warning' : 'text-foreground-60'">{{ rev.outstanding }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ rev.retainage }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">bar_graph</i>
                <modus-typography size="sm" className="text-foreground-40">No revenue data for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
      @case ('contracts') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Contracts</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ contracts().length }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Original Value</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(contractOriginalTotal()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Revised Value</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(contractRevisedTotal()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">CO Growth</modus-typography>
            <modus-typography size="lg" weight="bold" [className]="contractGrowth() > 0 ? 'text-warning' : 'text-success'">{{ contractGrowth() > 0 ? '+' : '' }}{{ formatCurrency(contractGrowth()) }}</modus-typography>
          </div>
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (ct of contracts(); track ct.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="contractClick.emit(ct)" (keydown.enter)="contractClick.emit(ct)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-base" aria-hidden="true" [class]="ct.contractType === 'prime' ? 'text-primary' : 'text-foreground-60'">{{ contractIcon(ct.contractType) }}</i>
                    <modus-typography size="md" weight="semibold" className="text-foreground">{{ ct.id }}</modus-typography>
                  </div>
                  <modus-badge [color]="contractStatusColor(ct.status)">{{ ct.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <modus-typography size="sm" className="text-foreground line-clamp-2">{{ ct.title }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ ct.vendor }}</modus-typography>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(ct.revisedValue) }}</modus-typography>
                    @if (ct.revisedValue > ct.originalValue) {
                      <modus-typography size="xs" className="text-warning">+{{ formatCurrency(ct.revisedValue - ct.originalValue) }}</modus-typography>
                    }
                  </div>
                  @if (ct.linkedChangeOrderIds.length > 0) {
                    <div class="flex items-center gap-1 text-primary">
                      <i class="modus-icons text-xs" aria-hidden="true">link</i>
                      <modus-typography size="xs" className="text-primary">{{ ct.linkedChangeOrderIds.length }} linked CO{{ ct.linkedChangeOrderIds.length > 1 ? 's' : '' }}</modus-typography>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="copy_content" title="No Contracts" description="No contracts found for this project." />
            }
          </div>
        } @else if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (ct of contracts(); track ct.id) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2 cursor-pointer active:bg-muted transition-colors" tabindex="0" (click)="contractClick.emit(ct)" (keydown.enter)="contractClick.emit(ct)">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-sm" aria-hidden="true" [class]="ct.contractType === 'prime' ? 'text-primary' : 'text-foreground-60'">{{ contractIcon(ct.contractType) }}</i>
                    <modus-typography size="sm" weight="semibold" className="text-primary">{{ ct.id }}</modus-typography>
                  </div>
                  <modus-badge [color]="contractStatusColor(ct.status)">{{ ct.status | titlecase }}</modus-badge>
                </div>
                <modus-typography size="sm" className="text-foreground truncate">{{ ct.title }}</modus-typography>
                <modus-typography size="xs" className="text-foreground-60">{{ ct.vendor }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(ct.revisedValue) }}</modus-typography>
                  @if (ct.linkedChangeOrderIds.length > 0) {
                    <div class="flex items-center gap-1 text-primary">
                      <i class="modus-icons text-xs" aria-hidden="true">link</i>
                      <modus-typography size="xs" className="text-primary">{{ ct.linkedChangeOrderIds.length }} CO{{ ct.linkedChangeOrderIds.length > 1 ? 's' : '' }}</modus-typography>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state icon="copy_content" title="No Contracts" description="No contracts found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[80px_1fr_120px_100px_100px_80px_60px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">ID</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Title / Vendor</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Type</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Original</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Revised</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">COs</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (ct of contracts(); track ct.id) {
              <div class="grid grid-cols-[80px_1fr_120px_100px_100px_80px_60px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="contractClick.emit(ct)" (keydown.enter)="contractClick.emit(ct)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ ct.id }}</modus-typography>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <modus-typography size="sm" className="text-foreground truncate">{{ ct.title }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60 truncate">{{ ct.vendor }}</modus-typography>
                </div>
                <modus-typography size="xs" className="text-foreground-60">{{ contractTypeLabel(ct.contractType) }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(ct.originalValue) }}</modus-typography>
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(ct.revisedValue) }}</modus-typography>
                <div><modus-badge [color]="contractStatusColor(ct.status)">{{ ct.status | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60 text-center">{{ ct.linkedChangeOrderIds.length }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">copy_content</i>
                <modus-typography size="sm" className="text-foreground-40">No Contracts for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
      @case ('cost-forecasts') {
        @if (budgetHistory().length > 0) {
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Current Spend vs Plan</modus-typography>
              @if (lastBudgetPoint(); as last) {
                <modus-typography size="lg" weight="bold" [className]="(last.actual || 0) > last.planned ? 'text-destructive' : 'text-success'">
                  {{ formatCurrency(last.actual || last.forecast) }} / {{ formatCurrency(last.planned) }}
                </modus-typography>
              }
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Forecast at Completion</modus-typography>
              @if (lastBudgetPoint(); as last) {
                <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(last.forecast) }}</modus-typography>
              }
            </div>
            <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
              <modus-typography size="xs" className="text-foreground-60">Months Tracked</modus-typography>
              <modus-typography size="lg" weight="bold" className="text-foreground">{{ budgetHistory().length }}</modus-typography>
            </div>
          </div>
          @if (isMobile()) {
            <div class="flex flex-col gap-2">
              @for (point of budgetHistory(); track point.month) {
                <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ point.month }}</modus-typography>
                  <div class="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">Planned</modus-typography>
                      <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(point.planned) }}</modus-typography>
                    </div>
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">Actual</modus-typography>
                      <modus-typography size="sm" [className]="point.actual > 0 ? 'text-foreground' : 'text-foreground-40'">{{ point.actual > 0 ? formatCurrency(point.actual) : '--' }}</modus-typography>
                    </div>
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">Forecast</modus-typography>
                      <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(point.forecast) }}</modus-typography>
                    </div>
                    <div class="flex items-center justify-between">
                      <modus-typography size="xs" className="text-foreground-60">Variance</modus-typography>
                      <modus-typography size="sm" [weight]="point.actual > 0 && point.actual > point.planned ? 'semibold' : 'normal'" [className]="point.actual > 0 ? (point.actual > point.planned ? 'text-destructive' : 'text-success') : 'text-foreground-40'">
                        {{ point.actual > 0 ? formatCurrency(point.actual - point.planned) : '--' }}
                      </modus-typography>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
              <div class="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
                <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Month</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Planned</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Actual</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Forecast</modus-typography>
                <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Variance</modus-typography>
              </div>
              <div class="overflow-y-auto flex-1">
              @for (point of budgetHistory(); track point.month) {
                <div class="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ point.month }}</modus-typography>
                  <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(point.planned) }}</modus-typography>
                  <modus-typography size="sm" [className]="point.actual > 0 ? 'text-foreground' : 'text-foreground-40'">{{ point.actual > 0 ? formatCurrency(point.actual) : '--' }}</modus-typography>
                  <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(point.forecast) }}</modus-typography>
                  <modus-typography size="sm" [weight]="point.actual > 0 && point.actual > point.planned ? 'semibold' : 'normal'" [className]="point.actual > 0 ? (point.actual > point.planned ? 'text-destructive' : 'text-success') : 'text-foreground-40'">
                    {{ point.actual > 0 ? formatCurrency(point.actual - point.planned) : '--' }}
                  </modus-typography>
                </div>
              }
              </div>
            </div>
          }
        } @else {
          <app-empty-state icon="bar_graph" title="Cost Forecasts" description="No budget history data available for this project." />
        }
      }
      @case ('purchase-orders') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total POs</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ purchaseOrders().length }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Value</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(poTotalValue()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Open / Issued</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-primary">{{ poOpenCount() }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Received</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-success">{{ formatCurrency(poReceivedValue()) }}</modus-typography>
          </div>
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (po of purchaseOrders(); track po.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0"
                (click)="purchaseOrderClick.emit(po)" (keydown.enter)="purchaseOrderClick.emit(po)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ po.poNumber }}</modus-typography>
                  <modus-badge [color]="poStatusBadge(po.status)">{{ po.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <modus-typography size="sm" className="text-foreground line-clamp-2">{{ po.description }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ po.vendor }}</modus-typography>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(po.amount) }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">{{ po.issueDate }}</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="shopping_cart" title="No Purchase Orders" description="No purchase orders found for this project." />
            }
          </div>
        } @else if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (po of purchaseOrders(); track po.id) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2 cursor-pointer" tabindex="0"
                (click)="purchaseOrderClick.emit(po)" (keydown.enter)="purchaseOrderClick.emit(po)">
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-primary">{{ po.poNumber }}</modus-typography>
                  <modus-badge [color]="poStatusBadge(po.status)">{{ po.status | titlecase }}</modus-badge>
                </div>
                <modus-typography size="sm" className="text-foreground truncate">{{ po.description }}</modus-typography>
                <modus-typography size="xs" className="text-foreground-60">{{ po.vendor }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(po.amount) }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ po.issueDate }}</modus-typography>
                </div>
              </div>
            } @empty {
              <app-empty-state icon="shopping_cart" title="No Purchase Orders" description="No purchase orders found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[90px_1fr_120px_90px_90px_80px_90px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">PO #</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Description</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Vendor</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Amount</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Received</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Date</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (po of purchaseOrders(); track po.id) {
              <div class="grid grid-cols-[90px_1fr_120px_90px_90px_80px_90px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" tabindex="0"
                (click)="purchaseOrderClick.emit(po)" (keydown.enter)="purchaseOrderClick.emit(po)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ po.poNumber }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ po.description }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ po.vendor }}</modus-typography>
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(po.amount) }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ formatCurrency(po.amountReceived) }}</modus-typography>
                <div><modus-badge [color]="poStatusBadge(po.status)">{{ po.status | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60">{{ po.issueDate }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">shopping_cart</i>
                <modus-typography size="sm" className="text-foreground-40">No Purchase Orders for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
      @case ('contract-invoices') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Invoices</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ invoices().length }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Invoiced</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(invTotalAmount()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Collected</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-success">{{ formatCurrency(invPaidAmount()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Outstanding</modus-typography>
            <modus-typography size="lg" weight="bold" [className]="invOutstanding() > 0 ? 'text-warning' : 'text-foreground'">{{ formatCurrency(invOutstanding()) }}</modus-typography>
          </div>
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (inv of invoices(); track inv.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0"
                (click)="invoiceClick.emit(inv)" (keydown.enter)="invoiceClick.emit(inv)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ inv.invoiceNumber }}</modus-typography>
                  <modus-badge [color]="invStatusBadge(inv.status)">{{ inv.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(inv.amount) }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">{{ inv.terms }}</modus-typography>
                  </div>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="xs" className="text-foreground-60">Issued: {{ inv.issueDate }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">Due: {{ inv.dueDate }}</modus-typography>
                  </div>
                  @if (inv.retainageHeld > 0) {
                    <modus-typography size="xs" className="text-foreground-60">Retainage: {{ formatCurrency(inv.retainageHeld) }}</modus-typography>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="invoice" title="No Invoices" description="No contract invoices found for this project." />
            }
          </div>
        } @else if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (inv of invoices(); track inv.id) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2 cursor-pointer" tabindex="0"
                (click)="invoiceClick.emit(inv)" (keydown.enter)="invoiceClick.emit(inv)">
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-primary">{{ inv.invoiceNumber }}</modus-typography>
                  <modus-badge [color]="invStatusBadge(inv.status)">{{ inv.status | titlecase }}</modus-badge>
                </div>
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(inv.amount) }}</modus-typography>
                  <modus-typography size="sm" className="text-success">Paid {{ formatCurrency(inv.amountPaid) }}</modus-typography>
                </div>
                <div class="flex items-center justify-between text-foreground-60">
                  <modus-typography size="xs" className="text-foreground-60">{{ inv.issueDate }} - {{ inv.dueDate }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ inv.terms }}</modus-typography>
                </div>
              </div>
            } @empty {
              <app-empty-state icon="invoice" title="No Invoices" description="No contract invoices found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[90px_90px_90px_80px_90px_90px_80px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Invoice #</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Amount</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Paid</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Issued</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Due</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Terms</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (inv of invoices(); track inv.id) {
              <div class="grid grid-cols-[90px_90px_90px_80px_90px_90px_80px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" tabindex="0"
                (click)="invoiceClick.emit(inv)" (keydown.enter)="invoiceClick.emit(inv)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ inv.invoiceNumber }}</modus-typography>
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(inv.amount) }}</modus-typography>
                <modus-typography size="sm" className="text-success">{{ formatCurrency(inv.amountPaid) }}</modus-typography>
                <div><modus-badge [color]="invStatusBadge(inv.status)">{{ inv.status | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60">{{ inv.issueDate }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ inv.dueDate }}</modus-typography>
                <modus-typography size="xs" className="text-foreground-60">{{ inv.terms }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">invoice</i>
                <modus-typography size="sm" className="text-foreground-40">No Contract Invoices for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
      @case ('general-invoices') {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Payables</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ payables().length }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Total Owed</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(payTotalAmount()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Paid</modus-typography>
            <modus-typography size="lg" weight="bold" className="text-success">{{ formatCurrency(payPaidAmount()) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg p-4 flex flex-col gap-1">
            <modus-typography size="xs" className="text-foreground-60">Outstanding</modus-typography>
            <modus-typography size="lg" weight="bold" [className]="payOutstanding() > 0 ? 'text-warning' : 'text-foreground'">{{ formatCurrency(payOutstanding()) }}</modus-typography>
          </div>
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (p of payables(); track p.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0"
                (click)="payableClick.emit(p)" (keydown.enter)="payableClick.emit(p)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ p.invoiceNumber }}</modus-typography>
                  <modus-badge [color]="payStatusBadge(p.status)">{{ p.status | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <modus-typography size="sm" className="text-foreground line-clamp-2">{{ p.description }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">{{ p.vendor }}</modus-typography>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(p.amount) }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">Due: {{ p.dueDate }}</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="invoice" title="No Payables" description="No vendor invoices found for this project." />
            }
          </div>
        } @else if (isMobile()) {
          <div class="flex flex-col gap-2">
            @for (p of payables(); track p.id) {
              <div class="bg-card border-default rounded-lg px-4 py-3 flex flex-col gap-2 cursor-pointer" tabindex="0"
                (click)="payableClick.emit(p)" (keydown.enter)="payableClick.emit(p)">
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-primary">{{ p.invoiceNumber }}</modus-typography>
                  <modus-badge [color]="payStatusBadge(p.status)">{{ p.status | titlecase }}</modus-badge>
                </div>
                <modus-typography size="sm" className="text-foreground truncate">{{ p.description }}</modus-typography>
                <modus-typography size="xs" className="text-foreground-60">{{ p.vendor }}</modus-typography>
                <div class="flex items-center justify-between">
                  <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(p.amount) }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-60">Due {{ p.dueDate }}</modus-typography>
                </div>
              </div>
            } @empty {
              <app-empty-state icon="invoice" title="No Payables" description="No vendor invoices found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden flex flex-col" [style.max-height]="listMaxHeight()">
            <div class="grid grid-cols-[90px_1fr_120px_90px_90px_80px_90px] gap-3 px-5 py-3 bg-muted border-bottom-default flex-shrink-0">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Invoice #</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Description</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Vendor</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Amount</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Paid</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Due</modus-typography>
            </div>
            <div class="overflow-y-auto flex-1">
            @for (p of payables(); track p.id) {
              <div class="grid grid-cols-[90px_1fr_120px_90px_90px_80px_90px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer" tabindex="0"
                (click)="payableClick.emit(p)" (keydown.enter)="payableClick.emit(p)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ p.invoiceNumber }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ p.description }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ p.vendor }}</modus-typography>
                <modus-typography size="sm" weight="semibold" className="text-foreground">{{ formatCurrency(p.amount) }}</modus-typography>
                <modus-typography size="sm" className="text-success">{{ formatCurrency(p.amountPaid) }}</modus-typography>
                <div><modus-badge [color]="payStatusBadge(p.status)">{{ p.status | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60">{{ p.dueDate }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">invoice</i>
                <modus-typography size="sm" className="text-foreground-40">No Vendor Invoices for this project</modus-typography>
              </div>
            }
            </div>
          </div>
        }
      }
    }
  `,
})
export class FinancialsSubpagesComponent {
  readonly activePage = input.required<string>();
  readonly viewMode = input.required<ViewMode>();
  readonly isMobile = input<boolean>(false);
  readonly listMaxHeight = input<string>('none');
  readonly changeOrders = input<ChangeOrder[]>([]);
  readonly contracts = input<Contract[]>([]);
  readonly revenueData = input<ProjectRevenue[]>([]);
  readonly budgetHistory = input<BudgetHistoryPoint[]>([]);
  readonly purchaseOrders = input<PurchaseOrder[]>([]);
  readonly invoices = input<Invoice[]>([]);
  readonly payables = input<Payable[]>([]);
  readonly subcontractLedger = input<SubcontractLedgerEntry[]>([]);

  readonly changeOrderClick = output<ChangeOrder>();
  readonly contractClick = output<Contract>();
  readonly purchaseOrderClick = output<PurchaseOrder>();
  readonly invoiceClick = output<Invoice>();
  readonly payableClick = output<Payable>();

  readonly lastBudgetPoint = input<BudgetHistoryPoint | null>(null);

  contractOriginalTotal(): number { return this.contracts().reduce((sum, c) => sum + c.originalValue, 0); }
  contractRevisedTotal(): number { return this.contracts().reduce((sum, c) => sum + c.revisedValue, 0); }
  contractGrowth(): number { return this.contractRevisedTotal() - this.contractOriginalTotal(); }

  readonly poTotalValue = computed(() => this.purchaseOrders().reduce((s, po) => s + po.amount, 0));
  readonly poReceivedValue = computed(() => this.purchaseOrders().reduce((s, po) => s + po.amountReceived, 0));
  readonly poOpenCount = computed(() => this.purchaseOrders().filter(po => po.status === 'issued' || po.status === 'acknowledged' || po.status === 'draft').length);

  readonly invTotalAmount = computed(() => this.invoices().reduce((s, inv) => s + inv.amount, 0));
  readonly invPaidAmount = computed(() => this.invoices().reduce((s, inv) => s + inv.amountPaid, 0));
  readonly invOutstanding = computed(() => this.invTotalAmount() - this.invPaidAmount());

  readonly payTotalAmount = computed(() => this.payables().reduce((s, p) => s + p.amount, 0));
  readonly payPaidAmount = computed(() => this.payables().reduce((s, p) => s + p.amountPaid, 0));
  readonly payOutstanding = computed(() => this.payTotalAmount() - this.payPaidAmount());

  contractStatusColor(status: ContractStatus): ModusBadgeColor { return sharedContractStatusBadge(status); }
  contractTypeLabel(ct: ContractType): string { return contractTypeLabelShort(ct); }
  contractIcon(ct: ContractType): string { return contractTypeIcon(ct); }
  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor { return coBadgeColor(status); }
  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  poStatusBadge(status: PurchaseOrderStatus): ModusBadgeColor {
    const map: Record<PurchaseOrderStatus, ModusBadgeColor> = {
      'draft': 'secondary', 'issued': 'primary', 'acknowledged': 'primary',
      'partially-received': 'warning', 'received': 'success', 'closed': 'secondary', 'cancelled': 'danger',
    };
    return map[status] ?? 'secondary';
  }

  invStatusBadge(status: InvoiceStatus): ModusBadgeColor {
    const map: Record<InvoiceStatus, ModusBadgeColor> = {
      'draft': 'secondary', 'sent': 'primary', 'paid': 'success',
      'overdue': 'danger', 'partially-paid': 'warning', 'void': 'secondary',
    };
    return map[status] ?? 'secondary';
  }

  payStatusBadge(status: PayableStatus): ModusBadgeColor {
    const map: Record<PayableStatus, ModusBadgeColor> = {
      'pending': 'secondary', 'approved': 'primary', 'paid': 'success',
      'overdue': 'danger', 'disputed': 'warning',
    };
    return map[status] ?? 'secondary';
  }
}
