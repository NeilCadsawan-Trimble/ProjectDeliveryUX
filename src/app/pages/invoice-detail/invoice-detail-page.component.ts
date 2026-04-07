import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
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
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
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
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">invoice</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ inv.invoiceNumber }}</div>
                <div class="text-sm text-foreground-60">Invoice</div>
              </div>
            </div>
            <modus-badge [color]="badgeColor()">{{ badgeLabel() }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(inv.amount) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Amount Paid</div>
                <div class="text-xl font-bold text-success">{{ formatCurrency(inv.amountPaid) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Remaining</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(remainingAmount()) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Terms</div>
                <div class="text-base text-foreground">{{ inv.terms }}</div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Issue Date</div>
                <div class="text-base text-foreground">{{ inv.issueDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Due Date</div>
                <div class="text-base text-foreground">{{ inv.dueDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Paid Date</div>
                <div class="text-base text-foreground">{{ inv.paidDate || 'Pending' }}</div>
              </div>
              <div>
                <div class="detail-field-label">Retainage Held</div>
                <div class="text-base text-foreground">{{ formatCurrency(inv.retainageHeld) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payment_instant</i>
            <div class="text-base font-semibold text-foreground">Payment Summary</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[400px]">
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Description</div>
                <div class="text-right">Amount</div>
              </div>

              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                <div class="text-sm text-foreground">Invoice total</div>
                <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(inv.amount) }}</div>
              </div>

              @for (line of paymentLines(); track line.description) {
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center">
                  <div class="text-sm text-foreground">{{ line.description }}</div>
                  <div class="text-sm font-medium text-right" [class]="line.amount < 0 ? 'text-success' : 'text-foreground'">
                    {{ line.amount < 0 ? '-' : '' }}{{ formatCurrency(line.amount < 0 ? -line.amount : line.amount) }}
                  </div>
                </div>
              }

              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                <div class="text-sm font-semibold text-foreground">Balance Due</div>
                <div class="text-base font-bold text-foreground text-right">{{ formatCurrency(remainingAmount()) }}</div>
              </div>
            </div>
          </div>
        </div>
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
