import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ApLienWaiver, ApLienWaiverStatus } from '../../../data/dashboard-data.types';

const STATUS_ORDER: ApLienWaiverStatus[] = ['missing', 'pending', 'received'];

@Component({
  selector: 'app-home-lien-waivers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-4 h-full min-h-0 overflow-y-auto p-4">
      @for (block of groupedWaivers(); track block.status) {
        <div class="flex flex-col gap-2 flex-shrink-0">
          <div class="flex items-center gap-2">
            <div
              class="rounded px-2 py-1 text-xs font-semibold"
              [class.bg-destructive-20]="block.status === 'missing'"
              [class.text-destructive]="block.status === 'missing'"
              [class.bg-warning-20]="block.status === 'pending'"
              [class.text-warning]="block.status === 'pending'"
              [class.bg-success-20]="block.status === 'received'"
              [class.text-success]="block.status === 'received'"
            >
              {{ statusTitle(block.status) }} ({{ block.items.length }})
            </div>
          </div>
          @for (w of block.items; track w.id) {
            <div class="bg-background border-default rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
              <div class="px-4 py-3 flex items-center justify-between">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">{{ w.vendor }}</div>
                  <div class="text-xs text-foreground-60 truncate">{{ w.project }}</div>
                </div>
                <div
                  class="rounded px-2 py-0.5 text-2xs font-medium shrink-0"
                  [class.bg-destructive-20]="w.status === 'missing'"
                  [class.text-destructive]="w.status === 'missing'"
                  [class.bg-warning-20]="w.status === 'pending'"
                  [class.text-warning]="w.status === 'pending'"
                  [class.bg-success-20]="w.status === 'received'"
                  [class.text-success]="w.status === 'received'"
                >
                  {{ statusTitle(w.status) }}
                </div>
              </div>
              <div class="px-4 py-3 flex flex-col gap-2">
                <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div class="text-foreground-60">{{ waiverTypeLabel(w.waiverType) }}</div>
                  <div class="font-semibold text-foreground tabular-nums">{{ formatCurrency(w.amount) }}</div>
                </div>
                <div class="text-2xs text-foreground-40">Due {{ w.dueDate }} · Period {{ w.periodEnd }}</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class HomeLienWaiversComponent {
  readonly waivers = input.required<ApLienWaiver[]>();

  readonly groupedWaivers = computed(() => {
    const list = [...this.waivers()];
    const byStatus = new Map<ApLienWaiverStatus, ApLienWaiver[]>();
    for (const s of STATUS_ORDER) byStatus.set(s, []);
    for (const w of list) {
      byStatus.get(w.status)?.push(w);
    }
    for (const arr of byStatus.values()) {
      arr.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
    return STATUS_ORDER.map((status) => ({
      status,
      items: byStatus.get(status) ?? [],
    })).filter((b) => b.items.length > 0);
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  statusTitle(s: ApLienWaiverStatus): string {
    switch (s) {
      case 'missing':
        return 'Missing';
      case 'pending':
        return 'Pending';
      case 'received':
        return 'Received';
      default:
        return s;
    }
  }

  waiverTypeLabel(t: 'conditional' | 'unconditional'): string {
    return t === 'conditional' ? 'Conditional' : 'Unconditional';
  }
}
