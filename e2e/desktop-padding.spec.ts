import { test, expect } from '@playwright/test';

test.describe('Desktop Padding (16px)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: 'Financials', path: '/financials' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page has 16px horizontal padding`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const wrapper = page.locator('.px-4.max-w-screen-xl').first();
      await expect(wrapper).toBeVisible();

      const paddingLeft = await wrapper.evaluate(
        (el) => window.getComputedStyle(el).paddingLeft,
      );
      const paddingRight = await wrapper.evaluate(
        (el) => window.getComputedStyle(el).paddingRight,
      );

      expect(paddingLeft).toBe('16px');
      expect(paddingRight).toBe('16px');
    });
  }
});
