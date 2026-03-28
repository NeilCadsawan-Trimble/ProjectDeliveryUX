import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { WESTFIELD_SHOPPING_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-customer-portal-v3-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="5" />`,
})
export class CustomerPortalV3PageComponent {
  readonly projectData = WESTFIELD_SHOPPING_PROJECT;
}
