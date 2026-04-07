import { ChangeDetectionStrategy, Component, NgZone, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background flex items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        @if (authService.error()) {
          <div class="flex flex-col items-center gap-4 max-w-sm px-6">
            <i class="modus-icons text-4xl text-destructive" aria-hidden="true">warning</i>
            <div class="text-lg font-semibold text-foreground text-center">
              Authentication Failed
            </div>
            <div class="text-sm text-foreground-60 text-center">
              {{ authService.error() }}
            </div>
            <div
              class="text-sm text-primary cursor-pointer hover:underline"
              role="button"
              tabindex="0"
              (click)="goToLogin()"
              (keydown.enter)="goToLogin()"
            >
              Return to login
            </div>
          </div>
        } @else {
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div class="text-sm text-foreground-60">Completing sign-in...</div>
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
