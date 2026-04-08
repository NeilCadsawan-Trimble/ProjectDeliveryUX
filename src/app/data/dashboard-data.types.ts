export type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
export type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
export type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
export type DashboardWidgetId =
  | 'projects'
  | 'proj1'
  | 'proj2'
  | 'proj3'
  | 'proj4'
  | 'proj5'
  | 'proj6'
  | 'proj7'
  | 'proj8'
  | 'openEstimates'
  | 'recentActivity'
  | 'needsAttention'
  | 'timeOff'
  | 'homeHeader'
  | 'homeKpis'
  | 'homeTimeOff'
  | 'homeCalendar'
  | 'homeRfis'
  | 'homeSubmittals'
  | 'homeDrawings'
  | 'homeUrgentNeeds'
  | 'homeWeather'
  | 'homeRecentActivity'
  | 'projsHeader'
  | 'projsTimeline'
  | 'finTitle'
  | 'finNavKpi'
  | 'finBudgetByProject'
  | 'finRevenueChart'
  | 'finJobCosts'
  | 'finOpenEstimates'
  | 'finChangeOrders'
  | 'finJobBilling'
  | 'finAccountsReceivable'
  | 'finAccountsPayable'
  | 'finCashManagement'
  | 'finGeneralLedger'
  | 'finPurchaseOrders'
  | 'finPayroll'
  | 'finContracts'
  | 'finSubcontractLedger'
  | 'homeApKpis'
  | 'homeInvoiceQueue'
  | 'homePaymentSchedule'
  | 'homeVendorAging'
  | 'homePayApps'
  | 'homeLienWaivers'
  | 'homeRetention'
  | 'homeApActivity'
  | 'homeCashOutflow'
  | 'homeMilestones'
  | 'homeBudgetVariance'
  | 'homeChangeOrders'
  | 'homeFieldOps'
  | 'homeDailyReports'
  | 'homeTeamAllocation'
  | 'homeContracts'
  | 'finInvoiceQueue'
  | 'finPaymentSchedule'
  | 'finVendorAging'
  | 'finPayApps'
  | 'finLienWaivers'
  | 'finRetention'
  | 'finApActivity'
  | 'finCashOutflow';
export type GridPage = 'home' | 'projects' | 'financials';
export type RfiStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
export type SubmittalStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
export type ApptType = 'meeting' | 'review' | 'call' | 'deadline' | 'focus';

export interface Rfi {
  id: string;
  number: string;
  subject: string;
  question: string;
  askedBy: string;
  askedOn: string;
  project: string;
  assignee: string;
  status: RfiStatus;
  dueDate: string;
}

export interface Submittal {
  id: string;
  number: string;
  subject: string;
  project: string;
  assignee: string;
  status: SubmittalStatus;
  dueDate: string;
}

export interface CalendarAppointment {
  id: number;
  title: string;
  date: Date;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
  type: ApptType;
  projectSlug?: string;
}

export interface Project {
  id: number;
  slug: string;
  name: string;
  client: string;
  ownerInitials: string;
  owner: string;
  status: ProjectStatus;
  dueDate: string;
  progress: number;
  budgetPct: number;
  budgetUsed: string;
  budgetTotal: string;
  latestDrawingName: string;
  latestDrawingVersion: string;
  city: string;
  state: string;
}

export interface Estimate {
  id: string;
  project: string;
  client: string;
  type: EstimateType;
  value: string;
  valueRaw: number;
  status: EstimateStatus;
  requestedBy: string;
  requestedByInitials: string;
  dueDate: string;
  daysLeft: number;
}

export interface ActivityItem {
  id: number;
  actorInitials: string;
  text: string;
  timeAgo: string;
  icon: string;
  iconColor: string;
}

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

export type TimeOffStatus = 'Pending' | 'Approved' | 'Denied';

export interface TimeOffRequest {
  id: number;
  name: string;
  initials: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: TimeOffStatus;
  projectId: number;
  projectName: string;
}

export interface StaffingConflict {
  projectId: number;
  projectName: string;
  week: string;
  absentCount: number;
  teamSize: number;
  absentPct: number;
  absentees: string[];
  severity: 'critical' | 'warning' | 'info';
  reason: string;
}

export type RevenueTimeRange = '1M' | 'YTD' | '1Y' | '3Y' | '5Y';

export interface RevenueDataPoint {
  label: string;
  value: number;
}

export interface ProjectRevenue {
  projectId: number;
  projectName: string;
  contractValue: string;
  invoiced: string;
  collected: string;
  outstanding: string;
  retainage: string;
  invoicedRaw: number;
  collectedRaw: number;
  outstandingRaw: number;
  retainageRaw: number;
}

export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected';
export type ChangeOrderType = 'prime' | 'potential' | 'subcontract';

export interface ChangeOrder {
  id: string;
  project: string;
  projectId: number;
  coType: ChangeOrderType;
  description: string;
  amount: number;
  status: ChangeOrderStatus;
  requestedBy: string;
  requestDate: string;
  reason: string;
  contractNumber?: string;
  subcontractor?: string;
  costCode?: string;
}

