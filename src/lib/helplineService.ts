/**
 * Helpline Service
 * Manages crisis helpline information and provides contextual recommendations
 * Multi-region support for UK, US, Canada, and Australia
 */

export type Region = 'UK' | 'US' | 'Canada' | 'Australia';

export interface Helpline {
  name: string;
  number: string;
  description: string;
  icon: string;
  category: 'child' | 'mental-health' | 'abuse' | 'general' | 'emergency';
  availableHours: string;
  keywords: string[]; // Keywords that might trigger this helpline recommendation
  region: Region;
}

export const HELPLINES_BY_REGION: Record<Region, Helpline[]> = {
  UK: [
    {
      name: 'Emergency Services',
      number: '999',
      description: 'Immediate danger - police, ambulance, fire',
      icon: 'warning',
      category: 'emergency',
      region: 'UK',
      availableHours: '24/7',
      keywords: ['emergency', 'danger', 'immediate', 'right now', 'happening now']
    },
    {
      name: 'Childline',
      number: '08001111',
      description: 'Free, confidential support for young people under 19',
      icon: 'people',
      category: 'child',
      region: 'UK',
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
      region: 'UK',
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
      region: 'UK',
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
      region: 'UK',
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
      region: 'UK',
      availableHours: 'Mon-Fri 4pm-11pm',
      keywords: [
        'under 25', 'young adult', 'university', 'college', 'relationship problems',
        'mental health', 'anxiety', 'stress', 'need advice'
      ]
    }
  ],

  US: [
    {
      name: 'Emergency Services',
      number: '911',
      description: 'Immediate danger - police, ambulance, fire',
      icon: 'warning',
      category: 'emergency',
      region: 'US',
      availableHours: '24/7',
      keywords: ['emergency', 'danger', 'immediate', 'right now', 'happening now']
    },
    {
      name: '988 Suicide & Crisis Lifeline',
      number: '988',
      description: '24/7 crisis support and suicide prevention',
      icon: 'heart',
      category: 'mental-health',
      region: 'US',
      availableHours: '24/7',
      keywords: [
        'suicide', 'kill myself', 'end it all', 'depressed', 'hopeless',
        'worthless', 'cant go on', 'want to die', 'self harm', 'cutting'
      ]
    },
    {
      name: 'Crisis Text Line',
      number: '741741',
      description: 'Text HOME to 741741 for crisis support',
      icon: 'chatbubble',
      category: 'mental-health',
      region: 'US',
      availableHours: '24/7',
      keywords: ['text', 'chat', 'message', 'crisis', 'need to talk']
    },
    {
      name: 'National Domestic Violence Hotline',
      number: '18007997233',
      description: '24/7 support for domestic violence victims',
      icon: 'call',
      category: 'abuse',
      region: 'US',
      availableHours: '24/7',
      keywords: [
        'domestic violence', 'domestic abuse', 'hitting', 'beating', 'physical abuse',
        'controlling', 'threatening', 'violence', 'assault', 'afraid', 'scared of partner'
      ]
    },
    {
      name: 'Childhelp National Child Abuse Hotline',
      number: '18004224453',
      description: 'Support for children and adults concerned about child abuse',
      icon: 'shield-checkmark',
      category: 'child',
      region: 'US',
      availableHours: '24/7',
      keywords: [
        'child abuse', 'child protection', 'safeguarding', 'neglect',
        'unsafe', 'danger', 'hurt', 'touching', 'inappropriate'
      ]
    },
    {
      name: 'RAINN National Sexual Assault Hotline',
      number: '18006564673',
      description: 'Support for survivors of sexual assault',
      icon: 'shield',
      category: 'abuse',
      region: 'US',
      availableHours: '24/7',
      keywords: ['sexual assault', 'rape', 'assault', 'abuse', 'survivor']
    }
  ],

  Canada: [
    {
      name: 'Emergency Services',
      number: '911',
      description: 'Immediate danger - police, ambulance, fire',
      icon: 'warning',
      category: 'emergency',
      region: 'Canada',
      availableHours: '24/7',
      keywords: ['emergency', 'danger', 'immediate', 'right now', 'happening now']
    },
    {
      name: 'Canada Suicide Prevention Service',
      number: '18334564566',
      description: '24/7 suicide prevention and crisis support',
      icon: 'heart',
      category: 'mental-health',
      region: 'Canada',
      availableHours: '24/7',
      keywords: [
        'suicide', 'kill myself', 'end it all', 'depressed', 'hopeless',
        'worthless', 'cant go on', 'want to die', 'self harm', 'cutting'
      ]
    },
    {
      name: 'Crisis Text Line Canada',
      number: '686868',
      description: 'Text CONNECT to 686868 for crisis support',
      icon: 'chatbubble',
      category: 'mental-health',
      region: 'Canada',
      availableHours: '24/7',
      keywords: ['text', 'chat', 'message', 'crisis', 'need to talk']
    },
    {
      name: 'Kids Help Phone',
      number: '18006686868',
      description: 'Support for young people under 20',
      icon: 'people',
      category: 'child',
      region: 'Canada',
      availableHours: '24/7',
      keywords: [
        'young', 'child', 'teenager', 'teen', 'school', 'under 20',
        'scared', 'worried', 'confused', 'lonely'
      ]
    },
    {
      name: 'Canadian Resource Centre for Victims of Crime',
      number: '18775328506',
      description: 'Support for victims of crime and abuse',
      icon: 'shield-checkmark',
      category: 'abuse',
      region: 'Canada',
      availableHours: 'Mon-Fri 9am-5pm ET',
      keywords: [
        'victim', 'crime', 'abuse', 'assault', 'violence', 'help'
      ]
    }
  ],

  Australia: [
    {
      name: 'Emergency Services',
      number: '000',
      description: 'Immediate danger - police, ambulance, fire',
      icon: 'warning',
      category: 'emergency',
      region: 'Australia',
      availableHours: '24/7',
      keywords: ['emergency', 'danger', 'immediate', 'right now', 'happening now']
    },
    {
      name: 'Lifeline Australia',
      number: '131114',
      description: '24/7 crisis support and suicide prevention',
      icon: 'heart',
      category: 'mental-health',
      region: 'Australia',
      availableHours: '24/7',
      keywords: [
        'suicide', 'kill myself', 'end it all', 'depressed', 'hopeless',
        'worthless', 'cant go on', 'want to die', 'self harm', 'cutting'
      ]
    },
    {
      name: 'Beyond Blue',
      number: '1300224636',
      description: '24/7 support for depression, anxiety and mental health',
      icon: 'heart',
      category: 'mental-health',
      region: 'Australia',
      availableHours: '24/7',
      keywords: [
        'depression', 'anxiety', 'mental health', 'stressed', 'worried',
        'anxious', 'depressed', 'overwhelmed'
      ]
    },
    {
      name: '1800RESPECT',
      number: '1800737732',
      description: 'National domestic, family and sexual violence counselling',
      icon: 'call',
      category: 'abuse',
      region: 'Australia',
      availableHours: '24/7',
      keywords: [
        'domestic violence', 'domestic abuse', 'sexual violence', 'family violence',
        'controlling', 'threatening', 'violence', 'assault', 'afraid'
      ]
    },
    {
      name: 'Kids Helpline',
      number: '1800551800',
      description: 'Free counselling for young people aged 5-25',
      icon: 'people',
      category: 'child',
      region: 'Australia',
      availableHours: '24/7',
      keywords: [
        'young', 'child', 'teenager', 'teen', 'school', 'under 25',
        'scared', 'worried', 'confused', 'lonely'
      ]
    },
    {
      name: 'MensLine Australia',
      number: '1300789978',
      description: 'Support for men dealing with relationship and family concerns',
      icon: 'man',
      category: 'general',
      region: 'Australia',
      availableHours: '24/7',
      keywords: [
        'man', 'male', 'men', 'relationship problems', 'family issues',
        'father', 'husband', 'boyfriend'
      ]
    }
  ]
};

