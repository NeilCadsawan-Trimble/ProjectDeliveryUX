import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ModusTypographyComponent, type TypographySize, type TypographyWeight } from '../../components/modus-typography.component';
import { WidgetResizeHandleComponent } from './widget-resize-handle.component';

@Component({
  selector: 'app-widget-frame',
  imports: [ModusTypographyComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="relative h-full">
      <div
        class="bg-card rounded-lg overflow-hidden flex flex-col h-full"
        [class.border-default]="!selected()"
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
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40 flex-shrink-0">{{ meta }}</modus-typography>
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
  readonly titleClassName = input<string>('');
  readonly headerPadding = input<string>('px-6 py-4');

  readonly insight = input<string | null>(null);
  readonly titleMeta = input<string | undefined>(undefined);

  readonly headerMouseDown = output<MouseEvent>();
  readonly headerTouchStart = output<TouchEvent>();
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
}
