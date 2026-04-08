import type { WidgetRegistration } from '../shell/services/widget-focus.service';

export const HOME_WIDGETS: Record<string, WidgetRegistration> = {
  homeKpis: {
    name: 'Key Metrics',
    suggestions: [
      'What are the top priorities right now?',
      'Show portfolio health summary',
      'Which KPIs need attention?',
    ],
  },
  homeUrgentNeeds: {
    name: 'Urgent Needs',
    suggestions: [
      'What needs my attention right now?',
      'Show the most critical items',
      'Which projects have urgent issues?',
    ],
  },
  homeWeather: {
    name: 'Weather',
    suggestions: [
      'Will weather impact any projects this week?',
      'Show weather alerts for job sites',
      'What is the forecast for tomorrow?',
    ],
  },
  homeTimeOff: {
    name: 'Time Off Requests',
    suggestions: [
      'How many time-off requests are pending?',
      'Who is out this week?',
      'Show upcoming PTO conflicts',
    ],
  },
  homeCalendar: {
    name: 'Calendar',
    suggestions: [
      'What meetings do I have today?',
      'Show my schedule for this week',
      'Are there any scheduling conflicts?',
    ],
  },
  homeRfis: {
    name: 'RFIs',
    suggestions: [
      'How many RFIs are open?',
      'Which RFIs are overdue?',
      'Summarize RFI response times',
    ],
  },
  homeSubmittals: {
    name: 'Submittals',
    suggestions: [
      'How many submittals are pending review?',
      'Which submittals are overdue?',
      'Summarize submittal approval rates',
    ],
  },
  homeDrawings: {
    name: 'Drawings',
    suggestions: [
      'How many drawings need review?',
      'Show latest drawing revisions',
      'Which drawing sets are incomplete?',
    ],
  },
  homeRecentActivity: {
    name: 'Recent Activity',
    suggestions: [
      'What changed today?',
      'Show the most recent updates',
      'Who has been most active this week?',
    ],
  },
  homeMilestones: {
    name: 'Cross-Project Milestones',
    suggestions: [
      'Which milestones are coming due?',
      'Are any milestones overdue?',
      'Show milestone completion rate by project',
    ],
  },
  homeBudgetVariance: {
    name: 'Budget Variance',
    suggestions: [
      'Which projects are over budget?',
      'Show budget utilization across projects',
      'What is the total portfolio spend?',
    ],
  },
  homeChangeOrders: {
    name: 'Change Orders',
    suggestions: [
      'How many change orders are pending?',
      'What is the total pending CO value?',
      'Which projects have the most change orders?',
    ],
  },
  homeFieldOps: {
    name: 'Field Operations',
    suggestions: [
      'How many inspections failed?',
      'Show open punch list items',
      'Which projects have quality issues?',
    ],
  },
  homeDailyReports: {
    name: 'Daily Reports',
    suggestions: [
      'Show latest daily reports',
      'Any safety incidents reported?',
      'What is total crew count across sites?',
    ],
  },
  homeTeamAllocation: {
    name: 'Team Allocation',
    suggestions: [
      'Who is assigned to multiple projects?',
      'Which team members are overallocated?',
      'Show team availability by project',
    ],
  },
  homeContracts: {
    name: 'Contract Status',
    suggestions: [
      'How many contracts are active?',
      'Which contracts are pending approval?',
      'Are any contracts expiring soon?',
    ],
  },
};

export const KELLY_HOME_WIDGETS: Record<string, WidgetRegistration> = {
  homeApKpis: {
    name: 'AP Metrics',
    suggestions: [
      'How many invoices need my review?',
      'What is our total outstanding AP?',
      'Are there early-pay discounts I should capture?',
    ],
  },
  homeInvoiceQueue: {
    name: 'Invoice Queue',
    suggestions: [
      'Which invoices are overdue?',
      'Show invoices on hold and why',
      'What invoices came in today?',
    ],
  },
  homePaymentSchedule: {
    name: 'Payment Schedule',
    suggestions: [
      'What payments are due this week?',
      'Which payments have discount deadlines?',
      'Show the next two weeks of payments',
    ],
  },
  homeCalendar: {
    name: 'Calendar',
    suggestions: [
      'What AP deadlines do I have today?',
      'When is the next check run?',
      'Show my schedule for this week',
    ],
  },
  homeVendorAging: {
    name: 'Vendor Aging',
    suggestions: [
      'Which vendors have overdue aging?',
      'Show the 90+ day aging breakdown',
      'Who are our largest vendors by outstanding balance?',
    ],
  },
  homePayApps: {
    name: 'Pay Applications',
    suggestions: [
      'How many pay apps need review?',
      'What is the total pending net due?',
      'Show pay apps with the highest retention',
    ],
  },
  homeLienWaivers: {
    name: 'Lien Waivers',
    suggestions: [
      'Are there any lien waivers missing?',
      'Which waivers are blocking payment?',
      'Show lien waiver status by project',
    ],
  },
  homeRetention: {
    name: 'Retention Summary',
    suggestions: [
      'How much retention are we holding?',
      'Which projects have pending retention releases?',
      'What is the total retention by vendor?',
    ],
  },
  homeApActivity: {
    name: 'AP Activity',
    suggestions: [
      'What AP transactions happened today?',
      'Show recent payment activity',
      'Were any invoices placed on hold?',
    ],
  },
  homeCashOutflow: {
    name: 'Cash Outflow',
    suggestions: [
      'What is this week\'s projected outflow?',
      'How does this week compare to next week?',
      'Which payments are the largest this month?',
    ],
  },
};

