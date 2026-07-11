/**
 * Hardcoded A/B/C templates (SAFEGUARDING_SPEC §7) and crisis card copy.
 * Category A/B/C responses must not be LLM-generated.
 */

import type { Region } from './helplineService';

export type CrisisCardHelpline = {
  name: string;
  description: string;
  displayNumber: string;
  dialNumber?: string;
  smsNumber?: string;
  smsBody?: string;
  icon: string;
};

export type CrisisCardPayload = {
  /** Stage 2 acknowledgement — fixed, warm, non-clinical */
  acknowledgement: string;
  /** Immediate danger grounding line */
  groundingLine: string;
  /** GutChecks boundary — every crisis response */
  disclaimer: string;
  /** Primary helpline first (Samaritans / Childline / regional), then secondary, then emergency */
  helplines: CrisisCardHelpline[];
  /** @deprecated use acknowledgement — kept for older message payloads */
  bannerTitle?: string;
  /** @deprecated use acknowledgement */
  summary?: string;
  /** @deprecated crisis responses must not use task-style closers */
  closer?: string;
};

export const CRISIS_ACKNOWLEDGEMENT =
  "What you've just shared matters, and it's important you don't sit with this alone.";

export const CRISIS_BOUNDARY =
  "GutChecks is a guidance tool, not a counsellor, therapist, or crisis service. The people on the lines above are trained to help with exactly what you're going through.";

/** Spec Stage 2 — plain text for read-back / fallback; UI uses buildCrisisCardPayload. */
export const SAFEGUARD_TEMPLATE_A_TEXT = `${CRISIS_ACKNOWLEDGEMENT}

Call Samaritans now — 116 123 (or Childline 0800 1111 if you are under 19).

You can also text SHOUT to 85258 for free, 24/7 confidential support.

If you are in immediate danger, please call 999 now.

${CRISIS_BOUNDARY}`;

export const SAFEGUARD_TEMPLATE_B_TEXT = `What you've shared matters, and asking for connection is a normal human thing, not a weakness.

An honest note up front
GutChecks is a tool, not a friend. It can't replace real connection, and it shouldn't try to. Treating an app as a friend is one of the patterns GutChecks is built to help users notice in themselves and in others.

If you want to talk to a real person
• Childline: 0800 1111 (free, confidential, under 19)
• The Mix: 0808 808 4994 (free, under 25)
• Samaritans: 116 123 (free, 24/7, any age)

If you want to use GutChecks for what it's built for
Loneliness sometimes connects to things this tool can actually help with; spotting whether past friendships had red flags, recognising patterns that pushed people away or pulled the wrong people in, or working out whether a current connection is healthy.

A few questions you might want to run through:
• Has a friendship recently faded, and you're not sure why?
• Are you holding back from people because of something that happened before?
• Is there someone in your life now you're unsure about?

Type the situation you want to check, or tap one of the questions above.`;

export const SAFEGUARD_TEMPLATE_C_TEXT = `What you've shared is serious, and it took courage to put it into words. This is not something to handle alone, and it's not your fault.

Talking to someone trained to help
• NSPCC: 0808 800 5000 (free, for any concern about a child or young person)
• Childline: 0800 1111 (free, confidential, under 19)
• The Mix: 0808 808 4994 (free, under 25)
• Police: 101 (non-emergency) or 999 (immediate danger)
• Rape Crisis England & Wales: 0808 500 2222 (24/7)

What GutChecks can do next
GutChecks can help you understand the patterns in what happened; whether what you've described shows signs of grooming, manipulation, or coercion, and what to look out for in any ongoing contact. That can be useful, but it does not replace talking to one of the services above.

If it feels safe to, please contact one of the services listed. If anyone is in immediate danger, call 999.`;

export const SAFEGUARD_READBACK_TEMPLATES = {
  A: SAFEGUARD_TEMPLATE_A_TEXT,
  B: SAFEGUARD_TEMPLATE_B_TEXT,
  C: SAFEGUARD_TEMPLATE_C_TEXT,
} as const;

const UK_CRISIS_HELPLINES: CrisisCardHelpline[] = [
  {
    name: 'Emergency Services',
    description: 'Immediate danger – police, ambulance, fire',
    displayNumber: '999',
    dialNumber: '999',
    icon: 'warning',
  },
  {
    name: 'Samaritans',
    description: '24/7 confidential emotional support for anyone in distress',
    displayNumber: '116 123',
    dialNumber: '116123',
    icon: 'heart',
  },
  {
    name: 'Shout',
    description: '24/7 text support if speaking feels too hard',
    displayNumber: 'Text SHOUT to 85258',
    smsNumber: '85258',
    smsBody: 'SHOUT',
    icon: 'chatbubble',
  },
  {
    name: 'Childline',
    description: 'Free, confidential support for under-19s',
    displayNumber: '0800 1111',
    dialNumber: '08001111',
    icon: 'people',
  },
];

