import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ChangeOrder } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-change-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="grid grid-cols-3 gap-2 shrink-0">
        <div class="flex flex-col items-center gap-1 rounded-lg bg-warning-20 py-2">
          <div class="text-lg font-bold text-warning tabular-nums">{{ pendingCount() }}</div>
          <div class="text-2xs text-foreground-60">Pending</div>
          <div class="text-2xs font-medium text-foreground tabular-nums">{{ fmtCurrency(pendingAmount()) }}</div>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-lg bg-success-20 py-2">
          <div class="text-lg font-bold text-success tabular-nums">{{ approvedCount() }}</div>
          <div class="text-2xs text-foreground-60">Approved</div>
          <div class="text-2xs font-medium text-foreground tabular-nums">{{ fmtCurrency(approvedAmount()) }}</div>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-lg bg-destructive-20 py-2">
          <div class="text-lg font-bold text-destructive tabular-nums">{{ rejectedCount() }}</div>
          <div class="text-2xs text-foreground-60">Rejected</div>
          <div class="text-2xs font-medium text-foreground tabular-nums">{{ fmtCurrency(rejectedAmount()) }}</div>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (co of pendingOrders(); track co.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ co.project }}</div>
              <div class="text-sm font-semibold tabular-nums" [class]="co.amount >= 0 ? 'text-foreground' : 'text-destructive'">{{ fmtCurrency(co.amount) }}</div>
            </div>
            <div class="text-xs text-foreground-60 truncate">{{ co.description }}</div>
            <div class="flex items-center gap-2 text-2xs text-foreground-40">
              <div>{{ co.requestedBy }}</div>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <div>{{ co.requestDate }}</div>
            </div>
          </div>
        }
        @if (pendingOrders().length === 0) {
          <div class="text-sm text-foreground-40 text-center py-6">No pending change orders</div>
        }
      </div>
    </div>
  `,
})
export class HomeChangeOrdersComponent {
  readonly changeOrders = input.required<ChangeOrder[]>();

  readonly pendingOrders = computed(() => this.changeOrders().filter((co) => co.status === 'pending'));
  readonly pendingCount = computed(() => this.pendingOrders().length);
  readonly pendingAmount = computed(() => this.pendingOrders().reduce((s, co) => s + co.amount, 0));
  readonly approvedCount = computed(() => this.changeOrders().filter((co) => co.status === 'approved').length);
  readonly approvedAmount = computed(() => this.changeOrders().filter((co) => co.status === 'approved').reduce((s, co) => s + co.amount, 0));
  readonly rejectedCount = computed(() => this.changeOrders().filter((co) => co.status === 'rejected').length);
  readonly rejectedAmount = computed(() => this.changeOrders().filter((co) => co.status === 'rejected').reduce((s, co) => s + co.amount, 0));

  fmtCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }
}
