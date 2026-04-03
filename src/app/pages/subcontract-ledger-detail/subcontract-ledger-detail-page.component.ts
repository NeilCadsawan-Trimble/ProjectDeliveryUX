import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { SubcontractLedgerEntry } from '../../data/dashboard-data';
import {
  ledgerTypeBadge,
  ledgerTypeLabel,
  formatCurrency as sharedFormatCurrency,
} from '../../data/dashboard-data';
import { DataStoreService } from '../../data/data-store.service';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

@Component({
  selector: 'app-subcontract-ledger-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (entry()) {
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
              <div class="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                <i class="modus-icons text-xl text-foreground" aria-hidden="true">clipboard</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ entry()!.description }}</div>
                <div class="text-sm text-foreground-60">{{ entry()!.vendor }}</div>
              </div>
            </div>
            <modus-badge [color]="badgeColor()" variant="outlined">{{ typeLabel() }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold" [class]="amountColorClass()">{{ formatCurrency(entry()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Running Balance</div>
                <div class="text-base text-foreground">{{ formatCurrency(entry()!.runningBalance) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Pay App</div>
                <div class="text-base text-foreground">{{ entry()!.payApp }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Date</div>
                <div class="text-base text-foreground">{{ entry()!.date }}</div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project</div>
                <div class="text-base text-foreground">{{ entry()!.project }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Period</div>
                <div class="text-base text-foreground">{{ entry()!.period }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Invoice Ref</div>
                <div class="text-base text-foreground">{{ entry()!.invoiceRef || 'None' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Transaction Details</div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2">
            @for (field of detailFields(); track field.label) {
              <div class="px-6 py-3.5 border-bottom-default">
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1">{{ field.label }}</div>
                <div class="text-sm text-foreground">{{ field.value }}</div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">clipboard</i>
          <div class="text-lg font-medium mb-1">Ledger Entry Not Found</div>
          <div class="text-sm mb-4">The requested subcontract ledger entry could not be found.</div>
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
export class SubcontractLedgerDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly store = inject(DataStoreService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly entryId = signal<string>('');

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

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.entryId.set(params.get('id') ?? '');
    });
  }

  formatCurrency(value: number): string {
    return sharedFormatCurrency(value);
  }

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
