/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import {
  coerceMainMenuOpenPayload,
  isClickInsideSideNavChrome,
} from '../../src/app/shell/utils/side-nav-click.util';

describe('side-nav-click.util', () => {
  describe('coerceMainMenuOpenPayload', () => {
    it('accepts boolean', () => {
      expect(coerceMainMenuOpenPayload(true)).toBe(true);
      expect(coerceMainMenuOpenPayload(false)).toBe(false);
    });

    it('accepts CustomEvent with boolean detail', () => {
      expect(coerceMainMenuOpenPayload({ detail: true } as CustomEvent<boolean>)).toBe(true);
      expect(coerceMainMenuOpenPayload({ detail: false } as CustomEvent<boolean>)).toBe(false);
    });

    it('returns undefined for unknown shapes', () => {
      expect(coerceMainMenuOpenPayload(undefined)).toBeUndefined();
      expect(coerceMainMenuOpenPayload('true')).toBeUndefined();
      expect(coerceMainMenuOpenPayload({ detail: 'yes' } as unknown as CustomEvent<boolean>)).toBeUndefined();
    });
  });

  describe('isClickInsideSideNavChrome', () => {
    it('returns true when path includes shell-navbar-hamburger', () => {
      const div = document.createElement('div');
      div.className = 'shell-navbar-hamburger';
      const ev = { composedPath: () => [div] } as unknown as MouseEvent;
      expect(isClickInsideSideNavChrome(ev)).toBe(true);
    });

    it('returns true when path includes Main menu aria-label', () => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Main menu');
      const ev = { composedPath: () => [btn] } as unknown as MouseEvent;
      expect(isClickInsideSideNavChrome(ev)).toBe(true);
    });

    it('returns true for custom-side-nav descendant', () => {
      const rail = document.createElement('div');
      rail.className = 'custom-side-nav';
      const inner = document.createElement('div');
      rail.appendChild(inner);
      const ev = { composedPath: () => [inner, rail] } as unknown as MouseEvent;
      expect(isClickInsideSideNavChrome(ev)).toBe(true);
    });

    it('returns false for unrelated target', () => {
      const main = document.createElement('div');
      main.id = 'main-content';
      const ev = { composedPath: () => [main] } as unknown as MouseEvent;
      expect(isClickInsideSideNavChrome(ev)).toBe(false);
    });
  });
});
