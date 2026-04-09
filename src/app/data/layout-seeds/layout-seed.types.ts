/**
 * Shape of an extracted layout seed -- the geometry portion of DashboardLayoutConfig.
 * Each page x persona combination exports one of these.
 */
export interface LayoutSeed {
  widgets: string[];
  defaultColStarts: Record<string, number>;
  defaultColSpans: Record<string, number>;
  defaultTops: Record<string, number>;
  defaultHeights: Record<string, number>;
  canvasDefaultLefts: Record<string, number>;
  canvasDefaultPixelWidths: Record<string, number>;
  canvasDefaultTops?: Record<string, number>;
  canvasDefaultHeights?: Record<string, number>;
}
