import type { LayoutSeed } from './layout-seed.types';

// Exported from live desktop layout
export const FINANCIALS_DEFAULT_LAYOUT: LayoutSeed = {
  widgets: ['finTitle', 'finNavKpi', 'finOpenEstimates', 'finJobCosts', 'finChangeOrders'],
  defaultColStarts: {
    finTitle: 1,
    finNavKpi: 1,
    finOpenEstimates: 9,
    finJobCosts: 1,
    finChangeOrders: 1,
  },
  defaultColSpans: {
    finTitle: 16,
    finNavKpi: 8,
    finOpenEstimates: 8,
    finJobCosts: 16,
    finChangeOrders: 8,
  },
  defaultTops: {
    finTitle: 0,
    finNavKpi: 96,
    finOpenEstimates: 96,
    finJobCosts: 1440,
    finChangeOrders: 624,
  },
  defaultHeights: {
    finTitle: 80,
    finNavKpi: 512,
    finOpenEstimates: 1328,
    finJobCosts: 624,
    finChangeOrders: 800,
  },
  canvasDefaultLefts: {
    finTitle: 0,
    finNavKpi: 0,
    finOpenEstimates: 0,
    finJobCosts: 0,
    finChangeOrders: 0,
  },
  canvasDefaultPixelWidths: {
    finTitle: 1280,
    finNavKpi: 640,
    finOpenEstimates: 1280,
    finJobCosts: 1280,
    finChangeOrders: 1280,
  },
  canvasDefaultTops: {
    finTitle: 16,
    finNavKpi: 112,
    finOpenEstimates: 640,
    finJobCosts: 1168,
    finChangeOrders: 1760,
  },
  canvasDefaultHeights: {
    finTitle: 80,
    finNavKpi: 512,
    finOpenEstimates: 512,
    finJobCosts: 576,
    finChangeOrders: 560,
  },
};
