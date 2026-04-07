---
name: dashboard-layout-lessons
description: Hard-won patterns for the dashboard layout engine, canvas-mode styling, and widget interaction. Use when modifying push-squeeze resize logic, collision resolution, canvas BFS push algorithm, canvas detail expansion, canvas navbar/sidenav CSS, widget selection/deselection, overflow behavior, tile detail template patterns, view-mode parity, area-adaptive widget content, CSS text scaling, canvas zoom, aligning page layouts with the shared DashboardPageBase, modifying the Modus navbar (including hamburger, Trimble logo, icon order, and fallback rendering), the collapsible subnav component, or the toolbar search/filter layout. Covers pitfalls that have caused repeated regressions.
---

# Dashboard Layout Lessons

Patterns distilled from real regressions. Each section describes the problem, the root cause, and the proven fix.

## 1. Push-Squeeze Resize Algorithm

**File:** `src/app/shell/services/dashboard-layout-engine.ts` -- `applyResizePushSqueeze`

### Correct cascade order (right-edge resize)

When widget A is resized rightward into neighbors B and C (B closer, C farther):

1. **Push phase** -- Push ALL neighbors outward from A, maintaining their original snapshot widths. Cursor cascades left-to-right: `cursor = rRight + gap`, each widget placed at cursor.
2. **Squeeze phase** -- If the last widget overflows the container, squeeze from the **far end inward** (C first, then B) down to `minWidth` (4 columns).
3. **Relocate phase** -- If overflow persists after all widgets are at minWidth, relocate (revert to snapshot position) the **outermost** widget and restart with remaining active widgets.

### Critical: far-end-first ordering

```typescript
// Squeeze from far end inward (last element = outermost)
for (let i = active.length - 1; i >= 0 && overflow > 0; i--) {
  const canSqueeze = Math.max(snap[id].width - minWidth, 0);
  const squeeze = Math.min(canSqueeze, overflow);
  widths[id] -= squeeze;
  overflow -= squeeze;
}

// Relocate outermost widget when squeeze is insufficient
const relocateId = active[active.length - 1];
lefts[relocateId] = snap[relocateId].left;
widths[relocateId] = snap[relocateId].width;
active.pop();
```

Left-edge resize mirrors this with underflow instead of overflow.

## 2. Collision Priority After Push-Squeeze

**File:** `src/app/shell/services/dashboard-layout-engine.ts` -- `resolveCollisions`

### The bug

After push-squeeze, a **relocated** widget (restored to its snapshot position) can overlap horizontally with a **properly-placed** (active) widget. The vertical collision resolver processes widgets sorted by top. If the relocated widget appears first in sort order, it gets placed at y=0 and the active widget gets pushed down -- backwards.

### The fix: `_pushSqueezeActive` set

Track which widgets were actively placed by push-squeeze:

```typescript
private _pushSqueezeActive: Set<string> = new Set();
```

At the end of `applyResizePushSqueeze`, store `finalActive`:

```typescript
this._pushSqueezeActive = new Set(finalActive);
```

In `resolveCollisions`, add active widgets to `placed` first, then process only non-active widgets in the collision loop:

```typescript
const activeSet = isHResize ? this._pushSqueezeActive : new Set<string>();
if (isHResize) {
  for (const id of sorted) {
    if (id === movedId || !activeSet.has(id)) continue;
    placed.push(id);
  }
}
for (const id of sorted) {
  if (id === movedId || activeSet.has(id)) continue;
  // ... vertical collision resolution ...
}
```

This ensures relocated widgets yield to active widgets, not the other way around.

### Regression test

Unit tests in `dashboard-layout-engine.spec.ts` cover:
- Right-edge squeeze of far-end neighbor first
- Left-edge squeeze of far-end neighbor first
- Proper relocation ordering

## 3. Canvas Navbar: overflow Must Be visible

**File:** `src/styles.css` -- `.canvas-navbar`

### The bug

Setting `overflow: hidden` on `.canvas-navbar` clips the project selector dropdown on project pages. This has regressed multiple times.

### The fix

Keep `overflow: visible` on the container. Apply `border-radius` directly to the inner Modus web component element so its own background paints with rounded corners:

```css
.canvas-navbar {
  overflow: visible;            /* NEVER set to hidden -- clips dropdowns */
  border-radius: 0 0 12px 12px;
}

.canvas-navbar modus-wc-navbar .modus-wc-navbar {
  border-radius: 0 0 12px 12px; /* rounds the actual painted background */
}
```

### Regression tests

`tests/static/styles.spec.ts` asserts:
- `.canvas-navbar` has `overflow: visible` (not hidden, not auto)
- `.canvas-navbar` has `border-radius`
- Inner `modus-wc-navbar .modus-wc-navbar` has `border-radius`

## 4. Dark-Mode Side Nav Background

**File:** `src/styles.css`

### The bug

The side nav uses `background: var(--background)` which maps to `--modus-wc-color-base-page`. In light themes and connect-dark this matches the navbar. But in classic-dark and modern-dark, the Modus navbar overrides its background to a different color, creating a visual mismatch.

### Navbar backgrounds per theme

| Theme | Navbar background |
|-------|-------------------|
| Default (all) | `var(--modus-wc-color-base-page)` |
| `modus-classic-dark` | `var(--modus-wc-color-gray-10)` |
| `modus-modern-dark` | `var(--modus-wc-color-trimble-gray)` |

### The fix

Add theme-specific overrides for both side nav variants:

```css
[data-theme="modus-classic-dark"] .custom-side-nav,
[data-theme="modus-classic-dark"] .canvas-side-nav {
  background: var(--modus-wc-color-gray-10);
}

[data-theme="modus-modern-dark"] .custom-side-nav,
[data-theme="modus-modern-dark"] .canvas-side-nav {
  background: var(--modus-wc-color-trimble-gray);
}
```

These raw Modus variables are acceptable in `styles.css` infrastructure CSS (not in component templates).

## 5. Widget Selection and Deselection

**File:** `src/app/shell/services/widget-focus.service.ts`, `src/app/shell/layout/dashboard-shell.component.ts`

### Selection flow

1. User mousedown on widget header triggers `onWidgetHeaderMouseDown` in `DashboardLayoutEngine`
2. Engine calls `config.onWidgetSelect?.(id)`
3. Page wires this to `widgetFocusService.selectWidget(id)`
4. `WidgetFocusService._selectedWidgetId` signal updates
5. Templates conditionally apply `border-primary` vs `border-default`

### Click-outside deselection

All widget containers have `[attr.data-widget-id]`. The `dashboard-shell` already has `(document:click)` for menu closing. Add one guard at the top:

```typescript
onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (this.widgetFocusService.selectedWidgetId() && !target.closest('[data-widget-id]')) {
    this.widgetFocusService.clearSelection();
  }
  // ... existing menu-close logic ...
}
```

`target.closest('[data-widget-id]')` returns null for clicks on the grid background, navbar, sidebar, or AI panel. Clicks inside widgets (including headers, content, resize handles) all bubble through a `data-widget-id` ancestor.

## 6. Canvas BFS Push Algorithm

**File:** `src/app/shell/services/canvas-push.ts` -- `runCanvasPushBfs`

This is the collision resolution algorithm for canvas mode (infinite canvas). It is **separate** from the desktop push-squeeze algorithm in section 1. It uses BFS to propagate pushes through overlapping widgets.

### Three-phase structure

1. **BFS phase** -- Starting from `movedId`, push all overlapping non-locked widgets outward. Each pushed widget is re-queued so its new position can cascade to further widgets.
2. **Post-BFS cleanup** -- Cascade pushes can shove a widget back into the mover. Iterate over all widgets and re-push any that still overlap with `movedId`.
3. **Locked widget resolution** -- Locked widgets are immovable. After BFS, push any non-locked widget that overlaps with a locked widget.

### Critical: cascade direction must reference the MOVER

**This bug broke canvas mode 3 times.** When widget A (the mover) pushes B and C to the same position (e.g., both to `left=816`), a cascade push from C tries to push B. If the push direction is determined relative to C's center, B may be pushed *left* (back toward A), trapping it behind the mover.

The fix: for cascade pushes, determine left/right (or up/down) direction relative to the **mover's** center, not the cascade pusher's center:

```typescript
// dirRef = the mover for cascade pushes, the pusher for initial pushes
const dirRef = (pusherId === movedId) ? p : rects[movedId];
const dirCX = dirRef.left + dirRef.width / 2;

if (pushH) {
  if (oCX >= dirCX) {
    // Push right (away from mover)
    rects[otherId] = { ...o, left: pR + gap };
  } else {
    // Push left (away from mover)
    const candidateLeft = p.left - o.width - gap;
    rects[otherId] = candidateLeft >= 0
      ? { ...o, left: candidateLeft }
      : { ...o, left: pR + gap };  // fallback to right if off-screen
  }
}
```

### Critical: mover immunity in BFS

The mover must never be pushed by other widgets during BFS. Without this guard, cascade pushes can displace the expanding widget itself:

```typescript
for (const otherId of ids) {
  if (otherId === pusherId) continue;
  if (otherId === movedId) continue;  // CRITICAL: mover is never pushed
  if (isLocked[otherId]) continue;
  // ...
}
```

### Critical: dual-heuristic axis selection

The axis choice (push horizontally vs vertically) uses different heuristics depending on who is pushing:

- **Initial push** (from mover): Compare clearance distances. `clearR = pRight + gap - o.left` vs `clearD = pBottom + gap - o.top`. Pick the axis requiring less movement.
- **Cascade push** (from another widget): Compare center-to-center distances. `|oCX - pCX|` vs `|oCY - pCY|`. Pick the axis with greater separation.

Mixing these up causes widgets to be pushed in the wrong direction. The initial push uses clearance because the mover may have expanded asymmetrically (wide but not tall). The cascade push uses center distance because the pusher is already at its final position.

### Off-screen clamping fallbacks

When a left push would produce `candidateLeft < 0`, fall back to pushing right. When an upward push would produce `candidateTop < 0`, fall back to horizontal push (right if `oCX >= dirCX`, left otherwise). Never push a widget off-screen.

### Overlap detection includes gap

The `hasOverlap` function includes the gap in its AABB check. Two widgets separated by less than `gap` are considered overlapping:

```typescript
const hasOverlap = (a: string, b: string): boolean => {
  const ar = rects[a], br = rects[b];
  return ar.left < br.left + br.width + gap && br.left < ar.left + ar.width + gap
      && ar.top < br.top + br.height + gap && br.top < ar.top + ar.height + gap;
};
```

### Regression tests

16 unit tests in `canvas-push.spec.ts` cover:
- Basic push (single overlap, vertical push, gap enforcement)
- Mover immunity
- Cascade direction (outward cascade, same-position cascade, direction relative to mover)
- Post-BFS cleanup
- Locked widgets
- Off-screen clamping fallbacks
- Axis selection (clearance vs center-distance)
- Real-world home page detail expansion scenario

## 7. Canvas Detail Manager

**File:** `src/app/shell/services/canvas-detail-manager.ts`

Manages the expansion of a regular widget into a detail view (e.g., clicking an RFI widget to see full RFI details) in canvas mode. Shared between `home-page` and `project-dashboard` via the `CanvasDetailEngine` interface.

### Double requestAnimationFrame for size updates

