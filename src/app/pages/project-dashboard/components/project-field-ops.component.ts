import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Inspection, PunchListItem } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-project-field-ops',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-3 h-full min-h-0 overflow-y-auto p-4">
      <div class="flex flex-col gap-2">
        <div class="text-sm font-semibold text-foreground flex items-center gap-2">
          <i class="modus-icons text-base text-primary" aria-hidden="true">clipboard</i>
          Inspections
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
            <div class="text-lg font-bold text-success tabular-nums">{{ passCount() }}</div>
            <div class="text-2xs text-foreground-60">Passed</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-destructive-20 py-2">
            <div class="text-lg font-bold text-destructive tabular-nums">{{ failCount() }}</div>
            <div class="text-2xs text-foreground-60">Failed</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
            <div class="text-lg font-bold text-warning tabular-nums">{{ conditionalCount() }}</div>
            <div class="text-2xs text-foreground-60">Conditional</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-2">
            <div class="text-lg font-bold text-foreground tabular-nums">{{ pendingInspCount() }}</div>
            <div class="text-2xs text-foreground-60">Pending</div>
          </div>
        </div>
      </div>

      <div class="border-bottom-default"></div>

      <div class="flex flex-col gap-2">
        <div class="text-sm font-semibold text-foreground flex items-center gap-2">
          <i class="modus-icons text-base text-warning" aria-hidden="true">list_bulleted</i>
          Punch List
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-destructive-20 py-2">
            <div class="text-lg font-bold text-destructive tabular-nums">{{ openPunchCount() }}</div>
            <div class="text-2xs text-foreground-60">Open</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-warning-20 py-2">
            <div class="text-lg font-bold text-warning tabular-nums">{{ inProgressPunchCount() }}</div>
            <div class="text-2xs text-foreground-60">In Progress</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
            <div class="text-lg font-bold text-success tabular-nums">{{ completedPunchCount() }}</div>
            <div class="text-2xs text-foreground-60">Completed</div>
          </div>
          <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
            <div class="text-lg font-bold text-primary tabular-nums">{{ verifiedPunchCount() }}</div>
            <div class="text-2xs text-foreground-60">Verified</div>
          </div>
        </div>
      </div>

      <div class="border-bottom-default"></div>

      <div class="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        <div class="text-2xs font-medium text-foreground-60 mb-1">Recent failed inspections</div>
        @for (insp of failedInspections(); track insp.id) {
          <div class="flex items-center justify-between gap-2 py-1.5 border-bottom-default last:border-b-0 flex-shrink-0">
            <div class="flex flex-col gap-0.5 min-w-0 flex-1">
              <div class="text-xs font-medium text-foreground truncate">{{ insp.type }}</div>
              <div class="text-2xs text-foreground-40 truncate">{{ insp.notes }}</div>
            </div>
            <div class="text-2xs text-foreground-60 shrink-0">{{ insp.date }}</div>
          </div>
        }
        @if (failedInspections().length === 0) {
          <div class="text-xs text-foreground-40 text-center py-4">No failed inspections</div>
        }
      </div>
    </div>
  `,
})
export class ProjectFieldOpsComponent {
  readonly inspections = input.required<Inspection[]>();
  readonly punchListItems = input.required<PunchListItem[]>();

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
