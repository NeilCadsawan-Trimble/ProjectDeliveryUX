import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { NavItem } from '../project-dashboard.config';

@Component({
  selector: 'app-collapsible-subnav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-shrink-0 bg-secondary flex flex-col transition-all duration-200 overflow-hidden"
      [class.w-56]="!collapsed()"
      [class.w-8]="collapsed()"
      [class.rounded-r-lg]="!canvasMode()"
      [class.rounded-lg]="canvasMode()">
      <div class="flex items-center py-3 flex-shrink-0"
        [class.pl-4]="!collapsed()"
        [class.pr-2]="!collapsed()"
        [class.justify-between]="!collapsed()"
        [class.justify-center]="collapsed()">
        @if (!collapsed()) {
          <div class="flex items-center gap-2">
            <i class="modus-icons text-base text-primary" aria-hidden="true">{{ icon() }}</i>
            <div class="text-sm font-semibold text-primary">{{ title() }}</div>
          </div>
        }
        <div class="flex items-center justify-center w-6 h-6 rounded cursor-pointer hover:bg-muted transition-colors duration-150"
          role="button" tabindex="0"
          [attr.aria-label]="collapsed() ? 'Expand side navigation' : 'Collapse side navigation'"
          (click)="toggleCollapsed()">
          <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</i>
        </div>
      </div>
      @if (!collapsed()) {
        <div class="flex-1 overflow-y-auto min-h-0">
          @for (item of items(); track item.value) {
            <div
              class="py-2.5 text-sm cursor-pointer transition-colors duration-150"
              [class.bg-primary]="activeItem() === item.value"
              [class.text-primary-foreground]="activeItem() === item.value"
              [class.font-medium]="activeItem() === item.value"
              [class.rounded-md]="activeItem() === item.value"
              [class.mx-2]="activeItem() === item.value"
              [class.px-2]="activeItem() === item.value"
              [class.px-4]="activeItem() !== item.value"
              [class.text-foreground]="activeItem() !== item.value"
              [class.hover:bg-muted]="activeItem() !== item.value"
              role="button" tabindex="0"
              (click)="itemSelect.emit(item.value)"
              (keydown.enter)="itemSelect.emit(item.value)">
              {{ item.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CollapsibleSubnavComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly items = input.required<NavItem[]>();
  readonly activeItem = input.required<string>();
  readonly collapsed = input.required<boolean>();
  readonly canvasMode = input<boolean>(false);

  readonly itemSelect = output<string>();
  readonly collapsedChange = output<boolean>();

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }
}
