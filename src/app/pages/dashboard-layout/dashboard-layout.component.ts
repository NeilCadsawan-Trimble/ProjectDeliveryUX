import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardShellComponent } from '../../shell/layout/dashboard-shell.component';
import type { ShellNavItem, AiResponseFn } from '../../shell/layout/dashboard-shell.component';
import type { INavbarUserCard } from '../../components/modus-navbar.component';
import type { Project, Estimate } from '../../data/dashboard-data';
import { PROJECTS, ESTIMATES, ATTENTION_ITEMS } from '../../data/dashboard-data';

@Component({
  selector: 'app-dashboard-layout',
  imports: [DashboardShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dashboard-shell
      [appTitle]="appTitle"
      [userCard]="userCard"
      [sideNavItems]="sideNavItems"
      [homeRoute]="'/'"
      [aiResponseFn]="aiResponseFn"
      [defaultAiSuggestions]="defaultAiSuggestions"
      [aiWelcomeText]="'Ask me about projects, estimates, budgets, or team status.'"
      [aiPlaceholder]="'Ask about your projects...'"
    />
  `,
})
export class DashboardLayoutComponent {
  readonly appTitle = 'Project Delivery';

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

  readonly sideNavItems: ShellNavItem[] = [
    { value: 'home', label: 'Home', icon: 'home', route: '/' },
    { value: 'projects', label: 'Projects', icon: 'briefcase', route: '/projects' },
    { value: 'financials', label: 'Financials', icon: 'bar_graph', route: '/financials' },
  ];

  readonly defaultAiSuggestions: string[] = [
    'Summarize project status',
    'Which projects are at risk?',
    'Show overdue estimates',
    'What needs attention today?',
  ];

  readonly aiResponseFn: AiResponseFn = (input: string): string => {
    const q = input.toLowerCase();
    const projects: Project[] = PROJECTS;
    const estimates: Estimate[] = ESTIMATES;

    if (q.includes('at risk') || q.includes('risk')) {
      const atRisk = projects.filter((p) => p.status === 'At Risk').map((p) => p.name);
      return atRisk.length
        ? `${atRisk.length} project(s) are currently at risk: ${atRisk.join(', ')}. I recommend reviewing their timelines and resource allocations.`
        : 'Great news -- no projects are currently marked as at risk.';
    }
    if (q.includes('overdue')) {
      const overdue = projects.filter((p) => p.status === 'Overdue').map((p) => p.name);
      const overdueEst = estimates.filter((e) => e.daysLeft < 0).map((e) => e.id);
      const parts: string[] = [];
      if (overdue.length) parts.push(`${overdue.length} overdue project(s): ${overdue.join(', ')}`);
      if (overdueEst.length) parts.push(`${overdueEst.length} overdue estimate(s): ${overdueEst.join(', ')}`);
      return parts.length ? parts.join('. ') + '.' : 'Nothing is overdue right now.';
    }
    if (q.includes('project') && (q.includes('status') || q.includes('summar'))) {
      const counts: Record<string, number> = {};
      projects.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
      return 'Project summary: ' + Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ') + `. Total: ${projects.length} projects.`;
    }
    if (q.includes('estimate')) {
      const pending = estimates.filter((e) => e.status !== 'Approved').length;
      const total = estimates.reduce((sum, e) => sum + e.valueRaw, 0);
      return `There are ${estimates.length} open estimates with a combined value of $${(total / 1000).toFixed(0)}K. ${pending} estimate(s) are pending approval.`;
    }
    if (q.includes('budget')) {
      const over = projects.filter((p) => p.budgetPct >= 90).map((p) => p.name);
      return over.length
        ? `${over.length} project(s) are near or over budget: ${over.join(', ')}. Consider reviewing scope or requesting budget adjustments.`
        : 'All projects are within healthy budget ranges.';
    }
    if (q.includes('attention') || q.includes('today')) {
      return `You have ${ATTENTION_ITEMS.length} items that need attention, including overdue approvals and pending estimates. Check the "Needs Attention" widget for details.`;
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "Hello! I'm your Trimble AI Assistant. I can help you understand your project status, estimates, budgets, and more. What would you like to know?";
    }
    return 'I can help with project status, estimates, budgets, and team insights. Try asking "Which projects are at risk?" or "Summarize project status".';
  };
}
