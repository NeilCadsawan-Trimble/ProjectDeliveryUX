import type { ModusBadgeColor } from '../components/modus-badge.component';
import type {
  AgingBucket,
  BillingEvent,
  BillingFrequency,
  CashFlowEntry,
  ChangeOrderStatus,
  ChangeOrderType,
  ContractStatus,
  ContractType,
  EstimateStatus,
  GLAccount,
  InspectionResult,
  Invoice,
  InvoiceStatus,
  JobCostCategory,
  JobCostCategorySummary,
  Payable,
  PayableStatus,
  PayrollRecord,
  PayrollStatus,
  ProjectJobCost,
  PurchaseOrder,
  PurchaseOrderStatus,
  ProjectStatus,
  Contract,
  SubcontractLedgerEntry,
  SubcontractLedgerType,
  RevenueDataPoint,
  RevenueTimeRange,
  StaffingConflict,
  SubledgerTransaction,
  TimeOffRequest,
  Rfi,
  Submittal,
  UrgentNeedCategory,
  UrgentNeedItem,
} from './dashboard-data.types';
import { JOB_COST_CATEGORIES } from './dashboard-data.types';
import {
  ANNUAL_TOTALS,
  BILLING_EVENTS,
  CASH_FLOW_HISTORY,
  CASH_POSITION,
  CATEGORY_COLORS,
  CHANGE_ORDERS,
  GL_ACCOUNTS,
  INVOICES,
  MONTHLY_REVENUE,
  PAYABLES,
  PAYROLL_RECORDS,
  PROJECT_ATTENTION_ITEMS,
  PURCHASE_ORDERS,
  CONTRACTS,
  SUBCONTRACT_LEDGER,
  PROJECTS,
  PROJECT_TEAM_SIZES,
  PROJECT_WEATHER_DATA,
  TIME_OFF_REQUESTS,
} from './dashboard-data.seed';
import { PROJECT_DATA, type BudgetBreakdown } from './project-data';

function parseMonthDay(dateStr: string, year: number): Date {
  const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [mon, dayStr] = dateStr.split(' ');
  return new Date(year, MONTHS[mon], parseInt(dayStr, 10));
}

export function getProjectTimeOff(projectId: number): TimeOffRequest[] {
  return TIME_OFF_REQUESTS.filter(r => r.projectId === projectId && r.status !== 'Denied');
}

export function buildStaffingConflicts(projectId?: number): StaffingConflict[] {
  const year = 2026;
  const active = TIME_OFF_REQUESTS.filter(r => r.status !== 'Denied');
  const byProject = new Map<number, TimeOffRequest[]>();
  for (const r of active) {
    if (projectId !== undefined && r.projectId !== projectId) continue;
    const arr = byProject.get(r.projectId) ?? [];
    arr.push(r);
    byProject.set(r.projectId, arr);
  }

  const conflicts: StaffingConflict[] = [];
  const weekStart = new Date(year, 2, 2); // Mar 2
  const weekEnd = new Date(year, 3, 27); // Apr 27

  for (const [projId, requests] of byProject.entries()) {
    const proj = PROJECTS.find(p => p.id === projId);
    if (!proj) continue;
    const teamSize = PROJECT_TEAM_SIZES[projId] ?? 5;
    const cur = new Date(weekStart);

    while (cur <= weekEnd) {
      const wkEnd = new Date(cur);
      wkEnd.setDate(wkEnd.getDate() + 4);
      const absentSet = new Set<string>();
      for (const r of requests) {
        const s = parseMonthDay(r.startDate, year);
        const e = parseMonthDay(r.endDate, year);
        if (s <= wkEnd && e >= cur) absentSet.add(r.name);
      }
      if (absentSet.size >= 2) {
        const pct = Math.round((absentSet.size / teamSize) * 100);
        let severity: StaffingConflict['severity'] = 'info';
        let reason = `${absentSet.size} of ${teamSize} team members out`;
        if (pct >= 50) { severity = 'critical'; reason = `${pct}% of team absent -- project at risk of delays`; }
        else if (pct >= 30) { severity = 'warning'; reason = `${pct}% of team absent -- reduced capacity`; }
        const mon = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        conflicts.push({
          projectId: projId,
          projectName: proj.name,
          week: `Week of ${mon}`,
          absentCount: absentSet.size,
          teamSize,
          absentPct: pct,
          absentees: [...absentSet],
          severity,
          reason,
        });
      }
      cur.setDate(cur.getDate() + 7);
    }
  }
  return conflicts.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return sev[a.severity] - sev[b.severity] || b.absentPct - a.absentPct;
  });
}
export function statusBadgeColor(status: ProjectStatus): ModusBadgeColor {
  const map: Record<ProjectStatus, ModusBadgeColor> = {
    'On Track': 'success',
    'At Risk': 'warning',
    'Overdue': 'danger',
    'Planning': 'secondary',
  };
  return map[status];
}

