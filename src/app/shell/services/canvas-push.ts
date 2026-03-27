export interface WidgetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * BFS-based canvas push algorithm. Resolves overlaps by pushing widgets apart
 * using minimum penetration depth along the axis of least overlap.
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

  const pushAway = (pusherId: string, otherId: string): void => {
    const p = rects[pusherId];
    const o = rects[otherId];
    const pR = p.left + p.width, pB = p.top + p.height;

    const pCX = (p.left + pR) / 2, pCY = (p.top + pB) / 2;
    const oCX = o.left + o.width / 2;
    const oCY = o.top + o.height / 2;

    let pushH: boolean;
    if (pusherId === movedId) {
      const clearR = pR + gap - o.left;
      const clearD = pB + gap - o.top;
      pushH = clearR <= clearD;
    } else {
      pushH = Math.abs(oCX - pCX) >= Math.abs(oCY - pCY);
    }

    // For cascade pushes, determine left/right (or up/down) relative to the
    // MOVER, not the cascade pusher. This prevents widgets pushed to the same
    // position from bouncing back toward the mover.
    const dirRef = (pusherId === movedId) ? p : rects[movedId];
    const dirCX = dirRef.left + dirRef.width / 2;
    const dirCY = dirRef.top + dirRef.height / 2;

    if (pushH) {
      if (oCX >= dirCX) {
        rects[otherId] = { ...o, left: pR + gap };
      } else {
        const candidateLeft = p.left - o.width - gap;
        if (candidateLeft >= 0) {
          rects[otherId] = { ...o, left: candidateLeft };
        } else {
          rects[otherId] = { ...o, left: pR + gap };
        }
      }
    } else {
      if (oCY >= dirCY) {
        rects[otherId] = { ...o, top: pB + gap };
      } else {
        const candidateTop = p.top - o.height - gap;
        if (candidateTop >= 0) {
          rects[otherId] = { ...o, top: candidateTop };
        } else if (oCX >= dirCX) {
          rects[otherId] = { ...o, left: pR + gap };
        } else {
          rects[otherId] = { ...o, left: p.left - o.width - gap };
        }
      }
    }
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

      pushAway(pusherId, otherId);
      visited.delete(otherId);
      queue.push(otherId);
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

  const lockedIds = ids.filter(id => isLocked[id]);
  if (lockedIds.length > 0) {
    let resolved = false;
    for (let pass = 0; pass < ids.length * 2 && !resolved; pass++) {
      resolved = true;
      for (const lid of lockedIds) {
        for (const wid of ids) {
          if (wid === lid || isLocked[wid]) continue;
          if (!hasOverlap(lid, wid)) continue;
          pushAway(lid, wid);
          resolved = false;
        }
      }
    }
  }
}
