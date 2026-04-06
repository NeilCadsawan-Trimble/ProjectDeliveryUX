import {
  parseAmount,
  fmtRemaining,
  rewriteDynamicNeeds,
  sortProjectsByUrgency,
  STATUS_SEVERITY,
  type AgentProjectData,
} from './projects-page-utils';
import type { Project, UrgentNeedItem, ChangeOrder } from '../../data/dashboard-data.types';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    slug: 'test-project',
    name: 'Test Project',
    client: 'Test Corp',
    ownerInitials: 'TC',
    owner: 'Test Owner',
    status: 'On Track',
    dueDate: 'Jun 15, 2026',
    progress: 45,
    budgetPct: 60,
    budgetUsed: '$120K',
    budgetTotal: '$300K',
    latestDrawingName: 'Drawing A',
    latestDrawingVersion: 'v2',
    city: 'Portland',
    state: 'OR',
    ...overrides,
  };
}

function makeNeed(overrides: Partial<UrgentNeedItem> = {}): UrgentNeedItem {
  return {
    id: 'test-need',
    projectId: 1,
    projectName: 'Test Project',
    projectSlug: 'test-project',
    title: 'Test need',
    subtitle: 'Test subtitle',
    severity: 'warning',
    category: 'schedule',
    route: '/project/test-project',
    queryParams: { page: 'dashboard' },
    ...overrides,
  };
}

function makeCO(overrides: Partial<ChangeOrder> = {}): ChangeOrder {
  return {
    id: 'CO-008',
    project: 'Test Project',
    projectId: 1,
    coType: 'prime',
    description: 'Fire suppression upgrade',
    amount: 31000,
    status: 'pending',
    requestedBy: 'Owner',
    requestDate: '2026-03-01',
    reason: 'Code compliance',
    ...overrides,
  };
}

describe('parseAmount', () => {
  it('parses "$300K" to 300000', () => {
    expect(parseAmount('$300K')).toBe(300000);
  });

  it('parses "$1.2M" to 1200000', () => {
    expect(parseAmount('$1.2M')).toBe(1200000);
  });

  it('parses "$120K" to 120000', () => {
    expect(parseAmount('$120K')).toBe(120000);
  });

  it('parses "$54K" to 54000', () => {
    expect(parseAmount('$54K')).toBe(54000);
  });

  it('parses lowercase "$300k" to 300000', () => {
    expect(parseAmount('$300k')).toBe(300000);
  });

  it('parses lowercase "$1.5m" to 1500000', () => {
    expect(parseAmount('$1.5m')).toBe(1500000);
  });

  it('parses plain number "500000" to 500000', () => {
    expect(parseAmount('500000')).toBe(500000);
  });

  it('returns 0 for empty string', () => {
    expect(parseAmount('')).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(parseAmount('abc')).toBe(0);
  });
});

describe('fmtRemaining', () => {
  it('formats remaining as $XK when in thousands range', () => {
    expect(fmtRemaining('$120K', '$300K')).toBe('$180K');
  });

  it('formats remaining as $X.YM when in millions range', () => {
    expect(fmtRemaining('$300K', '$1.5M')).toBe('$1.2M');
  });

  it('returns "$0" when used equals total', () => {
    expect(fmtRemaining('$300K', '$300K')).toBe('$0');
  });

  it('returns "$0" when used exceeds total', () => {
    expect(fmtRemaining('$400K', '$300K')).toBe('$0');
  });

  it('formats small remaining amounts', () => {
    const result = fmtRemaining('$295K', '$300K');
    expect(result).toBe('$5K');
  });
});

