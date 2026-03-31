# Project Delivery UX -- Application Overview

A construction project delivery dashboard built with **Angular 20**, **Trimble Modus Web Components**, and **Tailwind CSS v4**. The application provides portfolio-level and per-project views across 8 demo construction projects, with draggable widget dashboards, an infinite canvas mode, and an AI-powered agentic assistant system.

- **Stack**: Angular 20 + Modus Web Components 1.0.6 + Tailwind CSS v4 + TypeScript 5.9
- **Design System**: Trimble Modus 2.0 (9-color semantic system, 6 themes)
- **Development**: 175+ commits across 12 completed phases
- **Deployment**: Vercel (auto-deploy on push)

---

## Main Pages and Navigation

The application has three top-level pages accessible from the side navigation, plus 8 individual project detail dashboards. A shared **Dashboard Shell** provides the navbar, side navigation, AI panel, and theme switching across all pages.

### Home (`/`)

The landing page greets the user by name and displays the current date alongside portfolio-wide KPI cards. Below the KPIs, a widget grid provides at-a-glance visibility into:

- **Urgent Needs** -- Cross-project aggregation of overdue items with severity, category, and project filters, plus deep-linking to source items
- **Weather Outlook** -- Portfolio-wide weather conditions across all project locations with work impact forecasting
- **Time Off Requests** -- Pending and upcoming time off for team members
- **Calendar** -- Upcoming appointments and deadlines
- **RFIs** -- Open Requests for Information across all projects
- **Submittals** -- Active submittals with status tracking
- **Drawings** -- Recently updated drawings across projects
- **Recent Activity** -- Timeline of recent actions across the portfolio

### Projects (`/projects`)

A portfolio dashboard displaying all 8 construction projects as draggable, resizable tiles. Each tile shows project name, status, progress, and budget utilization. Status chips at the top summarize how many projects are **On Track**, **At Risk**, or **Overdue**. Clicking a tile navigates to that project's detail dashboard.

### Financials (`/financials`)

A portfolio-level financials dashboard with 16 widget areas covering the full financial picture:

- Revenue and Job Costs
- Open Estimates
- Change Orders (Prime, Potential, Subcontract)
- Billing and Invoicing
- Accounts Receivable and Accounts Payable
- Cash Management and Cash Flow
- General Ledger
- Purchase Orders
- Payroll
- Contracts and Subcontract Ledger

The Financials page also supports deep-linked job-cost detail pages at `/financials/job-costs/:slug`, with a project selector dropdown in the navbar for switching between projects.

### Project Detail Pages (`/project/:slug`)

Each of the 8 construction projects has its own detail dashboard accessible via a slug-based route. All project dashboards share a common layout with a collapsible side navigation containing 7 sections:

1. **Dashboard** -- Overview with milestones, tasks, risks, team, activity, drawings, budget, and weather widgets
2. **Records** -- Document management sub-pages
3. **Drawings** -- Drawing sets and versions
4. **Field Captures** -- Site photography and documentation
5. **Models** -- 3D/BIM model management
6. **Financials** -- Per-project financial tracking
7. **Files** -- General file storage

The 8 demo projects represent construction domains:

| Project | Slug |
|---------|------|
| Riverside Office Complex | `riverside-office-complex` |
| Harbor View Condominiums | `harbor-view-condominiums` |
| Downtown Transit Hub | `downtown-transit-hub` |
| Lakeside Medical Center | `lakeside-medical-center` |
| Westfield Shopping Center | `westfield-shopping-center` |
| Metro Bridge Rehabilitation | `metro-bridge-rehabilitation` |
| Sunset Ridge Apartments | `sunset-ridge-apartments` |
| Industrial Park Warehouse | `industrial-park-warehouse` |

---

## Project Dashboard Sub-Pages

### Records

16 record types are defined in the navigation, with 6 fully implemented with data, grid/list views, and detail pages:

- **RFIs** -- Requests for Information with status tracking, assignees, and response timelines
- **Submittals** -- Submittal packages with approval workflows
- **Daily Reports** -- Daily site reports with crew counts, weather conditions, and work summaries
- **Punch Items** -- Punch list items with priority, location, and resolution tracking
- **Inspections** -- Inspection records with pass/fail results and follow-up actions
- **Action Items** -- Tracked action items with assignees and due dates

