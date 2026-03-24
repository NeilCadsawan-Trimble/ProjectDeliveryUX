import { TestBed } from '@angular/core/testing';
import { CanvasResetService } from './canvas-reset.service';

describe('CanvasResetService', () => {
  let service: CanvasResetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasResetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('resetWidgetsTick starts at 0', () => {
    expect(service.resetWidgetsTick()).toBe(0);
  });

  it('triggerResetWidgets increments tick to 1', () => {
    service.triggerResetWidgets();
    expect(service.resetWidgetsTick()).toBe(1);
  });

  it('triggerResetWidgets increments cumulatively', () => {
    service.triggerResetWidgets();
    service.triggerResetWidgets();
    expect(service.resetWidgetsTick()).toBe(2);
  });
});
