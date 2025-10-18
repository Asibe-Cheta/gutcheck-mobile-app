/**
 * Helpline Service
 * Manages crisis helpline information and provides contextual recommendations
 */

export interface Helpline {
  name: string;
  number: string;
  description: string;
  icon: string;
  category: 'child' | 'mental-health' | 'abuse' | 'general';
  availableHours: string;
  keywords: string[]; // Keywords that might trigger this helpline recommendation
}

export const HELPLINES: Helpline[] = [
  {
    name: 'Childline',
    number: '08001111',
    description: 'Free, confidential support for young people under 19',
    icon: 'people',
    category: 'child',
    availableHours: '24/7',
    keywords: [
      'young', 'child', 'teenager', 'teen', 'school', 'parent', 'family',
      'under 19', 'scared', 'worried', 'confused', 'lonely'
    ]
  },
  {
    name: 'Samaritans',
    number: '116123',
    description: '24/7 confidential emotional support for anyone in distress',
    icon: 'heart',
    category: 'mental-health',
    availableHours: '24/7',
    keywords: [
      'suicide', 'kill myself', 'end it all', 'depressed', 'hopeless',
      'worthless', 'cant go on', 'want to die', 'self harm', 'cutting'
    ]
  },
  {
    name: 'NSPCC',
    number: '08088005000',
    description: 'For adults concerned about a child at risk',
    icon: 'shield-checkmark',
    category: 'child',
    availableHours: '24/7',
    keywords: [
      'abuse', 'neglect', 'child abuse', 'child protection', 'safeguarding',
      'unsafe', 'danger', 'hurt', 'touching', 'inappropriate'
    ]
  },
  {
    name: 'National Domestic Abuse Helpline',
    number: '08082000247',
    description: 'Free, confidential support for anyone experiencing domestic abuse',
    icon: 'call',
    category: 'abuse',
    availableHours: '24/7',
    keywords: [
      'domestic violence', 'domestic abuse', 'hitting', 'beating', 'physical abuse',
      'controlling', 'threatening', 'violence', 'assault', 'afraid', 'scared of partner',
      'hurt me', 'punched', 'kicked', 'strangled', 'forced'
    ]
  },
  {
    name: 'The Mix',
    number: '08088084994',
    description: 'Free support for under 25s via phone, email, or webchat',
    icon: 'chatbubbles',
    category: 'general',
    availableHours: 'Mon-Fri 4pm-11pm',
    keywords: [
      'under 25', 'young adult', 'university', 'college', 'relationship problems',
      'mental health', 'anxiety', 'stress', 'need advice'
    ]
  },
  {
    name: 'Refuge (Women)',
    number: '08082000247',
    description: 'Support for women experiencing domestic violence',
    icon: 'woman',
    category: 'abuse',
    availableHours: '24/7',
    keywords: [
      'boyfriend', 'husband', 'partner', 'woman', 'female', 'domestic violence',
      'controlling boyfriend', 'abusive partner', 'leaving relationship'
    ]
  },
  {
    name: "Men's Advice Line",
    number: '08088010327',
    description: 'Support for men experiencing domestic abuse',
    icon: 'man',
    category: 'abuse',
    availableHours: 'Mon-Fri 9am-8pm',
    keywords: [
      'girlfriend', 'wife', 'male victim', 'man', 'male', 'domestic abuse man',
      'controlling girlfriend', 'abusive wife'
    ]
  }
];

/**
 * Get relevant helplines based on conversation context
 */
export function getRelevantHelplines(context: string): Helpline[] {
  const lowerContext = context.toLowerCase();
  const relevantHelplines: Array<{ helpline: Helpline; matchCount: number }> = [];

  for (const helpline of HELPLINES) {
    let matchCount = 0;
    
    // Count keyword matches
    for (const keyword of helpline.keywords) {
      if (lowerContext.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      relevantHelplines.push({ helpline, matchCount });
    }
  }

  // Sort by match count (highest first) and return top 3
  return relevantHelplines
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(item => item.helpline);
}

/**
 * Get all helplines by category
 */
export function getHelplinesByCategory(category: Helpline['category']): Helpline[] {
  return HELPLINES.filter(h => h.category === category);
}

/**
 * Check if the conversation indicates a crisis situation
 */
export function isCrisisSituation(text: string): boolean {
  const lowerText = text.toLowerCase();
  const crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'want to die', 'self harm',
    'cutting', 'hurt myself', 'cant take it anymore', 'no point living',
    'better off dead', 'end my life', 'overdose', 'jump off'
  ];

  return crisisKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if immediate danger is indicated
 */
export function isImmediateDanger(text: string): boolean {
  const lowerText = text.toLowerCase();
  const dangerKeywords = [
    'right now', 'happening now', 'currently', 'at this moment',
    'as we speak', 'about to', 'going to hurt', 'in danger now'
  ];

  const violenceKeywords = [
    'hitting', 'beating', 'hurting', 'attacking', 'threatening',
    'violence', 'weapon', 'knife', 'gun'
  ];

  const hasDangerTiming = dangerKeywords.some(keyword => lowerText.includes(keyword));
  const hasViolence = violenceKeywords.some(keyword => lowerText.includes(keyword));

  return hasDangerTiming && hasViolence;
}

/**
 * Format phone number with spaces for display
 */
function formatPhoneNumber(number: string): string {
  // Remove all spaces first
  const cleaned = number.replace(/\s/g, '');
  
  // Format based on number pattern
  if (cleaned.length === 7) {
    // 0800 1111
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  } else if (cleaned.length === 6) {
    // 116 123
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length === 11) {
    // 0808 800 5000 or 0808 808 4994
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  // Default: add space every 4 digits
  return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Format helpline information for AI response
 */
export function formatHelplineForAI(helplines: Helpline[]): string {
  if (helplines.length === 0) return '';

  let formatted = '\n\n**Support Available:**\n';
  
  for (const helpline of helplines) {
    const formattedNumber = formatPhoneNumber(helpline.number);
    formatted += `\n**${helpline.name}**: ${formattedNumber}\n`;
    formatted += `${helpline.description} (${helpline.availableHours})\n`;
  }

  return formatted;
}

/**
 * Get helpline recommendation message based on severity
 */
export function getHelplineRecommendationMessage(
  isCrisis: boolean, 
  isDanger: boolean,
  helplines: Helpline[]
): string {
  if (isDanger) {
    return `\n\n⚠️ **IMMEDIATE DANGER**: If you are in immediate danger, please call 999 (emergency services) or go to a safe place right now.${formatHelplineForAI(helplines)}`;
  }

  if (isCrisis) {
    return `\n\n🆘 **Crisis Support Available**: What you're going through sounds really serious. Please consider reaching out to one of these helplines - they're trained to help with exactly this kind of situation:${formatHelplineForAI(helplines)}`;
  }

  if (helplines.length > 0) {
    return `\n\n💙 **Additional Support**: You don't have to go through this alone. Here are some organizations that can provide professional support:${formatHelplineForAI(helplines)}`;
  }

  return '';
}

