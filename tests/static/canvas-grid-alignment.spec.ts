/**
 * Ensures all canvas default tops and heights are multiples of GAP_PX (16px),
 * and all canvas default lefts and widths produce a 1280px grid aligned to
 * CANVAS_STEP (81px). This prevents widget edges from landing off-grid and
 * prevents stale pixel values when the canvas container width changes.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const GAP = 16;
const CANVAS_STEP = 81;
const CANVAS_WIDTH = 1280;

const PAGE_FILES = [
  'src/app/pages/home-page/home-page.component.ts',
  'src/app/pages/financials-page/financials-page.component.ts',
  'src/app/pages/projects-page/projects-page-layout.config.ts',
  'src/app/pages/project-dashboard/project-dashboard.component.ts',
];

function extractObjectLiteral(src: string, key: string): Record<string, string> | null {
  const pattern = new RegExp(`${key}\\s*[:=]\\s*\\{([^}]+)\\}`, 'g');
  const match = pattern.exec(src);
  if (!match) return null;
  const inner = match[1];
  const entries: Record<string, string> = {};
  const kvPattern = /(\w+)\s*:\s*([^,}]+)/g;
  let kv;
  while ((kv = kvPattern.exec(inner)) !== null) {
    entries[kv[1].trim()] = kv[2].trim();
  }
  return entries;
}

function resolveConstants(src: string, expr: string): number | null {
  const cleaned = expr.replace(/\s/g, '');
  if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);

  const constPattern = /(?:static\s+readonly|const)\s+(\w+)\s*=\s*(\d+)\s*;/g;
  const constants: Record<string, number> = {};
  let m;
  while ((m = constPattern.exec(src)) !== null) {
    constants[m[1]] = parseInt(m[2], 10);
  }

  const refPattern = /(\w+)\.GAP_PX/;
  const gapRef = refPattern.exec(src);
  if (gapRef) constants['GAP_PX'] = GAP;

  let result = cleaned;
  const identifiers = result.match(/[\w.]+/g) || [];
  for (const id of identifiers) {
    const parts = id.split('.');
    const name = parts[parts.length - 1];
    if (constants[name] !== undefined) {
      result = result.replace(id, String(constants[name]));
    }
  }

  try {
    const val = Function(`"use strict"; return (${result})`)();
    return typeof val === 'number' ? val : null;
  } catch {
    return null;
  }
}

function resolveAllConstants(src: string): Record<string, number> {
  const constants: Record<string, number> = {};
  const constPattern = /(?:static\s+readonly|const)\s+(\w+)\s*=\s*([^;]+);/g;
  let m;
  while ((m = constPattern.exec(src)) !== null) {
    const name = m[1];
    const expr = m[2].trim();
    if (/^\d+$/.test(expr)) {
      constants[name] = parseInt(expr, 10);
    }
  }
  constants['GAP_PX'] = GAP;
  constants['CANVAS_STEP'] = CANVAS_STEP;

  let changed = true;
  let passes = 0;
  while (changed && passes < 10) {
    changed = false;
    passes++;
    const src2 = src;
    const p2 = /(?:static\s+readonly|const)\s+(\w+)\s*=\s*([^;]+);/g;
    let m2;
    while ((m2 = p2.exec(src2)) !== null) {
      const name = m2[1];
      if (constants[name] !== undefined) continue;
      let expr = m2[2].trim();
      const ids = expr.match(/[\w.]+/g) || [];
      let allResolved = true;
      for (const id of ids) {
        const parts = id.split('.');
        const leaf = parts[parts.length - 1];
        if (constants[leaf] !== undefined) {
          expr = expr.replace(id, String(constants[leaf]));
        } else if (!/^\d+$/.test(id)) {
          allResolved = false;
        }
      }
      if (allResolved) {
        try {
          const val = Function(`"use strict"; return (${expr})`)();
          if (typeof val === 'number' && !isNaN(val)) {
            constants[name] = val;
            changed = true;
          }
        } catch { /* skip */ }
      }
    }
  }
  return constants;
}

