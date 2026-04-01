# Product Requirements Document -- Project Delivery UX

**Product**: Trimble Project Delivery Dashboard
**Version**: 1.0
**Date**: March 31, 2026
**Status**: Active Development (94% complete -- 125/133 items)

---

## 1. Purpose

This document defines the product requirements for the **Project Delivery UX** application -- a construction project delivery dashboard that gives portfolio managers, project managers, and field teams a unified view of project health, financials, records, and risk across an entire portfolio of construction projects.

The application serves as a UX reference implementation demonstrating how Trimble's Modus Design System, agentic AI capabilities, and flexible layout engine can be combined into a production-grade construction management interface.

---

## 2. Target Users

| Persona | Role | Primary Use |
|---------|------|-------------|
| Portfolio Manager | Oversees multiple construction projects | Home dashboard, cross-project financials, portfolio-level AI analysis |
| Project Manager | Manages a single project end-to-end | Project detail dashboard, records, milestones, tasks, budget |
| Field Superintendent | On-site execution and reporting | Daily reports, punch items, inspections, weather impact |
| Financial Controller | Manages billing, contracts, and cash flow | Financials dashboard, job costs, change orders, AR/AP, GL |
| Executive Stakeholder | Reviews high-level project status | KPI cards, status summaries, risk widgets, urgent needs |

---

## 3. Functional Requirements

### 3.1 Portfolio Home Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| HOME-01 | Display a personalized welcome with user name and current date | P0 |
| HOME-02 | Show portfolio-wide KPI cards summarizing project health | P0 |
| HOME-03 | Provide an Urgent Needs widget that aggregates overdue items across all projects with severity, category, and project filters | P0 |
| HOME-04 | Provide a Weather Outlook widget showing portfolio-wide conditions and work impact forecasting across all project locations | P1 |
| HOME-05 | Display RFI and Submittal summary widgets with status counts | P0 |
| HOME-06 | Provide a Calendar widget for upcoming appointments and deadlines | P1 |
| HOME-07 | Provide a Time Off Requests widget for team member leave visibility | P2 |
| HOME-08 | Display a Drawings widget showing recently updated drawings across projects | P1 |
| HOME-09 | Provide a Recent Activity feed showing a timeline of portfolio actions | P1 |
| HOME-10 | All widgets must be draggable and resizable with layout persistence | P0 |
| HOME-11 | Deep-link from Urgent Needs items to their source records | P0 |

### 3.2 Projects Portfolio Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| PROJ-01 | Display all projects as draggable, resizable tile widgets | P0 |
| PROJ-02 | Each tile must show project name, status, progress percentage, and budget utilization | P0 |
| PROJ-03 | Provide status chip summary counts (On Track / At Risk / Overdue) | P0 |
| PROJ-04 | Clicking a project tile navigates to that project's detail dashboard | P0 |
| PROJ-05 | Support a Create action for adding new projects | P1 |
| PROJ-06 | Display AI insight line on each project tile when relevant | P1 |

### 3.3 Portfolio Financials Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FIN-01 | Display portfolio-level financial widgets covering: Revenue, Job Costs, Estimates, Change Orders, Billing, AR, AP, Cash, GL, POs, Payroll, Contracts, Subcontract Ledger | P0 |
| FIN-02 | Provide a navigation widget linking to each financial sub-area | P0 |
| FIN-03 | Support deep-linked job-cost detail pages per project (`/financials/job-costs/:slug`) | P0 |
| FIN-04 | Provide a project selector dropdown in the navbar for job-cost detail pages | P0 |
| FIN-05 | Display agent alert badges on financial sub-navigation items | P1 |
| FIN-06 | All financial widgets must be draggable and resizable | P0 |

### 3.4 Project Detail Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| PD-01 | Each project must have its own dashboard at `/project/:slug` | P0 |
| PD-02 | Provide a collapsible side navigation with 7 sections: Dashboard, Records, Drawings, Field Captures, Models, Financials, Files | P0 |
| PD-03 | Dashboard section must display widgets for: Milestones, Tasks, Risks, Team, Activity, Drawings, Budget, Weather | P0 |
| PD-04 | Risks widget must appear first below the project header in all view modes | P0 |
| PD-05 | All widgets must support drag, resize, and layout persistence per-project | P0 |
| PD-06 | Provide a project selector dropdown in the navbar for switching between projects | P0 |
| PD-07 | Display summary stats (key metrics) at the top of the dashboard | P1 |

