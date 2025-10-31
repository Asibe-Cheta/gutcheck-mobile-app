/**
 * Supabase Client Configuration
 * Handles authentication, database operations, and real-time subscriptions
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// SAFE: Get environment variables with comprehensive null checks
// This prevents crashes if Constants.expoConfig is undefined/null
function getEnvVar(key: string, defaultValue: string = ''): string {
  try {
    // First try process.env (works in development and EAS builds)
    if (process.env[key]) {
      return process.env[key] as string;
    }
    
    // Then try Constants.expoConfig.extra (EAS builds inject here)
    if (Constants?.expoConfig?.extra?.[key]) {
      return Constants.expoConfig.extra[key] as string;
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`[SUPABASE] Error reading env var ${key}:`, error);
    return defaultValue;
  }
}

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-key');

// Safe logging - handle potential undefined Constants
const extra = Constants?.expoConfig?.extra || {};
const appEnv = extra.EXPO_PUBLIC_APP_ENV || 'unknown';

console.log('[SUPABASE] Configuration Check:', {
  hasUrl: !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co',
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'placeholder-key',
  urlPreview: supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyPreview: supabaseAnonKey && supabaseAnonKey !== 'placeholder-key' ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING',
  isProduction: appEnv === 'production',
  appEnv: appEnv,
  allExtraKeys: Object.keys(extra),
  hasConstants: !!Constants,
  hasExpoConfig: !!Constants?.expoConfig,
  hasExtra: !!extra,
});

// SAFE: Create Supabase client with error handling
// Wrap in try-catch to prevent crash if createClient fails
let supabaseClient: any = null;

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  console.log('[SUPABASE] ✅ Client created successfully');
} catch (error) {
  console.error('[SUPABASE] ❌ Failed to create client:', error);
  // Create a minimal mock client to prevent crashes
  // The app will fail gracefully when trying to use it
  supabaseClient = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }),
      insert: () => Promise.reject(new Error('Supabase not configured')),
      update: () => Promise.reject(new Error('Supabase not configured')),
    }),
    auth: {
      signIn: () => Promise.reject(new Error('Supabase not configured')),
      signUp: () => Promise.reject(new Error('Supabase not configured')),
      signOut: () => Promise.reject(new Error('Supabase not configured')),
    },
  };
}

export const supabase = supabaseClient;

// Database helper functions
export const db = {
  // User operations
  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Analysis operations
  async createAnalysis(analysis: any) {
    const { data, error } = await supabase
      .from('analyses')
      .insert(analysis)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAnalyses(userId: string | null, limit = 20, offset = 0) {
    let query = supabase
      .from('analyses')
      .select('*');
    
    // If userId is provided, filter by it; otherwise get anonymous analyses
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  // Contact operations
  async createContact(contact: any) {
    const { data, error } = await supabase
      .from('contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getContacts(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('last_interaction', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Pattern operations
  async createPattern(pattern: any) {
    const { data, error } = await supabase
      .from('patterns')
      .insert(pattern)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // User operations
  async createUser(userData: {
    id: string;
    email: string;
    username?: string;
    nickname?: string;
    age_range?: string;
    cultural_background?: string;
    communication_style?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Analysis operations
  async updateAnalysis(analysisId: string, updates: any) {
    const { data, error } = await supabase
      .from('analyses')
      .update(updates)
      .eq('id', analysisId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPatterns(analysisId: string) {
    const { data, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('analysis_id', analysisId);
    
    if (error) throw error;
    return data;
  },

  // Subscription operations
  async createSubscription(subscriptionData: {
    user_id: string;
    stripe_subscription_id?: string;
    stripe_customer_id?: string;
    status: string;
    plan: string;
    price_id?: string;
  }) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSubscription(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Educational content
  async getEducationalContent(category?: string) {
    let query = supabase
      .from('educational_content')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Analytics
  async createUserSession(sessionData: {
    user_id: string;
    screen_views?: any[];
    interactions?: any[];
    device_info?: any;
    app_version?: string;
  }) {
    const { data, error } = await supabase
      .from('user_sessions')
      .insert([sessionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crisis detection
  async createCrisisReport(crisisData: {
    user_id: string | null;
    analysis_id: string;
    severity: string;
    patterns: string[];
    emergency_contacts_notified?: boolean;
    resources_provided?: string[];
  }) {
    const { data, error } = await supabase
      .from('crisis_reports')
      .insert([crisisData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Utility functions
  async getUserAnalysisCount(userId: string) {
    const { data, error } = await supabase
      .rpc('get_user_analysis_count', { user_uuid: userId });
    
    if (error) throw error;
    return data;
  },

  async getUserSubscriptionStatus(userId: string) {
    const { data, error } = await supabase
      .rpc('get_user_subscription_status', { user_uuid: userId });
    
    if (error) throw error;
    return data;
  },
};

// Real-time subscriptions
export const subscribeToAnalyses = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('analyses')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'analyses',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};

export const subscribeToContacts = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('contacts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
};
