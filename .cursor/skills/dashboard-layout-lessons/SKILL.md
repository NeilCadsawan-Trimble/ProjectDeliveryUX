---
name: dashboard-layout-lessons
description: Hard-won patterns for the dashboard layout engine, canvas-mode styling, and widget interaction. Use when modifying push-squeeze resize logic, collision resolution, canvas BFS push algorithm, canvas detail expansion, canvas navbar/sidenav CSS, widget selection/deselection, overflow behavior, tile detail template patterns, or view-mode parity. Covers pitfalls that have caused repeated regressions.
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
