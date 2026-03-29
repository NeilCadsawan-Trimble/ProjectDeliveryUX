import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type Signal,
} from '@angular/core';
import type { TileRect } from '../../../shell/services/subpage-tile-canvas';

/**
 * Outer wrapper for canvas-mode record/financial tiles: visibility stays on the parent
 * (`subnavViewMode` gate); this host uses `display: contents` so only the inner `absolute`
 * box participates in layout.
 */
@Component({
  selector: 'app-canvas-tile-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
  template: `
    <div
      [class]="wrapperClass()"
      [attr.data-tile-id]="tileId()"
      [style.top.px]="rectTop()"
      [style.left.px]="rectLeft()"
      [style.width.px]="rectWidth()"
      [style.height.px]="rectHeight()"
      [style.z-index]="zIndex()"
      [class.opacity-30]="dimOnMoveTarget() && isMoveTarget()"
      (mousedown)="onMouseDown($event)"
    >
      <ng-content />
    </div>
  `,
})
export class CanvasTileShellComponent {
  readonly tileId = input.required<string>();
  readonly tilePos = input.required<Signal<Record<string, TileRect | undefined>>>();
  readonly tileZ = input.required<Signal<Record<string, number | undefined>>>();
  /** Truthy when this tile's detail panel is open (any non-empty stored view). */
  readonly tileDetailViews = input.required<Signal<Record<string, unknown>>>();
  readonly tileMoveTargetId = input.required<Signal<string | null>>();

  readonly defaultWidth = input(308);
  readonly defaultHeight = input(220);
  /** When false, skips `opacity-30` while this tile is the move target. */
  readonly dimOnMoveTarget = input(true);

  readonly tileSelect = output<string>();
  readonly mousedownOnExpanded = output<MouseEvent>();

  private readonly posMap = computed(() => this.tilePos()());
  private readonly zMap = computed(() => this.tileZ()());
  private readonly detailMap = computed(() => this.tileDetailViews()());
  private readonly moveTarget = computed(() => this.tileMoveTargetId()());

  private readonly rect = computed(() => this.posMap()[this.tileId()]);

  readonly rectTop = computed(() => this.rect()?.top ?? 0);
  readonly rectLeft = computed(() => this.rect()?.left ?? 0);
  readonly rectWidth = computed(() => this.rect()?.width ?? this.defaultWidth());
  readonly rectHeight = computed(() => this.rect()?.height ?? this.defaultHeight());

  readonly isExpanded = computed(() => this.detailMap()[this.tileId()] != null);

  readonly zIndex = computed(() =>
    this.isExpanded() ? 9999 : (this.zMap()[this.tileId()] ?? 0),
  );

  readonly wrapperClass = computed(() => {
    const id = this.tileId();
    const moveId = this.moveTarget();
    const transition = moveId !== id ? ' widget-detail-transition' : '';
    return 'absolute' + transition;
  });

  readonly isMoveTarget = computed(() => this.moveTarget() === this.tileId());

  onMouseDown(ev: MouseEvent): void {
    this.tileSelect.emit(this.tileId());
    if (this.isExpanded()) {
      this.mousedownOnExpanded.emit(ev);
      ev.stopPropagation();
    }
  }
}
