import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { CashFlowEntry } from '../../data/dashboard-data.types';
import { formatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

interface BreakdownItem {
  category: string;
  type: 'Inflow' | 'Outflow';
  amount: number;
}

const INFLOW_CATEGORIES = ['Progress Billings', 'Retainage Releases', 'Other Income'];
const OUTFLOW_CATEGORIES = ['Subcontractor Payments', 'Material Purchases', 'Payroll', 'Equipment Rental', 'Overhead'];

function buildBreakdown(entry: CashFlowEntry): BreakdownItem[] {
  let seed = 0;
  for (let i = 0; i < entry.month.length; i++) seed += entry.month.charCodeAt(i);

  const items: BreakdownItem[] = [];

  let inflowRemaining = entry.inflows;
  for (let i = 0; i < INFLOW_CATEGORIES.length; i++) {
    if (i < INFLOW_CATEGORIES.length - 1) {
      const fraction = 0.25 + ((seed + i * 13) % 30) / 100;
      const amount = Math.round(inflowRemaining * fraction);
      items.push({ category: INFLOW_CATEGORIES[i], type: 'Inflow', amount });
      inflowRemaining -= amount;
    } else {
      items.push({ category: INFLOW_CATEGORIES[i], type: 'Inflow', amount: inflowRemaining });
    }
  }

  const outflowCount = 3 + (seed % 3);
  let outflowRemaining = entry.outflows;
  for (let i = 0; i < outflowCount; i++) {
    const cat = OUTFLOW_CATEGORIES[(seed + i) % OUTFLOW_CATEGORIES.length];
    if (i < outflowCount - 1) {
      const fraction = 0.2 + ((seed + i * 17) % 25) / 100;
      const amount = Math.round(outflowRemaining * fraction);
      items.push({ category: cat, type: 'Outflow', amount });
      outflowRemaining -= amount;
    } else {
      items.push({ category: cat, type: 'Outflow', amount: outflowRemaining });
    }
  }

  return items;
}

@Component({
  selector: 'app-cash-flow-detail-page',
  imports: [DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!entry()"
      [backLabel]="backLabel"
      emptyIcon="gantt_chart"
      emptyTitle="Cash Flow Entry Not Found"
      emptyMessage="The requested month could not be found."
      (back)="goBack()"
    >
      @if (entry(); as cf) {
        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-4 px-6 py-5">
            <div class="w-11 h-11 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-xl text-success" aria-hidden="true">gantt_chart</i>
            </div>
            <div>
              <div class="text-xl font-semibold text-foreground">{{ cf.month }}</div>
              <div class="text-sm text-foreground-60">Cash Flow Summary</div>
            </div>
          </div>
        </div>

        <!-- KPI grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Inflows</div>
            <div class="text-xl font-bold text-success">{{ fmt(cf.inflows) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Outflows</div>
            <div class="text-xl font-bold text-destructive">{{ fmt(cf.outflows) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Net Cash</div>
            <div class="text-xl font-bold" [class]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">
              {{ fmt(cf.netCash) }}
            </div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Running Balance</div>
            <div class="text-xl font-bold text-foreground">{{ fmt(cf.runningBalance) }}</div>
          </div>
        </div>

        <!-- Cash Flow Breakdown -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Cash Flow Breakdown</div>
            <div class="text-xs text-foreground-40">{{ breakdown().length }} items</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[500px]">
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Category</div>
                <div>Type</div>
                <div class="text-right">Amount</div>
              </div>
              @for (item of breakdown(); track item.category + item.type) {
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                  <div class="text-sm text-foreground">{{ item.category }}</div>
                  <div>
                    <div class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      [class]="item.type === 'Inflow' ? 'bg-success-20 text-success' : 'bg-destructive-20 text-destructive'">
                      {{ item.type }}
                    </div>
                  </div>
                  <div class="text-sm font-medium text-right" [class]="item.type === 'Inflow' ? 'text-success' : 'text-destructive'">
                    {{ fmt(item.amount) }}
                  </div>
                </div>
              }
              <div class="px-6 py-4 bg-muted border-top-default flex flex-col gap-2">
                <div class="flex justify-between text-sm">
                  <div class="font-medium text-foreground-60">Total Inflows</div>
                  <div class="font-semibold text-success">{{ fmt(cf.inflows) }}</div>
                </div>
                <div class="flex justify-between text-sm">
                  <div class="font-medium text-foreground-60">Total Outflows</div>
                  <div class="font-semibold text-destructive">{{ fmt(cf.outflows) }}</div>
                </div>
                <div class="flex justify-between text-base border-top-default pt-2 mt-1">
                  <div class="font-semibold text-foreground">Net Cash</div>
                  <div class="font-bold" [class]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">
                    {{ fmt(cf.netCash) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </app-detail-page-layout>
  `,
})
export class CashFlowDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly monthParam = routeParamSignal('month');

  readonly entry = computed<CashFlowEntry | null>(() => {
    const month = this.monthParam();
    if (!month) return null;
    const decoded = decodeURIComponent(month);
    return this.store.cashFlowHistory().find(cf => cf.month === decoded) ?? null;
  });

  readonly breakdown = computed<BreakdownItem[]>(() => {
    const e = this.entry();
    return e ? buildBreakdown(e) : [];
  });

  fmt(value: number): string { return formatCurrency(value); }
}
