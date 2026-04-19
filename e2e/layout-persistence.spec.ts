import { test, expect, type Page } from '@playwright/test';

// Regression coverage for the four layout-persistence scenarios:
//  1. Canvas reposition survives F5.
//  2. Canvas reposition survives canvas -> desktop -> canvas round-trip.
//  3. Save as Default + Load Default restores the saved state (with a second widget move in between).
//  4. Reset Layout snaps a repositioned widget back to config defaults.
//  5. Desktop drag persists across F5 (localStorage, not sessionStorage).

const HOME_URL = '/frank';

async function firstCanvasKey(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (k.includes('canvas-layout:dashboard-home')) return k;
    }
    return null;
  });
}

async function firstDesktopKey(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) ?? '';
      if (k.startsWith('widget-layout:') && k.includes('dashboard-home') && k.endsWith(':desktop')) return k;
    }
    return null;
  });
}

async function readJson<T = unknown>(page: Page, key: string): Promise<T | null> {
  const raw = await page.evaluate((k) => localStorage.getItem(k), key);
  return raw ? (JSON.parse(raw) as T) : null;
}

async function dragHandle(page: Page, widgetId: string, dx: number, dy: number): Promise<void> {
  const handle = page.locator(
    `[data-widget-id="${widgetId}"] [data-drag-handle], [data-widget-id="${widgetId}"] .widget-header, [data-widget-id="${widgetId}"] .canvas-drag-handle`,
  ).first();
  await expect(handle).toBeVisible({ timeout: 10_000 });
  const box = await handle.boundingBox();
  if (!box) throw new Error(`no bounding box for ${widgetId}`);
  const sx = box.x + box.width / 2;
  const sy = box.y + box.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + dx, sy + dy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);
}

async function clickLayoutMenu(page: Page, itemLabel: RegExp): Promise<void> {
  const btn = page.locator('[aria-label="Layout options"]').first();
  await expect(btn).toBeVisible({ timeout: 10_000 });
  await btn.click();
  await page.waitForTimeout(150);
  await page.getByText(itemLabel).first().click();
  await page.waitForTimeout(400);
}

interface CanvasBlob {
  tops: Record<string, number>;
  heights: Record<string, number>;
  lefts: Record<string, number>;
  widths: Record<string, number>;
}

