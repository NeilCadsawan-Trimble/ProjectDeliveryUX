import { ChangeDetectionStrategy, Component, NgZone, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLoaderComponent } from '../../components/modus-loader.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusLoaderComponent, ModusButtonComponent],
  template: `
    <div class="min-h-screen bg-background flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        @if (authService.error()) {
          <div class="flex flex-col items-center gap-4 max-w-sm px-6">
            <i class="modus-icons text-4xl text-error" aria-hidden="true">warning</i>
            <modus-typography hierarchy="h1" className="text-center">
              Authentication Failed
            </modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-center">
              {{ authService.error() }}
            </modus-typography>
            <modus-button
              color="primary"
              variant="borderless"
              (buttonClick)="goToLogin()"
            >
              Return to login
            </modus-button>
          </div>
        } @else {
          <modus-loader size="sm" color="primary" />
          <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
            Completing sign-in...
          </modus-typography>
        }
      </div>
    </div>
  `,
})
export class AuthCallbackComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  async ngOnInit(): Promise<void> {
    const queryString = window.location.search;
    if (!queryString) {
      this.router.navigate(['/login']);
      return;
    }

    const success = await this.authService.handleCallback(queryString);
    if (success) {
      const returnUrl = this.authService.getReturnUrl();
      this.authService.clearReturnUrl();
      this.ngZone.run(() => {
        this.router.navigateByUrl(returnUrl).then(navigated => {
          if (!navigated) {
            window.location.replace(returnUrl);
          }
        });
      });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
