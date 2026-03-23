import { Injectable, signal, computed } from '@angular/core';

export interface WidgetNameEntry {
  id: string;
  name: string;
  icon?: string;
}

const WIDGET_SUGGESTIONS: Record<string, string[]> = {
  homeTimeOff: [
    'How many time-off requests are pending?',
    'Who is out this week?',
    'Show upcoming PTO conflicts',
  ],
  homeCalendar: [
    'What meetings do I have today?',
    'Show my schedule for this week',
    'Are there any scheduling conflicts?',
  ],
  homeRfis: [
    'How many RFIs are open?',
    'Which RFIs are overdue?',
    'Summarize RFI response times',
  ],
  homeSubmittals: [
    'How many submittals are pending review?',
    'Which submittals are overdue?',
    'Summarize submittal approval rates',
  ],
  projects: [
    'Which projects are at risk?',
    'Summarize project status',
    'Show overdue projects',
  ],
  openEstimates: [
    'Show overdue estimates',
    'What is the total estimate pipeline value?',
    'Which estimates need approval?',
  ],
  recentActivity: [
    'What changed today?',
    'Show the most recent updates',
    'Who has been most active this week?',
  ],
  needsAttention: [
    'What needs attention today?',
    'Show critical items',
    'Which items are most urgent?',
  ],
  finBudgetByProject: [
    'Which projects are over budget?',
    'Show budget utilization summary',
    'What is the total spend vs. forecast?',
  ],
  milestones: [
    'Which milestones are coming up?',
    'Are any milestones at risk?',
    'Summarize milestone completion rate',
  ],
  tasks: [
    'Which tasks are overdue?',
    'Show high-priority tasks',
    'What tasks are blocked?',
  ],
  risks: [
    'What are the biggest risks right now?',
    'Show high-severity risks',
    'What risk mitigations are in place?',
  ],
  drawing: [
    'How many drawings need review?',
    'Show latest drawing revisions',
    'Are there any drawing approval bottlenecks?',
  ],
  budget: [
    'How is the budget tracking?',
    'Show spend vs. forecast',
    'Are we at risk of going over budget?',
  ],
  team: [
    'Who is assigned to this project?',
    'Show team availability',
    'Are there any resource conflicts?',
  ],
  activity: [
    'What changed recently on this project?',
    'Show the latest updates',
    'Who has been most active?',
  ],
};

const WIDGET_NAMES: Record<string, string> = {
  homeTimeOff: 'Time Off Requests',
  homeCalendar: 'Calendar',
  homeRfis: 'RFIs',
  homeSubmittals: 'Submittals',
  projects: 'Projects',
  openEstimates: 'Open Estimates',
  recentActivity: 'Recent Activity',
  needsAttention: 'Needs Attention',
  finBudgetByProject: 'Budget by Project',
  milestones: 'Milestones',
  tasks: 'Key Tasks',
  risks: 'Risks',
  drawing: 'Drawing',
  budget: 'Budget',
  team: 'Team',
  activity: 'Recent Activity',
};

@Injectable({
  providedIn: 'root',
})
export class WidgetFocusService {
  private readonly _selectedWidgetId = signal<string | null>(null);
  readonly selectedWidgetId = this._selectedWidgetId.asReadonly();

  readonly selectedWidgetName = computed(() => {
    const id = this._selectedWidgetId();
    if (!id) return null;
    return WIDGET_NAMES[id] ?? null;
  });

  readonly aiAssistantTitle = computed(() => {
    const name = this.selectedWidgetName();
    return name ?? 'Trimble AI';
  });

  readonly aiAssistantSubtitle = computed(() => {
    const name = this.selectedWidgetName();
    return name ? `Focused on ${name}` : 'Project Assistant';
  });

  readonly aiSuggestions = computed(() => {
    const id = this._selectedWidgetId();
    if (!id) return null;
    return WIDGET_SUGGESTIONS[id] ?? null;
  });

  selectWidget(id: string): void {
    this._selectedWidgetId.set(id);
  }

  clearSelection(): void {
    this._selectedWidgetId.set(null);
  }
}