### 3.5 Records Sub-Pages

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-01 | Implement grid and list views for: RFIs, Submittals, Daily Reports, Punch Items, Inspections, Action Items | P0 |
| REC-02 | Each record type must have a detail page accessible from both grid and list views | P0 |
| REC-03 | Provide a search bar, filter, sort, and download toolbar on each sub-page | P1 |
| REC-04 | Support grid/list view toggle on sub-pages | P0 |
| REC-05 | Provide navigation stubs for the remaining 10 record types (Issues, Field Work Directives, Check Lists, Drawing Sets, Meeting Minutes, Notices to Comply, Safety Notices, Specification Sets, Submittal Packages, Transmittals) | P2 |
| REC-06 | Display AI alert badges on record sub-navigation items | P1 |

### 3.6 Financial Sub-Pages

| ID | Requirement | Priority |
|----|-------------|----------|
| FINSUB-01 | Implement grid and list views for: Budget, Change Orders (3 types), Billings, Cost Forecasts, Contracts, Purchase Orders, Contract Invoices, General Invoices | P0 |
| FINSUB-02 | Each financial sub-page must have KPI strips summarizing key figures | P0 |
| FINSUB-03 | Contract detail view must show linked change orders with navigation | P0 |
| FINSUB-04 | Change order detail page must include cost breakdown, history, and conditions | P0 |
| FINSUB-05 | Estimate detail page must include line items and cost summary | P0 |
| FINSUB-06 | Support standalone detail pages for change orders (`/change-orders/:id`) and estimates (`/estimates/:id`) | P0 |

---

## 4. View Mode Requirements

### 4.1 Desktop Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| VM-D01 | Activate when viewport width is below 2000px | P0 |
| VM-D02 | Arrange widgets in a column-based grid with 16px vertical grid alignment | P0 |
| VM-D03 | Implement push-squeeze resize: push neighbors outward, squeeze from far end to 4-column minimum, relocate outermost if overflowing | P0 |
| VM-D04 | Automatically compact widgets upward to eliminate vertical gaps | P0 |
| VM-D05 | Reflow widgets to fewer columns on narrower viewports, single-column on mobile | P0 |
| VM-D06 | Persist widget positions and sizes per-page and per-project in sessionStorage | P0 |
| VM-D07 | Mobile drag must be restricted to a 32x32px zone around the handle icon | P1 |
| VM-D08 | Mobile drag must lock to vertical-only axis after an 8px threshold | P1 |

### 4.2 Canvas Card/Grid Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| VM-C01 | Activate when viewport width is 2000px or wider | P0 |
| VM-C02 | Support spacebar + drag panning across the canvas | P0 |
| VM-C03 | Support Shift + scroll wheel zoom between 0.5x and 1.0x | P0 |
| VM-C04 | Allow free-form widget drag and resize anywhere on the canvas | P0 |
| VM-C05 | Resolve widget overlaps via BFS push algorithm with mover immunity | P0 |
| VM-C06 | Support frozen-direction pushback for compressed widget chains | P0 |
| VM-C07 | Display detail expansion overlays with drag and resize support | P0 |
| VM-C08 | Render a fixed 1280px centered navbar with rounded corners and `overflow: visible` | P0 |
| VM-C09 | Provide layout controls: Reset View, Reset Layout, Save as Default, Lock/Unlock panning | P0 |
| VM-C10 | Persist canvas layouts independently from desktop layouts | P0 |

### 4.3 Mobile Mode

| ID | Requirement | Priority |
|----|-------------|----------|
| VM-M01 | Display content as a locked list widget when list toggle is active on sub-pages | P0 |
| VM-M02 | Support row-click detail expansion inline | P0 |
| VM-M03 | Highlight the active row to maintain context | P0 |

### 4.4 Cross-Mode Parity

| ID | Requirement | Priority |
|----|-------------|----------|
| VM-P01 | All data, columns, KPIs, and interactive behaviors must be available in all three view modes | P0 |
| VM-P02 | Tile detail expansion must work in both canvas card and canvas list modes | P0 |
| VM-P03 | Sub-page toolbars (search, filter, sort, download) must render in all modes | P0 |

---

## 5. Agentic AI Requirements

### 5.1 AI Panel

