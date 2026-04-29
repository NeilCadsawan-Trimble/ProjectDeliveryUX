/**
 * Shared formatting helpers used across pages and widgets.
 *
 * Centralized here so call sites stay short and `Intl.NumberFormat` instances
 * are cached (formatter construction is the expensive part of `Intl`).
 */

const usdFormatters = new Map<number, Intl.NumberFormat>();

/**
 * Formats a number as a US dollar string (e.g. `$1,234.56` or `$1,234`).
 *
 * @param amount The numeric amount to format.
 * @param decimals The number of fractional digits to render (default `2`).
 */
export function formatUsd(amount: number, decimals: number = 2): string {
  let fmt = usdFormatters.get(decimals);
  if (!fmt) {
    fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    usdFormatters.set(decimals, fmt);
  }
  return fmt.format(amount);
}

const longTodayOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/**
 * Returns today's date as a long-form `en-US` string
 * (e.g. `Tuesday, April 28, 2026`).
 *
 * Computed at call time so the value reflects the current day; pages typically
 * cache the result on a class field at construction.
 */
export function formatLongToday(): string {
  return new Date().toLocaleDateString('en-US', longTodayOptions);
}
