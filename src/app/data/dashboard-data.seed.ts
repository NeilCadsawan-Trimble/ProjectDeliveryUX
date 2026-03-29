import type {
  ActivityItem,
  BudgetHistoryPoint,
  CalendarAppointment,
  ChangeOrder,
  Contract,
  DailyReport,
  Estimate,
  Inspection,
  JobCostCategory,
  Project,
  ProjectAttentionItem,
  ProjectRevenue,
  ProjectWeather,
  PunchListItem,
  RevenueDataPoint,
  RevenueTimeRange,
  Rfi,
  Submittal,
  TimeOffRequest,
  WeatherForecast,
} from './dashboard-data.types';

export const PROJECTS: Project[] = [
  { id: 1, slug: 'riverside-office-complex', name: 'Riverside Office Complex', client: 'Trimble Internal', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'On Track', dueDate: 'Mar 15, 2026', progress: 72, budgetPct: 68, budgetUsed: '$544K', budgetTotal: '$800K', latestDrawingName: 'Office Tower - Floor 3 Layout', latestDrawingVersion: 'v3.2', city: 'Portland', state: 'OR' },
  { id: 2, slug: 'harbor-view-condominiums', name: 'Harbor View Condominiums', client: 'Apex Corp', ownerInitials: 'JC', owner: 'James Carter', status: 'At Risk', dueDate: 'Mar 28, 2026', progress: 45, budgetPct: 82, budgetUsed: '$246K', budgetTotal: '$300K', latestDrawingName: 'Unit Type B Floor Plan', latestDrawingVersion: 'v2.4', city: 'San Francisco', state: 'CA' },
  { id: 3, slug: 'downtown-transit-hub', name: 'Downtown Transit Hub', client: 'GlobalTech Ltd', ownerInitials: 'PN', owner: 'Priya Nair', status: 'Overdue', dueDate: 'Feb 20, 2026', progress: 60, budgetPct: 95, budgetUsed: '$855K', budgetTotal: '$900K', latestDrawingName: 'Platform Canopy Elevation', latestDrawingVersion: 'v4.1', city: 'Seattle', state: 'WA' },
  { id: 4, slug: 'lakeside-medical-center', name: 'Lakeside Medical Center', client: 'NexGen Analytics', ownerInitials: 'TE', owner: 'Tom Evans', status: 'On Track', dueDate: 'Apr 10, 2026', progress: 35, budgetPct: 30, budgetUsed: '$150K', budgetTotal: '$500K', latestDrawingName: 'HVAC Mechanical Plan - L2', latestDrawingVersion: 'v2.0', city: 'Bend', state: 'OR' },
  { id: 5, slug: 'westfield-shopping-center', name: 'Westfield Shopping Center', client: 'Brightline Co', ownerInitials: 'LB', owner: 'Lena Brooks', status: 'Planning', dueDate: 'Apr 30, 2026', progress: 12, budgetPct: 8, budgetUsed: '$24K', budgetTotal: '$350K', latestDrawingName: 'Site Plan & Grading', latestDrawingVersion: 'v1.2', city: 'Sacramento', state: 'CA' },
  { id: 6, slug: 'metro-bridge-rehabilitation', name: 'Metro Bridge Rehabilitation', client: 'Trimble Internal', ownerInitials: 'MO', owner: 'Mike Osei', status: 'On Track', dueDate: 'Mar 5, 2026', progress: 88, budgetPct: 72, budgetUsed: '$108K', budgetTotal: '$150K', latestDrawingName: 'Bridge Deck Cross Section', latestDrawingVersion: 'v2.3', city: 'Tacoma', state: 'WA' },
  { id: 7, slug: 'sunset-ridge-apartments', name: 'Sunset Ridge Apartments', client: 'CoreSystems Inc', ownerInitials: 'SC', owner: 'Sarah Chen', status: 'Overdue', dueDate: 'Feb 14, 2026', progress: 30, budgetPct: 55, budgetUsed: '$110K', budgetTotal: '$200K', latestDrawingName: 'Building A Foundation Plan', latestDrawingVersion: 'v3.0', city: 'Eugene', state: 'OR' },
  { id: 8, slug: 'industrial-park-warehouse', name: 'Industrial Park Warehouse', client: 'DataDrive AI', ownerInitials: 'PN', owner: 'Priya Nair', status: 'On Track', dueDate: 'May 20, 2026', progress: 20, budgetPct: 18, budgetUsed: '$90K', budgetTotal: '$500K', latestDrawingName: 'Warehouse Floor Plan', latestDrawingVersion: 'v1.5', city: 'Redding', state: 'CA' },
];

