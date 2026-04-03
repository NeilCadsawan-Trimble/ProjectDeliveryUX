import type { DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type { DashboardWidgetId } from '../../data/dashboard-data';

export const TILE_IDS: DashboardWidgetId[] = ['proj1', 'proj2', 'proj3', 'proj4', 'proj5', 'proj6', 'proj7', 'proj8'];

/** Tiles ordered by urgency: critical count DESC, warning count DESC, status severity DESC, budget% DESC */
export const TILE_PROJECT_MAP: Record<string, number> = {
  proj1: 2, // Downtown Transit Hub    – 3 crit, Overdue, 95% budget
  proj2: 1, // Harbor View Condominiums – 2 crit + 1 warn, At Risk, 82%
  proj3: 6, // Sunset Ridge Apartments  – 1 crit + 1 warn, Overdue, 55%
  proj4: 0, // Riverside Office Complex – 1 crit + 1 warn, On Track, 68%
  proj5: 5, // Metro Bridge Rehab       – 1 warn, On Track, 72%
  proj6: 3, // Lakeside Medical Center  – 1 warn, On Track, 30%
  proj7: 7, // Industrial Park Warehouse – 1 warn, On Track, 18%
  proj8: 4, // Westfield Shopping Center – info only, Planning, 8%
};

const GAP = DashboardLayoutEngine.GAP_PX;
const HEADER_HEIGHT = 80;
const HEADER_OFFSET = HEADER_HEIGHT + GAP;

const H_HERO = 672;  // proj1-3: top row (hero + flanking tiles, all same height)
const H_STD  = 384;  // proj4-8: middle and bottom row tiles

const ROW2 = H_HERO + GAP;          // 688  – middle row (proj6, proj7, proj4, proj5)
const ROW3 = ROW2 + H_STD + GAP;    // 1088 – bottom row (proj8)

export function buildProjectsLayoutConfig(
  onWidgetSelect: (id: string) => void,
): DashboardLayoutConfig {
  return {
    widgets: ['projsHeader', ...TILE_IDS],
    layoutStorageKey: 'dashboard-projects:v16',
    canvasStorageKey: 'canvas-layout:dashboard-projects:v17',
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
      proj1: 0,   proj2: 632, proj3: 948,
      proj6: 0,   proj7: 316, proj4: 632, proj5: 948,
      proj8: 0,
    },
    canvasDefaultPixelWidths: {
      projsHeader: 1248,
      proj1: 616, proj2: 300, proj3: 300,
      proj4: 300, proj5: 300, proj6: 300, proj7: 300,
      proj8: 300,
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
    minColSpan: 4,
    canvasGridMinHeightOffset: 200,
    savesDesktopOnMobile: true,
    onWidgetSelect,
  };
}
