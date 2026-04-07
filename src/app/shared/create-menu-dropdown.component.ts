import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ModusButtonComponent } from '../components/modus-button.component';
import { ModusTextInputComponent } from '../components/modus-text-input.component';
import type { NavItem } from '../pages/project-dashboard/project-dashboard.config';

@Component({
  selector: 'app-create-menu-dropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModusButtonComponent, ModusTextInputComponent],
  host: { class: 'relative flex-shrink-0', '[attr.data-create-dropdown]': 'true' },
  template: `
    <modus-button color="primary" variant="filled" size="sm" icon="add" iconPosition="left"
      (buttonClick)="toggle($event)">Create</modus-button>
    @if (open()) {
    <div class="absolute right-0 top-full mt-1 w-72 bg-card border-default rounded-lg shadow-dropdown z-50 overflow-hidden">
      <div class="p-2 border-bottom-default">
        <modus-text-input
          placeholder="Search items..."
          [includeSearch]="true"
          [includeClear]="!!searchQuery()"
          [value]="searchQuery()"
          (inputChange)="onSearchInput($event)"
          (inputClear)="searchQuery.set('')"
        />
      </div>
      @if (!searchQuery()) {
      <div class="p-2">
        <div class="text-xs font-semibold text-foreground-60 uppercase tracking-wider px-2 py-1.5">Frequently Used</div>
        @for (item of frequentItems(); track item.value) {
        <div class="flex items-center gap-3 px-2 py-2 rounded cursor-pointer hover:bg-muted transition-colors"
          (click)="selectItem(item)">
          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ item.icon }}</i>
          <div class="text-sm text-foreground">{{ item.label }}</div>
        </div>
        }
      </div>
      } @else {
      <div class="p-2 max-h-64 overflow-y-auto">
        @for (item of filtered(); track item.value) {
        <div class="flex items-center gap-3 px-2 py-2 rounded cursor-pointer hover:bg-muted transition-colors"
          (click)="selectItem(item)">
          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">{{ item.icon }}</i>
          <div class="text-sm text-foreground">{{ item.label }}</div>
        </div>
        } @empty {
        <div class="text-sm text-foreground-40 px-2 py-3 text-center">No items found</div>
        }
      </div>
      }
    </div>
    }
  `,
})
export class CreateMenuDropdownComponent {
  readonly allItems = input.required<NavItem[]>();
  readonly frequentItems = input.required<NavItem[]>();

  readonly itemSelected = output<NavItem>();

  readonly open = signal(false);
  readonly searchQuery = signal('');

  readonly filtered = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    return this.allItems().filter(item => item.label.toLowerCase().includes(q));
  });

  toggle(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    const opening = !this.open();
    this.open.set(opening);
    if (!opening) this.searchQuery.set('');
  }

  close(): void {
    this.open.set(false);
    this.searchQuery.set('');
  }

  onSearchInput(event: Event): void {
    const value = (event as CustomEvent)?.detail?.target?.value ?? (event?.target as HTMLInputElement)?.value ?? '';
    this.searchQuery.set(value);
  }

  selectItem(item: NavItem): void {
    this.close();
    this.itemSelected.emit(item);
  }
}
