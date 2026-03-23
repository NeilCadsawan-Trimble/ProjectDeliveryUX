import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  signal,
  inject,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { ModusNavbarComponent, type INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusUtilityPanelComponent } from '../../components/modus-utility-panel.component';
import { AiIconComponent } from '../../components/ai-icon.component';
import { ThemeService } from '../../services/theme.service';
import { CanvasResetService } from '../../services/canvas-reset.service';
import type { AiMessage, Project, Estimate } from '../../data/dashboard-data';
import { PROJECTS, ESTIMATES, ATTENTION_ITEMS } from '../../data/dashboard-data';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    ModusNavbarComponent,
    ModusUtilityPanelComponent,
    AiIconComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'isPanReady()',
    '[class.canvas-panning]': 'isPanning()',
    '(window:keydown.escape)': 'onEscapeKey()',
    '(document:click)': 'onDocumentClick($event)',
    '(window:keydown)': 'onKeyDown($event)',
    '(window:keyup)': 'onKeyUp($event)',
    '(document:mousemove)': 'onPanMouseMove($event)',
    '(document:mouseup)': 'onPanMouseUp()',
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
      <!-- ═══ INFINITE CANVAS LAYOUT (>= 2000px) ═══ -->
      <div class="canvas-host bg-background text-foreground canvas-mode" (mousedown)="onPanMouseDown($event)" (wheel)="onCanvasWheel($event)">

        <!-- Navbar: fixed top-center, 1280px -->
        <div class="canvas-navbar">
          <modus-navbar
            [userCard]="userCard"
            [visibility]="navbarVisibility()"
            [condensed]="false"
            [searchInputOpen]="searchInputOpen()"
            (searchClick)="searchInputOpen.set(!searchInputOpen())"
            (searchInputOpenChange)="searchInputOpen.set($event)"
            (aiClick)="toggleAiPanel()"
          >
            <div slot="start" class="flex items-center gap-3">
              <div class="w-px h-5 bg-foreground-20"></div>
              <div class="text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">Project Delivery</div>
            </div>
            <div slot="end" class="flex items-center gap-1">
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="AI assistant"
                (click)="toggleAiPanel()"
                (keydown.enter)="toggleAiPanel()"
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

        <!-- Sidenav: fixed left-center, 1000px -->
        <div class="canvas-side-nav" [class.expanded]="navExpanded()">
          <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
            @for (item of sideNavItems; track item.value) {
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
                class="custom-side-nav-item"
                (click)="toggleResetMenu(); $event.stopPropagation()"
                title="Reset options"
                role="button"
                aria-label="Reset options"
                [attr.aria-expanded]="resetMenuOpen()"
              >
                <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                @if (navExpanded()) {
                  <div class="custom-side-nav-label">Reset</div>
                }
              </div>
              @if (resetMenuOpen()) {
                <div class="canvas-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[180px] py-1">
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
                    (click)="resetMenuAction('cleanup'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">group_items</i>
                    <div class="text-sm">Clean Up Overlaps</div>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                    <div class="text-sm">Reset Widgets</div>
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

        <!-- Main content canvas surface -->
        <div class="canvas-content" role="main" id="main-content" tabindex="-1"
          [style.transform]="(panOffsetX() || panOffsetY()) ? 'translate(' + panOffsetX() + 'px,' + panOffsetY() + 'px)' : null">
          <router-outlet />
        </div>

      </div>
    } @else {
      <!-- ═══ STANDARD LAYOUT (< 2000px) ═══ -->
      <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
        <!-- Navbar -->
        <modus-navbar
          [userCard]="userCard"
          [visibility]="navbarVisibility()"
          [condensed]="isMobile()"
          [searchInputOpen]="searchInputOpen()"
          (searchClick)="searchInputOpen.set(!searchInputOpen())"
          (searchInputOpenChange)="searchInputOpen.set($event)"
          (aiClick)="toggleAiPanel()"
        >
          <div slot="start" class="flex items-center gap-3">
            <div class="w-px h-5 bg-foreground-20"></div>
            <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">Project Delivery</div>
          </div>
          <div slot="end" class="flex items-center gap-1">
            <!-- AI assistant button -->
            <div
              class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
              role="button"
              aria-label="AI assistant"
              (click)="toggleAiPanel()"
              (keydown.enter)="toggleAiPanel()"
              tabindex="0"
            >
              <ai-icon variant="nav" [isDark]="isDark()" />
            </div>
            <!-- Desktop: dark mode toggle -->
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
            <!-- Mobile: more menu with dark mode + other actions -->
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

        <!-- Body -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Main content -->
          <div class="flex-1 overflow-auto bg-background md:pl-14" role="main" id="main-content" tabindex="-1">
            <router-outlet />
          </div>
        </div>

        <!-- Custom Side Navigation (position:fixed overlay) -->
        @if (!isMobile() || navExpanded()) {
          <div class="custom-side-nav" [class.expanded]="navExpanded()">
            <div class="flex flex-col flex-1 min-h-0">
              @for (item of sideNavItems; track item.value) {
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

    <!-- ─── AI Assistant Panel (sibling to main container, fixed overlay) ─── -->
    <modus-utility-panel
      [expanded]="aiPanelOpen()"
      className="fixed-utility-panel"
      position="right"
      panelWidth="380px"
      ariaLabel="Trimble AI Assistant"
    >
      <!-- Header -->
      <div slot="header" class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <ai-icon variant="solid-white" size="sm" />
          </div>
          <div>
            <div class="text-base font-semibold text-foreground">Trimble AI</div>
            <div class="text-xs text-foreground-60">Project Assistant</div>
          </div>
        </div>
        <div
          class="w-7 h-7 flex items-center justify-center rounded cursor-pointer hover:bg-muted transition-colors duration-150"
          (click)="toggleAiPanel()"
          role="button"
          aria-label="Close AI Assistant"
        >
          <i class="modus-icons text-base text-foreground-60" aria-hidden="true">close</i>
        </div>
      </div>

      <!-- Body -->
      <div slot="body" class="flex flex-col h-full min-h-0">

        <!-- Welcome / empty state -->
        @if (aiMessages().length === 0 && !aiThinking()) {
          <div class="flex flex-col items-center gap-4 px-4 pt-6 pb-2">
            <div class="w-14 h-14 rounded-full bg-primary-20 flex items-center justify-center">
              <ai-icon variant="solid-colored" size="lg" />
            </div>
            <div class="text-center">
              <div class="text-base font-semibold text-foreground">How can I help?</div>
              <div class="text-sm text-foreground-60 mt-1">Ask me about projects, estimates, budgets, or team status.</div>
            </div>
            <!-- Suggestion chips -->
            <div class="flex flex-col gap-2 w-full mt-2">
              @for (suggestion of aiSuggestions; track suggestion) {
                <div
                  class="px-4 py-2.5 rounded-lg border-default bg-card text-sm text-foreground cursor-pointer hover:bg-muted transition-colors duration-150 text-left"
                  (click)="selectAiSuggestion(suggestion)"
                  role="button"
                  tabindex="0"
                  [attr.aria-label]="'Ask: ' + suggestion"
                  (keydown.enter)="selectAiSuggestion(suggestion)"
                  (keydown.space)="$event.preventDefault(); selectAiSuggestion(suggestion)"
                >
                  <div class="flex items-center gap-2">
                    <i class="modus-icons text-sm text-primary flex-shrink-0" aria-hidden="true">chevron_right</i>
                    <div>{{ suggestion }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Message list -->
        @if (aiMessages().length > 0) {
          <div class="flex flex-col gap-3 px-4 py-4 overflow-y-auto flex-1" aria-live="polite" role="log" aria-label="Chat messages">
            @for (msg of aiMessages(); track msg.id) {
              @if (msg.role === 'user') {
                <div class="flex justify-end">
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground text-sm leading-relaxed">
                    {{ msg.text }}
                  </div>
                </div>
              } @else {
                <div class="flex items-start gap-2">
                  <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ai-icon variant="solid-colored" size="xs" />
                  </div>
                  <div class="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-card border-default text-sm text-foreground leading-relaxed">
                    {{ msg.text }}
                  </div>
                </div>
              }
            }

            <!-- Thinking indicator -->
            @if (aiThinking()) {
              <div class="flex items-start gap-2">
                <div class="w-6 h-6 rounded-full bg-primary-20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ai-icon variant="solid-colored" size="xs" />
                </div>
                <div class="px-4 py-3 rounded-2xl rounded-tl-sm bg-card border-default">
                  <div class="flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-1.5 h-1.5 rounded-full bg-foreground-40 animate-bounce" style="animation-delay: 300ms"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

      </div>

      <!-- Footer -->
      <div slot="footer" class="w-full">
        <div class="flex items-end gap-2 p-2">
          <textarea
            class="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 text-sm rounded-lg border-default bg-background text-foreground resize-none outline-none focus:border-primary transition-colors duration-150 placeholder:text-foreground-40"
            placeholder="Ask about your projects..."
            rows="1"
            [value]="aiInputText()"
            (input)="aiInputText.set($any($event.target).value)"
            (keydown)="handleAiKeydown($event)"
            aria-label="Message input"
          ></textarea>
          <div
            class="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-150"
            [class.bg-primary]="aiInputText().trim().length > 0 && !aiThinking()"
            [class.bg-muted]="!aiInputText().trim().length || aiThinking()"
            (click)="sendAiMessage()"
            role="button"
            aria-label="Send message"
          >
            <i
              class="modus-icons text-base"
              [class.text-primary-foreground]="aiInputText().trim().length > 0 && !aiThinking()"
              [class.text-foreground-40]="!aiInputText().trim().length || aiThinking()"
              aria-hidden="true"
            >send</i>
          </div>
        </div>
        <div class="text-center pb-2">
          <div class="text-xs text-foreground-40">Trimble AI may make mistakes. Verify important info.</div>
        </div>
      </div>

    </modus-utility-panel>
  `,
})
export class DashboardLayoutComponent implements AfterViewInit {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _abortCtrl = new AbortController();
  private hamburgerBtn: HTMLElement | null = null;

  private readonly _registerCleanup = this.destroyRef.onDestroy(() => this._abortCtrl.abort());

  private readonly currentUrl = signal('/');

  private readonly hamburgerEffect = effect(() => {
    const expanded = this.navExpanded();
    if (this.hamburgerBtn) {
      if (expanded) {
        this.hamburgerBtn.style.background = 'var(--primary)';
        this.hamburgerBtn.style.color = 'var(--primary-foreground)';
      } else {
        this.hamburgerBtn.style.background = '';
        this.hamburgerBtn.style.color = '';
      }
    }
  });

  readonly userCard: INavbarUserCard = {
    name: 'Alex Morgan',
    email: 'alex.morgan@trimble.com',
  };

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

  readonly isPanReady = signal(false);
  readonly isPanning = signal(false);
  readonly panOffsetX = signal(0);
  readonly panOffsetY = signal(0);
  private _panStartX = 0;
  private _panStartY = 0;
  private _panStartOffsetX = 0;
  private _panStartOffsetY = 0;

  readonly activeNav = computed((): 'home' | 'projects' | 'financials' | 'settings' => {
    const url = this.currentUrl();
    if (url.startsWith('/financials')) return 'financials';
    if (url.startsWith('/projects') && !url.startsWith('/project/')) return 'projects';
    if (url === '/' || url === '') return 'home';
    return 'home';
  });

  readonly sideNavItems: { value: 'home' | 'projects' | 'financials'; label: string; icon: string }[] = [
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'projects', label: 'Projects', icon: 'briefcase' },
    { value: 'financials', label: 'Financials', icon: 'bar_graph' },
  ];

  readonly moreMenuOpen = signal(false);
  readonly resetMenuOpen = signal(false);

  private readonly canvasResetService = inject(CanvasResetService);

  toggleMoreMenu(): void {
    this.moreMenuOpen.update((v) => !v);
  }

  toggleResetMenu(): void {
    this.resetMenuOpen.update((v) => !v);
  }

  resetMenuAction(action: 'view' | 'widgets' | 'cleanup'): void {
    this.resetMenuOpen.set(false);
    if (action === 'view') {
      this.resetCanvasView();
    } else if (action === 'widgets') {
      this.resetCanvasView();
      this.canvasResetService.triggerResetWidgets();
    } else if (action === 'cleanup') {
      this.canvasResetService.triggerCleanupOverlaps();
    }
  }

  moreMenuAction(action: string): void {
    this.moreMenuOpen.set(false);
    switch (action) {
      case 'search':
        this.searchInputOpen.set(!this.searchInputOpen());
        break;
      case 'notifications':
        break;
      case 'help':
        break;
      case 'darkMode':
        this.toggleDarkMode();
        break;
    }
  }

  readonly aiPanelOpen = signal(false);
  readonly aiMessages = signal<AiMessage[]>([]);
  readonly aiInputText = signal('');
  readonly aiThinking = signal(false);
  private aiMessageCounter = 0;

  readonly aiSuggestions: string[] = [
    'Summarize project status',
    'Which projects are at risk?',
    'Show overdue estimates',
    'What needs attention today?',
  ];

  readonly projects = signal<Project[]>(PROJECTS);
  readonly estimates = signal<Estimate[]>(ESTIMATES);
  readonly attentionItems = ATTENTION_ITEMS;

  toggleAiPanel(): void {
    this.aiPanelOpen.update((v) => !v);
  }

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  selectAiSuggestion(suggestion: string): void {
    this.aiInputText.set(suggestion);
    this.sendAiMessage();
  }

  handleAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendAiMessage();
    }
  }

  sendAiMessage(): void {
    const text = this.aiInputText().trim();
    if (!text || this.aiThinking()) return;

    this.aiMessages.update((msgs) => [
      ...msgs,
      { id: ++this.aiMessageCounter, role: 'user', text },
    ]);
    this.aiInputText.set('');
    this.aiThinking.set(true);

    setTimeout(() => {
      const response = this.generateAiResponse(text);
      this.aiMessages.update((msgs) => [
        ...msgs,
        { id: ++this.aiMessageCounter, role: 'assistant', text: response },
      ]);
      this.aiThinking.set(false);
    }, 900);
  }

  private generateAiResponse(input: string): string {
    const q = input.toLowerCase();
    const projects = this.projects();
    const estimates = this.estimates();
    if (q.includes('at risk') || q.includes('risk')) {
      const atRisk = projects.filter((p: Project) => p.status === 'At Risk').map((p: Project) => p.name);
      return atRisk.length
        ? `${atRisk.length} project(s) are currently at risk: ${atRisk.join(', ')}. I recommend reviewing their timelines and resource allocations.`
        : 'Great news — no projects are currently marked as at risk.';
    }
    if (q.includes('overdue')) {
      const overdue = projects.filter((p: Project) => p.status === 'Overdue').map((p: Project) => p.name);
      const overdueEst = estimates.filter((e: Estimate) => e.daysLeft < 0).map((e: Estimate) => e.id);
      const parts: string[] = [];
      if (overdue.length) parts.push(`${overdue.length} overdue project(s): ${overdue.join(', ')}`);
      if (overdueEst.length) parts.push(`${overdueEst.length} overdue estimate(s): ${overdueEst.join(', ')}`);
      return parts.length ? parts.join('. ') + '.' : 'Nothing is overdue right now.';
    }
    if (q.includes('project') && (q.includes('status') || q.includes('summar'))) {
      const counts: Record<string, number> = {};
      projects.forEach((p: Project) => {
        counts[p.status] = (counts[p.status] ?? 0) + 1;
      });
      return 'Project summary: ' + Object.entries(counts).map(([s, c]) => `${c} ${s}`).join(', ') + `. Total: ${projects.length} projects.`;
    }
    if (q.includes('estimate')) {
      const pending = estimates.filter((e: Estimate) => e.status !== 'Approved').length;
      const total = estimates.reduce((sum: number, e: Estimate) => sum + e.valueRaw, 0);
      return `There are ${estimates.length} open estimates with a combined value of $${(total / 1000).toFixed(0)}K. ${pending} estimate(s) are pending approval.`;
    }
    if (q.includes('budget')) {
      const over = projects.filter((p: Project) => p.budgetPct >= 90).map((p: Project) => p.name);
      return over.length
        ? `${over.length} project(s) are near or over budget: ${over.join(', ')}. Consider reviewing scope or requesting budget adjustments.`
        : 'All projects are within healthy budget ranges.';
    }
    if (q.includes('attention') || q.includes('today')) {
      return `You have ${this.attentionItems.length} items that need attention, including overdue approvals and pending estimates. Check the "Needs Attention" widget for details.`;
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "Hello! I'm your Trimble AI Assistant. I can help you understand your project status, estimates, budgets, and more. What would you like to know?";
    }
    return `I can help with project status, estimates, budgets, and team insights. Try asking "Which projects are at risk?" or "Summarize project status".`;
  }

  selectNavItem(page: 'home' | 'projects' | 'financials' | 'settings'): void {
    this.navExpanded.set(false);
    switch (page) {
      case 'home':
        this.router.navigate(['/']);
        break;
      case 'projects':
        this.router.navigate(['/projects']);
        break;
      case 'financials':
        this.router.navigate(['/financials']);
        break;
      case 'settings':
        break;
    }
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.scrollTo(0, 0);
    }
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
    } else if (this.aiPanelOpen()) {
      this.aiPanelOpen.set(false);
    } else if (this.navExpanded()) {
      this.navExpanded.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.code !== 'Space' || !this.isCanvas()) return;
    const tag = (event.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (event.target as HTMLElement)?.isContentEditable) return;
    event.preventDefault();
    if (!event.repeat) {
      this.isPanReady.set(true);
    }
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.code !== 'Space') return;
    event.preventDefault();
    this.isPanReady.set(false);
    this.isPanning.set(false);
  }

  onPanMouseDown(event: MouseEvent): void {
    if (!this.isPanReady()) return;
    event.preventDefault();
    this.isPanning.set(true);
    this._panStartX = event.clientX;
    this._panStartY = event.clientY;
    this._panStartOffsetX = this.panOffsetX();
    this._panStartOffsetY = this.panOffsetY();
  }

  onPanMouseMove(event: MouseEvent): void {
    if (!this.isPanning()) return;
    const dx = event.clientX - this._panStartX;
    const dy = event.clientY - this._panStartY;
    this.panOffsetX.set(this._panStartOffsetX + dx);
    this.panOffsetY.set(this._panStartOffsetY + dy);
  }

  onPanMouseUp(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
    }
  }

  onCanvasWheel(event: WheelEvent): void {
    event.preventDefault();
    this.panOffsetX.update((x) => x - event.deltaX);
    this.panOffsetY.update((y) => y - event.deltaY);
  }

  resetCanvasView(): void {
    this.panOffsetX.set(0);
    this.panOffsetY.set(0);
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.resetMenuOpen() && !target.closest('[aria-label="Reset options"]') && !target.closest('.canvas-reset-flyout')) {
      this.resetMenuOpen.set(false);
    }
    if (this.moreMenuOpen() && !target.closest('[aria-label="More options"]') && !target.closest('[role="menuitem"]')) {
      this.moreMenuOpen.set(false);
    }
  }

  ngAfterViewInit(): void {
    const startMobile = window.innerWidth < 768;
    this.isMobile.set(startMobile);
    this.isCanvas.set(window.innerWidth >= 2000);

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects);
      });
    this.currentUrl.set(this.router.url);

    const mq = window.matchMedia('(max-width: 767px)');
    const mqCanvas = window.matchMedia('(min-width: 2000px)');

    const onBreakpointChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isMobile.set(e.matches);
      if (!e.matches) {
        this.navExpanded.set(false);
      }
    };
    mq.addEventListener('change', onBreakpointChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    const onCanvasChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.isCanvas.set(e.matches);
    };
    mqCanvas.addEventListener('change', onCanvasChange as (e: MediaQueryListEvent) => void, { signal: this._abortCtrl.signal });

    window.addEventListener('resize', () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== this.isMobile()) {
        onBreakpointChange(mq);
      }
      const canvas = window.innerWidth >= 2000;
      if (canvas !== this.isCanvas()) {
        onCanvasChange(mqCanvas);
      }
    }, { signal: this._abortCtrl.signal });

    this.attachHamburgerListener();
    this.reorderNavbarEnd();
  }

  private reorderNavbarEnd(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    const tryReorder = () => {
      const shadow = navbarWc.shadowRoot;
      if (!shadow) {
        requestAnimationFrame(tryReorder);
        return;
      }
      const endDiv = shadow.querySelector('div[slot="end"]') as HTMLElement | null;
      if (!endDiv) {
        requestAnimationFrame(tryReorder);
        return;
      }
      const endSlot = endDiv.querySelector(':scope > slot[name="end"]') as HTMLElement | null;
      if (endSlot) endSlot.style.order = '1';
      for (const child of Array.from(endDiv.children)) {
        const el = child as HTMLElement;
        const label = el.getAttribute('aria-label') || '';
        if (label === 'User profile') {
          el.style.order = '2';
        }
      }
      const userMenu = endDiv.querySelector(':scope > div.user') as HTMLElement | null;
      if (userMenu) userMenu.style.order = '2';
    };
    requestAnimationFrame(tryReorder);
  }

  private attachHamburgerListener(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;

    const tryAttach = () => {
      const btn = navbarWc.querySelector('.navbar-menu-btn, [data-testid="main-menu-btn"], button[aria-label="Main menu"]');
      if (btn) {
        this.hamburgerBtn = btn as HTMLElement;
        btn.addEventListener(
          'click',
          (e: Event) => {
            e.stopImmediatePropagation();
            this.navExpanded.set(!this.navExpanded());
          },
          { capture: true, signal: this._abortCtrl.signal }
        );
        return;
      }
      requestAnimationFrame(tryAttach);
    };
    tryAttach();
  }
}
