/**
 * Ensures all canvas default tops and heights are multiples of GAP_PX (16px).
 * This prevents widget edges from landing off-grid in canvas mode.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const GAP = 16;

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