// Legacy export for backward compatibility - defaults to UK
export const HELPLINES: Helpline[] = HELPLINES_BY_REGION.UK;

/**
 * Detect region from user-provided region string
 */
export function detectRegion(userRegion: string | null | undefined): Region {
  if (!userRegion) return 'UK'; // Default to UK

  const normalized = userRegion.toLowerCase();
  
  // US detection
  if (normalized.includes('us') || normalized.includes('usa') || 
      normalized.includes('united states') || normalized.includes('america')) {
    return 'US';
  }
  
  // Canada detection
  if (normalized.includes('canada') || normalized.includes('canadian')) {
    return 'Canada';
  }
  
  // Australia detection
  if (normalized.includes('australia') || normalized.includes('aussie') || 
      normalized.includes('sydney') || normalized.includes('melbourne')) {
    return 'Australia';
  }
  
  // UK detection (also default)
  if (normalized.includes('uk') || normalized.includes('united kingdom') || 
      normalized.includes('britain') || normalized.includes('england') ||
      normalized.includes('scotland') || normalized.includes('wales') ||
      normalized.includes('northern ireland') || normalized.includes('london')) {
    return 'UK';
  }
  
  return 'UK'; // Default fallback
}

/**
 * Get helplines for a specific region
 */
export function getHelplinesForRegion(region: Region): Helpline[] {
  return HELPLINES_BY_REGION[region] || HELPLINES_BY_REGION.UK;
}

/**
 * Get relevant helplines based on conversation context and user region
 */
export function getRelevantHelplines(context: string, userRegion?: string | null): Helpline[] {
  const region = detectRegion(userRegion);
  const regionHelplines = getHelplinesForRegion(region);
  
  const lowerContext = context.toLowerCase();
  const relevantHelplines: Array<{ helpline: Helpline; matchCount: number }> = [];

  for (const helpline of regionHelplines) {
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
 * Get helpline recommendation message based on severity and region
 */
export function getHelplineRecommendationMessage(
  isCrisis: boolean, 
  isDanger: boolean,
  helplines: Helpline[],
  userRegion?: string | null
): string {
  const region = detectRegion(userRegion);
  const emergencyNumber = region === 'US' || region === 'Canada' ? '911' :
                         region === 'Australia' ? '000' : '999';
  
  if (isDanger) {
    return `\n\n⚠️ **IMMEDIATE DANGER**: If you are in immediate danger, please call ${emergencyNumber} (emergency services) or go to a safe place right now.${formatHelplineForAI(helplines)}`;
  }

  if (isCrisis) {
    return `\n\n🆘 **Crisis Support Available**: What you're going through sounds really serious. Please consider reaching out to one of these helplines - they're trained to help with exactly this kind of situation:${formatHelplineForAI(helplines)}`;
  }

  if (helplines.length > 0) {
    return `\n\n💙 **Additional Support**: You don't have to go through this alone. Here are some organizations that can provide professional support:${formatHelplineForAI(helplines)}`;
  }

  return '';
}

