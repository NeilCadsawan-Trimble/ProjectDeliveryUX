export interface WidgetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * BFS-based canvas push algorithm. Resolves overlaps by pushing widgets apart.
 *
 * Axis selection for the initial push from the mover:
 *   1. Same-row widgets (tops within gap) push horizontally, unless
 *      the widgets are vertically stacked (same left and width within
 *      tolerance), in which case they push vertically.
 *   2. Otherwise, side-aware clearance picks the axis with less penetration
 *      measured from the side where the target sits.
 * Cascade pushes use center-to-center distance for axis selection.
 *
 * Pushed widgets are allowed to go into negative coordinates. This ensures
 * the push cascade continues smoothly regardless of position in the
 * coordinate system — no clamping, no direction reversal, no jumping.
 *
 * Locked widget handling: when a push would place a widget on top of a
 * locked widget, that widget is "frozen" at its current position. A
 * backward cascade then compresses the push chain against the frozen
 * boundary: each widget that overlaps a frozen (or locked) widget is
 * pushed to exactly `gap` distance from it and itself becomes a wall.
 * The cascade continues until the mover is pushed back, stopping the
 * drag at the locked boundary with all gaps at exactly `gap` px.
 *
 * @param movedId   The widget that was just moved/resized (push source).
 * @param rects     Mutable map of widget id -> rect. Updated in place.
 * @param isLocked  Lookup: returns true if a widget should not be pushed by non-locked widgets.
 * @param gap       Minimum gap (px) to maintain between widgets.
 */
