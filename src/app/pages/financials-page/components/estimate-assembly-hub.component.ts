import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { ModusBadgeComponent } from '../../../components/modus-badge.component';
import { ModusButtonComponent } from '../../../components/modus-button.component';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type {
  AssemblyDeliverableStatus,
  AssemblyKpi,
  AssemblySectionStatus,
  EstimateAssemblyHub,
} from '../../../data/dashboard-data.types';

@Component({
  selector: 'app-estimate-assembly-hub',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusBadgeComponent, ModusButtonComponent, ModusTypographyComponent],
  template: `
    <div class="bg-card border-default rounded-lg overflow-hidden mb-6">
      <!-- Header -->
      <div class="px-5 pt-5 pb-4 flex flex-col gap-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <modus-typography  hierarchy="p" size="lg" weight="semibold" className="text-foreground">{{ hub().title }}</modus-typography>
            <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ hub().subtitle }}</modus-typography>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            @for (kpi of hub().kpis; track kpi.label) {
              <div class="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                <modus-typography hierarchy="p" size="xl" weight="bold" [className]="kpiValueClass(kpi)">{{ kpi.value }}</modus-typography>
                <modus-typography  hierarchy="p" size="xs" className="text-foreground-60">{{ kpi.label }}</modus-typography>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Sections -->
      @for (section of hub().sections; track section.name; let idx = $index) {
        <div class="border-top-default">
          <!-- Section header -->
          <div class="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-muted"
               (click)="toggleSection(idx)"
               (keydown.enter)="toggleSection(idx)"
               (keydown.space)="toggleSection(idx)"
               tabindex="0"
               role="button"
               [attr.aria-expanded]="isSectionExpanded(idx)">
            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">
              {{ isSectionExpanded(idx) ? 'expand_more' : 'chevron_right' }}
            </i>
            <modus-typography  hierarchy="p" weight="semibold" className="text-foreground">{{ section.name }}</modus-typography>
            <modus-badge [color]="sectionBadgeColor(section.status)" size="sm">
              {{ section.status }}
            </modus-badge>
            @if (section.owner) {
              <div class="ml-auto flex items-center gap-2">
                <div class="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                  <modus-typography size="xs" weight="bold" className="text-2xs">{{ section.ownerInitials }}</modus-typography>
                </div>
                <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ section.owner }}</modus-typography>
              </div>
            }
            <div class="flex items-center gap-2" [class.ml-auto]="!section.owner">
              <modus-typography  hierarchy="p" size="sm" weight="semibold" className="text-foreground">{{ section.completePct }}%</modus-typography>
              <div class="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all"
                     [class]="progressBarClass(section.completePct)"
                     [style.width.%]="section.completePct"></div>
              </div>
            </div>
          </div>

          <!-- Section description (if present and expanded) -->
          @if (isSectionExpanded(idx) && section.description) {
            <modus-typography  hierarchy="p" size="sm" className="px-5 pb-3 pl-12 text-foreground-60">{{ section.description }}</modus-typography>
          }

          <!-- Deliverables table -->
          @if (isSectionExpanded(idx) && section.deliverables.length > 0) {
            <div class="overflow-x-auto">
              <div class="min-w-[900px]">
                <!-- Table header -->
                <div class="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-2 px-5 py-2 bg-muted text-foreground-60 uppercase tracking-wide">
                  <modus-typography size="xs" weight="semibold">Deliverable</modus-typography>
                  <modus-typography size="xs" weight="semibold">Owner</modus-typography>
                  <modus-typography size="xs" weight="semibold">Handoff Status</modus-typography>
                  <modus-typography size="xs" weight="semibold">Context / Notes</modus-typography>
                  <modus-typography size="xs" weight="semibold" className="text-right">Actions</modus-typography>
                </div>
                <!-- Rows -->
                @for (d of section.deliverables; track d.name) {
                  <div class="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-2 px-5 py-3 border-top-default items-start">
                    <!-- Deliverable -->
                    <div>
                      <modus-typography  hierarchy="p" size="sm" className="font-medium text-foreground">{{ d.name }}</modus-typography>
                      <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ d.editedAgo }}</modus-typography>
                    </div>
                    <!-- Owner -->
                    <div class="flex items-center gap-2">
                      <div class="flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-foreground flex-shrink-0">
                        <modus-typography size="xs" weight="bold" className="text-2xs">{{ d.ownerInitials }}</modus-typography>
                      </div>
                      <div>
                        <modus-typography  hierarchy="p" size="sm" className="text-foreground">{{ d.owner }}</modus-typography>
                        <modus-typography  hierarchy="p" size="xs" className="text-foreground-40">{{ d.ownerRole }}</modus-typography>
                      </div>
                    </div>
                    <!-- Handoff Status -->
                    <div>
                      <modus-badge [color]="deliverableBadgeColor(d.status)" size="sm">
                        {{ d.statusLabel }}
                      </modus-badge>
                    </div>
                    <!-- Context / Notes -->
                    <div>
                      <modus-typography  hierarchy="p" size="sm" className="text-foreground-60">{{ d.context }}</modus-typography>
                      @if (d.warning) {
                        <div class="flex items-center gap-1 mt-1 text-destructive">
                          <i class="modus-icons text-xs" aria-hidden="true">warning</i>
                          <modus-typography size="xs">{{ d.warning }}</modus-typography>
                        </div>
                      }
                    </div>
                    <!-- Actions -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                      @if (d.primaryAction) {
                        <modus-button variant="filled" size="sm" color="primary">
                          {{ d.primaryAction }}
                        </modus-button>
                      }
                      @if (d.secondaryAction) {
                        <modus-button variant="outlined" size="sm" color="secondary">
                          {{ d.secondaryAction }}
                        </modus-button>
                      }
                      <modus-button variant="borderless" size="sm" icon="download" ariaLabel="Download" />
                      <modus-button variant="borderless" size="sm" icon="chat" ariaLabel="Comment" />
                      <modus-button variant="borderless" size="sm" icon="flag" ariaLabel="Flag" />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EstimateAssemblyHubComponent {
  readonly hub = input.required<EstimateAssemblyHub>();

  private readonly _overrides = signal<Map<number, boolean>>(new Map());

  isSectionExpanded(idx: number): boolean {
    const ov = this._overrides();
    if (ov.has(idx)) return ov.get(idx)!;
    return this.hub().sections[idx]?.expanded ?? false;
  }

  toggleSection(idx: number): void {
    const current = this.isSectionExpanded(idx);
    this._overrides.update(prev => {
      const next = new Map(prev);
      next.set(idx, !current);
      return next;
    });
  }

  kpiValueClass(kpi: AssemblyKpi): string {
    switch (kpi.color) {
      case 'destructive': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'primary': return 'text-primary';
      case 'success': return 'text-success';
      case 'secondary': return 'text-foreground';
      default: return 'text-foreground';
    }
  }

  sectionBadgeColor(status: AssemblySectionStatus): 'danger' | 'warning' | 'primary' | 'success' | 'secondary' {
    switch (status) {
      case 'Blocked': return 'danger';
      case 'Flagged': return 'danger';
      case 'Active': return 'primary';
      case 'In Progress': return 'primary';
      case 'Completed': return 'success';
    }
  }

  deliverableBadgeColor(status: AssemblyDeliverableStatus): 'danger' | 'warning' | 'primary' | 'success' | 'secondary' {
    switch (status) {
      case 'Blocked': return 'danger';
      case 'Flagged': return 'danger';
      case 'Handoff': return 'primary';
      case 'Validated': return 'success';
    }
  }

  progressBarClass(pct: number): string {
    if (pct >= 100) return 'bg-success';
    if (pct >= 50) return 'bg-primary';
    return 'bg-warning';
  }
}
