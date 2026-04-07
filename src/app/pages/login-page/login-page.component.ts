import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { TrimbleLogoComponent } from '../../shell/components/trimble-logo.component';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusButtonComponent, TrimbleLogoComponent],
  template: `
    <div class="h-dvh bg-background flex items-center justify-center overflow-auto">
      <div class="flex flex-col items-center gap-8 max-w-sm w-full px-6">
        <div class="flex flex-col items-center gap-4">
          <div class="w-16 h-16">
            <app-trimble-logo class="block w-full h-full" />
          </div>
          <div class="text-2xl font-semibold text-foreground text-center">
            Project Delivery
          </div>
          <div class="text-sm text-foreground-60 text-center">
            Sign in with your Trimble Identity to continue
          </div>
        </div>

        @if (authService.error()) {
          <div class="w-full bg-destructive-20 border-destructive rounded-md px-4 py-3">
            <div class="text-sm text-destructive flex items-center gap-2">
              <i class="modus-icons text-base" aria-hidden="true">warning</i>
              {{ authService.error() }}
            </div>
          </div>
        }

        <div class="w-full flex flex-col gap-3">
          @if (authService.isLoading()) {
            <div class="flex items-center justify-center gap-2 py-3">
              <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div class="text-sm text-foreground-60">Redirecting to Trimble Identity...</div>
            </div>
          } @else {
            <modus-button
              color="primary"
              variant="filled"
              class="w-full"
              (buttonClick)="onSignIn()"
            >
              <div class="flex items-center justify-center gap-2 w-full">
                <i class="modus-icons text-lg" aria-hidden="true">person</i>
                Sign in with Trimble ID
              </div>
            </modus-button>
          }
        </div>

        <div class="text-2xs text-foreground-40 text-center">
          &copy; {{ currentYear }}, Trimble Inc. All rights reserved.
        </div>
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
