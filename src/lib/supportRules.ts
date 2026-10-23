/**
 * Support-card rules (PRD 12.1 and 12.2).
 *
 * A deterministic, versioned lexicon decides which support cards appear under a result. It runs on
 * the user's own words, independently of the AI, and the AI never writes support links. Cards are
 * support, not verdicts: matching a category never means GutChecks has decided abuse is happening.
 *
 * Tier 3 crisis messages are handled earlier by the Layer A crisis classifier in ai.ts, which
 * replaces the reply with a static crisis card; the danger phrases here are a second net for
 * results that still reach the normal path.
 *
 * REVIEW: every phrase list needs safeguarding-lead sign-off before release (PRD 12.1).
 */

import {
  isUnder18Band,
  SUPPORT_DIRECTORY_VERSION,
  SupportServiceId,
} from '@/lib/supportDirectory';

export const SUPPORT_RULESET_VERSION = 1;

export type SupportTier = 0 | 1 | 2 | 3;

export type SupportCategory =
  | 'immediate-danger'
  | 'sexual-violence'
  | 'grooming'
  | 'domestic-abuse'
  | 'stalking'
  | 'child-safeguarding'
  | 'bullying'
  | 'emotional-distress'
  | 'general-concern'
  | 'informational';

export interface SupportPlan {
  tier: SupportTier;
  category: SupportCategory;
  serviceIds: SupportServiceId[];
  rulesetVersion: number;
  directoryVersion: number;
}

export interface SupportContext {
  ageBand: string | null;
  isParentCarer: boolean;
  /** True when the AI returned possible warning signs for this check. */
  hasConcern: boolean;
}

const LEXICON: Record<Exclude<SupportCategory, 'general-concern' | 'informational'>, string[]> = {
  'immediate-danger': [
    'outside my house now', 'outside my door now', 'he is outside', 'she is outside', 'in danger right now',
    'in danger now', 'has a knife', 'has a gun', 'going to kill me', 'is going to hurt me', 'hurting me right now',
    'being attacked', 'locked me in', "won't let me leave", 'wont let me leave', 'trying to get in',
  ],
  'sexual-violence': [
    'raped', 'rape me', 'sexually assaulted', 'sexual assault', 'touched me', 'forced me to', 'molested',
    'made me do sexual', 'without my consent',
  ],
  grooming: [
    'nudes', 'send pics', 'send a pic', 'send me a pic', 'naked', 'explicit photo', 'explicit pic', 'sexting',
    'sext', 'webcam', 'groom', 'our little secret', 'our secret', "don't tell your parents", 'dont tell your parents',
    "don't tell your mum", "don't tell your mom", "don't tell your dad", 'meet up alone', 'meet me alone',
    'older guy', 'older man', 'older boy', 'sextort', 'threatened to share', 'threatening to share',
  ],
  'domestic-abuse': [
    'hits me', 'he hit me', 'she hit me', 'they hit me', 'pushed me', 'slapped me', 'chokes me', 'choked me', 'controls my money',
    "won't let me see my friends", 'wont let me see my friends', 'checks my phone', 'tracks my location',
    'coercive', 'abusive relationship', 'my partner hurts', 'my boyfriend hurts', 'my girlfriend hurts',
    'afraid of my partner', 'scared of my partner', 'scared of my boyfriend', 'scared of my girlfriend',
  ],
  stalking: [
    'following me home', 'followed me home', 'followed me to', 'keeps following me', 'stalking', 'stalker', 'turns up at', 'keeps turning up', "won't leave me alone",
    'wont leave me alone', 'tracking me', 'watching my house', 'outside my house', 'new accounts to message me',
  ],
  'child-safeguarding': [
    'my child', 'my son', 'my daughter', 'my kid', 'my student', 'my pupil', 'a child in my', 'my niece',
    'my nephew', 'my grandchild',
  ],
  bullying: [
    'bully', 'bullied', 'bullying', 'picking on me', 'laughing at me', 'excluded me', 'leave me out', 'left me out',
    'harass', 'calling me names', 'posting about me', 'group chat about me',
  ],
  'emotional-distress': [
    'lonely', 'depressed', "can't cope", 'cant cope', 'hopeless', 'anxious', 'overwhelmed', 'crying every',
    "can't sleep", 'cant sleep', 'feel worthless', 'nobody cares', 'no one cares', 'so alone',
  ],
};

