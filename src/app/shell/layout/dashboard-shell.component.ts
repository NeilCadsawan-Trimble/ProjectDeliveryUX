import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  signal,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { AiIconComponent } from '../components/ai-icon.component';
import { AiAssistantPanelComponent } from '../components/ai-assistant-panel.component';
import { ThemeService } from '../services/theme.service';
import { CanvasResetService } from '../services/canvas-reset.service';
import { WidgetFocusService } from '../services/widget-focus.service';
import { AiService } from '../../services/ai.service';
import { AiPanelController } from '../services/ai-panel-controller';
import { CanvasPanning } from '../services/canvas-panning';
import {
  PROJECTS, ESTIMATES, ACTIVITIES, ATTENTION_ITEMS,
  TIME_OFF_REQUESTS, RFIS, SUBMITTALS, CALENDAR_APPOINTMENTS,
} from '../../data/dashboard-data';

export interface ShellNavItem {
  value: string;
  label: string;
  icon: string;
  route?: string;
}

export type { AiMessage } from '../services/ai-panel-controller';

export type AiResponseFn = (input: string) => string | Promise<string>;

@Component({
  selector: 'app-dashboard-shell',
  imports: [
    ModusNavbarComponent,
    AiIconComponent,
    AiAssistantPanelComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'panning.isPanReady()',
    '[class.canvas-panning]': 'panning.isPanning()',
    '(window:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)',
    '(window:keydown)': 'panning.onKeyDown($event)',
    '(window:keyup)': 'panning.onKeyUp($event)',
    '(document:mousemove)': 'panning.handleMouseMove($event)',
    '(document:mouseup)': 'panning.handleMouseUp()',
  },
  template: `
    <svg aria-hidden="true" class="svg-defs-hidden">
      <defs>
        <linearGradient id="ai-grad-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="20%" stop-color="#FF00FF" />
          <stop offset="60%" stop-color="#0066CC" />
          <stop offset="100%" stop-color="#0066CC" />
        </linearGradient>
        <radialGradient id="ai-grad-dark" cx="18%" cy="18%" r="70%">
          <stop offset="0%" stop-color="#FF00FF" />
          <stop offset="50%" stop-color="#9933FF" />
          <stop offset="100%" stop-color="#0066CC" />
        </radialGradient>
      </defs>
    </svg>
    <div class="skip-nav" tabindex="0" role="link" (click)="focusMain()" (keydown.enter)="focusMain()">Skip to main content</div>

    @if (isCanvas()) {
      <div class="canvas-host bg-background text-foreground canvas-mode select-none" #canvasHost (mousedown)="panning.onPanMouseDown($event)">

        <div class="canvas-navbar">
          <modus-navbar
            [userCard]="userCard()"
            [visibility]="navbarVisibility()"
            [condensed]="false"
            [searchInputOpen]="searchInputOpen()"
            (searchClick)="searchInputOpen.set(!searchInputOpen())"
            (searchInputOpenChange)="searchInputOpen.set($event)"
            (trimbleLogoClick)="navigateHome()"
            (aiClick)="ai.toggle()"
            (mainMenuOpenChange)="onMainMenuToggle($event)"
          >
            <div slot="start" class="flex items-center gap-3">
              <div class="w-px h-5 bg-foreground-20"></div>
              <div class="text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">{{ appTitle() }}</div>
            </div>
            <div slot="end" class="flex items-center gap-1">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="AI assistant"
                (click)="ai.toggle()"
                (keydown.enter)="ai.toggle()"
                tabindex="0"
              >
                <ai-icon variant="nav" [isDark]="isDark()" />
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
                (click)="toggleDarkMode()"
                (keydown.enter)="toggleDarkMode()"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
              </div>
            </div>
          </modus-navbar>
        </div>
        <div class="canvas-navbar-shadow"></div>

        <div class="canvas-side-nav" [class.expanded]="navExpanded()">
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
            @for (item of sideNavItems(); track item.value) {
              <div
                class="custom-side-nav-item"
                [class.selected]="activeNav() === item.value"
                (click)="selectNavItem(item.value)"
                [title]="item.label"
                role="button"
                [attr.aria-label]="item.label"
              >
                <i class="modus-icons text-xl" aria-hidden="true">{{ item.icon }}</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">{{ item.label }}</div>
                }
              </div>
            }
          </div>
          <div class="mt-auto border-top-default">
            <div class="relative">
              <div
                class="custom-side-nav-item relative"
                (click)="toggleResetMenu(); $event.stopPropagation()"
                title="Layout options"
                role="button"
                aria-label="Layout options"
                [attr.aria-expanded]="resetMenuOpen()"
              >
                <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">Layout</div>
                }
                <svg class="absolute bottom-1 right-1 w-1.5 h-1.5 text-foreground-40" viewBox="0 0 6 6" fill="currentColor" aria-hidden="true">
                  <path d="M6 0V6H0L6 0Z"/>
                </svg>
              </div>
              @if (resetMenuOpen()) {
                <div class="canvas-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[210px] py-1">
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('view'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">window_fit</i>
                    <div class="text-sm">Reset View</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                    <div class="text-sm">Reset Layout</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('save-defaults'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">save_disk</i>
                    <div class="text-sm">Save as Default Layout</div>
                  </div>
                </div>
              }
            </div>
            <div
              class="custom-side-nav-item"
              [class.selected]="activeNav() === 'settings'"
              (click)="selectNavItem('settings')"
              title="Settings"
              role="button"
              aria-label="Settings"
            >
              <i class="modus-icons text-xl" aria-hidden="true">settings</i>
              @if (navExpanded()) {
                <div class="custom-side-nav-label">Settings</div>
              }
            </div>
          </div>
        </div>
        @if (navExpanded()) {
          <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
        }

        <div class="canvas-content" role="main" id="main-content" tabindex="-1"
          [style.transform]="(panning.panOffsetX() || panning.panOffsetY()) ? 'translate(' + panning.panOffsetX() + 'px,' + panning.panOffsetY() + 'px)' : null">
          <router-outlet />
        </div>

      </div>
    } @else {
      <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
          <modus-navbar
            [userCard]="userCard()"
            [visibility]="navbarVisibility()"
            [condensed]="isMobile()"
            [searchInputOpen]="searchInputOpen()"
            (searchClick)="searchInputOpen.set(!searchInputOpen())"
            (searchInputOpenChange)="searchInputOpen.set($event)"
            (trimbleLogoClick)="navigateHome()"
            (aiClick)="ai.toggle()"
            (mainMenuOpenChange)="onMainMenuToggle($event)"
          >
            <div slot="start" class="flex items-center gap-3">
              <div class="w-px h-5 bg-foreground-20"></div>
              <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">{{ appTitle() }}</div>
            </div>
            <div slot="end" class="flex items-center gap-1">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="AI assistant"
                (click)="ai.toggle()"
                (keydown.enter)="ai.toggle()"
                tabindex="0"
              >
                <ai-icon variant="nav" [isDark]="isDark()" />
              </div>
              <div
                class="hidden md:flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
                (click)="toggleDarkMode()"
                (keydown.enter)="toggleDarkMode()"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
              </div>
            @if (isMobile()) {
              <div class="relative">
                <div
                  class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                  role="button"
                  aria-label="More options"
                  [attr.aria-expanded]="moreMenuOpen()"
                  (click)="toggleMoreMenu()"
                  (keydown.enter)="toggleMoreMenu()"
                  tabindex="0"
                >
                  <i class="modus-icons text-xl" aria-hidden="true">more_vertical</i>
                </div>
                @if (moreMenuOpen()) {
                  <div class="absolute right-0 top-full mt-1 bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('search')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">search</i>
                      <div class="text-sm">Search</div>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('notifications')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">notifications</i>
                      <div class="text-sm">Notifications</div>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('help')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">help</i>
                      <div class="text-sm">Help</div>
                    </div>
                    <div class="border-bottom-default mx-3 my-1"></div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('darkMode')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
                      <div class="text-sm">{{ isDark() ? 'Light Mode' : 'Dark Mode' }}</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </modus-navbar>

        <div class="navbar-shadow"></div>

        <div class="flex flex-1 overflow-hidden">
          <div class="flex-1 overflow-auto bg-background md:pl-14" role="main" id="main-content" tabindex="-1">
            <router-outlet />
          </div>
        </div>

        @if (!isMobile() || navExpanded()) {
          <div class="custom-side-nav" [class.expanded]="navExpanded()">
            <div class="flex flex-col flex-1 min-h-0">
              @for (item of sideNavItems(); track item.value) {
                <div
                  class="custom-side-nav-item"
                  [class.selected]="activeNav() === item.value"
                  (click)="selectNavItem(item.value)"
                  [title]="item.label"
                  role="button"
                  [attr.aria-label]="item.label"
                >
                  <i class="modus-icons text-xl" aria-hidden="true">{{ item.icon }}</i>
                  @if (navExpanded()) {
                    <div class="custom-side-nav-label">{{ item.label }}</div>
                  }
                </div>
              }
            </div>
            <div class="mt-auto border-top-default">
              <div class="relative">
                <div
                  class="custom-side-nav-item relative"
                  (click)="toggleDesktopResetMenu(); $event.stopPropagation()"
                  title="Layout options"
                  role="button"
                  aria-label="Layout options"
                  [attr.aria-expanded]="desktopResetMenuOpen()"
                >
                  <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                  @if (navExpanded()) {
                    <div class="custom-side-nav-label">Layout</div>
                  }
                  <svg class="absolute bottom-1 right-1 w-1.5 h-1.5 text-foreground-40" viewBox="0 0 6 6" fill="currentColor" aria-hidden="true">
                    <path d="M6 0V6H0L6 0Z"/>
                  </svg>
                </div>
                @if (desktopResetMenuOpen()) {
                  <div class="desktop-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[210px] py-1">
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                      <div class="text-sm">Reset Layout</div>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('save-defaults'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">save_disk</i>
                      <div class="text-sm">Save as Default Layout</div>
                    </div>
                  </div>
                }
              </div>
              <div
                class="custom-side-nav-item"
                [class.selected]="activeNav() === 'settings'"
                (click)="selectNavItem('settings')"
                title="Settings"
                role="button"
                aria-label="Settings"
              >
                <i class="modus-icons text-xl" aria-hidden="true">settings</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">Settings</div>
                }
              </div>
            </div>
          </div>
        }
        @if (navExpanded()) {
          <div class="custom-side-nav-backdrop" (click)="navExpanded.set(false)"></div>
        }

      </div>
    }

    <ai-assistant-panel
      [controller]="ai"
      [welcomeText]="aiWelcomeText()"
      [placeholder]="aiPlaceholder()"
    />
  `,
})
export class DashboardShellComponent implements AfterViewInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly _abortCtrl = new AbortController();
  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    this._abortCtrl.abort();
    this.ai.destroy();
  });

  readonly appTitle = input('Dashboard');
  readonly userCard = input<INavbarUserCard>({ name: 'User', email: 'user@example.com' });
  readonly sideNavItems = input<ShellNavItem[]>([
    { value: 'home', label: 'Home', icon: 'home', route: '/' },
  ]);
  readonly homeRoute = input('/');
  readonly aiResponseFn = input<AiResponseFn | undefined>(undefined);
  readonly defaultAiSuggestions = input<string[]>([
    'What can you help me with?',
    'Show me an overview',
  ]);
  readonly aiWelcomeText = input('Ask me anything about your dashboard.');
  readonly aiPlaceholder = input('Ask a question...');

  private readonly currentUrl = signal('/');

  readonly searchInputOpen = signal(false);

  readonly navbarVisibility = computed(() => {
    const mobile = this.isMobile();
    const canvas = this.isCanvas();
    return {
      user: true,
      mainMenu: !canvas,
      ai: false,
      notifications: !mobile,
      apps: false,
      help: !mobile,
      search: !mobile,
      searchInput: !mobile,
    };
  });

  readonly navExpanded = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvas = signal(typeof window !== 'undefined' ? window.innerWidth >= 2000 : false);

  readonly panning = new CanvasPanning(() => this.isCanvas());
  private readonly canvasHostRef = viewChild<ElementRef>('canvasHost');

  private _canvasWheelEl: HTMLElement | null = null;
  private _canvasWheelHandler: ((e: WheelEvent) => void) | null = null;
  private readonly _canvasWheelEffect = effect(() => {
    const el = this.canvasHostRef()?.nativeElement as HTMLElement | undefined;
    if (this._canvasWheelEl && this._canvasWheelHandler) {
      this._canvasWheelEl.removeEventListener('wheel', this._canvasWheelHandler);
      this._canvasWheelEl = null;
      this._canvasWheelHandler = null;
    }
    if (!el) return;
    const handler = (e: WheelEvent) => this.panning.onCanvasWheel(e);
    el.addEventListener('wheel', handler, { passive: false });
    this._canvasWheelEl = el;
    this._canvasWheelHandler = handler;
    this.destroyRef.onDestroy(() => el.removeEventListener('wheel', handler));
  });

  readonly activeNav = computed(() => {
    const url = this.currentUrl();
    const items = this.sideNavItems();
    for (const item of items) {
      if (item.route && item.route !== '/') {
        if (url.startsWith(item.route)) return item.value;
      }
    }
    if (url === '/' || url === '') {
      const home = items.find(i => i.route === '/');
      return home?.value ?? items[0]?.value ?? 'home';
    }
    return items[0]?.value ?? 'home';
  });

  readonly moreMenuOpen = signal(false);
  readonly resetMenuOpen = signal(false);
  readonly desktopResetMenuOpen = signal(false);

  private readonly canvasResetService = inject(CanvasResetService);
  readonly widgetFocusService = inject(WidgetFocusService);
  private readonly aiService = inject(AiService);

  readonly ai = new AiPanelController({
    widgetFocusService: this.widgetFocusService,
    aiService: this.aiService,
    defaultSuggestions: this.defaultAiSuggestions,
    contextBuilder: () => this.aiService.buildContext(this.getPageName(), {
      projectData: this.buildDashboardContextData(this.getPageName()),
    }),
    injector: this.injector,
  });

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  toggleMoreMenu(): void {
    this.moreMenuOpen.update((v) => !v);
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  toggleDesktopResetMenu(): void {
    this.desktopResetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets' | 'save-defaults'): void {
    this.resetMenuOpen.set(false);
    this.desktopResetMenuOpen.set(false);
    if (action === 'view') {
      if (this.isCanvas()) {
        this.panning.resetView();
      }
    } else if (action === 'widgets') {
      if (this.isCanvas()) {
        this.panning.resetView();
      }
      this.canvasResetService.triggerResetWidgets();
    } else if (action === 'save-defaults') {
      this.canvasResetService.triggerSaveDefaults();
    }
  }

  moreMenuAction(action: string): void {
    this.moreMenuOpen.set(false);
    switch (action) {
      case 'search':
        this.searchInputOpen.set(!this.searchInputOpen());
        break;
      case 'darkMode':
        this.toggleDarkMode();
        break;
    }
  }


  private getPageName(): string {
    const url = this.currentUrl();
    if (url.startsWith('/projects')) return 'projects';
    if (url.startsWith('/financials')) return 'financials';
    return 'home';
  }

  private buildDashboardContextData(page: string): string {
    const parts: string[] = [];
    const focusedWidget = this.widgetFocusService.selectedWidgetId();

    if (page === 'home') {
      switch (focusedWidget) {
        case 'homeTimeOff':
          parts.push('Time off requests:');
          for (const r of TIME_OFF_REQUESTS) {
            parts.push(`  ${r.name}: ${r.type}, ${r.startDate}-${r.endDate} (${r.days} day(s)), status: ${r.status}`);
          }
          break;
        case 'homeCalendar': {
          parts.push('Upcoming calendar:');
          const upcoming = CALENDAR_APPOINTMENTS.slice(0, 10);
          for (const a of upcoming) {
            const d = a.date;
            parts.push(`  ${a.title}: ${d.toLocaleDateString()}, ${a.startHour}:${String(a.startMin).padStart(2, '0')}-${a.endHour}:${String(a.endMin).padStart(2, '0')}, type: ${a.type}`);
          }
          break;
        }
        case 'homeRfis':
          parts.push(`RFIs: ${RFIS.length} total`);
          for (const r of RFIS) {
            parts.push(`  ${r.number}: ${r.subject}, project: ${r.project}, assignee: ${r.assignee}, status: ${r.status}, due: ${r.dueDate}`);
          }
          break;
        case 'homeSubmittals':
          parts.push(`Submittals: ${SUBMITTALS.length} total`);
          for (const s of SUBMITTALS) {
            parts.push(`  ${s.number}: ${s.subject}, project: ${s.project}, assignee: ${s.assignee}, status: ${s.status}, due: ${s.dueDate}`);
          }
          break;
        default:
          parts.push(`${PROJECTS.length} projects, ${ESTIMATES.length} open estimates`);
          const atRisk = PROJECTS.filter(p => p.status === 'At Risk').length;
          const overdue = PROJECTS.filter(p => p.status === 'Overdue').length;
          if (atRisk > 0) parts.push(`${atRisk} project(s) at risk`);
          if (overdue > 0) parts.push(`${overdue} project(s) overdue`);
          break;
      }
    } else if (page === 'projects') {
      switch (focusedWidget) {
        case 'projects':
          parts.push('All projects:');
          for (const p of PROJECTS) {
            parts.push(`  ${p.name}: ${p.status}, ${p.progress}% complete, budget ${p.budgetUsed}/${p.budgetTotal} (${p.budgetPct}%), due ${p.dueDate}, owner: ${p.owner}`);
          }
          break;
        case 'openEstimates':
          parts.push('Open estimates:');
          for (const e of ESTIMATES) {
            parts.push(`  ${e.id}: ${e.project}, ${e.value} (${e.type}), status: ${e.status}, requested by ${e.requestedBy}, due ${e.dueDate}, ${e.daysLeft} days left`);
          }
          break;
        case 'recentActivity':
          parts.push('Recent activity:');
          for (const a of ACTIVITIES) {
            parts.push(`  ${a.text} (${a.timeAgo})`);
          }
          break;
        case 'needsAttention':
          parts.push('Items needing attention:');
          for (const item of ATTENTION_ITEMS) {
            parts.push(`  ${item.title}: ${item.subtitle}`);
          }
          break;
        default:
          parts.push(`${PROJECTS.length} projects, ${ESTIMATES.length} open estimates`);
          parts.push(`${ATTENTION_ITEMS.length} items need attention`);
          break;
      }
    } else if (page === 'financials') {
      switch (focusedWidget) {
        case 'finBudgetByProject':
          parts.push('Budget by project:');
          for (const p of PROJECTS) {
            parts.push(`  ${p.name}: ${p.budgetUsed} of ${p.budgetTotal} (${p.budgetPct}%), client: ${p.client}`);
          }
          break;
        default: {
          const totalUsed = PROJECTS.reduce((sum, p) => {
            const val = parseFloat(p.budgetUsed.replace(/[$K]/g, '')) * 1000;
            return sum + val;
          }, 0);
          const totalBudget = PROJECTS.reduce((sum, p) => {
            const val = parseFloat(p.budgetTotal.replace(/[$K]/g, '')) * 1000;
            return sum + val;
          }, 0);
          parts.push(`Total budget across ${PROJECTS.length} projects: $${Math.round(totalUsed / 1000)}K used of $${Math.round(totalBudget / 1000)}K`);
          break;
        }
      }
    }

    return parts.join('\n');
  }

  navigateHome(): void {
    this.router.navigate([this.homeRoute()]);
  }

  onMainMenuToggle(_open: boolean): void {
    this.navExpanded.set(!this.navExpanded());
  }

  selectNavItem(value: string): void {
    this.navExpanded.set(false);
    const item = this.sideNavItems().find(i => i.value === value);
    if (item?.route) {
      this.router.navigate([item.route]);
    }
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.scrollTo(0, 0);
  }

  focusMain(): void {
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.focus();
      mainEl.scrollIntoView();
    }
  }

  onEscapeKey(): void {
    if (this.resetMenuOpen()) {
      this.resetMenuOpen.set(false);
    } else if (this.moreMenuOpen()) {
      this.moreMenuOpen.set(false);
    } else if (this.ai.panelOpen()) {
      this.ai.close();
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    }
  }


  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const insideAiPanel = !!target.closest('modus-utility-panel');
    if (this.widgetFocusService.selectedWidgetId() && !target.closest('[data-widget-id]') && !insideAiPanel) {
      this.widgetFocusService.clearSelection();
    }
    if (this.resetMenuOpen() && !target.closest('[aria-label="Layout options"]') && !target.closest('.canvas-reset-flyout')) {
      this.resetMenuOpen.set(false);
    }
    if (this.desktopResetMenuOpen() && !target.closest('[aria-label="Layout options"]') && !target.closest('.desktop-reset-flyout')) {
      this.desktopResetMenuOpen.set(false);
    }
    if (this.moreMenuOpen() && !target.closest('[aria-label="More options"]') && !target.closest('[role="menuitem"]')) {
      this.moreMenuOpen.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.isMobile.set(window.innerWidth < 768);
    this.isCanvas.set(window.innerWidth >= 2000);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
    this.currentUrl.set(this.router.url);

    const mq = window.matchMedia('(max-width: 767px)');
    const mqCanvas = window.matchMedia('(min-width: 2000px)');

    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isMobile.set(e.matches);
      if (!e.matches) this.navExpanded.set(false);
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    const onCanvasChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isCanvas.set(e.matches);
    };
    mqCanvas.addEventListener('change', onCanvasChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    window.addEventListener('resize', () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== this.isMobile()) onBreakpointChange(mq);
      const canvas = window.innerWidth >= 2000;
      if (canvas !== this.isCanvas()) onCanvasChange(mqCanvas);
    }, { signal: this._abortCtrl.signal });

    this.attachHamburgerListener();
    this.reorderNavbarEnd();
  }

  private reorderNavbarEnd(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    let attempts = 0;
    const tryReorder = () => {
      if (++attempts > 50) return;
      const shadow = navbarWc.shadowRoot;
      if (!shadow) { requestAnimationFrame(tryReorder); return; }
      const endDiv = shadow.querySelector('div[slot="end"]') as HTMLElement | null;
      if (!endDiv) { requestAnimationFrame(tryReorder); return; }
      const endSlot = endDiv.querySelector(':scope > slot[name="end"]') as HTMLElement | null;
      if (endSlot) endSlot.style.order = '1';
      for (const child of Array.from(endDiv.children)) {
        const el = child as HTMLElement;
        if (el.getAttribute('aria-label') === 'User profile') el.style.order = '2';
      }
      const userMenu = endDiv.querySelector(':scope > div.user') as HTMLElement | null;
      if (userMenu) userMenu.style.order = '2';
    };
    requestAnimationFrame(tryReorder);
  }

  private attachHamburgerListener(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    let attempts = 0;
    const tryAttach = () => {
      if (++attempts > 50) return;
      const btn =
        navbarWc.querySelector('button[aria-label="Main menu"]') ??
        navbarWc.shadowRoot?.querySelector('button[aria-label="Main menu"]') ??
        navbarWc.querySelector('.navbar-menu-btn');
      if (btn) {
        btn.addEventListener('click', (e: Event) => {
          e.stopImmediatePropagation();
          this.navExpanded.set(!this.navExpanded());
        }, { capture: true, signal: this._abortCtrl.signal });
        return;
      }
      requestAnimationFrame(tryAttach);
    };
    tryAttach();
  }
}
