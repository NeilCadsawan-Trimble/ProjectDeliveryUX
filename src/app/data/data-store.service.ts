import { Injectable, computed, signal } from '@angular/core';
import type {
  BudgetHistoryPoint,
  ChangeOrder,
  ChangeOrderStatus,
  Estimate,
  EstimateStatus,
  JobCostCategory,
  Project,
  ProjectJobCost,
  ProjectStatus,
  ProjectWeather,
  Rfi,
  RfiStatus,
  Submittal,
  SubmittalStatus,
  TimeOffRequest,
  TimeOffStatus,
} from './dashboard-data.types';
import { JOB_COST_CATEGORIES } from './dashboard-data.types';
import {
  BUDGET_HISTORY_BY_PROJECT,
  CHANGE_ORDERS,
  ESTIMATES,
  PROJECTS,
  PROJECT_WEATHER_DATA,
  RFIS_SEED,
  SUBMITTALS_SEED,
  TIME_OFF_REQUESTS,
} from './dashboard-data.seed';
import { PROJECT_DATA, type BudgetBreakdown, type ProjectDashboardData } from './project-data';

function parseAmount(s: string): number {
  const clean = s.replace(/[^0-9.KMkm]/g, '');
  if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
  if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1_000_000;
  return parseFloat(clean);
}

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  readonly rfis = signal<Rfi[]>([...RFIS_SEED]);
  readonly submittals = signal<Submittal[]>([...SUBMITTALS_SEED]);
  readonly changeOrders = signal<ChangeOrder[]>([...CHANGE_ORDERS]);
  readonly estimates = signal<Estimate[]>([...ESTIMATES]);
  readonly timeOffRequests = signal<TimeOffRequest[]>([...TIME_OFF_REQUESTS]);

  readonly projects = signal<Project[]>([...PROJECTS]);
  readonly projectDetailData = signal<Record<number, ProjectDashboardData>>(structuredClone(PROJECT_DATA));
  readonly weatherData = signal<ProjectWeather[]>([...PROJECT_WEATHER_DATA]);
  readonly budgetHistory = signal<Record<number, BudgetHistoryPoint[]>>(structuredClone(BUDGET_HISTORY_BY_PROJECT));

  readonly projectJobCosts = computed<ProjectJobCost[]>(() => {
    const projs = this.projects();
    const details = this.projectDetailData();
    return projs.map(p => {
      const detail = details[p.id];
      const costs = {} as Record<JobCostCategory, number>;
      for (const cat of JOB_COST_CATEGORIES) {
        const entry = detail?.budgetBreakdown?.find((b: BudgetBreakdown) => b.label === cat);
        costs[cat] = entry ? parseAmount(entry.amount) : 0;
      }
      return {
        projectId: p.id,
        projectName: p.name,
        client: p.client,
        budgetUsed: p.budgetUsed,
        budgetTotal: p.budgetTotal,
        budgetPct: p.budgetPct,
        costs,
      };
    });
  });

  getProjectWeather(projectId: number): ProjectWeather | undefined {
    return this.weatherData().find(w => w.projectId === projectId);
  }

  getProjectBudgetHistory(projectId: number): BudgetHistoryPoint[] {
    return this.budgetHistory()[projectId] ?? [];
  }

  findProjectBySlug(slug: string): Project | undefined {
    return this.projects().find(p => p.slug === slug);
  }

  findProjectById(id: number): Project | undefined {
    return this.projects().find(p => p.id === id);
  }

  updateProjectStatus(projectId: number, newStatus: ProjectStatus): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, status: newStatus } : p)
    );
  }

  updateProject(projectId: number, patch: Partial<Project>): void {
    this.projects.update(list =>
      list.map(p => p.id === projectId ? { ...p, ...patch } : p)
    );
  }

  updateProjectDetail(projectId: number, patch: Partial<ProjectDashboardData>): void {
    this.projectDetailData.update(data => ({
      ...data,
      [projectId]: { ...data[projectId], ...patch },
    }));
  }

  updateWeather(projectId: number, patch: Partial<ProjectWeather>): void {
    this.weatherData.update(list =>
      list.map(w => w.projectId === projectId ? { ...w, ...patch } : w)
    );
  }

  updateBudgetHistory(projectId: number, points: BudgetHistoryPoint[]): void {
    this.budgetHistory.update(data => ({ ...data, [projectId]: points }));
  }

  updateRfiStatus(id: string, newStatus: RfiStatus): void {
    this.rfis.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
  }

  updateSubmittalStatus(id: string, newStatus: SubmittalStatus): void {
    this.submittals.update(list =>
      list.map(s => s.id === id ? { ...s, status: newStatus } : s)
    );
  }

  updateChangeOrderStatus(id: string, newStatus: ChangeOrderStatus): void {
    this.changeOrders.update(list =>
      list.map(co => co.id === id ? { ...co, status: newStatus } : co)
    );
  }

  updateEstimateStatus(id: string, newStatus: EstimateStatus): void {
    this.estimates.update(list =>
      list.map(e => e.id === id ? { ...e, status: newStatus } : e)
    );
  }

  updateTimeOffStatus(id: number, newStatus: TimeOffStatus): void {
    this.timeOffRequests.update(list =>
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
  }
}
