import type { Components } from '@trimble-oss/moduswebcomponents';

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
 * Props once supported by an Angular wrapper for the Modus navbar web component.
 *
 * Retained as a typed shape because the shell builds the navbar with custom markup
 * directly on the underlying `modus-wc-navbar` element rather than via this wrapper.
 */
export interface ModusNavbarProps {
  /** The open state of the apps menu. */
  appsMenuOpen?: Components.ModusWcNavbar['appsMenuOpen'];
  /** Applies condensed layout and styling. */
  condensed?: Components.ModusWcNavbar['condensed'];
  /** The open state of the condensed menu. */
  condensedMenuOpen?: Components.ModusWcNavbar['condensedMenuOpen'];
  /** Custom CSS class applied to the host element. */
  className?: Components.ModusWcNavbar['customClass'];
  /** The open state of the main menu. */
  mainMenuOpen?: Components.ModusWcNavbar['mainMenuOpen'];
  /** The open state of the notifications menu. */
  notificationsMenuOpen?: Components.ModusWcNavbar['notificationsMenuOpen'];
  /** Debounce time in milliseconds for search input changes. */
  searchDebounceMs?: Components.ModusWcNavbar['searchDebounceMs'];
  /** The open state of the search input. */
  searchInputOpen?: Components.ModusWcNavbar['searchInputOpen'];
  /** Text replacements for the navbar. */
  textOverrides?: INavbarTextOverrides;
  /** User information used to render the user card. */
  userCard: INavbarUserCard;
  /** The open state of the user menu. */
  userMenuOpen?: Components.ModusWcNavbar['userMenuOpen'];
  /** The visibility of individual navbar buttons. */
  visibility?: INavbarVisibility;
}
