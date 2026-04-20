import type { LayoutSeed } from './layout-seed.types';

const G = 16;
const STEP = (1280 + G) / 16;  // 81px -- one grid column step
const colWidth = (cols: number) => cols * STEP - G;

const TITLE_HEIGHT = 64;
const NAVKPI_HEIGHT = 224;
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
    finTitle: colWidth(16), finNavKpi: colWidth(8), finOpenEstimates: colWidth(16),
    finJobCosts: colWidth(16), finChangeOrders: colWidth(16),
  },
  canvasDefaultTops: {
    finTitle: G,
    finNavKpi: G + TITLE_HEIGHT + G,
    finOpenEstimates: G + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G,
    finJobCosts: G + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G + ESTIMATES_HEIGHT + G,
    finChangeOrders: G + TITLE_HEIGHT + G + NAVKPI_HEIGHT + G + ESTIMATES_HEIGHT + G + JOB_COSTS_HEIGHT + G,
  },
  canvasDefaultHeights: {
    finTitle: TITLE_HEIGHT,
    finNavKpi: NAVKPI_HEIGHT,
    finOpenEstimates: ESTIMATES_HEIGHT,
    finJobCosts: JOB_COSTS_HEIGHT,
    finChangeOrders: CO_HEIGHT,
  },
};