export type ContractStatus = 'active' | 'closed' | 'pending' | 'draft';
export type ContractType = 'prime' | 'subcontract' | 'purchase-order';

export interface Contract {
  id: string;
  project: string;
  projectId: number;
  contractType: ContractType;
  title: string;
  vendor: string;
  originalValue: number;
  revisedValue: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  scope: string;
  retainage: number;
  linkedChangeOrderIds: string[];
}

export interface DailyReport {
  id: string;
  projectId: number;
  project: string;
  date: string;
  author: string;
  weather: string;
  crewCount: number;
  hoursWorked: number;
  workPerformed: string;
  issues: string;
  safetyIncidents: number;
}

export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow';

export interface WeatherForecast {
  date: string;
  day: string;
  condition: WeatherCondition;
  highF: number;
  lowF: number;
  precipPct: number;
  windMph: number;
  workImpact: 'none' | 'minor' | 'major';
  note: string;
}

export interface ProjectWeather {
  projectId: number;
  city: string;
  state: string;
  current: {
    condition: WeatherCondition;
    tempF: number;
    feelsLikeF: number;
    humidity: number;
    windMph: number;
    windDir: string;
    uvIndex: number;
  };
  forecast: WeatherForecast[];
}

export interface ProjectAttentionItem {
  id: string;
  projectId: number;
  title: string;
  subtitle: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
}

export interface BudgetHistoryPoint {
  month: string;
  planned: number;
  actual: number;
  forecast: number;
}

export type InspectionResult = 'pass' | 'fail' | 'conditional' | 'pending';

export interface Inspection {
  id: string;
  projectId: number;
  project: string;
  type: string;
  date: string;
  inspector: string;
  result: InspectionResult;
  notes: string;
  followUp: string;
}

export interface PunchListItem {
  id: string;
  projectId: number;
  project: string;
  location: string;
  description: string;
  assignee: string;
  status: 'open' | 'in-progress' | 'completed' | 'verified';
  priority: 'high' | 'medium' | 'low';
  createdDate: string;
}

export const JOB_COST_CATEGORIES = ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Overhead'] as const;
export type JobCostCategory = (typeof JOB_COST_CATEGORIES)[number];

export interface JobCostCategorySummary {
  label: JobCostCategory;
  total: number;
  pct: number;
  colorClass: string;
}

export interface ProjectJobCost {
  projectId: number;
  projectName: string;
  client: string;
  budgetUsed: string;
  budgetTotal: string;
  budgetPct: number;
  costs: Record<JobCostCategory, number>;
}

export interface SubledgerTransaction {
  id: string;
  date: string;
  description: string;
  vendor: string;
  reference: string;
  amount: number;
  runningTotal: number;
}

export type UrgentNeedCategory =
  | 'rfi'
  | 'submittal'
  | 'budget'
  | 'schedule'
  | 'inspection'
  | 'safety'
  | 'change-order'
  | 'quality';

export interface UrgentNeedItem {
  id: string;
  projectId: number;
  projectName: string;
  projectSlug: string;
  title: string;
  subtitle: string;
  severity: 'critical' | 'warning' | 'info';
  category: UrgentNeedCategory;
  route: string;
  queryParams: Record<string, string>;
  financialsRoute?: string;
}

// ---------------------------------------------------------------------------
// Accounts Receivable (Invoices Out)
// ---------------------------------------------------------------------------
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'partially-paid' | 'void';
export type InvoiceTerms = 'Net 30' | 'Net 45';

export interface Invoice {
  id: string;
  projectId: number;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  terms: InvoiceTerms;
  retainageHeld: number;
  linkedContractId?: string;
}

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number;
  total: number;
  count: number;
}

// ---------------------------------------------------------------------------
// Job Billing
// ---------------------------------------------------------------------------
export type BillingFrequency = 'monthly' | 'milestone' | 'progress' | 'upon-completion';
export type BillingEventStatus = 'scheduled' | 'completed' | 'skipped';

export interface BillingSchedule {
  projectId: number;
  frequency: BillingFrequency;
  nextBillingDate: string;
  lastBilledDate: string;
  lastBilledAmount: number;
  contractValue: number;
  totalBilled: number;
  totalRemaining: number;
  billingContact: string;
}

export interface BillingEvent {
  id: string;
  projectId: number;
  billingDate: string;
  amount: number;
  description: string;
  invoiceId?: string;
  period: string;
  status: BillingEventStatus;
}

// ---------------------------------------------------------------------------
// Accounts Payable (Bills In)
// ---------------------------------------------------------------------------
export type PayableStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';

export interface Payable {
  id: string;
  vendor: string;
  projectId: number;
  invoiceNumber: string;
  description: string;
  amount: number;
  amountPaid: number;
  status: PayableStatus;
  receivedDate: string;
  dueDate: string;
  paidDate?: string;
  costCode: string;
  linkedContractId?: string;
}

// ---------------------------------------------------------------------------
// Cash Management
// ---------------------------------------------------------------------------
export interface CashFlowEntry {
  month: string;
  inflows: number;
  outflows: number;
  netCash: number;
  runningBalance: number;
}

