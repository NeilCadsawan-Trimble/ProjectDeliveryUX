import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-card border-default rounded-lg p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]"
         [class]="extraClass()">
      <i class="modus-icons text-4xl text-foreground-40" aria-hidden="true">{{ icon() }}</i>
      <div class="text-lg font-medium text-foreground">{{ title() }}</div>
      <div class="text-sm text-foreground-60 text-center max-w-md">{{ description() }}</div>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly extraClass = input<string>('');
}
