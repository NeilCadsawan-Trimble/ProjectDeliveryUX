import type { Project, UrgentNeedItem, ChangeOrder } from '../../data/dashboard-data';
import type { Risk } from '../../data/project-data';

export interface AgentProjectData {
  urgentNeeds: UrgentNeedItem[];
  criticalCount: number;
  warningCount: number;
  coreWarningCount: number;
  topNeed: UrgentNeedItem | null;
  budgetAlert: boolean;
  jobCostSpend: string | null;
}

export const STATUS_SEVERITY: Record<string, number> = {
  'Overdue': 4,
  'At Risk': 3,
  'On Track': 2,
  'Planning': 1,
};

export function parseAmount(s: string): number {
  const clean = s.replace(/[^0-9.KMkm]/g, '');
  if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean) || 0;
}

export function fmtRemaining(used: string, total: string): string {
  const rem = parseAmount(total) - parseAmount(used);
  if (rem >= 1_000_000) return `$${(rem / 1_000_000).toFixed(1)}M`;
  if (rem >= 1_000) return `$${Math.round(rem / 1_000)}K`;
  if (rem <= 0) return '$0';
  return `$${rem.toLocaleString()}`;
}

export function rewriteDynamicNeeds(
  rawNeeds: UrgentNeedItem[],
  project: Project,
  changeOrders: ChangeOrder[],
  now: Date = new Date(),
): UrgentNeedItem[] {
  return rawNeeds.map(n => {
    if (n.category === 'budget') {
      const severity: 'critical' | 'warning' | 'info' =
        project.budgetPct >= 95 ? 'critical' : project.budgetPct >= 75 ? 'warning' : 'info';
      const remaining = fmtRemaining(project.budgetUsed, project.budgetTotal);
      const workLeft = 100 - project.progress;
      return {
        ...n,
        title: project.budgetPct >= 95 ? `Budget critical at ${project.budgetPct}%` : `Budget at ${project.budgetPct}%`,
        subtitle: `${remaining} remaining with ${workLeft}% of work left`,
        severity,
      };
    }
    if (n.category === 'schedule' && /overdue|late/i.test(n.title)) {
      const due = new Date(project.dueDate);
      const isActuallyLate = now.getTime() > due.getTime();

      if (project.status === 'Overdue' && isActuallyLate) {
        const daysLate = Math.max(1, Math.round((now.getTime() - due.getTime()) / 86_400_000));
        return {
          ...n,
          title: `Project ${daysLate} days overdue`,
          subtitle: `Was due ${project.dueDate} -- schedule recovery plan under review`,
          severity: 'critical' as const,
        };
      }

      return {
        ...n,
        title: isActuallyLate
          ? `Due date passed (${project.dueDate})`
          : `Due ${project.dueDate}`,
        subtitle: isActuallyLate
          ? `Project status: ${project.status} -- original due date passed`
          : `Schedule extended -- was previously at risk`,
        severity: 'info' as const,
      };
    }
    if (n.category === 'change-order') {
      const coMatch = n.title.toUpperCase().match(/CO-(\d+)/);
      if (coMatch) {
        const coId = `CO-${coMatch[1]}`;
        const co = changeOrders.find(c => c.id === coId);
        if (co) {
          const fmtAmt = co.amount >= 1_000_000
            ? `$${(co.amount / 1_000_000).toFixed(1)}M`
            : `$${Math.round(co.amount / 1_000)}K`;
          return {
            ...n,
            title: co.status === 'pending' ? `${coId} awaiting approval` : `${coId} ${co.status}`,
            subtitle: `${co.description} -- ${fmtAmt} impact to budget`,
            severity: co.status === 'pending' ? ('warning' as const) : ('info' as const),
          };
        }
      }
    }
    return n;
  });
}

export function injectScheduleOverdue(
  needs: UrgentNeedItem[],
  project: Project,
  now: Date = new Date(),
): UrgentNeedItem[] {
  if (project.status !== 'Overdue') return needs;
  const dueDate = new Date(project.dueDate);
  if (isNaN(dueDate.getTime())) return needs;
  if (now.getTime() <= dueDate.getTime()) return needs;
  if (needs.some(n => n.category === 'schedule' && n.severity !== 'info')) return needs;

  const daysLate = Math.max(1, Math.round((now.getTime() - dueDate.getTime()) / 86_400_000));

  return [...needs, {
    id: `schedule-auto-${project.id}`,
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    title: `Project ${daysLate} days overdue`,
    subtitle: `Was due ${project.dueDate} -- schedule recovery plan under review`,
    severity: 'critical' as const,
    category: 'schedule',
    route: `/project/${project.slug}`,
    queryParams: { page: 'dashboard' },
  }];
}

export function sortProjectsByUrgency(
  projects: Project[],
  agentData: Map<number, AgentProjectData>,
): number[] {
  const indices = projects.map((_, i) => i);
  indices.sort((a, b) => {
    const pa = projects[a], pb = projects[b];
    const aa = agentData.get(pa.id), ab = agentData.get(pb.id);
    const critA = aa?.criticalCount ?? 0, critB = ab?.criticalCount ?? 0;
    if (critA !== critB) return critB - critA;
    const warnA = aa?.coreWarningCount ?? 0, warnB = ab?.coreWarningCount ?? 0;
    if (warnA !== warnB) return warnB - warnA;
    const sevA = STATUS_SEVERITY[pa.status] ?? 0, sevB = STATUS_SEVERITY[pb.status] ?? 0;
    if (sevA !== sevB) return sevB - sevA;
    return (pb.budgetPct ?? 0) - (pa.budgetPct ?? 0);
  });
  return indices;
}

const BUDGET_RISK_RE = /budget/i;

export function rewriteBudgetRisk(risk: Risk, project: Project): Risk {
  if (!BUDGET_RISK_RE.test(risk.title)) return risk;
  const remaining = fmtRemaining(project.budgetUsed, project.budgetTotal);
  const severity: Risk['severity'] =
    project.budgetPct >= 95 ? 'high' : project.budgetPct >= 75 ? 'medium' : 'low';
  const titlePrefix = project.budgetPct >= 95 ? 'Budget critical' : 'Budget at';
  return {
    ...risk,
    title: `${titlePrefix} ${project.budgetPct}% -- ${remaining} remaining`,
    impact: risk.impact
      .replace(/\d+%\s*budget\s*used/i, `${project.budgetPct}% budget used`)
      .replace(/\$[\d.]+[KMkm]?\s*remaining/i, `${remaining} remaining`),
    severity,
  };
}
