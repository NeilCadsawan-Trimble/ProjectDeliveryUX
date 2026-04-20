import { test, expect, type ConsoleMessage, type Page } from '@playwright/test';

/**
 * Comprehensive route smoke test.
 *
 * Exhaustively navigates to every route declared in `src/app/app.routes.ts`
 * and asserts three things for each:
 *   1. The expected root component mounts within a timeout (route resolves,
 *      lazy chunk loads, guards allow through, layout engine boots).
 *   2. No uncaught exceptions reach `window.onerror` (`pageerror`).
 *   3. No runtime `console.error` messages fire during or shortly after
 *      navigation (effects, rAF callbacks, setTimeout handlers, etc.).
 *
 * The matrix covers:
 *   - 5 personas (frank, bert, kelly, dominique, pamela)
 *   - 3 viewports (mobile 600x900, desktop 1280x800, canvas 1920x1080) for
 *     every route driven by the dashboard layout engine
 *   - 8 project slugs for the project dashboard
 *   - All 14 financials sub-routes with real seeded entity IDs
 *
 * This file exists because the bug fixed in commit
 *   "fix(dashboard): restore project dashboard rendering"
 * shipped silently despite a full regression suite -- no existing test
 * actually navigated to a project dashboard route at runtime. Any future
 * runtime regression on *any* declared route will now be caught here.
 */

// -----------------------------------------------------------------------------
// Test matrix definitions
// -----------------------------------------------------------------------------

const PERSONAS = ['frank', 'bert', 'kelly', 'dominique', 'pamela'] as const;

const PROJECT_SLUGS = [
  'riverside-office-complex',
  'harbor-view-condominiums',
  'downtown-transit-hub',
  'lakeside-medical-center',
  'westfield-shopping-center',
  'metro-bridge-rehabilitation',
  'sunset-ridge-apartments',
  'industrial-park-warehouse',
] as const;

const VIEWPORTS = {
  mobile: { width: 600, height: 900 },
  desktop: { width: 1280, height: 800 },
  canvas: { width: 1920, height: 1080 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;

// Sample IDs drawn from src/app/data/dashboard-data.seed.ts -- any existing
// entity in the corresponding seed array is enough to exercise the router
// params + downstream state reads without tripping a not-found branch.
const FIN_SUBROUTES: readonly string[] = [
  'job-costs/riverside-office-complex',
  'change-orders/PCO-001',
  'estimates/EST-2026-035',
  'invoices/INV-001',
  'payables/AP-001',
  'purchase-orders/PO-001',
  'contracts/PC-2026-001',
  'billing/BE-001',
  'payroll/PR-001',
  `payroll-monthly/${encodeURIComponent('Oct 2025')}`,
  'subcontract-ledger/SL-001',
  'gl-entries/GL-001',
  'gl-accounts/1000',
  `cash-flow/${encodeURIComponent('Oct 2025')}`,
] as const;

/** Dashboard-engine persona routes rendered across all viewports. */
const DASHBOARD_ROUTES: readonly { path: string; selector: string; label: string }[] = [
  { path: '', selector: 'app-home-page', label: 'home' },
  { path: '/projects', selector: 'app-projects-page', label: 'projects' },
  { path: '/financials', selector: 'app-financials-page', label: 'financials' },
];

/** Static (non-layout-engine) persona pages, desktop viewport is sufficient. */
const FLAT_ROUTES: readonly { path: string; selector: string; label: string }[] = [
  { path: '/profile', selector: 'app-profile-page', label: 'profile' },
  { path: '/account-settings', selector: 'app-account-settings-page', label: 'account-settings' },
  { path: '/my-products', selector: 'app-my-products-page', label: 'my-products' },
];

// -----------------------------------------------------------------------------
// Noise filters
// -----------------------------------------------------------------------------
//
// Angular and the browser both emit a handful of errors in dev that are not
// functional regressions (dev-only source-map warnings, favicon misses, cert
// issues when the page tries to contact id.trimble.com, etc.). These are
// suppressed. Anything else failing here is a real runtime regression.

const BENIGN_CONSOLE_PATTERNS: readonly RegExp[] = [
  /Failed to load resource.*favicon/i,
  /sourcemap/i,
  /DevTools failed to load source map/i,
  // Real Trimble ID endpoints are unreachable from Playwright chromium.
  /id\.trimble\.com/i,
  /\.well-known\/openid-configuration/i,
  // Network fetches Chromium in Playwright can't resolve: untrusted dev cert
  // on the ID provider, CDN misses, CORS preflight. None of these indicate
  // an app regression -- our concern here is runtime errors in the page's
  // own JS, not asset load failures.
  /net::ERR_CERT/i,
  /net::ERR_NAME_NOT_RESOLVED/i,
  /net::ERR_CONNECTION_REFUSED/i,
  // Any 4xx / 5xx response while loading an external asset (CDN rate limits
  // like 429 on the Modus icons font, 404s on optional sourcemaps, Trimble ID
  // 401/403 during the fake-token dance). None of these indicate an app
  // regression -- our concern is runtime JS in the page, not asset fetches.
  /Failed to load resource: the server responded with a status of [45]\d\d/i,
  // Angular router emits these when a guard short-circuits -- not a crash.
  /NG0912/i,
];

const BENIGN_PAGEERROR_PATTERNS: readonly RegExp[] = [
  // Seeded fake tokens can fail jwt-decode inside the auth service; we guard
  // everywhere in prod code but the rejected promise still surfaces here.
  /Invalid token specified/i,
];

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('tid_access_token', 'fake.access.token');
    localStorage.setItem('tid_id_token', 'fake.id.token');
    localStorage.setItem('tid_token_expiry', expiry);
  });
}

