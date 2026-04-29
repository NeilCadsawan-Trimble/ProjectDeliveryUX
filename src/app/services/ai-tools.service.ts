import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataStoreService } from '../data/data-store.service';
import { PersonaService } from './persona.service';
import { ALL_DRAWINGS_BY_PROJECT, SITE_CAPTURES_BY_PROJECT, type DrawingTile, type SiteCapture } from '../data/drawings-data';
import type { DetailView } from '../shell/services/canvas-detail-manager';
import type {
  ProjectStatus,
  Rfi, RfiStatus,
  Submittal, SubmittalStatus,
  ChangeOrder, ChangeOrderStatus,
  Estimate, EstimateStatus,
  Invoice, InvoiceStatus,
  Payable, PayableStatus,
  PurchaseOrder, PurchaseOrderStatus,
  Contract, ContractStatus,
  Inspection, InspectionResult,
  PunchListItem,
  DailyReport,
  BillingEventStatus,
} from '../data/dashboard-data.types';

export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: Record<string, unknown>) => { success: boolean; message: string };
  /**
   * If true, the panel controller runs the tool immediately when the model emits
   * a tool_call instead of attaching a Confirm/Cancel pendingAction. Defaults to
   * false (mutation tools keep the Confirm gate).
   */
  autoExecute?: boolean;
}

type ToolResult = { success: boolean; message: string };

/**
 * Result of resolving a `navigate_to_page` call without executing it. The panel
 * controller uses this when on Home + canvas to offer the user a choice between
 * full navigation and a freestanding canvas overlay.
 */
export type NavigationResolution =
  | { kind: 'route'; url: string; label: string }
  | { kind: 'detail'; url: string; label: string; detailView: DetailView }
  | { kind: 'error'; message: string };

/** Destinations whose entity loads as a `DetailView` for canvas overlay use. */
export const SUPPORTED_RECORD_DETAIL_DESTINATIONS = [
  'record-rfi',
  'record-submittal',
  'record-daily-report',
  'record-inspection',
  'record-punch-item',
  'record-drawing',
  'record-panorama',
  'financials-change-orders',
  'financials-contracts',
] as const;

export type SupportedRecordDetailDestination = (typeof SUPPORTED_RECORD_DETAIL_DESTINATIONS)[number];

export function isSupportedRecordDetail(destination: string): destination is SupportedRecordDetailDestination {
  return (SUPPORTED_RECORD_DETAIL_DESTINATIONS as readonly string[]).includes(destination);
}

const RECORDS_SUBPAGE_VALUES = [
  'rfis', 'submittals', 'inspections', 'daily-reports', 'punch-items', 'issues',
  'action-items', 'field-work-directives', 'meeting-minutes', 'notices-to-comply',
  'safety-notices', 'transmittals', 'check-list', 'drawing-sets',
  'specification-sets', 'submittal-packages',
] as const;

const FINANCIALS_SUBPAGE_VALUES = [
  'budget', 'purchase-orders', 'contracts', 'billings', 'cost-forecasts',
  'change-order-requests', 'prime-contract-change-orders', 'subcontract-change-orders',
  'potential-change-orders', 'contract-invoices', 'general-invoices',
] as const;

const PROJECT_SECTION_DESTINATIONS = [
  'project-dashboard', 'project-schedule', 'project-records', 'project-drawings',
  'project-field-captures', 'project-models', 'project-financials', 'project-files',
] as const;

const FINANCIALS_DETAIL_DESTINATIONS = [
  'financials-job-costs', 'financials-change-orders', 'financials-estimates',
  'financials-invoices', 'financials-payables', 'financials-purchase-orders',
  'financials-contracts', 'financials-billing', 'financials-payroll',
  'financials-payroll-monthly', 'financials-subcontract-ledger',
  'financials-gl-entries', 'financials-gl-accounts', 'financials-cash-flow',
] as const;

const RECORD_DETAIL_DESTINATIONS = [
  'record-rfi', 'record-submittal', 'record-daily-report', 'record-inspection',
  'record-punch-item', 'record-drawing', 'record-panorama',
] as const;

export const NAVIGATION_DESTINATIONS = [
  'home', 'projects', 'financials',
  ...FINANCIALS_DETAIL_DESTINATIONS,
  ...PROJECT_SECTION_DESTINATIONS,
  ...RECORD_DETAIL_DESTINATIONS,
] as const;

export type NavigationDestination = (typeof NAVIGATION_DESTINATIONS)[number];

/** Maps a financials-detail destination to its child path under `/financials`. */
const FINANCIALS_DETAIL_PATH: Record<string, string> = {
  'financials-job-costs': 'job-costs',
  'financials-change-orders': 'change-orders',
  'financials-estimates': 'estimates',
  'financials-invoices': 'invoices',
  'financials-payables': 'payables',
  'financials-purchase-orders': 'purchase-orders',
  'financials-contracts': 'contracts',
  'financials-billing': 'billing',
  'financials-payroll': 'payroll',
  'financials-payroll-monthly': 'payroll-monthly',
  'financials-subcontract-ledger': 'subcontract-ledger',
  'financials-gl-entries': 'gl-entries',
  'financials-gl-accounts': 'gl-accounts',
  'financials-cash-flow': 'cash-flow',
};

/** Maps a project-section destination to its `?page=...` query value (or '' for the default tab). */
const PROJECT_SECTION_PAGE: Record<string, string> = {
  'project-dashboard': '',
  'project-schedule': 'schedule',
  'project-records': 'records',
  'project-drawings': 'drawings',
  'project-field-captures': 'field-captures',
  'project-models': 'models',
  'project-financials': 'financials',
  'project-files': 'files',
};