export function progressClass(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    'On Track': 'progress-success',
    'At Risk': 'progress-warning',
    'Overdue': 'progress-danger',
    'Planning': 'progress-primary',
  };
  return map[status];
}

export function budgetProgressClass(pct: number): string {
  if (pct >= 90) return 'progress-danger';
  if (pct >= 75) return 'progress-warning';
  return 'progress-success';
}

export function budgetPctColor(pct: number): string {
  if (pct >= 90) return 'text-destructive font-semibold';
  if (pct >= 75) return 'text-warning font-semibold';
  return 'text-foreground-80';
}

export function estimateBadgeColor(status: EstimateStatus): ModusBadgeColor {
  const map: Record<EstimateStatus, ModusBadgeColor> = {
    'Draft': 'secondary',
    'Under Review': 'primary',
    'Awaiting Approval': 'warning',
    'Approved': 'success',
  };
  return map[status];
}

export function dueDateClass(daysLeft: number): string {
  if (daysLeft < 0) return 'text-destructive font-medium';
  if (daysLeft <= 3) return 'text-warning font-medium';
  return 'text-foreground-40';
}
export function getRevenueData(range: RevenueTimeRange): RevenueDataPoint[] {
  return MONTHLY_REVENUE[range];
}

export function getRevenueSummary(range: RevenueTimeRange): { current: number; previous: number; label: string; growthPct: number } {
  const t = ANNUAL_TOTALS[range];
  const growthPct = Math.round(((t.current - t.previous) / t.previous) * 100);
  return { ...t, growthPct };
}
export function coBadgeColor(status: ChangeOrderStatus): ModusBadgeColor {
  const map: Record<ChangeOrderStatus, ModusBadgeColor> = { pending: 'warning', approved: 'success', rejected: 'danger' };
  return map[status];
}

export function coTypeLabel(coType: ChangeOrderType): string {
  const map: Record<ChangeOrderType, string> = { prime: 'Prime Contract', potential: 'Potential', subcontract: 'Subcontract' };
  return map[coType];
}

export function coTypeIcon(coType: ChangeOrderType): string {
  const map: Record<ChangeOrderType, string> = { prime: 'content_copy', potential: 'pending_actions', subcontract: 'assignment' };
  return map[coType];
}

export function contractStatusBadge(status: ContractStatus): ModusBadgeColor {
  const map: Record<ContractStatus, ModusBadgeColor> = { active: 'success', closed: 'secondary', pending: 'warning', draft: 'tertiary' };
  return map[status] ?? 'secondary';
}

export function contractTypeLabel(ct: ContractType): string {
  const map: Record<ContractType, string> = { prime: 'Prime Contract', subcontract: 'Subcontract', 'purchase-order': 'Purchase Order' };
  return map[ct];
}

export function contractTypeIcon(ct: ContractType): string {
  const map: Record<ContractType, string> = { prime: 'content_copy', subcontract: 'assignment', 'purchase-order': 'shopping_cart' };
  return map[ct];
}

export function contractTypeLabelShort(ct: ContractType): string {
  const map: Record<ContractType, string> = { prime: 'Prime', subcontract: 'Subcontract', 'purchase-order': 'PO' };
  return map[ct];
}

export function inspectionResultBadge(result: InspectionResult): ModusBadgeColor {
  const map: Record<InspectionResult, ModusBadgeColor> = { pass: 'success', fail: 'danger', conditional: 'warning', pending: 'secondary' };
  return map[result] ?? 'secondary';
}

