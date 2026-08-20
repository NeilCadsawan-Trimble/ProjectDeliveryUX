import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import type { EmailPriority, WorkEmail } from '../../data/dashboard-data.types';
import { formatRelativeTimestamp } from './relative-time';

const PRIORITY_RANK: Record<EmailPriority, number> = { urgent: 0, high: 1, normal: 2 };

@Component({
  selector: 'app-email-inbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent],
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; }'],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <div class="flex-1 min-h-0 overflow-y-auto mb-5">
        @for (email of sortedEmails(); track email.id) {
          <div
            class="border-bottom-default last:border-b-0"
            [class.bg-primary-20]="expandedId() === email.id"
          >
            <div
              class="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted transition-colors duration-150"
              role="button"
              tabindex="0"
              [attr.aria-expanded]="expandedId() === email.id"
              [attr.aria-label]="'Email from ' + email.fromName + ': ' + email.subject"
              (click)="toggle(email)"
              (keydown.enter)="toggle(email)"
              (keydown.space)="$event.preventDefault(); toggle(email)"
            >
              <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <modus-typography size="xs" weight="semibold" className="text-2xs">{{ email.fromInitials }}</modus-typography>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  @if (email.unread) {
                    <div class="w-2 h-2 rounded-full bg-primary flex-shrink-0" aria-hidden="true"></div>
                  }
                  <modus-typography
                    class="min-w-0 flex-1"
                    hierarchy="p"
                    size="sm"
                    [weight]="email.unread ? 'semibold' : 'normal'"
                    className="truncate"
                  >{{ email.fromName }}</modus-typography>
                  <modus-typography size="xs" className="text-foreground-40 flex-shrink-0">{{ formatTime(email.sentAt) }}</modus-typography>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <modus-typography
                    class="min-w-0 flex-1"
                    hierarchy="p"
                    size="sm"
                    [weight]="email.unread ? 'semibold' : 'normal'"
                    className="truncate"
                  >{{ email.subject }}</modus-typography>
                  @if (email.priority !== 'normal') {
                    <div
                      class="rounded px-1.5 py-0.5 flex-shrink-0"
                      [class]="email.priority === 'urgent' ? 'bg-destructive-20' : 'bg-warning-20'"
                    >
                      <modus-typography
                        size="xs"
                        weight="semibold"
                        [className]="email.priority === 'urgent' ? 'text-2xs text-destructive' : 'text-2xs text-warning'"
                      >{{ email.priority === 'urgent' ? 'Urgent' : 'High' }}</modus-typography>
                    </div>
                  }
                </div>
                @if (expandedId() !== email.id) {
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate mt-0.5">{{ email.preview }}</modus-typography>
                }
                @if (email.projectName && expandedId() !== email.id) {
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-40 truncate">{{ email.projectName }}</modus-typography>
                }
              </div>
            </div>
            @if (expandedId() === email.id) {
              <div class="px-4 pb-4 flex flex-col gap-2">
                <modus-typography hierarchy="p" size="xs" className="text-foreground-40">{{ email.fromEmail }}</modus-typography>
                @if (email.projectName) {
                  <modus-typography hierarchy="p" size="xs" className="text-foreground-60">{{ email.projectName }}</modus-typography>
                }
                @for (para of bodyParagraphs(email.body); track $index) {
                  <modus-typography hierarchy="p" size="sm" className="text-foreground">{{ para }}</modus-typography>
                }
              </div>
            }
          </div>
        }
        @if (sortedEmails().length === 0) {
          <div class="text-center py-8 px-4">
            <modus-typography hierarchy="p" size="sm" className="text-foreground-40">No emails</modus-typography>
          </div>
        }
      </div>
    </div>
  `,
})
export class EmailInboxComponent {
  readonly emails = input.required<WorkEmail[]>();
  readonly emailOpen = output<number>();

  readonly expandedId = signal<number | null>(null);

  readonly sortedEmails = computed(() => {
    return [...this.emails()].sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      if (a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    });
  });

  toggle(email: WorkEmail): void {
    const current = this.expandedId();
    if (current === email.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(email.id);
    if (email.unread) this.emailOpen.emit(email.id);
  }

  formatTime(iso: string): string {
    return formatRelativeTimestamp(iso);
  }

  bodyParagraphs(body: string): string[] {
    return body.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  }
}
