import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { Payable } from '../../data/dashboard-data.types';
import { payableStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

@Component({
  selector: 'app-payable-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
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
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-warning-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-warning" aria-hidden="true">credit_card</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ p.vendor }}</div>
                <div class="text-sm text-foreground-60">{{ p.invoiceNumber }}</div>
              </div>
            </div>
            <modus-badge [color]="payableStatusBadge(p.status)">{{ p.status }}</modus-badge>
          </div>

          <!-- KPI row 1 -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(p.amount) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Amount Paid</div>
                <div class="text-base text-foreground">{{ formatCurrency(p.amountPaid) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Remaining</div>
                <div class="text-base font-semibold" [class]="remaining() > 0 ? 'text-warning' : 'text-success'">
                  {{ formatCurrency(remaining()) }}
                </div>
              </div>
              <div>
                <div class="detail-field-label">Cost Code</div>
                <div class="text-base text-foreground">{{ p.costCode }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Received Date</div>
                <div class="text-base text-foreground">{{ p.receivedDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Due Date</div>
                <div class="text-base text-foreground">{{ p.dueDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Paid Date</div>
                <div class="text-base text-foreground">{{ p.paidDate ?? 'Pending' }}</div>
              </div>
              <div>
                <div class="detail-field-label">Description</div>
                <div class="text-base text-foreground">{{ p.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Details card -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info</i>
            <div class="text-base font-semibold text-foreground">Payment Details</div>
          </div>
          <div class="px-6 py-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <div class="detail-field-label">Vendor</div>
                <div class="text-sm text-foreground">{{ p.vendor }}</div>
              </div>
              <div>
                <div class="detail-field-label">Invoice #</div>
                <div class="text-sm text-foreground">{{ p.invoiceNumber }}</div>
              </div>
              <div>
                <div class="detail-field-label">Description</div>
                <div class="text-sm text-foreground">{{ p.description }}</div>
              </div>
              <div>
                <div class="detail-field-label">Cost Code</div>
                <div class="text-sm text-foreground">{{ p.costCode }}</div>
              </div>
              <div>
                <div class="detail-field-label">Linked Contract</div>
                <div class="text-sm text-foreground">{{ p.linkedContractId ?? 'None' }}</div>
              </div>
            </div>
          </div>
        </div>
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
