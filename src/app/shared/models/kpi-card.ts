/**
 * Shared KPI tile model used by `HomeKpiCardsComponent` and
 * `HomeApKpiCardsComponent`.
 *
 * `action` and `ariaPrefix` are optional to support cards that should render as
 * read-only summary tiles (e.g. AP KPIs that aren't navigable). Cards used in
 * navigation contexts should always populate `action`.
 */
export interface DashboardKpiCard {
  /** Display value (formatted string, e.g. `$1.2M`). */
  value: string;
  /** Display label (e.g. `Open RFIs`). */
  label: string;
  /** Modus icon name. */
  icon: string;
  /** Tailwind background utility for the icon tile. */
  iconBg: string;
  /** Tailwind text-color utility for the icon glyph. */
  iconColor: string;
  /** Optional secondary line shown below the value/label row. */
  subtitle?: string;
  /** Optional action identifier; when provided the card becomes an interactive link. */
  action?: string;
  /** Optional aria-label prefix; falls back to `label`. */
  ariaPrefix?: string;
}
