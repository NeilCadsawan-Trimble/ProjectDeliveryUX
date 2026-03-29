import type { AgentAction, WidgetAgent } from './shared';
import { kw, fmtProjects } from './shared';
import { homeDefault } from './home-agents';

export const portfolioAgent: WidgetAgent = {
  id: 'portfolio',
  name: 'Portfolio Analysis',
  systemPrompt:
    'You are a cross-project portfolio analyst for construction delivery. Compare health, schedule, budget, RFIs, submittals, change orders, inspections, revenue, and field activity across all projects. Prioritize leadership focus and explain tradeoffs.',
  suggestions: [
    'Which project has the highest risk?',
    'Compare budgets across projects',
    'Where are the most overdue RFIs?',
    'Summarize portfolio change order exposure',
  ],
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
      const scored = projects
        .map(p => ({
          p,
          score: (p.status === 'Overdue' ? 3 : 0) + (p.status === 'At Risk' ? 2 : 0) + (p.budgetPct > 90 ? 2 : p.budgetPct > 80 ? 1 : 0),
        }))
        .sort((a, b) => b.score - a.score);
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

export const projectsWidget: WidgetAgent = {
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

export const openEstimates: WidgetAgent = {
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

export const recentActivity: WidgetAgent = {
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

export const needsAttention: WidgetAgent = {
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

export const projectsDefault: WidgetAgent = {
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

export const PORTFOLIO_AGENTS: WidgetAgent[] = [
  portfolioAgent,
  projectsWidget,
  openEstimates,
  recentActivity,
  needsAttention,
  projectsDefault,
];

