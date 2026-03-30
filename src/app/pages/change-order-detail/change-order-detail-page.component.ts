import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { ChangeOrder, ChangeOrderStatus, ChangeOrderType } from '../../data/dashboard-data';
import { CHANGE_ORDERS, coBadgeColor, coTypeLabel, coTypeIcon, formatCurrency as sharedFormatCurrency, capitalizeFirst as sharedCapitalizeFirst } from '../../data/dashboard-data';

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
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (changeOrder()) {
        <div
          class="flex items-center gap-2 mb-6 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150"
          role="button" tabindex="0"
          (click)="goBack()"
          (keydown.enter)="goBack()"
        >
          <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
          <div class="text-sm font-medium">Back to Financials</div>
        </div>

        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusBg()">
                <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">swap</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ changeOrder()!.id }}</div>
                <div class="text-sm text-foreground-60">{{ changeOrder()!.project }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <modus-badge [color]="typeBadgeColor()" variant="outlined" size="md">
                {{ coTypeLabel(changeOrder()!.coType) }}
              </modus-badge>
              <modus-badge [color]="coBadgeColor(changeOrder()!.status)" size="md">
                {{ capitalizeFirst(changeOrder()!.status) }}
              </modus-badge>
            </div>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(changeOrder()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Request Date</div>
                <div class="text-base text-foreground">{{ changeOrder()!.requestDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Requested By</div>
                <div class="text-base text-foreground">{{ changeOrder()!.requestedBy }}</div>
              </div>
              @if (changeOrder()!.costCode) {
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Cost Code</div>
                  <div class="text-base text-foreground">{{ changeOrder()!.costCode }}</div>
                </div>
              }
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              @if (changeOrder()!.contractNumber) {
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Contract Number</div>
                  <div class="text-base text-foreground">{{ changeOrder()!.contractNumber }}</div>
                </div>
              }
              @if (changeOrder()!.subcontractor) {
                <div>
                  <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Subcontractor</div>
                  <div class="text-base text-foreground">{{ changeOrder()!.subcontractor }}</div>
                </div>
              }
            </div>

            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Description</div>
              <div class="text-base text-foreground">{{ changeOrder()!.description }}</div>
            </div>

            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Reason / Justification</div>
              <div class="text-base text-foreground">{{ changeOrder()!.reason }}</div>
            </div>
          </div>
        </div>

        <!-- Cost Breakdown -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Cost Breakdown</div>
          </div>
          <div class="overflow-x-auto">
            <div class="min-w-[400px]">
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Item</div>
                <div class="text-right">Amount</div>
              </div>
              @for (item of costBreakdown(); track item.description) {
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                  <div class="text-sm text-foreground">{{ item.description }}</div>
                  <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(item.amount) }}</div>
                </div>
              }
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                <div class="text-sm font-semibold text-foreground">Total</div>
                <div class="text-base font-bold text-foreground text-right">{{ formatCurrency(changeOrder()!.amount) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity History -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
            <div class="text-base font-semibold text-foreground">Activity History</div>
          </div>
          <div>
            @for (entry of history(); track entry.action; let last = $last) {
              <div class="flex items-start gap-4 px-6 py-4" [class.border-bottom-default]="!last">
                <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div class="text-xs font-semibold text-foreground-60">{{ entry.actorInitials }}</div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-foreground">{{ entry.action }}</div>
                  <div class="text-xs text-foreground-40 mt-0.5">{{ entry.actor }} -- {{ entry.date }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">swap</i>
          <div class="text-lg font-medium mb-1">Change Order Not Found</div>
          <div class="text-sm mb-4">The requested change order could not be found.</div>
          <div
            class="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
            role="button" tabindex="0"
            (click)="goBack()"
            (keydown.enter)="goBack()"
          >Return to Financials</div>
        </div>
      }
    </div>
  `,
})
export class ChangeOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly coId = signal<string>('');

  readonly changeOrder = computed<ChangeOrder | null>(() => {
    const id = this.coId();
    return CHANGE_ORDERS.find(co => co.id === id) ?? null;
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

  readonly typeBadgeColor = computed(() => {
    const co = this.changeOrder();
    if (!co) return 'secondary' as const;
    const map: Record<ChangeOrderType, 'primary' | 'warning' | 'secondary'> = { prime: 'primary', potential: 'warning', subcontract: 'secondary' };
    return map[co.coType];
  });

  readonly coBadgeColor = coBadgeColor;
  readonly coTypeLabel = coTypeLabel;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.coId.set(params.get('id') ?? '');
    });
  }

  readonly capitalizeFirst = sharedCapitalizeFirst;

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  goBack(): void {
    this.router.navigate(['/financials']);
  }
}