/** Maps a record-* destination to the `?view=...` query value the project dashboard expects. */
const RECORD_VIEW_TYPE: Record<string, string> = {
  'record-rfi': 'rfi',
  'record-submittal': 'submittal',
  'record-daily-report': 'dailyReport',
  'record-inspection': 'inspection',
  'record-punch-item': 'punchItem',
  'record-drawing': 'drawing',
  'record-panorama': 'panorama',
};

const RECORD_DESTINATION_LABEL: Record<string, string> = {
  'record-rfi': 'RFI',
  'record-submittal': 'Submittal',
  'record-daily-report': 'Daily Report',
  'record-inspection': 'Inspection',
  'record-punch-item': 'Punch Item',
  'record-drawing': 'Drawing',
  'record-panorama': 'Panorama',
};

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function parseAmount(s: string): number {
  const clean = s.replace(/[^0-9.KMkm]/g, '');
  if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean);
}

interface EntityStatusToolConfig<S extends string, E extends { id: string }> {
  toolName: string;
  description: string;
  idParam: string;
  idParamDesc: string;
  validStatuses: readonly S[];
  statusField: keyof E & string;
  collection: () => E[];
  displayField: keyof E & string;
  update: (id: string, status: S) => void;
}

function createEntityStatusTool<S extends string, E extends { id: string }>(cfg: EntityStatusToolConfig<S, E>): AiToolDefinition {
  const statusKey = 'new' + cfg.statusField.charAt(0).toUpperCase() + cfg.statusField.slice(1);
  return {
    name: cfg.toolName,
    description: cfg.description,
    inputSchema: {
      type: 'object',
      properties: {
        [cfg.idParam]: { type: 'string', description: cfg.idParamDesc },
        [statusKey]: { type: 'string', enum: [...cfg.validStatuses], description: `New ${cfg.statusField}` },
      },
      required: [cfg.idParam, statusKey],
    },
    execute: (args) => {
      const id = args[cfg.idParam] as string;
      const newVal = args[statusKey] as S;
      const entity = cfg.collection().find(e => e.id === id);
      if (!entity) return { success: false, message: `${cfg.toolName.replace('update_', '').replace(/_/g, ' ')} ${id} not found` };
      const old = entity[cfg.statusField];
      cfg.update(id, newVal);
      const display = entity[cfg.displayField] ?? id;
      return { success: true, message: `${display} ${cfg.statusField} changed from "${old}" to "${newVal}"` };
    },
  };
}

interface EntityAmountToolConfig<E extends { id: string }> {
  toolName: string;
  description: string;
  idParam: string;
  idParamDesc: string;
  amountParam: string;
  amountField: keyof E & string;
  collection: () => E[];
  displayField: keyof E & string;
  update: (id: string, amount: number) => void;
  sideEffects?: (entity: E, delta: number) => void;
}

function createEntityAmountTool<E extends { id: string }>(cfg: EntityAmountToolConfig<E>): AiToolDefinition {
  return {
    name: cfg.toolName,
    description: cfg.description,
    inputSchema: {
      type: 'object',
      properties: {
        [cfg.idParam]: { type: 'string', description: cfg.idParamDesc },
        [cfg.amountParam]: { type: 'number', description: 'New amount in dollars' },
      },
      required: [cfg.idParam, cfg.amountParam],
    },
    execute: (args) => {
      const id = args[cfg.idParam] as string;
      const amount = args[cfg.amountParam] as number;
      const entity = cfg.collection().find(e => e.id === id);
      if (!entity) return { success: false, message: `${cfg.toolName.replace('update_', '').replace(/_/g, ' ')} ${id} not found` };
      const old = entity[cfg.amountField] as number;
      const delta = amount - old;
      cfg.update(id, amount);
      cfg.sideEffects?.(entity, delta);
      const display = entity[cfg.displayField] ?? id;
      return { success: true, message: `${display} ${cfg.amountField} changed from ${fmtCurrency(old)} to ${fmtCurrency(amount)}` };
    },
  };
}

@Injectable({ providedIn: 'root' })
export class AiToolsService {
  private readonly store = inject(DataStoreService);
  private readonly router = inject(Router);
  private readonly personaService = inject(PersonaService);
  private readonly tools: AiToolDefinition[];

  constructor() {
    this.tools = this.buildTools();
  }