describe('rewriteDynamicNeeds – budget category', () => {
  const budgetNeed = makeNeed({
    id: 'pa-3',
    category: 'budget',
    title: 'Budget at 82%',
    subtitle: 'Only $54K remaining with 55% of work left',
    severity: 'critical',
  });

  it('rewrites title to reflect current budgetPct', () => {
    const project = makeProject({ budgetPct: 60, budgetUsed: '$120K', budgetTotal: '$300K', progress: 45 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.title).toBe('Budget at 60%');
  });

  it('shows "Budget critical" when budgetPct >= 95', () => {
    const project = makeProject({ budgetPct: 95 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.title).toBe('Budget critical at 95%');
    expect(result.severity).toBe('critical');
  });

  it('sets severity to warning when budgetPct is 75-94', () => {
    const project = makeProject({ budgetPct: 90 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.severity).toBe('warning');
    expect(result.title).toBe('Budget at 90%');
  });

  it('sets severity to info when budgetPct < 75', () => {
    const project = makeProject({ budgetPct: 50 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.severity).toBe('info');
  });

  it('dynamically computes remaining dollars in subtitle', () => {
    const project = makeProject({ budgetPct: 70, budgetUsed: '$210K', budgetTotal: '$300K', progress: 60 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.subtitle).toBe('$90K remaining with 40% of work left');
  });

  it('reflects progress in subtitle work-left calculation', () => {
    const project = makeProject({ budgetPct: 80, budgetUsed: '$240K', budgetTotal: '$300K', progress: 80 });
    const [result] = rewriteDynamicNeeds([budgetNeed], project, []);
    expect(result.subtitle).toContain('20% of work left');
  });

  it('updates when budget values change from 82% to 60%', () => {
    const before = rewriteDynamicNeeds([budgetNeed], makeProject({ budgetPct: 82, budgetUsed: '$246K', budgetTotal: '$300K', progress: 45 }), []);
    expect(before[0].title).toBe('Budget at 82%');

    const after = rewriteDynamicNeeds([budgetNeed], makeProject({ budgetPct: 60, budgetUsed: '$180K', budgetTotal: '$300K', progress: 45 }), []);
    expect(after[0].title).toBe('Budget at 60%');
    expect(after[0].severity).toBe('info');
  });
});

describe('rewriteDynamicNeeds – schedule overdue category', () => {
  const scheduleNeed = makeNeed({
    id: 'pa-8',
    category: 'schedule',
    title: 'Project 21 days overdue',
    subtitle: 'Was due Feb 20 -- schedule recovery plan under review',
    severity: 'critical',
  });

  it('computes days late from current dueDate for overdue projects', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'Overdue', dueDate: 'Mar 24, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.title).toBe('Project 10 days overdue');
  });

  it('updates when dueDate changes', () => {
    const now = new Date('2026-04-03');
    const before = rewriteDynamicNeeds([scheduleNeed], makeProject({ status: 'Overdue', dueDate: 'Mar 24, 2026' }), [], now);
    expect(before[0].title).toBe('Project 10 days overdue');

    const after = rewriteDynamicNeeds([scheduleNeed], makeProject({ status: 'Overdue', dueDate: 'Mar 29, 2026' }), [], now);
    expect(after[0].title).toBe('Project 5 days overdue');
  });

  it('includes current dueDate in subtitle', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'Overdue', dueDate: 'Mar 15, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.subtitle).toBe('Was due Mar 15, 2026 -- schedule recovery plan under review');
  });

  it('downgrades overdue schedule need when project status is On Track', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'On Track', dueDate: 'Mar 15, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.severity).toBe('info');
    expect(result.title).toContain('Due date passed');
  });

  it('downgrades overdue need when status is Overdue but due date moved to future', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'Overdue', dueDate: 'May 15, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.severity).toBe('info');
    expect(result.title).toBe('Due May 15, 2026');
  });

  it('downgrades overdue need when status is On Track and due date is future', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'On Track', dueDate: 'May 15, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.severity).toBe('info');
    expect(result.title).toBe('Due May 15, 2026');
    expect(result.subtitle).toContain('was previously at risk');
  });

  it('does not rewrite schedule need without overdue/late in title', () => {
    const now = new Date('2026-04-03');
    const safeScheduleNeed = makeNeed({
      category: 'schedule',
      title: 'Cutover window approaching',
      subtitle: 'Production migration Wave 2 starts in 3 days',
    });
    const project = makeProject({ status: 'Overdue', dueDate: 'Mar 15, 2026' });
    const [result] = rewriteDynamicNeeds([safeScheduleNeed], project, [], now);
    expect(result.title).toBe('Cutover window approaching');
  });

  it('always sets severity to critical for overdue rewrite', () => {
    const now = new Date('2026-04-03');
    const project = makeProject({ status: 'Overdue', dueDate: 'Mar 30, 2026' });
    const [result] = rewriteDynamicNeeds([scheduleNeed], project, [], now);
    expect(result.severity).toBe('critical');
  });
});

