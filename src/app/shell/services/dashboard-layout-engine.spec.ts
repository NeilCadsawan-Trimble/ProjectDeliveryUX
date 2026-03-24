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
    defaultLefts: { w1: 0, w2: 324, w3: 648 },
    defaultPixelWidths: { w1: 308, w2: 308, w3: 632 },
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
      expect(engine.widgetLefts()).toEqual({ w1: 0, w2: 324, w3: 648 });
      expect(engine.widgetPixelWidths()).toEqual({ w1: 308, w2: 308, w3: 632 });
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

    it('squeezes a wide neighbor before pushing it', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2'],
        defaultLefts: { w1: 0, w2: 400 },
        defaultPixelWidths: { w1: 308, w2: 700 },
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

      const origW2Right = 400 + 700;
      engine.startWidgetResize('w1', 'h', { clientX: 308, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'right');

      engine.onDocumentMouseMove({ clientX: 458, clientY: 200 } as MouseEvent);

      const w2Right = engine.widgetLefts()['w2'] + engine.widgetPixelWidths()['w2'];
      expect(w2Right).toBe(origW2Right);
      expect(engine.widgetPixelWidths()['w2']).toBeLessThan(700);
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

    it('squeezes a wide neighbor from the right before pushing it', () => {
      const engine = createEngine({
        widgets: ['w1', 'w2'],
        defaultLefts: { w1: 0, w2: 500 },
        defaultPixelWidths: { w1: 700, w2: 308 },
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

      const origW1Left = 0;
      engine.startWidgetResize('w2', 'h', { clientX: 500, clientY: 200, preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as MouseEvent, 'left');

      engine.onDocumentMouseMove({ clientX: 400, clientY: 200 } as MouseEvent);

      expect(engine.widgetLefts()['w1']).toBe(origW1Left);
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
