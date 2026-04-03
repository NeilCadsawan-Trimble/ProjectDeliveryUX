# Project Delivery UX -- Progress Tracker

**Project**: Trimble Project Delivery Dashboard
**Stack**: Angular 20 + Modus Web Components + Tailwind CSS v4
**Started**: March 3, 2026
**Last Updated**: April 2, 2026
**Total Commits**: 180+

---

## Summary

| Phase | Description | Status | Items |
|-------|-------------|--------|-------|
| 1 | Foundation | Done | 7/7 |
| 2 | Mobile and Responsive | Done | 14/14 |
| 3 | Project Dashboards | Done | 12/12 |
| 4 | Multi-Page Architecture and Canvas | Done | 6/6 |
| 5 | Canvas Polish and Deployment | Done | 8/8 |
| 6 | Layout Engine and Quality | Done | 12/12 |
| 7 | AI Agents and Sub-Page Expansion | Done | 8/8 |
| 8 | Agentic Enhancements and Cross-Cutting Features | Done | 18/18 |
| 9 | Contracts, Detail Fixes, and Consolidation | Done | 12/12 |
| 10 | Optimization and Refactoring | Done | 7/7 |
| 11 | Financials Expansion and Icon Quality | Done | 16/16 |
| 12 | Reactive Data Store | Done | 5/5 |
| 13 | Canvas and Interaction Fixes | Done | 5/5 |
| 14 | Adaptive Widget Content | Done | 7/7 |
| 15 | Projects Dashboard Layout Alignment | Done | 6/6 |
| 16 | Remaining Work | Not Started | 0/8 |

**Completed**: 143/151 items (95%)

---

## Phase 1: Foundation (Mar 3--5)

Initial project setup, core dashboard, and navigation infrastructure.

- [x] Initial Angular 20 + Modus Web Components project scaffold
- [x] Trimble AI Assistant panel with signal-based state
- [x] Side navigation with Home, Projects, and Financials pages
- [x] Draggable home dashboard widgets (RFIs, Submittals, Calendar, Time Off)
- [x] Open Estimates widget with responsive column hiding
- [x] Widget drag-and-drop with grid snapping
- [x] Time Off calendar view widget

**Key commits**: `d3f7561` initial commit through `a570009` draggable widgets

---

## Phase 2: Mobile and Responsive (Mar 6--12)

Full mobile responsiveness, hamburger menu, and accessibility.

- [x] Hamburger button toggles side navigation (6 iterations to stabilize)
- [x] Side nav overlay mode on all screen sizes (no margin push)
- [x] Dashboard widgets reflow to single column on mobile
- [x] Projects KPI cards reflow to single column on mobile
- [x] Responsive navbar with mobile "more" menu
- [x] Navbar polish: shadow, icon styling, hamburger active state
- [x] Projects widget mobile height cap with sticky header
- [x] AI chat icon replaced with Trimble AI SVG
- [x] Open Estimates responsive columns via ResizeObserver
- [x] Mobile widget repositioning and vertical resize
- [x] WCAG 2.1 accessibility fixes (labels, focus, ARIA)
- [x] Mobile KPI card view for RFI and Submittals
- [x] Compact mobile KPI view refinement
- [x] Mobile widget widths matched to KPI cards

**Key commits**: `b40382c` hamburger fix through `6836020` compact KPI
**Lessons learned**: Hamburger/sidenav integration required 6+ attempts across different approaches (Angular output binding, DOM listeners, controlled state). Native DOM listener with capture phase was the stable solution.

---

## Phase 3: Project Dashboards and Persistence (Mar 13--17)

Per-project dashboard pages, widget persistence, touch support, and compact views.

- [x] Project dashboard with drag-and-resize widget grid
- [x] Widget reordering during drag (first-fit compaction)
- [x] Persist widget layouts across page refreshes (sessionStorage)
- [x] Compact view for RFI/Submittals widgets at narrow widths
- [x] Calendar touch support (nav buttons, stopPropagation)
- [x] Mobile drag restricted to 32x32px zone around handle icon
- [x] 8 individual project dashboard pages with switcher dropdown
- [x] Widget layout persisted per-project independently
- [x] Mobile layout: absolute positioning to prevent overlaps
- [x] Vertical resize snapped to 16px grid
- [x] Custom side nav on project pages (replacing Modus WC)
- [x] Responsive container-based reflow for project tiles

