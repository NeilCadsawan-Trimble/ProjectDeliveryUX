import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusTextInputComponent } from '../../components/modus-text-input.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
import type { ChatChannel, ChatMessage } from '../../data/dashboard-data.types';
import { formatRelativeTimestamp } from './relative-time';

@Component({
  selector: 'app-team-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusTextInputComponent, ModusButtonComponent],
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; }'],
  template: `
    <div class="flex h-full min-h-0">
      @if (channels().length > 1) {
        <div class="w-36 flex-shrink-0 border-right-default overflow-y-auto mb-5">
          @for (ch of channels(); track ch.id) {
            <div
              class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors duration-150"
              [class.bg-primary-20]="selectedChannelId() === ch.id"
              role="button"
              tabindex="0"
              [attr.aria-pressed]="selectedChannelId() === ch.id"
              [attr.aria-label]="'Channel ' + ch.name"
              (click)="selectChannel(ch.id)"
              (keydown.enter)="selectChannel(ch.id)"
              (keydown.space)="$event.preventDefault(); selectChannel(ch.id)"
            >
              <modus-typography
                class="min-w-0 flex-1"
                hierarchy="p"
                size="xs"
                [weight]="selectedChannelId() === ch.id ? 'semibold' : 'normal'"
                className="truncate"
              >{{ ch.name }}</modus-typography>
              @if (unreadByChannel()[ch.id]) {
                <div class="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-hidden="true"></div>
              }
            </div>
          }
        </div>
      }
      <div class="flex-1 min-w-0 flex flex-col min-h-0">
        <div class="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          @for (m of activeMessages(); track m.id) {
            <div class="flex items-start gap-2">
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                [class]="avatarClass(m)"
              >
                <modus-typography size="xs" weight="semibold" className="text-2xs">{{ m.authorInitials }}</modus-typography>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2">
                  <modus-typography hierarchy="p" size="xs" weight="semibold">{{ m.authorName }}</modus-typography>
                  @if (m.isExternal) {
                    <modus-typography size="xs" className="text-foreground-40">External</modus-typography>
                  }
                  <modus-typography size="xs" className="text-foreground-40">{{ formatTime(m.sentAt) }}</modus-typography>
                </div>
                <modus-typography hierarchy="p" size="sm" className="text-foreground">{{ m.body }}</modus-typography>
              </div>
            </div>
          }
          @if (activeMessages().length === 0) {
            <div class="text-center py-8">
              <modus-typography hierarchy="p" size="sm" className="text-foreground-40">No messages yet</modus-typography>
            </div>
          }
        </div>
        <div
          class="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-top-default mb-5"
          (mousedown)="$event.stopPropagation()"
          (touchstart)="$event.stopPropagation()"
          (keydown.enter)="onComposerEnter($event)"
        >
          <div class="flex-1 min-w-0">
            <modus-text-input
              [inputId]="'team-chat-' + (selectedChannelId() ?? 'none')"
              placeholder="Message"
              size="sm"
              [value]="draft()"
              enterkeyhint="send"
              [bordered]="true"
              (inputChange)="onDraftChange($event)"
            />
          </div>
          <modus-button
            color="primary"
            variant="filled"
            size="sm"
            shape="square"
            icon="paper_plane"
            iconPosition="only"
            ariaLabel="Send message"
            [disabled]="!canSend()"
            (buttonClick)="send()"
          />
        </div>
      </div>
    </div>
  `,
})
export class TeamChatComponent {
  readonly channels = input.required<ChatChannel[]>();
  readonly messages = input.required<ChatMessage[]>();
  readonly currentSlug = input<string>('');
  readonly defaultChannelId = input<string | null>(null);
  readonly sendMessage = output<{ channelId: string; body: string }>();

  readonly selectedChannelId = signal<string | null>(null);
  readonly draft = signal('');
  private lastAppliedDefault: string | null = null;

  constructor() {
    effect(() => {
      const list = this.channels();
      const preferred = this.defaultChannelId();
      if (preferred && preferred !== this.lastAppliedDefault && list.some(c => c.id === preferred)) {
        this.lastAppliedDefault = preferred;
        this.selectedChannelId.set(preferred);
        return;
      }
      const current = untracked(() => this.selectedChannelId());
      if (current && list.some(c => c.id === current)) return;
      this.selectedChannelId.set(list[0]?.id ?? null);
    });
  }

  readonly activeMessages = computed(() => {
    const id = this.selectedChannelId();
    if (!id) return [];
    return this.messages()
      .filter(m => m.channelId === id)
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  });

  readonly unreadByChannel = computed<Record<string, boolean>>(() => {
    const slug = this.currentSlug();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const flags: Record<string, boolean> = {};
    for (const m of this.messages()) {
      if (m.authorSlug === slug) continue;
      if (new Date(m.sentAt).getTime() < cutoff) continue;
      flags[m.channelId] = true;
    }
    return flags;
  });

  readonly canSend = computed(() => !!this.selectedChannelId() && this.draft().trim().length > 0);

  selectChannel(id: string): void {
    this.selectedChannelId.set(id);
  }

  onDraftChange(event: InputEvent): void {
    const target = event.target as HTMLInputElement | null;
    this.draft.set(target?.value ?? '');
  }

  onComposerEnter(event: Event): void {
    event.preventDefault();
    this.send();
  }

  send(): void {
    const channelId = this.selectedChannelId();
    const body = this.draft().trim();
    if (!channelId || !body) return;
    this.sendMessage.emit({ channelId, body });
    this.draft.set('');
  }

  formatTime(iso: string): string {
    return formatRelativeTimestamp(iso);
  }

  avatarClass(m: ChatMessage): string {
    if (m.authorSlug === this.currentSlug()) return 'bg-primary text-primary-foreground';
    if (m.isExternal) return 'bg-muted text-foreground';
    return 'bg-secondary text-foreground';
  }
}
