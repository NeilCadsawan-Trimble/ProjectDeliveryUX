import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';

export interface KpiCard {
  value: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  ariaPrefix: string;
  action: string;
  subtitle?: string;
}

@Component({
  selector: 'app-home-kpi-cards',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    @if (compact()) {
      @for (card of cards(); track card.label) {
        <div class="bg-muted rounded-lg px-3 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors duration-150"
          role="link" tabindex="0"
          [attr.aria-label]="card.ariaPrefix + ': ' + card.value"
          (click)="cardClick.emit(card.action)"
          (keydown.enter)="cardClick.emit(card.action)"
          (keydown.space)="$event.preventDefault(); cardClick.emit(card.action)">
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
      }
    } @else {
      @for (card of cards(); track card.label) {
        <div class="bg-card border-default rounded-lg p-5 flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="link" tabindex="0"
          [attr.aria-label]="card.ariaPrefix + ': ' + card.value"
          (click)="cardClick.emit(card.action)"
          (keydown.enter)="cardClick.emit(card.action)"
          (keydown.space)="$event.preventDefault(); cardClick.emit(card.action)">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" [class]="card.iconBg">
            <i class="modus-icons text-2xl" [class]="card.iconColor" aria-hidden="true">{{ card.icon }}</i>
          </div>
          <div class="flex-1 min-w-0">
            <modus-typography hierarchy="h2" size="2xl" weight="bold">{{ card.value }}</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ card.label }}</modus-typography>
            @if (card.subtitle) {
              <modus-typography hierarchy="p" size="xs" className="text-foreground-40 mt-0.5 truncate">{{ card.subtitle }}</modus-typography>
            }
          </div>
          <i class="modus-icons text-lg text-foreground-40" aria-hidden="true">chevron_right</i>
        </div>
      }
    }
  `,
})
export class HomeKpiCardsComponent {
  readonly cards = input.required<KpiCard[]>();
  readonly compact = input<boolean>(false);
  readonly cardClick = output<string>();
}
