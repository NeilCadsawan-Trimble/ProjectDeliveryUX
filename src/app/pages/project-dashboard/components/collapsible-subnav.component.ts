import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { NavItem } from '../project-dashboard.config';
import type { AgentAlert } from '../../../data/widget-agents';

@Component({
  selector: 'app-collapsible-subnav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobile() && !collapsed()) {
      <div class="fixed inset-0 z-[9998]"
        (click)="collapsedChange.emit(true)"></div>
    }

    <div class="flex-shrink-0 transition-all duration-200 relative"
      [style.width.px]="outerWidth()">

      <div class="bg-secondary flex flex-col overflow-hidden transition-all duration-200 absolute top-0 left-0"
        [style.width.px]="innerWidth()"
        [style.z-index]="innerZIndex()"
        [class.rounded-r-lg]="!canvasMode()"
        [class.rounded-lg]="canvasMode()"
        [class.shadow-lg]="isMobile() && !collapsed()">

        @if (mobileCompact()) {
          <div class="flex flex-col items-center py-3 gap-1 cursor-pointer hover:bg-muted transition-colors duration-150"
            role="button" tabindex="0"
            aria-label="Expand side navigation"
            (click)="toggleCollapsed()"
            (keydown.enter)="toggleCollapsed()">
            <div class="relative">
              <i class="modus-icons text-lg text-primary" aria-hidden="true">{{ icon() }}</i>
              @if (totalAlertCount() > 0) {
                <div class="absolute -top-1.5 -right-2.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-2xs font-bold px-0.5"
                  [class.bg-destructive]="hasCriticalAlerts()"
                  [class.text-destructive-foreground]="hasCriticalAlerts()"
                  [class.bg-warning]="!hasCriticalAlerts()"
                  [class.text-warning-foreground]="!hasCriticalAlerts()">
                  {{ totalAlertCount() }}
                </div>
              }
            </div>
            <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">chevron_right</i>
          </div>
        } @else {
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
              @if (totalAlertCount() > 0) {
                <div class="flex-shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-2xs font-bold px-1"
                  [class.bg-destructive]="hasCriticalAlerts()"
                  [class.text-destructive-foreground]="hasCriticalAlerts()"
                  [class.bg-warning]="!hasCriticalAlerts()"
                  [class.text-warning-foreground]="!hasCriticalAlerts()">
                  {{ totalAlertCount() }}
                </div>
              }
            </div>
            <div class="flex items-center justify-center w-6 h-6 rounded flex-shrink-0">
              <i class="modus-icons text-sm text-foreground-60 transition-transform duration-200" aria-hidden="true"
                [style.transform]="collapsed() ? 'rotate(0deg)' : 'rotate(-90deg)'"
              >chevron_left</i>
            </div>
          </div>
        }

        <div class="overflow-hidden transition-all duration-200"
          [style.max-height.px]="collapsed() ? 0 : 600"
          [style.opacity]="collapsed() ? 0 : 1">
          <div class="overflow-y-auto min-h-0">
            @for (item of items(); track item.value) {
              <div
                class="flex items-center justify-between py-2.5 text-sm cursor-pointer transition-colors duration-150 whitespace-nowrap"
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
                <div class="flex items-center gap-2">
                  @if (item.icon) {
                    <i class="modus-icons text-sm flex-shrink-0" aria-hidden="true"
                      [class.text-primary-foreground]="activeItem() === item.value"
                      [class.text-foreground-60]="activeItem() !== item.value"
                    >{{ item.icon }}</i>
                  }
                  <div>{{ item.label }}</div>
                </div>
                @if (getItemAlert(item.value); as alert) {
                  <div class="flex-shrink-0 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-2xs font-bold px-1 mr-1"
                    [class.bg-destructive]="alert.level === 'critical'"
                    [class.text-destructive-foreground]="alert.level === 'critical'"
                    [class.bg-warning]="alert.level === 'warning'"
                    [class.text-warning-foreground]="alert.level === 'warning'"
                    [class.bg-primary]="alert.level === 'info'"
                    [class.text-primary-foreground]="alert.level === 'info'"
                    [attr.title]="alert.count + ' ' + alert.label">
                    {{ alert.count }}
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

  readonly mobileCompact = computed(() => this.isMobile() && this.collapsed());

  readonly outerWidth = computed(() => {
    if (this.isMobile()) return 48;
    return this.collapsed() ? 0 : 227;
  });

  readonly innerWidth = computed(() => {
    if (this.mobileCompact()) return 48;
    return 227;
  });

  readonly innerZIndex = computed(() => {
    if (this.isMobile() && !this.collapsed()) return 9999;
    return this.collapsed() ? 10 : 1;
  });

  readonly activeItemLabel = computed(() => {
    const active = this.activeItem();
    return this.items().find(i => i.value === active)?.label ?? this.title();
  });

  readonly totalAlertCount = computed(() => {
    const a = this.alerts();
    let total = 0;
    for (const key of Object.keys(a)) {
      if (a[key]) total += a[key]!.count;
    }
    return total;
  });

  readonly hasCriticalAlerts = computed(() => {
    const a = this.alerts();
    return Object.values(a).some(v => v?.level === 'critical');
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
