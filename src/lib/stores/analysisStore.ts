/**
 * Analysis Store
 * Manages analysis state and operations using Zustand
 */

import { create } from 'zustand';
import { aiService, AIAnalysisResult, ConversationState, ConversationResponse } from '@/lib/ai';
import { db } from '@/lib/supabase';
import { Analysis, Pattern } from '@/types';

interface AnalysisState {
  currentAnalysis: Analysis | null;
  analyses: Analysis[];
  patterns: Pattern[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startAnalysis: (content: string, userId: string | null) => Promise<{ success: boolean; error?: string }>;
  getAnalyses: (userId: string | null, limit?: number) => Promise<void>;
  getPatterns: (analysisId: string) => Promise<void>;
  getAnalysisTrends: (userId: string | null) => Promise<{
    totalAnalyses: number;
    patternCounts: Record<string, number>;
    riskTrend: 'improving' | 'stable' | 'worsening';
    recommendations: string[];
  }>;
  
  // Humanistic Conversation Actions
  handleConversation: (
    userMessage: string,
    conversationState: ConversationState,
    conversationHistory: string[],
    hasImage?: boolean,
    imageData?: string
  ) => Promise<ConversationResponse>;
  
  clearError: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  analyses: [],
  patterns: [],
  isLoading: false,
  error: null,

  startAnalysis: async (content: string, userId: string | null) => {
    try {
      set({ isLoading: true, error: null });

      const result: AIAnalysisResult = await aiService.analyzeInteraction(content, userId);

      set({
        currentAnalysis: result.analysis,
        patterns: result.patterns,
        isLoading: false,
      });

      // Check for crisis situation
      if (result.crisis_detected) {
        // TODO: Show crisis alert to user
        console.warn('Crisis detected:', result.crisis_severity);
      }

      return { success: true };
    } catch (error) {
      console.error('Analysis error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      });
      return { success: false, error: 'Analysis failed' };
    }
  },

  getAnalyses: async (userId: string | null, limit = 20) => {
    try {
      set({ isLoading: true, error: null });

      const analyses = await db.getAnalyses(userId, limit);
      
      set({
        analyses,
        isLoading: false,
      });
    } catch (error) {
      console.error('Get analyses error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load analyses',
      });
    }
  },

  getPatterns: async (analysisId: string) => {
    try {
      set({ isLoading: true, error: null });

      const patterns = await db.getPatterns(analysisId);
      
      set({
        patterns,
        isLoading: false,
      });
    } catch (error) {
      console.error('Get patterns error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load patterns',
      });
    }
  },

  getAnalysisTrends: async (userId: string | null) => {
    try {
      set({ isLoading: true, error: null });

      const trends = await aiService.analyzePatternTrends(userId);
      
      set({ isLoading: false });
      return trends;
    } catch (error) {
      console.error('Get analysis trends error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load trends',
      });
      return {
        totalAnalyses: 0,
        patternCounts: {},
        riskTrend: 'stable' as const,
        recommendations: [],
      };
    }
  },

  handleConversation: async (
    userMessage: string,
    conversationState: ConversationState,
    conversationHistory: string[],
    hasImage: boolean = false,
    imageData?: string
  ) => {
    try {
      set({ isLoading: true, error: null });

      console.log('AnalysisStore handleConversation called with:', {
        userMessage: userMessage.substring(0, 50) + '...',
        hasImage,
        imageData: imageData ? imageData.substring(0, 50) + '...' : 'none',
        imageDataType: typeof imageData
      });

      const response = await aiService.handleConversation(
        userMessage,
        conversationState,
        conversationHistory,
        hasImage,
        imageData
      );

      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('Conversation error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Conversation failed',
      });
      
      // Return fallback response
      return {
        response: "I'm having trouble processing that right now. Can you try again?",
        nextStage: conversationState.stage
      };
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      currentAnalysis: null,
      analyses: [],
      patterns: [],
      isLoading: false,
      error: null,
    });
  },
}));
