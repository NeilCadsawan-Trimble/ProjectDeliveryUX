import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { ML_PIPELINE_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-ml-model-deployment-pipeline-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="8" />`,
})
export class MlModelDeploymentPipelinePageComponent {
  readonly projectData = ML_PIPELINE_PROJECT;
}
