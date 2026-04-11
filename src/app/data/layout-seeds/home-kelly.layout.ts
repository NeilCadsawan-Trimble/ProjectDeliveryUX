import type { LayoutSeed } from './layout-seed.types';

export const HOME_KELLY_LAYOUT: LayoutSeed = {
  widgets: [
    'homeHeader', 'homeApKpis', 'homeInvoiceQueue', 'homePaymentSchedule',
    'homeCalendar', 'homeVendorAging', 'homeRetention', 'homeApActivity', 'homeLearning',
  ],
  defaultColStarts: {
    homeHeader: 1, homeApKpis: 1, homeInvoiceQueue: 7, homePaymentSchedule: 1,
    homeCalendar: 7, homeVendorAging: 7, homeRetention: 7, homeApActivity: 1, homeLearning: 1,
  },
  defaultColSpans: {
    homeHeader: 16, homeApKpis: 6, homeInvoiceQueue: 10, homePaymentSchedule: 6,
    homeCalendar: 10, homeVendorAging: 10, homeRetention: 10, homeApActivity: 6, homeLearning: 6,
  },
  defaultTops: {
    homeHeader: 0, homeApKpis: 0, homeInvoiceQueue: 0, homePaymentSchedule: 880,
    homeCalendar: 352, homeVendorAging: 1152, homeRetention: 816, homeApActivity: 1424, homeLearning: 400,
  },
  defaultHeights: {
    homeHeader: 0, homeApKpis: 384, homeInvoiceQueue: 336,
    homePaymentSchedule: 528, homeCalendar: 448,
    homeVendorAging: 496, homeRetention: 320, homeApActivity: 272, homeLearning: 464,
  },
  canvasDefaultLefts: {
    homeHeader: 0, homeApKpis: 0, homeInvoiceQueue: 405, homePaymentSchedule: 0,
    homeCalendar: 1134, homeVendorAging: 405, homeRetention: 1134, homeApActivity: 0, homeLearning: -405,
  },
  canvasDefaultPixelWidths: {
    homeHeader: 1280, homeApKpis: 389, homeInvoiceQueue: 713, homePaymentSchedule: 389,
    homeCalendar: 470, homeVendorAging: 713, homeRetention: 470, homeApActivity: 389, homeLearning: 389,
  },
  canvasDefaultTops: {
    homeHeader: 32, homeApKpis: 128, homeInvoiceQueue: 128, homePaymentSchedule: 512,
    homeCalendar: 128, homeVendorAging: 720, homeRetention: 592,
    homeApActivity: 1040, homeLearning: 128,
  },
  canvasDefaultHeights: {
    homeHeader: 80, homeApKpis: 368, homeInvoiceQueue: 576,
    homePaymentSchedule: 512, homeCalendar: 448, homeVendorAging: 832, homeRetention: 688,
    homeApActivity: 400, homeLearning: 752,
  },
};
