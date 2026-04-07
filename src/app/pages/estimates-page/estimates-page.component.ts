import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Estimate } from '../../data/dashboard-data';
import { ESTIMATES } from '../../data/dashboard-data';

@Component({
  selector: 'app-estimates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto">
      <div class="mb-6">
        <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Estimates</div>
        <div class="text-sm text-foreground-60 mt-1">All bids and proposals across your portfolio</div>
      </div>

      <div class="bg-card border-default rounded-lg overflow-hidden">
        <div class="grid grid-cols-[minmax(0,1.2fr)_1fr_1fr_1fr_minmax(0,1fr)_1fr_1fr] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide" role="row">
          <div role="columnheader">ID</div>
          <div role="columnheader">Project</div>
          <div role="columnheader">Client</div>
          <div role="columnheader">Type</div>
          <div role="columnheader">Value</div>
          <div role="columnheader">Status</div>
          <div role="columnheader">Due</div>
        </div>
        <div class="overflow-x-auto" role="table" aria-label="Estimates list">
          @for (e of estimates; track e.id) {
            <div
              class="grid grid-cols-[minmax(0,1.2fr)_1fr_1fr_1fr_minmax(0,1fr)_1fr_1fr] gap-3 px-5 py-4 border-bottom-default last:border-b-0 items-center min-w-[720px] hover:bg-muted transition-colors duration-150"
              role="row"
            >
              <div class="text-sm font-medium text-primary" role="cell">{{ e.id }}</div>
              <div class="text-sm text-foreground truncate" role="cell">{{ e.project }}</div>
              <div class="text-sm text-foreground-60 truncate" role="cell">{{ e.client }}</div>
              <div class="text-xs text-foreground-80" role="cell">{{ e.type }}</div>
              <div class="text-sm font-medium text-foreground" role="cell">{{ e.value }}</div>
              <div role="cell">
                <div class="text-xs font-semibold px-2 py-0.5 rounded-full inline-block {{ statusClass(e.status) }}">
                  {{ e.status }}
                </div>
              </div>
              <div class="text-sm text-foreground-60" role="cell">{{ e.dueDate }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class EstimatesPageComponent {
  readonly estimates: Estimate[] = ESTIMATES;

  statusClass(status: Estimate['status']): string {
    switch (status) {
      case 'Draft':
        return 'bg-secondary text-secondary-foreground';
      case 'Under Review':
        return 'bg-warning-20 text-warning';
      case 'Awaiting Approval':
        return 'bg-primary-20 text-primary';
      case 'Approved':
        return 'bg-success-20 text-success';
      default:
        return 'bg-muted text-foreground-60';
    }
  }
}
