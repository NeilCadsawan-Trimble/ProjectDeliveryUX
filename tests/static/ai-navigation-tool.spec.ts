/**
 * Static test for the `navigate_to_page` AI tool. Ensures the destination
 * catalog stays aligned with:
 *   - financials child routes in app.routes.ts
 *   - SIDE_NAV_ITEMS, RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS in project-dashboard.config.ts
 *   - DetailView union types in canvas-detail-manager.ts
 *
 * If any of these drift, navigation tool calls from the AI will silently fail or
 * route to the wrong page.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '../..');

const TOOLS_SRC = readFileSync(resolve(root, 'src/app/services/ai-tools.service.ts'), 'utf-8');
const ROUTES_SRC = readFileSync(resolve(root, 'src/app/app.routes.ts'), 'utf-8');
const PROJECT_CFG_SRC = readFileSync(
  resolve(root, 'src/app/pages/project-dashboard/project-dashboard.config.ts'),
  'utf-8',
);
const CANVAS_DETAIL_SRC = readFileSync(
  resolve(root, 'src/app/shell/services/canvas-detail-manager.ts'),
  'utf-8',
);

/** Extract a string-array literal from the tool source by const name. */
function extractStringConstArray(src: string, name: string): string[] {
  const start = src.indexOf(`${name} = [`);
  expect(start, `${name} should be defined`).toBeGreaterThan(-1);
  const open = src.indexOf('[', start);
  const close = src.indexOf(']', open);
  const body = src.substring(open + 1, close);
  return [...body.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

const NAVIGATION_DESTINATIONS = extractStringConstArray(TOOLS_SRC, 'NAVIGATION_DESTINATIONS');
const SUPPORTED_RECORD_DETAIL_DESTINATIONS = extractStringConstArray(
  TOOLS_SRC,
  'SUPPORTED_RECORD_DETAIL_DESTINATIONS',
);
const RECORDS_SUBPAGE_VALUES = extractStringConstArray(TOOLS_SRC, 'RECORDS_SUBPAGE_VALUES');
const FINANCIALS_SUBPAGE_VALUES = extractStringConstArray(TOOLS_SRC, 'FINANCIALS_SUBPAGE_VALUES');
const PROJECT_SECTION_DESTINATIONS = extractStringConstArray(TOOLS_SRC, 'PROJECT_SECTION_DESTINATIONS');
const FINANCIALS_DETAIL_DESTINATIONS = extractStringConstArray(
  TOOLS_SRC,
  'FINANCIALS_DETAIL_DESTINATIONS',
);
const RECORD_DETAIL_DESTINATIONS = extractStringConstArray(TOOLS_SRC, 'RECORD_DETAIL_DESTINATIONS');

/** Extract NavItem `value` strings from a NavItem[] array literal. */
function extractNavItemValues(src: string, exportName: string): string[] {
  const start = src.indexOf(`${exportName}: NavItem[] = [`);
  expect(start, `${exportName} should be defined`).toBeGreaterThan(-1);
  const close = src.indexOf('];', start);
  const body = src.substring(start, close);
  return [...body.matchAll(/value:\s*'([^']+)'/g)].map(m => m[1]);
}

describe('navigate_to_page tool destination catalog', () => {
  /** NAVIGATION_DESTINATIONS uses spread syntax, so the explicit literal only
   * holds the three top-level entries. Reconstruct the full effective set. */
  const allDestinations = new Set<string>([
    ...NAVIGATION_DESTINATIONS,
    ...FINANCIALS_DETAIL_DESTINATIONS,
    ...PROJECT_SECTION_DESTINATIONS,
    ...RECORD_DETAIL_DESTINATIONS,
  ]);

  it('includes all top-level, financials-detail, project-section, and record-detail destinations', () => {
    expect(allDestinations).toContain('home');
    expect(allDestinations).toContain('projects');
    expect(allDestinations).toContain('financials');
    expect(FINANCIALS_DETAIL_DESTINATIONS.length).toBeGreaterThan(0);
    expect(PROJECT_SECTION_DESTINATIONS.length).toBeGreaterThan(0);
    expect(RECORD_DETAIL_DESTINATIONS.length).toBeGreaterThan(0);
  });

  it('every financials child route in app.routes.ts has a matching financials-* destination', () => {
    // Scope the search to the financials children block.
    const finStart = ROUTES_SRC.indexOf("path: 'financials'");
    expect(finStart, 'financials route block should exist').toBeGreaterThan(-1);
    const finEnd = ROUTES_SRC.indexOf('],', ROUTES_SRC.indexOf('children: [', finStart));
    const finBlock = ROUTES_SRC.substring(finStart, finEnd);

    const childPathRegex = /path:\s*'([a-z-]+)\/:[a-z]+'/g;
    const childPaths = new Set<string>();
    for (const match of finBlock.matchAll(childPathRegex)) {
      childPaths.add(match[1]);
    }
    expect(childPaths.size, 'should find at least one financials child route').toBeGreaterThan(0);

    const destinationPaths = new Set(
      FINANCIALS_DETAIL_DESTINATIONS.map(d => d.replace(/^financials-/, '')),
    );

    for (const path of childPaths) {
      expect(destinationPaths, `app.routes.ts financials child "${path}" should map to a financials-* destination`).toContain(path);
    }
  });

  it('every SIDE_NAV_ITEMS value has a matching project-* destination', () => {
    const sideNavValues = extractNavItemValues(PROJECT_CFG_SRC, 'SIDE_NAV_ITEMS');
    expect(sideNavValues.length).toBeGreaterThan(0);
    for (const value of sideNavValues) {
      const expected = `project-${value}`;
      expect(PROJECT_SECTION_DESTINATIONS, `SIDE_NAV_ITEMS value "${value}" should map to "${expected}"`).toContain(expected);
    }
  });

  it('every RECORDS_SUB_NAV_ITEMS value is in the recordsSubpage enum', () => {
    const recordValues = extractNavItemValues(PROJECT_CFG_SRC, 'RECORDS_SUB_NAV_ITEMS');
    expect(recordValues.length).toBeGreaterThan(0);
    for (const value of recordValues) {
      expect(RECORDS_SUBPAGE_VALUES, `Records sub-nav "${value}" must appear in recordsSubpage enum`).toContain(value);
    }
  });

  it('every FINANCIALS_SUB_NAV_ITEMS value is in the financialsSubpage enum', () => {
    const finValues = extractNavItemValues(PROJECT_CFG_SRC, 'FINANCIALS_SUB_NAV_ITEMS');
    expect(finValues.length).toBeGreaterThan(0);
    for (const value of finValues) {
      expect(FINANCIALS_SUBPAGE_VALUES, `Financials sub-nav "${value}" must appear in financialsSubpage enum`).toContain(value);
    }
  });
});

describe('navigate_to_page supported-record-detail set', () => {
  /** DetailView union types: 'rfi' | 'submittal' | ... */
  const detailViewTypes: string[] = (() => {
    const start = CANVAS_DETAIL_SRC.indexOf('export type DetailView');
    // The union ends at the first `};` followed by a newline (last variant's closer).
    const endMatch = CANVAS_DETAIL_SRC.substring(start).match(/\}\s*;\s*\n/);
    const end = endMatch ? start + endMatch.index! + endMatch[0].length : start + 600;
    const body = CANVAS_DETAIL_SRC.substring(start, end);
    return [...body.matchAll(/type:\s*'([^']+)'/g)].map(m => m[1]);
  })();

  /** Map of record-* and financials-* destinations to their DetailView type. */
  const SUPPORTED_TO_TYPE: Record<string, string> = {
    'record-rfi': 'rfi',
    'record-submittal': 'submittal',
    'record-daily-report': 'dailyReport',
    'record-inspection': 'inspection',
    'record-punch-item': 'punchItem',
    'record-drawing': 'drawing',
    'record-panorama': 'panorama',
    'financials-change-orders': 'changeOrder',
    'financials-contracts': 'contract',
  };

  it('extracts at least 9 DetailView types from canvas-detail-manager.ts', () => {
    expect(detailViewTypes.length).toBeGreaterThanOrEqual(9);
  });

  it('every supported destination maps to exactly one DetailView type', () => {
    for (const dest of SUPPORTED_RECORD_DETAIL_DESTINATIONS) {
      const expected = SUPPORTED_TO_TYPE[dest];
      expect(expected, `Missing DetailView type mapping for "${dest}"`).toBeDefined();
      expect(detailViewTypes, `DetailView union should include "${expected}" (for ${dest})`).toContain(expected);
    }
  });

  it('every DetailView type is reachable through some supported destination', () => {
    const reachable = new Set(Object.values(SUPPORTED_TO_TYPE));
    for (const t of detailViewTypes) {
      expect(reachable, `DetailView type "${t}" must be reachable from a record-* or supported financials-* destination`).toContain(t);
    }
  });
});

describe('navigate_to_page tool wiring', () => {
  it('navigate_to_page builder is registered with autoExecute: true', () => {
    expect(TOOLS_SRC).toMatch(/name:\s*'navigate_to_page'/);
    const builderStart = TOOLS_SRC.indexOf("name: 'navigate_to_page'");
    const builderEnd = TOOLS_SRC.indexOf('execute:', builderStart);
    const builderBody = TOOLS_SRC.substring(builderStart, builderEnd);
    expect(builderBody).toMatch(/autoExecute:\s*true/);
  });

  it('AiToolsService injects Router and PersonaService', () => {
    expect(TOOLS_SRC).toMatch(/inject\(Router\)/);
    expect(TOOLS_SRC).toMatch(/inject\(PersonaService\)/);
  });

  it('exposes getTool() helper for the panel controller', () => {
    expect(TOOLS_SRC).toMatch(/getTool\(name:\s*string\)/);
  });

  it('exposes resolveNavigation() for the canvas-Home choice prompt', () => {
    expect(TOOLS_SRC).toMatch(/resolveNavigation\(args/);
  });
});

describe('panel controller honors autoExecute and exposes navigation choice handlers', () => {
  const CONTROLLER_SRC = readFileSync(
    resolve(root, 'src/app/shell/services/ai-panel-controller.ts'),
    'utf-8',
  );

  it('reads autoExecute from getTool() before queuing pendingAction', () => {
    expect(CONTROLLER_SRC).toMatch(/getTool\(toolName\)/);
    expect(CONTROLLER_SRC).toMatch(/autoExecute/);
  });

  it('exposes chooseNavigation and chooseCanvasOverlay methods', () => {
    expect(CONTROLLER_SRC).toMatch(/chooseNavigation\(/);
    expect(CONTROLLER_SRC).toMatch(/chooseCanvasOverlay\(/);
  });

  it('only offers canvas-overlay choice on Home + canvas + supported destination', () => {
    expect(CONTROLLER_SRC).toMatch(/isSupportedRecordDetail/);
    expect(CONTROLLER_SRC).toMatch(/viewMode\s*!==\s*'canvas'/);
  });
});

describe('AiContext exposes persona, view mode, and route', () => {
  const AI_SRC = readFileSync(resolve(root, 'src/app/services/ai.service.ts'), 'utf-8');
  it('AiContext interface includes personaSlug, viewMode, currentRoute', () => {
    expect(AI_SRC).toMatch(/personaSlug\?:\s*string/);
    expect(AI_SRC).toMatch(/viewMode\?:\s*ViewMode/);
    expect(AI_SRC).toMatch(/currentRoute\?:\s*string/);
  });
  it('buildContext populates the new fields by default', () => {
    expect(AI_SRC).toMatch(/personaSlug:\s*this\.personaService\.activePersonaSlug\(\)/);
    expect(AI_SRC).toMatch(/viewMode:\s*this\.personaService\.currentViewMode\(\)/);
    expect(AI_SRC).toMatch(/currentRoute:\s*this\.router\.url/);
  });
});

describe('CanvasDetailManager freestanding overlay support', () => {
  it('exposes openFreestandingDetail and freestandingIds signal', () => {
    expect(CANVAS_DETAIL_SRC).toMatch(/openFreestandingDetail\(/);
    expect(CANVAS_DETAIL_SRC).toMatch(/freestandingIds\s*=\s*signal/);
  });

  it('closeDetail handles synthetic ids by calling removeTransientWidget', () => {
    expect(CANVAS_DETAIL_SRC).toMatch(/_freestandingIds\.has\(widgetId\)/);
    expect(CANVAS_DETAIL_SRC).toMatch(/removeTransientWidget\?\.\(widgetId\)/);
  });
});
