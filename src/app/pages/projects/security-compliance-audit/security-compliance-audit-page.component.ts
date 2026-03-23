import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectDashboardComponent } from '../../project-dashboard/project-dashboard.component';
import { SECURITY_AUDIT_PROJECT } from '../../../data/project-data';

@Component({
  selector: 'app-security-compliance-audit-page',
  imports: [ProjectDashboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-project-dashboard [projectData]="projectData" [projectId]="6" />`,
})
export class SecurityComplianceAuditPageComponent {
  readonly projectData = SECURITY_AUDIT_PROJECT;
}
