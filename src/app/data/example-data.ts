import type { WidgetRegistration } from '../shell/services/widget-focus.service';
import type { ShellNavItem, AiResponseFn } from '../shell/layout/dashboard-shell.component';
import type { INavbarUserCard } from '../components/modus-navbar.component';

/**
 * Example data shapes for the Dashboard Starter Template.
 *
 * Teams can use these as a reference for building their own data layer.
 * Replace with real API calls or state management as needed.
 */

export interface ExampleProject {
  id: number;
  slug: string;
  name: string;
  client: string;
  ownerInitials: string;
  owner: string;
  status: 'On Track' | 'At Risk' | 'Overdue' | 'Planning';
  dueDate: string;
  progress: number;
  budgetPct: number;
  budgetUsed: string;
  budgetTotal: string;
}

export interface ExampleTask {
  id: number;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
}

export interface ExampleActivity {
  id: number;
  actorInitials: string;
  text: string;
  timeAgo: string;
  icon: string;
  iconColor: string;
}

export const EXAMPLE_PROJECTS: ExampleProject[] = [
  { id: 1, slug: 'alpha-project', name: 'Alpha Project', client: 'Acme Corp', ownerInitials: 'JD', owner: 'Jane Doe', status: 'On Track', dueDate: 'Apr 15, 2026', progress: 65, budgetPct: 55, budgetUsed: '$275K', budgetTotal: '$500K' },
  { id: 2, slug: 'beta-project', name: 'Beta Project', client: 'Globex Inc', ownerInitials: 'JS', owner: 'John Smith', status: 'At Risk', dueDate: 'Mar 30, 2026', progress: 40, budgetPct: 78, budgetUsed: '$195K', budgetTotal: '$250K' },
  { id: 3, slug: 'gamma-project', name: 'Gamma Project', client: 'Initech', ownerInitials: 'AM', owner: 'Alice Miller', status: 'Planning', dueDate: 'May 1, 2026', progress: 10, budgetPct: 5, budgetUsed: '$15K', budgetTotal: '$300K' },
];

export const EXAMPLE_TASKS: ExampleTask[] = [
  { id: 1, title: 'Design system review', assignee: 'Jane D.', status: 'in-progress', priority: 'high', dueDate: 'Mar 26' },
  { id: 2, title: 'API integration tests', assignee: 'John S.', status: 'todo', priority: 'medium', dueDate: 'Mar 28' },
  { id: 3, title: 'Deploy staging environment', assignee: 'Alice M.', status: 'done', priority: 'high', dueDate: 'Mar 24' },
  { id: 4, title: 'Security audit prep', assignee: 'Jane D.', status: 'blocked', priority: 'critical', dueDate: 'Mar 25' },
];

export const EXAMPLE_ACTIVITIES: ExampleActivity[] = [
  { id: 1, actorInitials: 'JD', text: 'updated Alpha Project milestone -- Phase 2 complete', timeAgo: '15 min ago', icon: 'check_circle', iconColor: 'text-success' },
  { id: 2, actorInitials: 'JS', text: 'flagged Beta Project budget at 78% -- review needed', timeAgo: '1 hr ago', icon: 'warning', iconColor: 'text-warning' },
  { id: 3, actorInitials: 'AM', text: 'created Gamma Project kickoff document', timeAgo: '3 hrs ago', icon: 'edit', iconColor: 'text-primary' },
];

export const EXAMPLE_NAV_ITEMS: ShellNavItem[] = [
  { value: 'home', label: 'Home', icon: 'home', route: '/' },
  { value: 'projects', label: 'Projects', icon: 'briefcase', route: '/projects' },
  { value: 'reports', label: 'Reports', icon: 'bar_graph', route: '/reports' },
];

export const EXAMPLE_USER_CARD: INavbarUserCard = {
  name: 'Alex Morgan',
  email: 'alex.morgan@example.com',
};

export const EXAMPLE_WIDGET_REGISTRATIONS: Record<string, WidgetRegistration> = {
  exSummary: {
    name: 'Summary',
    suggestions: [
      'Show me an overview',
      'What needs attention?',
      'How are projects doing?',
    ],
  },
  exProjects: {
    name: 'Projects',
    suggestions: [
      'Which projects are at risk?',
      'Show project timelines',
      'Compare project budgets',
    ],
  },
  exTasks: {
    name: 'Tasks',
    suggestions: [
      'Show overdue tasks',
      'What tasks are blocked?',
      'List high-priority items',
    ],
  },
  exActivity: {
    name: 'Activity',
    suggestions: [
      'What changed today?',
      'Show recent updates',
      'Who has been most active?',
    ],
  },
};

export const EXAMPLE_AI_SUGGESTIONS: string[] = [
  'Show me an overview',
  'Which items need attention?',
  'Summarize recent activity',
  'What is the budget status?',
];

export const EXAMPLE_AI_RESPONSE_FN: AiResponseFn = (input: string): string => {
  const q = input.toLowerCase();
  if (q.includes('overview') || q.includes('status') || q.includes('summar')) {
    return `You have ${EXAMPLE_PROJECTS.length} active projects. ${EXAMPLE_PROJECTS.filter(p => p.status === 'On Track').length} are on track, ${EXAMPLE_PROJECTS.filter(p => p.status === 'At Risk').length} at risk.`;
  }
  if (q.includes('risk')) {
    const atRisk = EXAMPLE_PROJECTS.filter(p => p.status === 'At Risk').map(p => p.name);
    return atRisk.length ? `At-risk projects: ${atRisk.join(', ')}` : 'No projects at risk.';
  }
  if (q.includes('task') || q.includes('blocked')) {
    const blocked = EXAMPLE_TASKS.filter(t => t.status === 'blocked');
    return blocked.length ? `${blocked.length} task(s) blocked: ${blocked.map(t => t.title).join(', ')}` : 'No blocked tasks.';
  }
  if (q.includes('budget')) {
    const high = EXAMPLE_PROJECTS.filter(p => p.budgetPct > 70).map(p => `${p.name} (${p.budgetPct}%)`);
    return high.length ? `Projects with high budget usage: ${high.join(', ')}` : 'All budgets are healthy.';
  }
  if (q.includes('activity') || q.includes('recent') || q.includes('changed')) {
    return `Recent activity: ${EXAMPLE_ACTIVITIES.map(a => a.text).join('; ')}`;
  }
  return 'I can help with project status, tasks, budgets, and activity. Try asking about specific topics.';
};
