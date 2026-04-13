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
  it('shares ViewportBreakpointsService with the shell for consistent breakpoints', () => {
    expect(SRC).toContain('inject(ViewportBreakpointsService)');
  });

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

    it('wraps hero in Figma 2:36076 welcome banner (title row + Create md pill)', () => {
      expect(HERO).toContain('home-figma-hero-card');
      expect(HERO).toContain('text-3xl');
      expect(HERO).toContain('font-semibold');
      expect(HERO).toContain('leading-8');
      expect(HERO).toContain('size="md"');
      expect(HERO).toContain('className="!rounded-full"');
      expect(HERO).not.toContain('formattedDate');
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
    it('uses Figma-aligned elevated shells on the three home widgets (shadow, no border)', () => {
      const n = (SRC.match(/class="home-figma-widget-shell /g) ?? []).length;
      expect(n).toBe(3);
      expect(SRC).toContain('home-figma-widget-shell--selected');
      expect(SRC).not.toContain('[class.border-default]="selectedWidgetId()');
    });

    it('registers homeAllEstimates, homeTasks, and homeCalendar on the layout engine', () => {
      expect(SRC).toContain("'homeAllEstimates'");
      expect(SRC).toContain("'homeTasks'");
      expect(SRC).toContain("'homeCalendar'");
    });

    it('has task schedule tab handler for mobile height updates', () => {
      expect(SRC).toContain('onTaskScheduleTabSelect');
    });

    it('uses Figma-style pill segmented control for schedule tabs (not modus-button-group)', () => {
      expect(SRC).toContain('task-schedule-segmented');
      expect(SRC).toContain('role="tablist"');
      expect(SRC).not.toContain('<modus-button-group');
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
      const snapshotIdx = SRC.indexOf('Performance Snapshot');
      expect(guardIdx).toBeGreaterThanOrEqual(0);
      expect(snapshotIdx).toBeGreaterThan(guardIdx);
      expect(SRC).toContain('bullseye');
      expect(SRC).toContain('text-xs font-semibold text-primary">Performance Snapshot<');
    });

    it('uses a desktop pixel breakpoint for wide estimate layout', () => {
      expect(SRC).toContain('HOME_ESTIMATES_WIDE_BREAKPOINT_PX');
      expect(SRC).toContain('isHomeAllEstimatesWideLayout');
      expect(SRC).toContain("widgetPixelWidths()['homeAllEstimates']");
      expect(SRC).toContain('home-all-estimates-cq');
      expect(SRC).toContain('home-all-estimates-progress-row');
    });

    it('uses Figma-style estimate list wells, expanded snapshot, borders (2:36091 / 2:23632)', () => {
      expect(SRC).toContain('home-estimate-list-icon-well');
      expect(SRC).toContain('estimateListIconWellClass');
      expect(SRC).toContain('estimateListIconGlyphClass');
      expect(SRC).toContain('estimateMembersRowIcon');
      expect(SRC).toContain('home-estimate-meta-icon');
      expect(SRC).toContain('[class.border-thick-primary]');
      expect(SRC).toContain('border-thick-primary');
      expect(SRC).toContain('home-estimate-insight-row--positive');
      expect(SRC).toContain('chevron_right');
    });
  });
});