**Key commits**: `36f590a` project dashboard through `d7c0b82` responsive reflow
**Lessons learned**: Touch events on mobile require `stopPropagation` on all interactive controls to prevent drag interference.

---

## Phase 4: Multi-Page Architecture and Canvas (Mar 18--20)

Route splitting, shared layout engine, and infinite canvas mode.

- [x] Split monolithic HomeComponent into 3 route-based pages (Home, Projects, Financials)
- [x] Extract shared `DashboardLayoutEngine` service (deduplicate templates)
- [x] Infinite canvas mode with spacebar panning and reset view (viewport >= 1920px, originally 2000px)
- [x] Canvas mode added to project dashboard
- [x] Widget z-index stacking and canvas overlap resolution
- [x] Navbar dropdown clipping fixed in canvas mode

**Key commits**: `3730efe` split pages through `a79ac84` z-index fixes

---

## Phase 5: Canvas Polish and Deployment (Mar 22--24)

Canvas UX refinements, slug-based routing, Vercel deployment, and project selector.

- [x] Content width aligned across all dashboard pages (1280px)
- [x] Canvas navbar shadow with rounded corners (dedicated shadow element)
- [x] Auto-resolve canvas overlaps on layout restore and reset
- [x] Break project dashboard into per-project pages with slug-based routes
- [x] GitHub push permissions fixed (removed Actions workflows)
- [x] Vercel deployment configured (Node version, framework settings, Git integration)
- [x] Project selector dropdown and settings icon in project dashboard navbar
- [x] Settings icon hover rounding in canvas side nav

**Key commits**: `486bbd4` content width through `c8d71b2` settings icon rounding
**Lessons learned**: Vercel Git integration required: correct Node version env var, no framework override, email verification, and repo access grants.

---

## Phase 6: Layout Engine Refinement and Quality (Mar 24)

Push-squeeze resize algorithm, regression testing, collision resolution, and theming fixes.

### Layout Engine
- [x] Push-squeeze resize: neighbors squeezed to 4-column minimum before being pushed
- [x] Left-edge resize handles with push-squeeze support
- [x] Two-phase algorithm: push first, squeeze from far end inward, relocate outermost
- [x] Collision priority: push-squeeze active widgets get placement priority over relocated widgets
- [x] Desktop reset in sidenav (matching canvas reset pattern)
- [x] "Reset Widgets" renamed to "Reset Layout"; "Clean Up Overlaps" removed

### Widget Interaction
- [x] Click outside widget deselects any selected widget (`data-widget-id` + document click)
- [x] Trimble logo click navigates to home dashboard

### Theming and Styling
- [x] Dark-mode side nav background matches navbar (classic-dark: `gray-10`, modern-dark: `trimble-gray`)
- [x] Canvas navbar bottom-corner rounding via inner `modus-wc-navbar` element
- [x] Canvas navbar `overflow: visible` preserved (dropdown clipping regression fixed)

### Quality and Testing
- [x] Regression testing baseline: 41 unit tests (`ng test`), 55 static compliance tests (Vitest), 8 E2E specs (Playwright), TypeScript type checking
- [x] Lessons-learned skill created (`.cursor/skills/dashboard-layout-lessons/`)

**Key commits**: `907700b` starter template through `398c85f` dark-mode and rounding fixes

---

## Phase 7: AI Agents, Sub-Page Expansion, and Refactoring (Mar 26--29)

AI widget agent architecture, data generation for all project sub-pages, and component extraction refactoring.

### AI Agent Architecture
- [x] Widget agent system (`widget-agents.ts`) with per-context agents for every sub-page and detail view
- [x] AI assistant automatically switches agent context when navigating between pages
- [x] Local fallback responders for offline/demo mode
- [x] Agent context wired to Records sub-pages (RFIs, Submittals, Daily Reports, Punch Items, Inspections, Action Items)
- [x] Agent context wired to Financials sub-pages (Budget, Change Orders, Revenue, Cost Forecasts) and all detail views

