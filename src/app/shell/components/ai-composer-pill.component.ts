import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLogoComponent } from '../../components/modus-logo.component';
import { AiPanelController } from '../services/ai-panel-controller';
import { WidgetFocusService } from '../services/widget-focus.service';
import { VoiceInputService } from '../../services/voice-input.service';
import { PersonaService } from '../../services/persona.service';
import {
  PERSONA_TOOL_CONTEXTS,
  DEFAULT_PERSONA_TOOL_CONTEXTS,
  type PersonaToolContext,
} from '../../data/persona-tool-contexts';

/**
 * Module-level one-shot guard for app-load auto-focus. The first non-embedded
 * composer pill to mount in the app session focuses its textarea once, then
 * sets this flag so subsequent default-phase remounts (e.g. after closing the
 * review card) do not steal focus from whatever the user is doing.
 */
let _initialFocusApplied = false;

interface SourcesMenuAction {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly kind: SourceKind;
}

type ToolItem = PersonaToolContext;

interface FloatingPromptSource {
  readonly id: string;
  readonly title: string;
  readonly meta: string;
  readonly icon: string;
}

type SourceKind = 'file' | 'doc' | 'link' | 'connect';

/**
 * Modus AI composer pill — input bar with sources/tools menus, textarea, and
 * send/stop button. Extracted so the same pill can be used inline by
 * {@link AiFloatingPromptComponent} and embedded inside both the response card
 * and the {@link AiAssistantPanelComponent} drawer.
 *
 * The markup here is an exact lift of the prior `pillTpl` `<ng-template>`;
 * behaviour and styling are unchanged.
 */
