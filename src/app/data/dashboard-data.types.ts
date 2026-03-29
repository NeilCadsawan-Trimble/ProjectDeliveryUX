export type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
export type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
export type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
export type DashboardWidgetId =
  | 'projects'
  | 'openEstimates'
  | 'recentActivity'
  | 'needsAttention'
  | 'timeOff'
  | 'homeHeader'
  | 'homeTimeOff'
  | 'homeCalendar'
  | 'homeRfis'
  | 'homeSubmittals'
  | 'homeDrawings'
  | 'homeUrgentNeeds'
  | 'homeWeather'
  | 'homeRecentActivity'
  | 'projsHeader'
  | 'finHeader'
  | 'finBudgetByProject'
  | 'finRevenueChart'
  | 'finJobCosts'
  | 'finOpenEstimates'
  | 'finChangeOrders';
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

export interface TimeOffRequest {
  id: number;
  name: string;
  initials: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'Pending' | 'Approved' | 'Denied';
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
