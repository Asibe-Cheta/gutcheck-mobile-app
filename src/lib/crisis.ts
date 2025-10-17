/**
 * Crisis Detection Service
 * Handles crisis detection and emergency resource management
 */

import { db } from './supabase';
import { Linking, Alert } from 'react-native';

export interface CrisisReport {
  id: string;
  user_id: string;
  analysis_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns: string[];
  emergency_contacts_notified: boolean;
  resources_provided: string[];
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
  resolved_at?: string;
}

export interface CrisisResources {
  emergency: string[];
  helplines: string[];
  support: string[];
  selfHelp: string[];
}

class CrisisDetectionService {
  private crisisResources: CrisisResources = {
    emergency: [
      'Emergency Services: 999',
      'Police: 999',
      'Ambulance: 999',
    ],
    helplines: [
      'Samaritans: 116 123 (24/7)',
      'National Domestic Abuse Helpline: 0808 2000 247 (24/7)',
      'Childline: 0800 1111 (Under 19s)',
      'NSPCC: 0808 800 5000 (Child protection)',
      'Women\'s Aid: 0808 2000 247',
      'Men\'s Advice Line: 0808 801 0327',
    ],
    support: [
      'NHS 111 (Non-emergency medical help)',
      'Mind: 0300 123 3393 (Mental health support)',
      'Crisis Text Line: Text SHOUT to 85258',
    ],
    selfHelp: [
      'Find a safe space immediately',
      'Contact a trusted friend or family member',
      'Document any evidence of abuse',
      'Consider contacting a domestic abuse support service',
    ],
  };

  // Detect crisis from analysis
  async detectCrisis(
    userId: string,
    analysisId: string,
    patterns: any[],
    riskLevel: string,
    content: string
  ): Promise<{ detected: boolean; severity?: string; report?: CrisisReport }> {
    try {
      const crisisIndicators = this.analyzeCrisisIndicators(patterns, content);
      
      if (crisisIndicators.detected) {
        const report = await db.createCrisisReport({
          user_id: userId,
          analysis_id: analysisId,
          severity: crisisIndicators.severity,
          patterns: patterns.map(p => p.type),
          emergency_contacts_notified: false,
          resources_provided: this.getResourcesForSeverity(crisisIndicators.severity),
        });

        return {
          detected: true,
          severity: crisisIndicators.severity,
          report,
        };
      }

      return { detected: false };
    } catch (error) {
      console.error('Crisis detection error:', error);
      return { detected: false };
    }
  }

  // Analyze crisis indicators
  private analyzeCrisisIndicators(patterns: any[], content: string): {
    detected: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    const crisisKeywords = [
      // Critical indicators
      'kill', 'die', 'suicide', 'end it all', 'not worth living',
      'threat', 'harm', 'hurt', 'violence', 'weapon',
      
      // High risk indicators
      'isolated', 'trapped', 'no escape', 'controlled', 'prisoner',
      'afraid', 'scared', 'terrified', 'fear for my life',
      
      // Medium risk indicators
      'manipulated', 'confused', 'doubt myself', 'losing my mind',
      'gaslighted', 'brainwashed', 'controlled',
    ];

    const contentLower = content.toLowerCase();
    const detectedKeywords = crisisKeywords.filter(keyword => 
      contentLower.includes(keyword)
    );

    // Pattern-based detection
    const highRiskPatterns = ['gaslighting', 'coercion', 'isolation', 'stonewalling'];
    const detectedPatterns = patterns.filter(p => 
      highRiskPatterns.includes(p.type) && p.confidence > 0.7
    );

    // Severity assessment
    if (detectedKeywords.some(keyword => 
      ['kill', 'die', 'suicide', 'threat', 'harm', 'violence'].includes(keyword)
    )) {
      return { detected: true, severity: 'critical' };
    }

    if (detectedKeywords.length > 3 || detectedPatterns.length > 2) {
      return { detected: true, severity: 'high' };
    }

    if (detectedKeywords.length > 1 || detectedPatterns.length > 1) {
      return { detected: true, severity: 'medium' };
    }

    if (detectedKeywords.length > 0 || detectedPatterns.length > 0) {
      return { detected: true, severity: 'low' };
    }

    return { detected: false, severity: 'low' };
  }

