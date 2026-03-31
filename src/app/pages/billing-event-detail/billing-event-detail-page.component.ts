import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { ModusBadgeColor } from '../../components/modus-badge.component';
import type { BillingEvent, BillingEventStatus, BillingSchedule } from '../../data/dashboard-data';
import { BILLING_EVENTS, BILLING_SCHEDULES, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

function billingStatusBadgeColor(status: BillingEventStatus): ModusBadgeColor {
  if (status === 'completed') return 'success';
  if (status === 'skipped') return 'warning';
  return 'secondary';
}

@Component({
  selector: 'app-billing-event-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (event()) {
        <div
          class="flex items-center gap-2 mb-6 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150"
          role="button" tabindex="0"
          (click)="goBack()"
          (keydown.enter)="goBack()"
        >
          <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
          <div class="text-sm font-medium">{{ backLabel }}</div>
        </div>

        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">invoice</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ event()!.description }}</div>
                <div class="text-sm text-foreground-60">Billing Event</div>
              </div>
            </div>
            <modus-badge [color]="statusColor()">{{ event()!.status }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <!-- KPI row 1: 4 cols -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(event()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Billing Date</div>
                <div class="text-base text-foreground">{{ event()!.billingDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Period</div>
                <div class="text-base text-foreground">{{ event()!.period }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Status</div>
                <div class="text-base text-foreground capitalize">{{ event()!.status }}</div>
              </div>
            </div>

            <!-- KPI row 2: 2 cols -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Linked Invoice</div>
                <div class="text-base text-foreground">{{ event()!.invoiceId || 'None' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project ID</div>
                <div class="text-base text-foreground">{{ event()!.projectId }}</div>
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
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Frequency</div>
                  <div class="text-base text-foreground capitalize">{{ schedule()!.frequency }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Next Billing Date</div>
                  <div class="text-base text-foreground">{{ schedule()!.nextBillingDate }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Last Billed Date</div>
                  <div class="text-base text-foreground">{{ schedule()!.lastBilledDate }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Last Billed Amount</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.lastBilledAmount) }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Contract Value</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.contractValue) }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Total Billed</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.totalBilled) }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Total Remaining</div>
                  <div class="text-base font-medium text-foreground">{{ formatCurrency(schedule()!.totalRemaining) }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Billing Contact</div>
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
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">invoice</i>
          <div class="text-lg font-medium mb-1">Billing Event Not Found</div>
          <div class="text-sm mb-4">The requested billing event could not be found.</div>
          <div
            class="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
            role="button" tabindex="0"
            (click)="goBack()"
            (keydown.enter)="goBack()"
          >Return to {{ backLabel }}</div>
        </div>
      }
    </div>
  `,
})
export class BillingEventDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly eventId = signal<string>('');

  readonly event = computed<BillingEvent | null>(() => {
    const id = this.eventId();
    return BILLING_EVENTS.find(ev => ev.id === id) ?? null;
  });

  readonly schedule = computed<BillingSchedule | null>(() => {
    const ev = this.event();
    if (!ev) return null;
    return BILLING_SCHEDULES.find(bs => bs.projectId === ev.projectId) ?? null;
  });

  readonly statusColor = computed(() => {
    const ev = this.event();
    return ev ? billingStatusBadgeColor(ev.status) : 'secondary';
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.eventId.set(params.get('id') ?? '');
    });
  }

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  goBack(): void {
    const route = this.backInfo.route;
    if (route.includes('?')) {
      const [path, query] = route.split('?');
      const qp: Record<string, string> = {};
      for (const pair of query.split('&')) {
        const [k, v] = pair.split('=');
        if (k) qp[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
      }
      this.router.navigate([path || '/'], { queryParams: qp });
    } else {
      this.router.navigate([route]);
    }
  }
}
