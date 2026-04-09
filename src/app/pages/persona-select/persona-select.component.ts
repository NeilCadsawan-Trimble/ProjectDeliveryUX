import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PERSONAS, type Persona } from '../../services/persona.service';

const LANDING_SLUGS = ['frank', 'bert', 'kelly'] as const;

@Component({
  selector: 'app-persona-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-dvh bg-foreground flex flex-col items-center justify-center gap-10 px-6">
      <div class="text-2xl font-semibold text-background text-center">
        Select a persona
      </div>
      <div class="flex flex-col md:flex-row items-stretch gap-6">
        @for (persona of personas; track persona.slug) {
          <div
            class="bg-card rounded-lg px-8 pt-16 pb-8 w-64 flex flex-col items-center justify-end gap-2 cursor-pointer
                   hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
            role="button"
            tabindex="0"
            [attr.aria-label]="persona.name + ', ' + persona.title"
            (click)="selectPersona(persona)"
            (keydown.enter)="selectPersona(persona)"
          >
            <div class="text-2xl font-semibold text-foreground text-center">
              {{ persona.name }}
            </div>
            <div class="text-base text-foreground-60 text-center">
              {{ persona.title }}
            </div>
            <div class="text-sm text-foreground-40 text-center">
              {{ persona.company }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class PersonaSelectComponent {
  private readonly router = inject(Router);

  readonly personas: Persona[] = PERSONAS.filter(p =>
    (LANDING_SLUGS as readonly string[]).includes(p.slug),
  );

  selectPersona(persona: Persona): void {
    void this.router.navigateByUrl(`/${persona.slug}`);
  }
}
