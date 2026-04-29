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
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ModusWcChip, ModusWcIcon } from '@trimble-oss/moduswebcomponents-angular';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLogoComponent } from '../../components/modus-logo.component';
import { AiPanelController } from '../services/ai-panel-controller';
import { WidgetFocusService } from '../services/widget-focus.service';
import type { AgentAction } from '../../data/widget-agents';

interface SourcesMenuAction {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly kind: SourceKind;
}

interface ToolItem {
  readonly id: string;
  readonly icon?: string;
  readonly logoEmblem?: boolean;
  readonly label: string;
  readonly description: string;
}

interface FloatingPromptSource {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly icon: string;
}

type SourceKind = 'file' | 'doc' | 'link' | 'connect';

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
 *   - Trimble Assistant drawer: right-side slide-out that mirrors the same
 *     `AiPanelController` state (expanded view of the same conversation).
 *
 * Conversational state stays on the shared {@link AiPanelController}
 * singleton so per-page registrations (suggestions, actions, navigation
 * choice gates, persona context, etc.) continue to work unchanged.
 */
@Component({
  selector: 'ai-floating-prompt',
  imports: [
    NgTemplateOutlet,
    ModusWcChip,
    ModusWcIcon,
    ModusTypographyComponent,
    ModusLogoComponent,
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
                [attr.aria-pressed]="drawerOpen()"
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
            <ng-container [ngTemplateOutlet]="pillTpl" [ngTemplateOutletContext]="{ embedded: true, anchorPrefix: 'card' }"></ng-container>
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
        <ng-container [ngTemplateOutlet]="pillTpl" [ngTemplateOutletContext]="{ embedded: false, anchorPrefix: 'main' }"></ng-container>
      }

      @if (drawerOpen()) {
        <div class="ai-floating-prompt-drawer-portal" aria-hidden="false">
          <div
            class="ai-floating-prompt-drawer-dismiss"
            role="button"
            aria-label="Dismiss Trimble Assistant"
            tabindex="-1"
            (click)="closeDrawer()"
          ></div>
          <div
            class="ai-floating-prompt-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Trimble Assistant"
            tabindex="-1"
          >
            <div class="ai-floating-prompt-drawer-header">
              <div class="flex items-center gap-2 min-w-0">
                <div class="w-7 h-7 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0">
                  <i class="modus-icons text-base text-primary" aria-hidden="true">ai_stars</i>
                </div>
                <modus-typography hierarchy="h3" size="md" weight="semibold" className="truncate">Trimble Assistant</modus-typography>
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
              @if (controller().messages().length === 0 && !controller().thinking()) {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i class="modus-icons text-sm text-primary" aria-hidden="true">ai_stars</i>
                  </div>
                  <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ controller().welcomeText() }}</modus-typography>
                </div>
              }
              @for (msg of controller().messages(); track msg.id) {
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
            </div>
            <div class="ai-floating-prompt-drawer-composer">
              <ng-container [ngTemplateOutlet]="pillTpl" [ngTemplateOutletContext]="{ embedded: true, anchorPrefix: 'drawer' }"></ng-container>
              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mt-2 ml-2">AI can make mistakes. Check important info.</modus-typography>
            </div>
          </div>
        </div>
      }
    </div>

    <ng-template #pillTpl let-embedded="embedded" let-anchorPrefix="anchorPrefix">
      <div class="ai-floating-prompt-bar" [class.ai-floating-prompt-bar--embedded]="embedded">
        <div class="ai-floating-prompt-menu-anchor" [attr.data-anchor]="anchorPrefix + '-sources'">
          <div
            class="ai-floating-prompt-icon-button"
            role="button"
            tabindex="0"
            aria-label="Add source"
            title="Sources"
            [attr.aria-expanded]="sourcesOpen()"
            aria-haspopup="menu"
            (click)="toggleSources()"
            (keydown.enter)="toggleSources()"
          >
            @if (attachedSources().length > 0) {
              <div class="flex items-center gap-1">
                <i class="modus-icons text-base text-foreground-60" aria-hidden="true">paperclip</i>
                <div class="ai-floating-prompt-source-count" aria-hidden="true">{{ attachedSources().length }}</div>
                <i class="modus-icons text-xs text-foreground-60" aria-hidden="true">expand_more</i>
              </div>
            } @else {
              <i class="modus-icons text-base text-foreground-60" aria-hidden="true">add</i>
            }
          </div>
          @if (sourcesOpen()) {
            <div class="ai-floating-prompt-menu" role="menu" aria-label="Sources">
              <div class="px-4 pt-3 pb-2">
                <modus-typography hierarchy="p" size="sm" weight="semibold">Sources</modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mt-1">Attach files, project documents, links, and cloud references. They are embedded in this prompt and shown to the model as context.</modus-typography>
              </div>
              <div class="border-bottom-default mx-2"></div>
              <div class="px-4 pt-2 pb-1">
                <modus-typography hierarchy="p" size="xs" weight="semibold">In this prompt</modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mt-1">Add a source to this prompt</modus-typography>
              </div>
              @for (item of sourcesActions; track item.id) {
                <div
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                  role="menuitem"
                  tabindex="0"
                  (click)="onSourcesAction(item)"
                  (keydown.enter)="onSourcesAction(item)"
                >
                  <i class="modus-icons text-base text-foreground-60 flex-shrink-0" aria-hidden="true">{{ item.icon }}</i>
                  <modus-typography hierarchy="p" size="sm">{{ item.label }}</modus-typography>
                </div>
              }
              @if (attachedSources().length > 0) {
                <div class="border-bottom-default mx-2 mt-1"></div>
                <div class="flex flex-col gap-1 px-3 py-2" role="list" aria-label="Sources in this prompt">
                  @for (source of attachedSources(); track source.id) {
                    <div class="flex items-center gap-2 px-1 py-1 rounded-lg" role="listitem">
                      <i class="modus-icons text-base text-foreground-60 flex-shrink-0" aria-hidden="true">{{ source.icon }}</i>
                      <div class="flex flex-col min-w-0 flex-1">
                        <modus-typography hierarchy="p" size="sm" className="truncate">{{ source.title }}</modus-typography>
                        <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ source.meta }}</modus-typography>
                      </div>
                      <div
                        class="ai-floating-prompt-toolbar-button"
                        role="button"
                        tabindex="0"
                        aria-label="Remove source"
                        title="Remove"
                        (click)="removeSource(source.id)"
                        (keydown.enter)="removeSource(source.id)"
                      >
                        <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">close</i>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="px-4 pb-2 pt-1">
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">No sources yet. Choose an action below to add one.</modus-typography>
                </div>
              }
            </div>
          }
        </div>

        <div class="ai-floating-prompt-menu-anchor" [attr.data-anchor]="anchorPrefix + '-tools'">
          <div
            class="ai-floating-prompt-icon-button"
            role="button"
            tabindex="0"
            aria-label="Tools"
            title="Tools"
            [attr.aria-expanded]="toolsOpen()"
            aria-haspopup="menu"
            (click)="toggleTools()"
            (keydown.enter)="toggleTools()"
          >
            <i class="modus-icons text-base text-foreground-60" aria-hidden="true">tune</i>
          </div>
          @if (toolsOpen()) {
            <div class="ai-floating-prompt-menu" role="menu" aria-label="Tools">
              <div class="px-4 pt-3 pb-2">
                <modus-typography hierarchy="p" size="sm" weight="semibold">Tools</modus-typography>
                <modus-typography hierarchy="p" size="xs" className="text-foreground-60 mt-1">Connect Trimble and field workflows. Availability depends on your product and entitlements (placeholder).</modus-typography>
              </div>
              <div class="border-bottom-default mx-2"></div>
              @for (item of toolsItems; track item.id) {
                <div
                  class="flex items-start gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                  role="menuitem"
                  tabindex="0"
                  (click)="onToolsSelect(item)"
                  (keydown.enter)="onToolsSelect(item)"
                >
                  <div class="ai-floating-prompt-menu-start-icon mt-0.5">
                    @if (item.logoEmblem) {
                      <modus-logo name="connect" [emblem]="true" customClass="block w-4 h-4 shrink-0" />
                    } @else {
                      <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ item.icon }}</i>
                    }
                  </div>
                  <div class="flex flex-col min-w-0">
                    <modus-typography hierarchy="p" size="sm">{{ item.label }}</modus-typography>
                    <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ item.description }}</modus-typography>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <textarea
          class="ai-floating-prompt-textarea flex-1 min-w-0"
          rows="1"
          [value]="controller().inputText()"
          [attr.aria-label]="'Message ' + controller().title()"
          [placeholder]="effectivePlaceholder()"
          (input)="onComposerInput($event)"
          (keydown)="onComposerKeydown($event)"
        ></textarea>

        @if (controller().thinking()) {
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
        } @else {
          <div
            class="ai-floating-prompt-send-btn"
            role="button"
            [attr.tabindex]="canSend() ? 0 : -1"
            [class.is-disabled]="!canSend()"
            [attr.aria-disabled]="!canSend()"
            aria-label="Send message"
            title="Send"
            (click)="canSend() && onSendClick()"
            (keydown.enter)="canSend() && onSendClick()"
            (keydown.space)="canSend() && onSendClick()"
          >
            <i class="modus-icons" aria-hidden="true">arrow_up</i>
          </div>
        }
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiFloatingPromptComponent {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly widgetFocus = inject(WidgetFocusService);

  readonly controller = input.required<AiPanelController>();
  /** Optional placeholder override; otherwise the controller's universal placeholder is used. */
  readonly placeholder = input<string | undefined>(undefined);

  readonly sourcesOpen = signal(false);
  readonly toolsOpen = signal(false);

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

  /**
   * Local placeholder list of attached sources. Mirrors the React reference's
   * local-state behavior; not persisted, not wired to a real upload backend.
   */
  readonly attachedSources = signal<readonly FloatingPromptSource[]>([]);

  /** Whether the Trimble Assistant drawer is currently open. */
  readonly drawerOpen = signal(false);

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
    if (c.thinking() && c.messages().length === 0) return 'working';
    if (this.showResponseCard()) return 'review';
    return 'default';
  });

  readonly canSend = computed(() => this.controller().inputText().trim().length > 0);

  readonly effectivePlaceholder = computed(() => {
    const name = this.widgetFocus.selectedWidgetName();
    if (name) return `Ask about ${name}`;
    return this.placeholder() ?? this.controller().placeholder();
  });

  readonly sourcesActions: readonly SourcesMenuAction[] = [
    { id: 'attach-url', icon: 'link', label: 'Attach URL', kind: 'link' },
    { id: 'upload-file', icon: 'upload', label: 'Upload file from computer', kind: 'file' },
    { id: 'add-document', icon: 'file_text', label: 'Add project document', kind: 'doc' },
    { id: 'browse-connect', icon: 'cloud_upload', label: 'Browse Trimble Connect', kind: 'connect' },
  ];

  readonly toolsItems: readonly ToolItem[] = [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'layout', icon: 'location', label: 'Field & machine data', description: 'Layout files, control points, or GNSS' },
    { id: 'bim', icon: 'buildings', label: 'Model coordination', description: 'Tekla, BIM, and clash context' },
    { id: 'geo', icon: 'map', label: 'Geospatial & mapping', description: 'Surfaces, imagery, and boundaries' },
    { id: 'quantities', icon: 'table', label: 'Quantities & takeoff', description: 'Length, area, and counts' },
    { id: 'clash', icon: 'warning_outlined', label: 'Clash & issues', description: 'Multi-trade review helpers' },
  ];

  toggleChipsExpanded(): void {
    this.chipsExpanded.update(v => !v);
  }

  toggleActionsExpanded(): void {
    this.actionsExpanded.update(v => !v);
  }

  toggleSources(): void {
    this.toolsOpen.set(false);
    this.sourcesOpen.update(v => !v);
  }

  toggleTools(): void {
    this.sourcesOpen.set(false);
    this.toolsOpen.update(v => !v);
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  /** React reference behavior: each action appends a demo row to the attached list. */
  onSourcesAction(item: SourcesMenuAction): void {
    this.addSource(item.kind);
  }

  addSource(kind: SourceKind): void {
    const id = `src-${Date.now()}`;
    let row: FloatingPromptSource;
    switch (kind) {
      case 'file':
        row = { id, title: 'Upload_sketch_001.jpg', meta: 'Image (demo add)', icon: 'image' };
        break;
      case 'doc':
        row = { id, title: 'RFP_Section_04_revB.docx', meta: 'Document (demo add)', icon: 'file_text' };
        break;
      case 'link':
        row = { id, title: 'Issue #1284', meta: 'Link · connect.trimble.com', icon: 'link' };
        break;
      default:
        row = { id, title: 'Trimble Connect · Shared folder', meta: 'Cloud folder (demo add)', icon: 'cloud_upload' };
    }
    this.attachedSources.update(prev => [...prev, row]);
  }

  removeSource(id: string): void {
    this.attachedSources.update(prev => prev.filter(s => s.id !== id));
  }

  onToolsSelect(_item: ToolItem): void {
    this.toolsOpen.set(false);
  }

  /** Placeholder; feedback is not wired to a real backend yet. */
  onFeedback(_kind: 'up' | 'down'): void {
    // no-op for now (matches React reference's non-functional thumbs buttons)
  }

  onComposerInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value ?? '';
    this.controller().inputText.set(value);
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSend()) {
        this.dismissedAtCount.set(null);
        this.controller().send();
      }
    }
  }

  onSendClick(): void {
    if (this.canSend()) {
      this.dismissedAtCount.set(null);
      this.controller().send();
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
   * Close any open Sources or Tools menu when the user clicks outside the bar.
   * Walks up from the click target looking for a `.ai-floating-prompt-menu-anchor`
   * ancestor; the menu only stays open when the click is inside the matching anchor.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.sourcesOpen() && !this.toolsOpen()) return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('.ai-floating-prompt-menu-anchor') as HTMLElement | null;
    const which = anchor?.getAttribute('data-anchor') ?? '';
    if (this.sourcesOpen() && !which.endsWith('-sources')) {
      this.sourcesOpen.set(false);
    }
    if (this.toolsOpen() && !which.endsWith('-tools')) {
      this.toolsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) {
      this.drawerOpen.set(false);
      return;
    }
    if (this.sourcesOpen() || this.toolsOpen()) {
      this.sourcesOpen.set(false);
      this.toolsOpen.set(false);
    }
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
