import { ApplicationRef, Injectable, Injector, Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AiService, type AiChatMessage, type AiContext, type AiStreamEvent, type LocalResponder } from '../../services/ai.service';
import { WidgetFocusService } from './widget-focus.service';
import { AiPageContextService } from './ai-page-context.service';
import { DataStoreService } from '../../data/data-store.service';
import { PersonaService } from '../../services/persona.service';
import { AiToolsService, isSupportedRecordDetail, type NavigationResolution } from '../../services/ai-tools.service';
import { getAgent, getSuggestions, type AgentAction, type AgentDataState } from '../../data/widget-agents';
import type { DetailView } from './canvas-detail-manager';

export interface PendingAction {
  toolName: string;
  args: Record<string, unknown>;
  description: string;
  /**
   * When set, the assistant message renders a two-option choice instead of
   * Confirm/Cancel. Used for the canvas + Home navigation prompt.
   */
  choice?: NavigationChoice;
}

export interface NavigationChoice {
  url: string;
  label: string;
  detailView: DetailView;
}

/**
 * Optional bridge that lets the panel controller hand a freestanding canvas
 * detail to the active page (Home). The page registers itself when it mounts
 * and de-registers on destroy.
 */
export interface CanvasDetailHandler {
  /** Returns true if this page can render the given detail as a freestanding tile. */
  canHandle(detail: DetailView): boolean;
  /** Returns true if the page successfully spawned the freestanding overlay. */
  openFreestandingDetail(detail: DetailView, label: string): boolean;
}

export interface AiMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  pendingAction?: PendingAction;
}

/**
 * Conversation-memory keys are formatted as `persona:<slug>|<rest>` so each
 * persona has an isolated set of agent conversations. Returns the slug portion,
 * or `null` when the key predates the persona-prefixed format.
 */
function personaSlugFromKey(key: string): string | null {
  if (!key.startsWith('persona:')) return null;
  const pipe = key.indexOf('|');
  return pipe === -1 ? key.slice('persona:'.length) : key.slice('persona:'.length, pipe);
}

/**
 * Universal AI Assistant controller.
 *
 * Single root-provided singleton shared across every page in the app. Pages
 * supply their own context, suggestions, actions, etc. via
 * {@link AiPageContextService}; this controller falls back to widget-agent
 * defaults derived from the current route + DataStore when no page-specific
 * registration is active.
 */
@Injectable({ providedIn: 'root' })
export class AiPanelController {
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly aiService = inject(AiService);
  private readonly aiToolsService = inject(AiToolsService);
  private readonly router = inject(Router);
  private readonly aiPageContext = inject(AiPageContextService);
  private readonly dataStore = inject(DataStoreService);
  private readonly personaService = inject(PersonaService);
  private readonly injector = inject(Injector);

  readonly panelOpen = signal(false);
  readonly messages = signal<AiMessage[]>([]);
  readonly inputText = signal('');
  readonly thinking = signal(false);
  /**
   * Override agent for the AI assistant. When set, this agent answers regardless
   * of the focused widget or the page-registered context provider — used to
   * hand off to the global home assistant when a widget agent decides the user's
   * query is out of scope. Auto-clears when the user selects another widget or
   * navigates to a new route.
   */
  private readonly _forcedAgentId = signal<string | null>(null);
  readonly forcedAgentId = this._forcedAgentId.asReadonly();
  /**
   * Whether the right-side Trimble Assistant slide-out panel (mounted at the
   * dashboard shell level) is currently open. Lifted onto the controller so
   * the floating prompt's "Open Trimble Assistant" toolbar button and the
   * panel itself stay in sync without prop drilling.
   */
  readonly drawerOpen = signal(false);

  readonly title: Signal<string>;
  readonly subtitle: Signal<string>;
  readonly suggestions: Signal<string[]>;
  readonly actions: Signal<AgentAction[]>;
  readonly welcomeText: Signal<string>;
  readonly placeholder: Signal<string>;

  private messageCounter = 0;
  private streamSub: Subscription | null = null;
  private conversationMemory = new Map<string, { messages: AiMessage[]; counter: number }>();
  private lastAgentKey: string | null = null;

