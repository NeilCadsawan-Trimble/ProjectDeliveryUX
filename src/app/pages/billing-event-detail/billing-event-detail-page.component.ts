import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { ModusBadgeColor } from '../../components/modus-badge.component';
import type { BillingEvent, BillingEventStatus, BillingSchedule } from '../../data/dashboard-data.types';
import { formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

function billingStatusBadgeColor(status: BillingEventStatus): ModusBadgeColor {
  if (status === 'completed') return 'success';
  if (status === 'skipped') return 'warning';
  return 'secondary';
}

@Component({
  selector: 'app-billing-event-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!event()"
      [backLabel]="backLabel"
      emptyIcon="invoice"
      emptyTitle="Billing Event Not Found"
      emptyMessage="The requested billing event could not be found."
      (back)="goBack()"
    >
      @if (event(); as ev) {
        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">invoice</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ ev.description }}</div>
                <div class="text-sm text-foreground-60">Billing Event</div>
              </div>
            </div>
            <modus-badge [color]="statusColor()">{{ ev.status }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <!-- KPI row 1: 4 cols -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(ev.amount) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Billing Date</div>
                <div class="text-base text-foreground">{{ ev.billingDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Period</div>
                <div class="text-base text-foreground">{{ ev.period }}</div>
              </div>
              <div>
                <div class="detail-field-label">Status</div>
                <div class="text-base text-foreground capitalize">{{ ev.status }}</div>
              </div>
            </div>

            <!-- KPI row 2: 2 cols -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="detail-field-label">Linked Invoice</div>
                <div class="text-base text-foreground">{{ ev.invoiceId || 'None' }}</div>
              </div>
              <div>
                <div class="detail-field-label">Project ID</div>
                <div class="text-base text-foreground">{{ ev.projectId }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Billing Schedule -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
            <div class="text-base font-semibold text-foreground">Billing Schedule</div>
          </div>
          @if (schedule()) {
            <div class="px-6 py-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <div class="detail-field-label">Frequency</div>
                  <div class="text-base text-foreground capitalize">{{ schedule()!.frequency }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Next Billing Date</div>
                  <div class="text-base text-foreground">{{ schedule()!.nextBillingDate }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Last Billed Date</div>
                  <div class="text-base text-foreground">{{ schedule()!.lastBilledDate }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Last Billed Amount</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.lastBilledAmount) }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Contract Value</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.contractValue) }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Total Billed</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.totalBilled) }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Total Remaining</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.totalRemaining) }}</div>
                </div>
                <div>
                  <div class="detail-field-label">Billing Contact</div>
                  <div class="text-base text-foreground">{{ schedule()!.billingContact }}</div>
                </div>
              </div>
            </div>
          } @else {
            <div class="px-6 py-8 text-center text-foreground-40">
              <div class="text-sm">No billing schedule found for this project</div>
            </div>
          }
        </div>
      }
    </app-detail-page-layout>
  `,
})
export class BillingEventDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly eventId = routeParamSignal('id');

  readonly event = computed<BillingEvent | null>(() => {
    const id = this.eventId();
    return this.store.billingEvents().find(ev => ev.id === id) ?? null;
  });

  readonly schedule = computed<BillingSchedule | null>(() => {
    const ev = this.event();
    if (!ev) return null;
    return this.store.billingSchedules().find(bs => bs.projectId === ev.projectId) ?? null;
  });

  readonly statusColor = computed(() => {
    const ev = this.event();
    return ev ? billingStatusBadgeColor(ev.status) : 'secondary';
  });

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
