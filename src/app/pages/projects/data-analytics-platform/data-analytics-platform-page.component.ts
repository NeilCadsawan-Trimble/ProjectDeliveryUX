import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { LAKESIDE_MEDICAL_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-data-analytics-platform-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="4" />`,
})
export class DataAnalyticsPlatformPageComponent {
  readonly projectData = LAKESIDE_MEDICAL_PROJECT;
}