When opening a detail, the widget's dimensions must be updated *after* Angular has rendered the current state. A single `requestAnimationFrame` is not enough because Angular's change detection may not have flushed yet. Use a double rAF:

```typescript
openDetail(sourceWidgetId: string, detail: DetailView, engine: CanvasDetailEngine): void {
  // 1. Save baseline and original rect
  // 2. Add detail view to signal
  this.canvasDetailViews.update(v => ({ ...v, [sourceWidgetId]: detail }));

  // 3. Double rAF: first rAF queues after current frame, second rAF
  //    runs after Angular has processed the detail view addition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      engine.widgetPixelWidths.update(w => ({ ...w, [sourceWidgetId]: DETAIL_WIDTH }));
      engine.widgetHeights.update(h => ({ ...h, [sourceWidgetId]: DETAIL_HEIGHT }));
      engine.pushFromWidget(sourceWidgetId);
    });
  });
}
```

Without the double rAF, `pushFromWidget` reads stale dimensions and pushes incorrectly.

### Baseline snapshot pattern

Before expanding any detail, snapshot the entire layout. On close, restore all non-detail, non-locked widgets to their baseline positions. This prevents layout drift when multiple details are opened and closed in sequence:

```typescript
if (!this._baselineSnapshot) {
  this._baselineSnapshot = {
    tops: { ...engine.widgetTops() },
    lefts: { ...engine.widgetLefts() },
    widths: { ...engine.widgetPixelWidths() },
    heights: { ...engine.widgetHeights() },
  };
}
```

The baseline is cleared only when the last detail widget is closed (`remainingIds.length === 0`).

### CanvasDetailEngine interface

Both `DashboardLayoutEngine` (home page) and `SubpageTileCanvas` (project pages) expose the same interface so `CanvasDetailManager` can operate on either:

```typescript
export interface CanvasDetailEngine {
  widgetTops: WritableSignal<Record<string, number>>;
  widgetLefts: WritableSignal<Record<string, number>>;
  widgetPixelWidths: WritableSignal<Record<string, number>>;
  widgetHeights: WritableSignal<Record<string, number>>;
  widgetLocked: () => Record<string, boolean>;
  pushFromWidget: (widgetId: string) => void;
}
```

### Close timing

Detail close uses `setTimeout(fn, TRANSITION_MS)` (350ms) to wait for CSS transitions before restoring layout. This prevents visual jarring where widgets snap to baseline positions before the closing animation finishes.

## 8. Subpage Tile Canvas

**File:** `src/app/shell/services/subpage-tile-canvas.ts`

A self-contained canvas manager for project subpages (RFIs, Submittals, Drawings, etc.) where each item is a tile.

### Locked widgets

Some tiles are immovable (e.g., a list view widget). Locked tiles are tracked in a signal and excluded from BFS push:

```typescript
this.locked = signal<Record<string, boolean>>(
  config.lockedIds.reduce((acc, id) => ({ ...acc, [id]: true }), {})
);
```

Locked tiles can still *push* other tiles (via the locked-widget resolution pass in `runCanvasPushBfs`), but they are never displaced.

### Config-driven tile layout

Tile positions are computed from a grid config: `columns`, `tileWidth`, `tileHeight`, `gap`, `offsetTop`, `offsetLeft`. New tiles are placed in row-major order. Existing positions are preserved from `sessionStorage`:

```typescript
if (existing[id] && !lockedRects[id]) {
  next[id] = existing[id];  // preserve saved position
} else if (!lockedRects[id]) {
  const col = idx % columns;
  const row = Math.floor(idx / columns);
  next[id] = {
    top: offsetTop + row * (tileHeight + gap),
    left: offsetLeft + col * (tileWidth + gap),
    width: tileWidth,
    height: tileHeight,
  };
}
```

### Detail expansion reuses BFS push

`SubpageTileCanvas.openDetail` follows the same double-rAF pattern as `CanvasDetailManager.openDetail`, then calls `resolveCanvasPush` which delegates to `runCanvasPushBfs`. This keeps all push logic in one place.

## 9. Tile Detail Expansion -- Template Pattern

**File:** `project-dashboard.component.ts` (template section)

**Related skill:** `canvas-subpage-checklist` has the full mandatory checklist.

### The bug (occurred multiple times)

New sub-page tile types were created with card-only rendering (no `@if/@else` for detail expansion). Clicking a tile navigated away from the canvas instead of expanding in-place. This happened because the new tiles copied only the card portion of the RFI/Submittal pattern, omitting:

1. The `@if (tileDetailViews()['tile-X-' + id]; as detail)` detail block
2. The z-index boost to 9999 when detail is open
3. The `FromTile` click handler (used page navigation instead)
4. The `subnavViewMode() !== 'list' || tileDetailViews()[...]` outer gate
5. List row `bg-primary-20` highlighting for active details

### The rule

Every tile type in canvas mode must have the **complete dual-mode pattern**. The RFI tile is the reference implementation. When creating a new tile type, copy the full RFI tile structure (outer gate, wrapper div, `@if` detail / `@else` card, z-index, mousedown, click handlers) and adapt the content. Never create a card-only tile.

### Quick template checklist

```
Outer @if gate:    subnavViewMode() !== 'list' || tileDetailViews()['tile-X-' + id]
Wrapper class:     'absolute' + conditional ' widget-detail-transition'
Z-index:           tileDetailViews()['tile-X-' + id] ? 9999 : (tileZ()['tile-X-' + id] ?? 0)
Mousedown:         selectTileWidget + stopPropagation when detail open
Inner @if:         tileDetailViews()['tile-X-' + id]; as detail → expanded content
Inner @else:       card tile with FromTile click handler
List row:          [class.bg-primary-20]="!!tileDetailViews()['tile-X-' + id]"
```

## 10. View Mode Parity

**Related skill:** `view-mode-parity` has the full enforcement rules.

**Regression test:** `tests/static/project-dashboard.spec.ts` -- "canvas mode rendering parity" sections auto-extract every page from `FINANCIALS_PAGES_WITH_CONTENT` and `RECORDS_PAGES_WITH_CONTENT` and verify each has a corresponding `activeFinancialsPage() === 'X'` or `activeRecordsPage() === 'X'` branch in the canvas template. Adding a page to either set without adding a canvas rendering branch will fail the test.

### The bug (occurred multiple times)

Features were added to desktop mode but not to canvas mode (or vice versa). Examples:

- Desktop list had Weather and Safety columns for Daily Reports; canvas list did not
- Desktop had KPI summary cards for financials pages; canvas mode did not
- Canvas tiles used page navigation instead of in-canvas detail expansion
- New financials sub-pages (purchase-orders, contract-invoices, general-invoices) were wired into desktop mode and `FINANCIALS_PAGES_WITH_CONTENT` but had no canvas-mode rendering branch, causing blank content at viewport >= 2000px

### The rule

When a feature is added to ANY view mode, it must be added to ALL applicable view modes in the same implementation pass. The three modes are: desktop (non-canvas), canvas card/grid, and canvas list. See the `view-mode-parity` skill for the full parity matrix and verification checklist.

## 11. Angular Template Compile Errors -- Arrow Functions & Private Members

**Related test:** `tests/static/template-safety.spec.ts` (88 tests scanning all non-demo components)

### The bug (occurred at least twice)

1. **Arrow functions in event bindings**: `(click)="signal.update(v => !v)"` causes `NG5002: Parser Error: Unexpected token >`. Angular's template parser does not support arrow function syntax.
2. **Private member access in templates**: `(click)="engine.saveAsDefaultLayout()"` causes `TS2341: Property 'engine' is private`. Templates can only access public members.

### The fix

- **Arrow functions**: Use `.set(!signal())` or call a named method instead of `.update(v => !v)`.
- **Private members**: Create a public wrapper method (e.g., `saveDefaultLayout()`) that delegates to the private field.

### Prevention

`template-safety.spec.ts` scans all component inline templates for:
- `=>` inside any `(event)="..."` binding (catches arrow functions)
- Known private field names used in event/property/interpolation bindings

This catches both errors at the static test level before any build is attempted.

## 12. Shared Utility Functions -- Avoid Duplication Across Components

**Files**: `src/app/data/dashboard-data.ts` (utilities), multiple consumer components

### The bug (occurred during weather widget implementation)

Weather icon mapping and color logic was duplicated across 4 files: `project-dashboard.component.ts`, `home-page.component.ts`, `records-subpages.component.ts`, and `record-detail-views.component.ts`. Each file had its own static map with slightly different entries. When a new condition was added in one file, the others didn't get updated.

### The fix: centralize into `dashboard-data.ts`

All helper functions that map data to display values (icons, colors, badges) must live in `src/app/data/dashboard-data.ts` and be imported by consumer components:

```typescript
// In dashboard-data.ts
export function weatherIcon(condition: string): string {
  return WEATHER_ICON_MAP[condition.toLowerCase()] ?? 'cloud';
}

export function weatherIconColor(condition: string): string {
  return WEATHER_COLOR_MAP[condition.toLowerCase()] ?? 'text-foreground-60';
}

export function workImpactBadge(impact: 'none' | 'minor' | 'major'): { cls: string; label: string } { ... }
```

Components delegate to the shared function:

```typescript
// In component
import { weatherIcon as sharedWeatherIcon } from '../../data/dashboard-data';

weatherIcon(condition: string): string {
  return sharedWeatherIcon(condition);
}
```

### The rule

When adding a mapping function (icon, color, badge, status text) that could apply to more than one component:

1. Define it in `dashboard-data.ts` (or a dedicated utilities file)
2. Export it as a named function
3. In each component, create a thin delegate method that calls the shared function
4. **Never** create a `private static readonly` map in multiple components for the same purpose

### Existing shared utilities

| Function | Purpose |
|----------|---------|
| `weatherIcon(condition)` | Maps weather condition string to Modus icon name |
| `weatherIconColor(condition)` | Maps weather condition to Tailwind text color class |
| `workImpactBadge(impact)` | Returns `{ cls, label }` for weather work impact badges |
| `urgentNeedCategoryIcon(cat)` | Maps urgent need category to icon name |
| `budgetProgressClass(pct)` | Returns Tailwind class for budget progress bar |
| `getProjectWeather(projectId)` | Fetches weather data for a project |
| `buildUrgentNeeds()` | Builds and caches the full urgent needs list |
| `formatCurrency(value)` | Compact USD formatting: $1.2M / $45K / $1,234 |
| `inspectionResultBadge(result)` | Maps pass/fail/conditional/pending to ModusBadgeColor |
| `punchPriorityBadge(priority)` | Maps high/medium/low to ModusBadgeColor |
| `contractStatusBadge(status)` | Maps active/closed/pending/draft to ModusBadgeColor |
| `contractTypeLabel(ct)` | Full label: "Prime Contract" / "Subcontract" / "Purchase Order" |
| `contractTypeLabelShort(ct)` | Short label: "Prime" / "Subcontract" / "PO" |
| `contractTypeIcon(ct)` | Maps contract type to Modus icon name |
| `coBadgeColor(status)` | Maps CO status (pending/approved/rejected) to ModusBadgeColor |
| `coTypeLabel(coType)` | Maps CO type to display label |
| `coTypeIcon(coType)` | Maps CO type to Modus icon name |
| `statusBadgeColor(status)` | Maps ProjectStatus to ModusBadgeColor |
| `estimateBadgeColor(status)` | Maps EstimateStatus to ModusBadgeColor |