test.describe('Layout persistence', () => {
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('tid_access_token', 'fake.access.token');
      localStorage.setItem('tid_token_expiry', futureExpiry);
      localStorage.setItem('tid_id_token', 'fake.id.token');
    });
  });

  test('canvas reposition survives F5', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // The canvas key is always seeded on initial canvas entry -- see
    // `applyModeLayout` / `onBreakpointChange` in dashboard-layout-engine.
    // If this assertion regresses, the engine stopped persisting on entry.
    const key = await firstCanvasKey(page);
    expect(key, 'canvas key should be seeded on initial load').not.toBeNull();

    await dragHandle(page, 'homeKpis', 250, 120);

    const afterDrag = await readJson<CanvasBlob>(page, key!);
    expect(afterDrag).not.toBeNull();
    const expectedLeft = afterDrag!.lefts['homeKpis'];
    const expectedTop = afterDrag!.tops['homeKpis'];

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const afterReload = await readJson<CanvasBlob>(page, key!);
    expect(afterReload!.lefts['homeKpis']).toBe(expectedLeft);
    expect(afterReload!.tops['homeKpis']).toBe(expectedTop);
  });

  test('canvas -> desktop -> canvas preserves positions (byte-identical canvas blob)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const key = await firstCanvasKey(page);
    expect(key).not.toBeNull();

    // Move two different widgets so regressions in multi-widget cleanup show
    // up: a buggy cleanupCanvasOverlaps that only mangles some widgets would
    // slip past a single-widget assertion.
    await dragHandle(page, 'homeKpis', 200, 150);
    await dragHandle(page, 'homeUrgentNeeds', -120, 180);

    const afterDrag = await readJson<CanvasBlob>(page, key!);
    expect(afterDrag).not.toBeNull();

    // Excursion through desktop mode, then back to canvas. The old cleanup
    // scheduler re-persisted a cleaned-up blob here and clobbered the user's
    // positions. The new scheduler only persists when cleanup actually moves
    // something, so the canvas key must remain byte-identical.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(800);

    const after = await readJson<CanvasBlob>(page, key!);
    expect(after).not.toBeNull();
    expect(after).toEqual(afterDrag);
  });

  test('Save Default + Load Default reverts a second-widget change', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const key = await firstCanvasKey(page);
    expect(key).not.toBeNull();
    const before = await readJson<CanvasBlob>(page, key!);

    await dragHandle(page, 'homeKpis', 200, 100);
    const afterMove1 = await readJson<CanvasBlob>(page, key!);
    const savedLeft1 = afterMove1!.lefts['homeKpis'];
    const savedTop1 = afterMove1!.tops['homeKpis'];

    await clickLayoutMenu(page, /Save as Default Layout/);

    await dragHandle(page, 'homeUrgentNeeds', -150, 200);

    await clickLayoutMenu(page, /Load Default Layout/);

    const afterLoad = await readJson<CanvasBlob>(page, key!);
    expect(afterLoad!.lefts['homeKpis']).toBe(savedLeft1);
    expect(afterLoad!.tops['homeKpis']).toBe(savedTop1);
    expect(afterLoad!.lefts['homeUrgentNeeds']).toBe(before!.lefts['homeUrgentNeeds']);
    expect(afterLoad!.tops['homeUrgentNeeds']).toBe(before!.tops['homeUrgentNeeds']);
  });

  test('Reset Layout reverts moved widgets to config defaults', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const key = await firstCanvasKey(page);
    expect(key).not.toBeNull();
    const before = await readJson<CanvasBlob>(page, key!);
    const originalLeft = before!.lefts['homeKpis'];
    const originalTop = before!.tops['homeKpis'];

    await dragHandle(page, 'homeKpis', 200, 150);

    const afterDrag = await readJson<CanvasBlob>(page, key!);
    expect(afterDrag!.lefts['homeKpis']).not.toBe(originalLeft);

    await clickLayoutMenu(page, /^Reset Layout$/);

    const afterReset = await readJson<CanvasBlob>(page, key!);
    expect(afterReset!.lefts['homeKpis']).toBe(originalLeft);
    expect(afterReset!.tops['homeKpis']).toBe(originalTop);
  });

  // Regression coverage for the "KPI header pushes revenue-over-time down"
  // bug: Frank's financials seed locks BOTH finTitle (full-width) and
  // finNavKpi (left half). `finRevenueChart` sits beside `finNavKpi` at
  // roughly top=96. The old header-clearance logic used the global max
  // locked-bottom (608) as a ceiling for every non-locked widget and
  // shoved `finRevenueChart` to top=624 the moment the canvas defaults
  // were applied. The fixed engine computes clearance per-widget based on
  // horizontal overlap, so the chart stays flush alongside the KPI panel.
  test('financials:frank - revenue chart is not pushed below KPI header on default load', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/frank/financials');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    const revenueTop = await page.evaluate(() => {
      const el = document.querySelector('[data-widget-id="finRevenueChart"]') as HTMLElement | null;
      if (!el) return null;
      const v = el.style.top;
      return v ? parseInt(v, 10) : null;
    });

    expect(revenueTop).not.toBeNull();
    // Seed canvasDefaultTops.finRevenueChart = 96; snapping to GAP_PX (16)
    // leaves it at 96. Allow a small tolerance in case the page runs a
    // different snap, but it must stay in the same horizontal band as the
    // KPI panel (top < 200), NOT shoved below it (old buggy value ~624).
    expect(revenueTop!).toBeLessThan(200);
  });

  // Direct repro of the user bug: drag multiple widgets on financials:frank
  // in canvas mode, resize down through the 1920 breakpoint, resize back,
  // assert every drag survives both in localStorage AND in the rendered DOM.
  test('financials:frank - canvas drags survive canvas -> desktop -> canvas round-trip', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/frank/financials');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await dragHandle(page, 'finRevenueChart', -180, 60);
    await dragHandle(page, 'finOpenEstimates', 150, -100);
    await dragHandle(page, 'finBudgetByProject', -50, 40);

    const financialsKey = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (k.includes('canvas-layout:dashboard-financials')) return k;
      }
      return null;
    });
    expect(financialsKey).not.toBeNull();
    const afterDrag = await readJson<CanvasBlob>(page, financialsKey!);
    expect(afterDrag).not.toBeNull();

    const domBefore = await page.evaluate(() => {
      const ids = ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject'];
      const out: Record<string, { top: number; left: number }> = {};
      for (const id of ids) {
        const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement | null;
        if (el) out[id] = { top: parseInt(el.style.top, 10), left: parseInt(el.style.left, 10) };
      }
      return out;
    });

    // Cross the 1920 boundary TWICE through several intermediate sizes to
    // mimic a slow drag-resize (real users fire many `resize` events). This
    // exposes bugs where an intermediate handler invocation desyncs state.
    for (const width of [1700, 1440, 1280, 1440, 1700, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1000);

    const storageAfter = await readJson<CanvasBlob>(page, financialsKey!);
    expect(storageAfter, 'canvas blob missing after round-trip').not.toBeNull();

    for (const id of ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject'] as const) {
      expect(storageAfter!.lefts[id], `${id} storage.left mismatch`).toBe(afterDrag!.lefts[id]);
      expect(storageAfter!.tops[id], `${id} storage.top mismatch`).toBe(afterDrag!.tops[id]);
    }

    const domAfter = await page.evaluate(() => {
      const ids = ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject'];
      const out: Record<string, { top: number; left: number }> = {};
      for (const id of ids) {
        const el = document.querySelector(`[data-widget-id="${id}"]`) as HTMLElement | null;
        if (el) out[id] = { top: parseInt(el.style.top, 10), left: parseInt(el.style.left, 10) };
      }
      return out;
    });
    for (const id of ['finRevenueChart', 'finOpenEstimates', 'finBudgetByProject'] as const) {
      expect(domAfter[id], `${id} DOM mismatch`).toEqual(domBefore[id]);
    }
  });

  // Extra-paranoid round-trip that crosses TWO breakpoints (canvas -> mobile
  // -> canvas), simulating a user who drags the browser edge all the way
  // down to phone width and back. The mobile excursion takes a different
  // path through onBreakpointChange (persistLayoutAs(mobile)) and has been
  // a source of subtle state loss in the past.
  test('financials:frank - canvas drag survives canvas -> mobile -> canvas round-trip', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/frank/financials');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    await dragHandle(page, 'finRevenueChart', -180, 60);

    const key = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (k.includes('canvas-layout:dashboard-financials')) return k;
      }
      return null;
    });
    expect(key).not.toBeNull();
    const afterDrag = await readJson<CanvasBlob>(page, key!);

    for (const width of [1700, 1440, 1100, 820, 600, 820, 1100, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1000);

    const after = await readJson<CanvasBlob>(page, key!);
    expect(after!.lefts['finRevenueChart']).toBe(afterDrag!.lefts['finRevenueChart']);
    expect(after!.tops['finRevenueChart']).toBe(afterDrag!.tops['finRevenueChart']);

    const dom = await page.evaluate(() => {
      const el = document.querySelector('[data-widget-id="finRevenueChart"]') as HTMLElement | null;
      if (!el) return null;
      return { top: parseInt(el.style.top, 10), left: parseInt(el.style.left, 10) };
    });
    expect(dom!.top).toBe(afterDrag!.tops['finRevenueChart']);
    expect(dom!.left).toBe(afterDrag!.lefts['finRevenueChart']);
  });

  test('Desktop drag persists across F5 (localStorage)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(HOME_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await dragHandle(page, 'homeKpis', 300, 0);

    const key = await firstDesktopKey(page);
    expect(key).not.toBeNull();
    const saved = await page.evaluate((k) => localStorage.getItem(k), key);
    expect(saved).not.toBeNull();

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const afterReload = await page.evaluate((k) => localStorage.getItem(k), key);
    expect(afterReload).toBe(saved);
  });
});
