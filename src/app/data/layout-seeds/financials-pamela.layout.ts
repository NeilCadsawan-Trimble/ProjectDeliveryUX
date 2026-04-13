import type { LayoutSeed } from './layout-seed.types';

const G = 16;
const TITLE_HEIGHT = 80;
const NAVKPI_HEIGHT = 512;
const NAVKPI_TOP = TITLE_HEIGHT + G;
const ESTIMATES_HEIGHT = 512;
const ESTIMATES_TOP = NAVKPI_TOP + NAVKPI_HEIGHT + G;
const JOB_COSTS_HEIGHT = 576;
const JOB_COSTS_TOP = ESTIMATES_TOP + ESTIMATES_HEIGHT + G;
const CO_HEIGHT = 560;
const CO_TOP = JOB_COSTS_TOP + JOB_COSTS_HEIGHT + G;

export const FINANCIALS_PAMELA_LAYOUT: LayoutSeed = {
  widgets: ['finTitle', 'finNavKpi', 'finOpenEstimates', 'finJobCosts', 'finChangeOrders'],
  defaultColStarts: {
    finTitle: 1, finNavKpi: 1, finOpenEstimates: 1,
    finJobCosts: 1, finChangeOrders: 1,
  },
  defaultColSpans: {
    finTitle: 16, finNavKpi: 8, finOpenEstimates: 16,
    finJobCosts: 16, finChangeOrders: 16,
  },
  defaultTops: {
    finTitle: 0,
    finNavKpi: NAVKPI_TOP,
    finOpenEstimates: ESTIMATES_TOP,
    finJobCosts: JOB_COSTS_TOP,
    finChangeOrders: CO_TOP,
  },
  defaultHeights: {
    finTitle: TITLE_HEIGHT,
    finNavKpi: NAVKPI_HEIGHT,
    finOpenEstimates: ESTIMATES_HEIGHT,
    finJobCosts: JOB_COSTS_HEIGHT,
    finChangeOrders: CO_HEIGHT,
  },
  canvasDefaultLefts: {
    finTitle: 0, finNavKpi: 0, finOpenEstimates: 0,
    finJobCosts: 0, finChangeOrders: 0,
  },
  canvasDefaultPixelWidths: {
    finTitle: 1280, finNavKpi: 640, finOpenEstimates: 1280,
    finJobCosts: 1280, finChangeOrders: 1280,
  },
  canvasDefaultTops: {
    finTitle: 16,
    finNavKpi: 16 + TITLE_HEIGHT + G,
    finOpenEstimates: 16 + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G,
    finJobCosts: 16 + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G + ESTIMATES_HEIGHT + G,
    finChangeOrders: 16 + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G + ESTIMATES_HEIGHT + G + JOB_COSTS_HEIGHT + G,
  },
  canvasDefaultHeights: {
    finTitle: TITLE_HEIGHT,
    finNavKpi: NAVKPI_HEIGHT,
    finOpenEstimates: ESTIMATES_HEIGHT,
    finJobCosts: JOB_COSTS_HEIGHT,
    finChangeOrders: CO_HEIGHT,
  },
};
