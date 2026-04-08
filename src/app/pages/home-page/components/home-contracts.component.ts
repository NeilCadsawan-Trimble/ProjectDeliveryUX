import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Contract, ContractStatus } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-contracts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="grid grid-cols-4 gap-2 shrink-0">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <div class="text-lg font-bold text-success tabular-nums">{{ activeCount() }}</div>
          <div class="text-2xs text-foreground-60">Active</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
          <div class="text-lg font-bold text-warning tabular-nums">{{ pendingCount() }}</div>
          <div class="text-2xs text-foreground-60">Pending</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-2">
          <div class="text-lg font-bold text-foreground tabular-nums">{{ draftCount() }}</div>
          <div class="text-2xs text-foreground-60">Draft</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <div class="text-lg font-bold text-primary tabular-nums">{{ fmtCurrency(totalValue()) }}</div>
          <div class="text-2xs text-foreground-60">Total Value</div>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (c of activeContracts(); track c.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ c.title }}</div>
              <div class="rounded px-1.5 py-0.5 text-2xs font-medium shrink-0" [class]="statusBadgeClass(c.status)">
                {{ statusLabel(c.status) }}
              </div>
            </div>
            <div class="flex items-center gap-2 text-2xs text-foreground-60">
              <div class="truncate">{{ c.vendor }}</div>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <div class="truncate">{{ c.project }}</div>
            </div>
            <div class="flex items-center justify-between gap-2 text-xs">
              <div class="text-foreground-60 tabular-nums">{{ fmtCurrency(c.revisedValue) }}</div>
              <div class="text-2xs text-foreground-40">Ends {{ c.endDate }}</div>
            </div>
          </div>
        }
        @if (activeContracts().length === 0) {
          <div class="text-sm text-foreground-40 text-center py-6">No active contracts</div>
        }
      </div>
    </div>
  `,
})
export class HomeContractsComponent {
  readonly contracts = input.required<Contract[]>();

  readonly activeContracts = computed(() =>
    this.contracts()
      .filter((c) => c.status === 'active' || c.status === 'pending')
      .sort((a, b) => a.endDate.localeCompare(b.endDate)),
  );

  readonly activeCount = computed(() => this.contracts().filter((c) => c.status === 'active').length);
  readonly pendingCount = computed(() => this.contracts().filter((c) => c.status === 'pending').length);
  readonly draftCount = computed(() => this.contracts().filter((c) => c.status === 'draft').length);
  readonly totalValue = computed(() => this.contracts().filter((c) => c.status !== 'closed').reduce((s, c) => s + c.revisedValue, 0));

  fmtCurrency(amount: number): string {
    if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1) + 'M';
    if (amount >= 1_000) return '$' + Math.round(amount / 1_000) + 'K';
    return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  statusBadgeClass(status: ContractStatus): string {
    switch (status) {
      case 'active': return 'bg-success-20 text-success';
      case 'pending': return 'bg-warning-20 text-warning';
      case 'draft': return 'bg-muted text-foreground-60';
      case 'closed': return 'bg-secondary text-foreground-40';
    }
  }

  statusLabel(status: ContractStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
