import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import type { ChangeOrder, ChangeOrderStatus, ChangeOrderType } from '../../data/dashboard-data.types';
import { coBadgeColor, coTypeLabel, coTypeIcon, formatCurrency as sharedFormatCurrency, capitalizeFirst as sharedCapitalizeFirst } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

interface CostBreakdownItem {
  description: string;
  amount: number;
}

interface HistoryEntry {
  date: string;
  action: string;
  actor: string;
  actorInitials: string;
}

const CO_STATUS_OPTIONS: { value: ChangeOrderStatus; label: string; dotClass: string }[] = [
  { value: 'pending', label: 'Pending', dotClass: 'bg-warning' },
  { value: 'approved', label: 'Approved', dotClass: 'bg-success' },
  { value: 'rejected', label: 'Rejected', dotClass: 'bg-destructive' },
];

function buildCostBreakdown(co: ChangeOrder): CostBreakdownItem[] {
  const seed = co.id.charCodeAt(co.id.length - 1) + co.id.charCodeAt(co.id.length - 2);
  const labels = ['Labor', 'Materials', 'Equipment', 'Subcontractor markup', 'Overhead & profit', 'Contingency'];
  const items: CostBreakdownItem[] = [];
  let remaining = co.amount;
  const count = 3 + (seed % 3);
  for (let i = 0; i < count; i++) {
    const desc = labels[(seed + i) % labels.length];
    const fraction = i < count - 1 ? (0.15 + ((seed + i * 5) % 30) / 100) : 1;
    const amount = i < count - 1 ? Math.round(remaining * fraction) : remaining;
    items.push({ description: desc, amount });
    remaining -= amount;
    if (remaining <= 0) break;
  }
  return items;
}

function buildHistory(co: ChangeOrder): HistoryEntry[] {
  const initials = (name: string) => name.split(' ').map(w => w[0]).join('');
  const entries: HistoryEntry[] = [
    { date: co.requestDate, action: 'Change order submitted', actor: co.requestedBy, actorInitials: initials(co.requestedBy) },
  ];
  if (co.status === 'approved') {
    entries.push(
      { date: co.requestDate, action: 'Reviewed by project manager', actor: 'Priya Nair', actorInitials: 'PN' },
      { date: co.requestDate, action: 'Approved and executed', actor: 'Sarah Chen', actorInitials: 'SC' },
    );
  } else if (co.status === 'rejected') {
    entries.push(
      { date: co.requestDate, action: 'Reviewed by project manager', actor: 'Priya Nair', actorInitials: 'PN' },
      { date: co.requestDate, action: 'Rejected — see reason', actor: 'Sarah Chen', actorInitials: 'SC' },
    );
  } else {
    entries.push(
      { date: co.requestDate, action: 'Pending review', actor: 'Priya Nair', actorInitials: 'PN' },
    );
  }
  return entries;
}

function statusBgClass(status: ChangeOrderStatus): string {
  const map: Record<ChangeOrderStatus, string> = { approved: 'bg-success', pending: 'bg-warning', rejected: 'bg-destructive' };
  return map[status] ?? 'bg-secondary';
}

function typeBgClass(coType: ChangeOrderType): string {
  const map: Record<ChangeOrderType, string> = { prime: 'bg-primary-20', potential: 'bg-warning-20', subcontract: 'bg-secondary' };
  return map[coType] ?? 'bg-muted';
}

