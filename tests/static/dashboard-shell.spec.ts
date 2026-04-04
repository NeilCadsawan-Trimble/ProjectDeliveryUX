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
    it('does not reattach DOM hamburger listeners', () => {
      expect(SRC).not.toContain('attachHamburgerListener');
      expect(SRC).not.toContain('_reattachHamburgerEffect');
    });

    it('hamburger has Main menu aria-label', () => {
      expect(SRC).toContain('aria-label="Main menu"');
    });

    it('toggles navExpanded on hamburger click', () => {
      expect(SRC).toContain('navExpanded.set(!navExpanded())');
    });

    it('has onMainMenuToggle method', () => {
      expect(SRC).toContain('onMainMenuToggle');
    });

    it('normalizes mainMenuOpenChange via coerceMainMenuOpenPayload', () => {
      expect(SRC).toContain('coerceMainMenuOpenPayload');
    });

    it('onMainMenuToggle sets navExpanded from coerced boolean', () => {
      expect(SRC).toContain('navExpanded.set(next)');
    });
  });

  describe('navExpanded signal', () => {
    it('declares navExpanded signal', () => {
      expect(SRC).toContain('navExpanded = signal');
    });
  });

  describe('main content vs fixed side rail', () => {
    it('always offsets main for the collapsed rail width when not mobile', () => {
      expect(SRC).toContain('[class.pl-14]="!isMobile()"');
    });

    it('does NOT push content when sidenav expands (overlay only)', () => {
      expect(SRC).not.toContain('pl-60');
      expect(SRC).not.toContain('md:pl-14');
    });
  });

  describe('app-navbar layout', () => {
    it('marks hamburger for side-rail alignment CSS', () => {
      expect(SRC).toContain('shell-navbar-hamburger');
    });

    it('uses div.app-navbar instead of modus-navbar', () => {
      expect(SRC).toContain('class="app-navbar"');
      expect(SRC).toContain('class="app-navbar-start"');
      expect(SRC).toContain('class="app-navbar-end"');
      expect(SRC).not.toContain('modus-wc-navbar-host-fallback');
      expect(SRC).not.toContain('navbarNativeRendered');
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
