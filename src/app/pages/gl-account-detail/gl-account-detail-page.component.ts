import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import type { GLAccount, GLAccountType, GLEntry } from '../../data/dashboard-data';
import { formatCurrency, capitalizeFirst } from '../../data/dashboard-data';
import { DataStoreService } from '../../data/data-store.service';
import { NavigationHistoryService } from '../../shell/services/navigation-history.service';

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
  imports: [ModusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-lg mx-auto">
      @if (account()) {
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
                <i class="modus-icons text-xl text-primary" aria-hidden="true">bar_graph</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ account()!.code }}</div>
                <div class="text-sm text-foreground-60">{{ account()!.name }}</div>
              </div>
            </div>
            <modus-badge [color]="typeBadgeColor()" variant="outlined">
              {{ capitalizeFirst(account()!.type) }}
            </modus-badge>
          </div>

          <!-- KPI grid -->
          <div class="px-6 py-6 grid grid-cols-3 gap-6">
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Balance</div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(account()!.balance) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Account Type</div>
              <div class="text-base text-foreground">{{ capitalizeFirst(account()!.type) }}</div>
            </div>
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Entry Count</div>
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
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">bar_graph</i>
          <div class="text-lg font-medium mb-1">GL Account Not Found</div>
          <div class="text-sm mb-4">The requested GL account could not be found.</div>
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
export class GlAccountDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navHistory = inject(NavigationHistoryService);
  private readonly store = inject(DataStoreService);

  private readonly backInfo = this.navHistory.getBackInfo();
  readonly backLabel = 'Back to ' + this.backInfo.label;

  private readonly code = signal<string>('');

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

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.code.set(params.get('code') ?? '');
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
