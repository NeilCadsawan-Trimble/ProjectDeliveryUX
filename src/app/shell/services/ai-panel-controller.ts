import { Injector, Signal, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiService, type AiChatMessage, type AiContext, type LocalResponder } from '../../services/ai.service';
import { WidgetFocusService } from './widget-focus.service';
import type { AgentAction } from '../../data/widget-agents';

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

export type AiContextBuilder = () => AiContext;

export interface AiPanelConfig {
  widgetFocusService: WidgetFocusService;
  aiService: AiService;
  router: Router;
  defaultSuggestions: string[] | Signal<string[]>;
  contextBuilder: AiContextBuilder;
  localResponder?: () => LocalResponder | undefined;
  actionsProvider?: () => AgentAction[];
  injector: Injector;
}

export class AiPanelController {
  readonly panelOpen = signal(false);
  readonly messages = signal<AiMessage[]>([]);
  readonly inputText = signal('');
  readonly thinking = signal(false);
  readonly actions = signal<AgentAction[]>([]);
  private messageCounter = 0;
  private streamSub: Subscription | null = null;
  private conversationMemory = new Map<string, { messages: AiMessage[]; counter: number }>();

  readonly title: Signal<string>;
  readonly subtitle: Signal<string>;
  readonly suggestions: Signal<string[]>;

  private readonly widgetFocusService: WidgetFocusService;
  private readonly aiService: AiService;
  private readonly router: Router;
  private readonly contextBuilder: AiContextBuilder;
  private readonly localResponderFn?: () => LocalResponder | undefined;
  private readonly actionsProviderFn?: () => AgentAction[];

  constructor(config: AiPanelConfig) {
    this.widgetFocusService = config.widgetFocusService;
    this.aiService = config.aiService;
    this.router = config.router;
    this.contextBuilder = config.contextBuilder;
    this.localResponderFn = config.localResponder;
    this.actionsProviderFn = config.actionsProvider;

    this.title = this.widgetFocusService.aiAssistantTitle;
    this.subtitle = this.widgetFocusService.aiAssistantSubtitle;

    const defaults = config.defaultSuggestions;
    const isSignal = typeof defaults === 'function' && 'set' in defaults === false;

    this.suggestions = computed(() =>
      this.widgetFocusService.aiSuggestions() ??
      (isSignal ? (defaults as Signal<string[]>)() : defaults as string[])
    );

    effect(() => {
      const widgetId = this.widgetFocusService.selectedWidgetId();
      this.streamSub?.unsubscribe();
      this.streamSub = null;
      this.thinking.set(false);

      const agentKey = widgetId ?? '__default__';
      const stored = this.conversationMemory.get(agentKey);
      if (stored) {
        this.messages.set(stored.messages);
        this.messageCounter = stored.counter;
      } else {
        this.messages.set([]);
        this.messageCounter = 0;
      }

      if (this.actionsProviderFn) {
        this.actions.set(this.actionsProviderFn());
      }
    }, { injector: config.injector });
  }

  private saveConversation(): void {
    const agentKey = this.widgetFocusService.selectedWidgetId() ?? '__default__';
    this.conversationMemory.set(agentKey, {
      messages: this.messages(),
      counter: this.messageCounter,
    });
  }

  toggle(): void {
    this.panelOpen.update(v => !v);
  }

  close(): void {
    this.panelOpen.set(false);
  }

  selectSuggestion(suggestion: string): void {
    this.inputText.set(suggestion);
    this.send();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send(): void {
    const text = this.inputText().trim();
    if (!text || this.thinking()) return;

    this.streamSub?.unsubscribe();

    this.messages.update(msgs => [
      ...msgs,
      { id: ++this.messageCounter, role: 'user', text },
    ]);
    this.inputText.set('');
    this.thinking.set(true);

    const assistantMsgId = ++this.messageCounter;
    this.messages.update(msgs => [
      ...msgs,
      { id: assistantMsgId, role: 'assistant', text: '', streaming: true },
    ]);

    const history: AiChatMessage[] = this.messages()
      .filter(m => m.id !== assistantMsgId)
      .map(m => ({ role: m.role, content: m.text }));

    const context = this.contextBuilder();
    const localResponder = this.localResponderFn?.();

    this.streamSub = this.aiService.sendMessage(text, history, context, localResponder).subscribe({
      next: (chunk) => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text + chunk } : m),
        );
      },
      error: () => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text || 'Sorry, something went wrong. Please try again.', streaming: false } : m),
        );
        this.thinking.set(false);
        this.saveConversation();
      },
      complete: () => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m),
        );
        this.thinking.set(false);
        this.saveConversation();
      },
    });
  }

  executeAction(action: AgentAction): void {
    if (this.thinking()) return;

    this.messages.update(msgs => [
      ...msgs,
      { id: ++this.messageCounter, role: 'user', text: action.label },
    ]);

    const result = action.execute({});

    this.messages.update(msgs => [
      ...msgs,
      { id: ++this.messageCounter, role: 'assistant', text: result },
    ]);
    this.saveConversation();

    if (action.route) {
      const [path, query] = action.route.split('?');
      const queryParams: Record<string, string> = {};
      if (query) {
        for (const pair of query.split('&')) {
          const [k, v] = pair.split('=');
          if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
        }
      }
      this.router.navigate([path || '/'], { queryParams });
    }
  }

  clearConversation(): void {
    this.messages.set([]);
    this.messageCounter = 0;
    this.saveConversation();
  }

  destroy(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
  }
}
