import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import type { Payable } from '../../data/dashboard-data.types';
import { payableStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

@Component({
  selector: 'app-payable-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent, ModusTypographyComponent, ModusCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!payable()"
      [backLabel]="backLabel"
      emptyIcon="credit_card"
      emptyTitle="Payable Not Found"
      emptyMessage="The requested payable could not be found."
      (back)="goBack()"
    >
      @if (payable(); as p) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-warning-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-warning" aria-hidden="true">credit_card</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ p.vendor }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ p.invoiceNumber }}</modus-typography>
                </div>
              </div>
              <modus-badge [color]="payableStatusBadge(p.status)">{{ p.status }}</modus-badge>
            </div>

            <!-- KPI row 1 -->
            <div class="px-6 py-6 flex flex-col gap-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(p.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Amount Paid</div>
                  <modus-typography hierarchy="p" size="md">{{ formatCurrency(p.amountPaid) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Remaining</div>
                  <modus-typography hierarchy="h3" size="md" weight="semibold" [className]="remaining() > 0 ? 'text-warning' : 'text-success'">
                    {{ formatCurrency(remaining()) }}
                  </modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Cost Code</div>
                  <modus-typography hierarchy="p" size="md">{{ p.costCode }}</modus-typography>
                </div>
              </div>

              <!-- KPI row 2 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Received Date</div>
                  <modus-typography hierarchy="p" size="md">{{ p.receivedDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Due Date</div>
                  <modus-typography hierarchy="p" size="md">{{ p.dueDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Paid Date</div>
                  <modus-typography hierarchy="p" size="md">{{ p.paidDate ?? 'Pending' }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Description</div>
                  <modus-typography hierarchy="p" size="md">{{ p.description }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Payment Details card -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Payment Details</modus-typography>
            </div>
            <div class="px-6 py-5">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                <div>
                  <div class="detail-field-label">Vendor</div>
                  <modus-typography hierarchy="p" size="sm">{{ p.vendor }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Invoice #</div>
                  <modus-typography hierarchy="p" size="sm">{{ p.invoiceNumber }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Description</div>
                  <modus-typography hierarchy="p" size="sm">{{ p.description }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Cost Code</div>
                  <modus-typography hierarchy="p" size="sm">{{ p.costCode }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Linked Contract</div>
                  <modus-typography hierarchy="p" size="sm">{{ p.linkedContractId ?? 'None' }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class PayableDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly payableId = routeParamSignal('id');

  readonly payable = computed<Payable | null>(() => {
    const id = this.payableId();
    return this.store.payables().find(p => p.id === id) ?? null;
  });

  readonly remaining = computed(() => {
    const p = this.payable();
    return p ? p.amount - p.amountPaid : 0;
  });

  readonly payableStatusBadge = payableStatusBadge;

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
