import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dir, '../../src');

describe('Widget scroll integrity', () => {
  describe('modus-typography display: block', () => {
    it('Angular wrapper sets display: block on host', () => {
      const src = readFileSync(
        resolve(SRC_ROOT, 'app/components/modus-typography.component.ts'),
        'utf8',
      );
      expect(src).toMatch(/host:\s*\{[^}]*display:\s*block/);
    });

    it('Global CSS sets display: block on modus-wc-typography', () => {
      const css = readFileSync(resolve(SRC_ROOT, 'styles.css'), 'utf8');
      expect(css).toMatch(/modus-wc-typography\s*\{\s*display:\s*block/);
    });
  });

  describe('No flex-layout classes in modus-typography className', () => {
    const LAYOUT_CLASSES = [
      'flex-1',
      'flex-shrink-0',
      'shrink-0',
      'min-w-0',
      'ml-auto',
      'mr-auto',
    ];

    const LAYOUT_RE = new RegExp(`\\b(${LAYOUT_CLASSES.join('|')})\\b`);

    const FILES_TO_SCAN = [
      'app/pages/home-page/home-page.component.ts',
      'app/pages/financials-page/financials-page.component.ts',
      'app/pages/projects-page/projects-page.component.html',
      'app/pages/project-dashboard/project-dashboard.component.html',
      'app/shell/components/widget-frame.component.ts',
    ];

    function findAllClassNameValues(source: string): { line: number; value: string }[] {
      const results: { line: number; value: string }[] = [];
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const staticMatch = lines[i].matchAll(/className="([^"]+)"/g);
        for (const m of staticMatch) {
          results.push({ line: i + 1, value: m[1] });
        }
        const dynMatch = lines[i].matchAll(/\[className\]="'([^']+)'/g);
        for (const m of dynMatch) {
          results.push({ line: i + 1, value: m[1] });
        }
      }
      return results;
    }

    for (const file of FILES_TO_SCAN) {
      it(`${file} has no layout classes in className`, () => {
        const src = readFileSync(resolve(SRC_ROOT, file), 'utf8');
        const classNames = findAllClassNameValues(src);
        const violations = classNames.filter((cn) => LAYOUT_RE.test(cn.value));
        if (violations.length > 0) {
          const msgs = violations.map(
            (v) => `  line ${v.line}: className="${v.value}"`,
          );
          expect.fail(
            `Found layout classes in className (should be on host class):\n${msgs.join('\n')}`,
          );
        }
      });
    }

    const COMPONENT_DIRS = [
      'app/pages/home-page/components',
      'app/pages/project-dashboard/components',
      'app/pages/financials-page/components',
    ];

    for (const dir of COMPONENT_DIRS) {
      it(`${dir}/ components have no layout classes in className`, () => {
        const { readdirSync } = require('node:fs');
        const fullDir = resolve(SRC_ROOT, dir);
        let allViolations: string[] = [];
        try {
          for (const entry of readdirSync(fullDir)) {
            if (!entry.endsWith('.component.ts')) continue;
            const src = readFileSync(resolve(fullDir, entry), 'utf8');
            const classNames = findAllClassNameValues(src);
            const violations = classNames.filter((cn) => LAYOUT_RE.test(cn.value));
            for (const v of violations) {
              allViolations.push(`  ${entry}:${v.line}: className="${v.value}"`);
            }
          }
        } catch {
          return;
        }
        if (allViolations.length > 0) {
          expect.fail(
            `Found layout classes in className:\n${allViolations.join('\n')}`,
          );
        }
      });
    }
  });
});
