import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { Inspection, PunchListItem } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-field-ops',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-3 h-full min-h-0 overflow-y-auto py-4">
      <div class="flex flex-col gap-2 px-4">
        <div class="flex items-center gap-2">
          <i class="modus-icons text-base text-primary" aria-hidden="true">clipboard</i>
          <modus-typography hierarchy="h3" size="sm" weight="semibold" className="text-foreground">Inspections</modus-typography>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success tabular-nums">{{ passCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Passed</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-destructive-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-destructive tabular-nums">{{ failCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Failed</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-warning tabular-nums">{{ conditionalCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Conditional</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-foreground tabular-nums">{{ pendingInspCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Pending</modus-typography>
          </div>
        </div>
      </div>

      <div class="border-bottom-default mx-4"></div>

      <div class="flex flex-col gap-2 px-4">
        <div class="flex items-center gap-2">
          <i class="modus-icons text-base text-warning" aria-hidden="true">list_bulleted</i>
          <modus-typography hierarchy="h3" size="sm" weight="semibold" className="text-foreground">Punch List</modus-typography>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-destructive-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-destructive tabular-nums">{{ openPunchCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Open</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-warning tabular-nums">{{ inProgressPunchCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">In Progress</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success tabular-nums">{{ completedPunchCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Completed</modus-typography>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
            <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-primary tabular-nums">{{ verifiedPunchCount() }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Verified</modus-typography>
          </div>
        </div>
      </div>

      <div class="border-bottom-default mx-4"></div>

      <div class="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto px-4">
        <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60 mb-1">Recent failed inspections</modus-typography>
        @for (insp of failedInspections(); track insp.id) {
          <div class="flex items-center justify-between gap-2 py-1.5 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="inspectionClick.emit({ projectId: insp.projectId, inspectionId: insp.id })"
            (keydown.enter)="inspectionClick.emit({ projectId: insp.projectId, inspectionId: insp.id })">
            <div class="flex flex-col gap-0.5 min-w-0 flex-1">
              <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground truncate">{{ insp.type }} -- {{ insp.project }}</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ insp.notes }}</modus-typography>
            </div>
            <modus-typography class="shrink-0" hierarchy="p" size="xs" className="text-foreground-60">{{ insp.date }}</modus-typography>
          </div>
        }
        @if (failedInspections().length === 0) {
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40 text-center py-4">No failed inspections</modus-typography>
        }
      </div>
    </div>
  `,
})
export class HomeFieldOpsComponent {
  readonly inspections = input.required<Inspection[]>();
  readonly punchListItems = input.required<PunchListItem[]>();
  readonly inspectionClick = output<{ projectId: number; inspectionId: string }>();

  readonly passCount = computed(() => this.inspections().filter((i) => i.result === 'pass').length);
  readonly failCount = computed(() => this.inspections().filter((i) => i.result === 'fail').length);
  readonly conditionalCount = computed(() => this.inspections().filter((i) => i.result === 'conditional').length);
  readonly pendingInspCount = computed(() => this.inspections().filter((i) => i.result === 'pending').length);
  readonly failedInspections = computed(() => this.inspections().filter((i) => i.result === 'fail').slice(0, 5));

  readonly openPunchCount = computed(() => this.punchListItems().filter((p) => p.status === 'open').length);
  readonly inProgressPunchCount = computed(() => this.punchListItems().filter((p) => p.status === 'in-progress').length);
  readonly completedPunchCount = computed(() => this.punchListItems().filter((p) => p.status === 'completed').length);
  readonly verifiedPunchCount = computed(() => this.punchListItems().filter((p) => p.status === 'verified').length);
}
