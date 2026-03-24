import { test, expect } from '@playwright/test';

test.describe('Reset Layout', () => {
  test('desktop flyout appears and is clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resetBtn = page.locator('[aria-label="Reset options"]').first();
    await expect(resetBtn).toBeVisible();

    await resetBtn.click();
    await page.waitForTimeout(300);

    const flyout = page.locator('.desktop-reset-flyout').first();
    await expect(flyout).toBeVisible();

    const resetLayoutItem = flyout.locator('text=Reset Layout');
    await expect(resetLayoutItem).toBeVisible();

    await resetLayoutItem.click();
    await page.waitForTimeout(300);

    await expect(flyout).not.toBeVisible();
  });
});
