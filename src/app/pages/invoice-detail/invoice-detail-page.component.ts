import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import type { Invoice, InvoiceStatus } from '../../data/dashboard-data.types';
import { invoiceStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

interface PaymentLine {
  description: string;
  amount: number;
}

function buildPaymentLines(inv: Invoice): PaymentLine[] {
  const lines: PaymentLine[] = [];
  const seed = inv.id.charCodeAt(inv.id.length - 1);

  if (inv.amountPaid > 0) {
    const paymentCount = 1 + (seed % 3);
    let remaining = inv.amountPaid;
    for (let i = 0; i < paymentCount; i++) {
      const isLast = i === paymentCount - 1;
      const portion = isLast ? remaining : Math.round(remaining * (0.3 + ((seed + i * 7) % 30) / 100));
      if (portion <= 0) break;
      const dateOffset = 5 + (seed + i * 4) % 20;
      lines.push({
        description: `Payment received (${paymentCount > 1 ? `#${i + 1} - ` : ''}${dateOffset} days after issue)`,
        amount: -portion,
      });
      remaining -= portion;
    }
  }

  if (inv.retainageHeld > 0) {
    lines.push({ description: 'Retainage held', amount: inv.retainageHeld });
  }

  const outstanding = inv.amount - inv.amountPaid;
  if (outstanding > 0 && inv.status !== 'paid') {
    lines.push({ description: 'Outstanding balance', amount: outstanding });
  }

  return lines;
}

function statusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    paid: 'Paid',
    overdue: 'Overdue',
    'partially-paid': 'Partially Paid',
    void: 'Void',
  };
  return labels[status] ?? status;
}

@Component({
  selector: 'app-invoice-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent, ModusTypographyComponent, ModusCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!invoice()"
      [backLabel]="backLabel"
      emptyIcon="invoice"
      emptyTitle="Invoice Not Found"
      emptyMessage="The requested invoice could not be found."
      (back)="goBack()"
    >
      @if (invoice(); as inv) {
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-primary" aria-hidden="true">invoice</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ inv.invoiceNumber }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Invoice</modus-typography>
                </div>
              </div>
              <modus-badge [color]="badgeColor()">{{ badgeLabel() }}</modus-badge>
            </div>

            <div class="px-6 py-6 flex flex-col gap-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(inv.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Amount Paid</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success">{{ formatCurrency(inv.amountPaid) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Remaining</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(remainingAmount()) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Terms</div>
                  <modus-typography hierarchy="p" size="md">{{ inv.terms }}</modus-typography>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Issue Date</div>
                  <modus-typography hierarchy="p" size="md">{{ inv.issueDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Due Date</div>
                  <modus-typography hierarchy="p" size="md">{{ inv.dueDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Paid Date</div>
                  <modus-typography hierarchy="p" size="md">{{ inv.paidDate || 'Pending' }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Retainage Held</div>
                  <modus-typography hierarchy="p" size="md">{{ formatCurrency(inv.retainageHeld) }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payment_instant</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Payment Summary</modus-typography>
            </div>

            <div class="overflow-x-auto">
              <div class="min-w-[400px]">
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Description</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
                </div>

                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                  <modus-typography hierarchy="p" size="sm">Invoice total</modus-typography>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-right">{{ formatCurrency(inv.amount) }}</modus-typography>
                </div>

                @for (line of paymentLines(); track line.description) {
                  <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                    <modus-typography hierarchy="p" size="sm">{{ line.description }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" [className]="'text-right ' + (line.amount < 0 ? 'text-success' : 'text-foreground')">
                      {{ line.amount < 0 ? '-' : '' }}{{ formatCurrency(line.amount < 0 ? -line.amount : line.amount) }}
                    </modus-typography>
                  </div>
                }

                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">Balance Due</modus-typography>
                  <modus-typography hierarchy="p" size="md" weight="bold" className="text-right">{{ formatCurrency(remainingAmount()) }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class InvoiceDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();

  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly invoiceId = routeParamSignal('id');

  readonly invoice = computed<Invoice | null>(() => {
    const id = this.invoiceId();
    return this.store.invoices().find(inv => inv.id === id) ?? null;
  });

  readonly remainingAmount = computed(() => {
    const inv = this.invoice();
    return inv ? inv.amount - inv.amountPaid : 0;
  });

  readonly badgeColor = computed(() => {
    const inv = this.invoice();
    return inv ? invoiceStatusBadge(inv.status) : 'secondary';
  });

  readonly badgeLabel = computed(() => {
    const inv = this.invoice();
    return inv ? statusLabel(inv.status) : '';
  });

  readonly paymentLines = computed<PaymentLine[]>(() => {
    const inv = this.invoice();
    return inv ? buildPaymentLines(inv) : [];
  });

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
