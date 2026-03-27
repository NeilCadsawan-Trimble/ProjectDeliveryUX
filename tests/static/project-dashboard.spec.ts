import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.ts'),
  'utf-8',
);
const WIDGET_FRAME_SRC = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/components/widget-frame.component.ts'),
  'utf-8',
);

describe('ProjectDashboardComponent (template regression)', () => {
  describe('resize handles', () => {
    it('uses WidgetFrameComponent which contains widget-resize-handle', () => {
      expect(SRC).toContain('<app-widget-frame');
      expect(WIDGET_FRAME_SRC).toContain('<widget-resize-handle');
    });

    it('does not have left position resize handles', () => {
      expect(SRC).not.toContain('position="left"');
      expect(WIDGET_FRAME_SRC).not.toContain('position="left"');
    });
  });

  describe('labels', () => {
    it('uses "Reset Layout" not "Reset Widgets"', () => {
      expect(SRC).toContain('Reset Layout');
      expect(SRC).not.toContain('Reset Widgets');
    });
  });

  describe('no deprecated features', () => {
    it('does NOT contain "Clean Up Overlaps" menu item', () => {
      expect(SRC).not.toContain('Clean Up Overlaps');
    });

    it('does NOT contain cleanupOverlaps method calls', () => {
      expect(SRC).not.toContain('cleanupOverlaps');
    });
  });

  describe('reset effect', () => {
    it('calls resetToDefaults', () => {
      expect(SRC).toContain('resetToDefaults()');
    });
  });

  describe('imports use shell/ path', () => {
    it('imports DashboardLayoutEngine from shell/services', () => {
      expect(SRC).toContain("from '../../shell/services/dashboard-layout-engine'");
    });

    it('imports CanvasResetService from shell/services', () => {
      expect(SRC).toContain("from '../../shell/services/canvas-reset.service'");
    });
  });

  describe('widget-detail-transition guard', () => {
    it('uses shouldTransition() for all canvas widget-detail-transition bindings', () => {
      const matches = SRC.match(/widget-detail-transition/g) ?? [];
      expect(matches.length).toBeGreaterThan(0);
      const rawConditionPattern = /hasCanvasDetails\(\)\s*&&[^']*widget-detail-transition/;
      expect(SRC).not.toMatch(rawConditionPattern);
    });

    it('has shouldTransition method delegating to _detailMgr', () => {
      expect(SRC).toContain('shouldTransition(');
      expect(SRC).toContain('_detailMgr.shouldTransition(');
    });
  });
});
