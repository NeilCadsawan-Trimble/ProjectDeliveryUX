import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { DataStoreService } from '../../data/data-store.service';
import { PersonaService } from '../../services/persona.service';
import { ProjectDashboardComponent } from './project-dashboard.component';

@Component({
  selector: 'app-project-slug-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (projectId(); as pid) {
      @if (projectData(); as pd) {
        <app-project-dashboard [projectData]="pd" [projectId]="pid" />
      }
    }
  `,
})
export class ProjectSlugPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(DataStoreService);
  private readonly personaService = inject(PersonaService);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug'))),
    { initialValue: null },
  );

  readonly projectId = computed(() => {
    const s = this.slug();
    if (!s) return null;
    return this.store.findProjectBySlug(s)?.id ?? null;
  });

  readonly projectData = computed(() => {
    const id = this.projectId();
    if (id === null) return undefined;
    return this.store.projectDetailData()[id];
  });

  constructor() {
    effect(() => {
      const s = this.slug();
      const id = this.projectId();
      if (s !== null && s.length > 0 && id === null) {
        const pp = this.personaService.activePersonaSlug();
        untracked(() => void this.router.navigate([`/${pp}/projects`]));
      }
    });
  }
}
