import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusAlertComponent } from '../../components/modus-alert.component';
import { ModusLoaderComponent } from '../../components/modus-loader.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLogoComponent } from '../../components/modus-logo.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModusButtonComponent,
    ModusCardComponent,
    ModusAlertComponent,
    ModusLoaderComponent,
    ModusTypographyComponent,
    ModusLogoComponent,
  ],
  template: `
    <div class="h-dvh bg-background flex items-center justify-center overflow-auto">
      <div class="max-w-sm w-full px-6">
        <modus-card [padding]="'compact'">
          <div class="flex flex-col items-center gap-8 p-6">
            <div class="flex flex-col items-center gap-4">
              <modus-logo name="trimble" [emblem]="true" customClass="w-16 h-16" />
              <modus-typography hierarchy="h1" className="text-center">
                Construction One
              </modus-typography>
              <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-center">
                Sign in with your Trimble Identity to continue
              </modus-typography>
            </div>

            @if (authService.error()) {
              <modus-alert
                [alertTitle]="authService.error()!"
                variant="error"
                icon="warning"
              />
            }

            <div class="flex flex-col items-center gap-3 w-full">
              @if (authService.isLoading()) {
                <div class="flex items-center justify-center gap-2 py-3">
                  <modus-loader size="sm" color="primary" />
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    Redirecting to Trimble Identity...
                  </modus-typography>
                </div>
              } @else {
                <modus-button
                  color="primary"
                  variant="filled"
                  icon="person"
                  iconPosition="left"
                  (buttonClick)="onSignIn()"
                >
                  Sign in with Trimble ID
                </modus-button>
              }
            </div>

            <modus-typography hierarchy="p" size="xs" className="text-foreground-40 text-center">
              &copy; {{ currentYear }}, Trimble Inc. All rights reserved.
            </modus-typography>
          </div>
        </modus-card>
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  readonly authService = inject(AuthService);
  readonly currentYear = new Date().getFullYear();

  onSignIn(): void {
    this.authService.login();
  }
}
