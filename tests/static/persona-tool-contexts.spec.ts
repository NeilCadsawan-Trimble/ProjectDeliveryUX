import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

import {
  PERSONA_TOOL_CONTEXTS,
  DEFAULT_PERSONA_TOOL_CONTEXTS,
  type PersonaToolContext,
} from '../../src/app/data/persona-tool-contexts';

const __dir = dirname(fileURLToPath(import.meta.url));

const SRC = readFileSync(
  resolve(__dir, '../../src/app/data/persona-tool-contexts.ts'),
  'utf-8',
);

const PERSONA_SLUGS = ['frank', 'bert', 'kelly', 'dominique', 'pamela'] as const;

describe('Persona tool contexts (AI floating prompt → Tools menu)', () => {
  describe('exports + shape', () => {
    it('exports PERSONA_TOOL_CONTEXTS and a default fallback', () => {
      expect(SRC).toMatch(/export\s+const\s+PERSONA_TOOL_CONTEXTS\s*:/);
      expect(SRC).toMatch(/export\s+const\s+DEFAULT_PERSONA_TOOL_CONTEXTS\s*=/);
    });

    it('exports the PersonaToolContext interface', () => {
      expect(SRC).toMatch(/export\s+interface\s+PersonaToolContext\s*\{/);
    });

    it('default fallback points at Frank (the owner)', () => {
      expect(DEFAULT_PERSONA_TOOL_CONTEXTS).toBe(PERSONA_TOOL_CONTEXTS['frank']);
    });
  });

  describe('per-persona catalogs', () => {
    it.each(PERSONA_SLUGS)('%s has a non-empty contexts list', slug => {
      const list = PERSONA_TOOL_CONTEXTS[slug];
      expect(list).toBeDefined();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });

    it.each(PERSONA_SLUGS)('%s entries each carry a unique id and a label + description', slug => {
      const list = PERSONA_TOOL_CONTEXTS[slug];
      const seenIds = new Set<string>();
      for (const item of list) {
        expect(item.id).toBeTruthy();
        expect(seenIds.has(item.id)).toBe(false);
        seenIds.add(item.id);
        expect(item.label.trim().length).toBeGreaterThan(0);
        expect(item.description.trim().length).toBeGreaterThan(0);
      }
    });

    it.each(PERSONA_SLUGS)('%s entries declare either logoEmblem:true or a non-empty icon', slug => {
      const list = PERSONA_TOOL_CONTEXTS[slug];
      for (const item of list) {
        const hasEmblem = item.logoEmblem === true;
        const hasIcon = typeof item.icon === 'string' && item.icon.trim().length > 0;
        expect(hasEmblem || hasIcon).toBe(true);
        // Mutually exclusive: an entry should be either an emblem or an icon,
        // not both, so the menu start-icon column renders one glyph.
        expect(hasEmblem && hasIcon).toBe(false);
      }
    });

    it.each(PERSONA_SLUGS)('%s either leads with the Trimble Connect emblem or omits it entirely', slug => {
      // Connect is a Trimble field/project tool; back-office personas
      // (Kelly) don't have a Connect workspace so they skip it. For every
      // other persona, Connect must lead the list per the Modus reference.
      const list = PERSONA_TOOL_CONTEXTS[slug];
      const connectIndex = list.findIndex(i => i.label === 'Trimble Connect');
      if (connectIndex === -1) return;
      expect(connectIndex).toBe(0);
      expect(list[0].logoEmblem).toBe(true);
      expect(list[0].icon).toBeUndefined();
    });

    it('Kelly (office admin) does not include Trimble Connect', () => {
      const list = PERSONA_TOOL_CONTEXTS['kelly'];
      expect(list.some(i => i.label === 'Trimble Connect')).toBe(false);
    });

    it('field/project personas (Frank, Bert, Dominique, Pamela) all include Trimble Connect', () => {
      for (const slug of ['frank', 'bert', 'dominique', 'pamela'] as const) {
        const list = PERSONA_TOOL_CONTEXTS[slug];
        expect(list.some(i => i.label === 'Trimble Connect')).toBe(true);
      }
    });

    it.each(PERSONA_SLUGS)('%s labels and descriptions stay short (single-line dropdown rows)', slug => {
      const list = PERSONA_TOOL_CONTEXTS[slug];
      for (const item of list) {
        // Aim for navbar/menu copy brevity per the modus-essentials short-copy rule.
        expect(item.label.length).toBeLessThanOrEqual(40);
        expect(item.description.length).toBeLessThanOrEqual(60);
      }
    });
  });

  describe('persona differentiation', () => {
    it('every persona renders a distinct tool list (demo intent: contexts vary by role)', () => {
      const signatures = new Set<string>();
      for (const slug of PERSONA_SLUGS) {
        const sig = PERSONA_TOOL_CONTEXTS[slug]
          .map((i: PersonaToolContext) => i.id)
          .join('|');
        signatures.add(sig);
      }
      expect(signatures.size).toBe(PERSONA_SLUGS.length);
    });

    it('Pamela (estimator) owns Quantities & takeoff', () => {
      const list = PERSONA_TOOL_CONTEXTS['pamela'];
      expect(list.some(i => i.label === 'Quantities & takeoff')).toBe(true);
    });

    it('Dominique (field engineer) owns Field & machine data', () => {
      const list = PERSONA_TOOL_CONTEXTS['dominique'];
      expect(list.some(i => i.label === 'Field & machine data')).toBe(true);
    });

    it('Kelly (office admin) owns Accounts payable and Accounts receivable', () => {
      const list = PERSONA_TOOL_CONTEXTS['kelly'];
      expect(list.some(i => i.label === 'Accounts payable')).toBe(true);
      expect(list.some(i => i.label === 'Accounts receivable')).toBe(true);
    });

    it('Frank (owner) owns Portfolio dashboards and Financial reports', () => {
      const list = PERSONA_TOOL_CONTEXTS['frank'];
      expect(list.some(i => i.label === 'Portfolio dashboards')).toBe(true);
      expect(list.some(i => i.label === 'Financial reports')).toBe(true);
    });

    it('Bert (PM) owns RFIs & submittals and Schedule & milestones', () => {
      const list = PERSONA_TOOL_CONTEXTS['bert'];
      expect(list.some(i => i.label === 'RFIs & submittals')).toBe(true);
      expect(list.some(i => i.label === 'Schedule & milestones')).toBe(true);
    });
  });
});
