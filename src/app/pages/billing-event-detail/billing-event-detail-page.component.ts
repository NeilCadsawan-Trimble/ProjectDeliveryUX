import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
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
  imports: [ModusBadgeComponent, ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
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
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-primary" aria-hidden="true">invoice</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ ev.description }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">Billing Event</modus-typography>
                </div>
              </div>
              <modus-badge [color]="statusColor()">{{ ev.status }}</modus-badge>
            </div>

            <div class="px-6 py-6 flex flex-col gap-6">
              <!-- KPI row 1: 4 cols -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(ev.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Billing Date</div>
                  <modus-typography hierarchy="p" size="md">{{ ev.billingDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Period</div>
                  <modus-typography hierarchy="p" size="md">{{ ev.period }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Status</div>
                  <modus-typography hierarchy="p" size="md" className="capitalize">{{ ev.status }}</modus-typography>
                </div>
              </div>

              <!-- KPI row 2: 2 cols -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="detail-field-label">Linked Invoice</div>
                  <modus-typography hierarchy="p" size="md">{{ ev.invoiceId || 'None' }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Project ID</div>
                  <modus-typography hierarchy="p" size="md">{{ ev.projectId }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Billing Schedule -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">calendar</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Billing Schedule</modus-typography>
            </div>
            @if (schedule()) {
              <div class="px-6 py-6">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <div class="detail-field-label">Frequency</div>
                    <modus-typography hierarchy="p" size="md" className="capitalize">{{ schedule()!.frequency }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Next Billing Date</div>
                    <modus-typography hierarchy="p" size="md">{{ schedule()!.nextBillingDate }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Last Billed Date</div>
                    <modus-typography hierarchy="p" size="md">{{ schedule()!.lastBilledDate }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Last Billed Amount</div>
                    <modus-typography hierarchy="p" size="md" weight="semibold">{{ formatCurrency(schedule()!.lastBilledAmount) }}</modus-typography>
                  </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div class="detail-field-label">Contract Value</div>
                    <modus-typography hierarchy="p" size="md" weight="semibold">{{ formatCurrency(schedule()!.contractValue) }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Total Billed</div>
                    <modus-typography hierarchy="p" size="md" weight="semibold">{{ formatCurrency(schedule()!.totalBilled) }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Total Remaining</div>
                    <modus-typography hierarchy="p" size="md" weight="semibold">{{ formatCurrency(schedule()!.totalRemaining) }}</modus-typography>
                  </div>
                  <div>
                    <div class="detail-field-label">Billing Contact</div>
                    <modus-typography hierarchy="p" size="md">{{ schedule()!.billingContact }}</modus-typography>
                  </div>
                </div>
              </div>
            } @else {
              <div class="px-6 py-8 text-center text-foreground-40">
                <modus-typography hierarchy="p" size="sm">No billing schedule found for this project</modus-typography>
              </div>
            }
          </div>
        </modus-card>
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
