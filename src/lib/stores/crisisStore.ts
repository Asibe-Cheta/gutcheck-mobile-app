/**
 * Crisis Store
 * Manages crisis detection state and operations using Zustand
 */

import { create } from 'zustand';
import { crisisService, CrisisReport, CrisisResources } from '@/lib/crisis';
import { db } from '@/lib/supabase';

interface CrisisState {
  crisisReports: CrisisReport[];
  resources: CrisisResources;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCrisisReports: (userId: string) => Promise<void>;
  loadResources: () => void;
  detectCrisis: (userId: string, analysisId: string, patterns: any[], riskLevel: string, content: string) => Promise<{ detected: boolean; severity?: string; report?: CrisisReport }>;
  resolveCrisis: (crisisId: string) => Promise<{ success: boolean; error?: string }>;
  getCrisisStats: (userId: string) => Promise<{
    totalReports: number;
    resolvedReports: number;
    activeReports: number;
    severityBreakdown: Record<string, number>;
  }>;
  clearError: () => void;
  reset: () => void;
}

export const useCrisisStore = create<CrisisState>((set, get) => ({
  crisisReports: [],
  resources: {
    emergency: [],
    helplines: [],
    support: [],
    selfHelp: [],
  },
  isLoading: false,
  error: null,

  loadCrisisReports: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // This would typically load from database
      // For now, we'll use the crisis service
      const reports = await crisisService.checkFollowUp(userId);
      
      set({
        crisisReports: reports,
        isLoading: false,
      });
    } catch (error) {
      console.error('Load crisis reports error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load crisis reports',
      });
    }
  },

  loadResources: () => {
    try {
      const resources = crisisService.getAllResources();
      set({ resources });
    } catch (error) {
      console.error('Load resources error:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load resources',
      });
    }
  },

  detectCrisis: async (userId: string, analysisId: string, patterns: any[], riskLevel: string, content: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const result = await crisisService.detectCrisis(userId, analysisId, patterns, riskLevel, content);
      
      if (result.detected && result.report) {
        // Add to crisis reports
        set(state => ({
          crisisReports: [...state.crisisReports, result.report!],
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
      
      return result;
    } catch (error) {
      console.error('Detect crisis error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to detect crisis',
      });
      return { detected: false };
    }
  },

  resolveCrisis: async (crisisId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { success, error } = await crisisService.resolveCrisis(crisisId);
      
      if (error) {
        set({ isLoading: false, error });
        return { success: false, error };
      }

      if (success) {
        // Update crisis reports
        set(state => ({
          crisisReports: state.crisisReports.map(report => 
            report.id === crisisId 
              ? { ...report, resolved_at: new Date().toISOString() }
              : report
          ),
          isLoading: false,
        }));
      }
      
      set({ isLoading: false });
      return { success };
    } catch (error) {
      console.error('Resolve crisis error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resolve crisis',
      });
      return { success: false, error: 'Failed to resolve crisis' };
    }
  },

  getCrisisStats: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const stats = await crisisService.getCrisisStats(userId);
      
      set({ isLoading: false });
      return stats;
    } catch (error) {
      console.error('Get crisis stats error:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get crisis stats',
      });
      return {
        totalReports: 0,
        resolvedReports: 0,
        activeReports: 0,
        severityBreakdown: {},
      };
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      crisisReports: [],
      resources: {
        emergency: [],
        helplines: [],
        support: [],
        selfHelp: [],
      },
      isLoading: false,
      error: null,
    });
  },
}));