  // Get resources based on severity
  private getResourcesForSeverity(severity: string): string[] {
    switch (severity) {
      case 'critical':
        return [
          ...this.crisisResources.emergency,
          ...this.crisisResources.helplines,
        ];
      case 'high':
        return [
          ...this.crisisResources.helplines,
          ...this.crisisResources.support,
        ];
      case 'medium':
        return [
          ...this.crisisResources.helplines.slice(0, 3),
          ...this.crisisResources.support,
        ];
      case 'low':
        return [
          ...this.crisisResources.support,
          ...this.crisisResources.selfHelp,
        ];
      default:
        return this.crisisResources.selfHelp;
    }
  }

  // Show crisis alert to user
  showCrisisAlert(severity: string, resources: string[]): void {
    const title = this.getCrisisTitle(severity);
    const message = this.getCrisisMessage(severity, resources);

    Alert.alert(
      title,
      message,
      [
        {
          text: 'Get Help Now',
          style: 'default',
          onPress: () => this.showCrisisResources(severity),
        },
        {
          text: 'I\'m Safe',
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  }

  // Get crisis title based on severity
  private getCrisisTitle(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨 Immediate Support Needed';
      case 'high':
        return '⚠️ High Risk Situation Detected';
      case 'medium':
        return '⚠️ Concerning Patterns Detected';
      case 'low':
        return '💙 Support Available';
      default:
        return 'Support Available';
    }
  }

  // Get crisis message based on severity
  private getCrisisMessage(severity: string, resources: string[]): string {
    const baseMessage = 'We\'ve detected some concerning patterns in your analysis. Your safety and well-being are our top priority.';
    
    switch (severity) {
      case 'critical':
        return `${baseMessage}\n\nIf you\'re in immediate danger, please call 999 right now.`;
      case 'high':
        return `${baseMessage}\n\nPlease consider reaching out to a helpline or trusted person.`;
      case 'medium':
        return `${baseMessage}\n\nWe recommend speaking with someone you trust about this situation.`;
      case 'low':
        return `${baseMessage}\n\nRemember, you\'re not alone and support is available.`;
      default:
        return baseMessage;
    }
  }

  // Show crisis resources
  private showCrisisResources(severity: string): void {
    const resources = this.getResourcesForSeverity(severity);
    
    Alert.alert(
      'Crisis Resources',
      resources.join('\n\n'),
      [
        {
          text: 'Call Emergency (999)',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:999'),
        },
        {
          text: 'Call Samaritans (116 123)',
          style: 'default',
          onPress: () => Linking.openURL('tel:116123'),
        },
        {
          text: 'Close',
          style: 'cancel',
        },
      ]
    );
  }

  // Get all crisis resources
  getAllResources(): CrisisResources {
    return this.crisisResources;
  }

  // Check if user needs follow-up
  async checkFollowUp(userId: string): Promise<CrisisReport[]> {
    try {
      // This would typically query the database for unresolved crisis reports
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Check follow-up error:', error);
      return [];
    }
  }

  // Mark crisis as resolved
  async resolveCrisis(crisisId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would update the crisis report in the database
      // For now, just return success
      return { success: true };
    } catch (error) {
      console.error('Resolve crisis error:', error);
      return { success: false, error: 'Failed to resolve crisis' };
    }
  }

  // Get crisis statistics for user
  async getCrisisStats(userId: string): Promise<{
    totalReports: number;
    resolvedReports: number;
    activeReports: number;
    severityBreakdown: Record<string, number>;
  }> {
    try {
      // This would query the database for crisis statistics
      // For now, return mock data
      return {
        totalReports: 0,
        resolvedReports: 0,
        activeReports: 0,
        severityBreakdown: {},
      };
    } catch (error) {
      console.error('Get crisis stats error:', error);
      return {
        totalReports: 0,
        resolvedReports: 0,
        activeReports: 0,
        severityBreakdown: {},
      };
    }
  }
}

export const crisisService = new CrisisDetectionService();
