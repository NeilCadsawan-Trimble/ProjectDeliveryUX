import type { LayoutSeed } from './layout-seed.types';

const GAP = 16;

const KPI_HEIGHT = 200;
const ROW_1_HEIGHT = 336;
const ROW_2_HEIGHT = 336;
const ROW_3_MAX_HEIGHT = 448;

const R2T = ROW_1_HEIGHT + GAP;
const R3T = R2T + ROW_2_HEIGHT + GAP;
const R4T = R3T + ROW_2_HEIGHT + GAP;
const R5T = R4T + 384 + GAP;

const CANVAS_HEADER_HEIGHT = 80;
const H = CANVAS_HEADER_HEIGHT + GAP;

export const HOME_KELLY_LAYOUT: LayoutSeed = {
  widgets: [
    'homeHeader', 'homeApKpis', 'homeInvoiceQueue', 'homePaymentSchedule',
    'homeCalendar', 'homeVendorAging', 'homeRetention', 'homeApActivity', 'homeLearning',
  ],
  defaultColStarts: {
    homeHeader: 1, homeApKpis: 1, homeInvoiceQueue: 7, homePaymentSchedule: 1,
    homeCalendar: 7, homeVendorAging: 1, homeRetention: 9, homeApActivity: 1, homeLearning: 1,
  },
  defaultColSpans: {
    homeHeader: 16, homeApKpis: 6, homeInvoiceQueue: 10, homePaymentSchedule: 6,
    homeCalendar: 10, homeVendorAging: 8, homeRetention: 8, homeApActivity: 16, homeLearning: 8,
  },
  defaultTops: {
    homeHeader: 0, homeApKpis: 0, homeInvoiceQueue: 0, homePaymentSchedule: R2T,
    homeCalendar: R2T, homeVendorAging: R3T, homeRetention: R3T, homeApActivity: R4T, homeLearning: R5T,
  },
  defaultHeights: {
    homeHeader: 0, homeApKpis: KPI_HEIGHT, homeInvoiceQueue: ROW_1_HEIGHT,
    homePaymentSchedule: ROW_2_HEIGHT, homeCalendar: ROW_3_MAX_HEIGHT,
    homeVendorAging: ROW_2_HEIGHT, homeRetention: ROW_2_HEIGHT, homeApActivity: 384, homeLearning: 480,
  },
  canvasDefaultLefts: {
    homeHeader: 0, homeApKpis: 0, homeInvoiceQueue: 0, homePaymentSchedule: 891,
    homeCalendar: 0, homeVendorAging: 891, homeRetention: 640, homeApActivity: 0, homeLearning: 0,
  },
  canvasDefaultPixelWidths: {
    homeHeader: 1280, homeApKpis: 389, homeInvoiceQueue: 875, homePaymentSchedule: 389,
    homeCalendar: 875, homeVendorAging: 640, homeRetention: 640, homeApActivity: 1280, homeLearning: 640,
  },
  canvasDefaultTops: {
    homeHeader: 0, homeApKpis: H + 16, homeInvoiceQueue: H + 288, homePaymentSchedule: H + 288,
    homeCalendar: H + 640, homeVendorAging: H + 1120, homeRetention: H + 1120,
    homeApActivity: H + 1472, homeLearning: H + 1840,
  },
  canvasDefaultHeights: {
    homeHeader: CANVAS_HEADER_HEIGHT, homeApKpis: 256, homeInvoiceQueue: 336,
    homePaymentSchedule: 336, homeCalendar: 464, homeVendorAging: 336, homeRetention: 336,
    homeApActivity: 352, homeLearning: 480,
  },
};
