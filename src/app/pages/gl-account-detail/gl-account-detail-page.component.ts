import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { GLAccount, GLAccountType, GLEntry } from '../../data/dashboard-data.types';
import { formatCurrency, capitalizeFirst } from '../../data/dashboard-data.formatters';
import { DataStoreService } from '../../data/data-store.service';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

import type { ModusBadgeColor } from '../../components/modus-badge.component';

const TYPE_BADGE_COLOR: Record<GLAccountType, ModusBadgeColor> = {
  asset: 'primary',
  liability: 'warning',
  equity: 'secondary',
  revenue: 'success',
  expense: 'danger',
};

@Component({
  selector: 'app-gl-account-detail-page',
  imports: [ModusBadgeComponent, DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!account()"
      [backLabel]="backLabel"
      emptyIcon="bar_graph"
      emptyTitle="GL Account Not Found"
      emptyMessage="The requested GL account could not be found."
      (back)="goBack()"
    >
      @if (account(); as acct) {
        <!-- Header card -->
        <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                <i class="modus-icons text-xl text-primary" aria-hidden="true">bar_graph</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ acct.code }}</div>
                <div class="text-sm text-foreground-60">{{ acct.name }}</div>
              </div>
            </div>
            <modus-badge [color]="typeBadgeColor()" variant="outlined">
              {{ capitalizeFirst(acct.type) }}
            </modus-badge>
          </div>

          <!-- KPI grid -->
          <div class="px-6 py-6 grid grid-cols-3 gap-6">
            <div>
              <div class="detail-field-label">Balance</div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(acct.balance) }}</div>
            </div>
            <div>
              <div class="detail-field-label">Account Type</div>
              <div class="text-base text-foreground">{{ capitalizeFirst(acct.type) }}</div>
            </div>
            <div>
              <div class="detail-field-label">Entry Count</div>
              <div class="text-base text-foreground">{{ entries().length }}</div>
            </div>
          </div>
        </div>

        <!-- Journal Entries -->
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
            <div class="text-base font-semibold text-foreground">Journal Entries</div>
            <div class="text-xs text-foreground-40">{{ entries().length }} entries</div>
          </div>

          @if (entries().length) {
            <div class="overflow-x-auto">
              <div class="min-w-[560px]">
                <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-xs font-semibold text-foreground-60 uppercase tracking-wide">
                  <div>Entry #</div>
                  <div>Date</div>
                  <div>Description</div>
                  <div class="text-right">Debit</div>
                  <div class="text-right">Credit</div>
                </div>
                @for (entry of entries(); track entry.id) {
                  <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                    <div class="text-sm font-medium text-foreground">{{ entry.id }}</div>
                    <div class="text-sm text-foreground-80">{{ entry.date }}</div>
                    <div class="text-sm text-foreground-80 truncate">{{ entry.description }}</div>
                    <div class="text-sm text-right" [class]="entry.debit ? 'text-foreground' : 'text-foreground-40'">
                      {{ entry.debit ? formatCurrency(entry.debit) : '--' }}
                    </div>
                    <div class="text-sm text-right" [class]="entry.credit ? 'text-foreground' : 'text-foreground-40'">
                      {{ entry.credit ? formatCurrency(entry.credit) : '--' }}
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 text-foreground-40">
              <i class="modus-icons text-2xl mb-2" aria-hidden="true">bar_graph</i>
              <div class="text-sm">No journal entries found for this account</div>
            </div>
          }
        </div>
      }
    </app-detail-page-layout>
  `,
})
export class GlAccountDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();
  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  private readonly code = routeParamSignal('code');

  readonly account = computed<GLAccount | null>(() => {
    const c = this.code();
    return this.store.glAccounts().find(acct => acct.code === c) ?? null;
  });

  readonly entries = computed<GLEntry[]>(() => {
    const acct = this.account();
    if (!acct) return [];
    return this.store.glEntries().filter(e => e.accountCode === acct.code);
  });

  readonly typeBadgeColor = computed(() => {
    const acct = this.account();
    return acct ? TYPE_BADGE_COLOR[acct.type] : 'secondary';
  });

  readonly formatCurrency = formatCurrency;
  readonly capitalizeFirst = capitalizeFirst;
}
