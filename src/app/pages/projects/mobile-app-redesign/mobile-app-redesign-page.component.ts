import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { HARBOR_VIEW_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-mobile-app-redesign-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="2" />`,
})
export class MobileAppRedesignPageComponent {
  readonly projectData = HARBOR_VIEW_PROJECT;
}
