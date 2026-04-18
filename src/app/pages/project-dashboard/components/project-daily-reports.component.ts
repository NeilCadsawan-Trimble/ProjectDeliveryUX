import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { DailyReport } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-project-daily-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 py-4">
      <div class="grid grid-cols-3 gap-2 shrink-0 px-4">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <modus-typography size="lg" weight="bold" className="text-primary tabular-nums">{{ totalReports() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Reports</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <modus-typography size="lg" weight="bold" className="text-success tabular-nums">{{ avgCrew() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Avg Crew</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg py-2"
          [class]="totalSafetyIncidents() > 0 ? 'bg-destructive-20' : 'bg-muted'">
          <modus-typography size="lg" weight="bold" [className]="'tabular-nums ' + (totalSafetyIncidents() > 0 ? 'text-destructive' : 'text-foreground')">{{ totalSafetyIncidents() }}</modus-typography>
          <modus-typography size="xs" className="text-foreground-60">Safety Incidents</modus-typography>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto px-4">
        @for (r of recentReports(); track r.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
            <div class="flex items-center justify-between gap-2">
              <modus-typography size="sm" weight="semibold" className="text-foreground">{{ r.date }}</modus-typography>
              <div class="flex items-center gap-1.5 shrink-0">
                @if (r.safetyIncidents > 0) {
                  <div class="flex items-center gap-1 rounded px-1.5 py-0.5 bg-destructive-20">
                    <i class="modus-icons text-xs text-destructive" aria-hidden="true">warning</i>
                    <modus-typography size="xs" weight="semibold" className="text-destructive">{{ r.safetyIncidents }}</modus-typography>
                  </div>
                }
                @if (r.issues !== 'None' && r.issues.length > 0) {
                  <i class="modus-icons text-sm text-warning" aria-hidden="true">warning</i>
                }
              </div>
            </div>
            <div class="flex items-center gap-3">
              <modus-typography size="xs" className="text-2xs text-foreground-60">{{ r.author }}</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography size="xs" className="text-2xs text-foreground-60">{{ r.crewCount }} crew</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography size="xs" className="text-2xs text-foreground-60">{{ r.hoursWorked }}h</modus-typography>
            </div>
            <modus-typography size="xs" className="text-foreground-60 truncate">{{ r.workPerformed }}</modus-typography>
          </div>
        }
        @if (recentReports().length === 0) {
          <modus-typography size="sm" className="text-foreground-40 text-center py-6">No daily reports</modus-typography>
        }
      </div>
    </div>
  `,
})
export class ProjectDailyReportsComponent {
  readonly dailyReports = input.required<DailyReport[]>();

  readonly recentReports = computed(() =>
    [...this.dailyReports()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15),
  );

  readonly totalReports = computed(() => this.dailyReports().length);
  readonly avgCrew = computed(() => {
    const reports = this.dailyReports();
    if (reports.length === 0) return 0;
    return Math.round(reports.reduce((s, r) => s + r.crewCount, 0) / reports.length);
  });
  readonly totalSafetyIncidents = computed(() => this.dailyReports().reduce((s, r) => s + r.safetyIncidents, 0));
}
