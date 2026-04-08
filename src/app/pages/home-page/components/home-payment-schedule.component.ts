import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ApPaymentScheduleItem } from '../../../data/dashboard-data.types';

export interface PaymentScheduleGroup {
  dueDate: string;
  items: ApPaymentScheduleItem[];
}

@Component({
  selector: 'app-home-payment-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col h-full min-h-0 overflow-y-auto">
      @for (group of groupedPayments(); track group.dueDate) {
        <div class="border-bottom-default last:border-b-0">
          <div class="sticky top-0 z-[1] bg-muted px-3 py-2 text-sm font-semibold text-foreground">
            Due {{ group.dueDate }}
          </div>
          @for (p of group.items; track p.id) {
            <div class="px-3 py-2.5 flex flex-col gap-2 border-bottom-default last:border-b-0">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium text-foreground truncate">{{ p.vendor }}</div>
                  <div class="text-xs text-foreground-60">Invoice {{ p.invoiceNumber }}</div>
                </div>
                <div class="text-sm font-semibold text-foreground tabular-nums shrink-0">
                  {{ formatCurrency(p.amount) }}
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="text-xs text-foreground-40 truncate">{{ p.project }}</div>
                @if (p.discountAvailable > 0) {
                  <div class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-2xs font-medium bg-success-20 text-success">
                    <i class="modus-icons text-2xs" aria-hidden="true">offers</i>
                    <div>2% discount by {{ p.discountDeadline }}</div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HomePaymentScheduleComponent {
  readonly payments = input.required<ApPaymentScheduleItem[]>();

  readonly groupedPayments = computed(() => {
    const list = this.payments();
    const map = new Map<string, ApPaymentScheduleItem[]>();
    for (const p of list) {
      const key = p.dueDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    const groups: PaymentScheduleGroup[] = [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dueDate, items]) => ({ dueDate, items }));
    return groups;
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
}
