import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const VIEWER_PATH = resolve(__dir, '../../src/app/shared/detail/pdf-viewer.component.ts');
const SRC = readFileSync(VIEWER_PATH, 'utf-8');

/**
 * Regression guard for the v4 → v5 `pdfjs-dist` bump that silently broke every
 * drawing detail view (the worker stayed pinned to `pdfjs-dist@4.10.38` while
 * the imported API moved to v5, so PDF.js refused to render and the viewer
 * showed only its loading spinner).
 *
 * PDF.js requires the loaded worker and the imported API to match. Deriving
 * the CDN URL from `pdfjsLib.version` (exported by `pdfjs-dist`) keeps them in
 * lock-step automatically; pinning a literal version is what drifted.
 */
describe('pdf-viewer CDN URL stays in lock-step with installed pdfjs-dist', () => {
  it('does not pin a literal version on the jsdelivr pdfjs-dist CDN URL', () => {
    // `pdfjs-dist@4.10.38`, `pdfjs-dist@5.7.284`, etc. — any literal here is
    // a regression. The runtime URL must read `${pdfjsLib.version}` instead.
    expect(SRC).not.toMatch(/pdfjs-dist@\d+\.\d+\.\d+/);
  });

  it('builds the CDN URL from the library\'s own `version` export', () => {
    expect(SRC).toMatch(/pdfjs-dist@\$\{pdfjsLib\.version\}/);
  });

  it('still loads worker + cmaps from the same versioned CDN base', () => {
    // If either of these moves to a different host (or a different base path)
    // without the version interpolation above, drift is back on the table.
    expect(SRC).toMatch(/`\$\{cdn\}\/build\/pdf\.worker\.min\.mjs`/);
    expect(SRC).toMatch(/cMapUrl:\s*`\$\{cdn\}\/cmaps\/`/);
  });
});
