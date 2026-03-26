import { test, expect } from '@playwright/test';

test.describe('Hamburger Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('side nav exists and is collapsed by default at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).toBeVisible();
    await expect(sideNav).not.toHaveClass(/expanded/);
  });

  test('clicking hamburger expands side nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await hamburger.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).toHaveClass(/expanded/);
  });

  test('clicking hamburger again collapses side nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await hamburger.click();
    await page.waitForTimeout(300);
    await hamburger.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).not.toHaveClass(/expanded/);
  });

  test('clicking a nav item collapses the expanded side nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await hamburger.click();
    await page.waitForTimeout(300);

    const navItem = page.locator('.custom-side-nav-item').first();
    await navItem.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).not.toHaveClass(/expanded/);
  });

  test('hamburger still works after delayed interaction (race condition guard)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(2000);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await hamburger.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).toHaveClass(/expanded/);

    await hamburger.click();
    await page.waitForTimeout(300);
    await expect(sideNav).not.toHaveClass(/expanded/);
  });

  test('hamburger works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).toHaveClass(/expanded/);
  });

  test('backdrop click closes expanded side nav', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);

    const hamburger = page.locator('button[aria-label="Main menu"]').first();
    await hamburger.click();
    await page.waitForTimeout(300);

    const sideNav = page.locator('.custom-side-nav').first();
    await expect(sideNav).toHaveClass(/expanded/);

    const backdrop = page.locator('.custom-side-nav-backdrop').first();
    await backdrop.click();
    await page.waitForTimeout(300);
    await expect(sideNav).not.toHaveClass(/expanded/);
  });
});
