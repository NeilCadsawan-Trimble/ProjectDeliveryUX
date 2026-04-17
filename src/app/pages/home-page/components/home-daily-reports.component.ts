import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { DailyReport } from '../../../data/dashboard-data.types';

export interface DailyReportRow {
  id: string;
  projectId: number;
  project: string;
  date: string;
  author: string;
  crewCount: number;
  hoursWorked: number;
  workPerformed: string;
  hasSafetyIncidents: boolean;
  safetyIncidents: number;
  hasIssues: boolean;
}

@Component({
  selector: 'app-home-daily-reports',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="grid grid-cols-3 gap-2 shrink-0">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-primary tabular-nums">{{ totalCrew() }}</modus-typography>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total Crew</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <modus-typography hierarchy="h2" size="lg" weight="bold" className="text-success tabular-nums">{{ totalHours() }}</modus-typography>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Total Hours</modus-typography>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg py-2"
          [class]="totalSafetyIncidents() > 0 ? 'bg-destructive-20' : 'bg-muted'">
          <modus-typography hierarchy="h2" size="lg" weight="bold" [className]="'tabular-nums ' + (totalSafetyIncidents() > 0 ? 'text-destructive' : 'text-foreground')">{{ totalSafetyIncidents() }}</modus-typography>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Safety Incidents</modus-typography>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (row of latestReports(); track row.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="reportClick.emit({ projectId: row.projectId, reportId: row.id })"
            (keydown.enter)="reportClick.emit({ projectId: row.projectId, reportId: row.id })">
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1 truncate">
                <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ row.project }}</modus-typography>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                @if (row.hasSafetyIncidents) {
                  <div class="flex items-center gap-1 rounded px-1.5 py-0.5 bg-destructive-20">
                    <i class="modus-icons text-xs text-destructive" aria-hidden="true">warning</i>
                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ row.safetyIncidents }}</modus-typography>
                  </div>
                }
                @if (row.hasIssues) {
                  <i class="modus-icons text-sm text-warning" aria-hidden="true">warning</i>
                }
              </div>
            </div>
            <div class="flex items-center gap-3">
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ row.date }}</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ row.crewCount }} crew</modus-typography>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ row.hoursWorked }}h</modus-typography>
            </div>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ row.workPerformed }}</modus-typography>
          </div>
        }
      </div>
    </div>
  `,
})
export class HomeDailyReportsComponent {
  readonly dailyReports = input.required<DailyReport[]>();
  readonly reportClick = output<{ projectId: number; reportId: string }>();

  readonly latestReports = computed<DailyReportRow[]>(() => {
    const reports = this.dailyReports();
    const byProject = new Map<number, DailyReport>();
    for (const r of [...reports].sort((a, b) => b.date.localeCompare(a.date))) {
      if (!byProject.has(r.projectId)) byProject.set(r.projectId, r);
    }
    return [...byProject.values()].map((r) => ({
      id: r.id,
      projectId: r.projectId,
      project: r.project,
      date: r.date,
      author: r.author,
      crewCount: r.crewCount,
      hoursWorked: r.hoursWorked,
      workPerformed: r.workPerformed,
      hasSafetyIncidents: r.safetyIncidents > 0,
      safetyIncidents: r.safetyIncidents,
      hasIssues: r.issues.length > 0 && r.issues !== 'None',
    }));
  });

  readonly totalCrew = computed(() => this.latestReports().reduce((s, r) => s + r.crewCount, 0));
  readonly totalHours = computed(() => this.latestReports().reduce((s, r) => s + r.hoursWorked, 0));
  readonly totalSafetyIncidents = computed(() => this.latestReports().reduce((s, r) => s + r.safetyIncidents, 0));
}