### Data Expansion
- [x] Generated full data sets for all 8 projects: Daily Reports, Punch Items, Inspections, Action Items, Change Orders, Revenue, Cost Forecasts, and Budget History

### Sub-Page Views and Navigation
- [x] Grid/list views and detail pages for all new Records and Financials data types
- [x] Full URL support (pushState/replaceState) for all detail pages with browser back/forward

### Component Refactoring
- [x] Extracted `RecordsSubpagesComponent` (287 lines) -- daily reports, punch items, inspections, action items
- [x] Extracted `FinancialsSubpagesComponent` (174 lines) -- change orders, revenue, cost forecasts
- [x] Extracted `RecordDetailViewsComponent` (184 lines) -- all record detail pages
- [x] Reduced `project-dashboard.component.ts` from ~4,860 to ~4,450 lines

**Key commits**: `a66361e` AI agents + sub-page expansion + refactoring
**PRs**: #24

---

## Phase 8: Agentic Enhancements and Cross-Cutting Features (Mar 27--29)

Agentic widget capabilities, smart home widgets, dynamic navigation, financial routing, weather integration, and code quality improvements.

### Agentic Widget Capabilities (PR #26)
- [x] Widget agents with insights, alerts, and quick actions per widget context
- [x] Conversation memory and local fallback responders for offline demo
- [x] Portfolio-level agent for cross-project analysis on Home dashboard
- [x] AI assistant context-switching on page/widget navigation

### AI Navigation and Routing (PRs #27, #28)
- [x] AI assistant action buttons wired to Angular Router (route-based navigation)
- [x] Markdown link rendering in AI messages with `DomSanitizer`
- [x] Dynamic "Back" button in shared navbar (NavigationHistoryService)
- [x] Project selector dropdown in Financials navbar for job cost detail pages

### Financial Deep-Linking (PR #28)
- [x] Unique URLs for all Financials job cost detail pages (`/financials/job-costs/:slug`)
- [x] Shell title override for dynamic project selector in shared navbar
- [x] Financials job cost pages wired into agentic system

### Smart Home Widgets (PR #28)
- [x] Urgent Needs widget: cross-project aggregation, severity/category/project filters, deep-linking to source items
- [x] Weather Outlook widget: portfolio-wide weather conditions and work impact forecasting
- [x] Agentic project tiles on Projects page with urgent needs and job cost links

### Weather Integration (PR #28)
- [x] Project locations assigned (8 cities across WA, OR, and Northern CA)
- [x] Per-project weather widget on project dashboards with 7-day forecast and work impact indicators
- [x] Home dashboard weather consolidation widget with impact highlighting

### Code Quality and Refactoring
- [x] Weather icon/color helpers consolidated into shared utility (`dashboard-data.ts`) -- removed duplication from 4 files
- [x] Widget frame component extracted (`widget-frame.component.ts`)
- [x] Collapsible subnav extracted (`collapsible-subnav.component.ts`)

**Key commits**: `952e75e` agentic capabilities, `80681a1` AI navigation fix, `00f8208` weather + agentic enhancements
**PRs**: #26, #27, #28

---

## Phase 9: Contracts, Detail Fixes, and Consolidation (Mar 29)

Contracts entity integration, detail page layout fixes, shared utility consolidation, and skill documentation.

### Contracts Integration (PR #29)
- [x] Contract type, 22 contracts (8 prime + 14 subcontracts) with linked change orders
- [x] Contracts financials subpage with KPI strip and grid/list views
- [x] Contract detail view with linked change order navigation
- [x] Contract agents wired into agentic system (subpage, detail, general)

### Standalone Detail Pages (PR #29)
- [x] Change order detail page with cost breakdown, history, and conditions (`/change-orders/:id`)
- [x] Estimate detail page with line items and cost summary (`/estimates/:id`)

### Layout and UX Fixes (PR #29)
- [x] Detail page toolbar margin-left adjustment when side subnav is collapsed
- [x] Collapsible subnav header/toolbar overlap resolved across all detail views