const US_CRISIS_HELPLINES: CrisisCardHelpline[] = [
  {
    name: 'Emergency Services',
    description: 'Immediate danger – police, ambulance, fire',
    displayNumber: '911',
    dialNumber: '911',
    icon: 'warning',
  },
  {
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 crisis support and suicide prevention',
    displayNumber: '988',
    dialNumber: '988',
    icon: 'heart',
  },
  {
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741',
    displayNumber: 'Text HOME to 741741',
    smsNumber: '741741',
    smsBody: 'HOME',
    icon: 'chatbubble',
  },
];

function normalizeRegionKey(region: string | null | undefined): Region {
  const r = (region || '').toLowerCase();
  if (r.includes('united states') || r === 'us' || r === 'usa') return 'US';
  if (r.includes('canada')) return 'Canada';
  if (r.includes('australia')) return 'Australia';
  return 'UK';
}

export function getCrisisHelplinesForRegion(region: string | null | undefined): CrisisCardHelpline[] {
  const key = normalizeRegionKey(region);
  if (key === 'US') return US_CRISIS_HELPLINES;
  if (key === 'Canada') {
    return [
      {
        name: 'Emergency Services',
        description: 'Immediate danger',
        displayNumber: '911',
        dialNumber: '911',
        icon: 'warning',
      },
      {
        name: '988 Suicide Crisis Helpline',
        description: '24/7 crisis support',
        displayNumber: '988',
        dialNumber: '988',
        icon: 'heart',
      },
    ];
  }
  if (key === 'Australia') {
    return [
      {
        name: 'Emergency Services',
        description: 'Immediate danger',
        displayNumber: '000',
        dialNumber: '000',
        icon: 'warning',
      },
      {
        name: 'Lifeline',
        description: '24/7 crisis support',
        displayNumber: '13 11 14',
        dialNumber: '131114',
        icon: 'heart',
      },
    ];
  }
  return UK_CRISIS_HELPLINES;
}

function emergencyGroundingLine(region: string | null | undefined): string {
  const key = normalizeRegionKey(region);
  if (key === 'US' || key === 'Canada') {
    return 'If you are in immediate danger, please call 911 now.';
  }
  if (key === 'Australia') {
    return 'If you are in immediate danger, please call 000 now.';
  }
  return 'If you are in immediate danger, please call 999 now.';
}

function orderCrisisHelplines(
  region: string | null | undefined,
  includeChildline: boolean
): CrisisCardHelpline[] {
  const key = normalizeRegionKey(region);
  const all = getCrisisHelplinesForRegion(region);

  if (key === 'UK') {
    const primaryName = includeChildline ? 'Childline' : 'Samaritans';
    const primary = all.find((h) => h.name === primaryName) ?? all.find((h) => h.name === 'Samaritans');
    const shout = all.find((h) => h.name === 'Shout');
    const emergency = all.find((h) => h.name === 'Emergency Services');
    return [primary, shout, emergency].filter(Boolean) as CrisisCardHelpline[];
  }

  // Non-UK: primary crisis line, text line if any, then emergency.
  const emergency = all.find((h) => /emergency/i.test(h.name));
  const textLine = all.find((h) => h.smsNumber);
  const primary = all.find((h) => h !== emergency && h !== textLine && h.dialNumber);
  return [primary, textLine, emergency].filter(Boolean) as CrisisCardHelpline[];
}

export function buildCrisisCardPayload(
  region: string | null | undefined,
  opts?: { ideationOnly?: boolean; includeChildline?: boolean }
): CrisisCardPayload {
  const includeChildline = opts?.includeChildline !== false;
  const helplines = orderCrisisHelplines(region, includeChildline);
  const groundingLine = emergencyGroundingLine(region);

  return {
    acknowledgement: CRISIS_ACKNOWLEDGEMENT,
    groundingLine,
    disclaimer: CRISIS_BOUNDARY,
    helplines,
    // Legacy fields for any older UI paths
    bannerTitle: opts?.ideationOnly
      ? 'This has been flagged as a mental health emergency'
      : 'This has been flagged as a crisis',
    summary: CRISIS_ACKNOWLEDGEMENT,
  };
}

/** Approved closers — never use task-style "come back" framing (pipeline Stage 2/3). */
export const APPROVED_CLOSERS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: '',
  B: 'Type the situation you want to check, or use the questions above.',
  C: 'If it feels safe to, please contact one of the services listed. If anyone is in immediate danger, call 999.',
  D: '',
};

export const FORBIDDEN_CLOSER_PATTERNS = [
  /is there anything more you want to share/i,
  /anything else you want to share/i,
  /want to talk about anything else/i,
  /want to share about this or something else/i,
  /come back and let GutChecks know how it went\.?/gi,
  /come back and tell (us|GutChecks) how it went\.?/gi,
  /Try one of the suggested steps above\.\s*/gi,
];

export const FIRST_PERSON_PATTERNS = [
  /\bI'm\b/gi,
  /\bI am\b/gi,
  /\bI've\b/gi,
  /\bI'd\b/gi,
  /\bI hear you\b/gi,
  /\bI'm not equipped\b/gi,
  /\bI'm having a bit of trouble\b/gi,
  /\bmy\b/gi,
  /\bme\b/gi,
  /\bmine\b/gi,
  /\bmyself\b/gi,
];
