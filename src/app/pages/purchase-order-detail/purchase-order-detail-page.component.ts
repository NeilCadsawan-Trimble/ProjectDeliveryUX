import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import type { PurchaseOrder } from '../../data/dashboard-data.types';
import { poStatusBadge, formatCurrency as sharedFormatCurrency } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

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
  imports: [ModusBadgeComponent, DetailPageLayoutComponent, ModusTypographyComponent, ModusCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!po()"
      [backLabel]="backLabel"
      emptyIcon="shopping_cart"
      emptyTitle="Purchase Order Not Found"
      emptyMessage="The requested purchase order could not be found."
      (back)="goBack()"
    >
      @if (po(); as p) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-success-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-success" aria-hidden="true">shopping_cart</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ p.poNumber }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ p.vendor }}</modus-typography>
                </div>
              </div>
              <modus-badge [color]="poStatusBadge(p.status)">{{ p.status }}</modus-badge>
            </div>

            <div class="px-6 py-6 flex flex-col gap-6">
              <!-- KPI row 1 -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Amount</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(p.amount) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Amount Received</div>
                  <modus-typography hierarchy="p" size="md">{{ formatCurrency(p.amountReceived) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Expected Delivery</div>
                  <modus-typography hierarchy="p" size="md">{{ p.expectedDelivery }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Project</div>
                  <modus-typography hierarchy="p" size="md">{{ p.project }}</modus-typography>
                </div>
              </div>

              <!-- KPI row 2 -->
              <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div class="detail-field-label">Issue Date</div>
                  <modus-typography hierarchy="p" size="md">{{ p.issueDate }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Cost Code</div>
                  <modus-typography hierarchy="p" size="md">{{ p.costCode }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Received Date</div>
                  <modus-typography hierarchy="p" size="md">{{ p.receivedDate || 'Pending' }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Line Items -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Line Items</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ lineItems().length }} items</modus-typography>
            </div>

            <div class="overflow-x-auto">
              <div class="min-w-[520px]">
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Description</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Qty</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Unit Cost</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Total</modus-typography>
                </div>
                @for (item of lineItems(); track item.description) {
                  <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                    <modus-typography hierarchy="p" size="sm">{{ item.description }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ item.qty }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" className="text-foreground-80 text-right">{{ formatCurrency(item.unitCost) }}</modus-typography>
                    <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-right">{{ formatCurrency(item.total) }}</modus-typography>
                  </div>
                }
                <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] gap-3 px-6 py-4 bg-muted border-top-default">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">Total</modus-typography>
                  <div></div>
                  <div></div>
                  <modus-typography hierarchy="p" size="md" weight="bold" className="text-right">{{ formatCurrency(lineItemsTotal()) }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class PurchaseOrderDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  readonly poStatusBadge = poStatusBadge;

  private readonly poId = routeParamSignal('id');

  readonly po = computed<PurchaseOrder | null>(() => {
    const id = this.poId();
    return this.store.purchaseOrders().find(p => p.id === id) ?? null;
  });

  readonly lineItems = computed<LineItem[]>(() => {
    const po = this.po();
    return po ? buildLineItems(po) : [];
  });

  readonly lineItemsTotal = computed(() =>
    this.lineItems().reduce((sum, item) => sum + item.total, 0),
  );

  formatCurrency(value: number): string { return sharedFormatCurrency(value); }
}
