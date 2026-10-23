/**
 * Onboarding copy (PRD section 8, O2 to O6).
 * British English. Everything here is fictional demo content; no AI call is made.
 */

export type ReasonId =
  | 'message'
  | 'relationship'
  | 'friendship'
  | 'school'
  | 'work'
  | 'family'
  | 'someone-else'
  | 'earlier'
  | 'looking';

export const REASONS: { id: ReasonId; label: string }[] = [
  { id: 'message', label: 'A message or online chat' },
  { id: 'relationship', label: 'Dating or a relationship' },
  { id: 'friendship', label: 'A friendship' },
  { id: 'school', label: 'School, college or university' },
  { id: 'work', label: 'Work' },
  { id: 'family', label: 'Family or home' },
  { id: 'someone-else', label: "I'm worried about someone else" },
  { id: 'earlier', label: 'I want to spot red flags earlier' },
  { id: 'looking', label: 'Just looking around' },
];

export const HOW_IT_HELPS_HEADLINE: Record<ReasonId, string> = {
  message: 'Messages can leave you unsure what someone really meant.',
  relationship: "It's okay to question how a relationship makes you feel.",
  friendship: 'Friendships can feel confusing when something changes.',
  school: 'Things at school, college or uni can be hard to make sense of.',
  work: 'Work situations can be hard to read, especially with someone in charge.',
  family: 'Family situations can be the hardest to see clearly.',
  'someone-else': 'Noticing something about someone you care about matters.',
  earlier: 'Knowing the signs early gives you more choices.',
  looking: 'Checking in with your gut is always allowed.',
};

export type FeelingId = 'secrecy' | 'pressure' | 'cuts-out' | 'doubt' | 'too-soon' | 'not-sure';

export const FEELING_OPTIONS: { id: FeelingId; label: string }[] = [
  { id: 'secrecy', label: 'Asks for secrecy' },
  { id: 'pressure', label: 'Pressure or guilt' },
  { id: 'cuts-out', label: 'Cuts out other people' },
  { id: 'doubt', label: 'Makes me doubt myself' },
  { id: 'too-soon', label: 'Too much, too soon' },
  { id: 'not-sure', label: "I'm not sure" },
];

export type ExampleId = 'secrecy' | 'relationship' | 'friendship' | 'family' | 'work';

export interface ExampleResult {
  message: string;
  /** Feelings that match this message, for the recognition line. */
  matches: FeelingId[];
  signs: { title: string; detail: string }[];
  nextSteps: string[];
}

/**
 * The 'secrecy' result is the PRD's own copy (O5).
 * CONFIRM: the other four results are drafted in the same tone and need owner sign-off.
 */
