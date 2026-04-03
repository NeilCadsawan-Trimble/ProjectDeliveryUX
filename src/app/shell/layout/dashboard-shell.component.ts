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
              <div class="navbar-trimble-logo flex-shrink-0 cursor-pointer" role="button" aria-label="Trimble Home" tabindex="0" (click)="navigateHome()" (keydown.enter)="navigateHome()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.68 100">
                  <path d="M115.85,87.13v-62H93V11.21h62.57v14h-23v62Z"/><path d="M141.9,87.13V32.74h16.52v8.84h.1c3-4.62,8.21-10.26,18.47-10.26h.51V46c-.61-.11-3.49-.31-4.51-.31a18.27,18.27,0,0,0-14.57,7.49v34Z"/><path d="M182.72,25V11.72h16.62V25Zm.11,62.17V32.44h16.41V87.13Z"/><path d="M205.7,87.13V32.44h16.51v8.62c3.29-4.31,9.34-9.74,18-9.74,9.13,0,13.44,3.79,15,9.74,3.28-4.2,9.44-9.74,18-9.74,11.08,0,16,7,16,16.72V87.13H272.69V52.45c0-4.92-1.13-7.49-5.95-7.49-4.1,0-7.39,2.26-11,5.44V87.13H239.25V52.45c0-4.92-1.13-7.49-6-7.49-4.1,0-7.38,2.26-11.08,5.44V87.13Z"/><path d="M312,80.66v6.47H295.45V11.21H312V40.86c3.59-5,8.72-9.54,16.82-9.54,12.42,0,21,9.54,21,28.41S341.11,88,328.59,88C321.2,88,316.07,85.28,312,80.66Zm21.34-20.82c0-9.13-3.18-14.88-10.57-14.88-4.21,0-8,2.57-10.77,5.34V70.51c3.59,3.38,6.56,5,11,5C329.82,75.53,333.31,69.79,333.31,59.84Z"/><path d="M354.94,87.13V11.21h16.41V87.13Z"/><path d="M376.47,59.84c0-21.24,16.21-28.52,27.49-28.52S429.1,37,429.1,61.79v2.46H392.88c.83,9,5.85,12.51,12.73,12.51a25.16,25.16,0,0,0,16.21-6.56l6.36,9.85c-6.36,5.44-14.26,8.21-23.8,8.21C390.11,88.26,376.47,81,376.47,59.84Zm37.86-5.34c-.82-7.69-4.31-11.39-10.47-11.39-5.13,0-9.54,3.39-10.77,11.39Z"/><path d="M432.22,81a6.19,6.19,0,0,1,6.26-6.26A6.26,6.26,0,1,1,432.22,81Zm11.38,0a5.14,5.14,0,1,0-5.12,5.23A5.12,5.12,0,0,0,443.6,81Zm-7.55-3.56h2.56c1.62,0,2.56.7,2.56,2.1a1.84,1.84,0,0,1-1.34,1.94l1.48,2.81h-1.43l-1.38-2.62h-1.08v2.62h-1.37Zm2.48,3.18c.84,0,1.3-.27,1.3-1s-.46-1-1.33-1h-1.08v2Z"/>
                  <path d="M6.19,76.41V100L26.71,88.16A39.1,39.1,0,0,1,6.19,76.41Z"/><path d="M26.56,11.74,6.19,0V23.45A39.33,39.33,0,0,1,26.56,11.74Z"/><path d="M92.8,50,72.29,38.16a39.27,39.27,0,0,1-.06,23.72Z"/><path d="M19.7,17.92c2.94-.65,9.05,0,12.28.89a18.68,18.68,0,0,1,10.37-3.45A41.12,41.12,0,0,0,19.7,17.92Z"/><path d="M58.79,60.84a53.07,53.07,0,0,0-3.21-13.13c-7,3.18-15.72,1.13-21.53-3.9A95.93,95.93,0,0,0,22.62,58.32C32.47,66.35,48.67,68.46,58.79,60.84Z"/><path d="M17.23,59.09C8.55,50.19,5.52,37.22,8.3,27.25a35,35,0,0,0,2,47.47A63.4,63.4,0,0,1,17.23,59.09Z"/><path d="M54,43.94a47.18,47.18,0,0,0-7-10.78A80.73,80.73,0,0,0,37,40.93C42.26,45.3,49.14,46.16,54,43.94Z"/><path d="M47.47,27.72a36.33,36.33,0,0,1,7.62-4.23c-5.56-5.62-14.5-5.47-18.39-3A37.17,37.17,0,0,1,47.47,27.72Z"/><path d="M20.4,62c-4.32,7.47-5.9,13-6.48,15.87A35,35,0,0,0,57.1,77a30,30,0,0,0,2-11.33C47.14,72.79,30.66,70.07,20.4,62Z"/><path d="M57.4,41.45c3.83-4,3.06-10.84.15-14.78a29.6,29.6,0,0,0-7.13,4.18A52.73,52.73,0,0,1,57.4,41.45Z"/><path d="M64,32.85a14.1,14.1,0,0,1-4.84,12.59A57.37,57.37,0,0,1,62.49,57.2C67.74,50.38,67.58,40.64,64,32.85Z"/><path d="M34.16,37.9A83.13,83.13,0,0,1,44,30.11a33.17,33.17,0,0,0-10.82-6.59C29.92,27.89,30.92,33.53,34.16,37.9Z"/><path d="M63.12,62.69a49.42,49.42,0,0,1-.43,8.88A35.37,35.37,0,0,0,70,47.07,26.82,26.82,0,0,1,63.12,62.69Z"/><path d="M29.1,22.28a28.42,28.42,0,0,0-13.9.09c-6.89,9.77-3.69,24.08,4.33,33A100.8,100.8,0,0,1,31.18,40.79C27.1,35.72,25.48,27.89,29.1,22.28Z"/>
                </svg>
              </div>
              <div class="w-px h-5 bg-foreground-20"></div>
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
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Search"
                (click)="searchInputOpen.set(!searchInputOpen())"
                (keydown.enter)="searchInputOpen.set(!searchInputOpen())"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">search</i>
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Notifications"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">notifications</i>
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Help"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">help</i>
              </div>
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
              <div class="navbar-hamburger" role="button" aria-label="Main menu" tabindex="0" (click)="navExpanded.set(!navExpanded())" (keydown.enter)="navExpanded.set(!navExpanded())">
                <i class="modus-icons text-lg" aria-hidden="true">menu</i>
              </div>
              <div class="navbar-trimble-logo flex-shrink-0 cursor-pointer" role="button" aria-label="Trimble Home" tabindex="0" (click)="navigateHome()" (keydown.enter)="navigateHome()">
                @if (isMobile()) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 732.03 788.85" class="navbar-trimble-globe">
                    <path d="M48.86,602.72V788.85l161.81-93.42A308.1,308.1,0,0,1,48.86,602.72Z"/><path d="M209.49,92.58,48.86,0V185A310.2,310.2,0,0,1,209.49,92.58Z"/><path d="M732,394.43,570.25,301a309.33,309.33,0,0,1-.48,187.08Z"/><path d="M155.4,141.39c23.23-5.16,71.39-.27,96.87,7,20.38-16.21,51.17-25.6,81.82-27.15C263.63,108.52,198.45,123.29,155.4,141.39Z"/><path d="M463.74,479.92a416.8,416.8,0,0,0-25.28-103.53c-55.43,25-124,8.88-169.86-30.79-33.41,34.15-65.75,76.68-90.16,114.49C256.15,523.44,384,540.08,463.74,479.92Z"/><path d="M135.94,466.1C67.43,396,43.55,293.61,65.49,215A276,276,0,0,0,81.65,589.43C92.86,547,113.62,503.71,135.94,466.1Z"/><path d="M425.64,346.65a372.77,372.77,0,0,0-55.49-85.1,635.36,635.36,0,0,0-78.09,61.34C333.35,357.34,387.67,364.1,425.64,346.65Z"/><path d="M374.48,218.63c17.78-12.93,42.42-26.76,60.09-33.32-43.84-44.38-114.38-43.2-145-23.94A293.6,293.6,0,0,1,374.48,218.63Z"/><path d="M160.91,488.67c-34.09,58.94-46.53,102.19-51.06,125.2a276,276,0,0,0,340.58-6.21c10.24-24.74,15.47-55.53,15.45-89.38C371.89,574.22,241.89,552.71,160.91,488.67Z"/><path d="M452.81,327c30.17-31.7,24.12-85.56,1.17-116.62-14.14,4.78-43.57,21.94-56.26,33A413.64,413.64,0,0,1,452.81,327Z"/><path d="M505,259.11c4.65,40.7-10.79,75.93-38.17,99.35A448.73,448.73,0,0,1,493,451.19C534.36,397.38,533.1,320.63,505,259.11Z"/><path d="M269.45,299a672.54,672.54,0,0,1,77.22-61.49,262,262,0,0,0-85.35-52C236.05,220,243.94,264.52,269.45,299Z"/><path d="M497.94,494.52c1.4,23.09-.72,49.29-3.42,70,47.34-60.32,63.34-135,57.75-193.22C546.6,420.33,528.65,461.35,497.94,494.52Z"/><path d="M229.55,175.76c-34.94-8.54-75.63-8.91-109.67.72-54.33,77-29.1,189.94,34.2,260.64C178.13,400.5,213,354.9,246,321.75,213.77,281.81,201,220,229.55,175.76Z"/>
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 444.68 100">
                    <path d="M115.85,87.13v-62H93V11.21h62.57v14h-23v62Z"/><path d="M141.9,87.13V32.74h16.52v8.84h.1c3-4.62,8.21-10.26,18.47-10.26h.51V46c-.61-.11-3.49-.31-4.51-.31a18.27,18.27,0,0,0-14.57,7.49v34Z"/><path d="M182.72,25V11.72h16.62V25Zm.11,62.17V32.44h16.41V87.13Z"/><path d="M205.7,87.13V32.44h16.51v8.62c3.29-4.31,9.34-9.74,18-9.74,9.13,0,13.44,3.79,15,9.74,3.28-4.2,9.44-9.74,18-9.74,11.08,0,16,7,16,16.72V87.13H272.69V52.45c0-4.92-1.13-7.49-5.95-7.49-4.1,0-7.39,2.26-11,5.44V87.13H239.25V52.45c0-4.92-1.13-7.49-6-7.49-4.1,0-7.38,2.26-11.08,5.44V87.13Z"/><path d="M312,80.66v6.47H295.45V11.21H312V40.86c3.59-5,8.72-9.54,16.82-9.54,12.42,0,21,9.54,21,28.41S341.11,88,328.59,88C321.2,88,316.07,85.28,312,80.66Zm21.34-20.82c0-9.13-3.18-14.88-10.57-14.88-4.21,0-8,2.57-10.77,5.34V70.51c3.59,3.38,6.56,5,11,5C329.82,75.53,333.31,69.79,333.31,59.84Z"/><path d="M354.94,87.13V11.21h16.41V87.13Z"/><path d="M376.47,59.84c0-21.24,16.21-28.52,27.49-28.52S429.1,37,429.1,61.79v2.46H392.88c.83,9,5.85,12.51,12.73,12.51a25.16,25.16,0,0,0,16.21-6.56l6.36,9.85c-6.36,5.44-14.26,8.21-23.8,8.21C390.11,88.26,376.47,81,376.47,59.84Zm37.86-5.34c-.82-7.69-4.31-11.39-10.47-11.39-5.13,0-9.54,3.39-10.77,11.39Z"/><path d="M432.22,81a6.19,6.19,0,0,1,6.26-6.26A6.26,6.26,0,1,1,432.22,81Zm11.38,0a5.14,5.14,0,1,0-5.12,5.23A5.12,5.12,0,0,0,443.6,81Zm-7.55-3.56h2.56c1.62,0,2.56.7,2.56,2.1a1.84,1.84,0,0,1-1.34,1.94l1.48,2.81h-1.43l-1.38-2.62h-1.08v2.62h-1.37Zm2.48,3.18c.84,0,1.3-.27,1.3-1s-.46-1-1.33-1h-1.08v2Z"/>
                    <path d="M6.19,76.41V100L26.71,88.16A39.1,39.1,0,0,1,6.19,76.41Z"/><path d="M26.56,11.74,6.19,0V23.45A39.33,39.33,0,0,1,26.56,11.74Z"/><path d="M92.8,50,72.29,38.16a39.27,39.27,0,0,1-.06,23.72Z"/><path d="M19.7,17.92c2.94-.65,9.05,0,12.28.89a18.68,18.68,0,0,1,10.37-3.45A41.12,41.12,0,0,0,19.7,17.92Z"/><path d="M58.79,60.84a53.07,53.07,0,0,0-3.21-13.13c-7,3.18-15.72,1.13-21.53-3.9A95.93,95.93,0,0,0,22.62,58.32C32.47,66.35,48.67,68.46,58.79,60.84Z"/><path d="M17.23,59.09C8.55,50.19,5.52,37.22,8.3,27.25a35,35,0,0,0,2,47.47A63.4,63.4,0,0,1,17.23,59.09Z"/><path d="M54,43.94a47.18,47.18,0,0,0-7-10.78A80.73,80.73,0,0,0,37,40.93C42.26,45.3,49.14,46.16,54,43.94Z"/><path d="M47.47,27.72a36.33,36.33,0,0,1,7.62-4.23c-5.56-5.62-14.5-5.47-18.39-3A37.17,37.17,0,0,1,47.47,27.72Z"/><path d="M20.4,62c-4.32,7.47-5.9,13-6.48,15.87A35,35,0,0,0,57.1,77a30,30,0,0,0,2-11.33C47.14,72.79,30.66,70.07,20.4,62Z"/><path d="M57.4,41.45c3.83-4,3.06-10.84.15-14.78a29.6,29.6,0,0,0-7.13,4.18A52.73,52.73,0,0,1,57.4,41.45Z"/><path d="M64,32.85a14.1,14.1,0,0,1-4.84,12.59A57.37,57.37,0,0,1,62.49,57.2C67.74,50.38,67.58,40.64,64,32.85Z"/><path d="M34.16,37.9A83.13,83.13,0,0,1,44,30.11a33.17,33.17,0,0,0-10.82-6.59C29.92,27.89,30.92,33.53,34.16,37.9Z"/><path d="M63.12,62.69a49.42,49.42,0,0,1-.43,8.88A35.37,35.37,0,0,0,70,47.07,26.82,26.82,0,0,1,63.12,62.69Z"/><path d="M29.1,22.28a28.42,28.42,0,0,0-13.9.09c-6.89,9.77-3.69,24.08,4.33,33A100.8,100.8,0,0,1,31.18,40.79C27.1,35.72,25.48,27.89,29.1,22.28Z"/>
                  </svg>
                }
              </div>
              <div class="w-px h-5 bg-foreground-20"></div>
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
            } @else {
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Search"
                (click)="searchInputOpen.set(!searchInputOpen())"
                (keydown.enter)="searchInputOpen.set(!searchInputOpen())"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">search</i>
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Notifications"
                tabindex="0"
              >
                <i class="modus-icons text-lg" aria-hidden="true">notifications</i>
              </div>
              <div
                class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer bg-card text-foreground hover:bg-muted transition-colors duration-150"
                role="button"
                aria-label="Help"
                tabindex="0"
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
      notifications: false,
      apps: false,
      help: false,
      search: false,
      searchInput: false,
    };
  });

  readonly navExpanded = signal(false);
  readonly isMobile = signal(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  readonly isCanvas = signal(typeof window !== 'undefined' ? window.innerWidth >= 1920 : false);
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
        this.reorderNavbarEnd();
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

    this.reorderNavbarEnd();
  }

  private reorderNavbarEnd(): void {
    const navbarWc = this.elementRef.nativeElement.querySelector('modus-wc-navbar');
    if (!navbarWc) return;
    let attempts = 0;
    const tryReorder = () => {
      if (++attempts > 50) return;
      const root = navbarWc.shadowRoot ?? navbarWc;
      const endDiv = root.querySelector('div[slot="end"]') as HTMLElement | null;
      if (!endDiv) { requestAnimationFrame(tryReorder); return; }
      const endSlot = endDiv.querySelector(':scope > slot[name="end"]') as HTMLElement | null;
      if (endSlot) endSlot.style.order = '1';
    };
    requestAnimationFrame(tryReorder);
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
