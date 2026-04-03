import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input, output, ElementRef, AfterViewInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Text replacements for the navbar.
 */
export interface INavbarTextOverrides {
  /** Replaces the text for "Apps" in the condensed menu. */
  apps?: string;
  /** Replaces the text for "Help" in the condensed menu. */
  help?: string;
  /** Replaces the text for "Notifications" in the condensed menu. */
  notifications?: string;
  /** Replaces the text for "Search" in the condensed menu. */
  search?: string;
}

/**
 * Controls the visibility of individual navbar buttons.
 */
export interface INavbarVisibility {
  /** Controls the visibility of the AI button. */
  ai?: boolean;
  /** Controls visibility of the apps button. */
  apps?: boolean;
  /** Controls visibility of the help button. */
  help?: boolean;
  /** Controls visibility of the main menu button. */
  mainMenu?: boolean;
  /** Controls visibility of the notifications button. */
  notifications?: boolean;
  /** Controls visibility of the search button. */
  search?: boolean;
  /** Controls visibility of the search input. */
  searchInput?: boolean;
  /** Controls visibility of the user button. */
  user?: boolean;
}

/**
 * User information used to render the user card.
 */
export interface INavbarUserCard {
  /** The alt value to set on the avatar. */
  avatarAlt?: string;
  /** The avatar image source value. */
  avatarSrc?: string;
  /** The email address of the user. */
  email: string;
  /** Text override for the Access MyTrimble button. */
  myTrimbleButton?: string;
  /** The name of the user. */
  name: string;
  /** Text override for the Sign out button. */
  signOutButton?: string;
}

/**
 * Props supported by the {@link ModusNavbarComponent}.
 */
export interface ModusNavbarProps {
  appsMenuOpen?: boolean;
  condensed?: boolean;
  condensedMenuOpen?: boolean;
  className?: string;
  mainMenuOpen?: boolean;
  notificationsMenuOpen?: boolean;
  searchDebounceMs?: number;
  searchInputOpen?: boolean;
  textOverrides?: INavbarTextOverrides;
  userCard: INavbarUserCard;
  userMenuOpen?: boolean;
  visibility?: INavbarVisibility;
}

/**
 * Angular wrapper for the Modus navbar web component.
 *
 * The navbar component supports projecting custom content into several slots:
 * - `main-menu` slot: For custom main menu content
 * - `notifications` slot: For custom notifications menu content
 * - `apps` slot: For custom apps menu content
 * - `start` slot: For custom content at the start of the navbar
 * - `center` slot: For custom content at the center of the navbar
 * - `end` slot: For custom content at the end of the navbar
 *
 * @example
 * ```html
 * <modus-navbar
 *   [userCard]="userInfo"
 *   [visibility]="{ user: true, search: true }"
 *   (userMenuOpenChange)="handleUserMenuChange($event)"
 * />
 * ```
 */
