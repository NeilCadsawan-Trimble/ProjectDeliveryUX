import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';

export interface ApKpiCard {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  /** Optional secondary line shown below the value/label row. */
  subtitle?: string;
  /** Optional action identifier. When provided, the card becomes an interactive link. */
  action?: string;
  /** Optional aria label prefix (falls back to label). */
  ariaPrefix?: string;
}

@Component({
  selector: 'app-home-ap-kpi-cards',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    @if (cards().length > 0) {
      @for (card of cards(); track $index) {
        @if (card.action) {
          <div
            class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
            role="link"
            tabindex="0"
            [attr.aria-label]="(card.ariaPrefix || card.label) + ': ' + card.value"
            (click)="cardClick.emit(card.action!)"
            (keydown.enter)="cardClick.emit(card.action!)"
            (keydown.space)="$event.preventDefault(); cardClick.emit(card.action!)"
          >
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" [class]="card.iconBg">
              <i class="modus-icons text-base" [class]="card.iconColor" aria-hidden="true">{{ card.icon }}</i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <modus-typography hierarchy="h2" size="lg" weight="bold">{{ card.value }}</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ card.label }}</modus-typography>
              </div>
              @if (card.subtitle) {
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ card.subtitle }}</modus-typography>
              }
            </div>
            <i class="modus-icons text-sm text-foreground-40 flex-shrink-0" aria-hidden="true">chevron_right</i>
          </div>
        } @else {
          <div class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" [class]="card.iconBg">
              <i class="modus-icons text-base" [class]="card.iconColor" aria-hidden="true">{{ card.icon }}</i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2">
                <modus-typography hierarchy="h2" size="lg" weight="bold">{{ card.value }}</modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60 truncate">{{ card.label }}</modus-typography>
              </div>
              @if (card.subtitle) {
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ card.subtitle }}</modus-typography>
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class HomeApKpiCardsComponent {
  readonly cards = input.required<ApKpiCard[]>();
  readonly cardClick = output<string>();
}
