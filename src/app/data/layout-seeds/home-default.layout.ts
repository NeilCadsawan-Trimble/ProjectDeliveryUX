import type { LayoutSeed } from './layout-seed.types';

const GAP = 16;

const KPI_HEIGHT = 200;
const ROW_1_HEIGHT = 336;
const ROW_2_HEIGHT = 336;
const ROW_3_MAX_HEIGHT = 448;
const ROW_4_HEIGHT = 384;
const ROW_5_HEIGHT = 336;
const ROW_6_HEIGHT = 336;
const ROW_7_HEIGHT = 336;

const ROW_2_TOP = ROW_1_HEIGHT + GAP;
const ROW_3_TOP = ROW_2_TOP + ROW_2_HEIGHT + GAP;
const ROW_4_TOP = ROW_3_TOP + ROW_3_MAX_HEIGHT + GAP;
const ROW_5_TOP = ROW_4_TOP + ROW_4_HEIGHT + GAP;
const ROW_6_TOP = ROW_5_TOP + ROW_5_HEIGHT + GAP;
const ROW_7_TOP = ROW_6_TOP + ROW_6_HEIGHT + GAP;
const ROW_8_TOP = ROW_7_TOP + ROW_7_HEIGHT + GAP;

const CANVAS_HEADER_HEIGHT = 80;
const H = CANVAS_HEADER_HEIGHT + GAP;

export const HOME_DEFAULT_LAYOUT: LayoutSeed = {
  widgets: [
    'homeHeader', 'homeKpis', 'homeUrgentNeeds', 'homeWeather', 'homeTimeOff', 'homeCalendar',
    'homeRfis', 'homeSubmittals', 'homeDrawings', 'homeRecentActivity',
    'homeMilestones', 'homeBudgetVariance', 'homeChangeOrders', 'homeFieldOps',
    'homeDailyReports', 'homeTeamAllocation', 'homeContracts',
  ],
  defaultColStarts: {
    homeHeader: 1, homeKpis: 1, homeUrgentNeeds: 7, homeWeather: 1, homeRfis: 7, homeSubmittals: 12,
    homeTimeOff: 1, homeCalendar: 7, homeDrawings: 1, homeRecentActivity: 7,
    homeMilestones: 1, homeBudgetVariance: 7,
    homeChangeOrders: 1, homeFieldOps: 7,
    homeDailyReports: 1, homeTeamAllocation: 7,
    homeContracts: 1,
  },
  defaultColSpans: {
    homeHeader: 16, homeKpis: 6, homeUrgentNeeds: 10, homeWeather: 6, homeRfis: 5, homeSubmittals: 5,
    homeTimeOff: 6, homeCalendar: 10, homeDrawings: 6, homeRecentActivity: 10,
    homeMilestones: 6, homeBudgetVariance: 10,
    homeChangeOrders: 6, homeFieldOps: 10,
    homeDailyReports: 6, homeTeamAllocation: 10,
    homeContracts: 16,
  },
  defaultTops: {
    homeHeader: 0, homeKpis: 0, homeUrgentNeeds: 0,
    homeWeather: ROW_2_TOP, homeRfis: ROW_2_TOP, homeSubmittals: ROW_2_TOP,
    homeTimeOff: ROW_3_TOP, homeCalendar: ROW_3_TOP,
    homeDrawings: ROW_4_TOP, homeRecentActivity: ROW_4_TOP,
    homeMilestones: ROW_5_TOP, homeBudgetVariance: ROW_5_TOP,
    homeChangeOrders: ROW_6_TOP, homeFieldOps: ROW_6_TOP,
    homeDailyReports: ROW_7_TOP, homeTeamAllocation: ROW_7_TOP,
    homeContracts: ROW_8_TOP,
  },
  defaultHeights: {
    homeHeader: 0, homeKpis: KPI_HEIGHT, homeUrgentNeeds: ROW_1_HEIGHT,
    homeWeather: ROW_2_HEIGHT, homeRfis: ROW_2_HEIGHT, homeSubmittals: ROW_2_HEIGHT,
    homeTimeOff: ROW_2_HEIGHT, homeCalendar: ROW_3_MAX_HEIGHT,
    homeDrawings: ROW_2_HEIGHT, homeRecentActivity: ROW_4_HEIGHT,
    homeMilestones: ROW_5_HEIGHT, homeBudgetVariance: ROW_5_HEIGHT,
    homeChangeOrders: ROW_6_HEIGHT, homeFieldOps: ROW_6_HEIGHT,
    homeDailyReports: ROW_7_HEIGHT, homeTeamAllocation: ROW_7_HEIGHT,
    homeContracts: ROW_5_HEIGHT,
  },
  canvasDefaultLefts: {
    homeHeader: 0, homeKpis: 0, homeUrgentNeeds: 0, homeWeather: 891, homeTimeOff: 0, homeCalendar: 0,
    homeRfis: 891, homeSubmittals: 891, homeDrawings: 1296, homeRecentActivity: 0,
    homeMilestones: 0, homeBudgetVariance: 500,
    homeChangeOrders: 0, homeFieldOps: 500,
    homeDailyReports: 0, homeTeamAllocation: 500,
    homeContracts: 0,
  },
  canvasDefaultPixelWidths: {
    homeHeader: 1280, homeKpis: 389, homeUrgentNeeds: 875, homeWeather: 389, homeTimeOff: 875, homeCalendar: 875,
    homeRfis: 389, homeSubmittals: 389, homeDrawings: 470, homeRecentActivity: 875,
    homeMilestones: 480, homeBudgetVariance: 780,
    homeChangeOrders: 480, homeFieldOps: 780,
    homeDailyReports: 480, homeTeamAllocation: 780,
    homeContracts: 1280,
  },
  canvasDefaultTops: {
    homeHeader: 0,
    homeKpis: H + 16,
    homeUrgentNeeds: H + 288,
    homeWeather: H + 288,
    homeCalendar: H + 640,
    homeSubmittals: H + 832,
    homeTimeOff: H + 1120,
    homeRfis: H + 1264,
    homeRecentActivity: H + 1568,
    homeDrawings: H + 1936,
    homeMilestones: H + 2400,
    homeBudgetVariance: H + 2400,
    homeChangeOrders: H + 2752,
    homeFieldOps: H + 2752,
    homeDailyReports: H + 3104,
    homeTeamAllocation: H + 3104,
    homeContracts: H + 3456,
  },
  canvasDefaultHeights: {
    homeHeader: CANVAS_HEADER_HEIGHT, homeKpis: 256, homeUrgentNeeds: 336, homeWeather: 528,
    homeTimeOff: 432, homeCalendar: 464, homeRfis: 432, homeSubmittals: 416, homeDrawings: 448, homeRecentActivity: 352,
    homeMilestones: 336, homeBudgetVariance: 336,
    homeChangeOrders: 336, homeFieldOps: 336,
    homeDailyReports: 336, homeTeamAllocation: 336,
    homeContracts: 336,
  },
};
