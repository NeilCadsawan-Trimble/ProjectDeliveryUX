import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { ApActivityItem, ApActivityType } from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-home-ap-activity',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-0 h-full min-h-0 overflow-y-auto">
      @for (a of activities(); track a.id) {
        <div class="flex gap-3 px-3 py-2.5 border-bottom-default last:border-b-0 items-start">
          <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <i class="modus-icons text-base text-primary" aria-hidden="true">{{ iconFor(a.activityType) }}</i>
          </div>
          <div class="min-w-0 flex-1 flex flex-col gap-1">
            <modus-typography hierarchy="p" size="sm" className="text-foreground">{{ a.description }}</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ a.vendor }} · {{ a.project }}</modus-typography>
            <div class="flex flex-wrap items-center justify-between gap-2">
              @if (a.amount > 0) {
                <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground tabular-nums">{{ formatCurrency(a.amount) }}</modus-typography>
              } @else {
                <div></div>
              }
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 tabular-nums">{{ a.timestamp }}</modus-typography>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeApActivityComponent {
  readonly activities = input.required<ApActivityItem[]>();

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  iconFor(t: ApActivityType): string {
    switch (t) {
      case 'payment':
        return 'payment_instant';
      case 'approval':
        return 'check_circle';
      case 'receipt':
        return 'email';
      case 'vendor-update':
        return 'person_account';
      case 'hold':
        return 'pause_circle';
      case 'discount-captured':
        return 'offers';
      default:
        return 'info';
    }
  }
}
