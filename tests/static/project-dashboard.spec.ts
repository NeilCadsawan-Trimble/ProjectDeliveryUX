import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const TS_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.ts'),
  'utf-8',
);
const DASHBOARD_PAGE_BASE = readFileSync(
  resolve(__dir, '../../src/app/shell/services/dashboard-page-base.ts'),
  'utf-8',
);
const TEMPLATE_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.html'),
  'utf-8',
);
/** Combined TS + external template for regression scans (template moved to .html). */
const SRC = `${TS_SRC}\n${TEMPLATE_SRC}`;
const WIDGET_FRAME_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/components/widget-frame.component.ts'),
  'utf-8',
);
const TILE_CANVAS_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/subpage-tile-canvas.ts'),
  'utf-8',
);
const RECORDS_SUBPAGES_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/components/records-subpages.component.ts'),
  'utf-8',
);
const FINANCIALS_SUBPAGES_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/components/financials-subpages.component.ts'),
  'utf-8',
);
const CONFIG_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.config.ts'),
  'utf-8',
);
const CANVAS_TILE_SHELL_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/components/canvas-tile-shell.component.ts'),
  'utf-8',
);

describe('ProjectDashboardComponent (template regression)', () => {
  it('always offsets main for the collapsed rail width when not mobile (overlay, no push)', () => {
    expect(TEMPLATE_SRC).toContain('[class.pl-14]="!isMobile()"');
    expect(TEMPLATE_SRC).not.toContain('pl-60');
    expect(TEMPLATE_SRC).not.toContain('md:pl-14');
  });

  it('uses external template file', () => {
    expect(TS_SRC).toContain("templateUrl: './project-dashboard.component.html'");
    expect(TS_SRC).not.toMatch(/^\s*template:\s*`/m);
  });

  describe('resize handles', () => {
    it('uses WidgetFrameComponent which contains widget-resize-handle', () => {
      expect(SRC).toContain('<app-widget-frame');
      expect(WIDGET_FRAME_SRC).toContain('<widget-resize-handle');
    });

    it('does not have left position resize handles', () => {
      expect(SRC).not.toContain('position="left"');
      expect(WIDGET_FRAME_SRC).not.toContain('position="left"');
    });
  });

  describe('labels', () => {
    it('uses "Reset Layout" not "Reset Widgets"', () => {
      expect(SRC).toContain('Reset Layout');
      expect(SRC).not.toContain('Reset Widgets');
    });
  });

  describe('navbar fallback hamburger', () => {
    it('uses shell-navbar-hamburger for side-rail alignment', () => {
      const matches = TEMPLATE_SRC.match(/shell-navbar-hamburger/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain "Clean Up Overlaps" menu item', () => {
      expect(SRC).not.toContain('Clean Up Overlaps');
    });

    it('does NOT contain cleanupOverlaps method calls', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });

  describe('reset effect', () => {
    it('calls resetToDefaults', () => {
      expect(SRC).toContain('resetToDefaults()');
    });
  });

  describe('imports use shell/ path', () => {
    it('imports DashboardLayoutEngine from shell/services', () => {
      expect(SRC).toContain("from '../../shell/services/dashboard-layout-engine'");
    });

    it('wires CanvasResetService via DashboardPageBase', () => {
      expect(TS_SRC).toContain('extends DashboardPageBase');
      expect(DASHBOARD_PAGE_BASE).toContain("from './canvas-reset.service'");
      expect(DASHBOARD_PAGE_BASE).toContain('inject(CanvasResetService)');
    });
  });

  describe('widget-detail-transition guard', () => {
    it('uses shouldTransition() for all canvas widget-detail-transition bindings', () => {
      const matches = SRC.match(/widget-detail-transition/g) ?? [];
      expect(matches.length).toBeGreaterThan(0);
      const rawConditionPattern = /hasCanvasDetails\(\)\s*&&[^']*widget-detail-transition/;
      expect(SRC).not.toMatch(rawConditionPattern);
    });

    it('has shouldTransition method delegating to _detailMgr', () => {
      expect(SRC).toContain('shouldTransition(');
      expect(SRC).toContain('_detailMgr.shouldTransition(');
    });
  });

  describe('dynamic subnav collapse', () => {
    it('has tileSubnavWidth computed signal', () => {
      expect(SRC).toContain('tileSubnavWidth');
    });

    it('has tileContentLeft computed signal', () => {
      expect(SRC).toContain('tileContentLeft');
    });

    it('has tileContentWidth computed signal', () => {
      expect(SRC).toContain('tileContentWidth');
    });

    it('uses TILE_SUBNAV_EXPANDED and TILE_SUBNAV_COLLAPSED constants', () => {
      expect(SRC).toContain('TILE_SUBNAV_EXPANDED');
      expect(SRC).toContain('TILE_SUBNAV_COLLAPSED');
    });

    it('shifts non-locked tiles by delta when subnav collapses', () => {
      expect(SRC).toContain('deltaX');
      expect(SRC).toContain('rect.left + deltaX');
    });
  });

  describe('save as default layout', () => {
    it('calls engine.saveAsDefaultLayout', () => {
      expect(SRC).toContain('saveAsDefaultLayout');
    });

    it('has Save as Default Layout menu item', () => {
      expect(SRC).toContain('Save as Default Layout');
    });
  });

  describe('tile detail expansion (canvas)', () => {
    it('has FromTile navigation methods for all expandable sub-page types', () => {
      expect(SRC).toContain('navigateToRfiFromTile');
      expect(SRC).toContain('navigateToDailyReportFromTile');
      expect(SRC).toContain('navigateToPunchItemFromTile');
      expect(SRC).toContain('navigateToInspectionFromTile');
      expect(SRC).toContain('navigateToChangeOrderFromTile');
      expect(SRC).toContain('navigateToContractFromTile');
      expect(SRC).toContain('navigateToActionItemFromTile');
    });

    it('has closeTileDetail method for closing expanded tiles', () => {
      expect(SRC).toContain('closeTileDetail');
    });

    it('has onTileDetailHeaderMouseDown for dragging expanded tiles', () => {
      expect(SRC).toContain('onTileDetailHeaderMouseDown');
    });

    it('template references tileDetailViews() for conditional detail rendering', () => {
      const matches = SRC.match(/tileDetailViews\(\)/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(10);
    });

    it('boosts z-index to 9999 for expanded detail tiles', () => {
      expect(SRC).toContain('9999');
    });

    it('highlights active list rows with bg-primary-20', () => {
      const matches = SRC.match(/bg-primary-20.*tileDetailViews/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('TileDetailView type completeness', () => {
    it('includes all entity types in the union', () => {
      for (const type of ['rfi', 'submittal', 'dailyReport', 'punchItem', 'inspection', 'changeOrder', 'contract', 'actionItem']) {
        expect(TILE_CANVAS_SRC).toContain(`'${type}'`);
      }
    });

    it('has openDetail method', () => {
      expect(TILE_CANVAS_SRC).toContain('openDetail(');
    });
  });

  describe('per-tile-prefix canvas completeness', () => {
    const LITERAL_EXPANDABLE = [
      'tile-rfi-', 'tile-sub-', 'tile-dr-', 'tile-pl-', 'tile-ins-',
      'tile-ai-', 'tile-co-', 'tile-ct-',
    ];

    const DYNAMIC_CO_PREFIXES = ['tile-pco-', 'tile-pot-', 'tile-sco-'];

    for (const prefix of LITERAL_EXPANDABLE) {
      const escaped = prefix.replace(/-/g, '\\-');

      it(`${prefix} has tileDetailViews detail expansion`, () => {
        expect(SRC).toContain(`tileDetailViews()['${prefix}`);
      });

      it(`${prefix} has closeTileDetail wired`, () => {
        expect(SRC).toContain(`closeTileDetail('${prefix}`);
      });

      it(`${prefix} list rows have bg-primary-20 highlight`, () => {
        const pattern = new RegExp(`bg-primary-20.*tileDetailViews\\(\\)\\['${escaped}`);
        const reversePattern = new RegExp(`tileDetailViews\\(\\)\\['${escaped}[^}]*bg-primary-20`);
        expect(SRC.match(pattern) || SRC.match(reversePattern)).toBeTruthy();
      });

      it(`${prefix} has z-index 9999 boost when detail is open`, () => {
        const inlinePattern = new RegExp(`tileDetailViews\\(\\)\\['${escaped}[^?]*\\?\\s*9999`);
        if (inlinePattern.test(SRC)) {
          expect(SRC).toMatch(inlinePattern);
          return;
        }
        const usesShellWrapper = TEMPLATE_SRC.includes(`[tileId]="'${prefix}`);
        expect(usesShellWrapper).toBe(true);
        expect(CANVAS_TILE_SHELL_SRC).toMatch(/isExpanded\(\)\s*\?\s*9999/);
      });
    }

    describe('dynamic CO type prefixes (tile-pco-, tile-pot-, tile-sco-) via activeCoTilePrefix()', () => {
      it('activeCoTilePrefix maps to pco-, pot-, sco- for the three CO type pages', () => {
        expect(SRC).toContain("return 'pco-'");
        expect(SRC).toContain("return 'pot-'");
        expect(SRC).toContain("return 'sco-'");
      });

      it('template uses activeCoTilePrefix() for tileDetailViews expansion', () => {
        expect(SRC).toContain("tileDetailViews()['tile-' + activeCoTilePrefix()");
      });

      it('template uses activeCoTilePrefix() for closeTileDetail', () => {
        expect(SRC).toContain("closeTileDetail('tile-' + activeCoTilePrefix()");
      });

      it('template uses activeCoTilePrefix() for bg-primary-20 list row highlighting', () => {
        const pattern = /bg-primary-20.*tileDetailViews\(\)\['tile-' \+ activeCoTilePrefix\(\)/;
        expect(SRC).toMatch(pattern);
      });

      it('template uses activeCoTilePrefix() for z-index 9999 boost', () => {
        const pattern = /tileDetailViews\(\)\['tile-' \+ activeCoTilePrefix\(\)[^?]*\?\s*9999/;
        expect(SRC).toMatch(pattern);
      });

      for (const prefix of DYNAMIC_CO_PREFIXES) {
        it(`${prefix} is registered in subpageTileIds`, () => {
          expect(SRC).toContain(`\`${prefix}`);
        });
      }
    });

    const ALL_LITERAL_PREFIXES = [...LITERAL_EXPANDABLE, 'tile-rev-', 'tile-cf-'];

    for (const prefix of ALL_LITERAL_PREFIXES) {
      it(`${prefix} is registered in subpageTileIds and has template presence`, () => {
        expect(SRC).toContain(`\`${prefix}`);
        expect(SRC).toContain(`'${prefix}`);
      });
    }
  });

  describe('desktop grid/list view mode parity', () => {
    const RECORDS_GRID_PAGES = ['daily-reports', 'punch-items', 'inspections', 'action-items'];

    for (const page of RECORDS_GRID_PAGES) {
      it(`records-subpages: ${page} has grid view (viewMode() === 'grid')`, () => {
        expect(RECORDS_SUBPAGES_SRC).toContain(`@case ('${page}')`);
        expect(RECORDS_SUBPAGES_SRC).toContain("viewMode() === 'grid'");
      });
    }

    it('records-subpages: grid view uses tile card layout (grid grid-cols-...)', () => {
      expect(RECORDS_SUBPAGES_SRC).toContain('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
    });

    const FINANCIALS_GRID_PAGES = ['change-order-requests', 'contracts'];

    for (const page of FINANCIALS_GRID_PAGES) {
      it(`financials-subpages: ${page} has grid view (viewMode() === 'grid')`, () => {
        expect(FINANCIALS_SUBPAGES_SRC).toContain(`@case ('${page}')`);
        expect(FINANCIALS_SUBPAGES_SRC).toContain("viewMode() === 'grid'");
      });
    }

    it('financials-subpages: grid view uses tile card layout (grid grid-cols-...)', () => {
      expect(FINANCIALS_SUBPAGES_SRC).toContain('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
    });

    it('coTypeSubpage template has grid/list toggle', () => {
      expect(SRC).toContain("subnavViewMode() === 'grid'");
      const coTemplateMatch = SRC.match(/<ng-template #coTypeSubpage>([\s\S]*?)<\/ng-template>/);
      expect(coTemplateMatch).toBeTruthy();
      const coTemplate = coTemplateMatch![1];
      expect(coTemplate).toContain("subnavViewMode() === 'grid'");
      expect(coTemplate).toContain('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
    });
  });

  describe('canvas list view gating (@if subnavViewMode === list)', () => {
    it('canvas CO type list is gated by subnavViewMode', () => {
      const coCanvasSection = SRC.match(/CO type sub-pages: List view[\s\S]{0,200}/);
      expect(coCanvasSection).toBeTruthy();
      expect(coCanvasSection![0]).toContain("subnavViewMode() === 'list'");
    });

    it('canvas Change Orders list is gated by subnavViewMode', () => {
      const coSection = SRC.match(/Change Orders: List view[\s\S]{0,200}/);
      expect(coSection).toBeTruthy();
      expect(coSection![0]).toContain("subnavViewMode() === 'list'");
    });

    it('canvas Contracts list is gated by subnavViewMode', () => {
      const ctSection = SRC.match(/Contracts: List view[\s\S]{0,200}/);
      expect(ctSection).toBeTruthy();
      expect(ctSection![0]).toContain("subnavViewMode() === 'list'");
    });
  });

  describe('toolbar toggle icon correctness', () => {
    it('financials parent config has empty viewToggles (sub-pages define their own)', () => {
      const financialsMatch = CONFIG_SRC.match(/financials:\s*\{[\s\S]*?viewToggles:\s*\[([\s\S]*?)\]/);
      expect(financialsMatch).toBeTruthy();
      expect(financialsMatch![1].trim()).toBe('');
    });

    it('financials-tiles config uses apps for tile-based pages', () => {
      const tileMatch = CONFIG_SRC.match(/'financials-tiles':\s*\{[\s\S]*?viewToggles:\s*\[([\s\S]*?)\]/);
      expect(tileMatch).toBeTruthy();
      expect(tileMatch![1]).toContain("icon: 'apps'");
    });

    it('activeFinancialsSubnavConfig computed selects correct config', () => {
      expect(SRC).toContain('activeFinancialsSubnavConfig');
      expect(SRC).toContain("subnavConfigs()['financials-tiles']");
      expect(SRC).toContain("subnavConfigs()['financials']");
    });

    it('FINANCIALS_TILE_PAGES includes all tile-based financials pages', () => {
      for (const page of ['change-order-requests', 'prime-contract-change-orders', 'potential-change-orders', 'subcontract-change-orders', 'contracts']) {
        expect(SRC).toContain(`'${page}'`);
      }
      expect(SRC).toContain('FINANCIALS_TILE_PAGES');
    });

    it('template uses activeFinancialsSubnavConfig() not hardcoded financials config', () => {
      expect(SRC).toContain('activeFinancialsSubnavConfig()');
      expect(SRC).not.toContain("subnavConfigs['financials']\"");
      expect(SRC).not.toContain("subnavConfigs['financials'] }");
    });
  });

  describe('weather service initialization (regression: project routes bypass DashboardShell)', () => {
    it('imports WeatherService', () => {
      expect(TS_SRC).toContain("from '../../services/weather.service'");
    });

    it('injects WeatherService', () => {
      expect(TS_SRC).toContain('inject(WeatherService)');
    });

    it('calls weatherService.initialize() in ngOnInit', () => {
      expect(TS_SRC).toContain('weatherService.initialize()');
    });
  });

  describe('canvas mode rendering parity for financials sub-pages', () => {
    const financialsPagesMatch = TS_SRC.match(
      /FINANCIALS_PAGES_WITH_CONTENT\s*=\s*new\s+Set\(\[([^\]]+)\]\)/
    );
    const financialsPages = financialsPagesMatch
      ? financialsPagesMatch[1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''))
      : [];

    const canvasSectionMatch = TEMPLATE_SRC.match(
      /<!-- Canvas mode financials[\s\S]*?financialsSubPageHasContent|activeFinancialsPage\(\) === 'budget'[\s\S]*?financialsSubPageHasContent/
    );
    const canvasSection = canvasSectionMatch ? canvasSectionMatch[0] : TEMPLATE_SRC;

    for (const page of financialsPages) {
      it(`canvas template has rendering branch for financials page '${page}'`, () => {
        const pattern = new RegExp(`activeFinancialsPage\\(\\)\\s*===\\s*'${page}'`);
        expect(canvasSection).toMatch(pattern);
      });
    }
  });

  describe('canvas mode rendering parity for records sub-pages', () => {
    const recordsPagesMatch = TS_SRC.match(
      /RECORDS_PAGES_WITH_CONTENT\s*=\s*new\s+Set\(\[([^\]]+)\]\)/
    );
    const recordsPages = recordsPagesMatch
      ? recordsPagesMatch[1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''))
      : [];

    for (const page of recordsPages) {
      it(`canvas template has rendering branch for records page '${page}'`, () => {
        const pattern = new RegExp(`activeRecordsPage\\(\\)\\s*===\\s*'${page}'`);
        expect(TEMPLATE_SRC).toMatch(pattern);
      });
    }
  });

  describe('persona routing', () => {
    it('accesses personaService (inherited from DashboardPageBase)', () => {
      expect(TS_SRC).toContain('personaService');
    });

    it('has onPersonaSwitch method', () => {
      expect(TS_SRC).toContain('onPersonaSwitch(');
    });

    it('calls store.switchToPersona', () => {
      expect(TS_SRC).toContain('switchToPersona(');
    });

    it('userCard is a computed signal from personaService', () => {
      expect(TS_SRC).toContain('personaService.userCard()');
    });

    it('storage keys include persona slug', () => {
      expect(TS_SRC).toContain('activePersonaSlug()');
      expect(TS_SRC).toMatch(/layoutStorageKey:\s*\(\)/);
      expect(TS_SRC).toMatch(/canvasStorageKey:\s*\(\)/);
    });

    it('tile canvas storage key includes persona slug', () => {
      expect(TS_SRC).toMatch(/storageKey:.*activePersonaSlug/);
    });

    it('template passes activePersonaSlug to user-menu', () => {
      expect(SRC).toContain('[activePersonaSlug]');
    });

    it('template binds personaSwitch output', () => {
      expect(SRC).toContain('(personaSwitch)');
    });

    it('nav items use getPersonaNav for persona-driven config', () => {
      expect(TS_SRC).toContain('getPersonaNav');
      expect(TS_SRC).toContain('projectSideNav');
      expect(TS_SRC).toContain('recordsSubNav');
      expect(TS_SRC).toContain('projectFinancialsSubNav');
      expect(TS_SRC).toContain('subnavConfigs');
    });

    it('does not import static nav constants from config', () => {
      expect(TS_SRC).not.toMatch(/import.*SIDE_NAV_ITEMS.*from/);
      expect(TS_SRC).not.toMatch(/import.*RECORDS_SUB_NAV_ITEMS.*from/);
      expect(TS_SRC).not.toMatch(/import.*FINANCIALS_SUB_NAV_ITEMS.*from/);
    });
  });
});
