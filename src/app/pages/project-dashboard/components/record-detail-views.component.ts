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
import {
  weatherIcon as sharedWeatherIcon,
  coBadgeColor,
  contractStatusBadge as sharedContractStatusBadge,
  contractTypeLabel as sharedContractTypeLabel,
  contractTypeIcon,
  inspectionResultBadge as sharedInspectionResultBadge,
  formatCurrency as sharedFormatCurrency,
} from '../../../data/dashboard-data';
import type {
  DailyReport,
  Inspection,
  PunchListItem,
  ChangeOrder,
  Contract,
  InspectionResult,
  ChangeOrderStatus,
  ContractStatus,
  ContractType,
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
    @if (contract(); as ct) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">{{ contractIcon(ct.contractType) }}</i>
          </div>
          <div class="flex-1">
            <div class="text-xs text-foreground-60 uppercase tracking-wide">{{ contractTypeLabel(ct.contractType) }} {{ ct.id }}</div>
            <div class="text-xl font-bold text-foreground">{{ ct.title }}</div>
          </div>
          <modus-badge [color]="contractStatusBadge(ct.status)">{{ ct.status | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div class="text-xs text-foreground-60">Original Value</div><div class="text-lg font-bold text-foreground">{{ formatCurrency(ct.originalValue) }}</div></div>
            <div><div class="text-xs text-foreground-60">Revised Value</div><div class="text-lg font-bold" [class]="ct.revisedValue > ct.originalValue ? 'text-warning' : 'text-foreground'">{{ formatCurrency(ct.revisedValue) }}</div></div>
            <div><div class="text-xs text-foreground-60">Retainage</div><div class="text-sm font-medium text-foreground">{{ ct.retainage }}% ({{ formatCurrency(ct.revisedValue * ct.retainage / 100) }})</div></div>
            <div><div class="text-xs text-foreground-60">Vendor</div><div class="text-sm font-medium text-foreground">{{ ct.vendor }}</div></div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 border-top-default pt-4">
            <div><div class="text-xs text-foreground-60">Start Date</div><div class="text-sm text-foreground">{{ ct.startDate }}</div></div>
            <div><div class="text-xs text-foreground-60">End Date</div><div class="text-sm text-foreground">{{ ct.endDate }}</div></div>
            <div><div class="text-xs text-foreground-60">Project</div><div class="text-sm text-foreground">{{ ct.project }}</div></div>
          </div>
          <div class="border-top-default pt-4">
            <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Scope</div>
            <div class="text-sm text-foreground">{{ ct.scope }}</div>
          </div>
          @if (ct.linkedChangeOrderIds.length > 0) {
            <div class="border-top-default pt-4">
              <div class="text-xs text-foreground-60 uppercase tracking-wide mb-2">Linked Change Orders ({{ ct.linkedChangeOrderIds.length }})</div>
              <div class="flex flex-wrap gap-2">
                @for (coId of ct.linkedChangeOrderIds; track coId) {
                  <div class="bg-primary-20 text-primary text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer hover:bg-primary-40 transition-colors duration-150"
                    tabindex="0" (click)="linkedCoClick.emit(coId)" (keydown.enter)="linkedCoClick.emit(coId)">
                    <i class="modus-icons text-xs mr-1" aria-hidden="true">link</i>{{ coId }}
                  </div>
                }
              </div>
            </div>
          }
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
  readonly contract = input<Contract | null>(null);

  readonly statusChange = output<string>();
  readonly assigneeChange = output<string>();
  readonly linkedCoClick = output<string>();

  readonly PUNCH_STATUS_OPTIONS = PUNCH_STATUS_OPTIONS;
  readonly ASSIGNEE_OPTIONS = ASSIGNEE_OPTIONS;

  weatherIcon(condition: string): string {
    return sharedWeatherIcon(condition);
  }

  statusDot(status: string): string { return getStatusDot(status); }
  capitalize(status: string): string { return getCapitalizedStatus(status); }

  inspectionResultBadge(result: InspectionResult): ModusBadgeColor { return sharedInspectionResultBadge(result); }
  changeOrderStatusBadge(status: ChangeOrderStatus): ModusBadgeColor { return coBadgeColor(status); }
  contractStatusBadge(status: ContractStatus): ModusBadgeColor { return sharedContractStatusBadge(status); }
  contractTypeLabel(ct: ContractType): string { return sharedContractTypeLabel(ct); }
  contractIcon(ct: ContractType): string { return contractTypeIcon(ct); }
  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
