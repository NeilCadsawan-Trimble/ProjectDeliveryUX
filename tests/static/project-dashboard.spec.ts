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
const TILE_CANVAS_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/subpage-tile-canvas.ts'),
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

  describe('dynamic subnav collapse', () => {
    it('has tileSubnavWidth computed signal', () => {
      expect(SRC).toContain('tileSubnavWidth');
    });

    it('has tileContentLeft computed signal', () => {
      expect(SRC).toContain('tileContentLeft');
    });

    it('has tileContentWidth computed signal', () => {
      expect(SRC).toContain('tileContentWidth');
    });

    it('uses TILE_SUBNAV_EXPANDED and TILE_SUBNAV_COLLAPSED constants', () => {
      expect(SRC).toContain('TILE_SUBNAV_EXPANDED');
      expect(SRC).toContain('TILE_SUBNAV_COLLAPSED');
    });

    it('shifts non-locked tiles by delta when subnav collapses', () => {
      expect(SRC).toContain('deltaX');
      expect(SRC).toContain('rect.left + deltaX');
    });
  });

  describe('save as default layout', () => {
    it('calls engine.saveAsDefaultLayout', () => {
      expect(SRC).toContain('saveAsDefaultLayout');
    });

    it('has Save as Default Layout menu item', () => {
      expect(SRC).toContain('Save as Default Layout');
    });
  });

  describe('tile detail expansion (canvas)', () => {
    it('has FromTile navigation methods for all expandable sub-page types', () => {
      expect(SRC).toContain('navigateToRfiFromTile');
      expect(SRC).toContain('navigateToDailyReportFromTile');
      expect(SRC).toContain('navigateToPunchItemFromTile');
      expect(SRC).toContain('navigateToInspectionFromTile');
      expect(SRC).toContain('navigateToChangeOrderFromTile');
    });

    it('has closeTileDetail method for closing expanded tiles', () => {
      expect(SRC).toContain('closeTileDetail');
    });

    it('has onTileDetailHeaderMouseDown for dragging expanded tiles', () => {
      expect(SRC).toContain('onTileDetailHeaderMouseDown');
    });

    it('template references tileDetailViews() for conditional detail rendering', () => {
      const matches = SRC.match(/tileDetailViews\(\)/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(10);
    });

    it('boosts z-index to 9999 for expanded detail tiles', () => {
      expect(SRC).toContain('9999');
    });

    it('highlights active list rows with bg-primary-20', () => {
      const matches = SRC.match(/bg-primary-20.*tileDetailViews/g) ?? [];
      expect(matches.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('TileDetailView type completeness', () => {
    it('includes all six entity types in the union', () => {
      for (const type of ['rfi', 'submittal', 'dailyReport', 'punchItem', 'inspection', 'changeOrder']) {
        expect(TILE_CANVAS_SRC).toContain(`'${type}'`);
      }
    });

    it('has openDetail method', () => {
      expect(TILE_CANVAS_SRC).toContain('openDetail(');
    });
  });
});