export const PROJECTS_WIDGETS: Record<string, WidgetRegistration> = {
  openEstimates: {
    name: 'Open Estimates',
    suggestions: [
      'Show overdue estimates',
      'What is the total estimate pipeline value?',
      'Which estimates need approval?',
    ],
  },
  recentActivity: {
    name: 'Recent Activity',
    suggestions: [
      'What changed today?',
      'Show the most recent updates',
      'Who has been most active this week?',
    ],
  },
  needsAttention: {
    name: 'Needs Attention',
    suggestions: [
      'What needs attention today?',
      'Show critical items',
      'Which items are most urgent?',
    ],
  },
};

export const KELLY_FINANCIALS_WIDGETS: Record<string, WidgetRegistration> = {
  finTitle: {
    name: 'Financials Title',
    suggestions: [],
  },
  finNavKpi: {
    name: 'Financials Navigation & KPIs',
    suggestions: [
      'What financial modules are available?',
      'Navigate to accounts payable',
      'Show purchase orders',
    ],
  },
  finInvoiceQueue: {
    name: 'Invoice Queue',
    suggestions: [
      'Show pending invoices',
      'Which invoices are overdue?',
      'What is the oldest pending invoice?',
    ],
  },
  finPaymentSchedule: {
    name: 'Payment Schedule',
    suggestions: [
      'What payments are due this week?',
      'Show upcoming payment deadlines',
      'Which payments have discount opportunities?',
    ],
  },
  finVendorAging: {
    name: 'Vendor Aging',
    suggestions: [
      'Which vendors have overdue balances?',
      'Show vendor aging breakdown',
      'Who are our top vendors by outstanding balance?',
    ],
  },
  finPayApps: {
    name: 'Pay Applications',
    suggestions: [
      'Show pending pay applications',
      'Which pay apps need approval?',
      'What is the total pay app pipeline?',
    ],
  },
  finLienWaivers: {
    name: 'Lien Waivers',
    suggestions: [
      'Which lien waivers are missing?',
      'Show lien waiver status by project',
      'Any waivers expiring soon?',
    ],
  },
  finRetention: {
    name: 'Retention Summary',
    suggestions: [
      'What retention is pending release?',
      'Show retention held by project',
      'When is the next retention release?',
    ],
  },
  finApActivity: {
    name: 'AP Activity',
    suggestions: [
      'Show recent AP activity',
      'What payments were made this week?',
      'Any rejected invoices?',
    ],
  },
  finCashOutflow: {
    name: 'Cash Outflow',
    suggestions: [
      'What is the projected cash outflow?',
      'Show cash outflow trend',
      'Which months have the highest outflow?',
    ],
  },
  finAccountsPayable: {
    name: 'Accounts Payable',
    suggestions: [
      'What bills are coming due soon?',
      'Which payables are overdue?',
      'Show AP by vendor',
      'Show lien waiver status',
      'What retention is pending release?',
      'Any early-pay discounts available?',
    ],
  },
  finPurchaseOrders: {
    name: 'Purchase Orders',
    suggestions: [
      'How many POs are open?',
      'What is the total committed spend?',
      'Are any deliveries overdue?',
    ],
  },
  finCashManagement: {
    name: 'Cash Management',
    suggestions: [
      'What is our current cash position?',
      'How many months of runway?',
      'Show cash flow trend',
    ],
  },
};

