import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/components/modus-navbar.component.ts'),
  'utf-8',
);

describe('ModusNavbarComponent (regression)', () => {
  it('flushes props to modus-wc-navbar after wcEl is set (effects run too early)', () => {
    expect(SRC).toContain('flushPropsToWc');
    expect(SRC).toContain('Effects run before wcEl exists');
    expect(SRC).toMatch(/ngAfterViewInit[\s\S]*?flushPropsToWc\(\)/);
  });

  it('default visibility uses user false to avoid Stencil flash before parent binds', () => {
    expect(SRC).toMatch(/user:\s*false/);
  });
});