interface VisitResult {
  readonly url: string;
  readonly pageErrors: string[];
  readonly consoleErrors: string[];
}

async function visitAndCollect(
  page: Page,
  url: string,
  rootSelector: string,
): Promise<VisitResult> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  const onPageError = (err: Error): void => {
    if (BENIGN_PAGEERROR_PATTERNS.some((re) => re.test(err.message))) return;
    pageErrors.push(`${err.name}: ${err.message}\n${err.stack ?? ''}`);
  };

  const onConsole = (msg: ConsoleMessage): void => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (BENIGN_CONSOLE_PATTERNS.some((re) => re.test(text))) return;
    consoleErrors.push(text);
  };

  page.on('pageerror', onPageError);
  page.on('console', onConsole);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for the expected root component to mount; fails fast if the route
    // didn't resolve or a guard kicked us somewhere unexpected.
    await page.waitForSelector(rootSelector, { state: 'attached', timeout: 15_000 });
    // Let late effects, rAF callbacks, and microtasks settle so we catch
    // errors that fire *after* the initial paint (which is what the project
    // dashboard regression looked like -- the component mounted then threw
    // inside a downstream `computed()` / localStorage read).
    await page.waitForTimeout(2000);
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
  }

  return { url, pageErrors, consoleErrors };
}

function assertHealthy(result: VisitResult): void {
  expect.soft(
    result.pageErrors,
    `uncaught exceptions at ${result.url}:\n${result.pageErrors.join('\n---\n')}`,
  ).toEqual([]);
  expect.soft(
    result.consoleErrors,
    `console errors at ${result.url}:\n${result.consoleErrors.join('\n---\n')}`,
  ).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await seedAuth(page);
});

// -----------------------------------------------------------------------------
// Public / auth routes
// -----------------------------------------------------------------------------

test.describe('public routes', () => {
  test('persona picker renders @ desktop', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    assertHealthy(await visitAndCollect(page, '/select', 'app-persona-select'));
  });

  test('persona picker renders @ mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    assertHealthy(await visitAndCollect(page, '/select', 'app-persona-select'));
  });

  test('persona picker renders @ canvas', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.canvas);
    assertHealthy(await visitAndCollect(page, '/select', 'app-persona-select'));
  });
});

// -----------------------------------------------------------------------------
// Persona dashboard routes (layout-engine pages, all viewports)
// -----------------------------------------------------------------------------

for (const persona of PERSONAS) {
  test.describe(`persona ${persona} dashboards`, () => {
    for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
      for (const route of DASHBOARD_ROUTES) {
        test(`${route.label} @ ${viewport}`, async ({ page }) => {
          await page.setViewportSize(VIEWPORTS[viewport]);
          assertHealthy(
            await visitAndCollect(page, `/${persona}${route.path}`, route.selector),
          );
        });
      }
    }
  });
}

// -----------------------------------------------------------------------------
// Persona flat pages (profile / account-settings / my-products)
// -----------------------------------------------------------------------------

for (const persona of PERSONAS) {
  test.describe(`persona ${persona} flat pages`, () => {
    for (const route of FLAT_ROUTES) {
      test(route.label, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
        assertHealthy(
          await visitAndCollect(page, `/${persona}${route.path}`, route.selector),
        );
      });
    }
  });
}

// -----------------------------------------------------------------------------
// Project dashboards (all personas × all slugs × all viewports)
//
// This is the slice of the matrix that was completely uncovered before.
// Per-persona layout seeds live in `src/app/data/layout-seeds/*` and are
// selected inside `ProjectDashboardComponent.getLayoutSeedForCurrentPersona`;
// a bug in any one seed would have broken that persona's dashboards only,
// so we must cover every persona, not just frank.
// -----------------------------------------------------------------------------

for (const persona of PERSONAS) {
  test.describe(`persona ${persona} project dashboards`, () => {
    for (const slug of PROJECT_SLUGS) {
      for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
        test(`${slug} @ ${viewport}`, async ({ page }) => {
          await page.setViewportSize(VIEWPORTS[viewport]);
          assertHealthy(
            await visitAndCollect(
              page,
              `/${persona}/project/${slug}`,
              'app-project-dashboard',
            ),
          );
        });
      }
    }
  });
}

// -----------------------------------------------------------------------------
// Financials sub-routes (every declared :id / :slug / :code / :month path)
//
// All sub-routes load the same `FinancialsPageComponent`, but each enters a
// different branch of its route-param handling, so we exercise every one.
// Desktop viewport is sufficient -- the layout-engine side is already covered
// by the base /financials dashboard route above.
// -----------------------------------------------------------------------------

for (const persona of PERSONAS) {
  test.describe(`persona ${persona} financials sub-routes`, () => {
    for (const sub of FIN_SUBROUTES) {
      test(sub, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop);
        assertHealthy(
          await visitAndCollect(
            page,
            `/${persona}/financials/${sub}`,
            'app-financials-page',
          ),
        );
      });
    }
  });
}