/** Highest-priority category first; the first match wins. */
const CATEGORY_ORDER: (keyof typeof LEXICON)[] = [
  'immediate-danger',
  'sexual-violence',
  'grooming',
  'domestic-abuse',
  'stalking',
  'child-safeguarding',
  'bullying',
  'emotional-distress',
];

function matchCategory(text: string): keyof typeof LEXICON | null {
  const lower = text.toLowerCase().replace(/[’‘]/g, "'");
  for (const category of CATEGORY_ORDER) {
    if (LEXICON[category].some((phrase) => lower.includes(phrase))) return category;
  }
  return null;
}

function ageFromBand(ageBand: string | null): number | null {
  const first = Number((ageBand?.match(/\d+/) || [])[0]);
  return Number.isFinite(first) ? first : null;
}

/** Services for a category and age (PRD 12.2), specialist first, at most three. */
function servicesFor(category: SupportCategory, ctx: SupportContext): SupportServiceId[] {
  const under18 = isUnder18Band(ctx.ageBand);
  const age = ageFromBand(ctx.ageBand);
  const general: SupportServiceId = under18 ? 'uk-childline' : 'uk-samaritans';

  switch (category) {
    case 'immediate-danger':
      return under18 ? ['uk-childline'] : ['uk-samaritans'];
    case 'sexual-violence':
      if (under18) return age !== null && age >= 16 ? ['uk-childline', 'uk-rapecrisis'] : ['uk-childline'];
      return ['uk-rapecrisis', 'uk-safeline'];
    case 'grooming':
      return under18 ? ['uk-ceop', 'uk-childline'] : [];
    case 'domestic-abuse':
      return under18 ? ['uk-childline'] : ['uk-ndah'];
    case 'stalking':
      return under18 ? ['uk-childline'] : ['uk-stalking'];
    case 'child-safeguarding':
      return ctx.isParentCarer && !under18 ? ['uk-nspcc'] : [];
    case 'bullying':
      // Adult bullying service pending verification (PRD 12.3); CEOP does not handle bullying.
      return under18 ? ['uk-childline'] : [];
    case 'emotional-distress':
      return [general];
    case 'general-concern':
      // Keep tier 1 light: under-18s get Childline, adults get nothing unless distress is described.
      return under18 ? ['uk-childline'] : [];
    case 'informational':
      return [];
  }
}

/**
 * Decide the support cards for a result from the user's words in this conversation.
 * The tier only ever goes up within a conversation (PRD 12.1: never lowered).
 */
export function planSupport(userTexts: string[], ctx: SupportContext): SupportPlan {
  const joined = userTexts.join('\n');
  const matched = matchCategory(joined);

  // An adult worried about a child: NSPCC first, plus CEOP's report form when grooming or sexual
  // abuse is described (CEOP takes reports about under-18s from adults too).
  const lower = joined.toLowerCase();
  if (
    ctx.isParentCarer &&
    !isUnder18Band(ctx.ageBand) &&
    matched !== 'immediate-danger' &&
    LEXICON['child-safeguarding'].some((phrase) => lower.includes(phrase))
  ) {
    const reportToCeop = matched === 'grooming' || matched === 'sexual-violence';
    return {
      tier: 2,
      category: 'child-safeguarding',
      serviceIds: reportToCeop ? ['uk-nspcc', 'uk-ceop'] : ['uk-nspcc'],
      rulesetVersion: SUPPORT_RULESET_VERSION,
      directoryVersion: SUPPORT_DIRECTORY_VERSION,
    };
  }

  let category: SupportCategory;
  let tier: SupportTier;
  if (matched === 'immediate-danger') {
    category = 'immediate-danger';
    tier = 3;
  } else if (matched && matched !== 'emotional-distress') {
    category = matched;
    tier = 2;
  } else if (matched === 'emotional-distress') {
    category = 'emotional-distress';
    tier = 1;
  } else if (ctx.hasConcern) {
    category = 'general-concern';
    tier = 1;
  } else {
    category = 'informational';
    tier = 0;
  }

  const serviceIds = servicesFor(category, ctx).slice(0, tier === 3 ? 2 : 3);
  return {
    tier,
    category,
    serviceIds,
    rulesetVersion: SUPPORT_RULESET_VERSION,
    directoryVersion: SUPPORT_DIRECTORY_VERSION,
  };
}
