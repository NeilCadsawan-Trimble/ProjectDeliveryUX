import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
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
import { ModusBadgeComponent, type ModusBadgeColor } from '../../components/modus-badge.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { WidgetLockToggleComponent } from '../../shell/components/widget-lock-toggle.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ChartComponent, type ApexAxisChartSeries } from 'ng-apexcharts';
import { DashboardPageBase } from '../../shell/services/dashboard-page-base';
import type { DashboardLayoutConfig } from '../../shell/services/dashboard-layout-engine';
import type {
  DashboardWidgetId,
  Project,
  ProjectWeather,
  UrgentNeedItem,
  BudgetHistoryPoint,
  ProjectJobCost,
  WeatherForecast,
  ProjectCalendarEvent,
  ProjectEventCategory,
} from '../../data/dashboard-data.types';
import {
  statusBadgeColor,
  progressClass,
  budgetProgressClass,
  budgetPctColor,
  buildUrgentNeeds,
  urgentNeedCategoryIcon,
  weatherIcon,
  weatherIconColor,
} from '../../data/dashboard-data.formatters';
import { getAgent, type AgentDataState } from '../../data/widget-agents';
import type { Milestone, TeamMember, Risk } from '../../data/project-data';
import { TILE_IDS, TILE_VISUAL_ORDER, buildProjectsLayoutConfig } from './projects-page-layout.config';
import { rewriteDynamicNeeds, injectScheduleOverdue, sortProjectsByUrgency, rewriteBudgetRisk } from './projects-page-utils';
import { ModusTextInputComponent } from '../../components/modus-text-input.component';
import { RECORDS_SUB_NAV_ITEMS, FINANCIALS_SUB_NAV_ITEMS, type NavItem } from '../project-dashboard/project-dashboard.config';

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

const SINGLE_COL_FALLBACK: ContentBlock[] = [
  'owner', 'schedule', 'budget', 'weather', 'urgentNeeds',
  'sparkline', 'fadeGain', 'costBreakdown', 'insight', 'moreNeeds',
  'forecast', 'milestone', 'teamSummary', 'riskSummary',
];
const LEFT_COL_BLOCKS = new Set<ContentBlock>(['owner', 'weather', 'forecast', 'urgentNeeds', 'moreNeeds', 'milestone', 'teamSummary', 'riskSummary']);
const RIGHT_COL_BLOCKS = new Set<ContentBlock>(['schedule', 'budget', 'sparkline', 'fadeGain', 'costBreakdown', 'costDetail', 'insight']);


