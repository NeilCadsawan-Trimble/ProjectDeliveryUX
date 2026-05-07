import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusWcDropdownMenu } from '@trimble-oss/moduswebcomponents-angular';

export type DropdownButtonColor = 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
export type DropdownButtonVariant = 'borderless' | 'filled' | 'outlined';
export type DropdownButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type DropdownPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

@Component({
  selector: 'modus-dropdown-menu',
  imports: [ModusWcDropdownMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <modus-wc-dropdown-menu
      [buttonAriaLabel]="buttonAriaLabel()"
      [buttonColor]="buttonColor()"
      [buttonSize]="buttonSize()"
      [buttonVariant]="buttonVariant()"
      [customClass]="className()"
      [disabled]="disabled()"
      [menuBordered]="menuBordered()"
      [menuOffset]="menuOffset()"
      [menuPlacement]="menuPlacement()"
      [menuSize]="menuSize()"
      (menuVisibilityChange)="handleVisibilityChange($event)"
    >
      <ng-content select="[slot='button']" slot="button" />
      <ng-content select="[slot='menu']" slot="menu" />
    </modus-wc-dropdown-menu>
  `,
})
export class ModusDropdownMenuComponent {
  readonly buttonAriaLabel = input<string | undefined>();
  readonly buttonColor = input<DropdownButtonColor>('primary');
  readonly buttonSize = input<DropdownButtonSize>('md');
  readonly buttonVariant = input<DropdownButtonVariant>('filled');
  readonly className = input<string | undefined>();
  readonly disabled = input<boolean>(false);
  readonly menuBordered = input<boolean>(true);
  readonly menuOffset = input<number>(10);
  readonly menuPlacement = input<DropdownPlacement>('bottom-start');
  readonly menuSize = input<DropdownButtonSize>('md');

  readonly menuVisibilityChange = output<{ isVisible: boolean }>();

  handleVisibilityChange(event: CustomEvent<{ isVisible: boolean }>): void {
    this.menuVisibilityChange.emit(event.detail);
  }
}
