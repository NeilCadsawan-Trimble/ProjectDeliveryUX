import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));

const SHELL_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/layout/dashboard-shell.component.ts'),
  'utf-8',
);
const PROMPT_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/components/ai-floating-prompt.component.ts'),
  'utf-8',
);
const HOST_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/components/ai-floating-prompt-host.component.ts'),
  'utf-8',
);
const APP_SRC = readFileSync(
  resolve(__dir, '../../src/app/app.ts'),
  'utf-8',
);
const PROJ_HTML = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.html'),
  'utf-8',
);
const PROJ_TS = readFileSync(
  resolve(__dir, '../../src/app/pages/project-dashboard/project-dashboard.component.ts'),
  'utf-8',
);
const HOME_TS = readFileSync(
  resolve(__dir, '../../src/app/pages/home-page/home-page.component.ts'),
  'utf-8',
);
const PROJECTS_HTML = readFileSync(
  resolve(__dir, '../../src/app/pages/projects-page/projects-page.component.html'),
  'utf-8',
);
const PAGE_CONTEXT_SVC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/ai-page-context.service.ts'),
  'utf-8',
);
const CONTROLLER_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/services/ai-panel-controller.ts'),
  'utf-8',
);
const STYLES_SRC = readFileSync(
  resolve(__dir, '../../src/styles.css'),
  'utf-8',
);

