/**
 * Safe JSON helpers around `localStorage`.
 *
 * Centralizes the get/parse and stringify/set pattern so call sites stay short
 * and quota-exceeded / private-browsing / corrupted-data errors are handled
 * uniformly. Callers can pass a fallback value for `readJson`; `writeJson`
 * silently swallows errors (matching the previous per-call-site behavior).
 */

/**
 * Reads and JSON-parses the value at `key` from `localStorage`.
 *
 * Returns `fallback` (default `null`) when the key is missing, parsing fails,
 * or `localStorage` is unavailable.
 */
export function readJson<T>(key: string, fallback: T | null = null): T | null {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * JSON-stringifies `value` and writes it to `localStorage` at `key`.
 *
 * Silently no-ops when `localStorage` is unavailable or quota is exceeded.
 * Returns `true` on success, `false` otherwise.
 */
export function writeJson(key: string, value: unknown): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes `key` from `localStorage`, swallowing errors.
 *
 * Returns `true` when the call succeeded.
 */
export function removeJson(key: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
