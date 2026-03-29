---
name: agentic-widgets
description: Patterns for building and extending agentic widget capabilities -- insight lines, alert badges, dynamic suggestions, cross-agent references, per-agent conversation memory, navigable entity links, natural language actions, and portfolio meta-agents. Use when adding new widget agents, modifying agent behavior, extending the AI panel, or wiring agents to UI components.
---

# Agentic Widgets

This skill covers the full architecture for making dashboard widgets behave as autonomous agents. Each widget maps to a `WidgetAgent` that provides contextual intelligence, proactive alerts, and actionable capabilities beyond passive data display.

## When to Use

- Adding a new widget agent for a new data type or sub-page
- Extending agent behavior (insights, alerts, actions, cross-references)
- Modifying the AI panel UI or conversation flow
- Wiring agent data to widget frames, subnavs, or other UI elements
- Adding per-agent conversation memory or action execution
- Creating meta-agents for cross-cutting analysis

## Architecture Overview

### File Map

| File | Purpose |
|------|---------|
| `src/app/data/widget-agents.ts` | All agent definitions, interfaces, `getAgent()`, `getSuggestions()`, `getAllAgents()` |
| `src/app/shell/services/ai-panel-controller.ts` | Conversation memory, action execution, message streaming |
| `src/app/shell/components/ai-assistant-panel.component.ts` | AI panel UI -- suggestions, actions, markdown rendering |
| `src/app/shell/layout/dashboard-shell.component.ts` | Wires agents to AI panel via `AiPanelConfig` |
| `src/app/pages/project-dashboard/project-dashboard.component.ts` | Project-level agent wiring, insight/alert computeds |
| `src/app/pages/project-dashboard/components/widget-frame.component.ts` | Inline insight display on widget cards |
| `src/app/pages/project-dashboard/components/collapsible-subnav.component.ts` | Alert badges on nav items |

### Agent Resolution Chain

```
getAgent(widgetId, page, subContext?)
  1. If subContext exists and matches an agent ID → return that agent
  2. If widgetId matches an agent ID → return that agent
  3. Fall back to page default agent (homeDefault, projectsDefault, etc.)
```

## WidgetAgent Interface

Every agent must implement this interface:

```typescript
export interface WidgetAgent {
  id: string;
  name: string;
  systemPrompt: string;
  suggestions: string[] | ((s: AgentDataState) => string[]);
  buildContext: (s: AgentDataState) => string;
  localRespond: (query: string, s: AgentDataState) => string;
  insight?: (s: AgentDataState) => string | null;
  alerts?: (s: AgentDataState) => AgentAlert | null;
  actions?: (s: AgentDataState) => AgentAction[];
}
```

### Required Methods

| Method | Returns | Purpose |
|--------|---------|---------|
| `buildContext` | `string` | Serializes relevant data for LLM context window |
| `localRespond` | `string` | Keyword-based fast responses without API call |

### Optional Methods (Agentic Capabilities)

| Method | Returns | Purpose |
|--------|---------|---------|
| `insight` | `string \| null` | 1-line proactive insight shown on widget card header |
| `alerts` | `AgentAlert \| null` | Badge data shown on nav items and widget headers |
| `actions` | `AgentAction[]` | Quick actions the user can execute from the AI panel |

## 1. Inline Widget Insights

### What It Does

Surfaces a 1-line data-driven insight directly on the widget card, below the title. No AI panel interaction needed.

### Implementation Pattern

**Agent side** (`widget-agents.ts`):

```typescript
const myAgent: WidgetAgent = {
  // ...required fields...
  insight: (s) => {
    const overdue = (s.rfis ?? []).filter(r => r.status === 'Open' && isOverdue(r));
    if (overdue.length === 0) return null;
    return `${overdue.length} overdue, oldest ${maxDays(overdue)} days past due`;
  },
};
```

**UI side** (`widget-frame.component.ts`):

The `WidgetFrameComponent` has an `[insight]` input. Render in the header area:

```html
@if (insight()) {
  <div class="flex items-center gap-1.5 px-6 pb-3 -mt-1">
    <i class="modus-icons text-xs text-primary" aria-hidden="true">flash</i>
    <div class="text-xs text-foreground-60 truncate">{{ insight() }}</div>
  </div>
}
```

**Wiring** (dashboard component):

```typescript
getWidgetInsight(widgetId: string): string | null {
  const agent = getAgent(widgetId, 'project-dashboard');
  const state = this.buildAgentDataState();
  return agent.insight?.(state) ?? null;
}
```

