import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(resolve(__dir, '../../src/styles.css'), 'utf-8');

function extractBlock(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(regex);
  return match ? match[1] : '';
}

describe('styles.css regression', () => {
  describe('.custom-side-nav', () => {
    const block = extractBlock(CSS, '.custom-side-nav');

    it('exists in styles.css', () => {
      expect(block.length).toBeGreaterThan(0);
    });

    it('has overflow: visible (NOT hidden)', () => {
      expect(block).toContain('overflow: visible');
      expect(block).not.toContain('overflow: hidden');
      expect(block).not.toContain('overflow: auto');
    });

    it('has z-index: 999', () => {
      expect(block).toContain('z-index: 999');
    });

    it('has position: fixed', () => {
      expect(block).toContain('position: fixed');
    });
  });

  describe('modus-wc-navbar host layout', () => {
    it('uses display block on host by default so toolbar 50/50 layout is not overridden', () => {
      const match = CSS.match(/modus-wc-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('display: block');
    });

    it('scopes host flex fallback to .modus-wc-navbar-host-fallback', () => {
      expect(CSS).toContain('.modus-wc-navbar-host-fallback modus-wc-navbar');
      expect(CSS).toContain('.modus-wc-navbar-host-fallback modus-wc-navbar > [slot="start"]');
    });

    it('loads Modus icon font rules via styles.css import', () => {
      expect(CSS).toContain("@import '../public/modus-icons.css'");
    });

    it('scopes canvas hamburger rail alignment to .canvas-navbar and min-width 1920px', () => {
      expect(CSS).toContain('.canvas-navbar .shell-navbar-hamburger');
      expect(CSS).toMatch(/@media\s*\(\s*min-width:\s*1920px\s*\)[\s\S]*\.canvas-navbar[\s\S]*padding-left:\s*56px/);
      expect(CSS).toContain("modus-wc-button[aria-label='Main menu']");
    });
  });

  describe('.canvas-navbar', () => {
    it('has overflow: visible so dropdowns are not clipped', () => {
      const match = CSS.match(/\.canvas-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      const block = match![1];
      expect(block).toContain('overflow: visible');
      expect(block).not.toContain('overflow: hidden');
      expect(block).not.toContain('overflow: auto');
    });

    it('has border-radius for bottom corners', () => {
      const match = CSS.match(/\.canvas-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('border-radius');
    });

    it('applies border-radius to inner modus-wc-navbar', () => {
      expect(CSS).toContain('.canvas-navbar modus-wc-navbar .modus-wc-navbar');
      const match = CSS.match(
        /\.canvas-navbar\s+modus-wc-navbar\s+\.modus-wc-navbar,\s*\n\s*\.canvas-navbar\s+modus-wc-navbar\s*\{([^}]*)\}/m,
      );
      expect(match).toBeTruthy();
      expect(match![1]).toContain('border-radius');
    });
  });

  describe('.desktop-reset-flyout', () => {
    it('has position: absolute', () => {
      const flyoutMatch = CSS.match(
        /\.(?:canvas-reset-flyout|desktop-reset-flyout)[\s\S]*?\{([^}]*)\}/m,
      );
      expect(flyoutMatch).toBeTruthy();
      const block = flyoutMatch![1];
      expect(block).toContain('position: absolute');
    });

    it('has left: 100%', () => {
      const flyoutMatch = CSS.match(
        /\.(?:canvas-reset-flyout|desktop-reset-flyout)[\s\S]*?\{([^}]*)\}/m,
      );
      expect(flyoutMatch![1]).toContain('left: 100%');
    });

    it('has z-index: 1001', () => {
      const flyoutMatch = CSS.match(
        /\.(?:canvas-reset-flyout|desktop-reset-flyout)[\s\S]*?\{([^}]*)\}/m,
      );
      expect(flyoutMatch![1]).toContain('z-index: 1001');
    });
  });
});
