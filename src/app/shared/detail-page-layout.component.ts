import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../components/modus-typography.component';
import { ModusButtonComponent } from '../components/modus-button.component';

@Component({
  selector: 'app-detail-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusButtonComponent],
  template: `
    <div class="px-4 py-6 md:py-8" [class]="maxWidth()">
      @if (hasEntity()) {
        <div
          class="detail-back-link"
          role="button" tabindex="0"
          (click)="back.emit()"
          (keydown.enter)="back.emit()"
        >
          <i class="modus-icons text-lg" aria-hidden="true">arrow_left</i>
          <modus-typography hierarchy="p" size="sm" weight="semibold">{{ backLabel() }}</modus-typography>
        </div>
        <ng-content />
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">{{ emptyIcon() }}</i>
          <modus-typography hierarchy="h2" size="lg" weight="semibold" className="mb-1">{{ emptyTitle() }}</modus-typography>
          <modus-typography hierarchy="p" size="sm" className="mb-4">{{ emptyMessage() }}</modus-typography>
          <modus-button color="primary" variant="filled" size="sm" (buttonClick)="back.emit()">Return to {{ backLabel() }}</modus-button>
        </div>
      }
    </div>
  `,
})
export class DetailPageLayoutComponent {
  readonly hasEntity = input.required<boolean>();
  readonly backLabel = input.required<string>();
  readonly maxWidth = input<string>('max-w-screen-lg mx-auto');
  readonly emptyIcon = input<string>('info');
  readonly emptyTitle = input<string>('Not Found');
  readonly emptyMessage = input<string>('The requested item could not be found.');
  readonly back = output<void>();
}
