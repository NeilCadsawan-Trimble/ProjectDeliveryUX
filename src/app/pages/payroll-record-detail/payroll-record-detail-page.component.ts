import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { PayrollRecord } from '../../data/dashboard-data.types';
import { payrollStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

interface DeductionRow {
  category: string;
  amount: number;
  pctOfGross: number;
}

@Component({
  selector: 'app-payroll-record-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!record()"
      [backLabel]="backLabel"
      emptyIcon="people_group"
      emptyTitle="Payroll Record Not Found"
      emptyMessage="The requested payroll record could not be found."
      (back)="goBack()"
    >
      @if (record(); as r) {
        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">people_group</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ r.period }}</div>
                <div class="text-sm text-foreground-60">Pay date: {{ r.payDate }}</div>
              </div>
            </div>
            <modus-badge [color]="payrollStatusBadge(r.status)" variant="filled">
              {{ r.status }}
            </modus-badge>
          </div>

          <!-- KPI row 1 -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Gross Pay</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(r.grossPay) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Net Pay</div>
                <div class="text-xl font-bold text-success">{{ formatCurrency(r.netPay) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Employee Count</div>
                <div class="text-base text-foreground">{{ r.employeeCount }}</div>
              </div>
              <div>
                <div class="detail-field-label">Total Hours</div>
                <div class="text-base text-foreground">{{ r.totalHours.toLocaleString() }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Period Start</div>
                <div class="text-base text-foreground">{{ r.periodStart }}</div>
              </div>
              <div>
                <div class="detail-field-label">Period End</div>
                <div class="text-base text-foreground">{{ r.periodEnd }}</div>
              </div>
              <div>
                <div class="detail-field-label">Frequency</div>
                <div class="text-base text-foreground capitalize">{{ r.frequency }}</div>
              </div>
              <div>
                <div class="detail-field-label">Overtime Hours</div>
                <div class="text-base" [class]="r.overtimeHours > 70 ? 'text-warning font-semibold' : 'text-foreground'">
                  {{ r.overtimeHours }}
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
                <div class="text-base font-bold text-foreground text-right">{{ formatCurrency(r.grossPay) }}</div>
                <div class="text-sm font-semibold text-foreground-60 text-right">100%</div>
              </div>
            </div>
          </div>
        </div>
      }
    </app-detail-page-layout>
  `,
})
export class PayrollRecordDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  readonly payrollStatusBadge = payrollStatusBadge;

  private readonly recordId = routeParamSignal('id');

  readonly record = computed<PayrollRecord | null>(() => {
    const id = this.recordId();
    return this.store.payrollRecords().find(pr => pr.id === id) ?? null;
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

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
