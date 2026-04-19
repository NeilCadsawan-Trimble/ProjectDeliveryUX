import { TestBed } from '@angular/core/testing';
import { WidgetLayoutService, type WidgetLayout } from './widget-layout.service';

describe('WidgetLayoutService', () => {
  let service: WidgetLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetLayoutService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('load returns null when no data saved', () => {
    expect(service.load('test-dashboard', false)).toBeNull();
    expect(service.load('test-dashboard', true)).toBeNull();
  });

  it('save and load round-trips desktop layout', () => {
    const layout: WidgetLayout = {
      tops: { w1: 0, w2: 100 },
      heights: { w1: 300, w2: 300 },
      colStarts: { w1: 1, w2: 5 },
      colSpans: { w1: 4, w2: 4 },
      lefts: { w1: 0, w2: 200 },
      widths: { w1: 180, w2: 180 },
    };
    service.save('test-dashboard', false, layout);

    const loaded = service.load('test-dashboard', false);
    expect(loaded).toEqual(layout);
  });

  it('save and load round-trips mobile layout separately', () => {
    const desktopLayout: WidgetLayout = {
      tops: { w1: 0 },
      heights: { w1: 300 },
      colStarts: { w1: 1 },
      colSpans: { w1: 8 },
    };
    const mobileLayout: WidgetLayout = {
      tops: { w1: 0 },
      heights: { w1: 200 },
      colStarts: { w1: 1 },
      colSpans: { w1: 16 },
    };

    service.save('test-dashboard', false, desktopLayout);
    service.save('test-dashboard', true, mobileLayout);

    expect(service.load('test-dashboard', false)).toEqual(desktopLayout);
    expect(service.load('test-dashboard', true)).toEqual(mobileLayout);
  });

  it('save writes to localStorage (so it survives a tab close)', () => {
    const layout: WidgetLayout = {
      tops: { w1: 0 },
      heights: { w1: 300 },
      colStarts: { w1: 1 },
      colSpans: { w1: 8 },
    };
    service.save('persistent-dash', false, layout);

    // Simulate tab close by wiping sessionStorage only.
    sessionStorage.clear();

    expect(service.load('persistent-dash', false)).toEqual(layout);
  });

  it('migrates a pre-existing sessionStorage payload into localStorage on first load', () => {
    const legacy: WidgetLayout = {
      tops: { w1: 50 },
      heights: { w1: 200 },
      colStarts: { w1: 3 },
      colSpans: { w1: 6 },
    };
    const key = 'widget-layout:legacy-dashboard:desktop';
    sessionStorage.setItem(key, JSON.stringify(legacy));

    const loaded = service.load('legacy-dashboard', false);
    expect(loaded).toEqual(legacy);

    expect(localStorage.getItem(key)).toEqual(JSON.stringify(legacy));
    expect(sessionStorage.getItem(key)).toBeNull();
  });

  it('remove clears both localStorage and sessionStorage copies', () => {
    const layout: WidgetLayout = {
      tops: { w1: 0 },
      heights: { w1: 300 },
      colStarts: { w1: 1 },
      colSpans: { w1: 8 },
    };
    service.save('test-dashboard', false, layout);
    sessionStorage.setItem('widget-layout:test-dashboard:desktop', JSON.stringify(layout));

    service.remove('test-dashboard', false);

    expect(service.load('test-dashboard', false)).toBeNull();
    expect(sessionStorage.getItem('widget-layout:test-dashboard:desktop')).toBeNull();
  });
});