Additional record types in navigation (stubs): Issues, Field Work Directives, Check Lists, Drawing Sets, Meeting Minutes, Notices to Comply, Safety Notices, Specification Sets, Submittal Packages, and Transmittals.

### Financials

11 financial sub-page types are defined, with 10 fully implemented:

- **Budget** -- Project budget with breakdown by category and variance tracking
- **Change Orders** -- Prime Contract, Potential, and Subcontract change orders with cost breakdowns and approval history
- **Billings** -- Billing schedules and events
- **Cost Forecasts** -- Projected costs vs. actuals
- **Contracts** -- Prime contracts and subcontracts with linked change orders and retainage tracking
- **Purchase Orders** -- Material and equipment procurement
- **Contract Invoices** -- Invoices tied to specific contracts
- **General Invoices** -- Standalone invoices

Each implemented sub-page supports both grid and list views, with detail pages for individual records.

---

## View Modes

The application supports three distinct view modes, with feature parity enforced across all of them.

### Desktop Mode

Active when the viewport width is below 2000px. Widgets are arranged in a column-based grid with automatic vertical compaction. Key behaviors:

- **Column snapping** -- Widgets snap to a column grid with 16px vertical grid alignment
- **Push-squeeze resize** -- Horizontal resizing pushes neighbors outward, then squeezes from the far end inward to a 4-column minimum width, then relocates the outermost widget if still overflowing
- **Vertical compaction** -- Widgets automatically compact upward to eliminate vertical gaps
- **Responsive reflow** -- Widgets reflow to fewer columns on narrower viewports, down to single-column on mobile
- **Layout persistence** -- Widget positions and sizes are saved per-page and per-project in sessionStorage

### Canvas Card/Grid Mode

Active when the viewport width is 2000px or wider and the grid toggle is selected on sub-pages. Provides an infinite canvas workspace:

- **Spacebar panning** -- Hold spacebar and drag to pan across the canvas
- **Scroll zoom** -- Shift + scroll wheel to zoom between 0.5x and 1.0x
- **Free drag and resize** -- Widgets can be freely positioned anywhere on the canvas
- **BFS push collision resolution** -- When widgets overlap after a drag or resize, a breadth-first search algorithm pushes neighbors away from the moved widget, with mover immunity and frozen-direction pushback for compressed chains
- **Detail expansion overlays** -- Clicking into a widget (e.g., an RFI row) expands a detail panel overlay on the canvas with drag and resize support
- **Canvas navbar** -- A fixed 1280px centered navbar with rounded corners and visible overflow for dropdown menus
- **Layout controls** -- Reset View (pan/zoom), Reset Layout (widget positions), Save as Default, and Lock/Unlock panning via the side navigation flyout

### Mobile Mode

Active when the viewport width is 2000px or wider and the list toggle is selected on sub-pages. Displays content as a single locked list widget:

- **Locked list layout** -- Content is presented in a tabular list format
- **Row-click detail expansion** -- Clicking a row opens the detail view inline
- **Row highlighting** -- The active row is highlighted to maintain context

---

## Layout Engine

The layout system is built on several coordinated services that handle widget positioning, collision resolution, and persistence.

### DashboardLayoutEngine

The core service managing drag, resize, push-squeeze, collision resolution, and column snapping for all dashboard pages. It maintains signals for widget positions, sizes, column spans, locked states, z-indices, and selection. Key responsibilities:

- **Drag** -- Widgets snap to a 16px vertical grid and horizontal column steps; mobile restricts drag to vertical-only after an 8px threshold
- **Resize** -- Vertical resize snaps to 16px; horizontal resize triggers the push-squeeze algorithm on desktop
- **Push-squeeze algorithm** -- A two-phase approach for horizontal resize: (1) push all neighbors outward maintaining their widths, (2) squeeze from the far end inward to a 4-column minimum, (3) relocate the outermost widget if the row still overflows. Collision priority ensures actively placed widgets take precedence over relocated ones
- **Canvas BFS push** -- `runCanvasPushBfs` handles free-form collision resolution on the infinite canvas. Direction is always computed from the mover's center to prevent bounce-back. Frozen-direction pushback resolves compressed chains against locked/boundary widgets

### CanvasDetailManager