export function punchPriorityBadge(priority: string): ModusBadgeColor {
  const map: Record<string, ModusBadgeColor> = { high: 'danger', medium: 'warning', low: 'secondary' };
  return map[priority] ?? 'secondary';
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000).toLocaleString()}K`;
  return '$' + value.toLocaleString();
}
export function getProjectWeather(projectId: number) {
  return PROJECT_WEATHER_DATA.find(w => w.projectId === projectId);
}

const WEATHER_ICON_MAP: Record<string, string> = {
  sunny: 'sun', 'partly-cloudy': 'cloud', 'partly cloudy': 'cloud',
  cloudy: 'cloud', overcast: 'cloud',
  rain: 'raindrop', rainy: 'raindrop',
  thunderstorm: 'thunderstorm_heavy', storm: 'thunderstorm_heavy',
  snow: 'snowflake', snowy: 'snowflake',
  windy: 'wind', hot: 'sun',
  clear: 'sun', fog: 'cloud',
};

const WEATHER_COLOR_MAP: Record<string, string> = {
  sunny: 'text-warning', clear: 'text-warning', hot: 'text-warning',
  'partly-cloudy': 'text-foreground-60', 'partly cloudy': 'text-foreground-60',
  cloudy: 'text-foreground-40', overcast: 'text-foreground-40', fog: 'text-foreground-40',
  rain: 'text-primary', rainy: 'text-primary',
  thunderstorm: 'text-destructive', storm: 'text-destructive',
  snow: 'text-primary', snowy: 'text-primary',
  windy: 'text-foreground-60',
};

export function weatherIcon(condition: string): string {
  return WEATHER_ICON_MAP[condition.toLowerCase()] ?? 'cloud';
}

export function weatherIconColor(condition: string): string {
  return WEATHER_COLOR_MAP[condition.toLowerCase()] ?? 'text-foreground-60';
}

export function workImpactBadge(impact: 'none' | 'minor' | 'major'): { cls: string; label: string } {
  if (impact === 'major') return { cls: 'bg-destructive-20 text-destructive', label: 'Major impact' };
  if (impact === 'minor') return { cls: 'bg-warning-20 text-warning', label: 'Minor impact' };
  return { cls: 'bg-success-20 text-success', label: 'No impact' };
}
function parseAmount(s: string): number {
  const clean = s.replace(/[^0-9.KMkm]/g, '');
  if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean);
}

function buildProjectJobCosts(): ProjectJobCost[] {
  return PROJECTS.map(p => {
    const detail = PROJECT_DATA[p.id];
    const costs = {} as Record<JobCostCategory, number>;
    for (const cat of JOB_COST_CATEGORIES) {
      const entry = detail.budgetBreakdown.find((b: BudgetBreakdown) => b.label === cat);
      costs[cat] = entry ? parseAmount(entry.amount) : 0;
    }
    return {
      projectId: p.id,
      projectName: p.name,
      client: p.client,
      budgetUsed: p.budgetUsed,
      budgetTotal: p.budgetTotal,
      budgetPct: p.budgetPct,
      costs,
    };
  });
}

let _projectJobCosts: ProjectJobCost[] | null = null;
export function getProjectJobCosts(): ProjectJobCost[] {
  if (!_projectJobCosts) _projectJobCosts = buildProjectJobCosts();
  return _projectJobCosts;
}

export function getJobCostSummary(): { categories: JobCostCategorySummary[]; grandTotal: number } {
  const costs = getProjectJobCosts();
  const totals: Record<string, number> = {};
  let grandTotal = 0;
  for (const cat of JOB_COST_CATEGORIES) totals[cat] = 0;
  for (const p of costs) {
    for (const cat of JOB_COST_CATEGORIES) {
      totals[cat] += p.costs[cat];
      grandTotal += p.costs[cat];
    }
  }
  const categories: JobCostCategorySummary[] = JOB_COST_CATEGORIES.map(cat => ({
    label: cat,
    total: totals[cat],
    pct: grandTotal > 0 ? Math.round((totals[cat] / grandTotal) * 100) : 0,
    colorClass: CATEGORY_COLORS[cat],
  }));
  return { categories, grandTotal };
}
const VENDOR_POOLS: Record<JobCostCategory, string[]> = {
  Labor: ['Apex Staffing', 'BuildForce LLC', 'ProCrew Solutions', 'Iron Workers Local 63', 'Master Electricians Inc', 'Allied Plumbing Co', 'Summit Labor Group', 'Pacific Workforce'],
  Materials: ['Trimble Supply Co', 'BlueScope Steel', 'Summit Concrete', 'Pacific Lumber', 'Atlas Hardware', 'BuildRight Materials', 'CoreSteel Distributors', 'Cascade Rebar'],
  Equipment: ['United Rentals', 'Sunbelt Rentals', 'Hertz Equipment', 'Caterpillar Dealer', 'Komatsu West', 'Crane Solutions Inc', 'Heavy Lift Co', 'ProEquip Rentals'],
  Subcontractors: ['Meridian Electric', 'Cascade Plumbing', 'Summit HVAC', 'Pacific Drywall', 'Precision Glazing', 'Atlas Roofing Co', 'Foundation Specialists', 'Metro Paving'],
  Overhead: ['Trimble Insurance', 'City Permits Office', 'SafeWork Inspections', 'Project Controls LLC', 'EnviroTest Labs', 'Legal & Compliance Co', 'Bond Surety Inc', 'Site Security Corp'],
};

const DESC_POOLS: Record<JobCostCategory, string[]> = {
  Labor: ['Weekly payroll', 'Overtime hours', 'Foreman wages', 'Apprentice hours', 'Safety training labor', 'Crew mobilization', 'Night shift premium', 'Holiday pay differential'],
  Materials: ['Structural steel delivery', 'Concrete pour batch', 'Rebar shipment', 'Lumber package', 'Electrical conduit', 'Plumbing fixtures', 'Insulation materials', 'Drywall sheets'],
  Equipment: ['Crane rental - monthly', 'Excavator rental', 'Concrete pump rental', 'Scaffolding lease', 'Generator rental', 'Forklift rental', 'Compressor rental', 'Aerial lift rental'],
  Subcontractors: ['Progress payment', 'Milestone completion', 'Change order work', 'Punch list items', 'Specialty installation', 'System commissioning', 'Final inspection prep', 'Warranty work'],
  Overhead: ['Monthly insurance premium', 'Permit fees', 'Safety inspection', 'Project management fee', 'Environmental testing', 'Legal review', 'Bond premium', 'Site security service'],
};

function buildSubledger(projectId: number, category: JobCostCategory, totalAmount: number): SubledgerTransaction[] {
  const seed = projectId * 31 + JOB_COST_CATEGORIES.indexOf(category) * 17;
  const rng = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 4973) * 49297;
    return x - Math.floor(x);
  };

  const txCount = 12 + Math.floor(rng(0) * 18);
  const vendors = VENDOR_POOLS[category];
  const descs = DESC_POOLS[category];

  const rawWeights = Array.from({ length: txCount }, (_, i) => 0.3 + rng(i + 100) * 1.4);
  const wSum = rawWeights.reduce((a, b) => a + b, 0);

  const startDate = new Date(2025, 2 + Math.floor(rng(200) * 3), 1 + Math.floor(rng(201) * 15));
  const endDate = new Date(2026, 1 + Math.floor(rng(202) * 2), 1 + Math.floor(rng(203) * 25));
  const span = endDate.getTime() - startDate.getTime();

  const txs: SubledgerTransaction[] = [];
  let running = 0;
  let remaining = totalAmount;

  for (let i = 0; i < txCount; i++) {
    const isLast = i === txCount - 1;
    const raw = isLast ? remaining : Math.round((rawWeights[i] / wSum) * totalAmount);
    const amount = Math.min(raw, remaining);
    remaining -= amount;
    running += amount;

    const t = (i + rng(i + 300) * 0.5) / txCount;
    const date = new Date(startDate.getTime() + t * span);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    txs.push({
      id: `${projectId}-${category}-${i}`,
      date: dateStr,
      description: descs[Math.floor(rng(i + 400) * descs.length)],
      vendor: vendors[Math.floor(rng(i + 500) * vendors.length)],
      reference: `${category.substring(0, 3).toUpperCase()}-${String(projectId).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
      amount,
      runningTotal: running,
    });
  }

  return txs;
}

