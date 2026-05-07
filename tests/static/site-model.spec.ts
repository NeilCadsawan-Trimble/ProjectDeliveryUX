import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');

const DASHBOARD_TEMPLATE = resolve(
  ROOT,
  'src/app/pages/project-dashboard/project-dashboard.component.html',
);
const DASHBOARD_COMPONENT = resolve(
  ROOT,
  'src/app/pages/project-dashboard/project-dashboard.component.ts',
);
const SITE_MODEL_COMPONENT = resolve(
  ROOT,
  'src/app/pages/project-dashboard/components/project-site-model.component.ts',
);
const VIEWPORT_TIER = resolve(
  ROOT,
  'src/app/pages/project-dashboard/components/project-site-model-viewport-tier.ts',
);
const GIZMO = resolve(
  ROOT,
  'src/app/pages/project-dashboard/components/orientation-gizmo.component.ts',
);
const INDEX_HTML = resolve(ROOT, 'src/index.html');

/**
 * Extract the Angular template literal between the first `template: \`` and its
 * matching closing backtick. Cheap, single-component-per-file scanner. Good
 * enough for static template assertions on the dashboard HTML and the
 * dedicated site-model component.
 */
function readDashboardCase(name: string): string {
  const html = readFileSync(DASHBOARD_TEMPLATE, 'utf-8');
  const startToken = `@case ('${name}')`;
  const start = html.indexOf(startToken);
  if (start === -1) throw new Error(`@case ('${name}') block not found in dashboard template`);
  // Find the matching closing brace by counting depth from the first `{` after
  // the case token. We deliberately don't try to parse the full grammar --
  // we just need enough text to assert on the wired widgets.
  const braceStart = html.indexOf('{', start);
  let depth = 1;
  let i = braceStart + 1;
  while (i < html.length && depth > 0) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return html.slice(start, i);
}

describe('Project Models sub-page: 3D viewer wiring', () => {
  it('site-model component file exists in expected location', () => {
    expect(existsSync(SITE_MODEL_COMPONENT)).toBe(true);
  });

  it('viewport tier helper exists alongside the component', () => {
    expect(existsSync(VIEWPORT_TIER)).toBe(true);
  });

  it('orientation gizmo component exists alongside the component', () => {
    expect(existsSync(GIZMO)).toBe(true);
  });

  it('site-model component declares the expected selector', () => {
    const src = readFileSync(SITE_MODEL_COMPONENT, 'utf-8');
    expect(src).toMatch(/selector:\s*['"]app-project-site-model['"]/);
  });

  it('site-model component imports DrawingMarkupToolbarComponent from shared/detail (not a duplicate)', () => {
    const src = readFileSync(SITE_MODEL_COMPONENT, 'utf-8');
    expect(src).toMatch(/from\s+['"](?:\.\.\/)+shared\/detail\/drawing-markup-toolbar\.component['"]/);
  });

  it('dashboard component imports and registers ProjectSiteModelComponent', () => {
    const src = readFileSync(DASHBOARD_COMPONENT, 'utf-8');
    expect(src).toContain('ProjectSiteModelComponent');
    expect(src).toMatch(/imports:\s*\[[^\]]*ProjectSiteModelComponent[^\]]*\]/);
  });

  it('canvas branch of @case ("models") renders <app-project-site-model> (not the empty state)', () => {
    const block = readDashboardCase('models');
    // The canvas branch is gated on isSubpageCanvasActive(); both branches
    // must wire the new component to satisfy view-mode parity.
    const canvasMatches = block.match(/<app-project-site-model[^>]*\/>/g) ?? [];
    expect(canvasMatches.length).toBeGreaterThanOrEqual(2);
    expect(block).not.toMatch(/<app-empty-state[^>]*Project Models/);
  });

  it('both view-mode branches bind [projectId]', () => {
    const block = readDashboardCase('models');
    const projectIdBindings = block.match(/\[projectId\]="projectId\(\)"/g) ?? [];
    expect(projectIdBindings.length).toBeGreaterThanOrEqual(2);
  });

  it('index.html loads model-viewer and pannellum from CDN', () => {
    const html = readFileSync(INDEX_HTML, 'utf-8');
    expect(html).toMatch(/ajax\.googleapis\.com\/ajax\/libs\/model-viewer\/3\.5\.0\/model-viewer\.min\.js/);
    expect(html).toMatch(/cdn\.jsdelivr\.net\/npm\/pannellum@2\.5\.6\/build\/pannellum\.css/);
    expect(html).toMatch(/cdn\.jsdelivr\.net\/npm\/pannellum@2\.5\.6\/build\/pannellum\.js/);
  });

  it('demo asset references resolve to files committed in /public', () => {
    const src = readFileSync(SITE_MODEL_COMPONENT, 'utf-8');
    const modelMatch = src.match(/demoModelUrl\s*=\s*['"](\/[^'"]+\.glb)['"]/);
    expect(modelMatch?.[1], 'demoModelUrl must point at a .glb in public/').toBeDefined();
    const modelPath = modelMatch![1];
    expect(existsSync(resolve(ROOT, 'public' + modelPath))).toBe(true);

    const panoMatch = src.match(/panoUrl:\s*['"](\/panoramas\/[^'"]+)['"]/);
    expect(panoMatch?.[1], 'first pano scene must point at a local file').toBeDefined();
    expect(existsSync(resolve(ROOT, 'public' + panoMatch![1]))).toBe(true);
  });

  it('site-model component does not contain debug telemetry fetch (security regression)', () => {
    const src = readFileSync(SITE_MODEL_COMPONENT, 'utf-8');
    expect(src).not.toMatch(/127\.0\.0\.1:7870/);
    expect(src).not.toMatch(/emitDebugLog/);
  });
});
