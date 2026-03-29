---
name: canvas-subpage-checklist
description: Mandatory checklist for creating or modifying canvas sub-pages on project dashboards. Use whenever adding a new Records or Financials sub-page, adding tile widgets, or adding list views to canvas mode. Ensures every new page ships with full feature parity across all view modes from the start -- tile detail expansion, list row highlighting, KPI strips, column alignment, and proper navigation handlers. This skill exists because incomplete implementations have repeatedly required follow-up fix passes.
---

# Canvas Sub-Page Checklist

This skill exists because new sub-pages have shipped without the full set of canvas behaviors multiple times, requiring costly follow-up passes. **Every item below is mandatory** when creating or modifying a canvas sub-page.

## When to Use

- Adding a new sub-page under Records or Financials
- Adding tile widgets to an existing sub-page
- Adding or modifying list views in canvas mode
- Creating any new item type that appears as tiles on a canvas

## The Baseline: RFI/Submittal Pattern

RFIs and Submittals are the **reference implementation**. Every new tile type must replicate their complete pattern. The key file is `project-dashboard.component.ts`.

## Mandatory Checklist

### 1. Tile Widget (Card Mode)

Every tile widget **must** have:

- [ ] **Outer `@if` gate** with detail fallback:
  ```html
  @if (subnavViewMode() !== 'list' || tileDetailViews()['tile-X-' + item.id]) {
  ```
  This ensures the tile remains visible in list mode when its detail is expanded.

- [ ] **Conditional transition class** (disabled during drag):
  ```html
  [class]="'absolute' + (tileMoveTargetId() !== 'tile-X-' + item.id ? ' widget-detail-transition' : '')"
  ```

- [ ] **Z-index boost** when detail is open:
  ```html
  [style.z-index]="tileDetailViews()['tile-X-' + item.id] ? 9999 : (tileZ()['tile-X-' + item.id] ?? 0)"
  ```

- [ ] **Mousedown stopPropagation** when detail is open:
  ```html
  (mousedown)="selectTileWidget('tile-X-' + item.id); tileDetailViews()['tile-X-' + item.id] ? $event.stopPropagation() : null"
  ```

- [ ] **`data-tile-id` attribute** for identification:
  ```html
  [attr.data-tile-id]="'tile-X-' + item.id"
  ```

- [ ] **Position and size bindings** from `tilePos()`:
  ```html
  [style.top.px]="tilePos()['tile-X-' + item.id]?.top ?? 0"
  [style.left.px]="tilePos()['tile-X-' + item.id]?.left ?? 0"
  [style.width.px]="tilePos()['tile-X-' + item.id]?.width ?? 308"
  [style.height.px]="tilePos()['tile-X-' + item.id]?.height ?? 220"
  ```

- [ ] **Border selection highlight**:
  ```html
  [class.border-default]="selectedWidgetId() !== 'tile-X-' + item.id"
  [class.border-primary]="selectedWidgetId() === 'tile-X-' + item.id"
  ```

### 2. Tile Detail Expansion (Expanded Mode)

Inside the tile wrapper, use `@if/@else`:

- [ ] **Detail view block** with rich content:
  ```html
  @if (tileDetailViews()['tile-X-' + item.id]; as detail) {
    <!-- Expanded detail: bg-background, shadow-2xl, draggable header, close button, scrollable content -->
  } @else {
    <!-- Card view: the normal compact tile card -->
  }
  ```

- [ ] **Draggable header** in detail mode:
  ```html
  (mousedown)="onTileDetailHeaderMouseDown($event, 'tile-X-' + item.id)"
  ```

- [ ] **Close button** in detail header:
  ```html
  (click)="closeTileDetail('tile-X-' + item.id)"
  ```

- [ ] **Status indicator** in detail header (if the item has a status field)

- [ ] **Scrollable content area**:
  ```html
  <div class="flex-1 overflow-y-auto p-5">
  ```

- [ ] **Field-by-field display** matching the desktop detail view content

### 3. Card Click Handler

- [ ] Card body click uses the `FromTile` variant, NOT the page navigation:
  ```html
  <!-- CORRECT -->
  (click)="navigateToXFromTile(item, 'tile-X-' + item.id)"

  <!-- WRONG -- navigates away instead of expanding -->
  (click)="navigateToX(item)"
  ```

