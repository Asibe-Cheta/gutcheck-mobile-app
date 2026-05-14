/**
 * Curated device TTS voices for read-back (neutral, English-first).
 * Filters out novelty / child / fantasy style names per product guidance.
 */

import type { Voice } from 'expo-speech';

/** BCP-47 prefixes we allow for GutChecks read-back. */
const ALLOWED_LANGUAGE_PREFIXES = ['en-gb', 'en-us', 'en-au', 'en-ie', 'en-nz'] as const;

const BLOCKED_NAME_PATTERN =
  /child|kid|cartoon|funny|novelty|zombie|alien|chipmunk|boing|whisper|bedtime|bed time|magical|fantasy|comic|silly|robot|monster|pirate|demon|ghost|spooky/i;

function normalizeLang(lang: string): string {
  return lang.trim().toLowerCase().replace('_', '-');
}

export function isCuratedTtsVoice(voice: Voice): boolean {
  const lang = normalizeLang(voice.language || '');
  const allowed = ALLOWED_LANGUAGE_PREFIXES.some((p) => lang === p || lang.startsWith(`${p}-`));
  if (!allowed) return false;
  const name = `${voice.name || ''} ${voice.identifier || ''}`;
  if (BLOCKED_NAME_PATTERN.test(name)) return false;
  return true;
}

export function filterCuratedTtsVoices(voices: Voice[]): Voice[] {
  return voices.filter(isCuratedTtsVoice).sort((a, b) => {
    const la = normalizeLang(a.language);
    const lb = normalizeLang(b.language);
    if (la !== lb) return la.localeCompare(lb);
    return (a.name || '').localeCompare(b.name || '');
  });
}

/** Default recognition / read-back locale when user has not picked a voice row. */
export const DEFAULT_VOICE_LOCALE = 'en-GB';

export function recognitionLangFromTtsLanguage(lang: string | undefined): string {
  const n = normalizeLang(lang || DEFAULT_VOICE_LOCALE);
  if (n.startsWith('en-us')) return 'en-US';
  if (n.startsWith('en-au')) return 'en-AU';
  if (n.startsWith('en-ie')) return 'en-IE';
  if (n.startsWith('en-nz')) return 'en-NZ';
  return 'en-GB';
}
