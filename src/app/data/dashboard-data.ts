import type { ModusBadgeColor } from '../components/modus-badge.component';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
export type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
export type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
export type DashboardWidgetId =
  | 'projects'
  | 'openEstimates'
  | 'recentActivity'
  | 'needsAttention'
  | 'timeOff'
  | 'homeTimeOff'
  | 'homeCalendar'
  | 'homeRfis'
  | 'homeSubmittals'
  | 'homeAllEstimates'
  | 'homeTasks'
  | 'finBudgetByProject';
export type GridPage = 'home' | 'projects' | 'financials';
export type RfiStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
export type SubmittalStatus = 'open' | 'overdue' | 'upcoming' | 'closed';
export type ApptType = 'meeting' | 'review' | 'call' | 'deadline' | 'focus';

export interface Rfi {
  id: string;
  number: string;
  subject: string;
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

export type BiddingTaskScheduleTab = 'today' | 'tomorrow' | 'week' | 'archive';
export type BiddingTaskPriorityKind = 'overdue' | 'critical' | 'high' | 'medium';

export interface BiddingTask {
  id: string;
  /** Full card title (Figma Tasks & Action Items — single h3 line). */
  title: string;
  priority: BiddingTaskPriorityKind;
  /** Meta row: project scale, e.g. "$8.5M". */
  projectValue: string;
  /** Meta row: recency or time, e.g. "2 hours ago". */
  timeLabel: string;
  /** Meta row: owner / assignee display name. */
  assigneeLabel: string;
  /** Body copy under meta row. */
  description: string;
  /** Full-width alert banner under description. */
  alertMessage: string;
  /** Error = red strip; warning = amber strip (Figma). */
  alertTone: 'error' | 'warning';
  actionLabel: string;
  scheduleTab: BiddingTaskScheduleTab;
}

/** Status chips on home "All Estimates" cards (Figma WC-2.0 Estimates Page). */
export type HomeEstimateCardStatus = 'In Progress' | 'Completed' | 'Planning' | 'Archived';

/** Trend glyph beside metric value (Figma Estimates expanded snapshot). */
export type HomeEstimateMetricTrend = 'up' | 'down' | 'none';

export interface HomeEstimateMetric {
  label: string;
  value: string;
  trend: HomeEstimateMetricTrend;
  /** Leading Modus icon on the label row (Figma Performance Snapshot). */
  labelIcon: string;
}

export type HomeEstimateInsightTone = 'positive' | 'caution';

export interface HomeEstimateInsight {
  text: string;
  tone: HomeEstimateInsightTone;
  /**
   * Figma: most insights use a left accent strip + icon + copy.
   * Planning (Clubhouse) uses compact padded rows without the strip.
   */
  layout?: 'accent' | 'simple';
}

/**
 * Leading glyph in list row — Figma 2:36091:
 * building (Eldorado, Clubhouse), green check (Completed), archive drawer (Archive).
 */
export type HomeEstimateListIcon = 'building_corporate' | 'check_circle' | 'archive_square';

export interface HomeEstimateCard {
  id: string;
  listIcon: HomeEstimateListIcon;
  title: string;
  description: string;
  statusLabel: HomeEstimateCardStatus;
  progressPct: number;
  progressVariant: 'in_progress' | 'complete' | 'planning' | 'archived';
  /** When false, collapsed layout omits the progress bar (e.g. Archive). */
  showProgressBar: boolean;
  /** e.g. "Due Mar 15, 2026" / "Completed Feb 28, 2026" / "Archived Jan 10, 2026" */
  dateLine: string;
  membersLabel: string;
  metrics: [HomeEstimateMetric, HomeEstimateMetric, HomeEstimateMetric];
  /** Insight rows below metrics (check vs warning per Figma). */
  insights: [HomeEstimateInsight, HomeEstimateInsight];
}

/** Home dashboard All Estimates cards — copy aligned to Figma node 2:23597. */
export const HOME_ESTIMATE_CARDS: HomeEstimateCard[] = [
  {
    id: 'hec-eldorado',
    listIcon: 'building_corporate',
    title: 'Eldorado Canyon Community Center',
    description: 'Community center construction project in Eldorado Canyon',
    statusLabel: 'In Progress',
    progressPct: 75,
    progressVariant: 'in_progress',
    showProgressBar: true,
    dateLine: 'Due Mar 15, 2026',
    membersLabel: '2 members',
    /* Performance Snapshot metric glyphs — Figma 2:23632: $ / clock / trophy-ribbon */
    metrics: [
      { label: 'Projected Margin', value: '19.2%', trend: 'up', labelIcon: 'costs' },
      { label: 'Schedule Adherence', value: '92%', trend: 'up', labelIcon: 'clock' },
      { label: 'Under Budget', value: '+$12.5K', trend: 'up', labelIcon: 'certificate' },
    ],
    insights: [
      { text: 'Local suppliers reduced delays by 28%', tone: 'positive' },
      { text: 'Early sub engagement improved bids', tone: 'positive' },
    ],
  },
  {
    id: 'hec-housing',
    listIcon: 'check_circle',
    title: 'Housing Complex - Division 3',
    description: 'Previous Housing Complex project successfully completed',
    statusLabel: 'Completed',
    progressPct: 100,
    progressVariant: 'complete',
    showProgressBar: true,
    dateLine: 'Completed Feb 28, 2026',
    membersLabel: '2 members',
    metrics: [
      { label: 'Final Margin', value: '21.4%', trend: 'up', labelIcon: 'costs' },
      { label: 'On-Time Delivery', value: '100%', trend: 'up', labelIcon: 'clock' },
      { label: 'Under Budget', value: '+$45.2K', trend: 'up', labelIcon: 'certificate' },
    ],
    insights: [
      { text: 'AI doc review caught all compliance issues', tone: 'positive' },
      { text: 'Strong subcontractor engagement', tone: 'positive' },
    ],
  },
  {
    id: 'hec-clubhouse',
    listIcon: 'building_corporate',
    title: 'Clubhouse Build',
    description: 'New clubhouse construction project',
    statusLabel: 'Planning',
    progressPct: 30,
    progressVariant: 'planning',
    showProgressBar: true,
    dateLine: 'Due Apr 20, 2026',
    membersLabel: '1 member',
    metrics: [
      { label: 'Target Margin', value: '16.8%', trend: 'up', labelIcon: 'costs' },
      { label: 'Planning Phase', value: '—', trend: 'none', labelIcon: 'clock' },
      { label: 'Budget Status', value: 'On Track', trend: 'up', labelIcon: 'certificate' },
    ],
    insights: [
      { text: 'Need 2+ electrical quotes by Mar 25', tone: 'caution', layout: 'simple' },
      { text: 'Consider local material suppliers', tone: 'caution', layout: 'simple' },
    ],
  },
  {
    id: 'hec-archive',
    listIcon: 'archive_square',
    title: 'Archive',
    description: 'Archived projects and historical data',
    statusLabel: 'Archived',
    progressPct: 0,
    progressVariant: 'archived',
    showProgressBar: false,
    dateLine: 'Archived Jan 10, 2026',
    membersLabel: '',
    metrics: [
      {
        label: 'Avg Margin (18 projects)',
        value: '18.3%',
        trend: 'up',
        labelIcon: 'costs',
      },
      { label: 'On-Time Rate', value: '83%', trend: 'down', labelIcon: 'clock' },
      { label: 'Budget Adherence', value: '91%', trend: 'up', labelIcon: 'certificate' },
    ],
    insights: [
      { text: 'Early sub engagement: 89% success', tone: 'positive' },
      { text: 'Late electrical bids: 33% win rate', tone: 'caution' },
    ],
  },
];

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

export const PROJECTS: Project[] = [
  { id: 1, slug: 'cloud-infrastructure-migration', name: 'Cloud Infrastructure Migration', client: 'Trimble Internal', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'On Track', dueDate: 'Mar 15, 2026', progress: 72, budgetPct: 68, budgetUsed: '$544K', budgetTotal: '$800K', latestDrawingName: 'Server Room - Floor 3 Layout', latestDrawingVersion: 'v3.2' },
  { id: 2, slug: 'mobile-app-redesign', name: 'Mobile App Redesign', client: 'Apex Corp', ownerInitials: 'JC', owner: 'James Carter', status: 'At Risk', dueDate: 'Mar 28, 2026', progress: 45, budgetPct: 82, budgetUsed: '$246K', budgetTotal: '$300K', latestDrawingName: 'App Navigation Flow v2', latestDrawingVersion: 'v2.4' },
  { id: 3, slug: 'erp-system-upgrade', name: 'ERP System Upgrade', client: 'GlobalTech Ltd', ownerInitials: 'PN', owner: 'Priya Nair', status: 'Overdue', dueDate: 'Feb 20, 2026', progress: 60, budgetPct: 95, budgetUsed: '$855K', budgetTotal: '$900K', latestDrawingName: 'ERP Integration Architecture', latestDrawingVersion: 'v4.1' },
  { id: 4, slug: 'data-analytics-platform', name: 'Data Analytics Platform', client: 'NexGen Analytics', ownerInitials: 'TE', owner: 'Tom Evans', status: 'On Track', dueDate: 'Apr 10, 2026', progress: 35, budgetPct: 30, budgetUsed: '$150K', budgetTotal: '$500K', latestDrawingName: 'Data Pipeline Architecture', latestDrawingVersion: 'v2.0' },
  { id: 5, slug: 'customer-portal-v3', name: 'Customer Portal v3', client: 'Brightline Co', ownerInitials: 'LB', owner: 'Lena Brooks', status: 'Planning', dueDate: 'Apr 30, 2026', progress: 12, budgetPct: 8, budgetUsed: '$24K', budgetTotal: '$350K', latestDrawingName: 'Portal Sitemap & Wireframes', latestDrawingVersion: 'v1.2' },
  { id: 6, slug: 'security-compliance-audit', name: 'Security & Compliance Audit', client: 'Trimble Internal', ownerInitials: 'MO', owner: 'Mike Osei', status: 'On Track', dueDate: 'Mar 5, 2026', progress: 88, budgetPct: 72, budgetUsed: '$108K', budgetTotal: '$150K', latestDrawingName: 'Network Security Topology', latestDrawingVersion: 'v2.3' },
  { id: 7, slug: 'api-gateway-modernization', name: 'API Gateway Modernization', client: 'CoreSystems Inc', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'Overdue', dueDate: 'Feb 14, 2026', progress: 30, budgetPct: 55, budgetUsed: '$110K', budgetTotal: '$200K', latestDrawingName: 'API Gateway Architecture', latestDrawingVersion: 'v3.0' },
  { id: 8, slug: 'ml-model-deployment-pipeline', name: 'ML Model Deployment Pipeline', client: 'DataDrive AI', ownerInitials: 'PN', owner: 'Priya Nair', status: 'On Track', dueDate: 'May 20, 2026', progress: 20, budgetPct: 18, budgetUsed: '$90K', budgetTotal: '$500K', latestDrawingName: 'ML Pipeline Architecture', latestDrawingVersion: 'v1.5' },
];

export const ESTIMATES: Estimate[] = [
  { id: 'EST-2026-041', project: 'Cloud Migration Phase 3', client: 'Trimble Internal', type: 'Fixed Price', value: '$320,000', valueRaw: 320000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Mar 1, 2026', daysLeft: 2 },
  { id: 'EST-2026-042', project: 'Mobile App v2.1 Features', client: 'Apex Corp', type: 'T&M', value: '$85,000', valueRaw: 85000, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 5, 2026', daysLeft: 6 },
  { id: 'EST-2026-043', project: 'ERP Post-Go-Live Support', client: 'GlobalTech Ltd', type: 'Retainer', value: '$45,000/mo', valueRaw: 45000, status: 'Draft', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 10, 2026', daysLeft: 11 },
  { id: 'EST-2026-044', project: 'Analytics Dashboard Enhancements', client: 'NexGen Analytics', type: 'Milestone', value: '$220,000', valueRaw: 220000, status: 'Awaiting Approval', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Feb 28, 2026', daysLeft: 1 },
  { id: 'EST-2026-045', project: 'Portal UX Redesign', client: 'Brightline Co', type: 'Fixed Price', value: '$175,000', valueRaw: 175000, status: 'Under Review', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 8, 2026', daysLeft: 9 },
  { id: 'EST-2026-046', project: 'Penetration Testing Scope', client: 'Trimble Internal', type: 'Fixed Price', value: '$38,000', valueRaw: 38000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Mar 15, 2026', daysLeft: 16 },
  { id: 'EST-2026-047', project: 'API Integration Expansion', client: 'CoreSystems Inc', type: 'T&M', value: '$95,000', valueRaw: 95000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Feb 25, 2026', daysLeft: -2 },
  { id: 'EST-2026-048', project: 'ML Pipeline Optimization', client: 'DataDrive AI', type: 'Milestone', value: '$410,000', valueRaw: 410000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 20, 2026', daysLeft: 21 },
  { id: 'EST-2026-049', project: 'DevOps Toolchain Setup', client: 'Trimble Internal', type: 'Fixed Price', value: '$62,000', valueRaw: 62000, status: 'Draft', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Apr 1, 2026', daysLeft: 33 },
  { id: 'EST-2026-050', project: 'Customer Onboarding Automation', client: 'Brightline Co', type: 'T&M', value: '$130,000', valueRaw: 130000, status: 'Awaiting Approval', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 3, 2026', daysLeft: 4 },
  { id: 'EST-2026-051', project: 'Reporting Module Rebuild', client: 'NexGen Analytics', type: 'Fixed Price', value: '$95,500', valueRaw: 95500, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 12, 2026', daysLeft: 13 },
  { id: 'EST-2026-052', project: 'Security Training Program', client: 'GlobalTech Ltd', type: 'Retainer', value: '$18,000/mo', valueRaw: 18000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Apr 5, 2026', daysLeft: 37 },
];

export const BIDDING_TASKS: BiddingTask[] = [
  {
    id: 'bt-1',
    title: 'Downtown Convention Center - Budget Review',
    priority: 'overdue',
    projectValue: '$8.5M',
    timeLabel: '2 hours ago',
    assigneeLabel: 'You',
    description: 'Q4 budget reconciliation shows 12% variance. Requires immediate approval.',
    alertMessage: 'High profit fade risk detected',
    alertTone: 'error',
    actionLabel: 'Review & Approve',
    scheduleTab: 'today',
  },
  {
    id: 'bt-2',
    title: 'Warehouse Renovation - Permit Approval',
    priority: 'high',
    projectValue: '$2.1M',
    timeLabel: '5 hours ago',
    assigneeLabel: 'Jennifer Park',
    description: 'City permit requires accurate engineer signature by EOD.',
    alertMessage: '1-day delay risk if not submitted',
    alertTone: 'warning',
    actionLabel: 'Coordinate with Jennifer Park',
    scheduleTab: 'today',
  },
  {
    id: 'bt-3',
    title: 'Office Tower Phase 2 - Resource Conflict',
    priority: 'high',
    projectValue: '$15.2M',
    timeLabel: 'Nearly 3:00 PM',
    assigneeLabel: 'You',
    description: '2 crane operators scheduled for 2 projects next week.',
    alertMessage: 'Potential 3-day project delay',
    alertTone: 'warning',
    actionLabel: 'Resolve Schedule',
    scheduleTab: 'today',
  },
  {
    id: 'bt-4',
    title: 'Eldorado Canyon framing package - Bid bond verification',
    priority: 'medium',
    projectValue: '$420K',
    timeLabel: 'Due tomorrow 9:00 AM',
    assigneeLabel: 'You',
    description: 'Bond must be on file before GC can award.',
    alertMessage: 'Insurance certificate expires in 5 days',
    alertTone: 'warning',
    actionLabel: 'Upload renewal',
    scheduleTab: 'tomorrow',
  },
  {
    id: 'bt-5',
    title: 'Regional water treatment RFQ - Vendor comparison',
    priority: 'medium',
    projectValue: '$1.2M',
    timeLabel: '1 day left',
    assigneeLabel: 'Procurement',
    description: 'Procurement requested a consolidated comparison matrix.',
    alertMessage: 'Pricing refresh requested by procurement',
    alertTone: 'warning',
    actionLabel: 'Refresh quotes',
    scheduleTab: 'tomorrow',
  },
  {
    id: 'bt-6',
    title: 'Parking structure retrofit - Scope clarification',
    priority: 'medium',
    projectValue: '$3.4M',
    timeLabel: 'This week',
    assigneeLabel: 'You',
    description: 'Owner asked for alternate phasing to reduce lane closures.',
    alertMessage: 'RFI response due before Friday standup',
    alertTone: 'warning',
    actionLabel: 'Draft RFI response',
    scheduleTab: 'week',
  },
];

export const ACTIVITIES: ActivityItem[] = [
  { id: 1, actorInitials: 'SC', text: 'updated Cloud Migration Phase 3 estimate — revised scope adds $40K', timeAgo: '18 min ago', icon: 'edit', iconColor: 'text-primary' },
  { id: 2, actorInitials: 'PN', text: 'flagged ERP System Upgrade budget at 95% — escalation required', timeAgo: '1 hr ago', icon: 'warning', iconColor: 'text-warning' },
  { id: 3, actorInitials: 'TE', text: 'submitted Analytics Dashboard estimate EST-2026-044 for approval', timeAgo: '2 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
  { id: 4, actorInitials: 'MO', text: 'Security Audit checkpoint "Network Controls" marked complete', timeAgo: '3 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
  { id: 5, actorInitials: 'JC', text: 'Mobile App Redesign moved to At Risk — testing resource shortfall', timeAgo: 'Yesterday', icon: 'warning', iconColor: 'text-warning' },
  { id: 6, actorInitials: 'LB', text: 'created draft estimate EST-2026-052 for Security Training Program', timeAgo: 'Yesterday', icon: 'edit', iconColor: 'text-primary' },
];

export const ATTENTION_ITEMS = [
  { id: 1, title: 'ERP Upgrade budget critical', subtitle: '95% consumed, $45K remaining', dotClass: 'bg-destructive' },
  { id: 2, title: 'API Gateway project overdue', subtitle: 'Was due Feb 14 — 13 days late', dotClass: 'bg-destructive' },
  { id: 3, title: 'EST-2026-047 overdue', subtitle: 'Awaiting approval since Feb 25', dotClass: 'bg-destructive' },
  { id: 4, title: 'Mobile App at risk', subtitle: 'Testing resource gap in March', dotClass: 'bg-warning' },
  { id: 5, title: 'EST-2026-044 due tomorrow', subtitle: 'Analytics Dashboard — $220K', dotClass: 'bg-warning' },
  { id: 6, title: 'ERP UAT sign-off overdue', subtitle: 'Milestone was due Feb 20', dotClass: 'bg-warning' },
];

export const TIME_OFF_REQUESTS = [
  { id: 1, name: 'Sarah Chen', initials: 'SC', type: 'Vacation', startDate: 'Mar 10', endDate: 'Mar 14', days: 5, status: 'Pending' as const },
  { id: 2, name: 'James Carter', initials: 'JC', type: 'Sick Leave', startDate: 'Mar 6', endDate: 'Mar 6', days: 1, status: 'Approved' as const },
  { id: 3, name: 'Priya Nair', initials: 'PN', type: 'Vacation', startDate: 'Mar 17', endDate: 'Mar 21', days: 5, status: 'Pending' as const },
  { id: 4, name: 'Tom Evans', initials: 'TE', type: 'Personal', startDate: 'Mar 8', endDate: 'Mar 8', days: 1, status: 'Approved' as const },
  { id: 5, name: 'Lena Brooks', initials: 'LB', type: 'Vacation', startDate: 'Apr 1', endDate: 'Apr 4', days: 4, status: 'Pending' as const },
  { id: 6, name: 'Mike Osei', initials: 'MO', type: 'Sick Leave', startDate: 'Mar 5', endDate: 'Mar 5', days: 1, status: 'Denied' as const },
];

export const RFIS: Rfi[] = [
  { id: '1', number: 'RFI-001', subject: 'Foundation depth clarification', project: 'Highway 290 Expansion', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 12' },
  { id: '2', number: 'RFI-002', subject: 'Steel grade specification', project: 'Downtown Bridge Rehab', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 28' },
  { id: '3', number: 'RFI-003', subject: 'Drainage system alignment', project: 'Highway 290 Expansion', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 15' },
  { id: '4', number: 'RFI-004', subject: 'Concrete mix design approval', project: 'Riverside Commercial Park', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 20' },
  { id: '5', number: 'RFI-005', subject: 'Electrical conduit routing', project: 'Airport Terminal B', assignee: 'Lena Brooks', status: 'closed', dueDate: 'Feb 15' },
  { id: '6', number: 'RFI-006', subject: 'Fire suppression specs', project: 'Downtown Bridge Rehab', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 1' },
  { id: '7', number: 'RFI-007', subject: 'Soil testing report review', project: 'Riverside Commercial Park', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 10' },
  { id: '8', number: 'RFI-008', subject: 'HVAC duct sizing confirmation', project: 'Airport Terminal B', assignee: 'James Carter', status: 'upcoming', dueDate: 'Mar 22' },
  { id: '9', number: 'RFI-009', subject: 'Retaining wall design change', project: 'Highway 290 Expansion', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 18' },
  { id: '10', number: 'RFI-010', subject: 'Waterproofing membrane spec', project: 'Downtown Bridge Rehab', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 30' },
];

export const SUBMITTALS: Submittal[] = [
  { id: '1', number: 'SUB-001', subject: 'Structural steel shop drawings', project: 'Highway 290 Expansion', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 14' },
  { id: '2', number: 'SUB-002', subject: 'Concrete mix design report', project: 'Downtown Bridge Rehab', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 25' },
  { id: '3', number: 'SUB-003', subject: 'Waterproofing membrane samples', project: 'Riverside Commercial Park', assignee: 'Priya Nair', status: 'closed', dueDate: 'Feb 18' },
  { id: '4', number: 'SUB-004', subject: 'HVAC equipment cut sheets', project: 'Airport Terminal B', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 22' },
  { id: '5', number: 'SUB-005', subject: 'Rebar placement drawings', project: 'Highway 290 Expansion', assignee: 'Lena Brooks', status: 'open', dueDate: 'Mar 16' },
  { id: '6', number: 'SUB-006', subject: 'Asphalt mix design', project: 'Downtown Bridge Rehab', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 3' },
  { id: '7', number: 'SUB-007', subject: 'Electrical panel schedule', project: 'Airport Terminal B', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 12' },
  { id: '8', number: 'SUB-008', subject: 'Glazing system product data', project: 'Riverside Commercial Park', assignee: 'James Carter', status: 'upcoming', dueDate: 'Mar 25' },
  { id: '9', number: 'SUB-009', subject: 'Fire-rated door schedule', project: 'Airport Terminal B', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 19' },
  { id: '10', number: 'SUB-010', subject: 'Pile driving records', project: 'Highway 290 Expansion', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 28' },
];

export const CALENDAR_APPOINTMENTS: CalendarAppointment[] = [
  // Bidding & preconstruction (Bert — same phase as home estimates & tasks)
  { id: 1, title: 'Bidding desk stand-up', date: new Date(2026, 2, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 2, title: 'Eldorado Canyon — steel & misc metals takeoff review', date: new Date(2026, 2, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 15, type: 'review' },
  { id: 3, title: 'Owner call — Downtown Convention Center budget', date: new Date(2026, 2, 2), startHour: 14, startMin: 0, endHour: 14, endMin: 45, type: 'call' },
  { id: 4, title: 'Bidding desk stand-up', date: new Date(2026, 2, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 5, title: 'Warehouse Renovation — permit packet QA', date: new Date(2026, 2, 3), startHour: 10, startMin: 30, endHour: 11, endMin: 45, type: 'review' },
  { id: 6, title: 'Focus: Convention Center escalation pricing', date: new Date(2026, 2, 3), startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 7, title: 'Bidding desk stand-up', date: new Date(2026, 2, 4), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 8, title: 'Parking structure retrofit — pre-bid site walk', date: new Date(2026, 2, 4), startHour: 13, startMin: 0, endHour: 14, endMin: 30, type: 'meeting' },
  { id: 9, title: 'Bidding desk stand-up', date: new Date(2026, 2, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 10, title: 'Office Tower Phase 2 — sub quote leveling session', date: new Date(2026, 2, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 11, title: 'Regional water treatment RFQ — GC shortlist call', date: new Date(2026, 2, 5), startHour: 14, startMin: 0, endHour: 14, endMin: 45, type: 'call' },
  { id: 12, title: 'Focus: Eldorado bid bond & insurance packet', date: new Date(2026, 2, 5), startHour: 15, startMin: 30, endHour: 17, endMin: 30, type: 'focus' },
  { id: 13, title: 'Bid calendar & resource sync', date: new Date(2026, 2, 6), startHour: 9, startMin: 0, endHour: 10, endMin: 0, type: 'meeting' },
  { id: 14, title: 'Estimate QA — Division 3 re-bid checklist', date: new Date(2026, 2, 6), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 15, title: 'Water treatment RFQ — pricing refresh deadline', date: new Date(2026, 2, 6), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 16, title: 'Bidding desk stand-up', date: new Date(2026, 2, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 17, title: 'Eldorado Canyon — enclosure systems scope review', date: new Date(2026, 2, 9), startHour: 10, startMin: 0, endHour: 11, endMin: 15, type: 'review' },
  { id: 18, title: 'Clubhouse Build — planning intake with architect', date: new Date(2026, 2, 9), startHour: 15, startMin: 0, endHour: 16, endMin: 0, type: 'call' },
  { id: 19, title: 'Bid procurement huddle', date: new Date(2026, 2, 10), startHour: 9, startMin: 0, endHour: 9, endMin: 45, type: 'meeting' },
  { id: 20, title: 'Downtown Convention Center — risk & fee workshop', date: new Date(2026, 2, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 21, title: 'Electrical subs — Clubhouse invite & deadline reminder', date: new Date(2026, 2, 10), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 22, title: 'Bidding desk stand-up', date: new Date(2026, 2, 11), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 23, title: 'Concrete vendor — alternate mix pricing call', date: new Date(2026, 2, 11), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 24, title: 'Focus: Office Tower crane & logistics assumptions', date: new Date(2026, 2, 11), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 25, title: 'Bidding desk stand-up', date: new Date(2026, 2, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 26, title: 'Parking retrofit — phasing sketch review', date: new Date(2026, 2, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 15, type: 'review' },
  { id: 27, title: 'Reporting Module Rebuild (EST-2026-051) — internal deadline', date: new Date(2026, 2, 12), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 28, title: 'Bidding desk stand-up', date: new Date(2026, 2, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 29, title: 'Warehouse Renovation — engineer sign-off chase', date: new Date(2026, 2, 13), startHour: 14, startMin: 0, endHour: 14, endMin: 45, type: 'call' },
  { id: 30, title: 'Bid debrief — prior week wins/losses', date: new Date(2026, 2, 16), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 31, title: 'GC interview — water treatment shortlist', date: new Date(2026, 2, 16), startHour: 13, startMin: 0, endHour: 13, endMin: 45, type: 'call' },
  { id: 32, title: 'Focus: Eldorado buyout assumptions update', date: new Date(2026, 2, 16), startHour: 14, startMin: 0, endHour: 16, endMin: 30, type: 'focus' },
  { id: 33, title: 'Bidding desk stand-up', date: new Date(2026, 2, 17), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 34, title: 'Clubhouse Build — MEP allowance scrub', date: new Date(2026, 2, 17), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 35, title: 'Bond agent — Eldorado renewal status call', date: new Date(2026, 2, 17), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 36, title: 'Bidding desk stand-up', date: new Date(2026, 2, 18), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 37, title: 'Convention Center — GC revision matrix review', date: new Date(2026, 2, 18), startHour: 11, startMin: 0, endHour: 12, endMin: 15, type: 'review' },
  { id: 38, title: 'Focus: Parking structure RFI draft', date: new Date(2026, 2, 18), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 39, title: 'Pre-bid conference — regional utilities package', date: new Date(2026, 2, 19), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 40, title: 'Owner rep — Office Tower crane window call', date: new Date(2026, 2, 19), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 41, title: 'Bid board — go/no-go on pursuits', date: new Date(2026, 2, 20), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 42, title: 'RFI log triage — parking & clubhouse', date: new Date(2026, 2, 20), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 43, title: 'Bidding desk stand-up', date: new Date(2026, 2, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 44, title: 'Portfolio margin review — active pursuits', date: new Date(2026, 2, 23), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 45, title: 'Focus: Proposal narrative — Convention Center', date: new Date(2026, 2, 23), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 46, title: 'Bidding desk stand-up', date: new Date(2026, 2, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 47, title: 'Eldorado Canyon — final pricing sanity check', date: new Date(2026, 2, 24), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 48, title: 'Trimble precon workflow sync', date: new Date(2026, 2, 24), startHour: 14, startMin: 0, endHour: 14, endMin: 45, type: 'call' },
  { id: 49, title: 'Bidding desk stand-up', date: new Date(2026, 2, 25), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 50, title: 'Water treatment RFQ — comparison matrix review', date: new Date(2026, 2, 25), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 51, title: 'Focus: Insurance certs & bond filing', date: new Date(2026, 2, 25), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 52, title: 'Bidding desk stand-up', date: new Date(2026, 2, 26), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 53, title: 'Estimate peer review — peer sign-off', date: new Date(2026, 2, 26), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 54, title: 'Clubhouse pursuit — deposit & fee deadline', date: new Date(2026, 2, 26), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 55, title: 'Scope review — Div 8 & waterproofing alternates', date: new Date(2026, 2, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 56, title: 'Team lunch — bid chase retro', date: new Date(2026, 2, 27), startHour: 12, startMin: 0, endHour: 13, endMin: 0, type: 'meeting' },
  { id: 57, title: 'Bidding desk stand-up', date: new Date(2026, 2, 30), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 58, title: 'Month-end pursuit forecast', date: new Date(2026, 2, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 59, title: 'Focus: Q2 pipeline scrub', date: new Date(2026, 2, 30), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 60, title: 'Bidding desk stand-up', date: new Date(2026, 2, 31), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 61, title: 'Archive metrics — historical win-rate readout', date: new Date(2026, 2, 31), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 62, title: 'Surety — bond line utilization call', date: new Date(2026, 2, 31), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 63, title: 'March pursuit closeout deadline', date: new Date(2026, 2, 31), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 64, title: 'Q2 pursuits kickoff', date: new Date(2026, 3, 1), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 65, title: 'Bid strategy — multi-site program', date: new Date(2026, 3, 1), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 66, title: 'Owner call — Clubhouse alternates', date: new Date(2026, 3, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 67, title: 'Bidding desk stand-up', date: new Date(2026, 3, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 68, title: 'Insurance renewal upload — Eldorado package', date: new Date(2026, 3, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 69, title: 'Focus: Water treatment final numbers', date: new Date(2026, 3, 2), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 70, title: 'Bidding desk stand-up', date: new Date(2026, 3, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 71, title: 'Structural submittal coordination — active jobs', date: new Date(2026, 3, 3), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 72, title: 'External estimate partner deliverable deadline', date: new Date(2026, 3, 3), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 73, title: 'Bidding desk stand-up', date: new Date(2026, 3, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 74, title: 'Convention Center — executive readout prep', date: new Date(2026, 3, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 75, title: 'Focus: Proposal graphics & exclusions', date: new Date(2026, 3, 6), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 76, title: 'Bidding desk stand-up', date: new Date(2026, 3, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 77, title: 'Parking retrofit — alternate phasing memo review', date: new Date(2026, 3, 7), startHour: 10, startMin: 30, endHour: 11, endMin: 45, type: 'review' },
  { id: 78, title: 'Trimble estimates team — model sync call', date: new Date(2026, 3, 7), startHour: 14, startMin: 0, endHour: 14, endMin: 45, type: 'call' },
  { id: 79, title: 'Clubhouse electrical quotes — follow-up deadline', date: new Date(2026, 3, 7), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 80, title: 'Bidding desk stand-up', date: new Date(2026, 3, 8), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 81, title: 'Office Tower — crane conflict mitigation plan', date: new Date(2026, 3, 8), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 82, title: 'Preconstruction — VE ideas backlog triage', date: new Date(2026, 3, 8), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 83, title: 'Bidding desk stand-up', date: new Date(2026, 3, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 84, title: 'Eldorado Canyon — owner-facing summary draft', date: new Date(2026, 3, 9), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 85, title: 'Focus: Scopes & alternates matrix', date: new Date(2026, 3, 9), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 86, title: 'Bid opening debrief (private)', date: new Date(2026, 3, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 87, title: 'RFI response cut — shared pursuits', date: new Date(2026, 3, 10), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 88, title: 'Bidding desk stand-up', date: new Date(2026, 3, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 89, title: 'Warehouse permit — city coordinator call', date: new Date(2026, 3, 13), startHour: 11, startMin: 0, endHour: 11, endMin: 45, type: 'call' },
  { id: 90, title: 'Focus: Bond verification checklist', date: new Date(2026, 3, 13), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 91, title: 'Bidding desk stand-up', date: new Date(2026, 3, 14), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 92, title: 'GC presentation dry run — Convention Center', date: new Date(2026, 3, 14), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 93, title: 'Civil sub — alternate haul route pricing call', date: new Date(2026, 3, 14), startHour: 14, startMin: 30, endHour: 15, endMin: 15, type: 'call' },
  { id: 94, title: 'Bidding desk stand-up', date: new Date(2026, 3, 15), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 95, title: 'Eldorado Canyon — internal final checklist', date: new Date(2026, 3, 15), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 96, title: 'Focus: Seal & submit Eldorado package', date: new Date(2026, 3, 15), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 97, title: 'Bidding desk stand-up', date: new Date(2026, 3, 16), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 98, title: 'Drawing update — electrical addendum review', date: new Date(2026, 3, 16), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 99, title: 'CM/GC — preconstruction alignment call', date: new Date(2026, 3, 16), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 100, title: 'Bid board — next two weeks coverage', date: new Date(2026, 3, 17), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 101, title: 'Pricing refresh deadline — client portal', date: new Date(2026, 3, 17), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 102, title: 'Bidding desk stand-up', date: new Date(2026, 3, 20), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 103, title: 'Clubhouse Build — leadership estimate readout', date: new Date(2026, 3, 20), startHour: 10, startMin: 0, endHour: 12, endMin: 0, type: 'meeting' },
  { id: 104, title: 'Focus: Fee & T&C final pass', date: new Date(2026, 3, 20), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 105, title: 'Bidding desk stand-up', date: new Date(2026, 3, 21), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 106, title: 'Post-review actions — clubhouse estimate', date: new Date(2026, 3, 21), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 107, title: 'Field ops — logistics assumptions call', date: new Date(2026, 3, 21), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 108, title: 'Bidding desk stand-up', date: new Date(2026, 3, 22), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 109, title: 'Risk register — pursuits over $5M', date: new Date(2026, 3, 22), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 110, title: 'Focus: Update archive bid log', date: new Date(2026, 3, 22), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 111, title: 'Bidding desk stand-up', date: new Date(2026, 3, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 112, title: 'Lessons learned — last month bid cycle', date: new Date(2026, 3, 23), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 113, title: 'Bidding desk stand-up', date: new Date(2026, 3, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 114, title: 'Department happy hour — bid wins', date: new Date(2026, 3, 24), startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
  { id: 115, title: 'Bidding desk stand-up', date: new Date(2026, 3, 27), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 116, title: 'Pursuit pipeline hygiene', date: new Date(2026, 3, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 117, title: 'Drainage package — engineer of record call', date: new Date(2026, 3, 27), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 118, title: 'Bidding desk stand-up', date: new Date(2026, 3, 28), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 119, title: 'Labor & productivity factors review', date: new Date(2026, 3, 28), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 120, title: 'Focus: Template cleanup for reuse', date: new Date(2026, 3, 28), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 121, title: 'MEP coordination workshop', date: new Date(2026, 3, 29), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 122, title: 'April cost book rollover', date: new Date(2026, 3, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 123, title: 'April financial close — pursuits', date: new Date(2026, 3, 30), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 124, title: 'Bidding desk stand-up', date: new Date(2026, 4, 1), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 125, title: 'May pursuit lane assignments', date: new Date(2026, 4, 1), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 126, title: 'DOT jurisdiction — liaison call', date: new Date(2026, 4, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 127, title: 'Bidding desk stand-up', date: new Date(2026, 4, 4), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 128, title: 'Focus: Summer backlog pricing', date: new Date(2026, 4, 4), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 129, title: 'Bidding desk stand-up', date: new Date(2026, 4, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 130, title: 'Envelope systems peer review', date: new Date(2026, 4, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 131, title: 'Geo-tech — borings summary call', date: new Date(2026, 4, 5), startHour: 14, startMin: 30, endHour: 15, endMin: 15, type: 'call' },
  { id: 132, title: 'Bidding desk stand-up', date: new Date(2026, 4, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 133, title: 'Multi-prime coordination tabletop', date: new Date(2026, 4, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 134, title: 'Focus: Subcontracts insurances review', date: new Date(2026, 4, 6), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 135, title: 'Bidding desk stand-up', date: new Date(2026, 4, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 136, title: 'Addenda log reconciliation', date: new Date(2026, 4, 7), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 137, title: 'Major pursuit sealed bid deadline', date: new Date(2026, 4, 7), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 138, title: 'Bid clarification Q&A session', date: new Date(2026, 4, 8), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 139, title: 'Celebration — awarded pursuit (internal)', date: new Date(2026, 4, 8), startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
];

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
