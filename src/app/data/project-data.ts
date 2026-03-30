import type { ProjectStatus } from './dashboard-data';
export type { ProjectStatus };
export type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';
export type RiskSeverity = 'high' | 'medium' | 'low';
export type DrawingType = 'server-room' | 'network' | 'power' | 'floor-plan' | 'architecture' | 'electrical' | 'data-center';

export interface Milestone {
  id: number;
  name: string;
  dueDate: string;
  status: MilestoneStatus;
  progress: number;
}

export interface TeamMember {
  id: number;
  initials: string;
  name: string;
  role: string;
  tasksCompleted: number;
  tasksTotal: number;
  availability: number;
}

export interface Task {
  id: number;
  title: string;
  assigneeInitials: string;
  assignee: string;
  priority: TaskPriority;
  dueDate: string;
  status: string;
}

export interface Risk {
  id: number;
  title: string;
  severity: RiskSeverity;
  impact: string;
  mitigation: string;
}

export interface ActivityEntry {
  id: number;
  actorInitials: string;
  text: string;
  timeAgo: string;
  icon: string;
}

export interface Drawing {
  id: number;
  name: string;
  type: DrawingType;
  version: string;
  isLatest: boolean;
  updatedBy: string;
  updatedAt: string;
  revisionCount: number;
  fileSize: string;
}

export interface SummaryStat {
  label: string;
  value: string;
  subtext: string;
  subtextClass: string;
}

export interface BudgetBreakdown {
  label: string;
  amount: string;
  pct: number;
  colorClass: string;
}

export interface ProjectDashboardData {
  name: string;
  status: ProjectStatus;
  summaryStats: SummaryStat[];
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  team: TeamMember[];
  activity: ActivityEntry[];
  latestDrawing: Drawing;
  budgetUsed: string;
  budgetTotal: string;
  budgetPct: number;
  budgetBreakdown: BudgetBreakdown[];
}

