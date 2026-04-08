import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="grid grid-cols-3 gap-2 shrink-0">
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-primary-20 py-2">
          <div class="text-lg font-bold text-primary tabular-nums">{{ totalCrew() }}</div>
          <div class="text-2xs text-foreground-60">Total Crew</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg bg-success-20 py-2">
          <div class="text-lg font-bold text-success tabular-nums">{{ totalHours() }}</div>
          <div class="text-2xs text-foreground-60">Total Hours</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 rounded-lg py-2"
          [class]="totalSafetyIncidents() > 0 ? 'bg-destructive-20' : 'bg-muted'">
          <div class="text-lg font-bold tabular-nums" [class]="totalSafetyIncidents() > 0 ? 'text-destructive' : 'text-foreground'">{{ totalSafetyIncidents() }}</div>
          <div class="text-2xs text-foreground-60">Safety Incidents</div>
        </div>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @for (row of latestReports(); track row.id) {
          <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            (click)="reportClick.emit({ projectId: row.projectId, reportId: row.id })"
            (keydown.enter)="reportClick.emit({ projectId: row.projectId, reportId: row.id })">
            <div class="flex items-center justify-between gap-2">
              <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ row.project }}</div>
              <div class="flex items-center gap-1.5 shrink-0">
                @if (row.hasSafetyIncidents) {
                  <div class="flex items-center gap-1 rounded px-1.5 py-0.5 bg-destructive-20">
                    <i class="modus-icons text-xs text-destructive" aria-hidden="true">warning</i>
                    <div class="text-2xs font-medium text-destructive">{{ row.safetyIncidents }}</div>
                  </div>
                }
                @if (row.hasIssues) {
                  <i class="modus-icons text-sm text-warning" aria-hidden="true">warning</i>
                }
              </div>
            </div>
            <div class="flex items-center gap-3 text-2xs text-foreground-60">
              <div>{{ row.date }}</div>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <div>{{ row.crewCount }} crew</div>
              <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
              <div>{{ row.hoursWorked }}h</div>
            </div>
            <div class="text-xs text-foreground-60 truncate">{{ row.workPerformed }}</div>
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
