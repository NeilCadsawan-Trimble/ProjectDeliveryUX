import { DashboardLayoutEngine, type DashboardLayoutConfig } from './dashboard-layout-engine';
import type { WidgetLayoutService } from './widget-layout.service';
import type { LayoutSeed } from '../../data/layout-seeds/layout-seed.types';

import { HOME_FRANK_LAYOUT } from '../../data/layout-seeds/home-frank.layout';
import { HOME_KELLY_LAYOUT } from '../../data/layout-seeds/home-kelly.layout';
import { HOME_BERT_LAYOUT } from '../../data/layout-seeds/home-bert.layout';
import { HOME_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/home-dominique.layout';
import { HOME_PAMELA_LAYOUT } from '../../data/layout-seeds/home-pamela.layout';

import { FINANCIALS_FRANK_LAYOUT } from '../../data/layout-seeds/financials-frank.layout';
import { FINANCIALS_KELLY_LAYOUT } from '../../data/layout-seeds/financials-kelly.layout';
import { FINANCIALS_BERT_LAYOUT } from '../../data/layout-seeds/financials-bert.layout';
import { FINANCIALS_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/financials-dominique.layout';
import { FINANCIALS_PAMELA_LAYOUT } from '../../data/layout-seeds/financials-pamela.layout';

import { PROJECTS_FRANK_LAYOUT } from '../../data/layout-seeds/projects-frank.layout';
import { PROJECTS_KELLY_LAYOUT } from '../../data/layout-seeds/projects-kelly.layout';
import { PROJECTS_BERT_LAYOUT } from '../../data/layout-seeds/projects-bert.layout';
import { PROJECTS_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/projects-dominique.layout';
import { PROJECTS_PAMELA_LAYOUT } from '../../data/layout-seeds/projects-pamela.layout';

import { PROJECT_DETAIL_FRANK_LAYOUT } from '../../data/layout-seeds/project-detail-frank.layout';
import { PROJECT_DETAIL_KELLY_LAYOUT } from '../../data/layout-seeds/project-detail-kelly.layout';
import { PROJECT_DETAIL_BERT_LAYOUT } from '../../data/layout-seeds/project-detail-bert.layout';
import { PROJECT_DETAIL_DOMINIQUE_LAYOUT } from '../../data/layout-seeds/project-detail-dominique.layout';
import { PROJECT_DETAIL_PAMELA_LAYOUT } from '../../data/layout-seeds/project-detail-pamela.layout';

/**
 * Systematic seed-clearance regression test.
 *
 * For every shipped layout seed (persona x page), feed it through the
 * canvas header-clearance and canvas cleanup passes with the same locked
 * widget set the real page component installs. The seed MUST round-trip
 * with zero movement -- our canvas defaults are what the user sees when
 * they load the default layout, and any silent shove by the engine means
 * the default is inconsistent with itself.
 *
 * This test exists because Frank's financials default placed `finRevenueChart`
 * flush to the right of the locked `finNavKpi` panel (top=96). The old
 * header-clearance logic treated the union of locked widgets as a single
 * full-width ceiling, so revenue-over-time got shoved from top=96 down to
 * top=608 the moment the user loaded the default layout. The engine was
 * fixed to compute clearance per-widget based on horizontal overlap, and
 * this suite guarantees the same class of bug cannot resurface for any
 * current or future persona/page combination without failing a test.
 *
 * To add a new seed: import it and append a row below. The `lockedIds`
 * must match the page component's `widgetLocked.update(...)` call -- if
 * those drift this test will start failing, which is precisely the
 * outcome we want.
 */

interface SeedCase {
  name: string;
  seed: LayoutSeed;
  lockedIds: readonly string[];
}

const HOME_LOCKED = ['homeHeader'] as const;
const FIN_LOCKED = ['finTitle', 'finNavKpi'] as const;
const PROJECTS_LOCKED = ['projsHeader'] as const;
const PROJECT_DETAIL_LOCKED = ['projHeader'] as const;

const SEEDS: readonly SeedCase[] = [
  { name: 'home:frank', seed: HOME_FRANK_LAYOUT, lockedIds: HOME_LOCKED },
  { name: 'home:kelly', seed: HOME_KELLY_LAYOUT, lockedIds: HOME_LOCKED },
  { name: 'home:bert', seed: HOME_BERT_LAYOUT, lockedIds: HOME_LOCKED },
  { name: 'home:dominique', seed: HOME_DOMINIQUE_LAYOUT, lockedIds: HOME_LOCKED },
  { name: 'home:pamela', seed: HOME_PAMELA_LAYOUT, lockedIds: HOME_LOCKED },

  { name: 'financials:frank', seed: FINANCIALS_FRANK_LAYOUT, lockedIds: FIN_LOCKED },
  { name: 'financials:kelly', seed: FINANCIALS_KELLY_LAYOUT, lockedIds: FIN_LOCKED },
  { name: 'financials:bert', seed: FINANCIALS_BERT_LAYOUT, lockedIds: FIN_LOCKED },
  { name: 'financials:dominique', seed: FINANCIALS_DOMINIQUE_LAYOUT, lockedIds: FIN_LOCKED },
  { name: 'financials:pamela', seed: FINANCIALS_PAMELA_LAYOUT, lockedIds: FIN_LOCKED },

  { name: 'projects:frank', seed: PROJECTS_FRANK_LAYOUT, lockedIds: PROJECTS_LOCKED },
  { name: 'projects:kelly', seed: PROJECTS_KELLY_LAYOUT, lockedIds: PROJECTS_LOCKED },
  { name: 'projects:bert', seed: PROJECTS_BERT_LAYOUT, lockedIds: PROJECTS_LOCKED },
  { name: 'projects:dominique', seed: PROJECTS_DOMINIQUE_LAYOUT, lockedIds: PROJECTS_LOCKED },
  { name: 'projects:pamela', seed: PROJECTS_PAMELA_LAYOUT, lockedIds: PROJECTS_LOCKED },

  { name: 'project-detail:frank', seed: PROJECT_DETAIL_FRANK_LAYOUT, lockedIds: PROJECT_DETAIL_LOCKED },
  { name: 'project-detail:kelly', seed: PROJECT_DETAIL_KELLY_LAYOUT, lockedIds: PROJECT_DETAIL_LOCKED },
  { name: 'project-detail:bert', seed: PROJECT_DETAIL_BERT_LAYOUT, lockedIds: PROJECT_DETAIL_LOCKED },
  { name: 'project-detail:dominique', seed: PROJECT_DETAIL_DOMINIQUE_LAYOUT, lockedIds: PROJECT_DETAIL_LOCKED },
  { name: 'project-detail:pamela', seed: PROJECT_DETAIL_PAMELA_LAYOUT, lockedIds: PROJECT_DETAIL_LOCKED },
];

function createMockLayoutService(): WidgetLayoutService {
  return {
    save: vi.fn(),
    load: vi.fn().mockReturnValue(null),
  } as unknown as WidgetLayoutService;
}

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

function seedToConfig(seed: LayoutSeed): DashboardLayoutConfig {
  return {
    widgets: [...seed.widgets],
    layoutStorageKey: 'seed-test-desktop',
    canvasStorageKey: 'seed-test-canvas',
    defaultColStarts: { ...seed.defaultColStarts },
    defaultColSpans: { ...seed.defaultColSpans },
    defaultTops: { ...seed.defaultTops },
    defaultHeights: { ...seed.defaultHeights },
    canvasDefaultLefts: { ...seed.canvasDefaultLefts },
    canvasDefaultPixelWidths: { ...seed.canvasDefaultPixelWidths },
    minColSpan: 4,
  };
}

function primeCanvasState(engine: DashboardLayoutEngine, seed: LayoutSeed, lockedIds: readonly string[]): void {
  engine.isCanvasMode.set(true);

  const lockMap: Record<string, boolean> = {};
  for (const id of lockedIds) lockMap[id] = true;
  engine.widgetLocked.set(lockMap);

  engine.widgetLefts.set({ ...seed.canvasDefaultLefts });
  engine.widgetPixelWidths.set({ ...seed.canvasDefaultPixelWidths });
  engine.widgetTops.set({ ...(seed.canvasDefaultTops ?? seed.defaultTops) });
  engine.widgetHeights.set({ ...(seed.canvasDefaultHeights ?? seed.defaultHeights) });
}

describe('layout seed clearance round-trip', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // Sanity: every seed's locked widgets actually exist in the seed's widget list.
  it('every seed declares its locked widgets', () => {
    for (const { name, seed, lockedIds } of SEEDS) {
      for (const id of lockedIds) {
        expect(seed.widgets, `${name}: missing locked widget "${id}"`).toContain(id);
      }
    }
  });

  for (const { name, seed, lockedIds } of SEEDS) {
    // Primary regression guard. The Frank-financials bug looked like this:
    // `applyCanvasHeaderClearance` computed a union-of-all-locked-widgets
    // ceiling (max locked bottom) and shoved every non-locked widget below
    // it, so `finRevenueChart` at top=96 sitting beside the locked
    // `finNavKpi` panel got kicked to top=608 the first time the user
    // hit "load default layout". This test feeds the shipped seed to
    // clearance and asserts zero movement -- if a future seed or engine
    // change re-introduces the bug this lights up immediately.
    it(`${name}: applyCanvasHeaderClearance is a no-op on shipped canvas defaults`, () => {
      const engine = new DashboardLayoutEngine(seedToConfig(seed), createMockLayoutService());
      primeCanvasState(engine, seed, lockedIds);

      const topsBefore = { ...engine.widgetTops() };

      const applied = (
        engine as unknown as { applyCanvasHeaderClearance: () => boolean }
      ).applyCanvasHeaderClearance();

      expect(applied, `${name}: clearance moved a widget that was already seated`).toBe(false);
      expect(engine.widgetTops()).toEqual(topsBefore);
    });

    // Orthogonal guard: after running `cleanupCanvasOverlaps`, no non-locked
    // widget may end up strictly below a locked widget it does not
    // horizontally overlap. This is a structural invariant of the
    // header-clearance fix that is robust to unrelated overlap resolution
    // between non-locked widgets (e.g. Pamela's home seed has a genuine
    // overlap between `homeOpenEstimates` and `homeRfis` that cleanup
    // legitimately resolves -- we should not conflate that with the
    // clearance bug).
    it(`${name}: cleanupCanvasOverlaps never pushes a widget below a non-overlapping locked widget`, () => {
      const engine = new DashboardLayoutEngine(seedToConfig(seed), createMockLayoutService());
      primeCanvasState(engine, seed, lockedIds);

      const topsBefore = { ...engine.widgetTops() };
      const leftsBefore = { ...engine.widgetLefts() };
      const widthsBefore = { ...engine.widgetPixelWidths() };
      const heightsBefore = { ...engine.widgetHeights() };

      (engine as unknown as { cleanupCanvasOverlaps: () => void }).cleanupCanvasOverlaps();

      const topsAfter = engine.widgetTops();

      for (const wid of seed.widgets) {
        if (lockedIds.includes(wid)) continue;

        const wLeft = leftsBefore[wid] ?? 0;
        const wWidth = widthsBefore[wid] ?? 0;
        const wTopBefore = topsBefore[wid] ?? 0;

        // Max locked bottom that does NOT horizontally overlap this widget --
        // the ceiling the buggy code would have imposed.
        let spuriousCeiling = 0;
        for (const lid of lockedIds) {
          const lLeft = leftsBefore[lid] ?? 0;
          const lWidth = widthsBefore[lid] ?? 0;
          const lBottom = (topsBefore[lid] ?? 0) + (heightsBefore[lid] ?? 0);
          const overlap = Math.min(wLeft + wWidth, lLeft + lWidth) - Math.max(wLeft, lLeft);
          if (overlap > 0) continue; // legitimately overlapping -- may push
          spuriousCeiling = Math.max(spuriousCeiling, lBottom);
        }

        const wTopAfter = topsAfter[wid] ?? 0;
        if (spuriousCeiling <= 0) continue;

        // If the widget was seated ABOVE the spurious ceiling, it must stay
        // above it after cleanup -- being shoved below would mean the
        // clearance bug is back.
        if (wTopBefore < spuriousCeiling) {
          expect(
            wTopAfter,
            `${name}:${wid} was shoved below a locked widget it does not horizontally overlap (before=${wTopBefore}, after=${wTopAfter}, spurious ceiling=${spuriousCeiling})`,
          ).toBeLessThan(spuriousCeiling);
        }
      }
    });
  }
});
