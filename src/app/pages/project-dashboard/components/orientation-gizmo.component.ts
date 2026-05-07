import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Tokens emitted by `faceClick`. Each one references both the display letter
 * the user clicked AND the world axis that letter is bound to:
 *
 *   `+x` / `-x` -> red "X" cap -> world +X / -X axis (lateral / right axis)
 *   `+y` / `-y` -> green "Y" cap -> world +Y / -Y axis (vertical / up axis in
 *                                   glTF Y-up)
 *   `+z` / `-z` -> blue "Z" cap -> world +Z / -Z axis (forward / depth axis;
 *                                   glTF default model "front" faces +Z)
 *
 * Display letter and world axis are kept in lockstep on purpose so the
 * parent's `goToFace()` can map each token to the view down that same world
 * axis without the gizmo silently swapping coordinates.
 */
export type GizmoFace = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

interface ProjectedAxis {
  key: 'X' | 'Y' | 'Z';
  posFace: GizmoFace;
  negFace: GizmoFace;
  axisClass: string;
  labelClass: string;
  posCap: { x: number; y: number; depth: number };
  negCap: { x: number; y: number; depth: number };
  posIsCloser: boolean;
  sortKey: number;
}

/**
 * Flat 2D-style XYZ orientation gizmo overlay for a `<model-viewer>` 3D pane.
 *
 * Visual: a circular card-colored disc with a thin dashed outer ring, three
 * thin axis lines, a coloured cap with a foreground letter at each positive
 * end, and a small unlabelled coloured dot at each negative end. A subtle
 * drop shadow gives the caps a flat-illustration depth.
 *
 * Coordinate contract: paints the world axes of the loaded glTF
 * (model-viewer is Y-up, X = right, Y = up, Z = forward / model default
 * "front" face). Each colored cap is bound to its own world axis:
 *
 *   red    "X" cap <-> world +X (lateral / right axis)
 *   green  "Y" cap <-> world +Y (vertical / up axis)
 *   blue   "Z" cap <-> world +Z (depth / model-front axis)
 *
 * Math: each world unit axis is rotated through the inverse of
 * model-viewer's camera-positioning rotation `Ry(theta) * Rx(phi - 90deg)`,
 * giving `R_view = Rx(90deg - phi) * Ry(-theta)`. We expand the matrix
 * product symbolically once and apply directly inside `orderedAxes()` to
 * avoid per-axis trig calls.
 *
 * Painter's algorithm: SVG renders later elements on top of earlier ones,
 * so we depth-sort the three axis groups back-to-front by their nearest cap.
 */
