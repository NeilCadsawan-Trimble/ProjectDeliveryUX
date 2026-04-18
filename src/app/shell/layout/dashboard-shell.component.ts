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
import type { INavbarUserCard } from '../../components/modus-navbar.component';
import { ModusTextInputComponent } from '../../components/modus-text-input.component';
import { AiIconComponent } from '../components/ai-icon.component';
import { AiAssistantPanelComponent } from '../components/ai-assistant-panel.component';
import { UserMenuComponent } from '../components/user-menu.component';
import { TrimbleLogoComponent } from '../components/trimble-logo.component';
import { ThemeService } from '../../services/theme.service';
import { CanvasResetService } from '../services/canvas-reset.service';
import { WidgetFocusService } from '../services/widget-focus.service';
import { AiService } from '../../services/ai.service';
import { AiToolsService } from '../../services/ai-tools.service';
import { PersonaService } from '../../services/persona.service';
import { getPersonaNav } from '../../data/persona-nav.config';
import { AiPanelController } from '../services/ai-panel-controller';
import { CanvasPanning } from '../services/canvas-panning';
import { NavigationHistoryService } from '../services/navigation-history.service';
import {
  coerceMainMenuOpenPayload,
  isClickInsideSideNavChrome,
} from '../utils/side-nav-click.util';
import { LayoutDefaultsService } from '../services/layout-defaults.service';
import { DataStoreService } from '../../data/data-store.service';
import { WeatherService } from '../../services/weather.service';
import { AuthService } from '../../services/auth.service';
import { getAgent, getSuggestions, type AgentDataState } from '../../data/widget-agents';
import { environment } from '../../../environments/environment';
import { ModusTypographyComponent } from '../../components/modus-typography.component';

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
    RouterOutlet,
    ModusTextInputComponent,
    AiIconComponent,
    AiAssistantPanelComponent,
    UserMenuComponent,
    TrimbleLogoComponent,
    ModusTypographyComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    '[class.h-screen]': '!isCanvas()',
    '[class.overflow-hidden]': 'true',
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
          <stop offset="20%" stop-color="hsl(300, 100%, 50%)" />
          <stop offset="60%" stop-color="#0066CC" />
          <stop offset="100%" stop-color="#0066CC" />
        </linearGradient>
        <radialGradient id="ai-grad-dark" cx="18%" cy="18%" r="70%">
          <stop offset="0%" stop-color="hsl(300, 100%, 50%)" />
          <stop offset="50%" stop-color="#9933FF" />
          <stop offset="100%" stop-color="#0066CC" />
        </radialGradient>
      </defs>
    </svg>
    <div class="skip-nav" tabindex="0" role="link" (click)="focusMain()" (keydown.enter)="focusMain()">Skip to main content</div>

    @if (isCanvas()) {
      <div class="canvas-host bg-background text-foreground canvas-mode select-none" #canvasHost (mousedown)="panning.onPanMouseDown($event)">

        <div class="canvas-navbar">
          <div class="app-navbar">
            <div class="app-navbar-start">
              <div class="flex items-center cursor-pointer text-primary flex-shrink-0 px-1" role="button" tabindex="0" aria-label="Trimble home" (click)="navigateHome()" (keydown.enter)="navigateHome()">
                <app-trimble-logo />
              </div>
              <div class="w-px h-5 bg-foreground-20 flex-shrink-0"></div>
              @if (navHistory.shellBackButton()) {
                <div
                  class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
                  (click)="navHistory.shellBackButton()?.action()"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="navHistory.shellBackButton()?.action()"
                >
                  <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
                  <modus-typography hierarchy="p" size="sm">{{ navHistory.shellBackButton()?.label || 'Back' }}</modus-typography>
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
                    <modus-typography hierarchy="h1" size="xl" weight="semibold" className="tracking-wide truncate" [title]="titleOv.text">{{ titleOv.text }}</modus-typography>
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
                            <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ item.label }}</modus-typography>
                            @if (item.sublabel) {
                              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ item.sublabel }}</modus-typography>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <modus-typography hierarchy="h1" size="xl" weight="semibold" className="tracking-wide whitespace-nowrap">{{ appTitle() }}</modus-typography>
              }
            </div>
            <div class="app-navbar-end">
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
              @if (searchInputOpen()) {
                <modus-text-input
                  class="w-44 min-w-[10rem] max-w-xs shrink"
                  inputId="shell-navbar-search-canvas"
                  placeholder="Search"
                  size="sm"
                  [includeSearch]="true"
                  [includeClear]="true"
                  [value]="navbarSearchQuery()"
                  (inputChange)="handleNavbarSearchInput($event)"
                />
              }
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
              <user-menu
                [name]="userCard().name"
                [email]="userCard().email"
                [avatarSrc]="userCard().avatarSrc"
                [activePersonaSlug]="activePersonaSlug()"
                (menuAction)="onUserMenuAction($event)"
                (personaSwitch)="onPersonaSwitch($event)"
                (signOut)="onUserSignOut()"
              />
            </div>
          </div>
        </div>

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
                <div class="custom-side-nav-icon-slot">
                  <i class="modus-icons text-xl" aria-hidden="true">{{ item.icon }}</i>
                </div>
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
                <div class="custom-side-nav-icon-slot">
                  <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                </div>
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
                    <modus-typography hierarchy="p" size="sm" [weight]="panning.locked() ? 'semibold' : 'normal'" [className]="panning.locked() ? 'text-primary' : 'text-foreground'">{{ panning.locked() ? 'Canvas Locked' : 'Canvas Unlocked' }}</modus-typography>
                  </div>
                  <div class="border-bottom-default my-1"></div>
                  @if (isProjectsPage()) {
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('sort-by-priority'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">unsorted_arrows</i>
                      <modus-typography hierarchy="p" size="sm">Sort by Priority</modus-typography>
                    </div>
                  }
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('view'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">window_fit</i>
                    <modus-typography hierarchy="p" size="sm">Reset View</modus-typography>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                    <modus-typography hierarchy="p" size="sm">Reset Layout</modus-typography>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('load-defaults'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">refresh</i>
                    <modus-typography hierarchy="p" size="sm">Load Default Layout</modus-typography>
                  </div>
                  <div
                    class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                    role="menuitem"
                    (click)="resetMenuAction('save-defaults'); $event.stopPropagation()"
                  >
                    <i class="modus-icons text-base" aria-hidden="true">save_disk</i>
                    <modus-typography hierarchy="p" size="sm">Save as Default Layout</modus-typography>
                  </div>
                  @if (isDevMode) {
                    <div class="border-top-default my-1"></div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('export-layout'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">clipboard</i>
                      <modus-typography hierarchy="p" size="sm">{{ exportLayoutLabel() }}</modus-typography>
                    </div>
                  }
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
              <div class="custom-side-nav-icon-slot">
                <i class="modus-icons text-xl" aria-hidden="true">settings</i>
              </div>
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
          [style.transform]="'translateX(-50%) translate(' + panning.panOffsetX() + 'px,' + panning.panOffsetY() + 'px) scale(' + panning.canvasZoom() + ')'">
          <router-outlet />
        </div>

      </div>
    } @else {
      <div class="h-full flex flex-col bg-background text-foreground overflow-hidden">
          <div class="app-navbar">
            <div class="app-navbar-start">
              <div
                class="shell-navbar-hamburger flex items-center justify-center w-8 h-8 rounded cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150 flex-shrink-0"
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
              @if (navHistory.shellBackButton()) {
                <div
                  class="flex items-center gap-2 cursor-pointer text-foreground-60 hover:text-foreground transition-colors duration-150 flex-shrink-0"
                  (click)="navHistory.shellBackButton()?.action()"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="navHistory.shellBackButton()?.action()"
                >
                  <i class="modus-icons text-base" aria-hidden="true">arrow_left</i>
                  <modus-typography hierarchy="p" size="sm" className="hidden md:block">{{ navHistory.shellBackButton()?.label || 'Back' }}</modus-typography>
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
                    <modus-typography hierarchy="h1" size="xl" weight="semibold" className="text-sm md:text-2xl tracking-wide truncate" [title]="titleOv.text">{{ titleOv.text }}</modus-typography>
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
                            <modus-typography hierarchy="p" size="sm" weight="semibold" className="truncate">{{ item.label }}</modus-typography>
                            @if (item.sublabel) {
                              <modus-typography hierarchy="p" size="xs" className="text-foreground-60 truncate">{{ item.sublabel }}</modus-typography>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <modus-typography hierarchy="h1" size="xl" weight="semibold" className="text-sm md:text-2xl tracking-wide whitespace-nowrap">{{ appTitle() }}</modus-typography>
              }
            </div>
            <div class="app-navbar-end">
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
              @if (searchInputOpen() && !isMobile()) {
                <modus-text-input
                  class="w-44 min-w-[10rem] max-w-xs shrink hidden md:block"
                  inputId="shell-navbar-search-desktop"
                  placeholder="Search"
                  size="sm"
                  [includeSearch]="true"
                  [includeClear]="true"
                  [value]="navbarSearchQuery()"
                  (inputChange)="handleNavbarSearchInput($event)"
                />
              }
              @if (!isMobile()) {
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
              @if (searchInputOpen() && isMobile()) {
                <modus-text-input
                  class="min-w-0 flex-1 max-w-[220px]"
                  inputId="shell-navbar-search-mobile"
                  placeholder="Search"
                  size="sm"
                  [includeSearch]="true"
                  [includeClear]="true"
                  [value]="navbarSearchQuery()"
                  (inputChange)="handleNavbarSearchInput($event)"
                />
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
                      <modus-typography hierarchy="p" size="sm">Search</modus-typography>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('notifications')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">notifications</i>
                      <modus-typography hierarchy="p" size="sm">Notifications</modus-typography>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('help')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">help</i>
                      <modus-typography hierarchy="p" size="sm">Help</modus-typography>
                    </div>
                    <div class="border-bottom-default mx-3 my-1"></div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="moreMenuAction('darkMode')"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">{{ isDark() ? 'sun' : 'moon' }}</i>
                      <modus-typography hierarchy="p" size="sm">{{ isDark() ? 'Light Mode' : 'Dark Mode' }}</modus-typography>
                    </div>
                    @if (isDevMode) {
                      <div class="border-bottom-default mx-3 my-1"></div>
                      <div
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                        role="menuitem"
                        (click)="moreMenuAction('export-layout')"
                      >
                        <i class="modus-icons text-base" aria-hidden="true">clipboard</i>
                        <modus-typography hierarchy="p" size="sm">{{ exportLayoutLabel() }}</modus-typography>
                      </div>
                    }
                  </div>
                }
              </div>
            }
              <user-menu
                [name]="userCard().name"
                [email]="userCard().email"
                [avatarSrc]="userCard().avatarSrc"
                [activePersonaSlug]="activePersonaSlug()"
                (menuAction)="onUserMenuAction($event)"
                (personaSwitch)="onPersonaSwitch($event)"
                (signOut)="onUserSignOut()"
              />
          </div>
          </div>

        <div class="navbar-shadow"></div>

        <!-- Desktop content is in the shared content wrapper below -->

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
                  <div class="custom-side-nav-icon-slot">
                    <i class="modus-icons text-xl" aria-hidden="true">{{ item.icon }}</i>
                  </div>
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
                  <div class="custom-side-nav-icon-slot">
                    <i class="modus-icons text-xl" aria-hidden="true">window_fit</i>
                  </div>
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
                      <modus-typography hierarchy="p" size="sm">Sort by Priority</modus-typography>
                    </div>
                    }
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('widgets'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">dashboard_tiles</i>
                      <modus-typography hierarchy="p" size="sm">Reset Layout</modus-typography>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('load-defaults'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">refresh</i>
                      <modus-typography hierarchy="p" size="sm">Load Default Layout</modus-typography>
                    </div>
                    <div
                      class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                      role="menuitem"
                      (click)="resetMenuAction('save-defaults'); $event.stopPropagation()"
                    >
                      <i class="modus-icons text-base" aria-hidden="true">save_disk</i>
                      <modus-typography hierarchy="p" size="sm">Save as Default Layout</modus-typography>
                    </div>
                    @if (isDevMode) {
                      <div class="border-top-default my-1"></div>
                      <div
                        class="flex items-center gap-3 px-4 py-2.5 cursor-pointer text-foreground hover:bg-muted transition-colors duration-150"
                        role="menuitem"
                        (click)="resetMenuAction('export-layout'); $event.stopPropagation()"
                      >
                        <i class="modus-icons text-base" aria-hidden="true">clipboard</i>
                        <modus-typography hierarchy="p" size="sm">{{ exportLayoutLabel() }}</modus-typography>
                      </div>
                    }
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
                <div class="custom-side-nav-icon-slot">
                  <i class="modus-icons text-xl" aria-hidden="true">settings</i>
                </div>
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

        <div class="flex flex-1 overflow-hidden">
          <div class="flex-1 overflow-auto bg-background md:pl-14" role="main" id="main-content" tabindex="-1">
            <router-outlet />
          </div>
        </div>

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
  readonly activePersonaSlug = input<string>('frank');
  readonly aiResponseFn = input<AiResponseFn | undefined>(undefined);
  readonly defaultAiSuggestions = input<string[]>([
    'What can you help me with?',
    'Show me an overview',
  ]);
  readonly aiWelcomeText = input('Ask me anything about your dashboard.');
  readonly aiPlaceholder = input('Ask a question...');

  private readonly currentUrl = signal('/');

  readonly searchInputOpen = signal(false);
  readonly navbarSearchQuery = signal('');

  readonly navExpanded = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvas = signal(typeof window !== 'undefined' ? window.innerWidth >= 1920 : false);
  private readonly canvasResetService = inject(CanvasResetService);
  private readonly personaService = inject(PersonaService);

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

  private readonly viewMode = computed(() => {
    if (this.isMobile()) return 'mobile' as const;
    if (this.isCanvas()) return 'canvas' as const;
    return 'desktop' as const;
  });

  private readonly _syncViewModeEffect = effect(() => {
    this.personaService.setViewMode(this.viewMode());
  });

  private readonly routeSuffix = computed(() => {
    const url = this.currentUrl();
    const slug = this.activePersonaSlug();
    const prefix = `/${slug}`;
    return url.startsWith(prefix) ? url.slice(prefix.length) || '/' : url;
  });

  readonly activeNav = computed(() => {
    const suffix = this.routeSuffix();
    const items = this.sideNavItems();
    if (suffix === '/profile' || suffix === '/account-settings' || suffix === '/my-products') return '';
    if (suffix.startsWith('/project/')) {
      const projects = items.find((i) => i.value === 'projects');
      return projects?.value ?? 'projects';
    }
    for (const item of items) {
      if (!item.route) continue;
      const baseRoute = item.route.replace(/\/$/, '');
      const slug = this.activePersonaSlug();
      const itemSuffix = baseRoute.startsWith(`/${slug}`)
        ? baseRoute.slice(`/${slug}`.length) || '/'
        : baseRoute;
      if (itemSuffix === '/') continue;
      if (suffix.startsWith(itemSuffix)) return item.value;
    }
    if (suffix === '/' || suffix === '') {
      const home = items.find(i => i.value === 'home');
      return home?.value ?? items[0]?.value ?? 'home';
    }
    return items[0]?.value ?? 'home';
  });

  readonly isProjectsPage = computed(() => this.routeSuffix() === '/projects');

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

  readonly isDevMode = !environment.production;
  readonly exportLayoutLabel = signal('Export Layout Seed');

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

  handleNavbarSearchInput(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    this.navbarSearchQuery.set(target?.value ?? '');
  }

  onUserMenuAction(actionId: string): void {
    const slug = this.personaService.activePersonaSlug();
    if (actionId === 'profile') {
      void this.router.navigateByUrl(`/${slug}/profile`);
      return;
    }
    if (actionId === 'admin') {
      void this.router.navigateByUrl(`/${slug}/account-settings`);
      return;
    }
    if (actionId === 'products') {
      void this.router.navigateByUrl(`/${slug}/my-products`);
      return;
    }
  }

  onPersonaSwitch(targetSlug: string): void {
    this.store.switchToPersona(targetSlug);
    this.personaService.setActivePersona(targetSlug);
    void this.router.navigateByUrl(`/${targetSlug}`);
  }

  private readonly authService = inject(AuthService);

  onUserSignOut(): void {
    this.authService.logout();
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

  resetMenuAction(action: 'view' | 'widgets' | 'load-defaults' | 'sort-by-priority' | 'save-defaults' | 'save-all-defaults' | 'export-layout'): void {
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
    } else if (action === 'load-defaults') {
      if (this.isCanvas()) {
        this.panning.resetView();
      }
      this.canvasResetService.triggerLoadDefaults();
    } else if (action === 'save-defaults') {
      this.canvasResetService.triggerSaveDefaults();
    } else if (action === 'save-all-defaults') {
      this.canvasResetService.triggerSaveDefaults();
      const count = this.layoutDefaults.saveAllVisitedDefaults();
      console.log(`Saved default layouts for ${count} dashboards`);
    } else if (action === 'export-layout') {
      this.exportCurrentLayout();
    }
  }

  private getSeedFileTarget(): { filePath: string; constName: string } | null {
    const page = this.getPageName();
    const slug = this.personaService.activePersonaSlug();

    const map: Record<string, { filePath: string; constName: string }> = {
      'home:frank': { filePath: 'src/app/data/layout-seeds/home-frank.layout.ts', constName: 'HOME_FRANK_LAYOUT' },
      'home:bert': { filePath: 'src/app/data/layout-seeds/home-bert.layout.ts', constName: 'HOME_BERT_LAYOUT' },
      'home:kelly': { filePath: 'src/app/data/layout-seeds/home-kelly.layout.ts', constName: 'HOME_KELLY_LAYOUT' },
      'home:dominique': { filePath: 'src/app/data/layout-seeds/home-dominique.layout.ts', constName: 'HOME_DOMINIQUE_LAYOUT' },
      'home:pamela': { filePath: 'src/app/data/layout-seeds/home-pamela.layout.ts', constName: 'HOME_PAMELA_LAYOUT' },
      'financials:frank': { filePath: 'src/app/data/layout-seeds/financials-frank.layout.ts', constName: 'FINANCIALS_FRANK_LAYOUT' },
      'financials:bert': { filePath: 'src/app/data/layout-seeds/financials-bert.layout.ts', constName: 'FINANCIALS_BERT_LAYOUT' },
      'financials:kelly': { filePath: 'src/app/data/layout-seeds/financials-kelly.layout.ts', constName: 'FINANCIALS_KELLY_LAYOUT' },
      'financials:dominique': { filePath: 'src/app/data/layout-seeds/financials-dominique.layout.ts', constName: 'FINANCIALS_DOMINIQUE_LAYOUT' },
      'financials:pamela': { filePath: 'src/app/data/layout-seeds/financials-pamela.layout.ts', constName: 'FINANCIALS_PAMELA_LAYOUT' },
      'projects:frank': { filePath: 'src/app/data/layout-seeds/projects-frank.layout.ts', constName: 'PROJECTS_FRANK_LAYOUT' },
      'projects:bert': { filePath: 'src/app/data/layout-seeds/projects-bert.layout.ts', constName: 'PROJECTS_BERT_LAYOUT' },
      'projects:kelly': { filePath: 'src/app/data/layout-seeds/projects-kelly.layout.ts', constName: 'PROJECTS_KELLY_LAYOUT' },
      'projects:dominique': { filePath: 'src/app/data/layout-seeds/projects-dominique.layout.ts', constName: 'PROJECTS_DOMINIQUE_LAYOUT' },
      'projects:pamela': { filePath: 'src/app/data/layout-seeds/projects-pamela.layout.ts', constName: 'PROJECTS_PAMELA_LAYOUT' },
      'project-dashboard:frank': { filePath: 'src/app/data/layout-seeds/project-detail-frank.layout.ts', constName: 'PROJECT_DETAIL_FRANK_LAYOUT' },
      'project-dashboard:bert': { filePath: 'src/app/data/layout-seeds/project-detail-bert.layout.ts', constName: 'PROJECT_DETAIL_BERT_LAYOUT' },
      'project-dashboard:kelly': { filePath: 'src/app/data/layout-seeds/project-detail-kelly.layout.ts', constName: 'PROJECT_DETAIL_KELLY_LAYOUT' },
      'project-dashboard:dominique': { filePath: 'src/app/data/layout-seeds/project-detail-dominique.layout.ts', constName: 'PROJECT_DETAIL_DOMINIQUE_LAYOUT' },
      'project-dashboard:pamela': { filePath: 'src/app/data/layout-seeds/project-detail-pamela.layout.ts', constName: 'PROJECT_DETAIL_PAMELA_LAYOUT' },
    };

    return map[`${page}:${slug}`] ?? map[`${page}:default`] ?? null;
  }

  private exportCurrentLayout(): void {
    const target = this.getSeedFileTarget();
    if (target) {
      this.canvasResetService.exportConstName.set(target.constName);
    }

    this.canvasResetService.triggerExportLayout();
    requestAnimationFrame(() => {
      const seed = this.canvasResetService.lastExportedSeed();
      if (!seed) return;

      if (!target) {
        navigator.clipboard.writeText(seed).then(() => {
          this.exportLayoutLabel.set('Copied to Clipboard');
          setTimeout(() => this.exportLayoutLabel.set('Export Layout Seed'), 3000);
        });
        return;
      }

      this.canvasResetService.triggerSaveDefaults();

      requestAnimationFrame(() => {
        fetch('http://localhost:3001/api/save-layout-seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: target.filePath, content: seed }),
        })
          .then((resp) => {
            if (!resp.ok) throw new Error(`Save failed: ${resp.status}`);
            return resp.json();
          })
          .then(() => {
            this.exportLayoutLabel.set(`Saved to ${target.filePath.split('/').pop()}`);
            setTimeout(() => this.exportLayoutLabel.set('Export Layout Seed'), 4000);
          })
          .catch((err) => {
            console.error('Failed to save layout seed, falling back to clipboard:', err);
            navigator.clipboard.writeText(seed).then(() => {
              this.exportLayoutLabel.set('Copied to Clipboard (save failed)');
              setTimeout(() => this.exportLayoutLabel.set('Export Layout Seed'), 4000);
            });
          });
      });
    });
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
      case 'export-layout':
        this.exportCurrentLayout();
        break;
    }
  }


  private getPageName(): string {
    const suffix = this.routeSuffix();
    if (suffix.startsWith('/projects')) return 'projects';
    if (suffix.startsWith('/project/')) return 'project-dashboard';
    if (suffix.startsWith('/financials/job-costs/')) return 'financials-job-cost-detail';
    if (suffix.startsWith('/financials')) return 'financials';
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
      const suffix = this.routeSuffix();
      const slug = suffix.replace('/financials/job-costs/', '').split('?')[0];
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

  onMainMenuToggle(open: unknown): void {
    const next = coerceMainMenuOpenPayload(open);
    if (next !== undefined) {
      this.navExpanded.set(next);
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
    if (this.navExpanded() && !isClickInsideSideNavChrome(event)) {
      this.navExpanded.set(false);
    }
    const target = event.target as HTMLElement;
    const insideAiPanel = !!target.closest('ai-assistant-panel') || !!target.closest('modus-utility-panel') || !!target.closest('modus-wc-utility-panel') || !!target.closest('[aria-label="AI assistant"]');
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

}
