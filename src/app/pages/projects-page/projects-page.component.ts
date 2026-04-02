import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  signal,
  inject,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { DataStoreService } from '../../data/data-store.service';
import { ModusBadgeComponent } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import type {
  DashboardWidgetId,
  Project,
  UrgentNeedItem,
  BudgetHistoryPoint,
  ProjectJobCost,
  WeatherForecast,
} from '../../data/dashboard-data';
import {
  PROJECTS,
  BUDGET_HISTORY_BY_PROJECT,
  statusBadgeColor,
  progressClass,
  budgetProgressClass,
  budgetPctColor,
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  getProjectJobCosts,
  getProjectWeather,
  weatherIcon,
  weatherIconColor,
} from '../../data/dashboard-data';
import { getAgent, type AgentDataState } from '../../data/widget-agents';
import { PROJECT_DATA, type Milestone, type TeamMember, type Risk } from '../../data/project-data';
import { TILE_IDS, TILE_PROJECT_MAP, buildProjectsLayoutConfig } from './projects-page-layout.config';

type ContentBlock = 'owner' | 'schedule' | 'budget' | 'weather'
  | 'urgentNeeds' | 'sparkline' | 'costBreakdown' | 'insight' | 'moreNeeds'
  | 'forecast' | 'milestone' | 'teamSummary' | 'costDetail' | 'riskSummary'
  | 'fadeGain';

const CHROME_PX = 73;
const CLIENT_PX = 18;

const BLOCK_HEIGHTS: Record<ContentBlock, number> = {
  owner: 28,
  schedule: 36,
  budget: 52,
  weather: 28,
  urgentNeeds: 56,
  sparkline: 80,
  costBreakdown: 50,
  insight: 24,
  moreNeeds: 40,
  forecast: 36,
  milestone: 36,
  teamSummary: 32,
  costDetail: 90,
  riskSummary: 28,
  fadeGain: 28,
};

const LARGE_BLOCK_HEIGHTS: Partial<Record<ContentBlock, number>> = {
  sparkline: 100,
  urgentNeeds: 96,
  weather: 40,
  owner: 40,
  forecast: 70,
  fadeGain: 52,
};

const SINGLE_COL_PRIORITY: ContentBlock[] = [
  'owner', 'schedule', 'budget', 'weather', 'urgentNeeds',
  'sparkline', 'fadeGain', 'costBreakdown', 'insight', 'moreNeeds',
  'forecast', 'milestone', 'teamSummary', 'riskSummary',
];
const LEFT_COL_PRIORITY: ContentBlock[] = [
  'owner', 'weather', 'forecast', 'urgentNeeds', 'moreNeeds',
  'milestone', 'teamSummary', 'riskSummary',
];
const RIGHT_COL_PRIORITY: ContentBlock[] = ['schedule', 'budget', 'sparkline', 'fadeGain', 'costBreakdown', 'insight'];