### Code Quality and Shared Utilities (PR #29, #30)
- [x] Consolidated `formatCurrency` into shared utility (removed from 6 files)
- [x] Consolidated `inspectionResultBadge` into shared utility (removed from 3 files)
- [x] Consolidated `punchPriorityBadge` into shared utility (removed from 2 files)
- [x] Replaced 6 duplicate `changeOrderStatusBadge`/`contractStatusColor`/`contractIcon` implementations with shared `coBadgeColor`/`contractStatusBadge`/`contractTypeIcon` delegates

### Skills and Documentation
- [x] Created `navigation-routing` skill
- [x] Updated `agentic-widgets` skill (sections 9-10: route-based actions, domain agents)
- [x] Updated `dashboard-layout-lessons` skill (section 12: shared utilities, section 13: collapsed subnav toolbar overlap)

**Key commits**: `952e75e` contracts + layout fixes, `[current]` shared utility consolidation
**PRs**: #29, #30

---

## Phase 10: Optimization and Refactoring (Mar 29)

Major codebase restructuring to improve maintainability, reduce file sizes, and eliminate duplication.

### Data Layer Split
- [x] Split `dashboard-data.ts` (1,640 lines) into `dashboard-data.types.ts` (338), `dashboard-data.seed.ts` (824), `dashboard-data.formatters.ts` (540) with barrel re-export
- [x] Split `widget-agents.ts` (2,501 lines) into domain files under `widget-agents/`: `home-agents.ts` (471), `project-agents.ts` (901), `financials-agents.ts` (725), `portfolio-agents.ts` (344), `shared.ts` (132), `index.ts` (141)

### Project Dashboard Decomposition
- [x] Extracted inline template (4,014 lines) to `project-dashboard.component.html` -- component .ts file reduced from 6,278 to 2,020 lines
- [x] Extracted 30 navigation methods + URL state management into `project-dashboard-navigation.service.ts` (427 lines)
- [x] Created `CanvasTileShellComponent` (88 lines) to DRY up repeated tile wrapper blocks -- migrated 4 tile types as proof of concept

### Shared Architecture
- [x] Created `DashboardPageBase` abstract class (84 lines) consolidating shared engine boilerplate across project-dashboard, home-page, and financials-page
- [x] Created `HomeWidgetFrameComponent` (73 lines) for shared widget chrome -- migrated 3 home widgets

**Key metrics**:

| File | Before | After |
|------|-------:|------:|
| `project-dashboard.component.ts` | 6,278 | 2,020 (+ 4,014 .html + 427 nav service) |
| `dashboard-data.ts` | 1,640 | 3-line barrel (types 552 + seed 1,279 + formatters 849) |
| `widget-agents.ts` | 2,501 | 1-line barrel (4 domain files + shared + index = 2,714 total) |

**Tests**: 325 static tests, type-check, and build all passing.

---

## Phase 11: Financials Expansion and Icon Quality (Mar 29)

Massive financials data expansion, global Financials dashboard restructure, icon name compliance, and duplicate code consolidation.

### Financials Data and Sub-Pages
- [x] Added 6 months of data for all financial sub-pages (estimates, change orders, job costs, invoices, payables, POs, GL, cash flow, subcontract ledger)
- [x] Renamed "Applications for Payment" to "Billings" across all navigation, UI text, and data references
- [x] Associated global financial data (Invoices, Payables, POs, Subcontract Ledger) to individual project financials filtered by `projectId`
- [x] Added canvas mode rendering parity for new financial sub-pages (`purchase-orders`, `contract-invoices`, `general-invoices`)
- [x] Added 17 static regression tests for canvas rendering parity

### Financials Dashboard Restructure
- [x] Replaced subnav on Financials overview with `finNavLinks` navigation widget (3 columns, below KPIs)
- [x] Added icons to all subnav items (both `finNavLinks` widget and `app-collapsible-subnav` on sub-pages)
- [x] Added agent alert badges to Financials subnav (global and sub-page views) with `finSubnavAlerts` computed signal
- [x] Updated project financials `financialsAlerts` mapping for all 11 sub-page agent associations

