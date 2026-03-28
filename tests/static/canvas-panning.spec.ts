import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/canvas-panning.ts'),
  'utf-8',
);

describe('CanvasPanning (regression)', () => {
  describe('_isInsideWidget interactive element detection', () => {
    it('checks data-widget-id attribute', () => {
      expect(SRC).toContain("el.hasAttribute('data-widget-id')");
    });

    it('checks data-tile-id attribute for tile elements', () => {
      expect(SRC).toContain("el.hasAttribute('data-tile-id')");
    });

    it('checks data-no-pan escape hatch attribute', () => {
      expect(SRC).toContain("el.hasAttribute('data-no-pan')");
    });

    it('checks canvas-navbar class', () => {
      expect(SRC).toContain("el.classList.contains('canvas-navbar')");
    });

    it('checks canvas-side-nav class', () => {
      expect(SRC).toContain("el.classList.contains('canvas-side-nav')");
    });

    it('checks role="button" for subnav and interactive elements', () => {
      expect(SRC).toContain("el.getAttribute('role') === 'button'");
    });

    it('checks role="option" for dropdown items', () => {
      expect(SRC).toContain("el.getAttribute('role') === 'option'");
    });

    it('checks native interactive tags (button, a, input, select, textarea)', () => {
      expect(SRC).toContain("tag === 'button'");
      expect(SRC).toContain("tag === 'a'");
      expect(SRC).toContain("tag === 'input'");
      expect(SRC).toContain("tag === 'select'");
      expect(SRC).toContain("tag === 'textarea'");
    });
  });

  describe('onPanMouseDown guards', () => {
    it('calls _isInsideWidget before starting pan', () => {
      expect(SRC).toContain('this._isInsideWidget(event.target');
    });

    it('returns early when _isInsideWidget is true', () => {
      const match = SRC.match(
        /if\s*\(this\._isInsideWidget\(event\.target[^)]*\)\)\s*return/,
      );
      expect(match).not.toBeNull();
    });
  });
});
