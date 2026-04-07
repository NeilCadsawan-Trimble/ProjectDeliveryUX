import { Injectable, inject } from '@angular/core';
import { DataStoreService } from '../data/data-store.service';
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
  BillingEventStatus,
} from '../data/dashboard-data.types';

export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: Record<string, unknown>) => { success: boolean; message: string };
}

type ToolResult = { success: boolean; message: string };

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

  getToolNames(): string[] {
    return this.tools.map(t => t.name);
  }

  private buildTools(): AiToolDefinition[] {
    return [
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
