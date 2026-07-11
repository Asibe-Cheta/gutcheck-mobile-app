/**
 * GutChecks Response Pipeline (NEW_RESPONSE_PIPELINE.MD)
 *
 * Stage 1 — Risk Classifier (Layer A keywords, Layer B model assist)
 * Stage 2 — Crisis Response (static template, no model body)
 * Stage 3 — Pattern-Recognition Response Generator (JSON schema)
 * Stage 4 — Output Formatter (frontend owns layout)
 */

export const RISK_CLASSIFIER_VERSION = 'pipeline-v1';

export type PipelineRiskLevel = 'crisis' | 'elevated_concern' | 'standard';

export type PipelineRiskCategory =
  | 'suicidal_ideation'
  | 'self_harm'
  | 'immediate_danger'
  | 'ongoing_abuse'
  | 'none';

export type LayerAMatch = {
  matched: true;
  categories: PipelineRiskCategory[];
  phrases: string[];
};

export type LayerAMiss = { matched: false };

export type LayerBVerdict = {
  risk_level: PipelineRiskLevel;
  categories: PipelineRiskCategory[];
  confidence: number;
};

export type PatternAction = {
  action: string;
  priority: 'primary' | 'secondary';
};

export type PatternResponsePayload = {
  validation: string;
  red_flags: string[];
  why_it_matters: string;
  recommended_actions: PatternAction[];
  reality_check: string;
};

const TRUSTED_ADULT_ACTION =
  'Talk to a trusted adult (parent, teacher, school counsellor, or another adult you trust)';

/** Stage 1 Layer A — versioned high-risk phrase list (deterministic, no API). */
const LAYER_A_TRIGGERS: Array<{ phrase: string; category: PipelineRiskCategory }> = [
  // Suicidal ideation
  { phrase: "don't want to live", category: 'suicidal_ideation' },
  { phrase: 'dont want to live', category: 'suicidal_ideation' },
  { phrase: 'do not want to live', category: 'suicidal_ideation' },
  { phrase: "don't feel like i want to live", category: 'suicidal_ideation' },
  { phrase: 'dont feel like i want to live', category: 'suicidal_ideation' },
  { phrase: "don't feel like i want to live anymore", category: 'suicidal_ideation' },
  { phrase: 'i want to die', category: 'suicidal_ideation' },
  { phrase: 'want to die', category: 'suicidal_ideation' },
  { phrase: 'end it all', category: 'suicidal_ideation' },
  { phrase: 'end my life', category: 'suicidal_ideation' },
  { phrase: 'kill myself', category: 'suicidal_ideation' },
  { phrase: 'suicide', category: 'suicidal_ideation' },
  { phrase: 'no reason to carry on', category: 'suicidal_ideation' },
  { phrase: 'no reason to go on', category: 'suicidal_ideation' },
  { phrase: 'better off without me', category: 'suicidal_ideation' },
  { phrase: 'not want to be here', category: 'suicidal_ideation' },
  { phrase: "don't want to be here", category: 'suicidal_ideation' },
  { phrase: 'dont want to be here', category: 'suicidal_ideation' },
  { phrase: 'going to end my life', category: 'suicidal_ideation' },
  { phrase: 'i am going to die', category: 'suicidal_ideation' },
  // Intent / plan
  { phrase: 'i have a plan', category: 'suicidal_ideation' },
  { phrase: "i've written a note", category: 'suicidal_ideation' },
  { phrase: 'ive written a note', category: 'suicidal_ideation' },
  { phrase: 'wrote a suicide note', category: 'suicidal_ideation' },
  // Self-harm
  { phrase: "i've been cutting", category: 'self_harm' },
  { phrase: 'ive been cutting', category: 'self_harm' },
  { phrase: 'i hurt myself', category: 'self_harm' },
  { phrase: 'hurt myself last night', category: 'self_harm' },
  { phrase: 'self harm', category: 'self_harm' },
  { phrase: 'self-harm', category: 'self_harm' },
  { phrase: 'overdose', category: 'self_harm' },
  // Immediate danger from another person
  { phrase: "he's outside my door", category: 'immediate_danger' },
  { phrase: 'hes outside my door', category: 'immediate_danger' },
  { phrase: "she's outside my door", category: 'immediate_danger' },
  { phrase: "i'm scared he'll hurt me tonight", category: 'immediate_danger' },
  { phrase: 'im scared hell hurt me tonight', category: 'immediate_danger' },
  { phrase: 'he will kill me', category: 'immediate_danger' },
  { phrase: 'she will kill me', category: 'immediate_danger' },
  { phrase: 'they will kill me', category: 'immediate_danger' },
  { phrase: 'in immediate danger', category: 'immediate_danger' },
  { phrase: 'being followed', category: 'immediate_danger' },
  { phrase: 'call police now', category: 'immediate_danger' },
  // Ongoing abuse (statutory safeguarding)
  { phrase: 'i am being abused', category: 'ongoing_abuse' },
  { phrase: "i'm being abused", category: 'ongoing_abuse' },
  { phrase: 'he is abusing me', category: 'ongoing_abuse' },
  { phrase: 'she is abusing me', category: 'ongoing_abuse' },
];

