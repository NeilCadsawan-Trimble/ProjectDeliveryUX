import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { ERP_UPGRADE_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-erp-system-upgrade-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="3" />`,
})
export class ErpSystemUpgradePageComponent {
  readonly projectData = ERP_UPGRADE_PROJECT;
}