describe('rewriteDynamicNeeds – change-order category', () => {
  const coNeed = makeNeed({
    id: 'pa-13',
    category: 'change-order',
    title: 'CO-008 awaiting approval',
    subtitle: 'Fire suppression upgrade -- $31K impact to budget',
    severity: 'warning',
  });

  it('updates subtitle with current CO amount', () => {
    const co = makeCO({ amount: 31000 });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.subtitle).toContain('$31K impact to budget');
  });

  it('reflects changed CO amount', () => {
    const co = makeCO({ amount: 50000 });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.subtitle).toContain('$50K impact to budget');
  });

  it('formats million-dollar CO amounts', () => {
    const co = makeCO({ amount: 1_200_000 });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.subtitle).toContain('$1.2M impact to budget');
  });

  it('shows "awaiting approval" for pending CO', () => {
    const co = makeCO({ status: 'pending' });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.title).toBe('CO-008 awaiting approval');
    expect(result.severity).toBe('warning');
  });

  it('shows status name and info severity for approved CO', () => {
    const co = makeCO({ status: 'approved' });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.title).toBe('CO-008 approved');
    expect(result.severity).toBe('info');
  });

  it('includes CO description in subtitle', () => {
    const co = makeCO({ description: 'HVAC ductwork extension', amount: 45000 });
    const project = makeProject();
    const [result] = rewriteDynamicNeeds([coNeed], project, [co]);
    expect(result.subtitle).toBe('HVAC ductwork extension -- $45K impact to budget');
  });

  it('passes through CO need unchanged when CO not found in list', () => {
    const project = makeProject();
    const otherCO = makeCO({ id: 'CO-999' });
    const [result] = rewriteDynamicNeeds([coNeed], project, [otherCO]);
    expect(result.title).toBe('CO-008 awaiting approval');
    expect(result.subtitle).toBe('Fire suppression upgrade -- $31K impact to budget');
  });
});

describe('rewriteDynamicNeeds – non-actionable categories pass through', () => {
  const categories = ['rfi', 'submittal', 'safety', 'quality', 'inspection'] as const;
  const project = makeProject();

  for (const cat of categories) {
    it(`passes through ${cat} category unchanged`, () => {
      const need = makeNeed({ category: cat, title: `${cat} title`, subtitle: `${cat} subtitle` });
      const [result] = rewriteDynamicNeeds([need], project, []);
      expect(result.title).toBe(`${cat} title`);
      expect(result.subtitle).toBe(`${cat} subtitle`);
      expect(result.severity).toBe(need.severity);
    });
  }
});

