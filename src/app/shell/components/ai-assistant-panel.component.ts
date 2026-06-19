import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { AiPanelController } from '../services/ai-panel-controller';
import { AiComposerPillComponent } from './ai-composer-pill.component';

const DOCK_WIDTH_STORAGE_KEY = 'trimble-assistant-dock-width-px';
const DOCK_WIDTH_MIN_PX = 320;
const DOCK_WIDTH_MAX_PX = 720;
const DOCK_WIDTH_DEFAULT_PX = 448;

/**
 * Trimble Assistant slide-out side panel.
 *
 * Right-side conversation drawer that mirrors the shared {@link AiPanelController}
 * state (same messages, same composer, same thinking indicator). Mounted in the
 * dashboard shell — where the deleted `<ai-assistant-panel>` used to live — so
 * the drawer no longer nests inside the floating prompt's DOM tree.
 *
 * Visibility is gated on {@link AiPanelController.drawerOpen}; the floating
 * prompt's "Open Trimble Assistant" toolbar button toggles that signal.
 */
@Component({
  selector: 'ai-assistant-panel',
  imports: [ModusTypographyComponent, AiComposerPillComponent],
  template: `
    @if (controller.drawerOpen()) {
      <div
        class="ai-floating-prompt-drawer-portal"
        [class.ai-floating-prompt-drawer-portal--dock]="mode() === 'dock'"
        [style.width.px]="mode() === 'dock' ? dockWidthPx() : null"
        aria-hidden="false"
      >
        <div
          class="ai-floating-prompt-drawer"
          [class.ai-floating-prompt-drawer--docked]="mode() === 'dock'"
          [style.width.px]="mode() === 'dock' ? dockWidthPx() : null"
          role="dialog"
          aria-modal="false"
          aria-label="Trimble Assistant"
          tabindex="-1"
        >
          @if (mode() === 'dock') {
            <div
              class="ai-floating-prompt-drawer-resize-handle"
              [class.is-resizing]="resizing()"
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize Trimble Assistant"
              [attr.aria-valuemin]="dockWidthMin"
              [attr.aria-valuemax]="dockWidthMax"
              [attr.aria-valuenow]="dockWidthPx()"
              tabindex="0"
              (mousedown)="onResizeMouseDown($event)"
              (keydown)="onResizeKeydown($event)"
            ></div>
          }
          <div class="ai-floating-prompt-drawer-header">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                <i class="modus-icons text-base text-primary" aria-hidden="true">ai_stars</i>
              </div>
              <modus-typography hierarchy="h3" size="md" weight="semibold" className="truncate">{{ controller.title() }}</modus-typography>
            </div>
            <div
              class="ai-floating-prompt-toolbar-button"
              role="button"
              tabindex="0"
              aria-label="Close Trimble Assistant"
              title="Close"
              (click)="closeDrawer()"
              (keydown.enter)="closeDrawer()"
            >
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
            </div>
          </div>
          <div
            class="ai-floating-prompt-drawer-messages"
            role="log"
            aria-live="polite"
            aria-label="Trimble Assistant messages"
          >
            @if (controller.messages().length === 0 && !controller.thinking()) {
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="modus-icons text-sm text-primary" aria-hidden="true">ai_stars</i>
                </div>
                <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ controller.welcomeText() }}</modus-typography>
              </div>
            }
            @for (msg of controller.messages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground">
                    <modus-typography hierarchy="p" size="sm" className="leading-relaxed">{{ msg.text }}</modus-typography>
                  </div>
                </div>
              } @else {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="modus-icons text-sm text-primary" aria-hidden="true">ai_stars</i>
                  </div>
                  <div
                    class="modus-wc-typography modus-wc-text-sm modus-wc-typography-weight-normal px-4 py-2.5 rounded-2xl rounded-tl-sm bg-background border-default text-foreground leading-relaxed whitespace-pre-wrap max-w-[85%] ai-msg-body"
                    [innerHTML]="renderMessage(msg.text)"
                    (click)="onMessageClick($event)"
                  ></div>
                </div>
              }
            }
            @if (controller.thinking()) {
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i class="modus-icons text-sm text-primary" aria-hidden="true">ai_stars</i>
                </div>
                <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-background border-default">
                  <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            }
          </div>
          <div class="ai-floating-prompt-drawer-composer">
            <ai-composer-pill
              [controller]="controller"
              [embedded]="true"
              anchorPrefix="drawer"
            />
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mt-2 ml-2">AI can make mistakes. Check important info.</modus-typography>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantPanelComponent {
  readonly controller = inject(AiPanelController);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Render mode. `'dock'` lays the panel out as an in-flow flex column
   * (used in standard non-canvas, non-mobile shells); `'float'` keeps the
   * historical fixed-portal overlay used in canvas mode and as the mobile
   * fallback. Defaults to `'float'` so existing call sites that omit the
   * input keep their previous behavior.
   */
  readonly mode = input<'dock' | 'float'>('float');

  /** Exposed constants so the resize handle can populate aria-value{min,max}. */
  readonly dockWidthMin = DOCK_WIDTH_MIN_PX;
  readonly dockWidthMax = DOCK_WIDTH_MAX_PX;

  /**
   * Width of the docked panel in pixels. Persisted to localStorage so the
   * user's preferred width survives reloads and route changes. Only used
   * when `mode() === 'dock'`; floating mode keeps the CSS-declared
   * `min(28rem, 100vw)` width.
   */
  readonly dockWidthPx = signal<number>(this.readDockWidthFromStorage());

  /** True while the user is actively dragging the left-edge resize handle. */
  readonly resizing = signal(false);

  private resizeStartX = 0;
  private resizeStartWidth = 0;

  private readonly _persistDockWidth = effect(() => {
    const px = this.dockWidthPx();
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(DOCK_WIDTH_STORAGE_KEY, String(px));
    } catch {
      // ignore quota / private-mode errors -- width still works in-session
    }
  });

  closeDrawer(): void {
    this.controller.closeDrawer();
  }

  private readDockWidthFromStorage(): number {
    if (typeof window === 'undefined') return DOCK_WIDTH_DEFAULT_PX;
    try {
      const raw = window.localStorage.getItem(DOCK_WIDTH_STORAGE_KEY);
      if (!raw) return DOCK_WIDTH_DEFAULT_PX;
      const n = Number.parseInt(raw, 10);
      if (!Number.isFinite(n)) return DOCK_WIDTH_DEFAULT_PX;
      return this.clampDockWidth(n);
    } catch {
      return DOCK_WIDTH_DEFAULT_PX;
    }
  }

  private clampDockWidth(px: number): number {
    return Math.max(DOCK_WIDTH_MIN_PX, Math.min(DOCK_WIDTH_MAX_PX, Math.round(px)));
  }

  onResizeMouseDown(event: MouseEvent): void {
    if (this.mode() !== 'dock') return;
    event.preventDefault();
    event.stopPropagation();
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.dockWidthPx();
    this.resizing.set(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (e: MouseEvent) => {
      // Dragging the LEFT edge to the left grows the panel; to the right
      // shrinks it. So the delta is start - current.
      const delta = this.resizeStartX - e.clientX;
      this.dockWidthPx.set(this.clampDockWidth(this.resizeStartWidth + delta));
    };
    const onUp = () => {
      this.resizing.set(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // Notify the layout engine that the main column geometry changed so
      // widgets re-flow against the new container width.
      window.dispatchEvent(new Event('resize'));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  onResizeKeydown(event: KeyboardEvent): void {
    if (this.mode() !== 'dock') return;
    const step = event.shiftKey ? 32 : 8;
    let next: number | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        next = this.dockWidthPx() + step;
        break;
      case 'ArrowRight':
        next = this.dockWidthPx() - step;
        break;
      case 'Home':
        next = DOCK_WIDTH_MAX_PX;
        break;
      case 'End':
        next = DOCK_WIDTH_MIN_PX;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.dockWidthPx.set(this.clampDockWidth(next));
    window.dispatchEvent(new Event('resize'));
  }

  onMessageClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    event.preventDefault();
    event.stopPropagation();

    const href = anchor.getAttribute('href');
    if (!href) return;

    if (href.startsWith('/') || href.startsWith('?')) {
      const [path, query] = href.split('?');
      const queryParams: Record<string, string> = {};
      if (query) {
        for (const pair of query.split('&')) {
          const [k, v] = pair.split('=');
          if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
        }
      }
      this.router.navigate([path || '/'], { queryParams });
    } else {
      window.open(href, '_blank', 'noopener');
    }
  }

  renderMessage(text: string): SafeHtml {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    escaped = escaped.replace(
      /\*\*([^*]+)\*\*/g,
      '<div class="font-semibold inline">$1</div>',
    );

    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline hover:text-primary-80 cursor-pointer" data-ai-link>$1</a>',
    );

    return this.sanitizer.bypassSecurityTrustHtml(escaped);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.controller.drawerOpen()) {
      this.controller.closeDrawer();
    }
  }

  /**
   * Stop click bubbling so the shell's document-level deselection logic does
   * not clear widget focus when the user interacts with the panel.
   */
  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
