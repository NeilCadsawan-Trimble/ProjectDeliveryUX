import type {
  ActivityItem,
  BillingEvent,
  BillingSchedule,
  BudgetHistoryPoint,
  CalendarAppointment,
  CashFlowEntry,
  CashPosition,
  ChangeOrder,
  Contract,
  DailyReport,
  Estimate,
  GLAccount,
  GLEntry,
  Inspection,
  Invoice,
  JobCostCategory,
  Payable,
  PayrollRecord,
  Project,
  ProjectAttentionItem,
  ProjectRevenue,
  ProjectWeather,
  PunchListItem,
  PurchaseOrder,
  SubcontractLedgerEntry,
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
  // --- Jan 2026 (historical) ---
  { id: 'EST-2026-035', project: 'Downtown Transit Hub Platform Extension', client: 'GlobalTech Ltd', type: 'Fixed Price', value: '$480,000', valueRaw: 480000, status: 'Approved', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Jan 8, 2026', daysLeft: -78 },
  { id: 'EST-2026-036', project: 'Bridge Deck Protective Coating', client: 'CoreSystems Inc', type: 'T&M', value: '$125,000', valueRaw: 125000, status: 'Approved', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Jan 15, 2026', daysLeft: -71 },
  { id: 'EST-2026-037', project: 'Warehouse Cold Storage Addition', client: 'DataDrive AI', type: 'Milestone', value: '$310,000', valueRaw: 310000, status: 'Approved', requestedBy: 'Tom Evans', requestedByInitials: 'TE', dueDate: 'Jan 22, 2026', daysLeft: -64 },
  { id: 'EST-2026-038', project: 'Medical Center Emergency Generator', client: 'NexGen Analytics', type: 'Fixed Price', value: '$195,000', valueRaw: 195000, status: 'Approved', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Jan 28, 2026', daysLeft: -58 },
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
  // --- Jun 2026 ---
  { id: 'EST-2026-061', project: 'Transit Hub Signage Package', client: 'GlobalTech Ltd', type: 'Fixed Price', value: '$165,000', valueRaw: 165000, status: 'Draft', requestedBy: 'Priya Nair', requestedByInitials: 'PN', dueDate: 'Jun 5, 2026', daysLeft: 70 },
  { id: 'EST-2026-062', project: 'Condo Amenity Pool & Deck', client: 'Apex Corp', type: 'Milestone', value: '$380,000', valueRaw: 380000, status: 'Draft', requestedBy: 'James Carter', requestedByInitials: 'JC', dueDate: 'Jun 12, 2026', daysLeft: 77 },
  { id: 'EST-2026-063', project: 'Office Complex Furniture Procurement', client: 'Trimble Internal', type: 'Fixed Price', value: '$210,000', valueRaw: 210000, status: 'Draft', requestedBy: 'Sarah Chen', requestedByInitials: 'SC', dueDate: 'Jun 18, 2026', daysLeft: 83 },
  { id: 'EST-2026-064', project: 'Bridge Deck Expansion Joint Replacement', client: 'CoreSystems Inc', type: 'T&M', value: '$92,000', valueRaw: 92000, status: 'Draft', requestedBy: 'Mike Osei', requestedByInitials: 'MO', dueDate: 'Jun 25, 2026', daysLeft: 90 },
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
export const RFIS_SEED: Rfi[] = [
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

export const SUBMITTALS_SEED: Submittal[] = [
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
  { id: 1, title: 'Morning Huddle', date: new Date(2026, 2, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 2, title: 'Weekly Progress Review', date: new Date(2026, 2, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 3, title: 'Client Call — Acme Corp', date: new Date(2026, 2, 2), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 4, title: 'Morning Huddle', date: new Date(2026, 2, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 5, title: 'Transit Hub Budget Review', date: new Date(2026, 2, 3), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review', projectSlug: 'downtown-transit-hub' },
  { id: 6, title: 'Focus: Progress Reports', date: new Date(2026, 2, 3), startHour: 14, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 7, title: 'Morning Huddle', date: new Date(2026, 2, 4), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 8, title: 'Safety Coordination Meeting', date: new Date(2026, 2, 4), startHour: 13, startMin: 0, endHour: 14, endMin: 30, type: 'meeting' },
  { id: 9, title: 'Morning Huddle', date: new Date(2026, 2, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 10, title: 'Riverside Office Sync', date: new Date(2026, 2, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review', projectSlug: 'riverside-office-complex' },
  { id: 11, title: 'Client Call — VistaCon', date: new Date(2026, 2, 5), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 12, title: 'Focus: Submittal Reviews', date: new Date(2026, 2, 5), startHour: 15, startMin: 0, endHour: 17, endMin: 0, type: 'focus' },
  { id: 13, title: 'Weekly Schedule Planning', date: new Date(2026, 2, 6), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 14, title: 'Drawing Review Session', date: new Date(2026, 2, 6), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 15, title: 'EST-2026-044 Deadline', date: new Date(2026, 2, 6), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Mar 9
  { id: 16, title: 'Morning Huddle', date: new Date(2026, 2, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 17, title: 'Project Kickoff — Phase 2', date: new Date(2026, 2, 9), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 18, title: 'Structural Design Review', date: new Date(2026, 2, 9), startHour: 15, startMin: 0, endHour: 16, endMin: 0, type: 'review' },
  { id: 19, title: 'All Hands Meeting', date: new Date(2026, 2, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 20, title: 'Harbor View Check-in', date: new Date(2026, 2, 10), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call', projectSlug: 'harbor-view-condominiums' },
  { id: 21, title: 'Morning Huddle', date: new Date(2026, 2, 11), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 22, title: 'Vendor Demo — Concrete Supplier', date: new Date(2026, 2, 11), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 23, title: 'Focus: Sunset Ridge Landscaping', date: new Date(2026, 2, 11), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 24, title: 'Morning Huddle', date: new Date(2026, 2, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 25, title: 'Bridge Rehabilitation Review', date: new Date(2026, 2, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review', projectSlug: 'metro-bridge-rehabilitation' },
  { id: 26, title: 'EST-2026-051 Deadline', date: new Date(2026, 2, 12), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 27, title: 'Morning Huddle', date: new Date(2026, 2, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 28, title: 'Progress Walkthrough', date: new Date(2026, 2, 13), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  // Week of Mar 16
  { id: 29, title: 'Weekly Lessons Learned', date: new Date(2026, 2, 16), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 30, title: 'Client Call — BuildRight', date: new Date(2026, 2, 16), startHour: 13, startMin: 0, endHour: 13, endMin: 30, type: 'call' },
  { id: 31, title: 'Focus: RFI Responses', date: new Date(2026, 2, 16), startHour: 14, startMin: 0, endHour: 16, endMin: 30, type: 'focus' },
  { id: 32, title: 'Morning Huddle', date: new Date(2026, 2, 17), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 33, title: 'Site Excavation Planning', date: new Date(2026, 2, 17), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 34, title: 'Contractor Sync — Jones & Co', date: new Date(2026, 2, 17), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 35, title: 'Morning Huddle', date: new Date(2026, 2, 18), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 36, title: 'Structural Review', date: new Date(2026, 2, 18), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 37, title: 'Focus: Cost Estimating', date: new Date(2026, 2, 18), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 38, title: 'Morning Huddle', date: new Date(2026, 2, 19), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 39, title: 'Quarterly Review Prep', date: new Date(2026, 2, 19), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 40, title: 'Client Call — Metro Transit', date: new Date(2026, 2, 19), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 41, title: 'Weekly Schedule Planning', date: new Date(2026, 2, 20), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 42, title: 'RFI-2026-018 Deadline', date: new Date(2026, 2, 20), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Mar 23 (current week based on today Mar 20)
  { id: 43, title: 'Morning Huddle', date: new Date(2026, 2, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 44, title: 'Quarterly Business Review', date: new Date(2026, 2, 23), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 45, title: 'Focus: Permit Applications', date: new Date(2026, 2, 23), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 46, title: 'Morning Huddle', date: new Date(2026, 2, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 47, title: 'Riverside Office Go/No-Go', date: new Date(2026, 2, 24), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting', projectSlug: 'riverside-office-complex' },
  { id: 48, title: 'Client Call — SkyBridge', date: new Date(2026, 2, 24), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 49, title: 'Morning Huddle', date: new Date(2026, 2, 25), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 50, title: 'Inspection Walkthrough', date: new Date(2026, 2, 25), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 51, title: 'Focus: Punch List Items', date: new Date(2026, 2, 25), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 52, title: 'Morning Huddle', date: new Date(2026, 2, 26), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 53, title: 'Substantial Completion Review', date: new Date(2026, 2, 26), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 54, title: 'EST-2026-058 Deadline', date: new Date(2026, 2, 26), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 55, title: 'Owner Walkthrough', date: new Date(2026, 2, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 56, title: 'Team Lunch', date: new Date(2026, 2, 27), startHour: 12, startMin: 0, endHour: 13, endMin: 0, type: 'meeting' },
  // Week of Mar 30
  { id: 57, title: 'Morning Huddle', date: new Date(2026, 2, 30), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 58, title: 'Month-End Budget Closeout', date: new Date(2026, 2, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 59, title: 'Focus: Change Order Reviews', date: new Date(2026, 2, 30), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 60, title: 'Morning Huddle', date: new Date(2026, 2, 31), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 61, title: 'Q1 Wrap-Up Meeting', date: new Date(2026, 2, 31), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 62, title: 'Contractor Call — Apex', date: new Date(2026, 2, 31), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 63, title: 'Q1 Reports Deadline', date: new Date(2026, 2, 31), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },

  // ─── April 2026 ───
  // Week of Apr 1
  { id: 64, title: 'Q2 Kickoff', date: new Date(2026, 3, 1), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 65, title: 'Portfolio Review', date: new Date(2026, 3, 1), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 66, title: 'Client Call — GreenField', date: new Date(2026, 3, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 67, title: 'Morning Huddle', date: new Date(2026, 3, 2), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 68, title: 'New Hire Onboarding', date: new Date(2026, 3, 2), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 69, title: 'Focus: Equipment Mobilization Plan', date: new Date(2026, 3, 2), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 70, title: 'Morning Huddle', date: new Date(2026, 3, 3), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 71, title: 'Submittal Review — Structural', date: new Date(2026, 3, 3), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 72, title: 'EST-2026-062 Deadline', date: new Date(2026, 3, 3), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 6
  { id: 73, title: 'Morning Huddle', date: new Date(2026, 3, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 74, title: 'Look-Ahead Planning', date: new Date(2026, 3, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 75, title: 'Focus: Formwork Layout', date: new Date(2026, 3, 6), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 76, title: 'Morning Huddle', date: new Date(2026, 3, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 77, title: 'Vendor Call — Crane Services', date: new Date(2026, 3, 7), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'call' },
  { id: 78, title: 'Safety Compliance Review', date: new Date(2026, 3, 7), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 79, title: 'Morning Huddle', date: new Date(2026, 3, 8), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 80, title: 'Cross-Trade Sync', date: new Date(2026, 3, 8), startHour: 10, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 81, title: 'Client Call — NovaBuild', date: new Date(2026, 3, 8), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 82, title: 'Morning Huddle', date: new Date(2026, 3, 9), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 83, title: 'Budget Forecast Meeting', date: new Date(2026, 3, 9), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 84, title: 'Focus: Material Procurement Tracking', date: new Date(2026, 3, 9), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 85, title: 'Project Progress Presentation', date: new Date(2026, 3, 10), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 86, title: 'RFI-2026-023 Deadline', date: new Date(2026, 3, 10), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 13
  { id: 87, title: 'Lessons Learned Session', date: new Date(2026, 3, 13), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 88, title: 'Permit Submission Review', date: new Date(2026, 3, 13), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 89, title: 'Focus: Concrete Testing Coordination', date: new Date(2026, 3, 13), startHour: 13, startMin: 30, endHour: 16, endMin: 0, type: 'focus' },
  { id: 90, title: 'Morning Huddle', date: new Date(2026, 3, 14), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 91, title: 'Stakeholder Presentation', date: new Date(2026, 3, 14), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 92, title: 'Client Call — UrbanGrid', date: new Date(2026, 3, 14), startHour: 14, startMin: 30, endHour: 15, endMin: 0, type: 'call' },
  { id: 93, title: 'Morning Huddle', date: new Date(2026, 3, 15), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 94, title: 'Mid-Week Progress Check', date: new Date(2026, 3, 15), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 95, title: 'Focus: MEP Coordination', date: new Date(2026, 3, 15), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 96, title: 'Morning Huddle', date: new Date(2026, 3, 16), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 97, title: 'Drawing Review — Electrical', date: new Date(2026, 3, 16), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 98, title: 'Contractor Sync — BuildCo', date: new Date(2026, 3, 16), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 99, title: 'Look-Ahead Planning', date: new Date(2026, 3, 17), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 100, title: 'EST-2026-070 Deadline', date: new Date(2026, 3, 17), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of Apr 20
  { id: 101, title: 'Morning Huddle', date: new Date(2026, 3, 20), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 102, title: 'Phase Transition Cutover', date: new Date(2026, 3, 20), startHour: 10, startMin: 0, endHour: 12, endMin: 0, type: 'meeting' },
  { id: 103, title: 'Focus: Site Monitoring Setup', date: new Date(2026, 3, 20), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 104, title: 'Morning Huddle', date: new Date(2026, 3, 21), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 105, title: 'Post-Mobilization Validation', date: new Date(2026, 3, 21), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 106, title: 'Client Call — Trimble Field', date: new Date(2026, 3, 21), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 107, title: 'Morning Huddle', date: new Date(2026, 3, 22), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 108, title: 'Risk Assessment Workshop', date: new Date(2026, 3, 22), startHour: 10, startMin: 30, endHour: 12, endMin: 0, type: 'review' },
  { id: 109, title: 'Focus: As-Built Drawing Updates', date: new Date(2026, 3, 22), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 110, title: 'Morning Huddle', date: new Date(2026, 3, 23), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 111, title: 'Project Progress Presentation', date: new Date(2026, 3, 23), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 112, title: 'Morning Huddle', date: new Date(2026, 3, 24), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 113, title: 'Team Building Activity', date: new Date(2026, 3, 24), startHour: 15, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
  // Week of Apr 27
  { id: 114, title: 'Morning Huddle', date: new Date(2026, 3, 27), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 115, title: 'Lessons Learned Session', date: new Date(2026, 3, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 116, title: 'Client Call — Meridian', date: new Date(2026, 3, 27), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 117, title: 'Morning Huddle', date: new Date(2026, 3, 28), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 118, title: 'Crew Capacity Planning', date: new Date(2026, 3, 28), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 119, title: 'Focus: Site Layout Reconfiguration', date: new Date(2026, 3, 28), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 120, title: 'Morning Huddle', date: new Date(2026, 3, 29), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 121, title: 'Submittal Review — MEP', date: new Date(2026, 3, 29), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 122, title: 'April Budget Closeout', date: new Date(2026, 3, 30), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 123, title: 'April Reports Deadline', date: new Date(2026, 3, 30), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },

  // ─── May 2026 ───
  // Week of May 1
  { id: 124, title: 'Morning Huddle', date: new Date(2026, 4, 1), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 125, title: 'May Planning Session', date: new Date(2026, 4, 1), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 126, title: 'Client Call — Pacific Rail', date: new Date(2026, 4, 1), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  // Week of May 4
  { id: 127, title: 'Look-Ahead Planning', date: new Date(2026, 4, 4), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  { id: 128, title: 'Focus: Foundation Pour Prep', date: new Date(2026, 4, 4), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 129, title: 'Morning Huddle', date: new Date(2026, 4, 5), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 130, title: 'Design Review — Facade', date: new Date(2026, 4, 5), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 131, title: 'Vendor Call — Survey Instruments', date: new Date(2026, 4, 5), startHour: 14, startMin: 30, endHour: 15, endMin: 0, type: 'call' },
  { id: 132, title: 'Morning Huddle', date: new Date(2026, 4, 6), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 133, title: 'Cross-Trade Coordination Meeting', date: new Date(2026, 4, 6), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'meeting' },
  { id: 134, title: 'Focus: Load-Bearing Tests', date: new Date(2026, 4, 6), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 135, title: 'Morning Huddle', date: new Date(2026, 4, 7), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 136, title: 'RFI Response Review', date: new Date(2026, 4, 7), startHour: 10, startMin: 30, endHour: 11, endMin: 30, type: 'review' },
  { id: 137, title: 'EST-2026-078 Deadline', date: new Date(2026, 4, 7), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 138, title: 'Project Progress Presentation', date: new Date(2026, 4, 8), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 139, title: 'Team Happy Hour', date: new Date(2026, 4, 8), startHour: 16, startMin: 0, endHour: 17, endMin: 0, type: 'meeting' },
  // Week of May 11
  { id: 140, title: 'Lessons Learned Session', date: new Date(2026, 4, 11), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 141, title: 'Client Call — Summit Eng', date: new Date(2026, 4, 11), startHour: 13, startMin: 0, endHour: 13, endMin: 30, type: 'call' },
  { id: 142, title: 'Focus: Safety Plan Updates', date: new Date(2026, 4, 11), startHour: 14, startMin: 0, endHour: 16, endMin: 30, type: 'focus' },
  { id: 143, title: 'Morning Huddle', date: new Date(2026, 4, 12), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 144, title: 'Compliance Audit Prep', date: new Date(2026, 4, 12), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'review' },
  { id: 145, title: 'Contractor Sync — Apex Builders', date: new Date(2026, 4, 12), startHour: 15, startMin: 0, endHour: 15, endMin: 30, type: 'call' },
  { id: 146, title: 'Morning Huddle', date: new Date(2026, 4, 13), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 147, title: 'Drawing Review — HVAC', date: new Date(2026, 4, 13), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 148, title: 'Focus: Spec Sheet Updates', date: new Date(2026, 4, 13), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 149, title: 'Morning Huddle', date: new Date(2026, 4, 14), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 150, title: 'Stakeholder Check-in', date: new Date(2026, 4, 14), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'call' },
  { id: 151, title: 'RFI-2026-031 Deadline', date: new Date(2026, 4, 14), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  { id: 152, title: 'Look-Ahead Planning', date: new Date(2026, 4, 15), startHour: 9, startMin: 0, endHour: 10, endMin: 30, type: 'meeting' },
  // Week of May 18
  { id: 153, title: 'Morning Huddle', date: new Date(2026, 4, 18), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 154, title: 'Phase Handoff Planning', date: new Date(2026, 4, 18), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 155, title: 'Focus: Crane Operation Scheduling', date: new Date(2026, 4, 18), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 156, title: 'Morning Huddle', date: new Date(2026, 4, 19), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 157, title: 'Vendor Demo — FieldSync', date: new Date(2026, 4, 19), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'call' },
  { id: 158, title: 'Budget Variance Review', date: new Date(2026, 4, 19), startHour: 14, startMin: 0, endHour: 15, endMin: 0, type: 'review' },
  { id: 159, title: 'Morning Huddle', date: new Date(2026, 4, 20), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 160, title: 'Mid-Week Progress Check', date: new Date(2026, 4, 20), startHour: 11, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 161, title: 'Focus: Systems Commissioning', date: new Date(2026, 4, 20), startHour: 13, startMin: 0, endHour: 16, endMin: 0, type: 'focus' },
  { id: 162, title: 'Morning Huddle', date: new Date(2026, 4, 21), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 163, title: 'Client Call — Coastal Dev', date: new Date(2026, 4, 21), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 164, title: 'Project Progress Presentation', date: new Date(2026, 4, 22), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 165, title: 'EST-2026-085 Deadline', date: new Date(2026, 4, 22), startHour: 17, startMin: 0, endHour: 17, endMin: 30, type: 'deadline' },
  // Week of May 25
  { id: 166, title: 'Lessons Learned Session', date: new Date(2026, 4, 26), startHour: 9, startMin: 30, endHour: 10, endMin: 30, type: 'review' },
  { id: 167, title: 'Equipment Capacity Review', date: new Date(2026, 4, 26), startHour: 11, startMin: 0, endHour: 12, endMin: 0, type: 'review' },
  { id: 168, title: 'Focus: Schedule Compression', date: new Date(2026, 4, 26), startHour: 13, startMin: 0, endHour: 15, endMin: 30, type: 'focus' },
  { id: 169, title: 'Morning Huddle', date: new Date(2026, 4, 27), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 170, title: 'Q2 Mid-Quarter Review', date: new Date(2026, 4, 27), startHour: 10, startMin: 0, endHour: 11, endMin: 30, type: 'meeting' },
  { id: 171, title: 'Client Call — Ridgeline', date: new Date(2026, 4, 27), startHour: 14, startMin: 0, endHour: 14, endMin: 30, type: 'call' },
  { id: 172, title: 'Morning Huddle', date: new Date(2026, 4, 28), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
  { id: 173, title: 'Submittal Review — Plumbing', date: new Date(2026, 4, 28), startHour: 10, startMin: 0, endHour: 11, endMin: 0, type: 'review' },
  { id: 174, title: 'Focus: Field Reporting Setup', date: new Date(2026, 4, 28), startHour: 13, startMin: 0, endHour: 15, endMin: 0, type: 'focus' },
  { id: 175, title: 'Morning Huddle', date: new Date(2026, 4, 29), startHour: 9, startMin: 0, endHour: 9, endMin: 30, type: 'meeting' },
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
  // --- Apr 2026 ---
  { id: 'CO-039', project: 'Riverside Office Complex', projectId: 1, coType: 'prime', description: 'Add rooftop terrace amenity deck', amount: 72000, status: 'approved', requestedBy: 'Sarah Chen', requestDate: 'Apr 3, 2026', reason: 'Owner adding tenant amenity rooftop space', contractNumber: 'C-2026-001' },
  { id: 'CO-040', project: 'Harbor View Condominiums', projectId: 2, coType: 'prime', description: 'Upgraded lobby finishes to marble', amount: 44000, status: 'approved', requestedBy: 'James Carter', requestDate: 'Apr 8, 2026', reason: 'Marketing requires premium lobby for sales center opening', contractNumber: 'C-2026-002' },
  { id: 'CO-041', project: 'Lakeside Medical Center', projectId: 4, coType: 'potential', description: 'Accelerate surgical wing schedule by 2 weeks', amount: 38000, status: 'approved', requestedBy: 'Tom Evans', requestDate: 'Apr 10, 2026', reason: 'Hospital needs early occupancy for equipment installation' },
  { id: 'SCO-015', project: 'Downtown Transit Hub', projectId: 3, coType: 'subcontract', description: 'Platform edge tactile paving addition', amount: 22500, status: 'approved', requestedBy: 'Priya Nair', requestDate: 'Apr 5, 2026', reason: 'Transit authority added tactile warning strip requirement', subcontractor: 'BridgeTech Concrete', costCode: '03-3000' },
  { id: 'SCO-016', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'subcontract', description: 'EV charging rough-in for 24 parking stalls', amount: 31000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Apr 12, 2026', reason: 'Local code update requires EV-ready parking', subcontractor: 'Apex Electrical Inc.', costCode: '26-2700' },
  { id: 'CO-042', project: 'Metro Bridge Rehabilitation', projectId: 6, coType: 'prime', description: 'Decorative railing upgrade per historic commission', amount: 56000, status: 'pending', requestedBy: 'Mike Osei', requestDate: 'Apr 15, 2026', reason: 'Historic preservation board requires ornamental railing', contractNumber: 'C-2026-006' },
  // --- May 2026 ---
  { id: 'CO-043', project: 'Westfield Shopping Center', projectId: 5, coType: 'prime', description: 'Add second food court entrance from parking', amount: 67000, status: 'approved', requestedBy: 'Lena Brooks', requestDate: 'May 2, 2026', reason: 'Tenant mix change requires additional entrance for food court access', contractNumber: 'C-2026-005' },
  { id: 'CO-044', project: 'Industrial Park Warehouse', projectId: 8, coType: 'potential', description: 'Revised foundation for increased floor load rating', amount: 29000, status: 'approved', requestedBy: 'Priya Nair', requestDate: 'May 6, 2026', reason: 'New tenant requires 500 PSF floor load vs original 250 PSF' },
  { id: 'SCO-017', project: 'Riverside Office Complex', projectId: 1, coType: 'subcontract', description: 'Data center cooling redundancy addition', amount: 48000, status: 'approved', requestedBy: 'Tom Evans', requestDate: 'May 5, 2026', reason: 'Anchor tenant requires N+1 cooling for server room', subcontractor: 'CoolAir Mechanical', costCode: '23-8100' },
  { id: 'SCO-018', project: 'Harbor View Condominiums', projectId: 2, coType: 'subcontract', description: 'Balcony waterproofing membrane replacement', amount: 19500, status: 'pending', requestedBy: 'James Carter', requestDate: 'May 10, 2026', reason: 'Flood test failure on Bldg B balcony deck', subcontractor: 'WaterTight Systems', costCode: '07-1800' },
  { id: 'CO-045', project: 'Lakeside Medical Center', projectId: 4, coType: 'prime', description: 'MRI suite RF shielding upgrade', amount: 85000, status: 'pending', requestedBy: 'Tom Evans', requestDate: 'May 14, 2026', reason: 'New MRI equipment requires enhanced RF shielding', contractNumber: 'C-2026-004' },
  { id: 'CO-046', project: 'Downtown Transit Hub', projectId: 3, coType: 'potential', description: 'Night work premium for track-level MEP installation', amount: 42000, status: 'approved', requestedBy: 'Priya Nair', requestDate: 'May 18, 2026', reason: 'Transit authority restricts daytime work on active platform' },
  // --- Jun 2026 ---
  { id: 'CO-047', project: 'Sunset Ridge Apartments', projectId: 7, coType: 'prime', description: 'Clubhouse expansion by 400 SF', amount: 58000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Jun 1, 2026', reason: 'Developer adding coworking area to amenity clubhouse', contractNumber: 'C-2026-007' },
  { id: 'SCO-019', project: 'Metro Bridge Rehabilitation', projectId: 6, coType: 'subcontract', description: 'Bearing pad replacement at piers 3-5', amount: 37000, status: 'approved', requestedBy: 'Mike Osei', requestDate: 'Jun 4, 2026', reason: 'Inspection revealed deteriorated elastomeric bearings', subcontractor: 'BridgeTech Concrete', costCode: '03-4200' },
  { id: 'CO-048', project: 'Westfield Shopping Center', projectId: 5, coType: 'potential', description: 'Temporary HVAC for early tenant move-in', amount: 24000, status: 'approved', requestedBy: 'Lena Brooks', requestDate: 'Jun 8, 2026', reason: 'Anchor tenant requires conditioned space before permanent system' },
  { id: 'SCO-020', project: 'Industrial Park Warehouse', projectId: 8, coType: 'subcontract', description: 'Fire suppression system upgrade to ESFR heads', amount: 41000, status: 'pending', requestedBy: 'Priya Nair', requestDate: 'Jun 12, 2026', reason: 'Insurance underwriter requires ESFR for high-pile storage', subcontractor: 'FireGuard Solutions', costCode: '21-1300' },
  { id: 'CO-049', project: 'Riverside Office Complex', projectId: 1, coType: 'prime', description: 'Ground floor retail shell fit-out', amount: 92000, status: 'pending', requestedBy: 'Sarah Chen', requestDate: 'Jun 18, 2026', reason: 'Lease signed for ground floor retail tenant', contractNumber: 'C-2026-001' },
  { id: 'CO-050', project: 'Lakeside Medical Center', projectId: 4, coType: 'potential', description: 'Infection control barrier relocation for phased occupancy', amount: 18500, status: 'approved', requestedBy: 'Tom Evans', requestDate: 'Jun 22, 2026', reason: 'Hospital opening west wing while east wing completes' },
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

// ---------------------------------------------------------------------------
// Accounts Receivable -- Invoices Out
// ---------------------------------------------------------------------------
export const INVOICES: Invoice[] = [
  { id: 'INV-001', projectId: 1, invoiceNumber: 'INV-2025-101', amount: 125000, amountPaid: 125000, status: 'paid', issueDate: '2025-10-05', dueDate: '2025-11-04', paidDate: '2025-10-28', terms: 'Net 30', retainageHeld: 12500, linkedContractId: 'PC-2026-001' },
  { id: 'INV-002', projectId: 3, invoiceNumber: 'INV-2025-102', amount: 180000, amountPaid: 180000, status: 'paid', issueDate: '2025-10-15', dueDate: '2025-11-14', paidDate: '2025-11-10', terms: 'Net 30', retainageHeld: 18000, linkedContractId: 'PC-2026-003' },
  { id: 'INV-003', projectId: 6, invoiceNumber: 'INV-2025-103', amount: 95000, amountPaid: 95000, status: 'paid', issueDate: '2025-11-01', dueDate: '2025-12-01', paidDate: '2025-11-29', terms: 'Net 30', retainageHeld: 9500, linkedContractId: 'PC-2026-006' },
  { id: 'INV-004', projectId: 1, invoiceNumber: 'INV-2025-104', amount: 140000, amountPaid: 140000, status: 'paid', issueDate: '2025-12-01', dueDate: '2025-12-31', paidDate: '2025-12-24', terms: 'Net 30', retainageHeld: 14000, linkedContractId: 'PC-2026-001' },
  { id: 'INV-005', projectId: 2, invoiceNumber: 'INV-2025-105', amount: 75000, amountPaid: 75000, status: 'paid', issueDate: '2025-12-10', dueDate: '2026-01-09', paidDate: '2026-01-06', terms: 'Net 30', retainageHeld: 7500, linkedContractId: 'PC-2026-002' },
  { id: 'INV-006', projectId: 7, invoiceNumber: 'INV-2026-106', amount: 62000, amountPaid: 62000, status: 'paid', issueDate: '2026-01-05', dueDate: '2026-02-04', paidDate: '2026-02-02', terms: 'Net 30', retainageHeld: 6200, linkedContractId: 'PC-2026-007' },
  { id: 'INV-007', projectId: 4, invoiceNumber: 'INV-2026-107', amount: 155000, amountPaid: 100000, status: 'partially-paid', issueDate: '2026-01-15', dueDate: '2026-02-14', terms: 'Net 30', retainageHeld: 15500, linkedContractId: 'PC-2026-004' },
  { id: 'INV-008', projectId: 5, invoiceNumber: 'INV-2026-108', amount: 48000, amountPaid: 25000, status: 'partially-paid', issueDate: '2026-01-20', dueDate: '2026-03-06', terms: 'Net 45', retainageHeld: 4800, linkedContractId: 'PC-2026-005' },
  { id: 'INV-009', projectId: 8, invoiceNumber: 'INV-2026-109', amount: 35000, amountPaid: 20000, status: 'partially-paid', issueDate: '2026-02-01', dueDate: '2026-03-03', terms: 'Net 30', retainageHeld: 3500, linkedContractId: 'PC-2026-008' },
  { id: 'INV-010', projectId: 1, invoiceNumber: 'INV-2026-110', amount: 132000, amountPaid: 0, status: 'sent', issueDate: '2026-02-10', dueDate: '2026-03-12', terms: 'Net 30', retainageHeld: 13200, linkedContractId: 'PC-2026-001' },
  { id: 'INV-011', projectId: 3, invoiceNumber: 'INV-2026-111', amount: 168000, amountPaid: 0, status: 'sent', issueDate: '2026-02-15', dueDate: '2026-03-17', terms: 'Net 30', retainageHeld: 16800, linkedContractId: 'PC-2026-003' },
  { id: 'INV-012', projectId: 6, invoiceNumber: 'INV-2026-112', amount: 87000, amountPaid: 0, status: 'sent', issueDate: '2026-02-20', dueDate: '2026-03-22', terms: 'Net 30', retainageHeld: 8700, linkedContractId: 'PC-2026-006' },
  { id: 'INV-013', projectId: 4, invoiceNumber: 'INV-2026-113', amount: 145000, amountPaid: 0, status: 'sent', issueDate: '2026-03-01', dueDate: '2026-03-31', terms: 'Net 30', retainageHeld: 14500, linkedContractId: 'PC-2026-004' },
  { id: 'INV-014', projectId: 2, invoiceNumber: 'INV-2026-114', amount: 82000, amountPaid: 0, status: 'sent', issueDate: '2026-03-05', dueDate: '2026-04-04', terms: 'Net 30', retainageHeld: 8200, linkedContractId: 'PC-2026-002' },
  { id: 'INV-015', projectId: 7, invoiceNumber: 'INV-2026-115', amount: 58000, amountPaid: 0, status: 'sent', issueDate: '2026-03-10', dueDate: '2026-04-09', terms: 'Net 30', retainageHeld: 5800, linkedContractId: 'PC-2026-007' },
  { id: 'INV-016', projectId: 8, invoiceNumber: 'INV-2026-116', amount: 42000, amountPaid: 0, status: 'sent', issueDate: '2026-03-15', dueDate: '2026-04-14', terms: 'Net 30', retainageHeld: 4200, linkedContractId: 'PC-2026-008' },
  { id: 'INV-017', projectId: 5, invoiceNumber: 'INV-2026-117', amount: 53000, amountPaid: 0, status: 'sent', issueDate: '2026-03-18', dueDate: '2026-05-02', terms: 'Net 45', retainageHeld: 5300, linkedContractId: 'PC-2026-005' },
  { id: 'INV-018', projectId: 3, invoiceNumber: 'INV-2025-118', amount: 172000, amountPaid: 0, status: 'overdue', issueDate: '2025-12-20', dueDate: '2026-01-19', terms: 'Net 30', retainageHeld: 17200, linkedContractId: 'PC-2026-003' },
  { id: 'INV-019', projectId: 1, invoiceNumber: 'INV-2026-119', amount: 118000, amountPaid: 0, status: 'overdue', issueDate: '2026-01-10', dueDate: '2026-02-09', terms: 'Net 30', retainageHeld: 11800, linkedContractId: 'PC-2026-001' },
  { id: 'INV-020', projectId: 6, invoiceNumber: 'INV-2026-120', amount: 91000, amountPaid: 0, status: 'overdue', issueDate: '2026-01-25', dueDate: '2026-02-24', terms: 'Net 30', retainageHeld: 9100, linkedContractId: 'PC-2026-006' },
  { id: 'INV-021', projectId: 4, invoiceNumber: 'INV-2026-121', amount: 160000, amountPaid: 0, status: 'overdue', issueDate: '2026-02-01', dueDate: '2026-03-03', terms: 'Net 30', retainageHeld: 16000, linkedContractId: 'PC-2026-004' },
  { id: 'INV-022', projectId: 5, invoiceNumber: 'INV-2026-122', amount: 15000, amountPaid: 0, status: 'draft', issueDate: '2026-03-20', dueDate: '2026-04-19', terms: 'Net 30', retainageHeld: 1500, linkedContractId: 'PC-2026-005' },
  { id: 'INV-023', projectId: 8, invoiceNumber: 'INV-2026-123', amount: 28000, amountPaid: 0, status: 'draft', issueDate: '2026-03-22', dueDate: '2026-04-21', terms: 'Net 30', retainageHeld: 2800, linkedContractId: 'PC-2026-008' },
  { id: 'INV-024', projectId: 2, invoiceNumber: 'INV-2026-124', amount: 67000, amountPaid: 0, status: 'draft', issueDate: '2026-03-25', dueDate: '2026-04-24', terms: 'Net 30', retainageHeld: 6700, linkedContractId: 'PC-2026-002' },
  { id: 'INV-025', projectId: 1, invoiceNumber: 'INV-2025-125', amount: 110000, amountPaid: 110000, status: 'paid', issueDate: '2025-11-10', dueDate: '2025-12-10', paidDate: '2025-12-05', terms: 'Net 30', retainageHeld: 11000, linkedContractId: 'PC-2026-001' },
  { id: 'INV-026', projectId: 3, invoiceNumber: 'INV-2026-126', amount: 154000, amountPaid: 154000, status: 'paid', issueDate: '2026-01-20', dueDate: '2026-02-19', paidDate: '2026-02-18', terms: 'Net 30', retainageHeld: 15400, linkedContractId: 'PC-2026-003' },
  { id: 'INV-027', projectId: 7, invoiceNumber: 'INV-2025-127', amount: 45000, amountPaid: 0, status: 'void', issueDate: '2025-11-05', dueDate: '2025-12-05', terms: 'Net 30', retainageHeld: 0 },
  { id: 'INV-028', projectId: 2, invoiceNumber: 'INV-2026-128', amount: 88000, amountPaid: 88000, status: 'paid', issueDate: '2026-02-05', dueDate: '2026-03-07', paidDate: '2026-03-04', terms: 'Net 30', retainageHeld: 8800, linkedContractId: 'PC-2026-002' },
  { id: 'INV-029', projectId: 4, invoiceNumber: 'INV-2025-129', amount: 135000, amountPaid: 135000, status: 'paid', issueDate: '2025-11-20', dueDate: '2026-01-04', paidDate: '2025-12-30', terms: 'Net 45', retainageHeld: 13500, linkedContractId: 'PC-2026-004' },
  { id: 'INV-030', projectId: 5, invoiceNumber: 'INV-2026-130', amount: 41000, amountPaid: 0, status: 'sent', issueDate: '2026-03-20', dueDate: '2026-04-19', terms: 'Net 30', retainageHeld: 4100, linkedContractId: 'PC-2026-005' },
];

// ---------------------------------------------------------------------------
// Job Billing
// ---------------------------------------------------------------------------
export const BILLING_SCHEDULES: BillingSchedule[] = [
  { projectId: 1, frequency: 'monthly',    nextBillingDate: '2026-04-01', lastBilledDate: '2026-03-01', lastBilledAmount: 132000, contractValue: 800000, totalBilled: 631000, totalRemaining: 169000, billingContact: 'Sarah Chen' },
  { projectId: 2, frequency: 'milestone',  nextBillingDate: '2026-04-15', lastBilledDate: '2026-03-05', lastBilledAmount: 82000,  contractValue: 450000, totalBilled: 312000, totalRemaining: 138000, billingContact: 'James Rodriguez' },
  { projectId: 3, frequency: 'monthly',    nextBillingDate: '2026-04-01', lastBilledDate: '2026-03-01', lastBilledAmount: 168000, contractValue: 1200000, totalBilled: 948000, totalRemaining: 252000, billingContact: 'Aisha Patel' },
  { projectId: 4, frequency: 'monthly',    nextBillingDate: '2026-04-01', lastBilledDate: '2026-03-01', lastBilledAmount: 145000, contractValue: 950000, totalBilled: 590000, totalRemaining: 360000, billingContact: 'Marcus Thompson' },
  { projectId: 5, frequency: 'progress',   nextBillingDate: '2026-04-10', lastBilledDate: '2026-03-18', lastBilledAmount: 53000,  contractValue: 620000, totalBilled: 142000, totalRemaining: 478000, billingContact: 'Diana Kim' },
  { projectId: 6, frequency: 'progress',   nextBillingDate: '2026-04-05', lastBilledDate: '2026-02-20', lastBilledAmount: 87000,  contractValue: 380000, totalBilled: 273000, totalRemaining: 107000, billingContact: 'Robert Kwame' },
  { projectId: 7, frequency: 'milestone',  nextBillingDate: '2026-04-20', lastBilledDate: '2026-03-10', lastBilledAmount: 58000,  contractValue: 550000, totalBilled: 165000, totalRemaining: 385000, billingContact: 'Emily Nakamura' },
  { projectId: 8, frequency: 'monthly',    nextBillingDate: '2026-04-01', lastBilledDate: '2026-03-15', lastBilledAmount: 42000,  contractValue: 340000, totalBilled: 97000,  totalRemaining: 243000, billingContact: 'Tom Bradley' },
];

export const BILLING_EVENTS: BillingEvent[] = [
  { id: 'BE-001', projectId: 1, billingDate: '2025-10-05', amount: 125000, description: 'Progress billing - foundation & structural steel', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-001' },
  { id: 'BE-002', projectId: 3, billingDate: '2025-10-15', amount: 180000, description: 'Monthly progress - MEP rough-in', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-002' },
  { id: 'BE-003', projectId: 6, billingDate: '2025-11-01', amount: 95000, description: 'Progress billing - bridge deck pour', period: 'Nov 2025', status: 'completed', invoiceId: 'INV-003' },
  { id: 'BE-004', projectId: 1, billingDate: '2025-11-10', amount: 110000, description: 'Progress billing - exterior envelope', period: 'Nov 2025', status: 'completed', invoiceId: 'INV-025' },
  { id: 'BE-005', projectId: 1, billingDate: '2025-12-01', amount: 140000, description: 'Monthly billing - interior framing', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-004' },
  { id: 'BE-006', projectId: 2, billingDate: '2025-12-10', amount: 75000, description: 'Milestone: foundation completion', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-005' },
  { id: 'BE-007', projectId: 3, billingDate: '2025-12-20', amount: 172000, description: 'Monthly progress - finishes phase 1', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-018' },
  { id: 'BE-008', projectId: 4, billingDate: '2025-11-20', amount: 135000, description: 'Monthly billing - site prep & foundations', period: 'Nov 2025', status: 'completed', invoiceId: 'INV-029' },
  { id: 'BE-009', projectId: 7, billingDate: '2026-01-05', amount: 62000, description: 'Milestone: permits & excavation', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-006' },
  { id: 'BE-010', projectId: 4, billingDate: '2026-01-15', amount: 155000, description: 'Monthly billing - structural frame', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-007' },
  { id: 'BE-011', projectId: 1, billingDate: '2026-01-10', amount: 118000, description: 'Monthly billing - MEP rough-in', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-019' },
  { id: 'BE-012', projectId: 3, billingDate: '2026-01-20', amount: 154000, description: 'Monthly progress - elevator install', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-026' },
  { id: 'BE-013', projectId: 5, billingDate: '2026-01-20', amount: 48000, description: 'Progress billing - earthwork & utilities', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-008' },
  { id: 'BE-014', projectId: 6, billingDate: '2026-01-25', amount: 91000, description: 'Progress billing - rebar & formwork', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-020' },
  { id: 'BE-015', projectId: 8, billingDate: '2026-02-01', amount: 35000, description: 'Monthly billing - slab on grade', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-009' },
  { id: 'BE-016', projectId: 4, billingDate: '2026-02-01', amount: 160000, description: 'Monthly billing - MEP rough-in', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-021' },
  { id: 'BE-017', projectId: 2, billingDate: '2026-02-05', amount: 88000, description: 'Milestone: framing complete', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-028' },
  { id: 'BE-018', projectId: 1, billingDate: '2026-02-10', amount: 132000, description: 'Monthly billing - drywall & finishes', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-010' },
  { id: 'BE-019', projectId: 3, billingDate: '2026-02-15', amount: 168000, description: 'Monthly progress - commissioning prep', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-011' },
  { id: 'BE-020', projectId: 6, billingDate: '2026-02-20', amount: 87000, description: 'Progress billing - deck overlay', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-012' },
  { id: 'BE-021', projectId: 4, billingDate: '2026-03-01', amount: 145000, description: 'Monthly billing - drywall & ceiling grid', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-013' },
  { id: 'BE-022', projectId: 2, billingDate: '2026-03-05', amount: 82000, description: 'Progress billing - roofing & windows', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-014' },
  { id: 'BE-023', projectId: 7, billingDate: '2026-03-10', amount: 58000, description: 'Milestone: foundation complete', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-015' },
  { id: 'BE-024', projectId: 8, billingDate: '2026-03-15', amount: 42000, description: 'Monthly billing - steel erection', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-016' },
  { id: 'BE-025', projectId: 5, billingDate: '2026-03-18', amount: 53000, description: 'Progress billing - concrete foundations', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-017' },
  { id: 'BE-026', projectId: 5, billingDate: '2026-03-20', amount: 41000, description: 'Progress billing - underground utilities', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-030' },
  { id: 'BE-027', projectId: 1, billingDate: '2026-04-01', amount: 130000, description: 'Monthly billing - flooring & paint', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-028', projectId: 3, billingDate: '2026-04-01', amount: 160000, description: 'Monthly progress - punch list & closeout', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-029', projectId: 4, billingDate: '2026-04-01', amount: 140000, description: 'Monthly billing - MEP trim-out', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-030', projectId: 8, billingDate: '2026-04-01', amount: 45000, description: 'Monthly billing - roofing & siding', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-031', projectId: 6, billingDate: '2026-04-05', amount: 82000, description: 'Progress billing - barrier & railing', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-032', projectId: 5, billingDate: '2026-04-10', amount: 55000, description: 'Progress billing - structural steel', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-033', projectId: 2, billingDate: '2026-04-15', amount: 78000, description: 'Milestone: MEP rough-in complete', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-034', projectId: 7, billingDate: '2026-04-20', amount: 65000, description: 'Milestone: framing started', period: 'Apr 2026', status: 'scheduled' },
  { id: 'BE-035', projectId: 3, billingDate: '2025-11-15', amount: 165000, description: 'Monthly progress - structural steel', period: 'Nov 2025', status: 'completed' },
  { id: 'BE-036', projectId: 4, billingDate: '2025-12-15', amount: 148000, description: 'Monthly billing - concrete frame', period: 'Dec 2025', status: 'completed' },
  { id: 'BE-037', projectId: 6, billingDate: '2025-10-01', amount: 88000, description: 'Progress billing - demolition & traffic control', period: 'Oct 2025', status: 'completed' },
  { id: 'BE-038', projectId: 7, billingDate: '2025-11-15', amount: 45000, description: 'Milestone: site clearing', period: 'Nov 2025', status: 'completed' },
  { id: 'BE-039', projectId: 8, billingDate: '2026-01-10', amount: 20000, description: 'Monthly billing - site prep', period: 'Jan 2026', status: 'completed' },
  { id: 'BE-040', projectId: 2, billingDate: '2025-11-10', amount: 67000, description: 'Milestone: excavation complete', period: 'Nov 2025', status: 'completed' },
  { id: 'BE-041', projectId: 5, billingDate: '2026-02-15', amount: 38000, description: 'Progress billing - mass grading', period: 'Feb 2026', status: 'completed' },
  // Backfill: ensure every project has 6 months of completed billing history (Oct 2025 - Mar 2026)
  { id: 'BE-042', projectId: 1, billingDate: '2026-03-05', amount: 128000, description: 'Monthly billing - elevator commissioning & lobby finishes', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-042' },
  { id: 'BE-043', projectId: 2, billingDate: '2025-10-08', amount: 58000, description: 'Milestone: site mobilization & layout', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-043' },
  { id: 'BE-044', projectId: 2, billingDate: '2026-01-12', amount: 72000, description: 'Milestone: concrete floor pour', period: 'Jan 2026', status: 'completed', invoiceId: 'INV-044' },
  { id: 'BE-045', projectId: 3, billingDate: '2026-03-10', amount: 158000, description: 'Monthly progress - final inspections & turnover', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-045' },
  { id: 'BE-046', projectId: 4, billingDate: '2025-10-15', amount: 120000, description: 'Monthly billing - excavation & shoring', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-046' },
  { id: 'BE-047', projectId: 5, billingDate: '2025-10-10', amount: 32000, description: 'Progress billing - preconstruction & permits', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-047' },
  { id: 'BE-048', projectId: 5, billingDate: '2025-11-12', amount: 36000, description: 'Progress billing - site clearing & demo', period: 'Nov 2025', status: 'completed', invoiceId: 'INV-048' },
  { id: 'BE-049', projectId: 5, billingDate: '2025-12-08', amount: 42000, description: 'Progress billing - temporary roads & drainage', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-049' },
  { id: 'BE-050', projectId: 6, billingDate: '2025-12-10', amount: 82000, description: 'Progress billing - bearing replacement', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-050' },
  { id: 'BE-051', projectId: 6, billingDate: '2026-03-05', amount: 78000, description: 'Progress billing - walkway widening', period: 'Mar 2026', status: 'completed', invoiceId: 'INV-051' },
  { id: 'BE-052', projectId: 7, billingDate: '2025-10-05', amount: 38000, description: 'Milestone: design buyout & submittals', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-052' },
  { id: 'BE-053', projectId: 7, billingDate: '2025-12-12', amount: 50000, description: 'Milestone: utility connections', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-053' },
  { id: 'BE-054', projectId: 7, billingDate: '2026-02-10', amount: 55000, description: 'Milestone: concrete slabs poured', period: 'Feb 2026', status: 'completed', invoiceId: 'INV-054' },
  { id: 'BE-055', projectId: 8, billingDate: '2025-10-05', amount: 18000, description: 'Monthly billing - geotechnical & survey', period: 'Oct 2025', status: 'completed', invoiceId: 'INV-055' },
  { id: 'BE-056', projectId: 8, billingDate: '2025-11-10', amount: 22000, description: 'Monthly billing - foundation design & permitting', period: 'Nov 2025', status: 'completed', invoiceId: 'INV-056' },
  { id: 'BE-057', projectId: 8, billingDate: '2025-12-08', amount: 28000, description: 'Monthly billing - pile driving', period: 'Dec 2025', status: 'completed', invoiceId: 'INV-057' },
];

// ---------------------------------------------------------------------------
// Accounts Payable -- Bills In
// ---------------------------------------------------------------------------
export const PAYABLES: Payable[] = [
  { id: 'AP-001', vendor: 'Apex Electrical Inc.', projectId: 1, invoiceNumber: 'AE-8801', description: 'Electrical rough-in - floors 1-3', amount: 47500, amountPaid: 47500, status: 'paid', receivedDate: '2025-10-12', dueDate: '2025-11-11', paidDate: '2025-11-08', costCode: '26000', linkedContractId: 'SC-2026-001' },
  { id: 'AP-002', vendor: 'ProWall Drywall LLC', projectId: 1, invoiceNumber: 'PW-4420', description: 'Drywall install - levels 1-2', amount: 38200, amountPaid: 38200, status: 'paid', receivedDate: '2025-11-05', dueDate: '2025-12-05', paidDate: '2025-12-01', costCode: '09200', linkedContractId: 'SC-2026-002' },
  { id: 'AP-003', vendor: 'WaterTight Systems', projectId: 3, invoiceNumber: 'WT-1190', description: 'Waterproofing - below grade', amount: 52000, amountPaid: 52000, status: 'paid', receivedDate: '2025-10-20', dueDate: '2025-11-19', paidDate: '2025-11-18', costCode: '07100', linkedContractId: 'SC-2026-003' },
  { id: 'AP-004', vendor: 'CoolAir Mechanical', projectId: 3, invoiceNumber: 'CA-7755', description: 'HVAC ductwork - phase 1', amount: 64000, amountPaid: 64000, status: 'paid', receivedDate: '2025-11-15', dueDate: '2025-12-15', paidDate: '2025-12-12', costCode: '23000', linkedContractId: 'SC-2026-004' },
  { id: 'AP-005', vendor: 'BridgeTech Concrete', projectId: 6, invoiceNumber: 'BT-3310', description: 'Bridge deck concrete pour', amount: 78000, amountPaid: 78000, status: 'paid', receivedDate: '2025-11-01', dueDate: '2025-12-01', paidDate: '2025-11-28', costCode: '03300', linkedContractId: 'SC-2026-006' },
  { id: 'AP-006', vendor: 'FireGuard Solutions', projectId: 1, invoiceNumber: 'FG-2201', description: 'Fire suppression - riser install', amount: 28500, amountPaid: 28500, status: 'paid', receivedDate: '2025-12-01', dueDate: '2025-12-31', paidDate: '2025-12-28', costCode: '21000', linkedContractId: 'SC-2026-005' },
  { id: 'AP-007', vendor: 'PipeFit Plumbing Co.', projectId: 3, invoiceNumber: 'PF-9905', description: 'Plumbing rough-in - domestic water', amount: 41000, amountPaid: 41000, status: 'paid', receivedDate: '2025-12-10', dueDate: '2026-01-09', paidDate: '2026-01-05', costCode: '22000', linkedContractId: 'SC-2026-007' },
  { id: 'AP-008', vendor: 'IronWorks Structural', projectId: 4, invoiceNumber: 'IW-5501', description: 'Structural steel erection', amount: 92000, amountPaid: 92000, status: 'paid', receivedDate: '2026-01-05', dueDate: '2026-02-04', paidDate: '2026-02-01', costCode: '05100', linkedContractId: 'SC-2026-008' },
  { id: 'AP-009', vendor: 'Apex Electrical Inc.', projectId: 1, invoiceNumber: 'AE-8830', description: 'Electrical trim - floor 3', amount: 32000, amountPaid: 0, status: 'approved', receivedDate: '2026-02-15', dueDate: '2026-03-17', costCode: '26000', linkedContractId: 'SC-2026-001' },
  { id: 'AP-010', vendor: 'CoolAir Mechanical', projectId: 3, invoiceNumber: 'CA-7790', description: 'HVAC controls & commissioning', amount: 55000, amountPaid: 0, status: 'approved', receivedDate: '2026-02-20', dueDate: '2026-03-22', costCode: '23000', linkedContractId: 'SC-2026-004' },
  { id: 'AP-011', vendor: 'ProWall Drywall LLC', projectId: 4, invoiceNumber: 'PW-4455', description: 'Drywall - patient rooms level 2', amount: 44000, amountPaid: 0, status: 'approved', receivedDate: '2026-03-01', dueDate: '2026-03-31', costCode: '09200', linkedContractId: 'SC-2026-002' },
  { id: 'AP-012', vendor: 'GlazePro Windows', projectId: 2, invoiceNumber: 'GP-1102', description: 'Curtain wall units - tower A', amount: 86000, amountPaid: 0, status: 'approved', receivedDate: '2026-03-05', dueDate: '2026-04-04', costCode: '08400', linkedContractId: 'SC-2026-012' },
  { id: 'AP-013', vendor: 'MedConnect Systems', projectId: 4, invoiceNumber: 'MC-0440', description: 'Medical gas piping - rough-in', amount: 37500, amountPaid: 0, status: 'approved', receivedDate: '2026-03-08', dueDate: '2026-04-07', costCode: '22600', linkedContractId: 'SC-2026-011' },
  { id: 'AP-014', vendor: 'VerticalRise Elevators', projectId: 3, invoiceNumber: 'VR-6610', description: 'Elevator cab install - car 1', amount: 62000, amountPaid: 0, status: 'approved', receivedDate: '2026-03-10', dueDate: '2026-04-09', costCode: '14200', linkedContractId: 'SC-2026-009' },
  { id: 'AP-015', vendor: 'DeepFound Shoring Inc.', projectId: 7, invoiceNumber: 'DF-2205', description: 'Foundation piling - building A', amount: 71000, amountPaid: 0, status: 'pending', receivedDate: '2026-03-15', dueDate: '2026-04-14', costCode: '02300', linkedContractId: 'SC-2026-010' },
  { id: 'AP-016', vendor: 'GreenScape Irrigation', projectId: 5, invoiceNumber: 'GS-3305', description: 'Underground irrigation - phase 1', amount: 18500, amountPaid: 0, status: 'pending', receivedDate: '2026-03-18', dueDate: '2026-04-17', costCode: '32800', linkedContractId: 'SC-2026-014' },
  { id: 'AP-017', vendor: 'BridgeTech Concrete', projectId: 6, invoiceNumber: 'BT-3340', description: 'Barrier wall concrete', amount: 45000, amountPaid: 0, status: 'pending', receivedDate: '2026-03-20', dueDate: '2026-04-19', costCode: '03300', linkedContractId: 'SC-2026-006' },
  { id: 'AP-018', vendor: 'IronWorks Structural', projectId: 8, invoiceNumber: 'IW-5530', description: 'Steel erection - main frame', amount: 58000, amountPaid: 0, status: 'pending', receivedDate: '2026-03-22', dueDate: '2026-04-21', costCode: '05100', linkedContractId: 'SC-2026-008' },
  { id: 'AP-019', vendor: 'GlazePro Windows', projectId: 7, invoiceNumber: 'GP-1120', description: 'Window frames - building A', amount: 33000, amountPaid: 0, status: 'pending', receivedDate: '2026-03-25', dueDate: '2026-04-24', costCode: '08500', linkedContractId: 'SC-2026-013' },
  { id: 'AP-020', vendor: 'WaterTight Systems', projectId: 6, invoiceNumber: 'WT-1210', description: 'Joint sealant - expansion joints', amount: 22000, amountPaid: 0, status: 'overdue', receivedDate: '2026-01-15', dueDate: '2026-02-14', costCode: '07900', linkedContractId: 'SC-2026-003' },
  { id: 'AP-021', vendor: 'PipeFit Plumbing Co.', projectId: 4, invoiceNumber: 'PF-9935', description: 'Sanitary sewer line extension', amount: 29500, amountPaid: 0, status: 'overdue', receivedDate: '2026-02-01', dueDate: '2026-03-03', costCode: '22100', linkedContractId: 'SC-2026-007' },
  { id: 'AP-022', vendor: 'Apex Electrical Inc.', projectId: 3, invoiceNumber: 'AE-8850', description: 'Panel upgrades - switchgear room', amount: 41000, amountPaid: 0, status: 'overdue', receivedDate: '2026-02-10', dueDate: '2026-03-12', costCode: '26200', linkedContractId: 'SC-2026-001' },
  { id: 'AP-023', vendor: 'CoolAir Mechanical', projectId: 1, invoiceNumber: 'CA-7810', description: 'Chiller install retainage dispute', amount: 15000, amountPaid: 0, status: 'disputed', receivedDate: '2026-01-20', dueDate: '2026-02-19', costCode: '23600', linkedContractId: 'SC-2026-004' },
  { id: 'AP-024', vendor: 'FireGuard Solutions', projectId: 4, invoiceNumber: 'FG-2230', description: 'Fire alarm wiring - level 3', amount: 24000, amountPaid: 0, status: 'approved', receivedDate: '2026-03-12', dueDate: '2026-04-11', costCode: '28300', linkedContractId: 'SC-2026-005' },
  { id: 'AP-025', vendor: 'Apex Electrical Inc.', projectId: 4, invoiceNumber: 'AE-8860', description: 'Electrical feeders - switchboard B', amount: 36000, amountPaid: 0, status: 'pending', receivedDate: '2026-03-26', dueDate: '2026-04-25', costCode: '26100', linkedContractId: 'SC-2026-001' },
  { id: 'AP-026', vendor: 'ProWall Drywall LLC', projectId: 1, invoiceNumber: 'PW-4470', description: 'Ceiling grid & ACT - floor 2', amount: 27000, amountPaid: 27000, status: 'paid', receivedDate: '2026-01-10', dueDate: '2026-02-09', paidDate: '2026-02-06', costCode: '09500', linkedContractId: 'SC-2026-002' },
  { id: 'AP-027', vendor: 'BridgeTech Concrete', projectId: 6, invoiceNumber: 'BT-3325', description: 'Abutment repair - west side', amount: 34000, amountPaid: 34000, status: 'paid', receivedDate: '2025-12-15', dueDate: '2026-01-14', paidDate: '2026-01-12', costCode: '03400', linkedContractId: 'SC-2026-006' },
  { id: 'AP-028', vendor: 'PipeFit Plumbing Co.', projectId: 1, invoiceNumber: 'PF-9920', description: 'Storm drain piping - basement', amount: 19500, amountPaid: 19500, status: 'paid', receivedDate: '2026-01-20', dueDate: '2026-02-19', paidDate: '2026-02-17', costCode: '22400', linkedContractId: 'SC-2026-007' },
  { id: 'AP-029', vendor: 'VerticalRise Elevators', projectId: 3, invoiceNumber: 'VR-6605', description: 'Elevator hoistway - shaft prep', amount: 48000, amountPaid: 48000, status: 'paid', receivedDate: '2025-11-20', dueDate: '2025-12-20', paidDate: '2025-12-18', costCode: '14100', linkedContractId: 'SC-2026-009' },
  { id: 'AP-030', vendor: 'DeepFound Shoring Inc.', projectId: 7, invoiceNumber: 'DF-2200', description: 'Sheet piling - excavation support', amount: 55000, amountPaid: 55000, status: 'paid', receivedDate: '2025-12-05', dueDate: '2026-01-04', paidDate: '2025-12-30', costCode: '02200', linkedContractId: 'SC-2026-010' },
  { id: 'AP-031', vendor: 'MedConnect Systems', projectId: 4, invoiceNumber: 'MC-0420', description: 'Nurse call system - conduit', amount: 21000, amountPaid: 21000, status: 'paid', receivedDate: '2026-02-05', dueDate: '2026-03-07', paidDate: '2026-03-05', costCode: '27500', linkedContractId: 'SC-2026-011' },
  { id: 'AP-032', vendor: 'GlazePro Windows', projectId: 2, invoiceNumber: 'GP-1095', description: 'Storefront glazing - lobby', amount: 42000, amountPaid: 42000, status: 'paid', receivedDate: '2026-01-15', dueDate: '2026-02-14', paidDate: '2026-02-12', costCode: '08800', linkedContractId: 'SC-2026-012' },
  { id: 'AP-033', vendor: 'GreenScape Irrigation', projectId: 5, invoiceNumber: 'GS-3300', description: 'Site grading & erosion control', amount: 14000, amountPaid: 14000, status: 'paid', receivedDate: '2026-02-10', dueDate: '2026-03-12', paidDate: '2026-03-09', costCode: '31200', linkedContractId: 'SC-2026-014' },
  { id: 'AP-034', vendor: 'IronWorks Structural', projectId: 8, invoiceNumber: 'IW-5515', description: 'Anchor bolts & base plates', amount: 16000, amountPaid: 16000, status: 'paid', receivedDate: '2026-02-20', dueDate: '2026-03-22', paidDate: '2026-03-18', costCode: '05500', linkedContractId: 'SC-2026-008' },
  { id: 'AP-035', vendor: 'FireGuard Solutions', projectId: 3, invoiceNumber: 'FG-2215', description: 'Sprinkler heads - floors 4-6', amount: 31000, amountPaid: 0, status: 'approved', receivedDate: '2026-03-15', dueDate: '2026-04-14', costCode: '21100', linkedContractId: 'SC-2026-005' },
  // --- Apr 2026 ---
  { id: 'AP-036', vendor: 'Apex Electrical Inc.', projectId: 1, invoiceNumber: 'AEI-2026-0415', description: 'Rough-in electrical PA-002', amount: 52000, amountPaid: 52000, status: 'paid', receivedDate: '2026-04-16', dueDate: '2026-05-16', paidDate: '2026-05-10', costCode: '26200', linkedContractId: 'SC-2026-001' },
  { id: 'AP-037', vendor: 'CoolAir Mechanical', projectId: 4, invoiceNumber: 'CAM-4510', description: 'HVAC ductwork reroute CO', amount: 33000, amountPaid: 0, status: 'approved', receivedDate: '2026-04-25', dueDate: '2026-05-25', costCode: '23100', linkedContractId: 'SC-2026-004' },
  { id: 'AP-038', vendor: 'Pacific Windows & Glass', projectId: 2, invoiceNumber: 'PWG-1820', description: 'Glazing deposit - floors 15-20', amount: 97500, amountPaid: 97500, status: 'paid', receivedDate: '2026-04-18', dueDate: '2026-05-18', paidDate: '2026-05-15', costCode: '08800' },
  // --- May 2026 ---
  { id: 'AP-039', vendor: 'BridgeTech Concrete', projectId: 6, invoiceNumber: 'BT-3380', description: 'Deck overlay concrete PA-003', amount: 48000, amountPaid: 48000, status: 'paid', receivedDate: '2026-05-21', dueDate: '2026-06-20', paidDate: '2026-06-18', costCode: '03400', linkedContractId: 'SC-2026-006' },
  { id: 'AP-040', vendor: 'PipeFit Plumbing Co.', projectId: 7, invoiceNumber: 'PF-9945', description: 'Plumbing top-out PA-002', amount: 42000, amountPaid: 42000, status: 'paid', receivedDate: '2026-05-06', dueDate: '2026-06-05', paidDate: '2026-06-03', costCode: '22400', linkedContractId: 'SC-2026-007' },
  { id: 'AP-041', vendor: 'National Electrical Supply', projectId: 3, invoiceNumber: 'NES-7720', description: 'Platform lighting fixtures', amount: 52000, amountPaid: 52000, status: 'paid', receivedDate: '2026-05-16', dueDate: '2026-06-15', paidDate: '2026-06-12', costCode: '26500' },
  { id: 'AP-042', vendor: 'IronWorks Structural', projectId: 8, invoiceNumber: 'IW-5540', description: 'Steel erection PA-002', amount: 72000, amountPaid: 0, status: 'approved', receivedDate: '2026-05-18', dueDate: '2026-06-17', costCode: '05500', linkedContractId: 'SC-2026-008' },
  // --- Jun 2026 ---
  { id: 'AP-043', vendor: 'Apex Electrical Inc.', projectId: 1, invoiceNumber: 'AEI-2026-0610', description: 'Electrical trim & devices PA-003', amount: 38000, amountPaid: 0, status: 'pending', receivedDate: '2026-06-11', dueDate: '2026-07-11', costCode: '26200', linkedContractId: 'SC-2026-001' },
  { id: 'AP-044', vendor: 'CoolAir Mechanical', projectId: 4, invoiceNumber: 'CAM-4590', description: 'AHU startup & TAB PA-003', amount: 62000, amountPaid: 0, status: 'approved', receivedDate: '2026-06-16', dueDate: '2026-07-16', costCode: '23100', linkedContractId: 'SC-2026-004' },
  { id: 'AP-045', vendor: 'SteelPro Fabrication', projectId: 6, invoiceNumber: 'SPF-4422', description: 'Decorative railing deposit', amount: 39000, amountPaid: 0, status: 'pending', receivedDate: '2026-06-22', dueDate: '2026-07-22', costCode: '05500' },
];

// ---------------------------------------------------------------------------
// Cash Management
// ---------------------------------------------------------------------------
export const CASH_FLOW_HISTORY: CashFlowEntry[] = [
  { month: 'Oct 2025', inflows: 420000, outflows: 385000, netCash: 35000,  runningBalance: 385000 },
  { month: 'Nov 2025', inflows: 475000, outflows: 410000, netCash: 65000,  runningBalance: 450000 },
  { month: 'Dec 2025', inflows: 510000, outflows: 445000, netCash: 65000,  runningBalance: 515000 },
  { month: 'Jan 2026', inflows: 490000, outflows: 480000, netCash: 10000,  runningBalance: 525000 },
  { month: 'Feb 2026', inflows: 540000, outflows: 465000, netCash: 75000,  runningBalance: 600000 },
  { month: 'Mar 2026', inflows: 460000, outflows: 490000, netCash: -30000, runningBalance: 570000 },
  { month: 'Apr 2026', inflows: 520000, outflows: 475000, netCash: 45000,  runningBalance: 615000 },
  { month: 'May 2026', inflows: 555000, outflows: 510000, netCash: 45000,  runningBalance: 660000 },
  { month: 'Jun 2026', inflows: 530000, outflows: 520000, netCash: 10000,  runningBalance: 670000 },
];

export const CASH_POSITION: CashPosition = {
  currentBalance: 570000,
  thirtyDayForecast: 535000,
  sixtyDayForecast: 510000,
  ninetyDayForecast: 480000,
  monthlyPayroll: 152000,
  monthlyOverhead: 41000,
  upcomingPayables: 389500,
};

// ---------------------------------------------------------------------------
// General Ledger
// ---------------------------------------------------------------------------
export const GL_ACCOUNTS: GLAccount[] = [
  { code: '1000', name: 'Cash & Equivalents',     type: 'asset',     balance: 570000 },
  { code: '1100', name: 'Accounts Receivable',     type: 'asset',     balance: 1314000 },
  { code: '1200', name: 'Retainage Receivable',    type: 'asset',     balance: 248300 },
  { code: '1300', name: 'Work in Progress',        type: 'asset',     balance: 195000 },
  { code: '2000', name: 'Accounts Payable',        type: 'liability', balance: 389500 },
  { code: '2100', name: 'Accrued Payroll',         type: 'liability', balance: 152000 },
  { code: '2200', name: 'Retainage Payable',       type: 'liability', balance: 82000 },
  { code: '2300', name: 'Current Portion of Debt', type: 'liability', balance: 48000 },
  { code: '3000', name: 'Owner Equity',            type: 'equity',    balance: 1656800 },
  { code: '4000', name: 'Contract Revenue',        type: 'revenue',   balance: 2895000 },
  { code: '4100', name: 'Change Order Revenue',    type: 'revenue',   balance: 185000 },
  { code: '5000', name: 'Direct Job Costs',        type: 'expense',   balance: 1842000 },
  { code: '5100', name: 'Subcontractor Costs',     type: 'expense',   balance: 948000 },
  { code: '6000', name: 'Payroll Expense',         type: 'expense',   balance: 912000 },
  { code: '6100', name: 'General & Admin',         type: 'expense',   balance: 246000 },
];

export const GL_ENTRIES: GLEntry[] = [
  { id: 'GL-001', date: '2025-10-05', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2025-101 - Riverside Office', debit: 125000, credit: 0, balance: 125000, projectId: 1, category: 'asset', reference: 'INV-001' },
  { id: 'GL-002', date: '2025-10-05', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Riverside Office progress billing', debit: 0, credit: 125000, balance: 125000, projectId: 1, category: 'revenue', reference: 'INV-001' },
  { id: 'GL-003', date: '2025-10-12', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'Apex Electrical - rough-in floors 1-3', debit: 47500, credit: 0, balance: 47500, projectId: 1, category: 'expense', reference: 'AP-001' },
  { id: 'GL-004', date: '2025-10-12', accountCode: '2000', accountName: 'Accounts Payable', description: 'AP - Apex Electrical invoice AE-8801', debit: 0, credit: 47500, balance: 47500, projectId: 1, category: 'liability', reference: 'AP-001' },
  { id: 'GL-005', date: '2025-10-15', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2025-102 - Downtown Transit', debit: 180000, credit: 0, balance: 305000, projectId: 3, category: 'asset', reference: 'INV-002' },
  { id: 'GL-006', date: '2025-10-15', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Downtown Transit Hub', debit: 0, credit: 180000, balance: 305000, projectId: 3, category: 'revenue', reference: 'INV-002' },
  { id: 'GL-007', date: '2025-10-28', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2025-101', debit: 125000, credit: 0, balance: 475000, projectId: 1, category: 'asset', reference: 'INV-001' },
  { id: 'GL-008', date: '2025-10-28', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Payment applied - INV-2025-101', debit: 0, credit: 125000, balance: 180000, projectId: 1, category: 'asset', reference: 'INV-001' },
  { id: 'GL-009', date: '2025-10-31', accountCode: '6000', accountName: 'Payroll Expense', description: 'Oct 2025 payroll', debit: 152000, credit: 0, balance: 152000, category: 'expense', reference: 'PR-2025-10' },
  { id: 'GL-010', date: '2025-10-31', accountCode: '2100', accountName: 'Accrued Payroll', description: 'Oct 2025 payroll accrual', debit: 0, credit: 152000, balance: 152000, category: 'liability', reference: 'PR-2025-10' },
  { id: 'GL-011', date: '2025-11-01', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2025-103 - Metro Bridge', debit: 95000, credit: 0, balance: 275000, projectId: 6, category: 'asset', reference: 'INV-003' },
  { id: 'GL-012', date: '2025-11-01', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Metro Bridge Rehab', debit: 0, credit: 95000, balance: 400000, projectId: 6, category: 'revenue', reference: 'INV-003' },
  { id: 'GL-013', date: '2025-11-05', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'ProWall Drywall - levels 1-2', debit: 38200, credit: 0, balance: 85700, projectId: 1, category: 'expense', reference: 'AP-002' },
  { id: 'GL-014', date: '2025-11-10', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2025-125 - Riverside Office', debit: 110000, credit: 0, balance: 385000, projectId: 1, category: 'asset', reference: 'INV-025' },
  { id: 'GL-015', date: '2025-11-10', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Riverside Office exterior', debit: 0, credit: 110000, balance: 510000, projectId: 1, category: 'revenue', reference: 'INV-025' },
  { id: 'GL-016', date: '2025-11-10', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2025-102', debit: 180000, credit: 0, balance: 655000, projectId: 3, category: 'asset', reference: 'INV-002' },
  { id: 'GL-017', date: '2025-11-10', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Payment applied - INV-2025-102', debit: 0, credit: 180000, balance: 205000, projectId: 3, category: 'asset', reference: 'INV-002' },
  { id: 'GL-018', date: '2025-11-20', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'WaterTight Systems - below grade', debit: 52000, credit: 0, balance: 137700, projectId: 3, category: 'expense', reference: 'AP-003' },
  { id: 'GL-019', date: '2025-11-28', accountCode: '6100', accountName: 'General & Admin', description: 'Nov 2025 overhead - rent, insurance, utilities', debit: 41000, credit: 0, balance: 41000, category: 'expense', reference: 'OH-2025-11' },
  { id: 'GL-020', date: '2025-11-30', accountCode: '6000', accountName: 'Payroll Expense', description: 'Nov 2025 payroll', debit: 152000, credit: 0, balance: 304000, category: 'expense', reference: 'PR-2025-11' },
  { id: 'GL-021', date: '2025-12-01', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2025-104 - Riverside Office', debit: 140000, credit: 0, balance: 345000, projectId: 1, category: 'asset', reference: 'INV-004' },
  { id: 'GL-022', date: '2025-12-01', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Riverside Office framing', debit: 0, credit: 140000, balance: 650000, projectId: 1, category: 'revenue', reference: 'INV-004' },
  { id: 'GL-023', date: '2025-12-10', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'CoolAir Mechanical - HVAC phase 1', debit: 64000, credit: 0, balance: 201700, projectId: 3, category: 'expense', reference: 'AP-004' },
  { id: 'GL-024', date: '2025-12-15', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Materials - concrete & rebar Dec delivery', debit: 86000, credit: 0, balance: 86000, projectId: 4, category: 'expense', reference: 'PO-2025-042' },
  { id: 'GL-025', date: '2025-12-24', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2025-104', debit: 140000, credit: 0, balance: 515000, projectId: 1, category: 'asset', reference: 'INV-004' },
  { id: 'GL-026', date: '2025-12-24', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Payment applied - INV-2025-104', debit: 0, credit: 140000, balance: 205000, projectId: 1, category: 'asset', reference: 'INV-004' },
  { id: 'GL-027', date: '2025-12-31', accountCode: '6000', accountName: 'Payroll Expense', description: 'Dec 2025 payroll', debit: 152000, credit: 0, balance: 456000, category: 'expense', reference: 'PR-2025-12' },
  { id: 'GL-028', date: '2025-12-31', accountCode: '6100', accountName: 'General & Admin', description: 'Dec 2025 overhead', debit: 41000, credit: 0, balance: 82000, category: 'expense', reference: 'OH-2025-12' },
  { id: 'GL-029', date: '2026-01-05', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'IronWorks - structural steel', debit: 92000, credit: 0, balance: 293700, projectId: 4, category: 'expense', reference: 'AP-008' },
  { id: 'GL-030', date: '2026-01-06', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2025-105', debit: 75000, credit: 0, balance: 525000, projectId: 2, category: 'asset', reference: 'INV-005' },
  { id: 'GL-031', date: '2026-01-15', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2026-107 - Lakeside Medical', debit: 155000, credit: 0, balance: 580000, projectId: 4, category: 'asset', reference: 'INV-007' },
  { id: 'GL-032', date: '2026-01-15', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Lakeside Medical structural', debit: 0, credit: 155000, balance: 960000, projectId: 4, category: 'revenue', reference: 'INV-007' },
  { id: 'GL-033', date: '2026-01-20', accountCode: '1200', accountName: 'Retainage Receivable', description: 'Retainage held - INV-2026-107', debit: 15500, credit: 0, balance: 15500, projectId: 4, category: 'asset', reference: 'INV-007' },
  { id: 'GL-034', date: '2026-01-31', accountCode: '6000', accountName: 'Payroll Expense', description: 'Jan 2026 payroll', debit: 152000, credit: 0, balance: 608000, category: 'expense', reference: 'PR-2026-01' },
  { id: 'GL-035', date: '2026-01-31', accountCode: '6100', accountName: 'General & Admin', description: 'Jan 2026 overhead', debit: 41000, credit: 0, balance: 123000, category: 'expense', reference: 'OH-2026-01' },
  { id: 'GL-036', date: '2026-02-01', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'PipeFit Plumbing - domestic water', debit: 41000, credit: 0, balance: 334700, projectId: 3, category: 'expense', reference: 'AP-007' },
  { id: 'GL-037', date: '2026-02-02', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2026-106', debit: 62000, credit: 0, balance: 587000, projectId: 7, category: 'asset', reference: 'INV-006' },
  { id: 'GL-038', date: '2026-02-05', accountCode: '4100', accountName: 'Change Order Revenue', description: 'CO-003 approved - additional structural', debit: 0, credit: 32000, balance: 32000, projectId: 3, category: 'revenue', reference: 'CO-003' },
  { id: 'GL-039', date: '2026-02-10', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2026-110 - Riverside Office', debit: 132000, credit: 0, balance: 712000, projectId: 1, category: 'asset', reference: 'INV-010' },
  { id: 'GL-040', date: '2026-02-10', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Riverside Office finishes', debit: 0, credit: 132000, balance: 1092000, projectId: 1, category: 'revenue', reference: 'INV-010' },
  { id: 'GL-041', date: '2026-02-15', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Materials - MEP components Feb order', debit: 72000, credit: 0, balance: 158000, projectId: 4, category: 'expense', reference: 'PO-2026-008' },
  { id: 'GL-042', date: '2026-02-18', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2026-126', debit: 154000, credit: 0, balance: 600000, projectId: 3, category: 'asset', reference: 'INV-026' },
  { id: 'GL-043', date: '2026-02-20', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2026-112 - Metro Bridge', debit: 87000, credit: 0, balance: 799000, projectId: 6, category: 'asset', reference: 'INV-012' },
  { id: 'GL-044', date: '2026-02-28', accountCode: '6000', accountName: 'Payroll Expense', description: 'Feb 2026 payroll', debit: 152000, credit: 0, balance: 760000, category: 'expense', reference: 'PR-2026-02' },
  { id: 'GL-045', date: '2026-02-28', accountCode: '6100', accountName: 'General & Admin', description: 'Feb 2026 overhead', debit: 41000, credit: 0, balance: 164000, category: 'expense', reference: 'OH-2026-02' },
  { id: 'GL-046', date: '2026-03-01', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2026-113 - Lakeside Medical', debit: 145000, credit: 0, balance: 944000, projectId: 4, category: 'asset', reference: 'INV-013' },
  { id: 'GL-047', date: '2026-03-01', accountCode: '4000', accountName: 'Contract Revenue', description: 'Revenue - Lakeside Medical finishes', debit: 0, credit: 145000, balance: 1237000, projectId: 4, category: 'revenue', reference: 'INV-013' },
  { id: 'GL-048', date: '2026-03-04', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Payment received - INV-2026-128', debit: 88000, credit: 0, balance: 570000, projectId: 2, category: 'asset', reference: 'INV-028' },
  { id: 'GL-049', date: '2026-03-05', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'MedConnect - nurse call conduit', debit: 21000, credit: 0, balance: 355700, projectId: 4, category: 'expense', reference: 'AP-031' },
  { id: 'GL-050', date: '2026-03-10', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Materials - structural steel delivery', debit: 58000, credit: 0, balance: 216000, projectId: 8, category: 'expense', reference: 'PO-2026-014' },
  { id: 'GL-051', date: '2026-03-12', accountCode: '4100', accountName: 'Change Order Revenue', description: 'CO-007 approved - added scope Lakeside', debit: 0, credit: 45000, balance: 77000, projectId: 4, category: 'revenue', reference: 'CO-007' },
  { id: 'GL-052', date: '2026-03-15', accountCode: '1100', accountName: 'Accounts Receivable', description: 'Invoice INV-2026-116 - Industrial Park', debit: 42000, credit: 0, balance: 986000, projectId: 8, category: 'asset', reference: 'INV-016' },
  { id: 'GL-053', date: '2026-03-15', accountCode: '2200', accountName: 'Retainage Payable', description: 'Retainage accrual - subs Mar billing', debit: 0, credit: 8200, balance: 82000, category: 'liability', reference: 'RET-2026-03' },
  { id: 'GL-054', date: '2026-03-18', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'IronWorks - base plates Industrial Park', debit: 16000, credit: 0, balance: 371700, projectId: 8, category: 'expense', reference: 'AP-034' },
  { id: 'GL-055', date: '2026-03-20', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Equipment rental - crane Mar', debit: 24000, credit: 0, balance: 240000, projectId: 7, category: 'expense', reference: 'EQ-2026-006' },
  { id: 'GL-056', date: '2026-03-25', accountCode: '1300', accountName: 'Work in Progress', description: 'WIP adjustment - unbilled Westfield work', debit: 35000, credit: 0, balance: 195000, projectId: 5, category: 'asset', reference: 'WIP-2026-03' },
  { id: 'GL-057', date: '2026-03-28', accountCode: '6000', accountName: 'Payroll Expense', description: 'Mar 2026 payroll', debit: 152000, credit: 0, balance: 912000, category: 'expense', reference: 'PR-2026-03' },
  { id: 'GL-058', date: '2026-03-28', accountCode: '6100', accountName: 'General & Admin', description: 'Mar 2026 overhead', debit: 41000, credit: 0, balance: 205000, category: 'expense', reference: 'OH-2026-03' },
  { id: 'GL-059', date: '2026-03-29', accountCode: '2300', accountName: 'Current Portion of Debt', description: 'Equipment loan payment - Mar', debit: 4000, credit: 0, balance: 48000, category: 'liability', reference: 'LOAN-2026-03' },
  { id: 'GL-060', date: '2026-03-29', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Equipment loan payment disbursement', debit: 0, credit: 4000, balance: 570000, category: 'asset', reference: 'LOAN-2026-03' },
  // --- Apr 2026 ---
  { id: 'GL-061', date: '2026-04-03', accountCode: '1200', accountName: 'Accounts Receivable', description: 'Invoice #INV-031 Riverside Phase 3 progress billing', debit: 125000, credit: 0, balance: 605000, projectId: 1, category: 'asset', reference: 'INV-031' },
  { id: 'GL-062', date: '2026-04-08', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'FireGuard Solutions - sprinkler install Transit Hub', debit: 35000, credit: 0, balance: 406700, projectId: 3, category: 'expense', reference: 'AP-035' },
  { id: 'GL-063', date: '2026-04-10', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Client payment received - Harbor View Feb invoice', debit: 95000, credit: 0, balance: 665000, projectId: 2, category: 'asset', reference: 'REC-2026-08' },
  { id: 'GL-064', date: '2026-04-15', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'Apex Electrical - rough-in PA-002 Riverside', debit: 52000, credit: 0, balance: 458700, projectId: 1, category: 'expense', reference: 'AP-036' },
  { id: 'GL-065', date: '2026-04-20', accountCode: '4000', accountName: 'Revenue', description: 'Progress billing - Downtown Transit Hub Apr', debit: 0, credit: 180000, balance: 1860000, projectId: 3, category: 'revenue', reference: 'INV-032' },
  { id: 'GL-066', date: '2026-04-25', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Equipment rental - tower crane Apr', debit: 28000, credit: 0, balance: 268000, projectId: 1, category: 'expense', reference: 'EQ-2026-007' },
  { id: 'GL-067', date: '2026-04-28', accountCode: '6000', accountName: 'Payroll Expense', description: 'Apr 2026 payroll', debit: 158000, credit: 0, balance: 1070000, category: 'expense', reference: 'PR-2026-04' },
  { id: 'GL-068', date: '2026-04-28', accountCode: '6100', accountName: 'General & Admin', description: 'Apr 2026 overhead', debit: 43000, credit: 0, balance: 248000, category: 'expense', reference: 'OH-2026-04' },
  { id: 'GL-069', date: '2026-04-30', accountCode: '2300', accountName: 'Current Portion of Debt', description: 'Equipment loan payment - Apr', debit: 4000, credit: 0, balance: 44000, category: 'liability', reference: 'LOAN-2026-04' },
  // --- May 2026 ---
  { id: 'GL-070', date: '2026-05-05', accountCode: '1200', accountName: 'Accounts Receivable', description: 'Invoice #INV-033 Lakeside Medical progress billing', debit: 210000, credit: 0, balance: 815000, projectId: 4, category: 'asset', reference: 'INV-033' },
  { id: 'GL-071', date: '2026-05-10', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'PipeFit Plumbing - top-out PA-002 Sunset Ridge', debit: 42000, credit: 0, balance: 500700, projectId: 7, category: 'expense', reference: 'AP-040' },
  { id: 'GL-072', date: '2026-05-15', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Client payment received - Transit Hub Mar invoice', debit: 180000, credit: 0, balance: 845000, projectId: 3, category: 'asset', reference: 'REC-2026-09' },
  { id: 'GL-073', date: '2026-05-18', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'IronWorks Structural - steel erection PA-002 Warehouse', debit: 72000, credit: 0, balance: 572700, projectId: 8, category: 'expense', reference: 'AP-042' },
  { id: 'GL-074', date: '2026-05-20', accountCode: '4000', accountName: 'Revenue', description: 'Progress billing - Westfield Shopping Center May', debit: 0, credit: 145000, balance: 2005000, projectId: 5, category: 'revenue', reference: 'INV-034' },
  { id: 'GL-075', date: '2026-05-25', accountCode: '1300', accountName: 'Work in Progress', description: 'WIP adjustment - unbilled Sunset Ridge work', debit: 42000, credit: 0, balance: 237000, projectId: 7, category: 'asset', reference: 'WIP-2026-05' },
  { id: 'GL-076', date: '2026-05-28', accountCode: '6000', accountName: 'Payroll Expense', description: 'May 2026 payroll', debit: 162000, credit: 0, balance: 1232000, category: 'expense', reference: 'PR-2026-05' },
  { id: 'GL-077', date: '2026-05-28', accountCode: '6100', accountName: 'General & Admin', description: 'May 2026 overhead', debit: 44000, credit: 0, balance: 292000, category: 'expense', reference: 'OH-2026-05' },
  { id: 'GL-078', date: '2026-05-31', accountCode: '2300', accountName: 'Current Portion of Debt', description: 'Equipment loan payment - May', debit: 4000, credit: 0, balance: 40000, category: 'liability', reference: 'LOAN-2026-05' },
  // --- Jun 2026 ---
  { id: 'GL-079', date: '2026-06-03', accountCode: '1200', accountName: 'Accounts Receivable', description: 'Invoice #INV-035 Metro Bridge progress billing', debit: 95000, credit: 0, balance: 910000, projectId: 6, category: 'asset', reference: 'INV-035' },
  { id: 'GL-080', date: '2026-06-10', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'Apex Electrical - trim & devices PA-003 Riverside', debit: 38000, credit: 0, balance: 610700, projectId: 1, category: 'expense', reference: 'AP-043' },
  { id: 'GL-081', date: '2026-06-12', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Client payment received - Lakeside Medical Apr invoice', debit: 210000, credit: 0, balance: 1055000, projectId: 4, category: 'asset', reference: 'REC-2026-10' },
  { id: 'GL-082', date: '2026-06-15', accountCode: '5100', accountName: 'Subcontractor Costs', description: 'CoolAir Mechanical - AHU startup PA-003 Medical Center', debit: 62000, credit: 0, balance: 672700, projectId: 4, category: 'expense', reference: 'AP-044' },
  { id: 'GL-083', date: '2026-06-20', accountCode: '4000', accountName: 'Revenue', description: 'Progress billing - Industrial Park Warehouse Jun', debit: 0, credit: 120000, balance: 2125000, projectId: 8, category: 'revenue', reference: 'INV-036' },
  { id: 'GL-084', date: '2026-06-25', accountCode: '5000', accountName: 'Direct Job Costs', description: 'Equipment rental - crane & hoist Jun', debit: 32000, credit: 0, balance: 300000, projectId: 8, category: 'expense', reference: 'EQ-2026-008' },
  { id: 'GL-085', date: '2026-06-28', accountCode: '6000', accountName: 'Payroll Expense', description: 'Jun 2026 payroll', debit: 165000, credit: 0, balance: 1397000, category: 'expense', reference: 'PR-2026-06' },
  { id: 'GL-086', date: '2026-06-28', accountCode: '6100', accountName: 'General & Admin', description: 'Jun 2026 overhead', debit: 45000, credit: 0, balance: 337000, category: 'expense', reference: 'OH-2026-06' },
  { id: 'GL-087', date: '2026-06-30', accountCode: '2300', accountName: 'Current Portion of Debt', description: 'Equipment loan payment - Jun', debit: 4000, credit: 0, balance: 36000, category: 'liability', reference: 'LOAN-2026-06' },
  { id: 'GL-088', date: '2026-06-30', accountCode: '1000', accountName: 'Cash & Equivalents', description: 'Equipment loan payment disbursement', debit: 0, credit: 4000, balance: 1051000, category: 'asset', reference: 'LOAN-2026-06' },
];

// ---------------------------------------------------------------------------
// Purchase Orders
// ---------------------------------------------------------------------------
export const PURCHASE_ORDERS: PurchaseOrder[] = [
  { id: 'PO-001', poNumber: 'PO-2025-101', vendor: 'Allied Steel Fabricators', projectId: 1, project: 'Riverside Office Complex', description: 'Structural steel beams - Phase 2', amount: 145000, amountReceived: 145000, status: 'received', issueDate: '2025-10-02', expectedDelivery: '2025-10-28', receivedDate: '2025-10-25', costCode: '5200', lineItems: 8, linkedContractId: 'CON-003' },
  { id: 'PO-002', poNumber: 'PO-2025-102', vendor: 'ProWall Drywall Systems', projectId: 1, project: 'Riverside Office Complex', description: 'Drywall materials - levels 1-3', amount: 42500, amountReceived: 42500, status: 'received', issueDate: '2025-10-10', expectedDelivery: '2025-11-05', receivedDate: '2025-11-03', costCode: '5100', lineItems: 12, linkedContractId: 'CON-006' },
  { id: 'PO-003', poNumber: 'PO-2025-103', vendor: 'BrightSpark Electric Supply', projectId: 2, project: 'Greenfield Data Center', description: 'Main switchgear and distribution panels', amount: 218000, amountReceived: 218000, status: 'received', issueDate: '2025-10-15', expectedDelivery: '2025-11-20', receivedDate: '2025-11-18', costCode: '5300', lineItems: 6 },
  { id: 'PO-004', poNumber: 'PO-2025-104', vendor: 'PacificAir HVAC', projectId: 3, project: 'Harbor View Hotel Renovation', description: 'HVAC units - guest room floors', amount: 87000, amountReceived: 87000, status: 'received', issueDate: '2025-11-01', expectedDelivery: '2025-12-10', receivedDate: '2025-12-08', costCode: '5400', lineItems: 4 },
  { id: 'PO-005', poNumber: 'PO-2025-105', vendor: 'Consolidated Concrete', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Ready-mix concrete - foundation pour', amount: 62000, amountReceived: 62000, status: 'received', issueDate: '2025-11-12', expectedDelivery: '2025-11-22', receivedDate: '2025-11-20', costCode: '5200', lineItems: 3 },
  { id: 'PO-006', poNumber: 'PO-2025-106', vendor: 'National Lumber Co.', projectId: 5, project: 'Sunset Heights Residences', description: 'Framing lumber and engineered joists', amount: 95000, amountReceived: 95000, status: 'closed', issueDate: '2025-11-20', expectedDelivery: '2025-12-15', receivedDate: '2025-12-12', costCode: '5100', lineItems: 15 },
  { id: 'PO-007', poNumber: 'PO-2025-107', vendor: 'Metro Glass & Glazing', projectId: 1, project: 'Riverside Office Complex', description: 'Curtain wall glazing system', amount: 175000, amountReceived: 130000, status: 'partially-received', issueDate: '2025-12-01', expectedDelivery: '2026-01-15', receivedDate: '2026-01-10', costCode: '5500', lineItems: 5 },
  { id: 'PO-008', poNumber: 'PO-2026-001', vendor: 'Apex Electrical Services', projectId: 2, project: 'Greenfield Data Center', description: 'UPS systems and backup generators', amount: 340000, amountReceived: 170000, status: 'partially-received', issueDate: '2026-01-05', expectedDelivery: '2026-02-20', costCode: '5300', lineItems: 4, linkedContractId: 'CON-004' },
  { id: 'PO-009', poNumber: 'PO-2026-002', vendor: 'SteelPro Fabrication', projectId: 6, project: 'Metro Bridge Rehabilitation', description: 'Bridge deck reinforcement steel', amount: 192000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-01-15', expectedDelivery: '2026-03-01', costCode: '5200', lineItems: 7 },
  { id: 'PO-010', poNumber: 'PO-2026-003', vendor: 'PacificAir HVAC', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Rooftop HVAC units - commercial floors', amount: 124000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-01-20', expectedDelivery: '2026-03-10', costCode: '5400', lineItems: 3 },
  { id: 'PO-011', poNumber: 'PO-2026-004', vendor: 'Valley Plumbing Supply', projectId: 3, project: 'Harbor View Hotel Renovation', description: 'Plumbing fixtures - guest bathrooms', amount: 56000, amountReceived: 56000, status: 'received', issueDate: '2026-01-25', expectedDelivery: '2026-02-15', receivedDate: '2026-02-14', costCode: '5100', lineItems: 18 },
  { id: 'PO-012', poNumber: 'PO-2026-005', vendor: 'Allied Steel Fabricators', projectId: 7, project: 'TechPark Innovation Campus', description: 'Structural columns and beams - Building A', amount: 265000, amountReceived: 0, status: 'issued', issueDate: '2026-02-01', expectedDelivery: '2026-04-01', costCode: '5200', lineItems: 10 },
  { id: 'PO-013', poNumber: 'PO-2026-006', vendor: 'RoofMasters Inc.', projectId: 5, project: 'Sunset Heights Residences', description: 'Roofing materials - all buildings', amount: 78000, amountReceived: 78000, status: 'received', issueDate: '2026-02-05', expectedDelivery: '2026-02-25', receivedDate: '2026-02-24', costCode: '5500', lineItems: 6 },
  { id: 'PO-014', poNumber: 'PO-2026-007', vendor: 'BrightSpark Electric Supply', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Electrical panels and wiring - floors 1-6', amount: 115000, amountReceived: 0, status: 'issued', issueDate: '2026-02-10', expectedDelivery: '2026-03-25', costCode: '5300', lineItems: 9 },
  { id: 'PO-015', poNumber: 'PO-2026-008', vendor: 'FireSafe Solutions', projectId: 1, project: 'Riverside Office Complex', description: 'Fire suppression system - all floors', amount: 89000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-02-15', expectedDelivery: '2026-03-20', costCode: '5400', lineItems: 4 },
  { id: 'PO-016', poNumber: 'PO-2026-009', vendor: 'Consolidated Concrete', projectId: 7, project: 'TechPark Innovation Campus', description: 'Foundation concrete - Building B', amount: 85000, amountReceived: 0, status: 'issued', issueDate: '2026-02-20', expectedDelivery: '2026-03-15', costCode: '5200', lineItems: 3 },
  { id: 'PO-017', poNumber: 'PO-2026-010', vendor: 'National Lumber Co.', projectId: 8, project: 'Lakeside Community Center', description: 'Timber framing and decking materials', amount: 48000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-02-25', expectedDelivery: '2026-03-20', costCode: '5100', lineItems: 11 },
  { id: 'PO-018', poNumber: 'PO-2026-011', vendor: 'Metro Glass & Glazing', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Storefront glazing - retail levels', amount: 92000, amountReceived: 0, status: 'draft', issueDate: '2026-03-01', expectedDelivery: '2026-04-15', costCode: '5500', lineItems: 5 },
  { id: 'PO-019', poNumber: 'PO-2026-012', vendor: 'ProWall Drywall Systems', projectId: 7, project: 'TechPark Innovation Campus', description: 'Interior partition systems - Building A', amount: 67000, amountReceived: 0, status: 'draft', issueDate: '2026-03-05', expectedDelivery: '2026-04-20', costCode: '5100', lineItems: 8 },
  { id: 'PO-020', poNumber: 'PO-2026-013', vendor: 'PacificAir HVAC', projectId: 7, project: 'TechPark Innovation Campus', description: 'HVAC system - Building A', amount: 156000, amountReceived: 0, status: 'draft', issueDate: '2026-03-10', expectedDelivery: '2026-05-01', costCode: '5400', lineItems: 4 },
  { id: 'PO-021', poNumber: 'PO-2026-014', vendor: 'Apex Electrical Services', projectId: 8, project: 'Lakeside Community Center', description: 'Electrical rough-in materials', amount: 38000, amountReceived: 0, status: 'issued', issueDate: '2026-03-12', expectedDelivery: '2026-04-05', costCode: '5300', lineItems: 7 },
  { id: 'PO-022', poNumber: 'PO-2026-015', vendor: 'Valley Plumbing Supply', projectId: 5, project: 'Sunset Heights Residences', description: 'Plumbing rough-in - Buildings C-D', amount: 43000, amountReceived: 0, status: 'issued', issueDate: '2026-03-15', expectedDelivery: '2026-04-10', costCode: '5100', lineItems: 14 },
  { id: 'PO-023', poNumber: 'PO-2026-016', vendor: 'ElevatorTech Inc.', projectId: 1, project: 'Riverside Office Complex', description: 'Elevator cab and components', amount: 285000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-03-18', expectedDelivery: '2026-05-15', costCode: '5600', lineItems: 2 },
  { id: 'PO-024', poNumber: 'PO-2026-017', vendor: 'SteelPro Fabrication', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Misc metals and stair fabrication', amount: 54000, amountReceived: 0, status: 'issued', issueDate: '2026-03-20', expectedDelivery: '2026-04-25', costCode: '5200', lineItems: 5 },
  { id: 'PO-025', poNumber: 'PO-2026-018', vendor: 'Consolidated Concrete', projectId: 8, project: 'Lakeside Community Center', description: 'Slab-on-grade and site concrete', amount: 35000, amountReceived: 0, status: 'draft', issueDate: '2026-03-25', expectedDelivery: '2026-04-20', costCode: '5200', lineItems: 3 },
  // --- Apr 2026 ---
  { id: 'PO-026', poNumber: 'PO-2026-019', vendor: 'Hilti Distribution', projectId: 1, project: 'Riverside Office Complex', description: 'Curtain wall anchoring system', amount: 68000, amountReceived: 0, status: 'issued', issueDate: '2026-04-02', expectedDelivery: '2026-05-01', costCode: '5200', lineItems: 8 },
  { id: 'PO-027', poNumber: 'PO-2026-020', vendor: 'Trimble Mechanical Supply', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Rooftop AHU units and ductwork', amount: 142000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-04-08', expectedDelivery: '2026-05-20', costCode: '5400', lineItems: 6 },
  { id: 'PO-028', poNumber: 'PO-2026-021', vendor: 'Pacific Windows & Glass', projectId: 2, project: 'Harbor Heights Tower', description: 'Floor-to-ceiling glazing units 15-20', amount: 195000, amountReceived: 0, status: 'issued', issueDate: '2026-04-15', expectedDelivery: '2026-06-10', costCode: '5800', lineItems: 4 },
  // --- May 2026 ---
  { id: 'PO-029', poNumber: 'PO-2026-022', vendor: 'National Electrical Supply', projectId: 3, project: 'Downtown Transit Hub', description: 'Platform lighting fixtures and conduit', amount: 87000, amountReceived: 52000, status: 'partially-received', issueDate: '2026-05-01', expectedDelivery: '2026-05-28', receivedDate: '2026-05-15', costCode: '5100', lineItems: 12 },
  { id: 'PO-030', poNumber: 'PO-2026-023', vendor: 'Valley Plumbing Supply', projectId: 7, project: 'Sunset Heights Residences', description: 'Finish plumbing fixtures all units', amount: 56000, amountReceived: 0, status: 'issued', issueDate: '2026-05-10', expectedDelivery: '2026-06-05', costCode: '5100', lineItems: 18 },
  { id: 'PO-031', poNumber: 'PO-2026-024', vendor: 'FireSafe Equipment Co.', projectId: 8, project: 'Lakeside Community Center', description: 'ESFR sprinkler heads and piping', amount: 41000, amountReceived: 0, status: 'acknowledged', issueDate: '2026-05-18', expectedDelivery: '2026-06-15', costCode: '5100', lineItems: 7 },
  // --- Jun 2026 ---
  { id: 'PO-032', poNumber: 'PO-2026-025', vendor: 'SteelPro Fabrication', projectId: 6, project: 'Metro Bridge Rehabilitation', description: 'Decorative railing assemblies piers 1-8', amount: 78000, amountReceived: 0, status: 'issued', issueDate: '2026-06-03', expectedDelivery: '2026-07-15', costCode: '5200', lineItems: 4 },
  { id: 'PO-033', poNumber: 'PO-2026-026', vendor: 'Consolidated Concrete', projectId: 5, project: 'Westfield Shopping Center', description: 'Parking structure topping slab concrete', amount: 62000, amountReceived: 0, status: 'draft', issueDate: '2026-06-12', expectedDelivery: '2026-07-01', costCode: '5200', lineItems: 3 },
  { id: 'PO-034', poNumber: 'PO-2026-027', vendor: 'Hilti Distribution', projectId: 4, project: 'Eastside Mixed-Use Development', description: 'Post-installed anchors and firestopping', amount: 24000, amountReceived: 0, status: 'issued', issueDate: '2026-06-20', expectedDelivery: '2026-07-08', costCode: '5900', lineItems: 6 },
];

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------
export const PAYROLL_RECORDS: PayrollRecord[] = [
  { id: 'PR-001', period: 'Oct 2025 - Wk1', periodStart: '2025-10-01', periodEnd: '2025-10-07', payDate: '2025-10-10', status: 'processed', grossPay: 72500, taxes: 15950, benefits: 8700, netPay: 47850, employeeCount: 42, totalHours: 1680, overtimeHours: 45, frequency: 'weekly' },
  { id: 'PR-002', period: 'Oct 2025 - Wk2', periodStart: '2025-10-08', periodEnd: '2025-10-14', payDate: '2025-10-17', status: 'processed', grossPay: 74200, taxes: 16324, benefits: 8700, netPay: 49176, employeeCount: 43, totalHours: 1720, overtimeHours: 52, frequency: 'weekly' },
  { id: 'PR-003', period: 'Oct 2025 - Wk3', periodStart: '2025-10-15', periodEnd: '2025-10-21', payDate: '2025-10-24', status: 'processed', grossPay: 71800, taxes: 15796, benefits: 8700, netPay: 47304, employeeCount: 42, totalHours: 1680, overtimeHours: 38, frequency: 'weekly' },
  { id: 'PR-004', period: 'Oct 2025 - Wk4', periodStart: '2025-10-22', periodEnd: '2025-10-31', payDate: '2025-10-31', status: 'processed', grossPay: 76100, taxes: 16742, benefits: 8700, netPay: 50658, employeeCount: 44, totalHours: 1760, overtimeHours: 62, frequency: 'weekly' },
  { id: 'PR-005', period: 'Nov 2025 - Wk1', periodStart: '2025-11-01', periodEnd: '2025-11-07', payDate: '2025-11-10', status: 'processed', grossPay: 75600, taxes: 16632, benefits: 8900, netPay: 50068, employeeCount: 44, totalHours: 1760, overtimeHours: 55, frequency: 'weekly' },
  { id: 'PR-006', period: 'Nov 2025 - Wk2', periodStart: '2025-11-08', periodEnd: '2025-11-14', payDate: '2025-11-17', status: 'processed', grossPay: 73900, taxes: 16258, benefits: 8900, netPay: 48742, employeeCount: 43, totalHours: 1720, overtimeHours: 48, frequency: 'weekly' },
  { id: 'PR-007', period: 'Nov 2025 - Wk3', periodStart: '2025-11-15', periodEnd: '2025-11-21', payDate: '2025-11-24', status: 'processed', grossPay: 68500, taxes: 15070, benefits: 8900, netPay: 44530, employeeCount: 42, totalHours: 1600, overtimeHours: 22, frequency: 'weekly' },
  { id: 'PR-008', period: 'Nov 2025 - Wk4', periodStart: '2025-11-22', periodEnd: '2025-11-30', payDate: '2025-11-28', status: 'processed', grossPay: 70200, taxes: 15444, benefits: 8900, netPay: 45856, employeeCount: 42, totalHours: 1640, overtimeHours: 30, frequency: 'weekly' },
  { id: 'PR-009', period: 'Dec 2025 - Wk1', periodStart: '2025-12-01', periodEnd: '2025-12-07', payDate: '2025-12-10', status: 'processed', grossPay: 77300, taxes: 17006, benefits: 9100, netPay: 51194, employeeCount: 45, totalHours: 1800, overtimeHours: 65, frequency: 'weekly' },
  { id: 'PR-010', period: 'Dec 2025 - Wk2', periodStart: '2025-12-08', periodEnd: '2025-12-14', payDate: '2025-12-17', status: 'processed', grossPay: 76800, taxes: 16896, benefits: 9100, netPay: 50804, employeeCount: 45, totalHours: 1800, overtimeHours: 60, frequency: 'weekly' },
  { id: 'PR-011', period: 'Dec 2025 - Wk3', periodStart: '2025-12-15', periodEnd: '2025-12-21', payDate: '2025-12-24', status: 'processed', grossPay: 79500, taxes: 17490, benefits: 9100, netPay: 52910, employeeCount: 46, totalHours: 1840, overtimeHours: 72, frequency: 'weekly' },
  { id: 'PR-012', period: 'Dec 2025 - Wk4', periodStart: '2025-12-22', periodEnd: '2025-12-31', payDate: '2025-12-31', status: 'processed', grossPay: 65200, taxes: 14344, benefits: 9100, netPay: 41756, employeeCount: 44, totalHours: 1520, overtimeHours: 15, frequency: 'weekly' },
  { id: 'PR-013', period: 'Jan 2026 - Wk1', periodStart: '2026-01-01', periodEnd: '2026-01-07', payDate: '2026-01-10', status: 'processed', grossPay: 74800, taxes: 16456, benefits: 9200, netPay: 49144, employeeCount: 44, totalHours: 1720, overtimeHours: 42, frequency: 'weekly' },
  { id: 'PR-014', period: 'Jan 2026 - Wk2', periodStart: '2026-01-08', periodEnd: '2026-01-14', payDate: '2026-01-17', status: 'processed', grossPay: 76500, taxes: 16830, benefits: 9200, netPay: 50470, employeeCount: 45, totalHours: 1800, overtimeHours: 58, frequency: 'weekly' },
  { id: 'PR-015', period: 'Jan 2026 - Wk3', periodStart: '2026-01-15', periodEnd: '2026-01-21', payDate: '2026-01-24', status: 'processed', grossPay: 78200, taxes: 17204, benefits: 9200, netPay: 51796, employeeCount: 46, totalHours: 1840, overtimeHours: 68, frequency: 'weekly' },
  { id: 'PR-016', period: 'Jan 2026 - Wk4', periodStart: '2026-01-22', periodEnd: '2026-01-31', payDate: '2026-01-31', status: 'processed', grossPay: 77400, taxes: 17028, benefits: 9200, netPay: 51172, employeeCount: 45, totalHours: 1800, overtimeHours: 60, frequency: 'weekly' },
  { id: 'PR-017', period: 'Feb 2026 - Wk1', periodStart: '2026-02-01', periodEnd: '2026-02-07', payDate: '2026-02-10', status: 'processed', grossPay: 79800, taxes: 17556, benefits: 9400, netPay: 52844, employeeCount: 47, totalHours: 1880, overtimeHours: 75, frequency: 'weekly' },
  { id: 'PR-018', period: 'Feb 2026 - Wk2', periodStart: '2026-02-08', periodEnd: '2026-02-14', payDate: '2026-02-17', status: 'processed', grossPay: 81200, taxes: 17864, benefits: 9400, netPay: 53936, employeeCount: 47, totalHours: 1880, overtimeHours: 80, frequency: 'weekly' },
  { id: 'PR-019', period: 'Feb 2026 - Wk3', periodStart: '2026-02-15', periodEnd: '2026-02-21', payDate: '2026-02-24', status: 'processed', grossPay: 80500, taxes: 17710, benefits: 9400, netPay: 53390, employeeCount: 47, totalHours: 1880, overtimeHours: 78, frequency: 'weekly' },
  { id: 'PR-020', period: 'Feb 2026 - Wk4', periodStart: '2026-02-22', periodEnd: '2026-02-28', payDate: '2026-02-28', status: 'processed', grossPay: 78900, taxes: 17358, benefits: 9400, netPay: 52142, employeeCount: 46, totalHours: 1840, overtimeHours: 65, frequency: 'weekly' },
  { id: 'PR-021', period: 'Mar 2026 - Wk1', periodStart: '2026-03-01', periodEnd: '2026-03-07', payDate: '2026-03-10', status: 'processed', grossPay: 82400, taxes: 18128, benefits: 9500, netPay: 54772, employeeCount: 48, totalHours: 1920, overtimeHours: 82, frequency: 'weekly' },
  { id: 'PR-022', period: 'Mar 2026 - Wk2', periodStart: '2026-03-08', periodEnd: '2026-03-14', payDate: '2026-03-17', status: 'processed', grossPay: 83100, taxes: 18282, benefits: 9500, netPay: 55318, employeeCount: 48, totalHours: 1920, overtimeHours: 85, frequency: 'weekly' },
  { id: 'PR-023', period: 'Mar 2026 - Wk3', periodStart: '2026-03-15', periodEnd: '2026-03-21', payDate: '2026-03-24', status: 'processed', grossPay: 81700, taxes: 17974, benefits: 9500, netPay: 54226, employeeCount: 48, totalHours: 1920, overtimeHours: 80, frequency: 'weekly' },
  { id: 'PR-024', period: 'Mar 2026 - Wk4', periodStart: '2026-03-22', periodEnd: '2026-03-28', payDate: '2026-03-28', status: 'pending', grossPay: 84200, taxes: 18524, benefits: 9500, netPay: 56176, employeeCount: 49, totalHours: 1960, overtimeHours: 88, frequency: 'weekly' },
  { id: 'PR-025', period: 'Mar 2026 - Wk5', periodStart: '2026-03-29', periodEnd: '2026-03-31', payDate: '2026-04-03', status: 'scheduled', grossPay: 36200, taxes: 7964, benefits: 4100, netPay: 24136, employeeCount: 49, totalHours: 840, overtimeHours: 18, frequency: 'weekly' },
];

// ---------------------------------------------------------------------------
// Subcontract Ledger Entries
// ---------------------------------------------------------------------------
export const SUBCONTRACT_LEDGER: SubcontractLedgerEntry[] = [
  { id: 'SL-001', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'payment', description: 'Pay App #1 -- Rough-in electrical 40% complete', amount: 48000, date: '2026-01-31', payApp: 'PA-001', invoiceRef: 'AEI-2026-0114', period: 'Jan 2026', runningBalance: 86500 },
  { id: 'SL-002', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -4800, date: '2026-01-31', payApp: 'PA-001', period: 'Jan 2026', runningBalance: 91300 },
  { id: 'SL-003', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'change-order', description: 'SCO-001 added panel upgrade scope', amount: 14500, date: '2026-02-10', payApp: 'CO', period: 'Feb 2026', runningBalance: 105800 },
  { id: 'SL-004', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'payment', description: 'Pay App #2 -- Panel install & conduit 75% complete', amount: 52500, date: '2026-02-28', payApp: 'PA-002', invoiceRef: 'AEI-2026-0228', period: 'Feb 2026', runningBalance: 53300 },
  { id: 'SL-005', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'retainage-held', description: 'Retainage held on PA-002 (10%)', amount: -5250, date: '2026-02-28', payApp: 'PA-002', period: 'Feb 2026', runningBalance: 58550 },
  { id: 'SL-006', subcontractId: 'SC-2026-002', vendor: 'ProWall Drywall LLC', projectId: 2, project: 'Harbor View Condominiums', type: 'payment', description: 'Pay App #1 -- Framing & drywall hang Bldg A', amount: 28000, date: '2026-02-28', payApp: 'PA-001', invoiceRef: 'PWD-2026-0301', period: 'Feb 2026', runningBalance: 43800 },
  { id: 'SL-007', subcontractId: 'SC-2026-002', vendor: 'ProWall Drywall LLC', projectId: 2, project: 'Harbor View Condominiums', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -2800, date: '2026-02-28', payApp: 'PA-001', period: 'Feb 2026', runningBalance: 46600 },
  { id: 'SL-008', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 3, project: 'Downtown Transit Hub', type: 'payment', description: 'Pay App #1 -- Below-grade membrane 60% complete', amount: 51000, date: '2026-01-15', payApp: 'PA-001', invoiceRef: 'WTS-2026-0115', period: 'Jan 2026', runningBalance: 62500 },
  { id: 'SL-009', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 3, project: 'Downtown Transit Hub', type: 'retainage-held', description: 'Retainage held on PA-001 (5%)', amount: -2550, date: '2026-01-15', payApp: 'PA-001', period: 'Jan 2026', runningBalance: 65050 },
  { id: 'SL-010', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 3, project: 'Downtown Transit Hub', type: 'change-order', description: 'SCO-003 additional deck coating scope', amount: 28500, date: '2026-01-20', payApp: 'CO', period: 'Jan 2026', runningBalance: 93550 },
  { id: 'SL-011', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 3, project: 'Downtown Transit Hub', type: 'payment', description: 'Pay App #2 -- Pit membranes & deck coatings 90% complete', amount: 45000, date: '2026-02-15', payApp: 'PA-002', invoiceRef: 'WTS-2026-0215', period: 'Feb 2026', runningBalance: 48550 },
  { id: 'SL-012', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'payment', description: 'Pay App #1 -- Ductwork rough-in 35% complete', amount: 62300, date: '2026-02-28', payApp: 'PA-001', invoiceRef: 'CAM-2026-0228', period: 'Feb 2026', runningBalance: 115700 },
  { id: 'SL-013', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -6230, date: '2026-02-28', payApp: 'PA-001', period: 'Feb 2026', runningBalance: 121930 },
  { id: 'SL-014', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'change-order', description: 'SCO-004 added surgical wing AHU', amount: 33000, date: '2026-03-05', payApp: 'CO', period: 'Mar 2026', runningBalance: 154930 },
  { id: 'SL-015', subcontractId: 'SC-2026-005', vendor: 'FireGuard Solutions', projectId: 5, project: 'Westfield Shopping Center', type: 'payment', description: 'Pay App #1 -- Sprinkler main runs 50% complete', amount: 24000, date: '2026-03-20', payApp: 'PA-001', invoiceRef: 'FGS-2026-0320', period: 'Mar 2026', runningBalance: 35200 },
  { id: 'SL-016', subcontractId: 'SC-2026-005', vendor: 'FireGuard Solutions', projectId: 5, project: 'Westfield Shopping Center', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -2400, date: '2026-03-20', payApp: 'PA-001', period: 'Mar 2026', runningBalance: 37600 },
  { id: 'SL-017', subcontractId: 'SC-2026-006', vendor: 'BridgeTech Concrete', projectId: 6, project: 'Metro Bridge Rehabilitation', type: 'payment', description: 'Pay App #1 -- Scarification & epoxy injection 70% complete', amount: 38500, date: '2026-01-31', payApp: 'PA-001', invoiceRef: 'BTC-2026-0131', period: 'Jan 2026', runningBalance: 35500 },
  { id: 'SL-018', subcontractId: 'SC-2026-006', vendor: 'BridgeTech Concrete', projectId: 6, project: 'Metro Bridge Rehabilitation', type: 'retainage-held', description: 'Retainage held on PA-001 (5%)', amount: -1925, date: '2026-01-31', payApp: 'PA-001', period: 'Jan 2026', runningBalance: 37425 },
  { id: 'SL-019', subcontractId: 'SC-2026-006', vendor: 'BridgeTech Concrete', projectId: 6, project: 'Metro Bridge Rehabilitation', type: 'backcharge', description: 'Backcharge -- debris cleanup not performed per spec', amount: -3200, date: '2026-02-14', payApp: 'BC-001', period: 'Feb 2026', runningBalance: 40625 },
  { id: 'SL-020', subcontractId: 'SC-2026-007', vendor: 'PipeFit Plumbing Co.', projectId: 7, project: 'Sunset Ridge Apartments', type: 'payment', description: 'Pay App #1 -- Rough-in plumbing Bldgs 1-3', amount: 36000, date: '2026-02-14', payApp: 'PA-001', invoiceRef: 'PFC-2026-0214', period: 'Feb 2026', runningBalance: 53500 },
  { id: 'SL-021', subcontractId: 'SC-2026-007', vendor: 'PipeFit Plumbing Co.', projectId: 7, project: 'Sunset Ridge Apartments', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -3600, date: '2026-02-14', payApp: 'PA-001', period: 'Feb 2026', runningBalance: 57100 },
  { id: 'SL-022', subcontractId: 'SC-2026-008', vendor: 'IronWorks Structural', projectId: 8, project: 'Industrial Park Warehouse', type: 'payment', description: 'Pay App #1 -- Joist & girder delivery + erection 25% complete', amount: 54000, date: '2026-03-15', payApp: 'PA-001', invoiceRef: 'IWS-2026-0315', period: 'Mar 2026', runningBalance: 162000 },
  { id: 'SL-023', subcontractId: 'SC-2026-008', vendor: 'IronWorks Structural', projectId: 8, project: 'Industrial Park Warehouse', type: 'retainage-held', description: 'Retainage held on PA-001 (10%)', amount: -5400, date: '2026-03-15', payApp: 'PA-001', period: 'Mar 2026', runningBalance: 167400 },
  { id: 'SL-024', subcontractId: 'SC-2026-010', vendor: 'DeepFound Shoring Inc.', projectId: 3, project: 'Downtown Transit Hub', type: 'payment', description: 'Pay App #1 -- Soldier piles & lagging 80% complete', amount: 104000, date: '2026-01-15', payApp: 'PA-001', invoiceRef: 'DFS-2026-0115', period: 'Jan 2026', runningBalance: 71000 },
  { id: 'SL-025', subcontractId: 'SC-2026-010', vendor: 'DeepFound Shoring Inc.', projectId: 3, project: 'Downtown Transit Hub', type: 'retainage-release', description: 'Partial retainage release -- shoring phase complete', amount: 3500, date: '2026-03-01', payApp: 'RR-001', period: 'Mar 2026', runningBalance: 67500 },
  // --- Apr 2026 ---
  { id: 'SL-026', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'payment', description: 'Pay App #2 -- Rough-in electrical 75% complete', amount: 52000, date: '2026-04-15', payApp: 'PA-002', invoiceRef: 'AEI-2026-0415', period: 'Apr 2026', runningBalance: 34500 },
  { id: 'SL-027', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'retainage-held', description: 'Retainage held on PA-002 (10%)', amount: -5200, date: '2026-04-15', payApp: 'PA-002', period: 'Apr 2026', runningBalance: 39700 },
  { id: 'SL-028', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 2, project: 'Harbor View Condominiums', type: 'payment', description: 'Pay App #3 -- Roof membrane 100% complete', amount: 28000, date: '2026-04-10', payApp: 'PA-003', invoiceRef: 'WTS-2026-0410', period: 'Apr 2026', runningBalance: 0 },
  { id: 'SL-029', subcontractId: 'SC-2026-005', vendor: 'FireGuard Solutions', projectId: 3, project: 'Downtown Transit Hub', type: 'payment', description: 'Pay App #2 -- Sprinkler mains floors 4-6 complete', amount: 35000, date: '2026-04-20', payApp: 'PA-002', invoiceRef: 'FGS-2026-0420', period: 'Apr 2026', runningBalance: 25000 },
  { id: 'SL-030', subcontractId: 'SC-2026-005', vendor: 'FireGuard Solutions', projectId: 3, project: 'Downtown Transit Hub', type: 'retainage-held', description: 'Retainage held on PA-002 (10%)', amount: -3500, date: '2026-04-20', payApp: 'PA-002', period: 'Apr 2026', runningBalance: 28500 },
  { id: 'SL-031', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'change-order', description: 'CO: HVAC ductwork reroute in surgical wing', amount: 33000, date: '2026-04-25', payApp: 'CO-SCO-004', period: 'Apr 2026', runningBalance: 178000 },
  // --- May 2026 ---
  { id: 'SL-032', subcontractId: 'SC-2026-007', vendor: 'PipeFit Plumbing Co.', projectId: 7, project: 'Sunset Ridge Apartments', type: 'payment', description: 'Pay App #2 -- Plumbing top-out Bldgs 1-3', amount: 42000, date: '2026-05-05', payApp: 'PA-002', invoiceRef: 'PFC-2026-0505', period: 'May 2026', runningBalance: 11500 },
  { id: 'SL-033', subcontractId: 'SC-2026-007', vendor: 'PipeFit Plumbing Co.', projectId: 7, project: 'Sunset Ridge Apartments', type: 'retainage-held', description: 'Retainage held on PA-002 (10%)', amount: -4200, date: '2026-05-05', payApp: 'PA-002', period: 'May 2026', runningBalance: 15700 },
  { id: 'SL-034', subcontractId: 'SC-2026-008', vendor: 'IronWorks Structural', projectId: 8, project: 'Industrial Park Warehouse', type: 'payment', description: 'Pay App #2 -- Steel erection 60% complete', amount: 72000, date: '2026-05-15', payApp: 'PA-002', invoiceRef: 'IWS-2026-0515', period: 'May 2026', runningBalance: 90000 },
  { id: 'SL-035', subcontractId: 'SC-2026-008', vendor: 'IronWorks Structural', projectId: 8, project: 'Industrial Park Warehouse', type: 'retainage-held', description: 'Retainage held on PA-002 (10%)', amount: -7200, date: '2026-05-15', payApp: 'PA-002', period: 'May 2026', runningBalance: 97200 },
  { id: 'SL-036', subcontractId: 'SC-2026-006', vendor: 'BridgeTech Concrete', projectId: 6, project: 'Metro Bridge Rehabilitation', type: 'payment', description: 'Pay App #3 -- Deck overlay 80% complete', amount: 48000, date: '2026-05-20', payApp: 'PA-003', invoiceRef: 'BTC-2026-0520', period: 'May 2026', runningBalance: 32000 },
  { id: 'SL-037', subcontractId: 'SC-2026-010', vendor: 'DeepFound Shoring Inc.', projectId: 3, project: 'Downtown Transit Hub', type: 'retainage-release', description: 'Final retainage release -- shoring complete & accepted', amount: 7000, date: '2026-05-28', payApp: 'RR-002', period: 'May 2026', runningBalance: 60500 },
  // --- Jun 2026 ---
  { id: 'SL-038', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'payment', description: 'Pay App #3 -- Electrical trim & devices 90% complete', amount: 38000, date: '2026-06-10', payApp: 'PA-003', invoiceRef: 'AEI-2026-0610', period: 'Jun 2026', runningBalance: 0 },
  { id: 'SL-039', subcontractId: 'SC-2026-001', vendor: 'Apex Electrical Inc.', projectId: 1, project: 'Riverside Office Complex', type: 'retainage-release', description: 'Full retainage release -- electrical substantial completion', amount: 13400, date: '2026-06-25', payApp: 'RR-001', period: 'Jun 2026', runningBalance: 0 },
  { id: 'SL-040', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'payment', description: 'Pay App #3 -- AHU startup & TAB complete', amount: 62000, date: '2026-06-15', payApp: 'PA-003', invoiceRef: 'CAM-2026-0615', period: 'Jun 2026', runningBalance: 116000 },
  { id: 'SL-041', subcontractId: 'SC-2026-004', vendor: 'CoolAir Mechanical', projectId: 4, project: 'Lakeside Medical Center', type: 'retainage-held', description: 'Retainage held on PA-003 (10%)', amount: -6200, date: '2026-06-15', payApp: 'PA-003', period: 'Jun 2026', runningBalance: 122200 },
  { id: 'SL-042', subcontractId: 'SC-2026-003', vendor: 'WaterTight Systems', projectId: 2, project: 'Harbor View Condominiums', type: 'retainage-release', description: 'Full retainage release -- waterproofing warranty approved', amount: 8400, date: '2026-06-20', payApp: 'RR-001', period: 'Jun 2026', runningBalance: 0 },
];
