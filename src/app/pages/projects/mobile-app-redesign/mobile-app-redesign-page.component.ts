import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { MOBILE_APP_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-mobile-app-redesign-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="2" />`,
})
export class MobileAppRedesignPageComponent {
  readonly projectData = MOBILE_APP_PROJECT;
}
