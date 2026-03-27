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
 *   1. Same-row widgets (tops within gap) always push horizontally.
 *   2. Otherwise, side-aware clearance picks the axis with less penetration
 *      measured from the side where the target sits.
 * Cascade pushes use center-to-center distance for axis selection.
 *
 * Pushed widgets are allowed to go into negative coordinates. This ensures
 * the push cascade continues smoothly regardless of position in the
 * coordinate system — no clamping, no direction reversal, no jumping.
 *
 * Locked widget handling: pushes that would land a widget on top of a
 * locked widget are silently discarded — the widget stays put (is
 * "frozen") rather than jumping around the locked element.
 *
 * When a frozen widget still overlaps the mover after BFS, the mover
 * is pushed back to clear the frozen widget, as if the frozen widget
 * were itself a wall. This stops the drag at the locked boundary.
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

  const pushAway = (pusherId: string, otherId: string): void => {
    const p = rects[pusherId];
    const o = rects[otherId];
    const pR = p.left + p.width, pB = p.top + p.height;
    const oR = o.left + o.width, oB = o.top + o.height;

    const pCX = (p.left + pR) / 2, pCY = (p.top + pB) / 2;
    const oCX = o.left + o.width / 2;
    const oCY = o.top + o.height / 2;

    let pushH: boolean;
    if (pusherId === movedId) {
      const sameRow = Math.abs(p.top - o.top) <= gap;
      if (sameRow) {
        pushH = true;
      } else {
        const hClear = (oCX >= pCX) ? (pR + gap - o.left) : (oR + gap - p.left);
        const vClear = (oCY >= pCY) ? (pB + gap - o.top) : (oB + gap - p.top);
        pushH = hClear <= vClear;
      }
    } else {
      pushH = Math.abs(oCX - pCX) >= Math.abs(oCY - pCY);
    }

    const dirRef = (pusherId === movedId) ? p : rects[movedId];
    const dirCX = dirRef.left + dirRef.width / 2;
    const dirCY = dirRef.top + dirRef.height / 2;

    let candidate: WidgetRect;
    if (pushH) {
      if (oCX >= dirCX) {
        candidate = { ...o, left: pR + gap };
      } else {
        candidate = { ...o, left: p.left - o.width - gap };
      }
    } else {
      if (oCY >= dirCY) {
        candidate = { ...o, top: pB + gap };
      } else {
        candidate = { ...o, top: p.top - o.height - gap };
      }
    }

    if (rectOverlapsLocked(candidate)) {
      frozen.add(otherId);
      return;
    }
    rects[otherId] = candidate;
  };

  const frozen = new Set<string>();

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

  // Frozen-widget wall: if the mover still overlaps any widget that was
  // blocked by a locked element, push the mover back to clear it.
  for (const fid of frozen) {
    if (!hasOverlap(movedId, fid)) continue;
    const m = rects[movedId];
    const o = rects[fid];
    const mCX = m.left + m.width / 2;
    const oCX = o.left + o.width / 2;

    const sameRow = Math.abs(m.top - o.top) <= gap;
    if (sameRow) {
      if (mCX >= oCX) {
        rects[movedId] = { ...m, left: o.left + o.width + gap };
      } else {
        rects[movedId] = { ...m, left: o.left - m.width - gap };
      }
    } else {
      const mCY = m.top + m.height / 2;
      const oCY = o.top + o.height / 2;
      if (mCY >= oCY) {
        rects[movedId] = { ...m, top: o.top + o.height + gap };
      } else {
        rects[movedId] = { ...m, top: o.top - m.height - gap };
      }
    }
  }
}
