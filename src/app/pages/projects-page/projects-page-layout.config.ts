import type { DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type { DashboardWidgetId } from '../../data/dashboard-data';

export const TILE_IDS: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8'];

export const TILE_PROJECT_MAP: Record<string, number> = {
  proj1: 0, proj2: 1, proj3: 2, proj4: 3,
  proj5: 4, proj6: 5, proj7: 6, proj8: 7,
};

const HEADER_HEIGHT = 80;
const HEADER_OFFSET = HEADER_HEIGHT + DashboardLayoutEngine.GAP_PX;
const TILE_HEIGHT = 416;
const ROW_2_TOP = TILE_HEIGHT + DashboardLayoutEngine.GAP_PX;

export function buildProjectsLayoutConfig(
  onWidgetSelect: (id: string) => void,
): DashboardLayoutConfig {
  return {
    widgets: ['projsHeader', ...TILE_IDS],
    layoutStorageKey: 'dashboard-projects:v6',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v8',
    defaultColStarts: {
      projsHeader: 1,
      proj1: 1, proj2: 5, proj3: 9, proj4: 13,
      proj5: 1, proj6: 5, proj7: 9, proj8: 13,
    },
    defaultColSpans: {
      projsHeader: 16,
      proj1: 4, proj2: 4, proj3: 4, proj4: 4,
      proj5: 4, proj6: 4, proj7: 4, proj8: 4,
    },
    defaultTops: {
      projsHeader: 0,
      proj1: 0, proj2: 0, proj3: 0, proj4: 0,
      proj5: ROW_2_TOP, proj6: ROW_2_TOP, proj7: ROW_2_TOP, proj8: ROW_2_TOP,
    },
    defaultHeights: {
      projsHeader: 0,
      proj1: TILE_HEIGHT, proj2: TILE_HEIGHT, proj3: TILE_HEIGHT, proj4: TILE_HEIGHT,
      proj5: TILE_HEIGHT, proj6: TILE_HEIGHT, proj7: TILE_HEIGHT, proj8: TILE_HEIGHT,
    },
    defaultLefts: {
      projsHeader: 0,
      proj1: 0, proj2: 324, proj3: 648, proj4: 972,
      proj5: 0, proj6: 324, proj7: 648, proj8: 972,
    },
    defaultPixelWidths: {
      projsHeader: 1280,
      proj1: 308, proj2: 308, proj3: 308, proj4: 308,
      proj5: 308, proj6: 308, proj7: 308, proj8: 308,
    },
    canvasDefaultLefts: {
      projsHeader: 0,
      proj1: 0, proj2: 324, proj3: 648, proj4: 972,
      proj5: 0, proj6: 324, proj7: 648, proj8: 972,
    },
    canvasDefaultPixelWidths: {
      projsHeader: 1280,
      proj1: 308, proj2: 308, proj3: 308, proj4: 308,
      proj5: 308, proj6: 308, proj7: 308, proj8: 308,
    },
    canvasDefaultTops: {
      projsHeader: 0,
      proj1: HEADER_OFFSET, proj2: HEADER_OFFSET, proj3: HEADER_OFFSET, proj4: HEADER_OFFSET,
      proj5: HEADER_OFFSET + ROW_2_TOP, proj6: HEADER_OFFSET + ROW_2_TOP, proj7: HEADER_OFFSET + ROW_2_TOP, proj8: HEADER_OFFSET + ROW_2_TOP,
    },
    canvasDefaultHeights: {
      projsHeader: HEADER_HEIGHT,
      proj1: TILE_HEIGHT, proj2: TILE_HEIGHT, proj3: TILE_HEIGHT, proj4: TILE_HEIGHT,
      proj5: TILE_HEIGHT, proj6: TILE_HEIGHT, proj7: TILE_HEIGHT, proj8: TILE_HEIGHT,
    },
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect,
  };
}
