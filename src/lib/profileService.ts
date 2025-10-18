/**
 * Profile Service
 * Handles user profile data operations with Supabase
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileData {
  id?: string;
  username: string;
  age: number;
  region: string;
  avatar_url?: string;
  user_id?: string;
  struggles?: string;
  goals?: string;
}

class ProfileService {
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
      const userId = await this.getAnonymousUserId();
      
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
      const userId = await this.getAnonymousUserId();
      
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
          age: data.age.toString(),
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
            age: parseInt(parsed.age),
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
