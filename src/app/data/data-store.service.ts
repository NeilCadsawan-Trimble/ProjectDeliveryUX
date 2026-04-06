import { Injectable, computed, signal } from '@angular/core';
import type {
  ActivityItem,
  BillingEvent,
  BillingSchedule,
  BudgetHistoryPoint,
  CalendarAppointment,
  CashFlowEntry,
  CashPosition,
  ChangeOrder,
  ChangeOrderStatus,
  Contract,
  ContractStatus,
  DailyReport,
  Estimate,
  EstimateStatus,
  GLAccount,
  GLEntry,
  Inspection,
  InspectionResult,
  Invoice,
  InvoiceStatus,
  JobCostCategory,
  Payable,
  PayableStatus,
  PayrollRecord,
  Project,
  ProjectAttentionItem,
  ProjectJobCost,
  ProjectCalendarEvent,
  ProjectRevenue,
  ProjectStatus,
  ProjectWeather,
  PunchListItem,
  PurchaseOrder,
  PurchaseOrderStatus,
  RevenueDataPoint,
  RevenueTimeRange,
  Rfi,
  RfiStatus,
  Submittal,
  SubmittalStatus,
  SubcontractLedgerEntry,
  TimeOffRequest,
  TimeOffStatus,
  WeatherForecast,
} from './dashboard-data.types';
import { JOB_COST_CATEGORIES } from './dashboard-data.types';
import {
  ACTIVITIES,
  ATTENTION_ITEMS,
  BILLING_EVENTS,
  BILLING_SCHEDULES,
  BUDGET_HISTORY_BY_PROJECT,
  CALENDAR_APPOINTMENTS,
  CASH_FLOW_HISTORY,
  CASH_POSITION,
  CHANGE_ORDERS,
  CONTRACTS,
  DAILY_REPORTS,
  ESTIMATES,
  GL_ACCOUNTS,
  GL_ENTRIES,
  INSPECTIONS,
  INVOICES,
  MONTHLY_REVENUE,
  ANNUAL_TOTALS,
  PAYABLES,
  PAYROLL_RECORDS,
  PROJECTS,
  PROJECT_ATTENTION_ITEMS,
  PROJECT_CALENDAR_EVENTS,
  PROJECT_REVENUE,
  PROJECT_WEATHER_DATA,
  PUNCH_LIST_ITEMS,
  PURCHASE_ORDERS,
  RFIS_SEED,
  SUBCONTRACT_LEDGER,
  SUBMITTALS_SEED,
  TIME_OFF_REQUESTS,
  WEATHER_FORECAST,
} from './dashboard-data.seed';
import { PROJECT_DATA, type BudgetBreakdown, type ProjectDashboardData } from './project-data';

interface AttentionItem {
  id: number;
  title: string;
  subtitle: string;
  dotClass: string;
}