### Icon Name Compliance
- [x] Fixed 46 invalid Modus icon names across 8 files (`flash`→`lightning`, `swap_horizontal`→`swap`, `account_balance`→`building_corporate`, `list`→`list_bulleted`, `content_copy`→`copy_content`, `people`→`people_group`, `trending_up`→`arrow_up`, `wb_sunny`→`sun`, `gauge`→`dashboard`, `dollar`→`costs`, `error`→`warning`, `package`→`cube`, `draft`→`file_new`)
- [x] Fixed invalid weather icon map entries in `dashboard-data.formatters.ts` (`wb_sunny`→`sun`, `water_drop`→`raindrop`, `flash_on`→`thunderstorm_heavy`, `ac_unit`→`snowflake`, `air`→`wind`)

### UX Improvements
- [x] Mobile filter bar fix: `flex-wrap` on urgent needs filter bar with hidden dividers on mobile
- [x] User name updated from "Alex Morgan" to "Frank Mendoza" across navbar and home page

### Code Quality
- [x] Consolidated `formatJobCost` into shared `dashboard-data.formatters.ts` (removed from 2 files)
- [x] Consolidated `capitalizeFirst` into shared `dashboard-data.formatters.ts` (removed from 2 files)

**Tests**: 325 static tests (9 files), type-check, and lint all passing. Zero icon name violations.

---

## Phase 12: Reactive Data Store (Mar 30)

Centralized reactive state management for RFI and Submittal data, enabling agentic system to dynamically respond to status changes across the entire application.

### DataStoreService
- [x] Created `DataStoreService` (`src/app/data/data-store.service.ts`) with writable signals for RFI and Submittal arrays, plus `updateRfiStatus()` and `updateSubmittalStatus()` mutation methods
- [x] Renamed `RFIS`/`SUBMITTALS` exports to `RFIS_SEED`/`SUBMITTALS_SEED` in `dashboard-data.seed.ts` to clarify their role as seed data

### Reactive Consumer Wiring
- [x] Updated `buildUrgentNeeds()` to accept `rfis`/`submittals` parameters (removed internal cache), enabling reactive re-computation when data changes
- [x] Wired 6 consumer files to `DataStoreService`: `home-page`, `project-dashboard`, `projects-page`, `rfi-detail-page`, `dashboard-shell`, and `project-dashboard-navigation.service` -- all now read from store signals instead of static constants
- [x] Updated `home-agents.ts` and `project-agents.ts` to pass reactive data through `AgentDataState` to `buildUrgentNeeds()`, ensuring agent insights and alerts update when RFI/Submittal statuses change

**Key files**:
- `src/app/data/data-store.service.ts` (new) -- centralized reactive data store
- `src/app/data/dashboard-data.formatters.ts` -- `buildUrgentNeeds()` now parameterized
- `src/app/data/dashboard-data.seed.ts` -- renamed seed constants

---

## Phase 13: Canvas and Interaction Fixes (Mar 30--31)

Bug fixes for canvas collision, hamburger menu, zoom controls, and navigation labels.

### Canvas Collision Fix (PR #34)
- [x] Fixed canvas collision detection for same-size widgets in compressed chains (3-part fix in `canvas-push.ts`): excluded mover from all-pairs cleanup, conditional Phase 2 wall cascade, frozen-direction pushback
- [x] Added 6 regression tests in `canvas-push.spec.ts` covering exact project dashboard layouts with incremental dragging (5px/20px steps)

### Construction Domain Data (PR #35)
- [x] Updated all team member roles to construction roles across all 8 projects
- [x] Updated all milestones and tasks to construction-oriented content
- [x] Promoted Risks & Urgent Needs widget to top of Column 1 in project dashboard default layout (desktop and canvas)

### Hamburger and Canvas Zoom Fixes (Mar 31)
- [x] Fixed hamburger menu for Modus scoped encapsulation (no shadow DOM): search light DOM with `querySelector`, idempotent fallback with `navExpanded.set(open)` instead of toggle
- [x] Fixed canvas Shift+scroll zoom on macOS: picks larger axis (`deltaY` vs `deltaX`) to handle OS-level axis swap; added Ctrl/Cmd+scroll triggers; zoom anchors to viewport center

**PRs**: #34, #35
**Tests**: 90 unit tests (6 new collision regression), 325 static tests

---

## Phase 14: Adaptive Widget Content (Apr 1)

Area-adaptive content disclosure for project widgets, fade/gain visualization, and progressive text scaling.

