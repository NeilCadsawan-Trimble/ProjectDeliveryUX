import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { TRANSIT_HUB_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-erp-system-upgrade-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="3" />`,
})
export class ErpSystemUpgradePageComponent {
  readonly projectData = TRANSIT_HUB_PROJECT;
}