- [ ] A corresponding `navigateToXFromTile` method exists in the component class:
  ```typescript
  navigateToXFromTile(item: ItemType, tileId: string): void {
    this.openTileDetail(tileId, { type: 'typeName', item });
  }
  ```

### 4. List View Row Highlighting

- [ ] Every list view row has active-detail highlighting:
  ```html
  [class.bg-primary-20]="!!tileDetailViews()['tile-X-' + item.id]"
  ```

- [ ] List view rows also use the `FromTile` click handler (same as cards)

### 5. List View Column Parity

- [ ] Canvas list view columns **exactly match** the desktop list view columns
- [ ] Same column headers, same data fields, same formatting (currency pipes, status dots, etc.)
- [ ] Same column widths (proportional)

### 6. KPI Strip (if desktop has one)

- [ ] If the desktop sub-page has KPI summary cards, canvas mode must also have them
- [ ] KPI strip uses a `lockedRect` in the `_tileCanvasEffect` (e.g., `tc-fin-kpis`)
- [ ] The locked rect ID is added to the `lockedIds` array in `SubpageTileCanvas` config
- [ ] `offsetTop` is adjusted to account for the KPI strip height

### 7. Navigation Method in Component Class

- [ ] `navigateToXFromTile(item, tileId)` method calls `this.openTileDetail(tileId, { type: '...', item })`
- [ ] The `type` string matches a valid `TileDetailView` type (update the type union if needed)
- [ ] The `TileDetailView` type in `subpage-tile-canvas.ts` includes the new type

### 8. Empty State

- [ ] An empty state component renders when there are no items for the sub-page

## TileDetailView Type

When adding a new tile type, update the `TileDetailView` interface in `subpage-tile-canvas.ts`:

```typescript
export interface TileDetailView {
  type: 'rfi' | 'submittal' | 'dailyReport' | 'punchItem' | 'inspection' | 'changeOrder' | 'newType';
  item: unknown;
}
```

## View Mode Cross-Reference

Every sub-page must work correctly in **all three modes**:

| Feature | Desktop (non-canvas) | Canvas - Card/Grid | Canvas - List |
|---------|---------------------|-------------------|---------------|
| Item cards | N/A (desktop uses list) | Draggable tiles | N/A |
| Item list | Full-width table | N/A (hidden) | Locked list widget |
| Detail view | Full-page detail | In-canvas tile expansion | In-canvas tile expansion + row highlight |
| KPI strip | Above content | Locked rect | Locked rect |
| Column parity | Reference columns | N/A | Must match desktop |

## Anti-Patterns to Avoid

### DO NOT: Create tiles without detail expansion
```html
<!-- WRONG: No @if for detail, no z-index boost, static class -->
@if (activeRecordsPage() === 'x' && subnavViewMode() !== 'list') {
  @for (item of items(); track item.id) {
    <div class="absolute widget-detail-transition" ...>
      <!-- Only card content, no detail expansion -->
    </div>
  }
}
```

### DO NOT: Use page navigation from canvas tiles
```html
<!-- WRONG: Leaves canvas mode -->
(click)="navigateToX(item)"

<!-- CORRECT: Expands tile in-place -->
(click)="navigateToXFromTile(item, 'tile-X-' + item.id)"
```

### DO NOT: Omit list row highlighting
```html
<!-- WRONG: No visual feedback when detail is open -->
<div class="grid ..." tabindex="0" (click)="navigateToXFromTile(...)">

<!-- CORRECT: Row highlights when its detail is expanded -->
<div class="grid ..." [class.bg-primary-20]="!!tileDetailViews()['tile-X-' + item.id]" tabindex="0" (click)="navigateToXFromTile(...)">
```

### DO NOT: Have different columns in desktop vs canvas list views
Always scan the non-canvas component (e.g., `records-subpages.component.ts`) to verify column parity before finalizing a canvas list view.

## Verification

After implementing a new sub-page, verify:

1. **Card mode**: Click a tile card body -- it should expand into a detail widget, NOT navigate away
2. **List mode**: Click a list row -- it should expand a detail widget AND highlight the row
3. **Detail close**: Click the X button -- tile should collapse back to card size
4. **Detail drag**: Drag the detail header -- tile should move on canvas
5. **Column match**: Compare canvas list columns against desktop -- they must be identical
6. **KPI match**: If desktop has KPIs, verify they appear in canvas mode too
7. **All projects**: Verify across multiple projects, not just one
