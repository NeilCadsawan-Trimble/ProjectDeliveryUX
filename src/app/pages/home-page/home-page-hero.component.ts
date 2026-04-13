import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ModusButtonComponent } from '../../components/modus-button.component';

/**
 * Welcome banner — Figma 2:36076: one row (greeting + Create),16px padding, md shadow, md filled pill button.
 */
@Component({
  selector: 'app-home-page-hero',
  imports: [ModusButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-figma-hero-card mb-6">
      <div class="flex min-h-8 items-center justify-between gap-4">
        <div
          class="min-w-0 text-3xl font-semibold leading-8 text-foreground"
          role="heading"
          aria-level="1"
        >
          Welcome Back, Bert!
        </div>
        <div class="flex-shrink-0">
          <modus-button
            color="primary"
            variant="filled"
            size="md"
            icon="add"
            iconPosition="left"
            className="!rounded-full"
            (buttonClick)="createClick.emit()"
          >
            Create
          </modus-button>
        </div>
      </div>
    </div>
  `,
})
export class HomePageHeroComponent {
  readonly createClick = output<void>();
}
