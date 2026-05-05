/**
 * Regression tests for HomePageComponent template.
 *
 * Guards against recurring regressions:
 * - Desktop padding (px-4) must not be overridden by md:px-0
 * - Right resize handles must be present (left removed intentionally)
 * - Compact mode signals must exist
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/home-page/home-page.component.ts'),
  'utf-8',
);
const DASHBOARD_PAGE_BASE = readFileSync(
  resolve(__dir, '../../src/app/shell/services/dashboard-page-base.ts'),
  'utf-8',
);

describe('HomePageComponent (template regression)', () => {
  describe('desktop padding', () => {
    it('has px-4 on the root content wrapper', () => {
      expect(SRC).toContain('px-4 py-4 md:py-6 max-w-screen-xl mx-auto');
    });

    it('does NOT have md:px-0 which removes desktop padding', () => {
      expect(SRC).not.toContain('md:px-0');
    });
  });

  describe('resize handles', () => {
    it('has widget-resize-handle components', () => {
      expect(SRC).toContain('<widget-resize-handle');
    });

    it('does not have left position resize handles', () => {
      expect(SRC).not.toContain('position="left"');
    });
  });

  describe('compact mode', () => {
    it('has isRfiCompact computed signal', () => {
      expect(SRC).toContain('isRfiCompact');
    });

    it('has isSubmittalCompact computed signal', () => {
      expect(SRC).toContain('isSubmittalCompact');
    });

    it('has isTimeOffCompact computed signal', () => {
      expect(SRC).toContain('isTimeOffCompact');
    });
  });

  describe('reset effect', () => {
    it('extends DashboardPageBase which resets widgets on canvas reset tick', () => {
      expect(SRC).toContain('extends DashboardPageBase');
      expect(DASHBOARD_PAGE_BASE).toContain('this.engine.resetToDefaults()');
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain cleanupOverlaps', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });

  describe('widget-detail-transition guard', () => {
    it('uses shouldTransition() for all widget-detail-transition bindings', () => {
      const matches = SRC.match(/widget-detail-transition/g) ?? [];
      expect(matches.length).toBeGreaterThan(0);
      const rawConditionPattern = /hasCanvasDetails\(\)\s*&&[^']*widget-detail-transition/;
      expect(SRC).not.toMatch(rawConditionPattern);
    });

    it('has shouldTransition method delegating to _detailMgr', () => {
      expect(SRC).toContain('shouldTransition(');
      expect(SRC).toContain('_detailMgr.shouldTransition(');
    });
  });

  describe('persona layout isolation (DashboardPageBase)', () => {
    it('base class injects PersonaService', () => {
      expect(DASHBOARD_PAGE_BASE).toContain('inject(PersonaService)');
    });

    it('base class has _personaSwitchEffect that calls reinitLayout', () => {
      expect(DASHBOARD_PAGE_BASE).toContain('_personaSwitchEffect');
      expect(DASHBOARD_PAGE_BASE).toContain('reinitLayout');
    });

    it('base class tracks previous persona slug and keys', () => {
      expect(DASHBOARD_PAGE_BASE).toContain('_prevPersonaSlug');
      expect(DASHBOARD_PAGE_BASE).toContain('_prevLayoutKey');
      expect(DASHBOARD_PAGE_BASE).toContain('_prevCanvasKey');
    });

    it('base class re-applies header lock after persona switch', () => {
      expect(DASHBOARD_PAGE_BASE).toContain('applyInitialHeaderLock()');
    });
  });

  describe('persona routing', () => {
    it('accesses personaService (inherited from DashboardPageBase)', () => {
      expect(SRC).toContain('personaService');
    });

    it('has dynamic welcome greeting (not hardcoded Frank)', () => {
      expect(SRC).toContain('personaFirstName()');
      expect(SRC).not.toContain("'Welcome back, Frank'");
      expect(SRC).not.toContain('"Welcome back, Frank"');
    });

    it('uses personaPrefix for navigation', () => {
      expect(SRC).toContain('personaPrefix()');
    });

    it('does not contain hardcoded root route navigation', () => {
      const hardcoded = SRC.match(/navigate\(\['\/(projects|financials|project)'/g);
      expect(hardcoded).toBeNull();
    });

    it('storage keys include persona slug', () => {
      expect(SRC).toContain('activePersonaSlug()');
      expect(SRC).toMatch(/layoutStorageKey:\s*\(\)/);
      expect(SRC).toMatch(/canvasStorageKey:\s*\(\)/);
    });
  });

  // The Risks & Urgent Needs widget on the home dashboard surfaces both
  // financialsRoute (`/financials/job-costs/<slug>`) and an in-project
  // deep link (`/project/<slug>?page=financials&subpage=...`) for each item.
  // navigateToUrgentNeed must respect persona access:
  //   - Bert  -- no /financials nav, must NOT route there.
  //   - Kelly -- no /project nav, must NOT route there.
  describe('persona-aware urgent needs navigation', () => {
    const navMethodMatch = SRC.match(/navigateToUrgentNeed\([^)]*\)\s*:\s*void\s*\{[\s\S]*?\n  \}/);

    it('navigateToUrgentNeed method exists', () => {
      expect(navMethodMatch, 'navigateToUrgentNeed method should be present').not.toBeNull();
    });

    it('reads the active persona slug', () => {
      const body = navMethodMatch![0];
      expect(body).toContain('activePersonaSlug()');
    });

    it('skips financialsRoute for personas without financials access (Bert)', () => {
      const body = navMethodMatch![0];
      expect(body).toMatch(/['"]bert['"]/);
      expect(body).toMatch(/hasFinancials/);
    });

    it('skips in-project navigation for personas without projects access (Kelly)', () => {
      const body = navMethodMatch![0];
      expect(body).toMatch(/['"]kelly['"]/);
      expect(body).toMatch(/hasProjects/);
    });

    it('gates financialsRoute branch on hasFinancials', () => {
      const body = navMethodMatch![0];
      expect(body).toMatch(/item\.financialsRoute\s*&&\s*hasFinancials/);
    });

    it('gates the project-route branch on hasProjects', () => {
      const body = navMethodMatch![0];
      expect(body).toMatch(/if\s*\(\s*hasProjects\s*\)/);
    });

    it('normalises change-orders subpage to project nav value', () => {
      const body = navMethodMatch![0];
      expect(body).toContain("'change-orders'");
      expect(body).toContain("'change-order-requests'");
    });
  });
});