describe('Modus AI Floating Prompt (shell wiring)', () => {
  describe('App root host', () => {
    it('app root mounts <ai-floating-prompt-host> universally (above the router-outlet level)', () => {
      expect(APP_SRC).toContain('<ai-floating-prompt-host');
    });

    it('app root defers the AI host so its dependency graph stays out of the eager bundle', () => {
      expect(APP_SRC).toMatch(/@defer\s*\([^)]*\)\s*\{[\s\S]*?<ai-floating-prompt-host/);
    });

    it('host injects the universal AiPanelController singleton and mounts the prompt', () => {
      expect(HOST_SRC).toContain('<ai-floating-prompt');
      expect(HOST_SRC).toMatch(/inject\(AiPanelController\)/);
    });

    it('host suppresses the prompt on auth / persona-select routes (no shell context)', () => {
      expect(HOST_SRC).toMatch(/url\.startsWith\(['"]\/login['"]\)/);
      expect(HOST_SRC).toMatch(/url\.startsWith\(['"]\/auth\/['"]\)/);
      expect(HOST_SRC).toMatch(/url\.startsWith\(['"]\/select['"]\)/);
    });
  });

  describe('Old AI surfaces are gone', () => {
    it('shell template no longer mounts <ai-spotlight-input>', () => {
      expect(SHELL_SRC).not.toContain('<ai-spotlight-input');
    });

    it('shell template no longer mounts <ai-assistant-modal>', () => {
      expect(SHELL_SRC).not.toContain('<ai-assistant-modal');
    });

    it('shell template no longer mounts <ai-assistant-panel>', () => {
      expect(SHELL_SRC).not.toContain('<ai-assistant-panel');
    });

    it('shell template no longer wires the old slide-in trigger (ai.toggle())', () => {
      expect(SHELL_SRC).not.toContain('ai.toggle()');
    });

    it('shell template no longer renders a mobile AI assistant button (floating prompt serves mobile too)', () => {
      expect(SHELL_SRC).not.toMatch(/aria-label="AI assistant"/);
    });

    it('the deleted spotlight component is gone', () => {
      expect(existsSync(resolve(__dir, '../../src/app/shell/components/ai-spotlight-input.component.ts'))).toBe(false);
    });

    it('the deleted assistant modal component is gone', () => {
      expect(existsSync(resolve(__dir, '../../src/app/shell/components/ai-assistant-modal.component.ts'))).toBe(false);
    });

    it('the deleted assistant host component is gone', () => {
      expect(existsSync(resolve(__dir, '../../src/app/shell/components/ai-assistant-host.component.ts'))).toBe(false);
    });

    it('the deleted utility panel component is gone', () => {
      expect(existsSync(resolve(__dir, '../../src/app/components/modus-utility-panel.component.ts'))).toBe(false);
    });
  });

  describe('Project Dashboard unification', () => {
    it('project-dashboard template no longer mounts <ai-spotlight-input>', () => {
      expect(PROJ_HTML).not.toContain('<ai-spotlight-input');
    });

    it('project-dashboard template no longer mounts <ai-assistant-panel>', () => {
      expect(PROJ_HTML).not.toContain('<ai-assistant-panel');
    });

    it('project-dashboard template no longer renders the AI icon nav button', () => {
      expect(PROJ_HTML).not.toContain('aria-label="AI assistant"');
      expect(PROJ_HTML).not.toContain('ai.toggle()');
    });

    it('project-dashboard no longer instantiates a local AiPanelController', () => {
      expect(PROJ_TS).not.toContain('new AiPanelController(');
    });

    it('project-dashboard no longer imports AiSpotlightInputComponent', () => {
      expect(PROJ_TS).not.toContain('AiSpotlightInputComponent');
    });

    it('project-dashboard registers project context with AiPageContextService', () => {
      expect(PROJ_TS).toContain('AiPageContextService');
      expect(PROJ_TS).toContain('aiPageContext.register(');
      expect(PROJ_TS).toContain('aiPageContext.clear()');
    });
  });

  describe('Create button stays exactly where it was (regression guard)', () => {
    it('home-page still hosts <app-create-menu-dropdown>', () => {
      expect(HOME_TS).toContain('<app-create-menu-dropdown');
    });

    it('projects-page still hosts <app-create-menu-dropdown>', () => {
      expect(PROJECTS_HTML).toContain('<app-create-menu-dropdown');
    });

    it('shell does NOT host <app-create-menu-dropdown> (Create stays on page heroes)', () => {
      expect(SHELL_SRC).not.toContain('<app-create-menu-dropdown');
    });
  });

  describe('Floating prompt structure', () => {
    it('component renders a fixed bottom-anchored container with the .ai-floating-prompt class', () => {
      expect(PROMPT_SRC).toMatch(/class="ai-floating-prompt"/);
    });

    it('component renders the chip row when there are no messages', () => {
      expect(PROMPT_SRC).toContain('ai-floating-prompt-chips');
      expect(PROMPT_SRC).toContain('controller().suggestions()');
    });

    it('suggestion chips render as <modus-wc-chip> (the real Modus web component)', () => {
      // The Modus floating-prompt pattern uses `ModusWcChip` for chip rows.
      // Earlier revisions used custom <div class="ai-floating-prompt-chip">
      // markup which never matched the Modus visual; lock the upgrade in.
      expect(PROMPT_SRC).toContain('<modus-wc-chip');
      expect(PROMPT_SRC).toContain('ModusWcChip');
      expect(PROMPT_SRC).toContain('(chipClick)');
      // Modus chip API: shape="circle" produces the fully-rounded pill seen
      // in the floating-prompt pattern; "rectangle" is only slightly rounded
      // and looks like a flat slab.
      expect(PROMPT_SRC).toMatch(/shape="circle"/);
      // Modus pattern preview uses filled chips (solid surface, high
      // contrast text) — outline chips render as low-contrast hairlines
      // and don't match the reference.
      expect(PROMPT_SRC).toMatch(/variant="filled"/);
    });

    it('chip row implements the Modus primary/overflow split with a +N chip', () => {
      // Component owns the split logic.
      expect(PROMPT_SRC).toContain('MAX_PRIMARY_CHIPS');
      expect(PROMPT_SRC).toContain('chipsExpanded');
      expect(PROMPT_SRC).toContain('visibleSuggestions');
      expect(PROMPT_SRC).toContain('overflowSuggestionCount');
      // Template renders a +N overflow chip (with the running count) and a
      // Less collapse chip when expanded — both using the same Modus chip
      // styling as the primary chips so they read as one row.
      expect(PROMPT_SRC).toContain("'+' + overflowSuggestionCount()");
      expect(PROMPT_SRC).toMatch(/label="Less"/);
    });

    it('component exposes the response card when messages, thinking, or panelOpen', () => {
      expect(PROMPT_SRC).toContain('showResponseCard');
      expect(PROMPT_SRC).toContain('controller().messages()');
      expect(PROMPT_SRC).toContain('controller().thinking()');
      expect(PROMPT_SRC).toMatch(/(controller\(\)|\bc)\.panelOpen\(\)/);
    });

    it('component renders a textarea composer two-way bound to controller.inputText', () => {
      expect(PROMPT_SRC).toContain('<textarea');
      expect(PROMPT_SRC).toContain('controller().inputText()');
      expect(PROMPT_SRC).toContain('controller().inputText.set');
    });

    it('composer sends on Enter and inserts a newline on Shift+Enter', () => {
      expect(PROMPT_SRC).toContain('onComposerKeydown');
      expect(PROMPT_SRC).toMatch(/event\.key\s*===\s*'Enter'/);
      expect(PROMPT_SRC).toMatch(/!event\.shiftKey/);
    });

    it('component preserves the conversation surface (messages, thinking dots)', () => {
      expect(PROMPT_SRC).toContain('controller().messages()');
      expect(PROMPT_SRC).toContain('controller().thinking()');
      expect(PROMPT_SRC).toContain('animate-bounce');
    });

    it('component preserves pendingAction confirm/cancel and choice gates', () => {
      expect(PROMPT_SRC).toContain('controller().confirmAction(msg.id)');
      expect(PROMPT_SRC).toContain('controller().cancelAction(msg.id)');
      expect(PROMPT_SRC).toContain('controller().chooseNavigation(msg.id)');
      expect(PROMPT_SRC).toContain('controller().chooseCanvasOverlay(msg.id)');
    });

    it('Send button calls send() (not openAndSend) and is disabled without text', () => {
      expect(PROMPT_SRC).toContain('onSendClick');
      expect(PROMPT_SRC).toMatch(/canSend\s*=\s*computed/);
    });
  });

  describe('Stop affordance during streaming', () => {
    it('component renders a Stop button while controller is thinking', () => {
      expect(PROMPT_SRC).toMatch(/aria-label="Stop generating response"/);
      expect(PROMPT_SRC).toContain('onStopClick');
      expect(PROMPT_SRC).toContain('controller().stop()');
    });

    it('AiPanelController exposes stop() to cancel the streaming subscription', () => {
      expect(CONTROLLER_SRC).toMatch(/stop\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/streamSub\?\.unsubscribe\(\)/);
      expect(CONTROLLER_SRC).toMatch(/this\.thinking\.set\(false\)/);
    });
  });

  describe('Sources menu (Modus pattern affordance)', () => {
    it('component exposes a Sources trigger that opens a menu', () => {
      expect(PROMPT_SRC).toMatch(/aria-label="Add source"/);
      expect(PROMPT_SRC).toContain('toggleSources');
      expect(PROMPT_SRC).toContain('aria-label="Sources"');
    });

    it('Sources menu lists the documented placeholder items', () => {
      expect(PROMPT_SRC).toContain('Attach URL');
      expect(PROMPT_SRC).toContain('Upload file from computer');
      expect(PROMPT_SRC).toContain('Add project document');
      expect(PROMPT_SRC).toContain('Browse Trimble Connect');
    });
  });

  describe('Tools menu (Modus pattern affordance)', () => {
    it('component exposes a Tools trigger that opens a menu', () => {
      expect(PROMPT_SRC).toMatch(/aria-label="Tools"/);
      expect(PROMPT_SRC).toContain('toggleTools');
    });

    it('Tools menu lists the documented placeholder items', () => {
      expect(PROMPT_SRC).toContain('Trimble Connect');
      expect(PROMPT_SRC).toContain('Field & machine data');
      expect(PROMPT_SRC).toContain('Model coordination');
      expect(PROMPT_SRC).toContain('Geospatial & mapping');
      expect(PROMPT_SRC).toContain('Quantities & takeoff');
      expect(PROMPT_SRC).toContain('Clash & issues');
    });
  });

  describe('Bottom padding strategy', () => {
    it('--ai-floating-prompt-height is defined on :root', () => {
      expect(STYLES_SRC).toMatch(/--ai-floating-prompt-height\s*:\s*72px/);
    });

    it('shell canvas main applies the floating-prompt bottom padding utility', () => {
      expect(SHELL_SRC).toMatch(/canvas-content[^"]*pb-\[calc\(var\(--ai-floating-prompt-height\)\+2rem\+24px\)\]/);
    });

    it('shell desktop main applies the floating-prompt bottom padding utility', () => {
      expect(SHELL_SRC).toMatch(/flex-1 overflow-auto bg-background[^"]*pb-\[calc\(var\(--ai-floating-prompt-height\)\+2rem\+24px\)\]/);
    });

    it('project-dashboard canvas main applies the floating-prompt bottom padding utility', () => {
      expect(PROJ_HTML).toMatch(/canvas-content[^"]*pb-\[calc\(var\(--ai-floating-prompt-height\)\+2rem\+24px\)\]/);
    });

    it('project-dashboard desktop main applies the floating-prompt bottom padding utility', () => {
      expect(PROJ_HTML).toMatch(/flex-1 overflow-auto bg-background[^"]*pb-\[calc\(var\(--ai-floating-prompt-height\)\+2rem\+24px\)\]/);
    });
  });

  describe('Floating prompt styles', () => {
    it('.ai-floating-prompt is bottom-anchored and centered', () => {
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt\s*\{[\s\S]*?position:\s*fixed/);
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt\s*\{[\s\S]*?bottom:/);
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt\s*\{[\s\S]*?translateX\(-50%\)/);
    });

    it('response card has a slide-up enter animation', () => {
      expect(STYLES_SRC).toContain('@keyframes ai-floating-prompt-card-in');
      expect(STYLES_SRC).toContain('.ai-floating-prompt-card-enter');
    });

    it('legacy slide-down panel and spotlight pill styles are removed', () => {
      expect(STYLES_SRC).not.toContain('.ai-panel-card');
      expect(STYLES_SRC).not.toContain('@keyframes ai-panel-card-in');
      expect(STYLES_SRC).not.toContain('.ai-spotlight-host');
      expect(STYLES_SRC).not.toContain('.ai-modal-scrim');
      expect(STYLES_SRC).not.toContain('.ai-modal-card');
    });
  });

  describe('AiPanelController API parity', () => {
    it('exposes openModal(), openAndSend(), close(), and stop()', () => {
      expect(CONTROLLER_SRC).toMatch(/openModal\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/openAndSend\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/close\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/stop\(\)\s*:\s*void\s*\{/);
    });

    it('is a root-provided singleton', () => {
      expect(CONTROLLER_SRC).toMatch(/@Injectable\(\s*\{\s*providedIn:\s*'root'\s*\}\s*\)/);
    });

    it('exposes a welcomeText signal so the prompt can render it without page-specific bindings', () => {
      expect(CONTROLLER_SRC).toMatch(/welcomeText\s*:\s*Signal<string>/);
    });
  });

  describe('AiPageContextService', () => {
    it('exposes register() / clear() for pages to contribute context', () => {
      expect(PAGE_CONTEXT_SVC).toMatch(/register\(\s*reg:\s*AiPageContextRegistration\s*\)/);
      expect(PAGE_CONTEXT_SVC).toMatch(/clear\(\)\s*:\s*void\s*\{/);
    });

    it('AiPanelController consults AiPageContextService before falling back to defaults', () => {
      expect(CONTROLLER_SRC).toContain('aiPageContext.contextProvider()');
      expect(CONTROLLER_SRC).toContain('aiPageContext.actionsProvider()');
      expect(CONTROLLER_SRC).toContain('aiPageContext.suggestionsProvider()');
    });
  });

  describe('Three-phase structure (Modus React reference)', () => {
    it('component derives a `phase` signal with default / working / review values', () => {
      expect(PROMPT_SRC).toMatch(/phase\s*=\s*computed</);
      expect(PROMPT_SRC).toContain("'default'");
      expect(PROMPT_SRC).toContain("'working'");
      expect(PROMPT_SRC).toContain("'review'");
    });

    it("template gates each phase with @if / @else if (phase() === '...')", () => {
      expect(PROMPT_SRC).toMatch(/phase\(\)\s*===\s*'default'/);
      expect(PROMPT_SRC).toMatch(/phase\(\)\s*===\s*'working'/);
      expect(PROMPT_SRC).toMatch(/phase\(\)\s*===\s*'review'/);
    });

    it('working phase renders the progress ring + Thinking label + thinking dots', () => {
      expect(PROMPT_SRC).toContain('ai-floating-prompt-progress-ring');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-thinking-label');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-thinking-dots');
      // three dots, each as its own div in the working pill template
      expect(PROMPT_SRC.match(/ai-floating-prompt-thinking-dots-dot/g)?.length ?? 0)
        .toBeGreaterThanOrEqual(3);
      expect(PROMPT_SRC).toContain('Thinking');
    });

    it('review phase header exposes feedback + drawer-toggle toolbar buttons', () => {
      expect(PROMPT_SRC).toMatch(/aria-label="Helpful"/);
      expect(PROMPT_SRC).toMatch(/aria-label="Not helpful"/);
      expect(PROMPT_SRC).toMatch(/aria-label="Open Trimble Assistant"/);
      expect(PROMPT_SRC).toContain('toggleDrawer');
    });

    it('review phase reuses the same pill template for the embedded follow-up composer', () => {
      expect(PROMPT_SRC).toContain('ai-floating-prompt-card-composer');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-bar--embedded');
      expect(PROMPT_SRC).toMatch(/ngTemplateOutlet/);
    });
  });

  describe('Sources dropdown (state + actions)', () => {
    it('component owns an attachedSources signal seeded empty', () => {
      expect(PROMPT_SRC).toMatch(/attachedSources\s*=\s*signal<readonly FloatingPromptSource\[\]>\(\[\]\)/);
    });

    it('Sources actions cover the four React reference kinds', () => {
      expect(PROMPT_SRC).toMatch(/kind:\s*'link'/);
      expect(PROMPT_SRC).toMatch(/kind:\s*'file'/);
      expect(PROMPT_SRC).toMatch(/kind:\s*'doc'/);
      expect(PROMPT_SRC).toMatch(/kind:\s*'connect'/);
    });

    it('addSource appends a placeholder row per kind', () => {
      expect(PROMPT_SRC).toMatch(/addSource\(\s*kind:\s*SourceKind\s*\)/);
      expect(PROMPT_SRC).toContain('Upload_sketch_001.jpg');
      expect(PROMPT_SRC).toContain('RFP_Section_04_revB.docx');
      expect(PROMPT_SRC).toContain('Issue #1284');
      expect(PROMPT_SRC).toContain('Trimble Connect · Shared folder');
    });

    it('removeSource filters by id', () => {
      expect(PROMPT_SRC).toMatch(/removeSource\(\s*id:\s*string\s*\)/);
      expect(PROMPT_SRC).toContain('aria-label="Remove source"');
    });

    it('Sources trigger swaps between paperclip+count and add icon', () => {
      expect(PROMPT_SRC).toContain('attachedSources().length > 0');
      expect(PROMPT_SRC).toContain('paperclip');
      expect(PROMPT_SRC).toContain('expand_more');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-source-count');
    });
  });

  describe('Tools dropdown (TRIMBLE_CONTEXT_TOOLS verbatim)', () => {
    it('Tools menu uses the tune trigger icon (matches Modus pattern)', () => {
      expect(PROMPT_SRC).toMatch(/aria-hidden="true">tune</);
    });

    it('Tools catalog sublabels match the Modus reference verbatim', () => {
      expect(PROMPT_SRC).toContain('Projects, files, and updates');
      expect(PROMPT_SRC).toContain('Layout files, control points, or GNSS');
      expect(PROMPT_SRC).toContain('Tekla, BIM, and clash context');
      expect(PROMPT_SRC).toContain('Surfaces, imagery, and boundaries');
      expect(PROMPT_SRC).toContain('Length, area, and counts');
      expect(PROMPT_SRC).toContain('Multi-trade review helpers');
    });

    it('Tools menu uses <modus-logo emblem> for the Connect entry', () => {
      expect(PROMPT_SRC).toMatch(/<modus-logo\s+name="connect"\s+\[emblem\]="true"/);
    });
  });

  describe('Trimble Assistant drawer', () => {
    it('component owns a drawerOpen signal and toggle/close methods', () => {
      expect(PROMPT_SRC).toMatch(/drawerOpen\s*=\s*signal\(false\)/);
      expect(PROMPT_SRC).toContain('toggleDrawer');
      expect(PROMPT_SRC).toContain('closeDrawer');
    });

    it('drawer markup is gated by `@if (drawerOpen())`', () => {
      expect(PROMPT_SRC).toMatch(/@if\s*\(\s*drawerOpen\(\)\s*\)/);
      expect(PROMPT_SRC).toContain('ai-floating-prompt-drawer-portal');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-drawer-dismiss');
      expect(PROMPT_SRC).toContain('ai-floating-prompt-drawer');
    });

    it('drawer renders the same controller messages (shared conversation, not a sub-context)', () => {
      // messages binding appears at least three times: review card, drawer messages list, plus iteration tracks
      expect(PROMPT_SRC.match(/controller\(\)\.messages\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
      expect(PROMPT_SRC).toContain('aria-label="Trimble Assistant messages"');
    });

    it('drawer composer reuses the same pill template (embedded variant)', () => {
      expect(PROMPT_SRC).toContain('ai-floating-prompt-drawer-composer');
      // pillTpl is invoked at least three times: default, card composer, drawer composer
      expect(PROMPT_SRC.match(/ngTemplateOutlet/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    });

    it('Escape closes the drawer first, then the menus', () => {
      expect(PROMPT_SRC).toMatch(/onEscape\(\)/);
      expect(PROMPT_SRC).toMatch(/this\.drawerOpen\.set\(false\)/);
    });
  });

  describe('Animation + drawer styles', () => {
    it('progress-ring conic gradient + rotate keyframe land in styles.css', () => {
      expect(STYLES_SRC).toContain('@keyframes ai-floating-prompt-progress-ring-rotate');
      expect(STYLES_SRC).toContain('.ai-floating-prompt-progress-ring');
      expect(STYLES_SRC).toMatch(/conic-gradient\(\s*from 0deg/);
    });

    it('thinking-label color pulse + thinking-dot opacity wave keyframes are defined', () => {
      expect(STYLES_SRC).toContain('@keyframes ai-floating-prompt-thinking-dot');
      expect(STYLES_SRC).toContain('@keyframes ai-floating-prompt-thinking-label-color');
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-thinking-dots-dot:nth-child\(2\)\s*\{\s*animation-delay:\s*0\.18s/);
    });

    it('pill modifiers (--working, --embedded) and drawer-in keyframe are defined', () => {
      expect(STYLES_SRC).toContain('.ai-floating-prompt-bar--working');
      expect(STYLES_SRC).toContain('.ai-floating-prompt-bar--embedded');
      expect(STYLES_SRC).toContain('@keyframes ai-floating-prompt-drawer-in');
    });

    it('drawer surface uses the page-tracking surface variable + primary edge', () => {
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-drawer\s*\{[\s\S]*?background:\s*var\(--ai-floating-prompt-surface\)/);
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-drawer-dismiss[\s\S]*?color-mix\(in srgb,\s*var\(--foreground\)/);
    });

    it('reduced-motion users get no progress-ring rotation or dot wave', () => {
      expect(STYLES_SRC).toMatch(/prefers-reduced-motion[\s\S]*?\.ai-floating-prompt-progress-ring[\s\S]*?animation:\s*none/);
      expect(STYLES_SRC).toMatch(/prefers-reduced-motion[\s\S]*?\.ai-floating-prompt-thinking-dots-dot[\s\S]*?animation:\s*none/);
    });
  });
});
