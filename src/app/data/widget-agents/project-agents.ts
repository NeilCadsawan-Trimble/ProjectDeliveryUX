import { buildUrgentNeeds } from '../dashboard-data';
import type { AgentAction, WidgetAgent } from './shared';
import { getSuggestions, kw } from './shared';
import { budgetAgent, changeOrdersAgent, contractsAgent, weatherAgent } from './financials-agents';
import { homeRfis, homeSubmittals } from './home-agents';

export const milestonesAgent: WidgetAgent = {
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
    const ms = s.milestones ?? [];
    const overdue = ms.filter(m => m.status === 'overdue');
    if (overdue.length) return `${overdue.length} overdue milestone${overdue.length === 1 ? '' : 's'}`;
    const completed = ms.filter(m => m.status === 'completed').length;
    if (ms.length) return `${completed} of ${ms.length} milestones completed`;
    return null;
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

export const tasksAgent: WidgetAgent = {
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
    if (!tasks.length) return null;
    const high = tasks.filter(t => t.priority === 'high').length;
    const overdue = tasks.filter(t => t.status.toLowerCase().includes('overdue') || t.status.toLowerCase().includes('delayed')).length;
    const parts: string[] = [];
    if (high) parts.push(`${high} high-priority`);
    if (overdue) parts.push(`${overdue} overdue`);
    if (parts.length) return parts.join(', ') + ` of ${tasks.length} tasks`;
    return `${s.openTaskCount ?? tasks.length} open of ${tasks.length} tasks`;
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

export const risksAgent: WidgetAgent = {
  id: 'risks',
  name: 'Risks & Urgent Needs',
  systemPrompt: 'You are a risk management specialist for construction projects. You assess risk severity, evaluate mitigation strategies, advise on risk response plans, and track urgent needs that require immediate attention.',
  suggestions(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []).filter(n => n.projectId === projId) : [];
    const high = (s.risks ?? []).filter(r => r.severity === 'high').length;
    const base = high
      ? ['Show high-severity risks', 'What are the biggest risks right now?', 'What risk mitigations are in place?']
      : ['What are the biggest risks right now?', 'Summarize open risks', 'What risk mitigations are in place?'];
    if (urgent.length) base.unshift('What urgent needs require action?');
    return base.slice(0, 5);
  },
  insight(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []).filter(n => n.projectId === projId) : [];
    const critical = urgent.filter(n => n.severity === 'critical').length;
    const risks = s.risks ?? [];
    const high = risks.filter(r => r.severity === 'high').length;
    const parts: string[] = [];
    if (critical) parts.push(`${critical} critical urgent need${critical === 1 ? '' : 's'}`);
    if (high) parts.push(`${high} high-severity risk${high === 1 ? '' : 's'}`);
    if (parts.length) return parts.join(', ');
    if (risks.length || urgent.length) return `${risks.length} risks, ${urgent.length} needs tracked`;
    return null;
  },
  alerts(s) {
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []).filter(n => n.projectId === projId) : [];
    const critical = urgent.filter(n => n.severity === 'critical').length;
    const high = (s.risks ?? []).filter(r => r.severity === 'high').length;
    const total = critical + high;
    if (critical) return { level: 'critical', count: total, label: `${critical} critical` };
    if (high) return { level: 'warning', count: total, label: 'high severity' };
    return null;
  },
  actions: (s) => [
    { id: 'risk-workshop', label: 'Schedule risk review', execute: () => 'Scheduled risk review workshop.' },
    { id: 'update-mitigations', label: 'Request mitigation updates', execute: () => 'Requested mitigation plan updates from owners.' },
    { id: 'escalate-urgent', label: 'Escalate urgent needs', execute: (st) => { const projId = st.projects?.[0]?.id; const n = projId ? buildUrgentNeeds(st.rfis ?? [], st.submittals ?? [], st.changeOrders ?? []).filter(i => i.projectId === projId && i.severity === 'critical').length : 0; return n ? `Escalated ${n} critical item(s).` : 'No critical items to escalate.'; } },
  ],
  buildContext(s) {
    const risks = s.risks ?? [];
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []).filter(n => n.projectId === projId) : [];
    const riskLines = risks.map(r => `  ${r.title}: severity ${r.severity}, impact: ${r.impact}, mitigation: ${r.mitigation}`);
    const urgentLines = urgent.map(u => `  [${u.severity.toUpperCase()}] ${u.title} -- ${u.subtitle} (${u.category})`);
    return `Project: ${s.projectName}\nRisks (${risks.length}):\n${riskLines.join('\n')}\nUrgent Needs (${urgent.length}):\n${urgentLines.join('\n')}`;
  },
  localRespond(q, s) {
    const risks = s.risks ?? [];
    const projId = s.projects?.[0]?.id;
    const urgent = projId ? buildUrgentNeeds(s.rfis ?? [], s.submittals ?? [], s.changeOrders ?? []).filter(n => n.projectId === projId) : [];

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

export const drawingAgent: WidgetAgent = {
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

export const teamAgent: WidgetAgent = {
  id: 'team',
  name: 'Team',
  systemPrompt:
    'You are a resource management specialist for construction projects. You track team allocation, availability, workload distribution, upcoming time off, and help identify staffing risks.',
  suggestions(s) {
    const pto = s.projectTimeOff ?? [];
    const pending = pto.filter(r => r.status === 'Pending').length;
    const conflicts = s.staffingConflicts ?? [];
    const critical = conflicts.filter(c => c.severity === 'critical').length;
    if (critical) return ['Show staffing conflicts from PTO', 'Who is assigned to this project?', 'Show team availability'];
    if (pending)
      return [
        `${pending} pending PTO request${pending === 1 ? '' : 's'} on this project`,
        'Who is assigned to this project?',
        'Show team availability',
      ];
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
      actions.unshift({
        id: 'escalate-staffing',
        label: 'Escalate staffing gaps to PMO',
        execute: () => {
          const crit = conflicts.filter(c => c.severity === 'critical');
          return `Escalated ${crit.length} critical staffing gap(s) to PMO: ${crit.map(c => `${c.week} (${c.absentees.join(', ')} out)`).join('; ')}`;
        },
      });
    }
    return actions;
  },
  buildContext(s) {
    const team = s.team ?? [];
    const pto = s.projectTimeOff ?? [];
    const conflicts = s.staffingConflicts ?? [];
    const teamLines = team.map(
      t => `  ${t.name} (${t.role}): ${t.tasksCompleted}/${t.tasksTotal} tasks, ${t.availability}% available`,
    );
    const ptoLines = pto.map(r => `  ${r.name}: ${r.type}, ${r.startDate}-${r.endDate} (${r.days}d), ${r.status}`);
    const conflictLines = conflicts.map(
      c => `  ${c.week}: ${c.absentCount}/${c.teamSize} out (${c.absentPct}%) [${c.severity}] -- ${c.absentees.join(', ')}`,
    );
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
      return low.length
        ? `${low.length} member(s) with low availability: ${low.map(t => `${t.name} (${t.availability}%)`).join(', ')}`
        : 'All team members have adequate availability.';
    }
    return `${team.length} team members on ${s.projectName}, ${pto.length} time-off requests. Ask about staffing conflicts, PTO, availability, or team roles.`;
  },
};

