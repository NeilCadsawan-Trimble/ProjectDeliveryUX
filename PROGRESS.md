# Project Delivery UX -- Progress Tracker

**Project**: Trimble Project Delivery Dashboard
**Stack**: Angular 20 + Modus Web Components + Tailwind CSS v4
**Started**: March 3, 2026
**Last Updated**: May 5, 2026
**Total Commits**: 213+

---

## Summary


| Phase | Description                                           | Status      | Items |
| ----- | ----------------------------------------------------- | ----------- | ----- |
| 1     | Foundation                                            | Done        | 7/7   |
| 2     | Mobile and Responsive                                 | Done        | 14/14 |
| 3     | Project Dashboards                                    | Done        | 12/12 |
| 4     | Multi-Page Architecture and Canvas                    | Done        | 6/6   |
| 5     | Canvas Polish and Deployment                          | Done        | 8/8   |
| 6     | Layout Engine and Quality                             | Done        | 12/12 |
| 7     | AI Agents and Sub-Page Expansion                      | Done        | 8/8   |
| 8     | Agentic Enhancements and Cross-Cutting Features       | Done        | 18/18 |
| 9     | Contracts, Detail Fixes, and Consolidation            | Done        | 12/12 |
| 10    | Optimization and Refactoring                          | Done        | 7/7   |
| 11    | Financials Expansion and Icon Quality                 | Done        | 16/16 |
| 12    | Reactive Data Store                                   | Done        | 5/5   |
| 13    | Canvas and Interaction Fixes                          | Done        | 5/5   |
| 14    | Adaptive Widget Content                               | Done        | 7/7   |
| 15    | Projects Dashboard Layout Alignment                   | Done        | 6/6   |
| 16    | Risk Tuning, Priority Sort, and Widget Compact Mode   | Done        | 7/7   |
| 17    | Sidenav Polish and UI Consistency                     | Done        | 5/5   |
| 18    | Canvas Content Alignment and ng-content Fix           | Done        | 6/6   |
| 19    | Live Weather Data and Regression Tests                | Done        | 5/5   |
| 20    | Persona Data: Bert Humphries as PM                    | Done        | 3/3   |
| 21    | Trimble ID Authentication and Vercel Deployment Fixes | Done        | 6/6   |
| 22    | Persona Profile Pages                                 | Done        | 5/5   |
| 23    | Subnav Layout Gap and Layout Seed Reset Fixes         | Done        | 6/6   |
| 24    | Pamela Chen Persona (Senior Estimator)                | Done        | 3/3   |
| 25    | Independent Per-Persona Layout Seeds                  | Done        | 5/5   |
| 26    | Layout Persistence and Pamela Seed Round-Trip         | Done        | 7/7   |
| 27    | AI Floating Prompt -- Modus Pattern Alignment         | Done        | 5/5   |
| 28    | Non-Modal AI Panel + Floating Prompt Coexistence      | Done        | 6/6   |
| 29    | Voice Input via Deepgram (real-time STT + level meter)| Done        | 11/11 |
| 30    | Remaining Work                                        | Not Started | 0/8   |


**Completed**: 223/231 items (97%)

---

## Phase 1: Foundation (Mar 3--5)

Initial project setup, core dashboard, and navigation infrastructure.

- Initial Angular 20 + Modus Web Components project scaffold
- Trimble AI Assistant panel with signal-based state
- Side navigation with Home, Projects, and Financials pages
- Draggable home dashboard widgets (RFIs, Submittals, Calendar, Time Off)
- Open Estimates widget with responsive column hiding
- Widget drag-and-drop with grid snapping
- Time Off calendar view widget

**Key commits**: `d3f7561` initial commit through `a570009` draggable widgets

---

## Phase 2: Mobile and Responsive (Mar 6--12)

Full mobile responsiveness, hamburger menu, and accessibility.

- Hamburger button toggles side navigation (6 iterations to stabilize)
- Side nav overlay mode on all screen sizes (no margin push)
- Dashboard widgets reflow to single column on mobile
- Projects KPI cards reflow to single column on mobile
- Responsive navbar with mobile "more" menu
- Navbar polish: shadow, icon styling, hamburger active state
- Projects widget mobile height cap with sticky header
- AI chat icon replaced with Trimble AI SVG
- Open Estimates responsive columns via ResizeObserver
- Mobile widget repositioning and vertical resize
- WCAG 2.1 accessibility fixes (labels, focus, ARIA)
- Mobile KPI card view for RFI and Submittals
- Compact mobile KPI view refinement
- Mobile widget widths matched to KPI cards

**Key commits**: `b40382c` hamburger fix through `6836020` compact KPI
**Lessons learned**: Hamburger/sidenav integration required 6+ attempts across different approaches (Angular output binding, DOM listeners, controlled state). Native DOM listener with capture phase was the stable solution.

---

## Phase 3: Project Dashboards and Persistence (Mar 13--17)

Per-project dashboard pages, widget persistence, touch support, and compact views.

- Project dashboard with drag-and-resize widget grid
- Widget reordering during drag (first-fit compaction)
- Persist widget layouts across page refreshes (sessionStorage)
- Compact view for RFI/Submittals widgets at narrow widths
- Calendar touch support (nav buttons, stopPropagation)
- Mobile drag restricted to 32x32px zone around handle icon
- 8 individual project dashboard pages with switcher dropdown
- Widget layout persisted per-project independently
- Mobile layout: absolute positioning to prevent overlaps
- Vertical resize snapped to 16px grid
- Custom side nav on project pages (replacing Modus WC)
- Responsive container-based reflow for project tiles

**Key commits**: `36f590a` project dashboard through `d7c0b82` responsive reflow
**Lessons learned**: Touch events on mobile require `stopPropagation` on all interactive controls to prevent drag interference.

---

## Phase 4: Multi-Page Architecture and Canvas (Mar 18--20)

Route splitting, shared layout engine, and infinite canvas mode.

- Split monolithic HomeComponent into 3 route-based pages (Home, Projects, Financials)
- Extract shared `DashboardLayoutEngine` service (deduplicate templates)
- Infinite canvas mode with spacebar panning and reset view (viewport >= 1920px, originally 2000px)
- Canvas mode added to project dashboard
- Widget z-index stacking and canvas overlap resolution
- Navbar dropdown clipping fixed in canvas mode

**Key commits**: `3730efe` split pages through `a79ac84` z-index fixes

---

## Phase 5: Canvas Polish and Deployment (Mar 22--24)

Canvas UX refinements, slug-based routing, Vercel deployment, and project selector.

- Content width aligned across all dashboard pages (1280px)
- Canvas navbar shadow with rounded corners (dedicated shadow element)
- Auto-resolve canvas overlaps on layout restore and reset
- Break project dashboard into per-project pages with slug-based routes
- GitHub push permissions fixed (removed Actions workflows)
- Vercel deployment configured (Node version, framework settings, Git integration)
- Project selector dropdown and settings icon in project dashboard navbar
- Settings icon hover rounding in canvas side nav

**Key commits**: `486bbd4` content width through `c8d71b2` settings icon rounding
**Lessons learned**: Vercel Git integration required: correct Node version env var, no framework override, email verification, and repo access grants.

---

## Phase 6: Layout Engine Refinement and Quality (Mar 24)

Push-squeeze resize algorithm, regression testing, collision resolution, and theming fixes.

### Layout Engine

- Push-squeeze resize: neighbors squeezed to 4-column minimum before being pushed
- Left-edge resize handles with push-squeeze support
- Two-phase algorithm: push first, squeeze from far end inward, relocate outermost
- Collision priority: push-squeeze active widgets get placement priority over relocated widgets
- Desktop reset in sidenav (matching canvas reset pattern)
- "Reset Widgets" renamed to "Reset Layout"; "Clean Up Overlaps" removed

### Widget Interaction

- Click outside widget deselects any selected widget (`data-widget-id` + document click)
- Trimble logo click navigates to home dashboard

### Theming and Styling

- Dark-mode side nav background matches navbar (classic-dark: `gray-10`, modern-dark: `trimble-gray`)
- Canvas navbar bottom-corner rounding via inner `modus-wc-navbar` element
- Canvas navbar `overflow: visible` preserved (dropdown clipping regression fixed)

### Quality and Testing

- Regression testing baseline: 41 unit tests (`ng test`), 55 static compliance tests (Vitest), 8 E2E specs (Playwright), TypeScript type checking
- Lessons-learned skill created (`.cursor/skills/dashboard-layout-lessons/`)

**Key commits**: `907700b` starter template through `398c85f` dark-mode and rounding fixes

---

## Phase 7: AI Agents, Sub-Page Expansion, and Refactoring (Mar 26--29)

AI widget agent architecture, data generation for all project sub-pages, and component extraction refactoring.

### AI Agent Architecture

- Widget agent system (`widget-agents.ts`) with per-context agents for every sub-page and detail view
- AI assistant automatically switches agent context when navigating between pages
- Local fallback responders for offline/demo mode
- Agent context wired to Records sub-pages (RFIs, Submittals, Daily Reports, Punch Items, Inspections, Action Items)
- Agent context wired to Financials sub-pages (Budget, Change Orders, Revenue, Cost Forecasts) and all detail views

