import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { PERSONAS } from '../../services/persona.service';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

export interface UserMenuItem {
  id: string;
  label: string;
  icon: string;
  url?: string;
}

const SECTION_1_ITEMS: UserMenuItem[] = [
  { id: 'profile', label: 'My profile', icon: 'person' },
  { id: 'products', label: 'My products', icon: 'home' },
  { id: 'support', label: 'Support center', icon: 'chat', url: 'https://www.trimble.com/en/support' },
  { id: 'admin', label: 'Account settings', icon: 'cloud_download' },
];

const VISIBLE_PERSONA_SLUGS = new Set(['frank', 'bert', 'kelly', 'pamela']);

const PERSONA_MENU_ITEMS: UserMenuItem[] = PERSONAS
  .filter(p => VISIBLE_PERSONA_SLUGS.has(p.slug))
  .map(p => ({
    id: p.slug,
    label: p.name,
    icon: 'person',
  }));

@Component({
  selector: 'user-menu',
  imports: [ModusTypographyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <div
      class="flex items-center justify-center w-8 h-8 rounded-full cursor-pointer overflow-hidden select-none"
      role="button"
      aria-label="User profile"
      [attr.aria-expanded]="isOpen()"
      (click)="toggle(); $event.stopPropagation()"
      (keydown.enter)="toggle(); $event.stopPropagation()"
      tabindex="0"
    >
      @if (avatarSrc()) {
        <img [src]="avatarSrc()" [alt]="name()" class="w-full h-full object-cover" />
      } @else {
        <div class="w-full h-full flex items-center justify-center bg-secondary">
          <modus-typography hierarchy="p" size="xs" weight="semibold">{{ initials() }}</modus-typography>
        </div>
      }
    </div>

    @if (isOpen()) {
      <div
        class="absolute right-0 top-10 z-50 w-[270px] bg-card border-default rounded-lg shadow-navbar-menu overflow-hidden"
        role="menu"
        (click)="$event.stopPropagation()"
      >
        <div class="flex flex-col items-center py-4 px-4 gap-1">
          @if (avatarSrc()) {
            <div class="w-16 h-16 rounded-full overflow-hidden mb-1">
              <img [src]="avatarSrc()" [alt]="name()" class="w-full h-full object-cover" />
            </div>
          } @else {
            <div class="w-16 h-16 rounded-full flex items-center justify-center bg-secondary mb-1">
              <modus-typography hierarchy="p" size="xl" weight="semibold">{{ initials() }}</modus-typography>
            </div>
          }
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ company() }}</modus-typography>
          <modus-typography hierarchy="p" size="sm" weight="semibold">{{ name() }}</modus-typography>
          <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ email() }}</modus-typography>
        </div>

        <div class="border-top-default"></div>

        <div class="py-1">
          @for (item of section1(); track item.id) {
            <div
              class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
              role="menuitem"
              tabindex="0"
              (click)="onMenuAction(item)"
              (keydown.enter)="onMenuAction(item)"
            >
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ item.icon }}</i>
              <modus-typography hierarchy="p" size="sm">{{ item.label }}</modus-typography>
            </div>
          }
        </div>

        <div class="px-4 py-1.5">
          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-60">Switch User</modus-typography>
        </div>
        <div class="border-top-default"></div>

        <div class="py-1">
          @for (item of personaItems; track item.id) {
            <div
              class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
              [class.bg-muted]="item.id === activePersonaSlug()"
              role="menuitem"
              tabindex="0"
              (click)="onPersonaSwitch(item.id)"
              (keydown.enter)="onPersonaSwitch(item.id)"
            >
              @if (item.id === activePersonaSlug()) {
                <i class="modus-icons text-base text-primary" aria-hidden="true">check</i>
              } @else {
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ item.icon }}</i>
              }
              <modus-typography hierarchy="p" size="sm" [weight]="item.id === activePersonaSlug() ? 'semibold' : 'normal'" [className]="item.id === activePersonaSlug() ? 'text-primary' : ''">{{ item.label }}</modus-typography>
            </div>
          }
        </div>

        <div class="border-top-default"></div>

        <div
          class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="menuitem"
          tabindex="0"
          [attr.aria-expanded]="legalExpanded()"
          (click)="legalExpanded.set(!legalExpanded())"
          (keydown.enter)="legalExpanded.set(!legalExpanded())"
        >
          <i class="modus-icons text-base text-foreground-60 transition-transform duration-150" [class.rotate-180]="legalExpanded()" aria-hidden="true">expand_more</i>
          <modus-typography hierarchy="p" size="sm">Legal</modus-typography>
        </div>

        @if (legalExpanded()) {
          <div class="px-4 pb-2">
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 leading-relaxed px-7">
              Terms of use, privacy policy, and other legal information.
            </modus-typography>
          </div>
        }

        <div
          class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
          role="menuitem"
          tabindex="0"
          (click)="onSignOut()"
          (keydown.enter)="onSignOut()"
        >
          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">sign_out</i>
          <modus-typography hierarchy="p" size="sm">Sign out</modus-typography>
        </div>

        <div class="border-top-default"></div>
        <div class="px-4 py-2 text-center">
          <modus-typography hierarchy="p" size="xs" className="text-foreground-40">&copy;{{ currentYear }}, Trimble Inc.</modus-typography>
        </div>
      </div>
    }
  `,
})
export class UserMenuComponent {
  readonly name = input.required<string>();
  readonly email = input.required<string>();
  readonly avatarSrc = input<string | undefined>(undefined);
  readonly company = input('Rocky Mountain Contracting');
  readonly activePersonaSlug = input<string>('frank');

  readonly menuAction = output<string>();
  readonly personaSwitch = output<string>();
  readonly signOut = output<void>();

  readonly isOpen = signal(false);
  readonly legalExpanded = signal(false);

  readonly section1 = computed(() => {
    const slug = this.activePersonaSlug();
    return slug === 'kelly' || slug === 'bert'
      ? SECTION_1_ITEMS.filter(i => i.id !== 'admin')
      : SECTION_1_ITEMS;
  });
  readonly personaItems = PERSONA_MENU_ITEMS;
  readonly currentYear = new Date().getFullYear();

  private readonly elementRef = inject(ElementRef);

  readonly initials = computed(() => {
    const parts = this.name().split(' ');
    return parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
  });

  toggle(): void {
    this.isOpen.set(!this.isOpen());
  }

  close(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  onManageTrimbleId(): void {
    window.open('https://id.trimble.com', '_blank');
    this.close();
  }

  onMenuAction(item: UserMenuItem): void {
    if (item.url) {
      window.open(item.url, '_blank');
    }
    this.menuAction.emit(item.id);
    this.close();
  }

  onPersonaSwitch(slug: string): void {
    this.personaSwitch.emit(slug);
    this.close();
  }

  onSignOut(): void {
    this.signOut.emit();
    this.close();
  }
}