| ID | Requirement | Priority |
|----|-------------|----------|
| AI-01 | Provide a right-side utility panel accessible from the navbar | P0 |
| AI-02 | Support streaming chat with real-time message delivery and thinking indicators | P0 |
| AI-03 | Display context-aware suggestion chips that update based on widget focus and data state | P0 |
| AI-04 | Render quick-action buttons below messages that can trigger route navigation | P0 |
| AI-05 | Support bold text and navigable markdown links in assistant messages | P0 |
| AI-06 | Provide keyword-based local fallback responders for offline/demo use | P1 |
| AI-07 | Include a "New Conversation" action to clear the current thread | P1 |

### 5.2 Widget Agent System

| ID | Requirement | Priority |
|----|-------------|----------|
| AG-01 | Every widget, sub-page, and detail view must have an associated AI agent | P0 |
| AG-02 | Agent resolution must follow: sub-context match, then widget ID match, then page default | P0 |
| AG-03 | Each agent must define: system prompt, context builder, local responder, suggestions | P0 |
| AG-04 | Agents must support optional quick-action definitions with route navigation | P1 |
| AG-05 | Agents must be organized into domain files: home, project, financials, portfolio | P0 |

### 5.3 Insight Lines

| ID | Requirement | Priority |
|----|-------------|----------|
| INS-01 | Widgets must support displaying a single dynamic insight line below the title | P1 |
| INS-02 | Insights must be computed reactively from the current data state | P1 |
| INS-03 | Insights must update when underlying data changes (e.g., RFI status update) | P1 |

### 5.4 Alert Badges

| ID | Requirement | Priority |
|----|-------------|----------|
| ALT-01 | Sub-navigation items must support severity-based alert badges (count + label) | P1 |
| ALT-02 | Alert badges must appear on collapsible subnav in both desktop and canvas modes | P1 |
| ALT-03 | Alert counts must be computed by the agent's `alerts` function from live data | P1 |

### 5.5 Conversation Memory

| ID | Requirement | Priority |
|----|-------------|----------|
| MEM-01 | Each widget agent must maintain its own conversation history during the session | P1 |
| MEM-02 | Navigating away and returning to a widget must restore the previous conversation | P1 |
| MEM-03 | Conversations must be keyed by agent ID derived from the selected widget | P1 |

### 5.6 Portfolio Meta-Agent

| ID | Requirement | Priority |
|----|-------------|----------|
| META-01 | Provide a cross-project agent on the Home dashboard | P1 |
| META-02 | The meta-agent must answer questions spanning multiple projects (budget comparisons, portfolio risks, activity summaries) | P1 |

### 5.7 Reactive Data Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| RX-01 | Provide a centralized reactive data store for mutable data (RFIs, Submittals) | P0 |
| RX-02 | Status changes must propagate through computed signals to widget displays, agent insights, alert badges, and urgent needs | P0 |

---

## 6. Navigation Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NAV-01 | Provide a shared Dashboard Shell with navbar, side navigation, AI panel, and theme switching | P0 |
| NAV-02 | Side navigation must include Home, Projects, and Financials links | P0 |
| NAV-03 | Provide a dynamic "Back" button in the navbar that reflects navigation history | P0 |
| NAV-04 | Support shell title override for context-specific titles (e.g., project name on job-cost pages) | P0 |
| NAV-05 | All detail pages must have unique, deep-linkable URLs with browser back/forward support | P0 |
| NAV-06 | Hamburger menu must toggle the side navigation via DOM listener (not Angular output binding) | P0 |
| NAV-07 | Side navigation must use overlay mode on all screen sizes (no margin push) | P0 |

---

## 7. Theming Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| THM-01 | Support 6 Modus themes: Classic Light/Dark, Modern Light/Dark, Connect Light/Dark | P0 |
| THM-02 | Apply themes via `data-theme` attribute on the document root | P0 |
| THM-03 | Persist selected theme to localStorage and restore on page load | P0 |
| THM-04 | Restrict all UI colors to the 9-token semantic design system | P0 |
| THM-05 | Dark-mode side nav background must match the navbar per theme variant | P0 |
| THM-06 | All components must render correctly in all 6 themes | P0 |

---

## 8. Data Requirements

### 8.1 Project Data

| ID | Requirement | Priority |
|----|-------------|----------|
| DATA-01 | Support 8 construction projects with: name, slug, client, owner, status, due date, progress, budget, city/state | P0 |
| DATA-02 | Each project must include: milestones, tasks, risks, team, activity, drawings, budget breakdowns | P0 |
| DATA-03 | Project status values: On Track, At Risk, Overdue, Planning | P0 |

### 8.2 Financial Data

