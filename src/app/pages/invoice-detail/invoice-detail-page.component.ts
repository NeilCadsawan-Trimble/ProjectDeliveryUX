import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { Invoice, InvoiceStatus } from '../../data/dashboard-data';
import { INVOICES, invoiceStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

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
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (invoice()) {
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
                <i class="modus-icons text-xl text-primary" aria-hidden="true">receipt</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ invoice()!.invoiceNumber }}</div>
                <div class="text-sm text-foreground-60">Invoice</div>
              </div>
            </div>
            <modus-badge [color]="badgeColor()">{{ badgeLabel() }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <!-- KPI row 1 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(invoice()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount Paid</div>
                <div class="text-xl font-bold text-success">{{ formatCurrency(invoice()!.amountPaid) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Remaining</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(remainingAmount()) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Terms</div>
                <div class="text-base text-foreground">{{ invoice()!.terms }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Issue Date</div>
                <div class="text-base text-foreground">{{ invoice()!.issueDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Due Date</div>
                <div class="text-base text-foreground">{{ invoice()!.dueDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Paid Date</div>
                <div class="text-base text-foreground">{{ invoice()!.paidDate || 'Pending' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Retainage Held</div>
                <div class="text-base text-foreground">{{ formatCurrency(invoice()!.retainageHeld) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">payments</i>
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
                <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(invoice()!.amount) }}</div>
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
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">receipt</i>
          <div class="text-lg font-medium mb-1">Invoice Not Found</div>
          <div class="text-sm mb-4">The requested invoice could not be found.</div>
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
export class InvoiceDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly invoiceId = signal<string>('');

  readonly invoice = computed<Invoice | null>(() => {
    const id = this.invoiceId();
    return INVOICES.find(inv => inv.id === id) ?? null;
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

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.invoiceId.set(params.get('id') ?? '');
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
