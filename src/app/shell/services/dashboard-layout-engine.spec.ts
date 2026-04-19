import { DashboardLayoutEngine, type DashboardLayoutConfig } from './dashboard-layout-engine';
import { WidgetLayoutService } from './widget-layout.service';

function createMockLayoutService(): WidgetLayoutService {
  return {
    save: vi.fn(),
    load: vi.fn().mockReturnValue(null),
  } as unknown as WidgetLayoutService;
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

function createTestConfig(overrides: Partial<DashboardLayoutConfig> = {}): DashboardLayoutConfig {
  return {
    widgets: ['w1', 'w2', 'w3'],
    layoutStorageKey: 'test-layout',
    canvasStorageKey: 'test-canvas',
    defaultColStarts: { w1: 1, w2: 5, w3: 9 },
    defaultColSpans: { w1: 4, w2: 4, w3: 8 },
    defaultTops: { w1: 0, w2: 0, w3: 400 },
    defaultHeights: { w1: 380, w2: 380, w3: 380 },
    canvasDefaultLefts: { w1: 0, w2: 340, w3: 680 },
    canvasDefaultPixelWidths: { w1: 308, w2: 308, w3: 632 },
    minColSpan: 4,
    ...overrides,
  };
}

function createEngine(
  configOverrides: Partial<DashboardLayoutConfig> = {},
  layoutService?: WidgetLayoutService,
): DashboardLayoutEngine {
  const svc = layoutService ?? createMockLayoutService();
  return new DashboardLayoutEngine(createTestConfig(configOverrides), svc);
}

describe('DashboardLayoutEngine', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes signals from config defaults', () => {
      const engine = createEngine();
      expect(engine.widgetColStarts()).toEqual({ w1: 1, w2: 5, w3: 9 });
      expect(engine.widgetColSpans()).toEqual({ w1: 4, w2: 4, w3: 8 });
      expect(engine.widgetTops()).toEqual({ w1: 0, w2: 0, w3: 400 });
      expect(engine.widgetHeights()).toEqual({ w1: 380, w2: 380, w3: 380 });
    });

    it('moveTargetId starts as null', () => {
      const engine = createEngine();
      expect(engine.moveTargetId()).toBeNull();
    });

    it('clearAllWidgetLocks clears all lock flags', () => {
      const engine = createEngine();
      engine.widgetLocked.set({ w1: true, w2: true });
      engine.clearAllWidgetLocks();
      expect(engine.widgetLocked()).toEqual({});
    });
  });

  describe('widgetGridColumns', () => {
    it('derives grid-column CSS strings from colStarts and colSpans', () => {
      const engine = createEngine();
      const gridCols = engine.widgetGridColumns();
      expect(gridCols['w1']).toBe('1 / span 4');
      expect(gridCols['w2']).toBe('5 / span 4');
      expect(gridCols['w3']).toBe('9 / span 8');
    });

    it('updates when colStarts change', () => {
      const engine = createEngine();
      engine.widgetColStarts.set({ w1: 3, w2: 7, w3: 11 });
      const gridCols = engine.widgetGridColumns();
      expect(gridCols['w1']).toBe('3 / span 4');
      expect(gridCols['w2']).toBe('7 / span 4');
      expect(gridCols['w3']).toBe('11 / span 8');
    });

    it('updates when colSpans change', () => {
      const engine = createEngine();
      engine.widgetColSpans.set({ w1: 8, w2: 4, w3: 4 });
      const gridCols = engine.widgetGridColumns();
      expect(gridCols['w1']).toBe('1 / span 8');
      expect(gridCols['w2']).toBe('5 / span 4');
      expect(gridCols['w3']).toBe('9 / span 4');
    });
  });

  describe('resetToDefaults', () => {
    // resetToDefaults does TWO things in desktop mode: apply config defaults,
    // then run compactAll to eliminate vertical gaps. The two tests below
    // pin each half of that contract independently. Conflating them (the
    // original single test did) meant a config with a floating widget --
    // w3 at col 9-16 top=400 with nothing above it -- asserted a value
    // (top=400) that compactAll immediately and correctly collapses to 0.
    it('applies config defaults to colStarts, colSpans, heights, and tops on a layout that is already compact', () => {
      // Tops { w1: 0, w2: 0, w3: 0 } with non-overlapping columns is a
      // valid compact layout, so compactAll is a no-op and we can assert
      // that the post-reset state equals the config defaults byte-for-byte.
      const engine = createEngine({
        defaultTops: { w1: 0, w2: 0, w3: 0 },
      });

      engine.widgetTops.set({ w1: 100, w2: 200, w3: 300 });
      engine.widgetHeights.set({ w1: 500, w2: 500, w3: 500 });
      engine.widgetColStarts.set({ w1: 3, w2: 7, w3: 11 });
      engine.widgetColSpans.set({ w1: 6, w2: 6, w3: 6 });

      engine.resetToDefaults();

      expect(engine.widgetTops()).toEqual({ w1: 0, w2: 0, w3: 0 });
      expect(engine.widgetHeights()).toEqual({ w1: 380, w2: 380, w3: 380 });
      expect(engine.widgetColStarts()).toEqual({ w1: 1, w2: 5, w3: 9 });
      expect(engine.widgetColSpans()).toEqual({ w1: 4, w2: 4, w3: 8 });
    });

    it('compacts away vertical gaps in the config defaults (no floating widgets after reset)', () => {
      // Config places w3 at top=400 with nothing above it in cols 9-16.
      // compactAll must pull it up to top=0 so Reset Layout never leaves
      // the dashboard with a 400px hole. This is the regression guard for
      // the compactAll() call added to resetToDefaults (Phase 23).
      const engine = createEngine();

      engine.widgetTops.set({ w1: 100, w2: 200, w3: 300 });
      engine.widgetColStarts.set({ w1: 3, w2: 7, w3: 11 });

      engine.resetToDefaults();

      expect(engine.widgetTops()['w3']).toBe(0);
      expect(engine.widgetColStarts()).toEqual({ w1: 1, w2: 5, w3: 9 });
      expect(engine.widgetColSpans()).toEqual({ w1: 4, w2: 4, w3: 8 });
    });

    it('persists desktop layout when not in canvas mode', () => {
      const svc = createMockLayoutService();
      const engine = createEngine({}, svc);
      engine.isCanvasMode.set(false);

      engine.resetToDefaults();

      expect(svc.save).toHaveBeenCalled();
    });

    it('removes old canvas storage then re-persists in canvas mode', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      localStorage.setItem('test-canvas', '{"some":"old-data"}');

      engine.resetToDefaults();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-canvas');
      const stored = localStorage.getItem('test-canvas');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.tops).toBeDefined();
    });
  });

  describe('minimum column span enforcement', () => {
    it('GAP_PX is 16', () => {
      expect(DashboardLayoutEngine.GAP_PX).toBe(16);
    });

    it('CANVAS_STEP is 81', () => {
      expect(DashboardLayoutEngine.CANVAS_STEP).toBe(81);
    });

    it('config.minColSpan defaults to 4', () => {
      const engine = createEngine();
      const config = (engine as unknown as { config: DashboardLayoutConfig }).config;
      expect(config.minColSpan).toBe(4);
    });
  });

  describe('collision pass ordering', () => {
    it('compactAll stacks same-top overlapping widgets in config order', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2'],
        defaultColStarts: { w1: 1, w2: 1 },
        defaultColSpans: { w1: 8, w2: 8 },
        defaultTops: { w1: 0, w2: 0 },
        defaultHeights: { w1: 100, w2: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600 },
      });
      engine.isMobile.set(false);
      engine.widgetColStarts.set({ w1: 1, w2: 1 });
      engine.widgetColSpans.set({ w1: 8, w2: 8 });
      engine.widgetTops.set({ w1: 0, w2: 0 });
      engine.widgetHeights.set({ w1: 100, w2: 100 });

      engine.compactAll();

      const t = engine.widgetTops();
      const gap = DashboardLayoutEngine.GAP_PX;
      expect(t['w1']).toBe(0);
      expect(t['w2']).toBe(100 + gap);
    });

    it('compactAll uses desktopResizePriorityOrder as reading order when set (mobile)', () => {
      const gap = DashboardLayoutEngine.GAP_PX;
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3'],
        desktopResizePriorityOrder: ['w3', 'w1', 'w2'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 0, w3: 0 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600, w3: 600 },
      });
      engine.isMobile.set(true);
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 100, w2: 100, w3: 100 });

      engine.compactAll();

      const t = engine.widgetTops();
      expect(t['w3']).toBe(0);
      expect(t['w1']).toBe(100 + gap);
      expect(t['w2']).toBe(200 + gap * 2);
    });

    it('resolveCollisions stacks overlapping peers by reading priority not widgets array order (desktop)', () => {
      const gap = DashboardLayoutEngine.GAP_PX;
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3'],
        desktopResizePriorityOrder: ['w3', 'w1', 'w2'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 0, w3: 0 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600, w3: 600 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;
      engine.widgetColStarts.set({ w1: 1, w2: 1, w3: 1 });
      engine.widgetColSpans.set({ w1: 16, w2: 16, w3: 16 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 100, w2: 100, w3: 100 });
      engine.syncPixelWidthsFromCols();

      const resolveCollisions = (engine as unknown as {
        resolveCollisions: (movedId: string, widgets: string[]) => void;
      }).resolveCollisions.bind(engine);

      resolveCollisions('w1', ['w1', 'w2', 'w3']);

      const t = engine.widgetTops();
      expect(t['w1']).toBe(0);
      expect(t['w3']).toBe(100 + gap);
      expect(t['w2']).toBe(200 + gap * 2);
    });

    it('unlisted widgets sort after listed by top then left when using desktopResizePriorityOrder', () => {
      const gap = DashboardLayoutEngine.GAP_PX;
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3', 'w4'],
        desktopResizePriorityOrder: ['w2', 'w1'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1, w4: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16, w4: 16 },
        defaultTops: { w1: 0, w2: 0, w3: 0, w4: 0 },
        defaultHeights: { w1: 50, w2: 50, w3: 50, w4: 50 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0, w4: 100 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600, w3: 600, w4: 600 },
      });
      engine.isMobile.set(true);
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 10, w4: 10 });
      engine.widgetHeights.set({ w1: 50, w2: 50, w3: 50, w4: 50 });
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0, w4: 200 });

      engine.compactAll();

      const t = engine.widgetTops();
      expect(t['w2']).toBe(0);
      expect(t['w1']).toBe(50 + gap);
      expect(t['w3']).toBe(100 + gap * 2);
      expect(t['w4']).toBe(150 + gap * 3);
    });

    it('identical drag mousemove events keep widget tops stable (no oscillation)', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 600, w3: 300 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600, w3: 600 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetColStarts.set({ w1: 1, w2: 1, w3: 1 });
      engine.widgetColSpans.set({ w1: 16, w2: 16, w3: 16 });
      engine.widgetTops.set({ w1: 0, w2: 600, w3: 300 });
      engine.widgetHeights.set({ w1: 100, w2: 100, w3: 100 });
      engine.syncPixelWidthsFromCols();

      const down = { clientX: 100, clientY: 650, preventDefault: vi.fn() } as unknown as MouseEvent;
      engine.onWidgetHeaderMouseDown('w2', down);

      const move = { clientX: 100, clientY: 350 } as MouseEvent;
      engine.onDocumentMouseMove(move);
      const once = { ...engine.widgetTops() };
      engine.onDocumentMouseMove(move);
      expect(engine.widgetTops()).toEqual(once);

      engine.onDocumentMouseUp();
    });
  });

  describe('resolveCanvasPush (canvas collision resolution)', () => {
    it('pushes overlapping widget away from mover', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      engine.widgetLefts.set({ w1: 0, w2: 100, w3: 800 });
      engine.widgetPixelWidths.set({ w1: 200, w2: 200, w3: 200 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 300, w2: 300, w3: 300 });

      const resolveCanvasPush = (engine as unknown as {
        resolveCanvasPush: (movedId: string, widgets: string[]) => void;
      }).resolveCanvasPush.bind(engine);

      resolveCanvasPush('w1', ['w1', 'w2', 'w3']);

      const lefts = engine.widgetLefts();
      const tops = engine.widgetTops();
      const widths = engine.widgetPixelWidths();
      const heights = engine.widgetHeights();
      const gap = DashboardLayoutEngine.GAP_PX;

      const w1Right = lefts['w1'] + widths['w1'];
      const w2Left = lefts['w2'];
      const hOverlap = Math.min(w1Right, w2Left + widths['w2']) - Math.max(lefts['w1'], w2Left);
      const vOverlap = Math.min(tops['w1'] + heights['w1'], tops['w2'] + heights['w2']) - Math.max(tops['w1'], tops['w2']);
      const noOverlap = hOverlap <= 0 || vOverlap <= 0;
      expect(noOverlap).toBe(true);
    });

    it('cascading push: pushing A into B pushes B away too', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      engine.widgetLefts.set({ w1: 0, w2: 50, w3: 200 });
      engine.widgetPixelWidths.set({ w1: 200, w2: 200, w3: 200 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 300, w2: 300, w3: 300 });

      const resolveCanvasPush = (engine as unknown as {
        resolveCanvasPush: (movedId: string, widgets: string[]) => void;
      }).resolveCanvasPush.bind(engine);

      resolveCanvasPush('w1', ['w1', 'w2', 'w3']);

      const lefts = engine.widgetLefts();
      const widths = engine.widgetPixelWidths();
      const tops = engine.widgetTops();
      const heights = engine.widgetHeights();
      const gap = DashboardLayoutEngine.GAP_PX;

      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          const ids = ['w1', 'w2', 'w3'];
          const a = ids[i];
          const b = ids[j];
          const hO = Math.min(lefts[a] + widths[a], lefts[b] + widths[b]) - Math.max(lefts[a], lefts[b]);
          const vO = Math.min(tops[a] + heights[a], tops[b] + heights[b]) - Math.max(tops[a], tops[b]);
          expect(hO <= 0 || vO <= 0).toBe(true);
        }
      }
    });
  });

  describe('handleResize - right edge', () => {
    it('clamps width to minimum 4 columns', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetPixelWidths.set({ w1: 600, w2: 308, w3: 632 });
      engine.widgetLefts.set({ w1: 0, w2: 324, w3: 648 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 400 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      engine.startWidgetResize('w1', 'h', { clientX: 600, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'right');

      engine.onDocumentMouseMove({ clientX: 100, clientY: 200 } as MouseEvent);

      const step = (1280 + 16) / 16;
      const minW = 4 * step - 16;
      expect(engine.widgetPixelWidths()['w1']).toBeGreaterThanOrEqual(minW - 1);
    });
  });

  describe('handleResize - left edge', () => {
    it('clamps width to minimum 4 columns and adjusts left position', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetPixelWidths.set({ w1: 600, w2: 308, w3: 632 });
      engine.widgetLefts.set({ w1: 200, w2: 524, w3: 848 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 400 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      engine.startWidgetResize('w1', 'h', { clientX: 200, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: 700, clientY: 200 } as MouseEvent);

      const step = (1280 + 16) / 16;
      const minW = 4 * step - 16;
      expect(engine.widgetPixelWidths()['w1']).toBeGreaterThanOrEqual(minW - 1);
    });

    it('allows negative left position in canvas mode', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(true);

      engine.widgetPixelWidths.set({ w1: 600, w2: 308, w3: 632 });
      engine.widgetLefts.set({ w1: 50, w2: 700, w3: 1400 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 400 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      engine.startWidgetResize('w1', 'h', { clientX: 50, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: -200, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w1']).toBeLessThan(0);
    });

    it('clamps left position to 0 in desktop mode', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetPixelWidths.set({ w1: 600, w2: 308, w3: 632 });
      engine.widgetLefts.set({ w1: 50, w2: 700, w3: 1100 });
      engine.widgetTops.set({ w1: 0, w2: 500, w3: 500 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      engine.startWidgetResize('w1', 'h', { clientX: 50, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: -200, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w1']).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyResizePushSqueeze - right edge', () => {
    it('pushes right neighbors when resizing rightward', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetLefts.set({ w1: 0, w2: 324, w3: 648 });
      engine.widgetPixelWidths.set({ w1: 308, w2: 308, w3: 308 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      const origW2Left = 324;
      engine.startWidgetResize('w1', 'h', { clientX: 308, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'right');

      engine.onDocumentMouseMove({ clientX: 508, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w2']).toBeGreaterThanOrEqual(origW2Left);
    });

    it('squeezes the tail edge neighbor first at the container edge', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2'],
        defaultColStarts: { w1: 1, w2: 6 },
        defaultColSpans: { w1: 4, w2: 10 },
        defaultTops: { w1: 0, w2: 0 },
        defaultHeights: { w1: 380, w2: 380 },
        canvasDefaultLefts: { w1: 0, w2: 400 },
        canvasDefaultPixelWidths: { w1: 308, w2: 700 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetLefts.set({ w1: 0, w2: 400 });
      engine.widgetPixelWidths.set({ w1: 308, w2: 700 });
      engine.widgetTops.set({ w1: 0, w2: 0 });
      engine.widgetHeights.set({ w1: 380, w2: 380 });

      engine.startWidgetResize('w1', 'h', { clientX: 308, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'right');

      engine.onDocumentMouseMove({ clientX: 708, clientY: 200 } as MouseEvent);

      const w2Right = engine.widgetLefts()['w2'] + engine.widgetPixelWidths()['w2'];
      expect(w2Right).toBe(1280);
      expect(engine.widgetPixelWidths()['w2']).toBeLessThan(700);
    });

    it('squeezes lower-priority neighbor before higher-priority when desktopResizePriorityOrder is set', () => {
      const base: Partial<DashboardLayoutConfig> = {
        widgets: ['w1', 'w2', 'w3'],
        defaultColStarts: { w1: 1, w2: 6, w3: 12 },
        defaultColSpans: { w1: 5, w2: 6, w3: 6 },
        defaultTops: { w1: 0, w2: 0, w3: 0 },
        defaultHeights: { w1: 380, w2: 380, w3: 380 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 308, w2: 308, w3: 308 },
      };

      const run = (priority?: string[]) => {
        const engine = createEngine({
          ...base,
          ...(priority ? { desktopResizePriorityOrder: priority } : {}),
        });
        engine.isMobile.set(false);
        engine.isCanvasMode.set(false);
        const fakeGrid = { clientWidth: 1280 } as HTMLElement;
        engine.gridElAccessor = () => fakeGrid;

        const w1Rect = engine._computeDesktopPixelRect('w1');
        const startX = w1Rect.left + w1Rect.width;
        const ev = (x: number) =>
          ({ clientX: x, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() }) as unknown as MouseEvent;

        engine.startWidgetResize('w1', 'h', ev(startX), 'right');
        engine.onDocumentMouseMove(ev(startX + 200));
        return {
          w2: engine.widgetPixelWidths()['w2'],
          w3: engine.widgetPixelWidths()['w3'],
        };
      };

      const legacy = run();
      const priority = run(['w1', 'w3', 'w2']);

      expect(legacy.w3).toBeLessThan(legacy.w2);
      expect(priority.w2).toBeLessThan(priority.w3);
    });
  });

  describe('applyResizePushSqueeze - left edge', () => {
    it('pushes left neighbors when resizing leftward', () => {
      const engine = createEngine();
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetLefts.set({ w1: 0, w2: 324, w3: 648 });
      engine.widgetPixelWidths.set({ w1: 308, w2: 308, w3: 308 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      const origW2Left = 324;
      engine.startWidgetResize('w3', 'h', { clientX: 648, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: 448, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w2']).toBeLessThanOrEqual(origW2Left);
    });

    it('squeezes the tail edge neighbor first at left boundary', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2'],
        defaultColStarts: { w1: 1, w2: 10 },
        defaultColSpans: { w1: 10, w2: 4 },
        defaultTops: { w1: 0, w2: 0 },
        defaultHeights: { w1: 380, w2: 380 },
        canvasDefaultLefts: { w1: 0, w2: 500 },
        canvasDefaultPixelWidths: { w1: 700, w2: 308 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.widgetLefts.set({ w1: 0, w2: 500 });
      engine.widgetPixelWidths.set({ w1: 700, w2: 308 });
      engine.widgetTops.set({ w1: 0, w2: 0 });
      engine.widgetHeights.set({ w1: 380, w2: 380 });

      engine.startWidgetResize('w2', 'h', { clientX: 500, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: 400, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w1']).toBe(0);
      expect(engine.widgetPixelWidths()['w1']).toBeLessThan(700);
    });
  });

  describe('compactAll', () => {
    it('stacks mobile widgets vertically with gap', () => {
      const engine = createEngine();
      engine.isMobile.set(true);

      engine.widgetTops.set({ w1: 500, w2: 100, w3: 900 });
      engine.widgetHeights.set({ w1: 300, w2: 300, w3: 300 });

      engine.compactAll();

      const tops = engine.widgetTops();
      const heights = engine.widgetHeights();
      const sorted = ['w2', 'w1', 'w3'];
      let y = 0;
      for (const id of sorted) {
        expect(tops[id]).toBe(y);
        y += heights[id] + 16;
      }
    });
  });

  describe('desktop gravity', () => {
    const GAP = DashboardLayoutEngine.GAP_PX;

    it('desktop init compacts gaps from restored layout', () => {
      const layoutService = createMockLayoutService();
      (layoutService.load as ReturnType<typeof vi.fn>).mockReturnValue({
        tops: { w1: 500, w2: 0, w3: 1000 },
        heights: { w1: 100, w2: 100, w3: 100 },
        colStarts: { w1: 1, w2: 1, w3: 1 },
        colSpans: { w1: 16, w2: 16, w3: 16 },
      });

      const engine = createEngine({
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 116, w3: 232 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
      }, layoutService);
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      engine.reinitLayout();

      const tops = engine.widgetTops();
      expect(tops['w2']).toBe(0);
      expect(tops['w1']).toBe(100 + GAP);
      expect(tops['w3']).toBe(200 + GAP * 2);
    });

    it('desktop move-end compacts all widgets to top', () => {
      const engine = createEngine({
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 100 + GAP, w3: 200 + GAP * 2 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      engine.widgetTops.set({ w1: 500, w2: 100 + GAP, w3: 200 + GAP * 2 });

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.onWidgetHeaderMouseDown('w1', {
        clientX: 100,
        clientY: 500,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);
      engine.onDocumentMouseUp();

      const tops = engine.widgetTops();
      expect(tops['w2']).toBe(0);
      expect(tops['w3']).toBe(100 + GAP);
      expect(tops['w1']).toBe(200 + GAP * 2);
    });

    it('dragged widget gets sort priority and all widgets compact upward', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1 },
        defaultColSpans: { w1: 16, w2: 16, w3: 16 },
        defaultTops: { w1: 0, w2: 100 + GAP, w3: 200 + GAP * 2 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 600, w2: 600, w3: 600 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      engine.widgetColStarts.set({ w1: 1, w2: 1, w3: 1 });
      engine.widgetColSpans.set({ w1: 16, w2: 16, w3: 16 });
      engine.widgetTops.set({ w1: 0, w2: 100 + GAP, w3: 200 + GAP * 2 });
      engine.widgetHeights.set({ w1: 100, w2: 100, w3: 100 });

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.onWidgetHeaderMouseDown('w3', {
        clientX: 100,
        clientY: 400,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);

      engine.onDocumentMouseMove({
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn(),
      } as unknown as MouseEvent);

      engine.onDocumentMouseUp();

      const tops = engine.widgetTops();
      expect(tops['w3']).toBe(0);
      expect(tops['w1']).toBe(100 + GAP);
      expect(tops['w2']).toBe(200 + GAP * 2);
    });

    it('dragged widget reorders within column and all widgets compact (no gaps)', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3', 'w4'],
        defaultColStarts: { w1: 1, w2: 1, w3: 1, w4: 9 },
        defaultColSpans: { w1: 8, w2: 8, w3: 8, w4: 8 },
        defaultTops: { w1: 0, w2: 116, w3: 232, w4: 0 },
        defaultHeights: { w1: 100, w2: 100, w3: 100, w4: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0, w4: 400 },
        canvasDefaultPixelWidths: { w1: 300, w2: 300, w3: 300, w4: 300 },
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);

      engine.widgetColStarts.set({ w1: 1, w2: 1, w3: 1, w4: 9 });
      engine.widgetColSpans.set({ w1: 8, w2: 8, w3: 8, w4: 8 });
      engine.widgetTops.set({ w1: 0, w2: 100 + GAP, w3: 200 + GAP * 2, w4: 0 });
      engine.widgetHeights.set({ w1: 100, w2: 100, w3: 100, w4: 100 });

      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.onWidgetHeaderMouseDown('w3', {
        clientX: 100,
        clientY: 300,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);

      engine.onDocumentMouseMove({
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn(),
      } as unknown as MouseEvent);

      engine.onDocumentMouseUp();

      const tops = engine.widgetTops();
      expect(tops['w3']).toBe(0);
      expect(tops['w1']).toBe(100 + GAP);
      expect(tops['w2']).toBe(200 + GAP * 2);
      expect(tops['w4']).toBe(0);
    });
  });

  describe('canvasGridMinHeight', () => {
    it('computes max bottom + offset', () => {
      const engine = createEngine({ canvasGridMinHeightOffset: 100 });
      engine.widgetTops.set({ w1: 0, w2: 200, w3: 500 });
      engine.widgetHeights.set({ w1: 300, w2: 300, w3: 300 });

      expect(engine.canvasGridMinHeight()).toBe(500 + 300 + 100);
    });

    it('desktopGridMinHeight excludes offset', () => {
      const engine = createEngine({ canvasGridMinHeightOffset: 100 });
      engine.widgetTops.set({ w1: 0, w2: 200, w3: 500 });
      engine.widgetHeights.set({ w1: 300, w2: 300, w3: 300 });

      expect(engine.desktopGridMinHeight()).toBe(500 + 300);
    });
  });

  describe('reflowForColumns', () => {
    const GAP = DashboardLayoutEngine.GAP_PX;
    const TILE = 370;

    function createProjectsEngine(): DashboardLayoutEngine {
      const widgets = ['hdr', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
      return createEngine({
        widgets,
        defaultColStarts: { hdr: 1, p1: 1, p2: 5, p3: 9, p4: 13, p5: 1, p6: 5, p7: 9, p8: 13 },
        defaultColSpans: { hdr: 16, p1: 4, p2: 4, p3: 4, p4: 4, p5: 4, p6: 4, p7: 4, p8: 4 },
        defaultTops: { hdr: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: TILE + GAP, p6: TILE + GAP, p7: TILE + GAP, p8: TILE + GAP },
        defaultHeights: { hdr: 0, p1: TILE, p2: TILE, p3: TILE, p4: TILE, p5: TILE, p6: TILE, p7: TILE, p8: TILE },
        responsiveBreakpoints: [
          { minWidth: 1200, columns: 4 },
          { minWidth: 900, columns: 3 },
          { minWidth: 768, columns: 2 },
        ],
      });
    }

    it('reflows 8 tiles into 4 columns (2 rows)', () => {
      const engine = createProjectsEngine();
      engine.reflowForColumns(4);
      const tops = engine.widgetTops();
      const colStarts = engine.widgetColStarts();
      const colSpans = engine.widgetColSpans();

      expect(colSpans['p1']).toBe(4);
      expect(colStarts['p1']).toBe(1);
      expect(colStarts['p2']).toBe(5);
      expect(colStarts['p3']).toBe(9);
      expect(colStarts['p4']).toBe(13);

      expect(tops['p1']).toBe(0);
      expect(tops['p2']).toBe(0);
      expect(tops['p3']).toBe(0);
      expect(tops['p4']).toBe(0);
      expect(tops['p5']).toBe(TILE + GAP);
      expect(tops['p6']).toBe(TILE + GAP);
      expect(tops['p7']).toBe(TILE + GAP);
      expect(tops['p8']).toBe(TILE + GAP);
    });

    it('reflows 8 tiles into 3 columns (3 rows, last row has 2)', () => {
      const engine = createProjectsEngine();
      engine.reflowForColumns(3);
      const tops = engine.widgetTops();
      const colStarts = engine.widgetColStarts();
      const colSpans = engine.widgetColSpans();

      expect(colSpans['p1']).toBe(5);
      expect(colStarts['p1']).toBe(1);
      expect(colStarts['p2']).toBe(6);
      expect(colStarts['p3']).toBe(11);

      expect(tops['p1']).toBe(0);
      expect(tops['p2']).toBe(0);
      expect(tops['p3']).toBe(0);

      expect(colStarts['p4']).toBe(1);
      expect(colStarts['p5']).toBe(6);
      expect(colStarts['p6']).toBe(11);
      expect(tops['p4']).toBe(TILE + GAP);
      expect(tops['p5']).toBe(TILE + GAP);
      expect(tops['p6']).toBe(TILE + GAP);

      expect(colStarts['p7']).toBe(1);
      expect(colStarts['p8']).toBe(6);
      expect(tops['p7']).toBe(2 * (TILE + GAP));
      expect(tops['p8']).toBe(2 * (TILE + GAP));
    });

    it('reflows 8 tiles into 2 columns (4 rows)', () => {
      const engine = createProjectsEngine();
      engine.reflowForColumns(2);
      const tops = engine.widgetTops();
      const colStarts = engine.widgetColStarts();
      const colSpans = engine.widgetColSpans();

      expect(colSpans['p1']).toBe(8);
      expect(colStarts['p1']).toBe(1);
      expect(colStarts['p2']).toBe(9);
      expect(tops['p1']).toBe(0);
      expect(tops['p2']).toBe(0);

      expect(colStarts['p3']).toBe(1);
      expect(colStarts['p4']).toBe(9);
      expect(tops['p3']).toBe(TILE + GAP);
      expect(tops['p4']).toBe(TILE + GAP);

      expect(tops['p5']).toBe(2 * (TILE + GAP));
      expect(tops['p7']).toBe(3 * (TILE + GAP));
    });

    it('responsiveSpanOverrides keeps hero tile wide at 3 columns', () => {
      const engine = createEngine({
        widgets: ['hdr', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
        defaultColStarts: { hdr: 1, p1: 1, p2: 9, p3: 13, p4: 1, p5: 5, p6: 9, p7: 13, p8: 1 },
        defaultColSpans: { hdr: 16, p1: 8, p2: 4, p3: 4, p4: 4, p5: 4, p6: 4, p7: 4, p8: 4 },
        defaultTops: { hdr: 0, p1: 0, p2: 0, p3: 0, p4: 0, p5: TILE + GAP, p6: TILE + GAP, p7: TILE + GAP, p8: TILE + GAP },
        defaultHeights: { hdr: 0, p1: TILE, p2: TILE, p3: TILE, p4: TILE, p5: TILE, p6: TILE, p7: TILE, p8: TILE },
        responsiveSpanOverrides: { p1: { 4: 2, 3: 2, 2: 2 } },
      });
      engine.reflowForColumns(3);
      const colSpans = engine.widgetColSpans();
      const colStarts = engine.widgetColStarts();
      const tops = engine.widgetTops();

      expect(colSpans['p1']).toBe(10);
      expect(colStarts['p1']).toBe(1);
      expect(colStarts['p2']).toBe(11);
      expect(tops['p1']).toBe(0);
      expect(tops['p2']).toBe(0);
    });

    it('responsiveSpanOverrides makes hero full-width at 2 columns', () => {
      const engine = createEngine({
        widgets: ['hdr', 'p1', 'p2', 'p3', 'p4'],
        defaultColStarts: { hdr: 1, p1: 1, p2: 9, p3: 1, p4: 9 },
        defaultColSpans: { hdr: 16, p1: 8, p2: 4, p3: 4, p4: 4 },
        defaultTops: { hdr: 0, p1: 0, p2: 0, p3: TILE + GAP, p4: TILE + GAP },
        defaultHeights: { hdr: 0, p1: TILE, p2: TILE, p3: TILE, p4: TILE },
        responsiveSpanOverrides: { p1: { 4: 2, 3: 2, 2: 2 } },
      });
      engine.reflowForColumns(2);
      const colSpans = engine.widgetColSpans();
      const tops = engine.widgetTops();

      expect(colSpans['p1']).toBe(16);
      expect(tops['p1']).toBe(0);
      expect(tops['p2']).toBe(TILE + GAP);
    });

    it('preserves zero-height widgets (header)', () => {
      const engine = createProjectsEngine();
      engine.reflowForColumns(3);
      const colSpans = engine.widgetColSpans();
      expect(colSpans['hdr']).toBe(16);
    });

    it('getResponsiveColumns returns correct columns per width', () => {
      const engine = createProjectsEngine();
      expect(engine.getResponsiveColumns(1400)).toBe(4);
      expect(engine.getResponsiveColumns(1200)).toBe(4);
      expect(engine.getResponsiveColumns(1100)).toBe(3);
      expect(engine.getResponsiveColumns(900)).toBe(3);
      expect(engine.getResponsiveColumns(850)).toBe(2);
      expect(engine.getResponsiveColumns(768)).toBe(2);
      expect(engine.getResponsiveColumns(600)).toBe(0);
    });

    it('getResponsiveColumns returns 0 when no breakpoints configured', () => {
      const engine = createEngine();
      expect(engine.getResponsiveColumns(1200)).toBe(0);
    });

    it('reflowForColumns respects optional flowOrder', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2', 'w3'],
        defaultColStarts: { w1: 1, w2: 5, w3: 9 },
        defaultColSpans: { w1: 4, w2: 4, w3: 8 },
        defaultTops: { w1: 0, w2: 0, w3: 0 },
        defaultHeights: { w1: 100, w2: 100, w3: 100 },
        canvasDefaultLefts: { w1: 0, w2: 0, w3: 0 },
        canvasDefaultPixelWidths: { w1: 308, w2: 308, w3: 308 },
      });
      engine.reflowForColumns(2, { flowOrder: ['w3', 'w1', 'w2'] });
      expect(engine.widgetColStarts()['w3']).toBe(1);
      expect(engine.widgetColStarts()['w1']).toBe(9);
    });
  });

  describe('desktop snap and sizing-only defaults', () => {
    it('snaps colStarts and tops to defaults after free drag when desktopSnapToDefaultLayoutAfterDrag', () => {
      const engine = createEngine({
        desktopSnapToDefaultLayoutAfterDrag: true,
        desktopResizePriorityOrder: ['w1', 'w2', 'w3'],
        responsiveBreakpoints: undefined,
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      engine.onWidgetHeaderMouseDown('w2', {
        clientX: 400,
        clientY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);
      engine.onDocumentMouseMove({ clientX: 700, clientY: 100 } as MouseEvent);
      engine.onDocumentMouseUp();

      expect(engine.widgetColStarts()['w2']).toBe(5);
      expect(engine.widgetTops()['w2']).toBe(0);
    });

    it('preserves locked widget placement when snapping after drag of another tile', () => {
      const engine = createEngine({
        desktopSnapToDefaultLayoutAfterDrag: true,
        responsiveBreakpoints: undefined,
      });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;
      engine.widgetLocked.set({ w2: true });
      engine.widgetColStarts.set({ w1: 1, w2: 11, w3: 9 });
      engine.widgetColSpans.set({ w1: 4, w2: 4, w3: 8 });
      engine.syncPixelWidthsFromCols();

      engine.onWidgetHeaderMouseDown('w1', {
        clientX: 200,
        clientY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);
      engine.onDocumentMouseMove({ clientX: 500, clientY: 100 } as MouseEvent);
      engine.onDocumentMouseUp();

      expect(engine.widgetColStarts()['w2']).toBe(11);
      expect(engine.widgetColSpans()['w2']).toBe(4);
    });

    it('saveAsDefaultLayout stores v2 colSpans/heights only when desktopSaveDefaultLayoutSizingOnly', () => {
      const engine = createEngine({ desktopSaveDefaultLayoutSizingOnly: true });
      engine.isCanvasMode.set(false);
      engine.widgetColSpans.set({ w1: 6, w2: 6, w3: 6 });
      engine.saveAsDefaultLayout();
      const raw = localStorageMock.getItem('test-layout__customDefaults');
      expect(raw).toBeTruthy();
      const p = JSON.parse(raw!);
      expect(p.v).toBe(2);
      expect(p.colSpans).toBeDefined();
      expect(p.heights).toBeDefined();
      expect(p.tops).toBeUndefined();
    });

    it('resetToDefaults clears sizing blob and restores config defaults when desktopSaveDefaultLayoutSizingOnly', () => {
      const engine = createEngine({ desktopSaveDefaultLayoutSizingOnly: true });
      engine.isCanvasMode.set(false);
      localStorageMock.setItem(
        'test-layout__customDefaults',
        JSON.stringify({ v: 2, colSpans: { w1: 8, w2: 4, w3: 8 }, heights: { w1: 380, w2: 380, w3: 380 } }),
      );
      engine.widgetColSpans.set({ w1: 8, w2: 6, w3: 6 });
      engine.resetToDefaults();
      expect(localStorageMock.getItem('test-layout__customDefaults')).toBeNull();
      expect(engine.widgetColSpans()['w1']).toBe(4);
    });
  });

  describe('widget header click without drag', () => {
    it('click-and-release on widget header does not corrupt colStarts or colSpans', () => {
      const engine = createEngine({ responsiveBreakpoints: undefined });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      const origColStarts = { ...engine.widgetColStarts() };
      const origColSpans = { ...engine.widgetColSpans() };

      engine.onWidgetHeaderMouseDown('w2', {
        clientX: 400,
        clientY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);
      engine.onDocumentMouseUp();

      expect(engine.widgetColStarts()).toEqual(origColStarts);
      expect(engine.widgetColSpans()).toEqual(origColSpans);
    });

    it('click-and-release does not produce NaN in colStarts when widgetLefts was empty', () => {
      const engine = createEngine({ responsiveBreakpoints: undefined });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      expect(engine.widgetLefts()).toEqual({});
      expect(engine.widgetPixelWidths()).toEqual({});

      engine.onWidgetHeaderMouseDown('w1', {
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);
      engine.onDocumentMouseUp();

      const colStarts = engine.widgetColStarts();
      const colSpans = engine.widgetColSpans();
      for (const id of ['w1', 'w2', 'w3']) {
        expect(Number.isNaN(colStarts[id])).toBe(false);
        expect(Number.isNaN(colSpans[id])).toBe(false);
        expect(colStarts[id]).toBeGreaterThanOrEqual(1);
        expect(colSpans[id]).toBeGreaterThanOrEqual(4);
      }
    });

    it('all widgets get pixel positions populated after header mousedown in desktop mode', () => {
      const engine = createEngine({ responsiveBreakpoints: undefined });
      engine.isMobile.set(false);
      engine.isCanvasMode.set(false);
      const fakeGrid = { clientWidth: 1280 } as HTMLElement;
      engine.gridElAccessor = () => fakeGrid;

      expect(engine.widgetLefts()).toEqual({});

      engine.onWidgetHeaderMouseDown('w2', {
        clientX: 400,
        clientY: 100,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as MouseEvent);

      const lefts = engine.widgetLefts();
      const widths = engine.widgetPixelWidths();
      for (const id of ['w1', 'w2', 'w3']) {
        expect(lefts[id]).toBeDefined();
        expect(widths[id]).toBeDefined();
        expect(typeof lefts[id]).toBe('number');
        expect(typeof widths[id]).toBe('number');
      }

      engine.onDocumentMouseUp();
    });
  });

  describe('canvas save/load round-trip', () => {
    // loadSavedDefaults schedules cleanupCanvasOverlaps via rAF; in the Node
    // test env we shim rAF to run the callback synchronously so the full flow
    // can be exercised without a browser.
    const origRAF = (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
    beforeAll(() => {
      (globalThis as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
        (cb: FrameRequestCallback) => { cb(0); return 0; };
    });
    afterAll(() => {
      if (origRAF) {
        (globalThis as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = origRAF;
      } else {
        delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
      }
    });

    it('loadSavedDefaults preserves touching canvas widget positions (no cleanup drift)', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      // Two widgets placed flush against each other (0 px gap). This used to be
      // silently rewritten by cleanupCanvasOverlaps because `hO + gap > 0`
      // treated touching as overlap.
      const savedLefts = { w1: 0, w2: 300, w3: 700 };
      const savedWidths = { w1: 300, w2: 300, w3: 400 };
      const savedTops = { w1: 100, w2: 100, w3: 500 };
      const savedHeights = { w1: 200, w2: 200, w3: 200 };

      engine.widgetLefts.set(savedLefts);
      engine.widgetPixelWidths.set(savedWidths);
      engine.widgetTops.set(savedTops);
      engine.widgetHeights.set(savedHeights);

      engine.saveAsDefaultLayout();

      // Nudge current state so load has something to revert from.
      engine.widgetLefts.set({ w1: 50, w2: 500, w3: 900 });
      engine.widgetTops.set({ w1: 50, w2: 50, w3: 50 });

      engine.loadSavedDefaults();

      expect(engine.widgetLefts()).toEqual(savedLefts);
      expect(engine.widgetPixelWidths()).toEqual(savedWidths);
      expect(engine.widgetTops()).toEqual(savedTops);
      expect(engine.widgetHeights()).toEqual(savedHeights);
    });

    it('cleanupCanvasOverlaps treats touching widgets as non-overlapping', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      engine.widgetLefts.set({ w1: 0, w2: 300, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 300, w2: 300, w3: 600 });
      engine.widgetTops.set({ w1: 100, w2: 100, w3: 316 });
      engine.widgetHeights.set({ w1: 200, w2: 200, w3: 200 });

      (engine as unknown as { cleanupCanvasOverlaps: () => void }).cleanupCanvasOverlaps();

      expect(engine.widgetLefts()['w1']).toBe(0);
      expect(engine.widgetLefts()['w2']).toBe(300);
      expect(engine.widgetTops()['w1']).toBe(100);
      expect(engine.widgetTops()['w2']).toBe(100);
      expect(engine.widgetTops()['w3']).toBe(316);
    });

    it('cleanupCanvasOverlaps still resolves true geometric overlap', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      // w1 and w2 actually overlap by 20 px horizontally AND vertically.
      engine.widgetLefts.set({ w1: 0, w2: 280, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 300, w2: 300, w3: 300 });
      engine.widgetTops.set({ w1: 100, w2: 180, w3: 500 });
      engine.widgetHeights.set({ w1: 200, w2: 200, w3: 200 });

      (engine as unknown as { cleanupCanvasOverlaps: () => void }).cleanupCanvasOverlaps();

      // One of the two colliding widgets must have moved so they no longer overlap.
      const left1 = engine.widgetLefts()['w1'];
      const left2 = engine.widgetLefts()['w2'];
      const top1 = engine.widgetTops()['w1'];
      const top2 = engine.widgetTops()['w2'];
      const width1 = engine.widgetPixelWidths()['w1'];
      const width2 = engine.widgetPixelWidths()['w2'];
      const height1 = engine.widgetHeights()['w1'];
      const height2 = engine.widgetHeights()['w2'];

      const hOverlap = Math.min(left1 + width1, left2 + width2) - Math.max(left1, left2);
      const vOverlap = Math.min(top1 + height1, top2 + height2) - Math.max(top1, top2);
      const stillOverlapping = hOverlap > 0 && vOverlap > 0;
      expect(stillOverlapping).toBe(false);
    });

    it('applyCanvasHeaderClearance pushes non-locked widgets below the locked header', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      engine.widgetLocked.set({ w1: true });

      // Locked "header" at top 0 with height 80. Non-locked widget above the
      // clearance line should be pushed to header bottom + GAP_PX (16).
      engine.widgetTops.set({ w1: 0, w2: 40, w3: 500 });
      engine.widgetHeights.set({ w1: 80, w2: 200, w3: 200 });

      const applied = (
        engine as unknown as { applyCanvasHeaderClearance: () => boolean }
      ).applyCanvasHeaderClearance();

      expect(applied).toBe(true);
      expect(engine.widgetTops()['w1']).toBe(0);
      expect(engine.widgetTops()['w2']).toBe(96);
      expect(engine.widgetTops()['w3']).toBe(500);
    });

    it('applyCanvasHeaderClearance is a no-op when no widgets are locked', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 200, w2: 200, w3: 200 });

      const applied = (
        engine as unknown as { applyCanvasHeaderClearance: () => boolean }
      ).applyCanvasHeaderClearance();

      expect(applied).toBe(false);
      expect(engine.widgetTops()).toEqual({ w1: 0, w2: 0, w3: 0 });
    });

    // Regression: Frank's financials seed locks BOTH a full-width title bar
    // (top=0, height=80, width=1280) AND a left-half KPI panel (top=96,
    // height=512, width=640). A non-locked chart placed flush to the right
    // of the KPI panel (top=96, left=648, width=632) was being shoved down
    // to top=608 because clearance used a global max(locked bottom) ceiling.
    // Per-range clearance: only the full-width title contributes to the
    // chart's ceiling, so it stays at top=96.
    it('applyCanvasHeaderClearance only considers horizontally overlapping locked widgets', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      engine.widgetLocked.set({ w1: true, w2: true });

      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 648 });
      engine.widgetPixelWidths.set({ w1: 1280, w2: 640, w3: 632 });
      engine.widgetTops.set({ w1: 0, w2: 96, w3: 96 });
      engine.widgetHeights.set({ w1: 80, w2: 512, w3: 512 });

      const applied = (
        engine as unknown as { applyCanvasHeaderClearance: () => boolean }
      ).applyCanvasHeaderClearance();

      expect(applied).toBe(false);
      expect(engine.widgetTops()).toEqual({ w1: 0, w2: 96, w3: 96 });
    });

    it('cleanupCanvasOverlaps does not push a side-by-side chart below a locked KPI panel', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      engine.widgetLocked.set({ w1: true, w2: true });

      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 648 });
      engine.widgetPixelWidths.set({ w1: 1280, w2: 640, w3: 632 });
      engine.widgetTops.set({ w1: 0, w2: 96, w3: 96 });
      engine.widgetHeights.set({ w1: 80, w2: 512, w3: 512 });

      (engine as unknown as { cleanupCanvasOverlaps: () => void }).cleanupCanvasOverlaps();

      expect(engine.widgetTops()['w3']).toBe(96);
      expect(engine.widgetLefts()['w3']).toBe(648);
    });

    // Counter-test: a non-locked widget sitting *directly under* the locked
    // KPI panel (same x-range) must still be pushed below it. We mustn't
    // make the clearance too permissive.
    it('applyCanvasHeaderClearance still pushes widgets that overlap a locked panel horizontally', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      engine.widgetLocked.set({ w1: true, w2: true });

      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 100 });
      engine.widgetPixelWidths.set({ w1: 1280, w2: 640, w3: 400 });
      engine.widgetTops.set({ w1: 0, w2: 96, w3: 200 });
      engine.widgetHeights.set({ w1: 80, w2: 512, w3: 300 });

      const applied = (
        engine as unknown as { applyCanvasHeaderClearance: () => boolean }
      ).applyCanvasHeaderClearance();

      expect(applied).toBe(true);
      // finNavKpi clone: top 96 + height 512 = 608; + GAP_PX (16) = 624.
      expect(engine.widgetTops()['w3']).toBe(624);
    });
  });

  describe('view-mode switching persistence', () => {
    // Provide the same rAF shim these flows need. The engine doesn't trigger
    // rAF in these tests directly, but keeping it mirrors the browser env.
    const origRAF = (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
    beforeAll(() => {
      (globalThis as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame =
        (cb: FrameRequestCallback) => { cb(0); return 0; };
    });
    afterAll(() => {
      if (origRAF) {
        (globalThis as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = origRAF;
      } else {
        delete (globalThis as { requestAnimationFrame?: typeof requestAnimationFrame }).requestAnimationFrame;
      }
    });

    // Scenario B: canvas -> desktop -> canvas. Positions in canvas mode must
    // survive a round-trip through a desktop mode excursion. The breakpoint
    // handler persists canvas state on leaving and restores it on re-entry.
    it('canvas positions survive a canvas -> desktop -> canvas round-trip', () => {
      const layoutService = createMockLayoutService();
      const engine = createEngine({}, layoutService);

      engine.isCanvasMode.set(true);
      const canvasLefts = { w1: 40, w2: 500, w3: 960 };
      const canvasWidths = { w1: 400, w2: 400, w3: 400 };
      const canvasTops = { w1: 120, w2: 120, w3: 600 };
      const canvasHeights = { w1: 220, w2: 220, w3: 220 };
      engine.widgetLefts.set(canvasLefts);
      engine.widgetPixelWidths.set(canvasWidths);
      engine.widgetTops.set(canvasTops);
      engine.widgetHeights.set(canvasHeights);

      engine.persistCanvasLayout();

      engine.isCanvasMode.set(false);
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 0, w2: 0, w3: 0 });

      engine.isCanvasMode.set(true);
      const restored = engine.restoreCanvasLayout();

      expect(restored).toBe(true);
      expect(engine.widgetLefts()).toEqual(canvasLefts);
      expect(engine.widgetPixelWidths()).toEqual(canvasWidths);
      expect(engine.widgetTops()).toEqual(canvasTops);
      expect(engine.widgetHeights()).toEqual(canvasHeights);
    });

    // Scenario A: desktop -> canvas -> desktop. Desktop column placements must
    // survive a canvas excursion. Real code uses an in-memory snapshot but the
    // sessionStorage copy (via persistLayout) is what protects against refresh.
    it('desktop layout is persisted to storage (not just memory) so it survives a refresh', () => {
      const saveFn = vi.fn();
      const loadFn = vi.fn().mockReturnValue(null);
      const layoutService = { save: saveFn, load: loadFn } as unknown as WidgetLayoutService;
      const engine = createEngine({}, layoutService);

      engine.isCanvasMode.set(false);
      engine.isMobile.set(false);
      engine.widgetColStarts.set({ w1: 1, w2: 5, w3: 9 });
      engine.widgetColSpans.set({ w1: 4, w2: 4, w3: 8 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 400 });
      engine.widgetHeights.set({ w1: 380, w2: 380, w3: 380 });

      engine.persistLayout();

      expect(saveFn).toHaveBeenCalled();
      const lastCall = saveFn.mock.calls[saveFn.mock.calls.length - 1];
      const [, mobileFlag, payload] = lastCall;
      expect(mobileFlag).toBe(false);
      expect(payload.colStarts).toEqual({ w1: 1, w2: 5, w3: 9 });
      expect(payload.colSpans).toEqual({ w1: 4, w2: 4, w3: 8 });
    });

    // Scenario D: save as default in canvas, load default, then simulate a
    // mode switch via persist+restore. The loaded default layout should be
    // what's restored on re-entry (because loadSavedDefaults pushes the
    // defaults into currentCanvasKey as well as canvasDefaultsKey).
    it('canvas loadSavedDefaults writes through to currentCanvasKey so it survives a mode switch', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      const savedLefts = { w1: 100, w2: 420, w3: 740 };
      const savedWidths = { w1: 300, w2: 300, w3: 300 };
      const savedTops = { w1: 150, w2: 150, w3: 450 };
      const savedHeights = { w1: 260, w2: 260, w3: 260 };
      engine.widgetLefts.set(savedLefts);
      engine.widgetPixelWidths.set(savedWidths);
      engine.widgetTops.set(savedTops);
      engine.widgetHeights.set(savedHeights);

      engine.saveAsDefaultLayout();

      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 10, w2: 10, w3: 10 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 10, w2: 10, w3: 10 });

      engine.loadSavedDefaults();

      // Nudge state again to simulate entering desktop mode.
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 10, w2: 10, w3: 10 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 10, w2: 10, w3: 10 });

      const restored = engine.restoreCanvasLayout();

      expect(restored).toBe(true);
      expect(engine.widgetLefts()).toEqual(savedLefts);
      expect(engine.widgetPixelWidths()).toEqual(savedWidths);
      expect(engine.widgetTops()).toEqual(savedTops);
      expect(engine.widgetHeights()).toEqual(savedHeights);
    });

    // Scenario C: user changes layout, switches modes, refreshes. Equivalent
    // to persist-then-restore with an interleaved mode change. The mouseup
    // persist path in canvas writes to localStorage and restore reads the
    // same key -- verify the round-trip directly.
    it('canvas persist->clear->restore round-trip returns identical geometry', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      const lefts = { w1: 12, w2: 320, w3: 640 };
      const widths = { w1: 300, w2: 300, w3: 300 };
      const tops = { w1: 80, w2: 80, w3: 320 };
      const heights = { w1: 220, w2: 220, w3: 220 };
      engine.widgetLefts.set(lefts);
      engine.widgetPixelWidths.set(widths);
      engine.widgetTops.set(tops);
      engine.widgetHeights.set(heights);

      engine.persistCanvasLayout();

      // Simulate fresh engine state (as if the page just reloaded).
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 1, w2: 1, w3: 1 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 1, w2: 1, w3: 1 });

      const restored = engine.restoreCanvasLayout();

      expect(restored).toBe(true);
      expect(engine.widgetLefts()).toEqual(lefts);
      expect(engine.widgetPixelWidths()).toEqual(widths);
      expect(engine.widgetTops()).toEqual(tops);
      expect(engine.widgetHeights()).toEqual(heights);
    });

    // Regression for the localStorage-dump bug: when the user's home canvas
    // layout reverted to the seed after canvas -> desktop -> canvas, the
    // culprit was `cleanupCanvasOverlaps` measuring `headerBottom` against
    // a pre-reflow gridEl (still desktop-sized) and pushing every widget
    // below a bogus clearance line, then persisting.
    //
    // With the DOM-less headerBottom derivation the cleanup MUST leave a
    // valid saved canvas layout untouched regardless of any stubbed DOM
    // rects the transitional grid might expose.
    it('cleanupCanvasOverlaps ignores desktop-sized DOM rects on mode re-entry', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      // Locked header at top 0 height 80 -> valid headerBottom is 80.
      engine.widgetLocked.set({ w1: true });
      engine.widgetLefts.set({ w1: 0, w2: 100, w3: 500 });
      engine.widgetPixelWidths.set({ w1: 1280, w2: 300, w3: 300 });
      engine.widgetTops.set({ w1: 0, w2: 120, w3: 500 });
      engine.widgetHeights.set({ w1: 80, w2: 200, w3: 200 });

      // Attach gridEl/headerEl accessors that report DESKTOP dimensions -- a
      // faithful simulation of the rAF firing before CSS reflow completes.
      // If the cleanup listens to DOM rects here it will read headerBottom
      // as roughly (headerRect.bottom - gridRect.top) = desktop header
      // offset, push w2 further down, and clobber the saved layout.
      const desktopGridRect = { top: 0, bottom: 800, left: 0, right: 1280, width: 1280, height: 800 } as DOMRect;
      const desktopHeaderRect = { top: 0, bottom: 400, left: 0, right: 1280, width: 1280, height: 400 } as DOMRect;
      const gridEl = { getBoundingClientRect: () => desktopGridRect } as unknown as HTMLElement;
      const headerEl = { getBoundingClientRect: () => desktopHeaderRect } as unknown as HTMLElement;
      (engine as unknown as {
        gridElAccessor: () => HTMLElement;
        headerElAccessor: () => HTMLElement;
      }).gridElAccessor = () => gridEl;
      (engine as unknown as {
        headerElAccessor: () => HTMLElement;
      }).headerElAccessor = () => headerEl;

      const beforeTops = { ...engine.widgetTops() };
      const beforeLefts = { ...engine.widgetLefts() };

      (engine as unknown as { cleanupCanvasOverlaps: () => void }).cleanupCanvasOverlaps();

      expect(engine.widgetTops()).toEqual(beforeTops);
      expect(engine.widgetLefts()).toEqual(beforeLefts);
    });

    // Direct reproduction of the user-reported scenario: drag in canvas ->
    // switch to desktop -> switch back -> assert byte-equal saved layout.
    //
    // Simulated via the same primitives the browser uses at mode-transition
    // time: persistCanvasLayout on leaving, restoreCanvasLayout on re-entering,
    // then the cleanupAndPersistCanvas scheduler the engine calls.
    it('canvas -> desktop -> canvas leaves currentCanvasKey byte-identical', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);

      const lefts = { w1: 72, w2: 488, w3: 904 };
      const widths = { w1: 380, w2: 380, w3: 380 };
      const tops = { w1: 144, w2: 144, w3: 480 };
      const heights = { w1: 240, w2: 240, w3: 240 };
      engine.widgetLefts.set(lefts);
      engine.widgetPixelWidths.set(widths);
      engine.widgetTops.set(tops);
      engine.widgetHeights.set(heights);
      engine.persistCanvasLayout();

      const beforeBlob = localStorage.getItem('test-canvas');
      expect(beforeBlob).not.toBeNull();

      // Excursion through desktop mode: scramble in-memory state, then return
      // to canvas and ask the engine to restore + run its cleanup scheduler.
      engine.isCanvasMode.set(false);
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetPixelWidths.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });
      engine.widgetHeights.set({ w1: 0, w2: 0, w3: 0 });

      engine.isCanvasMode.set(true);
      const restored = engine.restoreCanvasLayout();
      expect(restored).toBe(true);
      (engine as unknown as { cleanupAndPersistCanvas: () => void }).cleanupAndPersistCanvas();

      const afterBlob = localStorage.getItem('test-canvas');
      expect(afterBlob).toBe(beforeBlob);
    });

    // loadSavedDefaults schedules cleanupCanvasOverlaps via rAF. Before the
    // cleanup-then-persist fix the cleanup adjustments lived only in memory,
    // so a subsequent reload / mode switch read the pre-cleanup geometry and
    // the layout drifted. Verify the persisted blob matches what's on screen.
    it('loadSavedDefaults leaves currentCanvasKey matching the post-cleanup geometry', () => {
      const engine = createEngine();
      engine.isCanvasMode.set(true);
      // Lock a header widget so applyCanvasHeaderClearance must run.
      engine.widgetLocked.set({ w1: true });

      // Saved defaults put w2 inside the header clearance zone -- cleanup
      // will push it below the header. We want that push reflected in
      // localStorage afterwards.
      engine.widgetLefts.set({ w1: 0, w2: 0, w3: 400 });
      engine.widgetPixelWidths.set({ w1: 1280, w2: 300, w3: 300 });
      engine.widgetTops.set({ w1: 0, w2: 40, w3: 500 });
      engine.widgetHeights.set({ w1: 80, w2: 200, w3: 200 });
      engine.saveAsDefaultLayout();

      // Nudge live state.
      engine.widgetTops.set({ w1: 0, w2: 0, w3: 0 });

      engine.loadSavedDefaults();

      // The engine should have rewritten currentCanvasKey to match what's on
      // screen, not the pre-cleanup saved blob.
      const restoredForVerification = engine.restoreCanvasLayout();
      expect(restoredForVerification).toBe(true);
      expect(engine.widgetTops()['w2']).toBeGreaterThanOrEqual(96);
      expect(engine.widgetTops()['w1']).toBe(0);
    });
  });

  describe('destroy', () => {
    it('aborts the AbortController', () => {
      const engine = createEngine();
      expect(engine.abortCtrl.signal.aborted).toBe(false);
      engine.destroy();
      expect(engine.abortCtrl.signal.aborted).toBe(true);
    });
  });
});
