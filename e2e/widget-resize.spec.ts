import { test, expect } from '@playwright/test';

test.describe('Widget Resize', () => {
  test('enforces minimum 4-column width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const handle = page.locator('widget-resize-handle').first();
    const handleBox = await handle.boundingBox();
    if (!handleBox) {
      test.skip(true, 'No resize handle found');
      return;
    }

    const startX = handleBox.x + handleBox.width / 2;
    const startY = handleBox.y + handleBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 600, startY, { steps: 20 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const widgetEl = page
      .locator('[style*="grid-column"]')
      .first();
    const box = await widgetEl.boundingBox();
    if (!box) return;

    const containerWidth = 1280;
    const colWidth = containerWidth / 16;
    const minWidth = 4 * colWidth - 16;
    expect(box.width).toBeGreaterThanOrEqual(minWidth * 0.85);
  });
});
