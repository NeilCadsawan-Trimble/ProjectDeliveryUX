import { buildStaffingConflicts, buildUrgentNeeds, PROJECTS, getProjectWeather } from '../dashboard-data';
import type { AgentAction, WidgetAgent } from './shared';
import { fmtProjects, kw, maxDaysPastDue } from './shared';
import { changeOrdersAgent, weatherAgent } from './financials-agents';

export const homeTimeOff: WidgetAgent = {
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

export const homeCalendar: WidgetAgent = {
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

export const homeRfis: WidgetAgent = {
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

export const homeSubmittals: WidgetAgent = {
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

export const homeDefault: WidgetAgent = {
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
export const urgentNeedsAgent: WidgetAgent = {
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

export const homeWeatherAgent: WidgetAgent = {
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

export const HOME_AGENTS: WidgetAgent[] = [
  homeTimeOff,
  homeCalendar,
  homeRfis,
  homeSubmittals,
  homeDefault,
  urgentNeedsAgent,
  homeWeatherAgent,
];

