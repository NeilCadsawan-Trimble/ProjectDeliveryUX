import type { WidgetRegistration } from '../shell/services/widget-focus.service';

export const HOME_WIDGETS: Record<string, WidgetRegistration> = {
  homeAllEstimates: {
    name: 'All Estimates',
    suggestions: [
      'Which estimates are awaiting approval?',
      'What is the total bidding pipeline value?',
      'Show estimates due this week',
    ],
  },
  homeTasks: {
    name: 'Tasks & action items',
    suggestions: [
      'What should I prioritize today?',
      'Which bidding tasks are overdue?',
      'Summarize schedule risks',
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
  homeTimeOff: {
    name: 'Time Off Requests',
    suggestions: [
      'How many time-off requests are pending?',
      'Who is out this week?',
      'Show upcoming PTO conflicts',
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
  projects: {
    name: 'Projects',
    suggestions: [
      'Which projects are at risk?',
      'Summarize project status',
      'Show overdue projects',
    ],
  },
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
