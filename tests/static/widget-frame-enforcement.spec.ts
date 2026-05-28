import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dir, '../../src');
const APP_ROOT = resolve(SRC_ROOT, 'app');
const WIDGET_FRAME = resolve(APP_ROOT, 'shell/components/widget-frame.component.ts');

/**
 * Recursively collect all files matching given extensions under a directory.
 * Demo / dev reference content is excluded.
 */
function collectFiles(dir: string, extensions: readonly string[]): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'demos' || entry === 'dev' || entry === 'dev-pages' || entry === 'node_modules') continue;
      results.push(...collectFiles(full, extensions));
    } else if (extensions.some(ext => entry.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Enforce that every dashboard widget renders its draggable header
 * through `<app-widget-frame>` (or `WidgetFrameComponent`) instead of
 * duplicating the `cursor-grab active:cursor-grabbing` pattern inline.
 *
 * Background: widget headers used to be copy-pasted across ~20 widgets,
 * which meant any change to the shared chrome (selected ring, drag handle
 * size, title color, accessibility) had to be mirrored across every copy
 * or those widgets silently regressed. The full refactor (May 28, 2026)
 * migrated all of them onto WidgetFrameComponent; this test prevents that
 * duplication from creeping back in.
 *
 * The exemption list intentionally contains only widget-frame.component.ts
 * itself. Add a new exemption only if a non-widget surface legitimately
 * needs the drag-grab affordance (e.g. an internal dev tool) — and update
 * this comment when you do.
 */
describe('Widget header drift guard', () => {
  const EXEMPT_FILES = new Set<string>([WIDGET_FRAME]);
  const FORBIDDEN_PATTERN = /cursor-grab\s+active:cursor-grabbing/;

  const scannedFiles = [
    ...collectFiles(APP_ROOT, ['.ts', '.html']),
  ].filter(f => !f.endsWith('.spec.ts'));

  it('keeps the cursor-grab/active:cursor-grabbing pattern inside widget-frame.component.ts only', () => {
    const offenders: string[] = [];
    for (const file of scannedFiles) {
      if (EXEMPT_FILES.has(file)) continue;
      const contents = readFileSync(file, 'utf8');
      if (FORBIDDEN_PATTERN.test(contents)) {
        offenders.push(relative(SRC_ROOT, file));
      }
    }
    expect(
      offenders,
      `Found ${offenders.length} file(s) re-implementing the widget header inline.\n` +
        'Use <app-widget-frame> (WidgetFrameComponent) instead.\n' +
        'Offenders:\n  - ' + offenders.join('\n  - '),
    ).toEqual([]);
  });

  it('still detects the pattern inside widget-frame.component.ts (sanity check)', () => {
    const wf = readFileSync(WIDGET_FRAME, 'utf8');
    expect(FORBIDDEN_PATTERN.test(wf)).toBe(true);
  });
});