const _subledgerCache: Record<string, SubledgerTransaction[]> = {};
export function getSubledger(projectId: number, category: JobCostCategory): SubledgerTransaction[] {
  const key = `${projectId}:${category}`;
  if (!_subledgerCache[key]) {
    const costs = getProjectJobCosts();
    const project = costs.find(p => p.projectId === projectId);
    const total = project ? project.costs[category] : 0;
    _subledgerCache[key] = buildSubledger(projectId, category, total);
  }
  return _subledgerCache[key];
}
const CATEGORY_ICONS: Record<UrgentNeedCategory, string> = {
  rfi: 'clipboard',
  submittal: 'document',
  budget: 'account_balance',
  schedule: 'calendar',
  inspection: 'shield',
  safety: 'warning',
  'change-order': 'swap_horiz',
  quality: 'bug',
};

export function urgentNeedCategoryIcon(cat: UrgentNeedCategory): string {
  return CATEGORY_ICONS[cat] ?? 'info';
}

const _projectSlugMap = new Map<number, { name: string; slug: string }>();
export function getProjectMeta(id: number): { name: string; slug: string } {
  if (!_projectSlugMap.size) {
    for (const p of PROJECTS) _projectSlugMap.set(p.id, { name: p.name, slug: p.slug });
  }
  return _projectSlugMap.get(id) ?? { name: 'Unknown', slug: '' };
}

