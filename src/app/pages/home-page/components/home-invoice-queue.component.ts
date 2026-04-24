import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';

import type { ApInvoice } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-invoice-queue',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col h-full min-h-0 overflow-y-auto mb-5">
      @for (invoice of invoices(); track invoice.id) {
        <div
          class="flex items-center gap-3 px-3 py-2 border-bottom-default"
          [attr.aria-label]="
            'Invoice ' +
            invoice.invoiceNumber +
            ', ' +
            invoice.vendor +
            ', ' +
            formatCurrency(invoice.amount) +
            ', due ' +
            invoice.dueDate +
            ', ' +
            statusLabel(invoice.status)
          ">
          <div class="flex-shrink-0">
            <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">invoice</i>
          </div>
          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ invoice.invoiceNumber }}</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ invoice.vendor }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ invoice.project }}</modus-typography>
          </div>
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground text-right tabular-nums">
              {{ formatCurrency(invoice.amount) }}
            </modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 whitespace-nowrap">{{ invoice.dueDate }}</modus-typography>
          </div>
          <div class="flex-shrink-0">
            <div
              class="rounded px-2 py-0.5 whitespace-nowrap"
              [class]="statusBadgeClass(invoice.status)">
              <modus-typography size="xs" weight="semibold">{{ statusLabel(invoice.status) }}</modus-typography>
            </div>
          </div>
        </div>
      } @empty {
        <div class="px-3 py-6 text-center flex flex-col items-center gap-2">
          <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">invoice</i>
          <modus-typography hierarchy="p" size="sm" className="text-foreground-60">No pending invoices</modus-typography>
        </div>
      }
    </div>
  `,
})
export class HomeInvoiceQueueComponent {
  readonly invoices = input.required<ApInvoice[]>();

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  statusLabel(status: ApInvoice['status']): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'on-hold':
        return 'On hold';
      case 'paid':
        return 'Paid';
      default:
        return status;
    }
  }

  statusBadgeClass(status: ApInvoice['status']): string {
    switch (status) {
      case 'pending':
        return 'bg-warning-20 text-warning';
      case 'approved':
        return 'bg-success-20 text-success';
      case 'on-hold':
        return 'bg-destructive-20 text-destructive';
      case 'paid':
        return 'bg-muted text-foreground-40';
      default:
        return 'bg-muted text-foreground-40';
    }
  }
}
