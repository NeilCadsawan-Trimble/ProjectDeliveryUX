import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusProgressComponent } from '../../components/modus-progress.component';
import { WidgetResizeHandleComponent } from '../../shell/components/widget-resize-handle.component';
import { AiIconComponent } from '../../shell/components/ai-icon.component';
import { ThemeService } from '../../shell/services/theme.service';
import { WidgetLayoutService } from '../../shell/services/widget-layout.service';
import { CanvasResetService } from '../../shell/services/canvas-reset.service';
import { WidgetFocusService } from '../../shell/services/widget-focus.service';
import { DashboardLayoutEngine } from '../../shell/services/dashboard-layout-engine';
import { EXAMPLE_PROJECTS, EXAMPLE_TASKS, EXAMPLE_ACTIVITIES } from '../../data/example-data';
import type { ExampleProject } from '../../data/example-data';

type WidgetId = 'details' | 'tasks' | 'activity';

@Component({
  selector: 'app-example-project',
  imports: [
    ModusNavbarComponent,
    ModusProgressComponent,
    WidgetResizeHandleComponent,
    AiIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': 'true',
    '[class.overflow-hidden]': 'true',
    '(window:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:mousemove)': 'onDocumentMouseMove($event)',
    '(document:mouseup)': 'onDocumentMouseUp()',
    '(document:touchend)': 'onDocumentTouchEnd()',
  },
  template: `
    <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <modus-navbar
        [userCard]="userCard"
        [visibility]="{ user: true, mainMenu: true, ai: false, notifications: true, help: true, search: true, searchInput: true }"
        [condensed]="false"
        (trimbleLogoClick)="navigateHome()"
      >
        <div slot="start" class="flex items-center gap-3">
          <div class="w-px h-5 bg-foreground-20"></div>
          <div class="relative">
            <div
              class="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-muted transition-colors duration-150"
              role="button"
              aria-label="Select project"
              [attr.aria-expanded]="projectSelectorOpen()"
              (click)="toggleProjectSelector(); $event.stopPropagation()"
              (keydown.enter)="toggleProjectSelector()"
              tabindex="0"
            >
              <div class="text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">{{ project().name }}</div>
              <i class="modus-icons text-sm text-foreground-60" aria-hidden="true">{{ projectSelectorOpen() ? 'chevron_up' : 'chevron_down' }}</i>
            </div>
            @if (projectSelectorOpen()) {
              <div class="absolute top-full left-0 mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[240px] py-1">
                @for (p of otherProjects(); track p.id) {
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="navigateToProject(p.slug)"
                  >
                    <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="statusDotClass(p.status)"></div>
                    <div class="text-sm">{{ p.name }}</div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
        <div slot="end" class="flex items-center gap-1">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
            role="button"
            [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            (click)="toggleDarkMode()"
            tabindex="0"
          >
            <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
          </div>
        </div>
      </modus-navbar>

      <div class="navbar-shadow"></div>

      <div class="flex flex-1 overflow-hidden">
        <div class="custom-side-nav">
          <div class="flex flex-col flex-1 min-h-0">
            <div
              class="custom-side-nav-item selected"
              title="Overview"
              role="button"
              aria-label="Overview"
            >
              <i class="modus-icons text-xl" aria-hidden="true">dashboard_tiles</i>
            </div>
            <div
              class="custom-side-nav-item"
              title="Tasks"
              role="button"
              aria-label="Tasks"
            >
              <i class="modus-icons text-xl" aria-hidden="true">list</i>
            </div>
            <div
              class="custom-side-nav-item"
              title="Documents"
              role="button"
              aria-label="Documents"
            >
              <i class="modus-icons text-xl" aria-hidden="true">folder_closed</i>
            </div>
          </div>
          <div class="mt-auto border-top-default">
            <div
              class="custom-side-nav-item"
              title="Settings"
              role="button"
              aria-label="Settings"
            >
              <i class="modus-icons text-xl" aria-hidden="true">settings</i>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-auto bg-background" role="main" id="main-content" tabindex="-1">
          <div class="px-4 py-4 md:px-6 md:py-6 max-w-screen-xl mx-auto">
            <div class="flex items-start justify-between mb-6">
              <div>
                <div class="flex items-center gap-3 mb-1">
                  <div class="text-xs px-2 py-0.5 rounded-full" [class]="statusBadgeClass(project().status)">{{ project().status }}</div>
                  <div class="text-xs text-foreground-60">Due {{ project().dueDate }}</div>
                </div>
                <div class="text-sm text-foreground-60">{{ project().client }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-foreground">{{ project().budgetUsed }} / {{ project().budgetTotal }}</div>
                <modus-progress [value]="project().budgetPct" size="compact" />
              </div>
            </div>

            <div
              class="relative"
              [style.height.px]="engine.mobileGridHeight() || null"
              [style.min-height.px]="canvasGridMinHeight() || null"
              #widgetGrid
            >
              @for (widgetId of widgetIds; track widgetId) {
                <div
                  class="absolute left-0 right-0 md:left-auto md:right-auto overflow-hidden"
                  [attr.data-widget-id]="widgetId"
                  [style.top.px]="widgetTops()[widgetId]"
                  [style.left.px]="widgetLefts()[widgetId]"
                  [style.width.px]="widgetPixelWidths()[widgetId]"
                  [style.height.px]="widgetHeights()[widgetId]"
                  [style.z-index]="widgetZIndices()[widgetId] ?? 0"
                >
                  <div class="relative h-full" [class.opacity-30]="moveTargetId() === widgetId">

                    @if (widgetId === 'details') {
                      <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full border-default">
                        <div
                          class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                          (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                          (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                        >
                          <div class="flex items-center gap-2">
                            <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">info</i>
                            <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Project Details</div>
                          </div>
                        </div>
                        <div class="p-5 flex-1 overflow-auto">
                          <div class="grid grid-cols-2 gap-4">
                            <div class="border-default rounded-lg p-4">
                              <div class="text-xs text-foreground-60 mb-1">Progress</div>
                              <div class="text-2xl font-bold text-foreground">{{ project().progress }}%</div>
                              <modus-progress [value]="project().progress" size="compact" class="mt-2" />
                            </div>
                            <div class="border-default rounded-lg p-4">
                              <div class="text-xs text-foreground-60 mb-1">Budget Used</div>
                              <div class="text-2xl font-bold text-foreground">{{ project().budgetPct }}%</div>
                              <modus-progress [value]="project().budgetPct" size="compact" class="mt-2" />
                            </div>
                            <div class="border-default rounded-lg p-4">
                              <div class="text-xs text-foreground-60 mb-1">Owner</div>
                              <div class="text-sm font-semibold text-foreground">{{ project().owner }}</div>
                            </div>
                            <div class="border-default rounded-lg p-4">
                              <div class="text-xs text-foreground-60 mb-1">Client</div>
                              <div class="text-sm font-semibold text-foreground">{{ project().client }}</div>
                            </div>
                          </div>
                        </div>
                        <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('details', 'both', $event)" />
                      </div>
                    }

                    @if (widgetId === 'tasks') {
                      <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full border-default">
                        <div
                          class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                          (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                          (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                        >
                          <div class="flex items-center gap-2">
                            <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">list</i>
                            <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Key Tasks</div>
                          </div>
                        </div>
                        <div class="flex-1 overflow-auto">
                          @for (task of tasks; track task.id) {
                            <div class="flex items-center gap-4 px-5 py-3" [class.border-bottom-default]="!$last">
                              <div class="w-2 h-2 rounded-full flex-shrink-0" [class]="priorityDotClass(task.priority)"></div>
                              <div class="flex-1 min-w-0">
                                <div class="text-sm font-medium text-foreground">{{ task.title }}</div>
                                <div class="text-xs text-foreground-60">{{ task.assignee }}</div>
                              </div>
                              <div class="text-xs px-2 py-0.5 rounded-full" [class]="taskStatusClass(task.status)">{{ task.status }}</div>
                            </div>
                          }
                        </div>
                        <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('tasks', 'both', $event)" />
                      </div>
                    }

                    @if (widgetId === 'activity') {
                      <div class="bg-card rounded-lg overflow-hidden flex flex-col h-full border-default">
                        <div
                          class="flex items-center justify-between px-5 py-4 border-bottom-default cursor-grab active:cursor-grabbing select-none flex-shrink-0"
                          (mousedown)="onWidgetHeaderMouseDown(widgetId, $event)"
                          (touchstart)="onWidgetHeaderTouchStart(widgetId, $event)"
                        >
                          <div class="flex items-center gap-2">
                            <i class="modus-icons text-base text-foreground-40" aria-hidden="true" data-drag-handle>drag_indicator</i>
                            <i class="modus-icons text-lg text-foreground-60" aria-hidden="true">history</i>
                            <div class="text-base font-semibold text-foreground" role="heading" aria-level="2">Activity</div>
                          </div>
                        </div>
                        <div class="flex-1 overflow-auto">
                          @for (item of activities; track item.id) {
                            <div class="flex items-start gap-3 px-5 py-3" [class.border-bottom-default]="!$last">
                              <div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                                <div class="text-xs font-bold text-foreground">{{ item.actorInitials }}</div>
                              </div>
                              <div class="flex-1 min-w-0">
                                <div class="text-sm text-foreground">{{ item.text }}</div>
                                <div class="text-xs text-foreground-40 mt-0.5">{{ item.timeAgo }}</div>
                              </div>
                            </div>
                          }
                        </div>
                        <widget-resize-handle direction="both" (resizeStart)="startWidgetResize('activity', 'both', $event)" />
                      </div>
                    }

                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ExampleProjectComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly widgetFocusService = inject(WidgetFocusService);
  private readonly destroyRef = inject(DestroyRef);

  readonly slug = input<string>('alpha-project');

  readonly allProjects = EXAMPLE_PROJECTS;

  readonly project = computed<ExampleProject>(() => {
    const s = this.slug();
    return this.allProjects.find((p) => p.slug === s) ?? this.allProjects[0];
  });

  readonly otherProjects = computed(() =>
    this.allProjects.filter((p) => p.slug !== this.slug())
  );

  readonly projectSelectorOpen = signal(false);
  readonly tasks = EXAMPLE_TASKS;
  readonly activities = EXAMPLE_ACTIVITIES;

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
  };

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  readonly engine = new DashboardLayoutEngine({
    widgets: ['details', 'tasks', 'activity'],
    layoutStorageKey: 'example-project',
    canvasStorageKey: 'canvas-layout:example-project:v1',
    defaultColStarts: { details: 1, tasks: 9, activity: 1 },
    defaultColSpans: { details: 8, tasks: 8, activity: 16 },
    defaultTops: { details: 0, tasks: 0, activity: 420 },
    defaultHeights: { details: 400, tasks: 400, activity: 300 },
    defaultLefts: { details: 0, tasks: 648, activity: 0 },
    defaultPixelWidths: { details: 632, tasks: 632, activity: 1280 },
    canvasDefaultLefts: { details: 0, tasks: 648, activity: 0 },
    canvasDefaultPixelWidths: { details: 632, tasks: 632, activity: 1280 },
    canvasDefaultTops: { details: 0, tasks: 0, activity: 420 },
    canvasDefaultHeights: { details: 400, tasks: 400, activity: 300 },
    minColSpan: 4,
    canvasGridMinHeightOffset: 100,
    savesDesktopOnMobile: true,
    onWidgetSelect: (id) => this.widgetFocusService.selectWidget(id),
  }, inject(WidgetLayoutService));

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this.engine.destroy());

  private readonly _resetWidgetsEffect = effect(() => {
    const tick = this.canvasResetService.resetWidgetsTick();
    if (tick > 0 && this.engine.isCanvasMode()) {
      untracked(() => this.engine.resetWidgets());
    }
  });

  readonly widgetIds: WidgetId[] = ['details', 'tasks', 'activity'];
  readonly widgetTops = this.engine.widgetTops;
  readonly widgetHeights = this.engine.widgetHeights;
  readonly widgetLefts = this.engine.widgetLefts;
  readonly widgetPixelWidths = this.engine.widgetPixelWidths;
  readonly widgetZIndices = this.engine.widgetZIndices;
  readonly moveTargetId = this.engine.moveTargetId;
  readonly canvasGridMinHeight = this.engine.canvasGridMinHeight;

  private readonly gridRef = viewChild<ElementRef>('widgetGrid');

  toggleProjectSelector(): void {
    this.projectSelectorOpen.update(v => !v);
  }

  navigateToProject(slug: string): void {
    this.projectSelectorOpen.set(false);
    this.router.navigate(['/example-project', slug]);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  statusDotClass(status: string): string {
    switch (status) {
      case 'On Track': return 'bg-success';
      case 'At Risk': return 'bg-warning';
      case 'Overdue': return 'bg-destructive';
      default: return 'bg-muted';
    }
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'On Track': return 'bg-success-20 text-success';
      case 'At Risk': return 'bg-warning-20 text-warning';
      case 'Overdue': return 'bg-destructive-20 text-destructive';
      default: return 'bg-muted text-foreground-60';
    }
  }

  priorityDotClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-primary';
      default: return 'bg-muted';
    }
  }

  taskStatusClass(status: string): string {
    switch (status) {
      case 'done': return 'bg-success-20 text-success';
      case 'in-progress': return 'bg-primary-20 text-primary';
      case 'blocked': return 'bg-destructive-20 text-destructive';
      default: return 'bg-muted text-foreground-60';
    }
  }

  onWidgetHeaderMouseDown(id: WidgetId, event: MouseEvent): void {
    this.engine.onWidgetHeaderMouseDown(id, event);
  }

  onWidgetHeaderTouchStart(id: WidgetId, event: TouchEvent): void {
    this.engine.onWidgetHeaderTouchStart(id, event);
  }

  startWidgetResize(target: string, dir: 'h' | 'v' | 'both', event: MouseEvent): void {
    this.engine.startWidgetResize(target, dir, event);
  }

  onDocumentMouseMove(event: MouseEvent): void {
    this.engine.onDocumentMouseMove(event);
  }

  onDocumentMouseUp(): void {
    this.engine.onDocumentMouseUp();
  }

  onDocumentTouchEnd(): void {
    this.engine.onDocumentTouchEnd();
  }

  onEscapeKey(): void {
    if (this.projectSelectorOpen()) this.projectSelectorOpen.set(false);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.projectSelectorOpen() && !target.closest('[aria-label="Select project"]') && !target.closest('[role="menuitem"]')) {
      this.projectSelectorOpen.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.engine.gridElAccessor = () => this.gridRef()?.nativeElement as HTMLElement | undefined;
    this.engine.init();
  }
}
