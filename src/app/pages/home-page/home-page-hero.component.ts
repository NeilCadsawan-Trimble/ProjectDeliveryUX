import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusButtonComponent } from '../../components/modus-button.component';

/**
 * Isolated hero block so the home header cannot accidentally pick up a third subtitle line.
 * Keep only: welcome title, date, Create action.
 */
@Component({
  selector: 'app-home-page-hero',
  imports: [ModusButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <div class="text-3xl font-bold text-foreground" role="heading" aria-level="1">Welcome Back, Bert!</div>
        <div class="text-sm text-foreground-60 mt-1">{{ formattedDate() }}</div>
      </div>
      <div class="flex-shrink-0">
        <modus-button color="primary" icon="add" iconPosition="left" (buttonClick)="createClick.emit()">
          Create
        </modus-button>
      </div>
    </div>
  `,
})
export class HomePageHeroComponent {
  readonly formattedDate = input.required<string>();
  readonly createClick = output<void>();
}
