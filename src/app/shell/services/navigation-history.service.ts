import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

export interface ShellBackButton {
  label: string;
  action: () => void;
}

export interface ShellTitleItem {
  id: number;
  label: string;
  sublabel?: string;
}

export interface ShellTitleOverride {
  text: string;
  items: ShellTitleItem[];
  onSelect: (id: number) => void;
}

@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private readonly router = inject(Router);
  private _previousUrl = '';
  private _currentUrl = '';

  readonly shellBackButton = signal<ShellBackButton | null>(null);
  readonly shellTitleOverride = signal<ShellTitleOverride | null>(null);

  constructor() {
    this._currentUrl = this.router.url;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => {
        this._previousUrl = this._currentUrl;
        this._currentUrl = e.urlAfterRedirects;
      });
  }

  get previousUrl(): string {
    return this._previousUrl;
  }

  getBackInfo(): { route: string; label: string } {
    const prev = this._previousUrl;
    if (!prev) return { route: '/', label: 'Back' };
    return { route: prev, label: 'Back' };
  }
}