### Data Expansion

- Generated full data sets for all 8 projects: Daily Reports, Punch Items, Inspections, Action Items, Change Orders, Revenue, Cost Forecasts, and Budget History

### Sub-Page Views and Navigation

- Grid/list views and detail pages for all new Records and Financials data types
- Full URL support (pushState/replaceState) for all detail pages with browser back/forward

### Component Refactoring

- Extracted `RecordsSubpagesComponent` (287 lines) -- daily reports, punch items, inspections, action items
- Extracted `FinancialsSubpagesComponent` (174 lines) -- change orders, revenue, cost forecasts
- Extracted `RecordDetailViewsComponent` (184 lines) -- all record detail pages
- Reduced `project-dashboard.component.ts` from ~4,860 to ~4,450 lines

**Key commits**: `a66361e` AI agents + sub-page expansion + refactoring
**PRs**: #24

---

## Phase 8: Agentic Enhancements and Cross-Cutting Features (Mar 27--29)

Agentic widget capabilities, smart home widgets, dynamic navigation, financial routing, weather integration, and code quality improvements.

### Agentic Widget Capabilities (PR #26)

- Widget agents with insights, alerts, and quick actions per widget context
- Conversation memory and local fallback responders for offline demo
- Portfolio-level agent for cross-project analysis on Home dashboard
- AI assistant context-switching on page/widget navigation

### AI Navigation and Routing (PRs #27, #28)

- AI assistant action buttons wired to Angular Router (route-based navigation)
- Markdown link rendering in AI messages with `DomSanitizer`
- Dynamic "Back" button in shared navbar (NavigationHistoryService)
- Project selector dropdown in Financials navbar for job cost detail pages

### Financial Deep-Linking (PR #28)

- Unique URLs for all Financials job cost detail pages (`/financials/job-costs/:slug`)
- Shell title override for dynamic project selector in shared navbar
- Financials job cost pages wired into agentic system

### Smart Home Widgets (PR #28)

- Urgent Needs widget: cross-project aggregation, severity/category/project filters, deep-linking to source items
- Weather Outlook widget: portfolio-wide weather conditions and work impact forecasting
- Agentic project tiles on Projects page with urgent needs and job cost links

### Weather Integration (PR #28)

- Project locations assigned (8 cities across WA, OR, and Northern CA)
- Per-project weather widget on project dashboards with 7-day forecast and work impact indicators
- Home dashboard weather consolidation widget with impact highlighting

### Code Quality and Refactoring

- Weather icon/color helpers consolidated into shared utility (`dashboard-data.ts`) -- removed duplication from 4 files
- Widget frame component extracted (`widget-frame.component.ts`)
- Collapsible subnav extracted (`collapsible-subnav.component.ts`)

**Key commits**: `952e75e` agentic capabilities, `80681a1` AI navigation fix, `00f8208` weather + agentic enhancements
**PRs**: #26, #27, #28

---

## Phase 9: Contracts, Detail Fixes, and Consolidation (Mar 29)

Contracts entity integration, detail page layout fixes, shared utility consolidation, and skill documentation.

### Contracts Integration (PR #29)

- Contract type, 22 contracts (8 prime + 14 subcontracts) with linked change orders
- Contracts financials subpage with KPI strip and grid/list views
- Contract detail view with linked change order navigation
- Contract agents wired into agentic system (subpage, detail, general)

### Standalone Detail Pages (PR #29)

- Change order detail page with cost breakdown, history, and conditions (`/change-orders/:id`)
- Estimate detail page with line items and cost summary (`/estimates/:id`)

### Layout and UX Fixes (PR #29)

- Detail page toolbar margin-left adjustment when side subnav is collapsed
- Collapsible subnav header/toolbar overlap resolved across all detail views

### Code Quality and Shared Utilities (PR #29, #30)

- Consolidated `formatCurrency` into shared utility (removed from 6 files)
- Consolidated `inspectionResultBadge` into shared utility (removed from 3 files)
- Consolidated `punchPriorityBadge` into shared utility (removed from 2 files)
- Replaced 6 duplicate `changeOrderStatusBadge`/`contractStatusColor`/`contractIcon` implementations with shared `coBadgeColor`/`contractStatusBadge`/`contractTypeIcon` delegates

### Skills and Documentation

- Created `navigation-routing` skill
- Updated `agentic-widgets` skill (sections 9-10: route-based actions, domain agents)
- Updated `dashboard-layout-lessons` skill (section 12: shared utilities, section 13: collapsed subnav toolbar overlap)

**Key commits**: `952e75e` contracts + layout fixes, `[current]` shared utility consolidation
**PRs**: #29, #30

---

## Phase 10: Optimization and Refactoring (Mar 29)

Major codebase restructuring to improve maintainability, reduce file sizes, and eliminate duplication.

### Data Layer Split

- Split `dashboard-data.ts` (1,640 lines) into `dashboard-data.types.ts` (338), `dashboard-data.seed.ts` (824), `dashboard-data.formatters.ts` (540) with barrel re-export
- Split `widget-agents.ts` (2,501 lines) into domain files under `widget-agents/`: `home-agents.ts` (471), `project-agents.ts` (901), `financials-agents.ts` (725), `portfolio-agents.ts` (344), `shared.ts` (132), `index.ts` (141)

### Project Dashboard Decomposition

- Extracted inline template (4,014 lines) to `project-dashboard.component.html` -- component .ts file reduced from 6,278 to 2,020 lines
- Extracted 30 navigation methods + URL state management into `project-dashboard-navigation.service.ts` (427 lines)
- Created `CanvasTileShellComponent` (88 lines) to DRY up repeated tile wrapper blocks -- migrated 4 tile types as proof of concept

### Shared Architecture

- Created `DashboardPageBase` abstract class (84 lines) consolidating shared engine boilerplate across project-dashboard, home-page, and financials-page
- Created `HomeWidgetFrameComponent` (73 lines) for shared widget chrome -- migrated 3 home widgets

**Key metrics**:


| File                             | Before | After                                                         |
| -------------------------------- | ------ | ------------------------------------------------------------- |
| `project-dashboard.component.ts` | 6,278  | 2,020 (+ 4,014 .html + 427 nav service)                       |
| `dashboard-data.ts`              | 1,640  | 3-line barrel (types 552 + seed 1,279 + formatters 849)       |
| `widget-agents.ts`               | 2,501  | 1-line barrel (4 domain files + shared + index = 2,714 total) |


**Tests**: 325 static tests, type-check, and build all passing.

---

## Phase 11: Financials Expansion and Icon Quality (Mar 29)

Massive financials data expansion, global Financials dashboard restructure, icon name compliance, and duplicate code consolidation.

### Financials Data and Sub-Pages

- Added 6 months of data for all financial sub-pages (estimates, change orders, job costs, invoices, payables, POs, GL, cash flow, subcontract ledger)
- Renamed "Applications for Payment" to "Billings" across all navigation, UI text, and data references
- Associated global financial data (Invoices, Payables, POs, Subcontract Ledger) to individual project financials filtered by `projectId`
- Added canvas mode rendering parity for new financial sub-pages (`purchase-orders`, `contract-invoices`, `general-invoices`)
- Added 17 static regression tests for canvas rendering parity

### Financials Dashboard Restructure

- Replaced subnav on Financials overview with `finNavLinks` navigation widget (3 columns, below KPIs)
- Added icons to all subnav items (both `finNavLinks` widget and `app-collapsible-subnav` on sub-pages)
- Added agent alert badges to Financials subnav (global and sub-page views) with `finSubnavAlerts` computed signal
- Updated project financials `financialsAlerts` mapping for all 11 sub-page agent associations

### Icon Name Compliance

- Fixed 46 invalid Modus icon names across 8 files (`flash`→`lightning`, `swap_horizontal`→`swap`, `account_balance`→`building_corporate`, `list`→`list_bulleted`, `content_copy`→`copy_content`, `people`→`people_group`, `trending_up`→`arrow_up`, `wb_sunny`→`sun`, `gauge`→`dashboard`, `dollar`→`costs`, `error`→`warning`, `package`→`cube`, `draft`→`file_new`)
- Fixed invalid weather icon map entries in `dashboard-data.formatters.ts` (`wb_sunny`→`sun`, `water_drop`→`raindrop`, `flash_on`→`thunderstorm_heavy`, `ac_unit`→`snowflake`, `air`→`wind`)

### UX Improvements

- Mobile filter bar fix: `flex-wrap` on urgent needs filter bar with hidden dividers on mobile
- User name updated from "Alex Morgan" to "Frank Mendoza" across navbar and home page

### Code Quality

- Consolidated `formatJobCost` into shared `dashboard-data.formatters.ts` (removed from 2 files)
- Consolidated `capitalizeFirst` into shared `dashboard-data.formatters.ts` (removed from 2 files)

**Tests**: 325 static tests (9 files), type-check, and lint all passing. Zero icon name violations.

---

## Phase 12: Reactive Data Store (Mar 30)

Centralized reactive state management for RFI and Submittal data, enabling agentic system to dynamically respond to status changes across the entire application.