describe('rewriteDynamicNeeds – aggregation counts change with severity', () => {
  const budgetNeed = makeNeed({ category: 'budget', title: 'Budget at 80%', severity: 'warning' });
  const rfiNeed = makeNeed({ id: 'rfi-1', category: 'rfi', title: 'RFI overdue', severity: 'critical' });

  it('budget going from 80% (warning) to 95% (critical) increases critical count', () => {
    const warningResult = rewriteDynamicNeeds([budgetNeed, rfiNeed], makeProject({ budgetPct: 80 }), []);
    const criticalsBefore = warningResult.filter(n => n.severity === 'critical').length;
    const warningsBefore = warningResult.filter(n => n.severity === 'warning').length;

    const criticalResult = rewriteDynamicNeeds([budgetNeed, rfiNeed], makeProject({ budgetPct: 95 }), []);
    const criticalsAfter = criticalResult.filter(n => n.severity === 'critical').length;
    const warningsAfter = criticalResult.filter(n => n.severity === 'warning').length;

    expect(criticalsAfter).toBeGreaterThan(criticalsBefore);
    expect(warningsAfter).toBeLessThan(warningsBefore);
  });

  it('budget dropping below 75% converts warning to info', () => {
    const warningResult = rewriteDynamicNeeds([budgetNeed], makeProject({ budgetPct: 80 }), []);
    expect(warningResult[0].severity).toBe('warning');

    const infoResult = rewriteDynamicNeeds([budgetNeed], makeProject({ budgetPct: 50 }), []);
    expect(infoResult[0].severity).toBe('info');
  });
});

describe('sortProjectsByUrgency', () => {
  function makeAgentData(overrides: Partial<AgentProjectData> = {}): AgentProjectData {
    return {
      urgentNeeds: [],
      criticalCount: 0,
      warningCount: 0,
      coreWarningCount: overrides.coreWarningCount ?? overrides.warningCount ?? 0,
      topNeed: null,
      budgetAlert: false,
      jobCostSpend: null,
      ...overrides,
    };
  }

  it('sorts project with more critical needs first', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'At Risk', budgetPct: 60 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 2, warningCount: 1 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    expect(projects[sorted[0]].id).toBe(2);
    expect(projects[sorted[1]].id).toBe(1);
  });

  it('increasing criticalCount causes project to move up in sort order', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'At Risk', budgetPct: 60 }),
    ];

    const before = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 2, warningCount: 1 })],
    ]);
    const sortedBefore = sortProjectsByUrgency(projects, before);
    expect(projects[sortedBefore[0]].id).toBe(2);

    const after = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 3, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 2, warningCount: 1 })],
    ]);
    const sortedAfter = sortProjectsByUrgency(projects, after);
    expect(projects[sortedAfter[0]].id).toBe(1);
  });

  it('breaks ties on criticalCount by warningCount', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 50 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 1, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 1, warningCount: 3 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    expect(projects[sorted[0]].id).toBe(2);
  });

  it('breaks ties on warningCount by status severity', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'Overdue', budgetPct: 50 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 0, warningCount: 0 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    expect(projects[sorted[0]].id).toBe(2);
  });

  it('breaks ties on status by budgetPct (higher = more urgent)', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 30 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 85 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 0, warningCount: 0 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    expect(projects[sorted[0]].id).toBe(2);
  });

  it('status change from On Track to Overdue moves project up', () => {
    const projectsA = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'At Risk', budgetPct: 60 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData()],
      [2, makeAgentData()],
    ]);

    const sortedBefore = sortProjectsByUrgency(projectsA, agentData);
    expect(projectsA[sortedBefore[0]].id).toBe(2);

    const projectsB = [
      makeProject({ id: 1, status: 'Overdue', budgetPct: 50 }),
      makeProject({ id: 2, status: 'At Risk', budgetPct: 60 }),
    ];
    const sortedAfter = sortProjectsByUrgency(projectsB, agentData);
    expect(projectsB[sortedAfter[0]].id).toBe(1);
  });

  it('sorts 4 projects in correct urgency order', () => {
    const projects = [
      makeProject({ id: 1, status: 'Planning', budgetPct: 10 }),
      makeProject({ id: 2, status: 'Overdue', budgetPct: 92 }),
      makeProject({ id: 3, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 4, status: 'At Risk', budgetPct: 75 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0, warningCount: 0 })],
      [2, makeAgentData({ criticalCount: 3, warningCount: 1 })],
      [3, makeAgentData({ criticalCount: 0, warningCount: 1 })],
      [4, makeAgentData({ criticalCount: 1, warningCount: 2 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    const ids = sorted.map(i => projects[i].id);
    expect(ids).toEqual([2, 4, 3, 1]);
  });

  it('handles missing agent data gracefully', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'Overdue', budgetPct: 80 }),
    ];
    const agentData = new Map<number, AgentProjectData>();

    const sorted = sortProjectsByUrgency(projects, agentData);
    expect(projects[sorted[0]].id).toBe(2);
  });

  it('proj1 gets the highest-urgency project, last tile gets the lowest', () => {
    const TILE_IDS = ['proj1', 'proj2', 'proj3'];
    const projects = [
      makeProject({ id: 1, status: 'Planning', budgetPct: 10 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 3, status: 'Overdue', budgetPct: 95 }),
    ];
    const agentData = new Map<number, AgentProjectData>([
      [1, makeAgentData({ criticalCount: 0 })],
      [2, makeAgentData({ criticalCount: 1 })],
      [3, makeAgentData({ criticalCount: 3 })],
    ]);

    const sorted = sortProjectsByUrgency(projects, agentData);
    const tileMap: Record<string, number> = {};
    for (let i = 0; i < TILE_IDS.length && i < sorted.length; i++) {
      tileMap[TILE_IDS[i]] = sorted[i];
    }
    expect(projects[tileMap['proj1']].id).toBe(3);
    expect(projects[tileMap['proj3']].id).toBe(1);
  });
});

