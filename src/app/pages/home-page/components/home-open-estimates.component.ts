import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Estimate, EstimateStatus } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-open-estimates',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <div class="grid grid-cols-4 gap-2 shrink-0 px-4 pt-4 pb-2">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <div class="text-lg font-bold text-primary tabular-nums">{{ totalCount() }}</div>
          <div class="text-2xs text-foreground-60">Total</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
          <div class="text-lg font-bold text-warning tabular-nums">{{ awaitingCount() }}</div>
          <div class="text-2xs text-foreground-60">Awaiting</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-destructive-20 py-2">
          <div class="text-lg font-bold text-destructive tabular-nums">{{ overdueCount() }}</div>
          <div class="text-2xs text-foreground-60">Overdue</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <div class="text-lg font-bold text-success tabular-nums">{{ fmtCurrency(pipelineValue()) }}</div>
          <div class="text-2xs text-foreground-60">Pipeline</div>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (est of openEstimates(); track est.id) {
          <div class="flex items-center gap-3 px-4 py-3 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="estimateClick.emit(est.id)"
            (keydown.enter)="estimateClick.emit(est.id)">
            <div class="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0"
              [class]="dateBadgeClass(est.daysLeft)">
              <div class="text-2xs font-medium leading-none">{{ monthAbbr(est.dueDate) }}</div>
              <div class="text-sm font-bold leading-tight">{{ dayOfMonth(est.dueDate) }}</div>
            </div>
            <div class="flex-1 min-w-0 flex flex-col gap-0.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class="text-xs font-mono text-primary font-medium shrink-0">{{ est.id }}</div>
                  <div class="text-sm font-medium text-foreground truncate">{{ est.project }}</div>
                </div>
                <div class="rounded px-1.5 py-0.5 text-2xs font-medium shrink-0" [class]="statusBadgeClass(est.status)">
                  {{ est.status }}
                </div>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-2xs text-foreground-60 min-w-0">
                  <div class="truncate">{{ est.client }}</div>
                  <div class="w-1 h-1 rounded-full bg-foreground-20 shrink-0"></div>
                  <div class="shrink-0">{{ est.type }}</div>
                </div>
                <div class="text-xs font-semibold text-foreground tabular-nums shrink-0">{{ est.value }}</div>
              </div>
              <div class="flex items-center justify-between gap-2 text-2xs">
                <div class="flex items-center gap-1.5 text-foreground-60 min-w-0">
                  <div class="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xs font-semibold shrink-0">
                    {{ est.requestedByInitials }}
                  </div>
                  <div class="truncate">{{ est.requestedBy }}</div>
                </div>
                <div class="shrink-0" [class]="dueDateClass(est.daysLeft)">
                  @if (est.daysLeft < 0) {
                    {{ -est.daysLeft }}d overdue
                  } @else if (est.daysLeft === 0) {
                    Due today
                  } @else {
                    {{ est.daysLeft }}d left
                  }
                </div>
              </div>
            </div>
          </div>
        }
        @if (openEstimates().length === 0) {
          <div class="text-sm text-foreground-40 text-center py-6">No open estimates</div>
        }
      </div>
    </div>
  `,
})
export class HomeOpenEstimatesComponent {
  readonly estimates = input.required<Estimate[]>();
  readonly estimateClick = output<string>();

  readonly openEstimates = computed(() =>
    this.estimates()
      .filter((e) => e.status !== 'Approved')
      .sort((a, b) => a.daysLeft - b.daysLeft),
  );

  readonly totalCount = computed(() => this.estimates().filter((e) => e.status !== 'Approved').length);
  readonly awaitingCount = computed(() => this.estimates().filter((e) => e.status === 'Awaiting Approval').length);
  readonly overdueCount = computed(() => this.estimates().filter((e) => e.daysLeft < 0).length);
  readonly pipelineValue = computed(() =>
    this.estimates()
      .filter((e) => e.status !== 'Approved')
      .reduce((s, e) => s + e.valueRaw, 0),
  );

  fmtCurrency(amount: number): string {
    if (amount >= 1_000_000) return '$' + (amount / 1_000_000).toFixed(1) + 'M';
    if (amount >= 1_000) return '$' + Math.round(amount / 1_000) + 'K';
    return '$' + amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  statusBadgeClass(status: EstimateStatus): string {
    switch (status) {
      case 'Draft': return 'bg-muted text-foreground-60';
      case 'Under Review': return 'bg-primary-20 text-primary';
      case 'Awaiting Approval': return 'bg-warning-20 text-warning';
      case 'Approved': return 'bg-success-20 text-success';
    }
  }

  dueDateClass(daysLeft: number): string {
    if (daysLeft < 0) return 'text-destructive font-medium';
    if (daysLeft <= 3) return 'text-warning font-medium';
    return 'text-foreground-40';
  }

  dateBadgeClass(daysLeft: number): string {
    if (daysLeft < 0) return 'bg-destructive-20 text-destructive';
    if (daysLeft <= 3) return 'bg-warning-20 text-warning';
    if (daysLeft <= 7) return 'bg-primary-20 text-primary';
    return 'bg-muted text-foreground-60';
  }

  monthAbbr(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '???';
    return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  dayOfMonth(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '?';
    return String(d.getDate());
  }
}
