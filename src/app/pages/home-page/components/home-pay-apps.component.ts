import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ApPayApplication, ApPayAppStatus } from '../../../data/dashboard-data.types';
import { formatUsd } from '../../../shared/utils/format';

export type PayAppsView = 'tile' | 'table';

@Component({
  selector: 'app-home-pay-apps',
  imports: [DecimalPipe, ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <!-- Summary KPI strip -->
      @if (showSummary()) {
        <div class="grid grid-cols-3 gap-2 px-4 pt-3 pb-2 flex-shrink-0">
          <div class="rounded-lg bg-muted px-3 py-2 text-center">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Pending</modus-typography>
            <modus-typography hierarchy="p" size="sm" weight="bold" className="text-warning tabular-nums">{{ summary().pendingCount }} / {{ formatCurrency(summary().pendingTotal) }}</modus-typography>
          </div>
          <div class="rounded-lg bg-muted px-3 py-2 text-center">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Approved</modus-typography>
            <modus-typography hierarchy="p" size="sm" weight="bold" className="text-success tabular-nums">{{ summary().approvedCount }} / {{ formatCurrency(summary().approvedTotal) }}</modus-typography>
          </div>
          <div class="rounded-lg bg-muted px-3 py-2 text-center">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total Net Due</modus-typography>
            <modus-typography hierarchy="p" size="sm" weight="bold" className="text-primary tabular-nums">{{ formatCurrency(summary().totalNetDue) }}</modus-typography>
          </div>
        </div>
      }

      @if (view() === 'tile') {
        <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto p-4 pt-2 mb-5">
          @for (app of payApps(); track app.id) {
            <div
              class="bg-background border-default rounded-lg overflow-hidden transition-shadow duration-200"
              [class.hover:shadow-lg]="true"
              [class.cursor-pointer]="interactive()"
              (click)="interactive() && payAppClick.emit(app)">
              <div class="px-4 py-3 flex items-center justify-between">
                <div class="min-w-0">
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ app.vendor }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ app.project }}</modus-typography>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div
                    class="rounded px-2 py-0.5"
                    [class.bg-warning-20]="app.status === 'pending'"
                    [class.text-warning]="app.status === 'pending'"
                    [class.bg-success-20]="app.status === 'approved'"
                    [class.text-success]="app.status === 'approved'"
                    [class.bg-muted]="app.status === 'paid'"
                    [class.text-foreground]="app.status === 'paid'"
                  >
                    <modus-typography size="xs" weight="semibold" className="text-2xs">{{ statusLabel(app.status) }}</modus-typography>
                  </div>
                  @if (interactive()) {
                    <i class="modus-icons text-xs text-foreground-40" aria-hidden="true">chevron_right</i>
                  }
                </div>
              </div>
              <div class="px-4 py-3 flex flex-col gap-3">
                <div class="h-2 w-full rounded bg-muted overflow-hidden">
                  <div
                    class="h-full bg-primary-20 rounded"
                    [style.width.%]="billedPct(app)"
                  ></div>
                </div>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40">Billed {{ formatCurrency(app.previousBilled + app.thisPeriod) }} of {{ formatCurrency(app.contractValue) }}</modus-typography>
                <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Contract value</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.contractValue) }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Previous billed</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.previousBilled) }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">This period</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.thisPeriod) }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Retention held</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.retentionHeld) }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Net due</modus-typography>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-primary tabular-nums text-right">{{ formatCurrency(app.netDue) }}</modus-typography>
                </div>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40">Period end {{ app.periodEnd }}</modus-typography>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex-1 min-h-0 overflow-y-auto mb-5">
          <div class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] gap-3 px-5 py-3 bg-muted border-bottom-default uppercase tracking-wide">
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Vendor</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Project</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Contract</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">This Period</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Net Due</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 text-right">Billed %</modus-typography>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Status</modus-typography>
          </div>
          @for (app of payApps(); track app.id) {
            <div
              class="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,0.6fr)] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150"
              [class.cursor-pointer]="interactive()"
              (click)="interactive() && payAppClick.emit(app)">
              <modus-typography hierarchy="p" size="sm" className="text-foreground truncate">{{ app.vendor }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ app.project }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.contractValue) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" className="text-foreground tabular-nums text-right">{{ formatCurrency(app.thisPeriod) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-primary tabular-nums text-right">{{ formatCurrency(app.netDue) }}</modus-typography>
              <modus-typography hierarchy="p" size="sm" className="text-foreground tabular-nums text-right">{{ billedPct(app) | number:'1.0-0' }}%</modus-typography>
              <div>
                <div
                  class="rounded px-2 py-0.5 inline-block"
                  [class.bg-warning-20]="app.status === 'pending'"
                  [class.text-warning]="app.status === 'pending'"
                  [class.bg-success-20]="app.status === 'approved'"
                  [class.text-success]="app.status === 'approved'"
                  [class.bg-muted]="app.status === 'paid'"
                  [class.text-foreground]="app.status === 'paid'"
                >
                  <modus-typography size="xs" weight="semibold" className="text-2xs">{{ statusLabel(app.status) }}</modus-typography>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- View All footer -->
      @if (showViewAll()) {
        <div class="px-4 py-3 border-top-default text-center flex-shrink-0">
          <div class="text-primary cursor-pointer hover:underline inline-flex items-center gap-1" (click)="viewAllClick.emit()">
            <modus-typography hierarchy="p" size="sm" className="text-primary">View all in Accounts Payable</modus-typography>
            <i class="modus-icons text-xs" aria-hidden="true">arrow_right</i>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomePayAppsComponent {
  readonly payApps = input.required<ApPayApplication[]>();
  readonly view = input<PayAppsView>('tile');
  readonly showSummary = input<boolean>(true);
  readonly interactive = input<boolean>(false);
  readonly showViewAll = input<boolean>(false);

  readonly payAppClick = output<ApPayApplication>();
  readonly viewAllClick = output<void>();

  readonly summary = computed(() => {
    const apps = this.payApps();
    let pendingCount = 0, pendingTotal = 0;
    let approvedCount = 0, approvedTotal = 0;
    let totalNetDue = 0;
    for (const a of apps) {
      if (a.status === 'pending') { pendingCount++; pendingTotal += a.netDue; }
      if (a.status === 'approved') { approvedCount++; approvedTotal += a.netDue; }
      if (a.status !== 'paid') { totalNetDue += a.netDue; }
    }
    return { pendingCount, pendingTotal, approvedCount, approvedTotal, totalNetDue };
  });

  formatCurrency(amount: number): string {
    return formatUsd(amount, 0);
  }

  billedPct(app: ApPayApplication): number {
    const cv = app.contractValue || 1;
    const billed = app.previousBilled + app.thisPeriod;
    return Math.min(100, Math.max(0, (billed / cv) * 100));
  }

  statusLabel(s: ApPayAppStatus): string {
    switch (s) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'paid':
        return 'Paid';
      default:
        return s;
    }
  }
}
