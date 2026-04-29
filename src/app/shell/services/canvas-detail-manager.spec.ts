import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { CanvasDetailManager, FREESTANDING_DETAIL_PREFIX, type DetailView } from './canvas-detail-manager';
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

function createConfig(): DashboardLayoutConfig {
  return {
    widgets: ['homeKpis', 'homeRfis'],
    layoutStorageKey: 'test',
    canvasStorageKey: 'test',
    defaultColStarts: { homeKpis: 1, homeRfis: 5 },
    defaultColSpans: { homeKpis: 4, homeRfis: 4 },
    defaultTops: { homeKpis: 0, homeRfis: 0 },
    defaultHeights: { homeKpis: 200, homeRfis: 384 },
    canvasDefaultLefts: { homeKpis: 0, homeRfis: 340 },
    canvasDefaultPixelWidths: { homeKpis: 308, homeRfis: 308 },
  };
}

function createEngine(): DashboardLayoutEngine {
  return new DashboardLayoutEngine(createConfig(), createMockLayoutService());
}

const RFI_DETAIL: DetailView = {
  type: 'rfi',
  item: {
    id: 'rfi-1',
    number: 'RFI-001',
    subject: 'Question',
    question: 'What?',
    askedBy: 'Alice',
    askedOn: '2026-04-01',
    project: 'Tower 5',
    assignee: 'Bob',
    status: 'open',
    dueDate: '2026-04-30',
  },
};

describe('CanvasDetailManager.openFreestandingDetail', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
    if (!('requestAnimationFrame' in globalThis)) {
      (globalThis as { requestAnimationFrame?: (cb: () => void) => number }).requestAnimationFrame =
        ((cb: () => void) => { cb(); return 0; }) as never;
    }
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('spawns a synthetic widget id with the freestanding prefix', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    const id = mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });

    expect(id.startsWith(FREESTANDING_DETAIL_PREFIX)).toBe(true);
    expect(mgr.canvasDetailViews()[id]).toEqual(RFI_DETAIL);
    expect(mgr.freestandingIds()).toContain(id);
    expect(mgr.isFreestanding(id)).toBe(true);
  });

  it('registers the synthetic id with the engine and seeds geometry', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    const id = mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });

    expect(engine.widgetTops()[id]).toBeGreaterThanOrEqual(0);
    expect(engine.widgetLefts()[id]).toBeGreaterThanOrEqual(0);
    expect(engine.widgetPixelWidths()[id]).toBe(800);
    expect(engine.widgetHeights()[id]).toBe(1000);
  });

  it('uses the drawing footprint for drawing details', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    const drawing: DetailView = {
      type: 'drawing',
      item: { id: 'd1', title: 'Floor Plan', subtitle: '', thumbnail: '', revision: 'A', date: '' },
    };
    const id = mgr.openFreestandingDetail(drawing, engine, { width: 1920, height: 1080 });
    expect(engine.widgetPixelWidths()[id]).toBe(1024);
    expect(engine.widgetHeights()[id]).toBe(768);
  });

  it('closeDetail removes synthetic id from engine and freestanding set without restoring rects', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    const id = mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });

    expect(engine.widgetTops()[id]).toBeDefined();
    expect(mgr.freestandingIds()).toContain(id);

    mgr.closeDetail(id, engine, ['homeKpis', 'homeRfis']);

    expect(mgr.canvasDetailViews()[id]).toBeUndefined();
    expect(mgr.freestandingIds()).not.toContain(id);
    expect(engine.widgetTops()[id]).toBeUndefined();
    expect(engine.widgetLefts()[id]).toBeUndefined();
    expect(engine.widgetPixelWidths()[id]).toBeUndefined();
    expect(engine.widgetHeights()[id]).toBeUndefined();
  });

  it('reset() clears all freestanding ids', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });
    mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });
    expect(mgr.freestandingIds().length).toBe(2);

    mgr.reset();

    expect(mgr.freestandingIds()).toEqual([]);
    expect(mgr.canvasDetailViews()).toEqual({});
  });

  it('multiple openFreestandingDetail calls yield distinct ids and offset positions', () => {
    const engine = createEngine();
    const mgr = new CanvasDetailManager();
    const id1 = mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });
    const id2 = mgr.openFreestandingDetail(RFI_DETAIL, engine, { width: 1920, height: 1080 });
    expect(id1).not.toBe(id2);
    // Second tile is offset to avoid sitting exactly on top of the first.
    expect(engine.widgetLefts()[id2]).not.toBe(engine.widgetLefts()[id1]);
  });
});

describe('DashboardLayoutEngine transient widget API', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  });

  it('addTransientWidget mutates widgets list once; removeTransientWidget cleans up signal entries', () => {
    const engine = createEngine();
    expect(engine.addTransientWidget('__ai_detail_1')).toBe(true);
    expect(engine.addTransientWidget('__ai_detail_1')).toBe(false);

    engine.widgetTops.update(t => ({ ...t, __ai_detail_1: 100 }));
    engine.widgetLefts.update(l => ({ ...l, __ai_detail_1: 200 }));

    engine.removeTransientWidget('__ai_detail_1');

    expect(engine.widgetTops()['__ai_detail_1']).toBeUndefined();
    expect(engine.widgetLefts()['__ai_detail_1']).toBeUndefined();
  });
});
