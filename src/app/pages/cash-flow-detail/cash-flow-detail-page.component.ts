import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
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
  imports: [ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
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
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center gap-4 px-6 py-5">
              <div class="w-11 h-11 rounded-lg bg-success-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-success" aria-hidden="true">gantt_chart</i>
              </div>
              <div>
                <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ cf.month }}</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Cash Flow Summary</modus-typography>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- KPI grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Inflows</div>
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success">{{ fmt(cf.inflows) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Outflows</div>
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-destructive">{{ fmt(cf.outflows) }}</modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Net Cash</div>
            <modus-typography hierarchy="h2" size="lg" weight="bold" [className]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">
              {{ fmt(cf.netCash) }}
            </modus-typography>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="detail-field-label">Running Balance</div>
            <modus-typography hierarchy="h2" size="lg" weight="bold">{{ fmt(cf.runningBalance) }}</modus-typography>
          </div>
        </div>

        <!-- Cash Flow Breakdown -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Cash Flow Breakdown</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ breakdown().length }} items</modus-typography>
            </div>

            <div class="overflow-x-auto">
              <div class="min-w-[500px]">
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Category</modus-typography>
                  <modus-typography size="xs" weight="semibold">Type</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
                </div>
                @for (item of breakdown(); track item.category + item.type) {
                  <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)_minmax(0,1.5fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                    <modus-typography hierarchy="p" size="sm">{{ item.category }}</modus-typography>
                    <div>
                      <div class="inline-flex items-center px-2 py-0.5 rounded"
                        [class]="item.type === 'Inflow' ? 'bg-success-20 text-success' : 'bg-destructive-20 text-destructive'">
                        <modus-typography size="xs" weight="semibold">{{ item.type }}</modus-typography>
                      </div>
                    </div>
                    <modus-typography hierarchy="p" size="sm" [className]="'font-medium text-right ' + (item.type === 'Inflow' ? 'text-success' : 'text-destructive')">
                      {{ fmt(item.amount) }}
                    </modus-typography>
                  </div>
                }
                <div class="px-6 py-4 bg-muted border-top-default flex flex-col gap-2">
                  <div class="flex justify-between">
                    <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground-60">Total Inflows</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-success">{{ fmt(cf.inflows) }}</modus-typography>
                  </div>
                  <div class="flex justify-between">
                    <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground-60">Total Outflows</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-destructive">{{ fmt(cf.outflows) }}</modus-typography>
                  </div>
                  <div class="flex justify-between border-top-default pt-2 mt-1">
                    <modus-typography hierarchy="p" size="md" weight="semibold" className="text-foreground">Net Cash</modus-typography>
                    <modus-typography hierarchy="p" size="md" weight="bold" [className]="cf.netCash >= 0 ? 'text-success' : 'text-destructive'">
                      {{ fmt(cf.netCash) }}
                    </modus-typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </modus-card>
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
