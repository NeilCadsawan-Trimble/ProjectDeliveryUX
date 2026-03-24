import { TestBed, ComponentFixture } from '@angular/core/testing';
import { WidgetResizeHandleComponent } from './widget-resize-handle.component';

describe('WidgetResizeHandleComponent', () => {
  let fixture: ComponentFixture<WidgetResizeHandleComponent>;
  let component: WidgetResizeHandleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetResizeHandleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetResizeHandleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults position to right', () => {
    expect(component.position()).toBe('right');
  });

  it('defaults isMobile to false', () => {
    expect(component.isMobile()).toBe(false);
  });

  describe('right position (default)', () => {
    it('applies right-0 class', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('right-0')).toBe(true);
    });

    it('applies cursor-nwse-resize class when not mobile', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('cursor-nwse-resize')).toBe(true);
    });

    it('does NOT apply left-0 class', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('left-0')).toBe(false);
    });
  });

  describe('left position', () => {
    it('applies left-0 class', () => {
      fixture.componentRef.setInput('position', 'left');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('left-0')).toBe(true);
    });

    it('applies cursor-nesw-resize class when not mobile', () => {
      fixture.componentRef.setInput('position', 'left');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('cursor-nesw-resize')).toBe(true);
    });

    it('does NOT apply right-0 class', () => {
      fixture.componentRef.setInput('position', 'left');
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('right-0')).toBe(false);
    });
  });

  describe('mobile mode', () => {
    it('applies cursor-ns-resize when mobile', () => {
      fixture.componentRef.setInput('isMobile', true);
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('.absolute');
      expect(el.classList.contains('cursor-ns-resize')).toBe(true);
    });
  });
});
