import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { Payable } from '../../data/dashboard-data';
import { PAYABLES, payableStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

@Component({
  selector: 'app-payable-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (payable()) {
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
              <div class="w-11 h-11 rounded-lg bg-warning-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-warning" aria-hidden="true">credit_card</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ payable()!.vendor }}</div>
                <div class="text-sm text-foreground-60">{{ payable()!.invoiceNumber }}</div>
              </div>
            </div>
            <modus-badge [color]="payableStatusBadge(payable()!.status)">{{ payable()!.status }}</modus-badge>
          </div>

          <!-- KPI row 1 -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(payable()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount Paid</div>
                <div class="text-base text-foreground">{{ formatCurrency(payable()!.amountPaid) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Remaining</div>
                <div class="text-base font-semibold" [class]="remaining() > 0 ? 'text-warning' : 'text-success'">
                  {{ formatCurrency(remaining()) }}
                </div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Cost Code</div>
                <div class="text-base text-foreground">{{ payable()!.costCode }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Received Date</div>
                <div class="text-base text-foreground">{{ payable()!.receivedDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Due Date</div>
                <div class="text-base text-foreground">{{ payable()!.dueDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Paid Date</div>
                <div class="text-base text-foreground">{{ payable()!.paidDate ?? 'Pending' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Description</div>
                <div class="text-base text-foreground">{{ payable()!.description }}</div>
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
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">Vendor</div>
                <div class="text-sm text-foreground">{{ payable()!.vendor }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">Invoice #</div>
                <div class="text-sm text-foreground">{{ payable()!.invoiceNumber }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">Description</div>
                <div class="text-sm text-foreground">{{ payable()!.description }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">Cost Code</div>
                <div class="text-sm text-foreground">{{ payable()!.costCode }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">Linked Contract</div>
                <div class="text-sm text-foreground">{{ payable()!.linkedContractId ?? 'None' }}</div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">credit_card</i>
          <div class="text-lg font-medium mb-1">Payable Not Found</div>
          <div class="text-sm mb-4">The requested payable could not be found.</div>
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
export class PayableDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly payableId = signal<string>('');

  readonly payable = computed<Payable | null>(() => {
    const id = this.payableId();
    return PAYABLES.find(p => p.id === id) ?? null;
  });

  readonly remaining = computed(() => {
    const p = this.payable();
    return p ? p.amount - p.amountPaid : 0;
  });

  readonly payableStatusBadge = payableStatusBadge;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.payableId.set(params.get('id') ?? '');
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