export const EXAMPLES: Record<ExampleId, ExampleResult> = {
  secrecy: {
    message:
      "You're the only one who really gets me. Don't tell your friends about us, they wouldn't understand. Delete this chat after, ok?",
    matches: ['secrecy', 'cuts-out', 'too-soon'],
    signs: [
      {
        title: 'Asking for secrecy',
        detail: 'Being asked to hide a conversation can stop others noticing what’s happening.',
      },
      {
        title: 'A "special" connection',
        detail:
          'Saying you’re the only one who understands them can build closeness fast and make it harder to say no.',
      },
      { title: 'Deleting messages', detail: 'This removes a record you might want later.' },
    ],
    nextSteps: [
      'Keep the chat for now rather than deleting it.',
      'Talk to someone you trust.',
      'You can say no, or step back, at any time.',
    ],
  },
  relationship: {
    message: 'I only check your phone because I care. If you had nothing to hide, you wouldn’t mind.',
    matches: ['pressure', 'doubt'],
    signs: [
      {
        title: 'Checking your phone',
        detail: 'Going through someone’s phone can be a way of keeping track of them, even when it’s called care.',
      },
      {
        title: '"Nothing to hide"',
        detail: 'This can turn wanting privacy into something you feel guilty about.',
      },
      {
        title: 'Care used as a reason',
        detail: 'Caring about someone doesn’t usually mean checking up on them.',
      },
    ],
    nextSteps: [
      'Notice how often this happens and how it makes you feel.',
      'Talk to someone you trust about it.',
      'You’re allowed to keep things private.',
    ],
  },
  friendship: {
    message: 'If you go to her party instead of mine, don’t bother talking to me on Monday.',
    matches: ['pressure', 'cuts-out'],
    signs: [
      { title: 'An ultimatum', detail: 'Being told to choose, or else, can leave you feeling you have no real choice.' },
      {
        title: 'Choosing between friends',
        detail: 'Being pushed away from other friends can make you rely on one person.',
      },
      {
        title: 'Threatening to stop talking',
        detail: 'Using silence as a threat can be a way of controlling what you do.',
      },
    ],
    nextSteps: [
      'You can decide what feels right for you.',
      'Talk to another friend or someone you trust.',
      'A good friend can be upset without threatening you.',
    ],
  },
  family: {
    message: 'Stop being so dramatic. That never happened. You always twist things.',
    matches: ['doubt', 'pressure'],
    signs: [
      {
        title: 'Saying it never happened',
        detail: 'Being told your memory is wrong, again and again, can make you doubt yourself.',
      },
      { title: 'Being called "dramatic"', detail: 'This can be a way of brushing your feelings aside.' },
      { title: '"You always…"', detail: 'Blaming words like this can make it hard to talk about what happened.' },
    ],
    nextSteps: [
      'It can help to write down what happened and when.',
      'Talk to someone you trust outside the situation.',
      'Your feelings about what happened are valid.',
    ],
  },
  work: {
    message: 'I need you to stay late again. Everyone else manages. Maybe this job isn’t for you.',
    matches: ['pressure', 'doubt'],
    signs: [
      {
        title: 'Pressure to work extra',
        detail: 'Being asked again and again to stay late can wear you down.',
      },
      {
        title: 'Comparing you to others',
        detail: '"Everyone else manages" can make you feel you are the problem.',
      },
      {
        title: 'A hint about your job',
        detail: 'Hinting your job is at risk can make it hard to say no.',
      },
    ],
    nextSteps: [
      'Keep a note of what was said and when.',
      'Talk to someone you trust, or HR if it feels safe.',
      'You can ask what is expected of you in writing.',
    ],
  },
};

export function exampleForReason(reason: ReasonId | null): ExampleId {
  switch (reason) {
    case 'relationship':
      return 'relationship';
    case 'friendship':
      return 'friendship';
    case 'family':
      return 'family';
    case 'work':
      return 'work';
    default:
      return 'secrecy';
  }
}

export const EXAMPLE_ORDER: ExampleId[] = ['secrecy', 'relationship', 'friendship', 'family', 'work'];

export type AgeBand = 'under-13' | '13-15' | '16-17' | '18-24' | '25+' | 'prefer-not-to-say';

export const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: 'under-13', label: 'Under 13' },
  { id: '13-15', label: '13 to 15' },
  { id: '16-17', label: '16 to 17' },
  { id: '18-24', label: '18 to 24' },
  { id: '25+', label: '25 or over' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export const PRIVACY_POINTS = [
  'No name, email or phone number needed.',
  'Your checks are encrypted and linked to an anonymous account.',
  // CONFIRM against the AI provider's terms before release.
  'To analyse a check, what you share is sent securely to our AI provider and is not used to train its models.',
  'You can delete any check at any time.',
  'Schools, parents and partners never see what you check.',
];

/** On-device storage keys. The reason never leaves the phone. */
export const ONBOARDING_KEYS = {
  completed: 'onboarding_completed',
  reason: 'onboarding_reason',
  ageBand: 'user_age_range',
  parentCarer: 'user_is_parent_carer',
} as const;