| ID | Requirement | Priority |
|----|-------------|----------|
| DATA-04 | Track per-project job costs by category: Labor, Materials, Equipment, Subcontractors, Overhead | P0 |
| DATA-05 | Support 3 change order types: Prime Contract, Potential, Subcontract | P0 |
| DATA-06 | Support 22 contracts (8 prime + 14 subcontracts) with linked change orders and retainage | P0 |
| DATA-07 | Track AR (invoices), AP (payables), billing schedules, cash flow, GL accounts/entries, POs, payroll, subcontract ledger | P0 |

### 8.3 Records Data

| ID | Requirement | Priority |
|----|-------------|----------|
| DATA-08 | Provide full data sets across all 8 projects for: RFIs, Submittals, Daily Reports, Punch Items, Inspections, Action Items | P0 |
| DATA-09 | Support change orders, revenue, cost forecasts, and budget history per project | P0 |

### 8.4 Weather Data

| ID | Requirement | Priority |
|----|-------------|----------|
| DATA-10 | Provide 7-day forecasts per project location (8 cities across WA, OR, Northern CA) | P1 |
| DATA-11 | Flag weather conditions for potential construction work impact | P1 |
| DATA-12 | Aggregate weather data for portfolio-level view on Home dashboard | P1 |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-01 | Use `ChangeDetectionStrategy.OnPush` on all components | P0 |
| NFR-02 | Use Angular Signals for reactive state management (no Zone.js overhead) | P0 |
| NFR-03 | Layout engine operations (drag, resize, collision resolution) must complete within a single animation frame | P0 |
| NFR-04 | Canvas detail expansion must use double `requestAnimationFrame` to avoid stale dimension reads | P0 |

### 9.2 Accessibility

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-05 | WCAG 2.1 compliance for all interactive elements (labels, focus, ARIA attributes) | P1 |
| NFR-06 | Keyboard navigation must work for all primary actions | P1 |
| NFR-07 | Interactive icons must have `aria-label`; decorative icons must have `aria-hidden="true"` | P1 |

### 9.3 Design System Compliance

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-08 | Use only the 9 semantic color tokens -- no generic Tailwind colors, hardcoded hex, or raw Modus variables | P0 |
| NFR-09 | Use Modus Icons exclusively -- no third-party icon libraries | P0 |
| NFR-10 | Use `div` elements only -- no semantic HTML (`h1`, `p`, `section`, `header`, etc.) | P0 |
| NFR-11 | Use custom opacity utilities (`text-foreground-80`) -- not Tailwind `/80` syntax | P0 |
| NFR-12 | Use custom border utilities (`border-default`, `border-primary`) for Tailwind v4 compatibility | P0 |

### 9.4 Quality Gates

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-13 | All code must pass `npm run lint:all` (8 lint scripts) before commit | P0 |
| NFR-14 | All code must pass `npm run type-check` (strict TypeScript) before commit | P0 |
| NFR-15 | All code must pass `npm run test:static` (325 static compliance tests) before push | P0 |
| NFR-16 | All code must pass `ng build` (Angular compiler template checks) before push | P0 |
| NFR-17 | Pre-commit hooks must enforce lint checks automatically | P0 |

---

## 10. Out of Scope (Future Work)

| Item | Notes |
|------|-------|
| Backend API integration | Currently uses seed data; REST API integration planned |
| User authentication | No auth layer; single demo user ("Frank Mendoza") |
| Real-time data updates | No WebSocket or polling; data is static seed with reactive store for demo mutations |
| Export functionality | PDF/CSV export not yet implemented |
| Notification system | No push notifications or in-app notification center |
| Server-side preferences | Widget layouts use sessionStorage; no user account persistence |
| Remaining record stubs | 10 record types have navigation entries but no data or views |
| Visual regression tests | No screenshot baseline comparison |
| E2E test expansion | 8 Playwright specs configured but minimal coverage |

---

## 11. Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| All 3 main pages render with full widget grids | Manual verification across 6 themes |
| All 8 project dashboards load with correct per-project data | Route navigation test for each slug |
| Desktop, Canvas Card, and Mobile modes maintain feature parity | Static parity tests (325 tests passing) |
| AI panel provides contextual responses for every widget and sub-page | Agent resolution coverage across all widget IDs |
| Layout engine handles drag, resize, and collision without visual artifacts | Unit tests (84 tests) + manual canvas verification |
| All lint checks pass with zero violations | `npm run lint:all` exit code 0 |
| Type checking passes with zero errors | `npm run type-check` exit code 0 |
| Application builds successfully for production | `ng build` exit code 0 |
