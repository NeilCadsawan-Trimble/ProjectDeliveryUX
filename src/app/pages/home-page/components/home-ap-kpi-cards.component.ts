import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';

export interface ApKpiCard {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

@Component({
  selector: 'app-home-ap-kpi-cards',
  imports: [ModusTypographyComponent],
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
          <modus-typography class="flex-shrink-0" hierarchy="h2" size="lg" weight="bold">{{ card.value }}</modus-typography>
          <div class="min-w-0 flex-1 truncate">
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ card.label }}</modus-typography>
          </div>
        </div>
      }
    }
  `,
})
export class HomeApKpiCardsComponent {
  readonly cards = input.required<ApKpiCard[]>();
}
