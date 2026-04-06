import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Rfi, RfiStatus } from '../../data/dashboard-data.types';
import { DataStoreService } from '../../data/data-store.service';
import { STATUS_OPTIONS } from '../../data/dashboard-item-status';
import { DetailPageLayoutComponent } from '../../shared/detail-page-layout.component';
import { routeParamSignal } from '../../shared/route-param-signal';
import { useBackNavigation } from '../../shared/go-back';

@Component({
  selector: 'app-rfi-detail-page',
  imports: [DetailPageLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-detail-page-layout
      [hasEntity]="!!rfi()"
      [backLabel]="backLabel"
      maxWidth="max-w-screen-md mx-auto"
      emptyIcon="clipboard"
      emptyTitle="RFI Not Found"
      emptyMessage="The requested RFI could not be found."
      (back)="goBack()"
    >
      @if (rfi(); as r) {
        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusBg()">
                <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">clipboard</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ r.number }}</div>
                <div class="text-sm text-foreground-60">Request for Information</div>
              </div>
            </div>
            <div class="relative">
              <div class="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150"
                role="button" tabindex="0"
                (click)="statusOpen.set(!statusOpen())"
                (keydown.enter)="statusOpen.set(!statusOpen())">
                <div class="w-2.5 h-2.5 rounded-full" [class]="statusDot()"></div>
                <div class="text-sm font-medium text-foreground">{{ statusLabel() }}</div>
                <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
              </div>
              @if (statusOpen()) {
                <div class="fixed inset-0 z-[9998]" (click)="statusOpen.set(false)"></div>
                <div class="absolute right-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-[9999] min-w-[160px] py-1 overflow-hidden">
                  @for (opt of statusOptions; track opt.value) {
                    <div class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                      role="option" [attr.aria-selected]="opt.value === r.status"
                      (click)="changeStatus(opt.value)">
                      <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                      <div class="text-sm font-medium text-foreground">{{ opt.label }}</div>
                      @if (opt.value === r.status) {
                        <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div>
              <div class="detail-field-label">Subject</div>
              <div class="text-base text-foreground">{{ r.subject }}</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="detail-field-label">Project</div>
                <div class="text-base text-foreground">{{ r.project }}</div>
              </div>
              <div>
                <div class="detail-field-label">Assignee</div>
                <div class="text-base text-foreground">{{ r.assignee }}</div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="detail-field-label">Due Date</div>
                <div class="text-base text-foreground">{{ r.dueDate }}</div>
              </div>
              <div>
                <div class="detail-field-label">Status</div>
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" [class]="statusDot()"></div>
                  <div class="text-base font-medium text-foreground">{{ statusLabel() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </app-detail-page-layout>
  `,
})
export class RfiDetailPageComponent {
  private readonly store = inject(DataStoreService);
  private readonly nav = useBackNavigation();

  readonly backLabel = this.nav.backLabel;
  readonly goBack = this.nav.goBack;

  readonly statusOptions = STATUS_OPTIONS;
  readonly statusOpen = signal(false);

  private readonly rfiId = routeParamSignal('id');

  readonly rfi = computed<Rfi | null>(() => {
    const id = this.rfiId();
    return this.store.rfis().find((r) => r.id === id) ?? null;
  });

  readonly statusLabel = computed(() => {
    const r = this.rfi();
    if (!r) return '';
    return r.status.charAt(0).toUpperCase() + r.status.slice(1);
  });

  readonly statusBg = computed(() => {
    const map: Record<RfiStatus, string> = {
      open: 'bg-primary',
      overdue: 'bg-destructive',
      upcoming: 'bg-warning',
      closed: 'bg-success',
    };
    return this.rfi() ? map[this.rfi()!.status] : '';
  });

  readonly statusDot = computed(() => {
    const map: Record<RfiStatus, string> = {
      open: 'bg-primary',
      overdue: 'bg-destructive',
      upcoming: 'bg-warning',
      closed: 'bg-success',
    };
    return this.rfi() ? map[this.rfi()!.status] : '';
  });

  changeStatus(newStatus: string): void {
    const r = this.rfi();
    if (!r) return;
    this.store.updateRfiStatus(r.id, newStatus as RfiStatus);
    this.statusOpen.set(false);
  }
}
