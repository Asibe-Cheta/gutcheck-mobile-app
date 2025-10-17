/**
 * Authentication Store
 * Manages user authentication state using Zustand
 */

import { create } from 'zustand';
import { authService, AuthUser } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (data: { email: string; password: string; username?: string; nickname?: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithUsername: (username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>;
  initialize: () => Promise<void>;
  checkAnalysisLimit: () => Promise<{ canAnalyze: boolean; remaining: number }>;
  getSubscriptionStatus: () => Promise<{ status: string; plan: string; isActive: boolean }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signInWithEmail: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const { user, error } = await authService.signInWithEmail({ email, password });

      if (error) {
        set({ isLoading: false });
        return { success: false, error };
      }

      if (user) {
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false 
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signUpWithEmail: async (data) => {
    try {
      set({ isLoading: true });
      
      const { user, error } = await authService.signUpWithEmail(data);

      if (error) {
        set({ isLoading: false });
        return { success: false, error };
      }

      if (user) {
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false 
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to create account' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true });
      
      const { user, error } = await authService.signInWithGoogle();

      if (error) {
        set({ isLoading: false });
        return { success: false, error };
      }

      // OAuth flow will redirect, so we'll handle the result in the callback
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signInWithUsername: async (username: string) => {
    try {
      set({ isLoading: true });
      
      const { user, error } = await authService.signInWithUsername(username);

      if (error) {
        set({ isLoading: false });
        return { success: false, error };
      }

      if (user) {
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false 
        });
        return { success: true };
      }

      set({ isLoading: false });
      return { success: false, error: 'Failed to sign in' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  signOut: async () => {
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        return { success: false, error };
      }

      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user, error } = await authService.updateProfile(updates);

      if (error) {
        return { success: false, error };
      }

      if (user) {
        set({ user });
        return { success: true };
      }

      return { success: false, error: 'Failed to update profile' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  initialize: async () => {
    try {
      set({ isLoading: true });
      
      const user = await authService.initialize();
      
      if (user) {
        set({ 
          user, 
          isAuthenticated: true,
          isLoading: false 
        });
      } else {
        set({ 
          user: null, 
          isAuthenticated: false,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false 
      });
    }
  },

  checkAnalysisLimit: async () => {
    try {
      return await authService.checkAnalysisLimit();
    } catch (error) {
      console.error('Check analysis limit error:', error);
      return { canAnalyze: false, remaining: 0 };
    }
  },

  getSubscriptionStatus: async () => {
    try {
      return await authService.getSubscriptionStatus();
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { status: 'unpaid', plan: 'free', isActive: false };
    }
  },
}));
