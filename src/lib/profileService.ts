/**
 * Profile Service
 * Handles user profile data operations with Supabase
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileData {
  id?: string;
  username?: string;
  age?: number;
  region?: string;
  avatar_url?: string;
  user_id?: string;
  struggles?: string;
  goals?: string;
  age_range?: string;
  goal?: string;
  user_type?: 'anonymous' | 'username' | 'email';
  created_at?: string;
  updated_at?: string;
}

class ProfileService {
  /**
   * Create anonymous profile
   */
  async createAnonymousProfile(anonymousId: string): Promise<void> {
    try {
      // First check if the profiles table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log('Profiles table does not exist, skipping database profile creation');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: anonymousId,
          user_type: 'anonymous',
          username: `Anonymous_${anonymousId.slice(-6)}`, // Generate a unique anonymous username
          age: null,
          region: null,
          avatar_url: null,
          struggles: null,
          goals: null,
          age_range: null,
          goal: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating anonymous profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating anonymous profile:', error);
      throw error;
    }
  }

  /**
   * Create username-only profile
   */
  async createUsernameProfile(userId: string, username: string): Promise<void> {
    try {
      // First check if the profiles table exists by trying to select from it
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST116') {
        console.log('Profiles table does not exist, skipping database profile creation');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          user_type: 'username',
          username: username,
          age: null,
          region: null,
          avatar_url: null,
          struggles: null,
          goals: null,
          age_range: null,
          goal: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating username profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error creating username profile:', error);
      throw error;
    }
  }

  /**
   * Get or create anonymous user ID
   */
  private async getAnonymousUserId(): Promise<string> {
    try {
      let userId = await AsyncStorage.getItem('anonymous_user_id');
      
      if (!userId) {
        // Generate new anonymous user ID
        userId = `anonymous_user_${Date.now()}`;
        await AsyncStorage.setItem('anonymous_user_id', userId);
      }
      
      return userId;
    } catch (error) {
      console.error('Error getting anonymous user ID:', error);
      throw new Error('Failed to get user ID');
    }
  }

  /**
   * Save profile data to database
   */
  async saveProfile(profileData: Omit<ProfileData, 'id' | 'user_id'>): Promise<ProfileData> {
    try {
      // Get user ID from auth system (works for both anonymous and username users)
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        throw new Error('No user ID found. Please log in again.');
      }
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      let result;
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update({
            username: profileData.username,
            age: profileData.age,
            region: profileData.region,
            avatar_url: profileData.avatar_url,
            struggles: profileData.struggles,
            goals: profileData.goals,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: profileData.username,
            age: profileData.age,
            region: profileData.region,
            avatar_url: profileData.avatar_url,
            struggles: profileData.struggles,
            goals: profileData.goals
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      // Also save to local storage for offline access
      await AsyncStorage.setItem('user_profile', JSON.stringify({
        username: result.username,
        age: result.age.toString(),
        region: result.region,
        avatarUri: result.avatar_url,
        struggles: result.struggles,
        goals: result.goals
      }));

      return result;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw new Error('Failed to save profile data');
    }
  }

  /**
   * Get profile data from database
   */
  async getProfile(): Promise<ProfileData | null> {
    try {
      // Get user ID from storage (works for both anonymous and username users)
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        console.log('No user ID found in storage');
        return null;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        // Also save to local storage for offline access
        await AsyncStorage.setItem('user_profile', JSON.stringify({
          username: data.username,
          age: data.age ? data.age.toString() : '',
          region: data.region,
          avatarUri: data.avatar_url,
          struggles: data.struggles,
          goals: data.goals
        }));
      }

      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      // Fallback to local storage
      try {
        const localProfile = await AsyncStorage.getItem('user_profile');
        if (localProfile) {
          const parsed = JSON.parse(localProfile);
          return {
            username: parsed.username,
            age: parsed.age ? parseInt(parsed.age) : undefined,
            region: parsed.region,
            avatar_url: parsed.avatarUri,
            struggles: parsed.struggles,
            goals: parsed.goals
          };
        }
      } catch (localError) {
        console.error('Error getting local profile:', localError);
      }
      return null;
    }
  }

  /**
   * Update profile data
   */
  async updateProfile(updates: Partial<ProfileData>): Promise<void> {
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        throw new Error('No user ID found. Please log in again.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Also update local storage
      const currentProfile = await this.getProfile();
      if (currentProfile) {
        const updatedProfile = { ...currentProfile, ...updates };
        await AsyncStorage.setItem('user_profile', JSON.stringify({
          username: updatedProfile.username,
          age: updatedProfile.age ? updatedProfile.age.toString() : '',
          region: updatedProfile.region,
          avatarUri: updatedProfile.avatar_url,
          struggles: updatedProfile.struggles,
          goals: updatedProfile.goals
        }));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Delete profile data
   */
  async deleteProfile(): Promise<void> {
    try {
      const userId = await this.getAnonymousUserId();
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Also clear local storage
      await AsyncStorage.removeItem('user_profile');
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error('Failed to delete profile data');
    }
  }
}

export const profileService = new ProfileService();