### DataStoreService

- Created `DataStoreService` (`src/app/data/data-store.service.ts`) with writable signals for RFI and Submittal arrays, plus `updateRfiStatus()` and `updateSubmittalStatus()` mutation methods
- Renamed `RFIS`/`SUBMITTALS` exports to `RFIS_SEED`/`SUBMITTALS_SEED` in `dashboard-data.seed.ts` to clarify their role as seed data

### Reactive Consumer Wiring

- Updated `buildUrgentNeeds()` to accept `rfis`/`submittals` parameters (removed internal cache), enabling reactive re-computation when data changes
- Wired 6 consumer files to `DataStoreService`: `home-page`, `project-dashboard`, `projects-page`, `rfi-detail-page`, `dashboard-shell`, and `project-dashboard-navigation.service` -- all now read from store signals instead of static constants
- Updated `home-agents.ts` and `project-agents.ts` to pass reactive data through `AgentDataState` to `buildUrgentNeeds()`, ensuring agent insights and alerts update when RFI/Submittal statuses change

**Key files**:

- `src/app/data/data-store.service.ts` (new) -- centralized reactive data store
- `src/app/data/dashboard-data.formatters.ts` -- `buildUrgentNeeds()` now parameterized
- `src/app/data/dashboard-data.seed.ts` -- renamed seed constants

---

## Phase 13: Canvas and Interaction Fixes (Mar 30--31)

Bug fixes for canvas collision, hamburger menu, zoom controls, and navigation labels.

### Canvas Collision Fix (PR #34)

- Fixed canvas collision detection for same-size widgets in compressed chains (3-part fix in `canvas-push.ts`): excluded mover from all-pairs cleanup, conditional Phase 2 wall cascade, frozen-direction pushback
- Added 6 regression tests in `canvas-push.spec.ts` covering exact project dashboard layouts with incremental dragging (5px/20px steps)

### Construction Domain Data (PR #35)

- Updated all team member roles to construction roles across all 8 projects
- Updated all milestones and tasks to construction-oriented content
- Promoted Risks & Urgent Needs widget to top of Column 1 in project dashboard default layout (desktop and canvas)

### Hamburger and Canvas Zoom Fixes (Mar 31)

- Fixed hamburger menu for Modus scoped encapsulation (no shadow DOM): search light DOM with `querySelector`, idempotent fallback with `navExpanded.set(open)` instead of toggle
- Fixed canvas Shift+scroll zoom on macOS: picks larger axis (`deltaY` vs `deltaX`) to handle OS-level axis swap; added Ctrl/Cmd+scroll triggers; zoom anchors to viewport center

**PRs**: #34, #35
**Tests**: 90 unit tests (6 new collision regression), 325 static tests

---

## Phase 14: Adaptive Widget Content (Apr 1)

Area-adaptive content disclosure for project widgets, fade/gain visualization, and progressive text scaling.

### Area-Adaptive Widget Layout

- Replaced fixed widget tiers with area-adaptive content blocks (`ContentBlock` type) that dynamically fill available widget space based on pixel height budgeting
- Two-column (wide) layout for widgets at 6+ columns with separate left/right priority lists
- Content blocks: owner, schedule, budget, weather, urgentNeeds, sparkline, costBreakdown, insight, moreNeeds, forecast, milestone, teamSummary, costDetail, riskSummary, fadeGain

### Enhanced Large Widget Content

- Large widget tier (6+ cols, 500px+ height) with expanded block heights, richer data display: taller sparkline, detailed weather with humidity/wind, full owner info, all urgent needs, next milestone, team summary, top risk, expanded job cost details
- Weather work impact scaling: color-coded forecast day pills, warning icons, work impact notes with severity badges at large size

### Fade/Gain Visualization

- Standalone `fadeGain` content block separated from sparkline -- shows as own row at medium sizes, prominent circular badge display at large sizes; inline version suppressed when standalone block is visible

### Progressive Text Scaling

- Three-tier text scaling (`widget-text-md`, `widget-text-lg`) via CSS descendant selectors on widget container; text-2xs/text-xs/text-sm/widget-title all step up as widget grows beyond default size (5+ cols or 480px+ height for medium, 6+ cols and 500px+ height for large)

**Canvas breakpoint**: Lowered from 2000px to 1920px.
**Back button**: Standardized to always display "Back" across all instances.

---

## Phase 15: Projects Dashboard Layout Alignment (Apr 2)

Aligned the Projects Dashboard with the Home Dashboard layout engine rules, re-enabled desktop interactivity, and captured the user-designed layout as the default.

### Layout Engine Alignment

- Extended `DashboardPageBase` for `ProjectsPageComponent` (was standalone with manual engine wiring)
- Removed Projects-specific layout flags: `responsiveBreakpoints`, `responsiveSpanOverrides`, `desktopResizePriorityOrder`, `desktopReflowOnResize`, `desktopSnapToDefaultLayoutAfterDrag`, `desktopSaveDefaultLayoutSizingOnly`

### Desktop Interactivity

- Re-enabled desktop drag (removed mobile-only guard on `onWidgetHeaderMouseDown`/`onWidgetHeaderTouchStart`)
- Re-enabled widget lock toggle for all project tiles (locks priority slot position/size, not project assignment)
- Removed bottom-left resize handle (right/bottom handle only)

### Default Layout Capture

- Captured tile positions from browser via bounding box inspection and set as new defaults: 3-row layout with hero + flanking tiles (all 672px), 4 equal middle-row tiles (384px), single bottom tile; storage keys bumped v15 to v16 (desktop) and v16 to v17 (canvas)

**Key file**: `src/app/pages/projects-page/projects-page-layout.config.ts`
**Tests**: Build passing, 325 static tests, 90 unit tests

---

## Phase 16: Risk Tuning, Priority Sort, and Widget Compact Mode (Apr 3)

Corrected project risk distribution, fixed urgency-based tile ordering, added a "Sort by Priority" layout action, and ported compact mode to project dashboard widgets.

### Risk Distribution Fixes

- Fixed `seen` key normalization in `buildUrgentNeeds` -- leading-zero mismatch caused duplicate urgent need items and inflated critical counts
- Fixed year-less submittal dates in `dashboard-data.seed.ts` (`SUB-002`, `SUB-006`, `SUB-011`) -- ambiguous JS date parsing made items appear 1,400+ days overdue
- Introduced `coreWarningCount` (excludes change-order warnings) for badge and sort determination -- routine pending COs no longer inflate risk badges

### Tile Ordering Fixes

- Created `TILE_VISUAL_ORDER` constant in `projects-page-layout.config.ts` matching actual grid layout (proj1, proj2, proj3, proj6, proj7, proj4, proj5, proj8) -- numeric tile IDs don't match visual left-to-right, top-to-bottom order in the grid

### Layout Menu

- Added "Sort by Priority" to canvas and desktop Layout flyout menus (visible only on `/projects` page) -- resets tile positions to default priority order; removed "Save All Layouts as Defaults"

### Widget Compact Mode (Project Dashboard)

- Added `isRfiCompact` and `isSubmittalCompact` computed signals to `ProjectDashboardComponent` -- triggers when widget column span <= 5 or mobile, matching the home page pattern
- RFI and Submittal widgets switch to compact status summary tiles (Open, Overdue, Upcoming, Closed counts with colored icon badges) when narrow; clicking navigates to Records sub-page

**Target distribution achieved**: 1 High, 1 Moderate, 3 Low, 3 None
**Tests**: 54 sort utility tests passing, build clean

---

## Phase 17: Sidenav Polish and UI Consistency (Apr 3)

Side navigation overlay behavior, consistent spacing, mobile centering, button standardization, and cross-page title alignment.

### Sidenav Overlay

- Removed `pl-60` push behavior from dashboard shell and project dashboard -- expanded sidenav now overlays content via `position: fixed; z-index: 999` instead of shifting it
- Set fixed 56px row height on all `.custom-side-nav-item` elements so collapsed and expanded states have identical vertical rhythm (was 46px vs 56px mismatch causing icon shift on toggle)

### Mobile Icon Centering

- Scoped expanded icon-slot override (`flex: 0 0 56px`) to desktop only (`min-width: 768px`) -- in mobile, the `.expanded` class is always present when visible but the selected tile is still 48px, so a 56px slot caused overflow and off-center icons
- Added mobile-specific `padding-left: 10px` on selected item icon-slot (pixel-tuned iteratively)

### UI Consistency

- Replaced custom div-based "Create" buttons on Projects page with `<modus-button color="primary" size="sm" icon="add" iconPosition="left">` matching the "Export" button on Financials
- Aligned projects page outer padding (`py-4 md:py-6`) to match home page so titles sit at the same y-coordinate

**PRs**: #56
**Tests**: 390 static tests, type-check, lint, and build all passing

---

## Phase 18: Canvas Content Alignment and ng-content Fix (Apr 3--5)

Fixed canvas mode content projection, centering, and grid sizing across all dashboards.

### ng-content Content Projection Fix (Apr 5)

