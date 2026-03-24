import { TestBed } from '@angular/core/testing';
import { WidgetLayoutService, type WidgetLayout } from './widget-layout.service';

describe('WidgetLayoutService', () => {
  let service: WidgetLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetLayoutService);
    sessionStorage.clear();
  });

  afterEach(() => {
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
});