export function buildUrgentNeeds(rfis: Rfi[], submittals: Submittal[]): UrgentNeedItem[] {

  const seen = new Set<string>();
  const items: UrgentNeedItem[] = [];

  for (const pa of PROJECT_ATTENTION_ITEMS) {
    const meta = getProjectMeta(pa.projectId);
    const cat = (pa.category || 'schedule') as UrgentNeedCategory;
    const pageGroup = ['rfi', 'submittal', 'inspection', 'safety', 'quality'].includes(cat) ? 'records' : (['budget', 'change-order'].includes(cat) ? 'financials' : 'dashboard');
    const subpageMap: Record<string, string> = {
      rfi: 'rfis', submittal: 'submittals', inspection: 'inspections',
      budget: 'budget', 'change-order': 'change-orders',
      safety: 'safety-notices', quality: 'punch-items',
    };
    const subpage = subpageMap[cat];

    let qp: Record<string, string> = subpage ? { page: pageGroup, subpage } : { page: 'dashboard' };

    const upperTitle = pa.title.toUpperCase();
    const rfiMatch = upperTitle.match(/RFI-(\d+)/);
    if (rfiMatch) {
      const rfiId = String(parseInt(rfiMatch[1], 10));
      const rfi = rfis.find(r => r.id === rfiId);
      if (rfi) qp = { view: 'rfi', id: rfiId, page: 'records', subpage: 'rfis' };
      seen.add(`rfi-${rfiMatch[1]}`);
    }
    const subMatch = upperTitle.match(/SUB-(\d+)/);
    if (subMatch) {
      const subId = String(parseInt(subMatch[1], 10));
      const sub = submittals.find(s => s.id === subId);
      if (sub) qp = { view: 'submittal', id: subId, page: 'records', subpage: 'submittals' };
      seen.add(`sub-${subMatch[1]}`);
    }
    const coMatch = upperTitle.match(/CO-(\d+)/);
    if (coMatch) {
      const coId = `CO-${coMatch[1]}`;
      const co = CHANGE_ORDERS.find(c => c.id === coId);
      if (co) qp = { view: 'changeOrder', id: coId, page: 'financials', subpage: 'change-orders' };
      seen.add(`co-${coMatch[1]}`);
    }

    const finRoute = (cat === 'budget' || cat === 'change-order') ? `/financials/job-costs/${meta.slug}` : undefined;

    items.push({
      id: pa.id,
      projectId: pa.projectId,
      projectName: meta.name,
      projectSlug: meta.slug,
      title: pa.title,
      subtitle: pa.subtitle,
      severity: pa.severity,
      category: cat,
      route: `/project/${meta.slug}`,
      queryParams: qp,
      financialsRoute: finRoute,
    });
  }

  for (const rfi of rfis) {
    if (rfi.status !== 'overdue') continue;
    if (seen.has(`rfi-${rfi.id}`)) continue;
    const proj = PROJECTS.find(p => p.name === rfi.project);
    if (!proj) continue;
    items.push({
      id: `rfi-${rfi.id}`,
      projectId: proj.id,
      projectName: proj.name,
      projectSlug: proj.slug,
      title: `${rfi.number} overdue`,
      subtitle: `${rfi.subject} -- assigned to ${rfi.assignee}`,
      severity: 'critical',
      category: 'rfi',
      route: `/project/${proj.slug}`,
      queryParams: { view: 'rfi', id: rfi.id, page: 'records', subpage: 'rfis' },
    });
  }

  for (const sub of submittals) {
    if (sub.status !== 'overdue') continue;
    if (seen.has(`sub-${sub.id}`)) continue;
    const proj = PROJECTS.find(p => p.name === sub.project);
    if (!proj) continue;
    items.push({
      id: `sub-${sub.id}`,
      projectId: proj.id,
      projectName: proj.name,
      projectSlug: proj.slug,
      title: `${sub.number} overdue`,
      subtitle: `${sub.subject} -- assigned to ${sub.assignee}`,
      severity: 'critical',
      category: 'submittal',
      route: `/project/${proj.slug}`,
      queryParams: { view: 'submittal', id: sub.id, page: 'records', subpage: 'submittals' },
    });
  }

  for (const co of CHANGE_ORDERS) {
    if (co.status !== 'pending') continue;
    if (seen.has(`co-${co.id.replace('CO-', '')}`)) continue;
    const meta = getProjectMeta(co.projectId);
    items.push({
      id: `co-${co.id}`,
      projectId: co.projectId,
      projectName: meta.name,
      projectSlug: meta.slug,
      title: `${co.id} pending approval`,
      subtitle: `${co.description} -- $${(co.amount / 1000).toFixed(0)}K`,
      severity: 'warning',
      category: 'change-order',
      route: `/project/${meta.slug}`,
      queryParams: { page: 'financials', subpage: 'change-orders' },
      financialsRoute: `/financials/job-costs/${meta.slug}`,
    });
  }

  const budgetProjectIds = new Set(items.filter(i => i.category === 'budget').map(i => i.projectId));
  for (const p of PROJECTS) {
    if (budgetProjectIds.has(p.id)) continue;
    if (p.budgetPct >= 75) {
      const sev = p.budgetPct >= 90 ? 'critical' as const : 'warning' as const;
      items.push({
        id: `budget-auto-${p.id}`,
        projectId: p.id,
        projectName: p.name,
        projectSlug: p.slug,
        title: `Budget at ${p.budgetPct}%`,
        subtitle: `${p.budgetUsed} of ${p.budgetTotal} used -- ${100 - p.budgetPct}% remaining`,
        severity: sev,
        category: 'budget',
        route: `/project/${p.slug}`,
        queryParams: { page: 'financials', subpage: 'budget' },
        financialsRoute: `/financials/job-costs/${p.slug}`,
      });
    }
  }

  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  items.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));

  return items;
}

