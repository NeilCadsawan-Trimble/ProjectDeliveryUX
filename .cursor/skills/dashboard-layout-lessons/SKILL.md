---
name: dashboard-layout-lessons
description: Hard-won patterns for the dashboard layout engine, canvas-mode styling, and widget interaction. Use when modifying push-squeeze resize logic, collision resolution, canvas navbar/sidenav CSS, widget selection/deselection, or overflow behavior. Covers pitfalls that have caused repeated regressions.
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

## Quick Reference: Files and Regression Tests

| Concern | Source file | Test file |
|---------|------------|-----------|
| Push-squeeze algorithm | `src/app/shell/services/dashboard-layout-engine.ts` | `dashboard-layout-engine.spec.ts` |
| Collision priority | same as above | same as above |
| Canvas navbar overflow | `src/styles.css` | `tests/static/styles.spec.ts` |
| Side nav dark background | `src/styles.css` | (visual, test all 6 themes) |
| Widget deselection | `dashboard-shell.component.ts` | `tests/static/dashboard-shell.spec.ts` |