export const PROJECT_DATA: Record<number, ProjectDashboardData> = {
  1: {
    name: 'Riverside Office Complex',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '72%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$544K', subtext: '68% of $800K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '6', subtext: '2 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 15', subtext: '2 days remaining', subtextClass: 'text-warning font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Site Preparation & Demolition', dueDate: 'Jan 15, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Foundation & Below-Grade Work', dueDate: 'Feb 1, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Structural Steel Erection', dueDate: 'Feb 20, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'Building Envelope & Roofing', dueDate: 'Mar 5, 2026', status: 'in-progress', progress: 78 },
      { id: 5, name: 'MEP Rough-In', dueDate: 'Mar 12, 2026', status: 'in-progress', progress: 35 },
      { id: 6, name: 'Interior Finishes & Commissioning', dueDate: 'Mar 15, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Complete curtain wall installation on floors 3-5', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 2, title: 'Structural steel inspection for Level 4 connections', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Coordinate HVAC duct routing with electrical conduit', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 4, title: 'Safety audit for scaffolding on west elevation', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 11', status: 'To Do' },
      { id: 5, title: 'Submit revised elevator shaft drawings to city', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'medium', dueDate: 'Mar 13', status: 'To Do' },
      { id: 6, title: 'Review MEP coordination drawings for conflicts', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Mar 14', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Database migration data loss', severity: 'high', impact: 'Potential loss of transactional data during cutover', mitigation: 'Dual-write pattern with automated reconciliation checks' },
      { id: 2, title: 'Extended downtime during cutover', severity: 'medium', impact: 'Customer-facing services unavailable beyond maintenance window', mitigation: 'Blue-green deployment with automated rollback triggers' },
      { id: 3, title: 'Third-party API compatibility', severity: 'low', impact: 'Some integrations may need endpoint updates', mitigation: 'API gateway abstraction layer already in place' },
    ],
    team: [
      { id: 1, initials: 'SC', name: 'Sarah Chen', role: 'Project Manager', tasksCompleted: 14, tasksTotal: 18, availability: 100 },
      { id: 2, initials: 'PN', name: 'Priya Nair', role: 'Structural Engineer', tasksCompleted: 11, tasksTotal: 15, availability: 80 },
      { id: 3, initials: 'MO', name: 'Mike Osei', role: 'Site Superintendent', tasksCompleted: 8, tasksTotal: 12, availability: 100 },
      { id: 4, initials: 'JC', name: 'James Carter', role: 'Safety Manager', tasksCompleted: 5, tasksTotal: 8, availability: 60 },
      { id: 5, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 7, tasksTotal: 9, availability: 100 },
      { id: 6, initials: 'TE', name: 'Tom Evans', role: 'MEP Engineer', tasksCompleted: 6, tasksTotal: 10, availability: 40 },
    ],
    activity: [
      { id: 1, actorInitials: 'SC', text: 'Completed load balancer configuration for staging', timeAgo: '25 min ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'PN', text: 'Updated database replication status to 98% sync', timeAgo: '1 hr ago', icon: 'database' },
      { id: 3, actorInitials: 'MO', text: 'Deployed monitoring dashboards for Wave 1 services', timeAgo: '2 hrs ago', icon: 'dashboard' },
      { id: 4, actorInitials: 'JC', text: 'Submitted security review for migrated APIs', timeAgo: '3 hrs ago', icon: 'security' },
      { id: 5, actorInitials: 'LB', text: 'Sent stakeholder update on migration progress', timeAgo: '4 hrs ago', icon: 'email' },
      { id: 6, actorInitials: 'SC', text: 'Created cutover checklist for production Wave 2', timeAgo: '5 hrs ago', icon: 'clipboard' },
    ],
    latestDrawing: { id: 1, name: 'Server Room - Floor 3 Layout', type: 'server-room', version: 'v3.2', isLatest: true, updatedBy: 'Mike Osei', updatedAt: 'Mar 11, 2026', revisionCount: 8, fileSize: '4.2 MB' },
    budgetUsed: '$544K',
    budgetTotal: '$800K',
    budgetPct: 68,
    budgetBreakdown: [
      { label: 'Labor', amount: '$228K', pct: 42, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$131K', pct: 24, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$98K', pct: 18, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$54K', pct: 10, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$33K', pct: 6, colorClass: 'bg-foreground-40' },
    ],
  },

  2: {
    name: 'Harbor View Condominiums',
    status: 'At Risk',
    summaryStats: [
      { label: 'Schedule', value: '45%', subtext: 'At risk', subtextClass: 'text-warning' },
      { label: 'Budget Used', value: '$246K', subtext: '82% of $300K', subtextClass: 'text-destructive font-medium' },
      { label: 'Team Members', value: '5', subtext: '1 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 28', subtext: '15 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Excavation & Shoring', dueDate: 'Dec 15, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Foundation & Parking Garage', dueDate: 'Jan 20, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Concrete Superstructure (Floors 1-6)', dueDate: 'Feb 15, 2026', status: 'in-progress', progress: 72 },
      { id: 4, name: 'Exterior Cladding & Windows', dueDate: 'Mar 10, 2026', status: 'in-progress', progress: 20 },
      { id: 5, name: 'Unit Fit-Out & Finishes', dueDate: 'Mar 22, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Final Inspection & Certificate of Occupancy', dueDate: 'Mar 28, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Pour concrete deck for Level 5 east wing', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 12', status: 'In Progress' },
      { id: 2, title: 'Install window frames for units 301-320', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'high', dueDate: 'Mar 14', status: 'In Progress' },
      { id: 3, title: 'Resolve waterproofing deficiency at parking level', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 4, title: 'Run plumbing risers for floors 4-6', assigneeInitials: 'AW', assignee: 'Amy Wu', priority: 'medium', dueDate: 'Mar 18', status: 'To Do' },
      { id: 5, title: 'Fire stopping inspection for floor penetrations', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 6, title: 'Balcony railing mock-up approval from architect', assigneeInitials: 'NP', assignee: 'Nick Park', priority: 'low', dueDate: 'Mar 22', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Testing resource shortfall', severity: 'high', impact: 'QA team stretched thin across projects, may delay beta', mitigation: 'Contract QA resource engaged for March sprint' },
      { id: 2, title: 'iOS 18 API deprecation', severity: 'medium', impact: 'Three deprecated APIs used in current navigation stack', mitigation: 'Migration to new APIs prioritized in current sprint' },
      { id: 3, title: 'Design-to-code handoff gaps', severity: 'low', impact: 'Minor inconsistencies between Figma and implementation', mitigation: 'Weekly design review sessions established' },
    ],
    team: [
      { id: 1, initials: 'JC', name: 'James Carter', role: 'General Superintendent', tasksCompleted: 9, tasksTotal: 14, availability: 80 },
      { id: 2, initials: 'RK', name: 'Rachel Kim', role: 'Interior Design Lead', tasksCompleted: 12, tasksTotal: 16, availability: 100 },
      { id: 3, initials: 'DL', name: 'David Lin', role: 'Civil Engineer', tasksCompleted: 7, tasksTotal: 11, availability: 100 },
      { id: 4, initials: 'AW', name: 'Amy Wu', role: 'Estimator', tasksCompleted: 8, tasksTotal: 12, availability: 60 },
      { id: 5, initials: 'NP', name: 'Nick Park', role: 'Quality Control Inspector', tasksCompleted: 4, tasksTotal: 10, availability: 40 },
    ],
    activity: [
      { id: 1, actorInitials: 'JC', text: 'Resolved gesture conflict on home feed swipe', timeAgo: '30 min ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'RK', text: 'Uploaded revised settings screen mockups', timeAgo: '1 hr ago', icon: 'image' },
      { id: 3, actorInitials: 'DL', text: 'Merged bottom nav component to develop branch', timeAgo: '2 hrs ago', icon: 'check_circle' },
      { id: 4, actorInitials: 'AW', text: 'Filed bug for Android 14 notification handling', timeAgo: '4 hrs ago', icon: 'warning' },
      { id: 5, actorInitials: 'NP', text: 'Completed regression test suite for onboarding flow', timeAgo: '5 hrs ago', icon: 'clipboard' },
    ],
    latestDrawing: { id: 1, name: 'App Navigation Flow v2', type: 'architecture', version: 'v2.4', isLatest: true, updatedBy: 'Rachel Kim', updatedAt: 'Mar 10, 2026', revisionCount: 12, fileSize: '2.8 MB' },
    budgetUsed: '$246K',
    budgetTotal: '$300K',
    budgetPct: 82,
    budgetBreakdown: [
      { label: 'Labor', amount: '$118K', pct: 48, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$44K', pct: 18, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$30K', pct: 12, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$37K', pct: 15, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$17K', pct: 7, colorClass: 'bg-foreground-40' },
    ],
  },

  3: {
    name: 'Downtown Transit Hub',
    status: 'Overdue',
    summaryStats: [
      { label: 'Schedule', value: '60%', subtext: 'Overdue', subtextClass: 'text-destructive font-medium' },
      { label: 'Budget Used', value: '$855K', subtext: '95% of $900K', subtextClass: 'text-destructive font-medium' },
      { label: 'Team Members', value: '8', subtext: '1 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Feb 20', subtext: '21 days overdue', subtextClass: 'text-destructive font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Utility Relocation & Site Clearing', dueDate: 'Oct 1, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Deep Foundation & Piling', dueDate: 'Nov 15, 2025', status: 'completed', progress: 100 },
      { id: 3, name: 'Station Platform Structure', dueDate: 'Jan 10, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'Concourse & Canopy Steel', dueDate: 'Feb 10, 2026', status: 'overdue', progress: 65 },
      { id: 5, name: 'Track & Signal Installation', dueDate: 'Feb 15, 2026', status: 'in-progress', progress: 40 },
      { id: 6, name: 'Systems Testing & Revenue Service', dueDate: 'Feb 20, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Resolve RFI backlog on canopy steel connections (14 open)', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Complete signal conduit routing for platform 2', assigneeInitials: 'KT', assignee: 'Karen Torres', priority: 'high', dueDate: 'Mar 3', status: 'In Progress' },
      { id: 3, title: 'Escalate concrete supply delay with vendor', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 1', status: 'In Progress' },
      { id: 4, title: 'Submit revised ADA compliance drawings to transit authority', assigneeInitials: 'RM', assignee: 'Rita Moreno', priority: 'medium', dueDate: 'Mar 8', status: 'To Do' },
      { id: 5, title: 'Reconcile as-built survey with design elevations', assigneeInitials: 'BW', assignee: 'Brian Walsh', priority: 'high', dueDate: 'Mar 6', status: 'To Do' },
      { id: 6, title: 'Coordinate track outage windows with transit operations', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'medium', dueDate: 'Mar 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Budget overrun imminent', severity: 'high', impact: 'Only $45K remaining — insufficient for go-live support', mitigation: 'Change request submitted for $120K budget extension' },
      { id: 2, title: 'UAT defect backlog growing', severity: 'high', impact: '14 critical defects blocking sign-off', mitigation: 'Dedicated bug-fix sprint with vendor support' },
      { id: 3, title: 'User adoption resistance', severity: 'medium', impact: 'Finance team unfamiliar with new approval workflows', mitigation: 'Additional training sessions and quick-reference guides' },
    ],
    team: [
      { id: 1, initials: 'PN', name: 'Priya Nair', role: 'Project Manager', tasksCompleted: 22, tasksTotal: 30, availability: 100 },
      { id: 2, initials: 'KT', name: 'Karen Torres', role: 'Scheduling Manager', tasksCompleted: 15, tasksTotal: 20, availability: 100 },
      { id: 3, initials: 'BW', name: 'Brian Walsh', role: 'Structural Engineer', tasksCompleted: 10, tasksTotal: 16, availability: 80 },
      { id: 4, initials: 'RM', name: 'Rita Moreno', role: 'Permits Coordinator', tasksCompleted: 8, tasksTotal: 12, availability: 60 },
      { id: 5, initials: 'TE', name: 'Tom Evans', role: 'MEP Coordinator', tasksCompleted: 12, tasksTotal: 14, availability: 40 },
      { id: 6, initials: 'PN', name: 'Priya Nair', role: 'Quality Assurance Manager', tasksCompleted: 9, tasksTotal: 18, availability: 100 },
      { id: 7, initials: 'VR', name: 'Vikram Rao', role: 'BIM Manager', tasksCompleted: 6, tasksTotal: 8, availability: 100 },
      { id: 8, initials: 'LB', name: 'Lena Brooks', role: 'Document Controller', tasksCompleted: 11, tasksTotal: 13, availability: 80 },
    ],
    activity: [
      { id: 1, actorInitials: 'PN', text: 'Escalated critical defect to vendor support team', timeAgo: '45 min ago', icon: 'warning' },
      { id: 2, actorInitials: 'KT', text: 'Completed payroll module configuration review', timeAgo: '2 hrs ago', icon: 'check_circle' },
      { id: 3, actorInitials: 'BW', text: 'Ran data reconciliation — 3 discrepancies found', timeAgo: '3 hrs ago', icon: 'database' },
      { id: 4, actorInitials: 'RM', text: 'Scheduled additional training for finance team', timeAgo: '4 hrs ago', icon: 'calendar' },
      { id: 5, actorInitials: 'PN', text: 'Submitted budget extension change request', timeAgo: 'Yesterday', icon: 'edit' },
    ],
    latestDrawing: { id: 1, name: 'ERP Integration Architecture', type: 'architecture', version: 'v4.1', isLatest: true, updatedBy: 'Tom Evans', updatedAt: 'Mar 8, 2026', revisionCount: 15, fileSize: '6.1 MB' },
    budgetUsed: '$855K',
    budgetTotal: '$900K',
    budgetPct: 95,
    budgetBreakdown: [
      { label: 'Labor', amount: '$325K', pct: 38, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$214K', pct: 25, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$128K', pct: 15, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$137K', pct: 16, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$51K', pct: 6, colorClass: 'bg-foreground-40' },
    ],
  },

  4: {
    name: 'Lakeside Medical Center',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '35%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$150K', subtext: '30% of $500K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '7', subtext: '3 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Apr 10', subtext: '28 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Site Work & Underground Utilities', dueDate: 'Jan 20, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Concrete Foundation & Slab-on-Grade', dueDate: 'Feb 15, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Structural Frame & Roof Deck', dueDate: 'Mar 10, 2026', status: 'in-progress', progress: 60 },
      { id: 4, name: 'MEP Systems & Medical Gas Rough-In', dueDate: 'Mar 25, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'Interior Fit-Out & Equipment Install', dueDate: 'Apr 5, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Commissioning & Health Dept. Inspection', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Complete steel erection for surgical wing', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'high', dueDate: 'Mar 15', status: 'In Progress' },
      { id: 2, title: 'Coordinate medical gas piping layout with equipment vendor', assigneeInitials: 'AJ', assignee: 'Anita Joshi', priority: 'high', dueDate: 'Mar 18', status: 'To Do' },
      { id: 3, title: 'Inspect fire-rated wall assemblies on Level 2', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 4, title: 'Review cost estimate for radiology shielding change order', assigneeInitials: 'CH', assignee: 'Chris Hall', priority: 'medium', dueDate: 'Mar 22', status: 'To Do' },
      { id: 5, title: 'Process subcontractor pay application for mechanical work', assigneeInitials: 'SP', assignee: 'Sara Park', priority: 'low', dueDate: 'Mar 28', status: 'To Do' },
      { id: 6, title: 'Update BIM model with as-built structural changes', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Apr 1', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Data source latency issues', severity: 'medium', impact: 'Real-time dashboards may show stale data under load', mitigation: 'Caching layer with configurable refresh intervals' },
      { id: 2, title: 'Schema evolution conflicts', severity: 'low', impact: 'Upstream schema changes could break pipeline transforms', mitigation: 'Schema registry with backward compatibility enforcement' },
    ],
    team: [
      { id: 1, initials: 'TE', name: 'Tom Evans', role: 'Project Director', tasksCompleted: 8, tasksTotal: 14, availability: 100 },
      { id: 2, initials: 'AJ', name: 'Anita Joshi', role: 'Biomedical Equipment Planner', tasksCompleted: 6, tasksTotal: 10, availability: 100 },
      { id: 3, initials: 'MO', name: 'Mike Osei', role: 'Site Superintendent', tasksCompleted: 4, tasksTotal: 8, availability: 60 },
      { id: 4, initials: 'CH', name: 'Chris Hall', role: 'Cost Engineer', tasksCompleted: 5, tasksTotal: 9, availability: 100 },
      { id: 5, initials: 'SP', name: 'Sara Park', role: 'Contract Administrator', tasksCompleted: 3, tasksTotal: 6, availability: 80 },
      { id: 6, initials: 'RK', name: 'Rachel Kim', role: 'Architect', tasksCompleted: 2, tasksTotal: 7, availability: 100 },
      { id: 7, initials: 'DL', name: 'David Lin', role: 'MEP Engineer', tasksCompleted: 3, tasksTotal: 5, availability: 40 },
    ],
    activity: [
      { id: 1, actorInitials: 'TE', text: 'Completed dashboard wireframes for executive view', timeAgo: '1 hr ago', icon: 'dashboard' },
      { id: 2, actorInitials: 'AJ', text: 'Deployed data pipeline v2 to staging environment', timeAgo: '2 hrs ago', icon: 'check_circle' },
      { id: 3, actorInitials: 'CH', text: 'Validated data quality rules for customer dataset', timeAgo: '3 hrs ago', icon: 'check_circle' },
      { id: 4, actorInitials: 'MO', text: 'Set up monitoring alerts for pipeline failures', timeAgo: '5 hrs ago', icon: 'notifications' },
      { id: 5, actorInitials: 'SP', text: 'Published first draft of data dictionary', timeAgo: 'Yesterday', icon: 'edit' },
    ],
    latestDrawing: { id: 1, name: 'Data Pipeline Architecture', type: 'architecture', version: 'v2.0', isLatest: true, updatedBy: 'Tom Evans', updatedAt: 'Mar 9, 2026', revisionCount: 6, fileSize: '3.5 MB' },
    budgetUsed: '$150K',
    budgetTotal: '$500K',
    budgetPct: 30,
    budgetBreakdown: [
      { label: 'Labor', amount: '$68K', pct: 45, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$33K', pct: 22, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$24K', pct: 16, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$15K', pct: 10, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$10K', pct: 7, colorClass: 'bg-foreground-40' },
    ],
  },

  5: {
    name: 'Westfield Shopping Center',
    status: 'Planning',
    summaryStats: [
      { label: 'Schedule', value: '12%', subtext: 'Planning', subtextClass: 'text-foreground-60' },
      { label: 'Budget Used', value: '$24K', subtext: '8% of $350K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '4', subtext: '3 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Apr 30', subtext: '48 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Demolition & Abatement', dueDate: 'Feb 10, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Structural Reinforcement & New Foundations', dueDate: 'Mar 1, 2026', status: 'in-progress', progress: 75 },
      { id: 3, name: 'Anchor Tenant Build-Out', dueDate: 'Mar 20, 2026', status: 'upcoming', progress: 0 },
      { id: 4, name: 'Common Area & Food Court Construction', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'Parking & Site Improvements', dueDate: 'Apr 22, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Grand Opening & Tenant Move-In', dueDate: 'Apr 30, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Finalize structural engineering for anchor store entry', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Prepare cost estimate for food court mechanical scope', assigneeInitials: 'NP', assignee: 'Nick Park', priority: 'medium', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Review storefront elevation drawings with architect', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 4, title: 'Procure long-lead items for escalator installation', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 15', status: 'To Do' },
      { id: 5, title: 'Submit fire protection shop drawings for review', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'low', dueDate: 'Mar 18', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Scope creep from stakeholders', severity: 'medium', impact: 'Requirements keep expanding beyond initial brief', mitigation: 'Strict change control process with prioritized backlog' },
      { id: 2, title: 'Backend API readiness', severity: 'medium', impact: 'Portal depends on new API endpoints not yet built', mitigation: 'Mock API layer for parallel frontend development' },
    ],
    team: [
      { id: 1, initials: 'LB', name: 'Lena Brooks', role: 'Project Manager', tasksCompleted: 4, tasksTotal: 8, availability: 100 },
      { id: 2, initials: 'RK', name: 'Rachel Kim', role: 'Architect', tasksCompleted: 2, tasksTotal: 6, availability: 100 },
      { id: 3, initials: 'DL', name: 'David Lin', role: 'General Contractor Lead', tasksCompleted: 1, tasksTotal: 5, availability: 80 },
      { id: 4, initials: 'NP', name: 'Nick Park', role: 'Estimator', tasksCompleted: 3, tasksTotal: 5, availability: 100 },
    ],
    activity: [
      { id: 1, actorInitials: 'LB', text: 'Completed stakeholder interview with finance team', timeAgo: '2 hrs ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'NP', text: 'Submitted competitive analysis report', timeAgo: '4 hrs ago', icon: 'edit' },
      { id: 3, actorInitials: 'RK', text: 'Created initial mood board for portal branding', timeAgo: 'Yesterday', icon: 'image' },
      { id: 4, actorInitials: 'DL', text: 'Set up frontend project scaffold with Vite', timeAgo: 'Yesterday', icon: 'check_circle' },
    ],
    latestDrawing: { id: 1, name: 'Portal Sitemap & Wireframes', type: 'architecture', version: 'v1.2', isLatest: true, updatedBy: 'Rachel Kim', updatedAt: 'Mar 6, 2026', revisionCount: 4, fileSize: '1.8 MB' },
    budgetUsed: '$24K',
    budgetTotal: '$350K',
    budgetPct: 8,
    budgetBreakdown: [
      { label: 'Labor', amount: '$12K', pct: 50, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$4K', pct: 17, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$2K', pct: 8, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$4K', pct: 17, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$2K', pct: 8, colorClass: 'bg-foreground-40' },
    ],
  },

  6: {
    name: 'Metro Bridge Rehabilitation',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '88%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$108K', subtext: '72% of $150K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '5', subtext: '2 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 5', subtext: 'Due today', subtextClass: 'text-warning font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Bridge Condition Assessment & Permits', dueDate: 'Jan 10, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Traffic Detour Setup & Lane Closures', dueDate: 'Jan 30, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Deck Removal & Bearing Replacement', dueDate: 'Feb 15, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'Substructure Repair & Seismic Retrofit', dueDate: 'Feb 28, 2026', status: 'completed', progress: 100 },
      { id: 5, name: 'New Deck Pour & Barrier Rails', dueDate: 'Mar 3, 2026', status: 'in-progress', progress: 85 },
      { id: 6, name: 'Final Inspection & Traffic Reopening', dueDate: 'Mar 5, 2026', status: 'in-progress', progress: 50 },
    ],
    tasks: [
      { id: 1, title: 'Complete bridge deck concrete pour for spans 3-4', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'high', dueDate: 'Mar 4', status: 'In Progress' },
      { id: 2, title: 'Verify bearing alignment on 3 critical abutments', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 4', status: 'In Progress' },
      { id: 3, title: 'Compile environmental compliance documentation for DOT', assigneeInitials: 'AW', assignee: 'Amy Wu', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 4, title: 'Install permanent barrier rail and striping', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'medium', dueDate: 'Mar 5', status: 'To Do' },
      { id: 5, title: 'Coordinate traffic lane reopening with DOT', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 5', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Three critical findings unresolved', severity: 'high', impact: 'Could delay certification if not remediated by deadline', mitigation: 'Daily standup with remediation owners, escalation path defined' },
      { id: 2, title: 'Auditor availability', severity: 'low', impact: 'External auditor may need additional evidence collection time', mitigation: 'Pre-staged evidence repository with organized documentation' },
    ],
    team: [
      { id: 1, initials: 'MO', name: 'Mike Osei', role: 'Bridge Engineer', tasksCompleted: 18, tasksTotal: 20, availability: 100 },
      { id: 2, initials: 'JC', name: 'James Carter', role: 'Field Engineer', tasksCompleted: 12, tasksTotal: 14, availability: 100 },
      { id: 3, initials: 'AW', name: 'Amy Wu', role: 'Environmental Compliance Specialist', tasksCompleted: 9, tasksTotal: 11, availability: 80 },
      { id: 4, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 7, tasksTotal: 8, availability: 60 },
      { id: 5, initials: 'VR', name: 'Vikram Rao', role: 'Traffic Control Manager', tasksCompleted: 10, tasksTotal: 10, availability: 100 },
    ],
    activity: [
      { id: 1, actorInitials: 'MO', text: 'Completed network controls checkpoint review', timeAgo: '1 hr ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'JC', text: 'Verified fix for SQL injection finding in portal', timeAgo: '2 hrs ago', icon: 'security' },
      { id: 3, actorInitials: 'AW', text: 'Uploaded SOC 2 evidence package to shared drive', timeAgo: '3 hrs ago', icon: 'upload' },
      { id: 4, actorInitials: 'VR', text: 'Closed last network segmentation finding', timeAgo: '4 hrs ago', icon: 'check_circle' },
      { id: 5, actorInitials: 'LB', text: 'Sent final week status update to stakeholders', timeAgo: '5 hrs ago', icon: 'email' },
    ],
    latestDrawing: { id: 1, name: 'Network Security Topology', type: 'network', version: 'v2.3', isLatest: true, updatedBy: 'Mike Osei', updatedAt: 'Mar 3, 2026', revisionCount: 9, fileSize: '5.4 MB' },
    budgetUsed: '$108K',
    budgetTotal: '$150K',
    budgetPct: 72,
    budgetBreakdown: [
      { label: 'Labor', amount: '$48K', pct: 44, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$20K', pct: 19, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$15K', pct: 14, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$18K', pct: 17, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$7K', pct: 6, colorClass: 'bg-foreground-40' },
    ],
  },

  7: {
    name: 'Sunset Ridge Apartments',
    status: 'Overdue',
    summaryStats: [
      { label: 'Schedule', value: '30%', subtext: 'Overdue', subtextClass: 'text-destructive font-medium' },
      { label: 'Budget Used', value: '$110K', subtext: '55% of $200K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '4', subtext: '0 available', subtextClass: 'text-destructive font-medium' },
      { label: 'Due Date', value: 'Feb 14', subtext: '27 days overdue', subtextClass: 'text-destructive font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Geotechnical Survey & Site Prep', dueDate: 'Dec 1, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Foundation & Podium Structure', dueDate: 'Jan 15, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Wood-Frame Superstructure (Floors 1-4)', dueDate: 'Feb 5, 2026', status: 'overdue', progress: 55 },
      { id: 4, name: 'Exterior Envelope & Roofing', dueDate: 'Feb 10, 2026', status: 'overdue', progress: 15 },
      { id: 5, name: 'Unit Rough-In (MEP/Drywall)', dueDate: 'Feb 14, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Punch List & Certificate of Occupancy', dueDate: 'Mar 1, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Resolve framing deficiency on Building B stairwell', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Install roof trusses for Building A north wing', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Fix stormwater drainage conflict at courtyard', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 3', status: 'In Progress' },
      { id: 4, title: 'Submit siding material substitution for owner approval', assigneeInitials: 'SP', assignee: 'Sara Park', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 5, title: 'Pressure test domestic water lines for floors 1-2', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Legacy service dependencies', severity: 'high', impact: 'Three services still tightly coupled to old gateway routing', mitigation: 'Adapter pattern with gradual traffic shifting' },
      { id: 2, title: 'Team capacity exhausted', severity: 'high', impact: 'All team members at 100% allocation, no buffer', mitigation: 'Request temporary resource from platform team' },
      { id: 3, title: 'Client-facing API breaking changes', severity: 'medium', impact: 'Some consumers may not handle new URL patterns', mitigation: 'Reverse proxy shim to maintain backward compatibility' },
    ],
    team: [
      { id: 1, initials: 'SC', name: 'Sarah Chen', role: 'Project Manager', tasksCompleted: 5, tasksTotal: 12, availability: 100 },
      { id: 2, initials: 'DL', name: 'David Lin', role: 'Site Superintendent', tasksCompleted: 3, tasksTotal: 10, availability: 100 },
      { id: 3, initials: 'SP', name: 'Sara Park', role: 'Contract Administrator', tasksCompleted: 2, tasksTotal: 5, availability: 100 },
      { id: 4, initials: 'NP', name: 'Nick Park', role: 'Quality Control Inspector', tasksCompleted: 1, tasksTotal: 6, availability: 100 },
    ],
    activity: [
      { id: 1, actorInitials: 'SC', text: 'Identified root cause of rate limiter bypass bug', timeAgo: '40 min ago', icon: 'warning' },
      { id: 2, actorInitials: 'DL', text: 'Migrated user-service to new gateway endpoint', timeAgo: '2 hrs ago', icon: 'check_circle' },
      { id: 3, actorInitials: 'SC', text: 'Updated CORS configuration for staging environment', timeAgo: '4 hrs ago', icon: 'edit' },
      { id: 4, actorInitials: 'NP', text: 'Created test suite for gateway health checks', timeAgo: 'Yesterday', icon: 'clipboard' },
      { id: 5, actorInitials: 'SP', text: 'Published API migration guide for consumers', timeAgo: 'Yesterday', icon: 'edit' },
    ],
    latestDrawing: { id: 1, name: 'API Gateway Architecture', type: 'architecture', version: 'v3.0', isLatest: true, updatedBy: 'Sarah Chen', updatedAt: 'Mar 5, 2026', revisionCount: 11, fileSize: '3.9 MB' },
    budgetUsed: '$110K',
    budgetTotal: '$200K',
    budgetPct: 55,
    budgetBreakdown: [
      { label: 'Labor', amount: '$51K', pct: 46, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$22K', pct: 20, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$17K', pct: 15, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$13K', pct: 12, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$7K', pct: 7, colorClass: 'bg-foreground-40' },
    ],
  },

  8: {
    name: 'Industrial Park Warehouse',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '20%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$90K', subtext: '18% of $500K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '6', subtext: '4 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'May 20', subtext: '67 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Site Grading & Stormwater Management', dueDate: 'Feb 1, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Foundation & Slab-on-Grade', dueDate: 'Feb 28, 2026', status: 'in-progress', progress: 80 },
      { id: 3, name: 'Pre-Engineered Metal Building Erection', dueDate: 'Mar 20, 2026', status: 'in-progress', progress: 25 },
      { id: 4, name: 'Loading Dock & Overhead Doors', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'Fire Suppression & Electrical Distribution', dueDate: 'May 1, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Final Inspection & Tenant Handover', dueDate: 'May 20, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Complete slab-on-grade pour for warehouse bay 1', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 2, title: 'Erect steel columns and purlins for bays 2-4', assigneeInitials: 'CH', assignee: 'Chris Hall', priority: 'high', dueDate: 'Mar 15', status: 'In Progress' },
      { id: 3, title: 'Install underground fire main and hydrant connections', assigneeInitials: 'AJ', assignee: 'Anita Joshi', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 4, title: 'Verify compaction test results for truck apron subbase', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'medium', dueDate: 'Mar 28', status: 'To Do' },
      { id: 5, title: 'Run conduit for 480V electrical distribution panels', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Apr 5', status: 'To Do' },
      { id: 6, title: 'Submit O&M manuals and warranty documentation', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'low', dueDate: 'Apr 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'GPU resource availability', severity: 'medium', impact: 'Training jobs may queue during peak usage periods', mitigation: 'Reserved GPU instances with spot instance fallback' },
      { id: 2, title: 'Model reproducibility', severity: 'low', impact: 'Different results across environments due to dependency drift', mitigation: 'Containerized environments with pinned dependency versions' },
    ],
    team: [
      { id: 1, initials: 'PN', name: 'Priya Nair', role: 'Project Manager', tasksCompleted: 5, tasksTotal: 12, availability: 100 },
      { id: 2, initials: 'CH', name: 'Chris Hall', role: 'Warehouse Superintendent', tasksCompleted: 3, tasksTotal: 8, availability: 100 },
      { id: 3, initials: 'AJ', name: 'Anita Joshi', role: 'Structural Engineer', tasksCompleted: 4, tasksTotal: 10, availability: 100 },
      { id: 4, initials: 'TE', name: 'Tom Evans', role: 'Concrete Foreman', tasksCompleted: 2, tasksTotal: 6, availability: 80 },
      { id: 5, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 2, tasksTotal: 4, availability: 100 },
      { id: 6, initials: 'DL', name: 'David Lin', role: 'Safety Officer', tasksCompleted: 3, tasksTotal: 7, availability: 60 },
    ],
    activity: [
      { id: 1, actorInitials: 'PN', text: 'Configured MLflow experiment tracking for staging', timeAgo: '1 hr ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'CH', text: 'Published base Docker image for model serving', timeAgo: '3 hrs ago', icon: 'check_circle' },
      { id: 3, actorInitials: 'AJ', text: 'Benchmarked feature store query performance', timeAgo: '4 hrs ago', icon: 'dashboard' },
      { id: 4, actorInitials: 'DL', text: 'Set up Kubernetes namespace for ML workloads', timeAgo: '5 hrs ago', icon: 'check_circle' },
      { id: 5, actorInitials: 'TE', text: 'Created Grafana dashboard templates for model metrics', timeAgo: 'Yesterday', icon: 'dashboard' },
    ],
    latestDrawing: { id: 1, name: 'Warehouse Floor Plan', type: 'architecture', version: 'v1.5', isLatest: true, updatedBy: 'Priya Nair', updatedAt: 'Mar 7, 2026', revisionCount: 5, fileSize: '2.9 MB' },
    budgetUsed: '$90K',
    budgetTotal: '$500K',
    budgetPct: 18,
    budgetBreakdown: [
      { label: 'Labor', amount: '$39K', pct: 43, colorClass: 'bg-primary' },
      { label: 'Materials', amount: '$20K', pct: 22, colorClass: 'bg-success' },
      { label: 'Equipment', amount: '$16K', pct: 18, colorClass: 'bg-warning' },
      { label: 'Subcontractors', amount: '$9K', pct: 10, colorClass: 'bg-secondary' },
      { label: 'Overhead', amount: '$6K', pct: 7, colorClass: 'bg-foreground-40' },
    ],
  },
};

export const RIVERSIDE_OFFICE_PROJECT = PROJECT_DATA[1];
export const HARBOR_VIEW_PROJECT = PROJECT_DATA[2];
export const TRANSIT_HUB_PROJECT = PROJECT_DATA[3];
export const LAKESIDE_MEDICAL_PROJECT = PROJECT_DATA[4];
export const WESTFIELD_SHOPPING_PROJECT = PROJECT_DATA[5];
export const METRO_BRIDGE_PROJECT = PROJECT_DATA[6];
export const SUNSET_RIDGE_PROJECT = PROJECT_DATA[7];
export const INDUSTRIAL_PARK_PROJECT = PROJECT_DATA[8];
