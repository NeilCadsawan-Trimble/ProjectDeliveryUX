import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'widget-resize-handle',
  template: `
    <div
      class="absolute bottom-0 w-5 h-5 z-30 select-none group"
      [class.right-0]="position() === 'right'"
      [class.left-0]="position() === 'left'"
      [class.cursor-nwse-resize]="!isMobile() && position() === 'right'"
      [class.cursor-nesw-resize]="!isMobile() && position() === 'left'"
      [class.cursor-ns-resize]="isMobile()"
      (mousedown)="resizeStart.emit($event)"
      (touchstart)="resizeTouchStart.emit($event)"
      title="Drag to resize"
    >
      <div
        class="absolute bottom-1 flex flex-col gap-0.5 pointer-events-none"
        [class.right-1]="position() === 'right'"
        [class.left-1]="position() === 'left'"
      >
        <div class="flex gap-0.5">
          <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
          <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
        </div>
        <div class="flex gap-0.5">
          <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
          <div class="w-1 h-1 rounded-full bg-foreground-20 group-hover:bg-foreground-60 transition-colors duration-150"></div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetResizeHandleComponent {
  readonly isMobile = input<boolean>(false);
  readonly position = input<'left' | 'right'>('right');
  readonly resizeStart = output<MouseEvent>();
  readonly resizeTouchStart = output<TouchEvent>();
}
