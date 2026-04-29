import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { AiPanelController } from '../services/ai-panel-controller';
import { AiComposerPillComponent } from './ai-composer-pill.component';

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
      <div class="ai-floating-prompt-drawer-portal" aria-hidden="false">
        <div
          class="ai-floating-prompt-drawer"
          role="dialog"
          aria-modal="false"
          aria-label="Trimble Assistant"
          tabindex="-1"
        >
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

  closeDrawer(): void {
    this.controller.closeDrawer();
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