function resolveExpr(constants: Record<string, number>, expr: string): number | null {
  const cleaned = expr.replace(/\s/g, '');
  if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);

  let result = cleaned;
  const ids = result.match(/[\w.]+/g) || [];
  for (const id of ids) {
    const parts = id.split('.');
    const leaf = parts[parts.length - 1];
    if (constants[leaf] !== undefined) {
      result = result.replace(id, String(constants[leaf]));
    }
  }

  try {
    const val = Function(`"use strict"; return (${result})`)();
    return typeof val === 'number' && !isNaN(val) ? val : null;
  } catch {
    return null;
  }
}

describe('Canvas grid alignment (all pages)', () => {
  for (const file of PAGE_FILES) {
    const src = readFileSync(resolve(__dir, '../../', file), 'utf-8');
    const shortName = file.split('/').pop()!.replace('.component.ts', '');

    describe(shortName, () => {
      const tops = extractObjectLiteral(src, 'canvasDefaultTops');
      const heights = extractObjectLiteral(src, 'canvasDefaultHeights');

      if (tops) {
        for (const [widget, expr] of Object.entries(tops)) {
          it(`canvasDefaultTops.${widget} is a multiple of ${GAP}`, () => {
            const value = resolveConstants(src, expr);
            if (value !== null) {
              expect(value % GAP).toBe(0);
            }
          });
        }
      }

      if (heights) {
        for (const [widget, expr] of Object.entries(heights)) {
          it(`canvasDefaultHeights.${widget} is a multiple of ${GAP}`, () => {
            const value = resolveConstants(src, expr);
            if (value !== null) {
              expect(value % GAP).toBe(0);
            }
          });
        }
      }
    });
  }
});

describe('Canvas default pixel values fill 1280px grid (all pages)', () => {
  for (const file of PAGE_FILES) {
    const src = readFileSync(resolve(__dir, '../../', file), 'utf-8');
    const shortName = file.split('/').pop()!.replace('.component.ts', '').replace('.config', '');
    const constants = resolveAllConstants(src);

    describe(shortName, () => {
      const lefts = extractObjectLiteral(src, 'canvasDefaultLefts');
      const widths = extractObjectLiteral(src, 'canvasDefaultPixelWidths');

      if (lefts && widths) {
        const widgets = Object.keys(lefts);

        for (const widget of widgets) {
          const leftExpr = lefts[widget];
          const widthExpr = widths[widget];
          if (!leftExpr || !widthExpr) continue;
          const leftVal = resolveExpr(constants, leftExpr);
          const widthVal = resolveExpr(constants, widthExpr);

          if (leftVal !== null && widthVal !== null) {
            it(`${widget}: left (${leftVal}) >= 0`, () => {
              expect(leftVal).toBeGreaterThanOrEqual(0);
            });

            it(`${widget}: width (${widthVal}) > 0`, () => {
              expect(widthVal).toBeGreaterThan(0);
            });
          }
        }

        it('at least one widget reaches or exceeds the right edge at 1280px', () => {
          let maxRight = 0;
          for (const widget of widgets) {
            const leftVal = resolveExpr(constants, lefts[widget]);
            const widthVal = resolveExpr(constants, widths[widget]);
            if (leftVal !== null && widthVal !== null) {
              maxRight = Math.max(maxRight, leftVal + widthVal);
            }
          }
          expect(maxRight).toBeGreaterThanOrEqual(CANVAS_WIDTH);
        });

        it('full-width header widget is exactly 1280px', () => {
          const headerWidget = widgets.find(w => w.toLowerCase().includes('header'));
          if (headerWidget) {
            const leftVal = resolveExpr(constants, lefts[headerWidget]);
            const widthVal = resolveExpr(constants, widths[headerWidget]);
            expect(leftVal).toBe(0);
            expect(widthVal).toBe(CANVAS_WIDTH);
          }
        });
      }
    });
  }
});