export const FINANCIALS_WIDGETS: Record<string, WidgetRegistration> = {
  finTitle: {
    name: 'Financials Title',
    suggestions: [],
  },
  finNavKpi: {
    name: 'Financials Navigation & KPIs',
    suggestions: [
      'What financial modules are available?',
      'Navigate to accounts receivable',
      'Show me the payroll section',
    ],
  },
  finRevenueChart: {
    name: 'Revenue Chart',
    suggestions: [
      'What is total revenue this quarter?',
      'Show revenue trend over the last 12 months',
      'How does actual revenue compare to forecast?',
    ],
  },
  finOpenEstimates: {
    name: 'Open Estimates',
    suggestions: [
      'Show overdue estimates',
      'What is the total estimate pipeline value?',
      'Which estimates need approval?',
    ],
  },
  finJobCosts: {
    name: 'Job Costs',
    suggestions: [
      'Which projects have the highest job costs?',
      'Show cost breakdown by category',
      'Are any projects over their cost budget?',
    ],
  },
  finChangeOrders: {
    name: 'Change Orders',
    suggestions: [
      'How many change orders are pending?',
      'What is the total value of approved COs?',
      'Which projects have the most change orders?',
    ],
  },
  finBudgetByProject: {
    name: 'Budget by Project',
    suggestions: [
      'Which projects are over budget?',
      'Show budget utilization summary',
      'What is the total spend vs. forecast?',
    ],
  },
  finAccountsReceivable: {
    name: 'Accounts Receivable',
    suggestions: [
      'What is the total outstanding AR?',
      'Which invoices are overdue?',
      'What is our DSO?',
    ],
  },
  finAccountsPayable: {
    name: 'Accounts Payable',
    suggestions: [
      'What bills are coming due soon?',
      'Which payables are overdue?',
      'Show AP by vendor',
      'Show lien waiver status',
      'What retention is pending release?',
      'Any early-pay discounts available?',
    ],
  },
  finJobBilling: {
    name: 'Job Billing',
    suggestions: [
      'Which projects are due for billing?',
      'What is the total unbilled amount?',
      'Show billing history',
    ],
  },
  finCashManagement: {
    name: 'Cash Management',
    suggestions: [
      'What is our current cash position?',
      'How many months of runway?',
      'Show cash flow trend',
    ],
  },
  finGeneralLedger: {
    name: 'General Ledger',
    suggestions: [
      'Show account balances',
      'What are total assets vs liabilities?',
      'Show recent journal entries',
    ],
  },
  finPurchaseOrders: {
    name: 'Purchase Orders',
    suggestions: [
      'How many POs are open?',
      'What is the total committed spend?',
      'Are any deliveries overdue?',
    ],
  },
  finPayroll: {
    name: 'Payroll',
    suggestions: [
      'What is total payroll this month?',
      'How much overtime this period?',
      'What is the labor burden rate?',
    ],
  },
  finContracts: {
    name: 'Contracts',
    suggestions: [
      'What is the total contract value?',
      'How many subcontracts are active?',
      'Which contracts are pending approval?',
    ],
  },
  finSubcontractLedger: {
    name: 'Subcontract Ledger',
    suggestions: [
      'What is total paid to subcontractors?',
      'How much retainage is currently held?',
      'Show me recent backcharges',
    ],
  },
};

export const PROJECT_DETAIL_WIDGETS: Record<string, WidgetRegistration> = {
  milestones: {
    name: 'Milestones',
    suggestions: [
      'Which milestones are coming up?',
      'Are any milestones at risk?',
      'Summarize milestone completion rate',
    ],
  },
  tasks: {
    name: 'Key Tasks',
    suggestions: [
      'Which tasks are overdue?',
      'Show high-priority tasks',
      'What tasks are blocked?',
    ],
  },
  risks: {
    name: 'Risks',
    suggestions: [
      'What are the biggest risks right now?',
      'Show high-severity risks',
      'What risk mitigations are in place?',
    ],
  },
  drawing: {
    name: 'Drawing',
    suggestions: [
      'How many drawings need review?',
      'Show latest drawing revisions',
      'Are there any drawing approval bottlenecks?',
    ],
  },
  budget: {
    name: 'Budget',
    suggestions: [
      'How is the budget tracking?',
      'Show spend vs. forecast',
      'Are we at risk of going over budget?',
    ],
  },
  team: {
    name: 'Team',
    suggestions: [
      'Who is assigned to this project?',
      'Show team availability',
      'Are there any resource conflicts?',
    ],
  },
  activity: {
    name: 'Recent Activity',
    suggestions: [
      'What changed recently on this project?',
      'Show the latest updates',
      'Who has been most active?',
    ],
  },
};

export const ALL_WIDGETS: Record<string, WidgetRegistration> = {
  ...HOME_WIDGETS,
  ...PROJECTS_WIDGETS,
  ...FINANCIALS_WIDGETS,
  ...KELLY_FINANCIALS_WIDGETS,
  ...PROJECT_DETAIL_WIDGETS,
};
