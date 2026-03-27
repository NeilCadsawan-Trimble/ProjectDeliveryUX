import { Injector, Signal, computed, effect, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { AiService, type AiChatMessage, type AiContext } from '../../services/ai.service';
import { WidgetFocusService } from './widget-focus.service';

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
  defaultSuggestions: string[] | Signal<string[]>;
  contextBuilder: AiContextBuilder;
  injector: Injector;
}

export class AiPanelController {
  readonly panelOpen = signal(false);
  readonly messages = signal<AiMessage[]>([]);
  readonly inputText = signal('');
  readonly thinking = signal(false);
  private messageCounter = 0;
  private streamSub: Subscription | null = null;

  readonly title: Signal<string>;
  readonly subtitle: Signal<string>;
  readonly suggestions: Signal<string[]>;

  private readonly widgetFocusService: WidgetFocusService;
  private readonly aiService: AiService;
  private readonly contextBuilder: AiContextBuilder;

  constructor(config: AiPanelConfig) {
    this.widgetFocusService = config.widgetFocusService;
    this.aiService = config.aiService;
    this.contextBuilder = config.contextBuilder;

    this.title = this.widgetFocusService.aiAssistantTitle;
    this.subtitle = this.widgetFocusService.aiAssistantSubtitle;

    const defaults = config.defaultSuggestions;
    const isSignal = typeof defaults === 'function' && 'set' in defaults === false;

    this.suggestions = computed(() =>
      this.widgetFocusService.aiSuggestions() ??
      (isSignal ? (defaults as Signal<string[]>)() : defaults as string[])
    );

    effect(() => {
      this.widgetFocusService.selectedWidgetId();
      this.streamSub?.unsubscribe();
      this.streamSub = null;
      this.messages.set([]);
      this.thinking.set(false);
    }, { injector: config.injector });
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

    this.streamSub = this.aiService.sendMessage(text, history, context).subscribe({
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
      },
      complete: () => {
        this.messages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m),
        );
        this.thinking.set(false);
      },
    });
  }

  destroy(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
  }
}
