/**
 * Regression tests for HomePageComponent template.
 *
 * Guards against recurring regressions:
 * - Desktop padding (px-4) must not be overridden by md:px-0
 * - Both left and right resize handles must be present
 * - Bidding dashboard widgets and task filter handlers must exist
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
const HERO = readFileSync(
  resolve(__dir, '../../src/app/pages/home-page/home-page-hero.component.ts'),
  'utf-8',
);

describe('HomePageComponent (template regression)', () => {
  describe('desktop padding', () => {
    it('has px-4 on the root content wrapper', () => {
      expect(SRC).toContain('class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto"');
    });

    it('does NOT have md:px-0 which removes desktop padding', () => {
      expect(SRC).not.toContain('md:px-0');
    });
  });

  describe('home header', () => {
    it('uses isolated hero component with no bidding-phase subtitle', () => {
      expect(SRC).toContain('<app-home-page-hero');
      expect(SRC).not.toContain('meetings in one place');
      expect(SRC).not.toContain('bidding phase</span>');
      expect(HERO).not.toContain('meetings in one place');
      expect(HERO).not.toContain('text-foreground-80 mt-2');
      expect(HERO).not.toContain('bidding phase');
    });
  });

  describe('resize handles', () => {
    it('has left position resize handles', () => {
      expect(SRC).toContain('position="left"');
    });

    it('has widget-resize-handle components', () => {
      expect(SRC).toContain('<widget-resize-handle');
    });

    it('passes edge parameter for left resize', () => {
      expect(SRC).toContain("'left')");
    });
  });

  describe('bidding dashboard widgets', () => {
    it('registers homeAllEstimates, homeTasks, and homeCalendar on the layout engine', () => {
      expect(SRC).toContain("'homeAllEstimates'");
      expect(SRC).toContain("'homeTasks'");
      expect(SRC).toContain("'homeCalendar'");
    });

    it('has task schedule tab handler for mobile height updates', () => {
      expect(SRC).toContain('onTaskScheduleTabSelect');
    });
  });

  describe('reset effect', () => {
    it('calls resetToDefaults', () => {
      expect(SRC).toContain('resetToDefaults()');
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain cleanupOverlaps', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });

  describe('All Estimates expanded content', () => {
    it('renders Performance Snapshot only when showHomeEstimateCardDetails is true', () => {
      const guardIdx = SRC.indexOf('@if (showHomeEstimateCardDetails(card.id))');
      const snapshotIdx = SRC.indexOf('text-primary">Performance Snapshot<');
      expect(guardIdx).toBeGreaterThanOrEqual(0);
      expect(snapshotIdx).toBeGreaterThan(guardIdx);
    });

    it('uses a desktop pixel breakpoint for wide estimate layout', () => {
      expect(SRC).toContain('HOME_ESTIMATES_WIDE_BREAKPOINT_PX');
      expect(SRC).toContain('isHomeAllEstimatesWideLayout');
      expect(SRC).toContain("widgetPixelWidths()['homeAllEstimates']");
      expect(SRC).toContain('home-all-estimates-cq');
      expect(SRC).toContain('home-all-estimates-progress-row');
    });
  });
});
