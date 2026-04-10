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
    it('always offsets main for the collapsed rail width in desktop mode', () => {
      expect(SRC).toContain('md:pl-14');
    });

    it('does NOT push content when sidenav expands (overlay only)', () => {
      expect(SRC).not.toContain('pl-60');
    });
  });

  describe('router-outlet in both branches (canvas mode regression)', () => {
    it('has exactly TWO <router-outlet /> in the template (one per branch)', () => {
      const matches = SRC.match(/<router-outlet\s*\/>/g) || [];
      expect(matches.length).toBe(2);
    });

    it('does NOT use ng-content (shell owns router-outlet directly)', () => {
      expect(SRC).not.toContain('<ng-content');
    });

    it('canvas branch has canvas-content wrapping router-outlet', () => {
      expect(SRC).toContain('class="canvas-content"');
    });

    it('imports RouterOutlet', () => {
      expect(SRC).toContain('RouterOutlet');
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

  describe('weather service initialization', () => {
    it('imports WeatherService', () => {
      expect(SRC).toContain('WeatherService');
    });

    it('calls weatherService.initialize()', () => {
      expect(SRC).toContain('weatherService.initialize()');
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

  describe('Load Default Layout', () => {
    it('has Load Default Layout menu item', () => {
      expect(SRC).toContain('Load Default Layout');
    });

    it('calls canvasResetService.triggerLoadDefaults', () => {
      expect(SRC).toContain('triggerLoadDefaults');
    });

    it('has refresh icon for load defaults option', () => {
      expect(SRC).toContain('>refresh<');
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

  describe('persona routing', () => {
    it('injects PersonaService', () => {
      expect(SRC).toContain('inject(PersonaService)');
    });

    it('has activePersonaSlug input', () => {
      expect(SRC).toMatch(/activePersonaSlug\s*=\s*input/);
    });

    it('has routeSuffix computed signal for stripping persona prefix', () => {
      expect(SRC).toContain('routeSuffix');
    });

    it('has onPersonaSwitch method', () => {
      expect(SRC).toContain('onPersonaSwitch(');
    });

    it('calls store.switchToPersona in onPersonaSwitch', () => {
      expect(SRC).toContain('switchToPersona(');
    });

    it('navigateHome uses persona prefix', () => {
      expect(SRC).toContain('activePersonaSlug()');
      expect(SRC).not.toMatch(/navigate\(\['\/']\)/);
    });

    it('does not contain hardcoded /projects or /financials route', () => {
      const hardcodedProjects = SRC.match(/navigate\(\['\/(projects|financials)'\]/g);
      expect(hardcodedProjects).toBeNull();
    });

    it('template passes activePersonaSlug to user-menu', () => {
      expect(SRC).toContain('[activePersonaSlug]');
    });

    it('template binds personaSwitch output from user-menu', () => {
      expect(SRC).toContain('(personaSwitch)');
    });
  });
});
