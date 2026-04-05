import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/financials-page/financials-page.component.ts'),
  'utf-8',
);
const DASHBOARD_PAGE_BASE = readFileSync(
  resolve(__dir, '../../src/app/shell/services/dashboard-page-base.ts'),
  'utf-8',
);

describe('FinancialsPageComponent (template regression)', () => {
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
});
