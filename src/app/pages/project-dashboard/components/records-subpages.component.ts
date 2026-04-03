import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { EmptyStateComponent } from './empty-state.component';
import {
  itemStatusDot as getStatusDot,
  capitalizeStatus as getCapitalizedStatus,
} from '../../../data/dashboard-item-status';
import {
  weatherIcon as sharedWeatherIcon,
  inspectionResultBadge as sharedInspectionResultBadge,
  punchPriorityBadge as sharedPunchPriorityBadge,
} from '../../../data/dashboard-data';
import type {
  DailyReport,
  Inspection,
  PunchListItem,
  ProjectAttentionItem,
  WeatherForecast,
  InspectionResult,
} from '../../../data/dashboard-data';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-records-subpages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, EmptyStateComponent, TitleCasePipe],
  template: `
    @switch (activePage()) {
      @case ('daily-reports') {
        <div class="bg-card border-default rounded-lg p-4 flex justify-center gap-3 overflow-x-auto mb-2">
          @for (day of weatherForecast(); track day.date) {
            <div class="flex flex-col items-center gap-1 min-w-[72px] px-3 py-3 rounded-lg"
              [class]="day.workImpact === 'major' ? 'bg-destructive-20' : day.workImpact === 'minor' ? 'bg-warning-20' : 'bg-muted'">
              <div class="text-xs font-medium text-foreground">{{ day.day }}</div>
              <i class="modus-icons text-lg" aria-hidden="true">{{ weatherIcon(day.condition) }}</i>
              <div class="text-xs text-foreground-60">{{ day.highF }}F</div>
              @if (day.precipPct > 30) {
                <div class="text-2xs text-primary">{{ day.precipPct }}%</div>
              }
            </div>
          }
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (report of dailyReports(); track report.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="dailyReportClick.emit(report)" (keydown.enter)="dailyReportClick.emit(report)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="text-base font-semibold text-foreground">{{ report.date }}</div>
                  @if (report.safetyIncidents > 0) {
                    <modus-badge color="danger">Safety</modus-badge>
                  }
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="flex items-center gap-1.5 text-xs text-foreground-60">
                    <i class="modus-icons text-sm" aria-hidden="true">{{ weatherIcon(report.weather.split(',')[0].toLowerCase().trim()) }}</i>
                    <div>{{ report.weather }}</div>
                  </div>
                  <div class="flex items-center justify-between text-xs text-foreground-60">
                    <div class="flex items-center gap-1.5"><i class="modus-icons text-sm" aria-hidden="true">person</i>{{ report.author }}</div>
                    <div>{{ report.crewCount }} crew / {{ report.hoursWorked }} hrs</div>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="clipboard" title="No Daily Reports" description="No daily reports found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[100px_1fr_120px_80px_80px_60px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>Date</div><div>Author</div><div>Weather</div><div>Crew</div><div>Hours</div><div>Safety</div>
            </div>
            @for (report of dailyReports(); track report.id) {
              <div class="grid grid-cols-[100px_1fr_120px_80px_80px_60px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="dailyReportClick.emit(report)" (keydown.enter)="dailyReportClick.emit(report)">
                <div class="text-sm font-medium text-primary">{{ report.date }}</div>
                <div class="text-sm text-foreground truncate">{{ report.author }}</div>
                <div class="text-sm text-foreground-60 truncate">{{ report.weather }}</div>
                <div class="text-sm text-foreground-60">{{ report.crewCount }}</div>
                <div class="text-sm text-foreground-60">{{ report.hoursWorked }}</div>
                <div class="text-sm" [class]="report.safetyIncidents > 0 ? 'text-destructive font-medium' : 'text-foreground-60'">{{ report.safetyIncidents }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                <div class="text-sm">No Daily Reports for this project</div>
              </div>
            }
          </div>
        }
      }
      @case ('punch-items') {
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of punchItems(); track item.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="punchItemClick.emit(item)" (keydown.enter)="punchItemClick.emit(item)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="flex items-center gap-3">
                    <div class="text-base font-semibold text-foreground">{{ item.id }}</div>
                    <modus-badge [color]="punchPriorityBadge(item.priority)">{{ item.priority | titlecase }}</modus-badge>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full" [class]="statusDot(item.status)"></div>
                    <div class="text-xs font-medium text-foreground-60">{{ capitalize(item.status) }}</div>
                  </div>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="text-sm text-foreground line-clamp-2">{{ item.description }}</div>
                  <div class="flex items-center justify-between text-xs text-foreground-60">
                    <div>{{ item.location }}</div>
                    <div>{{ item.assignee }}</div>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="warning" title="No Punch Items" description="No punch list items found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>ID</div><div>Description</div><div>Location</div><div>Priority</div><div>Status</div><div>Assignee</div>
            </div>
            @for (item of punchItems(); track item.id) {
              <div class="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="punchItemClick.emit(item)" (keydown.enter)="punchItemClick.emit(item)">
                <div class="text-sm font-medium text-primary">{{ item.id }}</div>
                <div class="text-sm text-foreground truncate">{{ item.description }}</div>
                <div class="text-sm text-foreground-60 truncate">{{ item.location }}</div>
                <div><modus-badge [color]="punchPriorityBadge(item.priority)">{{ item.priority | titlecase }}</modus-badge></div>
                <div class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" [class]="statusDot(item.status)"></div>
                  <div class="text-xs text-foreground-60">{{ capitalize(item.status) }}</div>
                </div>
                <div class="text-sm text-foreground-60 truncate">{{ item.assignee }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">warning</i>
                <div class="text-sm">No Punch Items for this project</div>
              </div>
            }
          </div>
        }
      }
      @case ('inspections') {
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (insp of inspections(); track insp.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="inspectionClick.emit(insp)" (keydown.enter)="inspectionClick.emit(insp)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <div class="text-base font-semibold text-foreground">{{ insp.type }}</div>
                  <modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs text-foreground-60">
                    <div>{{ insp.inspector }}</div>
                    <div>{{ insp.date }}</div>
                  </div>
                  @if (insp.followUp) {
                    <div class="text-xs text-warning truncate">{{ insp.followUp }}</div>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="check_circle" title="No Inspections" description="No inspections found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_120px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>ID</div><div>Type</div><div>Date</div><div>Inspector</div><div>Result</div><div>Follow-up</div>
            </div>
            @for (insp of inspections(); track insp.id) {
              <div class="grid grid-cols-[80px_1fr_120px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="inspectionClick.emit(insp)" (keydown.enter)="inspectionClick.emit(insp)">
                <div class="text-sm font-medium text-primary">{{ insp.id }}</div>
                <div class="text-sm text-foreground truncate">{{ insp.type }}</div>
                <div class="text-sm text-foreground-60">{{ insp.date }}</div>
                <div class="text-sm text-foreground-60 truncate">{{ insp.inspector }}</div>
                <div><modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge></div>
                <div class="text-sm text-foreground-60 truncate">{{ insp.followUp || '--' }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">check_circle</i>
                <div class="text-sm">No Inspections for this project</div>
              </div>
            }
          </div>
        }
      }
      @case ('action-items') {
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of actionItems(); track item.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                tabindex="0" (click)="actionItemClick.emit(item)" (keydown.enter)="actionItemClick.emit(item)">
                <div class="px-5 py-4 flex items-center gap-3 border-bottom-default">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                    [class]="item.severity === 'critical' ? 'bg-destructive-20' : item.severity === 'warning' ? 'bg-warning-20' : 'bg-primary-20'">
                    <i class="modus-icons text-lg" aria-hidden="true"
                      [class]="item.severity === 'critical' ? 'text-destructive' : item.severity === 'warning' ? 'text-warning' : 'text-primary'">
                      {{ item.severity === 'critical' ? 'error' : item.severity === 'warning' ? 'warning' : 'info' }}
                    </i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-foreground truncate">{{ item.title }}</div>
                  </div>
                  <modus-badge [color]="severityBadgeColor(item.severity)">{{ item.category }}</modus-badge>
                </div>
                <div class="px-5 py-3">
                  <div class="text-sm text-foreground-60">{{ item.subtitle }}</div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="info" title="No Action Items" description="No action items requiring attention for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_2fr_100px] gap-3 px-5 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
              <div>Severity</div><div>Title</div><div>Description</div><div>Category</div>
            </div>
            @for (item of actionItems(); track item.id) {
              <div class="grid grid-cols-[80px_1fr_2fr_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="actionItemClick.emit(item)" (keydown.enter)="actionItemClick.emit(item)">
                <div><modus-badge [color]="severityBadgeColor(item.severity)">{{ item.severity | titlecase }}</modus-badge></div>
                <div class="text-sm font-medium text-foreground truncate">{{ item.title }}</div>
                <div class="text-sm text-foreground-60 truncate">{{ item.subtitle }}</div>
                <div class="text-xs text-foreground-60">{{ item.category }}</div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">info</i>
                <div class="text-sm">No Action Items for this project</div>
              </div>
            }
          </div>
        }
      }
    }
  `,
})
export class RecordsSubpagesComponent {
  readonly activePage = input.required<string>();
  readonly viewMode = input.required<ViewMode>();
  readonly dailyReports = input<DailyReport[]>([]);
  readonly punchItems = input<PunchListItem[]>([]);
  readonly inspections = input<Inspection[]>([]);
  readonly actionItems = input<ProjectAttentionItem[]>([]);
  readonly weatherForecast = input<WeatherForecast[]>([]);

  readonly dailyReportClick = output<DailyReport>();
  readonly punchItemClick = output<PunchListItem>();
  readonly inspectionClick = output<Inspection>();
  readonly actionItemClick = output<ProjectAttentionItem>();



  private static readonly SEVERITY_BADGE: Record<string, ModusBadgeColor> = {
    high: 'danger', medium: 'warning', low: 'secondary', critical: 'danger', warning: 'warning', info: 'primary',
  };

  weatherIcon(condition: string): string {
    return sharedWeatherIcon(condition);
  }

  statusDot(status: string): string { return getStatusDot(status); }
  capitalize(status: string): string { return getCapitalizedStatus(status); }

  punchPriorityBadge(priority: string): ModusBadgeColor { return sharedPunchPriorityBadge(priority); }
  inspectionResultBadge(result: InspectionResult): ModusBadgeColor { return sharedInspectionResultBadge(result); }

  severityBadgeColor(level: string): ModusBadgeColor {
    return RecordsSubpagesComponent.SEVERITY_BADGE[level] ?? 'secondary';
  }
}
