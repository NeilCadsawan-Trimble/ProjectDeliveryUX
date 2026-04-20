import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { NavItem } from '../project-dashboard.config';
import type { AgentAlert } from '../../../data/widget-agents';

@Component({
  selector: 'app-collapsible-subnav',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex-shrink-0 transition-all duration-200 relative"
      [style.width.px]="outerWidth()">

      <div class="bg-secondary flex flex-col overflow-hidden transition-all duration-200 absolute top-0 left-0 rounded-lg"
        [style.width.px]="innerWidth()"
        [style.max-height]="panelMaxHeight()"
        [style.z-index]="innerZIndex()">

        <div class="flex items-center py-3 pl-4 pr-2 justify-between flex-shrink-0 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="button" tabindex="0"
          [attr.aria-label]="collapsed() ? 'Expand side navigation' : 'Collapse side navigation'"
          (click)="toggleCollapsed()"
          (keydown.enter)="toggleCollapsed()">
          <div class="flex items-center gap-2 min-w-0">
            <i class="modus-icons text-base text-primary flex-shrink-0" aria-hidden="true">{{ icon() }}</i>
            <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate text-primary">
              {{ title() }}
            </modus-typography>
          </div>
          <div class="flex items-center justify-center w-6 h-6 rounded flex-shrink-0">
            <i class="modus-icons text-sm text-foreground-60 transition-transform duration-200" aria-hidden="true"
              [style.transform]="collapsed() ? 'rotate(0deg)' : 'rotate(-90deg)'"
            >chevron_left</i>
          </div>
        </div>

        <div class="overflow-hidden transition-all duration-200 flex-1 min-h-0 flex flex-col"
          [style.max-height]="collapsed() ? '0px' : 'none'"
          [style.opacity]="collapsed() ? 0 : 1">
          <div class="overflow-y-auto min-h-0 flex-1 pb-2">
            @for (item of items(); track item.value) {
              <div
                class="flex items-center justify-between py-2.5 cursor-pointer transition-colors duration-150 whitespace-nowrap"
                [class.bg-primary]="activeItem() === item.value"
                [class.rounded-md]="activeItem() === item.value"
                [class.mx-2]="activeItem() === item.value"
                [class.px-2]="activeItem() === item.value"
                [class.px-4]="activeItem() !== item.value"
                [class.hover:bg-muted]="activeItem() !== item.value"
                role="button" tabindex="0"
                (click)="onItemSelect(item.value)"
                (keydown.enter)="onItemSelect(item.value)">
                <div class="flex items-center gap-2">
                  @if (item.icon) {
                    <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true"
                      [class.text-primary-foreground]="activeItem() === item.value"
                      [class.text-foreground-60]="activeItem() !== item.value"
                    >{{ item.icon }}</i>
                  }
                  <modus-typography size="sm" [weight]="activeItem() === item.value ? 'semibold' : 'normal'" [className]="activeItem() === item.value ? 'text-primary-foreground' : 'text-foreground'">{{ item.label }}</modus-typography>
                </div>
                @if (getItemAlert(item.value); as alert) {
                  <div class="flex-shrink-0 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1 mr-1"
                    [class.bg-destructive]="alert.level === 'critical'"
                    [class.bg-warning]="alert.level === 'warning'"
                    [class.bg-primary]="alert.level === 'info'"
                    [attr.title]="alert.count + ' ' + alert.label">
                    <modus-typography size="xs" weight="bold" [className]="'text-2xs ' + (alert.level === 'critical' ? 'text-destructive-foreground' : alert.level === 'warning' ? 'text-warning-foreground' : 'text-primary-foreground')">{{ alert.count }}</modus-typography>
                  </div>
                }
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
  readonly isMobile = input<boolean>(false);
  readonly alerts = input<Record<string, AgentAlert | null>>({});

  readonly itemSelect = output<string>();
  readonly collapsedChange = output<boolean>();

  readonly outerWidth = computed(() => {
    if (this.isMobile()) return 0;
    return this.collapsed() ? 0 : 227;
  });

  readonly innerWidth = computed(() => 227);

  readonly innerZIndex = computed(() => this.collapsed() ? 10 : 1);

  readonly panelMaxHeight = computed(() => {
    if (this.canvasMode()) return 'none';
    return 'calc(100dvh - 102px)';
  });

  readonly activeItemLabel = computed(() => {
    const active = this.activeItem();
    return this.items().find(i => i.value === active)?.label ?? this.title();
  });

  getItemAlert(value: string): AgentAlert | null {
    return this.alerts()[value] ?? null;
  }

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed());
  }

  onItemSelect(value: string): void {
    this.itemSelect.emit(value);
  }
}
