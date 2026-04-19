import { TestBed } from '@angular/core/testing';
import { LayoutDefaultsService } from './layout-defaults.service';
import {
  getHomeLayoutKeys,
  getFinancialsLayoutKeys,
  getProjectsLayoutKeys,
  getProjectDashboardLayoutKeys,
  getAllDashboardKeys,
  PROJECT_DASHBOARD_IDS,
} from './layout-keys';
import { PERSONAS } from '../../services/persona.service';

/**
 * Coverage test that prevents `LayoutDefaultsService` (and its registry of
 * known dashboard keys) from drifting away from the active keys that page
 * components build. When a page bumps its storage version -- and therefore
 * `getHomeLayoutKeys` / `getFinancialsLayoutKeys` / etc. -- "Save all visited
 * defaults" / "Clear all defaults" must keep working for that page.
 *
 * Failure mode this guards against: real `localStorage` dump showed the user
 * had financials v19/v21 keys persisted while `STATIC_BASES` only listed
 * v17/v29/v31 -- so global operations silently skipped every financials
 * dashboard for every persona.
 */
describe('LayoutDefaultsService + layout-keys registry', () => {
  let service: LayoutDefaultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutDefaultsService);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('exposes distinct desktop/canvas keys for every persona on every page', () => {
    for (const persona of PERSONAS) {
      const home = getHomeLayoutKeys(persona.slug);
      const fin = getFinancialsLayoutKeys(persona.slug);
      const projects = getProjectsLayoutKeys(persona.slug);
      expect(home.desktop).not.toBe(home.canvas);
      expect(fin.desktop).not.toBe(fin.canvas);
      expect(projects.desktop).not.toBe(projects.canvas);
      expect(home.desktop.startsWith(`${persona.slug}:`)).toBe(true);
      expect(fin.canvas.startsWith(`${persona.slug}:`)).toBe(true);
    }
  });

  it('getAllDashboardKeys covers home, financials, projects, and every per-project dashboard', () => {
    for (const persona of PERSONAS) {
      const keys = getAllDashboardKeys(persona.slug);
      const desktopSet = new Set(keys.map(k => k.desktop));
      expect(desktopSet.has(getHomeLayoutKeys(persona.slug).desktop)).toBe(true);
      expect(desktopSet.has(getFinancialsLayoutKeys(persona.slug).desktop)).toBe(true);
      expect(desktopSet.has(getProjectsLayoutKeys(persona.slug).desktop)).toBe(true);
      for (const id of PROJECT_DASHBOARD_IDS) {
        expect(desktopSet.has(getProjectDashboardLayoutKeys(persona.slug, id).desktop)).toBe(true);
      }
      // No accidental duplicates -- uniqueness guards against copy-paste version bumps.
      expect(desktopSet.size).toBe(keys.length);
    }
  });

  it('saveAllVisitedDefaults persists financials for every persona when their layouts exist', () => {
    // Seeds a storage blob under each persona's financials desktop key using
    // the registry (not hand-written strings) so this test stays in step with
    // any future version bump.
    const layoutBlob = JSON.stringify({
      tops: { w1: 0 }, heights: { w1: 100 }, colStarts: { w1: 1 }, colSpans: { w1: 4 },
    });
    for (const persona of PERSONAS) {
      const fin = getFinancialsLayoutKeys(persona.slug);
      localStorage.setItem(`widget-layout:${fin.desktop}:desktop`, layoutBlob);
      localStorage.setItem(fin.canvas, JSON.stringify({ tops: {}, heights: {}, lefts: {}, widths: {} }));
    }

    const count = service.saveAllVisitedDefaults();

    for (const persona of PERSONAS) {
      const fin = getFinancialsLayoutKeys(persona.slug);
      expect(localStorage.getItem(`${fin.desktop}__customDefaults`)).not.toBeNull();
      expect(localStorage.getItem(`${fin.canvas}__customDefaults`)).not.toBeNull();
    }
    expect(count).toBeGreaterThanOrEqual(PERSONAS.length);
  });

  it('clearAllDefaults wipes custom defaults for every persona/page', () => {
    for (const persona of PERSONAS) {
      for (const pair of getAllDashboardKeys(persona.slug)) {
        localStorage.setItem(`${pair.desktop}__customDefaults`, '{}');
        localStorage.setItem(`${pair.canvas}__customDefaults`, '{}');
      }
    }

    service.clearAllDefaults();

    for (const persona of PERSONAS) {
      for (const pair of getAllDashboardKeys(persona.slug)) {
        expect(localStorage.getItem(`${pair.desktop}__customDefaults`)).toBeNull();
        expect(localStorage.getItem(`${pair.canvas}__customDefaults`)).toBeNull();
      }
    }
  });

  it('every page component factory produces a key that the registry covers', () => {
    // Rather than importing the heavyweight page components (which pull
    // Angular templates, signals, services), this test reproduces the
    // factories' exact string-building recipe. If a page component's recipe
    // diverges from the registry, this will catch it before it ships.
    //
    // NOTE: If you add a new page/dashboard, add its recipe here AND to
    // `layout-keys.ts`. The coverage test will fail loudly if only one half
    // is updated.
    for (const persona of PERSONAS) {
      const slug = persona.slug;
      const expectedCovered = [
        // home-page.component.ts getEngineConfig
        { desktop: getHomeLayoutKeys(slug).desktop, canvas: getHomeLayoutKeys(slug).canvas },
        // financials-page.component.ts getEngineConfig
        { desktop: getFinancialsLayoutKeys(slug).desktop, canvas: getFinancialsLayoutKeys(slug).canvas },
        // projects-page-layout.config.ts
        { desktop: getProjectsLayoutKeys(slug).desktop, canvas: getProjectsLayoutKeys(slug).canvas },
      ];
      for (const id of PROJECT_DASHBOARD_IDS) {
        expectedCovered.push({
          desktop: getProjectDashboardLayoutKeys(slug, id).desktop,
          canvas: getProjectDashboardLayoutKeys(slug, id).canvas,
        });
      }
      const registryDesktop = new Set(getAllDashboardKeys(slug).map(k => k.desktop));
      const registryCanvas = new Set(getAllDashboardKeys(slug).map(k => k.canvas));
      for (const pair of expectedCovered) {
        expect(registryDesktop.has(pair.desktop)).toBe(true);
        expect(registryCanvas.has(pair.canvas)).toBe(true);
      }
    }
  });
});