  /** Live router URL signal so context-derived state reacts to navigation. */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly hasPendingAction = computed(() =>
    this.messages().some(m => m.pendingAction != null)
  );

  /** Page-supplied canvas-detail handler is read directly from AiPageContextService. */
  private get canvasDetailHandler(): CanvasDetailHandler | null {
    return this.aiPageContext.canvasDetailHandler();
  }

  /** Legacy setter kept for backwards compatibility; pages should use AiPageContextService. */
  setCanvasDetailHandler(handler: CanvasDetailHandler | null): void {
    this.aiPageContext.canvasDetailHandler.set(handler);
  }

  private resolveAgentKey(): string {
    const persona = this.personaService.activePersonaSlug();
    const forced = this._forcedAgentId();
    if (forced) return `persona:${persona}|forced:${forced}`;
    const widgetId = this.widgetFocusService.selectedWidgetId();
    if (widgetId) return `persona:${persona}|${widgetId}`;
    const pageKey = this.aiPageContext.contextKey()?.();
    if (pageKey) return `persona:${persona}|${pageKey}`;
    return `persona:${persona}|shell:${this.getPageName()}`;
  }

  constructor() {
    this.title = computed(() => {
      const forced = this._forcedAgentId();
      if (forced) return getAgent(forced, this.getPageName()).name;
      return this.widgetFocusService.aiAssistantTitle();
    });
    this.subtitle = computed(() => {
      if (this._forcedAgentId()) return 'General Assistant';
      return this.widgetFocusService.aiAssistantSubtitle();
    });

    this.suggestions = computed(() => {
      const forced = this._forcedAgentId();
      const page = this.getPageName();
      if (forced) {
        const agent = getAgent(forced, page);
        const state = this.buildAgentDataState();
        return getSuggestions(agent, state);
      }
      const focused = this.widgetFocusService.aiSuggestions();
      if (focused) return focused;
      const pageSuggestions = this.aiPageContext.suggestionsProvider()?.();
      if (pageSuggestions) return pageSuggestions;
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return getSuggestions(agent, state);
    });

    this.actions = computed(() => {
      const forced = this._forcedAgentId();
      const page = this.getPageName();
      if (forced) {
        const agent = getAgent(forced, page);
        const state = this.buildAgentDataState();
        return agent.actions?.(state) ?? [];
      }
      const pageActions = this.aiPageContext.actionsProvider()?.();
      if (pageActions) return pageActions;
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return agent.actions?.(state) ?? [];
    });

    this.welcomeText = computed(() => {
      return this.aiPageContext.welcomeTextProvider()?.()
        ?? 'Ask me anything about your dashboard.';
    });

    this.placeholder = computed(() => {
      return this.aiPageContext.placeholderProvider()?.()
        ?? 'How may I help you?';
    });

    effect(() => {
      const agentKey = this.resolveAgentKey();
      if (agentKey === this.lastAgentKey) return;

      const personaChanged =
        this.lastAgentKey !== null &&
        personaSlugFromKey(this.lastAgentKey) !== personaSlugFromKey(agentKey);

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

      if (personaChanged) {
        this.inputText.set('');
      }

      const stored = this.conversationMemory.get(agentKey);
      if (stored) {
        this.messages.set(stored.messages);
        this.messageCounter = stored.counter;
      } else {
        this.messages.set([]);
        this.messageCounter = 0;
      }
    });

    // Exit forced general-assistant mode when the user picks a widget.
    effect(() => {
      const id = this.widgetFocusService.selectedWidgetId();
      if (id !== null) {
        untracked(() => {
          if (this._forcedAgentId() !== null) this._forcedAgentId.set(null);
        });
      }
    });

    // Exit forced general-assistant mode on route change. The route handle-off
    // is typically the user's signal that they want fresh page-default context.
    effect(() => {
      this.currentUrl();
      untracked(() => {
        if (this._forcedAgentId() !== null) this._forcedAgentId.set(null);
      });
    });
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

  openModal(): void {
    this.panelOpen.set(true);
  }

  /** Open the modal and send the current input text in one motion. Used by the Spotlight Enter key. */
  openAndSend(): void {
    if (!this.inputText().trim()) {
      this.openModal();
      return;
    }
    this.panelOpen.set(true);
    this.send();
  }

  close(): void {
    this.panelOpen.set(false);
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v);
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  /**
   * Cancel an in-flight streaming response. Used by the Stop button on the
   * floating prompt while {@link thinking} is true. Closes the active
   * subscription, marks any streaming assistant message as no longer streaming,
   * and persists the partial state so the user can resume from there.
   */
  stop(): void {
    if (!this.streamSub && !this.thinking()) return;
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.thinking.set(false);
    this.messages.update(msgs =>
      msgs.map(m =>
        m.streaming
          ? { ...m, streaming: false, text: m.text || '(stopped)' }
          : m,
      ),
    );
    this.saveConversation();
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

    const context = this.buildContext();
    const localResponder = this.resolveLocalResponder();

    // Only inject `route_to_general_assistant` when a widget agent is the active
    // context. The general assistant must never re-route (would loop).
    const widgetFocused =
      this._forcedAgentId() === null && this.widgetFocusService.selectedWidgetId() !== null;
    const toolSchemas = this.aiToolsService.getToolSchemasForContext({ widgetFocused });
    this.streamSub = this.aiService.sendMessageWithTools(text, history, toolSchemas, context, localResponder).subscribe({
      next: (event: AiStreamEvent) => {
        if (event.type === 'text' && event.text) {
          this.messages.update(msgs =>
            msgs.map(m => m.id === assistantMsgId ? { ...m, text: m.text + event.text } : m),
          );
        } else if (event.type === 'tool_call' && event.toolCall) {
          const tc = event.toolCall;
          this.handleToolCall(assistantMsgId, tc.name, tc.args);
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
  }

  confirmAction(messageId: number): void {
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

  /** Resolve a `tool_call` event into either a Confirm gate, a choice prompt, or immediate execution. */
  private handleToolCall(assistantMsgId: number, toolName: string, args: Record<string, unknown>): void {
    if (toolName === 'route_to_general_assistant') {
      this.handleRouteToGeneralAssistant(assistantMsgId, args);
      return;
    }

    if (toolName === 'navigate_to_page') {
      const choice = this.maybeBuildNavigationChoice(args);
      if (choice) {
        this.messages.update(msgs =>
          msgs.map(m => m.id === assistantMsgId
            ? { ...m, streaming: false, pendingAction: { toolName, args, description: choice.label, choice } }
            : m),
        );
        return;
      }
    }

    const tool = this.aiToolsService.getTool(toolName);
    if (tool?.autoExecute) {
      const result = this.aiToolsService.execute(toolName, args);
      this.messages.update(msgs =>
        msgs.map(m => m.id === assistantMsgId
          ? { ...m, streaming: false, text: (m.text ? m.text + '\n\n' : '') + (result.success ? result.message : 'Failed: ' + result.message) }
          : m),
      );
      if (toolName === 'navigate_to_page' && result.success) {
        this.close();
      }
      return;
    }

    const description = this.describeToolCall(toolName, args);
    this.messages.update(msgs =>
      msgs.map(m => m.id === assistantMsgId
        ? { ...m, streaming: false, pendingAction: { toolName, args, description } }
        : m),
    );
  }

  /**
   * The focused widget agent has decided the user's request is outside its
   * scope and called `route_to_general_assistant`. Replace the in-flight
   * assistant placeholder with a one-line note in the widget thread, switch
   * the active context to the global home assistant, and re-issue the original
   * user query so it streams against the new agent.
   */
  private handleRouteToGeneralAssistant(assistantMsgId: number, args: Record<string, unknown>): void {
    const widgetName = this.widgetFocusService.selectedWidgetName() ?? 'this widget';
    const generalAgentId = 'homeDefault';
    const generalAgent = getAgent(generalAgentId, this.getPageName());
    const originalQuery = String(args['query'] ?? '').trim();

    // Widget thread: replace the streaming placeholder with the routing note,
    // stop streaming, persist.
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.messages.update(msgs => msgs.map(m => m.id === assistantMsgId
      ? { ...m, streaming: false, text: `Routed to ${generalAgent.name} \u2014 outside ${widgetName}'s scope.` }
      : m));
    this.thinking.set(false);
    this.saveConversation();

    if (!originalQuery) {
      // Defensive: nothing to re-issue. Still switch context so the next
      // user message lands on the general assistant.
      this.widgetFocusService.clearSelection();
      this._forcedAgentId.set(generalAgentId);
      return;
    }

    // Switch context. Clearing selection runs first; the agent-key effect then
    // saves the widget thread and loads (or creates) the forced general thread.
    this.widgetFocusService.clearSelection();
    this._forcedAgentId.set(generalAgentId);

    // Re-issue the original query in the general thread on the next microtask
    // so the agent-key swap effect has run and `send()` writes into the new
    // memory bucket.
    queueMicrotask(() => {
      this.inputText.set(originalQuery);
      this.send();
    });
  }

  /**
   * Returns a NavigationChoice if the user is on Home + canvas AND the
   * destination is a supported record detail AND a canvas detail handler is
   * registered. Otherwise returns null (caller falls back to auto-execute).
   */
  private maybeBuildNavigationChoice(args: Record<string, unknown>): NavigationChoice | null {
    const handler = this.canvasDetailHandler;
    if (!handler) return null;

    const ctx = this.buildContext();
    if (ctx.viewMode !== 'canvas') return null;
    if (!this.isHomeRoute(ctx.currentRoute)) return null;

    const destination = args['destination'];
    if (typeof destination !== 'string' || !isSupportedRecordDetail(destination)) return null;

    const resolved: NavigationResolution = this.aiToolsService.resolveNavigation(args);
    if (resolved.kind !== 'detail') return null;
    if (!handler.canHandle(resolved.detailView)) return null;

    return { url: resolved.url, label: resolved.label, detailView: resolved.detailView };
  }

  private isHomeRoute(currentRoute: string | undefined): boolean {
    if (!currentRoute) return false;
    const path = currentRoute.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);
    return segments.length === 1;
  }

  /** User picked "Navigate to page" on a navigation-choice pendingAction. */
  chooseNavigation(messageId: number): void {
    const msg = this.messages().find(m => m.id === messageId);
    const choice = msg?.pendingAction?.choice;
    if (!choice) return;

    this.messages.update(msgs =>
      msgs.map(m => m.id === messageId
        ? { ...m, pendingAction: undefined, text: m.text + `\n\nOpening ${choice.label}.` }
        : m),
    );
    this.saveConversation();
    void this.router.navigateByUrl(choice.url);
    this.close();
  }

  /** User picked "Open in canvas window" on a navigation-choice pendingAction. */
  chooseCanvasOverlay(messageId: number): void {
    const msg = this.messages().find(m => m.id === messageId);
    const choice = msg?.pendingAction?.choice;
    if (!choice) return;

    const handler = this.canvasDetailHandler;
    const opened = handler?.openFreestandingDetail(choice.detailView, choice.label) ?? false;
    const followUp = opened
      ? `Opened ${choice.label} in a canvas window.`
      : `Could not open ${choice.label} as a canvas window. Navigating instead.`;

    this.messages.update(msgs =>
      msgs.map(m => m.id === messageId
        ? { ...m, pendingAction: undefined, text: m.text + '\n\n' + followUp }
        : m),
    );
    this.saveConversation();

    if (!opened) {
      void this.router.navigateByUrl(choice.url);
      this.close();
    }
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
      this.router.navigate([this.toPersonaPath(path)], { queryParams });
    }
  }

  /**
   * Agent action `route` values are authored persona-relative (e.g. `/projects`,
   * `/financials/job-costs/oak-grove`). The app's real routes live under
   * `/:persona/...`, so navigating to `/projects` matches `:persona='projects'`,
   * fails the persona guard, and bounces to `/select`. Prefix the active persona
   * slug here so every action chip lands on the correct page. Routes that are
   * already persona-prefixed or top-level (login/select/auth) pass through.
   */
  private toPersonaPath(path: string): string {
    const trimmed = path?.trim() || '/';
    if (
      trimmed.startsWith('/login') ||
      trimmed.startsWith('/select') ||
      trimmed.startsWith('/auth/')
    ) {
      return trimmed;
    }
    const firstSeg = trimmed.split('/').filter(Boolean)[0];
    if (firstSeg && PersonaService.isValidPersona(firstSeg)) {
      return trimmed;
    }
    const persona = this.personaService.activePersonaSlug();
    const suffix = trimmed === '/' ? '' : trimmed;
    return `/${persona}${suffix}`;
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

  // ───── Default context derivation (fallback when no page registers) ─────

  private buildContext(): AiContext {
    const forced = this._forcedAgentId();
    const page = this.getPageName();
    if (forced) {
      const agent = getAgent(forced, page);
      const state = this.buildAgentDataState();
      return this.aiService.buildContext(page, {
        projectData: agent.buildContext(state),
        agentPrompt: agent.systemPrompt,
      });
    }
    const pageContext = this.aiPageContext.contextProvider()?.();
    if (pageContext) return pageContext;
    const widgetId = this.widgetFocusService.selectedWidgetId();
    const agent = getAgent(widgetId, page);
    const state = this.buildAgentDataState();
    return this.aiService.buildContext(page, {
      projectData: agent.buildContext(state),
      agentPrompt: agent.systemPrompt,
    });
  }

  private resolveLocalResponder(): LocalResponder | undefined {
    const forced = this._forcedAgentId();
    const page = this.getPageName();
    if (forced) {
      const agent = getAgent(forced, page);
      const state = this.buildAgentDataState();
      return (query: string) => agent.localRespond(query, state);
    }
    const accessor = this.aiPageContext.localResponder();
    const pageResponder = accessor ? accessor() : undefined;
    if (pageResponder) return pageResponder;
    const widgetId = this.widgetFocusService.selectedWidgetId();
    const agent = getAgent(widgetId, page);
    const state = this.buildAgentDataState();
    return (query: string) => agent.localRespond(query, state);
  }

  private getRouteSuffix(): string {
    const url = this.currentUrl();
    const slug = this.personaService.activePersonaSlug();
    const prefix = `/${slug}`;
    return url.startsWith(prefix) ? url.slice(prefix.length) || '/' : url;
  }

  private getPageName(): string {
    const suffix = this.getRouteSuffix();
    if (suffix.startsWith('/projects')) return 'projects';
    if (suffix.startsWith('/project/')) return 'project-dashboard';
    if (suffix.startsWith('/financials/job-costs/')) return 'financials-job-cost-detail';
    if (suffix.startsWith('/financials')) return 'financials';
    return 'home';
  }

  private buildAgentDataState(): AgentDataState {
    const page = this.getPageName();
    const state: AgentDataState = {
      projects: this.dataStore.projects(),
      estimates: this.dataStore.estimates(),
      activities: this.dataStore.activities(),
      attentionItems: this.dataStore.attentionItems(),
      timeOffRequests: this.dataStore.timeOffRequests(),
      rfis: this.dataStore.rfis(),
      submittals: this.dataStore.submittals(),
      calendar: this.dataStore.calendarAppointments(),
      changeOrders: this.dataStore.changeOrders(),
      dailyReports: this.dataStore.dailyReports(),
      weatherForecast: this.dataStore.weatherForecast(),
      projectAttentionItems: this.dataStore.projectAttentionItems(),
      inspections: this.dataStore.inspections(),
      punchListItems: this.dataStore.punchListItems(),
      projectRevenue: this.dataStore.projectRevenue(),
      allWeatherData: this.dataStore.weatherData(),
      allJobCosts: this.dataStore.projectJobCosts(),
      currentPage: page,
      personaSlug: this.personaService.activePersonaSlug(),
    };
    if (page === 'financials-job-cost-detail') {
      const suffix = this.getRouteSuffix();
      const slug = suffix.replace('/financials/job-costs/', '').split('?')[0];
      const proj = this.dataStore.findProjectBySlug(slug);
      if (proj) {
        state.jobCostDetailProject = this.dataStore.projectJobCosts().find(p => p.projectId === proj.id) ?? undefined;
        state.projectName = proj.name;
      }
    }
    return state;
  }
}
