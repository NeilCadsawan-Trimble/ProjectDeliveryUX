import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WidgetResizeHandleComponent } from '../../../shell/components/widget-resize-handle.component';

/**
 * Shared chrome for draggable home dashboard widgets: card shell, default header row
 * (drag handle + icon + title), projected body, resize handle.
 *
 * Lock toggle stays on the parent (`home-page` shares one toggle per widget slot).
 */
@Component({
  selector: 'app-home-widget-frame',
  imports: [WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="relative h-full">
      <div
        class="bg-card rounded-lg overflow-hidden flex flex-col h-full"
        [class.border-default]="!selected()"
        [class.border-primary]="selected()"
      >
        <div
          class="flex items-center justify-between border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
          [class]="headerRowClass()"
          (mousedown)="headerMouseDown.emit($event)"
          (touchstart)="headerTouchStart.emit($event)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <i class="modus-icons text-base text-foreground-40 flex-shrink-0" aria-hidden="true" data-drag-handle
              >drag_indicator</i
            >
            <i class="modus-icons text-lg flex-shrink-0" [class]="iconToneClass()" aria-hidden="true">{{ icon() }}</i>
            <div [class]="titleClass()" role="heading" aria-level="2">{{ title() }}</div>
            @if (titleMeta(); as meta) {
              <div class="text-xs text-foreground-40 flex-shrink-0">{{ meta }}</div>
            }
            <ng-content select="[data-home-widget-title-extra]" />
          </div>
          <ng-content select="[data-home-widget-header-trailing]" />
        </div>
        <ng-content />
      </div>
      <widget-resize-handle
        [isMobile]="isMobile()"
        (resizeStart)="resizeStart.emit($event)"
        (resizeTouchStart)="resizeTouchStart.emit($event)"
      />
    </div>
  `,
})
export class HomeWidgetFrameComponent {
  /** Reserved for tests / future aria wiring; not rendered in the template today. */
  readonly widgetId = input.required<string>();
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly selected = input.required<boolean>();
  readonly isMobile = input<boolean>(false);

  /** Optional muted text after the title (e.g. counts). */
  readonly titleMeta = input<string | undefined>(undefined);

  /** Padding (and any layout) for the header row. */
  readonly headerRowClass = input<string>('px-5 py-4');

  readonly titleClass = input<string>('text-base font-semibold text-foreground');

  readonly iconToneClass = input<string>('text-foreground-60');

  readonly headerMouseDown = output<MouseEvent>();
  readonly headerTouchStart = output<TouchEvent>();
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
}
