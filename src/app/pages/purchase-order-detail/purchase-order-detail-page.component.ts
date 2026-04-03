import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { PurchaseOrder } from '../../data/dashboard-data';
import { PURCHASE_ORDERS, poStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

interface LineItem {
  description: string;
  qty: number;
  unitCost: number;
  total: number;
}

const MATERIAL_DESCRIPTIONS = [
  'Structural steel beams', 'Rebar & reinforcement', 'Ready-mix concrete',
  'Lumber & framing', 'Electrical conduit', 'Copper wiring',
  'PVC piping', 'HVAC ductwork', 'Insulation batts',
  'Drywall sheets', 'Roofing membrane', 'Exterior cladding panels',
  'Window assemblies', 'Door hardware', 'Paint & coatings',
  'Plumbing fixtures', 'Light fixtures', 'Fire suppression heads',
  'Fasteners & anchors', 'Waterproofing compound',
];

function buildLineItems(po: PurchaseOrder): LineItem[] {
  const seed = po.id.charCodeAt(po.id.length - 1);
  const count = Math.max(2, Math.min(po.lineItems, 10));
  const items: LineItem[] = [];
  let remaining = po.amount;

  for (let i = 0; i < count; i++) {
    const desc = MATERIAL_DESCRIPTIONS[(seed + i * 3) % MATERIAL_DESCRIPTIONS.length];
    const isLast = i === count - 1;
    const total = isLast ? remaining : Math.round(remaining * (0.1 + ((seed + i * 7) % 20) / 100));
    const qty = 1 + ((seed + i * 11) % 50);
    const unitCost = Math.round(total / qty);
    items.push({ description: desc, qty, unitCost, total });
    remaining -= total;
    if (remaining <= 0) break;
  }
  return items;
}

@Component({
  selector: 'app-purchase-order-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (po()) {
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
              <div class="w-11 h-11 rounded-lg bg-success-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-success" aria-hidden="true">shopping_cart</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ po()!.poNumber }}</div>
                <div class="text-sm text-foreground-60">{{ po()!.vendor }}</div>
              </div>
            </div>
            <modus-badge [color]="poStatusBadge(po()!.status)">{{ po()!.status }}</modus-badge>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <!-- KPI row 1 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount</div>
                <div class="text-xl font-bold text-foreground">{{ formatCurrency(po()!.amount) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Amount Received</div>
                <div class="text-base text-foreground">{{ formatCurrency(po()!.amountReceived) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Expected Delivery</div>
                <div class="text-base text-foreground">{{ po()!.expectedDelivery }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project</div>
                <div class="text-base text-foreground">{{ po()!.project }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Issue Date</div>
                <div class="text-base text-foreground">{{ po()!.issueDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Cost Code</div>
                <div class="text-base text-foreground">{{ po()!.costCode }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Received Date</div>
                <div class="text-base text-foreground">{{ po()!.receivedDate || 'Pending' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Line Items</div>
            <div class="text-xs text-foreground-40">{{ lineItems().length }} items</div>
          </div>

          <div class="overflow-x-auto">
            <div class="min-w-[520px]">
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                <div>Description</div>
                <div class="text-right">Qty</div>
                <div class="text-right">Unit Cost</div>
                <div class="text-right">Total</div>
              </div>
              @for (item of lineItems(); track item.description) {
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                  <div class="text-sm text-foreground">{{ item.description }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ item.qty }}</div>
                  <div class="text-sm text-foreground-80 text-right">{{ formatCurrency(item.unitCost) }}</div>
                  <div class="text-sm font-medium text-foreground text-right">{{ formatCurrency(item.total) }}</div>
                </div>
              }
              <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                <div class="text-sm font-semibold text-foreground">Total</div>
                <div></div>
                <div></div>
                <div class="text-base font-bold text-foreground text-right">{{ formatCurrency(lineItemsTotal()) }}</div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">shopping_cart</i>
          <div class="text-lg font-medium mb-1">Purchase Order Not Found</div>
          <div class="text-sm mb-4">The requested purchase order could not be found.</div>
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
export class PurchaseOrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  readonly poStatusBadge = poStatusBadge;

  private readonly poId = signal<string>('');

  readonly po = computed<PurchaseOrder | null>(() => {
    const id = this.poId();
    return PURCHASE_ORDERS.find(p => p.id === id) ?? null;
  });

  readonly lineItems = computed<LineItem[]>(() => {
    const po = this.po();
    return po ? buildLineItems(po) : [];
  });

  readonly lineItemsTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + item.total, 0),
  );

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.poId.set(params.get('id') ?? '');
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
