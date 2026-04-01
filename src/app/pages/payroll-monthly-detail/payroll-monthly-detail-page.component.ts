import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { PayrollRecord } from '../../data/dashboard-data';
import { PAYROLL_RECORDS, formatCurrency as sharedFormatCurrency, payrollStatusBadge } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

@Component({
  selector: 'app-payroll-monthly-detail-page',
  imports: [DecimalPipe, ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (records().length > 0) {
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
            <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center flex-shrink-0">
              <i class="modus-icons text-xl text-primary" aria-hidden="true">people_group</i>
            </div>
            <div>
              <div class="text-xl font-semibold text-foreground">{{ monthParam() }}</div>
              <div class="text-sm text-foreground-60">Payroll Summary</div>
            </div>
          </div>
        </div>

        <!-- KPI grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Gross Pay</div>
            <div class="text-xl font-bold text-foreground">{{ formatCurrency(totals().gross) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Net Pay</div>
            <div class="text-xl font-bold text-success">{{ formatCurrency(totals().net) }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Avg Headcount</div>
            <div class="text-xl font-bold text-foreground">{{ totals().headcount }}</div>
          </div>
          <div class="bg-card border-default rounded-lg px-5 py-4">
            <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Total Hours</div>
            <div class="text-xl font-bold text-foreground">{{ totals().totalHours | number }}</div>
          </div>
        </div>

        <!-- Pay Periods table -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
            <div class="text-base font-semibold text-foreground">Pay Periods</div>
            <div class="text-xs text-foreground-40">{{ records().length }} records</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[640px]">
              <div class="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Period</div>
                <div class="text-right">Gross</div>
                <div class="text-right">Net</div>
                <div class="text-center">Status</div>
                <div class="text-right">Employees</div>
                <div class="text-right">Hours</div>
              </div>
              @for (rec of records(); track rec.id) {
                <div class="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                  <div class="text-sm text-foreground">{{ rec.period }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ formatCurrency(rec.grossPay) }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ formatCurrency(rec.netPay) }}</div>
                  <div class="text-center">
                    <modus-badge [color]="payrollStatusBadge(rec.status)" size="sm">{{ rec.status }}</modus-badge>
                  </div>
                  <div class="text-sm text-foreground-80 text-right">{{ rec.employeeCount }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ rec.totalHours | number }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else if (monthParam()) {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">people_group</i>
          <div class="text-lg font-medium mb-1">No Payroll Data</div>
          <div class="text-sm mb-4">No payroll records found for {{ monthParam() }}.</div>
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
export class PayrollMonthlyDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  readonly monthParam = signal<string>('');

  readonly records = computed<PayrollRecord[]>(() => {
    const month = this.monthParam();
    if (!month) return [];
    return PAYROLL_RECORDS.filter(r => r.period.split(' - ')[0] === month);
  });

  readonly totals = computed(() => {
    const recs = this.records();
    const gross = recs.reduce((s, r) => s + r.grossPay, 0);
    const net = recs.reduce((s, r) => s + r.netPay, 0);
    const headcount = recs.length > 0
      ? Math.round(recs.reduce((s, r) => s + r.employeeCount, 0) / recs.length)
      : 0;
    const totalHours = recs.reduce((s, r) => s + r.totalHours, 0);
    return { gross, net, headcount, totalHours };
  });

  readonly payrollStatusBadge = payrollStatusBadge;

  constructor() {
    this.route.paramMap.subscribe(params => {
      const raw = params.get('month') ?? '';
      this.monthParam.set(decodeURIComponent(raw));
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
