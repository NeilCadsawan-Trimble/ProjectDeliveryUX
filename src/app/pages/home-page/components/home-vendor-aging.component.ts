import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ApVendor, ApVendorType } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-vendor-aging',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-3 h-full min-h-0 overflow-y-auto p-4">
      <div class="text-sm font-semibold text-foreground">Aging summary</div>
      <div class="grid grid-cols-5 gap-1 text-center text-2xs text-foreground-60 mb-1">
        <div>Current</div>
        <div>1-30</div>
        <div>31-60</div>
        <div>61-90</div>
        <div>90+</div>
      </div>
      <div class="flex h-3 w-full rounded overflow-hidden border-default">
        @for (seg of summarySegments(); track seg.key) {
          <div
            class="h-full min-w-0"
            [class]="seg.bgClass"
            [style.width.%]="seg.pct"
            [attr.aria-label]="seg.label + ' ' + formatCurrency(seg.amount)"
          ></div>
        }
      </div>
      <div class="grid grid-cols-5 gap-1 text-2xs tabular-nums text-foreground">
        @for (seg of summarySegments(); track seg.key) {
          <div class="text-center truncate">{{ formatCurrency(seg.amount) }}</div>
        }
      </div>

      <div class="border-bottom-default my-1"></div>

      @for (v of vendors(); track v.id) {
        <div class="flex flex-col gap-2 py-2 border-bottom-default last:border-b-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-sm font-medium text-foreground truncate min-w-0">{{ v.name }}</div>
            <div class="rounded px-2 py-0.5 text-2xs font-medium bg-primary-20 text-primary shrink-0">
              {{ vendorTypeLabel(v.vendorType) }}
            </div>
          </div>
          <div class="grid grid-cols-5 gap-1 text-2xs">
            <div class="text-center rounded py-1 bg-success-20 text-foreground tabular-nums">{{ formatCurrency(v.current) }}</div>
            <div class="text-center rounded py-1 bg-primary-20 text-foreground tabular-nums">{{ formatCurrency(v.aging30) }}</div>
            <div class="text-center rounded py-1 bg-warning-20 text-foreground tabular-nums">{{ formatCurrency(v.aging60) }}</div>
            <div class="text-center rounded py-1 bg-warning-20 text-foreground tabular-nums">{{ formatCurrency(v.aging90) }}</div>
            <div class="text-center rounded py-1 bg-destructive-20 text-foreground tabular-nums">{{ formatCurrency(v.aging90plus) }}</div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeVendorAgingComponent {
  readonly vendors = input.required<ApVendor[]>();

  readonly summaryTotals = computed(() => {
    const vs = this.vendors();
    return {
      current: vs.reduce((s, v) => s + v.current, 0),
      d30: vs.reduce((s, v) => s + v.aging30, 0),
      d60: vs.reduce((s, v) => s + v.aging60, 0),
      d90: vs.reduce((s, v) => s + v.aging90, 0),
      d90p: vs.reduce((s, v) => s + v.aging90plus, 0),
    };
  });

  readonly summarySegments = computed(() => {
    const t = this.summaryTotals();
    const amounts = [
      { key: 'current', label: 'Current', amount: t.current, bgClass: 'bg-success-20' },
      { key: '30', label: '1-30', amount: t.d30, bgClass: 'bg-primary-20' },
      { key: '60', label: '31-60', amount: t.d60, bgClass: 'bg-warning-20' },
      { key: '90', label: '61-90', amount: t.d90, bgClass: 'bg-warning-20' },
      { key: '90p', label: '90+', amount: t.d90p, bgClass: 'bg-destructive-20' },
    ];
    const total = amounts.reduce((s, a) => s + a.amount, 0) || 1;
    return amounts.map((a) => ({ ...a, pct: (a.amount / total) * 100 }));
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  }

  vendorTypeLabel(t: ApVendorType): string {
    switch (t) {
      case 'subcontractor':
        return 'Sub';
      case 'supplier':
        return 'Supplier';
      case 'consultant':
        return 'Consultant';
      case 'equipment-rental':
        return 'Equipment';
      default:
        return t;
    }
  }
}
