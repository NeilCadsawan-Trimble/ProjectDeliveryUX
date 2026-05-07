import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusWcMenu } from '@trimble-oss/moduswebcomponents-angular';

export type MenuOrientation = 'horizontal' | 'vertical';
export type MenuSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'modus-menu',
  imports: [ModusWcMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <modus-wc-menu
      [bordered]="bordered()"
      [customClass]="className()"
      [orientation]="orientation()"
      [size]="size()"
      (menuFocusout)="handleFocusOut($event)"
    >
      <ng-content />
    </modus-wc-menu>
  `,
})
export class ModusMenuComponent {
  readonly bordered = input<boolean>(false);
  readonly className = input<string | undefined>();
  readonly orientation = input<MenuOrientation>('vertical');
  readonly size = input<MenuSize>('md');

  readonly menuFocusout = output<FocusEvent>();

  handleFocusOut(event: CustomEvent<FocusEvent>): void {
    this.menuFocusout.emit(event.detail);
  }
}