```html
<app-widget-frame icon="clipboard" title="RFIs"
  [insight]="getWidgetInsight('recordsRfis')" ...>
```

### Rules

- Return `null` (not empty string) when there's nothing notable
- Keep insights under 60 characters -- they truncate with `truncate` class
- Detail agents (rfiDetail, submittalDetail, etc.) should return `null`
- Default/overview agents should return `null`
- Only surface genuinely useful information

## 2. Alert Badges

### What It Does

Shows color-coded count badges on subnav items and widget headers for concerning states.

### AgentAlert Interface

```typescript
export interface AgentAlert {
  level: 'info' | 'warning' | 'critical';
  count: number;
  label: string;
}
```

### Implementation Pattern

**Agent side**:

```typescript
alerts: (s) => {
  const overdue = (s.rfis ?? []).filter(r => r.status === 'Open' && isOverdue(r));
  if (overdue.length > 0) return { level: 'critical', count: overdue.length, label: 'overdue' };
  return null;
},
```

**UI side** (`collapsible-subnav.component.ts`):

The component accepts `[alerts]` as `Record<string, AgentAlert | null>` keyed by nav item value:

```html
<app-collapsible-subnav
  [alerts]="recordsAlerts()"
  ...
/>
```

**Computing alert maps** (dashboard component):

```typescript
readonly recordsAlerts = computed<Record<string, AgentAlert | null>>(() => {
  const state = this.buildAgentDataState();
  const map: Record<string, string> = {
    'rfis': 'recordsRfis',
    'submittals': 'recordsSubmittals',
    // ...nav value → agent ID
  };
  const result: Record<string, AgentAlert | null> = {};
  for (const [navValue, agentId] of Object.entries(map)) {
    const agent = getAgent(agentId, 'project-dashboard');
    result[navValue] = agent.alerts?.(state) ?? null;
  }
  return result;
});
```

### Badge Color Rules

| Level | Background | Use Case |
|-------|-----------|----------|
| `critical` | `bg-destructive` | Overdue items, failed inspections |
| `warning` | `bg-warning` | Budget > 80%, approaching deadlines |
| `info` | `bg-primary` | Informational counts |

### Rules

- Only return alerts for genuinely concerning states -- not just counts
- Detail agents return `null`
- Default agents return `null`
- `count` should be the number of affected items, not a severity score

## 3. Dynamic Suggestions

### What It Does

Suggestion chips in the AI panel adapt based on current data state instead of being static.

### Implementation Pattern

```typescript
suggestions: (s) => {
  const overdue = (s.rfis ?? []).filter(r => r.status === 'Open' && isOverdue(r));
  if (overdue.length > 0) {
    return [
      'Show overdue RFIs',
      'Draft escalation for overdue RFIs',
      'Summarize RFI status',
    ];
  }
  return [
    'Summarize RFI status',
    'Which RFIs need attention?',
    'Compare RFI response times',
  ];
},
```

**Resolution** (use `getSuggestions` helper):

```typescript
import { getSuggestions } from '../../data/widget-agents';

defaultSuggestions: computed(() => {
  const agent = getAgent(widgetId, page);
  const state = this.buildAgentDataState();
  return getSuggestions(agent, state);
}),
```

### Rules

- Keep 3-4 suggestions max
- If data doesn't meaningfully change suggestions, keep them as static `string[]`
- Most important/urgent suggestion goes first
- Use `getSuggestions()` everywhere -- never access `.suggestions` directly in computed signals

## 4. Cross-Agent Data References

### What It Does

Enriches `localRespond` so an agent can reference data from other domains when answering questions.

### Implementation Pattern

Add cross-references inside existing `localRespond` branches:

```typescript
localRespond: (q, s) => {
  if (kw(q, 'track', 'on track', 'status', 'overview')) {
    let response = `Budget is ${s.budgetPct}% utilized.`;
    // Cross-reference: mention pending change orders
    const pendingCOs = (s.changeOrders ?? []).filter(co => co.status === 'Pending');
    if (pendingCOs.length > 0) {
      const coTotal = pendingCOs.reduce((sum, co) => sum + co.amount, 0);
      response += ` Note: ${pendingCOs.length} pending change orders totaling $${Math.round(coTotal/1000)}K may impact the budget.`;
    }
    return response;
  }
  return '';
},
```

### Common Cross-Reference Pairs

| Agent | Cross-References | When |
|-------|-----------------|------|
| Budget | Change orders | Tracking/overview queries |
| Daily Reports | Weather forecast | Crew/hours queries |
| Inspections | Punch items | Failure queries |
| RFIs | Submittals | Status/overview queries |
| Tasks | Milestones | Progress queries |

