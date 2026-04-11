import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { PersonaService } from '../../services/persona.service';

@Component({
  selector: 'app-account-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col min-h-full bg-background">
      <div class="w-full max-w-[960px] mx-auto px-6 py-8 flex flex-col gap-8 flex-1">

        <div class="text-2xl font-bold text-foreground">Account Settings</div>

        <div class="border-dashed rounded-lg p-8 flex flex-col gap-8 bg-card">

          <!-- Account Owner -->
          <div class="flex flex-col gap-3">
            <div class="text-lg font-bold text-foreground">Account Owner</div>
            <div class="flex items-start gap-8">
              <div class="flex flex-col gap-2 max-w-[480px]">
                <div class="text-sm text-foreground-60">
                  The account owner is the primary admin of the account. They have access to all account, license, and user management. This role is required.
                </div>
                <div class="text-sm font-semibold text-foreground cursor-pointer underline decoration-warning decoration-2 underline-offset-4">Transfer</div>
              </div>

              <div class="bg-secondary border-default rounded-lg px-6 py-5 flex items-center gap-4 min-w-[320px]">
                <div class="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">person</i>
                </div>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <div class="text-sm font-semibold text-foreground">{{ persona().name }} (you)</div>
                  <div class="text-xs text-foreground-60 truncate">{{ persona().email }}</div>
                </div>
                <div class="ml-auto">
                  <div class="px-3 py-1.5 border-foreground rounded text-xs font-medium text-foreground cursor-pointer hover:bg-muted transition-colors">
                    Transfer account
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border-top-default"></div>

          <!-- Secondary Account Owners -->
          <div class="flex flex-col gap-3">
            <div class="text-lg font-bold text-foreground">Secondary Account Owners</div>
            <div class="flex items-start gap-8">
              <div class="flex flex-col gap-2 max-w-[480px]">
                <div class="text-sm text-foreground-60">
                  Secondary account owners have access to all account, license, and user management if the account owner is unavailable. This role is optional.
                </div>
                <div class="text-sm font-semibold text-foreground cursor-pointer underline decoration-warning decoration-2 underline-offset-4">Add new</div>
              </div>

              <div class="flex flex-col items-center gap-3 min-w-[320px] py-4">
                <div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <i class="modus-icons text-2xl text-foreground-40" aria-hidden="true">people_group</i>
                </div>
                <div class="text-sm font-semibold text-foreground text-center">No Secondary Account Owners yet</div>
                <div class="text-xs text-foreground-60 text-center">Add Secondary Account Owners to help you manage this account.</div>
                <div class="mt-1 px-4 py-1.5 rounded border-warning text-sm font-medium text-warning cursor-pointer hover:bg-warning-20 transition-colors">
                  Add user
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="w-full bg-foreground text-background px-8 py-6">
        <div class="max-w-[960px] mx-auto grid grid-cols-[auto_1fr_auto] gap-8 items-start">
          <div class="flex flex-col gap-1 flex-shrink-0">
            <div class="text-lg font-bold tracking-tight">Trimble.</div>
            <div class="text-2xs text-background-60">&copy; {{ currentYear }}, Trimble Inc.</div>
          </div>
          <div class="text-2xs leading-relaxed text-background-60">
            Trimble is a global technology company that connects the physical and digital worlds, transforming the ways work gets done. With relentless innovation in precise positioning, modeling and data analytics, Trimble enables essential industries including construction, geospatial and transportation. Whether it's helping customers build and maintain infrastructure, design and construct buildings, optimize global supply chains or map the world, Trimble is at the forefront, driving productivity and progress.
          </div>
          <div class="flex flex-col gap-1 text-xs flex-shrink-0">
            <div class="cursor-pointer hover:underline">Legal Terms and Conditions</div>
            <div class="cursor-pointer hover:underline">Website Terms of Use</div>
            <div class="cursor-pointer hover:underline">Privacy Center</div>
            <div class="cursor-pointer hover:underline">Privacy Notice</div>
            <div class="cursor-pointer hover:underline">California Notice at Collection</div>
            <div class="cursor-pointer hover:underline">Your Privacy Choices (US)</div>
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
