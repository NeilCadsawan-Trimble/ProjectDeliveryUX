import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';

@Component({
  selector: 'app-empty-state',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-card border-default rounded-lg p-8 flex flex-col items-center justify-center gap-4 min-h-[400px]"
         [class]="extraClass()">
      <i class="modus-icons text-4xl text-foreground-40" aria-hidden="true">{{ icon() }}</i>
      <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ title() }}</modus-typography>
      <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-center max-w-md">{{ description() }}</modus-typography>
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly extraClass = input<string>('');
}