@Component({
  selector: 'modus-navbar',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <modus-wc-navbar>
      <ng-content select="[slot='main-menu']" slot="main-menu" />
      <ng-content select="[slot='notifications']" slot="notifications" />
      <ng-content select="[slot='apps']" slot="apps" />
      <ng-content select="[slot='start']" slot="start" />
      <ng-content select="[slot='center']" slot="center" />
      <ng-content select="[slot='end']" slot="end" />
    </modus-wc-navbar>
  `,
})
export class ModusNavbarComponent implements AfterViewInit {
  private readonly elRef = inject(ElementRef);

  /** The open state of the apps menu. */
  readonly appsMenuOpen = input<boolean | undefined>(false);

  /** Applies condensed layout and styling. */
  readonly condensed = input<boolean | undefined>(false);

  /** The open state of the condensed menu. */
  readonly condensedMenuOpen = input<boolean | undefined>(false);

  /** Custom CSS class applied to the host element. */
  readonly className = input<string | undefined>();

  /** The open state of the main menu. */
  readonly mainMenuOpen = input<boolean | undefined>(undefined);

  /** The open state of the notifications menu. */
  readonly notificationsMenuOpen = input<boolean | undefined>(false);

  /** Debounce time in milliseconds for search input changes. */
  readonly searchDebounceMs = input<number | undefined>(300);

  /** The open state of the search input. */
  readonly searchInputOpen = input<boolean | undefined>(false);

  /** Text replacements for the navbar. */
  readonly textOverrides = input<INavbarTextOverrides | undefined>();

  /** User information used to render the user card. */
  readonly userCard = input.required<INavbarUserCard>();

  /** The open state of the user menu. */
  readonly userMenuOpen = input<boolean | undefined>(false);

  /** The visibility of individual navbar buttons. */
  readonly visibility = input<INavbarVisibility | undefined>({
    ai: false,
    apps: false,
    help: false,
    mainMenu: false,
    notifications: false,
    search: false,
    searchInput: false,
    user: true,
  });

  private wcEl: HTMLElement | null = null;

  constructor() {
    effect(() => { this.syncProp('appsMenuOpen', this.appsMenuOpen()); });
    effect(() => { this.syncProp('condensed', this.condensed()); });
    effect(() => { this.syncProp('condensedMenuOpen', this.condensedMenuOpen()); });
    effect(() => { this.syncProp('customClass', this.className()); });
    effect(() => { this.syncProp('mainMenuOpen', this.mainMenuOpen()); });
    effect(() => { this.syncProp('notificationsMenuOpen', this.notificationsMenuOpen()); });
    effect(() => { this.syncProp('searchDebounceMs', this.searchDebounceMs()); });
    effect(() => { this.syncProp('searchInputOpen', this.searchInputOpen()); });
    effect(() => { this.syncProp('textOverrides', this.textOverrides()); });
    effect(() => { this.syncProp('userCard', this.userCard()); });
    effect(() => { this.syncProp('userMenuOpen', this.userMenuOpen()); });
    effect(() => { this.syncProp('visibility', this.visibility()); });
  }

  ngAfterViewInit(): void {
    this.wcEl = this.elRef.nativeElement.querySelector('modus-wc-navbar');
    if (!this.wcEl) return;

    const el = this.wcEl;
    const listen = <T,>(evtName: string, emitter: { emit(value: T): void }) => {
      el.addEventListener(evtName, ((e: CustomEvent) => emitter.emit(e.detail)) as EventListener);
    };
    listen('aiClick', this.aiClick);
    listen('appsClick', this.appsClick);
    listen('appsMenuOpenChange', this.appsMenuOpenChange);
    listen('condensedMenuOpenChange', this.condensedMenuOpenChange);
    listen('helpClick', this.helpClick);
    listen('mainMenuOpenChange', this.mainMenuOpenChange);
    listen('myTrimbleClick', this.myTrimbleClick);
    listen('notificationsClick', this.notificationsClick);
    listen('notificationsMenuOpenChange', this.notificationsMenuOpenChange);
    listen('searchChange', this.searchChange);
    listen('searchClick', this.searchClick);
    listen('searchInputOpenChange', this.searchInputOpenChange);
    listen('signOutClick', this.signOutClick);
    listen('trimbleLogoClick', this.trimbleLogoClick);
    listen('userMenuOpenChange', this.userMenuOpenChange);
  }

  private syncProp(name: string, value: unknown): void {
    if (this.wcEl) {
      (this.wcEl as unknown as Record<string, unknown>)[name] = value;
    }
  }

  /** Emits when the AI button is clicked or activated via keyboard. */
  readonly aiClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the apps button is clicked or activated via keyboard. */
  readonly appsClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the apps menu open state changes. */
  readonly appsMenuOpenChange = output<boolean>();

  /** Emits when the condensed menu open state changes. */
  readonly condensedMenuOpenChange = output<boolean>();

  /** Emits when the help button is clicked or activated via keyboard. */
  readonly helpClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the main menu open state changes. */
  readonly mainMenuOpenChange = output<boolean>();

  /** Emits when the user profile Access MyTrimble button is clicked. */
  readonly myTrimbleClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the notifications button is clicked or activated via keyboard. */
  readonly notificationsClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the notifications menu open state changes. */
  readonly notificationsMenuOpenChange = output<boolean>();

  /** Emits when the search input value is changed. */
  readonly searchChange = output<{ value: string }>();

  /** Emits when the search button is clicked or activated via keyboard. */
  readonly searchClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the search input open state changes. */
  readonly searchInputOpenChange = output<boolean>();

  /** Emits when the user profile sign out button is clicked. */
  readonly signOutClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the Trimble logo is clicked or activated via keyboard. */
  readonly trimbleLogoClick = output<MouseEvent | KeyboardEvent>();

  /** Emits when the user menu open state changes. */
  readonly userMenuOpenChange = output<boolean>();

}
