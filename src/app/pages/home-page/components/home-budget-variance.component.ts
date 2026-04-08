import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Project } from '../../../data/dashboard-data.types';

export interface BudgetRow {
  id: number;
  name: string;
  budgetPct: number;
  budgetUsed: string;
  budgetTotal: string;
  statusClass: string;
  barClass: string;
}

@Component({
  selector: 'app-home-budget-variance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-1 h-full min-h-0 overflow-y-auto p-4">
      <div class="flex items-center justify-between text-2xs text-foreground-60 font-medium px-1 mb-1">
        <div>Project</div>
        <div>Budget Used</div>
      </div>
      @for (row of rows(); track row.id) {
        <div class="flex flex-col gap-1.5 py-2 border-bottom-default last:border-b-0">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ row.name }}</div>
            <div class="text-xs tabular-nums text-foreground-60 shrink-0">{{ row.budgetUsed }} / {{ row.budgetTotal }}</div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all" [class]="row.barClass" [style.width.%]="row.budgetPct"></div>
            </div>
            <div class="text-xs font-semibold tabular-nums w-10 text-right" [class]="row.statusClass">{{ row.budgetPct }}%</div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeBudgetVarianceComponent {
  readonly projects = input.required<Project[]>();

  readonly rows = computed<BudgetRow[]>(() =>
    this.projects()
      .map((p) => ({
        id: p.id,
        name: p.name,
        budgetPct: p.budgetPct,
        budgetUsed: p.budgetUsed,
        budgetTotal: p.budgetTotal,
        statusClass: p.budgetPct > 90 ? 'text-destructive' : p.budgetPct > 75 ? 'text-warning' : 'text-success',
        barClass: p.budgetPct > 90 ? 'bg-destructive' : p.budgetPct > 75 ? 'bg-warning' : 'bg-success',
      }))
      .sort((a, b) => b.budgetPct - a.budgetPct),
  );
}
