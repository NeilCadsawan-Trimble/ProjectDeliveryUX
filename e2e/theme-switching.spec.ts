import { test, expect } from '@playwright/test';

const THEMES = [
  'modus-classic-light',
  'modus-classic-dark',
  'modus-modern-light',
  'modus-modern-dark',
  'connect-light',
  'connect-dark',
];

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  for (const theme of THEMES) {
    test(`${theme} renders without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);

      await page.waitForTimeout(500);

      const bgColor = await page.evaluate(() => {
        const el = document.querySelector('.bg-background') as HTMLElement;
        if (!el) return 'none';
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(bgColor).not.toBe('none');
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(bgColor).not.toBe('transparent');

      const jsErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('modus-wc'),
      );
      expect(jsErrors).toHaveLength(0);
    });
  }
});
