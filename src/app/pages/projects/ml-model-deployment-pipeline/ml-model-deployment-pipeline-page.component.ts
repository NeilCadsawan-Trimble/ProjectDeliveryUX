import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { DataStoreService } from '../../../data/data-store.service';

@Component({
  selector: 'app-ml-model-deployment-pipeline-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData()" [projectId]="8" />`,
})
export class MlModelDeploymentPipelinePageComponent {
  private readonly store = inject(DataStoreService);
  readonly projectData = computed(() => this.store.projectDetailData()[8]);
}
