import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ApKpiCard {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-home-ap-kpi-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    @if (cards().length > 0) {
      @for (card of cards(); track $index) {
        <div class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3">
          <div
            class="flex size-9 flex-shrink-0 items-center justify-center rounded-full"
            [class]="card.iconBg"
          >
            <i class="modus-icons text-base" [class]="card.iconColor" aria-hidden="true">{{ card.icon }}</i>
          </div>
          <div class="text-lg font-bold text-foreground flex-shrink-0">{{ card.value }}</div>
          <div class="min-w-0 flex-1 text-sm text-foreground-60 truncate">{{ card.label }}</div>
        </div>
      }
    }
  `,
})
export class HomeApKpiCardsComponent {
  readonly cards = input.required<ApKpiCard[]>();
}
