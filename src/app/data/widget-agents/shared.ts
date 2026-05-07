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
  ProjectWeather,
  WeatherForecast,
} from '../dashboard-data';
import type { Milestone, TeamMember, Task, Risk, ActivityEntry, Drawing, BudgetBreakdown } from '../project-data';
import type { DrawingTile, SiteCapture } from '../drawings-data';
import type {
  ApInvoice,
  ApVendor,
  ApPayApplication,
  ApLienWaiver,
  ApRetentionRecord,
  ApActivityItem,
  ApPaymentScheduleItem,
  LearningPlan,
} from '../dashboard-data.types';

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

  apInvoices?: ApInvoice[];
  apVendors?: ApVendor[];
  apPayApplications?: ApPayApplication[];
  apLienWaivers?: ApLienWaiver[];
  apRetention?: ApRetentionRecord[];
  apActivities?: ApActivityItem[];
  apPaymentSchedule?: ApPaymentScheduleItem[];
  learningPlan?: LearningPlan;

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
  detailDailyReport?: DailyReport;
  detailInspection?: Inspection;
  detailPunchItem?: PunchListItem;
  detailChangeOrder?: ChangeOrder;
  detailContract?: Contract;
  detailPanorama?: SiteCapture;

  jobCostDetailProject?: ProjectJobCost;
  allJobCosts?: ProjectJobCost[];
  allWeatherData?: ProjectWeather[];

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

  personaSlug?: string;
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

/**
 * System-prompt suffix appended to every WIDGET-SCOPED agent (not page-default
 * agents). Tells the LLM to call the `route_to_general_assistant` tool when
 * the user's request is outside the widget's domain instead of attempting to
 * answer with stale or irrelevant context.
 */
export const OUT_OF_SCOPE_INSTRUCTION = [
  'IMPORTANT: If the user\'s request is clearly outside your widget\'s scope',
  '(different domain, different page, or an app-wide question that this widget cannot answer),',
  'do NOT attempt to answer. Instead, call the `route_to_general_assistant` tool with',
  '`query` set to the user\'s original message verbatim and a brief `reason`.',
  'Examples of out-of-scope: weather questions to an RFI agent, financial summaries to a calendar agent,',
  'navigation requests that have nothing to do with this widget\'s data.',
  'For in-scope questions, answer normally — do NOT route routine queries.',
].join(' ');

export function kw(q: string, ...words: string[]): boolean {
  const lower = q.toLowerCase();
  return words.some(w => lower.includes(w));
}

