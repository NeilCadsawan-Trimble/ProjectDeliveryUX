import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { NavItem } from '../project-dashboard.config';

@Component({
  selector: 'app-collapsible-subnav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-shrink-0 transition-all duration-200 relative"
      [style.width.px]="collapsed() ? 0 : 227">

      <div class="bg-secondary flex flex-col overflow-hidden transition-all duration-200 absolute top-0 left-0"
        [style.width.px]="227"
        [style.z-index]="collapsed() ? 10 : 1"
        [class.rounded-r-lg]="!canvasMode()"
        [class.rounded-lg]="canvasMode()">

        <!-- Header: clickable toggle -->
        <div class="flex items-center py-3 pl-4 pr-2 justify-between flex-shrink-0 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="button" tabindex="0"
          [attr.aria-label]="collapsed() ? 'Expand side navigation' : 'Collapse side navigation'"
          (click)="toggleCollapsed()"
          (keydown.enter)="toggleCollapsed()">
          <div class="flex items-center gap-2 min-w-0">
            <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">{{ icon() }}</i>
            <div class="text-sm font-semibold truncate" [class]="collapsed() ? 'text-foreground' : 'text-primary'">
              {{ collapsed() ? activeItemLabel() : title() }}
            </div>
          </div>
          <div class="flex items-center justify-center w-6 h-6 rounded flex-shrink-0">
            <i class="modus-icons text-sm text-foreground-60 transition-transform duration-200" aria-hidden="true"
              [style.transform]="collapsed() ? 'rotate(0deg)' : 'rotate(-90deg)'"
            >chevron_left</i>
          </div>
        </div>

        <!-- Items list: rolls up/down via max-height -->
        <div class="overflow-hidden transition-all duration-200"
          [style.max-height.px]="collapsed() ? 0 : 600"
          [style.opacity]="collapsed() ? 0 : 1">
          <div class="overflow-y-auto min-h-0">
            @for (item of items(); track item.value) {
              <div
                class="py-2.5 text-sm cursor-pointer transition-colors duration-150 whitespace-nowrap"
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
                (click)="onItemSelect(item.value)"
                (keydown.enter)="onItemSelect(item.value)">
                {{ item.label }}
              </div>
            }
          </div>
        </div>
      </div>
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

  readonly activeItemLabel = computed(() => {
    const active = this.activeItem();
    return this.items().find(i => i.value === active)?.label ?? this.title();
  });

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  onItemSelect(value: string): void {
    this.itemSelect.emit(value);
    this.collapsedChange.emit(true);
  }
}
