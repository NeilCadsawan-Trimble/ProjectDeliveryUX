import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ChangeOrder } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-change-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 py-4">
      <div class="grid grid-cols-3 gap-2 shrink-0 px-4">
        <div class="flex flex-col items-center gap-1 rounded-lg bg-warning-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-warning tabular-nums">{{ pendingCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Pending</modus-typography>
          <modus-typography size="xs" weight="semibold" className="text-foreground tabular-nums">{{ fmtCurrency(pendingAmount()) }}</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-lg bg-success-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success tabular-nums">{{ approvedCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Approved</modus-typography>
          <modus-typography size="xs" weight="semibold" className="text-foreground tabular-nums">{{ fmtCurrency(approvedAmount()) }}</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-1 rounded-lg bg-destructive-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-destructive tabular-nums">{{ rejectedCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Rejected</modus-typography>
          <modus-typography size="xs" weight="semibold" className="text-foreground tabular-nums">{{ fmtCurrency(rejectedAmount()) }}</modus-typography>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto px-4">
        @for (co of pendingOrders(); track co.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="orderClick.emit({ projectId: co.projectId, orderId: co.id })"
            (keydown.enter)="orderClick.emit({ projectId: co.projectId, orderId: co.id })">
            <div class="flex items-center justify-between gap-2">
              <modus-typography class="min-w-0 flex-1" hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ co.project }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="'tabular-nums ' + (co.amount >= 0 ? 'text-foreground' : 'text-destructive')">{{ fmtCurrency(co.amount) }}</modus-typography>
            </div>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ co.description }}</modus-typography>
            <div class="flex items-center gap-2">
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ co.requestedBy }}</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ co.requestDate }}</modus-typography>
            </div>
          </div>
        }
        @if (pendingOrders().length === 0) {
          <div class="text-center py-6">
            <modus-typography hierarchy="p" size="sm" className="text-foreground-40">No pending change orders</modus-typography>
          </div>
        }
      </div>
    </div>
  `,
})
export class HomeChangeOrdersComponent {
  readonly changeOrders = input.required<ChangeOrder[]>();
  readonly orderClick = output<{ projectId: number; orderId: string }>();

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
