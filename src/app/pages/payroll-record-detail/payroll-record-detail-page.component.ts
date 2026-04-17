import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
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
  imports: [ModusBadgeComponent, ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
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
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-primary" aria-hidden="true">people_group</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ r.period }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Pay date: {{ r.payDate }}</modus-typography>
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
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(r.grossPay) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Net Pay</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success">{{ formatCurrency(r.netPay) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Employee Count</div>
                  <modus-typography hierarchy="p" size="md">{{ r.employeeCount }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Total Hours</div>
                  <modus-typography hierarchy="p" size="md">{{ r.totalHours.toLocaleString() }}</modus-typography>
                </div>
              </div>

              <!-- KPI row 2 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Period Start</div>
                  <modus-typography hierarchy="p" size="md">{{ r.periodStart }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Period End</div>
                  <modus-typography hierarchy="p" size="md">{{ r.periodEnd }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Frequency</div>
                  <modus-typography hierarchy="p" size="md" className="capitalize">{{ r.frequency }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Overtime Hours</div>
                  <modus-typography hierarchy="p" size="md" [className]="r.overtimeHours > 70 ? 'text-warning font-semibold' : 'text-foreground'">
                    {{ r.overtimeHours }}
                  </modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Deductions Breakdown -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Deductions Breakdown</modus-typography>
            </div>

            <div class="overflow-x-auto">
              <div class="min-w-[400px]">
                <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Category</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">% of Gross</modus-typography>
                </div>
                @for (row of deductions(); track row.category) {
                  <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                    <modus-typography hierarchy="p" size="sm">{{ row.category }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ formatCurrency(row.amount) }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ row.pctOfGross.toFixed(1) }}%</modus-typography>
                  </div>
                }
                <div class="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">Total (Gross Pay)</modus-typography>
                  <modus-typography hierarchy="p" size="md" weight="bold" className="text-foreground text-right">{{ formatCurrency(r.grossPay) }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground-60 text-right">100%</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>
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