// ---------------------------------------------------------------------------
// Accounts Receivable helpers
// ---------------------------------------------------------------------------

export function getInvoiceAgingBuckets(invoices?: Invoice[]): AgingBucket[] {
  const src = invoices ?? INVOICES;
  const today = new Date();
  const outstanding = src.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'partially-paid');
  const buckets: AgingBucket[] = [
    { label: 'Current', minDays: -Infinity, maxDays: 0, total: 0, count: 0 },
    { label: '1-30', minDays: 1, maxDays: 30, total: 0, count: 0 },
    { label: '31-60', minDays: 31, maxDays: 60, total: 0, count: 0 },
    { label: '61-90', minDays: 61, maxDays: 90, total: 0, count: 0 },
    { label: '90+', minDays: 91, maxDays: Infinity, total: 0, count: 0 },
  ];
  for (const inv of outstanding) {
    const due = new Date(inv.dueDate);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86_400_000);
    const owed = inv.amount - inv.amountPaid;
    const bucket = buckets.find(b => daysOverdue >= b.minDays && daysOverdue <= b.maxDays) ?? buckets[4];
    bucket.total += owed;
    bucket.count += 1;
  }
  return buckets;
}

export function getDSO(invoices?: Invoice[]): number {
  const src = invoices ?? INVOICES;
  const paid = src.filter(i => i.status === 'paid' && i.paidDate);
  if (paid.length === 0) return 0;
  let totalDays = 0;
  let totalAmount = 0;
  for (const inv of paid) {
    const issue = new Date(inv.issueDate).getTime();
    const paidAt = new Date(inv.paidDate!).getTime();
    const days = Math.max(0, Math.floor((paidAt - issue) / 86_400_000));
    totalDays += days * inv.amount;
    totalAmount += inv.amount;
  }
  return totalAmount > 0 ? Math.round(totalDays / totalAmount) : 0;
}

export function invoiceStatusBadge(status: InvoiceStatus): ModusBadgeColor {
  const map: Record<InvoiceStatus, ModusBadgeColor> = {
    draft: 'secondary',
    sent: 'primary',
    paid: 'success',
    overdue: 'danger',
    'partially-paid': 'warning',
    void: 'secondary',
  };
  return map[status] ?? 'secondary';
}

// ---------------------------------------------------------------------------
// Job Billing helpers
// ---------------------------------------------------------------------------

export function getUpcomingBillings(days = 30, events?: BillingEvent[]): BillingEvent[] {
  const src = events ?? BILLING_EVENTS;
  const today = new Date();
  const cutoff = new Date(today.getTime() + days * 86_400_000);
  return src
    .filter(e => e.status === 'scheduled' && new Date(e.billingDate) <= cutoff)
    .sort((a, b) => new Date(a.billingDate).getTime() - new Date(b.billingDate).getTime());
}

export function billingFrequencyLabel(freq: BillingFrequency): string {
  const map: Record<BillingFrequency, string> = {
    monthly: 'Monthly',
    milestone: 'Milestone',
    progress: 'Progress',
    'upon-completion': 'Upon Completion',
  };
  return map[freq] ?? freq;
}

// ---------------------------------------------------------------------------
// Accounts Payable helpers
// ---------------------------------------------------------------------------

