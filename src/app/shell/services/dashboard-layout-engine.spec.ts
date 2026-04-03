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
    it('restores all signals to config defaults', () => {
      const engine = createEngine();

      engine.widgetTops.set({ w1: 100, w2: 200, w3: 300 });
      engine.widgetHeights.set({ w1: 500, w2: 500, w3: 500 });
      engine.widgetColStarts.set({ w1: 3, w2: 7, w3: 11 });
      engine.widgetColSpans.set({ w1: 6, w2: 6, w3: 6 });

      engine.resetToDefaults();

      expect(engine.widgetTops()).toEqual({ w1: 0, w2: 0, w3: 400 });
      expect(engine.widgetHeights()).toEqual({ w1: 380, w2: 380, w3: 380 });
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

    it('squeezes the far-end neighbor first at the container edge', () => {
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

    it('squeezes the far-end neighbor first at left boundary', () => {
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

  describe('destroy', () => {
    it('aborts the AbortController', () => {
      const engine = createEngine();
      expect(engine.abortCtrl.signal.aborted).toBe(false);
      engine.destroy();
      expect(engine.abortCtrl.signal.aborted).toBe(true);
    });
  });
});
