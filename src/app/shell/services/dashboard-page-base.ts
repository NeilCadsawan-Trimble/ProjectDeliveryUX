import { DestroyRef, Directive, effect, inject, untracked } from '@angular/core';
import { CanvasResetService } from './canvas-reset.service';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from './dashboard-layout-engine';
import { WidgetFocusService } from './widget-focus.service';
import { WidgetLayoutService } from './widget-layout.service';

/**
 * Shared dashboard layout wiring: engine lifecycle, canvas reset/save effects,
 * document drag/resize delegation, and engine signal aliases.
 *
 * Subclasses provide layout config, grid/header element resolvers, and initial pinned header lock.
 */
@Directive()
export abstract class DashboardPageBase {
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly widgetLayoutService = inject(WidgetLayoutService);
  readonly widgetFocusService = inject(WidgetFocusService);
  protected readonly canvasResetService = inject(CanvasResetService);

  protected abstract getEngineConfig(): DashboardLayoutConfig;

  protected readonly engine = new DashboardLayoutEngine(this.getEngineConfig(), this.widgetLayoutService);

  private readonly _lockPinnedHeaders = (() => {
    this.applyInitialHeaderLock();
  })();

  protected abstract applyInitialHeaderLock(): void;

  private readonly _registerEngineDestroy = this.destroyRef.onDestroy(() => {
    this.engine.destroy();
  });

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.applyInitialHeaderLock();
      });
    }
  });

  private readonly _saveDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.saveDefaultsTick();
    if (tick > 0) {
      untracked(() => this.engine.saveAsDefaultLayout());
    }
  });

  readonly isMobile = this.engine.isMobile;
  readonly isCanvasMode = this.engine.isCanvasMode;
  readonly widgetColStarts = this.engine.widgetColStarts;
  readonly widgetColSpans = this.engine.widgetColSpans;
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly widgetLocked = this.engine.widgetLocked;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.resolveGridElement();
    this.engine.headerElAccessor = () => this.resolveHeaderElement();
    this.engine.init();
  }

  protected abstract resolveGridElement(): HTMLElement | undefined;
  protected abstract resolveHeaderElement(): HTMLElement | undefined;

  onDocumentMouseMove(event: MouseEvent): void {
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    this.engine.onDocumentTouchEnd();
  }
}