@Component({
  selector: 'app-orientation-gizmo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <svg
      viewBox="-50 -50 100 100"
      preserveAspectRatio="xMidYMid meet"
      class="block w-full h-full overflow-visible pointer-events-none"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <defs>
        <filter id="orientation-gizmo-cap-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" />
          <feOffset dx="0" dy="0.7" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="0" cy="0" r="42" class="text-card" fill="currentColor" />
      <circle
        cx="0"
        cy="0"
        r="46"
        class="text-foreground-20"
        fill="none"
        stroke="currentColor"
        stroke-width="0.8"
        stroke-dasharray="2 2"
      />

      @for (axis of orderedAxes(); track axis.key) {
        <g [class]="axis.axisClass">
          <line
            [attr.x1]="axis.negCap.x"
            [attr.y1]="axis.negCap.y"
            [attr.x2]="axis.posCap.x"
            [attr.y2]="axis.posCap.y"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          @if (axis.posIsCloser) {
            <circle
              [attr.cx]="axis.negCap.x"
              [attr.cy]="axis.negCap.y"
              r="2.4"
              fill="currentColor"
              [class.pointer-events-auto]="enableFaceClicks()"
              [class.cursor-pointer]="enableFaceClicks()"
              (click)="onFaceClick(axis.negFace, $event)"
            />
            <circle
              [attr.cx]="axis.posCap.x"
              [attr.cy]="axis.posCap.y"
              r="9"
              fill="currentColor"
              filter="url(#orientation-gizmo-cap-shadow)"
              [class.pointer-events-auto]="enableFaceClicks()"
              [class.cursor-pointer]="enableFaceClicks()"
              (click)="onFaceClick(axis.posFace, $event)"
            />
            <g [class]="axis.labelClass">
              <text
                [attr.x]="axis.posCap.x"
                [attr.y]="axis.posCap.y"
                text-anchor="middle"
                dominant-baseline="central"
                font-size="11"
                font-weight="700"
                fill="currentColor"
              >
                {{ axis.key }}
              </text>
            </g>
          } @else {
            <circle
              [attr.cx]="axis.posCap.x"
              [attr.cy]="axis.posCap.y"
              r="9"
              fill="currentColor"
              filter="url(#orientation-gizmo-cap-shadow)"
              [class.pointer-events-auto]="enableFaceClicks()"
              [class.cursor-pointer]="enableFaceClicks()"
              (click)="onFaceClick(axis.posFace, $event)"
            />
            <g [class]="axis.labelClass">
              <text
                [attr.x]="axis.posCap.x"
                [attr.y]="axis.posCap.y"
                text-anchor="middle"
                dominant-baseline="central"
                font-size="11"
                font-weight="700"
                fill="currentColor"
              >
                {{ axis.key }}
              </text>
            </g>
            <circle
              [attr.cx]="axis.negCap.x"
              [attr.cy]="axis.negCap.y"
              r="2.4"
              fill="currentColor"
              [class.pointer-events-auto]="enableFaceClicks()"
              [class.cursor-pointer]="enableFaceClicks()"
              (click)="onFaceClick(axis.negFace, $event)"
            />
          }
        </g>
      }
    </svg>
  `,
})
export class OrientationGizmoComponent {
  readonly theta = input<number>(0);
  readonly phi = input<number>(90);
  readonly enableFaceClicks = input<boolean>(false);
  readonly faceClick = output<GizmoFace>();

  /**
   * Cap distance from the gizmo origin in viewBox units (the SVG viewBox is
   * 100 wide). Tuned so the labelled positive caps (r=9) sit comfortably
   * inside the disc (r=42) and the dashed outer ring (r=46).
   */
  private readonly capRadius = 28;

  readonly orderedAxes = computed<ProjectedAxis[]>(() => {
    const t = (this.theta() * Math.PI) / 180;
    const p = (this.phi() * Math.PI) / 180;
    const alpha = Math.PI / 2 - p;
    const beta = -t;
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);
    const cb = Math.cos(beta);
    const sb = Math.sin(beta);
    const r = this.capRadius;

    const project = (
      vx: number,
      vy: number,
      vz: number,
    ): { x: number; y: number; depth: number } => {
      const viewX = cb * vx + sb * vz;
      const viewY = sa * sb * vx + ca * vy - sa * cb * vz;
      const viewZ = -ca * sb * vx + sa * vy + ca * cb * vz;
      return { x: viewX * r, y: -viewY * r, depth: viewZ };
    };

    const axes: ProjectedAxis[] = [
      this.makeAxis(
        'X',
        '+x',
        '-x',
        'text-error',
        'text-error-foreground',
        project(1, 0, 0),
        project(-1, 0, 0),
      ),
      this.makeAxis(
        'Y',
        '+y',
        '-y',
        'text-success',
        'text-success-foreground',
        project(0, 1, 0),
        project(0, -1, 0),
      ),
      this.makeAxis(
        'Z',
        '+z',
        '-z',
        'text-primary',
        'text-primary-foreground',
        project(0, 0, 1),
        project(0, 0, -1),
      ),
    ];

    return axes.sort((a, b) => a.sortKey - b.sortKey);
  });

  readonly ariaLabel = computed(() => {
    const t = Math.round(this.theta());
    const p = Math.round(this.phi());
    return (
      `3D orientation gizmo. Red X is the world right axis, green Y is up, ` +
      `blue Z is forward (glTF Y-up). Camera orbit: theta ${t} degrees, phi ${p} degrees.`
    );
  });

  private makeAxis(
    key: 'X' | 'Y' | 'Z',
    posFace: GizmoFace,
    negFace: GizmoFace,
    axisClass: string,
    labelClass: string,
    posCap: { x: number; y: number; depth: number },
    negCap: { x: number; y: number; depth: number },
  ): ProjectedAxis {
    return {
      key,
      posFace,
      negFace,
      axisClass,
      labelClass,
      posCap,
      negCap,
      posIsCloser: posCap.depth >= negCap.depth,
      sortKey: Math.max(posCap.depth, negCap.depth),
    };
  }

  protected onFaceClick(face: GizmoFace, event: MouseEvent): void {
    if (!this.enableFaceClicks()) return;
    event.stopPropagation();
    this.faceClick.emit(face);
  }
}
