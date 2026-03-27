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

    it('pushes unlocked widgets away from locked widgets after BFS', () => {
      const rects: Record<string, WidgetRect> = {
        mover:    { left: 0, top: 0, width: 300, height: 300 },
        unlocked: { left: 100, top: 0, width: 300, height: 300 },
        locked:   { left: 350, top: 0, width: 300, height: 300 },
      };
      runCanvasPushBfs('mover', rects, { locked: true }, GAP);

      expect(rects['locked'].left).toBe(350);
      expect(noOverlap(rects, GAP, 'unlocked', 'locked')).toBe(true);
    });
  });

  describe('off-screen clamping', () => {
    it('falls back to push right when left push would go off-screen', () => {
      // Widget is to the left of mover center but too close to left edge
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 500, height: 300 },
        left:  { left: 10, top: 0, width: 400, height: 300 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['left'].left).toBeGreaterThanOrEqual(0);
      expect(noOverlap(rects, GAP, 'mover', 'left')).toBe(true);
    });

    it('falls back to horizontal push when upward push would go off-screen', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 300, height: 500 },
        above: { left: 0, top: 10, width: 300, height: 400 },
      };
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['above'].top).toBeGreaterThanOrEqual(0);
      expect(noOverlap(rects, GAP, 'mover', 'above')).toBe(true);
    });
  });

  describe('axis selection', () => {
    it('initial push uses clearance-based axis (horizontal when clearR <= clearD)', () => {
      // Widget is mostly overlapping vertically, small horizontal overlap
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        other: { left: 190, top: 50, width: 200, height: 200 },
      };
      // clearR = 200 + 16 - 190 = 26, clearD = 200 + 16 - 50 = 166
      // clearR < clearD → pushH=true → push right
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].left).toBe(200 + GAP);
      expect(rects['other'].top).toBe(50);
    });

    it('initial push uses clearance-based axis (vertical when clearD < clearR)', () => {
      const rects: Record<string, WidgetRect> = {
        mover: { left: 0, top: 0, width: 200, height: 200 },
        other: { left: 50, top: 190, width: 200, height: 200 },
      };
      // clearR = 200 + 16 - 50 = 166, clearD = 200 + 16 - 190 = 26
      // clearD < clearR → pushH=false → push down
      runCanvasPushBfs('mover', rects, {}, GAP);

      expect(rects['other'].left).toBe(50);
      expect(rects['other'].top).toBe(200 + GAP);
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
