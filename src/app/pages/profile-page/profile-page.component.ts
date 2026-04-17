import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { PersonaService } from '../../services/persona.service';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import { ModusAlertComponent } from '../../components/modus-alert.component';
import { ModusBadgeComponent } from '../../components/modus-badge.component';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusCardComponent, ModusButtonComponent, ModusAlertComponent, ModusBadgeComponent],
  template: `
    <div class="flex flex-col min-h-full bg-background">
      <div class="w-full max-w-[960px] mx-auto px-6 py-6 flex flex-col gap-6 flex-1">

        <div class="flex items-center justify-between">
          <div class="flex-1"></div>
          <modus-typography hierarchy="h1" size="sm" weight="semibold" className="tracking-wide uppercase">
            My Profile
          </modus-typography>
          <div class="flex-1 flex items-center justify-end gap-3">
            <modus-button color="secondary" variant="borderless" size="sm">
              Cancel
            </modus-button>
            <modus-button
              [color]="hasChanges() ? 'primary' : 'secondary'"
              variant="filled"
              size="sm"
              [disabled]="!hasChanges()"
            >
              Save
            </modus-button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">

          <div class="flex flex-col gap-6">

            <modus-card [padding]="'compact'">
              <div class="p-6">
                <modus-typography hierarchy="h2" size="md" weight="semibold" className="mb-6">
                  Basic Information
                </modus-typography>

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
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">
                      First Name <div class="inline text-error">*</div>
                    </modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background">
                      <modus-typography hierarchy="p" size="sm">{{ firstName() }}</modus-typography>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">
                      Last Name <div class="inline text-error">*</div>
                    </modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background">
                      <modus-typography hierarchy="p" size="sm">{{ lastName() }}</modus-typography>
                    </div>
                  </div>
                </div>
              </div>
            </modus-card>

            <modus-card [padding]="'compact'">
              <div class="p-6">
                <modus-typography hierarchy="h2" size="md" weight="semibold" className="mb-6">
                  Preferences
                </modus-typography>

                <div class="flex flex-col gap-5">
                  <div class="flex flex-col gap-1">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Country or Region</modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background flex items-center justify-between">
                      <modus-typography hierarchy="p" size="sm">United States</modus-typography>
                      <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">State or Province</modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background flex items-center justify-between min-h-[36px]">
                      <div></div>
                      <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Language</modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background flex items-center justify-between">
                      <modus-typography hierarchy="p" size="sm">English (United States)</modus-typography>
                      <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                    </div>
                  </div>

                  <div class="flex flex-col gap-1">
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">Time Zone</modus-typography>
                    <div class="border-default rounded px-3 py-2 bg-background flex items-center justify-between">
                      <modus-typography hierarchy="p" size="sm">(GMT-08:00) Los Angeles, United States</modus-typography>
                      <i class="modus-icons text-sm text-foreground-40" aria-hidden="true">expand_more</i>
                    </div>
                  </div>
                </div>
              </div>
            </modus-card>
          </div>

          <div class="flex flex-col gap-6">

            <modus-card [padding]="'compact'">
              <div class="p-6">
                <modus-typography hierarchy="h2" size="md" weight="semibold" className="mb-4">
                  Account management
                </modus-typography>

                <modus-typography hierarchy="h3" size="sm" weight="semibold" className="mb-1">
                  Accounts
                </modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mb-3">
                  Switch between your accounts to access different products and services.
                </modus-typography>

                <div class="flex items-center gap-2 mb-2">
                  <modus-typography hierarchy="p" size="sm" weight="semibold">
                    {{ persona().company }}
                  </modus-typography>
                  <modus-badge color="secondary" size="sm">Default</modus-badge>
                </div>
                <modus-button color="primary" variant="borderless" size="sm" className="mb-6">
                  Switch account
                </modus-button>

                <div class="border-top-default pt-4">
                  <modus-typography hierarchy="h3" size="sm" weight="semibold" className="mb-3">
                    Profile details
                  </modus-typography>
                  <modus-alert
                    alertTitle="If you need to change your email address, password, or make changes to your account, please contact your administrator."
                    variant="info"
                    icon="info"
                  />
                </div>

                <div class="border-top-default mt-5 pt-4">
                  <div class="flex items-center justify-between mb-2">
                    <modus-typography hierarchy="h3" size="sm" weight="semibold">
                      Manage passkeys
                    </modus-typography>
                    <modus-button color="primary" variant="borderless" size="sm">
                      Create a passkey
                    </modus-button>
                  </div>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 leading-relaxed">
                    Sign in faster and more securely with passkeys. Passkeys replace passwords with your fingerprint, face ID, or device screen lock, or device screen lock. Learn more about passkeys.
                  </modus-typography>
                </div>
              </div>
            </modus-card>
          </div>
        </div>

      </div>

      <div class="w-full max-w-[960px] mx-auto px-6 pb-4">
        <div class="flex items-center justify-center gap-2 py-4 flex-wrap">
          <modus-button color="secondary" variant="borderless" size="sm">Help</modus-button>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">|</modus-typography>
          <modus-button color="secondary" variant="borderless" size="sm">Privacy Notice</modus-button>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">|</modus-typography>
          <modus-button color="secondary" variant="borderless" size="sm">Terms of Use</modus-button>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">|</modus-typography>
          <modus-button color="secondary" variant="borderless" size="sm">CA Notice at Collection</modus-button>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">|</modus-typography>
          <modus-button color="secondary" variant="borderless" size="sm">Your Privacy Choices</modus-button>
        </div>
        <modus-typography hierarchy="p" size="xs" className="text-center text-foreground-40">
          &copy;{{ currentYear }}, Trimble Inc. All rights reserved.
        </modus-typography>
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
