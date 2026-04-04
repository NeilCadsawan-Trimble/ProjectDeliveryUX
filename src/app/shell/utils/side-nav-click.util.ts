/**
 * Keeps Angular `navExpanded` aligned with the fixed side rail and Modus navbar.
 *
 * modus-wc-navbar clears `mainMenuOpen` on outside click without emitting
 * `mainMenuOpenChange`, which can leave `navExpanded` true while the WC state is false
 * (next hamburger click appears broken). Use document-phase handling with composedPath
 * so shadow-DOM hamburger targets are recognized.
 */

/** Normalize payloads from (mainMenuOpenChange) across Angular output vs raw CustomEvent. */
export function coerceMainMenuOpenPayload(open: unknown): boolean | undefined {
  if (typeof open === 'boolean') return open;
  if (
    typeof open === 'object' &&
    open !== null &&
    'detail' in open &&
    typeof (open as CustomEvent<boolean>).detail === 'boolean'
  ) {
    return (open as CustomEvent<boolean>).detail;
  }
  return undefined;
}

/** True if the click should NOT collapse the app side nav (rail, backdrop, or hamburger). */
export function isClickInsideSideNavChrome(event: MouseEvent): boolean {
  const path =
    typeof event.composedPath === 'function' ? event.composedPath() : [event.target];

  const insideRail = path.some(
    (el) =>
      el instanceof HTMLElement &&
      (!!el.closest('.custom-side-nav') ||
        !!el.closest('.canvas-side-nav') ||
        !!el.closest('.custom-side-nav-backdrop') ||
        !!el.closest('.mobile-side-subnav')),
  );

  const insideHamburger = path.some((el) => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.classList.contains('shell-navbar-hamburger')) return true;
    return el.getAttribute?.('aria-label') === 'Main menu';
  });

  return insideRail || insideHamburger;
}
