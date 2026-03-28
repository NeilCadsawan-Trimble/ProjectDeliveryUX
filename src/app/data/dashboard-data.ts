import type { ModusBadgeColor } from '../components/modus-badge.component';
import { PROJECT_DATA, type BudgetBreakdown } from './project-data';

export type ProjectStatus = 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
export type EstimateStatus = 'Draft' | 'Under Review' | 'Awaiting Approval' | 'Approved';
export type EstimateType = 'Fixed Price' | 'T&M' | 'Retainer' | 'Milestone';
export type DashboardWidgetId = 'projects' | 'openEstimates' | 'recentActivity' | 'needsAttention' | 'timeOff' | 'homeHeader' | 'homeTimeOff' | 'homeCalendar' | 'homeRfis' | 'homeSubmittals' | 'homeDrawings' | 'projsHeader' | 'finHeader' | 'finBudgetByProject' | 'finRevenueChart' | 'finJobCosts';
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
  { id: 1, slug: 'riverside-office-complex', name: 'Riverside Office Complex', client: 'Trimble Internal', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'On Track', dueDate: 'Mar 15, 2026', progress: 72, budgetPct: 68, budgetUsed: '$544K', budgetTotal: '$800K', latestDrawingName: 'Office Tower - Floor 3 Layout', latestDrawingVersion: 'v3.2' },
  { id: 2, slug: 'harbor-view-condominiums', name: 'Harbor View Condominiums', client: 'Apex Corp', ownerInitials: 'JC', owner: 'James Carter', status: 'At Risk', dueDate: 'Mar 28, 2026', progress: 45, budgetPct: 82, budgetUsed: '$246K', budgetTotal: '$300K', latestDrawingName: 'Unit Type B Floor Plan', latestDrawingVersion: 'v2.4' },
  { id: 3, slug: 'downtown-transit-hub', name: 'Downtown Transit Hub', client: 'GlobalTech Ltd', ownerInitials: 'PN', owner: 'Priya Nair', status: 'Overdue', dueDate: 'Feb 20, 2026', progress: 60, budgetPct: 95, budgetUsed: '$855K', budgetTotal: '$900K', latestDrawingName: 'Platform Canopy Elevation', latestDrawingVersion: 'v4.1' },
  { id: 4, slug: 'lakeside-medical-center', name: 'Lakeside Medical Center', client: 'NexGen Analytics', ownerInitials: 'TE', owner: 'Tom Evans', status: 'On Track', dueDate: 'Apr 10, 2026', progress: 35, budgetPct: 30, budgetUsed: '$150K', budgetTotal: '$500K', latestDrawingName: 'HVAC Mechanical Plan - L2', latestDrawingVersion: 'v2.0' },
  { id: 5, slug: 'westfield-shopping-center', name: 'Westfield Shopping Center', client: 'Brightline Co', ownerInitials: 'LB', owner: 'Lena Brooks', status: 'Planning', dueDate: 'Apr 30, 2026', progress: 12, budgetPct: 8, budgetUsed: '$24K', budgetTotal: '$350K', latestDrawingName: 'Site Plan & Grading', latestDrawingVersion: 'v1.2' },
  { id: 6, slug: 'metro-bridge-rehabilitation', name: 'Metro Bridge Rehabilitation', client: 'Trimble Internal', ownerInitials: 'MO', owner: 'Mike Osei', status: 'On Track', dueDate: 'Mar 5, 2026', progress: 88, budgetPct: 72, budgetUsed: '$108K', budgetTotal: '$150K', latestDrawingName: 'Bridge Deck Cross Section', latestDrawingVersion: 'v2.3' },
  { id: 7, slug: 'sunset-ridge-apartments', name: 'Sunset Ridge Apartments', client: 'CoreSystems Inc', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'Overdue', dueDate: 'Feb 14, 2026', progress: 30, budgetPct: 55, budgetUsed: '$110K', budgetTotal: '$200K', latestDrawingName: 'Building A Foundation Plan', latestDrawingVersion: 'v3.0' },
  { id: 8, slug: 'industrial-park-warehouse', name: 'Industrial Park Warehouse', client: 'DataDrive AI', ownerInitials: 'PN', owner: 'Priya Nair', status: 'On Track', dueDate: 'May 20, 2026', progress: 20, budgetPct: 18, budgetUsed: '$90K', budgetTotal: '$500K', latestDrawingName: 'Warehouse Floor Plan', latestDrawingVersion: 'v1.5' },
];

