import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/layout/dashboard-shell.component.ts'),
  'utf-8',
);

describe('DashboardShellComponent (regression)', () => {
  describe('hamburger button', () => {
    it('has attachHamburgerListener method', () => {
      expect(SRC).toContain('attachHamburgerListener');
    });

    it('queries for button[aria-label="Main menu"]', () => {
      expect(SRC).toContain('button[aria-label="Main menu"]');
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
  });

  describe('navExpanded signal', () => {
    it('declares navExpanded signal', () => {
      expect(SRC).toContain('navExpanded = signal');
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
  });
});
