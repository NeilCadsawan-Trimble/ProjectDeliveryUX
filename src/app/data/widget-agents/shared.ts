import type {
  BillingEvent,
  BillingSchedule,
  CashFlowEntry,
  CashPosition,
  ChangeOrder,
  Contract,
  CalendarAppointment,
  DailyReport,
  Estimate,
  GLAccount,
  GLEntry,
  Inspection,
  Invoice,
  Payable,
  PayrollRecord,
  Project,
  ProjectAttentionItem,
  ProjectJobCost,
  ProjectRevenue,
  PunchListItem,
  PurchaseOrder,
  SubcontractLedgerEntry,
  Rfi,
  ActivityItem,
  BudgetHistoryPoint,
  StaffingConflict,
  Submittal,
  TimeOffRequest,
  WeatherForecast,
} from '../dashboard-data';
import type { Milestone, TeamMember, Task, Risk, ActivityEntry, Drawing, BudgetBreakdown } from '../project-data';
import type { DrawingTile } from '../drawings-data';

export interface AgentDataState {
  projects?: Project[];
  estimates?: Estimate[];
  activities?: ActivityItem[];
  attentionItems?: { title: string; subtitle: string }[];
  timeOffRequests?: TimeOffRequest[];
  projectTimeOff?: TimeOffRequest[];
  staffingConflicts?: StaffingConflict[];
  rfis?: Rfi[];
  submittals?: Submittal[];
  calendar?: CalendarAppointment[];

  projectName?: string;
  projectStatus?: string;
  budgetUsed?: string;
  budgetTotal?: string;
  budgetPct?: number;
  budgetRemaining?: string;
  budgetHealthy?: boolean;
  budgetBreakdown?: BudgetBreakdown[];
  milestones?: Milestone[];
  completedMilestones?: number;
  tasks?: Task[];
  openTaskCount?: number;
  risks?: Risk[];
  team?: TeamMember[];
  projectActivity?: ActivityEntry[];
  latestDrawing?: Drawing;
  drawings?: DrawingTile[];

  jobCostCategories?: { label: string; amount: string; pctSpend: number; pctBudget: number }[];
  subledgerCategory?: string;
  subledgerTransactions?: { date: string; description: string; vendor: string; amount: number; category: string }[];

  changeOrders?: ChangeOrder[];
  contracts?: Contract[];
  dailyReports?: DailyReport[];
  weatherForecast?: WeatherForecast[];
  projectAttentionItems?: ProjectAttentionItem[];
  budgetHistory?: BudgetHistoryPoint[];
  inspections?: Inspection[];
  punchListItems?: PunchListItem[];
  projectRevenue?: ProjectRevenue[];

  detailRfi?: Rfi;
  detailSubmittal?: Submittal;
  detailDrawing?: DrawingTile;

  jobCostDetailProject?: ProjectJobCost;

  invoices?: Invoice[];
  billingSchedules?: BillingSchedule[];
  billingEvents?: BillingEvent[];
  payables?: Payable[];
  cashFlowHistory?: CashFlowEntry[];
  cashPosition?: CashPosition;
  glAccounts?: GLAccount[];
  glEntries?: GLEntry[];
  purchaseOrders?: PurchaseOrder[];
  payrollRecords?: PayrollRecord[];
  subcontractLedger?: SubcontractLedgerEntry[];

  currentPage?: string;
  currentSubPage?: string;
}

export interface AgentAlert {
  level: 'info' | 'warning' | 'critical';
  count: number;
  label: string;
}

export interface AgentAction {
  id: string;
  label: string;
  execute: (s: AgentDataState) => string;
  route?: string;
}

export interface WidgetAgent {
  id: string;
  name: string;
  systemPrompt: string;
  suggestions: string[] | ((s: AgentDataState) => string[]);
  buildContext: (s: AgentDataState) => string;
  localRespond: (query: string, s: AgentDataState) => string;
  insight?: (s: AgentDataState) => string | null;
  alerts?: (s: AgentDataState) => AgentAlert | null;
  actions?: (s: AgentDataState) => AgentAction[];
}

export function getSuggestions(agent: WidgetAgent, state: AgentDataState): string[] {
  return typeof agent.suggestions === 'function' ? agent.suggestions(state) : agent.suggestions;
}

export function kw(q: string, ...words: string[]): boolean {
  const lower = q.toLowerCase();
  return words.some(w => lower.includes(w));
}

export function fmtProjects(projects: Project[]): string {
  return projects
    .map(
      p =>
        `  ${p.name}: ${p.status}, ${p.progress}% complete, budget ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%), due ${p.dueDate}, owner: ${p.owner}`,
    )
    .join('\n');
}

export function maxDaysPastDue(items: { dueDate: string }[]): number {
  let max = 0;
  const now = Date.now();
  for (const it of items) {
    const t = new Date(it.dueDate).getTime();
    if (!Number.isNaN(t)) {
      const days = Math.floor((now - t) / 86400000);
      if (days > max) max = days;
    }
  }
  return max;
}
