import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { Project } from '../../../data/dashboard-data.types';

export interface BudgetRow {
  id: number;
  slug: string;
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
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-1 h-full min-h-0 overflow-y-auto p-4 mb-5">
      <div class="flex items-center justify-between px-1 mb-1">
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Project</modus-typography>
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Budget Used</modus-typography>
      </div>
      @for (row of rows(); track row.id) {
        <div class="flex flex-col gap-1.5 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="button" tabindex="0"
          (click)="rowClick.emit(row.slug)"
          (keydown.enter)="rowClick.emit(row.slug)">
          <div class="flex items-center justify-between gap-3">
            <modus-typography class="min-w-0 flex-1" hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ row.name }}</modus-typography>
            <modus-typography class="shrink-0" hierarchy="p" size="xs" className="text-foreground-60 tabular-nums">{{ row.budgetUsed }} / {{ row.budgetTotal }}</modus-typography>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div class="h-full rounded-full transition-all" [class]="row.barClass" [style.width.%]="row.budgetPct"></div>
            </div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" [className]="'tabular-nums w-10 text-right ' + row.statusClass">{{ row.budgetPct }}%</modus-typography>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeBudgetVarianceComponent {
  readonly projects = input.required<Project[]>();
  readonly rowClick = output<string>();

  readonly rows = computed<BudgetRow[]>(() =>
    this.projects()
      .map((p) => ({
        id: p.id,
        slug: p.slug,
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