- Fixed `DashboardShellComponent` canvas mode rendering -- `<ng-content />` was inside `@if`/`@else` branches causing silent content discard; moved to single unconditional slot with CSS class switching (`canvas-content` vs `shell-content-desktop`)
- Added 4 static regression tests: exactly one `<ng-content />`, not inside conditional blocks, uses both canvas and desktop CSS classes

### Canvas Content Centering (Apr 5)

- Changed `.canvas-content` from `position: absolute` to `position: fixed` -- matched the navbar's positioning context so both use viewport-relative `left: 50%; transform: translateX(-50%)` centering
- Removed side padding (`px-4`, `max-w-screen-xl mx-auto`) from Home, Projects, and Financials page root divs in canvas mode via conditional `[class]` bindings
- Added `!important` overrides on `.canvas-content` and `.canvas-content > `* for `padding-left: 0`, `padding-right: 0`, `margin-left: 0`, `margin-right: 0`, `width: 100%`

### Projects Grid Width Fix (Apr 5)

- Recalculated `canvasDefaultLefts` and `canvasDefaultPixelWidths` in `projects-page-layout.config.ts` from `CANVAS_STEP = 81` and `GAP_PX = 16` -- old values were based on 1248px (padded) container; new values fill full 1280px (e.g., header width 1248 to 1280, tile width 300 to 308, col-8 left 632 to 648); bumped `canvasStorageKey` from v17 to v18 to invalidate cached layouts

### Skills Documentation

- Added skill section 29 (single ng-content rule) and section 30 (canvas default pixel values must use CANVAS_STEP = 81) to `dashboard-layout-lessons`

**Tests**: 390+ static tests, type-check, lint, and build all passing

---

## Phase 19: Live Weather Data and Regression Tests (Apr 5)

Connected weather widgets to the OpenWeatherMap API for live forecasts, fixed project route initialization gap, and added comprehensive regression tests.

### Live Weather Integration (PR #58)

- Created Vercel Edge Function proxy (`api/weather.ts`) -- fetches both current weather and 5-day forecast from OpenWeatherMap API with imperial units, city/state params, and edge caching (15 min s-maxage)
- Built `WeatherService` with TTL-based caching, concurrent fetch prevention (`fetchInProgress` guard), and per-city deduplication across projects sharing the same location

### Project Route Initialization Fix (PR #58)

- Fixed live weather not loading on `/project/:slug` routes -- these routes bypass `DashboardShell` so `WeatherService.initialize()` was never called; added initialization directly in `ProjectDashboardComponent.ngOnInit()`
- Replaced one-shot `initPromise` guard with `fetchInProgress` + `lastSuccessTimestamp` allowing TTL-based retries (fixes HMR stale state); added console.log/warn for fetch success/failure visibility

### Regression Tests (PR #58)

- Added 23 new static regression tests: `weather-service.spec.ts` (18 tests: initPromise banned, guards present, date filtering, error logging, API proxy structure, seed data dynamic dates), `project-dashboard.spec.ts` (3 tests: WeatherService import/inject/initialize), `dashboard-shell.spec.ts` (2 tests: WeatherService import/initialize)

**PRs**: #58
**Tests**: 413+ static tests (23 new), type-check, lint, and build all passing

---

## Phase 20: Draggable KPI Widget and Layout Engine Fixes (Apr 5)

Converted the locked KPI header on the home dashboard into a draggable/resizable widget, and fixed two layout engine regressions: resize twitchiness and widget jumping.

### Draggable KPI Widget (PR #66)

- Replaced locked `homeHeader` with draggable/resizable `homeKpis` widget
- Added `compact` input to `HomeKpiCardsComponent` for condensed vertical display inside widgets
- Moved "Welcome back, Frank" greeting to a static text line above the widget grid
- Updated `DashboardWidgetId` type, `widget-registrations.ts`, and `layout-defaults.service.ts`
- Bumped layout storage keys (`dashboard-home-v8`, `canvas-layout:dashboard-home:v15`)
- Updated canvas-push tests to replace `homeHeader` references with `homeKpis`

### Resize Twitchiness Fix (PR #66)

- Added `_hResizeActive` dead zone flag to prevent horizontal resize pipeline from running during vertical-only resize with `dir='both'`
- Horizontal processing gated on actual horizontal mouse delta exceeding half a column step

### Widget Jumping Fix (PR #66)

- Changed `resolveCollisions` and `compactAll` to initialize widget `y` from current position (`tops[id]`) instead of `0`
- Widgets can only be pushed down by overlaps; no automatic upward jumping over intervening widgets

### Skills Updated

- Added section 32: Horizontal Resize Dead Zone for `dir='both'` (Twitch Fix)
- Added section 33: Push-Down Only Collision Resolution (No Widget Jumping)

**PRs**: #66
**Tests**: lint, type-check, and build all passing

---

## Phase 20: Persona Data -- Bert Humphries as Project Manager (Apr 6)

Set Bert Humphries as the Project Manager across all 8 projects, aligning project tile ownership with the persona system.

### Project Tile Ownership

- Updated `owner` to `'Bert Humphries'` and `ownerInitials` to `'BH'` on all 8 entries in `PROJECTS` array (`dashboard-data.seed.ts`)

### Per-Project Team Rosters

- Added Bert Humphries (`id: 1`, role `'Project Manager'`) to all 8 `PROJECT_DATA` team arrays in `project-data.ts`; displaced PMs re-titled (Sarah Chen -> Asst PM, Priya Nair -> Senior Engineer, Lena Brooks -> Project Coordinator); team member summary stat counts incremented

### Skills Updated

- Added section 34 to `dashboard-layout-lessons` SKILL.md: Persona-Driven Project Ownership

**Tests**: Type-check and build passing

---

## Phase 21: Trimble ID Authentication and Vercel Deployment Fixes (Apr 7)

Added Trimble ID login gate with OAuth 2.0 PKCE flow, fixed post-auth blank page, and resolved Vercel caching issues preventing production deployments from serving updated code.

### Trimble ID Authentication (PRs #73--76)

- Trimble ID login gate with OAuth 2.0 PKCE flow (`@trimble-oss/trimble-id`), `authGuard` on all persona routes, login page, and auth callback page
- Fixed post-auth blank page: wrapped `navigateByUrl` in `NgZone.run()` in `AuthCallbackComponent` to re-enter Angular's zone after trimble-id token exchange (axios/CommonJS causes Zone.js context loss)
- Added hard-redirect fallback (`window.location.replace`) if Angular soft navigation fails
- Made OAuth `redirectUri` and `logoutRedirectUri` dynamic via `window.location.origin` (works on all Vercel deployments, not just hardcoded prod URL)

### Vercel Deployment Fixes (PRs #77--78)

- Fixed stale Angular build cache: added `rm -rf .angular/cache` before `npm run build` in `vercel.json` -- Vercel's persisted `.angular/cache` was serving route definitions from before the auth feature was added
- Fixed stale CDN cache: added `Cache-Control: no-cache, no-store, must-revalidate` headers for HTML responses in `vercel.json` -- CDN was serving 26-hour-old `index.html` referencing stale JS bundles missing auth routes

**Root cause chain**: Production showed a blank page because (1) Vercel CDN cached the old `index.html` for 26+ hours, (2) even when fresh builds deployed, the Angular build cache persisted stale route definitions, and (3) the trimble-id library's CommonJS/axios internals caused Zone.js context loss on the auth callback.

**PRs**: #73, #74, #75, #76, #77, #78
**Tests**: All lint, type-check, and build passing

---

## Phase 22: Persona Profile Pages (Apr 8)

Per-persona "My Profile" page mirroring the Trimble profile page layout, wired to the user menu dropdown.

### Profile Page

- Created `ProfilePageComponent` with two-column layout: Basic Information (avatar, first/last name) + Preferences (country, language, timezone) on left; Account Management (Rocky Mountain Contracting, profile details, passkeys) on right
- Component reads `PersonaService.activePersona()` for persona-specific data (name, email, company)

### Routing and Navigation

- Added `/:persona/profile` lazy-loaded route as child of `DashboardLayoutComponent` (protected by existing auth + persona guards)
- Wired user menu "My profile" action to navigate to `/:persona/profile` instead of opening external `https://myprofile.trimble.com/home`
- Updated `DashboardShellComponent.onUserMenuAction()` to handle `'profile'` action with internal routing

**Key files**:

- `src/app/pages/profile-page/profile-page.component.ts` (new)
- `src/app/app.routes.ts` (added profile route)
- `src/app/shell/components/user-menu.component.ts` (removed external URL)
- `src/app/shell/layout/dashboard-shell.component.ts` (profile navigation handler)

---

## Phase 23: Subnav Layout Gap and Layout Seed Reset Fixes (Apr 9--10)

Fixed subnav-to-content gap on project dashboard and resolved four layout seed/reset system bugs causing overlaps and wrong defaults on persona switch.

### Subnav Layout Gap Fix

- Fixed missing 16px gap between expanded subnav and main content on project dashboard detail/records/financials sections
- Content now expands to full width when subnav is collapsed (no residual left padding)
- Toolbar left-padding preserved unchanged (wrapped content sections in separate conditional-padding divs to avoid cascading into toolbar)

### Layout Seed System Fixes (4 bugs)

