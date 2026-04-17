import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { Contract, ContractStatus } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-project-contracts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="grid grid-cols-4 gap-2 shrink-0">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <modus-typography size="lg" weight="bold" className="text-success tabular-nums">{{ activeCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Active</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
          <modus-typography size="lg" weight="bold" className="text-warning tabular-nums">{{ pendingCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Pending</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-2">
          <modus-typography size="lg" weight="bold" className="text-foreground tabular-nums">{{ draftCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Draft</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <modus-typography size="lg" weight="bold" className="text-primary tabular-nums">{{ fmtCurrency(totalValue()) }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Total Value</modus-typography>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (c of sortedContracts(); track c.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
            <div class="flex items-center justify-between gap-2">
              <modus-typography size="sm" weight="semibold" className="text-foreground truncate min-w-0 flex-1">{{ c.title }}</modus-typography>
              <modus-typography size="xs" weight="semibold" [className]="'text-2xs rounded px-1.5 py-0.5 shrink-0 ' + statusBadgeClass(c.status)">
                {{ statusLabel(c.status) }}
              </modus-typography>
            </div>
            <div class="flex items-center gap-2">
              <modus-typography size="xs" className="text-2xs text-foreground-60 truncate">{{ c.vendor }}</modus-typography>
            </div>
            <div class="flex items-center justify-between gap-2">
              <modus-typography size="xs" className="text-foreground-60 tabular-nums">{{ fmtCurrency(c.revisedValue) }}</modus-typography>
              <modus-typography size="xs" className="text-foreground-40">Ends {{ c.endDate }}</modus-typography>
            </div>
          </div>
        }
        @if (sortedContracts().length === 0) {
          <modus-typography size="sm" className="text-foreground-40 text-center py-6">No contracts</modus-typography>
        }
      </div>
    </div>
  `,
})
export class ProjectContractsComponent {
  readonly contracts = input.required<Contract[]>();

  readonly sortedContracts = computed(() =>
    [...this.contracts()]
      .sort((a, b) => {
        const order: Record<string, number> = { active: 0, pending: 1, draft: 2, closed: 3 };
        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
      }),
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
