import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CanvasResetService {
  private readonly _resetWidgetsTick = signal(0);
  readonly resetWidgetsTick = this._resetWidgetsTick.asReadonly();

  triggerResetWidgets(): void {
    this._resetWidgetsTick.update((n) => n + 1);
  }
}