### Area-Adaptive Widget Layout
- [x] Replaced fixed widget tiers with area-adaptive content blocks (`ContentBlock` type) that dynamically fill available widget space based on pixel height budgeting
- [x] Two-column (wide) layout for widgets at 6+ columns with separate left/right priority lists
- [x] Content blocks: owner, schedule, budget, weather, urgentNeeds, sparkline, costBreakdown, insight, moreNeeds, forecast, milestone, teamSummary, costDetail, riskSummary, fadeGain

### Enhanced Large Widget Content
- [x] Large widget tier (6+ cols, 500px+ height) with expanded block heights, richer data display: taller sparkline, detailed weather with humidity/wind, full owner info, all urgent needs, next milestone, team summary, top risk, expanded job cost details
- [x] Weather work impact scaling: color-coded forecast day pills, warning icons, work impact notes with severity badges at large size

### Fade/Gain Visualization
- [x] Standalone `fadeGain` content block separated from sparkline -- shows as own row at medium sizes, prominent circular badge display at large sizes; inline version suppressed when standalone block is visible

### Progressive Text Scaling
- [x] Three-tier text scaling (`widget-text-md`, `widget-text-lg`) via CSS descendant selectors on widget container; text-2xs/text-xs/text-sm/widget-title all step up as widget grows beyond default size (5+ cols or 480px+ height for medium, 6+ cols and 500px+ height for large)

**Canvas breakpoint**: Lowered from 2000px to 1920px.
**Back button**: Standardized to always display "Back" across all instances.

---

## Phase 15: Projects Dashboard Layout Alignment (Apr 2)

Aligned the Projects Dashboard with the Home Dashboard layout engine rules, re-enabled desktop interactivity, and captured the user-designed layout as the default.

### Layout Engine Alignment
- [x] Extended `DashboardPageBase` for `ProjectsPageComponent` (was standalone with manual engine wiring)
- [x] Removed Projects-specific layout flags: `responsiveBreakpoints`, `responsiveSpanOverrides`, `desktopResizePriorityOrder`, `desktopReflowOnResize`, `desktopSnapToDefaultLayoutAfterDrag`, `desktopSaveDefaultLayoutSizingOnly`

### Desktop Interactivity
- [x] Re-enabled desktop drag (removed mobile-only guard on `onWidgetHeaderMouseDown`/`onWidgetHeaderTouchStart`)
- [x] Re-enabled widget lock toggle for all project tiles (locks priority slot position/size, not project assignment)
- [x] Removed bottom-left resize handle (right/bottom handle only)

### Default Layout Capture
- [x] Captured tile positions from browser via bounding box inspection and set as new defaults: 3-row layout with hero + flanking tiles (all 672px), 4 equal middle-row tiles (384px), single bottom tile; storage keys bumped v15 to v16 (desktop) and v16 to v17 (canvas)

**Key file**: `src/app/pages/projects-page/projects-page-layout.config.ts`
**Tests**: Build passing, 325 static tests, 90 unit tests

---

## Phase 16: Remaining Work

Features and improvements not yet started.

### Backend Integration
- [ ] REST API integration (replace mock data in `src/app/data/`)
- [ ] User authentication and authorization
- [ ] Real-time data updates (WebSocket or polling)

### Testing
- [ ] E2E tests with Playwright (configured but minimal coverage)
- [ ] Visual regression tests (screenshot comparison across themes)
- [ ] Performance benchmarks for layout engine (large widget counts)

### Features
- [ ] Export functionality (PDF/CSV for reports)
- [ ] Notification system
- [ ] User preferences persistence (server-side, not just sessionStorage)

---

## Regression Test Coverage

### Covered (Static Tests -- `tests/static/` -- 325 tests)

