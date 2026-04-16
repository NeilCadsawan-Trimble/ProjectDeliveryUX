import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ChangeOrder } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-project-change-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe],
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
        @for (co of sortedOrders(); track co.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 flex-shrink-0">
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ co.description }}</div>
              <div class="text-sm font-semibold tabular-nums" [class]="co.amount >= 0 ? 'text-foreground' : 'text-destructive'">{{ fmtCurrency(co.amount) }}</div>
            </div>
            <div class="flex items-center gap-2 text-2xs">
              <div class="rounded px-1.5 py-0.5 font-medium" [class]="statusClass(co.status)">{{ co.status | titlecase }}</div>
              <div class="text-foreground-40">{{ co.requestedBy }}</div>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <div class="text-foreground-40">{{ co.requestDate }}</div>
            </div>
          </div>
        }
        @if (sortedOrders().length === 0) {
          <div class="text-sm text-foreground-40 text-center py-6">No change orders</div>
        }
      </div>
    </div>
  `,
})
export class ProjectChangeOrdersComponent {
  readonly changeOrders = input.required<ChangeOrder[]>();

  readonly sortedOrders = computed(() =>
    [...this.changeOrders()].sort((a, b) => {
      const order: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    }),
  );

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

  statusClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning-20 text-warning';
      case 'approved': return 'bg-success-20 text-success';
      case 'rejected': return 'bg-destructive-20 text-destructive';
      default: return 'bg-muted text-foreground-60';
    }
  }
}