export function fmtProjects(projects: Project[]): string {
  return projects
    .map(
      p =>
        `  ${p.name} (${p.city}, ${p.state}): client ${p.client}, ${p.status}, ${p.progress}% complete, budget ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%), due ${p.dueDate}, owner: ${p.owner}`,
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

function fmtMoney(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${Math.round(abs)}`;
}

/**
 * Builds an exhaustive, single-string snapshot of every collection in the
 * AgentDataState that has data. Used by page-level "default" agents
 * (home, projects, financials) so the AI Assistant can answer any question
 * spanning projects, locations, financial entities, field ops, AP, AR, etc.
 *
 * Per-widget agents still produce their own focused context when a widget is
 * selected; this helper exists for the page-default fallback.
 */
export function buildFullDataContext(s: AgentDataState): string {
  const sections: string[] = [];

  if (s.personaSlug) sections.push(`Active persona: ${s.personaSlug}`);
  if (s.currentPage) sections.push(`Current page: ${s.currentPage}${s.currentSubPage ? ' / ' + s.currentSubPage : ''}`);

  const projects = s.projects ?? [];
  if (projects.length) {
    sections.push(
      `Projects (${projects.length}):\n${projects
        .map(
          p =>
            `  [${p.id}] ${p.name} (slug: ${p.slug}) -- ${p.city}, ${p.state}; client: ${p.client}; status: ${p.status}; progress: ${p.progress}%; budget: ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%); due: ${p.dueDate}; owner: ${p.owner}`,
        )
        .join('\n')}`,
    );

    const stateGroups = new Map<string, string[]>();
    for (const p of projects) {
      if (!p.state) continue;
      const arr = stateGroups.get(p.state) ?? [];
      arr.push(`${p.name} (${p.city})`);
      stateGroups.set(p.state, arr);
    }
    if (stateGroups.size) {
      sections.push(
        `Projects grouped by state:\n${[...stateGroups.entries()]
          .map(([st, names]) => `  ${st} (${names.length}): ${names.join('; ')}`)
          .join('\n')}`,
      );
    }
  }

  const estimates = s.estimates ?? [];
  if (estimates.length) {
    sections.push(
      `Estimates (${estimates.length}):\n${estimates
        .map(
          e =>
            `  ${e.id}: ${e.project} (${e.client}) -- ${e.value} ${e.type}; status: ${e.status}; requestedBy: ${e.requestedBy}; due: ${e.dueDate}; ${e.daysLeft}d left`,
        )
        .join('\n')}`,
    );
  }

  const rfis = s.rfis ?? [];
  if (rfis.length) {
    sections.push(
      `RFIs (${rfis.length}):\n${rfis
        .map(r => `  ${r.number}: ${r.subject} -- project: ${r.project}; assignee: ${r.assignee}; status: ${r.status}; due: ${r.dueDate}`)
        .join('\n')}`,
    );
  }

  const subs = s.submittals ?? [];
  if (subs.length) {
    sections.push(
      `Submittals (${subs.length}):\n${subs
        .map(x => `  ${x.number}: ${x.subject} -- project: ${x.project}; assignee: ${x.assignee}; status: ${x.status}; due: ${x.dueDate}`)
        .join('\n')}`,
    );
  }

  const cos = s.changeOrders ?? [];
  if (cos.length) {
    sections.push(
      `Change orders (${cos.length}):\n${cos
        .map(c => `  ${c.id}: ${c.project} (${c.coType}) -- ${c.description}; ${fmtMoney(c.amount)}; status: ${c.status}; reason: ${c.reason}; requestedBy: ${c.requestedBy} on ${c.requestDate}`)
        .join('\n')}`,
    );
  }

  const contracts = s.contracts ?? [];
  if (contracts.length) {
    sections.push(
      `Contracts (${contracts.length}):\n${contracts
        .map(c => `  ${c.id} ${c.title} (${c.contractType}) -- vendor: ${c.vendor}; project: ${c.project}; original ${fmtMoney(c.originalValue)} / revised ${fmtMoney(c.revisedValue)}; status: ${c.status}; ${c.startDate} → ${c.endDate}; retainage ${c.retainage}%`)
        .join('\n')}`,
    );
  }

  const calendar = s.calendar ?? [];
  if (calendar.length) {
    sections.push(
      `Calendar (${calendar.length}):\n${calendar
        .map(a => `  ${a.title} -- ${a.date.toLocaleDateString()} ${String(a.startHour).padStart(2, '0')}:${String(a.startMin).padStart(2, '0')}–${String(a.endHour).padStart(2, '0')}:${String(a.endMin).padStart(2, '0')}; type: ${a.type}${a.projectSlug ? '; project: ' + a.projectSlug : ''}`)
        .join('\n')}`,
    );
  }

  const timeOff = s.timeOffRequests ?? [];
  if (timeOff.length) {
    sections.push(
      `Time-off requests (${timeOff.length}):\n${timeOff
        .map(r => `  ${r.name} -- ${r.type}; ${r.startDate}→${r.endDate} (${r.days}d); status: ${r.status}; project: ${r.projectName}`)
        .join('\n')}`,
    );
  }

  const milestones = s.milestones ?? [];
  if (milestones.length) {
    sections.push(
      `Milestones (${milestones.length}):\n${milestones
        .map(m => `  ${m.name} -- due: ${m.dueDate}; status: ${m.status}; progress: ${m.progress}%`)
        .join('\n')}`,
    );
  }

  const team = s.team ?? [];
  if (team.length) {
    sections.push(
      `Team (${team.length}):\n${team
        .map(t => `  ${t.name} (${t.role}) -- ${t.tasksCompleted}/${t.tasksTotal} tasks; ${t.availability}% available`)
        .join('\n')}`,
    );
  }

  const dailyReports = s.dailyReports ?? [];
  if (dailyReports.length) {
    sections.push(
      `Daily reports (${dailyReports.length}):\n${dailyReports
        .map(r => `  ${r.project} (${r.date}) -- crew: ${r.crewCount}; ${r.hoursWorked}h; safety incidents: ${r.safetyIncidents}; weather: ${r.weather}; work: ${r.workPerformed}; issues: ${r.issues}`)
        .join('\n')}`,
    );
  }

  const inspections = s.inspections ?? [];
  if (inspections.length) {
    sections.push(
      `Inspections (${inspections.length}):\n${inspections
        .map(i => `  ${i.project} -- ${i.type} on ${i.date}; result: ${i.result}; inspector: ${i.inspector}; notes: ${i.notes}`)
        .join('\n')}`,
    );
  }

  const punch = s.punchListItems ?? [];
  if (punch.length) {
    sections.push(
      `Punch list (${punch.length}):\n${punch
        .map(p => `  ${p.project} (${p.location}) -- ${p.description}; assignee: ${p.assignee}; status: ${p.status}; priority: ${p.priority}`)
        .join('\n')}`,
    );
  }

  const attentionItems = s.attentionItems ?? [];
  if (attentionItems.length) {
    sections.push(
      `Attention items (${attentionItems.length}):\n${attentionItems
        .map(i => `  ${i.title}: ${i.subtitle}`)
        .join('\n')}`,
    );
  }

  const projectAttention = s.projectAttentionItems ?? [];
  if (projectAttention.length) {
    sections.push(
      `Project attention items (${projectAttention.length}):\n${projectAttention
        .map(i => `  [${i.severity}] ${i.title} -- ${i.subtitle} (${i.category})`)
        .join('\n')}`,
    );
  }

  const allWeather = s.allWeatherData ?? [];
  if (allWeather.length) {
    sections.push(
      `Weather snapshots (${allWeather.length} sites):\n${allWeather
        .map(w => {
          const impacts = w.forecast.filter(f => f.workImpact !== 'none').map(f => `${f.day} ${f.workImpact}${f.note ? ' (' + f.note + ')' : ''}`);
          return `  Project ${w.projectId} (${w.city}, ${w.state}): now ${w.current.tempF}F ${w.current.condition}, wind ${w.current.windMph}mph; impacts: ${impacts.length ? impacts.join('; ') : 'none'}`;
        })
        .join('\n')}`,
    );
  }

  const allJobCosts = s.allJobCosts ?? [];
  if (allJobCosts.length) {
    sections.push(
      `Job costs by project (${allJobCosts.length}):\n${allJobCosts
        .map(j => {
          const cats = Object.entries(j.costs).map(([k, v]) => `${k}: ${fmtMoney(v)}`).join(', ');
          return `  ${j.projectName} (${j.client}) -- ${j.budgetUsed}/${j.budgetTotal} (${j.budgetPct}%); ${cats}`;
        })
        .join('\n')}`,
    );
  }

  const invoices = s.invoices ?? [];
  if (invoices.length) {
    sections.push(
      `Invoices/AR (${invoices.length}):\n${invoices
        .map(i => `  ${i.invoiceNumber} -- ${fmtMoney(i.amount)} (paid ${fmtMoney(i.amountPaid)}); status: ${i.status}; issued: ${i.issueDate}; due: ${i.dueDate}; terms: ${i.terms}; retainage held: ${fmtMoney(i.retainageHeld)}; project: ${i.projectId}`)
        .join('\n')}`,
    );
  }

  const payables = s.payables ?? [];
  if (payables.length) {
    sections.push(
      `Payables (${payables.length}):\n${payables
        .map(p => `  ${p.invoiceNumber} (${p.vendor}) -- ${fmtMoney(p.amount)} (paid ${fmtMoney(p.amountPaid)}); status: ${p.status}; due: ${p.dueDate}; cost code: ${p.costCode}; project: ${p.projectId}`)
        .join('\n')}`,
    );
  }

  const billingSchedules = s.billingSchedules ?? [];
  if (billingSchedules.length) {
    sections.push(
      `Billing schedules (${billingSchedules.length}):\n${billingSchedules
        .map(b => `  Project ${b.projectId} -- ${b.frequency}; next: ${b.nextBillingDate}; last: ${b.lastBilledDate} for ${fmtMoney(b.lastBilledAmount)}; contract: ${fmtMoney(b.contractValue)}; billed: ${fmtMoney(b.totalBilled)}; remaining: ${fmtMoney(b.totalRemaining)}; contact: ${b.billingContact}`)
        .join('\n')}`,
    );
  }

  const billingEvents = s.billingEvents ?? [];
  if (billingEvents.length) {
    sections.push(
      `Billing events (${billingEvents.length}):\n${billingEvents
        .map(e => `  ${e.id} ${e.period} -- ${e.description}; ${fmtMoney(e.amount)}; date: ${e.billingDate}; status: ${e.status}; project: ${e.projectId}`)
        .join('\n')}`,
    );
  }

  const purchaseOrders = s.purchaseOrders ?? [];
  if (purchaseOrders.length) {
    sections.push(
      `Purchase orders (${purchaseOrders.length}):\n${purchaseOrders
        .map(p => `  ${p.poNumber} (${p.vendor}) -- ${p.description}; ${fmtMoney(p.amount)} (received ${fmtMoney(p.amountReceived)}); status: ${p.status}; issued: ${p.issueDate}; expected: ${p.expectedDelivery}; cost code: ${p.costCode}; project: ${p.project}`)
        .join('\n')}`,
    );
  }

  const payroll = s.payrollRecords ?? [];
  if (payroll.length) {
    sections.push(
      `Payroll records (${payroll.length}):\n${payroll
        .map(p => `  ${p.period} (${p.frequency}) -- pay date: ${p.payDate}; status: ${p.status}; gross: ${fmtMoney(p.grossPay)}; taxes: ${fmtMoney(p.taxes)}; benefits: ${fmtMoney(p.benefits)}; net: ${fmtMoney(p.netPay)}; ${p.employeeCount} employees; ${p.totalHours}h (OT ${p.overtimeHours}h)`)
        .join('\n')}`,
    );
  }

  const subLedger = s.subcontractLedger ?? [];
  if (subLedger.length) {
    sections.push(
      `Subcontract ledger (${subLedger.length}):\n${subLedger
        .map(e => `  ${e.date} ${e.subcontractId} (${e.vendor}, ${e.project}) -- ${e.type}: ${e.description}; ${fmtMoney(e.amount)}; period: ${e.period}; running: ${fmtMoney(e.runningBalance)}`)
        .join('\n')}`,
    );
  }

  const cashFlow = s.cashFlowHistory ?? [];
  if (cashFlow.length) {
    sections.push(
      `Cash flow history (${cashFlow.length}):\n${cashFlow
        .map(c => `  ${c.month}: inflows ${fmtMoney(c.inflows)}, outflows ${fmtMoney(c.outflows)}, net ${fmtMoney(c.netCash)}, balance ${fmtMoney(c.runningBalance)}`)
        .join('\n')}`,
    );
  }

  if (s.cashPosition) {
    const cp = s.cashPosition;
    sections.push(
      `Cash position: balance ${fmtMoney(cp.currentBalance)}; 30d ${fmtMoney(cp.thirtyDayForecast)}, 60d ${fmtMoney(cp.sixtyDayForecast)}, 90d ${fmtMoney(cp.ninetyDayForecast)}; monthly payroll ${fmtMoney(cp.monthlyPayroll)}; monthly overhead ${fmtMoney(cp.monthlyOverhead)}; upcoming payables ${fmtMoney(cp.upcomingPayables)}`,
    );
  }

  const glAccounts = s.glAccounts ?? [];
  if (glAccounts.length) {
    sections.push(
      `GL accounts (${glAccounts.length}):\n${glAccounts
        .map(a => `  ${a.code} ${a.name} (${a.type}) -- balance ${fmtMoney(a.balance)}`)
        .join('\n')}`,
    );
  }

  const glEntries = s.glEntries ?? [];
  if (glEntries.length) {
    sections.push(
      `GL entries (${glEntries.length}):\n${glEntries
        .map(e => `  ${e.date} ${e.accountCode} ${e.accountName} -- ${e.description}; debit ${fmtMoney(e.debit)}; credit ${fmtMoney(e.credit)}; balance ${fmtMoney(e.balance)}; ref: ${e.reference}${e.projectId ? '; project ' + e.projectId : ''}`)
        .join('\n')}`,
    );
  }

  const projectRevenue = s.projectRevenue ?? [];
  if (projectRevenue.length) {
    sections.push(
      `Project revenue (${projectRevenue.length}):\n${projectRevenue
        .map(r => `  ${r.projectName} -- contract ${r.contractValue}; invoiced ${r.invoiced}; collected ${r.collected}; outstanding ${r.outstanding}; retainage ${r.retainage}`)
        .join('\n')}`,
    );
  }

  const apInvoices = s.apInvoices ?? [];
  if (apInvoices.length) {
    sections.push(
      `AP invoices (${apInvoices.length}):\n${apInvoices
        .map(i => `  ${i.invoiceNumber} (${i.vendor}, ${i.project}) -- ${fmtMoney(i.amount)}; status: ${i.status}; due: ${i.dueDate}; received: ${i.receivedDate}; ${i.daysOutstanding}d outstanding; PO: ${i.poNumber}; cost code: ${i.costCode}`)
        .join('\n')}`,
    );
  }

  const apVendors = s.apVendors ?? [];
  if (apVendors.length) {
    sections.push(
      `AP vendors (${apVendors.length}):\n${apVendors
        .map(v => `  ${v.name} (${v.vendorType}) -- total ${fmtMoney(v.totalOwed)}; current ${fmtMoney(v.current)}; 30d ${fmtMoney(v.aging30)}; 60d ${fmtMoney(v.aging60)}; 90d ${fmtMoney(v.aging90)}; 90+ ${fmtMoney(v.aging90plus)}; last paid: ${v.lastPaymentDate} ${fmtMoney(v.lastPaymentAmount)}`)
        .join('\n')}`,
    );
  }

  const payApps = s.apPayApplications ?? [];
  if (payApps.length) {
    sections.push(
      `AP pay applications (${payApps.length}):\n${payApps
        .map(p => `  ${p.vendor} (${p.project}) -- period ${p.periodEnd}; contract ${fmtMoney(p.contractValue)}; previously billed ${fmtMoney(p.previousBilled)}; this period ${fmtMoney(p.thisPeriod)}; retention ${fmtMoney(p.retentionHeld)} (${p.retentionRate}%); net due ${fmtMoney(p.netDue)}; status: ${p.status}`)
        .join('\n')}`,
    );
  }

  const lienWaivers = s.apLienWaivers ?? [];
  if (lienWaivers.length) {
    sections.push(
      `AP lien waivers (${lienWaivers.length}):\n${lienWaivers
        .map(w => `  ${w.vendor} (${w.project}) -- ${w.waiverType}; period ${w.periodEnd}; ${fmtMoney(w.amount)}; status: ${w.status}; due: ${w.dueDate}`)
        .join('\n')}`,
    );
  }

  const retention = s.apRetention ?? [];
  if (retention.length) {
    sections.push(
      `AP retention (${retention.length}):\n${retention
        .map(r => `  ${r.vendor} (${r.project}) -- contract ${fmtMoney(r.contractValue)}; rate ${r.retentionRate}%; held ${fmtMoney(r.retentionHeld)}; released ${fmtMoney(r.retentionReleased)}; pending ${fmtMoney(r.pendingRelease)}`)
        .join('\n')}`,
    );
  }

  const apActivities = s.apActivities ?? [];
  if (apActivities.length) {
    sections.push(
      `AP activity (${apActivities.length}):\n${apActivities
        .map(a => `  ${a.timestamp} [${a.activityType}] ${a.description}${a.vendor ? ' -- ' + a.vendor : ''}${a.amount ? ' ' + fmtMoney(a.amount) : ''}${a.project ? '; project: ' + a.project : ''}`)
        .join('\n')}`,
    );
  }

  const apSchedule = s.apPaymentSchedule ?? [];
  if (apSchedule.length) {
    sections.push(
      `AP payment schedule (${apSchedule.length}):\n${apSchedule
        .map(p => `  ${p.vendor} ${p.invoiceNumber} (${p.project}) -- ${fmtMoney(p.amount)}; due: ${p.dueDate}${p.discountAvailable > 0 ? '; discount ' + fmtMoney(p.discountAvailable) + ' by ' + p.discountDeadline : ''}`)
        .join('\n')}`,
    );
  }

  if (s.learningPlan) {
    const lp = s.learningPlan;
    sections.push(
      `Learning plan: ${lp.name} -- ${lp.completedCourses}/${lp.totalCourses} courses\n${lp.courses
        .map(c => `  ${c.title} (${c.category}) -- ${c.status}; ${c.completedMinutes}/${c.durationMinutes} min${c.completedDate ? '; done ' + c.completedDate : ''}`)
        .join('\n')}`,
    );
  }

  const activities = s.activities ?? [];
  if (activities.length) {
    sections.push(
      `Recent activity (${activities.length}):\n${activities.map(a => `  ${a.timeAgo}: ${a.text}`).join('\n')}`,
    );
  }

  return sections.join('\n\n');
}
