import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
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
  styles: [':host { display: contents; }'],
  template: `
    <div class="flex flex-col gap-2 h-full min-h-0 p-4">
      <div class="flex items-center gap-2 shrink-0">
        <div class="flex items-center bg-secondary rounded">
          <div class="px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors"
            [class]="viewMode() === 'person' ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground'"
            (click)="viewMode.set('person')">By Person</div>
          <div class="px-3 py-1 text-xs font-medium rounded cursor-pointer transition-colors"
            [class]="viewMode() === 'project' ? 'bg-primary text-primary-foreground' : 'text-foreground-60 hover:text-foreground'"
            (click)="viewMode.set('project')">By Project</div>
        </div>
        @if (overallocatedCount() > 0) {
          <div class="text-2xs font-medium text-destructive">{{ overallocatedCount() }} overallocated</div>
        }
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        @if (viewMode() === 'person') {
          @for (person of people(); track person.name) {
            <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div class="text-sm font-medium text-foreground truncate">{{ person.name }}</div>
                  @if (person.overallocated) {
                    <div class="rounded px-1.5 py-0.5 bg-destructive-20 text-2xs font-medium text-destructive shrink-0">{{ person.projects.length }} projects</div>
                  }
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <div class="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div class="h-full rounded-full" [class]="person.avgAvailability < 30 ? 'bg-destructive' : person.avgAvailability < 60 ? 'bg-warning' : 'bg-success'" [style.width.%]="person.avgAvailability"></div>
                  </div>
                  <div class="text-2xs tabular-nums text-foreground-60 w-8 text-right">{{ person.avgAvailability }}%</div>
                </div>
              </div>
              <div class="flex items-center gap-2 text-2xs text-foreground-60">
                <div>{{ person.role }}</div>
                <div class="w-1 h-1 rounded-full bg-foreground-20"></div>
                <div>{{ person.totalTasksCompleted }}/{{ person.totalTasksTotal }} tasks</div>
              </div>
              <div class="flex flex-wrap gap-1 mt-0.5">
                @for (proj of person.projects; track proj) {
                  <div class="rounded px-1.5 py-0.5 bg-primary-20 text-2xs text-primary">{{ proj }}</div>
                }
              </div>
            </div>
          }
        } @else {
          @for (pt of projectTeams(); track pt.projectName) {
            <div class="flex flex-col gap-1 py-2 border-bottom-default last:border-b-0">
              <div class="flex items-center justify-between gap-2">
                <div class="text-sm font-medium text-foreground truncate min-w-0 flex-1">{{ pt.projectName }}</div>
                <div class="text-2xs text-foreground-60 shrink-0">{{ pt.team.length }} members</div>
              </div>
              <div class="flex flex-wrap gap-1">
                @for (m of pt.team; track m.id) {
                  <div class="rounded px-1.5 py-0.5 text-2xs"
                    [class]="m.availability < 30 ? 'bg-destructive-20 text-destructive' : m.availability < 60 ? 'bg-warning-20 text-warning' : 'bg-muted text-foreground-60'">
                    {{ m.name }} ({{ m.availability }}%)
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
