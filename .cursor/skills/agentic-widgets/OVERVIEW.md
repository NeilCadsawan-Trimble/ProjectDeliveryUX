# Agentic Widgets -- Architecture Overview

The agentic widgets system transforms dashboard widgets from passive data displays into autonomous, context-aware AI agents. Each widget on the dashboard maps to a `WidgetAgent` that can proactively surface insights, raise alerts, answer natural-language questions, and offer quick actions -- all scoped to its domain.

## Core Concept

Instead of having one generic AI assistant, **every widget gets its own specialized agent**. When you click on the "Budget" widget, the AI panel morphs into a budget specialist. Click on "RFIs" and it becomes an RFI management expert. This is the key differentiator from a typical chatbot.

---

## File Structure

| File | Purpose |
|------|---------|
| `src/app/data/widget-agents/shared.ts` | Core interfaces (`WidgetAgent`, `AgentAlert`, `AgentAction`, `AgentDataState`), helper utilities (`kw`, `getSuggestions`, `fmtProjects`) |
| `src/app/data/widget-agents/home-agents.ts` | ~15 agents for the Home page (time off, calendar, RFIs, submittals, weather, AP/AR, etc.) |
| `src/app/data/widget-agents/project-agents.ts` | ~23 agents for Project Dashboards (milestones, tasks, risks, team, drawings, inspections, daily reports, + detail agents for individual records) |
| `src/app/data/widget-agents/financials-agents.ts` | Agents for Financials page (budget, revenue, change orders, contracts, GL, payroll, etc.) |
| `src/app/data/widget-agents/portfolio-agents.ts` | Cross-project portfolio meta-agent + projects page agents |
| `src/app/data/widget-agents/index.ts` | Master registry (`ALL_AGENTS`), `getAgent()` resolver, `getAllAgents()` |
| `src/app/shell/services/ai-panel-controller.ts` | Conversation memory, message streaming, action execution, tool call confirmation |
| `src/app/shell/components/ai-assistant-panel.component.ts` | AI panel UI -- suggestion chips, chat bubbles, action pills, markdown rendering |

---

## The WidgetAgent Interface

Every agent implements this contract (from `shared.ts`):

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

There are **two required methods** and **three optional "agentic" capabilities**:

### Required

1. **`buildContext(state)`** -- Serializes the agent's relevant data into a text string for the LLM context window. This is what gets sent to OpenAI alongside the user's question.

2. **`localRespond(query, state)`** -- A fast, keyword-based responder that handles common questions without making an API call. If it returns a non-empty string, that response is used directly. If empty, the system falls back to the LLM.

### Optional (Agentic Capabilities)

3. **`insight(state)`** -- Returns a 1-line proactive insight (or `null`). This shows directly on the widget card header -- the user sees it without ever opening the AI panel. Example: "3 overdue milestones" or "2 failed inspections, 5 open punch items".

4. **`alerts(state)`** -- Returns an `AgentAlert` with a severity level and count. This drives color-coded badges on subnav items and widget headers. Levels: `critical` (red), `warning` (yellow), `info` (blue).

5. **`actions(state)`** -- Returns 2-4 quick actions the user can execute from the AI panel without typing. Each action has a label, an `execute()` function that returns a confirmation string, and an optional `route` for navigation.

---

## Agent Count

There are **60+ registered agents** in the `ALL_AGENTS` map in `index.ts`:

- **~15 home page agents** -- time off, calendar, RFIs, submittals, weather, AP invoices, payment schedule, vendor aging, pay apps, lien waivers, retention, etc.
- **~23 project agents** -- milestones, tasks, risks, team, drawings, activity, inspections, daily reports, punch items, action items, + detail-level agents for individual RFIs, submittals, change orders, contracts, etc.
- **~15 financials agents** -- budget, revenue, change orders, contracts, cost forecasts, job cost detail, AP, AR, billing, cash, GL, payroll, purchase orders, subcontract ledger
- **~6 portfolio/projects agents** -- portfolio meta-agent, projects widget, open estimates, needs attention, recent activity

---

## Agent Resolution

The `getAgent()` function resolves which agent handles a given context:

```typescript
export function getAgent(widgetId: string | null, page: string, subContext?: string): WidgetAgent {
  if (subContext && ALL_AGENTS[subContext]) return ALL_AGENTS[subContext];
  if (widgetId && ALL_AGENTS[widgetId]) return ALL_AGENTS[widgetId];
  return ALL_AGENTS[PAGE_DEFAULT_AGENTS[page] ?? 'homeDefault'] ?? homeDefault;
}
```