export const ESTIMATES: Estimate[] = [
  // --- Overdue (3) ---
  { id: 'EST-2026-047', project: 'Sunset Ridge Landscaping', client: 'CoreSystems Inc', type: 'T&M', value: '$95,000', valueRaw: 95000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Feb 25, 2026', daysLeft: -30 },
  { id: 'EST-2026-044', project: 'Medical Center MEP Upgrades', client: 'NexGen Analytics', type: 'Milestone', value: '$220,000', valueRaw: 220000, status: 'Awaiting Approval', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Feb 28, 2026', daysLeft: -27 },
  { id: 'EST-2026-053', project: 'City Hall Annex HVAC Replacement', client: 'Trimble Internal', type: 'Fixed Price', value: '$185,000', valueRaw: 185000, status: 'Awaiting Approval', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Mar 10, 2026', daysLeft: -17 },
  // --- Due this week (3) ---
  { id: 'EST-2026-041', project: 'Riverside Office Phase 3', client: 'Trimble Internal', type: 'Fixed Price', value: '$320,000', valueRaw: 320000, status: 'Awaiting Approval', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Mar 28, 2026', daysLeft: 1 },
  { id: 'EST-2026-050', project: 'Tenant Fit-Out Coordination', client: 'Brightline Co', type: 'T&M', value: '$130,000', valueRaw: 130000, status: 'Awaiting Approval', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Mar 30, 2026', daysLeft: 3 },
  { id: 'EST-2026-054', project: 'Greenfield Industrial Park Grading', client: 'DataDrive AI', type: 'Fixed Price', value: '$275,000', valueRaw: 275000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Mar 31, 2026', daysLeft: 4 },
  // --- Due next week (3) ---
  { id: 'EST-2026-042', project: 'Harbor View Unit Interiors', client: 'Apex Corp', type: 'T&M', value: '$85,000', valueRaw: 85000, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Apr 3, 2026', daysLeft: 7 },
  { id: 'EST-2026-045', project: 'Shopping Center Facade Renovation', client: 'Brightline Co', type: 'Fixed Price', value: '$175,000', valueRaw: 175000, status: 'Under Review', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'Apr 5, 2026', daysLeft: 9 },
  { id: 'EST-2026-055', project: 'Regional Airport Taxiway Repair', client: 'NexGen Analytics', type: 'Milestone', value: '$510,000', valueRaw: 510000, status: 'Under Review', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Apr 6, 2026', daysLeft: 10 },
  // --- Due in 2-4 weeks (5) ---
  { id: 'EST-2026-043', project: 'Transit Hub Post-Occupancy', client: 'GlobalTech Ltd', type: 'Retainer', value: '$45,000/mo', valueRaw: 45000, status: 'Draft', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Apr 10, 2026', daysLeft: 14 },
  { id: 'EST-2026-046', project: 'Bridge Deck Inspection', client: 'Trimble Internal', type: 'Fixed Price', value: '$38,000', valueRaw: 38000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Apr 12, 2026', daysLeft: 16 },
  { id: 'EST-2026-048', project: 'Warehouse Loading Dock Expansion', client: 'DataDrive AI', type: 'Milestone', value: '$410,000', valueRaw: 410000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Apr 15, 2026', daysLeft: 19 },
  { id: 'EST-2026-051', project: 'Parking Structure Repair', client: 'NexGen Analytics', type: 'Fixed Price', value: '$95,500', valueRaw: 95500, status: 'Under Review', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Apr 17, 2026', daysLeft: 21 },
  { id: 'EST-2026-056', project: 'Oak Valley Elementary Addition', client: 'Apex Corp', type: 'Milestone', value: '$340,000', valueRaw: 340000, status: 'Draft', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Apr 20, 2026', daysLeft: 24 },
  // --- Due 4-6+ weeks out (6) ---
  { id: 'EST-2026-049', project: 'Site Safety Equipment Setup', client: 'Trimble Internal', type: 'Fixed Price', value: '$62,000', valueRaw: 62000, status: 'Draft', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Apr 25, 2026', daysLeft: 29 },
  { id: 'EST-2026-052', project: 'Structural Assessment Program', client: 'GlobalTech Ltd', type: 'Retainer', value: '$18,000/mo', valueRaw: 18000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Apr 30, 2026', daysLeft: 34 },
  { id: 'EST-2026-057', project: 'Lakeshore Drive Seawall Restoration', client: 'CoreSystems Inc', type: 'Fixed Price', value: '$425,000', valueRaw: 425000, status: 'Draft', requestedBy: 'Lena Brooks', requestedByInitials: 'LB', dueDate: 'May 4, 2026', daysLeft: 38 },
  { id: 'EST-2026-058', project: 'Downtown Condo Lobby Remodel', client: 'Brightline Co', type: 'T&M', value: '$148,000', valueRaw: 148000, status: 'Draft', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'May 8, 2026', daysLeft: 42 },
  { id: 'EST-2026-059', project: 'County Courthouse ADA Retrofit', client: 'GlobalTech Ltd', type: 'Milestone', value: '$290,000', valueRaw: 290000, status: 'Under Review', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'May 12, 2026', daysLeft: 46 },
  { id: 'EST-2026-060', project: 'Solar Canopy Installation -- Fleet Yard', client: 'DataDrive AI', type: 'T&M', value: '$78,000', valueRaw: 78000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'May 15, 2026', daysLeft: 49 },
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
export const TIME_OFF_REQUESTS: TimeOffRequest[] = [
  // --- March 2026 ---
  { id: 1, name: 'Sarah Chen', initials: 'SC', type: 'Vacation', startDate: 'Mar 2', endDate: 'Mar 6', days: 5, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 2, name: 'James Carter', initials: 'JC', type: 'Sick Leave', startDate: 'Mar 3', endDate: 'Mar 3', days: 1, status: 'Approved', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 3, name: 'Nina Alvarez', initials: 'NA', type: 'Personal', startDate: 'Mar 4', endDate: 'Mar 4', days: 1, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 4, name: 'Derek Huang', initials: 'DH', type: 'Sick Leave', startDate: 'Mar 5', endDate: 'Mar 6', days: 2, status: 'Approved', projectId: 8, projectName: 'Industrial Park Warehouse' },
  { id: 5, name: 'Tom Evans', initials: 'TE', type: 'Personal', startDate: 'Mar 6', endDate: 'Mar 6', days: 1, status: 'Approved', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 6, name: 'Priya Nair', initials: 'PN', type: 'Vacation', startDate: 'Mar 9', endDate: 'Mar 13', days: 5, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 7, name: 'Carlos Medina', initials: 'CM', type: 'Jury Duty', startDate: 'Mar 9', endDate: 'Mar 11', days: 3, status: 'Approved', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 8, name: 'Rachel Kim', initials: 'RK', type: 'Sick Leave', startDate: 'Mar 10', endDate: 'Mar 10', days: 1, status: 'Approved', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 9, name: 'Lena Brooks', initials: 'LB', type: 'Vacation', startDate: 'Mar 16', endDate: 'Mar 20', days: 5, status: 'Approved', projectId: 5, projectName: 'Westfield Shopping Center' },
  { id: 10, name: 'Mike Osei', initials: 'MO', type: 'Sick Leave', startDate: 'Mar 12', endDate: 'Mar 12', days: 1, status: 'Denied', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 11, name: 'Aisha Patel', initials: 'AP', type: 'Vacation', startDate: 'Mar 16', endDate: 'Mar 18', days: 3, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 12, name: 'Brian Novak', initials: 'BN', type: 'Bereavement', startDate: 'Mar 13', endDate: 'Mar 17', days: 3, status: 'Approved', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 13, name: 'Tanya Reeves', initials: 'TR', type: 'Vacation', startDate: 'Mar 23', endDate: 'Mar 27', days: 5, status: 'Pending', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 14, name: 'Jordan Blake', initials: 'JB', type: 'Personal', startDate: 'Mar 18', endDate: 'Mar 18', days: 1, status: 'Approved', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 15, name: 'Marcus Webb', initials: 'MW', type: 'Sick Leave', startDate: 'Mar 19', endDate: 'Mar 20', days: 2, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 16, name: 'Olivia Grant', initials: 'OG', type: 'Vacation', startDate: 'Mar 23', endDate: 'Mar 25', days: 3, status: 'Approved', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 17, name: 'Kevin Zhao', initials: 'KZ', type: 'Personal', startDate: 'Mar 20', endDate: 'Mar 20', days: 1, status: 'Approved', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 18, name: 'Samira Patel', initials: 'SP', type: 'Vacation', startDate: 'Mar 30', endDate: 'Apr 3', days: 5, status: 'Pending', projectId: 8, projectName: 'Industrial Park Warehouse' },
  { id: 19, name: 'Chris Delgado', initials: 'CD', type: 'Sick Leave', startDate: 'Mar 24', endDate: 'Mar 24', days: 1, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 20, name: 'Laura Hoffman', initials: 'LH', type: 'Vacation', startDate: 'Mar 26', endDate: 'Mar 27', days: 2, status: 'Pending', projectId: 5, projectName: 'Westfield Shopping Center' },
  { id: 21, name: 'Nathan Ruiz', initials: 'NR', type: 'Personal', startDate: 'Mar 25', endDate: 'Mar 25', days: 1, status: 'Approved', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 22, name: 'Felicity Dunn', initials: 'FD', type: 'Sick Leave', startDate: 'Mar 26', endDate: 'Mar 27', days: 2, status: 'Denied', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 23, name: 'Angela Torres', initials: 'AT', type: 'Vacation', startDate: 'Mar 30', endDate: 'Apr 1', days: 3, status: 'Pending', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 24, name: 'Daniel Park', initials: 'DP', type: 'Sick Leave', startDate: 'Mar 31', endDate: 'Mar 31', days: 1, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  // --- April 2026 ---
  { id: 25, name: 'Sarah Chen', initials: 'SC', type: 'Personal', startDate: 'Apr 3', endDate: 'Apr 3', days: 1, status: 'Pending', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 26, name: 'James Carter', initials: 'JC', type: 'Vacation', startDate: 'Apr 6', endDate: 'Apr 10', days: 5, status: 'Pending', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 27, name: 'Hakeem Washington', initials: 'HW', type: 'Vacation', startDate: 'Apr 6', endDate: 'Apr 8', days: 3, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 28, name: 'Derek Huang', initials: 'DH', type: 'Vacation', startDate: 'Apr 13', endDate: 'Apr 17', days: 5, status: 'Pending', projectId: 8, projectName: 'Industrial Park Warehouse' },
  { id: 29, name: 'Priya Nair', initials: 'PN', type: 'Sick Leave', startDate: 'Apr 7', endDate: 'Apr 7', days: 1, status: 'Approved', projectId: 8, projectName: 'Industrial Park Warehouse' },
  { id: 30, name: 'Nina Alvarez', initials: 'NA', type: 'Vacation', startDate: 'Apr 13', endDate: 'Apr 15', days: 3, status: 'Pending', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 31, name: 'Rachel Kim', initials: 'RK', type: 'Vacation', startDate: 'Apr 6', endDate: 'Apr 10', days: 5, status: 'Approved', projectId: 5, projectName: 'Westfield Shopping Center' },
  { id: 32, name: 'Lena Brooks', initials: 'LB', type: 'Personal', startDate: 'Apr 9', endDate: 'Apr 9', days: 1, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 33, name: 'Aisha Patel', initials: 'AP', type: 'Sick Leave', startDate: 'Apr 10', endDate: 'Apr 10', days: 1, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 34, name: 'Carlos Medina', initials: 'CM', type: 'Vacation', startDate: 'Apr 20', endDate: 'Apr 24', days: 5, status: 'Pending', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 35, name: 'Brian Novak', initials: 'BN', type: 'Personal', startDate: 'Apr 14', endDate: 'Apr 14', days: 1, status: 'Approved', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 36, name: 'Tom Evans', initials: 'TE', type: 'Vacation', startDate: 'Apr 20', endDate: 'Apr 22', days: 3, status: 'Pending', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 37, name: 'Jordan Blake', initials: 'JB', type: 'Sick Leave', startDate: 'Apr 15', endDate: 'Apr 16', days: 2, status: 'Approved', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 38, name: 'Tanya Reeves', initials: 'TR', type: 'Personal', startDate: 'Apr 17', endDate: 'Apr 17', days: 1, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
  { id: 39, name: 'Marcus Webb', initials: 'MW', type: 'Vacation', startDate: 'Apr 20', endDate: 'Apr 24', days: 5, status: 'Pending', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 40, name: 'Kevin Zhao', initials: 'KZ', type: 'Vacation', startDate: 'Apr 27', endDate: 'Apr 30', days: 4, status: 'Pending', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 41, name: 'Mike Osei', initials: 'MO', type: 'Vacation', startDate: 'Apr 22', endDate: 'Apr 24', days: 3, status: 'Denied', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 42, name: 'Olivia Grant', initials: 'OG', type: 'Sick Leave', startDate: 'Apr 21', endDate: 'Apr 21', days: 1, status: 'Approved', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 43, name: 'Felicity Dunn', initials: 'FD', type: 'Vacation', startDate: 'Apr 27', endDate: 'Apr 30', days: 4, status: 'Pending', projectId: 7, projectName: 'Sunset Ridge Apartments' },
  { id: 44, name: 'Chris Delgado', initials: 'CD', type: 'Vacation', startDate: 'Apr 13', endDate: 'Apr 17', days: 5, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 45, name: 'Laura Hoffman', initials: 'LH', type: 'Sick Leave', startDate: 'Apr 22', endDate: 'Apr 22', days: 1, status: 'Approved', projectId: 5, projectName: 'Westfield Shopping Center' },
  { id: 46, name: 'Samira Patel', initials: 'SP', type: 'Personal', startDate: 'Apr 23', endDate: 'Apr 23', days: 1, status: 'Approved', projectId: 4, projectName: 'Lakeside Medical Center' },
  { id: 47, name: 'Nathan Ruiz', initials: 'NR', type: 'Vacation', startDate: 'Apr 27', endDate: 'Apr 30', days: 4, status: 'Pending', projectId: 2, projectName: 'Harbor View Condominiums' },
  { id: 48, name: 'Daniel Park', initials: 'DP', type: 'Vacation', startDate: 'Apr 6', endDate: 'Apr 8', days: 3, status: 'Approved', projectId: 1, projectName: 'Riverside Office Complex' },
  { id: 49, name: 'Angela Torres', initials: 'AT', type: 'Sick Leave', startDate: 'Apr 28', endDate: 'Apr 28', days: 1, status: 'Pending', projectId: 6, projectName: 'Metro Bridge Rehabilitation' },
  { id: 50, name: 'Hakeem Washington', initials: 'HW', type: 'Personal', startDate: 'Apr 24', endDate: 'Apr 24', days: 1, status: 'Approved', projectId: 3, projectName: 'Downtown Transit Hub' },
];
export const PROJECT_TEAM_SIZES: Record<number, number> = { 1: 6, 2: 5, 3: 8, 4: 7, 5: 4, 6: 4, 7: 5, 8: 5 };
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
  { id: '11', number: 'SUB-011', subject: 'Roof membrane product data', project: 'Harbor View Condominiums', assignee: 'James Carter', status: 'overdue', dueDate: 'Mar 2' },
  { id: '12', number: 'SUB-012', subject: 'Elevator cab finish selections', project: 'Riverside Office Complex', assignee: 'Sarah Chen', status: 'upcoming', dueDate: 'Mar 28' },
  { id: '13', number: 'SUB-013', subject: 'Generator load bank test report', project: 'Lakeside Medical Center', assignee: 'Tom Evans', status: 'open', dueDate: 'Mar 18' },
  { id: '14', number: 'SUB-014', subject: 'Epoxy floor coating samples', project: 'Industrial Park Warehouse', assignee: 'Priya Nair', status: 'overdue', dueDate: 'Mar 6' },
  { id: '15', number: 'SUB-015', subject: 'Landscape irrigation shop drawings', project: 'Westfield Shopping Center', assignee: 'Lena Brooks', status: 'open', dueDate: 'Mar 20' },
];

export const CALENDAR_APPOINTMENTS: CalendarAppointment[] = [
  // ─── March 2026 ───
  // Week of Mar 2
  { id: 1, title: 'Daily Standup', date: new Date(2026, 2, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 2, title: 'Weekly Progress Review', date: new Date(2026, 2, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 3, title: 'Client Call — Acme Corp', date: new Date(2026, 2, 2), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 4, title: 'Daily Standup', date: new Date(2026, 2, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 5, title: 'Transit Hub Budget Review', date: new Date(2026, 2, 3), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review', projectSlug: 'downtown-transit-hub' },
  { id: 6, title: 'Focus: Progress Reports', date: new Date(2026, 2, 3), startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 7, title: 'Daily Standup', date: new Date(2026, 2, 4), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 8, title: 'Safety Coordination Meeting', date: new Date(2026, 2, 4), startHour: 13, startMin: 0, endHour: 14, endMin: 30, type: 'meeting' },
  { id: 9, title: 'Daily Standup', date: new Date(2026, 2, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 10, title: 'Riverside Office Sync', date: new Date(2026, 2, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review', projectSlug: 'riverside-office-complex' },
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
  { id: 20, title: 'Harbor View Check-in', date: new Date(2026, 2, 10), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call', projectSlug: 'harbor-view-condominiums' },
  { id: 21, title: 'Daily Standup', date: new Date(2026, 2, 11), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 22, title: 'Vendor Demo — Concrete Supplier', date: new Date(2026, 2, 11), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 23, title: 'Focus: Sunset Ridge Landscaping', date: new Date(2026, 2, 11), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 24, title: 'Daily Standup', date: new Date(2026, 2, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 25, title: 'Bridge Rehabilitation Review', date: new Date(2026, 2, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review', projectSlug: 'metro-bridge-rehabilitation' },
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
  { id: 47, title: 'Riverside Office Go/No-Go', date: new Date(2026, 2, 24), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting', projectSlug: 'riverside-office-complex' },
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

export const MONTHLY_REVENUE: Record<RevenueTimeRange, RevenueDataPoint[]> = {
  '1M': generateDaily1M(),
  'YTD': generateDailyYtd(),
  '1Y': sliceWeeklyView(1),
  '3Y': sliceWeeklyView(3),
  '5Y': sliceWeeklyView(5),
};

export const ANNUAL_TOTALS: Record<RevenueTimeRange, { current: number; previous: number; label: string }> = {
  '1M': { current: 530000, previous: 480000, label: 'Mar 2026' },
  'YTD': { current: 1530000, previous: 1320000, label: 'Jan\u2013Mar 2026' },
  '1Y': { current: 5605000, previous: 4870000, label: 'Apr 2025\u2013Mar 2026' },
  '3Y': { current: 5605000, previous: 2400000, label: '2023\u20132026' },
  '5Y': { current: 6360000, previous: 1980000, label: '2021\u20132026' },
};
export const PROJECT_REVENUE: ProjectRevenue[] = [
  { projectId: 1, projectName: 'Riverside Office Complex', contractValue: '$920K', invoiced: '$612K', collected: '$544K', outstanding: '$68K', retainage: '$46K', invoicedRaw: 612000, collectedRaw: 544000, outstandingRaw: 68000, retainageRaw: 46000 },
  { projectId: 2, projectName: 'Harbor View Condominiums', contractValue: '$340K', invoiced: '$272K', collected: '$246K', outstanding: '$26K', retainage: '$17K', invoicedRaw: 272000, collectedRaw: 246000, outstandingRaw: 26000, retainageRaw: 17000 },
  { projectId: 3, projectName: 'Downtown Transit Hub', contractValue: '$1.08M', invoiced: '$918K', collected: '$855K', outstanding: '$63K', retainage: '$54K', invoicedRaw: 918000, collectedRaw: 855000, outstandingRaw: 63000, retainageRaw: 54000 },
  { projectId: 4, projectName: 'Lakeside Medical Center', contractValue: '$580K', invoiced: '$174K', collected: '$150K', outstanding: '$24K', retainage: '$29K', invoicedRaw: 174000, collectedRaw: 150000, outstandingRaw: 24000, retainageRaw: 29000 },
  { projectId: 5, projectName: 'Westfield Shopping Center', contractValue: '$385K', invoiced: '$31K', collected: '$24K', outstanding: '$7K', retainage: '$4K', invoicedRaw: 31000, collectedRaw: 24000, outstandingRaw: 7000, retainageRaw: 4000 },
  { projectId: 6, projectName: 'Metro Bridge Rehabilitation', contractValue: '$175K', invoiced: '$126K', collected: '$108K', outstanding: '$18K', retainage: '$9K', invoicedRaw: 126000, collectedRaw: 108000, outstandingRaw: 18000, retainageRaw: 9000 },
  { projectId: 7, projectName: 'Sunset Ridge Apartments', contractValue: '$230K', invoiced: '$127K', collected: '$110K', outstanding: '$17K', retainage: '$12K', invoicedRaw: 127000, collectedRaw: 110000, outstandingRaw: 17000, retainageRaw: 12000 },
  { projectId: 8, projectName: 'Industrial Park Warehouse', contractValue: '$575K', invoiced: '$104K', collected: '$90K', outstanding: '$14K', retainage: '$10K', invoicedRaw: 104000, collectedRaw: 90000, outstandingRaw: 14000, retainageRaw: 10000 },
];
export const CONTRACTS: Contract[] = [
  // --- Prime Contracts (8, one per project) ---
  { id: 'PC-2026-001', project: 'Riverside Office Complex', projectId: 1, contractType: 'prime', title: 'Riverside Office Complex - General Construction', vendor: 'Owner: Trimble Internal', originalValue: 800000, revisedValue: 870000, status: 'active', startDate: 'Jan 5, 2026', endDate: 'Mar 15, 2026', scope: 'Full general construction including structural, MEP, and interiors', retainage: 10, linkedChangeOrderIds: ['PCO-001', 'PCO-010'] },
  { id: 'PC-2026-002', project: 'Harbor View Condominiums', projectId: 2, contractType: 'prime', title: 'Harbor View Condominiums - Prime Agreement', vendor: 'Owner: Apex Corp', originalValue: 300000, revisedValue: 318500, status: 'active', startDate: 'Feb 1, 2026', endDate: 'Mar 28, 2026', scope: 'Multi-family residential construction -- 24 units across 2 buildings', retainage: 10, linkedChangeOrderIds: ['PCO-002'] },
  { id: 'PC-2026-003', project: 'Downtown Transit Hub', projectId: 3, contractType: 'prime', title: 'Downtown Transit Hub - Prime Construction', vendor: 'Owner: GlobalTech Ltd', originalValue: 900000, revisedValue: 1022000, status: 'active', startDate: 'Nov 15, 2025', endDate: 'Feb 20, 2026', scope: 'Transit platform, concourse, and canopy construction', retainage: 5, linkedChangeOrderIds: ['PCO-003', 'PCO-004'] },
  { id: 'PC-2026-004', project: 'Lakeside Medical Center', projectId: 4, contractType: 'prime', title: 'Lakeside Medical Center - Healthcare Facility', vendor: 'Owner: NexGen Analytics', originalValue: 500000, revisedValue: 515200, status: 'active', startDate: 'Jan 20, 2026', endDate: 'Apr 10, 2026', scope: 'Medical facility build-out including surgical wing and outpatient area', retainage: 10, linkedChangeOrderIds: ['PCO-005', 'PCO-011'] },
  { id: 'PC-2026-005', project: 'Westfield Shopping Center', projectId: 5, contractType: 'prime', title: 'Westfield Shopping Center - Retail Development', vendor: 'Owner: Brightline Co', originalValue: 350000, revisedValue: 362500, status: 'active', startDate: 'Mar 1, 2026', endDate: 'Apr 30, 2026', scope: 'Retail center shell and core with tenant improvement allowances', retainage: 10, linkedChangeOrderIds: ['PCO-006'] },
  { id: 'PC-2026-006', project: 'Metro Bridge Rehabilitation', projectId: 6, contractType: 'prime', title: 'Metro Bridge Rehabilitation - Infrastructure Repair', vendor: 'Owner: Trimble Internal', originalValue: 150000, revisedValue: 214000, status: 'active', startDate: 'Dec 1, 2025', endDate: 'Mar 5, 2026', scope: 'Bridge deck rehabilitation, bearing replacement, and walkway widening', retainage: 5, linkedChangeOrderIds: ['PCO-007'] },
  { id: 'PC-2026-007', project: 'Sunset Ridge Apartments', projectId: 7, contractType: 'prime', title: 'Sunset Ridge Apartments - Residential Complex', vendor: 'Owner: CoreSystems Inc', originalValue: 200000, revisedValue: 222000, status: 'active', startDate: 'Jan 10, 2026', endDate: 'Feb 14, 2026', scope: 'Multi-building apartment complex with parking and landscaping', retainage: 10, linkedChangeOrderIds: ['PCO-008'] },
  { id: 'PC-2026-008', project: 'Industrial Park Warehouse', projectId: 8, contractType: 'prime', title: 'Industrial Park Warehouse - Distribution Facility', vendor: 'Owner: DataDrive AI', originalValue: 500000, revisedValue: 531000, status: 'active', startDate: 'Feb 15, 2026', endDate: 'May 20, 2026', scope: 'Warehouse with loading docks, fire suppression, and office build-out', retainage: 10, linkedChangeOrderIds: ['PCO-009'] },
  // --- Subcontracts (aligned with SCO vendors) ---
  { id: 'SC-2026-001', project: 'Riverside Office Complex', projectId: 1, contractType: 'subcontract', title: 'Electrical Work -- Apex Electrical Inc.', vendor: 'Apex Electrical Inc.', originalValue: 120000, revisedValue: 134500, status: 'active', startDate: 'Jan 15, 2026', endDate: 'Mar 15, 2026', scope: 'Complete electrical rough-in, panel installation, and finish wiring', retainage: 10, linkedChangeOrderIds: ['SCO-001'] },
  { id: 'SC-2026-002', project: 'Harbor View Condominiums', projectId: 2, contractType: 'subcontract', title: 'Drywall & Framing -- ProWall Drywall LLC', vendor: 'ProWall Drywall LLC', originalValue: 65000, revisedValue: 71800, status: 'active', startDate: 'Feb 10, 2026', endDate: 'Mar 28, 2026', scope: 'Interior framing, drywall installation, blocking, and finishing', retainage: 10, linkedChangeOrderIds: ['SCO-002'] },
  { id: 'SC-2026-003', project: 'Downtown Transit Hub', projectId: 3, contractType: 'subcontract', title: 'Waterproofing -- WaterTight Systems', vendor: 'WaterTight Systems', originalValue: 85000, revisedValue: 113500, status: 'active', startDate: 'Dec 15, 2025', endDate: 'Feb 20, 2026', scope: 'Below-grade waterproofing, pit membranes, and deck coatings', retainage: 5, linkedChangeOrderIds: ['SCO-003'] },
  { id: 'SC-2026-004', project: 'Lakeside Medical Center', projectId: 4, contractType: 'subcontract', title: 'HVAC Mechanical -- CoolAir Mechanical', vendor: 'CoolAir Mechanical', originalValue: 145000, revisedValue: 178000, status: 'active', startDate: 'Feb 1, 2026', endDate: 'Apr 10, 2026', scope: 'HVAC ductwork, air handling units, and controls for medical facility', retainage: 10, linkedChangeOrderIds: ['SCO-004'] },
  { id: 'SC-2026-005', project: 'Westfield Shopping Center', projectId: 5, contractType: 'subcontract', title: 'Fire Protection -- FireGuard Solutions', vendor: 'FireGuard Solutions', originalValue: 48000, revisedValue: 59200, status: 'active', startDate: 'Mar 5, 2026', endDate: 'Apr 30, 2026', scope: 'Fire alarm, sprinkler system installation, and zone programming', retainage: 10, linkedChangeOrderIds: ['SCO-005'] },
  { id: 'SC-2026-006', project: 'Metro Bridge Rehabilitation', projectId: 6, contractType: 'subcontract', title: 'Concrete Repair -- BridgeTech Concrete', vendor: 'BridgeTech Concrete', originalValue: 55000, revisedValue: 74000, status: 'active', startDate: 'Dec 10, 2025', endDate: 'Mar 5, 2026', scope: 'Deck scarification, epoxy injection, and concrete overlay', retainage: 5, linkedChangeOrderIds: ['SCO-006'] },
  { id: 'SC-2026-007', project: 'Sunset Ridge Apartments', projectId: 7, contractType: 'subcontract', title: 'Plumbing -- PipeFit Plumbing Co.', vendor: 'PipeFit Plumbing Co.', originalValue: 72000, revisedValue: 89500, status: 'active', startDate: 'Jan 20, 2026', endDate: 'Feb 14, 2026', scope: 'Plumbing rough-in and finish for all residential units', retainage: 10, linkedChangeOrderIds: ['SCO-007'] },
  { id: 'SC-2026-008', project: 'Industrial Park Warehouse', projectId: 8, contractType: 'subcontract', title: 'Structural Steel -- IronWorks Structural', vendor: 'IronWorks Structural', originalValue: 190000, revisedValue: 216000, status: 'active', startDate: 'Feb 20, 2026', endDate: 'May 20, 2026', scope: 'Steel joist, girder, and decking installation', retainage: 10, linkedChangeOrderIds: ['SCO-008'] },
  { id: 'SC-2026-009', project: 'Riverside Office Complex', projectId: 1, contractType: 'subcontract', title: 'Elevator Installation -- VerticalRise Elevators', vendor: 'VerticalRise Elevators', originalValue: 95000, revisedValue: 104800, status: 'active', startDate: 'Feb 1, 2026', endDate: 'Mar 15, 2026', scope: 'Passenger elevator installation, cab finishes, and controls', retainage: 10, linkedChangeOrderIds: ['SCO-009'] },
  { id: 'SC-2026-010', project: 'Downtown Transit Hub', projectId: 3, contractType: 'subcontract', title: 'Shoring & Excavation -- DeepFound Shoring Inc.', vendor: 'DeepFound Shoring Inc.', originalValue: 130000, revisedValue: 175000, status: 'active', startDate: 'Nov 20, 2025', endDate: 'Feb 20, 2026', scope: 'Temporary shoring, soldier piles, and lagging for platform excavation', retainage: 5, linkedChangeOrderIds: ['SCO-010'] },
  { id: 'SC-2026-011', project: 'Lakeside Medical Center', projectId: 4, contractType: 'subcontract', title: 'Low-Voltage Systems -- MedConnect Systems', vendor: 'MedConnect Systems', originalValue: 78000, revisedValue: 99000, status: 'active', startDate: 'Feb 15, 2026', endDate: 'Apr 10, 2026', scope: 'Nurse call, intercom, and structured cabling throughout facility', retainage: 10, linkedChangeOrderIds: ['SCO-011'] },
  { id: 'SC-2026-012', project: 'Harbor View Condominiums', projectId: 2, contractType: 'subcontract', title: 'Glazing & Windows -- GlazePro Windows', vendor: 'GlazePro Windows', originalValue: 88000, revisedValue: 96200, status: 'active', startDate: 'Feb 15, 2026', endDate: 'Mar 28, 2026', scope: 'Window and storefront installation including sealants', retainage: 10, linkedChangeOrderIds: ['SCO-012'] },
  { id: 'SC-2026-013', project: 'Sunset Ridge Apartments', projectId: 7, contractType: 'subcontract', title: 'Landscape & Irrigation -- GreenScape Irrigation', vendor: 'GreenScape Irrigation', originalValue: 42000, revisedValue: 55500, status: 'pending', startDate: 'Mar 1, 2026', endDate: 'Apr 15, 2026', scope: 'Landscape irrigation, native planting, and hardscape', retainage: 10, linkedChangeOrderIds: ['SCO-013'] },
  { id: 'SC-2026-014', project: 'Westfield Shopping Center', projectId: 5, contractType: 'subcontract', title: 'Storefront Glazing -- GlazePro Windows', vendor: 'GlazePro Windows', originalValue: 62000, revisedValue: 77800, status: 'active', startDate: 'Mar 10, 2026', endDate: 'Apr 30, 2026', scope: 'Storefront framing, automatic doors, and curtain wall segments', retainage: 10, linkedChangeOrderIds: ['SCO-014'] },
];

export const CHANGE_ORDERS: ChangeOrder[] = [
  // --- Prime Contract Change Orders (11) ---
  { id: 'PCO-001', project: 'Riverside Office Complex', projectId: 1, coType: 'prime', description: 'Additional structural reinforcement at elevator shaft', amount: 42000, status: 'approved', requestedBy: 'Sarah Chen', requestDate: 'Feb 18, 2026', reason: 'Unforeseen soil condition requires deeper piers', contractNumber: 'PC-2026-001', costCode: '03-3100' },
  { id: 'PCO-002', project: 'Harbor View Condominiums', projectId: 2, coType: 'prime', description: 'Upgraded kitchen appliance package per owner request', amount: 18500, status: 'pending', requestedBy: 'James Carter', requestDate: 'Mar 5, 2026', reason: 'Client requested premium appliance tier', contractNumber: 'PC-2026-002', costCode: '11-3100' },
  { id: 'PCO-003', project: 'Downtown Transit Hub', projectId: 3, coType: 'prime', description: 'Extended working hours for critical path recovery', amount: 85000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 8, 2026', reason: 'Schedule recovery requires weekend and overtime shifts', contractNumber: 'PC-2026-003', costCode: '01-5400' },
  { id: 'PCO-004', project: 'Downtown Transit Hub', projectId: 3, coType: 'prime', description: 'Hazardous material abatement in platform area', amount: 37000, status: 'approved', requestedBy: 'Priya Nair', requestDate: 'Feb 10, 2026', reason: 'Unexpected asbestos found during demolition', contractNumber: 'PC-2026-003', costCode: '02-8200' },
  { id: 'PCO-005', project: 'Lakeside Medical Center', projectId: 4, coType: 'prime', description: 'Medical gas piping reroute around existing ductwork', amount: 15200, status: 'approved', requestedBy: 'Tom Evans', requestDate: 'Mar 1, 2026', reason: 'As-built conditions differ from survey drawings', contractNumber: 'PC-2026-004', costCode: '22-6300' },
  { id: 'PCO-006', project: 'Westfield Shopping Center', projectId: 5, coType: 'prime', description: 'Added grease interceptor for food court tenant', amount: 12500, status: 'pending', requestedBy: 'Lena Brooks', requestDate: 'Mar 18, 2026', reason: 'New tenant lease requires grease trap not in original scope', contractNumber: 'PC-2026-005', costCode: '22-1500' },
  { id: 'PCO-007', project: 'Metro Bridge Rehabilitation', projectId: 6, coType: 'prime', description: 'Widened pedestrian walkway per ADA compliance review', amount: 64000, status: 'approved', requestedBy: 'Mike Osei', requestDate: 'Feb 15, 2026', reason: 'ADA review required wider clear width on north approach', contractNumber: 'PC-2026-006', costCode: '03-3000' },
  { id: 'PCO-008', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'prime', description: 'Redesigned parking layout per city review comments', amount: 22000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 12, 2026', reason: 'City planning required ADA stall redistribution', contractNumber: 'PC-2026-007', costCode: '32-1200' },
  { id: 'PCO-009', project: 'Industrial Park Warehouse', projectId: 8, coType: 'prime', description: 'Fire suppression system upgrade to ESFR heads', amount: 31000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 15, 2026', reason: 'Insurance underwriter requires higher classification', contractNumber: 'PC-2026-008', costCode: '21-1300' },
  { id: 'PCO-010', project: 'Riverside Office Complex', projectId: 1, coType: 'prime', description: 'Owner-requested lobby finish upgrade to marble', amount: 28000, status: 'rejected', requestedBy: 'Lena Brooks', requestDate: 'Jan 30, 2026', reason: 'Requested marble upgrade exceeds contingency budget', contractNumber: 'PC-2026-001', costCode: '09-3000' },
  { id: 'PCO-011', project: 'Lakeside Medical Center', projectId: 4, coType: 'prime', description: 'Emergency generator capacity increase from 500kW to 750kW', amount: 92000, status: 'pending', requestedBy: 'Tom Evans', requestDate: 'Mar 20, 2026', reason: 'Updated hospital code requires additional life-safety load', contractNumber: 'PC-2026-004', costCode: '26-3200' },
  // --- Potential Change Orders (13) ---
  { id: 'POT-001', project: 'Riverside Office Complex', projectId: 1, coType: 'potential', description: 'Possible curtain wall redesign at west facade', amount: 58000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 10, 2026', reason: 'Architect reviewing thermal performance reports', costCode: '08-4400' },
  { id: 'POT-002', project: 'Harbor View Condominiums', projectId: 2, coType: 'potential', description: 'Additional balcony waterproofing layer', amount: 24000, status: 'pending', requestedBy: 'James Carter', requestDate: 'Mar 14, 2026', reason: 'Structural engineer flagged potential moisture ingress', costCode: '07-1600' },
  { id: 'POT-003', project: 'Downtown Transit Hub', projectId: 3, coType: 'potential', description: 'Platform edge warning strip upgrade to tactile pavers', amount: 16500, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 16, 2026', reason: 'Accessibility consultant recommending enhanced warning system', costCode: '32-1700' },
  { id: 'POT-004', project: 'Lakeside Medical Center', projectId: 4, coType: 'potential', description: 'Clean room air handling unit oversizing', amount: 47000, status: 'pending', requestedBy: 'Tom Evans', requestDate: 'Mar 18, 2026', reason: 'Pending infection control risk assessment results', costCode: '23-7400' },
  { id: 'POT-005', project: 'Westfield Shopping Center', projectId: 5, coType: 'potential', description: 'Parking garage lighting upgrade to LED', amount: 35000, status: 'pending', requestedBy: 'Lena Brooks', requestDate: 'Mar 20, 2026', reason: 'Owner evaluating energy savings vs. upfront cost', costCode: '26-5600' },
  { id: 'POT-006', project: 'Metro Bridge Rehabilitation', projectId: 6, coType: 'potential', description: 'Additional concrete testing and core sampling', amount: 8900, status: 'approved', requestedBy: 'Mike Osei', requestDate: 'Feb 22, 2026', reason: 'Engineer of record requires more test data', costCode: '03-0500' },
  { id: 'POT-007', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'potential', description: 'EV charging station pre-wire for 40 spaces', amount: 52000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 22, 2026', reason: 'City council considering EV mandate effective 2027', costCode: '26-2700' },
  { id: 'POT-008', project: 'Industrial Park Warehouse', projectId: 8, coType: 'potential', description: 'Roof-mounted solar panel structural reinforcement', amount: 38000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 19, 2026', reason: 'Owner exploring solar lease; needs structural assessment first', costCode: '05-1200' },
  { id: 'POT-009', project: 'Riverside Office Complex', projectId: 1, coType: 'potential', description: 'Underground utility relocation at north entrance', amount: 29000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 24, 2026', reason: 'Survey revealed abandoned conduit conflicting with new ductbank', costCode: '33-0500' },
  { id: 'POT-010', project: 'Downtown Transit Hub', projectId: 3, coType: 'potential', description: 'Noise barrier wall height increase from 8ft to 12ft', amount: 41000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 25, 2026', reason: 'Community board noise complaint; acoustics study underway', costCode: '32-3100' },
  { id: 'POT-011', project: 'Harbor View Condominiums', projectId: 2, coType: 'potential', description: 'Pool deck expansion and resurfacing', amount: 67000, status: 'pending', requestedBy: 'James Carter', requestDate: 'Mar 26, 2026', reason: 'HOA requesting larger pool amenity area', costCode: '13-1100' },
  { id: 'POT-012', project: 'Westfield Shopping Center', projectId: 5, coType: 'potential', description: 'Facade signage structural backing upgrade', amount: 19500, status: 'pending', requestedBy: 'Lena Brooks', requestDate: 'Mar 21, 2026', reason: 'New anchor tenant sign exceeds original design wind load', costCode: '05-5000' },
  { id: 'POT-013', project: 'Industrial Park Warehouse', projectId: 8, coType: 'potential', description: 'Truck court concrete thickness increase', amount: 22000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 23, 2026', reason: 'Tenant fleet includes heavier-than-specified vehicles', costCode: '03-3000' },
  // --- Subcontract Change Orders (14) ---
  { id: 'SCO-001', project: 'Riverside Office Complex', projectId: 1, coType: 'subcontract', description: 'Electrical panel relocation due to duct conflict', amount: 14500, status: 'approved', requestedBy: 'Tom Evans', requestDate: 'Feb 20, 2026', reason: 'MEP coordination revealed duct-panel clearance issue', subcontractor: 'Apex Electrical Inc.', costCode: '26-2400' },
  { id: 'SCO-002', project: 'Harbor View Condominiums', projectId: 2, coType: 'subcontract', description: 'Additional drywall blocking for grab bars', amount: 6800, status: 'approved', requestedBy: 'James Carter', requestDate: 'Mar 2, 2026', reason: 'ADA units require additional backing per updated plans', subcontractor: 'ProWall Drywall LLC', costCode: '09-2100' },
  { id: 'SCO-003', project: 'Downtown Transit Hub', projectId: 3, coType: 'subcontract', description: 'Escalator pit waterproofing membrane addition', amount: 28500, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 11, 2026', reason: 'Groundwater intrusion detected at escalator pit excavation', subcontractor: 'WaterTight Systems', costCode: '07-1000' },
  { id: 'SCO-004', project: 'Lakeside Medical Center', projectId: 4, coType: 'subcontract', description: 'HVAC ductwork reroute in surgical wing', amount: 33000, status: 'pending', requestedBy: 'Tom Evans', requestDate: 'Mar 6, 2026', reason: 'Structural beam addition conflicts with original duct routing', subcontractor: 'CoolAir Mechanical', costCode: '23-3100' },
  { id: 'SCO-005', project: 'Westfield Shopping Center', projectId: 5, coType: 'subcontract', description: 'Fire alarm system zone expansion for new tenant', amount: 11200, status: 'approved', requestedBy: 'Lena Brooks', requestDate: 'Mar 4, 2026', reason: 'New anchor tenant requires separate fire alarm zone', subcontractor: 'FireGuard Solutions', costCode: '28-3100' },
  { id: 'SCO-006', project: 'Metro Bridge Rehabilitation', projectId: 6, coType: 'subcontract', description: 'Epoxy injection for deck crack repair', amount: 19000, status: 'approved', requestedBy: 'Mike Osei', requestDate: 'Feb 28, 2026', reason: 'Additional cracks found during surface preparation', subcontractor: 'BridgeTech Concrete', costCode: '03-0100' },
  { id: 'SCO-007', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'subcontract', description: 'Plumbing rough-in revision for unit layout change', amount: 17500, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 13, 2026', reason: 'Architect revised unit 3B floor plan after rough-in started', subcontractor: 'PipeFit Plumbing Co.', costCode: '22-1100' },
  { id: 'SCO-008', project: 'Industrial Park Warehouse', projectId: 8, coType: 'subcontract', description: 'Steel joist substitution for longer span', amount: 26000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Mar 17, 2026', reason: 'Owner increased clear-span requirement by 10 feet', subcontractor: 'IronWorks Structural', costCode: '05-2100' },
  { id: 'SCO-009', project: 'Riverside Office Complex', projectId: 1, coType: 'subcontract', description: 'Elevator cab interior finish upgrade', amount: 9800, status: 'pending', requestedBy: 'Lena Brooks', requestDate: 'Mar 9, 2026', reason: 'Owner wants brushed stainless instead of painted steel', subcontractor: 'VerticalRise Elevators', costCode: '14-2000' },
  { id: 'SCO-010', project: 'Downtown Transit Hub', projectId: 3, coType: 'subcontract', description: 'Temporary shoring extension for adjacent excavation', amount: 45000, status: 'approved', requestedBy: 'Priya Nair', requestDate: 'Feb 25, 2026', reason: 'Adjacent property excavation requires extended shoring duration', subcontractor: 'DeepFound Shoring Inc.', costCode: '31-5000' },
  { id: 'SCO-011', project: 'Lakeside Medical Center', projectId: 4, coType: 'subcontract', description: 'Nurse call system wiring addition for 12 rooms', amount: 21000, status: 'pending', requestedBy: 'Tom Evans', requestDate: 'Mar 22, 2026', reason: 'Scope expanded to include outpatient wing rooms', subcontractor: 'MedConnect Systems', costCode: '27-5100' },
  { id: 'SCO-012', project: 'Harbor View Condominiums', projectId: 2, coType: 'subcontract', description: 'Window sealant replacement at units 4A-4F', amount: 8200, status: 'approved', requestedBy: 'James Carter', requestDate: 'Mar 7, 2026', reason: 'Failed adhesion test on originally specified sealant', subcontractor: 'GlazePro Windows', costCode: '07-9200' },
  { id: 'SCO-013', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'subcontract', description: 'Landscape irrigation system revision for native plants', amount: 13500, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Mar 24, 2026', reason: 'Owner switched to drought-tolerant plant palette', subcontractor: 'GreenScape Irrigation', costCode: '32-8400' },
  { id: 'SCO-014', project: 'Westfield Shopping Center', projectId: 5, coType: 'subcontract', description: 'Storefront framing modification for wider entrance', amount: 15800, status: 'pending', requestedBy: 'Lena Brooks', requestDate: 'Mar 19, 2026', reason: 'ADA consultant requires wider automatic door clearance', subcontractor: 'GlazePro Windows', costCode: '08-4100' },
];
export const DAILY_REPORTS: DailyReport[] = [
  { id: 'DR-001', projectId: 1, project: 'Riverside Office Complex', date: 'Mar 26, 2026', author: 'Sarah Chen', weather: 'Clear, 62F', crewCount: 24, hoursWorked: 192, workPerformed: 'Continued 3rd floor framing; installed elevator guide rails; poured level 2 topping slab', issues: 'Minor concrete delivery delay (45 min)', safetyIncidents: 0 },
  { id: 'DR-002', projectId: 1, project: 'Riverside Office Complex', date: 'Mar 25, 2026', author: 'Sarah Chen', weather: 'Overcast, 58F', crewCount: 22, hoursWorked: 176, workPerformed: 'Set structural steel columns grid C-F; mechanical rough-in level 2 east wing', issues: 'None', safetyIncidents: 0 },
  { id: 'DR-003', projectId: 3, project: 'Downtown Transit Hub', date: 'Mar 26, 2026', author: 'Priya Nair', weather: 'Rain, 52F', crewCount: 18, hoursWorked: 144, workPerformed: 'Platform canopy steel erection delayed by rain; continued interior finishes in concourse', issues: 'Rain stopped exterior work at 10:30 AM. Rescheduled crane lift to tomorrow.', safetyIncidents: 0 },
  { id: 'DR-004', projectId: 4, project: 'Lakeside Medical Center', date: 'Mar 26, 2026', author: 'Tom Evans', weather: 'Partly cloudy, 65F', crewCount: 16, hoursWorked: 128, workPerformed: 'Medical gas piping rough-in level 2; electrical panel installation; fire alarm wiring zone C', issues: 'Awaiting fire marshal inspection for zone B approval', safetyIncidents: 0 },
  { id: 'DR-005', projectId: 6, project: 'Metro Bridge Rehabilitation', date: 'Mar 26, 2026', author: 'Mike Osei', weather: 'Clear, 60F', crewCount: 12, hoursWorked: 96, workPerformed: 'Deck scarification complete spans 3-4; began rebar placement for overlay pour', issues: 'None', safetyIncidents: 0 },
  { id: 'DR-006', projectId: 2, project: 'Harbor View Condominiums', date: 'Mar 26, 2026', author: 'James Carter', weather: 'Clear, 62F', crewCount: 14, hoursWorked: 112, workPerformed: 'Exterior sheathing building B; window installation units 201-208; MEP rough-in building A level 3', issues: 'Window manufacturer shipped wrong size for unit 206 -- reorder placed', safetyIncidents: 0 },
  { id: 'DR-007', projectId: 8, project: 'Industrial Park Warehouse', date: 'Mar 26, 2026', author: 'Priya Nair', weather: 'Clear, 64F', crewCount: 20, hoursWorked: 160, workPerformed: 'Slab on grade pour zones 1-3; overhead door framing started; fire line underground tie-in', issues: 'None', safetyIncidents: 0 },
  { id: 'DR-008', projectId: 7, project: 'Sunset Ridge Apartments', date: 'Mar 25, 2026', author: 'Sarah Chen', weather: 'Overcast, 55F', crewCount: 10, hoursWorked: 80, workPerformed: 'Foundation waterproofing building A; backfill and compaction east wall', issues: 'Compaction test failed first pass -- re-compacted and retested OK', safetyIncidents: 1 },
  { id: 'DR-009', projectId: 5, project: 'Westfield Shopping Center', date: 'Mar 26, 2026', author: 'Lena Brooks', weather: 'Clear, 63F', crewCount: 8, hoursWorked: 64, workPerformed: 'Site clearing and grading lot B; survey staking for building pad; erosion control install', issues: 'Survey crew delayed 1 hour -- equipment calibration issue', safetyIncidents: 0 },
  { id: 'DR-010', projectId: 5, project: 'Westfield Shopping Center', date: 'Mar 25, 2026', author: 'Lena Brooks', weather: 'Partly cloudy, 59F', crewCount: 6, hoursWorked: 48, workPerformed: 'Utility locate markings confirmed; began demolition of existing pavement section A', issues: 'None', safetyIncidents: 0 },
  { id: 'DR-011', projectId: 4, project: 'Lakeside Medical Center', date: 'Mar 25, 2026', author: 'Tom Evans', weather: 'Clear, 63F', crewCount: 18, hoursWorked: 144, workPerformed: 'Electrical conduit run level 2 south wing; plumbing rough-in exam rooms 201-210; elevator shaft steel framing', issues: 'Elevator guide rail delivery delayed to Friday', safetyIncidents: 0 },
  { id: 'DR-012', projectId: 6, project: 'Metro Bridge Rehabilitation', date: 'Mar 25, 2026', author: 'Mike Osei', weather: 'Overcast, 56F', crewCount: 10, hoursWorked: 80, workPerformed: 'Completed deck scarification spans 1-2; bearing pad installation south abutment', issues: 'Bearing pad shimming requires additional measurement', safetyIncidents: 0 },
];
export const WEATHER_FORECAST: WeatherForecast[] = [
  { date: 'Mar 27', day: 'Fri', condition: 'sunny', highF: 64, lowF: 45, precipPct: 5, windMph: 8, workImpact: 'none', note: '' },
  { date: 'Mar 28', day: 'Sat', condition: 'partly-cloudy', highF: 61, lowF: 43, precipPct: 15, windMph: 12, workImpact: 'none', note: '' },
  { date: 'Mar 29', day: 'Sun', condition: 'cloudy', highF: 56, lowF: 40, precipPct: 40, windMph: 15, workImpact: 'none', note: '' },
  { date: 'Mar 30', day: 'Mon', condition: 'rain', highF: 52, lowF: 38, precipPct: 85, windMph: 22, workImpact: 'major', note: 'Heavy rain expected -- no concrete pours or exterior work. Crane operations suspended if gusts exceed 25 mph.' },
  { date: 'Mar 31', day: 'Tue', condition: 'rain', highF: 50, lowF: 37, precipPct: 70, windMph: 18, workImpact: 'minor', note: 'Tapering showers through morning. Afternoon exterior work possible.' },
  { date: 'Apr 1', day: 'Wed', condition: 'partly-cloudy', highF: 58, lowF: 41, precipPct: 20, windMph: 10, workImpact: 'none', note: 'Drying out. Resume all outdoor operations.' },
  { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 65, lowF: 44, precipPct: 5, windMph: 7, workImpact: 'none', note: '' },
];
export const PROJECT_WEATHER_DATA: ProjectWeather[] = [
  {
    projectId: 1, city: 'Portland', state: 'OR',
    current: { condition: 'partly-cloudy', tempF: 54, feelsLikeF: 51, humidity: 68, windMph: 11, windDir: 'SW', uvIndex: 3 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'partly-cloudy', highF: 58, lowF: 42, precipPct: 20, windMph: 11, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'rain', highF: 52, lowF: 40, precipPct: 75, windMph: 16, workImpact: 'minor', note: 'Steady rain through midday. Interior work only in AM.' },
      { date: 'Mar 29', day: 'Sun', condition: 'rain', highF: 50, lowF: 38, precipPct: 85, windMph: 22, workImpact: 'major', note: 'Heavy rain and wind. Suspend crane operations.' },
      { date: 'Mar 30', day: 'Mon', condition: 'cloudy', highF: 53, lowF: 39, precipPct: 40, windMph: 14, workImpact: 'minor', note: 'Showers tapering. Afternoon exterior possible.' },
      { date: 'Mar 31', day: 'Tue', condition: 'partly-cloudy', highF: 57, lowF: 41, precipPct: 15, windMph: 9, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 62, lowF: 44, precipPct: 5, windMph: 7, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 65, lowF: 45, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 2, city: 'San Francisco', state: 'CA',
    current: { condition: 'cloudy', tempF: 58, feelsLikeF: 55, humidity: 72, windMph: 18, windDir: 'W', uvIndex: 4 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'cloudy', highF: 61, lowF: 50, precipPct: 25, windMph: 18, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'partly-cloudy', highF: 63, lowF: 51, precipPct: 10, windMph: 15, workImpact: 'none', note: '' },
      { date: 'Mar 29', day: 'Sun', condition: 'rain', highF: 57, lowF: 49, precipPct: 70, windMph: 22, workImpact: 'major', note: 'Atmospheric river arriving. No exterior work. High wind advisory.' },
      { date: 'Mar 30', day: 'Mon', condition: 'rain', highF: 55, lowF: 48, precipPct: 80, windMph: 25, workImpact: 'major', note: 'Continued heavy rain. Flooding possible at grade level.' },
      { date: 'Mar 31', day: 'Tue', condition: 'cloudy', highF: 59, lowF: 49, precipPct: 35, windMph: 14, workImpact: 'minor', note: 'Rain tapering. Exterior afternoon OK with caution.' },
      { date: 'Apr 1', day: 'Wed', condition: 'partly-cloudy', highF: 64, lowF: 52, precipPct: 10, windMph: 10, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 67, lowF: 53, precipPct: 5, windMph: 8, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 3, city: 'Seattle', state: 'WA',
    current: { condition: 'rain', tempF: 48, feelsLikeF: 43, humidity: 82, windMph: 14, windDir: 'S', uvIndex: 1 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'rain', highF: 51, lowF: 40, precipPct: 70, windMph: 14, workImpact: 'minor', note: 'Light steady rain. Exterior work with precautions.' },
      { date: 'Mar 28', day: 'Sat', condition: 'rain', highF: 49, lowF: 38, precipPct: 80, windMph: 20, workImpact: 'major', note: 'Heavy rain with gusts to 30 mph. No crane or elevated work.' },
      { date: 'Mar 29', day: 'Sun', condition: 'cloudy', highF: 50, lowF: 39, precipPct: 45, windMph: 12, workImpact: 'minor', note: 'Scattered showers. Ground saturated.' },
      { date: 'Mar 30', day: 'Mon', condition: 'partly-cloudy', highF: 54, lowF: 41, precipPct: 20, windMph: 9, workImpact: 'none', note: '' },
      { date: 'Mar 31', day: 'Tue', condition: 'sunny', highF: 58, lowF: 42, precipPct: 5, windMph: 7, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 61, lowF: 44, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'partly-cloudy', highF: 59, lowF: 43, precipPct: 15, windMph: 10, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 4, city: 'Bend', state: 'OR',
    current: { condition: 'sunny', tempF: 46, feelsLikeF: 42, humidity: 38, windMph: 8, windDir: 'NW', uvIndex: 5 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'sunny', highF: 52, lowF: 28, precipPct: 5, windMph: 8, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'sunny', highF: 55, lowF: 30, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Mar 29', day: 'Sun', condition: 'partly-cloudy', highF: 50, lowF: 29, precipPct: 15, windMph: 10, workImpact: 'none', note: '' },
      { date: 'Mar 30', day: 'Mon', condition: 'cloudy', highF: 47, lowF: 27, precipPct: 30, windMph: 12, workImpact: 'none', note: '' },
      { date: 'Mar 31', day: 'Tue', condition: 'snow', highF: 38, lowF: 24, precipPct: 60, windMph: 15, workImpact: 'major', note: 'Snow likely. Freezing temps -- no concrete pours. Roads may be affected.' },
      { date: 'Apr 1', day: 'Wed', condition: 'partly-cloudy', highF: 45, lowF: 26, precipPct: 20, windMph: 9, workImpact: 'minor', note: 'Clearing but cold. Watch for ice on scaffolding.' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 54, lowF: 30, precipPct: 5, windMph: 7, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 5, city: 'Sacramento', state: 'CA',
    current: { condition: 'sunny', tempF: 68, feelsLikeF: 68, humidity: 42, windMph: 6, windDir: 'NW', uvIndex: 6 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'sunny', highF: 72, lowF: 48, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'sunny', highF: 74, lowF: 49, precipPct: 5, windMph: 5, workImpact: 'none', note: '' },
      { date: 'Mar 29', day: 'Sun', condition: 'partly-cloudy', highF: 70, lowF: 47, precipPct: 10, windMph: 8, workImpact: 'none', note: '' },
      { date: 'Mar 30', day: 'Mon', condition: 'rain', highF: 62, lowF: 46, precipPct: 65, windMph: 14, workImpact: 'minor', note: 'Rain expected by midday. Cover grading work.' },
      { date: 'Mar 31', day: 'Tue', condition: 'cloudy', highF: 64, lowF: 47, precipPct: 30, windMph: 10, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 71, lowF: 49, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 75, lowF: 50, precipPct: 5, windMph: 5, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 6, city: 'Tacoma', state: 'WA',
    current: { condition: 'cloudy', tempF: 50, feelsLikeF: 46, humidity: 76, windMph: 12, windDir: 'S', uvIndex: 2 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'cloudy', highF: 53, lowF: 41, precipPct: 35, windMph: 12, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'rain', highF: 50, lowF: 39, precipPct: 75, windMph: 18, workImpact: 'minor', note: 'Steady rain. Bridge deck work suspended.' },
      { date: 'Mar 29', day: 'Sun', condition: 'rain', highF: 48, lowF: 38, precipPct: 80, windMph: 24, workImpact: 'major', note: 'Heavy rain and high wind. Suspend all bridge operations.' },
      { date: 'Mar 30', day: 'Mon', condition: 'partly-cloudy', highF: 52, lowF: 40, precipPct: 25, windMph: 11, workImpact: 'none', note: '' },
      { date: 'Mar 31', day: 'Tue', condition: 'sunny', highF: 56, lowF: 42, precipPct: 5, windMph: 8, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 60, lowF: 44, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'partly-cloudy', highF: 58, lowF: 43, precipPct: 15, windMph: 9, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 7, city: 'Eugene', state: 'OR',
    current: { condition: 'partly-cloudy', tempF: 52, feelsLikeF: 49, humidity: 64, windMph: 9, windDir: 'SW', uvIndex: 3 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'partly-cloudy', highF: 56, lowF: 38, precipPct: 20, windMph: 9, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'rain', highF: 51, lowF: 37, precipPct: 70, windMph: 14, workImpact: 'minor', note: 'Rain from late morning. Cover foundation excavation.' },
      { date: 'Mar 29', day: 'Sun', condition: 'rain', highF: 49, lowF: 36, precipPct: 80, windMph: 18, workImpact: 'major', note: 'Heavy rain. Ground too saturated for foundation work.' },
      { date: 'Mar 30', day: 'Mon', condition: 'cloudy', highF: 52, lowF: 37, precipPct: 40, windMph: 11, workImpact: 'minor', note: 'Intermittent showers. Interior framing OK.' },
      { date: 'Mar 31', day: 'Tue', condition: 'partly-cloudy', highF: 56, lowF: 39, precipPct: 15, windMph: 8, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 61, lowF: 41, precipPct: 5, windMph: 6, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 64, lowF: 43, precipPct: 5, windMph: 5, workImpact: 'none', note: '' },
    ],
  },
  {
    projectId: 8, city: 'Redding', state: 'CA',
    current: { condition: 'sunny', tempF: 72, feelsLikeF: 72, humidity: 35, windMph: 5, windDir: 'N', uvIndex: 7 },
    forecast: [
      { date: 'Mar 27', day: 'Fri', condition: 'sunny', highF: 76, lowF: 46, precipPct: 5, windMph: 5, workImpact: 'none', note: '' },
      { date: 'Mar 28', day: 'Sat', condition: 'sunny', highF: 78, lowF: 47, precipPct: 5, windMph: 4, workImpact: 'none', note: '' },
      { date: 'Mar 29', day: 'Sun', condition: 'partly-cloudy', highF: 74, lowF: 45, precipPct: 10, windMph: 7, workImpact: 'none', note: '' },
      { date: 'Mar 30', day: 'Mon', condition: 'cloudy', highF: 68, lowF: 44, precipPct: 30, windMph: 10, workImpact: 'none', note: '' },
      { date: 'Mar 31', day: 'Tue', condition: 'partly-cloudy', highF: 71, lowF: 45, precipPct: 15, windMph: 8, workImpact: 'none', note: '' },
      { date: 'Apr 1', day: 'Wed', condition: 'sunny', highF: 77, lowF: 47, precipPct: 5, windMph: 5, workImpact: 'none', note: '' },
      { date: 'Apr 2', day: 'Thu', condition: 'sunny', highF: 80, lowF: 48, precipPct: 5, windMph: 4, workImpact: 'none', note: '' },
    ],
  },
];
export const PROJECT_ATTENTION_ITEMS: ProjectAttentionItem[] = [
  { id: 'pa-1', projectId: 1, title: 'Cutover window approaching', subtitle: 'Production migration Wave 2 starts in 3 days -- team readiness check needed', severity: 'warning', category: 'schedule' },
  { id: 'pa-2', projectId: 1, title: 'RFI-013 overdue 22 days', subtitle: 'Emergency generator placement -- blocking site work', severity: 'critical', category: 'rfi' },
  { id: 'pa-3', projectId: 2, title: 'Budget at 82%', subtitle: 'Only $54K remaining with 55% of work left', severity: 'critical', category: 'budget' },
  { id: 'pa-4', projectId: 2, title: 'RFI-002 overdue', subtitle: 'ADA compliance for common areas -- 27 days past due', severity: 'critical', category: 'rfi' },
  { id: 'pa-5', projectId: 2, title: 'SUB-011 overdue', subtitle: 'Roof membrane product data -- holding up waterproofing', severity: 'warning', category: 'submittal' },
  { id: 'pa-6', projectId: 3, title: 'Budget critical at 95%', subtitle: 'Only $45K remaining -- change request pending for $120K extension', severity: 'critical', category: 'budget' },
  { id: 'pa-7', projectId: 3, title: '14 critical UAT defects', subtitle: 'Blocking go-live sign-off -- vendor escalation in progress', severity: 'critical', category: 'quality' },
  { id: 'pa-8', projectId: 3, title: 'Project 21 days overdue', subtitle: 'Was due Feb 20 -- schedule recovery plan under review', severity: 'critical', category: 'schedule' },
  { id: 'pa-9', projectId: 4, title: 'Fire marshal inspection pending', subtitle: 'Zone B approval needed before level 3 work can start', severity: 'warning', category: 'inspection' },
  { id: 'pa-10', projectId: 6, title: 'SUB-006 overdue', subtitle: 'Bridge bearing pad samples -- 23 days past due, delaying deck work', severity: 'warning', category: 'submittal' },
  { id: 'pa-11', projectId: 7, title: 'Project overdue since Feb 14', subtitle: '13 days late -- foundation waterproofing behind schedule', severity: 'critical', category: 'schedule' },
  { id: 'pa-12', projectId: 7, title: 'Safety incident reported', subtitle: 'Worker slip during backfill compaction -- incident report filed', severity: 'warning', category: 'safety' },
  { id: 'pa-13', projectId: 8, title: 'Fire suppression upgrade pending', subtitle: 'CO-008 awaiting approval -- $31K impact to budget', severity: 'warning', category: 'change-order' },
  { id: 'pa-14', projectId: 5, title: 'Grease interceptor scope addition', subtitle: 'CO-010 pending -- new tenant requirement not in original scope', severity: 'info', category: 'change-order' },
];
export const BUDGET_HISTORY_BY_PROJECT: Record<number, BudgetHistoryPoint[]> = {
  1: [
    { month: 'Oct 2025', planned: 80000, actual: 72000, forecast: 72000 },
    { month: 'Nov 2025', planned: 160000, actual: 155000, forecast: 155000 },
    { month: 'Dec 2025', planned: 260000, actual: 278000, forecast: 278000 },
    { month: 'Jan 2026', planned: 380000, actual: 395000, forecast: 395000 },
    { month: 'Feb 2026', planned: 480000, actual: 502000, forecast: 502000 },
    { month: 'Mar 2026', planned: 580000, actual: 544000, forecast: 590000 },
    { month: 'Apr 2026', planned: 680000, actual: 0, forecast: 695000 },
    { month: 'May 2026', planned: 800000, actual: 0, forecast: 820000 },
  ],
  2: [
    { month: 'Nov 2025', planned: 30000, actual: 28000, forecast: 28000 },
    { month: 'Dec 2025', planned: 75000, actual: 82000, forecast: 82000 },
    { month: 'Jan 2026', planned: 130000, actual: 148000, forecast: 148000 },
    { month: 'Feb 2026', planned: 200000, actual: 218000, forecast: 218000 },
    { month: 'Mar 2026', planned: 250000, actual: 246000, forecast: 275000 },
    { month: 'Apr 2026', planned: 300000, actual: 0, forecast: 320000 },
  ],
  3: [
    { month: 'Aug 2025', planned: 90000, actual: 95000, forecast: 95000 },
    { month: 'Sep 2025', planned: 200000, actual: 215000, forecast: 215000 },
    { month: 'Oct 2025', planned: 330000, actual: 360000, forecast: 360000 },
    { month: 'Nov 2025', planned: 470000, actual: 520000, forecast: 520000 },
    { month: 'Dec 2025', planned: 600000, actual: 655000, forecast: 655000 },
    { month: 'Jan 2026', planned: 720000, actual: 780000, forecast: 780000 },
    { month: 'Feb 2026', planned: 830000, actual: 855000, forecast: 900000 },
    { month: 'Mar 2026', planned: 900000, actual: 0, forecast: 960000 },
  ],
  4: [
    { month: 'Jan 2026', planned: 40000, actual: 35000, forecast: 35000 },
    { month: 'Feb 2026', planned: 100000, actual: 95000, forecast: 95000 },
    { month: 'Mar 2026', planned: 170000, actual: 150000, forecast: 165000 },
    { month: 'Apr 2026', planned: 260000, actual: 0, forecast: 250000 },
    { month: 'May 2026', planned: 360000, actual: 0, forecast: 355000 },
    { month: 'Jun 2026', planned: 500000, actual: 0, forecast: 490000 },
  ],
  5: [
    { month: 'Feb 2026', planned: 10000, actual: 8000, forecast: 8000 },
    { month: 'Mar 2026', planned: 30000, actual: 24000, forecast: 28000 },
    { month: 'Apr 2026', planned: 70000, actual: 0, forecast: 65000 },
    { month: 'May 2026', planned: 130000, actual: 0, forecast: 125000 },
    { month: 'Jun 2026', planned: 200000, actual: 0, forecast: 195000 },
    { month: 'Jul 2026', planned: 280000, actual: 0, forecast: 275000 },
    { month: 'Aug 2026', planned: 350000, actual: 0, forecast: 350000 },
  ],
  6: [
    { month: 'Sep 2025', planned: 15000, actual: 14000, forecast: 14000 },
    { month: 'Oct 2025', planned: 35000, actual: 32000, forecast: 32000 },
    { month: 'Nov 2025', planned: 55000, actual: 52000, forecast: 52000 },
    { month: 'Dec 2025', planned: 75000, actual: 70000, forecast: 70000 },
    { month: 'Jan 2026', planned: 95000, actual: 88000, forecast: 88000 },
    { month: 'Feb 2026', planned: 120000, actual: 108000, forecast: 115000 },
    { month: 'Mar 2026', planned: 150000, actual: 0, forecast: 142000 },
  ],
  7: [
    { month: 'Oct 2025', planned: 20000, actual: 18000, forecast: 18000 },
    { month: 'Nov 2025', planned: 45000, actual: 42000, forecast: 42000 },
    { month: 'Dec 2025', planned: 75000, actual: 78000, forecast: 78000 },
    { month: 'Jan 2026', planned: 110000, actual: 105000, forecast: 105000 },
    { month: 'Feb 2026', planned: 150000, actual: 110000, forecast: 130000 },
    { month: 'Mar 2026', planned: 200000, actual: 0, forecast: 155000 },
  ],
  8: [
    { month: 'Jan 2026', planned: 30000, actual: 25000, forecast: 25000 },
    { month: 'Feb 2026', planned: 65000, actual: 60000, forecast: 60000 },
    { month: 'Mar 2026', planned: 110000, actual: 90000, forecast: 105000 },
    { month: 'Apr 2026', planned: 170000, actual: 0, forecast: 165000 },
    { month: 'May 2026', planned: 260000, actual: 0, forecast: 255000 },
    { month: 'Jun 2026', planned: 360000, actual: 0, forecast: 355000 },
    { month: 'Jul 2026', planned: 450000, actual: 0, forecast: 450000 },
    { month: 'Aug 2026', planned: 500000, actual: 0, forecast: 500000 },
  ],
};
export const INSPECTIONS: Inspection[] = [
  { id: 'INS-001', projectId: 1, project: 'Riverside Office Complex', type: 'Structural framing', date: 'Mar 24, 2026', inspector: 'City Building Dept', result: 'pass', notes: 'All connections and welds per approved shop drawings', followUp: '' },
  { id: 'INS-002', projectId: 1, project: 'Riverside Office Complex', type: 'Fire stopping', date: 'Mar 20, 2026', inspector: 'Fire Marshal', result: 'conditional', notes: 'Three penetrations in stair shaft need UL-listed assembly', followUp: 'Corrections due by Mar 28' },
  { id: 'INS-003', projectId: 3, project: 'Downtown Transit Hub', type: 'Concrete strength test', date: 'Mar 22, 2026', inspector: 'Materials Testing Lab', result: 'pass', notes: '28-day break test: 4,850 psi (spec: 4,000 psi)', followUp: '' },
  { id: 'INS-004', projectId: 3, project: 'Downtown Transit Hub', type: 'ADA accessibility', date: 'Mar 18, 2026', inspector: 'Accessibility Consultant', result: 'fail', notes: 'Platform ramp grade at 8.8% exceeds 8.33% max. Two handrail extensions short.', followUp: 'Ramp regrading required before re-inspection' },
  { id: 'INS-005', projectId: 4, project: 'Lakeside Medical Center', type: 'Underground plumbing', date: 'Mar 25, 2026', inspector: 'City Building Dept', result: 'pass', notes: 'Pressure test passed at 150 PSI for 2 hours, zero drop', followUp: '' },
  { id: 'INS-006', projectId: 4, project: 'Lakeside Medical Center', type: 'Fire alarm zone B', date: 'Mar 21, 2026', inspector: 'Fire Marshal', result: 'pending', notes: 'Inspection scheduled. Awaiting fire marshal availability.', followUp: 'Tentatively scheduled Mar 28' },
  { id: 'INS-007', projectId: 6, project: 'Metro Bridge Rehabilitation', type: 'Deck core sampling', date: 'Mar 23, 2026', inspector: 'Structural Engineering Firm', result: 'pass', notes: 'Core strengths adequate for overlay. No delamination detected.', followUp: '' },
  { id: 'INS-008', projectId: 7, project: 'Sunset Ridge Apartments', type: 'Soil compaction', date: 'Mar 25, 2026', inspector: 'Geotechnical Lab', result: 'conditional', notes: 'First test 88% compaction (spec: 95%). Re-compacted and passed at 96%.', followUp: 'Re-test documented and approved' },
  { id: 'INS-009', projectId: 8, project: 'Industrial Park Warehouse', type: 'Slab subgrade', date: 'Mar 26, 2026', inspector: 'Geotechnical Lab', result: 'pass', notes: 'Proctor test 97% compaction. Vapor barrier installed per spec.', followUp: '' },
  { id: 'INS-010', projectId: 2, project: 'Harbor View Condominiums', type: 'Rough electrical', date: 'Mar 19, 2026', inspector: 'City Building Dept', result: 'pass', notes: 'All circuits tested, GFCI placement verified, panel schedules match', followUp: '' },
  { id: 'INS-011', projectId: 5, project: 'Westfield Shopping Center', type: 'Erosion control', date: 'Mar 24, 2026', inspector: 'Environmental Compliance', result: 'pass', notes: 'Silt fencing and inlet protection installed per SWPPP. No deficiencies.', followUp: '' },
  { id: 'INS-012', projectId: 5, project: 'Westfield Shopping Center', type: 'Demolition clearance', date: 'Mar 20, 2026', inspector: 'City Building Dept', result: 'conditional', notes: 'Existing utility stub-outs must be capped before additional demo proceeds', followUp: 'Capping due by Mar 28' },
  { id: 'INS-013', projectId: 7, project: 'Sunset Ridge Apartments', type: 'Foundation rebar', date: 'Mar 22, 2026', inspector: 'City Building Dept', result: 'pass', notes: 'Rebar placement per structural drawings. Chairs and clearances acceptable.', followUp: '' },
  { id: 'INS-014', projectId: 8, project: 'Industrial Park Warehouse', type: 'Underground fire line', date: 'Mar 21, 2026', inspector: 'Fire Marshal', result: 'pass', notes: 'Hydrostatic test passed. Backfill approved.', followUp: '' },
  { id: 'INS-015', projectId: 2, project: 'Harbor View Condominiums', type: 'Sheathing & WRB', date: 'Mar 24, 2026', inspector: 'Third-party inspector', result: 'conditional', notes: 'WRB tape seams at 3 window openings need additional overlap', followUp: 'Corrections required before window install' },
];
export const PUNCH_LIST_ITEMS: PunchListItem[] = [
  { id: 'PL-001', projectId: 1, project: 'Riverside Office Complex', location: 'Level 2 - East Wing', description: 'Ceiling grid misaligned at column C-4', assignee: 'Pacific Drywall', status: 'open', priority: 'medium', createdDate: 'Mar 24, 2026' },
  { id: 'PL-002', projectId: 1, project: 'Riverside Office Complex', location: 'Level 1 - Lobby', description: 'Floor tile grout color does not match approved sample', assignee: 'Metro Paving', status: 'open', priority: 'high', createdDate: 'Mar 22, 2026' },
  { id: 'PL-003', projectId: 1, project: 'Riverside Office Complex', location: 'Roof', description: 'HVAC condensate drain not sloped to roof drain', assignee: 'Summit HVAC', status: 'in-progress', priority: 'high', createdDate: 'Mar 20, 2026' },
  { id: 'PL-004', projectId: 6, project: 'Metro Bridge Rehabilitation', location: 'Span 2 - Bearing', description: 'Bearing pad shimming incomplete at south abutment', assignee: 'Foundation Specialists', status: 'in-progress', priority: 'high', createdDate: 'Mar 18, 2026' },
  { id: 'PL-005', projectId: 6, project: 'Metro Bridge Rehabilitation', location: 'Deck surface', description: 'Expansion joint seal has 3mm gap exceeding tolerance', assignee: 'Atlas Roofing Co', status: 'open', priority: 'medium', createdDate: 'Mar 23, 2026' },
  { id: 'PL-006', projectId: 3, project: 'Downtown Transit Hub', location: 'Concourse A', description: 'Paint touch-up needed on 6 column wraps', assignee: 'Pacific Drywall', status: 'completed', priority: 'low', createdDate: 'Mar 10, 2026' },
  { id: 'PL-007', projectId: 3, project: 'Downtown Transit Hub', location: 'Platform 1', description: 'Tactile warning strip adhesion failing in two locations', assignee: 'Metro Paving', status: 'open', priority: 'high', createdDate: 'Mar 22, 2026' },
  { id: 'PL-008', projectId: 2, project: 'Harbor View Condominiums', location: 'Building A - Unit 305', description: 'Cabinet door alignment off by 3mm on upper run', assignee: 'Pacific Drywall', status: 'open', priority: 'medium', createdDate: 'Mar 20, 2026' },
  { id: 'PL-009', projectId: 2, project: 'Harbor View Condominiums', location: 'Building B - Exterior', description: 'Siding lap joint gap at NE corner exceeds spec', assignee: 'Atlas Roofing Co', status: 'in-progress', priority: 'high', createdDate: 'Mar 18, 2026' },
  { id: 'PL-010', projectId: 4, project: 'Lakeside Medical Center', location: 'Level 1 - Corridor B', description: 'Fire-rated wall penetration unsealed at conduit pass-through', assignee: 'Meridian Electric', status: 'open', priority: 'high', createdDate: 'Mar 24, 2026' },
  { id: 'PL-011', projectId: 4, project: 'Lakeside Medical Center', location: 'Level 2 - Exam Room 204', description: 'Medical gas outlet installed at wrong height', assignee: 'Cascade Plumbing', status: 'open', priority: 'medium', createdDate: 'Mar 25, 2026' },
  { id: 'PL-012', projectId: 5, project: 'Westfield Shopping Center', location: 'Lot B - Grading', description: 'Storm drain inlet elevation 2 inches high per survey check', assignee: 'Metro Paving', status: 'open', priority: 'medium', createdDate: 'Mar 26, 2026' },
  { id: 'PL-013', projectId: 7, project: 'Sunset Ridge Apartments', location: 'Building A - Foundation', description: 'Waterproofing membrane tear at footing corner', assignee: 'Foundation Specialists', status: 'in-progress', priority: 'high', createdDate: 'Mar 24, 2026' },
  { id: 'PL-014', projectId: 7, project: 'Sunset Ridge Apartments', location: 'Site - East Retaining Wall', description: 'Drain tile outlet not connected to storm system', assignee: 'Cascade Plumbing', status: 'open', priority: 'medium', createdDate: 'Mar 23, 2026' },
  { id: 'PL-015', projectId: 8, project: 'Industrial Park Warehouse', location: 'Zone 2 - Slab', description: 'Vapor barrier puncture at column base plate', assignee: 'Foundation Specialists', status: 'completed', priority: 'high', createdDate: 'Mar 25, 2026' },
  { id: 'PL-016', projectId: 8, project: 'Industrial Park Warehouse', location: 'Overhead Door 3', description: 'Door frame anchor bolt spacing out of tolerance', assignee: 'Summit HVAC', status: 'open', priority: 'medium', createdDate: 'Mar 26, 2026' },
];
export const CATEGORY_COLORS: Record<JobCostCategory, string> = {
  Labor: 'bg-primary',
  Materials: 'bg-success',
  Equipment: 'bg-warning',
  Subcontractors: 'bg-secondary',
  Overhead: 'bg-foreground-40',
};
