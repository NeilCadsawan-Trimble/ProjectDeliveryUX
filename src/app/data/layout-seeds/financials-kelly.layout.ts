import type { LayoutSeed } from './layout-seed.types';

const G = 16;
const STEP = (1280 + G) / 16;  // 81px -- one grid column step
const colWidth = (cols: number) => cols * STEP - G;
const colLeft = (col: number) => (col - 1) * STEP;

const TITLE_HEIGHT = 80;
const NAVKPI_TOP = TITLE_HEIGHT + G;
const KELLY_NAV_HEIGHT = 294;
const ROW_H = 384;
const SMALL_ROW_H = 352;

const R1T = NAVKPI_TOP;
const R2T = R1T + ROW_H + G;
const R3T = R2T + ROW_H + G;
const R4T = R3T + ROW_H + G;

export const FINANCIALS_KELLY_LAYOUT: LayoutSeed = {
  widgets: [
    'finTitle', 'finNavKpi',
    'finInvoiceQueue',
    'finPaymentSchedule', 'finVendorAging',
    'finPayApps', 'finLienWaivers',
    'finRetention', 'finApActivity', 'finCashOutflow',
  ],
  defaultColStarts: {
    finTitle: 1, finNavKpi: 1,
    finInvoiceQueue: 9,
    finPaymentSchedule: 1, finVendorAging: 9,
    finPayApps: 1, finLienWaivers: 9,
    finRetention: 1, finApActivity: 9, finCashOutflow: 13,
  },
  defaultColSpans: {
    finTitle: 16, finNavKpi: 8,
    finInvoiceQueue: 8,
    finPaymentSchedule: 8, finVendorAging: 8,
    finPayApps: 8, finLienWaivers: 8,
    finRetention: 8, finApActivity: 4, finCashOutflow: 4,
  },
  defaultTops: {
    finTitle: 0, finNavKpi: NAVKPI_TOP,
    finInvoiceQueue: R1T,
    finPaymentSchedule: R2T, finVendorAging: R2T,
    finPayApps: R3T, finLienWaivers: R3T,
    finRetention: R4T, finApActivity: R4T, finCashOutflow: R4T,
  },
  defaultHeights: {
    finTitle: TITLE_HEIGHT, finNavKpi: KELLY_NAV_HEIGHT,
    finInvoiceQueue: ROW_H,
    finPaymentSchedule: ROW_H, finVendorAging: ROW_H,
    finPayApps: ROW_H, finLienWaivers: ROW_H,
    finRetention: SMALL_ROW_H, finApActivity: SMALL_ROW_H, finCashOutflow: SMALL_ROW_H,
  },
  canvasDefaultLefts: {
    finTitle: 0, finNavKpi: 0,
    finInvoiceQueue: colLeft(9),
    finPaymentSchedule: 0, finVendorAging: colLeft(9),
    finPayApps: 0, finLienWaivers: colLeft(9),
    finRetention: 0, finApActivity: colLeft(9), finCashOutflow: colLeft(13),
  },
  canvasDefaultPixelWidths: {
    finTitle: colWidth(16), finNavKpi: colWidth(8),
    finInvoiceQueue: colWidth(8),
    finPaymentSchedule: colWidth(8), finVendorAging: colWidth(8),
    finPayApps: colWidth(8), finLienWaivers: colWidth(8),
    finRetention: colWidth(8), finApActivity: colWidth(4), finCashOutflow: colWidth(4),
  },
  canvasDefaultTops: {
    finTitle: G, finNavKpi: G + TITLE_HEIGHT + G,
    finInvoiceQueue: G + TITLE_HEIGHT + G,
    finPaymentSchedule: G + TITLE_HEIGHT + G + ROW_H + G,
    finVendorAging: G + TITLE_HEIGHT + G + ROW_H + G,
    finPayApps: G + TITLE_HEIGHT + G + ROW_H * 2 + G * 2,
    finLienWaivers: G + TITLE_HEIGHT + G + ROW_H * 2 + G * 2,
    finRetention: G + TITLE_HEIGHT + G + ROW_H * 3 + G * 3,
    finApActivity: G + TITLE_HEIGHT + G + ROW_H * 3 + G * 3,
    finCashOutflow: G + TITLE_HEIGHT + G + ROW_H * 3 + G * 3,
  },
  canvasDefaultHeights: {
    finTitle: TITLE_HEIGHT, finNavKpi: KELLY_NAV_HEIGHT,
    finInvoiceQueue: 336,
    finPaymentSchedule: 336, finVendorAging: 336,
    finPayApps: 336, finLienWaivers: 336,
    finRetention: 336, finApActivity: 352, finCashOutflow: 352,
  },
};
