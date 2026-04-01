import { Injectable, signal } from '@angular/core';
import type { Rfi, RfiStatus, Submittal, SubmittalStatus, ChangeOrder, ChangeOrderStatus, Estimate, EstimateStatus } from './dashboard-data.types';
import { RFIS_SEED, SUBMITTALS_SEED, CHANGE_ORDERS, ESTIMATES } from './dashboard-data.seed';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  readonly rfis = signal<Rfi[]>([...RFIS_SEED]);
  readonly submittals = signal<Submittal[]>([...SUBMITTALS_SEED]);
  readonly changeOrders = signal<ChangeOrder[]>([...CHANGE_ORDERS]);
  readonly estimates = signal<Estimate[]>([...ESTIMATES]);

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
}
