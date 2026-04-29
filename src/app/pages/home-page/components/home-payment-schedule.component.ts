import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ApPaymentScheduleItem } from '../../../data/dashboard-data.types';
import { formatUsd } from '../../../shared/utils/format';

export interface PaymentScheduleGroup {
  dueDate: string;
  items: ApPaymentScheduleItem[];
}

@Component({
  selector: 'app-home-payment-schedule',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col h-full min-h-0 overflow-y-auto mb-5">
      @for (group of groupedPayments(); track group.dueDate) {
        <div class="border-bottom-default last:border-b-0">
          <div class="sticky top-0 z-[1] bg-muted px-3 py-2">
            <modus-typography hierarchy="h3" size="sm" weight="semibold">Due {{ group.dueDate }}</modus-typography>
          </div>
          @for (p of group.items; track p.id) {
            <div class="px-3 py-2.5 flex flex-col gap-2 border-bottom-default last:border-b-0">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ p.vendor }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Invoice {{ p.invoiceNumber }}</modus-typography>
                </div>
                <div class="shrink-0">
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground tabular-nums">
                    {{ formatCurrency(p.amount) }}
                  </modus-typography>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ p.project }}</modus-typography>
                @if (p.discountAvailable > 0) {
                  <div class="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-success-20 text-success">
                    <i class="modus-icons text-2xs" aria-hidden="true">offers</i>
                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-success">2% discount by {{ p.discountDeadline }}</modus-typography>
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
    return formatUsd(amount);
  }
}
