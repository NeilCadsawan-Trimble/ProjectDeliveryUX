import { Injectable, signal } from '@angular/core';
import type { AiContext, LocalResponder } from '../../services/ai.service';
import type { AgentAction } from '../../data/widget-agents';
import type { CanvasDetailHandler } from './ai-panel-controller';

export type AiContextProviderFn = () => AiContext;
export type AiActionsProviderFn = () => AgentAction[];
export type AiSuggestionsProviderFn = () => string[];
export type AiLocalResponderFn = LocalResponder;
export type AiContextKeyFn = () => string;

export interface AiPageContextRegistration {
  contextProvider?: AiContextProviderFn;
  actionsProvider?: AiActionsProviderFn;
  suggestionsProvider?: AiSuggestionsProviderFn;
  localResponder?: () => AiLocalResponderFn | undefined;
  contextKey?: AiContextKeyFn;
  title?: () => string;
  subtitle?: () => string;
  welcomeText?: () => string;
  /** Optional override for the navbar AI Spotlight input placeholder. */
  placeholder?: () => string;
  /**
   * If provided, the shell controller will offer a "Open in canvas window"
   * choice when the user is on this page in canvas mode and asks to navigate
   * to a supported record detail.
   */
  canvasDetailHandler?: CanvasDetailHandler;
}

/**
 * Page-scoped AI context registration used by the shell's single AiPanelController.
 *
 * Pages with richer context (e.g. project-dashboard) call register() in ngOnInit and
 * clear() in ngOnDestroy. The shell controller consults these signals before falling
 * back to the widget-agent defaults derived from the active route.
 */
@Injectable({ providedIn: 'root' })
export class AiPageContextService {
  readonly contextProvider = signal<AiContextProviderFn | null>(null);
  readonly actionsProvider = signal<AiActionsProviderFn | null>(null);
  readonly suggestionsProvider = signal<AiSuggestionsProviderFn | null>(null);
  readonly localResponder = signal<(() => AiLocalResponderFn | undefined) | null>(null);
  readonly contextKey = signal<AiContextKeyFn | null>(null);
  readonly titleProvider = signal<(() => string) | null>(null);
  readonly subtitleProvider = signal<(() => string) | null>(null);
  readonly welcomeTextProvider = signal<(() => string) | null>(null);
  readonly placeholderProvider = signal<(() => string) | null>(null);
  readonly canvasDetailHandler = signal<CanvasDetailHandler | null>(null);

  register(reg: AiPageContextRegistration): void {
    this.contextProvider.set(reg.contextProvider ?? null);
    this.actionsProvider.set(reg.actionsProvider ?? null);
    this.suggestionsProvider.set(reg.suggestionsProvider ?? null);
    this.localResponder.set(reg.localResponder ?? null);
    this.contextKey.set(reg.contextKey ?? null);
    this.titleProvider.set(reg.title ?? null);
    this.subtitleProvider.set(reg.subtitle ?? null);
    this.welcomeTextProvider.set(reg.welcomeText ?? null);
    this.placeholderProvider.set(reg.placeholder ?? null);
    this.canvasDetailHandler.set(reg.canvasDetailHandler ?? null);
  }

  clear(): void {
    this.contextProvider.set(null);
    this.actionsProvider.set(null);
    this.suggestionsProvider.set(null);
    this.localResponder.set(null);
    this.contextKey.set(null);
    this.titleProvider.set(null);
    this.subtitleProvider.set(null);
    this.welcomeTextProvider.set(null);
    this.placeholderProvider.set(null);
    this.canvasDetailHandler.set(null);
  }
}
