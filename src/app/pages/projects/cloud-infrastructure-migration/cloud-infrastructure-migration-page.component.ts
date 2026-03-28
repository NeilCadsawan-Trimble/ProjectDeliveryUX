import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { RIVERSIDE_OFFICE_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-cloud-infrastructure-migration-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="1" />`,
})
export class CloudInfrastructureMigrationPageComponent {
  readonly projectData = RIVERSIDE_OFFICE_PROJECT;
}
