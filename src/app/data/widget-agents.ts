import type { Rfi, Submittal, CalendarAppointment, Project, Estimate, ActivityItem, ChangeOrder, DailyReport, WeatherForecast, ProjectAttentionItem, BudgetHistoryPoint, Inspection, PunchListItem, ProjectRevenue, UrgentNeedItem, ProjectJobCost, JobCostCategory, ProjectWeather, TimeOffRequest, StaffingConflict, Contract } from './dashboard-data';
import { buildUrgentNeeds, PROJECTS, JOB_COST_CATEGORIES, getProjectJobCosts, getProjectWeather, getProjectTimeOff, buildStaffingConflicts, CONTRACTS, CHANGE_ORDERS as ALL_CHANGE_ORDERS } from './dashboard-data';
import type { Milestone, TeamMember, Task, Risk, ActivityEntry, Drawing, BudgetBreakdown } from './project-data';
import type { DrawingTile } from './drawings-data';

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

function kw(q: string, ...words: string[]): boolean {
  const lower = q.toLowerCase();
  return words.some(w => lower.includes(w));
}

function fmtProjects(projects: Project[]): string {
  return projects.map(p =>
    `  ${p.name}: ${p.status}, ${p.progress}% complete, budget ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%), due ${p.dueDate}, owner: ${p.owner}`
  ).join('\n');
}

