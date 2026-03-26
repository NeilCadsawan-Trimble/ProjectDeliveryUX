import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'widget-lock-toggle',
  template: `
    <div
      class="absolute bottom-0 left-0 w-7 h-7 z-30 flex items-center justify-center cursor-pointer select-none group"
      [class.opacity-40]="!locked()"
      [class.opacity-80]="locked()"
      (click)="toggle.emit($event)"
      (mousedown)="$event.stopPropagation()"
      (touchstart)="$event.stopPropagation()"
      [attr.title]="locked() ? 'Unlock widget' : 'Lock widget'"
      [attr.aria-label]="locked() ? 'Unlock widget' : 'Lock widget'"
      role="button"
    >
      <i
        class="modus-icons text-sm transition-colors duration-150"
        [class.text-primary]="locked()"
        [class.text-foreground-40]="!locked()"
        [class.group-hover:text-foreground-80]="!locked()"
        aria-hidden="true"
      >{{ locked() ? 'lock' : 'unlock' }}</i>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetLockToggleComponent {
  readonly locked = input<boolean>(false);
  readonly toggle = output<MouseEvent>();
}
