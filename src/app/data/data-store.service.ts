import { Injectable, signal } from '@angular/core';
import type { Rfi, RfiStatus, Submittal, SubmittalStatus } from './dashboard-data.types';
import { RFIS_SEED, SUBMITTALS_SEED } from './dashboard-data.seed';

@Injectable({ providedIn: 'root' })
export class DataStoreService {
  readonly rfis = signal<Rfi[]>([...RFIS_SEED]);
  readonly submittals = signal<Submittal[]>([...SUBMITTALS_SEED]);

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
}
