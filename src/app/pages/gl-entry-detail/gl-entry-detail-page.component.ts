import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
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
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
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
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">list_bulleted</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ e.id }}</div>
                <div class="text-sm text-foreground-60">{{ e.description }}</div>
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
                <div class="text-xl font-bold text-foreground">{{ e.debit ? formatCurrency(e.debit) : '--' }}</div>
              </div>
              <div>
                <div class="detail-field-label">Credit</div>
                <div class="text-xl font-bold text-foreground">{{ e.credit ? formatCurrency(e.credit) : '--' }}</div>
              </div>
              <div>
                <div class="detail-field-label">Date</div>
                <div class="text-base text-foreground">{{ e.date }}</div>
              </div>
              <div>
                <div class="detail-field-label">Account</div>
                <div class="text-base text-foreground">{{ e.accountCode }} - {{ e.accountName }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div class="detail-field-label">Reference</div>
                <div class="text-base text-foreground">{{ e.reference }}</div>
              </div>
              <div>
                <div class="detail-field-label">Category</div>
                <div class="text-base text-foreground">{{ capitalizeFirst(e.category) }}</div>
              </div>
              <div>
                <div class="detail-field-label">Balance</div>
                <div class="text-base font-semibold text-foreground">{{ formatCurrency(e.balance) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Entry Details card -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info</i>
            <div class="text-base font-semibold text-foreground">Entry Details</div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 px-6 py-5">
            @for (field of detailFields(); track field.label) {
              <div class="flex flex-col gap-0.5">
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide">{{ field.label }}</div>
                <div class="text-sm text-foreground">{{ field.value }}</div>
              </div>
            }
          </div>
        </div>
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
