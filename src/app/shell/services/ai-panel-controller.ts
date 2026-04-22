import { ApplicationRef, Injector, Signal, computed, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiService, type AiChatMessage, type AiContext, type AiStreamEvent, type LocalResponder } from '../../services/ai.service';
import { WidgetFocusService } from './widget-focus.service';
import type { AgentAction } from '../../data/widget-agents';
import type { AiToolsService } from '../../services/ai-tools.service';

export interface PendingAction {
  toolName: string;
  args: Record<string, unknown>;
  description: string;
}

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  pendingAction?: PendingAction;
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
  aiToolsService?: AiToolsService;
  contextKey?: Signal<string>;
  injector: Injector;
}

export class AiPanelController {
  readonly panelOpen = signal(false);
  readonly messages = signal<AiMessage[]>([]);
  readonly inputText = signal('');
  readonly thinking = signal(false);
  readonly actions: Signal<AgentAction[]>;
  private messageCounter = 0;
  private streamSub: Subscription | null = null;
  private conversationMemory = new Map<string, { messages: AiMessage[]; counter: number }>();
  private lastAgentKey: string | null = null;

  readonly title: Signal<string>;
  readonly subtitle: Signal<string>;
  readonly suggestions: Signal<string[]>;

  private readonly widgetFocusService: WidgetFocusService;
  private readonly aiService: AiService;
  private readonly router: Router;
  private readonly contextBuilder: AiContextBuilder;
  private readonly localResponderFn?: () => LocalResponder | undefined;
  private readonly actionsProviderFn?: () => AgentAction[];
  private readonly aiToolsService?: AiToolsService;
  private readonly contextKeyFn?: Signal<string>;
  private readonly injector: Injector;

  readonly hasPendingAction = computed(() =>
    this.messages().some(m => m.pendingAction != null)
  );

  private resolveAgentKey(): string {
    const widgetId = this.widgetFocusService.selectedWidgetId();
    if (widgetId) return widgetId;
    return this.contextKeyFn?.() ?? '__default__';
  }

  constructor(config: AiPanelConfig) {
    this.widgetFocusService = config.widgetFocusService;
    this.aiService = config.aiService;
    this.router = config.router;
    this.contextBuilder = config.contextBuilder;
    this.localResponderFn = config.localResponder;
    this.actionsProviderFn = config.actionsProvider;
    this.aiToolsService = config.aiToolsService;
    this.contextKeyFn = config.contextKey;
    this.injector = config.injector;

    this.title = this.widgetFocusService.aiAssistantTitle;
    this.subtitle = this.widgetFocusService.aiAssistantSubtitle;

    const defaults = config.defaultSuggestions;
    const isSignal = typeof defaults === 'function' && 'set' in defaults === false;

    this.suggestions = computed(() =>
      this.widgetFocusService.aiSuggestions() ??
      (isSignal ? (defaults as Signal<string[]>)() : defaults as string[])
    );

    this.actions = computed(() => this.actionsProviderFn?.() ?? []);

    effect(() => {
      const agentKey = this.resolveAgentKey();
      if (agentKey === this.lastAgentKey) return;

      if (this.lastAgentKey && this.messages().length > 0) {
        this.conversationMemory.set(this.lastAgentKey, {
          messages: this.messages(),
          counter: this.messageCounter,
        });
      }
      this.lastAgentKey = agentKey;

      this.streamSub?.unsubscribe();
      this.streamSub = null;
      this.thinking.set(false);

      const stored = this.conversationMemory.get(agentKey);
      if (stored) {
        this.messages.set(stored.messages);
        this.messageCounter = stored.counter;
      } else {
        this.messages.set([]);
        this.messageCounter = 0;
      }
    }, { injector: config.injector });
  }

  private static readonly MAX_CONVERSATIONS = 50;

  private saveConversation(): void {
    const agentKey = this.resolveAgentKey();
    this.conversationMemory.delete(agentKey);
    this.conversationMemory.set(agentKey, {
      messages: this.messages(),
      counter: this.messageCounter,
    });

    if (this.conversationMemory.size > AiPanelController.MAX_CONVERSATIONS) {
      const oldest = this.conversationMemory.keys().next().value;
      if (oldest !== undefined) this.conversationMemory.delete(oldest);
    }
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
    if (!text || this.thinking() || this.hasPendingAction()) return;

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

    if (this.aiToolsService) {
      const toolSchemas = this.aiToolsService.getToolSchemas();
      this.streamSub = this.aiService.sendMessageWithTools(text, history, toolSchemas, context, localResponder).subscribe({
        next: (event: AiStreamEvent) => {
          if (event.type === 'text' && event.text) {
            this.messages.update(msgs =>
              msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text + event.text } : m),
            );
          } else if (event.type === 'tool_call' && event.toolCall) {
            const tc = event.toolCall;
            const description = this.describeToolCall(tc.name, tc.args);
            this.messages.update(msgs =>
              msgs.map(m => m.id === assistantMsgId
                ? { ...m, streaming: false, pendingAction: { toolName: tc.name, args: tc.args, description } }
                : m),
            );
          }
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
    } else {
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
  }

  confirmAction(messageId: number): void {
    if (!this.aiToolsService) return;
    const msg = this.messages().find(m => m.id === messageId);
    if (!msg?.pendingAction) return;

    const { toolName, args } = msg.pendingAction;
    const result = this.aiToolsService.execute(toolName, args);

    this.messages.update(msgs =>
      msgs.map(m => m.id === messageId
        ? { ...m, pendingAction: undefined, text: m.text + '\n\n' + (result.success ? result.message : 'Failed: ' + result.message) }
        : m),
    );
    this.saveConversation();

    this.injector.get(ApplicationRef).tick();
  }

  cancelAction(messageId: number): void {
    this.messages.update(msgs =>
      msgs.map(m => m.id === messageId
        ? { ...m, pendingAction: undefined, text: m.text + '\n\nAction cancelled.' }
        : m),
    );
    this.saveConversation();
  }

  private describeToolCall(name: string, args: Record<string, unknown>): string {
    const friendly = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const details = Object.entries(args)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? this.fmtNum(v) : String(v)}`)
      .join(', ');
    return `${friendly} (${details})`;
  }

  private fmtNum(v: number): string {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
    return `$${v}`;
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
