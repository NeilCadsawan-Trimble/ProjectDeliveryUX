import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { SUNSET_RIDGE_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-api-gateway-modernization-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="7" />`,
})
export class ApiGatewayModernizationPageComponent {
  readonly projectData = SUNSET_RIDGE_PROJECT;
}
