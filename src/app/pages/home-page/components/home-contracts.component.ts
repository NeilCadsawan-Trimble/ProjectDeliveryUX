import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { Contract, ContractStatus } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-contracts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 py-4">
      <div class="grid grid-cols-4 gap-2 shrink-0 px-4">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success tabular-nums">{{ activeCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Active</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-warning tabular-nums">{{ pendingCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Pending</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-foreground tabular-nums">{{ draftCount() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Draft</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-primary tabular-nums">{{ fmtCurrency(totalValue()) }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Total Value</modus-typography>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto px-4">
        @for (c of activeContracts(); track c.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="contractClick.emit({ projectId: c.projectId, contractId: c.id })"
            (keydown.enter)="contractClick.emit({ projectId: c.projectId, contractId: c.id })">
            <div class="flex items-center justify-between gap-2">
              <modus-typography class="min-w-0 flex-1" hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ c.title }}</modus-typography>
              <div class="rounded px-1.5 py-0.5 shrink-0" [class]="statusBadgeClass(c.status)">
                <modus-typography size="xs" weight="semibold" className="text-2xs">{{ statusLabel(c.status) }}</modus-typography>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ c.vendor }}</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ c.project }}</modus-typography>
            </div>
            <div class="flex items-center justify-between gap-2">
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 tabular-nums">{{ fmtCurrency(c.revisedValue) }}</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">Ends {{ c.endDate }}</modus-typography>
            </div>
          </div>
        }
        @if (activeContracts().length === 0) {
          <div class="text-center py-6">
            <modus-typography hierarchy="p" size="sm" className="text-foreground-40">No active contracts</modus-typography>
          </div>
        }
      </div>
    </div>
  `,
})
export class HomeContractsComponent {
  readonly contracts = input.required<Contract[]>();
  readonly contractClick = output<{ projectId: number; contractId: string }>();

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