@Component({
  selector: 'app-projects-page',
  imports: [ModusBadgeComponent, ModusProgressComponent, ModusButtonComponent, WidgetLockToggleComponent, WidgetResizeHandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  templateUrl: './projects-page.component.html',
})
export class ProjectsPageComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly engine = new DashboardLayoutEngine(
    buildProjectsLayoutConfig((id) => this.widgetFocusService.selectWidget(id)),
    inject(WidgetLayoutService),
  );

  private readonly _lockHeader = (() => {
    this.engine.widgetLocked.update(l => ({ ...l, projsHeader: true }));
  })();

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0) {
      untracked(() => {
        this.engine.resetToDefaults();
        this.engine.widgetLocked.update(l => ({ ...l, projsHeader: true }));
      });
    }
  });

  private readonly _saveDefaultsEffect = effect(() => {
    const tick = this.canvasResetService.saveDefaultsTick();
    if (tick > 0) {
      untracked(() => this.engine.saveAsDefaultLayout());
    }
  });

  readonly isMobile = this.engine.isMobile;
  readonly isCanvasMode = this.engine.isCanvasMode;
  readonly widgetColStarts = this.engine.widgetColStarts;
  readonly widgetColSpans = this.engine.widgetColSpans;
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly widgetLocked = this.engine.widgetLocked;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly projects = signal<Project[]>(PROJECTS);

  readonly totalProjects = computed(() => this.projects().length);
  readonly onTrackCount = computed(() => this.projects().filter((p) => p.status === 'On Track').length);
  readonly atRiskCount = computed(() => this.projects().filter((p) => p.status === 'At Risk').length);
  readonly overdueCount = computed(() => this.projects().filter((p) => p.status === 'Overdue').length);

  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;
  readonly weatherIcon = weatherIcon;
  readonly weatherIconColor = weatherIconColor;

  getWeather(projectId: number) {
    return getProjectWeather(projectId);
  }

  private readonly allUrgentNeeds = computed(() => buildUrgentNeeds(this.store.rfis(), this.store.submittals(), this.store.changeOrders()));

  readonly projectAgentData = computed(() => {
    const map = new Map<number, { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null }>();
    for (const p of this.projects()) {
      const needs = this.allUrgentNeeds().filter(n => n.projectId === p.id);
      const critical = needs.filter(n => n.severity === 'critical');
      const warning = needs.filter(n => n.severity === 'warning');
      const topNeed = critical[0] ?? warning[0] ?? needs[0] ?? null;
      const budgetAlert = needs.some(n => n.category === 'budget' || n.category === 'change-order');
      const jc = this._allJobCostData.find(j => j.projectId === p.id);
      const jobCostSpend = jc ? jc.budgetUsed : null;
      map.set(p.id, { urgentNeeds: needs, criticalCount: critical.length, warningCount: warning.length, topNeed, budgetAlert, jobCostSpend });
    }
    return map;
  });

  getProjectAgent(projectId: number) {
    return this.projectAgentData().get(projectId) ?? { urgentNeeds: [], criticalCount: 0, warningCount: 0, topNeed: null, budgetAlert: false, jobCostSpend: null };
  }

  projectForWidget(widgetId: string): Project | undefined {
    const idx = TILE_PROJECT_MAP[widgetId];
    return idx !== undefined ? this.projects()[idx] : undefined;
  }

  navigateToJobCosts(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/financials/job-costs', project.slug]);
  }

  navigateToProject(project: Project): void {
    this.router.navigate(['/project', project.slug]);
  }

  readonly statusBadgeColor = statusBadgeColor;
  readonly progressClass = progressClass;
  readonly budgetProgressClass = budgetProgressClass;
  readonly budgetPctColor = budgetPctColor;

  readonly visibleBlocks = computed<Record<string, Set<ContentBlock>>>(() => {
    const heights = this.widgetHeights();
    const colSpans = this.widgetColSpans();
    const result: Record<string, Set<ContentBlock>> = {};
    for (const id of this.projectWidgets) {
      const h = heights[id] ?? 416;
      const cols = colSpans[id] ?? 4;
      const available = h - CHROME_PX - CLIENT_PX;
      const wide = cols >= 6;
      const large = wide && h >= 500;
      const effectiveHeight = (b: ContentBlock): number =>
        (large ? LARGE_BLOCK_HEIGHTS[b] : undefined) ?? BLOCK_HEIGHTS[b];
      const blocks = new Set<ContentBlock>();
      if (wide) {
        const rightPriority: ContentBlock[] = large
          ? RIGHT_COL_PRIORITY.map(b => b === 'costBreakdown' ? 'costDetail' : b)
          : RIGHT_COL_PRIORITY;
        const gap = 10;
        let leftUsed = 0;
        let leftN = 0;
        for (const b of LEFT_COL_PRIORITY) {
          if (large && b === 'moreNeeds') continue;
          const cost = effectiveHeight(b) + (leftN > 0 ? gap : 0);
          if (leftUsed + cost <= available) { blocks.add(b); leftUsed += cost; leftN++; }
        }
        let rightUsed = 0;
        let rightN = 0;
        for (const b of rightPriority) {
          const cost = effectiveHeight(b) + (rightN > 0 ? gap : 0);
          if (rightUsed + cost <= available) { blocks.add(b); rightUsed += cost; rightN++; }
        }
      } else {
        const gap = 12;
        let used = 0;
        let n = 0;
        for (const b of SINGLE_COL_PRIORITY) {
          const cost = effectiveHeight(b) + (n > 0 ? gap : 0);
          if (used + cost <= available) { blocks.add(b); used += cost; n++; }
        }
      }
      result[id] = blocks;
    }
    return result;
  });

  showBlock(widgetId: string, block: ContentBlock): boolean {
    return this.visibleBlocks()[widgetId]?.has(block) ?? false;
  }

  isWideWidget(widgetId: string): boolean {
    return (this.widgetColSpans()[widgetId] ?? 4) >= 6;
  }

  isLargeWidget(widgetId: string): boolean {
    return (this.widgetColSpans()[widgetId] ?? 4) >= 6 && (this.widgetHeights()[widgetId] ?? 416) >= 500;
  }

  widgetTextTier(widgetId: string): string {
    const cols = this.widgetColSpans()[widgetId] ?? 4;
    const h = this.widgetHeights()[widgetId] ?? 416;
    if (cols >= 6 && h >= 500) return 'widget-text-lg';
    if (cols >= 5 || h >= 480) return 'widget-text-md';
    return '';
  }

  getNextMilestone(projectId: number): Milestone | null {
    const data = PROJECT_DATA[projectId];
    if (!data) return null;
    const active = data.milestones.find(m => m.status === 'in-progress');
    if (active) return active;
    const upcoming = data.milestones.find(m => m.status === 'upcoming');
    return upcoming ?? null;
  }

  getTeamSummary(projectId: number): { members: TeamMember[]; total: number } | null {
    const data = PROJECT_DATA[projectId];
    if (!data?.team?.length) return null;
    return { members: data.team.slice(0, 3), total: data.team.length };
  }

  getTopRisk(projectId: number): Risk | null {
    const data = PROJECT_DATA[projectId];
    if (!data?.risks?.length) return null;
    const high = data.risks.find(r => r.severity === 'high');
    return high ?? data.risks[0];
  }

  getFirstImpactedForecast(projectId: number): WeatherForecast | null {
    const pw = getProjectWeather(projectId);
    if (!pw) return null;
    return pw.forecast.find(d => d.workImpact !== 'none') ?? null;
  }

  formatJobCostAmount(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  }

  getBudgetHistory(projectId: number): BudgetHistoryPoint[] | null {
    const pts = BUDGET_HISTORY_BY_PROJECT[projectId];
    return pts?.length ? pts : null;
  }

  sparklinePath(points: BudgetHistoryPoint[], field: 'planned' | 'actual', svgHeight = 50): string {
    if (!points.length) return '';
    const vals = points.map(p => p[field]);
    const max = Math.max(...vals, 1);
    const w = 200;
    const step = w / Math.max(vals.length - 1, 1);
    return vals.map((v, i) => {
      const x = i * step;
      const y = svgHeight - (v / max) * (svgHeight - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private readonly _allJobCostData = getProjectJobCosts();

  getJobCostData(projectId: number): ProjectJobCost | null {
    return this._allJobCostData.find(j => j.projectId === projectId) ?? null;
  }

  getProjectFadeGain(projectId: number): { label: string; value: string; isGain: boolean } | null {
    const pts = BUDGET_HISTORY_BY_PROJECT[projectId];
    if (!pts?.length) return null;
    const latest = pts[pts.length - 1];
    const diff = latest.planned - latest.actual;
    const abs = Math.abs(diff);
    const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}K` : `$${abs.toLocaleString()}`;
    if (Math.abs(diff) < 500) return null;
    return { label: diff > 0 ? 'Gain' : 'Fade', value: formatted, isGain: diff > 0 };
  }

  private static readonly JOB_COST_COLORS: Record<string, string> = {
    Labor: 'bg-primary',
    Materials: 'bg-success',
    Equipment: 'bg-warning',
    Subcontractors: 'bg-secondary',
    Overhead: 'bg-foreground-40',
  };

  jobCostCategories(jc: ProjectJobCost): { label: string; pct: number; colorClass: string; amount: number }[] {
    const total = Object.values(jc.costs).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(jc.costs).map(([label, val]) => ({
      label,
      pct: Math.round((val / total) * 100),
      colorClass: ProjectsPageComponent.JOB_COST_COLORS[label] ?? 'bg-muted',
      amount: val,
    }));
  }

  getTopNeeds(projectId: number): UrgentNeedItem[] {
    const data = this.getProjectAgent(projectId);
    return data.urgentNeeds.slice(0, 3);
  }

  getProjectInsight(projectId: number): string | null {
    const project = this.projects().find(p => p.id === projectId);
    if (!project) return null;
    const state: AgentDataState = {
      projects: [project],
      currentPage: 'projects',
      projectName: project.name,
      budgetPct: project.budgetPct,
      budgetHealthy: project.budgetPct <= 90,
    };
    const agent = getAgent('projectDefault', 'projects');
    return agent.insight?.(state) ?? null;
  }

  private buildProjectsAgentState(): AgentDataState {
    return { projects: PROJECTS, currentPage: 'projects' };
  }
  getProjectsWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'projects');
    return agent.insight?.(this.buildProjectsAgentState()) ?? null;
  }
  readonly projectsInsight = computed<string | null>(() => this.getProjectsWidgetInsight('projects'));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly projectWidgets: DashboardWidgetId[] = [...TILE_IDS];

  private readonly pageHeaderRef = viewChild<ElementRef>('pageHeader');
  private readonly gridContainerRef = viewChild<ElementRef>('widgetGrid');

  mobileGridHeight(): number {
    return this.engine.mobileGridHeight();
  }

  onWidgetHeaderMouseDown(id: DashboardWidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: DashboardWidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResize(target, dir, event, edge);
  }

  startWidgetResizeTouch(target: string, dir: 'h' | 'v' | 'both', event: TouchEvent, edge: 'left' | 'right' = 'right'): void {
    this.engine.startWidgetResizeTouch(target, dir, event, edge);
  }

  toggleWidgetLock(id: string): void {
    this.engine.toggleWidgetLock(id);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    this.engine.onDocumentTouchEnd();
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.gridContainerRef()?.nativeElement as HTMLElement | undefined;
    this.engine.headerElAccessor = () => this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }
}