@Component({
  selector: 'app-change-order-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent, ModusTypographyComponent, ModusCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!changeOrder()"
      [backLabel]="backLabel"
      emptyIcon="swap"
      emptyTitle="Change Order Not Found"
      emptyMessage="The requested change order could not be found."
      (back)="goBack()"
    >
      @if (changeOrder(); as co) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusBg()">
                  <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">swap</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ co.id }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ co.project }}</modus-typography>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <modus-badge [color]="typeBadgeColor()" variant="outlined" size="md">
                  {{ coTypeLabel(co.coType) }}
                </modus-badge>
                <div class="relative">
                  <div class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150"
                    role="button" tabindex="0"
                    (click)="statusOpen.set(!statusOpen())"
                    (keydown.enter)="statusOpen.set(!statusOpen())">
                    <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
                    <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground">{{ capitalizeFirst(co.status) }}</modus-typography>
                    <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
                  </div>
                  @if (statusOpen()) {
                    <div class="fixed inset-0 z-[9998]" (click)="statusOpen.set(false)"></div>
                    <div class="absolute right-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-[9999] min-w-[160px] py-1 overflow-hidden">
                      @for (opt of coStatusOptions; track opt.value) {
                        <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="option" [attr.aria-selected]="opt.value === co.status"
                          (click)="changeStatus(opt.value)">
                          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                          <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground">{{ opt.label }}</modus-typography>
                          @if (opt.value === co.status) {
                            <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="px-6 py-6 flex flex-col gap-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(co.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Request Date</div>
                  <modus-typography hierarchy="p" size="md">{{ co.requestDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Requested By</div>
                  <modus-typography hierarchy="p" size="md">{{ co.requestedBy }}</modus-typography>
                </div>
                @if (co.costCode) {
                  <div>
                    <div class="detail-field-label">Cost Code</div>
                    <modus-typography hierarchy="p" size="md">{{ co.costCode }}</modus-typography>
                  </div>
                }
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                @if (co.contractNumber) {
                  <div>
                    <div class="detail-field-label">Contract Number</div>
                    <modus-typography hierarchy="p" size="md">{{ co.contractNumber }}</modus-typography>
                  </div>
                }
                @if (co.subcontractor) {
                  <div>
                    <div class="detail-field-label">Subcontractor</div>
                    <modus-typography hierarchy="p" size="md">{{ co.subcontractor }}</modus-typography>
                  </div>
                }
              </div>

              <div>
                <div class="detail-field-label">Description</div>
                <modus-typography hierarchy="p" size="md">{{ co.description }}</modus-typography>
              </div>

              <div>
                <div class="detail-field-label">Reason / Justification</div>
                <modus-typography hierarchy="p" size="md">{{ co.reason }}</modus-typography>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Cost Breakdown -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Cost Breakdown</modus-typography>
            </div>
            <div class="overflow-x-auto">
              <div class="min-w-[400px]">
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Item</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Amount</modus-typography>
                </div>
                @for (item of costBreakdown(); track item.description) {
                  <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                    <modus-typography hierarchy="p" size="sm">{{ item.description }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-right">{{ formatCurrency(item.amount) }}</modus-typography>
                  </div>
                }
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">Total</modus-typography>
                  <modus-typography hierarchy="p" size="md" weight="bold" className="text-right">{{ formatCurrency(co.amount) }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Activity History -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Activity History</modus-typography>
            </div>
            <div>
              @for (entry of history(); track entry.action; let last = $last) {
                <div class="flex items-start gap-4 px-6 py-4" [class.border-bottom-default]="!last">
                  <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">{{ entry.actorInitials }}</modus-typography>
                  </div>
                  <div class="flex-1 min-w-0">
                    <modus-typography hierarchy="p" size="sm">{{ entry.action }}</modus-typography>
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-40 mt-0.5">{{ entry.actor }} -- {{ entry.date }}</modus-typography>
                  </div>
                </div>
              }
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class ChangeOrderDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  readonly coStatusOptions = CO_STATUS_OPTIONS;
  readonly statusOpen = signal(false);

  private readonly coId = routeParamSignal('id');

  readonly changeOrder = computed<ChangeOrder | null>(() => {
    const id = this.coId();
    return this.store.changeOrders().find(co => co.id === id) ?? null;
  });

  readonly costBreakdown = computed<CostBreakdownItem[]>(() => {
    const co = this.changeOrder();
    return co ? buildCostBreakdown(co) : [];
  });

  readonly history = computed<HistoryEntry[]>(() => {
    const co = this.changeOrder();
    return co ? buildHistory(co) : [];
  });

  readonly statusBg = computed(() => {
    const co = this.changeOrder();
    return co ? statusBgClass(co.status) : '';
  });

  readonly statusDotClass = computed(() => {
    const co = this.changeOrder();
    if (!co) return '';
    const map: Record<ChangeOrderStatus, string> = { approved: 'bg-success', pending: 'bg-warning', rejected: 'bg-destructive' };
    return map[co.status] ?? 'bg-secondary';
  });

  readonly typeBadgeColor = computed(() => {
    const co = this.changeOrder();
    if (!co) return 'secondary' as const;
    const map: Record<ChangeOrderType, 'primary' | 'warning' | 'secondary'> = { prime: 'primary', potential: 'warning', subcontract: 'secondary' };
    return map[co.coType];
  });

  readonly coBadgeColor = coBadgeColor;
  readonly coTypeLabel = coTypeLabel;

  readonly capitalizeFirst = sharedCapitalizeFirst;

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  changeStatus(newStatus: ChangeOrderStatus): void {
    const co = this.changeOrder();
    if (!co) return;
    this.store.updateChangeOrderStatus(co.id, newStatus);
    this.statusOpen.set(false);
  }
}
