import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusTypographyComponent, type TypographySize, type TypographyWeight } from '../../components/modus-typography.component';
import { WidgetResizeHandleComponent } from './widget-resize-handle.component';

/**
 * Shared widget chrome (bg-card surface, drag-handle header, title typography,
 * optional insight row, optional resize handle).
 *
 * KNOWN TECH DEBT (May 28, 2026): ~20 pre-existing widgets predate this
 * component and still render their header inline by duplicating the
 * `bg-card` + `border-bottom-default cursor-grab` row markup. Any change
 * here (default styling, padding, accessibility, title color, etc.) must
 * also be mirrored across the inline copies, or those widgets silently
 * regress. Inline holdouts live in:
 *   - src/app/pages/home-page/home-page.component.ts
 *       (homeTimeOff, homeCalendar, homeRfis, homeSubmittals, homeUrgentNeeds)
 *   - src/app/pages/financials-page/financials-page.component.ts
 *       (all 13 widgets: Revenue, Open Estimates, Budget, Job Costs, Change
 *       Orders, Invoice Queue, Payment Schedule, Vendor Aging, Pay Apps,
 *       Lien Waivers, Retention, AP Activity, Cash Outflow)
 *   - src/app/pages/projects-page/projects-page.component.html
 *       (Portfolio Timeline, per-project cards)
 *
 * Most could trivially migrate (headerExtra + headerTrailing slots cover
 * their custom controls). Real blockers before a full migration:
 *   - homeCalendar needs a `headerBelow` slot (sub-header day strip) and a
 *     `footer` slot (legend row) -- this component currently has only one
 *     `<ng-content />` for the body.
 *   - homeRfis / homeSubmittals swap the drag handle for a back-arrow in
 *     compact-mobile-expanded mode; drag handle is hardcoded here with no
 *     `hideDragHandle` / override input.
 *
 * See `Widget header drift` row in
 * `.cursor/rules/longterm-memory.mdc` → Known Fragile Areas.
 */
@Component({
  selector: 'app-widget-frame',
  imports: [ModusTypographyComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="relative h-full">
      <div
        class="bg-card rounded-lg overflow-hidden flex flex-col h-full"
        [class.border-widget-outer]="!selected()"
        [class.border-primary]="selected()"
      >
        <div class="flex flex-col border-bottom-default flex-shrink-0">
          <div
            class="flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
            [class]="headerPadding()"
            (mousedown)="headerMouseDown.emit($event)"
            (touchstart)="headerTouchStart.emit($event)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle
                >drag_indicator</i
              >
              <i class="modus-icons text-lg flex-shrink-0" [class]="iconClass()" aria-hidden="true">{{ icon() }}</i>
              <modus-typography hierarchy="h4" [size]="titleSize()" [weight]="titleWeight()" [className]="titleClassName()">{{ title() }}</modus-typography>
              @if (titleMeta(); as meta) {
                <modus-typography class="flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-40">{{ meta }}</modus-typography>
              }
              <ng-content select="[headerExtra]" />
            </div>
            <ng-content select="[headerTrailing]" />
          </div>
          @if (insight()) {
            <div class="flex items-center gap-1.5 px-6 py-2 border-top-default -mt-1">
              <i class="modus-icons text-xs text-primary flex-shrink-0" aria-hidden="true">lightning</i>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ insight() }}</modus-typography>
            </div>
          }
        </div>
        <ng-content />
      </div>
      @if (resizable()) {
        <widget-resize-handle
          [isMobile]="isMobile()"
          (resizeStart)="resizeStart.emit($event)"
          (resizeTouchStart)="resizeTouchStart.emit($event)"
        />
      }
    </div>
  `,
})
export class WidgetFrameComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly selected = input<boolean>(false);
  readonly isMobile = input<boolean>(false);
  readonly resizable = input<boolean>(true);

  readonly iconClass = input<string>('text-primary');
  readonly titleSize = input<TypographySize>('md');
  readonly titleWeight = input<TypographyWeight>('semibold');
  readonly titleClassName = input<string>('text-foreground-strong');
  readonly headerPadding = input<string>('px-6 py-4');

  readonly insight = input<string | null>(null);
  readonly titleMeta = input<string | undefined>(undefined);

  readonly headerMouseDown = output<MouseEvent>();
  readonly headerTouchStart = output<TouchEvent>();
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
}
