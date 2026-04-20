import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { PersonaService } from '../../services/persona.service';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusButtonComponent } from '../../components/modus-button.component';

@Component({
  selector: 'app-account-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusCardComponent, ModusButtonComponent],
  template: `
    <div class="flex flex-col min-h-full bg-background">
      <div class="w-full max-w-[960px] mx-auto px-6 py-8 flex flex-col gap-8 flex-1">

        <modus-typography hierarchy="h1">Account Settings</modus-typography>

        <modus-card [padding]="'compact'" className="border-dashed">
          <div class="p-8 flex flex-col gap-8">

            <div class="flex flex-col gap-3">
              <modus-typography hierarchy="h2" size="lg" weight="bold">Account Owner</modus-typography>
              <div class="flex items-start gap-8">
                <div class="flex flex-col gap-2 max-w-[480px]">
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    The account owner is the primary admin of the account. They have access to all account, license, and user management. This role is required.
                  </modus-typography>
                  <modus-button color="warning" variant="borderless" size="sm">Transfer</modus-button>
                </div>

                <div class="bg-secondary border-default rounded-lg px-6 py-5 flex items-center gap-4 min-w-[320px]">
                  <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">person</i>
                  </div>
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <modus-typography hierarchy="p" size="sm" weight="semibold">{{ persona().name }} (you)</modus-typography>
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ persona().email }}</modus-typography>
                  </div>
                  <div class="ml-auto">
                    <modus-button color="secondary" variant="outlined" size="sm">Transfer account</modus-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-top-default"></div>

            <div class="flex flex-col gap-3">
              <modus-typography hierarchy="h2" size="lg" weight="bold">Secondary Account Owners</modus-typography>
              <div class="flex items-start gap-8">
                <div class="flex flex-col gap-2 max-w-[480px]">
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">
                    Secondary account owners have access to all account, license, and user management if the account owner is unavailable. This role is optional.
                  </modus-typography>
                  <modus-button color="warning" variant="borderless" size="sm">Add new</modus-button>
                </div>

                <div class="flex flex-col items-center gap-3 min-w-[320px] py-4">
                  <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <i class="modus-icons text-2xl text-foreground-40" aria-hidden="true">people_group</i>
                  </div>
                  <modus-typography hierarchy="p" size="sm" weight="semibold" className="text-center">
                    No Secondary Account Owners yet
                  </modus-typography>
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 text-center">
                    Add Secondary Account Owners to help you manage this account.
                  </modus-typography>
                  <modus-button color="warning" variant="outlined" size="sm">Add user</modus-button>
                </div>
              </div>
            </div>
          </div>
        </modus-card>

      </div>

      <div class="w-full bg-foreground text-background px-8 py-6">
        <div class="max-w-[960px] mx-auto grid grid-cols-[auto_1fr_auto] gap-8 items-start">
          <div class="flex flex-col gap-1 flex-shrink-0">
            <modus-typography hierarchy="p" size="lg" weight="bold" className="tracking-tight">Trimble.</modus-typography>
            <modus-typography hierarchy="p" size="xs" className="text-background-60">&copy; {{ currentYear }}, Trimble Inc.</modus-typography>
          </div>
          <modus-typography hierarchy="p" size="xs" className="leading-relaxed text-background-60">
            Trimble is a global technology company that connects the physical and digital worlds, transforming the ways work gets done. With relentless innovation in precise positioning, modeling and data analytics, Trimble enables essential industries including construction, geospatial and transportation. Whether it's helping customers build and maintain infrastructure, design and construct buildings, optimize global supply chains or map the world, Trimble is at the forefront, driving productivity and progress.
          </modus-typography>
          <div class="flex flex-col gap-1 flex-shrink-0">
            <modus-button color="secondary" variant="borderless" size="sm">Legal Terms and Conditions</modus-button>
            <modus-button color="secondary" variant="borderless" size="sm">Website Terms of Use</modus-button>
            <modus-button color="secondary" variant="borderless" size="sm">Privacy Center</modus-button>
            <modus-button color="secondary" variant="borderless" size="sm">Privacy Notice</modus-button>
            <modus-button color="secondary" variant="borderless" size="sm">California Notice at Collection</modus-button>
            <modus-button color="secondary" variant="borderless" size="sm">Your Privacy Choices (US)</modus-button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccountSettingsPageComponent {
  private readonly personaService = inject(PersonaService);

  readonly persona = this.personaService.activePersona;
  readonly currentYear = new Date().getFullYear();
}
