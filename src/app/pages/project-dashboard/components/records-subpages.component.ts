import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import { EmptyStateComponent } from './empty-state.component';
import {
  itemStatusDot as getStatusDot,
  capitalizeStatus as getCapitalizedStatus,
} from '../../../data/dashboard-item-status';
import {
  weatherIcon as sharedWeatherIcon,
  inspectionResultBadge as sharedInspectionResultBadge,
  punchPriorityBadge as sharedPunchPriorityBadge,
} from '../../../data/dashboard-data.formatters';
import type {
  DailyReport,
  Inspection,
  PunchListItem,
  ProjectAttentionItem,
  WeatherForecast,
  InspectionResult,
} from '../../../data/dashboard-data.types';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-records-subpages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, ModusTypographyComponent, EmptyStateComponent, TitleCasePipe],
  template: `
    @switch (activePage()) {
      @case ('daily-reports') {
        <div class="bg-card border-default rounded-lg p-4 flex justify-center gap-3 overflow-x-auto mb-2">
          @for (day of weatherForecast(); track day.date) {
            <div class="flex flex-col items-center gap-1 min-w-[72px] px-3 py-3 rounded-lg"
              [class]="day.workImpact === 'major' ? 'bg-destructive-20' : day.workImpact === 'minor' ? 'bg-warning-20' : 'bg-muted'">
              <modus-typography size="xs" weight="semibold" className="text-foreground">{{ day.day }}</modus-typography>
              <i class="modus-icons text-lg" aria-hidden="true">{{ weatherIcon(day.condition) }}</i>
              <modus-typography size="xs" className="text-foreground-60">{{ day.highF }}F</modus-typography>
              @if (day.precipPct > 30) {
                <modus-typography size="xs" className="text-primary">{{ day.precipPct }}%</modus-typography>
              }
            </div>
          }
        </div>
        @if (viewMode() === 'grid') {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (report of dailyReports(); track report.id) {
              <div class="bg-card border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer" tabindex="0" (click)="dailyReportClick.emit(report)" (keydown.enter)="dailyReportClick.emit(report)">
                <div class="px-5 py-4 flex items-center justify-between border-bottom-default">
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ report.date }}</modus-typography>
                  @if (report.safetyIncidents > 0) {
                    <modus-badge color="danger">Safety</modus-badge>
                  }
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="flex items-center gap-1.5 text-foreground-60">
                    <i class="modus-icons text-sm" aria-hidden="true">{{ weatherIcon(report.weather.split(',')[0].toLowerCase().trim()) }}</i>
                    <modus-typography size="xs" className="text-foreground-60">{{ report.weather }}</modus-typography>
                  </div>
                  <div class="flex items-center justify-between text-foreground-60">
                    <div class="flex items-center gap-1.5"><i class="modus-icons text-sm" aria-hidden="true">person</i><modus-typography size="xs" className="text-foreground-60">{{ report.author }}</modus-typography></div>
                    <modus-typography size="xs" className="text-foreground-60">{{ report.crewCount }} crew / {{ report.hoursWorked }} hrs</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="clipboard" title="No Daily Reports" description="No daily reports found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[100px_1fr_120px_80px_80px_60px] gap-3 px-5 py-3 bg-muted border-bottom-default">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Date</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Author</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Weather</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Crew</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Hours</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Safety</modus-typography>
            </div>
            @for (report of dailyReports(); track report.id) {
              <div class="grid grid-cols-[100px_1fr_120px_80px_80px_60px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="dailyReportClick.emit(report)" (keydown.enter)="dailyReportClick.emit(report)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ report.date }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ report.author }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ report.weather }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ report.crewCount }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ report.hoursWorked }}</modus-typography>
                <modus-typography size="sm" [weight]="report.safetyIncidents > 0 ? 'semibold' : 'normal'" [className]="report.safetyIncidents > 0 ? 'text-destructive' : 'text-foreground-60'">{{ report.safetyIncidents }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">clipboard</i>
                <modus-typography size="sm" className="text-foreground-40">No Daily Reports for this project</modus-typography>
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
                    <modus-typography size="md" weight="semibold" className="text-foreground">{{ item.id }}</modus-typography>
                    <modus-badge [color]="punchPriorityBadge(item.priority)">{{ item.priority | titlecase }}</modus-badge>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full" [class]="statusDot(item.status)"></div>
                    <modus-typography size="xs" weight="semibold" className="text-foreground-60">{{ capitalize(item.status) }}</modus-typography>
                  </div>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <modus-typography size="sm" className="text-foreground line-clamp-2">{{ item.description }}</modus-typography>
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="xs" className="text-foreground-60">{{ item.location }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">{{ item.assignee }}</modus-typography>
                  </div>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="warning" title="No Punch Items" description="No punch list items found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">ID</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Description</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Location</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Priority</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Status</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Assignee</modus-typography>
            </div>
            @for (item of punchItems(); track item.id) {
              <div class="grid grid-cols-[80px_1fr_120px_80px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="punchItemClick.emit(item)" (keydown.enter)="punchItemClick.emit(item)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ item.id }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ item.description }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ item.location }}</modus-typography>
                <div><modus-badge [color]="punchPriorityBadge(item.priority)">{{ item.priority | titlecase }}</modus-badge></div>
                <div class="flex items-center gap-1.5">
                  <div class="w-2 h-2 rounded-full" [class]="statusDot(item.status)"></div>
                  <modus-typography size="xs" className="text-foreground-60">{{ capitalize(item.status) }}</modus-typography>
                </div>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ item.assignee }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">warning</i>
                <modus-typography size="sm" className="text-foreground-40">No Punch Items for this project</modus-typography>
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
                  <modus-typography size="md" weight="semibold" className="text-foreground">{{ insp.type }}</modus-typography>
                  <modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge>
                </div>
                <div class="px-5 py-4 flex flex-col gap-2">
                  <div class="flex items-center justify-between text-foreground-60">
                    <modus-typography size="xs" className="text-foreground-60">{{ insp.inspector }}</modus-typography>
                    <modus-typography size="xs" className="text-foreground-60">{{ insp.date }}</modus-typography>
                  </div>
                  @if (insp.followUp) {
                    <modus-typography size="xs" className="text-warning truncate">{{ insp.followUp }}</modus-typography>
                  }
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="check_circle" title="No Inspections" description="No inspections found for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_120px_100px_100px_100px] gap-3 px-5 py-3 bg-muted border-bottom-default">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">ID</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Type</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Date</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Inspector</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Result</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Follow-up</modus-typography>
            </div>
            @for (insp of inspections(); track insp.id) {
              <div class="grid grid-cols-[80px_1fr_120px_100px_100px_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="inspectionClick.emit(insp)" (keydown.enter)="inspectionClick.emit(insp)">
                <modus-typography size="sm" weight="semibold" className="text-primary">{{ insp.id }}</modus-typography>
                <modus-typography size="sm" className="text-foreground truncate">{{ insp.type }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60">{{ insp.date }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ insp.inspector }}</modus-typography>
                <div><modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge></div>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ insp.followUp || '--' }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">check_circle</i>
                <modus-typography size="sm" className="text-foreground-40">No Inspections for this project</modus-typography>
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
                    <modus-typography size="sm" weight="semibold" className="text-foreground truncate">{{ item.title }}</modus-typography>
                  </div>
                  <modus-badge [color]="severityBadgeColor(item.severity)">{{ item.category }}</modus-badge>
                </div>
                <div class="px-5 py-3">
                  <modus-typography size="sm" className="text-foreground-60">{{ item.subtitle }}</modus-typography>
                </div>
              </div>
            } @empty {
              <app-empty-state extraClass="col-span-full" icon="info" title="No Action Items" description="No action items requiring attention for this project." />
            }
          </div>
        } @else {
          <div class="bg-card border-default rounded-lg overflow-hidden">
            <div class="grid grid-cols-[80px_1fr_2fr_100px] gap-3 px-5 py-3 bg-muted border-bottom-default">
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Severity</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Title</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Description</modus-typography>
              <modus-typography size="xs" weight="semibold" className="text-foreground-60 uppercase tracking-wide">Category</modus-typography>
            </div>
            @for (item of actionItems(); track item.id) {
              <div class="grid grid-cols-[80px_1fr_2fr_100px] gap-3 px-5 py-3.5 border-bottom-default last:border-b-0 items-center hover:bg-muted transition-colors duration-150 cursor-pointer"
                tabindex="0" (click)="actionItemClick.emit(item)" (keydown.enter)="actionItemClick.emit(item)">
                <div><modus-badge [color]="severityBadgeColor(item.severity)">{{ item.severity | titlecase }}</modus-badge></div>
                <modus-typography size="sm" weight="semibold" className="text-foreground truncate">{{ item.title }}</modus-typography>
                <modus-typography size="sm" className="text-foreground-60 truncate">{{ item.subtitle }}</modus-typography>
                <modus-typography size="xs" className="text-foreground-60">{{ item.category }}</modus-typography>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center py-10 text-foreground-40">
                <i class="modus-icons text-3xl mb-2" aria-hidden="true">info</i>
                <modus-typography size="sm" className="text-foreground-40">No Action Items for this project</modus-typography>
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