  getToolSchemas(): object[] {
    return this.tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
    }));
  }

  execute(name: string, args: Record<string, unknown>): ToolResult {
    const tool = this.tools.find(t => t.name === name);
    if (!tool) return { success: false, message: `Unknown tool: ${name}` };
    try {
      return tool.execute(args);
    } catch (err) {
      return { success: false, message: `Error executing ${name}: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  /** Returns the registered tool definition (or undefined). */
  getTool(name: string): AiToolDefinition | undefined {
    return this.tools.find(t => t.name === name);
  }

  getToolNames(): string[] {
    return this.tools.map(t => t.name);
  }

  /**
   * Resolves a `navigate_to_page` call into either a route URL or a record DetailView,
   * without triggering the navigation. Used by the panel controller to offer a
   * navigate-vs-overlay choice on Home + canvas.
   */
  resolveNavigation(args: Record<string, unknown>): NavigationResolution {
    return this.resolveNavigationInternal(args);
  }

  private buildTools(): AiToolDefinition[] {
    return [
      this.navigateToPage(),
      this.updateProjectBudget(),
      this.updateProjectStatus(),
      this.updateProjectDueDate(),
      this.updateBudgetBreakdownItem(),
      ...this.entityStatusTools(),
      ...this.entityAmountTools(),
      this.updateMilestoneStatus(),
      this.updateTaskStatus(),
      this.updateRiskSeverity(),
      this.updateCashPosition(),
      this.updateBillingEvent(),
      this.updatePayrollRecord(),
    ];
  }

  // ── Navigation tool ──────────────────────────────────────────────

  private navigateToPage(): AiToolDefinition {
    return {
      name: 'navigate_to_page',
      description: [
        'Open any page or detail in the app. Use whenever the user asks to "go to", "open", "show me",',
        'or "take me to" something — top-level page (home, projects, financials), a specific project dashboard,',
        'a project section (schedule, records, drawings, financials, etc.), a global financials detail page',
        '(estimate, invoice, change order, contract, payable, PO, payroll record, GL entry, cash flow month,',
        'job-costs project, billing event, payroll-monthly, subcontract ledger, GL account), or a specific',
        'record inside a project (RFI, submittal, daily report, inspection, punch item, drawing, panorama).',
        'When the user names a specific entity (e.g. "the Eldorado estimate", "RFI 234", "CO-3", "invoice INV-001"),',
        'pass that entity id as resourceId — do NOT fall back to the generic listing page. Resolves the persona-scoped URL automatically.',
      ].join(' '),
      autoExecute: true,
      inputSchema: {
        type: 'object',
        properties: {
          destination: {
            type: 'string',
            enum: [...NAVIGATION_DESTINATIONS],
            description: 'Page or detail key to open. Pick the most specific destination — if the user names a specific estimate, use "financials-estimates" with resourceId, NOT the generic project listing.',
          },
          projectIdentifier: {
            type: 'string',
            description: 'Project slug (e.g. "tower-5") or numeric id ("3"). Required for any project-* destination. Optional disambiguator for record-* destinations.',
          },
          recordsSubpage: {
            type: 'string',
            enum: [...RECORDS_SUBPAGE_VALUES],
            description: 'Sub-page under project-records (e.g. rfis, submittals).',
          },
          financialsSubpage: {
            type: 'string',
            enum: [...FINANCIALS_SUBPAGE_VALUES],
            description: 'Sub-page under project-financials (e.g. budget, purchase-orders).',
          },
          subledger: {
            type: 'string',
            description: 'Optional budget category (labor, materials, equipment, subcontractors, overhead). Only honored for project-financials + budget.',
          },
          resourceId: {
            type: 'string',
            description: [
              'Resource id. REQUIRED for every financials-* detail destination and every record-* destination.',
              'Pass the entity id exactly as it appears in context — examples: "EST-2026-065" (estimate),',
              '"CO-3" (change order), "INV-001" (invoice), "PAY-001" (payable), "PO-2026-001" (purchase order),',
              '"CT-001" (contract), "BILL-001" (billing event), "PR-001" (payroll), "2026-04" (cash flow / payroll month),',
              '"GL-001" (GL entry), "1100" (GL account code), project slug or id (job costs),',
              '"RFI-001"/"rfi-1" (RFI), "SUB-001" (submittal), "dr-1" (daily report), etc.',
              'If the user names an entity but you only know its name (e.g. "the Eldorado estimate"),',
              'use the id from context if available; otherwise omit and the call will surface a clear error.',
            ].join(' '),
          },
        },
        required: ['destination'],
      },
      execute: (args) => {
        const resolved = this.resolveNavigationInternal(args);
        if (resolved.kind === 'error') return { success: false, message: resolved.message };
        void this.router.navigateByUrl(resolved.url);
        return { success: true, message: `Opening ${resolved.label}.` };
      },
    };
  }

  private resolveNavigationInternal(args: Record<string, unknown>): NavigationResolution {
    const destination = args['destination'] as string | undefined;
    if (!destination || !(NAVIGATION_DESTINATIONS as readonly string[]).includes(destination)) {
      return { kind: 'error', message: `Unknown destination: ${destination ?? '(missing)'}` };
    }

    const persona = this.personaService.activePersonaSlug();

    if (destination === 'home') {
      return { kind: 'route', url: `/${persona}`, label: 'Home' };
    }
    if (destination === 'projects') {
      return { kind: 'route', url: `/${persona}/projects`, label: 'Projects' };
    }
    if (destination === 'financials') {
      return { kind: 'route', url: `/${persona}/financials`, label: 'Financials' };
    }

    if (destination in FINANCIALS_DETAIL_PATH) {
      const child = FINANCIALS_DETAIL_PATH[destination];
      const resourceId = (args['resourceId'] as string | undefined)?.trim();
      if (!resourceId) {
        return { kind: 'error', message: `${destination} requires a resourceId.` };
      }
      const url = `/${persona}/financials/${child}/${encodeURIComponent(resourceId)}`;
      const label = this.financialsDetailLabel(destination, resourceId);

      if (destination === 'financials-change-orders') {
        const co = this.store.changeOrders().find(c => c.id === resourceId);
        if (co) return { kind: 'detail', url, label, detailView: { type: 'changeOrder', item: co } };
      }
      if (destination === 'financials-contracts') {
        const ct = this.store.contracts().find(c => c.id === resourceId);
        if (ct) return { kind: 'detail', url, label, detailView: { type: 'contract', item: ct } };
      }
      return { kind: 'route', url, label };
    }

    if (destination in PROJECT_SECTION_PAGE) {
      const projectIdentifier = args['projectIdentifier'] as string | undefined;
      const project = this.resolveProject(projectIdentifier);
      if (!project) {
        return {
          kind: 'error',
          message: projectIdentifier
            ? `Project "${projectIdentifier}" not found. Try a project slug (e.g. tower-5) or numeric id.`
            : `${destination} requires a projectIdentifier.`,
        };
      }
      const recordsSubpage = (args['recordsSubpage'] as string | undefined) ?? '';
      const financialsSubpage = (args['financialsSubpage'] as string | undefined) ?? '';
      const subledger = (args['subledger'] as string | undefined)?.trim().toLowerCase() ?? '';
      const url = this.buildProjectSectionUrl(persona, project.slug, destination, {
        recordsSubpage,
        financialsSubpage,
        subledger,
      });
      const label = this.projectSectionLabel(project.name, destination, { recordsSubpage, financialsSubpage });
      return { kind: 'route', url, label };
    }

    if (destination in RECORD_VIEW_TYPE) {
      const resourceId = (args['resourceId'] as string | undefined)?.trim();
      if (!resourceId) {
        return { kind: 'error', message: `${destination} requires a resourceId.` };
      }
      return this.resolveRecordDetail(persona, destination, resourceId, args['projectIdentifier'] as string | undefined);
    }

    return { kind: 'error', message: `Unhandled destination: ${destination}` };
  }

  private resolveProject(identifier: string | undefined) {
    if (!identifier) return undefined;
    const trimmed = identifier.trim();
    const bySlug = this.store.findProjectBySlug(trimmed);
    if (bySlug) return bySlug;
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      const byId = this.store.findProjectById(asNumber);
      if (byId) return byId;
    }
    const lower = trimmed.toLowerCase();
    return this.store.projects().find(p =>
      p.name.toLowerCase() === lower ||
      p.name.toLowerCase().includes(lower),
    );
  }

  private buildProjectSectionUrl(
    persona: string,
    slug: string,
    destination: string,
    extras: { recordsSubpage: string; financialsSubpage: string; subledger: string },
  ): string {
    const base = `/${persona}/project/${slug}`;
    const page = PROJECT_SECTION_PAGE[destination];
    if (!page) return base;

    const params = new URLSearchParams();
    params.set('page', page);
    if (page === 'records') {
      params.set('subpage', extras.recordsSubpage || 'daily-reports');
    } else if (page === 'financials') {
      const sub = extras.financialsSubpage || 'budget';
      params.set('subpage', sub);
      if (sub === 'budget' && extras.subledger) {
        params.set('subledger', extras.subledger);
      }
    }
    return `${base}?${params.toString()}`;
  }

  private resolveRecordDetail(
    persona: string,
    destination: string,
    resourceId: string,
    identifierHint: string | undefined,
  ): NavigationResolution {
    const viewType = RECORD_VIEW_TYPE[destination];
    const label = `${RECORD_DESTINATION_LABEL[destination]} ${resourceId}`;

    const buildUrl = (slug: string) =>
      `/${persona}/project/${slug}?view=${viewType}&id=${encodeURIComponent(resourceId)}`;

    switch (destination) {
      case 'record-rfi': {
        const rfi = this.store.rfis().find(r => r.id === resourceId || r.number === resourceId);
        if (!rfi) return { kind: 'error', message: `RFI ${resourceId} not found.` };
        const slug = this.findProjectSlugByName(rfi.project, identifierHint);
        if (!slug) return { kind: 'error', message: `Could not resolve project for RFI ${resourceId}.` };
        return { kind: 'detail', url: buildUrl(slug), label: `${label} (${rfi.subject})`, detailView: { type: 'rfi', item: rfi } };
      }
      case 'record-submittal': {
        const sub = this.store.submittals().find(s => s.id === resourceId || s.number === resourceId);
        if (!sub) return { kind: 'error', message: `Submittal ${resourceId} not found.` };
        const slug = this.findProjectSlugByName(sub.project, identifierHint);
        if (!slug) return { kind: 'error', message: `Could not resolve project for submittal ${resourceId}.` };
        return { kind: 'detail', url: buildUrl(slug), label: `${label} (${sub.subject})`, detailView: { type: 'submittal', item: sub } };
      }
      case 'record-daily-report': {
        const report = this.store.dailyReports().find(r => r.id === resourceId);
        if (!report) return { kind: 'error', message: `Daily report ${resourceId} not found.` };
        const slug = this.findProjectSlugById(report.projectId);
        if (!slug) return { kind: 'error', message: `Could not resolve project for daily report ${resourceId}.` };
        return { kind: 'detail', url: buildUrl(slug), label, detailView: { type: 'dailyReport', item: report as DailyReport } };
      }
      case 'record-inspection': {
        const insp = this.store.inspections().find(i => i.id === resourceId);
        if (!insp) return { kind: 'error', message: `Inspection ${resourceId} not found.` };
        const slug = this.findProjectSlugById(insp.projectId);
        if (!slug) return { kind: 'error', message: `Could not resolve project for inspection ${resourceId}.` };
        return { kind: 'detail', url: buildUrl(slug), label, detailView: { type: 'inspection', item: insp as Inspection } };
      }
      case 'record-punch-item': {
        const item = this.store.punchListItems().find(p => p.id === resourceId);
        if (!item) return { kind: 'error', message: `Punch item ${resourceId} not found.` };
        const slug = this.findProjectSlugById(item.projectId);
        if (!slug) return { kind: 'error', message: `Could not resolve project for punch item ${resourceId}.` };
        return { kind: 'detail', url: buildUrl(slug), label, detailView: { type: 'punchItem', item: item as PunchListItem } };
      }
      case 'record-drawing': {
        const found = this.findInProjectBuckets<DrawingTile>(ALL_DRAWINGS_BY_PROJECT, d => d.id === resourceId);
        if (!found) return { kind: 'error', message: `Drawing ${resourceId} not found.` };
        const slug = this.findProjectSlugById(found.projectId);
        if (!slug) return { kind: 'error', message: `Could not resolve project for drawing ${resourceId}.` };
        const url = `/${persona}/project/${slug}?page=drawings&view=drawing&id=${encodeURIComponent(resourceId)}`;
        return { kind: 'detail', url, label, detailView: { type: 'drawing', item: found.item } };
      }
      case 'record-panorama': {
        const found = this.findInProjectBuckets<SiteCapture>(SITE_CAPTURES_BY_PROJECT, c => c.id === resourceId);
        if (!found) return { kind: 'error', message: `Panorama ${resourceId} not found.` };
        const slug = this.findProjectSlugById(found.projectId);
        if (!slug) return { kind: 'error', message: `Could not resolve project for panorama ${resourceId}.` };
        const url = `/${persona}/project/${slug}?page=field-captures&view=panorama&id=${encodeURIComponent(resourceId)}`;
        return { kind: 'detail', url, label, detailView: { type: 'panorama', item: found.item } };
      }
    }
    return { kind: 'error', message: `Unhandled record destination: ${destination}` };
  }

  private findProjectSlugByName(projectName: string | undefined, hint: string | undefined): string | undefined {
    if (hint) {
      const direct = this.resolveProject(hint);
      if (direct) return direct.slug;
    }
    if (!projectName) return undefined;
    const lower = projectName.toLowerCase();
    const exact = this.store.projects().find(p => p.name.toLowerCase() === lower);
    if (exact) return exact.slug;
    return this.store.projects().find(p => p.name.toLowerCase().includes(lower))?.slug;
  }

  private findProjectSlugById(id: number): string | undefined {
    return this.store.findProjectById(id)?.slug;
  }

  private findInProjectBuckets<T extends { id: string }>(
    buckets: Record<number, T[]>,
    pred: (item: T) => boolean,
  ): { projectId: number; item: T } | undefined {
    for (const key of Object.keys(buckets)) {
      const projectId = Number(key);
      const list = buckets[projectId];
      const match = list?.find(pred);
      if (match) return { projectId, item: match };
    }
    return undefined;
  }

  private financialsDetailLabel(destination: string, resourceId: string): string {
    const child = FINANCIALS_DETAIL_PATH[destination] ?? destination;
    const human = child.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `${human} ${resourceId}`;
  }

  private projectSectionLabel(
    projectName: string,
    destination: string,
    extras: { recordsSubpage: string; financialsSubpage: string },
  ): string {
    if (destination === 'project-dashboard') return projectName;
    if (destination === 'project-records' && extras.recordsSubpage) {
      return `${projectName} • ${this.titleCase(extras.recordsSubpage)}`;
    }
    if (destination === 'project-financials' && extras.financialsSubpage) {
      return `${projectName} • ${this.titleCase(extras.financialsSubpage)}`;
    }
    const section = destination.replace(/^project-/, '');
    return `${projectName} • ${this.titleCase(section)}`;
  }

  private titleCase(value: string): string {
    return value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private entityStatusTools(): AiToolDefinition[] {
    const s = this.store;
    return [
      createEntityStatusTool<RfiStatus, Rfi>({
        toolName: 'update_rfi_status', description: 'Update the status of an RFI.',
        idParam: 'rfiId', idParamDesc: 'The RFI ID', validStatuses: ['open', 'overdue', 'upcoming', 'closed'],
        statusField: 'status', collection: () => s.rfis(), displayField: 'number',
        update: (id, st) => s.updateRfiStatus(id, st),
      }),
      createEntityStatusTool<SubmittalStatus, Submittal>({
        toolName: 'update_submittal_status', description: 'Update the status of a submittal.',
        idParam: 'submittalId', idParamDesc: 'The submittal ID', validStatuses: ['open', 'overdue', 'upcoming', 'closed'],
        statusField: 'status', collection: () => s.submittals(), displayField: 'number',
        update: (id, st) => s.updateSubmittalStatus(id, st),
      }),
      createEntityStatusTool<InspectionResult, Inspection>({
        toolName: 'update_inspection_result', description: 'Update the result of an inspection.',
        idParam: 'inspectionId', idParamDesc: 'The inspection ID', validStatuses: ['pass', 'fail', 'conditional', 'pending'],
        statusField: 'result', collection: () => s.inspections(), displayField: 'id',
        update: (id, r) => s.updateInspectionResult(id, r),
      }),
      createEntityStatusTool<'open' | 'in-progress' | 'completed' | 'verified', PunchListItem>({
        toolName: 'update_punch_list_status', description: 'Update the status of a punch list item.',
        idParam: 'punchItemId', idParamDesc: 'The punch list item ID',
        validStatuses: ['open', 'in-progress', 'completed', 'verified'],
        statusField: 'status', collection: () => s.punchListItems(), displayField: 'description',
        update: (id, st) => s.updatePunchListStatus(id, st),
      }),
      createEntityStatusTool<ChangeOrderStatus, ChangeOrder>({
        toolName: 'update_change_order_status', description: 'Update the status of a change order.',
        idParam: 'coId', idParamDesc: 'The change order ID', validStatuses: ['pending', 'approved', 'rejected'],
        statusField: 'status', collection: () => s.changeOrders(), displayField: 'id',
        update: (id, st) => s.updateChangeOrderStatus(id, st),
      }),
      createEntityStatusTool<InvoiceStatus, Invoice>({
        toolName: 'update_invoice_status', description: 'Update the status of an invoice.',
        idParam: 'invoiceId', idParamDesc: 'The invoice ID',
        validStatuses: ['draft', 'sent', 'paid', 'overdue', 'partially-paid', 'void'],
        statusField: 'status', collection: () => s.invoices(), displayField: 'invoiceNumber',
        update: (id, st) => s.updateInvoiceStatus(id, st),
      }),
      createEntityStatusTool<PayableStatus, Payable>({
        toolName: 'update_payable_status', description: 'Update the status of a payable.',
        idParam: 'payableId', idParamDesc: 'The payable ID',
        validStatuses: ['pending', 'approved', 'paid', 'overdue', 'disputed'],
        statusField: 'status', collection: () => s.payables(), displayField: 'invoiceNumber',
        update: (id, st) => s.updatePayableStatus(id, st),
      }),
      createEntityStatusTool<PurchaseOrderStatus, PurchaseOrder>({
        toolName: 'update_purchase_order_status', description: 'Update the status of a purchase order.',
        idParam: 'poId', idParamDesc: 'The purchase order ID',
        validStatuses: ['draft', 'issued', 'acknowledged', 'partially-received', 'received', 'closed', 'cancelled'],
        statusField: 'status', collection: () => s.purchaseOrders(), displayField: 'poNumber',
        update: (id, st) => s.updatePurchaseOrderStatus(id, st),
      }),
      createEntityStatusTool<EstimateStatus, Estimate>({
        toolName: 'update_estimate_status', description: 'Update the status of an estimate.',
        idParam: 'estimateId', idParamDesc: 'The estimate ID',
        validStatuses: ['Draft', 'Under Review', 'Awaiting Approval', 'Approved'],
        statusField: 'status', collection: () => s.estimates(), displayField: 'id',
        update: (id, st) => s.updateEstimateStatus(id, st),
      }),
      createEntityStatusTool<ContractStatus, Contract>({
        toolName: 'update_contract_status', description: 'Update the status of a contract.',
        idParam: 'contractId', idParamDesc: 'The contract ID',
        validStatuses: ['active', 'closed', 'pending', 'draft'],
        statusField: 'status', collection: () => s.contracts(), displayField: 'title',
        update: (id, st) => s.updateContractStatus(id, st),
      }),
    ];
  }

  private entityAmountTools(): AiToolDefinition[] {
    const s = this.store;
    return [
      createEntityAmountTool<ChangeOrder>({
        toolName: 'update_change_order_amount', description: 'Update the dollar amount of a change order.',
        idParam: 'coId', idParamDesc: 'The change order ID', amountParam: 'newAmount', amountField: 'amount',
        collection: () => s.changeOrders(), displayField: 'id',
        update: (id, amt) => s.updateChangeOrderAmount(id, amt),
        sideEffects: (entity, delta) => {
          if (entity.status === 'approved') { s.adjustLatestRevenue(delta); s.adjustCashFlowInflows(delta); }
        },
      }),
      createEntityAmountTool<Invoice>({
        toolName: 'update_invoice_amount', description: 'Update the dollar amount of an invoice.',
        idParam: 'invoiceId', idParamDesc: 'The invoice ID', amountParam: 'newAmount', amountField: 'amount',
        collection: () => s.invoices(), displayField: 'invoiceNumber',
        update: (id, amt) => s.updateInvoiceAmount(id, amt),
        sideEffects: (_e, delta) => { s.adjustLatestRevenue(delta); s.adjustCashFlowInflows(delta); },
      }),
      createEntityAmountTool<Payable>({
        toolName: 'update_payable_amount', description: 'Update the dollar amount of a payable.',
        idParam: 'payableId', idParamDesc: 'The payable ID', amountParam: 'newAmount', amountField: 'amount',
        collection: () => s.payables(), displayField: 'invoiceNumber',
        update: (id, amt) => s.updatePayableAmount(id, amt),
        sideEffects: (_e, delta) => { s.adjustCashFlowOutflows(delta); },
      }),
      createEntityAmountTool<PurchaseOrder>({
        toolName: 'update_purchase_order_amount', description: 'Update the dollar amount of a purchase order.',
        idParam: 'poId', idParamDesc: 'The purchase order ID', amountParam: 'newAmount', amountField: 'amount',
        collection: () => s.purchaseOrders(), displayField: 'poNumber',
        update: (id, amt) => s.updatePurchaseOrderAmount(id, amt),
        sideEffects: (_e, delta) => { s.adjustCashFlowOutflows(delta); },
      }),
      createEntityAmountTool<Estimate>({
        toolName: 'update_estimate_value', description: 'Update the dollar value of an estimate.',
        idParam: 'estimateId', idParamDesc: 'The estimate ID', amountParam: 'newValue', amountField: 'valueRaw',
        collection: () => s.estimates(), displayField: 'id',
        update: (id, val) => s.updateEstimateValue(id, val),
        sideEffects: (entity, delta) => { if (entity.status === 'Approved') s.adjustLatestRevenue(delta); },
      }),
      createEntityAmountTool<Contract>({
        toolName: 'update_contract_value', description: 'Update the revised value of a contract.',
        idParam: 'contractId', idParamDesc: 'The contract ID', amountParam: 'newValue', amountField: 'revisedValue',
        collection: () => s.contracts(), displayField: 'title',
        update: (id, val) => s.updateContractValue(id, val),
        sideEffects: (_e, delta) => { s.adjustLatestRevenue(delta); },
      }),
    ];
  }

  private updateProjectBudget(): AiToolDefinition {
    return {
      name: 'update_project_budget',
      description: 'Update a project\'s total budget amount. This affects budget KPIs across all pages.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID (1-8)' },
          newBudgetTotal: { type: 'number', description: 'New budget total in dollars (e.g. 500000 for $500K)' },
        },
        required: ['projectId', 'newBudgetTotal'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const newTotal = args['newBudgetTotal'] as number;
        const project = this.store.findProjectById(projectId);
        if (!project) return { success: false, message: `Project ${projectId} not found` };
        const detail = this.store.projectDetailData()[projectId];
        if (!detail) return { success: false, message: `Project detail for ${projectId} not found` };

        const oldTotal = parseAmount(project.budgetTotal);
        const usedRaw = parseAmount(project.budgetUsed);
        const newPct = newTotal > 0 ? Math.round((usedRaw / newTotal) * 100) : 0;
        const fmtTotal = fmtCurrency(newTotal);

        this.store.updateProject(projectId, { budgetTotal: fmtTotal, budgetPct: newPct });
        this.store.updateProjectDetail(projectId, { budgetTotal: fmtTotal, budgetPct: newPct });

        const history = this.store.getProjectBudgetHistory(projectId);
        const now = new Date();
        const monthLabel = now.toLocaleString('default', { month: 'short', year: '2-digit' });
        this.store.updateBudgetHistory(projectId, [
          ...history,
          { month: monthLabel, planned: newTotal, actual: usedRaw, forecast: newTotal },
        ]);

        return { success: true, message: `${project.name} budget updated from ${fmtCurrency(oldTotal)} to ${fmtTotal} (${newPct}% used)` };
      },
    };
  }

  private updateProjectStatus(): AiToolDefinition {
    const validStatuses: ProjectStatus[] = ['On Track', 'At Risk', 'Overdue', 'Planning'];
    return {
      name: 'update_project_status',
      description: 'Update a project\'s status.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID (1-8)' },
          newStatus: { type: 'string', enum: validStatuses, description: 'New project status' },
        },
        required: ['projectId', 'newStatus'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const newStatus = args['newStatus'] as ProjectStatus;
        const project = this.store.findProjectById(projectId);
        if (!project) return { success: false, message: `Project ${projectId} not found` };
        if (!validStatuses.includes(newStatus)) return { success: false, message: `Invalid status: ${newStatus}` };
        const oldStatus = project.status;
        this.store.updateProjectStatus(projectId, newStatus);
        this.store.updateProjectDetail(projectId, { status: newStatus });
        return { success: true, message: `${project.name} status changed from "${oldStatus}" to "${newStatus}"` };
      },
    };
  }

  private updateProjectDueDate(): AiToolDefinition {
    return {
      name: 'update_project_due_date',
      description: 'Update a project\'s due date. Accepts a human-readable date string (e.g. "Mar 15, 2026").',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID (1-8)' },
          newDueDate: { type: 'string', description: 'New due date as a formatted string (e.g. "Mar 15, 2026")' },
        },
        required: ['projectId', 'newDueDate'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const newDueDate = args['newDueDate'] as string;
        const project = this.store.findProjectById(projectId);
        if (!project) return { success: false, message: `Project ${projectId} not found` };
        const oldDate = project.dueDate;
        this.store.updateProject(projectId, { dueDate: newDueDate });

        const parsedDate = new Date(newDueDate);
        if (isNaN(parsedDate.getTime())) {
          return { success: true, message: `${project.name} due date changed from "${oldDate}" to "${newDueDate}"` };
        }

        if (project.status === 'Overdue' && parsedDate.getTime() > Date.now()) {
          this.store.updateProjectStatus(projectId, 'On Track');
          this.store.updateProjectDetail(projectId, { status: 'On Track' });
          return { success: true, message: `${project.name} due date changed from "${oldDate}" to "${newDueDate}" and status updated from "Overdue" to "On Track"` };
        }

        if (parsedDate.getTime() < Date.now() && project.status !== 'Overdue') {
          const oldStatus = project.status;
          this.store.updateProjectStatus(projectId, 'Overdue');
          this.store.updateProjectDetail(projectId, { status: 'Overdue' });
          return { success: true, message: `${project.name} due date changed from "${oldDate}" to "${newDueDate}" and status updated from "${oldStatus}" to "Overdue"` };
        }

        return { success: true, message: `${project.name} due date changed from "${oldDate}" to "${newDueDate}"` };
      },
    };
  }

  private updateBudgetBreakdownItem(): AiToolDefinition {
    return {
      name: 'update_budget_breakdown_item',
      description: 'Update a budget breakdown line item amount for a project (e.g. Labor, Materials, Equipment, Subcontractors, Overhead).',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID' },
          label: { type: 'string', description: 'Category name (Labor, Materials, Equipment, Subcontractors, Overhead)' },
          newAmount: { type: 'string', description: 'New amount as formatted string (e.g. "$120K", "$1.2M")' },
        },
        required: ['projectId', 'label', 'newAmount'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const label = args['label'] as string;
        const newAmount = args['newAmount'] as string;
        const detail = this.store.projectDetailData()[projectId];
        if (!detail) return { success: false, message: `Project ${projectId} not found` };
        const item = detail.budgetBreakdown.find(b => b.label.toLowerCase() === label.toLowerCase());
        if (!item) return { success: false, message: `Budget category "${label}" not found` };
        const oldAmount = item.amount;
        this.store.updateBudgetBreakdownItem(projectId, item.label, newAmount);
        return { success: true, message: `${detail.name} ${item.label} budget changed from ${oldAmount} to ${newAmount}` };
      },
    };
  }

  private updateMilestoneStatus(): AiToolDefinition {
    const valid = ['completed', 'in-progress', 'upcoming', 'overdue'];
    return {
      name: 'update_milestone_status',
      description: 'Update the status of a project milestone.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID' },
          milestoneId: { type: 'number', description: 'The milestone ID' },
          newStatus: { type: 'string', enum: valid, description: 'New milestone status' },
        },
        required: ['projectId', 'milestoneId', 'newStatus'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const milestoneId = args['milestoneId'] as number;
        const status = args['newStatus'] as string;
        const detail = this.store.projectDetailData()[projectId];
        if (!detail) return { success: false, message: `Project ${projectId} not found` };
        const ms = detail.milestones.find(m => m.id === milestoneId);
        if (!ms) return { success: false, message: `Milestone ${milestoneId} not found in project ${projectId}` };
        const old = ms.status;
        this.store.updateMilestoneStatus(projectId, milestoneId, status);
        return { success: true, message: `Milestone "${ms.name}" status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateTaskStatus(): AiToolDefinition {
    const valid = ['To Do', 'In Progress', 'Done'];
    return {
      name: 'update_task_status',
      description: 'Update the status of a project task.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID' },
          taskId: { type: 'number', description: 'The task ID' },
          newStatus: { type: 'string', enum: valid, description: 'New task status' },
        },
        required: ['projectId', 'taskId', 'newStatus'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const taskId = args['taskId'] as number;
        const status = args['newStatus'] as string;
        const detail = this.store.projectDetailData()[projectId];
        if (!detail) return { success: false, message: `Project ${projectId} not found` };
        const task = detail.tasks.find(t => t.id === taskId);
        if (!task) return { success: false, message: `Task ${taskId} not found in project ${projectId}` };
        const old = task.status;
        this.store.updateTaskStatus(projectId, taskId, status);
        return { success: true, message: `Task "${task.title}" status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateRiskSeverity(): AiToolDefinition {
    const valid = ['low', 'medium', 'high'];
    return {
      name: 'update_risk_severity',
      description: 'Update the severity of a project risk.',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'number', description: 'The project ID' },
          riskId: { type: 'number', description: 'The risk ID' },
          newSeverity: { type: 'string', enum: valid, description: 'New risk severity' },
        },
        required: ['projectId', 'riskId', 'newSeverity'],
      },
      execute: (args) => {
        const projectId = args['projectId'] as number;
        const riskId = args['riskId'] as number;
        const severity = args['newSeverity'] as string;
        const detail = this.store.projectDetailData()[projectId];
        if (!detail) return { success: false, message: `Project ${projectId} not found` };
        const risk = detail.risks.find(r => r.id === riskId);
        if (!risk) return { success: false, message: `Risk ${riskId} not found in project ${projectId}` };
        const old = risk.severity;
        this.store.updateRiskSeverity(projectId, riskId, severity);
        return { success: true, message: `Risk "${risk.title}" severity changed from "${old}" to "${severity}"` };
      },
    };
  }

  private updateCashPosition(): AiToolDefinition {
    const validFields = ['currentBalance', 'thirtyDayForecast', 'sixtyDayForecast', 'ninetyDayForecast', 'monthlyPayroll', 'monthlyOverhead', 'upcomingPayables'];
    return {
      name: 'update_cash_position',
      description: 'Update a cash position field (e.g. current balance, forecasts, payroll).',
      inputSchema: {
        type: 'object',
        properties: {
          field: { type: 'string', enum: validFields, description: 'Which cash position field to update' },
          newValue: { type: 'number', description: 'New value in dollars' },
        },
        required: ['field', 'newValue'],
      },
      execute: (args) => {
        const field = args['field'] as string;
        const value = args['newValue'] as number;
        if (!validFields.includes(field)) return { success: false, message: `Invalid cash position field: ${field}` };
        const old = (this.store.cashPosition() as unknown as Record<string, number>)[field];
        this.store.updateCashPosition({ [field]: value });
        return { success: true, message: `Cash position ${field} changed from ${fmtCurrency(old ?? 0)} to ${fmtCurrency(value)}` };
      },
    };
  }

  private updateBillingEvent(): AiToolDefinition {
    return {
      name: 'update_billing_event',
      description: 'Update a billing event\'s amount or status.',
      inputSchema: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'The billing event ID' },
          field: { type: 'string', enum: ['amount', 'status'], description: 'Field to update' },
          newValue: { type: ['number', 'string'], description: 'New value (number for amount, string for status)' },
        },
        required: ['eventId', 'field', 'newValue'],
      },
      execute: (args) => {
        const id = args['eventId'] as string;
        const field = args['field'] as 'amount' | 'status';
        const value = args['newValue'];
        const event = this.store.billingEvents().find(e => e.id === id);
        if (!event) return { success: false, message: `Billing event ${id} not found` };
        if (field === 'amount') {
          const old = event.amount;
          const delta = (value as number) - old;
          this.store.updateBillingEvent(id, { amount: value as number });
          this.store.adjustLatestRevenue(delta);
          this.store.adjustCashFlowInflows(delta);
          return { success: true, message: `Billing event ${id} amount changed from ${fmtCurrency(old)} to ${fmtCurrency(value as number)}` };
        }
        const old = event.status;
        this.store.updateBillingEvent(id, { status: value as BillingEventStatus });
        return { success: true, message: `Billing event ${id} status changed from "${old}" to "${value}"` };
      },
    };
  }

  private updatePayrollRecord(): AiToolDefinition {
    const validFields = ['grossPay', 'netPay', 'taxes', 'benefits'];
    return {
      name: 'update_payroll_record',
      description: 'Update a payroll record field (grossPay, netPay, taxes, benefits).',
      inputSchema: {
        type: 'object',
        properties: {
          recordId: { type: 'string', description: 'The payroll record ID' },
          field: { type: 'string', enum: validFields, description: 'Field to update' },
          newValue: { type: 'number', description: 'New value in dollars' },
        },
        required: ['recordId', 'field', 'newValue'],
      },
      execute: (args) => {
        const id = args['recordId'] as string;
        const field = args['field'] as 'grossPay' | 'netPay' | 'taxes' | 'benefits';
        const value = args['newValue'] as number;
        const record = this.store.payrollRecords().find(r => r.id === id);
        if (!record) return { success: false, message: `Payroll record ${id} not found` };
        const old = record[field];
        const delta = value - old;
        this.store.updatePayrollRecord(id, { [field]: value });
        if (field === 'grossPay') {
          this.store.adjustCashFlowOutflows(delta);
        }
        return { success: true, message: `Payroll record ${id} ${field} changed from ${fmtCurrency(old)} to ${fmtCurrency(value)}` };
      },
    };
  }
}
