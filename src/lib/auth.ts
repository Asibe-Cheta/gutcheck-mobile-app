/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 */

import { supabase, db } from './supabase';
import { User } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  nickname?: string;
  age_range?: string;
  cultural_background?: string;
  communication_style?: string;
  subscription_status: string;
  subscription_plan: string;
  analysis_count: number;
  analysis_limit: number;
  onboarding_completed: boolean;
}

export interface SignUpData {
  email?: string;
  password?: string;
  username?: string;
  nickname?: string;
  age_range?: string;
  cultural_background?: string;
  communication_style?: string;
}

export interface SignInData {
  email?: string;
  password?: string;
  username?: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Initialize auth state
  async initialize(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const user = await this.getUserProfile(session.user.id);
        this.currentUser = user;
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return null;
    }
  }

  // Sign up with email and password
  async signUpWithEmail(data: SignUpData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!data.email || !data.password) {
        return { user: null, error: 'Email and password are required' };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (authData.user) {
        // Create user profile
        const userProfile = await db.createUser({
          id: authData.user.id,
          email: data.email,
          username: data.username,
          nickname: data.nickname,
          age_range: data.age_range,
          cultural_background: data.cultural_background,
          communication_style: data.communication_style,
        });

        this.currentUser = userProfile;
        return { user: userProfile, error: null };
      }

      return { user: null, error: 'Failed to create user' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Sign in with email and password
  async signInWithEmail(data: SignInData): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!data.email || !data.password) {
        return { user: null, error: 'Email and password are required' };
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (authData.user) {
        const user = await this.getUserProfile(authData.user.id);
        this.currentUser = user;
        return { user, error: null };
      }

      return { user: null, error: 'Failed to sign in' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'gutcheck://auth/callback',
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // Note: OAuth flow will redirect, so we'll handle the result in the callback
      return { user: null, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Sign in with username only (anonymous)
  async signInWithUsername(username: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!username.trim()) {
        return { user: null, error: 'Username is required' };
      }

      // Create anonymous user
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) {
        return { user: null, error: authError.message };
      }

      if (authData.user) {
        // Create user profile with username
        const userProfile = await db.createUser({
          id: authData.user.id,
          email: `anonymous-${Date.now()}@gutcheck.app`,
          username: username.trim(),
        });

        this.currentUser = userProfile;
        return { user: userProfile, error: null };
      }

      return { user: null, error: 'Failed to create anonymous user' };
    } catch (error) {
      console.error('Username sign in error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Handle OAuth callback
  async handleOAuthCallback(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user profile exists
        let user = await this.getUserProfile(session.user.id);
        
        if (!user) {
          // Create user profile for OAuth user
          user = await db.createUser({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata?.username,
            nickname: session.user.user_metadata?.nickname,
          });
        }

        this.currentUser = user;
        return { user, error: null };
      }

      return { user: null, error: 'No session found' };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
      }

      this.currentUser = null;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  // Update user profile
  async updateProfile(updates: Partial<AuthUser>): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      if (!this.currentUser) {
        return { user: null, error: 'No user logged in' };
      }

      const updatedUser = await db.updateUser(this.currentUser.id, updates);
      this.currentUser = updatedUser;
      
      return { user: updatedUser, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  }

  // Get user profile from database
  private async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const user = await db.getUser(userId);
      return user;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getUserProfile(session.user.id);
        this.currentUser = user;
        callback(user);
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }

  // Check if user has reached analysis limit
  async checkAnalysisLimit(): Promise<{ canAnalyze: boolean; remaining: number }> {
    try {
      if (!this.currentUser) {
        return { canAnalyze: false, remaining: 0 };
      }

      const analysisCount = await db.getUserAnalysisCount(this.currentUser.id);
      const remaining = this.currentUser.analysis_limit - analysisCount;
      
      return {
        canAnalyze: remaining > 0,
        remaining: Math.max(0, remaining),
      };
    } catch (error) {
      console.error('Check analysis limit error:', error);
      return { canAnalyze: false, remaining: 0 };
    }
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{ status: string; plan: string; isActive: boolean }> {
    try {
      if (!this.currentUser) {
        return { status: 'unpaid', plan: 'free', isActive: false };
      }

      const subscription = await db.getSubscription(this.currentUser.id);
      
      if (subscription) {
        return {
          status: subscription.status,
          plan: subscription.plan,
          isActive: subscription.status === 'active',
        };
      }

      return {
        status: this.currentUser.subscription_status,
        plan: this.currentUser.subscription_plan,
        isActive: this.currentUser.subscription_status === 'active',
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      return { status: 'unpaid', plan: 'free', isActive: false };
    }
  }
}

export const authService = new AuthService();
