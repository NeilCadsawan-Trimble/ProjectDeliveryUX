import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { PayrollRecord } from '../../data/dashboard-data';
import { PAYROLL_RECORDS, payrollStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

interface DeductionRow {
  category: string;
  amount: number;
  pctOfGross: number;
}

@Component({
  selector: 'app-payroll-record-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (record()) {
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
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">people_group</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ record()!.period }}</div>
                <div class="text-sm text-foreground-60">Pay date: {{ record()!.payDate }}</div>
              </div>
            </div>
            <modus-badge [color]="payrollStatusBadge(record()!.status)" variant="filled">
              {{ record()!.status }}
            </modus-badge>
          </div>

          <!-- KPI row 1 -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Gross Pay</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(record()!.grossPay) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Net Pay</div>
                <div class="text-xl font-bold text-success">{{ formatCurrency(record()!.netPay) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Employee Count</div>
                <div class="text-base text-foreground">{{ record()!.employeeCount }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Total Hours</div>
                <div class="text-base text-foreground">{{ record()!.totalHours.toLocaleString() }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Period Start</div>
                <div class="text-base text-foreground">{{ record()!.periodStart }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Period End</div>
                <div class="text-base text-foreground">{{ record()!.periodEnd }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Frequency</div>
                <div class="text-base text-foreground capitalize">{{ record()!.frequency }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Overtime Hours</div>
                <div class="text-base" [class]="record()!.overtimeHours > 70 ? 'text-warning font-semibold' : 'text-foreground'">
                  {{ record()!.overtimeHours }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Deductions Breakdown -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Deductions Breakdown</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[400px]">
              <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Category</div>
                <div class="text-right">Amount</div>
                <div class="text-right">% of Gross</div>
              </div>
              @for (row of deductions(); track row.category) {
                <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                  <div class="text-sm text-foreground">{{ row.category }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ formatCurrency(row.amount) }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ row.pctOfGross.toFixed(1) }}%</div>
                </div>
              }
              <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                <div class="text-sm font-semibold text-foreground">Total (Gross Pay)</div>
                <div class="text-base font-bold text-foreground text-right">{{ formatCurrency(record()!.grossPay) }}</div>
                <div class="text-sm font-semibold text-foreground-60 text-right">100%</div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">people_group</i>
          <div class="text-lg font-medium mb-1">Payroll Record Not Found</div>
          <div class="text-sm mb-4">The requested payroll record could not be found.</div>
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
export class PayrollRecordDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  readonly payrollStatusBadge = payrollStatusBadge;

  private readonly recordId = signal<string>('');

  readonly record = computed<PayrollRecord | null>(() => {
    const id = this.recordId();
    return PAYROLL_RECORDS.find(pr => pr.id === id) ?? null;
  });

  readonly deductions = computed<DeductionRow[]>(() => {
    const r = this.record();
    if (!r) return [];
    const gross = r.grossPay || 1;
    return [
      { category: 'Taxes', amount: r.taxes, pctOfGross: (r.taxes / gross) * 100 },
      { category: 'Benefits', amount: r.benefits, pctOfGross: (r.benefits / gross) * 100 },
      { category: 'Net Pay', amount: r.netPay, pctOfGross: (r.netPay / gross) * 100 },
    ];
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.recordId.set(params.get('id') ?? '');
    });
  }

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

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
