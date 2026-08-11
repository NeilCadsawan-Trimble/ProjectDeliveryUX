import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  ModusTypographyComponent,
  type TypographyHierarchy,
  type TypographySize,
  type TypographyWeight,
} from '../../components/modus-typography.component';
import { WidgetResizeHandleComponent } from './widget-resize-handle.component';

/**
 * Shared widget chrome used by every dashboard widget. Provides the
 * `bg-card` surface, drag-handle header, title typography, optional
 * insight row, optional sub-header / footer slots, and the optional
 * resize handle.
 *
 * History: ~20 widgets across home / financials / projects pages used to
 * duplicate this header markup inline. The May 28, 2026 refactor migrated
 * all of them onto this component. A static test enforces the no-inline
 * rule (`tests/static/widget-frame-enforcement.spec.ts`).
 *
 * Composition (top to bottom):
 *
 *   [drag handle | back button] [icon?] [title] [titleMeta?] [headerExtra]
 *                                                       [headerTrailing]
 *   ──────── (insight row, if `insight()` set)
 *   [headerBelow slot]  (e.g. day strip, filter pill row)
 *   ──────── (wrapper `border-bottom-default`)
 *   <ng-content />      (default body slot)
 *   [footer slot]       (e.g. legend, summary row)
 *   ──────── resize handle (if `resizable()`)
 *
 * Slot conventions:
 *   - `[headerExtra]` — inline beside the title (badges, count chips).
 *   - `[headerTrailing]` — right-aligned header controls (tabs, nav arrows).
 *   - `[headerBelow]` — full-width sub-header below header + insight.
 *     Caller adds own `border-top-default` to separate from above.
 *   - `[footer]` — full-width footer below the body. Caller adds own
 *     `border-top-default`.
 *
 * Back-button mode: pass `backButtonAriaLabel` (and wire `backClick`) to
 * swap the drag handle for a back-arrow button — used by compact-mobile
 * expanded states on homeRfis, homeSubmittals, homeTimeOff. The back
 * button stops mouse/touch propagation so widget drag-start does not fire.
 *
 * Overflow: defaults to `overflow-hidden` on the outer card. Set
 * `overflowVisible=true` for widgets that pop dropdowns out of the card
 * bounds (e.g. homeUrgentNeeds category filter, homeTimeOff status menu).
 *
 * Heading hierarchy: defaults to `h4`. Pass `titleHierarchy` for pages
 * that use a different document-outline level (financials uses `h2`,
 * home uses `h3`, projsTimeline uses `p`).
 *
 * Drag handle size: defaults to `md` (text-base). Pass `dragHandleSize='sm'`
 * (text-sm) for compact widgets like projects-page per-project cards.
 */
