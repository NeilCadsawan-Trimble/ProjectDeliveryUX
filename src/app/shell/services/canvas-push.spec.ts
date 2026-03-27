import { runCanvasPushBfs, type WidgetRect } from './canvas-push';

const GAP = 16;

function noOverlap(
  rects: Record<string, WidgetRect>,
  gap: number,
  a: string,
  b: string,
): boolean {
  const ar = rects[a], br = rects[b];
  return ar.left >= br.left + br.width + gap
      || br.left >= ar.left + ar.width + gap
      || ar.top  >= br.top  + br.height + gap
      || br.top  >= ar.top  + ar.height + gap;
}

function assertNoPairwiseOverlap(
  rects: Record<string, WidgetRect>,
  gap: number,
): void {
  const ids = Object.keys(rects);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      if (!noOverlap(rects, gap, ids[i], ids[j])) {
        throw new Error(
          `${ids[i]} overlaps ${ids[j]}: ` +
          `${ids[i]}=${JSON.stringify(rects[ids[i]])} ` +
          `${ids[j]}=${JSON.stringify(rects[ids[j]])}`,
        );
      }
    }
  }
}

describe('runCanvasPushBfs', () => {
  describe('basic push', () => {
    it('pushes a single overlapping widget to the right', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 400, height: 300 },
        other: { left: 200, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].left).toBe(400 + GAP);
      expect(rects['mover'].left).toBe(0);
    });

    it('pushes a widget below when vertical clearance is less', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 300, height: 400 },
        other: { left: 0, top: 200, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].top).toBe(400 + GAP);
    });

    it('does not move widgets that are already clear', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        far:   { left: 500, top: 500, width: 200, height: 200 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['far'].left).toBe(500);
      expect(rects['far'].top).toBe(500);
    });

    it('respects gap between widgets', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        close: { left: 210, top: 0, width: 200, height: 200 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['close'].left).toBeGreaterThanOrEqual(200 + GAP);
    });
  });

  describe('mover immunity', () => {
    it('does not displace the mover when other widgets cascade', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 400, height: 400 },
        a:     { left: 100, top: 0, width: 200, height: 200 },
        b:     { left: 250, top: 0, width: 200, height: 200 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['mover'].left).toBe(0);
      expect(rects['mover'].top).toBe(0);
    });
  });

  describe('cascade push direction (regression)', () => {
    it('cascades right: expanding mover pushes A right, A pushes B further right', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 800, height: 1000 },
        a:     { left: 405, top: 0, width: 389, height: 340 },
        b:     { left: 810, top: 0, width: 470, height: 340 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['a'].left).toBeGreaterThanOrEqual(800 + GAP);
      expect(rects['b'].left).toBeGreaterThan(rects['a'].left);
      assertNoPairwiseOverlap(rects, GAP);
    });

    it('regression: two widgets pushed to same position cascade outward, not back', () => {
      // Reproduces the exact bug: mover expands, pushes both A and B to
      // the same left=816. Cascade from B must push A further right, not
      // back toward the mover.
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 222, width: 800, height: 1000 },
        sub:   { left: 405, top: 222, width: 389, height: 340 },
        toff:  { left: 810, top: 222, width: 470, height: 340 },
        cal:   { left: 0, top: 578, width: 1280, height: 580 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['sub'].left).toBeGreaterThanOrEqual(800 + GAP);
      expect(rects['toff'].left).toBeGreaterThanOrEqual(800 + GAP);
      expect(noOverlap(rects, GAP, 'sub', 'toff')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'sub')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'toff')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'cal')).toBe(true);
    });

    it('cascade push direction is relative to mover, not cascade pusher', () => {
      // Both widgets overlap the mover and get pushed to the same position.
      // The cascade between them must push further right, not back left.
      const rects: Record<string, WidgetRect> = {
        mover:  { left: 0, top: 0, width: 600, height: 600 },
        alpha:  { left: 500, top: 0, width: 300, height: 300 },
        beta:   { left: 500, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['alpha'].left).toBeGreaterThanOrEqual(600 + GAP);
      expect(rects['beta'].left).toBeGreaterThanOrEqual(600 + GAP);
      expect(noOverlap(rects, GAP, 'alpha', 'beta')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'alpha')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'beta')).toBe(true);
    });
  });

  describe('post-BFS cleanup', () => {
    it('re-pushes a widget that cascade-pushed back into the mover', () => {
      // Set up a scenario where cascade could push a widget back into mover
      // territory. The post-BFS cleanup should fix it.
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 800, height: 800 },
        a:     { left: 400, top: 0, width: 300, height: 300 },
        b:     { left: 750, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(noOverlap(rects, GAP, 'mover', 'a')).toBe(true);
      expect(noOverlap(rects, GAP, 'mover', 'b')).toBe(true);
      assertNoPairwiseOverlap(rects, GAP);
    });
  });

  describe('locked widgets', () => {
    it('does not move locked widgets', () => {
      const rects: Record<string, WidgetRect> = {
        mover:  { left: 0, top: 0, width: 400, height: 300 },
        locked: { left: 200, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, { locked: true }, GAP);

      expect(rects['locked'].left).toBe(200);
      expect(rects['locked'].top).toBe(0);
    });

    it('widget trapped between mover and locked widget stops, mover pushed back', () => {
      const rects: Record<string, WidgetRect> = {
        mover:    { left: 0, top: 0, width: 300, height: 300 },
        unlocked: { left: 100, top: 0, width: 300, height: 300 },
        locked:   { left: 350, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, { locked: true }, GAP);

      expect(rects['locked'].left).toBe(350);
      expect(rects['unlocked'].left).toBe(100);
      // Mover is pushed back to clear the frozen widget
      expect(rects['mover'].left).toBeLessThanOrEqual(100 - 300 - GAP);
    });

    it('push succeeds when target position clears all locked widgets', () => {
      const rects: Record<string, WidgetRect> = {
        mover:    { left: 0, top: 0, width: 200, height: 200 },
        unlocked: { left: 100, top: 0, width: 100, height: 200 },
        locked:   { left: 500, top: 0, width: 100, height: 200 },
      };
      runCanvasPushBfs('mover', rects, { locked: true }, GAP);

      expect(rects['locked'].left).toBe(500);
      expect(rects['unlocked'].left).toBe(200 + GAP);
      expect(noOverlap(rects, GAP, 'unlocked', 'locked')).toBe(true);
    });
  });

  describe('negative coordinate push (no clamping)', () => {
    it('pushes widget into negative x without clamping', () => {
      // Both at top=0 → sameRow → horizontal push.
      // Widget center (200) < mover center (300) → push left.
      // candidateLeft = 200 - 200 - 16 = -16. No clamping.
      const rects: Record<string, WidgetRect> = {
        mover: { left: 200, top: 0, width: 200, height: 600 },
        left:  { left: 100, top: 0, width: 200, height: 600 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['left'].left).toBe(200 - 200 - GAP); // -16
    });

    it('pushes widget into negative y without clamping', () => {
      // tops differ by 100 > GAP → not sameRow → side-aware clearance.
      // vClear < hClear → vertical push. Widget pushed up past origin.
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 200, width: 600, height: 200 },
        above: { left: 0, top: 100, width: 600, height: 200 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['above'].top).toBe(200 - 200 - GAP); // -16
    });

    it('widget pushed left continues past x=0 — no direction reversal', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 500, height: 300 },
        left:  { left: 10, top: 0, width: 400, height: 300 },
      };
      const origLeft = rects['left'].left;
      runCanvasPushBfs('mover', rects, {}, GAP);

      // Must go left (negative), never jump right
      expect(rects['left'].left).toBeLessThanOrEqual(origLeft);
      expect(rects['left'].left).toBeLessThan(0);
    });
  });

  describe('cascade left push past origin (regression)', () => {
    it('cascade widgets continue into negative x, never reverse direction', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 100, top: 0, width: 300, height: 600 },
        a:     { left: 50,  top: 0, width: 200, height: 600 },
        b:     { left: 0,   top: 0, width: 100, height: 600 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      // a pushed left of mover: 100 - 200 - 16 = -116
      expect(rects['a'].left).toBe(100 - 200 - GAP);
      // b pushed left of a
      expect(rects['b'].left).toBeLessThan(rects['a'].left);
      // No overlaps
      assertNoPairwiseOverlap(rects, GAP);
    });

    it('widget near origin pushed left continues smoothly', () => {
      const rects: Record<string, WidgetRect> = {
        mover:  { left: 50,  top: 0, width: 200, height: 600 },
        target: { left: 5,   top: 0, width: 100, height: 600 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      // 50 - 100 - 16 = -66
      expect(rects['target'].left).toBe(50 - 100 - GAP);
    });

    it('incremental cascade smoothly pushes into negative coordinates', () => {
      const rects: Record<string, WidgetRect> = {
        b:     { left: 0,   top: 0, width: 100, height: 600 },
        a:     { left: 116, top: 0, width: 100, height: 600 },
        mover: { left: 232, top: 0, width: 100, height: 600 },
      };

      for (let i = 0; i < 300; i++) {
        rects['mover'] = {
          ...rects['mover'],
          left: 232 - i,
          width: 100 + i,
        };
        runCanvasPushBfs('mover', rects, {}, GAP);
      }

      // After 300 frames of incremental pushing, both a and b
      // should be well into negative territory, stacked left of mover.
      expect(rects['a'].left).toBeLessThan(0);
      expect(rects['b'].left).toBeLessThan(rects['a'].left);
      // No pairwise overlaps
      assertNoPairwiseOverlap(rects, GAP);
    });
  });

  describe('axis selection', () => {
    it('side-aware clearance selects horizontal when overlap is from the right', () => {
      // target is to the right of mover, small horizontal overlap
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        other: { left: 190, top: 50, width: 200, height: 200 },
      };
      // tops differ by 50 > GAP → not sameRow → side-aware clearance
      // hClear = pR+gap-o.left = 26, vClear = pB+gap-o.top = 166
      // pushH = 26 <= 166 → true → push right
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].left).toBe(200 + GAP);
      expect(rects['other'].top).toBe(50);
    });

    it('side-aware clearance selects vertical when overlap is from below', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        other: { left: 50, top: 190, width: 200, height: 200 },
      };
      // tops differ by 190 > GAP → not sameRow → side-aware clearance
      // hClear = pR+gap-o.left = 166, vClear = pB+gap-o.top = 26
      // pushH = 166 <= 26 → false → push down
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].left).toBe(50);
      expect(rects['other'].top).toBe(200 + GAP);
    });

    it('same-row override: widgets sharing the same top always push horizontally', () => {
      // Simulates a drag scenario where mover encroaches from the right.
      // Both widgets share top=0. clearR would be huge, clearD would be
      // small → old code would push vertically. sameRow override fixes this.
      const rects: Record<string, WidgetRect> = {
        mover:  { left: 388, top: 0, width: 389, height: 340 },
        target: { left: 0,   top: 0, width: 389, height: 340 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      // Must push horizontally (left), not vertically
      expect(rects['target'].top).toBe(0);
      expect(rects['target'].left).toBeLessThan(388);
    });
  });

  describe('drag push (same-row widgets)', () => {
    it('dragging a widget left pushes same-row neighbor left, not vertically', () => {
      // TimeOff | RFIs | Submittals — all on the same row.
      // User drags Submittals 2px to the left, encroaching on RFIs.
      const rects: Record<string, WidgetRect> = {
        timeOff:    { left: 0,   top: 206, width: 470, height: 340 },
        rfis:       { left: 486, top: 206, width: 389, height: 340 },
        submittals: { left: 889, top: 206, width: 389, height: 340 },
      };
      runCanvasPushBfs('submittals', rects, {}, GAP);

      // RFIs must stay on the same row (pushed left, NOT down/up)
      expect(rects['rfis'].top).toBe(206);
      expect(rects['rfis'].left).toBeLessThan(889);
      // TimeOff must also stay on the same row
      expect(rects['timeOff'].top).toBe(206);
    });

    it('incremental drag keeps all same-row widgets horizontal, never vertical', () => {
      // Simulate incremental dragging: submittals moves 1px left per frame.
      // RFIs and TimeOff must never be pushed vertically (the original bug).
      const rects: Record<string, WidgetRect> = {
        timeOff:    { left: 0,   top: 206, width: 470, height: 340 },
        rfis:       { left: 486, top: 206, width: 389, height: 340 },
        submittals: { left: 891, top: 206, width: 389, height: 340 },
      };

      for (let i = 0; i < 100; i++) {
        rects['submittals'] = { ...rects['submittals'], left: 891 - i };
        runCanvasPushBfs('submittals', rects, {}, GAP);

        // Critical: no widget should ever leave its row
        expect(rects['rfis'].top).toBe(206);
        expect(rects['timeOff'].top).toBe(206);
      }

      // After dragging 100px, all widgets still on same row, no overlaps
      expect(noOverlap(rects, GAP, 'timeOff', 'rfis')).toBe(true);
      expect(noOverlap(rects, GAP, 'rfis', 'submittals')).toBe(true);
    });
  });

  describe('real-world: home page detail expansion', () => {
    it('RFI detail expansion pushes TimeOff right, Submittals further right, Calendar down', () => {
      const rects: Record<string, WidgetRect> = {
        homeRfis:       { left: 0,   top: 222, width: 800,  height: 1000 },
        homeSubmittals: { left: 405, top: 222, width: 389,  height: 340 },
        homeTimeOff:    { left: 810, top: 222, width: 470,  height: 340 },
        homeCalendar:   { left: 0,   top: 578, width: 1280, height: 580 },
      };
      const locked: Record<string, boolean> = {};

      runCanvasPushBfs('homeRfis', rects, locked, GAP);

      expect(rects['homeRfis'].left).toBe(0);
      expect(rects['homeRfis'].top).toBe(222);

      expect(rects['homeTimeOff'].left).toBeGreaterThanOrEqual(800 + GAP);
      expect(rects['homeSubmittals'].left).toBeGreaterThanOrEqual(800 + GAP);

      expect(rects['homeCalendar'].top).toBeGreaterThanOrEqual(222 + 1000 + GAP);

      assertNoPairwiseOverlap(rects, GAP);
    });

    it('home page with locked header does not displace header', () => {
      const rects: Record<string, WidgetRect> = {
        homeHeader:     { left: 0,   top: 16,  width: 1280, height: 190 },
        homeRfis:       { left: 0,   top: 222, width: 800,  height: 1000 },
        homeSubmittals: { left: 405, top: 222, width: 389,  height: 340 },
        homeTimeOff:    { left: 810, top: 222, width: 470,  height: 340 },
        homeCalendar:   { left: 0,   top: 578, width: 1280, height: 580 },
      };
      const locked: Record<string, boolean> = { homeHeader: true };

      runCanvasPushBfs('homeRfis', rects, locked, GAP);

      expect(rects['homeHeader'].left).toBe(0);
      expect(rects['homeHeader'].top).toBe(16);
      assertNoPairwiseOverlap(rects, GAP);
    });
  });
});
