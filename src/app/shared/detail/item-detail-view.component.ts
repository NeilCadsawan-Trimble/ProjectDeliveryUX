import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { StatusOption } from '../../data/dashboard-item-status';
import { ModusTypographyComponent } from '../../components/modus-typography.component';
import { ModusCardComponent } from '../../components/modus-card.component';
import { ModusButtonComponent } from '../../components/modus-button.component';
export type { StatusOption } from '../../data/dashboard-item-status';

@Component({
  selector: 'app-item-detail-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusTypographyComponent, ModusCardComponent, ModusButtonComponent],
  template: `
    <modus-card [padding]="'compact'">
      <div>
      @if (!hideHeader()) {
      <div class="flex items-center justify-between px-6 py-5 border-bottom-default">
        <div class="flex items-center gap-4">
          <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="statusDotClass()">
            <i class="modus-icons text-xl text-primary-foreground" aria-hidden="true">{{ icon() }}</i>
          </div>
          <div>
            <modus-typography hierarchy="h2" size="lg" weight="semibold">{{ number() }}</modus-typography>
            <modus-typography hierarchy="p" size="sm" className="text-foreground-60">{{ typeLabel() }}</modus-typography>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div
            (click)="openInNewTab.emit(); $event.stopPropagation()"
            (keydown.enter)="openInNewTab.emit(); $event.stopPropagation()"
          >
            <modus-button
              color="secondary"
              variant="borderless"
              size="sm"
              icon="launch"
              iconPosition="only"
              ariaLabel="Open in new tab"
            ></modus-button>
          </div>
        <div class="relative">
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150 select-none"
            [attr.aria-expanded]="statusDropdownOpen()"
            (click)="toggleStatusDropdown(); $event.stopPropagation()"
          >
            <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
            <modus-typography hierarchy="p" size="sm" weight="semibold">{{ statusText() }}</modus-typography>
            <i class="modus-icons text-sm text-foreground-60 transition-transform duration-150" [class.rotate-180]="statusDropdownOpen()" aria-hidden="true">expand_more</i>
          </div>
          @if (statusDropdownOpen()) {
            <div class="absolute top-full right-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[180px] py-1" role="listbox" aria-label="Status options">
              @for (opt of statusOptions(); track opt.value) {
                <div
                  class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                  role="option"
                  [attr.aria-selected]="opt.value === currentStatus()"
                  (click)="onStatusSelect(opt.value); $event.stopPropagation()"
                >
                  <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" [class]="opt.dotClass"></div>
                  <modus-typography hierarchy="p" size="sm" weight="semibold">{{ opt.label }}</modus-typography>
                  @if (opt.value === currentStatus()) {
                    <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                  }
                </div>
              }
            </div>
          }
        </div>
        </div>
      </div>
      }
      <div class="px-6 py-6 flex flex-col gap-6">
        <div>
          <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">Subject</modus-typography>
          <modus-typography hierarchy="p" size="md">{{ subject() }}</modus-typography>
        </div>
        @if (question()) {
          <div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">Question</modus-typography>
            <modus-typography hierarchy="p" size="md">{{ question() }}</modus-typography>
          </div>
        }
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">{{ field1Label() }}</modus-typography>
            <modus-typography hierarchy="p" size="md">{{ field1Value() }}</modus-typography>
          </div>
          <div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">Assignee</modus-typography>
            <div class="relative">
              <div
                class="flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-md cursor-pointer hover:bg-muted transition-colors duration-150 select-none"
                [attr.aria-expanded]="assigneeDropdownOpen()"
                (click)="toggleAssigneeDropdown(); $event.stopPropagation()"
              >
                <modus-typography hierarchy="p" size="md">{{ assignee() }}</modus-typography>
                <i class="modus-icons text-sm text-foreground-60 transition-transform duration-150" [class.rotate-180]="assigneeDropdownOpen()" aria-hidden="true">expand_more</i>
              </div>
              @if (assigneeDropdownOpen()) {
                <div class="absolute top-full left-0 -ml-3 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[200px] py-1" role="listbox" aria-label="Assignee options">
                  @for (name of assigneeOptions(); track name) {
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                      role="option"
                      [attr.aria-selected]="name === assignee()"
                      (click)="onAssigneeSelect(name); $event.stopPropagation()"
                    >
                      <modus-typography hierarchy="p" size="sm" weight="semibold">{{ name }}</modus-typography>
                      @if (name === assignee()) {
                        <i class="modus-icons text-sm text-primary ml-auto" aria-hidden="true">check</i>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">{{ field3Label() }}</modus-typography>
            @if (field3DateEditable()) {
              <div class="relative flex items-center gap-2">
                <modus-typography hierarchy="p" size="md">{{ field3Value() }}</modus-typography>
                <i class="modus-icons text-base text-foreground-60 cursor-pointer hover:text-primary transition-colors duration-150"
                   aria-hidden="true"
                   (click)="openDatePicker(field3DateInput)">calendar</i>
                <input #field3DateInput type="date" class="absolute opacity-0 w-0 h-0 pointer-events-none" (change)="onDueDateChange($event)" />
              </div>
            } @else {
              <modus-typography hierarchy="p" size="md">{{ field3Value() }}</modus-typography>
            }
          </div>
          <div>
            <modus-typography hierarchy="p" size="xs" weight="semibold" className="text-foreground-40 uppercase tracking-wide mb-1.5">{{ field4Label() }}</modus-typography>
            @if (field4ShowStatus()) {
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full" [class]="statusDotClass()"></div>
                <modus-typography hierarchy="p" size="md" weight="semibold">{{ statusText() }}</modus-typography>
              </div>
            } @else {
              <div class="relative flex items-center gap-2">
                <modus-typography hierarchy="p" size="md">{{ field4Value() }}</modus-typography>
                <i class="modus-icons text-base text-foreground-60 cursor-pointer hover:text-primary transition-colors duration-150"
                   aria-hidden="true"
                   (click)="openDatePicker(field4DateInput)">calendar</i>
                <input #field4DateInput type="date" class="absolute opacity-0 w-0 h-0 pointer-events-none" (change)="onDueDateChange($event)" />
              </div>
            }
          </div>
        </div>
      </div>
      </div>
    </modus-card>
  `,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ItemDetailViewComponent {
  readonly hideHeader = input<boolean>(false);
  readonly icon = input.required<string>();
  readonly number = input.required<string>();
  readonly typeLabel = input.required<string>();
  readonly subject = input.required<string>();
  readonly question = input<string>('');
  readonly assignee = input.required<string>();
  readonly assigneeOptions = input.required<string[]>();
  readonly assigneeChange = output<string>();
  readonly statusDotClass = input.required<string>();
  readonly statusText = input.required<string>();
  readonly currentStatus = input.required<string>();
  readonly statusOptions = input.required<StatusOption[]>();
  readonly statusChange = output<string>();
  readonly dueDateChange = output<string>();
  readonly openInNewTab = output<void>();

  readonly field1Label = input<string>('Project');
  readonly field1Value = input<string>('');
  readonly field3Label = input<string>('Due Date');
  readonly field3Value = input<string>('');
  readonly field3DateEditable = input<boolean>(false);
  readonly field4Label = input<string>('Status');
  readonly field4Value = input<string>('');
  readonly field4ShowStatus = input<boolean>(true);

  readonly statusDropdownOpen = signal(false);
  readonly assigneeDropdownOpen = signal(false);

  toggleStatusDropdown(): void {
    this.assigneeDropdownOpen.set(false);
    this.statusDropdownOpen.update(v => !v);
  }

  toggleAssigneeDropdown(): void {
    this.statusDropdownOpen.set(false);
    this.assigneeDropdownOpen.update(v => !v);
  }

  onStatusSelect(value: string): void {
    this.statusDropdownOpen.set(false);
    if (value !== this.currentStatus()) {
      this.statusChange.emit(value);
    }
  }

  onAssigneeSelect(name: string): void {
    this.assigneeDropdownOpen.set(false);
    if (name !== this.assignee()) {
      this.assigneeChange.emit(name);
    }
  }

  openDatePicker(inputEl: HTMLInputElement): void {
    const rawDate = this.field4ShowStatus() ? this.field3Value() : this.field4Value();
    const iso = this.parseDateToIso(rawDate);
    if (iso) {
      inputEl.value = iso;
    }
    inputEl.showPicker();
  }

  onDueDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      const formatted = this.formatIsoToDisplay(input.value);
      this.dueDateChange.emit(formatted);
    }
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[role="listbox"]') && !target.closest('[aria-expanded]')) {
      this.statusDropdownOpen.set(false);
      this.assigneeDropdownOpen.set(false);
    }
  }

  private parseDateToIso(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatIsoToDisplay(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
