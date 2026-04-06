import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { Contract, ContractStatus, ContractType } from '../../data/dashboard-data.types';
import {
  contractStatusBadge,
  contractTypeLabelShort,
  formatCurrency as sharedFormatCurrency,
  capitalizeFirst as sharedCapitalizeFirst,
} from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

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
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!contract()"
      [backLabel]="backLabel"
      emptyIcon="copy_content"
      emptyTitle="Contract Not Found"
      emptyMessage="The requested contract could not be found."
      (back)="goBack()"
    >
      @if (contract(); as c) {
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">copy_content</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ c.title }}</div>
                <div class="text-sm text-foreground-60">{{ c.vendor }}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <modus-badge [color]="typeBadgeColor()" variant="outlined" size="md">
                {{ contractTypeLabelShort(c.contractType) }}
              </modus-badge>
              <modus-badge [color]="contractStatusBadge(c.status)" size="md">
                {{ capitalizeFirst(c.status) }}
              </modus-badge>
            </div>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Original Value</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(c.originalValue) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Revised Value</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(c.revisedValue) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Delta</div>
                <div class="text-xl font-bold" [class]="delta() > 0 ? 'text-warning' : 'text-foreground'">
                  {{ delta() >= 0 ? '+' : '' }}{{ formatCurrency(delta()) }}
                </div>
              </div>
              <div>
                <div class="detail-field-label">Retainage</div>
                <div class="text-xl font-bold text-foreground">{{ c.retainage }}%</div>
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="detail-field-label">Start Date</div>
                <div class="text-base text-foreground">{{ c.startDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">End Date</div>
                <div class="text-base text-foreground">{{ c.endDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Project</div>
                <div class="text-base text-foreground">{{ c.project }}</div>
              </div>
              <div>
                <div class="detail-field-label">Status</div>
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
                  <div class="text-base text-foreground">{{ capitalizeFirst(c.status) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info_outlined</i>
            <div class="text-base font-semibold text-foreground">Contract Details</div>
          </div>
          <div class="px-6 py-6 flex flex-col gap-6">
            <div>
              <div class="detail-field-label">Scope</div>
              <div class="text-base text-foreground">{{ c.scope }}</div>
            </div>
            <div>
              <div class="detail-field-label">Linked Change Orders</div>
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
      }
    </app-detail-page-layout>
  `,
})
export class ContractDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();

  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly contractId = routeParamSignal('id');

  readonly contract = computed<Contract | null>(() => {
    const id = this.contractId();
    return this.store.contracts().find(c => c.id === id) ?? null;
  });

  readonly delta = computed(() => {
    const c = this.contract();
    return c ? c.revisedValue - c.originalValue : 0;
  });

  readonly linkedCOs = computed(() => {
    const c = this.contract();
    if (!c || !c.linkedChangeOrderIds.length) return [];
    return c.linkedChangeOrderIds
      .map(coId => this.store.changeOrders().find(co => co.id === coId))
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

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
