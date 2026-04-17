import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import type { GLEntry, GLCategory } from '../../data/dashboard-data.types';
import { formatCurrency, capitalizeFirst } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

import type { ModusBadgeColor } from '../../components/modus-badge.component';

const CATEGORY_BADGE_COLOR: Record<GLCategory, ModusBadgeColor> = {
  revenue: 'success',
  expense: 'danger',
  asset: 'primary',
  liability: 'warning',
};

@Component({
  selector: 'app-gl-entry-detail-page',
  imports: [ModusBadgeComponent, ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!entry()"
      [backLabel]="backLabel"
      emptyIcon="list_bulleted"
      emptyTitle="Journal Entry Not Found"
      emptyMessage="The requested GL entry could not be found."
      (back)="goBack()"
    >
      @if (entry(); as e) {
        <!-- Header card -->
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-primary" aria-hidden="true">list_bulleted</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ e.id }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ e.description }}</modus-typography>
                </div>
              </div>
              <modus-badge [color]="categoryBadgeColor()" variant="outlined">
                {{ capitalizeFirst(e.category) }}
              </modus-badge>
            </div>

            <!-- KPI row 1 -->
            <div class="px-6 py-6 flex flex-col gap-6">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div class="detail-field-label">Debit</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ e.debit ? formatCurrency(e.debit) : '--' }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Credit</div>
                  <modus-typography hierarchy="h2" size="lg" weight="bold">{{ e.credit ? formatCurrency(e.credit) : '--' }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Date</div>
                  <modus-typography hierarchy="p" size="md">{{ e.date }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Account</div>
                  <modus-typography hierarchy="p" size="md">{{ e.accountCode }} - {{ e.accountName }}</modus-typography>
                </div>
              </div>

              <!-- KPI row 2 -->
              <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <div class="detail-field-label">Reference</div>
                  <modus-typography hierarchy="p" size="md">{{ e.reference }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Category</div>
                  <modus-typography hierarchy="p" size="md">{{ capitalizeFirst(e.category) }}</modus-typography>
                </div>
                <div>
                  <div class="detail-field-label">Balance</div>
                  <modus-typography hierarchy="h3" size="md" weight="semibold">{{ formatCurrency(e.balance) }}</modus-typography>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Entry Details card -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Entry Details</modus-typography>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 py-5">
              @for (field of detailFields(); track field.label) {
                <div class="flex flex-col gap-0.5">
                  <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide">{{ field.label }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm">{{ field.value }}</modus-typography>
                </div>
              }
            </div>
          </div>
        </modus-card>
      }
    </app-detail-page-layout>
  `,
})
export class GlEntryDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly entryId = routeParamSignal('id');

  readonly entry = computed<GLEntry | null>(() => {
    const id = this.entryId();
    return this.store.glEntries().find(e => e.id === id) ?? null;
  });

  readonly categoryBadgeColor = computed(() => {
    const e = this.entry();
    return e ? CATEGORY_BADGE_COLOR[e.category] : 'primary';
  });

  readonly detailFields = computed<{ label: string; value: string }[]>(() => {
    const e = this.entry();
    if (!e) return [];
    return [
      { label: 'Entry ID', value: e.id },
      { label: 'Date', value: e.date },
      { label: 'Account Code', value: e.accountCode },
      { label: 'Account Name', value: e.accountName },
      { label: 'Description', value: e.description },
      { label: 'Debit', value: e.debit ? formatCurrency(e.debit) : '--' },
      { label: 'Credit', value: e.credit ? formatCurrency(e.credit) : '--' },
      { label: 'Balance', value: formatCurrency(e.balance) },
      { label: 'Project ID', value: e.projectId != null ? String(e.projectId) : 'N/A' },
      { label: 'Category', value: capitalizeFirst(e.category) },
      { label: 'Reference', value: e.reference },
    ];
  });

  readonly formatCurrency = formatCurrency;
  readonly capitalizeFirst = capitalizeFirst;
}
