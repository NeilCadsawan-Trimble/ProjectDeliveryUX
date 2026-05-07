import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusWcMenuItem } from '@trimble-oss/moduswebcomponents-angular';

export type MenuItemSize = 'sm' | 'md' | 'lg';
export type MenuItemTooltipPosition = 'auto' | 'top' | 'right' | 'bottom' | 'left';

@Component({
  selector: 'modus-menu-item',
  imports: [ModusWcMenuItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <modus-wc-menu-item
      [bordered]="bordered()"
      [checkbox]="checkbox()"
      [customClass]="className()"
      [disabled]="disabled()"
      [focused]="focused()"
      [label]="label()"
      [attr.start-icon]="startIcon()"
      [selected]="selected()"
      [attr.selected]="selected() ? '' : null"
      [size]="size()"
      [subLabel]="subLabel()"
      [tooltipContent]="tooltipContent()"
      [tooltipPosition]="tooltipPosition()"
      [value]="value()"
      (itemSelect)="handleItemSelect($event)"
    >
      <ng-content select="[slot='start-icon']" slot="start-icon" />
    </modus-wc-menu-item>
  `,
})
export class ModusMenuItemComponent {
  readonly bordered = input<boolean>(false);
  readonly checkbox = input<boolean>(false);
  readonly className = input<string | undefined>();
  readonly disabled = input<boolean>(false);
  readonly focused = input<boolean>(false);
  readonly label = input.required<string>();
  readonly startIcon = input<string | undefined>();
  readonly selected = input<boolean>(false);
  readonly size = input<MenuItemSize>('md');
  readonly subLabel = input<string | undefined>();
  readonly tooltipContent = input<string | undefined>();
  readonly tooltipPosition = input<MenuItemTooltipPosition>('auto');
  readonly value = input.required<string>();

  readonly itemSelect = output<{ value: string }>();

  handleItemSelect(event: CustomEvent<{ value: string }>): void {
    this.itemSelect.emit(event.detail);
  }
}
