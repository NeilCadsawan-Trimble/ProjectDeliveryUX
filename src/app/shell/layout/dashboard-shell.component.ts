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
import { UserMenuComponent } from '../components/user-menu.component';
import { TrimbleLogoComponent } from '../components/trimble-logo.component';
import { ThemeService } from '../services/theme.service';
import { CanvasResetService } from '../services/canvas-reset.service';
import { WidgetFocusService } from '../services/widget-focus.service';
import { AiService } from '../../services/ai.service';
import { AiToolsService } from '../../services/ai-tools.service';
import { AiPanelController } from '../services/ai-panel-controller';
import { CanvasPanning } from '../services/canvas-panning';
import { NavigationHistoryService } from '../services/navigation-history.service';
import { LayoutDefaultsService } from '../services/layout-defaults.service';
import { DataStoreService } from '../../data/data-store.service';
import { WeatherService } from '../../services/weather.service';
import { getAgent, getSuggestions, type AgentDataState } from '../../data/widget-agents';

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
    UserMenuComponent,
    TrimbleLogoComponent,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': '!isCanvas()',
    '[class.canvas-pan-ready]': 'panning.isPanReady() && !panning.panBlocked()',
    '[class.canvas-panning]': 'panning.isPanning() && !panning.panBlocked()',
    '[class.canvas-locked]': 'panning.panBlocked()',
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
            <div slot="start" class="flex items-center gap-3 w-full min-w-0">
              @if (!navbarNativeRendered()) {
                <div class="flex items-center cursor-pointer text-primary flex-shrink-0 px-1" role="button" tabindex="0" aria-label="Trimble home" (click)="navigateHome()" (keydown.enter)="navigateHome()">
                  <app-trimble-logo />
                </div>
                <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
              }
              @if (navHistory.shellBackButton()) {
                <div
                  class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
                  (click)="navHistory.shellBackButton()?.action()"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="navHistory.shellBackButton()?.action()"
                >
                  <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
                  <div class="text-sm">{{ navHistory.shellBackButton()?.label || 'Back' }}</div>
                </div>
                <div class="w-px h-5 bg-foreground-20"></div>
              }
              @if (navHistory.shellTitleOverride(); as titleOv) {
                <div class="relative min-w-0 flex-1">
                  <div
                    class="flex items-center gap-1 cursor-pointer select-none"
                    role="button"
                    [attr.aria-expanded]="shellSelectorOpen()"
                    (click)="shellSelectorOpen.set(!shellSelectorOpen()); $event.stopPropagation()"
                    (keydown.enter)="shellSelectorOpen.set(!shellSelectorOpen()); $event.stopPropagation()"
                    tabindex="0"
                  >
                    <div class="text-2xl font-semibold text-foreground tracking-wide truncate" [title]="titleOv.text">{{ titleOv.text }}</div>
                    <i class="modus-icons text-base text-foreground-60 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="shellSelectorOpen()" aria-hidden="true">expand_more</i>
                  </div>
                  @if (shellSelectorOpen()) {
                    <div class="absolute top-full left-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[260px] max-w-[340px] py-1 max-h-[320px] overflow-y-auto" role="listbox" aria-label="Switch project">
                      @for (item of titleOv.items; track item.id) {
                        <div
                          class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="option"
                          (click)="selectShellTitleItem(item.id); $event.stopPropagation()"
                        >
                          <div class="flex flex-col min-w-0">
                            <div class="text-sm font-medium text-foreground truncate">{{ item.label }}</div>
                            @if (item.sublabel) {
                              <div class="text-xs text-foreground-60 truncate">{{ item.sublabel }}</div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">{{ appTitle() }}</div>
              }
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
              @if (!navbarNativeRendered()) {
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Search" tabindex="0"
                  (click)="searchInputOpen.set(!searchInputOpen())"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">search</i>
                </div>
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Notifications" tabindex="0"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">notifications</i>
                </div>
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Help" tabindex="0"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">help</i>
                </div>
              }
              <user-menu
                [name]="userCard().name"
                [email]="userCard().email"
                [avatarSrc]="userCard().avatarSrc"
                (menuAction)="onUserMenuAction($event)"
                (signOut)="onUserSignOut()"
              />
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
                @if (panning.locked()) {
                  <i class="modus-icons absolute top-1 right-1 text-2xs text-primary" aria-hidden="true">lock</i>
                }
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
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="panning.toggleLock(); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" [class]="panning.locked() ? 'text-primary' : 'text-foreground'" aria-hidden="true">{{ panning.locked() ? 'lock' : 'lock_open' }}</i>
                    <div class="text-sm" [class]="panning.locked() ? 'text-primary font-medium' : 'text-foreground'">{{ panning.locked() ? 'Canvas Locked' : 'Canvas Unlocked' }}</div>
                  </div>
                  <div class="border-bottom-default my-1"></div>
                  @if (isProjectsPage()) {
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('sort-by-priority'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">unsorted_arrows</i>
                      <div class="text-sm">Sort by Priority</div>
                    </div>
                  }
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
          [style.transform]="'translate(' + panning.panOffsetX() + 'px,' + panning.panOffsetY() + 'px) scale(' + panning.canvasZoom() + ')'">
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
            <div slot="start" class="flex items-center gap-3 w-full min-w-0">
              @if (!navbarNativeRendered()) {
                <div
                  class="flex items-center justify-center w-8 h-8 rounded cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150 flex-shrink-0"
                  role="button" aria-label="Main menu" tabindex="0"
                  (click)="navExpanded.set(!navExpanded())"
                  (keydown.enter)="navExpanded.set(!navExpanded())"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">menu</i>
                </div>
                <div class="flex items-center cursor-pointer text-primary flex-shrink-0 px-1" role="button" tabindex="0" aria-label="Trimble home" (click)="navigateHome()" (keydown.enter)="navigateHome()">
                  <app-trimble-logo />
                </div>
                <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
              }
              @if (navHistory.shellBackButton()) {
                <div
                  class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
                  (click)="navHistory.shellBackButton()?.action()"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="navHistory.shellBackButton()?.action()"
                >
                  <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
                  <div class="text-sm hidden md:block">{{ navHistory.shellBackButton()?.label || 'Back' }}</div>
                </div>
                <div class="w-px h-5 bg-foreground-20"></div>
              }
              @if (navHistory.shellTitleOverride(); as titleOv) {
                <div class="relative min-w-0 flex-1">
                  <div
                    class="flex items-center gap-1 cursor-pointer select-none"
                    role="button"
                    [attr.aria-expanded]="shellSelectorOpen()"
                    (click)="shellSelectorOpen.set(!shellSelectorOpen()); $event.stopPropagation()"
                    (keydown.enter)="shellSelectorOpen.set(!shellSelectorOpen()); $event.stopPropagation()"
                    tabindex="0"
                  >
                    <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide truncate" [title]="titleOv.text">{{ titleOv.text }}</div>
                    <i class="modus-icons text-base text-foreground-60 flex-shrink-0 transition-transform duration-150" [class.rotate-180]="shellSelectorOpen()" aria-hidden="true">expand_more</i>
                  </div>
                  @if (shellSelectorOpen()) {
                    <div class="absolute top-full left-0 mt-1 z-50 bg-card border-default rounded-lg shadow-lg min-w-[260px] max-w-[340px] py-1 max-h-[320px] overflow-y-auto" role="listbox" aria-label="Switch project">
                      @for (item of titleOv.items; track item.id) {
                        <div
                          class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted transition-colors duration-150"
                          role="option"
                          (click)="selectShellTitleItem(item.id); $event.stopPropagation()"
                        >
                          <div class="flex flex-col min-w-0">
                            <div class="text-sm font-medium text-foreground truncate">{{ item.label }}</div>
                            @if (item.sublabel) {
                              <div class="text-xs text-foreground-60 truncate">{{ item.sublabel }}</div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div class="text-sm md:text-2xl font-semibold text-foreground tracking-wide whitespace-nowrap">{{ appTitle() }}</div>
              }
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
              @if (!navbarNativeRendered() && !isMobile()) {
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Search" tabindex="0"
                  (click)="searchInputOpen.set(!searchInputOpen())"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">search</i>
                </div>
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Notifications" tabindex="0"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">notifications</i>
                </div>
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                  role="button" aria-label="Help" tabindex="0"
                >
                  <i class="modus-icons text-lg" aria-hidden="true">help</i>
                </div>
              }
            @if (isMobile()) {
              <div class="relative">
                <div
                  class="flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
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
              <user-menu
                [name]="userCard().name"
                [email]="userCard().email"
                [avatarSrc]="userCard().avatarSrc"
                (menuAction)="onUserMenuAction($event)"
                (signOut)="onUserSignOut()"
              />
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
                  @if (navExpanded() && !isMobile()) {
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
                  @if (navExpanded() && !isMobile()) {
                    <div class="custom-side-nav-label">Layout</div>
                  }
                  <svg class="absolute bottom-1 right-1 w-1.5 h-1.5 text-foreground-40" viewBox="0 0 6 6" fill="currentColor" aria-hidden="true">
                    <path d="M6 0V6H0L6 0Z"/>
                  </svg>
                </div>
                @if (desktopResetMenuOpen()) {
                  <div class="desktop-reset-flyout bg-card border-default rounded-lg shadow-lg z-50 min-w-[210px] py-1">
                    @if (isProjectsPage()) {
                      <div
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                        role="menuitem"
                        (click)="resetMenuAction('sort-by-priority'); $event.stopPropagation()"
                      >
                      <i class="modus-icons text-base" aria-hidden="true">unsorted_arrows</i>
                      <div class="text-sm">Sort by Priority</div>
                    </div>
                    }
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
                @if (navExpanded() && !isMobile()) {
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
  private readonly store = inject(DataStoreService);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly _abortCtrl = new AbortController();
  private _hamburgerAbort: AbortController | null = null;
  private readonly _registerCleanup = this.destroyRef.onDestroy(() => {
    this._hamburgerAbort?.abort();
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
    const canvas = this.isCanvas();
    return {
      user: false,
      mainMenu: !canvas,
      ai: false,
      notifications: true,
      apps: false,
      help: true,
      search: true,
      searchInput: true,
    };
  });

  readonly navExpanded = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvas = signal(typeof window !== 'undefined' ? window.innerWidth >= 1920 : false);
  readonly navbarNativeRendered = signal(false);
  private readonly canvasResetService = inject(CanvasResetService);

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

  private readonly _syncZoomEffect = effect(() => {
    this.canvasResetService.canvasZoom.set(this.panning.canvasZoom());
  });

  private readonly _reattachHamburgerEffect = effect(() => {
    this.isCanvas();
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        this.attachHamburgerListener();
      });
    });
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

  readonly isProjectsPage = computed(() => this.currentUrl() === '/projects');

  readonly moreMenuOpen = signal(false);
  readonly resetMenuOpen = signal(false);
  readonly desktopResetMenuOpen = signal(false);
  readonly shellSelectorOpen = signal(false);

  readonly widgetFocusService = inject(WidgetFocusService);
  readonly navHistory = inject(NavigationHistoryService);
  private readonly layoutDefaults = inject(LayoutDefaultsService);
  private readonly aiService = inject(AiService);
  private readonly aiToolsService = inject(AiToolsService);
  private readonly weatherService = inject(WeatherService);

  private readonly _aiShellContextEffect = effect(() => {
    const nav = this.activeNav();
    const items = this.sideNavItems();
    const item = items.find(i => i.value === nav);
    const label = item?.label ?? 'Dashboard';
    this.widgetFocusService.setDefaults('Trimble AI', label);
  });

  private readonly shellContextKey = computed(() => `shell:${this.getPageName()}`);

  readonly ai = new AiPanelController({
    widgetFocusService: this.widgetFocusService,
    aiService: this.aiService,
    aiToolsService: this.aiToolsService,
    router: this.router,
    defaultSuggestions: computed(() => {
      const page = this.getPageName();
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return getSuggestions(agent, state);
    }),
    contextBuilder: () => {
      const page = this.getPageName();
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return this.aiService.buildContext(page, {
        projectData: agent.buildContext(state),
        agentPrompt: agent.systemPrompt,
      });
    },
    localResponder: () => {
      const page = this.getPageName();
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return (query: string) => agent.localRespond(query, state);
    },
    actionsProvider: () => {
      const page = this.getPageName();
      const widgetId = this.widgetFocusService.selectedWidgetId();
      const agent = getAgent(widgetId, page);
      const state = this.buildAgentDataState();
      return agent.actions?.(state) ?? [];
    },
    contextKey: this.shellContextKey,
    injector: this.injector,
  });

  readonly isDark = computed(() => this.themeService.mode() === 'dark');

  toggleDarkMode(): void {
    this.themeService.toggleMode();
  }

  onUserMenuAction(actionId: string): void {
    console.log('User menu action:', actionId);
  }

  onUserSignOut(): void {
    console.log('Sign out requested');
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

  selectShellTitleItem(id: number): void {
    this.shellSelectorOpen.set(false);
    const titleOv = this.navHistory.shellTitleOverride();
    if (titleOv) titleOv.onSelect(id);
  }

  resetMenuAction(action: 'view' | 'widgets' | 'sort-by-priority' | 'save-defaults' | 'save-all-defaults'): void {
    this.resetMenuOpen.set(false);
    this.desktopResetMenuOpen.set(false);
    if (action === 'view') {
      if (this.isCanvas()) {
        this.panning.resetView();
      }
    } else if (action === 'sort-by-priority' || action === 'widgets') {
      if (this.isCanvas()) {
        this.panning.resetView();
      }
      this.canvasResetService.triggerResetWidgets();
    } else if (action === 'save-defaults') {
      this.canvasResetService.triggerSaveDefaults();
    } else if (action === 'save-all-defaults') {
      this.canvasResetService.triggerSaveDefaults();
      const count = this.layoutDefaults.saveAllVisitedDefaults();
      console.log(`Saved default layouts for ${count} dashboards`);
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
    if (url.startsWith('/financials/job-costs/')) return 'financials-job-cost-detail';
    if (url.startsWith('/financials')) return 'financials';
    return 'home';
  }

  private buildAgentDataState(): AgentDataState {
    const page = this.getPageName();
    const state: AgentDataState = {
      projects: this.store.projects(),
      estimates: this.store.estimates(),
      activities: this.store.activities(),
      attentionItems: this.store.attentionItems(),
      timeOffRequests: this.store.timeOffRequests(),
      rfis: this.store.rfis(),
      submittals: this.store.submittals(),
      calendar: this.store.calendarAppointments(),
      changeOrders: this.store.changeOrders(),
      dailyReports: this.store.dailyReports(),
      weatherForecast: this.store.weatherForecast(),
      projectAttentionItems: this.store.projectAttentionItems(),
      inspections: this.store.inspections(),
      punchListItems: this.store.punchListItems(),
      projectRevenue: this.store.projectRevenue(),
      allWeatherData: this.store.weatherData(),
      allJobCosts: this.store.projectJobCosts(),
      currentPage: page,
    };
    if (page === 'financials-job-cost-detail') {
      const url = this.currentUrl();
      const slug = url.replace('/financials/job-costs/', '').split('?')[0];
      const proj = this.store.findProjectBySlug(slug);
      if (proj) {
        state.jobCostDetailProject = this.store.projectJobCosts().find(p => p.projectId === proj.id) ?? undefined;
        state.projectName = proj.name;
      }
    }
    return state;
  }

  navigateHome(): void {
    this.router.navigate([this.homeRoute()]);
  }

  private _hamburgerAttached = false;

  onMainMenuToggle(open: boolean): void {
    if (!this._hamburgerAttached) {
      this.navExpanded.set(open);
    }
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
    if (this.shellSelectorOpen()) {
      this.shellSelectorOpen.set(false);
    } else if (this.resetMenuOpen()) {
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
    const insideAiPanel = !!target.closest('ai-assistant-panel') || !!target.closest('modus-utility-panel') || !!target.closest('modus-wc-utility-panel');
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
    if (this.shellSelectorOpen() && !target.closest('[role="listbox"]') && !target.closest('[aria-expanded]')) {
      this.shellSelectorOpen.set(false);
    }
  }

  ngAfterViewInit(): void {
    this.isMobile.set(window.innerWidth < 768);
    this.isCanvas.set(window.innerWidth >= 1920);
    this.weatherService.initialize();
    this.detectNativeNavbarRender();

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.currentUrl.set(e.urlAfterRedirects));
    this.currentUrl.set(this.router.url);

    const mq = window.matchMedia('(max-width: 767px)');
    const mqCanvas = window.matchMedia('(min-width: 1920px)');

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
      const canvas = window.innerWidth >= 1920;
      if (canvas !== this.isCanvas()) onCanvasChange(mqCanvas);
    }, { signal: this._abortCtrl.signal });

  }

  private detectNativeNavbarRender(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const toolbar = this.elementRef.nativeElement.querySelector('modus-wc-toolbar');
        this.navbarNativeRendered.set(!!toolbar);
        if (!toolbar) {
          this.attachHamburgerListener();
        }
      });
    });
  }

  private attachHamburgerListener(): void {
    if (this._hamburgerAbort) {
      this._hamburgerAbort.abort();
      this._hamburgerAbort = null;
    }
    this._hamburgerAttached = false;
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    const abort = new AbortController();
    this._hamburgerAbort = abort;
    let attempts = 0;
    const tryAttach = () => {
      if (abort.signal.aborted || ++attempts > 100) return;
      const shadow = navbarWc.shadowRoot;
      const btn =
        shadow?.querySelector('[aria-label="Main menu"]') ??
        navbarWc.querySelector('[aria-label="Main menu"]');
      if (btn) {
        this._hamburgerAttached = true;
        btn.addEventListener('click', (e: Event) => {
          e.stopImmediatePropagation();
          this.navExpanded.set(!this.navExpanded());
        }, { capture: true, signal: abort.signal });
        return;
      }
      requestAnimationFrame(tryAttach);
    };
    tryAttach();
  }
}