Manages detail expansion overlays on the canvas. Uses a double `requestAnimationFrame` pattern before measuring layout to avoid stale dimension reads. Maintains a baseline snapshot of all widget positions so non-detail widgets can be restored when the detail panel closes. Supports drag and resize of the expanded panel with snap alignment.

### SubpageTileCanvas

Handles tile-based canvas layouts for project sub-pages (Records, Financials). Manages absolute-positioned tiles with locked tile support, row-major placement, and sessionStorage persistence. Provides its own detail view expansion with canvas push resolution.

### CanvasPanning

Implements spacebar-initiated panning and shift+scroll zooming. Panning is blocked inside interactive elements (widgets, tiles, form controls, scrollable regions) to prevent conflicts with content interaction.

### Widget Persistence

All widget layouts are persisted to sessionStorage with versioned keys scoped per-page and per-project. Desktop and canvas modes maintain independent layout state. Users can save custom default layouts and reset to defaults via the side navigation flyout.

---

## Agentic AI Capabilities

The application includes a context-aware AI assistant system that adapts to the user's current focus. Every widget, sub-page, and detail view has an associated AI agent that provides relevant insights, suggestions, and actions.

### AI Panel

A right-side utility panel accessible from the navbar. Features:

- **Streaming chat** -- Messages stream in real-time from the `/api/chat` endpoint with thinking indicators
- **Suggestion chips** -- Context-aware prompts that update based on the current widget focus and data state
- **Quick actions** -- Action buttons below messages that can trigger route navigation or execute operations
- **Markdown rendering** -- Assistant messages support bold text and navigable links (`[text](url)`) that integrate with the Angular Router for same-app navigation
- **Local fallback** -- Keyword-based local responders provide instant replies for common queries when the API is unavailable

### Widget Agents

Each widget context maps to a `WidgetAgent` object that defines:

- **System prompt** -- Instructions for the LLM about the agent's domain and tone
- **Context builder** -- A function that serializes relevant data (e.g., current RFIs, budget figures) into the LLM context
- **Local responder** -- Keyword-matched instant replies for offline/demo mode
- **Suggestions** -- Static or dynamic suggestion arrays that appear as chips in the AI panel
- **Actions** -- Quick-action buttons with optional Angular route navigation

Agent resolution follows a priority chain: sub-context match (e.g., a specific detail view), then widget ID match, then page default agent. Agents are organized into domain files: home, project, financials, and portfolio.

### Insight Lines

Widgets can display a single dynamic insight line below their title (e.g., "3 overdue RFIs need attention"). Insights are computed from the current data state via the agent's `insight` function and update reactively when underlying data changes.

### Alert Badges

Sub-navigation items can display severity-based alert badges (count + label) computed by the agent's `alerts` function. These appear on the collapsible subnav in both desktop and canvas modes, drawing attention to areas that need action.

### Dynamic Suggestions

Suggestion chips in the AI panel are not static -- they are computed from the current `AgentDataState`, which includes live project data, financial figures, and status counts. When a user changes focus to a different widget or data changes via the reactive store, suggestions update automatically.

### Conversation Memory

Each widget agent maintains its own conversation history. When the user navigates away from a widget and returns, the previous conversation is restored. Conversations are keyed by agent ID (derived from the selected widget or page default) and stored in memory during the session.

### Navigable Links and Actions

AI assistant messages can contain markdown-style links that, when clicked, navigate within the application using the Angular Router. Quick-action buttons (`AgentAction`) can specify a `route` property that triggers navigation after executing the action. This enables workflows like "Show me the overdue RFIs" producing a response with a clickable link to the RFIs page.

### Portfolio Meta-Agent

A special cross-project agent registered on the Home dashboard that can answer questions spanning multiple projects -- for example, comparing budgets, identifying portfolio-wide risks, or summarizing activity across all 8 projects.

### Reactive Data Store

The `DataStoreService` provides writable signals for mutable data (currently RFIs and Submittals). When a status is updated (e.g., closing an RFI), the change propagates through computed signals to all consumers: widget displays, agent insights, alert badges, and urgent needs aggregations.

---

## Theming

The application supports 6 Trimble Modus themes with automatic persistence:

| Theme | Identifier |
|-------|------------|
| Classic Light | `modus-classic-light` |
| Classic Dark | `modus-classic-dark` |
| Modern Light | `modus-modern-light` |
| Modern Dark | `modus-modern-dark` |
| Connect Light | `connect-light` |
| Connect Dark | `connect-dark` |

