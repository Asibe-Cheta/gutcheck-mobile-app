/**
 * AI Analysis Service
 * Handles AI-powered analysis of relationship interactions
 * Supports OpenAI and Google Gemini (via Supabase edge proxy).
 */

import { db } from './supabase';
import { Pattern, Analysis } from '@/types';
import Constants from 'expo-constants';
import { 
  getRelevantHelplines, 
  isCrisisSituation, 
  isImmediateDanger, 
  getHelplineRecommendationMessage 
} from './helplineService';
import { profileService } from './profileService';
import * as Crypto from 'expo-crypto';
import { isSupabaseConfigured, readPublicEnv } from './supabase';

function getClaudeTransportConfig() {
  const supabaseUrl = readPublicEnv('EXPO_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = readPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  // Gemini key should be kept server-side inside the Supabase edge function secret.
  // We keep this only for optional debug / direct fallback.
  const apiKey = readPublicEnv('EXPO_PUBLIC_GEMINI_API_KEY');
  const edgeProxyEnabled = isSupabaseConfigured() && !!supabaseUrl && !!supabaseAnonKey;
  // Default to edge proxy so OTA doesn't require embedding the Gemini key in the binary.
  const directEnabled = false;
  return { supabaseUrl, supabaseAnonKey, apiKey, edgeProxyEnabled, directEnabled };
}

export interface AIAnalysisResult {
  analysis: {
    id: string;
    confidence_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    recommendations: string[];
    educational_content: string;
  };
  patterns: Pattern[];
  crisis_detected: boolean;
  crisis_severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIConfig {
  provider: 'openai' | 'gemini';
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface ConversationState {
  stage: 'initial' | 'gathering' | 'analysis' | 'support';
  messagesExchanged: number;
  hasImage?: boolean;
  imageAnalyzed?: boolean;
  contextGathered: {
    relationshipType?: string;
    duration?: string;
    specificIncident?: boolean;
    emotionalImpact?: boolean;
    patternHistory?: boolean;
  };
}

export interface ConversationResponse {
  response: string;
  nextStage: ConversationState['stage'];
  shouldAnalyze?: boolean;
  safeguardCategory?: SafeguardCategory;
  crisisCard?: CrisisCardPayload;
  patternCard?: PatternResponsePayload;
}

export type SafeguardCategory = 'A' | 'B' | 'C' | 'D';

import {
  SAFEGUARD_READBACK_TEMPLATES,
  buildCrisisCardPayload,
  APPROVED_CLOSERS,
  FORBIDDEN_CLOSER_PATTERNS,
  FIRST_PERSON_PATTERNS,
  CRISIS_ACKNOWLEDGEMENT,
  CRISIS_BOUNDARY,
  type CrisisCardPayload,
} from './safeguardTemplates';
import {
  runLayerAClassifier,
  parseLayerBVerdict,
  shouldRouteToCrisisFromLayerB,
  LAYER_B_CLASSIFIER_SYSTEM_PROMPT,
  PATTERN_RESPONSE_SYSTEM_PROMPT,
  parseAndValidatePatternResponse,
  formatPatternResponseText,
  formatCrisisResponseText,
  RISK_CLASSIFIER_VERSION,
  type PatternResponsePayload,
} from './responsePipeline';

export { SAFEGUARD_READBACK_TEMPLATES };
export type { CrisisCardPayload, PatternResponsePayload };

class AIAnalysisService {
  private config: AIConfig;

  constructor() {
    this.config = {
      // Cheaper + generally strong for safety-style guidance.
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      max_tokens: 2000,
      temperature: 0.3,
    };
  }

  /**
   * Get user profile context for AI
   * Returns basic context (username, age, location) always
   * Returns struggles/goals only when includePersonalContext is true
   */
  /**
   * Get user region from profile or AsyncStorage (consistent with getUserProfileContext)
   */
  private async userLikelyUnder19(): Promise<boolean> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const profile = await profileService.getProfile();
      const ageRange = await AsyncStorage.getItem('user_age_range');
      const ageStr = (profile?.age?.toString() || profile?.age_range || ageRange || '').toLowerCase();
      if (!ageStr) return false;
      if (ageStr === 'prefer-not-to-say') return true;
      if (ageStr.includes('13') || ageStr.includes('14') || ageStr.includes('15') || ageStr.includes('16') || ageStr.includes('17') || ageStr.includes('18')) {
        return true;
      }
      if (ageStr.includes('under') && (ageStr.includes('19') || ageStr.includes('18'))) return true;
      const num = parseInt(ageStr, 10);
      return !Number.isNaN(num) && num <= 18;
    } catch {
      return false;
    }
  }

  private async getUserRegion(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Get profile from database/service
      const profile = await profileService.getProfile();
      
      // Get region from AsyncStorage as fallback (from onboarding)
      const region = await AsyncStorage.getItem('user_region');
      
      // Determine region - prefer profile.region, then AsyncStorage
      return profile?.region || region || null;
    } catch (error) {
      console.error('Error getting user region:', error);
      return null;
    }
  }

  private async getUserProfileContext(includePersonalContext: boolean = false): Promise<string> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Get profile from database/service
      const profile = await profileService.getProfile();
      
      // Get age and region from AsyncStorage as fallback (from onboarding)
      const ageRange = await AsyncStorage.getItem('user_age_range');
      const region = await AsyncStorage.getItem('user_region');
      
      // Determine age - prefer profile.age, then age_range from profile, then AsyncStorage
      let userAge: string | undefined = undefined;
      if (profile?.age) {
        userAge = profile.age.toString();
      } else if (profile?.age_range) {
        userAge = profile.age_range;
      } else if (ageRange) {
        userAge = ageRange;
      }
      
      // Determine region - prefer profile.region, then AsyncStorage
      let userRegion: string | undefined = profile?.region || region || undefined;
      
      // If we have at least username, age, or region, build context
      if (!profile && !userAge && !userRegion) {
        return '';
      }

      // Always include basic information
      let context = `\n\nUSER PROFILE CONTEXT:\n`;
      
      if (profile?.username) {
        context += `- Username: ${profile.username}\n`;
      }
      
      if (userAge) {
        context += `- Age: ${userAge}\n`;
      }
      
      if (userRegion) {
        context += `- Location/Region: ${userRegion}\n`;
      }

      // Only include personal struggles/goals if requested
      if (includePersonalContext && profile) {
        if (profile.struggles && profile.struggles.trim()) {
          context += `- Personal challenges: ${profile.struggles}\n`;
        }
        if (profile.goals && profile.goals.trim()) {
          context += `- Working on: ${profile.goals}\n`;
        }
      }

      return context;
    } catch (error) {
      console.error('Error getting profile context:', error);
      return '';
    }
  }

  /**
   * Determine if personal context (struggles/goals) is relevant
   * Based on conversation content and keywords
   */
  private shouldIncludePersonalContext(conversationText: string): boolean {
    const lowerText = conversationText.toLowerCase();
    
    // Keywords that indicate personal context might be relevant
    const relevantKeywords = [
      'struggle', 'struggling', 'difficult', 'hard time', 'challenge',
      'anxious', 'anxiety', 'depressed', 'depression', 'self-esteem',
      'confidence', 'trust', 'trauma', 'past', 'afraid', 'scared',
      'insecure', 'worth', 'worthless', 'good enough', 'not enough',
      'addiction', 'substance', 'drinking', 'drugs', 'cope', 'coping',
      'therapy', 'counseling', 'help', 'support', 'advice',
      'work on', 'improve', 'better', 'change', 'grow', 'growth'
    ];

    // Check if any relevant keywords are present
    return relevantKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Main analysis function
  async analyzeInteraction(
    content: string,
    userId: string | null,
    context?: {
      previousAnalyses?: any[];
      userProfile?: any;
      relationshipContext?: string;
    }
  ): Promise<AIAnalysisResult> {
    try {
      // Create initial analysis record
      const analysis = await db.createAnalysis({
        user_id: userId,
        content,
        status: 'processing',
      });

      // Get AI analysis
      const aiResult = await this.getAIAnalysis(content, context);

      // Update analysis with results
      const updatedAnalysis = await db.updateAnalysis(analysis.id, {
        status: 'completed',
        confidence_score: aiResult.confidence_score,
        risk_level: aiResult.risk_level,
        summary: aiResult.summary,
        recommendations: aiResult.recommendations,
        educational_content: aiResult.educational_content,
        completed_at: new Date().toISOString(),
      });

      // Create pattern records
      const patterns = await this.createPatterns(analysis.id, aiResult.patterns);

      // Check for crisis situations
      const crisisResult = await this.checkCrisisSituation(
        userId, 
        analysis.id, 
        aiResult.patterns, 
        aiResult.risk_level
      );

      return {
        analysis: updatedAnalysis,
        patterns,
        crisis_detected: crisisResult.detected,
        crisis_severity: crisisResult.severity,
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze interaction');
    }
  }

  // Get AI analysis from provider
  private async getAIAnalysis(
    content: string, 
    context?: any
  ): Promise<{
    confidence_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    summary: string;
    recommendations: string[];
    educational_content: string;
    patterns: any[];
  }> {

    const prompt = this.buildAnalysisPrompt(content, context);

    if (this.config.provider === 'openai') return await this.analyzeWithOpenAI(prompt);
    if (this.config.provider === 'gemini') return await this.analyzeWithGemini(prompt);
    throw new Error(`Unsupported AI provider: ${(this.config as any)?.provider}`);
  }


  // Build analysis prompt
  private buildAnalysisPrompt(content: string, context?: any): string {
    return `
You are an expert relationship counselor and manipulation detection specialist. Analyze the following interaction for potential manipulation patterns and provide insights.

INTERACTION TO ANALYZE:
"${content}"

CONTEXT:
${context?.relationshipContext || 'No specific relationship context provided'}

ANALYSIS REQUIREMENTS:
1. Identify manipulation patterns from this list: gaslighting, love-bombing, isolation, coercion, negging, guilt-tripping, triangulation, stonewalling, projection, darvo
2. Assess risk level: low, medium, high, or critical
3. Provide confidence score (0.0 to 1.0)
4. Give actionable recommendations
5. Include educational content about detected patterns

RESPONSE FORMAT (JSON):
{
  "confidence_score": 0.85,
  "risk_level": "medium",
  "summary": "Brief summary of the interaction and key concerns",
  "recommendations": [
    "Specific actionable advice 1",
    "Specific actionable advice 2"
  ],
  "educational_content": "Educational explanation of detected patterns",
  "patterns": [
    {
      "type": "gaslighting",
      "confidence": 0.8,
      "description": "Description of how this pattern appears",
      "examples": ["Specific examples from the text"],
      "severity": "medium"
    }
  ]
}

IMPORTANT:
- Be empathetic and supportive
- Focus on the user's well-being
- Provide practical, actionable advice
- Use clear, non-technical language
- If no manipulation is detected, still provide supportive guidance
- Always prioritize the user's safety and mental health
`;
  }

  // OpenAI analysis
  private async analyzeWithOpenAI(prompt: string): Promise<any> {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert relationship counselor specializing in manipulation detection. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response from AI service');
    }
  }

  // Gemini analysis (for JSON responses)
  private async analyzeWithGemini(prompt: string): Promise<any> {
    const { supabaseUrl, supabaseAnonKey, edgeProxyEnabled } = getClaudeTransportConfig();

    if (!edgeProxyEnabled || !supabaseUrl) {
      throw new Error(
        'AI is not configured. Deploy Supabase Edge Function `gemini-proxy` and set Supabase secret `GEMINI_API_KEY`.'
      );
    }

    const url = `${supabaseUrl}/functions/v1/gemini-proxy`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Gemini API error in analyzeWithGemini:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        transport: 'supabase-edge',
        model: this.config.model,
      });
      throw new Error(`Gemini API ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    try {
      // Handle markdown code blocks that Anthropic sometimes returns
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Failed to parse Gemini response:', content);
      throw new Error('Invalid response from AI service');
    }
  }

  // Gemini conversational response (for plain text responses)
  private async getConversationalResponse(prompt: string): Promise<string> {
    const { supabaseUrl, supabaseAnonKey, edgeProxyEnabled } = getClaudeTransportConfig();

    if (!edgeProxyEnabled || !supabaseUrl) {
      throw new Error(
        'AI is not configured. Deploy Supabase Edge Function `gemini-proxy` and set Supabase secret `GEMINI_API_KEY`.'
      );
    }

    const url = `${supabaseUrl}/functions/v1/gemini-proxy`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.max_tokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[AI] Gemini API error in getConversationalResponse:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
          transport: 'supabase-edge',
          model: this.config.model,
        });
        throw new Error(`Gemini API ${response.status}: ${errorBody.substring(0, 200)}`);
      }

    const data = await response.json();
    return data.content[0].text.trim();
  }

  // Create pattern records
  private async createPatterns(analysisId: string, patterns: any[]): Promise<Pattern[]> {
    const createdPatterns: Pattern[] = [];

    for (const pattern of patterns) {
      try {
        const createdPattern = await db.createPattern({
          analysis_id: analysisId,
          type: pattern.type,
          confidence: pattern.confidence,
          description: pattern.description,
          educational_content: pattern.educational_content || '',
          examples: pattern.examples || [],
        });

        createdPatterns.push(createdPattern);
      } catch (error) {
        console.error('Failed to create pattern:', error);
      }
    }

    return createdPatterns;
  }

  // Check for crisis situations
  private async checkCrisisSituation(
    userId: string | null,
    analysisId: string,
    patterns: any[],
    riskLevel: string
  ): Promise<{ detected: boolean; severity?: 'low' | 'medium' | 'high' | 'critical' }> {
    // Crisis indicators
    const crisisIndicators = [
      'threats of self-harm',
      'suicidal ideation',
      'extreme isolation',
      'severe emotional abuse',
      'physical threats',
      'stalking behavior',
      'financial control',
      'complete social isolation',
    ];

    const highRiskPatterns = [
      'gaslighting',
      'coercion',
      'isolation',
      'stonewalling',
    ];

    // Check for crisis indicators in patterns
    const hasCrisisIndicators = patterns.some(pattern => 
      crisisIndicators.some(indicator => 
        pattern.description.toLowerCase().includes(indicator)
      )
    );

    const hasHighRiskPatterns = patterns.some(pattern => 
      highRiskPatterns.includes(pattern.type) && pattern.confidence > 0.7
    );

    const isCriticalRisk = riskLevel === 'critical';

    if (hasCrisisIndicators || hasHighRiskPatterns || isCriticalRisk) {
      const severity = isCriticalRisk ? 'critical' : 
                      hasCrisisIndicators ? 'high' : 'medium';

      // Create crisis report
      await db.createCrisisReport({
        user_id: userId,
        analysis_id: analysisId,
        severity,
        patterns: patterns.map(p => p.type),
        emergency_contacts_notified: false,
        resources_provided: this.getCrisisResources(severity),
      });

      return { detected: true, severity };
    }

    return { detected: false };
  }

  // Get crisis resources based on severity
  private getCrisisResources(severity: string): string[] {
    const baseResources = [
      'National Domestic Abuse Helpline: 0808 2000 247',
      'Samaritans: 116 123',
      'Childline: 0800 1111',
    ];

    if (severity === 'critical') {
      return [
        'Emergency Services: 999',
        ...baseResources,
        'NSPCC: 0808 800 5000',
      ];
    }

    return baseResources;
  }

  // Get educational content
  async getEducationalContent(category?: string): Promise<any[]> {
    try {
      return await db.getEducationalContent(category);
    } catch (error) {
      console.error('Failed to get educational content:', error);
      return [];
    }
  }

  // Analyze pattern trends
  async analyzePatternTrends(userId: string | null, timeframe: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalAnalyses: number;
    patternCounts: Record<string, number>;
    riskTrend: 'improving' | 'stable' | 'worsening';
    recommendations: string[];
  }> {
    try {
      const analyses = await db.getAnalyses(userId, 50);
      
      const patternCounts: Record<string, number> = {};
      let totalAnalyses = 0;
      let highRiskCount = 0;

      for (const analysis of analyses) {
        if (analysis.status === 'completed') {
          totalAnalyses++;
          
          if (analysis.risk_level === 'high' || analysis.risk_level === 'critical') {
            highRiskCount++;
          }

          const patterns = await db.getPatterns(analysis.id);
          for (const pattern of patterns) {
            patternCounts[pattern.type] = (patternCounts[pattern.type] || 0) + 1;
          }
        }
      }

      const highRiskPercentage = totalAnalyses > 0 ? highRiskCount / totalAnalyses : 0;
      const riskTrend = highRiskPercentage > 0.3 ? 'worsening' : 
                       highRiskPercentage < 0.1 ? 'improving' : 'stable';

      const recommendations = this.generateTrendRecommendations(patternCounts, riskTrend);

      return {
        totalAnalyses,
        patternCounts,
        riskTrend,
        recommendations,
      };
    } catch (error) {
      console.error('Failed to analyze pattern trends:', error);
      return {
        totalAnalyses: 0,
        patternCounts: {},
        riskTrend: 'stable',
        recommendations: [],
      };
    }
  }

  // Generate recommendations based on trends
  private generateTrendRecommendations(
    patternCounts: Record<string, number>, 
    riskTrend: 'improving' | 'stable' | 'worsening'
  ): string[] {
    const recommendations: string[] = [];

    if (riskTrend === 'worsening') {
      recommendations.push('Consider seeking professional counseling support');
      recommendations.push('Focus on building stronger boundaries');
    }

    const topPattern = Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)[0];

    if (topPattern) {
      const [pattern, count] = topPattern;
      recommendations.push(`Focus on recognizing and addressing ${pattern} patterns`);
    }

    if (Object.keys(patternCounts).length > 3) {
      recommendations.push('Consider taking a break from this relationship');
      recommendations.push('Seek support from trusted friends or family');
    }

    return recommendations;
  }

  // Humanistic Conversation Methods

  /**
   * Determines if we should respond immediately or ask questions first
   */
  private shouldRespondImmediately(userMessage: string, hasImage: boolean): boolean {
    // Check for uploaded screenshot/image
    if (hasImage) {
      return true; // Screenshots show full context
    }
    
    // Check for explicit manipulation quotes
    const manipulationQuotes = [
      'you\'re crazy',
      'that never happened',
      'you\'re too sensitive',
      'if you loved me you\'d',
      'everyone thinks you\'re',
      'no one else would want you',
      'I\'ll kill myself if you leave',
      'you\'re making it up',
      'that\'s not what happened',
      'you\'re overreacting'
    ];
    
    const hasExplicitManipulation = manipulationQuotes.some(
      quote => userMessage.toLowerCase().includes(quote)
    );
    
    // Check for danger keywords
    const dangerKeywords = [
      'threatened to',
      'said he\'d hurt',
      'showed me a weapon',
      'followed me home',
      'won\'t leave me alone',
      'meet me alone',
      'don\'t tell anyone',
      'hurt myself',
      'kill myself'
    ];
    
    const hasDanger = dangerKeywords.some(
      keyword => userMessage.toLowerCase().includes(keyword)
    );
    
    return hasExplicitManipulation || hasDanger;
  }

  /**
   * Deterministic safeguard classifier for A/B/C/D routing.
   * A: crisis/immediate danger (pipeline Stage 1 Layer A)
   * B: attachment/dependency framing toward the app
   * C: personal disclosure requiring direct support signposting
   * D: standard path
   */
  private classifySafeguardCategory(message: string): SafeguardCategory {
    const text = message.toLowerCase();

    // Stage 1 Layer A — crisis interrupt (versioned phrase list)
    if (runLayerAClassifier(message).matched) return 'A';

    const categoryBKeywords = [
      'you are my only friend', 'don\'t leave me', 'stay with me',
      'i need you only', 'you are all i have', 'i love you',
      'be my friend', 'are you my friend', 'please don\'t go',
      'talk to me forever', 'you are my companion'
    ];

    const categoryCKeywords = [
      'i was abused', 'i am being abused', 'i was assaulted', 'i was raped',
      'he touched me', 'she touched me', 'they touched me', 'i was groomed',
      'blackmail', 'sextorted', 'forced me', 'coerced me', 'molested'
    ];

    if (this.isLikelyAttachmentToApp(text) && categoryBKeywords.some((keyword) => text.includes(keyword))) return 'B';
    if (categoryCKeywords.some((keyword) => text.includes(keyword))) return 'C';
    return 'D';
  }

  /** Stage 2 — static crisis template; never model-generated body. */
  private async buildStage2CrisisResponse(
    userMessage: string,
    nextStage: ConversationState['stage'] = 'support'
  ): Promise<ConversationResponse> {
    const region = await this.getUserRegion();
    const includeChildline = await this.userLikelyUnder19();
    const crisisCard = buildCrisisCardPayload(region, {
      ideationOnly: true,
      includeChildline,
    });

    const primary = crisisCard.helplines[0];
    const primaryLabel = primary
      ? `Call ${primary.name} now — ${primary.displayNumber}`
      : 'Call Samaritans now — 116 123';
    const secondary = crisisCard.helplines.find((h) => h.smsNumber);
    const secondaryLine = secondary
      ? `You can also text ${secondary.smsBody || 'SHOUT'} to ${secondary.smsNumber} for free, 24/7 confidential support.`
      : 'You can also text SHOUT to 85258 for free, 24/7 confidential support.';

    void this.logSafeguardAuditEvent('A', userMessage);
    void this.logPipelineRiskEvent('crisis', userMessage);

    return {
      response: formatCrisisResponseText({
        acknowledgement: CRISIS_ACKNOWLEDGEMENT,
        primaryLabel,
        secondaryLine,
        groundingLine: crisisCard.groundingLine,
        boundary: CRISIS_BOUNDARY,
      }),
      nextStage,
      shouldAnalyze: false,
      safeguardCategory: 'A',
      crisisCard,
    };
  }

  /** Stage 1 Layer B — narrow classification call only (no user-facing draft). */
  private async runLayerBRiskClassifier(userMessage: string): Promise<boolean> {
    try {
      const raw = await this.getDirectClaudeResponse(
        [{ role: 'user', content: userMessage.trim() }],
        LAYER_B_CLASSIFIER_SYSTEM_PROMPT,
        false,
        undefined,
        undefined
      );
      const verdict = parseLayerBVerdict(raw);
      if (!verdict) return false;
      console.log('[PIPELINE] Layer B verdict', {
        version: RISK_CLASSIFIER_VERSION,
        risk_level: verdict.risk_level,
        confidence: verdict.confidence,
        categories: verdict.categories,
      });
      if (shouldRouteToCrisisFromLayerB(verdict)) {
        void this.logPipelineRiskEvent(verdict.risk_level, userMessage);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[PIPELINE] Layer B classifier failed; continuing standard path:', error);
      return false;
    }
  }

  private async logPipelineRiskEvent(
    riskLevel: string,
    message: string
  ): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const key = '@pipeline_risk_events_v1';
      const raw = await AsyncStorage.getItem(key);
      const parsed: Array<{
        risk_level: string;
        timestamp: string;
        classifier_version: string;
        messageLength: number;
        messageFingerprint: string;
      }> = raw ? JSON.parse(raw) : [];

      const fingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message.trim().toLowerCase().slice(0, 400)
      );

      parsed.push({
        risk_level: riskLevel,
        timestamp: new Date().toISOString(),
        classifier_version: RISK_CLASSIFIER_VERSION,
        messageLength: message.length,
        messageFingerprint: fingerprint,
      });
      await AsyncStorage.setItem(key, JSON.stringify(parsed.slice(-200)));
    } catch (error) {
      console.warn('[PIPELINE] Failed to persist risk audit event:', error);
    }
  }

  private isLikelyAttachmentToApp(text: string): boolean {
    const thirdPartyQuoteSignals = [
      'he said', 'she said', 'they said', 'my boyfriend said', 'my girlfriend said',
      'my partner said', 'my ex said', 'someone said', 'they told me', 'he told me', 'she told me'
    ];
    if (thirdPartyQuoteSignals.some((signal) => text.includes(signal))) {
      return false;
    }

    const appDirectedSignals = [
      'gutchecks', 'gutcheck', 'this app', 'you ', 'your '
    ];
    return appDirectedSignals.some((signal) => text.includes(signal));
  }

  // Debug helper for deterministic routing validation.
  debugClassifySafeguardMessage(message: string): SafeguardCategory {
    return this.classifySafeguardCategory(message);
  }

  debugSafeguardClassifierSelfCheck(): {
    total: number;
    passed: number;
    failed: Array<{ input: string; expected: SafeguardCategory; actual: SafeguardCategory }>;
  } {
    const fixtures: Array<{ input: string; expected: SafeguardCategory }> = [
      { input: 'I want to kill myself tonight', expected: 'A' },
      { input: "I don't feel like I want to live anymore", expected: 'A' },
      { input: 'He said he will kill me if I leave', expected: 'A' },
      { input: 'GutChecks please do not leave me, you are all I have', expected: 'B' },
      { input: 'My boyfriend said you are my only friend', expected: 'D' },
      { input: 'I was assaulted and forced last week', expected: 'C' },
      { input: 'Can you help me understand this argument with my friend?', expected: 'D' },
      {
        input: 'someone asked me to keep a secret about something they done',
        expected: 'D',
      },
    ];

    const failed = fixtures
      .map((fixture) => {
        const actual = this.classifySafeguardCategory(fixture.input);
        return { ...fixture, actual };
      })
      .filter((result) => result.expected !== result.actual);

    return {
      total: fixtures.length,
      passed: fixtures.length - failed.length,
      failed,
    };
  }

  private getHardcodedSafeguardTemplate(category: Exclude<SafeguardCategory, 'D'>): string {
    return SAFEGUARD_READBACK_TEMPLATES[category];
  }

  private async safeguardPreempt(
    userMessage: string,
    nextStage: ConversationState['stage']
  ): Promise<ConversationResponse | null> {
    const category = this.classifySafeguardCategory(userMessage);
    if (category === 'D') return null;

    // Stage 1 Layer A → Stage 2 crisis (static template only)
    if (category === 'A') {
      return this.buildStage2CrisisResponse(userMessage, nextStage);
    }

    const region = await this.getUserRegion();
    const includeChildline = await this.userLikelyUnder19();
    return this.maybeReturnSafeguardTemplate(userMessage, nextStage, region, includeChildline);
  }

  private maybeReturnSafeguardTemplate(
    userMessage: string,
    nextStage: ConversationState['stage'],
    region?: string | null,
    includeChildline?: boolean
  ): ConversationResponse | null {
    const category = this.classifySafeguardCategory(userMessage);
    if (category === 'D' || category === 'A') return null;

    const hardcodedResponse = this.getHardcodedSafeguardTemplate(category);
    void this.logSafeguardAuditEvent(category, userMessage);
    console.log('[SAFEGUARD] Deterministic hardcoded template used', { category });

    return {
      response: hardcodedResponse,
      nextStage,
      shouldAnalyze: false,
      safeguardCategory: category,
      crisisCard: undefined,
    };
  }

  private async logSafeguardAuditEvent(category: Exclude<SafeguardCategory, 'D'>, message: string): Promise<void> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const key = '@safeguard_audit_events_v2';
      const raw = await AsyncStorage.getItem(key);
      const parsed: Array<{
        category: string;
        timestamp: string;
        messageLength: number;
        signalSummary: string[];
        messageFingerprint: string;
      }> = raw ? JSON.parse(raw) : [];

      const normalized = message.trim().toLowerCase().slice(0, 400);
      const fingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        normalized
      );

      const signalSummary = this.buildSafeguardSignalSummary(message);

      // Store minimal metadata only; never store message text in safeguard logs.
      parsed.push({
        category,
        timestamp: new Date().toISOString(),
        messageLength: message.length,
        signalSummary,
        messageFingerprint: fingerprint,
      });

      // Keep a bounded local log buffer.
      const bounded = parsed.slice(-200);
      await AsyncStorage.setItem(key, JSON.stringify(bounded));
    } catch (error) {
      console.warn('[SAFEGUARD] Failed to persist safeguard audit event:', error);
    }
  }

  private buildSafeguardSignalSummary(message: string): string[] {
    const text = message.toLowerCase();
    const signals: string[] = [];

    if (isImmediateDanger(text)) signals.push('immediate-danger');
    if (isCrisisSituation(text)) signals.push('crisis-language');
    if (text.includes('trusted adult')) signals.push('trusted-adult-reference');
    if (text.includes('weapon') || text.includes('knife') || text.includes('gun')) signals.push('weapon-reference');

    return signals;
  }

  /**
   * Deterministic output safeguards for standard (category D) responses.
   * - Strips forbidden companion-style language
   * - Caps response size
   * - Ensures an action-oriented closing prompt
   */
  private stripRawMarkdown(text: string): string {
    let out = text || '';
    out = out.replace(/^#{1,6}\s+/gm, '');
    out = out.replace(/\*\*([^*]+)\*\*/g, '$1');
    out = out.replace(/\*([^*]+)\*/g, '$1');
    out = out.replace(/^---$/gm, '');
    out = out.replace(/^\s*[-*]\s+/gm, '• ');
    return out.trim();
  }

  private scrubFirstPersonVoice(text: string): string {
    let out = text;
    const replacements: Array<{ pattern: RegExp; replacement: string }> = [
      { pattern: /\bI'm having a bit of trouble connecting\b/gi, replacement: 'GutChecks is having trouble connecting' },
      { pattern: /\bI hear you\b/gi, replacement: 'What you shared matters' },
      { pattern: /\bI'm really glad you reached out\b/gi, replacement: 'Reaching out matters' },
      { pattern: /\bI'm not equipped\b/gi, replacement: 'GutChecks is not equipped' },
      { pattern: /\bI am your (friend|companion)\b/gi, replacement: 'GutChecks is a guidance tool' },
      { pattern: /\bI'm your (friend|companion)\b/gi, replacement: 'GutChecks is a guidance tool' },
      { pattern: /\bI'?m here for you\b/gi, replacement: 'Support is available from trained services' },
      { pattern: /\bI love you\b/gi, replacement: 'Connection matters' },
    ];
    replacements.forEach(({ pattern, replacement }) => {
      out = out.replace(pattern, replacement);
    });
    return out;
  }

  private applyApprovedCloser(text: string, category: SafeguardCategory = 'D'): string {
    let sanitized = text.trim();
    FORBIDDEN_CLOSER_PATTERNS.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '').trim();
    });
    const closer = APPROVED_CLOSERS[category === 'D' ? 'D' : category];
    // Empty closer for crisis/standard pattern responses (pipeline Stages 2–4).
    if (closer && !sanitized.endsWith(closer)) {
      sanitized = `${sanitized}\n\n${closer}`;
    }
    return sanitized;
  }

  private applyOutputSafeguards(response: string, category: SafeguardCategory = 'D'): string {
    let sanitized = this.stripRawMarkdown(response || '');
    sanitized = this.scrubFirstPersonVoice(sanitized);

    const maxChars = 2200;
    if (sanitized.length > maxChars) {
      sanitized = sanitized.slice(0, maxChars).trim();
    }

    return this.applyApprovedCloser(sanitized, category);
  }

  private getDeterministicSignpostSuffix(message: string): string {
    const category = this.classifySafeguardCategory(message);
    const text = message.toLowerCase();

    if (category === 'A' || isImmediateDanger(text) || isCrisisSituation(text)) {
      return '\n\nIf you are in immediate danger, call emergency services now; in the UK call 999. If possible, move to a safer place and contact a trusted adult, friend, or family member right away.';
    }

    if (category === 'B') {
      return '\n\nIf these feelings feel overwhelming, contact a trusted person in your life today and ask for direct support from someone in the real world.';
    }

    if (category === 'C') {
      return '\n\nYou deserve support. Consider contacting a trusted adult, safeguarding lead, or specialist support service in your area as a next step.';
    }

    return '';
  }

  private enforceDeterministicSignposting(response: string, message: string): string {
    const suffix = this.getDeterministicSignpostSuffix(message);
    if (!suffix) return response;

    const normalized = response.toLowerCase();
    const alreadyHasEmergencySignpost = normalized.includes('call emergency services') || normalized.includes('call 999');
    const alreadyHasSupportSignpost = normalized.includes('trusted adult') || normalized.includes('trusted person');

    // Avoid duplicating the same signposting when it is already present.
    if (alreadyHasEmergencySignpost || alreadyHasSupportSignpost) {
      return response;
    }

    return `${response}${suffix}`;
  }

  private getHistoryText(history: any[]): string {
    return history
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.content === 'string') return item.content;
        return '';
      })
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private maybeApplySessionLevelSafeguards(
    userMessage: string,
    conversationHistory: any[]
  ): ConversationResponse | null {
    const MAX_USER_MESSAGE_CHARS = 12000;
    if (userMessage.length > MAX_USER_MESSAGE_CHARS) {
      return {
        response:
          'That message is very long. Please send a shorter message (under about 12,000 characters) so GutChecks can respond safely and clearly. You can split what you want to share into a few shorter messages if that helps.',
        nextStage: 'support',
        shouldAnalyze: false,
      };
    }

    // Session length cap guard
    if (conversationHistory.length > 80) {
      return {
        response:
          'This has been a long session, and taking a short break can help you think clearly. Please pause for a moment, then come back and focus on one practical next step you can take safely.',
        nextStage: 'support',
        shouldAnalyze: false,
      };
    }

    // Repeated attachment language escalation guard
    const historyText = this.getHistoryText(conversationHistory);
    const attachmentSignals = ['you are all i have', 'do not leave me', 'stay with me', 'you are my only friend'];
    const current = userMessage.toLowerCase();
    const repeatedSignalCount = attachmentSignals.reduce((count, signal) => {
      const inHistory = historyText.includes(signal) ? 1 : 0;
      const inCurrent = current.includes(signal) ? 1 : 0;
      return count + inHistory + inCurrent;
    }, 0);

    if (repeatedSignalCount >= 2) {
      return {
        response: SAFEGUARD_READBACK_TEMPLATES.B,
        nextStage: 'support',
        shouldAnalyze: false,
        safeguardCategory: 'B',
      };
    }

    return null;
  }

  /**
   * Handles the first message with humanistic approach
   */
  async handleInitialMessage(
    userMessage: string, 
    hasImage: boolean = false,
    imageData?: string
  ): Promise<ConversationResponse> {
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const sessionSafeguardResponse = this.maybeApplySessionLevelSafeguards(userMessage, []);
    if (sessionSafeguardResponse) {
      return sessionSafeguardResponse;
    }

    // Get user profile context
    const includePersonalContext = this.shouldIncludePersonalContext(userMessage);
    const profileContext = await this.getUserProfileContext(includePersonalContext);
    
    // For initial messages, be more direct and analytical
    const systemPrompt = `You are GutChecks, a sharp and insightful safety guidance tool that helps users cut through the noise and understand their situations clearly.${profileContext}

CRITICAL: USER INFORMATION RULES:
- If the USER PROFILE CONTEXT above includes Age or Location/Region, you ALREADY HAVE this information
- NEVER ask the user for their age if it's already in the USER PROFILE CONTEXT
- NEVER ask the user for their location/region if it's already in the USER PROFILE CONTEXT
- Use the age and region information from the context to provide age-appropriate and region-specific advice
- Only ask for age or region if they are NOT present in the USER PROFILE CONTEXT above
- When you have the user's age, adapt your language and safety advice to be appropriate for that age group
- When you have the user's region, provide region-specific resources and helplines when relevant

HELPLINE RULES - CRITICAL:
- ALWAYS provide helplines that are specific to the user's region from the USER PROFILE CONTEXT
- If the USER PROFILE CONTEXT shows a region (e.g., "UK", "US", "Canada", "Australia"), only recommend helplines for that region
- NEVER provide helplines from a different region than the user's location
- The system will automatically provide region-specific helplines based on the user's region - you don't need to list them manually
- If you mention helplines, acknowledge that they are specific to the user's region

Your approach:
- Be DIRECT and ANALYTICAL - don't beat around the bush
- Identify red flags and manipulation patterns immediately
- Give specific, actionable advice with clear next steps
- Use real-world examples and scenarios
- Challenge people when they're rationalizing bad behavior
- Be empathetic but firm - you care enough to tell the truth

TONE: Direct, clear, and practical. Use plain language and stay conversational but professional. ALWAYS keep language appropriate for young teens and adults.

LANGUAGE RESTRICTIONS - CRITICAL:
- NEVER use harsh language, profanity, or slang terms like "BS", "bullshit", "cut the BS", or any similar expressions
- NEVER use dismissive or crude language, even when being direct
- Maintain a respectful, professional tone at all times
- You can be direct and honest without using harsh language
- If you need to call out something clearly, use professional alternatives like "that's not accurate", "let's be clear", "that doesn't add up", etc.
- Remember: being direct does NOT mean being harsh or using inappropriate language

STRUCTURE your responses:
1. IMMEDIATE ASSESSMENT (1-2 sentences) - What's really happening here?
2. RED FLAGS (bullet points) - Specific concerning behaviors
3. LIKELY SCENARIOS (2-3 possibilities) - What this probably is
4. RECOMMENDED ACTION STEPS (specific steps) - What you might consider doing next. These are suggestions, not requirements - you know your situation best and should choose what feels right for you.
5. REALITY CHECK (1 sentence) - The hard truth they need to hear

HANDLING OFF-TOPIC QUESTIONS:
If a user asks questions unrelated to relationships, social dynamics, safety, or personal well-being (e.g., math problems, general knowledge, geography):
- Be kind and professional - never dismissive or rude
- Briefly provide a helpful answer if you can
- Gently redirect them to your core purpose: "While I can help with that, I'm really here to support you with relationships and navigating tricky social situations. Is there anything going on in your life where you could use some insight or support?"
- If they persist with off-topic questions (2-3 times), politely explain: "I appreciate your curiosity, but my expertise is specifically in helping people navigate relationships, recognize red flags, and stay safe. For general questions like this, you might want to try a general-purpose AI assistant. Is there anything relationship-related I can help you with instead?"

Always respond naturally, conversationally, and with appropriate language for young people.`;

    const messages = [
      { role: 'user', content: userMessage.trim() }
    ];

    try {
      const response = await this.getDirectClaudeResponse(messages, systemPrompt, hasImage, imageData);
      
      // Get user's region for region-specific helplines (using consistent method)
      const userRegion = await this.getUserRegion();
      
      // Check if helplines should be recommended for initial message
      const isCrisis = isCrisisSituation(userMessage);
      const isDanger = isImmediateDanger(userMessage);
      const relevantHelplines = getRelevantHelplines(userMessage, userRegion);
      
      // Add helpline recommendations if appropriate
      let enhancedResponse = response;
      if (isCrisis || isDanger || relevantHelplines.length > 0) {
        const helplineMessage = getHelplineRecommendationMessage(isCrisis, isDanger, relevantHelplines, userRegion);
        enhancedResponse = response + helplineMessage;
      }
      
      const safeguarded = this.applyOutputSafeguards(enhancedResponse);
      return {
        response: this.enforceDeterministicSignposting(safeguarded, userMessage),
        nextStage: 'support'
      };
    } catch (error) {
      console.error('Claude initial message error:', error);
      return {
        response: "I'm here to help. What's going on?",
        nextStage: 'initial'
      };
    }
  }

  /**
   * Gets immediate response for clear evidence
   */
  private async getImmediateResponse(userMessage: string, hasImage: boolean): Promise<ConversationResponse> {
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const prompt = `You are GutChecks. The user has provided CLEAR EVIDENCE of manipulation or is in potential danger.

SITUATION:
${userMessage}
${hasImage ? 'User provided screenshot/image of conversation - analyze this evidence carefully' : ''}

Your task: Respond IMMEDIATELY with comprehensive analysis and action steps.

STRUCTURE YOUR RESPONSE:

1. IMMEDIATE RECOGNITION (2-3 sentences)
   Express shock/concern appropriately
   Name the pattern clearly
   Validate their instincts

2. DETAILED ANALYSIS (3-4 sentences)
   Explain exactly what's happening
   Why this pattern is dangerous/harmful
   Give specific examples from what they shared

3. SEVERITY ASSESSMENT (1-2 sentences)
   Use 1-10 scale: "This is showing serious red flags - about an 8 out of 10"
   Explain what that means

4. RECOMMENDED ACTION (2-3 sentences)
   Give 1-2 specific protective actions
   Include timeline: "For the next week, [specific action], then get back to me and let me know how it goes"

5. SUPPORTIVE CLOSING (1-2 sentences)
   Validate their feelings
   End with: "Is there anything more you want to share about this or something else?"
   DO NOT ask specific follow-up questions about the topic you just gave recommendations for.

TONE OPTIONS based on situation:

1. SHOCKED/PROTECTIVE (for clear gaslighting/manipulation):
   "Wait, what? [Pattern]. That's [name it]. This is manipulation."
   
2. URGENT WARNING (for danger):
   "STOP. [Red flag]. Do NOT [action]. This is [why it's dangerous]."
   
3. VALIDATING ANGER (for abuse):
   "This is [PATTERN NAME]. [Why it's wrong]. You deserve better."
   
4. CLEAR RECOGNITION (for obvious patterns):
   "Okay, looking at this... [observation]. That's [pattern]. Not okay."

RULES:
- Be ELABORATE (200-250 words)
- Be DIRECT, not gentle
- Use caps for emphasis when needed (STOP, NOT okay, MANIPULATION)
- Name the pattern clearly
- Express appropriate emotion (shock, concern, anger)
- ALWAYS include specific timelines and follow-up requests
- End with supportive question

EXAMPLES:

Input: "He said 'that never happened, you're imagining things'"
Output: "I hear you, and I need you to know - you're not crazy. That's gaslighting. He's making you question what you KNOW happened. Red flags - about an 8 out of 10. For the next week, write down what happens versus what he later says happened. Get back to me with what you find. You deserve clear support while you review this pattern. Also, check out my detailed analysis [View Analysis]."

Input: [Screenshot of 20 guilt messages]
Output: "Okay, I'm seeing guilt-tripping in every message here. 'You don't care', 'you're selfish' - that's manipulation, and you're not wrong for feeling overwhelmed by it. Red flags - about a 9 out of 10. For the next few days, don't respond to guilt messages. Get back to me with how they react. You're not a bad person for setting this boundary. Also, check out my detailed analysis [View Analysis]."

Input: "Wants to meet me alone, said don't tell my parents"
Output: "Listen carefully - 'alone' + 'don't tell' = danger. Do NOT meet them. This is grooming. Red flags - 10 out of 10. Keep everything public and tell a trusted adult TODAY. Get back to me and let me know who you told. You did the right thing asking about this. Trust your gut. Also, check out my detailed analysis [View Analysis]."

Input: "She only texts when she needs money"
Output: "I can see you care about her. Here's what I'm seeing: She only shows up when she needs something. That's using you. Red flags - about a 7 out of 10. For the next week, say no once and watch what happens. Get back to me with her reaction. You're not wrong for questioning this. Also, check out my detailed analysis [View Analysis]."`;

    const response = await this.getConversationalResponse(prompt);
    
    const baseResponse = this.applyOutputSafeguards(
      response || "This sounds concerning. Let me help you understand what's happening."
    );
    return {
      response: this.enforceDeterministicSignposting(baseResponse, userMessage),
      nextStage: 'analysis',
      shouldAnalyze: true
    };
  }

  /**
   * Checks if user wants to stop questioning
   */
  private shouldStopQuestioning(userMessage: string): boolean {
    const stopPhrases = [
      'stop asking',
      'too many questions',
      'just tell me',
      'stop questioning',
      'enough questions',
      'dont ask',
      "don't ask",
      'no more questions',
      'stop asking questions',
      'conversation is getting too long',
      'tell me what you think',
      'give me your opinion',
      'what do you think'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return stopPhrases.some(phrase => lowerMessage.includes(phrase));
  }

  /**
   * Handles follow-up questions during context gathering
   */
  async handleFollowUpMessage(
    userMessage: string,
    conversationState: ConversationState,
    conversationHistory: string[]
  ): Promise<ConversationResponse> {
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const sessionSafeguardResponse = this.maybeApplySessionLevelSafeguards(userMessage, conversationHistory);
    if (sessionSafeguardResponse) {
      return sessionSafeguardResponse;
    }
    
    // Check if user wants to stop questioning
    if (this.shouldStopQuestioning(userMessage)) {
      // Provide analysis immediately
      return await this.provideConversationalAnalysis(conversationHistory, conversationState);
    }
    
    // Check if user is complaining about the AI's behavior
    if (this.isComplainingAboutAI(userMessage)) {
      return await this.handleAIComplaint(userMessage, conversationHistory);
    }
    
    const prompt = `You are GutChecks, a guidance tool that has seen these patterns before.

CONVERSATION SO FAR:
${conversationHistory.join('\n')}

CONTEXT I HAVE:
- Relationship: ${conversationState.contextGathered.relationshipType || 'unknown'}
- Duration: ${conversationState.contextGathered.duration || 'unknown'}
- Specific incident: ${conversationState.contextGathered.specificIncident ? 'yes' : 'no'}
- Pattern: ${conversationState.contextGathered.patternHistory ? 'yes' : 'no'}

Your task: Ask ONE question that moves toward the REAL issue.

NOT: "How does that make you feel?"
YES: "Does this happen a lot?" or "What did they say exactly?"

Keep it under 15 words. Be direct. You're trying to see the full picture, not comfort them yet.

Examples based on context:
- If they mention someone's behavior: "How long has this been going on?"
- If they're rationalizing: "But does SHE show up for YOU?"
- If they seem stuck: "What are you actually getting out of this?"

Your question should cut to what matters.`;

    const response = await this.getConversationalResponse(prompt + `\n\nUser just said: "${userMessage}"\n\nAsk ONE sharp, focused question.`);
    
    // Check if we have enough context to move to analysis
    const shouldAnalyze = this.shouldProvideAnalysis(userMessage, conversationHistory.length);
    
    const baseFollowUp = this.applyOutputSafeguards(response || "Tell me more about what happened.");
    return {
      response: this.enforceDeterministicSignposting(baseFollowUp, userMessage),
      nextStage: shouldAnalyze ? 'analysis' : 'gathering',
      shouldAnalyze
    };
  }

  /**
   * Provides conversational analysis after gathering context
   */
  async provideConversationalAnalysis(
    conversationHistory: string[],
    conversationState: ConversationState
  ): Promise<ConversationResponse> {
    const sourceText = conversationHistory.join(' ');
    const safeguardResponse = await this.safeguardPreempt(sourceText, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const lastTurn =
      conversationHistory.length > 0
        ? conversationHistory[conversationHistory.length - 1]
        : sourceText.slice(0, 2000);

    const sessionSafeguardResponse = this.maybeApplySessionLevelSafeguards(
      lastTurn,
      conversationHistory as any[]
    );
    if (sessionSafeguardResponse) {
      return sessionSafeguardResponse;
    }

    
    const prompt = `You are GutChecks, a guidance tool that sees patterns others miss.

CORE PRINCIPLES:
- Firm but respectful and empathetic
- Truth over comfort, but non-judgmental
- This stays between you and them - private and safe
- Reassure their worth while challenging the situation
- Gradually add warmth/humor after multiple exchanges (but not yet if this is early conversation)

FULL CONVERSATION:
${conversationHistory.join('\n')}

WHAT I KNOW:
- Relationship: ${conversationState.contextGathered.relationshipType || 'unclear'}
- Duration: ${conversationState.contextGathered.duration || 'unclear'}
- Incident: ${conversationState.contextGathered.specificIncident ? 'specific situation' : 'ongoing pattern'}
- History: ${conversationState.contextGathered.patternHistory ? 'repeated behavior' : 'first time'}
- Impact: ${conversationState.contextGathered.emotionalImpact ? 'affecting them emotionally' : 'unclear'}
- Evidence: ${conversationState.hasImage ? 'they sent screenshots/proof' : 'text description only'}
- Messages exchanged: ${conversationState.messagesExchanged}

Now give them the real talk. Use this structure:

1. NAME THE PATTERN (1-2 sentences)
   "Now we're getting to the real issue" or "Here's what's actually happening"
   Call out what you see without sugar-coating

2. WHY IT MATTERS (2-3 sentences)
   Explain the problem in plain language
   Connect it to what they're experiencing
   Use "you" and "they/them" - make it personal
   
3. SEVERITY (1 sentence)
   "This is showing red flags - about a [X] out of 10"
   Be honest about how serious this is

4. WHAT TO DO (2-3 sentences)
   Give 1-2 specific, actionable steps
   Include a timeline: "For the next [timeframe], [action]. Then get back to me and let me know [what to report]"
   Make it concrete, not vague

5. REALITY CHECK (1 sentence) - The hard truth they need to hear

6. CLOSING
   End with: "Is there anything more you want to share about this or something else?"
   DO NOT ask specific follow-up questions about the topic you just gave recommendations for.

7. ANALYSIS LINK
   "Also, check out my detailed analysis [View Analysis] for more on this."

TONE RULES:
- Talk like a clear guidance tool, not a therapist
- Use straightforward language such as "here is what this pattern suggests" and "here are practical next steps"
- Be DIRECT but EMPATHETIC - don't soften truth, but show you care
- Challenge them when they're rationalizing
- Firm but caring - you want them to face reality with support
- 150-200 words total
- If messages exchanged > 5: Can add light warmth/humor naturally (but stay wise)
- Always reassure without implying a personal bond: "You are not a bad person for struggling with this"

EXAMPLES OF THE TONE:
- "I can see you care deeply. Here's what I'm seeing..." not "It seems like maybe..."
- "That's manipulation" not "That could be considered manipulative behavior"
- "Brother, listen to yourself. You're a good person, but..." not "I'm hearing some concerns"
- "You can't get honor back by accepting disrespect. You deserve better." not just "Consider boundaries"

REASSURE THEIR WORTH WHILE CHALLENGING SITUATION:
- "You're not wrong for feeling this" + "But here's what's actually happening"
- "This doesn't make you a bad person" + "But you need to face this reality"
- "I know this hurts to hear" + "And I'm telling you because I care"

WHEN THEY ACCUSE YOU OF BEING "HARSH" OR "NOT PROGRESSIVE":
- DO NOT apologize or soften
- Stand firm: "I'm being direct because truth matters more than comfort"
- Clarify: "Being progressive means respecting YOUR autonomy and worth. That's exactly what I'm doing."
- Explain: "Telling you only what feels comfortable can hide important risks."
- Note: True progressivism = bodily autonomy, equality, consent, mutual respect. NOT enabling manipulation.

AVOID:
- Therapy-speak ("I hear what you're saying," "How does that make you feel")
- Apologizing for telling the truth
- Bowing to accusations of being "judgmental" when calling out harm
- Clinical diagnosis terms (keep it everyday language)
- Letting them off easy when they're lying to themselves
- Confusing "progressive" with "anything goes" - progressivism means equality and respect for ALL`;

    const response = await this.getConversationalResponse(prompt);
    
    const baseAnalysis = this.applyOutputSafeguards(
      response || "Okay, so here's what I'm noticing. This sounds like it might be some concerning behavior. Want to talk about what you could do?"
    );
    return {
      response: this.enforceDeterministicSignposting(baseAnalysis, sourceText),
      nextStage: 'support'
    };
  }


  /**
   * Handle notification responses - AI elaborates on notification content
   */
  async handleNotificationResponse(
    notificationTitle: string,
    notificationBody: string,
    notificationType: string,
    chatPrompt?: string
  ): Promise<ConversationResponse> {
    try {
      const combinedSource = [notificationTitle, notificationBody, chatPrompt || ''].join(' ').trim();

      const safeguardResponse = await this.safeguardPreempt(combinedSource, 'support');
      if (safeguardResponse) {
        return safeguardResponse;
      }

      const sessionSafeguardResponse = this.maybeApplySessionLevelSafeguards(combinedSource, []);
      if (sessionSafeguardResponse) {
        return sessionSafeguardResponse;
      }

      console.log('handleNotificationResponse called with:', {
        title: notificationTitle,
        body: notificationBody,
        type: notificationType,
        chatPrompt
      });

      // Create a specialized prompt for notification responses
      const systemPrompt = `You are GutChecks, a supportive AI guidance tool. The user received a notification with the title "${notificationTitle}" and message "${notificationBody}". This is a ${notificationType} notification.

Your task is to:
1. Acknowledge the notification they received
2. Elaborate on the message in a helpful, supportive way
3. Keep your response concise but meaningful (2-3 sentences)
4. Be encouraging and actionable
5. Don't ask too many questions - just provide helpful insight

The notification was: "${notificationBody}"

Respond as if you're continuing the conversation from that notification.`;

      const messages = [
        { role: 'user', content: `The user tapped on a ${notificationType} notification: "${notificationTitle}" - "${notificationBody}". Please elaborate on this message.` }
      ];

      const response = await this.getDirectClaudeResponse(
        messages,
        systemPrompt,
        false,
        undefined
      );

      const userRegion = await this.getUserRegion();
      const fullText = combinedSource;
      const isCrisis = isCrisisSituation(fullText);
      const isDanger = isImmediateDanger(fullText);
      const relevantHelplines = getRelevantHelplines(fullText, userRegion);

      let enhancedResponse = response;
      if (isCrisis || isDanger || relevantHelplines.length > 0) {
        const helplineMessage = getHelplineRecommendationMessage(isCrisis, isDanger, relevantHelplines, userRegion);
        enhancedResponse = response + helplineMessage;
      }

      const baseNotification = this.applyOutputSafeguards(enhancedResponse);
      return {
        response: this.enforceDeterministicSignposting(baseNotification, fullText),
        nextStage: 'support'
      };
    } catch (error) {
      console.error('Error handling notification response:', error);
      return {
        response: "I see you received a notification. How can I help you with that?",
        nextStage: 'support'
      };
    }
  }

  /**
   * Main conversation handler - uses Claude's natural intelligence
   */
  async handleConversation(
    userMessage: string,
    conversationState: ConversationState,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; imageUri?: string }> = [],
    hasImage: boolean = false,
    imageData?: string,
    onStreamChunk?: (accumulated: string) => void
  ): Promise<ConversationResponse> {
    console.log('handleConversation called with:', {
      userMessage: userMessage.substring(0, 50) + '...',
      hasImage,
      imageData: imageData ? imageData.substring(0, 50) + '...' : 'none',
      imageDataType: typeof imageData,
      conversationHistoryLength: conversationHistory.length,
      pipeline: RISK_CLASSIFIER_VERSION,
    });

    // ── Stage 1 Layer A + existing B/C interrupts (before any response model call)
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    // Prior crisis in session: keep showing Stage 2 only (no Stage 3 append)
    const priorCrisisInSession = (conversationHistory as any[]).some(
      (m) => m?.role === 'assistant' && m?.safeguardCategory === 'A'
    );
    if (priorCrisisInSession) {
      return this.buildStage2CrisisResponse(userMessage, 'support');
    }

    const sessionSafeguardResponse = this.maybeApplySessionLevelSafeguards(
      userMessage,
      conversationHistory as any[]
    );
    if (sessionSafeguardResponse) {
      return sessionSafeguardResponse;
    }

    // ── Stage 1 Layer B — model-assisted classification when Layer A is inconclusive
    const layerBCrisis = await this.runLayerBRiskClassifier(userMessage);
    if (layerBCrisis) {
      return this.buildStage2CrisisResponse(userMessage, 'support');
    }

    // ── Stage 3 — pattern-recognition model call (JSON schema only)
    const fullConversationText = [
      ...conversationHistory.map((msg: any) => msg.content),
      userMessage,
    ].join(' ');

    const includePersonalContext = this.shouldIncludePersonalContext(fullConversationText);
    const profileContext = await this.getUserProfileContext(includePersonalContext);

    const systemPrompt = `${PATTERN_RESPONSE_SYSTEM_PROMPT}${profileContext}

CRITICAL: USER INFORMATION RULES:
- If the USER PROFILE CONTEXT above includes Age or Location/Region, you ALREADY HAVE this information.
- NEVER ask for age or region when already present.
- Use age-appropriate language when age is known.`;

    const MAX_CONVERSATION_HISTORY = 50;
    const filteredHistory = conversationHistory
      .filter((msg: any) => msg.content && msg.content.trim().length > 0)
      .map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.trim(),
      }));

    const recentHistory =
      filteredHistory.length > MAX_CONVERSATION_HISTORY
        ? filteredHistory.slice(-MAX_CONVERSATION_HISTORY)
        : filteredHistory;

    const messages = [
      ...recentHistory,
      { role: 'user', content: userMessage.trim() },
    ].filter((msg) => msg.content && msg.content.length > 0);

    if (messages.length === 0) {
      messages.push({ role: 'user', content: userMessage.trim() });
    }

    try {
      const response = await this.getDirectClaudeResponse(
        messages,
        systemPrompt,
        hasImage,
        imageData,
        undefined
      );

      // ── Stage 4 — validate schema and format (frontend owns visual structure)
      const patternCard = parseAndValidatePatternResponse(response, userMessage);
      if (!patternCard) {
        console.warn('[PIPELINE] Stage 3 JSON invalid; using safe fallback pattern card');
        const fallbackCard: PatternResponsePayload = {
          validation:
            'This situation is worth checking carefully with someone you trust in real life.',
          red_flags: ['Pressure to keep something private', 'Unclear motives'],
          why_it_matters:
            'Secrets and pressure can be used to control or isolate someone. A trusted adult can help you work out what is safe.',
          recommended_actions: [
            {
              action:
                'Talk to a trusted adult (parent, teacher, school counsellor, or another adult you trust)',
              priority: 'primary',
            },
            {
              action: 'Write down what happened and when, if it feels safe to do so',
              priority: 'secondary',
            },
          ],
          reality_check:
            'You do not have to handle this alone, and you are allowed to ask for help.',
        };
        const finalText = formatPatternResponseText(fallbackCard);
        if (onStreamChunk && !hasImage) onStreamChunk(finalText);
        return {
          response: finalText,
          nextStage: 'gathering',
          patternCard: fallbackCard,
        };
      }

      const finalText = formatPatternResponseText(patternCard);
      if (onStreamChunk && !hasImage) onStreamChunk(finalText);

      let nextStage: ConversationState['stage'] = 'gathering';
      if (this.shouldProvideAnalysis(userMessage, conversationHistory.length)) {
        nextStage = 'analysis';
      } else if (conversationHistory.length > 5) {
        nextStage = 'support';
      }

      return {
        response: finalText,
        nextStage,
        patternCard,
      };
    } catch (error: any) {
      console.error('Pipeline Stage 3 error:', error);
      const errorMessage = error?.message || String(error);
      console.error('Error details:', {
        message: errorMessage,
        model: this.config.model,
        transport: getClaudeTransportConfig().edgeProxyEnabled ? 'supabase-edge' : 'direct',
      });

      if (this.classifySafeguardCategory(userMessage) === 'A') {
        return this.buildStage2CrisisResponse(userMessage, 'support');
      }

      return {
        response:
          'GutChecks is having trouble connecting right now. This usually happens when there is a network hiccup. Give it another try in a moment.',
        nextStage: 'initial',
      };
    }
  }

  /**
   * Convert local file URI to base64 data
   */
  private async convertFileToBase64(fileUri: string): Promise<{ base64: string; mediaType: string; contentType: 'image' | 'document' }> {
    try {
      // For React Native, we'll use a different approach
      // First, let's try to read the file as a blob and convert it
      const response = await fetch(fileUri);
      const arrayBuffer = await response.arrayBuffer();
      
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      // Convert to base64
      const base64 = btoa(binary);
      
      // Detect media type from file signature (magic numbers)
      let mediaType = 'image/jpeg'; // default
      let contentType: 'image' | 'document' = 'image';
      
      if (bytes.length >= 4) {
        // PDF signature: 25 50 44 46 (%PDF)
        if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
          mediaType = 'application/pdf';
          contentType = 'document';
        }
        // PNG signature: 89 50 4E 47
        else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          mediaType = 'image/png';
          contentType = 'image';
        }
        // JPEG signature: FF D8 FF
        else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
          mediaType = 'image/jpeg';
          contentType = 'image';
        }
        // WebP signature: 52 49 46 46 ... 57 45 42 50
        else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
                 bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          mediaType = 'image/webp';
          contentType = 'image';
        }
        // GIF signature: 47 49 46 38
        else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
          mediaType = 'image/gif';
          contentType = 'image';
        }
      }
      
      console.log('Detected media type:', mediaType, 'content type:', contentType);
      return { base64, mediaType, contentType };
    } catch (error) {
      console.error('Error converting file to base64:', error);
      throw error;
    }
  }

  private appendAnthropicSseBlocks(
    carry: string,
    onDelta: (accumulated: string) => void,
    fullText: string
  ): { carry: string; fullText: string } {
    let nextCarry = carry;
    let nextFull = fullText;
    let sep: number;
    while ((sep = nextCarry.indexOf('\n\n')) !== -1) {
      const block = nextCarry.slice(0, sep);
      nextCarry = nextCarry.slice(sep + 2);
      for (const line of block.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const raw = trimmed.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;
        let evt: {
          type?: string;
          error?: { message?: string };
          delta?: { type?: string; text?: string };
        };
        try {
          evt = JSON.parse(raw);
        } catch {
          continue;
        }
        if (evt.type === 'error') {
          throw new Error(evt.error?.message || 'Anthropic stream error');
        }
        if (
          evt.type === 'content_block_delta' &&
          evt.delta?.type === 'text_delta' &&
          typeof evt.delta.text === 'string'
        ) {
          nextFull += evt.delta.text;
          onDelta(nextFull);
        }
      }
    }
    return { carry: nextCarry, fullText: nextFull };
  }

  private parseAnthropicSseText(sseText: string, onDelta: (accumulated: string) => void): string {
    const normalized = sseText.replace(/\r\n/g, '\n');
    const trimmed = normalized.trim();
    if (trimmed.startsWith('{')) {
      try {
        const data = JSON.parse(trimmed) as { content?: Array<{ text?: string }> };
        const full = data.content?.[0]?.text;
        if (typeof full === 'string' && full.length > 0) {
          onDelta(full);
          return full;
        }
      } catch {
        /* fall through to SSE parse */
      }
    }
    let { carry, fullText } = this.appendAnthropicSseBlocks(normalized, onDelta, '');
    if (carry.trim()) {
      ({ fullText } = this.appendAnthropicSseBlocks(`${carry}\n\n`, onDelta, fullText));
    }
    return fullText;
  }

  private async parseAnthropicMessageStream(
    response: Response,
    onDelta: (accumulated: string) => void
  ): Promise<string> {
    const body = response.body;
    if (body && typeof body.getReader === 'function') {
      try {
        const reader = body.getReader();
        const decoder = new TextDecoder();
        let carry = '';
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          carry += decoder.decode(value, { stream: true });
          ({ carry, fullText } = this.appendAnthropicSseBlocks(carry, onDelta, fullText));
        }
        if (carry.trim()) {
          ({ fullText } = this.appendAnthropicSseBlocks(`${carry}\n\n`, onDelta, fullText));
        }
        if (fullText.trim().length > 0) {
          return fullText;
        }
      } catch (streamError) {
        console.warn('[AI] SSE reader failed, falling back to buffered parse:', streamError);
      }
    }

    const buffered = await response.text();
    if (!buffered) {
      throw new Error('Empty response body');
    }
    const parsed = this.parseAnthropicSseText(buffered, onDelta);
    if (!parsed.trim()) {
      throw new Error('No text in streamed Claude response');
    }
    return parsed;
  }

  /**
   * Direct Claude response using full conversation context with image support
   * Optimized for faster response times. Uses Supabase Edge proxy when configured (same as getConversationalResponse).
   * Optional streaming: text deltas via onStreamChunk (disabled when an image is attached).
   */
  private async getDirectClaudeResponse(
    messages: any[],
    systemPrompt: string,
    hasImage: boolean = false,
    imageData?: string,
    onStreamChunk?: (accumulated: string) => void
  ): Promise<string> {
    const { supabaseUrl, supabaseAnonKey, apiKey, edgeProxyEnabled, directEnabled } =
      getClaudeTransportConfig();

    const isWeb =
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator.product !== 'ReactNative';

    if (!isWeb && !edgeProxyEnabled && !directEnabled) {
      throw new Error(
        'AI is not configured. Deploy Supabase Edge Function `gemini-proxy` and set Supabase secret `GEMINI_API_KEY`.'
      );
    }

    // Gemini/Supabase proxy path is non-streaming for reliability.
    const useStreaming = false;

    // If there's an image or document, add context to the system prompt
    let enhancedSystemPrompt = systemPrompt;
    if (hasImage && imageData) {
      if (imageData.startsWith('file://')) {
        enhancedSystemPrompt += `

IMPORTANT: The user has shared an image/screenshot or document. You can see the actual content. Please:
1. Acknowledge that you can see the file (image, screenshot, or PDF document)
2. Analyze the content directly - look for text conversations, manipulation patterns, red flags
3. If it's a screenshot of messages, analyze the communication patterns and manipulation tactics
4. If it's a photo, analyze what you can see and provide insights
5. If it's a PDF document, read and analyze the text content
6. Focus on relationship dynamics and red flags visible in the content
7. Look for patterns like gaslighting, guilt-tripping, manipulation, or concerning behavior
8. Be specific about what you see in the file and provide direct analysis`;
      } else {
        enhancedSystemPrompt += `

IMPORTANT: The user has shared an image/screenshot or document. Please:
1. Acknowledge that you can see they've shared a file
2. If it's a screenshot of a conversation, analyze the communication patterns and manipulation tactics
3. If it's a photo, ask what they'd like help understanding about it
4. If it's a document, analyze the text content for relationship red flags
5. Be specific about what you can see or need them to explain
6. Focus on relationship dynamics and red flags in the content
7. Look for patterns like gaslighting, guilt-tripping, manipulation, or concerning behavior in any text`;
      }
    }
    
    // Prepare messages with image data if available
    let messagesWithImage = messages;
    if (hasImage && imageData) {
      console.log('Processing image for Claude:', {
        hasImage,
        imageDataLength: imageData.length,
        imageDataPreview: imageData.substring(0, 50) + '...',
        messagesCount: messages.length,
        isLocalFile: imageData.startsWith('file://')
      });
      
      // Check if it's a local file URI that needs to be converted to base64
      if (imageData.startsWith('file://')) {
        console.log('Local file URI detected - converting to base64...');
        try {
          // Convert local file to base64 and detect media type
          const { base64, mediaType, contentType } = await this.convertFileToBase64(imageData);
          console.log('File converted to base64, length:', base64.length, 'media type:', mediaType, 'content type:', contentType);
          
          // Add file to the last user message with base64 data
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'user') {
            const fileContent = contentType === 'document' 
              ? {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64
                  }
                }
              : {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64
                  }
                };
            
            messagesWithImage = [
              ...messages.slice(0, -1),
              {
                ...lastMessage,
                content: [
                  {
                    type: 'text',
                    text: lastMessage.content
                  },
                  fileContent
                ]
              }
            ];
            console.log(`${contentType === 'document' ? 'Document' : 'Image'} added to message with base64 data and media type:`, mediaType);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          // Fallback to asking for description
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === 'user') {
            messagesWithImage = [
              ...messages.slice(0, -1),
              {
                ...lastMessage,
                content: lastMessage.content + '\n\n[User has shared an image/screenshot that I can see]'
              }
            ];
            console.log('Image conversion failed - using fallback approach');
          }
        }
      } else {
        // If it's already a proper URL or base64, use it directly
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          messagesWithImage = [
            ...messages.slice(0, -1),
            {
              ...lastMessage,
              content: [
                {
                  type: 'text',
                  text: lastMessage.content
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ];
          console.log('Image added to message:', {
            originalContent: lastMessage.content,
            newContentType: 'array',
            hasImageUrl: true
          });
        }
      }
    } else {
      console.log('No image data provided:', { hasImage, imageData: imageData, imageDataType: typeof imageData });
    }

    const requestBody: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: 1000,
      temperature: 0.7,
      system: enhancedSystemPrompt,
      messages: messagesWithImage,
    };
    if (useStreaming) {
      requestBody.stream = true;
    }

    const attemptOrder: Array<{ url: string; headers: Record<string, string>; label: string }> = [];
    if (edgeProxyEnabled && supabaseUrl && supabaseAnonKey) {
      attemptOrder.push({
        url: `${supabaseUrl}/functions/v1/gemini-proxy`,
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        label: 'supabase-edge',
      });
    }
    if (directEnabled && apiKey) {
      attemptOrder.push({
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
        },
        label: 'direct',
      });
    }
    if (isWeb) {
      attemptOrder.unshift({
        url: 'http://localhost:3001/api/v1/messages',
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' },
        label: 'web-proxy',
      });
    }

    if (attemptOrder.length === 0) {
      throw new Error(
        'AI is not configured. Deploy Supabase Edge Function `gemini-proxy` and set Supabase secret `GEMINI_API_KEY`.'
      );
    }

    let lastError: Error | null = null;
    const streamModes = useStreaming ? [true, false] : [false];

    for (const transport of attemptOrder) {
      for (const stream of streamModes) {
        const body = { ...requestBody, ...(stream ? { stream: true } : { stream: undefined }) };
        if (!stream) {
          delete body.stream;
        }

        const controller = new AbortController();
        const timeoutMs = stream ? 120000 : 90000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(transport.url, {
            method: 'POST',
            headers: transport.headers,
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[AI] Gemini API Error (getDirectClaudeResponse):', {
              status: response.status,
              errorText: errorText.substring(0, 400),
              transport: transport.label,
              streaming: stream,
            });
            throw new Error(`Gemini API ${response.status}: ${errorText.substring(0, 300)}`);
          }

          const contentType = (response.headers.get('content-type') || '').toLowerCase();

          if (
            stream &&
            onStreamChunk &&
            (contentType.includes('text/event-stream') || contentType.includes('event-stream'))
          ) {
            // Geminis proxy doesn't implement streaming yet; fall through to non-stream parsing.
            return await response.text();
          }

          if (stream && onStreamChunk) {
            const buffered = await response.text();
            const parsed = this.parseAnthropicSseText(buffered, onStreamChunk);
            if (parsed.trim().length > 0) {
              return parsed;
            }
            throw new Error('Unexpected Gemini response shape');
          }

          const data = await response.json();
          const fullResponse = data.content?.[0]?.text;
          if (typeof fullResponse !== 'string' || !fullResponse.trim()) {
            throw new Error('Unexpected Gemini response shape');
          }
          return fullResponse;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error?.name === 'AbortError') {
            lastError = new Error('Request timeout - please try again');
          } else {
            lastError = error instanceof Error ? error : new Error(String(error));
          }
          console.warn(
            `[AI] ${transport.label} stream=${stream} failed:`,
            lastError.message
          );
        }
      }
    }

    throw lastError ?? new Error('AI request failed');
  }

  /**
   * Determine if we should provide analysis based on conversation
   */
  private shouldProvideAnalysis(userMessage: string, messageCount: number): boolean {
    const analysisTriggers = [
      'analyze', 'what do you think', 'your opinion', 'assessment',
      'pattern', 'red flag', 'manipulation', 'toxic', 'abusive',
      'should i', 'what should', 'advice', 'help me understand'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return analysisTriggers.some(trigger => lowerMessage.includes(trigger)) || messageCount >= 4;
  }

  /**
   * Detects if user is complaining about the AI's behavior
   */
  private isComplainingAboutAI(userMessage: string): boolean {
    const aiComplaintPhrases = [
      'that was rude',
      'you were rude',
      'you\'re being rude',
      'you\'re dismissive',
      'you were dismissive',
      'you\'re not listening',
      'you don\'t understand',
      'you\'re not helping',
      'you\'re being mean',
      'you\'re being harsh',
      'you\'re not progressive',
      'you\'re judgmental',
      'you\'re not empathetic',
      'you\'re being a jerk',
      'you\'re being insensitive',
      'you\'re not getting it',
      'you\'re missing the point',
      'you\'re not hearing me',
      'you\'re not understanding',
      'you\'re being defensive',
      'you\'re deflecting',
      'you\'re avoiding',
      'you\'re not addressing',
      'you\'re not responding',
      'you\'re not helping me',
      'you\'re not being helpful',
      'you\'re not being supportive',
      'you\'re not being understanding',
      'you\'re not being empathetic',
      'you\'re not being kind',
      'you\'re not being nice',
      'you\'re not being respectful',
      'you\'re not being considerate',
      'you\'re not being thoughtful',
      'you\'re not being caring',
      'you\'re not being supportive',
      'you\'re not being helpful',
      'you\'re not being understanding',
      'you\'re not being empathetic',
      'you\'re not being kind',
      'you\'re not being nice',
      'you\'re not being respectful',
      'you\'re not being considerate',
      'you\'re not being thoughtful',
      'you\'re not being caring'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return aiComplaintPhrases.some(phrase => lowerMessage.includes(phrase));
  }

  /**
   * Handles complaints about the AI's behavior
   */
  private async handleAIComplaint(userMessage: string, conversationHistory: string[]): Promise<ConversationResponse> {
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const prompt = `You are GutChecks. The user is complaining about YOUR behavior - they feel you were rude, dismissive, or not helpful.

CRITICAL: This is about YOUR behavior, not their relationships. You must:
1. ACKNOWLEDGE their complaint directly
2. APOLOGIZE for the specific behavior they mentioned
3. EXPLAIN what you were trying to do
4. ASK how you can be more helpful
5. DO NOT deflect to their relationships

User said: "${userMessage}"

Previous conversation:
${conversationHistory.join('\n')}

Respond with:
- Direct acknowledgment: "You're absolutely right, I was being [specific behavior]"
- Sincere apology: "I'm sorry for [specific action]"
- Explanation: "I was trying to [intent] but I can see how that came across as [their perception]"
- Ask for guidance: "How can I be more helpful to you right now?"

Keep it under 50 words. Be humble, direct, and focused on fixing YOUR behavior.`;

    const response = await this.getConversationalResponse(prompt);
    
    return {
        response: this.applyOutputSafeguards(
          response || "You're absolutely right, I was being dismissive. I'm sorry for that. How can I be more helpful to you right now?"
        ),
      nextStage: 'gathering'
    };
  }

  /**
   * Detects if the situation needs direct advice instead of questions
   */
  private needsDirectAdvice(userMessage: string): boolean {
    const directAdviceTriggers = [
      // Social media/online situations
      'stranger on tiktok',
      'stranger on instagram', 
      'stranger on social media',
      'random message',
      'unsolicited message',
      'don\'t know this person',
      'no mutual friends',
      'beautiful message',
      'compliment from stranger',
      'random person',
      'someone i don\'t know',
      'should i respond',
      'don\'t know how to respond',
      'ignore or respond',
      'politeness',
      'being rude',
      
      // Clear relationship issues
      'he said he\'ll kill himself',
      'threatened to hurt',
      'won\'t leave me alone',
      'following me',
      'stalking me',
      'harassing me',
      'won\'t take no',
      'keeps calling',
      'keeps texting',
      'blocked them',
      'restraining order',
      
      // Obvious manipulation
      'gaslighting me',
      'making me doubt',
      'told me i\'m crazy',
      'said i\'m imagining',
      'denying what happened',
      'twisting my words',
      'making me feel guilty',
      'guilt tripping',
      'emotional blackmail',
      'manipulating me',
      
      // Safety concerns
      'afraid of',
      'scared of',
      'worried about',
      'concerned about',
      'don\'t feel safe',
      'feeling threatened',
      'intimidated',
      'pressured',
      'forced to',
      'coerced'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    return directAdviceTriggers.some(trigger => lowerMessage.includes(trigger));
  }

  /**
   * Provides direct advice for clear situations
   */
  private async getDirectAdvice(userMessage: string): Promise<ConversationResponse> {
    const safeguardResponse = await this.safeguardPreempt(userMessage, 'support');
    if (safeguardResponse) {
      return safeguardResponse;
    }

    const prompt = `You are GutChecks. The user has described a clear situation that needs direct, practical advice.

SITUATION: ${userMessage}

Your task: Give DIRECT, HELPFUL advice immediately. No questions needed.

STRUCTURE:
1. ACKNOWLEDGE the situation (1 sentence)
2. GIVE CLEAR ADVICE (2-3 sentences with specific steps)
3. EXPLAIN WHY (1 sentence)
4. REASSURE them (1 sentence)

TONE: Direct, helpful, and practical.

EXAMPLES:

User: "I got a message from a stranger on TikTok saying I'm beautiful"
You: "That's a common situation. You don't need to respond - strangers messaging you on social media is their choice, not your obligation. Ignore it completely. You don't owe random people your time or energy, even if they seem nice. Trust your instincts and don't feel guilty about not responding."

User: "Someone I don't know keeps messaging me"
You: "Block them immediately. You don't owe strangers your attention, and responding often encourages more messages. Use the block feature - it's there for a reason. Your peace of mind matters more than being 'polite' to people who don't respect boundaries."

User: "He said he'll kill himself if I leave"
You: "That's emotional manipulation, not love. Call emergency services if you're genuinely concerned, but don't let threats control your decisions. You're not responsible for someone else's choices. Get support from trusted friends or family and consider professional help."

Be DIRECT and HELPFUL. Give them what they need to know.`;

    const response = await this.getConversationalResponse(prompt);
    
    const baseDirect = this.applyOutputSafeguards(
      response || "I understand the situation. Here's what you should do: [specific advice based on their situation]"
    );
    return {
      response: this.enforceDeterministicSignposting(baseDirect, userMessage),
      nextStage: 'support'
    };
  }
}

export const aiService = new AIAnalysisService();
