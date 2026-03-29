import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dir, '../../src/app');

/**
 * Recursively collect all .component.ts files under a directory,
 * excluding demo and dev folders which are reference-only.
 */
function collectComponentFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'demos' || entry === 'dev' || entry === 'dev-pages') continue;
      results.push(...collectComponentFiles(full));
    } else if (entry.endsWith('.component.ts')) {
      results.push(full);
    }
  }
  return results;
}

const componentFiles = collectComponentFiles(SRC_ROOT);

/**
 * Extract the inline template string from a component file.
 * Looks for `template: \`...\`` and returns the content between backticks.
 */
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

describe('Angular template safety (all components)', () => {
  describe('no arrow functions in template event bindings', () => {
    /*
     * Angular templates cannot parse arrow functions (=>).
     * Using .update(v => !v) or similar in (click)="..." causes NG5002.
     * Use .set(!signal()) or call a method instead.
     */
    for (const file of componentFiles) {
      const relPath = file.replace(resolve(__dir, '../..') + '/', '');
      const source = readFileSync(file, 'utf-8');
      const template = extractTemplate(source);
      if (!template) continue;

      it(`${relPath} has no arrow functions in event bindings`, () => {
        const eventBindingPattern = /\([\w.]+\)="([^"]*)"/g;
        let match;
        const violations: string[] = [];
        while ((match = eventBindingPattern.exec(template)) !== null) {
          const expr = match[1];
          if (expr.includes('=>')) {
            violations.push(expr.length > 60 ? expr.slice(0, 60) + '...' : expr);
          }
        }
        expect(violations, `Arrow functions found in event bindings:\n  ${violations.join('\n  ')}`).toHaveLength(0);
      });
    }
  });

  describe('no private/protected members accessed in templates', () => {
    /*
     * Angular templates can only access public members.
     * Calling this.engine.foo() in a template when engine is private causes TS2341.
     * Known private fields that must NOT appear in template bindings.
     */
    const KNOWN_PRIVATE_FIELDS = ['engine', '_detailMgr', '_tileCanvas', 'themeService'];

    for (const file of componentFiles) {
      const relPath = file.replace(resolve(__dir, '../..') + '/', '');
      const source = readFileSync(file, 'utf-8');
      const template = extractTemplate(source);
      if (!template) continue;

      const privates = KNOWN_PRIVATE_FIELDS.filter((field) => {
        const isPrivate =
          source.includes(`private readonly ${field}`) ||
          source.includes(`private ${field}`) ||
          source.includes(`readonly ${field} = inject(`) === false;
        if (!isPrivate) return false;

        const privatePattern = new RegExp(`(private|#)\\s+(readonly\\s+)?${field}\\b`);
        return privatePattern.test(source);
      });

      if (privates.length === 0) continue;

      it(`${relPath} does not use private members in template`, () => {
        const violations: string[] = [];
        for (const field of privates) {
          const templateUsagePattern = new RegExp(`(?:"|')\\s*[^"']*\\b${field}\\.`, 'g');
          const bindingPattern = new RegExp(`\\(\\w+\\)="[^"]*\\b${field}\\.`, 'g');
          const interpolationPattern = new RegExp(`\\{\\{[^}]*\\b${field}\\.`, 'g');
          const propertyBindingPattern = new RegExp(`\\[\\w+\\]="[^"]*\\b${field}\\.`, 'g');

          if (bindingPattern.test(template) || interpolationPattern.test(template) || propertyBindingPattern.test(template)) {
            violations.push(field);
          }
        }
        expect(violations, `Private members used in template: ${violations.join(', ')}`).toHaveLength(0);
      });
    }
  });
});
