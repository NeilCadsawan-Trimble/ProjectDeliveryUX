import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { AiIconComponent } from './ai-icon.component';
import { AiPanelController } from '../services/ai-panel-controller';
import type { AgentAction } from '../../data/widget-agents';

@Component({
  selector: 'ai-assistant-panel',
  imports: [ModusUtilityPanelComponent, AiIconComponent],
  host: {
    '(click)': '$event.stopPropagation()',
  },
  template: `
    <modus-utility-panel
      [expanded]="controller().panelOpen()"
      className="fixed-utility-panel"
      position="right"
      panelWidth="380px"
      ariaLabel="AI Assistant"
    >
      <div slot="header" class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <ai-icon variant="solid-white" size="sm" />
          </div>
          <div class="min-w-0">
            <div class="text-base font-semibold text-foreground truncate">{{ controller().title() }}</div>
            <div class="text-xs text-foreground-60 truncate">{{ controller().subtitle() }}</div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          @if (controller().messages().length > 0) {
            <div
              class="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-muted transition-colors duration-150"
              (click)="controller().clearConversation()"
              role="button"
              aria-label="New conversation"
              title="New conversation"
            >
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">add</i>
            </div>
          }
          <div
            class="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-muted transition-colors duration-150"
            (click)="controller().toggle()"
            role="button"
            aria-label="Close AI Assistant"
          >
            <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
          </div>
        </div>
      </div>

      <div slot="body" class="flex flex-col h-full min-h-0">
        @if (controller().messages().length === 0 && !controller().thinking()) {
          <div class="flex flex-col items-center gap-4 px-4 pt-6 pb-2">
            <div class="w-14 h-14 rounded-full bg-primary-20 flex items-center justify-center">
              <ai-icon variant="solid-colored" size="lg" />
            </div>
            <div class="text-center">
              <div class="text-base font-semibold text-foreground">How can I help?</div>
              <div class="text-sm text-foreground-60 mt-1">{{ welcomeText() }}</div>
            </div>
            <div class="flex flex-col gap-2 w-full mt-2">
              @for (suggestion of controller().suggestions(); track suggestion) {
                <div
                  class="px-4 py-2.5 rounded-lg border-default bg-card text-sm text-foreground cursor-pointer hover:bg-muted transition-colors duration-150 text-left"
                  (click)="controller().selectSuggestion(suggestion)"
                  role="button"
                  tabindex="0"
                  [attr.aria-label]="'Ask: ' + suggestion"
                  (keydown.enter)="controller().selectSuggestion(suggestion)"
                  (keydown.space)="$event.preventDefault(); controller().selectSuggestion(suggestion)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-sm text-primary flex-shrink-0" aria-hidden="true">chevron_right</i>
                    <div>{{ suggestion }}</div>
                  </div>
                </div>
              }
            </div>

            @if (controller().actions().length > 0) {
              <div class="w-full mt-3 border-top-default pt-3">
                <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wider mb-2 px-1">Quick Actions</div>
                <div class="flex flex-col gap-1.5">
                  @for (action of controller().actions(); track action.id) {
                    <div
                      class="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm text-foreground cursor-pointer hover:bg-secondary transition-colors duration-150"
                      (click)="handleAction(action)"
                      role="button"
                      tabindex="0"
                      [attr.aria-label]="action.label"
                      (keydown.enter)="handleAction(action)"
                    >
                      <i class="modus-icons text-sm text-primary flex-shrink-0" aria-hidden="true">lightning</i>
                      <div>{{ action.label }}</div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        @if (controller().messages().length > 0) {
          <div class="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1" aria-live="polite" role="log" aria-label="Chat messages">
            @for (msg of controller().messages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed">
                    {{ msg.text }}
                  </div>
                </div>
              } @else {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ai-icon variant="solid-colored" size="xs" />
                  </div>
                  <div class="flex flex-col gap-2 max-w-[85%]">
                    @if (msg.text) {
                      <div class="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-card border-default text-sm text-foreground leading-relaxed whitespace-pre-wrap ai-msg-body"
                        [innerHTML]="renderMessage(msg.text)"
                        (click)="onMessageClick($event)"
                      ></div>
                    }
                    @if (msg.pendingAction) {
                      <div class="rounded-xl border-primary bg-primary-20 p-3">
                        <div class="flex items-center gap-2 mb-2">
                          <i class="modus-icons text-sm text-primary" aria-hidden="true">file_edit</i>
                          <div class="text-xs font-semibold text-primary uppercase tracking-wider">Proposed Change</div>
                        </div>
                        <div class="text-sm text-foreground mb-3">{{ msg.pendingAction.description }}</div>
                        <div class="flex items-center gap-2">
                          <div
                            class="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium cursor-pointer hover:opacity-90 transition-opacity"
                            role="button"
                            tabindex="0"
                            (click)="controller().confirmAction(msg.id)"
                            (keydown.enter)="controller().confirmAction(msg.id)"
                          >Confirm</div>
                          <div
                            class="px-3 py-1.5 rounded-lg border-default bg-card text-foreground text-xs font-medium cursor-pointer hover:bg-muted transition-colors"
                            role="button"
                            tabindex="0"
                            (click)="controller().cancelAction(msg.id)"
                            (keydown.enter)="controller().cancelAction(msg.id)"
                          >Cancel</div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            }

            @if (controller().thinking()) {
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ai-icon variant="solid-colored" size="xs" />
                </div>
                <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border-default">
                  <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            }

            @if (!controller().thinking() && controller().actions().length > 0) {
              <div class="flex flex-wrap gap-1.5 mt-1">
                @for (action of controller().actions(); track action.id) {
                  <div
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-foreground cursor-pointer hover:bg-secondary transition-colors duration-150"
                    (click)="handleAction(action)"
                    role="button"
                  >
                    <i class="modus-icons text-xs text-primary" aria-hidden="true">lightning</i>
                    <div>{{ action.label }}</div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <div slot="footer" class="w-full overflow-hidden box-border min-h-[70px]">
        <div class="flex items-end gap-2 px-2 pt-2 pb-1">
          <textarea
            #chatInput
            class="flex-1 min-h-[72px] max-h-[160px] text-sm rounded-lg border-default bg-background text-foreground resize-none outline-none focus:border-primary transition-colors duration-150 placeholder:text-foreground-40 p-1"
            [class.opacity-50]="controller().hasPendingAction()"
            [placeholder]="controller().hasPendingAction() ? 'Confirm or cancel the pending action first' : placeholder()"
            rows="2"
            [value]="controller().inputText()"
            (input)="controller().inputText.set($any($event.target).value)"
            (keydown)="controller().handleKeydown($event)"
            [attr.disabled]="controller().hasPendingAction() ? '' : null"
            aria-label="Message input"
          ></textarea>
          <div
            class="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
            [class.bg-primary]="controller().inputText().trim().length > 0 && !controller().thinking() && !controller().hasPendingAction()"
            [class.bg-muted]="!controller().inputText().trim().length || controller().thinking() || controller().hasPendingAction()"
            (click)="controller().send()"
            role="button"
            aria-label="Send message"
          >
            <i
              class="modus-icons text-sm"
              [class.text-primary-foreground]="controller().inputText().trim().length > 0 && !controller().thinking() && !controller().hasPendingAction()"
              [class.text-foreground-40]="!controller().inputText().trim().length || controller().thinking() || controller().hasPendingAction()"
              aria-hidden="true"
            >paper_plane</i>
          </div>
        </div>
        @if (showDisclaimer()) {
          <div class="text-center pb-1">
            <div class="text-2xs text-foreground-40 leading-tight">AI may make mistakes. Verify important info.</div>
          </div>
        }
      </div>
    </modus-utility-panel>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantPanelComponent {
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly chatInput = viewChild<ElementRef<HTMLTextAreaElement>>('chatInput');

  readonly controller = input.required<AiPanelController>();
  readonly welcomeText = input('Ask me anything about this page.');
  readonly placeholder = input('Type a message...');
  readonly showDisclaimer = input(true);

  private readonly focusEffect = effect(() => {
    const isOpen = this.controller().panelOpen();
    if (isOpen) {
      setTimeout(() => this.chatInput()?.nativeElement.focus(), 0);
    }
  });

  handleAction(action: AgentAction): void {
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
      '<div class="font-semibold inline">$1</div>'
    );

    escaped = escaped.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary underline hover:text-primary-80 cursor-pointer" data-ai-link>$1</a>'
    );

    return this.sanitizer.bypassSecurityTrustHtml(escaped);
  }
}
