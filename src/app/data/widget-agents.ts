import type { Rfi, Submittal, CalendarAppointment, Project, Estimate, ActivityItem, ChangeOrder, DailyReport, WeatherForecast, ProjectAttentionItem, BudgetHistoryPoint, Inspection, PunchListItem, ProjectRevenue } from './dashboard-data';
import type { Milestone, TeamMember, Task, Risk, ActivityEntry, Drawing, BudgetBreakdown } from './project-data';
import type { DrawingTile } from './drawings-data';

export interface AgentDataState {
  projects?: Project[];
  estimates?: Estimate[];
  activities?: ActivityItem[];
  attentionItems?: { title: string; subtitle: string }[];
  timeOffRequests?: { name: string; type: string; startDate: string; endDate: string; days: number; status: string }[];
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

  currentPage?: string;
  currentSubPage?: string;
}

export interface WidgetAgent {
  id: string;
  name: string;
  systemPrompt: string;
  suggestions: string[];
  buildContext: (s: AgentDataState) => string;
  localRespond: (query: string, s: AgentDataState) => string;
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

const homeTimeOff: WidgetAgent = {
  id: 'homeTimeOff',
  name: 'Time Off Requests',
  systemPrompt: 'You are an HR scheduling assistant for a construction company. You help managers understand upcoming absences, PTO conflicts, and team availability.',
  suggestions: ['How many time-off requests are pending?', 'Who is out this week?', 'Show upcoming PTO conflicts'],
  buildContext(s) {
    if (!s.timeOffRequests?.length) return 'No time-off requests.';
    const lines = s.timeOffRequests.map(r => `  ${r.name}: ${r.type}, ${r.startDate}-${r.endDate} (${r.days} day(s)), status: ${r.status}`);
    return `Time off requests (${s.timeOffRequests.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const reqs = s.timeOffRequests ?? [];
    if (kw(q, 'pending', 'how many', 'count')) {
      const pending = reqs.filter(r => r.status === 'Pending');
      return `There are ${pending.length} pending time-off requests out of ${reqs.length} total.`;
    }
    if (kw(q, 'who', 'out', 'absence')) {
      return reqs.length ? `Current requests: ${reqs.map(r => `${r.name} (${r.type}, ${r.startDate}-${r.endDate})`).join('; ')}` : 'No time-off requests on file.';
    }
    return `I track ${reqs.length} time-off requests. Ask about pending requests, who is out, or scheduling conflicts.`;
  },
};

const homeCalendar: WidgetAgent = {
  id: 'homeCalendar',
  name: 'Calendar',
  systemPrompt: 'You are a scheduling assistant for construction project managers. You help with meeting coordination, schedule conflicts, and upcoming deadlines.',
  suggestions: ['What meetings do I have today?', 'Show my schedule for this week', 'Are there any scheduling conflicts?'],
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
  suggestions: ['How many RFIs are open?', 'Which RFIs are overdue?', 'Summarize RFI response times'],
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
  suggestions: ['How many submittals are pending review?', 'Which submittals are overdue?', 'Summarize submittal approval rates'],
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
  suggestions: ['Give me a portfolio overview', 'Which projects need attention?', 'Will weather impact work this week?', 'How are budgets tracking?'],
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
  suggestions: ['Which projects are at risk?', 'Summarize project status', 'Show overdue projects'],
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
  systemPrompt: 'You are an estimating coordinator for construction projects. You track estimate pipelines, approval workflows, and help prioritize estimate reviews.',
  suggestions: ['Show overdue estimates', 'What is the total estimate pipeline value?', 'Which estimates need approval?'],
  buildContext(s) {
    const estimates = s.estimates ?? [];
    const lines = estimates.map(e => `  ${e.id}: ${e.project}, ${e.value} (${e.type}), status: ${e.status}, requested by ${e.requestedBy}, due ${e.dueDate}, ${e.daysLeft} days left`);
    return `Open estimates (${estimates.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const estimates = s.estimates ?? [];
    if (kw(q, 'overdue', 'late', 'past due')) {
      const overdue = estimates.filter(e => e.daysLeft < 0);
      return overdue.length ? `${overdue.length} overdue estimate(s): ${overdue.map(e => `${e.id} - ${e.project}`).join('; ')}` : 'No overdue estimates.';
    }
    if (kw(q, 'pipeline', 'total', 'value')) {
      const total = estimates.reduce((sum, e) => sum + e.valueRaw, 0);
      return `Total estimate pipeline: $${(total / 1000).toFixed(0)}K across ${estimates.length} open estimates.`;
    }
    if (kw(q, 'approval', 'awaiting')) {
      const awaiting = estimates.filter(e => e.status === 'Awaiting Approval');
      return awaiting.length ? `${awaiting.length} estimate(s) awaiting approval: ${awaiting.map(e => `${e.id} (${e.value})`).join(', ')}` : 'No estimates awaiting approval.';
    }
    return `${estimates.length} open estimates in the pipeline. Ask about overdue items, approval status, or pipeline value.`;
  },
};

const recentActivity: WidgetAgent = {
  id: 'recentActivity',
  name: 'Recent Activity',
  systemPrompt: 'You are a project activity analyst. You track recent changes, updates, and team actions across construction projects.',
  suggestions: ['What changed today?', 'Show the most recent updates', 'Who has been most active this week?'],
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
  suggestions: ['What needs attention today?', 'Show critical items', 'Which items are most urgent?'],
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
  suggestions: ['Give me a portfolio summary', 'Which projects need attention?', 'What is the estimate pipeline?', 'Show recent activity'],
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
  suggestions: ['Which projects are over budget?', 'Show budget utilization summary', 'What is the total spend vs. forecast?'],
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
  suggestions: ['How is the overall budget tracking?', 'Which projects are over budget?', 'What is the total outstanding revenue?', 'Show pending change orders'],
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
  suggestions: ['Which milestones are coming up?', 'Are any milestones at risk?', 'Summarize milestone completion rate'],
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
  suggestions: ['Which tasks are overdue?', 'Show high-priority tasks', 'What tasks are blocked?'],
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
  name: 'Risks',
  systemPrompt: 'You are a risk management specialist for construction projects. You assess risk severity, evaluate mitigation strategies, and advise on risk response plans.',
  suggestions: ['What are the biggest risks right now?', 'Show high-severity risks', 'What risk mitigations are in place?'],
  buildContext(s) {
    const risks = s.risks ?? [];
    const lines = risks.map(r => `  ${r.title}: severity ${r.severity}, impact: ${r.impact}, mitigation: ${r.mitigation}`);
    return `Project: ${s.projectName}\nRisks (${risks.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const risks = s.risks ?? [];
    if (kw(q, 'high', 'biggest', 'critical', 'severe')) {
      const high = risks.filter(r => r.severity === 'high');
      return high.length ? `${high.length} high-severity risk(s): ${high.map(r => `${r.title} -- ${r.impact}`).join('; ')}` : 'No high-severity risks.';
    }
    if (kw(q, 'mitigation', 'response', 'plan')) {
      return risks.map(r => `${r.title}: ${r.mitigation}`).join('; ') || 'No risks documented.';
    }
    return `${risks.length} risks identified for ${s.projectName}. ${risks.filter(r => r.severity === 'high').length} are high severity. Ask about mitigations or specific risk areas.`;
  },
};

const drawingAgent: WidgetAgent = {
  id: 'drawing',
  name: 'Drawing',
  systemPrompt: 'You are a document control specialist for construction projects. You track drawing revisions, review cycles, and help manage the drawing submission process.',
  suggestions: ['How many drawings need review?', 'Show latest drawing revisions', 'Are there any drawing approval bottlenecks?'],
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
  suggestions: ['How is the budget tracking?', 'Which cost categories are over budget?', 'Forecast the end-of-project spend'],
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
      return `Budget is ${s.budgetPct}% utilized (${s.budgetUsed} of ${s.budgetTotal}). ${s.budgetHealthy ? 'On track.' : 'Critical -- at risk of overrun.'}${s.budgetRemaining ? ` Remaining: ${s.budgetRemaining}.` : ''}`;
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
  systemPrompt: 'You are a resource management specialist for construction projects. You track team allocation, availability, workload distribution, and help optimize staffing.',
  suggestions: ['Who is assigned to this project?', 'Show team availability', 'Are there any resource conflicts?'],
  buildContext(s) {
    const team = s.team ?? [];
    const lines = team.map(t => `  ${t.name} (${t.role}): ${t.tasksCompleted}/${t.tasksTotal} tasks done, ${t.availability}% available`);
    return `Project: ${s.projectName}\nTeam (${team.length} members):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const team = s.team ?? [];
    if (kw(q, 'who', 'assigned', 'member', 'list')) {
      return team.length ? `Team (${team.length}): ${team.map(t => `${t.name} (${t.role})`).join(', ')}` : 'No team data available.';
    }
    if (kw(q, 'availability', 'available', 'capacity')) {
      const low = team.filter(t => t.availability < 50);
      return low.length ? `${low.length} team member(s) with low availability (<50%): ${low.map(t => `${t.name} (${t.availability}%)`).join(', ')}` : 'All team members have adequate availability.';
    }
    return `${team.length} team members assigned to ${s.projectName}. Ask about availability, workload, or specific roles.`;
  },
};

const activityAgent: WidgetAgent = {
  id: 'activity',
  name: 'Recent Activity',
  systemPrompt: 'You are a project activity analyst for a construction project. You track recent changes, updates, and team actions.',
  suggestions: ['What changed recently on this project?', 'Show the latest updates', 'Who has been most active?'],
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
  suggestions: ['What are the biggest risks right now?', 'Summarize project progress', 'Any items needing attention?', 'How is the budget tracking?'],
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
  suggestions: ['Which RFIs are overdue?', 'Show open RFIs by assignee', 'Summarize RFI status'],
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
  suggestions: ['Which submittals are overdue?', 'Show open submittals by assignee', 'Summarize submittal status'],
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
  suggestions: ['How is the budget tracking?', 'Show cost breakdown by category', 'Which categories are over budget?'],
  buildContext(s) { return budgetAgent.buildContext(s); },
  localRespond(q, s) { return budgetAgent.localRespond(q, s); },
};

const financialsSubledger: WidgetAgent = {
  id: 'financialsSubledger',
  name: 'Subledger',
  systemPrompt: 'You are a cost accounting specialist for construction projects. You have access to transaction-level subledger data and can analyze spending patterns, vendor payments, and cost trends for specific cost categories.',
  suggestions: ['Summarize transactions for this category', 'Which vendors have the highest spend?', 'Show spending trend over time'],
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
  suggestions: ['How many drawings are in the set?', 'Show the latest revisions', 'Which drawings were recently updated?'],
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
  suggestions: ['Summarize this RFI', 'Who is responsible?', 'Is this overdue?'],
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
  suggestions: ['Summarize this submittal', 'Who is responsible?', 'Is this overdue?'],
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
  systemPrompt: 'You are a change order management specialist for construction projects. You track pending approvals, financial impacts, and help evaluate change requests.',
  suggestions: ['How many change orders are pending?', 'What is the total financial impact?', 'Which change orders are approved?'],
  buildContext(s) {
    const cos = s.changeOrders ?? [];
    if (!cos.length) return 'No change orders.';
    const lines = cos.map(co => `  ${co.id}: ${co.description}, project: ${co.project}, $${co.amount.toLocaleString()}, status: ${co.status}, requested by ${co.requestedBy} on ${co.requestDate}\n    Reason: ${co.reason}`);
    return `Change orders (${cos.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(co => co.status === 'pending');
    const approved = cos.filter(co => co.status === 'approved');
    const totalPending = pending.reduce((sum, co) => sum + co.amount, 0);
    if (kw(q, 'pending', 'how many', 'awaiting')) {
      return `${pending.length} pending change order(s) totaling $${totalPending.toLocaleString()}: ${pending.map(co => `${co.id} ($${co.amount.toLocaleString()})`).join(', ')}`;
    }
    if (kw(q, 'total', 'impact', 'financial', 'cost')) {
      const total = cos.reduce((sum, co) => sum + co.amount, 0);
      return `Total change order value: $${total.toLocaleString()} across ${cos.length} orders. $${totalPending.toLocaleString()} pending approval.`;
    }
    if (kw(q, 'approved')) {
      return approved.length ? `${approved.length} approved change order(s): ${approved.map(co => `${co.id} ($${co.amount.toLocaleString()})`).join(', ')}` : 'No approved change orders.';
    }
    return `Tracking ${cos.length} change orders: ${pending.length} pending, ${approved.length} approved. Total pending value: $${totalPending.toLocaleString()}.`;
  },
};

const dailyReportsAgent: WidgetAgent = {
  id: 'dailyReports',
  name: 'Daily Reports',
  systemPrompt: 'You are a field operations analyst for construction projects. You track daily reports including crew counts, work performed, weather impacts, and safety incidents.',
  suggestions: ['Show today\'s reports', 'Any safety incidents this week?', 'How many crew hours were logged today?'],
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
      return `${reports.length} reports filed: ${totalCrew} total crew members, ${totalHours} total hours logged.`;
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
  suggestions: ['Will weather impact work this week?', 'When is the next rain day?', 'Show the 7-day forecast'],
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
  suggestions: ['Any failed inspections?', 'Show pending inspections', 'Summarize punch list items'],
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
      return failed.length ? `${failed.length} failed inspection(s): ${failed.map(i => `${i.type} at ${i.project} -- ${i.notes}`).join('; ')}` : 'No failed inspections.';
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
  suggestions: ['What is the total outstanding amount?', 'Which projects have unpaid invoices?', 'Show retainage summary'],
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
  suggestions: ['Summarize recent daily reports', 'How many crew were on site this week?', 'Any safety incidents reported?', 'Which days had weather impacts?'],
  buildContext(s) { return dailyReportsAgent.buildContext(s); },
  localRespond(q, s) { return dailyReportsAgent.localRespond(q, s); },
};

const recordsPunchItems: WidgetAgent = {
  id: 'recordsPunchItems',
  name: 'Punch Items (Records)',
  systemPrompt: 'You are a punch list management specialist. You have access to all punch list items for this project and can analyze open items, priorities, and resolution progress.',
  suggestions: ['How many punch items are open?', 'Show high priority items', 'Which areas have the most punch items?', 'What is the resolution rate?'],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const recordsInspections: WidgetAgent = {
  id: 'recordsInspections',
  name: 'Inspections (Records)',
  systemPrompt: 'You are a quality control specialist. You have access to all inspections for this project and can analyze pass/fail rates, inspector activity, and compliance trends.',
  suggestions: ['What is the inspection pass rate?', 'Any failed inspections needing follow-up?', 'Summarize recent inspections', 'Which inspectors are most active?'],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const recordsActionItems: WidgetAgent = {
  id: 'recordsActionItems',
  name: 'Action Items (Records)',
  systemPrompt: 'You are a project coordination specialist. You track action items, alerts, and attention items that need resolution across the project.',
  suggestions: ['What items need immediate attention?', 'Show critical action items', 'Any overdue action items?'],
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
  suggestions: ['How many change orders are pending?', 'What is the total financial impact?', 'Which change orders were recently approved?'],
  buildContext(s) { return changeOrdersAgent.buildContext(s); },
  localRespond(q, s) { return changeOrdersAgent.localRespond(q, s); },
};

const financialsRevenue: WidgetAgent = {
  id: 'financialsRevenue',
  name: 'Revenue (Financials)',
  systemPrompt: 'You are a revenue and accounts receivable specialist. You have access to all revenue data, invoicing status, collections, and outstanding balances for this project.',
  suggestions: ['What is the total outstanding amount?', 'How much retainage is held?', 'Summarize collections progress', 'Which applications have the most outstanding?'],
  buildContext(s) { return revenueAgent.buildContext(s); },
  localRespond(q, s) { return revenueAgent.localRespond(q, s); },
};

const financialsCostForecasts: WidgetAgent = {
  id: 'financialsCostForecasts',
  name: 'Cost Forecasts (Financials)',
  systemPrompt: 'You are a cost forecasting specialist. You have access to budget history, planned vs actual spending, and forecast data for this project.',
  suggestions: ['How is actual spending vs plan?', 'What is the forecast at completion?', 'Show monthly budget trends', 'Any months significantly over budget?'],
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

const dailyReportDetail: WidgetAgent = {
  id: 'dailyReportDetail',
  name: 'Daily Report Detail',
  systemPrompt: 'You are a field operations specialist reviewing a specific daily report. Help analyze crew activity, work performed, weather conditions, and safety details for this report.',
  suggestions: ['Summarize this daily report', 'Were there any safety concerns?', 'How does crew count compare to typical?'],
  buildContext(s) { return dailyReportsAgent.buildContext(s); },
  localRespond(q, s) { return dailyReportsAgent.localRespond(q, s); },
};

const inspectionDetail: WidgetAgent = {
  id: 'inspectionDetail',
  name: 'Inspection Detail',
  systemPrompt: 'You are a quality assurance specialist reviewing a specific inspection. Help analyze the inspection results, notes, and any required follow-up actions.',
  suggestions: ['What was the inspection result?', 'Is follow-up needed?', 'What were the inspector notes?'],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const punchItemDetail: WidgetAgent = {
  id: 'punchItemDetail',
  name: 'Punch Item Detail',
  systemPrompt: 'You are a punch list resolution specialist reviewing a specific punch item. Help analyze the item details, priority, assignment, and resolution steps.',
  suggestions: ['What is the status of this item?', 'Who is assigned?', 'What is the priority level?'],
  buildContext(s) { return inspectionsAgent.buildContext(s); },
  localRespond(q, s) { return inspectionsAgent.localRespond(q, s); },
};

const changeOrderDetail: WidgetAgent = {
  id: 'changeOrderDetail',
  name: 'Change Order Detail',
  systemPrompt: 'You are a change order review specialist examining a specific change order. Help analyze the request details, financial impact, approval status, and justification.',
  suggestions: ['What is the financial impact?', 'What is the approval status?', 'Why was this change requested?'],
  buildContext(s) { return changeOrdersAgent.buildContext(s); },
  localRespond(q, s) { return changeOrdersAgent.localRespond(q, s); },
};

const ALL_AGENTS: Record<string, WidgetAgent> = {
  homeTimeOff, homeCalendar, homeRfis, homeSubmittals, homeDefault,
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
  financialsChangeOrders, financialsRevenue, financialsCostForecasts,
  dailyReportDetail, inspectionDetail, punchItemDetail, changeOrderDetail,
};

const PAGE_DEFAULT_AGENTS: Record<string, string> = {
  home: 'homeDefault',
  projects: 'projectsDefault',
  financials: 'financialsDefault',
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
