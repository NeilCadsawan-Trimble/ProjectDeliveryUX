import { DestroyRef, Directive, effect, inject, untracked } from '@angular/core';
import { PersonaService } from '../../services/persona.service';
import { ThemeService } from '../../services/theme.service';
import { CanvasResetService } from './canvas-reset.service';
import { DashboardLayoutEngine, type DashboardLayoutConfig } from './dashboard-layout-engine';
import { WidgetFocusService } from './widget-focus.service';
import { WidgetLayoutService } from './widget-layout.service';
import type { LayoutSeed } from '../../data/layout-seeds/layout-seed.types';

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
  protected readonly personaService = inject(PersonaService);
  protected readonly themeService = inject(ThemeService);

  protected abstract getEngineConfig(): DashboardLayoutConfig;

  protected readonly engine = new DashboardLayoutEngine(this.getEngineConfig(), this.widgetLayoutService);

  private readonly _wireEngineZoom = (() => {
    this.engine.zoomFn = () => this.canvasResetService.canvasZoom();
  })();

  private readonly _lockPinnedHeaders = (() => {
    this.applyInitialHeaderLock();
  })();

  protected abstract applyInitialHeaderLock(): void;

  protected getLayoutSeedForCurrentPersona(): LayoutSeed | null {
    return null;
  }

  private readonly _registerEngineDestroy = this.destroyRef.onDestroy(() => {
    this.engine.destroy();
  });

  private _prevPersonaSlug: string | null = null;
  private _prevLayoutKey: string | null = null;
  private _prevCanvasKey: string | null = null;

  private readonly _personaSwitchEffect = effect(() => {
    const slug = this.personaService.activePersonaSlug();
    if (this._prevPersonaSlug !== null && this._prevPersonaSlug !== slug) {
      const prevLK = this._prevLayoutKey;
      const prevCK = this._prevCanvasKey;
      untracked(() => {
        const newSeed = this.getLayoutSeedForCurrentPersona();
        if (newSeed) this.engine.updateConfigForNewSeed(newSeed);
        this.engine.clearCurrentCache();
        this.personaService.consumeLayoutReset();
        this.engine.reinitLayout(prevLK ?? undefined, prevCK ?? undefined);
        this.applyInitialHeaderLock();
      });
    }
    this._prevPersonaSlug = slug;
    this._prevLayoutKey = this.engine.currentLayoutKey;
    this._prevCanvasKey = this.engine.currentCanvasKey;
  });

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.applyInitialHeaderLock();
        this.restoreThemeFromDefaults();
      });
    }
  });

  private readonly _loadDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.loadDefaultsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.loadSavedDefaults();
        this.applyInitialHeaderLock();
        this.restoreThemeFromDefaults();
      });
    }
  });

  private readonly _saveDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.saveDefaultsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.saveAsDefaultLayout();
        this.saveThemeWithDefaults();
      });
    }
  });

  private readonly _exportLayoutEffect = effect(() => {
    const tick = this.canvasResetService.exportLayoutTick();
    if (tick > 0) {
      untracked(() => {
        const constName = this.canvasResetService.exportConstName();
        const seed = this.engine.exportLayoutSeed(constName);
        this.canvasResetService.lastExportedSeed.set(seed);
      });
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
  readonly desktopGridMinHeight = this.engine.desktopGridMinHeight;
  readonly widgetGridColumns = this.engine.widgetGridColumns;
  readonly dragLeft = this.engine.dragLeft;
  readonly dragWidth = this.engine.dragWidth;

  private get themeDefaultsKey(): string {
    return `theme-defaults:${this.engine.currentLayoutKey}`;
  }

  private saveThemeWithDefaults(): void {
    try {
      const config = this.themeService.getThemeConfig();
      localStorage.setItem(this.themeDefaultsKey, JSON.stringify(config));
    } catch { /* quota exceeded */ }
  }

  private restoreThemeFromDefaults(): void {
    try {
      const raw = localStorage.getItem(this.themeDefaultsKey);
      if (!raw) return;
      const config = JSON.parse(raw);
      if (config?.theme && config?.mode) {
        this.themeService.setTheme(config.theme, config.mode);
      }
    } catch { /* ignore */ }
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.resolveGridElement();
    this.engine.headerElAccessor = () => this.resolveHeaderElement();
    if (this.personaService.consumeLayoutReset()) {
      this.engine.clearCurrentCache();
    }
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
