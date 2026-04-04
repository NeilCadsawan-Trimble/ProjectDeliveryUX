import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/layout/dashboard-shell.component.ts'),
  'utf-8',
);
const ENGINE_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/dashboard-layout-engine.ts'),
  'utf-8',
);

describe('DashboardShellComponent (regression)', () => {
  describe('hamburger button', () => {
    it('has attachHamburgerListener method as fallback', () => {
      expect(SRC).toContain('attachHamburgerListener');
    });

    it('queries for [aria-label="Main menu"]', () => {
      expect(SRC).toContain('[aria-label="Main menu"]');
    });

    it('toggles navExpanded on hamburger click', () => {
      expect(SRC).toContain('this.navExpanded.set(!this.navExpanded())');
    });

    it('uses stopImmediatePropagation to prevent Modus default handling', () => {
      expect(SRC).toContain('stopImmediatePropagation');
    });

    it('uses capture phase for click listener', () => {
      expect(SRC).toContain('capture: true');
    });

    it('binds mainMenuOpenChange on modus-navbar for reliable toggle', () => {
      expect(SRC).toContain('(mainMenuOpenChange)="onMainMenuToggle($event)"');
    });

    it('has onMainMenuToggle method', () => {
      expect(SRC).toContain('onMainMenuToggle');
    });

    it('falls back to light DOM query when shadowRoot is null', () => {
      expect(SRC).toContain('navbarWc.querySelector');
    });

    it('onMainMenuToggle uses idempotent set(open) not toggle', () => {
      expect(SRC).toContain('navExpanded.set(open)');
    });
  });

  describe('navExpanded signal', () => {
    it('declares navExpanded signal', () => {
      expect(SRC).toContain('navExpanded = signal');
    });
  });

  describe('navbar host fallback wrapper', () => {
    it('marks fallback hamburger for side-rail alignment CSS', () => {
      expect(SRC).toContain('shell-navbar-hamburger');
    });

    it('wraps modus-navbar with modus-wc-navbar-host-fallback when native toolbar is missing', () => {
      expect(SRC).toContain('modus-wc-navbar-host-fallback');
      expect(SRC).toContain('[class.modus-wc-navbar-host-fallback]="!navbarNativeRendered()"');
    });
  });

  describe('navbar visibility (slot end order vs native utilities)', () => {
    it('keeps mainMenu true so hamburger renders in canvas and desktop', () => {
      expect(SRC).toMatch(/mainMenu:\s*true/);
    });

    it('disables native search notifications help user so Angular slot owns utilities', () => {
      expect(SRC).toMatch(/search:\s*false/);
      expect(SRC).toMatch(/notifications:\s*false/);
      expect(SRC).toMatch(/help:\s*false/);
      expect(SRC).toMatch(/user:\s*false/);
    });

    it('renders modus-text-input for navbar search when expanded', () => {
      expect(SRC).toContain('modus-text-input');
      expect(SRC).toContain('navbarSearchQuery');
    });
  });

  describe('desktop reset flyout', () => {
    it('has desktop-reset-flyout class in template', () => {
      expect(SRC).toContain('desktop-reset-flyout');
    });

    it('has canvas-reset-flyout class in template', () => {
      expect(SRC).toContain('canvas-reset-flyout');
    });

    it('declares desktopResetMenuOpen signal', () => {
      expect(SRC).toContain('desktopResetMenuOpen');
    });

    it('has toggleDesktopResetMenu method', () => {
      expect(SRC).toContain('toggleDesktopResetMenu');
    });
  });

  describe('labels', () => {
    it('uses "Reset Layout" label', () => {
      expect(SRC).toContain('Reset Layout');
    });

    it('does NOT use "Reset Widgets" label', () => {
      expect(SRC).not.toContain('Reset Widgets');
    });

    it('does NOT contain "Clean Up Overlaps" menu item', () => {
      expect(SRC).not.toContain('Clean Up Overlaps');
    });
  });

  describe('reset action', () => {
    it('has resetMenuAction method', () => {
      expect(SRC).toContain('resetMenuAction');
    });

    it('calls canvasResetService.triggerResetWidgets', () => {
      expect(SRC).toContain('triggerResetWidgets');
    });

    it('calls canvasResetService.triggerSaveDefaults for save-defaults action', () => {
      expect(SRC).toContain('triggerSaveDefaults');
    });
  });

  describe('Save as Default Layout', () => {
    it('has Save as Default Layout menu item', () => {
      expect(SRC).toContain('Save as Default Layout');
    });

    it('has save_disk icon for save defaults option', () => {
      expect(SRC).toContain('save_disk');
    });

    it('uses Layout options aria-label', () => {
      expect(SRC).toContain('aria-label="Layout options"');
    });
  });
});

describe('DashboardLayoutEngine (regression)', () => {
  describe('locked widget move clamping', () => {
    it('has clampMoveAgainstLocked method', () => {
      expect(ENGINE_SRC).toContain('clampMoveAgainstLocked');
    });

    it('calls clampMoveAgainstLocked in handleWidgetMove', () => {
      expect(ENGINE_SRC).toContain('this.clampMoveAgainstLocked(id,');
    });

    it('has clampAgainstLocked method for resize clamping', () => {
      expect(ENGINE_SRC).toContain('clampAgainstLocked');
    });
  });

  describe('save as default layout', () => {
    it('has saveAsDefaultLayout method', () => {
      expect(ENGINE_SRC).toContain('saveAsDefaultLayout');
    });

    it('has desktopDefaultsKey getter', () => {
      expect(ENGINE_SRC).toContain('desktopDefaultsKey');
    });

    it('has canvasDefaultsKey getter', () => {
      expect(ENGINE_SRC).toContain('canvasDefaultsKey');
    });

    it('resetToDefaults checks for custom saved defaults before fallback', () => {
      expect(ENGINE_SRC).toContain('_loadCustomCanvasDefaults');
      expect(ENGINE_SRC).toContain('_loadCustomDesktopDefaults');
    });
  });
});
