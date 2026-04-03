import type { ChangeOrder, Contract, SubcontractLedgerEntry } from '../dashboard-data';
import { JOB_COST_CATEGORIES, formatCurrency } from '../dashboard-data';
import type { AgentAction, WidgetAgent } from './shared';
import { getSuggestions, kw } from './shared';

export const budgetAgent: WidgetAgent = {
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
    const used = s.budgetUsed ?? '$0';
    const total = s.budgetTotal ?? '$0';
    if (pct > 90) return `${pct}% utilized (${used} of ${total}) -- over threshold`;
    if (pct > 80) return `${pct}% utilized (${used} of ${total}) -- nearing limit`;
    if (pct > 0) return `${pct}% utilized (${used} of ${total})`;
    return null;
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
export const changeOrdersAgent: WidgetAgent = {
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
    if (!pending.length) {
      if (!cos.length) return null;
      const totalAll = cos.reduce((sum, co) => sum + co.amount, 0);
      return `${cos.length} COs totaling ${formatCurrency(totalAll)} -- none pending`;
    }
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
export const weatherAgent: WidgetAgent = {
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
export const revenueAgent: WidgetAgent = {
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
    const invoices = s.invoices ?? [];
    const overdueInv = invoices.filter(i => i.status === 'overdue');
    const totalOutstanding = rev.reduce((sum, r) => sum + r.outstandingRaw, 0);
    if (overdueInv.length > 0) return `${overdueInv.length} overdue invoice${overdueInv.length === 1 ? '' : 's'}, ${formatCurrency(totalOutstanding)} outstanding`;
    if (totalOutstanding > 0) return `${formatCurrency(totalOutstanding)} outstanding AR across portfolio`;
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
export const finBudgetByProject: WidgetAgent = {
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
    const projects = s.projects ?? [];
    if (!projects.length) return null;
    const high = projects.filter(p => p.budgetPct > 80);
    if (high.length) {
      const maxPct = Math.max(...high.map(p => p.budgetPct));
      return `${high.length} project${high.length === 1 ? '' : 's'} over 80% utilization (peak ${maxPct}%)`;
    }
    const avgPct = Math.round(projects.reduce((sum, p) => sum + p.budgetPct, 0) / projects.length);
    return `${projects.length} projects, avg ${avgPct}% budget utilization`;
  },
  alerts(s) {
    const high = (s.projects ?? []).filter(p => p.budgetPct >= 95).length;
    return high ? { level: 'critical', count: high, label: 'over 95% budget' } : null;
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
export const financialsDefault: WidgetAgent = {
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
    const invoices = s.invoices ?? [];
    const outstandingInv = invoices.filter(i => ['sent', 'overdue', 'partially-paid'].includes(i.status));
    const totalAR = outstandingInv.reduce((sum, i) => sum + i.amount - i.amountPaid, 0);
    const payables = s.payables ?? [];
    const unpaidAP = payables.filter(p => p.status !== 'paid');
    const totalAP = unpaidAP.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
    if (totalAR > 0 && pendingCo) return `${formatCurrency(totalAR)} AR outstanding, ${pendingCo} pending CO${pendingCo === 1 ? '' : 's'}`;
    if (totalAR > 0) return `${formatCurrency(totalAR)} AR outstanding, ${formatCurrency(totalAP)} AP pending`;
    if (pendingCo) return `${pendingCo} change order${pendingCo === 1 ? '' : 's'} pending approval`;
    const rev = (s.projectRevenue ?? []).reduce((sum, r) => sum + r.outstandingRaw, 0);
    if (rev > 0) return `${formatCurrency(rev)} outstanding revenue across portfolio`;
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
export const financialsSubledger: WidgetAgent = {
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
export const financialsBudget: WidgetAgent = {
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
export const financialsChangeOrders: WidgetAgent = {
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
export const contractsAgent: WidgetAgent = {
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
export const financialsContracts: WidgetAgent = {
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
export const financialsRevenue: WidgetAgent = {
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
export const financialsCostForecasts: WidgetAgent = {
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
    if (over.length) return `${over.length} month${over.length === 1 ? '' : 's'} ran over planned spend`;
    const totalActual = history.reduce((sum, h) => sum + (h.actual ?? 0), 0);
    const totalPlanned = history.reduce((sum, h) => sum + h.planned, 0);
    if (totalPlanned > 0) return `${Math.round((totalActual / totalPlanned) * 100)}% of planned spend to date`;
    return null;
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
export const financialsJobCostDetail: WidgetAgent = {
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
    if (p.budgetPct >= 95) return `Budget critically high at ${p.budgetPct}% -- immediate review recommended`;
    if (p.budgetPct >= 75) return `Budget utilization at ${p.budgetPct}% -- approaching threshold`;
    return null;
  },
  alerts(s) {
    const p = s.jobCostDetailProject;
    if (!p) return null;
    if (p.budgetPct >= 95) return { level: 'critical', count: 1, label: 'budget critical' };
    if (p.budgetPct >= 75) return { level: 'warning', count: 1, label: 'budget high' };
    return null;
  },
  actions(s) {
    const allCosts = s.allJobCosts ?? [];
    const currentId = s.jobCostDetailProject?.projectId;
    const others = allCosts.filter(p => p.projectId !== currentId).slice(0, 4);
    const navActions: AgentAction[] = others.map(p => {
      const proj = (s.projects ?? []).find(pr => pr.id === p.projectId);
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
      return `${p.projectName}: ${p.budgetUsed} spent of ${p.budgetTotal} (${p.budgetPct}%). Remaining: $${Math.round(remaining / 1000)}K (${100 - p.budgetPct}%). ${p.budgetPct >= 95 ? 'Critical -- immediate review needed.' : p.budgetPct >= 75 ? 'Approaching budget threshold.' : 'Within healthy range.'}`;
    }
    if (kw(q, 'compare', 'portfolio', 'average', 'other project')) {
      const allCosts = s.allJobCosts ?? [];
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

// ---------------------------------------------------------------------------
// Accounts Receivable Agent
// ---------------------------------------------------------------------------
export const financialsAR: WidgetAgent = {
  id: 'financialsAR',
  name: 'Accounts Receivable',
  systemPrompt: 'You are an AR specialist for a general contracting company. You track invoices, aging, collections, and DSO metrics.',
  suggestions: [
    'What is the total outstanding AR?',
    'Which invoices are overdue?',
    'What is our DSO?',
    'Show the AR aging breakdown',
  ],
  insight(s) {
    const invoices = s.invoices ?? [];
    const overdue = invoices.filter(i => i.status === 'overdue');
    if (overdue.length > 0) {
      const total = overdue.reduce((sum, i) => sum + i.amount - i.amountPaid, 0);
      return `${overdue.length} overdue invoice${overdue.length === 1 ? '' : 's'} totaling ${formatCurrency(total)}`;
    }
    const outstanding = invoices.filter(i => ['sent', 'partially-paid'].includes(i.status));
    if (outstanding.length > 0) {
      const total = outstanding.reduce((sum, i) => sum + i.amount - i.amountPaid, 0);
      return `${outstanding.length} outstanding invoice${outstanding.length === 1 ? '' : 's'} (${formatCurrency(total)})`;
    }
    if (invoices.length > 0) {
      const totalBilled = invoices.reduce((sum, i) => sum + i.amount, 0);
      return `${invoices.length} invoices totaling ${formatCurrency(totalBilled)}`;
    }
    return null;
  },
  alerts(s) {
    const invoices = s.invoices ?? [];
    const overdue = invoices.filter(i => i.status === 'overdue');
    if (overdue.length >= 3) return { level: 'critical', count: overdue.length, label: 'overdue invoices' };
    if (overdue.length > 0) return { level: 'warning', count: overdue.length, label: 'overdue invoices' };
    return null;
  },
  buildContext(s) {
    const invoices = s.invoices ?? [];
    const outstanding = invoices.filter(i => ['sent', 'overdue', 'partially-paid'].includes(i.status));
    const totalOwed = outstanding.reduce((sum, i) => sum + i.amount - i.amountPaid, 0);
    return `AR Overview: ${invoices.length} total invoices, ${outstanding.length} outstanding, ${formatCurrency(totalOwed)} owed. Statuses: ${invoices.map(i => i.status).join(', ')}.`;
  },
  localRespond(q, s) {
    const invoices = s.invoices ?? [];
    if (kw(q, 'overdue', 'past due', 'late')) {
      const overdue = invoices.filter(i => i.status === 'overdue');
      if (overdue.length === 0) return 'No invoices are currently overdue.';
      const total = overdue.reduce((sum, i) => sum + i.amount, 0);
      return `${overdue.length} overdue invoices totaling ${formatCurrency(total)}: ${overdue.map(i => `${i.invoiceNumber} (${formatCurrency(i.amount)})`).join(', ')}.`;
    }
    if (kw(q, 'aging', 'bucket')) return 'Use the AR Aging chart above to see the breakdown by aging bucket (Current, 1-30, 31-60, 61-90, 90+ days).';
    if (kw(q, 'dso', 'days sales')) return 'DSO measures average collection time. A lower number means faster collections.';
    const outstanding = invoices.filter(i => ['sent', 'overdue', 'partially-paid'].includes(i.status));
    const total = outstanding.reduce((sum, i) => sum + i.amount - i.amountPaid, 0);
    return `Total outstanding AR: ${formatCurrency(total)} across ${outstanding.length} invoices. Ask about overdue invoices, aging breakdown, or DSO.`;
  },
};

// ---------------------------------------------------------------------------
// Accounts Payable Agent
// ---------------------------------------------------------------------------
export const financialsAP: WidgetAgent = {
  id: 'financialsAP',
  name: 'Accounts Payable',
  systemPrompt: 'You are an AP specialist for a general contracting company. You track vendor bills, payment schedules, and cash outflow management.',
  suggestions: [
    'What bills are coming due soon?',
    'Which payables are overdue?',
    'Show AP by vendor',
    'What is total AP outstanding?',
  ],
  insight(s) {
    const payables = s.payables ?? [];
    const overdue = payables.filter(p => p.status === 'overdue');
    if (overdue.length > 0) {
      const total = overdue.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
      return `${overdue.length} overdue payable${overdue.length === 1 ? '' : 's'} totaling ${formatCurrency(total)}`;
    }
    const unpaid = payables.filter(p => p.status !== 'paid');
    if (unpaid.length > 0) {
      const total = unpaid.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
      return `${unpaid.length} unpaid payable${unpaid.length === 1 ? '' : 's'} (${formatCurrency(total)})`;
    }
    if (payables.length > 0) {
      const total = payables.reduce((sum, p) => sum + p.amount, 0);
      return `${payables.length} payables totaling ${formatCurrency(total)}`;
    }
    return null;
  },
  alerts(s) {
    const payables = s.payables ?? [];
    const overdue = payables.filter(p => p.status === 'overdue');
    const disputed = payables.filter(p => p.status === 'disputed');
    if (overdue.length + disputed.length >= 3) return { level: 'critical', count: overdue.length + disputed.length, label: 'AP issues' };
    if (overdue.length > 0) return { level: 'warning', count: overdue.length, label: 'overdue payables' };
    return null;
  },
  buildContext(s) {
    const payables = s.payables ?? [];
    const unpaid = payables.filter(p => p.status !== 'paid');
    const totalOwed = unpaid.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
    return `AP Overview: ${payables.length} total payables, ${unpaid.length} unpaid, ${formatCurrency(totalOwed)} owed. Vendors: ${[...new Set(payables.map(p => p.vendor))].join(', ')}.`;
  },
  localRespond(q, s) {
    const payables = s.payables ?? [];
    if (kw(q, 'overdue', 'past due', 'late')) {
      const overdue = payables.filter(p => p.status === 'overdue');
      if (overdue.length === 0) return 'No payables are currently overdue.';
      return `${overdue.length} overdue payables: ${overdue.map(p => `${p.vendor} - ${p.invoiceNumber} (${formatCurrency(p.amount)})`).join('; ')}.`;
    }
    if (kw(q, 'vendor', 'supplier', 'sub')) {
      const byVendor = new Map<string, number>();
      for (const p of payables.filter(p => p.status !== 'paid')) { byVendor.set(p.vendor, (byVendor.get(p.vendor) ?? 0) + p.amount - p.amountPaid); }
      const lines = [...byVendor.entries()].sort((a, b) => b[1] - a[1]).map(([v, t]) => `${v}: ${formatCurrency(t)}`);
      return `Outstanding AP by vendor:\n${lines.join('\n')}`;
    }
    const unpaid = payables.filter(p => p.status !== 'paid');
    const total = unpaid.reduce((sum, p) => sum + p.amount - p.amountPaid, 0);
    return `Total AP outstanding: ${formatCurrency(total)} across ${unpaid.length} payables. Ask about overdue items, vendor breakdown, or upcoming payments.`;
  },
};

// ---------------------------------------------------------------------------
// Job Billing Agent
// ---------------------------------------------------------------------------
export const financialsBilling: WidgetAgent = {
  id: 'financialsBilling',
  name: 'Job Billing',
  systemPrompt: 'You are a billing specialist for a general contracting company. You track billing schedules, progress billing, and invoice generation.',
  suggestions: [
    'Which projects are due for billing?',
    'Show billing history',
    'What is the total unbilled amount?',
    'Compare billed vs contract value',
  ],
  insight(s) {
    const schedules = s.billingSchedules ?? [];
    const today = new Date();
    const cutoff = new Date(today.getTime() + 7 * 86_400_000);
    const dueSoon = schedules.filter(bs => new Date(bs.nextBillingDate) <= cutoff);
    if (dueSoon.length > 0) {
      const total = dueSoon.reduce((sum, bs) => sum + bs.lastBilledAmount, 0);
      return `${dueSoon.length} project${dueSoon.length === 1 ? '' : 's'} due for billing this week (~${formatCurrency(total)})`;
    }
    if (schedules.length > 0) {
      const totalBilled = schedules.reduce((sum, bs) => sum + bs.totalBilled, 0);
      const totalRemaining = schedules.reduce((sum, bs) => sum + bs.totalRemaining, 0);
      return `${formatCurrency(totalBilled)} billed, ${formatCurrency(totalRemaining)} remaining`;
    }
    return null;
  },
  alerts() { return null; },
  buildContext(s) {
    const schedules = s.billingSchedules ?? [];
    const totalRemaining = schedules.reduce((sum, bs) => sum + bs.totalRemaining, 0);
    return `Billing Overview: ${schedules.length} active billing schedules, ${formatCurrency(totalRemaining)} remaining to bill. Frequencies: ${schedules.map(bs => bs.frequency).join(', ')}.`;
  },
  localRespond(q, s) {
    const schedules = s.billingSchedules ?? [];
    const events = s.billingEvents ?? [];
    if (kw(q, 'due', 'upcoming', 'next')) {
      const sorted = [...schedules].sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
      const lines = sorted.slice(0, 5).map(bs => {
        const proj = (s.projects ?? []).find(p => p.id === bs.projectId);
        return `${proj?.name ?? `Project ${bs.projectId}`}: ${bs.nextBillingDate} (${bs.frequency})`;
      });
      return `Upcoming billing:\n${lines.join('\n')}`;
    }
    if (kw(q, 'unbilled', 'remaining')) {
      const totalRemaining = schedules.reduce((sum, bs) => sum + bs.totalRemaining, 0);
      return `Total unbilled: ${formatCurrency(totalRemaining)} across ${schedules.length} projects.`;
    }
    if (kw(q, 'history', 'past', 'completed')) {
      const completed = events.filter(e => e.status === 'completed');
      const total = completed.reduce((sum, e) => sum + e.amount, 0);
      return `${completed.length} completed billing events totaling ${formatCurrency(total)}.`;
    }
    const totalBilled = schedules.reduce((sum, bs) => sum + bs.totalBilled, 0);
    const totalContract = schedules.reduce((sum, bs) => sum + bs.contractValue, 0);
    return `Billing: ${formatCurrency(totalBilled)} billed of ${formatCurrency(totalContract)} total contract value (${Math.round((totalBilled / totalContract) * 100)}%). Ask about upcoming billing, unbilled amounts, or history.`;
  },
};

// ---------------------------------------------------------------------------
// Cash Management Agent
// ---------------------------------------------------------------------------
export const financialsCash: WidgetAgent = {
  id: 'financialsCash',
  name: 'Cash Management',
  systemPrompt: 'You are a cash management specialist for a general contracting company. You track cash position, forecast runway, and manage inflows/outflows.',
  suggestions: [
    'What is our current cash position?',
    'How many months of runway do we have?',
    'Show cash flow trend',
    'What are our fixed monthly costs?',
  ],
  insight(s) {
    const pos = s.cashPosition;
    if (!pos) return null;
    const monthlyBurn = pos.monthlyPayroll + pos.monthlyOverhead;
    const runway = monthlyBurn > 0 ? Math.round((pos.currentBalance / monthlyBurn) * 10) / 10 : 0;
    if (runway < 3) return `Cash runway: ${runway} months -- action needed`;
    return `Cash position: ${formatCurrency(pos.currentBalance)}, ~${runway} months runway`;
  },
  alerts(s) {
    const pos = s.cashPosition;
    if (!pos) return null;
    const monthlyBurn = pos.monthlyPayroll + pos.monthlyOverhead;
    const runway = monthlyBurn > 0 ? pos.currentBalance / monthlyBurn : Infinity;
    if (runway < 2) return { level: 'critical', count: 1, label: 'low cash runway' };
    if (runway < 3) return { level: 'warning', count: 1, label: 'cash runway below 3 months' };
    return null;
  },
  buildContext(s) {
    const pos = s.cashPosition;
    const history = s.cashFlowHistory ?? [];
    if (!pos) return 'No cash position data available.';
    return `Cash: ${formatCurrency(pos.currentBalance)} balance. 30-day forecast: ${formatCurrency(pos.thirtyDayForecast)}. Monthly payroll: ${formatCurrency(pos.monthlyPayroll)}, overhead: ${formatCurrency(pos.monthlyOverhead)}. Upcoming AP: ${formatCurrency(pos.upcomingPayables)}. ${history.length} months of history.`;
  },
  localRespond(q, s) {
    const pos = s.cashPosition;
    if (!pos) return 'Cash position data is not available.';
    if (kw(q, 'runway', 'how long', 'months')) {
      const monthlyBurn = pos.monthlyPayroll + pos.monthlyOverhead;
      const runway = monthlyBurn > 0 ? Math.round((pos.currentBalance / monthlyBurn) * 10) / 10 : 0;
      return `At current burn rate of ${formatCurrency(monthlyBurn)}/month, you have approximately ${runway} months of cash runway. Balance: ${formatCurrency(pos.currentBalance)}.`;
    }
    if (kw(q, 'forecast', 'outlook', 'projection')) {
      return `Cash forecasts: 30-day: ${formatCurrency(pos.thirtyDayForecast)}, 60-day: ${formatCurrency(pos.sixtyDayForecast)}, 90-day: ${formatCurrency(pos.ninetyDayForecast)}.`;
    }
    if (kw(q, 'fixed', 'cost', 'payroll', 'overhead')) {
      return `Monthly fixed costs: Payroll ${formatCurrency(pos.monthlyPayroll)} + Overhead ${formatCurrency(pos.monthlyOverhead)} = ${formatCurrency(pos.monthlyPayroll + pos.monthlyOverhead)}/month.`;
    }
    if (kw(q, 'trend', 'flow', 'history')) {
      const history = s.cashFlowHistory ?? [];
      const lines = history.map(e => `${e.month}: In ${formatCurrency(e.inflows)}, Out ${formatCurrency(e.outflows)}, Net ${formatCurrency(e.netCash)}`);
      return `Cash flow trend:\n${lines.join('\n')}`;
    }
    return `Current cash: ${formatCurrency(pos.currentBalance)}. Upcoming payables: ${formatCurrency(pos.upcomingPayables)}. Ask about runway, forecasts, fixed costs, or trends.`;
  },
};

// ---------------------------------------------------------------------------
// General Ledger Agent
// ---------------------------------------------------------------------------
export const financialsGL: WidgetAgent = {
  id: 'financialsGL',
  name: 'General Ledger',
  systemPrompt: 'You are an accounting specialist for a general contracting company. You track journal entries, account balances, and produce financial summaries.',
  suggestions: [
    'Show account balances',
    'What are total assets vs liabilities?',
    'Show recent journal entries',
    'What is the revenue this period?',
  ],
  insight(s) {
    const accounts = s.glAccounts ?? [];
    const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
    if (totalAssets > 0) return `Total assets: ${formatCurrency(totalAssets)}, liabilities: ${formatCurrency(totalLiabilities)}`;
    return null;
  },
  alerts() { return null; },
  buildContext(s) {
    const accounts = s.glAccounts ?? [];
    const entries = s.glEntries ?? [];
    return `GL: ${accounts.length} accounts, ${entries.length} journal entries. Account types: ${accounts.map(a => `${a.code} ${a.name} (${formatCurrency(a.balance)})`).join('; ')}.`;
  },
  localRespond(q, s) {
    const accounts = s.glAccounts ?? [];
    const entries = s.glEntries ?? [];
    if (kw(q, 'balance', 'account', 'trial')) {
      const groups: Record<string, number> = {};
      for (const a of accounts) { groups[a.type] = (groups[a.type] ?? 0) + a.balance; }
      const lines = Object.entries(groups).map(([type, total]) => `${type}: ${formatCurrency(total)}`);
      return `Account balances by type:\n${lines.join('\n')}`;
    }
    if (kw(q, 'asset', 'liability', 'equity')) {
      const assets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
      const liabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
      const equity = accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0);
      return `Assets: ${formatCurrency(assets)}, Liabilities: ${formatCurrency(liabilities)}, Equity: ${formatCurrency(equity)}. A = L + E check: ${formatCurrency(assets)} vs ${formatCurrency(liabilities + equity)}.`;
    }
    if (kw(q, 'journal', 'recent', 'entries', 'entry')) {
      const recent = entries.slice(-5);
      const lines = recent.map(e => `${e.date}: ${e.description} (Dr ${formatCurrency(e.debit)}, Cr ${formatCurrency(e.credit)})`);
      return `Recent journal entries:\n${lines.join('\n')}`;
    }
    if (kw(q, 'revenue', 'income')) {
      const revenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
      return `Total revenue booked: ${formatCurrency(revenue)}.`;
    }
    return `GL has ${accounts.length} accounts and ${entries.length} journal entries. Ask about balances, recent entries, revenue, or the balance sheet equation.`;
  },
};

export const financialsPO: WidgetAgent = {
  id: 'financialsPO',
  name: 'Purchase Orders',
  systemPrompt: 'You are a procurement specialist for a general contracting company. You track purchase orders, vendor deliveries, material costs, and procurement timelines.',
  suggestions: [
    'How many POs are open?',
    'What is the total committed spend?',
    'Are any deliveries overdue?',
    'Show POs by vendor',
  ],
  insight(s) {
    const pos = s.purchaseOrders ?? [];
    const open = pos.filter(po => !['received', 'closed', 'cancelled'].includes(po.status));
    if (open.length > 0) {
      const total = open.reduce((sum, po) => sum + po.amount, 0);
      return `${open.length} open POs worth ${formatCurrency(total)}`;
    }
    return null;
  },
  alerts(s) {
    const pos = s.purchaseOrders ?? [];
    const today = new Date().toISOString().split('T')[0];
    const overdue = pos.filter(po => !['received', 'closed', 'cancelled'].includes(po.status) && po.expectedDelivery < today);
    if (overdue.length > 0) return { level: 'warning' as const, count: overdue.length, label: 'PO deliveries past due' };
    return null;
  },
  buildContext(s) {
    const pos = s.purchaseOrders ?? [];
    const open = pos.filter(po => !['received', 'closed', 'cancelled'].includes(po.status));
    return `Purchase Orders: ${pos.length} total, ${open.length} open. Total committed: ${formatCurrency(pos.reduce((sum, po) => sum + po.amount, 0))}. Vendors: ${[...new Set(pos.map(po => po.vendor))].join(', ')}.`;
  },
  localRespond(q, s) {
    const pos = s.purchaseOrders ?? [];
    if (kw(q, 'open', 'active', 'pending')) {
      const open = pos.filter(po => !['received', 'closed', 'cancelled'].includes(po.status));
      const lines = open.map(po => `${po.poNumber}: ${po.vendor} - ${po.description} (${formatCurrency(po.amount)}, ${po.status})`);
      return `${open.length} open POs:\n${lines.join('\n')}`;
    }
    if (kw(q, 'overdue', 'late', 'delivery')) {
      const today = new Date().toISOString().split('T')[0];
      const overdue = pos.filter(po => !['received', 'closed', 'cancelled'].includes(po.status) && po.expectedDelivery < today);
      if (overdue.length === 0) return 'No overdue deliveries.';
      const lines = overdue.map(po => `${po.poNumber}: ${po.vendor} - expected ${po.expectedDelivery} (${formatCurrency(po.amount)})`);
      return `${overdue.length} overdue deliveries:\n${lines.join('\n')}`;
    }
    if (kw(q, 'vendor', 'supplier')) {
      const byVendor = new Map<string, { count: number; total: number }>();
      for (const po of pos) {
        const v = byVendor.get(po.vendor) ?? { count: 0, total: 0 };
        v.count++; v.total += po.amount;
        byVendor.set(po.vendor, v);
      }
      const lines = Array.from(byVendor.entries()).sort((a, b) => b[1].total - a[1].total).map(([v, d]) => `${v}: ${d.count} POs, ${formatCurrency(d.total)}`);
      return `POs by vendor:\n${lines.join('\n')}`;
    }
    if (kw(q, 'total', 'spend', 'committed', 'value')) {
      const total = pos.reduce((sum, po) => sum + po.amount, 0);
      const received = pos.filter(po => ['received', 'closed'].includes(po.status)).reduce((sum, po) => sum + po.amount, 0);
      return `Total PO value: ${formatCurrency(total)}. Received/closed: ${formatCurrency(received)}. Outstanding: ${formatCurrency(total - received)}.`;
    }
    return `${pos.length} purchase orders tracked. Ask about open POs, overdue deliveries, vendors, or total spend.`;
  },
};

export const financialsPayroll: WidgetAgent = {
  id: 'financialsPayroll',
  name: 'Payroll',
  systemPrompt: 'You are a payroll specialist for a general contracting company. You track weekly payroll, labor costs, overtime, tax withholdings, and headcount trends.',
  suggestions: [
    'What is total payroll this month?',
    'How much overtime this period?',
    'Show headcount trend',
    'What is the labor burden rate?',
  ],
  insight(s) {
    const records = s.payrollRecords ?? [];
    const processed = records.filter(r => r.status === 'processed');
    if (processed.length > 0) {
      const totalGross = processed.reduce((sum, r) => sum + r.grossPay, 0);
      const latest = processed[processed.length - 1];
      return `${latest.employeeCount} employees, ${formatCurrency(totalGross)} gross YTD`;
    }
    return null;
  },
  alerts(s) {
    const records = s.payrollRecords ?? [];
    const pending = records.filter(r => r.status === 'pending');
    if (pending.length > 0) return { level: 'warning' as const, count: pending.length, label: 'payroll periods pending' };
    const recent = records.filter(r => r.status === 'processed').slice(-4);
    const avgOT = recent.length > 0 ? recent.reduce((s2, r) => s2 + r.overtimeHours, 0) / recent.length : 0;
    if (avgOT > 70) return { level: 'info' as const, count: Math.round(avgOT), label: 'avg OT hrs/week trending high' };
    return null;
  },
  buildContext(s) {
    const records = s.payrollRecords ?? [];
    const processed = records.filter(r => r.status === 'processed');
    const totalGross = processed.reduce((sum, r) => sum + r.grossPay, 0);
    const latest = processed[processed.length - 1];
    return `Payroll: ${records.length} periods, ${processed.length} processed. Total gross: ${formatCurrency(totalGross)}. Current headcount: ${latest?.employeeCount ?? 'N/A'}.`;
  },
  localRespond(q, s) {
    const records = s.payrollRecords ?? [];
    const processed = records.filter(r => r.status === 'processed');
    if (kw(q, 'total', 'ytd', 'gross', 'summary')) {
      const totalGross = processed.reduce((sum, r) => sum + r.grossPay, 0);
      const totalTaxes = processed.reduce((sum, r) => sum + r.taxes, 0);
      const totalBenefits = processed.reduce((sum, r) => sum + r.benefits, 0);
      const totalNet = processed.reduce((sum, r) => sum + r.netPay, 0);
      return `Payroll summary (${processed.length} periods processed):\nGross: ${formatCurrency(totalGross)}\nTaxes: ${formatCurrency(totalTaxes)}\nBenefits: ${formatCurrency(totalBenefits)}\nNet: ${formatCurrency(totalNet)}`;
    }
    if (kw(q, 'overtime', 'ot', 'hours')) {
      const totalOT = processed.reduce((sum, r) => sum + r.overtimeHours, 0);
      const totalHours = processed.reduce((sum, r) => sum + r.totalHours, 0);
      const otPct = totalHours > 0 ? ((totalOT / totalHours) * 100).toFixed(1) : '0';
      return `Overtime: ${totalOT.toLocaleString()} hrs of ${totalHours.toLocaleString()} total (${otPct}%). Last 4 weeks avg: ${Math.round(processed.slice(-4).reduce((s2, r) => s2 + r.overtimeHours, 0) / Math.min(4, processed.length))} hrs/week.`;
    }
    if (kw(q, 'headcount', 'employees', 'staffing', 'trend')) {
      const recent = processed.slice(-8);
      const lines = recent.map(r => `${r.period}: ${r.employeeCount} employees`);
      return `Recent headcount:\n${lines.join('\n')}`;
    }
    if (kw(q, 'burden', 'rate', 'cost')) {
      const totalGross = processed.reduce((sum, r) => sum + r.grossPay, 0);
      const totalTaxes = processed.reduce((sum, r) => sum + r.taxes, 0);
      const totalBenefits = processed.reduce((sum, r) => sum + r.benefits, 0);
      const burdenPct = totalGross > 0 ? (((totalTaxes + totalBenefits) / totalGross) * 100).toFixed(1) : '0';
      return `Labor burden rate: ${burdenPct}% (taxes: ${formatCurrency(totalTaxes)}, benefits: ${formatCurrency(totalBenefits)} on ${formatCurrency(totalGross)} gross).`;
    }
    if (kw(q, 'pending', 'scheduled', 'upcoming')) {
      const pending = records.filter(r => r.status !== 'processed');
      if (pending.length === 0) return 'All payroll periods are processed.';
      const lines = pending.map(r => `${r.period}: ${r.status} - ${formatCurrency(r.grossPay)} gross, pay date ${r.payDate}`);
      return `Upcoming payroll:\n${lines.join('\n')}`;
    }
    return `${records.length} payroll periods tracked (${processed.length} processed). Ask about totals, overtime, headcount, burden rate, or pending payroll.`;
  },
};

export const financialsContractsSub: WidgetAgent = {
  id: 'financialsContractsSub',
  name: 'Contracts',
  systemPrompt: 'You are a contract management specialist for construction. You track prime contracts and subcontracts, analyze change order impact on contract values, monitor retainage, and advise on vendor exposure.',
  suggestions(s) {
    const contracts = s.contracts ?? [];
    const subs = contracts.filter(c => c.contractType === 'subcontract');
    const pending = contracts.filter(c => c.status === 'pending');
    const base: string[] = [
      'What is the total contract value across all projects?',
      'Which contracts have the most change order exposure?',
    ];
    if (pending.length > 0) base.push(`Why are ${pending.length} contracts still pending?`);
    if (subs.length > 0) base.push(`How many subcontracts are active?`);
    return base;
  },
  insight(s) {
    const contracts = s.contracts ?? [];
    const totalOriginal = contracts.reduce((sum, c) => sum + c.originalValue, 0);
    const totalRevised = contracts.reduce((sum, c) => sum + c.revisedValue, 0);
    const delta = totalRevised - totalOriginal;
    if (delta > 0) {
      const pct = ((delta / totalOriginal) * 100).toFixed(1);
      return `Contract values have increased ${pct}% ($${formatCurrency(delta)}) from original via change orders`;
    }
    return null;
  },
  alerts(s) {
    const contracts = s.contracts ?? [];
    const pending = contracts.filter(c => c.status === 'pending');
    if (pending.length > 0) return { level: 'info' as const, count: pending.length, label: 'contracts pending approval' };
    return null;
  },
  buildContext(s) {
    const contracts = s.contracts ?? [];
    const primes = contracts.filter(c => c.contractType === 'prime');
    const subs = contracts.filter(c => c.contractType === 'subcontract');
    return `Contracts: ${contracts.length} total (${primes.length} prime, ${subs.length} subcontracts). Total original value: $${formatCurrency(contracts.reduce((sum, c) => sum + c.originalValue, 0))}. Total revised: $${formatCurrency(contracts.reduce((sum, c) => sum + c.revisedValue, 0))}. Active: ${contracts.filter(c => c.status === 'active').length}, pending: ${contracts.filter(c => c.status === 'pending').length}.`;
  },
  localRespond(q, s) {
    const contracts = s.contracts ?? [];
    const ql = q.toLowerCase();
    if (kw(ql, 'total', 'value')) {
      return `Total original contract value is $${formatCurrency(contracts.reduce((sum, c) => sum + c.originalValue, 0))}. Revised total (after COs) is $${formatCurrency(contracts.reduce((sum, c) => sum + c.revisedValue, 0))}.`;
    }
    if (kw(ql, 'sub', 'active')) {
      const subs = contracts.filter(c => c.contractType === 'subcontract' && c.status === 'active');
      return `There are ${subs.length} active subcontracts with a combined revised value of $${formatCurrency(subs.reduce((sum, c) => sum + c.revisedValue, 0))}.`;
    }
    if (kw(ql, 'pending')) {
      const pending = contracts.filter(c => c.status === 'pending');
      if (pending.length === 0) return 'No contracts are currently pending approval.';
      return `${pending.length} contract(s) pending: ${pending.map(c => `${c.title} ($${formatCurrency(c.revisedValue)})`).join('; ')}.`;
    }
    if (kw(ql, 'retainage')) {
      const totalRet = contracts.reduce((sum, c) => sum + (c.revisedValue * c.retainage / 100), 0);
      return `Total retainage held across all contracts is approximately $${formatCurrency(totalRet)}.`;
    }
    return `There are ${contracts.length} contracts across all projects.`;
  },
};

export const financialsSubLedger: WidgetAgent = {
  id: 'financialsSubLedger',
  name: 'Subcontract Ledger',
  systemPrompt: 'You are a subcontract accounting specialist. You track payment applications, retainage, backcharges, and change order adjustments against subcontracts. You help ensure subs are paid correctly and retainage is managed per contract terms.',
  suggestions(s) {
    const entries = s.subcontractLedger ?? [];
    const backcharges = entries.filter(e => e.type === 'backcharge');
    const base: string[] = [
      'What is total paid to subcontractors?',
      'How much retainage is currently held?',
      'Show me the latest pay applications',
    ];
    if (backcharges.length > 0) base.push(`Why were ${backcharges.length} backcharges issued?`);
    return base;
  },
  insight(s) {
    const entries = s.subcontractLedger ?? [];
    const totalPaid = entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);
    const retHeld = Math.abs(entries.filter(e => e.type === 'retainage-held').reduce((sum, e) => sum + e.amount, 0));
    if (retHeld > 0) {
      const pct = ((retHeld / (totalPaid + retHeld)) * 100).toFixed(1);
      return `$${formatCurrency(retHeld)} retainage held (${pct}% of gross billings) across all subcontracts`;
    }
    return null;
  },
  alerts(s) {
    const entries = s.subcontractLedger ?? [];
    const backcharges = entries.filter(e => e.type === 'backcharge');
    if (backcharges.length > 0) return { level: 'warning' as const, count: backcharges.length, label: 'backcharges issued' };
    return null;
  },
  buildContext(s) {
    const entries = s.subcontractLedger ?? [];
    const totalPaid = entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);
    const retHeld = Math.abs(entries.filter(e => e.type === 'retainage-held').reduce((sum, e) => sum + e.amount, 0));
    const retReleased = entries.filter(e => e.type === 'retainage-release').reduce((sum, e) => sum + e.amount, 0);
    const backcharges = Math.abs(entries.filter(e => e.type === 'backcharge').reduce((sum, e) => sum + e.amount, 0));
    const coAdj = entries.filter(e => e.type === 'change-order').reduce((sum, e) => sum + e.amount, 0);
    const vendors = [...new Set(entries.map(e => e.vendor))];
    return `Subcontract Ledger: ${entries.length} entries across ${vendors.length} vendors. Total paid: $${formatCurrency(totalPaid)}. Retainage held: $${formatCurrency(retHeld)}. Released: $${formatCurrency(retReleased)}. Backcharges: $${formatCurrency(backcharges)}. CO adjustments: $${formatCurrency(coAdj)}.`;
  },
  localRespond(q, s) {
    const entries = s.subcontractLedger ?? [];
    const ql = q.toLowerCase();
    if (kw(ql, 'total', 'paid')) {
      const totalPaid = entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + e.amount, 0);
      return `Total paid to subcontractors: $${formatCurrency(totalPaid)} across ${entries.filter(e => e.type === 'payment').length} pay applications.`;
    }
    if (kw(ql, 'retainage', 'held')) {
      const retHeld = Math.abs(entries.filter(e => e.type === 'retainage-held').reduce((sum, e) => sum + e.amount, 0));
      return `Total retainage currently held: $${formatCurrency(retHeld)}.`;
    }
    if (kw(ql, 'backcharge')) {
      const bcs = entries.filter(e => e.type === 'backcharge');
      if (bcs.length === 0) return 'No backcharges have been issued.';
      return `${bcs.length} backcharge(s) totaling $${formatCurrency(Math.abs(bcs.reduce((s, e) => s + e.amount, 0)))}: ${bcs.map(b => `${b.vendor} -- ${b.description}`).join('; ')}.`;
    }
    if (kw(ql, 'latest', 'pay', 'recent')) {
      const payments = entries.filter(e => e.type === 'payment').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
      return payments.map(p => `${p.date}: ${p.vendor} -- $${formatCurrency(p.amount)} (${p.payApp})`).join('\n');
    }
    return `Subcontract ledger has ${entries.length} entries across ${[...new Set(entries.map(e => e.vendor))].length} vendors.`;
  },
};

export const FINANCIALS_AGENTS: WidgetAgent[] = [
  budgetAgent,
  changeOrdersAgent,
  weatherAgent,
  revenueAgent,
  finBudgetByProject,
  financialsDefault,
  financialsSubledger,
  financialsBudget,
  financialsChangeOrders,
  contractsAgent,
  financialsContracts,
  financialsRevenue,
  financialsCostForecasts,
  financialsJobCostDetail,
  financialsAR,
  financialsAP,
  financialsBilling,
  financialsCash,
  financialsGL,
  financialsPO,
  financialsPayroll,
  financialsContractsSub,
  financialsSubLedger,
];