@Component({
  selector: 'app-projects-page',
  imports: [ModusBadgeComponent, ModusProgressComponent, WidgetResizeHandleComponent, WidgetLockToggleComponent, ModusButtonComponent, ModusTextInputComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchmove)': 'onDocumentTouchMove($event)',
    '(document:touchend)': 'onDocumentTouchEnd()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()',
  },
  templateUrl: './projects-page.component.html',
})
export class ProjectsPageComponent extends DashboardPageBase implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);

  constructor() {
    super();
  }

  protected override getEngineConfig(): DashboardLayoutConfig {
    return buildProjectsLayoutConfig((id) => this.widgetFocusService.selectWidget(id));
  }

  protected override applyInitialHeaderLock(): void {
    this.engine.widgetLocked.update(l => ({ ...l, projsHeader: true }));
  }

  protected override resolveGridElement(): HTMLElement | undefined {
    return this.gridContainerRef()?.nativeElement as HTMLElement | undefined;
  }

  protected override resolveHeaderElement(): HTMLElement | undefined {
    return this.pageHeaderRef()?.nativeElement as HTMLElement | undefined;
  }

  readonly isNarrowMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 400 : false);
  readonly isCompactMobile = signal(typeof window !== 'undefined' ? window.innerWidth <= 560 : false);
  readonly isNarrowGrid = computed(() => {
    const cols = this.engine.currentDesktopColumns();
    return cols > 0 && cols < 4;
  });
  readonly forecastDays = signal(3);

  private static readonly ALL_CREATE_ITEMS: NavItem[] = [...RECORDS_SUB_NAV_ITEMS, ...FINANCIALS_SUB_NAV_ITEMS];
  private static readonly FREQUENTLY_USED: NavItem[] = [
    { value: 'daily-reports', label: 'Daily Report', icon: 'calendar' },
    { value: 'rfis', label: 'RFI', icon: 'help' },
    { value: 'general-invoices', label: 'Invoice', icon: 'invoice' },
  ];
  readonly createMenuOpen = signal(false);
  readonly createSearchQuery = signal('');
  readonly filteredCreateItems = computed(() => {
    const q = this.createSearchQuery().toLowerCase().trim();
    if (!q) return [];
    return ProjectsPageComponent.ALL_CREATE_ITEMS.filter(item => item.label.toLowerCase().includes(q));
  });
  readonly frequentlyUsedItems = ProjectsPageComponent.FREQUENTLY_USED;

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly projects = this.store.projects;

  readonly totalProjects = computed(() => this.projects().length);
  readonly onTrackCount = computed(() => this.projects().filter((p) => p.status === 'On Track').length);
  readonly atRiskCount = computed(() => this.projects().filter((p) => p.status === 'At Risk').length);
  readonly overdueCount = computed(() => this.projects().filter((p) => p.status === 'Overdue').length);

  readonly urgentNeedCategoryIcon = urgentNeedCategoryIcon;
  readonly weatherIcon = weatherIcon;
  readonly weatherIconColor = weatherIconColor;

  getWeather(projectId: number) {
    return this.store.getProjectWeather(projectId);
  }

  private readonly allUrgentNeeds = computed(() => buildUrgentNeeds(this.store.rfis(), this.store.submittals(), this.store.changeOrders()));

  readonly projectAgentData = computed(() => {
    const changeOrders = this.store.changeOrders();
    const map = new Map<number, { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; coreWarningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null }>();
    for (const p of this.projects()) {
      const rawNeeds = this.allUrgentNeeds().filter(n => n.projectId === p.id);
      const needs = injectScheduleOverdue(rewriteDynamicNeeds(rawNeeds, p, changeOrders), p);
      const critical = needs.filter(n => n.severity === 'critical');
      const warning = needs.filter(n => n.severity === 'warning');
      const coreWarning = warning.filter(n => n.category !== 'change-order');
      const topNeed = critical[0] ?? warning[0] ?? needs[0] ?? null;
      const budgetAlert = needs.some(n => n.category === 'budget' || n.category === 'change-order');
      const jc = this.store.projectJobCosts().find(j => j.projectId === p.id);
      const jobCostSpend = jc ? jc.budgetUsed : null;
      map.set(p.id, { urgentNeeds: needs, criticalCount: critical.length, warningCount: warning.length, coreWarningCount: coreWarning.length, topNeed, budgetAlert, jobCostSpend });
    }
    return map;
  });

  getProjectAgent(projectId: number) {
    return this.projectAgentData().get(projectId) ?? { urgentNeeds: [], criticalCount: 0, warningCount: 0, coreWarningCount: 0, topNeed: null, budgetAlert: false, jobCostSpend: null };
  }

  readonly sortedTileMap = computed<Record<string, number>>(() => {
    const projs = this.projects();
    const agentData = this.projectAgentData();
    const indices = sortProjectsByUrgency(projs, agentData);
    const map: Record<string, number> = {};
    for (let i = 0; i < TILE_VISUAL_ORDER.length && i < indices.length; i++) {
      map[TILE_VISUAL_ORDER[i]] = indices[i];
    }
    return map;
  });

  readonly projectWidgetMap = computed<Record<string, Project | undefined>>(() => {
    const projs = this.projects();
    const tileMap = this.sortedTileMap();
    const map: Record<string, Project | undefined> = {};
    for (const widgetId of TILE_IDS) {
      const idx = tileMap[widgetId];
      map[widgetId] = idx !== undefined ? projs[idx] : undefined;
    }
    return map;
  });

  readonly widgetDerived = computed<Record<string, {
    agent: { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; coreWarningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null };
    weather: ProjectWeather | undefined;
    firstImpactedForecast: WeatherForecast | null;
    topNeeds: UrgentNeedItem[];
    moreNeeds: UrgentNeedItem[];
    nextMilestone: Milestone | null;
    teamSummary: { members: TeamMember[]; total: number } | null;
    topRisk: Risk | null;
    budgetHistory: BudgetHistoryPoint[] | null;
    fadeGain: { label: string; value: string; isGain: boolean } | null;
    jobCost: ProjectJobCost | null;
    insight: string | null;
  }>>(() => {
    const widgetMap = this.projectWidgetMap();
    const result: Record<string, {
      agent: { urgentNeeds: UrgentNeedItem[]; criticalCount: number; warningCount: number; coreWarningCount: number; topNeed: UrgentNeedItem | null; budgetAlert: boolean; jobCostSpend: string | null };
      weather: ProjectWeather | undefined;
      firstImpactedForecast: WeatherForecast | null;
      topNeeds: UrgentNeedItem[];
      moreNeeds: UrgentNeedItem[];
      nextMilestone: Milestone | null;
      teamSummary: { members: TeamMember[]; total: number } | null;
      topRisk: Risk | null;
      budgetHistory: BudgetHistoryPoint[] | null;
      fadeGain: { label: string; value: string; isGain: boolean } | null;
      jobCost: ProjectJobCost | null;
      insight: string | null;
    }> = {};
    for (const widgetId of TILE_IDS) {
      const project = widgetMap[widgetId];
      if (!project) continue;
      const agent = this.getProjectAgent(project.id);
      const topNeeds = agent.urgentNeeds.slice(0, 3);
      result[widgetId] = {
        agent,
        weather: this.store.getProjectWeather(project.id),
        firstImpactedForecast: this.getFirstImpactedForecast(project.id),
        topNeeds,
        moreNeeds: topNeeds.slice(1),
        nextMilestone: this.getNextMilestone(project.id),
        teamSummary: this.getTeamSummary(project.id),
        topRisk: this.getTopRisk(project.id),
        budgetHistory: this.getBudgetHistory(project.id),
        fadeGain: this.getProjectFadeGain(project.id),
        jobCost: this.getJobCostData(project.id),
        insight: this.getProjectInsight(project.id),
      };
    }
    return result;
  });

  private readonly _syncWidgetRegistrations = effect(() => {
    const widgetMap = this.projectWidgetMap();
    const registrations: Record<string, { name: string; suggestions: string[] }> = {};
    for (const widgetId of TILE_IDS) {
      const project = widgetMap[widgetId];
      if (!project) continue;
      const suggestions = this.buildProjectSuggestions(project);
      registrations[widgetId] = { name: project.name, suggestions };
    }
    untracked(() => this.widgetFocusService.registerWidgets(registrations));
  });

  private buildProjectSuggestions(project: Project): string[] {
    const agent = this.getProjectAgent(project.id);
    if (project.status === 'Overdue')
      return ['Why is this project overdue?', 'Show budget utilization', 'What are the blockers?'];
    if (project.status === 'At Risk')
      return ['Why is this project at risk?', 'Show budget breakdown', 'What needs attention?'];
    if (agent.criticalCount > 0)
      return ['What are the critical issues?', 'Show budget status', 'What are the urgent needs?'];
    if (project.budgetPct > 75)
      return ['How is the budget tracking?', 'Show cost breakdown', 'Any budget risks?'];
    if (project.status === 'Planning')
      return ['What is the planning status?', 'Show project timeline', 'When does construction start?'];
    return ['How is this project tracking?', 'Show budget status', 'Any risks?'];
  }

  projectForWidget(widgetId: string): Project | undefined {
    return this.projectWidgetMap()[widgetId];
  }

  navigateToJobCosts(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.router.navigate(['/financials/job-costs', project.slug]);
  }

  navigateToProject(project: Project): void {
    this.router.navigate(['/project', project.slug]);
  }

  private static readonly WIDGET_BLOCK_MAP: Record<string, string> = {
    urgentNeeds: 'risks', moreNeeds: 'risks', riskSummary: 'risks',
    weather: 'weather', forecast: 'weather',
    milestone: 'milestones', teamSummary: 'team',
    schedule: 'milestones',
  };
  private static readonly FINANCIALS_BLOCKS = new Set([
    'budget', 'sparkline', 'costBreakdown', 'costDetail', 'fadeGain',
  ]);

  navigateToBlock(project: Project, block: ContentBlock, event: MouseEvent): void {
    event.stopPropagation();
    const slug = project.slug;
    const widgetId = ProjectsPageComponent.WIDGET_BLOCK_MAP[block];
    if (widgetId) {
      this.router.navigate(['/project', slug], { queryParams: { widget: widgetId } });
    } else if (ProjectsPageComponent.FINANCIALS_BLOCKS.has(block)) {
      this.router.navigate(['/project', slug], { queryParams: { page: 'financials', subpage: 'budget' } });
    } else {
      this.router.navigate(['/project', slug]);
    }
  }

  readonly statusBadgeColor = statusBadgeColor;
  readonly progressClass = progressClass;
  readonly budgetProgressClass = budgetProgressClass;
  readonly budgetPctColor = budgetPctColor;

  private actionBadgeForProject(project: Project): { label: string; color: ModusBadgeColor } {
    const agent = this.getProjectAgent(project.id);
    const topRisk = this.getTopRisk(project.id);
    const weatherImpact = this.getFirstImpactedForecast(project.id);
    const nextMs = this.getNextMilestone(project.id);

    const isHigh =
      agent.criticalCount > 0 ||
      project.budgetPct >= 95;

    if (isHigh)
      return { label: 'Risk: High', color: 'danger' };

    const isModerate =
      (project.status === 'At Risk' && project.budgetPct > 75) ||
      agent.coreWarningCount >= 3;

    if (isModerate)
      return { label: 'Risk: Moderate', color: 'warning' };

    const isLow =
      agent.coreWarningCount > 0 ||
      project.status === 'At Risk' ||
      project.status === 'Overdue';

    if (isLow)
      return { label: 'Risk: Low', color: 'secondary' };

    return { label: 'Risk: None', color: 'success' };
  }

  readonly actionBadges = computed<Map<number, { label: string; color: ModusBadgeColor }>>(() => {
    this.projectAgentData();
    const map = new Map<number, { label: string; color: ModusBadgeColor }>();
    for (const p of this.projects()) {
      map.set(p.id, this.actionBadgeForProject(p));
    }
    return map;
  });

  getActionBadge(projectId: number): { label: string; color: ModusBadgeColor } {
    return this.actionBadges().get(projectId) ?? { label: 'On Track', color: 'success' };
  }

  actionBadgeBarClass(projectId: number): string {
    const badge = this.getActionBadge(projectId);
    switch (badge.color) {
      case 'danger': return 'bg-destructive';
      case 'warning': return 'bg-warning';
      case 'secondary': return 'bg-muted';
      default: return 'bg-success';
    }
  }

  private scoreBlocksForProject(project: Project): ContentBlock[] {
    const agent = this.getProjectAgent(project.id);
    const topRisk = this.getTopRisk(project.id);
    const weatherImpact = this.getFirstImpactedForecast(project.id);
    const fg = this.getProjectFadeGain(project.id);
    const nextMs = this.getNextMilestone(project.id);

    const scored: [ContentBlock, number][] = [
      ['urgentNeeds', agent.criticalCount > 0 ? 100 : agent.warningCount > 0 ? 60 : 30],
      ['budget', project.budgetPct >= 95 ? 80 : project.budgetPct > 75 ? 50 : 25],
      ['schedule', project.status === 'Overdue' ? 70 : project.status === 'At Risk' ? 40 : 35],
      ['weather', weatherImpact ? 60 : 15],
      ['riskSummary', topRisk?.severity === 'high' ? 50 : 10],
      ['fadeGain', fg ? 45 : 12],
      ['owner', 40],
      ['costBreakdown', agent.budgetAlert ? 40 : 18],
      ['costDetail', agent.budgetAlert ? 40 : 18],
      ['milestone', nextMs?.status === 'overdue' ? 35 : 16],
      ['forecast', weatherImpact ? 30 : 14],
      ['insight', 22],
      ['sparkline', 20],
      ['teamSummary', 8],
      ['moreNeeds', 5],
    ];

    return scored.sort((a, b) => b[1] - a[1]).map(([block]) => block);
  }

  readonly projectBlockPriorities = computed<Record<string, ContentBlock[]>>(() => {
    this.projectAgentData();
    const result: Record<string, ContentBlock[]> = {};
    for (const id of this.projectWidgets) {
      const project = this.projectForWidget(id);
      if (project) {
        result[id] = this.scoreBlocksForProject(project);
      }
    }
    return result;
  });

  blockOrder(widgetId: string, block: ContentBlock): number {
    const order = this.projectBlockPriorities()[widgetId];
    if (!order) return 0;
    const idx = order.indexOf(block);
    return idx >= 0 ? idx : 99;
  }

  readonly visibleBlocks = computed<Record<string, Set<ContentBlock>>>(() => {
    const heights = this.widgetHeights();
    const colSpans = this.widgetColSpans();
    const priorities = this.projectBlockPriorities();
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
      const projPriority = priorities[id] ?? SINGLE_COL_FALLBACK;
      if (wide) {
        const leftPriority = projPriority.filter(b => LEFT_COL_BLOCKS.has(b));
        const rightPriority = projPriority.filter(b => {
          if (!RIGHT_COL_BLOCKS.has(b)) return false;
          return large ? b !== 'costBreakdown' : b !== 'costDetail';
        });
        const gap = 10;
        let leftUsed = 0;
        let leftN = 0;
        for (const b of leftPriority) {
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
        const singlePriority = projPriority.filter(b => b !== 'costDetail');
        const gap = 12;
        let used = 0;
        let n = 0;
        for (const b of singlePriority) {
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
    const data = this.store.projectDetailData()[projectId];
    if (!data) return null;
    const active = data.milestones.find(m => m.status === 'in-progress');
    if (active) return active;
    const upcoming = data.milestones.find(m => m.status === 'upcoming');
    return upcoming ?? null;
  }

  getTeamSummary(projectId: number): { members: TeamMember[]; total: number } | null {
    const data = this.store.projectDetailData()[projectId];
    if (!data?.team?.length) return null;
    return { members: data.team.slice(0, 3), total: data.team.length };
  }

  getTopRisk(projectId: number): Risk | null {
    const data = this.store.projectDetailData()[projectId];
    if (!data?.risks?.length) return null;
    const project = this.projects().find(p => p.id === projectId);
    const pick = data.risks.find(r => r.severity === 'high') ?? data.risks[0];
    return project ? rewriteBudgetRisk(pick, project) : pick;
  }

  getFirstImpactedForecast(projectId: number): WeatherForecast | null {
    const pw = this.store.getProjectWeather(projectId);
    if (!pw) return null;
    return pw.forecast.find(d => d.workImpact !== 'none') ?? null;
  }

  formatJobCostAmount(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toLocaleString()}`;
  }

  private readonly budgetHistoryMap = computed<Map<number, BudgetHistoryPoint[] | null>>(() => {
    const history = this.store.budgetHistory();
    const projs = this.projects();
    const map = new Map<number, BudgetHistoryPoint[] | null>();
    for (const p of projs) {
      const pts = history[p.id] ?? [];
      map.set(p.id, pts.length ? pts : null);
    }
    return map;
  });

  getBudgetHistory(projectId: number): BudgetHistoryPoint[] | null {
    return this.budgetHistoryMap().get(projectId) ?? null;
  }

  private resolveCssVar(prop: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  }

  budgetSparklineOptions(points: BudgetHistoryPoint[], height: number) {
    if (!points.length) return null;
    const primaryColor = this.resolveCssVar('--color-primary');
    const warningColor = this.resolveCssVar('--color-warning');
    return {
      series: [
        { name: 'Planned', data: points.map(p => p.planned) },
        { name: 'Actual', data: points.map(p => p.actual) },
      ] as ApexAxisChartSeries,
      chart: { type: 'area' as const, height, sparkline: { enabled: true }, animations: { enabled: false }, fontFamily: 'inherit' },
      stroke: { curve: 'smooth' as const, width: [1.5, 2] },
      fill: {
        type: 'gradient' as const,
        gradient: { shadeIntensity: 1, opacityFrom: [0.15, 0.25], opacityTo: [0, 0.02], stops: [0, 100] },
      },
      colors: [warningColor, primaryColor],
      dataLabels: { enabled: false },
      tooltip: { enabled: false },
    };
  }

  private readonly jobCostDataMap = computed<Map<number, ProjectJobCost | null>>(() => {
    const jcList = this.store.projectJobCosts();
    const map = new Map<number, ProjectJobCost | null>();
    for (const jc of jcList) {
      map.set(jc.projectId, jc);
    }
    return map;
  });

  getJobCostData(projectId: number): ProjectJobCost | null {
    return this.jobCostDataMap().get(projectId) ?? null;
  }

  private readonly fadeGainMap = computed<Map<number, { label: string; value: string; isGain: boolean } | null>>(() => {
    const history = this.store.budgetHistory();
    const projs = this.projects();
    const map = new Map<number, { label: string; value: string; isGain: boolean } | null>();
    for (const p of projs) {
      const pts = history[p.id] ?? [];
      if (!pts.length) { map.set(p.id, null); continue; }
      const latest = pts[pts.length - 1];
      const diff = latest.planned - latest.actual;
      const abs = Math.abs(diff);
      const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(0)}K` : `$${abs.toLocaleString()}`;
      map.set(p.id, Math.abs(diff) < 500 ? null : { label: diff > 0 ? 'Gain' : 'Fade', value: formatted, isGain: diff > 0 });
    }
    return map;
  });

  getProjectFadeGain(projectId: number): { label: string; value: string; isGain: boolean } | null {
    return this.fadeGainMap().get(projectId) ?? null;
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

  private readonly projectInsightMap = computed<Map<number, string | null>>(() => {
    const projs = this.projects();
    const map = new Map<number, string | null>();
    for (const p of projs) {
      const state: AgentDataState = {
        projects: [p],
        currentPage: 'projects',
        projectName: p.name,
        budgetPct: p.budgetPct,
        budgetHealthy: p.budgetPct < 95,
      };
      const agent = getAgent('projectDefault', 'projects');
      map.set(p.id, agent.insight?.(state) ?? null);
    }
    return map;
  });

  getProjectInsight(projectId: number): string | null {
    return this.projectInsightMap().get(projectId) ?? null;
  }

  private buildProjectsAgentState(): AgentDataState {
    return {
      projects: this.store.projects(),
      allWeatherData: this.store.weatherData(),
      allJobCosts: this.store.projectJobCosts(),
      currentPage: 'projects',
    };
  }
  getProjectsWidgetInsight(widgetId: string): string | null {
    const agent = getAgent(widgetId, 'projects');
    return agent.insight?.(this.buildProjectsAgentState()) ?? null;
  }
  readonly projectsInsight = computed<string | null>(() => this.getProjectsWidgetInsight('projects'));

  readonly selectedWidgetId = this.widgetFocusService.selectedWidgetId;
  readonly projectWidgets: DashboardWidgetId[] = [...TILE_IDS];

  // ─── Timeline view toggle ───────────────────────────────────────────
  readonly viewMode = signal<'grid' | 'timeline'>(
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('projects-view-mode') as 'grid' | 'timeline') || 'grid',
  );

  switchView(mode: 'grid' | 'timeline'): void {
    this.viewMode.set(mode);
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('projects-view-mode', mode);
  }

  // ─── Timeline computed signals ──────────────────────────────────────
  private static readonly ALL_CATEGORIES: ProjectEventCategory[] = ['site', 'financial', 'meeting', 'deadline', 'inspection'];
  readonly categoryFilter = signal<Set<ProjectEventCategory>>(new Set(ProjectsPageComponent.ALL_CATEGORIES));
  readonly allCategories = ProjectsPageComponent.ALL_CATEGORIES;

  toggleCategory(cat: ProjectEventCategory): void {
    this.categoryFilter.update(s => {
      const next = new Set(s);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  isCategoryActive(cat: ProjectEventCategory): boolean {
    return this.categoryFilter().has(cat);
  }

  readonly categoryMeta: Record<ProjectEventCategory, { label: string; colorClass: string; bgClass: string; borderClass: string }> = {
    site: { label: 'Site Activities', colorClass: 'bg-primary', bgClass: 'bg-primary-20', borderClass: 'timeline-bar-site' },
    financial: { label: 'Financial', colorClass: 'bg-warning', bgClass: 'bg-warning-20', borderClass: 'timeline-bar-financial' },
    meeting: { label: 'Meetings', colorClass: 'bg-success', bgClass: 'bg-success-20', borderClass: 'timeline-bar-meeting' },
    deadline: { label: 'Deadlines', colorClass: 'bg-destructive', bgClass: 'bg-destructive-20', borderClass: 'timeline-bar-deadline' },
    inspection: { label: 'Inspections', colorClass: 'bg-secondary', bgClass: 'bg-secondary-20', borderClass: 'timeline-bar-inspection' },
  };

  readonly timelineEvents = computed<ProjectCalendarEvent[]>(() => {
    const events = this.store.projectCalendarEvents();
    const filter = this.categoryFilter();
    return events.filter(e => filter.has(e.category));
  });

  readonly eventsByProject = computed(() => {
    const events = this.timelineEvents();
    const dayPx = ProjectsPageComponent.DAY_PX;
    const start = this.timelineStartDate();

    return this.store.projects().map(p => {
      const projEvents = events
        .filter(e => e.projectId === p.id)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      const rows: ProjectCalendarEvent[][] = [];
      for (const evt of projEvents) {
        const evtLeft = Math.floor((evt.startDate.getTime() - start.getTime()) / 86400000) * dayPx;
        const evtRight = evtLeft + Math.max((Math.floor((evt.endDate.getTime() - evt.startDate.getTime()) / 86400000) + 1) * dayPx - 2, 6);
        let placed = false;
        for (const row of rows) {
          const lastInRow = row[row.length - 1];
          const lastLeft = Math.floor((lastInRow.startDate.getTime() - start.getTime()) / 86400000) * dayPx;
          const lastRight = lastLeft + Math.max((Math.floor((lastInRow.endDate.getTime() - lastInRow.startDate.getTime()) / 86400000) + 1) * dayPx - 2, 6);
          if (evtLeft >= lastRight + 2) {
            row.push(evt);
            placed = true;
            break;
          }
        }
        if (!placed) rows.push([evt]);
      }

      return {
        project: p,
        events: projEvents,
        rows,
      };
    });
  });

  private static readonly DAY_PX = 24;
  private static readonly TIMELINE_MONTHS = 6;

  readonly timelineStartDate = signal<Date>(this.computeTimelineStart());
  readonly timelineToday = new Date();

  private computeTimelineStart(): Date {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d;
  }

  readonly timelineDays = computed<{ date: Date; dayOfMonth: number; isWeekend: boolean; isToday: boolean }[]>(() => {
    const start = this.timelineStartDate();
    const end = new Date(start);
    end.setMonth(end.getMonth() + ProjectsPageComponent.TIMELINE_MONTHS);
    const days: { date: Date; dayOfMonth: number; isWeekend: boolean; isToday: boolean }[] = [];
    const todayStr = this.timelineToday.toDateString();
    const d = new Date(start);
    while (d < end) {
      const dow = d.getDay();
      days.push({
        date: new Date(d),
        dayOfMonth: d.getDate(),
        isWeekend: dow === 0 || dow === 6,
        isToday: d.toDateString() === todayStr,
      });
      d.setDate(d.getDate() + 1);
    }
    return days;
  });

  readonly timelineMonths = computed<{ label: string; span: number }[]>(() => {
    const days = this.timelineDays();
    if (!days.length) return [];
    const months: { label: string; span: number }[] = [];
    let current = '';
    let count = 0;
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
    for (const d of days) {
      const label = fmt.format(d.date);
      if (label !== current) {
        if (current) months.push({ label: current, span: count });
        current = label;
        count = 1;
      } else {
        count++;
      }
    }
    if (current) months.push({ label: current, span: count });
    return months;
  });

  readonly timelineTotalWidth = computed(() => this.timelineDays().length * ProjectsPageComponent.DAY_PX);

  readonly todayOffset = computed(() => {
    const start = this.timelineStartDate();
    const diff = Math.floor((this.timelineToday.getTime() - start.getTime()) / 86400000);
    return diff * ProjectsPageComponent.DAY_PX;
  });

  eventLeft(event: ProjectCalendarEvent): number {
    const start = this.timelineStartDate();
    const diff = Math.floor((event.startDate.getTime() - start.getTime()) / 86400000);
    return diff * ProjectsPageComponent.DAY_PX;
  }

  eventWidth(event: ProjectCalendarEvent): number {
    const days = Math.floor((event.endDate.getTime() - event.startDate.getTime()) / 86400000) + 1;
    return Math.max(days * ProjectsPageComponent.DAY_PX - 2, 6);
  }

  formatEventDates(event: ProjectCalendarEvent): string {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    if (event.startDate.getTime() === event.endDate.getTime()) return fmt.format(event.startDate);
    return `${fmt.format(event.startDate)} - ${fmt.format(event.endDate)}`;
  }

  scrollTimelineToToday(): void {
    const el = document.querySelector('.timeline-scroll-container');
    if (el) {
      const offset = this.todayOffset() - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, offset);
    }
  }

  shiftTimeline(months: number): void {
    this.timelineStartDate.update(d => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + months);
      return next;
    });
  }

  // ─── Timeline row height (distributes available space) ─────────────
  private static readonly TL_CHROME_PX = 121;
  private static readonly TL_CANVAS_CHROME_PX = 81;
  private static readonly TL_ROW_MIN = 34;

  readonly timelineRowHeight = computed(() => {
    const count = this.store.projects().length || 1;
    const available = this.timelineHeight() - ProjectsPageComponent.TL_CHROME_PX;
    return Math.max(ProjectsPageComponent.TL_ROW_MIN, Math.floor(available / count));
  });

  readonly canvasTimelineRowHeight = computed(() => {
    const count = this.store.projects().length || 1;
    const h = this.widgetHeights()['projsTimeline'] ?? 400;
    const available = h - ProjectsPageComponent.TL_CANVAS_CHROME_PX;
    return Math.max(ProjectsPageComponent.TL_ROW_MIN, Math.floor(available / count));
  });

  // ─── Timeline vertical resize ──────────────────────────────────────
  private static readonly TL_MIN_H = 200;

  readonly timelineHeight = signal<number>(
    (typeof sessionStorage !== 'undefined' && parseInt(sessionStorage.getItem('projects-timeline-height') ?? '', 10)) || 400,
  );
  readonly timelineResizing = signal(false);
  private _tlResizeStartY = 0;
  private _tlResizeStartH = 0;

  startTimelineResize(event: MouseEvent): void {
    event.preventDefault();
    this._tlResizeStartY = event.clientY;
    this._tlResizeStartH = this.timelineHeight();
    this.timelineResizing.set(true);
  }

  startTimelineResizeTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    if (!touch) return;
    event.preventDefault();
    this._tlResizeStartY = touch.clientY;
    this._tlResizeStartH = this.timelineHeight();
    this.timelineResizing.set(true);
  }

  override onDocumentMouseMove(event: MouseEvent): void {
    if (this.timelineResizing()) {
      const dy = event.clientY - this._tlResizeStartY;
      const h = Math.max(ProjectsPageComponent.TL_MIN_H, this._tlResizeStartH + dy);
      this.timelineHeight.set(h);
      return;
    }
    super.onDocumentMouseMove(event);
  }

  override onDocumentMouseUp(): void {
    if (this.timelineResizing()) {
      this.timelineResizing.set(false);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('projects-timeline-height', String(this.timelineHeight()));
      }
      return;
    }
    super.onDocumentMouseUp();
  }

  onDocumentTouchMove(event: TouchEvent): void {
    if (this.timelineResizing()) {
      const touch = event.touches[0];
      if (!touch) return;
      const dy = touch.clientY - this._tlResizeStartY;
      const h = Math.max(ProjectsPageComponent.TL_MIN_H, this._tlResizeStartH + dy);
      this.timelineHeight.set(h);
      return;
    }
  }

  override onDocumentTouchEnd(): void {
    if (this.timelineResizing()) {
      this.timelineResizing.set(false);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('projects-timeline-height', String(this.timelineHeight()));
      }
      return;
    }
    super.onDocumentTouchEnd();
  }

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

  private _narrowMq: MediaQueryList | null = null;
  private _compactMq: MediaQueryList | null = null;
  private _narrowMqHandler = (e: MediaQueryListEvent) => this.isNarrowMobile.set(e.matches);
  private _compactMqHandler = (e: MediaQueryListEvent) => this.isCompactMobile.set(e.matches);

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    if (typeof window !== 'undefined') {
      this._narrowMq = window.matchMedia('(max-width: 400px)');
      this.isNarrowMobile.set(this._narrowMq.matches);
      this._narrowMq.addEventListener('change', this._narrowMqHandler);
      this.destroyRef.onDestroy(() => this._narrowMq?.removeEventListener('change', this._narrowMqHandler));

      this._compactMq = window.matchMedia('(max-width: 560px)');
      this.isCompactMobile.set(this._compactMq.matches);
      this._compactMq.addEventListener('change', this._compactMqHandler);
      this.destroyRef.onDestroy(() => this._compactMq?.removeEventListener('change', this._compactMqHandler));
    }
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.createMenuOpen() && !target.closest('[data-create-dropdown]')) {
      this.createMenuOpen.set(false);
      this.createSearchQuery.set('');
    }
  }

  onEscapeKey(): void {
    if (this.createMenuOpen()) {
      this.createMenuOpen.set(false);
      this.createSearchQuery.set('');
    }
  }

  toggleCreateMenu(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    const opening = !this.createMenuOpen();
    this.createMenuOpen.set(opening);
    if (!opening) this.createSearchQuery.set('');
  }

  onCreateSearchInput(event: Event): void {
    const value = (event as CustomEvent)?.detail?.target?.value ?? (event?.target as HTMLInputElement)?.value ?? '';
    this.createSearchQuery.set(value);
  }

  selectCreateItem(item: NavItem): void {
    this.createMenuOpen.set(false);
    this.createSearchQuery.set('');
  }
}