@Component({
  selector: 'ai-composer-pill',
  imports: [ModusTypographyComponent, ModusLogoComponent],
  template: `
    <div class="ai-floating-prompt-bar" [class.ai-floating-prompt-bar--embedded]="embedded()">
      <div class="ai-floating-prompt-menu-anchor" [attr.data-anchor]="anchorPrefix() + '-sources'">
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

      <div class="ai-floating-prompt-menu-anchor" [attr.data-anchor]="anchorPrefix() + '-tools'">
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
            <div class="ai-floating-prompt-menu-list">
            @for (item of toolsItems(); track item.id) {
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
          </div>
        }
      </div>

      <textarea
        #composerInput
        class="ai-floating-prompt-textarea flex-1 min-w-0"
        rows="1"
        [value]="controller().inputText()"
        [attr.aria-label]="'Message ' + controller().title()"
        [placeholder]="effectivePlaceholder()"
        (input)="onComposerInput($event)"
        (keydown)="onComposerKeydown($event)"
      ></textarea>

      <div
        class="ai-floating-prompt-icon-button"
        role="button"
        [attr.tabindex]="voice.supported() ? 0 : -1"
        [class.is-listening]="voice.listening()"
        [class.is-connecting]="voice.connecting()"
        [class.is-disabled]="!voice.supported()"
        [attr.aria-disabled]="!voice.supported() || null"
        [attr.aria-pressed]="voice.listening()"
        aria-label="Voice input"
        [title]="micTooltip()"
        (click)="onMicClick()"
        (keydown.enter)="onMicClick()"
        (keydown.space)="onMicClick()"
      >
        <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ voice.listening() ? 'stop' : 'mic' }}</i>
      </div>

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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiComposerPillComponent {
  private readonly widgetFocus = inject(WidgetFocusService);
  /**
   * Singleton dictation pipeline. Public so the template can bind directly to
   * its `listening`, `connecting`, `supported`, and `error` signals without
   * forwarding them through component computeds.
   */
  readonly voice = inject(VoiceInputService);
  private readonly persona = inject(PersonaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly controller = input.required<AiPanelController>();
  /** Optional placeholder override; otherwise the controller's universal placeholder is used. */
  readonly placeholder = input<string | undefined>(undefined);
  readonly embedded = input<boolean>(false);
  readonly anchorPrefix = input<string>('main');

  /** Emitted whenever the user submits a new message; parent uses this to clear dismissal. */
  readonly sent = output<void>();

  readonly sourcesOpen = signal(false);
  readonly toolsOpen = signal(false);

  private readonly composerInputRef = viewChild<ElementRef<HTMLTextAreaElement>>('composerInput');

  /**
   * Snapshot of the textarea contents at the moment dictation started, so
   * each Deepgram interim/final transcript appends to whatever the user
   * already typed instead of clobbering it.
   */
  private dictationBaseText = '';

  /**
   * Tooltip text for the mic button. Reflects current state (idle, listening,
   * connecting, error, unsupported) so screen-reader users and hovering users
   * get the same guidance without an extra alert region.
   */
  readonly micTooltip = computed(() => {
    if (!this.voice.supported()) return 'Voice input not supported in this browser';
    const err = this.voice.error();
    if (err === 'denied') return 'Microphone access denied. Allow it in your browser settings to dictate.';
    if (err === 'token-failed') return 'Voice service unavailable. Try again in a moment.';
    if (err === 'network') return 'Voice connection lost. Click to retry.';
    if (err === 'connect-failed') return 'Could not connect to voice service. Click to retry.';
    if (this.voice.connecting()) return 'Connecting to voice service…';
    if (this.voice.listening()) return 'Stop listening';
    return 'Dictate';
  });

  constructor() {
    // Auto-focus the composer textarea on initial app load so the user can
    // start typing immediately. Guarded by a module-level flag and the
    // `embedded` input so this fires exactly once for the main floating
    // prompt and never steals focus from the embedded card/drawer pills.
    afterNextRender(() => {
      if (this.embedded() || _initialFocusApplied) return;
      const el = this.composerInputRef()?.nativeElement;
      if (!el) return;
      el.focus();
      _initialFocusApplied = true;
    });

    // When the AI controller starts thinking (the user-visible response is
    // streaming), end any in-flight dictation. Otherwise the recorder keeps
    // capturing while the assistant talks back, which is wasteful and can
    // bleed audio from the response into the next prompt.
    effect(() => {
      if (this.controller().thinking() && this.voice.listening()) {
        this.voice.stop();
      }
    });

    // Stop dictation if the tab is hidden -- browsers throttle MediaRecorder
    // and AudioContext and the user usually wants the session ended anyway.
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        this.voice.stop();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
      this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisibility));
    }

    // Pill teardown -- always release the mic and close the socket. Other
    // pills (review card, drawer) share the singleton service so calling
    // stop here is a no-op when this pill wasn't the one driving dictation.
    this.destroyRef.onDestroy(() => this.voice.stop());
  }

  /**
   * Local placeholder list of attached sources. Mirrors the React reference's
   * local-state behavior; not persisted, not wired to a real upload backend.
   */
  readonly attachedSources = signal<readonly FloatingPromptSource[]>([]);

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

  /**
   * Persona-aware Tools catalog. Each persona (Owner, PM, Office Admin,
   * Field Engineer, Estimator) sees a different working set of contexts —
   * the data lives in {@link PERSONA_TOOL_CONTEXTS} so editing the catalog
   * never touches the component template. Falls back to the Owner list
   * when the active slug is not keyed.
   */
  readonly toolsItems = computed<readonly ToolItem[]>(
    () => PERSONA_TOOL_CONTEXTS[this.persona.activePersonaSlug()] ?? DEFAULT_PERSONA_TOOL_CONTEXTS,
  );

  toggleSources(): void {
    this.toolsOpen.set(false);
    this.sourcesOpen.update(v => !v);
  }

  toggleTools(): void {
    this.sourcesOpen.set(false);
    this.toolsOpen.update(v => !v);
  }

  onSourcesAction(item: SourcesMenuAction): void {
    this.addSource(item.kind);
  }

  /** React reference behavior: each action appends a demo row to the attached list. */
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

  onComposerInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value ?? '';
    this.controller().inputText.set(value);
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSend()) {
        this.voice.stop();
        this.sent.emit();
        this.controller().send();
      }
    }
  }

  onSendClick(): void {
    if (this.canSend()) {
      this.voice.stop();
      this.sent.emit();
      this.controller().send();
    }
  }

  onStopClick(): void {
    this.controller().stop();
  }

  /**
   * Voice-input toggle. First click starts a Deepgram streaming session via
   * VoiceInputService; subsequent transcripts (interim + final) are merged
   * into whatever the user already typed and pushed into
   * `controller.inputText` so the bound textarea updates in real time.
   * Second click stops the session. No-op when voice is unsupported.
   */
  onMicClick(): void {
    if (!this.voice.supported()) return;
    if (this.voice.listening() || this.voice.connecting()) {
      this.voice.stop();
      return;
    }
    this.dictationBaseText = this.controller().inputText();
    void this.voice.start((text, _isFinal) => {
      const base = this.dictationBaseText;
      const merged = base ? (text ? `${base.replace(/\s+$/, '')} ${text}` : base) : text;
      this.controller().inputText.set(merged);
    });
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
    if (this.sourcesOpen() || this.toolsOpen()) {
      this.sourcesOpen.set(false);
      this.toolsOpen.set(false);
    }
    // Escape always cancels an in-flight dictation, even when no menu is
    // open. The composer keeps focus and the textarea retains whatever was
    // already transcribed -- consistent with how Send and tab-hide behave.
    if (this.voice.listening() || this.voice.connecting()) {
      this.voice.stop();
    }
  }
}
