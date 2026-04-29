import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { AiFloatingPromptComponent } from './ai-floating-prompt.component';
import { AiPanelController } from '../services/ai-panel-controller';

/**
 * Universal AI Floating Prompt host. Mounted once at the app root behind a
 * `@defer` block so the AI panel + its dependency graph (controller, widget
 * agents, tools service) stay out of the eager initial bundle.
 *
 * Renders the prompt fixed to the viewport (`position: fixed` from the
 * component's own styles), so placement of this host within the DOM does not
 * affect its visual position. Suppresses the prompt on auth / persona-select
 * routes that intentionally render without the dashboard shell.
 *
 * Includes the global SVG gradient defs that the AI icon's "solid-colored"
 * variant references via `url(#ai-grad-light)` / `url(#ai-grad-dark)`. Living
 * here keeps the floating prompt visually correct even when the dashboard
 * shell is not in the DOM tree.
 */
@Component({
  selector: 'ai-floating-prompt-host',
  imports: [AiFloatingPromptComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <svg aria-hidden="true" class="svg-defs-hidden">
        <defs>
          <linearGradient id="ai-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="20%" stop-color="hsl(300, 100%, 50%)" />
            <stop offset="60%" stop-color="#0066CC" />
            <stop offset="100%" stop-color="#0066CC" />
          </linearGradient>
          <radialGradient id="ai-grad-dark" cx="18%" cy="18%" r="70%">
            <stop offset="0%" stop-color="hsl(300, 100%, 50%)" />
            <stop offset="50%" stop-color="#9933FF" />
            <stop offset="100%" stop-color="#0066CC" />
          </radialGradient>
        </defs>
      </svg>
      <ai-floating-prompt [controller]="ai" />
    }
  `,
})
export class AiFloatingPromptHostComponent {
  readonly ai = inject(AiPanelController);
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Hide on routes that render without the dashboard shell (auth/login,
   * auth callback, persona select). The prompt wouldn't have a meaningful
   * page context on those screens and would clutter the auth UX.
   */
  readonly visible = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/login')) return false;
    if (url.startsWith('/auth/')) return false;
    if (url.startsWith('/select')) return false;
    if (url === '/') return false;
    return true;
  });
}