### Rules

- Only add cross-references where they're genuinely useful
- Keep additions to 1-2 sentences max
- Don't duplicate the other agent's full response -- just reference the key data point
- Cross-references go at the end of the response, not the beginning

## 5. Per-Agent Conversation Memory

### What It Does

Each agent maintains its own chat history. Switching between widgets preserves conversations. Returning to an agent restores the prior conversation.

### Implementation

**`AiPanelController`** stores a `Map<string, { messages, counter }>`:

```typescript
private conversationMemory = new Map<string, { messages: AiMessage[]; counter: number }>();
```

**On widget focus change** (via effect):

```typescript
effect(() => {
  const widgetId = this.widgetFocusService.selectedWidgetId();
  const agentKey = widgetId ?? '__default__';
  const stored = this.conversationMemory.get(agentKey);
  if (stored) {
    this.messages.set(stored.messages);
    this.messageCounter = stored.counter;
  } else {
    this.messages.set([]);
    this.messageCounter = 0;
  }
}, { injector: config.injector });
```

**On message complete/error** -- save via `saveConversation()`:

```typescript
private saveConversation(): void {
  const agentKey = this.widgetFocusService.selectedWidgetId() ?? '__default__';
  this.conversationMemory.set(agentKey, {
    messages: this.messages(),
    counter: this.messageCounter,
  });
}
```

**Clear conversation** -- `clearConversation()` resets and saves:

```typescript
clearConversation(): void {
  this.messages.set([]);
  this.messageCounter = 0;
  this.saveConversation();
}
```

### Rules

- Always call `saveConversation()` in both `complete` and `error` handlers of the stream subscription
- Use `'__default__'` as the key when no widget is selected
- The "new conversation" button in the AI panel calls `clearConversation()`

## 6. Navigable Entity Links

### What It Does

Agent responses can contain markdown-style links and bold text that render as clickable, styled elements in the AI panel.

### Implementation

**`AiAssistantPanelComponent`** has a `renderMessage()` method:

```typescript
renderMessage(text: string): string {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  escaped = escaped.replace(
    /\*\*([^*]+)\*\*/g,
    '<div class="font-semibold inline">$1</div>'
  );

  escaped = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary underline hover:text-primary-80 cursor-pointer">$1</a>'
  );

  return escaped;
}
```

Assistant messages use `[innerHTML]`:

```html
<div class="... whitespace-pre-wrap" [innerHTML]="renderMessage(msg.text)"></div>
```

### Rules

- Always escape HTML first to prevent XSS
- Only parse `**bold**` and `[text](url)` markdown -- keep it simple
- Use `whitespace-pre-wrap` on the container so newlines render correctly
- Links use `text-primary` color to match design system

## 7. Natural Language Actions

### What It Does

Agents expose quick actions the user can execute directly from the AI panel without typing a message.

### AgentAction Interface

```typescript
export interface AgentAction {
  id: string;
  label: string;
  execute: (s: AgentDataState) => string;
}
```

### Implementation Pattern

**Agent side**:

```typescript
actions: (s) => {
  const actions: AgentAction[] = [];
  const overdue = (s.rfis ?? []).filter(r => r.status === 'Open' && isOverdue(r));
  if (overdue.length > 0) {
    actions.push({
      id: 'escalate-overdue',
      label: 'Escalate overdue RFIs',
      execute: () => `Escalated ${overdue.length} overdue RFIs to project managers.`,
    });
  }
  actions.push({
    id: 'export-rfis',
    label: 'Export RFI report',
    execute: () => 'RFI status report exported to PDF.',
  });
  return actions;
},
```

**Controller side** -- `actionsProvider` in `AiPanelConfig`:

```typescript
actionsProvider: () => {
  const agent = getAgent(widgetId, page);
  const state = this.buildAgentDataState();
  return agent.actions?.(state) ?? [];
},
```

**UI side** -- actions render as pills with lightning bolt icon:

- Empty state: "Quick Actions" section below suggestions
- After messages: floating pills below the last message

**Execution flow**:

```typescript
executeAction(action: AgentAction): void {
  this.messages.update(msgs => [
    ...msgs,
    { id: ++this.messageCounter, role: 'user', text: action.label },
  ]);
  const result = action.execute({});
  this.messages.update(msgs => [
    ...msgs,
    { id: ++this.messageCounter, role: 'assistant', text: result },
  ]);
  this.saveConversation();
}
```

### Rules

