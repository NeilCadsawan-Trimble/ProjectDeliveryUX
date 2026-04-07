import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/projects-page/projects-page.component.ts'),
  'utf-8',
) + '\n' + readFileSync(
  resolve(__dir, '../../src/app/pages/projects-page/projects-page.component.html'),
  'utf-8',
);
const UTILS_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/projects-page/projects-page-utils.ts'),
  'utf-8',
);

describe('ProjectsPageComponent (template regression)', () => {
  describe('desktop padding', () => {
    it('has px-4 on the root content wrapper', () => {
      expect(SRC).toContain("'px-4 py-4 md:py-6 max-w-screen-xl mx-auto'");
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

  describe('DashboardPageBase integration', () => {
    it('extends DashboardPageBase for shared engine wiring', () => {
      expect(SRC).toContain('extends DashboardPageBase');
    });

    it('has widget-lock-toggle available on all modes (desktop, mobile, canvas)', () => {
      expect(SRC).toContain('<widget-lock-toggle');
      expect(SRC).not.toContain('@if (isMobile() || isCanvasMode())\n');
    });

    it('does NOT clear widget locks on desktop init (locks persist)', () => {
      expect(SRC).not.toContain('clearAllWidgetLocks()');
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain cleanupOverlaps', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });

  describe('dynamic urgent need rewriting (regression guard)', () => {
    it('rewriteDynamicNeeds handles budget category', () => {
      expect(UTILS_SRC).toContain("n.category === 'budget'");
    });

    it('rewriteDynamicNeeds handles schedule overdue category', () => {
      expect(UTILS_SRC).toContain("n.category === 'schedule'");
    });

    it('rewriteDynamicNeeds handles change-order category', () => {
      expect(UTILS_SRC).toContain("n.category === 'change-order'");
    });

    it('component delegates to rewriteDynamicNeeds from utils', () => {
      expect(SRC).toContain('rewriteDynamicNeeds');
      expect(SRC).toContain("from './projects-page-utils'");
    });

    it('sortProjectsByUrgency uses criticalCount and warningCount', () => {
      expect(UTILS_SRC).toContain('criticalCount');
      expect(UTILS_SRC).toContain('warningCount');
    });

    it('component delegates to sortProjectsByUrgency from utils', () => {
      expect(SRC).toContain('sortProjectsByUrgency');
    });
  });

  describe('persona routing', () => {
    it('accesses personaService (inherited from DashboardPageBase)', () => {
      expect(SRC).toContain('personaService');
    });

    it('has pp getter for persona prefix', () => {
      expect(SRC).toContain('get pp()');
    });

    it('does not contain hardcoded /project or /financials route', () => {
      const hardcoded = SRC.match(/navigate\(\['\/(project|financials)'/g);
      expect(hardcoded).toBeNull();
    });

    it('sessionStorage keys use personaKey helper', () => {
      expect(SRC).toContain('personaKey(');
    });

    it('layout config call passes persona slug function', () => {
      expect(SRC).toContain('activePersonaSlug()');
    });
  });
});