export function getPayablesSummary(payables?: Payable[]): Record<PayableStatus, { count: number; total: number }> {
  const src = payables ?? PAYABLES;
  const result: Record<string, { count: number; total: number }> = {};
  for (const status of ['pending', 'approved', 'paid', 'overdue', 'disputed'] as PayableStatus[]) {
    result[status] = { count: 0, total: 0 };
  }
  for (const p of src) {
    const bucket = result[p.status];
    if (bucket) {
      bucket.count += 1;
      bucket.total += p.amount - p.amountPaid;
    }
  }
  return result as Record<PayableStatus, { count: number; total: number }>;
}

export function payableStatusBadge(status: PayableStatus): ModusBadgeColor {
  const map: Record<PayableStatus, ModusBadgeColor> = {
    pending: 'secondary',
    approved: 'primary',
    paid: 'success',
    overdue: 'danger',
    disputed: 'warning',
  };
  return map[status] ?? 'secondary';
}

// ---------------------------------------------------------------------------
// Cash Management helpers
// ---------------------------------------------------------------------------

export function getCashRunway(position?: typeof CASH_POSITION): number {
  const pos = position ?? CASH_POSITION;
  const monthlyBurn = pos.monthlyPayroll + pos.monthlyOverhead;
  return monthlyBurn > 0 ? Math.round((pos.currentBalance / monthlyBurn) * 10) / 10 : Infinity;
}

export function getCashFlowTrend(history?: CashFlowEntry[]): { months: string[]; inflows: number[]; outflows: number[]; net: number[] } {
  const src = history ?? CASH_FLOW_HISTORY;
  return {
    months: src.map(e => e.month),
    inflows: src.map(e => e.inflows),
    outflows: src.map(e => e.outflows),
    net: src.map(e => e.netCash),
  };
}

// ---------------------------------------------------------------------------
// General Ledger helpers
// ---------------------------------------------------------------------------

export function getGLBalanceSheet(accounts?: GLAccount[]): { assets: GLAccount[]; liabilities: GLAccount[]; equity: GLAccount[]; revenue: GLAccount[]; expenses: GLAccount[] } {
  const src = accounts ?? GL_ACCOUNTS;
  return {
    assets: src.filter(a => a.type === 'asset'),
    liabilities: src.filter(a => a.type === 'liability'),
    equity: src.filter(a => a.type === 'equity'),
    revenue: src.filter(a => a.type === 'revenue'),
    expenses: src.filter(a => a.type === 'expense'),
  };
}

// ---------------------------------------------------------------------------
// Purchase Order helpers
// ---------------------------------------------------------------------------

export function getPOSummary(orders?: PurchaseOrder[]): { totalValue: number; totalReceived: number; openPOs: number; overdueDeliveries: number; draftCount: number } {
  const src = orders ?? PURCHASE_ORDERS;
  const today = new Date().toISOString().split('T')[0];
  const open = src.filter(po => !['received', 'closed', 'cancelled'].includes(po.status));
  const overdue = open.filter(po => po.expectedDelivery < today);
  return {
    totalValue: src.reduce((s, po) => s + po.amount, 0),
    totalReceived: src.filter(po => ['received', 'closed'].includes(po.status)).reduce((s, po) => s + po.amount, 0),
    openPOs: open.length,
    overdueDeliveries: overdue.length,
    draftCount: src.filter(po => po.status === 'draft').length,
  };
}

export function poStatusBadge(status: PurchaseOrderStatus): ModusBadgeColor {
  const map: Record<PurchaseOrderStatus, ModusBadgeColor> = {
    draft: 'secondary',
    issued: 'primary',
    acknowledged: 'primary',
    'partially-received': 'warning',
    received: 'success',
    closed: 'secondary',
    cancelled: 'danger',
  };
  return map[status] ?? 'secondary';
}

// ---------------------------------------------------------------------------
// Payroll helpers
// ---------------------------------------------------------------------------

export function getPayrollSummary(records?: PayrollRecord[]): { totalGross: number; totalTaxes: number; totalBenefits: number; totalNet: number; avgEmployees: number; totalOT: number; laborBurdenPct: number } {
  const src = records ?? PAYROLL_RECORDS;
  const processed = src.filter(r => r.status === 'processed');
  const totalGross = processed.reduce((s, r) => s + r.grossPay, 0);
  const totalTaxes = processed.reduce((s, r) => s + r.taxes, 0);
  const totalBenefits = processed.reduce((s, r) => s + r.benefits, 0);
  const totalNet = processed.reduce((s, r) => s + r.netPay, 0);
  const avgEmployees = processed.length > 0 ? Math.round(processed.reduce((s, r) => s + r.employeeCount, 0) / processed.length) : 0;
  const totalOT = processed.reduce((s, r) => s + r.overtimeHours, 0);
  const laborBurdenPct = totalGross > 0 ? Math.round(((totalTaxes + totalBenefits) / totalGross) * 1000) / 10 : 0;
  return { totalGross, totalTaxes, totalBenefits, totalNet, avgEmployees, totalOT, laborBurdenPct };
}

