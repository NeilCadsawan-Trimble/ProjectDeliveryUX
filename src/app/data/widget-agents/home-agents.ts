import { buildStaffingConflicts, buildUrgentNeeds } from '../dashboard-data';
import type { AgentAction, WidgetAgent } from './shared';
import { fmtProjects, kw, maxDaysPastDue } from './shared';
import { changeOrdersAgent, weatherAgent } from './financials-agents';

export const homeTimeOff: WidgetAgent = {
  id: 'homeTimeOff',
  name: 'Time Off Requests',
  systemPrompt: 'You are an HR scheduling assistant for a construction company. You help managers understand upcoming absences, PTO conflicts, staffing gaps across projects, and team availability.',
  suggestions(s) {
    const reqs = s.timeOffRequests ?? [];
    const pending = reqs.filter(r => r.status === 'Pending').length;
    const conflicts = buildStaffingConflicts(undefined, reqs);
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    const base = ['Show staffing conflicts by project', 'Who is out this week?'];
    if (critical) return [`${critical} critical staffing conflict${critical === 1 ? '' : 's'} detected`, ...base];
    if (pending) return [`${pending} pending request${pending === 1 ? '' : 's'} to review`, ...base];
    return ['Show upcoming PTO conflicts', ...base];
  },
  insight(s) {
    const reqs = s.timeOffRequests ?? [];
    const conflicts = buildStaffingConflicts(undefined, reqs);
    const critical = conflicts.filter(c => c.severity === 'critical');
    if (critical.length) return `${critical.length} project${critical.length === 1 ? '' : 's'} with critical staffing gaps`;
    const pending = reqs.filter(r => r.status === 'Pending').length;
    if (pending) return `${pending} pending request${pending === 1 ? '' : 's'} need review`;
    return null;
  },
  alerts(s) {
    const reqs = s.timeOffRequests ?? [];
    const conflicts = buildStaffingConflicts(undefined, reqs);
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
    { id: 'notify-managers', label: 'Notify managers of staffing conflicts', execute: (st) => {
      const conflicts = buildStaffingConflicts(undefined, st.timeOffRequests ?? []);
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
    const conflicts = buildStaffingConflicts(undefined, reqs);
    const conflictLines = conflicts.map(c => `  ${c.projectName} ${c.week}: ${c.absentCount}/${c.teamSize} out (${c.absentPct}%) -- ${c.severity} -- ${c.absentees.join(', ')}`);
    return `Time off requests (${reqs.length}):\n${lines.join('\n')}\n\nStaffing conflicts (${conflicts.length}):\n${conflictLines.join('\n')}`;
  },
  localRespond(q, s) {
    const reqs = s.timeOffRequests ?? [];
    if (kw(q, 'conflict', 'staffing', 'gap', 'issue', 'problem', 'risk')) {
      const conflicts = buildStaffingConflicts(undefined, reqs);
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
    const rfis = s.rfis ?? [];
    const overdue = rfis.filter(r => r.status === 'overdue');
    if (overdue.length) {
      const oldest = maxDaysPastDue(overdue);
      return `${overdue.length} overdue, oldest ${oldest} day${oldest === 1 ? '' : 's'} past due`;
    }
    const open = rfis.filter(r => r.status === 'open');
    if (open.length) return `${open.length} open RFI${open.length === 1 ? '' : 's'} across portfolio`;
    if (rfis.length) return `${rfis.length} RFIs tracked across portfolio`;
    return null;
  },
  alerts(s) {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'overdue');
    return overdue.length ? { level: 'warning', count: overdue.length, label: 'overdue' } : null;
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
    const subs = s.submittals ?? [];
    const overdue = subs.filter(sub => sub.status === 'overdue');
    if (overdue.length) {
      const oldest = maxDaysPastDue(overdue);
      return `${overdue.length} overdue submittal${overdue.length === 1 ? '' : 's'}, oldest ${oldest} day${oldest === 1 ? '' : 's'} past due`;
    }
    const open = subs.filter(sub => sub.status === 'open');
    if (open.length) return `${open.length} open submittal${open.length === 1 ? '' : 's'} across portfolio`;
    if (subs.length) return `${subs.length} submittals tracked across portfolio`;
    return null;
  },
  alerts(s) {
    const overdue = (s.submittals ?? []).filter(sub => sub.status === 'overdue');
    return overdue.length ? { level: 'warning', count: overdue.length, label: 'overdue' } : null;
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
    if (s.personaSlug === 'kelly') {
      return ['Which invoices need approval today?', 'What payments are due this week?', 'Show vendors past due', 'What is our current cash position?'];
    }
    if (s.personaSlug === 'bert') {
      return ['Which projects need attention?', 'Summarize my project portfolio', 'Will weather impact work this week?', 'What RFIs are open?'];
    }
    if (s.personaSlug === 'pamela') {
      return ['What is the estimate pipeline?', 'Which estimates need attention?', 'Show recent change orders', 'How are job costs tracking?'];
    }
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
    const highBudget = projects.filter(p => p.budgetPct > 80).length;
    if (atRisk || overdueProj) return `${atRisk} at risk, ${overdueProj} overdue across ${projects.length} projects`;
    if (highBudget) return `${highBudget} project${highBudget === 1 ? '' : 's'} over 80% budget`;
    if (overdueRfi) return `${overdueRfi} portfolio RFI(s) overdue`;
    if (projects.length) {
      const avgPct = Math.round(projects.reduce((sum, p) => sum + p.budgetPct, 0) / projects.length);
      return `${projects.length} projects, avg ${avgPct}% budget utilization`;
    }
    return null;
  },
  alerts: () => null,
  actions: (s) => {
    if (s.personaSlug === 'kelly') {
      return [
        { id: 'open-ap', label: 'Open AP invoices', execute: () => 'Opening Accounts Payable.', route: '/financials/accounts-payable' },
        { id: 'open-cash', label: 'Open cash management', execute: () => 'Opening Cash Management.', route: '/financials/cash-management' },
        { id: 'open-ar', label: 'Open accounts receivable', execute: () => 'Opening Accounts Receivable.', route: '/financials/accounts-receivable' },
      ];
    }
    if (s.personaSlug === 'bert') {
      return [
        { id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' },
        { id: 'review-rfis', label: 'Review pending RFIs', execute: () => 'Opening pending RFIs.' },
        { id: 'refresh-attention', label: 'Refresh attention feed', execute: () => 'Refreshed items needing attention.' },
      ];
    }
    if (s.personaSlug === 'pamela') {
      return [
        { id: 'open-estimates', label: 'Open Estimates', execute: () => 'Opening Estimates.', route: '/financials/estimates' },
        { id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' },
        { id: 'refresh-attention', label: 'Refresh attention feed', execute: () => 'Refreshed items needing attention.' },
      ];
    }
    return [
      { id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' },
      { id: 'open-financials', label: 'Open Financials', execute: () => 'Opening Financials.', route: '/financials' },
      { id: 'refresh-attention', label: 'Refresh attention feed', execute: () => 'Refreshed items needing attention.' },
    ];
  },
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
  insight: (s) => {
    const items = buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []);
    const critical = items.filter(i => i.severity === 'critical').length;
    const budgetCritical = items.filter(i => i.severity === 'critical' && i.category === 'budget').length;
    if (budgetCritical > 0 && critical >= 3) return `${critical} critical items including ${budgetCritical} budget alert(s) need attention`;
    if (critical >= 3) return `${critical} critical items across the portfolio need attention`;
    if (budgetCritical > 0) return `${budgetCritical} budget alert(s) flagged -- review job costs`;
    if (critical > 0) return `${critical} critical item(s) flagged`;
    const warnings = items.filter(i => i.severity === 'warning').length;
    if (warnings > 0) return `${warnings} item(s) need attention`;
    return null;
  },
  alerts: (s) => {
    const items = buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []);
    const critical = items.filter(i => i.severity === 'critical').length;
    if (critical >= 3) return { level: 'critical' as const, count: critical, label: `${critical} critical` };
    if (critical > 0) return { level: 'warning' as const, count: critical, label: `${critical} critical` };
    const warnings = items.filter(i => i.severity === 'warning').length;
    if (warnings > 0) return { level: 'warning' as const, count: warnings, label: `${warnings} warnings` };
    return null;
  },
  actions: (s) => {
    const items = buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []);
    const budgetItems = items.filter(i => (i.category === 'budget' || i.category === 'change-order') && i.financialsRoute);
    const projectsWithBudgetIssues = [...new Map(budgetItems.map(i => [i.projectId, i])).values()].slice(0, 3);
    const finActions: AgentAction[] = projectsWithBudgetIssues.map(i => ({
      id: `open-jc-${i.projectId}`,
      label: `Open ${i.projectName} job costs`,
      execute: () => `Opening job costs for ${i.projectName}.`,
      route: i.financialsRoute!,
    }));
    const actions: AgentAction[] = [
      { id: 'escalate-critical', label: 'Escalate all critical items', execute: () => { const n = items.filter(i => i.severity === 'critical').length; return n ? `Escalated ${n} critical item(s) to leadership.` : 'No critical items.'; } },
      { id: 'export-needs', label: 'Export urgent needs report', execute: () => 'Exported urgent needs report.' },
    ];
    if (s.personaSlug !== 'kelly') {
      actions.push({ id: 'open-projects', label: 'Open Projects', execute: () => 'Opening Projects dashboard.', route: '/projects' });
    }
    if (s.personaSlug !== 'bert') {
      actions.push({ id: 'open-financials', label: 'Open Financials overview', execute: () => 'Opening Financials.', route: '/financials' });
      actions.push(...finActions);
    }
    return actions;
  },
  buildContext(s) {
    const items = buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []);
    const critical = items.filter(i => i.severity === 'critical');
    const warnings = items.filter(i => i.severity === 'warning');
    const info = items.filter(i => i.severity === 'info');
    const budgetItems = items.filter(i => i.category === 'budget' || i.category === 'change-order');
    const lines = items.map(i => `  [${i.severity.toUpperCase()}] ${i.projectName}: ${i.title} -- ${i.subtitle} (${i.category})${i.financialsRoute ? ' [financials: ' + i.financialsRoute + ']' : ''}`);
    return `Urgent needs across portfolio: ${critical.length} critical, ${warnings.length} warnings, ${info.length} info. ${budgetItems.length} financial items (budget/change-order) with direct job cost links.\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const items = buildUrgentNeeds(s?.rfis ?? [], s?.submittals ?? [], s?.changeOrders ?? []);
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
  insight(s) {
    const projects = s.projects ?? [];
    const allWeather = s.allWeatherData ?? [];
    const impacted = projects.map(p => ({ p, w: allWeather.find(w => w.projectId === p.id) })).filter(({ w }) => w && w.forecast.some(f => f.workImpact !== 'none'));
    const major = impacted.filter(({ w }) => w!.forecast.some(f => f.workImpact === 'major'));
    if (major.length) return `${major.length} site${major.length !== 1 ? 's' : ''} facing work stoppages this week`;
    if (impacted.length) return `${impacted.length} site${impacted.length !== 1 ? 's' : ''} with weather advisories`;
    return null;
  },
  alerts(s) {
    const projects = s.projects ?? [];
    const allWeather = s.allWeatherData ?? [];
    const major = projects.filter(p => { const w = allWeather.find(w => w.projectId === p.id); return w && w.forecast.some(f => f.workImpact === 'major'); });
    return major.length ? { level: 'warning' as const, count: major.length, label: 'sites with work stoppages' } : null;
  },
  actions: () => [
    { id: 'alert-all-subs', label: 'Alert all subcontractors', execute: () => 'Sent weather lookahead to all subcontractors across impacted sites.' },
    { id: 'export-weather', label: 'Export weather report', execute: () => 'Exported portfolio weather outlook PDF.' },
  ],
  buildContext(s) {
    const projects = s.projects ?? [];
    const weatherData = s.allWeatherData ?? [];
    const lines = projects.map(p => {
      const w = weatherData.find(w => w.projectId === p.id);
      if (!w) return `  ${p.name} (${p.city}, ${p.state}): No weather data`;
      const impact = w.forecast.filter(f => f.workImpact !== 'none');
      const impactStr = impact.length ? `${impact.length} impact day(s): ${impact.map(f => `${f.day} ${f.date} ${f.workImpact}`).join(', ')}` : 'no impact';
      return `  ${p.name} (${p.city}, ${p.state}): ${w.current.tempF}F ${w.current.condition}, ${impactStr}`;
    });
    return `Portfolio weather outlook:\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    const weatherData = s.allWeatherData ?? [];
    const allWeather = projects.map(p => ({ p, w: weatherData.find(w => w.projectId === p.id)! })).filter(({ w }) => !!w);
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

// --- Kelly AP widget agents (fully wired) ---

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export const homeApKpis: WidgetAgent = {
  id: 'homeApKpis',
  name: 'AP Metrics',
  systemPrompt: 'You are an AP clerk assistant. Help Kelly understand her accounts payable KPIs, invoice volumes, upcoming payments, and early-pay discount opportunities.',
  suggestions(s) {
    const inv = s.apInvoices ?? [];
    const pending = inv.filter(i => i.status === 'pending').length;
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    const sched = s.apPaymentSchedule ?? [];
    const discounts = sched.filter(p => p.discountAvailable > 0).length;
    if (onHold > 0) return [`${onHold} invoice(s) on hold -- review needed`, 'What is our total outstanding AP?', 'Are there discounts expiring soon?'];
    if (discounts > 0) return [`${discounts} early-pay discounts available`, 'How many invoices need processing?', 'What is our total outstanding AP?'];
    if (pending > 0) return [`${pending} invoices awaiting review`, 'Show AP summary', 'When is the next check run?'];
    return ['What is our total outstanding AP?', 'How many invoices need processing?', 'Are there discounts expiring soon?'];
  },
  insight(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold');
    const pending = inv.filter(i => i.status === 'pending');
    const sched = s.apPaymentSchedule ?? [];
    const discountTotal = sched.reduce((sum, p) => sum + p.discountAvailable, 0);
    if (onHold.length > 0) {
      const holdTotal = onHold.reduce((sum, i) => sum + i.amount, 0);
      return `${onHold.length} on hold (${fmtCurrency(holdTotal)}) -- review needed`;
    }
    if (discountTotal > 0) return `${fmtCurrency(discountTotal)} in early-pay discounts available`;
    if (pending.length > 0) return `${pending.length} invoice${pending.length === 1 ? '' : 's'} pending review`;
    return null;
  },
  alerts(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    if (onHold > 0) return { level: 'warning' as const, count: onHold, label: 'on hold' };
    return null;
  },
  actions(s) {
    const inv = s.apInvoices ?? [];
    const pending = inv.filter(i => i.status === 'pending');
    const actions: AgentAction[] = [];
    if (pending.length > 0) actions.push({ id: 'batch-approve', label: 'Batch approve pending invoices', execute: () => `Approved ${pending.length} pending invoice(s) totaling ${fmtCurrency(pending.reduce((sum, i) => sum + i.amount, 0))}.` });
    actions.push({ id: 'export-ap-summary', label: 'Export AP summary', execute: () => 'Exported AP metrics summary to PDF.' });
    actions.push({ id: 'open-ap', label: 'Open AP invoices', execute: () => 'Opening Accounts Payable.', route: '/financials/accounts-payable' });
    return actions;
  },
  buildContext(s) {
    const inv = s.apInvoices ?? [];
    const vendors = s.apVendors ?? [];
    const totalOwed = vendors.reduce((sum, v) => sum + v.totalOwed, 0);
    const pending = inv.filter(i => i.status === 'pending');
    const approved = inv.filter(i => i.status === 'approved');
    const onHold = inv.filter(i => i.status === 'on-hold');
    return `AP Overview: ${inv.length} invoices, ${vendors.length} vendors, ${fmtCurrency(totalOwed)} total outstanding.\nPending: ${pending.length} (${fmtCurrency(pending.reduce((sum, i) => sum + i.amount, 0))})\nApproved: ${approved.length} (${fmtCurrency(approved.reduce((sum, i) => sum + i.amount, 0))})\nOn Hold: ${onHold.length} (${fmtCurrency(onHold.reduce((sum, i) => sum + i.amount, 0))})`;
  },
  localRespond(q, s) {
    const inv = s.apInvoices ?? [];
    const vendors = s.apVendors ?? [];
    if (kw(q, 'outstanding', 'total', 'owed', 'balance')) {
      const totalOwed = vendors.reduce((sum, v) => sum + v.totalOwed, 0);
      return `Total outstanding AP is ${fmtCurrency(totalOwed)} across ${vendors.length} vendors.`;
    }
    if (kw(q, 'pending', 'need', 'processing', 'review', 'how many')) {
      const pending = inv.filter(i => i.status === 'pending');
      return `${pending.length} invoices pending review totaling ${fmtCurrency(pending.reduce((sum, i) => sum + i.amount, 0))}.`;
    }
    if (kw(q, 'discount', 'early pay', 'savings')) {
      const sched = s.apPaymentSchedule ?? [];
      const withDiscount = sched.filter(p => p.discountAvailable > 0);
      if (!withDiscount.length) return 'No early-pay discounts currently available.';
      const total = withDiscount.reduce((sum, p) => sum + p.discountAvailable, 0);
      return `${withDiscount.length} payment(s) with early-pay discounts totaling ${fmtCurrency(total)}: ${withDiscount.map(p => `${p.vendor} (${fmtCurrency(p.discountAvailable)} by ${p.discountDeadline})`).join(', ')}`;
    }
    if (kw(q, 'hold', 'on hold', 'dispute')) {
      const onHold = inv.filter(i => i.status === 'on-hold');
      return onHold.length ? `${onHold.length} invoice(s) on hold: ${onHold.map(i => `${i.invoiceNumber} -- ${i.vendor} (${fmtCurrency(i.amount)})`).join('; ')}` : 'No invoices on hold.';
    }
    const pending = inv.filter(i => i.status === 'pending').length;
    const approved = inv.filter(i => i.status === 'approved').length;
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    return `AP snapshot: ${pending} pending, ${approved} approved, ${onHold} on hold. Ask about outstanding balances, discounts, or specific vendors.`;
  },
};

export const homeInvoiceQueue: WidgetAgent = {
  id: 'homeInvoiceQueue',
  name: 'Invoice Queue',
  systemPrompt: 'You help manage the invoice review queue for a construction AP department. Answer questions about pending invoices, aging, vendor disputes, and approval workflows.',
  suggestions(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    const overdue = inv.filter(i => i.status === 'pending' && i.daysOutstanding > 14).length;
    if (onHold > 0) return [`${onHold} invoice(s) on hold -- need resolution`, 'Show oldest pending invoices', 'Which PO numbers have mismatches?'];
    if (overdue > 0) return [`${overdue} invoice(s) aging past 14 days`, 'Which invoices are on hold?', 'Show queue by vendor'];
    return ['Which invoices are on hold?', 'Show the oldest pending invoices', 'Which PO numbers have mismatches?'];
  },
  insight(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold');
    if (onHold.length > 0) return `${onHold.length} invoice${onHold.length === 1 ? '' : 's'} on hold -- action required`;
    const pending = inv.filter(i => i.status === 'pending');
    const oldest = pending.reduce((max, i) => Math.max(max, i.daysOutstanding), 0);
    if (oldest > 14) return `Oldest pending invoice is ${oldest} days old`;
    if (pending.length > 0) return `${pending.length} invoice${pending.length === 1 ? '' : 's'} in review queue`;
    return null;
  },
  alerts(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    if (onHold > 0) return { level: 'critical' as const, count: onHold, label: 'on hold' };
    const aging = inv.filter(i => i.status === 'pending' && i.daysOutstanding > 14).length;
    if (aging > 0) return { level: 'warning' as const, count: aging, label: 'aging invoices' };
    return null;
  },
  actions(s) {
    const inv = s.apInvoices ?? [];
    const onHold = inv.filter(i => i.status === 'on-hold');
    const pending = inv.filter(i => i.status === 'pending');
    const actions: AgentAction[] = [];
    if (onHold.length > 0) actions.push({ id: 'resolve-holds', label: 'Review held invoices', execute: () => `Flagged ${onHold.length} held invoice(s) for resolution: ${onHold.map(i => i.invoiceNumber).join(', ')}.` });
    if (pending.length > 0) actions.push({ id: 'approve-queue', label: 'Approve all pending', execute: () => `Approved ${pending.length} pending invoice(s).` });
    actions.push({ id: 'export-queue', label: 'Export invoice queue', execute: () => 'Exported invoice queue report.' });
    return actions;
  },
  buildContext(s) {
    const inv = s.apInvoices ?? [];
    if (!inv.length) return 'No invoices in queue.';
    const lines = inv.filter(i => i.status !== 'paid').map(i => `  ${i.invoiceNumber}: ${i.vendor}, ${fmtCurrency(i.amount)}, ${i.project}, status: ${i.status}, ${i.daysOutstanding}d old`);
    return `Invoice queue (${lines.length} active):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const inv = s.apInvoices ?? [];
    if (kw(q, 'hold', 'dispute', 'blocked')) {
      const onHold = inv.filter(i => i.status === 'on-hold');
      return onHold.length ? `${onHold.length} invoice(s) on hold:\n${onHold.map(i => `- **${i.invoiceNumber}** (${i.vendor}): ${fmtCurrency(i.amount)}, ${i.daysOutstanding} days old`).join('\n')}` : 'No invoices on hold.';
    }
    if (kw(q, 'oldest', 'aging', 'overdue', 'old')) {
      const pending = inv.filter(i => i.status === 'pending').sort((a, b) => b.daysOutstanding - a.daysOutstanding);
      return pending.length ? `Oldest pending invoices:\n${pending.slice(0, 5).map(i => `- **${i.invoiceNumber}** (${i.vendor}): ${i.daysOutstanding} days, ${fmtCurrency(i.amount)}`).join('\n')}` : 'No pending invoices.';
    }
    if (kw(q, 'po', 'purchase order', 'mismatch')) {
      return 'PO matching is checked during invoice receipt. Currently, held invoices may have PO mismatches -- review the on-hold queue.';
    }
    if (kw(q, 'vendor')) {
      const byVendor = new Map<string, number>();
      for (const i of inv.filter(x => x.status !== 'paid')) byVendor.set(i.vendor, (byVendor.get(i.vendor) ?? 0) + 1);
      return `Queue by vendor: ${[...byVendor.entries()].map(([v, c]) => `${v}: ${c}`).join(', ')}`;
    }
    const pending = inv.filter(i => i.status === 'pending').length;
    const onHold = inv.filter(i => i.status === 'on-hold').length;
    const approved = inv.filter(i => i.status === 'approved').length;
    return `Invoice queue: ${pending} pending, ${approved} approved, ${onHold} on hold. Ask about holds, aging, or specific vendors.`;
  },
};

export const homePaymentSchedule: WidgetAgent = {
  id: 'homePaymentSchedule',
  name: 'Payment Schedule',
  systemPrompt: 'You help manage payment scheduling and disbursements for construction projects. Answer about upcoming check runs, ACH batches, and discount deadlines.',
  suggestions(s) {
    const sched = s.apPaymentSchedule ?? [];
    const discounts = sched.filter(p => p.discountAvailable > 0);
    const totalDue = sched.reduce((sum, p) => sum + p.amount, 0);
    if (discounts.length > 0) return [`${discounts.length} discount deadline(s) approaching`, 'What payments are due this week?', 'When is the next check run?'];
    return [`${fmtCurrency(totalDue)} in upcoming payments`, 'What payments are due this week?', 'When is the next check run?'];
  },
  insight(s) {
    const sched = s.apPaymentSchedule ?? [];
    const discounts = sched.filter(p => p.discountAvailable > 0);
    const totalDiscount = discounts.reduce((sum, p) => sum + p.discountAvailable, 0);
    if (totalDiscount > 0) return `${fmtCurrency(totalDiscount)} in discounts expiring soon`;
    if (sched.length > 0) {
      const totalDue = sched.reduce((sum, p) => sum + p.amount, 0);
      return `${sched.length} payment${sched.length === 1 ? '' : 's'} scheduled (${fmtCurrency(totalDue)})`;
    }
    return null;
  },
  alerts(s) {
    const sched = s.apPaymentSchedule ?? [];
    const urgentDiscounts = sched.filter(p => p.discountAvailable > 0).length;
    if (urgentDiscounts > 0) return { level: 'warning' as const, count: urgentDiscounts, label: 'discount deadlines' };
    return null;
  },
  actions(s) {
    const sched = s.apPaymentSchedule ?? [];
    const actions: AgentAction[] = [];
    const discounts = sched.filter(p => p.discountAvailable > 0);
    if (discounts.length > 0) actions.push({ id: 'capture-discounts', label: 'Prioritize discount payments', execute: () => `Moved ${discounts.length} discount-eligible payment(s) to priority queue.` });
    actions.push({ id: 'run-check-batch', label: 'Run check batch', execute: () => `Initiated check run for ${sched.length} scheduled payment(s).` });
    actions.push({ id: 'export-schedule', label: 'Export payment schedule', execute: () => 'Exported payment schedule to PDF.' });
    return actions;
  },
  buildContext(s) {
    const sched = s.apPaymentSchedule ?? [];
    if (!sched.length) return 'No upcoming payments.';
    const lines = sched.map(p => `  ${p.vendor}: ${fmtCurrency(p.amount)} due ${p.dueDate}, project: ${p.project}${p.discountAvailable ? ` (${fmtCurrency(p.discountAvailable)} discount by ${p.discountDeadline})` : ''}`);
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    return `Payment schedule (${sched.length} payments, ${fmtCurrency(total)} total):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const sched = s.apPaymentSchedule ?? [];
    if (kw(q, 'discount', 'early pay', 'savings')) {
      const discounts = sched.filter(p => p.discountAvailable > 0);
      return discounts.length ? `${discounts.length} payments with discounts:\n${discounts.map(p => `- **${p.vendor}**: ${fmtCurrency(p.discountAvailable)} discount if paid by ${p.discountDeadline}`).join('\n')}` : 'No discount opportunities right now.';
    }
    if (kw(q, 'this week', 'due', 'upcoming', 'next')) {
      return sched.length ? `Upcoming payments:\n${sched.slice(0, 5).map(p => `- **${p.vendor}**: ${fmtCurrency(p.amount)} due ${p.dueDate}`).join('\n')}${sched.length > 5 ? `\n...and ${sched.length - 5} more` : ''}` : 'No payments scheduled.';
    }
    if (kw(q, 'check run', 'batch', 'ach')) {
      return `Next check run covers ${sched.length} payments totaling ${fmtCurrency(sched.reduce((sum, p) => sum + p.amount, 0))}. Schedule a batch to process.`;
    }
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    return `${sched.length} payments scheduled totaling ${fmtCurrency(total)}. Ask about discount deadlines, upcoming due dates, or check runs.`;
  },
};

export const homeVendorAging: WidgetAgent = {
  id: 'homeVendorAging',
  name: 'Vendor Aging',
  systemPrompt: 'You analyze vendor aging data for a construction AP department. Help identify overdue balances, aging trends, and vendor payment priorities.',
  suggestions(s) {
    const vendors = s.apVendors ?? [];
    const with90 = vendors.filter(v => v.aging90 > 0 || v.aging90plus > 0).length;
    const with60 = vendors.filter(v => v.aging60 > 0).length;
    if (with90 > 0) return [`${with90} vendor(s) with 90+ day balances`, 'Who should we prioritize for payment?', 'Show aging by vendor type'];
    if (with60 > 0) return [`${with60} vendor(s) in 60-day aging`, 'Show aging breakdown', 'Which vendors are highest risk?'];
    return ['Which vendors have the oldest balances?', 'Show aging breakdown', 'Who should we prioritize for payment?'];
  },
  insight(s) {
    const vendors = s.apVendors ?? [];
    const aging90Total = vendors.reduce((sum, v) => sum + v.aging90 + v.aging90plus, 0);
    const aging60Total = vendors.reduce((sum, v) => sum + v.aging60, 0);
    if (aging90Total > 0) return `${fmtCurrency(aging90Total)} in 90+ day aging`;
    if (aging60Total > 0) return `${fmtCurrency(aging60Total)} in 60-day aging across ${vendors.filter(v => v.aging60 > 0).length} vendor${vendors.filter(v => v.aging60 > 0).length === 1 ? '' : 's'}`;
    const totalOwed = vendors.reduce((sum, v) => sum + v.totalOwed, 0);
    if (totalOwed > 0) return `${fmtCurrency(totalOwed)} total across ${vendors.length} vendors`;
    return null;
  },
  alerts(s) {
    const vendors = s.apVendors ?? [];
    const aging90 = vendors.filter(v => v.aging90 > 0 || v.aging90plus > 0).length;
    if (aging90 > 0) return { level: 'critical' as const, count: aging90, label: '90+ day aging' };
    const aging60 = vendors.filter(v => v.aging60 > 0).length;
    if (aging60 > 0) return { level: 'warning' as const, count: aging60, label: '60-day aging' };
    return null;
  },
  actions: () => [
    { id: 'prioritize-aging', label: 'Generate priority payment list', execute: () => 'Generated priority payment list based on aging severity.' },
    { id: 'notify-vendors', label: 'Send vendor payment updates', execute: () => 'Sent payment status updates to vendors with 60+ day balances.' },
    { id: 'export-aging', label: 'Export aging report', execute: () => 'Exported vendor aging report to PDF.' },
  ],
  buildContext(s) {
    const vendors = s.apVendors ?? [];
    if (!vendors.length) return 'No vendor data.';
    const lines = vendors.map(v => `  ${v.name} (${v.vendorType}): ${fmtCurrency(v.totalOwed)} total -- Current: ${fmtCurrency(v.current)}, 30d: ${fmtCurrency(v.aging30)}, 60d: ${fmtCurrency(v.aging60)}, 90d: ${fmtCurrency(v.aging90)}, 90+: ${fmtCurrency(v.aging90plus)}`);
    return `Vendor aging (${vendors.length} vendors):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const vendors = s.apVendors ?? [];
    if (kw(q, '90', 'ninety', 'oldest', 'worst')) {
      const aged = vendors.filter(v => v.aging90 > 0 || v.aging90plus > 0);
      return aged.length ? `${aged.length} vendor(s) with 90+ day balances:\n${aged.map(v => `- **${v.name}**: ${fmtCurrency(v.aging90 + v.aging90plus)} in 90+ day aging`).join('\n')}` : 'No vendors with 90+ day balances.';
    }
    if (kw(q, 'prioritize', 'priority', 'pay first', 'should')) {
      const sorted = [...vendors].sort((a, b) => (b.aging90 + b.aging90plus + b.aging60) - (a.aging90 + a.aging90plus + a.aging60));
      return `Priority payment order:\n${sorted.slice(0, 5).map((v, i) => `${i + 1}. **${v.name}**: ${fmtCurrency(v.totalOwed)} (${fmtCurrency(v.aging60 + v.aging90 + v.aging90plus)} aged 60+)`).join('\n')}`;
    }
    if (kw(q, 'type', 'subcontractor', 'supplier')) {
      const byType = new Map<string, { count: number; total: number }>();
      for (const v of vendors) {
        const t = byType.get(v.vendorType) ?? { count: 0, total: 0 };
        t.count++; t.total += v.totalOwed;
        byType.set(v.vendorType, t);
      }
      return `Aging by vendor type:\n${[...byType.entries()].map(([type, d]) => `- **${type}**: ${d.count} vendor(s), ${fmtCurrency(d.total)} total`).join('\n')}`;
    }
    const totalOwed = vendors.reduce((sum, v) => sum + v.totalOwed, 0);
    return `Tracking ${vendors.length} vendors with ${fmtCurrency(totalOwed)} total outstanding. Ask about aging buckets, priorities, or vendor types.`;
  },
};

export const homePayAppsAgent: WidgetAgent = {
  id: 'homePayApps',
  name: 'Pay Applications',
  systemPrompt: 'You assist with construction pay application review. Answer about contractor billings, retention, progress percentages, and approval status.',
  suggestions(s) {
    const apps = s.apPayApplications ?? [];
    const pending = apps.filter(a => a.status === 'pending');
    const totalNet = pending.reduce((sum, a) => sum + a.netDue, 0);
    if (pending.length > 0) return [`${pending.length} pay app${pending.length === 1 ? '' : 's'} pending (${fmtCurrency(totalNet)} net)`, 'Show retention held', 'Which pay apps have the highest net due?'];
    return ['How many pay apps need review?', 'What is the total net due?', 'Show pay apps with the highest retention held'];
  },
  insight(s) {
    const apps = s.apPayApplications ?? [];
    const pending = apps.filter(a => a.status === 'pending');
    if (pending.length > 0) {
      const totalNet = pending.reduce((sum, a) => sum + a.netDue, 0);
      return `${pending.length} pending pay app${pending.length === 1 ? '' : 's'} (${fmtCurrency(totalNet)} net due)`;
    }
    const totalRetention = apps.reduce((sum, a) => sum + a.retentionHeld, 0);
    if (totalRetention > 0) return `${fmtCurrency(totalRetention)} retention held across contracts`;
    return null;
  },
  alerts(s) {
    const apps = s.apPayApplications ?? [];
    const pending = apps.filter(a => a.status === 'pending').length;
    if (pending >= 3) return { level: 'warning' as const, count: pending, label: 'pending review' };
    if (pending > 0) return { level: 'info' as const, count: pending, label: 'pending' };
    return null;
  },
  actions(s) {
    const apps = s.apPayApplications ?? [];
    const pending = apps.filter(a => a.status === 'pending');
    const actions: AgentAction[] = [];
    if (pending.length > 0) actions.push({ id: 'review-pay-apps', label: 'Start pay app review', execute: () => `Queued ${pending.length} pay app(s) for review.` });
    actions.push({ id: 'export-pay-apps', label: 'Export pay app report', execute: () => 'Exported pay application report.' });
    return actions;
  },
  buildContext(s) {
    const apps = s.apPayApplications ?? [];
    if (!apps.length) return 'No pay applications.';
    const lines = apps.map(a => `  ${a.vendor} (${a.project}): period ${a.periodEnd}, this period ${fmtCurrency(a.thisPeriod)}, retention ${fmtCurrency(a.retentionHeld)}, net ${fmtCurrency(a.netDue)}, status: ${a.status}`);
    return `Pay applications (${apps.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const apps = s.apPayApplications ?? [];
    if (kw(q, 'pending', 'review', 'how many')) {
      const pending = apps.filter(a => a.status === 'pending');
      return pending.length ? `${pending.length} pending pay app(s):\n${pending.map(a => `- **${a.vendor}** (${a.project}): ${fmtCurrency(a.netDue)} net due`).join('\n')}` : 'No pending pay applications.';
    }
    if (kw(q, 'retention', 'held', 'holding')) {
      const totalRetention = apps.reduce((sum, a) => sum + a.retentionHeld, 0);
      return `Total retention held: ${fmtCurrency(totalRetention)}\n${apps.filter(a => a.retentionHeld > 0).map(a => `- **${a.vendor}** (${a.project}): ${fmtCurrency(a.retentionHeld)} held (${a.retentionRate}%)`).join('\n')}`;
    }
    if (kw(q, 'net due', 'total', 'highest')) {
      const sorted = [...apps].sort((a, b) => b.netDue - a.netDue);
      return `Pay apps by net due:\n${sorted.map(a => `- **${a.vendor}** (${a.project}): ${fmtCurrency(a.netDue)} net, ${a.status}`).join('\n')}`;
    }
    return `Tracking ${apps.length} pay applications. Ask about pending reviews, retention held, or net due amounts.`;
  },
};

export const homeLienWaiversAgent: WidgetAgent = {
  id: 'homeLienWaivers',
  name: 'Lien Waivers',
  systemPrompt: 'You track lien waiver collection for construction payments. Identify missing waivers, blocked payments, and compliance risks.',
  suggestions(s) {
    const waivers = s.apLienWaivers ?? [];
    const missing = waivers.filter(w => w.status === 'missing');
    const pending = waivers.filter(w => w.status === 'pending');
    if (missing.length > 0) return [`${missing.length} missing waiver${missing.length === 1 ? '' : 's'} blocking payment`, 'Which vendors need follow-up?', 'Show waiver status by project'];
    if (pending.length > 0) return [`${pending.length} waiver${pending.length === 1 ? '' : 's'} pending receipt`, 'Are any waivers missing?', 'Show compliance by project'];
    return ['Are there any lien waivers missing?', 'Which waivers are blocking payment?', 'Show lien waiver status by project'];
  },
  insight(s) {
    const waivers = s.apLienWaivers ?? [];
    const missing = waivers.filter(w => w.status === 'missing');
    if (missing.length > 0) {
      const blockedAmount = missing.reduce((sum, w) => sum + w.amount, 0);
      return `${missing.length} missing -- ${fmtCurrency(blockedAmount)} in payments blocked`;
    }
    const pending = waivers.filter(w => w.status === 'pending');
    if (pending.length > 0) return `${pending.length} waiver${pending.length === 1 ? '' : 's'} pending receipt`;
    return null;
  },
  alerts(s) {
    const waivers = s.apLienWaivers ?? [];
    const missing = waivers.filter(w => w.status === 'missing').length;
    if (missing > 0) return { level: 'critical' as const, count: missing, label: 'missing waivers' };
    const pending = waivers.filter(w => w.status === 'pending').length;
    if (pending > 0) return { level: 'warning' as const, count: pending, label: 'pending waivers' };
    return null;
  },
  actions(s) {
    const waivers = s.apLienWaivers ?? [];
    const missing = waivers.filter(w => w.status === 'missing');
    const pending = waivers.filter(w => w.status === 'pending');
    const actions: AgentAction[] = [];
    if (missing.length > 0) actions.push({ id: 'chase-missing', label: 'Send waiver requests', execute: () => `Sent waiver requests to ${missing.length} vendor(s): ${missing.map(w => w.vendor).join(', ')}.` });
    if (pending.length > 0) actions.push({ id: 'follow-up-pending', label: 'Follow up on pending', execute: () => `Sent follow-up reminders to ${pending.length} vendor(s).` });
    actions.push({ id: 'export-waivers', label: 'Export waiver report', execute: () => 'Exported lien waiver compliance report.' });
    return actions;
  },
  buildContext(s) {
    const waivers = s.apLienWaivers ?? [];
    if (!waivers.length) return 'No lien waiver records.';
    const lines = waivers.map(w => `  ${w.vendor} (${w.project}): ${w.waiverType}, period ${w.periodEnd}, ${fmtCurrency(w.amount)}, status: ${w.status}, due: ${w.dueDate}`);
    return `Lien waivers (${waivers.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const waivers = s.apLienWaivers ?? [];
    if (kw(q, 'missing', 'block', 'hold', 'stop')) {
      const missing = waivers.filter(w => w.status === 'missing');
      return missing.length ? `${missing.length} missing waiver(s) blocking payment:\n${missing.map(w => `- **${w.vendor}** (${w.project}): ${fmtCurrency(w.amount)} blocked, due ${w.dueDate}`).join('\n')}` : 'No missing waivers.';
    }
    if (kw(q, 'pending', 'waiting', 'follow up')) {
      const pending = waivers.filter(w => w.status === 'pending');
      return pending.length ? `${pending.length} waiver(s) pending receipt:\n${pending.map(w => `- **${w.vendor}** (${w.project}): ${w.waiverType}, due ${w.dueDate}`).join('\n')}` : 'No pending waivers.';
    }
    if (kw(q, 'project', 'compliance')) {
      const byProject = new Map<string, { missing: number; pending: number; received: number }>();
      for (const w of waivers) {
        const p = byProject.get(w.project) ?? { missing: 0, pending: 0, received: 0 };
        p[w.status as 'missing' | 'pending' | 'received']++;
        byProject.set(w.project, p);
      }
      return `Waiver status by project:\n${[...byProject.entries()].map(([proj, d]) => `- **${proj}**: ${d.received} received, ${d.pending} pending, ${d.missing} missing`).join('\n')}`;
    }
    const missing = waivers.filter(w => w.status === 'missing').length;
    const pending = waivers.filter(w => w.status === 'pending').length;
    const received = waivers.filter(w => w.status === 'received').length;
    return `Lien waivers: ${received} received, ${pending} pending, ${missing} missing. Ask about compliance, blocked payments, or specific vendors.`;
  },
};

export const homeRetentionAgent: WidgetAgent = {
  id: 'homeRetention',
  name: 'Retention Summary',
  systemPrompt: 'You manage retention tracking across construction projects. Answer about retention held, released, and pending release amounts.',
  suggestions(s) {
    const records = s.apRetention ?? [];
    const pendingRelease = records.filter(r => r.pendingRelease > 0);
    const totalHeld = records.reduce((sum, r) => sum + r.retentionHeld, 0);
    if (pendingRelease.length > 0) return [`${pendingRelease.length} pending retention release${pendingRelease.length === 1 ? '' : 's'}`, 'How much retention are we holding?', 'Show retention by project'];
    return [`${fmtCurrency(totalHeld)} total retention held`, 'Which projects have pending releases?', 'Show retention by vendor'];
  },
  insight(s) {
    const records = s.apRetention ?? [];
    const pendingRelease = records.filter(r => r.pendingRelease > 0);
    if (pendingRelease.length > 0) {
      const amount = pendingRelease.reduce((sum, r) => sum + r.pendingRelease, 0);
      return `${fmtCurrency(amount)} pending release across ${pendingRelease.length} record${pendingRelease.length === 1 ? '' : 's'}`;
    }
    const totalHeld = records.reduce((sum, r) => sum + r.retentionHeld, 0);
    if (totalHeld > 0) return `${fmtCurrency(totalHeld)} retention held across ${records.length} contract${records.length === 1 ? '' : 's'}`;
    return null;
  },
  alerts(s) {
    const records = s.apRetention ?? [];
    const pendingRelease = records.filter(r => r.pendingRelease > 0).length;
    if (pendingRelease > 0) return { level: 'info' as const, count: pendingRelease, label: 'pending release' };
    return null;
  },
  actions(s) {
    const records = s.apRetention ?? [];
    const pendingRelease = records.filter(r => r.pendingRelease > 0);
    const actions: AgentAction[] = [];
    if (pendingRelease.length > 0) actions.push({ id: 'process-releases', label: 'Process pending releases', execute: () => `Initiated release for ${pendingRelease.length} retention record(s) totaling ${fmtCurrency(pendingRelease.reduce((sum, r) => sum + r.pendingRelease, 0))}.` });
    actions.push({ id: 'export-retention', label: 'Export retention report', execute: () => 'Exported retention summary report.' });
    return actions;
  },
  buildContext(s) {
    const records = s.apRetention ?? [];
    if (!records.length) return 'No retention records.';
    const lines = records.map(r => `  ${r.vendor} (${r.project}): contract ${fmtCurrency(r.contractValue)}, ${r.retentionRate}% rate, held ${fmtCurrency(r.retentionHeld)}, released ${fmtCurrency(r.retentionReleased)}, pending ${fmtCurrency(r.pendingRelease)}`);
    return `Retention records (${records.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const records = s.apRetention ?? [];
    if (kw(q, 'how much', 'total', 'holding', 'held')) {
      const totalHeld = records.reduce((sum, r) => sum + r.retentionHeld, 0);
      const totalReleased = records.reduce((sum, r) => sum + r.retentionReleased, 0);
      return `Total retention held: ${fmtCurrency(totalHeld)}. Total released to date: ${fmtCurrency(totalReleased)}.`;
    }
    if (kw(q, 'pending', 'release', 'ready')) {
      const pendingRelease = records.filter(r => r.pendingRelease > 0);
      return pendingRelease.length ? `Pending releases:\n${pendingRelease.map(r => `- **${r.vendor}** (${r.project}): ${fmtCurrency(r.pendingRelease)} ready for release`).join('\n')}` : 'No pending retention releases.';
    }
    if (kw(q, 'project')) {
      const byProject = new Map<string, number>();
      for (const r of records) byProject.set(r.project, (byProject.get(r.project) ?? 0) + r.retentionHeld);
      return `Retention by project:\n${[...byProject.entries()].map(([p, amt]) => `- **${p}**: ${fmtCurrency(amt)} held`).join('\n')}`;
    }
    if (kw(q, 'vendor')) {
      const byVendor = new Map<string, number>();
      for (const r of records) byVendor.set(r.vendor, (byVendor.get(r.vendor) ?? 0) + r.retentionHeld);
      return `Retention by vendor:\n${[...byVendor.entries()].map(([v, amt]) => `- **${v}**: ${fmtCurrency(amt)} held`).join('\n')}`;
    }
    const totalHeld = records.reduce((sum, r) => sum + r.retentionHeld, 0);
    return `Tracking ${fmtCurrency(totalHeld)} in retention across ${records.length} contracts. Ask about totals, pending releases, or breakdowns by project or vendor.`;
  },
};

export const homeApActivity: WidgetAgent = {
  id: 'homeApActivity',
  name: 'AP Activity',
  systemPrompt: 'You provide a real-time feed of AP transactions -- payments, approvals, receipts, and vendor updates for a construction company.',
  suggestions(s) {
    const acts = s.apActivities ?? [];
    const holds = acts.filter(a => a.activityType === 'hold').length;
    const payments = acts.filter(a => a.activityType === 'payment').length;
    if (holds > 0) return [`${holds} invoice(s) placed on hold recently`, 'Show recent payment disbursements', 'What AP activity happened today?'];
    if (payments > 0) return [`${payments} recent payment${payments === 1 ? '' : 's'} disbursed`, 'Were any invoices placed on hold?', 'Show recent approvals'];
    return ['What AP activity happened today?', 'Were any invoices placed on hold?', 'Show recent payment disbursements'];
  },
  insight(s) {
    const acts = s.apActivities ?? [];
    const holds = acts.filter(a => a.activityType === 'hold');
    if (holds.length > 0) return `${holds.length} invoice${holds.length === 1 ? '' : 's'} placed on hold recently`;
    const payments = acts.filter(a => a.activityType === 'payment');
    if (payments.length > 0) {
      const totalPaid = payments.reduce((sum, a) => sum + a.amount, 0);
      return `${fmtCurrency(totalPaid)} disbursed in ${payments.length} recent payment${payments.length === 1 ? '' : 's'}`;
    }
    if (acts.length > 0) return `${acts.length} recent AP transaction${acts.length === 1 ? '' : 's'}`;
    return null;
  },
  alerts(s) {
    const acts = s.apActivities ?? [];
    const holds = acts.filter(a => a.activityType === 'hold').length;
    if (holds > 0) return { level: 'warning' as const, count: holds, label: 'invoices held' };
    return null;
  },
  actions: () => [
    { id: 'export-activity', label: 'Export activity log', execute: () => 'Exported AP activity log to CSV.' },
    { id: 'refresh-feed', label: 'Refresh activity feed', execute: () => 'Refreshed AP activity feed.' },
  ],
  buildContext(s) {
    const acts = s.apActivities ?? [];
    if (!acts.length) return 'No recent AP activity.';
    const lines = acts.map(a => `  [${a.activityType}] ${a.description} -- ${a.vendor}, ${a.amount > 0 ? fmtCurrency(a.amount) : ''}, ${a.timestamp}${a.project ? ', ' + a.project : ''}`);
    return `Recent AP activity (${acts.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const acts = s.apActivities ?? [];
    if (kw(q, 'hold', 'dispute', 'blocked')) {
      const holds = acts.filter(a => a.activityType === 'hold');
      return holds.length ? `Recent holds:\n${holds.map(a => `- ${a.description} (${a.vendor}, ${fmtCurrency(a.amount)})`).join('\n')}` : 'No invoices placed on hold recently.';
    }
    if (kw(q, 'payment', 'paid', 'disbursed', 'check', 'ach')) {
      const payments = acts.filter(a => a.activityType === 'payment');
      return payments.length ? `Recent payments:\n${payments.map(a => `- ${a.description} -- ${fmtCurrency(a.amount)} (${a.timestamp})`).join('\n')}` : 'No recent payments.';
    }
    if (kw(q, 'approval', 'approved')) {
      const approvals = acts.filter(a => a.activityType === 'approval');
      return approvals.length ? `Recent approvals:\n${approvals.map(a => `- ${a.description} (${a.timestamp})`).join('\n')}` : 'No recent approvals.';
    }
    if (kw(q, 'today', 'recent', 'latest')) {
      return acts.slice(0, 5).map(a => `- [${a.activityType}] ${a.description} (${a.timestamp})`).join('\n');
    }
    const typeCount = new Map<string, number>();
    for (const a of acts) typeCount.set(a.activityType, (typeCount.get(a.activityType) ?? 0) + 1);
    return `Recent activity: ${[...typeCount.entries()].map(([t, c]) => `${c} ${t}(s)`).join(', ')}. Ask about payments, approvals, holds, or recent events.`;
  },
};

export const homeCashOutflow: WidgetAgent = {
  id: 'homeCashOutflow',
  name: 'Cash Outflow',
  systemPrompt: 'You forecast cash outflow for a construction AP department. Help with weekly projections, vendor payment groupings, and budget impact analysis.',
  suggestions(s) {
    const sched = s.apPaymentSchedule ?? [];
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    if (total > 0) return [`${fmtCurrency(total)} total outflow scheduled`, 'How does this week compare to next week?', 'Which vendors have the largest payments?'];
    return ['What is this week\'s projected outflow?', 'How does next week compare?', 'Which vendors have the largest upcoming payments?'];
  },
  insight(s) {
    const sched = s.apPaymentSchedule ?? [];
    if (!sched.length) return null;
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    const largest = [...sched].sort((a, b) => b.amount - a.amount)[0];
    if (largest && largest.amount > total * 0.3) return `${fmtCurrency(total)} outflow -- ${largest.vendor} is ${Math.round(largest.amount / total * 100)}%`;
    return `${fmtCurrency(total)} projected outflow across ${sched.length} payment${sched.length === 1 ? '' : 's'}`;
  },
  alerts(s) {
    const sched = s.apPaymentSchedule ?? [];
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    if (total > 300_000) return { level: 'warning' as const, count: sched.length, label: 'high outflow period' };
    return null;
  },
  actions: () => [
    { id: 'forecast-report', label: 'Generate cash forecast', execute: () => 'Generated cash outflow forecast for the next 30 days.' },
    { id: 'export-outflow', label: 'Export outflow report', execute: () => 'Exported cash outflow breakdown to PDF.' },
  ],
  buildContext(s) {
    const sched = s.apPaymentSchedule ?? [];
    if (!sched.length) return 'No scheduled payments for outflow projection.';
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    const lines = sched.map(p => `  ${p.vendor}: ${fmtCurrency(p.amount)} due ${p.dueDate} (${p.project})`);
    return `Cash outflow projection (${fmtCurrency(total)} total):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const sched = s.apPaymentSchedule ?? [];
    if (kw(q, 'this week', 'projected', 'total', 'outflow')) {
      const total = sched.reduce((sum, p) => sum + p.amount, 0);
      return `Projected outflow: ${fmtCurrency(total)} across ${sched.length} scheduled payment(s).`;
    }
    if (kw(q, 'compare', 'next week', 'trend')) {
      const total = sched.reduce((sum, p) => sum + p.amount, 0);
      return `Current scheduled outflow is ${fmtCurrency(total)}. Week-over-week comparison requires historical data -- this is the upcoming payment window.`;
    }
    if (kw(q, 'largest', 'biggest', 'vendor', 'who')) {
      const sorted = [...sched].sort((a, b) => b.amount - a.amount);
      return `Largest upcoming payments:\n${sorted.slice(0, 5).map(p => `- **${p.vendor}**: ${fmtCurrency(p.amount)} due ${p.dueDate}`).join('\n')}`;
    }
    const total = sched.reduce((sum, p) => sum + p.amount, 0);
    return `Cash outflow: ${fmtCurrency(total)} across ${sched.length} payments. Ask about projections, comparisons, or vendor breakdowns.`;
  },
};

// ---------------------------------------------------------------------------
// PM Home Widgets (Bert/Frank) -- new cross-project widgets
// ---------------------------------------------------------------------------

export const homeMilestonesAgent: WidgetAgent = {
  id: 'homeMilestones',
  name: 'Cross-Project Milestones',
  systemPrompt: 'You track milestones across all active construction projects. You help PMs understand upcoming deadlines, overdue milestones, and completion rates.',
  suggestions(s) {
    const ms = s.milestones ?? [];
    const overdue = ms.filter(m => m.status === 'overdue');
    if (overdue.length) return [`${overdue.length} overdue milestone(s)`, 'Show upcoming milestones', 'Which projects are behind schedule?'];
    const upcoming = ms.filter(m => m.status === 'upcoming' || m.status === 'in-progress');
    return [`${upcoming.length} upcoming milestones`, 'Show milestone completion rate', 'Are any milestones at risk?'];
  },
  insight(s) {
    const ms = s.milestones ?? [];
    const overdue = ms.filter(m => m.status === 'overdue').length;
    if (overdue) return `${overdue} milestone(s) overdue across portfolio`;
    const inProg = ms.filter(m => m.status === 'in-progress').length;
    if (inProg) return `${inProg} milestone(s) in progress`;
    return null;
  },
  alerts(s) {
    const overdue = (s.milestones ?? []).filter(m => m.status === 'overdue').length;
    return overdue ? { level: 'warning' as const, count: overdue, label: 'overdue' } : null;
  },
  actions: () => [
    { id: 'escalate-overdue', label: 'Escalate overdue milestones', execute: (st) => { const n = (st.milestones ?? []).filter(m => m.status === 'overdue').length; return n ? `Escalated ${n} overdue milestone(s).` : 'No overdue milestones.'; } },
    { id: 'export-milestones', label: 'Export milestone report', execute: () => 'Exported cross-project milestone report.' },
  ],
  buildContext(s) {
    const ms = s.milestones ?? [];
    if (!ms.length) return 'No milestones.';
    const lines = ms.map(m => `  ${m.name}: due ${m.dueDate}, status: ${m.status}, progress: ${m.progress}%`);
    return `Cross-project milestones (${ms.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const ms = s.milestones ?? [];
    if (kw(q, 'overdue', 'late', 'behind')) {
      const overdue = ms.filter(m => m.status === 'overdue');
      return overdue.length ? `${overdue.length} overdue: ${overdue.map(m => m.name).join(', ')}` : 'No overdue milestones.';
    }
    if (kw(q, 'upcoming', 'next', 'soon', 'coming')) {
      const upcoming = ms.filter(m => m.status === 'upcoming' || m.status === 'in-progress').slice(0, 8);
      return upcoming.length ? upcoming.map(m => `- **${m.name}**: ${m.dueDate} (${m.progress}%)`).join('\n') : 'No upcoming milestones.';
    }
    if (kw(q, 'completion', 'rate', 'progress')) {
      const completed = ms.filter(m => m.status === 'completed').length;
      return `${completed} of ${ms.length} milestones completed (${ms.length ? Math.round(completed / ms.length * 100) : 0}%).`;
    }
    return `Tracking ${ms.length} milestones across the portfolio. Ask about overdue, upcoming, or completion rates.`;
  },
};

export const homeBudgetVarianceAgent: WidgetAgent = {
  id: 'homeBudgetVariance',
  name: 'Budget Variance',
  systemPrompt: 'You track budget utilization across all active construction projects. You help PMs understand budget health, overruns, and portfolio spend.',
  suggestions(s) {
    const projects = s.projects ?? [];
    const over85 = projects.filter(p => p.budgetPct > 85);
    if (over85.length) return [`${over85.length} project(s) over 85% budget`, 'Show budget breakdown', 'What is total portfolio spend?'];
    return ['Which projects are highest on budget?', 'Show budget utilization summary', 'What is total portfolio spend?'];
  },
  insight(s) {
    const projects = s.projects ?? [];
    const over90 = projects.filter(p => p.budgetPct > 90).length;
    if (over90) return `${over90} project(s) over 90% budget`;
    const over75 = projects.filter(p => p.budgetPct > 75).length;
    if (over75) return `${over75} project(s) past 75% budget`;
    if (projects.length) {
      const avg = Math.round(projects.reduce((s, p) => s + p.budgetPct, 0) / projects.length);
      return `Avg ${avg}% budget utilization`;
    }
    return null;
  },
  alerts(s) {
    const over90 = (s.projects ?? []).filter(p => p.budgetPct > 90).length;
    if (over90) return { level: 'critical' as const, count: over90, label: 'over 90% budget' };
    const over85 = (s.projects ?? []).filter(p => p.budgetPct > 85).length;
    if (over85) return { level: 'warning' as const, count: over85, label: 'over 85% budget' };
    return null;
  },
  actions: (s) => {
    const actions: AgentAction[] = [];
    if (s.personaSlug !== 'bert') {
      actions.push({ id: 'open-financials', label: 'Open Financials', execute: () => 'Opening Financials.', route: '/financials' });
    }
    actions.push({ id: 'export-budget', label: 'Export budget report', execute: () => 'Exported portfolio budget variance report.' });
    return actions;
  },
  buildContext(s) {
    const projects = s.projects ?? [];
    if (!projects.length) return 'No projects.';
    const lines = projects.map(p => `  ${p.name}: ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%)`);
    return `Budget variance (${projects.length} projects):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const projects = s.projects ?? [];
    if (kw(q, 'over budget', 'over 90', 'overrun', 'highest')) {
      const high = [...projects].sort((a, b) => b.budgetPct - a.budgetPct).slice(0, 5);
      return high.map(p => `- **${p.name}**: ${p.budgetPct}% (${p.budgetUsed}/${p.budgetTotal})`).join('\n');
    }
    if (kw(q, 'total', 'portfolio', 'spend')) {
      return `Portfolio: ${projects.length} projects. Avg ${Math.round(projects.reduce((s, p) => s + p.budgetPct, 0) / (projects.length || 1))}% budget utilization.`;
    }
    return `Tracking budgets for ${projects.length} projects. Ask about overruns, totals, or specific projects.`;
  },
};

export const homeChangeOrdersAgent: WidgetAgent = {
  id: 'homeChangeOrders',
  name: 'Change Orders',
  systemPrompt: 'You track change orders across all active construction projects. You help PMs understand pending COs, approval status, and financial impact.',
  suggestions(s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(c => c.status === 'pending');
    if (pending.length) return [`${pending.length} pending CO(s) totaling ${fmtCurrency(pending.reduce((s, c) => s + c.amount, 0))}`, 'Which projects have the most COs?', 'Show approved CO value'];
    return ['How many change orders are pending?', 'What is the total approved CO value?', 'Show CO breakdown by project'];
  },
  insight(s) {
    const cos = s.changeOrders ?? [];
    const pending = cos.filter(c => c.status === 'pending');
    if (pending.length) return `${pending.length} pending CO(s) worth ${fmtCurrency(pending.reduce((s, c) => s + c.amount, 0))}`;
    return null;
  },
  alerts(s) {
    const pending = (s.changeOrders ?? []).filter(c => c.status === 'pending').length;
    return pending >= 3 ? { level: 'warning' as const, count: pending, label: 'pending COs' } : null;
  },
  actions: (s) => {
    const actions: AgentAction[] = [];
    if (s.personaSlug !== 'bert') {
      actions.push({ id: 'open-financials', label: 'Open Financials', execute: () => 'Opening Financials.', route: '/financials' });
    }
    actions.push({ id: 'export-cos', label: 'Export CO report', execute: () => 'Exported change order report.' });
    return actions;
  },
  buildContext(s) {
    const cos = s.changeOrders ?? [];
    if (!cos.length) return 'No change orders.';
    const lines = cos.map(c => `  ${c.id}: ${c.project}, ${c.description}, ${fmtCurrency(c.amount)}, status: ${c.status}`);
    return `Change orders (${cos.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const cos = s.changeOrders ?? [];
    if (kw(q, 'pending', 'how many', 'count')) {
      const pending = cos.filter(c => c.status === 'pending');
      return pending.length ? `${pending.length} pending CO(s):\n${pending.map(c => `- **${c.project}**: ${c.description} (${fmtCurrency(c.amount)})`).join('\n')}` : 'No pending change orders.';
    }
    if (kw(q, 'approved', 'value', 'total')) {
      const approved = cos.filter(c => c.status === 'approved');
      return `${approved.length} approved CO(s) totaling ${fmtCurrency(approved.reduce((s, c) => s + c.amount, 0))}.`;
    }
    if (kw(q, 'project', 'which')) {
      const byProj = new Map<string, number>();
      for (const c of cos) byProj.set(c.project, (byProj.get(c.project) ?? 0) + 1);
      return [...byProj.entries()].map(([p, n]) => `**${p}**: ${n} CO(s)`).join('\n');
    }
    return `Tracking ${cos.length} change orders. ${cos.filter(c => c.status === 'pending').length} pending, ${cos.filter(c => c.status === 'approved').length} approved.`;
  },
};

export const homeFieldOpsAgent: WidgetAgent = {
  id: 'homeFieldOps',
  name: 'Field Operations',
  systemPrompt: 'You track inspections and punch list items across all active construction projects. You help PMs understand quality metrics, failed inspections, and outstanding punch items.',
  suggestions(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    const openPunch = (s.punchListItems ?? []).filter(p => p.status === 'open').length;
    if (failed) return [`${failed} failed inspection(s)`, `${openPunch} open punch items`, 'Which projects have quality issues?'];
    return ['Show inspection results', 'How many punch items are open?', 'Which projects have the most issues?'];
  },
  insight(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    const openPunch = (s.punchListItems ?? []).filter(p => p.status === 'open').length;
    if (failed) return `${failed} failed inspection(s), ${openPunch} open punch items`;
    if (openPunch) return `${openPunch} open punch item(s) across portfolio`;
    return null;
  },
  alerts(s) {
    const failed = (s.inspections ?? []).filter(i => i.result === 'fail').length;
    if (failed >= 2) return { level: 'critical' as const, count: failed, label: 'failed inspections' };
    if (failed) return { level: 'warning' as const, count: failed, label: 'failed inspection' };
    return null;
  },
  actions: () => [
    { id: 'export-field', label: 'Export field ops report', execute: () => 'Exported field operations report.' },
    { id: 'escalate-failures', label: 'Escalate failed inspections', execute: (st) => { const n = (st.inspections ?? []).filter(i => i.result === 'fail').length; return n ? `Escalated ${n} failed inspection(s).` : 'No failures.'; } },
  ],
  buildContext(s) {
    const insp = s.inspections ?? [];
    const punch = s.punchListItems ?? [];
    const inspLines = insp.map(i => `  ${i.project}: ${i.type}, result: ${i.result}, date: ${i.date}`);
    const punchLines = punch.filter(p => p.status !== 'verified').map(p => `  ${p.project}: ${p.description}, status: ${p.status}, priority: ${p.priority}`);
    return `Inspections (${insp.length}):\n${inspLines.join('\n')}\n\nPunch list (${punch.length} total, ${punch.filter(p => p.status === 'open').length} open):\n${punchLines.join('\n')}`;
  },
  localRespond(q, s) {
    const insp = s.inspections ?? [];
    const punch = s.punchListItems ?? [];
    if (kw(q, 'fail', 'failed', 'failure')) {
      const failed = insp.filter(i => i.result === 'fail');
      return failed.length ? `${failed.length} failed:\n${failed.map(i => `- **${i.project}**: ${i.type} (${i.date}) -- ${i.notes}`).join('\n')}` : 'No failed inspections.';
    }
    if (kw(q, 'punch', 'open', 'outstanding')) {
      const open = punch.filter(p => p.status === 'open' || p.status === 'in-progress');
      return open.length ? `${open.length} open/in-progress:\n${open.map(p => `- **${p.project}**: ${p.description} (${p.priority})`).join('\n')}` : 'No open punch items.';
    }
    if (kw(q, 'project', 'quality', 'which')) {
      const byProj = new Map<string, { failed: number; openPunch: number }>();
      for (const i of insp.filter(x => x.result === 'fail')) { const e = byProj.get(i.project) ?? { failed: 0, openPunch: 0 }; e.failed++; byProj.set(i.project, e); }
      for (const p of punch.filter(x => x.status === 'open')) { const e = byProj.get(p.project) ?? { failed: 0, openPunch: 0 }; e.openPunch++; byProj.set(p.project, e); }
      return [...byProj.entries()].map(([p, d]) => `**${p}**: ${d.failed} failed inspections, ${d.openPunch} open punch items`).join('\n');
    }
    return `Inspections: ${insp.filter(i => i.result === 'pass').length} passed, ${insp.filter(i => i.result === 'fail').length} failed. Punch list: ${punch.filter(p => p.status === 'open').length} open. Ask about failures, punch items, or project quality.`;
  },
};

export const homeDailyReportsAgent: WidgetAgent = {
  id: 'homeDailyReports',
  name: 'Daily Reports',
  systemPrompt: 'You analyze daily construction reports across all active projects. You help PMs track crew activity, safety incidents, and field operations.',
  suggestions(s) {
    const reports = s.dailyReports ?? [];
    const safety = reports.filter(r => r.safetyIncidents > 0).length;
    if (safety) return [`${safety} report(s) with safety incidents`, 'Show latest daily reports', 'What is total crew count today?'];
    return ['Show latest daily reports', 'What is total crew count today?', 'Any issues reported?'];
  },
  insight(s) {
    const reports = s.dailyReports ?? [];
    const safety = reports.reduce((sum, r) => sum + r.safetyIncidents, 0);
    if (safety) return `${safety} safety incident(s) reported`;
    const totalCrew = reports.reduce((sum, r) => sum + r.crewCount, 0);
    if (totalCrew) return `${totalCrew} total crew across ${reports.length} reports`;
    return null;
  },
  alerts(s) {
    const safety = (s.dailyReports ?? []).filter(r => r.safetyIncidents > 0).length;
    return safety ? { level: 'critical' as const, count: safety, label: 'safety incidents' } : null;
  },
  actions: () => [
    { id: 'export-reports', label: 'Export daily reports', execute: () => 'Exported daily reports summary.' },
  ],
  buildContext(s) {
    const reports = s.dailyReports ?? [];
    if (!reports.length) return 'No daily reports.';
    const lines = reports.map(r => `  ${r.project} (${r.date}): crew ${r.crewCount}, ${r.hoursWorked}h, safety: ${r.safetyIncidents}, work: ${r.workPerformed}`);
    return `Daily reports (${reports.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const reports = s.dailyReports ?? [];
    if (kw(q, 'safety', 'incident', 'accident')) {
      const withIncidents = reports.filter(r => r.safetyIncidents > 0);
      return withIncidents.length ? `${withIncidents.length} report(s) with safety incidents:\n${withIncidents.map(r => `- **${r.project}** (${r.date}): ${r.safetyIncidents} incident(s)`).join('\n')}` : 'No safety incidents reported.';
    }
    if (kw(q, 'crew', 'count', 'headcount', 'total')) {
      const totalCrew = reports.reduce((sum, r) => sum + r.crewCount, 0);
      return `Total crew across all reports: ${totalCrew} workers, ${reports.reduce((sum, r) => sum + r.hoursWorked, 0)} hours worked.`;
    }
    if (kw(q, 'issue', 'problem')) {
      const withIssues = reports.filter(r => r.issues && r.issues !== 'None');
      return withIssues.length ? withIssues.map(r => `- **${r.project}**: ${r.issues}`).join('\n') : 'No issues reported.';
    }
    return `${reports.length} daily reports. ${reports.reduce((sum, r) => sum + r.crewCount, 0)} total crew, ${reports.reduce((sum, r) => sum + r.safetyIncidents, 0)} safety incidents.`;
  },
};

export const homeTeamAllocationAgent: WidgetAgent = {
  id: 'homeTeamAllocation',
  name: 'Team Allocation',
  systemPrompt: 'You analyze team allocation and resource distribution across all active construction projects. You help PMs identify overallocated team members, staffing gaps, and capacity issues.',
  suggestions(s) {
    const team = s.team ?? [];
    const lowAvail = team.filter(m => m.availability < 30).length;
    if (lowAvail) return [`${lowAvail} team member(s) with low availability`, 'Who is on multiple projects?', 'Show team by project'];
    return ['Who is assigned to the most projects?', 'Show team availability', 'Are there any staffing gaps?'];
  },
  insight(s) {
    const team = s.team ?? [];
    const lowAvail = team.filter(m => m.availability < 30).length;
    if (lowAvail) return `${lowAvail} team member(s) below 30% availability`;
    if (team.length) return `${team.length} team members across portfolio`;
    return null;
  },
  alerts(s) {
    const lowAvail = (s.team ?? []).filter(m => m.availability < 30).length;
    return lowAvail ? { level: 'warning' as const, count: lowAvail, label: 'low availability' } : null;
  },
  actions: () => [
    { id: 'export-allocation', label: 'Export team allocation report', execute: () => 'Exported team allocation report.' },
  ],
  buildContext(s) {
    const team = s.team ?? [];
    if (!team.length) return 'No team data.';
    const lines = team.map(m => `  ${m.name} (${m.role}): ${m.tasksCompleted}/${m.tasksTotal} tasks, ${m.availability}% available`);
    return `Team allocation (${team.length} members):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const team = s.team ?? [];
    if (kw(q, 'overallocated', 'overloaded', 'busy', 'low')) {
      const low = team.filter(m => m.availability < 30);
      return low.length ? `${low.length} with low availability:\n${low.map(m => `- **${m.name}** (${m.role}): ${m.availability}% available`).join('\n')}` : 'No team members below 30% availability.';
    }
    if (kw(q, 'availability', 'capacity')) {
      const avg = team.length ? Math.round(team.reduce((s, m) => s + m.availability, 0) / team.length) : 0;
      return `Average team availability: ${avg}%. ${team.filter(m => m.availability >= 60).length} members with good capacity (60%+).`;
    }
    return `${team.length} team members tracked. Ask about availability, overallocation, or specific people.`;
  },
};

export const homeContractsAgent: WidgetAgent = {
  id: 'homeContracts',
  name: 'Contract Status',
  systemPrompt: 'You track contracts across all active construction projects. You help PMs understand contract status, pending approvals, expiring contracts, and total committed value.',
  suggestions(s) {
    const contracts = s.contracts ?? [];
    const pending = contracts.filter(c => c.status === 'pending').length;
    if (pending) return [`${pending} contract(s) pending approval`, 'What is total contract value?', 'Show contracts expiring soon'];
    return ['How many contracts are active?', 'What is total contract value?', 'Are any contracts expiring soon?'];
  },
  insight(s) {
    const contracts = s.contracts ?? [];
    const pending = contracts.filter(c => c.status === 'pending').length;
    if (pending) return `${pending} contract(s) awaiting approval`;
    const active = contracts.filter(c => c.status === 'active').length;
    if (active) return `${active} active contract(s)`;
    return null;
  },
  alerts(s) {
    const pending = (s.contracts ?? []).filter(c => c.status === 'pending').length;
    return pending ? { level: 'warning' as const, count: pending, label: 'pending approval' } : null;
  },
  actions: (s) => {
    const actions: AgentAction[] = [];
    if (s.personaSlug !== 'bert') {
      actions.push({ id: 'open-financials', label: 'Open Financials', execute: () => 'Opening Financials.', route: '/financials' });
    }
    actions.push({ id: 'export-contracts', label: 'Export contract report', execute: () => 'Exported contract status report.' });
    return actions;
  },
  buildContext(s) {
    const contracts = s.contracts ?? [];
    if (!contracts.length) return 'No contracts.';
    const lines = contracts.map(c => `  ${c.title}: ${c.vendor}, ${c.project}, value: ${fmtCurrency(c.revisedValue)}, status: ${c.status}, ends: ${c.endDate}`);
    return `Contracts (${contracts.length}):\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const contracts = s.contracts ?? [];
    if (kw(q, 'pending', 'approval', 'waiting')) {
      const pending = contracts.filter(c => c.status === 'pending');
      return pending.length ? `${pending.length} pending:\n${pending.map(c => `- **${c.title}** (${c.vendor}): ${fmtCurrency(c.revisedValue)}`).join('\n')}` : 'No pending contracts.';
    }
    if (kw(q, 'expiring', 'soon', 'ending')) {
      const sorted = [...contracts].filter(c => c.status === 'active').sort((a, b) => a.endDate.localeCompare(b.endDate));
      return sorted.slice(0, 5).map(c => `- **${c.title}**: ends ${c.endDate}`).join('\n');
    }
    if (kw(q, 'active', 'how many', 'count')) {
      const active = contracts.filter(c => c.status === 'active');
      return `${active.length} active contract(s) totaling ${fmtCurrency(active.reduce((s, c) => s + c.revisedValue, 0))}.`;
    }
    if (kw(q, 'total', 'value', 'committed')) {
      const total = contracts.filter(c => c.status !== 'closed').reduce((s, c) => s + c.revisedValue, 0);
      return `Total committed contract value: ${fmtCurrency(total)} across ${contracts.length} contracts.`;
    }
    return `Tracking ${contracts.length} contracts. ${contracts.filter(c => c.status === 'active').length} active, ${contracts.filter(c => c.status === 'pending').length} pending.`;
  },
};

export const homeLearningAgent: WidgetAgent = {
  id: 'homeLearning',
  name: 'Learning Progress',
  systemPrompt: 'You are a learning advisor helping Kelly track her progress toward becoming a comptroller. You understand her accounting coursework on Trimble Learn and can suggest next steps, estimate completion timelines, and recommend study strategies.',
  suggestions(s) {
    const plan = s.learningPlan;
    if (!plan) return ['What courses are available?', 'How do I start the comptroller track?'];
    const inProgress = plan.courses.filter(c => c.status === 'in-progress');
    const remaining = plan.courses.filter(c => c.status === 'not-started');
    const pct = Math.round((plan.completedCourses / plan.totalCourses) * 100);
    if (inProgress.length) return [`Continue "${inProgress[0].title}" (${Math.round((inProgress[0].completedMinutes / inProgress[0].durationMinutes) * 100)}% done)`, `${pct}% through the comptroller track`, 'What should I focus on next?'];
    if (remaining.length) return [`Start "${remaining[0].title}"`, `${plan.completedCourses} of ${plan.totalCourses} courses completed`, 'How many hours remain?'];
    return ['You completed all courses!', 'Show my learning summary'];
  },
  insight(s) {
    const plan = s.learningPlan;
    if (!plan) return null;
    const inProgress = plan.courses.filter(c => c.status === 'in-progress');
    if (inProgress.length) {
      const next = inProgress[0];
      return `${plan.completedCourses} of ${plan.totalCourses} completed -- "${next.title}" in progress`;
    }
    const remaining = plan.courses.filter(c => c.status === 'not-started');
    if (remaining.length) return `${plan.completedCourses} of ${plan.totalCourses} completed -- ready for "${remaining[0].title}"`;
    return `All ${plan.totalCourses} courses completed!`;
  },
  alerts(s) {
    const plan = s.learningPlan;
    if (!plan) return null;
    const stalled = plan.courses.filter(c => c.status === 'in-progress' && c.completedMinutes > 0 && c.completedMinutes < c.durationMinutes * 0.3);
    if (stalled.length) return { level: 'warning' as const, count: stalled.length, label: 'stalled course(s)' };
    return null;
  },
  actions: () => [
    { id: 'open-trimble-learn', label: 'Open Trimble Learn', execute: () => 'Opening learn.trimble.com in a new tab.' },
    { id: 'mark-complete', label: 'Mark current course complete', execute: (st) => {
      const plan = st.learningPlan;
      const ip = plan?.courses.filter(c => c.status === 'in-progress') ?? [];
      return ip.length ? `Marked "${ip[0].title}" as complete.` : 'No in-progress courses to complete.';
    }},
  ],
  buildContext(s) {
    const plan = s.learningPlan;
    if (!plan) return 'No learning plan available.';
    const lines = plan.courses.map(c => {
      const pct = c.durationMinutes ? Math.round((c.completedMinutes / c.durationMinutes) * 100) : 0;
      return `  ${c.title} [${c.category}]: ${c.status}, ${pct}% (${c.completedMinutes}/${c.durationMinutes} min)${c.completedDate ? `, done ${c.completedDate}` : ''}`;
    });
    const totalMin = plan.courses.reduce((sum, c) => sum + c.completedMinutes, 0);
    const remainMin = plan.courses.reduce((sum, c) => sum + (c.durationMinutes - c.completedMinutes), 0);
    return `Learning Plan: ${plan.name}\n${plan.description}\nProgress: ${plan.completedCourses}/${plan.totalCourses} courses, ${Math.round(totalMin / 60)}h logged, ${Math.round(remainMin / 60)}h remaining\n\nCourses:\n${lines.join('\n')}`;
  },
  localRespond(q, s) {
    const plan = s.learningPlan;
    if (!plan) return 'No learning plan data available.';
    const completed = plan.courses.filter(c => c.status === 'completed');
    const inProgress = plan.courses.filter(c => c.status === 'in-progress');
    const notStarted = plan.courses.filter(c => c.status === 'not-started');
    const totalMin = plan.courses.reduce((sum, c) => sum + c.completedMinutes, 0);
    const remainMin = plan.courses.reduce((sum, c) => sum + (c.durationMinutes - c.completedMinutes), 0);

    if (kw(q, 'next', 'recommend', 'should', 'focus')) {
      if (inProgress.length) return `Continue **${inProgress[0].title}** -- you're ${Math.round((inProgress[0].completedMinutes / inProgress[0].durationMinutes) * 100)}% through it. After that, ${notStarted.length ? `"${notStarted[0].title}" is next in the track.` : 'you\'ll have completed the full track!'}`;
      if (notStarted.length) return `Start **${notStarted[0].title}** (${notStarted[0].category}) -- estimated ${Math.round(notStarted[0].durationMinutes / 60)} hours.`;
      return 'You\'ve completed all courses in the comptroller track!';
    }
    if (kw(q, 'how close', 'progress', 'percent', 'status', 'completion')) {
      const pct = Math.round((plan.completedCourses / plan.totalCourses) * 100);
      return `You're **${pct}%** through the Comptroller Preparation Track:\n- ${completed.length} completed\n- ${inProgress.length} in progress\n- ${notStarted.length} not started\n\n${Math.round(totalMin / 60)} hours logged, ~${Math.round(remainMin / 60)} hours remaining.`;
    }
    if (kw(q, 'hours', 'time', 'logged', 'spent')) {
      return `You've logged **${Math.round(totalMin / 60)} hours** so far. Approximately **${Math.round(remainMin / 60)} hours** remain to complete the full track.`;
    }
    if (kw(q, 'completed', 'done', 'finished')) {
      if (!completed.length) return 'No courses completed yet.';
      return `Completed courses (${completed.length}):\n${completed.map(c => `- **${c.title}** (${c.category}) -- ${c.completedDate}`).join('\n')}`;
    }
    if (kw(q, 'remaining', 'left', 'not started')) {
      if (!notStarted.length) return 'All courses are either in progress or completed!';
      return `Remaining courses (${notStarted.length}):\n${notStarted.map(c => `- **${c.title}** (${c.category}) -- ~${Math.round(c.durationMinutes / 60)}h`).join('\n')}`;
    }
    return `Comptroller track: ${plan.completedCourses}/${plan.totalCourses} courses done (${Math.round((plan.completedCourses / plan.totalCourses) * 100)}%). ${Math.round(totalMin / 60)}h logged, ${Math.round(remainMin / 60)}h remaining.`;
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
  homeMilestonesAgent,
  homeBudgetVarianceAgent,
  homeChangeOrdersAgent,
  homeFieldOpsAgent,
  homeDailyReportsAgent,
  homeTeamAllocationAgent,
  homeContractsAgent,
];

export const KELLY_HOME_AGENTS: WidgetAgent[] = [
  homeApKpis,
  homeInvoiceQueue,
  homePaymentSchedule,
  homeCalendar,
  homeVendorAging,
  homePayAppsAgent,
  homeLienWaiversAgent,
  homeRetentionAgent,
  homeApActivity,
  homeCashOutflow,
  homeLearningAgent,
];

