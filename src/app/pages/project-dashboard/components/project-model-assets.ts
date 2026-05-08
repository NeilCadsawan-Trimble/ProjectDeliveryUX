/**
 * Per-project 3D model (.glb) asset registry.
 *
 * Single source of truth shared by:
 * - {@link ProjectSiteModelComponent} (full interactive viewer on the Models sub-page)
 * - {@link ProjectModelThumbnailComponent} (small auto-rotating preview embedded in dashboard tiles)
 *
 * Add a new entry here to map a different `.glb` to a project. Files live under
 * `public/models/`.
 */
export const PROJECT_MODEL_BY_ID: Record<number, string> = {
  2: '/models/residential-diorama.glb', // Harbor View Condominiums
};

export const DEFAULT_PROJECT_MODEL_URL = '/models/modern-luxury-villa.glb';

export function resolveProjectModelUrl(projectId: number | null | undefined): string {
  return PROJECT_MODEL_BY_ID[projectId ?? -1] ?? DEFAULT_PROJECT_MODEL_URL;
}