- **Frozen engine config on persona switch**: Added `updateConfigForNewSeed(seed)` to `DashboardLayoutEngine` and `getLayoutSeedForCurrentPersona()` virtual method on `DashboardPageBase`; overridden in `HomePageComponent` and `FinancialsPageComponent` for persona-specific seeds
- **Missing `compactAll()` on desktop reset/load**: Added `compactAll()` before `persistLayout()` in `resetToDefaults()` and `loadSavedDefaults()` desktop branches -- resolves overlaps after "Reset Layout"
- **Stale `LayoutDefaultsService` keys**: Updated `STATIC_BASES` and `projectBases()` version strings to match actual storage keys; added Kelly-variant keys for Home and Financials
- **Missing header lock after project change**: Added `applyInitialHeaderLock()` after `reinitLayout()` in `ProjectDashboardComponent._projectChangeEffect`

### Skills Updated

- Added section 36 to `dashboard-layout-lessons` SKILL.md: Layout Seed System -- Frozen Config, Missing compactAll, Stale Keys, Missing Header Lock

**Key files**: `dashboard-layout-engine.ts`, `dashboard-page-base.ts`, `layout-defaults.service.ts`, `home-page.component.ts`, `financials-page.component.ts`, `project-dashboard.component.ts`, `project-dashboard.component.html`
**Tests**: lint, type-check, and build all passing

---

## Phase 24: Pamela Chen Persona -- Senior Estimator (Apr 12)

New persona with role-specific home and financials dashboard layouts.

### Persona Setup

- Created Pamela Chen (Senior Estimator) persona in `PersonaService` with Classic Light default theme
- Created `home-pamela.layout.ts` with 8 estimator-focused widgets: Estimator KPIs, Open Estimates, Calendar, RFIs, Change Orders, Budget Variance, Recent Activity
- Created `financials-pamela.layout.ts` with estimator-relevant financials widgets

### Widget Registry

- Added `homeEstimatorKpis` widget to home page widget registry with estimator-specific KPI cards (Active Estimates, Pending Bids, Win Rate, Pipeline Value)

**Tests**: Build passing

---

## Phase 25: Independent Per-Persona Layout Seeds (Apr 13)

Eliminated ALL shared "default" layout seed files. Every persona now has its own independent seed file for every page. 5 personas x 4 pages = 20 seed files total.

### Architecture Change

- Deleted all shared default seeds: `home-default.layout.ts`, `financials-default.layout.ts`, `projects-default.layout.ts`, `project-detail.layout.ts`
- Created 20 independent per-persona seed files: `{page}-{persona}.layout.ts` for all combinations (home, financials, projects, project-detail) x (frank, bert, kelly, dominique, pamela)
- Updated all 4 page components (`home-page`, `financials-page`, `projects-page`, `project-dashboard`) to route each persona slug to its own dedicated seed via `switch` statement
- Updated `buildProjectsLayoutConfig()` to accept seed as parameter instead of hardcoded import
- Updated `project-dashboard` `getEngineConfig()` to use `this.getLayoutSeedForCurrentPersona()`
- Updated export tool file map in `dashboard-shell.component.ts` to map every `{page}:{persona}` to its own file

### Test and Documentation Updates

- Fixed `canvas-grid-alignment.spec.ts` to scan seed files instead of component files (was silently empty, finding no geometry maps)
- Rewrote `layout-seeds.spec.ts` with 288 tests: file existence, widget lists, cross-contamination, geometry consistency, per-persona routing, export map validation
- Updated SKILL.md section 37 (full rewrite for independent seed architecture)
- Updated longterm-memory Known Fragile Areas and Project File Map

**Tests**: Build passing, 1282 tests (1277 pass, 5 pre-existing alignment issues in `contracts` widget height)

---

## Phase 26: Layout Persistence and Pamela Seed Round-Trip (Apr 19)

Canvas/desktop layout persistence bugs, storage-key drift, canvas cleanup DOM-race, Pamela home seed overlap, and resetToDefaults test split. Merged as PR #96.

### Desktop Persistence Moved to localStorage

- `WidgetLayoutService.save()` now writes to `localStorage` (was `sessionStorage`), so desktop drags survive tab close.
- `load()` falls back to `sessionStorage` once and migrates forward so in-flight user state is preserved exactly once on upgrade.
- `remove()` clears both storages.

### Storage-Key Registry (Single Source of Truth)

- New `src/app/shell/services/layout-keys.ts` exposes `getHomeLayoutKeys`, `getFinancialsLayoutKeys`, `getProjectsLayoutKeys`, `getProjectDetailLayoutKeys`, `getAllDashboardKeys`.
- All 4 page components (`home-page`, `financials-page`, `projects-page`, `project-dashboard`) consume the registry instead of computing storage keys inline.
- `LayoutDefaultsService` iterates `getAllDashboardKeys()` across every persona -- previously hardcoded `STATIC_BASES` drifted to stale versions and `Save/Clear all visited defaults` silently skipped financials.

### Canvas Cleanup DOM-Less on Mode Re-Entry

- `cleanupCanvasOverlaps` derives `headerBottom` from signal state (`tops + heights + locked`) instead of `gridEl.getBoundingClientRect()` -- the rAF used to fire before CSS reflow on canvas -> desktop -> canvas excursions and shove every widget below a desktop-sized bogus ceiling, then persist.
- Overlap check changed from `aBottom + gap > bTop` to strict `aBottom > bTop && aTop < bBottom` so flush (0-gap) widgets stay put.
- `loadSavedDefaults` now folds `applyCanvasHeaderClearance` output into the persisted blob so saved state matches on-screen state immediately.

### Pamela Home Seed Fix

- Right-column widgets `homeOpenEstimates` (top=112..704) and `homeRfis` (top=560..1008) shared a 144x632px rectangle in both desktop and canvas seeds; cleanup shoved them on every load and the shipped defaults didn't round-trip.
- Shifted `homeRfis` down (canvas 560 to 720, desktop 384 to 480) and `homeBudgetVariance` down (canvas 1024 to 1184, desktop 848 to 944). Kept `homeOpenEstimates` tall (h=592) to preserve its feature-widget intent.

### `resetToDefaults` Test Split

- Original single test asserted "all signals equal config defaults" with a config placing `w3` at top=400 in cols 9-16 with nothing above it; `compactAll` (added in Phase 23) correctly pulls it to top=0.
- Split into two tests in `dashboard-layout-engine.spec.ts`: one pins default-application using an already-compact config (compactAll no-op), the other pins compactAll's gap elimination using the floating-widget config.

### New Regression Coverage

- `src/app/shell/services/layout-seed-clearance.spec.ts` (41 tests): every shipped seed x page combo must round-trip through `applyCanvasHeaderClearance` and `cleanupCanvasOverlaps` with zero movement; cleanup must never push a widget below a locked widget it does not horizontally overlap.
- `src/app/shell/services/layout-defaults.service.spec.ts`: registry coverage per persona x page, `saveAllVisitedDefaults` / `clearAllDefaults` behavior.
- `src/app/shell/services/widget-layout.service.spec.ts`: save -> localStorage, load preferred + sessionStorage fallback migration.
- `src/app/shell/services/dashboard-layout-engine.spec.ts > canvas save/load round-trip`: 11 new tests covering touching-is-not-overlap, DOM-less clearance, canvas -> desktop -> canvas byte-identical blob, loadSavedDefaults persistence, etc.
- `e2e/layout-persistence.spec.ts`: canvas F5, canvas -> mobile -> canvas, Save & Load Default with a second-widget change, Reset Layout reverts, financials canvas drags survive round-trip, desktop F5 persistence.

### Skills Updated

- Added sections 38-42 to `dashboard-layout-lessons` SKILL.md: Shipped seeds must round-trip through their own cleanup, desktop = localStorage, storage-key registry, canvas cleanup DOM-less on mode re-entry, `resetToDefaults` split-test pattern.
- Added 7 rows to the quick-reference table.

### Tests

- `npm run lint:all` -- 7/7 pass
- Static tests -- 1296 pass (16 files)
- `npm run type-check` -- pass
- `npx ng build` -- clean
- `npx ng test --no-watch` -- 237 pass (incl. 41 seed-clearance cases + 11 canvas save/load round-trip)

**PR**: #96 (merged to main)

---

## Phase 27: AI Floating Prompt -- Modus Pattern Alignment (Apr 29)

