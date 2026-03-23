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
    name: 'Cloud Infrastructure Migration',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '72%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$544K', subtext: '68% of $800K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '6', subtext: '2 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 15', subtext: '2 days remaining', subtextClass: 'text-warning font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Infrastructure Assessment', dueDate: 'Jan 15, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Architecture Design & Approval', dueDate: 'Feb 1, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Dev/Staging Migration', dueDate: 'Feb 20, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'Production Migration Wave 1', dueDate: 'Mar 5, 2026', status: 'in-progress', progress: 78 },
      { id: 5, name: 'Production Migration Wave 2', dueDate: 'Mar 12, 2026', status: 'in-progress', progress: 35 },
      { id: 6, name: 'Cutover & Validation', dueDate: 'Mar 15, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Configure load balancer for prod cluster', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 2, title: 'Database replication validation', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Update DNS records for new endpoints', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 4, title: 'Security scan on migrated services', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 11', status: 'To Do' },
      { id: 5, title: 'Client notification for maintenance window', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'medium', dueDate: 'Mar 13', status: 'To Do' },
      { id: 6, title: 'Rollback procedure documentation', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Mar 14', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Database migration data loss', severity: 'high', impact: 'Potential loss of transactional data during cutover', mitigation: 'Dual-write pattern with automated reconciliation checks' },
      { id: 2, title: 'Extended downtime during cutover', severity: 'medium', impact: 'Customer-facing services unavailable beyond maintenance window', mitigation: 'Blue-green deployment with automated rollback triggers' },
      { id: 3, title: 'Third-party API compatibility', severity: 'low', impact: 'Some integrations may need endpoint updates', mitigation: 'API gateway abstraction layer already in place' },
    ],
    team: [
      { id: 1, initials: 'SC', name: 'Sarah Chen', role: 'Project Lead', tasksCompleted: 14, tasksTotal: 18, availability: 100 },
      { id: 2, initials: 'PN', name: 'Priya Nair', role: 'Senior Engineer', tasksCompleted: 11, tasksTotal: 15, availability: 80 },
      { id: 3, initials: 'MO', name: 'Mike Osei', role: 'DevOps Engineer', tasksCompleted: 8, tasksTotal: 12, availability: 100 },
      { id: 4, initials: 'JC', name: 'James Carter', role: 'Security Analyst', tasksCompleted: 5, tasksTotal: 8, availability: 60 },
      { id: 5, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 7, tasksTotal: 9, availability: 100 },
      { id: 6, initials: 'TE', name: 'Tom Evans', role: 'Solutions Architect', tasksCompleted: 6, tasksTotal: 10, availability: 40 },
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
      { label: 'Labor', amount: '$320K', pct: 59, colorClass: 'bg-primary' },
      { label: 'Infrastructure', amount: '$144K', pct: 26, colorClass: 'bg-success' },
      { label: 'Licensing', amount: '$56K', pct: 10, colorClass: 'bg-warning' },
      { label: 'Other', amount: '$24K', pct: 5, colorClass: 'bg-secondary' },
    ],
  },

  2: {
    name: 'Mobile App Redesign',
    status: 'At Risk',
    summaryStats: [
      { label: 'Schedule', value: '45%', subtext: 'At risk', subtextClass: 'text-warning' },
      { label: 'Budget Used', value: '$246K', subtext: '82% of $300K', subtextClass: 'text-destructive font-medium' },
      { label: 'Team Members', value: '5', subtext: '1 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 28', subtext: '15 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'UX Research & Discovery', dueDate: 'Dec 15, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Design System Update', dueDate: 'Jan 20, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Core Navigation Rebuild', dueDate: 'Feb 15, 2026', status: 'in-progress', progress: 72 },
      { id: 4, name: 'Feature Parity Testing', dueDate: 'Mar 10, 2026', status: 'in-progress', progress: 20 },
      { id: 5, name: 'Beta Release', dueDate: 'Mar 22, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'App Store Submission', dueDate: 'Mar 28, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Implement bottom navigation component', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 12', status: 'In Progress' },
      { id: 2, title: 'Migrate user settings screen to new design', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'high', dueDate: 'Mar 14', status: 'In Progress' },
      { id: 3, title: 'Fix gesture conflicts on swipe navigation', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 4, title: 'Update push notification templates', assigneeInitials: 'AW', assignee: 'Amy Wu', priority: 'medium', dueDate: 'Mar 18', status: 'To Do' },
      { id: 5, title: 'Accessibility audit for new screens', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 6, title: 'Performance profiling on low-end devices', assigneeInitials: 'NP', assignee: 'Nick Park', priority: 'low', dueDate: 'Mar 22', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Testing resource shortfall', severity: 'high', impact: 'QA team stretched thin across projects, may delay beta', mitigation: 'Contract QA resource engaged for March sprint' },
      { id: 2, title: 'iOS 18 API deprecation', severity: 'medium', impact: 'Three deprecated APIs used in current navigation stack', mitigation: 'Migration to new APIs prioritized in current sprint' },
      { id: 3, title: 'Design-to-code handoff gaps', severity: 'low', impact: 'Minor inconsistencies between Figma and implementation', mitigation: 'Weekly design review sessions established' },
    ],
    team: [
      { id: 1, initials: 'JC', name: 'James Carter', role: 'Tech Lead', tasksCompleted: 9, tasksTotal: 14, availability: 80 },
      { id: 2, initials: 'RK', name: 'Rachel Kim', role: 'UI Designer', tasksCompleted: 12, tasksTotal: 16, availability: 100 },
      { id: 3, initials: 'DL', name: 'David Lin', role: 'iOS Developer', tasksCompleted: 7, tasksTotal: 11, availability: 100 },
      { id: 4, initials: 'AW', name: 'Amy Wu', role: 'Android Developer', tasksCompleted: 8, tasksTotal: 12, availability: 60 },
      { id: 5, initials: 'NP', name: 'Nick Park', role: 'QA Engineer', tasksCompleted: 4, tasksTotal: 10, availability: 40 },
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
      { label: 'Labor', amount: '$180K', pct: 73, colorClass: 'bg-primary' },
      { label: 'Design Tools', amount: '$30K', pct: 12, colorClass: 'bg-success' },
      { label: 'Testing', amount: '$24K', pct: 10, colorClass: 'bg-warning' },
      { label: 'Other', amount: '$12K', pct: 5, colorClass: 'bg-secondary' },
    ],
  },

  3: {
    name: 'ERP System Upgrade',
    status: 'Overdue',
    summaryStats: [
      { label: 'Schedule', value: '60%', subtext: 'Overdue', subtextClass: 'text-destructive font-medium' },
      { label: 'Budget Used', value: '$855K', subtext: '95% of $900K', subtextClass: 'text-destructive font-medium' },
      { label: 'Team Members', value: '8', subtext: '1 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Feb 20', subtext: '21 days overdue', subtextClass: 'text-destructive font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Requirements Gathering', dueDate: 'Oct 1, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Data Migration Planning', dueDate: 'Nov 15, 2025', status: 'completed', progress: 100 },
      { id: 3, name: 'Module Configuration', dueDate: 'Jan 10, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'UAT Sign-off', dueDate: 'Feb 10, 2026', status: 'overdue', progress: 65 },
      { id: 5, name: 'Data Migration Execution', dueDate: 'Feb 15, 2026', status: 'in-progress', progress: 40 },
      { id: 6, name: 'Go-Live & Hypercare', dueDate: 'Feb 20, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Resolve UAT defect backlog (14 critical)', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Complete payroll module data mapping', assigneeInitials: 'KT', assignee: 'Karen Torres', priority: 'high', dueDate: 'Mar 3', status: 'In Progress' },
      { id: 3, title: 'Vendor escalation for integration bug', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 1', status: 'In Progress' },
      { id: 4, title: 'Update training materials for new workflows', assigneeInitials: 'RM', assignee: 'Rita Moreno', priority: 'medium', dueDate: 'Mar 8', status: 'To Do' },
      { id: 5, title: 'Final data reconciliation report', assigneeInitials: 'BW', assignee: 'Brian Walsh', priority: 'high', dueDate: 'Mar 6', status: 'To Do' },
      { id: 6, title: 'Rollback plan review with stakeholders', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'medium', dueDate: 'Mar 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Budget overrun imminent', severity: 'high', impact: 'Only $45K remaining — insufficient for go-live support', mitigation: 'Change request submitted for $120K budget extension' },
      { id: 2, title: 'UAT defect backlog growing', severity: 'high', impact: '14 critical defects blocking sign-off', mitigation: 'Dedicated bug-fix sprint with vendor support' },
      { id: 3, title: 'User adoption resistance', severity: 'medium', impact: 'Finance team unfamiliar with new approval workflows', mitigation: 'Additional training sessions and quick-reference guides' },
    ],
    team: [
      { id: 1, initials: 'PN', name: 'Priya Nair', role: 'Project Manager', tasksCompleted: 22, tasksTotal: 30, availability: 100 },
      { id: 2, initials: 'KT', name: 'Karen Torres', role: 'ERP Consultant', tasksCompleted: 15, tasksTotal: 20, availability: 100 },
      { id: 3, initials: 'BW', name: 'Brian Walsh', role: 'Data Engineer', tasksCompleted: 10, tasksTotal: 16, availability: 80 },
      { id: 4, initials: 'RM', name: 'Rita Moreno', role: 'Change Manager', tasksCompleted: 8, tasksTotal: 12, availability: 60 },
      { id: 5, initials: 'TE', name: 'Tom Evans', role: 'Technical Architect', tasksCompleted: 12, tasksTotal: 14, availability: 40 },
      { id: 6, initials: 'PN', name: 'Priya Nair', role: 'QA Lead', tasksCompleted: 9, tasksTotal: 18, availability: 100 },
      { id: 7, initials: 'VR', name: 'Vikram Rao', role: 'DBA', tasksCompleted: 6, tasksTotal: 8, availability: 100 },
      { id: 8, initials: 'LB', name: 'Lena Brooks', role: 'Business Analyst', tasksCompleted: 11, tasksTotal: 13, availability: 80 },
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
      { label: 'Labor', amount: '$420K', pct: 49, colorClass: 'bg-primary' },
      { label: 'Licensing', amount: '$250K', pct: 29, colorClass: 'bg-warning' },
      { label: 'Consulting', amount: '$135K', pct: 16, colorClass: 'bg-success' },
      { label: 'Other', amount: '$50K', pct: 6, colorClass: 'bg-secondary' },
    ],
  },

  4: {
    name: 'Data Analytics Platform',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '35%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$150K', subtext: '30% of $500K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '7', subtext: '3 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Apr 10', subtext: '28 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Platform Architecture Design', dueDate: 'Jan 20, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Data Pipeline Setup', dueDate: 'Feb 15, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Dashboard Framework', dueDate: 'Mar 10, 2026', status: 'in-progress', progress: 60 },
      { id: 4, name: 'Real-time Streaming Integration', dueDate: 'Mar 25, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'User Acceptance Testing', dueDate: 'Apr 5, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Production Deployment', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Build executive summary dashboard', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'high', dueDate: 'Mar 15', status: 'In Progress' },
      { id: 2, title: 'Configure Kafka connectors for event streams', assigneeInitials: 'AJ', assignee: 'Anita Joshi', priority: 'high', dueDate: 'Mar 18', status: 'To Do' },
      { id: 3, title: 'Implement row-level security for reports', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 4, title: 'Set up automated data quality checks', assigneeInitials: 'CH', assignee: 'Chris Hall', priority: 'medium', dueDate: 'Mar 22', status: 'To Do' },
      { id: 5, title: 'Create API endpoints for report embedding', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Mar 28', status: 'To Do' },
      { id: 6, title: 'Document data dictionary for all sources', assigneeInitials: 'SP', assignee: 'Sara Park', priority: 'low', dueDate: 'Apr 1', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Data source latency issues', severity: 'medium', impact: 'Real-time dashboards may show stale data under load', mitigation: 'Caching layer with configurable refresh intervals' },
      { id: 2, title: 'Schema evolution conflicts', severity: 'low', impact: 'Upstream schema changes could break pipeline transforms', mitigation: 'Schema registry with backward compatibility enforcement' },
    ],
    team: [
      { id: 1, initials: 'TE', name: 'Tom Evans', role: 'Tech Lead', tasksCompleted: 8, tasksTotal: 14, availability: 100 },
      { id: 2, initials: 'AJ', name: 'Anita Joshi', role: 'Data Engineer', tasksCompleted: 6, tasksTotal: 10, availability: 100 },
      { id: 3, initials: 'MO', name: 'Mike Osei', role: 'Backend Developer', tasksCompleted: 4, tasksTotal: 8, availability: 60 },
      { id: 4, initials: 'CH', name: 'Chris Hall', role: 'Data Analyst', tasksCompleted: 5, tasksTotal: 9, availability: 100 },
      { id: 5, initials: 'SP', name: 'Sara Park', role: 'Technical Writer', tasksCompleted: 3, tasksTotal: 6, availability: 80 },
      { id: 6, initials: 'RK', name: 'Rachel Kim', role: 'UI Developer', tasksCompleted: 2, tasksTotal: 7, availability: 100 },
      { id: 7, initials: 'DL', name: 'David Lin', role: 'DevOps Engineer', tasksCompleted: 3, tasksTotal: 5, availability: 40 },
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
      { label: 'Labor', amount: '$95K', pct: 63, colorClass: 'bg-primary' },
      { label: 'Infrastructure', amount: '$35K', pct: 23, colorClass: 'bg-success' },
      { label: 'Licensing', amount: '$15K', pct: 10, colorClass: 'bg-warning' },
      { label: 'Other', amount: '$5K', pct: 4, colorClass: 'bg-secondary' },
    ],
  },

  5: {
    name: 'Customer Portal v3',
    status: 'Planning',
    summaryStats: [
      { label: 'Schedule', value: '12%', subtext: 'Planning', subtextClass: 'text-foreground-60' },
      { label: 'Budget Used', value: '$24K', subtext: '8% of $350K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '4', subtext: '3 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Apr 30', subtext: '48 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'Stakeholder Interviews', dueDate: 'Feb 10, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Requirements Document', dueDate: 'Mar 1, 2026', status: 'in-progress', progress: 75 },
      { id: 3, name: 'Wireframes & Prototyping', dueDate: 'Mar 20, 2026', status: 'upcoming', progress: 0 },
      { id: 4, name: 'Frontend Development', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'Integration & Testing', dueDate: 'Apr 22, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Launch', dueDate: 'Apr 30, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Finalize self-service feature requirements', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Competitive analysis of portal solutions', assigneeInitials: 'NP', assignee: 'Nick Park', priority: 'medium', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Draft information architecture', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 4, title: 'Define API contract with backend team', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 15', status: 'To Do' },
      { id: 5, title: 'Create brand guidelines for portal', assigneeInitials: 'RK', assignee: 'Rachel Kim', priority: 'low', dueDate: 'Mar 18', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Scope creep from stakeholders', severity: 'medium', impact: 'Requirements keep expanding beyond initial brief', mitigation: 'Strict change control process with prioritized backlog' },
      { id: 2, title: 'Backend API readiness', severity: 'medium', impact: 'Portal depends on new API endpoints not yet built', mitigation: 'Mock API layer for parallel frontend development' },
    ],
    team: [
      { id: 1, initials: 'LB', name: 'Lena Brooks', role: 'Product Owner', tasksCompleted: 4, tasksTotal: 8, availability: 100 },
      { id: 2, initials: 'RK', name: 'Rachel Kim', role: 'UX Designer', tasksCompleted: 2, tasksTotal: 6, availability: 100 },
      { id: 3, initials: 'DL', name: 'David Lin', role: 'Frontend Developer', tasksCompleted: 1, tasksTotal: 5, availability: 80 },
      { id: 4, initials: 'NP', name: 'Nick Park', role: 'Business Analyst', tasksCompleted: 3, tasksTotal: 5, availability: 100 },
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
      { label: 'Labor', amount: '$18K', pct: 75, colorClass: 'bg-primary' },
      { label: 'Research', amount: '$4K', pct: 17, colorClass: 'bg-success' },
      { label: 'Other', amount: '$2K', pct: 8, colorClass: 'bg-secondary' },
    ],
  },

  6: {
    name: 'Security & Compliance Audit',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '88%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$108K', subtext: '72% of $150K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '5', subtext: '2 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'Mar 5', subtext: 'Due today', subtextClass: 'text-warning font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Scope Definition & Planning', dueDate: 'Jan 10, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'Network Security Assessment', dueDate: 'Jan 30, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Application Security Review', dueDate: 'Feb 15, 2026', status: 'completed', progress: 100 },
      { id: 4, name: 'Compliance Gap Analysis', dueDate: 'Feb 28, 2026', status: 'completed', progress: 100 },
      { id: 5, name: 'Remediation Tracking', dueDate: 'Mar 3, 2026', status: 'in-progress', progress: 85 },
      { id: 6, name: 'Final Report & Certification', dueDate: 'Mar 5, 2026', status: 'in-progress', progress: 50 },
    ],
    tasks: [
      { id: 1, title: 'Complete penetration test report', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'high', dueDate: 'Mar 4', status: 'In Progress' },
      { id: 2, title: 'Verify remediation of 3 critical findings', assigneeInitials: 'JC', assignee: 'James Carter', priority: 'high', dueDate: 'Mar 4', status: 'In Progress' },
      { id: 3, title: 'Compile evidence for SOC 2 auditor', assigneeInitials: 'AW', assignee: 'Amy Wu', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 4, title: 'Update security policy documentation', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'medium', dueDate: 'Mar 5', status: 'To Do' },
      { id: 5, title: 'Executive summary presentation prep', assigneeInitials: 'MO', assignee: 'Mike Osei', priority: 'medium', dueDate: 'Mar 5', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Three critical findings unresolved', severity: 'high', impact: 'Could delay certification if not remediated by deadline', mitigation: 'Daily standup with remediation owners, escalation path defined' },
      { id: 2, title: 'Auditor availability', severity: 'low', impact: 'External auditor may need additional evidence collection time', mitigation: 'Pre-staged evidence repository with organized documentation' },
    ],
    team: [
      { id: 1, initials: 'MO', name: 'Mike Osei', role: 'Security Lead', tasksCompleted: 18, tasksTotal: 20, availability: 100 },
      { id: 2, initials: 'JC', name: 'James Carter', role: 'Security Engineer', tasksCompleted: 12, tasksTotal: 14, availability: 100 },
      { id: 3, initials: 'AW', name: 'Amy Wu', role: 'Compliance Analyst', tasksCompleted: 9, tasksTotal: 11, availability: 80 },
      { id: 4, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 7, tasksTotal: 8, availability: 60 },
      { id: 5, initials: 'VR', name: 'Vikram Rao', role: 'Network Analyst', tasksCompleted: 10, tasksTotal: 10, availability: 100 },
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
      { label: 'Labor', amount: '$72K', pct: 67, colorClass: 'bg-primary' },
      { label: 'Tools', amount: '$22K', pct: 20, colorClass: 'bg-success' },
      { label: 'External Audit', amount: '$10K', pct: 9, colorClass: 'bg-warning' },
      { label: 'Other', amount: '$4K', pct: 4, colorClass: 'bg-secondary' },
    ],
  },

  7: {
    name: 'API Gateway Modernization',
    status: 'Overdue',
    summaryStats: [
      { label: 'Schedule', value: '30%', subtext: 'Overdue', subtextClass: 'text-destructive font-medium' },
      { label: 'Budget Used', value: '$110K', subtext: '55% of $200K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '4', subtext: '0 available', subtextClass: 'text-destructive font-medium' },
      { label: 'Due Date', value: 'Feb 14', subtext: '27 days overdue', subtextClass: 'text-destructive font-medium' },
    ],
    milestones: [
      { id: 1, name: 'Current State Assessment', dueDate: 'Dec 1, 2025', status: 'completed', progress: 100 },
      { id: 2, name: 'Gateway Architecture Design', dueDate: 'Jan 15, 2026', status: 'completed', progress: 100 },
      { id: 3, name: 'Core Gateway Implementation', dueDate: 'Feb 5, 2026', status: 'overdue', progress: 55 },
      { id: 4, name: 'Service Migration Wave 1', dueDate: 'Feb 10, 2026', status: 'overdue', progress: 15 },
      { id: 5, name: 'Service Migration Wave 2', dueDate: 'Feb 14, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Legacy Gateway Decommission', dueDate: 'Mar 1, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Fix rate limiter configuration for production', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 5', status: 'In Progress' },
      { id: 2, title: 'Migrate authentication service to new gateway', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 8', status: 'In Progress' },
      { id: 3, title: 'Resolve CORS policy conflicts with legacy proxy', assigneeInitials: 'SC', assignee: 'Sarah Chen', priority: 'high', dueDate: 'Mar 3', status: 'In Progress' },
      { id: 4, title: 'Update API documentation for new endpoints', assigneeInitials: 'SP', assignee: 'Sara Park', priority: 'medium', dueDate: 'Mar 12', status: 'To Do' },
      { id: 5, title: 'Load test new gateway at 2x expected traffic', assigneeInitials: 'DL', assignee: 'David Lin', priority: 'high', dueDate: 'Mar 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'Legacy service dependencies', severity: 'high', impact: 'Three services still tightly coupled to old gateway routing', mitigation: 'Adapter pattern with gradual traffic shifting' },
      { id: 2, title: 'Team capacity exhausted', severity: 'high', impact: 'All team members at 100% allocation, no buffer', mitigation: 'Request temporary resource from platform team' },
      { id: 3, title: 'Client-facing API breaking changes', severity: 'medium', impact: 'Some consumers may not handle new URL patterns', mitigation: 'Reverse proxy shim to maintain backward compatibility' },
    ],
    team: [
      { id: 1, initials: 'SC', name: 'Sarah Chen', role: 'Tech Lead', tasksCompleted: 5, tasksTotal: 12, availability: 100 },
      { id: 2, initials: 'DL', name: 'David Lin', role: 'Backend Developer', tasksCompleted: 3, tasksTotal: 10, availability: 100 },
      { id: 3, initials: 'SP', name: 'Sara Park', role: 'Technical Writer', tasksCompleted: 2, tasksTotal: 5, availability: 100 },
      { id: 4, initials: 'NP', name: 'Nick Park', role: 'QA Engineer', tasksCompleted: 1, tasksTotal: 6, availability: 100 },
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
      { label: 'Labor', amount: '$85K', pct: 77, colorClass: 'bg-primary' },
      { label: 'Infrastructure', amount: '$18K', pct: 16, colorClass: 'bg-success' },
      { label: 'Other', amount: '$7K', pct: 7, colorClass: 'bg-secondary' },
    ],
  },

  8: {
    name: 'ML Model Deployment Pipeline',
    status: 'On Track',
    summaryStats: [
      { label: 'Schedule', value: '20%', subtext: 'On track', subtextClass: 'text-success' },
      { label: 'Budget Used', value: '$90K', subtext: '18% of $500K', subtextClass: 'text-foreground-60' },
      { label: 'Team Members', value: '6', subtext: '4 available', subtextClass: 'text-foreground-60' },
      { label: 'Due Date', value: 'May 20', subtext: '67 days remaining', subtextClass: 'text-foreground-60' },
    ],
    milestones: [
      { id: 1, name: 'MLOps Platform Selection', dueDate: 'Feb 1, 2026', status: 'completed', progress: 100 },
      { id: 2, name: 'CI/CD Pipeline Design', dueDate: 'Feb 28, 2026', status: 'in-progress', progress: 80 },
      { id: 3, name: 'Model Registry & Versioning', dueDate: 'Mar 20, 2026', status: 'in-progress', progress: 25 },
      { id: 4, name: 'Automated Training Pipeline', dueDate: 'Apr 10, 2026', status: 'upcoming', progress: 0 },
      { id: 5, name: 'Monitoring & Drift Detection', dueDate: 'May 1, 2026', status: 'upcoming', progress: 0 },
      { id: 6, name: 'Production Rollout', dueDate: 'May 20, 2026', status: 'upcoming', progress: 0 },
    ],
    tasks: [
      { id: 1, title: 'Configure MLflow tracking server', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'high', dueDate: 'Mar 10', status: 'In Progress' },
      { id: 2, title: 'Build Docker image pipeline for model serving', assigneeInitials: 'CH', assignee: 'Chris Hall', priority: 'high', dueDate: 'Mar 15', status: 'In Progress' },
      { id: 3, title: 'Set up feature store with Feast', assigneeInitials: 'AJ', assignee: 'Anita Joshi', priority: 'medium', dueDate: 'Mar 20', status: 'To Do' },
      { id: 4, title: 'Implement A/B testing framework', assigneeInitials: 'PN', assignee: 'Priya Nair', priority: 'medium', dueDate: 'Mar 28', status: 'To Do' },
      { id: 5, title: 'Create model performance dashboard', assigneeInitials: 'TE', assignee: 'Tom Evans', priority: 'low', dueDate: 'Apr 5', status: 'To Do' },
      { id: 6, title: 'Document model governance procedures', assigneeInitials: 'LB', assignee: 'Lena Brooks', priority: 'low', dueDate: 'Apr 10', status: 'To Do' },
    ],
    risks: [
      { id: 1, title: 'GPU resource availability', severity: 'medium', impact: 'Training jobs may queue during peak usage periods', mitigation: 'Reserved GPU instances with spot instance fallback' },
      { id: 2, title: 'Model reproducibility', severity: 'low', impact: 'Different results across environments due to dependency drift', mitigation: 'Containerized environments with pinned dependency versions' },
    ],
    team: [
      { id: 1, initials: 'PN', name: 'Priya Nair', role: 'ML Engineering Lead', tasksCompleted: 5, tasksTotal: 12, availability: 100 },
      { id: 2, initials: 'CH', name: 'Chris Hall', role: 'MLOps Engineer', tasksCompleted: 3, tasksTotal: 8, availability: 100 },
      { id: 3, initials: 'AJ', name: 'Anita Joshi', role: 'Data Scientist', tasksCompleted: 4, tasksTotal: 10, availability: 100 },
      { id: 4, initials: 'TE', name: 'Tom Evans', role: 'Platform Engineer', tasksCompleted: 2, tasksTotal: 6, availability: 80 },
      { id: 5, initials: 'LB', name: 'Lena Brooks', role: 'Project Coordinator', tasksCompleted: 2, tasksTotal: 4, availability: 100 },
      { id: 6, initials: 'DL', name: 'David Lin', role: 'DevOps Engineer', tasksCompleted: 3, tasksTotal: 7, availability: 60 },
    ],
    activity: [
      { id: 1, actorInitials: 'PN', text: 'Configured MLflow experiment tracking for staging', timeAgo: '1 hr ago', icon: 'check_circle' },
      { id: 2, actorInitials: 'CH', text: 'Published base Docker image for model serving', timeAgo: '3 hrs ago', icon: 'check_circle' },
      { id: 3, actorInitials: 'AJ', text: 'Benchmarked feature store query performance', timeAgo: '4 hrs ago', icon: 'dashboard' },
      { id: 4, actorInitials: 'DL', text: 'Set up Kubernetes namespace for ML workloads', timeAgo: '5 hrs ago', icon: 'check_circle' },
      { id: 5, actorInitials: 'TE', text: 'Created Grafana dashboard templates for model metrics', timeAgo: 'Yesterday', icon: 'dashboard' },
    ],
    latestDrawing: { id: 1, name: 'ML Pipeline Architecture', type: 'architecture', version: 'v1.5', isLatest: true, updatedBy: 'Priya Nair', updatedAt: 'Mar 7, 2026', revisionCount: 5, fileSize: '2.9 MB' },
    budgetUsed: '$90K',
    budgetTotal: '$500K',
    budgetPct: 18,
    budgetBreakdown: [
      { label: 'Labor', amount: '$55K', pct: 61, colorClass: 'bg-primary' },
      { label: 'Infrastructure', amount: '$25K', pct: 28, colorClass: 'bg-success' },
      { label: 'Licensing', amount: '$8K', pct: 9, colorClass: 'bg-warning' },
      { label: 'Other', amount: '$2K', pct: 2, colorClass: 'bg-secondary' },
    ],
  },
};

export const CLOUD_INFRA_PROJECT = PROJECT_DATA[1];
export const MOBILE_APP_PROJECT = PROJECT_DATA[2];
export const ERP_UPGRADE_PROJECT = PROJECT_DATA[3];
export const DATA_ANALYTICS_PROJECT = PROJECT_DATA[4];
export const CUSTOMER_PORTAL_PROJECT = PROJECT_DATA[5];
export const SECURITY_AUDIT_PROJECT = PROJECT_DATA[6];
export const API_GATEWAY_PROJECT = PROJECT_DATA[7];
export const ML_PIPELINE_PROJECT = PROJECT_DATA[8];
