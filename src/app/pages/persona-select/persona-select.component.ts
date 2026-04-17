import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PERSONAS, type Persona } from '../../services/persona.service';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

const LANDING_SLUGS = ['frank', 'bert', 'kelly', 'pamela'] as const;

@Component({
  selector: 'app-persona-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusCardComponent, ModusTypographyComponent],
  template: `
    <div class="h-dvh bg-background flex flex-col items-center justify-center gap-10 px-6">
      <modus-typography hierarchy="h1" size="xl" weight="semibold" className="text-center">
        Select a persona
      </modus-typography>
      <div class="flex flex-col md:flex-row items-stretch gap-6">
        @for (persona of personas; track persona.slug) {
          <div
            role="button"
            tabindex="0"
            [attr.aria-label]="persona.name + ', ' + persona.title"
            (click)="selectPersona(persona)"
            (keydown.enter)="selectPersona(persona)"
          >
            <modus-card [padding]="'compact'" className="w-64 cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200">
              <div class="flex flex-col items-center justify-end gap-2 px-8 pt-16 pb-8">
                <modus-typography hierarchy="h2" size="lg" weight="semibold" className="text-center">
                  {{ persona.name }}
                </modus-typography>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60 text-center">
                  {{ persona.title }}
                </modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40 text-center">
                  {{ persona.company }}
                </modus-typography>
              </div>
            </modus-card>
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