export const activityAgent: WidgetAgent = {
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

export const projectDefault: WidgetAgent = {
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
    const pct = s.budgetPct ?? 0;
    if (pct > 0) return `${s.projectStatus ?? 'Active'} -- budget ${pct}% utilized`;
    return s.projectStatus ? `Status: ${s.projectStatus}` : null;
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
export const recordsRfis: WidgetAgent = {
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
    return overdue ? { level: 'warning', count: overdue, label: 'overdue' } : null;
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
export const recordsSubmittals: WidgetAgent = {
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
    return overdue ? { level: 'warning', count: overdue, label: 'overdue' } : null;
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
export const drawingsPage: WidgetAgent = {
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

export const drawingDetail: WidgetAgent = {
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
export const rfiDetail: WidgetAgent = {
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

export const submittalDetail: WidgetAgent = {
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
export const dailyReportsAgent: WidgetAgent = {
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

export const inspectionsAgent: WidgetAgent = {
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

export const recordsDailyReports: WidgetAgent = {
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

export const recordsPunchItems: WidgetAgent = {
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

export const recordsInspections: WidgetAgent = {
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

export const recordsActionItems: WidgetAgent = {
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
export const dailyReportDetail: WidgetAgent = {
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
  buildContext(s) {
    const r = s.detailDailyReport;
    if (!r) return dailyReportsAgent.buildContext(s);
    return [
      `Daily report ${r.id} (${r.project})`,
      `  Date: ${r.date}`,
      `  Author: ${r.author}`,
      `  Crew: ${r.crewCount}`,
      `  Hours worked: ${r.hoursWorked}`,
      `  Weather: ${r.weather}`,
      `  Safety incidents: ${r.safetyIncidents}`,
      `  Work performed: ${r.workPerformed}`,
      `  Issues: ${r.issues || 'None'}`,
    ].join('\n');
  },
  localRespond(q, s) {
    const r = s.detailDailyReport;
    if (!r) return dailyReportsAgent.localRespond(q, s);
    if (kw(q, 'safety', 'incident', 'accident')) {
      return r.safetyIncidents > 0
        ? `${r.safetyIncidents} safety incident(s) logged on ${r.date} at ${r.project}.`
        : `No safety incidents on ${r.date} at ${r.project}.`;
    }
    if (kw(q, 'crew', 'hour', 'manpower')) return `Crew of ${r.crewCount} logged ${r.hoursWorked} hours on ${r.date}.`;
    if (kw(q, 'weather', 'rain', 'condition')) return `Weather on ${r.date}: ${r.weather}.`;
    if (kw(q, 'issue', 'problem', 'delay')) return r.issues ? `Issues: ${r.issues}` : 'No issues reported in this daily report.';
    if (kw(q, 'work', 'performed', 'summary', 'summarize', 'about')) {
      return `${r.date} at ${r.project}: ${r.workPerformed} (${r.crewCount} crew, ${r.hoursWorked}h, weather: ${r.weather}, incidents: ${r.safetyIncidents}).`;
    }
    if (kw(q, 'who', 'author', 'filed')) return `Filed by ${r.author} on ${r.date}.`;
    return dailyReportsAgent.localRespond(q, s);
  },
};

export const inspectionDetail: WidgetAgent = {
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
  buildContext(s) {
    const i = s.detailInspection;
    if (!i) return inspectionsAgent.buildContext(s);
    return [
      `Inspection ${i.id} (${i.project})`,
      `  Type: ${i.type}`,
      `  Date: ${i.date}`,
      `  Inspector: ${i.inspector}`,
      `  Result: ${i.result}`,
      `  Notes: ${i.notes || 'None'}`,
      `  Follow-up: ${i.followUp || 'None'}`,
    ].join('\n');
  },
  localRespond(q, s) {
    const i = s.detailInspection;
    if (!i) return inspectionsAgent.localRespond(q, s);
    if (kw(q, 'result', 'pass', 'fail', 'outcome')) return `Result: ${i.result}.${i.notes ? ' Notes: ' + i.notes : ''}`;
    if (kw(q, 'follow', 'reinspect', 'next')) return i.followUp ? `Follow-up: ${i.followUp}` : 'No follow-up required.';
    if (kw(q, 'who', 'inspector', 'inspected')) return `Inspected by ${i.inspector} on ${i.date}.`;
    if (kw(q, 'note', 'detail')) return i.notes ? `Notes: ${i.notes}` : 'No inspector notes.';
    if (kw(q, 'summary', 'summarize', 'about', 'what')) {
      return `${i.type} inspection at ${i.project} on ${i.date} -- ${i.result}. ${i.notes || 'No notes.'} ${i.followUp ? 'Follow-up: ' + i.followUp : ''}`.trim();
    }
    return inspectionsAgent.localRespond(q, s);
  },
};

export const punchItemDetail: WidgetAgent = {
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
  buildContext(s) {
    const p = s.detailPunchItem;
    if (!p) return inspectionsAgent.buildContext(s);
    return [
      `Punch item ${p.id} (${p.project})`,
      `  Location: ${p.location}`,
      `  Description: ${p.description}`,
      `  Assignee: ${p.assignee}`,
      `  Priority: ${p.priority}`,
      `  Status: ${p.status}`,
      `  Created: ${p.createdDate}`,
    ].join('\n');
  },
  localRespond(q, s) {
    const p = s.detailPunchItem;
    if (!p) return inspectionsAgent.localRespond(q, s);
    if (kw(q, 'status', 'state', 'progress')) return `Status: ${p.status}. Priority: ${p.priority}. Assigned to ${p.assignee}.`;
    if (kw(q, 'who', 'assigned', 'assignee')) return `Assigned to ${p.assignee}.`;
    if (kw(q, 'priority', 'urgent')) return `Priority: ${p.priority}. Status: ${p.status}.`;
    if (kw(q, 'location', 'where')) return `Location: ${p.location} at ${p.project}.`;
    if (kw(q, 'summary', 'summarize', 'about', 'what')) {
      return `Punch item at ${p.location} (${p.project}): ${p.description}. ${p.priority} priority, ${p.status}, assigned to ${p.assignee}, created ${p.createdDate}.`;
    }
    return inspectionsAgent.localRespond(q, s);
  },
};

export const changeOrderDetail: WidgetAgent = {
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
  buildContext(s) {
    const co = s.detailChangeOrder;
    if (!co) return changeOrdersAgent.buildContext(s);
    return [
      `Change order ${co.id} (${co.project})`,
      `  Type: ${co.coType}`,
      `  Description: ${co.description}`,
      `  Amount: $${co.amount.toLocaleString()}`,
      `  Status: ${co.status}`,
      `  Reason: ${co.reason}`,
      `  Requested by: ${co.requestedBy} on ${co.requestDate}`,
      ...(co.contractNumber ? [`  Contract: ${co.contractNumber}`] : []),
      ...(co.subcontractor ? [`  Subcontractor: ${co.subcontractor}`] : []),
      ...(co.costCode ? [`  Cost code: ${co.costCode}`] : []),
    ].join('\n');
  },
  localRespond(q, s) {
    const co = s.detailChangeOrder;
    if (!co) return changeOrdersAgent.localRespond(q, s);
    if (kw(q, 'amount', 'cost', 'financial', 'impact', 'price', 'value')) return `Amount: $${co.amount.toLocaleString()}.`;
    if (kw(q, 'status', 'approval', 'approve', 'state')) return `Status: ${co.status}.`;
    if (kw(q, 'why', 'reason', 'justif')) return `Reason: ${co.reason}.`;
    if (kw(q, 'who', 'requested', 'asked')) return `Requested by ${co.requestedBy} on ${co.requestDate}.`;
    if (kw(q, 'type', 'kind')) return `Type: ${co.coType}.`;
    if (kw(q, 'summary', 'summarize', 'about', 'what')) {
      return `${co.id} (${co.project}, ${co.coType}): ${co.description}. $${co.amount.toLocaleString()}, ${co.status}. Reason: ${co.reason}. Requested by ${co.requestedBy} on ${co.requestDate}.`;
    }
    return changeOrdersAgent.localRespond(q, s);
  },
};

export const contractDetail: WidgetAgent = {
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
  buildContext(s) {
    const c = s.detailContract;
    if (!c) return contractsAgent.buildContext(s);
    const linkedCount = c.linkedChangeOrderIds?.length ?? 0;
    return [
      `Contract ${c.id}: ${c.title}`,
      `  Project: ${c.project}`,
      `  Type: ${c.contractType}`,
      `  Vendor: ${c.vendor}`,
      `  Status: ${c.status}`,
      `  Original value: $${c.originalValue.toLocaleString()}`,
      `  Revised value: $${c.revisedValue.toLocaleString()}`,
      `  Change: $${(c.revisedValue - c.originalValue).toLocaleString()}`,
      `  Term: ${c.startDate} → ${c.endDate}`,
      `  Retainage: ${c.retainage}%`,
      `  Linked change orders: ${linkedCount}`,
      `  Scope: ${c.scope}`,
    ].join('\n');
  },
  localRespond(q, s) {
    const c = s.detailContract;
    if (!c) return contractsAgent.localRespond(q, s);
    if (kw(q, 'change order', 'co-', 'linked')) {
      const ids = c.linkedChangeOrderIds ?? [];
      return ids.length ? `${ids.length} linked change order(s): ${ids.join(', ')}.` : 'No change orders linked to this contract.';
    }
    if (kw(q, 'retainage', 'retention', 'held')) {
      const amount = (c.revisedValue * c.retainage) / 100;
      return `Retainage: ${c.retainage}% (≈ $${Math.round(amount).toLocaleString()} of revised value).`;
    }
    if (kw(q, 'value', 'change', 'original', 'revised', 'amount', 'price')) {
      const delta = c.revisedValue - c.originalValue;
      return `Original $${c.originalValue.toLocaleString()} → revised $${c.revisedValue.toLocaleString()} (change $${delta.toLocaleString()}).`;
    }
    if (kw(q, 'vendor', 'who', 'sub')) return `Vendor: ${c.vendor}.`;
    if (kw(q, 'status', 'state')) return `Status: ${c.status}. Term: ${c.startDate} → ${c.endDate}.`;
    if (kw(q, 'scope', 'work', 'about', 'summary', 'summarize')) {
      return `${c.id} ${c.title} (${c.contractType}, ${c.vendor}): ${c.scope}. ${c.status}, $${c.revisedValue.toLocaleString()} revised, ${c.retainage}% retainage.`;
    }
    return contractsAgent.localRespond(q, s);
  },
};

export const panoramaDetail: WidgetAgent = {
  id: 'panoramaDetail',
  name: 'Panorama Detail',
  systemPrompt: 'You are a site capture specialist reviewing a specific 360° panorama. Help describe what was captured, when, and where in the project.',
  suggestions: ['What does this panorama show?', 'When was it captured?', 'Who captured it?'],
  insight: () => null,
  alerts: () => null,
  actions: () => [
    { id: 'attach-rfi', label: 'Attach to an RFI', execute: () => 'Attached panorama to RFI draft.' },
    { id: 'mark-progress', label: 'Mark progress milestone', execute: () => 'Tagged panorama as progress milestone.' },
    { id: 'share-link', label: 'Share capture link', execute: () => 'Generated shareable capture link.' },
  ],
  buildContext(s) {
    const p = s.detailPanorama;
    if (!p) return `Project: ${s.projectName}\nNo panorama selected.`;
    return [
      `Project: ${s.projectName}`,
      `Panorama: ${p.title}`,
      `  ${p.subtitle}`,
      `  Location: ${p.location}`,
      `  Captured: ${p.captureDate}`,
      `  Captured by: ${p.capturedBy}`,
    ].join('\n');
  },
  localRespond(q, s) {
    const p = s.detailPanorama;
    if (!p) return 'No panorama is currently selected.';
    if (kw(q, 'what', 'show', 'about', 'describe', 'summary', 'summarize')) return `${p.title}: ${p.subtitle} (${p.location}).`;
    if (kw(q, 'when', 'date', 'captured')) return `Captured on ${p.captureDate}.`;
    if (kw(q, 'who', 'captured', 'by')) return `Captured by ${p.capturedBy} on ${p.captureDate}.`;
    if (kw(q, 'where', 'location')) return `Location: ${p.location}.`;
    return `Viewing ${p.title} (${p.location}, ${p.captureDate}).`;
  },
};

export const PROJECT_AGENTS: WidgetAgent[] = [
  milestonesAgent,
  tasksAgent,
  risksAgent,
  drawingAgent,
  teamAgent,
  activityAgent,
  projectDefault,
  recordsRfis,
  recordsSubmittals,
  drawingsPage,
  drawingDetail,
  rfiDetail,
  submittalDetail,
  dailyReportsAgent,
  inspectionsAgent,
  recordsDailyReports,
  recordsPunchItems,
  recordsInspections,
  recordsActionItems,
  dailyReportDetail,
  inspectionDetail,
  punchItemDetail,
  changeOrderDetail,
  contractDetail,
  panoramaDetail,
];