describe('STATUS_SEVERITY', () => {
  it('Overdue has the highest severity', () => {
    expect(STATUS_SEVERITY['Overdue']).toBeGreaterThan(STATUS_SEVERITY['At Risk']);
    expect(STATUS_SEVERITY['At Risk']).toBeGreaterThan(STATUS_SEVERITY['On Track']);
    expect(STATUS_SEVERITY['On Track']).toBeGreaterThan(STATUS_SEVERITY['Planning']);
  });
});

describe('end-to-end: budget mutation changes tile position', () => {
  function buildAgentMap(
    projs: Project[],
    needsMap: Record<number, UrgentNeedItem[]>,
    cos: ChangeOrder[] = [],
    now?: Date,
  ): Map<number, AgentProjectData> {
    const map = new Map<number, AgentProjectData>();
    for (const p of projs) {
      const raw = needsMap[p.id] ?? [];
      const rewritten = rewriteDynamicNeeds(raw, p, cos, now);
      const critical = rewritten.filter(n => n.severity === 'critical');
      const warning = rewritten.filter(n => n.severity === 'warning');
      const coreWarning = warning.filter(n => n.category !== 'change-order');
      map.set(p.id, {
        urgentNeeds: rewritten,
        criticalCount: critical.length,
        warningCount: warning.length,
        coreWarningCount: coreWarning.length,
        topNeed: critical[0] ?? warning[0] ?? rewritten[0] ?? null,
        budgetAlert: rewritten.some(n => n.category === 'budget'),
        jobCostSpend: null,
      });
    }
    return map;
  }

  it('project moves up when budget becomes critical (gains critical need)', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 30 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 3, status: 'On Track', budgetPct: 40 }),
    ];
    const needsMap: Record<number, UrgentNeedItem[]> = {
      1: [makeNeed({ id: 'b1', projectId: 1, category: 'budget', title: 'Budget at 30%' })],
      2: [],
      3: [],
    };

    const agentBefore = buildAgentMap(projects, needsMap);
    const sortedBefore = sortProjectsByUrgency(projects, agentBefore);
    const posOfProject1Before = sortedBefore.indexOf(0);
    expect(agentBefore.get(1)!.criticalCount).toBe(0);

    const mutated = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 96, budgetUsed: '$480K', budgetTotal: '$500K' }),
      projects[1],
      projects[2],
    ];
    const agentAfter = buildAgentMap(mutated, needsMap);
    const sortedAfter = sortProjectsByUrgency(mutated, agentAfter);
    const posOfProject1After = sortedAfter.indexOf(0);

    expect(agentAfter.get(1)!.criticalCount).toBe(1);
    expect(posOfProject1After).toBeLessThan(posOfProject1Before);
    expect(posOfProject1After).toBe(0);

    const rewrittenBudget = agentAfter.get(1)!.urgentNeeds.find(n => n.category === 'budget')!;
    expect(rewrittenBudget.title).toBe('Budget critical at 96%');
    expect(rewrittenBudget.severity).toBe('critical');
  });

  it('project moves down when budget improves (loses critical need)', () => {
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 95 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 60 }),
    ];
    const needsMap: Record<number, UrgentNeedItem[]> = {
      1: [makeNeed({ id: 'b1', projectId: 1, category: 'budget', title: 'Budget critical at 95%' })],
      2: [],
    };

    const agentBefore = buildAgentMap(projects, needsMap);
    expect(agentBefore.get(1)!.criticalCount).toBe(1);
    const sortedBefore = sortProjectsByUrgency(projects, agentBefore);
    expect(sortedBefore[0]).toBe(0);

    const mutated = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50, budgetUsed: '$150K', budgetTotal: '$300K' }),
      projects[1],
    ];
    const agentAfter = buildAgentMap(mutated, needsMap);
    expect(agentAfter.get(1)!.criticalCount).toBe(0);
    const sortedAfter = sortProjectsByUrgency(mutated, agentAfter);
    expect(sortedAfter[0]).toBe(1);
  });

  it('project moves down when due date extended to future (loses critical schedule need)', () => {
    const now = new Date('2026-04-03');
    const projects = [
      makeProject({ id: 1, status: 'Overdue', dueDate: 'Mar 15, 2026', budgetPct: 50 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 60 }),
    ];
    const needsMap: Record<number, UrgentNeedItem[]> = {
      1: [makeNeed({ id: 'sched', projectId: 1, category: 'schedule', title: 'Project overdue', severity: 'critical' })],
      2: [],
    };

    const agentBefore = buildAgentMap(projects, needsMap, [], now);
    expect(agentBefore.get(1)!.criticalCount).toBe(1);
    const sortedBefore = sortProjectsByUrgency(projects, agentBefore);
    expect(sortedBefore[0]).toBe(0);

    const mutated = [
      makeProject({ id: 1, status: 'On Track', dueDate: 'Jun 15, 2026', budgetPct: 50 }),
      projects[1],
    ];
    const agentAfter = buildAgentMap(mutated, needsMap, [], now);
    expect(agentAfter.get(1)!.criticalCount).toBe(0);
    const sortedAfter = sortProjectsByUrgency(mutated, agentAfter);
    expect(sortedAfter[0]).toBe(1);
  });

  it('CO warnings do not affect tile ordering (sort uses coreWarningCount)', () => {
    const coNeed = makeNeed({ id: 'co1', projectId: 1, category: 'change-order', title: 'CO-008 pending', severity: 'warning' });
    const projects = [
      makeProject({ id: 1, status: 'On Track', budgetPct: 50 }),
      makeProject({ id: 2, status: 'On Track', budgetPct: 55 }),
    ];
    const needsMap: Record<number, UrgentNeedItem[]> = {
      1: [coNeed],
      2: [],
    };
    const coPending = [makeCO({ status: 'pending' })];

    const agentBefore = buildAgentMap(projects, needsMap, coPending);
    expect(agentBefore.get(1)!.warningCount).toBe(1);
    expect(agentBefore.get(1)!.coreWarningCount).toBe(0);
    const sortedBefore = sortProjectsByUrgency(projects, agentBefore);
    expect(sortedBefore[0]).toBe(1);

    const coApproved = [makeCO({ status: 'approved' })];
    const agentAfter = buildAgentMap(projects, needsMap, coApproved);
    expect(agentAfter.get(1)!.warningCount).toBe(0);
    const sortedAfter = sortProjectsByUrgency(projects, agentAfter);
    expect(sortedAfter[0]).toBe(1);
  });
});