## 13. Collapsed Subnav Toolbar Overlap on Detail Pages

**File:** `src/app/pages/project-dashboard/project-dashboard.component.ts` -- `#detailContent` template

### The bug

When a detail page (RFI, Contract, Change Order, etc.) is open with the collapsible side subnav collapsed, the top toolbar (`childPageSubnav`) slides beneath the collapsed subnav header. The collapsed subnav's layout width goes to 0 but its header floats at 227px wide via `position: absolute` with `z-index: 10`.

### Why it happened

The non-detail subpages (records list, financials list) already wrap the toolbar with a conditional `margin-left: 227px` when collapsed:

```html
<div class="transition-all duration-200" [style.margin-left.px]="sideSubNavCollapsed() && !isMobile() ? 227 : 0">
  <ng-container [ngTemplateOutlet]="childPageSubnav" ... />
</div>
```

But the shared `#detailContent` template rendered the toolbar without this wrapper. Since `#detailContent` is used both with and without a subnav (e.g., drawing details don't have one), the margin needs a three-way condition.

### The fix

Wrap the `childPageSubnav` in `#detailContent` with a conditional margin that checks all three conditions:

```html
<div class="transition-all duration-200"
  [style.margin-left.px]="detailHasSubNav() && !isMobile() && sideSubNavCollapsed() ? 227 : 0">
  <ng-container [ngTemplateOutlet]="childPageSubnav"
    [ngTemplateOutletContext]="{ $implicit: subnavConfigs[detailSubnavKey()] }" />
</div>
```

The condition:
- `detailHasSubNav()` -- only when records/financials (not drawings, not standalone)
- `!isMobile()` -- subnav is hidden on mobile
- `sideSubNavCollapsed()` -- only when actually collapsed

### Why the content below doesn't need margin

The collapsed header is ~48px tall. The toolbar is ~56px + 24px margin-bottom = 80px total. Content below the toolbar starts well past the 48px header, so no overlap occurs below the toolbar.

### The rule

Whenever a new template uses the `childPageSubnav` alongside a `CollapsibleSubnavComponent`, the toolbar must be wrapped with the margin-left adjustment. Check both the list subpage template AND the detail content template.

## 13. Canvas Grid Alignment (16px Global Grid)

All canvas default values -- `HEADER_HEIGHT`, `canvasDefaultTops`, `canvasDefaultHeights` -- must be multiples of 16 (`DashboardLayoutEngine.GAP_PX`). This ensures every widget edge lands on the same global grid, so widgets in different rows align vertically when given equal heights.

### The rule

1. Every `HEADER_HEIGHT`, `*_HEIGHT`, and height constant must be `round(value / 16) * 16`.
2. Since `HEADER_OFFSET = HEADER_HEIGHT + GAP_PX` and `GAP_PX = 16`, offsets are automatically aligned when heights are aligned.
3. Row tops are calculated as cumulative `height + GAP_PX` sums -- all automatically grid-aligned when individual heights are.
4. The `applyCanvasDefaults()` method in `DashboardLayoutEngine` now snaps all tops and heights to the 16px grid as a safeguard.
5. Bump `canvasStorageKey` after changing any default values to force layout reset.

### Why this matters

Without grid alignment, widgets in different conceptual rows can have different starting offsets (e.g., 246px vs 602px vs 958px). Even though interactive resize snaps to 16px, the initial positions are off-grid, so edges never align. With all values as 16px multiples, the global grid is consistent and bottom edges of same-height widgets always match.

### Regression test

`tests/static/canvas-grid-alignment.spec.ts` -- 70 tests that parse all 6 page files and verify every `canvasDefaultTops` and `canvasDefaultHeights` value is a multiple of 16.

## 14. Wall Cascade Two-Phase: Mover-vs-Opposite-Side Overlap

**File:** `src/app/shell/services/canvas-push.ts` -- `runCanvasPushBfs`

### The bug

When a wide mover overlaps 4+ widgets and those widgets are near a locked boundary, the wall cascade pushes the mover backward but fails to resolve overlaps between the mover and widgets that BFS pushed in the **opposite** direction. This creates visible widget overlap in canvas mode.

### Why it happens

1. The mover's center divides overlapping widgets into two groups: widgets whose centers are left of the mover's center get pushed LEFT, and those right get pushed RIGHT.
2. With 4+ widgets, some get pushed left while the rest cascade right toward the locked boundary.
3. When the rightward chain hits the locked widget, a frozen-wall cascade compresses the chain back, pushing the mover leftward.
4. The mover now overlaps the leftward-pushed widgets, but the wall cascade doesn't fix this because: (a) the mover doesn't become a wall, and (b) the leftward widgets aren't walls either.

### Why a simple `pushAway` cleanup is WRONG

The first fix attempted was a post-wall-cascade pass that called `pushAway(movedId, otherId)` for any widget still overlapping the mover. This introduced a regression: `pushAway` uses different axis selection heuristics than the wall cascade and doesn't cascade -- widgets pushed by `pushAway` can overlap other widgets without resolution. **Never use `pushAway` as a post-wall-cascade fix.**

### The correct fix: two-phase wall cascade

The wall cascade is split into two phases, both using the **same** wall-push logic (extracted into `wallPushOne`):

- **Phase 1** (existing): Frozen/locked widgets are walls. The mover is NOT a wall and can be pushed backward by chain members. Pushed non-mover widgets become walls.
- **Phase 2** (new): The mover is promoted to a wall. Any non-wall widget overlapping the mover is pushed away using the same wall-cascade logic and itself becomes a wall, cascading naturally.

```typescript
// Phase 1: compress chain toward the mover
for (let pass = 0; pass < ids.length * 3; pass++) {
  // ... wall cascade loop (mover excluded from walls) ...
  if (!anyFixed) break;
}

// Phase 2: promote mover to wall, resolve opposite-side overlaps
walls.add(movedId);
for (let pass = 0; pass < ids.length * 2; pass++) {
  // ... same wall cascade loop (mover now included in walls) ...
  if (!anyFixed) break;
}
```

Both phases share a `wallPushOne` helper that positions the target at gap distance from the wall using center-based direction logic -- identical to the original wall cascade.

### Why 3 or fewer widgets didn't trigger this

With fewer widgets, all overlapping widgets tend to be on the same side of the mover's center, so they all get pushed in the same direction. The wall cascade compresses and pushes the mover back, but there are no opposite-side widgets to collide with.

### Regression tests

7 new tests in `canvas-push.spec.ts`:
- `4-widget cascade through locked wall: all compress, no overlap`
- `5-widget cascade through locked wall: all compress, no overlap`
- `wide mover overlaps 4 widgets at once against locked: no overlap`
- `mover dragged into 4 stacked widgets with widget below: no overlap`
- `vertically stacked widgets pushed down against locked: no overlap`
- `vertically stacked drag into 4 widgets with side neighbor: no overlap`
- `mixed horizontal+vertical layout near locked: no overlap`

## 15. Same-Size Widget Oscillation and Frozen-Direction Mover Pushback

**File:** `src/app/shell/services/canvas-push.ts` -- `runCanvasPushBfs`

### The bug

When dragging the bottom widget of a column upward into a stack of 4+ widgets, overlaps occur specifically in columns with wide (11-col) widgets but not narrow (5-col) widgets. The overlap appears as two widgets occupying the same vertical space.

### Root cause 1: same-size widget oscillation in all-pairs cleanup

In the project dashboard, Column 1 has widgets with identical dimensions (875x320px). During the all-pairs cleanup loop (which resolves residual overlaps after BFS), the mover and its neighbor create an oscillation:

1. Widget A pushes neighbor B upward (A has >= size, so A is the pusher)
2. Widget C pushes neighbor B downward (C has >= size, so C is the pusher)
3. B ends up in the same overlapping position, the loop never converges

Column 2 doesn't trigger this because widget sizes differ enough that the pusher/target relationships are stable.

### Fix: exclude the mover from all-pairs cleanup

The mover should never participate in the cleanup loop -- neither as a pusher nor as a target. Its position is the user's drag position (or constrained by `clampMoveAgainstLocked`) and should not be adjusted by the general cleanup:

```typescript
for (const aId of ids) {
  if (isLocked[aId] || aId === movedId) continue;  // skip mover as pusher
  for (const bId of ids) {
    if (bId === aId || isLocked[bId] || bId === movedId) continue;  // skip mover as target
    // ... pushAway logic ...
  }
}
```

### Root cause 2: unconditional Phase 2 wall cascade

Phase 2 of the wall cascade (promoting the mover to a wall) ran unconditionally. When the mover was far from the compressed boundary, Phase 2 would incorrectly push widgets away from the mover even though the mover hadn't been pushed back by Phase 1.

### Fix: conditional Phase 2

Snapshot the mover's position before Phase 1. Only run Phase 2 if Phase 1 actually displaced the mover:

```typescript
const moverBefore = { ...rects[movedId] };
// ... Phase 1 ...
const moverPushedBack = rects[movedId].left !== moverBefore.left
                     || rects[movedId].top !== moverBefore.top;
if (moverPushedBack) {
  walls.add(movedId);
  // ... Phase 2 ...
}
```

### Root cause 3: two-candidate pushback fails in compressed chains

The original "final mover pushback" tried both directions (e.g., up and down) for each overlapping widget and picked the one that didn't create new overlaps. In a fully compressed chain (contiguous widgets from locked header to bottom), **both** directions overlap other widgets. The fallback (minimum displacement) pushed the mover deeper into the chain, creating cascading oscillation.

### Fix: frozen-direction pushback

Instead of testing two candidates, compute the average center of all frozen/locked widgets. Push the mover in the **opposite** direction (away from the compressed boundary). This naturally cascades the mover through the chain until it exits:

```typescript
if (frozen.size > 0) {
  let frozenSumY = 0, frozenCount = 0;
  for (const fid of ids) {
    if (isLocked[fid] || frozen.has(fid)) {
      frozenSumY += rects[fid].top + rects[fid].height / 2;
      frozenCount++;
    }
  }
  const frozenCY = frozenSumY / frozenCount;

  for (let pass = 0; pass < ids.length * 2; pass++) {
    let anyFixed = false;
    for (const otherId of ids) {
      if (otherId === movedId || isLocked[otherId]) continue;
      if (!hasOverlap(movedId, otherId)) continue;
      const m = rects[movedId];
      const o = rects[otherId];
      const mCY = m.top + m.height / 2;
      if (mCY >= frozenCY) {
        rects[movedId] = { ...m, top: o.top + o.height + gap };  // push below
      } else {
        rects[movedId] = { ...m, top: o.top - m.height - gap };  // push above
      }
      anyFixed = true;
    }
    if (!anyFixed) break;
  }
}
```

For the project dashboard (locked header at top, chain below), the mover cascades downward: overlap with `risks` → push below risks → overlap with `rfis` → push below rfis → no more overlaps. Done in 2 iterations.

### Why Column 2 (narrow widgets) didn't trigger this

Column 2 widgets have different heights (320, 240, 192, 256, 320), so:
- The all-pairs cleanup has stable pusher/target relationships (no oscillation)
- The chain compresses asymmetrically, leaving gaps the mover can fit into

### The rule

When a compressed chain has no free internal space for the mover:
1. **Never** let the mover participate in all-pairs cleanup (it oscillates with same-size neighbors)
2. **Never** run Phase 2 wall cascade unless Phase 1 actually pushed the mover
3. **Always** push the mover away from the frozen boundary, not toward minimum displacement

### Regression tests

6 new tests in `canvas-push.spec.ts` under "project dashboard: incremental vertical drag against locked header":
- `column 1: single large drag upward produces no overlap`
- `column 1: incremental 20px drag upward (100 steps) never creates overlap`
- `column 1: incremental 5px drag upward (400 steps) never creates overlap`
- `column 2: incremental 20px drag upward (100 steps) never creates overlap`
- `both columns: incremental drag of bottom column 1 widget never creates overlap`
- `same-size widgets: mover with identical dimensions to neighbor produces no overlap`

## 16. Hamburger / Side Nav Toggle -- mainMenuOpenChange Only

### Failure modes (historical)

**Blocked sync:** An `effect()` that always called `attachHamburgerListener()` found the native main-menu control and set `_hamburgerAttached = true`. `onMainMenuToggle` then skipped `navExpanded.set(open)` when `_hamburgerAttached` was true, while a capture listener used `stopImmediatePropagation()` -- net result: sidenav did not track the Modus open state reliably.

**Wrong target:** `attachHamburgerListener` queried `[aria-label="Main menu"]` on the navbar host. That matches the **Angular fallback** `div` in `slot="start"` before any native control, attaching duplicate handlers and blocking `mainMenuOpenChange`.

**Missing binding:** `ProjectDashboardComponent` had no `(mainMenuOpenChange)` on `modus-navbar`. With native toolbar rendering, only Modus toggled internal state; `navExpanded` never updated.

### Current architecture (do this)

1. **Native toolbar:** Bind `(mainMenuOpenChange)="onMainMenuToggle($event)"` and **`[mainMenuOpen]="navExpanded()"`** on every app `modus-navbar` (shell **and** project dashboard, canvas **and** desktop). The input keeps `modus-wc-navbar` in sync with the custom side nav; without it, Stencil state and `navExpanded` can diverge.

2. **`ModusNavbarComponent`** listens with native `addEventListener` on `modus-wc-navbar`. Those callbacks must run inside **`NgZone.run()`** before emitting Angular outputs, or change detection may not run and the UI will not update.

3. **Do not** sync `mainMenuOpen` to the WC when the input is `undefined` (skip in `flushPropsToWc` / effect) so consumers without a binding do not overwrite Stencil defaults.

4. **`onMainMenuToggle`:** Use `if (typeof open === 'boolean') this.navExpanded.set(open)` in case `CustomEvent.detail` is ever malformed.

5. **Fallback (`@if (!navbarNativeRendered())`):** The template `div.shell-navbar-hamburger` uses `(click)="navExpanded.set(!navExpanded())"` -- that path does not use `mainMenuOpenChange`.

6. **Do not** add `attachHamburgerListener`, `_reattachHamburgerEffect`, or capture-phase click hacks on the Modus main menu. Canvas/desktop switch already destroys and recreates the navbar; Angular re-binds outputs on the new instance.

### Critical: scoped vs shadow DOM

`modus-wc-navbar` (and `modus-wc-button`, `modus-wc-toolbar`) use Stencil scoped encapsulation: `shadowRoot` is usually `null`; children live in light DOM. The Angular wrapper listens for `mainMenuOpenChange` from the web component -- rely on that output, not manual DOM listeners.

### Mobile side nav: icons only

On mobile (< 768px), the side nav renders at 56px width (icons only). The CSS rule `.custom-side-nav.expanded { width: 56px }` inside `@media (max-width: 767px)` enforces this. Template labels must be guarded with `navExpanded() && !isMobile()` to avoid text rendering in the narrow column.

### Rules

1. **Every `modus-navbar` that can show the native main menu** must wire `(mainMenuOpenChange)` **and** `[mainMenuOpen]="navExpanded()"` to sync `navExpanded`.
2. **`onMainMenuToggle`** should set `navExpanded` only when `typeof open === 'boolean'`; the wrapper emits from `NgZone.run()`.
3. **Do not** attach capture listeners to the Modus hamburger or to `[aria-label="Main menu"]` on the navbar host (conflicts with fallback slot content).
4. **Guard side nav labels** with `navExpanded() && !isMobile()` to prevent text in the 56px mobile column.
5. **`@if (!isMobile() || navExpanded())`** controls side nav DOM presence on mobile.
6. **Never assume Modus web components use shadow DOM.** Scoped encapsulation is the norm; prefer wrapper outputs over querying internals.

## 17. Area-Adaptive Widget Content Blocks

**File:** `src/app/pages/projects-page/projects-page.component.ts`

### The pattern

Instead of fixed breakpoints for widget content tiers, use a **pixel-height budgeting** system that dynamically selects which content blocks to show based on available area and aspect ratio.

### Architecture

1. **`ContentBlock` type** -- union of all possible content sections (e.g., `'owner' | 'schedule' | 'budget' | 'weather' | 'sparkline' | 'fadeGain' | ...`).
2. **`BLOCK_HEIGHTS`** -- `Record<ContentBlock, number>` mapping each block to its approximate pixel height cost.
3. **`LARGE_BLOCK_HEIGHTS`** -- `Partial<Record<ContentBlock, number>>` with inflated heights for blocks that expand at large sizes (e.g., sparkline: 80 → 100, weather: 28 → 40).
4. **Priority lists** -- ordered arrays controlling which blocks are added first:
   - `SINGLE_COL_PRIORITY` -- used when widget is narrow (< 6 cols)
   - `LEFT_COL_PRIORITY` / `RIGHT_COL_PRIORITY` -- used when widget is wide (6+ cols), budgeted independently per column
5. **`visibleBlocks` computed signal** -- iterates priority list, subtracts each block's height from remaining budget, builds a `Set<string>` of blocks that fit. For wide layout, runs two independent budget loops (left column, right column).
6. **Template conditionals** -- `@if (showBlock(widgetId, 'blockName'))` guards every section. `@if (isWideWidget(widgetId))` splits into two-column vs single-column layout.

### Key constants

```
CHROME_PX = 73   // header bar + status strip + padding
CLIENT_PX = 18   // client name line (always shown)
```

Available height = `widgetHeights()[id] - CHROME_PX - CLIENT_PX`

### Gotchas

- **No scrollbars** -- container uses `overflow-hidden`, not `overflow-y-auto`. Content that doesn't fit is simply not rendered.
- **Block height estimates are approximate** -- they include the block's own padding/gap contribution. Err on the side of slightly overestimating so blocks don't overflow.
- **Large block swap** -- at large sizes, `costBreakdown` is swapped for `costDetail` (a more detailed variant). The `visibleBlocks` computed handles this conditionally.
- **Inline-to-standalone promotion** -- when a content piece (like fade/gain) lives inline inside another block AND as a standalone block, suppress the inline version when the standalone fits: `@if (!showBlock(widgetId, 'fadeGain'))` around the inline version.

## 18. CSS Text Scaling for Resizable Widgets

**Files:** `src/styles.css`, `projects-page.component.ts`

### The pattern

Apply a tier class (`widget-text-md`, `widget-text-lg`) to the widget container, then use CSS descendant selectors to bump font sizes for all text elements within.

### Gotchas

1. **Thresholds must be ABOVE default widget size.** All widgets start at the same default dimensions (e.g., 4 cols, 416px). If the medium tier threshold is at or below this default, every widget scales simultaneously and there's no visual contrast. Set medium at `cols >= 5 || h >= 480` (above 416 default).

2. **CSS specificity ordering matters for multi-class elements.** The project title has both `.widget-title` and `.text-xs` classes. Rules like `.widget-text-md .widget-title` and `.widget-text-md .text-xs` have equal specificity (two classes each). The **last rule in the file wins**. Always place `.widget-title` rules AFTER `.text-*` rules:

```css
/* text-* rules first */
.widget-text-md .text-2xs { font-size: var(--modus-wc-font-size-xs) !important; }
.widget-text-md .text-xs  { font-size: var(--modus-wc-font-size-sm) !important; }
.widget-text-md .text-sm  { font-size: var(--modus-wc-font-size-md) !important; }
/* widget-title LAST so it overrides text-xs on title elements */
.widget-text-md .widget-title { font-size: var(--modus-wc-font-size-md) !important; }
```

3. **Never use `[class]="methodCall()"` on elements with static classes.** Angular's `[class]` binding replaces ALL classes on the element. Use individual `[class.widget-text-md]="condition"` bindings instead to ADD classes without removing static ones.

4. **`!important` is required** because the base Modus font size overrides (`.text-2xs`, `.text-xs`, etc.) already use `!important`. Descendant selectors have higher specificity, but `!important` on the base rules means the override also needs `!important`.

## 19. Canvas Zoom Axis Swap (macOS)

**File:** `src/app/shell/services/canvas-panning.ts`

### The bug

macOS swaps `deltaY` → `deltaX` when Shift is held during scroll. Code that only checked `deltaY` for Shift+scroll zoom direction always got 0, causing zoom to stall at max.

### The fix

```typescript
const rawDelta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
```

Always pick whichever axis has the larger absolute value. This handles both macOS axis swap and standard deltaY-only systems.

### Zoom triggers

Shift+scroll, Ctrl+scroll, and Cmd+scroll all trigger zoom (covers trackpad pinch-to-zoom which fires as Ctrl+scroll).

### Zoom anchor

Anchored to viewport center (not cursor position) per user preference.

## 20. Desktop collision sort stability (twitchy tiles)

**File:** `src/app/shell/services/dashboard-layout-engine.ts` -- `resolveCollisions`, `compactAll`, `applyModeLayout`, `handleWidgetMove`, `onDocumentMouseUp`

### Bug A — sort order permuting every frame

The vertical collision pass sorted widgets by **live** `widgetTops` on every `mousemove`. While dragging, the mover’s `top` crosses other widgets, so **sort order permutes** between frames. The greedy stacker recomputed every other widget from `y=0` in a different order.

**Mitigation:** On drag/resize start, snapshot tops into `_collisionSortBaseline`; sort using baseline tops plus **`config.widgets` index** tie-break; clear on `mouseup`. On `window.resize`, only set `isMobile` / `isCanvasMode` when values change.

### Bug B — whole stack recomputed every mousemove (desktop free-drag)

Even with a stable sort, running full `resolveCollisions` on **every** `mousemove` recomputes **all** non-locked widgets’ tops each frame — neighbors **twitch**.

**Mitigation:** For desktop **free** drag (`_dragAxis === 'free'`), **do not** call `resolveCollisions` during `mousemove`. Run **one** `resolveCollisions(movedId, …)` on `mouseup` to settle overlaps.

### Bug C — desktop gravity: `compactAll()` is REQUIRED after moves and on init

`compactAll()` provides vertical gravity — floating all widgets to the top of the grid. Removing it after moves caused gaps to persist and get saved to sessionStorage. On next load, the gaps reappeared because the desktop init path also lacked `compactAll()`.

**Rule:** `compactAll()` MUST run:
1. After every desktop widget **move** (in `onDocumentMouseUp`)
2. After every desktop widget **resize** (in `onDocumentMouseUp`)
3. During desktop initialization (in `applyModeLayout`, after `restoreDesktopLayout`)

The "twitchy neighbors" issue (Bug B) was caused by running `resolveCollisions` during **mousemove**, NOT by `compactAll()` at mouseup. `_collisionSortBaseline` fixes sort stability during drag. `compactAll()` at mouseup is a single post-drop pass and does not cause twitching.

### Bug D — wrong projects default on load

`applyModeLayout` (desktop) called `reflowForColumns` whenever `responsiveBreakpoints` matched. That **replaced** authored `defaultColStarts` / `defaultTops` with the responsive **flow** layout on every load — the projects mosaic never appeared.

**Mitigation:** On init, only set `_currentDesktopColumns` / `currentDesktopColumns` for templates; **do not** call `reflowForColumns` there. Reflow still runs from `applyResponsiveReflow` when the window **crosses** a breakpoint. Bump `layoutStorageKey` when shipping this so old session layouts do not linger.

### Bug E — hero resize: spatial far-end squeeze feels random

Horizontal push-squeeze used **outermost-in** column order for squeeze and relocate. On the projects row, that made **lower-priority** tiles (e.g. hero-adjacent) jump before **higher-priority** ones.

**Mitigation:** Optional `DashboardLayoutConfig.desktopResizePriorityOrder`: list widget ids **highest priority first** (squeezed/relocated **last**). `applyResizePushSqueeze` uses `squeezeOrderForNeighbors` / `relocateTargetFromNeighbors` instead of pure spatial order when set. Projects page exports `PROJECTS_DESKTOP_RESIZE_PRIORITY` and passes it in `buildProjectsLayoutConfig()`.

### Bug F — projects desktop drag leaves tiles out of mosaic order

Free-drag only ran `resolveCollisions` on mouseup (vertical overlap), so **horizontal** placement stayed where the user dropped the tile.

**Mitigation:** `desktopSnapToDefaultLayoutAfterDrag`: on move mouseup, `reconcileDesktopCanonicalPlacementAndSavedSizing()` runs before `resolveCollisions`. At the **widest** breakpoint column count, unlocked tiles get `defaultColStarts` / `defaultTops`; **narrower** desktop uses `reflowForColumns(cols, { flowOrder })` with `desktopResizePriorityOrder` merge. **Locked** tiles keep their four grid fields. **ColSpans/heights** keep session values unless `desktopSaveDefaultLayoutSizingOnly` + v2 blob overrides.

### Bug G — Save as Default vs Reset on projects (desktop)

Full snapshot save fought priority placement.

**Mitigation:** `desktopSaveDefaultLayoutSizingOnly`: `saveAsDefaultLayout` writes `{ v: 2, colSpans, heights }` only. `resetToDefaults` clears that key and restores full `config.default*`. On load, `applyModeLayout` calls the same reconcile so canonical placement + saved sizing (or session sizing) apply.

### Regression tests

`dashboard-layout-engine.spec.ts`: `compactAll` tie order; identical consecutive drag `mousemove` leave tops stable; priority vs legacy squeeze order on horizontal resize; snap-after-drag + locked preserve; sizing-only save v2 + reset; `reflowForColumns` `flowOrder`; **desktop init compacts gaps from restored layout**; **desktop move-end compacts all widgets to top**.

## 21. Projects Dashboard Layout Alignment with Home Dashboard

**Files:** `src/app/pages/projects-page/projects-page.component.ts`, `src/app/pages/projects-page/projects-page-layout.config.ts`

### The problem

The Projects Dashboard had custom layout behavior that diverged from the Home Dashboard: no desktop drag, no widget locking, a bottom-left resize handle, responsive breakpoints with reflow, snap-after-drag to canonical positions, and sizing-only default saves. These flags were added in sections 20E-G to solve mosaic-order issues but made the Projects page behave fundamentally differently from Home.

### The fix: extend DashboardPageBase and remove Projects-specific flags

1. **Extend `DashboardPageBase`** -- `ProjectsPageComponent` now extends the same abstract base class as `HomePageComponent` and `FinancialsPageComponent`. This provides shared engine wiring, cleanup, effects, and signal aliases automatically.

2. **Remove all Projects-specific layout flags** from `buildProjectsLayoutConfig()`:
   - `responsiveBreakpoints` -- no more responsive column reflow
   - `responsiveSpanOverrides` -- no hero tile 2-column override
   - `desktopResizePriorityOrder` -- no priority-based squeeze ordering
   - `desktopReflowOnResize` -- no reflow on window resize
   - `desktopSnapToDefaultLayoutAfterDrag` -- no snap to canonical after drag
   - `desktopSaveDefaultLayoutSizingOnly` -- no sizing-only save (full layout saves)

3. **Enable desktop drag** -- removed the mobile/canvas-only guard on `onWidgetHeaderMouseDown` and `onWidgetHeaderTouchStart`, so tiles are draggable on desktop.

4. **Enable widget locking** -- added `WidgetLockToggleComponent` to each project tile. Lock semantics: locks the **priority slot's position and size**, not the specific project. The project displayed in a slot can change based on the agentic ordering priority, but the locked slot's grid position and dimensions stay fixed during drag/resize operations.

5. **Remove bottom-left resize handle** -- only the bottom-right handle remains (consistent with Home Dashboard pattern).

### Capturing a layout from the browser as defaults

When the user arranges tiles in the browser and wants that as the new default:

1. **Get bounding boxes** via `browser_get_bounding_box` on identifiable elements (links, buttons) inside each tile.
2. **Identify which tile ID occupies each position** by matching project names to `TILE_PROJECT_MAP` entries.
3. **Calculate grid-relative positions**: subtract the grid container's viewport offset from each tile's top to get `margin-top` values.
4. **Map pixel positions to grid columns**: divide tile x-positions by column width + gap to determine `defaultColStarts`.
5. **Update `defaultColStarts`, `defaultTops`, `defaultHeights`** in the layout config.
6. **Bump storage keys** (both desktop and canvas) to invalidate cached layouts.
7. **Update canvas defaults** to match the desktop layout conceptually.

### Key insight: reading order = priority order

The Projects Dashboard uses an "agentic ordering priority" where `proj1` = highest priority, `proj2` = second, etc. The `TILE_PROJECT_MAP` maps each priority slot to a project by urgency score. The **default layout** must position tiles so that the visual reading order (left-to-right, top-to-bottom) matches the priority numbering. This ensures the most urgent project always appears at the first visual position.

### Storage key bumping rule

Every change to `defaultColStarts`, `defaultTops`, `defaultHeights`, or `defaultColSpans` **must** bump both `layoutStorageKey` and `canvasStorageKey`. Without bumping, users with cached layouts in sessionStorage will see the old layout, not the new defaults.

```typescript
layoutStorageKey: 'dashboard-projects:v16',   // was v15
canvasStorageKey: 'canvas-layout:dashboard-projects:v17',  // was v16
```

### The layout structure (current defaults)

```
Row 1 (top=0, height=672):
  proj1: cols 1-8  (hero, wide)
  proj2: cols 9-12 (flanking, same height as hero)
  proj3: cols 13-16

Row 2 (top=688, height=384):
  proj6: cols 1-4   proj7: cols 5-8   proj4: cols 9-12   proj5: cols 13-16

Row 3 (top=1088, height=384):
  proj8: cols 1-4
```

All top-row tiles are the same height (672px), eliminating the old "stacked under right tiles" pattern. Middle row is a full-width band of 4 equal tiles. Bottom row has one tile.

## 22. Compact Mode for Narrow Widgets (ColSpan-Based Responsive Content)

**Files:** `project-dashboard.component.ts`, `project-dashboard.component.html`, `home-page.component.ts`

### The bug

The RFI and Submittal widgets on the project dashboard rendered a full 4-column table (`grid-cols-[1fr_2fr_1fr_1fr]`) regardless of widget width. When a user resized the widget to 5 or fewer grid columns (~300px), the table became unreadable with text truncated and columns crushed.

The home page already had `isRfiCompact` / `isSubmittalCompact` logic that switched to summary tiles when narrow, but this was never ported to the project dashboard.

### The pattern: colSpan-based compact mode

Use `widgetColSpans` (from `DashboardLayoutEngine` via `DashboardPageBase`) to determine when a widget is too narrow for its full table layout. Switch to a compact summary view at a threshold of 5 or fewer columns:

```typescript
readonly isRfiCompact = computed(
  () => this.isMobile() || (this.wColSpans()['rfis'] ?? 16) <= 5
);
```

### Compact view content

When compact, show **status summary tiles** instead of the table. Each tile shows:
- Colored icon badge (Open=primary, Overdue=destructive, Upcoming=warning, Closed=success)
- Status label
- Count (from existing `rfiStatusCounts()` / `submittalStatusCounts()`)
- Chevron right (indicates clickable)

Clicking a compact tile navigates to the full Records sub-page (e.g., Records > RFIs) where the user gets the full table view with filtering.

### Template branching pattern

```html
@if (isRfiCompact()) {
  <!-- compact status tiles -->
  <div class="flex flex-col gap-2 p-3 flex-1 overflow-y-auto">
    @for (item of rfiCompactItems; track item.key) { ... }
  </div>
} @else {
  <!-- full table with column headers and rows -->
}
```

### The rule

When adding a table-based widget to the project dashboard (or any dashboard page), always implement a compact mode that triggers at `colSpan <= 5`. The compact view should:

1. Show aggregate counts (status breakdowns) instead of individual rows
2. Use the existing `widgetColSpans` signal -- no new resize observers needed
3. Provide a click action to navigate to the full-featured page for that data
4. Match the visual pattern of the home page's compact items (colored icon badge + label + count + chevron)

### Existing compact mode widgets

| Widget | Page | Signal | Threshold |
|--------|------|--------|-----------|
| RFIs | Home | `isRfiCompact` | `homeRfis` colSpan <= 5 or mobile |
| Submittals | Home | `isSubmittalCompact` | `homeSubmittals` colSpan <= 5 or mobile |
| Time Off | Home | `isTimeOffCompact` | `homeTimeOff` colSpan <= 6 or mobile |
| RFIs | Project Dashboard | `isRfiCompact` | `rfis` colSpan <= 5 or mobile |
| Submittals | Project Dashboard | `isSubmittalCompact` | `submittals` colSpan <= 5 or mobile |

## 18. Respect Explicit User Constraints -- Never Apply Parent-Level Changes That Cascade Into Protected Elements

**Context:** When the user says "don't touch X" or "don't mess with X," that is an absolute constraint. Every proposed change must be evaluated against it before execution.

### The mistake

User said: "don't mess with the toolbar." The toolbar wrapper div had `md:pl-4`. Instead of scoping the fix to only the content area below the toolbar, `[class.md:pl-4]` was applied to the **parent container** -- which is the toolbar's parent too. This changed the toolbar's padding behavior, directly violating the constraint.

### Why it happened

Applying the change to the parent was fewer lines of code than wrapping the content in its own div. The shortcut was chosen over correctness.

### The rule

**When a user marks an element as off-limits:**

1. **Never modify the element itself** -- no class changes, no attribute changes, no restructuring.
2. **Never modify an ancestor** in a way that cascades into the protected element -- adding/removing/conditionalizing classes on a parent affects ALL children, including the protected one.
3. **Always scope changes to siblings or new wrapper divs** that exclude the protected element.
4. **Before executing, trace the DOM tree** and confirm the protected element is outside the blast radius of every proposed change.

### Correct pattern

```html
<!-- WRONG: conditional padding on parent affects toolbar too -->
<div class="flex-1 flex flex-col gap-6" [class.md:pl-4]="condition">
    <div class="toolbar md:pl-4">...</div>   <!-- affected by parent! -->
    <app-content />                           <!-- affected by parent -->
</div>

<!-- RIGHT: toolbar untouched, content wrapped separately -->
<div class="flex-1 flex flex-col gap-6">
    <div class="toolbar md:pl-4">...</div>   <!-- untouched -->
    <div [class.md:pl-4]="condition">         <!-- only content affected -->
        <app-content />
    </div>
</div>
```

### General principle

**An explicit user constraint outranks code brevity, always.** If respecting the constraint requires more wrapper divs, more lines, or a less elegant solution -- that is the correct solution. Taking shortcuts that violate stated constraints is never acceptable.

## 23. Modus Navbar Native Rendering Fallback (Stencil/Angular 20 Incompatibility)

**Files:** `dashboard-shell.component.ts`, `project-dashboard.component.ts`, `project-dashboard.component.html`, `modus-navbar.component.ts`, `trimble-logo.component.ts`

### The bug (has broken 5+ times)

The `modus-wc-navbar` component uses Stencil's scoped encapsulation with internal slot relocation. In Angular 20 dev mode, Stencil's `renderVdom` throws a `DOMException` during `putBackInOriginalLocation` / `insertBefore` because Angular's DOM management conflicts with Stencil's programmatic DOM manipulation. This causes the entire internal toolbar (`modus-wc-toolbar`) -- including the Trimble logo, hamburger button, search, notifications, and help buttons -- to fail to render.

In production builds (Vercel), the Stencil components render correctly. The failure is **dev-mode only** but has repeatedly caused confusion and broken implementations because:

1. Developers remove the native Modus buttons and add custom replacements, creating duplicates in production
2. Developers add CSS hacks to force native elements visible, which break in other ways
3. Developers add custom Trimble logos/hamburgers that duplicate the native ones on Vercel
4. Developers remove the custom elements thinking native ones work, breaking local dev
5. The fix gets lost across sessions and the cycle repeats

### Architecture: runtime detection + conditional fallback

The solution uses runtime detection to determine whether native rendering succeeded, then conditionally shows fallback elements only when needed:

```typescript
// Signal tracks whether native Modus toolbar rendered
readonly navbarNativeRendered = signal(false);

private detectNativeNavbarRender(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const toolbar = this.elementRef.nativeElement.querySelector('modus-wc-toolbar');
      this.navbarNativeRendered.set(!!toolbar);
    });
  });
}
```

The double `requestAnimationFrame` is required because Stencil components render asynchronously after Angular's change detection.

### Critical: `slot="end"` is projected *before* native utilities

In `modus-wc-navbar` source, the toolbar **`slot="end"` content comes first**, then native Search / Notifications / Help / User (per `visibility`). If you leave `search`, `notifications`, `help` **true** on the web component while putting **`<user-menu>`** in `slot="end"`, the visual order becomes AI, theme, **user**, then search/help/notifications — wrong, and you can see duplicate or misplaced profile chrome.

**Stable pattern (dashboard shell + project dashboard):**

- Set `visibility` to **`search: false`, `notifications: false`, `help: false`, `user: false`, `mainMenu: true`** (canvas included — hamburger must not be tied to `!isCanvas()` for this reason).
- Render **search, notifications, and help** only inside Angular `slot="end"` (always, not gated by `navbarNativeRendered()`), in fixed order before `<user-menu>`.
- When search panel opens, use **`modus-text-input`** in that same slot (bound to a local signal); native expandable search is off.
- Use **`navbarNativeRendered` only for `slot="start"`** (fallback hamburger + Trimble when the internal toolbar failed to render — dev mode).

### What the native Modus navbar renders internally

When working correctly, `modus-wc-navbar` renders a `modus-wc-toolbar` containing:

| Region | Order | Notes |
|--------|--------|--------|
| `slot="start"` | Hamburger (if `mainMenu`) | Then native Trimble button (always), then `<slot name="start">` |
| `slot="end"` | **`<slot name="end">` first** | Then native AI, search, notifications, help, apps, user per `visibility` |

So: **never rely on native search/help/notifications if you need user last** — turn those flags off and own the icons in the Angular slot.

### Fallback elements when native toolbar fails (`navbarNativeRendered === false`)

**slot="start" only** — wrap in `@if (!navbarNativeRendered())` before your title/back content:

| Element | Views | Class |
|---------|-------|-------|
| Hamburger (`menu` icon) | Desktop shell when native menu missing; native provides when `mainMenu: true` | `bg-card text-foreground hover:bg-muted` |
| Trimble logo (`<app-trimble-logo />`) | Canvas + desktop when duplicate would show | `text-primary` |
| Separator | | `w-px h-5 bg-foreground-20` |

**slot="end"** — search / notifications / help: **always** from Angular (see stable pattern above); optional `modus-text-input` when `searchInputOpen()`.

### Correct icon order in slot="end"

1. **AI assistant**
2. **Dark mode toggle** (`hidden md:flex` where applicable)
3. **Search field** (when `searchInputOpen()`)
4. **Search, Notifications, Help** icon buttons (desktop; mobile uses more menu + optional inline field)
5. **User menu** / mobile more menu last

### Background color consistency

All navbar icon buttons (both always-visible and fallback) must use the same class for visual consistency:

```
bg-card text-foreground hover:bg-muted
```

This matches the native Modus navbar button styling: `background: var(--modus-wc-color-base-100)`.

**Never** use buttons without a background in the navbar -- they look different from native Modus buttons and create visual inconsistency in production where native and custom buttons appear side by side.

### TrimbleLogoComponent

A reusable component at `src/app/shell/components/trimble-logo.component.ts` renders the official Trimble logo + wordmark SVG (extracted from the Modus Web Components source). It uses `fill="currentColor"` so it follows the parent's text color (`text-primary`).

The SVG is the `TrimbleLogoFullIcon` from `modus-wc-navbar`'s bundled source (`viewBox="0 0 444.68 100"`, 25 `<path>` elements). It includes both the Trimble globe mark and the "Trimble." wordmark text.

### 4 navbar instances that must stay in sync

| File | View | Start fallbacks (`!navbarNativeRendered`) | End utilities |
|------|------|-------------------------------------------|---------------|
| `dashboard-shell.component.ts` | Canvas | Logo + divider | Always Angular (search/notif/help + optional input) |
| `dashboard-shell.component.ts` | Desktop | Hamburger + logo + divider | Always Angular |
| `project-dashboard.component.html` | Canvas | Logo + divider | Always Angular |
| `project-dashboard.component.html` | Desktop | Hamburger + logo + divider | Always Angular |

**All 4 instances must match visibility flags and end-slot structure.** When modifying navbar chrome, update all 4 at once.

### Detection in project-dashboard

The project dashboard component also has its own `navbarNativeRendered` signal and `detectNativeNavbarRender()` method, called in `ngAfterViewInit`. Both dashboard-shell and project-dashboard must detect independently because they render separate `modus-navbar` instances.

### ModusNavbarComponent: `flushPropsToWc` (mandatory)

Angular `effect()` callbacks that call `syncProp` often run **before** `ngAfterViewInit` assigns `this.wcEl`. The first run no-ops; if parent inputs never change again, **`modus-wc-navbar` keeps Stencil defaults** (`user: true`, `mainMenu: false`, etc.) even though the template passes `[visibility]="..."`.

**Symptoms on Vercel/production:** duplicate native user control next to `<user-menu>`, missing hamburger, wrong native utilities.

**Fix:** `modus-navbar.component.ts` must call `flushPropsToWc()` once at the start of `ngAfterViewInit` after `wcEl` is set, pushing `visibility`, `userCard`, and every other mirrored prop. Static test: `tests/static/modus-navbar-wrapper.spec.ts`.

### Rules (mandatory)

1. **Never remove fallback elements** thinking native rendering "just works" -- it fails in dev mode.
2. **Never add custom Trimble logos or hamburgers** outside the `@if (!navbarNativeRendered())` guard -- they duplicate the native ones in production.
3. **Never use CSS hacks** (`display: none !important`, `visibility: hidden`, etc.) to hide/show native Modus navbar internals -- the toolbar may or may not exist depending on the rendering mode.
4. **Always use `bg-card`** on all navbar icon buttons (not bare/transparent).
5. **Always maintain the icon order**: AI, dark mode, search, notifications, help, user menu.
6. **Always update all 4 navbar instances** when changing fallback structure.
7. **Do not use `attachHamburgerListener` or `_reattachHamburgerEffect`.** Sync sidenav only via `(mainMenuOpenChange)` and the fallback template click handler.

---

## 24. Sidenav Overlay, Consistent Row Heights, and Mobile Icon Centering

### Sidenav overlay (not push)

The main content area must use a **fixed** `pl-14` offset for the collapsed 56px rail and **never** add `pl-60` when the sidenav expands. The expanded sidenav overlays content via `position: fixed; z-index: 999`. This applies in both `dashboard-shell.component.ts` and `project-dashboard.component.html`.

**Pattern (main content div):**
```html
[class.pl-14]="!isMobile()"
<!-- NEVER: [class.pl-60]="navExpanded()" -->
```

### Consistent 56px row heights

All `.custom-side-nav-item` elements use `height: 56px; padding: 0;` with `align-items: center` for vertical centering. The selected tile (48px + 4px margin each side = 56px total) and non-selected items both occupy exactly 56px, so icons stay at identical vertical positions when toggling between collapsed and expanded states.

**Before (broken):** Non-selected items were `padding: 0.875rem 0` = ~46px, selected was 56px. Expanding collapsed the 10px gap, causing a visible icon shift.

### Expanded selected item (desktop)

In expanded state (desktop `min-width: 768px`), the selected item switches to `height: 56px; margin: 0; border-radius: 0; padding: 0; padding-right: 0.75rem;` -- a full-width highlighted bar matching non-selected row heights.

### Mobile icon centering

The expanded icon-slot override (`flex: 0 0 56px; width: 56px;`) must be **scoped to desktop** (`@media (min-width: 768px)`) because in mobile the sidenav always has `.expanded` class when visible, but the selected tile is still 48px. A 56px icon-slot inside a 48px tile pushes the icon off-center.

Mobile selected items use:
```css
@media (max-width: 767px) {
  .custom-side-nav .custom-side-nav-item.selected .custom-side-nav-icon-slot {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    padding-left: 10px; /* visually tuned */
  }
}
```

### Rules (mandatory)

1. **Never use `pl-60`** on main content -- sidenav always overlays.
2. **All nav items must be 56px tall** -- set via `height: 56px` on base `.custom-side-nav-item`.
3. **Scope expanded icon-slot overrides to desktop** -- mobile uses `flex: 1 1 auto` to fill the 48px tile.
4. **The `padding-left: 10px` on mobile icon-slot was pixel-tuned** -- don't change without visual verification.

---

## 25. Collapsible Subnav: No Mobile Compact Mode

**File:** `src/app/pages/project-dashboard/components/collapsible-subnav.component.ts`

### The bug (repeated regressions)

The `CollapsibleSubnavComponent` had a `mobileCompact` mode: when `isMobile() && collapsed()`, it rendered a 48px-wide icon-only strip with a badge overlay and a `chevron_right` expand affordance. When tapped, the subnav expanded to 227px with a fixed backdrop overlay (`z-index: 9998`), `shadow-lg`, and elevated `z-index: 9999`. This created multiple problems:

1. The 48px compact strip consumed horizontal space on narrow viewports, cramping the toolbar and content.
2. The fixed backdrop overlay intercepted taps, causing confusion with the toolbar and other interactive elements.
3. The z-index juggling (9998 backdrop, 9999 panel) conflicted with other overlays (modals, dropdowns, mobile more menus).
4. Agents repeatedly tried to "fix" mobile subnav behavior by adding more complexity (different widths, different z-indices, different expand/collapse animations), making the code harder to maintain.

### The fix: hide completely on mobile

On mobile, the collapsible subnav is **hidden entirely**. `outerWidth` returns `0` when `isMobile()`, the `innerWidth` is always `227` (no 48px variant), and there is no mobile-specific z-index, backdrop, or shadow:

```typescript
readonly outerWidth = computed(() => {
  if (this.isMobile()) return 0;
  return this.collapsed() ? 0 : 227;
});

readonly innerWidth = computed(() => 227);

readonly innerZIndex = computed(() => this.collapsed() ? 10 : 1);
```

Removed signals/computeds:
- `mobileCompact` -- no longer exists
- Mobile-specific `innerWidth` (48px) -- always 227
- Mobile-specific `innerZIndex` (9999) -- collapsed is 10, expanded is 1
- Mobile `panelMaxHeight` override -- only canvas gets `'none'`

Removed template elements:
- `@if (isMobile() && !collapsed())` fixed backdrop overlay
- `@if (mobileCompact())` icon-only strip with badge overlay
- `shadow-lg` conditional class on mobile
- `[class.rounded-lg]="true"` binding (now a static class)

### The rule

1. **Never add a mobile compact mode to the collapsible subnav.** On mobile, the subnav is hidden (`outerWidth = 0`). Sub-page navigation on mobile uses the toolbar's existing view mode toggles and page-level navigation.
2. **Never add a fixed backdrop overlay** (`position: fixed; inset: 0`) inside the collapsible subnav. Backdrops conflict with other overlays and steal taps.
3. **Never use z-index >= 9999** on the collapsible subnav. That range is reserved for modals and canvas detail views.
4. **The collapsible subnav is desktop/canvas only.** Mobile users navigate sub-pages through the toolbar and route-level navigation.

---

## 26. Toolbar Compact Mobile Mode (Search Collapse)

**Files:** `project-dashboard.component.html`, `project-dashboard.component.ts`

### The pattern

On narrow mobile viewports (`isCompactMobile()`, <= 580px), the `#childPageSubnav` toolbar switches from an inline search input to icon-only buttons. The search field slides down below the toolbar row when the search icon is tapped.

### Architecture

1. **`isCompactMobile` signal** -- tracks `window.innerWidth <= 580`. Updated on resize.
2. **`toolbarSearchOpen` signal** -- controls the expandable search field visibility.
3. **Template branching** in `#childPageSubnav`:

```html
@if (isCompactMobile()) {
  <!-- Icon-only: search button + filter button -->
  <div class="flex items-center gap-2">
    <div role="button" (click)="toolbarSearchOpen.set(!toolbarSearchOpen())">
      <i class="modus-icons">search</i>
    </div>
    <div role="button"><i class="modus-icons">filter</i></div>
  </div>
} @else {
  <!-- Full inline search input + filter button -->
}
```

4. **Expandable search row** -- appears below the toolbar when `isCompactMobile() && toolbarSearchOpen()`:

```html
@if (isCompactMobile() && toolbarSearchOpen()) {
  <div class="px-4 pb-2">
    <div class="flex items-center gap-2 bg-secondary rounded px-3 py-1.5 w-full">
      <i class="modus-icons text-sm text-foreground-60">search</i>
      <input type="text" ... />
    </div>
  </div>
}
```

5. **Click-outside dismiss** -- the toolbar wrapper has `data-toolbar-search` attribute. `onDocumentClick` closes `toolbarSearchOpen` when the click target is outside `[data-toolbar-search]`.

### The rule

When adding new toolbar functionality on mobile:
1. **Use `isCompactMobile()` (580px)** for toolbar layout decisions, not `isMobile()` (768px). The toolbar needs compaction at a narrower breakpoint than general mobile layout.
2. **Collapse inputs to icon buttons** on compact mobile. Show the full input in an expandable row below the toolbar.
3. **Use `data-*` attributes** for click-outside detection scoping on expandable toolbar sections.
4. **The right-side action buttons** (view mode toggles, more menu) are always visible regardless of compact mode.

---

## 27. Toolbar Margin-Left with Collapsed Subnav (Mobile + Desktop)

**Files:** `project-dashboard.component.html`

### The bug

The toolbar's `margin-left` condition was `sideSubNavCollapsed() && !isMobile()`. This meant:
- On desktop with collapsed subnav: toolbar got 227px margin (correct, clears the floating collapsed header)
- On mobile: toolbar got 0px margin

But since the collapsible subnav is now hidden on mobile (`outerWidth = 0`), the toolbar needs margin-left on mobile too when the subnav *would* be present (it floats at 227px via `position: absolute` even though outer width is 0). The collapsed subnav header still renders at 227px wide on top of content.

### The fix

Changed the condition to `sideSubNavCollapsed() || isMobile()` and `md:pl-4` to `pl-4`:

```html
<div class="transition-all duration-200 pl-4"
  [style.margin-left.px]="detailHasSubNav() && (sideSubNavCollapsed() || isMobile()) ? 227 : 0">
```

This applies to all three toolbar wrapper locations:
1. `#detailContent` template (detail pages)
2. Records section (desktop non-detail)
3. Financials section (desktop non-detail)

### The rule

Whenever the collapsible subnav is present, the toolbar needs `margin-left: 227px` when **either** collapsed on desktop **or** on mobile (where the subnav outer width is 0 but the floating header still renders).

---

## 28. compactAll Anchor Priority for Dragged Widgets

**File:** `src/app/shell/services/dashboard-layout-engine.ts`

### The bug

After dragging a widget to a new vertical position and releasing, `compactAll()` sorted all widgets by their current tops. If the dragged widget and another widget had the same top value (common when dragging to position 0), the sort was unstable -- sometimes the dragged widget won, sometimes the other widget won. The user would drag w3 to the top, release, and see w1 snap back to position 0 while w3 got pushed down.

### The fix: anchor ID sort priority

`compactAll` now accepts an optional `anchorId` parameter. In `sortWidgetsForCollisionPass`, when two widgets have the same top, the `anchorId` wins the tiebreak:

```typescript
if (ta !== tb) return ta - tb;
if (anchorId) {
  if (a === anchorId) return -1;
  if (b === anchorId) return 1;
}
```

A `_dragDidMove` flag tracks whether the drag actually moved the widget (not just a click). On mouseup after a real drag, `compactAll(interactedId)` passes the dragged widget as the anchor:

```typescript
this.compactAll(didMove ? interactedId : undefined);
```

### Regression tests

Two new tests in `dashboard-layout-engine.spec.ts`:
- `dragged widget gets sort priority and all widgets compact upward` -- w3 dragged to top, gets position 0, w1 and w2 shift down
- `dragged widget reorders within column and all widgets compact (no gaps)` -- multi-column layout, w3 dragged up in its column, w4 in another column unaffected

### The rule

1. **`compactAll` must always receive the dragged widget ID** after a real move (not a click). Without it, tiebreaks are arbitrary.
2. **`_dragDidMove` must be set to `true` in `onDocumentMouseMove`** (both mouse and touch paths) and cleared on mouseup and mousedown.
3. **The anchor ID tiebreak applies to both mobile and desktop** sort paths in `sortWidgetsForCollisionPass`.

---

## 29. Single ng-content Rule for DashboardShellComponent

**Problem**: Commit `a681948` (PR #56, Apr 3) changed the shell from using `<router-outlet />` in each `@if`/`@else` branch to `<ng-content />` in each branch. This broke canvas mode entirely -- all dashboard pages (Home, Projects, Financials) rendered empty content at >= 1920px viewport. Project detail pages were unaffected because they have their own `<router-outlet />` inside the shell projection, not another `<ng-content />`.

**Root cause**: Angular's `<ng-content />` is resolved at **compile time** -- the framework decides where to project content when the component is created. Having two `<ng-content />` slots in mutually exclusive `@if`/`@else` branches is unsupported. Angular either projects into the wrong slot, projects into the first one it encounters, or discards content entirely. This is fundamentally different from `<router-outlet />`, which is a **runtime directive** that dynamically instantiates/destroys routed components independently.

**Why the old code worked**: Before PR #56, the shell used `<router-outlet />` in both the canvas and desktop branches. Since `<router-outlet />` is a directive (not content projection), Angular creates the routed component inside whichever branch is active. When the branch switches, it destroys and recreates the component. This is fine for `<router-outlet />` but fatal for `<ng-content />`.

**Fix**: Moved the single `<ng-content />` **outside** all `@if`/`@else` blocks. The canvas and desktop chrome (navbars, sidenavs) remain inside their respective conditional branches, but the content wrapper is always rendered. CSS class bindings (`canvas-content` vs `shell-content-desktop`) switch styling between modes. The `canvas-host` div became `position: fixed` (no layout impact), and the host element handles panning mousedown.

**Rule**: The `DashboardShellComponent` must have **exactly one** `<ng-content />` in its template, and it must **never** be inside an `@if`, `@else`, `@for`, or `@switch` block. This is enforced by a static regression test.

**Static test**: `tests/static/dashboard-shell.spec.ts` -- "has exactly ONE `<ng-content />` in the template" and "ng-content is NOT inside an @if or @else block".

**General principle**: Never place `<ng-content />` inside conditional template blocks (`@if`, `@else`, `@switch`, `@for`). Use `<router-outlet />` if you need dynamic content in conditional branches, or restructure so the content wrapper is unconditional and styling changes via CSS classes.

---

## 30. Canvas Default Pixel Values Must Use CANVAS_STEP = 81

**Problem**: The projects page `canvasDefaultLefts` and `canvasDefaultPixelWidths` in `projects-page-layout.config.ts` were hardcoded for a 1248px container (the old width when `px-4` padding was present on the content area). After removing side padding to make the canvas content 1280px, the widget grid only filled 1248px, leaving a 32px gap on the right side.

**Root cause**: The `canvasDefaultLefts` and `canvasDefaultPixelWidths` are manually authored pixel values, not computed from `CANVAS_STEP`. When the content area width changed from 1248px to 1280px, these values became stale. The old values used an implicit step of ~79px (`1248 / 16`), but the engine's `CANVAS_STEP` is 81, which produces a 1280px grid (`16 * 81 - 16 = 1280`).

**Correct formula** for any canvas default pixel layout:

```
left  = column * CANVAS_STEP           (0, 81, 162, 243, 324, ..., 972, 1053, ...)
width = colSpan * CANVAS_STEP - GAP_PX (4-col: 308, 8-col: 632, 16-col: 1280)
```

Where `CANVAS_STEP = 81` and `GAP_PX = 16`.

**Reference values** (4-column positions):

| Column | Left |
|--------|------|
| 0      | 0    |
| 4      | 324  |
| 8      | 648  |
| 12     | 972  |

| Span | Width |
|------|-------|
| 4    | 308   |
| 8    | 632   |
| 12   | 956   |
| 16   | 1280  |

**Rightmost edge check**: The rightmost widget must end at exactly 1280px (`left + width = 1280`). For span-4 at col 12: `972 + 308 = 1280`.

**Cache invalidation**: When updating canvas defaults, bump the `canvasStorageKey` version (e.g., `v17` to `v18`) so cached layouts in localStorage are discarded and the new defaults take effect.

**Rule**: Every `canvasDefaultLefts` and `canvasDefaultPixelWidths` value in any `*-layout.config.ts` file must be derived from `CANVAS_STEP = 81` and `GAP_PX = 16`. Never use values from a padded or narrower container width. Always verify the rightmost widget's right edge equals 1280.

---

## 31. Widget Height Must Fit Content and Snap to 16px Grid

**Problem**: The `finNavKpi` widget on the Financials page had an internal scrollbar on the NavLinks card because the widget height (496px) was slightly shorter than the rendered content (~504px in Chromium). Different browsers render slightly different heights, so the overflow was visible in Chromium (Vivaldi) but not Safari at the same height.

**Root cause**: Widget default heights are set as static constants (e.g., `NAVKPI_HEIGHT = 496`). If the content grows (e.g., 12 nav link items at ~40px each plus header), the fixed height can become too short, causing `overflow-y-auto` to show a scrollbar.

**Fix approach**:
1. Increase the height constant in small increments (4px) until the scrollbar disappears in all target browsers.
2. Round UP to the nearest multiple of 16 (`GAP_PX`) so the widget aligns to the vertical snapping grid.
3. Bump both `layoutStorageKey` and `canvasStorageKey` versions so cached layouts in sessionStorage are discarded and new defaults take effect.

**Rule**: When setting default widget heights, the value MUST:
- Be large enough to contain all content without any internal scrollbar (test in multiple browsers -- Chromium-based browsers may need a few extra pixels vs Safari/WebKit).
- Be a multiple of 16 (the `GAP_PX` vertical snap grid).

**Example** (Financials `finNavKpi`): Content needed ~504px. Next 16px-aligned value: 512 (32 * 16). Old value was 496 (31 * 16).

**Storage key reminder**: Any change to default heights, tops, or spans requires bumping the layout and canvas storage key versions, otherwise users with cached layouts will never see the new defaults.

---

## 32. Horizontal Resize Dead Zone for `dir='both'` (Twitch Fix)

**Problem**: All home-page widget resize handles pass `dir='both'` to `startWidgetResize`. Even during purely vertical resize, the horizontal pipeline runs every frame: `applyResizePushSqueeze` → `syncColsFromPixelPositions`. The pixel-to-column round-trip causes sub-pixel rounding instability, making neighboring widgets twitch/jump on every mouse-move frame.

**Root cause**: `handleResize` unconditionally entered the horizontal code path when `_resizeDir === 'both'`. The snapped pixel widths fed into `syncColsFromPixelPositions`, which recalculated `widgetColStarts`/`widgetColSpans` for all widgets. Even tiny rounding differences caused CSS Grid to re-layout neighbors.

**Fix**: Added `_hResizeActive` flag (default `false`). For `dir='both'`, horizontal processing is gated on actual horizontal mouse movement exceeding half a column step (`currentStep / 2`). For pure `dir='h'`, the flag is set `true` immediately.

**Files changed**: `dashboard-layout-engine.ts` — `startWidgetResize`, `startWidgetResizeTouch`, `handleResize`, `resolveCollisions`, `onDocumentMouseUp`.

**Rule**: When `dir='both'`, never run horizontal resize logic (`applyResizePushSqueeze`, `syncColsFromPixelPositions`) until horizontal mouse delta exceeds half a grid step. This prevents pixel-column round-trip noise during vertical-only resize.

---

## 33. Push-Down Only Collision Resolution (No Widget Jumping)

**Problem**: During resize and on mouseup (`compactAll`), the collision pass started each widget at `y=0` and packed greedily upward. This caused widgets to jump across intervening widgets to fill distant gaps — e.g., a widget in row 4 could jump to row 1 if a gap opened, skipping over rows 2-3.

**User rule**: Widgets may only be moved across other widgets by explicit user drag. Automatic collision resolution must never pull a widget up over intervening widgets.

**Fix**: Changed `let y = 0` to `let y = tops[id]` in both `resolveCollisions` (during resize) and `compactAll` (on mouseup). Widgets now start at their current position and can only be pushed DOWN by overlaps. They never rise above their current position automatically.

**Files changed**: `dashboard-layout-engine.ts` — `resolveCollisions` inner loop, `compactAll` inner loop.

**Rule**: In the collision placement loop, always initialize `y` from the widget's current top position (`tops[id]`), never from `0`. This ensures widgets only move downward to resolve overlaps and never teleport upward across other widgets.

---

## 34. Persona-Driven Project Ownership (Bert Humphries as PM)

**Context**: The application supports multiple user personas (`frank`, `bert`, `kelly`, `dominique`) defined in `persona.service.ts`. When a persona is designated as Project Manager across all projects, the data must be updated in two places -- the dashboard tile data and the per-project detail data.

**Data locations that must stay in sync**:

1. **`dashboard-data.seed.ts` → `PROJECTS` array**: Each project has `owner` (display name) and `ownerInitials` (avatar badge). These appear on project tiles in the Projects page and anywhere project cards are rendered.

2. **`project-data.ts` → `PROJECT_DATA[n].team` array**: Each project's team roster. The PM should be `id: 1` (first in list) with `role: 'Project Manager'`. Previous PMs get re-titled (e.g., Assistant Project Manager, Senior Engineer, Project Coordinator).

3. **`project-data.ts` → `PROJECT_DATA[n].summaryStats`**: The "Team Members" stat `value` must reflect the actual team array length after adding/removing members.

**Rule**: When changing project ownership:
- Update `owner`/`ownerInitials` on all entries in the `PROJECTS` array
- Add the new PM as `id: 1` in each project's `team` array with `role: 'Project Manager'`
- Re-title the displaced PM to an appropriate secondary role (varies per project)
- Increment the Team Members summary stat count
- Verify the PM's `initials` match `ownerInitials` in the `PROJECTS` array

**Files changed**: `dashboard-data.seed.ts`, `project-data.ts`

---

## Quick Reference: Files and Regression Tests

| Concern | Source file | Test file |
|---------|------------|-----------|
| Push-squeeze algorithm (desktop) | `dashboard-layout-engine.ts` | `dashboard-layout-engine.spec.ts` |
| Collision priority (desktop) | same as above | same as above |
| Canvas BFS push algorithm | `canvas-push.ts` | `canvas-push.spec.ts` |
| Canvas detail manager | `canvas-detail-manager.ts` | (tested via canvas-push integration) |
| Subpage tile canvas | `subpage-tile-canvas.ts` | (tested via canvas-push integration) |
| Canvas navbar overflow | `src/styles.css` | `tests/static/styles.spec.ts` |
| Side nav dark background | `src/styles.css` | (visual, test all 6 themes) |
| Widget deselection | `dashboard-shell.component.ts` | `tests/static/dashboard-shell.spec.ts` |
| Tile detail template pattern | `project-dashboard.component.ts` | `tests/static/project-dashboard.spec.ts` |
| Canvas grid alignment | all page components | `tests/static/canvas-grid-alignment.spec.ts` |
| View mode parity | all page components | `tests/static/project-dashboard.spec.ts` (canvas parity) |
| Template arrow functions | all `.component.ts` | `tests/static/template-safety.spec.ts` |
| Template private member access | all `.component.ts` | `tests/static/template-safety.spec.ts` |
| Wall cascade post-cleanup (4+ widgets) | `canvas-push.ts` | `canvas-push.spec.ts` (4 new tests) |
| Same-size oscillation & frozen pushback | `canvas-push.ts` | `canvas-push.spec.ts` (6 new tests) |
| Hamburger / mainMenuOpenChange | `dashboard-shell.component.ts`, `project-dashboard.component.html` | `tests/static/dashboard-shell.spec.ts` |
| Area-adaptive content blocks | `projects-page.component.ts` | (visual: resize widget, verify content fills) |
| CSS text scaling tiers | `src/styles.css` + `projects-page.component.ts` | (visual: resize widget, verify text scales) |
| Canvas zoom axis swap | `canvas-panning.ts` | (manual test: Shift+scroll on macOS) |
| Collision sort stability (desktop) | `dashboard-layout-engine.ts` | `dashboard-layout-engine.spec.ts` (collision pass ordering) |
| Desktop resize priority squeeze | `dashboard-layout-engine.ts` + page `desktopResizePriorityOrder` | `dashboard-layout-engine.spec.ts` (priority vs legacy) |
| Desktop snap after drag + sizing-only defaults | `dashboard-layout-engine.ts` + `buildProjectsLayoutConfig` | `dashboard-layout-engine.spec.ts` (snap, locked, v2 save/reset, flowOrder) |
| Projects layout alignment + DashboardPageBase | `projects-page.component.ts` + `projects-page-layout.config.ts` | Build verification; visual test |
| Compact mode for narrow widgets | `project-dashboard.component.ts` + `.html`, `home-page.component.ts` | (visual: resize widget to 5 cols, verify compact tiles) |
| Navbar native rendering fallback | `dashboard-shell.component.ts`, `project-dashboard.component.html`, `modus-navbar.component.ts`, `trimble-logo.component.ts` | Build + `tests/static/modus-navbar-wrapper.spec.ts` + verify on Vercel |
| Sidenav overlay (no push) | `dashboard-shell.component.ts`, `project-dashboard.component.html` | `tests/static/dashboard-shell.spec.ts`, `tests/static/project-dashboard.spec.ts` |
| Consistent 56px nav row height | `src/styles.css` | `tests/static/styles.spec.ts` |
| Mobile icon centering | `src/styles.css` | `tests/static/styles.spec.ts` (mobile icon-slot auto-fill) |
| Collapsible subnav no mobile compact | `collapsible-subnav.component.ts` | (visual: resize to mobile, subnav hidden) |
| Toolbar compact mobile mode | `project-dashboard.component.html`, `project-dashboard.component.ts` | (visual: resize to 580px, search collapses to icon) |
| Toolbar margin-left collapsed subnav | `project-dashboard.component.html` | (visual: collapse subnav, toolbar clears header) |
| compactAll anchor priority | `dashboard-layout-engine.ts` | `dashboard-layout-engine.spec.ts` (2 new tests) |
| Single ng-content (canvas projection) | `dashboard-shell.component.ts` | `tests/static/dashboard-shell.spec.ts` (exactly 1 ng-content, not in conditional) |
| Canvas default pixel values (1280px grid) | `*-layout.config.ts` (`canvasDefaultLefts`, `canvasDefaultPixelWidths`) | Build verification; visual test (rightmost widget edge = 1280) |
| Widget height grid-snap + no scrollbar | page `*_HEIGHT` constants + storage keys | (visual: verify no internal scrollbar in Chromium + Safari) |
| Horizontal resize dead zone (twitch fix) | `dashboard-layout-engine.ts` (`_hResizeActive`) | (visual: vertical resize, neighbors must not twitch) |
| Push-down only collision (no jumping) | `dashboard-layout-engine.ts` (`resolveCollisions`, `compactAll`) | (visual: resize shorter, distant widgets must not jump up) |