- Return 2-4 actions max per agent
- Actions should be contextual -- only show "Escalate overdue" if overdue items exist
- `execute()` returns a confirmation string (demo mode -- no real mutations)
- Detail agents get detail-level actions (mark resolved, reassign, etc.)
- Default/overview agents get navigation-type actions

## 8. Portfolio Meta-Agent

### What It Does

A cross-project agent that aggregates data from all projects to answer comparative questions.

### Implementation

```typescript
const portfolioAgent: WidgetAgent = {
  id: 'portfolio',
  name: 'Portfolio Analysis',
  systemPrompt: 'You are a portfolio-level analyst ...',
  suggestions: ['Compare budgets across projects', 'Which project has highest risk?', ...],
  buildContext: (s) => {
    // Pull from ALL data arrays, not just one project
    return `Projects: ${fmtProjects(s.projects ?? [])}\n...`;
  },
  localRespond: (q, s) => {
    if (kw(q, 'highest risk', 'most risk', 'riskiest')) {
      // Compare risk counts across projects
    }
    if (kw(q, 'compare budget', 'budget comparison')) {
      // Aggregate budget data
    }
    return '';
  },
};
```

### Rules

- Register in `ALL_AGENTS` as `portfolio: portfolioAgent`
- The portfolio agent is not wired to any specific widget -- it's accessed via `getAgent('portfolio', ...)`
- Its `buildContext` should be comprehensive but concise -- summarize, don't dump raw data
- `localRespond` should handle comparative queries (highest, lowest, compare, across)

## Adding a New Agent -- Checklist

1. **Define the agent** in `widget-agents.ts` with all required fields
2. **Add to `ALL_AGENTS`** record
3. **Implement `insight`** -- return data-driven 1-line string or null
4. **Implement `alerts`** -- return `AgentAlert` for concerning states or null
5. **Implement `actions`** -- return 2-4 contextual `AgentAction` objects
6. **Make `suggestions` dynamic** if data state meaningfully changes what to suggest
7. **Add cross-references** in `localRespond` where related data exists
8. **Wire to UI** -- pass insight to widget frame, alerts to subnav
9. **Verify** -- `npm run type-check && npm run test:static`

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| Always returning an insight even when data is normal | Return `null` when nothing notable |
| Alert badges on every nav item | Only for genuinely concerning states |
| Static suggestions when data could inform them | Use function form with `getSuggestions()` |
| Dumping full data in cross-references | 1-2 sentence additions referencing key data points |
| Accessing `.suggestions` directly | Always use `getSuggestions(agent, state)` |
| Actions that don't reflect current state | Conditionally include actions based on data |
| Forgetting `saveConversation()` in error handler | Always save in both complete and error |
| Action buttons without `route` for navigation | Include `route` on actions that open pages |
| Navigation actions using `window.location` | Use `router.navigate()` via `route` property |

## 9. Route-Based Actions

Actions can navigate the user to a specific page using Angular Router.

### AgentAction with Route

```typescript
export interface AgentAction {
  id: string;
  label: string;
  execute: (s: AgentDataState) => string;
  route?: string;  // Optional Angular route path
}
```

**Agent side**:

```typescript
actions: (s) => [
  {
    id: 'open-projects',
    label: 'Open Projects',
    execute: () => 'Opening Projects dashboard...',
    route: '/projects',
  },
],
```

**Controller** checks for `route` and calls `this.router.navigate([action.route])`.

### Rules

- Use `route` for navigation actions; omit for mutation actions
- Keep labels short (3-4 words) -- they render as pills

## 10. Domain-Specific Agents (Weather, Financials)

Specialized agents for domain-specific widget types that aggregate cross-project data.

### Weather Agent Pattern

```typescript
const homeWeatherAgent: WidgetAgent = {
  id: 'homeWeather',
  name: 'Weather Outlook',
  systemPrompt: 'Construction scheduling advisor monitoring weather across all project sites...',
  insight: () => {
    const impacted = PROJECTS.filter(p =>
      getProjectWeather(p.id)?.forecast.some(d => d.workImpact !== 'none'));
    return impacted.length > 0
      ? `${impacted.length} project${impacted.length !== 1 ? 's' : ''} with weather impacts`
      : null;
  },
  buildContext: () =>
    PROJECTS.map(p => {
      const w = getProjectWeather(p.id);
      return `${p.name} (${p.city}, ${p.state}): ${w?.current.condition}, ${w?.current.tempF}F`;
    }).join('\n'),
};
```

### Rules

- Domain agents should aggregate data across all relevant projects
- Use shared utilities (`getProjectWeather`, `buildUrgentNeeds`) to aggregate
- Include navigation actions linking to related project dashboards