export function getMonthlyPayrollTotals(records?: PayrollRecord[]): { month: string; gross: number; net: number; headcount: number }[] {
  const src = records ?? PAYROLL_RECORDS;
  const byMonth = new Map<string, { gross: number; net: number; counts: number[]}>();
  for (const r of src.filter(p => p.status === 'processed')) {
    const month = r.period.split(' - ')[0];
    const entry = byMonth.get(month) ?? { gross: 0, net: 0, counts: [] };
    entry.gross += r.grossPay;
    entry.net += r.netPay;
    entry.counts.push(r.employeeCount);
    byMonth.set(month, entry);
  }
  return Array.from(byMonth.entries()).map(([month, v]) => ({
    month,
    gross: v.gross,
    net: v.net,
    headcount: Math.round(v.counts.reduce((a, b) => a + b, 0) / v.counts.length),
  }));
}

export function payrollStatusBadge(status: PayrollStatus): ModusBadgeColor {
  const map: Record<PayrollStatus, ModusBadgeColor> = {
    processed: 'success',
    pending: 'warning',
    scheduled: 'secondary',
  };
  return map[status] ?? 'secondary';
}

// ---------------------------------------------------------------------------
// Contract summary helpers
// ---------------------------------------------------------------------------

export function getContractSummary(contracts?: Contract[]): { totalOriginal: number; totalRevised: number; activeCount: number; pendingCount: number; totalRetainage: number; primeCount: number; subCount: number } {
  const src = contracts ?? CONTRACTS;
  const totalOriginal = src.reduce((s, c) => s + c.originalValue, 0);
  const totalRevised = src.reduce((s, c) => s + c.revisedValue, 0);
  const activeCount = src.filter(c => c.status === 'active').length;
  const pendingCount = src.filter(c => c.status === 'pending').length;
  const totalRetainage = src.reduce((s, c) => s + (c.revisedValue * c.retainage / 100), 0);
  const primeCount = src.filter(c => c.contractType === 'prime').length;
  const subCount = src.filter(c => c.contractType === 'subcontract').length;
  return { totalOriginal, totalRevised, activeCount, pendingCount, totalRetainage, primeCount, subCount };
}

// ---------------------------------------------------------------------------
// Subcontract Ledger helpers
// ---------------------------------------------------------------------------

export function getSubcontractLedgerSummary(entries?: SubcontractLedgerEntry[]): { totalPaid: number; totalRetainageHeld: number; totalRetainageReleased: number; totalBackcharges: number; totalChangeOrders: number; entryCount: number } {
  const src = entries ?? SUBCONTRACT_LEDGER;
  const totalPaid = src.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
  const totalRetainageHeld = Math.abs(src.filter(e => e.type === 'retainage-held').reduce((s, e) => s + e.amount, 0));
  const totalRetainageReleased = src.filter(e => e.type === 'retainage-release').reduce((s, e) => s + e.amount, 0);
  const totalBackcharges = Math.abs(src.filter(e => e.type === 'backcharge').reduce((s, e) => s + e.amount, 0));
  const totalChangeOrders = src.filter(e => e.type === 'change-order').reduce((s, e) => s + e.amount, 0);
  return { totalPaid, totalRetainageHeld, totalRetainageReleased, totalBackcharges, totalChangeOrders, entryCount: src.length };
}

export function ledgerTypeBadge(type: SubcontractLedgerType): ModusBadgeColor {
  const map: Record<SubcontractLedgerType, ModusBadgeColor> = {
    payment: 'success',
    'retainage-held': 'warning',
    'retainage-release': 'primary',
    backcharge: 'danger',
    'change-order': 'tertiary',
    withholding: 'secondary',
  };
  return map[type] ?? 'secondary';
}

export function formatJobCost(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

export function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ledgerTypeLabel(type: SubcontractLedgerType): string {
  const map: Record<SubcontractLedgerType, string> = {
    payment: 'Payment',
    'retainage-held': 'Retainage Held',
    'retainage-release': 'Retainage Release',
    backcharge: 'Backcharge',
    'change-order': 'Change Order',
    withholding: 'Withholding',
  };
  return map[type] ?? type;
}
