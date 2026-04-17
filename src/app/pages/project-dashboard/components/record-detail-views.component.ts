import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ModusBadgeComponent, type ModusBadgeColor } from '../../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
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
} from '../../../data/dashboard-data.formatters';
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
} from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-record-detail-views',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, ModusTypographyComponent, ItemDetailViewComponent, TitleCasePipe],
  template: `
    @if (dailyReport(); as report) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">clipboard</i>
          </div>
          <div class="flex-1">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide">Daily Report</modus-typography>
            <modus-typography size="xl" weight="bold" className="text-foreground">{{ report.date }}</modus-typography>
          </div>
          <div
            class="w-9 h-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Open in new tab"
            (click)="openInNewTab.emit()" (keydown.enter)="openInNewTab.emit()"
          >
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">launch</i>
          </div>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><modus-typography size="xs" className="text-foreground-60">Author</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ report.author }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Weather</modus-typography><div class="flex items-center gap-1"><i class="modus-icons text-sm" aria-hidden="true">{{ weatherIcon(report.weather.split(',')[0].toLowerCase().trim()) }}</i><modus-typography size="sm" className="text-foreground">{{ report.weather }}</modus-typography></div></div>
            <div><modus-typography size="xs" className="text-foreground-60">Crew Count</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ report.crewCount }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Hours Worked</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ report.hoursWorked }}</modus-typography></div>
          </div>
          <div class="border-top-default pt-4">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Work Performed</modus-typography>
            <modus-typography size="sm" className="text-foreground">{{ report.workPerformed }}</modus-typography>
          </div>
          @if (report.issues && report.issues !== 'None') {
            <div class="border-top-default pt-4">
              <modus-typography size="xs" className="text-warning uppercase tracking-wide mb-2">Issues</modus-typography>
              <modus-typography size="sm" className="text-foreground">{{ report.issues }}</modus-typography>
            </div>
          }
          <div class="border-top-default pt-4">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Safety Incidents</modus-typography>
            <modus-typography size="sm" weight="semibold" [className]="report.safetyIncidents > 0 ? 'text-destructive' : 'text-success'">{{ report.safetyIncidents > 0 ? report.safetyIncidents + ' incident(s)' : 'None' }}</modus-typography>
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
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide">Inspection {{ insp.id }}</modus-typography>
            <modus-typography size="xl" weight="bold" className="text-foreground">{{ insp.type }}</modus-typography>
          </div>
          <div
            class="w-9 h-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Open in new tab"
            (click)="openInNewTab.emit()" (keydown.enter)="openInNewTab.emit()"
          >
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">launch</i>
          </div>
          <modus-badge [color]="inspectionResultBadge(insp.result)">{{ insp.result | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><modus-typography size="xs" className="text-foreground-60">Inspector</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ insp.inspector }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Date</modus-typography><modus-typography size="sm" className="text-foreground">{{ insp.date }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Project</modus-typography><modus-typography size="sm" className="text-foreground">{{ insp.project }}</modus-typography></div>
          </div>
          <div class="border-top-default pt-4">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Notes</modus-typography>
            <modus-typography size="sm" className="text-foreground">{{ insp.notes }}</modus-typography>
          </div>
          @if (insp.followUp) {
            <div class="border-top-default pt-4">
              <modus-typography size="xs" className="text-warning uppercase tracking-wide mb-2">Follow-up Required</modus-typography>
              <modus-typography size="sm" className="text-foreground">{{ insp.followUp }}</modus-typography>
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
        (openInNewTab)="openInNewTab.emit()"
      />
    }
    @if (changeOrder(); as co) {
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-20">
            <i class="modus-icons text-xl text-primary" aria-hidden="true">document</i>
          </div>
          <div class="flex-1">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide">Change Order {{ co.id }}</modus-typography>
            <modus-typography size="xl" weight="bold" className="text-foreground">{{ co.description }}</modus-typography>
          </div>
          <div
            class="w-9 h-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Open in new tab"
            (click)="openInNewTab.emit()" (keydown.enter)="openInNewTab.emit()"
          >
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">launch</i>
          </div>
          <modus-badge [color]="changeOrderStatusBadge(co.status)">{{ co.status | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><modus-typography size="xs" className="text-foreground-60">Amount</modus-typography><modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(co.amount) }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Requested By</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ co.requestedBy }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Date</modus-typography><modus-typography size="sm" className="text-foreground">{{ co.requestDate }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Project</modus-typography><modus-typography size="sm" className="text-foreground">{{ co.project }}</modus-typography></div>
          </div>
          <div class="border-top-default pt-4">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Reason</modus-typography>
            <modus-typography size="sm" className="text-foreground">{{ co.reason }}</modus-typography>
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
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide">{{ contractTypeLabel(ct.contractType) }} {{ ct.id }}</modus-typography>
            <modus-typography size="xl" weight="bold" className="text-foreground">{{ ct.title }}</modus-typography>
          </div>
          <div
            class="w-9 h-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0" aria-label="Open in new tab"
            (click)="openInNewTab.emit()" (keydown.enter)="openInNewTab.emit()"
          >
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">launch</i>
          </div>
          <modus-badge [color]="contractStatusBadge(ct.status)">{{ ct.status | titlecase }}</modus-badge>
        </div>
        <div class="bg-card border-default rounded-lg p-5 flex flex-col gap-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><modus-typography size="xs" className="text-foreground-60">Original Value</modus-typography><modus-typography size="lg" weight="bold" className="text-foreground">{{ formatCurrency(ct.originalValue) }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Revised Value</modus-typography><modus-typography size="lg" weight="bold" [className]="ct.revisedValue > ct.originalValue ? 'text-warning' : 'text-foreground'">{{ formatCurrency(ct.revisedValue) }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Retainage</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ ct.retainage }}% ({{ formatCurrency(ct.revisedValue * ct.retainage / 100) }})</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Vendor</modus-typography><modus-typography size="sm" weight="semibold" className="text-foreground">{{ ct.vendor }}</modus-typography></div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 border-top-default pt-4">
            <div><modus-typography size="xs" className="text-foreground-60">Start Date</modus-typography><modus-typography size="sm" className="text-foreground">{{ ct.startDate }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">End Date</modus-typography><modus-typography size="sm" className="text-foreground">{{ ct.endDate }}</modus-typography></div>
            <div><modus-typography size="xs" className="text-foreground-60">Project</modus-typography><modus-typography size="sm" className="text-foreground">{{ ct.project }}</modus-typography></div>
          </div>
          <div class="border-top-default pt-4">
            <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Scope</modus-typography>
            <modus-typography size="sm" className="text-foreground">{{ ct.scope }}</modus-typography>
          </div>
          @if (ct.linkedChangeOrderIds.length > 0) {
            <div class="border-top-default pt-4">
              <modus-typography size="xs" className="text-foreground-60 uppercase tracking-wide mb-2">Linked Change Orders ({{ ct.linkedChangeOrderIds.length }})</modus-typography>
              <div class="flex flex-wrap gap-2">
                @for (coId of ct.linkedChangeOrderIds; track coId) {
                  <div class="bg-primary-20 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-primary-40 transition-colors duration-150 flex items-center"
                    tabindex="0" (click)="linkedCoClick.emit(coId)" (keydown.enter)="linkedCoClick.emit(coId)">
                    <i class="modus-icons text-xs text-primary mr-1" aria-hidden="true">link</i><modus-typography size="xs" weight="semibold" className="text-primary">{{ coId }}</modus-typography>
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
  readonly openInNewTab = output<void>();

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
