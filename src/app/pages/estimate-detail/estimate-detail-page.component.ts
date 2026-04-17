import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import type { Estimate, EstimateStatus } from '../../data/dashboard-data.types';
import { estimateBadgeColor, dueDateClass, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

interface LineItem {
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  total: number;
}

interface HistoryEntry {
  date: string;
  action: string;
  actor: string;
  actorInitials: string;
}

const EST_STATUS_OPTIONS: { value: EstimateStatus; label: string; dotClass: string }[] = [
  { value: 'Draft', label: 'Draft', dotClass: 'bg-secondary' },
  { value: 'Under Review', label: 'Under Review', dotClass: 'bg-primary' },
  { value: 'Awaiting Approval', label: 'Awaiting Approval', dotClass: 'bg-warning' },
  { value: 'Approved', label: 'Approved', dotClass: 'bg-success' },
];

function buildLineItems(est: Estimate): LineItem[] {
  const seed = est.id.charCodeAt(est.id.length - 1);
  const items: LineItem[] = [];
  const descriptions = [
    ['General Conditions', 'Site Preparation', 'Demolition', 'Excavation & Grading'],
    ['Concrete & Foundations', 'Structural Steel', 'Framing & Rough Carpentry'],
    ['Electrical Rough-In', 'Plumbing Rough-In', 'HVAC Installation'],
    ['Insulation & Air Barrier', 'Roofing & Waterproofing', 'Exterior Cladding'],
    ['Interior Finishes', 'Painting & Coatings', 'Flooring'],
    ['Fixtures & Equipment', 'Final Inspections & Punch List', 'Contingency'],
  ];
  const units = ['LS', 'SF', 'LF', 'EA', 'CY', 'HR'];
  let remaining = est.valueRaw;
  const count = 5 + (seed % 4);
  const allDescs = descriptions.flat();
  for (let i = 0; i < count; i++) {
    const desc = allDescs[(seed + i * 3) % allDescs.length];
    const unit = units[(seed + i) % units.length];
    const fraction = i < count - 1 ? (0.08 + ((seed + i * 7) % 20) / 100) : 1;
    const total = i < count - 1 ? Math.round(remaining * fraction) : remaining;
    const qty = unit === 'LS' ? 1 : (10 + ((seed + i * 11) % 90));
    const unitCost = Math.round(total / qty);
    items.push({ description: desc, qty, unit, unitCost, total });
    remaining -= total;
    if (remaining <= 0) break;
  }
  return items;
}

function buildHistory(est: Estimate): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    { date: est.dueDate, action: 'Due date set', actor: est.requestedBy, actorInitials: est.requestedByInitials },
  ];
  if (est.status === 'Draft') {
    entries.unshift({ date: 'Mar 15, 2026', action: 'Draft created', actor: est.requestedBy, actorInitials: est.requestedByInitials });
  } else if (est.status === 'Under Review') {
    entries.unshift(
      { date: 'Mar 10, 2026', action: 'Draft created', actor: est.requestedBy, actorInitials: est.requestedByInitials },
      { date: 'Mar 18, 2026', action: 'Submitted for review', actor: est.requestedBy, actorInitials: est.requestedByInitials },
    );
  } else if (est.status === 'Awaiting Approval') {
    entries.unshift(
      { date: 'Mar 1, 2026', action: 'Draft created', actor: est.requestedBy, actorInitials: est.requestedByInitials },
      { date: 'Mar 8, 2026', action: 'Submitted for review', actor: est.requestedBy, actorInitials: est.requestedByInitials },
      { date: 'Mar 16, 2026', action: 'Review complete — awaiting approval', actor: 'Priya Nair', actorInitials: 'PN' },
    );
  }
  return entries;
}

