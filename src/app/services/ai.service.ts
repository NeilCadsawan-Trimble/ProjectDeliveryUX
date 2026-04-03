import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WidgetFocusService } from '../shell/services/widget-focus.service';

export interface AiContext {
  page: string;
  selectedWidget?: string;
  widgetName?: string;
  projectId?: number;
  projectName?: string;
  projectData?: string;
  agentPrompt?: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type LocalResponder = (query: string) => string;

export interface AiStreamEvent {
  type: 'text' | 'tool_call';
  text?: string;
  toolCall?: { name: string; args: Record<string, unknown> };
}

const TOOL_CALL_REGEX = /<!--TOOL_CALL:(.*?)-->/;

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly widgetFocusService = inject(WidgetFocusService);

  sendMessage(
    userText: string,
    conversationHistory: AiChatMessage[],
    context?: AiContext,
    localResponder?: LocalResponder,
  ): Observable<string> {
    return new Observable<string>((subscriber) => {
      const abortController = new AbortController();

      const messages: AiChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userText },
      ];

      const contextString = this.buildContextString(context);

      this.streamResponse(messages, contextString, context?.agentPrompt, undefined, abortController.signal, subscriber)
        .catch((err) => {
          if (err.name === 'AbortError') return;

          if (localResponder && this.isNetworkError(err)) {
            subscriber.next(localResponder(userText));
            subscriber.complete();
          } else {
            subscriber.error(err);
          }
        });

      return () => abortController.abort();
    });
  }

  sendMessageWithTools(
    userText: string,
    conversationHistory: AiChatMessage[],
    toolSchemas: object[],
    context?: AiContext,
    localResponder?: LocalResponder,
  ): Observable<AiStreamEvent> {
    return new Observable<AiStreamEvent>((subscriber) => {
      const abortController = new AbortController();

      const messages: AiChatMessage[] = [
        ...conversationHistory,
        { role: 'user', content: userText },
      ];

      const contextString = this.buildContextString(context);

      this.streamResponseWithTools(messages, contextString, context?.agentPrompt, toolSchemas, abortController.signal, subscriber)
        .catch((err) => {
          if (err.name === 'AbortError') return;

          if (localResponder && this.isNetworkError(err)) {
            subscriber.next({ type: 'text', text: localResponder(userText) });
            subscriber.complete();
          } else {
            subscriber.error(err);
          }
        });

      return () => abortController.abort();
    });
  }

  buildContext(page: string, extra?: Partial<AiContext>): AiContext {
    const widgetId = this.widgetFocusService.selectedWidgetId();
    const widgetName = this.widgetFocusService.selectedWidgetName();
    return {
      page,
      selectedWidget: widgetId ?? undefined,
      widgetName: widgetName ?? undefined,
      ...extra,
    };
  }

  private buildContextString(context?: AiContext): string {
    if (!context) return '';
    const parts: string[] = [];
    parts.push(`Page: ${context.page}`);
    if (context.projectId != null) parts.push(`Project ID: ${context.projectId}`);
    if (context.projectName) parts.push(`Project: ${context.projectName}`);
    if (context.widgetName) parts.push(`Focused widget: ${context.widgetName}`);
    if (context.projectData) parts.push(`Project data:\n${context.projectData}`);
    return parts.join('\n');
  }

  private isNetworkError(err: unknown): boolean {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) return true;
    if (err instanceof DOMException && err.name === 'NetworkError') return true;
    return false;
  }

  private async streamResponse(
    messages: AiChatMessage[],
    context: string,
    agentPrompt: string | undefined,
    tools: object[] | undefined,
    signal: AbortSignal,
    subscriber: { next: (value: string) => void; complete: () => void; error: (err: unknown) => void },
  ): Promise<void> {
    const bodyObj: Record<string, unknown> = { messages, context, agentPrompt };
    if (tools && tools.length > 0) bodyObj['tools'] = tools;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
      signal,
    });

    if (!res.ok) {
      let errorMsg = `API error (${res.status})`;
      try {
        const errBody = await res.json();
        errorMsg = errBody.error || errBody.details || errorMsg;
      } catch {
        // use default error message
      }
      subscriber.next(errorMsg);
      subscriber.complete();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      subscriber.next('Unable to read response stream.');
      subscriber.complete();
      return;
    }

    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          subscriber.next(chunk);
        }
      }
    } finally {
      reader.releaseLock();
      subscriber.complete();
    }
  }

  private async streamResponseWithTools(
    messages: AiChatMessage[],
    context: string,
    agentPrompt: string | undefined,
    tools: object[],
    signal: AbortSignal,
    subscriber: { next: (value: AiStreamEvent) => void; complete: () => void; error: (err: unknown) => void },
  ): Promise<void> {
    const bodyObj: Record<string, unknown> = { messages, context, agentPrompt };
    if (tools.length > 0) bodyObj['tools'] = tools;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj),
      signal,
    });

    if (!res.ok) {
      let errorMsg = `API error (${res.status})`;
      try {
        const errBody = await res.json();
        errorMsg = errBody.error || errBody.details || errorMsg;
      } catch {
        // use default error message
      }
      subscriber.next({ type: 'text', text: errorMsg });
      subscriber.complete();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      subscriber.next({ type: 'text', text: 'Unable to read response stream.' });
      subscriber.complete();
      return;
    }

    const decoder = new TextDecoder();
    let textBuffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        textBuffer += chunk;

        let match = TOOL_CALL_REGEX.exec(textBuffer);
        while (match) {
          const beforeMarker = textBuffer.substring(0, match.index);
          if (beforeMarker) {
            subscriber.next({ type: 'text', text: beforeMarker });
          }
          try {
            const parsed = JSON.parse(match[1]);
            subscriber.next({ type: 'tool_call', toolCall: parsed });
          } catch {
            subscriber.next({ type: 'text', text: match[0] });
          }
          textBuffer = textBuffer.substring(match.index + match[0].length);
          match = TOOL_CALL_REGEX.exec(textBuffer);
        }

        if (textBuffer && !textBuffer.includes('<!--')) {
          subscriber.next({ type: 'text', text: textBuffer });
          textBuffer = '';
        }
      }
      if (textBuffer) {
        subscriber.next({ type: 'text', text: textBuffer });
      }
    } finally {
      reader.releaseLock();
      subscriber.complete();
    }
  }
}