@Component({
  selector: 'app-widget-frame',
  imports: [ModusTypographyComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="relative h-full">
      <div
        class="bg-card rounded-lg flex flex-col h-full"
        [class.overflow-hidden]="!overflowVisible()"
        [class.overflow-visible]="overflowVisible()"
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
              @if (backButtonAriaLabel(); as backLabel) {
                <div
                  class="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted transition-colors duration-150 -ml-1 mr-1 flex-shrink-0"
                  role="button"
                  tabindex="0"
                  [attr.aria-label]="backLabel"
                  (click)="$event.stopPropagation(); backClick.emit()"
                  (mousedown)="$event.stopPropagation()"
                  (touchstart)="$event.stopPropagation()"
                  (keydown.enter)="backClick.emit()"
                  (keydown.space)="$event.preventDefault(); backClick.emit()"
                >
                  <i class="modus-icons text-base text-foreground-60" aria-hidden="true">arrow_left</i>
                </div>
              } @else {
                <i
                  class="modus-icons text-foreground-40 flex-shrink-0"
                  [class.text-base]="dragHandleSize() === 'md'"
                  [class.text-sm]="dragHandleSize() === 'sm'"
                  aria-hidden="true"
                  data-drag-handle
                  >drag_indicator</i
                >
              }
              @if (icon(); as iconName) {
                <i class="modus-icons text-lg flex-shrink-0" [class]="iconClass()" aria-hidden="true">{{ iconName }}</i>
              }
              <modus-typography
                [hierarchy]="titleHierarchy()"
                [size]="titleSize()"
                [weight]="titleWeight()"
                [className]="resolvedTitleClassName()"
                [attr.role]="titleClickable() ? 'link' : null"
                [attr.tabindex]="titleClickable() ? 0 : null"
                [attr.aria-label]="titleClickable() ? (titleAriaLabel() ?? title()) : null"
                (click)="titleClickable() && onTitleClick($event)"
                (mousedown)="titleClickable() && onTitlePointerDown($event)"
                (touchstart)="titleClickable() && onTitlePointerDown($event)"
                (keydown.enter)="titleClickable() && onTitleClick($event)"
                (keydown.space)="titleClickable() && onTitleKeydownSpace($event)"
                >{{ title() }}</modus-typography
              >
              @if (titleMeta(); as meta) {
                <modus-typography class="flex-shrink-0" hierarchy="p" size="xs" className="text-foreground-40">{{ meta }}</modus-typography>
              }
              <ng-content select="[headerExtra]" />
            </div>
            <ng-content select="[headerTrailing]" />
          </div>
          @if (insight()) {
            <div class="flex items-center gap-1.5 border-top-default -mt-1" [class]="insightPadding()">
              <i class="modus-icons text-xs text-primary flex-shrink-0" aria-hidden="true">lightning</i>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ insight() }}</modus-typography>
            </div>
          }
          <ng-content select="[headerBelow]" />
        </div>
        <ng-content />
        <ng-content select="[footer]" />
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
  readonly icon = input<string | null>(null);
  readonly title = input.required<string>();
  readonly selected = input<boolean>(false);
  readonly isMobile = input<boolean>(false);
  readonly resizable = input<boolean>(true);
  readonly overflowVisible = input<boolean>(false);

  readonly iconClass = input<string>('text-primary');
  readonly titleHierarchy = input<TypographyHierarchy>('h4');
  readonly titleSize = input<TypographySize>('md');
  readonly titleWeight = input<TypographyWeight>('semibold');
  readonly titleClassName = input<string>('text-foreground-strong');
  /** When true, title renders as a navigable link and suppresses drag-start on pointer down. */
  readonly titleClickable = input<boolean>(false);
  readonly titleAriaLabel = input<string | undefined>(undefined);
  readonly headerPadding = input<string>('px-6 py-4');
  readonly insightPadding = input<string>('px-6 py-2');
  readonly dragHandleSize = input<'sm' | 'md'>('md');

  readonly insight = input<string | null>(null);
  readonly titleMeta = input<string | undefined>(undefined);

  /**
   * When set (non-null), the drag handle is replaced by a back-arrow button
   * with this aria-label. Use together with the `backClick` output. Used by
   * compact-mobile expanded states on homeRfis, homeSubmittals, homeTimeOff.
   */
  readonly backButtonAriaLabel = input<string | null>(null);

  readonly headerMouseDown = output<MouseEvent>();
  readonly headerTouchStart = output<TouchEvent>();
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
  readonly backClick = output<void>();
  readonly titleClick = output<MouseEvent>();

  readonly resolvedTitleClassName = computed(() => {
    const base = this.titleClassName();
    return this.titleClickable() ? `${base} text-primary cursor-pointer hover:underline` : base;
  });

  onTitleClick(event: Event): void {
    event.stopPropagation();
    this.titleClick.emit(event as MouseEvent);
  }

  onTitlePointerDown(event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
  }

  onTitleKeydownSpace(event: Event): void {
    event.preventDefault();
    this.onTitleClick(event);
  }
}
