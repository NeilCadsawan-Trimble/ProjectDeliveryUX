export type { AgentAction, AgentAlert, AgentDataState, WidgetAgent } from './shared';
export { getSuggestions, OUT_OF_SCOPE_INSTRUCTION } from './shared';
export { HOME_AGENTS } from './home-agents';
export { PROJECT_AGENTS } from './project-agents';
export { FINANCIALS_AGENTS } from './financials-agents';
export { PORTFOLIO_AGENTS } from './portfolio-agents';

import { OUT_OF_SCOPE_INSTRUCTION, type WidgetAgent } from './shared';
import {
  homeCalendar,
  homeDefault,
  homeRfis,
  homeSubmittals,
  homeTimeOff,
  homeWeatherAgent,
  urgentNeedsAgent,
  homeApKpis,
  homeInvoiceQueue,
  homePaymentSchedule,
  homeVendorAging,
  homePayAppsAgent,
  homeLienWaiversAgent,
  homeRetentionAgent,
  homeApActivity,
  homeCashOutflow,
  homeLearningAgent,
} from './home-agents';
import {
  budgetAgent,
  changeOrdersAgent,
  contractsAgent,
  finBudgetByProject,
  financialsBudget,
  financialsChangeOrders,
  financialsContracts,
  financialsCostForecasts,
  financialsDefault,
  financialsJobCostDetail,
  financialsAP,
  financialsAR,
  financialsBilling,
  financialsCash,
  financialsGL,
  financialsPayroll,
  financialsPO,
  financialsRevenue,
  financialsSubledger,
  financialsContractsSub,
  financialsSubLedger,
  revenueAgent,
  weatherAgent,
} from './financials-agents';
import {
  activityAgent,
  changeOrderDetail,
  contractDetail,
  dailyReportDetail,
  dailyReportsAgent,
  drawingAgent,
  drawingDetail,
  drawingsPage,
  inspectionDetail,
  inspectionsAgent,
  milestonesAgent,
  panoramaDetail,
  projectDefault,
  punchItemDetail,
  recordsActionItems,
  recordsDailyReports,
  recordsInspections,
  recordsPunchItems,
  recordsRfis,
  recordsSubmittals,
  rfiDetail,
  risksAgent,
  submittalDetail,
  tasksAgent,
  teamAgent,
} from './project-agents';
import {
  needsAttention,
  openEstimates,
  portfolioAgent,
  projectsDefault,
  projectsWidget,
  recentActivity,
} from './portfolio-agents';

const ALL_AGENTS: Record<string, WidgetAgent> = {
  portfolio: portfolioAgent,
  homeTimeOff,
  homeCalendar,
  homeRfis,
  homeSubmittals,
  homeDefault,
  homeUrgentNeeds: urgentNeedsAgent,
  homeWeather: homeWeatherAgent,
  homeRecentActivity: recentActivity,
  homeApKpis,
  homeInvoiceQueue,
  homePaymentSchedule,
  homeVendorAging,
  homePayApps: homePayAppsAgent,
  homeLienWaivers: homeLienWaiversAgent,
  homeRetention: homeRetentionAgent,
  homeApActivity,
  homeCashOutflow,
  homeLearning: homeLearningAgent,
  projects: projectsWidget,
  openEstimates,
  recentActivity,
  needsAttention,
  projectsDefault,
  finBudgetByProject,
  financialsDefault,
  revenue: revenueAgent,
  milestones: milestonesAgent,
  tasks: tasksAgent,
  risks: risksAgent,
  drawing: drawingAgent,
  budget: budgetAgent,
  team: teamAgent,
  activity: activityAgent,
  projectDefault,
  recordsRfis,
  recordsSubmittals,
  financialsBudget,
  financialsSubledger,
  drawingsPage,
  drawingDetail,
  rfiDetail,
  submittalDetail,
  changeOrders: changeOrdersAgent,
  dailyReports: dailyReportsAgent,
  weather: weatherAgent,
  inspections: inspectionsAgent,
  recordsDailyReports,
  recordsPunchItems,
  recordsInspections,
  recordsActionItems,
  financialsChangeOrders,
  finChangeOrders: financialsChangeOrders,
  financialsRevenue,
  financialsCostForecasts,
  financialsJobCostDetail,
  financialsContracts,
  contracts: contractsAgent,
  finAccountsReceivable: financialsAR,
  financialsAR,
  finAccountsPayable: financialsAP,
  financialsAP,
  finJobBilling: financialsBilling,
  financialsBilling,
  finCashManagement: financialsCash,
  financialsCash,
  finGeneralLedger: financialsGL,
  financialsGL,
  finPurchaseOrders: financialsPO,
  financialsPO,
  finPayroll: financialsPayroll,
  financialsPayroll,
  finContracts: financialsContractsSub,
  financialsContractsSub,
  finSubcontractLedger: financialsSubLedger,
  financialsSubLedger,
  dailyReportDetail,
  inspectionDetail,
  punchItemDetail,
  changeOrderDetail,
  contractDetail,
  panoramaDetail,
};

const PAGE_DEFAULT_AGENTS: Record<string, string> = {
  home: 'homeDefault',
  projects: 'projectsDefault',
  financials: 'financialsDefault',
  'financials-job-cost-detail': 'financialsJobCostDetail',
  'project-dashboard': 'projectDefault',
};

/**
 * Agent ids treated as the page-level "general" assistant. These never receive
 * the OUT_OF_SCOPE_INSTRUCTION suffix because they ARE the routing target —
 * they must answer the question themselves rather than recursively re-route.
 */
const PAGE_DEFAULT_AGENT_IDS = new Set(Object.values(PAGE_DEFAULT_AGENTS));

const augmentedCache = new WeakMap<WidgetAgent, WidgetAgent>();

/**
 * Returns the WidgetAgent for the requested context. Widget-scoped agents are
 * wrapped so their `systemPrompt` includes {@link OUT_OF_SCOPE_INSTRUCTION},
 * teaching the LLM to call `route_to_general_assistant` when the user's
 * request is outside the widget's domain. Page-default agents are returned
 * unmodified.
 */
export function getAgent(widgetId: string | null, page: string, subContext?: string): WidgetAgent {
  if (subContext && ALL_AGENTS[subContext]) return augmentAgent(ALL_AGENTS[subContext]);
  if (widgetId && ALL_AGENTS[widgetId]) return augmentAgent(ALL_AGENTS[widgetId]);
  const fallbackId = PAGE_DEFAULT_AGENTS[page] ?? 'homeDefault';
  return ALL_AGENTS[fallbackId] ?? homeDefault;
}

function augmentAgent(agent: WidgetAgent): WidgetAgent {
  if (PAGE_DEFAULT_AGENT_IDS.has(agent.id)) return agent;
  const cached = augmentedCache.get(agent);
  if (cached) return cached;
  const augmented: WidgetAgent = {
    ...agent,
    systemPrompt: `${agent.systemPrompt}\n\n${OUT_OF_SCOPE_INSTRUCTION}`,
  };
  augmentedCache.set(agent, augmented);
  return augmented;
}
