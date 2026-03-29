import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import type { Estimate, EstimateStatus } from '../../data/dashboard-data';
import { ESTIMATES, estimateBadgeColor, dueDateClass } from '../../data/dashboard-data';

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
  imports: [ModusBadgeComponent, ModusProgressComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (estimate()) {
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
                <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">description</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ estimate()!.id }}</div>
                <div class="text-sm text-foreground-60">{{ estimate()!.project }}</div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <modus-badge [color]="estimateBadgeColor(estimate()!.status)" variant="outlined" size="md">
                {{ estimate()!.status }}
              </modus-badge>
            </div>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Client</div>
                <div class="text-base text-foreground">{{ estimate()!.client }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Type</div>
                <div class="text-base text-foreground">{{ estimate()!.type }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Value</div>
                <div class="text-xl font-bold text-foreground">{{ estimate()!.value }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Due Date</div>
                <div class="text-base text-foreground">{{ estimate()!.dueDate }}</div>
                <div class="text-xs mt-0.5" [class]="dueDateClass(estimate()!.daysLeft)">
                  @if (estimate()!.daysLeft < 0) {
                    {{ -estimate()!.daysLeft }} days overdue
                  } @else if (estimate()!.daysLeft === 0) {
                    Due today
                  } @else {
                    {{ estimate()!.daysLeft }} days remaining
                  }
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Requested By</div>
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-primary-20 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                    {{ estimate()!.requestedByInitials }}
                  </div>
                  <div class="text-base text-foreground">{{ estimate()!.requestedBy }}</div>
                </div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project</div>
                <div class="text-base text-foreground">{{ estimate()!.project }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list</i>
            <div class="text-base font-semibold text-foreground">Line Items</div>
            <div class="text-xs text-foreground-40">{{ lineItems().length }} items</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[600px]">
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Description</div>
                <div class="text-right">Qty</div>
                <div class="text-right">Unit</div>
                <div class="text-right">Unit Cost</div>
                <div class="text-right">Total</div>
              </div>
              @for (item of lineItems(); track item.description) {
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                  <div class="text-sm text-foreground">{{ item.description }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ item.qty }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ item.unit }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ formatCurrency(item.unitCost) }}</div>
                  <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(item.total) }}</div>
                </div>
              }
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                <div class="text-sm font-semibold text-foreground">Total</div>
                <div></div>
                <div></div>
                <div></div>
                <div class="text-base font-bold text-foreground text-right">{{ estimate()!.value }}</div>
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
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">description</i>
          <div class="text-lg font-medium mb-1">Estimate Not Found</div>
          <div class="text-sm mb-4">The requested estimate could not be found.</div>
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
export class EstimateDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly estimateId = signal<string>('');

  readonly estimate = computed<Estimate | null>(() => {
    const id = this.estimateId();
    return ESTIMATES.find(e => e.id === id) ?? null;
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

  readonly estimateBadgeColor = estimateBadgeColor;
  readonly dueDateClass = dueDateClass;

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.estimateId.set(params.get('id') ?? '');
    });
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString();
  }

  goBack(): void {
    this.router.navigate(['/financials']);
  }
}
