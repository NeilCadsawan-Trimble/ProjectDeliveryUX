import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ModusWcChip, ModusWcIcon } from '@trimble-oss/moduswebcomponents-angular';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLogoComponent } from '../../components/modus-logo.component';
import { AiComposerPillComponent } from './ai-composer-pill.component';
import { AiPanelController } from '../services/ai-panel-controller';
import type { AgentAction } from '../../data/widget-agents';

/**
 * Modus AI Floating Prompt.
 *
 * Bottom-center fixed surface translated from the official Modus React
 * pattern (https://modus.trimble.com/patterns/ai-ux-floating-prompt/overview)
 * into Angular and wired to {@link AiPanelController} for real chat:
 *
 *   - Default phase: starter chips above the input pill (Sources / Tools /
 *     Send). Shown when there are no messages and the controller isn't busy.
 *   - Working phase (fresh): standalone pill with progress ring + Thinking…
 *     dots + Stop. Shown only while streaming a *first* response so the
 *     user gets the React reference's exact "Gemini-style" working state.
 *   - Review phase: response card with feedback toolbar, drawer toggle,
 *     close, accumulated messages (with thinking dots inline if a follow-up
 *     is streaming), pending-action prompts, and an embedded follow-up
 *     pill that swaps Send for Stop while busy.
 *
 * The right-side Trimble Assistant slide-out lives at the dashboard shell
 * level in {@link AiAssistantPanelComponent}; the toolbar drawer-toggle
 * button below flips {@link AiPanelController.drawerOpen} so they stay in
 * sync without prop drilling.
 *
 * Conversational state stays on the shared {@link AiPanelController}
 * singleton so per-page registrations (suggestions, actions, navigation
 * choice gates, persona context, etc.) continue to work unchanged.
 */