@Component({
  selector: 'app-estimate-detail-page',
  imports: [DetailPageLayoutComponent, ModusTypographyComponent, ModusCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!estimate()"
      [backLabel]="backLabel"
      emptyIcon="description"
      emptyTitle="Estimate Not Found"
      emptyMessage="The requested estimate could not be found."
      (back)="goBack()"
    >
      @if (estimate(); as est) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusBg()">
                  <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">description</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ est.id }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ est.project }}</modus-typography>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150"
                    role="button" tabindex="0"
                    (click)="statusOpen.set(!statusOpen())"
                    (keydown.enter)="statusOpen.set(!statusOpen())">
                    <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
                    <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground">{{ est.status }}</modus-typography>
                    <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
                  </div>
                  @if (statusOpen()) {
                    <div class="fixed inset-0 z-[9998]" (click)="statusOpen.set(false)"></div>
                    <div class="absolute right-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-[9999] min-w-[200px] py-1 overflow-hidden">
                      @for (opt of estStatusOptions; track opt.value) {
                        <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="option" [attr.aria-selected]="opt.value === est.status"
                          (click)="changeStatus(opt.value)">
                          <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                          <modus-typography hierarchy="p" size="sm" className="font-medium text-foreground">{{ opt.label }}</modus-typography>
                          @if (opt.value === est.status) {
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
                  <div class="detail-field-label">Client</div>
                  <modus-typography hierarchy="p" size="md">{{ est.client }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Type</div>
                  <modus-typography hierarchy="p" size="md">{{ est.type }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Value</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ est.value }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Due Date</div>
                  <modus-typography hierarchy="p" size="md">{{ est.dueDate }}</modus-typography>
                  <modus-typography hierarchy="p" size="xs" [className]="'mt-0.5 ' + dueDateClass(est.daysLeft)">
                    @if (est.daysLeft < 0) {
                      {{ -est.daysLeft }} days overdue
                    } @else if (est.daysLeft === 0) {
                      Due today
                    } @else {
                      {{ est.daysLeft }} days remaining
                    }
                  </modus-typography>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="detail-field-label">Requested By</div>
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-full bg-primary-20 text-primary flex items-center justify-center flex-shrink-0">
                      <modus-typography size="xs" weight="semibold">{{ est.requestedByInitials }}</modus-typography>
                    </div>
                    <modus-typography hierarchy="p" size="md">{{ est.requestedBy }}</modus-typography>
                  </div>
                </div>
                <div>
                  <div class="detail-field-label">Project</div>
                  <modus-typography hierarchy="p" size="md">{{ est.project }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Line Items -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Line Items</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ lineItems().length }} items</modus-typography>
            </div>

            <div class="overflow-x-auto">
              <div class="min-w-[600px]">
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Description</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Qty</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Unit</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Unit Cost</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Total</modus-typography>
                </div>
                @for (item of lineItems(); track item.description) {
                  <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                    <modus-typography hierarchy="p" size="sm">{{ item.description }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ item.qty }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ item.unit }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ formatCurrency(item.unitCost) }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-right">{{ formatCurrency(item.total) }}</modus-typography>
                  </div>
                }
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">Total</modus-typography>
                  <div></div>
                  <div></div>
                  <div></div>
                  <modus-typography hierarchy="p" size="md" weight="bold" className="text-right">{{ est.value }}</modus-typography>
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
export class EstimateDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  readonly estStatusOptions = EST_STATUS_OPTIONS;
  readonly statusOpen = signal(false);

  private readonly estimateId = routeParamSignal('id');

  readonly estimate = computed<Estimate | null>(() => {
    const id = this.estimateId();
    return this.store.estimates().find(e => e.id === id) ?? null;
  });

  readonly lineItems = computed<LineItem[]>(() => {
    const est = this.estimate();
    return est ? buildLineItems(est) : [];
  });

  readonly history = computed<HistoryEntry[]>(() => {
    const est = this.estimate();
    return est ? buildHistory(est) : [];
  });

  readonly statusBg = computed(() => {
    const map: Record<EstimateStatus, string> = {
      'Draft': 'bg-secondary',
      'Under Review': 'bg-primary',
      'Awaiting Approval': 'bg-warning',
      'Approved': 'bg-success',
    };
    return this.estimate() ? map[this.estimate()!.status] : '';
  });

  readonly statusDotClass = computed(() => {
    const est = this.estimate();
    if (!est) return '';
    const map: Record<EstimateStatus, string> = {
      'Draft': 'bg-secondary',
      'Under Review': 'bg-primary',
      'Awaiting Approval': 'bg-warning',
      'Approved': 'bg-success',
    };
    return map[est.status] ?? 'bg-secondary';
  });

  readonly estimateBadgeColor = estimateBadgeColor;
  readonly dueDateClass = dueDateClass;

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }

  changeStatus(newStatus: EstimateStatus): void {
    const est = this.estimate();
    if (!est) return;
    this.store.updateEstimateStatus(est.id, newStatus);
    this.statusOpen.set(false);
  }
}
