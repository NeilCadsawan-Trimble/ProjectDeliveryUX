import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { PROJECTS } from '../../data/dashboard-data';

export interface ShellBackButton {
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
    if (!prev) return { route: '/projects', label: 'Projects' };

    const path = prev.split('?')[0];

    if (path === '/' || path === '') return { route: '/', label: 'Home' };
    if (path === '/projects') return { route: '/projects', label: 'Projects' };
    if (path === '/financials') return { route: '/financials', label: 'Financials' };
    if (path.startsWith('/project/')) {
      const slug = path.replace('/project/', '');
      const project = PROJECTS.find(p => p.slug === slug);
      const label = project ? project.name : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return { route: prev, label };
    }

    return { route: '/projects', label: 'Projects' };
  }
}