function maxDaysPastDue(items: { dueDate: string }[]): number {
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

const homeTimeOff: WidgetAgent = {
  id: 'homeTimeOff',
  name: 'Time Off Requests',
  systemPrompt: 'You are an HR scheduling assistant for a construction company. You help managers understand upcoming absences, PTO conflicts, staffing gaps across projects, and team availability.',
  suggestions(s) {
    const pending = (s.timeOffRequests ?? []).filter(r => r.status === 'Pending').length;
    const conflicts = buildStaffingConflicts();
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    const base = ['Show staffing conflicts by project', 'Who is out this week?'];
    if (critical) return [`${critical} critical staffing conflict${critical === 1 ? '' : 's'} detected`, ...base];
    if (pending) return [`${pending} pending request${pending === 1 ? '' : 's'} to review`, ...base];
    return ['Show upcoming PTO conflicts', ...base];
  },
  insight(s) {
    const conflicts = buildStaffingConflicts();
    const critical = conflicts.filter(c => c.severity === 'critical');
    if (critical.length) return `${critical.length} project${critical.length === 1 ? '' : 's'} with critical staffing gaps`;
    const pending = (s.timeOffRequests ?? []).filter(r => r.status === 'Pending').length;
    if (pending) return `${pending} pending request${pending === 1 ? '' : 's'} need review`;
    return null;
  },
  alerts() {
    const conflicts = buildStaffingConflicts();
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    if (critical) return { level: 'critical' as const, count: critical, label: 'staffing conflicts' };
    const warnings = conflicts.filter(c => c.severity === 'warning').length;
    if (warnings) return { level: 'warning' as const, count: warnings, label: 'reduced capacity' };
    return null;
  },
  actions: () => [
    { id: 'approve-all-pending', label: 'Approve all pending PTO', execute: (st) => {
      const n = (st.timeOffRequests ?? []).filter(r => r.status === 'Pending').length;
      return n ? `Approved ${n} pending time-off request(s).` : 'No pending requests to approve.';
    }},
    { id: 'notify-managers', label: 'Notify managers of staffing conflicts', execute: () => {
      const conflicts = buildStaffingConflicts();
      const critical = conflicts.filter(c => c.severity === 'critical');
      return critical.length
        ? `Sent staffing alerts to managers for ${critical.length} critical conflict(s): ${critical.map(c => `${c.projectName} (${c.week})`).join(', ')}`
        : 'No critical conflicts -- sent routine absence summary.';
    }},
    { id: 'export-schedule', label: 'Export team availability', execute: () => 'Exported availability calendar with project-level staffing data.' },
  ],
  buildContext(s) {
    const reqs = s.timeOffRequests ?? [];
    if (!reqs.length) return 'No time-off requests.';
    const lines = reqs.map(r => `  ${r.name} (${r.projectName}): ${r.type}, ${r.startDate}-${r.endDate} (${r.days}d), ${r.status}`);
    const conflicts = buildStaffingConflicts();
    const conflictLines = conflicts.map(c => `  ${c.projectName} ${c.week}: ${c.absentCount}/${c.teamSize} out (${c.absentPct}%) -- ${c.severity} -- ${c.absentees.join(', ')}`);
    return `Time off requests (${reqs.length}):\n${lines.join('\n')}\n\nStaffing conflicts (${conflicts.length}):\n${conflictLines.join('\n')}`;
  },
  localRespond(q, s) {
    const reqs = s.timeOffRequests ?? [];
    if (kw(q, 'conflict', 'staffing', 'gap', 'issue', 'problem', 'risk')) {
      const conflicts = buildStaffingConflicts();
      if (!conflicts.length) return 'No staffing conflicts detected across projects.';
      const critical = conflicts.filter(c => c.severity === 'critical');
      const warning = conflicts.filter(c => c.severity === 'warning');
      let resp = `Detected ${conflicts.length} staffing overlap${conflicts.length === 1 ? '' : 's'} across projects.`;
      if (critical.length) resp += `\n\n**Critical (${critical.length}):**\n${critical.map(c => `- ${c.projectName}, ${c.week}: ${c.absentees.join(', ')} out (${c.absentPct}% of team)`).join('\n')}`;
      if (warning.length) resp += `\n\n**Warning (${warning.length}):**\n${warning.map(c => `- ${c.projectName}, ${c.week}: ${c.absentees.join(', ')} out (${c.absentPct}% of team)`).join('\n')}`;
      return resp;
    }
    if (kw(q, 'pending', 'how many', 'count')) {
      const pending = reqs.filter(r => r.status === 'Pending');
      return `There are ${pending.length} pending time-off requests out of ${reqs.length} total across ${new Set(reqs.map(r => r.projectId)).size} projects.`;
    }
    if (kw(q, 'project')) {
      const byProj = new Map<string, number>();
      for (const r of reqs) byProj.set(r.projectName, (byProj.get(r.projectName) ?? 0) + 1);
      return `Requests by project: ${[...byProj.entries()].map(([p, c]) => `${p}: ${c}`).join(', ')}`;
    }
    if (kw(q, 'who', 'out', 'absence', 'week')) {
      const active = reqs.filter(r => r.status !== 'Denied');
      return active.length ? `Active requests: ${active.slice(0, 10).map(r => `${r.name} (${r.projectName}, ${r.startDate}-${r.endDate})`).join('; ')}${active.length > 10 ? ` ...and ${active.length - 10} more` : ''}` : 'No active time-off requests.';
    }
    return `Tracking ${reqs.length} time-off requests across ${new Set(reqs.map(r => r.projectId)).size} projects. Ask about staffing conflicts, pending requests, or project-level breakdowns.`;
  },
};

const homeCalendar: WidgetAgent = {
  id: 'homeCalendar',
  name: 'Calendar',
  systemPrompt: 'You are a scheduling assistant for construction project managers. You help with meeting coordination, schedule conflicts, and upcoming deadlines.',
  suggestions(s) {
    const cal = s.calendar ?? [];
    const today = new Date().toDateString();
    const todayCount = cal.filter(a => a.date.toDateString() === today).length;
    return todayCount
      ? [`What meetings do I have today? (${todayCount} today)`, 'Show my schedule for this week', 'Are there any scheduling conflicts?']
      : ['What meetings do I have today?', 'Show my schedule for this week', 'Are there any scheduling conflicts?'];
  },
  insight(s) {
    const cal = s.calendar ?? [];
    const today = new Date().toDateString();
    const todayCount = cal.filter(a => a.date.toDateString() === today).length;
    return todayCount ? `${todayCount} meeting${todayCount === 1 ? '' : 's'} on your calendar today` : null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'open-week-view', label: 'Open week view', execute: () => 'Opened calendar week view.' },
    { id: 'send-reminders', label: 'Send meeting reminders', execute: () => 'Queued reminders for today\'s meetings.' },
  ],
  buildContext(s) {
    const cal = s.calendar ?? [];
    const upcoming = cal.slice(0, 15);
    if (!upcoming.length) return 'No upcoming calendar events.';
    const lines = upcoming.map(a => `  ${a.title}: ${a.date.toLocaleDateString()}, ${a.startHour}:${String(a.startMin).padStart(2, '0')}-${a.endHour}:${String(a.endMin).padStart(2, '0')}, type: ${a.type}`);
    return `Upcoming calendar (${cal.length} total, showing 15):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const cal = s.calendar ?? [];
    if (kw(q, 'today', 'now')) {
      const today = new Date().toDateString();
      const todayEvents = cal.filter(a => a.date.toDateString() === today);
      return todayEvents.length ? `You have ${todayEvents.length} event(s) today: ${todayEvents.map(a => a.title).join(', ')}` : 'No events scheduled for today.';
    }
    if (kw(q, 'conflict', 'overlap')) {
      return `You have ${cal.length} scheduled events. I can identify overlapping time slots if you specify a date range.`;
    }
    return `Your calendar has ${cal.length} upcoming events across meetings, reviews, calls, deadlines, and focus time.`;
  },
};

const homeRfis: WidgetAgent = {
  id: 'homeRfis',
  name: 'RFIs',
  systemPrompt: 'You are an RFI tracking specialist for construction projects. You monitor Request for Information items, response times, overdue items, and help prioritize RFI resolution.',
  suggestions(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue');
    return overdue.length
      ? ['Show overdue RFIs', 'How many RFIs are open?', 'Summarize RFI response times']
      : ['Summarize RFI status', 'How many RFIs are open?', 'Which RFIs are overdue?'];
  },
  insight(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue');
    if (!overdue.length) return null;
    const oldest = maxDaysPastDue(overdue);
    return `${overdue.length} overdue, oldest ${oldest} day${oldest === 1 ? '' : 's'} past due`;
  },
  alerts(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue');
    return overdue.length ? { level: 'critical', count: overdue.length, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'escalate-overdue', label: 'Escalate overdue RFIs', execute: (st) => {
      const n = (st.rfis ?? []).filter(r => r.status === 'overdue').length;
      return n ? `Escalated ${n} overdue RFI(s) to project managers.` : 'No overdue RFIs to escalate.';
    }},
    { id: 'summarize-open', label: 'Email open RFI summary', execute: () => 'Sent open RFI summary to the team.' },
    { id: 'assign-review', label: 'Request assignee updates', execute: () => 'Requested status updates from assignees.' },
  ],
  buildContext(s) {
    const rfis = s.rfis ?? [];
    if (!rfis.length) return 'No RFIs.';
    const lines = rfis.map(r => `  ${r.number}: ${r.subject}, project: ${r.project}, assignee: ${r.assignee}, status: ${r.status}, due: ${r.dueDate}`);
    return `RFIs (${rfis.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const rfis = s.rfis ?? [];
    const open = rfis.filter(r => r.status === 'open');
    const overdue = rfis.filter(r => r.status === 'overdue');
    if (kw(q, 'overdue', 'late', 'past due')) {
      return overdue.length ? `${overdue.length} overdue RFI(s): ${overdue.map(r => `${r.number} - ${r.subject}`).join('; ')}` : 'No overdue RFIs.';
    }
    if (kw(q, 'open', 'how many', 'count', 'pending')) {
      return `${open.length} open and ${overdue.length} overdue out of ${rfis.length} total RFIs.`;
    }
    return `Tracking ${rfis.length} RFIs: ${open.length} open, ${overdue.length} overdue. Ask about specific statuses or projects.`;
  },
};

const homeSubmittals: WidgetAgent = {
  id: 'homeSubmittals',
  name: 'Submittals',
  systemPrompt: 'You are a submittal tracking specialist for construction projects. You monitor submittal approvals, review cycles, overdue items, and help prioritize submittal processing.',
  suggestions(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    return overdue.length
      ? ['Which submittals are overdue?', 'How many submittals are pending review?', 'Summarize submittal approval rates']
      : ['Summarize submittal status', 'How many submittals are pending review?', 'Which submittals are overdue?'];
  },
  insight(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    if (!overdue.length) return null;
    const oldest = maxDaysPastDue(overdue);
    return `${overdue.length} overdue submittal${overdue.length === 1 ? '' : 's'}, oldest ${oldest} day${oldest === 1 ? '' : 's'} past due`;
  },
  alerts(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    return overdue.length ? { level: 'critical', count: overdue.length, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'escalate-subs', label: 'Escalate overdue submittals', execute: (st) => {
      const n = (st.submittals ?? []).filter(sub => sub.status === 'overdue').length;
      return n ? `Escalated ${n} overdue submittal(s).` : 'No overdue submittals to escalate.';
    }},
    { id: 'batch-remind', label: 'Send reviewer reminders', execute: () => 'Sent reminders to submittal reviewers.' },
  ],
  buildContext(s) {
    const subs = s.submittals ?? [];
    if (!subs.length) return 'No submittals.';
    const lines = subs.map(sub => `  ${sub.number}: ${sub.subject}, project: ${sub.project}, assignee: ${sub.assignee}, status: ${sub.status}, due: ${sub.dueDate}`);
    return `Submittals (${subs.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const subs = s.submittals ?? [];
    const open = subs.filter(sub => sub.status === 'open');
    const overdue = subs.filter(sub => sub.status === 'overdue');
    if (kw(q, 'overdue', 'late')) {
      return overdue.length ? `${overdue.length} overdue submittal(s): ${overdue.map(sub => `${sub.number} - ${sub.subject}`).join('; ')}` : 'No overdue submittals.';
    }
    if (kw(q, 'open', 'pending', 'how many', 'count')) {
      return `${open.length} open and ${overdue.length} overdue out of ${subs.length} total submittals.`;
    }
    return `Tracking ${subs.length} submittals: ${open.length} open, ${overdue.length} overdue. Ask about specific statuses or projects.`;
  },
};

const homeDefault: WidgetAgent = {
  id: 'homeDefault',
  name: 'Dashboard Overview',
  systemPrompt: 'You are a project delivery assistant for a construction company. You provide portfolio-level insights across all projects, schedules, budgets, RFIs, submittals, change orders, weather impacts, and revenue.',
  suggestions(s) {
    const atRisk = (s.projects ?? []).filter(p => p.status === 'At Risk').length;
    const attn = (s.attentionItems ?? []).length;
    if (attn) return ['Which projects need attention?', 'Give me a portfolio overview', 'Will weather impact work this week?', 'How are budgets tracking?'];
    if (atRisk) return ['Which projects are at risk?', 'Give me a portfolio overview', 'How are budgets tracking?', 'Will weather impact work this week?'];
    return ['Give me a portfolio overview', 'Which projects need attention?', 'Will weather impact work this week?', 'How are budgets tracking?'];
  },
  insight(s) {
    const projects = s.projects ?? [];
    const atRisk = projects.filter(p => p.status === 'At Risk').length;
    const overdueProj = projects.filter(p => p.status === 'Overdue').length;
    const overdueRfi = (s.rfis ?? []).filter(r => r.status === 'overdue').length;
    if (atRisk || overdueProj) return `${atRisk} project${atRisk === 1 ? '' : 's'} at risk, ${overdueProj} overdue project${overdueProj === 1 ? '' : 's'}`;
    if (overdueRfi) return `${overdueRfi} portfolio RFI(s) overdue`;
    return null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' },
    { id: 'open-financials', label: 'Open Financials', execute: () => 'Opening Financials.', route: '/financials' },
    { id: 'refresh-attention', label: 'Refresh attention feed', execute: () => 'Refreshed items needing attention.' },
  ],
  buildContext(s) {
    const parts: string[] = [];
    const projects = s.projects ?? [];
    parts.push(`Portfolio: ${projects.length} projects`);
    const atRisk = projects.filter(p => p.status === 'At Risk').length;
    const overdue = projects.filter(p => p.status === 'Overdue').length;
    if (atRisk) parts.push(`${atRisk} project(s) at risk`);
    if (overdue) parts.push(`${overdue} project(s) overdue`);
    parts.push(`Estimates: ${(s.estimates ?? []).length} open`);
    parts.push(`RFIs: ${(s.rfis ?? []).length} total`);
    parts.push(`Submittals: ${(s.submittals ?? []).length} total`);
    parts.push(`Calendar: ${(s.calendar ?? []).length} upcoming events`);
    const cos = s.changeOrders ?? [];
    if (cos.length) parts.push(`Change orders: ${cos.length} total, ${cos.filter(c => c.status === 'pending').length} pending`);
    const impactDays = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none');
    if (impactDays.length) parts.push(`Weather alert: ${impactDays.length} day(s) with work impact this week`);
    if (projects.length) parts.push('Projects:\n' + fmtProjects(projects));
    return parts.join('\n');
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    if (kw(q, 'overview', 'summary', 'status')) {
      const atRisk = projects.filter(p => p.status === 'At Risk').length;
      const overdue = projects.filter(p => p.status === 'Overdue').length;
      const onTrack = projects.filter(p => p.status === 'On Track').length;
      return `Portfolio: ${projects.length} projects. ${onTrack} on track, ${atRisk} at risk, ${overdue} overdue. ${(s.rfis ?? []).length} RFIs, ${(s.submittals ?? []).length} submittals, ${(s.changeOrders ?? []).filter(c => c.status === 'pending').length} pending change orders.`;
    }
    if (kw(q, 'attention', 'urgent', 'critical')) {
      const items = s.attentionItems ?? [];
      return items.length ? `${items.length} items need attention: ${items.map(i => i.title).join(', ')}` : 'No items flagged for attention.';
    }
    if (kw(q, 'weather', 'rain', 'forecast')) {
      return weatherAgent.localRespond(q, s);
    }
    if (kw(q, 'change order', 'co-', 'change request')) {
      return changeOrdersAgent.localRespond(q, s);
    }
    if (kw(q, 'budget')) {
      const high = projects.filter(p => p.budgetPct > 80).map(p => `${p.name} (${p.budgetPct}%)`);
      return high.length ? `Projects with high budget usage: ${high.join(', ')}` : 'All budgets are within acceptable range.';
    }
    return `I have visibility into ${projects.length} projects, ${(s.estimates ?? []).length} estimates, ${(s.rfis ?? []).length} RFIs, ${(s.submittals ?? []).length} submittals, and ${(s.changeOrders ?? []).length} change orders. Ask about anything specific.`;
  },
};

const projectsWidget: WidgetAgent = {
  id: 'projects',
  name: 'Projects',
  systemPrompt: 'You are a portfolio management specialist for construction projects. You analyze project health, progress trends, and help identify projects that need intervention.',
  suggestions(s) {
    const atRisk = (s.projects ?? []).filter(p => p.status === 'At Risk').length;
    return atRisk
      ? ['Which projects are at risk?', 'Summarize project status', 'Show overdue projects']
      : ['Summarize project status', 'Which projects are at risk?', 'Show overdue projects'];
  },
  insight(s) {
    const atRisk = (s.projects ?? []).filter(p => p.status === 'At Risk').length;
    const overdue = (s.projects ?? []).filter(p => p.status === 'Overdue').length;
    if (!atRisk && !overdue) return null;
    return `${atRisk} at risk, ${overdue} overdue`;
  },
  alerts(s) {
    const overdue = (s.projects ?? []).filter(p => p.status === 'Overdue').length;
    return overdue ? { level: 'warning', count: overdue, label: 'overdue projects' } : null;
  },
  actions: () => [
    { id: 'portfolio-review', label: 'Schedule portfolio review', execute: () => 'Scheduled portfolio review meeting.' },
    { id: 'export-status', label: 'Export project status report', execute: () => 'Exported project status CSV.' },
  ],
  buildContext(s) {
    const projects = s.projects ?? [];
    return `All projects (${projects.length}):\n${fmtProjects(projects)}`;
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    if (kw(q, 'risk', 'at risk')) {
      const atRisk = projects.filter(p => p.status === 'At Risk');
      return atRisk.length ? `${atRisk.length} project(s) at risk: ${atRisk.map(p => p.name).join(', ')}` : 'No projects currently at risk.';
    }
    if (kw(q, 'overdue', 'late', 'behind')) {
      const overdue = projects.filter(p => p.status === 'Overdue');
      return overdue.length ? `${overdue.length} overdue project(s): ${overdue.map(p => `${p.name} (${p.progress}% complete, due ${p.dueDate})`).join('; ')}` : 'No overdue projects.';
    }
    if (kw(q, 'status', 'summary', 'overview')) {
      const byStatus: Record<string, number> = {};
      projects.forEach(p => { byStatus[p.status] = (byStatus[p.status] ?? 0) + 1; });
      return `${projects.length} projects: ${Object.entries(byStatus).map(([s, c]) => `${c} ${s}`).join(', ')}`;
    }
    return `Tracking ${projects.length} projects. Ask about project status, risks, or specific projects.`;
  },
};

const openEstimates: WidgetAgent = {
  id: 'openEstimates',
  name: 'Open Estimates',
  systemPrompt: 'You are an estimating coordinator for a $5M construction company. You track the estimate pipeline (~$4M target), approval workflows, and help prioritize reviews to maintain healthy backlog coverage.',
  suggestions(s) {
    const est = s.estimates ?? [];
    const overdue = est.filter(e => e.daysLeft < 0).length;
    const urgent = est.filter(e => e.daysLeft >= 0 && e.daysLeft <= 7 && e.status === 'Awaiting Approval').length;
    if (overdue) return ['Show overdue estimates', 'What is my pipeline health?', 'Which estimates need approval this week?'];
    if (urgent) return ['Which estimates need approval this week?', 'What is my pipeline health?', 'Break down estimates by status'];
    return ['What is my pipeline health?', 'Break down estimates by status', 'Show estimate timeline'];
  },
  insight(s) {
    const est = s.estimates ?? [];
    const overdue = est.filter(e => e.daysLeft < 0);
    const thisWeek = est.filter(e => e.daysLeft >= 0 && e.daysLeft <= 7 && e.status === 'Awaiting Approval');
    const total = est.reduce((sum, e) => sum + e.valueRaw, 0);
    const pipelineM = (total / 1_000_000).toFixed(1);
    if (overdue.length) {
      const overdueVal = overdue.reduce((sum, e) => sum + e.valueRaw, 0);
      return `$${(overdueVal / 1000).toFixed(0)}K across ${overdue.length} overdue -- $${pipelineM}M total pipeline`;
    }
    if (thisWeek.length) return `${thisWeek.length} approval${thisWeek.length === 1 ? '' : 's'} due this week -- $${pipelineM}M pipeline`;
    return `$${pipelineM}M pipeline across ${est.length} open estimates`;
  },
  alerts(s) {
    const est = s.estimates ?? [];
    const overdue = est.filter(e => e.daysLeft < 0).length;
    if (overdue) return { level: 'critical', count: overdue, label: 'overdue' };
    const urgent = est.filter(e => e.daysLeft >= 0 && e.daysLeft <= 7 && e.status === 'Awaiting Approval').length;
    return urgent ? { level: 'warning', count: urgent, label: 'due this week' } : null;
  },
  actions: (s) => {
    const est = s?.estimates ?? [];
    const actions: AgentAction[] = [
      { id: 'chase-approvals', label: 'Chase estimate approvals', execute: (st) => {
        const awaiting = (st.estimates ?? []).filter(e => e.status === 'Awaiting Approval');
        return awaiting.length ? `Sent reminders for ${awaiting.length} estimate(s) totaling $${(awaiting.reduce((s, e) => s + e.valueRaw, 0) / 1000).toFixed(0)}K awaiting approval.` : 'No estimates awaiting approval.';
      }},
      { id: 'export-pipeline', label: 'Export pipeline report', execute: () => 'Exported estimate pipeline report with status breakdown.' },
    ];
    const overdue = est.filter(e => e.daysLeft < 0);
    if (overdue.length >= 2) {
      actions.push({ id: 'escalate-overdue', label: 'Escalate overdue estimates', execute: () => `Escalated ${overdue.length} overdue estimates to senior management for review.` });
    }
    return actions;
  },
  buildContext(s) {
    const est = s.estimates ?? [];
    const total = est.reduce((sum, e) => sum + e.valueRaw, 0);
    const byStatus = { draft: est.filter(e => e.status === 'Draft'), review: est.filter(e => e.status === 'Under Review'), awaiting: est.filter(e => e.status === 'Awaiting Approval') };
    const overdue = est.filter(e => e.daysLeft < 0);
    const lines = [
      `Estimate pipeline: ${est.length} open, $${(total / 1_000_000).toFixed(2)}M total value`,
      `Status breakdown: ${byStatus.draft.length} draft, ${byStatus.review.length} under review, ${byStatus.awaiting.length} awaiting approval`,
      overdue.length ? `OVERDUE (${overdue.length}): ${overdue.map(e => `${e.id} ${e.project} ${e.value} (${Math.abs(e.daysLeft)}d overdue)`).join('; ')}` : 'No overdue estimates.',
      '',
      ...est.map(e => `  ${e.id}: ${e.project}, ${e.value} (${e.type}), status: ${e.status}, client: ${e.client}, by ${e.requestedBy}, due ${e.dueDate}, ${e.daysLeft}d left`),
    ];
    return lines.join('\n');
  },
  localRespond(q, s) {
    const est = s.estimates ?? [];
    const total = est.reduce((sum, e) => sum + e.valueRaw, 0);
    if (kw(q, 'overdue', 'late', 'past due')) {
      const overdue = est.filter(e => e.daysLeft < 0);
      if (!overdue.length) return 'No overdue estimates currently.';
      const val = overdue.reduce((s, e) => s + e.valueRaw, 0);
      return `${overdue.length} overdue estimate(s) totaling $${(val / 1000).toFixed(0)}K:\n${overdue.map(e => `- ${e.id}: ${e.project} (${e.value}) -- ${Math.abs(e.daysLeft)} days overdue, awaiting from ${e.requestedBy}`).join('\n')}`;
    }
    if (kw(q, 'pipeline', 'health', 'coverage', 'backlog')) {
      const ratio = ((total / 5_000_000) * 100).toFixed(0);
      const overdue = est.filter(e => e.daysLeft < 0).length;
      const drafts = est.filter(e => e.status === 'Draft').length;
      return `Pipeline health: $${(total / 1_000_000).toFixed(2)}M across ${est.length} estimates (${ratio}% of $5M annual revenue).\n${overdue ? `Warning: ${overdue} overdue estimate(s) need immediate attention.\n` : ''}${drafts} in draft stage, ${est.filter(e => e.status === 'Under Review').length} under review, ${est.filter(e => e.status === 'Awaiting Approval').length} awaiting approval.`;
    }
    if (kw(q, 'approval', 'awaiting', 'this week', 'urgent')) {
      const awaiting = est.filter(e => e.status === 'Awaiting Approval');
      const thisWeek = awaiting.filter(e => e.daysLeft >= 0 && e.daysLeft <= 7);
      if (!awaiting.length) return 'No estimates awaiting approval.';
      let resp = `${awaiting.length} estimate(s) awaiting approval ($${(awaiting.reduce((s, e) => s + e.valueRaw, 0) / 1000).toFixed(0)}K):`;
      resp += awaiting.map(e => `\n- ${e.id}: ${e.project} (${e.value}) -- due ${e.dueDate}${e.daysLeft < 0 ? ' OVERDUE' : ''}`).join('');
      if (thisWeek.length) resp += `\n\n${thisWeek.length} of these are due this week.`;
      return resp;
    }
    if (kw(q, 'status', 'breakdown', 'summary')) {
      const byStatus: Record<string, typeof est> = {};
      for (const e of est) { (byStatus[e.status] ??= []).push(e); }
      return Object.entries(byStatus).map(([status, items]) => `${status} (${items.length}): $${(items.reduce((s, e) => s + e.valueRaw, 0) / 1000).toFixed(0)}K\n${items.map(e => `  - ${e.id}: ${e.project} (${e.value})`).join('\n')}`).join('\n\n');
    }
    if (kw(q, 'timeline', 'schedule', 'due')) {
      const sorted = [...est].sort((a, b) => a.daysLeft - b.daysLeft);
      return `Estimate timeline (earliest due first):\n${sorted.map(e => `- ${e.dueDate}: ${e.id} ${e.project} (${e.value}) -- ${e.status}${e.daysLeft < 0 ? ' OVERDUE' : ''}`).join('\n')}`;
    }
    return `${est.length} open estimates totaling $${(total / 1_000_000).toFixed(2)}M. Ask about pipeline health, overdue items, approval status, or timeline.`;
  },
};

const recentActivity: WidgetAgent = {
  id: 'recentActivity',
  name: 'Recent Activity',
  systemPrompt: 'You are a project activity analyst. You track recent changes, updates, and team actions across construction projects.',
  suggestions: ['What changed today?', 'Show the most recent updates', 'Who has been most active this week?'],
  insight(s) {
    const n = (s.activities ?? []).length;
    return n ? `${n} recent update${n === 1 ? '' : 's'} on the feed` : null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'mark-all-read', label: 'Mark feed as read', execute: () => 'Marked activity as read.' },
    { id: 'subscribe-digest', label: 'Subscribe to daily digest', execute: () => 'Subscribed to daily activity digest.' },
  ],
  buildContext(s) {
    const activities = s.activities ?? [];
    const lines = activities.map(a => `  ${a.text} (${a.timeAgo})`);
    return `Recent activity (${activities.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const activities = s.activities ?? [];
    return activities.length ? `Recent activity: ${activities.map(a => a.text).join('; ')}` : 'No recent activity.';
  },
};

const needsAttention: WidgetAgent = {
  id: 'needsAttention',
  name: 'Needs Attention',
  systemPrompt: 'You are a project risk coordinator. You identify items that need immediate attention, escalation, or management intervention across the portfolio.',
  suggestions(s) {
    const items = s.attentionItems ?? [];
    return items.length
      ? ['What needs attention today?', 'Show critical items', 'Which items are most urgent?']
      : ['Show critical items', 'What needs attention today?', 'Which items are most urgent?'];
  },
  insight(s) {
    const items = s.attentionItems ?? [];
    if (!items.length) return null;
    return `${items.length} item${items.length === 1 ? '' : 's'} need attention`;
  },
  alerts(s) {
    const items = s.attentionItems ?? [];
    return items.length ? { level: 'warning', count: items.length, label: 'attention' } : null;
  },
  actions: () => [
    { id: 'ack-all', label: 'Acknowledge all items', execute: (st) => {
      const n = (st.attentionItems ?? []).length;
      return n ? `Acknowledged ${n} attention item(s).` : 'No items to acknowledge.';
    }},
    { id: 'escalate-executive', label: 'Escalate to executive team', execute: () => 'Escalated attention items to leadership.' },
  ],
  buildContext(s) {
    const items = s.attentionItems ?? [];
    const lines = items.map(i => `  ${i.title}: ${i.subtitle}`);
    return `Items needing attention (${items.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const items = s.attentionItems ?? [];
    return items.length ? `${items.length} items need attention: ${items.map(i => `${i.title} - ${i.subtitle}`).join('; ')}` : 'No items need attention.';
  },
};

const projectsDefault: WidgetAgent = {
  id: 'projectsDefault',
  name: 'Projects Dashboard',
  systemPrompt: 'You are a portfolio management assistant for a construction company. You have visibility into all projects, estimates, activity, and items needing attention.',
  suggestions(s) {
    const est = (s.estimates ?? []).length;
    return est ? ['What is the estimate pipeline?', 'Give me a portfolio summary', 'Which projects need attention?', 'Show recent activity']
      : ['Give me a portfolio summary', 'Which projects need attention?', 'What is the estimate pipeline?', 'Show recent activity'];
  },
  insight(s) {
    const highBudget = (s.projects ?? []).filter(p => p.budgetPct > 80).length;
    const atRisk = (s.projects ?? []).filter(p => p.status === 'At Risk').length;
    if (atRisk) return `${atRisk} project${atRisk === 1 ? '' : 's'} at risk`;
    if (highBudget) return `${highBudget} project${highBudget === 1 ? '' : 's'} over 80% budget`;
    return null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'new-project', label: 'Start new project intake', execute: () => 'Opened new project intake form.' },
    { id: 'export-portfolio', label: 'Export portfolio snapshot', execute: () => 'Exported portfolio snapshot.' },
  ],
  buildContext(s) {
    const parts: string[] = [];
    parts.push(`${(s.projects ?? []).length} projects, ${(s.estimates ?? []).length} open estimates`);
    parts.push(`${(s.attentionItems ?? []).length} items need attention`);
    if (s.projects?.length) parts.push('Projects:\n' + fmtProjects(s.projects));
    return parts.join('\n');
  },
  localRespond(q, s) {
    return homeDefault.localRespond(q, s);
  },
};

const finBudgetByProject: WidgetAgent = {
  id: 'finBudgetByProject',
  name: 'Budget by Project',
  systemPrompt: 'You are a financial controller for construction projects. You analyze budget utilization, spend rates, and forecast overruns across the portfolio.',
  suggestions(s) {
    const high = (s.projects ?? []).filter(p => p.budgetPct > 80).length;
    return high
      ? ['Which projects are over budget?', 'Show budget utilization summary', 'What is the total spend vs. forecast?']
      : ['Show budget utilization summary', 'Which projects are over budget?', 'What is the total spend vs. forecast?'];
  },
  insight(s) {
    const high = (s.projects ?? []).filter(p => p.budgetPct > 80);
    if (!high.length) return null;
    const maxPct = Math.max(...high.map(p => p.budgetPct));
    return `${high.length} project${high.length === 1 ? '' : 's'} over 80% utilization (peak ${maxPct}%)`;
  },
  alerts(s) {
    const high = (s.projects ?? []).filter(p => p.budgetPct > 90).length;
    return high ? { level: 'critical', count: high, label: 'over 90% budget' } : null;
  },
  actions(s) {
    const projects = s.projects ?? [];
    const highUtil = projects.filter(p => p.budgetPct >= 80).slice(0, 3);
    const jcActions: AgentAction[] = highUtil.map(p => ({
      id: `open-jc-${p.id}`,
      label: `Open ${p.name} job costs`,
      execute: () => `Opening job costs for ${p.name}.`,
      route: `/financials/job-costs/${p.slug}`,
    }));
    return [
      { id: 'export-budget', label: 'Export budget utilization', execute: () => 'Exported budget-by-project report.' },
      ...jcActions,
    ];
  },
  buildContext(s) {
    const projects = s.projects ?? [];
    const lines = projects.map(p => `  ${p.name}: ${p.budgetUsed} of ${p.budgetTotal} (${p.budgetPct}%), client: ${p.client}`);
    return `Budget by project (${projects.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    if (kw(q, 'over budget', 'overrun', 'high')) {
      const over = projects.filter(p => p.budgetPct > 80);
      return over.length ? `Projects with high budget usage (>80%): ${over.map(p => `${p.name} (${p.budgetPct}%)`).join(', ')}` : 'All projects are within budget.';
    }
    if (kw(q, 'total', 'spend', 'forecast')) {
      const totalUsed = projects.reduce((sum, p) => sum + parseFloat(p.budgetUsed.replace(/[$K]/g, '')) * 1000, 0);
      const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.budgetTotal.replace(/[$K]/g, '')) * 1000, 0);
      return `Total spend: $${Math.round(totalUsed / 1000)}K of $${Math.round(totalBudget / 1000)}K budgeted (${Math.round(totalUsed / totalBudget * 100)}% utilized).`;
    }
    return `Tracking budgets across ${projects.length} projects. Ask about utilization, overruns, or specific projects.`;
  },
};

const financialsDefault: WidgetAgent = {
  id: 'financialsDefault',
  name: 'Financials Dashboard',
  systemPrompt: 'You are a financial analyst for construction project delivery. You have access to portfolio budgets, revenue data, job cost summaries, change orders, and accounts receivable.',
  suggestions(s) {
    const pendingCo = (s.changeOrders ?? []).filter(c => c.status === 'pending').length;
    return pendingCo
      ? ['Show pending change orders', 'How is the overall budget tracking?', 'What is the total outstanding revenue?', 'Which projects are over budget?']
      : ['How is the overall budget tracking?', 'Which projects are over budget?', 'What is the total outstanding revenue?', 'Show pending change orders'];
  },
  insight(s) {
    const pendingCo = (s.changeOrders ?? []).filter(c => c.status === 'pending').length;
    const out = (s.projectRevenue ?? []).reduce((sum, r) => sum + r.outstandingRaw, 0);
    if (out > 50000) return `$${(out / 1000).toFixed(0)}K outstanding AR across portfolio`;
    if (pendingCo) return `${pendingCo} change order${pendingCo === 1 ? '' : 's'} pending approval`;
    return null;
  },
  alerts: () => null,
  actions(s) {
    const overBudget = (s.projects ?? []).filter(p => p.budgetPct >= 80);
    const topProject = overBudget.length ? overBudget[0] : (s.projects ?? [])[0];
    const base: AgentAction[] = [
      { id: 'open-revenue', label: 'Open revenue view', execute: () => 'Opening revenue breakdown.', route: '/financials' },
      { id: 'open-change-orders', label: 'Open change orders', execute: () => 'Opening change orders.', route: '/financials' },
    ];
    if (topProject) {
      base.push({
        id: 'open-jc-top',
        label: `Open ${topProject.name} job costs`,
        execute: () => `Opening job costs for ${topProject.name}.`,
        route: `/financials/job-costs/${topProject.slug}`,
      });
    }
    return base;
  },
  buildContext(s) {
    const projects = s.projects ?? [];
    const totalUsed = projects.reduce((sum, p) => sum + parseFloat(p.budgetUsed.replace(/[$K]/g, '')) * 1000, 0);
    const totalBudget = projects.reduce((sum, p) => sum + parseFloat(p.budgetTotal.replace(/[$K]/g, '')) * 1000, 0);
    const parts: string[] = [];
    parts.push(`Financial summary:\n  Total budget: $${Math.round(totalBudget / 1000)}K\n  Total spent: $${Math.round(totalUsed / 1000)}K (${Math.round(totalUsed / totalBudget * 100)}%)\n  ${projects.length} active projects`);
    parts.push(`Budget by project:\n${projects.map(p => `  ${p.name}: ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%)`).join('\n')}`);
    const rev = s.projectRevenue ?? [];
    if (rev.length) {
      const totalOutstanding = rev.reduce((sum, r) => sum + r.outstandingRaw, 0);
      const totalRetainage = rev.reduce((sum, r) => sum + r.retainageRaw, 0);
      parts.push(`\nRevenue: $${(totalOutstanding / 1000).toFixed(0)}K outstanding, $${(totalRetainage / 1000).toFixed(0)}K retainage`);
    }
    const cos = s.changeOrders ?? [];
    if (cos.length) {
      const pendingAmt = cos.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
      parts.push(`Change orders: ${cos.length} total, $${pendingAmt.toLocaleString()} pending approval`);
    }
    return parts.join('\n');
  },
  localRespond(q, s) {
    if (kw(q, 'revenue', 'outstanding', 'invoice', 'receivable', 'collect')) return revenueAgent.localRespond(q, s);
    if (kw(q, 'change order', 'co-', 'change request')) return changeOrdersAgent.localRespond(q, s);
    return finBudgetByProject.localRespond(q, s);
  },
};

const milestonesAgent: WidgetAgent = {
  id: 'milestones',
  name: 'Milestones',
  systemPrompt: 'You are a schedule management specialist for construction projects. You track milestone progress, identify schedule risks, and advise on critical path items.',
  suggestions(s) {
    const overdue = (s.milestones ?? []).filter(m => m.status === 'overdue').length;
    return overdue
      ? ['Are any milestones at risk?', 'Which milestones are coming up?', 'Summarize milestone completion rate']
      : ['Which milestones are coming up?', 'Summarize milestone completion rate', 'Are any milestones at risk?'];
  },
  insight(s) {
    const overdue = (s.milestones ?? []).filter(m => m.status === 'overdue');
    if (!overdue.length) return null;
    return `${overdue.length} overdue milestone${overdue.length === 1 ? '' : 's'}`;
  },
  alerts(s) {
    const overdue = (s.milestones ?? []).filter(m => m.status === 'overdue').length;
    return overdue ? { level: 'warning', count: overdue, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'notify-owners', label: 'Notify milestone owners', execute: () => 'Sent milestone status to owners.' },
    { id: 'export-schedule', label: 'Export milestone schedule', execute: () => 'Exported milestone list.' },
  ],
  buildContext(s) {
    const ms = s.milestones ?? [];
    const lines = ms.map(m => `  ${m.name}: ${m.status}, due ${m.dueDate}, ${m.progress}% done`);
    return `Project: ${s.projectName}\nMilestones (${s.completedMilestones ?? 0} of ${ms.length} completed):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const ms = s.milestones ?? [];
    if (kw(q, 'coming up', 'upcoming', 'next')) {
      const upcoming = ms.filter(m => m.status === 'upcoming' || m.status === 'in-progress');
      return upcoming.length ? `Upcoming milestones: ${upcoming.map(m => `${m.name} (due ${m.dueDate}, ${m.progress}%)`).join('; ')}` : 'No upcoming milestones.';
    }
    if (kw(q, 'risk', 'overdue', 'late')) {
      const overdue = ms.filter(m => m.status === 'overdue');
      return overdue.length ? `${overdue.length} overdue milestone(s): ${overdue.map(m => m.name).join(', ')}` : 'No overdue milestones.';
    }
    if (kw(q, 'rate', 'completion', 'summary')) {
      return `${s.completedMilestones ?? 0} of ${ms.length} milestones completed (${ms.length ? Math.round(((s.completedMilestones ?? 0) / ms.length) * 100) : 0}%).`;
    }
    return `Tracking ${ms.length} milestones for ${s.projectName}. ${s.completedMilestones ?? 0} completed. Ask about upcoming, overdue, or completion rates.`;
  },
};

const tasksAgent: WidgetAgent = {
  id: 'tasks',
  name: 'Key Tasks',
  systemPrompt: 'You are a task management specialist for construction projects. You track task assignments, priorities, blockers, and help optimize workload distribution.',
  suggestions(s) {
    const tasks = s.tasks ?? [];
    const overdue = tasks.filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed'));
    return overdue.length
      ? ['Which tasks are overdue?', 'Show high-priority tasks', 'What tasks are blocked?']
      : ['Show high-priority tasks', 'Which tasks are overdue?', 'What tasks are blocked?'];
  },
  insight(s) {
    const tasks = s.tasks ?? [];
    const high = tasks.filter(t => t.priority === 'high').length;
    const overdue = tasks.filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed')).length;
    if (!high && !overdue) return null;
    const parts: string[] = [];
    if (high) parts.push(`${high} high-priority task${high === 1 ? '' : 's'}`);
    if (overdue) parts.push(`${overdue} overdue`);
    return parts.join(', ');
  },
  alerts(s) {
    const overdue = (s.tasks ?? []).filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed')).length;
    return overdue ? { level: 'warning', count: overdue, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'reassign', label: 'Reassign overdue tasks', execute: (st) => {
      const overdue = (st.tasks ?? []).filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed')).length;
      return overdue ? `Reassigned ${overdue} overdue task(s).` : 'No overdue tasks to reassign.';
    }},
    { id: 'bump-priority', label: 'Escalate blocked tasks', execute: () => 'Escalated blocked tasks to leads.' },
  ],
  buildContext(s) {
    const tasks = s.tasks ?? [];
    const lines = tasks.map(t => `  ${t.title}: ${t.status}, priority ${t.priority}, assigned to ${t.assignee}, due ${t.dueDate}`);
    return `Project: ${s.projectName}\nTasks (${s.openTaskCount ?? 0} open of ${tasks.length} total):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const tasks = s.tasks ?? [];
    if (kw(q, 'overdue', 'late')) {
      const overdue = tasks.filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed'));
      return overdue.length ? `${overdue.length} overdue task(s): ${overdue.map(t => t.title).join(', ')}` : 'No overdue tasks identified.';
    }
    if (kw(q, 'high', 'priority', 'urgent', 'critical')) {
      const high = tasks.filter(t => t.priority === 'high');
      return high.length ? `${high.length} high-priority task(s): ${high.map(t => `${t.title} (${t.status}, assigned to ${t.assignee})`).join('; ')}` : 'No high-priority tasks.';
    }
    if (kw(q, 'block')) {
      const blocked = tasks.filter(t => t.status.toLowerCase().includes('block'));
      return blocked.length ? `${blocked.length} blocked task(s): ${blocked.map(t => t.title).join(', ')}` : 'No blocked tasks.';
    }
    return `${s.openTaskCount ?? 0} open tasks out of ${tasks.length} total for ${s.projectName}. Ask about priorities, overdue items, or specific assignments.`;
  },
};

const risksAgent: WidgetAgent = {
  id: 'risks',
  name: 'Risks & Urgent Needs',
  systemPrompt: 'You are a risk management specialist for construction projects. You assess risk severity, evaluate mitigation strategies, advise on risk response plans, and track urgent needs that require immediate attention.',
  suggestions(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds().filter(n => n.projectId === projId) : [];
    const high = (s.risks ?? []).filter(r => r.severity === 'high').length;
    const base = high
      ? ['Show high-severity risks', 'What are the biggest risks right now?', 'What risk mitigations are in place?']
      : ['What are the biggest risks right now?', 'Summarize open risks', 'What risk mitigations are in place?'];
    if (urgent.length) base.unshift('What urgent needs require action?');
    return base.slice(0, 5);
  },
  insight(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds().filter(n => n.projectId === projId) : [];
    const critical = urgent.filter(n => n.severity === 'critical').length;
    const high = (s.risks ?? []).filter(r => r.severity === 'high').length;
    const parts: string[] = [];
    if (critical) parts.push(`${critical} critical urgent need${critical === 1 ? '' : 's'}`);
    if (high) parts.push(`${high} high-severity risk${high === 1 ? '' : 's'}`);
    return parts.length ? parts.join(', ') : null;
  },
  alerts(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds().filter(n => n.projectId === projId) : [];
    const critical = urgent.filter(n => n.severity === 'critical').length;
    const high = (s.risks ?? []).filter(r => r.severity === 'high').length;
    const total = critical + high;
    if (critical) return { level: 'critical', count: total, label: `${critical} critical` };
    if (high) return { level: 'warning', count: total, label: 'high severity' };
    return null;
  },
  actions: () => [
    { id: 'risk-workshop', label: 'Schedule risk review', execute: () => 'Scheduled risk review workshop.' },
    { id: 'update-mitigations', label: 'Request mitigation updates', execute: () => 'Requested mitigation plan updates from owners.' },
    { id: 'escalate-urgent', label: 'Escalate urgent needs', execute: (st) => { const projId = st.projects?.[0]?.id; const n = projId ? buildUrgentNeeds().filter(i => i.projectId === projId && i.severity === 'critical').length : 0; return n ? `Escalated ${n} critical item(s).` : 'No critical items to escalate.'; } },
  ],
  buildContext(s) {
    const risks = s.risks ?? [];
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds().filter(n => n.projectId === projId) : [];
    const riskLines = risks.map(r => `  ${r.title}: severity ${r.severity}, impact: ${r.impact}, mitigation: ${r.mitigation}`);
    const urgentLines = urgent.map(u => `  [${u.severity.toUpperCase()}] ${u.title} -- ${u.subtitle} (${u.category})`);
    return `Project: ${s.projectName}\nRisks (${risks.length}):\n${riskLines.join('\n')}\nUrgent Needs (${urgent.length}):\n${urgentLines.join('\n')}`;
  },
  localRespond(q, s) {
    const risks = s.risks ?? [];
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds().filter(n => n.projectId === projId) : [];

    if (kw(q, 'urgent', 'needs', 'action', 'attention')) {
      if (!urgent.length) return 'No urgent needs flagged for this project.';
      return urgent.map(u => `- [${u.severity}] **${u.title}**: ${u.subtitle}`).join('\n');
    }
    if (kw(q, 'high', 'biggest', 'critical', 'severe')) {
      const highRisks = risks.filter(r => r.severity === 'high');
      const criticalNeeds = urgent.filter(u => u.severity === 'critical');
      const parts: string[] = [];
      if (criticalNeeds.length) parts.push(`**Critical needs:** ${criticalNeeds.map(u => u.title).join(', ')}`);
      if (highRisks.length) parts.push(`**High risks:** ${highRisks.map(r => `${r.title} -- ${r.impact}`).join('; ')}`);
      return parts.length ? parts.join('\n\n') : 'No high-severity risks or critical needs.';
    }
    if (kw(q, 'mitigation', 'response', 'plan')) {
      return risks.map(r => `${r.title}: ${r.mitigation}`).join('; ') || 'No risks documented.';
    }
    return `${risks.length} risks and ${urgent.length} urgent needs for ${s.projectName}. ${risks.filter(r => r.severity === 'high').length} high-severity risks, ${urgent.filter(u => u.severity === 'critical').length} critical needs. Ask about specific items.`;
  },
};

const drawingAgent: WidgetAgent = {
  id: 'drawing',
  name: 'Drawing',
  systemPrompt: 'You are a document control specialist for construction projects. You track drawing revisions, review cycles, and help manage the drawing submission process.',
  suggestions(s) {
    const n = (s.drawings ?? []).length;
    return n > 5
      ? ['Show latest drawing revisions', 'How many drawings need review?', 'Are there any drawing approval bottlenecks?']
      : ['How many drawings need review?', 'Show latest drawing revisions', 'Are there any drawing approval bottlenecks?'];
  },
  insight(s) {
    const n = (s.drawings ?? []).length;
    return n ? `${n} drawing${n === 1 ? '' : 's'} in the set` : null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'issue-transmittal', label: 'Issue transmittal', execute: () => 'Created drawing transmittal draft.' },
    { id: 'notify-subs', label: 'Notify subcontractors of updates', execute: () => 'Notified subs of latest drawing set.' },
  ],
  buildContext(s) {
    const parts: string[] = [`Project: ${s.projectName}`];
    if (s.latestDrawing) {
      const d = s.latestDrawing;
      parts.push(`Latest drawing: ${d.name}, version: ${d.version}, type: ${d.type}, updated by ${d.updatedBy} on ${d.updatedAt}, revisions: ${d.revisionCount}, file size: ${d.fileSize}`);
    }
    if (s.drawings?.length) {
      parts.push(`All drawings (${s.drawings.length}):`);
      for (const d of s.drawings) {
        parts.push(`  ${d.title}: ${d.revision}, ${d.date}`);
      }
    }
    return parts.join('\n');
  },
  localRespond(q, s) {
    const drawings = s.drawings ?? [];
    if (kw(q, 'how many', 'count', 'total')) {
      return `${drawings.length} drawings on file for ${s.projectName}.`;
    }
    if (kw(q, 'latest', 'recent', 'revision')) {
      if (s.latestDrawing) {
        return `Latest: ${s.latestDrawing.name} (${s.latestDrawing.version}), updated by ${s.latestDrawing.updatedBy} on ${s.latestDrawing.updatedAt}.`;
      }
      return drawings.length ? `Most recent: ${drawings[0].title} (${drawings[0].revision}, ${drawings[0].date})` : 'No drawings available.';
    }
    return `Tracking ${drawings.length} drawings for ${s.projectName}. Ask about revisions, latest updates, or specific drawings.`;
  },
};

const budgetAgent: WidgetAgent = {
  id: 'budget',
  name: 'Budget',
  systemPrompt: 'You are a cost control specialist for construction projects. You analyze burn rates, forecast overruns, advise on budget allocation, and track cost categories.',
  suggestions(s) {
    const pct = s.budgetPct ?? 0;
    return pct > 80
      ? ['Explain budget overrun risk', 'How is the budget tracking?', 'Which cost categories are over budget?', 'Forecast the end-of-project spend']
      : ['How is the budget tracking?', 'Which cost categories are over budget?', 'Forecast the end-of-project spend'];
  },
  insight(s) {
    const pct = s.budgetPct ?? 0;
    if (pct <= 80 && (s.budgetHealthy ?? true)) return null;
    const history = s.budgetHistory ?? [];
    const last = history.filter(h => h.actual != null && h.actual > 0).pop();
    const trend = last && last.actual > last.planned ? 'trending above plan' : 'watch burn rate';
    return `${pct}% utilized -- ${trend}`;
  },
  alerts(s) {
    const pct = s.budgetPct ?? 0;
    return pct > 80 ? { level: 'warning', count: 1, label: 'over 80%' } : null;
  },
  actions: () => [
    { id: 'freeze-noncritical', label: 'Flag discretionary spend hold', execute: () => 'Flagged discretionary spend for review.' },
    { id: 'owner-brief', label: 'Brief project owner on variance', execute: () => 'Scheduled owner budget brief.' },
  ],
  buildContext(s) {
    const parts: string[] = [`Project: ${s.projectName}`];
    parts.push(`Budget: ${s.budgetUsed} of ${s.budgetTotal} (${s.budgetPct}%)`);
    parts.push(`Health: ${s.budgetHealthy ? 'On track' : 'Critical'}`);
    if (s.budgetRemaining) parts.push(`Remaining: ${s.budgetRemaining}`);
    if (s.budgetBreakdown?.length) {
      parts.push('Breakdown by category:');
      for (const item of s.budgetBreakdown) parts.push(`  ${item.label}: ${item.amount} (${item.pct}%)`);
    }
    if (s.jobCostCategories?.length) {
      parts.push('Job cost summary:');
      for (const cat of s.jobCostCategories) parts.push(`  ${cat.label}: ${cat.amount}, ${cat.pctSpend}% of spend, ${cat.pctBudget}% of budget`);
    }
    const history = s.budgetHistory ?? [];
    if (history.length) {
      parts.push('Budget trend (planned vs actual):');
      for (const h of history) parts.push(`  ${h.month}: planned $${(h.planned / 1000).toFixed(0)}K, actual $${h.actual ? (h.actual / 1000).toFixed(0) + 'K' : 'TBD'}, forecast $${(h.forecast / 1000).toFixed(0)}K`);
    }
    const projCos = (s.changeOrders ?? []).filter(c => c.project === s.projectName);
    if (projCos.length) {
      const pendingAmt = projCos.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
      parts.push(`Change orders: ${projCos.length} total, $${pendingAmt.toLocaleString()} pending`);
    }
    return parts.join('\n');
  },
  localRespond(q, s) {
    if (kw(q, 'tracking', 'status', 'how', 'overview')) {
      const projCos = (s.changeOrders ?? []).filter(c => c.project === s.projectName && c.status === 'pending');
      const coHint = projCos.length ? ` ${projCos.length} pending change order(s) may shift forecast.` : '';
      return `Budget is ${s.budgetPct}% utilized (${s.budgetUsed} of ${s.budgetTotal}). ${s.budgetHealthy ? 'On track.' : 'Critical -- at risk of overrun.'}${s.budgetRemaining ? ` Remaining: ${s.budgetRemaining}.` : ''}${coHint}`;
    }
    if (kw(q, 'category', 'breakdown', 'cost')) {
      const bd = s.budgetBreakdown ?? [];
      return bd.length ? `Budget breakdown: ${bd.map(b => `${b.label}: ${b.amount} (${b.pct}%)`).join(', ')}` : 'No breakdown available.';
    }
    if (kw(q, 'trend', 'history', 'month')) {
      const history = s.budgetHistory ?? [];
      if (!history.length) return 'No budget trend data available.';
      const latest = history.filter(h => h.actual > 0).pop();
      return latest ? `Latest actual spend: $${(latest.actual / 1000).toFixed(0)}K in ${latest.month} (planned: $${(latest.planned / 1000).toFixed(0)}K). ${latest.actual > latest.planned ? 'Running over planned spend.' : 'Within planned spend.'}` : 'No actuals recorded yet.';
    }
    if (kw(q, 'change order', 'co-')) {
      const projCos = (s.changeOrders ?? []).filter(c => c.project === s.projectName);
      return projCos.length ? `${projCos.length} change order(s) for this project: ${projCos.map(c => `${c.id} $${c.amount.toLocaleString()} (${c.status})`).join(', ')}` : 'No change orders for this project.';
    }
    if (kw(q, 'forecast', 'overrun', 'over budget')) {
      return `Current spend is ${s.budgetPct}% of total budget. ${(s.budgetPct ?? 0) > 80 ? 'At risk of overrun at current burn rate.' : 'Within acceptable range.'}`;
    }
    return `Budget: ${s.budgetUsed}/${s.budgetTotal} (${s.budgetPct}%). ${s.budgetHealthy ? 'Healthy.' : 'Critical.'} Ask about categories, forecasts, trends, or change orders.`;
  },
};

const teamAgent: WidgetAgent = {
  id: 'team',
  name: 'Team',
  systemPrompt: 'You are a resource management specialist for construction projects. You track team allocation, availability, workload distribution, upcoming time off, and help identify staffing risks.',
  suggestions(s) {
    const pto = s.projectTimeOff ?? [];
    const pending = pto.filter(r => r.status === 'Pending').length;
    const conflicts = s.staffingConflicts ?? [];
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    if (critical) return ['Show staffing conflicts from PTO', 'Who is assigned to this project?', 'Show team availability'];
    if (pending) return [`${pending} pending PTO request${pending === 1 ? '' : 's'} on this project`, 'Who is assigned to this project?', 'Show team availability'];
    return ['Who is assigned to this project?', 'Show upcoming time off', 'Show team availability'];
  },
  insight(s) {
    const conflicts = s.staffingConflicts ?? [];
    const critical = conflicts.filter(c => c.severity === 'critical');
    if (critical.length) return `${critical.length} week${critical.length === 1 ? '' : 's'} with critical staffing gaps from PTO`;
    const pto = s.projectTimeOff ?? [];
    const upcoming = pto.filter(r => r.status !== 'Denied');
    if (upcoming.length) return `${upcoming.length} upcoming time-off request${upcoming.length === 1 ? '' : 's'}`;
    const low = (s.team ?? []).filter(t => t.availability < 50);
    if (low.length) return `${low.length} member${low.length === 1 ? '' : 's'} under 50% availability`;
    return null;
  },
  alerts(s) {
    const conflicts = s.staffingConflicts ?? [];
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    if (critical) return { level: 'critical', count: critical, label: 'staffing gaps' };
    const warnings = conflicts.filter(c => c.severity === 'warning').length;
    if (warnings) return { level: 'warning', count: warnings, label: 'reduced capacity' };
    return null;
  },
  actions(s) {
    const actions: AgentAction[] = [
      { id: 'rebalance', label: 'Suggest workload rebalance', execute: () => 'Generated workload rebalance suggestions.' },
      { id: 'request-backfill', label: 'Request backfill resource', execute: () => 'Submitted backfill resource request.' },
    ];
    const conflicts = s.staffingConflicts ?? [];
    if (conflicts.some(c => c.severity === 'critical')) {
      actions.unshift({ id: 'escalate-staffing', label: 'Escalate staffing gaps to PMO', execute: () => {
        const crit = conflicts.filter(c => c.severity === 'critical');
        return `Escalated ${crit.length} critical staffing gap(s) to PMO: ${crit.map(c => `${c.week} (${c.absentees.join(', ')} out)`).join('; ')}`;
      }});
    }
    return actions;
  },
  buildContext(s) {
    const team = s.team ?? [];
    const pto = s.projectTimeOff ?? [];
    const conflicts = s.staffingConflicts ?? [];
    const teamLines = team.map(t => `  ${t.name} (${t.role}): ${t.tasksCompleted}/${t.tasksTotal} tasks, ${t.availability}% available`);
    const ptoLines = pto.map(r => `  ${r.name}: ${r.type}, ${r.startDate}-${r.endDate} (${r.days}d), ${r.status}`);
    const conflictLines = conflicts.map(c => `  ${c.week}: ${c.absentCount}/${c.teamSize} out (${c.absentPct}%) [${c.severity}] -- ${c.absentees.join(', ')}`);
    return `Project: ${s.projectName}\nTeam (${team.length}):\n${teamLines.join('\n')}\n\nTime Off (${pto.length}):\n${ptoLines.join('\n') || '  None'}\n\nStaffing Conflicts:\n${conflictLines.join('\n') || '  None'}`;
  },
  localRespond(q, s) {
    const team = s.team ?? [];
    const pto = s.projectTimeOff ?? [];
    const conflicts = s.staffingConflicts ?? [];
    if (kw(q, 'conflict', 'staffing', 'gap', 'risk', 'issue')) {
      if (!conflicts.length) return `No staffing conflicts detected for ${s.projectName}.`;
      return `Staffing conflicts for ${s.projectName}:\n${conflicts.map(c => `- ${c.week}: ${c.absentees.join(', ')} out (${c.absentPct}% of team) -- ${c.reason}`).join('\n')}`;
    }
    if (kw(q, 'time off', 'pto', 'vacation', 'leave', 'absent')) {
      if (!pto.length) return `No upcoming time-off requests for ${s.projectName}.`;
      return `Time off for ${s.projectName} (${pto.length}):\n${pto.map(r => `- ${r.name}: ${r.type}, ${r.startDate}-${r.endDate} (${r.days}d) -- ${r.status}`).join('\n')}`;
    }
    if (kw(q, 'who', 'assigned', 'member', 'list')) {
      return team.length ? `Team (${team.length}): ${team.map(t => `${t.name} (${t.role})`).join(', ')}` : 'No team data available.';
    }
    if (kw(q, 'availability', 'available', 'capacity')) {
      const low = team.filter(t => t.availability < 50);
      return low.length ? `${low.length} member(s) with low availability: ${low.map(t => `${t.name} (${t.availability}%)`).join(', ')}` : 'All team members have adequate availability.';
    }
    return `${team.length} team members on ${s.projectName}, ${pto.length} time-off requests. Ask about staffing conflicts, PTO, availability, or team roles.`;
  },
};

const activityAgent: WidgetAgent = {
  id: 'activity',
  name: 'Recent Activity',
  systemPrompt: 'You are a project activity analyst for a construction project. You track recent changes, updates, and team actions.',
  suggestions: ['What changed recently on this project?', 'Show the latest updates', 'Who has been most active?'],
  insight(s) {
    const n = (s.projectActivity ?? []).length;
    return n ? `${n} recent project update${n === 1 ? '' : 's'}` : null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'pin-summary', label: 'Pin activity summary to dashboard', execute: () => 'Pinned latest activity summary.' },
  ],
  buildContext(s) {
    const activity = s.projectActivity ?? [];
    const lines = activity.map(a => `  ${a.text} (${a.timeAgo})`);
    return `Project: ${s.projectName}\nRecent activity (${activity.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const activity = s.projectActivity ?? [];
    return activity.length ? `Recent activity on ${s.projectName}: ${activity.map(a => a.text).join('; ')}` : 'No recent activity.';
  },
};

const projectDefault: WidgetAgent = {
  id: 'projectDefault',
  name: 'Project Overview',
  systemPrompt: 'You are a project delivery assistant for a construction project. You have access to all project data including milestones, tasks, risks, budget, team, drawings, RFIs, submittals, change orders, inspections, daily reports, and weather impacts. Provide comprehensive project insights.',
  suggestions(s) {
    const attn = (s.projectAttentionItems ?? []).length;
    return attn
      ? ['Any items needing attention?', 'Summarize project progress', 'What are the biggest risks right now?', 'How is the budget tracking?']
      : ['Summarize project progress', 'What are the biggest risks right now?', 'How is the budget tracking?', 'Any items needing attention?'];
  },
  insight(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    const overdueTasks = (s.tasks ?? []).filter(t => t.status.toLowerCase().includes('overdue')).length;
    if (failed) return `${failed} failed inspection${failed === 1 ? '' : 's'} need follow-up`;
    if (overdueTasks) return `${overdueTasks} overdue task${overdueTasks === 1 ? '' : 's'}`;
    if (!(s.budgetHealthy ?? true)) return 'Budget status critical';
    return null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'open-records', label: 'Open project records', execute: () => 'Navigated to project records.' },
    { id: 'open-financials', label: 'Open project financials', execute: () => 'Navigated to project financials.' },
    { id: 'share-status', label: 'Share status one-pager', execute: () => 'Generated status one-pager link.' },
  ],
  buildContext(s) {
    const parts: string[] = [];
    parts.push(`Project: ${s.projectName}, Status: ${s.projectStatus}`);
    parts.push(`Budget: ${s.budgetUsed} of ${s.budgetTotal} (${s.budgetPct}%), ${s.budgetHealthy ? 'On track' : 'Critical'}`);
    parts.push(`Milestones: ${s.completedMilestones ?? 0} of ${(s.milestones ?? []).length} completed`);
    parts.push(`Open tasks: ${s.openTaskCount ?? 0}`);
    const highRisks = (s.risks ?? []).filter(r => r.severity === 'high');
    if (highRisks.length) parts.push(`High risks: ${highRisks.map(r => r.title).join(', ')}`);
    parts.push(`Team: ${(s.team ?? []).map(t => `${t.name} (${t.role})`).join('; ')}`);
    parts.push(`Drawings: ${(s.drawings ?? []).length} on file`);
    const projRfis = (s.rfis ?? []).filter(r => r.project === s.projectName);
    if (projRfis.length) parts.push(`RFIs for this project: ${projRfis.length}`);
    const projSubs = (s.submittals ?? []).filter(sub => sub.project === s.projectName);
    if (projSubs.length) parts.push(`Submittals for this project: ${projSubs.length}`);
    const projCos = (s.changeOrders ?? []).filter(c => c.project === s.projectName);
    if (projCos.length) parts.push(`Change orders: ${projCos.length} (${projCos.filter(c => c.status === 'pending').length} pending)`);
    const projAttn = s.projectAttentionItems ?? [];
    if (projAttn.length) parts.push(`Attention items: ${projAttn.map(a => `[${a.severity}] ${a.title}`).join('; ')}`);
    const projInsp = s.inspections ?? [];
    if (projInsp.length) {
      const failed = projInsp.filter(i => i.result === 'fail').length;
      const pending = projInsp.filter(i => i.result === 'pending').length;
      parts.push(`Inspections: ${projInsp.length} total, ${failed} failed, ${pending} pending`);
    }
    const impactDays = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none');
    if (impactDays.length) parts.push(`Weather alert: ${impactDays.length} day(s) with work impact this week`);
    return parts.join('\n');
  },
  localRespond(q, s) {
    if (kw(q, 'risk')) return risksAgent.localRespond(q, s);
    if (kw(q, 'task', 'overdue')) return tasksAgent.localRespond(q, s);
    if (kw(q, 'budget', 'spend', 'cost')) return budgetAgent.localRespond(q, s);
    if (kw(q, 'milestone', 'schedule')) return milestonesAgent.localRespond(q, s);
    if (kw(q, 'team', 'assign', 'resource')) return teamAgent.localRespond(q, s);
    if (kw(q, 'drawing')) return drawingAgent.localRespond(q, s);
    if (kw(q, 'change order', 'co-')) return changeOrdersAgent.localRespond(q, s);
    if (kw(q, 'inspection', 'punch', 'quality')) return inspectionsAgent.localRespond(q, s);
    if (kw(q, 'weather', 'rain', 'forecast')) return weatherAgent.localRespond(q, s);
    if (kw(q, 'daily report', 'field report', 'crew')) return dailyReportsAgent.localRespond(q, s);
    if (kw(q, 'attention', 'alert', 'critical', 'urgent')) {
      const items = s.projectAttentionItems ?? [];
      return items.length ? `${items.length} attention item(s): ${items.map(i => `[${i.severity}] ${i.title} -- ${i.subtitle}`).join('; ')}` : 'No items need attention.';
    }
    if (kw(q, 'progress', 'summary', 'status', 'overview')) {
      return `${s.projectName}: ${s.projectStatus}. Budget ${s.budgetPct}% utilized. ${s.completedMilestones ?? 0}/${(s.milestones ?? []).length} milestones done. ${s.openTaskCount ?? 0} open tasks. ${(s.risks ?? []).filter(r => r.severity === 'high').length} high-severity risks. ${(s.changeOrders ?? []).filter(c => c.project === s.projectName && c.status === 'pending').length} pending change orders.`;
    }
    return `Project ${s.projectName} is ${s.projectStatus}. Ask about budget, milestones, tasks, risks, team, drawings, change orders, inspections, or weather.`;
  },
};

const recordsRfis: WidgetAgent = {
  id: 'recordsRfis',
  name: 'RFIs (Records)',
  systemPrompt: 'You are an RFI management specialist. You have access to all RFIs for this project and can analyze response patterns, overdue items, and assignment distribution.',
  suggestions(s) {
    const rfis = s.rfis ?? [];
    const overdue = rfis.filter(r => r.status === 'overdue');
    return overdue.length
      ? ['Which RFIs are overdue?', 'Show open RFIs by assignee', 'Summarize RFI status']
      : ['Summarize RFI status', 'Show open RFIs by assignee', 'Which RFIs are overdue?'];
  },
  insight(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue');
    if (!overdue.length) return null;
    return `${overdue.length} overdue on this project`;
  },
  alerts(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue').length;
    return overdue ? { level: 'critical', count: overdue, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'nudge-assignees', label: 'Nudge assignees on overdue RFIs', execute: (st) => {
      const n = (st.rfis ?? []).filter(r => r.status === 'overdue').length;
      return n ? `Sent nudges for ${n} overdue RFI(s).` : 'No overdue RFIs.';
    }},
    { id: 'export-rfi-log', label: 'Export RFI log', execute: () => 'Exported project RFI log.' },
  ],
  buildContext(s) {
    const rfis = s.rfis ?? [];
    if (!rfis.length) return `Project: ${s.projectName}\nNo RFIs.`;
    const lines = rfis.map(r => `  ${r.number}: ${r.subject}, asked by ${r.askedBy}, assignee: ${r.assignee}, status: ${r.status}, due: ${r.dueDate}\n    Question: ${r.question}`);
    return `Project: ${s.projectName}\nRFIs (${rfis.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) { return homeRfis.localRespond(q, s); },
};

const recordsSubmittals: WidgetAgent = {
  id: 'recordsSubmittals',
  name: 'Submittals (Records)',
  systemPrompt: 'You are a submittal management specialist. You have access to all submittals for this project and can analyze approval cycles, overdue items, and assignment distribution.',
  suggestions(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    return overdue.length
      ? ['Which submittals are overdue?', 'Show open submittals by assignee', 'Summarize submittal status']
      : ['Summarize submittal status', 'Show open submittals by assignee', 'Which submittals are overdue?'];
  },
  insight(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    if (!overdue.length) return null;
    return `${overdue.length} overdue submittal${overdue.length === 1 ? '' : 's'} on this project`;
  },
  alerts(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue').length;
    return overdue ? { level: 'critical', count: overdue, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'expedite-subs', label: 'Expedite overdue reviews', execute: (st) => {
      const n = (st.submittals ?? []).filter(sub => sub.status === 'overdue').length;
      return n ? `Expedited ${n} overdue submittal(s).` : 'No overdue submittals.';
    }},
  ],
  buildContext(s) {
    const subs = s.submittals ?? [];
    if (!subs.length) return `Project: ${s.projectName}\nNo submittals.`;
    const lines = subs.map(sub => `  ${sub.number}: ${sub.subject}, assignee: ${sub.assignee}, status: ${sub.status}, due: ${sub.dueDate}`);
    return `Project: ${s.projectName}\nSubmittals (${subs.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) { return homeSubmittals.localRespond(q, s); },
};

const financialsBudget: WidgetAgent = {
  id: 'financialsBudget',
  name: 'Budget (Financials)',
  systemPrompt: 'You are a cost control specialist for a construction project. You have full visibility into budget allocation, job cost categories, and spending patterns.',
  suggestions: (st) => getSuggestions(budgetAgent, st),
  insight: (st) => budgetAgent.insight?.(st) ?? null,
  alerts: (st) => budgetAgent.alerts?.(st) ?? null,
  actions: (st) => budgetAgent.actions?.(st) ?? [],
  buildContext(s) { return budgetAgent.buildContext(s); },
  localRespond(q, s) { return budgetAgent.localRespond(q, s); },
};

const financialsSubledger: WidgetAgent = {
  id: 'financialsSubledger',
  name: 'Subledger',
  systemPrompt: 'You are a cost accounting specialist for construction projects. You have access to transaction-level subledger data and can analyze spending patterns, vendor payments, and cost trends for specific cost categories.',
  suggestions(s) {
    const txns = s.subledgerTransactions ?? [];
    return txns.length > 10
      ? ['Which vendors have the highest spend?', 'Summarize transactions for this category', 'Show spending trend over time']
      : ['Summarize transactions for this category', 'Which vendors have the highest spend?', 'Show spending trend over time'];
  },
  insight(s) {
    const txns = s.subledgerTransactions ?? [];
    if (!txns.length) return null;
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    return `${txns.length} txn${txns.length === 1 ? '' : 's'}, $${total.toLocaleString()} in ${s.subledgerCategory ?? 'category'}`;
  },
  alerts: () => null,
  actions: () => [
    { id: 'export-ledger', label: 'Export subledger CSV', execute: () => 'Exported subledger transactions.' },
    { id: 'flag-anomaly', label: 'Flag unusual transactions', execute: () => 'Flagged transactions over 2 sigma for review.' },
  ],
  buildContext(s) {
    const parts: string[] = [`Project: ${s.projectName}`];
    if (s.subledgerCategory) parts.push(`Cost category: ${s.subledgerCategory}`);
    const txns = s.subledgerTransactions ?? [];
    if (txns.length) {
      parts.push(`Transactions (${txns.length}):`);
      for (const t of txns.slice(0, 30)) {
        parts.push(`  ${t.date}: ${t.description}, vendor: ${t.vendor}, $${t.amount.toLocaleString()}`);
      }
      if (txns.length > 30) parts.push(`  ... and ${txns.length - 30} more`);
    }
    return parts.join('\n');
  },
  localRespond(q, s) {
    const txns = s.subledgerTransactions ?? [];
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    if (kw(q, 'vendor', 'supplier', 'who')) {
      const byVendor: Record<string, number> = {};
      txns.forEach(t => { byVendor[t.vendor] = (byVendor[t.vendor] ?? 0) + t.amount; });
      const sorted = Object.entries(byVendor).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return sorted.length ? `Top vendors for ${s.subledgerCategory}: ${sorted.map(([v, a]) => `${v} ($${a.toLocaleString()})`).join(', ')}` : 'No vendor data available.';
    }
    if (kw(q, 'total', 'sum', 'spend', 'summary')) {
      return `${s.subledgerCategory} subledger: ${txns.length} transactions totaling $${total.toLocaleString()}.`;
    }
    return `${s.subledgerCategory} subledger has ${txns.length} transactions totaling $${total.toLocaleString()}. Ask about vendors, trends, or specific transactions.`;
  },
};

const drawingsPage: WidgetAgent = {
  id: 'drawingsPage',
  name: 'Drawings Library',
  systemPrompt: 'You are a document control specialist for construction projects. You manage the drawing library, track revisions, and help navigate the document set.',
  suggestions: (st) => getSuggestions(drawingAgent, st),
  insight: (st) => drawingAgent.insight?.(st) ?? null,
  alerts: () => null,
  actions: (st) => drawingAgent.actions?.(st) ?? [],
  buildContext(s) {
    const drawings = s.drawings ?? [];
    if (!drawings.length) return `Project: ${s.projectName}\nNo drawings.`;
    const lines = drawings.map(d => `  ${d.title}: ${d.revision}, ${d.date}, ${d.subtitle}`);
    return `Project: ${s.projectName}\nDrawing library (${drawings.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) { return drawingAgent.localRespond(q, s); },
};

const drawingDetail: WidgetAgent = {
  id: 'drawingDetail',
  name: 'Drawing Detail',
  systemPrompt: 'You are a drawing review specialist. You help analyze the current drawing, its revision history, and provide context about what is shown.',
  suggestions: ['What does this drawing show?', 'What revision is this?', 'When was this last updated?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'mark-superseded', label: 'Mark prior revision superseded', execute: () => 'Marked prior revision as superseded.' },
    { id: 'issue-for-construction', label: 'Issue for construction', execute: () => 'Recorded IFC issuance for this sheet.' },
    { id: 'add-cloud', label: 'Add review cloud comment', execute: () => 'Added review cloud placeholder.' },
  ],
  buildContext(s) {
    const d = s.detailDrawing;
    if (!d) return `Project: ${s.projectName}\nNo drawing selected.`;
    return `Project: ${s.projectName}\nViewing drawing: ${d.title}\n  ${d.subtitle}\n  Revision: ${d.revision}, Date: ${d.date}`;
  },
  localRespond(q, s) {
    const d = s.detailDrawing;
    if (!d) return 'No drawing is currently selected.';
    if (kw(q, 'what', 'show', 'about', 'describe')) return `${d.title}: ${d.subtitle}`;
    if (kw(q, 'revision', 'version')) return `Current revision: ${d.revision}, dated ${d.date}.`;
    return `Viewing ${d.title} (${d.revision}, ${d.date}). ${d.subtitle}`;
  },
};

const rfiDetail: WidgetAgent = {
  id: 'rfiDetail',
  name: 'RFI Detail',
  systemPrompt: 'You are an RFI resolution specialist. You help analyze the current RFI, its context, and suggest responses.',
  suggestions(s) {
    const r = s.detailRfi;
    if (r?.status === 'overdue') return ['Is this overdue?', 'Summarize this RFI', 'Who is responsible?'];
    return ['Summarize this RFI', 'Who is responsible?', 'Is this overdue?'];
  },
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'mark-resolved', label: 'Mark RFI resolved', execute: () => 'Marked RFI as resolved (demo).' },
    { id: 'reassign-rfi', label: 'Reassign RFI', execute: () => 'Reassigned RFI to alternate reviewer.' },
    { id: 'request-clarification', label: 'Request clarification from GC', execute: () => 'Sent clarification request to GC.' },
  ],
  buildContext(s) {
    const r = s.detailRfi;
    if (!r) return 'No RFI selected.';
    return `RFI ${r.number}: ${r.subject}\n  Question: ${r.question}\n  Asked by: ${r.askedBy} on ${r.askedOn}\n  Project: ${r.project}\n  Assignee: ${r.assignee}\n  Status: ${r.status}\n  Due: ${r.dueDate}`;
  },
  localRespond(q, s) {
    const r = s.detailRfi;
    if (!r) return 'No RFI is currently selected.';
    if (kw(q, 'summary', 'summarize', 'about', 'what')) return `${r.number}: ${r.subject}. Asked by ${r.askedBy} on ${r.askedOn}. Question: ${r.question}`;
    if (kw(q, 'who', 'responsible', 'assigned')) return `Assigned to ${r.assignee}. Asked by ${r.askedBy}.`;
    if (kw(q, 'overdue', 'due', 'deadline')) return `Due ${r.dueDate}. Status: ${r.status}.`;
    return `RFI ${r.number}: ${r.subject}. Status: ${r.status}, due ${r.dueDate}. Ask for a summary, assignee, or deadline.`;
  },
};

const submittalDetail: WidgetAgent = {
  id: 'submittalDetail',
  name: 'Submittal Detail',
  systemPrompt: 'You are a submittal processing specialist. You help analyze the current submittal, its review status, and advise on next steps.',
  suggestions(s) {
    const sub = s.detailSubmittal;
    if (sub?.status === 'overdue') return ['Is this overdue?', 'Summarize this submittal', 'Who is responsible?'];
    return ['Summarize this submittal', 'Who is responsible?', 'Is this overdue?'];
  },
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'approve-sub', label: 'Record approval', execute: () => 'Recorded submittal approval (demo).' },
    { id: 'revise-resubmit', label: 'Request revision', execute: () => 'Sent revision request to subcontractor.' },
    { id: 'extend-due', label: 'Extend review due date', execute: () => 'Extended review due date by 3 business days.' },
  ],
  buildContext(s) {
    const sub = s.detailSubmittal;
    if (!sub) return 'No submittal selected.';
    return `Submittal ${sub.number}: ${sub.subject}\n  Project: ${sub.project}\n  Assignee: ${sub.assignee}\n  Status: ${sub.status}\n  Due: ${sub.dueDate}`;
  },
  localRespond(q, s) {
    const sub = s.detailSubmittal;
    if (!sub) return 'No submittal is currently selected.';
    if (kw(q, 'summary', 'summarize', 'about', 'what')) return `${sub.number}: ${sub.subject}. Assigned to ${sub.assignee}. Status: ${sub.status}, due ${sub.dueDate}.`;
    if (kw(q, 'who', 'responsible', 'assigned')) return `Assigned to ${sub.assignee}.`;
    if (kw(q, 'overdue', 'due', 'deadline')) return `Due ${sub.dueDate}. Status: ${sub.status}.`;
    return `Submittal ${sub.number}: ${sub.subject}. Status: ${sub.status}, due ${sub.dueDate}. Ask for a summary, assignee, or deadline.`;
  },
};

const changeOrdersAgent: WidgetAgent = {
  id: 'changeOrders',
  name: 'Change Orders',
  systemPrompt: 'You are a change order management specialist for construction projects. You track Prime Contract COs, Potential COs, and Subcontract COs -- their pending approvals, financial impacts, and help evaluate change requests.',
  suggestions(s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(co => co.status === 'pending').length;
    const prime = cos.filter(co => co.coType === 'prime').length;
    const potential = cos.filter(co => co.coType === 'potential').length;
    const sub = cos.filter(co => co.coType === 'subcontract').length;
    return pending
      ? [`How many COs are pending? (${pending})`, `Break down by type: ${prime} prime, ${potential} potential, ${sub} subcontract`, 'What is the total financial exposure?']
      : ['What is the total financial impact?', 'Show approved change orders', 'Break down by type'];
  },
  insight(s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(co => co.status === 'pending');
    if (!pending.length) return null;
    const total = pending.reduce((sum, co) => sum + co.amount, 0);
    const prime = pending.filter(co => co.coType === 'prime').length;
    const potential = pending.filter(co => co.coType === 'potential').length;
    const sub = pending.filter(co => co.coType === 'subcontract').length;
    const parts: string[] = [];
    if (prime) parts.push(`${prime} prime`);
    if (potential) parts.push(`${potential} potential`);
    if (sub) parts.push(`${sub} subcontract`);
    return `${pending.length} pending ($${total.toLocaleString()}): ${parts.join(', ')}`;
  },
  alerts: () => null,
  actions: () => [
    { id: 'batch-approve', label: 'Route pending COs for signature', execute: (st) => {
      const pending = (st.changeOrders ?? []).filter(co => co.status === 'pending').length;
      return pending ? `Routed ${pending} change order(s) for signature.` : 'No pending change orders.';
    }},
    { id: 'export-co-log', label: 'Export change order log', execute: () => 'Exported change order register.' },
  ],
  buildContext(s) {
    const cos = s.changeOrders ?? [];
    if (!cos.length) return 'No change orders.';
    const byType = (type: string) => cos.filter(co => co.coType === type);
    const section = (label: string, list: typeof cos) => {
      if (!list.length) return '';
      const lines = list.map(co => `  ${co.id}: ${co.description}, project: ${co.project}, $${co.amount.toLocaleString()}, status: ${co.status}, requested by ${co.requestedBy} on ${co.requestDate}\n    Reason: ${co.reason}`);
      return `\n${label} (${list.length}):\n${lines.join('\n')}`;
    };
    return `Change orders (${cos.length} total):${section('Prime Contract COs', byType('prime'))}${section('Potential COs', byType('potential'))}${section('Subcontract COs', byType('subcontract'))}`;
  },
  localRespond(q, s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(co => co.status === 'pending');
    const approved = cos.filter(co => co.status === 'approved');
    const totalPending = pending.reduce((sum, co) => sum + co.amount, 0);
    if (kw(q, 'prime')) {
      const prime = cos.filter(co => co.coType === 'prime');
      const primePending = prime.filter(co => co.status === 'pending');
      return `${prime.length} prime contract CO(s): ${primePending.length} pending ($${primePending.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}), ${prime.filter(co => co.status === 'approved').length} approved.`;
    }
    if (kw(q, 'potential')) {
      const pot = cos.filter(co => co.coType === 'potential');
      return `${pot.length} potential CO(s) totaling $${pot.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}. ${pot.filter(co => co.status === 'pending').length} still pending evaluation.`;
    }
    if (kw(q, 'subcontract', 'sub ')) {
      const sub = cos.filter(co => co.coType === 'subcontract');
      const subPending = sub.filter(co => co.status === 'pending');
      return `${sub.length} subcontract CO(s): ${subPending.length} pending ($${subPending.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}), ${sub.filter(co => co.status === 'approved').length} approved.`;
    }
    if (kw(q, 'pending', 'how many', 'awaiting')) {
      return `${pending.length} pending change order(s) totaling $${totalPending.toLocaleString()}: ${pending.map(co => `${co.id} ($${co.amount.toLocaleString()})`).join(', ')}`;
    }
    if (kw(q, 'total', 'impact', 'financial', 'cost', 'exposure')) {
      const total = cos.reduce((sum, co) => sum + co.amount, 0);
      return `Total change order value: $${total.toLocaleString()} across ${cos.length} orders. $${totalPending.toLocaleString()} pending approval.`;
    }
    if (kw(q, 'approved')) {
      return approved.length ? `${approved.length} approved change order(s): ${approved.map(co => `${co.id} ($${co.amount.toLocaleString()})`).join(', ')}` : 'No approved change orders.';
    }
    if (kw(q, 'type', 'breakdown', 'break down')) {
      const prime = cos.filter(co => co.coType === 'prime');
      const pot = cos.filter(co => co.coType === 'potential');
      const sub = cos.filter(co => co.coType === 'subcontract');
      return `${cos.length} total COs: ${prime.length} prime ($${prime.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}), ${pot.length} potential ($${pot.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}), ${sub.length} subcontract ($${sub.reduce((s2, co) => s2 + co.amount, 0).toLocaleString()}).`;
    }
    return `Tracking ${cos.length} change orders: ${pending.length} pending, ${approved.length} approved. Total pending value: $${totalPending.toLocaleString()}.`;
  },
};

const dailyReportsAgent: WidgetAgent = {
  id: 'dailyReports',
  name: 'Daily Reports',
  systemPrompt: 'You are a field operations analyst for construction projects. You track daily reports including crew counts, work performed, weather impacts, and safety incidents.',
  suggestions(s) {
    const incidents = (s.dailyReports ?? []).reduce((sum, r) => sum + r.safetyIncidents, 0);
    return incidents
      ? ['Any safety incidents this week?', 'Show today\'s reports', 'How many crew hours were logged today?']
      : ['Show today\'s reports', 'How many crew hours were logged today?', 'Any safety incidents this week?'];
  },
  insight(s) {
    const incidents = (s.dailyReports ?? []).reduce((sum, r) => sum + r.safetyIncidents, 0);
    if (incidents) return `${incidents} safety incident${incidents === 1 ? '' : 's'} logged in recent reports`;
    return null;
  },
  alerts(s) {
    const incidents = (s.dailyReports ?? []).reduce((sum, r) => sum + r.safetyIncidents, 0);
    return incidents ? { level: 'critical', count: incidents, label: 'safety incidents' } : null;
  },
  actions: () => [
    { id: 'notify-safety', label: 'Notify safety lead', execute: () => 'Notified safety lead of recent reports.' },
    { id: 'export-drs', label: 'Export daily reports', execute: () => 'Exported daily reports PDF pack.' },
  ],
  buildContext(s) {
    const reports = s.dailyReports ?? [];
    if (!reports.length) return 'No daily reports.';
    const lines = reports.map(r => `  ${r.date} - ${r.project}: ${r.crewCount} crew, ${r.hoursWorked} hrs, weather: ${r.weather}\n    Work: ${r.workPerformed}\n    Issues: ${r.issues || 'None'}\n    Safety incidents: ${r.safetyIncidents}`);
    return `Daily reports (${reports.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const reports = s.dailyReports ?? [];
    const totalCrew = reports.reduce((sum, r) => sum + r.crewCount, 0);
    const totalHours = reports.reduce((sum, r) => sum + r.hoursWorked, 0);
    const incidents = reports.reduce((sum, r) => sum + r.safetyIncidents, 0);
    if (kw(q, 'safety', 'incident', 'accident')) {
      return incidents > 0 ? `${incidents} safety incident(s) reported across ${reports.length} daily reports.` : `No safety incidents across ${reports.length} reports.`;
    }
    if (kw(q, 'crew', 'hour', 'logged', 'today')) {
      const impactDays = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none');
      const wx = impactDays.length ? ` Weather may affect exterior crew on ${impactDays.length} day(s) this week.` : '';
      return `${reports.length} reports filed: ${totalCrew} total crew members, ${totalHours} total hours logged.${wx}`;
    }
    if (kw(q, 'issue', 'problem', 'delay')) {
      const withIssues = reports.filter(r => r.issues && r.issues !== 'None');
      return withIssues.length ? `${withIssues.length} report(s) with issues: ${withIssues.map(r => `${r.project}: ${r.issues}`).join('; ')}` : 'No issues reported.';
    }
    return `${reports.length} daily reports on file. ${totalCrew} crew, ${totalHours} hours logged, ${incidents} safety incidents. Ask about specific projects, issues, or safety.`;
  },
};

const weatherAgent: WidgetAgent = {
  id: 'weather',
  name: 'Weather Forecast',
  systemPrompt: 'You are a construction scheduling advisor who monitors weather impacts on field work. You help plan around adverse conditions and advise on schedule adjustments.',
  suggestions(s) {
    const impact = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none').length;
    return impact
      ? ['Will weather impact work this week?', 'When is the next rain day?', 'Show the 7-day forecast']
      : ['Show the 7-day forecast', 'When is the next rain day?', 'Will weather impact work this week?'];
  },
  insight(s) {
    const forecast = s.weatherForecast ?? [];
    const rain = forecast.find(f => f.condition === 'rain' || f.precipPct > 50);
    const impact = forecast.filter(f => f.workImpact !== 'none');
    if (impact.length && rain) return `${rain.day} -- may impact exterior work`;
    if (impact.length) return `${impact.length} day(s) with work impact this week`;
    return null;
  },
  alerts(s) {
    const impact = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none').length;
    return impact >= 2 ? { level: 'warning', count: impact, label: 'work impact days' } : null;
  },
  actions: () => [
    { id: 'notify-subs-weather', label: 'Alert subs to weather plan', execute: () => 'Sent weather lookahead to subcontractors.' },
    { id: 'tentative-indoors', label: 'Shift critical path indoors', execute: () => 'Flagged tentative indoor trade shifts.' },
  ],
  buildContext(s) {
    const forecast = s.weatherForecast ?? [];
    if (!forecast.length) return 'No weather data available.';
    const lines = forecast.map(f => `  ${f.day} ${f.date}: ${f.condition}, ${f.highF}/${f.lowF}F, ${f.precipPct}% precip, wind ${f.windMph}mph, impact: ${f.workImpact}${f.note ? ` -- ${f.note}` : ''}`);
    return `7-day weather forecast:\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const forecast = s.weatherForecast ?? [];
    const impactDays = forecast.filter(f => f.workImpact !== 'none');
    if (kw(q, 'impact', 'affect', 'delay', 'problem')) {
      return impactDays.length ? `${impactDays.length} day(s) with work impact: ${impactDays.map(f => `${f.day} ${f.date} (${f.workImpact}: ${f.note || f.condition})`).join('; ')}` : 'No weather-related work impacts expected this week.';
    }
    if (kw(q, 'rain', 'storm', 'precip')) {
      const rainDays = forecast.filter(f => f.precipPct > 50);
      return rainDays.length ? `Rain likely on: ${rainDays.map(f => `${f.day} ${f.date} (${f.precipPct}% chance)`).join(', ')}` : 'No significant rain expected.';
    }
    return `7-day outlook: ${impactDays.length} day(s) with potential work impact. ${forecast.filter(f => f.condition === 'rain').length} rain days expected.`;
  },
};

const inspectionsAgent: WidgetAgent = {
  id: 'inspections',
  name: 'Inspections',
  systemPrompt: 'You are a quality control and compliance specialist for construction projects. You track inspections, identify failed items requiring re-inspection, and manage punch lists.',
  suggestions(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    return failed
      ? ['Any failed inspections?', 'Show pending inspections', 'Summarize punch list items']
      : ['Show pending inspections', 'Summarize punch list items', 'Any failed inspections?'];
  },
  insight(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    const openPunch = (s.punchListItems ?? []).filter(p => p.status === 'open' || p.status === 'in-progress').length;
    if (failed) return `${failed} failed inspection${failed === 1 ? '' : 's'}, ${openPunch} open punch item${openPunch === 1 ? '' : 's'}`;
    if (openPunch > 3) return `${openPunch} open punch items need closure`;
    return null;
  },
  alerts(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    return failed ? { level: 'critical', count: failed, label: 'failed' } : null;
  },
  actions: () => [
    { id: 'schedule-reinspect', label: 'Schedule re-inspections', execute: (st) => {
      const failed = (st.inspections ?? []).filter(i => i.result === 'fail').length;
      return failed ? `Scheduled re-inspection for ${failed} failed item(s).` : 'No failed inspections to schedule.';
    }},
    { id: 'punch-blitz', label: 'Assign punch blitz crew', execute: () => 'Assigned punch list blitz for next dry day.' },
  ],
  buildContext(s) {
    const insp = s.inspections ?? [];
    const punch = s.punchListItems ?? [];
    const parts: string[] = [];
    if (insp.length) {
      parts.push(`Inspections (${insp.length}):`);
      for (const i of insp) parts.push(`  ${i.id}: ${i.type} at ${i.project}, ${i.date}, result: ${i.result}, by ${i.inspector}${i.notes ? `\n    ${i.notes}` : ''}${i.followUp ? `\n    Follow-up: ${i.followUp}` : ''}`);
    }
    if (punch.length) {
      parts.push(`\nPunch list items (${punch.length}):`);
      for (const p of punch) parts.push(`  ${p.id}: ${p.description} at ${p.location} (${p.project}), assigned to ${p.assignee}, priority: ${p.priority}, status: ${p.status}`);
    }
    return parts.join('\n') || 'No inspection or punch list data.';
  },
  localRespond(q, s) {
    const insp = s.inspections ?? [];
    const punch = s.punchListItems ?? [];
    if (kw(q, 'fail', 'failed', 'deficiency')) {
      const failed = insp.filter(i => i.result === 'fail');
      const openPunch = punch.filter(p => p.status === 'open' || p.status === 'in-progress').length;
      const punchHint = failed.length && openPunch ? ` Related: ${openPunch} open punch item(s) may tie to these findings.` : '';
      return failed.length ? `${failed.length} failed inspection(s): ${failed.map(i => `${i.type} at ${i.project} -- ${i.notes}`).join('; ')}${punchHint}` : 'No failed inspections.';
    }
    if (kw(q, 'pending', 'scheduled', 'upcoming')) {
      const pending = insp.filter(i => i.result === 'pending');
      return pending.length ? `${pending.length} pending inspection(s): ${pending.map(i => `${i.type} at ${i.project} (${i.followUp})`).join('; ')}` : 'No pending inspections.';
    }
    if (kw(q, 'punch', 'punchlist', 'punch list', 'open item')) {
      const open = punch.filter(p => p.status === 'open' || p.status === 'in-progress');
      return `${open.length} open punch list item(s) of ${punch.length} total.${open.length ? ` High priority: ${punch.filter(p => p.priority === 'high' && p.status !== 'completed' && p.status !== 'verified').length}.` : ''}`;
    }
    return `${insp.length} inspections on record (${insp.filter(i => i.result === 'pass').length} passed, ${insp.filter(i => i.result === 'fail').length} failed). ${punch.length} punch list items tracked.`;
  },
};

const revenueAgent: WidgetAgent = {
  id: 'revenue',
  name: 'Revenue',
  systemPrompt: 'You are a revenue and accounts receivable specialist for construction projects. You track invoicing, collections, outstanding amounts, and retainage across the portfolio.',
  suggestions(s) {
    const rev = s.projectRevenue ?? [];
    const high = rev.filter(r => r.outstandingRaw > 20000).length;
    return high
      ? ['Which projects have unpaid invoices?', 'What is the total outstanding amount?', 'Show retainage summary']
      : ['What is the total outstanding amount?', 'Show retainage summary', 'Which projects have unpaid invoices?'];
  },
  insight(s) {
    const rev = s.projectRevenue ?? [];
    const top = [...rev].sort((a, b) => b.outstandingRaw - a.outstandingRaw)[0];
    if (top && top.outstandingRaw > 15000) return `Largest AR: ${top.projectName} ($${(top.outstandingRaw / 1000).toFixed(0)}K outstanding)`;
    return null;
  },
  alerts(s) {
    const rev = s.projectRevenue ?? [];
    const late = rev.filter(r => r.outstandingRaw > 50000).length;
    return late ? { level: 'warning', count: late, label: 'large outstanding' } : null;
  },
  actions: () => [
    { id: 'send-statements', label: 'Send collection statements', execute: () => 'Queued AR statements to clients.' },
    { id: 'retainage-release', label: 'Prepare retainage release packet', execute: () => 'Prepared retainage release checklist.' },
  ],
  buildContext(s) {
    const rev = s.projectRevenue ?? [];
    if (!rev.length) return 'No revenue data.';
    const lines = rev.map(r => `  ${r.projectName}: contract ${r.contractValue}, invoiced ${r.invoiced}, collected ${r.collected}, outstanding ${r.outstanding}, retainage ${r.retainage}`);
    const totalInvoiced = rev.reduce((sum, r) => sum + r.invoicedRaw, 0);
    const totalCollected = rev.reduce((sum, r) => sum + r.collectedRaw, 0);
    const totalOutstanding = rev.reduce((sum, r) => sum + r.outstandingRaw, 0);
    const totalRetainage = rev.reduce((sum, r) => sum + r.retainageRaw, 0);
    return `Revenue by project (${rev.length}):\n${lines.join('\n')}\n\nTotals: invoiced $${(totalInvoiced / 1000).toFixed(0)}K, collected $${(totalCollected / 1000).toFixed(0)}K, outstanding $${(totalOutstanding / 1000).toFixed(0)}K, retainage $${(totalRetainage / 1000).toFixed(0)}K`;
  },
  localRespond(q, s) {
    const rev = s.projectRevenue ?? [];
    const totalOutstanding = rev.reduce((sum, r) => sum + r.outstandingRaw, 0);
    const totalRetainage = rev.reduce((sum, r) => sum + r.retainageRaw, 0);
    if (kw(q, 'outstanding', 'unpaid', 'owed', 'receivable')) {
      return `Total outstanding: $${(totalOutstanding / 1000).toFixed(0)}K across ${rev.filter(r => r.outstandingRaw > 0).length} project(s).${rev.filter(r => r.outstandingRaw > 20000).length ? ` Largest: ${rev.sort((a, b) => b.outstandingRaw - a.outstandingRaw)[0].projectName} ($${(rev[0].outstandingRaw / 1000).toFixed(0)}K).` : ''}`;
    }
    if (kw(q, 'retainage', 'retained')) {
      return `Total retainage held: $${(totalRetainage / 1000).toFixed(0)}K across ${rev.length} projects.`;
    }
    if (kw(q, 'collected', 'received', 'paid')) {
      const totalCollected = rev.reduce((sum, r) => sum + r.collectedRaw, 0);
      const totalInvoiced = rev.reduce((sum, r) => sum + r.invoicedRaw, 0);
      return `Collected $${(totalCollected / 1000).toFixed(0)}K of $${(totalInvoiced / 1000).toFixed(0)}K invoiced (${Math.round(totalCollected / totalInvoiced * 100)}% collection rate).`;
    }
    return `Revenue tracked across ${rev.length} projects. $${(totalOutstanding / 1000).toFixed(0)}K outstanding, $${(totalRetainage / 1000).toFixed(0)}K in retainage.`;
  },
};

const recordsDailyReports: WidgetAgent = {
  id: 'recordsDailyReports',
  name: 'Daily Reports (Records)',
  systemPrompt: 'You are a field operations analyst. You have access to all daily reports for this project and can analyze crew activity, weather impacts, work performed, and safety incidents.',
  suggestions: (st) => getSuggestions(dailyReportsAgent, st),
  insight: (st) => dailyReportsAgent.insight?.(st) ?? null,
  alerts: (st) => dailyReportsAgent.alerts?.(st) ?? null,
  actions: (st) => dailyReportsAgent.actions?.(st) ?? [],
  buildContext(s) { return dailyReportsAgent.buildContext(s); },
  localRespond(q, s) { return dailyReportsAgent.localRespond(q, s); },
};

const recordsPunchItems: WidgetAgent = {
  id: 'recordsPunchItems',
  name: 'Punch Items (Records)',
  systemPrompt: 'You are a punch list management specialist. You have access to all punch list items for this project and can analyze open items, priorities, and resolution progress.',
  suggestions(s) {
    const open = (s.punchListItems ?? []).filter(p => p.status === 'open' || p.status === 'in-progress').length;
    return open
      ? ['How many punch items are open?', 'Show high priority items', 'Which areas have the most punch items?', 'What is the resolution rate?']
      : ['What is the resolution rate?', 'How many punch items are open?', 'Show high priority items', 'Which areas have the most punch items?'];
  },
  insight(s) {
    const open = (s.punchListItems ?? []).filter(p => p.status === 'open' || p.status === 'in-progress');
    const high = open.filter(p => p.priority === 'high').length;
    if (!open.length) return null;
    return high ? `${open.length} open, ${high} high priority` : `${open.length} open punch item${open.length === 1 ? '' : 's'}`;
  },
  alerts(s) {
    const high = (s.punchListItems ?? []).filter(p => (p.status === 'open' || p.status === 'in-progress') && p.priority === 'high').length;
    return high ? { level: 'warning', count: high, label: 'high priority open' } : null;
  },
  actions: () => [
    { id: 'assign-blitz', label: 'Assign punch blitz', execute: () => 'Assigned punch closure blitz.' },
    { id: 'export-punch', label: 'Export punch list', execute: () => 'Exported punch list to PDF.' },
  ],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const recordsInspections: WidgetAgent = {
  id: 'recordsInspections',
  name: 'Inspections (Records)',
  systemPrompt: 'You are a quality control specialist. You have access to all inspections for this project and can analyze pass/fail rates, inspector activity, and compliance trends.',
  suggestions: (st) => getSuggestions(inspectionsAgent, st),
  insight: (st) => inspectionsAgent.insight?.(st) ?? null,
  alerts: (st) => inspectionsAgent.alerts?.(st) ?? null,
  actions: (st) => inspectionsAgent.actions?.(st) ?? [],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const recordsActionItems: WidgetAgent = {
  id: 'recordsActionItems',
  name: 'Action Items (Records)',
  systemPrompt: 'You are a project coordination specialist. You track action items, alerts, and attention items that need resolution across the project.',
  suggestions(s) {
    const critical = (s.projectAttentionItems ?? []).filter(i => i.severity === 'critical').length;
    return critical
      ? ['Show critical action items', 'What items need immediate attention?', 'Any overdue action items?']
      : ['What items need immediate attention?', 'Show critical action items', 'Any overdue action items?'];
  },
  insight(s) {
    const items = s.projectAttentionItems ?? [];
    const critical = items.filter(i => i.severity === 'critical').length;
    if (!items.length) return null;
    return critical ? `${critical} critical action item${critical === 1 ? '' : 's'}` : `${items.length} open action item${items.length === 1 ? '' : 's'}`;
  },
  alerts(s) {
    const critical = (s.projectAttentionItems ?? []).filter(i => i.severity === 'critical').length;
    return critical ? { level: 'critical', count: critical, label: 'critical' } : null;
  },
  actions: () => [
    { id: 'close-loop', label: 'Mark items in review', execute: (st) => {
      const n = (st.projectAttentionItems ?? []).length;
      return n ? `Moved ${n} item(s) to in-review.` : 'No action items.';
    }},
    { id: 'standup-agenda', label: 'Add to standup agenda', execute: () => 'Added action items to standup agenda.' },
  ],
  buildContext(s) {
    const items = s.projectAttentionItems ?? [];
    if (!items.length) return 'No attention items for this project.';
    return `Action items (${items.length}):\n${items.map(a => `  [${a.severity}] ${a.title}: ${a.subtitle}`).join('\n')}`;
  },
  localRespond(q, s) {
    const items = s.projectAttentionItems ?? [];
    if (!items.length) return 'No action items for this project.';
    if (kw(q, 'critical', 'high', 'urgent')) {
      const critical = items.filter(i => i.severity === 'critical');
      return critical.length ? critical.map(i => `[${i.severity}] ${i.title}: ${i.subtitle}`).join('\n') : 'No critical/high priority action items.';
    }
    return `${items.length} action items: ${items.map(a => `[${a.severity}] ${a.title}`).join(', ')}`;
  },
};

const financialsChangeOrders: WidgetAgent = {
  id: 'financialsChangeOrders',
  name: 'Change Orders (Financials)',
  systemPrompt: 'You are a change order management specialist. You have access to all change order requests for this project and can analyze pending approvals, financial impacts, and trends.',
  suggestions: (st) => getSuggestions(changeOrdersAgent, st),
  insight: (st) => changeOrdersAgent.insight?.(st) ?? null,
  alerts: () => null,
  actions: (st) => changeOrdersAgent.actions?.(st) ?? [],
  buildContext(s) { return changeOrdersAgent.buildContext(s); },
  localRespond(q, s) { return changeOrdersAgent.localRespond(q, s); },
};

const contractsAgent: WidgetAgent = {
  id: 'financialsContracts',
  name: 'Contracts',
  systemPrompt: 'You are a contract management specialist for construction projects. You track prime contracts, subcontracts, and purchase orders -- their values, change order impacts, retainage, and vendor relationships.',
  suggestions(s) {
    const ctrs = s.contracts ?? [];
    const subs = ctrs.filter(c => c.contractType === 'subcontract');
    const pending = ctrs.filter(c => c.status === 'pending').length;
    const totalRevised = ctrs.reduce((sum, c) => sum + c.revisedValue, 0);
    return pending
      ? [`How many contracts are pending? (${pending})`, `What is the total contract value? ($${(totalRevised / 1000).toFixed(0)}K)`, `How many subcontracts are active? (${subs.filter(c => c.status === 'active').length})`, 'Which contracts have linked change orders?']
      : [`What is the total contract value?`, `Show all subcontracts (${subs.length})`, 'Which contracts have the most change order exposure?', 'Compare original vs revised values'];
  },
  insight(s) {
    const ctrs = s.contracts ?? [];
    if (!ctrs.length) return null;
    const totalOriginal = ctrs.reduce((sum, c) => sum + c.originalValue, 0);
    const totalRevised = ctrs.reduce((sum, c) => sum + c.revisedValue, 0);
    const delta = totalRevised - totalOriginal;
    if (delta <= 0) return null;
    return `Contract growth: +$${(delta / 1000).toFixed(0)}K from ${ctrs.reduce((n, c) => n + c.linkedChangeOrderIds.length, 0)} linked COs`;
  },
  alerts(s) {
    const ctrs = s.contracts ?? [];
    const coLinked = ctrs.filter(c => c.linkedChangeOrderIds.length > 0);
    const pendingCos = coLinked.reduce((n, c) => {
      const cos = (s.changeOrders ?? []).filter(co => c.linkedChangeOrderIds.includes(co.id) && co.status === 'pending');
      return n + cos.length;
    }, 0);
    return pendingCos ? { level: 'warning', count: pendingCos, label: 'pending COs on contracts' } : null;
  },
  actions: () => [
    { id: 'export-contracts', label: 'Export contract register', execute: () => 'Exported contract register to spreadsheet.' },
    { id: 'retainage-report', label: 'Generate retainage report', execute: (st) => {
      const ctrs = st.contracts ?? [];
      const totalRetainage = ctrs.reduce((sum, c) => sum + (c.revisedValue * c.retainage / 100), 0);
      return `Retainage report: $${(totalRetainage / 1000).toFixed(0)}K held across ${ctrs.length} contracts.`;
    }},
  ],
  buildContext(s) {
    const ctrs = s.contracts ?? [];
    if (!ctrs.length) return 'No contracts.';
    const cos = s.changeOrders ?? [];
    const section = (label: string, list: typeof ctrs) => {
      if (!list.length) return '';
      const lines = list.map(c => {
        const linked = c.linkedChangeOrderIds.length ? ` | Linked COs: ${c.linkedChangeOrderIds.join(', ')}` : '';
        const pendingCos = cos.filter(co => c.linkedChangeOrderIds.includes(co.id) && co.status === 'pending');
        const pendingStr = pendingCos.length ? ` (${pendingCos.length} pending: $${pendingCos.reduce((n, co) => n + co.amount, 0).toLocaleString()})` : '';
        return `  ${c.id}: ${c.title}\n    Vendor: ${c.vendor} | Original: $${c.originalValue.toLocaleString()} | Revised: $${c.revisedValue.toLocaleString()} | Status: ${c.status} | Retainage: ${c.retainage}%${linked}${pendingStr}`;
      });
      return `\n${label} (${list.length}):\n${lines.join('\n')}`;
    };
    return `Contracts (${ctrs.length} total):${section('Prime Contracts', ctrs.filter(c => c.contractType === 'prime'))}${section('Subcontracts', ctrs.filter(c => c.contractType === 'subcontract'))}${section('Purchase Orders', ctrs.filter(c => c.contractType === 'purchase-order'))}`;
  },
  localRespond(q, s) {
    const ctrs = s.contracts ?? [];
    const cos = s.changeOrders ?? [];
    if (kw(q, 'prime')) {
      const prime = ctrs.filter(c => c.contractType === 'prime');
      const total = prime.reduce((sum, c) => sum + c.revisedValue, 0);
      return `${prime.length} prime contract(s) totaling $${total.toLocaleString()}: ${prime.map(c => `${c.id} ($${c.revisedValue.toLocaleString()})`).join(', ')}`;
    }
    if (kw(q, 'subcontract', 'sub ')) {
      const subs = ctrs.filter(c => c.contractType === 'subcontract');
      const total = subs.reduce((sum, c) => sum + c.revisedValue, 0);
      return `${subs.length} subcontract(s) totaling $${total.toLocaleString()}: ${subs.map(c => `${c.id} - ${c.vendor} ($${c.revisedValue.toLocaleString()})`).join(', ')}`;
    }
    if (kw(q, 'total', 'value', 'how much', 'worth')) {
      const totalOriginal = ctrs.reduce((sum, c) => sum + c.originalValue, 0);
      const totalRevised = ctrs.reduce((sum, c) => sum + c.revisedValue, 0);
      return `Total original contract value: $${totalOriginal.toLocaleString()}. Total revised value: $${totalRevised.toLocaleString()} (+$${(totalRevised - totalOriginal).toLocaleString()} from change orders).`;
    }
    if (kw(q, 'change order', 'co ', 'linked', 'exposure')) {
      const withCos = ctrs.filter(c => c.linkedChangeOrderIds.length > 0);
      const lines = withCos.map(c => {
        const linkedCos = cos.filter(co => c.linkedChangeOrderIds.includes(co.id));
        const amount = linkedCos.reduce((sum, co) => sum + co.amount, 0);
        return `${c.id}: ${linkedCos.length} CO(s) = $${amount.toLocaleString()}`;
      });
      return `${withCos.length} contracts with linked COs:\n${lines.join('\n')}`;
    }
    if (kw(q, 'retainage')) {
      const totalRetainage = ctrs.reduce((sum, c) => sum + (c.revisedValue * c.retainage / 100), 0);
      return `Total retainage held: $${totalRetainage.toLocaleString()} across ${ctrs.length} contracts.`;
    }
    if (kw(q, 'pending', 'draft')) {
      const pending = ctrs.filter(c => c.status === 'pending' || c.status === 'draft');
      return pending.length ? `${pending.length} pending/draft contract(s): ${pending.map(c => `${c.id} - ${c.vendor}`).join(', ')}` : 'All contracts are active or closed.';
    }
    if (kw(q, 'vendor', 'who')) {
      const vendors = [...new Set(ctrs.map(c => c.vendor))];
      return `${vendors.length} unique vendor(s): ${vendors.join(', ')}`;
    }
    const totalOriginal = ctrs.reduce((sum, c) => sum + c.originalValue, 0);
    const totalRevised = ctrs.reduce((sum, c) => sum + c.revisedValue, 0);
    return `${ctrs.length} contracts: ${ctrs.filter(c => c.contractType === 'prime').length} prime, ${ctrs.filter(c => c.contractType === 'subcontract').length} subcontracts. Original: $${totalOriginal.toLocaleString()}, revised: $${totalRevised.toLocaleString()}.`;
  },
};

const financialsContracts: WidgetAgent = {
  id: 'financialsContracts',
  name: 'Contracts (Financials)',
  systemPrompt: 'You are a contract management specialist. You have access to all contracts for this project and can analyze values, change order impacts, retainage, and vendor relationships.',
  suggestions: (st) => getSuggestions(contractsAgent, st),
  insight: (st) => contractsAgent.insight?.(st) ?? null,
  alerts: (st) => contractsAgent.alerts?.(st) ?? null,
  actions: (st) => contractsAgent.actions?.(st) ?? [],
  buildContext(s) { return contractsAgent.buildContext(s); },
  localRespond(q, s) { return contractsAgent.localRespond(q, s); },
};

const financialsRevenue: WidgetAgent = {
  id: 'financialsRevenue',
  name: 'Revenue (Financials)',
  systemPrompt: 'You are a revenue and accounts receivable specialist. You have access to all revenue data, invoicing status, collections, and outstanding balances for this project.',
  suggestions: (st) => getSuggestions(revenueAgent, st),
  insight: (st) => revenueAgent.insight?.(st) ?? null,
  alerts: (st) => revenueAgent.alerts?.(st) ?? null,
  actions: (st) => revenueAgent.actions?.(st) ?? [],
  buildContext(s) { return revenueAgent.buildContext(s); },
  localRespond(q, s) { return revenueAgent.localRespond(q, s); },
};

const financialsCostForecasts: WidgetAgent = {
  id: 'financialsCostForecasts',
  name: 'Cost Forecasts (Financials)',
  systemPrompt: 'You are a cost forecasting specialist. You have access to budget history, planned vs actual spending, and forecast data for this project.',
  suggestions(s) {
    const history = s.budgetHistory ?? [];
    const over = history.filter(h => h.actual != null && h.actual > h.planned).length;
    return over
      ? ['Any months significantly over budget?', 'How is actual spending vs plan?', 'What is the forecast at completion?', 'Show monthly budget trends']
      : ['How is actual spending vs plan?', 'What is the forecast at completion?', 'Show monthly budget trends', 'Any months significantly over budget?'];
  },
  insight(s) {
    const history = s.budgetHistory ?? [];
    const over = history.filter(h => h.actual != null && h.actual > h.planned);
    if (!over.length) return null;
    return `${over.length} month${over.length === 1 ? '' : 's'} ran over planned spend`;
  },
  alerts(s) {
    const over = (s.budgetHistory ?? []).filter(h => h.actual != null && h.actual > h.planned).length;
    return over >= 2 ? { level: 'warning', count: over, label: 'over-plan months' } : null;
  },
  actions: () => [
    { id: 'refresh-forecast', label: 'Refresh forecast model', execute: () => 'Recalculated forecast at completion.' },
    { id: 'owner-variance', label: 'Send variance pack to owner', execute: () => 'Sent monthly variance pack.' },
  ],
  buildContext(s) {
    const history = s.budgetHistory ?? [];
    if (!history.length) return 'No budget history data available.';
    const totalPlanned = history.reduce((sum, h) => sum + h.planned, 0);
    const totalActual = history.filter(h => h.actual != null).reduce((sum, h) => sum + (h.actual ?? 0), 0);
    const totalForecast = history.reduce((sum, h) => sum + h.forecast, 0);
    return `Cost forecast (${history.length} months tracked):\n  Total planned: $${(totalPlanned / 1000).toFixed(0)}K\n  Total actual: $${(totalActual / 1000).toFixed(0)}K\n  Total forecast: $${(totalForecast / 1000).toFixed(0)}K\n  Variance: $${((totalActual - totalPlanned) / 1000).toFixed(0)}K\n\nMonthly:\n${history.map(h => `  ${h.month}: planned $${(h.planned / 1000).toFixed(0)}K, actual ${h.actual != null ? '$' + (h.actual / 1000).toFixed(0) + 'K' : 'TBD'}, forecast $${(h.forecast / 1000).toFixed(0)}K`).join('\n')}`;
  },
  localRespond(q, s) {
    const history = s.budgetHistory ?? [];
    if (!history.length) return 'No budget history data available for cost forecasting.';
    const totalPlanned = history.reduce((sum, h) => sum + h.planned, 0);
    const totalActual = history.filter(h => h.actual != null).reduce((sum, h) => sum + (h.actual ?? 0), 0);
    const totalForecast = history.reduce((sum, h) => sum + h.forecast, 0);
    if (kw(q, 'variance', 'over', 'under')) {
      const overMonths = history.filter(h => h.actual != null && h.actual > h.planned);
      return overMonths.length ? `Over-budget months: ${overMonths.map(h => `${h.month} ($${((h.actual! - h.planned) / 1000).toFixed(0)}K over)`).join(', ')}` : 'All months are within planned budget.';
    }
    return `Cost forecast: $${(totalActual / 1000).toFixed(0)}K spent of $${(totalPlanned / 1000).toFixed(0)}K planned. Forecast at completion: $${(totalForecast / 1000).toFixed(0)}K. ${history.length} months tracked.`;
  },
};

const financialsJobCostDetail: WidgetAgent = {
  id: 'financialsJobCostDetail',
  name: 'Job Cost Detail',
  systemPrompt: 'You are a cost control analyst for a specific construction project. You have full visibility into this project\'s budget, cost categories (Labor, Materials, Equipment, Subcontractors, Overhead), spending patterns, and how they compare to the portfolio. You can help identify cost overruns, recommend cost-saving measures, and compare this project\'s spend profile to others.',
  suggestions(s) {
    const p = s.jobCostDetailProject;
    if (!p) return ['Which cost category is the largest?', 'How does this budget compare to the portfolio?', 'Are there any cost overruns?'];
    const cats = JOB_COST_CATEGORIES;
    const totalSpend = cats.reduce((sum, cat) => sum + p.costs[cat], 0);
    const topCat = cats.reduce((a, b) => p.costs[a] > p.costs[b] ? a : b);
    const topPct = totalSpend > 0 ? Math.round((p.costs[topCat] / totalSpend) * 100) : 0;
    return [
      `Why is ${topCat} at ${topPct}% of spend?`,
      `Is ${p.projectName} over budget?`,
      'Compare cost categories to portfolio averages',
      `What are the biggest cost drivers for ${p.projectName}?`,
    ];
  },
  insight(s) {
    const p = s.jobCostDetailProject;
    if (!p) return null;
    if (p.budgetPct >= 90) return `Budget critically high at ${p.budgetPct}% -- immediate review recommended`;
    if (p.budgetPct >= 75) return `Budget utilization at ${p.budgetPct}% -- approaching threshold`;
    return null;
  },
  alerts(s) {
    const p = s.jobCostDetailProject;
    if (!p) return null;
    if (p.budgetPct >= 90) return { level: 'critical', count: 1, label: 'budget critical' };
    if (p.budgetPct >= 75) return { level: 'warning', count: 1, label: 'budget high' };
    return null;
  },
  actions(s) {
    const allCosts = getProjectJobCosts();
    const currentId = s.jobCostDetailProject?.projectId;
    const others = allCosts.filter(p => p.projectId !== currentId).slice(0, 4);
    const navActions: AgentAction[] = others.map(p => {
      const proj = PROJECTS.find(pr => pr.id === p.projectId);
      return {
        id: `nav-jc-${p.projectId}`,
        label: `Open ${p.projectName} job costs`,
        execute: () => `Opening job costs for ${p.projectName}.`,
        route: `/financials/job-costs/${proj?.slug ?? p.projectId}`,
      };
    });
    return [
      { id: 'back-financials', label: 'Back to Financials overview', execute: () => 'Returning to Financials.', route: '/financials' },
      ...navActions,
      { id: 'export-costs', label: 'Export cost breakdown', execute: () => 'Exported cost breakdown to CSV.' },
    ];
  },
  buildContext(s) {
    const p = s.jobCostDetailProject;
    if (!p) return 'No project selected for job cost detail.';
    const cats = JOB_COST_CATEGORIES;
    const totalSpend = cats.reduce((sum, cat) => sum + p.costs[cat], 0);
    const lines = cats.map(cat => {
      const pctSpend = totalSpend > 0 ? Math.round((p.costs[cat] / totalSpend) * 100) : 0;
      return `  ${cat}: $${Math.round(p.costs[cat] / 1000)}K (${pctSpend}% of spend)`;
    });
    return `Job Cost Detail -- ${p.projectName} (${p.client})\n  Budget: ${p.budgetUsed} of ${p.budgetTotal} (${p.budgetPct}%)\n  Total spend: $${Math.round(totalSpend / 1000)}K\n\nCost breakdown:\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const p = s.jobCostDetailProject;
    if (!p) return 'No project is currently selected. Navigate to a project job cost page first.';
    const cats = JOB_COST_CATEGORIES;
    const totalSpend = cats.reduce((sum, cat) => sum + p.costs[cat], 0);
    if (kw(q, 'budget', 'over', 'under', 'remaining')) {
      const budgetTotal = parseFloat(p.budgetTotal.replace(/[^0-9.]/g, '')) * (p.budgetTotal.includes('M') ? 1_000_000 : p.budgetTotal.includes('K') ? 1_000 : 1);
      const remaining = budgetTotal - totalSpend;
      return `${p.projectName}: ${p.budgetUsed} spent of ${p.budgetTotal} (${p.budgetPct}%). Remaining: $${Math.round(remaining / 1000)}K (${100 - p.budgetPct}%). ${p.budgetPct >= 90 ? 'Critical -- immediate review needed.' : p.budgetPct >= 75 ? 'Approaching budget threshold.' : 'Within healthy range.'}`;
    }
    if (kw(q, 'compare', 'portfolio', 'average', 'other project')) {
      const allCosts = getProjectJobCosts();
      const portfolioTotal = allCosts.reduce((sum, pr) => sum + cats.reduce((s2, cat) => s2 + pr.costs[cat], 0), 0);
      const avgBudgetPct = Math.round(allCosts.reduce((s2, pr) => s2 + pr.budgetPct, 0) / allCosts.length);
      return `${p.projectName} budget utilization: ${p.budgetPct}% vs portfolio average: ${avgBudgetPct}%. Portfolio total spend: $${Math.round(portfolioTotal / 1000)}K across ${allCosts.length} projects.`;
    }
    if (kw(q, 'labor', 'material', 'equipment', 'subcontract', 'overhead', 'category', 'breakdown', 'driver', 'largest', 'biggest')) {
      const sorted = [...cats].sort((a, b) => p.costs[b] - p.costs[a]);
      const details = sorted.map(cat => {
        const pctSpend = totalSpend > 0 ? Math.round((p.costs[cat] / totalSpend) * 100) : 0;
        return `${cat}: $${Math.round(p.costs[cat] / 1000)}K (${pctSpend}%)`;
      });
      return `Cost breakdown for ${p.projectName}:\n${details.join('\n')}\nTotal: $${Math.round(totalSpend / 1000)}K`;
    }
    return `${p.projectName} job costs: ${p.budgetUsed} of ${p.budgetTotal} (${p.budgetPct}%). Total spend: $${Math.round(totalSpend / 1000)}K across ${cats.length} categories. Ask about specific categories, budget status, or portfolio comparisons.`;
  },
};

const dailyReportDetail: WidgetAgent = {
  id: 'dailyReportDetail',
  name: 'Daily Report Detail',
  systemPrompt: 'You are a field operations specialist reviewing a specific daily report. Help analyze crew activity, work performed, weather conditions, and safety details for this report.',
  suggestions: ['Summarize this daily report', 'Were there any safety concerns?', 'How does crew count compare to typical?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'attach-photo', label: 'Attach site photo log', execute: () => 'Linked photo log to this daily report.' },
    { id: 'correct-crew', label: 'Submit crew count correction', execute: () => 'Submitted crew count correction for review.' },
    { id: 'escalate-safety', label: 'Escalate safety note', execute: () => 'Escalated safety note to safety manager.' },
  ],
  buildContext(s) { return dailyReportsAgent.buildContext(s); },
  localRespond(q, s) { return dailyReportsAgent.localRespond(q, s); },
};

const inspectionDetail: WidgetAgent = {
  id: 'inspectionDetail',
  name: 'Inspection Detail',
  systemPrompt: 'You are a quality assurance specialist reviewing a specific inspection. Help analyze the inspection results, notes, and any required follow-up actions.',
  suggestions: ['What was the inspection result?', 'Is follow-up needed?', 'What were the inspector notes?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'schedule-reinspect', label: 'Schedule re-inspection', execute: () => 'Scheduled follow-up inspection.' },
    { id: 'upload-evidence', label: 'Upload corrective evidence', execute: () => 'Uploaded corrective action photos.' },
    { id: 'notify-subs', label: 'Notify responsible sub', execute: () => 'Notified responsible subcontractor.' },
  ],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const punchItemDetail: WidgetAgent = {
  id: 'punchItemDetail',
  name: 'Punch Item Detail',
  systemPrompt: 'You are a punch list resolution specialist reviewing a specific punch item. Help analyze the item details, priority, assignment, and resolution steps.',
  suggestions: ['What is the status of this item?', 'Who is assigned?', 'What is the priority level?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'mark-complete', label: 'Mark punch item complete', execute: () => 'Marked punch item complete (demo).' },
    { id: 'reassign-trade', label: 'Reassign trade', execute: () => 'Reassigned punch item to alternate trade.' },
    { id: 'verify-field', label: 'Request field verification', execute: () => 'Requested superintendent field verification.' },
  ],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const changeOrderDetail: WidgetAgent = {
  id: 'changeOrderDetail',
  name: 'Change Order Detail',
  systemPrompt: 'You are a change order review specialist examining a specific change order. Help analyze the request details, financial impact, approval status, and justification.',
  suggestions: ['What is the financial impact?', 'What is the approval status?', 'Why was this change requested?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'approve-co', label: 'Record CO approval', execute: () => 'Recorded change order approval (demo).' },
    { id: 'reject-co', label: 'Send back for pricing', execute: () => 'Sent change order back for revised pricing.' },
    { id: 'link-budget', label: 'Link to budget line', execute: () => 'Linked change order to budget line item.' },
  ],
  buildContext(s) { return changeOrdersAgent.buildContext(s); },
  localRespond(q, s) { return changeOrdersAgent.localRespond(q, s); },
};

const contractDetail: WidgetAgent = {
  id: 'contractDetail',
  name: 'Contract Detail',
  systemPrompt: 'You are a contract review specialist examining a specific contract. Help analyze vendor relationships, change order impacts, retainage, and scope.',
  suggestions: ['What change orders are linked?', 'What is the retainage amount?', 'How has the value changed from original?', 'Who is the vendor?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'amend-contract', label: 'Draft contract amendment', execute: () => 'Drafted contract amendment (demo).' },
    { id: 'release-retainage', label: 'Process retainage release', execute: () => 'Submitted retainage release request.' },
    { id: 'link-co', label: 'Link change order to contract', execute: () => 'Linked change order to contract.' },
  ],
  buildContext(s) { return contractsAgent.buildContext(s); },
  localRespond(q, s) { return contractsAgent.localRespond(q, s); },
};

const portfolioAgent: WidgetAgent = {
  id: 'portfolio',
  name: 'Portfolio Analysis',
  systemPrompt: 'You are a cross-project portfolio analyst for construction delivery. Compare health, schedule, budget, RFIs, submittals, change orders, inspections, revenue, and field activity across all projects. Prioritize leadership focus and explain tradeoffs.',
  suggestions: ['Which project has the highest risk?', 'Compare budgets across projects', 'Where are the most overdue RFIs?', 'Summarize portfolio change order exposure'],
  insight(s) {
    const projects = s.projects ?? [];
    const atRisk = projects.filter(p => p.status === 'At Risk').length;
    const overdueRfi = (s.rfis ?? []).filter(r => r.status === 'overdue').length;
    if (atRisk && overdueRfi) return `${atRisk} at-risk project(s), ${overdueRfi} overdue RFIs portfolio-wide`;
    if (atRisk) return `${atRisk} project(s) marked at risk`;
    if (overdueRfi) return `${overdueRfi} overdue RFIs across projects`;
    return null;
  },
  alerts: () => null,
  actions: () => [
    { id: 'exec-brief', label: 'Generate executive brief', execute: () => 'Generated one-page executive portfolio brief.' },
    { id: 'align-ppm', label: 'Schedule cross-project review', execute: () => 'Scheduled PM alignment session.' },
    { id: 'export-scorecard', label: 'Export portfolio scorecard', execute: () => 'Exported portfolio scorecard XLSX.' },
  ],
  buildContext(s) {
    const parts: string[] = ['Portfolio meta-analysis context'];
    const projects = s.projects ?? [];
    parts.push(`${projects.length} projects:\n${fmtProjects(projects)}`);
    const rfis = s.rfis ?? [];
    const subs = s.submittals ?? [];
    parts.push(`RFIs: ${rfis.length} total (${rfis.filter(r => r.status === 'overdue').length} overdue)`);
    parts.push(`Submittals: ${subs.length} total (${subs.filter(x => x.status === 'overdue').length} overdue)`);
    parts.push(`Open estimates: ${(s.estimates ?? []).length}`);
    parts.push(`Attention items: ${(s.attentionItems ?? []).length}`);
    const cos = s.changeOrders ?? [];
    parts.push(`Change orders: ${cos.length}, ${cos.filter(c => c.status === 'pending').length} pending`);
    const insp = s.inspections ?? [];
    parts.push(`Inspections: ${insp.length} (${insp.filter(i => i.result === 'fail').length} failed)`);
    const rev = s.projectRevenue ?? [];
    if (rev.length) {
      const out = rev.reduce((sum, r) => sum + r.outstandingRaw, 0);
      parts.push(`Revenue: $${(out / 1000).toFixed(0)}K total outstanding AR`);
    }
    const impactDays = (s.weatherForecast ?? []).filter(f => f.workImpact !== 'none');
    if (impactDays.length) parts.push(`Weather: ${impactDays.length} day(s) with work impact`);
    parts.push(`Recent activity entries: ${(s.activities ?? []).length}`);
    return parts.join('\n');
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    if (kw(q, 'highest risk', 'most risk', 'riskiest', 'which project')) {
      const scored = projects.map(p => ({
        p,
        score: (p.status === 'Overdue' ? 3 : 0) + (p.status === 'At Risk' ? 2 : 0) + (p.budgetPct > 90 ? 2 : p.budgetPct > 80 ? 1 : 0),
      })).sort((a, b) => b.score - a.score);
      const top = scored[0];
      return top && top.score > 0
        ? `Highest composite risk: ${top.p.name} (${top.p.status}, ${top.p.budgetPct}% budget). Compare with ${scored[1]?.p.name ?? 'others'} for context.`
        : 'No project exceeds baseline risk thresholds in this snapshot.';
    }
    if (kw(q, 'compare budget', 'budgets', 'budget comparison')) {
      const sorted = [...projects].sort((a, b) => b.budgetPct - a.budgetPct);
      const top3 = sorted.slice(0, 3).map(p => `${p.name} ${p.budgetPct}%`).join('; ');
      return sorted.length ? `Top budget utilization: ${top3}.` : 'No project budget data.';
    }
    if (kw(q, 'rfi', 'rfis')) {
      const byProj: Record<string, number> = {};
      for (const r of s.rfis ?? []) {
        byProj[r.project] = (byProj[r.project] ?? 0) + (r.status === 'overdue' ? 1 : 0);
      }
      const worst = Object.entries(byProj).sort((a, b) => b[1] - a[1])[0];
      return worst?.[1] ? `Most overdue RFIs: ${worst[0]} (${worst[1]}).` : 'No overdue RFIs in portfolio data.';
    }
    if (kw(q, 'change order', 'co ')) {
      const pending = (s.changeOrders ?? []).filter(c => c.status === 'pending');
      const byProj: Record<string, number> = {};
      for (const c of pending) byProj[c.project] = (byProj[c.project] ?? 0) + c.amount;
      const top = Object.entries(byProj).sort((a, b) => b[1] - a[1])[0];
      return top ? `Largest pending CO exposure: ${top[0]} (~$${top[1].toLocaleString()}).` : 'No pending change orders.';
    }
    if (kw(q, 'overview', 'summary', 'portfolio')) {
      return homeDefault.localRespond(q, s);
    }
    return `Portfolio: ${projects.length} projects, ${(s.rfis ?? []).length} RFIs, ${(s.submittals ?? []).length} submittals. Ask which project is riskiest, compare budgets, or about change order exposure.`;
  },
};

const urgentNeedsAgent: WidgetAgent = {
  id: 'homeUrgentNeeds',
  name: 'Urgent Needs',
  systemPrompt: 'You are a portfolio risk analyst monitoring urgent needs, overdue items, and critical alerts across all active construction projects. You prioritize by severity and business impact. You have full visibility into project budgets, job costs, change orders, and can link directly to financial detail pages for budget-related issues.',
  suggestions: () => [
    'What are the most critical items right now?',
    'Which project has the most urgent needs?',
    'Show me all overdue RFIs across projects',
    'What budget alerts are active?',
    'Which projects are over budget?',
    'Show me all pending change orders',
    'Summarize schedule risks',
  ],
  insight: () => {
    const items = buildUrgentNeeds();
    const critical = items.filter(i => i.severity === 'critical').length;
    const budgetCritical = items.filter(i => i.severity === 'critical' && i.category === 'budget').length;
    if (budgetCritical > 0 && critical >= 5) return `${critical} critical items including ${budgetCritical} budget alert(s) need attention`;
    if (critical >= 5) return `${critical} critical items across the portfolio need attention`;
    if (budgetCritical > 0) return `${budgetCritical} budget alert(s) flagged -- review job costs`;
    if (critical > 0) return `${critical} critical item(s) flagged`;
    return null;
  },
  alerts: () => {
    const items = buildUrgentNeeds();
    const critical = items.filter(i => i.severity === 'critical').length;
    if (critical >= 5) return { level: 'critical' as const, count: critical, label: `${critical} critical` };
    if (critical > 0) return { level: 'warning' as const, count: critical, label: `${critical} critical` };
    return null;
  },
  actions: () => {
    const items = buildUrgentNeeds();
    const budgetItems = items.filter(i => (i.category === 'budget' || i.category === 'change-order') && i.financialsRoute);
    const projectsWithBudgetIssues = [...new Map(budgetItems.map(i => [i.projectId, i])).values()].slice(0, 3);
    const finActions: AgentAction[] = projectsWithBudgetIssues.map(i => ({
      id: `open-jc-${i.projectId}`,
      label: `Open ${i.projectName} job costs`,
      execute: () => `Opening job costs for ${i.projectName}.`,
      route: i.financialsRoute!,
    }));
    return [
      { id: 'escalate-critical', label: 'Escalate all critical items', execute: () => { const n = items.filter(i => i.severity === 'critical').length; return n ? `Escalated ${n} critical item(s) to leadership.` : 'No critical items.'; } },
      { id: 'export-needs', label: 'Export urgent needs report', execute: () => 'Exported urgent needs report.' },
      { id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' },
      { id: 'open-financials', label: 'Open Financials overview', execute: () => 'Opening Financials.', route: '/financials' },
      ...finActions,
    ];
  },
  buildContext() {
    const items = buildUrgentNeeds();
    const critical = items.filter(i => i.severity === 'critical');
    const warnings = items.filter(i => i.severity === 'warning');
    const info = items.filter(i => i.severity === 'info');
    const budgetItems = items.filter(i => i.category === 'budget' || i.category === 'change-order');
    const lines = items.map(i => `  [${i.severity.toUpperCase()}] ${i.projectName}: ${i.title} -- ${i.subtitle} (${i.category})${i.financialsRoute ? ' [financials: ' + i.financialsRoute + ']' : ''}`);
    return `Urgent needs across portfolio: ${critical.length} critical, ${warnings.length} warnings, ${info.length} info. ${budgetItems.length} financial items (budget/change-order) with direct job cost links.\n${lines.join('\n')}`;
  },
  localRespond(q) {
    const items = buildUrgentNeeds();
    const critical = items.filter(i => i.severity === 'critical');
    const warnings = items.filter(i => i.severity === 'warning');

    if (kw(q, 'critical', 'most urgent', 'highest priority')) {
      if (!critical.length) return 'No critical items right now.';
      return `${critical.length} critical items:\n${critical.map(i => `- **${i.projectName}**: ${i.title}${i.financialsRoute ? ' ([View Job Costs](' + i.financialsRoute + '))' : ''}`).join('\n')}`;
    }
    if (kw(q, 'which project', 'most needs', 'worst')) {
      const counts: Record<string, number> = {};
      for (const i of items) counts[i.projectName] = (counts[i.projectName] ?? 0) + 1;
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted.map(([name, count]) => `**${name}**: ${count} item(s)`).join('\n');
    }
    if (kw(q, 'rfi')) {
      const rfis = items.filter(i => i.category === 'rfi');
      return rfis.length ? rfis.map(i => `- ${i.title} (${i.projectName})`).join('\n') : 'No RFI-related urgent needs.';
    }
    if (kw(q, 'budget', 'over budget', 'cost', 'job cost', 'financial')) {
      const budget = items.filter(i => i.category === 'budget' || i.category === 'change-order');
      if (!budget.length) return 'No budget or change-order alerts.';
      const lines = budget.map(i => {
        const link = i.financialsRoute ? ` ([View Job Costs](${i.financialsRoute}))` : '';
        return `- **${i.projectName}**: ${i.title} -- ${i.subtitle}${link}`;
      });
      return `${budget.length} financial alert(s):\n${lines.join('\n')}`;
    }
    if (kw(q, 'change order', 'CO-')) {
      const cos = items.filter(i => i.category === 'change-order');
      if (!cos.length) return 'No pending change orders.';
      return `${cos.length} change order alert(s):\n${cos.map(i => `- **${i.projectName}**: ${i.title} -- ${i.subtitle}`).join('\n')}`;
    }
    if (kw(q, 'schedule')) {
      const sched = items.filter(i => i.category === 'schedule');
      return sched.length ? sched.map(i => `- **${i.projectName}**: ${i.title}`).join('\n') : 'No schedule risks flagged.';
    }
    return `Tracking ${items.length} urgent items: ${critical.length} critical, ${warnings.length} warnings. Includes ${items.filter(i => i.category === 'budget' || i.category === 'change-order').length} financial alert(s). Ask about budgets, change orders, RFIs, or specific projects.`;
  },
};

const homeWeatherAgent: WidgetAgent = {
  id: 'homeWeather',
  name: 'Weather Outlook',
  systemPrompt: 'You are a construction scheduling advisor monitoring weather conditions across all active project sites in Washington, Oregon, and Northern California. You help portfolio managers understand weather impacts on field operations and plan around adverse conditions.',
  suggestions: () => [
    'Which sites have weather delays this week?',
    'Where is it safe to pour concrete?',
    'Show me the 7-day outlook for all projects',
    'Which projects should shift to interior work?',
  ],
  insight() {
    const impacted = PROJECTS.map(p => ({ p, w: getProjectWeather(p.id) })).filter(({ w }) => w && w.forecast.some(f => f.workImpact !== 'none'));
    const major = impacted.filter(({ w }) => w!.forecast.some(f => f.workImpact === 'major'));
    if (major.length) return `${major.length} site${major.length !== 1 ? 's' : ''} facing work stoppages this week`;
    if (impacted.length) return `${impacted.length} site${impacted.length !== 1 ? 's' : ''} with weather advisories`;
    return null;
  },
  alerts() {
    const major = PROJECTS.filter(p => { const w = getProjectWeather(p.id); return w && w.forecast.some(f => f.workImpact === 'major'); });
    return major.length ? { level: 'warning' as const, count: major.length, label: 'sites with work stoppages' } : null;
  },
  actions: () => [
    { id: 'alert-all-subs', label: 'Alert all subcontractors', execute: () => 'Sent weather lookahead to all subcontractors across impacted sites.' },
    { id: 'export-weather', label: 'Export weather report', execute: () => 'Exported portfolio weather outlook PDF.' },
  ],
  buildContext() {
    const lines = PROJECTS.map(p => {
      const w = getProjectWeather(p.id);
      if (!w) return `  ${p.name} (${p.city}, ${p.state}): No weather data`;
      const impact = w.forecast.filter(f => f.workImpact !== 'none');
      const impactStr = impact.length ? `${impact.length} impact day(s): ${impact.map(f => `${f.day} ${f.date} ${f.workImpact}`).join(', ')}` : 'no impact';
      return `  ${p.name} (${p.city}, ${p.state}): ${w.current.tempF}F ${w.current.condition}, ${impactStr}`;
    });
    return `Portfolio weather outlook:\n${lines.join('\n')}`;
  },
  localRespond(q) {
    const allWeather = PROJECTS.map(p => ({ p, w: getProjectWeather(p.id)! })).filter(({ w }) => !!w);
    const impacted = allWeather.filter(({ w }) => w.forecast.some(f => f.workImpact !== 'none'));
    const major = allWeather.filter(({ w }) => w.forecast.some(f => f.workImpact === 'major'));

    if (kw(q, 'delay', 'stop', 'impact', 'suspend')) {
      if (!impacted.length) return 'No weather-related work impacts expected at any site this week.';
      return `${impacted.length} site(s) with weather impacts:\n${impacted.map(({ p, w }) => {
        const days = w.forecast.filter(f => f.workImpact !== 'none');
        return `- **${p.name}** (${p.city}): ${days.map(d => `${d.day} -- ${d.workImpact}${d.note ? ': ' + d.note : ''}`).join('; ')}`;
      }).join('\n')}`;
    }
    if (kw(q, 'concrete', 'pour', 'safe')) {
      const safe = allWeather.filter(({ w }) => !w.forecast.some(f => f.workImpact === 'major' || f.condition === 'rain' || f.condition === 'snow'));
      return safe.length ? `Safe for concrete work at: ${safe.map(({ p, w }) => `**${p.name}** (${p.city}, ${w.current.tempF}F)`).join(', ')}` : 'Conditions are risky at all sites. Check individual forecasts before scheduling pours.';
    }
    if (kw(q, 'outlook', '7-day', 'forecast', 'all')) {
      return allWeather.map(({ p, w }) => {
        const impact = w.forecast.filter(f => f.workImpact !== 'none').length;
        return `**${p.name}** (${p.city}): ${w.current.tempF}F ${w.current.condition}${impact ? ` -- ${impact} impact day(s)` : ' -- clear'}`;
      }).join('\n');
    }
    if (kw(q, 'interior', 'indoor', 'shift')) {
      if (!major.length) return 'No sites need to shift to interior-only work right now.';
      return `Sites that should shift to interior work:\n${major.map(({ p, w }) => {
        const days = w.forecast.filter(f => f.workImpact === 'major');
        return `- **${p.name}** (${p.city}): ${days.map(d => `${d.day} ${d.date}`).join(', ')}`;
      }).join('\n')}`;
    }
    const totalImpact = impacted.length;
    return `Monitoring weather across ${allWeather.length} project sites. ${totalImpact} with impacts, ${major.length} with work stoppages. Ask about delays, concrete conditions, or the full 7-day outlook.`;
  },
};

const ALL_AGENTS: Record<string, WidgetAgent> = {
  portfolio: portfolioAgent,
  homeTimeOff, homeCalendar, homeRfis, homeSubmittals, homeDefault, homeUrgentNeeds: urgentNeedsAgent, homeWeather: homeWeatherAgent, homeRecentActivity: recentActivity,
  projects: projectsWidget, openEstimates, recentActivity, needsAttention, projectsDefault,
  finBudgetByProject, financialsDefault, revenue: revenueAgent,
  milestones: milestonesAgent, tasks: tasksAgent, risks: risksAgent,
  drawing: drawingAgent, budget: budgetAgent, team: teamAgent, activity: activityAgent,
  projectDefault,
  recordsRfis, recordsSubmittals, financialsBudget, financialsSubledger,
  drawingsPage, drawingDetail, rfiDetail, submittalDetail,
  changeOrders: changeOrdersAgent, dailyReports: dailyReportsAgent,
  weather: weatherAgent, inspections: inspectionsAgent,
  recordsDailyReports, recordsPunchItems, recordsInspections, recordsActionItems,
  financialsChangeOrders, finChangeOrders: financialsChangeOrders, financialsRevenue, financialsCostForecasts, financialsJobCostDetail,
  financialsContracts, contracts: contractsAgent,
  dailyReportDetail, inspectionDetail, punchItemDetail, changeOrderDetail, contractDetail,
};

const PAGE_DEFAULT_AGENTS: Record<string, string> = {
  home: 'homeDefault',
  projects: 'projectsDefault',
  financials: 'financialsDefault',
  'financials-job-cost-detail': 'financialsJobCostDetail',
  'project-dashboard': 'projectDefault',
};

export function getAgent(widgetId: string | null, page: string, subContext?: string): WidgetAgent {
  if (subContext && ALL_AGENTS[subContext]) return ALL_AGENTS[subContext];
  if (widgetId && ALL_AGENTS[widgetId]) return ALL_AGENTS[widgetId];
  return ALL_AGENTS[PAGE_DEFAULT_AGENTS[page] ?? 'homeDefault'] ?? homeDefault;
}

export function getAllAgents(): Record<string, WidgetAgent> {
  return ALL_AGENTS;
}
