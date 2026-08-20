/** Demo seed clock. UI "today" is still the real browser date; derived seed fields are authored against this instant. */
export const SEED_AS_OF = new Date(2026, 7, 20); // Aug 20, 2026

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse `'Aug 20, 2026'` or ISO `'2026-08-20'`. */
export function parseSeedDate(value: string): Date {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const display = /^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/.exec(value);
  if (display) {
    const month = MONTHS[display[1]];
    if (month === undefined) throw new Error(`Unknown month in seed date: ${value}`);
    return new Date(Number(display[3]), month, Number(display[2]));
  }
  const fallback = new Date(value);
  if (isNaN(fallback.getTime())) throw new Error(`Unparseable seed date: ${value}`);
  return fallback;
}

/** Whole days from `SEED_AS_OF` to `due` (negative = past). */
export function daysFromAsOf(due: string | Date): number {
  const target = startOfDay(typeof due === 'string' ? parseSeedDate(due) : due);
  const asOf = startOfDay(SEED_AS_OF);
  return Math.round((target.getTime() - asOf.getTime()) / 86_400_000);
}

/** Whole days a receivable/payable has been outstanding as of `SEED_AS_OF`. Paid items should pass `0` explicitly. */
export function daysOutstandingAsOf(received: string): number {
  return Math.max(0, -daysFromAsOf(received));
}

export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysRemainingLabel(due: string): { value: string; subtext: string; overdue: boolean } {
  const days = daysFromAsOf(due);
  const parsed = parseSeedDate(due);
  const value = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (days < 0) {
    return { value, subtext: `${Math.abs(days)} days overdue`, overdue: true };
  }
  return { value, subtext: `${days} days remaining`, overdue: false };
}
