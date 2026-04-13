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

    it('matches main app canvas fill in light themes', () => {
      expect(block).toContain('var(--app-canvas)');
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
        /\.canvas-navbar\s+modus-wc-navbar\s+\.modus-wc-navbar\s*\{([^}]*)\}/m,
      );
      expect(match).toBeTruthy();
      expect(match![1]).toContain('border-radius');
    });
  });

  describe('shell navbar in column flex layouts', () => {
    it('uses shell-navbar-strip with z-index above the icon rail and flex-shrink: 0', () => {
      expect(CSS).toContain('.shell-navbar-strip');
      const strip = CSS.match(/\.shell-navbar-strip\s*\{([^}]*)\}/m);
      expect(strip).toBeTruthy();
      expect(strip![1]).toContain('z-index: 1005');
      expect(strip![1]).toContain('flex-shrink: 0');
      expect(CSS).toContain('app-dashboard-shell div.h-full.flex.flex-col > .shell-navbar-strip');
      expect(CSS).toContain('app-project-dashboard div.h-full.flex.flex-col > .shell-navbar-strip');
      expect(CSS).toContain('app-example-project div.h-full.flex.flex-col > modus-navbar');
      const match = CSS.match(
        /app-dashboard-shell div\.h-full\.flex\.flex-col > \.shell-navbar-strip,[\s\S]*?app-example-project div\.h-full\.flex\.flex-col > modus-navbar\s*\{([^}]*)\}/m,
      );
      expect(match).toBeTruthy();
      expect(match![1]).toContain('flex-shrink: 0');
      expect(match![1]).toContain('width: 100%');
    });
  });

  describe('JS/CSS breakpoint bridge (--app-bp-*)', () => {
    it('defaults flags on :root and toggles them in the same @media widths as layout', () => {
      const rootBlock = extractBlock(CSS, ':root');
      expect(rootBlock).toContain('--app-bp-mobile: 0');
      expect(rootBlock).toContain('--app-bp-canvas: 0');
      expect(CSS).toContain('--app-bp-mobile: 1');
      expect(CSS).toContain('--app-bp-canvas: 1');
    });
  });

  describe('modus navbar hosts', () => {
    it('forces block display and full width for consistent Chromium layouts', () => {
      expect(CSS).toContain('modus-navbar,');
      expect(CSS).toContain('modus-wc-navbar');
      const block = CSS.match(/modus-navbar,\s*modus-wc-navbar\s*\{([^}]*)\}/m);
      expect(block).toBeTruthy();
      expect(block![1]).toContain('display: block');
      expect(block![1]).toContain('width: 100%');
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

  describe('.home-estimate-list-icon-well', () => {
    const block = extractBlock(CSS, '.home-estimate-list-icon-well');

    it('fixes 35px wells for All Estimates list rows (Figma 2:36091)', () => {
      expect(block).toContain('35px');
      expect(block).toContain('display: flex');
      expect(block).toContain('16px');
    });
  });

  describe('.bg-foreground-10', () => {
    const block = extractBlock(CSS, '.bg-foreground-10');

    it('defines archive-style neutral well fill', () => {
      expect(block).toContain('foreground-10');
    });
  });

  describe('.home-estimate-insight-row--positive', () => {
    const block = extractBlock(CSS, '.home-estimate-insight-row--positive');

    it('uses Figma 2:23632 pale mint fill rgba(224,236,207,0.3)', () => {
      expect(block).toContain('224');
      expect(block).toContain('236');
      expect(block).toContain('207');
    });
  });

  describe('.home-estimate-insight-row--caution', () => {
    const block = extractBlock(CSS, '.home-estimate-insight-row--caution');

    it('uses Figma 2:23632 warning pale fill rgba(255,245,228,0.6)', () => {
      expect(block).toContain('255');
      expect(block).toContain('245');
      expect(block).toContain('228');
    });
  });
});