export const ESTIMATES: Estimate[] = [
  { id: 'EST-2026-041', project: 'Riverside Office Phase 3', client: 'Trimble Internal', type: 'Fixed Price', value: '$320,000', valueRaw: 320000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Mar 1, 2026', daysLeft: 2 },
  { id: 'EST-2026-042', project: 'Harbor View Unit Interiors', client: 'Apex Corp', type: 'T&M', value: '$85,000', valueRaw: 85000, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 5, 2026', daysLeft: 6 },
  { id: 'EST-2026-043', project: 'Transit Hub Post-Occupancy', client: 'GlobalTech Ltd', type: 'Retainer', value: '$45,000/mo', valueRaw: 45000, status: 'Draft', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 10, 2026', daysLeft: 11 },
  { id: 'EST-2026-044', project: 'Medical Center MEP Upgrades', client: 'NexGen Analytics', type: 'Milestone', value: '$220,000', valueRaw: 220000, status: 'Awaiting Approval', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Feb 28, 2026', daysLeft: 1 },
  { id: 'EST-2026-045', project: 'Shopping Center Facade Renovation', client: 'Brightline Co', type: 'Fixed Price', value: '$175,000', valueRaw: 175000, status: 'Under Review', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 8, 2026', daysLeft: 9 },
  { id: 'EST-2026-046', project: 'Bridge Deck Inspection', client: 'Trimble Internal', type: 'Fixed Price', value: '$38,000', valueRaw: 38000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Mar 15, 2026', daysLeft: 16 },
  { id: 'EST-2026-047', project: 'Sunset Ridge Landscaping', client: 'CoreSystems Inc', type: 'T&M', value: '$95,000', valueRaw: 95000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Feb 25, 2026', daysLeft: -2 },
  { id: 'EST-2026-048', project: 'Warehouse Loading Dock Expansion', client: 'DataDrive AI', type: 'Milestone', value: '$410,000', valueRaw: 410000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 20, 2026', daysLeft: 21 },
  { id: 'EST-2026-049', project: 'Site Safety Equipment Setup', client: 'Trimble Internal', type: 'Fixed Price', value: '$62,000', valueRaw: 62000, status: 'Draft', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Apr 1, 2026', daysLeft: 33 },
  { id: 'EST-2026-050', project: 'Tenant Fit-Out Coordination', client: 'Brightline Co', type: 'T&M', value: '$130,000', valueRaw: 130000, status: 'Awaiting Approval', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 3, 2026', daysLeft: 4 },
  { id: 'EST-2026-051', project: 'Parking Structure Repair', client: 'NexGen Analytics', type: 'Fixed Price', value: '$95,500', valueRaw: 95500, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 12, 2026', daysLeft: 13 },
  { id: 'EST-2026-052', project: 'Structural Assessment Program', client: 'GlobalTech Ltd', type: 'Retainer', value: '$18,000/mo', valueRaw: 18000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Apr 5, 2026', daysLeft: 37 },
];

export const ACTIVITIES: ActivityItem[] = [
  { id: 1, actorInitials: 'SC', text: 'updated Riverside Office Phase 3 estimate — revised scope adds $40K', timeAgo: '18 min ago', icon: 'edit', iconColor: 'text-primary' },
  { id: 2, actorInitials: 'PN', text: 'flagged Downtown Transit Hub budget at 95% — escalation required', timeAgo: '1 hr ago', icon: 'warning', iconColor: 'text-warning' },
  { id: 3, actorInitials: 'TE', text: 'submitted Medical Center MEP estimate EST-2026-044 for approval', timeAgo: '2 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
  { id: 4, actorInitials: 'MO', text: 'Metro Bridge checkpoint "Deck Assessment" marked complete', timeAgo: '3 hrs ago', icon: 'check_circle', iconColor: 'text-success' },
  { id: 5, actorInitials: 'JC', text: 'Harbor View Condominiums moved to At Risk — material delivery delay', timeAgo: 'Yesterday', icon: 'warning', iconColor: 'text-warning' },
  { id: 6, actorInitials: 'LB', text: 'created draft estimate EST-2026-052 for Structural Assessment Program', timeAgo: 'Yesterday', icon: 'edit', iconColor: 'text-primary' },
];

export const ATTENTION_ITEMS = [
  { id: 1, title: 'Transit Hub budget critical', subtitle: '95% consumed, $45K remaining', dotClass: 'bg-destructive' },
  { id: 2, title: 'Sunset Ridge project overdue', subtitle: 'Was due Feb 14 — 13 days late', dotClass: 'bg-destructive' },
  { id: 3, title: 'EST-2026-047 overdue', subtitle: 'Awaiting approval since Feb 25', dotClass: 'bg-destructive' },
  { id: 4, title: 'Harbor View at risk', subtitle: 'Material delivery gap in March', dotClass: 'bg-warning' },
  { id: 5, title: 'EST-2026-044 due tomorrow', subtitle: 'Medical Center MEP — $220K', dotClass: 'bg-warning' },
  { id: 6, title: 'Transit Hub inspection sign-off overdue', subtitle: 'Milestone was due Feb 20', dotClass: 'bg-warning' },
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
  { id: '1', number: 'RFI-001', subject: 'Foundation soil bearing capacity', question: 'Can the geotechnical engineer confirm the allowable soil bearing capacity at the northeast corner, and do we need additional test borings before footing design can proceed?', askedBy: 'Daniel Park', askedOn: 'Feb 24, 2026', project: 'Riverside Office Complex', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 12, 2026' },
  { id: '2', number: 'RFI-002', subject: 'ADA compliance for common areas', question: 'Have the updated common area floor plans been evaluated against ADA accessibility standards, and are there any outstanding compliance issues with the ramp grades?', askedBy: 'Rachel Kim', askedOn: 'Feb 12, 2026', project: 'Harbor View Condominiums', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 28, 2026' },
  { id: '3', number: 'RFI-003', subject: 'Utility relocation schedule', question: 'What is the proposed schedule for relocating the existing water main, and what is the contingency plan if unforeseen underground utilities are encountered during excavation?', askedBy: 'Marcus Webb', askedOn: 'Mar 1, 2026', project: 'Downtown Transit Hub', assignee: 'Priya Nair', status: 'open', dueDate: 'Mar 15, 2026' },
  { id: '4', number: 'RFI-004', subject: 'HVAC equipment pad specifications', question: 'What are the required concrete pad dimensions and load ratings for the rooftop HVAC units, and has the structural engineer confirmed the roof can support the additional dead load?', askedBy: 'Olivia Grant', askedOn: 'Mar 5, 2026', project: 'Lakeside Medical Center', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 20, 2026' },
  { id: '5', number: 'RFI-005', subject: 'Storefront glazing specification', question: 'Should the storefront glazing use low-E insulated glass units or laminated safety glass, and what U-value is required to meet the energy code for the climate zone?', askedBy: 'Nathan Ruiz', askedOn: 'Jan 28, 2026', project: 'Westfield Shopping Center', assignee: 'Lena Brooks', status: 'closed', dueDate: 'Feb 15, 2026' },
  { id: '6', number: 'RFI-006', subject: 'Bearing capacity at pier locations', question: 'Should the load test program cover all pier locations or only those in the suspect geologic zone, and what acceptance criteria will be used for load test results?', askedBy: 'Angela Torres', askedOn: 'Feb 14, 2026', project: 'Metro Bridge Rehabilitation', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 1, 2026' },
  { id: '7', number: 'RFI-007', subject: 'Parking lot drainage plan', question: 'What are the approved stormwater detention requirements for the parking area, and should the design include permeable pavers or a traditional catch-basin system?', askedBy: 'Kevin Zhao', askedOn: 'Jan 22, 2026', project: 'Sunset Ridge Apartments', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 10, 2026' },
  { id: '8', number: 'RFI-008', subject: 'Floor slab thickness clarification', question: 'Should the warehouse floor slab be designed for 6-inch or 8-inch thickness given the anticipated forklift loading, and is fiber reinforcement acceptable in lieu of welded wire fabric?', askedBy: 'Samira Patel', askedOn: 'Mar 8, 2026', project: 'Industrial Park Warehouse', assignee: 'Priya Nair', status: 'upcoming', dueDate: 'Mar 22, 2026' },
  { id: '9', number: 'RFI-009', subject: 'Elevator shaft structural reinforcement', question: 'What steel reinforcement details are required at the elevator shaft openings on floors 3 through 7, and has the structural engineer approved the proposed header beam sizes?', askedBy: 'Chris Delgado', askedOn: 'Mar 3, 2026', project: 'Riverside Office Complex', assignee: 'James Carter', status: 'open', dueDate: 'Mar 18, 2026' },
  { id: '10', number: 'RFI-010', subject: 'Demolition sequencing for platform', question: 'What is the agreed demolition sequence for the existing platform canopy, and which temporary shoring measures are required to maintain service during partial demolition?', askedBy: 'Laura Hoffman', askedOn: 'Jan 10, 2026', project: 'Downtown Transit Hub', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 30, 2026' },
  { id: '11', number: 'RFI-011', subject: 'Curtain wall anchor spacing', question: 'What is the required anchor spacing for the curtain wall system on the east elevation, and do the wind load calculations account for the corner acceleration factor?', askedBy: 'Daniel Park', askedOn: 'Mar 10, 2026', project: 'Riverside Office Complex', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 25, 2026' },
  { id: '12', number: 'RFI-012', subject: 'Fire separation wall rating', question: 'Should the fire separation between the parking garage and office lobby be rated at 2-hour or 3-hour, and what penetration firestopping details are required at the MEP pass-throughs?', askedBy: 'Chris Delgado', askedOn: 'Mar 14, 2026', project: 'Riverside Office Complex', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 28, 2026' },
  { id: '13', number: 'RFI-013', subject: 'Emergency generator placement', question: 'What are the approved setback requirements for the emergency generator pad, and does the noise ordinance require an acoustic enclosure at the proposed location?', askedBy: 'Angela Torres', askedOn: 'Feb 20, 2026', project: 'Riverside Office Complex', assignee: 'James Carter', status: 'overdue', dueDate: 'Mar 5, 2026' },
];

export const SUBMITTALS: Submittal[] = [
  { id: '1', number: 'SUB-001', subject: 'Structural steel shop drawings', project: 'Riverside Office Complex', assignee: 'Sarah Chen', status: 'open', dueDate: 'Mar 14' },
  { id: '2', number: 'SUB-002', subject: 'Kitchen cabinet specifications', project: 'Harbor View Condominiums', assignee: 'James Carter', status: 'overdue', dueDate: 'Feb 25' },
  { id: '3', number: 'SUB-003', subject: 'Concrete mix design report', project: 'Downtown Transit Hub', assignee: 'Priya Nair', status: 'closed', dueDate: 'Feb 18' },
  { id: '4', number: 'SUB-004', subject: 'Medical gas piping layout', project: 'Lakeside Medical Center', assignee: 'Tom Evans', status: 'upcoming', dueDate: 'Mar 22' },
  { id: '5', number: 'SUB-005', subject: 'Exterior signage package', project: 'Westfield Shopping Center', assignee: 'Lena Brooks', status: 'open', dueDate: 'Mar 16' },
  { id: '6', number: 'SUB-006', subject: 'Bridge bearing pad samples', project: 'Metro Bridge Rehabilitation', assignee: 'Mike Osei', status: 'overdue', dueDate: 'Mar 3' },
  { id: '7', number: 'SUB-007', subject: 'Plumbing fixture schedule', project: 'Sunset Ridge Apartments', assignee: 'Sarah Chen', status: 'closed', dueDate: 'Feb 12' },
  { id: '8', number: 'SUB-008', subject: 'Loading dock leveler specs', project: 'Industrial Park Warehouse', assignee: 'Priya Nair', status: 'upcoming', dueDate: 'Mar 25' },
  { id: '9', number: 'SUB-009', subject: 'Curtain wall mock-up report', project: 'Riverside Office Complex', assignee: 'James Carter', status: 'open', dueDate: 'Mar 19' },
  { id: '10', number: 'SUB-010', subject: 'Platform tile sample approval', project: 'Downtown Transit Hub', assignee: 'Tom Evans', status: 'closed', dueDate: 'Jan 28' },
];

export const CALENDAR_APPOINTMENTS: CalendarAppointment[] = [
  // ─── March 2026 ───
  // Week of Mar 2
  { id: 1, title: 'Daily Standup', date: new Date(2026, 2, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 2, title: 'Weekly Progress Review', date: new Date(2026, 2, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 3, title: 'Client Call — Acme Corp', date: new Date(2026, 2, 2), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 4, title: 'Daily Standup', date: new Date(2026, 2, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 5, title: 'Transit Hub Budget Review', date: new Date(2026, 2, 3), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 6, title: 'Focus: Progress Reports', date: new Date(2026, 2, 3), startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 7, title: 'Daily Standup', date: new Date(2026, 2, 4), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 8, title: 'Safety Coordination Meeting', date: new Date(2026, 2, 4), startHour: 13, startMin: 0, endHour: 14, endMin: 30, type: 'meeting' },
  { id: 9, title: 'Daily Standup', date: new Date(2026, 2, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 10, title: 'Riverside Office Sync', date: new Date(2026, 2, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 11, title: 'Client Call — TechVista', date: new Date(2026, 2, 5), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 12, title: 'Focus: Submittal Reviews', date: new Date(2026, 2, 5), startHour: 15, startMin: 0, endHour: 17, endMin: 0, type: 'focus' },
  { id: 13, title: 'Weekly Schedule Planning', date: new Date(2026, 2, 6), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 14, title: 'Drawing Review Session', date: new Date(2026, 2, 6), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 15, title: 'EST-2026-044 Deadline', date: new Date(2026, 2, 6), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Mar 9
  { id: 16, title: 'Daily Standup', date: new Date(2026, 2, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 17, title: 'Project Kickoff — Phase 2', date: new Date(2026, 2, 9), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 18, title: 'Structural Design Review', date: new Date(2026, 2, 9), startHour: 15, startMin: 0, endHour: 16, endMin: 0, type: 'review' },
  { id: 19, title: 'All Hands Meeting', date: new Date(2026, 2, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 20, title: 'Harbor View Check-in', date: new Date(2026, 2, 10), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 21, title: 'Daily Standup', date: new Date(2026, 2, 11), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 22, title: 'Vendor Demo — Concrete Supplier', date: new Date(2026, 2, 11), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 23, title: 'Focus: Sunset Ridge Landscaping', date: new Date(2026, 2, 11), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 24, title: 'Daily Standup', date: new Date(2026, 2, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 25, title: 'Bridge Rehabilitation Review', date: new Date(2026, 2, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 26, title: 'EST-2026-051 Deadline', date: new Date(2026, 2, 12), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 27, title: 'Daily Standup', date: new Date(2026, 2, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 28, title: 'Progress Walkthrough', date: new Date(2026, 2, 13), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  // Week of Mar 16
  { id: 29, title: 'Weekly Lessons Learned', date: new Date(2026, 2, 16), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 30, title: 'Client Call — BuildRight', date: new Date(2026, 2, 16), startHour: 13, startMin: 0, endHour: 13, endMin: 30, type: 'call' },
  { id: 31, title: 'Focus: RFI Responses', date: new Date(2026, 2, 16), startHour: 14, startMin: 0, endHour: 16, endMin: 30, type: 'focus' },
  { id: 32, title: 'Daily Standup', date: new Date(2026, 2, 17), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 33, title: 'Site Excavation Planning', date: new Date(2026, 2, 17), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 34, title: 'Contractor Sync — Jones & Co', date: new Date(2026, 2, 17), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 35, title: 'Daily Standup', date: new Date(2026, 2, 18), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 36, title: 'Structural Review', date: new Date(2026, 2, 18), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 37, title: 'Focus: Cost Estimating', date: new Date(2026, 2, 18), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 38, title: 'Daily Standup', date: new Date(2026, 2, 19), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 39, title: 'Quarterly Review Prep', date: new Date(2026, 2, 19), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 40, title: 'Client Call — Metro Transit', date: new Date(2026, 2, 19), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 41, title: 'Weekly Schedule Planning', date: new Date(2026, 2, 20), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 42, title: 'RFI-2026-018 Deadline', date: new Date(2026, 2, 20), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Mar 23 (current week based on today Mar 20)
  { id: 43, title: 'Daily Standup', date: new Date(2026, 2, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 44, title: 'Quarterly Business Review', date: new Date(2026, 2, 23), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 45, title: 'Focus: Permit Applications', date: new Date(2026, 2, 23), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 46, title: 'Daily Standup', date: new Date(2026, 2, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 47, title: 'Riverside Office Go/No-Go', date: new Date(2026, 2, 24), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 48, title: 'Client Call — SkyBridge', date: new Date(2026, 2, 24), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 49, title: 'Daily Standup', date: new Date(2026, 2, 25), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 50, title: 'Inspection Walkthrough', date: new Date(2026, 2, 25), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 51, title: 'Focus: Punch List Items', date: new Date(2026, 2, 25), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 52, title: 'Daily Standup', date: new Date(2026, 2, 26), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 53, title: 'Substantial Completion Review', date: new Date(2026, 2, 26), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 54, title: 'EST-2026-058 Deadline', date: new Date(2026, 2, 26), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 55, title: 'Owner Walkthrough', date: new Date(2026, 2, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 56, title: 'Team Lunch', date: new Date(2026, 2, 27), startHour: 12, startMin: 0, endHour: 13, endMin: 0, type: 'meeting' },
  // Week of Mar 30
  { id: 57, title: 'Daily Standup', date: new Date(2026, 2, 30), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 58, title: 'Month-End Budget Closeout', date: new Date(2026, 2, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 59, title: 'Focus: Change Order Reviews', date: new Date(2026, 2, 30), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 60, title: 'Daily Standup', date: new Date(2026, 2, 31), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 61, title: 'Q1 Wrap-Up Meeting', date: new Date(2026, 2, 31), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 62, title: 'Contractor Call — Apex', date: new Date(2026, 2, 31), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 63, title: 'Q1 Reports Deadline', date: new Date(2026, 2, 31), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },

  // ─── April 2026 ───
  // Week of Apr 1
  { id: 64, title: 'Q2 Kickoff', date: new Date(2026, 3, 1), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 65, title: 'Portfolio Review', date: new Date(2026, 3, 1), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 66, title: 'Client Call — GreenField', date: new Date(2026, 3, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 67, title: 'Daily Standup', date: new Date(2026, 3, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 68, title: 'New Hire Onboarding', date: new Date(2026, 3, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 69, title: 'Focus: CI/CD Pipeline', date: new Date(2026, 3, 2), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 70, title: 'Daily Standup', date: new Date(2026, 3, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 71, title: 'Submittal Review — Structural', date: new Date(2026, 3, 3), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 72, title: 'EST-2026-062 Deadline', date: new Date(2026, 3, 3), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 6
  { id: 73, title: 'Daily Standup', date: new Date(2026, 3, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 74, title: 'Sprint Planning', date: new Date(2026, 3, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 75, title: 'Focus: Feature Development', date: new Date(2026, 3, 6), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 76, title: 'Daily Standup', date: new Date(2026, 3, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 77, title: 'Vendor Call — CloudHost', date: new Date(2026, 3, 7), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'call' },
  { id: 78, title: 'Safety Compliance Review', date: new Date(2026, 3, 7), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 79, title: 'Daily Standup', date: new Date(2026, 3, 8), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 80, title: 'Cross-Team Sync', date: new Date(2026, 3, 8), startHour: 10, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 81, title: 'Client Call — NovaTech', date: new Date(2026, 3, 8), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 82, title: 'Daily Standup', date: new Date(2026, 3, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 83, title: 'Budget Forecast Meeting', date: new Date(2026, 3, 9), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 84, title: 'Focus: Data Migration Scripts', date: new Date(2026, 3, 9), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 85, title: 'Sprint Demo', date: new Date(2026, 3, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 86, title: 'RFI-2026-023 Deadline', date: new Date(2026, 3, 10), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 13
  { id: 87, title: 'Sprint Retrospective', date: new Date(2026, 3, 13), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 88, title: 'Permit Submission Review', date: new Date(2026, 3, 13), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 89, title: 'Focus: Unit Testing', date: new Date(2026, 3, 13), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 90, title: 'Daily Standup', date: new Date(2026, 3, 14), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 91, title: 'Stakeholder Presentation', date: new Date(2026, 3, 14), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 92, title: 'Client Call — UrbanGrid', date: new Date(2026, 3, 14), startHour: 14, startMin: 30, endHour: 15, endMin: 0, type: 'call' },
  { id: 93, title: 'Daily Standup', date: new Date(2026, 3, 15), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 94, title: 'Mid-Sprint Check', date: new Date(2026, 3, 15), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 95, title: 'Focus: Integration Testing', date: new Date(2026, 3, 15), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 96, title: 'Daily Standup', date: new Date(2026, 3, 16), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 97, title: 'Drawing Review — Electrical', date: new Date(2026, 3, 16), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 98, title: 'Contractor Sync — BuildCo', date: new Date(2026, 3, 16), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 99, title: 'Sprint Planning', date: new Date(2026, 3, 17), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 100, title: 'EST-2026-070 Deadline', date: new Date(2026, 3, 17), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 20
  { id: 101, title: 'Daily Standup', date: new Date(2026, 3, 20), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 102, title: 'Environment Migration Cutover', date: new Date(2026, 3, 20), startHour: 10, startMin: 0, endHour: 12, endMin: 0, type: 'meeting' },
  { id: 103, title: 'Focus: Monitoring Setup', date: new Date(2026, 3, 20), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 104, title: 'Daily Standup', date: new Date(2026, 3, 21), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 105, title: 'Post-Migration Validation', date: new Date(2026, 3, 21), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 106, title: 'Client Call — Trimble Field', date: new Date(2026, 3, 21), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 107, title: 'Daily Standup', date: new Date(2026, 3, 22), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 108, title: 'Risk Assessment Workshop', date: new Date(2026, 3, 22), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 109, title: 'Focus: Documentation Update', date: new Date(2026, 3, 22), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 110, title: 'Daily Standup', date: new Date(2026, 3, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 111, title: 'Sprint Demo', date: new Date(2026, 3, 23), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 112, title: 'Daily Standup', date: new Date(2026, 3, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 113, title: 'Team Building Activity', date: new Date(2026, 3, 24), startHour: 15, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
  // Week of Apr 27
  { id: 114, title: 'Daily Standup', date: new Date(2026, 3, 27), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 115, title: 'Sprint Retrospective', date: new Date(2026, 3, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 116, title: 'Client Call — Meridian', date: new Date(2026, 3, 27), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 117, title: 'Daily Standup', date: new Date(2026, 3, 28), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 118, title: 'Capacity Planning', date: new Date(2026, 3, 28), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 119, title: 'Focus: Refactoring', date: new Date(2026, 3, 28), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 120, title: 'Daily Standup', date: new Date(2026, 3, 29), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 121, title: 'Submittal Review — MEP', date: new Date(2026, 3, 29), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 122, title: 'April Budget Closeout', date: new Date(2026, 3, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 123, title: 'April Reports Deadline', date: new Date(2026, 3, 30), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },

  // ─── May 2026 ───
  // Week of May 1
  { id: 124, title: 'Daily Standup', date: new Date(2026, 4, 1), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 125, title: 'May Planning Session', date: new Date(2026, 4, 1), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 126, title: 'Client Call — Pacific Rail', date: new Date(2026, 4, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  // Week of May 4
  { id: 127, title: 'Sprint Planning', date: new Date(2026, 4, 4), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 128, title: 'Focus: Feature Sprint', date: new Date(2026, 4, 4), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 129, title: 'Daily Standup', date: new Date(2026, 4, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 130, title: 'Design Review — Dashboard', date: new Date(2026, 4, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 131, title: 'Vendor Call — MapWorks', date: new Date(2026, 4, 5), startHour: 14, startMin: 30, endHour: 15, endMin: 0, type: 'call' },
  { id: 132, title: 'Daily Standup', date: new Date(2026, 4, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 133, title: 'Cross-Team Architecture Sync', date: new Date(2026, 4, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 134, title: 'Focus: Load Testing', date: new Date(2026, 4, 6), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 135, title: 'Daily Standup', date: new Date(2026, 4, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 136, title: 'RFI Response Review', date: new Date(2026, 4, 7), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 137, title: 'EST-2026-078 Deadline', date: new Date(2026, 4, 7), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 138, title: 'Sprint Demo', date: new Date(2026, 4, 8), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 139, title: 'Team Happy Hour', date: new Date(2026, 4, 8), startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
  // Week of May 11
  { id: 140, title: 'Sprint Retrospective', date: new Date(2026, 4, 11), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 141, title: 'Client Call — Summit Eng', date: new Date(2026, 4, 11), startHour: 13, startMin: 0, endHour: 13, endMin: 30, type: 'call' },
  { id: 142, title: 'Focus: Security Hardening', date: new Date(2026, 4, 11), startHour: 14, startMin: 0, endHour: 16, endMin: 30, type: 'focus' },
  { id: 143, title: 'Daily Standup', date: new Date(2026, 4, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 144, title: 'Compliance Audit Prep', date: new Date(2026, 4, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 145, title: 'Contractor Sync — Apex Builders', date: new Date(2026, 4, 12), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 146, title: 'Daily Standup', date: new Date(2026, 4, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 147, title: 'Drawing Review — HVAC', date: new Date(2026, 4, 13), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 148, title: 'Focus: API Documentation', date: new Date(2026, 4, 13), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 149, title: 'Daily Standup', date: new Date(2026, 4, 14), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 150, title: 'Stakeholder Check-in', date: new Date(2026, 4, 14), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'call' },
  { id: 151, title: 'RFI-2026-031 Deadline', date: new Date(2026, 4, 14), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 152, title: 'Sprint Planning', date: new Date(2026, 4, 15), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  // Week of May 18
  { id: 153, title: 'Daily Standup', date: new Date(2026, 4, 18), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 154, title: 'Release Planning', date: new Date(2026, 4, 18), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 155, title: 'Focus: Deployment Automation', date: new Date(2026, 4, 18), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 156, title: 'Daily Standup', date: new Date(2026, 4, 19), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 157, title: 'Vendor Demo — FieldSync', date: new Date(2026, 4, 19), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 158, title: 'Budget Variance Review', date: new Date(2026, 4, 19), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 159, title: 'Daily Standup', date: new Date(2026, 4, 20), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 160, title: 'Mid-Sprint Check', date: new Date(2026, 4, 20), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 161, title: 'Focus: E2E Testing', date: new Date(2026, 4, 20), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 162, title: 'Daily Standup', date: new Date(2026, 4, 21), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 163, title: 'Client Call — Coastal Dev', date: new Date(2026, 4, 21), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 164, title: 'Sprint Demo', date: new Date(2026, 4, 22), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 165, title: 'EST-2026-085 Deadline', date: new Date(2026, 4, 22), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of May 25
  { id: 166, title: 'Sprint Retrospective', date: new Date(2026, 4, 26), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 167, title: 'Infrastructure Capacity Review', date: new Date(2026, 4, 26), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 168, title: 'Focus: Performance Optimization', date: new Date(2026, 4, 26), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 169, title: 'Daily Standup', date: new Date(2026, 4, 27), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 170, title: 'Q2 Mid-Quarter Review', date: new Date(2026, 4, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 171, title: 'Client Call — Ridgeline', date: new Date(2026, 4, 27), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 172, title: 'Daily Standup', date: new Date(2026, 4, 28), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 173, title: 'Submittal Review — Plumbing', date: new Date(2026, 4, 28), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 174, title: 'Focus: Monitoring Dashboards', date: new Date(2026, 4, 28), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 175, title: 'Daily Standup', date: new Date(2026, 4, 29), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 176, title: 'May Budget Closeout', date: new Date(2026, 4, 29), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 177, title: 'May Reports Deadline', date: new Date(2026, 4, 29), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
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

export type RevenueTimeRange = '1M' | 'YTD' | '1Y' | '3Y' | '5Y';

export interface RevenueDataPoint {
  label: string;
  value: number;
}

function generateDaily1M(): RevenueDataPoint[] {
  const days = 27;
  const startVal = 17000;
  const endVal = 18400;
  const pts: RevenueDataPoint[] = [];
  let seed = 23;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0xffff) / 0xffff; };
  let prev = startVal;
  for (let d = 1; d <= days; d++) {
    const trend = startVal + ((endVal - startVal) * d) / days;
    const cycle = Math.sin((d / days) * Math.PI * 4) * 1000;
    const jitter = (rand() - 0.5) * 600;
    prev = prev * 0.7 + (trend + cycle + jitter) * 0.3;
    const label = d === 1 ? 'Mar 1' : (d % 7 === 0 ? `${d}` : '');
    pts.push({ label, value: Math.round(prev) });
  }
  return pts;
}

function generateDailyYtd(): RevenueDataPoint[] {
  const months = ['Jan', 'Feb', 'Mar'];
  const daysInMonth = [31, 28, 27];
  const baseByMonth = [17000, 17600, 18200];
  const totalDays = 86;
  const pts: RevenueDataPoint[] = [];
  let seed = 42;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0xffff) / 0xffff; };
  let prev = baseByMonth[0];
  let dayIdx = 0;
  for (let m = 0; m < 3; m++) {
    for (let d = 1; d <= daysInMonth[m]; d++) {
      const trend = baseByMonth[m] + (d / daysInMonth[m]) * 600;
      const cycle = Math.sin((dayIdx / totalDays) * Math.PI * 5) * 1200;
      const jitter = (rand() - 0.5) * 800;
      prev = prev * 0.7 + (trend + cycle + jitter) * 0.3;
      const label = d === 1 ? `${months[m]} 1` : (d % 7 === 0 ? `${d}` : '');
      pts.push({ label, value: Math.round(prev) });
      dayIdx++;
    }
  }
  return pts;
}

const WEEKS_PER_YEAR = 52;
const MASTER_5Y_WEEKS = WEEKS_PER_YEAR * 5 + 13;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateMaster5YWeekly(): RevenueDataPoint[] {
  const startVal = 165000;
  const endVal = 530000;
  const total = MASTER_5Y_WEEKS;
  const pts: RevenueDataPoint[] = [];
  let seed = 71;
  const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0xffff) / 0xffff; };
  let prev = startVal;

  const startYear = 2021;
  const startMonth = 3;

  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const trend = startVal + (endVal - startVal) * (t * t * 0.3 + t * 0.7);
    const cycle = Math.sin(t * Math.PI * 18) * 20000;
    const jitter = (rand() - 0.5) * 8000;
    prev = prev * 0.6 + (trend + cycle + jitter) * 0.4;

    const monthOffset = Math.floor(i / (total / 63));
    const absMonth = startMonth + monthOffset;
    const year = startYear + Math.floor(absMonth / 12);
    const month = absMonth % 12;
    const weekInMonth = i % 4;

    let label = '';
    if (weekInMonth === 0) {
      const suffix = year % 100;
      label = `${MONTH_NAMES[month]} '${suffix}`;
    }

    pts.push({ label, value: Math.round(prev) });
  }
  return pts;
}

let _master5Y: RevenueDataPoint[] | null = null;
function getMaster5Y(): RevenueDataPoint[] {
  if (!_master5Y) _master5Y = generateMaster5YWeekly();
  return _master5Y;
}

function sliceWeeklyView(yearsBack: number): RevenueDataPoint[] {
  const master = getMaster5Y();
  const weeksBack = yearsBack * WEEKS_PER_YEAR;
  const slice = master.slice(Math.max(0, master.length - weeksBack));

  const labelEvery = yearsBack <= 1 ? 4 : yearsBack <= 3 ? 8 : 13;
  return slice.map((pt, i) => ({
    ...pt,
    label: (i % labelEvery === 0) ? pt.label : '',
  }));
}

const MONTHLY_REVENUE: Record<RevenueTimeRange, RevenueDataPoint[]> = {
  '1M': generateDaily1M(),
  'YTD': generateDailyYtd(),
  '1Y': sliceWeeklyView(1),
  '3Y': sliceWeeklyView(3),
  '5Y': sliceWeeklyView(5),
};

const ANNUAL_TOTALS: Record<RevenueTimeRange, { current: number; previous: number; label: string }> = {
  '1M': { current: 530000, previous: 480000, label: 'Mar 2026' },
  'YTD': { current: 1530000, previous: 1320000, label: 'Jan\u2013Mar 2026' },
  '1Y': { current: 5605000, previous: 4870000, label: 'Apr 2025\u2013Mar 2026' },
  '3Y': { current: 5605000, previous: 2400000, label: '2023\u20132026' },
  '5Y': { current: 6360000, previous: 1980000, label: '2021\u20132026' },
};

export function getRevenueData(range: RevenueTimeRange): RevenueDataPoint[] {
  return MONTHLY_REVENUE[range];
}

export function getRevenueSummary(range: RevenueTimeRange): { current: number; previous: number; label: string; growthPct: number } {
  const t = ANNUAL_TOTALS[range];
  const growthPct = Math.round(((t.current - t.previous) / t.previous) * 100);
  return { ...t, growthPct };
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

export const CATEGORY_COLORS: Record<JobCostCategory, string> = {
  Labor: 'bg-primary',
  Materials: 'bg-success',
  Equipment: 'bg-warning',
  Subcontractors: 'bg-secondary',
  Overhead: 'bg-foreground-40',
};

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
