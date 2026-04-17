import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import type { SubcontractLedgerEntry } from '../../data/dashboard-data.types';
import {
  ledgerTypeBadge,
  ledgerTypeLabel,
  formatCurrency as sharedFormatCurrency,
} from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

@Component({
  selector: 'app-subcontract-ledger-detail-page',
  imports: [ModusBadgeComponent, ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!entry()"
      [backLabel]="backLabel"
      emptyIcon="clipboard"
      emptyTitle="Ledger Entry Not Found"
      emptyMessage="The requested subcontract ledger entry could not be found."
      (back)="goBack()"
    >
      @if (entry(); as e) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                  <i class="modus-icons text-xl text-foreground" aria-hidden="true">clipboard</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ e.description }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ e.vendor }}</modus-typography>
                </div>
              </div>
              <modus-badge [color]="badgeColor()" variant="outlined">{{ typeLabel() }}</modus-badge>
            </div>

            <div class="px-6 py-6 flex flex-col gap-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold" [className]="amountColorClass()">{{ formatCurrency(e.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Running Balance</div>
                  <modus-typography hierarchy="p" size="md">{{ formatCurrency(e.runningBalance) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Pay App</div>
                  <modus-typography hierarchy="p" size="md">{{ e.payApp }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Date</div>
                  <modus-typography hierarchy="p" size="md">{{ e.date }}</modus-typography>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div class="detail-field-label">Project</div>
                  <modus-typography hierarchy="p" size="md">{{ e.project }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Period</div>
                  <modus-typography hierarchy="p" size="md">{{ e.period }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Invoice Ref</div>
                  <modus-typography hierarchy="p" size="md">{{ e.invoiceRef || 'None' }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Transaction Details -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Transaction Details</modus-typography>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2">
              @for (field of detailFields(); track field.label) {
                <div class="px-6 py-3.5 border-bottom-default">
                  <div class="detail-field-label">{{ field.label }}</div>
                  <modus-typography hierarchy="p" size="sm">{{ field.value }}</modus-typography>
                </div>
              }
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class SubcontractLedgerDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly entryId = routeParamSignal('id');

  readonly entry = computed<SubcontractLedgerEntry | null>(() => {
    const id = this.entryId();
    return this.store.subcontractLedger().find(e => e.id === id) ?? null;
  });

  readonly badgeColor = computed(() => {
    const e = this.entry();
    return e ? ledgerTypeBadge(e.type) : 'secondary';
  });

  readonly typeLabel = computed(() => {
    const e = this.entry();
    return e ? ledgerTypeLabel(e.type) : '';
  });

  readonly amountColorClass = computed(() => {
    const e = this.entry();
    if (!e) return 'text-foreground';
    return e.amount < 0 ? 'text-destructive' : 'text-success';
  });

  readonly detailFields = computed<{ label: string; value: string }[]>(() => {
    const e = this.entry();
    if (!e) return [];
    return [
      { label: 'Subcontract ID', value: e.subcontractId },
      { label: 'Vendor', value: e.vendor },
      { label: 'Type', value: ledgerTypeLabel(e.type) },
      { label: 'Description', value: e.description },
      { label: 'Amount', value: sharedFormatCurrency(e.amount) },
      { label: 'Date', value: e.date },
      { label: 'Pay App', value: e.payApp },
      { label: 'Invoice Ref', value: e.invoiceRef || 'None' },
      { label: 'Period', value: e.period },
      { label: 'Running Balance', value: sharedFormatCurrency(e.runningBalance) },
    ];
  });

  formatCurrency(value: number): string {
    return sharedFormatCurrency(value);
  }
}
