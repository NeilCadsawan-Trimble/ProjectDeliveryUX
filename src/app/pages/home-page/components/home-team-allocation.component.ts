import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ModusTypographyComponent } from '../../../components/modus-typography.component';
import type { TeamMember } from '../../../data/project-data';

export interface ProjectTeamInput {
  projectId: number;
  projectName: string;
  team: TeamMember[];
}

interface PersonRow {
  name: string;
  role: string;
  projects: string[];
  avgAvailability: number;
  totalTasksCompleted: number;
  totalTasksTotal: number;
  overallocated: boolean;
}

@Component({
  selector: 'app-home-team-allocation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 py-4">
      <div class="flex items-center gap-2 shrink-0 px-4">
        <div class="flex items-center bg-secondary rounded">
          <div class="px-3 py-1 rounded cursor-pointer transition-colors"
            [class]="viewMode() === 'person' ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground'"
            (click)="viewMode.set('person')"><modus-typography size="xs" weight="semibold">By Person</modus-typography></div>
          <div class="px-3 py-1 rounded cursor-pointer transition-colors"
            [class]="viewMode() === 'project' ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground'"
            (click)="viewMode.set('project')"><modus-typography size="xs" weight="semibold">By Project</modus-typography></div>
        </div>
        @if (overallocatedCount() > 0) {
          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-destructive">{{ overallocatedCount() }} overallocated</modus-typography>
        }
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto px-4 mb-5">
        @if (viewMode() === 'person') {
          @for (person of people(); track person.name) {
            <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ person.name }}</modus-typography>
                  @if (person.overallocated) {
                    <div class="rounded px-1.5 py-0.5 bg-destructive-20 text-destructive shrink-0"><modus-typography size="xs" weight="semibold" className="text-2xs">{{ person.projects.length }} projects</modus-typography></div>
                  }
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div class="h-full rounded-full" [class]="person.avgAvailability < 30 ? 'bg-destructive' : person.avgAvailability < 60 ? 'bg-warning' : 'bg-success'" [style.width.%]="person.avgAvailability"></div>
                  </div>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 tabular-nums w-8 text-right">{{ person.avgAvailability }}%</modus-typography>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ person.role }}</modus-typography>
                <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ person.totalTasksCompleted }}/{{ person.totalTasksTotal }} tasks</modus-typography>
              </div>
              <div class="flex flex-wrap gap-1 mt-0.5">
                @for (proj of person.projects; track proj) {
                  <div class="rounded px-1.5 py-0.5 bg-primary-20 text-primary"><modus-typography size="xs" className="text-2xs">{{ proj }}</modus-typography></div>
                }
              </div>
            </div>
          }
        } @else {
          @for (pt of projectTeams(); track pt.projectName) {
            <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0 cursor-pointer hover:bg-muted transition-colors duration-150"
              role="button" tabindex="0"
              (click)="projectClick.emit(pt.projectId)"
              (keydown.enter)="projectClick.emit(pt.projectId)">
              <div class="flex items-center justify-between gap-2">
                <modus-typography class="min-w-0 flex-1" hierarchy="p" size="sm" weight="semibold" className="text-foreground truncate">{{ pt.projectName }}</modus-typography>
                <modus-typography class="shrink-0" hierarchy="p" size="xs" className="text-foreground-60">{{ pt.team.length }} members</modus-typography>
              </div>
              <div class="flex flex-wrap gap-1">
                @for (m of pt.team; track m.id) {
                  <div class="rounded px-1.5 py-0.5"
                    [class]="m.availability < 30 ? 'bg-destructive-20 text-destructive' : m.availability < 60 ? 'bg-warning-20 text-warning' : 'bg-muted text-foreground-60'">
                    <modus-typography size="xs" className="text-2xs">{{ m.name }} ({{ m.availability }}%)</modus-typography>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class HomeTeamAllocationComponent {
  readonly projectTeams = input.required<ProjectTeamInput[]>();
  readonly projectClick = output<number>();
  readonly viewMode = signal<'person' | 'project'>('person');

  readonly people = computed<PersonRow[]>(() => {
    const teams = this.projectTeams();
    const personMap = new Map<string, PersonRow>();
    for (const pt of teams) {
      for (const m of pt.team) {
        const existing = personMap.get(m.name);
        if (existing) {
          existing.projects.push(pt.projectName);
          existing.avgAvailability = Math.round((existing.avgAvailability * (existing.projects.length - 1) + m.availability) / existing.projects.length);
          existing.totalTasksCompleted += m.tasksCompleted;
          existing.totalTasksTotal += m.tasksTotal;
          existing.overallocated = existing.projects.length >= 3;
        } else {
          personMap.set(m.name, {
            name: m.name,
            role: m.role,
            projects: [pt.projectName],
            avgAvailability: m.availability,
            totalTasksCompleted: m.tasksCompleted,
            totalTasksTotal: m.tasksTotal,
            overallocated: false,
          });
        }
      }
    }
    return [...personMap.values()].sort((a, b) => a.avgAvailability - b.avgAvailability);
  });

  readonly overallocatedCount = computed(() => this.people().filter((p) => p.overallocated).length);
}
