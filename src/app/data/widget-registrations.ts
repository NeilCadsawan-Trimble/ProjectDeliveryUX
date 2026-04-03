import type { WidgetRegistration } from '../shell/services/widget-focus.service';

export const HOME_WIDGETS: Record<string, WidgetRegistration> = {
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

export const FINANCIALS_WIDGETS: Record<string, WidgetRegistration> = {
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
  ...PROJECT_DETAIL_WIDGETS,
};
