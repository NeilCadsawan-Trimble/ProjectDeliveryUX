import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Rfi, RfiStatus } from '../../data/dashboard-data';
import { RFIS } from '../../data/dashboard-data';

@Component({
  selector: 'app-rfi-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 py-6 md:py-8 max-w-screen-md mx-auto">
      @if (rfi()) {
        <div
          class="flex items-center gap-2 mb-6 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150"
          role="button" tabindex="0"
          (click)="goBack()"
          (keydown.enter)="goBack()"
        >
          <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
          <div class="text-sm font-medium">Back to Dashboard</div>
        </div>

        <div class="bg-card border-default rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusBg()">
                <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">clipboard</i>
              </div>
              <div>
                <div class="text-xl font-semibold text-foreground">{{ rfi()!.number }}</div>
                <div class="text-sm text-foreground-60">Request for Information</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" [class]="statusDot()"></div>
              <div class="text-sm font-medium text-foreground">{{ statusLabel() }}</div>
            </div>
          </div>

          <div class="px-6 py-6 flex flex-col gap-6">
            <div>
              <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Subject</div>
              <div class="text-base text-foreground">{{ rfi()!.subject }}</div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Project</div>
                <div class="text-base text-foreground">{{ rfi()!.project }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Assignee</div>
                <div class="text-base text-foreground">{{ rfi()!.assignee }}</div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Due Date</div>
                <div class="text-base text-foreground">{{ rfi()!.dueDate }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-foreground-40 uppercase tracking-wide mb-1.5">Status</div>
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" [class]="statusDot()"></div>
                  <div class="text-base font-medium text-foreground">{{ statusLabel() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">clipboard</i>
          <div class="text-lg font-medium mb-1">RFI Not Found</div>
          <div class="text-sm mb-4">The requested RFI could not be found.</div>
          <div
            class="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
            role="button" tabindex="0"
            (click)="goBack()"
            (keydown.enter)="goBack()"
          >Return to Dashboard</div>
        </div>
      }
    </div>
  `,
})
export class RfiDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly rfiId = signal<string>('');

  readonly rfi = computed<Rfi | null>(() => {
    const id = this.rfiId();
    return RFIS.find((r) => r.id === id) ?? null;
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

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.rfiId.set(params.get('id') ?? '');
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
