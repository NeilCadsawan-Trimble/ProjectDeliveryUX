import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CanvasResetService {
  private readonly _resetWidgetsTick = signal(0);
  readonly resetWidgetsTick = this._resetWidgetsTick.asReadonly();

  private readonly _saveDefaultsTick = signal(0);
  readonly saveDefaultsTick = this._saveDefaultsTick.asReadonly();

  triggerResetWidgets(): void {
    this._resetWidgetsTick.update((n) => n + 1);
  }

  triggerSaveDefaults(): void {
    this._saveDefaultsTick.update((n) => n + 1);
  }
}
