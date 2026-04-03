import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type { CashFlowEntry } from '../../data/dashboard-data';
import { formatCurrency } from '../../data/dashboard-data';
import { DataStoreService } from '../../data/data-store.service';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (entry()) {
        <div
          class="flex items-center gap-2 mb-6 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150"
          role="button" tabindex="0"
          (click)="goBack()"
          (keydown.enter)="goBack()"
        >
          <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
          <div class="text-sm font-medium">{{ backLabel }}</div>
        </div>

        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-4 px-6 py-5">
            <div class="w-11 h-11 rounded-lg bg-success-20 flex items-center justify-center">
              <i class="modus-icons text-xl text-success" aria-hidden="true">gantt_chart</i>
            </div>
            <div>
              <div class="text-xl font-semibold text-foreground">{{ entry()!.month }}</div>
              <div class="text-sm text-foreground-60">Cash Flow Summary</div>
            </div>
          </div>
        </div>

        <!-- KPI grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Inflows</div>
            <div class="text-xl font-bold text-success">{{ fmt(entry()!.inflows) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Outflows</div>
            <div class="text-xl font-bold text-destructive">{{ fmt(entry()!.outflows) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Net Cash</div>
            <div class="text-xl font-bold" [class]="entry()!.netCash >= 0 ? 'text-success' : 'text-destructive'">
              {{ fmt(entry()!.netCash) }}
            </div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Running Balance</div>
            <div class="text-xl font-bold text-foreground">{{ fmt(entry()!.runningBalance) }}</div>
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
                  <div class="font-semibold text-success">{{ fmt(entry()!.inflows) }}</div>
                </div>
                <div class="flex justify-between text-sm">
                  <div class="font-medium text-foreground-60">Total Outflows</div>
                  <div class="font-semibold text-destructive">{{ fmt(entry()!.outflows) }}</div>
                </div>
                <div class="flex justify-between text-base border-top-default pt-2 mt-1">
                  <div class="font-semibold text-foreground">Net Cash</div>
                  <div class="font-bold" [class]="entry()!.netCash >= 0 ? 'text-success' : 'text-destructive'">
                    {{ fmt(entry()!.netCash) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">gantt_chart</i>
          <div class="text-lg font-medium mb-1">Cash Flow Entry Not Found</div>
          <div class="text-sm mb-4">The requested month could not be found.</div>
          <div
            class="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
            role="button" tabindex="0"
            (click)="goBack()"
            (keydown.enter)="goBack()"
          >Return to {{ backLabel }}</div>
        </div>
      }
    </div>
  `,
})
export class CashFlowDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly store = inject(DataStoreService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly monthParam = signal<string>('');

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

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.monthParam.set(params.get('month') ?? '');
    });
  }

  fmt(value: number): string { return formatCurrency(value); }

  goBack(): void {
    const route = this.backInfo.route;
    if (route.includes('?')) {
      const [path, query] = route.split('?');
      const qp: Record<string, string> = {};
      for (const pair of query.split('&')) {
        const [k, v] = pair.split('=');
        if (k) qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      }
      this.router.navigate([path || '/'], { queryParams: qp });
    } else {
      this.router.navigate([route]);
    }
  }
}
