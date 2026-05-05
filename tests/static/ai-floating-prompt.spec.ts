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
const PILL_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/components/ai-composer-pill.component.ts'),
  'utf-8',
);
const PANEL_SRC = readFileSync(
  resolve(__dir, '../../src/app/shell/components/ai-assistant-panel.component.ts'),
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
const FIN_TS = readFileSync(
  resolve(__dir, '../../src/app/pages/financials-page/financials-page.component.ts'),
  'utf-8',
);
const PROJECT_AGENTS_TS = readFileSync(
  resolve(__dir, '../../src/app/data/widget-agents/project-agents.ts'),
  'utf-8',
);
const AGENTS_INDEX_TS = readFileSync(
  resolve(__dir, '../../src/app/data/widget-agents/index.ts'),
  'utf-8',
);
const SHARED_AGENT_TS = readFileSync(
  resolve(__dir, '../../src/app/data/widget-agents/shared.ts'),
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
const PERSONA_TOOL_CONTEXTS_SRC = readFileSync(
  resolve(__dir, '../../src/app/data/persona-tool-contexts.ts'),
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

    it('shell template mounts <ai-assistant-panel> (drawer lives at the dashboard shell level, not nested in the floating prompt)', () => {
      expect(SHELL_SRC).toContain('<ai-assistant-panel');
      // Imported as a standalone component, not eagerly imported elsewhere.
      expect(SHELL_SRC).toContain('AiAssistantPanelComponent');
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

    it('floating prompt no longer renders the drawer markup (lives in <ai-assistant-panel> now)', () => {
      expect(PROMPT_SRC).not.toContain('ai-floating-prompt-drawer-portal');
      expect(PROMPT_SRC).not.toContain('ai-floating-prompt-drawer-dismiss');
      expect(PROMPT_SRC).not.toContain('aria-label="Trimble Assistant messages"');
      expect(PROMPT_SRC).not.toContain('ngTemplateOutlet');
    });

    it('floating prompt no longer owns drawerOpen state (lives on AiPanelController)', () => {
      expect(PROMPT_SRC).not.toMatch(/drawerOpen\s*=\s*signal\(false\)/);
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

  describe('Financials page AI context wiring', () => {
    it('financials-page registers context with AiPageContextService', () => {
      expect(FIN_TS).toContain('AiPageContextService');
      expect(FIN_TS).toContain('aiPageContext.register(');
      expect(FIN_TS).toContain('aiPageContext.clear()');
    });

    it('financials-page wires resolution maps for tile, sub-page, and detail entity', () => {
      expect(FIN_TS).toContain('FIN_TILE_AGENT_MAP');
      expect(FIN_TS).toContain('FIN_SUBPAGE_AGENT_MAP');
      expect(FIN_TS).toContain('FIN_DETAIL_AGENT_MAP');
    });

    it('financials-page exposes contextProvider, localResponder, and contextKey', () => {
      expect(FIN_TS).toContain('buildPageAiContext');
      expect(FIN_TS).toContain('respondToFinancialsQuery');
      expect(FIN_TS).toContain('aiContextKey');
      expect(FIN_TS).toContain('buildFinancialsAgentState');
    });
  });

  describe('Detail-entity agent wiring', () => {
    it('AgentDataState declares every detail-entity field', () => {
      expect(SHARED_AGENT_TS).toContain('detailDailyReport?: DailyReport');
      expect(SHARED_AGENT_TS).toContain('detailInspection?: Inspection');
      expect(SHARED_AGENT_TS).toContain('detailPunchItem?: PunchListItem');
      expect(SHARED_AGENT_TS).toContain('detailChangeOrder?: ChangeOrder');
      expect(SHARED_AGENT_TS).toContain('detailContract?: Contract');
      expect(SHARED_AGENT_TS).toContain('detailPanorama?: SiteCapture');
    });

    it('detail agents reference their specific entity in state', () => {
      expect(PROJECT_AGENTS_TS).toContain('s.detailDailyReport');
      expect(PROJECT_AGENTS_TS).toContain('s.detailInspection');
      expect(PROJECT_AGENTS_TS).toContain('s.detailPunchItem');
      expect(PROJECT_AGENTS_TS).toContain('s.detailChangeOrder');
      expect(PROJECT_AGENTS_TS).toContain('s.detailContract');
      expect(PROJECT_AGENTS_TS).toContain('s.detailPanorama');
    });

    it('panoramaDetail agent is exported and registered in ALL_AGENTS', () => {
      expect(PROJECT_AGENTS_TS).toContain('export const panoramaDetail');
      expect(AGENTS_INDEX_TS).toContain('panoramaDetail');
    });

    it('project-dashboard populates detail-entity state fields', () => {
      expect(PROJ_TS).toContain('detailDailyReport: this.detailDailyReport()');
      expect(PROJ_TS).toContain('detailInspection: this.detailInspection()');
      expect(PROJ_TS).toContain('detailPunchItem: this.detailPunchItem()');
      expect(PROJ_TS).toContain('detailChangeOrder: this.detailChangeOrder()');
      expect(PROJ_TS).toContain('detailContract: this.detailContract()');
      expect(PROJ_TS).toContain('detailPanorama: this.detailPanorama()');
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

    it('composer pill renders a textarea two-way bound to controller.inputText', () => {
      expect(PILL_SRC).toContain('<textarea');
      expect(PILL_SRC).toContain('controller().inputText()');
      expect(PILL_SRC).toContain('controller().inputText.set');
    });

    it('composer pill sends on Enter and inserts a newline on Shift+Enter', () => {
      expect(PILL_SRC).toContain('onComposerKeydown');
      expect(PILL_SRC).toMatch(/event\.key\s*===\s*'Enter'/);
      expect(PILL_SRC).toMatch(/!event\.shiftKey/);
    });

    it('floating prompt preserves the conversation surface (messages, thinking dots)', () => {
      expect(PROMPT_SRC).toContain('controller().messages()');
      expect(PROMPT_SRC).toContain('controller().thinking()');
      expect(PROMPT_SRC).toContain('animate-bounce');
    });

    it('floating prompt preserves pendingAction confirm/cancel and choice gates', () => {
      expect(PROMPT_SRC).toContain('controller().confirmAction(msg.id)');
      expect(PROMPT_SRC).toContain('controller().cancelAction(msg.id)');
      expect(PROMPT_SRC).toContain('controller().chooseNavigation(msg.id)');
      expect(PROMPT_SRC).toContain('controller().chooseCanvasOverlay(msg.id)');
    });

    it('composer pill Send button calls send() (not openAndSend) and is disabled without text', () => {
      expect(PILL_SRC).toContain('onSendClick');
      expect(PILL_SRC).toMatch(/canSend\s*=\s*computed/);
    });

    it('floating prompt mounts <ai-composer-pill> for default phase + review-card composer', () => {
      const pillCount = PROMPT_SRC.match(/<ai-composer-pill\b/g)?.length ?? 0;
      expect(pillCount).toBe(2);
      expect(PROMPT_SRC).toContain('anchorPrefix="main"');
      expect(PROMPT_SRC).toContain('anchorPrefix="card"');
    });
  });

  describe('Stop affordance during streaming', () => {
    it('composer pill renders a Stop button while controller is thinking', () => {
      expect(PILL_SRC).toMatch(/aria-label="Stop generating response"/);
      expect(PILL_SRC).toContain('onStopClick');
      expect(PILL_SRC).toContain('controller().stop()');
    });

    it('AiPanelController exposes stop() to cancel the streaming subscription', () => {
      expect(CONTROLLER_SRC).toMatch(/stop\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/streamSub\?\.unsubscribe\(\)/);
      expect(CONTROLLER_SRC).toMatch(/this\.thinking\.set\(false\)/);
    });
  });

  describe('Sources menu (Modus pattern affordance)', () => {
    it('composer pill exposes a Sources trigger that opens a menu', () => {
      expect(PILL_SRC).toMatch(/aria-label="Add source"/);
      expect(PILL_SRC).toContain('toggleSources');
      expect(PILL_SRC).toContain('aria-label="Sources"');
    });

    it('Sources menu lists the documented placeholder items', () => {
      expect(PILL_SRC).toContain('Attach URL');
      expect(PILL_SRC).toContain('Upload file from computer');
      expect(PILL_SRC).toContain('Add project document');
      expect(PILL_SRC).toContain('Browse Trimble Connect');
    });
  });

  describe('Tools menu (Modus pattern affordance)', () => {
    it('composer pill exposes a Tools trigger that opens a menu', () => {
      expect(PILL_SRC).toMatch(/aria-label="Tools"/);
      expect(PILL_SRC).toContain('toggleTools');
    });

    it('Tools menu sources its items from the persona-keyed catalog', () => {
      // Labels live in the data file, not the template, so the pill should
      // not hard-code them. The template just iterates `toolsItems()`.
      expect(PILL_SRC).toMatch(/PERSONA_TOOL_CONTEXTS/);
      expect(PILL_SRC).toMatch(/toolsItems\s*=\s*computed/);
      expect(PILL_SRC).toMatch(/@for\s*\(item of toolsItems\(\); track item\.id\)/);
    });

    it('catalog covers the canonical Trimble field labels somewhere across personas', () => {
      // These labels are part of the Modus reference flow; they must still
      // appear at least once in the persona catalog (Dominique/Pamela).
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Trimble Connect');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Field & machine data');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Model coordination');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Geospatial & mapping');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Quantities & takeoff');
    });
  });

  describe('Bottom padding strategy', () => {
    it('--ai-floating-prompt-height is defined on :root', () => {
      expect(STYLES_SRC).toMatch(/--ai-floating-prompt-height\s*:\s*56px/);
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

    it('review phase header exposes feedback + drawer-toggle toolbar buttons that flip the controller drawer', () => {
      expect(PROMPT_SRC).toMatch(/aria-label="Helpful"/);
      expect(PROMPT_SRC).toMatch(/aria-label="Not helpful"/);
      expect(PROMPT_SRC).toMatch(/aria-label="Open Trimble Assistant"/);
      expect(PROMPT_SRC).toContain('toggleDrawer');
      // toggleDrawer() delegates to the shared controller signal so the
      // shell-mounted panel and the toolbar button stay in sync.
      expect(PROMPT_SRC).toContain('controller().toggleDrawer()');
      expect(PROMPT_SRC).toContain('controller().drawerOpen()');
    });

    it('review phase mounts <ai-composer-pill> for the embedded follow-up composer', () => {
      expect(PROMPT_SRC).toContain('ai-floating-prompt-card-composer');
      expect(PROMPT_SRC).toContain('<ai-composer-pill');
      expect(PROMPT_SRC).toContain('anchorPrefix="card"');
    });

    it('drawer-open short-circuits phase to default so chips + standalone pill render while the panel is open', () => {
      // While the side drawer owns the conversation, the floating prompt
      // must drop back to its default state -- no response card, no working
      // pill -- so the user can re-engage the prompt or the page underneath.
      expect(PROMPT_SRC).toMatch(
        /phase\s*=\s*computed[\s\S]*?if\s*\(\s*c\.drawerOpen\(\)\s*\)\s*return\s*'default'/,
      );
    });

    it('floating prompt host listens for mousedown + focusin to close the drawer when open', () => {
      // Touching the composer or chip row (click or keyboard tab-in) hands
      // the conversation back to the floating prompt by closing the drawer.
      // The outer .ai-floating-prompt wrapper is pointer-events: none, so
      // these only fire on the interactive children, not the empty area.
      expect(PROMPT_SRC).toMatch(/@HostListener\(['"]mousedown['"]\)/);
      expect(PROMPT_SRC).toMatch(/@HostListener\(['"]focusin['"]\)/);
      expect(PROMPT_SRC).toMatch(
        /onFloatingPromptInteract\(\)\s*:\s*void\s*\{[\s\S]*?drawerOpen\(\)[\s\S]*?closeDrawer\(\)/,
      );
    });
  });

  describe('Sources dropdown (state + actions)', () => {
    it('composer pill owns an attachedSources signal seeded empty', () => {
      expect(PILL_SRC).toMatch(/attachedSources\s*=\s*signal<readonly FloatingPromptSource\[\]>\(\[\]\)/);
    });

    it('Sources actions cover the four React reference kinds', () => {
      expect(PILL_SRC).toMatch(/kind:\s*'link'/);
      expect(PILL_SRC).toMatch(/kind:\s*'file'/);
      expect(PILL_SRC).toMatch(/kind:\s*'doc'/);
      expect(PILL_SRC).toMatch(/kind:\s*'connect'/);
    });

    it('addSource appends a placeholder row per kind', () => {
      expect(PILL_SRC).toMatch(/addSource\(\s*kind:\s*SourceKind\s*\)/);
      expect(PILL_SRC).toContain('Upload_sketch_001.jpg');
      expect(PILL_SRC).toContain('RFP_Section_04_revB.docx');
      expect(PILL_SRC).toContain('Issue #1284');
      expect(PILL_SRC).toContain('Trimble Connect · Shared folder');
    });

    it('removeSource filters by id', () => {
      expect(PILL_SRC).toMatch(/removeSource\(\s*id:\s*string\s*\)/);
      expect(PILL_SRC).toContain('aria-label="Remove source"');
    });

    it('Sources trigger swaps between paperclip+count and add icon', () => {
      expect(PILL_SRC).toContain('attachedSources().length > 0');
      expect(PILL_SRC).toContain('paperclip');
      expect(PILL_SRC).toContain('expand_more');
      expect(PILL_SRC).toContain('ai-floating-prompt-source-count');
    });
  });

  describe('Tools dropdown (TRIMBLE_CONTEXT_TOOLS verbatim)', () => {
    it('Tools menu uses the tune trigger icon (matches Modus pattern)', () => {
      expect(PILL_SRC).toMatch(/aria-hidden="true">tune</);
    });

    it('Tools catalog sublabels still match the Modus reference for the field-facing personas', () => {
      // These descriptions belong to specific persona entries (Connect for
      // every persona, Field & GNSS for Dominique, BIM for Bert/Dominique,
      // mapping for Dominique/Pamela, takeoff for Pamela). The Clash &
      // issues / "Multi-trade review helpers" pair was dropped because no
      // persona owns it directly.
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Projects, files, and updates');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Layout files, control points, GNSS');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Tekla, BIM, and clash context');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Surfaces, imagery, and boundaries');
      expect(PERSONA_TOOL_CONTEXTS_SRC).toContain('Length, area, and counts');
    });

    it('Tools menu uses <modus-logo emblem> for the Connect entry', () => {
      expect(PILL_SRC).toMatch(/<modus-logo\s+name="connect"\s+\[emblem\]="true"/);
    });

    it('Tools menu wraps its items in a scrollable list with a max-height cap', () => {
      // The persona catalogs can run 7-10 entries; the menu must scroll
      // without growing past the viewport (header + caption stay above
      // the scroll region so they read as a fixed panel header).
      expect(PILL_SRC).toContain('ai-floating-prompt-menu-list');
      expect(STYLES_SRC).toMatch(
        /\.ai-floating-prompt-menu-list\s*\{[\s\S]*?max-height:\s*min\([^)]*\)/,
      );
      expect(STYLES_SRC).toMatch(
        /\.ai-floating-prompt-menu-list\s*\{[\s\S]*?overflow-y:\s*auto/,
      );
    });
  });

  describe('Trimble Assistant drawer (lives at the dashboard shell level)', () => {
    it('AiPanelController owns the shared drawerOpen signal + toggle/open/close methods', () => {
      expect(CONTROLLER_SRC).toMatch(/drawerOpen\s*=\s*signal\(false\)/);
      expect(CONTROLLER_SRC).toMatch(/toggleDrawer\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/openDrawer\(\)\s*:\s*void\s*\{/);
      expect(CONTROLLER_SRC).toMatch(/closeDrawer\(\)\s*:\s*void\s*\{/);
    });

    it('panel component reads controller.drawerOpen and renders the drawer markup', () => {
      expect(PANEL_SRC).toMatch(/@if\s*\(\s*controller\.drawerOpen\(\)\s*\)/);
      expect(PANEL_SRC).toContain('ai-floating-prompt-drawer-portal');
      expect(PANEL_SRC).toContain('ai-floating-prompt-drawer');
    });

    it('panel is non-modal: no full-viewport dismiss scrim, aria-modal="false"', () => {
      // The drawer must coexist with widgets and the floating prompt; a
      // click-capturing scrim would block interaction with the rest of the
      // app. Dismissal is handled by the X button, Escape, or the floating
      // prompt's host listener (see drawer-open + floating-prompt tests).
      expect(PANEL_SRC).not.toContain('ai-floating-prompt-drawer-dismiss');
      expect(PANEL_SRC).toContain('aria-modal="false"');
    });

    it('panel renders the same controller messages (shared conversation, not a sub-context)', () => {
      expect(PANEL_SRC).toContain('controller.messages()');
      expect(PANEL_SRC).toContain('controller.thinking()');
      expect(PANEL_SRC).toContain('aria-label="Trimble Assistant messages"');
    });

    it('panel composer mounts <ai-composer-pill> with the drawer anchor prefix', () => {
      expect(PANEL_SRC).toContain('ai-floating-prompt-drawer-composer');
      expect(PANEL_SRC).toContain('<ai-composer-pill');
      expect(PANEL_SRC).toContain('anchorPrefix="drawer"');
    });

    it('panel header binds to controller.title() so widget/page context changes update the H3', () => {
      // Same dynamic title source the floating prompt textarea uses
      // (widgetFocusService.aiAssistantTitle via AiPanelController.title).
      // When a widget is selected or the route changes, the visible heading
      // tracks the agent context instead of the static "Trimble Assistant".
      expect(PANEL_SRC).toMatch(
        /<modus-typography\s+hierarchy="h3"[\s\S]*?>\s*\{\{\s*controller\.title\(\)\s*\}\}/,
      );
    });

    it('panel Escape handler closes the drawer through the controller', () => {
      expect(PANEL_SRC).toMatch(/document:keydown\.escape/);
      expect(PANEL_SRC).toContain('controller.closeDrawer()');
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
    });

    it('drawer portal does not capture clicks: pointer-events: none on portal, auto on drawer', () => {
      // Non-modal contract: portal lets clicks fall through to widgets and
      // the floating prompt; only the drawer panel itself catches events.
      // The dismiss-scrim rule must not exist anymore.
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-drawer-portal\s*\{[\s\S]*?pointer-events:\s*none/);
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-drawer\s*\{[\s\S]*?pointer-events:\s*auto/);
      expect(STYLES_SRC).not.toContain('.ai-floating-prompt-drawer-dismiss');
    });

    it('reduced-motion users get no progress-ring rotation or dot wave', () => {
      expect(STYLES_SRC).toMatch(/prefers-reduced-motion[\s\S]*?\.ai-floating-prompt-progress-ring[\s\S]*?animation:\s*none/);
      expect(STYLES_SRC).toMatch(/prefers-reduced-motion[\s\S]*?\.ai-floating-prompt-thinking-dots-dot[\s\S]*?animation:\s*none/);
    });
  });

  describe('Voice input wiring (Deepgram)', () => {
    it('composer pill imports VoiceInputService and injects it as a public field', () => {
      expect(PILL_SRC).toContain("import { VoiceInputService } from '../../services/voice-input.service';");
      expect(PILL_SRC).toMatch(/readonly voice\s*=\s*inject\(VoiceInputService\)/);
    });

    it('composer pill no longer calls the placeholder simulateListening()', () => {
      // The Web-Speech-era placeholder is gone; the mic now drives Deepgram.
      expect(PILL_SRC).not.toContain('simulateListening()');
    });

    it('mic button still preserves the Voice input aria-label (regression guard)', () => {
      expect(PILL_SRC).toMatch(/aria-label="Voice input"/);
    });

    it('mic button binds is-listening, is-connecting, and aria-pressed off the voice signals', () => {
      expect(PILL_SRC).toContain('[class.is-listening]="voice.listening()"');
      expect(PILL_SRC).toContain('[class.is-connecting]="voice.connecting()"');
      expect(PILL_SRC).toContain('[attr.aria-pressed]="voice.listening()"');
    });

    it('mic button degrades gracefully when voice is unsupported (tabindex + aria-disabled + is-disabled)', () => {
      expect(PILL_SRC).toContain('[attr.tabindex]="voice.supported() ? 0 : -1"');
      expect(PILL_SRC).toContain('[class.is-disabled]="!voice.supported()"');
      expect(PILL_SRC).toContain('[attr.aria-disabled]="!voice.supported() || null"');
    });

    it('mic button title binds to the dynamic micTooltip computed (state-aware hint)', () => {
      expect(PILL_SRC).toContain('[title]="micTooltip()"');
      expect(PILL_SRC).toMatch(/micTooltip\s*=\s*computed\(/);
      // Must surface every documented error kind so the user always knows
      // why the button is in an unusable state.
      expect(PILL_SRC).toContain("'denied'");
      expect(PILL_SRC).toContain("'token-failed'");
      expect(PILL_SRC).toContain("'network'");
      expect(PILL_SRC).toContain("'connect-failed'");
    });

    it('onMicClick toggles the voice service and pipes transcripts into controller.inputText', () => {
      // No-op when unsupported.
      expect(PILL_SRC).toMatch(/onMicClick\(\)\s*:\s*void\s*\{[\s\S]*?if\s*\(\s*!this\.voice\.supported\(\)\s*\)\s*return/);
      // Toggle: stop if already listening or connecting, otherwise start.
      expect(PILL_SRC).toMatch(/this\.voice\.listening\(\)\s*\|\|\s*this\.voice\.connecting\(\)/);
      expect(PILL_SRC).toMatch(/this\.voice\.start\(/);
      // Transcripts merge into controller.inputText.
      expect(PILL_SRC).toContain('this.controller().inputText.set(merged)');
      expect(PILL_SRC).toContain('this.dictationBaseText');
    });

    it('Send (button + Enter) and Escape stop dictation before/instead of submitting', () => {
      // onSendClick + Enter handler each call voice.stop() before send().
      expect(PILL_SRC).toMatch(/onSendClick\(\)\s*:\s*void\s*\{[\s\S]*?this\.voice\.stop\(\)/);
      expect(PILL_SRC).toMatch(/event\.key\s*===\s*'Enter'[\s\S]*?this\.voice\.stop\(\)/);
      // Escape always cancels an in-flight session, even when no menu is open.
      expect(PILL_SRC).toMatch(/onEscape\(\)[\s\S]*?this\.voice\.listening\(\)\s*\|\|\s*this\.voice\.connecting\(\)[\s\S]*?this\.voice\.stop\(\)/);
    });

    it('pill destroy releases the mic + tab-hidden hides the session', () => {
      expect(PILL_SRC).toContain('inject(DestroyRef)');
      expect(PILL_SRC).toMatch(/this\.destroyRef\.onDestroy\(\(\)\s*=>\s*this\.voice\.stop\(\)\)/);
      // visibilitychange listener stops dictation and is removed on destroy.
      expect(PILL_SRC).toContain("'visibilitychange'");
      expect(PILL_SRC).toMatch(/document\.visibilityState\s*===\s*'hidden'/);
    });

    it('an effect ends dictation when the AI controller starts thinking (no double-listening)', () => {
      // The pill registers an effect that stops dictation once the
      // assistant transitions into the thinking phase. This prevents the
      // recorder from picking up audio while the response is streaming.
      expect(PILL_SRC).toMatch(
        /effect\(\(\)\s*=>\s*\{[\s\S]*?this\.controller\(\)\.thinking\(\)[\s\S]*?this\.voice\.listening\(\)[\s\S]*?this\.voice\.stop\(\)/,
      );
    });

    it('mic icon swaps to "stop" while listening so the affordance is unambiguous', () => {
      expect(PILL_SRC).toContain("voice.listening() ? 'stop' : 'mic'");
    });

    it('CSS uses --mic-level to drive the listening pulsing-ring shadow', () => {
      // The shadow ring pulses with the live RMS level via a CSS variable
      // updated outside Angular's zone (no change detection per frame).
      expect(STYLES_SRC).toContain('.ai-floating-prompt-icon-button.is-listening::after');
      expect(STYLES_SRC).toMatch(/var\(--mic-level,\s*0\)/);
      // Listening uses the destructive (error) color; connecting uses primary.
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-icon-button\.is-listening[\s\S]*?color:\s*var\(--error\)/);
      expect(STYLES_SRC).toMatch(/\.ai-floating-prompt-icon-button\.is-connecting[\s\S]*?color:\s*var\(--primary\)/);
      // Connecting state has its own breathing keyframe.
      expect(STYLES_SRC).toContain('@keyframes ai-mic-connecting');
    });

    it('AiPanelController no longer exposes the simulateListening() placeholder', () => {
      // Orphaned after the real Deepgram path landed; static guard prevents
      // accidental resurrection.
      expect(CONTROLLER_SRC).not.toMatch(/simulateListening\s*\(/);
    });
  });
});
