import type { LayoutSeed } from './layout-seed.types';

// Exported from live desktop layout
export const FINANCIALS_PAMELA_LAYOUT: LayoutSeed = {
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
    finJobCosts: 8,
    finChangeOrders: 16,
  },
  defaultTops: {
    finTitle: 0,
    finNavKpi: 80,
    finOpenEstimates: 80,
    finJobCosts: 352,
    finChangeOrders: 928,
  },
  defaultHeights: {
    finTitle: 64,
    finNavKpi: 256,
    finOpenEstimates: 832,
    finJobCosts: 560,
    finChangeOrders: 560,
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
    finNavKpi: 632,
    finOpenEstimates: 1280,
    finJobCosts: 1280,
    finChangeOrders: 1280,
  },
  canvasDefaultTops: {
    finTitle: 16,
    finNavKpi: 96,
    finOpenEstimates: 368,
    finJobCosts: 896,
    finChangeOrders: 1488,
  },
  canvasDefaultHeights: {
    finTitle: 64,
    finNavKpi: 256,
    finOpenEstimates: 512,
    finJobCosts: 576,
    finChangeOrders: 560,
  },
};
