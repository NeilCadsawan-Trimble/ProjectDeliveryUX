import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { GLEntry, GLCategory } from '../../data/dashboard-data';
import { formatCurrency, capitalizeFirst } from '../../data/dashboard-data';
import { DataStoreService } from '../../data/data-store.service';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

import type { ModusBadgeColor } from '../../components/modus-badge.component';

const CATEGORY_BADGE_COLOR: Record<GLCategory, ModusBadgeColor> = {
  revenue: 'success',
  expense: 'danger',
  asset: 'primary',
  liability: 'warning',
};

@Component({
  selector: 'app-gl-entry-detail-page',
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (entry()) {
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
                <i class="modus-icons text-xl text-primary" aria-hidden="true">list_bulleted</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ entry()!.id }}</div>
                <div class="text-sm text-foreground-60">{{ entry()!.description }}</div>
              </div>
            </div>
            <modus-badge [color]="categoryBadgeColor()" variant="outlined">
              {{ capitalizeFirst(entry()!.category) }}
            </modus-badge>
          </div>

          <!-- KPI row 1 -->
          <div class="px-6 py-6 flex flex-col gap-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Debit</div>
                <div class="text-xl font-bold text-foreground">{{ entry()!.debit ? formatCurrency(entry()!.debit) : '--' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Credit</div>
                <div class="text-xl font-bold text-foreground">{{ entry()!.credit ? formatCurrency(entry()!.credit) : '--' }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Date</div>
                <div class="text-base text-foreground">{{ entry()!.date }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Account</div>
                <div class="text-base text-foreground">{{ entry()!.accountCode }} - {{ entry()!.accountName }}</div>
              </div>
            </div>

            <!-- KPI row 2 -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Reference</div>
                <div class="text-base text-foreground">{{ entry()!.reference }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Category</div>
                <div class="text-base text-foreground">{{ capitalizeFirst(entry()!.category) }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Balance</div>
                <div class="text-base font-semibold text-foreground">{{ formatCurrency(entry()!.balance) }}</div>
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
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">list_bulleted</i>
          <div class="text-lg font-medium mb-1">Journal Entry Not Found</div>
          <div class="text-sm mb-4">The requested GL entry could not be found.</div>
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
export class GlEntryDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly store = inject(DataStoreService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly entryId = signal<string>('');

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

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.entryId.set(params.get('id') ?? '');
    });
  }

  readonly formatCurrency = formatCurrency;
  readonly capitalizeFirst = capitalizeFirst;

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
