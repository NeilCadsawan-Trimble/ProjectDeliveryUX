import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ApRetentionRecord } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-retention',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-3 h-full min-h-0 overflow-y-auto p-4">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-muted px-2 py-2">
          <div class="text-2xs text-foreground-60">Total held</div>
          <div class="text-sm font-bold text-foreground tabular-nums">{{ formatCurrency(totals().held) }}</div>
        </div>
        <div class="rounded-lg bg-muted px-2 py-2">
          <div class="text-2xs text-foreground-60">Total released</div>
          <div class="text-sm font-bold text-success tabular-nums">{{ formatCurrency(totals().released) }}</div>
        </div>
        <div class="rounded-lg bg-muted px-2 py-2">
          <div class="text-2xs text-foreground-60">Total pending</div>
          <div class="text-sm font-bold text-warning tabular-nums">{{ formatCurrency(totals().pending) }}</div>
        </div>
      </div>

      <div class="border-bottom-default"></div>

      <div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 gap-y-1 text-2xs text-foreground-60 font-medium max-md:hidden">
        <div>Vendor / project</div>
        <div class="text-right">Contract</div>
        <div class="text-right">Rate</div>
        <div class="text-right">Held</div>
        <div class="text-right">Released</div>
        <div class="text-right">Pending</div>
      </div>

      @for (r of records(); track r.id) {
        <div class="flex flex-col gap-2 py-2 border-bottom-default last:border-b-0 md:grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-center md:gap-x-2 flex-shrink-0">
          <div class="min-w-0">
            <div class="text-sm font-medium text-foreground">{{ r.vendor }}</div>
            <div class="text-xs text-foreground-60">{{ r.project }}</div>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <div class="text-2xs text-foreground-60 md:hidden">Contract</div>
            <div class="text-xs text-foreground tabular-nums">{{ formatCurrency(r.contractValue) }}</div>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <div class="text-2xs text-foreground-60 md:hidden">Rate</div>
            <div class="text-xs text-foreground tabular-nums">{{ retentionPct(r.retentionRate) }}</div>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <div class="text-2xs text-foreground-60 md:hidden">Held</div>
            <div class="text-xs text-foreground tabular-nums">{{ formatCurrency(r.retentionHeld) }}</div>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <div class="text-2xs text-foreground-60 md:hidden">Released</div>
            <div class="text-xs text-success tabular-nums">{{ formatCurrency(r.retentionReleased) }}</div>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <div class="text-2xs text-foreground-60 md:hidden">Pending</div>
            <div class="text-xs text-warning tabular-nums">{{ formatCurrency(r.pendingRelease) }}</div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeRetentionComponent {
  readonly records = input.required<ApRetentionRecord[]>();

  readonly totals = computed(() => {
    const rs = this.records();
    return {
      held: rs.reduce((s, r) => s + r.retentionHeld, 0),
      released: rs.reduce((s, r) => s + r.retentionReleased, 0),
      pending: rs.reduce((s, r) => s + r.pendingRelease, 0),
    };
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  /** Seed uses whole-number percent (e.g. 10); values in (0,1] are treated as fractions. */
  retentionPct(rate: number): string {
    const pct = rate > 0 && rate <= 1 ? rate * 100 : rate;
    return `${pct.toFixed(0)}%`;
  }
}
