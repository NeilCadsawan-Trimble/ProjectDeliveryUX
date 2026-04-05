import type { DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type { DashboardWidgetId } from '../../data/dashboard-data';

export const TILE_IDS: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8'];

export const TILE_VISUAL_ORDER: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj6', 'proj7', 'proj4', 'proj5', 'proj8'];

const GAP = DashboardLayoutEngine.GAP_PX;
const HEADER_HEIGHT = 80;
const HEADER_OFFSET = HEADER_HEIGHT + GAP;

const H_HERO = 672;
const H_STD  = 384;

const ROW2 = H_HERO + GAP;
const ROW3 = ROW2 + H_STD + GAP;

export function buildProjectsLayoutConfig(
  onWidgetSelect: (id: string) => void,
): DashboardLayoutConfig {
  return {
    widgets: ['projsHeader', ...TILE_IDS],
    layoutStorageKey: 'dashboard-projects:v18',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v19',
    defaultColStarts: {
      projsHeader: 1,
      proj1: 1,  proj2: 9,   proj3: 13,
      proj6: 1,  proj7: 5,   proj4: 9,   proj5: 13,
      proj8: 1,
    },
    defaultColSpans: {
      projsHeader: 16,
      proj1: 8,  proj2: 4,  proj3: 4,
      proj4: 4,  proj5: 4,  proj6: 4,   proj7: 4,
      proj8: 4,
    },
    defaultTops: {
      projsHeader: 0,
      proj1: 0,     proj2: 0,     proj3: 0,
      proj6: ROW2,  proj7: ROW2,  proj4: ROW2,  proj5: ROW2,
      proj8: ROW3,
    },
    defaultHeights: {
      projsHeader: 0,
      proj1: H_HERO, proj2: H_HERO, proj3: H_HERO,
      proj4: H_STD,  proj5: H_STD,
      proj6: H_STD,  proj7: H_STD,
      proj8: H_STD,
    },
    canvasDefaultLefts: {
      projsHeader: 0,
      proj1: 0,   proj2: 648, proj3: 972,
      proj6: 0,   proj7: 324, proj4: 648, proj5: 972,
      proj8: 0,
    },
    canvasDefaultPixelWidths: {
      projsHeader: 1280,
      proj1: 632, proj2: 308, proj3: 308,
      proj4: 308, proj5: 308, proj6: 308, proj7: 308,
      proj8: 308,
    },
    canvasDefaultTops: {
      projsHeader: 0,
      proj1: HEADER_OFFSET,          proj2: HEADER_OFFSET,          proj3: HEADER_OFFSET,
      proj6: HEADER_OFFSET + ROW2,   proj7: HEADER_OFFSET + ROW2,
      proj4: HEADER_OFFSET + ROW2,   proj5: HEADER_OFFSET + ROW2,
      proj8: HEADER_OFFSET + ROW3,
    },
    canvasDefaultHeights: {
      projsHeader: HEADER_HEIGHT,
      proj1: H_HERO, proj2: H_HERO, proj3: H_HERO,
      proj4: H_STD,  proj5: H_STD,
      proj6: H_STD,  proj7: H_STD,
      proj8: H_STD,
    },
    responsiveBreakpoints: [
      { minWidth: 1280, columns: 4 },
      { minWidth: 1020, columns: 3 },
      { minWidth: 848, columns: 2 },
    ],
    responsiveUniformHeight: { 2: H_HERO },
    desktopResizePriorityOrder: [...TILE_VISUAL_ORDER],
    desktopSnapToDefaultLayoutAfterDrag: true,
    desktopSaveDefaultLayoutSizingOnly: true,
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect,
  };
}
