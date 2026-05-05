import type { DataStoreService } from './data-store.service';
import { PERSONAS } from '../services/persona.service';

/**
 * Construction-domain vocabulary for Deepgram's `keyterm` parameter (Nova-3
 * keyterm prompting). Bias the speech recognizer toward terms that generic
 * English models routinely mangle: industry acronyms, process language,
 * trade/equipment names, and Trimble-specific products.
 *
 * Two layers ship in this file:
 *
 * 1. A curated static glossary (this object) — hand-picked terms that are
 *    stable across the product. Edits require a code change.
 *
 * 2. A data-driven helper {@link buildVoiceKeyterms} that augments the static
 *    list with the live project and persona names from the running app, so
 *    proper nouns transcribe correctly without manual upkeep.
 *
 * Per-agent vocabulary contributions (Tier 3) and post-processing
 * find-and-replace (Tier 4) are deliberately deferred to follow-up work.
 *
 * Privacy note: keyterms appear in the WebSocket URL on every dictation
 * session and are subject to Deepgram's URL logging. The static glossary
 * contains no PII; the data-driven layer adds first-party project/persona
 * names that the user is dictating about anyway. If a future persona must not
 * reach a third-party log, exclude it from the data-driven layer here.
 */
export const VOICE_GLOSSARY = {
  acronyms: [
    'RFI',
    'RFIs',
    'ASI',
    'PCO',
    'COR',
    'GMP',
    'OAC',
    'NOI',
    'SWPPP',
    'BIM',
    'MEP',
    'HVAC',
    'SOV',
    'EOR',
    'AHJ',
    'NTP',
    'TCO',
    'CCD',
    'AIA G702',
    'AIA G703',
    'OSHA',
  ],
  processes: [
    'submittal',
    'submittals',
    'punch list',
    'change order',
    'change orders',
    'lien waiver',
    'retainage',
    'pay application',
    'pay app',
    'draw request',
    'closeout',
    'commissioning',
    'turnover',
    'rough-in inspection',
    'value engineering',
    'schedule of values',
    'critical path',
    'as-built',
    'as-builts',
    'redline',
    'redlines',
    'shop drawing',
    'shop drawings',
  ],
  trades: [
    'drywall',
    'framing',
    'sitework',
    'earthwork',
    'formwork',
    'shoring',
    'rebar',
    'rough-in',
    'concrete pour',
    'masonry',
    'millwork',
    'sheet metal',
    'glazing',
  ],
  equipment: [
    'excavator',
    'manlift',
    'scissor lift',
    'telehandler',
    'skid steer',
    'total station',
    'tower crane',
    'mobile crane',
    'compactor',
    'screed',
    'formliner',
  ],
  trimble: [
    'Trimble',
    'Trimble Connect',
    'Tekla',
    'Tekla Structures',
    'GNSS',
    'robotic total station',
    'WorksOS',
    'WorksManager',
    'SiteVision',
    'Trimble Business Center',
  ],
} as const;

/**
 * Flattened list of every static glossary entry. Frozen so callers cannot
 * accidentally mutate the source-of-truth array. Order is stable (acronyms
 * first, then processes, trades, equipment, Trimble products).
 */
export const STATIC_KEYTERMS: readonly string[] = Object.freeze(
  Object.values(VOICE_GLOSSARY).flat(),
);

/**
 * Merge the static glossary with live project and persona names so dictation
 * sessions transcribe both domain jargon and proper nouns correctly.
 *
 * The data-driven layer reads from {@link DataStoreService.projects} (a
 * signal — call it inline) and the {@link PERSONAS} const, so when projects
 * or personas are added/renamed, the next dictation session picks them up
 * automatically. Mid-session changes apply only to subsequent sessions
 * (vocabulary is committed at WebSocket open time).
 *
 * De-duplicated via {@link Set} so a project named after an existing
 * glossary term doesn't bloat the URL with duplicates.
 */
export function buildVoiceKeyterms(dataStore: DataStoreService): readonly string[] {
  const projectNames = dataStore.projects().map(p => p.name);
  const personaNames = PERSONAS.map(p => p.name);
  return Array.from(new Set([...STATIC_KEYTERMS, ...projectNames, ...personaNames]));
}
