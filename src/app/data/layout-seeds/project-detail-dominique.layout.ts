import type { LayoutSeed } from './layout-seed.types';

export const PROJECT_DETAIL_DOMINIQUE_LAYOUT: LayoutSeed = {
  widgets: [
    'projHeader', 'risks', 'milestones', 'tasks', 'rfis', 'submittals',
    'dailyReports', 'fieldOps', 'drawing', 'weather', 'budget', 'team',
    'activity', 'changeOrders', 'contracts',
  ],
  defaultColStarts: {
    projHeader: 1, risks: 1, milestones: 1, tasks: 1, rfis: 1, submittals: 1,
    dailyReports: 1, fieldOps: 1, drawing: 12, weather: 12, budget: 12,
    team: 12, activity: 12, changeOrders: 12, contracts: 12,
  },
  defaultColSpans: {
    projHeader: 16, risks: 11, milestones: 11, tasks: 11, rfis: 11, submittals: 11,
    dailyReports: 11, fieldOps: 11, drawing: 5, weather: 5, budget: 5,
    team: 5, activity: 5, changeOrders: 5, contracts: 5,
  },
  defaultTops: {
    projHeader: 0, risks: 0, milestones: 368, tasks: 896, rfis: 1312,
    submittals: 1648, dailyReports: 1984, fieldOps: 2400,
    drawing: 0, weather: 432, budget: 768, team: 1232,
    activity: 1648, changeOrders: 2016, contracts: 2432,
  },
  defaultHeights: {
    projHeader: 0, milestones: 512, tasks: 400, risks: 352, rfis: 320,
    submittals: 320, dailyReports: 400, fieldOps: 400,
    drawing: 416, weather: 320, budget: 448, team: 400,
    activity: 352, changeOrders: 400, contracts: 384,
  },
  canvasDefaultLefts: {
    projHeader: 0, risks: 0, milestones: 0, tasks: 0, rfis: 0, submittals: 0,
    dailyReports: 0, fieldOps: 0, drawing: 891, weather: 891, budget: 891,
    team: 891, activity: 891, changeOrders: 891, contracts: 891,
  },
  canvasDefaultPixelWidths: {
    projHeader: 1280, risks: 875, milestones: 875, tasks: 875, rfis: 875, submittals: 875,
    dailyReports: 875, fieldOps: 875, drawing: 389, weather: 389, budget: 389,
    team: 389, activity: 389, changeOrders: 389, contracts: 389,
  },
  canvasDefaultTops: {
    projHeader: 16,
    risks: 208,
    milestones: 576,
    tasks: 1104,
    rfis: 1520,
    submittals: 1856,
    dailyReports: 2192,
    fieldOps: 2608,
    drawing: 208,
    weather: 640,
    budget: 976,
    team: 1440,
    activity: 1856,
    changeOrders: 2224,
    contracts: 2640,
  },
  canvasDefaultHeights: {
    projHeader: 176, risks: 352, milestones: 512, tasks: 400, rfis: 320,
    submittals: 320, dailyReports: 400, fieldOps: 400,
    drawing: 416, weather: 320, budget: 448, team: 400,
    activity: 352, changeOrders: 400, contracts: 384,
  },
};
