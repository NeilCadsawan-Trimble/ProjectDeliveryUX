import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CanvasResetService {
  private readonly _resetWidgetsTick = signal(0);
  readonly resetWidgetsTick = this._resetWidgetsTick.asReadonly();

  private readonly _saveDefaultsTick = signal(0);
  readonly saveDefaultsTick = this._saveDefaultsTick.asReadonly();

  private readonly _exportLayoutTick = signal(0);
  readonly exportLayoutTick = this._exportLayoutTick.asReadonly();

  private readonly _loadDefaultsTick = signal(0);
  readonly loadDefaultsTick = this._loadDefaultsTick.asReadonly();

  /** Holds the last exported layout seed TypeScript string. */
  readonly lastExportedSeed = signal('');

  readonly canvasZoom = signal(1);

  triggerResetWidgets(): void {
    this._resetWidgetsTick.update((n) => n + 1);
  }

  triggerLoadDefaults(): void {
    this._loadDefaultsTick.update((n) => n + 1);
  }

  triggerSaveDefaults(): void {
    this._saveDefaultsTick.update((n) => n + 1);
  }

  triggerExportLayout(): void {
    this._exportLayoutTick.update((n) => n + 1);
  }
}
