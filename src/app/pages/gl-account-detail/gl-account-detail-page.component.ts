import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
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
  imports: [ModusBadgeComponent, ModusCardComponent, ModusTypographyComponent, DetailPageLayoutComponent],
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
        <modus-card [padding]="'compact'" className="overflow-hidden mb-6">
          <div>
            <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-20 flex items-center justify-center">
                  <i class="modus-icons text-xl text-primary" aria-hidden="true">bar_graph</i>
                </div>
                <div>
                  <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ acct.code }}</modus-typography>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ acct.name }}</modus-typography>
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
                <modus-typography hierarchy="h2" size="lg" weight="bold">{{ formatCurrency(acct.balance) }}</modus-typography>
              </div>
              <div>
                <div class="detail-field-label">Account Type</div>
                <modus-typography hierarchy="p" size="md">{{ capitalizeFirst(acct.type) }}</modus-typography>
              </div>
              <div>
                <div class="detail-field-label">Entry Count</div>
                <modus-typography hierarchy="p" size="md">{{ entries().length }}</modus-typography>
              </div>
            </div>
          </div>
        </modus-card>

        <!-- Journal Entries -->
        <modus-card [padding]="'compact'" className="overflow-hidden">
          <div>
            <div class="flex items-center gap-2 px-6 py-4 border-bottom-default">
              <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list_bulleted</i>
              <modus-typography hierarchy="h3" size="md" weight="semibold">Journal Entries</modus-typography>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ entries().length }} entries</modus-typography>
            </div>

            @if (entries().length) {
              <div class="overflow-x-auto">
                <div class="min-w-[560px]">
                  <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-6 py-3 bg-muted border-bottom-default text-foreground-60 uppercase tracking-wide">
                    <modus-typography size="xs" weight="semibold">Entry #</modus-typography>
                    <modus-typography size="xs" weight="semibold">Date</modus-typography>
                    <modus-typography size="xs" weight="semibold">Description</modus-typography>
                    <modus-typography size="xs" weight="semibold" className="text-right">Debit</modus-typography>
                    <modus-typography size="xs" weight="semibold" className="text-right">Credit</modus-typography>
                  </div>
                  @for (entry of entries(); track entry.id) {
                    <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 px-6 py-3.5 border-bottom-default items-center last:border-b-0">
                      <modus-typography hierarchy="p" size="sm" weight="semibold">{{ entry.id }}</modus-typography>
                      <modus-typography hierarchy="p" size="sm" className="text-foreground-80">{{ entry.date }}</modus-typography>
                      <modus-typography hierarchy="p" size="sm" className="text-foreground-80 truncate">{{ entry.description }}</modus-typography>
                      <modus-typography hierarchy="p" size="sm" [className]="'text-right ' + (entry.debit ? 'text-foreground' : 'text-foreground-40')">
                        {{ entry.debit ? formatCurrency(entry.debit) : '--' }}
                      </modus-typography>
                      <modus-typography hierarchy="p" size="sm" [className]="'text-right ' + (entry.credit ? 'text-foreground' : 'text-foreground-40')">
                        {{ entry.credit ? formatCurrency(entry.credit) : '--' }}
                      </modus-typography>
                    </div>
                  }
                </div>
              </div>
            } @else {
              <div class="flex flex-col items-center justify-center py-12 text-foreground-40">
                <i class="modus-icons text-2xl mb-2" aria-hidden="true">bar_graph</i>
                <modus-typography hierarchy="p" size="sm">No journal entries found for this account</modus-typography>
              </div>
            }
          </div>
        </modus-card>
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
