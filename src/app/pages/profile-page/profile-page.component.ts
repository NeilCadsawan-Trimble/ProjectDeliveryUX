import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col min-h-full bg-background">
      <div class="w-full max-w-[960px] mx-auto px-6 py-6 flex flex-col gap-6 flex-1">

        <div class="flex items-center justify-between">
          <div class="flex-1"></div>
          <div class="text-sm font-semibold tracking-wide text-foreground uppercase">My Profile</div>
          <div class="flex-1 flex items-center justify-end gap-3">
            <div
              class="text-sm text-foreground-60 cursor-pointer hover:text-foreground transition-colors"
            >Cancel</div>
            <div
              class="px-4 py-1.5 rounded text-sm font-medium transition-opacity"
              [class]="hasChanges() ? 'bg-primary text-primary-foreground cursor-pointer hover:opacity-90' : 'bg-secondary text-foreground-40 cursor-not-allowed'"
            >Save</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">

          <div class="flex flex-col gap-6">

            <div class="bg-card rounded-lg border-default p-6">
              <div class="text-base font-semibold text-foreground mb-6">Basic Information</div>

              <div class="flex justify-center mb-6">
                <div class="relative">
                  <div class="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                    <i class="modus-icons text-4xl text-foreground-40" aria-hidden="true">person</i>
                  </div>
                  <div class="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <i class="modus-icons text-xs text-primary-foreground" aria-hidden="true">edit_mode</i>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">
                    First Name <div class="inline text-destructive">*</div>
                  </div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background">
                    {{ firstName() }}
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">
                    Last Name <div class="inline text-destructive">*</div>
                  </div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background">
                    {{ lastName() }}
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-card rounded-lg border-default p-6">
              <div class="text-base font-semibold text-foreground mb-6">Preferences</div>

              <div class="flex flex-col gap-5">
                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">Country or Region</div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="text-sm">United States</div>
                    </div>
                    <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">State or Province</div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background flex items-center justify-between min-h-[36px]">
                    <div class="text-sm text-foreground-40"></div>
                    <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">Language</div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background flex items-center justify-between">
                    <div class="text-sm">English (United States)</div>
                    <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                  </div>
                </div>

                <div class="flex flex-col gap-1">
                  <div class="text-xs text-foreground-60">Time Zone</div>
                  <div class="border-default rounded px-3 py-2 text-sm text-foreground bg-background flex items-center justify-between">
                    <div class="text-sm">(GMT-08:00) Los Angeles, United States</div>
                    <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-6">

            <div class="bg-card rounded-lg border-default p-6">
              <div class="text-base font-semibold text-foreground mb-4">Account management</div>

              <div class="text-sm font-semibold text-foreground mb-1">Accounts</div>
              <div class="text-xs text-foreground-60 mb-3">Switch between your accounts to access different products and services.</div>

              <div class="flex items-center gap-2 mb-2">
                <div class="text-sm font-semibold text-foreground">{{ persona().company }}</div>
                <div class="px-2 py-0.5 rounded text-2xs font-medium bg-secondary text-foreground">Default</div>
              </div>
              <div class="text-sm text-primary cursor-pointer hover:underline mb-6">Switch account</div>

              <div class="border-top-default pt-4">
                <div class="text-sm font-semibold text-foreground mb-3">Profile details</div>
                <div class="bg-primary-20 border-primary rounded px-4 py-3 flex items-start gap-3">
                  <i class="modus-icons text-base text-primary mt-0.5" aria-hidden="true">info</i>
                  <div class="text-xs text-foreground leading-relaxed">
                    If you need to change your email address, password, or make changes to your account, please contact your administrator.
                  </div>
                </div>
              </div>

              <div class="border-top-default mt-5 pt-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-foreground">Manage passkeys</div>
                  <div class="text-sm text-primary cursor-pointer hover:underline">Create a passkey</div>
                </div>
                <div class="text-xs text-foreground-60 leading-relaxed">
                  Sign in faster and more securely with passkeys. Passkeys replace passwords with your fingerprint, face ID, or device screen lock, or device screen lock. Learn more about passkeys.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="w-full max-w-[960px] mx-auto px-6 pb-4">
        <div class="flex items-center justify-center gap-2 text-xs text-foreground-40 py-4 flex-wrap">
          <div class="cursor-pointer hover:text-primary">Help</div>
          <div>|</div>
          <div class="cursor-pointer hover:text-primary">Privacy Notice</div>
          <div>|</div>
          <div class="cursor-pointer hover:text-primary">Terms of Use</div>
          <div>|</div>
          <div class="cursor-pointer hover:text-primary">CA Notice at Collection</div>
          <div>|</div>
          <div class="cursor-pointer hover:text-primary">Your Privacy Choices</div>
        </div>
        <div class="text-center text-2xs text-foreground-40">
          &copy;{{ currentYear }}, Trimble Inc. All rights reserved.
        </div>
      </div>
    </div>
  `,
})
export class ProfilePageComponent {
  private readonly personaService = inject(PersonaService);

  readonly persona = this.personaService.activePersona;
  readonly currentYear = new Date().getFullYear();
  readonly hasChanges = signal(false);

  readonly firstName = computed(() => {
    const parts = this.persona().name.split(' ');
    return parts[0] ?? '';
  });

  readonly lastName = computed(() => {
    const parts = this.persona().name.split(' ');
    return parts.slice(1).join(' ');
  });
}
