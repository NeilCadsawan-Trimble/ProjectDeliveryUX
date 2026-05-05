import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const STYLES = readFileSync(
  resolve(__dir, '../../src/styles.css'),
  'utf-8',
);

/**
 * Regression: holding spacebar in canvas mode must disable interactions with
 * widgets so the user can pan without accidentally triggering them. Per-widget
 * containers use Tailwind's `pointer-events-auto` utility, so the parent
 * `.canvas-content { pointer-events: none }` rule is not enough on its own:
 * the descendant `*` selector + !important is required to override widget-level
 * pointer-events: auto. If a future style cleanup drops the `*` selector,
 * widget clicks/hover silently return while panning.
 */
describe('canvas spacebar pointer-events block (regression)', () => {
  it('blocks pointer events on every descendant of .canvas-content while pan-ready', () => {
    expect(STYLES).toMatch(/\.canvas-pan-ready\s+\.canvas-content\s*\*/);
  });

  it('blocks pointer events on every descendant of .canvas-content while panning', () => {
    expect(STYLES).toMatch(/\.canvas-panning\s+\.canvas-content\s*\*/);
  });

  it('uses !important so per-widget pointer-events-auto cannot win', () => {
    const block = STYLES.match(
      /\.canvas-pan-ready\s+\.canvas-content,\s*\.canvas-pan-ready\s+\.canvas-content\s*\*,\s*\.canvas-panning\s+\.canvas-content,\s*\.canvas-panning\s+\.canvas-content\s*\*\s*\{[^}]*\}/,
    );
    expect(block, 'combined pan-ready/panning pointer-events block missing').not.toBeNull();
    expect(block![0]).toMatch(/pointer-events:\s*none\s*!important/);
  });

  it('disables text selection on widgets while actively panning', () => {
    const matches = [
      ...STYLES.matchAll(
        /\.canvas-panning\s+\.canvas-content,\s*\.canvas-panning\s+\.canvas-content\s*\*\s*\{([^}]*)\}/g,
      ),
    ];
    const userSelectBlock = matches.find(m => /user-select:\s*none\s*!important/.test(m[1]));
    expect(userSelectBlock, 'panning user-select block missing').toBeDefined();
  });
});
