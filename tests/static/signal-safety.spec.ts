import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dir, '../../src/app');

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'demos' || entry === 'dev' || entry === 'dev-pages' || entry === 'node_modules') continue;
      results.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

const tsFiles = collectTsFiles(SRC_ROOT);

/**
 * Extract all effect() bodies from a source file.
 * Returns an array of { body, lineNumber } for each effect block found.
 */
function extractEffectBodies(source: string): { body: string; line: number }[] {
  const results: { body: string; line: number }[] = [];
  const effectPattern = /\beffect\s*\(\s*\(\s*\)\s*=>\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = effectPattern.exec(source)) !== null) {
    const startBrace = source.indexOf('{', match.index + match[0].length - 1);
    if (startBrace === -1) continue;
    let depth = 1;
    let i = startBrace + 1;
    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }
    const body = source.slice(startBrace, i);
    const line = source.slice(0, match.index).split('\n').length;
    results.push({ body, line });
  }
  return results;
}

describe('Signal safety: no unguarded registerWidget calls inside effects', () => {
  const dangerousMethods = ['registerWidgets(', 'registerWidget('];

  for (const file of tsFiles) {
    const relPath = file.replace(resolve(__dir, '../..') + '/', '');
    const source = readFileSync(file, 'utf-8');

    if (!source.includes('effect(')) continue;

    const effects = extractEffectBodies(source);
    if (effects.length === 0) continue;

    for (const { body, line } of effects) {
      for (const method of dangerousMethods) {
        if (!body.includes(method)) continue;

        it(`${relPath}:${line} — ${method.replace('(', '')} inside effect must be wrapped with untracked()`, () => {
          const untrackedPattern = new RegExp(
            `untracked\\s*\\(\\s*\\(\\)\\s*=>\\s*[^)]*${method.replace('(', '\\(')}` +
            `|untracked\\s*\\(\\s*\\(\\)\\s*=>\\s*\\{[^}]*${method.replace('(', '\\(')}`,
          );
          expect(
            untrackedPattern.test(body),
            `Found ${method.replace('(', '')} call inside effect() at line ${line} without untracked() wrapper. ` +
            `Reading signals inside registerWidgets/registerWidget from within an effect creates an infinite loop. ` +
            `Wrap the call: untracked(() => this.widgetFocusService.${method}...));`,
          ).toBe(true);
        });
      }
    }
  }
});
