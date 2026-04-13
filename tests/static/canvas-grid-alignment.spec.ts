/**
 * Ensures all canvas default tops and heights are multiples of GAP_PX (16px),
 * and all canvas default lefts and widths produce a 1280px grid.
 *
 * Scans per-persona seed files in src/app/data/layout-seeds/.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(__dir, '../../src/app/data/layout-seeds');
const GAP = 16;
const CANVAS_WIDTH = 1280;

const seedFiles = readdirSync(SEED_DIR)
  .filter(f => f.endsWith('.layout.ts') && f !== 'layout-seed.types.ts')
  .sort();

function extractMapValues(src: string, mapName: string): Record<string, number> {
  const regex = new RegExp(`${mapName}:\\s*\\{([^}]+)\\}`, 's');
  const match = src.match(regex);
  if (!match) return {};
  const result: Record<string, number> = {};
  const kvPattern = /(\w+)\s*:\s*(-?\d+)/g;
  let kv;
  while ((kv = kvPattern.exec(match[1])) !== null) {
    result[kv[1]] = parseInt(kv[2], 10);
  }
  return result;
}

describe('Canvas grid alignment (all seed files)', () => {
  for (const file of seedFiles) {
    const src = readFileSync(resolve(SEED_DIR, file), 'utf-8');
    const tops = extractMapValues(src, 'canvasDefaultTops');
    const heights = extractMapValues(src, 'canvasDefaultHeights');

    if (Object.keys(tops).length === 0 && Object.keys(heights).length === 0) continue;

    describe(file, () => {
      for (const [widget, value] of Object.entries(tops)) {
        it(`canvasDefaultTops.${widget} (${value}) is a multiple of ${GAP}`, () => {
          expect(value % GAP).toBe(0);
        });
      }

      for (const [widget, value] of Object.entries(heights)) {
        it(`canvasDefaultHeights.${widget} (${value}) is a multiple of ${GAP}`, () => {
          expect(value % GAP).toBe(0);
        });
      }
    });
  }
});

describe('Canvas pixel values fill 1280px grid (all seed files)', () => {
  for (const file of seedFiles) {
    const src = readFileSync(resolve(SEED_DIR, file), 'utf-8');
    const lefts = extractMapValues(src, 'canvasDefaultLefts');
    const widths = extractMapValues(src, 'canvasDefaultPixelWidths');

    if (Object.keys(lefts).length === 0 || Object.keys(widths).length === 0) continue;

    describe(file, () => {
      const widgets = Object.keys(lefts);

      for (const widget of widgets) {
        const widthVal = widths[widget];
        if (widthVal !== undefined) {
          it(`${widget}: width (${widthVal}) > 0`, () => {
            expect(widthVal).toBeGreaterThan(0);
          });
        }
      }

      it('at least one widget reaches or exceeds the right edge at 1280px', () => {
        let maxRight = 0;
        for (const widget of widgets) {
          const l = lefts[widget] ?? 0;
          const w = widths[widget] ?? 0;
          maxRight = Math.max(maxRight, l + w);
        }
        expect(maxRight).toBeGreaterThanOrEqual(CANVAS_WIDTH);
      });

      it('full-width header widget is exactly 1280px', () => {
        const headerWidget = widgets.find(w => w.toLowerCase().includes('header'));
        if (headerWidget) {
          expect(lefts[headerWidget]).toBe(0);
          expect(widths[headerWidget]).toBe(CANVAS_WIDTH);
        }
      });
    });
  }
});
