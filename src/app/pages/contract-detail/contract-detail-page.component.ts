import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { Contract, ContractStatus, ContractType } from '../../data/dashboard-data';
import {
  contractStatusBadge,
  contractTypeLabelShort,
  formatCurrency as sharedFormatCurrency,
  capitalizeFirst as sharedCapitalizeFirst,
  CONTRACTS,
  CHANGE_ORDERS,
} from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

function statusBgClass(status: ContractStatus): string {
  const map: Record<ContractStatus, string> = { active: 'bg-success', closed: 'bg-secondary', pending: 'bg-warning', draft: 'bg-muted' };
  return map[status] ?? 'bg-secondary';
}

function typeBadgeVariant(ct: ContractType): 'primary' | 'warning' | 'secondary' {
  const map: Record<ContractType, 'primary' | 'warning' | 'secondary'> = { prime: 'primary', subcontract: 'warning', 'purchase-order': 'secondary' };
  return map[ct] ?? 'secondary';
}

@Component({
  selector: 'app-contract-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (contract()) {
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
                <i class="modus-icons text-xl text-primary" aria-hidden="true">copy_content</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ contract()!.title }}</div>
                <div class="text-sm text-foreground-60">{{ contract()!.vendor }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <modus-badge [color]="typeBadgeColor()" variant="outlined" size="md">
                {{ contractTypeLabelShort(contract()!.contractType) }}
              </modus-badge>
              <modus-badge [color]="contractStatusBadge(contract()!.status)" size="md">
                {{ capitalizeFirst(contract()!.status) }}
              </modus-badge>
            </div>
          </div>

          <!-- KPI row 1: financials -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Original Value</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(contract()!.originalValue) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Revised Value</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(contract()!.revisedValue) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Delta</div>
                <div class="text-xl font-bold" [class]="delta() > 0 ? 'text-warning' : 'text-foreground'">
                  {{ delta() >= 0 ? '+' : '' }}{{ formatCurrency(delta()) }}
                </div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Retainage</div>
                <div class="text-xl font-bold text-foreground">{{ contract()!.retainage }}%</div>
              </div>
            </div>

            <!-- KPI row 2: metadata -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Start Date</div>
                <div class="text-base text-foreground">{{ contract()!.startDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">End Date</div>
                <div class="text-base text-foreground">{{ contract()!.endDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project</div>
                <div class="text-base text-foreground">{{ contract()!.project }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Status</div>
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
                  <div class="text-base text-foreground">{{ capitalizeFirst(contract()!.status) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Contract Details -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info_outlined</i>
            <div class="text-base font-semibold text-foreground">Contract Details</div>
          </div>
          <div class="px-6 py-6 flex flex-col gap-6">
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Scope</div>
              <div class="text-base text-foreground">{{ contract()!.scope }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Linked Change Orders</div>
              @if (linkedCOs().length) {
                <div class="flex flex-wrap gap-2 mt-1">
                  @for (co of linkedCOs(); track co.id) {
                    <div class="px-3 py-1.5 rounded-lg bg-muted text-sm text-foreground">
                      {{ co.id }} -- {{ formatCurrency(co.amount) }}
                    </div>
                  }
                </div>
              } @else {
                <div class="text-base text-foreground-40">None</div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">copy_content</i>
          <div class="text-lg font-medium mb-1">Contract Not Found</div>
          <div class="text-sm mb-4">The requested contract could not be found.</div>
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
export class ContractDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly contractId = signal<string>('');

  readonly contract = computed<Contract | null>(() => {
    const id = this.contractId();
    return CONTRACTS.find(c => c.id === id) ?? null;
  });

  readonly delta = computed(() => {
    const c = this.contract();
    return c ? c.revisedValue - c.originalValue : 0;
  });

  readonly linkedCOs = computed(() => {
    const c = this.contract();
    if (!c || !c.linkedChangeOrderIds.length) return [];
    return c.linkedChangeOrderIds
      .map(coId => CHANGE_ORDERS.find(co => co.id === coId))
      .filter((co): co is NonNullable<typeof co> => !!co);
  });

  readonly statusDotClass = computed(() => {
    const c = this.contract();
    if (!c) return '';
    return statusBgClass(c.status);
  });

  readonly typeBadgeColor = computed(() => {
    const c = this.contract();
    return c ? typeBadgeVariant(c.contractType) : 'secondary' as const;
  });

  readonly contractStatusBadge = contractStatusBadge;
  readonly contractTypeLabelShort = contractTypeLabelShort;
  readonly capitalizeFirst = sharedCapitalizeFirst;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.contractId.set(params.get('id') ?? '');
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
