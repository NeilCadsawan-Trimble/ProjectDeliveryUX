import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusLogoComponent } from '../../components/modus-logo.component';
import { AiPanelController } from '../services/ai-panel-controller';
import { WidgetFocusService } from '../services/widget-focus.service';

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

      <div
        class="ai-floating-prompt-icon-button"
        role="button"
        tabindex="0"
        aria-label="Voice input"
        title="Voice input"
        (click)="onMicClick()"
        (keydown.enter)="onMicClick()"
        (keydown.space)="onMicClick()"
      >
        <i class="modus-icons text-base text-foreground-60" aria-hidden="true">mic</i>
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

  readonly controller = input.required<AiPanelController>();
  /** Optional placeholder override; otherwise the controller's universal placeholder is used. */
  readonly placeholder = input<string | undefined>(undefined);
  readonly embedded = input<boolean>(false);
  readonly anchorPrefix = input<string>('main');

  /** Emitted whenever the user submits a new message; parent uses this to clear dismissal. */
  readonly sent = output<void>();

  readonly sourcesOpen = signal(false);
  readonly toolsOpen = signal(false);

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

  readonly toolsItems: readonly ToolItem[] = [
    { id: 'connect', logoEmblem: true, label: 'Trimble Connect', description: 'Projects, files, and updates' },
    { id: 'layout', icon: 'location', label: 'Field & machine data', description: 'Layout files, control points, or GNSS' },
    { id: 'bim', icon: 'buildings', label: 'Model coordination', description: 'Tekla, BIM, and clash context' },
    { id: 'geo', icon: 'map', label: 'Geospatial & mapping', description: 'Surfaces, imagery, and boundaries' },
    { id: 'quantities', icon: 'table', label: 'Quantities & takeoff', description: 'Length, area, and counts' },
    { id: 'clash', icon: 'warning_outlined', label: 'Clash & issues', description: 'Multi-trade review helpers' },
  ];

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
        this.sent.emit();
        this.controller().send();
      }
    }
  }

  onSendClick(): void {
    if (this.canSend()) {
      this.sent.emit();
      this.controller().send();
    }
  }

  onStopClick(): void {
    this.controller().stop();
  }

  /**
   * Voice-input affordance. The Modus floating-prompt pattern reserves a mic
   * button next to Send for speech-to-text. Real speech recognition (Web
   * Speech API or service-side STT) is not wired yet, so this drops a
   * "Listening…" assistant message into the conversation as a placeholder.
   * Emits `sent` first so the floating-prompt parent clears its dismissal
   * gate and the review card expands to surface the new message.
   */
  onMicClick(): void {
    this.sent.emit();
    this.controller().simulateListening();
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
  }
}
