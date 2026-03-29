---
name: view-mode-parity
description: Ensures feature parity across all view modes (desktop, canvas card, canvas list) when creating or modifying UI features. Use whenever adding new data, pages, widgets, columns, KPIs, or interactive behaviors to any view mode. This skill exists because features have repeatedly been implemented in one view mode but not others, requiring expensive follow-up passes.
---

# View Mode Parity

This skill enforces that every UI feature exists in all applicable view modes from the first implementation. It exists because features have been added to desktop mode but not canvas mode (or vice versa) multiple times, each time requiring a separate follow-up pass to fill the gaps.

## When to Use

- Adding a new sub-page or data type
- Adding new columns to a list view
- Adding KPI summary cards
- Adding interactive behaviors (click handlers, detail views, status changes)
- Modifying data display in any view mode
- Creating new widgets or tiles

## The Three View Modes

This application has three view modes that must stay in sync:

| Mode | When Active | Layout |
|------|-------------|--------|
| **Desktop** | Viewport < 2000px | Traditional page layout, side subnav, full-width lists |
| **Canvas Card/Grid** | Viewport >= 2000px, view mode = grid | Draggable tile widgets on infinite canvas |
| **Canvas List** | Viewport >= 2000px, view mode = list | Locked list widget on canvas with row-click detail expansion |

## The Parity Rule

**When a feature is added to ANY view mode, it MUST be added to ALL applicable view modes in the same implementation pass.**

This means:

- New list columns added to desktop → add same columns to canvas list
- New KPI cards added to desktop → add KPI strip to canvas mode
- New click handler in desktop → add equivalent handler in canvas card AND canvas list
- New data field displayed anywhere → display in all three modes
- New detail view content → content available in desktop detail AND canvas tile expansion

## Parity Matrix

For each sub-page, verify this matrix is complete:

| Feature | Desktop | Canvas Card | Canvas List |
|---------|---------|-------------|-------------|
| Data columns | All fields shown | Subset on card face | All fields (match desktop) |
| KPI summary | Cards above list | Locked rect strip | Locked rect strip |
| Click → detail | Full-page detail view | Tile expansion (in-canvas) | Tile expansion + row highlight |
| Status indicators | Dot + label | Dot + label on card | Dot + label in column |
| Sorting/filtering | If present | N/A (tiles) | If present |
| Empty state | Shown | Shown | Shown |

## Implementation Order

When adding a new feature, implement in this order:

1. **Desktop first** -- This is the reference design. Get the data, layout, and interactions right.
2. **Canvas card tiles** -- Create tile cards with:
   - Card face showing key fields
   - Detail expansion with full field display
   - Proper `FromTile` click handlers
   - Drag and resize support
3. **Canvas list view** -- Create list with:
   - Same columns as desktop (exact match)
   - `FromTile` click handlers on rows
   - `bg-primary-20` row highlighting for active details
   - Same formatting (currency pipes, status dots, etc.)
4. **Canvas KPIs** -- If desktop has summary cards:
   - Add `lockedRect` in `_tileCanvasEffect`
   - Add locked ID to `lockedIds` array
   - Adjust `offsetTop` for subsequent content

## Column Parity Verification

Before finalizing any canvas list view, open the non-canvas component file and compare columns side-by-side:

```
Desktop (records-subpages.component.ts):
  Date | Author | Weather | Crew | Hours | Safety

Canvas list (project-dashboard.component.ts):
  Date | Author | Weather | Crew | Hours | Safety  ← Must match exactly
```

If they don't match, the canvas list is wrong. Fix it before moving on.

## Files to Check

| View Mode | File |
|-----------|------|
| Desktop Records | `src/app/pages/project-dashboard/components/records-subpages.component.ts` |
| Desktop Financials | `src/app/pages/project-dashboard/components/financials-subpages.component.ts` |
| Canvas (all) | `src/app/pages/project-dashboard/project-dashboard.component.ts` |
| Dashboard data | `src/app/data/dashboard-data.ts` |

## Common Gaps That Have Occurred

These specific gaps have been found and fixed in past sessions:

| Gap | Where | Impact |
|-----|-------|--------|
| Missing tile detail expansion | Canvas card tiles | Click navigated away instead of expanding in-place |
| Missing list row highlights | Canvas list rows | No visual feedback when detail was open |
| Missing KPI strips | Canvas financials pages | Summary data only visible in desktop |
| Missing list columns | Canvas list views | Fewer columns than desktop (Weather, Safety, Priority, Follow-up, Date, Retainage, Variance) |
| Wrong click handler | Canvas tiles and list rows | Used `navigateToX()` instead of `navigateToXFromTile()` |
| Missing weather display | Canvas daily reports cards | Desktop showed weather but canvas cards didn't |

## Pre-Completion Verification

Before marking any UI feature as complete, run through this checklist:

- [ ] Desktop view shows all intended data and interactions
- [ ] Canvas card tiles include detail expansion (not just card face)
- [ ] Canvas card `FromTile` click handlers are wired (not page navigation)
- [ ] Canvas list columns match desktop columns exactly
- [ ] Canvas list rows have `bg-primary-20` highlighting for active details
- [ ] Canvas list rows use `FromTile` click handlers
- [ ] Canvas KPI strip exists if desktop has KPI cards
- [ ] Empty states render in all three modes
- [ ] Tested across multiple projects (not just one)
