import type { DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import type { DashboardWidgetId } from '../../data/dashboard-data.types';
import { PROJECTS_DEFAULT_LAYOUT } from '../../data/layout-seeds/projects-default.layout';

export const TILE_IDS: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8'];

export const TILE_VISUAL_ORDER: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj6', 'proj7', 'proj4', 'proj5', 'proj8'];

export function buildProjectsLayoutConfig(
  onWidgetSelect: (id: string) => void,
  personaSlug?: () => string,
): DashboardLayoutConfig {
  return {
    ...PROJECTS_DEFAULT_LAYOUT,
    layoutStorageKey: personaSlug ? () => `${personaSlug()}:dashboard-projects:v18` : 'dashboard-projects:v18',
    canvasStorageKey: personaSlug ? () => `${personaSlug()}:canvas-layout:dashboard-projects:v21` : 'canvas-layout:dashboard-projects:v21',
    responsiveBreakpoints: [
      { minWidth: 1280, columns: 4 },
      { minWidth: 1020, columns: 3 },
      { minWidth: 848, columns: 2 },
    ],
    responsiveUniformHeight: { 2: 672 },
    desktopResizePriorityOrder: [...TILE_VISUAL_ORDER],
    desktopSnapToDefaultLayoutAfterDrag: true,
    desktopSaveDefaultLayoutSizingOnly: true,
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect,
  };
}
