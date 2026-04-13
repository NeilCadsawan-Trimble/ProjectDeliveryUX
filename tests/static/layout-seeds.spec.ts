/**
 * Regression tests for layout seed files.
 *
 * EVERY persona has its OWN independent seed file for EVERY page.
 * NO shared "default" seeds exist anywhere. 5 personas x 4 pages = 20 seed files.
 *
 * Tests enforce:
 * - No shared default seed files exist
 * - All 20 persona-specific seed files exist
 * - Each persona seed contains the correct widget list
 * - No persona seed accidentally contains another persona's unique widgets
 * - All geometry maps have matching keys
 * - Canvas geometry is present for every widget
 * - Persona routing maps every slug to its own dedicated seed
 * - The export tool maps every persona to its own file
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(__dir, '../../src/app/data/layout-seeds');

function readSeed(filename: string): string {
  return readFileSync(resolve(SEED_DIR, filename), 'utf-8');
}

// ── All 5 personas ─────────────────────────────────────────────────────────

const PERSONAS = ['frank', 'bert', 'kelly', 'dominique', 'pamela'] as const;

// ── Expected widget lists ──────────────────────────────────────────────────

const PM_HOME_WIDGETS = [
  'homeHeader', 'homeKpis', 'homeUrgentNeeds', 'homeWeather', 'homeTimeOff',
  'homeCalendar', 'homeRfis', 'homeSubmittals', 'homeDrawings', 'homeRecentActivity',
  'homeMilestones', 'homeBudgetVariance', 'homeChangeOrders', 'homeFieldOps',
  'homeDailyReports', 'homeTeamAllocation', 'homeContracts', 'homeOpenEstimates',
];

const KELLY_HOME_WIDGETS = [
  'homeHeader', 'homeApKpis', 'homeInvoiceQueue', 'homePaymentSchedule',
  'homeCalendar', 'homeVendorAging', 'homeRetention', 'homeApActivity', 'homeLearning',
];

const PAMELA_HOME_WIDGETS = [
  'homeHeader', 'homeEstimatorKpis', 'homeOpenEstimates',
  'homeCalendar', 'homeRfis', 'homeChangeOrders', 'homeBudgetVariance', 'homeRecentActivity',
];

const STANDARD_FINANCIALS_WIDGETS = [
  'finTitle', 'finNavKpi', 'finRevenueChart', 'finOpenEstimates', 'finBudgetByProject', 'finJobCosts', 'finChangeOrders',
];

const KELLY_FINANCIALS_WIDGETS = [
  'finTitle', 'finNavKpi', 'finInvoiceQueue', 'finPaymentSchedule', 'finVendorAging',
  'finPayApps', 'finLienWaivers', 'finRetention', 'finApActivity', 'finCashOutflow',
];

const PAMELA_FINANCIALS_WIDGETS = [
  'finTitle', 'finNavKpi', 'finOpenEstimates', 'finJobCosts', 'finChangeOrders',
];

const PROJECTS_WIDGETS = [
  'projsHeader', 'projsTimeline',
  'proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8',
];

const PROJECT_DETAIL_WIDGETS = [
  'projHeader', 'risks', 'milestones', 'tasks', 'rfis', 'submittals',
  'dailyReports', 'fieldOps', 'drawing', 'weather', 'budget', 'team',
  'activity', 'changeOrders', 'contracts',
];

const KELLY_ONLY_WIDGETS = ['homeApKpis', 'homeInvoiceQueue', 'homePaymentSchedule', 'homeVendorAging', 'homeLienWaivers', 'homeRetention', 'homeApActivity', 'homeCashOutflow', 'homeLearning', 'homePayApps'];
const PAMELA_ONLY_WIDGETS = ['homeEstimatorKpis'];
const PM_ONLY_WIDGETS = ['homeUrgentNeeds', 'homeWeather', 'homeTimeOff', 'homeSubmittals', 'homeDrawings', 'homeMilestones', 'homeFieldOps', 'homeDailyReports', 'homeTeamAllocation', 'homeContracts'];

// ── Geometry map names ─────────────────────────────────────────────────────

const GEOMETRY_MAPS = [
  'defaultColStarts', 'defaultColSpans', 'defaultTops', 'defaultHeights',
  'canvasDefaultLefts', 'canvasDefaultPixelWidths',
];
const OPTIONAL_CANVAS_MAPS = ['canvasDefaultTops', 'canvasDefaultHeights'];

function extractWidgetArray(src: string): string[] {
  const match = src.match(/widgets:\s*\[([^\]]+)\]/s);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
}

function extractMapKeys(src: string, mapName: string): string[] {
  const regex = new RegExp(`${mapName}:\\s*\\{([^}]+)\\}`, 's');
  const match = src.match(regex);
  if (!match) return [];
  return match[1].split(',').map(line => line.trim().split(':')[0]?.trim()).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. NO SHARED DEFAULT SEEDS EXIST
// ═══════════════════════════════════════════════════════════════════════════

describe('No shared default seed files exist', () => {
  const FORBIDDEN = [
    'home-default.layout.ts',
    'financials-default.layout.ts',
    'projects-default.layout.ts',
    'project-detail.layout.ts',
  ];
  for (const file of FORBIDDEN) {
    it(`${file} does NOT exist`, () => {
      expect(existsSync(resolve(SEED_DIR, file))).toBe(false);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ALL 20 PERSONA SEED FILES EXIST
// ═══════════════════════════════════════════════════════════════════════════

describe('All 20 per-persona seed files exist', () => {
  for (const p of PERSONAS) {
    it(`home-${p}.layout.ts exists`, () => {
      expect(existsSync(resolve(SEED_DIR, `home-${p}.layout.ts`))).toBe(true);
    });
    it(`financials-${p}.layout.ts exists`, () => {
      expect(existsSync(resolve(SEED_DIR, `financials-${p}.layout.ts`))).toBe(true);
    });
    it(`projects-${p}.layout.ts exists`, () => {
      expect(existsSync(resolve(SEED_DIR, `projects-${p}.layout.ts`))).toBe(true);
    });
    it(`project-detail-${p}.layout.ts exists`, () => {
      expect(existsSync(resolve(SEED_DIR, `project-detail-${p}.layout.ts`))).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. HOME SEED WIDGET LISTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Home seed widget lists', () => {
  for (const p of ['frank', 'bert', 'dominique'] as const) {
    describe(`HOME_${p.toUpperCase()}_LAYOUT`, () => {
      const widgets = extractWidgetArray(readSeed(`home-${p}.layout.ts`));
      it('contains the expected 18 PM widgets', () => { expect(widgets).toEqual(PM_HOME_WIDGETS); });
      it('has >= 15 widgets', () => { expect(widgets.length).toBeGreaterThanOrEqual(15); });
      it('no Kelly-only widgets', () => { for (const w of KELLY_ONLY_WIDGETS) expect(widgets).not.toContain(w); });
      it('no Pamela-only widgets', () => { for (const w of PAMELA_ONLY_WIDGETS) expect(widgets).not.toContain(w); });
      it('uses homeKpis', () => { expect(widgets).toContain('homeKpis'); });
    });
  }

  describe('HOME_KELLY_LAYOUT', () => {
    const widgets = extractWidgetArray(readSeed('home-kelly.layout.ts'));
    it('contains exactly the expected Kelly widgets', () => { expect(widgets).toEqual(KELLY_HOME_WIDGETS); });
    it('no PM-only widgets', () => { for (const w of PM_ONLY_WIDGETS) expect(widgets).not.toContain(w); });
    it('no Pamela-only widgets', () => { for (const w of PAMELA_ONLY_WIDGETS) expect(widgets).not.toContain(w); });
  });

  describe('HOME_PAMELA_LAYOUT', () => {
    const widgets = extractWidgetArray(readSeed('home-pamela.layout.ts'));
    it('contains exactly the expected Pamela widgets', () => { expect(widgets).toEqual(PAMELA_HOME_WIDGETS); });
    it('no Kelly-only widgets', () => { for (const w of KELLY_ONLY_WIDGETS) expect(widgets).not.toContain(w); });
    it('uses homeEstimatorKpis', () => { expect(widgets).toContain('homeEstimatorKpis'); });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. FINANCIALS SEED WIDGET LISTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Financials seed widget lists', () => {
  for (const p of ['frank', 'bert', 'dominique'] as const) {
    it(`FINANCIALS_${p.toUpperCase()}_LAYOUT has standard widgets`, () => {
      expect(extractWidgetArray(readSeed(`financials-${p}.layout.ts`))).toEqual(STANDARD_FINANCIALS_WIDGETS);
    });
  }
  it('FINANCIALS_KELLY_LAYOUT has Kelly widgets', () => {
    expect(extractWidgetArray(readSeed('financials-kelly.layout.ts'))).toEqual(KELLY_FINANCIALS_WIDGETS);
  });
  it('FINANCIALS_PAMELA_LAYOUT has Pamela widgets', () => {
    expect(extractWidgetArray(readSeed('financials-pamela.layout.ts'))).toEqual(PAMELA_FINANCIALS_WIDGETS);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. PROJECTS SEED WIDGET LISTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Projects seed widget lists', () => {
  for (const p of PERSONAS) {
    it(`PROJECTS_${p.toUpperCase()}_LAYOUT has correct widgets`, () => {
      expect(extractWidgetArray(readSeed(`projects-${p}.layout.ts`))).toEqual(PROJECTS_WIDGETS);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. PROJECT DETAIL SEED WIDGET LISTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Project detail seed widget lists', () => {
  for (const p of PERSONAS) {
    it(`PROJECT_DETAIL_${p.toUpperCase()}_LAYOUT has correct widgets`, () => {
      expect(extractWidgetArray(readSeed(`project-detail-${p}.layout.ts`))).toEqual(PROJECT_DETAIL_WIDGETS);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. GEOMETRY CONSISTENCY FOR ALL 20 SEED FILES
// ═══════════════════════════════════════════════════════════════════════════

describe('Geometry consistency (all 20 seeds)', () => {
  const allSeeds: Array<{ name: string; file: string }> = [];
  for (const p of PERSONAS) {
    allSeeds.push(
      { name: `home-${p}`, file: `home-${p}.layout.ts` },
      { name: `financials-${p}`, file: `financials-${p}.layout.ts` },
      { name: `projects-${p}`, file: `projects-${p}.layout.ts` },
      { name: `project-detail-${p}`, file: `project-detail-${p}.layout.ts` },
    );
  }

  for (const { name, file } of allSeeds) {
    describe(name, () => {
      const src = readSeed(file);
      const widgets = extractWidgetArray(src);

      for (const mapName of GEOMETRY_MAPS) {
        it(`${mapName} keys match widgets`, () => {
          const keys = extractMapKeys(src, mapName);
          expect(keys.sort()).toEqual([...widgets].sort());
        });
      }

      for (const mapName of OPTIONAL_CANVAS_MAPS) {
        it(`${mapName} (if present) keys match widgets`, () => {
          if (!src.includes(mapName)) return;
          const keys = extractMapKeys(src, mapName);
          expect(keys.sort()).toEqual([...widgets].sort());
        });
      }

      it('has canvas geometry', () => {
        expect(src).toContain('canvasDefaultLefts');
        expect(src).toContain('canvasDefaultPixelWidths');
      });
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. PERSONA ROUTING — EVERY PAGE ROUTES EVERY PERSONA TO ITS OWN SEED
// ═══════════════════════════════════════════════════════════════════════════

describe('Persona routing: home-page', () => {
  const src = readFileSync(resolve(__dir, '../../src/app/pages/home-page/home-page.component.ts'), 'utf-8');
  for (const p of PERSONAS) {
    it(`imports HOME_${p.toUpperCase()}_LAYOUT`, () => { expect(src).toContain(`HOME_${p.toUpperCase()}_LAYOUT`); });
  }
  it('does NOT reference HOME_DEFAULT_LAYOUT', () => { expect(src).not.toContain('HOME_DEFAULT_LAYOUT'); });
});

describe('Persona routing: financials-page', () => {
  const src = readFileSync(resolve(__dir, '../../src/app/pages/financials-page/financials-page.component.ts'), 'utf-8');
  for (const p of PERSONAS) {
    it(`imports FINANCIALS_${p.toUpperCase()}_LAYOUT`, () => { expect(src).toContain(`FINANCIALS_${p.toUpperCase()}_LAYOUT`); });
  }
  it('does NOT reference FINANCIALS_DEFAULT_LAYOUT', () => { expect(src).not.toContain('FINANCIALS_DEFAULT_LAYOUT'); });
});

describe('Persona routing: projects-page', () => {
  const src = readFileSync(resolve(__dir, '../../src/app/pages/projects-page/projects-page.component.ts'), 'utf-8');
  for (const p of PERSONAS) {
    it(`imports PROJECTS_${p.toUpperCase()}_LAYOUT`, () => { expect(src).toContain(`PROJECTS_${p.toUpperCase()}_LAYOUT`); });
  }
  it('does NOT reference PROJECTS_DEFAULT_LAYOUT', () => { expect(src).not.toContain('PROJECTS_DEFAULT_LAYOUT'); });
});

describe('Persona routing: project-dashboard', () => {
  const src = readFileSync(resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.ts'), 'utf-8');
  for (const p of PERSONAS) {
    it(`imports PROJECT_DETAIL_${p.toUpperCase()}_LAYOUT`, () => { expect(src).toContain(`PROJECT_DETAIL_${p.toUpperCase()}_LAYOUT`); });
  }
  it('does NOT reference PROJECT_DETAIL_LAYOUT (without persona suffix)', () => {
    const noPersona = src.replace(/PROJECT_DETAIL_(FRANK|BERT|KELLY|DOMINIQUE|PAMELA)_LAYOUT/g, '');
    expect(noPersona).not.toContain('PROJECT_DETAIL_LAYOUT');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. EXPORT TOOL — MAPS EVERY PERSONA TO ITS OWN FILE
// ═══════════════════════════════════════════════════════════════════════════

describe('Export tool seed file map', () => {
  const src = readFileSync(resolve(__dir, '../../src/app/shell/layout/dashboard-shell.component.ts'), 'utf-8');

  for (const p of PERSONAS) {
    it(`maps home:${p}`, () => { expect(src).toContain(`home-${p}.layout.ts`); });
    it(`maps financials:${p}`, () => { expect(src).toContain(`financials-${p}.layout.ts`); });
    it(`maps projects:${p}`, () => { expect(src).toContain(`projects-${p}.layout.ts`); });
    it(`maps project-detail:${p}`, () => { expect(src).toContain(`project-detail-${p}.layout.ts`); });
  }

  it('no home-default.layout.ts', () => { expect(src).not.toContain('home-default.layout.ts'); });
  it('no financials-default.layout.ts', () => { expect(src).not.toContain('financials-default.layout.ts'); });
  it('no projects-default.layout.ts', () => { expect(src).not.toContain('projects-default.layout.ts'); });
  it('no project-detail.layout.ts (without persona)', () => {
    const cleaned = src.replace(/project-detail-(frank|bert|kelly|dominique|pamela)\.layout\.ts/g, '');
    expect(cleaned).not.toContain('project-detail.layout.ts');
  });
});