export function runLayerAClassifier(message: string): LayerAMatch | LayerAMiss {
  const text = message.toLowerCase();
  const phrases: string[] = [];
  const categories = new Set<PipelineRiskCategory>();

  for (const trigger of LAYER_A_TRIGGERS) {
    if (text.includes(trigger.phrase)) {
      phrases.push(trigger.phrase);
      categories.add(trigger.category);
    }
  }

  if (phrases.length === 0) return { matched: false };
  return { matched: true, categories: Array.from(categories), phrases };
}

export function shouldRouteToCrisisFromLayerB(verdict: LayerBVerdict): boolean {
  if (verdict.risk_level === 'crisis') return true;
  return verdict.risk_level === 'elevated_concern' && verdict.confidence >= 0.6;
}

export const LAYER_B_CLASSIFIER_SYSTEM_PROMPT = `You are a risk classifier for GutChecks, a safeguarding education tool.
Do nothing except classify the user message. Do not draft any user-facing text.
Output ONLY valid JSON with this exact shape:
{"risk_level":"crisis"|"elevated_concern"|"standard","categories":["suicidal_ideation"|"self_harm"|"immediate_danger"|"ongoing_abuse"|"none"],"confidence":0.0}
Rules:
- "crisis": clear suicidal ideation, self-harm intent/plan, or immediate physical danger.
- "elevated_concern": ambiguous but concerning language that may indicate crisis risk.
- "standard": pattern-recognition / relationship / social situation queries with no crisis signals.
- confidence is 0.0–1.0 for your classification certainty.
- categories must be an array; use ["none"] only for standard.`;

export function parseLayerBVerdict(raw: string): LayerBVerdict | null {
  try {
    let text = raw.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(text) as Partial<LayerBVerdict>;
    const risk = parsed.risk_level;
    if (risk !== 'crisis' && risk !== 'elevated_concern' && risk !== 'standard') return null;
    const confidence =
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0;
    const categories = Array.isArray(parsed.categories)
      ? (parsed.categories.filter(Boolean) as PipelineRiskCategory[])
      : ['none'];
    return { risk_level: risk, categories, confidence };
  } catch {
    return null;
  }
}

export const PATTERN_RESPONSE_SYSTEM_PROMPT = `You are a pattern-recognition assistant for GutChecks, a safeguarding education tool. You are not a counsellor, friend, or chatbot. Follow these rules strictly:

1. Output ONLY the JSON structure provided. No additional commentary.
2. "validation" must describe the situation factually. Do not invent reasons, motives, or backstory the user did not state. Do not use speculative language ("they might be...", "this could mean...") more than once per response.
3. "red_flags" must be short, scannable phrases (max 8 words each), not full paragraphs. Maximum 4 items.
4. "recommended_actions" MUST include "Talk to a trusted adult (parent, teacher, school counsellor, or another adult you trust)" as the FIRST item with priority "primary" in every response, unless the user has already stated they have done this in the current query — in which case it should be replaced with a "primary" follow-up such as confirming what was shared and what response they got.
5. Do not tell the user to "come back and let GutChecks know how it went." GutChecks is an education tool; it does not maintain an ongoing relationship with the user across sessions and should not imply this.
6. Use plain, age-appropriate language. No jargon.
7. Never present uncertainty as fact. If a scenario has multiple possible explanations, say so once, briefly — do not enumerate every possibility as if confirmed.

Output ONLY this JSON:
{
  "validation": "1-2 sentences acknowledging the situation factually",
  "red_flags": ["short phrase", "short phrase"],
  "why_it_matters": "1-2 sentences, factual, no invented scenarios",
  "recommended_actions": [
    {"action": "Talk to a trusted adult (parent, teacher, school counsellor, or another adult you trust)", "priority": "primary"},
    {"action": "...", "priority": "secondary"},
    {"action": "...", "priority": "secondary"}
  ],
  "reality_check": "1 sentence, factual, no false reassurance"
}`;