Themes are applied via the `data-theme` attribute on the document root and persisted to localStorage. The `ThemeService` manages switching and exposes the current theme as a signal for theme-aware components.

### 9-Color Semantic Design System

All UI colors are restricted to 9 semantic tokens that automatically adapt across themes:

| Token | Usage |
|-------|-------|
| `background` | Page background |
| `foreground` | Primary text |
| `card` | Card and surface backgrounds |
| `muted` | Subtle backgrounds and borders |
| `secondary` | Secondary UI elements |
| `primary` | Primary actions and info states |
| `success` | Success states |
| `warning` | Warning states |
| `destructive` | Error and destructive states |

Custom Tailwind v4 utilities provide opacity variants (`text-foreground-80`), border utilities (`border-default`, `border-primary`), and Modus-aligned font sizes.

---

## Data Model

### Portfolio Data

- **8 construction projects** with name, slug, client, owner, status, due date, progress, budget, city/state location
- **Estimates** -- Open estimates with type, status, value, client, and dates
- **Monthly and annual revenue** -- Revenue tracking with project breakdowns
- **Activities** -- Recent actions across the portfolio
- **Attention items** -- Items requiring immediate action
- **Time off requests** -- Team member leave tracking
- **Calendar appointments** -- Scheduled meetings and deadlines

### Per-Project Data

- **Summary stats** -- Key metrics (label, value, subtext)
- **Milestones** -- Named milestones with due dates, status, and progress percentage
- **Tasks** -- Assigned tasks with priority, due date, and status
- **Risks** -- Risk items with severity, impact assessment, and mitigation plans
- **Team** -- Team members with roles, task counts, and availability
- **Activity feed** -- Per-project action timeline
- **Drawings** -- Drawing sets with type, version, and metadata
- **Budget** -- Budget used/total with category breakdowns (Labor, Materials, Equipment, Subcontractors, Overhead)

### Financial Data

Comprehensive financial tracking across all 8 projects:

- **Job costs** -- By category (Labor, Materials, Equipment, Subcontractors, Overhead)
- **Change orders** -- Prime contract, potential, and subcontract with amounts, status, and history
- **Contracts** -- 22 contracts (8 prime + 14 subcontracts) with linked change orders and retainage
- **Invoices** -- Accounts receivable tracking
- **Payables** -- Accounts payable tracking
- **Billing** -- Billing schedules and events
- **Cash flow** -- Historical cash flow entries and current cash position
- **General ledger** -- GL accounts and journal entries
- **Purchase orders** -- Procurement tracking
- **Payroll** -- Payroll records and summaries
- **Subcontract ledger** -- Payment, retainage, and backcharge tracking

### Weather Data

- **7-day forecasts** per project location (8 cities across WA, OR, and Northern CA)
- **Work impact indicators** -- Weather conditions flagged for potential construction impact
- **Portfolio weather consolidation** -- Aggregated weather view on the Home dashboard

---

## Quality and Testing

### Test Suite

| Category | Count | Tool |
|----------|-------|------|
| Unit tests | 84 | Vitest (`ng test`) |
| Static compliance tests | 325 | Vitest (`npm run test:static`) |
| E2E specs | 8 | Playwright (configured, minimal coverage) |

### Lint Scripts

8 dedicated lint scripts enforce design system compliance:

- `lint:colors` -- Modus 9-color system compliance
- `lint:styles` -- Inline styles detection
- `lint:borders` -- Border pattern violations
- `lint:opacity` -- Opacity utility compliance
- `lint:icons` -- Modus Icons library usage
- `lint:icon-names` -- Icon name validation (700+ valid names)
- `type-check` -- TypeScript strict type validation
- `lint:all` -- Runs all checks

Pre-commit hooks run all lint scripts automatically, preventing non-compliant code from being committed.

### Static Test Coverage

- **Template safety** -- Arrow function prevention, private member access checks
- **Canvas grid alignment** -- Column parity, grid structure validation
- **Canvas rendering parity** -- Ensures sub-pages render correctly in canvas mode
- **Shell structure** -- Hamburger menu, navbar, reset flyout, dynamic back button
- **Page structure** -- Widget presence, weather outlook, urgent needs across Home, Projects, Financials, and Project Dashboard pages
