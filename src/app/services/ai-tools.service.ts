import { Injectable, inject } from '@angular/core';
import { DataStoreService } from '../data/data-store.service';
import type {
  ProjectStatus,
  RfiStatus,
  SubmittalStatus,
  ChangeOrderStatus,
  EstimateStatus,
  InvoiceStatus,
  PayableStatus,
  PurchaseOrderStatus,
  ContractStatus,
  InspectionResult,
  BillingEventStatus,
} from '../data/dashboard-data.types';

export interface AiToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  execute: (args: Record<string, unknown>) => { success: boolean; message: string };
}

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

  execute(name: string, args: Record<string, unknown>): { success: boolean; message: string } {
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
      this.updateRfiStatus(),
      this.updateSubmittalStatus(),
      this.updateInspectionResult(),
      this.updatePunchListStatus(),
      this.updateMilestoneStatus(),
      this.updateTaskStatus(),
      this.updateRiskSeverity(),
      this.updateChangeOrderStatus(),
      this.updateChangeOrderAmount(),
      this.updateInvoiceStatus(),
      this.updateInvoiceAmount(),
      this.updatePayableStatus(),
      this.updatePayableAmount(),
      this.updatePurchaseOrderStatus(),
      this.updatePurchaseOrderAmount(),
      this.updateCashPosition(),
      this.updateEstimateStatus(),
      this.updateEstimateValue(),
      this.updateContractStatus(),
      this.updateContractValue(),
      this.updateBillingEvent(),
      this.updatePayrollRecord(),
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

  private updateRfiStatus(): AiToolDefinition {
    const valid: RfiStatus[] = ['open', 'overdue', 'upcoming', 'closed'];
    return {
      name: 'update_rfi_status',
      description: 'Update the status of an RFI.',
      inputSchema: {
        type: 'object',
        properties: {
          rfiId: { type: 'string', description: 'The RFI ID' },
          newStatus: { type: 'string', enum: valid, description: 'New RFI status' },
        },
        required: ['rfiId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['rfiId'] as string;
        const status = args['newStatus'] as RfiStatus;
        const rfi = this.store.rfis().find(r => r.id === id);
        if (!rfi) return { success: false, message: `RFI ${id} not found` };
        const old = rfi.status;
        this.store.updateRfiStatus(id, status);
        return { success: true, message: `RFI ${rfi.number} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateSubmittalStatus(): AiToolDefinition {
    const valid: SubmittalStatus[] = ['open', 'overdue', 'upcoming', 'closed'];
    return {
      name: 'update_submittal_status',
      description: 'Update the status of a submittal.',
      inputSchema: {
        type: 'object',
        properties: {
          submittalId: { type: 'string', description: 'The submittal ID' },
          newStatus: { type: 'string', enum: valid, description: 'New submittal status' },
        },
        required: ['submittalId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['submittalId'] as string;
        const status = args['newStatus'] as SubmittalStatus;
        const sub = this.store.submittals().find(s => s.id === id);
        if (!sub) return { success: false, message: `Submittal ${id} not found` };
        const old = sub.status;
        this.store.updateSubmittalStatus(id, status);
        return { success: true, message: `Submittal ${sub.number} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateInspectionResult(): AiToolDefinition {
    const valid: InspectionResult[] = ['pass', 'fail', 'conditional', 'pending'];
    return {
      name: 'update_inspection_result',
      description: 'Update the result of an inspection.',
      inputSchema: {
        type: 'object',
        properties: {
          inspectionId: { type: 'string', description: 'The inspection ID' },
          newResult: { type: 'string', enum: valid, description: 'New inspection result' },
        },
        required: ['inspectionId', 'newResult'],
      },
      execute: (args) => {
        const id = args['inspectionId'] as string;
        const result = args['newResult'] as InspectionResult;
        const insp = this.store.inspections().find(i => i.id === id);
        if (!insp) return { success: false, message: `Inspection ${id} not found` };
        const old = insp.result;
        this.store.updateInspectionResult(id, result);
        return { success: true, message: `Inspection ${id} result changed from "${old}" to "${result}"` };
      },
    };
  }

  private updatePunchListStatus(): AiToolDefinition {
    const valid = ['open', 'in-progress', 'completed', 'verified'] as const;
    return {
      name: 'update_punch_list_status',
      description: 'Update the status of a punch list item.',
      inputSchema: {
        type: 'object',
        properties: {
          punchItemId: { type: 'string', description: 'The punch list item ID' },
          newStatus: { type: 'string', enum: [...valid], description: 'New punch list status' },
        },
        required: ['punchItemId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['punchItemId'] as string;
        const status = args['newStatus'] as typeof valid[number];
        const item = this.store.punchListItems().find(p => p.id === id);
        if (!item) return { success: false, message: `Punch list item ${id} not found` };
        const old = item.status;
        this.store.updatePunchListStatus(id, status);
        return { success: true, message: `Punch list item "${item.description}" status changed from "${old}" to "${status}"` };
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

  private updateChangeOrderStatus(): AiToolDefinition {
    const valid: ChangeOrderStatus[] = ['pending', 'approved', 'rejected'];
    return {
      name: 'update_change_order_status',
      description: 'Update the status of a change order.',
      inputSchema: {
        type: 'object',
        properties: {
          coId: { type: 'string', description: 'The change order ID' },
          newStatus: { type: 'string', enum: valid, description: 'New change order status' },
        },
        required: ['coId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['coId'] as string;
        const status = args['newStatus'] as ChangeOrderStatus;
        const co = this.store.changeOrders().find(c => c.id === id);
        if (!co) return { success: false, message: `Change order ${id} not found` };
        const old = co.status;
        this.store.updateChangeOrderStatus(id, status);
        return { success: true, message: `Change order ${id} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateChangeOrderAmount(): AiToolDefinition {
    return {
      name: 'update_change_order_amount',
      description: 'Update the dollar amount of a change order.',
      inputSchema: {
        type: 'object',
        properties: {
          coId: { type: 'string', description: 'The change order ID' },
          newAmount: { type: 'number', description: 'New amount in dollars' },
        },
        required: ['coId', 'newAmount'],
      },
      execute: (args) => {
        const id = args['coId'] as string;
        const amount = args['newAmount'] as number;
        const co = this.store.changeOrders().find(c => c.id === id);
        if (!co) return { success: false, message: `Change order ${id} not found` };
        const old = co.amount;
        const delta = amount - old;
        this.store.updateChangeOrderAmount(id, amount);
        if (co.status === 'approved') {
          this.store.adjustLatestRevenue(delta);
          this.store.adjustCashFlowInflows(delta);
        }
        return { success: true, message: `Change order ${id} amount changed from ${fmtCurrency(old)} to ${fmtCurrency(amount)}` };
      },
    };
  }

  private updateInvoiceStatus(): AiToolDefinition {
    const valid: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'partially-paid', 'void'];
    return {
      name: 'update_invoice_status',
      description: 'Update the status of an invoice.',
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The invoice ID' },
          newStatus: { type: 'string', enum: valid, description: 'New invoice status' },
        },
        required: ['invoiceId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['invoiceId'] as string;
        const status = args['newStatus'] as InvoiceStatus;
        const inv = this.store.invoices().find(i => i.id === id);
        if (!inv) return { success: false, message: `Invoice ${id} not found` };
        const old = inv.status;
        this.store.updateInvoiceStatus(id, status);
        return { success: true, message: `Invoice ${inv.invoiceNumber} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateInvoiceAmount(): AiToolDefinition {
    return {
      name: 'update_invoice_amount',
      description: 'Update the dollar amount of an invoice.',
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The invoice ID' },
          newAmount: { type: 'number', description: 'New amount in dollars' },
        },
        required: ['invoiceId', 'newAmount'],
      },
      execute: (args) => {
        const id = args['invoiceId'] as string;
        const amount = args['newAmount'] as number;
        const inv = this.store.invoices().find(i => i.id === id);
        if (!inv) return { success: false, message: `Invoice ${id} not found` };
        const old = inv.amount;
        const delta = amount - old;
        this.store.updateInvoiceAmount(id, amount);
        this.store.adjustLatestRevenue(delta);
        this.store.adjustCashFlowInflows(delta);
        return { success: true, message: `Invoice ${inv.invoiceNumber} amount changed from ${fmtCurrency(old)} to ${fmtCurrency(amount)}` };
      },
    };
  }

  private updatePayableStatus(): AiToolDefinition {
    const valid: PayableStatus[] = ['pending', 'approved', 'paid', 'overdue', 'disputed'];
    return {
      name: 'update_payable_status',
      description: 'Update the status of a payable.',
      inputSchema: {
        type: 'object',
        properties: {
          payableId: { type: 'string', description: 'The payable ID' },
          newStatus: { type: 'string', enum: valid, description: 'New payable status' },
        },
        required: ['payableId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['payableId'] as string;
        const status = args['newStatus'] as PayableStatus;
        const pay = this.store.payables().find(p => p.id === id);
        if (!pay) return { success: false, message: `Payable ${id} not found` };
        const old = pay.status;
        this.store.updatePayableStatus(id, status);
        return { success: true, message: `Payable ${pay.invoiceNumber} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updatePayableAmount(): AiToolDefinition {
    return {
      name: 'update_payable_amount',
      description: 'Update the dollar amount of a payable.',
      inputSchema: {
        type: 'object',
        properties: {
          payableId: { type: 'string', description: 'The payable ID' },
          newAmount: { type: 'number', description: 'New amount in dollars' },
        },
        required: ['payableId', 'newAmount'],
      },
      execute: (args) => {
        const id = args['payableId'] as string;
        const amount = args['newAmount'] as number;
        const pay = this.store.payables().find(p => p.id === id);
        if (!pay) return { success: false, message: `Payable ${id} not found` };
        const old = pay.amount;
        const delta = amount - old;
        this.store.updatePayableAmount(id, amount);
        this.store.adjustCashFlowOutflows(delta);
        return { success: true, message: `Payable ${pay.invoiceNumber} amount changed from ${fmtCurrency(old)} to ${fmtCurrency(amount)}` };
      },
    };
  }

  private updatePurchaseOrderStatus(): AiToolDefinition {
    const valid: PurchaseOrderStatus[] = ['draft', 'issued', 'acknowledged', 'partially-received', 'received', 'closed', 'cancelled'];
    return {
      name: 'update_purchase_order_status',
      description: 'Update the status of a purchase order.',
      inputSchema: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'The purchase order ID' },
          newStatus: { type: 'string', enum: valid, description: 'New PO status' },
        },
        required: ['poId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['poId'] as string;
        const status = args['newStatus'] as PurchaseOrderStatus;
        const po = this.store.purchaseOrders().find(p => p.id === id);
        if (!po) return { success: false, message: `Purchase order ${id} not found` };
        const old = po.status;
        this.store.updatePurchaseOrderStatus(id, status);
        return { success: true, message: `PO ${po.poNumber} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updatePurchaseOrderAmount(): AiToolDefinition {
    return {
      name: 'update_purchase_order_amount',
      description: 'Update the dollar amount of a purchase order.',
      inputSchema: {
        type: 'object',
        properties: {
          poId: { type: 'string', description: 'The purchase order ID' },
          newAmount: { type: 'number', description: 'New amount in dollars' },
        },
        required: ['poId', 'newAmount'],
      },
      execute: (args) => {
        const id = args['poId'] as string;
        const amount = args['newAmount'] as number;
        const po = this.store.purchaseOrders().find(p => p.id === id);
        if (!po) return { success: false, message: `Purchase order ${id} not found` };
        const old = po.amount;
        const delta = amount - old;
        this.store.updatePurchaseOrderAmount(id, amount);
        this.store.adjustCashFlowOutflows(delta);
        return { success: true, message: `PO ${po.poNumber} amount changed from ${fmtCurrency(old)} to ${fmtCurrency(amount)}` };
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

  private updateEstimateStatus(): AiToolDefinition {
    const valid: EstimateStatus[] = ['Draft', 'Under Review', 'Awaiting Approval', 'Approved'];
    return {
      name: 'update_estimate_status',
      description: 'Update the status of an estimate.',
      inputSchema: {
        type: 'object',
        properties: {
          estimateId: { type: 'string', description: 'The estimate ID' },
          newStatus: { type: 'string', enum: valid, description: 'New estimate status' },
        },
        required: ['estimateId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['estimateId'] as string;
        const status = args['newStatus'] as EstimateStatus;
        const est = this.store.estimates().find(e => e.id === id);
        if (!est) return { success: false, message: `Estimate ${id} not found` };
        const old = est.status;
        this.store.updateEstimateStatus(id, status);
        return { success: true, message: `Estimate ${id} status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateEstimateValue(): AiToolDefinition {
    return {
      name: 'update_estimate_value',
      description: 'Update the dollar value of an estimate.',
      inputSchema: {
        type: 'object',
        properties: {
          estimateId: { type: 'string', description: 'The estimate ID' },
          newValue: { type: 'number', description: 'New value in dollars' },
        },
        required: ['estimateId', 'newValue'],
      },
      execute: (args) => {
        const id = args['estimateId'] as string;
        const value = args['newValue'] as number;
        const est = this.store.estimates().find(e => e.id === id);
        if (!est) return { success: false, message: `Estimate ${id} not found` };
        const old = est.valueRaw;
        const delta = value - old;
        this.store.updateEstimateValue(id, value);
        if (est.status === 'Approved') {
          this.store.adjustLatestRevenue(delta);
        }
        return { success: true, message: `Estimate ${id} value changed from ${fmtCurrency(old)} to ${fmtCurrency(value)}` };
      },
    };
  }

  private updateContractStatus(): AiToolDefinition {
    const valid: ContractStatus[] = ['active', 'closed', 'pending', 'draft'];
    return {
      name: 'update_contract_status',
      description: 'Update the status of a contract.',
      inputSchema: {
        type: 'object',
        properties: {
          contractId: { type: 'string', description: 'The contract ID' },
          newStatus: { type: 'string', enum: valid, description: 'New contract status' },
        },
        required: ['contractId', 'newStatus'],
      },
      execute: (args) => {
        const id = args['contractId'] as string;
        const status = args['newStatus'] as ContractStatus;
        const contract = this.store.contracts().find(c => c.id === id);
        if (!contract) return { success: false, message: `Contract ${id} not found` };
        const old = contract.status;
        this.store.updateContractStatus(id, status);
        return { success: true, message: `Contract "${contract.title}" status changed from "${old}" to "${status}"` };
      },
    };
  }

  private updateContractValue(): AiToolDefinition {
    return {
      name: 'update_contract_value',
      description: 'Update the revised value of a contract.',
      inputSchema: {
        type: 'object',
        properties: {
          contractId: { type: 'string', description: 'The contract ID' },
          newValue: { type: 'number', description: 'New revised value in dollars' },
        },
        required: ['contractId', 'newValue'],
      },
      execute: (args) => {
        const id = args['contractId'] as string;
        const value = args['newValue'] as number;
        const contract = this.store.contracts().find(c => c.id === id);
        if (!contract) return { success: false, message: `Contract ${id} not found` };
        const old = contract.revisedValue;
        const delta = value - old;
        this.store.updateContractValue(id, value);
        this.store.adjustLatestRevenue(delta);
        return { success: true, message: `Contract "${contract.title}" revised value changed from ${fmtCurrency(old)} to ${fmtCurrency(value)}` };
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
