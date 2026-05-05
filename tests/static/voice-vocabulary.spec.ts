import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __dir = dirname(fileURLToPath(import.meta.url));

const VOCAB_SRC = readFileSync(
  resolve(__dir, '../../src/app/data/voice-vocabulary.ts'),
  'utf-8',
);
const SERVICE_SRC = readFileSync(
  resolve(__dir, '../../src/app/services/voice-input.service.ts'),
  'utf-8',
);

describe('Voice vocabulary (Deepgram keyterm prompting)', () => {
  describe('exports + shape', () => {
    it('exports VOICE_GLOSSARY, STATIC_KEYTERMS, and buildVoiceKeyterms', () => {
      expect(VOCAB_SRC).toMatch(/export\s+const\s+VOICE_GLOSSARY\s*=/);
      expect(VOCAB_SRC).toMatch(/export\s+const\s+STATIC_KEYTERMS\s*:/);
      expect(VOCAB_SRC).toMatch(/export\s+function\s+buildVoiceKeyterms\s*\(/);
    });

    it('VOICE_GLOSSARY has the documented categories', () => {
      // Layered structure makes future edits easier — adding a new
      // construction term to the right bucket is obvious.
      for (const cat of ['acronyms', 'processes', 'trades', 'equipment', 'trimble']) {
        expect(VOCAB_SRC).toMatch(new RegExp(`\\b${cat}\\s*:\\s*\\[`));
      }
    });

    it('STATIC_KEYTERMS is built by flattening the glossary and frozen', () => {
      expect(VOCAB_SRC).toMatch(/Object\.values\(VOICE_GLOSSARY\)\.flat\(\)/);
      expect(VOCAB_SRC).toMatch(/Object\.freeze\(/);
    });
  });

  describe('regression guard for high-value terms', () => {
    // These terms have caused mistranscriptions during early testing and
    // anchor the rest of the glossary. Removing one without thinking is
    // almost always wrong.
    const REQUIRED = [
      'RFI',
      'submittal',
      'change order',
      'punch list',
      'lien waiver',
      'pay application',
      'Trimble Connect',
      'Tekla',
      'GNSS',
      'OSHA',
      'BIM',
      'MEP',
      'HVAC',
    ];

    for (const term of REQUIRED) {
      it(`includes "${term}"`, () => {
        // Source-level check (handles both bare strings and ones in arrays).
        expect(VOCAB_SRC).toContain(`'${term}'`);
      });
    }
  });

  describe('layer 2 wiring (data-driven projects + personas)', () => {
    it('buildVoiceKeyterms reads project names from DataStoreService', () => {
      expect(VOCAB_SRC).toMatch(/dataStore\.projects\(\)/);
    });

    it('buildVoiceKeyterms reads persona names from PERSONAS', () => {
      expect(VOCAB_SRC).toMatch(/PERSONAS\.map/);
      // Imports persona const from the canonical service.
      expect(VOCAB_SRC).toMatch(/from\s+['"]\.\.\/services\/persona\.service['"]/);
    });

    it('de-duplicates merged terms (Set) so duplicates do not bloat the URL', () => {
      // A project named after an existing glossary term should not appear
      // twice in the keyterm list.
      expect(VOCAB_SRC).toMatch(/new\s+Set\(/);
    });
  });

  describe('size and URL safety', () => {
    it('static glossary stays under 150 entries (well below Deepgram cap and URL length)', () => {
      // Count `'...'` strings between the VOICE_GLOSSARY opening and its
      // closing `} as const;`. Loose regex but it's an upper-bound smoke
      // check, not a precise count.
      const block = VOCAB_SRC.match(/VOICE_GLOSSARY\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
      expect(block).not.toBeNull();
      const matches = block![1].match(/'[^']+'/g) ?? [];
      expect(matches.length).toBeLessThan(150);
      // Sanity check the glossary isn't empty either.
      expect(matches.length).toBeGreaterThan(40);
    });

    it('every static term is a non-empty string with no embedded ampersand or equals (URL-safe)', () => {
      const block = VOCAB_SRC.match(/VOICE_GLOSSARY\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
      const matches = (block?.[1].match(/'([^']+)'/g) ?? []).map(s => s.slice(1, -1));
      for (const term of matches) {
        expect(term.length, `term must be non-empty: "${term}"`).toBeGreaterThan(0);
        expect(term, `term should not contain & (URL collision): "${term}"`).not.toContain('&');
        expect(term, `term should not contain = (URL collision): "${term}"`).not.toContain('=');
      }
    });
  });

  describe('voice-input service integration', () => {
    it('VoiceInputService imports buildVoiceKeyterms', () => {
      expect(SERVICE_SRC).toMatch(/import\s+\{\s*buildVoiceKeyterms\s*\}\s+from\s+['"][^'"]*voice-vocabulary['"]/);
    });

    it('VoiceInputService passes the keyterm array to listen.v1.connect', () => {
      // Deepgram Nova-3 expects `keyterm` as a string[]; the SDK serialises
      // each element as a repeated `keyterm=...` URL parameter. Guard
      // against accidental rename or deletion of this wiring.
      expect(SERVICE_SRC).toMatch(/keyterm:\s*buildVoiceKeyterms\(this\.dataStore\)/);
    });

    it('VoiceInputService uses the nova-3 model + interim_results for live transcription', () => {
      expect(SERVICE_SRC).toMatch(/model:\s*['"]nova-3['"]/);
      // Deepgram SDK v5 requires string booleans for these flags so they
      // survive URL query serialisation; see README "string booleans" note.
      expect(SERVICE_SRC).toMatch(/interim_results:\s*['"]true['"]/);
      expect(SERVICE_SRC).toMatch(/smart_format:\s*['"]true['"]/);
    });
  });
});
