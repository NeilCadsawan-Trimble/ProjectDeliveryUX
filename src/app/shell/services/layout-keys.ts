/**
 * Single source of truth for dashboard layout storage keys.
 *
 * Historically each page component built its own `layoutStorageKey` /
 * `canvasStorageKey` strings, and `LayoutDefaultsService` hard-coded a parallel
 * list for "Save all visited defaults" / "Clear all defaults". The two lists
 * drifted (see the dump that surfaced financials `v19/v21`, `v30/v32`, `v33/v35`
 * while `LayoutDefaultsService` still referenced `v17/v29/v31`), so global
 * operations silently skipped entire dashboards.
 *
 * Any bump to a page's storage version MUST happen here. The page components
 * consume `getHomeLayoutKeys`, `getFinancialsLayoutKeys`, etc., and
 * `LayoutDefaultsService` iterates `getAllDashboardKeys` over every persona.
 *
 * A coverage test in `layout-defaults.service.spec.ts` asserts that every
 * page-produced key appears in the registry.
 */
export interface DashboardKeyPair {
  desktop: string;
  canvas: string;
}

export type PersonaSlug = string;

/**
 * Active version numbers per page per persona. Keep these in sync with the
 * seed files; the seed *data* lives in `src/app/data/layout-seeds/` but the
 * *key version* is a UI concern (bump to invalidate user caches when a seed
 * changes shape).
 */
const HOME_VERSIONS: Record<PersonaSlug, { desktop: string; canvas: string }> = {
  frank: { desktop: 'v12', canvas: 'v19' },
  kelly: { desktop: 'v14', canvas: 'v21' },
  pamela: { desktop: 'v16', canvas: 'v23' },
};

const HOME_FALLBACK = HOME_VERSIONS['frank'];

const FINANCIALS_VERSIONS: Record<PersonaSlug, { desktop: string; canvas: string }> = {
  frank: { desktop: 'v19', canvas: 'v21' },
  kelly: { desktop: 'v30', canvas: 'v32' },
  pamela: { desktop: 'v33', canvas: 'v35' },
};

const FINANCIALS_FALLBACK = FINANCIALS_VERSIONS['frank'];

export const PROJECTS_VERSIONS = { desktop: 'v18', canvas: 'v21' };
const PROJECT_DASHBOARD_VERSIONS = { desktop: 'v6', canvas: 'v8' };

/**
 * Project IDs for which the per-project dashboard (`project-dashboard.component`)
 * is considered "reachable" -- used by `saveAllVisitedDefaults` to enumerate
 * all storage keys. Bumping the range is safe; missing an ID means global
 * operations silently skip that project's layout.
 */
export const PROJECT_DASHBOARD_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function getHomeLayoutKeys(personaSlug: PersonaSlug): DashboardKeyPair {
  const versions = HOME_VERSIONS[personaSlug] ?? HOME_FALLBACK;
  return {
    desktop: `${personaSlug}:dashboard-home-${versions.desktop}`,
    canvas: `${personaSlug}:canvas-layout:dashboard-home:${versions.canvas}`,
  };
}

export function getFinancialsLayoutKeys(personaSlug: PersonaSlug): DashboardKeyPair {
  const versions = FINANCIALS_VERSIONS[personaSlug] ?? FINANCIALS_FALLBACK;
  return {
    desktop: `${personaSlug}:dashboard-financials:${versions.desktop}`,
    canvas: `${personaSlug}:canvas-layout:dashboard-financials:${versions.canvas}`,
  };
}

export function getProjectsLayoutKeys(personaSlug: PersonaSlug): DashboardKeyPair {
  return {
    desktop: `${personaSlug}:dashboard-projects:${PROJECTS_VERSIONS.desktop}`,
    canvas: `${personaSlug}:canvas-layout:dashboard-projects:${PROJECTS_VERSIONS.canvas}`,
  };
}

export function getProjectDashboardLayoutKeys(
  personaSlug: PersonaSlug,
  projectId: number,
): DashboardKeyPair {
  return {
    desktop: `${personaSlug}:project-${projectId}-${PROJECT_DASHBOARD_VERSIONS.desktop}`,
    canvas: `${personaSlug}:canvas-layout:project-${projectId}:${PROJECT_DASHBOARD_VERSIONS.canvas}`,
  };
}

/**
 * Returns every known dashboard key pair for the given persona. Used by
 * `LayoutDefaultsService` to iterate across all dashboards when the user
 * invokes "Save all visited defaults" / "Clear all defaults".
 */
export function getAllDashboardKeys(personaSlug: PersonaSlug): DashboardKeyPair[] {
  return [
    getHomeLayoutKeys(personaSlug),
    getFinancialsLayoutKeys(personaSlug),
    getProjectsLayoutKeys(personaSlug),
    ...PROJECT_DASHBOARD_IDS.map(id => getProjectDashboardLayoutKeys(personaSlug, id)),
  ];
}
