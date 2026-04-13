import { Injectable, signal } from '@angular/core';

export type ViewportBreakpointState = { mobile: boolean; canvas: boolean };

/**
 * Reads a stable viewport width for layout math. For breakpoints use {@link readBreakpointFlags} (`--app-bp-*` from computed styles).
 */
export function readViewportWidth(): number {
  if (typeof window === 'undefined') return 0;
  const vv = window.visualViewport?.width ?? 0;
  const inner = window.innerWidth;
  const client = document.documentElement?.clientWidth ?? 0;
  return Math.max(vv, inner, client);
}

/**
 * Same predicates as Tailwind/CSS. Prefer reading `--app-bp-*` from computed styles so JS
 * uses the exact @media cascade as the stylesheet (embedded Simple Browser vs Chrome can disagree on matchMedia vs layout in edge cases).
 */
export function readBreakpointFlags(): { isMobile: boolean; isCanvas: boolean } {
  if (typeof document === 'undefined' || !document.documentElement) {
    return { isMobile: false, isCanvas: false };
  }
  const s = getComputedStyle(document.documentElement);
  const mobileRaw = s.getPropertyValue('--app-bp-mobile').trim();
  const canvasRaw = s.getPropertyValue('--app-bp-canvas').trim();

  if (
    mobileRaw === '' &&
    canvasRaw === '' &&
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function'
  ) {
    return {
      isMobile: window.matchMedia('(max-width: 767px)').matches,
      isCanvas: window.matchMedia('(min-width: 2000px)').matches,
    };
  }

  return {
    isMobile: mobileRaw === '1',
    isCanvas: canvasRaw === '1',
  };
}

/**
 * Single source of truth for `isMobile` / isCanvasMode used by the dashboard shell
 * and {@link DashboardLayoutEngine} so the navbar and widget grid never disagree.
 */
@Injectable({ providedIn: 'root' })
export class ViewportBreakpointsService {
  readonly isMobile = signal(false);
  readonly isCanvasMode = signal(false);

  private readonly hooks = new Set<(prev: ViewportBreakpointState, next: ViewportBreakpointState) => void>();
  private readonly abort = new AbortController();

  constructor() {
    if (typeof window === 'undefined') return;

    const run = (): void => this.sync();

    run();

    // Recompute from `--app-bp-*` after layout only (no matchMedia listeners) so JS matches CSS.
    window.addEventListener('resize', run, { signal: this.abort.signal });
    window.visualViewport?.addEventListener('resize', run, { signal: this.abort.signal });
    window.addEventListener('orientationchange', run, { signal: this.abort.signal });
    window.addEventListener('load', run, { once: true, signal: this.abort.signal });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') run();
    }, { signal: this.abort.signal });
    window.addEventListener('pageshow', run, { signal: this.abort.signal });

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => run());
      ro.observe(document.documentElement);
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => run());
      });
    });
  }

  registerBreakpointHook(
    fn: (prev: ViewportBreakpointState, next: ViewportBreakpointState) => void,
  ): void {
    this.hooks.add(fn);
  }

  unregisterBreakpointHook(
    fn: (prev: ViewportBreakpointState, next: ViewportBreakpointState) => void,
  ): void {
    this.hooks.delete(fn);
  }

  private sync(): void {
    const { isMobile: nextM, isCanvas: nextC } = readBreakpointFlags();

    const prevM = this.isMobile();
    const prevC = this.isCanvasMode();

    if (prevM === nextM && prevC === nextC) return;

    this.isMobile.set(nextM);
    this.isCanvasMode.set(nextC);

    const prev: ViewportBreakpointState = { mobile: prevM, canvas: prevC };
    const next: ViewportBreakpointState = { mobile: nextM, canvas: nextC };

    for (const h of this.hooks) {
      h(prev, next);
    }
  }
}
