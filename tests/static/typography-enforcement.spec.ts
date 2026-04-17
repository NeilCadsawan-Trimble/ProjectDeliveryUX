import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dir, '../../src/app');

function collectFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'demos' || entry === 'dev' || entry === 'dev-pages' || entry === 'components') continue;
      results.push(...collectFiles(full, ext));
    } else if (entry.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

function extractTemplate(source: string): string | null {
  const idx = source.indexOf('template: `');
  if (idx === -1) return null;
  const start = idx + 'template: `'.length;
  let depth = 1;
  let i = start;
  while (i < source.length && depth > 0) {
    if (source[i] === '`' && source[i - 1] !== '\\') depth--;
    else if (source[i] === '`') depth++;
    i++;
  }
  return source.slice(start, i - 1);
}

const TEXT_SIZE_CLASSES = ['text-2xs', 'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];
const FONT_WEIGHT_CLASSES = ['font-medium', 'font-semibold', 'font-bold'];

const TEXT_SIZE_PATTERN = new RegExp(`\\b(${TEXT_SIZE_CLASSES.join('|')})\\b`);
const FONT_WEIGHT_PATTERN = new RegExp(`\\b(${FONT_WEIGHT_CLASSES.join('|')})\\b`);

function findViolations(template: string): string[] {
  const violations: string[] = [];
  const lines = template.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('modus-icons')) continue;
    if (/<input\b/.test(line)) continue;
    if (/<textarea\b/.test(line)) continue;
    if (/<code\b/.test(line)) continue;
    if (/<a\b/.test(line) && !line.includes('<app-')) continue;
    if (/className=/.test(line) || /\[className\]/.test(line)) continue;
    if (/class="modus-icons/.test(line)) continue;
    if (/<modus-typography/.test(line)) continue;
    if (/subtextClass/.test(line) || /statusClass/.test(line)) continue;
    if (/\[class\]="/.test(line) && !line.includes('class="')) continue;
    if (/innerHTML/.test(line)) continue;
    if (/tile-zoom-slider/.test(line)) continue;

    const classMatch = line.match(/class="([^"]*)"/);
    if (!classMatch) continue;
    const classStr = classMatch[1];

    const hasBadTextSize = TEXT_SIZE_PATTERN.test(classStr);
    const hasBadWeight = FONT_WEIGHT_PATTERN.test(classStr);

    if (hasBadTextSize || hasBadWeight) {
      if (/<(div|span)\b/.test(line) || /^\s*class="/.test(line)) {
        const matched = classStr.match(new RegExp(`(${[...TEXT_SIZE_CLASSES, ...FONT_WEIGHT_CLASSES].join('|')})`));
        violations.push(`line ${i + 1}: ${matched?.[0]} in "${classStr.slice(0, 80)}${classStr.length > 80 ? '...' : ''}"`);
      }
    }
  }

  return violations;
}

describe('Typography enforcement: all text must use modus-typography', () => {
  it('scan completed', () => {
    expect(true).toBe(true);
  });

  const tsFiles = collectFiles(SRC_ROOT, '.component.ts');
  const htmlFiles = collectFiles(SRC_ROOT, '.component.html');

  for (const file of tsFiles) {
    const relPath = file.replace(resolve(__dir, '../..') + '/', '');
    const source = readFileSync(file, 'utf-8');
    const template = extractTemplate(source);
    if (!template) continue;

    const violations = findViolations(template);
    if (violations.length === 0) continue;

    it(`${relPath} — no raw Tailwind text sizing on div/span`, () => {
      expect(violations, `Raw Tailwind text classes found (should use modus-typography):\n  ${violations.join('\n  ')}`).toHaveLength(0);
    });
  }

  for (const file of htmlFiles) {
    const relPath = file.replace(resolve(__dir, '../..') + '/', '');
    const content = readFileSync(file, 'utf-8');

    const violations = findViolations(content);
    if (violations.length === 0) continue;

    it(`${relPath} — no raw Tailwind text sizing on div/span`, () => {
      expect(violations, `Raw Tailwind text classes found (should use modus-typography):\n  ${violations.join('\n  ')}`).toHaveLength(0);
    });
  }
});