| Area | File | Tests |
|------|------|-------|
| Dashboard shell | `dashboard-shell.spec.ts` | 28 tests: hamburger, navExpanded, reset flyout, labels, dynamic back button |
| Home page | `home-page.spec.ts` | 11 tests: widgets, urgent needs, weather outlook |
| Projects page | `projects-page.spec.ts` | 6 structural tests |
| Financials page | `financials-page.spec.ts` | 6 structural tests |
| Project dashboard | `project-dashboard.spec.ts` | 110 tests: widgets, weather, tile detail, subnav, layout menu, per-prefix canvas completeness, grid/list parity, toolbar icons, canvas rendering parity |
| CSS regressions | `styles.spec.ts` | 10 tests: side nav overflow, reset flyout, canvas navbar |
| Canvas panning | `canvas-panning.spec.ts` | 10 tests: spacebar panning, lock canvas |
| Canvas grid alignment | `canvas-grid-alignment.spec.ts` | 58 tests: grid alignment, column parity, canvas structure |
| Template safety | `template-safety.spec.ts` | 86 tests: arrow function prevention, private member access |

### Covered (Unit Tests -- `src/app/shell/services/`)

| Area | File | Tests |
|------|------|-------|
| Layout engine | `dashboard-layout-engine.spec.ts` | Push-squeeze (right/left), squeeze before push, far-end squeeze, resize min-width |
| Canvas BFS push | `canvas-push.spec.ts` | 22 tests: basic push, cascade direction, mover immunity, post-BFS cleanup, locked widgets, off-screen clamping, axis selection, real-world detail expansion, same-size collision regression |
| Widget layout | `widget-layout.service.spec.ts` | Save/load layout persistence |
| Canvas reset | `canvas-reset.service.spec.ts` | Reset trigger signal |

### Not Yet Covered

- E2E browser tests (Playwright configured, minimal specs)
- Visual regression (no screenshot baseline)
- Theme switching verification (manual only)
- Mobile-specific behavior (touch drag, reflow)

---

## Chat Sessions

