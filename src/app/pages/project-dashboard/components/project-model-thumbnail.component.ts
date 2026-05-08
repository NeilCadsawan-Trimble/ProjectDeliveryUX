import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
} from '@angular/core';

import { resolveProjectModelUrl } from './project-model-assets';

/**
 * Slim, non-interactive `<model-viewer>` thumbnail used inside dashboard tiles
 * (home `home3dModel`, project-dashboard `projectModel`).
 *
 * Behaviour:
 * - Auto-rotates the model continuously so the tile feels "alive".
 * - Disables all camera controls (no zoom, no pan, no orbit) — pointer events
 *   pass straight through to the parent tile so click-to-open still fires.
 * - No chrome (no toolbar, no orientation gizmo). The full interactive viewer
 *   lives behind the click in either the canvas detail overlay or the project
 *   Models sub-page.
 *
 * The asset URL is resolved via {@link resolveProjectModelUrl} so the
 * thumbnail and the full {@link ProjectSiteModelComponent} always agree on
 * which `.glb` to load for a given `projectId`.
 */
@Component({
  selector: 'app-project-model-thumbnail',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="absolute inset-0 pointer-events-none">
      <model-viewer
        [attr.src]="modelUrl()"
        [attr.alt]="altText()"
        auto-rotate
        auto-rotate-delay="0"
        rotation-per-second="18deg"
        interaction-prompt="none"
        disable-pan
        disable-zoom
        disable-tap
        shadow-intensity="0.7"
        exposure="1"
        tone-mapping="commerce"
        environment-image="neutral"
        field-of-view="40deg"
        loading="lazy"
        reveal="auto"
        class="absolute inset-0 box-border block h-full w-full pointer-events-none"
      ></model-viewer>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectModelThumbnailComponent {
  readonly projectId = input<number | null>(null);
  readonly altText = input<string>('Project 3D model preview');
  readonly modelUrl = computed(() => resolveProjectModelUrl(this.projectId()));
}
