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

  describe('.app-navbar layout', () => {
    it('defines .app-navbar with flex layout and 56px height', () => {
      const match = CSS.match(/\.app-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('display: flex');
      expect(match![1]).toContain('height: 56px');
    });

    it('defines .app-navbar-start and .app-navbar-end layout classes', () => {
      expect(CSS).toContain('.app-navbar-start');
      expect(CSS).toContain('.app-navbar-end');
    });

    it('does not use modus-wc-navbar-host-fallback (removed)', () => {
      expect(CSS).not.toContain('.modus-wc-navbar-host-fallback');
    });

    it('loads Modus icon font rules via styles.css import', () => {
      expect(CSS).toContain("@import '../public/modus-icons.css'");
    });

    it('canvas navbar has no hamburger (side nav provides navigation)', () => {
      expect(CSS).not.toContain('.canvas-navbar .shell-navbar-hamburger');
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

    it('applies border-radius to inner .app-navbar', () => {
      const match = CSS.match(/\.canvas-navbar\s+\.app-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('border-radius');
    });

    it('does NOT use canvas-host::after full-width top band (navbar is self-contained)', () => {
      expect(CSS).not.toMatch(/\.canvas-host::after/);
    });

    it('canvas-navbar .app-navbar has border and shadow for self-contained appearance', () => {
      const match = CSS.match(/\.canvas-navbar\s+\.app-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('border');
      expect(match![1]).toContain('box-shadow');
    });
  });

  describe('desktop shell navbar (non-canvas)', () => {
    it('.app-navbar uses min-height 56px so the bar does not collapse', () => {
      const match = CSS.match(/\.app-navbar\s*\{([^}]*)\}/m);
      expect(match).toBeTruthy();
      expect(match![1]).toContain('min-height: 56px');
    });
  });

  describe('side-nav consistent row heights', () => {
    it('sets height: 56px on base .custom-side-nav-item', () => {
      const block = extractBlock(CSS, '.custom-side-nav-item');
      expect(block).toContain('height: 56px');
    });

    it('sets height: 56px on expanded selected items (desktop)', () => {
      expect(CSS).toMatch(/\.custom-side-nav\.expanded\s+\.custom-side-nav-item\.selected[\s\S]*?height:\s*56px/);
    });
  });

  describe('expanded side-nav icon alignment', () => {
    it('resets border-radius to 0 for expanded selected items', () => {
      expect(CSS).toMatch(/\.custom-side-nav\.expanded\s+\.custom-side-nav-item\.selected[\s\S]*?border-radius:\s*0/);
    });
  });

  describe('mobile side-nav centering', () => {
    it('centers selected items with margin auto in mobile breakpoint', () => {
      expect(CSS).toMatch(/@media[\s\S]*max-width:\s*767px[\s\S]*\.custom-side-nav\s+\.custom-side-nav-item\.selected[\s\S]*?margin:\s*4px auto/);
    });

    it('sets icon-slot to auto-fill width in mobile selected items', () => {
      expect(CSS).toMatch(/@media[\s\S]*max-width:\s*767px[\s\S]*\.custom-side-nav-icon-slot[\s\S]*?flex:\s*1 1 auto/);
    });
  });

  describe('Connect theme typography override fix', () => {
    it('re-asserts .modus-wc-text-xl for modus-wc-typography-override in connect-light', () => {
      expect(CSS).toMatch(
        /\[data-theme='connect-light'\]\s+modus-wc-typography\s+\.modus-wc-typography-override\.modus-wc-text-xl[^{]*\{\s*font-size:\s*var\(--modus-wc-font-size-xl\)/,
      );
    });

    it('re-asserts .modus-wc-text-xl for modus-wc-typography-override in connect-dark', () => {
      expect(CSS).toMatch(
        /\[data-theme='connect-dark'\][^{]*modus-wc-typography\s+\.modus-wc-typography-override\.modus-wc-text-xl[^{]*\{\s*font-size:\s*var\(--modus-wc-font-size-xl\)/,
      );
    });

    it('covers all 7 text sizes (xs, sm, md, lg, xl, 2xl, 3xl) in connect themes', () => {
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']) {
        expect(CSS).toContain(`.modus-wc-typography-override.modus-wc-text-${size}`);
      }
    });

    it('covers all 4 font weights (light, normal, semibold, bold) in connect themes', () => {
      for (const weight of ['light', 'normal', 'semibold', 'bold']) {
        expect(CSS).toContain(`.modus-wc-typography-override.modus-wc-typography-weight-${weight}`);
      }
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