Aligned the AI floating prompt pill (`ai-floating-prompt.component.ts` + `.ai-floating-prompt-bar` styles) with the official [Modus AI Floating Prompt pattern](https://modus.trimble.com/patterns/ai-ux-floating-prompt/overview). Pulled the reference TSX and CSS directly from the pattern site's Code tab and matched the geometry, surface tokens, and edge-glow shadow stack 1:1.

### Items

- **Custom 32px circular send button** (`.ai-floating-prompt-send-btn`) -- replaced legacy text-input-shaped affordance and a brief detour through `<modus-button shape="circle">` (the wrapper's `color="secondary"` resolved to Trimble brand yellow, not the muted blue shown on the pattern site). New button is `div[role="button"]` with manual keyboard handling so the project's `<button>`-forbidden lint rule still passes.
- **Theme-aware fill** -- `var(--primary)` background with `var(--primary-foreground)` glyph; disabled state uses `color-mix(in srgb, var(--primary) 30%, var(--background))` and keeps the arrow at `var(--foreground)` for the dark-glyph-on-soft-blue look from the reference.
- **Stop variant** -- `.ai-floating-prompt-send-btn--stop` switches to `var(--error)` / `var(--error-foreground)` for unambiguous "interrupt streaming" semantics during the working phase.
- **Pill geometry to spec** -- removed `min-height: 56px`, switched padding to `0.375rem 0.5rem` (Modus `py-1.5 px-2`), and confirmed `--ai-floating-prompt-pill-shadow` / `-shadow-focus` tokens already matched the Modus reference's primary-tinted edge + 4-layer focus glow byte-for-byte.
- **Surface-text override scoping** -- updated `.ai-floating-prompt-bar i.modus-icons` rule to skip `.ai-floating-prompt-send-btn` descendants so the button's own `--primary-foreground` glyph wins over the pill chrome's `--ai-floating-prompt-surface-text` override (this rule had previously been catching icons inside the prior `<modus-button>` instance and forcing the arrow to black).

### Skill updates

- `.cursor/skills/dashboard-layout-lessons/SKILL.md` -- added section on the AI floating prompt pattern alignment and the wrapper `color="secondary"` pitfall.

### Test results

- `npm run lint:all` -- pass (8/8 checks)
- `npm run test:static` -- pass (1352 tests, 17 files; updated `--ai-floating-prompt-height` assertion from 72px to 56px)
- `npm run type-check` -- pass
- `npx ng build --configuration=production` -- clean (only pre-existing budget/CJS warnings)

**PR**: #108 (merged to main, commit `c03b921`)

---

## Phase 28: Non-Modal AI Panel + Floating Prompt Coexistence (Apr 29)

Made the Trimble Assistant slide-out drawer non-modal so the floating prompt and the rest of the app stay reachable while the panel is open. The two surfaces are now true peers, both bound to the same `AiPanelController` singleton, with the floating prompt yielding to the drawer when it is open and reclaiming the conversation the moment the user touches the pill.

### Items

- **Drawer-open forces floating prompt back to default** -- `phase` computed in `ai-floating-prompt.component.ts` short-circuits to `'default'` when `controller.drawerOpen()` is true. No response card, no working pill, even mid-stream; the drawer owns the conversation surface while the prompt collapses to chips + the standalone composer pill.
- **Mousedown + focusin host listeners close the drawer** -- new `onFloatingPromptInteract()` `@HostListener` on the floating prompt component calls `controller.closeDrawer()` whenever the drawer is open and the user touches the composer or a chip (click before focus, or keyboard tab-in). The outer `.ai-floating-prompt` wrapper is `pointer-events: none`, so empty space around the pill stays inert -- only interactive children fire the close.
- **Removed the full-viewport dismiss scrim** -- deleted `.ai-floating-prompt-drawer-dismiss` from both `ai-assistant-panel.component.ts` and `src/styles.css`. The drawer portal keeps `pointer-events: none` and the panel itself keeps `pointer-events: auto`, so clicks anywhere outside the right-side panel pass straight through to widgets, navbar, and the floating prompt.
- **Drawer is non-modal: `aria-modal="false"`** -- relaxed the modal contract in the panel template since users can now operate the rest of the page while the drawer is open. Dismissal is via the X button, `Escape` (already wired), or the floating-prompt host listener above.
- **Conversation continuity** -- panel and floating prompt are bound to the same `controller.messages()`, `controller.thinking()`, `controller.inputText()`, and `controller.send()` signals. A reply that streams while the drawer is open updates `messages()` in real time, and the floating prompt's response card surfaces the same conversation the moment the drawer closes (no replay, no fetch).
- **Drawer header is now context-aware** -- the H3 in the drawer binds to `controller.title()` (`widgetFocusService.aiAssistantTitle`), the same source that drives the floating prompt's textarea label and the welcome text. When a widget is selected or the route changes, the drawer heading swaps from "Trimble Assistant" to the agent-specific title, matching the welcome-text behavior.

### Skill updates

- `.cursor/skills/dashboard-layout-lessons/SKILL.md` -- added section 44 covering the non-modal coexistence contract (phase short-circuit, host listeners, scrim removal, pointer-events split, context-aware header) and appended a Quick Reference row.

### Test results

- `npm run test:static` -- pass (1362 tests, 17 files; +5 regression tests in `tests/static/ai-floating-prompt.spec.ts` for non-modal markup, dismiss-rule absence, portal/drawer pointer-events split, drawer-open phase short-circuit, host listeners, and dynamic H3 binding)
- `npx ng build` -- clean (only pre-existing budget/CJS warnings)

---

## Phase 29: Voice Input via Deepgram (May 5)

Real-time speech-to-text on the AI floating prompt mic button. Streams microphone audio to Deepgram Nova-3 over a WebSocket, transcribes with construction-domain keyterm vocabulary, and writes interim + final transcripts directly into the composer textarea. Includes a CSS-variable-driven pulsing ring on the mic button that scales with live audio RMS.

### Backend (Vercel Edge Function + dev-proxy parity)

- `api/deepgram-token.ts` Edge Function mints short-lived (~30s) ephemeral access tokens via `POST https://api.deepgram.com/v1/auth/grant`; never leaks the master `DEEPGRAM_API_KEY` to the browser.
- `dev-proxy.mjs` mirrors the same endpoint at `http://localhost:3001/api/deepgram-token` for `npm start` parity. Both implementations enforce GET-only, return 500 if the env var is missing, 502 (without echoing the key) on Deepgram errors, and `Cache-Control: no-store`.
- `.env.example` documents `DEEPGRAM_API_KEY` placement; gitignored `.env` holds the real key.
- **Member-role API key requirement**: Deepgram's `auth/grant` endpoint requires the master key to have at least the `Member` role. Read-only or project-scoped keys silently 403 with "Insufficient permissions" -- which surfaces as "the mic does nothing" in the UI. Documented in skill section 45 with a 1-line curl smoke test.

### Browser pipeline (`VoiceInputService`)

- New `src/app/services/voice-input.service.ts` owns the entire client-side flow: token fetch, `getUserMedia`, `MediaRecorder` (250ms opus chunks), Deepgram WebSocket via `@deepgram/sdk`, transcript merging (committed + interim), and full resource cleanup.
- WebSocket auth uses the SDK's browser handshake (`Sec-WebSocket-Protocol: bearer, <jwt>`) -- raw `new WebSocket(url)` cannot set custom headers and the protocol-array form isn't documented on Deepgram's public site.
- `AudioContext + AnalyserNode` runs a 60fps `requestAnimationFrame` RMS loop **outside** Angular's zone, writing directly to `--mic-level` CSS variable on `documentElement`. No template binds to the level signal, so we skip 60 change-detection passes per second.
- Five resource types (MediaStream, MediaRecorder, AudioContext, WebSocket, rAF callback) all release through one idempotent `cleanup()` path.
- v5 SDK gotcha: `interim_results`, `smart_format`, `punctuate` ConnectArgs are typed as `'true' | 'false'` strings -- `tsc --noEmit` skips the check, but `ng build` refuses to compile if you pass actual booleans. Static test enforces the string form.

### Stop hooks (six entry points)

Voice capture must stop on every conceivable end-of-conversation signal: explicit Send (button click + Enter key), Escape, `controller.thinking()` becoming true, `visibilitychange: hidden`, `DestroyRef.onDestroy`, and the existing mic-button toggle. All six route through the same `cleanup()` to prevent stale sessions surviving navigation or background tabs.

### Construction-domain vocabulary (Tier 2 keyterm prompting)

- New `src/app/data/voice-vocabulary.ts` exports a `VOICE_GLOSSARY` with five buckets (acronyms, processes, trades, equipment, Trimble products) -- ~120 hand-curated terms.
- `buildVoiceKeyterms(dataStore)` merges the static glossary with `dataStore.projects().map(p => p.name)` and `PERSONAS.map(p => p.name)`, de-duplicated, so proper nouns transcribe correctly without manual upkeep.
- 150-entry ceiling enforced by static test (keeps the WebSocket URL under sensible caps).

### UI states

Mic button has four visible states bound to `voice` signals on the composer pill component:
- **Idle**: plain mic icon, foreground-60 colour
- **Connecting**: `is-connecting` class, primary colour, 0.8s breathing keyframe
- **Listening**: `is-listening` class, error colour, icon swaps to `stop`, `::after` shadow ring scales by `--mic-level` (0..1 RMS)
- **Disabled** (browser unsupported): `is-disabled` class, `tabindex=-1`, `aria-disabled=true`
- **Error**: tooltip swaps to a state-specific hint via `micTooltip` computed (denied / network / token-failed)

### Cleanup of placeholder

- Removed `simulateListening()` placeholder method from `ai-panel-controller.ts` (orphaned after this work).

### Tests

- `tests/static/deepgram-token-endpoint.spec.ts` (NEW) -- 16 tests: Edge Function structure, dev-proxy parity, env-var docs, master-key non-leak, CORS, error shapes, no-store cache header
- `tests/static/voice-vocabulary.spec.ts` (NEW) -- 24 tests: glossary shape, high-value terms (RFI, submittal, Trimble Connect, ...), URL safety, dedup, size cap, service wiring (`keyterm: buildVoiceKeyterms(...)`, model `nova-3`, string booleans)
- `tests/static/ai-floating-prompt.spec.ts > Voice input wiring (Deepgram)` (NEW block) -- 13 assertions: imports, signal bindings, tooltip states, transcript piping into `controller.inputText`, mic icon swap, every stop hook, placeholder removal

### Skill updates

- Added section 45 to `dashboard-layout-lessons` SKILL.md covering the architecture, Member-role trap, dual-implementation rule (Edge Function + dev-proxy), SDK browser auth subprotocol, NgZone discipline, idempotent cleanup, keyterm vocabulary layering, the v5 string-boolean gotcha, and the don't-break contract table.
- Extended the skill's frontmatter description to include the voice-input pipeline keywords.
- Added a Quick Reference row pointing at all source and test files.

### Test results

- `npm run lint:all` -- pass
- `npm run test:static` -- pass (1415 tests, 19 files; +53 new assertions)
- `npm run type-check` -- pass
- `npx ng build` -- clean (one pre-existing budget warning slightly worse due to `@deepgram/sdk` ~200KB SDK addition; accept the tradeoff for browser auth handshake handling)

---

## Phase 30: Remaining Work

Features and improvements not yet started.

### Backend Integration

- REST API integration (replace mock data in `src/app/data/`)
- Real-time data updates (WebSocket or polling)

### Testing

- E2E tests with Playwright (configured but minimal coverage)
- Visual regression tests (screenshot comparison across themes)
- Performance benchmarks for layout engine (large widget counts)

### Features

- Export functionality (PDF/CSV for reports)
- Notification system
- User preferences persistence (server-side, not just sessionStorage)

---

## Regression Test Coverage

### Covered (Static Tests -- `tests/static/` -- 1280+ tests)


| Area                  | File                            | Tests                                                                                                                                                                                  |
| --------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard shell       | `dashboard-shell.spec.ts`       | 50 tests: hamburger, navExpanded, weather service init, reset flyout, labels, dynamic back button, overlay behavior, single ng-content, canvas/desktop CSS classes                     |
| Home page             | `home-page.spec.ts`             | 20 tests: widgets, urgent needs, weather outlook, persona routing                                                                                                                      |
| Projects page         | `projects-page.spec.ts`         | 19 structural tests                                                                                                                                                                    |
| Financials page       | `financials-page.spec.ts`       | 11 structural tests                                                                                                                                                                    |
| Project dashboard     | `project-dashboard.spec.ts`     | 125 tests: widgets, weather service init, tile detail, subnav, layout menu, per-prefix canvas completeness, grid/list parity, toolbar icons, canvas rendering parity, overlay behavior |
| Weather service       | `weather-service.spec.ts`       | 18 tests: initPromise banned, fetch guards, date filtering, error logging, API proxy structure, seed data dynamic dates                                                                |
| CSS regressions       | `styles.spec.ts`                | 23 tests: side nav overflow, reset flyout, canvas navbar, row heights, expanded alignment, mobile centering                                                                            |
| Canvas panning        | `canvas-panning.spec.ts`        | 10 tests: spacebar panning, lock canvas                                                                                                                                                |
| Canvas grid alignment | `canvas-grid-alignment.spec.ts` | 580+ tests: canvas tops/heights GAP alignment, pixel widths, 1280px grid fill (scans all 20 seed files)                                                                               |
| Layout seeds          | `layout-seeds.spec.ts`          | 288 tests: file existence (20 files), widget lists, cross-contamination, geometry keys, persona routing, export map                                                                    |
| Template safety       | `template-safety.spec.ts`       | 123 tests: arrow function prevention, private member access                                                                                                                            |
| Side nav click util   | `side-nav-click.util.spec.ts`   | 7 tests: navigation click handling                                                                                                                                                     |
| Signal safety         | `signal-safety.spec.ts`         | 4 tests: signal initialization patterns                                                                                                                                                |
| Modus navbar wrapper  | `modus-navbar-wrapper.spec.ts`  | 2 tests: flushPropsToWc, native rendering                                                                                                                                              |


### Covered (Unit Tests -- `src/app/shell/services/`)


| Area            | File                              | Tests                                                                                                                                                                                       |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout engine   | `dashboard-layout-engine.spec.ts` | Push-squeeze (right/left), squeeze before push, far-end squeeze, resize min-width                                                                                                           |
| Canvas BFS push | `canvas-push.spec.ts`             | 22 tests: basic push, cascade direction, mover immunity, post-BFS cleanup, locked widgets, off-screen clamping, axis selection, real-world detail expansion, same-size collision regression |
| Widget layout   | `widget-layout.service.spec.ts`   | Save/load layout persistence                                                                                                                                                                |
| Canvas reset    | `canvas-reset.service.spec.ts`    | Reset trigger signal                                                                                                                                                                        |
| Projects sort   | `projects-page-utils.spec.ts`     | 54 tests: sort-by-urgency, rewriteDynamicNeeds, CO approval, budget threshold, status change                                                                                                |


### Not Yet Covered

- E2E browser tests (Playwright configured, minimal specs)
- Visual regression (no screenshot baseline)
- Theme switching verification (manual only)
- Mobile-specific behavior (touch drag, reflow)

---

## Chat Sessions


| Date      | Session                                                               | Topics                                                                                                                                                                                    |
| --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mar 23    | [Initial setup](348b2862-fd0b-474a-9ed3-4270d9ec1bc4)                 | Dev server startup                                                                                                                                                                        |
| Mar 23    | [GitHub and Vercel](0b841993-1534-43b7-8fa6-b99bd77e5e30)             | First GitHub push, Vercel deploy, rendering fixes                                                                                                                                         |
| Mar 23    | [Layout and deployment](b90d3dde-b222-49be-9649-3bc611187ed1)         | Desktop resize rules, canvas collision, Vercel linking, project selector                                                                                                                  |
| Mar 24    | [Engine refinement](bc28969b-5fd7-49fc-907e-894008a53ccc)             | Push-squeeze algorithm, regression testing, collision priority, theming, skills                                                                                                           |
| Mar 25    | [Canvas compact mode](8807b645-9b9a-4f2d-b223-80e249dd101f)           | Compact mode revert on canvas resize                                                                                                                                                      |
| Mar 26    | [Memory and detail views](b3ea14f9-5bd7-453f-8329-20bad1e7cc3a)       | Short-term memory, detail view navigation, URL state                                                                                                                                      |
| Mar 26-27 | [Canvas push and tests](6387a8f3-f2de-4dae-933b-eeec94687608)         | Canvas detail expansion, BFS push refactoring, cascade direction fix, unit tests, AI agents, sub-page expansion, refactoring                                                              |
| Mar 27-29 | [Agentic and weather](6387a8f3-f2de-4dae-933b-eeec94687608)           | Agentic widgets, AI navigation, urgent needs, financial routing, weather widgets, dynamic back button, refactoring                                                                        |
| Mar 29    | [Contracts and consolidation](76bc1c7e-999f-450e-9650-709afeb8457f)   | Contracts integration, detail page layout fix, shared utility consolidation, skill updates, optimization and refactoring                                                                  |
| Mar 29    | [Financials expansion](b6cd3110-bece-4ecf-9fe2-fcbe115ee7c8)          | Financials data expansion, sub-page restructure, finNavLinks widget, agent badges, icon compliance, mobile filter fix, user rename, code consolidation, reactive data store               |
| Mar 30    | [Collision and domain data](b6cd3110-bece-4ecf-9fe2-fcbe115ee7c8)     | Canvas collision frozen-direction pushback, construction domain data, risks widget layout promotion                                                                                       |
| Mar 31    | [Hamburger and zoom](331f2cb4-f365-4109-8821-f8801018796f)            | Scoped encapsulation hamburger fix, canvas Shift+scroll zoom macOS fix, viewport center zoom                                                                                              |
| Apr 1     | [Adaptive widgets](331f2cb4-f365-4109-8821-f8801018796f)              | Area-adaptive content blocks, wide widget layout, large widget content, weather work impact, fade/gain visualization, text scaling, canvas breakpoint 1920px, back button standardization |
| Apr 2     | [Projects layout alignment](20b36c27-0715-4a36-9c40-ec6f32104d80)     | Projects Dashboard layout alignment with Home rules, DashboardPageBase extension, desktop drag/resize/lock re-enabled, default layout capture from browser                                |
| Apr 3     | [Risk tuning and priority sort](a29bd855-b58b-4bf6-91ef-c3a10be2e2a3) | Risk distribution fixes (seen keys, year-less dates, coreWarningCount), TILE_VISUAL_ORDER, Sort by Priority menu                                                                          |
| Apr 3     | [Widget compact mode](328a8c37-da05-488d-86ec-0a6b40525f96)           | RFI/Submittal compact mode ported to project dashboard, colSpan-based responsive switching                                                                                                |
| Apr 3     | [Sidenav polish](a54ba709-8451-4a34-a90f-ccb02aad30e5)                | Sidenav overlay (no push), consistent 56px row heights, mobile icon centering, Create button standardization, title y-coordinate alignment                                                |
| Apr 3--5  | [Canvas alignment](57efcfde-5b2b-43c8-af3e-933f418e9ae1)              | ng-content projection fix, canvas content centering (fixed positioning), side padding removal, projects grid 1248 to 1280 recalculation, skills sections 29-30                            |
| Apr 5     | [Live weather fix](fb55d8c2-9c39-4110-99b0-9930aed93e09)              | Weather widget live data, WeatherService init on project routes, date filtering, API proxy, seed data dynamic dates                                                                       |
| Apr 5     | [Weather regression tests](fb55d8c2-9c39-4110-99b0-9930aed93e09)      | 23 new weather regression tests, PR #58 merged to main                                                                                                                                    |
| Apr 5     | [KPI widget and layout fixes](56f15e0d-1c0c-4cb6-82f7-2018d33f1ec3)   | Draggable KPI widget, resize twitchiness fix, push-down only collision (no jumping), PR #66 merged to main                                                                                |
| Apr 6     | [Bert Humphries as PM](current)                                       | Set Bert Humphries as Project Manager on all 8 projects, updated team rosters, skills section 34                                                                                          |
| Apr 7     | [Auth and Vercel fixes](2c2f59d8-3267-405f-ae9b-62cbe76d9ac6)         | Trimble ID login gate, post-auth blank page fix (NgZone.run), dynamic OAuth URIs, Vercel build cache clear, CDN no-cache headers, PRs #73--78                                             |
| Apr 8     | [Persona profile pages](current)                                      | Per-persona "My Profile" page, user menu wired to internal route                                                                                                                          |
| Apr 9--10 | [Layout seed fixes](b1397210-081e-4c0b-a8b0-fb54c1a16492)             | Subnav layout gap fix, layout seed system 4-bug fix (frozen config, compactAll, stale keys, header lock), skill section 36                                                                |
| Apr 12    | [Pamela Chen persona](current)                                        | Senior Estimator persona, Open Estimates widget, home/financials layout seeds                                                                                                              |
| Apr 13    | [Independent layout seeds](fe9bcb72-dbe7-42b8-9b30-0983a749b0b3)      | Eliminated all shared default seeds, 20 independent per-persona seed files, 288 layout-seed tests, canvas-grid-alignment rewrite, SKILL section 37 rewrite                                |
| May 5     | [Voice input via Deepgram](71f5c973-71cd-430a-85fc-b3e0b3283d8a)      | Deepgram Nova-3 STT on mic button, ephemeral-token Edge Function + dev-proxy parity, construction keyterm vocabulary, level-meter pulsing ring, six stop hooks, 53 new static tests, SKILL section 45 |


---

## Key Files


| File                                                                          | Purpose                                                                                  |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/shell/services/dashboard-layout-engine.ts`                           | Core layout engine (drag, resize, push-squeeze, collision)                               |
| `src/app/shell/services/canvas-push.ts`                                       | BFS push algorithm for canvas mode collision resolution                                  |
| `src/app/shell/services/canvas-detail-manager.ts`                             | Canvas detail overlay management (shared by home + project)                              |
| `src/app/shell/services/subpage-tile-canvas.ts`                               | Tile-based canvas for project subpages                                                   |
| `src/app/shell/layout/dashboard-shell.component.ts`                           | Shared shell (navbar, sidenav, AI panel, document click)                                 |
| `src/app/shell/services/widget-focus.service.ts`                              | Widget selection state for AI panel                                                      |
| `src/app/shell/services/widget-layout.service.ts`                             | Widget layout persistence (sessionStorage)                                               |
| `src/app/shell/services/canvas-reset.service.ts`                              | Reset trigger signal                                                                     |
| `src/app/shell/services/theme.service.ts`                                     | Theme switching and persistence                                                          |
| `src/app/pages/home-page/home-page.component.ts`                              | Home dashboard (RFIs, Submittals, Calendar, Time Off, Urgent Needs, Weather Outlook)     |
| `src/app/pages/projects-page/projects-page.component.ts`                      | Projects portfolio dashboard (risk badges, priority sorting)                             |
| `src/app/pages/projects-page/projects-page-layout.config.ts`                  | Projects tile grid layout config and visual order                                        |
| `src/app/pages/projects-page/projects-page-utils.ts`                          | Sort-by-urgency, risk distribution helpers                                               |
| `src/app/pages/financials-page/financials-page.component.ts`                  | Financials dashboard                                                                     |
| `src/app/pages/project-dashboard/project-dashboard.component.ts`              | Shared project detail dashboard (used by 8 project routes)                               |
| `src/app/pages/project-dashboard/components/records-subpages.component.ts`    | Extracted Records sub-page views (daily reports, punch items, inspections, action items) |
| `src/app/pages/project-dashboard/components/financials-subpages.component.ts` | Extracted Financials sub-page views (change orders, revenue, cost forecasts)             |
| `src/app/pages/project-dashboard/components/record-detail-views.component.ts` | Extracted record detail pages (daily report, inspection, punch item, change order)       |
| `src/app/data/widget-agents.ts`                                               | Barrel re-export for AI widget agents                                                    |
| `src/app/data/widget-agents/`                                                 | Domain-split agent files: home, project, financials, portfolio, shared                   |
| `src/app/data/data-store.service.ts`                                          | Centralized reactive data store for RFIs and Submittals                                  |
| `src/app/data/dashboard-data.ts`                                              | Barrel re-export for dashboard data layer                                                |
| `src/app/data/dashboard-data.types.ts`                                        | Type aliases and interfaces                                                              |
| `src/app/data/dashboard-data.seed.ts`                                         | Static/mock data arrays                                                                  |
| `src/app/data/dashboard-data.formatters.ts`                                   | Shared utility functions (badge colors, formatters, builders)                            |
| `src/app/shell/services/dashboard-page-base.ts`                               | Abstract base class for shared dashboard engine boilerplate (incl. persona seed swap)    |
| `src/app/shell/services/layout-defaults.service.ts`                           | Manages "Save All Defaults" with versioned storage key pairs                             |
| `src/app/data/layout-seeds/`                                                  | 20 independent per-persona layout seeds (5 personas x 4 pages), no shared defaults       |
| `src/app/pages/project-dashboard/project-dashboard.component.html`            | Extracted project dashboard template (4,014 lines)                                       |
| `src/app/pages/project-dashboard/project-dashboard-navigation.service.ts`     | Navigation methods and URL state management                                              |
| `src/app/pages/project-dashboard/components/canvas-tile-shell.component.ts`   | Reusable canvas tile wrapper component                                                   |
| `src/app/pages/home-page/components/home-widget-frame.component.ts`           | Reusable home widget chrome component                                                    |
| `src/app/shell/services/navigation-history.service.ts`                        | Dynamic back button and shell title override                                             |
| `src/app/pages/project-dashboard/components/widget-frame.component.ts`        | Reusable widget frame with insight badge                                                 |
| `src/app/pages/project-dashboard/components/collapsible-subnav.component.ts`  | Collapsible side subnav for canvas/desktop                                               |
| `src/app/services/weather.service.ts`                                         | Live weather data fetching with TTL cache and concurrent fetch guard                     |
| `api/weather.ts`                                                              | Vercel Edge Function proxy for OpenWeatherMap API                                        |
| `src/app/services/voice-input.service.ts`                                     | Deepgram STT pipeline (token fetch, getUserMedia, MediaRecorder, WebSocket, level meter) |
| `src/app/data/voice-vocabulary.ts`                                            | Construction glossary + buildVoiceKeyterms(dataStore) helper for Tier 2 keyterm prompting |
| `api/deepgram-token.ts`                                                       | Vercel Edge Function -- mints short-lived Deepgram ephemeral access tokens               |
| `src/app/pages/profile-page/profile-page.component.ts`                        | Per-persona "My Profile" page (mirrors Trimble profile layout)                           |
| `src/app/services/auth.service.ts`                                            | Trimble ID authentication (OAuth 2.0 PKCE, token management, dynamic redirect URIs)      |
| `src/app/pages/auth-callback/auth-callback.component.ts`                      | OAuth callback handler with NgZone.run() for Zone.js re-entry                            |
| `vercel.json`                                                                 | Vercel deployment config (build cache clear, CDN no-cache headers, SPA rewrites)         |
| `src/styles.css`                                                              | Design system colors, side nav, canvas layout, custom utilities                          |
| `src/app/pages/change-order-detail/change-order-detail-page.component.ts`     | Standalone change order detail page                                                      |
| `src/app/pages/estimate-detail/estimate-detail-page.component.ts`             | Standalone estimate detail page                                                          |
| `.cursor/skills/dashboard-layout-lessons/SKILL.md`                            | Hard-won patterns for layout engine and styling                                          |
| `.cursor/skills/navigation-routing/SKILL.md`                                  | Navigation architecture and routing patterns                                             |