@Component({
  selector: 'ai-floating-prompt',
  imports: [
    ModusWcChip,
    ModusWcIcon,
    ModusTypographyComponent,
    ModusLogoComponent,
    AiComposerPillComponent,
  ],
  template: `
    <div
      class="ai-floating-prompt"
      [class.has-response]="showResponseCard()"
      role="region"
      [attr.aria-label]="controller().title()"
    >
      @if (phase() === 'review') {
        <div
          class="ai-floating-prompt-card ai-floating-prompt-card-enter"
          role="dialog"
          [attr.aria-label]="controller().title()"
        >
          <div class="flex items-center justify-between gap-2 px-4 py-3 border-bottom-default">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                <i class="modus-icons text-base text-primary" aria-hidden="true">ai_stars</i>
              </div>
              <div class="min-w-0">
                <modus-typography hierarchy="h3" size="md" weight="semibold" className="truncate">{{ controller().title() }}</modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ controller().subtitle() }}</modus-typography>
              </div>
            </div>
            <div class="flex items-center gap-0.5 flex-shrink-0">
              <div
                class="ai-floating-prompt-toolbar-button"
                role="button"
                tabindex="0"
                aria-label="Helpful"
                title="Helpful"
                (click)="onFeedback('up')"
                (keydown.enter)="onFeedback('up')"
              >
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">thumbs_up</i>
              </div>
              <div
                class="ai-floating-prompt-toolbar-button"
                role="button"
                tabindex="0"
                aria-label="Not helpful"
                title="Not helpful"
                (click)="onFeedback('down')"
                (keydown.enter)="onFeedback('down')"
              >
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">thumbs_down</i>
              </div>
              <div
                class="ai-floating-prompt-toolbar-button"
                role="button"
                tabindex="0"
                aria-label="Open Trimble Assistant"
                title="Open Trimble Assistant"
                [attr.aria-pressed]="controller().drawerOpen()"
                (click)="toggleDrawer()"
                (keydown.enter)="toggleDrawer()"
              >
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">toggle_right_panel</i>
              </div>
              @if (controller().messages().length > 0) {
                <div
                  class="ai-floating-prompt-toolbar-button"
                  (click)="controller().clearConversation()"
                  role="button"
                  aria-label="New conversation"
                  title="New conversation"
                  tabindex="0"
                  (keydown.enter)="controller().clearConversation()"
                >
                  <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">add</i>
                </div>
              }
              <div
                class="ai-floating-prompt-toolbar-button"
                (click)="dismissCard()"
                role="button"
                aria-label="Close response"
                tabindex="0"
                (keydown.enter)="dismissCard()"
              >
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1 min-h-0" aria-live="polite" role="log" aria-label="Chat messages">
            @for (msg of controller().messages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground">
                    <modus-typography hierarchy="p" size="sm" className="leading-relaxed">{{ msg.text }}</modus-typography>
                  </div>
                </div>
              } @else {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="modus-icons text-sm text-primary" aria-hidden="true">ai_stars</i>
                  </div>
                  <div class="flex flex-col gap-2 max-w-[85%]">
                    @if (msg.text) {
                      <div
                        class="modus-wc-typography modus-wc-text-sm modus-wc-typography-weight-normal px-4 py-2.5 rounded-2xl rounded-tl-sm bg-background border-default text-foreground leading-relaxed whitespace-pre-wrap ai-msg-body"
                        [innerHTML]="renderMessage(msg.text)"
                        (click)="onMessageClick($event)"
                      ></div>
                    }
                    @if (msg.pendingAction) {
                      @if (msg.pendingAction.choice) {
                        <div class="rounded-xl border-primary bg-primary-20 p-3">
                          <div class="flex items-center gap-2 mb-2">
                            <i class="modus-icons text-sm text-primary" aria-hidden="true">launch</i>
                            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-primary uppercase tracking-wider">How would you like to open this?</modus-typography>
                          </div>
                          <modus-typography hierarchy="p" size="sm" className="mb-3">{{ msg.pendingAction.choice.label }}</modus-typography>
                          <div class="flex items-center gap-2 flex-wrap">
                            <div
                              class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
                              role="button"
                              tabindex="0"
                              (click)="controller().chooseNavigation(msg.id)"
                              (keydown.enter)="controller().chooseNavigation(msg.id)"
                            ><modus-typography hierarchy="p" size="xs" weight="semibold">Navigate to page</modus-typography></div>
                            <div
                              class="px-3 py-1.5 rounded-lg border-default bg-card cursor-pointer hover:bg-muted transition-colors"
                              role="button"
                              tabindex="0"
                              (click)="controller().chooseCanvasOverlay(msg.id)"
                              (keydown.enter)="controller().chooseCanvasOverlay(msg.id)"
                            ><modus-typography hierarchy="p" size="xs" weight="semibold">Open in canvas window</modus-typography></div>
                          </div>
                        </div>
                      } @else {
                        <div class="rounded-xl border-primary bg-primary-20 p-3">
                          <div class="flex items-center gap-2 mb-2">
                            <i class="modus-icons text-sm text-primary" aria-hidden="true">file_edit</i>
                            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-primary uppercase tracking-wider">Proposed Change</modus-typography>
                          </div>
                          <modus-typography hierarchy="p" size="sm" className="mb-3">{{ msg.pendingAction.description }}</modus-typography>
                          <div class="flex items-center gap-2">
                            <div
                              class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
                              role="button"
                              tabindex="0"
                              (click)="controller().confirmAction(msg.id)"
                              (keydown.enter)="controller().confirmAction(msg.id)"
                            ><modus-typography hierarchy="p" size="xs" weight="semibold">Confirm</modus-typography></div>
                            <div
                              class="px-3 py-1.5 rounded-lg border-default bg-card cursor-pointer hover:bg-muted transition-colors"
                              role="button"
                              tabindex="0"
                              (click)="controller().cancelAction(msg.id)"
                              (keydown.enter)="controller().cancelAction(msg.id)"
                            ><modus-typography hierarchy="p" size="xs" weight="semibold">Cancel</modus-typography></div>
                          </div>
                        </div>
                      }
                    }
                  </div>
                </div>
              }
            }

            @if (controller().thinking()) {
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

            @if (!controller().thinking() && controller().actions().length > 0 && controller().messages().length > 0) {
              <div class="flex flex-wrap gap-1.5 mt-1">
                @for (action of controller().actions(); track action.id) {
                  <div
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted cursor-pointer hover:bg-secondary transition-colors duration-150"
                    (click)="handleAction(action)"
                    role="button"
                    tabindex="0"
                    (keydown.enter)="handleAction(action)"
                  >
                    <i class="modus-icons text-xs text-primary" aria-hidden="true">lightning</i>
                    <modus-typography hierarchy="p" size="xs">{{ action.label }}</modus-typography>
                  </div>
                }
              </div>
            }
          </div>

          <div class="ai-floating-prompt-card-composer">
            <ai-composer-pill
              [controller]="controller()"
              [embedded]="true"
              anchorPrefix="card"
              (sent)="onComposerSent()"
            />
          </div>
        </div>
      } @else if (phase() === 'default') {
        @if (controller().suggestions().length > 0 || controller().actions().length > 0) {
          <div class="ai-floating-prompt-chips" role="list" aria-label="Suggested prompts">
            @for (suggestion of visibleSuggestions(); track suggestion) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host"
                [label]="suggestion"
                [attr.aria-label]="'Ask: ' + suggestion"
                (chipClick)="controller().selectSuggestion(suggestion)"
              />
            }
            @if (overflowSuggestionCount() > 0) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host ai-floating-prompt-chip-overflow"
                [label]="'+' + overflowSuggestionCount()"
                [attr.aria-label]="'Show ' + overflowSuggestionCount() + ' more suggestions'"
                [attr.aria-expanded]="chipsExpanded()"
                (chipClick)="toggleChipsExpanded()"
              />
            }
            @if (chipsExpanded() && controller().suggestions().length > MAX_PRIMARY_CHIPS) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host ai-floating-prompt-chip-overflow"
                label="Less"
                aria-label="Show fewer suggestions"
                (chipClick)="toggleChipsExpanded()"
              />
            }
            @for (action of visibleActions(); track action.id) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host ai-floating-prompt-chip-action"
                [attr.aria-label]="action.label"
                (chipClick)="handleAction(action)"
              >
                <modus-wc-icon name="lightning" size="xs"></modus-wc-icon>
                {{ action.label }}
              </modus-wc-chip>
            }
            @if (overflowActionCount() > 0) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host ai-floating-prompt-chip-overflow ai-floating-prompt-chip-action"
                [label]="'+' + overflowActionCount()"
                [attr.aria-label]="'Show ' + overflowActionCount() + ' more actions'"
                [attr.aria-expanded]="actionsExpanded()"
                (chipClick)="toggleActionsExpanded()"
              />
            }
            @if (actionsExpanded() && controller().actions().length > MAX_PRIMARY_ACTIONS) {
              <modus-wc-chip
                size="md"
                variant="filled"
                shape="circle"
                customClass="ai-floating-prompt-chip-host ai-floating-prompt-chip-overflow ai-floating-prompt-chip-action"
                label="Less"
                aria-label="Show fewer actions"
                (chipClick)="toggleActionsExpanded()"
              />
            }
          </div>
        }
      }

      @if (phase() === 'working') {
        <div
          class="ai-floating-prompt-bar ai-floating-prompt-bar--working"
          role="status"
          aria-live="polite"
          aria-label="AI is working on your request"
        >
          <div class="ai-floating-prompt-progress-host" aria-hidden="true">
            <div class="ai-floating-prompt-progress-ring"></div>
            <i class="modus-icons text-base text-primary" aria-hidden="true">ai_stars</i>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-1">
              <div class="ai-floating-prompt-thinking-label text-sm font-semibold leading-tight">Thinking</div>
              <div class="ai-floating-prompt-thinking-dots" aria-hidden="true">
                <div class="ai-floating-prompt-thinking-dots-dot">.</div>
                <div class="ai-floating-prompt-thinking-dots-dot">.</div>
                <div class="ai-floating-prompt-thinking-dots-dot">.</div>
              </div>
              <div class="inline-flex items-center gap-1 ml-1" aria-hidden="true">
                <modus-logo name="connect" [emblem]="true" customClass="block w-4 h-4 shrink-0" />
                <modus-logo name="sketchup" [emblem]="true" customClass="block w-4 h-4 shrink-0" />
              </div>
            </div>
            <modus-typography hierarchy="p" size="xs" className="text-foreground-60">This might take a minute</modus-typography>
          </div>
          <div
            class="ai-floating-prompt-send-btn ai-floating-prompt-send-btn--stop"
            role="button"
            tabindex="0"
            aria-label="Stop generating response"
            title="Stop"
            (click)="onStopClick()"
            (keydown.enter)="onStopClick()"
            (keydown.space)="onStopClick()"
          >
            <i class="modus-icons" aria-hidden="true">stop_circle</i>
          </div>
        </div>
      } @else if (phase() === 'default') {
        <ai-composer-pill
          [controller]="controller()"
          [placeholder]="placeholder()"
          [embedded]="false"
          anchorPrefix="main"
          (sent)="onComposerSent()"
        />
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiFloatingPromptComponent {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly controller = input.required<AiPanelController>();
  /** Optional placeholder override; otherwise the controller's universal placeholder is used. */
  readonly placeholder = input<string | undefined>(undefined);

  /**
   * Modus pattern split: show `MAX_PRIMARY_CHIPS` suggestions inline plus a
   * `+N` overflow chip when there are more. Clicking the overflow chip
   * expands the rest inline, mirroring `AiUxFollowUpChipRow` from the React
   * reference. Suggestions and actions each show 1 primary chip + a `+N`
   * overflow pill so the row stays compact when both are present.
   */
  readonly MAX_PRIMARY_CHIPS = 1;
  readonly MAX_PRIMARY_ACTIONS = 1;
  readonly chipsExpanded = signal(false);
  readonly actionsExpanded = signal(false);

  readonly visibleSuggestions = computed<readonly string[]>(() => {
    const all = this.controller().suggestions();
    if (this.chipsExpanded()) return all;
    return all.slice(0, this.MAX_PRIMARY_CHIPS);
  });

  readonly overflowSuggestionCount = computed(() => {
    if (this.chipsExpanded()) return 0;
    const total = this.controller().suggestions().length;
    return Math.max(0, total - this.MAX_PRIMARY_CHIPS);
  });

  readonly visibleActions = computed<readonly AgentAction[]>(() => {
    const all = this.controller().actions();
    if (this.actionsExpanded()) return all;
    return all.slice(0, this.MAX_PRIMARY_ACTIONS);
  });

  readonly overflowActionCount = computed(() => {
    if (this.actionsExpanded()) return 0;
    const total = this.controller().actions().length;
    return Math.max(0, total - this.MAX_PRIMARY_ACTIONS);
  });

  /**
   * Snapshot of `messages().length` taken when the user dismisses the response
   * card. The card stays hidden until the count moves past this value (i.e.
   * the user sends another message), which restores the card automatically.
   */
  readonly dismissedAtCount = signal<number | null>(null);

  readonly showResponseCard = computed(() => {
    const c = this.controller();
    if (c.thinking()) return c.messages().length > 0;
    if (c.panelOpen()) return true;
    const count = c.messages().length;
    if (count === 0) return false;
    return this.dismissedAtCount() !== count;
  });

  /**
   * Three phases mirroring the Modus React reference:
   *   - `'working'`: thinking with no prior messages → standalone working pill
   *     (progress ring + Thinking… + Stop), like React's `FloatingPromptWorkingState`.
   *   - `'review'`: response card visible → header toolbar + messages + embedded
   *     follow-up pill, like React's `FloatingPromptReviewState`.
   *   - `'default'`: starter chips above the input pill, like React's
   *     `FloatingPromptDefaultState`.
   */
  readonly phase = computed<'default' | 'working' | 'review'>(() => {
    const c = this.controller();
    if (c.drawerOpen()) return 'default';
    if (c.thinking() && c.messages().length === 0) return 'working';
    if (this.showResponseCard()) return 'review';
    return 'default';
  });

  toggleChipsExpanded(): void {
    this.chipsExpanded.update(v => !v);
  }

  toggleActionsExpanded(): void {
    this.actionsExpanded.update(v => !v);
  }

  toggleDrawer(): void {
    this.controller().toggleDrawer();
  }

  /** Placeholder; feedback is not wired to a real backend yet. */
  onFeedback(_kind: 'up' | 'down'): void {
    // no-op for now (matches React reference's non-functional thumbs buttons)
  }

  /** Composer pill emits `sent` whenever the user submits; restore the card. */
  onComposerSent(): void {
    this.dismissedAtCount.set(null);
  }

  /**
   * Touching the floating prompt's composer or chip row while the side drawer
   * is open should hand the conversation back to the floating prompt by
   * closing the drawer. `mousedown` covers pointer interaction (fires before
   * focus, so the close happens immediately on click), `focusin` covers
   * keyboard tab-in. The outer `.ai-floating-prompt` wrapper is
   * `pointer-events: none`, so these only fire on the interactive children
   * (pill, chips) -- empty space around the pill stays inert.
   */
  @HostListener('mousedown')
  @HostListener('focusin')
  onFloatingPromptInteract(): void {
    if (this.controller().drawerOpen()) {
      this.controller().closeDrawer();
    }
  }

  onStopClick(): void {
    this.controller().stop();
  }

  /** Hide the response card without losing conversation memory. */
  dismissCard(): void {
    this.dismissedAtCount.set(this.controller().messages().length);
    this.controller().close();
  }

  handleAction(action: AgentAction): void {
    this.dismissedAtCount.set(null);
    this.controller().executeAction(action);
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

  /**
   * Stop click bubbling so the shell's document-level deselection logic does
   * not clear widget focus when the user interacts with the prompt.
   */
  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