export interface CashPosition {
  currentBalance: number;
  thirtyDayForecast: number;
  sixtyDayForecast: number;
  ninetyDayForecast: number;
  monthlyPayroll: number;
  monthlyOverhead: number;
  upcomingPayables: number;
}

// ---------------------------------------------------------------------------
// General Ledger
// ---------------------------------------------------------------------------
export type GLAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type GLCategory = 'revenue' | 'expense' | 'asset' | 'liability';

export interface GLEntry {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  projectId?: number;
  category: GLCategory;
  reference: string;
}

export interface GLAccount {
  code: string;
  name: string;
  type: GLAccountType;
  balance: number;
}

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------
export type PurchaseOrderStatus = 'draft' | 'issued' | 'acknowledged' | 'partially-received' | 'received' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendor: string;
  projectId: number;
  project: string;
  description: string;
  amount: number;
  amountReceived: number;
  status: PurchaseOrderStatus;
  issueDate: string;
  expectedDelivery: string;
  receivedDate?: string;
  costCode: string;
  lineItems: number;
  linkedContractId?: string;
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------
export type PayrollStatus = 'processed' | 'pending' | 'scheduled';
export type PayFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface PayrollRecord {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: PayrollStatus;
  grossPay: number;
  taxes: number;
  benefits: number;
  netPay: number;
  employeeCount: number;
  totalHours: number;
  overtimeHours: number;
  frequency: PayFrequency;
}

export interface PayrollSummary {
  totalGrossYTD: number;
  totalTaxesYTD: number;
  totalBenefitsYTD: number;
  totalNetYTD: number;
  averageEmployees: number;
  totalOvertimeHours: number;
  laborBurdenRate: number;
}

// ---------------------------------------------------------------------------
// Subcontract Ledger
// ---------------------------------------------------------------------------
export type SubcontractLedgerType = 'payment' | 'retainage-held' | 'retainage-release' | 'backcharge' | 'change-order' | 'withholding';

export interface SubcontractLedgerEntry {
  id: string;
  subcontractId: string;
  vendor: string;
  projectId: number;
  project: string;
  type: SubcontractLedgerType;
  description: string;
  amount: number;
  date: string;
  payApp: string;
  invoiceRef?: string;
  period: string;
  runningBalance: number;
}

// ---------------------------------------------------------------------------
// AP Clerk (Kelly) Home Dashboard
// ---------------------------------------------------------------------------
export type ApInvoiceStatus = 'pending' | 'approved' | 'on-hold' | 'paid';
export type ApVendorType = 'subcontractor' | 'supplier' | 'consultant' | 'equipment-rental';
export type ApPayAppStatus = 'pending' | 'approved' | 'paid';
export type ApLienWaiverType = 'conditional' | 'unconditional';
export type ApLienWaiverStatus = 'pending' | 'received' | 'missing';
export type ApActivityType = 'payment' | 'approval' | 'receipt' | 'vendor-update' | 'hold' | 'discount-captured';

export interface ApInvoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  project: string;
  projectId: number;
  amount: number;
  dueDate: string;
  receivedDate: string;
  status: ApInvoiceStatus;
  costCode: string;
  poNumber: string;
  daysOutstanding: number;
}

export interface ApVendor {
  id: string;
  name: string;
  vendorType: ApVendorType;
  totalOwed: number;
  current: number;
  aging30: number;
  aging60: number;
  aging90: number;
  aging90plus: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
}

export interface ApPayApplication {
  id: string;
  vendor: string;
  project: string;
  projectId: number;
  periodEnd: string;
  contractValue: number;
  previousBilled: number;
  thisPeriod: number;
  retentionRate: number;
  retentionHeld: number;
  netDue: number;
  status: ApPayAppStatus;
}

export interface ApLienWaiver {
  id: string;
  vendor: string;
  project: string;
  projectId: number;
  waiverType: ApLienWaiverType;
  periodEnd: string;
  amount: number;
  status: ApLienWaiverStatus;
  dueDate: string;
}

export interface ApRetentionRecord {
  id: string;
  project: string;
  projectId: number;
  vendor: string;
  contractValue: number;
  retentionRate: number;
  retentionHeld: number;
  retentionReleased: number;
  pendingRelease: number;
}

export interface ApActivityItem {
  id: string;
  activityType: ApActivityType;
  description: string;
  vendor: string;
  amount: number;
  timestamp: string;
  project: string;
}

export interface ApPaymentScheduleItem {
  id: string;
  vendor: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  project: string;
  discountAvailable: number;
  discountDeadline: string;
}

// ---------------------------------------------------------------------------
// Project Calendar Timeline
// ---------------------------------------------------------------------------
export type ProjectEventCategory = 'site' | 'financial' | 'meeting' | 'deadline' | 'inspection';

export interface ProjectCalendarEvent {
  id: number;
  projectId: number;
  projectSlug: string;
  title: string;
  startDate: Date;
  endDate: Date;
  category: ProjectEventCategory;
  participants?: string;
}
