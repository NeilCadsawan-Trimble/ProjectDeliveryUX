import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-detail-page-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
          <div class="text-sm font-medium">{{ backLabel() }}</div>
        </div>
        <ng-content />
      } @else {
        <div class="flex flex-col items-center justify-center py-20 text-foreground-40">
          <i class="modus-icons text-4xl mb-3" aria-hidden="true">{{ emptyIcon() }}</i>
          <div class="text-lg font-medium mb-1">{{ emptyTitle() }}</div>
          <div class="text-sm mb-4">{{ emptyMessage() }}</div>
          <div
            class="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer bg-primary text-primary-foreground hover:opacity-90 transition-opacity duration-150"
            role="button" tabindex="0"
            (click)="back.emit()"
            (keydown.enter)="back.emit()"
          >Return to {{ backLabel() }}</div>
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
