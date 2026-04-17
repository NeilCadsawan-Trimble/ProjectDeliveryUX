import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ApPaymentScheduleItem } from '../../../data/dashboard-data.types';

interface OutflowGroup {
  key: 'this-week' | 'next-week' | 'later';
  label: string;
  items: ApPaymentScheduleItem[];
  total: number;
  pct: number;
}

@Component({
  selector: 'app-home-cash-outflow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-4 h-full min-h-0 overflow-y-auto p-4">
      @for (g of groups(); track g.key) {
        <div class="bg-background border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 px-4 pt-3 pb-4 flex flex-col gap-2 shrink-0">
          <div class="flex items-center justify-between">
            <modus-typography hierarchy="h3" size="sm" weight="semibold">{{ g.label }}</modus-typography>
            <modus-typography hierarchy="p" size="sm" weight="bold" className="text-primary tabular-nums">{{ formatCurrency(g.total) }}</modus-typography>
          </div>
          @for (p of g.items; track p.id) {
            <div class="flex flex-wrap items-center justify-between gap-2">
              <modus-typography class="min-w-0" hierarchy="p" size="xs" className="text-foreground truncate">{{ p.vendor }}</modus-typography>
              <modus-typography class="shrink-0" hierarchy="p" size="xs" className="text-foreground tabular-nums">{{ formatCurrency(p.amount) }}</modus-typography>
            </div>
          }
          @if (g.items.length === 0) {
            <modus-typography hierarchy="p" size="xs" className="text-foreground-40">No payments</modus-typography>
          }
        </div>
      }
    </div>
  `,
})
export class HomeCashOutflowComponent {
  readonly payments = input.required<ApPaymentScheduleItem[]>();

  readonly groups = computed(() => {
    const items = this.payments();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = startOfToday.getDay();
    const startSunday = new Date(startOfToday);
    startSunday.setDate(startOfToday.getDate() - dow);
    startSunday.setHours(0, 0, 0, 0);
    const endThisWeek = new Date(startSunday);
    endThisWeek.setDate(startSunday.getDate() + 6);
    endThisWeek.setHours(23, 59, 59, 999);

    const startNextWeek = new Date(endThisWeek);
    startNextWeek.setDate(endThisWeek.getDate() + 1);
    startNextWeek.setHours(0, 0, 0, 0);
    const endNextWeek = new Date(startNextWeek);
    endNextWeek.setDate(startNextWeek.getDate() + 6);
    endNextWeek.setHours(23, 59, 59, 999);

    const thisWeek: ApPaymentScheduleItem[] = [];
    const nextWeek: ApPaymentScheduleItem[] = [];
    const later: ApPaymentScheduleItem[] = [];

    for (const p of items) {
      const d = new Date(p.dueDate);
      if (d >= startSunday && d <= endThisWeek) thisWeek.push(p);
      else if (d >= startNextWeek && d <= endNextWeek) nextWeek.push(p);
      else later.push(p);
    }

    const sum = (arr: ApPaymentScheduleItem[]) => arr.reduce((s, x) => s + x.amount, 0);
    const t0 = sum(thisWeek);
    const t1 = sum(nextWeek);
    const t2 = sum(later);
    const grand = t0 + t1 + t2 || 1;

    const build = (key: OutflowGroup['key'], label: string, arr: ApPaymentScheduleItem[], total: number): OutflowGroup => ({
      key,
      label,
      items: arr,
      total,
      pct: (total / grand) * 100,
    });

    return [
      build('this-week', 'This week', thisWeek, t0),
      build('next-week', 'Next week', nextWeek, t1),
      build('later', 'Later', later, t2),
    ];
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }
}