function userAlreadySpokeToTrustedAdult(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes('told my') ||
    text.includes('told a teacher') ||
    text.includes('told my parent') ||
    text.includes('told my mum') ||
    text.includes('told my mom') ||
    text.includes('told my dad') ||
    text.includes('spoke to a counsellor') ||
    text.includes('spoke to a counselor') ||
    text.includes('talked to a trusted adult') ||
    text.includes('already told')
  );
}

function truncateWords(phrase: string, maxWords: number): string {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return phrase.trim();
  return words.slice(0, maxWords).join(' ');
}

export function parseAndValidatePatternResponse(
  raw: string,
  userMessage: string
): PatternResponsePayload | null {
  try {
    let text = raw.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

    // Prefer first JSON object if model adds noise.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<PatternResponsePayload>;

    const validation = typeof parsed.validation === 'string' ? parsed.validation.trim() : '';
    const why = typeof parsed.why_it_matters === 'string' ? parsed.why_it_matters.trim() : '';
    const reality = typeof parsed.reality_check === 'string' ? parsed.reality_check.trim() : '';
    if (!validation || !why || !reality) return null;

    const redFlags = (Array.isArray(parsed.red_flags) ? parsed.red_flags : [])
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      .map((f) => truncateWords(f, 8))
      .slice(0, 4);

    let actions = (Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : [])
      .filter(
        (a): a is PatternAction =>
          !!a &&
          typeof a.action === 'string' &&
          a.action.trim().length > 0 &&
          (a.priority === 'primary' || a.priority === 'secondary')
      )
      .map((a) => ({ action: a.action.trim(), priority: a.priority }));

    const hasTrustedAdultPrimary = actions.some(
      (a) => a.priority === 'primary' && /trusted adult/i.test(a.action)
    );
    if (!hasTrustedAdultPrimary && !userAlreadySpokeToTrustedAdult(userMessage)) {
      actions = [
        { action: TRUSTED_ADULT_ACTION, priority: 'primary' },
        ...actions.filter((a) => a.priority !== 'primary' || !/trusted adult/i.test(a.action)),
      ];
    } else if (!actions.some((a) => a.priority === 'primary')) {
      actions = [
        {
          action: userAlreadySpokeToTrustedAdult(userMessage)
            ? 'Confirm what you shared with that adult and what support they offered'
            : TRUSTED_ADULT_ACTION,
          priority: 'primary',
        },
        ...actions,
      ];
    }

    // Ensure primary trusted-adult (or follow-up) is first.
    const primary = actions.find((a) => a.priority === 'primary');
    const secondary = actions.filter((a) => a !== primary);
    actions = primary ? [primary, ...secondary] : actions;

    return {
      validation,
      red_flags: redFlags.length > 0 ? redFlags : ['Something in this situation needs a closer look'],
      why_it_matters: why,
      recommended_actions: actions.slice(0, 4),
      reality_check: reality,
    };
  } catch {
    return null;
  }
}

/** Stage 4 — plain-text render for read-back / history fallback. */
export function formatPatternResponseText(payload: PatternResponsePayload): string {
  const flags = payload.red_flags.map((f) => `• ${f}`).join('\n');
  const actions = payload.recommended_actions
    .map((a, i) => `${i + 1}. ${a.action}`)
    .join('\n');

  return [
    payload.validation,
    '',
    '🚩 RED FLAGS',
    flags,
    '',
    'WHY THIS MATTERS',
    payload.why_it_matters,
    '',
    '✅ WHAT TO DO',
    actions,
    '',
    'REALITY CHECK',
    payload.reality_check,
  ].join('\n');
}

export function formatCrisisResponseText(parts: {
  acknowledgement: string;
  primaryLabel: string;
  secondaryLine: string;
  groundingLine: string;
  boundary: string;
}): string {
  return [
    parts.acknowledgement,
    '',
    parts.primaryLabel,
    parts.secondaryLine,
    parts.groundingLine,
    '',
    parts.boundary,
  ].join('\n');
}
