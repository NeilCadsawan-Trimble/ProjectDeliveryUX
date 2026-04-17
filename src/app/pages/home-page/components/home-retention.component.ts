import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ApRetentionRecord } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-retention',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-3 h-full min-h-0 overflow-y-auto p-4">
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-muted px-2 py-2">
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total held</modus-typography>
          <modus-typography hierarchy="p" size="sm" weight="bold" className="text-foreground tabular-nums">{{ formatCurrency(totals().held) }}</modus-typography>
        </div>
        <div class="rounded-lg bg-muted px-2 py-2">
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total released</modus-typography>
          <modus-typography hierarchy="p" size="sm" weight="bold" className="text-success tabular-nums">{{ formatCurrency(totals().released) }}</modus-typography>
        </div>
        <div class="rounded-lg bg-muted px-2 py-2">
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total pending</modus-typography>
          <modus-typography hierarchy="p" size="sm" weight="bold" className="text-warning tabular-nums">{{ formatCurrency(totals().pending) }}</modus-typography>
        </div>
      </div>

      <div class="border-bottom-default"></div>

      <div class="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-2 gap-y-1 max-md:hidden">
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Vendor / project</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Contract</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Rate</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Held</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Released</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Pending</modus-typography>
      </div>

      @for (r of records(); track r.id) {
        <div class="flex flex-col gap-2 py-2 border-bottom-default last:border-b-0 md:grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] md:items-center md:gap-x-2">
          <div class="min-w-0">
            <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ r.vendor }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ r.project }}</modus-typography>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 md:hidden">Contract</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums">{{ formatCurrency(r.contractValue) }}</modus-typography>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 md:hidden">Rate</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums">{{ retentionPct(r.retentionRate) }}</modus-typography>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 md:hidden">Held</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums">{{ formatCurrency(r.retentionHeld) }}</modus-typography>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 md:hidden">Released</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-success tabular-nums">{{ formatCurrency(r.retentionReleased) }}</modus-typography>
          </div>
          <div class="flex justify-between md:block md:text-right">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 md:hidden">Pending</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-warning tabular-nums">{{ formatCurrency(r.pendingRelease) }}</modus-typography>
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