The chain is: **subContext > widgetId > page default**. If you're viewing an RFI detail, the `rfiDetail` agent takes over, even though the parent widget is `recordsRfis`.

---

## Dynamic Suggestions

Many agents use **data-driven suggestions** rather than static arrays. For example, the milestones agent promotes "Are any milestones at risk?" to the top when overdue milestones exist, and demotes it otherwise. This makes the AI panel feel responsive to the actual data state.

```typescript
suggestions(s) {
  const overdue = (s.milestones ?? []).filter(m => m.status === 'overdue').length;
  return overdue
    ? ['Are any milestones at risk?', 'Which milestones are coming up?', 'Summarize milestone completion rate']
    : ['Which milestones are coming up?', 'Summarize milestone completion rate', 'Are any milestones at risk?'];
},
```

---

## Conversation Memory

The `AiPanelController` maintains **per-agent conversation history**:

```typescript
private conversationMemory = new Map<string, { messages: AiMessage[]; counter: number }>();
```

When you switch between widgets, your conversation with each agent is preserved. Click back to the budget widget and you see your prior budget conversation. It caps at 50 stored conversations (LRU eviction).

---

## Tool Calls (Proposed Changes)

The system supports **AI-proposed tool calls** with human-in-the-loop confirmation. When the AI proposes a data mutation (via `AiToolsService`), it renders as a card with a description and Confirm/Cancel buttons. The user must explicitly confirm before any action executes.

---

## Cross-Agent Delegation

The `projectDefault` agent (the overview agent for project dashboards) delegates to specialized agents based on keywords:

```typescript
if (kw(q, 'risk')) return risksAgent.localRespond(q, s);
if (kw(q, 'task', 'overdue')) return tasksAgent.localRespond(q, s);
if (kw(q, 'budget', 'spend', 'cost')) return budgetAgent.localRespond(q, s);
if (kw(q, 'milestone', 'schedule')) return milestonesAgent.localRespond(q, s);
if (kw(q, 'team', 'assign', 'resource')) return teamAgent.localRespond(q, s);
```

This means the overview agent can answer questions about any domain by routing to the specialist.

---

## Navigable Links in Responses

Agent responses can include **markdown-style links** that render as clickable elements. The `renderMessage()` method in the AI panel parses `**bold**` and `[text](url)` syntax, and internal links (`/some/route`) use Angular Router for navigation rather than full page reloads.

---

## What Makes It "Agentic"

The system goes beyond a simple chatbot in several ways:

1. **Proactive** -- Insights and alerts surface without the user asking
2. **Context-aware** -- Each agent knows exactly what data it's responsible for
3. **Actionable** -- Quick actions let users take domain-specific actions directly
4. **Persistent** -- Conversations are remembered per-agent
5. **Composable** -- Agents can reference each other's data (cross-references)
6. **Hierarchical** -- Detail agents handle individual records; page agents handle collections; the portfolio agent handles cross-project analysis

---

## Supporting Interfaces

### AgentDataState

A large bag of optional properties representing all possible data an agent might need. Agents only read the fields relevant to their domain:

```typescript
export interface AgentDataState {
  projects?: Project[];
  rfis?: Rfi[];
  submittals?: Submittal[];
  milestones?: Milestone[];
  tasks?: Task[];
  risks?: Risk[];
  team?: TeamMember[];
  changeOrders?: ChangeOrder[];
  inspections?: Inspection[];
  dailyReports?: DailyReport[];
  budgetPct?: number;
  // ... 50+ more optional fields
}
```

### AgentAlert

```typescript
export interface AgentAlert {
  level: 'info' | 'warning' | 'critical';
  count: number;
  label: string;
}
```

### AgentAction

```typescript
export interface AgentAction {
  id: string;
  label: string;
  execute: (s: AgentDataState) => string;
  route?: string;  // Optional Angular route for navigation actions
}
```

---

## Adding a New Agent -- Checklist

1. Define the agent in the appropriate file under `src/app/data/widget-agents/`
2. Add it to `ALL_AGENTS` in `index.ts`
3. Implement `insight` -- return data-driven 1-line string or `null`
4. Implement `alerts` -- return `AgentAlert` for concerning states or `null`
5. Implement `actions` -- return 2-4 contextual `AgentAction` objects
6. Make `suggestions` dynamic if data state meaningfully changes what to suggest
7. Add cross-references in `localRespond` where related data exists
8. Wire to UI -- pass insight to widget frame, alerts to subnav
9. Verify -- `npm run type-check && npm run test:static`
