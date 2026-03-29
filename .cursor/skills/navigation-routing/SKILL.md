---
name: navigation-routing
description: Patterns for shared navigation architecture -- dynamic back buttons, shell title overrides, route-based deep linking, URL uniqueness, and agentic page wiring. Use when adding new detail pages, creating navigable URLs, modifying the shared navbar, or wiring new pages into the AI agent system.
---

# Navigation and Routing

Patterns for the shared navigation system that spans the dashboard shell, project dashboards, and financials pages.

## When to Use

- Adding a new detail page that needs a unique URL
- Adding a back button to a new page context
- Creating a project selector or similar dynamic title in the navbar
- Wiring a new page into the AI agent system
- Deep-linking from widgets (urgent needs, weather, job costs) to specific pages

## Architecture Overview

### File Map

| File | Purpose |
|------|---------|
| `src/app/shell/services/navigation-history.service.ts` | Shared service for back button and title override signals |
| `src/app/shell/layout/dashboard-shell.component.ts` | Renders dynamic back button and project selector in navbar |
| `src/app/app.routes.ts` | Route definitions |
| `src/app/data/widget-agents.ts` | Agent definitions (must be wired for new pages) |

### Key Interfaces

```typescript
interface ShellBackButton {
  label: string;
  route: string;
}

interface ShellTitleOverride {
  current: ShellTitleItem;
  others: ShellTitleItem[];
}

interface ShellTitleItem {
  label: string;
  slug: string;
}
```

## 1. Dynamic Back Button

### What It Does

A "Back" button in the shared navbar that navigates to the previous context. Managed via the `NavigationHistoryService` so any page component can set/clear it.

### Setting the Back Button

```typescript
// In page component's activation method
this.navHistory.shellBackButton.set({
  label: 'Back',
  route: '/financials',
});
```

### Clearing the Back Button

```typescript
// In ngOnDestroy or when leaving detail context
this.navHistory.shellBackButton.set(null);
```

### Shell Rendering

`DashboardShellComponent` reads `navHistory.shellBackButton()` and renders:

```html
@if (navHistory.shellBackButton(); as back) {
  <div role="button" tabindex="0"
    class="flex items-center gap-2 cursor-pointer ..."
    (click)="router.navigate([back.route])"
    (keydown.enter)="router.navigate([back.route])">
    <i class="modus-icons text-sm" aria-hidden="true">arrow_left</i>
    <div class="text-sm">{{ back.label }}</div>
  </div>
}
```

### Rules

- Always use the label "Back" (names become too long for navbar space)
- Always clear the signal in `ngOnDestroy` to prevent stale buttons
- The route should be the parent page (e.g., `/financials`, `/projects`)

## 2. Shell Title Override (Project Selector in Navbar)

### What It Does

Replaces the static page title in the navbar with a dynamic dropdown selector. Used when viewing a detail page (e.g., job cost for a specific project) to allow switching between projects.

### Setting the Override

```typescript
this.navHistory.shellTitleOverride.set({
  current: { label: 'Riverside Office Complex', slug: 'riverside-office-complex' },
  others: [
    { label: 'Harbor View Condominiums', slug: 'harbor-view-condominiums' },
    // ... other projects
  ],
});
```

### Clearing the Override

```typescript
this.navHistory.shellTitleOverride.set(null);
```

### Shell Rendering

`DashboardShellComponent` checks `navHistory.shellTitleOverride()`. If set, it renders a dropdown; otherwise, the static page name.

### Rules

- Always clear in `ngOnDestroy`
- `current` is the selected item; `others` are the alternatives
- Navigation from the dropdown uses `router.navigate()` with the slug

## 3. Unique URLs for Detail Pages

### The Rule

**Every detail page MUST have a unique, bookmarkable URL.** This has been a repeated request.

### Pattern: Slug-Based Routes

```typescript
// In app.routes.ts
{ path: 'financials/job-costs/:slug', component: FinancialsPageComponent }
```

```typescript
// Navigation
this.router.navigate(['/financials/job-costs', project.slug]);
```

```typescript
// Reading the parameter
this.route.paramMap.subscribe(params => {
  const slug = params.get('slug');
  if (slug) this.activateDetail(slug);
});
```

### Pattern: Query Parameters (for sub-page context)

```typescript
// For items within a project dashboard
?view=rfi&id=rfi-1&page=records&subpage=rfis
```

Use `pushState`/`replaceState` for lightweight URL updates within a page.

### Rules

- Use slug-based routes for top-level detail pages (job costs, project pages)
- Use query parameters for items within an existing page context (RFI/Submittal details)
- Browser back/forward must work via `popstate` listener or Angular Router
- Always test that the URL is directly navigable (bookmark/share scenario)

## 4. Wiring New Pages into the Agentic System

### The Rule

**Every new page type must be wired into the agent system.** If a page exists but has no agent context, the AI assistant gives generic responses.

### Checklist for New Page Types

1. **Define the agent** in `widget-agents.ts`:

```typescript
const myNewAgent: WidgetAgent = {
  id: 'myNewPage',
  name: 'My New Page',
  systemPrompt: '...',
  suggestions: () => [...],
  buildContext: (s) => '...',
  localRespond: (q, s) => '...',
  insight: (s) => null,
  alerts: (s) => null,
  actions: (s) => [...],
};
```

2. **Register in `ALL_AGENTS`**:

```typescript
myNewPage: myNewAgent,
```

3. **Map page route to agent** in `PAGE_DEFAULT_AGENTS`:

```typescript
'my-new-page': 'myNewPage',
```

4. **Update `buildAgentDataState()`** in `dashboard-shell.component.ts`:

```typescript
// Add data resolution for the new page
if (pageName === 'my-new-page') {
  state.myData = getMyData();
}
```

5. **Extend `AgentDataState`** if new data types are needed:

```typescript
export interface AgentDataState {
  // ...existing
  myData?: MyDataType;
}
```

### Rules

- Agent `systemPrompt` should describe the page's purpose and what the agent can help with
- `buildContext` must include relevant data from `AgentDataState`
- `localRespond` should handle at least 3-5 common keyword patterns
- `actions` should include navigation to related pages

## 5. Deep-Linking from Widgets

### What It Does

Widgets (Urgent Needs, Weather, Project Tiles) navigate directly to specific detail pages with the right context activated.

### Pattern: Route-Based Navigation

```typescript
// Navigate to a project dashboard
this.router.navigate(['/projects', project.slug]);

// Navigate to a financial detail page
this.router.navigate(['/financials/job-costs', project.slug]);
```

### Pattern: Canvas Detail Expansion via URL State

```typescript
// Navigate to a project and activate a specific detail
this.router.navigate(['/projects', slug], {
  queryParams: { view: 'rfi', id: rfiId, page: 'records', subpage: 'rfis' }
});
```

### Rules

- Always prefer Angular Router over `window.location` for navigation
- For cross-page navigation, use route-based methods
- For within-page detail activation, use query parameters + `pushState`
- Test that deep links from the Home dashboard correctly navigate to project dashboards

## Anti-Patterns

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| `window.location.href = '/path'` | `this.router.navigate(['/path'])` |
| Static page title when in detail context | Use `shellTitleOverride` for project selector |
| Detail page without unique URL | Add a route parameter (`:slug`) |
| New page without agent wiring | Always define agent + register + map |
| Hardcoded "Back to X" labels | Always use "Back" as the label |
| Forgetting to clear signals in `ngOnDestroy` | Always clean up `shellBackButton` and `shellTitleOverride` |
