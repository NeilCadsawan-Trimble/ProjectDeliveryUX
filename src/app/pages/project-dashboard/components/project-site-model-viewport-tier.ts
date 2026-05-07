/**
 * Viewport tier for the project Models sub-page BIM viewer: drives chrome density (toolbar, rail, split pano).
 * Kept pure (no Angular) so ResizeObserver debounce + hysteresis stay testable and stable
 * against layout-engine reflow feedback loops.
 */
export const SITE_MODEL_VIEWPORT_DEBOUNCE_MS = 160;

export type SiteModelViewportTier = 'compact' | 'comfortable' | 'full';

export function rawSiteModelViewportTier(w: number, h: number): SiteModelViewportTier {
  if (w <= 0 || h <= 0) return 'comfortable';
  if (w < 520 || h < 200) return 'compact';
  if (w < 800) return 'comfortable';
  return 'full';
}

/**
 * Hysteresis around the same thresholds so toolbar/rail toggles do not oscillate tier
 * when content height changes slightly after a tier switch.
 */
export function resolveSiteModelViewportTierWithHysteresis(
  prev: SiteModelViewportTier,
  w: number,
  h: number,
): SiteModelViewportTier {
  if (w <= 0 || h <= 0) return prev;

  const raw = rawSiteModelViewportTier(w, h);

  if (prev === 'compact') {
    if (raw === 'compact') return 'compact';
    if (w >= 556 && h >= 216) {
      return raw === 'full' ? 'full' : 'comfortable';
    }
    return 'compact';
  }

  if (prev === 'comfortable') {
    if (raw === 'compact') {
      return w < 504 || h < 192 ? 'compact' : 'comfortable';
    }
    if (raw === 'full') {
      return w >= 828 ? 'full' : 'comfortable';
    }
    return 'comfortable';
  }

  if (raw === 'full') return 'full';
  if (raw === 'compact') return 'compact';
  return w < 784 ? 'comfortable' : 'full';
}
