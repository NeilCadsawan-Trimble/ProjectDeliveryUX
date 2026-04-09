import { Injectable, computed, inject, signal } from '@angular/core';
import { CrossTabSyncService } from './cross-tab-sync.service';
import type {
  ActivityItem,
  ApActivityItem,
  ApInvoice,
  ApLienWaiver,
  ApPayApplication,
  ApPaymentScheduleItem,
  ApRetentionRecord,
  ApVendor,
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
import {
  AP_ACTIVITIES_SEED,
  AP_CALENDAR_APPOINTMENTS_SEED,
  AP_INVOICES_SEED,
  AP_LIEN_WAIVERS_SEED,
  AP_PAY_APPLICATIONS_SEED,
  AP_PAYMENT_SCHEDULE_SEED,
  AP_RETENTION_SEED,
  AP_VENDORS_SEED,
} from './ap-data.seed';
import type { LearningPlan } from './dashboard-data.types';
import { LEARNING_PLAN_SEED } from './learning-data.seed';

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

interface PersonaSnapshot {
  rfis: Rfi[];
  submittals: Submittal[];
  changeOrders: ChangeOrder[];
  estimates: Estimate[];
  timeOffRequests: TimeOffRequest[];
  projects: Project[];
  projectDetailData: Record<number, ProjectDashboardData>;
  weatherData: ProjectWeather[];
  budgetHistory: Record<number, BudgetHistoryPoint[]>;
  invoices: Invoice[];
  billingEvents: BillingEvent[];
  billingSchedules: BillingSchedule[];
  payables: Payable[];
  cashFlowHistory: CashFlowEntry[];
  cashPosition: CashPosition;
  glAccounts: GLAccount[];
  glEntries: GLEntry[];
  purchaseOrders: PurchaseOrder[];
  payrollRecords: PayrollRecord[];
  contracts: Contract[];
  subcontractLedger: SubcontractLedgerEntry[];
  inspections: Inspection[];
  punchListItems: PunchListItem[];
  activities: ActivityItem[];
  calendarAppointments: CalendarAppointment[];
  projectCalendarEvents: ProjectCalendarEvent[];
  dailyReports: DailyReport[];
  projectRevenue: ProjectRevenue[];
  monthlyRevenue: Record<RevenueTimeRange, RevenueDataPoint[]>;
  annualTotals: Record<RevenueTimeRange, { current: number; previous: number; label: string }>;
  weatherForecast: WeatherForecast[];
  projectAttentionItems: ProjectAttentionItem[];
  attentionItems: AttentionItem[];
}

function createFreshSnapshot(personaSlug?: string): PersonaSnapshot {
  return {
    rfis: [...RFIS_SEED],
    submittals: [...SUBMITTALS_SEED],
    changeOrders: [...CHANGE_ORDERS],
    estimates: [...ESTIMATES],
    timeOffRequests: [...TIME_OFF_REQUESTS],
    projects: [...PROJECTS],
    projectDetailData: structuredClone(PROJECT_DATA),
    weatherData: [...PROJECT_WEATHER_DATA],
    budgetHistory: structuredClone(BUDGET_HISTORY_BY_PROJECT),
    invoices: [...INVOICES],
    billingEvents: [...BILLING_EVENTS],
    billingSchedules: [...BILLING_SCHEDULES],
    payables: [...PAYABLES],
    cashFlowHistory: [...CASH_FLOW_HISTORY],
    cashPosition: { ...CASH_POSITION },
    glAccounts: [...GL_ACCOUNTS],
    glEntries: [...GL_ENTRIES],
    purchaseOrders: [...PURCHASE_ORDERS],
    payrollRecords: [...PAYROLL_RECORDS],
    contracts: [...CONTRACTS],
    subcontractLedger: [...SUBCONTRACT_LEDGER],
    inspections: [...INSPECTIONS],
    punchListItems: [...PUNCH_LIST_ITEMS],
    activities: [...ACTIVITIES],
    calendarAppointments: personaSlug === 'kelly' ? [...AP_CALENDAR_APPOINTMENTS_SEED] : [...CALENDAR_APPOINTMENTS],
    projectCalendarEvents: [...PROJECT_CALENDAR_EVENTS],
    dailyReports: [...DAILY_REPORTS],
    projectRevenue: [...PROJECT_REVENUE],
    monthlyRevenue: structuredClone(MONTHLY_REVENUE),
    annualTotals: structuredClone(ANNUAL_TOTALS),
    weatherForecast: [...WEATHER_FORECAST],
    projectAttentionItems: [...PROJECT_ATTENTION_ITEMS],
    attentionItems: [...ATTENTION_ITEMS],
  };
}

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  private readonly sync = inject(CrossTabSyncService);
  private readonly personaStateMap = new Map<string, PersonaSnapshot>();
  private currentPersonaSlug = 'frank';

  constructor() {
    this.sync.init(this.currentPersonaSlug, (method, args) => {
      const fn = (this as Record<string, unknown>)[method];
      if (typeof fn === 'function') {
        fn.call(this, ...args, true);
      }
    });
  }

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

  // AP Clerk (Kelly) data -- not persona-snapshotted since only Kelly uses these
  readonly apInvoices = signal<ApInvoice[]>([...AP_INVOICES_SEED]);
  readonly apVendors = signal<ApVendor[]>([...AP_VENDORS_SEED]);
  readonly apPayApplications = signal<ApPayApplication[]>([...AP_PAY_APPLICATIONS_SEED]);
  readonly apLienWaivers = signal<ApLienWaiver[]>([...AP_LIEN_WAIVERS_SEED]);
  readonly apRetention = signal<ApRetentionRecord[]>([...AP_RETENTION_SEED]);
  readonly apActivities = signal<ApActivityItem[]>([...AP_ACTIVITIES_SEED]);
  readonly apPaymentSchedule = signal<ApPaymentScheduleItem[]>([...AP_PAYMENT_SCHEDULE_SEED]);

  // Learning data (Kelly only)
  readonly learningPlan = signal<LearningPlan>(structuredClone(LEARNING_PLAN_SEED));

  switchToPersona(slug: string): void {
    if (slug === this.currentPersonaSlug) return;
    this.personaStateMap.set(this.currentPersonaSlug, this.takeSnapshot());
    const cached = this.personaStateMap.get(slug);
    const snapshot = cached ?? createFreshSnapshot(slug);
    this.loadSnapshot(snapshot);
    this.currentPersonaSlug = slug;
    this.sync.setPersona(slug);
  }

  private takeSnapshot(): PersonaSnapshot {
    return {
      rfis: this.rfis(),
      submittals: this.submittals(),
      changeOrders: this.changeOrders(),
      estimates: this.estimates(),
      timeOffRequests: this.timeOffRequests(),
      projects: this.projects(),
      projectDetailData: this.projectDetailData(),
      weatherData: this.weatherData(),
      budgetHistory: this.budgetHistory(),
      invoices: this.invoices(),
      billingEvents: this.billingEvents(),
      billingSchedules: this.billingSchedules(),
      payables: this.payables(),
      cashFlowHistory: this.cashFlowHistory(),
      cashPosition: this.cashPosition(),
      glAccounts: this.glAccounts(),
      glEntries: this.glEntries(),
      purchaseOrders: this.purchaseOrders(),
      payrollRecords: this.payrollRecords(),
      contracts: this.contracts(),
      subcontractLedger: this.subcontractLedger(),
      inspections: this.inspections(),
      punchListItems: this.punchListItems(),
      activities: this.activities(),
      calendarAppointments: this.calendarAppointments(),
      projectCalendarEvents: this.projectCalendarEvents(),
      dailyReports: this.dailyReports(),
      projectRevenue: this.projectRevenue(),
      monthlyRevenue: this.monthlyRevenue(),
      annualTotals: this.annualTotals(),
      weatherForecast: this.weatherForecast(),
      projectAttentionItems: this.projectAttentionItems(),
      attentionItems: this.attentionItems(),
    };
  }

  private loadSnapshot(s: PersonaSnapshot): void {
    this.rfis.set(s.rfis);
    this.submittals.set(s.submittals);
    this.changeOrders.set(s.changeOrders);
    this.estimates.set(s.estimates);
    this.timeOffRequests.set(s.timeOffRequests);
    this.projects.set(s.projects);
    this.projectDetailData.set(s.projectDetailData);
    this.weatherData.set(s.weatherData);
    this.budgetHistory.set(s.budgetHistory);
    this.invoices.set(s.invoices);
    this.billingEvents.set(s.billingEvents);
    this.billingSchedules.set(s.billingSchedules);
    this.payables.set(s.payables);
    this.cashFlowHistory.set(s.cashFlowHistory);
    this.cashPosition.set(s.cashPosition);
    this.glAccounts.set(s.glAccounts);
    this.glEntries.set(s.glEntries);
    this.purchaseOrders.set(s.purchaseOrders);
    this.payrollRecords.set(s.payrollRecords);
    this.contracts.set(s.contracts);
    this.subcontractLedger.set(s.subcontractLedger);
    this.inspections.set(s.inspections);
    this.punchListItems.set(s.punchListItems);
    this.activities.set(s.activities);
    this.calendarAppointments.set(s.calendarAppointments);
    this.projectCalendarEvents.set(s.projectCalendarEvents);
    this.dailyReports.set(s.dailyReports);
    this.projectRevenue.set(s.projectRevenue);
    this.monthlyRevenue.set(s.monthlyRevenue);
    this.annualTotals.set(s.annualTotals);
    this.weatherForecast.set(s.weatherForecast);
    this.projectAttentionItems.set(s.projectAttentionItems);
    this.attentionItems.set(s.attentionItems);
  }

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

  updateProjectStatus(projectId: number, newStatus: ProjectStatus, _remote = false): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
    );
    if (!_remote) this.sync.broadcast('updateProjectStatus', [projectId, newStatus]);
  }

  updateProject(projectId: number, patch: Partial<Project>, _remote = false): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, ...patch } : p)
    );
    if (!_remote) this.sync.broadcast('updateProject', [projectId, patch]);
  }

  updateProjectDetail(projectId: number, patch: Partial<ProjectDashboardData>, _remote = false): void {
    this.projectDetailData.update(data => ({
      ...data,
      [projectId]: { ...data[projectId], ...patch },
    }));
    if (!_remote) this.sync.broadcast('updateProjectDetail', [projectId, patch]);
  }

  updateWeather(projectId: number, patch: Partial<ProjectWeather>, _remote = false): void {
    this.weatherData.update(list =>
      list.map(w => w.projectId === projectId ? { ...w, ...patch } : w)
    );
    if (!_remote) this.sync.broadcast('updateWeather', [projectId, patch]);
  }

  updateBudgetHistory(projectId: number, points: BudgetHistoryPoint[], _remote = false): void {
    this.budgetHistory.update(data => ({ ...data, [projectId]: points }));
    if (!_remote) this.sync.broadcast('updateBudgetHistory', [projectId, points]);
  }

  updateRfiStatus(id: string, newStatus: RfiStatus, _remote = false): void {
    this.rfis.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
    if (!_remote) this.sync.broadcast('updateRfiStatus', [id, newStatus]);
  }

  updateSubmittalStatus(id: string, newStatus: SubmittalStatus, _remote = false): void {
    this.submittals.update(list =>
      list.map(s => s.id === id ? { ...s, status: newStatus } : s)
    );
    if (!_remote) this.sync.broadcast('updateSubmittalStatus', [id, newStatus]);
  }

  updateChangeOrderStatus(id: string, newStatus: ChangeOrderStatus, _remote = false): void {
    this.changeOrders.update(list =>
      list.map(co => co.id === id ? { ...co, status: newStatus } : co)
    );
    if (!_remote) this.sync.broadcast('updateChangeOrderStatus', [id, newStatus]);
  }

  updateEstimateStatus(id: string, newStatus: EstimateStatus, _remote = false): void {
    this.estimates.update(list =>
      list.map(e => e.id === id ? { ...e, status: newStatus } : e)
    );
    if (!_remote) this.sync.broadcast('updateEstimateStatus', [id, newStatus]);
  }

  updateTimeOffStatus(id: number, newStatus: TimeOffStatus, _remote = false): void {
    this.timeOffRequests.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
    if (!_remote) this.sync.broadcast('updateTimeOffStatus', [id, newStatus]);
  }

  updateInvoiceStatus(id: string, newStatus: InvoiceStatus, _remote = false): void {
    this.invoices.update(list =>
      list.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv)
    );
    if (!_remote) this.sync.broadcast('updateInvoiceStatus', [id, newStatus]);
  }

  updatePayableStatus(id: string, newStatus: PayableStatus, _remote = false): void {
    this.payables.update(list =>
      list.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );
    if (!_remote) this.sync.broadcast('updatePayableStatus', [id, newStatus]);
  }

  updatePurchaseOrderStatus(id: string, newStatus: PurchaseOrderStatus, _remote = false): void {
    this.purchaseOrders.update(list =>
      list.map(po => po.id === id ? { ...po, status: newStatus } : po)
    );
    if (!_remote) this.sync.broadcast('updatePurchaseOrderStatus', [id, newStatus]);
  }

  updateInspectionResult(id: string, newResult: InspectionResult, _remote = false): void {
    this.inspections.update(list =>
      list.map(i => i.id === id ? { ...i, result: newResult } : i)
    );
    if (!_remote) this.sync.broadcast('updateInspectionResult', [id, newResult]);
  }

  updatePunchListStatus(id: string, newStatus: 'open' | 'in-progress' | 'completed' | 'verified', _remote = false): void {
    this.punchListItems.update(list =>
      list.map(p => p.id === id ? { ...p, status: newStatus } : p)
    );
    if (!_remote) this.sync.broadcast('updatePunchListStatus', [id, newStatus]);
  }

  updateContractStatus(id: string, newStatus: ContractStatus, _remote = false): void {
    this.contracts.update(list =>
      list.map(c => c.id === id ? { ...c, status: newStatus } : c)
    );
    if (!_remote) this.sync.broadcast('updateContractStatus', [id, newStatus]);
  }

  updateChangeOrderAmount(id: string, amount: number, _remote = false): void {
    this.changeOrders.update(list =>
      list.map(co => co.id === id ? { ...co, amount } : co)
    );
    if (!_remote) this.sync.broadcast('updateChangeOrderAmount', [id, amount]);
  }

  updateInvoiceAmount(id: string, amount: number, _remote = false): void {
    this.invoices.update(list =>
      list.map(inv => inv.id === id ? { ...inv, amount } : inv)
    );
    if (!_remote) this.sync.broadcast('updateInvoiceAmount', [id, amount]);
  }

  updatePayableAmount(id: string, amount: number, _remote = false): void {
    this.payables.update(list =>
      list.map(p => p.id === id ? { ...p, amount } : p)
    );
    if (!_remote) this.sync.broadcast('updatePayableAmount', [id, amount]);
  }

  updatePurchaseOrderAmount(id: string, amount: number, _remote = false): void {
    this.purchaseOrders.update(list =>
      list.map(po => po.id === id ? { ...po, amount } : po)
    );
    if (!_remote) this.sync.broadcast('updatePurchaseOrderAmount', [id, amount]);
  }

  updateCashPosition(patch: Partial<CashPosition>, _remote = false): void {
    this.cashPosition.update(cp => ({ ...cp, ...patch }));
    if (!_remote) this.sync.broadcast('updateCashPosition', [patch]);
  }

  updateEstimateValue(id: string, valueRaw: number, _remote = false): void {
    const fmtValue = valueRaw >= 1_000_000
      ? `$${(valueRaw / 1_000_000).toFixed(1)}M`
      : valueRaw >= 1_000
        ? `$${Math.round(valueRaw / 1_000)}K`
        : `$${valueRaw}`;
    this.estimates.update(list =>
      list.map(e => e.id === id ? { ...e, valueRaw, value: fmtValue } : e)
    );
    if (!_remote) this.sync.broadcast('updateEstimateValue', [id, valueRaw]);
  }

  updateContractValue(id: string, revisedValue: number, _remote = false): void {
    this.contracts.update(list =>
      list.map(c => c.id === id ? { ...c, revisedValue } : c)
    );
    if (!_remote) this.sync.broadcast('updateContractValue', [id, revisedValue]);
  }

  updateBillingEvent(id: string, patch: Partial<Pick<BillingEvent, 'amount' | 'status'>>, _remote = false): void {
    this.billingEvents.update(list =>
      list.map(be => be.id === id ? { ...be, ...patch } : be)
    );
    if (!_remote) this.sync.broadcast('updateBillingEvent', [id, patch]);
  }

  updatePayrollRecord(id: string, patch: Partial<Pick<PayrollRecord, 'grossPay' | 'netPay' | 'taxes' | 'benefits'>>, _remote = false): void {
    this.payrollRecords.update(list =>
      list.map(pr => pr.id === id ? { ...pr, ...patch } : pr)
    );
    if (!_remote) this.sync.broadcast('updatePayrollRecord', [id, patch]);
  }

  updateMilestoneStatus(projectId: number, milestoneId: number, status: string, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('updateMilestoneStatus', [projectId, milestoneId, status]);
  }

  updateTaskStatus(projectId: number, taskId: number, status: string, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('updateTaskStatus', [projectId, taskId, status]);
  }

  updateRiskSeverity(projectId: number, riskId: number, severity: string, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('updateRiskSeverity', [projectId, riskId, severity]);
  }

  adjustLatestRevenue(delta: number, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('adjustLatestRevenue', [delta]);
  }

  adjustCashFlowInflows(delta: number, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('adjustCashFlowInflows', [delta]);
  }

  adjustCashFlowOutflows(delta: number, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('adjustCashFlowOutflows', [delta]);
  }

  updateBudgetBreakdownItem(projectId: number, label: string, newAmount: string, _remote = false): void {
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
    if (!_remote) this.sync.broadcast('updateBudgetBreakdownItem', [projectId, label, newAmount]);
  }
}