| Date | Session | Topics |
|------|---------|--------|
| Mar 23 | [Initial setup](348b2862-fd0b-474a-9ed3-4270d9ec1bc4) | Dev server startup |
| Mar 23 | [GitHub and Vercel](0b841993-1534-43b7-8fa6-b99bd77e5e30) | First GitHub push, Vercel deploy, rendering fixes |
| Mar 23 | [Layout and deployment](b90d3dde-b222-49be-9649-3bc611187ed1) | Desktop resize rules, canvas collision, Vercel linking, project selector |
| Mar 24 | [Engine refinement](bc28969b-5fd7-49fc-907e-894008a53ccc) | Push-squeeze algorithm, regression testing, collision priority, theming, skills |
| Mar 25 | [Canvas compact mode](8807b645-9b9a-4f2d-b223-80e249dd101f) | Compact mode revert on canvas resize |
| Mar 26 | [Memory and detail views](b3ea14f9-5bd7-453f-8329-20bad1e7cc3a) | Short-term memory, detail view navigation, URL state |
| Mar 26-27 | [Canvas push and tests](6387a8f3-f2de-4dae-933b-eeec94687608) | Canvas detail expansion, BFS push refactoring, cascade direction fix, unit tests, AI agents, sub-page expansion, refactoring |
| Mar 27-29 | [Agentic and weather](6387a8f3-f2de-4dae-933b-eeec94687608) | Agentic widgets, AI navigation, urgent needs, financial routing, weather widgets, dynamic back button, refactoring |
| Mar 29 | [Contracts and consolidation](76bc1c7e-999f-450e-9650-709afeb8457f) | Contracts integration, detail page layout fix, shared utility consolidation, skill updates, optimization and refactoring |
| Mar 29 | [Financials expansion](b6cd3110-bece-4ecf-9fe2-fcbe115ee7c8) | Financials data expansion, sub-page restructure, finNavLinks widget, agent badges, icon compliance, mobile filter fix, user rename, code consolidation, reactive data store |
| Mar 30 | [Collision and domain data](b6cd3110-bece-4ecf-9fe2-fcbe115ee7c8) | Canvas collision frozen-direction pushback, construction domain data, risks widget layout promotion |
| Mar 31 | [Hamburger and zoom](331f2cb4-f365-4109-8821-f8801018796f) | Scoped encapsulation hamburger fix, canvas Shift+scroll zoom macOS fix, viewport center zoom |
| Apr 1 | [Adaptive widgets](331f2cb4-f365-4109-8821-f8801018796f) | Area-adaptive content blocks, wide widget layout, large widget content, weather work impact, fade/gain visualization, text scaling, canvas breakpoint 1920px, back button standardization |
| Apr 2 | [Projects layout alignment](20b36c27-0715-4a36-9c40-ec6f32104d80) | Projects Dashboard layout alignment with Home rules, DashboardPageBase extension, desktop drag/resize/lock re-enabled, default layout capture from browser |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/shell/services/dashboard-layout-engine.ts` | Core layout engine (drag, resize, push-squeeze, collision) |
| `src/app/shell/services/canvas-push.ts` | BFS push algorithm for canvas mode collision resolution |
| `src/app/shell/services/canvas-detail-manager.ts` | Canvas detail overlay management (shared by home + project) |
| `src/app/shell/services/subpage-tile-canvas.ts` | Tile-based canvas for project subpages |
| `src/app/shell/layout/dashboard-shell.component.ts` | Shared shell (navbar, sidenav, AI panel, document click) |
| `src/app/shell/services/widget-focus.service.ts` | Widget selection state for AI panel |
| `src/app/shell/services/widget-layout.service.ts` | Widget layout persistence (sessionStorage) |
| `src/app/shell/services/canvas-reset.service.ts` | Reset trigger signal |
| `src/app/shell/services/theme.service.ts` | Theme switching and persistence |
| `src/app/pages/home-page/home-page.component.ts` | Home dashboard (RFIs, Submittals, Calendar, Time Off, Urgent Needs, Weather Outlook) |
| `src/app/pages/projects-page/projects-page.component.ts` | Projects portfolio dashboard |
| `src/app/pages/financials-page/financials-page.component.ts` | Financials dashboard |
| `src/app/pages/project-dashboard/project-dashboard.component.ts` | Shared project detail dashboard (used by 8 project routes) |
| `src/app/pages/project-dashboard/components/records-subpages.component.ts` | Extracted Records sub-page views (daily reports, punch items, inspections, action items) |
| `src/app/pages/project-dashboard/components/financials-subpages.component.ts` | Extracted Financials sub-page views (change orders, revenue, cost forecasts) |
| `src/app/pages/project-dashboard/components/record-detail-views.component.ts` | Extracted record detail pages (daily report, inspection, punch item, change order) |
| `src/app/data/widget-agents.ts` | Barrel re-export for AI widget agents |
| `src/app/data/widget-agents/` | Domain-split agent files: home, project, financials, portfolio, shared |
| `src/app/data/data-store.service.ts` | Centralized reactive data store for RFIs and Submittals |
| `src/app/data/dashboard-data.ts` | Barrel re-export for dashboard data layer |
| `src/app/data/dashboard-data.types.ts` | Type aliases and interfaces |
| `src/app/data/dashboard-data.seed.ts` | Static/mock data arrays |
| `src/app/data/dashboard-data.formatters.ts` | Shared utility functions (badge colors, formatters, builders) |
| `src/app/shell/services/dashboard-page-base.ts` | Abstract base class for shared dashboard engine boilerplate |
| `src/app/pages/project-dashboard/project-dashboard.component.html` | Extracted project dashboard template (4,014 lines) |
| `src/app/pages/project-dashboard/project-dashboard-navigation.service.ts` | Navigation methods and URL state management |
| `src/app/pages/project-dashboard/components/canvas-tile-shell.component.ts` | Reusable canvas tile wrapper component |
| `src/app/pages/home-page/components/home-widget-frame.component.ts` | Reusable home widget chrome component |
| `src/app/shell/services/navigation-history.service.ts` | Dynamic back button and shell title override |
| `src/app/pages/project-dashboard/components/widget-frame.component.ts` | Reusable widget frame with insight badge |
| `src/app/pages/project-dashboard/components/collapsible-subnav.component.ts` | Collapsible side subnav for canvas/desktop |
| `src/styles.css` | Design system colors, side nav, canvas layout, custom utilities |
| `src/app/pages/change-order-detail/change-order-detail-page.component.ts` | Standalone change order detail page |
| `src/app/pages/estimate-detail/estimate-detail-page.component.ts` | Standalone estimate detail page |
| `.cursor/skills/dashboard-layout-lessons/SKILL.md` | Hard-won patterns for layout engine and styling |
| `.cursor/skills/navigation-routing/SKILL.md` | Navigation architecture and routing patterns |