function parseAmount(s: string): number {
  const clean = s.replace(/[^0-9.KMkm]/g, '');
  if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean);
}

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  readonly rfis = signal<Rfi[]>([...RFIS_SEED]);
  readonly submittals = signal<Submittal[]>([...SUBMITTALS_SEED]);
  readonly changeOrders = signal<ChangeOrder[]>([...CHANGE_ORDERS]);
  readonly estimates = signal<Estimate[]>([...ESTIMATES]);
  readonly timeOffRequests = signal<TimeOffRequest[]>([...TIME_OFF_REQUESTS]);

  readonly projects = signal<Project[]>([...PROJECTS]);
  readonly projectDetailData = signal<Record<number, ProjectDashboardData>>(structuredClone(PROJECT_DATA));
  readonly weatherData = signal<ProjectWeather[]>([...PROJECT_WEATHER_DATA]);
  readonly budgetHistory = signal<Record<number, BudgetHistoryPoint[]>>(structuredClone(BUDGET_HISTORY_BY_PROJECT));

  readonly invoices = signal<Invoice[]>([...INVOICES]);
  readonly billingEvents = signal<BillingEvent[]>([...BILLING_EVENTS]);
  readonly billingSchedules = signal<BillingSchedule[]>([...BILLING_SCHEDULES]);
  readonly payables = signal<Payable[]>([...PAYABLES]);
  readonly cashFlowHistory = signal<CashFlowEntry[]>([...CASH_FLOW_HISTORY]);
  readonly cashPosition = signal<CashPosition>({ ...CASH_POSITION });
  readonly glAccounts = signal<GLAccount[]>([...GL_ACCOUNTS]);
  readonly glEntries = signal<GLEntry[]>([...GL_ENTRIES]);
  readonly purchaseOrders = signal<PurchaseOrder[]>([...PURCHASE_ORDERS]);
  readonly payrollRecords = signal<PayrollRecord[]>([...PAYROLL_RECORDS]);
  readonly contracts = signal<Contract[]>([...CONTRACTS]);
  readonly subcontractLedger = signal<SubcontractLedgerEntry[]>([...SUBCONTRACT_LEDGER]);
  readonly inspections = signal<Inspection[]>([...INSPECTIONS]);
  readonly punchListItems = signal<PunchListItem[]>([...PUNCH_LIST_ITEMS]);
  readonly activities = signal<ActivityItem[]>([...ACTIVITIES]);
  readonly calendarAppointments = signal<CalendarAppointment[]>([...CALENDAR_APPOINTMENTS]);
  readonly projectCalendarEvents = signal<ProjectCalendarEvent[]>([...PROJECT_CALENDAR_EVENTS]);
  readonly dailyReports = signal<DailyReport[]>([...DAILY_REPORTS]);
  readonly projectRevenue = signal<ProjectRevenue[]>([...PROJECT_REVENUE]);
  readonly monthlyRevenue = signal<Record<RevenueTimeRange, RevenueDataPoint[]>>(structuredClone(MONTHLY_REVENUE));
  readonly annualTotals = signal<Record<RevenueTimeRange, { current: number; previous: number; label: string }>>(structuredClone(ANNUAL_TOTALS));
  readonly weatherForecast = signal<WeatherForecast[]>([...WEATHER_FORECAST]);
  readonly projectAttentionItems = signal<ProjectAttentionItem[]>([...PROJECT_ATTENTION_ITEMS]);
  readonly attentionItems = signal<AttentionItem[]>([...ATTENTION_ITEMS]);

  readonly projectJobCosts = computed<ProjectJobCost[]>(() => {
    const projs = this.projects();
    const details = this.projectDetailData();
    return projs.map(p => {
      const detail = details[p.id];
      const costs = {} as Record<JobCostCategory, number>;
      for (const cat of JOB_COST_CATEGORIES) {
        const entry = detail?.budgetBreakdown?.find((b: BudgetBreakdown) => b.label === cat);
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
  });

  getProjectWeather(projectId: number): ProjectWeather | undefined {
    return this.weatherData().find(w => w.projectId === projectId);
  }

  getProjectBudgetHistory(projectId: number): BudgetHistoryPoint[] {
    return this.budgetHistory()[projectId] ?? [];
  }

  findProjectBySlug(slug: string): Project | undefined {
    return this.projects().find(p => p.slug === slug);
  }

  findProjectById(id: number): Project | undefined {
    return this.projects().find(p => p.id === id);
  }

  updateProjectStatus(projectId: number, newStatus: ProjectStatus): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
    );
  }

  updateProject(projectId: number, patch: Partial<Project>): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, ...patch } : p)
    );
  }

  updateProjectDetail(projectId: number, patch: Partial<ProjectDashboardData>): void {
    this.projectDetailData.update(data => ({
      ...data,
      [projectId]: { ...data[projectId], ...patch },
    }));
  }

  updateWeather(projectId: number, patch: Partial<ProjectWeather>): void {
    this.weatherData.update(list =>
      list.map(w => w.projectId === projectId ? { ...w, ...patch } : w)
    );
  }

  updateBudgetHistory(projectId: number, points: BudgetHistoryPoint[]): void {
    this.budgetHistory.update(data => ({ ...data, [projectId]: points }));
  }

  updateRfiStatus(id: string, newStatus: RfiStatus): void {
    this.rfis.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
  }

  updateSubmittalStatus(id: string, newStatus: SubmittalStatus): void {
    this.submittals.update(list =>
      list.map(s => s.id === id ? { ...s, status: newStatus } : s)
    );
  }

  updateChangeOrderStatus(id: string, newStatus: ChangeOrderStatus): void {
    this.changeOrders.update(list =>
      list.map(co => co.id === id ? { ...co, status: newStatus } : co)
    );
  }

  updateEstimateStatus(id: string, newStatus: EstimateStatus): void {
    this.estimates.update(list =>
      list.map(e => e.id === id ? { ...e, status: newStatus } : e)
    );
  }

  updateTimeOffStatus(id: number, newStatus: TimeOffStatus): void {
    this.timeOffRequests.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
  }

  updateInvoiceStatus(id: string, newStatus: InvoiceStatus): void {
    this.invoices.update(list =>
      list.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv)
    );
  }

  updatePayableStatus(id: string, newStatus: PayableStatus): void {
    this.payables.update(list =>
      list.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );
  }

  updatePurchaseOrderStatus(id: string, newStatus: PurchaseOrderStatus): void {
    this.purchaseOrders.update(list =>
      list.map(po => po.id === id ? { ...po, status: newStatus } : po)
    );
  }

  updateInspectionResult(id: string, newResult: InspectionResult): void {
    this.inspections.update(list =>
      list.map(i => i.id === id ? { ...i, result: newResult } : i)
    );
  }

  updatePunchListStatus(id: string, newStatus: 'open' | 'in-progress' | 'completed' | 'verified'): void {
    this.punchListItems.update(list =>
      list.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );
  }

  updateContractStatus(id: string, newStatus: ContractStatus): void {
    this.contracts.update(list =>
      list.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
  }

  updateChangeOrderAmount(id: string, amount: number): void {
    this.changeOrders.update(list =>
      list.map(co => co.id === id ? { ...co, amount } : co)
    );
  }

  updateInvoiceAmount(id: string, amount: number): void {
    this.invoices.update(list =>
      list.map(inv => inv.id === id ? { ...inv, amount } : inv)
    );
  }

  updatePayableAmount(id: string, amount: number): void {
    this.payables.update(list =>
      list.map(p => p.id === id ? { ...p, amount } : p)
    );
  }

  updatePurchaseOrderAmount(id: string, amount: number): void {
    this.purchaseOrders.update(list =>
      list.map(po => po.id === id ? { ...po, amount } : po)
    );
  }

  updateCashPosition(patch: Partial<CashPosition>): void {
    this.cashPosition.update(cp => ({ ...cp, ...patch }));
  }

  updateEstimateValue(id: string, valueRaw: number): void {
    const fmtValue = valueRaw >= 1_000_000
      ? `$${(valueRaw / 1_000_000).toFixed(1)}M`
      : valueRaw >= 1_000
        ? `$${Math.round(valueRaw / 1_000)}K`
        : `$${valueRaw}`;
    this.estimates.update(list =>
      list.map(e => e.id === id ? { ...e, valueRaw, value: fmtValue } : e)
    );
  }

  updateContractValue(id: string, revisedValue: number): void {
    this.contracts.update(list =>
      list.map(c => c.id === id ? { ...c, revisedValue } : c)
    );
  }

  updateBillingEvent(id: string, patch: Partial<Pick<BillingEvent, 'amount' | 'status'>>): void {
    this.billingEvents.update(list =>
      list.map(be => be.id === id ? { ...be, ...patch } : be)
    );
  }

  updatePayrollRecord(id: string, patch: Partial<Pick<PayrollRecord, 'grossPay' | 'netPay' | 'taxes' | 'benefits'>>): void {
    this.payrollRecords.update(list =>
      list.map(pr => pr.id === id ? { ...pr, ...patch } : pr)
    );
  }

  updateMilestoneStatus(projectId: number, milestoneId: number, status: string): void {
    this.projectDetailData.update(data => {
      const proj = data[projectId];
      if (!proj) return data;
      return {
        ...data,
        [projectId]: {
          ...proj,
          milestones: proj.milestones.map(m =>
            m.id === milestoneId ? { ...m, status: status as typeof m.status } : m
          ),
        },
      };
    });
  }

  updateTaskStatus(projectId: number, taskId: number, status: string): void {
    this.projectDetailData.update(data => {
      const proj = data[projectId];
      if (!proj) return data;
      return {
        ...data,
        [projectId]: {
          ...proj,
          tasks: proj.tasks.map(t =>
            t.id === taskId ? { ...t, status } : t
          ),
        },
      };
    });
  }

  updateRiskSeverity(projectId: number, riskId: number, severity: string): void {
    this.projectDetailData.update(data => {
      const proj = data[projectId];
      if (!proj) return data;
      return {
        ...data,
        [projectId]: {
          ...proj,
          risks: proj.risks.map(r =>
            r.id === riskId ? { ...r, severity: severity as typeof r.severity } : r
          ),
        },
      };
    });
  }

  adjustLatestRevenue(delta: number): void {
    this.monthlyRevenue.update(rev => {
      const updated = { ...rev } as Record<RevenueTimeRange, RevenueDataPoint[]>;
      for (const range of Object.keys(updated) as RevenueTimeRange[]) {
        const pts = [...updated[range]];
        if (pts.length > 0) {
          const last = pts[pts.length - 1];
          pts[pts.length - 1] = { ...last, value: Math.max(0, last.value + delta) };
        }
        updated[range] = pts;
      }
      return updated;
    });
    this.annualTotals.update(totals => {
      const updated = { ...totals };
      for (const range of Object.keys(updated) as RevenueTimeRange[]) {
        const entry = updated[range];
        updated[range] = { ...entry, current: Math.max(0, entry.current + delta) };
      }
      return updated;
    });
  }

  adjustCashFlowInflows(delta: number): void {
    this.cashFlowHistory.update(history => {
      if (history.length === 0) return history;
      const entries = [...history];
      const last = entries[entries.length - 1];
      const newInflows = Math.max(0, last.inflows + delta);
      const newNet = newInflows - last.outflows;
      entries[entries.length - 1] = {
        ...last,
        inflows: newInflows,
        netCash: newNet,
        runningBalance: last.runningBalance + delta,
      };
      return entries;
    });
  }

  adjustCashFlowOutflows(delta: number): void {
    this.cashFlowHistory.update(history => {
      if (history.length === 0) return history;
      const entries = [...history];
      const last = entries[entries.length - 1];
      const newOutflows = Math.max(0, last.outflows + delta);
      const newNet = last.inflows - newOutflows;
      entries[entries.length - 1] = {
        ...last,
        outflows: newOutflows,
        netCash: newNet,
        runningBalance: last.runningBalance - delta,
      };
      return entries;
    });
  }

  updateBudgetBreakdownItem(projectId: number, label: string, newAmount: string): void {
    this.projectDetailData.update(data => {
      const proj = data[projectId];
      if (!proj) return data;
      const totalRaw = proj.budgetBreakdown.reduce((sum, b) => {
        const amt = b.label === label ? parseAmount(newAmount) : parseAmount(b.amount);
        return sum + amt;
      }, 0);
      return {
        ...data,
        [projectId]: {
          ...proj,
          budgetBreakdown: proj.budgetBreakdown.map(b =>
            b.label === label
              ? { ...b, amount: newAmount, pct: totalRaw > 0 ? Math.round((parseAmount(newAmount) / totalRaw) * 100) : 0 }
              : { ...b, pct: totalRaw > 0 ? Math.round((parseAmount(b.amount) / totalRaw) * 100) : 0 }
          ),
        },
      };
    });
  }
}
