import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-status-filter-pills',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center gap-2 px-5 py-3 border-bottom-default flex-shrink-0 overflow-x-auto',
    role: 'radiogroup',
    '[attr.aria-label]': 'ariaLabel()',
    '(mousedown)': '$event.stopPropagation()',
    '(touchstart)': '$event.stopPropagation()',
  },
  template: `
    @for (f of options(); track f) {
      <div
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors duration-150 select-none"
        [class.bg-primary]="active() === f && f !== 'overdue' && f !== 'upcoming' && f !== 'closed'"
        [class.text-primary-foreground]="active() === f && f !== 'overdue' && f !== 'upcoming' && f !== 'closed'"
        [class.bg-muted]="active() !== f"
        [class.text-foreground-60]="active() !== f"
        [class.bg-destructive]="f === 'overdue' && active() === f"
        [class.text-destructive-foreground]="f === 'overdue' && active() === f"
        [class.bg-warning]="f === 'upcoming' && active() === f"
        [class.text-warning-foreground]="f === 'upcoming' && active() === f"
        [class.bg-success]="f === 'closed' && active() === f"
        [class.text-success-foreground]="f === 'closed' && active() === f"
        role="radio" tabindex="0" [attr.aria-checked]="active() === f"
        (click)="filterChange.emit(f)"
        (keydown.enter)="filterChange.emit(f)"
        (keydown.space)="$event.preventDefault(); filterChange.emit(f)"
      >
        <div>{{ f.charAt(0).toUpperCase() + f.slice(1) }}</div>
        <div class="px-1.5 py-0.5 rounded-full text-2xs font-bold"
          [class.bg-primary-foreground]="active() === f && f === 'all'"
          [class.text-primary]="active() === f && f === 'all'"
          [class.bg-secondary]="active() !== f"
          [class.text-foreground-60]="active() !== f"
          aria-hidden="true"
        >{{ counts()[f] }}</div>
      </div>
    }
  `,
})
export class StatusFilterPillsComponent {
  readonly options = input.required<readonly string[]>();
  readonly active = input.required<string>();
  readonly counts = input.required<Record<string, number>>();
  readonly ariaLabel = input<string>('Filter by status');
  readonly filterChange = output<string>();
}
