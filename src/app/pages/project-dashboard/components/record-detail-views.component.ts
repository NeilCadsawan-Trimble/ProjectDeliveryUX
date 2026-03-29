import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { ItemDetailViewComponent } from '../../../shared/detail/item-detail-view.component';
import {
  PUNCH_STATUS_OPTIONS,
  ASSIGNEE_OPTIONS,
  itemStatusDot as getStatusDot,
  capitalizeStatus as getCapitalizedStatus,
  type StatusOption,
} from '../../../data/dashboard-item-status';
import type {
  DailyReport,
  Inspection,
  PunchListItem,
  ChangeOrder,
  InspectionResult,
  ChangeOrderStatus,
} from '../../../data/dashboard-data';

@Component({
  selector: 'app-record-detail-views',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, ItemDetailViewComponent, TitleCasePipe],
  template: `
    @if (dailyReport(); as report) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">clipboard</i>
          </div>
          <div>
            <div class="text-xs text-foreground-60 uppercase tracking-wide">Daily Report</div>
            <div class="text-xl font-bold text-foreground">{{ report.date }}</div>
          </div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div class="text-xs text-foreground-60">Author</div><div class="text-sm font-medium text-foreground">{{ report.author }}</div></div>
            <div><div class="text-xs text-foreground-60">Weather</div><div class="text-sm text-foreground flex items-center gap-1"><i class="modus-icons text-sm" aria-hidden="true">{{ weatherIcon(report.weather.split(',')[0].toLowerCase().trim()) }}</i>{{ report.weather }}</div></div>
            <div><div class="text-xs text-foreground-60">Crew Count</div><div class="text-sm font-medium text-foreground">{{ report.crewCount }}</div></div>
            <div><div class="text-xs text-foreground-60">Hours Worked</div><div class="text-sm font-medium text-foreground">{{ report.hoursWorked }}</div></div>
          </div>
          <div class="border-top-default pt-4">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Work Performed</div>
            <div class="text-sm text-foreground">{{ report.workPerformed }}</div>
          </div>
          @if (report.issues && report.issues !== 'None') {
            <div class="border-top-default pt-4">
              <div class="text-xs text-warning uppercase tracking-wide mb-2">Issues</div>
              <div class="text-sm text-foreground">{{ report.issues }}</div>
            </div>
          }
          <div class="border-top-default pt-4">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Safety Incidents</div>
            <div class="text-sm font-medium" [class]="report.safetyIncidents > 0 ? 'text-destructive' : 'text-success'">{{ report.safetyIncidents > 0 ? report.safetyIncidents + ' incident(s)' : 'None' }}</div>
          </div>
        </div>
      </div>
    }
    @if (inspection(); as insp) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">check_circle</i>
          </div>
          <div class="flex-1">
            <div class="text-xs text-foreground-60 uppercase tracking-wide">Inspection {{ insp.id }}</div>
            <div class="text-xl font-bold text-foreground">{{ insp.type }}</div>
          </div>
          <modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><div class="text-xs text-foreground-60">Inspector</div><div class="text-sm font-medium text-foreground">{{ insp.inspector }}</div></div>
            <div><div class="text-xs text-foreground-60">Date</div><div class="text-sm text-foreground">{{ insp.date }}</div></div>
            <div><div class="text-xs text-foreground-60">Project</div><div class="text-sm text-foreground">{{ insp.project }}</div></div>
          </div>
          <div class="border-top-default pt-4">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Notes</div>
            <div class="text-sm text-foreground">{{ insp.notes }}</div>
          </div>
          @if (insp.followUp) {
            <div class="border-top-default pt-4">
              <div class="text-xs text-warning uppercase tracking-wide mb-2">Follow-up Required</div>
              <div class="text-sm text-foreground">{{ insp.followUp }}</div>
            </div>
          }
        </div>
      </div>
    }
    @if (punchItem(); as punch) {
      <app-item-detail-view
        icon="warning"
        typeLabel="Punch Item"
        [number]="punch.id"
        [subject]="punch.description"
        [assignee]="punch.assignee"
        [assigneeOptions]="ASSIGNEE_OPTIONS"
        (assigneeChange)="assigneeChange.emit($event)"
        field1Label="Location"
        [field1Value]="punch.location"
        field3Label="Created"
        [field3Value]="punch.createdDate"
        [currentStatus]="punch.status"
        [statusOptions]="PUNCH_STATUS_OPTIONS"
        [statusDotClass]="statusDot(punch.status)"
        [statusText]="capitalize(punch.status)"
        (statusChange)="statusChange.emit($event)"
      />
    }
    @if (changeOrder(); as co) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">document</i>
          </div>
          <div class="flex-1">
            <div class="text-xs text-foreground-60 uppercase tracking-wide">Change Order {{ co.id }}</div>
            <div class="text-xl font-bold text-foreground">{{ co.description }}</div>
          </div>
          <modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div class="text-xs text-foreground-60">Amount</div><div class="text-lg font-bold text-foreground">{{ formatCurrency(co.amount) }}</div></div>
            <div><div class="text-xs text-foreground-60">Requested By</div><div class="text-sm font-medium text-foreground">{{ co.requestedBy }}</div></div>
            <div><div class="text-xs text-foreground-60">Date</div><div class="text-sm text-foreground">{{ co.requestDate }}</div></div>
            <div><div class="text-xs text-foreground-60">Project</div><div class="text-sm text-foreground">{{ co.project }}</div></div>
          </div>
          <div class="border-top-default pt-4">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Reason</div>
            <div class="text-sm text-foreground">{{ co.reason }}</div>
          </div>
        </div>
      </div>
    }
  `,
})
export class RecordDetailViewsComponent {
  readonly dailyReport = input<DailyReport | null>(null);
  readonly inspection = input<Inspection | null>(null);
  readonly punchItem = input<PunchListItem | null>(null);
  readonly changeOrder = input<ChangeOrder | null>(null);

  readonly statusChange = output<string>();
  readonly assigneeChange = output<string>();

  readonly PUNCH_STATUS_OPTIONS = PUNCH_STATUS_OPTIONS;
  readonly ASSIGNEE_OPTIONS = ASSIGNEE_OPTIONS;

  private static readonly WEATHER_ICON: Record<string, string> = {
    sunny: 'wb_sunny', clear: 'wb_sunny', cloudy: 'cloud', overcast: 'cloud',
    rain: 'water', rainy: 'water', storm: 'flash_on', thunderstorm: 'flash_on',
    snow: 'ac_unit', snowy: 'ac_unit', fog: 'blur_on', foggy: 'blur_on',
    'partly cloudy': 'cloud', windy: 'air', hot: 'wb_sunny',
  };

  weatherIcon(condition: string): string {
    return RecordDetailViewsComponent.WEATHER_ICON[condition.toLowerCase()] ?? 'cloud';
  }

  statusDot(status: string): string { return getStatusDot(status); }
  capitalize(status: string): string { return getCapitalizedStatus(status); }

  inspectionResultBadge(result: InspectionResult): ModusBadgeColor {
    if (result === 'pass') return 'success';
    if (result === 'fail') return 'danger';
    if (result === 'conditional') return 'warning';
    return 'secondary';
  }

  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'danger';
    return 'warning';
  }

  formatCurrency(value: number): string {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value.toLocaleString()}`;
  }
}
