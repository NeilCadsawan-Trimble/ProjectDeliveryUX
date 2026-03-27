import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { WidgetResizeHandleComponent } from '../../../shell/components/widget-resize-handle.component';

@Component({
  selector: 'app-widget-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WidgetResizeHandleComponent],
  template: `
    <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full"
      [class.border-default]="!isSelected()"
      [class.border-primary]="isSelected()">
      <div class="flex items-center justify-between px-6 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
        (mousedown)="headerMouseDown.emit($event)"
        (touchstart)="headerTouchStart.emit($event)">
        <div class="flex items-center gap-2">
          <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
          <i class="modus-icons text-lg" [class]="iconClass()" aria-hidden="true">{{ icon() }}</i>
          <div class="text-base font-semibold text-foreground">{{ title() }}</div>
          <ng-content select="[headerExtra]" />
        </div>
        <ng-content select="[headerMeta]" />
      </div>
      <ng-content />
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
  readonly iconClass = input<string>('text-primary');
  readonly isSelected = input<boolean>(false);
  readonly isMobile = input<boolean>(false);
  readonly resizable = input<boolean>(true);

  readonly headerMouseDown = output<MouseEvent>();
  readonly headerTouchStart = output<TouchEvent>();
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
}