export function runCanvasPushBfs(
  movedId: string,
  rects: Record<string, WidgetRect>,
  isLocked: Record<string, boolean>,
  gap: number,
  opts?: { skipMoverPushback?: boolean },
): void {
  const ids = Object.keys(rects);

  const hasOverlap = (a: string, b: string): boolean => {
    const ar = rects[a];
    const br = rects[b];
    return ar.left < br.left + br.width + gap && br.left < ar.left + ar.width + gap
        && ar.top < br.top + br.height + gap && br.top < ar.top + ar.height + gap;
  };

  const rectOverlapsLocked = (r: WidgetRect): boolean => {
    for (const lid of ids) {
      if (!isLocked[lid]) continue;
      const l = rects[lid];
      if (r.left < l.left + l.width + gap && l.left < r.left + r.width + gap
          && r.top < l.top + l.height + gap && l.top < r.top + r.height + gap) {
        return true;
      }
    }
    return false;
  };

  const frozen = new Set<string>();
  let canFreeze = true;

  const pushAway = (pusherId: string, otherId: string): void => {
    const p = rects[pusherId];
    const o = rects[otherId];
    const pR = p.left + p.width, pB = p.top + p.height;
    const oR = o.left + o.width, oB = o.top + o.height;

    const oCX = o.left + o.width / 2;

    const sameRow = Math.abs(p.top - o.top) <= gap;
    let pushH: boolean;
    if (sameRow) {
      const stacked = Math.abs(p.left - o.left) <= gap
                   && Math.abs(p.width - o.width) <= gap * 2;
      pushH = !stacked;
    } else {
      const hPen = Math.min(pR, oR) - Math.max(p.left, o.left);
      const vPen = Math.min(pB, oB) - Math.max(p.top, o.top);
      pushH = hPen <= vPen;
    }

    const dirRef = (pusherId === movedId) ? p : rects[movedId];
    const dirCX = dirRef.left + dirRef.width / 2;

    let candidate: WidgetRect;
    if (pushH) {
      candidate = oCX >= dirCX
        ? { ...o, left: pR + gap }
        : { ...o, left: p.left - o.width - gap };
    } else {
      candidate = o.top >= p.top
        ? { ...o, top: pB + gap }
        : { ...o, top: p.top - o.height - gap };
    }

    if (rectOverlapsLocked(candidate)) {
      if (canFreeze) frozen.add(otherId);
      return;
    }
    rects[otherId] = candidate;
  };

  const queue: string[] = [movedId];
  const visited = new Set<string>();
  let safety = 0;
  const maxSafety = ids.length * 4;

  while (queue.length > 0 && safety++ < maxSafety) {
    const pusherId = queue.shift()!;
    if (visited.has(pusherId)) continue;
    visited.add(pusherId);

    for (const otherId of ids) {
      if (otherId === pusherId) continue;
      if (otherId === movedId) continue;
      if (isLocked[otherId]) continue;
      if (!hasOverlap(pusherId, otherId)) continue;

      const prevLeft = rects[otherId].left;
      const prevTop = rects[otherId].top;
      pushAway(pusherId, otherId);
      const moved = rects[otherId].left !== prevLeft || rects[otherId].top !== prevTop;
      if (moved) {
        visited.delete(otherId);
        queue.push(otherId);
      }
    }
  }

  // Post-BFS: cascade pushes can shove a widget back into the mover.
  // Re-push any non-locked widget that still overlaps with the mover.
  for (let pass = 0; pass < ids.length * 2; pass++) {
    let anyFixed = false;
    for (const otherId of ids) {
      if (otherId === movedId || isLocked[otherId]) continue;
      if (!hasOverlap(movedId, otherId)) continue;
      pushAway(movedId, otherId);
      anyFixed = true;
    }
    if (!anyFixed) break;
  }

  // All-pairs cleanup: resolve any remaining overlaps between non-mover
  // widgets that the BFS cascade missed. Freezing is disabled here to
  // avoid incorrect direction-based freezing of intermediate widgets.
  canFreeze = false;
  for (let pass = 0; pass < ids.length * 3; pass++) {
    let anyFixed = false;
    for (const aId of ids) {
      if (isLocked[aId]) continue;
      for (const bId of ids) {
        if (bId === aId || isLocked[bId]) continue;
        if (!hasOverlap(aId, bId)) continue;
        const aSize = rects[aId].width * rects[aId].height;
        const bSize = rects[bId].width * rects[bId].height;
        const pusherId = aSize >= bSize ? aId : bId;
        const targetId = pusherId === aId ? bId : aId;
        if (targetId === movedId) continue;
        const prev = { ...rects[targetId] };
        pushAway(pusherId, targetId);
        if (rects[targetId].left !== prev.left || rects[targetId].top !== prev.top) {
          anyFixed = true;
        }
      }
    }
    if (!anyFixed) break;
  }

  if (opts?.skipMoverPushback) return;

  // Frozen-widget wall cascade: frozen and locked widgets act as immovable
  // walls. Any widget overlapping a wall is pushed to exactly gap distance
  // from it and itself becomes a wall, cascading backward to the mover.
  if (frozen.size > 0) {
    const walls = new Set<string>();
    for (const id of ids) {
      if (isLocked[id] || frozen.has(id)) walls.add(id);
    }

    for (let pass = 0; pass < ids.length * 3; pass++) {
      let anyFixed = false;
      for (const wallId of [...walls]) {
        for (const otherId of ids) {
          if (otherId === wallId || walls.has(otherId)) continue;
          if (!hasOverlap(otherId, wallId)) continue;
          const m = rects[otherId];
          const o = rects[wallId];
          const sameRow = Math.abs(m.top - o.top) <= gap;
          const stacked = Math.abs(m.left - o.left) <= gap
                       && Math.abs(m.width - o.width) <= gap * 2;
          if (sameRow && !stacked) {
            const mCX = m.left + m.width / 2;
            const oCX = o.left + o.width / 2;
            if (mCX >= oCX) rects[otherId] = { ...m, left: o.left + o.width + gap };
            else rects[otherId] = { ...m, left: o.left - m.width - gap };
          } else {
            const mCY = m.top + m.height / 2;
            const oCY = o.top + o.height / 2;
            if (mCY >= oCY) rects[otherId] = { ...m, top: o.top + o.height + gap };
            else rects[otherId] = { ...m, top: o.top - m.height - gap };
          }
          if (otherId !== movedId) walls.add(otherId);
          anyFixed = true;
        }
      }
      if (!anyFixed) break;
    }
  }
}
