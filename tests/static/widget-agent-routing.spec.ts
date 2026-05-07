/**
 * Static + behavioural tests for the widget-agent out-of-scope routing system.
 *
 * Covers four surfaces that must move together to keep the feature working:
 *   1. The `route_to_general_assistant` AI tool definition and the
 *      widget-aware `getToolSchemasForContext` filter on `AiToolsService`.
 *   2. The `OUT_OF_SCOPE_INSTRUCTION` suffix appended to every widget-scoped
 *      WidgetAgent (and NOT to page-default agents).
 *   3. The `_forcedAgentId` signal on `AiPanelController`, its precedence in
 *      `resolveAgentKey`, `buildContext`, `resolveLocalResponder`, and its
 *      auto-clear effects for widget-select / route-change.
 *   4. The `route_to_general_assistant` interception in `handleToolCall`.
 *
 * If any drift, a focused widget agent will silently answer out-of-scope
 * queries with stale context (or worse, the general agent will recursively
 * re-route into a loop).
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

import { getAgent, OUT_OF_SCOPE_INSTRUCTION } from '../../src/app/data/widget-agents';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dir, '../..');

const TOOLS_SRC = readFileSync(
  resolve(root, 'src/app/services/ai-tools.service.ts'),
  'utf-8',
);
const CONTROLLER_SRC = readFileSync(
  resolve(root, 'src/app/shell/services/ai-panel-controller.ts'),
  'utf-8',
);
const SHARED_SRC = readFileSync(
  resolve(root, 'src/app/data/widget-agents/shared.ts'),
  'utf-8',
);
const INDEX_SRC = readFileSync(
  resolve(root, 'src/app/data/widget-agents/index.ts'),
  'utf-8',
);

// ── Page-default ids must NEVER receive the routing suffix ──────────────────
// They ARE the hand-off target. If they got the suffix they would re-route
// in a loop the moment the user asked anything domain-specific.
const PAGE_DEFAULT_AGENT_IDS = [
  'homeDefault',
  'projectsDefault',
  'financialsDefault',
  'projectDefault',
  'financialsJobCostDetail',
] as const;

// A representative spread of widget-scoped agents across the four pages.
// Each MUST carry OUT_OF_SCOPE_INSTRUCTION after `getAgent` resolves it.
const WIDGET_SCOPED_AGENT_IDS = [
  'homeRfis',
  'homeSubmittals',
  'homeCalendar',
  'homeTimeOff',
  'homeWeather',
  'homeUrgentNeeds',
  'recordsRfis',
  'recordsSubmittals',
  'recordsInspections',
  'rfiDetail',
  'submittalDetail',
  'milestones',
  'tasks',
  'risks',
  'team',
  'budget',
  'financialsBudget',
  'financialsChangeOrders',
  'financialsContracts',
  'openEstimates',
  'needsAttention',
] as const;

describe('Widget agent out-of-scope routing', () => {
  describe('OUT_OF_SCOPE_INSTRUCTION constant', () => {
    it('is exported from the widget-agents barrel', () => {
      expect(OUT_OF_SCOPE_INSTRUCTION).toBeTypeOf('string');
      expect(OUT_OF_SCOPE_INSTRUCTION.length).toBeGreaterThan(50);
    });

    it('names the route_to_general_assistant tool by id', () => {
      expect(OUT_OF_SCOPE_INSTRUCTION).toContain('route_to_general_assistant');
    });

    it('instructs the model to pass the original query verbatim', () => {
      expect(OUT_OF_SCOPE_INSTRUCTION.toLowerCase()).toContain('verbatim');
    });

    it('is defined in shared.ts (single source of truth)', () => {
      expect(SHARED_SRC).toMatch(/export\s+const\s+OUT_OF_SCOPE_INSTRUCTION\s*=/);
    });
  });

  describe('getAgent() prompt augmentation', () => {
    it.each(WIDGET_SCOPED_AGENT_IDS)(
      'widget-scoped agent %s gets the OUT_OF_SCOPE_INSTRUCTION suffix',
      (id) => {
        const agent = getAgent(id, 'home');
        expect(agent.systemPrompt.endsWith(OUT_OF_SCOPE_INSTRUCTION)).toBe(true);
      },
    );

    it.each(PAGE_DEFAULT_AGENT_IDS)(
      'page-default agent %s does NOT get the suffix (would loop)',
      (id) => {
        const agent = getAgent(id, 'home');
        expect(agent.systemPrompt.includes(OUT_OF_SCOPE_INSTRUCTION)).toBe(false);
      },
    );

    it('falls back to the page default (no suffix) when widgetId is null', () => {
      const homeAgent = getAgent(null, 'home');
      expect(homeAgent.id).toBe('homeDefault');
      expect(homeAgent.systemPrompt.includes(OUT_OF_SCOPE_INSTRUCTION)).toBe(false);

      const projectsAgent = getAgent(null, 'projects');
      expect(projectsAgent.id).toBe('projectsDefault');
      expect(projectsAgent.systemPrompt.includes(OUT_OF_SCOPE_INSTRUCTION)).toBe(false);

      const projectAgent = getAgent(null, 'project-dashboard');
      expect(projectAgent.id).toBe('projectDefault');
      expect(projectAgent.systemPrompt.includes(OUT_OF_SCOPE_INSTRUCTION)).toBe(false);
    });

    it('is idempotent - calling twice returns the same wrapped instance', () => {
      const a = getAgent('recordsRfis', 'project-dashboard');
      const b = getAgent('recordsRfis', 'project-dashboard');
      expect(a).toBe(b);
    });

    it('subContext path also augments widget-scoped agents', () => {
      const agent = getAgent('homeRfis', 'project-dashboard', 'rfiDetail');
      // subContext wins over widgetId; rfiDetail is widget-scoped so still augmented.
      expect(agent.id).toBe('rfiDetail');
      expect(agent.systemPrompt.endsWith(OUT_OF_SCOPE_INSTRUCTION)).toBe(true);
    });
  });

  describe('AiToolsService - route_to_general_assistant', () => {
    it('declares the tool in buildTools()', () => {
      expect(TOOLS_SRC).toMatch(/this\.routeToGeneralAssistant\(\)/);
    });

    it('defines the routeToGeneralAssistant() factory', () => {
      expect(TOOLS_SRC).toMatch(/private\s+routeToGeneralAssistant\(\)\s*:\s*AiToolDefinition/);
    });

    it('tool name is exactly "route_to_general_assistant"', () => {
      const factoryStart = TOOLS_SRC.indexOf('private routeToGeneralAssistant()');
      const slice = TOOLS_SRC.slice(factoryStart, factoryStart + 2000);
      expect(slice).toMatch(/name:\s*'route_to_general_assistant'/);
    });

    it('tool runs autoExecute (panel controller intercepts before execute)', () => {
      const factoryStart = TOOLS_SRC.indexOf('private routeToGeneralAssistant()');
      const slice = TOOLS_SRC.slice(factoryStart, factoryStart + 2000);
      expect(slice).toMatch(/autoExecute:\s*true/);
    });

    it('schema requires the original `query` so the controller can re-issue it', () => {
      const factoryStart = TOOLS_SRC.indexOf('private routeToGeneralAssistant()');
      const slice = TOOLS_SRC.slice(factoryStart, factoryStart + 2000);
      expect(slice).toMatch(/required:\s*\[\s*'query'\s*\]/);
    });

    it('exports getToolSchemasForContext({ widgetFocused }) filter', () => {
      expect(TOOLS_SRC).toMatch(
        /getToolSchemasForContext\(opts:\s*\{\s*widgetFocused:\s*boolean\s*\}\)/,
      );
    });

    it('the filter omits route_to_general_assistant when widgetFocused is false', () => {
      const fnStart = TOOLS_SRC.indexOf('getToolSchemasForContext(');
      const slice = TOOLS_SRC.slice(fnStart, fnStart + 600);
      expect(slice).toMatch(/route_to_general_assistant/);
      expect(slice).toMatch(/opts\.widgetFocused/);
    });
  });

  describe('AiPanelController - forced agent override', () => {
    it('declares a private _forcedAgentId signal', () => {
      expect(CONTROLLER_SRC).toMatch(/_forcedAgentId\s*=\s*signal<string\s*\|\s*null>\(null\)/);
    });

    it('exposes a readonly forcedAgentId accessor', () => {
      expect(CONTROLLER_SRC).toMatch(/readonly\s+forcedAgentId\s*=\s*this\._forcedAgentId\.asReadonly\(\)/);
    });

    it('resolveAgentKey() routes forced state into a separate memory bucket', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private resolveAgentKey()');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 600);
      expect(slice).toMatch(/forced:\$\{forced\}/);
    });

    it('buildContext() honors forced before page-registered context provider', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private buildContext()');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 800);
      const forcedIdx = slice.indexOf('_forcedAgentId()');
      const pageProviderIdx = slice.indexOf('aiPageContext.contextProvider');
      expect(forcedIdx).toBeGreaterThan(-1);
      expect(pageProviderIdx).toBeGreaterThan(-1);
      expect(forcedIdx).toBeLessThan(pageProviderIdx);
    });

    it('resolveLocalResponder() honors forced before page-registered responder', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private resolveLocalResponder()');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 800);
      const forcedIdx = slice.indexOf('_forcedAgentId()');
      const pageResponderIdx = slice.indexOf('aiPageContext.localResponder');
      expect(forcedIdx).toBeGreaterThan(-1);
      expect(pageResponderIdx).toBeGreaterThan(-1);
      expect(forcedIdx).toBeLessThan(pageResponderIdx);
    });

    it('send() injects route tool only when widget is focused (not when forced)', () => {
      expect(CONTROLLER_SRC).toMatch(/getToolSchemasForContext\(\{\s*widgetFocused\s*\}\)/);
      const sendStart = CONTROLLER_SRC.indexOf('send(): void');
      const slice = CONTROLLER_SRC.slice(sendStart, sendStart + 1500);
      // widgetFocused must be false when forced is set.
      expect(slice).toMatch(/_forcedAgentId\(\)\s*===\s*null/);
      expect(slice).toMatch(/selectedWidgetId\(\)\s*!==\s*null/);
    });

    it('auto-clears forced on widget selection', () => {
      // The effect reads selectedWidgetId and clears _forcedAgentId when non-null.
      expect(CONTROLLER_SRC).toMatch(
        /selectedWidgetId\(\);\s*if\s*\(id\s*!==\s*null\)/s,
      );
    });

    it('auto-clears forced on route change', () => {
      // The effect reads currentUrl() and resets _forcedAgentId.
      const re = /this\.currentUrl\(\);\s*untracked\(\(\)\s*=>\s*\{\s*if\s*\(this\._forcedAgentId\(\)\s*!==\s*null\)/s;
      expect(CONTROLLER_SRC).toMatch(re);
    });
  });

  describe('AiPanelController - handleToolCall interception', () => {
    it('handleToolCall intercepts route_to_general_assistant first', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private handleToolCall(');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 600);
      expect(slice).toMatch(/route_to_general_assistant/);
      expect(slice).toMatch(/handleRouteToGeneralAssistant/);
    });

    it('declares the handleRouteToGeneralAssistant() handler', () => {
      expect(CONTROLLER_SRC).toMatch(
        /private\s+handleRouteToGeneralAssistant\(assistantMsgId:\s*number,\s*args:\s*Record<string,\s*unknown>\)/,
      );
    });

    it('handler clears widget focus and forces homeDefault', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private handleRouteToGeneralAssistant(');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 3000);
      expect(slice).toMatch(/widgetFocusService\.clearSelection\(\)/);
      expect(slice).toMatch(/_forcedAgentId\.set\(generalAgentId\)/);
      expect(slice).toMatch(/generalAgentId\s*=\s*'homeDefault'/);
    });

    it('handler writes a routing note into the original widget thread', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private handleRouteToGeneralAssistant(');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 3000);
      expect(slice).toMatch(/Routed to \$\{generalAgent\.name\}/);
      expect(slice).toMatch(/outside \$\{widgetName\}'s scope/);
    });

    it('handler re-issues the original query via send() on the next microtask', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private handleRouteToGeneralAssistant(');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 3000);
      expect(slice).toMatch(/queueMicrotask/);
      expect(slice).toMatch(/this\.inputText\.set\(originalQuery\)/);
      expect(slice).toMatch(/this\.send\(\)/);
    });

    it('handler unsubscribes the in-flight stream before switching context', () => {
      const fnStart = CONTROLLER_SRC.indexOf('private handleRouteToGeneralAssistant(');
      const slice = CONTROLLER_SRC.slice(fnStart, fnStart + 3000);
      expect(slice).toMatch(/streamSub\?\.unsubscribe\(\)/);
    });
  });

  describe('Index barrel re-exports', () => {
    it('re-exports OUT_OF_SCOPE_INSTRUCTION from the widget-agents barrel', () => {
      expect(INDEX_SRC).toMatch(/OUT_OF_SCOPE_INSTRUCTION/);
    });
  });
});
