/**
 * Regression tests for HomePageComponent template.
 *
 * Guards against recurring regressions:
 * - Desktop padding (px-4) must not be overridden by md:px-0
 * - Both left and right resize handles must be present
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

describe('HomePageComponent (template regression)', () => {
  describe('desktop padding', () => {
    it('has px-4 on the root content wrapper', () => {
      expect(SRC).toContain('class="px-4 py-4 md:py-6 max-w-screen-xl mx-auto"');
    });

    it('does NOT have md:px-0 which removes desktop padding', () => {
      expect(SRC).not.toContain('md:px-0');
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
    it('calls resetToDefaults', () => {
      expect(SRC).toContain('resetToDefaults()');
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain cleanupOverlaps', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });
});
